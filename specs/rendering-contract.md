# Public Rendering Contract

## Purpose
Define the payload contract expected from the public API for page rendering.

## Source
GET /api/public/page?host={host}&path={path}

## Expectations
- payload is already assembled
- no frontend joining of raw backend resources
- render:
  - site/header
  - page/body
  - site/footer
- apply builder style tokens/CSS vars
- fail gracefully on unknown blocks

## Rules
- SSR-first
- published content only
- stable contract

## Site-wide chrome beyond header/footer

`site.whatsapp` (see webtree-cms-api specs/public-site-api.md) renders as a
fixed click-to-chat button, mounted in `PublicSiteShell.vue` beside the header
and footer rather than inside the page slot — it must survive a route change
without remounting.

- **Absent means absent.** The API sends `null` unless the widget is on *and*
  has a dialable number, so the component's only guard is `v-if="widget"`.
- **The renderer never formats a phone number.** Every `href` arrives built.
  `lib/whatsappWidget.ts` owns only what is local: opening hours on the
  business's clock, route rules, device gates, and appending the page URL to a
  prefill.
- **It is a real anchor.** That keeps it working pre-hydration and without JS,
  lets the platform pick app vs. web, and makes the tracking plugin's existing
  `wa.me` listener count the click as `whatsapp_click` with no extra wiring.
- **Device rules are CSS, not script**, so SSR output is correct for every
  viewport with no hydration flash.
- **Opening hours are client-only.** The server has no visitor clock, so the
  online/away treatment resolves after mount; the link is never gated on it.
- **Brand green (#25D366) is fixed, not themed** — recognition is the point,
  and white-on-green is known to clear WCAG AA at this size and weight.
- **z-index 900**: above page content and the sticky header, below the gallery
  lightbox (9999). A chat button must never cover a modal.
