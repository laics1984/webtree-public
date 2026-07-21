import { describe, expect, it } from 'vitest'
import { resolveHomepageFallbackPath } from './usePublicPage'

describe('resolveHomepageFallbackPath', () => {
  it('uses publicIdentifier instead of siteKey when resolving identifier homepage paths', () => {
    expect(
      resolveHomepageFallbackPath({
        siteKey: 'legacy-site-key',
        publicIdentifier: 'public-identifier',
        resolvedHost: 'public-identifier.public.localhost:3000',
        routes: [
          {
            path: '/legacy-site-key',
            slug: 'legacy-site-key',
            pageId: 'legacy',
          },
          {
            path: '/public-identifier',
            slug: 'public-identifier',
            pageId: 'public',
          },
        ],
      })
    ).toBe('/public-identifier')
  })

  it('does not use siteKey as a homepage fallback when publicIdentifier is absent', () => {
    expect(
      resolveHomepageFallbackPath({
        siteKey: 'legacy-site-key',
        publicIdentifier: '',
        resolvedHost: 'legacy-site-key.public.localhost:3000',
        routes: [
          {
            path: '/legacy-site-key',
            slug: 'legacy-site-key',
            pageId: 'legacy',
          },
        ],
      })
    ).toBeNull()
  })
})
