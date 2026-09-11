<script setup lang="ts">
import { computed, provide } from 'vue'
import PublicSiteShell from '~/components/public/PublicSiteShell.vue'
import SchemaRenderer from '~/components/renderer/SchemaRenderer.vue'
import { contentCoverStyle, usesContentCover } from '~/lib/backgroundPhoto'
import { currentItemKey } from '~/lib/currentItem'
import { getRequestHost } from '~/lib/host'
import { buildAbsolutePublicUrl } from '~/lib/publicFeed'
import { normalizeSchemaNodes } from '~/lib/schema'
import type { PublicContentItemType } from '~/types/public'

const props = defineProps<{
  type: PublicContentItemType
  slug: string
}>()

const payload = await useDetailPage(props.type, props.slug)

provide(currentItemKey, payload.value!.content.item)

const template = computed(() => payload.value!.template.template)
const item = computed(() => payload.value!.content.item)
const entity = computed(() => payload.value!.template.entity)
const site = computed(() => payload.value!.template.site)
const scope = computed(() => (props.type === 'event' ? 'event-template' : 'article-template'))

// The item's cover, for a cover hero to paint (see CONTENT_COVER_VAR) — set on
// the rendered tree, every section of which inherits it.
const coverStyle = computed(() => contentCoverStyle(item.value.image))

// A cover hero's photo is a CSS background, which the preload scanner cannot
// see — and it is the page's largest image, so the browser is told up front.
const coverPreloadHref = computed(() =>
  item.value.image && usesContentCover(normalizeSchemaNodes(template.value.bodySchema))
    ? item.value.image
    : null
)

const config = useRuntimeConfig()
const requestHost = getRequestHost()

// Absolute, and resolved against the site's canonical host so the preview host
// points its canonical at the client's own domain.
const canonicalUrl = computed(() =>
  item.value.canonicalPath
    ? buildAbsolutePublicUrl(
        entity.value,
        requestHost,
        item.value.canonicalPath,
        config.public.siteProtocol,
        config.public.platformBaseDomain
      )
    : null
)

useHead({
  title: () => item.value.title,
  meta: [{ name: 'description', content: () => item.value.excerpt || '' }],
  link: () => [
    ...(canonicalUrl.value ? [{ rel: 'canonical', href: canonicalUrl.value }] : []),
    ...(coverPreloadHref.value
      ? [{ rel: 'preload', as: 'image', href: coverPreloadHref.value, fetchpriority: 'high' as const }]
      : []),
  ],
})
</script>

<template>
  <PublicSiteShell :entity="entity" :site="site" :body-schema="template.bodySchema">
    <template #default="{ headerOverlaySpacerPaddingTop, globalHeroMinHeight }">
      <SchemaRenderer
        :schema="template.bodySchema"
        :scope="scope"
        :style="coverStyle"
        :overlay-spacer-padding-top="headerOverlaySpacerPaddingTop"
        :global-hero-min-height="globalHeroMinHeight"
      />
    </template>
  </PublicSiteShell>
</template>
