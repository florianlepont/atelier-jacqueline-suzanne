---
phase: quick-260812-nqg
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - sanity/editorial/dashboardLogic.ts
  - tests/unit/dashboard-logic.test.ts
autonomous: true
requirements:
  - QUICK-260812-nqg
must_haves:
  truths:
    - "The create action emitted by `markerActions()` in its `if (!marker)` branch carries a `drafts.`-prefixed document id in `attributes._id` — so the Sanity Actions API stops rejecting the call with « action index 1: \"attributes._id\" must be prefixed with either \"drafts.\" or \"versions.{bundleId}\" »."
    - "Only `attributes._id` gains the prefix. `attributes._type`, `publishedId` and `ifExists` in that same action object are byte-identical to before — the marker's TYPE name and its PUBLISHED id are both still bare (`siteDeployment` / `siteProductionRelease`)."
    - "Both entry points are fixed by the single change, because `buildDeploymentMarkerActions` and `buildProductionReleaseMarkerActions` both delegate to `markerActions()`."
    - "`CreateDeploymentMarkerAction.attributes._id` is re-typed to the prefixed template-literal form, matching how `draftId` is already typed on the sibling `EditDeploymentMarkerAction` and `PublishDeploymentMarkerAction` interfaces in the same file."
    - "The 5 create-branch assertion sites in tests/unit/dashboard-logic.test.ts expect the prefixed id. The 7 OTHER bare-id occurrences in that file — `DeploymentMarker` fixtures fed IN to the functions and mock resolved values — are unchanged, because a stored marker document's `_id` really is bare."
    - "The existing-marker edit/publish branch is untouched: it has no `attributes` field and already used the prefixed `draftId` correctly."
    - "`npm run test:unit`, `npm run typecheck`, `npm --prefix sanity run lint` and `npm --prefix sanity run build` all pass."
    - "`git diff --name-only` shows exactly two changed files. `EditorialDashboard.tsx`, `deployment.ts`, `releasePipelineState()`, `resolvePromoteRow()` and `.github/workflows/` are provably untouched."
    - "The Studio is redeployed AND the user has confirmed behaviourally — by clicking « Mettre le site à jour » on the live Studio and watching it succeed — that the error is gone. A green test suite alone does not close this task."
  artifacts:
    - sanity/editorial/dashboardLogic.ts
    - tests/unit/dashboard-logic.test.ts
  key_links:
    - "WHY a second fix in a row: quick task 260812-ncd correctly diagnosed that `attributes._id` was MISSING and added it — but added it bare. The Actions API has a second, separate rule: a `sanity.action.document.create` targets the DRAFT version, so its `attributes._id` must carry the `drafts.` prefix. First error was « missing required field », this one is « must be prefixed » — different validations, same field, hit in sequence."
    - "The correct pattern is ALREADY in the same array, one element later: the `sanity.action.document.publish` action that immediately follows uses the prefixed draft id and has never errored. This fix makes the create action's id consistent with the publish action's `draftId` — the two now refer to the same draft document, which is the whole point."
    - "DO NOT prefix `_type`. It sits on the adjacent line inside the same `attributes` object and reads almost identically, which makes it the obvious mis-edit. `_type` names a Sanity schema type; there is no such type as a `drafts.`-prefixed one, and prefixing it would trade this error for a schema-validation error."
    - "DO NOT prefix `publishedId` (in the create action or anywhere else). It names the eventual published document, which is bare by definition. The prefixed/bare split within one action object is intentional, not an inconsistency to clean up."
    - "5 create-branch assertion sites carry the `attributes` object in tests/unit/dashboard-logic.test.ts. As of this plan they are at lines 271, 330, 398, 441 and 527 — three exercise `siteDeployment` (271, 398, 527), two exercise `siteProductionRelease` (330, 441). Each is recognisable by sitting directly above a `_type:` line inside `attributes: {`. Line numbers shift as you edit; re-locate by grep rather than trusting them after the first edit."
    - "The 7 occurrences that must stay bare are recognisable by shape: they are object literals that ALSO carry `_rev` and `buildSequence` (marker fixtures at ~289, ~351, ~377-380, ~563), not `_type`. If the literal you are looking at has `_rev` next to it, leave it alone."
---

<objective>
Prefix the marker create action's `attributes._id` with `drafts.`, unblocking Romane's publish.

Purpose: The live Sanity Actions API rejects the publish flow with « action index 1: "attributes._id" must be prefixed with either "drafts." or "versions.{bundleId}" ». This is a one-token fix to a field added hours ago by quick task 260812-ncd, plus its type and the 5 tests that pin it.
Output: Corrected `markerActions()` create branch, corrected interface, 5 updated assertions, redeployed Studio, and a live-click confirmation from the user.
</objective>

<execution_context>
@/Users/florian/Projects/ajs-website/.claude/gsd-core/workflows/execute-plan.md
@/Users/florian/Projects/ajs-website/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

@sanity/editorial/dashboardLogic.ts
@tests/unit/dashboard-logic.test.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Prefix the create action's attributes._id and realign its type and tests</name>
  <files>sanity/editorial/dashboardLogic.ts, tests/unit/dashboard-logic.test.ts</files>
  <action>
Three edits, all mechanical.

(1) In `sanity/editorial/dashboardLogic.ts`, in the `markerActions()` helper's `if (!marker)` branch (~line 467-479), inside the `sanity.action.document.create` object's `attributes` object: change the `_id` value from the bare `markerId` identifier to a template literal that prepends the string `drafts.` to `markerId` — i.e. exactly the expression already used as the `draftId` value on the `sanity.action.document.publish` action two lines below, in the same returned array. Copy that expression verbatim.

Leave the sibling `_type` line alone: it must keep the bare `markerId` identifier. Leave the create action's `publishedId`, `buildSequence`, `lastTriggeredAt` and `ifExists` alone. Do not touch the `if (!marker)` guard itself, the invalid-marker `throw`, or the existing-marker edit/publish return below it.

(2) In the same file, in the `CreateDeploymentMarkerAction` interface (~lines 84-93): change the `attributes._id` member's type from `MarkerDocumentId` to the prefixed template-literal type — the same `drafts.`-prefixed template-literal type over `MarkerDocumentId` that `EditDeploymentMarkerAction.draftId` and `PublishDeploymentMarkerAction.draftId` already declare a few lines below. Follow that existing convention exactly; do not widen to `string`. The interface's `publishedId` and `attributes._type` keep the bare `MarkerDocumentId` type.

(3) In `tests/unit/dashboard-logic.test.ts`, update the 5 create-branch assertion sites so each expects the prefixed id string. As of this plan they are at lines 271, 330, 398, 441 and 527, but line numbers shift once you start editing — re-locate them instead by grepping for `attributes:` and taking only the matches whose `_id` line is immediately followed by a `_type` line. Three sites exercise `siteDeployment`, two exercise `siteProductionRelease`; prefix the id each site already names, do not paste one literal into all five.

On the SAME sites, leave the `_type` expectation bare. Anywhere else in that file, leave bare ids alone — the 7 remaining occurrences are `DeploymentMarker` fixtures and mocked resolved values (recognisable because they carry `_rev` and `buildSequence` instead of `_type`), and a stored marker document's `_id` genuinely is bare.

Run the four gates below. If `typecheck` complains about the create object literal, the template-literal type in edit (2) does not match the expression in edit (1) — reconcile them rather than casting or widening to `string`.
  </action>
  <verify>
    <automated>grep -c '_id: `drafts.${markerId}`' sanity/editorial/dashboardLogic.ts | grep -qx 1 && grep -c '_type: markerId' sanity/editorial/dashboardLogic.ts | grep -qx 1 && grep -cE "_id: 'drafts\.(siteDeployment|siteProductionRelease)'" tests/unit/dashboard-logic.test.ts | grep -qx 5 && grep -cE "_id: '(siteDeployment|siteProductionRelease)'" tests/unit/dashboard-logic.test.ts | grep -qx 7 && grep -cE "_type: '(siteDeployment|siteProductionRelease)'" tests/unit/dashboard-logic.test.ts | grep -qx 5 && npm run test:unit && npm run typecheck && npm --prefix sanity run lint && npm --prefix sanity run build && test "$(git diff --name-only | sort | tr '\n' ' ')" = "sanity/editorial/dashboardLogic.ts tests/unit/dashboard-logic.test.ts "</automated>
  </verify>
  <done>
The create action's `attributes._id` is the prefixed draft id (1 occurrence); `_type` is still the bare `markerId` (1 occurrence). Tests show 5 prefixed create-branch ids, 7 untouched bare fixture ids, 5 untouched bare `_type` expectations. `test:unit`, `typecheck`, sanity `lint` and sanity `build` all exit 0. `git diff --name-only` lists exactly `sanity/editorial/dashboardLogic.ts` and `tests/unit/dashboard-logic.test.ts` — nothing else.
  </done>
</task>

<task type="auto">
  <name>Task 2: Redeploy the live Studio and ask the user to retry the publish click now</name>
  <files>(no source changes — deploy only)</files>
  <action>
Commit Task 1's change, then redeploy the Studio so the fix reaches the live instance Romane uses: run `npm run deploy --prefix sanity`.

The unit tests exercise the same object shape the API rejected, so they cannot by themselves prove the API now accepts it — only a real click can. As soon as the deploy reports success, tell the user directly and immediately, in plain terms:

- the `drafts.` prefix fix is live on the Studio;
- ask them to hard-refresh the Studio and click « Mettre le site à jour » right now;
- ask them to report back either that it succeeded, or the verbatim new error text if it did not.

Do not open a blocking checkpoint and do not wait idly — state the ask and stop. If a third error comes back, it will name a different field or a different validation rule; capture it verbatim for the next fix rather than guessing.
  </action>
  <verify>
    <automated>npm run deploy --prefix sanity</automated>
    <human-check>User hard-refreshes the live Studio, clicks « Mettre le site à jour », and reports whether it succeeds or returns a new verbatim error.</human-check>
  </verify>
  <done>Task 1's change is committed, `npm run deploy --prefix sanity` exits 0, and the user has been explicitly asked — in the final message — to retry the real publish click immediately and report the outcome.</done>
</task>

</tasks>

<verification>
- `grep -c '_id: `drafts.${markerId}`' sanity/editorial/dashboardLogic.ts` returns 1
- `grep -c '_type: markerId' sanity/editorial/dashboardLogic.ts` returns 1 (type name never prefixed)
- `grep -cE "_id: 'drafts\.(siteDeployment|siteProductionRelease)'" tests/unit/dashboard-logic.test.ts` returns 5
- `grep -cE "_id: '(siteDeployment|siteProductionRelease)'" tests/unit/dashboard-logic.test.ts` returns 7 (fixtures untouched)
- `grep -cE "_type: '(siteDeployment|siteProductionRelease)'" tests/unit/dashboard-logic.test.ts` returns 5 (type names never prefixed; the unrelated `siteSettings` hit at ~line 1542 is excluded by the anchored pattern)
- `npm run test:unit`, `npm run typecheck`, `npm --prefix sanity run lint`, `npm --prefix sanity run build` all pass
- `git diff --stat` lists exactly 2 files
- `npm run deploy --prefix sanity` succeeds
- User confirms the live publish click now works
</verification>

<success_criteria>
Romane can click « Mettre le site à jour » on the live Studio and the publish completes without an Actions API validation error. Confirmed by a real click, not by tests.
</success_criteria>

<output>
Create `.planning/quick/260812-nqg-prefix-marker-create-action-s-attributes/260812-nqg-SUMMARY.md` when done.
</output>
