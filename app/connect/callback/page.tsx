'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ConnectCallbackPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'popup' | 'redirect'>('redirect')

  useEffect(() => {
    if (window.opener) {
      setMode('popup')
      window.opener.postMessage({ type: 'connect:done' }, window.location.origin)
      window.close()
    } else {
      router.replace('/')
    }
  }, [router])

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="flex items-center gap-3 font-mono text-sm text-muted-foreground">
        <span className="live-dot inline-block h-2 w-2 rounded-full bg-primary" />
        {mode === 'popup'
          ? 'Connected. You can close this tab.'
          : 'Connected. Returning to Agent View…'}
      </div>
    </main>
  )
}
