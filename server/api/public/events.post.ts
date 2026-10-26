import { encodeVisitorGeo } from '~/lib/visitorGeo'
import { visitorHeaders } from '~/lib/visitorHeaders'

// First-party tracking ingest proxy. The client posts batched events here
// (same-origin, so navigator.sendBeacon stays preflight-free); we forward them
// to the CMS with the visitor's real IP/UA so the server-side visitor hash,
// bot detection and per-IP rate limit see the visitor rather than this server.
//
// The CMS origin is itself behind Cloudflare, so this is a Worker-to-Worker
// subrequest — Cloudflare's edge re-derives its own hop metadata for that new
// connection and silently drops/overwrites standard-looking headers like
// User-Agent and X-Forwarded-For instead of passing through what we set here
// (confirmed: every event landed at the CMS with no User-Agent at all since
// this went live). Custom header names aren't touched, so the real values
// travel as X-Wt-* instead (lib/visitorHeaders.ts), with the key that makes
// the CMS believe them; it reads those in preference to the standard headers.
//
// Location travels the same way (X-Wt-Geo): Cloudflare geolocates the
// visitor's request to this Worker (event.context.cf), which the CMS on its
// side of the hop cannot see.
//
// Always 204, whatever happens upstream — a broken tracker must never surface
// to a visitor, and the endpoint must not become a host/validity oracle.
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readRawBody(event)

  const visitor = visitorHeaders({
    connectingIp: getRequestHeader(event, 'cf-connecting-ip'),
    remoteAddress: event.node.req.socket?.remoteAddress,
    userAgent: getRequestHeader(event, 'user-agent'),
    geo: encodeVisitorGeo(event.context.cf),
    proxyKey: String(config.rendererProxySecret || ''),
  })

  if (body) {
    try {
      await $fetch(`${config.publicApiBase}/api/public/events`, {
        method: 'POST',
        body,
        headers: {
          'Content-Type': 'text/plain',
          ...visitor
        }
      })
    } catch {
      // Fire-and-forget: swallow upstream failures.
    }
  }

  setResponseStatus(event, 204)
  return null
})
