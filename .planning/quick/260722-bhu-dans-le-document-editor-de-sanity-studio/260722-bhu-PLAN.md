---
phase: quick-260722-bhu
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - sanity/editorial/workflow.tsx
autonomous: false
requirements:
  - 260722-bhu
user_setup: []

must_haves:
  truths:
    - Opening a document whose checklist is incomplete (summary.requiredComplete === false) auto-opens the "Checklist" inspector once, without a manual toolbar click.
    - Manually closing the panel keeps it closed for the rest of that same document-pane session, even while editing continues and requiredComplete flips.
    - Navigating away and back (or a full reload) re-evaluates fresh and re-opens if still incomplete.
    - A document whose checklist is already complete does NOT auto-open the panel.
    - A deep-linked or already-open inspector (?inspect=...) is never clobbered on open.
    - No infinite render loop / no repeated reopen.
  artifacts:
    - sanity/editorial/workflow.tsx (AutoOpenChecklistBadge added, resolveBadges reconciled to checklistEnabledTypes)
  key_links:
    - checklistEnabledTypes (DocumentChecklist.tsx) is the single source of truth shared by resolveBadges (badge mount) AND sanity.config.ts document.inspectors (checklist registration) — the two sets can never drift.
    - handledRef is set BEFORE openInspector so later renders early-return and the panel never snaps back after a manual close.
    - The `ready` gate prevents the loading-flash false positive (empty draft/published reading as incomplete during load).
---

<objective>
In the Sanity Studio document editor, automatically open the "Checklist" inspector panel when the document's checklist is incomplete (`summary.requiredComplete === false`) as soon as the document is opened — instead of requiring the editor to click the toolbar Checklist button. Once opened, if the editor manually closes it while continuing to edit the same document, it must NOT reopen on its own for the rest of that document-pane session; it only re-evaluates fresh when a document is (re)opened (new documentId / new pane mount / full reload).

Purpose: Romane (non-technical) should be nudged toward the missing-required-fields checklist automatically on incomplete documents, without discovering the toolbar button, while never becoming annoying (no reopen after she dismisses it).

Output: An invisible `AutoOpenChecklistBadge` `DocumentBadgeComponent` (returns `null`) added to `sanity/editorial/workflow.tsx`, wired into `resolveBadges`, with `resolveBadges`'s type-gating reconciled to reuse `checklistEnabledTypes` from `DocumentChecklist.tsx`. Studio admin UI only — zero impact on the public Astro build.
</objective>

<execution_context>
@/home/user/ajs-website/.claude/gsd-core/workflows/execute-plan.md
@/home/user/ajs-website/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/quick/260722-bhu-dans-le-document-editor-de-sanity-studio/260722-bhu-RESEARCH.md
@sanity/editorial/workflow.tsx
@sanity/editorial/DocumentChecklist.tsx
@sanity/editorial/checks.ts
@sanity/sanity.config.ts

# Verified facts from RESEARCH.md (do not re-litigate — verified against installed sanity@6.4.0 source):
# - Badge functions run as React hooks mounted inside DocumentPaneProvider, so a badge may call
#   useDocumentPane(), useEffect, useRef. This is the same machinery resolveActions already relies on.
# - useDocumentPane is a public export of 'sanity/structure' and returns {documentId, documentType,
#   ready, openInspector, inspector, ...}.
# - openInspector('checklist') writes ?inspect=checklist into the pane router params; manual close sets
#   inspect: void 0. A null-returning badge renders no chip (CollectionStatusBadge already returns null).
# - The concrete AutoOpenChecklistBadge + resolveBadges sketch lives at RESEARCH.md lines 54-90.
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Add invisible AutoOpenChecklistBadge and reconcile resolveBadges to checklistEnabledTypes</name>
  <files>sanity/editorial/workflow.tsx</files>
  <behavior>
    - On first `ready` render of an incomplete document of a checklist-enabled type: openInspector('checklist') fires exactly once.
    - After a manual close in the same pane session: no reopen, even as edits flip requiredComplete back and forth.
    - New documentId / new pane mount: re-arms and re-evaluates fresh.
    - Complete document: never opens.
    - Non-null inspector already present on first ready render: never clobbered.
  </behavior>
  <action>
    In `sanity/editorial/workflow.tsx`, add an invisible badge component `AutoOpenChecklistBadge`
    typed as the already-imported `DocumentBadgeComponent`. Use the verified sketch at
    RESEARCH.md lines 54-90 as the concrete starting point, adapting to the actual current code.

    Imports to add at the top of workflow.tsx: `useEffect` and `useRef` from `react`;
    `useDocumentPane` from `sanity/structure`; and `checklistEnabledTypes` from `./DocumentChecklist`.
    (`getDocumentChecks`/`summarizeChecks` are already imported from `./checks`; `DocumentBadgeComponent`
    and `DocumentBadgesResolver` types are already imported from `sanity`.)

    AutoOpenChecklistBadge body: call `useDocumentPane()` to obtain `documentId`, `documentType`,
    `ready`, `openInspector`, and `inspector`. Compute the document value from the badge props the same
    way CompletenessBadge does — `props.draft ?? props.published ?? {}` cast to `Record<string, unknown>`
    — and derive `summary = summarizeChecks(getDocumentChecks(documentType, value))`. Declare a
    `handledRef = useRef<string | null>(null)`.

    Inside a `useEffect`, apply these guards IN THIS EXACT ORDER (order is load-bearing — verified in
    RESEARCH.md Q2/Q4): (1) if `!ready`, return — wait until draft/published have loaded, avoiding the
    loading-flash false positive; (2) if `handledRef.current === documentId`, return — decide at most
    once per document; (3) set `handledRef.current = documentId` BEFORE any open call, so every later
    render early-returns at guard (2) and the panel can never snap back after a manual close;
    (4) if `!checklistEnabledTypes.has(documentType)`, return; (5) if `inspector` is truthy, return —
    respect a deep-linked or already-open inspector; (6) if `!summary.requiredComplete`, call
    `openInspector('checklist')`. Effect deps: `[ready, documentId, documentType, summary.requiredComplete, inspector, openInspector]`.
    The component returns `null` (it is a side-effect host, not a visible badge).

    Reconcile `resolveBadges`: replace its hardcoded inline array
    `['gallery','homePage','aboutPage','contactPage','siteSettings','exhibition'].includes(context.schemaType)`
    with `checklistEnabledTypes.has(context.schemaType)` so the badge-mount type set can never drift from
    the set that registers `checklistInspector` in sanity.config.ts (which already gates on
    `checklistEnabledTypes.has`). Prepend the new badge in the returned array so it mounts for the same
    types: `[AutoOpenChecklistBadge, CompletenessBadge, CollectionStatusBadge, ...prev]`.

    Do NOT touch `resolveActions` or its `updatesPublicSite` list — that list intentionally excludes
    'exhibition' (exhibitions are not on the public site yet) and is a semantically distinct concern
    from checklist coverage. Only the badges resolver is being reconciled here.

    No change to sanity.config.ts (badges: resolveBadges is already wired). No change to
    DocumentChecklist.tsx (checklistEnabledTypes is already exported). No new dependencies, no schema change.
  </action>
  <verify>
    <automated>cd sanity && npx tsc --noEmit && npm run lint</automated>
  </verify>
  <done>
    workflow.tsx exports AutoOpenChecklistBadge (returns null); resolveBadges gates on
    checklistEnabledTypes.has(context.schemaType) and prepends AutoOpenChecklistBadge; the useEffect
    sets handledRef.current before openInspector and gates on ready + inspector + requiredComplete;
    resolveActions is unchanged; `npx tsc --noEmit` and `npm run lint` both pass in the sanity/ subproject.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
    An invisible badge inside the Sanity document pane that auto-opens the Checklist inspector once,
    on open, for incomplete documents — and never reopens after a manual close within the same
    document-pane session.
  </what-built>
  <how-to-verify>
    1. From the `sanity/` directory run `npm run dev` and open the Studio (http://localhost:3333).
    2. Open a document that is INCOMPLETE (e.g. a gallery missing required fields, or a page with
       missing required content). Expected: the "Checklist" inspector panel opens automatically,
       with no manual toolbar click, and the URL shows `?inspect=checklist`.
    3. Manually close the panel (click the Checklist toolbar button again, or the panel close control).
       Keep editing the SAME document — type in fields, add/remove content so the required state changes.
       Expected: the panel stays CLOSED — it does not snap back open on its own.
    4. Navigate to a different document, then back to the incomplete one (or full page reload).
       Expected: it re-evaluates fresh and the panel auto-opens again (because still incomplete).
    5. Open a document that is COMPLETE (all required checks satisfied). Expected: the panel does
       NOT auto-open.
    6. Deep-link / already-open guard: open an incomplete document with a different inspector already
       in the URL if available, or simply confirm that after step 2 there is no flicker/loop — the
       panel opens once and the UI is stable (no repeated open/close, no console render-loop warnings).
    7. Confirm no empty/extra badge chip appears in the document status bar (the invisible badge must
       render nothing).
  </how-to-verify>
  <resume-signal>Type "approved" once all 7 checks pass, or describe any auto-open / reopen / loop / complete-doc issue observed.</resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| (none new) | Change is authenticated-editor-only Studio admin UI code. No new untrusted input crosses any boundary; no network, storage, or auth surface is added. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-bhu-01 | Denial of Service | AutoOpenChecklistBadge useEffect (client render loop) | low | mitigate | handledRef set before openInspector + `ready`/`inspector` guards make the open fire at most once per document-pane mount; verified no-loop in RESEARCH.md Q4 and re-checked in the human-verify step (7 checks). |
| T-bhu-SC | Tampering | npm/pip/cargo installs | n/a | accept | No package installs — zero new dependencies. Legitimacy gate not applicable. |
</threat_model>

<verification>
- `cd sanity && npx tsc --noEmit` passes (no type regressions in the Studio subproject).
- `cd sanity && npm run lint` passes (eslint clean, including react-hooks deps on the new useEffect).
- Human-verify checkpoint: all 7 checks in Task 2 pass in the running Studio — most importantly
  auto-open on incomplete, no reopen after manual close within the session, fresh re-evaluation on
  reopen, and no render loop.
</verification>

<success_criteria>
- Incomplete document auto-opens the Checklist inspector once on open (no manual click).
- Manual close within the same document-pane session is respected (no snap-back).
- Reopening / remounting the document re-evaluates fresh.
- Complete documents do not auto-open; deep-linked/open inspectors are not clobbered.
- No infinite render loop; no stray empty badge chip.
- resolveBadges type-gating reuses checklistEnabledTypes (single source of truth with the inspector
  registration); resolveActions left untouched.
- Type-check + lint green; no new dependencies; public Astro build unaffected.
</success_criteria>

<output>
Create `.planning/quick/260722-bhu-dans-le-document-editor-de-sanity-studio/260722-bhu-SUMMARY.md` when done.
</output>
