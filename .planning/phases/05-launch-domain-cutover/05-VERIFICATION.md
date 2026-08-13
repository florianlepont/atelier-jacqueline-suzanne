---
phase: 05-launch-domain-cutover
verified: 2026-08-13T15:10:34Z
status: passed
score: 3/3 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Phase 5: Launch & Domain Cutover Verification Report

**Phase Goal:** The new site fully replaces the old Myportfolio site at the live domain, with no unplanned downtime or broken email.
**Verified:** 2026-08-13T15:10:34Z
**Status:** passed
**Re-verification:** No — initial verification

## Method

This verification did not rely on SUMMARY.md or CUTOVER-LOG.md claims alone. Every ROADMAP success criterion was independently re-checked live against the real domain from this session (fresh `dig`, `curl`, `openssl s_client`, and a fresh run of `scripts/launch-smoke-check.sh`), and the supporting code artifacts (`public/contact.php`, `public/.htaccess`, `.github/workflows/deploy-ovh.yml`, `scripts/launch-smoke-check.sh`, `src/components/ContactForm.astro`, `src/lib/contact-form.ts`) were read directly and their unit test (`tests/unit/contact-php.test.ts`) executed. Only the real-mail-delivery-into-Zimbra and the maintainer's visual browser sweep are unauditable by a non-human verifier — those were already closed via a recorded human checkpoint in `05-CUTOVER-LOG.md`, not re-derived here.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Visiting atelierjacquelinesuzanne.fr serves the new site, not the old Myportfolio site | ✓ VERIFIED | Live `curl -sSI https://atelierjacquelinesuzanne.fr/` this session returned `HTTP/2 200`, `server: Apache` (was `server: Varnish`/`404` pre-cutover per `05-DNS-BASELINE.md`). Live homepage body contains "Atelier Jacqueline Suzanne" ×11 and no Myportfolio markers. Live `dig +short A` returns `51.91.236.255` (OVH), not the Fastly addresses `151.101.128.119`/`151.101.192.119`. Directory listing at `/_astro/` returns `403 Forbidden` (locked down, not listed). A missing path returns HTTP `404` with the site's own custom 404 body (contains "404" and "Atelier", not an Apache default error page). TLS cert independently confirmed via `openssl s_client`: `CN=atelierjacquelinesuzanne.fr`, Let's Encrypt, valid Aug 12–Nov 10 2026 (domain-specific, not OVH's shared cluster cert). Maintainer's own visual sweep (recorded in `05-CUTOVER-LOG.md` Manual verification) additionally confirmed no Myportfolio content across both locale homepages, a gallery detail page, `/editions/`, `/about/`, `/mentions-legales/`, and phone-width. |
| 2 | Any existing email service tied to the domain (MX records) continues to work after cutover | ✓ VERIFIED | Live `dig +short MX atelierjacquelinesuzanne.fr` this session returned the three unchanged records (`1 mx1.mail.ovh.net.`, `5 mx2.mail.ovh.net.`, `100 mx3.mail.ovh.net.`), byte-identical to `05-DNS-BASELINE.md`'s pre-cutover capture and to `05-mx-baseline.txt`. A fresh re-run of `scripts/launch-smoke-check.sh` this session (with `MX_BASELINE` set) reproduced the documented 15/15 PASS result independently, including the MX-diff probe. A real end-to-end message was independently confirmed by the maintainer to have been delivered to `contact@atelierjacquelinesuzanne.fr`'s inbox (not spam) — the one check no automated probe can perform, resolved via the recorded human checkpoint in `05-CUTOVER-LOG.md`, not re-derived here. |
| 3 | The DNS cutover was rehearsed/verified (staging alias tested, TTLs lowered in advance) before the production switch | ✓ VERIFIED | `05-DNS-RUNBOOK.md` Section 2 documents lowering the apex/`www` A-record TTL from 3600s to 60s and waiting out the old TTL before the edit (still unrestored, tracked as an open, non-blocking follow-up — see Gaps/Notes below). `05-04-PLAN.md`/`05-04-SUMMARY.md` document `scripts/launch-smoke-check.sh` rehearsed against the GitHub Pages staging origin (`BASE=/ajs-website/ SKIP_PHP=1 npm run test:smoke -- https://florianlepont.github.io`) before the cutover, and the same script proven to correctly fail against the still-Myportfolio production domain pre-cutover. `05-DNS-RUNBOOK.md` Section 1 documents the full DNS zone captured and shown to the maintainer before any edit (D-04), and Section 3 confirms only the two A records were touched (MX/SPF/NS untouched, no zone reset used). |

**Score:** 3/3 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `public/contact.php` | PHP mail() endpoint, honeypot-gated, CRLF-hardened, CORS-allowlisted | ✓ VERIFIED | Read directly: 405 on non-POST, honeypot short-circuit, field-length bounds, CRLF rejection, `filter_var` email validation, fixed `From:`/envelope-sender, exact-origin CORS allowlist (no wildcard). `tests/unit/contact-php.test.ts` — 10/10 passing, executed live this session. |
| `public/.htaccess` | 404 routing, directory-listing lockdown, HTTPS redirect | ✓ VERIFIED | Read directly: `ErrorDocument 404 /404.html`, `Options -Indexes`, HTTPS `RewriteCond`/`RewriteRule`. Live-confirmed on the production origin: directory listing 403s, HTTP redirects to HTTPS, custom 404 served. |
| `.github/workflows/deploy-ovh.yml` | Manual/gated production deploy, all staging blocking gates reused, dotfile-safe upload | ✓ VERIFIED | Read directly: `workflow_dispatch` + `repository_dispatch`, `production-ovh` environment (Required reviewer) for manual runs vs. unprotected `production-ovh-auto` for the Sanity-triggered path, typecheck/Playwright/Vitest all reused as blocking gates before SFTP, explicit dotfile guard (`only .htaccess is a top-level dotfile`), `include-hidden-files: true` on the artifact upload, deploy recap step. |
| `scripts/launch-smoke-check.sh` | Single reusable command usable against both staging and production | ✓ VERIFIED and re-run live | Re-executed this session against the live production origin: 15/15 PASS, exit 0 — reproduces `05-CUTOVER-LOG.md`'s documented transcript exactly. |
| `.planning/phases/05-launch-domain-cutover/05-CUTOVER-LOG.md` | Evidence record: timeline, automated verification, before/after, manual verification, success criteria, deviations, follow-ups | ✓ VERIFIED | All required sections present; no section left as unresolved/TODO. Every "Deviations from plan" assumption (A2–A5) carries a recorded verdict, not a deferral. |
| `.planning/phases/05-launch-domain-cutover/05-DNS-RUNBOOK.md` | Fully sequenced, ticked DNS cutover checklist | ✓ VERIFIED | 46/48 checklist items ticked; the 2 unticked items (TTL restoration, and the rollback-trigger items that never fired) each carry an explicit one-line reason rather than being silently blank. |
| `src/components/ContactForm.astro` / `src/lib/contact-form.ts` | Form posts FormData (no preflight) to a build-time-resolvable endpoint | ✓ VERIFIED | `resolveContactEndpoint(import.meta.env.PUBLIC_CONTACT_ENDPOINT)` present and wired to the form's `data-contact-endpoint`/fetch call. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `05-mx-baseline.txt` | `scripts/launch-smoke-check.sh` | `MX_BASELINE` env var | ✓ WIRED | Live re-run this session consumed the file directly and passed the MX-diff probe. |
| `public/` static passthrough | `dist/contact.php`, `dist/.htaccess` | Astro build copy-through | ✓ WIRED | Both files independently confirmed live on the production origin (contact.php responds correctly; .htaccess rules are in effect). |
| `deploy-ovh.yml` build job | `deploy-ovh.yml` deploy job | `production-ovh` / `production-ovh-auto` environment gate | ✓ WIRED | Read directly in workflow YAML; `05-DNS-BASELINE.md`'s run log shows the Required-reviewer approval step fired and was self-approved on each of the 4 real dispatches. |
| `ContactForm.astro` fetch | `contact.php` | Same-origin default path / `PUBLIC_CONTACT_ENDPOINT` for cross-origin GitHub Pages | ✓ WIRED | Cross-origin submission from `https://florianlepont.github.io/ajs-website/contact/` to production `contact.php` independently confirmed by the maintainer (recorded human checkpoint, `05-CUTOVER-LOG.md`). |
| DNS apex/`www` A records | OVH hosting address `51.91.236.255` | Manual OVH panel edit | ✓ WIRED | Live `dig +short A` this session confirms. |

### Behavioral Spot-Checks (re-run live this session)

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Site serves new content, not Myportfolio | `curl -sSI https://atelierjacquelinesuzanne.fr/` | `200`, `server: Apache` | ✓ PASS |
| HTTP→HTTPS redirect | `curl -sSI http://atelierjacquelinesuzanne.fr/` | `301` → `https://atelierjacquelinesuzanne.fr/` | ✓ PASS |
| MX unchanged | `dig +short MX atelierjacquelinesuzanne.fr` | 3 records, byte-identical to baseline | ✓ PASS |
| A record points at OVH | `dig +short A atelierjacquelinesuzanne.fr` | `51.91.236.255` | ✓ PASS |
| No Myportfolio content | `curl` homepage body grep | 0 Myportfolio matches, 11+ AJS matches | ✓ PASS |
| Directory listing locked down | `curl /_astro/` | `403 Forbidden` | ✓ PASS |
| Custom 404 | `curl` missing path | `404`, body contains site's own 404 markers | ✓ PASS |
| Domain-specific TLS cert | `openssl s_client` + `x509 -subject -issuer -dates` | `CN=atelierjacquelinesuzanne.fr`, Let's Encrypt, valid | ✓ PASS |
| Full smoke-check suite | `MX_BASELINE=... bash scripts/launch-smoke-check.sh https://atelierjacquelinesuzanne.fr` | 15/15 PASS, exit 0 | ✓ PASS |
| `contact.php` server-side validation | `npx vitest run tests/unit/contact-php.test.ts` | 10/10 passing | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|--------------|----------------|--------------|--------|----------|
| LAUNCH-01 | 05-01 through 05-06 (all 6 plans) | Site serves from the live domain; MX/Zimbra email continues working; DNS cutover rehearsed/verified before production switch | ✓ SATISFIED | All 3 ROADMAP success criteria independently re-verified live (see Observable Truths above); no orphaned requirement — LAUNCH-01 is the only requirement mapped to Phase 5 and is claimed by every plan's frontmatter. |

No orphaned requirements found: LAUNCH-01 is the sole requirement ID mapped to Phase 5 in `.planning/ROADMAP.md`, and every one of the 6 plans (`05-01` through `05-06`) declares it in frontmatter.

### Anti-Patterns Found

None blocking. `.github/workflows/deploy-ovh.yml` contains the word "placeholder" once (line 227), but it is a descriptive code comment referring to OVH's own pre-provisioned default `index.html` file encountered during the first SFTP push — not a debt marker, not user-facing, and not associated with an unimplemented feature. No `TBD`/`FIXME`/`XXX` markers found in any phase-relevant file. No stub return values, no empty handlers, no hardcoded-empty data feeding a render path.

## Gaps Summary — none blocking

No gaps found. Two items are recorded as legitimate, explicitly-scoped-out-of-phase follow-ups, not gaps against this phase's goal or success criteria:

1. **TTL restoration (apex/`www` A records, 3600s)** — deliberately deferred per `05-DNS-RUNBOOK.md` Section 6 ("once the site has been stable for about a day"); the site has now been stable for two days with a clean independent re-verification (this session), so it is safe but has not yet been performed. This does not affect any of the 3 ROADMAP success criteria — TTL value doesn't change whether the site serves correctly or email works.
2. **Removal of the one-time `deploy-ovh.yml` workaround step** (the stale-OVH-default-`index.html` deletion, commit `54cd8c9`) — flagged as safe cleanup in `05-05-SUMMARY.md`, not urgent, does not affect phase goal achievement.

Also note: `.planning/ROADMAP.md` and `.planning/STATE.md` still show Phase 5 as "In Progress" (5/6 plans, `05-06` unchecked) — this is expected and correct at this point in the workflow: `05-06-SUMMARY.md` explicitly scoped the ROADMAP/STATE bookkeeping update to the separate phase-completion step, which runs after this verification, not before it. This is not a gap in the phase's technical achievement.

## Human Verification Required

None outstanding. The items that are inherently human-judgment for this phase — real end-to-end mail delivery into the Zimbra inbox (vs. spam), the maintainer's visual browser sweep confirming no Myportfolio content remained, and the cross-origin staging-to-production contact-form submission — were already resolved via a recorded `checkpoint:human-verify` in plan `05-06`, with the maintainer's verbatim replies preserved in `05-CUTOVER-LOG.md`'s "Manual verification" section (including the specific inbox-vs-spam follow-up question). No item was left silently unresolved or dropped.

---

_Verified: 2026-08-13T15:10:34Z_
_Verifier: Claude (gsd-verifier)_
