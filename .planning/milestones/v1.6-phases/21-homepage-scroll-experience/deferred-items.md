# Deferred Items — Phase 21

## `npm run test:coverage` cannot run (pre-existing, unrelated to plan 21-01)

**Found during:** Plan 21-01, Task 2 acceptance-criteria check (`npm run test:coverage` should pass its configured thresholds).

**Issue:** The shared root `node_modules` (at the main repo root, resolved by Node's directory-walk since this worktree's own `node_modules` is nearly empty) has no `@sanity/icons` package installed at all (`npm ls @sanity/icons` reports empty). `tests/unit/dashboard-logic.test.ts` imports `sanity/editorial/dashboardLogic.ts`, which imports subpath entries from `@sanity/icons` (`@sanity/icons/BulbOutline`, etc.) — the whole suite fails to load with `Cannot find package '@sanity/icons/BulbOutline'`, which aborts the Vitest run before the coverage summary/threshold check is printed.

**Scope:** Entirely unrelated to this plan's files (`src/lib/home-carousel.ts`, `tests/unit/home-carousel.test.ts`). `dashboard-logic.test.ts` and `sanity/editorial/dashboardLogic.ts` predate this plan and are untouched by it.

**Not fixed here, per SCOPE BOUNDARY:** this is a shared-environment dependency gap (main repo `node_modules`), not something plan 21-01 introduced. Per the user's own working note, concurrent sessions/worktrees are the norm on this repo, and a shared root `node_modules` should not be mutated (e.g. `npm install`) from inside an isolated worktree agent — that could interfere with another in-flight session. Confirmed instead with a scoped run: `npx vitest run home-carousel` — all 62 tests (26 new + 36 pre-existing) pass; `npm run typecheck` and `npm run lint` both pass clean.

**Recommended follow-up:** whoever next runs a full `npm run test:coverage` / `npm ci` in the primary checkout should verify `@sanity/icons` reinstalls correctly (it's a real dependency of `sanity/editorial/dashboardLogic.ts`, referenced from `sanity/package.json` presumably, or needs adding to root `package.json` if the root Vitest config is expected to transpile that file directly).

## `edition.spec.ts` masonry-grid ratio assertion fails with `NaN` (pre-existing, unrelated to plan 21-06)

**Found during:** Plan 21-06, Task 1's full-suite verification run (`npx playwright test --project=chromium`).

**Issue:** `tests/e2e/edition.spec.ts:396` ("editions masonry grid photos uncropped and flush (quick-260803-jby) › galleries unaffected: the gallery masonry path renders identically now that éditions share it") fails: `Math.abs(ratios.clientRatio - ratios.naturalRatio) / ratios.naturalRatio` evaluates to `NaN` instead of the expected `< 0.01`, implying `naturalRatio` (or `clientRatio`) is `0` at the moment this test reads the image's rendered/natural dimensions — a gallery masonry-grid image-load timing issue.

**Scope:** Entirely unrelated to this plan's file (`src/components/HomeCarousel.astro`, the homepage-only deck script) — `edition.spec.ts` exercises the `/galleries/...` masonry grid, a different component/route this plan never touches.

**Not fixed here, per SCOPE BOUNDARY:** confirmed pre-existing and independent of this plan's changes by reverting `src/components/HomeCarousel.astro` to its pre-plan-21-06 committed state (`git show HEAD:...`) and re-running the same test in isolation — it fails identically with the plan's changes entirely absent. Not caused by, and not fixable within, this plan's scope.

**Recommended follow-up:** investigate `edition.spec.ts`'s image-load wait strategy around line ~420-425 (likely needs to await natural-dimension availability, e.g. `img.decode()` or a `naturalWidth > 0` poll, before reading the ratio) — separately from this phase.
