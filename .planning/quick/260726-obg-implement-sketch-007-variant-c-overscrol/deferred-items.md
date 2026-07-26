# Deferred Items — quick-260726-obg

## Out-of-scope discovery: `tests/unit/dashboard-logic.test.ts` fails to load

**Found during:** full verification pass (`npm run test:unit`).

**Issue:** `tests/unit/dashboard-logic.test.ts` fails at import time with
`Cannot find package '@sanity/icons' imported from
sanity/editorial/dashboardLogic.ts`. Confirmed via `git log` that this test
file was last touched by an unrelated prior task
(`16c62fa test: add unit coverage for the dashboard logic module`) and is not
part of this plan's `files_modified` list. Confirmed `@sanity/icons` is
absent from `node_modules/` both in this worktree and in the main checkout —
this is a dependency-install gap (the `sanity/` subproject's own
`node_modules` was never installed in this worktree), not a code regression
caused by this task's changes.

**Status:** Not fixed — out of scope per the executor's scope-boundary rule
(only auto-fix issues directly caused by the current task's own changes).
All other 13 unit test files (112 tests) pass.

**Suggested follow-up:** `npm install` inside `sanity/` (or wherever its
dependencies are managed) to restore `@sanity/icons` for local unit-test runs.
