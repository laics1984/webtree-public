<script setup lang="ts">
import { provide } from 'vue'
import PublicSitePage from '~/components/public/PublicSitePage.vue'
import ContentDetail from '~/components/public/ContentDetail.vue'
import ContentListing from '~/components/public/ContentListing.vue'
import { fetchPublicResolve } from '~/lib/api'
import { getRequestHost } from '~/lib/host'
import { contentPrefixesKey } from '~/lib/contentPrefixes'

// This catch-all is the server-authoritative dispatcher: it asks the API to
// resolve the path, then renders the matching surface. See
// webtree-cms-api/specs/permalinks-resolver-contract.md.
definePageMeta({ layout: false })

const route = useRoute()
const host = getRequestHost()
const path = computed(() => route.path)

const { data, error } = await useAsyncData(
  `resolve:${host}`,
  () => fetchPublicResolve(host, path.value),
  { watch: [path], default: () => null }
)

if (error.value) {
  throw createError({ statusCode: 502, statusMessage: 'Unable to resolve this URL right now.' })
}

const resolution = computed(() => data.value)

if (!resolution.value || resolution.value.kind === 'notFound') {
  throw createError({ statusCode: 404, statusMessage: 'Page not found' })
}

if (resolution.value.kind === 'redirect' && resolution.value.redirectTo) {
  await navigateTo(resolution.value.redirectTo, {
    redirectCode: resolution.value.status ?? 301,
    replace: true,
  })
}

provide(contentPrefixesKey, resolution.value.prefixes ?? null)

const isDetail = computed(
  () => resolution.value?.kind === 'article' || resolution.value?.kind === 'event'
)
const isListing = computed(
  () =>
    resolution.value?.kind === 'articleListing' || resolution.value?.kind === 'eventListing'
)
const detailType = computed(() => (resolution.value?.kind === 'event' ? 'event' : 'article'))
const listingType = computed(() =>
  resolution.value?.kind === 'eventListing' ? 'event' : 'article'
)
</script>

<template>
  <ContentDetail
    v-if="isDetail"
    :type="detailType"
    :slug="String(resolution?.slug ?? '')"
  />
  <ContentListing
    v-else-if="isListing"
    :type="listingType"
    :taxonomy-type="resolution?.listing?.taxonomyType ?? null"
    :taxonomy-slug="resolution?.listing?.taxonomySlug ?? null"
  />
  <PublicSitePage v-else-if="resolution?.kind === 'page'" />
</template>
