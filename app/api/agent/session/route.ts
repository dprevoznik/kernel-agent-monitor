import { getOrCreateVisitorId } from '@/lib/visitor'
import { getVisitorToken } from '@/lib/connect'
import { createKernelMcpClient } from '@/lib/agent'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Best-effort teardown of a visitor's active Kernel browser session, used by the
// "New session" button and a beforeunload beacon. Sessions also time out on
// their own, so failures here are non-fatal.
export async function DELETE(req: Request) {
  const visitorId = await getOrCreateVisitorId()
  const kernelToken = await getVisitorToken('kernel', visitorId)
  if (!kernelToken) {
    return Response.json({ ok: true })
  }

  let sessionId: string | undefined
  try {
    const body = (await req.json()) as { sessionId?: string }
    sessionId = body.sessionId
  } catch {
    // sendBeacon may deliver an empty/blob body
  }
  if (!sessionId) {
    return Response.json({ ok: true })
  }

  try {
    const mcpClient = await createKernelMcpClient(kernelToken)
    try {
      const tools = await mcpClient.tools()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const manage = (tools as any)['manage_browsers']
      if (manage?.execute) {
        await manage
          .execute(
            { action: 'delete', session_id: sessionId },
            { messages: [], toolCallId: 'teardown' },
          )
          .catch(() => {})
      }
    } finally {
      await mcpClient.close().catch(() => {})
    }
  } catch (err) {
    console.log('[v0] session teardown failed:', err)
  }

  return Response.json({ ok: true })
}
