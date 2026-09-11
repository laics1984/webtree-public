<script setup lang="ts">
import { computed, inject } from 'vue'
import type { PublicBlockNode, PublicContentItem } from '~/types/public'
import { getNodeClasses, getNodeStyles } from '~/lib/blockRuntime'
import { currentItemKey } from '~/lib/currentItem'
import { currentListingKey } from '~/lib/currentListing'
import { contentPrefixesKey } from '~/lib/contentPrefixes'
import { contentMeta, type ContentMetaKind } from '~/lib/contentMeta'
import { getNodeDomId } from '~/lib/responsiveRuntime'
import { useHydratedNow } from '~/composables/useHydratedNow'
import ContentMetaIcon from '~/components/public/ContentMetaIcon.vue'
import { renderCmsBodyToHtml } from '~/lib/cmsRichText'
import { hasOwnTextColor } from '~/lib/styles'

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

// An article category's pills take the field's own ink once it has one; until
// then they keep the brand colour (see hasOwnTextColor).
const categoryHasOwnInk = computed(() => hasOwnTextColor(nodeStyles.value))

/** The single-fact fields — date, author, location — and the fact each shows. */
const META_FIELD_KIND: Record<string, ContentMetaKind> = {
  articledate: 'articleDate',
  eventdate: 'eventDate',
  articleauthor: 'author',
  eventlocation: 'location',
}

// The reader's clock, known only after hydration — see useHydratedNow.
const now = useHydratedNow()

const meta = computed(() => {
  const kind = META_FIELD_KIND[fieldType.value]
  return kind && item ? contentMeta(kind, item, now.value) : null
})

/**
 * Show the full-size photo when its thumbnail is missing.
 *
 * Every gallery photo is published at both sizes, but the API cannot know
 * whether the resized copy was actually written — a per-photo existence check
 * would be a request per photo per render — and for a stretch the CMS wrote no
 * thumbnails at all, so the stored ones 404. Without this the visitor's whole
 * experience of a gallery is a grid of broken images.
 *
 * `data-wt-full` is deliberately left alone: the lightbox opens that, and
 * readGroupImages() arms a tile on its class and `src`, not on the two
 * differing — so a tile that has fallen back still enlarges correctly.
 */
function showOriginalOnError(event: Event, originalSrc: string) {
  const tile = event.target as HTMLImageElement | null

  // Once per tile. If the original is missing too, swapping again would spin.
  if (!tile || !originalSrc || tile.dataset.wtThumbnailFallback === 'done') return

  tile.dataset.wtThumbnailFallback = 'done'
  tile.src = originalSrc
}
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
    A thumbnail that was never written falls back to that original rather than
    rendering as a broken image — see showOriginalOnError().

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
      @error="showOriginalOnError($event, photo.src)"
    />
  </div>

  <!--
    Date, author and location: an icon and a label, as the builder draws them.
    The row is inline inside the node so the author's text-align places it the
    way the canvas does. Nothing renders when the item lacks the fact.
  -->
  <p
    v-else-if="meta"
    class="wt-dynamic-meta"
    :class="nodeClasses"
    :style="nodeStyles"
    :data-wt-node-id="nodeDomId"
  >
    <span class="wt-dynamic-meta__line">
      <ContentMetaIcon :name="meta.icon" />
      {{ meta.label }}
    </span>
  </p>

  <!--
    Category pills, typed by the field itself: the node carries its styles and
    the pills inherit them — its ink too, once it has one of its own. The row
    sits inline, so the field's text-align places it, as on the canvas.
  -->
  <div
    v-else-if="fieldType === 'articlecategory' && item.categories?.length"
    class="wt-dynamic-categories"
    :class="[nodeClasses, { 'wt-dynamic-categories--own-ink': categoryHasOwnInk }]"
    :style="nodeStyles"
    :data-wt-node-id="nodeDomId"
  >
    <span class="wt-dynamic-categories__row">
      <NuxtLink
        v-for="category in item.categories"
        :key="category.slug"
        :to="`/${articlePrefix}/category/${category.slug}`"
        class="wt-dynamic-category-pill"
      >
        {{ category.title }}
      </NuxtLink>
    </span>
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

/*
  Mirrored by `.cms-dynamic-gallery` in the builder's src/index.css, which is
  how the canvas shows what visitors see — change both together.

  Up to four photos per row. A row holding fewer grows its photos to the full
  width (auto-fill used to leave the unused columns empty). Every row keeps one
  height — the side of a square tile in a full row of four — so a lone photo
  becomes a full-width strip, not a giant square. Below four 160px tiles (a
  narrow column, a phone), rows hold fewer photos.

  Sized in container units off the gallery's own width, not the viewport, so
  the same block lays out correctly in an article column or a full-bleed
  section without an author choosing a breakpoint.
*/
.wt-dynamic-gallery {
  container-type: inline-size;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.wt-dynamic-gallery__tile {
  --wt-gallery-tile: max(min(160px, 100cqw), calc((100cqw - 1.5rem) / 4));
  /* 1px under the exact quarter so rounding can never push a fourth photo to
     the next row; flex-grow restores the full width. */
  flex: 1 1 calc(var(--wt-gallery-tile) - 1px);
  height: var(--wt-gallery-tile);
  min-width: 0;
  object-fit: cover;
  border-radius: 8px;
  display: block;
}

/*
  Mirrors the builder canvas (dynamic-fields.tsx), which puts the node's styles
  on a wrapper and draws the row inside it in Tailwind's text-sm and opacity-75,
  a 16px icon 0.5rem from its label. The same split here: the <p> takes the
  node's styles (its text-align places the inline row), the row takes the look
  — so a node's inline `opacity: 100%` cannot undo the 75%, as on the canvas.
*/
.wt-dynamic-meta {
  margin: 0;
}

.wt-dynamic-meta__line {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  opacity: 0.75;
  overflow-wrap: anywhere;
}

.wt-dynamic-meta__line svg {
  width: 1rem;
  height: 1rem;
}

/*
  Article category, typed by the field itself. These are only defaults: the
  node's own styles (the builder's Typography section) override them on this
  box and the pills inherit the result, their border and wash following their
  ink. The ink stays the brand colour until the field has one of its own
  (`--own-ink`). The row sits inline, so the field's text-align places it.
  Mirrored by `.cms-dynamic-categories` in the builder's src/index.css —
  change both together.
*/
.wt-dynamic-categories {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.wt-dynamic-categories__row {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  max-width: 100%;
  vertical-align: top;
}

.wt-dynamic-category-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.65rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, currentColor 24%, transparent);
  background: color-mix(in srgb, currentColor 8%, transparent);
  color: var(--wt-color-primary, #2563eb);
  text-decoration: none;
}

.wt-dynamic-categories--own-ink .wt-dynamic-category-pill {
  color: inherit;
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
