# Deferred Items — Phase 13 (Nav Integration)

Out-of-scope discoveries found during 13-01 execution, logged per the executor's
scope-boundary rules (not fixed, since they are not caused by this plan's changes).

## `tests/unit/dashboard-logic.test.ts` fails to resolve `@sanity/icons`

- **Found during:** Task 2/3 full-suite verification (`npm run test:unit`).
- **Symptom:** `Error: Cannot find package '@sanity/icons' imported from
  sanity/editorial/dashboardLogic.ts` — the whole test file fails to load
  (0 tests run in that file; all other 11 unit test files, 91 tests, pass).
- **Root cause (not fixed):** `sanity/editorial/dashboardLogic.ts` lives under
  the separate `sanity/` Studio subproject, which has its own `package.json` and
  its own `@sanity/icons` dependency. The root-level `npm install` (this
  worktree's `node_modules/`) does not hoist that dependency, so a root-level
  `vitest run` can't resolve it. This predates 13-01 — this plan's execution
  never touched `sanity/editorial/dashboardLogic.ts` or its test file, and `git
  log` shows the file already existed with this import before Phase 13 started.
- **Not fixed here:** out of scope for EDN-01 (nav-integration); fixing it would
  mean changing the Sanity Studio subproject's dependency wiring or the root
  test runner's module resolution, neither of which this phase's `files_modified`
  list touches.
