import { resolveAssetHostRedirect } from '~/lib/assetHost'

/**
 * Permanent redirect off the legacy asset host.
 *
 * The Worker holds a zone-wide route so Cloudflare for SaaS custom hostnames can
 * reach it, which means it now also intercepts `asset.myfowable.com` — an R2
 * custom domain on the same zone. Assets have moved to `asset.fowable.com` on a
 * different zone; this catches whatever still asks for the old host and sends it
 * there instead of rendering a 404 where an image should be.
 *
 * Registered ahead of the cached route handlers, same as `indexing.ts`, so it
 * answers before Nitro can serve a cached page for the request.
 */
export default defineEventHandler((event) => {
  const target = resolveAssetHostRedirect(getEventRequestHost(event), event.path)

  if (target) {
    return sendRedirect(event, target, 301)
  }
})
