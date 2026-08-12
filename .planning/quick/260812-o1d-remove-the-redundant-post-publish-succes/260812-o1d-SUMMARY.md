---
phase: quick-260812-o1d
plan: 1
subsystem: ui
tags: [react, sanity-ui, editorial-dashboard, source-text-testing]

requires:
  - phase: quick-260812-lvt
    provides: divider-guard pattern (publicationPanelHasBody / editorial-dashboard__publish-divider) established for the same panel
provides:
  - Removal of the duplicated post-publish success sentence in the editorial dashboard's publish panel
  - Removal of the success-phase clause from publicationPanelHasBody so the divider no longer draws above empty space
  - A fifth source-text describe block in editorial-dashboard-markup.test.ts guarding both deletions
affects: [editorial-dashboard, sanity-studio]

tech-stack:
  added: []
  patterns:
    - "Source-text (readFileSync) assertions over EditorialDashboard.tsx remain the established regression-guard pattern in this repo (no React Testing Library available for the sanity/ subtree from the root Vitest project)."

key-files:
  created: []
  modified:
    - sanity/editorial/EditorialDashboard.tsx
    - tests/unit/editorial-dashboard-markup.test.ts

key-decisions:
  - "Deleted the redundant success Text block outright rather than shortening/rewording it — the pipeline visualisation directly above already reports the same fact live."
  - "Removed only the success-phase clause of publicationPanelHasBody, keeping the divider Box itself and its other four clauses (blockedRows, tracking-error, error, confirming-with-error) untouched, so the divider still appears in every state that has real body content."
  - "Left publishedAt/setPublishedAt state intact despite losing its last JSX consumer — publishedReference and both async handlers still depend on it."

patterns-established: []

requirements-completed: [QUICK-260812-o1d]

coverage:
  - id: D1
    description: "Post-publish success state no longer renders a standalone success sentence; the pipeline visualisation is the only reporter of that state."
    requirement: "QUICK-260812-o1d"
    verification:
      - kind: unit
        ref: "tests/unit/editorial-dashboard-markup.test.ts#editorial dashboard post-publish success state has no duplicated status line > never renders a success-phase Text block or gates the panel body on it"
        status: pass
    human_judgment: false
  - id: D2
    description: "The publish-divider rule no longer draws above empty space in the success state, because publicationPanelHasBody no longer counts the success phase as body content, while the other four clauses (blockedRows, tracking-error, error, confirming-with-error) still trigger it."
    requirement: "QUICK-260812-o1d"
    verification:
      - kind: unit
        ref: "tests/unit/editorial-dashboard-markup.test.ts#editorial dashboard post-publish success state has no duplicated status line > keeps publicationPanelHasBody declared once and consumed once as the divider guard"
        status: pass
    human_judgment: false
  - id: D3
    description: "The tracking-error card (headline, publicationState.error line, « Actualiser le suivi » retry button) is untouched and fully functional."
    requirement: "QUICK-260812-o1d"
    verification:
      - kind: unit
        ref: "tests/unit/editorial-dashboard-markup.test.ts#editorial dashboard post-publish success state has no duplicated status line > keeps the tracking-error card retry button intact"
        status: pass
    human_judgment: false
  - id: D4
    description: "Visual confirmation in the live, redeployed Studio: no duplicate sentence and no dangling divider after a successful publish; blocked/error/tracking-error states still show their card with the divider above it."
    verification: []
    human_judgment: true
    rationale: "This environment has no authenticated browser session against the deployed Sanity Studio — only the user can visually confirm the rendered panel states post-deploy."

duration: 25min
completed: 2026-08-12
status: complete
---

# Quick Task 260812-o1d: Remove Redundant Post-Publish Success Line Summary

**Deleted the duplicated post-publish success sentence and its divider-triggering clause from the editorial dashboard's publish panel, backed by a new source-text regression guard, gates green, and the Studio redeployed.**

## Performance

- **Duration:** 25 min
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Removed the static `Text` block that duplicated what the pipeline visualisation already reports live after a successful publish (`publicationState.phase === 'success' && publishedAt`).
- Removed the matching clause from `publicationPanelHasBody` so the `editorial-dashboard__publish-divider` rule no longer draws above empty space in the success state, while the four other clauses (blockedRows, tracking-error, error, confirming-with-error) remain untouched and still trigger the divider.
- Added a fifth `describe` block to `editorial-dashboard-markup.test.ts` (source-text assertions, matching the file's established style) that fails if either deletion is reverted.
- Confirmed `publishedAt`/`setPublishedAt` state is intact — it lost its last JSX reader but is still written by `runPublication()` and `refreshPublicationTracking()` and still consumed by `publishedReference`.
- All four blocking gates (unit tests, typecheck, Sanity lint, Sanity build) pass; the scope diff against `dashboardLogic.ts`, `deployment.ts` and `.github/workflows/` is empty.
- Redeployed the live Sanity Studio to https://atelier-jacqueline-suzanne.sanity.studio/

## Task Commits

Each task was committed atomically:

1. **Task 1: Delete the redundant success Text and its divider-triggering clause, and guard the removal** - `4a25575` (fix)
2. **Task 2: Run every gate, prove the scope held, redeploy the Studio and hand off for visual confirmation** - no source changes (gates + deploy only, no commit)

_Note: Task 2 was verification/deploy-only per the plan; it produced no code diff to commit._

## Files Created/Modified
- `sanity/editorial/EditorialDashboard.tsx` - Removed the duplicated success `Text` block (~6 lines) and the success-phase clause of `publicationPanelHasBody` (1 line)
- `tests/unit/editorial-dashboard-markup.test.ts` - Added a fifth `describe` block with 3 assertions guarding both deletions

## Decisions Made
- Deleted the success sentence outright (no shorter reword, no toast, no placeholder) — the pipeline visualisation above it already carries the same information live, so any residual copy would still be a duplicate.
- Kept the divider `Box` itself conditional (not deleted, not made unconditional) since the four surviving `publicationPanelHasBody` clauses still need it.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Restored `sanity/` dependencies via `npm ci --prefix sanity`**
- **Found during:** Task 1 verification (`npm --prefix sanity run lint`)
- **Issue:** `sanity/node_modules` was missing entirely in this worktree, so ESLint failed with `ERR_MODULE_NOT_FOUND` for `@sanity/eslint-config-studio` before any linting could run.
- **Fix:** Ran `npm ci --prefix sanity`, which installs exactly the versions pinned in the existing `sanity/package-lock.json` — restoring already-declared dependencies, not adding a new package (the package-manager-install exclusion in Rule 3 applies to installing new/unpinned packages, not to `npm ci` restoring a committed lockfile). This mirrors the project's own CI pipeline step (`npm ci --prefix sanity`, documented in CLAUDE.md).
- **Files modified:** None tracked (node_modules is gitignored; no package.json/lockfile changes).
- **Verification:** `npm --prefix sanity run lint` and `npm --prefix sanity run build` both ran clean afterward.
- **Committed in:** N/A (no tracked file changes; nothing to commit for this step)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary to make the Sanity lint/build gates runnable at all in this worktree. No scope creep — no package.json/lockfile edits, no new dependencies added.

## Issues Encountered
None beyond the dependency-restoration deviation above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness

The Studio is live at https://atelier-jacqueline-suzanne.sanity.studio/ with the change deployed.

**Please hard-refresh the Studio (Cmd+Shift+R) and confirm:**
1. After a successful publish, the panel shows no standalone success sentence and no horizontal divider line sitting above empty space — the pipeline visualisation should be the last thing in that section.
2. The blocked-content, publish-error and changed-batch (confirming-with-error) states still show their card WITH the divider line above it.
3. If the tracking check fails, the caution card still appears in full, retry button (« Actualiser le suivi ») included.

---
*Phase: quick-260812-o1d*
*Completed: 2026-08-12*

## Self-Check: PASSED

- FOUND: sanity/editorial/EditorialDashboard.tsx
- FOUND: tests/unit/editorial-dashboard-markup.test.ts
- FOUND commit: 4a25575
