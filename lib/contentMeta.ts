import type { PublicContentItem } from '~/types/public'
import { formatDate, formatRange } from '~/lib/dateFormat'

/**
 * A content item's metadata — when, by whom, where — as an icon and a label.
 *
 * Detail templates (DynamicFieldBlock) and listing cards (CmsListBlock) both
 * show these facts, and the builder canvas draws the same fields with the same
 * icons (dynamic-fields.tsx, cms-list.tsx). Each fact is defined here once, so a
 * card and the page it links to cannot phrase the same date two different ways.
 *
 * `now` is the reader's clock once the page has hydrated (useHydratedNow) and
 * null before it. Dates read as absolute, deterministic labels until then, and
 * turn relative ("3 hours ago") only in the browser — see lib/dateFormat.
 */
export type ContentMetaIconName = 'calendar' | 'user' | 'map-pin'

export type ContentMetaKind = 'articleDate' | 'eventDate' | 'author' | 'location'

export interface ContentMeta {
  kind: ContentMetaKind
  icon: ContentMetaIconName
  label: string
}

const META: Record<
  ContentMetaKind,
  { icon: ContentMetaIconName; label: (item: PublicContentItem, now: number | null) => string }
> = {
  articleDate: { icon: 'calendar', label: (item, now) => formatDate(item.publish, now) },
  // An event is dated by when it runs; the publish date only stands in for an
  // event that has no schedule.
  eventDate: {
    icon: 'calendar',
    label: (item, now) => formatRange(item.start, item.end, now) || formatDate(item.publish, now),
  },
  author: { icon: 'user', label: (item) => item.author?.name?.trim() ?? '' },
  location: { icon: 'map-pin', label: (item) => item.location?.trim() ?? '' },
}

/**
 * One fact about an item, or null when the item has nothing to say — a bare
 * icon beside an empty label is never rendered.
 */
export function contentMeta(
  kind: ContentMetaKind,
  item: PublicContentItem,
  now: number | null = null
): ContentMeta | null {
  const { icon, label } = META[kind]
  const text = label(item, now)

  return text ? { kind, icon, label: text } : null
}

/** Several facts in the given order, skipping the ones the item lacks. */
export function contentMetaList(
  kinds: readonly ContentMetaKind[],
  item: PublicContentItem,
  now: number | null = null
): ContentMeta[] {
  return kinds
    .map((kind) => contentMeta(kind, item, now))
    .filter((meta): meta is ContentMeta => meta !== null)
}
