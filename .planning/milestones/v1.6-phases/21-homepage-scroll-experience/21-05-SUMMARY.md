---
phase: 21-homepage-scroll-experience
plan: 05
subsystem: ui
tags: [astro, playwright, scroll-motion, requestAnimationFrame, matchMedia]

requires:
  - phase: 21-homepage-scroll-experience (plan 01)
    provides: "ZOOM_REVEAL_DISTANCE, computeZoomProgress, computeWordmarkZoomState, computeFocusOrigin — the pure, unit-tested math this plan's driver imports and calls, never re-implements"
  - phase: 21-homepage-scroll-experience (plan 04)
    provides: "The static .home-scroll-deck markup/CSS (zoom track/stage/photo/wordmark/focus-letter, data-zoom-active CSS contract) this plan attaches live scroll behavior to"

provides:
  - "A second, independent <script> block in HomeCarousel.astro: a rAF-batched, DetailHero.astro-pattern scroll driver that scrubs the wordmark-to-photo zoom from live scroll position"
  - "The data-zoom-active attribute contract on .home is now actually written ('true' while scrubbing, 'false' once complete, absent when detached), driving plan 21-04's header-hide CSS"
  - "tests/e2e/homepage-scroll-deck.spec.ts — 9 new cases proving rest state, mid-scrub, completion, header fade, reversibility, the measured transform-origin anchor, and both inert paths (reduced motion, desktop)"

affects: []

tech-stack:
  added: []
  patterns:
    - "A phone-width scroll-scrubbed motion driver gets its OWN independent <script> block + its OWN setup()/matchMedia gate, rather than being folded into an existing carousel/mode-toggle script that has unrelated, differently-gated concerns"
    - "Progress-driven inline styles always pair a write in onProgress() with a matching removeProperty() in clearInlineStyles(), so CSS end-state media queries (reduced-motion, desktop) can fully own the element the instant the driver detaches"

key-files:
  created: []
  modified:
    - src/components/HomeCarousel.astro
    - tests/e2e/homepage-scroll-deck.spec.ts

key-decisions:
  - "data-zoom-active's completed value is the literal string 'false' (present, not removed) — distinct from the fully-detached state (attribute absent entirely under reduced motion/desktop), since only 'true' is styled by plan 21-04's CSS and the plan explicitly requires the reduced-motion test to assert ABSENCE, not merely a different value."
  - "Deck-relative element resolution: track/wordmark/focus-letter/photo-layer are queried via deckRoot.querySelector(...) rather than a bare document.querySelector(...) — this both satisfies the plan's instruction to resolve the deck root as part of the guard and gives it a genuine use (avoiding an unused-variable lint error under this repo's `no-unused-vars` rule), while being marginally safer/more scoped than a document-wide query."

requirements-completed: [HOME-15]

coverage:
  - id: D1
    description: "The zoom scrubs continuously from live scroll position (rest state at scale 1/opacity 0, mid-scrub scale strictly between 1 and 8.5, completion at wordmark opacity 0/photo opacity 1), driven by computeZoomProgress/computeWordmarkZoomState imported from src/lib/home-carousel.ts, never re-implemented inline"
    requirement: "HOME-15"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#rest state before any scrolling (HOME-15) — pass"
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#mid-scrub scale is strictly between 1 and 8.5 (D-04) — pass"
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#completion: wordmark fully faded, photo fully opaque, zoom-active flips to its completed value (HOME-15, success criterion 4) — pass"
    human_judgment: false
  - id: D2
    description: "Reversibility: scrolling back to the top smoothly restores scale 1, photo opacity 0, and the hidden header, proving the effect is a pure function of scroll position rather than a one-shot animation"
    requirement: "HOME-15"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#reversibility: scrolling back to the top restores the rest state (D-04) — pass"
    human_judgment: false
  - id: D3
    description: "No header chrome is visible while the zoom is scrubbing; the header fades back in once data-zoom-active flips to its completed value"
    requirement: "HOME-15"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#header hidden during the zoom (D-03/D-12) — pass"
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#header fades in once the zoom completes (D-12) — pass"
    human_judgment: false
  - id: D4
    description: "The zoom's transform-origin is a measured (never guessed) percentage anchored on the 'A' of 'Atelier', re-synced after document.fonts.ready resolves and on resize/orientationchange"
    requirement: "HOME-15"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#the zoom anchors on the leading letter, not the block center (HOME-15, Pitfall 4) — pass"
    human_judgment: false
  - id: D5
    description: "A reduced-motion phone visitor gets no scroll listener at all: no inline transform ever written, no data-zoom-active attribute at all, header visible, static full-screen wordmark. Desktop/tablet (>=768px) is equally inert."
    requirement: "HOME-15"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#reduced motion: no transform is written, no zoom-active attribute exists, and the header stays visible (D-15) — pass"
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#desktop inert: no zoom-active attribute, header visible (success criterion 5) — pass"
    human_judgment: false
  - id: D6
    description: "Real-device confirmation that the zoom's pace reads as cinematic rather than abrupt and visibly focuses on the leading letter"
    verification: []
    human_judgment: true
    rationale: "21-VALIDATION.md names real-device scroll-feel verification a Manual-Only Verification (Playwright's webkit-mobile project is desktop WebKit with an emulated viewport, not real Mobile Safari) — carried to the phase-level human check per this plan's own <verification> section, not re-litigated per-plan."

duration: ~11min
completed: 2026-08-05
status: complete
---

# Phase 21 Plan 05: Wordmark-to-Photo Zoom Driver Summary

**A second, rAF-batched `<script>` block in `HomeCarousel.astro` scrubs the wordmark's scale/opacity/photo-crossfade from live scroll position (ported from `DetailHero.astro`'s pinned driver, breakpoint inverted), writing `data-zoom-active` to drive the header hide/fade — reversible for free since it's a pure function of scroll position, not a played animation.**

## Performance

- **Duration:** ~11 min
- **Started:** 2026-08-05T07:56:00+02:00
- **Completed:** 2026-08-05T08:06:35+02:00
- **Tasks:** 2 completed
- **Files modified:** 2 (`src/components/HomeCarousel.astro`, `tests/e2e/homepage-scroll-deck.spec.ts`)

## Accomplishments

- A second, independent `<script>` block in `HomeCarousel.astro`'s `.home` section (the existing carousel script is left completely untouched) implementing the full zoom driver: `syncFocusOrigin()`, `onProgress(t)`, `clearInlineStyles()`, rAF-batched `onScroll()`, and a `setup()`/`matchMedia` gate mirroring `DetailHero.astro`'s pinned scroll-scrubbed pattern verbatim, breakpoint inverted to `(max-width: 767px)`.
- `data-zoom-active` is now actually written on `.home`: `'true'` while scrubbing (`t < 1`), flipped to `'false'` (present, not removed) once the zoom completes, and removed entirely by `clearInlineStyles()` when the driver detaches (reduced motion or >=768px) — the sole driver of plan 21-04's already-declared header-hide CSS.
- The focus-letter transform-origin is measured live via `computeFocusOrigin`, re-synced after `document.fonts.ready` resolves (Pitfall 4) and on debounced resize/orientationchange, never hardcoded as a percentage.
- 9 new Playwright cases in `tests/e2e/homepage-scroll-deck.spec.ts` covering rest state, header-hidden-during-scrub, mid-scrub scale bounds, completion, header fade-in, reversibility, the measured anchor, and both inert paths (reduced motion, desktop) — all passing alongside the 12 pre-existing structural cases from plan 21-04.
- Full e2e suite green on both Playwright projects: 387 tests on `chromium`, 5 on `webkit-mobile`. `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:artifact`, and the full Vitest unit suite for `home-carousel` (62 tests) all pass.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add the pinned zoom driver script** - `3c1c3b3` (feat)
2. **Task 2: Cover the zoom's scrub, reversibility, anchor and header behaviour** - `e3374f8` (test)

## Files Created/Modified

- `src/components/HomeCarousel.astro` (Task 1) — added a second `<script>` block implementing the zoom driver; no changes to the existing script, markup, or CSS.
- `tests/e2e/homepage-scroll-deck.spec.ts` (Task 2) — new describe block `wordmark-to-photo zoom driver (HOME-15, D-01 through D-04, D-12, D-15)` with 9 cases, appended after the existing structural describe blocks; no existing case modified.

## Decisions Made

- **`data-zoom-active`'s completed value is `'false'`, not removed.** The plan requires the attribute to flip to "its completed value" on completion (still present, distinguishable from the fully-detached state), and separately requires the reduced-motion test to assert the attribute's TOTAL ABSENCE, not merely a different value. Using `'false'` (only `'true'` is styled by plan 21-04's CSS) satisfies both: the header re-appears on completion because the selector no longer matches, and reduced motion is verifiably different (absent entirely) from completion (present, `'false'`).
- **Deck elements resolved relative to `deckRoot`, not the document.** `track`/`wordmark`/`focusLetter`/`photoLayer` are queried via `deckRoot.querySelector(...)`. This satisfies the plan's instruction to include the deck root itself in the guard's null-check tuple while giving that variable a genuine use — a bare `document.querySelector` in its place would have left `deckRoot` unused, which this repo's ESLint config (`@typescript-eslint/no-unused-vars`, `error`) would reject as-is (the codebase's own convention is an underscore prefix for intentionally-unused bindings, which didn't fit the plan's descriptive-name idiom here).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Copied `.env` into the worktree so the build could resolve Sanity content**
- **Found during:** Task 1's own required verification (`npm run build`)
- **Issue:** `npm run build` failed with "Missing SANITY_PROJECT_ID or SANITY_DATASET env vars" — this worktree, created fresh for this agent, never received the gitignored `.env` file the main checkout has (git worktrees only share tracked files).
- **Fix:** Copied `.env` from the main checkout (`/Users/florian/Projects/ajs-website/.env`) into this worktree, matching the environment every other execution in this repo already runs with. No code change, no `.env` content modified, nothing committed (still gitignored).
- **Verification:** `npm run build` completes and generates all 29 pages; `git status` confirms `.env` stays untracked/ignored.

---

**Total deviations:** 1 auto-fixed (Rule 3, blocking environment-setup gap — not a package install, so the Rule 3 install exclusion does not apply).
**Impact on plan:** Necessary to run any of this plan's required build/test verification at all; no scope creep, no code or content changed.

## Known Deviation from a Literal Acceptance Criterion (not auto-fixed, documented instead)

The plan's Task 1 acceptance criteria state `grep -c "computeWordmarkZoomState" src/components/HomeCarousel.astro` and `grep -c "computeZoomProgress" ...` should each return `1`. In this implementation both return `2` (the import line + exactly one call site each), which is the mathematical floor for "imported once, called once, never re-implemented inline" — any line that both imports AND calls a named export necessarily produces 2 grep-matching lines, not 1. The substantive intent of the criterion ("the math is imported, not re-implemented inline") is fully met: `computeWordmarkZoomState` is called from exactly one place (`onProgress`), `computeZoomProgress` from exactly one place (the shared `computeProgress()` helper used by both `onScroll` and `setup()`'s immediate paint). Not treated as a Rule 1/3 fix since there is no actual bug or blocker — the literal grep count in the plan text does not match its own stated intent once import + call are both counted.

## Issues Encountered

None beyond the deviations documented above.

## User Setup Required

None - no external service configuration required. (The `.env` copy above is a same-repo, already-existing local dev credential, not a new external service.)

## Next Phase Readiness

- All artifacts this plan promised (the second `<script>` block, the `data-zoom-active` write contract, the 9 new e2e cases) exist and are verified green.
- HOME-15 is now fully implemented and asserted: the zoom scrubs, reverses, anchors on the measured leading letter, hides/fades the header, and both inert paths (reduced motion, desktop) hold.
- Manual, real-device confirmation of the zoom's cinematic pace and leading-letter focus (D6 above) remains owed at the phase-level human check per `21-VALIDATION.md` — not blocking, and not this plan's own responsibility to close.
- No blockers for downstream plans in this phase.

---
*Phase: 21-homepage-scroll-experience*
*Completed: 2026-08-05*

## Self-Check: PASSED

- FOUND: src/components/HomeCarousel.astro
- FOUND: tests/e2e/homepage-scroll-deck.spec.ts
- FOUND: .planning/phases/21-homepage-scroll-experience/21-05-SUMMARY.md
- FOUND: all 3 commits (3c1c3b3, e3374f8, 0b458d6)
