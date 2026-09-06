'use client'

import { useState, type KeyboardEvent } from 'react'
import { Play, Square, RotateCcw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

const SUGGESTIONS = [
  'Find the top Hacker News story and summarize the discussion',
  'Search Wikipedia for the Voyager 1 probe and report its current distance',
  'Go to weather.gov and get the forecast for San Francisco',
]

export function GoalBar({
  onSubmit,
  onStop,
  onNewSession,
  status,
  hasSession,
}: {
  onSubmit: (goal: string) => void
  onStop: () => void
  onNewSession: () => void
  status: 'ready' | 'submitted' | 'streaming' | 'error'
  hasSession: boolean
}) {
  const [value, setValue] = useState('')
  const busy = status === 'submitted' || status === 'streaming'

  function submit() {
    const goal = value.trim()
    if (!goal || busy) return
    onSubmit(goal)
    setValue('')
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    // Respect CJK IME composition before submitting on Enter.
    if (
      e.key === 'Enter' &&
      !e.shiftKey &&
      !e.nativeEvent.isComposing &&
      e.keyCode !== 229
    ) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Give the agent a goal for the browser…"
            aria-label="Agent goal"
            className="h-11 w-full rounded-lg border border-border bg-card/70 px-3 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-ring focus:ring-3 focus:ring-ring/30"
          />
        </div>

        {busy ? (
          <Button
            variant="outline"
            className="h-11 shrink-0 px-3"
            onClick={onStop}
            aria-label="Stop the agent"
          >
            <Square className="size-4" />
            <span className="hidden sm:inline">Stop</span>
          </Button>
        ) : (
          <Button
            className="h-11 shrink-0 px-4"
            onClick={submit}
            disabled={!value.trim()}
            aria-label="Start the agent"
          >
            <Play className="size-4" />
            <span className="hidden sm:inline">Start</span>
          </Button>
        )}

        {hasSession && (
          <Button
            variant="ghost"
            className="h-11 shrink-0 px-3 text-muted-foreground"
            onClick={onNewSession}
            disabled={busy}
            aria-label="Start a new session"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
            <span className="hidden md:inline">New session</span>
          </Button>
        )}
      </div>

      {!hasSession && status === 'ready' && (
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSubmit(s)}
              className="rounded-full border border-border bg-card/40 px-2.5 py-1 text-left text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
