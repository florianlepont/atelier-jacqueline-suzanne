# Quick Task: Auto-open Checklist inspector on incomplete documents — Research

**Researched:** 2026-07-22
**Domain:** Sanity Studio v6 document pane extension (React admin UI)
**Confidence:** HIGH (verified against installed `sanity@6.4.0` source in `node_modules`)

## Summary

The auto-open behavior is achievable with a small, **invisible `DocumentBadgeComponent`** registered
in `sanity.config.ts`'s existing `badges` resolver (`resolveBadges` in `editorial/workflow.tsx`). In
Sanity, badge functions are executed through the same `GetHookCollectionState` machinery as document
actions — i.e. **they run as React hooks**, mounted as descendants of `DocumentPaneProvider`. That
means a badge can legally call `useDocumentPane()`, `useEffect`, and `useRef`, fire a one-time side
effect on document open, and return `null` so it renders nothing.

`openInspector('checklist')` is the correct call. It is stable API (exported from `sanity/structure`
via `useDocumentPane()`), and it writes the inspector into the pane router params (`?inspect=checklist`).
The "don't reopen after manual close in the same session" requirement is satisfied by a `useRef` guard
keyed by `documentId` that is set **before** calling `openInspector` and gates on the pane's `ready`
flag — so the open fires at most once per document-pane mount, regardless of later edits or a manual close.

**Primary recommendation:** Add an invisible `DocumentBadgeComponent` (e.g. `AutoOpenChecklistBadge`)
that returns `null`, prepend it in `resolveBadges` for `checklistEnabledTypes`, and put the one-shot
`openInspector('checklist')` effect inside it. Do **not** use `document.components.unstable_layout`
(marked `@internal`), a custom view (only renders when its tab is active), or mutate the inspector's
`useMenuItem` (muddies concerns and only mounts when the toolbar action is present).

## Key Findings (per research question)

### Q1 — Where should the effect live? Is a badge inside `DocumentPaneProvider`?

**Yes.** `[VERIFIED: node_modules/sanity/lib/_chunks-es/structureTool.js]`
- `DocumentBadges()` itself calls `useDocumentPane()` (structureTool.js:~5901) and renders
  `RenderBadgeCollectionState` → `GetHookCollectionState({hooks: badges, args: badgeProps})`
  (structureTool.js:~5905, ~10593). Badges are therefore invoked **as hooks**, as descendants of the
  provider — `useDocumentPane()` resolves, and `useEffect`/`useRef` are allowed. This is the same
  mechanism `resolveActions` (already in this project) relies on.
- `useDocumentPane` is a real public export of `sanity/structure` (structure.js:604, structure.d.ts).
- The badge receives `editState` as its props (`{id, type, draft, published, liveEdit, ready, ...}`),
  matching how the project's existing `CompletenessBadge` reads `{draft, published}`.

Alternatives rejected:
- `document.components.unstable_layout` exists (`ActiveWorkspaceMatcherContext.d.ts:16880`) but is typed
  `@internal` inside a `@internal` `components` key — unsupported, avoid. `[VERIFIED: types.d.ts]`
- A custom document **view** only mounts when its tab is the active view — wrong lifecycle for
  "on open." `[VERIFIED: DocumentPaneContextValue.views]`
- The inspector's own `useMenuItem` runs inside the pane too, but only when the toolbar action is
  rendered, and mixing a navigation side-effect into a menu-item resolver is poor separation.

### Q2 — Fire `openInspector('checklist')` exactly once per document, no re-trigger

Use a `useRef` guard keyed by `documentId`, set **before** the open, gated on `ready`:

```tsx
// editorial/workflow.tsx (or a new editorial/AutoOpenChecklist.tsx)
import {useEffect, useRef} from 'react'
import type {DocumentBadgeComponent} from 'sanity'
import {useDocumentPane} from 'sanity/structure'
import {getDocumentChecks, summarizeChecks} from './checks'
import {checklistEnabledTypes} from './DocumentChecklist'

// Renders nothing — it only exists to run a one-shot side effect inside the
// document pane. Registered via resolveBadges alongside the visible badges.
const AutoOpenChecklistBadge: DocumentBadgeComponent = (props) => {
  const {documentId, documentType, ready, openInspector, inspector} = useDocumentPane()
  const value = (props.draft ?? props.published ?? {}) as Record<string, unknown>
  const summary = summarizeChecks(getDocumentChecks(documentType, value))
  const handledRef = useRef<string | null>(null)

  useEffect(() => {
    if (!ready) return                          // wait until draft/published loaded
    if (handledRef.current === documentId) return // decide once per document
    handledRef.current = documentId             // mark BEFORE opening → never reopens
    if (!checklistEnabledTypes.has(documentType)) return
    if (inspector) return                        // respect a deep-linked/other open inspector
    if (!summary.requiredComplete) openInspector('checklist')
  }, [ready, documentId, documentType, summary.requiredComplete, inspector, openInspector])

  return null // invisible badge
}
```

Register it (prepend, so it mounts for the same types):

```tsx
export const resolveBadges: DocumentBadgesResolver = (prev, context) =>
  [...checklistEnabledTypes].includes(context.schemaType)
    ? [AutoOpenChecklistBadge, CompletenessBadge, CollectionStatusBadge, ...prev]
    : prev
```

Why this is once-per-document and reset-per-document: navigating to another document remounts the pane
(new `documentId`); even if the hook instance persisted, `handledRef.current !== documentId` re-arms it
for the new doc. Setting the ref before `openInspector` means later renders early-return at the guard.

### Q3 — URL reflection & "session" meaning

`openInspector` → `setInspectorName(name)` **and** `setParams({..., inspect: name})`
(structureTool.js:~8864–8893). So **yes**, it reflects into the pane router URL as `?inspect=checklist`;
manual close sets `inspect: void 0` (structureTool.js:~8843–8858). Implications:
- "Same session" here should mean **as long as this document-pane instance stays mounted** — exactly
  what the `handledRef` covers. A full page reload is a new session; re-opening then is acceptable
  (and arguably desirable) for the stated requirement.
- **Respect deep links:** if the user arrives with `?inspect=<something>`, `inspector` will be non-null
  on first ready render — the `if (inspector) return` guard prevents overriding it. `[VERIFIED]`

### Q4 — Render-loop / infinite-reopen risk

No loop. The effect depends on `summary.requiredComplete` (which can flip true↔false during editing),
but the `handledRef.current === documentId` early-return (set on the first `ready` pass) blocks every
subsequent invocation for that document. `openInspector` is a memoized callback in the compiled source
(deps: currentInspector/inspectors/params/setParams), so its identity changing across renders is
harmless given the guard. `[VERIFIED: structureTool.js:8864]`

### Q5 — Version-specific pitfalls (`sanity@6.4.0`)

- Installed `sanity` is **6.4.0** (verified via `node_modules/sanity/package.json`). `useDocumentPane`,
  `openInspector`, `closeInspector`, and the inspectors config are all present and stable in this build.
- The **inspectors API is still `@beta`** (`DocumentPluginOptions.inspectors` is `@hidden @beta` at
  `ActiveWorkspaceMatcherContext.d.ts:16487`). It works and the project already ships two inspectors,
  but treat as beta — pin the `sanity` version and re-verify on upgrade.
- **Loading false-positive:** during the brief load window `useEditState`/badge props are empty `{}`,
  which `summarizeChecks` reads as incomplete. Gating on `ready` (from `useDocumentPane`) avoids opening
  the panel for an already-complete document that just hasn't finished loading. Do not skip this gate.
- React 19.2.4 — no concern; hooks pattern above is standard.

## Recommendation (exact change)

1. Add `AutoOpenChecklistBadge` (invisible, returns `null`) — either in `editorial/workflow.tsx`
   next to the existing badges, or a new `editorial/AutoOpenChecklist.tsx` exporting it.
2. Prepend it in `resolveBadges` for `checklistEnabledTypes` (import the set from `DocumentChecklist.tsx`
   to keep a single source of truth; note `resolveBadges` currently hardcodes its own type list —
   align them or reuse `checklistEnabledTypes`).
3. No change to `sanity.config.ts` needed beyond what `resolveBadges` already wires (`badges: resolveBadges`).
4. No new dependencies. No schema change.

## Pitfalls to verify in implementation

- **Gate on `ready`** — otherwise complete docs briefly look incomplete and flash the panel open.
- **Set `handledRef` before `openInspector`**, not after — prevents a re-entrant reopen and any race.
- **`if (inspector) return`** — do not clobber a deep-linked or user-opened inspector.
- **Keep the badge returning `null`** — it is a side-effect host, not a visible badge; confirm it does
  not add an empty chip to the status bar (it won't: `null` badges are skipped, as `CollectionStatusBadge`
  already demonstrates).
- Reuse `checklistEnabledTypes` so the auto-open set can never drift from the set of types that actually
  register `checklistInspector` in `sanity.config.ts` (registering the inspector and mounting the badge
  must cover the same types, or `openInspector('checklist')` would warn `No inspector named "checklist"`).

## Sources

### Primary (HIGH confidence — installed source)
- `sanity/node_modules/sanity/lib/_chunks-es/structureTool.js` — `openInspector`/`closeInspector` impl
  (URL/param reflection), `DocumentBadges` calling `useDocumentPane`, `GetHookCollectionState` badge hook execution.
- `sanity/node_modules/sanity/lib/_chunks-dts/types.d.ts` — `DocumentPaneContextValue` (openInspector, inspector, ready).
- `sanity/node_modules/sanity/lib/structure.{js,d.ts}` — `useDocumentPane` public export.
- `sanity/node_modules/sanity/lib/_chunks-dts/ActiveWorkspaceMatcherContext.d.ts` — `DocumentPluginOptions`
  (`badges`, `inspectors @beta`), `unstable_layout @internal`.
- `sanity/package.json` + `node_modules/sanity/package.json` — version 6.4.0.
- Project files: `sanity/editorial/DocumentChecklist.tsx`, `sanity/editorial/workflow.tsx`,
  `sanity/editorial/OpenSitePage.tsx`, `sanity/sanity.config.ts`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `ready` from `useDocumentPane` reliably reflects that draft/published have loaded | Q5 / Pitfalls | Low — if `ready` fires early, worst case is a spurious open; add a `props.draft ?? props.published` non-empty check as backup |

All other claims are `[VERIFIED]` against installed source.
