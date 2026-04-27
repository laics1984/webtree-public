<script setup lang="ts">
import { getBooleanField, getNodeClasses, getNodeStyles, getStringField } from '~/lib/blockRuntime'
import { getNodeDomId } from '~/lib/responsiveRuntime'

const props = defineProps<{ node: Record<string, any> }>()
const src = computed(() => getStringField(props.node, 'src', 'imageUrl'))
const alt = computed(() => getStringField(props.node, 'alt', 'title') || '')
const isHero = computed(() => getBooleanField(props.node, 'priority') || getStringField(props.node, 'fetchpriority') === 'high')
const nodeClasses = computed(() => getNodeClasses(props.node))
const nodeStyles = computed(() => getNodeStyles(props.node))
const nodeDomId = computed(() => getNodeDomId(props.node) || undefined)
</script>

<template>
  <div
    v-if="src"
    class="wt-image-block"
    :class="nodeClasses"
    :style="nodeStyles"
    :data-wt-node-id="nodeDomId"
  >
    <img
      class="wt-image"
      :src="src"
      :alt="alt"
      :loading="isHero ? 'eager' : 'lazy'"
      :fetchpriority="isHero ? 'high' : 'auto'"
    />
  </div>
</template>

<style scoped>
.wt-image-block { max-width: 100%; }
.wt-image { width: 100%; height: 100%; display: block; object-fit: contain; }
</style>
