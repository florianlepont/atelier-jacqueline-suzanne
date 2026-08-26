---
phase: 21-homepage-scroll-experience
plan: 07
subsystem: ui
tags: [astro, requestAnimationFrame, playwright, vitest, scroll-driven-animation, intersection-observer-removal]

# Dependency graph
requires:
  - phase: 21-homepage-scroll-experience (plans 21-05, 21-06)
    provides: the scroll-event-driven zoom crossfade driver and the IntersectionObserver arrival reveal this plan replaces
provides:
  - "computeSlideVisibleRatio pure export (src/lib/home-carousel.ts) with unit-tested boundary cases"
  - "A single startLoop()/stopLoop()/frame() rAF lifecycle in HomeCarousel.astro's deck script, replacing the scroll-event handler and the IntersectionObserver"
  - "Scroll-event-independence and atomic-handoff e2e coverage (tests/e2e/homepage-scroll-deck.spec.ts)"
affects: [21-08, 21-10]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Single continuously-running rAF loop (mirroring src/pages/404.astro's tick()/startPointerLoop()/stopPointerLoop() shape) re-polling live getBoundingClientRect() every painted frame, replacing scroll-event + IntersectionObserver-driven visual state"
    - "applyProgress()'s plain-equality short-circuit against a sentinel value so a stationary page performs zero style writes per frame while a (re-)attach always repaints"

key-files:
  created: []
  modified:
    - src/lib/home-carousel.ts
    - tests/unit/home-carousel.test.ts
    - src/components/HomeCarousel.astro
    - tests/e2e/homepage-scroll-deck.spec.ts

key-decisions:
  - "Collapsed the scroll-event crossfade driver and the IntersectionObserver arrival reveal into ONE rAF loop, per the confirmed (not hypothesised) root cause in .planning/debug/homepage-scroll-zoom-handoff-glitch.md — a mechanism change, not a threshold tweak, since real-device physics (touch momentum + scroll-snap-stop coinciding with the completion offset) cannot be reproduced by either Playwright project"
  - "computeSlideVisibleRatio's denominator is min(rect.height, viewportHeight), a deliberate divergence from IntersectionObserver's own intersectionRatio semantics, so a slide taller than the live viewport can still reach the arrival threshold"

patterns-established:
  - "When porting a scroll-event-driven visual driver to a context with real touch-momentum + a coincident scroll-snap boundary, prefer a continuous rAF poll over scroll/observer callbacks from the outset"

requirements-completed: [HOME-14, HOME-15]

coverage:
  - id: D1
    description: "computeSlideVisibleRatio pure function covering all documented boundary cases (full/none/half-in/half-out/taller-than-viewport/degenerate viewport/degenerate rect)"
    verification:
      - kind: unit
        ref: "tests/unit/home-carousel.test.ts#computeSlideVisibleRatio"
        status: pass
    human_judgment: false
  - id: D2
    description: "Deck driver rewritten as one continuous rAF loop (frame/startLoop/stopLoop/applyProgress/applyArrival) replacing the scroll listener and IntersectionObserver, with all 21 pre-existing e2e cases (plans 21-04/21-05/21-06) and homepage-accent-random staying green unmodified"
    requirement: "HOME-14"
    verification:
      - kind: e2e
        ref: "playwright:homepage-scroll-deck.spec.ts (37 cases) --project=chromium"
        status: pass
      - kind: e2e
        ref: "playwright:homepage-accent-random.spec.ts (6 cases) --project=chromium"
        status: pass
    human_judgment: false
  - id: D3
    description: "Scroll-event independence and atomic-handoff mechanism proof (mid-scrub/completion/arrival with scroll listeners suppressed, one-read atomic tuple check, detach-on-gate-change, reduced-motion inert)"
    requirement: "HOME-15"
    verification:
      - kind: e2e
        ref: "playwright:homepage-scroll-deck.spec.ts 'per-frame deck driver — scroll-event independence and atomic handoff (21-UAT.md gap 2)' --project=chromium"
        status: pass
    human_judgment: false
  - id: D4
    description: "Real-device confirmation that the handoff frame is gone"
    verification: []
    human_judgment: true
    rationale: "Explicitly deferred by this plan's own <verification> block to plan 21-10's human-check, which re-runs the full real-device pass once all four 21-UAT.md gaps are closed — not re-run at this plan's own boundary."

# Metrics
duration: 65min
completed: 2026-08-05
status: complete
---

# Phase 21 Plan 07: Zoom-to-Slide Handoff Mechanism Fix Summary

**Replaced the deck's scroll-event-driven crossfade and its IntersectionObserver arrival reveal with one continuously-running requestAnimationFrame loop that re-polls live geometry every painted frame, closing 21-UAT.md gap 2 (the zoom-to-first-slide handoff glitch) at its confirmed root cause.**

## Performance

- **Duration:** 65 min
- **Started:** 2026-08-05T13:41:00Z
- **Completed:** 2026-08-05T14:46:00Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Extracted `computeSlideVisibleRatio(rect, viewportHeight)` as a pure, unit-tested export in `src/lib/home-carousel.ts`, with a deliberate `min(rect.height, viewportHeight)` denominator that diverges from `IntersectionObserver`'s own `intersectionRatio` semantics
- Rewrote `HomeCarousel.astro`'s deck driver around one continuous rAF loop (`frame()` → `applyProgress()` + `applyArrival()` → reschedule), mirroring `404.astro`'s own `tick()`/`startPointerLoop()`/`stopPointerLoop()` shape, so the crossfade, the header-hide flag, and the arrival reveal all now resolve on the same painted frame instead of waiting on `scroll` dispatch or `IntersectionObserver` callback delivery
- Added 6 new e2e cases proving the mechanism (not the frame-level artifact, which neither Playwright project can reproduce): scroll-event independence at mid-scrub/completion/arrival with every `scroll` listener suppressed via `addInitScript`, an atomic single-read handoff-tuple check, a detach-on-gate-change release proof, and a reduced-motion-inert proof for the rewritten loop

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract the arrival-ratio math as a tested pure function** - `8c759d4` (feat)
2. **Task 2: Replace the event-driven driver with one continuous rAF loop** - `547315f` (feat)
3. **Task 3: Prove the visual state is scroll-event-independent and resolves atomically** - `58906ac` (test)

_No TDD RED/GREEN split was used for Task 2/3 — Task 1 used TDD (`tdd="true"`), Task 2/3 were plain `auto` tasks per the plan's own task-type annotations._

## Files Created/Modified

- `src/lib/home-carousel.ts` - Added `computeSlideVisibleRatio`, placed after `computeWordmarkZoomState` and before `computeFocusOrigin`
- `tests/unit/home-carousel.test.ts` - Added `describe('computeSlideVisibleRatio')` covering all 8 documented boundary cases
- `src/components/HomeCarousel.astro` - Rewrote the deck script's second `<script>` block: `applyArrival()` replaces `onArrival(entries)`, `frame()`/`startLoop()`/`stopLoop()` replace `onScroll()`/`scrollAttached`, `applyProgress()` short-circuits unchanged progress against a sentinel, `IntersectionObserver` and the `scroll` listener are both fully removed
- `tests/e2e/homepage-scroll-deck.spec.ts` - Lifted `getRevealDistance`/`scaleFromComputedTransform`/`getWordmarkScale`/`getWordmarkOpacity`/`getPhotoOpacity`/`getZoomActive` to module scope (bodies unchanged) and added the new `per-frame deck driver — scroll-event independence and atomic handoff (21-UAT.md gap 2)` describe block (6 cases)

## Decisions Made

- Collapsed both JS-driven systems (crossfade + arrival reveal) into a single rAF loop rather than fixing only the scroll handler, because `21-UAT.md`'s root cause names the `IntersectionObserver` as system 3 too, and the recorded bad frame shows the missing accent panel/title only system 3 controls — fixing system 2 alone would have left the reveal still lagging.
- `applyProgress()`'s short-circuit uses plain equality (not an epsilon) against a `-1` sentinel — the measured value only changes when the underlying rect changes, so the exact endpoints (0 and 1) are always still reached and written, while a stationary page performs zero style writes per frame (mitigates T-21-07-A).
- `DetailHero.astro` is deliberately NOT touched — it is desktop-only, has no touch momentum, and has no scroll-snap boundary at its own completion point, so the ported `scroll`-event pattern's original assumption still holds there.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Copied `.env` from the main checkout into this worktree**
- **Found during:** Task 2 verification (`npm run build`)
- **Issue:** This worktree had no `.env` file, so `astro build` failed with "Missing SANITY_PROJECT_ID or SANITY_DATASET env vars" — an environment-setup gap unrelated to any code change.
- **Fix:** Copied the (gitignored) `.env` from the main repo checkout into this worktree. No secret was committed; `.env` remains gitignored and shows as untracked (`!!`) in `git status --ignored`.
- **Files modified:** none (untracked, gitignored `.env` only)
- **Verification:** `npm run build` then succeeded, producing all 29 static pages.
- **Committed in:** not committed (gitignored)

**2. [Rule 3 - Blocking] Ran `npm ci --prefix sanity` to install this worktree's missing Sanity Studio dependencies**
- **Found during:** Task 3 verification (`npm run test:coverage`)
- **Issue:** `sanity/node_modules` did not exist in this worktree, so `tests/unit/dashboard-logic.test.ts` failed to import `@sanity/icons/BulbOutline` — again an environment-setup gap, not a code regression. This installs exactly the versions pinned in the existing `sanity/package-lock.json` (the same step CLAUDE.md's documented CI pipeline already runs), not a new/unreviewed package.
- **Fix:** Ran `npm ci --prefix sanity`.
- **Files modified:** none tracked (`sanity/node_modules` is gitignored)
- **Verification:** `npm run test:coverage` then passed (318/318 tests, all coverage thresholds met).
- **Committed in:** not committed (gitignored)

**3. [Rule 3 - Blocking] Diagnosed and worked around a stale, unrelated preview server occupying port 4321**
- **Found during:** Task 2/3 e2e verification
- **Issue:** A pre-existing `astro preview --host` process (PID 30394, cwd = the main repo checkout, started hours before this session) was already listening on port 4321. Playwright's `reuseExistingServer: true` silently reused it, so every `playwright test` run served a STALE build (confirmed via mismatched `_astro/*.js` content hashes) rather than this worktree's freshly-built `dist/`. Two new Task 3 cases initially "failed" against this stale server; a debug script confirmed scrollY moved correctly but the stale JS bundle still contained the old `addEventListener('scroll', ...)` call this plan removed.
- **Fix:** Left the pre-existing port-4321 process entirely untouched (it may belong to a concurrent session, per this project's own "concurrent sessions are the norm" convention). Instead, started this worktree's own `astro preview --port 4399` and ran all verification through a temporary, untracked `playwright.debug.config.ts` overriding `use.baseURL`/`webServer` to point at port 4399. Both the temporary config and the port-4399 preview process were deleted/stopped before this plan's SUMMARY was written; `git status` confirms no trace remains.
- **Files modified:** none (temporary, deleted before completion)
- **Verification:** All previously-"failing" cases (both new Task 3 cases, plus `homepage-scroll-deck`, `homepage-accent-random`, the full chromium suite, and `webkit-mobile`) passed cleanly against the correct build. Two further isolated re-runs also surfaced pre-existing, unrelated flakes (`page-title-header-bleed.spec.ts`'s `/about/` overflow guard, and `edition.spec.ts`'s masonry image-load-timing case) that passed deterministically when re-run in isolation — both files are outside this plan's scope and were not modified.

---

**Total deviations:** 3 auto-fixed (all Rule 3 — blocking environment/infra issues, none touching this plan's code surface)
**Impact on plan:** All three fixes were required to obtain a trustworthy verification signal in this worktree; none altered `src/lib/home-carousel.ts`, `src/components/HomeCarousel.astro`, or the test files beyond what the plan specified. No scope creep.

## Issues Encountered

- Two unrelated e2e tests (`page-title-header-bleed.spec.ts` /about/ overflow guard, `edition.spec.ts` masonry image-ratio check) intermittently failed only when run as part of a large, highly-parallel full-suite run on a machine under heavy concurrent load (VS Code, other worktree dev servers, etc. all running simultaneously) — both reproduced as passing consistently when re-run in isolation or with reduced worker concurrency. Neither file is touched by this plan; not investigated further per this plan's scope boundary.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plans 21-08 and 21-10 can consume `computeSlideVisibleRatio`, `startLoop`/`stopLoop`/`frame`, `applyArrival`, and `driverAttached` by their exact names, as specified in this plan's `<artifacts_this_phase_produces>` table.
- Real-device confirmation that the recorded handoff-glitch frame is actually gone is deliberately NOT run at this plan's boundary — carried forward to plan 21-10's `<verify><human-check>` block, which re-runs the full real-device pass once all four `21-UAT.md` gaps are closed.
- No blockers.

---
*Phase: 21-homepage-scroll-experience*
*Completed: 2026-08-05*

## Self-Check: PASSED

All claimed files exist (`src/lib/home-carousel.ts`, `tests/unit/home-carousel.test.ts`, `src/components/HomeCarousel.astro`, `tests/e2e/homepage-scroll-deck.spec.ts`, this SUMMARY.md) and all three task commit hashes (`8c759d4`, `547315f`, `58906ac`) are present in git history.
