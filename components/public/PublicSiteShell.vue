<script setup lang="ts">
import type { CSSProperties } from 'vue'
import SchemaRenderer from '~/components/renderer/SchemaRenderer.vue'
import GalleryLightbox from '~/components/public/GalleryLightbox.vue'
import {
  getNodeStyles,
  runtimeBuilderStylesKey,
  runtimeHeaderOverlayKey,
  runtimeHeaderSchemaKey,
  runtimeHeaderShrinkKey,
  runtimeMenusKey,
} from '~/lib/blockRuntime'
import {
  type Band,
  inkClassForBand,
  pickBandAtY,
  probeY,
  readBandRects,
} from '~/lib/adaptiveInk'
import { isFirstSectionHeaderOverlaySafe } from '~/lib/headerOverlay'
import { buildResponsiveStylesheet } from '~/lib/responsiveRuntime'
import {
  findFirstNonBreadcrumbNode,
  getNodeChildren,
  getNodeName,
  isHeroSectionName,
  normalizeBodySectionNodes,
  normalizeSchemaNodes,
} from '~/lib/schema'
import { buildCssVars } from '~/lib/styles'
import { mergeVaryHeader } from '~/lib/host'
import type {
  PublicBlockNode,
  PublicEntityPayload,
  PublicSchemaTree,
  SitePayload,
} from '~/types/public'

const props = defineProps<{
  entity?: PublicEntityPayload | null
  site?: SitePayload | null
  bodySchema?: PublicSchemaTree | PublicBlockNode[] | null
}>()

const BACKGROUND_STYLE_KEYS = [
  'background',
  'backgroundColor',
  'backgroundImage',
  'backgroundSize',
  'backgroundPosition',
  'backgroundRepeat',
  'backgroundAttachment',
  'backgroundClip',
  'backgroundOrigin',
] as const

function findHeaderBarNode(root: PublicBlockNode): PublicBlockNode | null {
  const children = getNodeChildren(root)
  for (const child of children) {
    if ((child as Record<string, unknown>)?.headerBar === true) {
      return child
    }
  }
  return null
}

function pickBackgroundStylesFrom(node: PublicBlockNode): CSSProperties | undefined {
  const styles = getNodeStyles(node)
  const picked: Record<string, string | number> = {}
  for (const key of BACKGROUND_STYLE_KEYS) {
    const value = styles[key]
    if (value !== undefined && value !== '') {
      picked[key] = value
    }
  }
  return Object.keys(picked).length ? (picked as CSSProperties) : undefined
}

function pickRootBackgroundStyles(schema: unknown): CSSProperties | undefined {
  const [root] = normalizeSchemaNodes(schema as any)
  if (!root) return undefined

  // Self-chrome archetypes (floating pill) carry their background on the inner
  // headerBar container — the root is transparent. The wrapper must also stay
  // transparent so the hero section shows through; the bar paints its own chrome.
  const bar = findHeaderBarNode(root)
  if (bar) return undefined

  return pickBackgroundStylesFrom(root)
}

function pickRootColorStyle(schema: unknown): string | undefined {
  const [root] = normalizeSchemaNodes(schema as any)
  if (!root) return undefined
  const styles = getNodeStyles(root)
  return typeof styles.color === 'string' ? styles.color : undefined
}

const cssVars = computed(() => buildCssVars(props.site?.builderStyles))
const runtimeBuilderStyles = computed(() => props.site?.builderStyles)
const runtimeMenus = computed(() => props.site?.menus ?? [])
const pageWidthMode = computed(() => {
  const styles = props.site?.builderStyles
  const page = styles && typeof styles === 'object' && !Array.isArray(styles) ? styles.page : null

  if (!page || typeof page !== 'object' || Array.isArray(page)) {
    return 'contained'
  }

  return page.widthMode === 'full' ? 'full' : 'contained'
})
const runtimeHeaderSchema = computed(() => props.site?.headerSchema)

// Site-wide overlay intent from the generator (behavior.overlay). On its own
// it does NOT float the header on a page — each page's first section must
// also carry the generator's `headerOverlaySafe` marker (see
// firstSectionOverlaySafe below), so pages that open with a compact hero on a
// light background keep the solid sticky header from scroll 0.
const staticHeaderOverlay = computed(() => {
  const headerSchema = props.site?.headerSchema

  if (!headerSchema || typeof headerSchema !== 'object' || Array.isArray(headerSchema)) {
    return false
  }

  const behavior = 'behavior' in headerSchema ? headerSchema.behavior : null
  return Boolean(
    behavior &&
    typeof behavior === 'object' &&
    !Array.isArray(behavior) &&
    'overlay' in behavior &&
    behavior.overlay === true
    )
})

// Per-page signal: does THIS page's first real section (skipping a leading
// breadcrumb on sub-pages) carry the full-bleed background-hero signature
// emitted by schema_builder.py's _build_hero_background? No new backend field
// needed — the signature is already present in bodySchema.
const heroIsBackgroundLayout = computed(() => {
  const nodes = normalizeBodySectionNodes(props.bodySchema as any)
  const first = findFirstNonBreadcrumbNode(nodes)?.node
  if (!first) return false
  if ((first as Record<string, unknown>)?.name !== 'Hero') return false
  const styles = getNodeStyles(first)
  const minHeight = styles.minHeight
  const backgroundImage = styles.backgroundImage
  return (
    typeof minHeight === 'string' &&
    minHeight.includes('--builder-hero-min-height') &&
    typeof backgroundImage === 'string' &&
    backgroundImage.includes('linear-gradient')
  )
})

// Reveal-on-scroll config (mirrors builder HeaderBehavior). Default ON at 80px so
// older headers (and background-hero pages) keep the standard behavior. Read
// defensively, same as staticHeaderOverlay / runtimeHeaderPosition above.
const DEFAULT_HEADER_SCROLL_REVEAL_OFFSET_PX = 80
const HEADER_SCROLL_REVEAL_OFFSET_MIN_PX = 0
const HEADER_SCROLL_REVEAL_OFFSET_MAX_PX = 600

function readHeaderBehavior(): Record<string, unknown> | null {
  const headerSchema = props.site?.headerSchema
  if (!headerSchema || typeof headerSchema !== 'object' || Array.isArray(headerSchema)) {
    return null
  }
  const behavior = 'behavior' in headerSchema ? headerSchema.behavior : null
  return behavior && typeof behavior === 'object' && !Array.isArray(behavior)
    ? (behavior as Record<string, unknown>)
    : null
}

const headerRevealOnScroll = computed(() => {
  const behavior = readHeaderBehavior()
  // Only an explicit `false` disables the reveal; missing field stays ON.
  return behavior?.revealBackgroundOnScroll !== false
})

const headerRevealOffset = computed(() => {
  const raw = readHeaderBehavior()?.scrollRevealOffset
  if (typeof raw !== 'number' || !Number.isFinite(raw)) {
    return DEFAULT_HEADER_SCROLL_REVEAL_OFFSET_PX
  }
  return Math.min(
    HEADER_SCROLL_REVEAL_OFFSET_MAX_PX,
    Math.max(HEADER_SCROLL_REVEAL_OFFSET_MIN_PX, Math.round(raw))
  )
})

// Shrink-on-scroll config (mirrors builder HeaderBehavior). Off by default —
// unlike reveal, this has no pre-existing behavior to preserve.
const DEFAULT_HEADER_SHRINK_OFFSET_PX = 80
const HEADER_SHRINK_OFFSET_MIN_PX = 0
const HEADER_SHRINK_OFFSET_MAX_PX = 600
const HEADER_SHRINK_AMOUNT_MIN_PERCENT = 50
const HEADER_SHRINK_AMOUNT_MAX_PERCENT = 100
const DEFAULT_HEADER_SHRINK_AMOUNT_PERCENT = 80

const headerShrinkOnScroll = computed(() => readHeaderBehavior()?.shrinkOnScroll === true)

const headerShrinkOffset = computed(() => {
  // Overlay headers share the reveal trigger — one scroll moment, two effects.
  if (wantsHeaderOverlay.value) {
    return headerRevealOffset.value
  }
  const raw = readHeaderBehavior()?.scrollShrinkOffset
  if (typeof raw !== 'number' || !Number.isFinite(raw)) {
    return DEFAULT_HEADER_SHRINK_OFFSET_PX
  }
  return Math.min(
    HEADER_SHRINK_OFFSET_MAX_PX,
    Math.max(HEADER_SHRINK_OFFSET_MIN_PX, Math.round(raw))
  )
})

const headerShrinkRatio = computed(() => {
  const raw = readHeaderBehavior()?.shrinkAmount
  const amount =
    typeof raw === 'number' && Number.isFinite(raw)
      ? Math.min(
          HEADER_SHRINK_AMOUNT_MAX_PERCENT,
          Math.max(HEADER_SHRINK_AMOUNT_MIN_PERCENT, Math.round(raw))
        )
      : DEFAULT_HEADER_SHRINK_AMOUNT_PERCENT
  return amount / 100
})

// Adaptive ink (`behavior.adaptiveInk`, emitted by the generator for
// self-chrome archetypes only — the floating pill). That bar never solidifies,
// so it has no chrome of its own to stay legible against: its ink, glass tint
// and hairline follow whichever marked section is under it. See lib/adaptiveInk.
const headerAdaptiveInk = computed(() => readHeaderBehavior()?.adaptiveInk === true)
const headerEl = ref<HTMLElement | null>(null)
const inkBand = ref<Band | null>(null)

// Scroll-aware: the header starts transparent over a full-bleed hero and
// resolves to the normal solid/sticky bar once the user scrolls past the
// configured offset; shrinks its logo/padding past its own (possibly shared)
// offset. One listener drives all of it — each ref only updates (and
// re-renders) when its own threshold actually flips, same as before.
const isScrolled = ref(false)
const isShrunk = ref(false)
function handleHeaderScroll() {
  const scrollY = window.scrollY

  const nextScrolled = scrollY > headerRevealOffset.value
  if (nextScrolled !== isScrolled.value) {
    isScrolled.value = nextScrolled
  }

  const nextShrunk = headerShrinkOnScroll.value && scrollY > headerShrinkOffset.value
  if (nextShrunk !== isShrunk.value) {
    isShrunk.value = nextShrunk
  }

  if (!headerAdaptiveInk.value || !headerEl.value) return
  // Both rects come from getBoundingClientRect in the same frame, so no
  // scroll-offset arithmetic is needed — including for the overlay header,
  // which is `position: fixed` (see the stylesheet below).
  const nextBand = pickBandAtY(
    readBandRects(document),
    probeY(headerEl.value.getBoundingClientRect())
  )
  if (nextBand !== inkBand.value) {
    inkBand.value = nextBand
  }
}

// rAF-gated: the adaptive-ink branch measures the marked sections, which is
// layout work, and scroll fires far more often than a frame. The earlier
// threshold flips are cheap but ride along — one listener, one frame budget.
let scrollFrame = 0
function onHeaderScroll() {
  if (scrollFrame) return
  scrollFrame = requestAnimationFrame(() => {
    scrollFrame = 0
    handleHeaderScroll()
  })
}
onMounted(() => {
  window.addEventListener('scroll', onHeaderScroll, { passive: true })
  window.addEventListener('resize', onHeaderScroll, { passive: true })
  handleHeaderScroll()
})
onUnmounted(() => {
  window.removeEventListener('scroll', onHeaderScroll)
  window.removeEventListener('resize', onHeaderScroll)
  if (scrollFrame) cancelAnimationFrame(scrollFrame)
})
// A route change swaps the whole body for one with different bands, and it
// does not scroll — so nothing would re-measure. Re-probe once the new
// sections are in the DOM.
watch(
  () => props.bodySchema,
  () => {
    if (!headerAdaptiveInk.value) return
    inkBand.value = null
    nextTick(handleHeaderScroll)
  }
)

const headerInkClass = computed(() =>
  headerAdaptiveInk.value ? inkClassForBand(inkBand.value) : null
)

const runtimeHeaderShrink = computed(() => ({
  active: isShrunk.value,
  ratio: headerShrinkRatio.value,
}))

// Per-page marker from the generator: the first section is a full-bleed hero
// whose dark legibility overlay keeps the transparent header's white ink
// readable. Catalog heroes carry this instead of the legacy style signature
// sniffed by heroIsBackgroundLayout above.
const firstSectionOverlaySafe = computed(() =>
  isFirstSectionHeaderOverlaySafe(props.bodySchema)
)

// The transparent phase runs when either (a) the legacy full-bleed style
// signature matches (pre-marker sites keep today's behavior), or (b) the
// generator asked for overlay site-wide AND this page's first section is
// marked overlay-safe. behavior.overlay stays the site-wide kill switch for
// marker-carrying sites.
const wantsHeaderOverlay = computed(
  () =>
    heroIsBackgroundLayout.value ||
    (staticHeaderOverlay.value && firstSectionOverlaySafe.value)
)

const runtimeHeaderOverlay = computed(() => {
  if (!wantsHeaderOverlay.value) {
    return false
  }
  // Reveal disabled → stay transparent regardless of scroll position.
  if (!headerRevealOnScroll.value) {
    return true
  }
  return !isScrolled.value
})
const runtimeHeaderPosition = computed(() => {
  const headerSchema = props.site?.headerSchema

  if (!headerSchema || typeof headerSchema !== 'object' || Array.isArray(headerSchema)) {
    return 'static'
  }

  const behavior = 'behavior' in headerSchema ? headerSchema.behavior : null
  if (
    behavior &&
    typeof behavior === 'object' &&
    !Array.isArray(behavior) &&
    'position' in behavior &&
    behavior.position === 'sticky'
  ) {
    return 'sticky'
  }

  return 'static'
})
const headerWrapperStyle = computed(() => pickRootBackgroundStyles(props.site?.headerSchema))
const footerWrapperStyle = computed(() => {
  const bg = pickRootBackgroundStyles(props.site?.footerSchema)
  const ink = pickRootColorStyle(props.site?.footerSchema)
  if (!bg && !ink) return undefined
  return {
    ...bg,
    ...(ink ? { color: ink, '--wt-footer-ink': ink } as CSSProperties : {}),
  }
})

// Mirror of builder/src/components/tabs/editor-components/Editor.tsx's
// `shouldSpaceFirstSectionForOverlay` / `headerRootMinHeight` /
// `HEADER_OVERLAY_SPACER_BUFFER_PX`. An overlay header floats transparently
// over the first section instead of pushing it down, so when that first
// section is a Hero, push its content down by the header's own height (plus
// breathing room) so the hero's heading isn't hidden behind the header.
const HEADER_OVERLAY_SPACER_BUFFER_PX = 32
const HEADER_OVERLAY_SPACER_FALLBACK_MIN_HEIGHT = '96px'

const headerRootMinHeight = computed(() => {
  const [headerRoot] = normalizeSchemaNodes(props.site?.headerSchema as any)
  const minHeight = headerRoot ? getNodeStyles(headerRoot).minHeight : undefined
  return typeof minHeight === 'string' && minHeight.trim().length > 0
    ? minHeight
    : HEADER_OVERLAY_SPACER_FALLBACK_MIN_HEIGHT
})

const firstBodySectionIsHero = computed(() => {
  const nodes = normalizeBodySectionNodes(props.bodySchema as any)
  const first = findFirstNonBreadcrumbNode(nodes)?.node
  return Boolean(first && isHeroSectionName(getNodeName(first)))
})

const shouldSpaceFirstSectionForOverlay = computed(
  () => runtimeHeaderOverlay.value && firstBodySectionIsHero.value
)

const headerOverlaySpacerPaddingTop = computed(() =>
  shouldSpaceFirstSectionForOverlay.value
    ? `calc(${headerRootMinHeight.value} + ${HEADER_OVERLAY_SPACER_BUFFER_PX}px)`
    : undefined
)

// The site-wide "Hero height" default (full screen vs banded) — needed by
// SchemaRenderer to tell a real full-screen hero apart from one that merely
// falls back to the site default var. Keep in lockstep with builder
// src/lib/builder-styles.ts's `BuilderStyles.hero.minHeight`.
const globalHeroMinHeight = computed(() => {
  const styles = props.site?.builderStyles
  const hero = styles && typeof styles === 'object' && !Array.isArray(styles) ? styles.hero : null
  const minHeight = hero && typeof hero === 'object' && !Array.isArray(hero) ? hero.minHeight : null
  return typeof minHeight === 'string' && minHeight.trim().length > 0 ? minHeight : undefined
})
const responsiveCss = computed(() =>
  buildResponsiveStylesheet({
    headerSchema: props.site?.headerSchema,
    bodySchema: props.bodySchema,
    footerSchema: props.site?.footerSchema,
  })
)

provide(runtimeMenusKey, runtimeMenus)
provide(runtimeHeaderSchemaKey, runtimeHeaderSchema)
provide(runtimeHeaderOverlayKey, runtimeHeaderOverlay)
provide(runtimeHeaderShrinkKey, runtimeHeaderShrink)
provide(runtimeBuilderStylesKey, runtimeBuilderStyles)

// Entrance/scroll motion declared on schema nodes (`motion` annotations from
// the section catalog / builder). Client-only; SSR markup is never hidden.
useSchemaMotion({
  schemas: () => [props.site?.headerSchema, props.bodySchema, props.site?.footerSchema],
  builderStyles: () => props.site?.builderStyles,
})

// Click-to-enlarge on gallery grids (`lightbox` markers from the section
// catalog). Client-only; tiles stay plain images without it.
const {
  open: lightboxOpen,
  slides: lightboxSlides,
  index: lightboxIndex,
  close: closeLightbox,
} = useSchemaLightbox({
  schemas: () => [props.site?.headerSchema, props.bodySchema, props.site?.footerSchema],
})

// Load the theme's web fonts. The Google Fonts css2 CSV is carried in
// builderStyles.typography.googleFonts (set by the generator); without this the
// page falls back to device-installed fonts.
const googleFontsHref = computed(() => {
  const styles = props.site?.builderStyles
  const typo =
    styles && typeof styles === 'object' && !Array.isArray(styles)
      ? (styles as Record<string, unknown>).typography
      : null
  const raw =
    typo && typeof typo === 'object' && !Array.isArray(typo)
      ? (typo as Record<string, unknown>).googleFonts
      : null
  const families = Array.isArray(raw)
    ? raw.filter((f): f is string => typeof f === 'string' && f.trim() !== '')
    : []
  if (families.length === 0) return ''
  const params = families.map((f) => `family=${f.replace(/ /g, '+')}`).join('&')
  return `https://fonts.googleapis.com/css2?${params}&display=swap`
})

useHead(() => ({
  link: googleFontsHref.value
    ? [{ key: 'wt-google-fonts', rel: 'stylesheet', href: googleFontsHref.value }]
    : [],
  style: responsiveCss.value
    ? [{
        key: 'wt-responsive-runtime',
        textContent: responsiveCss.value,
      }]
    : [],
}))

if (import.meta.server) {
  const vary = useResponseHeader('vary')
  vary.value = mergeVaryHeader(vary.value, ['Host', 'X-Forwarded-Host'])
}
</script>

<template>
  <div
    class="wt-site"
    :style="cssVars"
    :data-public-identifier="entity?.publicIdentifier || ''"
    :data-page-width-mode="pageWidthMode"
  >
    <header
      v-if="site?.headerSchema"
      ref="headerEl"
      class="wt-page-header"
      :class="[
        {
          'wt-page-header--sticky': runtimeHeaderPosition === 'sticky' && !runtimeHeaderOverlay,
          'wt-page-header--overlay': runtimeHeaderOverlay,
          'wt-page-header--overlay-sticky': runtimeHeaderOverlay && runtimeHeaderPosition === 'sticky',
          'wt-page-header--solid': !runtimeHeaderOverlay,
        },
        headerInkClass,
      ]"
      :style="runtimeHeaderOverlay ? undefined : headerWrapperStyle"
    >
      <SchemaRenderer :schema="site?.headerSchema" scope="header" />
    </header>
    <main class="wt-main">
      <slot
        :header-overlay-spacer-padding-top="headerOverlaySpacerPaddingTop"
        :global-hero-min-height="globalHeroMinHeight"
      />
    </main>
    <footer v-if="site?.footerSchema" class="wt-page-footer" :style="footerWrapperStyle">
      <SchemaRenderer :schema="site?.footerSchema" scope="footer" />
    </footer>
    <GalleryLightbox
      v-model:index="lightboxIndex"
      :open="lightboxOpen"
      :slides="lightboxSlides"
      @close="closeLightbox"
    />
  </div>
</template>

<style>
html,
body {
  margin: 0;
}

body {
  background: var(--builder-page-background, var(--wt-color-bg, #ffffff));
}

.wt-site {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  font-family: var(--wt-font-body, Inter, Arial, sans-serif);
  color: var(--wt-color-text, #111827);
  background: var(--builder-page-background, var(--wt-color-bg, #ffffff));
}

.wt-site[data-page-width-mode='contained'] {
  max-width: var(--builder-page-max-width, 1280px);
  margin-inline: auto;
}

.wt-site[data-page-width-mode='full'] {
  max-width: none;
}

.wt-page-header,
.wt-page-footer {
  flex-shrink: 0;
}

.wt-page-header {
  transition: background-color 200ms ease, border-color 200ms ease, backdrop-filter 200ms ease,
    color 200ms ease;
}

/* Scroll-adaptive ink, floating pill only (behavior.adaptiveInk; the class is
   never applied without it). The generator ships the pill's ink, glass tint
   and hairline as `var(--wt-pill-*, <built value>)`, so all these rules do is
   DEFINE the vars — the built value stays the fallback, and a page that never
   gets a class here renders exactly as it always did. That is also why there
   is no !important anywhere: a custom property inherits into the schema's own
   inline style, instead of fighting it for specificity.

   Values, not tokens, because the flip has to work over a section whose colour
   the header knows nothing about: white ink on a dark neutral glass, near-black
   on a light one. The transition above carries both across the seam. */
.wt-page-header--ink-light {
  --wt-pill-ink: #ffffff;
  --wt-pill-tint: rgba(18, 18, 20, 0.3);
  --wt-pill-hairline: rgba(255, 255, 255, 0.16);
}

.wt-page-header--ink-dark {
  --wt-pill-ink: #0f172a;
  --wt-pill-tint: rgba(255, 255, 255, 0.22);
  --wt-pill-hairline: rgba(15, 23, 42, 0.1);
}

/* A custom property is not an animatable value — what animates is each
   property that READS it, on the element that reads it. Those are the pill's
   descendants (nav links inherit the ink, the bar paints the tint), so the
   transition has to live there, not only on the header. Scoped to the two
   adaptive classes: no other header pays for it. */
.wt-page-header--ink-light *,
.wt-page-header--ink-dark * {
  transition: color 200ms ease, background-color 200ms ease, border-color 200ms ease;
}

.wt-page-header--sticky {
  position: sticky;
  top: 0;
  z-index: 20;
}

.wt-page-header--overlay {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  z-index: 30;
  background: transparent;
  border-bottom-color: transparent;
  backdrop-filter: none;
}

/* While the header floats transparent over a full-bleed hero, its text-bearing
   elements (the generator stamps `wt-header-ink` on the brand mark and nav —
   never the CTA button, which keeps its own solid chrome) switch to white ink.
   !important is required to beat the generator's inline `color`; the rule
   vanishes with the class on solidify, so the inline colors return with the
   200ms header transition. */
.wt-page-header--overlay .wt-header-ink,
.wt-page-header--overlay .wt-header-ink * {
  color: #ffffff !important;
}

.wt-page-header--overlay .wt-header-ink {
  text-shadow: 0 1px 12px rgba(15, 23, 42, 0.35);
}

/* Sticky + overlay combined: pin the transparent header instead of letting
   it scroll away with the hero before the solid/sticky phase takes over.
   `position: sticky` would still reserve its own box in flow and never
   actually overlap anything — `fixed` removes it from flow *and* pins it to
   the viewport (no scale-transform wrapper here to break that, unlike the
   builder canvas). */
.wt-page-header--overlay-sticky {
  position: fixed;
}

.wt-page-header--solid {
  position: sticky;
  top: 0;
  z-index: 20;
}

.wt-main {
  min-height: 1px;
  flex: 1 0 auto;
}
</style>
