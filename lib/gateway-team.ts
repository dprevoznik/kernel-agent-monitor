import 'server-only'
import { cookies } from 'next/headers'

const TEAM_COOKIE = 'agentview_gw_team'
const MAX_AGE = 60 * 60 * 24 * 365

export type GatewayTeam = { id: string; slug: string; name: string }

/**
 * A visitor's Vercel token can see more than one team, and `createGateway`
 * needs to know which team to bill. List the teams the gateway token can access.
 */
export async function listGatewayTeams(gatewayToken: string): Promise<GatewayTeam[]> {
  try {
    const res = await fetch('https://api.vercel.com/v2/teams?limit=50', {
      headers: { Authorization: `Bearer ${gatewayToken}` },
      cache: 'no-store',
    })
    if (!res.ok) return []
    const data = (await res.json()) as {
      teams?: Array<{ id: string; slug: string; name: string }>
    }
    return (data.teams ?? []).map((t) => ({ id: t.id, slug: t.slug, name: t.name }))
  } catch {
    return []
  }
}

export async function getStoredTeam(): Promise<string | null> {
  const store = await cookies()
  return store.get(TEAM_COOKIE)?.value ?? null
}

export async function setStoredTeam(teamIdOrSlug: string): Promise<void> {
  const store = await cookies()
  store.set(TEAM_COOKIE, teamIdOrSlug, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  })
}

export async function clearStoredTeam(): Promise<void> {
  const store = await cookies()
  store.delete(TEAM_COOKIE)
}
