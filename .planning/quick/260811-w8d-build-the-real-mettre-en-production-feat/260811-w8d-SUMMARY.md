---
phase: quick-260811-w8d
plan: 1
subsystem: infra
tags: [sanity-studio, ci-cd, github-actions, deploy, editorial-dashboard, react]

requires:
  - phase: quick-260811-v3t
    provides: The prior blanket auto-deploy-on-Sanity-publish mechanism this quick task replaces
provides:
  - "siteProductionRelease internal marker document + Actions-API function that touches it"
  - "Workflow-parameterized deployment.ts tracking either deploy.yml (staging) or deploy-ovh.yml (production), reporting Staging à jour / Production à jour instead of the ambiguous Site à jour"
  - "Pure releasePipelineState state machine driving sketch-016 Variant C"
  - "Sketch-016 Variant C UI (3-segment bar + one dynamic promote row) in the editorial dashboard"
  - "deploy-ovh.yml re-pointed at a dedicated production-deploy-requested event"
  - "Docs describing the editor-gated production release path, including the human-only Sanity webhook setup"
affects: [05-launch-domain-cutover]

tech-stack:
  added: []
  patterns:
    - "Marker-document-id union (MarkerDocumentId) widening one markerActions() implementation instead of duplicating per-marker action builders"
    - "Deployment target config record (staging/production) parameterizing deploymentState()'s label/site-url/workflow-url by a `target` argument"
    - "Pure state-machine function (releasePipelineState) rendered straight into JSX with no branching copy in the component"

key-files:
  created:
    - sanity/schemas/siteProductionRelease.ts
  modified:
    - sanity/schemas/index.ts
    - sanity/schemas/structure.ts
    - sanity/editorial/workflowLogic.ts
    - sanity/editorial/dashboardLogic.ts
    - sanity/editorial/deployment.ts
    - sanity/editorial/EditorialDashboard.tsx
    - sanity/editorial/EditorialDashboard.css
    - .github/workflows/deploy-ovh.yml
    - tests/unit/workflow-logic.test.ts
    - tests/unit/dashboard-logic.test.ts
    - tests/unit/deployment.test.ts
    - tests/unit/deploy-ovh-workflow.test.ts
    - README.md
    - sanity/README.md
    - .planning/phases/05-launch-domain-cutover/05-CONTEXT.md

key-decisions:
  - "buildProductionReleaseMarkerActions deliberately takes no publicActions parameter -- the Sanity Actions API commits its array as one transaction, so the absence of that parameter is the structural guarantee that a production release can never ride along with a content publish."
  - "Production deployment polling never starts until a production release has actually been requested (productionReleaseAt is empty) -- avoids polling deploy-ovh.yml for a release nobody asked for."
  - "A production release is considered stale (segment falls back to pending, button re-enables) whenever there is no release timestamp yet OR the newest content publication is strictly newer than the last release -- this is what lets a second publish be promoted again after a prior release completes."
  - "The Sanity Project Webhook that turns the marker publish into a GitHub repository_dispatch is out of repo scope entirely (user_setup) -- nothing in this codebase can create it, and the feature is inert without it."

requirements-completed: [QUICK-260811-w8d]

duration: ~25min
completed: 2026-08-11
status: complete
---

# Quick Task 260811-w8d: Build the real "Mettre en production" feature Summary

**Sketch-016 Variant C editor-gated production release: a `siteProductionRelease` marker + Actions-API trigger, a `releasePipelineState` pure state machine, a 3-segment dashboard pipeline bar, and `deploy-ovh.yml` re-pointed at its own `production-deploy-requested` event.**

## IMPORTANT — this feature is INERT until a human configures the Sanity webhook

This entire feature depends on a **Sanity Project Webhook** that this repository cannot create. Everything built in this plan works end-to-end EXCEPT the one hop between "the Studio marker document gets published" and "GitHub receives a `repository_dispatch`" — that hop is a webhook configured in Sanity's own hosted dashboard (`https://www.sanity.io/manage` → project → API → Webhooks), which no code or CLI in this environment is authenticated to create.

**Until that webhook exists:** clicking `Mettre en production` in Sanity Studio will succeed — it publishes the `siteProductionRelease` marker and the dashboard will show the button transitioning through its busy state correctly — but **no production deploy will start.** `deploy-ovh.yml` will simply never receive the dispatch event. See README.md's "Production deploy: one-time setup" item 6 for the exact webhook configuration (trigger, filter, body, headers) and the required fine-grained GitHub PAT scope. The PAT itself must be entered only into Sanity's webhook header config — it must never be pasted into this repository, and none was.

`npm ci --prefix sanity` was **not** needed — `sanity/node_modules` was already present in this worktree.

## Performance

- **Duration:** ~25 min
- **Tasks:** 7/7 complete
- **Files modified:** 15 (1 created, 14 modified)

## Accomplishments

- New `sanity/schemas/siteProductionRelease.ts` internal marker document, registered in all three required places (`schemas/index.ts`, `INTERNAL_SYSTEM_DOCUMENT_TYPES`, `structure.ts`'s desk exclusion list) so it never leaks into Studio's create-new menu, omnisearch, or desk tree.
- `dashboardLogic.ts` refactored so `buildDeploymentMarkerActions` (content-publish marker) and the new `buildProductionReleaseMarkerActions` (production-release marker) share one `markerActions()` implementation, widened by a `MarkerDocumentId` union. `triggerProductionRelease(client)` fetches the marker, builds its actions, and commits them in a single Actions-API call tagged `editorial.production-release` — distinct from `editorial.publish-all`.
- `deployment.ts` now tracks either GitHub Actions workflow file via an optional parameter (defaulting to staging), and `deploymentState` accepts an optional `target: 'staging' | 'production'` that resolves the correct label (`Staging à jour` / `Production à jour`), site URL, and workflow Actions-page URL — replacing the old ambiguous `Site à jour`.
- New pure, exported `releasePipelineState()` computing the sketch-016 Variant C 3-segment bar plus a single dynamic promote row, covering all eleven documented behaviors (content/staging/production segment mapping, staleness-driven re-enable, busy/failed/done precedence, and the trigger-error override).
- `EditorialDashboard.tsx`/`.css` render the pipeline bar, labels, and promote row inside a named `aria-label="Progression de la mise en ligne"` section, driven entirely by `releasePipelineState` with no branching copy in the component. The click handler calls only `triggerProductionRelease` — never the content-publish controller. The active-segment pulse animation is disabled under `prefers-reduced-motion`.
- `.github/workflows/deploy-ovh.yml` now triggers only on `workflow_dispatch` and the dedicated `production-deploy-requested` event (TDD: RED commit then GREEN commit) — `sanity-content-published` no longer appears anywhere in its functional body, only in the rewritten header comment's historical narration, and `deploy.yml` (staging) is untouched.
- README.md, `sanity/README.md`, and `05-CONTEXT.md` updated to describe the corrected mechanism, including the sixth one-time-setup item (the human-only Sanity webhook) and a further-dated D-01 refinement note that leaves D-01's original text and its first supersession bullet byte-identical.

## Task Commits

Each task was committed atomically:

1. **Task 1: siteProductionRelease schema + registration** - `8418cc6` (feat)
2. **Task 2: standalone production-release marker actions** - `17ebc0b` (feat)
3. **Task 3: parameterize deployment tracking by workflow/target** - `ec978c7` (feat)
4. **Task 4: releasePipelineState state machine** - `3925838` (feat)
5. **Task 5: render Variant C pipeline bar and promote row** - `5429372` (feat)
6. **Task 6a: RED — expect deploy-ovh.yml to trigger on the new event** - `570fdfc` (test)
6. **Task 6b: GREEN — re-point deploy-ovh.yml** - `9603a0d` (feat)
7. **Task 7: docs for the editor-gated production release path** - `d5b41ae` (docs)

_Note: Task 6 is TDD (RED then GREEN, committed separately per plan instructions)._

## Files Created/Modified

- `sanity/schemas/siteProductionRelease.ts` - New internal production-release marker document schema (mirrors `siteDeployment.ts`)
- `sanity/schemas/index.ts` - Registers the new schema type
- `sanity/schemas/structure.ts` - Excludes it from the generic desk document-type list
- `sanity/editorial/workflowLogic.ts` - Adds it to `INTERNAL_SYSTEM_DOCUMENT_TYPES`
- `sanity/editorial/dashboardLogic.ts` - Marker-action generalization, `buildProductionReleaseMarkerActions`, `triggerProductionRelease`, exported `publicationError`, `PRODUCTION_RELEASE_MARKER_QUERY`
- `sanity/editorial/deployment.ts` - Workflow-file/target parameterization, `releasePipelineState` state machine
- `sanity/editorial/EditorialDashboard.tsx` - Production polling effect, marker-seeding effect, pipeline bar/promote row markup, click handler
- `sanity/editorial/EditorialDashboard.css` - Pipeline bar/label/promote-row styles, reduced-motion guard
- `.github/workflows/deploy-ovh.yml` - Re-pointed trigger + rewritten header comment
- `tests/unit/workflow-logic.test.ts`, `tests/unit/dashboard-logic.test.ts`, `tests/unit/deployment.test.ts`, `tests/unit/deploy-ovh-workflow.test.ts` - New/updated coverage for all of the above
- `README.md`, `sanity/README.md` - Corrected production-deploy documentation, human-only webhook setup
- `.planning/phases/05-launch-domain-cutover/05-CONTEXT.md` - Appended D-01 refinement sub-bullet (addition only)

## Decisions Made

- Kept `buildDeploymentMarkerActions`'s existing signature/output byte-identical for both the absent- and present-marker cases, verified against its pre-existing tests, so staging content-publish behavior is untouched.
- Chose to make exactly two `deployment.ts` prose details (`deploying` and `failed`) target-aware for production, leaving every staging-facing string byte-identical to avoid any copy drift on the already-shipped staging path.
- Wrote fresh (non-sketch-modeled) copy for the two failure-row cases (staging failed, production failed) in the same register as the sketch's other Variant C strings, since the sketch's demo states never modeled a failure row distinctly from the pending row.

## Deviations from Plan

None - plan executed exactly as written. All grep/test/lint/build verification commands specified in each task's `<verify>` block passed on the first attempt except one test-authoring mistake (a shared `Response` object being read twice across two `fetch` mock calls in a new deployment.test.ts test), which was fixed inline within Task 3's commit before it was ever committed — not a deviation from the plan's design, just a test-authoring fix.

## Issues Encountered

None beyond the inline test fix noted above.

## User Setup Required

**External service requires manual configuration — see plan frontmatter `user_setup` and README.md item 6 under "Production deploy: one-time setup".**

- Create a second Sanity Project Webhook (`production-deploy-requested`) in `https://www.sanity.io/manage`, filtering on `_type == "siteProductionRelease"`, POSTing to `https://api.github.com/repos/florianlepont/ajs-website/dispatches` with `{"event_type": "production-deploy-requested"}` and a bearer `Authorization` header.
- Provision a fine-grained GitHub PAT scoped to `florianlepont/ajs-website` with `Contents: Read and write` and an expiry, entered ONLY into that webhook's header config in Sanity's dashboard — never into this repository.
- Do NOT edit the existing `sanity-content-published` webhook; mirror its shape for the new one instead.

## Next Phase Readiness

- The feature is fully built and tested but INERT in production until the webhook above is configured by a human with Sanity dashboard + GitHub PAT access.
- No blockers for the concurrent Phase 05 launch-verification effort in this worktree — only `05-CONTEXT.md` was touched, and that change is additive (a new dated sub-bullet under D-01), verified via `git diff` and `git status --short` before this summary was written.

---
*Task: quick-260811-w8d*
*Completed: 2026-08-11*

## Self-Check: PASSED

All 17 files listed in "Files Created/Modified" (plus this SUMMARY.md) verified present on disk. All 8 task commit hashes verified present in `git log`.
