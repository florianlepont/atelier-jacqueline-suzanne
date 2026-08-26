# Deferred Items — quick task 260826-q79

## `tests/unit/dashboard-logic.test.ts` fails on missing `sanity/node_modules` (pre-existing, out of scope)

**Discovered during:** Task 2 verification (`npm run test:unit`).

**Issue:** `sanity/node_modules/` does not exist in this worktree at all (`npm ci --prefix sanity` was never
run here), so `tests/unit/dashboard-logic.test.ts` fails to resolve `@sanity/icons/BulbOutline` when it
transitively imports `sanity/editorial/dashboardLogic.ts`. All 578 other unit tests (including the 7 new
`tests/unit/editions-dim-contrast.test.ts` tests) pass.

**Why deferred:** This is a worktree environment/dependency-install gap, unrelated to this task's files
(`src/components/EditionsOverviewBody.astro`, `tests/unit/editions-dim-contrast.test.ts`,
`tests/e2e/accessibility.spec.ts`). Per the executor's scope boundary rule, out-of-scope pre-existing
failures are logged here rather than fixed inline.

**Recommended follow-up:** Run `npm ci --prefix sanity` in this worktree (or whichever worktree next
touches Sanity Studio code) before relying on `npm run test:unit` there.
