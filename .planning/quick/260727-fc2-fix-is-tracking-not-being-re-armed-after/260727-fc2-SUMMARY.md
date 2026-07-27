---
phase: quick-260727-fc2
plan: 01
subsystem: ui
tags: [astro, playwright, home-carousel, css-transitions]

requires:
  - phase: quick-260727-drq
    provides: "the .is-tracking class itself (armed on mouseenter, removed only right before commitEdge()'s full-slide targets and mouseleave's resetPeek()) — this plan fixes the missing re-arm half of that mechanism"
provides:
  - "finish() (inside commitEdge()) re-arms .is-tracking once the commit settles, guarded by the live hover signal (.is-cursor-active), so every peek AFTER the first edge-click commit in a continuous hover session stays instant/un-eased"
affects: [home-carousel]

tech-stack:
  added: []
  patterns:
    - "Re-arm-on-settle guarded by an existing hover-presence class: rather than introducing new state, finish()'s cleanup reads the already-present .is-cursor-active class (added on mouseenter, removed on mouseleave) as its hover-liveness signal before re-adding .is-tracking — avoiding parallel state that could drift."

key-files:
  created: []
  modified:
    - src/components/HomeCarousel.astro
    - tests/e2e/homepage.spec.ts

key-decisions:
  - "Reused the already-present .is-cursor-active class as the re-arm guard (the plan's recommended approach) instead of introducing a new standalone isHovering boolean — zero new state, cannot drift from the real DOM class."
  - "Re-arm placed in finish()'s cleanup block after committing = false, before if (timer !== null) startAutoAdvance() — ordering among the cleanup statements is not significant, but this keeps the state-reset steps (is-opening removal, committing flag, is-tracking re-arm) grouped before the auto-advance restart."

patterns-established: []

requirements-completed: [QUICK-260727-fc2]

coverage:
  - id: D1
    description: "finish() re-arms .is-tracking (guarded by .is-cursor-active) so the 2nd-and-later peek in a continuous hover session (after an edge-click commit, mouse never leaving the photo) is instant/un-eased, restoring Bug 1's full invariant"
    requirement: "QUICK-260727-fc2"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#carousel is-tracking re-armed after edge-click commit (quick-260727-fc2) (FR + EN, both tests)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts (full homepage suite, 85 tests) + full e2e suite (chromium + webkit-mobile, 239 tests)"
        status: pass
      - kind: unit
        ref: "npm run typecheck (astro check) — 0 errors"
        status: pass
    human_judgment: false
    rationale: "This is a pure client-side DOM class toggle with no async/rendering-engine-specific behavior beyond what the Chromium e2e suite already proves deterministically (the class is present + the transitionProperty excludes transform). Per the plan's own verification note, the orchestrator will still independently re-verify via diff review, the full automated gate, and a live Playwright MCP reproduction — but no engine-specific (Safari-only) judgment is required for this specific fix, unlike quick-260727-drq's original Bug 1 mechanism."

duration: ~20min
completed: 2026-07-27
status: complete
---

# Quick Task 260727-fc2: Fix is-tracking Not Being Re-Armed After commitEdge Summary

**Re-arms `.is-tracking` in `commitEdge()`'s `finish()` cleanup (guarded by the live `.is-cursor-active` hover signal) so the Safari jitter fix from quick-260727-drq stays armed for every peek after the first, not just the first, in a continuous hover session**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-07-27
- **Completed:** 2026-07-27
- **Tasks:** 1 (TDD: RED then GREEN)
- **Files modified:** 2

## Accomplishments

- **Root cause confirmed exactly as pre-diagnosed:** `commitEdge()` removes `.is-tracking` at ~line 961 before setting its full-slide targets (correct — a discrete moment should keep the 420ms ease), but `finish()` (the single-shot completion handler ~line 980) reset `committing = false`, removed `.is-opening`, and restarted auto-advance — but never re-added `.is-tracking`. After the first edge-click commit in a continuous hover session, every subsequent peek reverted to the eased CSS transition.
- **RED:** Added FR + EN e2e regression tests (`carousel is-tracking re-armed after edge-click commit (quick-260727-fc2)`) that pin the slide, peek toward the right edge (arms `.is-tracking` via mouseenter), click to commit a full slide, wait ~700ms for the commit to fully settle without the mouse leaving the photo, then peek again and assert `.is-tracking` is present and `getComputedStyle(.home-hero__img--sharp).transitionProperty` excludes `transform`. Confirmed both tests FAIL on the pre-fix code — `.home-hero__photo` carried only `is-cursor-active`, not `is-tracking`, reproducing the exact reported regression.
- **GREEN:** Added a guarded re-arm in `finish()`'s existing cleanup block: `if (photo.classList.contains('is-cursor-active')) { photo.classList.add('is-tracking'); }`, placed right after `committing = false` and before the auto-advance restart. This restores the missing half of Bug 1's invariant (armed on mouseenter, removed only for discrete moments, but never re-armed after a commit) without introducing any new state — it reuses the already-present `.is-cursor-active` class as the live hover-presence signal, so tracking is never left ON if the pointer genuinely left the photo during the ~420-480ms commit window (mirroring `mouseleave`'s unconditional removal).
- Both new tests pass on the fixed code.

## Task Commits

Each task was committed atomically (TDD RED then GREEN):

1. **Task 1 (RED): failing e2e regression tests** — `87707fa` (test)
2. **Task 1 (GREEN): re-arm `.is-tracking` in `finish()`** — `45e7454` (fix)

**Plan metadata:** pending (docs commit handled by the orchestrator per this executor's constraints)

## Files Created/Modified

- `src/components/HomeCarousel.astro` — added the guarded `.is-tracking` re-arm inside `commitEdge()`'s `finish()` cleanup block (14 lines, purely additive; no other part of Bug 1's mechanism touched)
- `tests/e2e/homepage.spec.ts` — new `carousel is-tracking re-armed after edge-click commit (quick-260727-fc2)` describe block (FR + EN tests), placed immediately after the existing Bug 1 describe block

## Decisions Made

- Reused the already-present `.is-cursor-active` class (added on `mouseenter`, removed on `mouseleave`) as the re-arm guard, per the plan's explicit recommendation — this is an exact hover-presence signal already in the DOM, so the fix adds zero new state that could drift.
- Grep-confirmed no other part of Bug 1's mechanism was touched: the `.is-tracking` CSS rule (~1647-1648), the `mouseenter` add (~1046), the `mouseleave` unconditional remove (~1058), and `commitEdge()`'s remove-before-targets (~961) are all byte-identical to before this change.

## Deviations from Plan

None — plan executed exactly as written. The root cause, fix location, and guard mechanism all matched the plan's precise diagnosis; no Rule 1-4 auto-fixes were needed beyond the plan's own specified change.

## Issues Encountered

- `.env` (gitignored Sanity credentials) was absent in this fresh worktree — copied from the main checkout (`/Users/florian/Projects/ajs-website/.env`) to enable `npm run build` + `npm run preview` for the Playwright run, then deleted before finishing (never committed; confirmed gitignored both before and after).
- `tests/unit/dashboard-logic.test.ts` fails with the same pre-existing, unrelated `@sanity/icons` module-resolution gap documented in quick-260727-drq's SUMMARY (Studio subproject dependency, not installed at the root). All other 121 unit tests pass. Not a regression from this change.

## User Setup Required

None — no external service configuration required.

## Verification Performed

- `npm run build` — clean (27 pages built against real Sanity content).
- `npm run typecheck` (`astro check`) — 0 errors, 0 warnings (7 pre-existing hints, unrelated).
- `npx playwright test tests/e2e/homepage.spec.ts -g "fc2"` — RED confirmed on pre-fix code (both FR/EN tests failed exactly as expected: `is-cursor-active` present, `is-tracking` absent), then GREEN confirmed on fixed code (both pass).
- `npx playwright test tests/e2e/homepage.spec.ts --project=chromium` — full homepage suite, 85/85 passing (includes the 2 new tests, no regression in any pre-existing test: Bug 1, edge-peek, wordmark-sync, cursor, auto-advance, toggle, etc.).
- `npx playwright test` (full suite, chromium + webkit-mobile) — 239/239 passing.
- `npm run test:unit` — 121/121 real tests passing (1 known-unrelated pre-existing Studio-dependency failure, documented above).

## Next Phase Readiness

- Fix is complete, tested, and verified via the full automated gate (build, typecheck, full e2e suite, unit tests).
- Per the plan's `<verification>` section, the orchestrator will still independently re-verify via diff review and a live Playwright MCP reproduction of the exact multi-peek sequence (peek → edge-click → settle → second peek without leaving the photo → confirm `.is-tracking` re-armed and the peek transform un-eased) before merge. This specific fix (a DOM class re-arm) does not carry the Safari-specific-jitter judgment burden that quick-260727-drq's original mechanism did, since the automated suite already deterministically proves the class/transition-property contract this fix restores.
- No blockers.

---
*Phase: quick-260727-fc2*
*Completed: 2026-07-27*

## Self-Check: PASSED

Both modified files (`src/components/HomeCarousel.astro`, `tests/e2e/homepage.spec.ts`) verified present on disk; both task commit hashes (`87707fa`, `45e7454`) verified present in `git log --oneline --all`.
