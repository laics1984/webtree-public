import { describe, expect, it } from 'vitest'
import { buildCssVars } from './styles'

describe('buildCssVars page width', () => {
  it('emits the px cap for contained pages', () => {
    const vars = buildCssVars({ page: { widthMode: 'contained', maxWidth: 1280 } })
    expect(vars['--builder-page-max-width']).toBe('1280px')
  })

  it('collapses the cap to 100% for full-width pages so section gutters hit their floor', () => {
    const vars = buildCssVars({ page: { widthMode: 'full', maxWidth: 1280 } })
    expect(vars['--builder-page-max-width']).toBe('100%')
  })

  it('tolerates snake_case width_mode payloads', () => {
    const vars = buildCssVars({ page: { width_mode: 'full', maxWidth: 1440 } })
    expect(vars['--builder-page-max-width']).toBe('100%')
  })

  it('defaults to the contained cap when page tokens are missing', () => {
    expect(buildCssVars(null)['--builder-page-max-width']).toBe('1280px')
    expect(buildCssVars({})['--builder-page-max-width']).toBe('1280px')
  })
})
