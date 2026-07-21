<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import type { PublicBlockNode } from '~/types/public'
import { getNodeChildren, getNodeKey, normalizeBlockType } from '~/lib/schema'

defineOptions({ name: 'ElementRenderer' })

const props = defineProps<{ node: PublicBlockNode }>()
const isDev = import.meta.dev

const dynamicField = defineAsyncComponent(
  () => import('~/components/blocks/DynamicFieldBlock.vue')
)

const registry: Record<string, any> = {
  header: defineAsyncComponent(() => import('~/components/blocks/ContainerBlock.vue')),
  body: defineAsyncComponent(() => import('~/components/blocks/ContainerBlock.vue')),
  footer: defineAsyncComponent(() => import('~/components/blocks/ContainerBlock.vue')),
  container: defineAsyncComponent(() => import('~/components/blocks/ContainerBlock.vue')),
  '2col': defineAsyncComponent(() => import('~/components/blocks/ContainerBlock.vue')),
  '3col': defineAsyncComponent(() => import('~/components/blocks/ContainerBlock.vue')),
  text: defineAsyncComponent(() => import('~/components/blocks/TextBlock.vue')),
  section: defineAsyncComponent(() => import('~/components/blocks/SectionBlock.vue')),
  image: defineAsyncComponent(() => import('~/components/blocks/ImageBlock.vue')),
  video: defineAsyncComponent(() => import('~/components/blocks/VideoBlock.vue')),
  link: defineAsyncComponent(() => import('~/components/blocks/LinkBlock.vue')),
  menu: defineAsyncComponent(() => import('~/components/blocks/MenuBlock.vue')),
  hero: defineAsyncComponent(() => import('~/components/blocks/HeroBlock.vue')),
  contactform: defineAsyncComponent(() => import('~/components/blocks/ContactFormBlock.vue')),
  articleslist: defineAsyncComponent(() => import('~/components/blocks/CmsListBlock.vue')),
  eventslist: defineAsyncComponent(() => import('~/components/blocks/CmsListBlock.vue')),
  cmsarchiveheader: defineAsyncComponent(() => import('~/components/blocks/CmsArchiveHeaderBlock.vue')),
  articletitle: dynamicField,
  articlebody: dynamicField,
  articleimage: dynamicField,
  articleexcerpt: dynamicField,
  articledate: dynamicField,
  articleauthor: dynamicField,
  articlecategory: dynamicField,
  articletag: dynamicField,
  archivetitle: dynamicField,
  archivedescription: dynamicField,
  eventtitle: dynamicField,
  eventbody: dynamicField,
  eventimage: dynamicField,
  eventexcerpt: dynamicField,
  eventdate: dynamicField,
  eventlocation: dynamicField,
}

const component = computed(() => registry[normalizeBlockType(props.node?.type)])
const fallbackChildren = computed(() => getNodeChildren(props.node))
const shouldRenderFallback = computed(() => fallbackChildren.value.length > 0)
</script>

<template>
  <component v-if="component" :is="component" :node="node" />
  <div v-else-if="shouldRenderFallback" class="wt-unknown-block" data-unsupported-block="true">
    <p v-if="isDev" class="wt-unknown-label">
      Unsupported content block
    </p>
    <ElementRenderer
      v-for="(child, index) in fallbackChildren"
      :key="getNodeKey(child, index)"
      :node="child"
    />
  </div>
</template>

<style scoped>
.wt-unknown-block {
  display: contents;
}

.wt-unknown-label {
  margin: 0;
  color: var(--wt-color-muted);
  font-size: 0.875rem;
}
</style>
