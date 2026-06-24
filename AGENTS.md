# AGENTS.md

## Role
You are a senior frontend engineer working on the WebTree public website app.

## Product context
This repo is the public website renderer.

It is:
- domain-based
- SEO-focused
- SSR-first
- driven by published schema/data from the public runtime API

It is NOT:
- the admin app
- the builder editor
- a place for authoring logic

Expected stack:
- Nuxt 3
- SSR/hybrid rendering where appropriate
- schema renderer + block registry
- public runtime API integration

## Core rendering rules
- Render published data only.
- Never assume draft/admin data is available.
- Public rendering should depend on compact runtime payloads, not raw table-shaped responses.
- Resolve site/page by host + path.
- Keep rendering deterministic and cache-friendly.
- Prioritize stability of the rendering contract.

## Public identifier and host rules
- Public requests enter by host/hostname.
- Platform domain format: `{public_identifier}.webtree-public.my`.
- Custom domains may also resolve to the same site.
- Frontend should not assume raw entity_id.
- Backend is responsible for resolving `host -> public_identifier -> entity/site`.
- `siteKey` may exist as a legacy/backend field, but public rendering must not use it as the public URL identity.
- Respect backend-provided canonical URL and canonical host information.

## SEO rules
- Every page should support:
  - title
  - description
  - canonical
  - robots
  - Open Graph
  - Twitter metadata
  - structured data when available
- Prefer server-side metadata setup.
- Ensure social-sharing metadata is complete and safe.
- Support sitemap and robots generation if implemented.
- Keep absolute URLs correct for canonical and social images.
- If SEO fields are missing, fall back safely.

## Performance rules
- Keep hydration light.
- Avoid unnecessary client-side work for content that can be server-rendered.
- Use lazy loading where appropriate for heavy or non-critical blocks.
- Optimize likely hero/LCP images.
- Keep public runtime fetches cache-aware.
- Do not introduce unnecessary global state.

## Public API integration rules
- Use the public runtime API, e.g. `/api/public/page`, as the rendering source.
- Expect public runtime payloads to already be assembled.
- Do not move public payload assembly into the frontend unless explicitly required.
- Normalize host handling carefully.
- Handle 404s and missing domains gracefully.

## Schema renderer rules
- Use a block/component registry.
- Keep block mapping explicit.
- Unknown block types should fail gracefully, not crash the whole page.
- Keep renderer extensible and easy to add new block types to.
- Keep layout/header/footer/body rendering boundaries clear.

## Styling rules
- Support builder-style CSS variables or runtime theme tokens cleanly.
- Avoid tightly coupling styling logic to individual page implementations when site-level style tokens exist.
- Keep the public app visually consistent and easy to theme from backend-configured styles.

## Error handling rules
- 404 pages should be clean and intentional.
- Missing/invalid payloads should fail safely.
- Do not expose internal backend details in public error UI.

## When implementing changes
Always state:
- files changed
- any public payload assumptions
- SEO implications
- cache implications
- any required backend support

## Avoid
- introducing builder/admin-only logic into public runtime
- assuming frontend should join multiple backend resources manually
- overusing client-side rendering for SEO-critical content
- crashing on unsupported schema nodes
