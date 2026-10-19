/**
 * The status code behind a failed `$fetch`.
 *
 * `$fetch` rejects with an FetchError whose status can sit at the top level or
 * one level down in `data`, depending on whether the response came from the
 * upstream API or from a Nitro handler that re-threw it. Both shapes turn up in
 * this app, so the check has to cover both.
 *
 * Defaults to 500 — an unreadable error is our problem, not a missing resource,
 * and treating it as a 404 would let a transient API failure be reported to a
 * visitor as "this does not exist".
 */
export function getErrorStatusCode(error: unknown): number {
  if (!error || typeof error !== 'object') {
    return 500
  }

  const statusCode = 'statusCode' in error ? Number(error.statusCode) : NaN
  if (!Number.isNaN(statusCode) && statusCode > 0) {
    return statusCode
  }

  if ('data' in error && error.data && typeof error.data === 'object' && 'statusCode' in error.data) {
    const nestedStatusCode = Number(error.data.statusCode)
    if (!Number.isNaN(nestedStatusCode) && nestedStatusCode > 0) {
      return nestedStatusCode
    }
  }

  return 500
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

/**
 * The upstream resolver's `kind`, wherever the failed `$fetch` left it.
 *
 * `/api/public/resolve` answers an unresolvable path with 404 + `{"kind":
 * "notFound"}`. SSR calls the API directly, so that body lands on `data`; a
 * client-side call goes through the Nitro proxy, whose own envelope can nest
 * the upstream body one level further down. Neither depth is guaranteed, which
 * is why nothing may depend on just one of them.
 */
export function getUpstreamErrorKind(error: unknown): string | null {
  const data = readRecord(readRecord(error)?.data)

  if (!data) {
    return null
  }

  const candidates = [data.kind, readRecord(data.data)?.kind]

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate
    }
  }

  return null
}

/**
 * Whether a failed `$fetch` means "this does not exist".
 *
 * The status code leads: it is present on every shape the app sees, and an
 * upstream 404 is a 404 whatever the body says. The resolver's `notFound` kind
 * is accepted as a second, independent signal so a proxy that rewrites the
 * status cannot turn a missing page into a server error.
 *
 * Everything else — a timeout, a cold API, an unreadable error — stays a
 * failure, because serving a 404 for those would invite search engines to drop
 * live URLs over a transient outage.
 */
export function isNotFoundError(error: unknown): boolean {
  return getErrorStatusCode(error) === 404 || getUpstreamErrorKind(error) === 'notFound'
}
