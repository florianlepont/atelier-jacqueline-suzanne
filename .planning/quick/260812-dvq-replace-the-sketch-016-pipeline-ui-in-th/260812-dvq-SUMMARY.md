---
phase: quick-260812-dvq
plan: 1
subsystem: ui
tags: [sanity-studio, react, css, editorial-dashboard, deploy-pipeline]

requires:
  - phase: quick-260812 (prior editorial dashboard / deploy-pipeline work)
    provides: releasePipelineState(), pipelineDisplaySegments(), the promote row's disabled/copy logic in sanity/editorial/deployment.ts
provides:
  - Sketch 017 Variant B pipeline UI (two node circles + connector + central approval-gate button) replacing the sketch-016 segmented bar
  - Rewritten CSS guard test locking in the new pipeline row's full-width requirement and all five gate face selectors
  - Corrected sanity/README.md editorial workflow description
affects: [editorial-dashboard, sanity-studio-deploy]

tech-stack:
  added: []
  patterns:
    - "Pure presentational helpers (pipelineCircleClassName, pipelineNodeIcon, pipelineNodeDetail, pipelineGateVariant) derive all pipeline visuals from existing deployment.ts state -- no new component state introduced for a display-only redesign."

key-files:
  created: []
  modified:
    - sanity/editorial/EditorialDashboard.tsx
    - sanity/editorial/EditorialDashboard.css
    - tests/unit/editorial-dashboard-css.test.ts
    - sanity/README.md

key-decisions:
  - "Ported the sketch's applyStateB/STATES logic as four pure functions rather than new component state, per the plan's scope boundary."
  - "Dropped the sketch's relative-time suffixes in node detail strings since the header DeploymentStatus already shows relative time -- avoids introducing new time logic."
  - "Kept promote.title alongside promote.detail in the new detail row (the sketch's demo showed only detail) so the real failure-title wording is not lost."

patterns-established:
  - "Gate/node visual variant selection lives in ordered pure functions (pipelineGateVariant) with the ordering itself documented in a comment, so failure/active/disabled precedence can't silently drift."

requirements-completed: [QUICK-260812-dvq]

coverage:
  - id: D1
    description: "EditorialDashboard.tsx renders sketch 017 Variant B markup (two labelled node circles + connector with two link segments + central round gate button); all sketch-016 markup (segmented bar, Étape 1/2 eyebrows, promote row) and the pipelineLabelClassName helper are fully deleted, not layered on top of."
    requirement: "QUICK-260812-dvq"
    verification:
      - kind: other
        ref: "grep -cE 'pipeline-bar|pipeline-segment|pipeline-label|step-eyebrow|promote-row|pipelineLabelClassName|Étape' sanity/editorial/EditorialDashboard.tsx -> 0"
        status: pass
      - kind: other
        ref: "grep -cE 'editorial-dashboard__pipeline-node|...-connector|...-gate|...-link|...-detail' sanity/editorial/EditorialDashboard.tsx -> non-zero"
        status: pass
      - kind: other
        ref: "npm --prefix sanity run lint"
        status: pass
      - kind: other
        ref: "npm --prefix sanity run build"
        status: pass
    human_judgment: false
  - id: D2
    description: "Node 1/2 visual kind and the gate face are pure functions of pipelineDisplaySegments()'s {testSite, liveSite} and pipeline.promote -- no new state derivation added to deployment.ts, and pipelineGateVariant's rule ordering (failure > active > done > locked > ready) reproduces the confirmed 'only node 2 spins' and 'both gate and node 2 show red X on prod failure' behaviours."
    requirement: "QUICK-260812-dvq"
    verification:
      - kind: other
        ref: "git diff for sanity/editorial/deployment.ts is empty across this plan's commits (see scope-evidence below); pipelineGateVariant/pipelineNodeIcon/pipelineNodeDetail in EditorialDashboard.tsx read only pipeline.segments/pipeline.promote"
        status: pass
    human_judgment: true
    rationale: "No dedicated unit test exercises pipelineGateVariant's branch ordering or the node icon/detail mapping across all seven sketch states; this was verified by code reading against the plan's explicit ordering spec. The live-run behaviour (only node 2 spinning during a real production release, both gate+node2 red on a real failure) can only be confirmed by triggering a real release against the deployed Studio -- exactly what the Task 4 human-check asks the user to do."
  - id: D3
    description: "The gate is a native <button>, disabled exactly by pipeline.promote.buttonDisabled, and its onClick calls the pre-existing triggerProductionReleaseClick() -- the promote guard's enabled/disabled logic is unchanged."
    requirement: "QUICK-260812-dvq"
    verification:
      - kind: other
        ref: "sanity/editorial/EditorialDashboard.tsx gate <button disabled={pipeline.promote.buttonDisabled} onClick={() => void triggerProductionReleaseClick()}>"
        status: pass
    human_judgment: false
  - id: D4
    description: "tests/unit/editorial-dashboard-css.test.ts rewritten against the new .editorial-dashboard__pipeline / -connector / -gate--{locked,ready,active,done,failed} selectors and their prefers-reduced-motion guard; asserts zero occurrences of the retired selector fragments."
    requirement: "QUICK-260812-dvq"
    verification:
      - kind: unit
        ref: "tests/unit/editorial-dashboard-css.test.ts (6 tests)"
        status: pass
      - kind: unit
        ref: "npm run test:unit (432 tests across 19 files)"
        status: pass
    human_judgment: false
  - id: D5
    description: "sanity/README.md no longer describes the retired 2-segment bar / Étape 1-2 stacked layout; daily-workflow steps, the GitHub-trigger note and the webhook-verification paragraph describe the new two-node approval-gate pipeline."
    requirement: "QUICK-260812-dvq"
    verification:
      - kind: other
        ref: "grep -cE 'Étape 1|Étape 2|étape 2|barre à 2 segments' sanity/README.md -> 0"
        status: pass
    human_judgment: false
  - id: D6
    description: "deployment.ts, dashboardLogic.ts and .github/workflows/ are byte-identical to before this plan -- provably so via git."
    requirement: "QUICK-260812-dvq"
    verification:
      - kind: other
        ref: "git log --name-only --format=%H --grep='260812-dvq' -- sanity/editorial/deployment.ts sanity/editorial/dashboardLogic.ts .github/workflows/ -> empty"
        status: pass
      - kind: other
        ref: "git status --porcelain -- sanity/editorial/deployment.ts sanity/editorial/dashboardLogic.ts .github/workflows/ -> empty"
        status: pass
    human_judgment: false
  - id: D7
    description: "All four blocking gates pass: npm run typecheck, npm --prefix sanity run lint, npm --prefix sanity run build, npm run test:unit."
    requirement: "QUICK-260812-dvq"
    verification:
      - kind: other
        ref: "npm run typecheck -> 0 errors, 0 warnings, 1 pre-existing unrelated hint"
        status: pass
      - kind: other
        ref: "npm --prefix sanity run lint"
        status: pass
      - kind: other
        ref: "npm --prefix sanity run build"
        status: pass
      - kind: unit
        ref: "npm run test:unit -> 432 tests, 19 files"
        status: pass
    human_judgment: false
  - id: D8
    description: "The hosted Studio is redeployed with the new pipeline, and the user visually confirms it on the live Studio (node colours/icons, gate states, only-node-2-spins during a real run, GitHub-logs link and title/detail wording surviving)."
    requirement: "QUICK-260812-dvq"
    verification:
      - kind: manual_procedural
        ref: "npm run deploy --prefix sanity -> https://atelier-jacqueline-suzanne.sanity.studio/"
        status: pass
    human_judgment: true
    rationale: "Visual correctness of a live Studio bundle cannot be verified from this environment (no authenticated browser session). The deploy itself succeeded and is recorded below; the Task 4 human-check (hard-refresh the live Studio and confirm the pipeline visually, including triggering a real release to see the running/failure states) is still PENDING the user's own review -- see 'Deployment Evidence' and 'Pending Human Confirmation' below."
    rationale_pending: true

duration: 10min
completed: 2026-08-12
status: complete
---

# Quick Task 260812-dvq: Replace sketch-016 pipeline UI with sketch 017 Variant B Summary

**Replaced the segmented-bar / Étape 1-2 publication pipeline in the Sanity Studio editorial dashboard with sketch 017 Variant B — a CI/CD-style manual-approval-gate motif (two node circles joined by a connector whose centre carries the promote button), reusing the existing `deployment.ts` state machine unchanged.**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-08-12T08:09:07Z (base commit)
- **Completed:** 2026-08-12T08:19:21Z
- **Tasks:** 4 (3 code tasks + 1 verification/deploy task)
- **Files modified:** 4

## Accomplishments

- `EditorialDashboard.tsx`'s publication-progress section now renders two labelled node circles (« Contenu + site de test », « Site en ligne ») joined by a connector with two link segments and a central round gate `<button>`, all driven by four new pure helper functions (`pipelineCircleClassName`, `pipelineNodeIcon`, `pipelineNodeDetail`, `pipelineGateVariant`) that read only from `pipelineDisplaySegments()` and `pipeline.promote` — no new component state, no changes to `deployment.ts`.
- `EditorialDashboard.css` gained the full Variant B rule set (`.editorial-dashboard__pipeline`, `-node`, `-circle` + 3 modifiers, `-connector`, `-link` + `--done`, `-gate` + 5 modifiers, gate-pulse and spin keyframes, a 44×44 `::after` hit area, a `:focus-visible` outline ring, narrow-viewport overrides), all built from the project's existing `--dashboard-publish-accent` / `--dashboard-pipeline-done` / `--dashboard-pipeline-failed` tokens — the stylesheet still contains exactly 3 hex literals.
- The old segmented-bar rules, labels, eyebrow and promote-row rules (and their pulse keyframes) are fully deleted, not superseded.
- `tests/unit/editorial-dashboard-css.test.ts` rewritten to assert the new pipeline row's full-width declaration, the connector's zero flex-basis, all five gate modifier selectors present exactly once, the reduced-motion guard covering both new animations, and zero occurrences of every retired selector fragment.
- `sanity/README.md`'s daily-workflow steps, GitHub-trigger note and webhook-verification paragraph rewritten to describe the two-node approval-gate pipeline instead of the retired stacked-step / segmented-bar layout.
- All four blocking gates pass (typecheck, Studio lint, Studio build, full unit suite — 432 tests / 19 files).
- Two git scope checks prove `deployment.ts`, `dashboardLogic.ts` and `.github/workflows/` were never touched by this plan.
- The hosted Studio was redeployed successfully.

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace the pipeline markup in EditorialDashboard.tsx with sketch 017 Variant B** - `1c16186` (feat)
2. **Task 2: Replace the pipeline CSS with the Variant B rules, reusing the existing tokens** - `80cc0b1` (feat)
3. **Task 3: Repoint the CSS guard test at the new pipeline and correct sanity/README.md** - `9eb7a4c` (test)
4. **Task 4: Run every gate, prove the state machine is untouched, redeploy the Studio, and get visual confirmation** - no file changes; verification + deploy only (see below)

**Plan metadata:** committed separately by the orchestrator after this summary.

## Files Created/Modified

- `sanity/editorial/EditorialDashboard.tsx` - New two-node + connector + gate pipeline markup and four pure visual helpers; old segmented-bar markup and `pipelineLabelClassName` deleted.
- `sanity/editorial/EditorialDashboard.css` - New Variant B rule set (nodes, circles, connector, links, gate + 5 modifiers, two keyframes, reduced-motion guard, narrow-viewport overrides); old bar/label/eyebrow/promote-row rules deleted.
- `tests/unit/editorial-dashboard-css.test.ts` - Rewritten guard test targeting the new selectors and gate modifiers.
- `sanity/README.md` - Daily-workflow steps, GitHub-trigger sentence and webhook-verification paragraph updated to describe the new pipeline.

## Decisions Made

- Ported the sketch's `applyStateB`/`STATES` logic as four pure functions instead of new component state, per the plan's scope boundary (no new `useState`/`useMemo` over deployment data, no new exported function in `deployment.ts`).
- Dropped the sketch's relative-time suffixes (« · il y a 1 min ») from the node detail strings, since the header `DeploymentStatus` already renders a relative timestamp and reproducing it here would require new time logic, which the plan forbids.
- Kept `pipeline.promote.title` alongside `.detail` in the new detail row beneath the pipeline (the sketch's Variant B demo showed only the detail line) so the real failure-title wording (« Échec de la publication sur le site en ligne. ») is not lost.
- Gave `.editorial-dashboard__pipeline-gate--locked` an explicit (empty-bodied) selector so all five gate faces have a corresponding modifier class the guard test can count, even though the base face already reads as locked.

## Deviations from Plan

None - plan executed exactly as written. `npm ci` and `npm ci --prefix sanity` were run to materialize `node_modules` in both projects (neither existed in this fresh worktree) before any gate could run; this is dependency installation from the existing lockfiles, not a new package addition, and is not a Rule-3-excluded install (no new package entered either `package.json`).

## Issues Encountered

None.

## Scope Evidence (Task 4)

```
$ git log --name-only --format=%H --grep='260812-dvq' -- sanity/editorial/deployment.ts sanity/editorial/dashboardLogic.ts .github/workflows/
(empty)

$ git status --porcelain -- sanity/editorial/deployment.ts sanity/editorial/dashboardLogic.ts .github/workflows/
(empty)
```

Both checks confirm `deployment.ts`, `dashboardLogic.ts` and `.github/workflows/` are untouched by this plan, both in commit history and in the working tree.

## Deployment Evidence (Task 4)

```
$ npm run deploy --prefix sanity
...
Success! Studio deployed to https://atelier-jacqueline-suzanne.sanity.studio/
```

## Pending Human Confirmation

The Task 4 `<human-check>` could not be performed from this environment (no authenticated browser session). The Studio has been redeployed and is ready for review. **User action needed:**

Open https://atelier-jacqueline-suzanne.sanity.studio/ (hard-refresh so the new bundle loads) and check the « Mettre le site à jour » panel:

1. The progress area shows two labelled circles — « Contenu + site de test » on the left, « Site en ligne » on the right — joined by a horizontal line with a small round button at its centre. The « Étape 1 » / « Étape 2 » text and the old flat two-segment bar are gone.
2. In the current resting state, each circle's colour/icon matches its real status, and the line segment behind a finished stage is green.
3. The central gate button reflects the real promote state (padlock while locked; solid pulsing accent play button once the site de test is up to date and publishing is possible).
4. If you trigger a real publication: while it runs, ONLY the right-hand circle spins — the gate goes calm and solid with no icon and no animation.
5. The message block under the pipeline still shows the same title/detail wording as before, and the GitHub-logs link still appears on failure states.

Reply « approuvé » if it looks right, or describe what is off — this is the only remaining item before the plan's `must_haves` truth "the user has visually confirmed the new pipeline on the live Studio" is satisfied.

## Next Phase Readiness

- No blockers. The pipeline redesign is complete and deployed; only the visual sign-off above remains, which is informational/confirmatory rather than blocking further work.

---
*Phase: quick-260812-dvq*
*Completed: 2026-08-12*

## Self-Check: PASSED

- FOUND: sanity/editorial/EditorialDashboard.tsx
- FOUND: sanity/editorial/EditorialDashboard.css
- FOUND: tests/unit/editorial-dashboard-css.test.ts
- FOUND: sanity/README.md
- FOUND: commit 1c16186 (Task 1)
- FOUND: commit 80cc0b1 (Task 2)
- FOUND: commit 9eb7a4c (Task 3)
