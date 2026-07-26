# Deferred Items — quick-260726-qem

## Out-of-scope discovery: `tests/unit/dashboard-logic.test.ts` fails to load

**Found during:** full verification pass (`npm run test:unit`).

**Issue:** `tests/unit/dashboard-logic.test.ts` fails at import time with
`Cannot find package '@sanity/icons' imported from
sanity/editorial/dashboardLogic.ts`. This is a pre-existing environment gap
(the `sanity/` subproject's own dependencies were never installed in this
worktree — `sanity/node_modules` and `node_modules/@sanity/icons` are both
absent) unrelated to this task's `HomeCarousel.astro` / `homepage.spec.ts`
changes. This exact issue was previously documented in
`quick-260726-obg/deferred-items.md` for the same reason.

**Status:** Not fixed — out of scope per the executor's scope-boundary rule
(only auto-fix issues directly caused by the current task's own changes).
All other 13 unit test files (112 tests) pass.

**Suggested follow-up:** `npm install` inside `sanity/` (or wherever its
dependencies are managed) to restore `@sanity/icons` for local unit-test runs.
