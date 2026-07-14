---
phase: quick-260714-d6h
plan: 01
subsystem: sanity-studio
tags: [sanity-ui, editorial-dashboard, presentation-only]

requires: []
provides:
  - Urgency-distinct priority-section headers in the "À faire maintenant" panel (tonal Card header + circular tonal count badge, driven off group.tone across all four tiers)
  - Left accent bar per attention card, colored by its section's urgency tier
  - Truncated single-line "Manque" list (max 2 items + "+N autre(s)") instead of a wall of text
  - Tonal completion-count Badge on each card instead of plain muted text
affects: [sanity-studio-dashboard]

tech-stack:
  added: []
  patterns:
    - "Thread a group-level @sanity/ui `tone` down into child row components via a dedicated prop (accentTone) rather than hardcoding colors, so presentation stays generic across all tiers produced by buildAttentionGroups"
    - "@sanity/ui Text's `textOverflow=\"ellipsis\"` prop already wraps children in a span that sets overflow/white-space/ellipsis internally — no extra inline style needed"
    - "Rely on Flex's default cross-axis stretch (no `align` prop) to make a fixed-width child (the accent bar) stretch to full row height"

key-files:
  created: []
  modified:
    - sanity/editorial/EditorialDashboard.tsx

key-decisions:
  - "Kept ContentRow's accentTone prop addition entirely in Task 2 (not introduced early in Task 1), so each task's diff maps exactly to the plan's task boundary and each task's verify command runs against a fully consistent intermediate state."
  - "tsc --noEmit reports pre-existing, unrelated type errors across the sanity/ project (BadgeMode 'light' not in the installed @sanity/ui type defs, an ImportMeta.env error in deployment.ts, a DocumentBadgeComponent color mismatch in workflow.tsx, and two gallery.ts schema errors) that exist identically on the pre-task base commit (confirmed via `git stash` + `tsc --noEmit` before making any changes). One additional instance of the same BadgeMode 'light' pre-existing error appears after Task 2 because the plan explicitly directs the new completion-count badge to use `mode=\"light\"`, matching the existing codebase-wide pattern (e.g. the status Badge two lines above it, already flagged identically). This is not a new class of error and not a regression introduced by this change — eslint (the project's actual enforced lint gate for this file) passes clean at both checkpoints."

patterns-established:
  - "For Sanity Studio dashboard chrome: express urgency purely through @sanity/ui's tone vocabulary (critical/caution/primary/default) passed down as props, never hardcoded colors, so new attention tiers added later to buildAttentionGroups automatically pick up correct styling with zero component changes."

requirements-completed: [QUICK-260714-d6h]

coverage:
  - id: T1
    description: "Priority-section headers (À corriger / Modifications à publier / À finaliser / À améliorer) visually distinguish urgency tiers via a tonal Card header (group.tone) and a circular tonal count badge; title promoted to weight=bold"
    requirement: "QUICK-260714-d6h"
    verification:
      - kind: typecheck
        ref: "cd sanity && node_modules/.bin/tsc --noEmit (no NEW errors vs. pre-task baseline, confirmed via git stash diff)"
        status: pass
      - kind: lint
        ref: "cd sanity && node_modules/.bin/eslint editorial/EditorialDashboard.tsx"
        status: pass
    human_judgment: true
    rationale: "No live `sanity dev` server available in this sandbox; visual rendering of the tonal header/badge in Sanity Studio's actual theme has not been eyeballed. Verified via TypeScript/ESLint plus manual JSX/prop-flow review only."
  - id: T2
    description: "Each attention card shows a left accent bar colored by its section's tier (via new accentTone prop threaded from AttentionSection); the Manque line is truncated to max 2 items + '+N autre(s)' on a single line; the completion count renders as a tonal Badge; no ToolLink reintroduced"
    requirement: "QUICK-260714-d6h"
    verification:
      - kind: typecheck
        ref: "cd sanity && node_modules/.bin/tsc --noEmit (only pre-existing error classes present, one additional instance of the same pre-existing BadgeMode 'light' pattern from the plan-directed new badge)"
        status: pass
      - kind: lint
        ref: "cd sanity && node_modules/.bin/eslint editorial/EditorialDashboard.tsx"
        status: pass
      - kind: static_gate
        ref: "! grep -q '<ToolLink' editorial/EditorialDashboard.tsx"
        status: pass
    human_judgment: true
    rationale: "No live `sanity dev` server available in this sandbox; the accent bar's visual legibility (stretch-to-full-height, tone contrast at 4px width) and the truncated Manque line's real-world wrapping behavior have not been eyeballed."

duration: ~30min
completed: 2026-07-14
status: complete
---

# Quick Task 260714-d6h: Improve Sanity Studio EditorialDashboard "À faire maintenant" panel Summary

**Two presentation-only changes to `sanity/editorial/EditorialDashboard.tsx`'s attention panel: (1) priority-section headers now use a tonal `Card` background plus a circular tonal count badge, driven generically off `group.tone` across all four urgency tiers; (2) each attention card gained a left accent bar colored by its section's tier, a truncated single-line "Manque" list (max 2 items), and a tonal completion-count `Badge` — reducing the panel's text-heavy read to something scannable at a glance. Zero data/logic functions touched; zero new dependencies; all French copy unchanged.**

## Performance

- **Duration:** ~30 minutes
- **Started/Completed:** 2026-07-14
- **Tasks:** 2 (both executed directly, per plan)
- **Files modified:** 1 (`sanity/editorial/EditorialDashboard.tsx`)

## Accomplishments

- **Task 1:** `AttentionSection`'s header `Box` replaced with a `Card tone={group.tone}` (tonal background per tier), the pill-shaped count `Badge` replaced with a ~24px circular tonal `Card` containing the count, and the section title promoted to `weight="bold"`. Fully generic across all four groups (`blocking`/`publish`/`finish`/`recommended`) — nothing hardcoded to a specific tier.
- **Task 2:** `ContentRow` gained an `accentTone: DashboardTone` prop passed from `AttentionSection`'s row map (`accentTone={group.tone}`). Card layout restructured to an outer `Flex` (no `align`, so default stretch applies) with a 4px-wide `Card tone={accentTone}` as the first child (the accent bar) followed by a `Box` carrying the row's existing padding and content. The "Manque" line now slices to the first 2 missing checks (was 3) with a real `+N autre(s)` remainder count, wrapped in `textOverflow="ellipsis"` for single-line truncation. The right-side completion count moved from plain muted text into a `Badge mode="light" tone={accentTone}`, with "à compléter" kept as adjacent muted text and the "›" chevron unchanged.
- Verified via `tsc --noEmit` + `eslint` after each task, plus the `! grep -q '<ToolLink'` gate after Task 2. Confirmed via `git diff` that only `AttentionSection` and `ContentRow` changed — `getDocumentChecks`, `summarizeChecks`, `buildAttentionGroups`, `attentionPriority`, `editorialStatus`, `deploymentLabel`, and the GROQ `query` are byte-for-byte untouched.

## Task Commits

1. **Task 1: Make priority-section headers urgency-distinct** - `386003c` (feat)
2. **Task 2: Tighten attention cards for at-a-glance scannability** - `1a19972` (feat)

## Files Created/Modified

- `sanity/editorial/EditorialDashboard.tsx` - `AttentionSection` header restyled (tonal Card + circular tonal count badge + bold title); `ContentRow` restructured with a tonal left accent bar, truncated "Manque" line, and a tonal completion-count badge, threaded via a new `accentTone` prop from `AttentionSection`.

## Decisions Made

- Deferred adding the `accentTone` prop to `ContentRow` until Task 2, even though it's logically related to Task 1's `group.tone`, so that Task 1's diff and verify command exercise exactly what Task 1 claims to change (see key-decisions in frontmatter).
- Left the pre-existing, project-wide `tsc --noEmit` errors (BadgeMode "light" typing, `ImportMeta.env`, a `workflow.tsx` DocumentBadgeComponent mismatch, two `schemas/gallery.ts` errors) untouched and undiagnosed — confirmed via `git stash` that they exist identically on the pre-task base commit, so they're out of this quick task's scope. `eslint`, the file's actual enforced gate, is clean.

## Deviations from Plan

None. Both tasks implemented exactly as specified; both automated verify commands were run exactly as written in the plan.

## Issues Encountered

- `cd sanity && node_modules/.bin/tsc --noEmit` does not exit 0 on this repo even on a clean baseline (pre-existing, unrelated type errors across multiple files, confirmed via `git stash`). This quick task's changes add one additional instance of an already-pre-existing error class (`BadgeMode` not including `"light"` in the installed `@sanity/ui` type defs) because the plan explicitly directs the new completion-count badge to use `mode="light"`, matching the same pattern already used elsewhere in this exact file (the status `Badge`) and across `GalleryCreditsView.tsx`/`MediaLibrary.tsx`. No new error *category* was introduced. Flagging as a pre-existing, out-of-scope project health item — not something this quick task should fix under its presentation-only mandate.

## User Setup Required

None — no external service configuration required.

## Pending Human Verification

**No live `sanity dev` server is available in this sandbox.** The following must be checked visually by a human running Sanity Studio locally, viewing the dashboard's "À faire maintenant" panel with at least one item present in each of the four urgency tiers (À corriger / Modifications à publier / À finaliser / À améliorer — trigger by having a gallery/page with a missing required field, a document with unpublished draft changes, a document in "preparation"/hidden status, and a document missing only recommended/SEO fields, respectively):

1. **Section headers** — each of the (up to four) section header strips should show a distinct tonal background (critical = red-tinted, caution = amber-tinted, primary = blue-tinted, default = neutral/gray) and a small circular badge (~24px) with the row count in the same tone, next to a bold section title.
2. **Card accent bars** — each attention card should show a thin (~4px) colored bar running the full height of the card on its left edge, colored to match its section's tone. The lowest tier ("À améliorer", default tone) should look intentionally muted/near-invisible relative to the others — confirm it's still perceptible enough to read as "this card has an accent" rather than looking broken/missing.
3. **Manque line** — for a card with 3+ missing checks, confirm only 2 items show plus a "+N autre(s)" suffix, all on one line (no wrapping), truncating with an ellipsis if the label text itself is very long.
4. **Completion badge** — the right-side "N à compléter" count should render as a colored pill (Badge) matching the card's section tone, not plain gray text.
5. **Regression check** — click through a card via the row and confirm `IntentLink` navigation to the document editor still works; click "Photos et crédits" in Quick Actions and confirm it still navigates to the media tool without a router crash (this exercises the `<Link href>` + `basePath` pattern preserved from commit `6b3de8d` — unchanged by this task).

## Next Phase Readiness

- Both commits (`386003c`, `1a19972`) land cleanly on the plan's pre-dispatch base (`92b9413`).
- No blockers. This is a small, self-contained presentation change; no follow-on work is implied beyond the pending human visual check above.

---
*Phase: quick-260714-d6h*
*Completed: 2026-07-14*

## Self-Check: PASSED

- FOUND: sanity/editorial/EditorialDashboard.tsx
- FOUND: .planning/quick/260714-d6h-improve-the-sanity-studio-editorialdashb/260714-d6h-SUMMARY.md
- FOUND commit: 386003c
- FOUND commit: 1a19972
