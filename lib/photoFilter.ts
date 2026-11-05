import {
  getBackgroundPhotoSettings,
  isPhotoUrlMatch,
  PHOTO_FILTER_SHAPES,
  referencesContentCover,
  type PhotoFilterShape,
} from '~/lib/backgroundPhoto'

/**
 * The photo filter's SHAPE: the generator's copy scrim, as settings the owner
 * edits in the builder's Color filter.
 *
 * The generator used to bake a hero's copy scrim into `backgroundImage`; its
 * last pass now lifts it into the photo filter (colour, opacity, and a shape —
 * `flat`, the old uniform tint, or one of the copy anchors). A shaped filter is
 * painted back into the very slot the scrim was baked in (`withPhotoFilter`):
 * under the grain and the edge fade, which must stay on top, and over
 * everything else — so a lifted page paints pixel-identically. A flat filter is
 * still the overlay laid over the whole background, as it always was.
 *
 * MIRROR of the photo-filter section of site-generator
 * backend/app/services/image_styling.py and of builder src/lib/photo-filter.ts,
 * pinned by photoFilter.fixtures.json, which the generator's
 * tests/test_photo_filter_mirror.py writes and checks.
 */

type Shaped = Exclude<PhotoFilterShape, 'flat'>

// Scrim geometry — image_styling.COPY_ZONES, _RADIAL_RADII, _SCRIM_*.
const COPY_ZONES: Record<Shaped, [number, number, number, number]> = {
  center: [0.2, 0.3, 0.8, 0.7],
  left: [0.06, 0.3, 0.54, 0.7],
  'bottom-left': [0.06, 0.5, 0.54, 0.92],
  bottom: [0.0, 0.55, 1.0, 1.0],
}
const RADIAL_RADII: [number, number] = [1.15, 0.88]
const SCRIM_FALL_MID = 0.22
const SCRIM_FALL_END = 0.44
const SCRIM_MID_SHARE = 0.55

const HEX_RE = /^#[0-9a-f]{6}$/i
// A layer the filter is slotted UNDER: the grain tile (an SVG data URI) and the
// edge fade (the only `to bottom` ramp in a photo stack).
const FILTER_ABOVE_RE = /^(?:url\(\s*['"]?\s*data:image\/svg\+xml|linear-gradient\(\s*to bottom\b)/i
const URL_LAYER_RE = /^url\(\s*(['"]?)([^'")]*)\1\s*\)$/i
const LAYER_LISTS = {
  backgroundSize: 'cover',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
} as const

export type PhotoLayerStyles = {
  backgroundImage?: unknown
  backgroundSize?: unknown
  backgroundRepeat?: unknown
  backgroundPosition?: unknown
}

/** A CSS value list split on top-level commas (not those inside `rgba(...)`). */
const splitTopLevelCss = (value: string): string[] => {
  const layers: string[] = []
  let depth = 0
  let start = 0
  for (let i = 0; i < value.length; i++) {
    const char = value[i]
    if (char === '(') depth++
    else if (char === ')') depth--
    else if (char === ',' && depth === 0) {
      layers.push(value.slice(start, i))
      start = i + 1
    }
  }
  layers.push(value.slice(start))
  return layers.map((layer) => layer.trim()).filter(Boolean)
}

const isPhotoLayer = (layer: string): boolean => {
  if (referencesContentCover(layer)) return true
  const match = URL_LAYER_RE.exec(layer.trim())
  return Boolean(match && isPhotoUrlMatch(match[2]))
}

// --- number formatting, as Python writes it ------------------------------------

const round2 = (x: number) => Number(x.toFixed(2))
const pyRepr = (x: number) => (Number.isInteger(x) && x !== 0 ? x.toFixed(1) : String(x))
const pyG = (x: number) => String(Number(x.toPrecision(6)))
const pct = (fraction: number) => `${Math.round(fraction * 100)}%`

// --- the shape ------------------------------------------------------------------

type Stop = (alpha: number) => string

const cornerHalf = (a: number) => Math.ceil((1 - Math.sqrt(1 - a)) * 100 - 1e-9) / 100

const scrimLayers = (stop: Stop, a: number, shape: Shaped): string[] => {
  const ramp = (peak: number, plateau: number) => {
    const mid = round2(peak * SCRIM_MID_SHARE)
    return (
      `${stop(peak)} ${pct(plateau)}, ` +
      `${stop(mid)} ${pct(plateau + SCRIM_FALL_MID)}, ` +
      `${stop(0)} ${pct(plateau + SCRIM_FALL_END)}`
    )
  }
  const [, y0, x1, y1] = COPY_ZONES[shape]
  if (shape === 'left') return [`linear-gradient(to right, ${ramp(a, x1)})`]
  if (shape === 'bottom') return [`linear-gradient(to top, ${ramp(a, 1 - y0)})`]
  if (shape === 'bottom-left') {
    const half = cornerHalf(a)
    return [
      `linear-gradient(to top, ${ramp(half, 1 - y0)})`,
      `linear-gradient(to right, ${ramp(half, x1)})`,
    ]
  }
  const [rx, ry] = RADIAL_RADII
  const plateau = Math.hypot((x1 - 0.5) / rx, (y1 - 0.5) / ry)
  return [`radial-gradient(${pct(rx)} ${pct(ry)} at 50% 50%, ${ramp(a, plateau)})`]
}

const filterStop = (color: string): Stop => {
  if (HEX_RE.test(color)) {
    const r = Number.parseInt(color.slice(1, 3), 16)
    const g = Number.parseInt(color.slice(3, 5), 16)
    const b = Number.parseInt(color.slice(5, 7), 16)
    return (alpha) => `rgba(${r},${g},${b},${pyRepr(alpha)})`
  }
  return (alpha) => `color-mix(in srgb, ${color} ${pyG(alpha * 100)}%, transparent)`
}

/** The layers a SHAPED filter paints, top first; none for a flat or clear one. */
export const photoFilterLayers = (color: string, opacity: number, shape: string): string[] => {
  if (shape === 'flat' || opacity <= 0 || !(PHOTO_FILTER_SHAPES as readonly string[]).includes(shape)) {
    return []
  }
  return scrimLayers(filterStop(color), Math.min(opacity, 100) / 100, shape as Shaped)
}

// --- painting -----------------------------------------------------------------------

/**
 * The photo layer's background styles with a shaped filter slotted into its
 * stack; the same values back when there is nothing to paint.
 */
export const withPhotoFilter = (styles: Record<string, unknown>): PhotoLayerStyles => {
  const layerStyles: PhotoLayerStyles = {
    backgroundImage: styles.backgroundImage,
    backgroundSize: styles.backgroundSize,
    backgroundRepeat: styles.backgroundRepeat,
    backgroundPosition: styles.backgroundPosition,
  }
  const settings = getBackgroundPhotoSettings(styles)
  const filter = photoFilterLayers(settings.overlayColorCss, settings.overlayOpacity, settings.overlayShape)
  const image = layerStyles.backgroundImage
  if (!filter.length || typeof image !== 'string') return layerStyles
  const layers = splitTopLevelCss(image)
  if (!layers.some(isPhotoLayer)) return layerStyles
  let at = 0
  while (at < layers.length && FILTER_ABOVE_RE.test(layers[at])) at += 1
  const out: Record<string, unknown> = { ...layerStyles }
  for (const [key, fill] of Object.entries(LAYER_LISTS)) {
    const value = out[key]
    if (typeof value !== 'string') continue
    const parts = splitTopLevelCss(value)
    // A list of one value cycles over every layer and is left alone.
    if (parts.length !== layers.length || layers.length === 1) continue
    parts.splice(at, 0, ...Array<string>(filter.length).fill(fill))
    out[key] = parts.join(', ')
  }
  out.backgroundImage = [...layers.slice(0, at), ...filter, ...layers.slice(at)].join(', ')
  return out
}

/**
 * The overlay laid over a background's media: the flat tint, or — over a VIDEO,
 * which has no layer stack — the shaped filter's layers. Null when the filter
 * is clear, or is painted inside the photo's stack (`inPhotoStack`).
 */
export const photoFilterOverlay = (
  styles: Record<string, unknown>,
  { hasPhotoLayer }: { hasPhotoLayer: boolean }
): Record<string, string> | null => {
  const settings = getBackgroundPhotoSettings(styles)
  if (settings.overlayOpacity <= 0) return null
  const layers = photoFilterLayers(settings.overlayColorCss, settings.overlayOpacity, settings.overlayShape)
  if (!layers.length) return { backgroundColor: settings.overlayFill }
  return hasPhotoLayer ? null : { backgroundImage: layers.join(', ') }
}
