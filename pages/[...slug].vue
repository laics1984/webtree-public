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

// Keyed per path: each client-side navigation to this catch-all route mounts
// a fresh `[...slug]` instance (Nuxt's RouteProvider is keyed by `fullPath`).
// A shared key would make the new instance inherit the previous instance's
// cached resolution and frozen `path` closure, re-resolving the old path.
const { data, error } = await useAsyncData(
  () => `resolve:${host}:${path.value}`,
  () => fetchPublicResolve(host, path.value),
  { watch: [path], default: () => null }
)

// `error.value` is the proxy's JSON error envelope: the upstream "notFound"
// kind is nested at `error.data.data.kind` (the proxy's own response body,
// itself shaped like `{ statusCode, data: { kind: 'notFound' } }`).
if (error.value) {
  const upstreamKind = (error.value as { data?: { data?: { kind?: string } } }).data?.data?.kind

  // `showError` (not `throw createError`) is required here: a thrown error
  // during setup of this dynamically-keyed catch-all, on a client-side
  // navigation, is logged as an unhandled error and leaves the previous
  // page's content on screen instead of rendering error.vue.
  if (upstreamKind === 'notFound') {
    showError(createError({ statusCode: 404, statusMessage: 'Page not found' }))
  } else {
    showError(createError({ statusCode: 502, statusMessage: 'Unable to resolve this URL right now.' }))
  }
}

const resolution = computed(() => data.value)

if (!error.value) {
  if (!resolution.value || resolution.value.kind === 'notFound') {
    showError(createError({ statusCode: 404, statusMessage: 'Page not found' }))
  } else if (resolution.value.kind === 'redirect' && resolution.value.redirectTo) {
    await navigateTo(resolution.value.redirectTo, {
      redirectCode: resolution.value.status ?? 301,
      replace: true,
    })
  }
}

provide(contentPrefixesKey, resolution.value?.prefixes ?? null)

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
