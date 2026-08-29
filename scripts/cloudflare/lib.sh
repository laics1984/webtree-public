#!/usr/bin/env bash
# Shared helpers for the Cloudflare custom-domain setup scripts.
# Sourced by the numbered scripts; not meant to be run directly.

set -euo pipefail

CF_API="https://api.cloudflare.com/client/v4"

# Hostnames this platform depends on. Override via env if they ever change.
ZONE_NAME="${ZONE_NAME:-myfowable.com}"
PLATFORM_BASE="${PLATFORM_BASE:-myfowable.com}"
ASSET_HOST="${ASSET_HOST:-asset.myfowable.com}"

STATE_DIR="${STATE_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.state}"

# --- output -----------------------------------------------------------------

if [ -t 1 ]; then
  C_DIM=$'\033[2m'; C_RED=$'\033[31m'; C_GRN=$'\033[32m'
  C_YEL=$'\033[33m'; C_BLD=$'\033[1m';  C_OFF=$'\033[0m'
else
  C_DIM=''; C_RED=''; C_GRN=''; C_YEL=''; C_BLD=''; C_OFF=''
fi

say()  { printf '%s\n' "$*"; }
head1(){ printf '\n%s%s%s\n' "$C_BLD" "$*" "$C_OFF"; }
ok()   { printf '  %sPASS%s  %s\n' "$C_GRN" "$C_OFF" "$*"; }
warn() { printf '  %sWARN%s  %s\n' "$C_YEL" "$C_OFF" "$*"; }
bad()  { printf '  %sFAIL%s  %s\n' "$C_RED" "$C_OFF" "$*"; }
dim()  { printf '  %s%s%s\n' "$C_DIM" "$*" "$C_OFF"; }
die()  { printf '\n%sError:%s %s\n' "$C_RED" "$C_OFF" "$*" >&2; exit 1; }

# --- auth -------------------------------------------------------------------

require_token() {
  [ -n "${CLOUDFLARE_API_TOKEN:-}" ] || die \
"CLOUDFLARE_API_TOKEN is not set.

Create a token at https://dash.cloudflare.com/profile/api-tokens with these
permissions, scoped to the ${ZONE_NAME} zone only:

  Zone -> DNS                    -> Read
  Zone -> Workers Routes         -> Edit
  Zone -> SSL and Certificates   -> Edit

Then:  export CLOUDFLARE_API_TOKEN='...'

The token is never printed or written to disk by these scripts."
}

# cf_api METHOD PATH [JSON_BODY] -- returns the .result on success, dies otherwise.
# The token is passed via a header and never appears in output or error text.
cf_api() {
  local method="$1" path="$2" body="${3:-}" resp
  if [ -n "$body" ]; then
    resp=$(curl -sS -X "$method" "${CF_API}${path}" \
      -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
      -H "Content-Type: application/json" \
      --data "$body")
  else
    resp=$(curl -sS -X "$method" "${CF_API}${path}" \
      -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}")
  fi

  if [ "$(jq -r '.success' <<<"$resp")" != "true" ]; then
    printf '\n%sCloudflare API error%s  %s %s\n' "$C_RED" "$C_OFF" "$method" "$path" >&2
    jq -r '.errors[]? | "  [\(.code)] \(.message)"' <<<"$resp" >&2 || printf '%s\n' "$resp" >&2
    exit 1
  fi
  jq '.result' <<<"$resp"
}

# Resolves ZONE_NAME to a zone id, cached for the life of the shell.
zone_id() {
  if [ -z "${_ZONE_ID:-}" ]; then
    _ZONE_ID=$(cf_api GET "/zones?name=${ZONE_NAME}" | jq -r '.[0].id // empty')
    [ -n "$_ZONE_ID" ] || die "Zone '${ZONE_NAME}' not found, or the token cannot see it."
  fi
  printf '%s' "$_ZONE_ID"
}

# --- guards -----------------------------------------------------------------

# Refuses to continue unless the operator types the exact word 'yes'.
confirm() {
  printf '\n%s%s%s\n' "$C_YEL" "$*" "$C_OFF"
  printf 'Type %syes%s to continue: ' "$C_BLD" "$C_OFF"
  local reply; read -r reply
  [ "$reply" = "yes" ] || die "Aborted; nothing was changed."
}

need_state() {
  [ -f "$1" ] || die "Missing $(basename "$1"). Run $2 first."
}
