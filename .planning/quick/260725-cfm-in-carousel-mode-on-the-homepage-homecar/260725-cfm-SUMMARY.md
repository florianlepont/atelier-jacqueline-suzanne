---
phase: quick-260725-cfm
plan: 1
subsystem: ui
tags: [astro, vanilla-js, view-transitions, playwright, homepage]

requires:
  - phase: quick-260724-uf5
    provides: DetailHero's scroll-down chevron + label visual language, mirrored here
  - phase: quick-260724-wdr
    provides: DetailHero scrollHintLabel required-prop pattern, mirrored via HomeCarousel's own locale-derived const
provides:
  - "Carousel-mode 'keep scrolling to open' hint (bouncing chevron + locale label)"
  - "Overscroll-past-the-bottom navigation into the currently-shown collection, reusing the title link's href and cross-document photo morph"
affects: [homepage, home-carousel]

tech-stack:
  added: []
  patterns:
    - "Overscroll accumulation gated on atBottom() — never preventDefault, footer always reachable by normal scroll first"
    - "Script-driven opacity for a scroll-linked hint (mirrors DetailHero.astro's own pattern)"

key-files:
  created: []
  modified:
    - src/components/HomeCarousel.astro
    - tests/e2e/homepage.spec.ts

key-decisions:
  - "Overscroll accumulator (not raw scrollY) is the mechanism — the homepage's scrollable distance is short (roughly one footer height), so a raw-scrollY threshold would be either unreachable or would fire before the footer could be read"
  - "navigateToCurrent() reuses titleEl.click() rather than duplicating routing/morph-naming logic"
  - "Scroll-to-open navigation is NOT gated on prefers-reduced-motion (only the hint's bounce animation is) — consistent with this codebase's existing reduced-motion contract (functional affordances stay, decorative motion is removed)"

patterns-established:
  - "Window-level overscroll accumulator pattern (wheel deltaY + vertically-dominant touchmove), independent of the hero's own horizontal-swipe touchstart/touchend handlers"

requirements-completed: [QUICK-260725-cfm]

coverage:
  - id: D1
    description: "Carousel-mode 'keep scrolling to open' hint appears once scrolling starts, hidden at the top and in grid mode, locale-aware (FR/EN)"
    requirement: "QUICK-260725-cfm"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#carousel scroll-to-open (quick-260725-cfm) > FR: the hint is hidden at the top, appears once scrolling starts, and hides again back at the top"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#carousel scroll-to-open (quick-260725-cfm) > EN: the hint label reads \"Keep scrolling to open\""
        status: pass
    human_judgment: false
    rationale: "Independently re-verified by the orchestrator with real Sanity credentials + isolated-port Playwright run: full homepage.spec.ts (52/52) and the full e2e suite (187/187) pass. The FR hide-at-top assertion initially failed against the executor's original code — see Issues Encountered for the real bug found and fixed during this verification pass."
  - id: D2
    description: "Overscroll past a deliberate threshold beyond the bottom of the page navigates to the currently-shown collection, reusing the title link's href and cross-document morph; never blocks reaching the footer by normal scrolling"
    requirement: "QUICK-260725-cfm"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#carousel scroll-to-open (quick-260725-cfm) > overscrolling past the threshold navigates to the currently-shown collection, reusing the title link's href"
        status: pass
    human_judgment: false
    rationale: "Independently re-verified — passed on first run and after the fix."
  - id: D3
    description: "Grid mode is completely unaffected — no hint, scrolling never navigates, tiles still open on click"
    requirement: "QUICK-260725-cfm"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#carousel scroll-to-open (quick-260725-cfm) > grid mode: the hint stays hidden and overscrolling never navigates"
        status: pass
    human_judgment: false
    rationale: "Independently re-verified — passed on first run and after the fix."
  - id: D4
    description: "prefers-reduced-motion disables the hint's bounce animation only; scroll-to-open navigation still works"
    requirement: "QUICK-260725-cfm"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#carousel scroll-to-open (quick-260725-cfm) > reduced motion disables the hint bounce but scroll-to-open navigation still works"
        status: pass
    human_judgment: false
    rationale: "Independently re-verified — passed on first run and after the fix."

duration: 25min (+ orchestrator verification/fix pass)
completed: 2026-07-25
status: complete
---

# Quick Task 260725-cfm: Carousel Scroll-to-Open Summary

**Overscroll-past-the-bottom navigation into the current collection on the homepage carousel, plus a bouncing "keep scrolling to open" chevron+label hint mirroring DetailHero's visual language — navigation reuses the existing title link's href/morph, never blocks reaching the footer.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-07-25T08:55:00Z (approx, pre-existing worktree checkout)
- **Completed:** 2026-07-25T07:15:25Z
- **Tasks:** 3/3 completed
- **Files modified:** 2

## Accomplishments

- Added a locale-derived "keep scrolling to open" hint (bouncing chevron + uppercase pink-underlined label) to `HomeCarousel.astro`, hidden at rest, in grid mode, and under `prefers-reduced-motion` (bounce only)
- Implemented an overscroll accumulator that only arms once the page is already scrolled to the bottom, gated to carousel mode, never calling `preventDefault` — the footer is always reachable by normal scrolling first
- `navigateToCurrent()` reuses the existing `titleEl.click()` handler, inheriting both routing and the cross-document `hero-photo` view-transition morph with zero duplicated logic
- Added five new Playwright e2e tests covering hint appearance/hide, FR/EN labels, threshold navigation, grid-mode no-op, and reduced-motion behavior

## Task Commits

Each task was committed atomically:

1. **Task 1: Add the "keep scrolling to open" hint (markup + scoped CSS + locale label)** - `26f33cd` (feat)
2. **Task 2: Add overscroll-to-open navigation + hint visibility to the script** - `fafa362` (feat)
3. **Task 3: Add Playwright e2e coverage in homepage.spec.ts** - `867b47c` (test)
4. **Orchestrator fix: reset overscroll accumulator on any move off the bottom** - `3a899bf` (fix) — see Issues Encountered

_No plan-metadata commit yet — the orchestrator handles the docs commit (SUMMARY.md/STATE.md) after this SUMMARY is written, per the constraints for this run._

## Files Created/Modified

- `src/components/HomeCarousel.astro` - Added `scrollOpenHintLabel` const, `.home-scroll-open-hint` markup + scoped CSS + `home-scroll-hint-bounce` keyframe (Task 1); added the overscroll accumulator, `navigateToCurrent()`, `registerDownwardIntent()`, `updateHintVisibility()`, wheel/touch/scroll listeners, and `showGrid()`/`showCarousel()` hint-reset wiring (Task 2)
- `tests/e2e/homepage.spec.ts` - New `carousel scroll-to-open (quick-260725-cfm)` describe block with 5 tests (Task 3)

## Decisions Made

- **Overscroll accumulation, not raw `scrollY`, is the trigger mechanism.** The investigation findings confirmed the homepage's scrollable distance below the fold is short (roughly one footer height) — a plain `scrollY > threshold` gate would either be unreachable or would fire before the footer could be read. Accumulating downward wheel/touch intent *only once already at the bottom* guarantees the footer is always reachable first.
- **`navigateToCurrent()` calls `titleEl.click()`** rather than reading `galleries[carouselIndex].href` and navigating directly, so the existing `setCrossDocPhoto()` morph-naming side effect (already wired to the title link's click listener) fires automatically — zero duplicated routing/morph logic.
- **Reduced motion disables only the bounce animation, not the navigation.** This mirrors the codebase's established reduced-motion contract elsewhere (auto-advance pauses, View Transition animations are disabled, but keyboard/swipe/click/mode-swap navigation always still works) — the scroll-to-open gesture is a functional affordance, not decorative motion.
- **Idle reset (800ms) applied before adding each new delta**, so a genuinely continuous downward push accumulates toward the threshold, but a visitor who pauses mid-scroll (e.g. to read the footer) doesn't have a stale accumulation silently carry over into an unrelated later scroll.

## Deviations from Plan

None - plan executed exactly as written (all D1-D8 design decisions implemented as specified).

## Issues Encountered

**Executor-side: e2e suite could not be executed in this worktree.** This worktree had no `.env` file (Sanity read-token credentials), a known standing limitation of this GitHub-worktree execution environment (documented in the quick-260724-uf5 and quick-260724-wdr summaries). Confirmed directly: `npm run build` failed with `Missing SANITY_PROJECT_ID or SANITY_DATASET env vars`.

During its own verification the executor also found a stray `astro dev` process already listening on port `4321`, running from the **main repo checkout** (`/Users/florian/Projects/ajs-website`, not this worktree) — Playwright's `reuseExistingServer: !process.env.CI` config would have picked it up and run against it. The executor correctly did not trust or use that result, and did not touch the foreign process.

**Orchestrator verification (with real credentials) found and fixed a real bug.** After copying `.env` into the worktree and running the full suite on an isolated port (4399, avoiding the stray process on 4321), one of the five new tests failed: `FR: the hint is hidden at the top, appears once scrolling starts, and hides again back at the top`. Root cause: `overscrollAccum` was only reset to 0 inside `registerDownwardIntent()`'s upward-delta branch, which fires on `wheel`/`touchmove` events. `window.scrollTo(0, 0)` (used by the test, but equally reachable via keyboard Home/PageUp or a scrollbar drag in real use) fires a `scroll` event but no `wheel`/`touchmove` event, so the accumulator stayed stuck at a stale positive value — the hint remained visible at opacity 0.85 after returning to the top, and a later unrelated overscroll would have started accumulating from that stale baseline instead of 0, undermining the "long, deliberate threshold" safety goal. Fixed in `3a899bf` by also resetting `overscrollAccum` inside the generic `scroll` listener whenever `!atBottom()`, regardless of which input caused the position change. Re-ran the full suite after the fix: all 52 `homepage.spec.ts` tests and all 187 tests across the entire e2e suite pass.

## User Setup Required

None - no external service configuration required by this task itself. (The pre-existing `.env` gap affecting e2e verification is a standing, previously-acknowledged environment limitation, not new setup this task introduces.)

## Next Phase Readiness

- Code changes are complete, `astro check` clean, lint-clean, and independently re-verified: `npm run build` succeeds, `npm run test:unit` (147/147) and the full `npm run test:e2e` suite (187/187, including the HOME-06 mobile full-bleed regression guard) pass with real Sanity credentials.
- Recommended non-blocking human spot-check per the plan's `<verification>` section: real desktop + mobile browser check of the hint appearance, scroll-to-open gesture, footer reachability, reduced-motion behavior, and grid-mode no-op, on both `/` and `/en/`.

---
*Phase: quick-260725-cfm*
*Completed: 2026-07-25*

## Self-Check: PASSED

- FOUND: src/components/HomeCarousel.astro
- FOUND: tests/e2e/homepage.spec.ts
- FOUND: .planning/quick/260725-cfm-in-carousel-mode-on-the-homepage-homecar/260725-cfm-SUMMARY.md
- FOUND commit: 26f33cd (Task 1)
- FOUND commit: fafa362 (Task 2)
- FOUND commit: 867b47c (Task 3)
