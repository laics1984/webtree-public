<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import type { PublicBlockNode } from '~/types/public'
import { getNodeChildren, getNodeKey, normalizeBlockType } from '~/lib/schema'

defineOptions({ name: 'ElementRenderer' })

const props = defineProps<{ node: PublicBlockNode }>()
const isDev = import.meta.dev

// Cloudflare Workers' `import()` does not resolve to a real ES module namespace:
// `Symbol.toStringTag` is undefined and there is no `__esModule` flag. Vue's
// `defineAsyncComponent` only unwraps `.default` when it sees one of those, so
// on workerd it passes `{ default: Component }` straight to `createVNode` — an
// object with no render/setup, which SSRs to an empty `<!---->` silently, with
// no rejection and no error. Every block on the page then disappears from the
// server-rendered HTML and only reappears after hydration. Unwrap explicitly,
// exactly as Nuxt does for its own layout loaders. Node SSR is unaffected
// either way, so this cannot be caught by `nuxt dev` or a node-preset preview.
const asyncBlock = (loader: () => Promise<any>) =>
  defineAsyncComponent(() => loader().then((m) => m.default || m))

const dynamicField = asyncBlock(
  () => import('~/components/blocks/DynamicFieldBlock.vue')
)

const registry: Record<string, any> = {
  header: asyncBlock(() => import('~/components/blocks/ContainerBlock.vue')),
  body: asyncBlock(() => import('~/components/blocks/ContainerBlock.vue')),
  footer: asyncBlock(() => import('~/components/blocks/ContainerBlock.vue')),
  container: asyncBlock(() => import('~/components/blocks/ContainerBlock.vue')),
  '2col': asyncBlock(() => import('~/components/blocks/ContainerBlock.vue')),
  '3col': asyncBlock(() => import('~/components/blocks/ContainerBlock.vue')),
  text: asyncBlock(() => import('~/components/blocks/TextBlock.vue')),
  section: asyncBlock(() => import('~/components/blocks/SectionBlock.vue')),
  image: asyncBlock(() => import('~/components/blocks/ImageBlock.vue')),
  video: asyncBlock(() => import('~/components/blocks/VideoBlock.vue')),
  link: asyncBlock(() => import('~/components/blocks/LinkBlock.vue')),
  menu: asyncBlock(() => import('~/components/blocks/MenuBlock.vue')),
  hero: asyncBlock(() => import('~/components/blocks/HeroBlock.vue')),
  contactform: asyncBlock(() => import('~/components/blocks/ContactFormBlock.vue')),
  articleslist: asyncBlock(() => import('~/components/blocks/CmsListBlock.vue')),
  eventslist: asyncBlock(() => import('~/components/blocks/CmsListBlock.vue')),
  cmsarchiveheader: asyncBlock(() => import('~/components/blocks/CmsArchiveHeaderBlock.vue')),
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
