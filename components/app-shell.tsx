'use client'

import { Loader2 } from 'lucide-react'
import { useConnect } from '@/components/connect/connect-context'
import { ConnectGate } from '@/components/connect/connect-gate'
import { AgentView } from '@/components/agent-view/agent-view'
import { KernelWordmark } from '@/components/kernel-logo'

export function AppShell() {
  const { status, loading } = useConnect()

  if (!status && loading) {
    return (
      <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-background">
        <KernelWordmark className="h-6 w-auto opacity-80" />
        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin text-primary" />
          starting agent view…
        </div>
      </main>
    )
  }

  if (!status?.allReady) return <ConnectGate />

  return <AgentView />
}
