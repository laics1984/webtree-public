import type { WhatsAppSchedule, WhatsAppWidget } from '~/types/public'

/**
 * The presentation decisions the WhatsApp widget makes locally.
 *
 * Everything about the phone number itself — normalizing it, encoding the
 * prefill, assembling the wa.me URL — belongs to the CMS API and arrives as a
 * ready-built `href` (see webtree-cms-api specs/public-site-api.md). What is
 * genuinely local is: is the business open on the visitor's clock, does this
 * route qualify, and does the prefill want the page it was sent from.
 *
 * Pure functions with the clock injected, so the tests do not depend on when
 * they run and the component does not depend on how time is read.
 */

/** Schedule keys, in the order the API stores (and the UI shows) them. */
export const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

export type WeekdayKey = (typeof WEEKDAY_KEYS)[number]

/**
 * The visitor's `HH:MM` and weekday **in the business's timezone**.
 *
 * Opening hours are the shop's hours, not the visitor's, so a visitor in London
 * looking at a Kuala Lumpur business must see "open" exactly when the shop is.
 * `Intl` does the conversion; `en-GB` pins a 24-hour clock so the string
 * compares below stay lexicographic.
 */
export function localizeNow(
  timezone: string,
  now: Date = new Date()
): { day: WeekdayKey; time: string } | null {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(now)

    const lookup = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value ?? ''

    const day = lookup('weekday').slice(0, 3).toLowerCase() as WeekdayKey

    if (!WEEKDAY_KEYS.includes(day)) {
      return null
    }

    // "24" is how some ICU builds spell midnight under hour12:false.
    const hour = lookup('hour') === '24' ? '00' : lookup('hour')

    return { day, time: `${hour}:${lookup('minute')}` }
  } catch {
    // An identifier this runtime cannot resolve. The API validates the
    // timezone on write, so this is the old-browser case — treat the business
    // as reachable rather than hiding a working number behind a clock bug.
    return null
  }
}

/**
 * Is the business open right now?
 *
 * `null` means "no opinion" — hours are off, or the clock could not be read —
 * and the caller must render the widget in its normal state. Only an explicit
 * `false` shows the away message.
 */
export function isWithinBusinessHours(
  hours: WhatsAppWidget['hours'] | null | undefined,
  now: Date = new Date()
): boolean | null {
  if (!hours?.enabled) {
    return null
  }

  const localized = localizeNow(hours.timezone, now)

  if (!localized) {
    return null
  }

  return intervalsFor(hours.schedule, localized.day).some(
    // Times are zero-padded 24-hour strings, so a lexicographic compare IS a
    // chronological one — and the API drops inverted/zero-length intervals, so
    // no wrap-around case reaches here.
    (interval) => localized.time >= interval.from && localized.time < interval.to
  )
}

function intervalsFor(schedule: WhatsAppSchedule | undefined, day: WeekdayKey) {
  const intervals = schedule?.[day]
  return Array.isArray(intervals) ? intervals : []
}

/**
 * Does the widget show on this route?
 *
 * Paths are stored the way a route reports itself (leading slash, no trailing
 * one), and a trailing `*` makes a rule a prefix — "/blog*" covers every post
 * without listing them.
 */
export function matchesPageRule(
  visibility: WhatsAppWidget['visibility'] | null | undefined,
  path: string
): boolean {
  const rule = visibility?.pages

  if (!rule || rule.mode === 'all') {
    return true
  }

  const paths = Array.isArray(rule.paths) ? rule.paths : []

  // An include list nobody filled in would hide the widget everywhere, which
  // is never what switching the mode meant.
  if (paths.length === 0) {
    return true
  }

  const matched = paths.some((candidate) => matchesPath(candidate, path))

  return rule.mode === 'include' ? matched : !matched
}

function matchesPath(rule: string, path: string): boolean {
  const normalizedPath = normalizePath(path)

  if (rule.endsWith('*')) {
    const prefix = normalizePath(rule.slice(0, -1))
    return prefix === '/' || normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`)
  }

  return normalizePath(rule) === normalizedPath
}

function normalizePath(value: string): string {
  const trimmed = (value || '/').split('?')[0].split('#')[0]
  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return withLeadingSlash.length > 1 ? withLeadingSlash.replace(/\/+$/, '') || '/' : '/'
}

/**
 * The CSS a device rule needs.
 *
 * A media query rather than a JS viewport check on purpose: the widget is
 * server-rendered, and deciding this in script would either flash the wrong
 * state on hydration or force the whole widget client-only, costing the link
 * its place in the no-JS document.
 */
export function deviceVisibilityClass(
  devices: WhatsAppWidget['visibility']['devices'] | undefined
): string | null {
  if (devices === 'mobile') return 'wt-wa--mobile-only'
  if (devices === 'desktop') return 'wt-wa--desktop-only'
  return null
}

/**
 * `href` with the current page appended to its prefilled message, when the
 * owner asked for that context.
 *
 * Rebuilding the query rather than string-appending keeps a prefill that
 * already contains `&` or `#` intact — and the number itself is never touched,
 * so this cannot change who the link opens.
 */
export function withPageContext(
  href: string,
  includePageUrl: boolean,
  pageUrl: string | null | undefined
): string {
  if (!includePageUrl || !pageUrl) {
    return href
  }

  try {
    const url = new URL(href)
    const existing = url.searchParams.get('text')
    url.searchParams.set('text', existing ? `${existing}\n\n${pageUrl}` : pageUrl)
    return url.toString()
  } catch {
    return href
  }
}
