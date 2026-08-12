---
phase: quick-260812-ca1
plan: 1
subsystem: ui
tags: [sanity-studio, css, editorial-dashboard, regression-fix]

requires:
  - phase: quick-260812-bj1
    provides: Étape 1 / Étape 2 card layout and the 2-segment .editorial-dashboard__pipeline-bar markup
provides:
  - Explicit width:100% on .editorial-dashboard__pipeline-bar so the flex:1 segment children have a real width to divide
  - Regression test guarding the rule's width declaration
affects: [editorial-dashboard]

tech-stack:
  added: []
  patterns:
    - "Sanity UI <Stack> does not stretch children to full width by default — any custom flex bar nested inside one needs an explicit width:100%, matching the pre-existing .editorial-dashboard__publish-divider precedent in the same file"

key-files:
  created:
    - tests/unit/editorial-dashboard-css.test.ts
  modified:
    - sanity/editorial/EditorialDashboard.css

key-decisions:
  - "Root cause confirmed empirically (isolated Playwright browser repro reproducing the exact collapse) before writing the plan, not inferred from code reading alone"
  - "Single-line CSS fix scoped strictly to the .editorial-dashboard__pipeline-bar rule — no changes to EditorialDashboard.tsx, deployment.ts, or dashboardLogic.ts"

patterns-established: []

requirements-completed: [QUICK-260812-ca1]

coverage:
  - id: D1
    description: ".editorial-dashboard__pipeline-bar carries width:100%; regression test guards the declaration"
    requirement: "QUICK-260812-ca1"
    verification:
      - kind: unit
        ref: "tests/unit/editorial-dashboard-css.test.ts (TDD RED confirmed before the fix, GREEN after)"
        status: pass
      - kind: unit
        ref: "npm run test:unit — 430/430 passed"
        status: pass
    human_judgment: false
  - id: D2
    description: "Scope boundary respected; all gates pass; Studio redeployed"
    requirement: "QUICK-260812-ca1"
    verification:
      - kind: other
        ref: "git diff --stat confirms only EditorialDashboard.css (1 line) and the new test file changed — EditorialDashboard.tsx, deployment.ts, dashboardLogic.ts absent"
        status: pass
      - kind: other
        ref: "npm run typecheck; npm --prefix sanity run lint; npm --prefix sanity run build; npm run deploy --prefix sanity — 'Success! Studio deployed to https://atelier-jacqueline-suzanne.sanity.studio/'"
        status: pass
    human_judgment: true
    rationale: "Final visual confirmation that the bar now renders as a visible 2-segment progress bar in the live Studio should be done by a human with an authenticated session — no browser-automation tool with Sanity login was available to this executor."

duration: 6min
completed: 2026-08-12
status: complete
---

# Quick Task 260812-ca1: Fix the invisible pipeline progress bar Summary

**Added the missing `width: 100%` to `.editorial-dashboard__pipeline-bar` — the bar's `flex:1` segments had zero intrinsic width and collapsed invisibly inside Sanity UI's non-stretching `<Stack>`, leaving only the floating text labels visible. Redeployed the Studio.**

## Performance

- **Duration:** ~6 min
- **Tasks:** 2
- **Files modified:** 2 (1 source, 1 new test)

## Accomplishments
- Root cause confirmed via an isolated Playwright browser repro before touching any code: `.editorial-dashboard__pipeline-bar` is `display:flex` with two `flex:1` (flex-basis:0) `<span>` children, nested inside a Sanity UI `<Stack space={3}>` that does not stretch children to full width by default — so the bar had no intrinsic width and rendered as an invisible sliver.
- Fix: added `width: 100%;` to that rule — the exact same pattern already used by `.editorial-dashboard__publish-divider` elsewhere in the same file.
- New regression test `tests/unit/editorial-dashboard-css.test.ts` (source-text pattern matching `tests/unit/statement-length-limit.test.ts`) — TDD RED→GREEN confirmed.
- All four gates pass: `npm run typecheck`, `npm --prefix sanity run lint`, `npm --prefix sanity run build`, `npm run test:unit` (430/430).
- Studio redeployed: "Success! Studio deployed to https://atelier-jacqueline-suzanne.sanity.studio/"

## Task Commits

1. **Task 1: failing guard for pipeline bar collapsed width** - `8b0841c` (test)
2. **Task 2: give pipeline bar an explicit full width** - `88d5015` (fix)

## Files Created/Modified
- `sanity/editorial/EditorialDashboard.css` - added `width: 100%;` to `.editorial-dashboard__pipeline-bar`
- `tests/unit/editorial-dashboard-css.test.ts` (new) - regression guard reading the CSS source text and asserting the rule includes `width: 100%`

## Deviations from Plan
- Ran `npm ci --prefix sanity` to restore `sanity/node_modules`, missing in this fresh worktree — reproduces the existing lockfile exactly, no new package added, no tracked file changed. (Rule 3 deviation, non-blocking.)

## Issues Encountered
None blocking. Final visual confirmation in the live, authenticated Studio is recommended as a human follow-up (no browser-automation tool with an active Sanity session was available to this executor) — see coverage D2 rationale.

## User Setup Required
None.

## Next Phase Readiness
- The release-pipeline mechanism itself (from quick tasks 260811-w8d and 260812-bj1) is unchanged; this was a pure visual regression fix.
- Follow-up: user should confirm the bar now renders visibly in the live Studio.

---
*Phase: quick-260812-ca1*
*Completed: 2026-08-12*
