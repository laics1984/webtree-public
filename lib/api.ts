import type {
  PublicContentItemResponse,
  PublicContentItemType,
  PublicContentListResponse,
  PublicPageResponse,
  PublicRoutesResponse,
  PublicSiteResponse,
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
  type: PublicContentItemType,
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

export async function fetchPublicContentList(
  host: string,
  type: PublicContentItemType,
  params: { count: number; categorySlug?: string | null; current?: number },
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
    },
  })
}
