'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Brain, ListChecks, Terminal, Globe } from 'lucide-react'
import { KernelWordmark } from '@/components/kernel-logo'
import { AccountsMenu } from '@/components/connect/accounts-menu'
import { useConnect } from '@/components/connect/connect-context'
import { deriveFromMessages } from './derive'
import { BrowserFrame, type BrowserStatus } from './browser-frame'
import { GoalBar } from './goal-bar'
import { ReasoningFeed } from './reasoning-feed'
import { ActionsFeed } from './actions-feed'
import { ToolCallsFeed } from './tool-calls-feed'
import { ActiveSitePanel } from './active-site-panel'

type MobileTab = 'reasoning' | 'actions' | 'tools' | 'site'

const TABS: { id: MobileTab; label: string; icon: typeof Brain }[] = [
  { id: 'actions', label: 'Actions', icon: ListChecks },
  { id: 'reasoning', label: 'Reasoning', icon: Brain },
  { id: 'tools', label: 'Tool Calls', icon: Terminal },
  { id: 'site', label: 'Site', icon: Globe },
]

export function AgentView() {
  const { refresh } = useConnect()
  const { messages, sendMessage, status, stop, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: '/api/agent' }),
    onError: () => {
      // A 401 means a token was revoked mid-session; re-check to fall back to the gate.
      void refresh()
    },
  })

  const derived = useMemo(() => deriveFromMessages(messages), [messages])
  const [tab, setTab] = useState<MobileTab>('actions')
  const sessionRef = useRef<string | null>(null)
  sessionRef.current = derived.sessionId

  const browserStatus: BrowserStatus = derived.liveViewUrl
    ? 'live'
    : status === 'submitted' || status === 'streaming'
      ? 'starting'
      : 'idle'

  const hasSession = messages.length > 0

  async function teardownSession(sessionId: string) {
    try {
      await fetch('/api/agent/session', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
    } catch {
      // best effort
    }
  }

  function handleNewSession() {
    const sid = sessionRef.current
    stop()
    setMessages([])
    if (sid) void teardownSession(sid)
  }

  // Best-effort teardown when the tab is closed.
  useEffect(() => {
    function onUnload() {
      const sid = sessionRef.current
      if (!sid) return
      const blob = new Blob([JSON.stringify({ sessionId: sid })], {
        type: 'application/json',
      })
      navigator.sendBeacon('/api/agent/session', blob)
    }
    window.addEventListener('beforeunload', onUnload)
    return () => window.removeEventListener('beforeunload', onUnload)
  }, [])

  const chatStatus = (
    ['ready', 'submitted', 'streaming', 'error'].includes(status) ? status : 'ready'
  ) as 'ready' | 'submitted' | 'streaming' | 'error'

  return (
    <main className="flex h-[100dvh] flex-col overflow-hidden bg-background">
      {/* header */}
      <header className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <KernelWordmark className="h-5 w-auto" />
          <span className="hidden h-4 w-px bg-border sm:block" />
          <span className="hidden font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground sm:block">
            Agent View
          </span>
        </div>
        <div className="ml-auto">
          <AccountsMenu />
        </div>
      </header>

      {/* goal bar */}
      <div className="shrink-0 border-b border-border px-4 py-3">
        <GoalBar
          onSubmit={(goal) => sendMessage({ text: goal })}
          onStop={stop}
          onNewSession={handleNewSession}
          status={chatStatus}
          hasSession={hasSession}
        />
      </div>

      {/* content */}
      <div className="min-h-0 flex-1 overflow-hidden p-3 sm:p-4">
        {/* desktop: browser is the focal center, feeds flank it */}
        <div className="hidden h-full grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)_minmax(0,1fr)] gap-3 lg:grid">
          <div className="flex min-h-0 flex-col gap-3">
            <ActiveSitePanel
              activeSite={derived.activeSite}
              navigations={derived.navigations}
              toolCallCount={derived.toolCallCount}
              className="shrink-0"
            />
            <ActionsFeed items={derived.actions} className="min-h-0 flex-1" />
          </div>

          <BrowserFrame
            liveViewUrl={derived.liveViewUrl}
            status={browserStatus}
            sessionId={derived.sessionId}
            activeSite={derived.activeSite}
          />

          <div className="flex min-h-0 flex-col gap-3">
            <ReasoningFeed items={derived.reasoning} className="min-h-0 flex-1" />
            <ToolCallsFeed items={derived.toolCalls} className="min-h-0 flex-1" />
          </div>
        </div>

        {/* mobile: browser dominant, feeds behind a tab strip */}
        <div className="flex h-full flex-col gap-3 lg:hidden">
          <div className="h-[46vh] shrink-0">
            <BrowserFrame
              liveViewUrl={derived.liveViewUrl}
              status={browserStatus}
              sessionId={derived.sessionId}
              activeSite={derived.activeSite}
            />
          </div>

          <div
            role="tablist"
            aria-label="Agent feeds"
            className="flex shrink-0 gap-1 rounded-lg border border-border bg-card/60 p-1"
          >
            {TABS.map((t) => {
              const Icon = t.icon
              const active = tab === t.id
              const badge =
                t.id === 'actions'
                  ? derived.actions.length
                  : t.id === 'tools'
                    ? derived.toolCalls.length
                    : 0
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(t.id)}
                  className={`flex h-11 items-center justify-center gap-1.5 rounded-md text-xs font-medium transition-colors ${
                    active
                      ? 'flex-[1.4] bg-primary/15 text-primary'
                      : 'flex-1 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="size-4 shrink-0" />
                  {active && <span>{t.label}</span>}
                  {badge > 0 && (
                    <span className="rounded-full bg-primary/20 px-1 font-mono text-[10px] text-primary">
                      {badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="min-h-0 flex-1">
            {tab === 'reasoning' && (
              <ReasoningFeed items={derived.reasoning} className="h-full" />
            )}
            {tab === 'actions' && <ActionsFeed items={derived.actions} className="h-full" />}
            {tab === 'tools' && <ToolCallsFeed items={derived.toolCalls} className="h-full" />}
            {tab === 'site' && (
              <ActiveSitePanel
                activeSite={derived.activeSite}
                navigations={derived.navigations}
                toolCallCount={derived.toolCallCount}
                className="h-full"
              />
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
