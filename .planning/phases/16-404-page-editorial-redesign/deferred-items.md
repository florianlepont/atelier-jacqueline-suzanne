# Deferred Items — Phase 16

## Cross-phase regression discovered during Wave 1 post-merge gate (2026-07-29)

- `tests/e2e/site-header.spec.ts` — 4 failures, all on `/about/` at narrow/mid viewports (320px, 360px, 767px): page `scrollWidth` exceeds `innerWidth` (370px / 1436px received vs the viewport width expected), tripping the shared header's "single row, no horizontal overflow" assertion.
- **Confirmed unrelated to Phase 16**: neither 16-01 (`src/lib/pop-rate.ts`) nor 16-02 (`src/pages/404.astro`) touches the About page or `SiteHeader.astro`. `git log` confirms `site-header.spec.ts` was last modified in Phase 13/quick-task work, and `AboutPageBody.astro` was last modified by Phase 15 commits — this predates Phase 16 entirely.
- **Likely cause**: Phase 15's About-page hero rework (pinned scroll-reveal photo, see `15-03-PLAN.md`) appears to introduce an element that doesn't shrink/constrain to viewport width at these breakpoints — Phase 15's own `15-VERIFICATION.md` never exercised `site-header.spec.ts` against `/about/`, so this shipped unnoticed when Phase 15 was marked complete.
- **Not fixed here** — out of scope for ERR-01/Phase 16. Recommend a follow-up quick task or bug-fix phase against the About page's mobile layout.

## 16-02

- `tests/unit/dashboard-logic.test.ts` fails with `Cannot find package '@sanity/icons/BulbOutline'`
  when running `npm run test:unit` in this worktree. Pre-existing, out of scope for this plan
  (touches `sanity/editorial/dashboardLogic.ts`, not `src/pages/404.astro` or either e2e spec
  this plan modifies). Root cause appears to be the `sanity/` subproject's own dependencies
  (`npm ci --prefix sanity`) not being installed in this worktree, not a regression introduced
  by this plan's changes. Not fixed per the executor's scope-boundary rule (only auto-fix issues
  directly caused by the current task's changes).
