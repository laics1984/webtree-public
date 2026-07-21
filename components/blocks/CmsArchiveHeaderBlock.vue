<script setup lang="ts">
import { computed, inject } from 'vue'
import type { PublicBlockNode } from '~/types/public'
import { getArrayField, getBooleanField, getNodeContentRecord, getNodeStyles, getStringField } from '~/lib/blockRuntime'
import { currentListingKey } from '~/lib/currentListing'

defineOptions({ name: 'CmsArchiveHeaderBlock' })

const props = defineProps<{ node: PublicBlockNode }>()

const currentListing = inject(currentListingKey, null)

type CoverEntry = {
  taxonomyType: 'category' | 'tag'
  taxonomySlug: string
  imageUrl: string
}

const content = computed(() => getNodeContentRecord(props.node))

const defaultImage = computed(() => getStringField(content.value, 'defaultImage') ?? '')
const showTitle = computed(() => getBooleanField(content.value as any, 'showTitle') !== false)
const showDescription = computed(() => getBooleanField(content.value as any, 'showDescription') !== false)
const covers = computed(() => getArrayField<CoverEntry>(content.value as any, 'covers'))

const resolvedImage = computed(() => {
  const taxonomy = currentListing?.taxonomy
  if (taxonomy) {
    const match = covers.value.find(
      (c) => c.taxonomyType === taxonomy.type && c.taxonomySlug === taxonomy.slug
    )
    if (match?.imageUrl) return match.imageUrl
  }
  return defaultImage.value || null
})

// Read the height stored by the builder. After the builder fix, this is always a concrete
// pixel value (e.g. "384px"). Older pages may have a percentage stored which won't resolve
// against the auto-height parent — guard against that by only accepting px values.
// Fall back to 400px when unset or when the stored value is not a concrete pixel string.
const imageWrapStyle = computed(() => {
  const styles = getNodeStyles(props.node)
  const h = styles.height
  if (typeof h === 'string' && h.trim().endsWith('px')) return { height: h.trim() }
  if (typeof h === 'number' && Number.isFinite(h)) return { height: `${Math.round(h)}px` }
  return { height: '400px' }
})

// objectFit / objectPosition must be applied to the <img> element, not the wrapper div.
const imgStyle = computed(() => {
  const styles = getNodeStyles(props.node) as Record<string, unknown>
  return {
    objectFit: (styles.objectFit as string) || 'cover',
    objectPosition: (styles.objectPosition as string) || 'center',
  }
})
</script>

<template>
  <section class="wt-archive-header">
    <div v-if="resolvedImage" class="wt-archive-header__image-wrap" :style="imageWrapStyle">
      <img
        :src="resolvedImage"
        :alt="currentListing?.taxonomy?.title ?? 'Archive cover'"
        class="wt-archive-header__image"
        :style="imgStyle"
        loading="eager"
      />
    </div>

    <div
      v-if="(showTitle && currentListing?.taxonomy?.title) || (showDescription && currentListing?.taxonomy?.description)"
      class="wt-archive-header__text"
    >
      <h1 v-if="showTitle && currentListing?.taxonomy?.title" class="wt-archive-header__title">
        {{ currentListing.taxonomy.title }}
      </h1>
      <p v-if="showDescription && currentListing?.taxonomy?.description" class="wt-archive-header__description">
        {{ currentListing.taxonomy.description }}
      </p>
    </div>
  </section>
</template>

<style scoped>
.wt-archive-header {
  width: 100%;
}

.wt-archive-header__image-wrap {
  width: 100%;
  overflow: hidden;
  /* Height is controlled by the builder via element.styles.height (see imageWrapStyle). */
}

.wt-archive-header__image {
  width: 100%;
  height: 100%;
  display: block;
  /* object-fit / object-position driven by :style binding */
}

.wt-archive-header__text {
  padding: 1.25rem 0 0.5rem;
}

.wt-archive-header__title {
  margin: 0 0 0.5rem;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.2;
  color: var(--wt-color-heading, inherit);
  font-family: var(--wt-font-heading, inherit);
}

.wt-archive-header__description {
  margin: 0;
  font-size: 1rem;
  color: var(--wt-color-muted, inherit);
  line-height: 1.6;
}
</style>
