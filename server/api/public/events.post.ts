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
// travel as X-Wt-* instead; the CMS reads those in preference to the
// standard headers.
//
// Always 204, whatever happens upstream — a broken tracker must never surface
// to a visitor, and the endpoint must not become a host/validity oracle.
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readRawBody(event)

  const forwardedFor = getRequestHeader(event, 'x-forwarded-for')
  const remoteAddress = event.node.req.socket?.remoteAddress
  const clientIp = [forwardedFor, remoteAddress].filter(Boolean).join(', ')
  const userAgent = getRequestHeader(event, 'user-agent') || ''

  if (body) {
    try {
      await $fetch(`${config.publicApiBase}/api/public/events`, {
        method: 'POST',
        body,
        headers: {
          'Content-Type': 'text/plain',
          ...(clientIp ? { 'X-Wt-Client-Ip': clientIp } : {}),
          ...(userAgent ? { 'X-Wt-User-Agent': userAgent } : {})
        }
      })
    } catch {
      // Fire-and-forget: swallow upstream failures.
    }
  }

  setResponseStatus(event, 204)
  return null
})
