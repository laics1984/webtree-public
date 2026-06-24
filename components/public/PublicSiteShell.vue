<script setup lang="ts">
import type { CSSProperties } from 'vue'
import SchemaRenderer from '~/components/renderer/SchemaRenderer.vue'
import { getNodeStyles, runtimeHeaderOverlayKey, runtimeHeaderSchemaKey, runtimeMenusKey } from '~/lib/blockRuntime'
import { buildResponsiveStylesheet } from '~/lib/responsiveRuntime'
import { normalizeSchemaNodes } from '~/lib/schema'
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

function pickRootBackgroundStyles(schema: unknown): CSSProperties | undefined {
  const [root] = normalizeSchemaNodes(schema as any)
  if (!root) return undefined

  const styles = getNodeStyles(root)
  const picked: Record<string, string | number> = {}
  for (const key of BACKGROUND_STYLE_KEYS) {
    const value = styles[key]
    if (value !== undefined && value !== '') {
      picked[key] = value
    }
  }
  return Object.keys(picked).length ? (picked as CSSProperties) : undefined
}

const cssVars = computed(() => buildCssVars(props.site?.builderStyles))
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

// Static, site-wide opt-in (escape hatch — currently always false from the
// generator). Kept so a future backend flag can still force overlay on.
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
  const nodes = normalizeSchemaNodes(props.bodySchema as any)
  const first = nodes.find((node) => (node as Record<string, unknown>)?.name !== 'Breadcrumb')
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

// Scroll-aware: the header starts transparent over a full-bleed hero and
// resolves to the normal solid/sticky bar once the user scrolls past it.
const isScrolled = ref(false)
function handleHeaderScroll() {
  isScrolled.value = window.scrollY > 80
}
onMounted(() => {
  window.addEventListener('scroll', handleHeaderScroll, { passive: true })
  handleHeaderScroll()
})
onUnmounted(() => {
  window.removeEventListener('scroll', handleHeaderScroll)
})

const runtimeHeaderOverlay = computed(
  () => (staticHeaderOverlay.value || heroIsBackgroundLayout.value) && !isScrolled.value
)
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
const footerWrapperStyle = computed(() => pickRootBackgroundStyles(props.site?.footerSchema))
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

// Entrance/scroll motion declared on schema nodes (`motion` annotations from
// the section catalog / builder). Client-only; SSR markup is never hidden.
useSchemaMotion({
  schemas: () => [props.site?.headerSchema, props.bodySchema, props.site?.footerSchema],
  builderStyles: () => props.site?.builderStyles,
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
      class="wt-page-header"
      :class="{
        'wt-page-header--sticky': runtimeHeaderPosition === 'sticky' && !runtimeHeaderOverlay,
        'wt-page-header--overlay': runtimeHeaderOverlay,
        'wt-page-header--solid': !runtimeHeaderOverlay,
      }"
      :style="runtimeHeaderOverlay ? undefined : headerWrapperStyle"
    >
      <SchemaRenderer :schema="site?.headerSchema" scope="header" />
    </header>
    <main class="wt-main">
      <slot />
    </main>
    <footer v-if="site?.footerSchema" class="wt-page-footer" :style="footerWrapperStyle">
      <SchemaRenderer :schema="site?.footerSchema" scope="footer" />
    </footer>
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
  transition: background-color 200ms ease, border-color 200ms ease, backdrop-filter 200ms ease;
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
