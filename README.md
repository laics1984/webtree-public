# WebTree Public Site (Nuxt, site_key model)

## What this app assumes
- Public requests arrive by host/domain.
- Local platform domain pattern is `{site_key}.public.localhost:3000`.
- Production platform domain pattern stays configurable through `NUXT_PUBLIC_PLATFORM_BASE_DOMAIN`.
- Public API endpoints:
  - `GET /api/public/page?host={host}&path={path}`
  - `GET /api/public/site?host={host}`
  - `GET /api/public/routes?host={host}`
- The backend resolves `host` to `site_key` and entity internally.

## Local development
Use the same platform base-domain on both apps:
- `webtree-cms-api`: `PUBLIC_PLATFORM_BASE_DOMAIN=public.localhost:3000`
- `webtree-public`:
  - `NUXT_PUBLIC_API_BASE=http://public-api.localhost`
  - `NUXT_PUBLIC_PLATFORM_BASE_DOMAIN=public.localhost:3000`
  - `NUXT_PUBLIC_SITE_PROTOCOL=http`
  - `NUXT_DEV_HOST=0.0.0.0`
  - `NUXT_DEV_PORT=3000`

Then run `npm run dev` and open `http://[site_key].public.localhost:3000`.

## Why host is still used
Browsers and CDNs route by host, not by entity ID. The app sends the current host to the public API and the backend resolves:
- `site_key` (public-safe identity)
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
- `entity.siteKey` is the public-safe site identity and is always present.
- `entity.resolvedHost` is always present and is safe as the backend-resolved host fallback.
- `entity.canonicalHost` is optional and should be preferred for non-local canonical domains.
- `site.headerSchema`, `page.bodySchema`, and `site.footerSchema` are already assembled renderer payloads.
- `site.defaults` carries site-level SEO defaults such as title suffix, descriptions, OG image, Twitter card, and JSON-LD.

## Local host behavior
When `NUXT_PUBLIC_PLATFORM_BASE_DOMAIN` points at a `.localhost` platform host, the app preserves the incoming request host for canonical, sitemap, and robots URLs. That keeps local testing stable on `site_key.public.localhost:3000` even if the backend also knows about a separate fallback identifier.

## Run
```bash
npm install
npm run dev
```
