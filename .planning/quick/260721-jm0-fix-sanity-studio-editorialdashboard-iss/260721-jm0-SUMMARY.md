---
phase: quick-260721-jm0
plan: 01
subsystem: sanity-studio
tags: [sanity-ui, editorial-dashboard, dark-mode, accessibility, a11y]
requirements-completed: [AUDIT-1, AUDIT-2, AUDIT-3, AUDIT-4, AUDIT-5, AUDIT-6]
status: complete
completed: 2026-07-21
files-modified:
  - sanity/editorial/EditorialDashboard.css
  - sanity/editorial/EditorialDashboard.tsx
  - sanity/editorial/deployment.ts
---

# Summary

Fixed six issues in the Sanity Studio Editorial Dashboard surfaced by an adversarial UI audit (`.planning/ui-reviews/adhoc-sanity-dashboard-audit.md`), after 7 prior "polish" passes (on `codex/sanity-dashboard-ui`, merged separately) had never actually been checked in a real, logged-in browser.

## Delivered

- **Dark mode (AUDIT-1)**: `--dashboard-page-background`/`--dashboard-surface-background` no longer hardcode light-only hex — they derive from Sanity UI's own scheme-aware `--card-bg-color`/`--card-fg-color` tokens, so the dashboard now follows Studio's active theme instead of forcing white panels onto a dark shell.
- **Inconsistent gray row background (AUDIT-2)**: explicit `background-color` on task/activity rows removed the stray gray, keeping every row in a group visually consistent. Confirmed live by the user in both light and dark schemes.
- **Human error copy (AUDIT-3)**: the dashboard's load-failure state now shows actionable French guidance ("réessayez... contactez le développeur") with the raw `Error.message` moved into a collapsed `<details>` disclosure instead of the primary message.
- **Preparation-draft exclusion (AUDIT-4)**: removed the standalone `publicationStatus === 'preparation'` clause from the "À faire maintenant" eligibility filter — a deliberately-in-progress gallery no longer nags as urgent; one with genuine missing fields still does.
- **Heading semantics (AUDIT-6)**: the four priority-group titles ("À corriger", "Modifications à publier", "À finaliser", "À améliorer") now carry `role="heading" aria-level={3}`, restoring screen-reader heading navigation between buckets.
- **Dead-code cleanup (AUDIT-5)**: removed the unused `editorial-dashboard__primary-action` CSS class reference; `deploymentLabel()` now returns `{label, tone}` (Sanity tone system) instead of an unused hex `color` field, with `DeploymentStatus`'s duplicate tone ternary deleted.

## Task Commits

1. **Task 1: Scheme-aware backgrounds + gray-row fix** — `fc1eef1` (fix)
2. **Task 2: Error copy, preparation exclusion, heading semantics, dead code** — `3b59965` (fix)
3. **Merge (worktree)** — `05faefe`

## Files Created/Modified

- `sanity/editorial/EditorialDashboard.css` — scheme-aware background tokens, explicit row background
- `sanity/editorial/EditorialDashboard.tsx` — error `<details>` disclosure, preparation-filter change, `aria-level={3}` group headings, dead class removal
- `sanity/editorial/deployment.ts` — `deploymentLabel()` returns `{label, tone}`, no hex

## Verification

- `cd sanity && npm run lint` — clean.
- `cd sanity && npx tsc --noEmit` — 10 pre-existing errors, baseline-confirmed unchanged before/after (2 of the 10 are in `EditorialDashboard.tsx` at lines 885/971, both a pre-existing `BadgeMode` typing mismatch unrelated to this task's edits — not introduced here).
- `cd sanity && npm run build` — succeeds.
- Structural greps (dead class gone, no hex in either file, `aria-level={3}` present, `<details>` present, preparation clause removed) — all pass.
- **Human checkpoint**: user confirmed live in a logged-in Studio session, toggling Light/Dark — dashboard now follows the active scheme correctly, and the row-background inconsistency is resolved. Approved 2026-07-21.

## Deviations from Plan

None functionally — the plan's own `<human-check>` explicitly anticipated the live-only nature of findings #1/#2, and the checkpoint resolved as designed (best-hypothesis fix confirmed correct on first live check, no DevTools correction round needed).

## Out of Scope (unchanged, as instructed)

- Unauthenticated GitHub Actions deployment-status fetch (rate-limit risk) — explicitly excluded from this task.
- The "Florian Algernon" activity-author identity — confirmed to come from real Sanity project member data (`useUserStore`), not a code bug; left for the user to check in manage.sanity.io → Members.

## User Setup Required

None.

## Next Steps

User reports additional UI issues remain beyond this fix set — to be scoped in a follow-up pass.

---
*Phase: quick-260721-jm0*
*Completed: 2026-07-21*
