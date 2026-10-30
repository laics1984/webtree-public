import type { H3Event } from 'h3'
import { visitorHeadersFrom } from '~/lib/visitorHeaders'

/**
 * GET a public CMS endpoint on behalf of the request this handler is answering, with the visitor behind it
 * (lib/visitorHeaders.ts): the CMS limits public reads per visitor.
 */
export function fetchPublicApi<T = unknown>(event: H3Event, endpoint: string, params: Record<string, unknown>): Promise<T> {
  const config = useRuntimeConfig(event)

  return $fetch<T>(`${config.publicApiBase}/api/public/${endpoint}`, {
    params,
    headers: visitorHeadersFrom(event, String(config.rendererProxySecret || '')),
  })
}
