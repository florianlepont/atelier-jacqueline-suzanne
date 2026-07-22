# Deferred Items — Phase 12

Out-of-scope discoveries logged during plan execution (not fixed, per executor
SCOPE BOUNDARY rule — only issues directly caused by the current task's changes
are auto-fixed).

## 12-01

- `tests/unit/dashboard-logic.test.ts` fails with `Cannot find package '@sanity/icons'
  imported from sanity/editorial/dashboardLogic.ts`. Pre-existing, unrelated to this
  plan's changes (`src/lib/sanity.ts` additive edits only) — the `sanity/` Studio
  subproject's own dependencies are not installed under this worktree's `node_modules`.
  Confirmed via `npm run test:unit`: 88/88 relevant tests pass, only this one suite
  fails to even load. Not fixed here.
