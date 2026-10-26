import { normalizeHost } from '~/lib/host'
import { visitorHeaders } from '~/lib/visitorHeaders'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const config = useRuntimeConfig()

  // Attribute the enquiry to the site actually being visited — derive the host
  // from the request server-side rather than trusting the client-supplied value.
  const forwardedHost = getRequestHeader(event, 'x-forwarded-host')
  const host = normalizeHost(
    forwardedHost || getRequestHeader(event, 'host') || body?.host || ''
  )

  try {
    return await $fetch(`${config.publicApiBase}/api/public/contact`, {
      method: 'POST',
      body: { ...body, host },
      // The visitor, not this server: the CMS limits and records submissions per visitor.
      headers: visitorHeaders({
        connectingIp: getRequestHeader(event, 'cf-connecting-ip'),
        remoteAddress: event.node.req.socket?.remoteAddress,
        userAgent: getRequestHeader(event, 'user-agent'),
        proxyKey: String(config.rendererProxySecret || ''),
      }),
    })
  } catch (error: any) {
    // Surface the CMS status (e.g. 422 validation, 404 unknown host) to the client.
    throw createError({
      statusCode: error?.response?.status || error?.statusCode || 502,
      statusMessage: 'Contact submission failed',
      data: error?.data ?? null,
    })
  }
})
