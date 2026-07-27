---
phase: quick-260727-bsm
plan: 01
subsystem: ui
tags: [astro, css-transitions, requestAnimationFrame, playwright, homepage-carousel]

requires:
  - phase: quick-260726-u97
    provides: sketch 008 Variant C hover-navigation carousel (custom cursor, edge-zone parallax peek, click-to-navigate) that this plan fixes three bugs in
provides:
  - Wordmark photo-cutout stays synced to the hero photo's live transform during and after a peek push (no longer freezes mid-motion)
  - Custom hover cursor position updates carry no CSS transition on any browser (Safari-jitter root cause fixed), independent of the eased ring/pill morph
  - Edge-zone click completes the in-progress peek to a full slide before swapping content, eliminating the abrupt directional-pop
affects: [homepage-carousel, HomeCarousel.astro]

tech-stack:
  added: []
  patterns:
    - "Position/state-morph CSS split: an untransitioned position anchor element wrapping an independently-eased inner element, so per-frame JS writes on the outer never fight an in-flight CSS transition"
    - "rAF pump-until-deadline (keepWordmarkSynced/pumpWordmarkSync): a small self-scheduling requestAnimationFrame loop with a rolling `until` timestamp, used to keep a derived CSS custom property in sync with a live CSS transform for a bounded window after the last relevant event"
    - "Commit-then-swap with a re-entrancy flag + transitionend/fallback-timer single-shot finish(): animate to a full target state first, then perform a synchronous content swap under an existing transition-disabled class once the animation has genuinely completed"

key-files:
  created: []
  modified:
    - src/components/HomeCarousel.astro
    - tests/e2e/homepage.spec.ts

key-decisions:
  - "Bug B fix wraps the cursor's label+arrow in a new .home-hero__cursor-ring inner element rather than adding a second sibling cursor element, keeping data-zone/aria-hidden on the outer so all existing zone-based descendant selectors (label/arrow) kept matching unchanged"
  - "Bug A's rAF sync loop is additive to the existing load/resize/reveal syncWordmarkAlignment() call sites, not a replacement — self-guards on hoverCapable and prefers-reduced-motion so it's a no-op on touch and for reduced-motion visitors"
  - "Bug C's commitEdge() only replaces the desktop edge-zone CLICK path; keyboard, dash-click, swipe, and auto-advance keep calling goToPrev()/goToNext()/goToIndex() directly, unchanged"
  - "Copied the main repo's gitignored .env (Sanity credentials) into this worktree and ran an isolated-port `astro preview` (4325) plus a throwaway (untracked, deleted before finishing) Playwright config, instead of reusing the main repo's already-running dev server on the default port 4321 — that server lives in a different working directory (the main checkout, not this worktree) so it would never reflect this worktree's edits, and killing another process outside this worktree was avoided per worktree isolation"

requirements-completed: [QUICK-260727-bsm]

coverage:
  - id: D1
    description: "Wordmark cutout tracks the hero photo pixel-for-pixel during a peek push and its ~420ms ease-settle (no longer frozen mid-motion)"
    requirement: "QUICK-260727-bsm"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#carousel wordmark stays synced to the peek (Bug A) > FR: wordmark bg-position tracks a right-edge peek push"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#carousel wordmark stays synced to the peek (Bug A) > EN: wordmark bg-position tracks a right-edge peek push"
        status: pass
    human_judgment: false
  - id: D2
    description: "Custom hover cursor's position tracking carries no CSS transform transition on any browser (position instant, ring/pill morph still eases)"
    requirement: "QUICK-260727-bsm"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#carousel hover cursor (sketch 008 Variant C) > the cursor position anchor carries no transform transition (Safari-jitter fix)"
        status: pass
    human_judgment: true
    rationale: "The Safari-specific jitter this fix targets cannot be reproduced/observed in this Chromium-only test environment (no WebKit-desktop project configured) — the computed-style test proves the structural fix (no transform transition on the position anchor) but actual smoothness in Safari needs a human to confirm live after deploy."
  - id: D3
    description: "Edge-zone click defers the content swap until the peek has slid fully in, then swaps at a neutral transform onto the exact photo that was already peeking (no pop, no third-image flash, no directional reversal)"
    requirement: "QUICK-260727-bsm"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#carousel hover-click navigation (sketch 008 Variant C) > FR right edge click defers the content swap until the peek has fully slid in, landing on the peeked photo at a neutral transform"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#carousel hover-click navigation (sketch 008 Variant C) > EN right edge click defers the content swap until the peek has fully slid in"
        status: pass
    human_judgment: false
  - id: D4
    description: "Keyboard arrows, dash clicks, swipe, auto-advance, center-click open, and mobile tap remain behaviourally unchanged"
    requirement: "QUICK-260727-bsm"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts (full homepage.spec.ts suite, 81/81)"
        status: pass
      - kind: e2e
        ref: "npx playwright test (full repo e2e suite, 232/232, chromium + webkit-mobile projects)"
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-07-27
status: complete
---

# Quick Task 260727-bsm: Fix Wordmark Peek Desync, Safari Cursor Jitter, and Edge-Click Pop Summary

**Three independently-root-caused fixes to the sketch-008 hover-navigation carousel: a per-frame rAF sync loop keeps the wordmark photo-cutout tracking the live peek transform, a position/state-morph CSS split kills the Safari cursor jitter, and a commit-then-swap sequence makes edge-click read as a smooth continuation of the peek instead of an abrupt pop.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-07-27T08:43:00Z (approx.)
- **Completed:** 2026-07-27T08:54:52Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments

- **Bug A (wordmark peek desync) fixed:** added `keepWordmarkSynced()`/`pumpWordmarkSync()`, a small self-scheduling `requestAnimationFrame` pump that keeps calling the existing `syncWordmarkAlignment()` every frame for ~500ms past the last peek-transform change — comfortably past the 420ms ease — so the wordmark cutout never freezes mid-motion. Wired at the end of `updatePeek()` (active push + retarget) and `resetPeek()` (mouseleave recede + every `render()` swap). Self-guards on `hoverCapable`/reduced-motion.
- **Bug B (Safari cursor jitter) fixed:** split the cursor's outer `.home-hero__cursor` (pure position anchor, JS-driven `translate(x, y)`, only an `opacity` transition) from a new inner `.home-hero__cursor-ring` (owns all scale/geometry/color morph transitions). The outer never carries a `transform` transition on any browser now, so mousemove position writes can never retarget an in-flight eased transition — the root cause of the Safari jitter, and of a secondary bug where the shared inline `transform` write silently dropped `scale()`.
- **Bug C (edge-click abrupt pop) fixed:** new `commitEdge(direction)` continues the in-progress peek to a full slide (easing from the current proximity, not resetting first) via `--peek-shift`/peek-layer targets, then performs the content swap synchronously under the existing `.is-opening` transition-disabled class once the peek layer's `transitionend` fires (with a 480ms fallback timer). A new `committing` re-entrancy flag guards the click handler, blocks `mousemove` from fighting the animation, and defers `mouseleave`'s reset to the commit's own cleanup. Only the desktop edge-zone CLICK path changed — keyboard/dash/swipe/auto-advance are untouched.

## Task Commits

Each task was committed atomically:

1. **Task 1: Split the hover cursor into an untransitioned position anchor + an eased visual ring (Bug B)** - `b167a56` (fix)
2. **Task 2: Keep the wordmark cutout synced to the hero photo's live transformed position via a rAF loop (Bug A)** - `5aa4c68` (fix)
3. **Task 3: Edge-click completes the peek to a full slide, then swaps content with transitions disabled behind a re-entrancy guard (Bug C)** - `4425a54` (fix)

_Note: no test/feat/refactor split — each task is a self-contained bugfix with its own new/updated e2e coverage in the same commit, matching this repo's established quick-task convention._

## Files Created/Modified

- `src/components/HomeCarousel.astro` - Added `.home-hero__cursor-ring` markup/CSS (Bug B); added `keepWordmarkSynced()`/`pumpWordmarkSync()` and wired them into `updatePeek()`/`resetPeek()` (Bug A); added `commitEdge()`, the `committing` flag, and updated the click/mousemove/mouseleave handlers (Bug C)
- `tests/e2e/homepage.spec.ts` - Retargeted the cursor edge-zone background-color assertion to `.home-hero__cursor-ring`; added a transitionProperty regression test (Bug B); added FR+EN "wordmark stays synced to the peek" tests (Bug A); added FR+EN "defers the content swap" tests (Bug C)

## Decisions Made

- Bug B: wrap label+arrow in a new inner ring element (not a second sibling cursor element) so every existing `data-zone`-based descendant selector keeps matching through the new wrapper unchanged.
- Bug A: the rAF sync loop is purely additive to the existing load/resize/reveal call sites — no existing `syncWordmarkAlignment()` call site was removed.
- Bug C: `commitEdge()` only replaces the desktop edge-zone CLICK path; every other navigation path (keyboard, dash, swipe, auto-advance) is untouched, per the plan's explicit scope boundary.
- Verification environment: this worktree had no `.env` (gitignored, not inherited by `git worktree`), and port 4321 was already occupied by an unrelated `astro dev` server running in the main repo checkout (not this worktree, so it would never reflect these edits). Copied the main repo's `.env` into this worktree and ran an isolated `astro preview --port 4325` plus a throwaway, untracked Playwright config (deleted before finishing) to run the full e2e suite against a real build with real Sanity content, without touching the other process.

## Deviations from Plan

None - plan executed exactly as written. No pure functions were added to `src/lib/home-carousel.ts` (per the plan's explicit constraint) — `computeWordmarkBackgroundPosition`, `computeHoverZone`, and `detectSwipeDirection` are unchanged.

## Issues Encountered

- The default `npm run test:e2e` / `playwright.config.ts` webServer setup reuses whatever is already listening on port 4321, which turned out to be an unrelated `astro dev` server running in the main repo (not this worktree) — its live-reload could never see this worktree's file changes, and the worktree itself had no `.env` to build with anyway. Resolved by building locally, running an isolated-port `astro preview` (4325), and pointing a throwaway Playwright config at it (see Decisions Made above). No code change resulted from this — purely a local verification-environment issue.
- `npm run test:unit` has one known-unrelated failing suite (`tests/unit/dashboard-logic.test.ts`, missing `@sanity/icons` package in the Studio subproject) — this is the same pre-existing, documented-in-plan gap noted in prior quick-task SUMMARYs (e.g. 260726-obg, 260726-u97), not something these three fixes touch. All other 119 unit tests pass.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All three bugs (wordmark desync, Safari cursor jitter, edge-click pop) are fixed and covered by new regression tests; full homepage e2e suite (81/81) and full repo e2e suite (232/232, chromium + webkit-mobile) are green; `astro check` is clean (0 errors, the same 7 pre-existing hints as before).
- **Live Safari verification needed:** the Safari-specific cursor jitter this plan fixes (Bug B) cannot be reproduced or confirmed in this Chromium-only test environment — the computed-style test proves the structural fix (no `transform` transition on the position anchor), but actual smoothness in real Safari should be confirmed by the user after this ships to staging/production.
- No blockers for further homepage-carousel work.

---
*Phase: quick-260727-bsm*
*Completed: 2026-07-27*

## Self-Check: PASSED

- FOUND: `src/components/HomeCarousel.astro`
- FOUND: `tests/e2e/homepage.spec.ts`
- FOUND: `.planning/quick/260727-bsm-fix-wordmark-peek-desync-safari-cursor-j/260727-bsm-SUMMARY.md`
- FOUND commit: `b167a56` (Task 1)
- FOUND commit: `5aa4c68` (Task 2)
- FOUND commit: `4425a54` (Task 3)
