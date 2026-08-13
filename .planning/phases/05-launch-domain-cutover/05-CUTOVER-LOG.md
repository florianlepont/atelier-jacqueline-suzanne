# Phase 5 — Launch Cutover Log

**Purpose:** the single evidence record answering "did the launch work, how do we know, and what is still owed" for `atelierjacquelinesuzanne.fr`'s cutover from the old Myportfolio/Fastly site to the new Astro/OVH site. Consumed by `/gsd-verify-work` to close `LAUNCH-01`.

---

## Timeline

| Event | Timestamp (UTC) | Evidence |
|---|---|---|
| Production deploy workflow dispatched (final successful run) | run started 2026-08-11T18:59:27Z, completed 2026-08-11T19:06:23Z | GitHub Actions run [`31525572071`](https://github.com/florianlepont/ajs-website/actions/runs/31525572071), deployed commit `b550b9ecd60ec2d6c5dfaa4e866c53d63070ff5d`; recorded in `05-DNS-BASELINE.md` |
| DNS apex + `www` `A` records repointed to `51.91.236.255` | 2026-08-11 (exact timestamp not separately logged; performed manually by the maintainer in the OVH control panel, immediately followed by Claude's verification queries) | `05-DNS-BASELINE.md` "DNS cutover (Task 4) — completed" section |
| First observed propagation (new address live on public resolver) | 2026-08-11, same session as the DNS edit — visible within the 60-second TTL window | `05-DNS-BASELINE.md`: `dig +short A` returning `51.91.236.255`, `curl -sSI http://.../` returning `301` to `https://`, `Apache` server header, immediately after the edit |
| This smoke-check run (plan `05-06` Task 1) | 2026-08-13T14:46:XX UTC (see Automated verification transcript below for the exact command invocation) | This document, next section |

**Gap between the DNS edit (2026-08-11) and this verification run (2026-08-13):** no unplanned downtime occurred in between — plan `05-05`'s own Task 4 section already independently verified the site was serving correctly and MX was untouched immediately after the edit. This plan's Task 1 re-verifies the same facts roughly two days later, with the additional MX-baseline diff wired in, to catch any drift that might have occurred in the interim (e.g. a TLS certificate that had not yet finished provisioning, per `05-05-SUMMARY.md`'s own flagged follow-up). None was found.

---

## Automated verification

**Command:**
```
MX_BASELINE=.planning/phases/05-launch-domain-cutover/05-mx-baseline.txt npm run test:smoke -- https://atelierjacquelinesuzanne.fr
```

**Transcript (verbatim, first attempt — no retries needed):**
```
> ajs-website@0.1.0 test:smoke
> bash scripts/launch-smoke-check.sh https://atelierjacquelinesuzanne.fr

== launch-smoke-check: https://atelierjacquelinesuzanne.fr/ (SKIP_PHP=0) ==
PASS: reachable /
PASS: reachable /en/
PASS: reachable /about/
PASS: reachable /contact/
PASS: reachable /editions/
PASS: reachable /sitemap.xml
PASS: reachable /robots.txt
PASS: custom 404 served
PASS: homepage identity
PASS: sitemap.xml canonical origin
PASS: robots.txt references sitemap
PASS: contact.php GET returns 405
PASS: contact.php honeypot submission succeeds silently
PASS: contact.php rejects malformed submission with 400
PASS: MX records unchanged vs .planning/phases/05-launch-domain-cutover/05-mx-baseline.txt
==================================================
RESULT: PASS — 0 failures
```

**Exit code:** `0`

**Additional acceptance-criteria commands run independently (all pass):**

| Command | Result |
|---|---|
| `diff <(dig +short MX atelierjacquelinesuzanne.fr \| sort) <(sort 05-mx-baseline.txt)` | no output (byte-identical) |
| `curl -sS https://atelierjacquelinesuzanne.fr/sitemap.xml \| grep -c 'atelierjacquelinesuzanne.fr'` | `28` (own domain present, > 0) |
| `curl -sS https://atelierjacquelinesuzanne.fr/sitemap.xml \| grep -c 'florianlepont.github.io'` | `0` (GitHub Pages host absent) |
| `curl -sS -o /dev/null -w '%{http_code}' -X GET https://atelierjacquelinesuzanne.fr/contact.php` | `405` |

**Bonus check, not required by this task but relevant to a follow-up flagged in `05-05-SUMMARY.md`:** the TLS certificate is now issued specifically for the production domain, not OVH's shared cluster certificate. `openssl s_client` against `atelierjacquelinesuzanne.fr:443` returns `subject=CN=atelierjacquelinesuzanne.fr`, `issuer=... Let's Encrypt ...`, valid `Aug 12 – Nov 10 2026`. This resolves `05-05-SUMMARY.md`'s "Next Phase Readiness" follow-up #1 (shared cluster cert, expected to auto-resolve) — it has auto-resolved.

---

## Before / after

**Before (pre-cutover, captured in `05-DNS-BASELINE.md` Task 1, 2026-08-11T14:56:58Z):**
```
$ curl -sSI https://atelierjacquelinesuzanne.fr/
HTTP/2 404
server: Varnish
retry-after: 0
accept-ranges: bytes
date: Tue, 11 Aug 2026 14:56:58 GMT
via: 1.1 varnish
x-served-by: cache-par-lfpg1960082-PAR
x-cache: MISS
x-cache-hits: 0
x-timer: S1786460218.424334,VS0,VE0
x-last-60s-hits: 1
content-length: 0
```
Served by Fastly/Varnish (the Myportfolio origin being replaced); the root path 404s at this origin.

**After (this task, fresh capture):**
```
$ curl -sSI https://atelierjacquelinesuzanne.fr/
HTTP/2 200
date: Thu, 13 Aug 2026 14:46:36 GMT
content-type: text/html
server: Apache
accept-ranges: bytes
vary: Accept-Encoding
```
```
$ curl -sSI http://atelierjacquelinesuzanne.fr/
HTTP/1.1 301 Moved Permanently
date: Thu, 13 Aug 2026 14:46:39 GMT
content-type: text/html; charset=iso-8859-1
server: Apache
location: https://atelierjacquelinesuzanne.fr/
x-iplb-request-id: 4DF65B4F:F920_335BECFF:0050_6A7DD8D0_DB127:A0B66
x-iplb-instance: 52364
```
```
$ dig +short A atelierjacquelinesuzanne.fr
51.91.236.255
```

**The change of server is visible at the header level:** `server: Varnish` (Fastly, the old Myportfolio origin, 404 at root) → `server: Apache` (OVH, `200` at root, `text/html`, the new Astro site). The `http://` request now correctly 301-redirects to `https://` via the `.htaccess` rule from plan `05-01`, which the pre-cutover capture had no occasion to exercise (the old origin was accessed directly at `https://` in that capture).

---

## Issues encountered

None. The smoke check passed on the first attempt with 0 failures, and every additional acceptance-criteria command matched its expected value on the first run. No propagation wait, no fix-forward re-dispatch, and no MX-rollback trigger were needed for this task — the DNS cutover performed in plan `05-05` had already been stable for roughly two days by the time this verification ran, so none of the plan's failure-triage classes (propagation lag, `.htaccess` non-application, `SITE_URL` misconfiguration, PHP execution failure, or MX drift) were encountered.

The only thing flagged for attention, not failure: `05-05-SUMMARY.md` had noted the HTTPS certificate served immediately post-cutover was OVH's shared cluster certificate rather than a domain-specific one, expected to auto-resolve within hours. This task's bonus TLS check (see Automated verification above) confirms it has: the certificate now correctly presents `CN=atelierjacquelinesuzanne.fr`. This is recorded as a resolved follow-up, not an issue requiring action.

**Task 2 and Task 3 of this plan are not yet executed.** The remaining sections (`## Manual verification`, `## Success criteria`, `## Deviations from plan`, `## Follow-ups`) will be added once Task 2's checkpoint (real mail delivery, cross-origin staging submission, and the visual sweep) is resolved by the maintainer.
