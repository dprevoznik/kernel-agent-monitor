import 'server-only'
import { cookies } from 'next/headers'
import { randomUUID } from 'node:crypto'

const COOKIE_NAME = 'agentview_visitor'
const MAX_AGE = 60 * 60 * 24 * 365

/**
 * A stable, anonymous per-visitor id used as the Vercel Connect subject.
 * There is no sign-in: clearing cookies just means reconnecting accounts.
 * Only callable from a Route Handler or Server Action (it may set a cookie).
 */
export async function getOrCreateVisitorId(): Promise<string> {
  const store = await cookies()
  const existing = store.get(COOKIE_NAME)?.value
  if (existing) return existing

  const id = randomUUID()
  store.set(COOKIE_NAME, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  })
  return id
}

/** Read-only variant for Server Components (never sets a cookie). */
export async function getVisitorId(): Promise<string | null> {
  const store = await cookies()
  return store.get(COOKIE_NAME)?.value ?? null
}
