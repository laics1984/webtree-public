<script setup lang="ts">
import type { CSSProperties } from 'vue'
import type { PublicBlockNode } from '~/types/public'
import ElementRenderer from '~/components/renderer/ElementRenderer.vue'
import SectionDivider from '~/components/blocks/SectionDivider.vue'
import { getNodeClasses, getNodeStyles } from '~/lib/blockRuntime'
import { getNodeDomId } from '~/lib/responsiveRuntime'
import { getNodeChildren, getNodeKey } from '~/lib/schema'
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
import { runtimeBuilderStylesKey } from '~/lib/blockRuntime'

const props = defineProps<{ node: PublicBlockNode }>()
const children = computed(() => getNodeChildren(props.node))
const nodeClasses = computed(() => getNodeClasses(props.node))
const nodeStyles = computed(() => getNodeStyles(props.node))
const nodeDomId = computed(() => getNodeDomId(props.node) || undefined)
const divider = computed(() => getNodeDivider(props.node))

const builderStyles = inject(runtimeBuilderStylesKey, computed(() => null))

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
// `backgroundTexture` (per-section override, or the theme default) instead
// of trusting whatever Python baked at generation time — Python only bakes
// once, at site-build time, with no re-bake on save/publish. Mirrors
// builder/src/components/shared/editor-component-wrapper.tsx's
// `resolvedTextureImage`. Skipped entirely for real photo/video sections
// (those keep Python's literal backgroundImage untouched).
const resolvedTextureImage = computed(() => {
  if (hasMediaLayer.value) return undefined
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

// Poster shows on the server and stays on mobile, under reduced-motion, or with
// Data Saver on. Playback only starts on the client once those guards pass, so
// the rendered markup stays hydration-stable.
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

const resolvedStyles = computed<CSSProperties>(() => {
  const base = hasMediaLayer.value
    ? stripPhotoStyles(nodeStyles.value)
    : { ...nodeStyles.value }

  const merged: Record<string, unknown> = { ...base }
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
  <section
    class="wt-section"
    :class="[nodeClasses, { 'wt-section--has-photo': hasMediaLayer }]"
    :style="resolvedStyles"
    :data-wt-node-id="nodeDomId"
  >
    <div
      v-if="hasMediaLayer"
      class="wt-section__bg-layer"
      :style="photoLayerClipStyle"
      aria-hidden="true"
    >
      <video
        v-if="hasVideoLayer"
        ref="bgVideoEl"
        class="wt-section__bg-video"
        :style="videoLayerStyle"
        :src="videoSettings.src || undefined"
        :poster="videoSettings.poster || undefined"
        muted
        loop
        playsinline
        preload="metadata"
        tabindex="-1"
      />
      <div v-else class="wt-section__bg-photo" :style="photoLayerStyle" />
      <div
        v-if="overlayStyle"
        class="wt-section__bg-overlay"
        :style="overlayStyle"
      />
    </div>

    <SectionDivider v-if="divider" :divider="divider" />

    <div v-if="hasMediaLayer" class="wt-section__content">
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
  </section>
</template>

<style scoped>
.wt-section { padding: 2rem 1rem; }

.wt-section--has-photo {
  position: relative;
}

.wt-section__bg-layer {
  pointer-events: none;
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
}

.wt-section__bg-photo,
.wt-section__bg-overlay {
  position: absolute;
  inset: 0;
}

.wt-section__bg-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.wt-section__content {
  position: relative;
  z-index: 1;
}
</style>
