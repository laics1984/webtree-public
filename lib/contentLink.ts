import type { ContentPrefixes } from './contentPrefixes'
import type { PublicContentItem } from '~/types/public'

export function resolveContentItemHref(
  item: Pick<PublicContentItem, 'id' | 'type' | 'slug' | 'canonicalPath'>,
  prefixes?: ContentPrefixes | null
): string | null {
  if (item.canonicalPath) {
    return item.canonicalPath
  }

  const key = item.slug || item.id
  if (!key) {
    return null
  }

  const prefix = item.type === 'event' ? prefixes?.event || 'events' : prefixes?.article || 'articles'
  return `/${prefix}/${key}`
}
