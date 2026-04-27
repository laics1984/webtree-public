<script setup lang="ts">
import type { CSSProperties } from 'vue'
import type { PublicBlockNode } from '~/types/public'
import ElementRenderer from '~/components/renderer/ElementRenderer.vue'
import { getNodeClasses, getNodeStyles } from '~/lib/blockRuntime'
import { getNodeDomId } from '~/lib/responsiveRuntime'
import { getNodeChildren, getNodeKey, normalizeBlockType } from '~/lib/schema'
import {
  getBackgroundPhotoSettings,
  hasBackgroundImage,
  pickBorderRadiusStyles,
  pickPhotoLayerStyles,
  stripPhotoStyles,
  toRgbaString,
} from '~/lib/backgroundPhoto'

const props = defineProps<{ node: PublicBlockNode }>()

const nodeType = computed(() => normalizeBlockType(props.node?.type))
const children = computed(() => getNodeChildren(props.node))
const nodeClasses = computed(() => getNodeClasses(props.node))
const nodeStyles = computed(() => getNodeStyles(props.node))
const nodeDomId = computed(() => getNodeDomId(props.node) || undefined)
const tag = computed(() => nodeType.value === 'section' ? 'section' : 'div')
const isTwoColumnLayout = computed(() => nodeType.value === '2col')
const isThreeColumnLayout = computed(() => nodeType.value === '3col')
const isColumnLayout = computed(() => isTwoColumnLayout.value || isThreeColumnLayout.value)
const isBodyRoot = computed(() => nodeType.value === 'body')
const isHeaderRoot = computed(() => nodeType.value === 'header')
const isFooterRoot = computed(() => nodeType.value === 'footer')

const hasPhotoLayer = computed(() => hasBackgroundImage(nodeStyles.value))

const photoSettings = computed(() => getBackgroundPhotoSettings(nodeStyles.value))

const resolvedStyles = computed(() => {
  const base = hasPhotoLayer.value
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
  <component
    :is="tag"
    class="wt-container-block"
    :class="[
      nodeClasses,
      {
        'wt-container-block--column-layout': isColumnLayout && !hasPhotoLayer,
        'wt-container-block--two-col': isTwoColumnLayout && !hasPhotoLayer,
        'wt-container-block--three-col': isThreeColumnLayout && !hasPhotoLayer,
        'wt-container-block--body-root': isBodyRoot,
        'wt-container-block--has-photo': hasPhotoLayer,
      },
    ]"
    :style="resolvedStyles"
    :data-wt-node-id="nodeDomId"
  >
    <div
      v-if="hasPhotoLayer"
      class="wt-container-block__bg-layer"
      :style="photoLayerClipStyle"
      aria-hidden="true"
    >
      <div class="wt-container-block__bg-photo" :style="photoLayerStyle" />
      <div
        v-if="overlayStyle"
        class="wt-container-block__bg-overlay"
        :style="overlayStyle"
      />
    </div>

    <div
      v-if="hasPhotoLayer"
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
