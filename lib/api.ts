import type { PublicPageResponse, PublicRoutesResponse, PublicSiteResponse } from '~/types/public'

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
