<script setup lang="ts">
import { computed, inject, resolveComponent } from 'vue'
import type {
  CmsContentSource,
  CmsListContent,
  CmsListFilter,
  CmsListHeadingMode,
  CmsListPagination,
  PublicBlockNode,
  PublicContentItem,
  PublicContentItemType,
  PublicContentListResponse,
} from '~/types/public'
import { fetchPublicContentList } from '~/lib/api'
import { getNodeClasses, getNodeContent, getNodeStyles } from '~/lib/blockRuntime'
import { resolveContentItemHref } from '~/lib/contentLink'
import { contentPrefixesKey } from '~/lib/contentPrefixes'
import { getNodeDomId } from '~/lib/responsiveRuntime'
import { getRequestHost } from '~/lib/host'
import { formatDate, formatRange } from '~/lib/dateFormat'
import { currentListingKey } from '~/lib/currentListing'

defineOptions({ name: 'CmsListBlock' })

const props = defineProps<{ node: PublicBlockNode }>()

const DEFAULT_HEADING: Record<CmsContentSource, string> = {
  articles: 'Latest Articles',
  events: 'Upcoming Events',
}

const VALID_HEADING_MODES: CmsListHeadingMode[] = ['static', 'archive-title', 'hide-on-archive']

function createDefaultCmsListContent(source: CmsContentSource): CmsListContent {
  return {
    source,
    heading: DEFAULT_HEADING[source],
    headingMode: 'static',
    showHeading: true,
    description: '',
    showDescription: false,
    layout: 'grid',
    itemCount: 6,
    pagination: {
      enabled: true,
      style: 'numbered',
      showSummary: true,
    },
    filter: {
      mode: 'all',
      taxonomyType: null,
      taxonomySlug: null,
    },
    categorySlug: null,
    selectionMode: 'auto',
    manualIds: [],
    showImage: true,
    showExcerpt: true,
    showMeta: true,
    showAuthor: false,
    showCategory: false,
  }
}

function isCmsListContent(value: unknown): value is CmsListContent {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const v = value as Partial<CmsListContent>
  return (
    (v.source === 'articles' || v.source === 'events') &&
    typeof v.layout === 'string' &&
    typeof v.itemCount === 'number'
  )
}

function isCmsListFilter(value: unknown): value is CmsListFilter {
  if (!value || typeof value !== 'object') return false
  const v = value as Partial<CmsListFilter>
  return (
    (v.mode === 'all' ||
      v.mode === 'currentListing' ||
      v.mode === 'specificTaxonomy') &&
    (v.taxonomyType === 'category' || v.taxonomyType === 'tag' || v.taxonomyType === null) &&
    (typeof v.taxonomySlug === 'string' || v.taxonomySlug === null)
  )
}

function normalizeCmsListPagination(value: unknown): CmsListPagination {
  const defaults = createDefaultCmsListContent('articles').pagination!
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return defaults
  }

  const raw = value as Partial<CmsListPagination>
  return {
    enabled: typeof raw.enabled === 'boolean' ? raw.enabled : defaults.enabled,
    style: raw.style === 'numbered' ? raw.style : defaults.style,
    showSummary:
      typeof raw.showSummary === 'boolean'
        ? raw.showSummary
        : defaults.showSummary,
  }
}

function normalizeCmsListContent(raw: CmsListContent): CmsListContent {
  const next = { ...createDefaultCmsListContent(raw.source), ...raw }

  if (!next.headingMode || !VALID_HEADING_MODES.includes(next.headingMode)) {
    next.headingMode = 'static'
  }
  next.pagination = normalizeCmsListPagination(raw.pagination)

  if (isCmsListFilter(raw.filter)) {
    next.filter = raw.filter
  } else if (typeof raw.categorySlug === 'string' && raw.categorySlug.trim()) {
    next.filter = {
      mode: 'specificTaxonomy',
      taxonomyType: 'category',
      taxonomySlug: raw.categorySlug.trim(),
    }
  } else {
    next.filter = createDefaultCmsListContent(raw.source).filter
  }

  return next
}

const fallbackSource = computed<CmsContentSource>(() =>
  String(props.node?.type ?? '').toLowerCase() === 'eventslist' ? 'events' : 'articles'
)

const content = computed<CmsListContent>(() => {
  const raw = getNodeContent(props.node)
  if (isCmsListContent(raw)) {
    return normalizeCmsListContent(raw)
  }
  return createDefaultCmsListContent(fallbackSource.value)
})

const source = computed<CmsContentSource>(() => content.value.source)
const apiType = computed<PublicContentItemType>(() =>
  source.value === 'events' ? 'event' : 'article'
)
const route = useRoute()
const pagination = computed<CmsListPagination>(() =>
  content.value.pagination ?? createDefaultCmsListContent(source.value).pagination!
)
const paginationEnabled = computed(
  () => content.value.selectionMode !== 'manual' && pagination.value.enabled
)

function parsePage(value: unknown): number {
  const raw = Array.isArray(value) ? value[0] : value
  const parsed = Number.parseInt(String(raw ?? ''), 10)
  return Number.isFinite(parsed) && parsed > 1 ? parsed : 1
}

const currentPage = computed(() =>
  paginationEnabled.value ? parsePage(route.query.page) : 1
)

const fetchCount = computed(() =>
  content.value.selectionMode === 'manual'
    ? Math.max(content.value.itemCount, content.value.manualIds.length, 12)
    : content.value.itemCount
)

const host = getRequestHost()
const currentListing = inject(currentListingKey, null)
const contentPrefixes = inject(contentPrefixesKey, null)

const resolvedTaxonomy = computed(() => {
  if (apiType.value !== 'article') return null

  const filter = content.value.filter ?? createDefaultCmsListContent(source.value).filter
  if (filter.mode === 'currentListing') {
    return currentListing?.taxonomy
      ? {
          taxonomyType: currentListing.taxonomy.type,
          taxonomySlug: currentListing.taxonomy.slug,
        }
      : null
  }

  if (
    filter.mode === 'specificTaxonomy' &&
    filter.taxonomyType &&
    filter.taxonomySlug
  ) {
    return {
      taxonomyType: filter.taxonomyType,
      taxonomySlug: filter.taxonomySlug,
    }
  }

  return null
})

const cacheKey = `cms-list:${host}:${apiType.value}:${fetchCount.value}:${currentPage.value}:${content.value.filter?.mode ?? 'all'}:${resolvedTaxonomy.value?.taxonomyType ?? ''}:${resolvedTaxonomy.value?.taxonomySlug ?? ''}`

const { data, pending, error } = await useAsyncData<PublicContentListResponse | null>(
  cacheKey,
  () =>
    fetchPublicContentList(host, apiType.value, {
      count: fetchCount.value,
      current: currentPage.value,
      taxonomyType: resolvedTaxonomy.value?.taxonomyType ?? null,
      taxonomySlug: resolvedTaxonomy.value?.taxonomySlug ?? null,
    }),
  {
    default: () => null,
    watch: [currentPage, fetchCount, resolvedTaxonomy],
  }
)

const items = computed<PublicContentItem[]>(() =>
  Array.isArray(data.value?.items) ? (data.value!.items as PublicContentItem[]) : []
)

const visibleItems = computed<PublicContentItem[]>(() => {
  if (content.value.selectionMode === 'manual') {
    const ids = content.value.manualIds
    const idSet = new Set(ids)
    const order = new Map<string, number>(ids.map((id, idx) => [id, idx]))
    const matched = items.value.filter((item) => idSet.has(String(item.id)))
    matched.sort(
      (a, b) =>
        (order.get(String(a.id)) ?? 0) - (order.get(String(b.id)) ?? 0)
    )
    return matched.slice(0, content.value.itemCount)
  }
  return items.value.slice(0, content.value.itemCount)
})

const totalItems = computed(() => Number(data.value?.total ?? visibleItems.value.length))
const resolvedCurrentPage = computed(() => Number(data.value?.currentPage ?? currentPage.value))
const lastPage = computed(() => Number(data.value?.lastPage ?? 1))
const showPagination = computed(
  () =>
    paginationEnabled.value &&
    lastPage.value > 1 &&
    totalItems.value > content.value.itemCount &&
    visibleItems.value.length > 0 &&
    !pending.value &&
    !error.value
)

type PaginationToken = number | 'gap'

const paginationTokens = computed<PaginationToken[]>(() => {
  const totalPages = Math.max(1, lastPage.value)
  const activePage = Math.max(1, Math.min(resolvedCurrentPage.value, totalPages))
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const pages = new Set<number>([1, totalPages, activePage])
  if (activePage > 2) pages.add(activePage - 1)
  if (activePage < totalPages - 1) pages.add(activePage + 1)

  const sorted = [...pages].sort((a, b) => a - b)
  const tokens: PaginationToken[] = []
  sorted.forEach((page, index) => {
    const previous = sorted[index - 1]
    if (previous && page - previous > 1) {
      tokens.push('gap')
    }
    tokens.push(page)
  })
  return tokens
})

function paginationHref(page: number): string {
  const query = new URLSearchParams()
  Object.entries(route.query).forEach(([key, value]) => {
    if (key === 'page') return
    const values = Array.isArray(value) ? value : [value]
    values.forEach((entry) => {
      if (entry != null) query.append(key, String(entry))
    })
  })
  if (page > 1) {
    query.set('page', String(page))
  }
  const qs = query.toString()
  return qs ? `${route.path}?${qs}` : route.path
}

const layout = computed(() => content.value.layout)

const desktopGridClass = computed(() =>
  visibleItems.value.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
)

const nuxtLink = resolveComponent('NuxtLink')

function itemHref(item: PublicContentItem): string | null {
  return resolveContentItemHref(item, contentPrefixes)
}

function itemComponent(item: PublicContentItem) {
  return itemHref(item) ? nuxtLink : 'article'
}

const errorMessage = computed(() => {
  const value = error.value as { message?: string } | null
  return value?.message || ''
})

const isOnTaxonomyArchive = computed(
  () => currentListing?.taxonomy != null
)

const resolvedHeading = computed<string | null>(() => {
  if (!content.value.showHeading) return null
  const mode = content.value.headingMode ?? 'static'
  if (mode === 'hide-on-archive' && isOnTaxonomyArchive.value) return null
  if (mode === 'archive-title') {
    const taxonomyTitle = currentListing?.taxonomy?.title
    if (!taxonomyTitle) return content.value.heading.trim() || null
    const prefix = (content.value.archiveTitlePrefix ?? '').trim()
    const suffix = (content.value.archiveTitleSuffix ?? '').trim()
    return [prefix, taxonomyTitle, suffix].filter(Boolean).join(' ')
  }
  return content.value.heading.trim() || null
})

const showHeader = computed(
  () =>
    resolvedHeading.value !== null ||
    (content.value.showDescription && content.value.description.trim())
)

const sectionClasses = computed(() => getNodeClasses(props.node))
const sectionStyles = computed(() => getNodeStyles(props.node))
const sectionDomId = computed(() => getNodeDomId(props.node) || undefined)

const featured = computed(() => visibleItems.value[0])
const featuredRest = computed(() => visibleItems.value.slice(1))
</script>

<template>
  <section
    class="wt-cms-list"
    :class="sectionClasses"
    :style="sectionStyles"
    :data-wt-node-id="sectionDomId"
    :data-cms-source="source"
  >
    <header v-if="showHeader" class="wt-cms-list__header">
      <h2
        v-if="resolvedHeading"
        class="wt-cms-list__heading"
      >
        {{ resolvedHeading }}
      </h2>
      <p
        v-if="content.showDescription && content.description.trim()"
        class="wt-cms-list__description"
      >
        {{ content.description }}
      </p>
    </header>

    <div
      v-if="pending && visibleItems.length === 0"
      class="wt-cms-list__placeholder"
    >
      Loading {{ source }}…
    </div>
    <div v-else-if="error" class="wt-cms-list__placeholder">
      Couldn't load {{ source }}{{ errorMessage ? `: ${errorMessage}` : '' }}
    </div>
    <div
      v-else-if="visibleItems.length === 0"
      class="wt-cms-list__placeholder"
    >
      No {{ source }} found.
    </div>

    <div
      v-else-if="layout === 'list'"
      class="wt-cms-list__list"
    >
      <component
        :is="itemComponent(item)"
        v-for="item in visibleItems"
        :key="item.id"
        :to="itemHref(item) || undefined"
        class="wt-cms-card wt-cms-card--horizontal"
      >
        <div v-if="content.showImage" class="wt-cms-card__media">
          <img
            v-if="item.image"
            :src="item.image"
            :alt="item.title"
            loading="lazy"
            class="wt-cms-card__image"
          />
          <div v-else class="wt-cms-card__image-fallback" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              <path d="m2 2 20 20" />
              <path d="M3.59 3.59A1.99 1.99 0 0 0 3 5v14a2 2 0 0 0 2 2h14c.55 0 1.05-.22 1.41-.59" />
              <path d="M21 15V5a2 2 0 0 0-2-2H9" />
            </svg>
          </div>
        </div>
        <div class="wt-cms-card__body">
          <h3 class="wt-cms-card__title">{{ item.title }}</h3>
          <p
            v-if="content.showExcerpt && item.excerpt"
            class="wt-cms-card__excerpt"
          >
            {{ item.excerpt }}
          </p>
          <div
            v-if="source === 'articles' && content.showCategory && item.categories?.length"
            class="wt-cms-card__categories"
          >
            <span
              v-for="category in item.categories"
              :key="category.slug"
              class="wt-cms-card__category"
            >
              {{ category.title }}
            </span>
          </div>
          <div
            v-if="content.showMeta"
            class="wt-cms-card__meta"
          >
            <template v-if="source === 'articles'">
              <span v-if="formatDate(item.publish)" class="wt-cms-card__meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                {{ formatDate(item.publish) }}
              </span>
              <span
                v-if="content.showAuthor && item.author?.name"
                class="wt-cms-card__meta-item"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
                {{ item.author.name }}
              </span>
            </template>
            <template v-else>
              <span
                v-if="formatRange(item.start, item.end) || formatDate(item.publish)"
                class="wt-cms-card__meta-item"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                {{ formatRange(item.start, item.end) || formatDate(item.publish) }}
              </span>
              <span v-if="item.location" class="wt-cms-card__meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s-7-7-7-12a7 7 0 0 1 14 0c0 5-7 12-7 12z" /><circle cx="12" cy="10" r="3" /></svg>
                {{ item.location }}
              </span>
            </template>
          </div>
        </div>
      </component>
    </div>

    <div
      v-else-if="layout === 'featured'"
      class="wt-cms-list__featured"
    >
      <component
        v-if="featured"
        :is="itemComponent(featured)"
        :to="itemHref(featured) || undefined"
        class="wt-cms-card wt-cms-card--featured"
      >
        <div v-if="content.showImage" class="wt-cms-card__media wt-cms-card__media--featured">
          <img
            v-if="featured.image"
            :src="featured.image"
            :alt="featured.title"
            loading="lazy"
            class="wt-cms-card__image"
          />
          <div v-else class="wt-cms-card__image-fallback" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /><path d="m2 2 20 20" /><path d="M3.59 3.59A1.99 1.99 0 0 0 3 5v14a2 2 0 0 0 2 2h14c.55 0 1.05-.22 1.41-.59" /><path d="M21 15V5a2 2 0 0 0-2-2H9" /></svg>
          </div>
        </div>
        <div class="wt-cms-card__body wt-cms-card__body--featured">
          <h3 class="wt-cms-card__title wt-cms-card__title--featured">
            {{ featured.title }}
          </h3>
          <p
            v-if="content.showExcerpt && featured.excerpt"
            class="wt-cms-card__excerpt"
          >
            {{ featured.excerpt }}
          </p>
          <div
            v-if="source === 'articles' && content.showCategory && featured.categories?.length"
            class="wt-cms-card__categories"
          >
            <span
              v-for="category in featured.categories"
              :key="category.slug"
              class="wt-cms-card__category"
            >
              {{ category.title }}
            </span>
          </div>
          <div v-if="content.showMeta" class="wt-cms-card__meta">
            <template v-if="source === 'articles'">
              <span v-if="formatDate(featured.publish)" class="wt-cms-card__meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                {{ formatDate(featured.publish) }}
              </span>
              <span
                v-if="content.showAuthor && featured.author?.name"
                class="wt-cms-card__meta-item"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
                {{ featured.author.name }}
              </span>
            </template>
            <template v-else>
              <span
                v-if="formatRange(featured.start, featured.end) || formatDate(featured.publish)"
                class="wt-cms-card__meta-item"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                {{ formatRange(featured.start, featured.end) || formatDate(featured.publish) }}
              </span>
              <span v-if="featured.location" class="wt-cms-card__meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s-7-7-7-12a7 7 0 0 1 14 0c0 5-7 12-7 12z" /><circle cx="12" cy="10" r="3" /></svg>
                {{ featured.location }}
              </span>
            </template>
          </div>
        </div>
      </component>

      <div v-if="featuredRest.length" class="wt-cms-list__featured-rest">
        <component
          :is="itemComponent(item)"
          v-for="item in featuredRest"
          :key="item.id"
          :to="itemHref(item) || undefined"
          class="wt-cms-card wt-cms-card--horizontal"
        >
          <div v-if="content.showImage" class="wt-cms-card__media">
            <img
              v-if="item.image"
              :src="item.image"
              :alt="item.title"
              loading="lazy"
              class="wt-cms-card__image"
            />
            <div v-else class="wt-cms-card__image-fallback" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /><path d="m2 2 20 20" /><path d="M3.59 3.59A1.99 1.99 0 0 0 3 5v14a2 2 0 0 0 2 2h14c.55 0 1.05-.22 1.41-.59" /><path d="M21 15V5a2 2 0 0 0-2-2H9" /></svg>
            </div>
          </div>
          <div class="wt-cms-card__body">
            <h3 class="wt-cms-card__title">{{ item.title }}</h3>
            <p
              v-if="content.showExcerpt && item.excerpt"
              class="wt-cms-card__excerpt"
            >
              {{ item.excerpt }}
            </p>
            <div
              v-if="source === 'articles' && content.showCategory && item.categories?.length"
              class="wt-cms-card__categories"
            >
              <span
                v-for="category in item.categories"
                :key="category.slug"
                class="wt-cms-card__category"
              >
                {{ category.title }}
              </span>
            </div>
            <div v-if="content.showMeta" class="wt-cms-card__meta">
              <template v-if="source === 'articles'">
                <span v-if="formatDate(item.publish)" class="wt-cms-card__meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                  {{ formatDate(item.publish) }}
                </span>
                <span
                  v-if="content.showAuthor && item.author?.name"
                  class="wt-cms-card__meta-item"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
                  {{ item.author.name }}
                </span>
              </template>
              <template v-else>
                <span
                  v-if="formatRange(item.start, item.end) || formatDate(item.publish)"
                  class="wt-cms-card__meta-item"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                  {{ formatRange(item.start, item.end) || formatDate(item.publish) }}
                </span>
                <span v-if="item.location" class="wt-cms-card__meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s-7-7-7-12a7 7 0 0 1 14 0c0 5-7 12-7 12z" /><circle cx="12" cy="10" r="3" /></svg>
                  {{ item.location }}
                </span>
              </template>
            </div>
          </div>
        </component>
      </div>
    </div>

    <div
      v-else
      class="wt-cms-list__grid"
      :data-grid-density="visibleItems.length >= 4 ? 'four' : 'three'"
    >
      <component
        :is="itemComponent(item)"
        v-for="item in visibleItems"
        :key="item.id"
        :to="itemHref(item) || undefined"
        class="wt-cms-card wt-cms-card--vertical"
      >
        <div v-if="content.showImage" class="wt-cms-card__media">
          <img
            v-if="item.image"
            :src="item.image"
            :alt="item.title"
            loading="lazy"
            class="wt-cms-card__image"
          />
          <div v-else class="wt-cms-card__image-fallback" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /><path d="m2 2 20 20" /><path d="M3.59 3.59A1.99 1.99 0 0 0 3 5v14a2 2 0 0 0 2 2h14c.55 0 1.05-.22 1.41-.59" /><path d="M21 15V5a2 2 0 0 0-2-2H9" /></svg>
          </div>
        </div>
        <div class="wt-cms-card__body">
          <h3 class="wt-cms-card__title">{{ item.title }}</h3>
          <p
            v-if="content.showExcerpt && item.excerpt"
            class="wt-cms-card__excerpt"
          >
            {{ item.excerpt }}
          </p>
          <div
            v-if="source === 'articles' && content.showCategory && item.categories?.length"
            class="wt-cms-card__categories"
          >
            <span
              v-for="category in item.categories"
              :key="category.slug"
              class="wt-cms-card__category"
            >
              {{ category.title }}
            </span>
          </div>
          <div v-if="content.showMeta" class="wt-cms-card__meta">
            <template v-if="source === 'articles'">
              <span v-if="formatDate(item.publish)" class="wt-cms-card__meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                {{ formatDate(item.publish) }}
              </span>
              <span
                v-if="content.showAuthor && item.author?.name"
                class="wt-cms-card__meta-item"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
                {{ item.author.name }}
              </span>
            </template>
            <template v-else>
              <span
                v-if="formatRange(item.start, item.end) || formatDate(item.publish)"
                class="wt-cms-card__meta-item"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                {{ formatRange(item.start, item.end) || formatDate(item.publish) }}
              </span>
              <span v-if="item.location" class="wt-cms-card__meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s-7-7-7-12a7 7 0 0 1 14 0c0 5-7 12-7 12z" /><circle cx="12" cy="10" r="3" /></svg>
                {{ item.location }}
              </span>
            </template>
          </div>
        </div>
      </component>
    </div>

    <nav
      v-if="showPagination"
      class="wt-cms-list__pagination"
      :aria-label="source === 'events' ? 'Events pagination' : 'Articles pagination'"
    >
      <p
        v-if="pagination.showSummary"
        class="wt-cms-list__pagination-summary"
      >
        Page {{ resolvedCurrentPage }} of {{ lastPage }} | {{ totalItems }} total | {{ content.itemCount }} per page
      </p>
      <div class="wt-cms-list__pagination-controls">
        <NuxtLink
          :to="paginationHref(Math.max(1, resolvedCurrentPage - 1))"
          class="wt-cms-list__pagination-link"
          :class="{ 'wt-cms-list__pagination-link--disabled': resolvedCurrentPage <= 1 }"
          :aria-disabled="resolvedCurrentPage <= 1 ? 'true' : undefined"
          :tabindex="resolvedCurrentPage <= 1 ? -1 : undefined"
        >
          Previous
        </NuxtLink>

        <template
          v-for="(token, index) in paginationTokens"
          :key="`${token}-${index}`"
        >
          <span
            v-if="token === 'gap'"
            class="wt-cms-list__pagination-gap"
            aria-hidden="true"
          >
            ...
          </span>
          <NuxtLink
            v-else
            :to="paginationHref(token)"
            class="wt-cms-list__pagination-link wt-cms-list__pagination-link--page"
            :class="{ 'wt-cms-list__pagination-link--active': token === resolvedCurrentPage }"
            :aria-current="token === resolvedCurrentPage ? 'page' : undefined"
          >
            {{ token }}
          </NuxtLink>
        </template>

        <NuxtLink
          :to="paginationHref(Math.min(lastPage, resolvedCurrentPage + 1))"
          class="wt-cms-list__pagination-link"
          :class="{ 'wt-cms-list__pagination-link--disabled': resolvedCurrentPage >= lastPage }"
          :aria-disabled="resolvedCurrentPage >= lastPage ? 'true' : undefined"
          :tabindex="resolvedCurrentPage >= lastPage ? -1 : undefined"
        >
          Next
        </NuxtLink>
      </div>
    </nav>
  </section>
</template>

<style scoped>
.wt-cms-list {
  width: 100%;
  padding-top: 72px;
  padding-bottom: 72px;
  padding-inline: max(80px, calc((100% - var(--builder-page-max-width, 1280px)) / 2));
  color: var(--wt-color-text, #111827);
  font-family: var(--wt-font-body, Inter, Arial, sans-serif);
}

@media (max-width: 767.98px) {
  .wt-cms-list {
    padding-top: 52px;
    padding-bottom: 60px;
    padding-inline: 20px;
  }
}

@media (min-width: 768px) and (max-width: 1023.98px) {
  .wt-cms-list {
    padding-top: 64px;
    padding-bottom: 64px;
    padding-inline: 32px;
  }
}

.wt-cms-list__header {
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.wt-cms-list__heading {
  font-family: var(--wt-font-heading, Inter, Arial, sans-serif);
  color: var(--builder-color-secondary, var(--wt-color-text, #0f172a));
  font-size: 1.75rem;
  font-weight: 600;
  line-height: 1.2;
  margin: 0;
}

@media (min-width: 640px) {
  .wt-cms-list__heading {
    font-size: 2rem;
  }
}

.wt-cms-list__description {
  margin: 0;
  max-width: 60ch;
  white-space: pre-line;
  line-height: 1.6;
  font-size: 0.95rem;
  opacity: 0.75;
}

@media (min-width: 640px) {
  .wt-cms-list__description {
    font-size: 1rem;
    line-height: 1.7;
  }
}

.wt-cms-list__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 8rem;
  border-radius: 1rem;
  border: 1px dashed currentColor;
  font-size: 0.875rem;
  opacity: 0.7;
  padding: 1rem;
  text-align: center;
}

.wt-cms-list__list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.wt-cms-list__grid {
  display: grid;
  gap: 1.25rem;
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

@media (min-width: 768px) {
  .wt-cms-list__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .wt-cms-list__grid[data-grid-density='three'] {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .wt-cms-list__grid[data-grid-density='four'] {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.wt-cms-list__featured {
  display: grid;
  gap: 1.25rem;
  grid-template-columns: 1fr;
}

@media (min-width: 1024px) {
  .wt-cms-list__featured {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.wt-cms-list__featured-rest {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.wt-cms-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  border-radius: 1rem;
  border: 1px solid color-mix(in srgb, var(--wt-color-primary, #2563eb) 14%, transparent);
  background: var(--wt-color-bg, #ffffff);
  color: inherit;
  text-decoration: none;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.06);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.wt-cms-card:hover {
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.1);
}

.wt-cms-card--horizontal {
  flex-direction: column;
}

@media (min-width: 640px) {
  .wt-cms-card--horizontal {
    flex-direction: row;
  }

  .wt-cms-card--horizontal .wt-cms-card__media {
    flex: 0 0 40%;
    align-self: stretch;
  }

  .wt-cms-card--horizontal .wt-cms-card__image,
  .wt-cms-card--horizontal .wt-cms-card__image-fallback {
    height: 100%;
    min-height: 12rem;
  }
}

.wt-cms-card--featured {
  flex-direction: column;
}

.wt-cms-card__media {
  width: 100%;
  overflow: hidden;
  aspect-ratio: 16 / 10;
}

.wt-cms-card__media--featured {
  aspect-ratio: 16 / 9;
}

.wt-cms-card__image {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.wt-cms-card__image-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: color-mix(in srgb, var(--wt-color-primary, #2563eb) 8%, transparent);
  opacity: 0.6;
}

.wt-cms-card__image-fallback svg {
  width: 1.5rem;
  height: 1.5rem;
}

.wt-cms-card__body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1 1 auto;
  min-width: 0;
  padding: 1rem;
}

@media (min-width: 640px) {
  .wt-cms-card__body {
    padding: 1.25rem;
  }
}

.wt-cms-card__body--featured {
  gap: 0.75rem;
}

@media (min-width: 640px) {
  .wt-cms-card__body--featured {
    padding: 1.5rem;
  }
}

.wt-cms-card__title {
  font-family: var(--wt-font-heading, Inter, Arial, sans-serif);
  color: var(--builder-color-secondary, var(--wt-color-text, #0f172a));
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.35;
  margin: 0;
  word-break: break-word;
}

.wt-cms-card__title--featured {
  font-size: 1.5rem;
}

@media (min-width: 640px) {
  .wt-cms-card__title--featured {
    font-size: 1.875rem;
  }
}

.wt-cms-card__excerpt {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.55;
  opacity: 0.85;
  word-break: break-word;
}

.wt-cms-card__categories {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.wt-cms-card__category {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  border: 1px solid color-mix(in srgb, var(--wt-color-primary, #2563eb) 24%, transparent);
  background: color-mix(in srgb, var(--wt-color-primary, #2563eb) 8%, transparent);
  color: var(--wt-color-primary, #2563eb);
}

.wt-cms-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.75rem;
  font-size: 0.75rem;
  opacity: 0.7;
}

.wt-cms-card__meta-item {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  min-width: 0;
  word-break: break-word;
}

.wt-cms-card__meta-item svg {
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
}

.wt-cms-list__pagination {
  margin-top: 1.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.wt-cms-list__pagination-summary {
  margin: 0;
  font-size: 0.75rem;
  opacity: 0.65;
}

.wt-cms-list__pagination-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.wt-cms-list__pagination-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  border: 1px solid currentColor;
  padding: 0.375rem 0.75rem;
  color: inherit;
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1;
  text-decoration: none;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.wt-cms-list__pagination-link:hover {
  border-color: var(--builder-color-primary, var(--wt-color-primary, #2563eb));
  background: color-mix(in srgb, var(--builder-color-primary, var(--wt-color-primary, #2563eb)) 8%, transparent);
}

.wt-cms-list__pagination-link--page {
  min-width: 2.25rem;
  font-weight: 600;
  opacity: 0.55;
}

.wt-cms-list__pagination-link--active {
  border-color: var(--builder-color-primary, var(--wt-color-primary, #2563eb));
  background: var(--builder-color-primary, var(--wt-color-primary, #2563eb));
  color: var(--builder-color-background, var(--wt-color-bg, #ffffff));
  opacity: 1;
}

.wt-cms-list__pagination-link--disabled {
  pointer-events: none;
  opacity: 0.45;
}

.wt-cms-list__pagination-gap {
  display: inline-flex;
  min-width: 1.25rem;
  justify-content: center;
  padding-inline: 0.25rem;
  font-size: 0.75rem;
  opacity: 0.5;
}
</style>
