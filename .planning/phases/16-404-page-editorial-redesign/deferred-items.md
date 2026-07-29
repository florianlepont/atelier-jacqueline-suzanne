# Deferred Items — Phase 16

## 16-02

- `tests/unit/dashboard-logic.test.ts` fails with `Cannot find package '@sanity/icons/BulbOutline'`
  when running `npm run test:unit` in this worktree. Pre-existing, out of scope for this plan
  (touches `sanity/editorial/dashboardLogic.ts`, not `src/pages/404.astro` or either e2e spec
  this plan modifies). Root cause appears to be the `sanity/` subproject's own dependencies
  (`npm ci --prefix sanity`) not being installed in this worktree, not a regression introduced
  by this plan's changes. Not fixed per the executor's scope-boundary rule (only auto-fix issues
  directly caused by the current task's changes).
