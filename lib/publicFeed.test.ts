import { describe, expect, it } from 'vitest'
import { buildRobotsTxt, resolvePublicHost } from '~/lib/publicFeed'
import type { PublicSiteResponse, SiteDefaults } from '~/types/public'

const PROD_BASE = 'public.myfowable.com'
const PLATFORM_HOST = 'acme.public.myfowable.com'
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
    const entity = { resolvedHost: 'acme.public.localhost:3000', canonicalHost: CUSTOM_HOST }
    expect(resolvePublicHost(entity, 'acme.public.localhost:3000', 'public.localhost:3000'))
      .toBe('acme.public.localhost:3000')
  })
})
