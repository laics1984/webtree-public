import type { PublicPageResponse, PublicRoutesResponse, PublicSchemaTree, SitePayload } from '~/types/public'
import { fetchPublicPage, fetchPublicRoutes, fetchPublicSite } from '~/lib/api'
import { getRequestHost } from '~/lib/host'

function getStatusCode(error: unknown): number {
  if (!error || typeof error !== 'object') {
    return 500
  }

  const statusCode = 'statusCode' in error ? Number(error.statusCode) : NaN
  if (!Number.isNaN(statusCode) && statusCode > 0) {
    return statusCode
  }

  if ('data' in error && error.data && typeof error.data === 'object' && 'statusCode' in error.data) {
    const nestedStatusCode = Number(error.data.statusCode)
    if (!Number.isNaN(nestedStatusCode) && nestedStatusCode > 0) {
      return nestedStatusCode
    }
  }

  return 500
}

function getErrorMessage(error: unknown): string | null {
  if (!error || typeof error !== 'object') {
    return null
  }

  if ('statusMessage' in error && typeof error.statusMessage === 'string' && error.statusMessage.trim()) {
    return error.statusMessage
  }

  if ('message' in error && typeof error.message === 'string' && error.message.trim()) {
    return error.message
  }

  if ('data' in error && error.data && typeof error.data === 'object') {
    if ('message' in error.data && typeof error.data.message === 'string' && error.data.message.trim()) {
      return error.data.message
    }

    if ('statusMessage' in error.data && typeof error.data.statusMessage === 'string' && error.data.statusMessage.trim()) {
      return error.data.statusMessage
    }
  }

  return null
}

function resolvePageError(error: unknown, host: string, apiBase: string) {
  const statusCode = getStatusCode(error)
  const detail = getErrorMessage(error)

  if (statusCode === 404) {
    if (import.meta.dev) {
      return createError({
        statusCode: 404,
        statusMessage: [
          `Page not found for host "${host}".`,
          `API base: ${apiBase}.`,
          detail ? `Upstream error: ${detail}` : null
        ]
          .filter(Boolean)
          .join(' ')
      })
    }

    return createError({ statusCode: 404, statusMessage: 'Page not found' })
  }

  if (import.meta.dev) {
    const message = [
      `Unable to load page for host "${host}".`,
      `API base: ${apiBase}.`,
      detail ? `Upstream error: ${detail}` : null
    ]
      .filter(Boolean)
      .join(' ')

    return createError({ statusCode: 502, statusMessage: message })
  }

  return createError({ statusCode: 502, statusMessage: 'Unable to load this site page right now.' })
}

function normalizePublicPath(path?: string | null): string | null {
  if (typeof path !== 'string') {
    return null
  }

  const trimmed = path.trim()
  if (!trimmed) {
    return '/'
  }

  const pathname = trimmed.split(/[?#]/)[0] || '/'
  return pathname.startsWith('/') ? pathname : `/${pathname}`
}

export function resolveHomepageFallbackPath(data: PublicRoutesResponse | null | undefined): string | null {
  const routes = Array.isArray(data?.routes) ? data.routes : []

  const explicitHomepage = routes.find((route) => route.isHomepage || normalizePublicPath(route.path) === '/')
  if (explicitHomepage) {
    return normalizePublicPath(explicitHomepage.path)
  }

  const publicIdentifier = typeof data?.publicIdentifier === 'string'
    ? data.publicIdentifier.trim()
    : ''

  if (!publicIdentifier) {
    return null
  }

  const fallbackPath = `/${publicIdentifier}`

  for (const route of routes) {
    const routePath = normalizePublicPath(route.path)
    if (routePath === fallbackPath) {
      return routePath
    }

    const slug = typeof route.slug === 'string' ? route.slug.trim() : ''
    if (slug === publicIdentifier) {
      return routePath
    }
  }

  return null
}

function getNestedNodeCount(node: unknown): number {
  if (!node || typeof node !== 'object') {
    return 0
  }

  const candidate = node as { content?: unknown[]; children?: unknown[]; elements?: unknown[] }
  return candidate.content?.length || candidate.children?.length || candidate.elements?.length || 0
}

function getSchemaChildCount(schema?: PublicSchemaTree | unknown[] | null): number {
  if (!schema) {
    return 0
  }

  if (Array.isArray(schema)) {
    return schema.reduce((count, node) => count + getNestedNodeCount(node), 0)
  }

  if (Array.isArray(schema.elements)) {
    return schema.elements.reduce((count, node) => count + getNestedNodeCount(node), 0)
  }

  if (Array.isArray(schema.children)) {
    return schema.children.reduce((count, node) => count + getNestedNodeCount(node), 0)
  }

  return getNestedNodeCount(schema)
}

function siteShellLooksEmpty(site?: SitePayload | null): boolean {
  const headerCount = getSchemaChildCount(site?.headerSchema)
  const footerCount = getSchemaChildCount(site?.footerSchema)
  return headerCount === 0 || footerCount === 0
}

async function withFreshSiteShell(payload: PublicPageResponse, host: string): Promise<PublicPageResponse> {
  if (!siteShellLooksEmpty(payload.site)) {
    return payload
  }

  try {
    const siteResponse = await fetchPublicSite(host)

    if (!siteShellLooksEmpty(siteResponse.site)) {
      return {
        ...payload,
        site: siteResponse.site
      }
    }
  } catch {
    return payload
  }

  return payload
}

async function fetchResolvedPublicPage(host: string, path: string): Promise<PublicPageResponse> {
  try {
    const payload = await fetchPublicPage(host, path)
    return await withFreshSiteShell(payload, host)
  } catch (error) {
    if (path !== '/' || getStatusCode(error) !== 404) {
      throw error
    }

    let fallbackPath: string | null = null

    try {
      const routes = await fetchPublicRoutes(host)
      fallbackPath = resolveHomepageFallbackPath(routes)
    } catch {
      fallbackPath = null
    }

    if (!fallbackPath || fallbackPath === path) {
      throw error
    }

    try {
      const payload = await fetchPublicPage(host, fallbackPath)
      return await withFreshSiteShell(payload, host)
    } catch (fallbackError) {
      if (getStatusCode(fallbackError) === 404) {
        throw error
      }

      throw fallbackError
    }
  }
}

export async function usePublicPage() {
  const route = useRoute()
  const config = useRuntimeConfig()
  const host = getRequestHost()
  const path = computed(() => normalizePublicPath(route.path) || '/')

  // Keyed per path: `PublicSitePage` is mounted both by `pages/index.vue`
  // (via the default layout) and by `pages/[...slug].vue`. On the first
  // client-side navigation away from "/", the new instance can mount before
  // the old one's scope disposes — a shared key would make it inherit the
  // old instance's frozen `path` closure and re-fetch the wrong page.
  const { data, error } = await useAsyncData<PublicPageResponse | null>(
    () => `public-page:${host}:${path.value}`,
    () => fetchResolvedPublicPage(host, path.value),
    {
      watch: [path],
      default: () => null,
    }
  )

  if (error.value) {
    throw resolvePageError(error.value, host, config.public.apiBase)
  }

  if (!data.value?.entity?.publicIdentifier || !data.value?.site || !data.value?.page) {
    if (import.meta.dev) {
      throw createError({
        statusCode: 404,
        statusMessage: `Page payload missing required public identifier for host "${host}" and path "${path.value}". API base: ${config.public.apiBase}.`
      })
    }

    throw createError({ statusCode: 404, statusMessage: 'Page not found' })
  }

  return data
}
