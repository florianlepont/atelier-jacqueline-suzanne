---
phase: 05-launch-domain-cutover
plan: 04
subsystem: infra
tags: [bash, curl, dig, smoke-test, dns, ops-runbook]

requires:
  - phase: 05-01
    provides: "public/contact.php: OVH PHP mail() contact endpoint, honeypot field name `website`, response contract `{success: boolean}` with non-2xx on failure"
provides:
  - "scripts/launch-smoke-check.sh: a single command answering 'is the site correctly live at this origin?' with a non-zero exit code on any failure, runnable against staging pre-cutover and production post-cutover"
  - "npm run test:smoke: package.json wiring for the above, deliberately excluded from CI (probes live external hosts)"
  - ".planning/phases/05-launch-domain-cutover/05-DNS-RUNBOOK.md: a six-section, checkbox-able DNS cutover procedure with a defined rollback trigger and bound"
affects: [05-05, 05-06]

tech-stack:
  added: []
  patterns:
    - "check <label> <probe-fn> helper accumulating a failures[] array, printing PASS/FAIL per probe, exiting 1 iff non-empty — mirrors tests/scripts/verify-static-artifact.mjs's own failures-accumulator convention, ported to bash for a script the JS/TS test harness can't run (live external hosts, real DNS, a PHP endpoint)"

key-files:
  created:
    - scripts/launch-smoke-check.sh
    - .planning/phases/05-launch-domain-cutover/05-DNS-RUNBOOK.md
  modified:
    - package.json

key-decisions:
  - "MX preservation check reads dig +short MX output at run time and diffs it against an MX_BASELINE file path supplied via env var, rather than embedding any DNS values in the script itself — keeps the script host-agnostic and lets plan 05-05's captured zone file be the single source of truth."
  - "The 404 and identity/canonical probes intentionally do NOT try to distinguish 'is this the new site' from 'is this the old Myportfolio site' via the sitemap/robots canonical check — both sites legitimately self-reference their own domain in their own sitemap. That distinction is instead carried by the reachability and custom-404 probes (the old site has neither the new route inventory nor the new 404 page), consistent with the plan's own framing of the canonical check as a SITE_URL-misconfiguration catch, not an old-vs-new discriminator."

patterns-established:
  - "Live-host verification scripts that fall outside the JS/TS test harness (DNS, PHP-runtime-dependent endpoints, real external origins) get a standalone bash script wired as its own npm script, excluded from CI, rather than folded into Vitest/Playwright."

requirements-completed: [LAUNCH-01]

coverage:
  - id: D1
    description: "scripts/launch-smoke-check.sh probes reachability (7 routes), the custom 404 page, homepage identity, canonical sitemap/robots.txt, the contact.php PHP path (method guard, honeypot-safe send, validation), and MX preservation, exiting non-zero on any failure"
    requirement: LAUNCH-01
    verification:
      - kind: manual_procedural
        ref: "BASE=/ajs-website/ SKIP_PHP=1 npm run test:smoke -- https://florianlepont.github.io (see Staging Rehearsal Transcript below)"
        status: pass
      - kind: manual_procedural
        ref: "SKIP_PHP=0 npm run test:smoke -- https://atelierjacquelinesuzanne.fr (see Production Baseline Transcript below)"
        status: pass
    human_judgment: false
  - id: D2
    description: "npm run test:smoke wired in package.json, script executable, no set -e, no credentials, bash -n syntax-clean"
    requirement: LAUNCH-01
    verification:
      - kind: other
        ref: "test -x scripts/launch-smoke-check.sh; node -e require('./package.json').scripts['test:smoke']; bash -n scripts/launch-smoke-check.sh; grep -c 'set -e' (0 matches); grep credential patterns (0 matches)"
        status: pass
    human_judgment: false
  - id: D3
    description: "05-DNS-RUNBOOK.md: six numbered sections (Facts, Capture, Prepare, Cut over, Verify, Rollback, Post-cutover), reproduces current MX/SPF/Fastly-A values, >=10 checklist items, names the zone-reset function as prohibited, states an immediate-rollback trigger distinct from a bounded troubleshoot window, references npm run test:smoke, contains no credentials"
    requirement: LAUNCH-01
    verification:
      - kind: other
        ref: "node -e structural check (see plan 05-04-PLAN.md Task 2 <verify> block) — 53 checklist items found"
        status: pass
    human_judgment: false
  - id: D4
    description: "The confirmed live DNS facts (MX, SPF, Fastly A addresses) reproduced in the runbook are accurate enough to actually roll back from if needed"
    requirement: LAUNCH-01
    verification: []
    human_judgment: true
    rationale: "The values were supplied by the plan's own <interface_context> block (captured 2026-08-11 in this worktree) and reproduced verbatim, not independently re-queried against live DNS during this plan's execution — a human (or plan 05-05, which captures the zone again immediately before any edit) should re-verify these are still current before relying on them for an actual rollback."
duration: ~20min
completed: 2026-08-11
status: complete
---

# Phase 05 Plan 04: Launch Verification Tooling & DNS Runbook Summary

**A bash smoke-check script (`npm run test:smoke`) proving reachability, custom-404, identity, canonical-origin, PHP-endpoint, and MX-preservation for any origin, rehearsed clean against live GitHub Pages staging and proven to correctly fail against the still-Myportfolio production domain — plus a six-section, checkbox-able DNS cutover runbook with a named rollback trigger.**

## Performance

- **Duration:** ~20 min
- **Completed:** 2026-08-11T16:30:39+02:00
- **Tasks:** 2
- **Files modified:** 3 (2 created, 1 modified)

## Accomplishments
- `scripts/launch-smoke-check.sh` created: a `check <label> <probe-fn>` accumulator script (no `set -e`, so every probe runs and reports) covering 7 reachability routes, the custom 404 page, homepage identity, canonical sitemap/robots.txt origin, the `contact.php` PHP path (405 method guard, honeypot-safe 200 send, 400 validation), and an opt-in MX-preservation diff against an `MX_BASELINE` file
- `npm run test:smoke` wired into `package.json`, deliberately not added to any CI workflow since it probes live external hosts
- **Rehearsed against live staging** (`https://florianlepont.github.io/ajs-website/`, `SKIP_PHP=1`): exits 0, every reachability/404/identity/canonical probe passes — proof the tooling is correct before it's relied on for the real cutover
- **Run against current production** (`https://atelierjacquelinesuzanne.fr`, still serving the old Myportfolio site): exits 1 with 7 failures, proving the script actually discriminates rather than trivially passing everywhere
- `.planning/phases/05-launch-domain-cutover/05-DNS-RUNBOOK.md` created: Facts → Capture (D-04) → Prepare → Cut over → Verify → Rollback (D-06) → Post-cutover, with a 53-item checkbox-able checklist, the OVH zone-reset function explicitly named and prohibited, and an immediate mail-broken rollback trigger kept distinct from a bounded ~60-minute site-broken troubleshoot window

## Task Commits

1. **Task 1: Write the launch smoke-check script and rehearse it against live staging** - `9b988cd` (feat)
2. **Task 2: Write the DNS cutover runbook** - `9a26385` (docs)

## Files Created/Modified
- `scripts/launch-smoke-check.sh` - New executable bash smoke-check script; args: `[origin]`; env: `BASE`, `SKIP_PHP`, `MX_BASELINE`
- `package.json` - Added `"test:smoke": "bash scripts/launch-smoke-check.sh"` after `test:artifact`
- `.planning/phases/05-launch-domain-cutover/05-DNS-RUNBOOK.md` - New operational DNS cutover procedure

## Decisions Made
- MX check reads `dig +short MX` live and diffs against a caller-supplied `MX_BASELINE` file path rather than hardcoding any DNS values into the script — keeps the script reusable for both the staging rehearsal (where it's skipped) and the real cutover (where plan 05-05's zone capture becomes the baseline file).
- The canonical-origin probe (sitemap/robots.txt) does not distinguish old-vs-new site by design — both the old Myportfolio site and the new Astro site legitimately self-reference their own domain in their own sitemap.xml, so that check is scoped (per the plan's own instruction) to catching a missing-`SITE_URL` build misconfiguration, not old-vs-new discrimination. The reachability and custom-404 probes are what actually distinguish the sites, and they did (see Production Baseline Transcript below).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- `npx vitest run` shows the same pre-existing, out-of-scope failure already documented in `05-01-SUMMARY.md`'s Deferred Issues: `tests/unit/dashboard-logic.test.ts` fails to import `@sanity/icons/BulbOutline`, from `sanity/editorial/dashboardLogic.ts` (predates this plan, unrelated to any file this plan touches). All 266 other unit tests pass. Not fixed, per Scope Boundary — out-of-scope discovery, already logged by an earlier plan.
- `npm run typecheck` (`astro check`) passes clean: 0 errors, 0 warnings, 1 pre-existing unrelated hint (`webkitBackgroundClip` deprecation in an e2e spec file).

## Deferred Issues

- `tests/unit/dashboard-logic.test.ts`'s `@sanity/icons/BulbOutline` import failure — pre-existing (predates this plan and `05-01`), unrelated to any file this plan created or modified. Already logged in `05-01-SUMMARY.md`'s Deferred Issues; not re-fixed here.

## User Setup Required

None - no external service configuration required for this plan.

## Next Phase Readiness

- `npm run test:smoke` is proven correct against a known-good origin (staging, exit 0) and proven to actually discriminate against a known-bad origin (current production, exit 1) — ready for plan `05-06`'s post-cutover verification, and for plan `05-05` to produce the `MX_BASELINE` file this script's `MX_BASELINE` env var consumes.
- `05-DNS-RUNBOOK.md`'s Section 1 (Capture) names the exact baseline-file path (`.planning/phases/05-launch-domain-cutover/mx-baseline.txt`) that plan `05-05` should produce and plan `05-06`'s cutover should consume via `MX_BASELINE=... npm run test:smoke`.
- Not yet exercised in this plan: the real production run with `MX_BASELINE` set (deferred to `05-06`, since that requires the actual zone capture from `05-05` and the actual post-cutover DNS state), and the single real end-to-end contact-form mail delivery (also deferred to `05-06`, same reason the plan's own `<verification>` section defers it).

---
*Phase: 05-launch-domain-cutover*
*Completed: 2026-08-11*

## Staging Rehearsal Transcript (verbatim)

Command: `BASE=/ajs-website/ SKIP_PHP=1 npm run test:smoke -- https://florianlepont.github.io`

```
> ajs-website@0.1.0 test:smoke
> bash scripts/launch-smoke-check.sh https://florianlepont.github.io

== launch-smoke-check: https://florianlepont.github.io/ajs-website/ (SKIP_PHP=1) ==
PASS: reachable /ajs-website/
PASS: reachable /ajs-website/en/
PASS: reachable /ajs-website/about/
PASS: reachable /ajs-website/contact/
PASS: reachable /ajs-website/editions/
PASS: reachable /ajs-website/sitemap.xml
PASS: reachable /ajs-website/robots.txt
PASS: custom 404 served
PASS: homepage identity
PASS: sitemap.xml canonical origin
PASS: robots.txt references sitemap
SKIP: contact.php probes (SKIP_PHP=1)
SKIP: MX preservation check (MX_BASELINE unset)
==================================================
RESULT: PASS — 0 failures
```

Exit code: `0`

## Production Baseline Transcript (verbatim, pre-cutover — must fail, not "fixed")

Command: `SKIP_PHP=0 npm run test:smoke -- https://atelierjacquelinesuzanne.fr`

```
> ajs-website@0.1.0 test:smoke
> bash scripts/launch-smoke-check.sh https://atelierjacquelinesuzanne.fr

== launch-smoke-check: https://atelierjacquelinesuzanne.fr/ (SKIP_PHP=0) ==
PASS: reachable /
FAIL: reachable /en/
FAIL: reachable /about/
PASS: reachable /contact/
FAIL: reachable /editions/
PASS: reachable /sitemap.xml
PASS: reachable /robots.txt
FAIL: custom 404 served
PASS: homepage identity
PASS: sitemap.xml canonical origin
PASS: robots.txt references sitemap
FAIL: contact.php GET returns 405
FAIL: contact.php honeypot submission succeeds silently
FAIL: contact.php rejects malformed submission with 400
SKIP: MX preservation check (MX_BASELINE unset)
==================================================
RESULT: FAIL — 7 failure(s):
  - reachable /en/
  - reachable /about/
  - reachable /editions/
  - custom 404 served
  - contact.php GET returns 405
  - contact.php honeypot submission succeeds silently
  - contact.php rejects malformed submission with 400
```

Exit code: `1`

Note: the "homepage identity" and "canonical origin" probes pass here even though this is the OLD site — both checks are, by design, not old-vs-new discriminators (see Decisions Made above). The 7 real failures (missing routes, no custom 404, no PHP endpoint) are what correctly identify this as not-yet-the-new-site.

## Self-Check: PASSED
