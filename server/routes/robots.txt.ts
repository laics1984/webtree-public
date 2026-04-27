import { fetchPublicSite } from '~/lib/api'
import { mergeVaryHeader, normalizeHost } from '~/lib/host'
import { buildRobotsTxt, getPublicFeedStatusCode } from '~/lib/publicFeed'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const host = normalizeHost(String(getHeader(event, 'x-forwarded-host') || getHeader(event, 'host') || ''))

  setHeader(event, 'Vary', mergeVaryHeader(getHeader(event, 'vary'), ['Host', 'X-Forwarded-Host']))
  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')

  if (!host) {
    throw createError({ statusCode: 400, statusMessage: 'Missing host header' })
  }

  try {
    const response = await fetchPublicSite(host)
    return buildRobotsTxt(response, host, config.public.siteProtocol, config.public.platformBaseDomain)
  } catch (error) {
    const statusCode = getPublicFeedStatusCode(error)

    throw createError({
      statusCode: statusCode === 404 ? 404 : 502,
      statusMessage: statusCode === 404 ? 'Site not found' : 'Unable to load robots.txt right now.'
    })
  }
})
