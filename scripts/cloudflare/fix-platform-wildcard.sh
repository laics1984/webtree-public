#!/usr/bin/env bash
#
# Creates the proxied wildcard DNS record that makes tenant platform subdomains
# resolvable:  *.public.myfowable.com -> A 192.0.2.0 (proxied)
#
# Independent of the numbered custom-domain flow — this fixes a separate, live
# problem: without this record no tenant site is reachable on its platform
# subdomain at all.
#
# A Worker route does not create DNS. The route `*.public.myfowable.com/*`
# filters traffic that ARRIVES at the zone; if the hostname does not resolve,
# nothing ever arrives and the route is inert.
#
# 192.0.2.0 is TEST-NET-1 (RFC 5737) — reserved for documentation and never
# routable. It is never contacted: the Worker intercepts before origin
# resolution. It exists solely to make the name resolvable and give the route
# something to match.
#
# Token needs:  Zone -> DNS -> Edit   (the audit-only token has DNS: Read)

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"
require_token

RECORD_NAME="*.${PLATFORM_BASE}"          # *.public.myfowable.com
PLACEHOLDER_IP="192.0.2.0"
NS="kim.ns.cloudflare.com"                # ask authoritative; skip all caching
PROBE_HOST="wildcardcheck.${PLATFORM_BASE}"

ZID=$(zone_id)
say "Zone    ${C_BLD}${ZONE_NAME}${C_OFF}  (${ZID})"
say "Record  ${RECORD_NAME}"

# --- current state ----------------------------------------------------------

head1 "Checking for an existing record"

existing=$(cf_api GET "/zones/${ZID}/dns_records?name=$(printf '%s' "$RECORD_NAME" | sed 's/\*/%2A/')" \
  | jq -r '.[0] // empty')

if [ -n "$existing" ]; then
  e_id=$(jq -r '.id' <<<"$existing")
  e_type=$(jq -r '.type' <<<"$existing")
  e_content=$(jq -r '.content' <<<"$existing")
  e_proxied=$(jq -r '.proxied' <<<"$existing")

  dim "type=${e_type}  content=${e_content}  proxied=${e_proxied}"

  if [ "$e_proxied" = "true" ]; then
    ok "Already exists and is proxied — nothing to create."
    dim "If tenant subdomains still fail, the cause is elsewhere; run ./01-audit.sh."
  else
    bad "Exists but is NOT proxied."
    dim "An unproxied record resolves to ${e_content} directly, so Cloudflare never"
    dim "sees the request and the Worker cannot run."
    confirm "Set record ${e_id} to proxied?"
    cf_api PATCH "/zones/${ZID}/dns_records/${e_id}" '{"proxied":true}' >/dev/null
    ok "Now proxied."
  fi
else
  dim "No record found."
  confirm "About to create a DNS record on zone ${ZONE_NAME}:

    type:     A
    name:     ${RECORD_NAME}
    content:  ${PLACEHOLDER_IP}   (reserved documentation address, never contacted)
    proxied:  yes

This makes every tenant subdomain resolvable and lets the existing Worker route
serve them. It cannot affect ${ASSET_HOST} or any hostname that already has its
own record — a wildcard only answers names with no explicit record."

  created=$(cf_api POST "/zones/${ZID}/dns_records" "$(jq -nc \
    --arg n "$RECORD_NAME" --arg c "$PLACEHOLDER_IP" \
    '{type:"A", name:$n, content:$c, proxied:true, comment:"Placeholder so tenant platform subdomains resolve; served by the Worker route, origin never contacted."}')")
  ok "Created (id $(jq -r '.id' <<<"$created"))"
fi

# --- verify: does the name actually resolve now? ----------------------------

head1 "Verifying against the authoritative nameserver"
dim "Querying ${NS} directly, so no resolver cache can mislead us."

resolved=""
for i in $(seq 1 20); do
  resolved=$(dig +short @"$NS" "$PROBE_HOST" 2>/dev/null | tr '\n' ' ' | sed 's/ *$//')
  [ -n "$resolved" ] && break
  printf '  %swaiting (%d/20)%s\r' "$C_DIM" "$i" "$C_OFF"
  sleep 3
done
printf '                                   \r'

if [ -z "$resolved" ]; then
  bad "${PROBE_HOST} still does not resolve."
  dim "Cloudflare accepted the record but is not answering for it yet. Wait a"
  dim "minute and re-run; if it persists, check the record in the dashboard."
  exit 1
fi
ok "${PROBE_HOST} -> ${resolved}"

case "$resolved" in
  *"$PLACEHOLDER_IP"*)
    bad "Resolving to the placeholder address itself — the record is NOT proxied."
    die "Set it to Proxied (orange cloud); the Worker cannot run on a grey-cloud record."
    ;;
esac
ok "Resolving to Cloudflare (proxied) — the Worker route can now match."

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
dim "Tenant platform subdomains should now work. The custom-domain rollout is a"
dim "separate track:"
say "  ./01-audit.sh      inventory the zone"
say "  ./00-rehearse.sh   prove the R2 exclusion mechanism safely"
