#!/usr/bin/env bash
#
# MUTATES. Designates public.myfowable.com as the Cloudflare for SaaS fallback
# origin — where traffic for registered custom hostnames is sent.
#
# With a Worker serving the zone the origin is never actually contacted: the
# Worker intercepts before origin resolution. The setting still has to exist for
# custom hostnames to be valid.
#
# Run after the gate passes. Setting a fallback origin does not by itself route
# any traffic — no custom hostnames exist yet.

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"
require_token

ZID=$(zone_id)

head1 "Current fallback origin"

current=$(curl -sS "${CF_API}/zones/${ZID}/custom_hostnames/fallback_origin" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}")

if [ "$(jq -r '.success' <<<"$current")" = "true" ]; then
  cur_origin=$(jq -r '.result.origin // empty' <<<"$current")
  cur_status=$(jq -r '.result.status // "unknown"' <<<"$current")
  if [ "$cur_origin" = "$PLATFORM_BASE" ]; then
    ok "Already set to ${cur_origin} (${cur_status})"
    [ "$cur_status" = "active" ] && exit 0
    warn "Not yet active — Cloudflare is still provisioning. Re-run 01-audit.sh later."
    exit 0
  fi
  dim "${cur_origin:-(none set)}"
else
  warn "Could not read the current value."
  dim "Cloudflare for SaaS may not be enabled on this account, or the token lacks"
  dim "'SSL and Certificates: Edit'. Enable it in the dashboard before continuing."
  jq -r '.errors[]? | "  [\(.code)] \(.message)"' <<<"$current" >&2 || true
  exit 1
fi

# The target must be proxied, or Cloudflare cannot terminate TLS for custom
# hostnames pointed at it.
head1 "Checking ${PLATFORM_BASE} is proxied"
rec=$(cf_api GET "/zones/${ZID}/dns_records?name=${PLATFORM_BASE}" | jq -r '.[0] // empty')
[ -n "$rec" ] || die "${PLATFORM_BASE} has no DNS record on this zone."
[ "$(jq -r '.proxied' <<<"$rec")" = "true" ] || die "${PLATFORM_BASE} exists but is not proxied."
ok "proxied"

confirm "About to set the fallback origin for zone ${ZONE_NAME} to:

    ${PLATFORM_BASE}

No custom hostnames are registered yet, so this routes no traffic on its own."

head1 "Setting fallback origin"

result=$(cf_api PUT "/zones/${ZID}/custom_hostnames/fallback_origin" \
  "$(jq -nc --arg o "$PLATFORM_BASE" '{origin:$o}')")

ok "origin=$(jq -r '.origin' <<<"$result")  status=$(jq -r '.status' <<<"$result")"

head1 "Next"
dim "Provisioning takes a few minutes. Re-run ./01-audit.sh until section 5 reads"
dim "'active', then register one throwaway custom hostname by hand and confirm the"
dim "Worker serves it over HTTPS before any backend work begins."
