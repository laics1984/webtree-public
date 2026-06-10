<script setup lang="ts">
import { computed, provide } from 'vue'
import PublicSiteShell from '~/components/public/PublicSiteShell.vue'
import SchemaRenderer from '~/components/renderer/SchemaRenderer.vue'
import { currentListingKey } from '~/lib/currentListing'
import type { CmsTaxonomyType, PublicContentItemType } from '~/types/public'

const props = defineProps<{
  type: PublicContentItemType
  taxonomyType?: CmsTaxonomyType | null
  taxonomySlug?: string | null
}>()

const payload = await useContentListingPage(props.type, {
  taxonomyType: props.taxonomyType ?? null,
  taxonomySlug: props.taxonomySlug ?? null,
})

const template = computed(() => payload.value!.template.template)
const entity = computed(() => payload.value!.template.entity)
const site = computed(() => payload.value!.template.site)
const listingContext = computed(
  () => payload.value!.list.listingContext ?? { mode: 'all', taxonomy: null }
)

provide(currentListingKey, listingContext.value)

const scope = computed(() =>
  props.type === 'event' ? 'event-listing-template' : 'article-listing-template'
)
const fallbackTitle = computed(() => (props.type === 'event' ? 'Events' : 'Articles'))
const headTitle = computed(() => listingContext.value.taxonomy?.title || fallbackTitle.value)
const headDescription = computed(
  () =>
    listingContext.value.taxonomy?.description ||
    `Browse published ${props.type === 'event' ? 'events' : 'articles'}.`
)

useHead({
  title: () => headTitle.value,
  meta: [{ name: 'description', content: () => headDescription.value }],
})
</script>

<template>
  <PublicSiteShell :entity="entity" :site="site" :body-schema="template.bodySchema">
    <SchemaRenderer :schema="template.bodySchema" :scope="scope" />
  </PublicSiteShell>
</template>
