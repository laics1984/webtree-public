import { describe, expect, it } from 'vitest'
import { buildRobotsTxt, buildSitemapXml, resolvePublicHost } from '~/lib/publicFeed'
import type { PublicRoutesResponse, PublicSiteResponse, SiteDefaults } from '~/types/public'

const PROD_BASE = 'myfowable.com'
const PLATFORM_HOST = 'acme.myfowable.com'
const CUSTOM_HOST = 'clientdomain.com'

function siteResponse(defaults: SiteDefaults = {}, canonicalHost: string | null = CUSTOM_HOST): PublicSiteResponse {
  return {
    entity: {
      id: 'e1',
      publicIdentifier: 'acme',
      resolvedHost: PLATFORM_HOST,
      canonicalHost,
    },
    site: { defaults },
  } as PublicSiteResponse
}

function routesResponse(routes: PublicRoutesResponse['routes']): PublicRoutesResponse {
  return {
    publicIdentifier: 'acme',
    resolvedHost: PLATFORM_HOST,
    canonicalHost: CUSTOM_HOST,
    routes,
  }
}

describe('buildRobotsTxt on a client custom domain', () => {
  it('advertises the sitemap and does not block AI crawlers', () => {
    const result = buildRobotsTxt(siteResponse(), CUSTOM_HOST, 'https', PROD_BASE)

    expect(result).toContain(`Sitemap: https://${CUSTOM_HOST}/sitemap.xml`)
    expect(result).toContain('Allow: /')
    expect(result).not.toContain('GPTBot')
  })

  it('honours a site-provided policy and re-appends a single sitemap line', () => {
    const result = buildRobotsTxt(
      siteResponse({ robotsTxt: 'User-agent: *\nDisallow: /private\nSitemap: https://stale.example/sitemap.xml' }),
      CUSTOM_HOST,
      'https',
      PROD_BASE,
    )

    expect(result).toContain('Disallow: /private')
    expect(result).not.toContain('stale.example')
    expect(result.match(/^Sitemap:/gm)).toHaveLength(1)
  })
})

describe('buildRobotsTxt on a platform preview host', () => {
  it('omits the sitemap so the preview host advertises nothing', () => {
    const result = buildRobotsTxt(siteResponse(), PLATFORM_HOST, 'https', PROD_BASE)

    expect(result).not.toContain('Sitemap:')
  })

  it('keeps crawling allowed so engines can fetch the page and see the noindex', () => {
    const result = buildRobotsTxt(siteResponse(), PLATFORM_HOST, 'https', PROD_BASE)

    expect(result).toContain('User-agent: *\nAllow: /')
    expect(result).not.toContain('User-agent: *\nDisallow: /')
  })

  it('blocks AI crawlers, which ignore noindex', () => {
    const result = buildRobotsTxt(siteResponse(), PLATFORM_HOST, 'https', PROD_BASE)

    expect(result).toContain('User-agent: GPTBot\nDisallow: /')
    expect(result).toContain('User-agent: ClaudeBot\nDisallow: /')
    expect(result).toContain('User-agent: PerplexityBot\nDisallow: /')
  })

  it('still honours a site-provided base policy', () => {
    const result = buildRobotsTxt(
      siteResponse({ robotsTxt: 'User-agent: *\nDisallow: /private' }),
      PLATFORM_HOST,
      'https',
      PROD_BASE,
    )

    expect(result).toContain('Disallow: /private')
    expect(result).toContain('User-agent: GPTBot')
    expect(result).not.toContain('Sitemap:')
  })

  it('applies to a site that has no custom domain at all', () => {
    const result = buildRobotsTxt(siteResponse({}, null), PLATFORM_HOST, 'https', PROD_BASE)

    expect(result).not.toContain('Sitemap:')
    expect(result).toContain('User-agent: GPTBot')
  })
})

describe('buildSitemapXml', () => {
  it('lists every content type the manifest carries, not only builder pages', () => {
    const xml = buildSitemapXml(
      routesResponse([
        { path: '/', contentId: 'p1', contentType: 'page', isHomepage: true, changeFrequency: 'daily', priority: 1 },
        { path: '/articles/sports-day', contentId: 'a1', contentType: 'article', changeFrequency: 'weekly', priority: 0.6 },
        { path: '/events/open-day', contentId: 'e1', contentType: 'event', changeFrequency: 'monthly', priority: 0.5 },
      ]),
      CUSTOM_HOST,
      'https',
      PROD_BASE,
    )

    expect(xml).toContain(`<loc>https://${CUSTOM_HOST}/</loc>`)
    expect(xml).toContain(`<loc>https://${CUSTOM_HOST}/articles/sports-day</loc>`)
    expect(xml).toContain(`<loc>https://${CUSTOM_HOST}/events/open-day</loc>`)
    expect(xml).toContain('<changefreq>monthly</changefreq>')
    expect(xml.match(/<url>/g)).toHaveLength(3)
  })

  it('leaves out routes the manifest flags noindex', () => {
    const xml = buildSitemapXml(
      routesResponse([
        { path: '/articles/sports-day', contentId: 'a1', contentType: 'article' },
        { path: '/privacy', contentId: 'p2', contentType: 'page', noindex: true },
      ]),
      CUSTOM_HOST,
      'https',
      PROD_BASE,
    )

    expect(xml).toContain('/articles/sports-day')
    expect(xml).not.toContain('/privacy')
  })
})

// Regression guard for the isLocalPlatformRequestHost refactor: canonical host
// selection must be unchanged.
describe('resolvePublicHost', () => {
  it('prefers the canonical host on the platform host in production', () => {
    expect(resolvePublicHost(siteResponse().entity, PLATFORM_HOST, PROD_BASE)).toBe(CUSTOM_HOST)
  })

  it('falls back to the resolved host when no canonical host exists', () => {
    expect(resolvePublicHost(siteResponse({}, null).entity, PLATFORM_HOST, PROD_BASE)).toBe(PLATFORM_HOST)
  })

  it('keeps local development requests on their own host', () => {
    const entity = { resolvedHost: 'acme.localhost:3000', canonicalHost: CUSTOM_HOST }
    expect(resolvePublicHost(entity, 'acme.localhost:3000', 'localhost:3000'))
      .toBe('acme.localhost:3000')
  })
})
