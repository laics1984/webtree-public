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
import { grainDataUri, resolveColorToHex, resolvePageBackgroundHex, resolvePaletteHex, sampleMeshEdgeStops, type MeshEdgeStop } from '~/lib/backgroundTexture'
import { runtimeBuilderStylesKey } from '~/lib/blockRuntime'

// Renders the top/bottom shape-divider SVGs for a section-like block. Mounted
// inside the block (which is positioned relative when a divider is present),
// above the background media layer. Mirror of builder's section-divider-layer.tsx.
//
// When `edge.texture` is set, a second <path> is layered on top of the flat
// `color` fill: grain uses a local <pattern> (the same tileable noise SVG as
// the section background, so the seam tiles continuously); mesh uses a
// <linearGradient> sampled along the exact edge line (see
// lib/backgroundTexture.ts for why a sampled approximation, not the section's
// literal radial-gradient, is what matches at a seam). `color` itself is
// never touched by texture logic — kept flat/base on purpose.

const props = defineProps<{ divider: SectionDivider | null | undefined }>()

const builderStyles = inject(runtimeBuilderStylesKey, computed(() => null))
const palette = computed(() => resolvePaletteHex(builderStyles.value))
const pageBackgroundHex = computed(() => resolvePageBackgroundHex(builderStyles.value, palette.value))
const primaryHex = computed(() =>
  resolveColorToHex(palette.value.primary, palette.value, pageBackgroundHex.value)
)

const rawId = useId().replace(/[^a-zA-Z0-9_-]/g, '')

interface RenderedEdge {
  position: SectionDividerPosition
  path: string
  color: string
  hasGrain: boolean
  hasMesh: boolean
  grainPatternId: string
  meshGradientId: string
  meshStops: MeshEdgeStop[]
  style: CSSProperties
}

const edges = computed<RenderedEdge[]>(() => {
  const result: RenderedEdge[] = []
  const positions: SectionDividerPosition[] = ['top', 'bottom']
  for (const position of positions) {
    const edge = props.divider?.[position] as SectionDividerEdge | null | undefined
    const path = edge ? getDividerPath(edge) : ''
    if (!edge || !path) continue
    const color = getDividerColor(edge)
    const texture = edge.texture
    const hasGrain = Boolean(texture && texture.includes('grain'))
    const hasMesh = Boolean(texture && texture.includes('mesh'))
    result.push({
      position,
      path,
      color,
      hasGrain,
      hasMesh,
      grainPatternId: `${rawId}-${position}-grain`,
      meshGradientId: `${rawId}-${position}-mesh`,
      meshStops: hasMesh
        ? sampleMeshEdgeStops(
            primaryHex.value,
            resolveColorToHex(color, palette.value, pageBackgroundHex.value),
            position
          )
        : [],
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
    <defs>
      <pattern
        v-if="edge.hasGrain"
        :id="edge.grainPatternId"
        patternUnits="userSpaceOnUse"
        width="140"
        height="140"
      >
        <image :href="grainDataUri()" width="140" height="140" />
      </pattern>
      <!-- Sampled left-to-right across the matched section's width. flipX
           mirrors this along with the shape (a transform on the whole <svg>),
           so a flipped mesh-matched edge no longer lines up exactly with the
           section's real hotspot positions — an accepted trade-off given how
           rarely the two are combined. -->
      <linearGradient v-if="edge.hasMesh" :id="edge.meshGradientId" x1="0" y1="0" x2="1" y2="0">
        <stop
          v-for="stop in edge.meshStops"
          :key="stop.offsetPct"
          :offset="`${stop.offsetPct}%`"
          :stop-color="stop.color"
        />
      </linearGradient>
    </defs>
    <path :d="edge.path" :fill="edge.color" />
    <path v-if="edge.hasGrain" :d="edge.path" :fill="`url(#${edge.grainPatternId})`" />
    <path v-if="edge.hasMesh" :d="edge.path" :fill="`url(#${edge.meshGradientId})`" />
  </svg>
</template>
