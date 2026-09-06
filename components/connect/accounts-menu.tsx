'use client'

import { useEffect, useRef, useState } from 'react'
import { Globe, Zap, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useConnect } from './connect-context'
import { ConnectorRow } from './connector-row'

export function AccountsMenu() {
  const { status } = useConnect()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const kernelConnected = status?.kernelConnected ?? false
  const gatewayConnected = status?.gatewayConnected ?? false

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="outline"
        size="sm"
        className="h-11 gap-2"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex items-center gap-1">
          <span
            className={`size-1.5 rounded-full ${kernelConnected ? 'bg-primary' : 'bg-muted-foreground/40'}`}
          />
          <span
            className={`size-1.5 rounded-full ${gatewayConnected ? 'bg-primary' : 'bg-muted-foreground/40'}`}
          />
        </span>
        <span className="hidden sm:inline">Accounts</span>
        <ChevronDown className="size-3.5 opacity-70" />
      </Button>

      {open && (
        <div
          role="dialog"
          aria-label="Connected accounts"
          className="absolute right-0 z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-border bg-popover p-3 shadow-2xl shadow-black/50"
        >
          <p className="mb-2 px-1 text-xs text-muted-foreground">
            Your connected accounts. Everything runs on these tokens.
          </p>
          <div className="flex flex-col gap-2">
            <ConnectorRow
              connector="kernel"
              label="Kernel"
              description="Cloud Chromium"
              connected={kernelConnected}
              icon={<Globe className="size-5" />}
            />
            <ConnectorRow
              connector="gateway"
              label="AI Gateway"
              description="Model access"
              connected={gatewayConnected}
              icon={<Zap className="size-5" />}
            />
          </div>
        </div>
      )}
    </div>
  )
}
