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

// An independent WCAG oracle, so the guarantees are not checked by the code
// they test.
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}
const LIGHT = { primary: '#0284c7', secondary: '#0f172a', accent: '#f59e0b', text: '#0f172a', background: '#ffffff', surface: '#f0f9ff' }
// Feruni's dark palette: its secondary is the darkest band colour (1.04:1).
const DARK = { primary: '#0e7490', secondary: '#050403', accent: '#f59e0b', text: '#fafaf9', background: '#0c0a09', surface: '#141a28' }

describe('buildCssVars colour roles', () => {
  it('reads every heading on the page, light or dark', () => {
    for (const colors of [LIGHT, DARK]) {
      const vars = buildCssVars({ colors })
      expect(contrast(vars['--builder-color-heading'], colors.background)).toBeGreaterThanOrEqual(4.5)
    }
  })

  it("gives copy the brand's own near-white and a dark ink, never a stock white", () => {
    for (const colors of [LIGHT, DARK]) {
      const vars = buildCssVars({ colors })
      const [light, dark] = [vars['--builder-color-ink-light'], vars['--builder-color-ink-dark']]
      expect(light).not.toBe('#ffffff')
      expect(contrast(light, dark)).toBeGreaterThanOrEqual(7)
    }
  })

  it('holds muted copy to AA on the page', () => {
    for (const colors of [LIGHT, DARK]) {
      expect(contrast(buildCssVars({ colors })['--wt-color-muted'], colors.background)).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('never overrides a muted colour the palette states where it reads', () => {
    expect(buildCssVars({ colors: { ...DARK, muted: '#a8a29e' } })['--wt-color-muted']).toBe('#a8a29e')
  })

  // The contact form's Required marker was 2.2:1: the brand ink was held to
  // AA on the bare background, and the chip's tint sits between them.
  it('paints an opaque primary tint and holds its ink to AA on it', () => {
    for (const colors of [LIGHT, DARK, { ...LIGHT, primary: '#ca8a04', background: '#fefce8' }]) {
      const vars = buildCssVars({ colors })
      expect(vars['--builder-color-primary-tint']).toMatch(/^#[0-9a-f]{6}$/)
      expect(contrast(vars['--builder-color-primary-tint-ink'], vars['--builder-color-primary-tint']), JSON.stringify(colors))
        .toBeGreaterThanOrEqual(4.5)
    }
  })

  it('emits the raw colours, and no derived role, when one cannot be measured', () => {
    const vars = buildCssVars({ colors: { ...LIGHT, secondary: 'rgb(5, 4, 3)' } })
    expect(vars['--builder-color-secondary']).toBe('rgb(5, 4, 3)')
    expect(vars['--builder-color-heading']).toBeUndefined()
  })
})

describe('buildCssVars design manifest', () => {
  // The generator's decision record rides in BuilderStyles. Flattened into the
  // root's server-rendered `style` attribute, one apostrophe in it opened a CSS
  // string that swallowed every later declaration: buttons went default blue.
  const styles = {
    colors: { primary: '#c2410c', background: '#ffffff' },
    buttons: { background: '#c2410c', text: '#ffffff' },
    designManifest: {
      seed: "St. Mary's",
      direction: { slug: 'warm-heritage', brief: "the school's own photographs, framed" },
    },
  }

  it('never becomes custom properties', () => {
    const names = Object.keys(buildCssVars(styles))
    expect(names.filter((name) => name.startsWith('--wt-design-manifest'))).toEqual([])
    expect(names).toContain('--wt-colors-primary') // the tokens beside it still flatten
  })

  it('leaves the button tokens and every value safe to serialise', () => {
    const vars = buildCssVars(styles)
    expect(vars['--builder-button-background']).toBe('#c2410c')
    for (const [name, value] of Object.entries(vars)) {
      expect(value.split("'").length % 2, name).toBe(1)
      expect(value.split('"').length % 2, name).toBe(1)
    }
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
