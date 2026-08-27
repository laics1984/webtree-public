#!/usr/bin/env bash
#
# MUTATES. Creates the no-Worker route that keeps asset traffic on R2 once a
# zone-wide */* route exists.
#
#   asset.myfowable.com/*  ->  (no Worker)   negates less specific patterns
#
# Cloudflare: "A route can be specified without being associated with a Worker.
# This will act to negate any less specific patterns." Omitting `script` on
# POST /zones/{id}/workers/routes is how that is expressed via the API.
#
# Idempotent: an existing correct route is left alone. Reads the route back
# after writing and verifies it, rather than trusting the write.

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"
require_token
need_state "${STATE_DIR}/asset-baseline.txt" "./02-baseline.sh"

ZID=$(zone_id)
PATTERN="${ASSET_HOST}/*"

head1 "Checking existing routes"

routes=$(cf_api GET "/zones/${ZID}/workers/routes")
existing=$(jq -r --arg p "$PATTERN" '[.[] | select(.pattern == $p)] | .[0] // empty' <<<"$routes")

if [ -n "$existing" ]; then
  script=$(jq -r '.script // ""' <<<"$existing")
  if [ -z "$script" ]; then
    ok "${PATTERN} already exists with no Worker — nothing to do."
    head1 "Next"
    say "  ./04-gate.sh    confirm assets still serve, then deploy the */* route"
    exit 0
  fi
  bad "${PATTERN} exists but is bound to Worker '${script}'."
  die "Remove or repoint that route by hand first — this script will not overwrite it."
fi

dim "No route for ${PATTERN} yet."

confirm "About to create a Worker route on zone ${ZONE_NAME}:

    pattern:  ${PATTERN}
    worker:   (none — negates less specific patterns)

This does not change how ${ASSET_HOST} serves today; it reserves the pattern so
that a later */* route cannot capture it. Safe to run before */* exists."

head1 "Creating route"

# `script` deliberately omitted: that is what makes this a negating route.
created=$(cf_api POST "/zones/${ZID}/workers/routes" "$(jq -nc --arg p "$PATTERN" '{pattern:$p}')")
route_id=$(jq -r '.id' <<<"$created")
ok "Created (id ${route_id})"

head1 "Reading it back"

verify=$(cf_api GET "/zones/${ZID}/workers/routes/${route_id}")
v_pattern=$(jq -r '.pattern' <<<"$verify")
v_script=$(jq -r '.script // ""' <<<"$verify")

[ "$v_pattern" = "$PATTERN" ] || die "Read back an unexpected pattern: ${v_pattern}"
if [ -n "$v_script" ]; then
  bad "Read back with script='${v_script}' — it should have none."
  die "Delete route ${route_id} and investigate before going further."
fi
ok "pattern=${v_pattern}  worker=(none)"

printf 'route_id=%s\npattern=%s\n' "$route_id" "$PATTERN" > "${STATE_DIR}/exclusion-route.txt"

head1 "Next"
say "  ./04-gate.sh    verify assets still serve identically"
dim ""
dim "The gate is the real test. Route config looking right is not proof that R2"
dim "still serves through it."
