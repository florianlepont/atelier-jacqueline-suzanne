---
phase: 21-homepage-scroll-experience
plan: 02
subsystem: testing
tags: [playwright, e2e, touch-events, carousel, regression-fix]

# Dependency graph
requires:
  - phase: 20-mobile-navigation-accent-color
    provides: CR-01 (D-11) bug report — control tap hijacked into gallery navigation
provides:
  - Early-return guard in the existing .home-hero__photo touchend handler excluding .home-hero__caption descendants (progress dashes, autoplay toggle)
  - Regression test proving a tablet-width control tap no longer navigates or enters the opening state
  - Re-scoped touch e2e coverage (iPad gen 7, 810x1080) that survives plan 21-04's carousel retirement below 767px
affects: [21-04, 21-05, 21-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Touch-target exclusion guard: mirror an existing click-handler's closest('.home-hero__caption') exclusion in the sibling touchend handler rather than adding a second listener"

key-files:
  created: []
  modified:
    - tests/e2e/homepage-wordmark-peek.spec.ts
    - src/components/HomeCarousel.astro

key-decisions:
  - "Re-scoped both mobile test.describe blocks and the grid hero wordmark cutout test from iPhone 14 Pro (393px) to iPad (gen 7) (810x1080) so the coverage still exercises live code after plan 21-04 hides the carousel/grid below 767px"
  - "Fixed CR-01 in the EXISTING carousel touchend handler (not the new mobile scroll deck), since that handler stays live for touchscreen tablets at 768px+ per phase success criterion 5"

patterns-established:
  - "Touch-event target guards mirror their click-handler sibling's exclusion selector rather than duplicating logic in a new listener"

requirements-completed: [HOME-14]

coverage:
  - id: D1
    description: "Carousel touch coverage re-scoped from phone width (iPhone 14 Pro) to tablet width (iPad gen 7), including retiring the mobile half of the grid hero wordmark cutout test"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage-wordmark-peek.spec.ts — 'touchscreen tablet (>=768px)' describe blocks and 'grid hero wordmark, desktop (HOME-03, D-05)'"
        status: pass
    human_judgment: false
  - id: D2
    description: "CR-01 (D-11) fixed: a tap on a progress dash or the autoplay toggle no longer navigates away from the homepage or enters the opening state"
    requirement: "HOME-14"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage-wordmark-peek.spec.ts#a tap on a progress dash does not navigate away or enter the opening state"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage-wordmark-peek.spec.ts#a tap on the autoplay toggle does not navigate away or enter the opening state"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage-wordmark-peek.spec.ts#a tap on the photo (negligible movement) opens the current gallery (regression guard — real tap-to-open still works)"
        status: pass
    human_judgment: false

duration: 10min
completed: 2026-08-04
status: complete
---

# Phase 21 Plan 02: Carousel Touch Regression Fix + Test Re-scope Summary

**Fixed the D-11/CR-01 control-tap-hijack bug in the existing carousel's touchend handler and re-scoped its touch e2e coverage from phone width to tablet width so it survives the carousel's later retirement below 767px**

## Performance

- **Duration:** ~10 min
- **Completed:** 2026-08-04
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Re-scoped both `test.describe('mobile', ...)` blocks in `homepage-wordmark-peek.spec.ts` from `devices['iPhone 14 Pro']` (393px) to `devices['iPad (gen 7)']` (810x1080), renamed to `touchscreen tablet (>=768px)`, with comments explaining why (phase 21 retires the carousel below 767px)
- Retired the mobile half of the `grid hero wordmark cutout` test (the 393px cutout assertion, since the mobile grid hero tile is retired by this phase), keeping only the desktop D-05 no-cutout guard, renamed accordingly
- Added a failing (RED) regression test proving a real-coordinate tap on a progress dash or the autoplay toggle bubbles up and incorrectly triggers `openCurrent()` — confirming CR-01 reproduces on tablet-width touch devices
- Added an early-return guard as the first statement of the existing `.home-hero__photo` `touchend` listener, excluding any target inside `.home-hero__caption` — mirroring the desktop click handler's own existing exclusion (GREEN)
- Verified the pre-existing tap-to-open and swipe cases still pass (the guard doesn't break real interactions), and the full chromium e2e suite (372 tests) plus typecheck/lint are green

## Task Commits

Each task was committed atomically:

1. **Task 1: Re-scope touch coverage to tablet width** - `b054594` (test)
2. **Task 2 (RED): Add failing CR-01 regression test** - `9d0a443` (test)
2. **Task 2 (GREEN): Guard touchend handler against caption control taps** - `8f58128` (fix)

**Plan metadata:** (this SUMMARY commit, following)

## Files Created/Modified
- `tests/e2e/homepage-wordmark-peek.spec.ts` - Re-scoped both `mobile` describes to `touchscreen tablet (>=768px)` at iPad (gen 7); retired the mobile half of the grid hero wordmark cutout test; added two new control-tap regression cases
- `src/components/HomeCarousel.astro` - Added an early-return `closest('.home-hero__caption')` guard as the first statement of the existing `.home-hero__photo` `touchend` listener (D-11, CR-01)

## Decisions Made
- Used `devices['iPad (gen 7)']` (810x1080) rather than an arbitrary custom viewport, since it's a real Playwright device descriptor that stays `hasTouch`/`isMobile` while sitting comfortably above the 768px breakpoint
- Kept the destructure-and-spread `defaultBrowserType`-stripping idiom intact when swapping device descriptors, per the plan's explicit instruction to preserve that existing pattern
- Fixed CR-01 in the pre-existing carousel handler rather than deferring to the new mobile scroll deck (plans 21-04 through 21-06), because this handler is the one phase success criterion 5 requires to keep working unchanged on tablets ≥768px

## Deviations from Plan

None - plan executed exactly as written. One local-environment fix was needed to run verification: the worktree lacked a `.env` file (Sanity credentials) required for `astro build`; copied it from the main checkout's existing (gitignored, already-provisioned) `.env` — no code or content change, purely a local test-running prerequisite, not committed (already gitignored).

## Issues Encountered
- A stale `astro preview` server from an earlier verification run in this same session was still listening on port 4321, serving a pre-guard build and causing the first post-guard test run to appear to fail. Killed the stale process and rebuilt; the guard then verified correctly. No code issue — a local test-environment artifact, not a plan or implementation defect.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- CR-01/D-11 is closed with a regression test in place before any new mobile scroll deck markup exists (plans 21-04+), so the fix is provable against the carousel as it stands today, per the plan's stated ordering rationale
- The touch e2e coverage in `homepage-wordmark-peek.spec.ts` now runs at a viewport (810px) that will remain valid once plan 21-04 hides the carousel/grid below 767px — no further re-scoping needed in that later plan
- Desktop and tablet carousel/grid behavior is otherwise unchanged (UI-02, phase success criterion 5), confirmed by the full 372-test chromium e2e suite passing

---
*Phase: 21-homepage-scroll-experience*
*Completed: 2026-08-04*

## Self-Check: PASSED

- FOUND: `.planning/phases/21-homepage-scroll-experience/21-02-SUMMARY.md`
- FOUND: `b054594` (test: re-scope touch coverage)
- FOUND: `9d0a443` (test: RED — failing CR-01 regression)
- FOUND: `8f58128` (fix: GREEN — touchend guard)
- FOUND: `e18a883` (docs: plan summary)
