import type {
  PublicContentItemResponse,
  PublicContentItemType,
  PublicContentListResponse,
  PublicPageResponse,
  PublicResolveResponse,
  PublicRoutesResponse,
  PublicSiteResponse,
  PublicTemplateType,
  PublicTemplateResponse,
} from '~/types/public'

function resolveApiBase(apiBase?: string | null): string {
  if (apiBase) {
    return apiBase
  }
  // On the client, route through the Nuxt server proxy so the browser
  // never needs to reach the internal API host directly.
  if (import.meta.client) {
    return '/api/public'
  }
  const config = useRuntimeConfig()
  return `${(config.publicApiBase as string) || config.public.apiBase}/api/public`
}

export async function fetchPublicPage(host: string, path: string, apiBase?: string | null) {
  const base = resolveApiBase(apiBase)
  return await $fetch<PublicPageResponse>(`${base}/page`, {
    params: { host, path }
  })
}

export async function fetchPublicResolve(host: string, path: string, apiBase?: string | null) {
  const base = resolveApiBase(apiBase)
  return await $fetch<PublicResolveResponse>(`${base}/resolve`, {
    params: { host, path }
  })
}

export async function fetchPublicSite(host: string, apiBase?: string | null) {
  const base = resolveApiBase(apiBase)
  return await $fetch<PublicSiteResponse>(`${base}/site`, {
    params: { host }
  })
}

export async function fetchPublicRoutes(host: string, apiBase?: string | null) {
  const base = resolveApiBase(apiBase)
  return await $fetch<PublicRoutesResponse>(`${base}/routes`, {
    params: { host }
  })
}

export async function fetchPublicTemplate(
  host: string,
  type: PublicTemplateType,
  apiBase?: string | null
) {
  const base = resolveApiBase(apiBase)
  return await $fetch<PublicTemplateResponse>(`${base}/template`, {
    params: { host, type },
  })
}

export async function fetchPublicContentItem(
  host: string,
  type: PublicContentItemType,
  slug: string,
  apiBase?: string | null
) {
  const base = resolveApiBase(apiBase)
  return await $fetch<PublicContentItemResponse>(`${base}/content`, {
    params: { host, type, slug },
  })
}

export interface PublicContactPayload {
  first_name?: string
  last_name?: string
  email: string
  phone?: string
  company?: string
  subject?: string
  message: string
  page_url?: string
  marketing_opt_in?: boolean
  website?: string // honeypot — must stay empty
  meta?: Record<string, unknown>
}

export interface PublicContactResponse {
  success: boolean
  message?: string
}

export async function submitPublicContact(
  host: string,
  payload: PublicContactPayload,
  apiBase?: string | null
) {
  const base = resolveApiBase(apiBase)
  return await $fetch<PublicContactResponse>(`${base}/contact`, {
    method: 'POST',
    body: { ...payload, host },
  })
}

export async function fetchPublicContentList(
  host: string,
  type: PublicContentItemType,
  params: {
    count: number
    categorySlug?: string | null
    taxonomyType?: 'category' | 'tag' | null
    taxonomySlug?: string | null
    current?: number
  },
  apiBase?: string | null
) {
  const base = resolveApiBase(apiBase)
  return await $fetch<PublicContentListResponse>(`${base}/content-list`, {
    params: {
      host,
      type,
      count: params.count,
      current: params.current ?? 1,
      categorySlug: params.categorySlug ?? undefined,
      taxonomyType: params.taxonomyType ?? undefined,
      taxonomySlug: params.taxonomySlug ?? undefined,
    },
  })
}
