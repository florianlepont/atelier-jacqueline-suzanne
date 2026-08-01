---
status: resolved
trigger: >
  The Sanity Studio "Tableau de bord" (dashboard) tool shows an infinite
  "Chargement…" spinner and never renders its content. Confirmed both in the
  agent's sandboxed chrome-devtools browser AND the user's own real browser
  against the same running `sanity dev` server — this rules out a sandbox
  network artifact.
created: 2026-08-01
updated: 2026-08-01T00:45:00Z
---

# Debug Session: spinner-never-clears

## Symptoms

- **Expected behavior:** Opening the "Tableau de bord" tool in Sanity Studio
  (localhost:3333, default landing tool) shows the dashboard content
  (publication cards, attention list, deployment status) after a brief load.
- **Actual behavior:** The `Chargement…` spinner (Spinner + Text, rendered
  when `loading` state is true — `sanity/editorial/EditorialDashboard.tsx`
  around line 442) never disappears. Confirmed stuck by the user after
  waiting well past any reasonable load time, in their own normal browser.
- **Error messages:** No error surfaced to the UI. Browser console showed
  only one warning (not a thrown/caught error): `WebSocket connection to
  'wss://gwz8iug4.api.sanity.io/v2022-06-30/socket/production?tag=sanity.studio'
  failed: WebSocket is closed before the connection is established.` Network
  inspection (agent's sandboxed browser session) showed the primary content
  GROQ query (`*[_type in $types] | order(_updatedAt desc)`,
  `sanity.studio` tag) returning HTTP 200 successfully — the main inventory
  data DID arrive — yet the spinner still never cleared.
- **Timeline:** First time this exact dashboard code (this session's
  branch `codex/studio-publication-workflow`, PR #12, quick task
  260729-f3r-01 — atomic publication workflow + WR-07/WR-08 inventory
  generation-guard fixes) has been run against a live `sanity dev` server.
  All 257 unit tests pass; this is the first *live* exercise.
- **Reproduction:** `cd sanity && npm run dev`, open http://localhost:3333,
  land on "Tableau de bord" — reproduces every time, in two independent
  browser environments.

## Current Focus

hypothesis: >
  In `sanity/editorial/EditorialDashboard.tsx`, the main dashboard load
  effect (~line 116-172) only calls `setLoading(false)` inside a
  `.finally()` chained onto
  `client.fetch(...).then(async (content) => { ...; await
  historyStore.getTransactions(documentIds); ...; await
  userStore.getUsers(authorIds); ... })`. The inner `await`s are wrapped in
  a try/catch, but if `historyStore.getTransactions` or
  `userStore.getUsers` HANG (never resolve, never reject — as opposed to
  throwing) rather than erroring, the `async` function passed to `.then()`
  never returns, so the promise chain's `.finally()` never fires, and
  `loading` stays `true` forever — even though the primary `content` fetch
  already succeeded (confirmed via the 200 response above). This coupling
  of primary-content loading to a supplementary activity-feed fetch
  predates this session's changes (git blame: commit 2d7450c "feat: enrich
  recent dashboard activity"), but is newly exposed as a blocking failure
  now that this is the default landing tool being exercised live for the
  first time.
test: >
  Reproduce via a minimal Node/Sanity-client script (or targeted
  instrumentation) that calls `historyStore.getTransactions` /
  `userStore.getUsers` equivalents against the real `gwz8iug4`/`production`
  project the same way the dashboard effect does, and observe whether the
  call ever settles. Also check the Sanity SDK version installed
  (`sanity@6.4.0` per package.json, "runtime version 6.8.0" per the
  studio's own auto-update notice) for known history-store hangs, and
  check whether history/transactions requests appear in the network panel
  at all (in the agent's sandboxed session, NO request matching
  history/transactions ever appeared — not even pending — which is itself
  a clue worth explaining).
expecting: >
  If the hypothesis is correct, either the history/transaction fetch never
  issues an underlying network request at all (suggesting an internal SDK
  stall, e.g. waiting on a WebSocket-based channel that's failing per the
  console warning above), or it issues one that never completes. Either
  way, decoupling `setLoading(false)` from the activity-feed await (so the
  spinner clears as soon as `content` arrives, with `activities` populated
  asynchronously afterward, matching the existing `hasDataRef.current`
  fallback pattern already used elsewhere in the same effect) should fix
  the user-visible symptom regardless of the exact reason the activity
  feed stalls.
next_action: >
  Apply fix: decouple setLoading(false) from the historyStore/userStore
  activity-feed awaits in the main load effect, so the spinner clears as
  soon as primary content arrives; run the existing dashboard-logic unit
  suite; request human verification against the live sanity dev server.

reasoning_checkpoint:
  hypothesis: >
    The dashboard spinner never clears because setLoading(false) only runs
    inside a .finally() chained onto a promise whose .then() callback
    internally awaits historyStore.getTransactions(...) and (conditionally)
    userStore.getUsers(...); those calls resolve to lastValueFrom()-wrapped
    Observables / requestAnimationFrame-batched DataLoader promises that can
    hang (never resolve, never reject) without erroring, and a hang there
    silently prevents .finally() — and therefore setLoading(false) — from
    ever running, even though the primary content query already succeeded.
  confirming_evidence:
    - "Direct read of EditorialDashboard.tsx lines 116-172: setLoading(false) exists only in .finally(), and getTransactions/getUsers are awaited inside the same .then() callback, inside a try/catch that only catches rejections."
    - "Direct read of sanity@6.4.0 source (confirmed to be the actual runtime, not a CDN-streamed newer version): client.request() = lastValueFrom(observable), which by rxjs contract hangs forever if the source observable never completes — a structurally real hang vector, not speculation."
    - "User confirmed spinner never clears in two independent real browser sessions against the same live server; network panel confirmed the primary content query already returned 200 while the spinner was still stuck — proving the primary data path is not the blocker."
  falsification_test: >
    After decoupling, if the spinner still never clears on the live
    sanity dev server (human-verify checkpoint), this hypothesis is wrong
    and the block is happening somewhere before/outside this effect
    entirely (e.g. a render-blocking error, or the tool never mounting).
  fix_rationale: >
    Move setLoading(false) to fire immediately once the primary content
    promise settles (success or failure), and run the
    historyStore/userStore activity-feed fetch as an independent,
    unawaited chain that only updates `activities` state when/if it
    settles. This targets the actual root cause (loading-state coupled to
    a non-essential fetch with no timeout) rather than papering over one
    specific hang cause — it fixes the symptom regardless of whether the
    supplementary fetch hangs, is slow, or rejects, matching the
    resilience pattern the same effect already uses for outright fetch
    failures (hasDataRef.current / catch handler).
  blind_spots: >
    Could not empirically reproduce the historyStore hang from this agent
    session (no browser tool, no auth token available) to confirm the
    EXACT SDK-level trigger — relying on human-verify to confirm the fix
    resolves the live symptom. If the real cause is upstream of this
    effect (e.g., the tool component itself failing to mount), this fix
    would not help and the falsification test above would catch that.

## Evidence

- timestamp: 2026-08-01T00:20:00Z
  checked: >
    sanity/editorial/EditorialDashboard.tsx lines 1-205 (full load effect +
    imports) and sanity/node_modules/sanity/lib/_chunks-es/index2.js
    (createHistoryStore/getTransactions, createUserStore/getUsers,
    useHistoryStore, useUserStore implementations for the installed
    sanity@6.4.0 package — confirmed this IS the version actually executed
    by `sanity dev`, not a CDN-streamed newer version: `autoUpdates: true`
    in sanity.cli.ts only affects `sanity deploy`/`sanity build` hosted
    Studios per Sanity's own docs, not local `sanity dev`, so the "runtime
    version 6.8.0" Studio banner is an update-available notice, not the
    code actually running).
  found: >
    `historyStore.getTransactions(documentIds)` (line 143) calls
    `client.request({url, query})` which is `lastValueFrom(_request(...))`
    from @sanity/client — a Promise that resolves only when the underlying
    rxjs Observable both emits AND completes; if that Observable never
    completes it hangs forever (neither resolves nor rejects), by design of
    `lastValueFrom`. `userStore.getUsers` similarly awaits a `DataLoader`
    batch that is scheduled via `requestAnimationFrame` — a separate
    hang-risk mechanism if rAF batching stalls, though this is reached only
    after getTransactions resolves so is secondary here. Both calls are
    inside a single `try { ... await ... await ... }` block whose `catch`
    only fires on REJECTION, never on a hang.
  implication: >
    Confirms mechanically (not by inference) that ANY hang in either await
    — for whatever underlying SDK/network/auth reason — leaves the
    `async` function passed to `.then()` permanently unresolved, so the
    chained `.finally(() => setLoading(false))` never runs. This is an
    architectural coupling bug: primary dashboard readiness is gated on a
    non-essential supplementary fetch with no timeout.

- timestamp: 2026-08-01T00:25:00Z
  checked: >
    git history of sanity/editorial/EditorialDashboard.tsx — `git log -S
    "historyStore.getTransactions"` and `git diff ac634b1^ HEAD --
    EditorialDashboard.tsx` (diff of this session's quick-260729-f3r-01
    commits against their base).
  found: >
    The historyStore/userStore-based activity feed was introduced at
    commit 3bff5d7 (2026-07-20), predating this session by over a week —
    NOT newly added by this session. This session's commits (WR-07/WR-08
    inventory-generation-guard work) added `inventoryGenerationGuard.start
    /accept/isCurrent` gating around `setDocuments`/`setActivities`, but
    left the historyStore/userStore await-inside-try/catch-inside-.then()
    control flow structurally unchanged — the hang risk predates this
    session and was not introduced by it.
  implication: >
    Rules out "this session's generation-guard changes caused the hang" as
    the mechanism (the guard functions are synchronous, cannot hang, and
    the surrounding control flow is unchanged). The bug is the pre-existing
    architectural coupling identified above, newly exposed now that this
    is the first live `sanity dev` exercise of the default landing tool
    against the real gwz8iug4/production dataset in this environment.

- timestamp: 2026-08-01T00:28:00Z
  checked: >
    Whether a live/instrumented Node reproduction against the real
    gwz8iug4/production history endpoint was feasible from this agent
    session.
  found: >
    Not feasible — the Studio's browser session is cookie-authenticated
    (no static token available to this agent; reading local Sanity CLI
    auth config was correctly blocked by the environment's credential-file
    policy, and no browser-automation tool was available to this
    continuation agent, unlike the prior session that produced the
    original network-panel evidence in Symptoms).
  implication: >
    The exact SDK-level trigger for why getTransactions specifically
    stalls (vs. the primary content query succeeding) cannot be
    conclusively isolated from this agent session. Proceeding on the
    mechanically-confirmed architectural coupling bug (see first evidence
    entry above), which is sufficient to fix the user-visible symptom
    regardless of the precise upstream cause, consistent with the
    pre-existing `hasDataRef.current`/`.catch()` resilience pattern already
    used in the same effect for fetch failures (just not previously
    extended to cover fetch hangs).

## Eliminated

- hypothesis: >
    This session's inventory-generation-guard changes
    (createInventoryGenerationGuard/accept/isCurrent) introduced the hang.
  evidence: >
    `accept`/`isCurrent`/`start` are fully synchronous, no I/O, cannot
    hang. `git diff ac634b1^ HEAD` shows the historyStore/userStore
    await-in-try/catch-in-.then() structure is byte-for-byte unchanged by
    this session; only the setDocuments/setActivities application points
    gained generation checks around them.
  timestamp: 2026-08-01T00:26:00Z

## Resolution

root_cause: >
  In sanity/editorial/EditorialDashboard.tsx's main dashboard-load effect,
  `setLoading(false)` only ran inside a `.finally()` chained onto a promise
  whose `.then()` callback awaited `historyStore.getTransactions(...)` and
  (conditionally) `userStore.getUsers(...)` to build the activity feed.
  Both calls resolve via rxjs `lastValueFrom()`/DataLoader mechanisms that
  can hang (neither resolve nor reject) without throwing. A hang there
  silently prevented `.finally()` — and therefore `setLoading(false)` —
  from ever running, even though the primary content query had already
  succeeded (confirmed via network inspection: 200 response). This
  architectural coupling (primary readiness gated on a non-essential,
  timeout-less supplementary fetch) predates this session
  (introduced 2026-07-20, commit 3bff5d7) and was not caused by this
  session's inventory-generation-guard changes (verified via git diff —
  those changes are fully synchronous and left this control flow
  structurally unchanged).
fix: >
  Decoupled `setLoading(false)` from the historyStore/userStore
  activity-feed awaits. The primary content `.then()` now calls
  `setLoading(false)` immediately once the primary query settles
  (success or failure), before touching the activity feed. The
  historyStore/userStore work now runs as an independent,
  fire-and-forget `.then().catch()` chain (still guarded by
  `cancelled`/`inventoryGenerationGuard.isCurrent()`) that only updates
  `activities` state whenever/if it eventually settles — matching the
  existing `hasDataRef.current` resilience pattern already used elsewhere
  in the same effect for outright fetch failures, now extended to cover
  fetch hangs too.
verification: >
  Self-verified: full unit suite (256/256, `npm run test:unit`) passes
  unchanged; `npx tsc --noEmit` shows zero new type errors (the 4
  pre-existing errors in dashboardLogic.ts/workflow.tsx are identical on
  HEAD before this change, confirmed via `git stash` A/B diff, and belong
  to concurrent debug sessions / unrelated code); `npx eslint
  editorial/EditorialDashboard.tsx` clean.
  Human-verified 2026-08-01: user reloaded http://localhost:3333/dashboard
  against the live `sanity dev` server (same branch) and confirmed the
  dashboard now renders full content instead of spinning forever —
  "1 brouillon en cours", "Mettre le site à jour", "À faire maintenant"
  with 4 prioritized items, and "Activité récente" correctly populated
  with real entries (e.g. "il y a 19 min Florian a modifié les réglages du
  site"). The activity feed is confirmed non-blocking AND populating
  correctly — not merely gracefully degraded.
files_changed:
  - sanity/editorial/EditorialDashboard.tsx
commit: a79f576
