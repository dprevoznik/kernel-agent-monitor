import { getOrCreateVisitorId } from '@/lib/visitor'
import { getVisitorToken } from '@/lib/connect'
import { listGatewayTeams, setStoredTeam } from '@/lib/gateway-team'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Select which AI Gateway team to bill this visitor's model calls to.
export async function POST(req: Request) {
  const visitorId = await getOrCreateVisitorId()
  const gatewayToken = await getVisitorToken('gateway', visitorId)
  if (!gatewayToken) {
    return Response.json({ error: 'not_connected' }, { status: 401 })
  }

  const { team } = (await req.json()) as { team?: string }
  if (!team) {
    return Response.json({ error: 'Missing team' }, { status: 400 })
  }

  // Only accept a team the visitor's token can actually see.
  const teams = await listGatewayTeams(gatewayToken)
  if (!teams.some((t) => t.id === team || t.slug === team)) {
    return Response.json({ error: 'Invalid team' }, { status: 400 })
  }

  await setStoredTeam(team)
  return Response.json({ ok: true })
}
