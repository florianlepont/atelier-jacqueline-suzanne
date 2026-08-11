---
phase: quick-260811-w8d
verified: 2026-08-11T23:55:00Z
status: passed
score: 11/11 must-haves verified
behavior_unverified: 0
overrides_applied: 0
re_verification: false
---

# Quick Task 260811-w8d: Build the real "Mettre en production" feature Verification Report

**Task Goal:** Build the real "Mettre en production" feature per sketch 016 (Variant C) — replace the raw auto-deploy-on-every-publish mechanism from quick task 260811-v3t with a human-checkpoint-gated Sanity Studio dashboard button, using an internal `siteProductionRelease` marker document + a (human-configured) Sanity webhook to trigger `deploy-ovh.yml` on a new `production-deploy-requested` event.

**Verified:** 2026-08-11
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths / Checklist Items

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 1 | `siteProductionRelease.ts` mirrors `siteDeployment.ts`, registered in 3 places | ✓ VERIFIED | Read both schema files — field-for-field mirror (same two fields, same validation, differing only in name/title/comment). `grep` confirms registration in `sanity/schemas/index.ts` (import + array entry), `INTERNAL_SYSTEM_DOCUMENT_TYPES` in `workflowLogic.ts` (`['siteDeployment', 'siteProductionRelease'] as const`), and `structure.ts`'s exclusion array (line 91). |
| 2 | `buildProductionReleaseMarkerActions` has no parameter for content-publish actions | ✓ VERIFIED | Read `sanity/editorial/dashboardLogic.ts` line 524: `export function buildProductionReleaseMarkerActions(marker, lastTriggeredAt): DocumentAction[]` — exactly 2 params, no `publicActions`/batch parameter anywhere in the signature. Backed by a runtime test asserting `buildProductionReleaseMarkerActions).toHaveLength(2)` (dashboard-logic.test.ts:343). |
| 3 | `deploymentState`/`getRecentDeployments` parameterized by target; "Staging à jour"/"Production à jour" real, ambiguous "Site à jour" gone from proven-current path | ✓ VERIFIED | `deployment.ts`: `deploymentTargetConfig` record keys `staging`/`production` to `currentLabel: 'Staging à jour'` / `'Production à jour'` respectively (lines 86-97), consumed in the `kind: 'current'` branch (line 274). `grep -rn "'Site à jour'"` across `sanity/editorial/` and `tests/unit/` returns zero hits except the negative-assertion string literal in the test file (`expect(subtitle).not.toContain('Site à jour')`), confirming the old ambiguous label is gone from the source and only survives as a guard in the test. |
| 4 | `releasePipelineState` exported, pure (no client/fetch calls) | ✓ VERIFIED | Read full body of `releasePipelineState` (deployment.ts:452-488) and its helpers (`deploymentSegmentKind`, `isProductionReleaseStale`, `resolvePromoteRow`) — no `fetch`, `client.`, `await`, or any I/O; pure functions over plain data only. |
| 5 | `EditorialDashboard.tsx` renders 3-segment bar + dynamic row; button calls ONLY `triggerProductionRelease` | ✓ VERIFIED | Markup at lines 696-761: `<section aria-label="Progression de la mise en ligne">` with 3 `<span>` segments + labels row + promote row. Click handler `triggerProductionReleaseClick` (lines 428-439) calls `triggerProductionRelease(client...)` and nothing else — no reference to `publicationController.publish()` in that handler, and the button's `onClick` (line 755) calls only this handler. |
| 6 | `deploy-ovh.yml` repository_dispatch types exactly `[production-deploy-requested]`; `deploy.yml` untouched | ✓ VERIFIED | Read `deploy-ovh.yml` line 36-37: `types: [production-deploy-requested]`. `deploy.yml` still has `push:` and `repository_dispatch: types: [sanity-content-published]` (grep confirmed), and `git diff` shows `deploy.yml` was not part of this task's changed-file set. |
| 7 | 4 new/updated test files exist and pass | ✓ VERIFIED | All 4 files present (`tests/unit/workflow-logic.test.ts`, `dashboard-logic.test.ts`, `deployment.test.ts`, `deploy-ovh-workflow.test.ts`) with genuine new assertions read directly (not just counted) — production-release marker actions describe block, release-pipeline-state describe block, disambiguated-label assertions, comment-stripped event-name assertion. `npm run test:unit` → 18 files, 421 tests, all passed. |
| 8 | `npm run typecheck` and `npm --prefix sanity run lint && npm --prefix sanity run build` clean | ✓ VERIFIED | Ran both myself: typecheck → "0 errors, 0 warnings, 1 hint" (the 1 hint is an unrelated pre-existing deprecation notice in an e2e spec file, no error). Sanity lint → clean (no output/no errors). Sanity build → "Build Sanity Studio ✔ (306ms)" — clean. |
| 9 | `05-CONTEXT.md`: additive-only diff, no other file touched under phase-05 dir | ✓ VERIFIED | `git diff` of `05-CONTEXT.md` shows D-01's original line 17 and the first 2026-08-11 supersession bullet (line 18) both present byte-identical, with only a new indented sub-bullet ("D-01 refined again (2026-08-11, same day)") appended beneath. `git status --short .planning/phases/05-launch-domain-cutover/` returns empty (no modified/untracked files) at verification time. |
| 10 | README.md / sanity/README.md document the corrected mechanism; no secret literal in diff | ✓ VERIFIED | `README.md` "Deployments" table corrected (line 60), new webhook one-time-setup item 6 with dashboard URL, filter, body, headers documented (lines 89-94) — states the PAT lives only in Sanity's dashboard, never committed. `sanity/README.md` uses "Staging à jour" and describes the 3-segment bar/button (lines 63, 73+, 131, 134, 154, 159). Grepped the full task's commit range diff for bearer-token/PAT-shaped literal patterns — zero hits beyond the placeholder `<PAT>` token in prose. |
| 11 | No new npm/pip/cargo dependency added | ✓ VERIFIED | `git diff` (base commit before this task → final commit) on `package.json`, `package-lock.json`, `sanity/package.json`, `sanity/package-lock.json` is empty — no dependency changed. |

**Score:** 11/11 items verified (0 present-but-behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | ----------- | ------ | ------- |
| `sanity/schemas/siteProductionRelease.ts` | Mirrors `siteDeployment.ts` | ✓ VERIFIED | Exists, field-for-field mirror, correct name/title/comment differences |
| `sanity/editorial/deployment.ts` | Target-parameterized state + pipeline state machine | ✓ VERIFIED | `deploymentState`, `getRecentDeployments`, `releasePipelineState` all present and wired |
| `sanity/editorial/dashboardLogic.ts` | Marker generalization + `triggerProductionRelease` | ✓ VERIFIED | `buildProductionReleaseMarkerActions`, `triggerProductionRelease`, exported `publicationError`, `PRODUCTION_RELEASE_MARKER_QUERY` all present |
| `sanity/editorial/EditorialDashboard.tsx` | Variant C UI + click handler | ✓ VERIFIED | Rendered section, click handler wired to `triggerProductionRelease` only |
| `sanity/editorial/EditorialDashboard.css` | Pipeline bar/row styles + reduced-motion guard | ✓ VERIFIED (via Sanity build success; not independently re-read line-by-line but build/lint gate proves it compiles and is used) | |
| `.github/workflows/deploy-ovh.yml` | Re-pointed trigger | ✓ VERIFIED | `types: [production-deploy-requested]` only |
| `tests/unit/deployment.test.ts`, `dashboard-logic.test.ts`, `deploy-ovh-workflow.test.ts` | New coverage | ✓ VERIFIED | All present, all pass |
| `README.md` | Corrected docs | ✓ VERIFIED | Confirmed content above |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| `Mettre en production` button `onClick` | `triggerProductionRelease()` | direct function call in `triggerProductionReleaseClick` | ✓ WIRED | Read handler body; no other Sanity Actions call reachable from this button |
| `triggerProductionRelease` | `client.action([...], {tag: 'editorial.production-release'})` | single Actions API call | ✓ WIRED | Confirmed in `dashboardLogic.ts` lines 842-855; distinct tag from `editorial.publish-all` |
| `buildProductionReleaseMarkerActions` signature | structural non-bundling guarantee | absence of `publicActions` parameter | ✓ WIRED | Confirmed by direct signature read + runtime `toHaveLength(2)` test |
| `siteProductionRelease` registration | hidden from Studio UI | 3-place registration (index.ts, workflowLogic.ts, structure.ts) | ✓ WIRED | All 3 confirmed via grep + file reads |
| `siteProductionRelease.lastTriggeredAt` | dashboard's production polling reference | marker-seeding effect (`EditorialDashboard.tsx` lines 342-360) | ✓ WIRED | Effect fetches `PRODUCTION_RELEASE_MARKER_QUERY` and seeds `productionReleaseAt` via `latestValidTimestamp`, surviving reload |
| staleness comparison (`publishedAt > productionReleaseAt`) | button re-enabling | `isProductionReleaseStale` in `releasePipelineState` | ✓ WIRED | Confirmed in `deployment.ts` lines 359-365, 471 |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| QUICK-260811-w8d | 260811-w8d-PLAN.md | Build the real Mettre en production feature | ✓ SATISFIED | All 7 tasks completed with verified evidence above |

### Anti-Patterns Found

None. No TODO/FIXME/HACK/PLACEHOLDER markers found in the modified files. No stub returns, no hardcoded empty data flowing to render, no console.log-only handlers. The click handler is fully wired to a real Actions API call.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Full unit suite passes | `npm run test:unit` | 18 files, 421 tests passed | ✓ PASS |
| Coverage thresholds hold | `npm run test:coverage` | 95.85%/91.4%/97.12%/96.62% (well above 70/65/70/70 thresholds) | ✓ PASS |
| Typecheck clean | `npm run typecheck` | 0 errors, 0 warnings | ✓ PASS |
| Sanity Studio lint clean | `npm --prefix sanity run lint` | no output, exit clean | ✓ PASS |
| Sanity Studio build clean | `npm --prefix sanity run build` | "Build Sanity Studio ✔ (306ms)" | ✓ PASS |

### Human Verification Required

None required for repo-scope correctness. However, per the task's own explicit framing (and confirmed true by design): **this feature is inert in production until a human configures the Sanity Project Webhook** described in `user_setup` / README.md item 6. That step is outside this repository's scope by design (no CLI/token available to this environment) and is correctly documented as a manual prerequisite, not a code gap. This is not a verification gap — it is the documented, intentional boundary of what a repo-only quick task can deliver.

### Gaps Summary

No gaps found. All 11 must-have checklist items were independently verified against the actual codebase (not the SUMMARY's claims): the schema mirror and 3-place registration, the structurally-guaranteed non-bundling marker builder, the target-parameterized deployment tracking with disambiguated labels, the pure `releasePipelineState` state machine, the dashboard's wired UI and click handler, the re-pointed GitHub Actions trigger, the new/updated test suites (read and run), typecheck/lint/build (run), the additive-only `05-CONTEXT.md` diff, the corrected documentation with no committed secrets, and the absence of any new dependency. All automated verification commands (`npm run test:unit`, `npm run test:coverage`, `npm run typecheck`, `npm --prefix sanity run lint`, `npm --prefix sanity run build`) were executed directly by the verifier and passed.

---

_Verified: 2026-08-11_
_Verifier: Claude (gsd-verifier)_
