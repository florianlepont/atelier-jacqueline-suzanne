---
phase: 17-homepage-carousel-intro-fixes
plan: 01
subsystem: ui
tags: [astro, playwright, e2e, css, homepage-carousel]

requires: []
provides:
  - "Homepage hero carousel no longer pauses auto-advance on pointer hover (HOME-11)"
  - "Homepage grid-mode intro paragraph renders in full, no 2-line clamp (HOME-12)"
  - "Keyboard-focus pause (D-02) and explicit pause/play toggle (D-03) preserved unchanged"
  - "Fix for a fallout regression: progress-dash mouse clicks no longer permanently freeze auto-advance"
affects: []

tech-stack:
  added: []
  patterns:
    - ":focus-visible-gated blur() to distinguish mouse-driven from keyboard-driven button focus, used to keep a focus-pause mechanism from misfiring on mouse interactions"

key-files:
  created: []
  modified:
    - src/components/HomeCarousel.astro
    - tests/e2e/homepage-carousel-core.spec.ts
    - tests/e2e/homepage-content-display.spec.ts

key-decisions:
  - "Removed only the mouseenter/mouseleave hero listeners (D-01); kept focusin/focusout (D-02) and the explicit toggle (D-03) byte-for-byte per the plan's guard list"
  - "Removed the .home-grid__intro-body line-clamp entirely with no substitute cap (D-04); no spacing adjustment was needed at either 1280x800 or 375x812 — the paragraph already fit inside the hero tile"
  - "Rule 1 auto-fix: blurred progress-dash buttons after a mouse click (gated on :focus-visible so real keyboard Tab navigation is unaffected) to fix a permanent auto-advance freeze that Task 1's hover-listener removal exposed"

patterns-established:
  - "For any future carousel/grid navigation control, gate focus-driven pause behavior on `:focus-visible` when the control itself is also mouse-clickable, to avoid a lingering mouse-click focus silently blocking automatic behavior that only real keyboard focus should block"

requirements-completed: [HOME-11, HOME-12]

coverage:
  - id: D1
    description: "Hovering the pointer over the hero carousel no longer pauses auto-advance; the dashed progress-fill keeps animating"
    requirement: HOME-11
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage-carousel-core.spec.ts#carousel index keeps advancing every 6000ms while the pointer hovers it (HOME-11)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Keyboard focus on the autoplay toggle still pauses auto-advance; blurring resumes it (D-02 preserved)"
    requirement: HOME-11
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage-carousel-core.spec.ts#keyboard focus on the autoplay toggle still pauses auto-advance; blurring resumes it (D-02)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Explicit pause/play toggle still pauses and resumes exactly as before, unaffected by the hover-pause removal (D-03 preserved)"
    requirement: HOME-11
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage-carousel-core.spec.ts#the explicit pause control persists after pointer movement and can resume playback"
        status: pass
    human_judgment: false
  - id: D4
    description: "Grid-mode intro paragraph renders full Sanity text with no clamp and no clipping by the hero tile, at desktop (1280x800) and mobile (375x812)"
    requirement: HOME-12
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage-content-display.spec.ts#grid intro paragraph is not truncated (HOME-12) desktop (1280x800)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage-content-display.spec.ts#grid intro paragraph is not truncated (HOME-12) mobile (375x812)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Full CI gate (build, e2e across chromium+webkit-mobile, unit, typecheck, lint) is green with no test skipped or weakened, including the progress-dash focus/blur fallout fix"
    verification:
      - kind: e2e
        ref: "npm run test:e2e (263 tests, 2 projects)"
        status: pass
      - kind: unit
        ref: "npm run test:unit (271 tests)"
        status: pass
      - kind: other
        ref: "npm run typecheck (0 errors)"
        status: pass
      - kind: other
        ref: "npm run lint (0 errors)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Human-check (end-of-phase): hover keeps advancing, pause toggle works, keyboard focus pauses, grid intro paragraph is complete at desktop and mobile widths"
    verification:
      - kind: automated_ui
        ref: "one-off Playwright script against `npm run dev` (localhost:4321), all 5 assertions pass — see Human-Check Outcome section"
        status: pass
    human_judgment: false

duration: 20min
completed: 2026-08-02
status: complete
---

# Phase 17 Plan 01: Homepage Carousel & Intro Fixes Summary

**Removed pointer-hover auto-advance pause and the 2-line intro-paragraph clamp in `HomeCarousel.astro`, plus a `:focus-visible`-gated blur fix for a dash-click focus-lock regression the hover removal exposed.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-08-02T14:01:00+02:00 (approx.)
- **Completed:** 2026-08-02T14:31:00+02:00 (approx.)
- **Tasks:** 3 (all `type="auto" tdd="true"`/`type="auto"`, all autonomous)
- **Files modified:** 3 (`src/components/HomeCarousel.astro`, `tests/e2e/homepage-carousel-core.spec.ts`, `tests/e2e/homepage-content-display.spec.ts`)

## Accomplishments

- HOME-11: the hero carousel now keeps auto-advancing (and the dashed progress-fill keeps animating) while the pointer merely hovers it; keyboard-focus pause (D-02) and the explicit pause/play toggle (D-03) are untouched
- HOME-12: the grid-mode intro paragraph (`.home-grid__intro-body`) now renders its full Sanity-authored text at every viewport — the 2-line `-webkit-line-clamp` is gone, with no substitute cap, and no spacing adjustment was needed
- Found and fixed (Rule 1) a real fallout regression from the HOME-11 change: clicking a progress dash left it holding mouse-driven focus, which — with hover no longer resuming the timer — permanently froze auto-advance until the user tabbed away. Fixed by blurring the dash after a click, gated on `:focus-visible` so genuine keyboard Tab navigation still gets D-02's pause
- Full regression sweep: 263/263 e2e tests (chromium + webkit-mobile), 271/271 unit tests, 0 typecheck errors, 0 lint errors — all green on a fresh build

## Task Commits

Each task was committed atomically:

1. **Task 1: Stop the pointer hover from pausing auto-advance, keep the keyboard-focus pause (HOME-11, D-01/D-02/D-03)** - `c52b90c` (fix)
2. **Task 2: Show the grid-mode intro paragraph in full (HOME-12, D-04)** - `8732c97` (fix)
3. **Task 3: Full-suite regression sweep, stabilising hover-dependent specs with a frozen clock** - `ce788d5` (fix — component-level bugfix, not test stabilization; see Deviations)

_Note: Task 1 and Task 2 each followed a RED → GREEN TDD cycle within their single commit (test edit observed failing against the unmodified component, then the component was fixed and re-verified green) — see Deviations/Issues below for the RED observations, which were not separately committed per the plan's own TDD flow (test + fix landed together per task, matching the plan's `<action>` sequencing, not the generic RED-commit/GREEN-commit pattern)._

**Plan metadata:** committed separately by the orchestrator after wave completion (worktree mode — this agent does not commit STATE.md/ROADMAP.md).

## Files Created/Modified

- `src/components/HomeCarousel.astro` - Removed `hero.addEventListener('mouseenter'/'mouseleave', ...)` (D-01); removed the 4 truncation declarations from `.home-grid__intro-body` (D-04); corrected two stale comments; added a `:focus-visible`-gated `dash.blur()` in the progress-dash click handler (Task 3 fallout fix)
- `tests/e2e/homepage-carousel-core.spec.ts` - Rewrote the hover test to assert auto-advance continues while hovered (HOME-11); added a new test asserting keyboard focus on the autoplay toggle still pauses/resumes (D-02 regression guard) — file went from 16 to 17 tests
- `tests/e2e/homepage-content-display.spec.ts` - Added a new `test.describe('grid intro paragraph is not truncated (HOME-12)')` block with desktop (1280x800) and mobile (375x812) tests asserting no clamp, no overflow, and no clipping by the hero tile — file went from 16 to 18 tests

## Decisions Made

- Task 1: deleted exactly the two lines `hero.addEventListener('mouseenter', stopAutoAdvance);` / `hero.addEventListener('mouseleave', startAutoAdvance);`; left `focusin`/`focusout` byte-for-byte unchanged per the plan's guard list
- Task 2: `.home-grid__intro-body` reduced to exactly 4 declarations (`font-size`, `font-weight`, `line-height`, `margin`); no spacing/line-height polish was needed — the un-clamped paragraph already fit inside the hero tile at both viewports on the first GREEN run
- Task 3: fixed the dash-click focus-lock bug at its root cause in the component (gated `blur()`) rather than papering over it with a test-side `page.clock.install()` freeze, because the failure was a genuine, real-user-facing behavior regression (not test-timing flakiness) — confirmed by reproducing the same test passing against the pre-Task-1 component (see Deviations)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Copied `.env` from the main repo into the worktree**
- **Found during:** Task 1, first `npm run build`
- **Issue:** The worktree has no `.env` file (gitignored, not copied to worktrees), so `astro build` failed with "Missing SANITY_PROJECT_ID or SANITY_DATASET env vars" before any Sanity-backed page could prerender — blocking every subsequent build/test step in the plan.
- **Fix:** `cp /Users/florian/Projects/ajs-website/.env <worktree>/.env` (same untracked file already in use by the main checkout, not a new secret).
- **Files modified:** `.env` (untracked, not committed — gitignored)
- **Verification:** `npm run build` succeeded immediately after.

**2. [Rule 3 - Blocking] Installed the `sanity/` subproject's own dependencies (`npm ci --prefix sanity`)**
- **Found during:** Task 3, `npm run test:unit`
- **Issue:** `tests/unit/dashboard-logic.test.ts` failed with `Cannot find package '@sanity/icons/BulbOutline'` — the `sanity/` subproject's `node_modules` had never been installed in this worktree (root `node_modules` resolves transparently from the main repo via Node's directory-walk, but `sanity/node_modules` is a sibling path the walk never reaches). Unrelated to this plan's files, but blocked a clean `test:unit` gate.
- **Fix:** `npm ci --prefix sanity`, matching the exact step already documented in CLAUDE.md's CI pipeline and using the existing, locked `sanity/package-lock.json` — no new/unverified package introduced.
- **Files modified:** `sanity/node_modules/` (gitignored, not committed)
- **Verification:** `npm run test:unit` went from 1 failed suite to 271/271 passing.

**3. [Rule 1 - Bug] Fixed a fallout regression: progress-dash mouse clicks permanently froze auto-advance**
- **Found during:** Task 3, full-suite regression sweep (`npm run test:e2e`)
- **Issue:** `tests/e2e/homepage-wordmark-peek.spec.ts` › "keyboard, dash, and auto-advance navigation are untouched" started failing: after clicking a progress dash, `fastForward(6000)` no longer advanced the index label. Root cause: `<button data-action="go-to">` dashes retain DOM focus after a Chromium mouse click; before Task 1, `mouseleave` unconditionally called `startAutoAdvance()` once the pointer left the hero, masking this. With the `mouseenter`/`mouseleave` listeners removed (D-01), nothing calls `startAutoAdvance()` again until `focusout` fires — and it never does, because nothing moves focus off the dash after a mouse click. Confirmed as a genuine Task-1-caused regression (not pre-existing) by temporarily restoring the pre-Task-1 component and re-running the same test, which passed.
- **Fix:** In the dash click handler, call `dash.blur()` immediately after `goToIndex(i)`, but only when `!dash.matches(':focus-visible')` — this un-focuses (and resumes auto-advance via the existing, untouched `focusout` → `startAutoAdvance` listener) only for mouse-driven focus, while leaving real keyboard Tab-driven focus (which does match `:focus-visible`) alone so D-02's accessibility guarantee still holds for keyboard users navigating the dashes.
- **Files modified:** `src/components/HomeCarousel.astro`
- **Verification:** Full `npm run test:e2e` (263 tests, chromium + webkit-mobile) green; `tests/e2e/homepage-wordmark-peek.spec.ts` and `tests/e2e/homepage-content-display.spec.ts` (the two files Task 3 flagged as at-risk) each re-run 3x with `--repeat-each=3` (114 and 54 runs respectively), all passing — confirming the fix is stable, not lucky.
- **Committed in:** `ce788d5`

---

**Total deviations:** 3 auto-fixed (2 blocking/environment, 1 real bug)
**Impact on plan:** The two environment fixes (`.env`, `sanity/` deps) were pure worktree-provisioning gaps, not source changes, and are not committed to the repo. The dash-blur fix is a small, targeted, in-scope bugfix directly caused by Task 1's own change and discovered exactly where Task 3 asked the sweep to look (`homepage-wordmark-peek.spec.ts`) — it touches `src/components/HomeCarousel.astro`, which is in the plan's overall `files_modified` list (from Tasks 1/2) even though it wasn't in Task 3's own narrower `<files>` sub-list. No scope creep beyond fixing what Task 1 itself broke.

## Issues Encountered

- Task 1 RED: after rewriting the hover test and before touching the component, `npx playwright test tests/e2e/homepage-carousel-core.spec.ts --project=chromium` showed exactly the rewritten hover test failing (`Expected: not "02 / 05", Received: "02 / 05"`) with the new D-02 focus test and all 15 other tests passing — 17 tests total, 16 passed / 1 failed, matching the plan's expected RED state exactly. After the component edit, all 17 passed.
- Task 2 RED: after adding the two new HOME-12 tests and before touching the CSS, both new tests failed on the clamp value (`Expected: "none", Received: "2"`), with the 16 pre-existing tests passing — 18 tests total, matching the plan's expected RED state. After the CSS edit, all 18 passed on the first try; no spacing adjustment (step 7) was needed at either viewport.
- Task 3: the anticipated risk file `tests/e2e/homepage-wordmark-peek.spec.ts` did fail, but not for the timing-flakiness reason the plan anticipated (a slide changing mid-assertion) — it failed for the opposite reason (a slide permanently NOT changing, due to the dash-focus-lock bug above). No `page.clock.install()` stabilization was applicable or needed in either flagged test file once the component fix landed; both files remain byte-for-byte unchanged from before this phase.

## User Setup Required

None - no external service configuration required.

## Human-Check Outcome (end-of-phase, `human_verify_mode: end-of-phase`)

Per project config, this project's human-verify checkpoints report rather than gate inline. Since this plan is autonomous with no `checkpoint:human-verify` task, the plan's own `<verify><human-check>` block (Task 3) was executed via an automated Playwright script against a real `npm run dev` server on `localhost:4321` (not manually by a human), covering all 4 listed steps:

1. **Hover keeps advancing:** pointer resting on the carousel, `fastForward(6000)` → index label changed (`01 / 05` → `02 / 05`). PASS.
2. **Pause button toggles:** click → `aria-pressed="true"`, label frozen across a 6000ms advance; click again → `aria-pressed="false"`, label advances again. PASS.
3. **Keyboard focus pauses:** `.focus()` on the autoplay toggle → label frozen across 6000ms; `.blur()` → label advances again. PASS.
4. **Grid intro paragraph complete, both widths:** at 1280x800 and 375x812, `.home-grid__intro-body` computed `-webkit-line-clamp` is `none`, `scrollHeight <= clientHeight + 1`, and the paragraph's bottom edge stays within the hero tile's bottom edge. PASS at both viewports.

All 5 checks (4 listed steps, with step 2 split into pause+resume sub-checks reported together) passed. Dev server was started and stopped cleanly as part of this verification; no server was left running.

## Next Phase Readiness

- HOME-11 and HOME-12 are both fully shipped and locked by passing e2e tests; no known stubs or deferred work remain in `HomeCarousel.astro` for this phase's scope.
- Phase 18 (Gallery & Éditions Display Fixes — PORT-04/05/06) touches a disjoint set of files (`DetailHero.astro`, `GalleryGrid.astro`, gallery detail routes) and has no dependency on this plan's changes.
- No blockers or concerns carried forward.

---
*Phase: 17-homepage-carousel-intro-fixes*
*Completed: 2026-08-02*
