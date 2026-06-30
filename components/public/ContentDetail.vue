<script setup lang="ts">
import { computed, provide } from 'vue'
import PublicSiteShell from '~/components/public/PublicSiteShell.vue'
import SchemaRenderer from '~/components/renderer/SchemaRenderer.vue'
import { currentItemKey } from '~/lib/currentItem'
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

useHead({
  title: () => item.value.title,
  meta: [{ name: 'description', content: () => item.value.excerpt || '' }],
  link: () =>
    item.value.canonicalPath
      ? [{ rel: 'canonical', href: item.value.canonicalPath }]
      : [],
})
</script>

<template>
  <PublicSiteShell :entity="entity" :site="site" :body-schema="template.bodySchema">
    <template #default="{ headerOverlaySpacerPaddingTop, globalHeroMinHeight }">
      <SchemaRenderer
        :schema="template.bodySchema"
        :scope="scope"
        :overlay-spacer-padding-top="headerOverlaySpacerPaddingTop"
        :global-hero-min-height="globalHeroMinHeight"
      />
    </template>
  </PublicSiteShell>
</template>
