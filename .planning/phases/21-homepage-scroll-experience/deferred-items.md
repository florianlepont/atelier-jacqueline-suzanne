# Deferred Items — Phase 21

## `npm run test:coverage` cannot run (pre-existing, unrelated to plan 21-01)

**Found during:** Plan 21-01, Task 2 acceptance-criteria check (`npm run test:coverage` should pass its configured thresholds).

**Issue:** The shared root `node_modules` (at the main repo root, resolved by Node's directory-walk since this worktree's own `node_modules` is nearly empty) has no `@sanity/icons` package installed at all (`npm ls @sanity/icons` reports empty). `tests/unit/dashboard-logic.test.ts` imports `sanity/editorial/dashboardLogic.ts`, which imports subpath entries from `@sanity/icons` (`@sanity/icons/BulbOutline`, etc.) — the whole suite fails to load with `Cannot find package '@sanity/icons/BulbOutline'`, which aborts the Vitest run before the coverage summary/threshold check is printed.

**Scope:** Entirely unrelated to this plan's files (`src/lib/home-carousel.ts`, `tests/unit/home-carousel.test.ts`). `dashboard-logic.test.ts` and `sanity/editorial/dashboardLogic.ts` predate this plan and are untouched by it.

**Not fixed here, per SCOPE BOUNDARY:** this is a shared-environment dependency gap (main repo `node_modules`), not something plan 21-01 introduced. Per the user's own working note, concurrent sessions/worktrees are the norm on this repo, and a shared root `node_modules` should not be mutated (e.g. `npm install`) from inside an isolated worktree agent — that could interfere with another in-flight session. Confirmed instead with a scoped run: `npx vitest run home-carousel` — all 62 tests (26 new + 36 pre-existing) pass; `npm run typecheck` and `npm run lint` both pass clean.

**Recommended follow-up:** whoever next runs a full `npm run test:coverage` / `npm ci` in the primary checkout should verify `@sanity/icons` reinstalls correctly (it's a real dependency of `sanity/editorial/dashboardLogic.ts`, referenced from `sanity/package.json` presumably, or needs adding to root `package.json` if the root Vitest config is expected to transpile that file directly).
