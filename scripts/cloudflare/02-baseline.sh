#!/usr/bin/env bash
#
# READ ONLY. Records how an R2 asset serves *before* any route exists, so the
# gate in 04 has something truthful to compare against.
#
# Usage:  ./02-baseline.sh https://asset.myfowable.com/path/to/a/real/object.jpg
#
# Pick an object that genuinely exists and is publicly reachable. A 404 baseline
# proves nothing — the gate would then "pass" on a broken bucket.

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

URL="${1:-}"
[ -n "$URL" ] || die \
"Pass the URL of a real, public R2 object.

  ./02-baseline.sh https://${ASSET_HOST}/path/to/object.jpg

Find one in the admin app (any uploaded image) or list your bucket."

case "$URL" in
  https://${ASSET_HOST}/*) ;;
  *) warn "URL is not on ${ASSET_HOST} — the gate tests that host specifically." ;;
esac

mkdir -p "$STATE_DIR"
BASELINE="${STATE_DIR}/asset-baseline.txt"

head1 "Fetching ${URL}"

# --write-out gives us the facts that matter regardless of header casing.
# Pipe-delimited, not space: content_type routinely contains "; charset=utf-8",
# and can be empty — either would corrupt a whitespace-split read.
IFS='|' read -r status ctype clen < <(
  curl -sS -o /dev/null --max-time 20 \
    -w '%{http_code}|%{content_type}|%{size_download}\n' "$URL"
) || die "Request failed — check the URL is reachable from here."

say ""
dim "status        ${status}"
dim "content-type  ${ctype}"
dim "bytes         ${clen}"

if [ "$status" != "200" ]; then
  bad "Expected 200, got ${status}."
  die "Baseline must be a working object, or the gate cannot detect a regression."
fi
if [ "$clen" = "0" ]; then
  bad "Zero bytes returned."
  die "Baseline must be a real object with content."
fi

# Keep the full header set too — useful for eyeballing what changed later.
curl -sS -I --max-time 20 "$URL" > "${STATE_DIR}/asset-baseline-headers.txt" 2>/dev/null || true

# Written as inert key=value lines and read back with sed, never sourced:
# a content-type like "text/html; charset=utf-8" would otherwise have its ';'
# parsed as a command separator.
{
  printf 'url=%s\n'    "$URL"
  printf 'status=%s\n' "$status"
  printf 'ctype=%s\n'  "$ctype"
  printf 'bytes=%s\n'  "$clen"
  printf 'taken=%s\n'  "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
} > "$BASELINE"

ok "Baseline saved to ${BASELINE#"$PWD"/}"

head1 "Next"
say "  ./03-exclusion-route.sh    create ${ASSET_HOST}/* -> (no Worker)"
dim ""
dim "Order matters: the exclusion must exist BEFORE the */* route is deployed,"
dim "or every asset request hits the Worker in the gap."
