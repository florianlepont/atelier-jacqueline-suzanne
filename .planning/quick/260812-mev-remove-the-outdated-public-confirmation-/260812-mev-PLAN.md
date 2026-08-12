---
phase: quick-260812-mev
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - sanity/editorial/dashboardLogic.ts
  - sanity/editorial/EditorialDashboard.tsx
  - tests/unit/dashboard-logic.test.ts
  - tests/unit/editorial-dashboard-markup.test.ts
  - sanity/README.md
autonomous: true
requirements:
  - QUICK-260812-mev
must_haves:
  truths:
    - "Clicking « Mettre le site à jour » on a ready batch runs the preflight and then publishes in the SAME user gesture — there is no second card, no second button, and no second click anywhere in the content-publish path."
    - "The intermediate card that asked « Publier maintenant sur le site public ? » and claimed N contents would become « visible par tout le monde » is deleted from the component, not hidden behind a flag: its question text, its count sentence, its Annuler button and its Confirmer button are all gone from the source."
    - "The preflight blocking gate is untouched and provably still blocks: a batch containing a document with a missing « Indispensable » field publishes NOTHING — `client.action` is never called — and the controller stays in its non-published state. This is asserted by a new test that exercises the merged one-click path end to end, not by inspection."
    - "`preflightForConfirmation()` keeps its exact name, signature and body. It is the content-quality gate, and a comment above it now says so explicitly, so a future reader cannot mistake it for leftover confirmation machinery and delete it."
    - "The merged flow lives in one exported, unit-testable function, `publishAfterPreflight()`, so the one-click behaviour is provable without a React renderer (this repo has none)."
    - "A batch that changes between preflight and publish is still refused, and the editor now SEES that refusal: the `confirming`-phase error the deleted card used to be the only renderer of is surfaced inline in the panel body. A silent no-op after a click would be a new bug, not a fix."
    - "`ConfirmationChangedError` keeps its class name and its `instanceof` control flow, but its user-facing message no longer tells the editor to confirm again — there is nothing left to confirm."
    - "The single button's label is honest across the whole merged operation: it says the verification wording only while preflighting and the publication wording while the publish/tracking phases run, instead of showing the verification wording for the entire cycle."
    - "`publicationCardState()` no longer takes a dialog-state option and no longer returns a dialog-state field: the state it mirrored no longer exists, and keeping a permanently-false parameter would leave dead code behind the very thing being removed."
    - "`buildProductionReleaseMarkerActions()`, `triggerProductionRelease()`, `releasePipelineState()`'s segment-kind computation, `resolvePromoteRow()` and `.github/workflows/` are untouched — proven by `git diff --stat`, not asserted."
    - "`npm run test:unit`, `npm run typecheck`, `npm --prefix sanity run lint` and `npm --prefix sanity run build` all pass."
    - "The Studio is redeployed and the user has confirmed BEHAVIOURALLY — by clicking the button on a real pending draft and watching it publish — not merely that the card is visually gone."
  artifacts:
    - sanity/editorial/dashboardLogic.ts
    - sanity/editorial/EditorialDashboard.tsx
    - tests/unit/dashboard-logic.test.ts
    - tests/unit/editorial-dashboard-markup.test.ts
    - sanity/README.md
  key_links:
    - "WHY the card must go rather than be reworded: it was added when « Mettre le site à jour » was the one and only action that made content public. This session's pipeline redesign split that in two — the button now publishes into Sanity and rebuilds the site de test (staging) only, and the round gate button between the two pipeline nodes (« Publier sur le site en ligne ») is the real goes-public step. The card's sentence — N contenus « seront visibles par tout le monde » — is now simply false. A false warning trains the editor to click through warnings."
    - "WHY the preflight gate survives the card: they are two different gates that happened to sit in the same click. The card gated public/private (now false). `preflightForConfirmation()` gates content quality — it returns the batch ONLY when `batch.ready`, and `ready` is false whenever any row is missing an « Indispensable » field. That check is unrelated to visibility and must survive verbatim. Task 3 makes that survival a test, because a refactor that quietly drops it would look identical in the UI until the day it publishes a broken document."
    - "`controller.publish()` CANNOT be called on its own: it reads the private `confirmedBatch` that only `preflight()` sets, and throws « Aucune modification à publier. » when it is undefined (dashboardLogic.ts ~765-774). So the merged handler must still call preflight first — the merge removes the human confirmation between the two calls, it does not remove the preflight call."
    - "`publish()` re-fetches and re-fingerprints the batch (~777-795) and throws `ConfirmationChangedError` if it moved, leaving the controller in `phase: 'confirming'` WITH an error message. Until now that message rendered inside the confirmation card and nowhere else (EditorialDashboard.tsx ~677-681). Delete the card without re-homing that message and a changed-batch refusal becomes an invisible dead click. The window is small in a merged flow — two fetches apart — but the failure mode is silence, which is exactly the class of bug this dashboard has been fighting."
    - "There is NO TypeScript compile gate over `sanity/editorial/EditorialDashboard.tsx`: the root `tsconfig.json` excludes `sanity`, so `npm run typecheck` (astro check) never sees it, and `sanity build` transpiles with esbuild without type-checking. A leftover argument or stale identifier in that file will NOT be caught by any command in this plan — only by ESLint's unused-variable rules, the source-text markup tests, and careful reading. Do not lean on the build to catch a miss."
    - "There is no React testing library in this repo (unit tests run in a `node` environment and `sanity/` deps are not resolvable from the root Vitest project). Source-text assertions over `EditorialDashboard.tsx` are the established pattern for guarding this component — see `tests/unit/editorial-dashboard-markup.test.ts`, which already carries two describe blocks doing exactly that. The merged flow's logic therefore has to live in `dashboardLogic.ts` to be genuinely testable."
    - "Sanity's Prettier config (`printWidth: 100`, `singleQuote`, no semicolons) applies inside `sanity/`; the root `tests/unit/` files use semicolons and single quotes. Match the file being edited, not the other one — `npm --prefix sanity run lint` only checks the former."
    - "The existing markup test that slices from the first occurrence of the panel heading to the next `</Text>` (editorial-dashboard-markup.test.ts ~65-84) reads the header subtitle, which sits ABOVE the deleted card. It is unaffected by this work and must keep passing untouched — if it breaks, something above the card was disturbed."
---

<objective>
The « Mettre le site à jour » button currently opens an inline confirmation card asking « Publier maintenant sur le site public ? » and warning that N contents « seront visibles par tout le monde ». That premise died in this session's staging→production pipeline redesign: the button now only publishes into Sanity and rebuilds the site de test. Nothing becomes public until the separate round gate button (« Publier sur le site en ligne ») is used. The card warns about something that no longer happens.

Remove it and collapse the two-step flow — click, preflight, card, second click — into one direct action: click, preflight, publish.

The preflight is NOT the thing being removed. `preflightForConfirmation()` refuses to hand back a batch that has blocking « Indispensable » gaps, and that refusal must be exactly as strong afterwards as it is today, proven by a test that drives the new merged path.

Purpose: stop the dashboard from asserting a consequence it no longer has, and cut a real second click out of Romane's daily loop.

Output: one new exported `publishAfterPreflight()` composing the unchanged gate with the publish call, a slimmed `publicationCardState()`, a deleted confirmation card, one merged click handler, an inline home for the changed-batch message the card used to own, an honest button label, updated and extended tests including a blocked-batch proof, a README line matching the new one-step flow, green gates, a redeployed Studio and a behavioural sign-off.
</objective>

<execution_context>
@/Users/florian/Projects/ajs-website/.claude/gsd-core/workflows/execute-plan.md
@/Users/florian/Projects/ajs-website/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@sanity/editorial/dashboardLogic.ts
@sanity/editorial/EditorialDashboard.tsx
@tests/unit/dashboard-logic.test.ts
@tests/unit/editorial-dashboard-markup.test.ts
@sanity/README.md
@.planning/quick/260801-fxe-inline-publish-confirmation-instead-of-d/260801-fxe-SUMMARY.md
</context>

<scope_boundary>
Do NOT modify:

- `buildProductionReleaseMarkerActions()`, `triggerProductionRelease()`, and every production-release code path in `sanity/editorial/dashboardLogic.ts`.
- `sanity/editorial/deployment.ts` — including `releasePipelineState()`'s segment-kind computation, `resolvePromoteRow()`, `pipelineDisplaySegments()` and `pipelineGateVariant()`. This plan does not touch the pipeline UI at all.
- `.github/workflows/` — anything.
- `sanity/editorial/EditorialDashboard.css` — no rule changes.
- In `dashboardLogic.ts`: `preflightForConfirmation()`'s name, parameter shape, return contract and body; `preparePublicationBatch()`; the whole `createPublicationController()` internals including `preflight()`, `publish()`, `trackCommittedPublication()` and the fingerprint comparison. The ONLY edits there are the three named in Task 1.
- In `EditorialDashboard.tsx`: the panel header heading and subtitle, the two pipeline nodes, the connector and its gate button, the blocked-rows critical card, the tracking-error card, the attention/activity sections, and every production-release handler.

Do NOT weaken, shortcut, or move the preflight gate. Do NOT add an "are you sure" replacement in any other form — no `window.confirm`, no toast-with-undo, no double-click arming, no hold-to-confirm. One click means one click.
Do NOT delete tests that currently cover the confirmation flow. Re-point them.
</scope_boundary>

<tasks>

<!-- planner-discipline-allow: confirmationOpen -->
<!-- planner-discipline-allow: setConfirmationOpen -->
<!-- planner-discipline-allow: confirmationBatch -->
<!-- planner-discipline-allow: dialogOpen -->
<!-- planner-discipline-allow: requestPublication -->
<!-- planner-discipline-allow: confirmPublication -->
<!-- planner-discipline-allow: Publier maintenant sur le site public -->
<!-- planner-discipline-allow: par tout le monde -->

<task type="auto">
  <name>Task 1: Add the merged publish helper, slim the card state, and re-point the existing card-state tests</name>
  <files>sanity/editorial/dashboardLogic.ts, tests/unit/dashboard-logic.test.ts</files>
  <action>
Three edits in `sanity/editorial/dashboardLogic.ts`, and nothing else in that file.

**(a) Guard the surviving gate with a comment, at `preflightForConfirmation()` (~line 611).** Leave the function itself byte-identical — same name, same parameter shape, same body, same `batch.ready ? batch : null` return, same swallow-and-return-null catch. Add a comment block directly above it recording WHY it survives the removal of the confirmation card: the card gated public/private and that premise is now false, but this function gates CONTENT QUALITY — it hands back the batch only when `batch.ready`, and `ready` is false whenever any row is missing an « Indispensable » field. State plainly that returning `null` here means nothing may be published, that this is the sole precondition guarding `publish()`, and that it must not be inlined away or relaxed by a future reader who sees "Confirmation" in the name and assumes it is leftover dialog machinery. Explain that the name is deliberately kept so the three existing call sites and their tests stay stable.

**(b) Add `publishAfterPreflight()` directly below it**, above `createPublicationController()`. It takes a controller structurally typed with both `preflight(): Promise<PublicationBatch>` and `publish(): Promise<PublicationResult>`, calls `preflightForConfirmation()` first, returns `null` immediately when that yields `null`, and otherwise returns `controller.publish()`. Declared return type `Promise<PublicationResult | null>`, where `null` means the gate refused and NOTHING was published. Do not add a try/catch: a rejection from `publish()` must propagate, because the controller has already recorded the user-facing error state and the caller only needs to stop. Comment it as the whole of the one-click contract — one gesture, gate first, publish only if the gate passes — and note that `publish()` cannot be called without a preceding `preflight()` because it reads the private confirmed batch that only `preflight()` sets.

**(c) Slim `publicationCardState()` (~line 553).** Remove the third option from its destructured options object and remove the corresponding field from its returned object — the one that mirrored whether the confirmation card was open. Keep `total`, `pairs`, `blockedRows` and the `buttonDisabled` expression exactly as they are; `buttonDisabled` is a separate guard (busy / tracking failed / empty batch / blocked rows) and stays character-for-character. This IS a signature change, and it is the unavoidable one: the state being mirrored ceases to exist in Task 2, so the alternative is a parameter every caller must pass as a literal false forever and a return field nothing reads — dead code left behind by a cleanup. Add a one-line comment saying the option was removed with the confirmation card and must not come back.

**(d) Reword `ConfirmationChangedError`'s message (~line 536-543).** Keep the class name, keep `this.name`, keep it extending `Error` — three tests assert `instanceof` on it and `publish()`'s catch branches on it, so none of that may move. Change only the message string: it currently tells the editor the batch changed "depuis la confirmation" and to "confirmez à nouveau", and after this plan there is no confirmation step and no confirm button to press. Write a replacement that says the batch changed while the update was running, that nothing was published, and that the fix is to check the refreshed récapitulatif and click « Mettre le site à jour » again. Keep it one or two sentences, in the same register as the surrounding French strings.

Then update `tests/unit/dashboard-logic.test.ts` for (c) — three call sites, all mechanical:

- ~line 737 (`blockedCard`), ~line 760 (`replacementCard`) and ~line 796 (`card`): delete the now-removed third option from each options object literal. Leave `busy` and `trackingFailed` as they are.
- Delete the three assertions on the removed return field (~751, ~772, ~810).
- In place of the one at ~751 only, put a single anti-regression assertion that the returned object no longer carries that property at all (`expect(blockedCard).not.toHaveProperty(...)`), with a short message explaining that the field went away with the confirmation card and reintroducing it would mean the card came back. This is the one place the removed identifier may still appear in this file.
- Do not touch anything else in those three cases: the `client.action` never-called assertions, the `onInventory` handoff assertions, the phase assertions and the blocked-row expectations are all still exactly right and are load-bearing evidence that the batch-changed path still refuses to publish.

Leave every other case in the file alone at this stage; Task 3 adds the new ones.
  </action>
  <verify>
    <automated>npm run test:unit -- tests/unit/dashboard-logic.test.ts</automated>
    <automated>test "$(grep -cF 'publishAfterPreflight' sanity/editorial/dashboardLogic.ts)" = "1"</automated>
    <automated>test "$(grep -cF 'export async function preflightForConfirmation' sanity/editorial/dashboardLogic.ts)" = "1"</automated>
    <automated>test "$(grep -cF 'batch.ready ? batch : null' sanity/editorial/dashboardLogic.ts)" = "1"</automated>
    <automated>test "$(grep -cF 'dialogOpen' sanity/editorial/dashboardLogic.ts)" = "0"</automated>
    <automated>test "$(grep -cF 'confirmationOpen' sanity/editorial/dashboardLogic.ts)" = "0"</automated>
    <automated>test "$(grep -cF 'confirmationOpen' tests/unit/dashboard-logic.test.ts)" = "0"</automated>
    <automated>test "$(grep -cF 'dialogOpen' tests/unit/dashboard-logic.test.ts)" = "1"</automated>
    <automated>test "$(grep -cF 'confirmez à nouveau' sanity/editorial/dashboardLogic.ts)" = "0"</automated>
    <automated>test "$(grep -cF 'ConfirmationChangedError' sanity/editorial/dashboardLogic.ts)" = "4"</automated>
    <automated>npm --prefix sanity run lint</automated>
  </verify>
  <done>`publishAfterPreflight()` exists once, composes the untouched gate with `publish()`, and returns null when the gate refuses; `preflightForConfirmation()` is unchanged apart from a comment that explains why it must stay; `publicationCardState()` no longer accepts or returns any dialog state; `ConfirmationChangedError` keeps its class identity and loses its stale confirm-again wording; the full `dashboard-logic.test.ts` suite passes with the three re-pointed call sites and the single property-absence guard; Sanity lint is clean.</done>
</task>

<task type="auto">
  <name>Task 2: Delete the confirmation card and merge the two handlers into one click</name>
  <files>sanity/editorial/EditorialDashboard.tsx</files>
  <action>
All edits are inside the « Mettre le site à jour » panel of `sanity/editorial/EditorialDashboard.tsx`. Read the surrounding code before editing: this file has NO TypeScript compile gate (root `tsconfig.json` excludes `sanity/`, and `sanity build` transpiles without checking types), so a stale identifier or a leftover argument will not be caught by any command below except ESLint's unused-variable rule.

**Imports (~line 55):** add `publishAfterPreflight` to the existing import from `./dashboardLogic`. Keep `preflightForConfirmation` imported ONLY if something still calls it directly — after this task nothing in the component should, so remove it from the import list and let the new helper own that call.

**State (~line 92):** delete the boolean state pair that tracked whether the confirmation card was open. Nothing replaces it — the merged flow has no intermediate state to hold.

**Derived values (~line 489-499):**
- Drop the removed third option from the `publicationCardState(...)` call so it matches Task 1's slimmer signature.
- Delete the derived batch constant at ~line 494 that fed the card's count sentence (`publicationState.batch ?? publicationSnapshot`); it has no other consumer.
- Extend `publicationPanelHasBody` with a term for the changed-batch message added below, so the panel divider still appears when that message is the only body: the `confirming` phase together with a non-empty `publicationState.error`.
- Add a derived label for the single button so it stops claiming the whole operation is a verification. Compute it from the phase: the `preflighting` phase keeps the existing « Vérification… » wording; any other busy phase (`publishing`, `committed`, `refreshing` — the rest of `publicationBusy`) shows a publication-in-progress wording, reusing the exact string the deleted card's confirm button used for that state so no new copy is invented; otherwise « Mettre le site à jour ». Comment WHY: in the merged flow one button spans both halves of the operation, and the old label was only ever correct for the first half.

**Handlers (~line 501-519):** replace the two functions — the one that preflighted and opened the card, and the one that published on confirm — with a single `async` handler named `runPublication`. It awaits `publishAfterPreflight(publicationController)` inside a `try`, and when the resolved result carries a `publishedAt`, folds it into state through the existing `setPublishedAt((current) => latestValidTimestamp(current, result.publishedAt))` call, exactly as the confirm handler did. Its `catch` body does nothing but carry a comment saying the controller owns the user-facing error state — mirror `refreshPublicationTracking()` directly below, which already uses that pattern. There is no card left to reopen or close, so the old catch's card-reopening logic is deleted outright, not ported. Comment the handler with the one-click contract and with WHY the confirmation step is gone: this button publishes to Sanity and rebuilds the site de test only; the round gate button between the two pipeline nodes is the step that makes anything public.

**JSX (~line 660-710):** delete the whole ternary. The confirmation `Card` — its caution tone, its question line about publishing to the public site, its sentence counting how many contents would be visible to everyone, its inline error card, its Annuler button and its Confirmer button — goes away entirely. What remains is the `Button` from the ternary's else-branch, rendered unconditionally in the same position inside the same `Flex`, keeping its `tone="primary"`, its `disabled={publicationCard.buttonDisabled}`, its `loading={publicationBusy}` and its `style={{minHeight: 44}}`, with `text` now bound to the derived label and `onClick` calling the merged handler.

**Changed-batch message (new, inside the same `Stack` as the other status cards):** the deleted card was the only renderer of the `confirming`-phase error, so re-home it or a changed-batch refusal becomes a click that does nothing visible. Add a `Card padding={3} radius={2} tone="caution"` containing a single `Text size={1}` bound to `publicationState.error`, guarded on the `confirming` phase AND a truthy error, placed between the tracking-error card and the error card (~after line 870). Comment WHY it exists — pointing at `publish()`'s fingerprint comparison in `dashboardLogic.ts` as the thing that produces this state, and noting that the message itself already tells the editor to click again, so this card needs no button of its own.

**Retry button (~line 883):** re-point the error card's « Actualiser et réessayer » button at the merged handler. Its label stays as it is: with the merge, retrying is one click that re-fetches and republishes, which is what the label already promises.

Afterwards, grep the file yourself for every identifier and string you removed and confirm none survives in code OR in a comment — the gates below fail on a quoted leftover just as hard as on a live one. Let Prettier settle indentation via `npm --prefix sanity run lint` rather than hand-formatting.
  </action>
  <verify>
    <automated>test "$(grep -cF 'confirmationOpen' sanity/editorial/EditorialDashboard.tsx)" = "0"</automated>
    <automated>test "$(grep -cF 'confirmationBatch' sanity/editorial/EditorialDashboard.tsx)" = "0"</automated>
    <automated>test "$(grep -cF 'confirmPublication' sanity/editorial/EditorialDashboard.tsx)" = "0"</automated>
    <automated>test "$(grep -cF 'requestPublication' sanity/editorial/EditorialDashboard.tsx)" = "0"</automated>
    <automated>test "$(grep -cF 'Publier maintenant sur le site public' sanity/editorial/EditorialDashboard.tsx)" = "0"</automated>
    <automated>test "$(grep -cF 'par tout le monde' sanity/editorial/EditorialDashboard.tsx)" = "0"</automated>
    <automated>test "$(grep -cF 'Annuler' sanity/editorial/EditorialDashboard.tsx)" = "0"</automated>
    <automated>test "$(grep -cF 'publishAfterPreflight' sanity/editorial/EditorialDashboard.tsx)" = "2"</automated>
    <automated>test "$(grep -cF 'runPublication' sanity/editorial/EditorialDashboard.tsx)" = "3"</automated>
    <automated>test "$(grep -cF 'Mettre le site à jour' sanity/editorial/EditorialDashboard.tsx)" -ge "3"</automated>
    <automated>npm --prefix sanity run lint</automated>
    <automated>npm --prefix sanity run build</automated>
  </verify>
  <done>The confirmation card and every identifier that served it are gone from the component; one `runPublication` handler is declared once and wired to both the primary button and the error card's retry button; `publishAfterPreflight` is imported and called exactly once; the primary button renders unconditionally with a phase-aware label; the `confirming`-phase error has a visible inline home and is counted in `publicationPanelHasBody`; the panel heading, subtitle, pipeline nodes, gate button and blocked-rows card are untouched; Sanity lint is clean and the Studio bundles.</done>
</task>

<task type="auto">
  <name>Task 3: Prove the merged flow — one-click success, still-blocked refusal, and a markup guard</name>
  <files>tests/unit/dashboard-logic.test.ts, tests/unit/editorial-dashboard-markup.test.ts</files>
  <action>
This is the task that makes the behaviour change real rather than assumed. Two files.

**In `tests/unit/dashboard-logic.test.ts`,** import `publishAfterPreflight` alongside the existing `preflightForConfirmation` import (~line 31) and add one new `describe` block. Open it with a comment stating what it protects: « Mettre le site à jour » is now a single gesture, and the gate that used to sit behind a human confirmation is now the ONLY thing between a click and a publish — so both its pass and its refuse behaviours need standing proof. Follow the file's existing style exactly (semicolons, single quotes, `publicationDocument(...)` helpers, `vi.fn()` fetch mocks, `createPublicationController({client, ...})` with a fake client).

Three cases:

1. **Success path — one call publishes.** Model the client mock on the existing case at ~546-570: `fetch` resolves the same ready raw inventory twice (preflight, then publish's re-fetch), then the deployment marker, then the published timestamps; `action` resolves a transaction. Assert that `publishAfterPreflight(controller)` resolves to a result with `committed: true` and the expected `publishedIds`, that `client.action` was called exactly once, and that the controller ends in `phase: 'success'`. Add a message on the action-count assertion: one gesture must produce exactly one publish transaction — a second call would mean the merge reintroduced a double-submit.

2. **Still-blocked path — the gate holds.** Build an inventory whose batch is NOT ready because a document is missing an « Indispensable » field; the existing `publicationDocument('drafts.gallery-…', 'gallery', {title: '…', images: []})` shape used around line 712 is already a blocked row, so reuse that shape rather than inventing a new blocking condition. `fetch` needs only the single preflight response. Assert that `publishAfterPreflight(controller)` resolves to `null`, that `client.action` was NEVER called, that the controller did not reach a published phase, and that the batch the controller holds reports `ready === false` with the blocked row present. Give the never-called assertion an explicit message: removing the confirmation card removed a public/private warning, NOT the content-quality gate — a batch with missing indispensable fields must still publish nothing.

3. **Preflight failure path.** `fetch` rejects on the first call. Assert `publishAfterPreflight(controller)` resolves to `null` (the gate swallows and refuses rather than throwing), `client.action` was never called, and the controller is in `phase: 'error'`. This is the fail-closed proof: a preflight that cannot even be evaluated must not fall through to a publish.

Do not weaken or rewrite any existing case in this file while adding these.

**In `tests/unit/editorial-dashboard-markup.test.ts`,** add a third `describe` block in the file's established source-text style (`readFileSync(COMPONENT_PATH, 'utf-8')`, regex or `includes` over the source, flexible whitespace so Prettier reflow cannot break it). Open it with a comment recording that the confirmation card asserted a consequence the button no longer has — content and the site de test only, never the public site — and that these assertions stop it from being reintroduced. Assert:

1. The source contains neither the card's question line about publishing to the public site nor its sentence fragment about contents being visible to everyone, with a failure message naming the round gate button as the actual goes-public step.
2. The source contains no dialog-open state identifier and no separate confirm handler — one handler only.
3. `publishAfterPreflight` appears in the source (imported and called), so the component routes through the gate rather than calling `publish()` directly. Also assert the source does NOT contain a bare `publicationController.publish(` call, with the message that skipping the preflight would remove the blocking gate entirely.
4. The `confirming`-phase error has a renderer: the source contains a guard combining that phase with `publicationState.error`. Failure message: this message was previously rendered only inside the deleted card, and without a new home a changed-batch refusal becomes an invisible dead click.

Do not modify the file's two existing describe blocks — the plain-span assertions and the header-subtitle gating assertions both guard earlier quick tasks and must keep passing untouched.
  </action>
  <verify>
    <automated>npm run test:unit -- tests/unit/dashboard-logic.test.ts</automated>
    <automated>npm run test:unit -- tests/unit/editorial-dashboard-markup.test.ts</automated>
    <automated>test "$(grep -cF 'publishAfterPreflight' tests/unit/dashboard-logic.test.ts)" -ge "4"</automated>
    <automated>test "$(grep -cF 'toHaveBeenCalled' tests/unit/dashboard-logic.test.ts)" -ge "3"</automated>
    <automated>test "$(grep -cF 'publishAfterPreflight' tests/unit/editorial-dashboard-markup.test.ts)" -ge "1"</automated>
  </verify>
  <done>Three new cases drive `publishAfterPreflight()` end to end: a ready batch publishes with exactly one transaction, a batch blocked by a missing indispensable field publishes nothing and resolves null, and an unevaluable preflight fails closed; a new markup describe block proves the card's strings and the dialog state are gone, that the component routes through the gate rather than calling publish directly, and that the changed-batch message has a visible renderer; every pre-existing case in both files still passes unmodified.</done>
</task>

<task type="auto">
  <name>Task 4: Update the editor guide, run every gate, prove scope, redeploy and get behavioural sign-off</name>
  <files>sanity/README.md</files>
  <action>
**README.** In `sanity/README.md`, step 5 of « Le parcours quotidien » (~line 13) currently reads as two beats — check the récapitulatif, then publish the whole batch — which described the confirmation card. Rewrite that step for the one-click flow: from the Tableau de bord, one click on « Mettre le site à jour » publishes the whole batch and the site de test updates automatically. Keep the sentence about the site de test updating automatically, keep step 6 (the gate button and the deliberate separation of the two actions) exactly as it is, and keep line ~21's statement that a draft becomes public only through the global action — that is still true. Check the rest of the file for any other sentence describing a confirmation or récapitulatif-then-confirm step and bring it in line; the « Comprendre le lot de publication » section (~33-40) describes what the récapitulatif shows and stays valid — the récapitulatif is the panel itself, not the deleted card. Change nothing about the production-release half of the document.

**Gates.** Run all four in order, fixing anything they surface before moving on: `npm run test:unit` (full suite), `npm run typecheck`, `npm --prefix sanity run lint`, `npm --prefix sanity run build`.

**Scope proof.** `git diff --stat` across the working tree must show only the five files this plan owns plus `.planning/` artefacts — and whatever was already modified in the tree before this work began, which you must not have touched. `sanity/editorial/deployment.ts`, `sanity/editorial/EditorialDashboard.css` and anything under `.github/workflows/` must be absent. Then confirm the production-release surface inside `dashboardLogic.ts` survived by grepping that `buildProductionReleaseMarkerActions` and `triggerProductionRelease` are both still present, and record the observed output in the SUMMARY.

**Deploy.** Redeploy the live Studio with `npm run deploy --prefix sanity`. This is the established pattern for shipping a Studio change in this project (same as quick tasks dvq, f22, h3i and lvt) and is expected and low-risk — do not stop and ask before running it. Wait for success, note the deployed Studio URL from its output, then present the human-check below. If the deploy fails, do not retry blindly: report the failure output and stop — the previous bundle is still serving and nothing is broken by waiting.
  </action>
  <verify>
    <automated>npm run test:unit</automated>
    <automated>npm run typecheck</automated>
    <automated>npm --prefix sanity run lint</automated>
    <automated>npm --prefix sanity run build</automated>
    <automated>test -z "$(git diff --stat sanity/editorial/deployment.ts sanity/editorial/EditorialDashboard.css .github/workflows/)"</automated>
    <automated>test "$(grep -cF 'buildProductionReleaseMarkerActions' sanity/editorial/dashboardLogic.ts)" -ge "1"</automated>
    <automated>test "$(grep -cF 'triggerProductionRelease' sanity/editorial/dashboardLogic.ts)" -ge "1"</automated>
    <automated>npm run deploy --prefix sanity</automated>
    <human-check>
The Studio has been redeployed. Open it and **hard-refresh** (Cmd+Shift+R) so the new bundle loads.

**This one needs a real click, not just a look** — there is no authenticated browser session in this environment, so the one-click publish path cannot be exercised from here. Please actually run it:

1. **Publish something for real.** Make sure at least one public document has a pending draft (edit a collection or an édition, or use one already waiting), go back to the Tableau de bord, and click « Mettre le site à jour » **once**.

   Expected: no card appears asking whether to publish to the public site, no second button to press, no second click. The button goes straight into its busy state and the content publishes. Confirm the count next to the panel drops and the first pipeline node moves out of its pending state — i.e. it genuinely published, not just that the card disappeared.

2. **The public warning is gone and was right to go.** The card that used to claim N contents would become « visibles par tout le monde » is deleted. Nothing became public from that click — only Sanity plus the site de test. Confirm the round gate button between the two pipeline nodes is still the only way to reach the site en ligne, and that it behaves exactly as it did before.

3. **The blocking gate still blocks.** If it is convenient, leave an « Indispensable » field empty on one draft and check that the button is still refused: the blocked-contents card still lists the document with a direct link, and nothing publishes. This is the one behaviour that had to survive the removal untouched.

4. **The button label reads correctly while it works.** During the click it should show a verification wording only for the first moment and then a publication wording while it publishes — not the verification wording for the whole cycle.

5. **Nothing else in the panel moved.** Heading, the sentence counting modified contents, both pipeline circles with their labels and sub-lines, the blocked-contents card, the tracking-error card and the error card should all look as before. Also narrow to phone width and confirm the panel still lays out correctly now that the card is gone.

Reply « approuvé » if the one-click publish worked, or describe what happened.
    </human-check>
  </verify>
  <done>The editor guide describes a one-click publish with no confirmation beat; all four gates pass; `git diff --stat` on the forbidden paths is empty and the production-release helpers are provably still present; the Studio deploy reports success; and the user's BEHAVIOURAL confirmation — that clicking once on a real pending draft actually published it — or their correction list is recorded in the SUMMARY.</done>
</task>

</tasks>

<verification>
- `npm run test:unit` — full suite green, including the three re-pointed card-state cases, the three new `publishAfterPreflight()` cases and the new markup describe block.
- `npm run typecheck` — 0 errors. Note this does NOT cover `EditorialDashboard.tsx` (root tsconfig excludes `sanity/`); the markup tests and lint are that file's only automated guards.
- `npm --prefix sanity run lint` — clean, including no unused identifiers left behind by the removals.
- `npm --prefix sanity run build` — Studio bundles.
- `test "$(grep -cF 'Publier maintenant sur le site public' sanity/editorial/EditorialDashboard.tsx)" = "0"` and the same for the visible-to-everyone fragment — the false premise is gone from the source, comments included.
- `test "$(grep -cF 'confirmationOpen' sanity/editorial/EditorialDashboard.tsx)" = "0"` — the intermediate state is deleted, not merely defaulted to false.
- `test "$(grep -cF 'export async function preflightForConfirmation' sanity/editorial/dashboardLogic.ts)" = "1"` and `test "$(grep -cF 'batch.ready ? batch : null' sanity/editorial/dashboardLogic.ts)" = "1"` — the blocking gate survived verbatim.
- The blocked-batch case in `dashboard-logic.test.ts` asserts `client.action` was never called — the gate is proven, not assumed.
- `git diff --stat sanity/editorial/deployment.ts sanity/editorial/EditorialDashboard.css .github/workflows/` — empty.
</verification>

<success_criteria>
- One click on « Mettre le site à jour » preflights and publishes; there is no intermediate card and no second click anywhere in the content-publish path.
- The deleted card's claim — that publishing makes N contents visible to everyone — no longer exists anywhere in the source, because it is no longer true of that button.
- The content-quality preflight gate is provably unchanged and still refuses batches with missing « Indispensable » fields, backed by a test that drives the new merged path and asserts nothing was published.
- A batch that changes mid-flight is still refused AND the refusal is visible: the message the deleted card used to own has a new inline home.
- The single button's label tells the truth across both halves of the operation.
- No "are you sure" was reintroduced in another shape, and no test covering the old flow was deleted rather than re-pointed.
- The production-release path, the pipeline UI and CI are provably untouched.
- Every gate is green, the Studio is redeployed, and the user has confirmed by actually publishing a real draft in one click.
</success_criteria>

<output>
Create `.planning/quick/260812-mev-remove-the-outdated-public-confirmation-/260812-mev-SUMMARY.md` when done
</output>
