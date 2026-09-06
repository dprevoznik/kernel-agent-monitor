import { getOrCreateVisitorId } from '@/lib/visitor'
import {
  isConnectorKey,
  startConnectorAuthorization,
  revokeConnectorAuthorization,
} from '@/lib/connect'
import { clearStoredTeam } from '@/lib/gateway-team'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Start the OAuth consent flow for a connector.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ connector: string }> },
) {
  const { connector } = await params
  if (!isConnectorKey(connector)) {
    return Response.json({ error: 'Unknown connector' }, { status: 400 })
  }
  const visitorId = await getOrCreateVisitorId()
  const url = await startConnectorAuthorization(connector, visitorId)
  return Response.json({ url })
}

// Disconnect (revoke the visitor's grant).
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ connector: string }> },
) {
  const { connector } = await params
  if (!isConnectorKey(connector)) {
    return Response.json({ error: 'Unknown connector' }, { status: 400 })
  }
  const visitorId = await getOrCreateVisitorId()
  await revokeConnectorAuthorization(connector, visitorId)
  if (connector === 'gateway') {
    await clearStoredTeam()
  }
  return Response.json({ ok: true })
}
