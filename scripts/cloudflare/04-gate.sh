#!/usr/bin/env bash
#
# READ ONLY. The blocking gate.
#
# Compares asset serving against the 02 baseline. Run it twice:
#
#   after 03  (exclusion route exists, */* does not)  -> should pass trivially
#   after the */* route is deployed                   -> the one that matters
#
# Route specificity and no-Worker negation are both documented by Cloudflare.
# That a no-Worker exclusion cleanly restores *R2 custom domain* serving is an
# inference, not something Cloudflare states outright. This is where that
# inference gets tested, before every image on every client site depends on it.

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"
need_state "${STATE_DIR}/asset-baseline.txt" "./02-baseline.sh"

BASELINE="${STATE_DIR}/asset-baseline.txt"

# Read, never source: a content-type such as "text/html; charset=utf-8" would
# have its ';' parsed as a command separator.
state_get() { sed -n "s/^$1=//p" "$BASELINE"; }

url=$(state_get url)
status=$(state_get status)
ctype=$(state_get ctype)
bytes=$(state_get bytes)
taken=$(state_get taken)

[ -n "$url" ] || die "Baseline file is malformed. Delete .state/ and re-run ./02-baseline.sh."

head1 "Baseline"
dim "url    ${url}"
dim "taken  ${taken}"
dim "status ${status}   type ${ctype}   bytes ${bytes}"

head1 "Now"

IFS='|' read -r now_status now_ctype now_bytes < <(
  curl -sS -o /dev/null --max-time 20 \
    -w '%{http_code}|%{content_type}|%{size_download}\n' "$url"
) || die "Request failed outright — assets are down. Remove the */* route now."

dim "status ${now_status}   type ${now_ctype}   bytes ${now_bytes}"

head1 "Result"

fail=0
[ "$now_status" = "$status" ] || { bad "status ${status} -> ${now_status}"; fail=1; }
[ "$now_ctype"  = "$ctype"  ] || { bad "content-type ${ctype} -> ${now_ctype}"; fail=1; }
[ "$now_bytes"  = "$bytes"  ] || { bad "size ${bytes} -> ${now_bytes} bytes"; fail=1; }

# The Worker sets this on every response it serves. Its presence here would mean
# the Worker answered for an asset — exactly what the exclusion must prevent.
hdrs=$(curl -sS -I --max-time 20 "$url" 2>/dev/null || true)
if grep -qi '^x-robots-tag:' <<<"$hdrs"; then
  bad "x-robots-tag present — the Worker answered this request."
  fail=1
fi

say ""
if [ "$fail" -eq 0 ]; then
  ok "Assets serve identically to the baseline."
  say ""
  say "  ${C_GRN}GATE PASSED${C_OFF}"
  head1 "Next"
  dim "If the */* route is NOT yet deployed:"
  say "  1. Set wrangler.jsonc routes to  { \"pattern\": \"*/*\", \"zone_name\": \"${ZONE_NAME}\" }"
  say "  2. Deploy, then run this script again — that run is the one that counts."
  dim ""
  dim "If */* IS already live and this passed: the exclusion holds. Part 2 can begin."
else
  say "  ${C_RED}GATE FAILED${C_OFF}"
  head1 "Do this now"
  say "  1. Remove the */* Worker route to restore asset serving immediately."
  say "  2. Re-run this script to confirm assets recovered."
  say "  3. Switch approach: serve assets from asset.fowable.com (different zone,"
  say "     no exclusion mechanism needed) or move the sites Worker to its own zone."
  dim ""
  dim "Do not start Part 2 on a routing model that does not hold."
  exit 1
fi
