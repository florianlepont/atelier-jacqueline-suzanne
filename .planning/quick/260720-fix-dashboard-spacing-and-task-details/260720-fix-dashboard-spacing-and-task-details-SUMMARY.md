---
phase: quick-260720-fix-dashboard-spacing-and-task-details
plan: 01
status: complete
completed: 2026-07-20
commit: ae2591c
---

# Summary

Corrected the dashboard spacing and information-density regressions identified from the latest full-width screenshot.

## Delivered

- Standardized the primary action, site-preview action, and deployment status on a shared 44px control height.
- Aligned group, task, KPI, deployment, and activity icons to explicit 20px or 24px boxes.
- Rebuilt attention rows on a stable icon/content/chevron grid.
- Added a second, compact line that names the actual work remaining for every priority.
- Shortened verbose check labels for scannability while preserving the complete summary in the title tooltip.
- Kept the three most useful missing items visible and reports any remaining item count.
- Tightened KPI and activity vertical rhythm without shrinking interactive targets.

## Verification

- `cd sanity && npx prettier --check editorial/EditorialDashboard.tsx editorial/EditorialDashboard.css` — passed.
- `cd sanity && npm run lint` — passed.
- `cd sanity && npm run build` — passed.
- Safari visual review — passed; header controls, group/row icon axes, two-line task rhythm, metadata alignment, and activity spacing inspected on the live local Studio.
- Accessibility tree confirms the missing SEO actions are present in every priority link.

