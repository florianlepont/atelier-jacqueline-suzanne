---
phase: quick-260713-jfz
plan: 01
subsystem: ui
tags: [astro, view-transitions, css, playwright, homepage]

requires:
  - phase: quick-260713-hcj
    provides: grid-mode hero tile wordmark/component structure that the shared-element morph now names
provides:
  - document.startViewTransition()-wrapped carousel/grid mode toggle with feature-detect fallback
  - shared-element morph (hero photo <-> matching grid tile) via a JS-managed view-transition-name
  - custom ~420ms root cross-fade timing under prefers-reduced-motion:no-preference
  - explicit animation:none override under prefers-reduced-motion:reduce
  - independently-named accent panel (ajs-accent-panel) and header (ajs-header) transition groups with explicit z-index stacking, so both stay visible/fade smoothly instead of being occluded by the morphing photo
  - new reduced-motion functional-swap Playwright regression test
affects: [homepage, HomeCarousel.astro]

tech-stack:
  added: []
  patterns:
    - "document.startViewTransition() feature-detected with a narrow local VTDocument type, never referencing lib.dom's not-yet-universal ViewTransition typing"
    - "Shared-element morph via JS-managed view-transition-name (cleared/re-assigned on every toggle, tracked via a module-scoped namedMorphTile), not a static CSS-only name"
    - "::view-transition-* pseudo-element rules live in a separate <style is:global> block since Astro scoped styles cannot target document-root pseudo-elements"
    - "Explicit z-index on ::view-transition-group() pseudo-elements to guarantee stacking order, rather than relying on default DOM/paint-order stacking — required once an element (the header) comes BEFORE the named morph target in markup order"

key-files:
  created: []
  modified:
    - src/components/HomeCarousel.astro
    - tests/e2e/homepage.spec.ts

key-decisions:
  - "Did not attach cleanup to the transition's .finished promise (per plan's threat model T-jfz-01) — a rapid second toggle skips the in-flight transition and rejects .finished; morph-name management is synchronous instead, avoiding unhandled rejections"
  - "Task 3 (checkpoint:human-verify, blocking) was performed by the orchestrator directly with the real user, not by the executor subagent — the executor stopped after Task 2 per explicit dispatch instructions, since a subagent has no channel to the actual human"
  - "Task 3 surfaced two real bugs, not just polish requests: the accent panel and the header were both being visually occluded by the morphing photo for a portion of the transition (unnamed elements are part of the flat root snapshot, which the browser stacks BELOW any named group by default), then snapped into view once the transition overlay tore down. Fixed by naming both (ajs-accent-panel, ajs-header) and adding explicit z-index on the transition groups — the header specifically needed the explicit z-index (not just naming) because it comes before .home-hero__photo in DOM order, so default paint-order stacking would not have fixed it the way it incidentally did for the panel"

patterns-established:
  - "Verification-only alternate-port Playwright config workaround for stray dev-server port squatting (see Issues Encountered) — scratchpad/local pattern, not committed to the repo"
  - "When a named view-transition group's animated box can visually overlap another page element, that element must ALSO be named (and explicitly z-indexed relative to the other groups) or it will be silently occluded for the duration of the animation — this is not obvious from the API surface and only shows up as a live visual defect, not a Playwright-assertable one"

requirements-completed: []

coverage:
  - id: D1
    description: "Carousel/grid toggle DOM mutation wrapped in document.startViewTransition() with feature-detect fallback to instant mutate() for unsupported browsers"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#single unified mode toggle (HOME-01, D-01/D-02) > exactly one toggle button exists and its accessible name flips with display mode"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#carousel/grid display mode toggle (D-08) > toggling to grid reveals a 2-column grid of gallery tiles; toggling back returns the hero carousel"
        status: pass
    human_judgment: false
  - id: D2
    description: "Shared-element morph (hero photo <-> matching grid tile) reads as an animated, dynamic swap rather than an instant pop or flat cross-fade"
    verification:
      - kind: human
        ref: "Task 3 checkpoint — orchestrator captured mid-transition screenshots showing the photo genuinely growing/repositioning between its grid-tile and carousel-hero geometry (not a flat cross-fade), then presented the live build to the user, who confirmed: \"That's really great!\""
        status: pass
    human_judgment: true
    rationale: "View Transitions are a browser-internal pseudo-element animation; confirmed both via captured mid-transition frames (orchestrator) and direct observation (user, on the live dev server)."
  - id: D3
    description: "prefers-reduced-motion: reduce disables the transition animation, making the swap effectively instant while remaining functionally correct"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#view-transition toggle — reduced-motion still swaps modes > toggling with prefers-reduced-motion: reduce still functionally swaps carousel/grid"
        status: pass
      - kind: other
        ref: "Orchestrator confirmed via page.emulateMedia({reducedMotion:'reduce'}) that the reduced-motion CSS guard rule is present in the CSSOM and the swap completes near-instantly under emulation"
        status: pass
    human_judgment: true
    rationale: "Automated + emulated verification both pass; full OS-level 'Reduce Motion' toggle confirmation was not separately re-run after the panel/header fix, but that fix only touched z-index/naming/timing for the no-preference path — the reduced-motion wildcard guard (::view-transition-group(*) etc.) already covered the newly-named groups automatically, unchanged."
  - id: D4
    description: "The accent panel and header remain visible (fading in / cross-fading smoothly) throughout the transition, rather than being occluded by the morphing photo and then popping into view"
    verification:
      - kind: other
        ref: "Orchestrator captured cropped mid-transition screenshots at the exact frame (t=120ms) that was previously fully blank for the header, and previously showed the panel occluded/only-partially-composited — both now show correctly visible/blending content at the same frame, across multiple checked timestamps (60/80/120/160/240ms)"
        status: pass
      - kind: e2e
        ref: "Full 52-test suite (npx playwright test) re-run clean after the fix — no regression"
        status: pass
    human_judgment: true
    rationale: "This was direct user-reported feedback during the Task 3 checkpoint (\"the pink hero... pop in suddenly\", then \"the header... pops behind\" [corrected from an initial 'footer' misstatement]), root-caused and fixed by the orchestrator, then re-verified via screenshots before reporting back. The user has not yet re-confirmed this specific fix with their own eyes on the live server, though the underlying mechanism (occlusion by the unstacked root layer) is the same one already fixed and approved for the panel."

duration: ~35min (Tasks 1-2: ~6min executor; Task 3 checkpoint + 2 follow-up fixes: ~29min orchestrator, spanning two rounds of live diagnosis/fix/re-verify)
completed: 2026-07-13
status: complete
---

# Quick Task 260713-jfz: Animated view-transition carousel/grid morph Summary

**`document.startViewTransition()`-wrapped carousel/grid toggle with a shared-element hero-photo/grid-tile morph, ~420ms custom timing, feature-detect fallback, a reduced-motion guard, and independently-stacked accent-panel/header transition groups so neither gets visually occluded by the morphing photo mid-transition.**

## Performance

- **Duration:** ~35 min total (Tasks 1-2: ~6 min via executor subagent; Task 3 human checkpoint + two rounds of live-diagnosed follow-up fixes: ~29 min via the orchestrator working directly with the user)
- **Started:** 2026-07-13T14:08:07+02:00 (base commit)
- **Completed:** 2026-07-13T14:36:xx+02:00 (final regression gate green, dev server confirmed up)
- **Tasks:** 3 of 3 complete (Task 3 included two rounds of checkpoint-driven fixes, not just a pass/fail observation)
- **Files modified:** 2 (`src/components/HomeCarousel.astro`, `tests/e2e/homepage.spec.ts`)

## Accomplishments

- Wrapped the mode-toggle click handler's DOM mutation in `document.startViewTransition()`, feature-detected via a narrow local `VTDocument` type (no dependency on lib.dom's ViewTransition typing), with a direct fallback call for unsupported browsers.
- Implemented the shared-element morph: the grid gallery tile matching the current `carouselIndex` is JS-named `ajs-hero-morph` on every toggle (re-pointed to track auto-advance), matching `.home-hero__photo`'s scoped-CSS name — so the currently-shown hero photo morphs to/from the correct grid tile in either direction. Confirmed via DOM instrumentation that after auto-advancing to gallery index 2 ("Paysage"), the morph name correctly lands on the Paysage tile, not always the first one.
- Added a new `<style is:global>` block with ~420ms `cubic-bezier(0.4, 0, 0.2, 1)` timing on the root cross-fade and the photo morph group under `prefers-reduced-motion: no-preference`, and an explicit `animation: none !important` override under `prefers-reduced-motion: reduce`.
- **Checkpoint round 1 (user-approved overall, flagged one issue):** the pink accent panel was popping in suddenly instead of fading — root-caused to it being an unnamed element occluded by the higher-stacked photo-morph group for the whole transition. Fixed by naming it `ajs-accent-panel` with its own 380ms fade + 100ms entrance delay.
- **Checkpoint round 2 (user caught a second, related issue):** the header was going fully blank for a visible chunk of the transition, for the same underlying reason. Fixed by naming it `ajs-header` — and, since the header comes *before* the photo in DOM order (unlike the panel), also adding explicit `z-index` on the transition groups so stacking doesn't depend on markup order.
- Added a new Playwright test (`view-transition toggle — reduced-motion still swaps modes`) proving the toggle still functionally swaps carousel/grid end-to-end when reduced motion is emulated.
- Ran the full verification gate after every round: `npm run test:unit` (23/23), `npm run build`, `npx playwright test` (52/52 — the original 51 plus the new test), zero assertions weakened or skipped, across all three commits.

## Task Commits

1. **Task 1: Wrap the mode toggle in document.startViewTransition() with a shared-element hero-photo/grid-tile morph, custom timing, feature-detect fallback, and reduced-motion guard** - `7f93f25` (feat)
2. **Task 2: Regression + reduced-motion verification — full suite green, add one robust reduced-motion functional assertion** - `49df8b2` (test)
3. **Task 3 follow-up: keep accent panel and header visible during the morph** - `57733a8` (fix) — driven directly by the human-verify checkpoint's live feedback, not pre-planned

## Files Created/Modified

- `src/components/HomeCarousel.astro` - Toggle click handler refactored to feature-detect and wrap the existing `showGrid()`/`showCarousel()` mutation in `document.startViewTransition()`; shared-element morph-name management (`gridGalleryTiles`, `namedMorphTile`); `view-transition-name` added to `.home-hero__photo` (`ajs-hero-morph`), `.home-hero__accent` (`ajs-accent-panel`), and `.home-header` (`ajs-header`); a new `<style is:global>` block with custom timing, explicit z-index stacking, and reduced-motion `::view-transition-*` pseudo-element rules.
- `tests/e2e/homepage.spec.ts` - Added `view-transition toggle — reduced-motion still swaps modes` describe/test block (does not modify or weaken any existing test).

## Decisions Made

- **No `.finished`-promise cleanup**: per the plan's threat model (T-jfz-01, disposition: accept), morph-name management runs synchronously in the click handler rather than in a `.then()`/`.catch()` on the transition's `.finished` promise — a rapid second toggle causes the browser to natively skip the in-flight transition and reject `.finished`, which would otherwise surface as an unhandled promise rejection with no functional benefit.
- **Task 3 performed by the orchestrator, not the executor subagent**: a subagent has no channel to the real user, so the executor stopped after Task 2 per dispatch instructions, and the orchestrator picked up the live checkpoint directly — including diagnosing and fixing two rounds of feedback, not just relaying a pass/fail.
- **Explicit z-index over relying on DOM order**: the panel's occlusion fix happened to work via default paint-order stacking (it comes after the photo in markup), but the header does not (it comes before) — rather than leave that fragile, explicit z-index was added for both, making the stacking guarantee independent of markup order.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking, environment-only] Worked around a stray port-4321 process during verification**

- **Found during:** Task 2 (full verification gate — `npx playwright test`), inside the executor's isolated worktree
- **Issue:** A process already listening on port 4321 (later identified by the orchestrator as the orchestrator's own dev server from earlier in the session, not actually orphaned) caused Playwright, per `reuseExistingServer: !process.env.CI`, to reuse that stale/foreign server instead of starting a fresh preview of the worktree's build.
- **Fix:** The executor worked around it locally via a temporary alternate-port Playwright config (port 4322), deleted afterward, never committed. The orchestrator later confirmed (via `lsof`/`ps`) that the process was its own previously-started `npm run dev`, stopped it normally before its own build/preview cycles, and it was not actually a stray/problem process.
- **Result:** All verification ran cleanly in both the worktree (52/52 via the alt-port workaround) and the main checkout (52/52 via the normal port after the dev server was stopped).
- **Files modified:** None — verification-environment only.

---

**Total deviations:** 1 auto-fixed (1 blocking, environment-only — resolved as a non-issue, no code changes resulted)
**Impact on plan:** Zero code-scope impact from the deviation itself. The two checkpoint-driven follow-up fixes (panel, header) were real scope additions surfaced by Task 3 as designed — the checkpoint's whole purpose is to catch exactly this class of visual-only defect that automated tests cannot see.

## Issues Encountered

- See "Deviations from Plan" above regarding the port-4321 process — resolved as a non-issue (the orchestrator's own dev server, not orphaned).
- Two real visual bugs were found and fixed via the Task 3 checkpoint process itself — see Accomplishments and key-decisions above for the full root-cause/fix narrative. Both are now covered by explicit `view-transition-name` + `z-index` rules rather than incidental default stacking.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 3 tasks complete. `git log` shows `7f93f25` (feat), `49df8b2` (test), and `57733a8` (fix) on top of the plan's pre-dispatch base commit `8354929`.
- User confirmed the overall morph quality ("That's really great!") and the header/panel occlusion fixes were verified by the orchestrator via targeted mid-transition screenshots after the user's specific feedback, though the user has not yet given a final explicit "approved" on the very last (header) fix specifically — worth a quick final glance on their end, not a blocker to closing this quick task's tracking.
- No other blockers. `npm run build`, `npm run test:unit`, and `npx playwright test` are all green (52/52) against the current HEAD in the main checkout.

---
*Phase: quick-260713-jfz*
*Completed: 2026-07-13*

## Self-Check: PASSED

- FOUND: src/components/HomeCarousel.astro
- FOUND: tests/e2e/homepage.spec.ts
- FOUND: .planning/quick/260713-jfz-add-an-animated-transition-between-carou/260713-jfz-SUMMARY.md
- FOUND commit: 7f93f25 (Task 1)
- FOUND commit: 49df8b2 (Task 2)
- FOUND commit: 57733a8 (Task 3 follow-up fix)
