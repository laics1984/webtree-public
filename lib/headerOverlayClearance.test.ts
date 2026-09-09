import { describe, expect, it } from 'vitest'
import {
  applyHeaderOverlayClearance,
  isHeroHeightFull,
  withHeaderOverlayClearance,
} from './headerOverlayClearance'
import type { PublicBlockNode } from '~/types/public'

// What PublicSiteShell passes down: the header's own minHeight plus the buffer.
const CLEARANCE = 'calc(96px + 32px)'
const HERO_FULL_MIN_HEIGHT = 'min(100dvh, 900px)'

const hero = (styles: Record<string, unknown>, extra: Record<string, unknown> = {}): PublicBlockNode => ({
  id: 'hero',
  name: 'Hero - Centered',
  type: 'container',
  styles,
  content: [],
  ...extra,
})

const breadcrumb: PublicBlockNode = {
  id: 'crumb',
  name: 'Breadcrumb',
  type: 'container',
  styles: { paddingTop: '16px' },
  content: [],
}

const bodyRoot = (sections: PublicBlockNode[]): PublicBlockNode => ({
  id: 'body',
  name: 'Body',
  type: '__body',
  styles: {},
  content: sections,
})

const styleOf = (node: PublicBlockNode, key: string) =>
  (node.styles as Record<string, unknown>)[key]

describe('applyHeaderOverlayClearance', () => {
  // Most catalog heroes size to their content: no height, no minHeight, just
  // padding. Growing a height they don't have moved nothing, so the header
  // used to sit on top of their heading.
  it('gives a content-sized hero the clearance as top padding', () => {
    const spaced = applyHeaderOverlayClearance(
      hero({ paddingTop: '96px', paddingBottom: '96px' }),
      CLEARANCE
    )

    expect(styleOf(spaced, 'paddingTop')).toBe(`calc(96px + ${CLEARANCE})`)
    expect(styleOf(spaced, 'paddingBottom')).toBe('96px')
    expect(styleOf(spaced, 'height')).toBeUndefined()
    expect(styleOf(spaced, 'minHeight')).toBeUndefined()
  })

  it('keeps the clearance on breakpoints that override the top padding', () => {
    const spaced = applyHeaderOverlayClearance(
      hero({ paddingTop: '96px' }, {
        responsiveStyles: {
          mobile: { paddingTop: '56px', gap: '32px' },
          // No top padding of its own: inherits the grown base.
          tablet: { gap: '28px' },
        },
      }),
      CLEARANCE
    )

    const responsive = spaced.responsiveStyles as Record<string, Record<string, unknown>>
    expect(responsive.mobile).toEqual({ paddingTop: `calc(56px + ${CLEARANCE})`, gap: '32px' })
    expect(responsive.tablet).toEqual({ gap: '28px' })
  })

  it('falls back to the clearance itself when the hero states no top padding', () => {
    const spaced = applyHeaderOverlayClearance(hero({ display: 'flex' }), CLEARANCE)

    expect(styleOf(spaced, 'paddingTop')).toBe(CLEARANCE)
  })

  it('grows a banded hero by twice the clearance and centres it', () => {
    const spaced = applyHeaderOverlayClearance(
      hero({ minHeight: '480px', paddingTop: '128px' }),
      CLEARANCE
    )

    expect(styleOf(spaced, 'minHeight')).toBe(`calc(480px + calc((${CLEARANCE}) * 2))`)
    expect(styleOf(spaced, 'justifyContent')).toBe('center')
    // The height carries the clearance here — padding must not add it twice.
    expect(styleOf(spaced, 'paddingTop')).toBe('128px')
  })

  it('only centres a full-screen hero', () => {
    const styles = { minHeight: HERO_FULL_MIN_HEIGHT, paddingTop: '140px' }
    const spaced = applyHeaderOverlayClearance(hero(styles), CLEARANCE)

    expect(spaced.styles).toEqual({ ...styles, justifyContent: 'center' })
  })

  it('writes styles back where the payload keeps them', () => {
    const nested: PublicBlockNode = {
      id: 'hero',
      name: 'Hero',
      type: 'container',
      props: { styles: { paddingTop: '96px' } },
    }
    const spaced = applyHeaderOverlayClearance(nested, CLEARANCE)

    // Setting a top-level `styles` would win over props.styles and drop
    // everything else the node declares there.
    expect(spaced.styles).toBeUndefined()
    expect((spaced.props as Record<string, Record<string, unknown>>).styles.paddingTop).toBe(
      `calc(96px + ${CLEARANCE})`
    )
  })
})

describe('withHeaderOverlayClearance', () => {
  // The served body wraps its sections in a `__body` root. Spacing the wrapper
  // instead of the hero inside it is what made the whole pass a no-op on
  // published pages.
  it('reaches through the body root to the first section', () => {
    const [root] = withHeaderOverlayClearance(
      [bodyRoot([hero({ paddingTop: '96px' }), hero({ paddingTop: '48px' })])],
      CLEARANCE
    )

    const sections = root.content as PublicBlockNode[]
    expect(styleOf(root, 'paddingTop')).toBeUndefined()
    expect(styleOf(sections[0], 'paddingTop')).toBe(`calc(96px + ${CLEARANCE})`)
    expect(styleOf(sections[1], 'paddingTop')).toBe('48px')
  })

  // A sub-page opens with its breadcrumb, and THAT is what the header covers
  // — pushing the hero below it down does nothing for the breadcrumb.
  it('clears a leading breadcrumb rather than the hero behind it', () => {
    const [root] = withHeaderOverlayClearance(
      [bodyRoot([breadcrumb, hero({ paddingTop: '96px' })])],
      CLEARANCE
    )

    const sections = root.content as PublicBlockNode[]
    expect(styleOf(sections[0], 'paddingTop')).toBe(`calc(16px + ${CLEARANCE})`)
    expect(styleOf(sections[1], 'paddingTop')).toBe('96px')
  })

  it('pays a non-hero band out of padding, never out of its own height', () => {
    const band = {
      id: 'band',
      name: 'Feature Band',
      type: 'container',
      styles: { minHeight: '480px', paddingTop: '64px', justifyContent: 'flex-start' },
      content: [],
    } as PublicBlockNode

    const [spaced] = withHeaderOverlayClearance([band], CLEARANCE)

    expect(styleOf(spaced, 'minHeight')).toBe('480px')
    expect(styleOf(spaced, 'paddingTop')).toBe(`calc(64px + ${CLEARANCE})`)
    expect(styleOf(spaced, 'justifyContent')).toBe('flex-start')
  })

  it('spaces a flat section list too', () => {
    const [first] = withHeaderOverlayClearance([hero({ paddingTop: '96px' })], CLEARANCE)

    expect(styleOf(first, 'paddingTop')).toBe(`calc(96px + ${CLEARANCE})`)
  })

  it('returns the tree untouched when there is no clearance to spend', () => {
    const nodes = [bodyRoot([hero({ paddingTop: '96px' })])]

    expect(withHeaderOverlayClearance(nodes, null)).toBe(nodes)
    expect(withHeaderOverlayClearance(nodes, undefined)).toBe(nodes)
    expect(withHeaderOverlayClearance([], CLEARANCE)).toEqual([])
  })

  it('leaves the caller\'s nodes alone', () => {
    const section = hero({ paddingTop: '96px' })
    const nodes = [bodyRoot([section])]
    withHeaderOverlayClearance(nodes, CLEARANCE)

    expect(section.styles).toEqual({ paddingTop: '96px' })
  })
})

describe('isHeroHeightFull', () => {
  it('reads the site-wide hero height behind the var', () => {
    const styles = { minHeight: `var(--builder-hero-min-height, ${HERO_FULL_MIN_HEIGHT})` }

    expect(isHeroHeightFull(styles, undefined)).toBe(true)
    expect(isHeroHeightFull(styles, '460px')).toBe(false)
  })

  it('lets a fixed pixel height win over any minHeight', () => {
    expect(isHeroHeightFull({ height: '520px', minHeight: HERO_FULL_MIN_HEIGHT }, undefined)).toBe(false)
  })

  it('treats a hero with no height at all as not full', () => {
    expect(isHeroHeightFull({}, undefined)).toBe(false)
    expect(isHeroHeightFull(undefined, undefined)).toBe(false)
  })
})
