'use client'

import { Check, Loader2, Plug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useConnect } from './connect-context'

type ConnectorKey = 'kernel' | 'gateway'

export function ConnectorRow({
  connector,
  label,
  description,
  connected,
  icon,
}: {
  connector: ConnectorKey
  label: string
  description: string
  connected: boolean
  icon: React.ReactNode
}) {
  const { connect, disconnect, pending } = useConnect()
  const busy = pending === connector

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card/60 p-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-foreground">{label}</p>
          {connected && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              <Check className="size-3" />
              connected
            </span>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">{description}</p>
      </div>
      {connected ? (
        <Button
          variant="ghost"
          size="sm"
          className="h-11 px-3 text-muted-foreground"
          disabled={busy}
          onClick={() => disconnect(connector)}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : 'Disconnect'}
        </Button>
      ) : (
        <Button
          size="sm"
          className="h-11 px-4"
          disabled={busy}
          onClick={() => connect(connector)}
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              <Plug className="size-4" />
              Connect
            </>
          )}
        </Button>
      )}
    </div>
  )
}
