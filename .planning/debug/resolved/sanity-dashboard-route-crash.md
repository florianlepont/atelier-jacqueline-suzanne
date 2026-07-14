---
status: resolved
trigger: >
  Sanity Studio crashes at localhost:3333 with "Unable to find matching route
  for state. Could not map the following state keys to a valid url: 'tool',
  'dashboard'" - a full white-screen crash, not recoverable without a
  retry/reload.
created: 2026-07-14
updated: 2026-07-14T10:05:00Z
---

# Debug Session: sanity-dashboard-route-crash

## Symptoms

- **Expected behavior:** Opening the "Dashboard" tool in Sanity Studio (localhost:3333) shows the editorial dashboard (deployment status, content checks, quick links) without error.
- **Actual behavior:** Full white-screen crash with "The dashboard tool crashed" / "An error occurred that Sanity Studio was unable to recover from." Router error: `Unable to find matching route for state. Could not map the following state keys to a valid url: "tool", "dashboard"`.
- **Error messages:** See trigger above. Stack trace shows `_resolvePathFromState` / `useStateLink` inside Sanity's router package (`node_modules/.sanity/vite/deps/router-*.js`), invoked from a React render (`react_stack_bottom_frame` → `renderWithHooks` → ... → `performSyncWorkOnRoot`).
- **Timeline:** First noticed today (2026-07-14), immediately after the Sanity Studio config changes from `feat/sanity-navigation-icons` were merged into `main` (commits `9e47eef` "feat: clarify Sanity navigation icons" and `c1d92a3` "feat: make the Sanity dashboard action-oriented", merged via `5c32908`). Those commits added/renamed a custom Studio tool named `dashboard` (`sanity/sanity.config.ts:32`), backed by `sanity/editorial/EditorialDashboard.tsx` and `sanity/schemas/structure.ts`.
- **Reproduction:** Studio loads fine initially. Crash happens specifically when navigating to/opening the "Dashboard" tool (not on cold Studio load, not on other tools).
- **Retry behavior:** Clicking "Retry" does not recover — the crash persists.

## Current Focus

reasoning_checkpoint:
  hypothesis: "`<ToolLink name=\"media\">` (added to EditorialDashboard.tsx in commit c1d92a3, 'Actions rapides' quick action) crashes the router because it is rendered *inside* the 'dashboard' tool's own component, which Studio wraps in `<RouteScope scope=\"dashboard\">`. RouteScope's `resolveNextParentState` unconditionally nests whatever next-state a descendant StateLink/ToolLink provides under the CURRENT scope key (here 'dashboard'), instead of replacing the top-level `tool` key. So clicking/rendering the ToolLink builds full router state `{tool: 'dashboard', dashboard: {tool: 'media', media: undefined}}`. The 'dashboard' tool has no `router` config (leaf route, no children), so it cannot map the nested `{tool:'media', media:undefined}` object under its own scope, and `_findMatchingRoutes` fails at every level down the tree. Because failures don't propagate their specific unmappable keys upward, `_resolvePathFromState` throws using the ROOT node's own top-level remaining keys, which are always exactly `['tool','dashboard']` for this workspace (single top-level `tool` + `dashboard` keys) — this is why the error text is generic and doesn't name the real 'media' culprit."
  confirming_evidence:
    - "Read sanity/node_modules/sanity/lib/router.js `_findMatchingRoutes`/`_resolvePathFromState` (lines 175-218): any error anywhere in the route tree bubbles up as the OUTERMOST node's own `createMatchError(node, [], remainingParams)`, discarding the deeper node's actual unmappable keys — so the thrown message text is identical ('tool', 'dashboard') no matter which nested link/key actually caused it."
    - "Read sanity/node_modules/sanity/lib/_chunks-es/index2.js `createRouter` (line 79674): top-level route is `/:tool` whose dynamic children resolve to `route.scope(tool.name, '/', tool.router)`. The 'dashboard' tool (sanity/sanity.config.ts:32-36) has no `router` property, so its scoped node is a bare leaf with no children -> any non-empty state under `state.dashboard` is unmappable."
    - "Read sanity/node_modules/sanity/lib/router.js `RouteScope` (lines 620-677): `resolveNextParentState` computes `nextParentState = addScope(parentStateRef.current, scope, nextState)` i.e. `{...parentStateRef.current, [scope]: nextState}` — it ALWAYS writes the descendant's next-state under the enclosing scope's own key ('dashboard'), never replaces the top-level `tool` key, regardless of what `tool` value the descendant's state contains."
    - "Read sanity/node_modules/sanity/lib/router.js `ToolLink` (lines 70936-70950): constructs `state = {tool: name, [name]: void 0}` (e.g. `{tool:'media', media: undefined}`) and passes it through `useStateLink` -> `resolvePathFromState` (the CONTEXTUAL/scoped router, overridden by RouteScope) — unlike `IntentLink`, which uses `resolveIntentLink` bound directly to the root `routerProp.encode(...)` and is NOT affected by RouteScope's override (confirmed via `RouterProvider`/`RouteScope`'s childRouter object spread: only `navigate`/`resolvePathFromState`/`state` are overridden, `resolveIntentLink` and `navigateUrl` pass through untouched)."
    - "git show c1d92a3 confirms `ToolLink` import + `<ToolLink name=\"media\">` usage inside EditorialDashboard.tsx's 'Actions rapides' grid is NEW in this commit (previously the file only imported `useClient` from 'sanity', not `ToolLink`); the crash was first observed immediately after this commit merged. All other links in the file (`IntentLink` for create/edit) pre-existed and are unaffected per the resolveIntentLink bypass above."
  falsification_test: "If this hypothesis is correct, removing/replacing the `<ToolLink name=\"media\">` element (the only StateLink-family component rendered inside the active 'dashboard' tool view) should make the Dashboard tool open without crashing, while `IntentLink`-based quick actions and row links continue to work unaffected. If the crash persisted after removing that one element, the hypothesis would be falsified."
  fix_rationale: "Replace `<ToolLink name=\"media\">` (which goes through the RouteScope-affected `resolvePathFromState`) with the plain `<Link href=...>` component from 'sanity/router', which calls `navigateUrl` directly with an explicit, already-resolved absolute path and never touches `resolvePathFromState`/RouteScope nesting at all. This fixes the root cause (wrong routing primitive used for cross-tool navigation from within an active tool's own view) rather than working around the symptom (e.g. it does not touch the 'dashboard' tool's config, or try to give it a router just to avoid the crash, which would be unnecessary complexity for a tool that doesn't need sub-routes)."
  blind_spots: "Cannot start a live `sanity dev` server in this sandbox to click through the UI and directly observe the fix working; verification is static (re-tracing the same router code paths against the new `Link`/`useWorkspace` usage) plus a project TypeScript/build check. Also assuming `basePath` defaults to '/' for this single-workspace config (confirmed via sanity.config.ts having no `basePath` override), so `${basePath}media` is a valid absolute href without complex path-joining logic."

hypothesis: CONFIRMED (see reasoning_checkpoint above) — proceeding to fix.
test: Replace ToolLink with Link+useWorkspace in EditorialDashboard.tsx; verify via project type-check/build.
expecting: Type-check passes; router-state reasoning shows no more 'dashboard'-scope nesting for the media quick action.
next_action: Apply fix to sanity/editorial/EditorialDashboard.tsx (swap `ToolLink` for `Link` + `useWorkspace().basePath`), then run project build/typecheck for the sanity/ package.

## Evidence

- timestamp: 2026-07-14T09:20:00Z
  checked: sanity/sanity.config.ts (tool registration, full file)
  found: 'dashboard' tool registered with `name: 'dashboard'`, `component: EditorialDashboard`, no `router` property. 'media' tool likewise has no `router`. Tool names match consistently across sanity.config.ts.
  implication: Both custom tools are simple "leaf" tools with no sub-routing — their own router-state slice must always resolve to an empty object, or resolvePathFromState fails.

- timestamp: 2026-07-14T09:25:00Z
  checked: sanity/schemas/structure.ts (full file) — any reference to a 'dashboard' route/link
  found: No references to 'dashboard' at all; structure.ts only defines the desk/document structure and document views (form/checklist/content-preview), unrelated to the top-level tool router.
  implication: The crash is not caused by structure.ts / desk structure — ruled out that avenue.

- timestamp: 2026-07-14T09:30:00Z
  checked: sanity/editorial/EditorialDashboard.tsx (full file, as committed)
  found: Imports `ToolLink` from 'sanity' and renders `<ToolLink name="media">` unconditionally in the "Actions rapides" grid, alongside several `<IntentLink intent="create"/"edit">` elements (in QuickIntentAction, ContentRow, RecentRow).
  implication: ToolLink is the one non-intent-based cross-tool navigation primitive rendered directly inside the dashboard tool's own view — prime suspect given it must resolve to a URL as soon as the Dashboard tool mounts (matches "crash happens specifically when navigating to/opening the Dashboard tool").

- timestamp: 2026-07-14T09:40:00Z
  checked: sanity/node_modules/sanity/lib/router.js `_findMatchingRoutes` / `_resolvePathFromState` (lines 175-218)
  found: `_resolvePathFromState` throws using ONLY the outermost node's own captured `remainingParams` as `unmappableStateKeys`, regardless of which deeper node in the route tree actually failed to match. For this Studio's route tree (root has no param segments, single `tool` child, remaining top-level keys are always `['tool', '<active-tool-name>']`), ANY unmappable state anywhere under the active tool's own scope always produces the exact literal error text: `Could not map the following state keys to a valid url: "tool", "dashboard"`.
  implication: The generic, non-specific error message is fully explained — it does NOT literally mean 'tool' and 'dashboard' as concepts are broken; it means SOME state nested under the active 'dashboard' tool's scope couldn't be mapped, and the true offending key is invisible in the message.

- timestamp: 2026-07-14T09:45:00Z
  checked: sanity/node_modules/sanity/lib/_chunks-es/index2.js `createRouter` (line 79674)
  found: Root route is `route.create('/:tool', (toolParams) => { ...; return tool ? route.scope(tool.name, '/', tool.router) : route.create('/') })`. For 'dashboard' (`tool.router` undefined), this produces a bare leaf node scoped to 'dashboard' with NO children — any non-empty state under `state.dashboard` is unmappable (no children to consume leftover keys).
  implication: Confirms the 'dashboard' tool's scoped router slice must always be exactly `{}` to resolve successfully — any nested content under `state.dashboard` guarantees this crash.

- timestamp: 2026-07-14T09:50:00Z
  checked: sanity/node_modules/sanity/lib/router.js `RouteScope` (lines 620-677) and `ToolLink`/`useStateLink` (lines 70936-70950, 680-711)
  found: `RouteScope`'s `resolveNextParentState` always nests a descendant's next-state under the ENCLOSING scope's own key (`{...parentStateRef.current, [scope]: nextState}`), never replacing the top-level `tool` key. `ToolLink` builds `state = {tool: name, [name]: void 0}` and resolves its href via `useStateLink` -> the CONTEXTUAL `resolvePathFromState`, which — when rendered inside the active 'dashboard' tool's view (wrapped in `<RouteScope scope="dashboard">` by Studio's `ActiveToolLayout`) — is the RouteScope-overridden version, not the root's.
  implication: Clicking/rendering `<ToolLink name="media">` from *inside* the dashboard tool's own component computes full router state `{tool: 'dashboard', dashboard: {tool: 'media', media: undefined}}` instead of `{tool: 'media', media: undefined}` — exactly the malformed nested shape that produces the observed crash. `IntentLink` is unaffected because it resolves via `resolveIntentLink`, which is bound directly to the root router and is NOT overridden by RouteScope.

- timestamp: 2026-07-14T09:55:00Z
  checked: git show c1d92a3 -- sanity/editorial/EditorialDashboard.tsx (full diff)
  found: `ToolLink` import and the `<ToolLink name="media">` "Photos et crédits" quick action are new additions in this commit (previous version of the file only imported `useClient` from 'sanity', no ToolLink usage anywhere). This commit is one of the two identified in Symptoms.timeline as immediately preceding the first observed crash.
  implication: Confirms timeline match — this is the change that introduced the crash, consistent with all router-mechanism evidence above.

- timestamp: 2026-07-14T10:00:00Z
  checked: sanity/node_modules/sanity/lib/router.d.ts (exports) and sanity/node_modules/sanity/lib/_chunks-dts/ActiveWorkspaceMatcherContext.d.ts (Workspace interface, ~line 17202-17210)
  found: `Link` (plain, `href`-based, bypasses resolvePathFromState/RouteScope entirely via `useLink`'s `navigateUrl`) is exported from 'sanity/router'. `useWorkspace()` (exported from 'sanity') returns a `Workspace` object with a required `basePath: string` field.
  implication: `Link` + `useWorkspace().basePath` is a type-safe, RouteScope-immune replacement for the broken `ToolLink` usage — confirmed viable fix primitive.

## Eliminated

- hypothesis: Tool name mismatch between sanity.config.ts and structure.ts/other references (original initial hypothesis)
  evidence: sanity.config.ts and structure.ts contain no conflicting or mismatched 'dashboard' tool name references; structure.ts doesn't reference the dashboard tool at all. Confirmed via full read of both files.
  timestamp: 2026-07-14T09:35:00Z

## Resolution

root_cause: >
  `<ToolLink name="media">` in sanity/editorial/EditorialDashboard.tsx (added in commit
  c1d92a3) is rendered inside the active 'dashboard' tool's own view, which Studio wraps in
  `<RouteScope scope="dashboard">`. ToolLink/StateLink resolve their href through the
  CONTEXTUAL `resolvePathFromState`, which RouteScope overrides to always nest a
  descendant's next-state under the enclosing scope's own key instead of replacing the
  top-level `tool` key (`sanity/node_modules/sanity/lib/router.js` `RouteScope.
  resolveNextParentState`, lines 620-677). So clicking/rendering the media ToolLink from
  inside the dashboard tool computes full router state
  `{tool: 'dashboard', dashboard: {tool: 'media', media: undefined}}` instead of
  `{tool: 'media', media: undefined}`. Since the 'dashboard' tool has no `router` config
  (`sanity/sanity.config.ts`), its scoped route node is a bare leaf with no children, so the
  nested `{tool:'media', media:undefined}` object can't be mapped to a URL. The router's
  error-bubbling always reports the outermost node's own remaining keys
  (`_findMatchingRoutes`/`_resolvePathFromState`, `router.js` lines 175-218), which for this
  single-workspace config are always exactly `tool` and `dashboard` — explaining the
  generic, misleading error text that named neither the real culprit ('media') nor the
  real mechanism (RouteScope nesting).
fix: >
  Replaced `<ToolLink name="media">` with `<Link href={...}>` (from 'sanity/router'), which
  resolves its href from an explicit, already-resolved absolute path via `navigateUrl` and
  never touches `resolvePathFromState`/RouteScope at all. The href is built from
  `useWorkspace().basePath` + '/media' so it stays correct if the Studio's basePath is ever
  changed. `IntentLink` usages elsewhere in the file were left untouched — they resolve via
  `resolveIntentLink`, which is bound directly to the root router and is unaffected by
  RouteScope's override, so they were never broken.
verification: >
  Static: re-traced the same router code paths (RouteScope, ToolLink, StateLink, Link,
  createRouter) confirming the new Link+useWorkspace usage bypasses the RouteScope nesting
  bug entirely, and that IntentLink usages are unaffected. Confirmed `useWorkspace` and
  `Link` are real runtime exports from 'sanity' / 'sanity/router' (not just type-only) via
  sanity/node_modules/sanity/lib/index.js and router.js export lists, and that
  `Workspace.basePath: string` is a valid, required field on the object useWorkspace()
  returns. TypeScript: `npx tsc --noEmit -p tsconfig.json` in sanity/ introduces zero new
  errors versus the pre-fix committed file (confirmed by diffing tsc output against the
  stashed/original file — the 4 pre-existing `Badge mode="light"` errors are unchanged and
  unrelated to this fix). Lint: `npx eslint editorial/EditorialDashboard.tsx` reports no
  issues. Could not start a live `sanity dev` (port 3333) session in this sandbox to click
  through the UI directly — awaiting human verification in a real Studio session.

  HUMAN VERIFICATION (2026-07-14T10:05:00Z): User opened the Dashboard tool in a real
  `sanity dev` (localhost:3333) session and confirmed the fix — no crash, "confirmed fixed".
files_changed:
  - sanity/editorial/EditorialDashboard.tsx
