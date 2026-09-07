'use client'

import { ListChecks, Loader2, Check, TriangleAlert, Globe, Code2, BookOpen, Radio } from 'lucide-react'
import { FeedShell } from './feed-shell'
import type { ToolCallItem } from './derive'

function hostOf(url: string): string {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}

function actionLabel(item: ToolCallItem): string {
  if (item.kind === 'skill') {
    const name = (item.input as { name?: string } | undefined)?.name ?? 'skill'
    if (item.skillSource === 'remote' && item.skillSourceUrl) {
      return `Fetched skill "${name}" live from ${hostOf(item.skillSourceUrl)}`
    }
    return `Loaded skill: ${name}`
  }
  if (item.intent) return item.intent
  if (item.kind === 'playwright') return 'Ran a Playwright step'
  if (item.kind === 'session') {
    const action = (item.input as { action?: string } | undefined)?.action
    return action === 'create'
      ? 'Started a browser session'
      : action === 'delete'
        ? 'Closed the browser session'
        : 'Managed the browser session'
  }
  return item.toolName
}

function PhaseIcon({ phase }: { phase: ToolCallItem['phase'] }) {
  if (phase === 'running') return <Loader2 className="size-3.5 animate-spin text-primary" />
  if (phase === 'error') return <TriangleAlert className="size-3.5 text-destructive" />
  return <Check className="size-3.5 text-primary" />
}

export function ActionsFeed({
  items,
  className,
}: {
  items: ToolCallItem[]
  className?: string
}) {
  return (
    <FeedShell
      title="Actions Taken"
      icon={<ListChecks className="size-3.5" />}
      count={items.length}
      isEmpty={items.length === 0}
      autoScrollKey={items.length}
      empty="Each browser action will appear here as it happens."
      className={className}
    >
      <ol className="flex flex-col gap-2">
        {items.map((item, i) => (
          <li
            key={item.key}
            className={`flex items-start gap-2.5 rounded-lg border px-2.5 py-2 ${
              item.kind === 'skill' && item.skillSource === 'remote'
                ? 'border-primary/40 bg-primary/[0.07]'
                : 'border-border/70 bg-secondary/40'
            }`}
          >
            <span className="mt-0.5 shrink-0">
              <PhaseIcon phase={item.phase} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-pretty text-[13px] leading-snug text-foreground/90">
                {actionLabel(item)}
              </p>
              <p className="mt-0.5 flex items-center gap-1 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                {item.kind === 'playwright' ? (
                  <Code2 className="size-3" />
                ) : item.kind === 'skill' ? (
                  item.skillSource === 'remote' ? (
                    <Radio className="size-3 text-primary" />
                  ) : (
                    <BookOpen className="size-3" />
                  )
                ) : (
                  <Globe className="size-3" />
                )}
                {item.kind === 'playwright'
                  ? 'playwright'
                  : item.kind === 'session'
                    ? 'session'
                    : item.kind === 'skill'
                      ? item.skillSource === 'remote'
                        ? 'remote skill'
                        : 'skill'
                      : item.toolName}
                <span className="text-muted-foreground/50">· #{i + 1}</span>
              </p>
            </div>
          </li>
        ))}
      </ol>
    </FeedShell>
  )
}
