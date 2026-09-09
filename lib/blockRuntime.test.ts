import { describe, expect, it } from 'vitest'

import { getClampLines, getHeadingTag } from './blockRuntime'

describe('getHeadingTag', () => {
  it('is null for a plain container, so the tag stays structural', () => {
    expect(getHeadingTag({ type: 'container' })).toBeNull()
    expect(getHeadingTag(null)).toBeNull()
  })

  it('reads a heading tag off the node', () => {
    // The generator tags the split-headline GROUP, so both lines of a two-line
    // title render inside one <h1>.
    expect(getHeadingTag({ type: 'container', htmlTag: 'h1' })).toBe('h1')
    expect(getHeadingTag({ type: 'container', htmlTag: 'H2' })).toBe('h2')
  })

  it('ignores anything that is not h1-h6', () => {
    // htmlTag arrives from a stored payload; a container may present itself as
    // a heading and nothing else.
    for (const tag of ['div', 'span', 'script', 'section', 'a', '']) {
      expect(getHeadingTag({ type: 'container', htmlTag: tag })).toBeNull()
    }
  })

  it('reads the props record too, like every other node field', () => {
    expect(getHeadingTag({ type: 'container', props: { htmlTag: 'h3' } })).toBe('h3')
  })
})

describe('getClampLines', () => {
  it('reads the clamp off the node\'s own line-clamp style', () => {
    expect(getClampLines({ styles: { WebkitLineClamp: '4' } })).toBe(4)
    expect(getClampLines({ styles: { WebkitLineClamp: 4 } })).toBe(4)
  })

  it('is null when nothing clamps', () => {
    expect(getClampLines({ styles: { fontSize: '14px' } })).toBeNull()
    expect(getClampLines({})).toBeNull()
    expect(getClampLines(null)).toBeNull()
    expect(getClampLines(undefined)).toBeNull()
  })

  it('treats unset, none and nonsense as no clamp', () => {
    // Expanding writes `unset`; reading that back as a clamp would re-offer
    // the toggle on text that is already fully shown.
    for (const value of ['unset', 'none', 'initial', 'inherit', '', 'abc', '0', '-2']) {
      expect(getClampLines({ styles: { WebkitLineClamp: value } })).toBeNull()
    }
  })

  it('does not read the retired wt-clamp marker class', () => {
    // The clamp used to be declared twice — a marker class beside the style —
    // so one behaviour had two sources of truth and only the class was read.
    expect(getClampLines({ classes: 'wt-clamp wt-clamp-4' })).toBeNull()
  })

  it('still clamps a site published with BOTH the class and the style', () => {
    // Already-published payloads carry the marker; they keep their toggle with
    // no regeneration, which is why the class check could simply be dropped.
    expect(getClampLines({ classes: 'wt-clamp wt-clamp-4', styles: { WebkitLineClamp: '4' } })).toBe(4)
  })

  it('reads the props record too, like every other node field', () => {
    expect(getClampLines({ props: { styles: { WebkitLineClamp: '3' } } })).toBe(3)
  })
})
