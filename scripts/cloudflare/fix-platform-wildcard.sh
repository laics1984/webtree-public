#!/usr/bin/env bash
#
# Creates the two proxied DNS records the platform cannot work without:
#
#   *.myfowable.com -> A 192.0.2.0 (proxied)   tenant sites resolve
#     myfowable.com -> A 192.0.2.0 (proxied)   fallback origin can be set
#
# Independent of the numbered custom-domain flow, but a prerequisite for it.
#
# A Worker route does not create DNS. A route filters traffic that ARRIVES at the
# zone; if the hostname does not resolve, nothing ever arrives and the route is
# inert.
#
# Both records are needed, and a wildcard does not cover the second one: DNS
# wildcards never answer for their own parent name, so `*.myfowable.com`
# leaves `myfowable.com` itself unresolvable. That bare name is what
# 05-fallback-origin.sh designates as the Cloudflare for SaaS fallback origin,
# and that script refuses to run until a proxied record for it exists.
#
# 192.0.2.0 is TEST-NET-1 (RFC 5737) — reserved for documentation and never
# routable. It is never contacted: the Worker intercepts before origin
# resolution. It exists solely to make the names resolvable and give the route
# something to match.
#
# Token needs:  Zone -> DNS -> Edit   (the audit-only token has DNS: Read)

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"
require_token

PLACEHOLDER_IP="192.0.2.0"
NS="kim.ns.cloudflare.com"                # ask authoritative; skip all caching
PROBE_HOST="wildcardcheck.${PLATFORM_BASE}"

ZID=$(zone_id)
say "Zone    ${C_BLD}${ZONE_NAME}${C_OFF}  (${ZID})"

# ensure_proxied_a_record NAME PURPOSE
#
# Idempotent: creates the record if absent, flips it to proxied if it exists
# grey-clouded, and leaves a correct one untouched. Never overwrites content —
# an existing record pointing somewhere deliberate is the operator's business.
ensure_proxied_a_record() {
  local name="$1" purpose="$2"
  local query existing e_id e_type e_content e_proxied created

  head1 "Record  ${name}"

  # `*` has to be percent-encoded in the query string or the API never matches.
  query=$(printf '%s' "$name" | sed 's/\*/%2A/')
  existing=$(cf_api GET "/zones/${ZID}/dns_records?name=${query}" | jq -r '.[0] // empty')

  if [ -n "$existing" ]; then
    e_id=$(jq -r '.id' <<<"$existing")
    e_type=$(jq -r '.type' <<<"$existing")
    e_content=$(jq -r '.content' <<<"$existing")
    e_proxied=$(jq -r '.proxied' <<<"$existing")

    dim "type=${e_type}  content=${e_content}  proxied=${e_proxied}"

    if [ "$e_proxied" = "true" ]; then
      ok "Already exists and is proxied — nothing to do."
      return 0
    fi

    bad "Exists but is NOT proxied."
    dim "An unproxied record resolves to ${e_content} directly, so Cloudflare never"
    dim "sees the request and the Worker cannot run."
    confirm "Set record ${e_id} to proxied?"
    cf_api PATCH "/zones/${ZID}/dns_records/${e_id}" '{"proxied":true}' >/dev/null
    ok "Now proxied."
    return 0
  fi

  dim "No record found."
  confirm "About to create a DNS record on zone ${ZONE_NAME}:

    type:     A
    name:     ${name}
    content:  ${PLACEHOLDER_IP}   (reserved documentation address, never contacted)
    proxied:  yes

${purpose}"

  created=$(cf_api POST "/zones/${ZID}/dns_records" "$(jq -nc \
    --arg n "$name" --arg c "$PLACEHOLDER_IP" \
    '{type:"A", name:$n, content:$c, proxied:true, comment:"Placeholder so platform hostnames resolve; served by the Worker route, origin never contacted."}')")
  ok "Created (id $(jq -r '.id' <<<"$created"))"
}

# --- the two records --------------------------------------------------------

ensure_proxied_a_record "*.${PLATFORM_BASE}" \
"This makes every tenant subdomain resolvable and lets the Worker route serve
them. It cannot affect ${ASSET_HOST} or any hostname that already has its own
record — a wildcard only answers names with no explicit record."

ensure_proxied_a_record "${PLATFORM_BASE}" \
"This is the Cloudflare for SaaS fallback origin. The wildcard above does not
cover it: a DNS wildcard never answers for its own parent name. Without this
record 05-fallback-origin.sh cannot designate it, and no custom hostname on this
zone is valid."

# --- verify: do the names actually resolve now? -----------------------------

head1 "Verifying against the authoritative nameserver"
dim "Querying ${NS} directly, so no resolver cache can mislead us."

# verify_resolves HOST LABEL -- returns 1 if it never answers
verify_resolves() {
  local host="$1" label="$2" resolved="" i

  for i in $(seq 1 20); do
    resolved=$(dig +short @"$NS" "$host" 2>/dev/null | tr '\n' ' ' | sed 's/ *$//')
    [ -n "$resolved" ] && break
    printf '  %s%s: waiting (%d/20)%s\r' "$C_DIM" "$label" "$i" "$C_OFF"
    sleep 3
  done
  printf '                                             \r'

  if [ -z "$resolved" ]; then
    bad "${host} still does not resolve."
    dim "Cloudflare accepted the record but is not answering for it yet. Wait a"
    dim "minute and re-run; if it persists, check the record in the dashboard."
    return 1
  fi

  ok "${host} -> ${resolved}"

  case "$resolved" in
    *"$PLACEHOLDER_IP"*)
      bad "Resolving to the placeholder address itself — the record is NOT proxied."
      die "Set it to Proxied (orange cloud); the Worker cannot run on a grey-cloud record."
      ;;
  esac

  return 0
}

failed=0
verify_resolves "$PROBE_HOST" "wildcard" || failed=1
verify_resolves "$PLATFORM_BASE" "fallback origin" || failed=1
[ "$failed" -eq 0 ] || exit 1

ok "Both resolving to Cloudflare (proxied) — the Worker route can now match."

# --- verify: does a tenant subdomain actually serve? ------------------------

head1 "Checking a real tenant subdomain"

if [ -z "${TENANT_HOST:-}" ]; then
  dim "Set TENANT_HOST to test a real site, e.g."
  dim "  TENANT_HOST=gemj8wosnium.${PLATFORM_BASE} $0"
else
  hdrs=$(curl -sSI --max-time 20 "https://${TENANT_HOST}/" 2>/dev/null || true)
  if [ -z "$hdrs" ]; then
    bad "No response from ${TENANT_HOST}."
    dim "DNS may still be propagating to your resolver; the authoritative check above passed."
  else
    status=$(sed -n '1s/.*[[:space:]]\([0-9][0-9][0-9]\).*/\1/p' <<<"$hdrs" | head -1)
    dim "HTTP ${status}"
    if grep -qi '^x-robots-tag:.*noindex' <<<"$hdrs"; then
      ok "Worker is serving it, and correctly marking it noindex (platform subdomain)."
    else
      warn "No noindex x-robots-tag — check the Worker is handling this host."
    fi
    [ "$status" = "200" ] && ok "Site loads." || \
      dim "Non-200 may be legitimate (unpublished site); the routing itself is working."
  fi
fi

head1 "Next"
dim "Platform hostnames now resolve. Continue the custom-domain rollout:"
say "  ./01-audit.sh             inventory the zone before widening the route"
say "  ./05-fallback-origin.sh   designate ${PLATFORM_BASE} as the fallback origin"
