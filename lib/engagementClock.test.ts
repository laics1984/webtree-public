import { describe, expect, it } from 'vitest'
import { IDLE_TIMEOUT_MS, MAX_ENGAGEMENT_SECONDS, createEngagementClock } from './engagementClock'

/** A clock whose time only moves when the test says so. */
function manualTime(start = 1_000_000) {
  let current = start
  return {
    now: () => current,
    advance: (ms: number) => {
      current += ms
    }
  }
}

describe('createEngagementClock', () => {
  it('counts visible time and starts over after each take', () => {
    const time = manualTime()
    const clock = createEngagementClock(true, time.now)

    time.advance(12_400)
    expect(clock.take()).toBe(12)

    time.advance(3_000)
    expect(clock.take()).toBe(3)
  })

  it('does not count while the tab is hidden', () => {
    const time = manualTime()
    const clock = createEngagementClock(true, time.now)

    time.advance(5_000)
    clock.setVisible(false)
    time.advance(60_000)
    clock.setVisible(true)
    time.advance(5_000)

    expect(clock.take()).toBe(10)
  })

  it('starts at zero when the page loads in a background tab', () => {
    const time = manualTime()
    const clock = createEngagementClock(false, time.now)

    time.advance(30_000)
    expect(clock.take()).toBe(0)
  })

  it('stops counting once the visitor goes idle, and resumes on input', () => {
    const time = manualTime()
    const clock = createEngagementClock(true, time.now)

    time.advance(IDLE_TIMEOUT_MS + 20 * 60_000) // walked away
    expect(clock.take()).toBe(IDLE_TIMEOUT_MS / 1000)

    clock.activity()
    time.advance(8_000)
    expect(clock.take()).toBe(8)
  })

  it('keeps counting while there is input', () => {
    const time = manualTime()
    const clock = createEngagementClock(true, time.now)

    for (let minute = 0; minute < 10; minute++) {
      time.advance(60_000)
      clock.activity()
    }

    expect(clock.take()).toBe(600)
  })

  it('caps a single emission', () => {
    const time = manualTime()
    const clock = createEngagementClock(true, time.now, Number.POSITIVE_INFINITY)

    time.advance(3 * 60 * 60_000)
    expect(clock.take()).toBe(MAX_ENGAGEMENT_SECONDS)
  })
})
