---
phase: quick-260812-bj1
plan: 1
subsystem: ui
tags: [sanity-studio, react, editorial-dashboard, i18n-copy]

requires:
  - phase: quick-260811-w8d
    provides: releasePipelineState() 3-segment pipeline state machine and the promotion/publish action wiring (triggerProductionRelease, buildProductionReleaseMarkerActions)
provides:
  - Plain-French destination vocabulary ("site de test" / "site en ligne") throughout deployment.ts's user-facing strings
  - pipelineDisplaySegments() pure merge helper collapsing the 3-kind releasePipelineState() segments into the 2 the maintainer sees
  - Étape 1 / Étape 2 card layout in EditorialDashboard.tsx with a 2-segment progress bar
  - sanity/README.md and README.md rewritten to match the shipped vocabulary
affects: [editorial-dashboard, release-pipeline]

tech-stack:
  added: []
  patterns:
    - "Display-layer merge functions stay pure and separate from the underlying state machine — pipelineDisplaySegments() reads only releasePipelineState()'s segments output, never re-derives from DeploymentState"

key-files:
  created: []
  modified:
    - sanity/editorial/deployment.ts
    - sanity/editorial/EditorialDashboard.tsx
    - sanity/editorial/EditorialDashboard.css
    - tests/unit/deployment.test.ts
    - sanity/README.md
    - README.md

key-decisions:
  - "Merged testSite segment precedence: failed wins over active, which wins over done-only-when-both-done, matching the plan's explicit precedence table"
  - "Kept the human-check (visual confirmation of the deployed Studio) as a documented follow-up rather than a blocking checkpoint, since Task 3 is type=\"auto\" and no browser-automation tool was available in this session to authenticate against the hosted Studio"

patterns-established:
  - "Pattern: display-mapping functions live next to the state machine they merge, with a head comment explaining why the collapse is the ONLY place it happens"

requirements-completed: [QUICK-260812-bj1]

coverage:
  - id: D1
    description: "deployment.ts: staging/production renamed to site de test / site en ligne in all user-facing strings; pipelineDisplaySegments() pure merge helper added"
    requirement: "QUICK-260812-bj1"
    verification:
      - kind: unit
        ref: "tests/unit/deployment.test.ts (48 tests, includes new 'pipeline display segments' describe block)"
        status: pass
      - kind: other
        ref: "grep -Fc 'Publier sur le site en ligne' sanity/editorial/deployment.ts == 3; grep -Fc 'export function pipelineDisplaySegments' == 1; 'Staging à jour'/'Production à jour' occurrences == 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "EditorialDashboard.tsx/css: Étape 1 / Étape 2 eyebrow markers, 2-segment bar driven by pipelineDisplaySegments(), no JSX reads pipeline.segments.* directly"
    requirement: "QUICK-260812-bj1"
    verification:
      - kind: other
        ref: "grep checks in Task 2 verify block: pipeline-segment count 2, Étape 1/2 counts 1 each, displaySegments. count 4, pipeline.segments. count 0, step-eyebrow CSS count 1"
        status: pass
      - kind: other
        ref: "npm --prefix sanity run lint && npm --prefix sanity run build"
        status: pass
    human_judgment: false
  - id: D3
    description: "sanity/README.md and README.md rewritten to describe the two-step journey with the shipped vocabulary; .github/workflows/ and its guard test left untouched"
    requirement: "QUICK-260812-bj1"
    verification:
      - kind: other
        ref: "grep -Fc 'Publier sur le site en ligne' sanity/README.md == 2; 'Site de test à jour' == 3; 'Site en ligne' == 4; git diff --stat .github/workflows/ tests/unit/deploy-ovh-workflow.test.ts == empty"
        status: pass
    human_judgment: false
  - id: D4
    description: "All four gates (test:unit, typecheck, sanity lint, sanity build) pass and the Studio is redeployed with the new dashboard"
    requirement: "QUICK-260812-bj1"
    verification:
      - kind: unit
        ref: "npm run test:unit — 426 tests passed, 18 files"
        status: pass
      - kind: other
        ref: "npm run typecheck — 0 errors, 0 warnings; npm --prefix sanity run lint; npm --prefix sanity run build; npm run deploy --prefix sanity — 'Success! Studio deployed to https://atelier-jacqueline-suzanne.sanity.studio/'"
        status: pass
      - kind: manual_procedural
        ref: "Task 3 human-check: open the deployed Studio and confirm the two-step card, 2-segment bar, and renamed labels render as expected"
        status: unknown
    human_judgment: true
    rationale: "No browser-automation tool with an authenticated Sanity session was available in this execution session, so the visual confirmation against the hosted, login-gated Studio could not be automated here. The deploy itself succeeded and all code/text-level checks pass; a human should do a final look at the live dashboard."

duration: 12min
completed: 2026-08-12
status: complete
---

# Quick Task 260812-bj1: Dashboard vocabulary and Étape 1/2 layout rework Summary

**Renamed the Studio dashboard's staging/production jargon to plain French ("site de test" / "site en ligne"), added a pure `pipelineDisplaySegments()` merge collapsing the 3-stage pipeline into 2 visible segments, numbered the two actions Étape 1/Étape 2, and redeployed the Studio.**

## Performance

- **Duration:** ~12 min (task commits 08:31–08:37 UTC+2)
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- `deployment.ts`'s every user-facing string now says "site de test" / "site en ligne" instead of staging/production; the underlying `DeploymentTarget` union, workflow file constants, and URLs are untouched
- New pure `pipelineDisplaySegments()` merges the 3-kind `releasePipelineState().segments` into `{testSite, liveSite}` with failed-wins / both-done-only precedence, fully unit-tested
- Dashboard renders an "Étape 1" eyebrow above "Mettre le site à jour" and an "Étape 2" eyebrow above the promotion row (always visible, even dimmed); the progress bar now shows exactly 2 segments labelled "Contenu + site de test" / "Site en ligne"
- `sanity/README.md` and root `README.md` rewritten to match the shipped vocabulary; `.github/workflows/` and its guard test left untouched as required
- All four gates (`test:unit`, `typecheck`, Studio `lint`, Studio `build`) pass; the Studio was redeployed to `https://atelier-jacqueline-suzanne.sanity.studio/`

## Task Commits

Each task was committed atomically:

1. **Task 1: Plain-French destination vocabulary + pure 2-segment display mapping in deployment.ts** - `5550bb5` (feat)
2. **Task 2: Étape 1 / Étape 2 card layout with a 2-segment bar** - `6e5897b` (feat)
3. **Task 3: Align the maintainer guides, run all gates, redeploy the Studio** - `79b7891` (docs)

_No plan-metadata commit from this executor — the orchestrator handles the docs commit (STATE.md/SUMMARY.md) separately per this task's constraints._

## Files Created/Modified
- `sanity/editorial/deployment.ts` - renamed `deploymentTargetConfig` labels, the three `target === 'production'` detail strings, and every `resolvePromoteRow` branch; added `pipelineDisplaySegments()` + `ReleasePipelineDisplaySegments`
- `tests/unit/deployment.test.ts` - added `describe('pipeline display segments')` (5 tests); repaired renamed-string assertions in the subtitle/target/pipeline describe blocks
- `sanity/editorial/EditorialDashboard.tsx` - imported `pipelineDisplaySegments`, derived `displaySegments`, added the two step eyebrows, collapsed the bar/labels to 2 segments, updated the section `aria-label`
- `sanity/editorial/EditorialDashboard.css` - added `.editorial-dashboard__step-eyebrow`
- `sanity/README.md` - rewrote the daily-workflow, freshness-status, dépannage, and GitHub-trigger-verification sections
- `README.md` - updated the three places quoting the Studio button name

## Decisions Made
- Merge precedence for the collapsed `testSite` segment: `failed` beats `active` beats `done`-only-when-both-inputs-are-`done`, per the plan's explicit table — implemented as nested ternaries rather than a lookup table, to keep the function trivially readable
- Documented the human-check (visual confirmation of the live Studio) as an open follow-up rather than blocking on it, since no authenticated browser-automation path was available in this session — see "Issues Encountered" below

## Deviations from Plan

None - plan executed exactly as written. All greps, unit tests, typecheck, Studio lint/build, and the deploy itself matched the plan's `<verify>` blocks on the first pass after the vocabulary edits (a few test-file line targets needed touch-ups beyond the plan's approximate line ranges, which is expected "repair the existing assertions" work already specified in Task 1's `<action>`).

## Issues Encountered
- The plan's Task 3 `<verify>` includes a `<human-check>` step requiring visual confirmation of the deployed, authenticated Sanity Studio dashboard. This execution session had no browser-automation tool with an active Sanity login, so that specific check could not be completed here. Everything else in Task 3 (all four gates, all README greps, the workflow-diff guard, and the deploy itself reporting success) completed and passed. Recommend a human opens `https://atelier-jacqueline-suzanne.sanity.studio/` once to confirm the card layout, eyebrows, and 2-segment bar render as intended.

## User Setup Required

None - no external service configuration required. The Studio was already deployed by this task (`npm run deploy --prefix sanity`).

## Next Phase Readiness
- The dashboard's release-pipeline mechanism (from quick task 260811-w8d) is unchanged in behavior; only its vocabulary and hierarchy changed, so no follow-up work is required to keep the pipeline functioning.
- Follow-up: a human should do the one visual pass over the live Studio described in "Issues Encountered" above.

---
*Phase: quick-260812-bj1*
*Completed: 2026-08-12*

## Self-Check: PASSED

All 7 files_modified paths confirmed present on disk; all 3 task commits (`5550bb5`, `6e5897b`, `79b7891`) confirmed present in `git log --oneline --all`.
