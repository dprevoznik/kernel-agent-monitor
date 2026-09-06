import 'server-only'
import { createMCPClient } from '@ai-sdk/mcp'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { createGateway } from '@ai-sdk/gateway'

/** Kernel's hosted MCP server (Streamable HTTP). Its tools are the agent's only
 * way to touch the web: `manage_browsers` (create/delete cloud browser sessions)
 * and `execute_playwright_code` (run Playwright in a session). */
export const KERNEL_MCP_URL = 'https://mcp.onkernel.com/mcp'

/** Newest Claude Sonnet available on the AI Gateway. */
export const DEFAULT_MODEL = 'anthropic/claude-sonnet-5'

export const SYSTEM_PROMPT = `You are Agent View, an autonomous web agent. You control exactly one real, remote Chromium browser running in the cloud on Kernel. That browser is the ONLY way you can affect the web — you cannot browse or fetch any other way.

You control the browser through these Kernel MCP tools:
- "manage_browsers": create or delete a browser session. To start, call it with action "create". It returns a session id and a live-view URL that the human is watching.
- "execute_playwright_code": run Playwright JavaScript inside an existing session. The code runs in the same VM as the browser with "page", "context" and "browser" already in scope. You can "return" a JSON-serializable value. Example: await page.goto('https://example.com'); return await page.title();

Rules:
1. If there is no active browser session yet in this conversation, your FIRST action must be "manage_browsers" with action "create". Reuse the same session id for every later step in the conversation — do not create extra sessions.
2. Before EACH tool call, write ONE short sentence stating your immediate intent (e.g. "Searching Google for flights to Tokyo."). This narration is shown to the human as your reasoning, so keep it clear and specific.
3. Work the user's goal step by step with small, single-purpose Playwright snippets. Prefer resilient selectors (getByRole, getByText, placeholders). Read the returned value/error and self-correct on the next step.
4. After navigations or clicks, wait for the page to settle (e.g. page.waitForLoadState('domcontentloaded')) and, when useful, return the current URL and page title so progress is visible.
5. When the goal is achieved — or if you are truly stuck after several failed attempts — stop calling tools and write a concise final summary of what you found or did. Do not delete the session yourself; teardown is handled separately.
6. Never claim to have done something you did not verify in the browser.`

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
