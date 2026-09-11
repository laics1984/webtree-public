import { describe, expect, it } from 'vitest'
import { formatDate, formatRange } from '~/lib/dateFormat'

const NOW = Date.parse('2026-09-10T12:00:00Z')

describe('formatDate', () => {
  it('prints the calendar day the timestamp names, whatever the machine’s timezone', () => {
    // 23:30 at -05:00 is already the 11th in UTC and in Kuala Lumpur; the
    // label must not depend on which of those the renderer happens to run in.
    expect(formatDate('2026-09-10T23:30:00-05:00')).toBe('Sep 10, 2026')
  })

  it('stays absolute without the reader’s clock, however recent the date', () => {
    expect(formatDate('2026-09-10T11:00:00+00:00')).toBe('Sep 10, 2026')
  })

  it('turns relative within a week once the reader’s clock is known', () => {
    expect(formatDate('2026-09-10T11:59:40+00:00', NOW)).toBe('just now')
    expect(formatDate('2026-09-10T11:59:00+00:00', NOW)).toBe('1 minute ago')
    expect(formatDate('2026-09-10T09:00:00+00:00', NOW)).toBe('3 hours ago')
    expect(formatDate('2026-09-04T12:00:00+00:00', NOW)).toBe('6 days ago')
  })

  it('stays absolute for dates older than a week, or still to come', () => {
    expect(formatDate('2026-09-01T12:00:00+00:00', NOW)).toBe('Sep 1, 2026')
    expect(formatDate('2026-09-20T12:00:00+00:00', NOW)).toBe('Sep 20, 2026')
  })

  it('prints nothing for a missing or unreadable value', () => {
    expect(formatDate(null)).toBe('')
    expect(formatDate('')).toBe('')
    expect(formatDate('not a date')).toBe('')
  })
})

describe('formatRange', () => {
  it('joins two different days', () => {
    expect(formatRange('2026-09-20T09:00:00+00:00', '2026-09-22T17:00:00+00:00')).toBe(
      'Sep 20, 2026 – Sep 22, 2026'
    )
  })

  it('collapses a range within one day, and falls back to whichever end is set', () => {
    expect(formatRange('2026-09-20T09:00:00+00:00', '2026-09-20T17:00:00+00:00')).toBe('Sep 20, 2026')
    expect(formatRange(null, '2026-09-22T17:00:00+00:00')).toBe('Sep 22, 2026')
    expect(formatRange(null, null)).toBe('')
  })
})
