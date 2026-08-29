# WebTree Public Site (Nuxt, public identifier model)

## What this app assumes
- Public requests arrive by host/domain.
- Local platform domain pattern is `{public_identifier}.localhost:3000`.
- Production platform domain pattern stays configurable through `NUXT_PUBLIC_PLATFORM_BASE_DOMAIN`.
- Public API endpoints:
  - `GET /api/public/page?host={host}&path={path}`
  - `GET /api/public/site?host={host}`
  - `GET /api/public/routes?host={host}`
- The backend resolves `host` to `public_identifier` and entity internally.

## Local development
Use the same platform base-domain on both apps:
- `webtree-cms-api`: `PUBLIC_PLATFORM_BASE_DOMAIN=localhost:3000`
- `webtree-public`:
  - `NUXT_PUBLIC_API_BASE=http://public-api.localhost`
  - `NUXT_PUBLIC_PLATFORM_BASE_DOMAIN=localhost:3000`
  - `NUXT_PUBLIC_SITE_PROTOCOL=http`
  - `NUXT_DEV_HOST=0.0.0.0`
  - `NUXT_DEV_PORT=3000`

Then run `npm run dev` and open `http://[public_identifier].localhost:3000`.

## Why host is still used
Browsers and CDNs route by host, not by entity ID. The app sends the current host to the public API and the backend resolves:
- `public_identifier` (public-safe identity from the entities table)
- `entity_id` (internal DB identity)

## Features included
- Nuxt 3 SSR public renderer
- dynamic SEO / canonical / OG / Twitter tags
- JSON-LD support
- `robots.txt`
- `sitemap.xml`
- simple schema renderer with block registry
- builder style CSS variable support
- graceful handling for unknown blocks

## Backend payload assumptions
- `GET /api/public/page?host={host}&path={path}` returns `{ entity, site, page }`.
- `GET /api/public/site?host={host}` returns `{ entity, site }`.
- `GET /api/public/routes?host={host}` returns route metadata for the resolved public host.
- `entity.publicIdentifier` is the public-safe site identity and is always present.
- `entity.siteKey` may be present for legacy/backend compatibility, but the public app does not use it as the URL identity.
- `entity.resolvedHost` is always present and is safe as the backend-resolved host fallback.
- `entity.canonicalHost` is optional and should be preferred for non-local canonical domains.
- `site.headerSchema`, `page.bodySchema`, and `site.footerSchema` are already assembled renderer payloads.
- `site.defaults` carries site-level SEO defaults such as title suffix, descriptions, OG image, Twitter card, and JSON-LD.

## Production routing (Cloudflare)

`wrangler.jsonc` holds a **zone-wide** route: `*/*` on `myfowable.com`. It has to
be that broad. Worker routes match the request URL, and a Cloudflare for SaaS
custom hostname arrives under the *client's* domain — `clientdomain.com`, which
no `*.myfowable.com/*` pattern can ever match.

Two consequences worth knowing before touching the zone:

1. **Every proxied hostname on `myfowable.com` is served by this Worker.** Adding
   one that needs a different origin — an R2 custom domain, a redirect, another
   service — will silently start returning this app instead. Put it on a
   different zone, or run `scripts/cloudflare/01-audit.sh` first and think hard.
   This is why assets live on `asset.fowable.com` (the `fowable.com` zone) rather
   than `asset.myfowable.com`; `server/middleware/assetHost.ts` 301s the old host
   so cached and hard-coded URLs keep working.
2. **A CNAME alone does not connect a client domain.** DNS gets the request to
   Cloudflare; *registration* as a custom hostname is what tells Cloudflare this
   zone should serve it. Without it the visitor gets Error 1014. The API
   registers them automatically (`EntityDomainService` →
   `DomainConnectionReconciler` in `webtree-cms-api`); the zone-level
   prerequisites are set up by the scripts in
   [`scripts/cloudflare/`](scripts/cloudflare/).

## Indexing policy

Platform preview hosts (`*.myfowable.com`) are never indexed; client
custom domains are. One predicate — `isIndexableHost` in [`lib/indexing.ts`](lib/indexing.ts) —
drives all four layers: the `X-Robots-Tag` header in
[`server/middleware/indexing.ts`](server/middleware/indexing.ts), the `robots`
meta tag, canonical URLs, and `robots.txt` / `sitemap.xml`. AI crawlers, which
ignore `noindex`, are blocked by `Disallow` on preview hosts instead.

## Local host behavior
When `NUXT_PUBLIC_PLATFORM_BASE_DOMAIN` points at a `.localhost` platform host, the app preserves the incoming request host for canonical, sitemap, and robots URLs. That keeps local testing stable on `public_identifier.localhost:3000` even if the backend also knows about a separate fallback identifier.

## Run
```bash
npm install
npm run dev
```
