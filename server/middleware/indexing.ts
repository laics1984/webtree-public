import { mergeVaryHeader } from '~/lib/host'
import { NOINDEX_ROBOTS, isIndexableHost } from '~/lib/indexing'

/**
 * Host-level indexing guard, and the single place `Vary` is declared for
 * host-dependent responses.
 *
 * Nitro registers `server/middleware/*` on the h3 app ahead of the router that
 * holds cached route handlers, so this runs on every request — cache hits
 * included. Cached handlers capture their headers on a cloned response object,
 * so `X-Robots-Tag` never enters a cache entry and can never be replayed onto a
 * client custom domain.
 */
export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)

  setHeader(event, 'Vary', mergeVaryHeader(getHeader(event, 'vary'), ['Host', 'X-Forwarded-Host']))

  if (!isIndexableHost(getEventRequestHost(event), config.public.platformBaseDomain)) {
    setHeader(event, 'X-Robots-Tag', NOINDEX_ROBOTS)
  }
})
