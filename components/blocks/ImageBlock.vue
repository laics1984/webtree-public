<script setup lang="ts">
import { getBooleanField, getNodeClasses, getNodeStyles, getStringField } from '~/lib/blockRuntime'
import { getImageElementStyles, getImageWrapperStyles } from '~/lib/imageStyles'
import { getNodeDomId } from '~/lib/responsiveRuntime'

const props = defineProps<{ node: Record<string, any> }>()
const src = computed(() => getStringField(props.node, 'src', 'imageUrl'))
const alt = computed(() => getStringField(props.node, 'alt', 'title') || '')
const href = computed(() => getStringField(props.node, 'href') || '')
const ariaLabel = computed(() => getStringField(props.node, 'ariaLabel') || undefined)
const isExternalHref = computed(() => /^(https?:)?\/\//.test(href.value))
const isHero = computed(() => getBooleanField(props.node, 'priority') || getStringField(props.node, 'fetchpriority') === 'high')
const nodeClasses = computed(() => getNodeClasses(props.node))
const nodeDomId = computed(() => getNodeDomId(props.node) || undefined)

const nodeStyles = computed(() => {
  const styles = getNodeStyles(props.node)
  return getImageWrapperStyles(styles, nodeClasses.value)
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
