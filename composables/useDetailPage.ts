import type {
  PublicContentItemResponse,
  PublicContentItemType,
  PublicTemplateResponse,
} from '~/types/public'
import { fetchPublicContentItem, fetchPublicTemplate } from '~/lib/api'
import { getRequestHost } from '~/lib/host'

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
    const statusCode =
      typeof (error.value as { statusCode?: number }).statusCode === 'number'
        ? (error.value as { statusCode: number }).statusCode
        : 502
    throw createError({
      statusCode: statusCode === 404 ? 404 : 502,
      statusMessage:
        statusCode === 404
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
