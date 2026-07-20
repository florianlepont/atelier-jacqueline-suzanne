---
phase: quick-260720-dzs
plan: 01
subsystem: ui
tags: [astro, vitest, playwright, home-carousel, refactor]

requires: []
provides:
  - "src/lib/home-carousel.ts: computeWordmarkBackgroundPosition and detectSwipeDirection as pure, DOM-free, framework-agnostic functions"
  - "tests/unit/home-carousel.test.ts: unit coverage for both extracted functions"
affects: [homepage, home-carousel]

tech-stack:
  added: []
  patterns:
    - "src/lib/ pure-module convention (mirroring i18n-paths.ts / site-config.ts): extract DOM-adjacent computational logic from inline component <script> blocks into plain-TypeScript, no-import modules for direct unit-test coverage"

key-files:
  created:
    - src/lib/home-carousel.ts
    - tests/unit/home-carousel.test.ts
  modified:
    - src/components/HomeCarousel.astro

key-decisions:
  - "Byte-for-byte transcription of the existing crop/scale/offset and swipe-threshold math into the new module — no formula was re-derived, matching the plan's zero-behavior-change objective"
  - "Component script keeps all DOM work (getBoundingClientRect, style.setProperty, touch-event wiring); pure functions only receive/return primitives"

patterns-established:
  - "Pure-logic extraction from inline Astro <script> blocks: identify DOM-free math, move to src/lib/*.ts with matching tests/unit/*.test.ts, then delegate from the component script via ES import (Astro/Vite bundles imports inside processed <script> tags)"

requirements-completed: [QUICK-260720-dzs]

coverage:
  - id: D1
    description: "computeWordmarkBackgroundPosition extracted as a pure function, covering normal cases (square image, wide image with crop) and guard cases (zero heroRect width/height, zero natural width/height)"
    requirement: "QUICK-260720-dzs"
    verification:
      - kind: unit
        ref: "tests/unit/home-carousel.test.ts#computeWordmarkBackgroundPosition"
        status: pass
    human_judgment: false
  - id: D2
    description: "detectSwipeDirection extracted as a pure function, covering clear left/right swipes and null cases (below min distance, insufficiently horizontal)"
    requirement: "QUICK-260720-dzs"
    verification:
      - kind: unit
        ref: "tests/unit/home-carousel.test.ts#detectSwipeDirection"
        status: pass
    human_judgment: false
  - id: D3
    description: "HomeCarousel.astro's <script> imports and delegates to both extracted functions in place of the former inline math; wordmark pixel-alignment and swipe navigation behavior is unchanged"
    requirement: "QUICK-260720-dzs"
    verification:
      - kind: unit
        ref: "npm run test:unit (51/51 passing)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts (all 34 homepage/carousel tests passing, including 'carousel wordmark cutout (HOME-03, D-08)' and swipe/keyboard-nav/mobile-hero coverage)"
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-07-20
status: complete
---

# Quick Task 260720-dzs: Extract HomeCarousel Pure Logic Summary

**Extracted HomeCarousel.astro's wordmark-crop and swipe-direction math into a pure, unit-tested `src/lib/home-carousel.ts` module, following the existing `i18n-paths.ts`/`site-config.ts` convention — zero behavior change, confirmed by the full e2e suite.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-20T09:32:00Z
- **Completed:** 2026-07-20T09:44:00Z
- **Tasks:** 2
- **Files modified:** 3 (2 created, 1 modified)

## Accomplishments

- `computeWordmarkBackgroundPosition` and `detectSwipeDirection` now live in `src/lib/home-carousel.ts` as pure, DOM-free, import-free TypeScript functions, directly unit-testable outside of Playwright for the first time.
- 10 new unit tests in `tests/unit/home-carousel.test.ts` cover both normal cases and every documented edge case (zero-dimension/zero-natural-size guards, below-min-distance swipes, insufficiently-horizontal swipes).
- `HomeCarousel.astro`'s `<script>` now imports and delegates to both functions instead of computing the math inline — the component retains only DOM reads/writes and event wiring.
- Full `npm run test:e2e` suite run twice (once mid-plan, once for final verification) confirms zero regression in the wordmark photo-cutout alignment, touch-swipe navigation, keyboard navigation, and mobile-hero rendering.

## Task Commits

Each task was committed atomically (TDD RED → GREEN, then a mechanical delegation swap):

1. **Task 1 (RED): add failing unit tests for HomeCarousel pure logic** - `98d502a` (test)
2. **Task 1 (GREEN): extract HomeCarousel pure logic into src/lib/home-carousel.ts** - `f9a6f9a` (feat)
3. **Task 2: wire HomeCarousel.astro to extracted pure functions** - `5da7aff` (refactor)

_Note: Task 1 used TDD (test → feat); Task 2 was a pure mechanical delegation swap, not new behavior, so it is a single `refactor` commit._

## Files Created/Modified

- `src/lib/home-carousel.ts` - New pure module: `Rect`/`WordmarkBackground` types, `computeWordmarkBackgroundPosition()`, `SwipeDirection` type, `detectSwipeDirection()`
- `tests/unit/home-carousel.test.ts` - New unit test file, `describe`/`it`/`expect` style matching `i18n-paths.test.ts`/`site-config.test.ts`
- `src/components/HomeCarousel.astro` - `<script>` now imports from `../lib/home-carousel`; `syncWordmarkAlignment()` delegates to `computeWordmarkBackgroundPosition()` (keeping only the element-presence guard, `OBJECT_POSITION_X/Y` constants, DOM reads, and `style.setProperty` writes); the `touchend` handler delegates to `detectSwipeDirection()` (keeping only the `SWIPE_MIN_DISTANCE`/`SWIPE_DIRECTION_RATIO` constants and touch-event DOM wiring)

## Decisions Made

- Transcribed both formulas byte-for-byte rather than re-deriving them, per the plan's explicit "PURE REFACTOR — zero behavior change" objective; verified against the plan's worked examples (1000x1000 square image and 2000x1000 wide image cases) before writing the module, both producing the exact expected `size`/`position` strings.
- Kept all DOM access (`getBoundingClientRect()`, `style.setProperty()`, touch-event listeners) in the component script; the extracted functions take only numeric primitives and rect-shaped objects, matching the plan's threat model disposition (no new trust boundary, no DOM/import surface in the pure module).

## Deviations from Plan

None - plan executed exactly as written. One out-of-scope discovery is logged below per the SCOPE BOUNDARY rule.

### Out-of-Scope Discovery (not fixed, logged only)

`tests/e2e/about.spec.ts:63` ("the header nav links to the About page") fails with a 30s timeout waiting for the header nav link on `/contact/`. This test does not touch `HomeCarousel.astro`, `home-carousel.ts`, or any file in this plan's scope. Confirmed via a temporary detached worktree at the plan's base commit (`bfec9ab8fa538058dc9ed749e0f0e388100cb10c`, before any of this plan's changes) that the identical failure exists on the pristine base — pre-existing, unrelated to this refactor. Per the deviation rules' SCOPE BOUNDARY ("Only auto-fix issues DIRECTLY caused by the current task's changes... Pre-existing... failures in unrelated files are out of scope"), this was not fixed. Logged here (and should be added to `deferred-items.md` in the phase directory by the orchestrator) for future follow-up.

## Issues Encountered

None beyond the out-of-scope discovery above, which did not block this plan's work.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The `src/lib/` pure-module extraction pattern is now demonstrated a third time (after `i18n-paths.ts`, `site-config.ts`), reinforcing the convention for any future DOM-adjacent computational logic elsewhere in the codebase.
- Pre-existing `tests/e2e/about.spec.ts` nav-link failure remains open and unrelated to this plan; a future quick task or debug session should investigate it independently (it was NOT introduced or worsened by this refactor).

---
*Phase: quick-260720-dzs*
*Completed: 2026-07-20*

## Self-Check: PASSED

- FOUND: src/lib/home-carousel.ts
- FOUND: tests/unit/home-carousel.test.ts
- FOUND: src/components/HomeCarousel.astro
- FOUND: .planning/quick/260720-dzs-extract-homecarousel-astro-s-pure-comput/260720-dzs-SUMMARY.md
- FOUND: 98d502a (test commit)
- FOUND: f9a6f9a (feat commit)
- FOUND: 5da7aff (refactor commit)
