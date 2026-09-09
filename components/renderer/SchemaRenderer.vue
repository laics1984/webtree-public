<script setup lang="ts">
import type { PublicBlockNode, PublicSchemaTree } from '~/types/public'
import ElementRenderer from '~/components/renderer/ElementRenderer.vue'
import { getNodeKey, normalizeSchemaNodes } from '~/lib/schema'
import { withHeaderOverlayClearance } from '~/lib/headerOverlayClearance'

const props = withDefaults(defineProps<{
  schema?: PublicSchemaTree | PublicBlockNode[] | null
  scope?: string
  as?: string
  // Set by PublicSiteShell (via `headerOverlaySpacerPaddingTop` on its
  // default slot) when an overlay header floats over this tree's first real
  // section and that section is a Hero. See PublicSiteShell.vue.
  overlaySpacerPaddingTop?: string | null
  // Site-wide "Hero height" default (full screen vs banded), forwarded from
  // PublicSiteShell so a hero relying on the site default var can be told
  // apart from one explicitly set to full/banded. See PublicSiteShell.vue.
  globalHeroMinHeight?: string | null
}>(), {
  as: 'div'
})

const nodes = computed(() => normalizeSchemaNodes(props.schema))

// An overlay header floats over this tree's first real section: the section's
// background covers the header's band, its content must not follow it up.
// PublicSiteShell hands down the clearance (its own header height plus
// breathing room) and the site's hero-height default; the rule itself lives in
// ~/lib/headerOverlayClearance, shared with the stylesheet the shell builds
// from the same tree so a breakpoint override cannot undo it.
const renderNodes = computed(() =>
  withHeaderOverlayClearance(
    nodes.value,
    props.overlaySpacerPaddingTop,
    props.globalHeroMinHeight
  )
)
</script>

<template>
  <component :is="as" v-if="renderNodes.length" class="wt-schema-renderer" :data-scope="scope">
    <ElementRenderer
      v-for="(node, index) in renderNodes"
      :key="getNodeKey(node, index)"
      :node="node"
    />
  </component>
</template>
