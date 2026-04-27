<script setup lang="ts">
import type { CSSProperties } from 'vue'
import type { PublicBlockNode } from '~/types/public'
import ElementRenderer from '~/components/renderer/ElementRenderer.vue'
import { getNodeClasses, getNodeStyles } from '~/lib/blockRuntime'
import { getNodeDomId } from '~/lib/responsiveRuntime'
import { getNodeChildren, getNodeKey } from '~/lib/schema'
import {
  getBackgroundPhotoSettings,
  hasBackgroundImage,
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

const hasPhotoLayer = computed(() => hasBackgroundImage(nodeStyles.value))
const photoSettings = computed(() => getBackgroundPhotoSettings(nodeStyles.value))

const resolvedStyles = computed<CSSProperties>(() => {
  const base = hasPhotoLayer.value
    ? stripPhotoStyles(nodeStyles.value)
    : { ...nodeStyles.value }

  const merged: Record<string, unknown> = { ...base }
  if (hasPhotoLayer.value && !base.position) {
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
    :class="[nodeClasses, { 'wt-section--has-photo': hasPhotoLayer }]"
    :style="resolvedStyles"
    :data-wt-node-id="nodeDomId"
  >
    <div
      v-if="hasPhotoLayer"
      class="wt-section__bg-layer"
      :style="photoLayerClipStyle"
      aria-hidden="true"
    >
      <div class="wt-section__bg-photo" :style="photoLayerStyle" />
      <div
        v-if="overlayStyle"
        class="wt-section__bg-overlay"
        :style="overlayStyle"
      />
    </div>

    <div v-if="hasPhotoLayer" class="wt-section__content">
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

.wt-section__content {
  position: relative;
  z-index: 1;
}
</style>
