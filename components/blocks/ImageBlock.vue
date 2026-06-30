<script setup lang="ts">
import { getBooleanField, getNodeClasses, getNodeStyles, getStringField, runtimeHeaderShrinkKey } from '~/lib/blockRuntime'
import { getShrunkLogoStyles } from '~/lib/headerShrink'
import { getImageElementStyles, getImageWrapperStyles } from '~/lib/imageStyles'
import { getNodeDomId } from '~/lib/responsiveRuntime'
import { getNodeName } from '~/lib/schema'

const props = defineProps<{ node: Record<string, any> }>()
const src = computed(() => getStringField(props.node, 'src', 'imageUrl'))
const alt = computed(() => getStringField(props.node, 'alt', 'title') || '')
const href = computed(() => getStringField(props.node, 'href') || '')
const ariaLabel = computed(() => getStringField(props.node, 'ariaLabel') || undefined)
const isExternalHref = computed(() => /^(https?:)?\/\//.test(href.value))
const isHero = computed(() => getBooleanField(props.node, 'priority') || getStringField(props.node, 'fetchpriority') === 'high')
const nodeClasses = computed(() => getNodeClasses(props.node))
const nodeDomId = computed(() => getNodeDomId(props.node) || undefined)

// Mirrors builder's `isBrandHeaderElement` exact-match (not a loose regex) —
// only the header's own brand/logo node shrinks, never an unrelated body
// image that happens to share the name.
const isBrandLogo = computed(() => {
  const name = getNodeName(props.node)
  return name === 'Brand' || name === 'Brand Logo'
})
const runtimeHeaderShrink = inject(
  runtimeHeaderShrinkKey,
  computed(() => ({ active: false, ratio: 1 }))
)
const isLogoShrinkActive = computed(() => isBrandLogo.value && runtimeHeaderShrink.value.active)

const nodeStyles = computed(() => {
  const styles = getNodeStyles(props.node)
  const wrapperStyles = getImageWrapperStyles(styles, nodeClasses.value)
  if (!isLogoShrinkActive.value) {
    return wrapperStyles
  }
  const shrunk = getShrunkLogoStyles(styles, runtimeHeaderShrink.value.ratio)
  return shrunk
    ? { ...wrapperStyles, ...shrunk, transition: 'width 200ms ease, height 200ms ease' }
    : wrapperStyles
})

// Styling that must live on the <img> element itself.
const imgStyle = computed(() => {
  const styles = getNodeStyles(props.node)
  return getImageElementStyles(styles)
})
</script>

<template>
  <div
    v-if="src"
    class="wt-image-block"
    :class="nodeClasses"
    :style="nodeStyles"
    :data-wt-node-id="nodeDomId"
  >
    <NuxtLink
      v-if="href"
      class="wt-image-link"
      :to="href"
      :external="isExternalHref"
      :aria-label="ariaLabel"
    >
      <img
        class="wt-image"
        :src="src"
        :alt="alt"
        :style="imgStyle"
        :loading="isHero ? 'eager' : 'lazy'"
        :fetchpriority="isHero ? 'high' : 'auto'"
      />
    </NuxtLink>
    <img
      v-else
      class="wt-image"
      :src="src"
      :alt="alt"
      :style="imgStyle"
      :loading="isHero ? 'eager' : 'lazy'"
      :fetchpriority="isHero ? 'high' : 'auto'"
    />
  </div>
</template>

<style scoped>
.wt-image-block { max-width: 100%; }
.wt-image-link { display: block; width: 100%; height: 100%; }
.wt-image { width: 100%; height: 100%; display: block; /* object-fit/object-position driven by :style binding */ }
</style>
