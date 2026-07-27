---
phase: quick-260727-kq8
plan: 01
subsystem: ui
tags: [astro, vitest, playwright, wordmark, carousel, css-clip-path]

# Dependency graph
requires:
  - phase: quick-260727-iao
    provides: the mirrored-peek three-layer wordmark cutout with a seam-driven --wm-seam clip-path, which made the drq clamp redundant and is what this plan's fix relies on being safe to skip
provides:
  - "computeWordmarkBackgroundPosition() clampToPhoto opt-out (defaults true, byte-identical existing behavior)"
  - "Both mirrored-peek wordmark call sites (current + peek layer) opted out of the clamp, fixing the current-layer freeze bug"
  - "FR+EN e2e regression coverage proving the current layer's bg-position never freezes across a 0.80-0.995 edge approach"
affects: [home-carousel, homepage]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure function opt-out param pattern: trailing boolean defaulting to the existing/safe behavior, so every pre-existing caller and unit test stays byte-for-byte unaffected while new callers can opt into different behavior explicitly."

key-files:
  created: []
  modified:
    - src/lib/home-carousel.ts
    - tests/unit/home-carousel.test.ts
    - src/components/HomeCarousel.astro
    - tests/e2e/homepage.spec.ts

key-decisions:
  - "Kept the drq clamp as the default (clampToPhoto=true) rather than removing it — it remains correct defensive behavior for any hypothetical caller not gated by the seam clip-path, and preserves every existing unit test unchanged."
  - "Both mirrored-peek call sites (current-layer in syncWordmarkAlignment, peek-layer in syncWordmarkLayers) opt out uniformly since both are equally seam-clip-gated by --wm-seam."

patterns-established:
  - "New optional trailing params on pure src/lib functions must default to the pre-existing behavior so callers/tests are unaffected — proven here on computeWordmarkBackgroundPosition()."

requirements-completed: [QUICK-260727-kq8]

coverage:
  - id: D1
    description: "computeWordmarkBackgroundPosition() gains a clampToPhoto opt-out; default (clamped) behavior is byte-for-byte preserved for every existing caller/test"
    requirement: "QUICK-260727-kq8"
    verification:
      - kind: unit
        ref: "tests/unit/home-carousel.test.ts#returns the raw unclamped x position when clampToPhoto is false"
        status: pass
      - kind: unit
        ref: "tests/unit/home-carousel.test.ts#computeWordmarkBackgroundPosition (all 8 pre-existing cases, including both clamp cases)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Both mirrored-peek wordmark call sites in HomeCarousel.astro opt out of the clamp, fixing the current-layer freeze bug"
    requirement: "QUICK-260727-kq8"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#FR: current-layer bg-position keeps changing across proximity 0.80-0.995, never freezes"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#EN: current-layer bg-position keeps changing across proximity 0.80-0.995, never freezes"
        status: pass
      - kind: other
        ref: "npx astro check (0 errors, new signature + both opt-out call sites type-check)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Full pre-existing mirrored-peek commit and hover seam-growth e2e coverage stays green (no regression)"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts (full suite: 93/93 passing, incl. carousel wordmark mirrored-peek commit and carousel wordmark stays synced to the peek describe blocks)"
        status: pass
    human_judgment: false

duration: 25min
completed: 2026-07-27
status: complete
---

# Quick Task 260727-kq8: Fix Wordmark Current-Layer Freeze Summary

**Added a `clampToPhoto` opt-out to `computeWordmarkBackgroundPosition()` and opted both mirrored-peek wordmark call sites out of it, restoring continuous 1:1 tracking of the current-layer wordmark cutout with the sliding photo at every proximity up to the edge.**

## Performance

- **Duration:** 25 min
- **Started:** 2026-07-27T15:00:00Z
- **Completed:** 2026-07-27T15:25:00Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- `computeWordmarkBackgroundPosition()` in `src/lib/home-carousel.ts` gains a trailing `clampToPhoto: boolean = true` parameter; default (clamped) path is byte-for-byte unchanged, so every pre-existing caller/unit test is unaffected.
- New unit test proves the unclamped path returns the raw, out-of-bounds position (`-500px -100px`) instead of the clamped value (`-400px -100px`), using the exact same geometry as the existing x-clamp test.
- Both mirrored-peek call sites in `HomeCarousel.astro` — the current-layer computation in `syncWordmarkAlignment()` and the peek-layer computation in `syncWordmarkLayers()` — now pass `clampToPhoto=false`, since both are already gated by the `--wm-seam` clip-path that guarantees only in-bounds content ever paints, making the full-box clamp redundant (and the sole cause of the freeze bug).
- New FR+EN Playwright regression walks the right hover-zone proximity sequence `[0.80, 0.85, 0.90, 0.93, 0.95, 0.97, 0.985, 0.995]` and asserts the current layer's `--wordmark-bg-position` samples from proximity 0.85 onward are NOT all identical (at least 3 distinct values) — this reliably fails on the pre-fix code (collapses to exactly 1 distinct value) and passes on the fixed code.

## Task Commits

Each task was committed atomically (TDD RED/GREEN for Task 1):

1. **Task 1 RED: failing unit test for the clampToPhoto opt-out** - `0192ceb` (test)
2. **Task 1 GREEN: add clampToPhoto opt-out to computeWordmarkBackgroundPosition** - `c61a112` (feat)
3. **Task 2: opt both mirrored-peek call sites out of the clamp** - `d736a77` (fix)
4. **Task 3: FR+EN e2e proving no-freeze across an edge approach** - `0da0e48` (test)

**Plan metadata:** committed separately by the orchestrator (docs commit not included here per constraints)

## Files Created/Modified
- `src/lib/home-carousel.ts` - `computeWordmarkBackgroundPosition()` gains the `clampToPhoto` opt-out param; default clamp path unchanged, new unclamped-return branch added
- `tests/unit/home-carousel.test.ts` - new unit test asserting the raw unclamped position when `clampToPhoto=false`
- `src/components/HomeCarousel.astro` - both `computeWordmarkBackgroundPosition()` call sites (current-layer, peek-layer) pass `false` with explanatory comments referencing the seam clip-path invariant
- `tests/e2e/homepage.spec.ts` - new `test.describe` with FR/EN tests proving the current-layer bg-position keeps changing across a right-edge proximity sequence

## Decisions Made
- Kept the drq clamp as the default (`clampToPhoto=true`) instead of removing it outright — it remains correct defensive behavior for any hypothetical caller not gated by the seam clip-path, and this choice is what keeps every pre-existing unit test byte-for-byte unaffected.
- Both mirrored-peek call sites opt out uniformly (not just the buggy current-layer one) since both are equally seam-clip-gated by `--wm-seam` and the plan explicitly called for this symmetry.

## Deviations from Plan

None — plan executed exactly as written. One out-of-scope, pre-existing issue was discovered and logged (not fixed, per scope boundary rules) — see `deferred-items.md` in this directory: `tests/unit/dashboard-logic.test.ts` fails to import in this worktree because the `sanity/` subproject's own `node_modules` isn't installed here (missing `@sanity/icons`). This is an unrelated worktree environment gap, not caused by or related to this plan's changes; all 130 non-Sanity unit tests pass.

## Issues Encountered
- **Stale port-4321 server during e2e verification:** an orphaned `astro dev` process (PPID 1, started ~30 min earlier from the main repo checkout, not this worktree) was already listening on `localhost:4321`. Because `playwright.config.ts` sets `reuseExistingServer: !process.env.CI`, Playwright silently reused that stale server instead of building/serving this worktree's code, producing misleading results (a frozen wordmark position at ALL proximities, including in a from-scratch `clampToPhoto=false` build) during initial debugging. Stopped the orphaned process, rebuilt, and started a fresh `astro preview` bound to this worktree's `dist/` before re-verifying. This was purely a local verification-environment artifact, not a code issue — resolved without touching any plan files.
- **Controlled RED/GREEN e2e verification:** to be certain the new e2e test genuinely fails on pre-fix code (not just an artifact of the port issue above), temporarily reverted the two `clampToPhoto: false` call-site arguments to `true`, rebuilt, and reran the new test — confirmed it fails with `distinct.size === 1` (frozen), then restored the fix, rebuilt, and reran the full 93-test `homepage.spec.ts` suite to confirm 93/93 green with no regressions.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Wordmark current-layer freeze bug is fully fixed and regression-covered; no known follow-up work.
- `deferred-items.md` in this directory documents the unrelated `sanity/` subproject `node_modules` gap in this worktree for anyone investigating `dashboard-logic.test.ts` failures later.

---
*Phase: quick-260727-kq8*
*Completed: 2026-07-27*

## Self-Check: PASSED

All 6 claimed files found on disk (src/lib/home-carousel.ts, tests/unit/home-carousel.test.ts, src/components/HomeCarousel.astro, tests/e2e/homepage.spec.ts, this SUMMARY.md, deferred-items.md). All 4 claimed commit hashes (0192ceb, c61a112, d736a77, 0da0e48) found in `git log --oneline --all`.
