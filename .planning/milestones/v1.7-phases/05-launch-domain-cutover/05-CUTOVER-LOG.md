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

All Task 3 sections below (`## Manual verification`, `## Success criteria`, `## Deviations from plan`, `## Follow-ups`) are complete.

---

## Manual verification

Task 2's checkpoint was presented to the maintainer (Florian) alongside Task 1's automated evidence above. The maintainer's replies, verbatim:

> "A - pass
> B - pass
> c - Non tout est bon
> D - pass"

followed, on a specific follow-up about which folder the test message landed in, by: **"Boîte de réception"** (inbox).

Mapped to the four `<resume-signal>` items:

**(a) Real end-to-end mail delivery (D-07).** A real message was submitted through `https://atelierjacquelinesuzanne.fr/contact/`. The maintainer confirmed it arrived at the confirmed recipient mailbox (`contact@atelierjacquelinesuzanne.fr`) **in the inbox, not spam** — the SPF hard-fail deliverability risk flagged in this plan's `<interface_context>` (`v=spf1 include:mx.ovh.com -all`) did not materialize. No `Reply-To:` or delivery problem was reported.

**(b) Cross-origin submission from staging.** The maintainer confirmed the form at `https://florianlepont.github.io/ajs-website/contact/` submitted successfully cross-origin to production `contact.php`, with no CORS error and the same French success message as the production form. This is the check deferred here from plan `05-02`, and the reason D-03 keeps GitHub Pages alive: it proves the exact-match allow-origin allowlist admits the staging origin.

**(c) The old site is gone, and the new one looks right.** The maintainer's reply was "Non, tout est bon" — no page looked wrong across the sweep (both locale homepages, a gallery detail page, `/editions/`, `/about/`, `/mentions-legales/`, the phone-width homepage). No Myportfolio content was found anywhere.

**(d) http→https, no directory listing, and the site's own 404.** The maintainer confirmed: plain `http://atelierjacquelinesuzanne.fr/` redirects to `https://`; `https://atelierjacquelinesuzanne.fr/_astro/` does not list directory contents; and a missing path renders the site's own 404 design rather than Apache's default. (Task 1's automated transcript above independently confirms the same custom-404 and http→https behaviour at the header level, so this is doubly evidenced.)

**(4) Decision: the launch is accepted.** No blocking items were found. Per D-06, no DNS rollback was warranted or considered — Task 1 had already proven MX intact, and nothing in Task 2 was mail-related.

---

## Success criteria

| # | ROADMAP Phase 5 criterion | Evidence |
|---|---|---|
| 1 | Visiting `atelierjacquelinesuzanne.fr` serves the new site, not the old Myportfolio site | Task 1's smoke-check identity + reachability probes (15/15 PASS, see `## Automated verification` above) and the `## Before / after` header capture (`server: Varnish` → `server: Apache`, `404` → `200`); confirmed visually by the maintainer in Task 2 item (c) across both locale homepages, a gallery detail page, `/editions/`, `/about/`, `/mentions-legales/`, and a phone-width check, with no Myportfolio content found anywhere |
| 2 | The domain's existing MX/Zimbra mail service continues to work after cutover | `diff <(dig +short MX ...) <(sort 05-mx-baseline.txt)` produced no output (byte-identical), both immediately post-cutover (`05-DNS-BASELINE.md`) and again at this plan's Task 1, two days later; a real message submitted through the live form was confirmed delivered to the inbox of `contact@atelierjacquelinesuzanne.fr` in Task 2 item (a) |
| 3 | The cutover was rehearsed/verified before the production switch (staging alias tested, TTLs lowered in advance) | Plan `05-04`'s staging rehearsal (`BASE=/ajs-website/ SKIP_PHP=1 npm run test:smoke -- https://florianlepont.github.io`) exited 0, and the same script was proven to correctly fail against the still-Myportfolio production domain before cutover; plan `05-05` Task 2 lowered the apex/`www` TTLs from 3600s to 60s and waited out the old TTL before making the DNS edit, per `05-DNS-RUNBOOK.md` Section 2 |

---

## Deviations from plan

RESEARCH.md flagged four assumptions (A2–A5) as needing live confirmation. Verdicts:

- **A2 — `wlixcc/SFTP-Deploy-Action`'s exact version and input names.** Confirmed accurate: `deploy-ovh.yml` pins `wlixcc/SFTP-Deploy-Action@a5ccb9c6211a94cc59404f0fdb2a9936a6dfee64` (`v1.2.6`) with input names `server`/`username`/`ssh_password`/`sftp_only`/`local_path`/`remote_path` exactly as assumed. No re-pin was needed. Three unrelated hiccups occurred during plan `05-05`'s deploy dispatches (a stale Web3Forms mock in an out-of-scope e2e test, OVH's pre-provisioned default `index.html` blocking the first SFTP overwrite, and a workaround step's own `SSHPASS` environment-variable-name bug) — none were caused by the action itself; full detail already recorded in `05-05-SUMMARY.md` Deviations, not repeated here.
- **A3 — OVH's exact webroot subpath.** Confirmed accurate: `/home/atelihu/www`, verified directly via the OVH Multisite panel's "Dossier racine" column (`05-05-SUMMARY.md` key-decisions) — matched the assumption exactly, no correction needed.
- **A4 — the production contact mailbox is the correct live Zimbra mailbox.** Confirmed by this plan's own Task 2: a real message sent through the live form was independently confirmed delivered to `contact@atelierjacquelinesuzanne.fr`'s inbox.
- **A5 — self-approval is not blocked when the same GitHub user both dispatches a `workflow_dispatch` run and is the Required reviewer on its target environment.** Confirmed not blocked: `05-DNS-BASELINE.md`'s run log shows "build passed, approved" on each of the four `deploy-ovh.yml` dispatches in plan `05-05`, all self-approved by the same maintainer who triggered them. No deadlock occurred and the typed-confirmation fallback was never needed.

One risk explicitly flagged for this plan's Task 2 did not materialize: the apex SPF hard-fail (`v=spf1 include:mx.ovh.com -all`) raised a real possibility that the test message would land in spam. It did not — the message landed in the inbox on the first attempt.

No other deviation from `05-06-PLAN.md` itself occurred: Task 1's smoke check passed on the first attempt with zero retries, and Task 2 surfaced no blocking items.

---

## Follow-ups

- **Restore the apex and `www` `A` record TTLs to 3600s** — **resolved.** The apex and `www` `A` records have been restored to their original TTL of 3600s in the OVH control panel, verified via `dig` against both authoritative nameservers (`ns16.ovh.net`, `dns16.ovh.net`) and the public resolver `1.1.1.1`, all four queries returning TTL 3600. MX (`mx1`/`mx2`/`mx3.mail.ovh.net`) and the SPF TXT (`v=spf1 include:mx.ovh.com -all`) were independently reconfirmed unchanged at the same time. `05-DNS-RUNBOOK.md` Section 6 and its Full Checklist's matching final line are both now ticked `[x]` to reflect this. Original value: **3600s** (both records, per `05-DNS-BASELINE.md`).
- **Remove the one-time `deploy-ovh.yml` workaround step** (the stale-OVH-default-`index.html` deletion added in plan `05-05`, commit `54cd8c9`/`b550b9e`) — **resolved.** Closed by quick task `260813-nyq` (commit `89af1fa`), which deleted the step and its explanatory comment, verified via `tests/unit/deploy-ovh-workflow.test.ts`'s 16 tests plus a full typecheck/vitest regression pass.

No SPF/deliverability hardening follow-up is recorded: the real test message landed in the inbox, not spam, so the flagged risk did not surface as an actual problem.
