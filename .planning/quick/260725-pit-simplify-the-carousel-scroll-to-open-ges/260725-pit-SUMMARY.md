---
phase: quick-260725-pit
plan: 1
subsystem: ui
tags: [astro, homepage-carousel, playwright, e2e, view-transitions]

# Dependency graph
requires:
  - phase: quick-260725-cfm
    provides: the scroll-to-open overscroll accumulator, at-bottom gate, and "keep scrolling to open" hint this plan simplifies
  - phase: quick-260725-dcg
    provides: footer-hide-in-carousel-mode and progress-dash fill fixes, both left untouched by this plan
provides:
  - HomeCarousel.astro with the scroll-to-open hint fully removed (silent/implicit gesture)
  - OPEN_OVERSCROLL_THRESHOLD lowered from 600 to 150 (tunable)
  - Rewritten homepage.spec.ts scroll-to-open describe block matching the simplified behavior
affects: [homepage, homepage-carousel-e2e]

tech-stack:
  added: []
  patterns:
    - "Overscroll-at-bottom navigation gesture kept silent/implicit (no visible affordance) — the accumulator + at-bottom gate remain the correctness mechanism, only the visual hint was removed"

key-files:
  created: []
  modified:
    - src/components/HomeCarousel.astro
    - tests/e2e/homepage.spec.ts

key-decisions:
  - "OPEN_OVERSCROLL_THRESHOLD set to 150 (down from 600) — see rationale below"
  - "Kept the overscroll accumulator (did not switch to fire-on-first-delta) since trackpad scrolling emits many small deltas that would never cross a single-delta floor"

patterns-established: []

requirements-completed: [QUICK-260725-pit]

coverage:
  - id: D1
    description: "The visible 'keep scrolling to open' hint (label, chevron, underline, CSS/keyframes/reduced-motion/grid-mode rules, locale const, scrollHintEl, updateHintVisibility()) is fully removed from HomeCarousel.astro"
    requirement: "QUICK-260725-pit"
    verification:
      - kind: other
        ref: "grep for scroll-open-hint|scrollHintEl|updateHintVisibility|home-scroll-hint-bounce|scrollOpenHintLabel returns no matches"
        status: pass
      - kind: other
        ref: "npx astro check (typecheck)"
        status: pass
    human_judgment: false
  - id: D2
    description: "OPEN_OVERSCROLL_THRESHOLD lowered to 150, accumulator/at-bottom gate/no-preventDefault preserved"
    requirement: "QUICK-260725-pit"
    verification:
      - kind: other
        ref: "grep OPEN_OVERSCROLL_THRESHOLD in HomeCarousel.astro confirms value 150"
        status: pass
    human_judgment: false
  - id: D3
    description: "e2e coverage rewritten: no hint element (FR+EN+grid), light scroll at bottom navigates, small scroll near top does not navigate, grid mode unaffected, reduced motion still navigates"
    requirement: "QUICK-260725-pit"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts — 'carousel scroll-to-open (quick-260725-cfm, simplified quick-260725-pit)' describe block"
        status: pass
    human_judgment: false
    rationale: "Independently re-verified by the orchestrator with real Sanity credentials + isolated-port Playwright run: full e2e suite (194/194) passes, including all 5 rewritten scroll-to-open tests. Also confirmed live in a real browser: no hint in the DOM; a single wheel(200) event at the bottom triggers real navigation to the gallery page; a wheel(60) event (below the 150 threshold) correctly does not navigate."

# Metrics
duration: ~25min (+ orchestrator verification pass)
completed: 2026-07-25
status: complete
---

# Quick Task 260725-pit: Simplify Carousel Scroll-to-Open Gesture Summary

**Removed the "keep scrolling to open" hint from HomeCarousel.astro entirely and lowered the overscroll-to-open threshold from 600px to 150px, making the scroll-to-open gesture silent/implicit and near-immediate instead of requiring a sustained ~600px push with a visible chevron.**

## Performance

- **Duration:** ~25 min
- **Completed:** 2026-07-25
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Removed the entire "keep scrolling to open" hint from `HomeCarousel.astro`: markup (label span + chevron SVG), scoped CSS (base rule, label, icon, `@keyframes home-scroll-hint-bounce`, reduced-motion override, grid-mode `display: none` override), the locale-derived `scrollOpenHintLabel` const, the `scrollHintEl` query, the `updateHintVisibility()` function, and every one of its 8 call sites (`showCarousel()`, `showGrid()`, `navigateToCurrent()`, both branches of `registerDownwardIntent()`, the generic `scroll` listener, and the init call).
- Lowered `OPEN_OVERSCROLL_THRESHOLD` from `600` to `150` — the gesture now fires near-immediately once the visitor is at the bottom and keeps scrolling, instead of requiring a long sustained push.
- Kept the overscroll accumulator mechanism itself (not switched to fire-on-first-delta): trackpad scrolling emits many small per-event deltas that a single-delta floor would never catch, so the accumulator (summing wheel notches and trackpad deltas uniformly) is still required.
- Kept the generic `window.addEventListener('scroll', ...)` listener and its `overscrollAccum = 0` reset when not at the bottom (the quick-260725-cfm independent-verification fix for keyboard/scrollbar/`scrollTo` navigation away from the bottom) — only its `updateHintVisibility()` call was removed.
- Rewrote the `homepage.spec.ts` `carousel scroll-to-open` describe block: removed 4 obsolete hint-specific tests, added a no-hint-element test (FR + EN + grid mode), rewrote the threshold test to use a light `wheel(0, 200)` input (proving the new 150 threshold, far below the old 600), added a new test proving a small scroll near the top (not at the bottom, via an injected spacer) does NOT navigate, and kept the grid-mode and reduced-motion tests with hint assertions stripped.
- Confirmed via grep that no reference to `scroll-open-hint`, `scrollHintEl`, `updateHintVisibility`, `home-scroll-hint-bounce`, or `scrollOpenHintLabel` remains anywhere in either modified file.
- `npx astro check` (typecheck) passes with 0 errors on both files (pre-existing, unrelated warnings/hints in other files untouched).

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove the scroll-to-open hint and lighten the overscroll threshold in HomeCarousel.astro** - `c0c7145` (feat)
2. **Task 2: Update the scroll-to-open e2e tests in homepage.spec.ts** - `e334b3a` (test)

_Note: This SUMMARY, STATE.md, and PLAN.md are NOT committed by this executor per orchestrator instructions — the orchestrator handles the docs commit separately._

## Files Created/Modified

- `src/components/HomeCarousel.astro` - Removed the scroll-to-open hint (markup/CSS/keyframes/script wiring) entirely; lowered `OPEN_OVERSCROLL_THRESHOLD` to 150; kept the overscroll accumulator, at-bottom gate, wheel/touch listeners, and the scroll-listener's accumulator-reset fix
- `tests/e2e/homepage.spec.ts` - Rewrote the `carousel scroll-to-open` describe block: removed 4 obsolete hint tests, added a no-hint-element test and a not-at-bottom-does-not-navigate test, updated the threshold and reduced-motion tests to the lighter wheel input

## Decisions Made

**`OPEN_OVERSCROLL_THRESHOLD = 150` (down from 600) — this is a TUNABLE value the user may want to adjust after live testing:**
- 150px sits just above a single mouse-wheel notch (~100-120px in Chrome, `deltaMode` pixels), so a stray single tick can't misfire, but a second notch — or a continuous trackpad swipe, which crosses 150px within a fraction of a second — fires near-instantly.
- It is 4x lighter than the previously-shipped 600px sustained push that live-testing feedback described as "quite strange."
- `RESET_IDLE_MS` (800ms) was left unchanged: a genuine continuous gesture never pauses 800ms mid-scroll, so it is unaffected, but a stale single tick decays and cannot combine with a much-later unrelated tick — preserving the "deliberate, not accidental" safety guarantee even at the lighter threshold.
- If it ever misfires live, the user should raise it toward ~200; if it feels sluggish, lower it toward ~100. This is a one-line change (`const OPEN_OVERSCROLL_THRESHOLD` in `HomeCarousel.astro`'s `<script>` block).

**Kept the accumulator, did not switch to "fire on first single delta":** trackpad scrolling emits many tiny deltas (a few px each), so a per-event single-delta floor would never fire for trackpad users. The accumulator sums mouse-wheel notches and trackpad deltas uniformly, which is why it was preserved even though the hint driving its visibility is gone.

## Deviations from Plan

None - plan executed exactly as written (both tasks, both changes, per the investigation findings and exact anchors given in the plan).

## Issues Encountered

**Executor-side: e2e verification could not produce a real pass/fail signal in this worktree.** No `.env` (Sanity credentials), so `npm run build` couldn't produce a fresh `dist/`, and port 4321 was occupied by a pre-existing, unrelated server serving a stale build — the executor correctly did not trust that result and flagged it for orchestrator re-verification instead of reporting a false pass.

**Orchestrator verification (with real credentials, isolated port 4399) found zero issues.** Full e2e suite: 194/194 passing on the first run, including all 5 rewritten scroll-to-open tests. Live browser spot-check confirmed the actual gesture feel: no hint element in the DOM; dispatching a single `wheel` event with `deltaY: 200` at the bottom of the hero triggers real navigation to the current gallery's detail page; a smaller `deltaY: 60` tick (below the 150 threshold) correctly does not navigate.

## User Setup Required

None - no external service configuration required. (Sanity credentials for a full local build/e2e run were already a known pre-existing gap in this worktree, called out in the orchestrator's constraints, not introduced by this task.)

## Next Phase Readiness

- Code changes are complete, typecheck-clean, committed, and independently re-verified: `npm run build` succeeds, `npm run test:unit` (147/147) and the full `npm run test:e2e` suite (194/194) pass with real Sanity credentials, plus a live browser confirmation of the actual scroll gesture.
- No blockers. If the 150px threshold ever misfires or feels sluggish in further live use, it's a one-line tunable (`OPEN_OVERSCROLL_THRESHOLD` in `HomeCarousel.astro`).

---
*Phase: quick-260725-pit*
*Completed: 2026-07-25*

## Self-Check: PASSED

- FOUND: src/components/HomeCarousel.astro
- FOUND: tests/e2e/homepage.spec.ts
- FOUND: .planning/quick/260725-pit-simplify-the-carousel-scroll-to-open-ges/260725-pit-SUMMARY.md
- FOUND commit c0c7145 (Task 1)
- FOUND commit e334b3a (Task 2)
