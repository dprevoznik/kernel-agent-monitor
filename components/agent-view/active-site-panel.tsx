'use client'

import { Globe, Activity } from 'lucide-react'
import { FeedShell } from './feed-shell'

export function ActiveSitePanel({
  activeSite,
  navigations,
  toolCallCount,
  className,
}: {
  activeSite: string | null
  navigations: number
  toolCallCount: number
  className?: string
}) {
  return (
    <FeedShell
      title="Active Site"
      icon={<Globe className="size-3.5" />}
      className={className}
      bodyClassName="p-0"
    >
      <div className="flex h-full flex-col">
        <div className="flex flex-col gap-1 border-b border-border/60 px-3 py-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70">
            current
          </span>
          {activeSite ? (
            <span className="flex items-center gap-2 truncate font-mono text-sm text-primary">
              <span className="live-dot size-1.5 shrink-0 rounded-full bg-primary" />
              {activeSite}
            </span>
          ) : (
            <span className="font-mono text-sm text-muted-foreground/60">—</span>
          )}
        </div>
        <div className="grid grid-cols-2 divide-x divide-border/60">
          <Stat label="navigations" value={navigations} icon={<Activity className="size-3" />} />
          <Stat label="tool calls" value={toolCallCount} />
        </div>
        <p className="mt-auto px-3 py-2 font-mono text-[10px] leading-relaxed text-muted-foreground/50">
          derived from the agent&apos;s Playwright navigations — a best-effort read
          of where the browser is.
        </p>
      </div>
    </FeedShell>
  )
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string
  value: number
  icon?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-0.5 px-3 py-3">
      <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70">
        {icon}
        {label}
      </span>
      <span className="font-mono text-lg text-foreground">{value}</span>
    </div>
  )
}
