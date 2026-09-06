import 'server-only'
import { headers } from 'next/headers'
import {
  getTokenResponse,
  startAuthorization,
  revokeToken,
  NoValidTokenError,
  UserAuthorizationRequiredError,
  ConnectorInstallationRequiredError,
  type ConnectTokenSubject,
} from '@vercel/connect'

export type ConnectorKey = 'kernel' | 'gateway'

/**
 * The two connectors this app needs, keyed by short names. Both are already
 * attached to this Vercel project and both authorize per user (subject type
 * `user`), so every downstream call runs on the visitor's own account.
 */
export const CONNECTORS: Record<ConnectorKey, { uid: string; label: string }> = {
  kernel: { uid: 'kernel/kernel-mcp', label: 'Kernel' },
  gateway: { uid: 'mcp.vercel.com/ai-gateway-access', label: 'Vercel AI Gateway' },
}

export function isConnectorKey(value: string): value is ConnectorKey {
  return value in CONNECTORS
}

export function getConnectSubject(visitorId: string): ConnectTokenSubject {
  return { type: 'user', id: visitorId, issuer: 'agent-view' }
}

function isUnauthorized(err: unknown): boolean {
  return (
    err instanceof UserAuthorizationRequiredError ||
    err instanceof NoValidTokenError ||
    err instanceof ConnectorInstallationRequiredError
  )
}

/**
 * Returns the visitor's access token for a connector, or `null` when they have
 * not authorized it yet. Never throws for the "not connected" case so callers
 * can prompt a connect instead of 500ing.
 */
export async function getVisitorToken(
  connector: ConnectorKey,
  visitorId: string,
): Promise<string | null> {
  try {
    const res = await getTokenResponse(CONNECTORS[connector].uid, {
      subject: getConnectSubject(visitorId),
      scopes: ['*'],
    })
    return res.token
  } catch (err) {
    if (isUnauthorized(err)) return null
    throw err
  }
}

/** Starts the hosted OAuth consent flow and returns a URL for the client to open. */
export async function startConnectorAuthorization(
  connector: ConnectorKey,
  visitorId: string,
): Promise<string> {
  const origin = await getOrigin()
  const { url } = await startAuthorization(
    CONNECTORS[connector].uid,
    { subject: getConnectSubject(visitorId), scopes: ['*'] },
    { callbackUrl: `${origin}/connect/callback` },
  )
  return url
}

/** Revokes the visitor's own grant for a connector. */
export async function revokeConnectorAuthorization(
  connector: ConnectorKey,
  visitorId: string,
): Promise<void> {
  await revokeToken(CONNECTORS[connector].uid, {
    subject: getConnectSubject(visitorId),
  })
}

/**
 * Resolve the app origin for OAuth callbacks so it works in production, Vercel
 * previews, and the embedded v0 preview iframe.
 */
export async function getOrigin(): Promise<string> {
  if (process.env.NODE_ENV !== 'production' && process.env.V0_RUNTIME_URL) {
    return process.env.V0_RUNTIME_URL
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const proto = h.get('x-forwarded-proto') ?? 'https'
  return `${proto}://${host}`
}
