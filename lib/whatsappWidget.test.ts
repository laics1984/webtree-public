import { describe, expect, it } from 'vitest'

import {
  deviceVisibilityClass,
  isWithinBusinessHours,
  localizeNow,
  matchesPageRule,
  withPageContext,
} from '~/lib/whatsappWidget'
import type { WhatsAppWidget } from '~/types/public'

const hours = (overrides: Partial<WhatsAppWidget['hours']> = {}): WhatsAppWidget['hours'] => ({
  enabled: true,
  timezone: 'Asia/Kuala_Lumpur',
  awayMessage: 'Away',
  schedule: {
    mon: [{ from: '09:00', to: '18:00' }],
    tue: [],
    wed: [],
    thu: [],
    fri: [],
    sat: [],
    sun: [],
  },
  ...overrides,
})

const visibility = (
  pages: WhatsAppWidget['visibility']['pages'],
  devices: WhatsAppWidget['visibility']['devices'] = 'all'
): WhatsAppWidget['visibility'] => ({ devices, pages })

describe('localizeNow', () => {
  it('reads the clock in the business timezone, not the visitor one', () => {
    // 2026-09-07T02:00Z is Monday 10:00 in Kuala Lumpur (UTC+8) and still
    // Sunday 22:00 in New York.
    const instant = new Date('2026-09-07T02:00:00Z')

    expect(localizeNow('Asia/Kuala_Lumpur', instant)).toEqual({ day: 'mon', time: '10:00' })
    expect(localizeNow('America/New_York', instant)).toEqual({ day: 'sun', time: '22:00' })
  })

  it('spells midnight as 00:00 so time comparisons stay ordered', () => {
    expect(localizeNow('UTC', new Date('2026-09-07T00:30:00Z'))).toEqual({
      day: 'mon',
      time: '00:30',
    })
  })

  it('gives no answer for a timezone this runtime cannot resolve', () => {
    expect(localizeNow('Middle/Earth', new Date('2026-09-07T02:00:00Z'))).toBeNull()
  })
})

describe('isWithinBusinessHours', () => {
  it('has no opinion when hours are switched off', () => {
    expect(isWithinBusinessHours(hours({ enabled: false }))).toBeNull()
    expect(isWithinBusinessHours(null)).toBeNull()
  })

  it('is open inside the interval and closed outside it', () => {
    // Monday 10:00 / 08:00 / 18:00 in Kuala Lumpur.
    expect(isWithinBusinessHours(hours(), new Date('2026-09-07T02:00:00Z'))).toBe(true)
    expect(isWithinBusinessHours(hours(), new Date('2026-09-07T00:00:00Z'))).toBe(false)
    // Closing time is exclusive: at 18:00 sharp the shop is shut.
    expect(isWithinBusinessHours(hours(), new Date('2026-09-07T10:00:00Z'))).toBe(false)
  })

  it('is closed on a day with no intervals', () => {
    // Tuesday 10:00 in Kuala Lumpur.
    expect(isWithinBusinessHours(hours(), new Date('2026-09-08T02:00:00Z'))).toBe(false)
  })

  it('honours a split day', () => {
    const split = hours({
      schedule: {
        mon: [
          { from: '09:00', to: '13:00' },
          { from: '14:00', to: '18:00' },
        ],
      },
    })

    expect(isWithinBusinessHours(split, new Date('2026-09-07T02:00:00Z'))).toBe(true)
    // 13:30 — the lunch gap.
    expect(isWithinBusinessHours(split, new Date('2026-09-07T05:30:00Z'))).toBe(false)
    expect(isWithinBusinessHours(split, new Date('2026-09-07T07:00:00Z'))).toBe(true)
  })

  it('stays reachable when the clock cannot be read', () => {
    // A working number must not disappear because of a timezone the browser
    // does not know.
    expect(isWithinBusinessHours(hours({ timezone: 'Middle/Earth' }))).toBeNull()
  })
})

describe('matchesPageRule', () => {
  it('shows everywhere by default', () => {
    expect(matchesPageRule(undefined, '/anything')).toBe(true)
    expect(matchesPageRule(visibility({ mode: 'all', paths: ['/contact'] }), '/anything')).toBe(true)
  })

  it('respects include and exclude lists', () => {
    const include = visibility({ mode: 'include', paths: ['/contact', '/pricing'] })
    expect(matchesPageRule(include, '/contact')).toBe(true)
    expect(matchesPageRule(include, '/about')).toBe(false)

    const exclude = visibility({ mode: 'exclude', paths: ['/checkout'] })
    expect(matchesPageRule(exclude, '/checkout')).toBe(false)
    expect(matchesPageRule(exclude, '/about')).toBe(true)
  })

  it('treats a trailing star as a prefix so a section needs one rule', () => {
    const include = visibility({ mode: 'include', paths: ['/blog*'] })

    expect(matchesPageRule(include, '/blog')).toBe(true)
    expect(matchesPageRule(include, '/blog/hello-world')).toBe(true)
    // Not a prefix match on the raw string: /blogging is a different section.
    expect(matchesPageRule(include, '/blogging')).toBe(false)
  })

  it('ignores trailing slashes, queries and hashes when matching', () => {
    const include = visibility({ mode: 'include', paths: ['/contact'] })

    expect(matchesPageRule(include, '/contact/')).toBe(true)
    expect(matchesPageRule(include, '/contact?utm_source=ig')).toBe(true)
    expect(matchesPageRule(include, '/contact#form')).toBe(true)
  })

  it('shows everywhere rather than nowhere when a list was left empty', () => {
    expect(matchesPageRule(visibility({ mode: 'include', paths: [] }), '/about')).toBe(true)
  })
})

describe('deviceVisibilityClass', () => {
  it('maps each device rule to a class, and "all" to none', () => {
    expect(deviceVisibilityClass('all')).toBeNull()
    expect(deviceVisibilityClass(undefined)).toBeNull()
    expect(deviceVisibilityClass('mobile')).toBe('wt-wa--mobile-only')
    expect(deviceVisibilityClass('desktop')).toBe('wt-wa--desktop-only')
  })
})

describe('withPageContext', () => {
  const href = 'https://wa.me/60123456789?text=Hi%21%20I%27d%20like%20a%20quote'

  it('leaves the link alone when the owner did not ask for page context', () => {
    expect(withPageContext(href, false, 'https://acme.test/pricing')).toBe(href)
    expect(withPageContext(href, true, null)).toBe(href)
  })

  it('appends the page url to the existing prefill without disturbing the number', () => {
    const result = new URL(withPageContext(href, true, 'https://acme.test/pricing'))

    expect(result.pathname).toBe('/60123456789')
    expect(result.searchParams.get('text')).toBe("Hi! I'd like a quote\n\nhttps://acme.test/pricing")
  })

  it('becomes the whole prefill when there was none', () => {
    const result = new URL(withPageContext('https://wa.me/60123456789', true, 'https://acme.test/'))

    expect(result.searchParams.get('text')).toBe('https://acme.test/')
  })
})
