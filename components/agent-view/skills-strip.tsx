'use client'

import { useEffect, useState } from 'react'
import { BookOpen, Radio } from 'lucide-react'
import type { SkillMeta } from '@/lib/skills'

function hostOf(url: string): string {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}

/**
 * Always-visible strip showing every skill the agent can load, and where its
 * instructions actually come from. The remote entry is fetched by the server
 * from its source URL on every page load (short-cached) — this is the same
 * live network call the agent itself makes via `read_skill`, just surfaced
 * up front so it's obvious before a single tool call happens.
 */
export function SkillsStrip({ className }: { className?: string }) {
  const [skills, setSkills] = useState<SkillMeta[] | null>(null)

  useEffect(() => {
    let active = true
    fetch('/api/skills')
      .then((res) => res.json())
      .then((data: { skills: SkillMeta[] }) => {
        if (active) setSkills(data.skills)
      })
      .catch(() => {
        if (active) setSkills([])
      })
    return () => {
      active = false
    }
  }, [])

  if (!skills || skills.length === 0) return null

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ''}`}>
      <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground/70">
        Skills loaded:
      </span>
      {skills.map((skill) => {
        const isRemote = skill.source === 'remote'
        return (
          <span
            key={skill.name}
            title={isRemote ? `Fetched live from ${skill.sourceUrl}` : `Shipped locally: ${skill.name}`}
            className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] ${
              isRemote
                ? 'border-primary/50 bg-primary/10 text-primary'
                : 'border-border/70 bg-secondary/40 text-muted-foreground'
            }`}
          >
            {isRemote ? (
              <Radio className="size-3 shrink-0 animate-pulse" />
            ) : (
              <BookOpen className="size-3 shrink-0" />
            )}
            <span className="max-w-[9rem] truncate sm:max-w-none">{skill.name}</span>
            {isRemote && skill.sourceUrl && (
              <>
                <span className="text-primary/50">·</span>
                <span className="max-w-[8rem] truncate text-primary/80 sm:max-w-none">
                  {hostOf(skill.sourceUrl)}
                </span>
              </>
            )}
          </span>
        )
      })}
    </div>
  )
}
