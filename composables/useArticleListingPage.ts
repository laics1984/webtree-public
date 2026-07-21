import type {
  CmsTaxonomyType,
  PublicContentListResponse,
  PublicTemplateResponse,
} from '~/types/public'
import { fetchPublicContentList, fetchPublicTemplate } from '~/lib/api'
import { getRequestHost } from '~/lib/host'

export interface ArticleListingPageOptions {
  taxonomyType?: CmsTaxonomyType | null
  taxonomySlug?: string | null
}

export interface ArticleListingPagePayload {
  template: PublicTemplateResponse
  list: PublicContentListResponse
}

export async function useArticleListingPage(options: ArticleListingPageOptions = {}) {
  const host = getRequestHost()
  const taxonomyType = options.taxonomyType ?? null
  const taxonomySlug = options.taxonomySlug ?? null
  const key = `article-listing:${host}:${taxonomyType ?? 'all'}:${taxonomySlug ?? ''}`

  const { data, error } = await useAsyncData<ArticleListingPagePayload | null>(
    key,
    async () => {
      const [templateResponse, listResponse] = await Promise.all([
        fetchPublicTemplate(host, 'articleListing'),
        fetchPublicContentList(host, 'article', {
          count: 1,
          taxonomyType,
          taxonomySlug,
        }),
      ])

      return {
        template: templateResponse,
        list: listResponse,
      }
    },
    { default: () => null }
  )

  if (error.value) {
    const statusCode =
      typeof (error.value as { statusCode?: number }).statusCode === 'number'
        ? (error.value as { statusCode: number }).statusCode
        : 502
    throw createError({
      statusCode: statusCode === 404 ? 404 : 502,
      statusMessage:
        statusCode === 404
          ? 'Article listing template not found.'
          : 'Unable to load this listing right now.',
    })
  }

  if (!data.value?.template?.template?.bodySchema) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Article listing template missing.',
    })
  }

  if (data.value.list.listingContext?.notFound) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Article listing not found.',
    })
  }

  return data
}
