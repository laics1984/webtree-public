<script setup lang="ts">
import { computed, inject } from 'vue'
import type { PublicBlockNode, PublicContentItem } from '~/types/public'
import { getNodeClasses, getNodeStyles } from '~/lib/blockRuntime'
import { currentItemKey } from '~/lib/currentItem'
import { formatDate, formatRange } from '~/lib/dateFormat'
import { getNodeDomId } from '~/lib/responsiveRuntime'
import { renderCmsBodyToHtml } from '~/lib/cmsRichText'

defineOptions({ name: 'DynamicFieldBlock' })

const TAILWIND_HEIGHT_PX: Record<string, string> = {
  'h-40': '160px',
  'h-64': '256px',
  'h-96': '384px',
}

const props = defineProps<{ node: PublicBlockNode }>()

const item = inject(currentItemKey, null) as PublicContentItem | null

const fieldType = computed(() => String(props.node?.type ?? '').toLowerCase())
const nodeClasses = computed(() => getNodeClasses(props.node))
const nodeDomId = computed(() => getNodeDomId(props.node) || undefined)

const nodeStyles = computed(() => {
  const styles = getNodeStyles(props.node)
  if (styles.height) return styles

  const classes = getNodeClasses(props.node).split(/\s+/)
  for (const [cls, value] of Object.entries(TAILWIND_HEIGHT_PX)) {
    if (classes.includes(cls)) return { ...styles, height: value }
  }

  return styles
})

const renderedBody = computed(() => renderCmsBodyToHtml(item?.body))
</script>

<template>
  <div
    v-if="!item"
    class="wt-dynamic-empty"
    :class="nodeClasses"
    :style="nodeStyles"
    :data-wt-node-id="nodeDomId"
  >
    <p>No content available.</p>
  </div>

  <h1
    v-else-if="fieldType === 'articletitle' || fieldType === 'eventtitle'"
    class="wt-dynamic-title"
    :class="nodeClasses"
    :style="nodeStyles"
    :data-wt-node-id="nodeDomId"
  >
    {{ item.title }}
  </h1>

  <p
    v-else-if="fieldType === 'articleexcerpt' || fieldType === 'eventexcerpt'"
    class="wt-dynamic-excerpt"
    :class="nodeClasses"
    :style="nodeStyles"
    :data-wt-node-id="nodeDomId"
  >
    {{ item.excerpt || '' }}
  </p>

  <div
    v-else-if="fieldType === 'articlebody' || fieldType === 'eventbody'"
    class="wt-dynamic-body"
    :class="nodeClasses"
    :style="nodeStyles"
    :data-wt-node-id="nodeDomId"
    v-html="renderedBody"
  />

  <img
    v-else-if="(fieldType === 'articleimage' || fieldType === 'eventimage') && item.image"
    :src="item.image"
    :alt="item.title"
    class="wt-dynamic-image"
    :class="nodeClasses"
    :style="nodeStyles"
    :data-wt-node-id="nodeDomId"
    loading="lazy"
  />

  <p
    v-else-if="fieldType === 'articledate'"
    class="wt-dynamic-meta"
    :class="nodeClasses"
    :style="nodeStyles"
    :data-wt-node-id="nodeDomId"
  >
    {{ formatDate(item.publish) }}
  </p>

  <p
    v-else-if="fieldType === 'eventdate'"
    class="wt-dynamic-meta"
    :class="nodeClasses"
    :style="nodeStyles"
    :data-wt-node-id="nodeDomId"
  >
    {{ formatRange(item.start, item.end) || formatDate(item.publish) }}
  </p>

  <p
    v-else-if="fieldType === 'articleauthor' && item.author?.name"
    class="wt-dynamic-meta"
    :class="nodeClasses"
    :style="nodeStyles"
    :data-wt-node-id="nodeDomId"
  >
    {{ item.author.name }}
  </p>

  <p
    v-else-if="fieldType === 'eventlocation' && item.location"
    class="wt-dynamic-meta"
    :class="nodeClasses"
    :style="nodeStyles"
    :data-wt-node-id="nodeDomId"
  >
    {{ item.location }}
  </p>

  <div
    v-else-if="fieldType === 'articlecategory' && item.categories?.length"
    class="wt-dynamic-categories"
    :class="nodeClasses"
    :style="nodeStyles"
    :data-wt-node-id="nodeDomId"
  >
    <span v-for="category in item.categories" :key="category.slug" class="wt-dynamic-category-pill">
      {{ category.title }}
    </span>
  </div>
</template>

<style scoped>
.wt-dynamic-title {
  font-size: 2rem;
  line-height: 1.15;
  font-weight: 700;
  margin: 0;
}

.wt-dynamic-excerpt {
  font-size: 1.0625rem;
  line-height: 1.6;
  opacity: 0.85;
  margin: 0;
  max-width: 70ch;
}

.wt-dynamic-body {
  font-size: 1rem;
  line-height: 1.7;
  max-width: 72ch;
}

.wt-dynamic-body :deep(p) {
  margin: 0;
  padding: 0;
}

.wt-dynamic-body :deep(.wt-rich-empty-paragraph) {
  height: 1.15em;
  overflow: hidden;
  line-height: 1;
}

.wt-dynamic-body :deep(figure) {
  margin: 0;
}

.wt-dynamic-body :deep(figcaption) {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  opacity: 0.7;
}

.wt-dynamic-body :deep(img) {
  max-width: 100%;
  height: auto;
}

.wt-dynamic-body :deep(.wt-rich-image--align-left) {
  text-align: left;
}

.wt-dynamic-body :deep(.wt-rich-image--align-center) {
  text-align: center;
}

.wt-dynamic-body :deep(.wt-rich-image--align-right) {
  text-align: right;
}

.wt-dynamic-body :deep(.wt-rich-image--full-width img) {
  width: 100%;
}

.wt-dynamic-image {
  display: block;
  width: 100%;
  height: auto;
  object-fit: cover;
}

.wt-dynamic-meta {
  font-size: 0.875rem;
  opacity: 0.7;
  margin: 0;
}

.wt-dynamic-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.wt-dynamic-category-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.65rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--wt-color-primary, #2563eb) 24%, transparent);
  background: color-mix(in srgb, var(--wt-color-primary, #2563eb) 8%, transparent);
  color: var(--wt-color-primary, #2563eb);
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.wt-dynamic-empty {
  padding: 1rem;
  border: 1px dashed currentColor;
  opacity: 0.6;
  border-radius: 12px;
}
</style>
