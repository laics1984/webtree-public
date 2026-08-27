import { describe, expect, it } from 'vitest'
import { AI_CRAWLER_DISALLOW_POLICY, NOINDEX_ROBOTS, isIndexableHost } from '~/lib/indexing'

const PROD_BASE = 'public.myfowable.com'
const DEV_BASE = 'public.localhost:3000'

describe('isIndexableHost', () => {
  it('allows client custom domains', () => {
    expect(isIndexableHost('clientdomain.com', PROD_BASE)).toBe(true)
    expect(isIndexableHost('www.clientdomain.com', PROD_BASE)).toBe(true)
  })

  it('blocks per-site platform subdomains', () => {
    expect(isIndexableHost('acme.public.myfowable.com', PROD_BASE)).toBe(false)
    expect(isIndexableHost('acme.public.localhost:3000', DEV_BASE)).toBe(false)
  })

  it('blocks the bare platform base domain', () => {
    expect(isIndexableHost(PROD_BASE, PROD_BASE)).toBe(false)
    expect(isIndexableHost(DEV_BASE, DEV_BASE)).toBe(false)
  })

  it('fails closed on a missing or unparseable host', () => {
    expect(isIndexableHost('', PROD_BASE)).toBe(false)
    expect(isIndexableHost(null, PROD_BASE)).toBe(false)
    expect(isIndexableHost(undefined, PROD_BASE)).toBe(false)
  })

  it('fails open on a missing platform base domain rather than deindexing live domains', () => {
    expect(isIndexableHost('clientdomain.com', '')).toBe(true)
    expect(isIndexableHost('clientdomain.com', null)).toBe(true)
  })
})

describe('AI_CRAWLER_DISALLOW_POLICY', () => {
  it('disallows the crawlers that ignore noindex', () => {
    for (const agent of ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'CCBot', 'Google-Extended', 'Bytespider']) {
      expect(AI_CRAWLER_DISALLOW_POLICY).toContain(`User-agent: ${agent}\nDisallow: /`)
    }
  })

  it('pairs every user-agent line with a disallow line', () => {
    const agents = AI_CRAWLER_DISALLOW_POLICY.match(/^User-agent: /gm) || []
    const disallows = AI_CRAWLER_DISALLOW_POLICY.match(/^Disallow: \/$/gm) || []
    expect(agents.length).toBe(disallows.length)
    expect(agents.length).toBeGreaterThan(0)
  })
})

describe('NOINDEX_ROBOTS', () => {
  it('suppresses both indexing and link following', () => {
    expect(NOINDEX_ROBOTS).toBe('noindex, nofollow')
  })
})
