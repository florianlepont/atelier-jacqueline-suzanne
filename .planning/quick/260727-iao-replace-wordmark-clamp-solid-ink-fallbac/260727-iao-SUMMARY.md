---
phase: quick-260727-iao
plan: 01
subsystem: ui
tags: [astro, css-clip-path, requestAnimationFrame, playwright, vitest, home-carousel, wordmark-cutout]

requires:
  - phase: quick-260727-g04
    provides: the commit-time solid-ink fallback this plan retires and replaces
provides:
  - "computeWordmarkSeamFraction() pure seam-math function (src/lib/home-carousel.ts)"
  - "Three-layer wordmark cutout stack (.home-hero__wordmark-stack: current h1 + two aria-hidden peek spans)"
  - "syncWordmarkLayers()/--wm-seam/data-peek-zone live seam-driven clip-path mechanism"
affects: [home-carousel, homepage-hero]

tech-stack:
  added: []
  patterns:
    - "CSS custom-property-driven clip-path split (JS writes only --wm-seam + data-peek-zone; CSS owns all clip-path math) instead of building clip-path strings in JS per frame"
    - "Effective-visible-fraction parsing of computed clip-path (rather than string-matching one exact inset() serialization) for robust e2e assertions"

key-files:
  created: []
  modified:
    - src/lib/home-carousel.ts
    - tests/unit/home-carousel.test.ts
    - src/components/HomeCarousel.astro
    - tests/e2e/homepage.spec.ts

key-decisions:
  - "Kept the Task 2 hard clip-path seam as-is (no 1-2px overlap, no mask-image feather) — a 3x-zoom screenshot at a mid-glyph seam boundary during live verification showed a clean vertical split with no gap/aliasing artifact; adjacent gallery photos read as visually distinct enough that the boundary presents as an intentional cut."
  - "Extended the mobile-width wordmark font-size overrides (clamp(36px,9.8vw,50px) and the <360px 9.8vw floor) to the new peek layers too — without this, the peeks kept the desktop clamp at mobile widths and an unbroken word overflowed the mobile panel's layout box even while fully clipped/invisible, regressing document scrollWidth. Caught via a real 320px-viewport overflow scan against the pre-Task-2 baseline."
  - "Replaced the plan's literal 'mirror one LEFT-edge hover case' test with a regression guard asserting the seam stays clamped at rest during a left-zone hover — live verification found .home-hero__accent's right-anchored position (right: var(--space-md); width: min(700px, 52%)) means the 16%-magnitude hover push never reaches the panel's own screen location at any realistic desktop viewport; only a full left-commit (already covered) does. This is the correct consequence of the plan's own geometric model, not a bug."

requirements-completed: [QUICK-260727-iao]

coverage:
  - id: D1
    description: "computeWordmarkSeamFraction() pure seam-math function, exported and unit-tested for both zones (rest/mid-push/full-commit/beyond-edge/degenerate)"
    requirement: "QUICK-260727-iao"
    verification:
      - kind: unit
        ref: "tests/unit/home-carousel.test.ts#computeWordmarkSeamFraction"
        status: pass
    human_judgment: false
  - id: D2
    description: "Three-layer wordmark stack (current h1 + aria-hidden peek--prev/--next spans) — single accessible h1 preserved, peeks matched only by .home-hero__wordmark-peek"
    requirement: "QUICK-260727-iao"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#homepage semantic heading (quick-260720-nm3) > the homepage exposes exactly one accessible level-1 heading containing \"Atelier\""
        status: pass
      - kind: e2e
        ref: "tests/e2e/critical.smoke.spec.ts#critical cross-browser smoke > homepage wordmark stays readable while the sharp hero is unavailable"
        status: pass
    human_judgment: false
  - id: D3
    description: "Hover-peek mirrors the photo: peek-side wordmark layer's revealed portion grows with edge proximity while current shrinks, inactive peek stays fully clipped"
    requirement: "QUICK-260727-iao"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#carousel wordmark stays synced to the peek (Bug A) > FR/EN: peek-side wordmark layer grows with right-edge proximity, inactive peek stays clipped"
        status: pass
    human_judgment: false
  - id: D4
    description: "Click-commit mirrors the photo: seam slides continuously to the incoming extreme through the full ~420-480ms slide, has-wordmark-photo never drops (no solid-ink beat), right and left directions"
    requirement: "QUICK-260727-iao"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#carousel wordmark mirrored-peek commit (quick-260727-iao) > FR/EN right-edge commit + FR left-edge commit"
        status: pass
    human_judgment: false
  - id: D5
    description: "quick-260727-drq's clamp-hold framing and quick-260727-g04's solid-ink-during-commit are removed, not layered on top"
    requirement: "QUICK-260727-iao"
    verification:
      - kind: unit
        ref: "tests/unit/home-carousel.test.ts#computeWordmarkBackgroundPosition (byte-unchanged, drq clamp retained per-layer)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#carousel wordmark mirrored-peek commit (quick-260727-iao) — has-wordmark-photo sampled every rAF frame through the slide, never false"
        status: pass
    human_judgment: false
  - id: D6
    description: "Visual seam quality at the glyph level (no gap/aliasing artifact) — human/live-judgment call"
    verification: []
    human_judgment: true
    rationale: "Live 3x-zoom screenshot inspection during execution found a clean seam, but final visual acceptance of the mirrored-peek look-and-feel across real gallery photo pairs is a subjective design call best confirmed by the user on staging."

duration: 32min
completed: 2026-07-27
status: complete
---

# Quick Task 260727-iao: Wordmark Mirrored-Peek Cutout Summary

**Replaced the wordmark cutout's clamp-and-hold + solid-ink-during-commit behavior with a true three-layer mirrored peek (current + peekPrev + peekNext), driven by a single CSS custom property (`--wm-seam`) computed live each frame from the carousel photo's own edge, through both hover-peek and click-commit.**

## Performance

- **Duration:** 32 min (13:27–13:59, across a session interruption/resume)
- **Started:** 2026-07-27T13:27:55+02:00
- **Completed:** 2026-07-27T13:59:32+02:00
- **Tasks:** 4 (5 commits — Task 1 split into TDD RED/GREEN)
- **Files modified:** 4

## Accomplishments

- New `computeWordmarkSeamFraction(zone, heroLeft, heroRight, wordmarkLeft, wordmarkWidth)` pure function turns the current photo's live edge + the wordmark's own screen rect into a 0..1 seam fraction — unit-tested exhaustively (rest, mid-push, full-commit, beyond-edge, degenerate zero-width) for both zones.
- The wordmark's photo-cutout is now a real three-layer stack (`.home-hero__wordmark-stack`: the unchanged accessible `<h1 class="home-hero__wordmark">` plus two `aria-hidden` `.home-hero__wordmark-peek--prev/--next` spans with identical text/line-breaks), CSS-clipped from a single `--wm-seam` custom property + `data-peek-zone` attribute — no clip-path strings built in JS.
- `syncWordmarkLayers()` extends the existing `syncWordmarkAlignment()`: feeds the active peek layer its own independent `computeWordmarkBackgroundPosition()` crop and writes the live seam, driven through the SAME shared `keepWordmarkSynced()`/`pumpWordmarkSync()` rAF loop as before — through both `updatePeek()` (hover) and `commitEdge()` (click-commit).
- `commitEdge()`'s g04-era commit-time solid-ink fallback (`has-wordmark-photo`/`--wordmark-photo: none` removal) is fully retired: with three independently-clamped layers there is always a correct photo to show at every proximity, so the cutout stays visible and the seam visibly slides toward the incoming extreme through the whole ~420-480ms slide.
- FR+EN e2e coverage rewritten: the old "goes solid mid-slide" assertion is gone, replaced by continuous in-page rAF sampling of `--wm-seam`/`data-peek-zone`/`has-wordmark-photo` through a full commit (both directions), plus new hover seam-growth proof and a discovered-and-documented left-hover asymmetry regression guard.

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract and unit-test computeWordmarkSeamFraction()** - `7813fc6` (test, RED) + `cfdec7c` (feat, GREEN)
2. **Task 2: Three-layer wordmark stack markup + CSS** - `a9e34a3` (feat)
3. **Task 3: Wire per-layer sync + live seam through hover and commit** - `6eac9c7` (feat)
4. **Task 4: Retire g04 e2e assertions, add mirrored-peek coverage** - `ea7293e` (test)

**Plan metadata:** committed separately by the orchestrator after this SUMMARY.

_TDD task (Task 1) has two commits (RED test → GREEN implementation), per plan._

## Files Created/Modified

- `src/lib/home-carousel.ts` - Added `computeWordmarkSeamFraction()`, pure/DOM-free, mirrors the module's existing convention.
- `tests/unit/home-carousel.test.ts` - 8 new unit cases for the seam-fraction math (both zones, all boundary/degenerate cases).
- `src/components/HomeCarousel.astro` - New `.home-hero__wordmark-stack` markup (3 layers), grouped typographic/background-clip CSS, seam-driven clip-path rules, `syncWordmarkLayers()`/`lastPeekZone` wiring through `updatePeek()`/`resetPeek()`/`commitEdge()`/the resize handler, retired g04's commit-time solid-ink removal, extended mobile font-size overrides to the peek layers.
- `tests/e2e/homepage.spec.ts` - Replaced the g04 "goes solid mid-slide" describe block with a new mirrored-peek commit block (FR+EN right, FR left); added hover seam-growth tests (FR+EN right, FR left-hover regression guard) to the Bug A describe block.

## Decisions Made

- Kept the Task 2 hard clip-path seam as-is — no overlap/feather — confirmed clean via a 3x-zoom live screenshot at a mid-glyph seam boundary; adjacent gallery photos are visually distinct enough that a hard seam reads as intentional.
- Extended the mobile wordmark font-size overrides to the new (invisible-by-default) peek layers, fixing a real page-scrollWidth regression at 320px caused by an unbroken word rendering at the desktop clamp inside a narrower mobile panel.
- Replaced a literal "mirror the LEFT-edge hover growth case" test with a documented regression guard proving the seam correctly stays at rest during a left-zone hover, since the right-anchored accent panel is genuinely out of the 16%-magnitude hover-push's reach at any realistic desktop viewport — only a full left-commit (already covered) reaches it. This matches the plan's own geometric model exactly (the photo's real peekPrev layer is equally confined to a narrow strip near the screen's left edge during hover).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Mobile wordmark peek layers overflowed the page at 320px viewport width**
- **Found during:** Task 2 verification (isolated-port e2e run against real Sanity content)
- **Issue:** The mobile-width `.home-hero__wordmark { font-size: clamp(36px, 9.8vw, 50px); }` override (and the `<360px` `9.8vw` floor) only targeted the h1, not the new `.home-hero__wordmark-peek` layers. At mobile widths the peeks kept the desktop clamp (up to 70px), and an unbroken word like "JACQUELINE" rendered wider than the mobile panel's box — even though the layer is fully clipped/invisible by default, its layout box still counted toward `document.documentElement.scrollWidth`, regressing the existing `narrow-phone header regression` e2e test (`scrollWidth <= clientWidth` at 320px).
- **Fix:** Extended both mobile font-size override rules to include `.home-hero__wordmark-peek`.
- **Files modified:** src/components/HomeCarousel.astro
- **Verification:** Confirmed via a real-browser 320px overflow scan (before/after Task 2, diffed against the pre-Task-2 baseline) that the overflow contributor set matched exactly; re-ran the full `narrow-phone header regression` test green.
- **Committed in:** a9e34a3 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Necessary correctness fix caught during the plan's own prescribed verification step, before it reached the codebase in a broken state. No scope creep — same task's own new markup.

## Issues Encountered

- The plan's literal "mirror one LEFT-edge hover case" test instruction didn't match live behavior: given `.home-hero__accent`'s real right-anchored screen position, the hover-magnitude push (capped at 16% of the photo's width) never travels far enough for `heroImg`'s live left edge to reach the panel's own screen location, at any realistic desktop viewport — so the seam legitimately never leaves its resting extreme during a left-zone hover. Resolved by writing the test to prove the actually-correct contract (seam stays clamped at rest) instead of forcing an assertion that doesn't hold, with the reasoning documented inline in the test and in this SUMMARY's Decisions section.
- A full parallel-worker run of the entire `tests/e2e/` suite against the single isolated-port preview server produced ~20 spurious `page.goto` timeouts (resource contention, not a regression) — confirmed by re-running the same failing tests with `--workers=1`, which passed 91/91. The plan's own verification scope (`homepage.spec.ts` + `critical.smoke.spec.ts`) was run both at full parallelism (99/99 pass) and, for the homepage file specifically, at `--workers=1` (91/91 pass) to rule this out definitively.
- `tests/unit/dashboard-logic.test.ts` fails on the same known, pre-existing, unrelated missing `@sanity/icons` package in the Studio subproject (documented in prior quick-task SUMMARYs) — not in scope, not touched. All other 129 unit tests pass.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The wordmark cutout now reads as a true hole cut in the same physical photo stack at every proximity from 0% to 100%, through both hover-peek and click-commit, with no frozen-clamp and no solid-ink beat — quick-260727-drq's clamp-hold framing and quick-260727-g04's solid-ink-during-commit are fully removed, not layered on top.
- Exactly one accessible `<h1>` is preserved (`.home-hero__wordmark`); the two peek copies are `aria-hidden` and matched only by the distinct `.home-hero__wordmark-peek` token, so every existing single-match locator (`critical.smoke.spec.ts`, `homepage.spec.ts`) keeps matching exactly one element.
- The mechanism is inert (current-only, both peeks clipped) on touch, under reduced motion, and pre-JS — no new JS wiring runs on non-hoverCapable devices beyond the already-existing render()/resize direct sync calls, which fall back safely to the current-covers-all extreme when a peek image hasn't loaded.
- **Live visual confirmation recommended:** while the seam's continuous motion and the "no solid ink" contract are proven by deterministic e2e assertions and a live 3x-zoom screenshot check, final subjective look-and-feel across the full range of real gallery photo pairings (some visually similar, some very different) is worth a quick look on staging.
- No blockers for further homepage-carousel work.

---
*Phase: quick-260727-iao*
*Completed: 2026-07-27*

## Self-Check: PASSED

All modified files confirmed present on disk (src/lib/home-carousel.ts, tests/unit/home-carousel.test.ts, src/components/HomeCarousel.astro, tests/e2e/homepage.spec.ts, this SUMMARY.md). All 5 task commits confirmed in git log (7813fc6, cfdec7c, a9e34a3, 6eac9c7, ea7293e).
