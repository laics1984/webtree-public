<script setup lang="ts">
import PublicSiteShell from '~/components/public/PublicSiteShell.vue'
import SchemaRenderer from '~/components/renderer/SchemaRenderer.vue'

const payload = await usePublicPage()
usePublicSeo(payload)
</script>

<template>
  <PublicSiteShell
    :entity="payload?.entity"
    :site="payload?.site"
    :body-schema="payload?.page?.bodySchema"
  >
    <template #default="{ headerOverlaySpacerPaddingTop, globalHeroMinHeight }">
      <SchemaRenderer
        :schema="payload?.page?.bodySchema"
        scope="body"
        :overlay-spacer-padding-top="headerOverlaySpacerPaddingTop"
        :global-hero-min-height="globalHeroMinHeight"
      />
    </template>
  </PublicSiteShell>
</template>
