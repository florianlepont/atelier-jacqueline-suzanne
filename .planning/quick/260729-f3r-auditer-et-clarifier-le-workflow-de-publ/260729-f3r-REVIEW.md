---
phase: quick-260729-f3r
reviewed: 2026-07-29T09:44:12Z
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
  critical: 4
  warning: 5
  info: 0
  total: 9
resolved_findings: 9
remaining_findings: 0
resolved_at: 2026-07-29T09:53:36Z
resolution_commits: [2f769a6, ee93b6e]
status: resolved
---

# Phase quick-260729-f3r: Code Review Report

**Reviewed:** 2026-07-29T09:44:12Z
**Depth:** deep
**Files Reviewed:** 17
**Status:** resolved (original review status: issues_found)

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
**Status:** All 9 findings resolved; no code-review finding remains open.

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
