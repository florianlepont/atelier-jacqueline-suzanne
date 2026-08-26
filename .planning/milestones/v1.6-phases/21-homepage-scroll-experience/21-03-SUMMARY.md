---
phase: 21-homepage-scroll-experience
plan: 03
subsystem: testing
tags: [playwright, e2e, reduced-motion, regression-testing]

requires:
  - phase: 20-mobile-navigation-accent-color
    provides: The mobile hamburger nav (mobile-nav-toggle/dialog#mobile-nav) and per-visit random accent color this plan's reduced-motion preamble and accent-liveness assertions build on.
provides:
  - A Playwright suite that stays green at every commit of phase 21, before, during, and after plan 21-04 retires the carousel/grid below 767px
  - A reduced-motion route (`page.emulateMedia({ reducedMotion: 'reduce' })`) for every phone-width homepage test that needs an interactive header/mobile-nav-toggle/dialog at scroll position 0
  - Retired phone-width carousel/grid assertions (mode-toggle visibility, HOME-06 full-bleed hero, carousel-intro clamp) that phase 21 makes structurally impossible below 767px
affects: [21-04-homepage-scroll-deck]

tech-stack:
  added: []
  patterns:
    - "Reduced-motion preamble as the deterministic route to an interactive homepage header at scroll position 0, once a scroll-driven UI can otherwise hide it (D-12/D-15 pattern for plan 21-04's wordmark zoom)"

key-files:
  created: []
  modified:
    - tests/e2e/critical.smoke.spec.ts
    - tests/e2e/accessibility.spec.ts
    - tests/e2e/mobile-nav.spec.ts
    - tests/e2e/homepage-mobile-responsive.spec.ts
    - tests/e2e/homepage-content-display.spec.ts

key-decisions:
  - "Retired the pre-existing 'the mode-toggle still ships on mobile' test in mobile-nav.spec.ts (not named in the plan's Task 1 action, only the combined HOME-13/HOME-16 test was) because it directly contradicted this plan's own success criterion ('nothing asserts the mode toggle is visible below 768px') and would go red the moment plan 21-04 lands — same fix class as the named test, applied via Rule 1 (plan-internal contradiction)."
  - "Added the reduced-motion preamble once inside mobile-nav.spec.ts's shared openPanel(page) helper, per the plan's own preference, rather than repeating it across all 11 tests that call it."

requirements-completed: [HOME-14]

coverage:
  - id: D1
    description: "Every phone-width homepage test that touches the site header/mobile-nav-toggle/dialog now forces reduced motion, so it reaches an interactive header at scroll position 0 independent of D-12's future zoom-hidden state"
    requirement: "HOME-14"
    verification:
      - kind: e2e
        ref: "npx playwright test mobile-nav accessibility critical.smoke --project=chromium (72 tests)"
        status: pass
      - kind: e2e
        ref: "npx playwright test critical.smoke --project=webkit-mobile (5 tests)"
        status: pass
    human_judgment: false
  - id: D2
    description: "No test in the suite asserts the carousel/grid mode-toggle is visible below 768px; retired phone-width carousel/grid assertions (HOME-06 full-bleed hero, 375px hero test, 393px carousel-intro test, 375x812 grid-intro test) each replaced by a phase-21 explanatory comment"
    requirement: "HOME-14"
    verification:
      - kind: e2e
        ref: "npx playwright test --project=chromium (364 tests) and --project=webkit-mobile (5 tests), against unchanged src/ — full green baseline"
        status: pass
    human_judgment: false

duration: ~20min
completed: 2026-08-04
status: complete
---

# Phase 21 Plan 03: Pre-emptive E2E Suite Reconciliation Summary

**Reduced-motion preamble added to every phone-width homepage header/nav test, and phone-width carousel/grid assertions phase 21 retires are replaced with explanatory comments — zero `src/` changes, full suite green on both Playwright projects.**

## Performance

- **Duration:** ~20 min
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- `openPanel(page)` helper in `mobile-nav.spec.ts` and 10 other phone-width header/toggle/dialog tests across `mobile-nav.spec.ts`, `critical.smoke.spec.ts`, and `accessibility.spec.ts` now call `page.emulateMedia({ reducedMotion: 'reduce' })` before `page.goto(...)`, giving them a deterministic route to an interactive header at scroll position 0 that survives D-12's future zoom-hidden state (via D-15's full scroll-driver detachment under reduced motion).
- Retired the mode-toggle visibility assertion in the combined HOME-13/HOME-16 test in `mobile-nav.spec.ts`, plus a second pre-existing "the mode-toggle still ships on mobile" test that the plan's Task 1 action didn't explicitly name but that carried the identical contradiction with this plan's own success criteria.
- Deleted `homepage-mobile-responsive.spec.ts`'s opening 375px hero/mode-toggle test and its entire iPhone 14 Pro "mobile full-bleed hero regression (HOME-06)" describe block — the footer-hidden claim in that block is directly reversed by phase 21's own D-08 (footer must be reachable after the last gallery slide), so the deletion comment records that reversal explicitly.
- Deleted `homepage-content-display.spec.ts`'s 393px carousel-intro clamp test and 375x812 grid-intro mode-toggle test (the desktop twin immediately above the latter already covers the same clamp/clipping claim at a viewport where the grid still exists).
- Removed the now-unused `devices` import from `homepage-mobile-responsive.spec.ts` after deleting its only consumer.
- Full suite verified green on both Playwright projects (364 tests on chromium, 5 on webkit-mobile) against unmodified `src/` — the plan's core "no red window mid-phase" property.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add a reduced-motion preamble to every phone-width homepage test that touches the site header (D-12/D-15)** - `36b7ddc` (test)
2. **Task 2: Retire the phone-width carousel/grid behavior assertions that phase 21 supersedes** - `3795ec9` (test)

_Note: Task 1's commit also includes the un-named "mode-toggle still ships on mobile" test retirement (see Deviations below)._

## Files Created/Modified
- `tests/e2e/critical.smoke.spec.ts` - Added reduced-motion preamble to the mobile-nav open/close smoke test (the sole test in this file exercised by the `webkit-mobile` Playwright project)
- `tests/e2e/accessibility.spec.ts` - Added reduced-motion preamble to both the closed-header and open-panel 393x852 axe loops
- `tests/e2e/mobile-nav.spec.ts` - Reduced-motion preamble added to the shared `openPanel()` helper and 8 other phone-width header/dialog tests; retired 2 mode-toggle visibility assertions (the combined HOME-13/HOME-16 test, and the standalone Phase 20 anti-scope-creep test)
- `tests/e2e/homepage-mobile-responsive.spec.ts` - Deleted the 375px hero test and the HOME-06 iPhone 14 Pro describe block; removed the unused `devices` import; kept the 320px overflow tests and tall-desktop describe untouched
- `tests/e2e/homepage-content-display.spec.ts` - Deleted the 393px carousel-intro test and the 375x812 grid-intro mode-toggle test; kept both desktop twins untouched

## Decisions Made
- Reduced-motion calls placed before `page.goto(...)` in every case (Playwright applies media emulation to the subsequent navigation), matching the exact call shape already used elsewhere in the suite (`homepage-carousel-core.spec.ts`, `homepage-content-display.spec.ts`, `about.spec.ts`, `not-found.spec.ts`, `gallery.spec.ts`, `edition.spec.ts`).
- Added the reduced-motion call once inside `mobile-nav.spec.ts`'s shared `openPanel(page)` helper rather than repeating it across all 11 callers, per the plan's own stated preference.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Plan-internal contradiction] Retired a second, un-named mode-toggle-visibility test in mobile-nav.spec.ts**
- **Found during:** Task 1 (reading the full file per `<read_first>` before editing)
- **Issue:** `mobile-nav.spec.ts` contains an earlier standalone test, `` `${path}: the mode-toggle still ships on mobile` ``, written during Phase 20 explicitly as an anti-scope-creep guard (its own comment: "Removing the carousel/grid mode-toggle is Phase 21's scope, not this phase's — a regression here would be silent scope creep"). Task 1's `<action>` text only named the combined HOME-13/HOME-16 test for the mode-toggle-assertion removal, but this second test asserts the exact same thing (`toBeVisible()` at 393px) and would go red the moment plan 21-04 retires the control — directly contradicting this plan's own success criterion ("Nothing in the suite asserts the mode toggle is visible below 768px") and stated purpose (no red window mid-phase).
- **Fix:** Deleted the test body, replaced with a comment recording the retirement and pointing at the new `homepage-scroll-deck.spec.ts` (plan 21-04) as the source of the positive absence-assertion.
- **Files modified:** `tests/e2e/mobile-nav.spec.ts`
- **Verification:** `grep -n "mode-toggle" tests/e2e/mobile-nav.spec.ts` shows no remaining assertion, only explanatory comments; full suite re-run green on both projects.
- **Committed in:** `36b7ddc` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 plan-internal contradiction, Rule 1)
**Impact on plan:** Necessary to satisfy the plan's own stated success criteria; no scope creep beyond the plan's explicit target (mode-toggle visibility assertions below 768px).

## Issues Encountered
- The worktree's `.env` (SANITY_PROJECT_ID/SANITY_DATASET, gitignored) was absent, causing `npm run build` to fail during static-path generation. Copied the main checkout's `.env` into the worktree (not a git-tracked change) so the build/test verification commands could run; this is local dev environment setup, not a plan deviation.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- The e2e suite is now reconciled with the mobile homepage rewrite: every phone-width homepage test either survives D-12 via the reduced-motion route, or has had its retired-behavior assertions removed and replaced with a pointer to `homepage-scroll-deck.spec.ts`.
- Plan 21-04 (the wordmark zoom + scroll-snapped deck) can now land without breaking this suite mid-phase — its acceptance criteria are expected to add the replacement coverage this plan's comments point at.
- Still-valid guards (320px/393px horizontal-overflow checks, desktop/tablet carousel behavior, random starting accent) are all confirmed intact by the full 364-test chromium run and 5-test webkit-mobile run, both green against unmodified `src/`.

---
*Phase: 21-homepage-scroll-experience*
*Completed: 2026-08-04*

## Self-Check: PASSED
