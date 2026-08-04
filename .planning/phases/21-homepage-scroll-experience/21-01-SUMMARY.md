---
phase: 21-homepage-scroll-experience
plan: 01
subsystem: ui
tags: [vitest, tdd, pure-functions, scroll-motion, css-transform-origin]

requires:
  - phase: 20-mobile-navigation-accent-color
    provides: per-gallery heroColor accent mechanism the homepage's random-color pick already consumes (pickRandomGalleryIndex, pre-existing in this same module)
provides:
  - "ZOOM_REVEAL_DISTANCE (900px), computeZoomProgress, computeWordmarkZoomState, computeFocusOrigin, wordmarkPhotoFilter — five new pure, unit-tested exports in src/lib/home-carousel.ts"
affects: [21-04-delete-duplicate-photo-filter, 21-05-homecarousel-zoom-driver]

tech-stack:
  added: []
  patterns:
    - "Pure, DOM-free scroll/motion math lives in src/lib/home-carousel.ts, unit-tested in isolation, before any .astro DOM wiring is written (mirrors this file's existing computeWordmarkBackgroundPosition/computeWordmarkSeamFraction/computeHoverZone/pickRandomGalleryIndex convention)"
    - "Ease-in-cubic scroll-progress curves clamp the raw input first, then special-case the exact 0/1 endpoints as literals to avoid floating-point noise (e.g. (1-0.92)/0.08 !== exactly 1 in IEEE 754) leaking into an otherwise-clean boundary value"

key-files:
  created: []
  modified:
    - src/lib/home-carousel.ts
    - tests/unit/home-carousel.test.ts

key-decisions:
  - "computeWordmarkZoomState's wordmarkOpacity/photoOpacity thresholds are driven by the clamped raw progress value directly, not the eased scale curve — the plan's own JSDoc guidance named the eased curve, but the specified behavior (e.g. t=0.9 -> photoOpacity ~0.3333) only reconciles against the raw clamped input; implemented to match the specified numeric behavior, which is the source of truth"
  - "computeWordmarkZoomState special-cases ct<=0 and ct>=1 as exact literal returns, bypassing the general threshold formulas at those two points, to avoid a ~5.5e-16 float-noise residual in wordmarkOpacity at t=1"

requirements-completed: [HOME-14, HOME-15]

coverage:
  - id: D1
    description: "computeZoomProgress converts the pinned scroll track's own getBoundingClientRect top into a clamped 0..1 zoom-progress fraction, with ZOOM_REVEAL_DISTANCE=900 as the confirmed Cinematic-pace default"
    requirement: "HOME-15"
    verification:
      - kind: unit
        ref: "tests/unit/home-carousel.test.ts#computeZoomProgress"
        status: pass
    human_judgment: false
  - id: D2
    description: "computeWordmarkZoomState drives the ease-in-cubic scale (1->8.5) plus wordmark-fade/photo-crossfade opacity pair from a single progress number"
    requirement: "HOME-15"
    verification:
      - kind: unit
        ref: "tests/unit/home-carousel.test.ts#computeWordmarkZoomState"
        status: pass
    human_judgment: false
  - id: D3
    description: "computeFocusOrigin derives a measured (not guessed) transform-origin percentage pair from two rects, null-safe for a degenerate wordmark box, no clamping of an out-of-bounds focus box"
    requirement: "HOME-15"
    verification:
      - kind: unit
        ref: "tests/unit/home-carousel.test.ts#computeFocusOrigin"
        status: pass
    human_judgment: false
  - id: D4
    description: "wordmarkPhotoFilter becomes the single importable home for the photo-cutout brightness/contrast heuristic, replacing the two in-file duplicates in HomeCarousel.astro (not yet deleted — that's plan 21-04's job)"
    requirement: "HOME-14"
    verification:
      - kind: unit
        ref: "tests/unit/home-carousel.test.ts#wordmarkPhotoFilter"
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-08-04
status: complete
---

# Phase 21 Plan 01: Wordmark-Zoom Pure Math Summary

**Five new pure, DOM-free exports in `src/lib/home-carousel.ts` — zoom-progress clamping, an ease-in-cubic scale/crossfade curve, measured transform-origin math, and a single-source photo-cutout filter — all unit-tested ahead of any `.astro` DOM wiring.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-08-04T22:45:00+02:00
- **Completed:** 2026-08-04T22:53:12+02:00
- **Tasks:** 2 completed
- **Files modified:** 2 (`src/lib/home-carousel.ts`, `tests/unit/home-carousel.test.ts`)

## Accomplishments

- `ZOOM_REVEAL_DISTANCE` (900px, the sketch-015 "Cinematic" pace winner) and `computeZoomProgress(trackTop, revealDistance?)` — turns the pinned scroll track's own `getBoundingClientRect().top` into a clamped 0..1 progress fraction, with a degenerate `revealDistance <= 0` safely resolving to the completed end-state instead of Infinity/NaN.
- `computeWordmarkZoomState(t)` — the single source of the 1→8.5x ease-in-cubic scale curve plus the wordmark-fade/photo-crossfade opacity pair (the crossfade is a deliberate end-state safety net hiding rasterization artifacts at extreme scale, not incidental).
- `computeFocusOrigin(wordmarkRect, focusRect)` — measured (never guessed) `transform-origin` percentages from two live-measured rects; `null` for a degenerate wordmark box; does not clamp an out-of-bounds focus box, since `transform-origin` itself accepts out-of-range percentages.
- `wordmarkPhotoFilter(textColor?)` — a byte-faithful transcription of the brightness/contrast heuristic currently duplicated in `HomeCarousel.astro`'s frontmatter and client `<script>` (20-REVIEW.md IN-01), now with exactly one importable home.
- 26 new Vitest tests across four `describe` blocks; all 62 tests in `home-carousel.test.ts` pass (36 pre-existing + 26 new).

## Task Commits

Each task followed a RED → GREEN TDD cycle, committed separately:

1. **Task 1: zoom progress + zoom state math**
   - `160da00` test(21-01): add failing tests for zoom progress + wordmark zoom state (RED — 16 new tests fail)
   - `8f42ef1` feat(21-01): add wordmark zoom progress + zoom state math (GREEN — all pass)
2. **Task 2: focus-origin math + shared photo-cutout filter**
   - `ac104ec` test(21-01): add failing tests for focus origin + photo filter (RED — 10 new tests fail)
   - `3e0cdaf` feat(21-01): add focus-origin math and shared photo-cutout filter (GREEN — all pass)
3. **Deferred-items log**
   - `66c8f6d` docs(21-01): log pre-existing test:coverage environment gap as deferred

**Plan metadata:** (final SUMMARY commit follows this document)

## Files Created/Modified

- `src/lib/home-carousel.ts` — added `ZOOM_REVEAL_DISTANCE`, `computeZoomProgress`, `WordmarkZoomState`, `computeWordmarkZoomState`, `FocusOrigin`, `computeFocusOrigin`, `wordmarkPhotoFilter`, plus a private (non-exported) `clamp01` helper. No existing export's signature or body changed.
- `tests/unit/home-carousel.test.ts` — extended the top-of-file import with the five new names; added `describe('computeZoomProgress')`, `describe('computeWordmarkZoomState')`, `describe('computeFocusOrigin')`, `describe('wordmarkPhotoFilter')`.
- `.planning/phases/21-homepage-scroll-experience/deferred-items.md` — new file, logs a pre-existing unrelated environment gap (see Deviations below).

## Decisions Made

- **Opacity thresholds use the clamped raw progress value, not the eased scale curve.** The plan's action-block JSDoc guidance named the eased cubic value ("c") for the opacity formulas, but the plan's own behavior bullets (`t=0.9` → `photoOpacity` ≈ 0.3333, `wordmarkOpacity` 1; `t=0.96` → `wordmarkOpacity` ≈ 0.5) only reconcile mathematically against the raw clamped input (`t=0.9` cubed is 0.729, which would put `photoOpacity` at 0 — contradicting the spec). Implemented against the specified numeric behavior in the `<behavior>` block, treating it as the authoritative contract; the JSDoc note was likely shorthand for "the clamped input," not literally the cubed value. Verified: all eight `computeWordmarkZoomState` test cases pass exactly as specified.
- **Exact-literal endpoint handling in `computeWordmarkZoomState`.** `(1 - 0.92) / 0.08` does not land on a clean binary-floating-point `1` (`0.9999999999999994`), which would leak a `~5.5e-16` residual into `wordmarkOpacity` at `t=1` instead of the exact `0` the spec requires (`toBe`, not `toBeCloseTo`). Fixed by special-casing `ct <= 0` and `ct >= 1` as exact literal returns before running the general threshold formulas.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed a floating-point test assertion, not the implementation**
- **Found during:** Task 2 (`computeFocusOrigin`'s out-of-bounds test)
- **Issue:** `computeFocusOrigin({...}, {left: 220, ...})` computes `230/200*100`, which in IEEE 754 double precision is `114.99999999999999`, not exactly `115` — the test I wrote used `toEqual({ originX: 115, ... })`, which failed on a correct implementation.
- **Fix:** Changed that one assertion to `toBeCloseTo(115, 5)` for `originX` (kept `toBe(25)` for the exact `originY`). No implementation code changed — the formula itself is a direct transcription of the sketch's `syncFocusOrigin()`.
- **Files modified:** `tests/unit/home-carousel.test.ts`
- **Verification:** All 62 tests pass after the fix.
- **Committed in:** `3e0cdaf` (Task 2 GREEN commit)

**2. [Rule 1 - Bug] Special-cased exact endpoints in `computeWordmarkZoomState`**
- **Found during:** Task 1 (endpoint tests `t=-2`→behaves as 0, `t=4`→behaves as 1)
- **Issue:** The general threshold formula (`1 - clamp01((ct - 0.92) / 0.08)`) leaks a `~5.5e-16` float-noise residual at `ct=1` instead of returning exactly `0`, which the spec requires via `toBe`/`toEqual`.
- **Fix:** Added explicit `if (ct <= 0) return {...}` / `if (ct >= 1) return {...}` short-circuits before the general formula.
- **Files modified:** `src/lib/home-carousel.ts`
- **Verification:** All endpoint tests pass with exact values.
- **Committed in:** `8f42ef1` (Task 1 GREEN commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1, floating-point correctness — one in a test assertion, one in the implementation). No scope creep; `src/components/HomeCarousel.astro` remains completely untouched by this plan (confirmed via `git diff --name-only` across all four task commits).

## Issues Encountered

- `npm run test:coverage` (Task 2's acceptance criteria) could not complete — see Known Issues / Deferred below. Not a plan defect; scoped verification (`npx vitest run home-carousel`) confirms this plan's own tests are fully green, and `npm run typecheck` / `npm run lint` both pass clean.

## Known Issues / Deferred

- **`npm run test:coverage` cannot run to completion in this environment.** The shared root `node_modules` (resolved via Node's directory-walk from this worktree up to the main repo root, since this worktree's own `node_modules` only holds `.astro`/`.vite` caches) has no `@sanity/icons` package installed at all. `tests/unit/dashboard-logic.test.ts` imports `sanity/editorial/dashboardLogic.ts`, which imports `@sanity/icons/BulbOutline` etc. — that whole suite fails to load, aborting the Vitest run before the coverage summary/threshold table prints. This predates and is entirely unrelated to this plan's two files. Not fixed here (SCOPE BOUNDARY: out-of-scope, pre-existing, unrelated file; also the shared root `node_modules` should not be mutated from inside an isolated worktree agent while concurrent sessions may be active). Logged to `.planning/phases/21-homepage-scroll-experience/deferred-items.md`. Recommended follow-up: whoever next runs `npm ci`/`npm install` in the primary checkout should confirm `@sanity/icons` reinstalls correctly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All five artifacts this plan promised (`ZOOM_REVEAL_DISTANCE`, `computeZoomProgress`, `computeWordmarkZoomState`, `computeFocusOrigin`, `wordmarkPhotoFilter`, plus the `WordmarkZoomState`/`FocusOrigin` interfaces) exist, are exported, and are unit-tested.
- Plan 21-05 (HomeCarousel.astro's zoom driver) can import `computeZoomProgress`/`computeWordmarkZoomState`/`computeFocusOrigin` directly instead of inlining scroll arithmetic.
- Plan 21-04 can delete both in-file `wordmarkPhotoFilter` duplicates in `HomeCarousel.astro` and import this module's version instead.
- `src/components/HomeCarousel.astro` is confirmed byte-for-byte unchanged by this plan, so plans 21-02/21-03 (which run in the same wave) have no merge risk against this plan's changes.
- No blockers for downstream plans in this phase.

---
*Phase: 21-homepage-scroll-experience*
*Completed: 2026-08-04*

## Self-Check: PASSED

- FOUND: src/lib/home-carousel.ts
- FOUND: tests/unit/home-carousel.test.ts
- FOUND: .planning/phases/21-homepage-scroll-experience/21-01-SUMMARY.md
- FOUND: all 6 commits (160da00, 8f42ef1, ac104ec, 3e0cdaf, 66c8f6d, df01ed9)
