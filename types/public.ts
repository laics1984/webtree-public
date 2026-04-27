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
