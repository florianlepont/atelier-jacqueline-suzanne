#!/usr/bin/env bash
#
# launch-smoke-check.sh — proves a given origin is correctly serving the new
# Atelier Jacqueline Suzanne site, before and after the Phase 5 DNS cutover.
#
# Maps to ROADMAP.md Phase 5's three success criteria:
#   1. The new site serves the domain (not the old Myportfolio site).
#   2. Existing MX/Zimbra email continues working (probe 6, MX_BASELINE).
#   3. The DNS cutover was rehearsed/verified before the production switch —
#      this script run against staging BEFORE the cutover, and against
#      production AFTER it, is that rehearsal/verification.
#
# Deliberately uses `set -uo pipefail`, NOT `-e`: every probe must run and
# report, even if an earlier one fails, mirroring the `failures` accumulator
# pattern already used by tests/scripts/verify-static-artifact.mjs.
#
# Usage:
#   scripts/launch-smoke-check.sh [origin]
#
# Env vars:
#   BASE        Path prefix, default "/". Set to "/atelier-jacqueline-suzanne/" to probe the
#               GitHub Pages project-page build.
#   SKIP_PHP    Set to "1" to skip the PHP contact.php probes (e.g. GitHub
#               Pages, which has no PHP runtime and no longer publishes
#               contact.php at all). Default "0".
#   MX_BASELINE Optional path to a file holding the expected `dig +short MX`
#               output. When set, the current MX records for the origin's
#               host are diffed against this file; any difference fails
#               loudly, since it means email may be broken. When unset, the
#               MX check is skipped entirely.
#
# Examples:
#   # Staging rehearsal (GitHub Pages, no PHP runtime, known-good origin):
#   BASE=/atelier-jacqueline-suzanne/ SKIP_PHP=1 npm run test:smoke -- https://florianlepont.github.io
#
#   # Production run, post-cutover, with MX preservation checked:
#   MX_BASELINE=.planning/phases/05-launch-domain-cutover/mx-baseline.txt \
#     npm run test:smoke -- https://atelierjacquelinesuzanne.fr
#
set -uo pipefail

ORIGIN="${1:-https://atelierjacquelinesuzanne.fr}"
ORIGIN="${ORIGIN%/}"
BASE="${BASE:-/}"
SKIP_PHP="${SKIP_PHP:-0}"
MX_BASELINE="${MX_BASELINE:-}"

failures=()

check() {
  local label="$1"
  shift
  if "$@"; then
    echo "PASS: ${label}"
  else
    failures+=("${label}")
    echo "FAIL: ${label}"
  fi
}

# --- Probe 1: Reachability -------------------------------------------------
# -L so an http->https or trailing-slash redirect doesn't read as a failure.
probe_reachable() {
  local path="$1"
  local code
  code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 -L "${ORIGIN}${path}")
  [ "${code}" = "200" ]
}

# --- Probe 2: Custom 404 ----------------------------------------------------
# Proves ErrorDocument 404 /404.html from public/.htaccess actually took
# effect on Apache — not just that the site's own build has a 404.astro.
probe_404() {
  local path="${BASE}__smoke_check_missing__/"
  local response body code
  response=$(curl -sS --max-time 20 -w '\n%{http_code}' "${ORIGIN}${path}")
  body="${response%$'\n'*}"
  code="${response##*$'\n'}"
  [ "${code}" = "404" ] || return 1
  [[ "${body}" == *"404"* ]] || return 1
  [[ "${body}" == *"href=\"${BASE}en/\""* ]] || return 1
  return 0
}

# --- Probe 3: Identity -------------------------------------------------------
# Distinguishes "the new site is live" from "the old Myportfolio site is
# still live" (ROADMAP success criterion 1).
probe_identity() {
  local body
  body=$(curl -sS --max-time 20 -L "${ORIGIN}${BASE}")
  [[ "${body}" == *"Atelier Jacqueline Suzanne"* ]]
}

# --- Probe 4: Canonical origin ----------------------------------------------
# Catches RESEARCH.md Pitfall 4 — a production build that forgot SITE_URL
# and therefore advertises florianlepont.github.io in its own sitemap.
probe_canonical_sitemap() {
  local body
  body=$(curl -sS --max-time 20 -L "${ORIGIN}${BASE}sitemap.xml")
  [[ "${body}" == *"${ORIGIN}"* ]]
}

probe_canonical_robots() {
  local body
  body=$(curl -sS --max-time 20 -L "${ORIGIN}${BASE}robots.txt")
  [[ "${body}" == *"${BASE}sitemap.xml"* ]]
}

# --- Probe 5: PHP endpoint ---------------------------------------------------
probe_php_method_guard() {
  local code
  code=$(curl -sS -o /dev/null -w '%{http_code}' -X GET --max-time 20 "${ORIGIN}${BASE}contact.php")
  [ "${code}" = "405" ]
}

# The `website` field below is intentionally filled — this is the client's
# honeypot field. A filled honeypot makes contact.php short-circuit and send
# NO mail, so this probe is safe to run as many times as troubleshooting
# requires without ever touching Romane's real mailbox.
probe_php_honeypot() {
  local response body code
  response=$(curl -sS --max-time 20 -w '\n%{http_code}' -X POST \
    -F 'name=Smoke Check' \
    -F 'email=smoke@example.com' \
    -F 'message=automated smoke check' \
    -F 'website=smoke-check-honeypot' \
    "${ORIGIN}${BASE}contact.php")
  body="${response%$'\n'*}"
  code="${response##*$'\n'}"
  [ "${code}" = "200" ] || return 1
  [[ "${body}" == *'"success":true'* ]] || return 1
  return 0
}

probe_php_validation() {
  local code
  code=$(curl -sS -o /dev/null -w '%{http_code}' -X POST --max-time 20 \
    -F 'name=Smoke Check' \
    -F 'email=not-an-email' \
    -F 'message=automated smoke check' \
    -F 'website=' \
    "${ORIGIN}${BASE}contact.php")
  [ "${code}" = "400" ]
}

# --- Probe 6: MX preservation -----------------------------------------------
probe_mx() {
  local host actual expected
  host="${ORIGIN#*://}"
  host="${host%%/*}"
  actual=$(dig +short MX "${host}" | sort)
  expected=$(sort "${MX_BASELINE}")
  if [ "${actual}" != "${expected}" ]; then
    echo "  MX MISMATCH for ${host} — EMAIL DELIVERY MAY BE BROKEN" >&2
    echo "  --- expected (${MX_BASELINE}) ---" >&2
    echo "${expected}" | sed 's/^/  /' >&2
    echo "  --- actual (dig +short MX ${host}) ---" >&2
    echo "${actual}" | sed 's/^/  /' >&2
    return 1
  fi
  return 0
}

echo "== launch-smoke-check: ${ORIGIN}${BASE} (SKIP_PHP=${SKIP_PHP}) =="

for path in "${BASE}" "${BASE}en/" "${BASE}about/" "${BASE}contact/" "${BASE}editions/" "${BASE}sitemap.xml" "${BASE}robots.txt"; do
  check "reachable ${path}" probe_reachable "${path}"
done

check "custom 404 served" probe_404
check "homepage identity" probe_identity
check "sitemap.xml canonical origin" probe_canonical_sitemap
check "robots.txt references sitemap" probe_canonical_robots

if [ "${SKIP_PHP}" = "1" ]; then
  echo "SKIP: contact.php probes (SKIP_PHP=1)"
else
  check "contact.php GET returns 405" probe_php_method_guard
  check "contact.php honeypot submission succeeds silently" probe_php_honeypot
  check "contact.php rejects malformed submission with 400" probe_php_validation
fi

if [ -z "${MX_BASELINE}" ]; then
  echo "SKIP: MX preservation check (MX_BASELINE unset)"
else
  check "MX records unchanged vs ${MX_BASELINE}" probe_mx
fi

echo "=================================================="
if [ "${#failures[@]}" -eq 0 ]; then
  echo "RESULT: PASS — 0 failures"
  exit 0
else
  echo "RESULT: FAIL — ${#failures[@]} failure(s):"
  for f in "${failures[@]}"; do
    echo "  - ${f}"
  done
  exit 1
fi
