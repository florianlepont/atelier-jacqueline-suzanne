---
phase: quick-260720-rebuild-dashboard-optical-grid
plan: 01
status: complete
completed: 2026-07-20
commit: 69b6f7d
---

# Summary

Rebuilt the dashboard's regressed rows and header around shared optical axes rather than further padding overrides.

## Delivered

- Kept exactly two visible 44px header buttons and replaced the text arrow with a native launch icon.
- Moved deployment information to a compact secondary status line below the actions.
- Top-aligned the dashboard title and action group and right-aligned the status beneath its buttons.
- Top-aligned priority icons with titles, reduced icon-to-copy spacing to 8px, and restored a natural 64px two-line row.
- Removed the repeated “À améliorer” prefix while retaining explicit missing SEO fields.
- Rebuilt activity rows as a fixed icon column plus a shared title/metadata text axis.
- Condensed KPI labels and details into one secondary line.
- Removed the visible surface from the “Tout voir” bleed control.

## Verification

- `cd sanity && npx prettier --check editorial/EditorialDashboard.tsx editorial/EditorialDashboard.css` — passed.
- `cd sanity && npm run lint` — passed.
- `cd sanity && npm run build` — passed.
- Safari visual review — task icons align with first-line titles; task details share the title axis; activity title and author/action share one text axis; buttons have matching visible heights; deployment is no longer presented as a third button.

