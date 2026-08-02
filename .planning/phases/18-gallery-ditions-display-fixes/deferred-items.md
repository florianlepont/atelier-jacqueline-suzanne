# Deferred Items — Phase 18

Items discovered during execution that are out of scope for the current plan(s)
and were logged rather than fixed, per the executor's scope-boundary rule.

## 18-01: `tests/unit/dashboard-logic.test.ts` fails to import — missing `sanity/node_modules`

**Found during:** Plan 01, final `npm run test:unit` verification step.

**Symptom:**
```
FAIL  tests/unit/dashboard-logic.test.ts [ tests/unit/dashboard-logic.test.ts ]
Error: Cannot find package '@sanity/icons/BulbOutline' imported from
  sanity/editorial/dashboardLogic.ts
```

**Root cause:** This git worktree never ran `npm ci --prefix sanity`, so
`sanity/node_modules/` does not exist here at all (confirmed: `@sanity/icons`
is present in the main repo checkout's `sanity/node_modules` but absent in
this worktree). This is an environment-provisioning gap in the worktree, not
a regression — `dashboard-logic.test.ts` imports from the separate `sanity/`
Studio subproject, which this plan's diff never touches (`GalleryGrid.astro`,
the two gallery route files, `gallery.spec.ts` only).

**Scope:** Out of scope for 18-01 (PORT-05/PORT-06, Portfolio/Éditions
display fixes) — not fixed here, per the executor's scope-boundary rule
("only auto-fix issues DIRECTLY caused by the current task's changes").

**Impact on this plan's verification:** `npm run test:unit` reports
"1 failed | 14 passed (15)" at the suite level, but "170 passed (170)" at the
individual-test level — the one failed suite contributes 0 tests (it fails at
import time, before any test runs). All 170 real unit tests pass; nothing in
this plan's diff broke any of them.

**Suggested resolution (not performed here):** run `npm ci --prefix sanity`
in any worktree/environment that needs to run the full unit suite including
Studio-side tests. This is a `npm ci` against an already-committed
`sanity/package-lock.json` (not a new/unverified package install), so it
would be low-risk to run — but it is still a package-manager operation
outside this plan's declared file scope, so it is deferred rather than run
inline.
