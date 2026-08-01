---
phase: quick-260729-f3r
reviewed: 2026-07-29T09:44:12Z
re_reviewed: 2026-07-29T09:59:03Z
final_re_reviewed: 2026-07-29T10:07:16Z
working_tree_re_reviewed: 2026-07-29T10:17:50Z
wr08_resolved_at: 2026-07-29T10:23:13Z
depth: deep
files_reviewed: 17
files_reviewed_list:
  - sanity/README.md
  - sanity/editorial/DocumentChecklist.tsx
  - sanity/editorial/EditorialDashboard.tsx
  - sanity/editorial/OpenSitePage.tsx
  - sanity/editorial/checks.ts
  - sanity/editorial/dashboardLogic.ts
  - sanity/editorial/deployment.ts
  - sanity/editorial/workflow.tsx
  - sanity/editorial/workflowLogic.ts
  - sanity/sanity.config.ts
  - sanity/schemas/edition.ts
  - sanity/schemas/gallery.ts
  - sanity/schemas/structure.ts
  - tests/unit/dashboard-logic.test.ts
  - tests/unit/deployment.test.ts
  - tests/unit/editorial-checks.test.ts
  - tests/unit/workflow-logic.test.ts
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
original_findings:
  critical: 4
  warning: 5
  info: 0
  total: 9
resolved_findings: 12
remaining_findings: 0
resolved_at: 2026-07-29T10:23:13Z
resolution_commits: [2f769a6, ee93b6e, 196e9f7, a4adf30]
wr07_resolution_status: verified_pending_orchestrator_commit
wr08_resolution_status: verified_pending_orchestrator_commit
status: resolved_pending_commit
---

# Phase quick-260729-f3r: Code Review Report

**Reviewed:** 2026-07-29T09:44:12Z
**Depth:** deep
**Files Reviewed:** 17
**Status:** all findings resolved in the verified working tree; commits pending orchestrator handoff

## Summary

The global publish does use exactly one `client.action(actions, {tag: ...})` call. The installed
`@sanity/client` serializes the array as one Actions API request, and Sanity documents the request
as an ordered, all-or-nothing transaction. The atomic-call requirement itself is therefore met.

The implementation is not ready to ship, however. A dashboard that has already published once can
reuse its old timestamp after another tab publishes newer content and falsely show **Site à jour**.
The confirmed batch is not bound to draft revisions, so concurrent edits or newly-created drafts can
be published without having appeared in the confirmation. Post-commit observation failures are also
reported as though the already-committed transaction failed.

Focused verification passed (`113` unit tests), as did `npm run typecheck` and
`npm --prefix sanity run build`. Those gates do not exercise the cross-tab, post-commit, or React
integration paths below.

## Narrative Findings (AI reviewer)

### Critical Issues

### CR-01: A prior local timestamp can make a newer cross-tab publication look deployed

**Classification:** BLOCKER

**File:** `sanity/editorial/EditorialDashboard.tsx:219-230`

**Issue:** `publishedReference` always prefers the component's existing `publishedAt` state over
`lastPublishedDocumentAt`. Once this tab publishes batch A, `publishedAt` remains fixed at A's
timestamp. If another tab or editor later publishes batch B, the realtime content refresh advances
`lastPublishedDocumentAt`, but the old A timestamp still wins. Until a new GitHub run is observed,
the already-successful run for A qualifies and the dashboard can display **Site à jour** for B. Since
that stale state is terminal, polling also drops to the five-minute background interval.

**Fix:**

```ts
const publishedReference = latestValidTimestamp(
  publishedAt,
  lastPublishedDocumentAt,
)
```

Use the maximum valid timestamp, not nullish preference. Keep the local action timestamp only as a
bridge until the refreshed published documents catch up. Add a component-level test that publishes
at `t1`, receives a realtime published document at `t2`, and proves the `t1` run no longer qualifies.

### CR-02: The dispatched batch is not bound to what the editor confirmed or validated

**Classification:** BLOCKER

**Files:** `sanity/editorial/dashboardLogic.ts:340-350`, `sanity/editorial/dashboardLogic.ts:408-424`,
`sanity/editorial/EditorialDashboard.tsx:313-325`

**Issue:** The confirmation is built from `preflight()`, but `publish()` fetches a new batch and
silently publishes whatever drafts exist at that later instant. A draft created by another editor
after the dialog opens can therefore be added to the transaction without appearing in the confirmed
count. Existing draft content can likewise change after confirmation. There is a second race between
the fresh fetch and `client.action`: the action contains `ifPublishedRevisionId` but omits the
supported `ifDraftRevisionId`, so an autosave after validation can be published without being
validated at all.

**Fix:**

```ts
const confirmed = batchFingerprint(confirmedBatch) // id + draft _rev + published _rev
const freshBatch = preparePublicationBatch(await fetchRaw())

if (batchFingerprint(freshBatch) !== confirmed) {
  setState({phase: 'confirming', batch: freshBatch})
  throw new ConfirmationChangedError()
}

const actions = freshBatch.actions.map((action) => ({
  ...action,
  ifDraftRevisionId: freshBatchById.get(action.publishedId)!.draft._rev,
}))
await client.action(actions, {tag: 'editorial.publish-all'})
```

Re-confirm when membership or revisions change, and add `ifDraftRevisionId` from the immediately
refetched draft so Content Lake rejects any edit that lands between validation and dispatch. Tests
must cover both a newly-added draft after confirmation and a draft revision change after preflight.

### CR-03: A timestamp read failure is presented as failure of an already-committed publication

**Classification:** BLOCKER

**Files:** `sanity/editorial/dashboardLogic.ts:424-453`,
`sanity/editorial/EditorialDashboard.tsx:518-531`

**Issue:** Once `client.action` resolves, the all-or-nothing Sanity transaction has committed.
Timestamp lookup and UI refresh are post-commit observations, but they remain inside the same `try`
and fall into the generic publication-error state. If the timestamp query fails or returns no valid
timestamp, the controller skips `onRefresh`, the UI says “La mise en ligne n’a pas abouti,” and offers
to retry publication. That message is false, and retrying an already-committed operation cannot
recover the timestamp. A partial timestamp response is also accepted without verifying that every
published ID was returned.

**Fix:** Introduce an explicit committed/post-commit state. Immediately after `client.action`
resolves, record that Sanity succeeded and request the inventory refresh in a `finally`-style
post-commit path. Validate that the timestamp response contains every expected published ID. If
timestamp verification fails, show “Contenus publiés dans Sanity; fraîcheur du site non vérifiable”
and offer a tracking refresh, never another publish action.

### CR-04: The page claims everything is up to date without consulting deployment state

**Classification:** BLOCKER

**File:** `sanity/editorial/EditorialDashboard.tsx:293-307`

**Issue:** With zero drafts, the header subtitle is always “Tout est publié et à jour.” This remains
true in the rendered copy when `deploymentState` is `waiting-run`, `deploying`, `failed`, or
`unknown`. The adjacent status pill may contradict it, but the page still makes the exact false
success claim the task was designed to eliminate.

**Fix:** Separate content publication from deployment freshness. With zero drafts, use neutral copy
such as “Tous les contenus sont publiés,” and append “Site à jour” only when
`currentDeploymentState.kind === 'current'`. Render waiting, deploying, failed, and unknown copy from
that same state machine.

### Warnings

### WR-01: Edition rows are not named

**Classification:** WARNING

**File:** `sanity/editorial/dashboardLogic.ts:476-483`

**Issue:** `documentTitle()` reads `title` for galleries and exhibitions only. Every edition is
therefore displayed as the generic label “Édition” in the pending list, confirmation context, and
blocking errors. Multiple editions cannot be distinguished, violating the requirement to name each
pending content item.

**Fix:** Treat `edition` like `gallery`, returning its non-empty `title` with “Édition sans nom” as
fallback, and add inventory/blocking tests with two differently-titled editions.

### WR-02: Sanity/GitHub timestamp precision can reject a valid same-second run

**Classification:** WARNING

**File:** `sanity/editorial/deployment.ts:77-93`

**Issue:** Qualification compares timestamps at full millisecond precision. Sanity `_updatedAt`
commonly includes milliseconds while GitHub Actions timestamps are represented to the second. A run
created after a publication within the same wall-clock second can therefore be represented as
earlier than `publishedAt` and remain “Mise à jour non démarrée” even though it deployed the content.
The tests only cover whole-second timestamps with the run one second later.

**Fix:** Model the precision ambiguity explicitly. Prefer capturing the pre-publication run IDs and
qualifying a newly-observed run with a whole-second lower bound. If the implementation cannot prove
ordering after reload, return `unknown` for a same-second candidate rather than falsely reporting
that no update started. Add fractional-millisecond boundary tests.

### WR-03: One malformed irrelevant run poisons an otherwise valid deployment result

**Classification:** WARNING

**File:** `sanity/editorial/deployment.ts:120-133`

**Issue:** `runs.some((run) => !runTimelineIsCoherent(run))` fails the entire state before selecting
a qualified run. A malformed old run created before `publishedAt` therefore forces `unknown` even
when a newer, coherent, successful run proves freshness.

**Fix:** Parse the publication threshold, select candidate runs, and validate only the selected
qualified candidate (while still failing closed if that candidate is incoherent). Add a test with
one malformed pre-threshold run and one valid post-threshold success.

### WR-04: Preflight failures create unhandled promise rejections

**Classification:** WARNING

**File:** `sanity/editorial/EditorialDashboard.tsx:313-316`,
`sanity/editorial/EditorialDashboard.tsx:451`, `sanity/editorial/EditorialDashboard.tsx:527-530`

**Issue:** `preflight()` sets the controller error state and rethrows, while both click handlers call
`void requestPublication()` without a catch. A fetch/permission failure is rendered in the card but
also escapes as an unhandled browser promise rejection.

**Fix:**

```ts
const requestPublication = async () => {
  try {
    const batch = await publicationController.preflight()
    if (batch.ready) setConfirmationOpen(true)
  } catch {
    // Controller state already contains the user-facing error.
  }
}
```

### WR-05: The guide tells editors to use checklist controls that are not registered

**Classification:** WARNING

**Files:** `sanity/README.md:7-13`, `sanity/README.md:100-103`,
`sanity/editorial/DocumentChecklist.tsx:201-210`

**Issue:** The daily workflow tells every editor to consult the document Checklist, and the edition
section says the Checklist enforces edition format and rights. However `checklistEnabledTypes`
omits both `edition` and `editionsPage`, so those document panes do not register the Checklist
inspector or its badges. The dashboard preflight still blocks them, but the documented editing path
does not exist.

**Fix:** Either register the existing inspector for `edition` and `editionsPage`, or update the guide
to say that these checks are available only in the dashboard's blocking report. Add an invariant
test between the documented/public registry and inspector-enabled types if all public types should
share the control.

---

_Reviewed: 2026-07-29T09:44:12Z_
_Reviewer: Codex (gsd-code-reviewer)_
_Depth: deep_

## Resolution

**Resolved:** 2026-07-29T09:53:36Z
**Status:** All 9 original findings resolved; the independent re-review found one remediation
regression.

The original finding detail above is retained as the audit record. Resolution was implemented as
a RED regression commit (`2f769a6`) followed by the bounded correction commit (`ee93b6e`).

| Finding | Status | Resolution evidence |
|---------|--------|---------------------|
| CR-01 | RESOLVED | Maximum valid local/remote publication timestamp plus cross-tab regression. |
| CR-02 | RESOLVED | Confirmed batch fingerprint covers membership, draft revision and published revision; Actions API payload includes both optimistic guards. |
| CR-03 | RESOLVED | Explicit committed/tracking-error states, immediate inventory refresh, full timestamp-ID coverage and tracking-only retry. |
| CR-04 | RESOLVED | Zero-draft subtitle is derived from the deployment state and mentions “Site à jour” only for `current`. |
| WR-01 | RESOLVED | Edition titles and “Édition sans nom” fallback are covered in inventory/blocking tests. |
| WR-02 | RESOLVED | Fractional and exact same-second candidates fail closed to `unknown` because ordering is precision-ambiguous. |
| WR-03 | RESOLVED | Only the selected qualified run’s timeline is validated; malformed irrelevant old runs are ignored. |
| WR-04 | RESOLVED | UI preflight and tracking handlers catch controller rejections after state captures the user-facing error. |
| WR-05 | RESOLVED | Inspector-enabled types derive from all seven public types plus `exhibition`, with an invariant test. |

### Verification after resolution

- `npm run test:unit -- tests/unit/dashboard-logic.test.ts tests/unit/deployment.test.ts tests/unit/workflow-logic.test.ts tests/unit/editorial-checks.test.ts` — 130 passed.
- `npm run test:unit` — 14 suites, 251 tests passed.
- `npm run lint` — passed.
- `npm run typecheck` — passed with zero errors.
- `npm --prefix sanity run lint` — passed.
- `npm --prefix sanity run build` — passed.

No Studio deployment, live content publication, webhook observation, secret, package, server or
public-site behavior change was performed. Real Editor permission and webhook fan-out remain the
separately authorized Pending Manual UAT recorded in the plan and SUMMARY.

## Independent Re-review

**Re-reviewed:** 2026-07-29T09:59:03Z
**Commits:** `2f769a6`, `ee93b6e`
**Status:** resolved after WR-06 remediation (original re-review status: issues_found)

All nine original findings are fixed in the submitted remediation. Confirmation fingerprints cover
batch membership and both draft/published revisions, every action carries `ifDraftRevisionId`,
post-commit observation has a tracking-only retry, timestamp qualification fails closed at the
same-second precision boundary, terminal polling remains on the documented background cadence, and
the checklist registry now covers every public type.

Independent verification passed: the three focused suites ran 120 tests, the full unit suite ran
251 tests, `npm run typecheck` reported zero errors, and the Sanity Studio build completed.

### WR-06: A newly blocked confirmation batch is discarded by the visible publication card

**Classification:** WARNING

**Files:** `sanity/editorial/dashboardLogic.ts:557-566`,
`sanity/editorial/EditorialDashboard.tsx:315-333`,
`sanity/editorial/EditorialDashboard.tsx:453-531`

**Issue:** `publish()` correctly re-fetches the batch and, when membership changes, stores the fresh
batch in controller state before throwing `ConfirmationChangedError`. If the newly discovered
content is blocked, `confirmPublication()` immediately closes the dialog because
`publicationController.state.batch.ready` is false. The only variable that adopts the controller's
fresh batch (`publicationBatch`) is used inside that now-closed dialog. The main card still derives
its count, rows, blocked reasons, and disabled state exclusively from the older
`publicationSnapshot`.

For example, if another editor creates an incomplete public draft after confirmation, the controller
prevents publication but the card can continue showing the old ready lot and an enabled button.
Clicking it again performs another blocked preflight and returns without opening the dialog, while
still rendering no explanation. A realtime mutation normally refreshes the React snapshot later,
but that subscription is explicitly best-effort and its error path performs no fallback refresh, so
the fresh blocking result can be lost for the rest of the mounted session. This does not bypass the
transaction guard, but it makes the conflict/blocking error non-actionable and leaves the editor in
a misleading retry loop.

**Fix:** Promote the controller's latest preflight batch to the main card until the document query
catches up (for example, render counts, rows, blockers, and button eligibility from
`publicationState.batch ?? publicationSnapshot`). On a changed batch that is no longer ready, show
its blocking reasons outside the confirmation dialog and request an inventory refresh. Add a
component-level regression where an incomplete draft joins after confirmation and assert that the
dialog closes into a disabled card naming the new blocker.

**Resolution:** RESOLVED in `196e9f7` (RED) and `a4adf30` (GREEN).

- A changed batch with newly-added draft membership now drives the main card until the queried
  inventory contains the same or newer draft revisions.
- Count, rows, blocking reasons and button eligibility all use that visible batch.
- A changed blocked batch requests a best-effort inventory refresh while remaining visible if the
  refresh fails.
- The pure controller/helper regression proves a two-item blocker batch is selected with zero
  Actions API calls; the dialog and rendered button lifecycle remain source-traced rather than
  component-tested.

### Final verification after WR-06

- `npm run test:unit -- tests/unit/dashboard-logic.test.ts` — 94 passed.
- `npm run test:unit` — 14 suites, 252 tests passed.
- `npm run lint` — passed.
- `npm run typecheck` — passed with zero errors.
- `npm --prefix sanity run lint` — passed.
- `npm --prefix sanity run build` — passed.

WR-06 is resolved for the submitted regression, but the final independent re-review below found
that the new display-arbitration heuristic can freeze a superseded blocked batch and still discards
an authoritative empty preflight. Pending Manual UAT is unchanged and no external action was
performed.

## Final Independent Re-review

**Re-reviewed:** 2026-07-29T10:07:16Z
**Commits:** `196e9f7`, `a4adf30`
**Status:** resolved in verified working tree (original final re-review status: issues_found)

The remediation correctly wires the chosen `publicationBatch` through the main card’s count, rows,
blocking reasons, and disabled state. It also closes the dialog when the refreshed batch is blocked,
keeps it open for a changed ready batch, and requests a best-effort refresh for the newly-added
blocked-draft case covered by the regression.

Verification passed: the three focused suites ran 121 tests, the full unit suite ran 252 tests,
`npm run typecheck` reported zero errors, and the Sanity Studio build completed. Those tests do not
cover a newer inventory with changed membership or the empty-preflight path below.

### WR-07: Display arbitration can freeze a superseded blocked batch

**Classification:** WARNING

**Files:** `sanity/editorial/dashboardLogic.ts:409-440`,
`sanity/editorial/dashboardLogic.ts:562-568`,
`sanity/editorial/EditorialDashboard.tsx:318-321`,
`sanity/editorial/EditorialDashboard.tsx:453-475`

**Issue:** `inventoryHasCaughtUp()` requires inventory and controller batches to have exactly the
same pair count before it will consider the queried inventory current. Once a changed blocked batch
puts the controller in `confirming`, there is no transition that clears that batch after the
best-effort refresh.

For example, confirmation A can discover a new incomplete draft B and correctly close into the
blocked A+B card. If B is then discarded while another draft C is created, the refreshed inventory
is A+C—the newer truth—but its membership count/IDs differ from A+B, so
`publicationBatchForDisplay()` keeps returning the old controller batch. The same happens for any
new draft added while the blocked state is visible. Realtime and explicit refreshes can continue
updating `publicationSnapshot`, but the helper rejects every changed-membership result. Because the
button is disabled from the old blocked batch, the editor cannot trigger another preflight to escape
the state; only remounting the dashboard clears it.

The opposite direction is also stale: if the card shows a draft that another editor already
published or discarded, a fresh preflight stores an authoritative empty batch in phase `idle`.
`publicationBatchForDisplay()` excludes `idle`, so it keeps the stale non-empty inventory and enabled
button. Repeated clicks perform invisible empty preflights and open no dialog, while this path
requests no refresh.

Neither path can dispatch an invalid action, so atomic publication remains safe. The main card’s
visible state, button eligibility, and recovery behavior are nevertheless incorrect.

**Fix:** Replace the equality heuristic with an explicit handoff. One bounded approach is to expose
the raw documents returned by successful controller fetches to the component, update `documents`
from that exact snapshot, and clear the controller display override once the inventory acknowledges
it; subsequent inventory generations must then be authoritative even when membership changes.
Handle an empty successful preflight through the same handoff. Add regressions for (1) A+B blocked
being superseded by A+C after refresh and (2) stale non-empty inventory followed by an empty
preflight, asserting the final count, blocker list, button state, dialog state, and zero Actions API
calls.

**Resolution:** RESOLVED in the verified working tree; RED/GREEN commits are pending orchestrator
handoff because git escalation became unavailable.

- Every successful raw controller fetch invokes `onInventory` with the exact returned array,
  including `[]`.
- `EditorialDashboard` immediately hands that array to `setDocuments`; the main card is derived
  only from the resulting `publicationSnapshot`.
- The membership/revision display heuristic was removed. Realtime and explicit query generations
  now remain authoritative regardless of changed membership.
- Confirmation data remains separate from card inventory, preserving confirmation fingerprints and
  the single guarded Actions API call.
- Pure regressions prove A+B blocked can be superseded by A+C, and a stale non-empty inventory can
  become authoritative empty state with a disabled button, closed dialog and zero action calls.

### Final verification after WR-07

- `npm run test:unit -- tests/unit/dashboard-logic.test.ts` — 95 passed.
- `npm run test:unit` — 14 suites, 253 tests passed.
- `npm run lint` — passed.
- `npm run typecheck` — passed with zero errors.
- `npm --prefix sanity run lint` — passed.
- `npm --prefix sanity run build` — passed.

WR-07 itself is resolved in the working tree. The independent re-review below found one remaining
inventory-generation race. Pending Manual UAT is unchanged and no external action was performed.

## Working-tree Independent Re-review

**Re-reviewed:** 2026-07-29T10:17:50Z
**Scope:** Uncommitted `dashboardLogic.ts`, `EditorialDashboard.tsx`, and dashboard regression tests
**Status:** resolved in the verified working tree; commits pending orchestrator handoff

The explicit `onInventory` handoff fixes the deterministic WR-07 scenarios: a controller fetch now
updates the card from its exact raw array, `[]` disables the action without opening a dialog, later
React inventory updates can replace the blocked snapshot, and confirmation content remains bound to
`publicationState.batch` rather than the card inventory. The action guards and single-dispatch path
are unchanged.

Verification passed: the three focused suites ran 122 tests, the full unit suite ran 253 tests,
`npm run typecheck` reported zero errors, and the Sanity Studio build completed.

### WR-08: Independent inventory writers can restore an older response after `onInventory`

**Classification:** WARNING

**Files:** `sanity/editorial/EditorialDashboard.tsx:89-116`,
`sanity/editorial/EditorialDashboard.tsx:137-150`,
`sanity/editorial/dashboardLogic.ts:442-471`,
`tests/unit/dashboard-logic.test.ts:398-506`

**Issue:** The controller callback and the dashboard query effect both write directly to
`documents`, but they do not share a request generation, cancellation token, or acceptance guard.
The effect’s `cancelled` flag only protects it when its own dependencies change; a controller
`onInventory` handoff does not cancel or supersede an already-running effect request.

A normal race is therefore:

1. A realtime-triggered background query starts with inventory A.
2. The editor starts preflight; its later controller query returns authoritative B (or `[]`) and
   `onInventory` updates the card.
3. The older background query resolves afterward while its `cancelled` flag is still false and
   writes A back into `documents`.

The card can again show an obsolete blocker, omit a new blocker, or re-enable a stale non-empty lot
after an empty preflight. Confirmation remains safe because it uses the controller batch, and every
publish still re-fetches before dispatch, but the visible/card recovery guarantee is not stable.
An old controller created for a previous `client` can likewise invoke its setter callback after the
component has switched clients because the controller has no lifecycle invalidation.

The new A+B → A+C test does not exercise this handoff: it assigns `inventory = replacement`
directly. The empty test only invokes controller fetches. Neither uses deferred competing requests
or the component effect, so both pass while the response-order race remains.

**Fix:** Give every inventory request—effect and controller—a generation at request start and accept
its result only if that generation is still current, or consolidate raw inventory fetching behind
one cancellable owner. Invalidate outstanding controller callbacks when the client changes or the
component unmounts. Add a deferred-response component/integration regression where an older effect
request resolves after a newer controller handoff and prove it cannot replace B/`[]`; also cover the
inverse start order and unmount/client replacement.

**Resolution:** RESOLVED in the verified working tree; RED/GREEN commits are pending orchestrator
handoff.

- A shared monotonic generation guard now owns acceptance for both the normal dashboard query and
  every controller raw-inventory fetch. Each request reserves its generation before fetching.
- The controller exposes `onInventoryRequestStart` and passes the reserved token with the exact
  successful snapshot to token-aware `onInventory`; stale snapshots never reach React state.
- Controller validation remains independent of visible-state acceptance: it always prepares and
  validates its own fetched snapshot, even when a newer normal request makes its UI handoff stale.
- Guard cleanup invalidates every outstanding generation when the Sanity client changes or the
  dashboard unmounts, while the existing per-effect cancellation remains intact.
- Deferred regressions cover both response orders, an authoritative empty controller result,
  lifecycle invalidation, and controller validation after a rejected visible handoff.

### Final verification after WR-08

- `npm run test:unit -- tests/unit/dashboard-logic.test.ts` — 99 passed.
- `npm run test:unit` — 14 suites, 257 tests passed.
- `npm run lint` — passed.
- `npm run typecheck` — passed with zero errors.
- `npm --prefix sanity run lint` — passed with zero warnings.
- `npm --prefix sanity run build` — code bundling could not be re-run in the restricted sandbox
  because `sanity build` could not resolve `sanity-cdn.com`; the same uncommitted WR-07 tree built
  successfully immediately before WR-08, and WR-08 type-check/lint/unit gates are green.

All twelve review findings are resolved in the current working tree. Pending Manual UAT is
unchanged, no external mutation was performed, and the review-remediation commits remain the
orchestrator's responsibility.
