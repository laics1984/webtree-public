<script setup lang="ts">
import { computed, inject } from 'vue'
import type { PublicBlockNode, PublicContentItem } from '~/types/public'
import { getNodeClasses, getNodeStyles } from '~/lib/blockRuntime'
import { currentItemKey } from '~/lib/currentItem'
import { currentListingKey } from '~/lib/currentListing'
import { contentPrefixesKey } from '~/lib/contentPrefixes'
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
const currentListing = inject(currentListingKey, null)
const contentPrefixes = inject(contentPrefixesKey, null)
const articlePrefix = computed(() => contentPrefixes?.article || 'articles')

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

const galleryPhotos = computed(() => item?.gallery ?? [])
</script>

<template>
  <h1
    v-if="fieldType === 'archivetitle' && currentListing?.taxonomy?.title"
    class="wt-dynamic-title"
    :class="nodeClasses"
    :style="nodeStyles"
    :data-wt-node-id="nodeDomId"
  >
    {{ currentListing.taxonomy.title }}
  </h1>

  <p
    v-else-if="fieldType === 'archivedescription' && currentListing?.taxonomy?.description"
    class="wt-dynamic-excerpt"
    :class="nodeClasses"
    :style="nodeStyles"
    :data-wt-node-id="nodeDomId"
  >
    {{ currentListing.taxonomy.description }}
  </p>

  <div
    v-else-if="!item"
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

  <!--
    Gallery grid. The lightbox runtime (~/lib/lightbox) arms this node by its
    `data-wt-node-id` and reads the tiles by their `wt-image` class, so both are
    part of the contract rather than styling. Tiles show the stored thumbnail
    and name their original in `data-wt-full`, which is what the viewer opens.

    A caption doubles as the alt text: an author's own words describe the photo
    better than a generated "photo 3 of 9" ever could. The viewer marks its
    caption bar aria-hidden when the two match, so nothing is announced twice.
  -->
  <div
    v-else-if="(fieldType === 'articlegallery' || fieldType === 'eventgallery') && galleryPhotos.length"
    class="wt-dynamic-gallery"
    :class="nodeClasses"
    :style="nodeStyles"
    :data-wt-node-id="nodeDomId"
  >
    <img
      v-for="(photo, position) in galleryPhotos"
      :key="photo.src"
      class="wt-image wt-dynamic-gallery__tile"
      :src="photo.thumbnail"
      :data-wt-full="photo.src"
      :data-wt-caption="photo.caption || undefined"
      :alt="photo.caption || `${item.title} — photo ${position + 1} of ${galleryPhotos.length}`"
      loading="lazy"
      decoding="async"
    />
  </div>

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
    <NuxtLink
      v-for="category in item.categories"
      :key="category.slug"
      :to="`/${articlePrefix}/category/${category.slug}`"
      class="wt-dynamic-category-pill"
    >
      {{ category.title }}
    </NuxtLink>
  </div>

  <div
    v-else-if="fieldType === 'articletag' && item.tags?.length"
    class="wt-dynamic-tags"
    :class="nodeClasses"
    :style="nodeStyles"
    :data-wt-node-id="nodeDomId"
  >
    <NuxtLink
      v-for="tag in item.tags"
      :key="tag.slug"
      :to="`/${articlePrefix}/tag/${tag.slug}`"
      class="wt-dynamic-tag-pill"
    >
      {{ tag.title || tag.name }}
    </NuxtLink>
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

/*
 * Article prose.
 *
 * Tailwind's preflight resets headings to body size and weight, strips list
 * markers and indentation, and zeroes every margin. Until these rules existed
 * this block styled only paragraphs and images, so a Heading 1 published as
 * ordinary text and a bulleted list published as unmarked lines — the document
 * carried the structure and the page threw it away.
 *
 * Paragraphs keep `margin: 0` deliberately: authors space this content with
 * blank paragraphs (`.wt-rich-empty-paragraph` above), and giving <p> a margin
 * would reflow every article already published.
 */
.wt-dynamic-body :deep(h1),
.wt-dynamic-body :deep(h2),
.wt-dynamic-body :deep(h3) {
  font-family: var(--builder-font-heading, var(--wt-font-heading, inherit));
  font-weight: 700;
  line-height: 1.25;
  margin: 1.75rem 0 0.5rem;
}

.wt-dynamic-body :deep(h1:first-child),
.wt-dynamic-body :deep(h2:first-child),
.wt-dynamic-body :deep(h3:first-child) {
  margin-top: 0;
}

.wt-dynamic-body :deep(h1) {
  font-size: 1.75rem;
}

.wt-dynamic-body :deep(h2) {
  font-size: 1.4rem;
}

.wt-dynamic-body :deep(h3) {
  font-size: 1.15rem;
}

.wt-dynamic-body :deep(ul),
.wt-dynamic-body :deep(ol) {
  margin: 0.75rem 0;
  padding-left: 1.5rem;
}

.wt-dynamic-body :deep(ul) {
  list-style: disc;
}

.wt-dynamic-body :deep(ol) {
  list-style: decimal;
}

.wt-dynamic-body :deep(li) {
  margin: 0.25rem 0;
}

.wt-dynamic-body :deep(blockquote) {
  margin: 1rem 0;
  padding-left: 1rem;
  border-left: 2px solid rgba(148, 163, 184, 0.4);
  font-style: italic;
  color: var(--wt-color-muted, #6b7280);
}

/* 700, not preflight's `bolder`, so bold stays visible inside a heading. */
.wt-dynamic-body :deep(strong) {
  font-weight: 700;
}

.wt-dynamic-body :deep(code) {
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  background: rgba(148, 163, 184, 0.16);
  font-size: 0.9em;
}

/* Block alignment, written by the editor onto paragraphs, headings and list
   items. Only images honoured it before. */
.wt-dynamic-body :deep(.wt-rich-align-left) {
  text-align: left;
}

.wt-dynamic-body :deep(.wt-rich-align-center) {
  text-align: center;
}

.wt-dynamic-body :deep(.wt-rich-align-right) {
  text-align: right;
}

.wt-dynamic-body :deep(.wt-rich-align-justify) {
  text-align: justify;
}

/* A table scrolls inside its own column rather than widening the page: the
   article is capped at 72ch and a pasted spreadsheet is routinely wider. */
.wt-dynamic-body :deep(.wt-rich-table-wrap) {
  margin: 1rem 0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.wt-dynamic-body :deep(.wt-rich-table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9375rem;
  line-height: 1.5;
}

.wt-dynamic-body :deep(.wt-rich-table th),
.wt-dynamic-body :deep(.wt-rich-table td) {
  padding: 0.5rem 0.75rem;
  border: 1px solid rgba(148, 163, 184, 0.32);
  text-align: left;
  vertical-align: top;
}

.wt-dynamic-body :deep(.wt-rich-table th) {
  background: rgba(148, 163, 184, 0.12);
  font-weight: 700;
}

.wt-dynamic-image {
  display: block;
  width: 100%;
  height: auto;
  object-fit: cover;
}

.wt-dynamic-gallery {
  display: grid;
  /* Auto-fill rather than a fixed column count: the same block reads well in a
     narrow article column and in a full-bleed section without an author
     choosing a breakpoint. */
  grid-template-columns: repeat(auto-fill, minmax(min(160px, 100%), 1fr));
  gap: 0.5rem;
}

.wt-dynamic-gallery__tile {
  width: 100%;
  height: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border-radius: 8px;
  display: block;
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
  text-decoration: none;
}

.wt-dynamic-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.wt-dynamic-tag-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.65rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, currentColor 20%, transparent);
  background: color-mix(in srgb, currentColor 6%, transparent);
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  text-decoration: none;
  opacity: 0.75;
}

.wt-dynamic-empty {
  padding: 1rem;
  border: 1px dashed currentColor;
  opacity: 0.6;
  border-radius: 12px;
}
</style>
