import type { UIMessage } from 'ai'

export type ToolPhase = 'running' | 'done' | 'error'

export type ToolCallItem = {
  key: string
  toolName: string
  kind: 'playwright' | 'session' | 'skill' | 'other'
  phase: ToolPhase
  input: unknown
  output: unknown
  errorText?: string
  /** model's stated intent (assistant text right before the call) */
  intent?: string
  /** for kind "skill": where its instructions came from */
  skillSource?: 'local' | 'remote'
  skillSourceUrl?: string
}

export type ReasoningItem = {
  key: string
  kind: 'text' | 'reasoning'
  text: string
}

export type DerivedState = {
  reasoning: ReasoningItem[]
  actions: ToolCallItem[]
  toolCalls: ToolCallItem[]
  liveViewUrl: string | null
  sessionId: string | null
  activeSite: string | null
  toolCallCount: number
  navigations: number
}

const PLAYWRIGHT_TOOL = 'execute_playwright_code'
const SESSION_TOOL = 'manage_browsers'
const SKILL_TOOL = 'read_skill'

function classify(toolName: string): ToolCallItem['kind'] {
  if (toolName === PLAYWRIGHT_TOOL) return 'playwright'
  if (toolName === SESSION_TOOL) return 'session'
  if (toolName === SKILL_TOOL) return 'skill'
  return 'other'
}

function phaseFromState(state: string | undefined): ToolPhase {
  if (state === 'output-available') return 'done'
  if (state === 'output-error') return 'error'
  return 'running'
}

function stringify(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

/**
 * Kernel returns a browser result like:
 *   { base_url: "https://prod-jfk-hypeman-8.kernel.sh:8443/browser/kernel",
 *     browser_live_view_url: "https://….kernel.sh:8443/browser/live/<token>",
 *     cdp_ws_url: "wss://…" }
 * Only `browser_live_view_url` (the `/browser/live/<token>` surface) is
 * embeddable. `base_url` looks similar (same host + :8443) but is the API and
 * returns `{"code":"invalid_request","message":"Missing JWT token"}` in an
 * iframe — so we must pick the live field specifically, never just any :8443
 * URL. Tool results arrive JSON-escaped, so we unescape before matching.
 */
function extractLiveView(output: unknown): string | null {
  const s = stringify(output)
    .replace(/\\"/g, '"')
    .replace(/\\n/g, ' ')

  // 1) The explicitly labeled live-view field — the only reliable source.
  const labeled = s.match(
    /(?:browser_)?live[_-]?view[_-]?url["']?\s*[:=]\s*["']?(https?:\/\/[^\s"'\\)]+)/i,
  )
  if (labeled && isLiveViewUrl(labeled[1])) return withReadOnly(cleanUrl(labeled[1]))

  // 2) Fallback: a URL with the live-view *path* shape (never base_url / api).
  const urls = [...s.matchAll(/https?:\/\/[^\s"'\\)]+/gi)].map((m) => cleanUrl(m[0]))
  const live = urls.find(isLiveViewUrl)
  return live ? withReadOnly(live) : null
}

function isLiveViewUrl(raw: string): boolean {
  let url: URL
  try {
    url = new URL(cleanUrl(raw))
  } catch {
    return false
  }
  // Live view is served from `*.kernel.sh` / `*.onkernel.com`, never the API.
  if (!/(?:^|\.)(?:kernel\.sh|onkernel\.com)$/i.test(url.hostname)) return false
  if (/^api\./i.test(url.hostname)) return false
  // Require the live-view surface specifically: a `/…/live/…` path or a token
  // param. This excludes `base_url` (`/browser/kernel`) that returns a JWT error.
  return /\/live(\/|$)/i.test(url.pathname) || url.searchParams.has('token')
}

function withReadOnly(raw: string): string {
  try {
    const url = new URL(raw)
    // Disable visitor interaction — this is a read-only observation surface.
    url.searchParams.set('readOnly', 'true')
    return url.toString()
  } catch {
    return raw
  }
}

function cleanUrl(u: string): string {
  return u.replace(/[)\]},.'"]+$/, '')
}

function extractSessionId(output: unknown): string | null {
  const s = stringify(output)
  const labeled = s.match(/session_id["']?\s*[:=]\s*["']?([A-Za-z0-9._-]{6,})/i)
  if (labeled) return labeled[1]
  const idField = s.match(/"id"\s*:\s*"([A-Za-z0-9._-]{6,})"/)
  return idField ? idField[1] : null
}

function extractGotoUrl(input: unknown): string | null {
  const s = stringify(input)
  const matches = [...s.matchAll(/goto\(\s*["'`](https?:\/\/[^"'`]+)["'`]/gi)]
  if (matches.length > 0) return matches[matches.length - 1][1]
  return null
}

function extractResultUrl(output: unknown): string | null {
  const s = stringify(output)
  const m = s.match(/"url"\s*:\s*"(https?:\/\/[^"]+)"/i)
  return m ? m[1] : null
}

function hostOf(url: string): string {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}

/**
 * Turn the assistant message stream into the four feeds plus the live-view URL.
 * MCP tools are dynamic, so tool calls arrive as `dynamic-tool` parts.
 */
export function deriveFromMessages(messages: UIMessage[]): DerivedState {
  const reasoning: ReasoningItem[] = []
  const actions: ToolCallItem[] = []
  const toolCalls: ToolCallItem[] = []

  let liveViewUrl: string | null = null
  let sessionId: string | null = null
  let activeSite: string | null = null
  let navigations = 0

  for (const message of messages) {
    if (message.role !== 'assistant') continue

    // Track the most recent assistant text so a following tool call can use it
    // as its human-readable "intent".
    let lastText: string | undefined

    const parts = (message.parts ?? []) as Array<Record<string, unknown>>
    parts.forEach((part, index) => {
      const key = `${message.id}:${index}`
      const type = part.type as string

      if (type === 'text') {
        const text = (part.text as string) ?? ''
        if (text.trim()) {
          lastText = text.trim()
          reasoning.push({ key, kind: 'text', text: text.trim() })
        }
        return
      }

      if (type === 'reasoning') {
        const text = (part.text as string) ?? ''
        if (text.trim()) reasoning.push({ key, kind: 'reasoning', text: text.trim() })
        return
      }

      // Kernel's MCP tools arrive as `dynamic-tool` (input/output types
      // unknown to the SDK). Statically-declared tools like `read_skill`
      // arrive as `tool-<name>` instead, with the name embedded in the type.
      const isStaticTool = type.startsWith('tool-')
      if (type === 'dynamic-tool' || isStaticTool) {
        const toolName = isStaticTool ? type.slice('tool-'.length) : ((part.toolName as string) ?? 'tool')
        const state = part.state as string | undefined
        const input = part.input
        const output = part.output
        const errorText = part.errorText as string | undefined
        const kind = classify(toolName)
        const skillOutput =
          kind === 'skill' ? (output as { source?: string; sourceUrl?: string } | undefined) : undefined
        const item: ToolCallItem = {
          key,
          toolName,
          kind,
          phase: phaseFromState(state),
          input,
          output,
          errorText,
          intent: lastText,
          skillSource: skillOutput?.source as 'local' | 'remote' | undefined,
          skillSourceUrl: skillOutput?.sourceUrl,
        }
        toolCalls.push(item)
        actions.push(item)

        // The live-view URL can surface from ANY Kernel tool result, but the
        // session's live view is stable for its lifetime — so lock it in on the
        // first valid hit and never let a later result overwrite it.
        if (output) {
          if (!liveViewUrl) liveViewUrl = extractLiveView(output)
          sessionId = extractSessionId(output) ?? sessionId
        }
        if (item.kind === 'playwright') {
          const goto = extractGotoUrl(input)
          if (goto) {
            activeSite = goto
            navigations += 1
          }
          const resultUrl = extractResultUrl(output)
          if (resultUrl) activeSite = resultUrl
        }
      }
    })
  }

  return {
    reasoning,
    actions,
    toolCalls,
    liveViewUrl,
    sessionId,
    activeSite: activeSite ? hostOf(activeSite) : null,
    toolCallCount: toolCalls.length,
    navigations,
  }
}
