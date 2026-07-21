<script setup lang="ts">
import type { CSSProperties } from 'vue'
import type { PublicBlockNode } from '~/types/public'
import ElementRenderer from '~/components/renderer/ElementRenderer.vue'
import SectionDivider from '~/components/blocks/SectionDivider.vue'
import { getNodeClasses, getNodeStyles, getStringField } from '~/lib/blockRuntime'
import { getNodeDomId } from '~/lib/responsiveRuntime'
import { getNodeChildren, getNodeKey, normalizeBlockType } from '~/lib/schema'
import { getNodeDivider } from '~/lib/sectionDivider'
import {
  getBackgroundPhotoSettings,
  getBackgroundVideoSettings,
  hasBackgroundImage,
  hasBackgroundVideo,
  pickBorderRadiusStyles,
  pickPhotoLayerStyles,
  stripPhotoStyles,
  toRgbaString,
} from '~/lib/backgroundPhoto'
import {
  getNodeBackgroundTexture,
  resolveColorToHex,
  resolvePageBackgroundHex,
  resolvePaletteHex,
  resolveSectionBackgroundImage,
  resolveThemeTexture,
} from '~/lib/backgroundTexture'
import { getNodeField, runtimeBuilderStylesKey, runtimeHeaderOverlayKey, runtimeHeaderShrinkKey } from '~/lib/blockRuntime'
import { getShrunkHeaderPaddingYStyles, getShrunkMinHeight, HEADER_ROW_CONTAINER_TYPES } from '~/lib/headerShrink'

// Node types eligible for the live grain/mesh texture override. Roots
// (header/footer/body) are intentionally excluded — mirrors builder's
// SECTION_DIVIDER_TARGET_TYPES (lib/section-divider.ts), which also excludes
// __header/__body/__footer.
const TEXTURE_ELIGIBLE_TYPES = new Set(['container', '2col', '3col'])

const props = defineProps<{ node: PublicBlockNode }>()

const nodeType = computed(() => normalizeBlockType(props.node?.type))
const builderStyles = inject(runtimeBuilderStylesKey, computed(() => null))
const runtimeHeaderOverlay = inject(runtimeHeaderOverlayKey, computed(() => false))
const runtimeHeaderShrink = inject(
  runtimeHeaderShrinkKey,
  computed(() => ({ active: false, ratio: 1 }))
)
// Some presets (and every generator-produced header) leave the header
// root's own padding at '0' and put the real vertical spacing on a direct-
// child row container instead (e.g. the generator's "Header bar", or the
// "Utility Top Bar" preset's "Utility Row"/"Main Row"). Shrinking only the
// root in that case is a silent no-op. Clone-on-render one level deep (same
// pattern builder's Editor.tsx uses for the header tree) — deeper nested
// padding (buttons, links) is intentionally left untouched.
const children = computed(() => {
  const base = getNodeChildren(props.node)
  if (!isHeaderRoot.value || !runtimeHeaderShrink.value.active) {
    return base
  }
  return base.map((child) => {
    if (!HEADER_ROW_CONTAINER_TYPES.has(normalizeBlockType(child?.type))) {
      return child
    }
    const childStyles = getNodeStyles(child)
    const rowPaddingOverride = getShrunkHeaderPaddingYStyles(childStyles, runtimeHeaderShrink.value.ratio)
    if (!rowPaddingOverride) {
      return child
    }
    return {
      ...child,
      styles: {
        ...childStyles,
        ...rowPaddingOverride,
        transition: 'padding-top 200ms ease, padding-bottom 200ms ease',
      },
    }
  })
})
const nodeClasses = computed(() => getNodeClasses(props.node))
const nodeStyles = computed(() => getNodeStyles(props.node))
const nodeDomId = computed(() => getNodeDomId(props.node) || undefined)
// Optional in-page anchor target (e.g. a hero "scroll to content" CTA). Rendered
// as the HTML id so `#sec-...` hrefs resolve and smooth-scroll to this section.
const anchorId = computed(() => getStringField(props.node, 'anchorId') || undefined)
const divider = computed(() => getNodeDivider(props.node))
const tag = computed(() => nodeType.value === 'section' ? 'section' : 'div')
const isTwoColumnLayout = computed(() => nodeType.value === '2col')
const isThreeColumnLayout = computed(() => nodeType.value === '3col')
const isColumnLayout = computed(() => isTwoColumnLayout.value || isThreeColumnLayout.value)
const isBodyRoot = computed(() => nodeType.value === 'body')
const isHeaderRoot = computed(() => nodeType.value === 'header')
const isFooterRoot = computed(() => nodeType.value === 'footer')
const isHeaderBar = computed(() => getNodeField(props.node, 'headerBar') === true)
// The header ROOT node renders its own backgroundColor/border/shadow inline
// (same as any container), which sits *inside* PublicSiteShell's `<header>`
// wrapper and paints over the wrapper's `.wt-page-header--overlay { background:
// transparent }` — that class alone never made the header look transparent.
// Strip the same background-ish keys here, on the node that actually paints
// them, whenever the overlay is active (i.e. not yet scrolled past the reveal
// offset, or reveal is disabled).
//
// Self-chrome archetypes (floating pill) carry their background on the inner
// `headerBar` container, NOT the root — the root is always transparent. Their
// bar must keep its chrome during overlay (the pill floats as-is, no
// transparent-then-solidify phase). Only the root is stripped; the bar is
// left untouched. Reveal-style archetypes have no background on the bar
// (it lives on the root), so excluding the bar from stripping is safe for
// every archetype.
const isOverlayHeaderActive = computed(() => isHeaderRoot.value && runtimeHeaderOverlay.value)
// Shrink the header root's own vertical padding once scrolled past its
// trigger (see PublicSiteShell.vue) — same node-identity gating as overlay
// above, not scope-fencing (header/body/footer are already separate schema
// trees, so a non-header container can never match isHeaderRoot).
const isHeaderShrinkActive = computed(() => isHeaderRoot.value && runtimeHeaderShrink.value.active)

// Video wins over a photo on the same element (the builder sets one or the
// other, but suppress the photo defensively if both are present).
const hasVideoLayer = computed(() => hasBackgroundVideo(nodeStyles.value))
const hasPhotoLayer = computed(
  () => !hasVideoLayer.value && hasBackgroundImage(nodeStyles.value)
)
const hasMediaLayer = computed(() => hasPhotoLayer.value || hasVideoLayer.value)

const photoSettings = computed(() => getBackgroundPhotoSettings(nodeStyles.value))
const videoSettings = computed(() => getBackgroundVideoSettings(nodeStyles.value))

// Live-recompute the decorative grain/mesh backgroundImage from
// `backgroundTexture` (per-element override, or the theme default) instead of
// trusting whatever Python baked at generation time. Mirrors SectionBlock.vue
// / builder's editor-component-wrapper.tsx `resolvedTextureImage`, but gated
// to container/2col/3col — header/footer/body roots never qualify.
const resolvedTextureImage = computed(() => {
  if (hasMediaLayer.value) return undefined
  if (!TEXTURE_ELIGIBLE_TYPES.has(nodeType.value)) return undefined
  const palette = resolvePaletteHex(builderStyles.value)
  const pageBackgroundHex = resolvePageBackgroundHex(builderStyles.value, palette)
  const bgColorValue = nodeStyles.value.backgroundColor
  return resolveSectionBackgroundImage(
    {
      backgroundTexture: getNodeBackgroundTexture(props.node),
      backgroundColorHex:
        typeof bgColorValue === 'string'
          ? resolveColorToHex(bgColorValue, palette, pageBackgroundHex)
          : null,
    },
    {
      primaryHex: resolveColorToHex(palette.primary, palette, pageBackgroundHex),
      themeTexture: resolveThemeTexture(builderStyles.value),
      plainBackgroundHexes: [palette.background, palette.surface, pageBackgroundHex].map((hex) =>
        resolveColorToHex(hex, palette, pageBackgroundHex)
      ),
    }
  )
})

const videoLayerStyle = computed<CSSProperties>(() => ({
  opacity: Math.min(100, Math.max(0, photoSettings.value.photoOpacity)) / 100,
}))

// The poster shows on the server and stays put on mobile, under reduced-motion,
// or when the visitor has Data Saver on. We only start playback on the client
// once those guards pass, so the markup is hydration-stable.
const bgVideoEl = ref<HTMLVideoElement | null>(null)

onMounted(() => {
  if (!hasVideoLayer.value) return

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches
  const isSmallScreen = window.matchMedia('(max-width: 768px)').matches
  const saveData = Boolean(
    (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
      ?.saveData
  )

  if (prefersReducedMotion || isSmallScreen || saveData) return

  const video = bgVideoEl.value
  if (!video) return

  void video.play().catch(() => {
    // Autoplay can still be blocked; the poster remains as the fallback.
  })
})

const resolvedStyles = computed(() => {
  const base = hasMediaLayer.value
    ? stripPhotoStyles(nodeStyles.value)
    : { ...nodeStyles.value }

  const fallbackMinHeight = isBodyRoot.value
    ? '40px'
    : isColumnLayout.value
      ? '180px'
      : isHeaderRoot.value || isFooterRoot.value || nodeType.value === 'container'
        ? '10px'
        : undefined

  const merged: Record<string, unknown> = {
    ...base,
    minHeight: isBodyRoot.value
      ? base.height || base.minHeight || fallbackMinHeight
      : base.minHeight || fallbackMinHeight,
    height: isBodyRoot.value ? 'auto' : base.height || 'auto',
  }

  if ((hasMediaLayer.value || divider.value) && !base.position) {
    merged.position = 'relative'
  }

  const textureImage = resolvedTextureImage.value
  if (textureImage !== undefined) {
    // The texture system models a section as a solid base color + optional
    // decorative overlay. A gradient-fill section (e.g. cta-gradient keeps its
    // gradient in the `background` shorthand, invisible to the backgroundImage-
    // only texture layer) is flattened to a solid brand fill once any explicit
    // texture is chosen — so "Flat" produces a visible solid and Grain/Mesh
    // layer over it instead of silently doing nothing. Mirrors builder's
    // editor-component-wrapper.tsx. Keep an explicit per-element backgroundColor
    // if present; only fall back to the brand primary otherwise.
    const bgShorthand = typeof merged.background === 'string' ? merged.background : undefined
    const bgImage = typeof merged.backgroundImage === 'string' ? merged.backgroundImage : undefined
    const hasGradientFill =
      Boolean(bgShorthand?.includes('gradient')) || Boolean(bgImage?.includes('gradient'))
    if (hasGradientFill) {
      delete merged.background
      if (!merged.backgroundColor) {
        merged.backgroundColor = 'var(--builder-color-primary, #2563eb)'
      }
    }
    if (textureImage) {
      merged.backgroundImage = textureImage
      merged.backgroundRepeat = 'repeat'
      merged.backgroundPosition = 'top left'
      merged.backgroundSize = 'auto'
    } else {
      delete merged.backgroundImage
      delete merged.backgroundSize
      delete merged.backgroundPosition
      delete merged.backgroundRepeat
    }
  }

  if (isOverlayHeaderActive.value) {
    merged.background = 'transparent'
    merged.backgroundColor = 'transparent'
    delete merged.backgroundImage
    delete merged.backgroundSize
    delete merged.backgroundPosition
    delete merged.backgroundRepeat
    delete merged.backgroundAttachment
    delete merged.backgroundClip
    delete merged.backgroundOrigin
    merged.borderBottomColor = 'transparent'
    merged.boxShadow = 'none'
    merged.backdropFilter = 'none'
    merged.WebkitBackdropFilter = 'none'
  }

  if (isHeaderShrinkActive.value) {
    const paddingOverride = getShrunkHeaderPaddingYStyles(nodeStyles.value, runtimeHeaderShrink.value.ratio)
    if (paddingOverride) {
      merged.paddingTop = paddingOverride.paddingTop
      merged.paddingBottom = paddingOverride.paddingBottom
    }
    // The preset headers floor the bar height with a fixed root minHeight —
    // shrink it too, or the padding shrink stays invisible (see headerShrink.ts).
    const minHeightOverride = getShrunkMinHeight(nodeStyles.value.minHeight, runtimeHeaderShrink.value.ratio)
    if (minHeightOverride) {
      merged.minHeight = minHeightOverride
    }
  }

  if (isHeaderRoot.value || isHeaderBar.value) {
    merged.transition =
      'background-color 200ms ease, border-color 200ms ease, box-shadow 200ms ease, backdrop-filter 200ms ease, padding-top 200ms ease, padding-bottom 200ms ease, min-height 200ms ease'
  }

  return merged as CSSProperties
})

const photoLayerClipStyle = computed(
  () => pickBorderRadiusStyles(nodeStyles.value) as CSSProperties
)

const photoLayerStyle = computed(
  () => pickPhotoLayerStyles(nodeStyles.value, photoSettings.value.photoOpacity) as CSSProperties
)

const overlayStyle = computed<CSSProperties | null>(() => {
  if (photoSettings.value.overlayOpacity <= 0) return null
  return {
    backgroundColor: toRgbaString(
      photoSettings.value.overlayColor,
      photoSettings.value.overlayOpacity
    ),
  }
})
</script>

<template>
  <component
    :is="tag"
    class="wt-container-block"
    :class="[
      nodeClasses,
      {
        'wt-container-block--column-layout': isColumnLayout && !hasMediaLayer,
        'wt-container-block--two-col': isTwoColumnLayout && !hasMediaLayer,
        'wt-container-block--three-col': isThreeColumnLayout && !hasMediaLayer,
        'wt-container-block--body-root': isBodyRoot,
        'wt-container-block--has-photo': hasMediaLayer,
      },
    ]"
    :style="resolvedStyles"
    :id="anchorId || undefined"
    :data-wt-node-id="nodeDomId"
  >
    <div
      v-if="hasMediaLayer"
      class="wt-container-block__bg-layer"
      :style="photoLayerClipStyle"
      aria-hidden="true"
    >
      <video
        v-if="hasVideoLayer"
        ref="bgVideoEl"
        class="wt-container-block__bg-video"
        :style="videoLayerStyle"
        :src="videoSettings.src || undefined"
        :poster="videoSettings.poster || undefined"
        muted
        loop
        playsinline
        preload="metadata"
        tabindex="-1"
      />
      <div v-else class="wt-container-block__bg-photo" :style="photoLayerStyle" />
      <div
        v-if="overlayStyle"
        class="wt-container-block__bg-overlay"
        :style="overlayStyle"
      />
    </div>

    <SectionDivider v-if="divider" :divider="divider" />

    <div
      v-if="hasMediaLayer"
      class="wt-container-block__content"
      :class="{
        'wt-container-block--column-layout': isColumnLayout,
        'wt-container-block--two-col': isTwoColumnLayout,
        'wt-container-block--three-col': isThreeColumnLayout,
      }"
    >
      <ElementRenderer
        v-for="(child, index) in children"
        :key="getNodeKey(child, index)"
        :node="child"
      />
    </div>
    <template v-else>
      <ElementRenderer
        v-for="(child, index) in children"
        :key="getNodeKey(child, index)"
        :node="child"
      />
    </template>
  </component>
</template>

<style scoped>
.wt-container-block {
  max-width: 100%;
}

.wt-container-block--has-photo {
  position: relative;
}

.wt-container-block__bg-layer {
  pointer-events: none;
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
}

.wt-container-block__bg-photo,
.wt-container-block__bg-overlay {
  position: absolute;
  inset: 0;
}

.wt-container-block__bg-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.wt-container-block__content {
  position: relative;
  z-index: 1;
}

.wt-container-block--column-layout {
  display: grid;
  align-items: stretch;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.wt-container-block--three-col {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

@media (min-width: 768px) and (max-width: 1023.98px) {
  .wt-container-block--three-col {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .wt-container-block--three-col > :last-child:nth-child(odd) {
    grid-column: span 2 / span 2;
  }
}

@media (max-width: 767.98px) {
  .wt-container-block--two-col,
  .wt-container-block--three-col {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
}
</style>
