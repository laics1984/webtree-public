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
