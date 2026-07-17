import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  backgroundImageForTexture,
  getNodeBackgroundTexture,
  grainDataUri,
  grainDataUriRaw,
  resolveColorToHex,
  resolvePageBackgroundHex,
  resolvePaletteHex,
  resolveSectionBackgroundImage,
  resolveThemeTexture,
  sampleMeshEdgeStops,
} from './backgroundTexture'

// The two grain helpers exist because their consumers need different forms:
// CSS `background-image` wants `url("data:...")`, an SVG `<image href>` wants
// the bare `data:` URI. Feeding the CSS form to <image href> makes the browser
// resolve it as a relative URL, so the grain silently never paints.
describe('grainDataUriRaw / grainDataUri', () => {
  it('returns a bare data URI, valid for an SVG <image href>', () => {
    const raw = grainDataUriRaw()
    expect(raw).toMatch(/^data:image\/svg\+xml;base64,[A-Za-z0-9+/=]+$/)
    expect(raw).not.toContain('url(')
  })

  it('wraps the same payload in url("...") for CSS', () => {
    expect(grainDataUri()).toBe(`url("${grainDataUriRaw()}")`)
  })

  it('encodes the 140x140 fractal-noise SVG at the given opacity', () => {
    const payload = grainDataUriRaw(0.42).replace('data:image/svg+xml;base64,', '')
    const svg = Buffer.from(payload, 'base64').toString('utf-8')
    expect(svg).toContain("width='140' height='140'")
    expect(svg).toContain("type='fractalNoise'")
    expect(svg).toContain("opacity='0.42'")
  })

  // Pins the markup to grain_data_uri() in schema_builder.py. Python lowered
  // its default 0.55 -> 0.20 and these mirrors silently kept 0.55, so the bake
  // and the live recompute drew grain at different strengths.
  it('defaults to the same opacity Python bakes', () => {
    const payload = grainDataUriRaw().replace('data:image/svg+xml;base64,', '')
    expect(Buffer.from(payload, 'base64').toString('utf-8')).toContain("opacity='0.2'")
  })
})

// No component-test harness in this repo, so pin the call site at the source
// level: SectionDivider.vue's <image href> must use the raw variant. A lib-only
// test still passes if the component reverts to the CSS-wrapped helper.
describe('SectionDivider.vue grain <image href>', () => {
  it('binds the raw data URI, not the CSS url(...) form', () => {
    const source = readFileSync(
      fileURLToPath(new URL('../components/blocks/SectionDivider.vue', import.meta.url)),
      'utf-8'
    )
    expect(source).toContain(':href="grainDataUriRaw()"')
    expect(source).not.toContain(':href="grainDataUri()"')
  })
})

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
