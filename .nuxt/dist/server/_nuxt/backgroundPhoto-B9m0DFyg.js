const BACKGROUND_PHOTO_OPACITY_STYLE = "--builder-background-photo-opacity";
const BACKGROUND_PHOTO_OVERLAY_COLOR_STYLE = "--builder-background-photo-overlay-color";
const BACKGROUND_PHOTO_OVERLAY_OPACITY_STYLE = "--builder-background-photo-overlay-opacity";
const DEFAULT_BACKGROUND_PHOTO_OPACITY = 100;
const DEFAULT_BACKGROUND_PHOTO_OVERLAY_COLOR = "#000000";
const DEFAULT_BACKGROUND_PHOTO_OVERLAY_OPACITY = 0;
const clampPercentage = (value) => {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
};
const parsePercentage = (value, fallback) => {
  if (typeof value === "number") return clampPercentage(value);
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace("%", "").trim());
    if (Number.isFinite(parsed)) return clampPercentage(parsed);
  }
  return fallback;
};
const normalizeHexColor = (value) => {
  const trimmed = value?.trim() || "";
  if (!trimmed) return null;
  const normalized = trimmed.startsWith("#") ? trimmed.slice(1) : trimmed;
  if (!/^[0-9a-f]{3}([0-9a-f]{3})?$/i.test(normalized)) return null;
  if (normalized.length === 3) {
    return `#${normalized.split("").map((character) => `${character}${character}`).join("").toLowerCase()}`;
  }
  return `#${normalized.toLowerCase()}`;
};
const hexToRgb = (value) => {
  const normalized = normalizeHexColor(value) || DEFAULT_BACKGROUND_PHOTO_OVERLAY_COLOR;
  const compact = normalized.slice(1);
  return {
    r: Number.parseInt(compact.slice(0, 2), 16),
    g: Number.parseInt(compact.slice(2, 4), 16),
    b: Number.parseInt(compact.slice(4, 6), 16)
  };
};
const toRgbaString = (value, opacity) => {
  const rgb = hexToRgb(value);
  const alpha = clampPercentage(opacity) / 100;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha.toFixed(2)})`;
};
const getBackgroundPhotoSettings = (styles) => {
  const overlayColor = normalizeHexColor(
    typeof styles?.[BACKGROUND_PHOTO_OVERLAY_COLOR_STYLE] === "string" ? styles?.[BACKGROUND_PHOTO_OVERLAY_COLOR_STYLE] : void 0
  ) || DEFAULT_BACKGROUND_PHOTO_OVERLAY_COLOR;
  return {
    photoOpacity: parsePercentage(
      styles?.[BACKGROUND_PHOTO_OPACITY_STYLE],
      DEFAULT_BACKGROUND_PHOTO_OPACITY
    ),
    overlayColor,
    overlayOpacity: parsePercentage(
      styles?.[BACKGROUND_PHOTO_OVERLAY_OPACITY_STYLE],
      DEFAULT_BACKGROUND_PHOTO_OVERLAY_OPACITY
    )
  };
};
const hasBackgroundImage = (styles) => {
  const value = styles?.backgroundImage;
  return typeof value === "string" && value.trim() !== "" && value !== "none";
};
const PHOTO_STYLE_KEYS = [
  "backgroundImage",
  "backgroundSize",
  "backgroundPosition",
  "backgroundRepeat"
];
const stripPhotoStyles = (styles) => {
  const next = { ...styles };
  for (const key of PHOTO_STYLE_KEYS) {
    delete next[key];
  }
  return next;
};
const pickPhotoLayerStyles = (styles, photoOpacity) => ({
  backgroundImage: styles.backgroundImage,
  backgroundSize: styles.backgroundSize,
  backgroundPosition: styles.backgroundPosition,
  backgroundRepeat: styles.backgroundRepeat,
  opacity: clampPercentage(photoOpacity) / 100
});
const pickBorderRadiusStyles = (styles) => ({
  borderRadius: styles.borderRadius,
  borderTopLeftRadius: styles.borderTopLeftRadius,
  borderTopRightRadius: styles.borderTopRightRadius,
  borderBottomRightRadius: styles.borderBottomRightRadius,
  borderBottomLeftRadius: styles.borderBottomLeftRadius
});
export {
  pickPhotoLayerStyles as a,
  getBackgroundPhotoSettings as g,
  hasBackgroundImage as h,
  pickBorderRadiusStyles as p,
  stripPhotoStyles as s,
  toRgbaString as t
};
//# sourceMappingURL=backgroundPhoto-B9m0DFyg.js.map
