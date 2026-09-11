const WEEK_MS = 7 * 24 * 60 * 60 * 1000

/** "Sep 10, 2026" — a fixed locale and zone, so every renderer prints the same. */
const DAY_LABEL = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
})

const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})/

/**
 * The calendar day a timestamp names, as "Sep 10, 2026".
 *
 * Read from the ISO string itself — the day in the offset the API wrote it
 * with — rather than converted into the clock of whoever renders it. The
 * server, the hydrating browser and every cached copy therefore print the same
 * day. `toLocaleDateString(undefined)` used to take the renderer's own locale
 * and timezone, so the server and a reader's browser could disagree on both.
 */
function absoluteDay(value: string, time: number): string {
  const day = ISO_DAY.exec(value)

  return DAY_LABEL.format(day ? Date.UTC(Number(day[1]), Number(day[2]) - 1, Number(day[3])) : time)
}

function relativeLabel(diffMs: number): string {
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  const days = Math.floor(hours / 24)
  return `${days} ${days === 1 ? 'day' : 'days'} ago`
}

/**
 * A timestamp as a reader-facing label, or '' when there is none.
 *
 * Absolute unless `now` — the reader's clock — is given. "3 hours ago" depends
 * on when the page is read, so it is only produced after hydration (see
 * useHydratedNow) and never baked into server-rendered or cached HTML. Given
 * `now`, a date within the past week reads relatively, as the builder canvas
 * shows it.
 */
export function formatDate(value?: string | null, now?: number | null): string {
  if (!value) return ''
  const time = new Date(value).getTime()
  if (Number.isNaN(time)) return ''

  if (now != null) {
    const diffMs = now - time
    if (diffMs >= 0 && diffMs < WEEK_MS) return relativeLabel(diffMs)
  }

  return absoluteDay(value, time)
}

export function formatRange(
  start?: string | null,
  end?: string | null,
  now?: number | null
): string {
  const startLabel = formatDate(start, now)
  const endLabel = formatDate(end, now)
  if (startLabel && endLabel && startLabel !== endLabel) {
    return `${startLabel} – ${endLabel}`
  }
  return startLabel || endLabel
}
