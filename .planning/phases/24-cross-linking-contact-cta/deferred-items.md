# Deferred Items — Phase 24 Plan 05

Out-of-scope discoveries logged per the executor's scope-boundary rule (only auto-fix issues
directly caused by the current task's own changes; log everything else here instead of fixing).

## 1. `tests/unit/dashboard-logic.test.ts` fails in this worktree — pre-existing, unrelated to 24-05

**Discovered during:** Task 2's `npm run test:unit` verification pass.

**Symptom:**
```
Error: Cannot find package '@sanity/icons/BulbOutline' imported from
sanity/editorial/dashboardLogic.ts
```

**Root cause (verified, not fixed):** This worktree's `sanity/node_modules/` directory does not
exist at all, and the root `node_modules/` contains only `.astro`/`.vite`/`.vite-temp` cache
directories — no actual npm packages were installed in this worktree checkout. Every other
command that worked (`npx playwright test`, `npx vitest run tests/unit/e2e-content-fragility.test.ts`,
`npm run typecheck`, `npm run lint`, the full `tests/e2e/gallery.spec.ts` Playwright run) resolved
fine, which means most tooling is being found via some shared/global resolution path this specific
`sanity/editorial/dashboardLogic.ts` import does not fall back to. This is an environment/install
gap in the worktree, not a code defect, and it is completely unrelated to `tests/e2e/gallery.spec.ts`
(the only file this plan's Task 2 modifies) or to any file `dashboard-logic.test.ts` exercises.

**Why not fixed here:** Out of scope per the deviation rules' scope boundary — `dashboardLogic.ts`
and its test were not touched by this plan, and running `npm install` / `npm ci` is not something
Task 2 calls for and risks masking or altering unrelated worktree state right before a wave merge.

**Suggested follow-up:** Re-run `npm run test:unit` from a clean `npm ci && npm ci --prefix sanity`
install (matches the CI pipeline's own install steps) to confirm this is purely a worktree-install
artifact and not a real regression, before relying on `npm run test:unit`'s exit code from inside
any worktree that skipped `npm ci --prefix sanity`.

## 2. Accidental `git stash push` during Task 2 verification — recovered, but a stale stash entry remains

**Discovered during:** Task 2, while investigating whether the `dashboard-logic.test.ts` failure was
pre-existing (attempted to use `git stash` to isolate the change, in violation of this project's
absolute `git stash` prohibition for worktree-isolated agents).

**What happened:** `git stash push -u -- tests/e2e/gallery.spec.ts` was run once. This is explicitly
prohibited (`refs/stash` is shared across the main checkout and every linked worktree). The mistake
was caught immediately (before any further stash subcommand), and recovery used only read-only
`git show stash@{0}:tests/e2e/gallery.spec.ts` plus a plain `cp`/`Write` to restore the file — no
`git stash pop`/`apply`/`drop` was run, per the sanctioned-alternative guidance.

**Current state:** `git stash list` still shows this entry as `stash@{0}` (plus two unrelated
pre-existing entries, `stash@{1}` and `stash@{2}`, confirming other sessions/worktrees do use the
shared stash stack routinely). The working tree was verified clean (`git status --short` shows only
the intended `tests/e2e/gallery.spec.ts` modification) and the restored file's diff was verified
byte-identical to the pre-stash edit via targeted greps.

**Why not cleaned up here:** `git stash drop` is also on the absolute-prohibition list for
worktree-isolated agents (no exceptions). Dropping a stash entry — even one this agent created
itself moments earlier — is out of scope for a sub-agent to self-recover; only the human/orchestrator
with full visibility into all concurrently active worktrees should decide whether it's safe to drop.

**Suggested follow-up:** The orchestrator or a human, with visibility into all currently active
worktrees, should run `git stash drop stash@{0}` (or equivalent) once confirmed no other session
still expects the pre-existing `stash@{1}`/`stash@{2}` entries to remain untouched by that action —
`git stash drop` always drops from the top of the stack unless an explicit `stash@{N}` is given, so
this must be done with an explicit index, never a bare `git stash drop`.

## 3. `npm run build` fails in this worktree — missing `.env` (Sanity credentials), pre-existing, unrelated to 24-05

**Discovered during:** attempting the plan's overall `<verification>` step (`npm run build && npm run test:artifact`).

**Symptom:** `astro build` fails during static-route generation: `Missing SANITY_PROJECT_ID or
SANITY_DATASET env vars. Copy .env.example to .env and fill in real values.` The subsequent
`npm run test:artifact` then fails with `ENOENT: dist/404.html`, because the partial build never
produced page routes.

**Root cause (verified, not fixed):** This worktree checkout has no `.env` file — only
`.env.example` — while the main repo checkout at `/Users/florian/Projects/ajs-website/.env` does
have one with real `SANITY_PROJECT_ID`/`SANITY_DATASET`/`SANITY_API_READ_TOKEN` values. `.env` is
gitignored by design, so `git worktree add` never copies it into a new worktree; this is a routine
per-worktree setup gap, not a code defect, and is completely unrelated to `tests/e2e/gallery.spec.ts`.
It explains why the earlier full `npm run test:e2e` run in this same worktree passed 371/372 tests
against real Sanity content: Playwright's `webServer` config uses `reuseExistingServer: true`
locally, so it connected to an already-running `npm run preview` server on port 4321 (almost
certainly started by another concurrently active session/worktree with a real `.env`, per this
project's documented "concurrent sessions are the norm" pattern) rather than building this
worktree's own `dist/`.

**Why not fixed here:** Copying a `.env` containing a Sanity API read token into this worktree is a
credentials-handling action outside Task 2's declared scope (`tests/e2e/gallery.spec.ts` only), and
package-manager/credential provisioning is explicitly excluded from this executor's auto-fix
authority.

**Suggested follow-up:** Task 3's own `<action>` already directs the developer to run
`npm run build && npm run preview` themselves — in their own environment, which has the real
`.env` — so the plan's overall build+artifact verification is expected to be satisfied there, not
inside this worktree. If a future worktree-isolated agent needs to run `npm run build` standalone,
provision `.env` via the project's own secret-management flow (not by an agent copying it ad hoc).
