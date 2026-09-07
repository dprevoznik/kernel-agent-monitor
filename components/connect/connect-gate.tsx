'use client'

import { Globe, Zap, Loader2, KeyRound, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { KernelWordmark } from '@/components/kernel-logo'
import { SkillsStrip } from '@/components/agent-view/skills-strip'
import { useConnect } from './connect-context'
import { ConnectorRow } from './connector-row'

export function ConnectGate() {
  const { status, loading, selectTeam } = useConnect()

  const kernelConnected = status?.kernelConnected ?? false
  const gatewayConnected = status?.gatewayConnected ?? false
  const teams = status?.teams ?? []
  const needsTeamPick = gatewayConnected && !status?.teamResolved && teams.length > 1

  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-background px-5 py-10">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-70" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-primary/10 to-transparent" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <KernelWordmark className="h-7 w-auto" />
          <h1 className="mt-5 text-pretty text-2xl font-semibold tracking-tight text-foreground">
            Agent View
          </h1>
          <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
            Watch an AI agent drive a real cloud browser, with its reasoning and
            every tool call broken out around the live view. It runs on{' '}
            <span className="text-foreground">your own</span> Kernel and AI Gateway —
            no shared keys, nothing billed to anyone but you.
          </p>
          <SkillsStrip className="mt-4 justify-center" />
        </div>

        <div className="mb-4 flex items-center gap-2 rounded-lg border border-border bg-card/40 px-3 py-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-4 shrink-0 text-primary" />
          <span>
            Connect both accounts to begin. Tokens stay server-side and are never
            shared between visitors.
          </span>
        </div>

        <div className="flex flex-col gap-3">
          <ConnectorRow
            connector="kernel"
            label="Kernel"
            description="Cloud Chromium the agent controls"
            connected={kernelConnected}
            icon={<Globe className="size-5" />}
          />
          <ConnectorRow
            connector="gateway"
            label="Vercel AI Gateway"
            description="Model access for the agent loop"
            connected={gatewayConnected}
            icon={<Zap className="size-5" />}
          />
        </div>

        {needsTeamPick && (
          <div className="mt-4 rounded-lg border border-border bg-card/60 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-foreground">
              <KeyRound className="size-4 text-primary" />
              Choose an AI Gateway team to bill
            </div>
            <div className="flex flex-col gap-1.5">
              {teams.map((t) => (
                <Button
                  key={t.id}
                  variant="outline"
                  className="h-11 justify-start"
                  onClick={() => selectTeam(t.id)}
                >
                  <span className="truncate">{t.name}</span>
                  <span className="ml-auto truncate text-xs text-muted-foreground">
                    {t.slug}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
            Checking connections…
          </div>
        )}
      </div>
    </main>
  )
}
