#!/usr/bin/env bash
#
# READ ONLY. Inventories everything a zone-wide Worker route would affect.
#
# A `*/*` route captures every proxied hostname on the zone. This lists them so
# each one can be accounted for before that route exists, rather than discovered
# afterwards by something breaking.

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"
require_token

ZID=$(zone_id)
say "Zone ${C_BLD}${ZONE_NAME}${C_OFF}  (${ZID})"

# --- 1. proxied hostnames ---------------------------------------------------

head1 "1. Proxied hostnames on this zone"
dim "Every one of these is captured by a */* route unless excluded."

records=$(cf_api GET "/zones/${ZID}/dns_records?per_page=500")
proxied=$(jq -r '[.[] | select(.proxied)] | sort_by(.name)' <<<"$records")
count=$(jq 'length' <<<"$proxied")

if [ "$count" -eq 0 ]; then
  warn "No proxied records found — unexpected for a zone serving traffic."
else
  printf '\n  %-42s %-7s %s\n' "NAME" "TYPE" "CONTENT"
  printf '  %-42s %-7s %s\n' "------------------------------------------" "-------" "-------------------"
  jq -r '.[] | "  \(.name)\t\(.type)\t\(.content)"' <<<"$proxied" \
    | awk -F'\t' '{printf "  %-42s %-7s %s\n", $1, $2, $3}'
  say ""
  dim "${count} proxied hostname(s). Each must either belong on the Worker or have"
  dim "an exclusion route. asset.myfowable.com is known — check for others above."
fi

# --- 2. existing worker routes ----------------------------------------------

head1 "2. Worker routes already on this zone"

routes=$(cf_api GET "/zones/${ZID}/workers/routes")
if [ "$(jq 'length' <<<"$routes")" -eq 0 ]; then
  dim "(none)"
else
  printf '\n  %-42s %s\n' "PATTERN" "WORKER"
  printf '  %-42s %s\n' "------------------------------------------" "-------------------"
  jq -r '.[] | "  \(.pattern)\t\(.script // "(none — negates less specific patterns)")"' <<<"$routes" \
    | awk -F'\t' '{printf "  %-42s %s\n", $1, $2}'
fi

# --- 3. the platform base host ----------------------------------------------

head1 "3. CNAME target: ${PLATFORM_BASE}"

base_rec=$(jq -r --arg n "$PLATFORM_BASE" '[.[] | select(.name == $n)] | .[0] // empty' <<<"$records")
if [ -z "$base_rec" ]; then
  bad "No DNS record — clients cannot CNAME here."
elif [ "$(jq -r '.proxied' <<<"$base_rec")" = "true" ]; then
  ok "Exists and is proxied — valid as the fallback origin and CNAME target."
else
  bad "Exists but is NOT proxied. It must be proxied to serve custom hostnames."
fi

# --- 4. wildcard for platform subdomains (plan fact B) ----------------------

head1 "4. Wildcard record for tenant subdomains"
dim "Plan fact B: if tenant subdomains do not resolve, today's DNS instructions"
dim "point clients at a dead name."

wildcard=$(jq -r --arg n "*.${PLATFORM_BASE}" '[.[] | select(.name == $n)] | .[0] // empty' <<<"$records")
if [ -n "$wildcard" ]; then
  ok "*.${PLATFORM_BASE} exists (proxied=$(jq -r '.proxied' <<<"$wildcard"))."
else
  warn "No *.${PLATFORM_BASE} record."
  dim "Tenant subdomains then only work if each has its own record. Confirm with a"
  dim "REAL tenant identifier — 'acme'/'test' are placeholders and prove nothing:"
  dim ""
  dim "    dig +short <real-public-identifier>.${PLATFORM_BASE}"
  dim ""
  dim "Empty result => add *.${PLATFORM_BASE} -> A 192.0.2.0, Proxied."
fi

# --- 5. fallback origin -----------------------------------------------------

head1 "5. Cloudflare for SaaS fallback origin"

fb=$(curl -sS "${CF_API}/zones/${ZID}/custom_hostnames/fallback_origin" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}")
if [ "$(jq -r '.success' <<<"$fb")" = "true" ]; then
  origin=$(jq -r '.result.origin // empty' <<<"$fb")
  status=$(jq -r '.result.status // "unknown"' <<<"$fb")
  if [ -z "$origin" ]; then
    warn "Not configured yet — run 05-fallback-origin.sh."
  elif [ "$origin" = "$PLATFORM_BASE" ] && [ "$status" = "active" ]; then
    ok "${origin} (${status})"
  else
    warn "origin=${origin:-none} status=${status}"
  fi
else
  warn "Could not read it — the token may lack 'SSL and Certificates: Edit',"
  dim "or Cloudflare for SaaS is not enabled on this account yet."
fi

head1 "Next"
dim "If the hostname list above holds anything besides the sites Worker and"
dim "${ASSET_HOST}, stop and account for it before continuing."
say ""
say "  ./02-baseline.sh   capture how assets serve today (do this BEFORE any change)"
