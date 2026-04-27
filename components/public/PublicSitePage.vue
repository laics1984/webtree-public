<script setup lang="ts">
import type { CSSProperties } from 'vue'
import SchemaRenderer from '~/components/renderer/SchemaRenderer.vue'
import { getNodeStyles, runtimeHeaderOverlayKey, runtimeHeaderSchemaKey, runtimeMenusKey } from '~/lib/blockRuntime'
import { buildResponsiveStylesheet } from '~/lib/responsiveRuntime'
import { normalizeSchemaNodes } from '~/lib/schema'
import { buildCssVars } from '~/lib/styles'
import { mergeVaryHeader } from '~/lib/host'

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

const payload = await usePublicPage()
usePublicSeo(payload)

const cssVars = computed(() => buildCssVars(payload.value?.site?.builderStyles))
const runtimeMenus = computed(() => payload.value?.site?.menus ?? [])
const pageWidthMode = computed(() => {
  const styles = payload.value?.site?.builderStyles
  const page = styles && typeof styles === 'object' && !Array.isArray(styles) ? styles.page : null

  if (!page || typeof page !== 'object' || Array.isArray(page)) {
    return 'contained'
  }

  return page.widthMode === 'full' ? 'full' : 'contained'
})
const runtimeHeaderSchema = computed(() => payload.value?.site?.headerSchema)
const runtimeHeaderOverlay = computed(() => {
  const headerSchema = payload.value?.site?.headerSchema

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
const runtimeHeaderPosition = computed(() => {
  const headerSchema = payload.value?.site?.headerSchema

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
const headerWrapperStyle = computed(() => pickRootBackgroundStyles(payload.value?.site?.headerSchema))
const footerWrapperStyle = computed(() => pickRootBackgroundStyles(payload.value?.site?.footerSchema))
const responsiveCss = computed(() =>
  buildResponsiveStylesheet({
    headerSchema: payload.value?.site?.headerSchema,
    bodySchema: payload.value?.page?.bodySchema,
    footerSchema: payload.value?.site?.footerSchema,
  })
)

provide(runtimeMenusKey, runtimeMenus)
provide(runtimeHeaderSchemaKey, runtimeHeaderSchema)
provide(runtimeHeaderOverlayKey, runtimeHeaderOverlay)

useHead(() => ({
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
    :data-site-key="payload?.entity?.siteKey || ''"
    :data-page-width-mode="pageWidthMode"
  >
    <header
      v-if="payload?.site?.headerSchema"
      class="wt-page-header"
      :class="{
        'wt-page-header--sticky': runtimeHeaderPosition === 'sticky' && !runtimeHeaderOverlay,
        'wt-page-header--overlay': runtimeHeaderOverlay,
      }"
      :style="headerWrapperStyle"
    >
      <SchemaRenderer :schema="payload?.site?.headerSchema" scope="header" />
    </header>
    <main class="wt-main">
      <SchemaRenderer :schema="payload?.page?.bodySchema" scope="body" />
    </main>
    <footer v-if="payload?.site?.footerSchema" class="wt-page-footer" :style="footerWrapperStyle">
      <SchemaRenderer :schema="payload?.site?.footerSchema" scope="footer" />
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
  background: var(--wt-color-bg, #ffffff);
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
}

.wt-main {
  min-height: 1px;
  flex: 1 0 auto;
}
</style>
