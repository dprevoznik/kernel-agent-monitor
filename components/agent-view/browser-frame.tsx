'use client'

import { Loader2 } from 'lucide-react'
import { KernelMark } from '@/components/kernel-logo'

export type BrowserStatus = 'idle' | 'starting' | 'live'

export function BrowserFrame({
  liveViewUrl,
  status,
  sessionId,
  activeSite,
}: {
  liveViewUrl: string | null
  status: BrowserStatus
  sessionId: string | null
  activeSite: string | null
}) {
  const src = liveViewUrl
    ? `${liveViewUrl}${liveViewUrl.includes('?') ? '&' : '?'}readOnly=true`
    : null

  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-[#0c0e08] shadow-2xl shadow-black/40">
      {/* monitor chrome */}
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-card/80 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-destructive/70" />
          <span className="size-2.5 rounded-full bg-primary/40" />
          <span className="size-2.5 rounded-full bg-primary/70" />
        </div>
        <span className="ml-1 truncate font-mono text-[11px] text-muted-foreground">
          {activeSite ?? 'kernel · cloud chromium'}
        </span>
        <div className="ml-auto flex items-center gap-2">
          {sessionId && (
            <span className="hidden truncate font-mono text-[10px] text-muted-foreground/60 sm:inline">
              {sessionId.slice(0, 12)}
            </span>
          )}
          <StatusPill status={status} />
        </div>
      </div>

      {/* screen */}
      <div className="relative min-h-0 flex-1 bg-grid">
        {src ? (
          <iframe
            key={src}
            src={src}
            title="Live Kernel browser session"
            className="h-full w-full bg-white"
            referrerPolicy="no-referrer"
            allow="clipboard-read; clipboard-write"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
            <KernelMark className="h-12 w-auto opacity-60" />
            {status === 'starting' ? (
              <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin text-primary" />
                spinning up a cloud browser…
              </div>
            ) : (
              <p className="max-w-xs text-pretty font-mono text-xs leading-relaxed text-muted-foreground/70">
                no active session — enter a goal below and the agent will open a
                browser here.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: BrowserStatus }) {
  if (status === 'live') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide text-primary">
        <span className="live-dot size-1.5 rounded-full bg-primary" />
        live
      </span>
    )
  }
  if (status === 'starting') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        <Loader2 className="size-3 animate-spin" />
        booting
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
      <span className="size-1.5 rounded-full bg-muted-foreground/50" />
      idle
    </span>
  )
}
