import type {
  CmsTaxonomyType,
  PublicContentItemType,
  PublicContentListResponse,
  PublicTemplateResponse,
} from '~/types/public'
import { fetchPublicContentList, fetchPublicTemplate } from '~/lib/api'
import { getRequestHost } from '~/lib/host'

export interface ContentListingPageOptions {
  taxonomyType?: CmsTaxonomyType | null
  taxonomySlug?: string | null
}

export interface ContentListingPagePayload {
  template: PublicTemplateResponse
  list: PublicContentListResponse
}

/**
 * Listing page data for articles or events. Generalises the former
 * article-only composable: events ignore taxonomy and use the `eventListing`
 * template.
 */
export async function useContentListingPage(
  type: PublicContentItemType,
  options: ContentListingPageOptions = {}
) {
  const host = getRequestHost()
  const taxonomyType = type === 'article' ? (options.taxonomyType ?? null) : null
  const taxonomySlug = type === 'article' ? (options.taxonomySlug ?? null) : null
  const templateType = type === 'article' ? 'articleListing' : 'eventListing'
  const key = `content-listing:${type}:${host}:${taxonomyType ?? 'all'}:${taxonomySlug ?? ''}`

  const { data, error } = await useAsyncData<ContentListingPagePayload | null>(
    key,
    async () => {
      const [templateResponse, listResponse] = await Promise.all([
        fetchPublicTemplate(host, templateType),
        fetchPublicContentList(host, type, {
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
          ? 'Listing template not found.'
          : 'Unable to load this listing right now.',
    })
  }

  if (!data.value?.template?.template?.bodySchema) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Listing template missing.',
    })
  }

  if (data.value.list.listingContext?.notFound) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Listing not found.',
    })
  }

  return data
}
