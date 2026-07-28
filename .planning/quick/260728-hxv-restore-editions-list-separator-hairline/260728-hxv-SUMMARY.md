---
phase: quick-260728-hxv
plan: 01
subsystem: ui
tags: [css, astro, editions]

# Dependency graph
requires:
  - phase: quick-260728-el6
    provides: "Original (mistaken) removal of the .editions-index__row:first-of-type hairline"
provides:
  - "Restored .editions-index__row:first-of-type separator hairline on the Éditions overview page"
affects: [editions-overview, site-header]

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - src/components/EditionsOverviewBody.astro

key-decisions:
  - "Restored only the row-list separator (.editions-index__row:first-of-type border-top); left .editions-list__header untouched per the plan's explicit scope boundary."

patterns-established: []

requirements-completed: []

coverage:
  - id: D1
    description: "The .editions-index__row:first-of-type CSS rule with a single border-top (var(--border-hairline) solid var(--color-ink)) is restored immediately after the unchanged .editions-index__row base rule"
    verification:
      - kind: e2e
        ref: "tests/e2e/edition.spec.ts (12 tests)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/site-header.spec.ts (41 tests)"
        status: pass
      - kind: other
        ref: "npm run typecheck"
        status: pass
      - kind: other
        ref: "npm run build"
        status: pass
      - kind: other
        ref: "npm run test:artifact"
        status: pass
    human_judgment: false
  - id: D2
    description: ".editions-list__header rule remains unchanged (only margin-bottom: var(--space-2xl)); no border-top/padding-top reintroduced"
    verification:
      - kind: other
        ref: "Manual code inspection of src/components/EditionsOverviewBody.astro lines 77-79 (unchanged)"
        status: pass
    human_judgment: false

# Metrics
duration: 12min
completed: 2026-07-28
status: complete
---

# Quick Task 260728-hxv: Restore Editions List Separator Hairline Summary

**Restored the `.editions-index__row:first-of-type` CSS rule (`border-top: var(--border-hairline) solid var(--color-ink)`) in `EditionsOverviewBody.astro`, undoing a targeting mistake from quick task 260728-el6 while leaving the correctly-removed `.editions-list__header` hairline gone.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-28T10:47:00Z
- **Completed:** 2026-07-28T10:59:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Added back the `.editions-index__row:first-of-type { border-top: var(--border-hairline) solid var(--color-ink); }` rule immediately after the unchanged `.editions-index__row` base rule, restoring the separator between the intro paragraph and `Édition 01` on both `/editions/` and `/en/editions/`.
- Confirmed `.editions-list__header` was left exactly as-is (`margin-bottom: var(--space-2xl)` only) — the correctly-removed header hairline from 260728-g76 stays gone.

## Task Commits

Each task was committed atomically:

1. **Task 1: Restore the `.editions-index__row:first-of-type` separator hairline** - `a0e7e0b` (fix)

_Note: single-task quick plan, one commit._

## Files Created/Modified
- `src/components/EditionsOverviewBody.astro` - Added `.editions-index__row:first-of-type` rule with a single `border-top` property, immediately after the base `.editions-index__row` rule.

## Decisions Made
None - followed plan exactly as specified.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. Worktree was missing `.env` and `node_modules` (pre-existing, unrelated to this task) — copied `.env` from the main checkout and ran `npm ci` to enable verification; neither was committed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Éditions overview page is now in its final correct hairline state: row-list separator present, header hairline absent. No known follow-up needed on this page.

## Self-Check: PASSED

- FOUND: src/components/EditionsOverviewBody.astro (`.editions-index__row:first-of-type` rule present)
- FOUND: commit a0e7e0b in git log

---
*Phase: quick-260728-hxv*
*Completed: 2026-07-28*
