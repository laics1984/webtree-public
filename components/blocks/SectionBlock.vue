<script setup lang="ts">
import type { CSSProperties } from 'vue'
import type { PublicBlockNode } from '~/types/public'
import ElementRenderer from '~/components/renderer/ElementRenderer.vue'
import { getNodeClasses, getNodeStyles } from '~/lib/blockRuntime'
import { getNodeDomId } from '~/lib/responsiveRuntime'
import { getNodeChildren, getNodeKey } from '~/lib/schema'
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

const props = defineProps<{ node: PublicBlockNode }>()
const children = computed(() => getNodeChildren(props.node))
const nodeClasses = computed(() => getNodeClasses(props.node))
const nodeStyles = computed(() => getNodeStyles(props.node))
const nodeDomId = computed(() => getNodeDomId(props.node) || undefined)

// Video wins over a photo on the same element (the builder sets one or the
// other, but suppress the photo defensively if both are present).
const hasVideoLayer = computed(() => hasBackgroundVideo(nodeStyles.value))
const hasPhotoLayer = computed(
  () => !hasVideoLayer.value && hasBackgroundImage(nodeStyles.value)
)
const hasMediaLayer = computed(() => hasPhotoLayer.value || hasVideoLayer.value)
const photoSettings = computed(() => getBackgroundPhotoSettings(nodeStyles.value))
const videoSettings = computed(() => getBackgroundVideoSettings(nodeStyles.value))

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
  if (hasMediaLayer.value && !base.position) {
    merged.position = 'relative'
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
