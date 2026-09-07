import 'server-only'
import { tool } from 'ai'
import { z } from 'zod'
import { createMCPClient } from '@ai-sdk/mcp'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { createGateway } from '@ai-sdk/gateway'
import { listSkillsCatalog, readSkillContent } from '@/lib/skills'

/** Kernel's hosted MCP server (Streamable HTTP). Its tools are the agent's only
 * way to touch the web: `manage_browsers` (create/delete cloud browser sessions)
 * and `execute_playwright_code` (run Playwright in a session). */
export const KERNEL_MCP_URL = 'https://mcp.onkernel.com/mcp'

/** Newest Claude Sonnet available on the AI Gateway. */
export const DEFAULT_MODEL = 'anthropic/claude-sonnet-5'

/**
 * The system prompt stays tiny: an identity plus a catalog of skills the
 * agent can load on demand — instead of one long hardcoded instruction blob.
 * Full instructions live as markdown in `skills/<name>/SKILL.md` and only
 * enter context via the `read_skill` tool when the agent actually needs them.
 */
export async function buildSystemPrompt(): Promise<string> {
  const catalog = (await listSkillsCatalog())
    .map((s) => `- "${s.name}": ${s.description}`)
    .join('\n')

  return `You are Agent View, an autonomous web agent.

Before your first tool call, call "read_skill" with the skill that matches your task and follow its instructions exactly. Available skills:
${catalog}

Never claim to have done something you did not verify in the browser.`
}

/** Lets the agent pull a skill's full instructions into context on demand. */
export const skillTools = {
  read_skill: tool({
    description: "Load a named skill's full instructions before using its capability.",
    inputSchema: z.object({
      name: z.string().describe('The skill name, exactly as listed in the system prompt.'),
    }),
    execute: async ({ name }) => (await readSkillContent(name)) ?? `No skill named "${name}" was found.`,
  }),
}

/**
 * Build a Kernel MCP client authorized with THIS visitor's Kernel token.
 * Every request builds its own client; there is no shared credential.
 */
export async function createKernelMcpClient(kernelToken: string) {
  const transport = new StreamableHTTPClientTransport(new URL(KERNEL_MCP_URL), {
    requestInit: {
      headers: { Authorization: `Bearer ${kernelToken}` },
    },
  })
  return createMCPClient({ transport })
}

/** Build the language model from the visitor's own AI Gateway token + team. */
export function buildModel(gatewayToken: string, teamIdOrSlug?: string) {
  const gateway = createGateway(
    teamIdOrSlug ? { apiKey: gatewayToken, teamIdOrSlug } : { apiKey: gatewayToken },
  )
  return gateway(DEFAULT_MODEL)
}
