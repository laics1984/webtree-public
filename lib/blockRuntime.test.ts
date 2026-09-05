import { describe, expect, it } from 'vitest'

import { getHeadingTag } from './blockRuntime'

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
