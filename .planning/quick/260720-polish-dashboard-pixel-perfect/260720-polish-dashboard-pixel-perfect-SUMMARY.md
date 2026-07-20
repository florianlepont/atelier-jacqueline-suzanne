---
phase: quick-260720-polish-dashboard-pixel-perfect
plan: 01
status: complete
completed: 2026-07-20
commit: cfa3d84
---

# Summary

Completed the pixel-polish pass derived from the dashboard UI audit.

## Delivered

- Introduced a lightly tinted dashboard canvas with crisp white content surfaces.
- Reframed deployment as a low-emphasis, explicit “Site à jour” status instead of a competing third button.
- Added per-row semantic task icons while preserving chevrons as navigation affordances.
- Normalized KPI, task, deployment, and activity icon boxes.
- Reduced task rows to compact 44px minimum targets and moved the three-column KPI breakpoint to tablet width.
- Made activity titles and dates resilient in narrow columns, with a mobile stacked fallback.
- Added row hover and keyboard-focus states using Sanity focus tokens.
- Added `aria-expanded` and `aria-controls` to the activity disclosure.

## Verification

- `cd sanity && npx prettier --check editorial/EditorialDashboard.tsx editorial/EditorialDashboard.css` — passed.
- `cd sanity && npm run lint` — passed.
- `cd sanity && npm run build` — passed.
- Visual review in Safari — passed at desktop and narrow-tablet widths; layout, density, surfaces, actions, KPI and both lists inspected against the audit.
- Accessibility tree confirmed the activity toggle exposes its collapsed/expandable state.
- `cd sanity && npx tsc --noEmit` — no new errors; existing Sanity 6.5 typing mismatches remain elsewhere and in pre-existing badge usages.

