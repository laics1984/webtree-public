<script setup lang="ts">
import { NOINDEX_ROBOTS } from '~/lib/indexing'

// Baseline robots directive for every route, including the `layout: false`
// content pages that never reach usePublicSeo. On indexable hosts this emits
// nothing, leaving page-level SEO in sole control; on preview hosts both emit
// the same directive and unhead dedupes by meta name.
if (!useHostIndexing()) {
  useHead({ meta: [{ name: 'robots', content: NOINDEX_ROBOTS }] })
}
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
