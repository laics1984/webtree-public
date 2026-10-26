/**
 * What this site's server tells the CMS about the visitor behind a request it forwards (tracking events, contact
 * forms). The CMS sees this server, not the visitor, so the visitor travels as X-Wt-* headers (Cloudflare drops the
 * standard ones on that hop), believed by the CMS only with the key (X-Wt-Proxy-Key = NUXT_RENDERER_PROXY_SECRET,
 * the CMS's RENDERER_PROXY_SECRET).
 *
 * The IP is Cloudflare's CF-Connecting-IP, which a visitor cannot set. X-Forwarded-For can carry whatever the client
 * sent, so it is never used.
 */
export function visitorHeaders(input: {
  connectingIp?: string | null
  remoteAddress?: string | null
  userAgent?: string | null
  geo?: string | null
  proxyKey?: string | null
}): Record<string, string> {
  const ip = (input.connectingIp || input.remoteAddress || '').trim()

  return {
    ...(ip ? { 'X-Wt-Client-Ip': ip } : {}),
    ...(input.userAgent ? { 'X-Wt-User-Agent': input.userAgent } : {}),
    ...(input.geo ? { 'X-Wt-Geo': input.geo } : {}),
    ...(input.proxyKey ? { 'X-Wt-Proxy-Key': input.proxyKey } : {}),
  }
}
