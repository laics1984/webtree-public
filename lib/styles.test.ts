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
