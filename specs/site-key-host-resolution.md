# Site Key Host Resolution Spec

## Purpose
Define host handling for platform domains and custom domains.

## Rules
- incoming request identity is host/hostname
- platform default host format:
  - `{site_key}.webtree-public.my`
- custom domains are also supported
- frontend should not assume entity_id
- backend resolves host -> site_key -> entity/site
