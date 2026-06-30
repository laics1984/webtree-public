<script setup lang="ts">
import type { PublicBlockNode, PublicSchemaTree } from '~/types/public'
import ElementRenderer from '~/components/renderer/ElementRenderer.vue'
import { findFirstNonBreadcrumbNode, getNodeKey, normalizeSchemaNodes } from '~/lib/schema'

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

// Mirrors builder/src/components/tabs/editor-components/Editor.tsx's
// isHeroHeightFull/growLengthByPx*2. Keep in lockstep with builder
// src/lib/builder-styles.ts's HERO_FULL_MIN_HEIGHT/HERO_BANDED_MIN_HEIGHT.
const HERO_FULL_MIN_HEIGHT = 'min(100dvh, 900px)'
const HERO_BANDED_MIN_HEIGHT = '460px'

// An explicit fixed pixel `height` wins over `minHeight` in the box model —
// a real full-screen hero relies on a vh-based minHeight with no fixed
// height set, so any literal px height means this hero isn't full-screen
// regardless of what minHeight (or its var fallback) says.
const isHeroHeightFull = (
  nodeStyles: Record<string, unknown> | undefined,
  globalHeroMinHeight: string | null | undefined
): boolean => {
  const heightValue = typeof nodeStyles?.height === 'string' ? nodeStyles.height.trim() : ''
  if (/^-?\d*\.?\d+px$/.test(heightValue)) return false

  const minHeight = typeof nodeStyles?.minHeight === 'string' ? nodeStyles.minHeight.trim() : ''
  if (minHeight === HERO_FULL_MIN_HEIGHT) return true
  if (minHeight === HERO_BANDED_MIN_HEIGHT) return false
  if (minHeight.startsWith('var(--builder-hero-min-height')) {
    return !globalHeroMinHeight
  }
  return false
}

// Growing only paddingTop on a hero with a fixed height/minHeight shrinks its
// usable content area by the same amount (the box doesn't grow, the padding
// just eats into it), so push content down by centering instead. Centering
// distributes added height evenly above and below the content, so only half
// of any growth actually pushes content down — grow by 2x the clearance
// length so the centered content's top edge moves down by the full amount.
const growLengthByLength = (
  value: unknown,
  extraLength: string
): string | undefined => {
  if (typeof value === 'number') return `calc(${value}px + ${extraLength})`
  if (typeof value === 'string' && value.trim().length > 0) {
    return `calc(${value.trim()} + ${extraLength})`
  }
  return undefined
}

const renderNodes = computed(() => {
  if (!props.overlaySpacerPaddingTop) return nodes.value

  const target = findFirstNonBreadcrumbNode(nodes.value)
  if (!target) return nodes.value

  return nodes.value.map((node, index) => {
    if (index !== target.index) return node

    const existingStyles = node.styles as Record<string, unknown> | undefined
    const overlaySpacerPaddingTop = props.overlaySpacerPaddingTop as string

    if (isHeroHeightFull(existingStyles, props.globalHeroMinHeight)) {
      return {
        ...node,
        styles: { ...existingStyles, justifyContent: 'center' },
      }
    }

    const heightGrowth = `calc((${overlaySpacerPaddingTop}) * 2)`
    return {
      ...node,
      styles: {
        ...existingStyles,
        justifyContent: 'center',
        height: growLengthByLength(existingStyles?.height, heightGrowth) ?? existingStyles?.height,
        minHeight: growLengthByLength(existingStyles?.minHeight, heightGrowth) ?? existingStyles?.minHeight,
      },
    }
  })
})
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
