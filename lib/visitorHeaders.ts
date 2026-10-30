/**
 * What this site's server tells the CMS about the visitor behind a request it makes on their behalf: every public
 * API call (page reads, tracking events, contact forms). The CMS sees this server, not the visitor, so the visitor
 * travels as X-Wt-* headers (Cloudflare drops the standard ones on that hop), believed by the CMS only with the key
 * (X-Wt-Proxy-Key = NUXT_RENDERER_PROXY_SECRET, the CMS's RENDERER_PROXY_SECRET). The CMS rate-limits public
 * reads and contact forms per visitor, so without them every visitor this Worker serves would count as one.
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

/** The parts of an H3 event visitorHeadersFrom() reads. Structural, so this file stays free of h3: lib/api.ts, which uses it, also ships to the browser. */
export interface IncomingVisitorRequest {
  node: { req: { headers: Record<string, string | string[] | undefined>, socket?: { remoteAddress?: string } | null } }
}

/** visitorHeaders() for the request a server handler, or a server render, is answering. */
export function visitorHeadersFrom(event: IncomingVisitorRequest, proxyKey: string, geo?: string | null): Record<string, string> {
  const header = (name: string) => {
    const value = event.node.req.headers[name]

    return Array.isArray(value) ? value[0] : value
  }

  return visitorHeaders({
    connectingIp: header('cf-connecting-ip'),
    remoteAddress: event.node.req.socket?.remoteAddress,
    userAgent: header('user-agent'),
    geo,
    proxyKey,
  })
}
