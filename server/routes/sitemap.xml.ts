import { fetchPublicRoutes } from '~/lib/api'
import { isIndexableHost } from '~/lib/indexing'
import { buildSitemapXml, getPublicFeedStatusCode } from '~/lib/publicFeed'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const host = getEventRequestHost(event)

  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')

  if (!host) {
    throw createError({ statusCode: 400, statusMessage: 'Missing host header' })
  }

  // Platform preview hosts are noindex, so they advertise no sitemap. Guarding
  // before the fetch also spares the API a pointless round-trip.
  if (!isIndexableHost(host, config.public.platformBaseDomain)) {
    throw createError({ statusCode: 404, statusMessage: 'Sitemap not found' })
  }

  try {
    const data = await fetchPublicRoutes(host)
    return buildSitemapXml(data, host, config.public.siteProtocol, config.public.platformBaseDomain)
  } catch (error) {
    const statusCode = getPublicFeedStatusCode(error)

    throw createError({
      statusCode: statusCode === 404 ? 404 : 502,
      statusMessage: statusCode === 404 ? 'Sitemap not found' : 'Unable to load sitemap.xml right now.'
    })
  }
})
