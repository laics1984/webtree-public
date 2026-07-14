<script setup lang="ts">
import { getNodeClasses, getNodeStyles, getStringField } from '~/lib/blockRuntime'
import { getNodeDomId } from '~/lib/responsiveRuntime'

const props = defineProps<{ node: Record<string, any> }>()
const href = computed(() => getStringField(props.node, 'href') || '#')
const label = computed(() => getStringField(props.node, 'label', 'innerText', 'text') || 'Link')
const nodeClasses = computed(() => getNodeClasses(props.node))
const nodeStyles = computed(() => getNodeStyles(props.node))
const nodeDomId = computed(() => getNodeDomId(props.node) || undefined)
// Attributes CTA clicks to this block so the tracking snippet can report them.
const ctaId = computed(() => {
  const id = String(props.node?.id || '').trim()
  return id ? id.slice(0, 80) : undefined
})
</script>

<template>
  <NuxtLink
    class="wt-link wt-ui-link"
    :class="nodeClasses"
    :style="nodeStyles"
    :data-wt-node-id="nodeDomId"
    :data-wt-cta="ctaId"
    :to="href"
  >
    {{ label }}
  </NuxtLink>
</template>

<style scoped>
.wt-link { display: inline-flex; }
</style>
