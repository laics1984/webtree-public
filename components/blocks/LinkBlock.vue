<script setup lang="ts">
import { getNodeClasses, getNodeStyles, getStringField } from '~/lib/blockRuntime'
import { getNodeDomId } from '~/lib/responsiveRuntime'

const props = defineProps<{ node: Record<string, any> }>()
const href = computed(() => getStringField(props.node, 'href') || '#')
const label = computed(() => getStringField(props.node, 'label', 'innerText', 'text') || 'Link')
const nodeClasses = computed(() => getNodeClasses(props.node))
const nodeStyles = computed(() => getNodeStyles(props.node))
const nodeDomId = computed(() => getNodeDomId(props.node) || undefined)
</script>

<template>
  <NuxtLink
    class="wt-link wt-ui-link"
    :class="nodeClasses"
    :style="nodeStyles"
    :data-wt-node-id="nodeDomId"
    :to="href"
  >
    {{ label }}
  </NuxtLink>
</template>

<style scoped>
.wt-link { display: inline-flex; }
</style>
