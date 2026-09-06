import { getOrCreateVisitorId } from '@/lib/visitor'
import { getVisitorToken } from '@/lib/connect'
import {
  listGatewayTeams,
  getStoredTeam,
  setStoredTeam,
  type GatewayTeam,
} from '@/lib/gateway-team'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const visitorId = await getOrCreateVisitorId()

  const [kernelToken, gatewayToken] = await Promise.all([
    getVisitorToken('kernel', visitorId),
    getVisitorToken('gateway', visitorId),
  ])

  const kernelConnected = kernelToken != null
  const gatewayConnected = gatewayToken != null

  let teams: GatewayTeam[] = []
  let selectedTeam: string | null = null
  let teamResolved = false

  if (gatewayToken) {
    teams = await listGatewayTeams(gatewayToken)
    const stored = await getStoredTeam()

    if (stored && teams.some((t) => t.id === stored || t.slug === stored)) {
      selectedTeam = stored
      teamResolved = true
    } else if (teams.length === 1) {
      // Exactly one team the token can see — auto-select it.
      selectedTeam = teams[0].id
      await setStoredTeam(teams[0].id)
      teamResolved = true
    } else if (teams.length === 0) {
      // Token isn't scoped to a listable team; nothing to choose, let it ride.
      teamResolved = true
    }
  }

  return Response.json({
    kernelConnected,
    gatewayConnected,
    teamResolved,
    selectedTeam,
    teams,
    allReady: kernelConnected && gatewayConnected && teamResolved,
  })
}
