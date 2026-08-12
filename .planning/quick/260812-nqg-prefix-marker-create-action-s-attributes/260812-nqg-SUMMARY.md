---
phase: quick-260812-nqg
plan: 1
subsystem: cms
tags: [sanity, actions-api, editorial-dashboard, deployment-marker]

# Dependency graph
requires:
  - phase: quick-260812-ncd (Fix marker create attributes._id bug)
    provides: Added the missing `attributes._id` field to the marker create action (was previously absent, causing "missing required field"). Left it bare, which surfaced this plan's second, distinct Actions API validation error.
provides:
  - "markerActions()`'s `sanity.action.document.create` branch now sends a `drafts.`-prefixed `attributes._id`, matching the `draftId` the sibling publish action in the same array already used"
  - "CreateDeploymentMarkerAction.attributes._id` re-typed to the prefixed template-literal form, consistent with `EditDeploymentMarkerAction.draftId` / `PublishDeploymentMarkerAction.draftId`"
  - "5 create-branch test assertions (3 siteDeployment, 2 siteProductionRelease) updated to expect the prefixed id; the 7 bare-id `DeploymentMarker` fixtures/mocks are untouched"
  - "Live Sanity Studio redeployed with the fix"
affects: [editorial-dashboard, deployment-actions, sanity-studio]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "sanity.action.document.create targets the draft version, so its attributes._id must carry the drafts. prefix — same rule that already applied to draftId on edit/publish actions, now applied consistently across all four action types in DocumentAction"

key-files:
  created: []
  modified:
    - sanity/editorial/dashboardLogic.ts
    - tests/unit/dashboard-logic.test.ts

key-decisions:
  - "Only attributes._id was prefixed. attributes._type stays bare (it names a schema type, not a document version) and publishedId stays bare (it names the eventual published document) — both were explicitly called out in the plan as the likely mis-edit targets and were verified untouched via grep counts before committing."

requirements-completed: [QUICK-260812-nqg]

coverage:
  - id: D1
    description: "markerActions() create branch emits a drafts.-prefixed attributes._id, unblocking the Sanity Actions API validation that previously rejected the publish call with \"attributes._id must be prefixed with drafts. or versions.{bundleId}\""
    requirement: "QUICK-260812-nqg"
    verification:
      - kind: unit
        ref: "tests/unit/dashboard-logic.test.ts (5 create-branch assertions across buildDeploymentMarkerActions and buildProductionReleaseMarkerActions, absent-marker case)"
        status: pass
      - kind: other
        ref: "npm run typecheck && npm --prefix sanity run lint && npm --prefix sanity run build"
        status: pass
    human_judgment: false
  - id: D2
    description: "Live Sanity Studio redeployed and Romane confirms the real 'Mettre le site à jour' publish click now succeeds against the live Actions API"
    requirement: "QUICK-260812-nqg"
    verification:
      - kind: manual_procedural
        ref: "User hard-refreshes https://atelier-jacqueline-suzanne.sanity.studio/ and clicks the publish action; reports success or the new verbatim error"
        status: unknown
    human_judgment: true
    rationale: "The unit tests exercise the same object shape the API rejected, but only a real Actions API call against the live Content Lake can confirm the validation error is actually gone — this plan explicitly requires a live-click confirmation, not just green tests."

# Metrics
duration: ~15min
completed: 2026-08-12
status: complete
---

# Phase quick-260812-nqg Plan 1: Prefix marker create action's attributes._id Summary

**Prefixed the marker create action's `attributes._id` with `drafts.` in `markerActions()`, fixing the second (of two, in sequence) Sanity Actions API validation error blocking Romane's publish flow, and redeployed the live Studio.**

## Performance

- **Duration:** ~15 min
- **Tasks:** 2 completed
- **Files modified:** 2 (source), plus a live Studio redeploy

## Accomplishments
- `sanity/editorial/dashboardLogic.ts`: the `if (!marker)` branch of `markerActions()` now sets `attributes._id` to `` `drafts.${markerId}` ``, matching the `draftId` already used by the adjacent `sanity.action.document.publish` action — `attributes._type` stays the bare `markerId`
- `CreateDeploymentMarkerAction.attributes._id` re-typed from `MarkerDocumentId` to `` `drafts.${MarkerDocumentId}` ``, consistent with the sibling `draftId` types on `EditDeploymentMarkerAction`/`PublishDeploymentMarkerAction`
- 5 create-branch test assertions updated (lines then-271, 330, 398, 441, 527 — 3 `siteDeployment`, 2 `siteProductionRelease`) to expect the prefixed id; the 7 bare-id `DeploymentMarker` fixture/mock occurrences elsewhere in the file are unchanged, since a stored marker document's `_id` genuinely is bare
- Live Studio redeployed via `npm run deploy --prefix sanity` — succeeded, published to `https://atelier-jacqueline-suzanne.sanity.studio/`

## Task Commits

Each task was committed atomically:

1. **Task 1: Prefix the create action's attributes._id and realign its type and tests** - `bcc1a28` (fix)

Task 2 (redeploy) had no source changes to commit — it ran `npm run deploy --prefix sanity` against Task 1's already-committed change.

**Plan metadata:** commit pending (orchestrator handles the docs commit)

## Files Created/Modified
- `sanity/editorial/dashboardLogic.ts` - `markerActions()` create branch and `CreateDeploymentMarkerAction.attributes._id` type now carry the `drafts.` prefix
- `tests/unit/dashboard-logic.test.ts` - 5 create-branch assertions updated to expect the prefixed id

## Decisions Made
- Left `attributes._type` and `publishedId` bare per the plan's explicit constraint — verified via grep counts (`_type: markerId` occurs exactly once in source, `_type: '(siteDeployment|siteProductionRelease)'` occurs exactly 5 times in tests) before committing, to guard against the "obvious mis-edit" the plan warned about.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed sanity/ npm dependencies in this worktree**
- **Found during:** Task 1 verification (`npm run test:unit` failed with `Cannot find package '@sanity/icons/BulbOutline'`, then confirmed `sanity/node_modules` did not exist at all in this fresh worktree)
- **Issue:** This worktree had root `node_modules` but no `sanity/node_modules`, so any test importing `sanity/editorial/dashboardLogic.ts` (which imports `@sanity/icons`) failed to resolve — unrelated to this plan's code change
- **Fix:** Ran `npm ci --prefix sanity`, which installed exactly the versions pinned in the already-committed `sanity/package-lock.json` — no new packages chosen or added
- **Files modified:** none tracked (`sanity/node_modules` is gitignored)
- **Verification:** `npm run test:unit` went from 19/20 files passing (452 tests total after fix) to 20/20 files passing; `npm --prefix sanity run lint`, `npm --prefix sanity run build`, and `npm run deploy --prefix sanity` all then ran successfully
- **Committed in:** N/A (no file changes to commit — standard environment setup)

---

**Total deviations:** 1 auto-fixed (1 blocking / environment setup)
**Impact on plan:** No scope creep — pure local dependency installation from an already-locked lockfile, required to run the plan's own verification gates.

## Issues Encountered
None beyond the dependency-install deviation above.

## User Setup Required
None - no external service configuration required. The live Studio redeploy is part of this plan's Task 2, already executed.

## Next Phase Readiness

- All automated gates from the plan's `<verification>` block pass: `npm run test:unit` (452/452), `npm run typecheck` (0 errors), `npm --prefix sanity run lint` (clean), `npm --prefix sanity run build` (succeeds), `git diff --stat` against the worktree base lists exactly `sanity/editorial/dashboardLogic.ts` and `tests/unit/dashboard-logic.test.ts`, and `npm run deploy --prefix sanity` succeeded (deployed to `https://atelier-jacqueline-suzanne.sanity.studio/`).
- Scope boundary respected: `EditorialDashboard.tsx`, `deployment.ts`, `releasePipelineState()`, `resolvePromoteRow()`, and `.github/workflows/` are untouched (confirmed via `git diff --stat`).
- **Outstanding: live confirmation from Romane.** The `drafts.` prefix fix is deployed to the live Studio. The unit tests prove the object shape is now internally consistent (create action's id matches the publish action's draftId), but only a real click against the live Actions API can confirm the validation error is actually gone. **Romane needs to hard-refresh the Studio and click « Mettre le site à jour » now**, and report back either success or the verbatim new error text if a third, different validation issue surfaces.

---
*Phase: quick-260812-nqg*
*Completed: 2026-08-12*

## Self-Check: PASSED

Both claimed source files confirmed present on disk (sanity/editorial/dashboardLogic.ts, tests/unit/dashboard-logic.test.ts). This SUMMARY.md confirmed written. Claimed commit `bcc1a28` confirmed present in `git log --oneline --all`.
