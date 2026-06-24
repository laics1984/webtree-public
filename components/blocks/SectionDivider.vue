<script setup lang="ts">
import type { CSSProperties } from 'vue'
import {
  getDividerColor,
  getDividerHeight,
  getDividerPath,
  getDividerTransform,
  SECTION_DIVIDER_VIEWBOX,
  type SectionDivider,
  type SectionDividerEdge,
  type SectionDividerPosition,
} from '~/lib/sectionDivider'

// Renders the top/bottom shape-divider SVGs for a section-like block. Mounted
// inside the block (which is positioned relative when a divider is present),
// above the background media layer. Mirror of builder's section-divider-layer.tsx.

const props = defineProps<{ divider: SectionDivider | null | undefined }>()

interface RenderedEdge {
  position: SectionDividerPosition
  path: string
  color: string
  style: CSSProperties
}

const edges = computed<RenderedEdge[]>(() => {
  const result: RenderedEdge[] = []
  const positions: SectionDividerPosition[] = ['top', 'bottom']
  for (const position of positions) {
    const edge = props.divider?.[position] as SectionDividerEdge | null | undefined
    const path = edge ? getDividerPath(edge) : ''
    if (!edge || !path) continue
    result.push({
      position,
      path,
      color: getDividerColor(edge),
      style: {
        position: 'absolute',
        left: 0,
        right: 0,
        width: '100%',
        height: `${getDividerHeight(edge)}px`,
        [position]: '-1px',
        transform: getDividerTransform(position, edge.flipX),
        pointerEvents: 'none',
        display: 'block',
        zIndex: 1,
      } as CSSProperties,
    })
  }
  return result
})
</script>

<template>
  <svg
    v-for="edge in edges"
    :key="edge.position"
    class="wt-section-divider"
    aria-hidden="true"
    :viewBox="SECTION_DIVIDER_VIEWBOX"
    preserveAspectRatio="none"
    :style="edge.style"
  >
    <path :d="edge.path" :fill="edge.color" />
  </svg>
</template>
