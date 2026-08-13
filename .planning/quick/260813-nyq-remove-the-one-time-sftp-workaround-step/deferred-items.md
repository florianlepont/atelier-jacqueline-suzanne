# Deferred Items — quick-260813-nyq

## Pre-existing unrelated test failure: `tests/unit/dashboard-logic.test.ts`

**Discovered during:** Task 2 (full-suite regression check), `npx vitest run`

**Issue:** The suite fails to load entirely with:
```
Error: Cannot find package '@sanity/icons/BulbOutline' imported from
sanity/editorial/dashboardLogic.ts
```

**Scope determination:** Out of scope for this quick task.
- `sanity/editorial/dashboardLogic.ts` is unrelated to `.github/workflows/deploy-ovh.yml`, the only file this plan touches.
- `git log --oneline -- sanity/editorial/dashboardLogic.ts tests/unit/dashboard-logic.test.ts` shows the file was last modified by unrelated quick tasks `260812-nqg` and `260812-ncd` (marker create action work), not by this task's commit.
- All 439 actual tests across the other 21 suites pass; only this one suite fails to import.

**Not fixed here** per the Scope Boundary rule (only auto-fix issues directly caused by the current task's changes). This appears to be a `@sanity/icons` package version/exports-map mismatch (missing deep-import subpath) that should be investigated as its own quick task or bug fix, independent of this SFTP-cleanup-removal task.

**Recommendation:** File a follow-up quick task or debug session to fix the `@sanity/icons` subpath import in `sanity/editorial/dashboardLogic.ts` (likely needs `@sanity/icons`'s package.json `exports` map checked against the installed version, or the import needs to change to the package's documented public entry points).
