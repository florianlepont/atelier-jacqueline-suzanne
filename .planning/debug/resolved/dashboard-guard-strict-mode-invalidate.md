---
status: resolved
trigger: >
  After the spinner-never-clears fix (commit a79f576) and the dashboard
  visual tweaks quick task (260801-d6m) landed, the Sanity Studio dashboard
  went back to an infinite "Chargement…" spinner in a live `sanity dev`
  session — reproducible on every fresh page load, in a brand-new browser
  tab, after killing/restarting the dev server, and after a clean
  `npm ci --prefix sanity`. The primary content GROQ query itself always
  completed successfully (HTTP 200), yet neither `documents` nor `loading`
  ever updated.
created: 2026-08-01
updated: 2026-08-01T10:25:00Z
---

# Debug Session: dashboard-guard-strict-mode-invalidate

## Symptoms

- **Expected behavior:** Opening "Tableau de bord" renders its content
  (publication panel, attention list, activity feed) shortly after load.
- **Actual behavior:** Spinner never clears, every time, on every fresh
  page/tab. Confirmed via direct React fiber inspection (not just visual
  guessing): the `loading` hook stayed `true` and `documents` stayed `[]`
  even though the network panel showed the dashboard's content query
  (`*[_type in $types] | order(_updatedAt desc)`) returning HTTP 200.
- **Timeline:** First observed immediately after merging quick task
  260801-d6m (dashboard visual tweaks) on branch
  `codex/studio-publication-workflow`. Initially suspected to be a stale
  `node_modules` issue (a real, separate problem also found and fixed by
  running `npm ci --prefix sanity`), but the spinner persisted even after
  that was resolved and the dev server was fully restarted.
- **Reproduction:** `cd sanity && npm run dev`, open any fresh tab at
  `/dashboard` — reproduces 100% of the time.

## Current Focus (resolved)

hypothesis: CONFIRMED — see Resolution below.
next_action: none — fix applied, verified live and via full automated
  gate suite.

## Evidence

- timestamp: 2026-08-01T09:55:00Z
  checked: React fiber hook state via `evaluate_script`, walking the DOM
    node containing "Chargement…" up to the `EditorialDashboard` fiber and
    reading its `memoizedState` linked list directly.
  found: hook index 0 (`documents`) was `[]` and hook index 4 (`loading`)
    was `true`, even though the network panel showed the content query
    already completed with HTTP 200 moments earlier.
  implication: the primary fetch's `.then()` handler was never
    successfully updating state — ruled out "still loading" and pointed
    at the accept/isCurrent gate in `inventoryGenerationGuard`.

- timestamp: 2026-08-01T10:00:00Z
  checked: temporary `console.log` instrumentation added directly to
    `sanity/editorial/EditorialDashboard.tsx`'s main content effect,
    logging every `.start()` call's returned generation and the
    `cancelled`/`isCurrent` values at fetch-resolution time.
  found: >
    `effect start, generation=1` -> `effect CLEANUP, generation=1` ->
    `effect start, generation=3` (generation 2 consumed by something
    else) -> `fetch resolved, generation=3, cancelled=false, isCurrent=
    false`. The one fetch that should have succeeded (not cancelled, not
    stale) was rejected by `isCurrent` anyway.
  implication: something other than the main effect was calling
    `inventoryGenerationGuard.start()`/`.invalidate()`, and doing so in a
    way that permanently disabled the guard before its own fetch could
    resolve.

- timestamp: 2026-08-01T10:03:00Z
  checked: added a log inside the separate lifecycle effect at (then)
    `sanity/editorial/EditorialDashboard.tsx` — `useEffect(() => () => {
    inventoryGenerationGuard.invalidate() }, [inventoryGenerationGuard])`.
  found: `invalidate() CALLED` printed exactly between the "generation=1
    cleanup" and "generation=3 start" log lines — i.e. immediately after
    the main effect's own Strict-Mode phantom mount, before the
    "real"/persisting mount even ran.
  implication: React 18 Strict Mode's dev-only mount -> cleanup -> mount
    cycle (which exercises every effect's cleanup once immediately after
    the first mount, to catch effects that aren't safe to re-run) was
    firing this effect's cleanup, which called `guard.invalidate()`.
    `invalidate()` sets a permanent `active = false` with no way back —
    so the phantom cleanup killed the ONE guard instance the component
    would ever use, before its first real fetch could resolve. This bug
    was always latent in the WR-08 generation-guard design (added
    2026-07-29, quick task 260729-f3r-01) but was masked until now: the
    dashboard used to hang on the (now-fixed, see
    `resolved/spinner-never-clears.md`) `historyStore.getTransactions`
    stall before ever reaching this `isCurrent` check.

- timestamp: 2026-08-01T10:08:00Z
  checked: a first fix attempt — moving the invalidate-the-previous-guard
    call inside the `useMemo` factory (via a ref to the prior instance)
    instead of a separate cleanup effect, on the theory that `useMemo`'s
    Strict-Mode double-invoke discards its first result.
  found: still broken — logs showed the memo factory (and, separately,
    `createInventoryGenerationGuard`'s own constructor) running through a
    full extra create/invalidate/create cycle, and the persisting main
    effect ended up closed over a guard that had already been invalidated
    by a sibling render pass mutating the same ref. React's Strict-Mode
    double-invoke behavior for `useMemo` combined with a full
    mount/unmount cycle for `useRef`-backed state in a way that made
    "invalidate whatever the ref points to, from inside the factory" just
    as unsafe as the original cleanup-only version.
  implication: eliminated as the fix; reverted. Confirms this needs a fix
    that does not depend on guessing React's exact Strict-Mode
    double-invoke ordering.

## Eliminated

- hypothesis: Stale `node_modules`/`@sanity/icons` version mismatch was
  the cause of the spinner.
  evidence: `npm ci --prefix sanity` fixed a real, separate build/test
  failure (locked `@sanity/icons@5.2.1` vs. a stale on-disk 3.8.0), and
  all automated gates passed afterward — but the live spinner in the
  browser persisted unchanged through a full dev-server restart, proving
  it was an independent issue.
  timestamp: 2026-08-01T09:50:00Z

- hypothesis: Invalidating "the previous guard instance" from inside the
  `useMemo` factory (via a ref) would be Strict-Mode-safe.
  evidence: see Evidence entry 2026-08-01T10:08:00Z above — still
  reproduced the hang.
  timestamp: 2026-08-01T10:10:00Z

## Resolution

root_cause: >
  `sanity/editorial/EditorialDashboard.tsx` had a dedicated
  `useEffect(() => () => { inventoryGenerationGuard.invalidate() },
  [inventoryGenerationGuard])` whose only job was to invalidate the
  generation guard when the Sanity client changes or the dashboard
  unmounts (added in the WR-08 remediation of quick task
  260729-f3r-01). React 18 Strict Mode (Vite's dev-mode React plugin
  runs every component tree in Strict Mode) intentionally mounts every
  effect, runs its cleanup once, then mounts it again — specifically to
  surface effects whose cleanup isn't safe to run and be followed by a
  fresh setup. This effect's cleanup called `guard.invalidate()`, which
  sets a one-way `active = false` flag inside
  `createInventoryGenerationGuard` (dashboardLogic.ts) with no way to
  reactivate it. Because the setup half of that same effect did nothing,
  the guard was permanently disabled by Strict Mode's dev-only phantom
  cleanup before the dashboard's real, persisting content-loading effect
  ever got a chance to have its fetch resolve — so every subsequent
  `isCurrent()`/`accept()` check failed forever, and `setLoading(false)`
  never ran.
fix: >
  Two-part fix, both in the spirit of "make the cleanup undoable by the
  next setup, rather than trying to detect whether a given
  mount/cleanup/mount cycle is Strict Mode's phantom test or a real
  unmount" (React's own recommended framing for this class of bug):
  (1) `sanity/editorial/dashboardLogic.ts`: added `reactivate()` to
  `createInventoryGenerationGuard`, which simply sets `active = true`
  again — an explicit, symmetric undo for `invalidate()`.
  (2) `sanity/editorial/EditorialDashboard.tsx`: the lifecycle effect now
  calls `inventoryGenerationGuard.reactivate()` in its setup, in addition
  to `invalidate()` in its cleanup. Strict Mode's phantom mount -> cleanup
  -> mount cycle is now a true no-op (reactivate is a no-op on an
  already-active guard; invalidate then reactivate cancel out); a genuine
  final unmount still leaves the guard invalidated for good, because
  nothing calls `reactivate()` again afterward. Also reverted the
  first-attempt fix (moving invalidation into the `useMemo` factory via a
  ref to the previous instance), which the Evidence log above showed was
  not actually Strict-Mode-safe.
verification: >
  Live, repeated: reloaded a fresh Sanity Studio tab against the running
  `sanity dev` server (localhost:3333, same branch) multiple times after
  the fix — the dashboard now renders its full content every time
  (publication panel, "À faire maintenant", "Activité récente" populated
  with real entries), confirmed via both the accessibility tree and a
  full-page screenshot. React fiber inspection re-confirmed `loading` is
  `false` and `documents` is populated after load. Automated: `npm run
  test:unit` (257/257), `npm run lint`, `npm run typecheck` (0 errors),
  `npm --prefix sanity run lint`, `npm --prefix sanity run build` all
  pass on the fixed code. The one existing unit test that exercises
  `invalidate()` directly (`tests/unit/dashboard-logic.test.ts`, "rejects
  every outstanding response after lifecycle invalidation") was
  unaffected since `invalidate()`'s own behavior is unchanged — only a
  new, additional `reactivate()` capability was introduced alongside it.
files_changed:
  - sanity/editorial/dashboardLogic.ts
  - sanity/editorial/EditorialDashboard.tsx
