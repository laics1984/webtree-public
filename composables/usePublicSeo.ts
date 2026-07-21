import type { Ref } from 'vue'
import type { JsonValue, PublicPageResponse, SeoPayload } from '~/types/public'
import { getRequestHost } from '~/lib/host'
import { normalizeSiteProtocol, resolvePublicHost } from '~/lib/publicFeed'

function isJsonObject(value: unknown): value is Record<string, JsonValue> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function buildTitle(title: string, suffix?: string | null): string {
  if (!suffix || !title) {
    return title
  }

  if (title.endsWith(suffix)) {
    return title
  }

  const separator = /^\s|^[|:-]/.test(suffix) ? '' : ' '
  return `${title}${separator}${suffix}`
}

function normalizePath(path?: string | null): string {
  if (!path) {
    return '/'
  }

  return path.startsWith('/') ? path : `/${path}`
}

function toAbsoluteUrl(value: string | null | undefined, baseUrl?: string | null): string | null {
  if (!value) {
    return null
  }

  try {
    return new URL(value, baseUrl || undefined).toString()
  } catch {
    return null
  }
}

function buildRobots(seo: SeoPayload | undefined, fallback: string): string {
  const directives = new Set(
    (seo?.robots || fallback)
      .split(',')
      .map((directive) => directive.trim())
      .filter(Boolean)
  )

  if (seo?.noindex) {
    directives.delete('index')
    directives.delete('follow')
    directives.add('noindex')
    directives.add('nofollow')
  }

  if (seo?.noarchive) {
    directives.add('noarchive')
  }

  return Array.from(directives).join(', ') || fallback
}

function normalizeStructuredData(value: SeoPayload['structuredData'] | string | undefined): string[] {
  if (!value) {
    return []
  }

  if (typeof value === 'string') {
    try {
      return normalizeStructuredData(JSON.parse(value) as SeoPayload['structuredData'])
    } catch {
      return []
    }
  }

  const items = Array.isArray(value) ? value : [value]

  return items.flatMap((item) => {
    if (!isJsonObject(item)) {
      return []
    }

    try {
      return [JSON.stringify(item)]
    } catch {
      return []
    }
  })
}

export function usePublicSeo(payload: Ref<PublicPageResponse | null | undefined>) {
  const config = useRuntimeConfig()
  const requestHost = getRequestHost()
  const siteProtocol = normalizeSiteProtocol(config.public.siteProtocol)

  useHead(() => {
    const entity = payload.value?.entity
    const site = payload.value?.site
    const page = payload.value?.page
    const seo = page?.seo
    const siteName = site?.defaults?.siteName || entity?.publicIdentifier || 'Website'
    const publicHost = resolvePublicHost(entity, requestHost, config.public.platformBaseDomain)
    const baseUrl = publicHost ? toAbsoluteUrl(`${siteProtocol}://${publicHost}`) : null
    const fallbackTitle = page?.title || siteName
    const title = buildTitle(seo?.title || fallbackTitle, site?.defaults?.titleSuffix)
    const description = seo?.description || page?.description || site?.defaults?.defaultDescription || ''
    const canonical = toAbsoluteUrl(seo?.canonicalUrl || normalizePath(page?.path), baseUrl)
    const robots = buildRobots(seo, site?.defaults?.robotsDefault || 'index,follow')
    const ogImage = toAbsoluteUrl(seo?.ogImage || site?.defaults?.defaultOgImage, baseUrl)
    const twitterImage = toAbsoluteUrl(seo?.twitterImage || ogImage, baseUrl)
    const favicon = toAbsoluteUrl(entity?.favicon, baseUrl)
    const structuredData = normalizeStructuredData(seo?.structuredData || site?.defaults?.structuredDataJsonLd)
    const link: Array<{ rel: string; href: string }> = []
    const meta: Array<Record<string, string>> = []

    if (description) {
      meta.push({ name: 'description', content: description })
    }

    meta.push({ name: 'robots', content: robots })
    meta.push({ property: 'og:title', content: seo?.ogTitle || title })
    meta.push({ property: 'og:description', content: seo?.ogDescription || description })
    meta.push({ property: 'og:type', content: seo?.ogType || 'website' })

    if (siteName) {
      meta.push({ property: 'og:site_name', content: siteName })
    }

    if (canonical) {
      meta.push({ property: 'og:url', content: canonical })
    }

    meta.push({ name: 'twitter:card', content: seo?.twitterCard || site?.defaults?.defaultTwitterCard || 'summary_large_image' })
    meta.push({ name: 'twitter:title', content: seo?.twitterTitle || title })
    meta.push({ name: 'twitter:description', content: seo?.twitterDescription || description })

    if (ogImage) {
      meta.push({ property: 'og:image', content: ogImage })
    }

    if (twitterImage) {
      meta.push({ name: 'twitter:image', content: twitterImage })
    }

    if (seo?.articlePublishedTime) {
      meta.push({ property: 'article:published_time', content: seo.articlePublishedTime })
    }

    if (seo?.articleModifiedTime) {
      meta.push({ property: 'article:modified_time', content: seo.articleModifiedTime })
    }

    if (canonical) {
      link.push({ rel: 'canonical', href: canonical })
    }

    if (favicon) {
      link.push({ rel: 'icon', href: favicon })
    }

    return {
      title,
      htmlAttrs: {
        lang: entity?.defaultLocale || 'en'
      },
      link,
      meta,
      script: structuredData.map((item, index) => ({
        key: `json-ld:${index}`,
        type: 'application/ld+json',
        children: item
      }))
    }
  })
}
