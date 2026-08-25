# Deferred Items — quick-260825-et3

## 1. `tests/unit/dashboard-logic.test.ts` — false alarm from worktree isolation, not a real issue

**Discovered during:** Task 3's full verification sweep, run inside the executor's isolated git
worktree (`npm run test:unit` / `npm run test:coverage`).

**Symptom seen in the worktree:**
```
FAIL  tests/unit/dashboard-logic.test.ts [ tests/unit/dashboard-logic.test.ts ]
Error: Cannot find package '@sanity/icons/BulbOutline' imported from
  sanity/editorial/dashboardLogic.ts
```

**Resolved — not a real dependency gap.** The executor's own write-up suggested adding
`@sanity/icons` to the root `package.json`, reasoning that CI's root `npm ci` would hit the same
failure. That reasoning was checked against the primary checkout after the worktree merged back
and does not hold:

- `sanity/editorial/dashboardLogic.ts` imports `@sanity/icons`, and Node's module resolution walks
  up from the importing file's directory — `sanity/node_modules/@sanity/icons` (installed by
  `npm ci --prefix sanity`, exactly what CI's pipeline runs) satisfies that import without needing
  the package listed in the root `package.json` at all.
- The isolated git worktree the executor ran in shares only the git object store, not
  `node_modules` — it had no `sanity/node_modules` populated, so the import failed there and only
  there.
- Confirmed on the primary checkout post-merge: `npm run test:coverage` passes clean —
  **31/31 test files, 675/675 tests**, including `dashboard-logic.test.ts` and the new
  `tests/unit/e2e-content-fragility.test.ts` guard.

No action needed. Root `package.json` should NOT be changed for this.
