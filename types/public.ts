export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }

export interface PublicStyleTokens {
  [key: string]: JsonPrimitive | JsonPrimitive[] | PublicStyleTokens | undefined
}

export interface PublicBlockNode {
  id?: string | number
  _key?: string | number
  type?: string | null
  children?: PublicBlockNode[]
  elements?: PublicBlockNode[]
  [key: string]: unknown
}

export interface PublicSchemaTree {
  elements?: PublicBlockNode[]
  children?: PublicBlockNode[]
  [key: string]: unknown
}

export interface SiteDefaults {
  siteName?: string | null
  titleSuffix?: string | null
  titlePattern?: string | null
  defaultDescription?: string | null
  defaultOgImage?: string | null
  defaultTwitterCard?: string | null
  robotsDefault?: string | null
  robotsTxt?: string | null
  structuredDataJsonLd?: string | null
}

export interface PublicEntityPayload {
  id: string
  siteKey: string
  publicIdentifier?: string | null
  name?: string | null
  resolvedHost: string
  canonicalHost?: string | null
  favicon?: string | null
  defaultLocale?: string | null
}

export interface PublicMenuItem {
  id?: string
  href?: string | null
  label?: string | null
  target?: string | null
  rel?: string | null
  visible?: boolean
  children?: PublicMenuItem[] | null
}

export interface PublicMenu {
  id?: string
  name?: string | null
  purpose?: string | null
  items?: PublicMenuItem[] | null
}

export interface SitePayload {
  layoutId?: string | number | null
  layoutVersionId?: string | number | null
  builderStyles?: PublicStyleTokens | null
  headerSchema?: PublicSchemaTree | PublicBlockNode[] | null
  footerSchema?: PublicSchemaTree | PublicBlockNode[] | null
  menus?: PublicMenu[] | null
  defaults?: SiteDefaults
}

export interface SeoPayload {
  title?: string | null
  description?: string | null
  keywords?: string[] | null
  canonicalUrl?: string | null
  robots?: string | null
  noindex?: boolean
  noarchive?: boolean
  ogTitle?: string | null
  ogDescription?: string | null
  ogImage?: string | null
  ogType?: string | null
  twitterCard?: string | null
  twitterTitle?: string | null
  twitterDescription?: string | null
  twitterImage?: string | null
  articlePublishedTime?: string | null
  articleModifiedTime?: string | null
  author?: string | null
  structuredData?: Record<string, JsonValue> | Array<Record<string, JsonValue>> | null
}

export interface PagePayload {
  pageId: string
  revisionId?: string
  revisionNo?: number
  title: string
  description?: string | null
  slug?: string
  path: string
  isHomepage?: boolean
  updatedAt?: string
  bodySchema?: PublicSchemaTree | PublicBlockNode[] | null
  seo?: SeoPayload
}

export interface PublicSiteResponse {
  entity: PublicEntityPayload
  site: SitePayload
}

export interface PublicPageResponse extends PublicSiteResponse {
  page: PagePayload
}

export interface PublicRoutesResponse {
  siteKey: string
  publicIdentifier?: string | null
  resolvedHost: string
  canonicalHost?: string | null
  routes: Array<{
    path: string
    slug?: string
    pageId: string
    isHomepage?: boolean
    updatedAt?: string
    changeFrequency?: string
    priority?: number
    noindex?: boolean
  }>
}

export type PublicContentItemType = 'article' | 'event'
export type PublicTemplateType = PublicContentItemType | 'articleListing' | 'eventListing'

export interface PublicTemplatePayload {
  pageId: string
  revisionId?: string
  revisionNo?: number
  templateFor: PublicTemplateType
  updatedAt?: string
  bodySchema?: PublicSchemaTree | PublicBlockNode[] | null
}

export interface PublicTemplateResponse extends PublicSiteResponse {
  template: PublicTemplatePayload
}

export interface PublicContentItemAuthor {
  id: string | number
  name: string | null
}

export interface PublicContentItemCategory {
  slug: string
  title: string
}

export interface PublicContentItemTag {
  id?: string | number
  name?: string
  slug: string
  title?: string
}

export interface PublicContentItem {
  id: string
  type: PublicContentItemType
  title: string
  slug?: string | null
  canonicalPath?: string | null
  excerpt?: string | null
  body?: string | null
  image?: string | null
  gallery?: Array<string | null>
  publish?: string | null
  start?: string | null
  end?: string | null
  location?: string | null
  author?: PublicContentItemAuthor | null
  categories?: PublicContentItemCategory[]
  tags?: PublicContentItemTag[]
}

export interface PublicContentItemResponse {
  entity: { id: string; siteKey?: string | null }
  item: PublicContentItem
}

export type PublicResolveKind =
  | 'article'
  | 'event'
  | 'articleListing'
  | 'eventListing'
  | 'page'
  | 'redirect'
  | 'notFound'

export interface PublicResolveListing {
  mode: 'all' | 'taxonomy'
  taxonomyType: 'category' | 'tag' | null
  taxonomySlug: string | null
}

export interface PublicResolveResponse {
  kind: PublicResolveKind
  id?: string
  slug?: string
  canonicalPath?: string
  redirectTo?: string
  status?: number
  template?: { templateFor: PublicContentItemType }
  listing?: PublicResolveListing | null
  prefixes?: { article: string; event: string }
}

export type CmsContentSource = 'articles' | 'events'
export type CmsListLayout = 'grid' | 'list' | 'featured'
export type CmsListSelectionMode = 'auto' | 'manual'
export type CmsTaxonomyType = 'category' | 'tag'
export type CmsListFilterMode = 'all' | 'currentListing' | 'specificTaxonomy'
export type CmsListHeadingMode = 'static' | 'archive-title' | 'hide-on-archive'
export type CmsListPaginationStyle = 'numbered'

export interface CmsListFilter {
  mode: CmsListFilterMode
  taxonomyType: CmsTaxonomyType | null
  taxonomySlug: string | null
}

export interface CmsListPagination {
  enabled: boolean
  style: CmsListPaginationStyle
  showSummary: boolean
}

export interface CmsListContent {
  source: CmsContentSource
  heading: string
  headingMode?: CmsListHeadingMode
  archiveTitlePrefix?: string
  archiveTitleSuffix?: string
  showHeading: boolean
  description: string
  showDescription: boolean
  layout: CmsListLayout
  itemCount: number
  pagination?: CmsListPagination
  filter?: CmsListFilter
  categorySlug: string | null
  selectionMode: CmsListSelectionMode
  manualIds: string[]
  showImage: boolean
  showExcerpt: boolean
  showMeta: boolean
  showAuthor: boolean
  showCategory: boolean
}

export interface PublicListingContext {
  mode: 'all' | 'taxonomy'
  taxonomy: {
    type: CmsTaxonomyType
    slug: string
    title: string
    description?: string | null
  } | null
  notFound?: boolean
}

export interface PublicContentListResponse {
  entity: { id: string; siteKey?: string | null }
  listingContext?: PublicListingContext
  items: PublicContentItem[]
  total?: number
  currentPage?: number
  lastPage?: number
}
