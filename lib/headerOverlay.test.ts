import { describe, expect, it } from 'vitest'
import { isFirstSectionHeaderOverlaySafe } from './headerOverlay'

const heroSafe = {
  id: 'h1',
  name: 'Hero - Background Bold',
  type: 'container',
  headerOverlaySafe: true,
  styles: {},
  content: [],
}

const heroCompact = {
  id: 'h2',
  name: 'Hero - Modern Split',
  type: 'container',
  styles: {},
  content: [],
}

const breadcrumb = {
  id: 'b1',
  name: 'Breadcrumb',
  type: 'container',
  styles: {},
  content: [],
}

describe('isFirstSectionHeaderOverlaySafe', () => {
  it('is true when the first section carries the marker', () => {
    expect(isFirstSectionHeaderOverlaySafe([heroSafe, heroCompact])).toBe(true)
  })

  it('is false when the first section lacks the marker', () => {
    // A marked hero further down must not enable the overlay.
    expect(isFirstSectionHeaderOverlaySafe([heroCompact, heroSafe])).toBe(false)
  })

  it('skips a leading breadcrumb on sub-pages', () => {
    expect(isFirstSectionHeaderOverlaySafe([breadcrumb, heroSafe])).toBe(true)
    expect(isFirstSectionHeaderOverlaySafe([breadcrumb, heroCompact])).toBe(false)
  })

  it('requires the marker to be literally true', () => {
    const truthyString = { ...heroCompact, headerOverlaySafe: 'true' }
    expect(isFirstSectionHeaderOverlaySafe([truthyString])).toBe(false)
  })

  it('reads the marker from props when not top-level', () => {
    const viaProps = {
      id: 'h3',
      name: 'Hero',
      type: 'container',
      props: { headerOverlaySafe: true },
      styles: {},
      content: [],
    }
    expect(isFirstSectionHeaderOverlaySafe([viaProps])).toBe(true)
  })

  it('handles empty and malformed schemas', () => {
    expect(isFirstSectionHeaderOverlaySafe([])).toBe(false)
    expect(isFirstSectionHeaderOverlaySafe(null)).toBe(false)
    expect(isFirstSectionHeaderOverlaySafe(undefined)).toBe(false)
    expect(isFirstSectionHeaderOverlaySafe({} as never)).toBe(false)
  })

  it('unwraps a __body root and reads the FIRST real section', () => {
    // The served body wraps sections in a single `__body` node; the marker is
    // on the hero INSIDE it, not on the wrapper. This was the real bug: the
    // wrapper carries no marker, so detection returned false.
    const wrapped = {
      elements: [
        {
          id: 'body',
          name: 'Body',
          type: '__body',
          styles: {},
          content: [heroSafe, heroCompact],
        },
      ],
    }
    expect(isFirstSectionHeaderOverlaySafe(wrapped as never)).toBe(true)

    const wrappedCompactFirst = {
      elements: [
        { id: 'body', name: 'Body', type: '__body', styles: {}, content: [heroCompact, heroSafe] },
      ],
    }
    expect(isFirstSectionHeaderOverlaySafe(wrappedCompactFirst as never)).toBe(false)
  })

  it('unwraps a __body root that also has a leading breadcrumb', () => {
    const wrapped = {
      elements: [
        {
          id: 'body',
          name: 'Body',
          type: '__body',
          styles: {},
          content: [breadcrumb, heroSafe],
        },
      ],
    }
    expect(isFirstSectionHeaderOverlaySafe(wrapped as never)).toBe(true)
  })
})
