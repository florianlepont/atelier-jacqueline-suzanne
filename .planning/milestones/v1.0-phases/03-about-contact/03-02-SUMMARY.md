---
phase: 03-about-contact
plan: 02
subsystem: ui
tags: [astro, contact-form, web3forms, honeypot, vanilla-js, playwright]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: BaseLayout.astro shared chrome, astro:i18n locale routing
  - phase: 03-about-contact/03-01
    provides: About nav link precedent in BaseLayout.astro (this plan extends the same nav)
provides:
  - FR/EN Contact page routes (/contact/, /en/contact/) hosting the ContactForm island
  - src/lib/contact-form.ts pure validation/honeypot functions (isHoneypotTriggered, isValidEmail, isBlank)
  - src/components/ContactForm.astro dependency-free vanilla-JS form island
  - Contact nav link in BaseLayout.astro (both locales)
  - tests/e2e/contact.spec.ts (mocked-network success/honeypot/validation/reachability assertions)
  - PUBLIC_WEB3FORMS_ACCESS_KEY documented in .env.example
affects: [04-legal-compliance]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Client-shipped pure-function module (contact-form.ts): no astro:i18n/sanity/Node imports, safe for both Vitest and the browser bundle"
    - "Form island passes localized copy to its <script> via data-* attributes on the <form> element (script cannot read Astro frontmatter directly), mirroring Lightbox.astro's data-src/data-alt convention"
    - "Honeypot short-circuit runs before any network call, decoupled from the backend vendor (Web3Forms)"
    - "Playwright page.route() network mocking — no real Web3Forms endpoint hit in CI (Pitfall 2)"

key-files:
  created:
    - src/lib/contact-form.ts
    - src/components/ContactForm.astro
    - src/pages/contact.astro
    - src/pages/en/contact.astro
    - tests/unit/contact-form.test.ts
    - tests/e2e/contact.spec.ts
  modified:
    - src/layouts/BaseLayout.astro
    - .env.example

key-decisions:
  - "Localized form copy computed once in ContactForm.astro's frontmatter, then passed to the client <script> via data-* attributes on the <form> (no way for a plain <script> tag to read Astro frontmatter consts at runtime)"
  - "Honeypot hidden via position:absolute;left:-9999px (not display:none/visibility:hidden) so Playwright's .fill() can exercise it while it stays invisible/unreachable to real visitors and assistive tech — matches 03-UI-SPEC.md's locked contract"
  - "Form-level submission-error copy hardcodes contact@atelierjacquelinesuzanne.fr per 03-CONTEXT.md's D-07 clarification (not the reversed-word-order legacy address found on the old site)"

patterns-established:
  - "Form island with data-* attribute bridge for localized strings between Astro frontmatter and a plain <script> tag"

requirements-completed: [CONT-01, CONT-02]

# Metrics
duration: 10min
completed: 2026-07-08
---

# Phase 3 Plan 2: Contact Form Summary

**Dependency-free vanilla-JS contact form (name/email/message) submitting via mocked-in-CI `fetch()` to Web3Forms, with a client-side honeypot short-circuit and inline FR/EN success/validation states, reachable via a new header nav link in both locales.**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-07-08T05:37:29Z (base commit)
- **Completed:** 2026-07-08T05:47:21Z
- **Tasks:** 3
- **Files modified:** 8 (6 created, 2 modified)

## Accomplishments
- `src/lib/contact-form.ts` ships three pure, dependency-free functions (`isHoneypotTriggered`, `isValidEmail`, `isBlank`) — unit-tested directly and safe to import into the client bundle (no `astro:i18n`/Sanity/Node imports)
- `src/components/ContactForm.astro` mirrors `Lightbox.astro`'s vanilla-JS island pattern: honeypot check runs before any network call, per-field validation renders `role="alert"` errors, submit POSTs JSON to `https://api.web3forms.com/submit`, and an `aria-live="polite"` region shows inline success/error text with no page navigation (D-09)
- `/contact/` and `/en/contact/` render the full vertical slice and are reachable via a new Contact link in `BaseLayout.astro`'s primary nav (both locales)
- Full RED→GREEN TDD gate followed for Task 2 (`test(03-02)` commit before `feat(03-02)` commit)
- Full test suite green: 23 unit tests (3 files), 20 e2e tests (4 spec files, including the new 6-test `contact.spec.ts`) — no regressions to the existing About/gallery/i18n suites
- `npm run build` prerenders both `/contact/` and `/en/contact/` routes

## Task Commits

Each task was committed atomically:

1. **Task 1: RED — Unit tests + Playwright e2e (mocked network + honeypot)** - `fac250e` (test)
2. **Task 2: GREEN core — Pure functions + ContactForm island + env var** - `e75e9a0` (feat)
3. **Task 3: Wire — FR/EN contact pages + Contact nav link** - `37425d9` (feat)

**Plan metadata:** (this commit, docs: complete plan)

## TDD Gate Compliance

Task 2 (`tdd="true"`) followed the RED→GREEN sequence correctly:
- RED: `fac250e` (`test(03-02): add failing unit + e2e tests for contact form (RED)`) — confirmed failing (module absent, routes 404) before any implementation.
- GREEN: `e75e9a0` (`feat(03-02): implement contact-form pure functions + ContactForm island (GREEN)`) — confirmed `npx vitest run tests/unit/contact-form.test.ts` passing (10/10) after implementation.
- No separate REFACTOR commit was needed (no cleanup pass required after GREEN).

## Files Created/Modified
- `src/lib/contact-form.ts` - `isHoneypotTriggered`, `isValidEmail`, `isBlank` pure functions, each JSDoc-cited to 03-RESEARCH.md's Pattern 1
- `src/components/ContactForm.astro` - form island: name/email/message fields, honeypot, submit button, `aria-live` status region, typed `<script>` submit handler, scoped styles reusing existing tokens (first live use of `--color-destructive`)
- `src/pages/contact.astro` / `src/pages/en/contact.astro` - FR/EN Contact pages mounting `<ContactForm locale={locale} />`
- `src/layouts/BaseLayout.astro` - added `contactLabel`/`contactHref` computed values and a Contact `<a>` link in the primary nav, after the About link
- `.env.example` - documented `PUBLIC_WEB3FORMS_ACCESS_KEY` (PUBLIC_-prefix rationale, obtained from Web3Forms dashboard, not a secret)
- `tests/unit/contact-form.test.ts` - unit coverage for all three pure functions
- `tests/e2e/contact.spec.ts` - success (FR/EN), honeypot no-network-call, per-field validation, nav reachability — network mocked via `page.route()` per 03-RESEARCH.md Pitfall 2

## Decisions Made
- Followed the plan's data-attribute bridge design exactly: since a plain `<script>` tag cannot read Astro frontmatter consts, all localized copy the script needs at runtime (button labels, success/error text, per-field error strings) is passed via `data-*` attributes on the `<form>` element itself.
- Kept the honeypot's off-screen-but-attached hiding technique (`position: absolute; left: -9999px`) exactly as locked in 03-UI-SPEC.md, confirming it remains `.fill()`-able by Playwright while staying invisible/unannounced to real visitors and assistive tech.
- Hardcoded the confirmed `contact@atelierjacquelinesuzanne.fr` address in the form-level submission-error copy per 03-CONTEXT.md's D-07 clarification, not the reversed-word-order legacy address found on the old live site.

## Deviations from Plan

None — plan executed exactly as written. One environmental note (not a code deviation, consistent with 03-01-SUMMARY.md): the worktree lacked a local `.env` (gitignored, not checked into git) needed for `astro build` to resolve `SANITY_PROJECT_ID`/`SANITY_DATASET`/`SANITY_API_READ_TOKEN` at build time; copied the existing `.env` from the main repo checkout into the worktree to run the verification build/e2e suite. This file remains gitignored and was not committed.

## Issues Encountered
- Initial JSDoc comment in `src/lib/contact-form.ts` literally contained the substring `astro:i18n` while explaining the constraint *not* to import it, which would have falsely failed the acceptance-criteria grep (`grep -q "astro:i18n" src/lib/contact-form.ts` must return nothing). Reworded the comment to describe the constraint without using the literal import-path string, verified the grep now returns nothing while the code itself never imports it.

## User Setup Required

**Web3Forms access key (real delivery)** — not required for any automated test in this plan (all network calls are mocked in CI per 03-RESEARCH.md Pitfall 2), but required before the end-of-phase human-check can run:
1. Sign up at web3forms.com using the `atelierjacquelinesuzanne.fr` mailbox (confirmed destination per 03-CONTEXT.md D-07 clarification — NOT the reversed-word-order `jacquelinesuzanneatelier.fr` address from the old site).
2. Add the issued access key as `PUBLIC_WEB3FORMS_ACCESS_KEY` to the local `.env` and to the GitHub repo variables/secrets so the deployed build inlines it.

## Next Phase Readiness
- CONT-01 and CONT-02 are code-complete and automated-test-verified (unit + e2e, all mocked). The plan's `<human-check>` (real end-to-end delivery to Romane's inbox, honeypot silently discarded) is queued for **end-of-phase** confirmation per `03-VALIDATION.md`'s Manual-Only Verifications — it requires the Web3Forms access key to be deployed first, which is outside this plan's automated scope. Not a blocker for this plan's completion; tracked as the phase-level manual gate before `/gsd:verify-work`.
- Both About (03-01) and Contact (03-02) waves are complete; Phase 4 (Legal & Compliance) can proceed — its privacy notice needs to describe this contact form's data handling (Web3Forms relay, no server-side storage in this codebase).

---
*Phase: 03-about-contact*
*Completed: 2026-07-08*

## Self-Check: PASSED

All created/modified files confirmed present on disk; all three task commits (fac250e, e75e9a0, 37425d9) confirmed in git log.
