<script setup lang="ts">
import { getNodeClasses, getNodeStyles, getStringField } from '~/lib/blockRuntime'
import { getNodeDomId } from '~/lib/responsiveRuntime'

const props = defineProps<{ node: Record<string, any> }>()
const eyebrow = computed(() => getStringField(props.node, 'eyebrow'))
const title = computed(() => getStringField(props.node, 'title'))
const description = computed(() => getStringField(props.node, 'description'))
const image = computed(() => getStringField(props.node, 'image', 'imageUrl', 'src'))
const nodeClasses = computed(() => getNodeClasses(props.node))
const nodeStyles = computed(() => getNodeStyles(props.node))
const nodeDomId = computed(() => getNodeDomId(props.node) || undefined)
</script>

<template>
  <section
    class="wt-hero"
    :class="nodeClasses"
    :style="nodeStyles"
    :data-wt-node-id="nodeDomId"
  >
    <p v-if="eyebrow" class="wt-eyebrow wt-ui-pill">{{ eyebrow }}</p>
    <h1 class="wt-title wt-ui-heading">{{ title }}</h1>
    <p v-if="description" class="wt-description wt-ui-muted">{{ description }}</p>
    <img
      v-if="image"
      class="wt-hero-image"
      :src="image"
      :alt="title || ''"
      loading="eager"
      fetchpriority="high"
    />
  </section>
</template>

<style scoped>
.wt-hero { padding: 4rem 1rem; }
.wt-eyebrow { padding: 0.25rem 0.75rem; }
.wt-title { margin: 1rem 0 0; }
.wt-description { margin: 1rem 0 0; }
.wt-hero-image { margin-top: 1rem; max-width: 100%; height: auto; display: block; }
</style>
