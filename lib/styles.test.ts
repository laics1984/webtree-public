import { describe, expect, it } from 'vitest'
import { buildCssVars } from './styles'

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
