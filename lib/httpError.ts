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
