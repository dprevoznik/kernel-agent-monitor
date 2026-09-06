import type { UIMessage } from 'ai'

export type ToolPhase = 'running' | 'done' | 'error'

export type ToolCallItem = {
  key: string
  toolName: string
  kind: 'playwright' | 'session' | 'other'
  phase: ToolPhase
  input: unknown
  output: unknown
  errorText?: string
  /** model's stated intent (assistant text right before the call) */
  intent?: string
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

function classify(toolName: string): ToolCallItem['kind'] {
  if (toolName === PLAYWRIGHT_TOOL) return 'playwright'
  if (toolName === SESSION_TOOL) return 'session'
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

function extractLiveView(output: unknown): string | null {
  const s = stringify(output)
  const labeled = s.match(
    /browser_live_view_url["']?\s*[:=]\s*["']?(https?:\/\/[^\s"'\\)]+)/i,
  )
  if (labeled) return labeled[1]
  const anyKernel = s.match(/(https?:\/\/[^\s"'\\)]*onkernel[^\s"'\\)]*)/i)
  return anyKernel ? anyKernel[1] : null
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

      if (type === 'dynamic-tool') {
        const toolName = (part.toolName as string) ?? 'tool'
        const state = part.state as string | undefined
        const input = part.input
        const output = part.output
        const errorText = part.errorText as string | undefined
        const item: ToolCallItem = {
          key,
          toolName,
          kind: classify(toolName),
          phase: phaseFromState(state),
          input,
          output,
          errorText,
          intent: lastText,
        }
        toolCalls.push(item)
        actions.push(item)

        if (item.kind === 'session' && output) {
          liveViewUrl = extractLiveView(output) ?? liveViewUrl
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
