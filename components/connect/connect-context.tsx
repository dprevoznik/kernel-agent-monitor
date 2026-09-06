'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

export type GatewayTeam = { id: string; slug: string; name: string }

export type ConnectStatus = {
  kernelConnected: boolean
  gatewayConnected: boolean
  teamResolved: boolean
  selectedTeam: string | null
  teams: GatewayTeam[]
  allReady: boolean
}

type ConnectorKey = 'kernel' | 'gateway'

type ConnectContextValue = {
  status: ConnectStatus | null
  loading: boolean
  pending: ConnectorKey | null
  refresh: () => Promise<void>
  connect: (connector: ConnectorKey) => Promise<void>
  disconnect: (connector: ConnectorKey) => Promise<void>
  selectTeam: (team: string) => Promise<void>
}

const ConnectContext = createContext<ConnectContextValue | null>(null)

export function useConnect(): ConnectContextValue {
  const ctx = useContext(ConnectContext)
  if (!ctx) throw new Error('useConnect must be used within ConnectProvider')
  return ctx
}

export function ConnectProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ConnectStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState<ConnectorKey | null>(null)
  const refreshingRef = useRef(false)

  const refresh = useCallback(async () => {
    if (refreshingRef.current) return
    refreshingRef.current = true
    try {
      const res = await fetch('/api/connect/status', { cache: 'no-store' })
      if (res.ok) setStatus((await res.json()) as ConnectStatus)
    } catch {
      // leave prior status in place
    } finally {
      refreshingRef.current = false
      setLoading(false)
    }
  }, [])

  const connect = useCallback(
    async (connector: ConnectorKey) => {
      setPending(connector)
      try {
        const res = await fetch(`/api/connect/${connector}`, { method: 'POST' })
        if (!res.ok) return
        const { url } = (await res.json()) as { url: string }

        const inIframe = window.self !== window.top
        if (inIframe) {
          window.open(url, '_blank', 'noopener,noreferrer')
        } else {
          window.location.href = url
        }
      } finally {
        // popup/redirect drives completion; postMessage or focus triggers refresh
      }
    },
    [],
  )

  const disconnect = useCallback(
    async (connector: ConnectorKey) => {
      setPending(connector)
      try {
        await fetch(`/api/connect/${connector}`, { method: 'DELETE' })
        await refresh()
      } finally {
        setPending(null)
      }
    },
    [refresh],
  )

  const selectTeam = useCallback(
    async (team: string) => {
      await fetch('/api/connect/gateway-team', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ team }),
      })
      await refresh()
    },
    [refresh],
  )

  useEffect(() => {
    void refresh()
  }, [refresh])

  // Consent popup posts back when done; also refresh when the tab regains focus
  // (covers the full-page redirect return and manual popup closes).
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin) return
      if ((e.data as { type?: string })?.type === 'connect:done') {
        setPending(null)
        void refresh()
      }
    }
    function onFocus() {
      void refresh()
    }
    window.addEventListener('message', onMessage)
    window.addEventListener('focus', onFocus)
    return () => {
      window.removeEventListener('message', onMessage)
      window.removeEventListener('focus', onFocus)
    }
  }, [refresh])

  return (
    <ConnectContext.Provider
      value={{ status, loading, pending, refresh, connect, disconnect, selectTeam }}
    >
      {children}
    </ConnectContext.Provider>
  )
}
