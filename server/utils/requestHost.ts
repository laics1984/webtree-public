import type { H3Event } from 'h3'
import { normalizeHost } from '~/lib/host'

/**
 * Normalized request host for server handlers, preferring the proxy-provided
 * `x-forwarded-host` over the raw `Host` header.
 */
export function getEventRequestHost(event: H3Event): string {
  return normalizeHost(String(getHeader(event, 'x-forwarded-host') || getHeader(event, 'host') || ''))
}
