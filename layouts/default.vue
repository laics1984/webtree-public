<script setup lang="ts">
import PublicSitePage from '~/components/public/PublicSitePage.vue'
import { getRequestHost } from '~/lib/host'

// When this layout unmounts (navigating to a layout:false page such as an article),
// clear the page cache so the next mount fetches fresh data for the new route.
// Without this, `usePublicPage`'s fixed-key cache returns stale data on remount
// because its `watch: [path]` watcher only fires on changes AFTER mount.
onUnmounted(() => {
  clearNuxtData(`public-page:${getRequestHost()}`)
})
</script>

<template>
  <PublicSitePage />
  <slot />
</template>
