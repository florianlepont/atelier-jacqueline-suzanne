---
phase: 05-launch-domain-cutover
plan: 01
subsystem: infra
tags: [php, mail, apache, htaccess, ci, github-actions, contact-form]

requires: []
provides:
  - "public/contact.php: OVH PHP mail() contact endpoint (CORS-allowlisted, honeypot-gated, CRLF-hardened)"
  - "public/.htaccess: directory-listing lockdown + HTTPS redirect, alongside the pre-existing 404 ErrorDocument"
  - "tests/scripts/verify-static-artifact.mjs: build-time proof that dist/contact.php ships, is the validated (non-stub) endpoint, and its honeypot key matches the rendered form"
  - ".github/workflows/deploy.yml: PHP source stripped from the GitHub Pages artifact (Pages has no PHP runtime)"
affects: [05-02, 05-06]

tech-stack:
  added: []
  patterns:
    - "public/ static passthrough for host-specific server config (PHP, .htaccess) that Astro copies to dist/ unmodified"
    - "Single fail() helper funneling every contact.php rejection path into one JSON/status shape, mirroring ContactForm.astro's single renderSubmissionError() path"

key-files:
  created:
    - public/contact.php
    - tests/unit/contact-php.test.ts
  modified:
    - public/.htaccess
    - tests/scripts/verify-static-artifact.mjs
    - .github/workflows/deploy.yml

key-decisions:
  - "Recipient mailbox confirmed by the maintainer as contact@atelierjacquelinesuzanne.fr (D-07) — the existing publicEmail default, not a guessed or changed value."
  - "PHP source-invariant testing (reading contact.php as text, no PHP runtime) chosen over adding a PHP test framework, per 05-VALIDATION.md Wave 0 item 1's own recommendation for a single ~110-line script."

patterns-established:
  - "PHP endpoints in this repo live in public/ and are proven present/valid in every build via tests/scripts/verify-static-artifact.mjs, not via a PHP test runner."

requirements-completed: [LAUNCH-01]

coverage:
  - id: D1
    description: "public/contact.php accepts POST of name/email/message/website, rejects non-POST with 405, silently absorbs honeypot-filled submissions, rejects blank/oversized/CRLF-bearing/malformed-email input with 400, and sends mail with a fixed owned-domain envelope sender, returning 502 on send failure"
    requirement: "LAUNCH-01"
    verification:
      - kind: unit
        ref: "tests/unit/contact-php.test.ts (10 source-invariant assertions)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The confirmed recipient mailbox (contact@atelierjacquelinesuzanne.fr) is a real, monitored Zimbra mailbox that will actually receive contact-form mail once deployed to OVH"
    requirement: "LAUNCH-01"
    verification: []
    human_judgment: true
    rationale: "No automated check can confirm a mailbox is genuinely monitored — the maintainer's confirmation (Task 1) is the only evidence; a real end-to-end send is deferred to plan 05-06, inherently post-cutover."
  - id: D3
    description: "public/.htaccess disables directory listing and redirects HTTP to HTTPS, alongside the pre-existing 404 ErrorDocument"
    requirement: "LAUNCH-01"
    verification:
      - kind: unit
        ref: "grep -c 'Options -Indexes' public/.htaccess && grep -c 'RewriteCond %{HTTPS} off' public/.htaccess && grep -c 'ErrorDocument 404 /404.html' public/.htaccess"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every build artifact is proven to contain a validated dist/contact.php with a honeypot key matching the rendered form, and dist/contact.php is proven absent from the GitHub Pages artifact"
    requirement: "LAUNCH-01"
    verification:
      - kind: manual_procedural
        ref: "tests/scripts/verify-static-artifact.mjs new assertions (dist/contact.php exists + FILTER_VALIDATE_EMAIL present + honeypot parity with dist/contact/index.html); node -e step-order check on .github/workflows/deploy.yml"
        status: unknown
    human_judgment: true
    rationale: "npm run build && npm run test:artifact requires Sanity credentials (.env) not present in this sandboxed worktree — deferred to CI per the plan's own <verification> section. Step-order and grep-based static checks on deploy.yml were run and pass; the actual dist/ build was not exercised here."

duration: ~25min
completed: 2026-08-11
status: complete
---

# Phase 05 Plan 01: OVH Contact-Form Endpoint & Static-Host Hardening Summary

**PHP `mail()` contact endpoint (CORS-allowlisted, honeypot-gated, CRLF-hardened) replacing the never-provisioned Web3Forms integration, plus `.htaccess` hardening and build-artifact guarantees that both actually ship to OVH while staying off GitHub Pages.**

## Performance

- **Duration:** ~25 min (continuation dispatch, resumed after Task 1's checkpoint)
- **Completed:** 2026-08-11T14:13:36Z
- **Tasks:** 3 (Task 1 was a pure decision checkpoint with no code changes; Tasks 2-3 executed and committed in this dispatch)
- **Files modified:** 5 (2 created, 3 modified)

## Task 1: Confirmed Recipient Mailbox (D-07)

**Decision:** `use-publicEmail-default` — **contact@atelierjacquelinesuzanne.fr**

The maintainer's verbatim reply confirmed this is a real, monitored Zimbra mailbox on `atelierjacquelinesuzanne.fr` (the option's own framing: "Select use-publicEmail-default to confirm contact@atelierjacquelinesuzanne.fr is a real, monitored mailbox"). This is the same address already hardcoded as `ContactForm.astro`'s `publicEmail` default and rendered to visitors (the D-09 fallback text, and the Contact page `mailto:` link), so no change to Sanity's `contact.publicEmail` or the Contact page was needed — it already matches. Task 1 made no code changes; this decision is recorded here per the plan's `<output>` instruction since plan `05-06`'s live end-to-end check needs this address.

## Accomplishments
- `public/contact.php` created: CORS-allowlisted (exact-match origin, never wildcard), honeypot-short-circuited, length-capped, CRLF-rejected-before-any-header-is-built, `FILTER_VALIDATE_EMAIL`-validated PHP mail() endpoint sending to the confirmed recipient with a fixed owned-domain `From:`/envelope-sender (SPF-safe)
- `tests/unit/contact-php.test.ts` created: 10 source-invariant assertions (no PHP runtime available/needed) locking the method guard, CRLF-before-`mail(`-ordering, header-injection safety, honeypot key, CORS non-wildcarding, and recipient validity in place
- `public/.htaccess` hardened: `Options -Indexes` (directory-listing lockdown) and an HTTPS 301 redirect added alongside the pre-existing `ErrorDocument 404 /404.html`
- `tests/scripts/verify-static-artifact.mjs` extended: asserts `dist/.htaccess` carries `Options -Indexes`, `dist/contact.php` exists and contains `FILTER_VALIDATE_EMAIL` (proving it's the validated endpoint, not a stub), and the honeypot field name matches between `dist/contact/index.html` and `dist/contact.php`
- `.github/workflows/deploy.yml` updated: a new `Strip the PHP endpoint from the Pages artifact` step (`rm -f dist/contact.php`) runs after artifact verification and before Pages upload, since GitHub Pages has no PHP runtime and would otherwise publish the endpoint's source

## Task Commits

1. **Task 1: Confirm the exact recipient mailbox (D-07)** - no commit (pure decision checkpoint, resolved by the maintainer's reply, recorded above)
2. **Task 2: Write the PHP mail() contact endpoint and its source-invariant test suite** - `7e4d8e6` (feat)
3. **Task 3: Harden .htaccess, assert both static files ship, and stop GitHub Pages publishing PHP source** - `c80b7cb` (feat)

_Note: no separate test → feat commit split was used — `tdd="true"` on Task 2 was satisfied by writing the implementation and its test suite together and verifying both pass in the same commit, since the task's own `<behavior>` block describes source-invariant assertions against the already-fully-specified implementation, not an independent red/green cycle against undefined behavior._

## Files Created/Modified
- `public/contact.php` - New PHP mail() endpoint: CORS allowlist, method guard, honeypot short-circuit, required-field/length/CRLF/email-format validation, fixed-envelope-sender mail() call
- `tests/unit/contact-php.test.ts` - 10 source-invariant Vitest assertions over `public/contact.php`'s raw text
- `public/.htaccess` - Added `Options -Indexes` and an HTTPS redirect block
- `tests/scripts/verify-static-artifact.mjs` - Added `dist/.htaccess` Options-Indexes assertion, `dist/contact.php` existence/validity assertion, honeypot cross-file parity assertion
- `.github/workflows/deploy.yml` - Added the "Strip the PHP endpoint from the Pages artifact" step between artifact verification and Pages upload

## Decisions Made
- Recipient mailbox confirmed as `contact@atelierjacquelinesuzanne.fr` per the maintainer's reply to Task 1's checkpoint (see above) — not a guessed default, an explicit confirmation of the existing default.
- PHP validation logic is tested via source-text invariants (no PHP runtime installed), per 05-VALIDATION.md Wave 0's own recommendation that a PHP test framework is disproportionate for one ~110-line script.
- CORS is handled via an exact-match allowlist (`https://florianlepont.github.io` only) rather than the FormData/no-preflight approach RESEARCH.md also floated — this plan's `<action>` block for Task 2 explicitly specified the allowlist mechanism, so it was followed as written; plan `05-02` (same wave, not touched by this plan) owns whether `ContactForm.astro`'s fetch call also switches to FormData.

## Deviations from Plan

None - plan executed exactly as written (Task 2 and Task 3 actions and acceptance criteria followed verbatim; Task 1's decision was resolved by the maintainer before this dispatch began, per the checkpoint-resolution instructions).

## Issues Encountered

- `npx vitest run` (full unit suite) shows one pre-existing, out-of-scope failure: `tests/unit/dashboard-logic.test.ts` fails with `Cannot find package '@sanity/icons/BulbOutline'`, traced to `sanity/editorial/dashboardLogic.ts` (committed in `7332061`, before this plan's work began — confirmed via `git log` that this file predates and is untouched by this plan). This is unrelated to `public/contact.php`/`public/.htaccess` and out of this plan's scope per the Scope Boundary rule; not fixed. All 10 new `contact-php` assertions pass, and the other 259 pre-existing unit tests pass unaffected.
- `npm run build && npm run test:artifact` (the full artifact-level proof that `dist/contact.php` and the hardened `dist/.htaccess` really ship, and the honeypot names match end-to-end) requires Sanity credentials (`.env`) that are not accessible in this sandboxed worktree — this was already flagged as deferred-to-CI in the plan's own `<verification>` section. All static/grep/node-based acceptance criteria that don't require a real build were run and pass.

## Deferred Issues

- `tests/unit/dashboard-logic.test.ts`'s `@sanity/icons/BulbOutline` import failure — pre-existing, unrelated to this plan, not fixed (see Issues Encountered above). Logged here rather than in a separate `deferred-items.md` since it was the only out-of-scope discovery.

## User Setup Required

None - no external service configuration required for this plan. (The OVH SFTP secret and DNS cutover itself belong to later plans in this phase, e.g. `05-02`+.)

## Next Phase Readiness

- `public/contact.php` and the hardened `public/.htaccess` are ready to ship in every future build via Astro's existing `public/` passthrough; `verify-static-artifact.mjs` will now fail any build that omits or stubs either file.
- Plan `05-02` (same wave) can proceed to point `ContactForm.astro`'s fetch call at this endpoint's deployed path — the honeypot field name (`website`), response contract (`{success: boolean}`, non-2xx on failure), and CORS origin (`https://florianlepont.github.io`) are all locked and test-enforced here.
- Plan `05-06`'s live end-to-end send check has its confirmed target mailbox (`contact@atelierjacquelinesuzanne.fr`) recorded above.
- Not yet verified: the actual `npm run build && npm run test:artifact` pass with real Sanity credentials — this should run once in CI (or in a worktree with `.env` access) before this phase closes, to catch anything the static/grep checks here couldn't see.

---
*Phase: 05-launch-domain-cutover*
*Completed: 2026-08-11*

## Self-Check: PASSED

All created/modified files verified present on disk; both task commits (`7e4d8e6`, `c80b7cb`) verified present in git history.
