'use client'

import { Brain } from 'lucide-react'
import { FeedShell } from './feed-shell'
import type { ReasoningItem } from './derive'

export function ReasoningFeed({
  items,
  className,
}: {
  items: ReasoningItem[]
  className?: string
}) {
  return (
    <FeedShell
      title="Agent Reasoning"
      icon={<Brain className="size-3.5" />}
      isEmpty={items.length === 0}
      autoScrollKey={items.length}
      empty="The agent's thinking will stream here."
      className={className}
    >
      <ol className="flex flex-col gap-2.5">
        {items.map((item) => (
          <li key={item.key} className="flex gap-2.5">
            <span
              className={`mt-1.5 size-1.5 shrink-0 rounded-full ${
                item.kind === 'reasoning' ? 'bg-muted-foreground/50' : 'bg-primary'
              }`}
            />
            <p
              className={`text-pretty text-[13px] leading-relaxed ${
                item.kind === 'reasoning'
                  ? 'italic text-muted-foreground'
                  : 'text-foreground/90'
              }`}
            >
              {item.text}
            </p>
          </li>
        ))}
      </ol>
    </FeedShell>
  )
}
