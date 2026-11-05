import { describe, expect, it } from 'vitest'
import {
  BACKGROUND_PHOTO_OVERLAY_COLOR_STYLE,
  BACKGROUND_PHOTO_OVERLAY_OPACITY_STYLE,
  BACKGROUND_PHOTO_OVERLAY_SHAPE_STYLE,
  getBackgroundPhotoSettings,
} from '~/lib/backgroundPhoto'
import { photoFilterLayers, photoFilterOverlay, withPhotoFilter } from '~/lib/photoFilter'
import fixtures from './photoFilter.fixtures.json'

// The fixture is computed by the generator (site-generator
// tests/test_photo_filter_mirror.py): passing here means a hero whose scrim was
// lifted into its filter is published exactly as it was generated.

describe('photo filter — mirror of the generator', () => {
  it.each(fixtures.layers.map((c) => [`${c.shape} ${c.opacity}% ${c.color}`, c] as const))(
    'paints the same layers: %s',
    (_name, c) => {
      expect(photoFilterLayers(c.color, c.opacity, c.shape)).toEqual(c.layers)
    }
  )

  it.each(fixtures.lift.filter((c) => c.lifted).map((c) => [c.name, c] as const))(
    'paints a lifted scrim back as it was baked: %s',
    (_name, c) => {
      const painted = withPhotoFilter(c.lifted as Record<string, unknown>)
      expect(painted).toEqual(c.painted)
      expect(painted.backgroundImage).toBe((c.styles as Record<string, unknown>).backgroundImage)
    }
  )
})

describe('photo filter — overlay', () => {
  const photo = "url('https://cdn.example.com/hero.jpg')"

  it('lays a flat filter over the media, as before shapes existed', () => {
    const styles = { backgroundImage: photo, [BACKGROUND_PHOTO_OVERLAY_OPACITY_STYLE]: 40 }
    expect(photoFilterOverlay(styles, { hasPhotoLayer: true })).toEqual({
      backgroundColor: 'rgba(0, 0, 0, 0.40)',
    })
    expect(withPhotoFilter(styles).backgroundImage).toBe(photo)
  })

  it('paints a shaped filter in the photo stack, and over a video as an overlay', () => {
    const styles = {
      backgroundImage: photo,
      [BACKGROUND_PHOTO_OVERLAY_SHAPE_STYLE]: 'bottom',
      [BACKGROUND_PHOTO_OVERLAY_OPACITY_STYLE]: 50,
    }
    expect(photoFilterOverlay(styles, { hasPhotoLayer: true })).toBeNull()
    expect(photoFilterOverlay(styles, { hasPhotoLayer: false })).toEqual({
      backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.5) 45%, rgba(0,0,0,0.28) 67%, rgba(0,0,0,0) 89%)',
    })
  })

  it('switched off, paints nothing', () => {
    const styles = {
      backgroundImage: photo,
      [BACKGROUND_PHOTO_OVERLAY_SHAPE_STYLE]: 'left',
      [BACKGROUND_PHOTO_OVERLAY_OPACITY_STYLE]: 0,
    }
    expect(photoFilterOverlay(styles, { hasPhotoLayer: true })).toBeNull()
    expect(withPhotoFilter(styles).backgroundImage).toBe(photo)
  })

  it('keeps a palette-token colour, so a palette edit retints the filter', () => {
    const token = 'var(--builder-color-photo-scrim, #101820)'
    const settings = getBackgroundPhotoSettings({
      [BACKGROUND_PHOTO_OVERLAY_COLOR_STYLE]: token,
      [BACKGROUND_PHOTO_OVERLAY_OPACITY_STYLE]: 30,
    })
    expect(settings.overlayColorCss).toBe(token)
    expect(settings.overlayFill).toBe(`color-mix(in srgb, ${token} 30%, transparent)`)
  })
})
