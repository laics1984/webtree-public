import type { PublicEntityPayload, PublicRoutesResponse, PublicSiteResponse } from '~/types/public'
import { isLocalPlatformRequestHost, normalizeHost, preferRequestHost } from '~/lib/host'

const DEFAULT_ROBOTS_TXT = 'User-agent: *\nAllow: /\n'
const VALID_CHANGE_FREQUENCIES = new Set([
  'always',
  'hourly',
  'daily',
  'weekly',
  'monthly',
  'yearly',
  'never'
])

type PublicHostSource = Pick<PublicEntityPayload, 'canonicalHost' | 'resolvedHost'> | Pick<PublicRoutesResponse, 'canonicalHost' | 'resolvedHost'>

function hasText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function normalizeMultilineText(value: string): string {
  return value.replace(/\r\n?/g, '\n').trim()
}

function normalizePublicPath(path?: string | null): string | null {
  if (typeof path !== 'string') {
    return null
  }

  if (!path.trim()) {
    return '/'
  }

  try {
    const normalized = new URL(path, 'https://webtree.invalid')
    if (!['http:', 'https:'].includes(normalized.protocol)) {
      return null
    }

    return normalized.pathname || '/'
  } catch {
    const trimmed = path.trim().split(/[?#]/)[0] || '/'
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  }
}

function normalizeLastModified(value?: string): string | null {
  if (!hasText(value)) {
    return null
  }

  const date = new Date(value)
  return Number.isNaN(date.valueOf()) ? null : date.toISOString()
}

function normalizeChangeFrequency(value?: string): string | null {
  if (!hasText(value)) {
    return null
  }

  const normalized = value.trim().toLowerCase()
  return VALID_CHANGE_FREQUENCIES.has(normalized) ? normalized : null
}

function normalizePriority(value?: number): string | null {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null
  }

  const clamped = Math.max(0, Math.min(1, value))
  return String(clamped)
}

export function normalizeSiteProtocol(value?: string | null): 'http' | 'https' {
  return value === 'http' ? 'http' : 'https'
}

export function resolvePublicHost(source: PublicHostSource | null | undefined, requestHost: string, platformBaseDomain?: string | null): string {
  const normalizedRequestHost = normalizeHost(requestHost)

  if (isLocalPlatformRequestHost(normalizedRequestHost, platformBaseDomain)) {
    return normalizedRequestHost
  }

  const preferredHost = normalizeHost(source?.canonicalHost || source?.resolvedHost || normalizedRequestHost) || normalizedRequestHost
  return preferRequestHost(preferredHost, normalizedRequestHost)
}

export function buildAbsolutePublicUrl(
  source: PublicHostSource | null | undefined,
  requestHost: string,
  path: string,
  siteProtocol = 'https',
  platformBaseDomain?: string | null
): string {
  const host = resolvePublicHost(source, requestHost, platformBaseDomain) || 'localhost'
  const pathname = normalizePublicPath(path) || '/'
  const protocol = normalizeSiteProtocol(siteProtocol)
  return new URL(pathname, `${protocol}://${host}`).toString()
}

export function buildRobotsTxt(
  data: PublicSiteResponse,
  requestHost: string,
  siteProtocol = 'https',
  platformBaseDomain?: string | null
): string {
  const explicitPolicy = hasText(data.site.defaults?.robotsTxt) ? data.site.defaults.robotsTxt : ''

  const normalizedBasePolicy = explicitPolicy
    ? normalizeMultilineText(explicitPolicy)
        .split('\n')
        .filter((line) => !/^sitemap:/i.test(line.trim()))
        .join('\n')
    : DEFAULT_ROBOTS_TXT.trim()

  const basePolicy = normalizedBasePolicy || DEFAULT_ROBOTS_TXT.trim()

  const sitemapUrl = buildAbsolutePublicUrl(data.entity, requestHost, '/sitemap.xml', siteProtocol, platformBaseDomain)
  return `${basePolicy}\nSitemap: ${sitemapUrl}\n`
}

export function buildSitemapXml(
  data: PublicRoutesResponse,
  requestHost: string,
  siteProtocol = 'https',
  platformBaseDomain?: string | null
): string {
  const seen = new Set<string>()
  const items = (data.routes || [])
    .filter((route) => !route.noindex)
    .flatMap((route) => {
      const path = normalizePublicPath(route.path)
      if (!path) {
        return []
      }

      const location = buildAbsolutePublicUrl(data, requestHost, path, siteProtocol, platformBaseDomain)
      if (seen.has(location)) {
        return []
      }

      seen.add(location)

      const fragments = [`<loc>${escapeXml(location)}</loc>`]
      const lastModified = normalizeLastModified(route.updatedAt)
      const changeFrequency = normalizeChangeFrequency(route.changeFrequency)
      const priority = normalizePriority(route.priority)

      if (lastModified) {
        fragments.push(`<lastmod>${escapeXml(lastModified)}</lastmod>`)
      }

      if (changeFrequency) {
        fragments.push(`<changefreq>${escapeXml(changeFrequency)}</changefreq>`)
      }

      if (priority) {
        fragments.push(`<priority>${escapeXml(priority)}</priority>`)
      }

      return [`  <url>${fragments.join('')}</url>`]
    })

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...items,
    '</urlset>'
  ].join('\n')
}

export function getPublicFeedStatusCode(error: unknown): number {
  if (!error || typeof error !== 'object') {
    return 500
  }

  if ('statusCode' in error && typeof error.statusCode === 'number') {
    return error.statusCode
  }

  if ('status' in error && typeof error.status === 'number') {
    return error.status
  }

  if ('response' in error && error.response && typeof error.response === 'object' && 'status' in error.response && typeof error.response.status === 'number') {
    return error.response.status
  }

  if ('data' in error && error.data && typeof error.data === 'object' && 'statusCode' in error.data && typeof error.data.statusCode === 'number') {
    return error.data.statusCode
  }

  return 500
}
