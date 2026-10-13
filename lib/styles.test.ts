import { describe, expect, it } from 'vitest'
import { buildCssVars, hasOwnTextColor } from './styles'

describe('buildCssVars page width', () => {
  it('emits the px cap for contained pages', () => {
    const vars = buildCssVars({ page: { widthMode: 'contained', maxWidth: 1280 } })
    expect(vars['--builder-page-max-width']).toBe('1280px')
  })

  it('keeps the configured cap on full-width pages (full only bleeds backgrounds)', () => {
    // "Full" stretches section backgrounds via `.wt-site max-width: none`;
    // the content column stays pinned to the configured width so it lines up
    // with the header/footer. See the comment in lib/styles.ts.
    const vars = buildCssVars({ page: { widthMode: 'full', maxWidth: 1280 } })
    expect(vars['--builder-page-max-width']).toBe('1280px')
  })

  it('tolerates snake_case width_mode payloads', () => {
    const vars = buildCssVars({ page: { width_mode: 'full', maxWidth: 1440 } })
    expect(vars['--builder-page-max-width']).toBe('1440px')
  })

  it('defaults to the contained cap when page tokens are missing', () => {
    expect(buildCssVars(null)['--builder-page-max-width']).toBe('1280px')
    expect(buildCssVars({})['--builder-page-max-width']).toBe('1280px')
  })
})

describe('buildCssVars hero height', () => {
  it('emits the hero min-height token when set (banded)', () => {
    const vars = buildCssVars({ hero: { minHeight: '460px' } })
    expect(vars['--builder-hero-min-height']).toBe('460px')
  })

  it('omits the token when absent so the template keeps its full-screen fallback', () => {
    expect(buildCssVars(null)['--builder-hero-min-height']).toBeUndefined()
    expect(buildCssVars({})['--builder-hero-min-height']).toBeUndefined()
  })
})

describe('buildCssVars hero typography (Apply to all heroes)', () => {
  // Size only — font family already cascades via --builder-font-heading/
  // --builder-font-body, so it's deliberately not part of this token set.
  it('emits the hero typography size tokens when set', () => {
    const vars = buildCssVars({
      heroTypography: {
        headingSize: 'clamp(40px, 5vw, 72px)',
        bodySize: '20px',
      },
    })
    expect(vars['--builder-hero-heading-size']).toBe('clamp(40px, 5vw, 72px)')
    expect(vars['--builder-hero-body-size']).toBe('20px')
  })

  it('emits only the tokens that are set, omitting the rest', () => {
    const vars = buildCssVars({ heroTypography: { headingSize: '64px' } })
    expect(vars['--builder-hero-heading-size']).toBe('64px')
    expect(vars['--builder-hero-body-size']).toBeUndefined()
  })

  it('omits all hero typography tokens when absent', () => {
    expect(buildCssVars(null)['--builder-hero-heading-size']).toBeUndefined()
    expect(buildCssVars({})['--builder-hero-body-size']).toBeUndefined()
  })
})

describe('buildCssVars heading ink', () => {
  const heading = (colors: Record<string, string>) =>
    buildCssVars({ colors })['--builder-color-heading']

  it('is the secondary colour wherever it reads on the background', () => {
    expect(heading({ secondary: '#1d2b27', text: '#1c1917', background: '#ffffff' })).toBe('#1d2b27')
  })

  // A dark palette's secondary is its darkest band colour (Feruni: 1.04:1).
  it('falls back to the text colour on a dark palette', () => {
    expect(heading({ secondary: '#050403', text: '#fafaf9', background: '#0c0a09' })).toBe('#fafaf9')
  })

  it('keeps the secondary colour when it cannot be measured', () => {
    expect(heading({ secondary: 'rgb(5, 4, 3)', text: '#fafaf9', background: '#0c0a09' })).toBe('rgb(5, 4, 3)')
  })
})

// Golden values from site-generator app/services/theme.py `_neutral_inks`, so
// the renderer and the generator agree on what "the palette's light ink" is.
describe('buildCssVars copy inks', () => {
  const inks = (colors: Record<string, string>) => {
    const vars = buildCssVars({ colors })
    return [vars['--builder-color-ink-light'], vars['--builder-color-ink-dark']]
  }

  it("is a light build's brand-tinted surface, never a stock white", () => {
    expect(
      inks({ background: '#ffffff', surface: '#f0f9ff', text: '#0f172a', secondary: '#0f172a' })
    ).toEqual(['#f0f9ff', '#0f172a'])
  })

  it("is a dark build's own body text and its darkest band", () => {
    expect(
      inks({ background: '#090d16', surface: '#141a28', text: '#e5e9ee', secondary: '#05080f' })
    ).toEqual(['#e5e9ee', '#05080f'])
  })

  it('takes the more tinted of two near-whites', () => {
    expect(
      inks({ background: '#ffffff', surface: '#fafaf9', text: '#0c0a09', secondary: '#0c0a09' })
    ).toEqual(['#fafaf9', '#0c0a09'])
  })
})

describe('buildCssVars muted ink', () => {
  const muted = (colors: Record<string, string>) => buildCssVars({ colors })['--wt-color-muted']

  it('keeps the grey on a light palette, where it already reads', () => {
    expect(muted({ background: '#ffffff' })).toBe('#6b7280')
    expect(muted({ background: '#fbf8f3' })).toBe('#6b7280')
  })

  // #6b7280 is 4.09:1 on Feruni's page; #727988 is 4.52:1.
  it('lifts the grey to AA on a dark palette', () => {
    expect(muted({ background: '#0c0a09' })).toBe('#727988')
  })

  it('never overrides a muted colour the palette states', () => {
    expect(muted({ background: '#0c0a09', muted: '#a8a29e' })).toBe('#a8a29e')
  })
})

describe('buildCssVars primary tint', () => {
  const tint = (colors: Record<string, string>) => {
    const vars = buildCssVars({ colors })
    return { tint: vars['--builder-color-primary-tint'], ink: vars['--builder-color-primary-tint-ink'] }
  }
  // An independent WCAG oracle, so the guarantee is not checked by the code it tests.
  const luminance = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  const contrast = (a: string, b: string) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
    return (hi + 0.05) / (lo + 0.05)
  }

  it('is primary washed into the background, opaque', () => {
    expect(tint({ primary: '#0284c7', background: '#ffffff' }).tint).toBe('#e6f3f9')
    expect(tint({ primary: '#0e7490', background: '#041619' }).tint).toBe('#051f25')
  })

  // The contact form's Required marker was 2.2:1: the brand ink was held to
  // AA on the bare background, and the chip's tint sits between them.
  it('holds the brand ink to AA on the tint, not just on the background', () => {
    for (const colors of [
      { primary: '#0284c7', background: '#ffffff' },
      { primary: '#ca8a04', background: '#ffffff', primaryInk: '#986803' }, // 4.41:1 on the tint
      { primary: '#ca8a04', background: '#fefce8' },
      { primary: '#0e7490', background: '#041619' },
    ]) {
      const pair = tint(colors)
      expect(contrast(pair.ink, pair.tint), JSON.stringify(colors)).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('keeps the brand ink wherever it already reads on the tint', () => {
    expect(tint({ primary: '#0284c7', background: '#ffffff', primaryInk: '#0273ae' }).ink).toBe('#0273ae')
    expect(tint({ primary: '#0e7490', background: '#041619', primaryInk: '#abe7f7' }).ink).toBe('#abe7f7')
  })

  it('degrades to the background and the brand ink when a colour cannot be measured', () => {
    expect(tint({ primary: 'rgb(2, 132, 199)', background: '#ffffff', primaryInk: '#0273ae' }))
      .toEqual({ tint: '#ffffff', ink: '#0273ae' })
  })
})

describe('hasOwnTextColor', () => {
  // The colour every builder element is created with reads as "Default".
  it('is false for the default text-colour token, with or without a fallback', () => {
    expect(hasOwnTextColor({ color: 'var(--builder-color-text, #111827)' })).toBe(false)
    expect(hasOwnTextColor({ color: 'var(--builder-color-text)' })).toBe(false)
  })

  it('is true for any colour someone chose', () => {
    expect(hasOwnTextColor({ color: '#e11d48' })).toBe(true)
    expect(hasOwnTextColor({ color: 'var(--builder-color-primary)' })).toBe(true)
  })

  it('is false without a colour', () => {
    expect(hasOwnTextColor({})).toBe(false)
    expect(hasOwnTextColor(null)).toBe(false)
  })
})
