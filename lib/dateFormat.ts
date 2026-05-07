const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export function formatDate(value?: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const diffMs = Date.now() - date.getTime()
  if (diffMs >= 0 && diffMs < WEEK_MS) {
    const minutes = Math.floor(diffMs / 60000)
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
    const days = Math.floor(hours / 24)
    return `${days} ${days === 1 ? 'day' : 'days'} ago`
  }

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatRange(start?: string | null, end?: string | null): string {
  const startLabel = formatDate(start)
  const endLabel = formatDate(end)
  if (startLabel && endLabel && startLabel !== endLabel) {
    return `${startLabel} – ${endLabel}`
  }
  return startLabel || endLabel
}
