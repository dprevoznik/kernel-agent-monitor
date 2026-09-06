'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function FeedShell({
  title,
  icon,
  count,
  children,
  empty,
  isEmpty,
  autoScrollKey,
  className,
  bodyClassName,
}: {
  title: string
  icon: ReactNode
  count?: number
  children: ReactNode
  empty?: ReactNode
  isEmpty?: boolean
  /** changes when new content arrives, to trigger autoscroll to bottom */
  autoScrollKey?: number
  className?: string
  bodyClassName?: string
}) {
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    // Only stick to bottom if the user is already near it.
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120
    if (nearBottom) el.scrollTop = el.scrollHeight
  }, [autoScrollKey])

  return (
    <section
      className={cn(
        'flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card/70',
        className,
      )}
    >
      <header className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2">
        <span className="text-primary">{icon}</span>
        <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {title}
        </h2>
        {typeof count === 'number' && count > 0 && (
          <span className="ml-auto rounded-full bg-primary/15 px-1.5 py-0.5 font-mono text-[10px] font-medium text-primary">
            {count}
          </span>
        )}
      </header>
      <div
        ref={bodyRef}
        className={cn('scrollbar-thin min-h-0 flex-1 overflow-y-auto p-3', bodyClassName)}
      >
        {isEmpty ? (
          <div className="flex h-full min-h-24 items-center justify-center px-4 text-center font-mono text-xs text-muted-foreground/70">
            {empty}
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  )
}
