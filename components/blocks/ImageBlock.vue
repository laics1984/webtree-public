<script setup lang="ts">
import { getBooleanField, getNodeClasses, getNodeStyles, getStringField, runtimeHeaderShrinkKey } from '~/lib/blockRuntime'
import { getShrunkLogoStyles } from '~/lib/headerShrink'
import { getImageElementStyles, getImageWrapperStyles } from '~/lib/imageStyles'
import { getNodeDomId } from '~/lib/responsiveRuntime'
import { getNodeName } from '~/lib/schema'

const props = defineProps<{ node: Record<string, any> }>()
const src = computed(() => getStringField(props.node, 'src', 'imageUrl'))
const alt = computed(() => getStringField(props.node, 'alt', 'title') || '')
const href = computed(() => getStringField(props.node, 'href') || '')
// Editorial caption, surfaced by the gallery lightbox (which falls back to
// `alt` when absent). Not rendered inline — no block in the catalog draws one.
const caption = computed(() => getStringField(props.node, 'caption') || '')
const ariaLabel = computed(() => getStringField(props.node, 'ariaLabel') || undefined)
const isExternalHref = computed(() => /^(https?:)?\/\//.test(href.value))
const isHero = computed(() => getBooleanField(props.node, 'priority') || getStringField(props.node, 'fetchpriority') === 'high')
const nodeClasses = computed(() => getNodeClasses(props.node))
const nodeDomId = computed(() => getNodeDomId(props.node) || undefined)

// Mirrors builder's `isBrandHeaderElement` exact-match (not a loose regex) —
// only the header's own brand/logo node shrinks, never an unrelated body
// image that happens to share the name.
const isBrandLogo = computed(() => {
  const name = getNodeName(props.node)
  return name === 'Brand' || name === 'Brand Logo'
})
const runtimeHeaderShrink = inject(
  runtimeHeaderShrinkKey,
  computed(() => ({ active: false, ratio: 1 }))
)
const isLogoShrinkActive = computed(() => isBrandLogo.value && runtimeHeaderShrink.value.active)

const nodeStyles = computed(() => {
  const styles = getNodeStyles(props.node)
  let wrapperStyles = getImageWrapperStyles(styles, nodeClasses.value)
  // A brand logo must render at its natural aspect, sized to fit — never the
  // default full-width `height:100%` `object-fit:cover` box, which crops the
  // logo into a band. Mirrors the builder's `isBrandLogoPlaceholder` frame
  // (`inline-flex w-auto`, no crop). The active px dimension (height, with
  // width:auto) stays on the wrapper so the on-scroll shrink still drives it.
  if (isBrandLogo.value) {
    wrapperStyles = {
      ...wrapperStyles,
      display: 'inline-flex',
      alignItems: 'center',
      width: 'auto',
      overflow: 'visible',
    }
  }
  if (!isLogoShrinkActive.value) {
    return wrapperStyles
  }
  const shrunk = getShrunkLogoStyles(styles, runtimeHeaderShrink.value.ratio)
  return shrunk
    ? { ...wrapperStyles, ...shrunk, transition: 'width 200ms ease, height 200ms ease' }
    : wrapperStyles
})

// Styling that must live on the <img> element itself.
const imgStyle = computed(() => {
  const styles = getNodeStyles(props.node)
  const base = getImageElementStyles(styles)
  // Logo: fill the wrapper's (shrinkable) height, keep width auto for aspect,
  // and `contain` so it's never cropped. Overrides `.wt-image`'s 100%×100%,
  // and its inherited min-height: the shrink drives the logo by height alone.
  if (isBrandLogo.value) {
    return { ...base, objectFit: 'contain', width: 'auto', height: '100%', minHeight: 0 }
  }
  return base
})
</script>

<template>
  <div
    v-if="src"
    class="wt-image-block"
    :class="nodeClasses"
    :style="nodeStyles"
    :data-wt-node-id="nodeDomId"
  >
    <NuxtLink
      v-if="href"
      class="wt-image-link"
      :to="href"
      :external="isExternalHref"
      :aria-label="ariaLabel"
    >
      <img
        class="wt-image"
        :src="src"
        :alt="alt"
        :style="imgStyle"
        :loading="isHero ? 'eager' : 'lazy'"
        :fetchpriority="isHero ? 'high' : 'auto'"
      />
    </NuxtLink>
    <img
      v-else
      class="wt-image"
      :src="src"
      :alt="alt"
      :style="imgStyle"
      :data-wt-caption="caption || undefined"
      :loading="isHero ? 'eager' : 'lazy'"
      :fetchpriority="isHero ? 'high' : 'auto'"
    />
  </div>
</template>

<style scoped>
.wt-image-block { max-width: 100%; }
/*
  The img is at least as tall as the block's own min-height. `height: 100%`
  only resolves when the block's height does: a block stating `height: 100%`
  under an auto-height column (the catalog's split heroes: "Blob Photo",
  "Hero Image", with a minHeight beside it) is only as tall as its
  min-height, and the img fell back to the photo's aspect — a 3:2 photo
  covered 387px of a 420px blob and left a band of the block's fill below it.
  `inherit` reads the block's COMPUTED min-height, so it follows the
  breakpoint rules (`[data-wt-node-id]`, !important) where an inline value
  would carry the desktop floor onto a phone. The link sits between them, so
  it passes the floor on. Mirrored by the builder canvas (`lib/image-frame.ts`).
*/
.wt-image-link { display: block; width: 100%; height: 100%; min-height: inherit; }
.wt-image { width: 100%; height: 100%; min-height: inherit; display: block; /* object-fit/object-position driven by :style binding */ }
</style>
