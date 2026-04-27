<script setup lang="ts">
import type { PublicBlockNode, PublicSchemaTree } from '~/types/public'
import ElementRenderer from '~/components/renderer/ElementRenderer.vue'
import { getNodeKey, normalizeSchemaNodes } from '~/lib/schema'

const props = withDefaults(defineProps<{
  schema?: PublicSchemaTree | PublicBlockNode[] | null
  scope?: string
  as?: string
}>(), {
  as: 'div'
})

const nodes = computed(() => normalizeSchemaNodes(props.schema))
</script>

<template>
  <component :is="as" v-if="nodes.length" class="wt-schema-renderer" :data-scope="scope">
    <ElementRenderer
      v-for="(node, index) in nodes"
      :key="getNodeKey(node, index)"
      :node="node"
    />
  </component>
</template>
