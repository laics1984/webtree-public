// First-party tracking ingest proxy. The client posts batched events here
// (same-origin, so navigator.sendBeacon stays preflight-free); we forward them
// to the CMS with the visitor's real IP/UA so the server-side visitor hash,
// bot detection and per-IP rate limit see the visitor rather than this server.
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
          ...(clientIp ? { 'X-Forwarded-For': clientIp } : {}),
          'User-Agent': userAgent
        }
      })
    } catch {
      // Fire-and-forget: swallow upstream failures.
    }
  }

  setResponseStatus(event, 204)
  return null
})
