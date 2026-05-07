<script setup lang="ts">
import { provide } from 'vue'
import PublicSiteShell from '~/components/public/PublicSiteShell.vue'
import SchemaRenderer from '~/components/renderer/SchemaRenderer.vue'
import { currentItemKey } from '~/lib/currentItem'

definePageMeta({ layout: false })

const route = useRoute()
const slug = String(route.params.slug)

const payload = await useDetailPage('event', slug)

provide(currentItemKey, payload.value!.content.item)

const template = computed(() => payload.value!.template.template)
const item = computed(() => payload.value!.content.item)
const entity = computed(() => payload.value!.template.entity)
const site = computed(() => payload.value!.template.site)

useHead({
  title: item.value.title,
  meta: [
    { name: 'description', content: item.value.excerpt || '' },
  ],
})
</script>

<template>
  <PublicSiteShell :entity="entity" :site="site" :body-schema="template.bodySchema">
    <SchemaRenderer :schema="template.bodySchema" scope="event-template" />
  </PublicSiteShell>
</template>
