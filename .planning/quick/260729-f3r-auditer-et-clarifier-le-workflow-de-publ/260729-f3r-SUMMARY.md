---
phase: quick-260729-f3r
plan: 01
subsystem: cms-editorial-workflow
tags: [sanity, actions-api, astro, github-actions, vitest, publication]

requires:
  - phase: 03-sanity-cms-content-operations
    provides: Sanity schemas, editorial dashboard, document checks and GitHub Pages deployment
provides:
  - Canonical registry and fail-closed checks for all seven public content types
  - Dashboard-only atomic publication with fresh preflight and revision guards
  - Freshness-aware GitHub deployment status and adaptive polling
  - French editorial guide for the draft-to-public workflow
affects: [sanity-studio, content-operations, github-pages, editor-uat]

tech-stack:
  added: []
  patterns:
    - Canonical public-type registry shared by schemas, actions and dashboard inventory
    - Atomic multi-document publication through one Sanity Actions API call
    - Fail-closed deployment freshness derived from authoritative publication timestamps
    - Confirmation fingerprint binding membership and both draft/published revisions

key-files:
  created:
    - .planning/quick/260729-f3r-auditer-et-clarifier-le-workflow-de-publ/260729-f3r-SUMMARY.md
  modified:
    - sanity/editorial/workflowLogic.ts
    - sanity/editorial/checks.ts
    - sanity/editorial/dashboardLogic.ts
    - sanity/editorial/EditorialDashboard.tsx
    - sanity/editorial/deployment.ts
    - sanity/README.md
    - tests/unit/editorial-checks.test.ts
    - tests/unit/workflow-logic.test.ts
    - tests/unit/dashboard-logic.test.ts
    - tests/unit/deployment.test.ts

key-decisions:
  - "The seven public types share one canonical registry; exhibition remains an independent Agenda workflow."
  - "Public document panes save drafts only; the dashboard publishes every ready draft in one guarded Actions API call."
  - "Site freshness is proven only by a successful GitHub run created at or after the authoritative Sanity publication timestamp."
  - "Same-second Sanity/GitHub timestamps are treated as ambiguous and resolve to unknown."
  - "Real editor permissions and webhook fan-out remain unknown until separately authorized manual UAT."

patterns-established:
  - "Fail-closed editorial checks: absent or empty public checklists are blocking."
  - "Fresh-before-write: preflight reloads raw versions immediately before constructing the atomic action batch."
  - "Honest deployment state: API errors and incoherent timestamps resolve to unknown, never current."

requirements-completed: [260729-f3r]

coverage:
  - id: D1
    description: "Seven public document types use exhaustive blocking checks and cannot publish from their document panes."
    requirement: 260729-f3r
    verification:
      - kind: unit
        ref: "tests/unit/editorial-checks.test.ts and tests/unit/workflow-logic.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "The dashboard classifies, validates and publishes ready public drafts as one guarded atomic batch."
    requirement: 260729-f3r
    verification:
      - kind: unit
        ref: "tests/unit/dashboard-logic.test.ts"
        status: pass
      - kind: integration
        ref: "npm --prefix sanity run build"
        status: pass
    human_judgment: false
  - id: D3
    description: "GitHub deployment freshness and adaptive polling are based on runs created after the Sanity publication reference."
    requirement: 260729-f3r
    verification:
      - kind: unit
        ref: "tests/unit/deployment.test.ts"
        status: pass
      - kind: integration
        ref: "npm --prefix sanity run build"
        status: pass
    human_judgment: false
  - id: D4
    description: "The French editor guide documents draft-only editing, global publication, deployment states and recovery paths."
    requirement: 260729-f3r
    verification:
      - kind: other
        ref: "sanity/README.md"
        status: pass
    human_judgment: false
  - id: D5
    description: "The real Editor role can publish the global batch and the live Sanity webhook fans out correctly to GitHub."
    requirement: 260729-f3r
    verification: []
    human_judgment: true
    rationale: "Requires a deployed Studio, the real Editor account and separately authorized mutations on the live dataset."

duration: 32min
completed: 2026-07-29
status: complete
---

# Quick Task 260729-f3r Plan 01: Studio Publication Workflow Summary

**A single Sanity dashboard command now validates and atomically publishes all public drafts, then proves GitHub Pages freshness against the resulting publication timestamp.**

## Performance

- **Duration:** 32 min
- **Started:** 2026-07-29T09:21:58Z
- **Completed:** 2026-07-29T09:53:36Z
- **Tasks:** 3 plus deep-review remediation
- **Files modified:** 18

## Accomplishments

- Centralized the seven public types and five singletons, made every public checklist fail closed, and removed per-document Publish/Unpublish paths while preserving draft-management actions.
- Added a dominant dashboard workflow that deduplicates drafts, exposes four publication categories, blocks incomplete or unresolved content, and issues exactly one revision-guarded Sanity Actions API request.
- Added post-publication GitHub state tracking with qualified runs, honest waiting/failure/unknown states, adaptive polling and an editor-facing French operating guide.
- Closed all four critical and five warning findings from deep review with revision-bound confirmation, explicit committed/tracking states, cross-tab timestamps and complete inspector coverage.

## Task Commits

Each TDD task was committed as a RED test gate followed by its GREEN implementation:

1. **Task 1: Canonicaliser le périmètre public et fermer les garde-fous documentaires**
   - `c1a9cdc` — failing publication guard tests
   - `c511f90` — canonical registry, exhaustive checks and passive document actions
2. **Task 2: Publier atomiquement depuis le tableau de bord**
   - `1dc4846` — failing atomic publication tests
   - `ac634b1` — batch preflight, Actions API controller and dashboard flow
3. **Task 3: Rendre la fraîcheur GitHub vérifiable et documenter le workflow**
   - `b71af3d` — failing deployment freshness tests
   - `cd7c537` — qualified-run state machine, polling integration and editorial guide
4. **Deep review remediation**
   - `2f769a6` — RED regressions for all critical findings and warnings
   - `ee93b6e` — race-safe publication, committed tracking and honest freshness fixes

## Files Created/Modified

- `sanity/editorial/workflowLogic.ts` — canonical public/singleton registries and document-action policy.
- `sanity/editorial/checks.ts` — exhaustive required and recommended checks for every public type.
- `sanity/editorial/workflow.tsx` — disabled draft-status action and removal of public Publish/Unpublish actions.
- `sanity/sanity.config.ts` — singleton creation guard shared with the canonical registry.
- `sanity/schemas/gallery.ts`, `sanity/schemas/edition.ts` — delayed “Visibilité” publication microcopy.
- `sanity/editorial/dashboardLogic.ts` — draft pairing, classifications, dependency checks, atomic action payload and publication controller.
- `sanity/editorial/EditorialDashboard.tsx` — global publication card, confirmation, retry, refresh and deployment status integration.
- `sanity/editorial/deployment.ts` — bounded public GitHub run query, freshness state machine and polling cadence.
- `sanity/README.md` — French editor workflow and troubleshooting guide.
- `tests/unit/*.test.ts` — 251 passing tests across 14 suites, including publication-race, cross-tab and freshness invariants.

## Decisions Made

- `exhibition` keeps its independent Agenda checklist and publication behavior because no current public route consumes it.
- Sanity Content Lake remains the authorization and atomicity boundary; the browser receives no GitHub secret and makes only public read-only GitHub API calls.
- Published document `_updatedAt` values are the authoritative reference for qualifying a post-publication GitHub run.
- The maximum valid local/remote `_updatedAt` wins; same-second GitHub candidates fail closed because GitHub timestamps are less precise.
- The dashboard fails closed for missing checklists, strong-reference failures, timestamp anomalies, permission errors and API errors.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Replaced unsupported Sanity icon subpath imports**

- **Found during:** Task 2 (Studio build)
- **Issue:** Three pre-existing files imported unsupported `@sanity/icons/*` subpaths, preventing the required Sanity Studio build from completing after the planned root-import cleanup exposed the full bundle.
- **Fix:** Changed only those imports to the equivalent root exports; no component behavior changed.
- **Files modified:** `sanity/editorial/OpenSitePage.tsx`, `sanity/editorial/DocumentChecklist.tsx`, `sanity/schemas/structure.ts`
- **Verification:** `npm --prefix sanity run lint` and `npm --prefix sanity run build`
- **Committed in:** `ac634b1`

**2. [Rule 1 - Bug] Bound dispatch to the batch and revisions the editor confirmed**

- **Found during:** Deep code review (CR-02)
- **Issue:** A new draft or concurrent edit could enter the transaction after confirmation.
- **Fix:** Added membership/revision fingerprints, re-confirmation on change, and `ifDraftRevisionId` plus `ifPublishedRevisionId` optimistic guards.
- **Files modified:** `sanity/editorial/dashboardLogic.ts`, `sanity/editorial/EditorialDashboard.tsx`, `tests/unit/dashboard-logic.test.ts`
- **Verification:** Added-draft, draft-revision and published-revision race regressions.
- **Committed in:** `2f769a6`, `ee93b6e`

**3. [Rule 1 - Bug] Separated committed Sanity success from tracking failure**

- **Found during:** Deep code review (CR-03)
- **Issue:** A post-commit timestamp failure was presented as a failed publication and offered a dangerous retry.
- **Fix:** Added committed/tracking-error states, immediate inventory refresh, full timestamp-ID coverage validation and a tracking-only retry.
- **Files modified:** `sanity/editorial/dashboardLogic.ts`, `sanity/editorial/EditorialDashboard.tsx`, `tests/unit/dashboard-logic.test.ts`
- **Verification:** Timestamp-query and partial-response regressions; atomic action count remains one.
- **Committed in:** `2f769a6`, `ee93b6e`

**4. [Rule 1 - Bug] Made deployment freshness and dashboard copy fail closed**

- **Found during:** Deep code review (CR-01, CR-04, WR-02, WR-03)
- **Issue:** Stale local timestamps, unconditional “à jour” copy, precision ambiguity and malformed irrelevant runs could misreport freshness.
- **Fix:** Use the maximum valid publication timestamp, derive the subtitle from deployment state, return unknown for same-second ambiguity and validate only the selected run.
- **Files modified:** `sanity/editorial/deployment.ts`, `sanity/editorial/EditorialDashboard.tsx`, `tests/unit/deployment.test.ts`
- **Verification:** Cross-tab, fractional/exact-second, malformed-old-run and state-copy regressions.
- **Committed in:** `2f769a6`, `ee93b6e`

**5. [Rule 1/2 - Bug and Missing Critical] Completed editor-facing recovery and checklist coverage**

- **Found during:** Deep code review (WR-01, WR-04, WR-05)
- **Issue:** Editions were generically named, preflight rejection escaped the UI, and edition inspectors were not registered.
- **Fix:** Added edition titles/fallbacks, handled preflight helpers, and derived inspector types from all seven public types plus exhibition.
- **Files modified:** `sanity/editorial/dashboardLogic.ts`, `sanity/editorial/EditorialDashboard.tsx`, `sanity/editorial/workflowLogic.ts`, `sanity/editorial/DocumentChecklist.tsx`
- **Verification:** Edition blocking/title, handled rejection and checklist-scope invariants.
- **Committed in:** `2f769a6`, `ee93b6e`

---

**Total deviations:** 5 auto-fixed groups (3 Rule 1, 1 Rule 1/2, 1 Rule 3).

**Impact on plan:** Every correction is bounded to correctness, editor safety or the required seven-type contract; no package, secret, server, workflow or public-site behavior was added.

## Issues Encountered

- The sandbox could not resolve `sanity-cdn.com`; the same build passed with approved network access.
- Sanity reported a non-blocking version notice: local `sanity` 6.4.0 versus auto-update runtime 6.7.0. No dependency was changed by this plan.

## Verification

- `npm run test:unit -- tests/unit/editorial-checks.test.ts tests/unit/workflow-logic.test.ts` — passed.
- `npm run test:unit -- tests/unit/dashboard-logic.test.ts tests/unit/editorial-checks.test.ts tests/unit/workflow-logic.test.ts` — passed.
- `npm run test:unit -- tests/unit/dashboard-logic.test.ts tests/unit/deployment.test.ts tests/unit/workflow-logic.test.ts tests/unit/editorial-checks.test.ts` — 130 passed.
- `npm run lint` — passed.
- `npm run typecheck` — passed with zero errors.
- `npm run test:unit` — 14 suites and 251 tests passed.
- `npm --prefix sanity run lint` — passed.
- `npm --prefix sanity run build` — passed.

No live Sanity dataset, deployed Studio, webhook or GitHub workflow was mutated by these checks.

## Known Stubs

None. The empty image `alt` found by the stub scan belongs to a decorative dashboard thumbnail;
the placeholder wording found by the scan is confined to a unit-test description.

## Pending Manual UAT

These checks remain deliberately unverified and unchecked:

- [ ] Confirm that Romane’s real **Editor** role can edit all seven public types and execute the
  global Sanity Actions API batch while retaining appropriate least-privilege access.
- [ ] Publish two harmless complete drafts in a separately authorized live/staging exercise and
  observe the Sanity webhook’s actual GitHub `repository_dispatch` fan-out.
- [ ] Confirm that the live dashboard stays waiting/deploying until a successful run with
  `created_at >= publishedAt`, and records the real run cardinality without assuming it.

No Studio deployment, live content publication or external webhook observation was performed.
These items require separate authorization and do not block this local implementation summary.

## User Setup Required

None for the local implementation. The Pending Manual UAT requires a separately authorized Studio
deployment and live/staging content exercise.

## Next Phase Readiness

- The branch is locally deliverable and the publication flow is fully covered by unit tests and a
  production Studio build.
- External acceptance remains limited to the real Editor permission and webhook fan-out checks
  listed above.

## Self-Check: PASSED

All key implementation files, the original six RED/GREEN commits and the two deep-review
remediation commits were found. The summary also passes `git diff --check`.

---

*Phase: quick-260729-f3r*
*Completed: 2026-07-29*
