---
phase: quick-260825-kt3
plan: 01
subsystem: ui
tags: [astro, vanilla-js, playwright, e2e, home-carousel]

# Dependency graph
requires:
  - phase: quick-260725-tqs
    provides: "?carousel=<slug> return-navigation param read (Item 6, Part C)"
  - phase: 20-mobile-navigation-accent-color
    provides: "HOME-16/D-05 random-per-visit starting accent mechanism"
provides:
  - "Return-navigation accent continuity: a matched ?carousel=<slug> landing preserves the returned-to gallery's own resolved accent instead of a randomly-picked one"
affects: [home-carousel-runtime, homepage-accent-random.spec]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Guard flag set at the point a URL param match succeeds (landedOnRequestedGallery), read later to skip a later, unrelated override block — avoids re-deriving the match"

key-files:
  created: []
  modified:
    - src/client/home-carousel-runtime.ts
    - tests/e2e/homepage-accent-random.spec.ts

key-decisions:
  - "Gated the existing HOME-16 random-accent override block behind a new landedOnRequestedGallery boolean rather than restructuring render() or the ?carousel= parse — the bug was purely a missing branch on an existing, already-correct value (render()'s accent for galleries[carouselIndex])"
  - "Kept the .is-accent-init transition-suppression class add/remove pair inside the guard (not hoisted out) since the skipped path produces exactly one paint and has nothing to suppress a transition for"

requirements-completed: [BUG-01, HOME-16]

coverage:
  - id: D1
    description: "A matched ?carousel=<slug> return navigation no longer overwrites the returned-to gallery's accent with a randomly-picked one"
    requirement: BUG-01
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage-accent-random.spec.ts#a matched ?carousel= return keeps the returned-to gallery's own accent"
        status: pass
    human_judgment: false
  - id: D2
    description: "Fresh landings at / (no carousel param) keep the HOME-16/D-05 random-per-visit starting accent unchanged, still bounded to the existing palette, still showing gallery 0 first"
    requirement: HOME-16
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage-accent-random.spec.ts#a forced lowest random value starts the accent on the first gallery's heroColor"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage-accent-random.spec.ts#a forced highest random value starts the accent on the LAST gallery's heroColor"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage-accent-random.spec.ts#the randomly-picked accent never leaves the existing five-value palette"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage-accent-random.spec.ts#the random accent does not change which gallery shows first"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage-accent-random.spec.ts#the initial-paint transition suppression is released"
        status: pass
    human_judgment: false
  - id: D3
    description: "An unknown/absent ?carousel= slug still falls back to gallery 0 and still gets a random starting accent; the per-gallery accent still follows carousel position after advancing"
    verification:
      - kind: e2e
        ref: "tests/e2e/gallery.spec.ts#homepage ?carousel= init read (independent of the gesture)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage-accent-random.spec.ts#the per-gallery accent still follows carousel position after the first advance"
        status: pass
    human_judgment: false

duration: 15min
completed: 2026-08-25
status: complete
---

# Phase quick-260825-kt3: Skip the Random Starting-Accent Override on Return Navigation Summary

**Gated the HOME-16 random-per-visit homepage accent behind a `landedOnRequestedGallery` flag so a matched `?carousel=<slug>` return navigation keeps the returned-to gallery's own accent instead of a random one.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-08-25T13:03:00Z (approx, worktree setup preceded timing)
- **Completed:** 2026-08-25T13:11:27Z
- **Tasks:** 1 (RED then GREEN, tdd="true")
- **Files modified:** 2

## Accomplishments
- Fixed the live bug: opening a gallery from the homepage carousel then using the detail page's scroll-up-to-return gesture (`/?carousel=<slug>`) now preserves that gallery's own accent colour instead of jumping to an unrelated randomly-picked one.
- Added a regression e2e case in `tests/e2e/homepage-accent-random.spec.ts` that forces the random pick to a differing-accent gallery and proves the returned-to gallery's accent wins — confirmed it FAILED against the unfixed runtime (`Expected: "#37013A", Received: "#A6FD29"`) before the fix, and passes after.
- Confirmed all four pre-existing HOME-16 fresh-landing cases still pass unmodified, and the `gallery.spec.ts` `?carousel=` init-read regression guard is untouched and still passes.

## Task Commits

Each task was committed atomically:

1. **Task 1: Skip the random starting-accent override on a matched ?carousel= return, and lock it with a regression case** - `e3ecd9d` (fix, includes RED test + GREEN implementation as a single commit per the plan's task-level commit granularity)

**Plan metadata:** (docs commit handled by orchestrator, not this executor)

_Note: this task's `<action>` specifies a RED-then-GREEN sequence within one task; the executor verified RED failure and GREEN pass before committing, per the plan's own instructions — the plan did not request separate RED/GREEN commits._

## Files Created/Modified
- `src/client/home-carousel-runtime.ts` - Added `landedOnRequestedGallery` boolean, set `true` inside the existing `?carousel=` `findIndex` match branch; wrapped the HOME-16/D-05 random-accent override block in `if (!landedOnRequestedGallery)`; extended the existing explanatory comment. No other line changed.
- `tests/e2e/homepage-accent-random.spec.ts` - Extended `DataEntry`/`readDataEntries` with additive `slug`/`title` fields (read from existing `data-slug`/`data-title` attributes); added one new test case (`a matched ?carousel= return keeps the returned-to gallery's own accent`); extended the file header comment. All five pre-existing test bodies are byte-for-byte unchanged.

## Decisions Made
- Guard placed at the exact point where the slug match already succeeds (`if (i >= 0)` branch), rather than re-deriving the match later — avoids a second `findIndex` call and keeps the security-reviewed `?carousel=` parsing block untouched.
- Transition-suppression class (`is-accent-init`) add/remove stayed inside the guard rather than being hoisted out, since a skipped override path has only one paint (render()'s) and nothing to suppress a transition for.

## Deviations from Plan

None - plan executed exactly as written. The test targeted index 1 (not a dynamically-derived non-zero index) since the plan's own wording ("pick a NON-ZERO index t (index 1)") specifies index 1 directly; all fixture-galleries logic (finding a differing-accent index `r`) was implemented as lazy iteration with explicit `test.skip` guards exactly as specified.

## Issues Encountered

Worktree had no `.env`, no root `node_modules`, and no `sanity/node_modules` on start (fresh worktree checkout). Copied `.env` from the main checkout without viewing its contents and ran `npm ci` (root) and `npm ci --prefix sanity` against the existing lockfiles, per the task's setup note — not a plan deviation, just environment bootstrapping needed before any build/test command could run. Port 4321 was held by an unrelated concurrent-session process; ran e2e via `E2E_PORT=4331` instead, per the task's own port-conflict guidance.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Bug fixed and locked by regression coverage; no follow-on work identified.
- Full chromium e2e suite (357 passed, 1 pre-existing unrelated skip), unit tests (691 passed), lint, and typecheck all pass clean.

---
*Phase: quick-260825-kt3*
*Completed: 2026-08-25*

## Self-Check: PASSED

- FOUND: src/client/home-carousel-runtime.ts
- FOUND: tests/e2e/homepage-accent-random.spec.ts
- FOUND: .planning/quick/260825-kt3-skip-the-random-starting-accent-override/260825-kt3-SUMMARY.md
- FOUND commit: e3ecd9d
