# Deferred Items — Phase 13 (Nav Integration)

## `tests/unit/dashboard-logic.test.ts` — worktree-only false failure (resolved, no action needed)

- **Found during:** 13-01 execution, inside the executor's isolated git worktree
  (`npm run test:unit` full-suite verification).
- **Symptom there:** `Error: Cannot find package '@sanity/icons' imported from
  sanity/editorial/dashboardLogic.ts` — the file failed to load in that worktree.
- **Re-checked by the orchestrator post-merge, on the real main working tree:**
  `npx vitest run dashboard-logic` → 1 file, 35 tests, all pass. Full
  `npm run test:unit` → 12 files, 126 tests, all pass. `npm run test:e2e` → 151
  passed. `npm run build` → 25 pages, no errors.
- **Root cause:** `@sanity/icons` lives in `sanity/node_modules` (the `sanity/`
  Studio subproject has its own `package.json`), not the root `node_modules`.
  Node resolves it fine from `sanity/editorial/dashboardLogic.ts` by walking up
  to `sanity/node_modules` — but a fresh `git worktree` checkout only contains
  git-tracked files; `sanity/node_modules` (gitignored) was never populated in
  that isolated worktree, so resolution failed there only.
- **Conclusion:** not a pre-existing repo bug, not caused by this phase — a
  worktree-provisioning artifact local to the executor's sandbox. No fix
  needed; nothing to carry into Phase 14.
