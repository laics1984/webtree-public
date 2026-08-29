import { normalizeHostname } from '~/lib/host'

/**
 * Where the legacy asset host has to send people now.
 *
 * Assets used to be served from `asset.myfowable.com`, an R2 custom domain on
 * the same Cloudflare zone as this Worker. Cloudflare for SaaS needs the Worker
 * route widened to a zone-wide pattern so it can match client custom domains,
 * and a route takes precedence over an R2 custom domain on the same hostname —
 * so that one change would have handed every image request to the Worker
 * instead of the bucket.
 *
 * Assets therefore moved to `asset.fowable.com`, which sits on the *fowable.com*
 * zone and is out of reach of a `myfowable.com` route entirely. New URLs are
 * built from that host at request time (`AWS_URL` on the API,
 * `VITE_ASSET_PUBLIC_URL` in the admin app), so this redirect exists for what is
 * already out there: CDN caches, bookmarks, and anything that hard-coded the old
 * host before the move.
 *
 * 301 rather than 302: the move is permanent, and letting caches and crawlers
 * remember it is the point.
 */
export const LEGACY_ASSET_HOST = 'asset.myfowable.com'
export const ASSET_HOST = 'asset.fowable.com'

/**
 * The absolute URL a request should be redirected to, or null to let it through.
 *
 * Only the host changes — path and query are carried across untouched, because
 * the two hostnames front the same bucket and every object key is identical.
 *
 * `requestPath` is taken as the already-encoded request target (h3 gives us
 * `event.path`), so it is concatenated rather than re-encoded: re-encoding would
 * double-escape keys that legitimately contain `%20` or `%2F`.
 */
export function resolveAssetHostRedirect(
  requestHost?: string | null,
  requestPath?: string | null,
  legacyHost: string = LEGACY_ASSET_HOST,
  targetHost: string = ASSET_HOST
): string | null {
  const from = normalizeHostname(legacyHost)
  const to = normalizeHostname(targetHost)

  // A misconfigured pair must not send traffic to itself, or to nowhere.
  if (!from || !to || from === to) {
    return null
  }

  if (normalizeHostname(requestHost) !== from) {
    return null
  }

  const path = typeof requestPath === 'string' && requestPath.startsWith('/') ? requestPath : '/'

  return `https://${to}${path}`
}
