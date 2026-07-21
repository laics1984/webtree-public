import { describe, expect, it } from 'vitest'
import { resolveContentItemHref } from './contentLink'

describe('resolveContentItemHref', () => {
  it('prefers canonicalPath when present', () => {
    expect(
      resolveContentItemHref(
        {
          id: '1',
          type: 'article',
          slug: 'latest-article',
          canonicalPath: '/insights/latest-article',
        },
        { article: 'articles', event: 'events' }
      )
    ).toBe('/insights/latest-article')
  })

  it('falls back to configured article prefix when canonicalPath is missing', () => {
    expect(
      resolveContentItemHref(
        {
          id: '1',
          type: 'article',
          slug: 'latest-article',
        },
        { article: 'insights', event: 'events' }
      )
    ).toBe('/insights/latest-article')
  })

  it('falls back to id when slug is missing', () => {
    expect(
      resolveContentItemHref(
        {
          id: '42',
          type: 'article',
        },
        { article: 'insights', event: 'events' }
      )
    ).toBe('/insights/42')
  })
})
