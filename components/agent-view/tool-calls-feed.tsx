'use client'

import { Terminal, Loader2, Check, TriangleAlert } from 'lucide-react'
import { FeedShell } from './feed-shell'
import type { ToolCallItem } from './derive'

function truncate(s: string, n = 1600): string {
  return s.length > n ? s.slice(0, n) + '\n… (truncated)' : s
}

function getCode(input: unknown): string | null {
  const code = (input as { code?: unknown } | null | undefined)?.code
  return typeof code === 'string' ? code : null
}

function formatValue(value: unknown): string {
  if (value == null) return ''
  // MCP CallToolResult: { content: [{ type: 'text', text }] }
  const content = (value as { content?: Array<{ type?: string; text?: string }> })?.content
  if (Array.isArray(content)) {
    const text = content
      .map((c) => (typeof c?.text === 'string' ? c.text : ''))
      .filter(Boolean)
      .join('\n')
    if (text) return truncate(text)
  }
  if (typeof value === 'string') return truncate(value)
  try {
    return truncate(JSON.stringify(value, null, 2))
  } catch {
    return truncate(String(value))
  }
}

function TagLine({ item }: { item: ToolCallItem }) {
  const isPlaywright = item.kind === 'playwright'
  const isSkill = item.kind === 'skill'
  const label = isPlaywright
    ? 'Playwright execution'
    : isSkill
      ? 'Skill lookup'
      : 'Kernel session control'
  return (
    <div className="flex items-center gap-2">
      <span
        className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide ${
          isPlaywright
            ? 'bg-primary/15 text-primary'
            : isSkill
              ? 'bg-accent text-accent-foreground'
              : 'bg-secondary text-secondary-foreground'
        }`}
      >
        {label}
      </span>
      <span className="truncate font-mono text-[11px] text-muted-foreground">
        {item.toolName}
      </span>
      <span className="ml-auto shrink-0">
        {item.phase === 'running' ? (
          <Loader2 className="size-3.5 animate-spin text-primary" />
        ) : item.phase === 'error' ? (
          <TriangleAlert className="size-3.5 text-destructive" />
        ) : (
          <Check className="size-3.5 text-primary" />
        )}
      </span>
    </div>
  )
}

export function ToolCallsFeed({
  items,
  className,
}: {
  items: ToolCallItem[]
  className?: string
}) {
  return (
    <FeedShell
      title="Kernel MCP Tool Calls"
      icon={<Terminal className="size-3.5" />}
      count={items.length}
      isEmpty={items.length === 0}
      autoScrollKey={items.length}
      empty="Every raw Kernel MCP call and response shows up here."
      className={className}
    >
      <ol className="flex flex-col gap-2.5">
        {items.map((item) => {
          const code = getCode(item.input)
          const out = formatValue(item.output)
          const argsNoCode =
            item.kind === 'playwright'
              ? null
              : formatValue(item.input)
          return (
            <li
              key={item.key}
              className="overflow-hidden rounded-lg border border-border/70 bg-[#0c0e08]"
            >
              <div className="border-b border-border/60 px-2.5 py-1.5">
                <TagLine item={item} />
              </div>
              <div className="flex flex-col gap-2 p-2.5">
                {code && (
                  <div>
                    <p className="mb-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground/70">
                      request · code
                    </p>
                    <pre className="scrollbar-thin max-h-40 overflow-auto rounded bg-black/50 p-2 font-mono text-[11px] leading-relaxed text-foreground/85">
                      {code}
                    </pre>
                  </div>
                )}
                {argsNoCode && (
                  <div>
                    <p className="mb-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground/70">
                      request · args
                    </p>
                    <pre className="scrollbar-thin max-h-28 overflow-auto rounded bg-black/50 p-2 font-mono text-[11px] leading-relaxed text-foreground/85">
                      {argsNoCode}
                    </pre>
                  </div>
                )}
                {item.errorText && (
                  <div>
                    <p className="mb-1 font-mono text-[9px] uppercase tracking-widest text-destructive/80">
                      error
                    </p>
                    <pre className="scrollbar-thin max-h-32 overflow-auto rounded bg-destructive/10 p-2 font-mono text-[11px] leading-relaxed text-destructive">
                      {item.errorText}
                    </pre>
                  </div>
                )}
                {out && item.phase !== 'running' && (
                  <div>
                    <p className="mb-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground/70">
                      response
                    </p>
                    <pre className="scrollbar-thin max-h-40 overflow-auto rounded bg-black/50 p-2 font-mono text-[11px] leading-relaxed text-primary/80">
                      {out}
                    </pre>
                  </div>
                )}
                {item.phase === 'running' && (
                  <p className="font-mono text-[11px] text-muted-foreground">
                    awaiting response…
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </FeedShell>
  )
}
