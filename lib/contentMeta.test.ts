import { describe, expect, it } from 'vitest'
import type { PublicContentItem } from '~/types/public'
import { contentMeta, contentMetaList } from '~/lib/contentMeta'

const item = (fields: Partial<PublicContentItem> = {}): PublicContentItem => ({
  id: '1',
  type: 'article',
  title: 'Test',
  ...fields,
})

const NOW = Date.parse('2026-09-10T12:00:00Z')

describe('contentMeta', () => {
  it('dates an article absolutely until the reader’s clock is known', () => {
    expect(contentMeta('articleDate', item({ publish: '2026-09-08T12:00:00+00:00' }))).toEqual({
      kind: 'articleDate',
      icon: 'calendar',
      label: 'Sep 8, 2026',
    })
  })

  it('dates a recent article relatively once the reader’s clock is known', () => {
    expect(contentMeta('articleDate', item({ publish: '2026-09-08T12:00:00+00:00' }), NOW)?.label).toBe(
      '2 days ago'
    )
  })

  it('dates an event by its schedule, not its publish date', () => {
    const event = item({ start: '2026-09-09T12:00:00+00:00', publish: '2026-09-08T12:00:00+00:00' })

    expect(contentMeta('eventDate', event, NOW)?.label).toBe('1 day ago')
  })

  it('falls back to the publish date for an event with no schedule', () => {
    expect(contentMeta('eventDate', item({ publish: '2026-09-08T12:00:00+00:00' }))?.label).toBe(
      'Sep 8, 2026'
    )
  })

  it('labels the author and location with their own icons', () => {
    const labelled = item({ author: { id: 7, name: ' Ada ' }, location: 'Kuala Lumpur' })

    expect(contentMeta('author', labelled)).toEqual({ kind: 'author', icon: 'user', label: 'Ada' })
    expect(contentMeta('location', labelled)).toEqual({
      kind: 'location',
      icon: 'map-pin',
      label: 'Kuala Lumpur',
    })
  })

  it('returns null rather than an icon with an empty label', () => {
    expect(contentMeta('articleDate', item({ publish: 'not a date' }))).toBeNull()
    expect(contentMeta('eventDate', item())).toBeNull()
    expect(contentMeta('author', item({ author: { id: 7, name: '  ' } }))).toBeNull()
    expect(contentMeta('location', item({ location: null }))).toBeNull()
  })
})

describe('contentMetaList', () => {
  it('keeps the requested order and skips facts the item lacks', () => {
    const event = item({ location: 'Penang', author: { id: 1, name: 'Ada' } })

    expect(contentMetaList(['eventDate', 'location', 'author'], event).map((meta) => meta.kind)).toEqual([
      'location',
      'author',
    ])
  })
})
