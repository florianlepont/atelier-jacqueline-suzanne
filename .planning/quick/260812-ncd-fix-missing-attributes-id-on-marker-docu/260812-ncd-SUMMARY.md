---
phase: quick-260812-ncd
plan: 1
subsystem: editorial-cms
tags: [sanity, actions-api, dashboard-logic, publish-flow]

requires:
  - phase: quick-260812-mev
    provides: one-click publish flow that calls markerActions() to bump the deployment marker on every publish

provides:
  - "attributes._id set on the sanity.action.document.create branch of markerActions(), matching what the Sanity Actions API requires"
  - "CreateDeploymentMarkerAction interface widened with the new _id field so the literal type-checks"
  - "5 unit test expectations updated from the buggy (missing _id) shape to the fixed shape"

affects: [editorial-publish-flow, production-release]

tech-stack:
  added: []
  patterns:
    - "Marker document ids equal their type name (siteDeployment, siteProductionRelease), so attributes._id, attributes._type and publishedId on the create action are all the same MarkerDocumentId literal"

key-files:
  created: []
  modified:
    - sanity/editorial/dashboardLogic.ts
    - tests/unit/dashboard-logic.test.ts

key-decisions:
  - "Fixed once in the shared markerActions() helper rather than duplicating the fix in buildDeploymentMarkerActions and buildProductionReleaseMarkerActions, since both already delegate to it"
  - "Installed root and sanity/ node_modules via npm ci before running gates — this worktree had no dependencies installed, which is unrelated to the plan's source fix but was required to run any verification at all"

patterns-established: []

requirements-completed: [QUICK-260812-ncd]

coverage:
  - id: D1
    description: "The create-action attributes object emitted by markerActions() (used by both buildDeploymentMarkerActions and buildProductionReleaseMarkerActions) now includes _id set to the marker id, so the Sanity Actions API accepts the first-ever-marker create call instead of rejecting it with 'missing required field attributes._id'"
    requirement: "QUICK-260812-ncd"
    verification:
      - kind: unit
        ref: "tests/unit/dashboard-logic.test.ts — 5 attributes: expectation sites across 'deployment marker actions', 'production release marker actions' and 'publication controller' describe blocks"
        status: pass
    human_judgment: false
  - id: D2
    description: "Studio redeployed from the fixed source to https://atelier-jacqueline-suzanne.sanity.studio/, and Romane confirms behaviourally — by clicking « Mettre à jour le site » (or the equivalent publish action) on a real pending draft — that the publish now completes with no 'missing required field' error"
    verification: []
    human_judgment: true
    rationale: "No authenticated browser session exists in this environment to reach the live Sanity Actions API. Unit tests prove the outgoing payload now contains _id; only a real click against the live API proves it is accepted there. This is exactly the class of failure that slipped past every prior local/unit run, since the tests previously asserted the buggy shape."

duration: 18min
completed: 2026-08-12
status: complete
---

# Quick Task 260812-ncd: Fix missing attributes._id on marker document create Summary

**Added `attributes._id: markerId` to the Sanity Actions API create-action payload in `markerActions()`, unblocking Romane's first-ever publish of the deployment/production-release marker documents.**

## Performance

- **Duration:** 18 min
- **Started:** 2026-08-12T14:38:00Z
- **Completed:** 2026-08-12T14:56:20Z
- **Tasks:** 2
- **Files modified:** 2 (source fix) + Studio redeploy (no file diff)

## Accomplishments
- `markerActions()`'s `sanity.action.document.create` branch now sets `attributes._id: markerId` alongside the existing `_type`, fixing the live "action index 1: missing required field 'attributes._id'" error that was blocking all publishing
- `CreateDeploymentMarkerAction` interface widened with `_id: MarkerDocumentId` so the object literal type-checks
- Updated the 5 test expectation sites that had pinned the buggy (missing `_id`) shape across `buildDeploymentMarkerActions`, `buildProductionReleaseMarkerActions`, and the publication controller's bundled marker-create path
- Studio rebuilt and redeployed to https://atelier-jacqueline-suzanne.sanity.studio/ with the fix live

## Task Commits

Each task was committed atomically:

1. **Task 1: Emit the marker id inside create-action attributes, and unpin the tests** - `5cd60ad` (fix)
2. **Task 2: Redeploy the Studio and get live behavioural confirmation** - no code commit (deploy-only action; `npm run deploy --prefix sanity` completed successfully, no files modified)

**Plan metadata:** committed separately by the orchestrator (docs artifacts excluded from this executor's commits per constraints)

## Files Created/Modified
- `sanity/editorial/dashboardLogic.ts` - Added `_id: MarkerDocumentId` to the `CreateDeploymentMarkerAction` interface's `attributes` type, and `_id: markerId` to the create-branch `attributes` object literal in `markerActions()`
- `tests/unit/dashboard-logic.test.ts` - Updated 5 `attributes:` expectation objects (2 `siteDeployment`-only-create tests, 1 `siteProductionRelease`-only-create test, 1 mixed production-release trigger test, 1 publication-controller bundled-publish test) to assert the new `_id` field with the correct literal per marker

## Decisions Made
- Fixed once in the shared `markerActions()` helper (not duplicated per caller), since `buildDeploymentMarkerActions` and `buildProductionReleaseMarkerActions` both delegate to it — matches the plan's explicit intent
- Left the existing-marker edit/publish branch completely untouched — it emits a `patch`, not `attributes`, and was never affected by this bug
- Installed root and `sanity/` dependencies via `npm ci` before running any verification gate, since this worktree started with empty `node_modules` — this is a worktree environment setup step, not a scope change, and is not reflected in the source diff

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed missing dependencies before verification could run**
- **Found during:** Task 1 verification (`npm run test:unit`)
- **Issue:** This worktree's `node_modules` (root and `sanity/`) were empty, so even the pre-existing, unmodified test suite failed to import (`Cannot find package '@sanity/icons/BulbOutline'`) — unrelated to the plan's edit
- **Fix:** Ran `npm ci` at the repo root and `npm ci --prefix sanity` to install from the existing lockfiles (no lockfile or `package.json` changes)
- **Files modified:** none (only `node_modules`, which is gitignored)
- **Verification:** All four verification gates then ran and passed cleanly
- **Committed in:** N/A — no tracked files changed by this step

---

**Total deviations:** 1 auto-fixed (1 blocking — environment setup, not a code change)
**Impact on plan:** No scope creep; the actual source fix matches the plan exactly (2 files, the two specified edits, 5 specified test sites).

## Issues Encountered
None beyond the dependency-installation deviation above.

## User Setup Required
None - no external service configuration required. The Studio deploy in Task 2 used the already-configured `sanity deploy` command and existing project credentials; no new setup was needed.

## Next Phase Readiness

- Source fix is committed, gates are green, and the Studio is redeployed live at https://atelier-jacqueline-suzanne.sanity.studio/
- **Blocking on human confirmation:** Romane needs to click the publish action ("Mettre à jour le site" / equivalent) on a real pending draft on the live Studio right now, and report back whether it succeeds or what error text (if any) still appears. A green test suite proves the outgoing payload shape is correct; it does not by itself prove the live Sanity Actions API accepts it — only a real click does.
- If the live click still fails with a *different* error, that indicates a second, distinct defect requiring a follow-up quick task — not a re-application of this fix.

---
*Phase: quick-260812-ncd*
*Completed: 2026-08-12*

## Self-Check: PASSED

- FOUND: sanity/editorial/dashboardLogic.ts
- FOUND: tests/unit/dashboard-logic.test.ts
- FOUND commit: 5cd60ad
