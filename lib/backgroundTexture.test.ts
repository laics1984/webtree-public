import { describe, expect, it } from 'vitest'
import {
  backgroundImageForTexture,
  getNodeBackgroundTexture,
  resolveColorToHex,
  resolvePageBackgroundHex,
  resolvePaletteHex,
  resolveSectionBackgroundImage,
  resolveThemeTexture,
  sampleMeshEdgeStops,
} from './backgroundTexture'

describe('backgroundImageForTexture', () => {
  it('returns null for flat/absent', () => {
    expect(backgroundImageForTexture('flat', '#2563eb')).toBeNull()
    expect(backgroundImageForTexture(null, '#2563eb')).toBeNull()
    expect(backgroundImageForTexture(undefined, '#2563eb')).toBeNull()
  })

  it('returns a single grain layer for grain', () => {
    const value = backgroundImageForTexture('grain', '#2563eb')
    expect(value).toMatch(/^url\("data:image\/svg\+xml;base64,/)
  })

  it('returns a single mesh layer for mesh', () => {
    const value = backgroundImageForTexture('mesh', '#2563eb')
    expect(value).toContain('radial-gradient')
    expect(value).not.toContain('url(')
  })

  it('layers grain then mesh for mesh+grain', () => {
    const value = backgroundImageForTexture('mesh+grain', '#2563eb')
    expect(value).toMatch(/^url\("data:image\/svg\+xml;base64,.*radial-gradient/s)
  })
})

describe('resolveSectionBackgroundImage', () => {
  const ctx = {
    primaryHex: '#2563eb',
    themeTexture: 'grain' as const,
    plainBackgroundHexes: ['#ffffff', '#f8fafc'],
  }

  it('an explicit override always wins, even flat', () => {
    expect(
      resolveSectionBackgroundImage({ backgroundTexture: 'flat' }, ctx)
    ).toBeNull()
    expect(
      resolveSectionBackgroundImage({ backgroundTexture: 'mesh' }, ctx)
    ).toContain('radial-gradient')
  })

  it('falls back to the theme default when the section sits on a plain background', () => {
    const value = resolveSectionBackgroundImage(
      { backgroundColorHex: '#ffffff' },
      ctx
    )
    expect(value).toMatch(/^url\("data:image\/svg\+xml;base64,/)
  })

  it('leaves a non-plain, non-overridden section untouched (undefined)', () => {
    expect(
      resolveSectionBackgroundImage({ backgroundColorHex: '#ff00aa' }, ctx)
    ).toBeUndefined()
    expect(resolveSectionBackgroundImage({}, ctx)).toBeUndefined()
  })
})

describe('resolvePaletteHex / resolvePageBackgroundHex / resolveThemeTexture', () => {
  it('reads literal hex colors and the theme texture default off PublicStyleTokens', () => {
    const styles = {
      colors: { primary: '#112233', surface: '#445566', background: '#778899' },
      page: { background: '#aabbcc' },
      backgroundTexture: 'mesh',
    }
    const palette = resolvePaletteHex(styles)
    expect(palette.primary).toBe('#112233')
    expect(palette.surface).toBe('#445566')
    expect(resolvePageBackgroundHex(styles, palette)).toBe('#aabbcc')
    expect(resolveThemeTexture(styles)).toBe('mesh')
  })

  it('falls back to sane defaults when builderStyles is missing', () => {
    const palette = resolvePaletteHex(null)
    expect(palette.primary).toBe('#2563eb')
    expect(resolvePageBackgroundHex(null, palette)).toBe(palette.background)
    expect(resolveThemeTexture(null)).toBe('flat')
    expect(resolveThemeTexture({ backgroundTexture: 'not-a-real-strategy' })).toBe('flat')
  })
})

describe('resolveColorToHex', () => {
  const palette = resolvePaletteHex({ colors: { primary: '#112233', surface: '#445566' } })
  const pageBackgroundHex = '#aabbcc'

  it('resolves a builder color token to the palette hex', () => {
    expect(resolveColorToHex('var(--builder-color-primary)', palette, pageBackgroundHex)).toBe(
      '#112233'
    )
  })

  it('resolves the page background token', () => {
    expect(
      resolveColorToHex('var(--builder-page-background, #ffffff)', palette, pageBackgroundHex)
    ).toBe(pageBackgroundHex)
  })

  it('passes through a literal hex color', () => {
    expect(resolveColorToHex('#FF0000', palette, pageBackgroundHex)).toBe('#ff0000')
  })

  it('falls back to white for an unparseable value', () => {
    expect(resolveColorToHex(null, palette, pageBackgroundHex)).toBe('#ffffff')
    expect(resolveColorToHex('not-a-color', palette, pageBackgroundHex)).toBe('#ffffff')
  })
})

describe('sampleMeshEdgeStops', () => {
  it('samples the requested number of stops spanning 0-100%', () => {
    const stops = sampleMeshEdgeStops('#2563eb', '#ffffff', 'bottom', 5)
    expect(stops).toHaveLength(5)
    expect(stops[0].offsetPct).toBe(0)
    expect(stops[stops.length - 1].offsetPct).toBe(100)
    for (const stop of stops) {
      expect(stop.color).toMatch(/^rgb\(\d{1,3}, \d{1,3}, \d{1,3}\)$/)
    }
  })

  it('samples a different edge line for top vs bottom', () => {
    const bottom = sampleMeshEdgeStops('#2563eb', '#ffffff', 'bottom', 3)
    const top = sampleMeshEdgeStops('#2563eb', '#ffffff', 'top', 3)
    expect(bottom.map((s) => s.color)).not.toEqual(top.map((s) => s.color))
  })
})

describe('getNodeBackgroundTexture', () => {
  it('reads a valid texture value off the node', () => {
    expect(getNodeBackgroundTexture({ backgroundTexture: 'mesh+grain' })).toBe('mesh+grain')
  })

  it('returns undefined for an absent or invalid value', () => {
    expect(getNodeBackgroundTexture({})).toBeUndefined()
    expect(getNodeBackgroundTexture({ backgroundTexture: 'sparkles' })).toBeUndefined()
    expect(getNodeBackgroundTexture(null)).toBeUndefined()
  })
})
