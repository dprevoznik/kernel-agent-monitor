import { convertToModelMessages, streamText, stepCountIs, type UIMessage } from 'ai'
import { getOrCreateVisitorId } from '@/lib/visitor'
import { getVisitorToken } from '@/lib/connect'
import { getStoredTeam } from '@/lib/gateway-team'
import { createKernelMcpClient, buildModel, SYSTEM_PROMPT } from '@/lib/agent'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST(req: Request) {
  const visitorId = await getOrCreateVisitorId()

  const [kernelToken, gatewayToken] = await Promise.all([
    getVisitorToken('kernel', visitorId),
    getVisitorToken('gateway', visitorId),
  ])

  if (!kernelToken || !gatewayToken) {
    return Response.json({ error: 'not_connected' }, { status: 401 })
  }

  const teamIdOrSlug = (await getStoredTeam()) ?? undefined

  const { messages }: { messages: UIMessage[] } = await req.json()

  // Per-request Kernel MCP client, authorized with THIS visitor's token.
  const mcpClient = await createKernelMcpClient(kernelToken)
  const tools = await mcpClient.tools()

  const result = streamText({
    model: buildModel(gatewayToken, teamIdOrSlug),
    system: SYSTEM_PROMPT,
    tools,
    stopWhen: stepCountIs(40),
    messages: await convertToModelMessages(messages),
    // Close the MCP client once the whole run (including tool calls) is done.
    onFinish: async () => {
      await mcpClient.close().catch(() => {})
    },
    onError: async () => {
      await mcpClient.close().catch(() => {})
    },
  })

  return result.toUIMessageStreamResponse({
    sendReasoning: true,
    onError: (error) => {
      console.log('[v0] agent stream error:', error)
      return 'The agent hit an error while driving the browser. Please try again.'
    },
  })
}
