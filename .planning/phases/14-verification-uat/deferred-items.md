# Deferred Items — Phase 14

Out-of-scope discoveries logged during execution (per executor SCOPE BOUNDARY rule — not fixed here).

## 14-02

- `npm run test:unit` shows 1 failed suite (`tests/unit/dashboard-logic.test.ts`) out of 12, pre-existing and unrelated to this plan's change (`tests/scripts/verify-static-artifact.mjs`). Cause: `sanity/editorial/dashboardLogic.ts` imports `@sanity/icons`, but neither `sanity/node_modules` nor the root `node_modules/@sanity/icons` are installed in this execution environment (the `sanity/` Studio subproject has its own `package.json`/install step, per CLAUDE.md's CI description — `npm ci --prefix sanity` — which was not run here). All 91 individual tests across the other 11 files pass. Not touched, since it is unrelated to the D-05 artifact-guard extension and predates this plan.
