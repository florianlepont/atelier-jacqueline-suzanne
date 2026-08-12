---
phase: quick-260812-ncd
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - sanity/editorial/dashboardLogic.ts
  - tests/unit/dashboard-logic.test.ts
autonomous: true
requirements:
  - QUICK-260812-ncd
must_haves:
  truths:
    - "The create action emitted by `markerActions()` when no marker document exists yet carries `_id` inside its `attributes` object, set to the same marker id already used for `_type` and `publishedId` — so the Sanity Actions API stops rejecting the call with « action index 1: missing required field 'attributes._id' »."
    - "Both entry points are fixed by the single change, because `buildDeploymentMarkerActions` and `buildProductionReleaseMarkerActions` both delegate to `markerActions()` — the fix is made once, in the shared helper, not duplicated per caller."
    - "The `CreateDeploymentMarkerAction` interface declares the new `_id` field, so the object literal type-checks instead of tripping TypeScript's excess-property check."
    - "Every existing test that pinned the old (buggy) create-branch `attributes` shape now expects `_id` present with the literal id for the marker that test exercises — 5 assertion sites total. `buildSequence`, `lastTriggeredAt` and `_type` expectations are unchanged."
    - "The existing-marker edit/publish branch is byte-identical: it has no `attributes` field, was never affected, and is not touched."
    - "`npm run test:unit`, `npm run typecheck`, `npm --prefix sanity run lint` and `npm --prefix sanity run build` all pass."
    - "`git diff --name-only` shows exactly two changed files: `sanity/editorial/dashboardLogic.ts` and `tests/unit/dashboard-logic.test.ts`. `EditorialDashboard.tsx`, `deployment.ts`, `releasePipelineState()`, `resolvePromoteRow()` and `.github/workflows/` are provably untouched."
    - "The Studio is redeployed, and the user has confirmed BEHAVIOURALLY — by clicking « Mettre le site à jour » on the live Studio and watching it succeed — that the real error is gone. A green test suite alone does not close this task."
  artifacts:
    - sanity/editorial/dashboardLogic.ts
    - tests/unit/dashboard-logic.test.ts
  key_links:
    - "WHY this is urgent and NOT from tonight's UI work: the bug is latent from an earlier phase. It only fires on the first-ever publish for a given marker (the `if (!marker)` create branch). Every prior local/unit exercise ran against that same buggy shape, and the tests asserted it, so nothing caught it until a real end-to-end click hit the live Actions API. Romane cannot publish at all right now."
    - "WHY `_id` and not something else: the Sanity Actions API requires `attributes._id` on `sanity.action.document.create`. The correct value is already sitting in the same action object twice — as `_type: markerId` and as `publishedId: markerId` — because these marker documents are singletons whose document id equals their type name (`siteDeployment`, `siteProductionRelease`). So the value is `markerId`, not a generated id."
    - "The tests are not merely broken by this fix, they actively PINNED the bug — one is literally named « keeps buildDeploymentMarkerActions byte-identical for the absent-marker case ». Updating them is part of the fix, not collateral. Its `toEqual` is exact-match, so a missing `_id` in the expectation fails just as loudly as a wrong one."
    - "5 assertion sites carry the create-branch `attributes` object in tests/unit/dashboard-logic.test.ts. As of this plan they are at lines 270, 328, 395, 437 and 522. Three exercise `siteDeployment` (270, 395, 522), two exercise `siteProductionRelease` (328, 437). Use the id matching each site's marker — do not paste one literal into all five. Line numbers shift as you edit; grep `attributes:` in that file to re-locate rather than trusting the numbers after the first edit."
    - "`CreateDeploymentMarkerAction` (dashboardLogic.ts ~lines 84-93) types the `attributes` object. Adding `_id: markerId` to the literal without adding `_id: MarkerDocumentId` to that interface is a TypeScript error, and the interface sits ~380 lines above the code being changed — easy to miss."
    - "`sanity/` uses Prettier with no semicolons and single quotes (`printWidth: 100`); `tests/unit/` uses semicolons. Match the file you are editing. Only `npm --prefix sanity run lint` checks the former."
    - "The root tsconfig excludes `sanity/`, so `npm run typecheck` (astro check) does NOT type-check dashboardLogic.ts, and `sanity build` transpiles via esbuild without type-checking either. The interface/literal mismatch above would therefore slip past both build gates — the unit tests are the real proof here."
---

<objective>
A real, live publish just failed with « action index 1: missing required field 'attributes._id' ». `markerActions()` builds its `sanity.action.document.create` action with `attributes: {_type, buildSequence, lastTriggeredAt}` and no `_id`. The Sanity Actions API requires it. This blocks Romane from publishing anything.

Add `_id: markerId` to that attributes object, widen the interface to match, and update the five tests that pinned the buggy shape.

Purpose: unblock publishing. Nothing else.

Output: a one-field source fix in the shared helper, a one-line interface addition, five updated test expectations, green gates, a redeployed Studio, and a behavioural confirmation from the user on the live Studio.
</objective>

<execution_context>
@/Users/florian/Projects/ajs-website/.claude/gsd-core/workflows/execute-plan.md
@/Users/florian/Projects/ajs-website/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@sanity/editorial/dashboardLogic.ts
@tests/unit/dashboard-logic.test.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Emit the marker id inside create-action attributes, and unpin the tests</name>
  <files>sanity/editorial/dashboardLogic.ts, tests/unit/dashboard-logic.test.ts</files>
  <action>
In `sanity/editorial/dashboardLogic.ts`, two edits and no others:

1. In the `CreateDeploymentMarkerAction` interface (~lines 84-93), add a field to its inline `attributes` object type declaring the document id, typed `MarkerDocumentId`, placed directly above the existing `_type` line.

2. In `markerActions()` (~lines 461-483), inside the `if (!marker)` branch's create action, add the matching field to the `attributes` object literal, set to the `markerId` parameter, placed directly above the existing `_type: markerId` line. Leave `buildSequence`, `lastTriggeredAt`, `ifExists` and `publishedId` exactly as they are.

Do NOT touch the second half of `markerActions()` (the existing-marker edit + publish branch below the validity guard). It emits a patch, not attributes, and is unaffected.

Do NOT touch `buildDeploymentMarkerActions` or `buildProductionReleaseMarkerActions` themselves — both already delegate to `markerActions()`, so the single helper edit covers both.

Follow Sanity's Prettier style in this file: no semicolons, single quotes.

In `tests/unit/dashboard-logic.test.ts`, update the five `attributes:` expectation objects (as of now at lines 270, 328, 395, 437, 522) to include the same new field, using the literal id matching the marker each site exercises — the deployment marker id for the three deployment sites, the production-release marker id for the two production sites. Match each site by reading which `publishedId` sits immediately above it rather than by line number, since numbers shift after the first edit. Change nothing else in those objects: `_type`, `buildSequence` and `lastTriggeredAt` expectations stay exactly as written (including the `expect.any(String)` timestamp at the publication-controller site). Use semicolons and single quotes to match this file.

Do not touch `EditorialDashboard.tsx`, `deployment.ts`, `releasePipelineState()`, `resolvePromoteRow()`, or anything under `.github/workflows/`.
  </action>
  <verify>
    <automated>npm run test:unit -- tests/unit/dashboard-logic.test.ts && npm run typecheck && npm --prefix sanity run lint && npm --prefix sanity run build && test "$(grep -c '_id: markerId' sanity/editorial/dashboardLogic.ts)" = "1" && test "$(git diff --name-only | sort | tr '\n' ' ')" = "sanity/editorial/dashboardLogic.ts tests/unit/dashboard-logic.test.ts " && test "$(git diff --name-only -- sanity/editorial/EditorialDashboard.tsx sanity/editorial/deployment.ts .github/workflows | wc -l | tr -d ' ')" = "0"</automated>
  </verify>
  <done>The create branch emits `_id` alongside `_type` in `attributes`; the interface declares it; all five test expectations assert it with the correct per-marker literal; all four gates pass; `git diff --name-only` lists exactly the two intended files and no forbidden path appears in the diff. Run this verify command on the UNCOMMITTED working tree, before committing — the worktree started clean on `main`, so the two diff assertions only read correctly pre-commit.</done>
</task>

<task type="auto">
  <name>Task 2: Redeploy the Studio and get live behavioural confirmation</name>
  <files>(no files modified — deploy + confirmation only)</files>
  <action>
Commit Task 1's change first, then run `npm run deploy --prefix sanity` to push the fixed Studio live. This deploy is expected and routine — do not treat it as a gate or ask permission for it.

Then ask the user directly and explicitly, in the final message, to go to the live Studio right now and click « Mettre le site à jour » on a real pending draft, and to report back whether it succeeds or whether any error text appears.

State plainly WHY the ask is required and cannot be substituted: there is no authenticated browser session in this environment, so nothing here can reach the live Actions API. The unit tests prove the action payload now contains `_id`; only a real click proves the live API accepts it. A visual check of the Studio is NOT sufficient — the failure was an API rejection, so the confirmation must be behavioural: the publish must actually complete.

Ask for the exact error text if it still fails, since a different message would mean a second, distinct defect rather than an incomplete fix.
  </action>
  <verify>
    <automated>npm --prefix sanity run build</automated>
    <human-check>User clicks « Mettre le site à jour » on the live Studio on a real pending draft and reports that the publish completes with no « missing required field » error.</human-check>
  </verify>
  <done>Studio redeployed from the fixed source, and the user has reported back on a real live click — either confirming the publish now succeeds, or supplying the exact remaining error text.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Studio client → Sanity Actions API | Authenticated editor request mutating published content; payload shape is validated server-side, which is exactly what rejected the malformed create action. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-ncd-01 | Tampering | `markerActions()` create branch | low | mitigate | `_id` is set from the `markerId` parameter, whose type is the two-literal `MarkerDocumentId` union — no caller-supplied or user-supplied string can reach it, so the fix cannot be used to write to an arbitrary document id. |
| T-ncd-02 | Denial of Service | first-ever marker publish | low | accept | The `ifExists: 'fail'` guard is retained unchanged, so a concurrent double-create still fails loudly rather than silently forking marker state. No new failure mode introduced. |
</threat_model>

<verification>
- `npm run test:unit` — full suite green, not just the dashboard-logic file.
- `npm run typecheck`, `npm --prefix sanity run lint`, `npm --prefix sanity run build` — all green.
- `git diff --stat` — exactly two files.
- Live click on the deployed Studio publishes successfully.
</verification>

<success_criteria>
Romane can click « Mettre le site à jour » on the live Studio and have it publish, with no « missing required field 'attributes._id' » error — confirmed by an actual click, not by inference from tests.
</success_criteria>

<output>
Create `.planning/quick/260812-ncd-fix-missing-attributes-id-on-marker-docu/260812-ncd-SUMMARY.md` when done
</output>
