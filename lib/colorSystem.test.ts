import { describe, expect, it } from 'vitest'
import fixtures from './colorSystem.fixtures.json'
import { colorContrast, deriveThemeColors, ensureColorContrast, fromOklch, toOklch } from './colorSystem'
import { buildCssVars } from './styles'

describe('versioned semantic colors', () => {
  for (const [index, fixture] of fixtures.entries()) {
    it(`matches the Python numerical fixture ${index}`, () => {
      expect(deriveThemeColors(fixture.colors)).toEqual(fixture.expected)
      const tokens = deriveThemeColors(fixture.colors)
      const vars = buildCssVars({colorSystemVersion:2, colors:fixture.colors})
      for(const [key,value] of Object.entries(fixture.expected)) expect(vars['--builder-color-'+key]).toBe(value)
      expect(vars['--wt-color-muted']).toBe(tokens['text-muted'])
      expect(colorContrast(vars['--wt-color-surface-ink'],'#ffffff')).toBeGreaterThanOrEqual(4.5)
      for (const [key, value] of Object.entries(tokens)) {
        if (key.startsWith('on-')) expect(colorContrast(value, tokens[key.slice(3)]),key).toBeGreaterThanOrEqual(4.5)
      }
      expect(colorContrast(tokens['border-strong'],tokens.background)).toBeGreaterThanOrEqual(3)
      for(const surface of ['background','surface','surface-inverse','primary','secondary','accent','band-1','band-2','band-3','band-4']) {
        expect(colorContrast(tokens['error-ink-on-'+surface],tokens[surface])).toBeGreaterThanOrEqual(4.5)
        for(const brand of ['primary','secondary','accent']) expect(colorContrast(tokens[brand+'-border-on-'+surface],tokens[surface])).toBeGreaterThanOrEqual(3)
      }
    })
  }
  it('round-trips sRGB primaries and neutrals', () => {
    expect(colorContrast('#ffffff','#000000')).toBe(21)
    for (const color of ['#ff0000','#00ff00','#0000ff','#000000','#ffffff','#c4775a']) {
      expect(fromOklch(...toOklch(color))).toBe(color)
      expect(colorContrast(ensureColorContrast(color,'#5e7688'),'#5e7688')).toBeGreaterThanOrEqual(4.5)
    }
  })
  it('recomputes derived inks after editing the canonical palette', () => {
    const first=fixtures[0].colors
    const edited={...first,primary:'#fff100'}
    const vars=buildCssVars({colorSystemVersion:2,colors:edited})
    expect(vars['--builder-color-primary']).toBe('#fff100')
    expect(colorContrast(vars['--builder-color-on-primary'],vars['--builder-color-primary'])).toBeGreaterThanOrEqual(4.5)
    expect(vars['--builder-color-primary-ink']).not.toBe(first.primary)
  })
  it('keeps custom buttons readable in every interaction state', () => {
    const vars = buildCssVars({colorSystemVersion:2, colors:fixtures[0].colors, buttons:{background:'#fff100',text:'#ffffff'}})
    expect(colorContrast(vars['--builder-button-text'],vars['--builder-button-background'])).toBeGreaterThanOrEqual(4.5)
    for(const state of ['hover','active']) expect(colorContrast(vars['--builder-button-on-'+state],vars['--builder-button-'+state])).toBeGreaterThanOrEqual(4.5)
  })
  it('renders a button still on the old automatic pair with the button pair', () => {
    for (const fixture of fixtures) {
      const d = fixture.expected
      const vars = buildCssVars({colorSystemVersion:2, colors:fixture.colors, buttons:{background:d.primary, text:d['on-primary']}})
      expect(vars['--builder-button-background'], fixture.colors.primary).toBe(d['primary-button'])
      expect(vars['--builder-button-text'], fixture.colors.primary).toBe(d['on-primary-button'])
    }
  })
  it('leaves a button someone chose as it is', () => {
    const vars = buildCssVars({colorSystemVersion:2, colors:fixtures[0].colors, buttons:{background:'#774422', text:'#ffffff'}})
    expect(vars['--builder-button-background']).toBe('#774422')
    expect(vars['--builder-button-text']).toBe('#ffffff')
  })
  it('derives every role whether or not the payload carries a version', () => {
    expect(buildCssVars({colors:fixtures[0].colors})['--builder-color-surface-inverse']).toBe(fixtures[0].expected['surface-inverse'])
  })
  it('memoizes immutable variants, rather than recalculating for every node', () => {
    const a=deriveThemeColors(fixtures[0].colors)
    expect(deriveThemeColors({...fixtures[0].colors})).toBe(a)
    expect(Object.isFrozen(a)).toBe(true)
  })
})
