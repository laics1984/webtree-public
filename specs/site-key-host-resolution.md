# Public Identifier Host Resolution Spec

## Purpose
Define host handling for platform domains and custom domains.

## Rules
- incoming request identity is host/hostname
- platform default host format:
  - `{public_identifier}.webtree-public.my`
- custom domains are also supported
- frontend should not assume entity_id
- backend resolves host -> public_identifier -> entity/site
- `siteKey` may remain in backend payloads for compatibility, but it is not the public URL identity
