# Deferred Items — Phase 05, Plan 02

Out-of-scope discoveries logged during execution (not fixed, per Scope Boundary rules).

## 1. `tests/unit/dashboard-logic.test.ts` fails to even load (pre-existing, unrelated to this plan)

- **Found during:** Task 1 verification (`npx vitest run --coverage`).
- **Symptom:** `Error: Cannot find package '@sanity/icons/BulbOutline' imported from sanity/editorial/dashboardLogic.ts`. The whole suite file fails at import time, so `npx vitest run --coverage` never prints a coverage summary at all (the coverage stage aborts when a suite fails to collect) and the run exits non-zero regardless of any other file's coverage.
- **Confirmed pre-existing:** reproduced with `git stash` (reverting all of this plan's changes back to the worktree's base commit `d38a789e`) — the failure is present and identical on the base commit, before any 05-02 changes. Not caused by `src/lib/contact-form.ts`, `tests/unit/contact-form.test.ts`, or `.env.example`.
- **Root cause guess (not investigated further, out of scope):** looks like a `@sanity/icons` subpath-export version mismatch between what `sanity/editorial/dashboardLogic.ts` imports and what's installed in `node_modules` for this worktree.
- **Impact on this plan's acceptance criteria:** `npx vitest run --coverage` cannot be made to exit 0 from inside this plan's scope. `npx vitest run tests/unit/contact-form.test.ts` (the file this plan actually owns) passes 17/17. `npx vitest run` (no coverage flag, full suite) reports 256/256 tests passed across 15/16 files, with the same 1 pre-existing failed-to-collect suite.
- **Not fixed:** out of scope (file is `sanity/editorial/dashboardLogic.ts`, not touched by this plan's `files_modified` list).
