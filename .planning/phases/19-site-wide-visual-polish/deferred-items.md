# Deferred Items — Phase 19

Out-of-scope discoveries logged during execution, not fixed (per executor scope boundary).

## Plan 01

- **`npm run test:unit` fails one suite: `tests/unit/dashboard-logic.test.ts`.**
  Error: `Cannot find package '@sanity/icons/BulbOutline' imported from
  sanity/editorial/dashboardLogic.ts`. Confirmed pre-existing and unrelated
  to this plan's files (`EditionsOverviewBody.astro`, `ContactPageBody.astro`,
  `edition.spec.ts`, `contact.spec.ts`) — the export is missing from
  `@sanity/icons` in both this worktree's `node_modules` and the main
  checkout's, indicating a version/lockfile mismatch in the separate
  `sanity/` subproject, not something introduced by this plan. All 175
  individual tests across the other 15 unit suites pass; only this one
  suite fails to even load. Not fixed here — out of scope for a CSS-only
  visual-polish plan.
