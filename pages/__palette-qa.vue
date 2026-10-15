<script setup lang="ts">
import PublicSiteShell from '~/components/public/PublicSiteShell.vue'
import SchemaRenderer from '~/components/renderer/SchemaRenderer.vue'
import fixtures from '../public/palette-qa-fixtures.json'
definePageMeta({ layout: false })
const route = useRoute()
const fixture = fixtures[Number(route.query.fixture ?? 0)]
const site = {builderStyles:fixture.site.builder_styles, headerSchema:fixture.layout.header, footerSchema:fixture.layout.footer, menus:fixture.layout.menus}
const body = fixture.site.pages[Number(route.query.page ?? 0)].body_schema
const entity = {id:'colortest0001', publicIdentifier:'colortest0001', name:fixture.site.site_name, resolvedHost:'localhost'}
</script>
<template>
  <PublicSiteShell :entity="entity" :site="site" :body-schema="body">
    <template #default="slotProps">
      <SchemaRenderer :schema="body" scope="body" :overlay-spacer-padding-top="slotProps.headerOverlaySpacerPaddingTop" :global-hero-min-height="slotProps.globalHeroMinHeight" />
    </template>
  </PublicSiteShell>
</template>
