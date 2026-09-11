import { describe, expect, it } from 'vitest'
import {
  BACKGROUND_VIDEO_POSTER_STYLE,
  BACKGROUND_VIDEO_SRC_STYLE,
  CONTENT_COVER_VAR,
  contentCoverStyle,
  getBackgroundVideoSettings,
  hasBackgroundImage,
  hasBackgroundVideo,
  isPhotoSource,
  usesContentCover,
} from './backgroundPhoto'
import type { PublicBlockNode } from '~/types/public'

describe('isPhotoSource', () => {
  it('detects a plain photo url', () => {
    expect(isPhotoSource("url('https://x.com/a.jpg')")).toBe(true)
  })

  it('detects an unquoted photo url', () => {
    expect(isPhotoSource('url(https://x.com/a.jpg)')).toBe(true)
  })

  it('detects a brand-tinted hero (gradient overlay + photo)', () => {
    // Mirrors schema_builder.py: `linear-gradient(overlay), url('photo')`.
    expect(
      isPhotoSource(
        "linear-gradient(135deg, rgba(0,0,0,.5), rgba(0,0,0,.4)), url('https://x/a.jpg')"
      )
    ).toBe(true)
  })

  it('detects a double-overlay hero', () => {
    expect(
      isPhotoSource("linear-gradient(rgba(0,0,0,.5), rgba(0,0,0,.5)), url('/img/a.jpg')")
    ).toBe(true)
  })

  it('ignores a pure mesh/aurora radial gradient', () => {
    expect(isPhotoSource('radial-gradient(at 20% 30%, #f0f 0, transparent 60%)')).toBe(false)
  })

  it('ignores a pure conic gradient', () => {
    expect(isPhotoSource('conic-gradient(from 90deg, #abc, #def)')).toBe(false)
  })

  it('ignores a grain/noise data-URI', () => {
    expect(isPhotoSource("url('data:image/svg+xml,%3Csvg/%3E')")).toBe(false)
  })

  it('ignores a grain data-URI that contains an internal url(#filter) ref', () => {
    // The real grain texture: an SVG with `filter='url(%23n)'` inside the data
    // URI. The nested url() must NOT be mistaken for a photo source.
    const grain =
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' " +
      "width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' " +
      "baseFrequency='0.85'/%3E%3C/filter%3E%3Crect width='100%' height='100%' " +
      "filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")"
    expect(isPhotoSource(grain)).toBe(false)
  })

  it('ignores a gradient combined with a grain data-URI', () => {
    expect(
      isPhotoSource("linear-gradient(#fff,#eee), url('data:image/svg+xml,%3Csvg/%3E')")
    ).toBe(false)
  })

  it('detects an uploaded photo stored as a raster data-URI', () => {
    // Local-only uploads (CMS upload disabled/unavailable) fall back to
    // FileReader data-URIs — these are real photos, not decorative textures.
    expect(isPhotoSource('url("data:image/png;base64,iVBORw0KGgo=")')).toBe(true)
    expect(isPhotoSource('url("data:image/jpeg;base64,/9j/4AAQ=")')).toBe(true)
    expect(isPhotoSource('url("data:image/webp;base64,UklGRg==")')).toBe(true)
  })

  it('ignores "none" and empty values', () => {
    expect(isPhotoSource('none')).toBe(false)
    expect(isPhotoSource('   ')).toBe(false)
  })
})

describe('hasBackgroundImage', () => {
  it('is true for a real photo', () => {
    expect(hasBackgroundImage({ backgroundImage: "url('a.jpg')" })).toBe(true)
  })

  it('is false for a gradient-only background', () => {
    expect(hasBackgroundImage({ backgroundImage: 'radial-gradient(#fff, #000)' })).toBe(false)
  })

  it('is false when backgroundImage is missing or non-string', () => {
    expect(hasBackgroundImage({})).toBe(false)
    expect(hasBackgroundImage(null)).toBe(false)
    expect(hasBackgroundImage({ backgroundImage: 123 })).toBe(false)
  })
})

describe('getBackgroundVideoSettings', () => {
  it('reads a bare src + poster url', () => {
    expect(
      getBackgroundVideoSettings({
        [BACKGROUND_VIDEO_SRC_STYLE]: 'https://x.com/bg.mp4',
        [BACKGROUND_VIDEO_POSTER_STYLE]: 'https://x.com/poster.jpg',
      })
    ).toEqual({ src: 'https://x.com/bg.mp4', poster: 'https://x.com/poster.jpg' })
  })

  it('tolerates a url() wrapper and surrounding quotes', () => {
    expect(
      getBackgroundVideoSettings({
        [BACKGROUND_VIDEO_SRC_STYLE]: "url('https://x.com/bg.webm')",
        [BACKGROUND_VIDEO_POSTER_STYLE]: '"https://x.com/p.jpg"',
      })
    ).toEqual({ src: 'https://x.com/bg.webm', poster: 'https://x.com/p.jpg' })
  })

  it('returns null for empty, "none", or non-string values', () => {
    expect(getBackgroundVideoSettings({ [BACKGROUND_VIDEO_SRC_STYLE]: '' }).src).toBeNull()
    expect(getBackgroundVideoSettings({ [BACKGROUND_VIDEO_SRC_STYLE]: 'none' }).src).toBeNull()
    expect(getBackgroundVideoSettings({ [BACKGROUND_VIDEO_SRC_STYLE]: 42 }).src).toBeNull()
    expect(getBackgroundVideoSettings(null)).toEqual({ src: null, poster: null })
  })
})

describe('hasBackgroundVideo', () => {
  it('is true only when a src token is present', () => {
    expect(hasBackgroundVideo({ [BACKGROUND_VIDEO_SRC_STYLE]: 'https://x/bg.mp4' })).toBe(true)
    expect(hasBackgroundVideo({ [BACKGROUND_VIDEO_POSTER_STYLE]: 'https://x/p.jpg' })).toBe(false)
    expect(hasBackgroundVideo({})).toBe(false)
  })
})

describe('the content cover', () => {
  const COVER_LAYER = `var(${CONTENT_COVER_VAR}, none)`
  const SCRIM = 'linear-gradient(rgba(15,23,42,0.55), rgba(15,23,42,0.55))'

  it('is a photo, alone or under a scrim — so it gets the photo layer', () => {
    expect(isPhotoSource(COVER_LAYER)).toBe(true)
    expect(hasBackgroundImage({ backgroundImage: `${SCRIM}, ${COVER_LAYER}` })).toBe(true)
  })

  it("hands the item's cover down escaped, or none without one", () => {
    expect(contentCoverStyle('https://x.com/a "b".jpg')).toEqual({
      [CONTENT_COVER_VAR]: 'url("https://x.com/a \\"b\\".jpg")',
    })
    expect(contentCoverStyle(null)).toEqual({ [CONTENT_COVER_VAR]: 'none' })
  })

  it('is found wherever a template paints it', () => {
    const hero = {
      type: 'container',
      name: 'Cover Hero',
      styles: { backgroundImage: `${SCRIM}, ${COVER_LAYER}` },
      content: [],
    } as unknown as PublicBlockNode
    const body = { type: '__body', content: [hero] } as unknown as PublicBlockNode
    const plain = { type: 'container', styles: { backgroundColor: '#fff' }, content: [] } as unknown as PublicBlockNode

    expect(usesContentCover([body])).toBe(true)
    expect(usesContentCover([plain])).toBe(false)
  })
})
