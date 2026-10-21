import type {
  PublicContentItemResponse,
  PublicContentItemType,
  PublicTemplateResponse,
} from '~/types/public'
import { fetchPublicContentItem, fetchPublicTemplate } from '~/lib/api'
import { getRequestHost } from '~/lib/host'
import { isNotFoundError } from '~/lib/httpError'

export interface DetailPagePayload {
  template: PublicTemplateResponse
  content: PublicContentItemResponse
}

export async function useDetailPage(type: PublicContentItemType, slug: string) {
  const host = getRequestHost()

  const { data, error } = await useAsyncData<DetailPagePayload | null>(
    `public-detail:${type}:${slug}:${host}`,
    async () => {
      const [templateResponse, contentResponse] = await Promise.all([
        fetchPublicTemplate(host, type),
        fetchPublicContentItem(host, type, slug),
      ])

      return {
        template: templateResponse,
        content: contentResponse,
      }
    },
    { default: () => null }
  )

  if (error.value) {
    // Shared with the catch-all: a missing item must 404 whichever shape the
    // failed fetch arrived in, and only a genuine failure may be a 502.
    const notFound = isNotFoundError(error.value)
    throw createError({
      statusCode: notFound ? 404 : 502,
      statusMessage: notFound
        ? `${type === 'event' ? 'Event' : 'Article'} not found`
        : 'Unable to load this page right now.',
    })
  }

  if (!data.value?.template?.template?.bodySchema || !data.value?.content?.item) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Detail page or template missing.',
    })
  }

  return data
}
