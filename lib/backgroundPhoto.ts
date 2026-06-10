export const BACKGROUND_PHOTO_OPACITY_STYLE = '--builder-background-photo-opacity'
export const BACKGROUND_PHOTO_OVERLAY_COLOR_STYLE = '--builder-background-photo-overlay-color'
export const BACKGROUND_PHOTO_OVERLAY_OPACITY_STYLE = '--builder-background-photo-overlay-opacity'

export const DEFAULT_BACKGROUND_PHOTO_OPACITY = 100
export const DEFAULT_BACKGROUND_PHOTO_OVERLAY_COLOR = '#000000'
export const DEFAULT_BACKGROUND_PHOTO_OVERLAY_OPACITY = 0

const clampPercentage = (value: number) => {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, Math.round(value)))
}

const parsePercentage = (value: unknown, fallback: number) => {
  if (typeof value === 'number') return clampPercentage(value)

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.replace('%', '').trim())
    if (Number.isFinite(parsed)) return clampPercentage(parsed)
  }

  return fallback
}

export const normalizeHexColor = (value: string | null | undefined) => {
  const trimmed = value?.trim() || ''
  if (!trimmed) return null

  const normalized = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed
  if (!/^[0-9a-f]{3}([0-9a-f]{3})?$/i.test(normalized)) return null

  if (normalized.length === 3) {
    return `#${normalized
      .split('')
      .map((character) => `${character}${character}`)
      .join('')
      .toLowerCase()}`
  }

  return `#${normalized.toLowerCase()}`
}

const hexToRgb = (value: string) => {
  const normalized = normalizeHexColor(value) || DEFAULT_BACKGROUND_PHOTO_OVERLAY_COLOR
  const compact = normalized.slice(1)

  return {
    r: Number.parseInt(compact.slice(0, 2), 16),
    g: Number.parseInt(compact.slice(2, 4), 16),
    b: Number.parseInt(compact.slice(4, 6), 16),
  }
}

export const toRgbaString = (value: string, opacity: number) => {
  const rgb = hexToRgb(value)
  const alpha = clampPercentage(opacity) / 100

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha.toFixed(2)})`
}

export interface BackgroundPhotoSettings {
  photoOpacity: number
  overlayColor: string
  overlayOpacity: number
}

export const getBackgroundPhotoSettings = (
  styles?: Record<string, unknown> | null
): BackgroundPhotoSettings => {
  const overlayColor =
    normalizeHexColor(
      typeof styles?.[BACKGROUND_PHOTO_OVERLAY_COLOR_STYLE] === 'string'
        ? (styles?.[BACKGROUND_PHOTO_OVERLAY_COLOR_STYLE] as string)
        : undefined
    ) || DEFAULT_BACKGROUND_PHOTO_OVERLAY_COLOR

  return {
    photoOpacity: parsePercentage(
      styles?.[BACKGROUND_PHOTO_OPACITY_STYLE],
      DEFAULT_BACKGROUND_PHOTO_OPACITY
    ),
    overlayColor,
    overlayOpacity: parsePercentage(
      styles?.[BACKGROUND_PHOTO_OVERLAY_OPACITY_STYLE],
      DEFAULT_BACKGROUND_PHOTO_OVERLAY_OPACITY
    ),
  }
}

/**
 * Whether a `backgroundImage` value references a real photo — i.e. a `url(...)`
 * pointing at a remote/local image file — as opposed to a pure CSS gradient
 * (mesh/aurora backgrounds) or an inline data-URI (e.g. SVG grain/noise).
 *
 * Only real photos should go through the photo-layer pipeline (separate
 * absolutely-positioned layer + opacity + dark overlay). Decorative gradients
 * and textures must render in place, untouched.
 *
 * Note: a value may legitimately combine BOTH — the generator emits
 * `linear-gradient(overlay), url('photo')` for brand-tinted hero photos. Such
 * a value still counts as a photo because it contains a real (non-data) url().
 */
export const isPhotoSource = (value: string): boolean => {
  const v = value.trim()
  if (!v || v === 'none') return false
  // Collect every url(...) reference. A bare gradient has none → not a photo.
  const urls = v.match(/url\(\s*['"]?\s*[^'")]+/gi)
  if (!urls) return false
  // A real photo url() is neither a data: URI (inline grain/noise SVGs) nor an
  // SVG fragment reference (#id / %23id — e.g. the `url(#n)` filter ref *inside*
  // a grain data-URI). It's a photo only if some url() is a genuine source.
  return urls.some((u) => !/url\(\s*['"]?\s*(data:|#|%23)/i.test(u))
}

export const hasBackgroundImage = (styles?: Record<string, unknown> | null) => {
  const value = styles?.backgroundImage
  return typeof value === 'string' && isPhotoSource(value)
}

const PHOTO_STYLE_KEYS = [
  'background',
  'backgroundImage',
  'backgroundSize',
  'backgroundPosition',
  'backgroundRepeat',
] as const

export const stripPhotoStyles = <T extends Record<string, unknown>>(styles: T): T => {
  const next = { ...styles }
  for (const key of PHOTO_STYLE_KEYS) {
    delete next[key]
  }
  return next
}

export const pickPhotoLayerStyles = (
  styles: Record<string, unknown>,
  photoOpacity: number
): Record<string, unknown> => ({
  backgroundImage: styles.backgroundImage,
  backgroundSize: styles.backgroundSize,
  backgroundPosition: styles.backgroundPosition,
  backgroundRepeat: styles.backgroundRepeat,
  opacity: clampPercentage(photoOpacity) / 100,
})

export const pickBorderRadiusStyles = (
  styles: Record<string, unknown>
): Record<string, unknown> => ({
  borderRadius: styles.borderRadius,
  borderTopLeftRadius: styles.borderTopLeftRadius,
  borderTopRightRadius: styles.borderTopRightRadius,
  borderBottomRightRadius: styles.borderBottomRightRadius,
  borderBottomLeftRadius: styles.borderBottomLeftRadius,
})
