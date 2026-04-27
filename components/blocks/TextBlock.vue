<script setup lang="ts">
import { getNodeClasses, getNodeStyles, getStringField } from '~/lib/blockRuntime'
import { getNodeDomId } from '~/lib/responsiveRuntime'

const props = defineProps<{ node: Record<string, any> }>()
const html = computed(() => getStringField(props.node, 'html', 'innerText', 'text') || '')
const nodeClasses = computed(() => getNodeClasses(props.node))
const nodeStyles = computed(() => getNodeStyles(props.node))
const nodeDomId = computed(() => getNodeDomId(props.node) || undefined)
</script>

<template>
  <div
    class="wt-text"
    :class="nodeClasses"
    :style="nodeStyles"
    :data-wt-node-id="nodeDomId"
    v-html="html"
  />
</template>

<style scoped>
.wt-text { color: var(--builder-color-text, var(--wt-color-text)); }
</style>
