---
phase: quick-260722-bhu
plan: 01
subsystem: sanity-studio
tags: [sanity, editorial, document-pane, badges, inspector]
dependency-graph:
  requires: []
  provides:
    - AutoOpenChecklistBadge (invisible DocumentBadgeComponent)
  affects:
    - sanity/editorial/workflow.tsx (resolveBadges)
tech-stack:
  added: []
  patterns:
    - Invisible DocumentBadgeComponent used as a side-effect host inside DocumentPaneProvider (useDocumentPane, useEffect, useRef)
key-files:
  created: []
  modified:
    - sanity/editorial/workflow.tsx
decisions:
  - "resolveBadges reconciled to gate on checklistEnabledTypes (imported from DocumentChecklist.tsx) instead of a separately hardcoded type array, so the badge-mount type set can never drift from the inspector-registration type set in sanity.config.ts"
  - "resolveActions and its updatesPublicSite list left untouched — semantically distinct concern from checklist coverage, per plan"
metrics:
  duration: ~15min
  completed: 2026-07-22
status: complete
---

# Quick Task 260722-bhu: Auto-open Checklist inspector on incomplete documents Summary

Invisible `AutoOpenChecklistBadge` added to the Sanity Studio document pane that auto-opens the "Checklist" inspector once per document-pane session when a document's required checks are incomplete, without requiring the editor to find the toolbar button — and never reopens after a manual close within that same session.

## What Was Built

**Task 1 (complete, committed):** Added `AutoOpenChecklistBadge`, an invisible `DocumentBadgeComponent` (returns `null`) in `sanity/editorial/workflow.tsx`. It calls `useDocumentPane()` to read `documentId`, `documentType`, `ready`, `openInspector`, and `inspector`, computes `summary.requiredComplete` from the badge's own `draft`/`published` props via the existing `getDocumentChecks`/`summarizeChecks` helpers, and runs a `useEffect` with a `handledRef` guard (keyed by `documentId`, set BEFORE calling `openInspector`) so the open decision fires at most once per document-pane mount:

1. `!ready` → return (avoids the loading-flash false positive)
2. `handledRef.current === documentId` → return (decide once per document)
3. `handledRef.current = documentId` (set before any open call — prevents snap-back after manual close)
4. `!checklistEnabledTypes.has(documentType)` → return
5. `inspector` truthy → return (never clobbers a deep-linked/already-open inspector)
6. `!summary.requiredComplete` → `openInspector('checklist')`

`resolveBadges` was reconciled to gate on `checklistEnabledTypes.has(context.schemaType)` (imported from `./DocumentChecklist`) instead of its own hardcoded inline array, and now prepends `AutoOpenChecklistBadge` in the returned badge list: `[AutoOpenChecklistBadge, CompletenessBadge, CollectionStatusBadge, ...prev]`. `resolveActions` and its `updatesPublicSite` list were left untouched, per the plan.

**Task 2 (pending — blocking human-verify checkpoint):** Cannot be performed from this non-interactive execution context; requires a running Sanity Studio and manual interaction. See "Pending Human Verification" below.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking issue] `sanity/node_modules` absent in this worktree**
- **Found during:** Task 1 verification (`npx tsc --noEmit` failed with `Cannot find module 'react'`/`'sanity'`/etc. across every file in `sanity/`, not just the edited one)
- **Issue:** This git worktree had no `sanity/node_modules` directory at all (checkout without a prior `npm install`), so TypeScript couldn't resolve any package, unrelated to the code change itself.
- **Fix:** Ran `npm ci` inside `sanity/` to restore the exact dependency set pinned in the existing `sanity/package-lock.json` — no new/added packages, purely restoring what the lockfile already specifies. Excluded from the Rule 3 package-install carve-out (which targets *adding a new/unverified package*, not *reinstalling from an existing lockfile*).
- **Files modified:** none tracked (node_modules is gitignored; `git status --short` was clean after install)
- **Commit:** n/a (no trackable change)

No other deviations — Task 1 implementation matches the plan's exact specification (imports, guard order, effect deps, resolveBadges reconciliation).

## Verification

- `cd sanity && npx tsc --noEmit` — PASSED (no output, zero errors)
- `cd sanity && npm run lint` — PASSED (eslint clean)

## Commits

- `f14dafa` — `feat(quick-260722-bhu): auto-open Checklist inspector on incomplete documents`

## Pending Human Verification (Task 2 — blocking checkpoint)

Task 2 in the plan is `type="checkpoint:human-verify" gate="blocking"` and requires interaction with a locally running Sanity Studio. It was NOT executed by this automated run. To close out this quick task, run the following against `sanity/` (`npm run dev`, Studio at http://localhost:3333):

1. Open a document that is INCOMPLETE (e.g. a gallery missing required fields, or a page with missing required content). Expected: the "Checklist" inspector panel opens automatically, with no manual toolbar click, and the URL shows `?inspect=checklist`.
2. Manually close the panel (click the Checklist toolbar button again, or the panel close control). Keep editing the SAME document — type in fields, add/remove content so the required state changes. Expected: the panel stays CLOSED — it does not snap back open on its own.
3. Navigate to a different document, then back to the incomplete one (or full page reload). Expected: it re-evaluates fresh and the panel auto-opens again (because still incomplete).
4. Open a document that is COMPLETE (all required checks satisfied). Expected: the panel does NOT auto-open.
5. Deep-link / already-open guard: open an incomplete document with a different inspector already in the URL if available, or simply confirm that after step 2 there is no flicker/loop — the panel opens once and the UI is stable (no repeated open/close, no console render-loop warnings).
6. Confirm no empty/extra badge chip appears in the document status bar (the invisible badge must render nothing).

**Resume signal:** Type "approved" once all checks pass, or describe any auto-open / reopen / loop / complete-doc issue observed.

## Known Stubs

None.

## Threat Flags

None — Studio admin UI change only, no new network/auth/storage surface. See plan's `<threat_model>` (T-bhu-01, mitigated by the handledRef/ready/inspector guard ordering verified above).

## Self-Check: PASSED

- FOUND: sanity/editorial/workflow.tsx (AutoOpenChecklistBadge present, resolveBadges reconciled)
- FOUND: f14dafa (commit exists in git log)
