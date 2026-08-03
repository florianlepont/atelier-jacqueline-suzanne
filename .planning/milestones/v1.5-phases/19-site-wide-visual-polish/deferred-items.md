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

## Plan 02

- **Re-confirmed during Task 3's local CI gate run:** the same
  `tests/unit/dashboard-logic.test.ts` failure recurs unchanged
  (`Cannot find package '@sanity/icons/BulbOutline'`), still confined to
  that one suite (175/175 individual tests across the other 15 suites
  pass), still unrelated to this plan's file (`PageTitleHeader.astro`,
  CSS-only). No new action taken — tracked here for continuity so the
  gate-run record shows it was checked, not silently ignored.
