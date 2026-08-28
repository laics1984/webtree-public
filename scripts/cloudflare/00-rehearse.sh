#!/usr/bin/env bash
#
# Rehearsal on a throwaway hostname. Run this BEFORE anything touches
# asset.myfowable.com.
#
# Two things are assumed by the exclusion-route plan, and neither is documented
# by Cloudflare outright:
#
#   A. a Worker route DOES intercept an R2 custom domain on the same zone
#   B. a no-Worker route RESTORES that R2 serving
#
# This proves or disproves both against a disposable hostname, so no client
# asset is ever exposed to an untested mechanism. It creates and deletes only
# routes for the rehearsal host, and cleans up after itself even on failure.
#
# Usage:
#   ./00-rehearse.sh https://assettest.myfowable.com/path/to/object.jpg
#
# Prerequisite (dashboard, ~1 minute):
#   R2 -> your bucket -> Settings -> Custom Domains -> Connect Domain
#   -> assettest.myfowable.com     (any bucket with a public object works)
#
# Afterwards, remove that custom domain in the same place.

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"
require_token

URL="${1:-}"
WORKER="${WORKER_NAME:-fowable-public}"

[ -n "$URL" ] || die \
"Pass the URL of an object on a THROWAWAY R2 custom domain.

  ./00-rehearse.sh https://assettest.myfowable.com/path/to/object.jpg

Create it first in the dashboard:
  R2 -> bucket -> Settings -> Custom Domains -> Connect Domain

Do NOT point this at ${ASSET_HOST}. The whole purpose is to keep real asset
traffic away from an unproven mechanism."

REHEARSAL_HOST=$(sed -E 's#^https?://##; s#/.*##' <<<"$URL")

case "$REHEARSAL_HOST" in
  "$ASSET_HOST") die "That is the REAL asset host. Use a throwaway hostname." ;;
esac
case "$REHEARSAL_HOST" in
  *".${ZONE_NAME}") ;;
  *) die "${REHEARSAL_HOST} is not on the ${ZONE_NAME} zone; routes there would do nothing." ;;
esac

ZID=$(zone_id)
PATTERN="${REHEARSAL_HOST}/*"
CREATED_ROUTE_ID=""

# --- helpers ----------------------------------------------------------------

probe() { # -> "status|content-type|bytes"
  curl -sS -o /dev/null --max-time 20 \
    -w '%{http_code}|%{content_type}|%{size_download}' "$URL" 2>/dev/null || printf 'ERR||'
}

show() { IFS='|' read -r s c b <<<"$1"; dim "status ${s}   type ${c:-none}   bytes ${b}"; }

delete_route() {
  [ -n "$1" ] || return 0
  cf_api DELETE "/zones/${ZID}/workers/routes/$1" >/dev/null 2>&1 || true
}

# Routes take a few seconds to propagate. Poll rather than guess at a sleep.
wait_until_changes_from() {
  local from="$1" tries=0 now
  while [ "$tries" -lt 20 ]; do
    now=$(probe)
    [ "$now" != "$from" ] && { printf '%s' "$now"; return 0; }
    sleep 3; tries=$((tries + 1))
  done
  printf '%s' "$now"
  return 1
}

cleanup() {
  if [ -n "$CREATED_ROUTE_ID" ]; then
    head1 "Cleaning up"
    delete_route "$CREATED_ROUTE_ID"
    dim "Removed rehearsal route ${PATTERN}"
  fi
}
trap cleanup EXIT

# --- guard: no pre-existing route on the rehearsal host ---------------------

existing=$(cf_api GET "/zones/${ZID}/workers/routes" \
  | jq -r --arg p "$PATTERN" '[.[] | select(.pattern == $p)] | .[0].id // empty')
[ -z "$existing" ] || die "A route for ${PATTERN} already exists (id ${existing}). Remove it first."

say "Rehearsal host  ${C_BLD}${REHEARSAL_HOST}${C_OFF}"
say "Worker          ${WORKER}"
say "Real asset host ${ASSET_HOST}  ${C_DIM}(untouched by this script)${C_OFF}"

# --- phase 0: baseline ------------------------------------------------------

head1 "Phase 0 — does the rehearsal host serve from R2?"
BASE=$(probe); show "$BASE"
IFS='|' read -r b_status b_ctype b_bytes <<<"$BASE"

[ "$b_status" = "200" ] || die "Expected 200, got ${b_status}. Check the custom domain is connected and the object exists."
[ "${b_bytes:-0}" -gt 0 ] 2>/dev/null || die "Zero bytes returned; pick an object with content."
ok "Serving from R2."

# --- phase A: does a Worker route intercept R2? -----------------------------

head1 "Phase A — attach a Worker route; does it intercept?"
confirm "About to create, on zone ${ZONE_NAME}:

    pattern:  ${PATTERN}
    worker:   ${WORKER}

This affects ONLY ${REHEARSAL_HOST}. ${ASSET_HOST} is not touched.
The route is deleted again automatically when this script exits."

created=$(cf_api POST "/zones/${ZID}/workers/routes" \
  "$(jq -nc --arg p "$PATTERN" --arg s "$WORKER" '{pattern:$p, script:$s}')")
CREATED_ROUTE_ID=$(jq -r '.id' <<<"$created")
dim "Route created (${CREATED_ROUTE_ID}); waiting for propagation..."

AFTER_A=$(wait_until_changes_from "$BASE") || true
show "$AFTER_A"

if [ "$AFTER_A" = "$BASE" ]; then
  INTERCEPTS="no"
  warn "Identical to baseline — the Worker route did NOT intercept R2."
else
  INTERCEPTS="yes"
  ok "Response changed — the Worker route DID intercept R2 serving."
fi

# --- phase B: does a no-Worker route restore it? ----------------------------

head1 "Phase B — swap to a no-Worker route; does R2 come back?"

delete_route "$CREATED_ROUTE_ID"; CREATED_ROUTE_ID=""
# `script` omitted: this is what makes the route negate rather than dispatch.
created=$(cf_api POST "/zones/${ZID}/workers/routes" "$(jq -nc --arg p "$PATTERN" '{pattern:$p}')")
CREATED_ROUTE_ID=$(jq -r '.id' <<<"$created")

verify_script=$(cf_api GET "/zones/${ZID}/workers/routes/${CREATED_ROUTE_ID}" | jq -r '.script // ""')
[ -z "$verify_script" ] || die "Read back with script='${verify_script}' — expected none."
dim "No-Worker route in place (${CREATED_ROUTE_ID}); waiting for propagation..."

if [ "$INTERCEPTS" = "yes" ]; then
  AFTER_B=$(wait_until_changes_from "$AFTER_A") || true
else
  sleep 6; AFTER_B=$(probe)
fi
show "$AFTER_B"

if [ "$AFTER_B" = "$BASE" ]; then
  RESTORES="yes"; ok "Matches the original baseline — R2 serving restored."
else
  RESTORES="no";  bad "Does NOT match baseline."
fi

# --- verdict ----------------------------------------------------------------

head1 "Verdict"

if [ "$INTERCEPTS" = "yes" ] && [ "$RESTORES" = "yes" ]; then
  ok "A Worker route intercepts R2, and a no-Worker route restores it."
  say ""
  say "  ${C_GRN}BOTH ASSUMPTIONS HOLD${C_OFF} — the exclusion-route plan is sound."
  say ""
  dim "Proceed on the real host:"
  say "  ./01-audit.sh"
  say "  ./02-baseline.sh https://${ASSET_HOST}/<object>"
  say "  ./03-exclusion-route.sh"
  say "  ./04-gate.sh"
elif [ "$INTERCEPTS" = "no" ]; then
  warn "A Worker route did NOT intercept this R2 custom domain."
  say ""
  say "  ${C_YEL}INCONCLUSIVE${C_OFF}"
  say ""
  dim "Either R2 custom domains take precedence over Worker routes here, or the"
  dim "route had not propagated. Re-run once before drawing conclusions."
  dim "If it repeats, the exclusion route may be unnecessary — but do not skip it"
  dim "on this evidence alone; a */* route is broader than the route tested here."
else
  bad "A no-Worker route did NOT restore R2 serving."
  say ""
  say "  ${C_RED}THE PLAN'S ASSUMPTION FAILS${C_OFF}"
  say ""
  dim "Do not deploy a */* route — assets would break with no working exclusion."
  dim "Switch approach: serve assets from asset.fowable.com (different zone, no"
  dim "exclusion needed), or move the sites Worker onto its own zone."
  say ""
  dim "Baseline: ${BASE}"
  dim "After no-Worker route: ${AFTER_B}"
  exit 1
fi

head1 "Remember"
dim "Remove the throwaway custom domain in the dashboard:"
dim "  R2 -> bucket -> Settings -> Custom Domains -> ${REHEARSAL_HOST} -> Remove"
