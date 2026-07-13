---
phase: 07-homepage-quick-fixes-mobile-hero-correctness
plan: 02
subsystem: ui
tags: [astro, css, view-transitions, playwright, mobile]

requires:
  - phase: 06-homepage-view-mode-toggle-grid-hero-wordmark-cutout
    provides: ".home-hero__photo / .home-hero__accent structural split and the 100svh full-bleed mobile hero fix, the known-working baseline this plan investigates a regression against"
  - phase: quick/260713-jfz
    provides: "document.startViewTransition()-wrapped toggle handler and the ajs-hero-morph/ajs-accent-panel view-transition-name wiring, the leading D-10 hypothesis for this plan's investigation"
provides:
  - "Mobile-emulation (iPhone 14 Pro device profile) regression test encoding the full-bleed hero invariants (header/photo flush to viewport top, photo fills the small viewport, footer below the fold, morph reachable on mobile)"
  - ".home-hero__photo / .home-hero__accent no longer carry a permanent, unconditional view-transition-name in CSS — both are now named dynamically via JS, only for the duration of an active toggle transition, matching the existing gridGalleryTiles/namedMorphTile pattern"
affects: []

tech-stack:
  added: []
  patterns:
    - "Dynamic, click-time-only view-transition-name assignment (JS style property, never a permanent CSS declaration) for elements whose sizing/positioning is otherwise sensitive to first-paint timing — same persistence model as the existing namedMorphTile/gridGalleryTiles mechanism, now applied symmetrically to .home-hero__photo/.home-hero__accent too"

key-files:
  created: []
  modified:
    - src/components/HomeCarousel.astro
    - tests/e2e/homepage.spec.ts

key-decisions:
  - "D-10 hypothesis (unconditional view-transition-name on the mobile hero causing the real-device regression) could not be directly confirmed or reproduced under Chromium mobile emulation (Task 1's test passed GREEN on its very first run, before any fix, and a disable/re-enable experiment showed no measurable difference) — consistent with D-11's explicit warning that this bug class has already escaped emulation-only testing once before (Phase 6's 100vh->100svh fix was only caught via a real iPhone 17 Pro screenshot)"
  - "Applied the fix anyway per D-12: removed the permanent/unconditional view-transition-name from .home-hero__photo and .home-hero__accent, moving both to dynamic JS assignment scoped to the toggle click handler — this is the mechanistically sound, low-risk correction the hypothesis itself points to (an 'always named, even at rest' state that the grid-tile counterpart never had), even though it cannot be proven to fix the exact real-device symptom via this test suite alone"
  - "Deliberately did NOT clear the dynamic names back to '' after the transition finishes (via transition.finished) — an interim version of the fix did this and it intermittently broke the pre-existing accent-panel fade-timing test: a second toggle click fired before the first transition's finished promise settled raced the cleanup against the second click's own naming, sometimes clearing the name while the second transition was still capturing its snapshot. Left the names in place after the first interaction instead (same persistence model already used for morphTarget/namedMorphTile) — this still fully satisfies the D-10 hypothesis (no name present at first paint / before any interaction, which is what the reported regression is about) without the race."
  - "document.startViewTransition() and the carousel/grid morph remain fully active and unconditional on mobile — not gated to desktop/pointer:fine (D-12 satisfied, no last-resort deviation needed)"

patterns-established:
  - "Elements whose CSS sizing is sensitive to first-paint/viewport-unit timing (100svh/100vh chains) should not carry a permanent view-transition-name; name them dynamically, synchronously, right before calling startViewTransition(), mirroring the shared-element-morph pattern already used for grid tiles"

requirements-completed: [HOME-06]

coverage:
  - id: D1
    description: "At an iPhone mobile-emulation viewport, on first load the hero photo starts flush at the top with no white gap above the header"
    requirement: HOME-06
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#mobile full-bleed hero regression (HOME-06) > at an iPhone viewport, on first load the hero is full-bleed with no gap above the header and no footer bleed-through, and the morph stays active"
        status: pass
    human_judgment: false
  - id: D2
    description: "The site footer is not visible / does not bleed through within the initial mobile viewport before any scrolling"
    requirement: HOME-06
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#mobile full-bleed hero regression (HOME-06) > (same test, footer bounding-box assertion)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The carousel<->grid morph (View Transitions) still functions on mobile — not gated to desktop/pointer:fine"
    requirement: HOME-06
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#mobile full-bleed hero regression (HOME-06) > (same test, startViewTransition feature-detect + toggle-swap assertion)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#view-transition toggle — reduced-motion still swaps modes"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#view-transition accent-panel fade timing (quick-260713-kit)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Real-device (iPhone 17 Pro Safari) recurrence of the exact reported symptom cannot be ruled out by emulation alone — explicitly a judgment/risk-acceptance call per D-11, not a verifiable automated claim"
    verification:
      - kind: manual_procedural
        ref: "D-11's own framing: Playwright's iPhone device profile runs on the chromium engine (test.use() only overrides viewport/isMobile/hasTouch/UA, not the browser engine); this bug class already escaped devtools/emulation testing once before Phase 6's real-device-only-caught 100vh->100svh fix"
        status: pass
    human_judgment: true
    rationale: "The user explicitly chose emulation-only verification for this phase (D-11), accepting that a green Playwright run is not a real-device guarantee. This is documented as a known limitation, not silently assumed away."

duration: ~20min
completed: 2026-07-14
status: complete
---

# Phase 7 Plan 02: Mobile Hero Full-Bleed Regression Fix (HOME-06) Summary

**Added a Chromium-mobile-emulation regression test for the reported iPhone full-bleed hero bug, then removed the unconditional `view-transition-name` from `.home-hero__photo`/`.home-hero__accent` (making it dynamic/click-time-only, matching the grid tile's existing pattern) per the D-10 investigation, while keeping the carousel/grid morph fully active on mobile.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-07-14T00:46:00Z (approx)
- **Completed:** 2026-07-14T00:51:30Z
- **Tasks:** 2 completed
- **Files modified:** 2 (`tests/e2e/homepage.spec.ts`, `src/components/HomeCarousel.astro`)

## Accomplishments

- **Task 1 (test):** Added `test.describe('mobile full-bleed hero regression (HOME-06)')` using `test.use({ ...devices['iPhone 14 Pro'] })` (with `defaultBrowserType` stripped from the spread — Playwright refuses that key inside a `describe`-scoped `test.use()`, since the suite has a single chromium project and switching engines per-describe would force a new worker). Asserts: header/hero-photo top within 1px of the viewport top, hero photo height ≥ viewport height − 2px, the site's always-rendered `<footer>` sits at/below the fold, `document.startViewTransition` is present, and the toggle still functionally swaps carousel↔grid.
- The test **passed GREEN on its very first run**, before any Task 2 change — recorded as the initial state per the plan's explicit allowance ("It may or may not go RED... if it passes already, it stands as the regression guard/contract").
- **Task 2 (root cause + fix):** Investigated in D-10's mandated order (view-transitions first). Ran a controlled disable/re-enable experiment: temporarily removed `view-transition-name: ajs-hero-morph` / `ajs-accent-panel` from the CSS, rebuilt, and re-ran Task 1's test — result was unchanged (still GREEN), so the hypothesis could not be directly confirmed as reproducible under Chromium mobile emulation. This is consistent with D-11's explicit warning that this exact bug class (`100vh`/`100svh` Safari-chrome timing) has already escaped devtools/emulation-only testing once before (Phase 6's fix was only caught via a real iPhone 17 Pro screenshot).
- Applied the fix anyway per D-12, since it is the mechanistically sound, low-risk correction the hypothesis itself points to: `.home-hero__photo` and `.home-hero__accent` previously carried a **permanent, unconditional** `view-transition-name` in the stylesheet (present at all times, including first paint, with no active transition running) — an asymmetry against the matching grid tile, which was always named only dynamically (JS, at click time). Removed both static CSS declarations; the toggle click handler in `<script>` now sets `heroPhoto.style.viewTransitionName` / `accentPanel.style.viewTransitionName` synchronously, immediately before calling `startViewTransition()`, exactly mirroring the existing `morphTarget`/`namedMorphTile` mechanism.
- Iterated on the fix once more after discovering a real regression it introduced: an initial version cleared the two names back to `''` via `transition.finished.finally(...)`. Running the full `homepage.spec.ts` suite caught this breaking the pre-existing `view-transition accent-panel fade timing (quick-260713-kit)` test — a race where a second toggle click (fired before the first transition's `finished` promise settled) had its own naming clobbered by the first transition's delayed cleanup, silently preventing `::view-transition-new(ajs-accent-panel)` from materializing. Fixed by **not** clearing the names after the transition — left in place after the first interaction, same persistence model already used for `morphTarget`/`namedMorphTile`. This still fully satisfies D-10's concern (no name present at first paint / before any interaction — the actual scenario the reported regression describes) without the race.
- `document.startViewTransition()` and the carousel/grid morph remain unconditionally active on mobile — not gated to `pointer:fine`/desktop (D-12 satisfied without a last-resort deviation).
- Re-ran the new mobile-emulation test 3x consecutively plus the full `homepage.spec.ts` and full `test:e2e` suites after the fix — all green, no flakiness observed.

## Task Commits

1. **Task 1 (test):** `9f61219` (test) — mobile full-bleed hero regression guard added to `tests/e2e/homepage.spec.ts`; GREEN on first run.
2. **Task 2 (fix):** `67f763e` (fix) — removed unconditional `view-transition-name` from `.home-hero__photo`/`.home-hero__accent`, moved naming to the toggle click handler (JS, click-time-only, never cleared to avoid the fade-timing race).

**Plan metadata:** commit pending (this SUMMARY + STATE/ROADMAP update).

## Files Created/Modified

- `tests/e2e/homepage.spec.ts` — added `devices` import and `test.describe('mobile full-bleed hero regression (HOME-06)')` (1 test, 6 assertions: header/photo top, photo height, footer position, `startViewTransition` presence, functional toggle swap).
- `src/components/HomeCarousel.astro` — removed `view-transition-name: ajs-hero-morph` from `.home-hero__photo`'s base rule and `view-transition-name: ajs-accent-panel` from `.home-hero__accent`'s base rule (both replaced with explanatory comments); added dynamic assignment of both names to the `modeToggleBtn` click handler in the `<script>` block, right before `startViewTransition()`; lightly updated the adjacent `.home-header` comment for accuracy (it referenced the accent panel's now-changed static naming).

## Decisions Made

- D-10 investigation order followed exactly as specified (view-transitions first, before re-auditing the `100svh`/`max-height:100vh` chain from scratch) — the chain itself was re-confirmed correct and unchanged (still matches Phase 6's known-working baseline), so no changes were needed there.
- The hypothesis could not be proven via a reproducible RED→GREEN cycle in this suite (both before and after removing the static naming, the test was GREEN) — documented explicitly as a limitation of Chromium-engine emulation per D-11, not glossed over as "confirmed and fixed."
- Chose to still apply the narrowest structural fix consistent with the hypothesis (make hero-photo/accent-panel naming dynamic and symmetric with the grid tile) rather than leave the code unchanged just because the test couldn't prove a difference — this satisfies the plan's D-12 mandate to actually investigate and correct the identified asymmetry, not just add a test around unchanged code.
- Explicitly rejected the "clear name via `transition.finished`" approach after it caused a real, observed test failure — chose the simpler, already-proven-safe "set once, leave it" persistence model instead, avoiding a promise-timing race entirely rather than trying to patch around it.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Interim fix design (clearing names via `transition.finished`) broke the existing accent-panel fade-timing test**

- **Found during:** Task 2, immediately after implementing the first version of the dynamic-naming fix and running the full `homepage.spec.ts` suite (not just the new Task 1 test) as required by the plan's own acceptance criteria.
- **Issue:** Clearing `heroPhoto`/`accentPanel`'s `view-transition-name` back to `''` inside `transition.finished.finally(...)` raced against a second toggle click fired shortly after the first (exactly the sequence the pre-existing `view-transition accent-panel fade timing (quick-260713-kit)` test performs) — the first transition's delayed cleanup could clear the name while the second transition was still actively capturing its "new" snapshot, causing `document.getAnimations()` to find no `::view-transition-new(ajs-accent-panel)` pseudo-element (`opacities` came back `null`).
- **Fix:** Removed the `transition.finished` cleanup entirely. Names are now set once per click and left in place (never proactively cleared) — identical persistence model to the pre-existing `namedMorphTile` mechanism, which has no such race because it's never cleared via a promise callback either (only ever overwritten synchronously at the start of the next click).
- **Files modified:** `src/components/HomeCarousel.astro`
- **Verification:** Re-ran the full `homepage.spec.ts` suite (24/24 passing, including the previously-broken fade-timing test) 3 consecutive times, plus the full `test:e2e` suite (70/70 passing) and `test:unit` (40/40 passing) and `npm run build`.
- **Committed in:** `67f763e` (the fix commit itself already reflects the corrected, race-free version — the intermediate broken version was never committed).

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug caught and corrected before commit, never landed in history).
**Impact on plan:** None on scope — this was mid-implementation self-correction within Task 2's own verification loop (`npm run test:e2e -- homepage.spec.ts` fully green, per the plan's stated acceptance criteria), not a deviation from what the plan asked for.

## Issues Encountered

- None outstanding. The D-11 caveat (emulation green is not a real-device guarantee) is a known, accepted limitation — not an issue requiring further action within this plan's scope. If the real-device symptom (white gap above header + footer bleed-through on an actual iPhone 17 Pro) recurs live post-ship, it should be filed as a follow-up quick task per the plan's own instruction, since this exact bug class has already escaped Chromium/devtools-only emulation once before (Phase 6's fix was only caught via a real-device screenshot).

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- HOME-06 is complete per the phase's success criteria: the new mobile-emulation test passes, the D-10 investigation was performed in the mandated order and its outcome documented (hypothesis not directly reproducible under Chromium emulation, but the identified asymmetry was corrected anyway per D-12), the carousel/grid morph remains fully active on mobile (no last-resort desktop-gating deviation needed), and the full e2e (70/70) + unit (40/40) suites plus the static build are all green.
- This closes Phase 7 (HOME-04, HOME-05 from Plan 01; HOME-06 from this plan) — all three of the phase's requirements are now implemented and verified.
- Phase 10's later shared-header consolidation is unaffected by this plan's changes (it only touched `.home-hero__photo`/`.home-hero__accent`'s view-transition wiring and the toggle's click handler, not `.home-header`/`.home-nav` markup).

---
*Phase: 07-homepage-quick-fixes-mobile-hero-correctness*
*Completed: 2026-07-14*

## Self-Check: PASSED

All claimed files exist on disk and all claimed commit hashes (`9f61219`, `67f763e`) are present in git history.
