# Deferred Items — 260724-uf5

## Pre-existing sanity/ missing dependency (out of scope)

`npm run test:unit` reports 1 failed suite: `tests/unit/dashboard-logic.test.ts`
fails with `Cannot find package '@sanity/icons' imported from
sanity/editorial/dashboardLogic.ts`. Confirmed via `ls sanity/node_modules/@sanity/icons`
and `ls node_modules/@sanity/icons` — the package is genuinely absent from
`node_modules` in this worktree (a pre-existing dependency-install gap, not
something this plan's edits caused). All 112 unit tests that do run pass;
this plan touched none of the Sanity Studio editorial-dashboard files. Per the
SCOPE BOUNDARY rule, this is logged but not fixed as part of this task.

## npm run build cannot complete in this worktree (missing .env)

`npm run build` fails at the "generating static routes" step with
`Missing SANITY_PROJECT_ID or SANITY_DATASET env vars` — this worktree has no
`.env` file (confirmed absent). Per the plan's own constraints, this is
expected and not fabricated; the Vite build step itself (which compiles every
`.astro` file including the three edited in Task 3 — BaseLayout.astro,
SiteHeader.astro, DetailHero.astro) completed with zero errors both before
and after Task 4's edits, so there is no compile-error evidence of a
regression from this plan's changes. `npm run typecheck` (astro check) passed
with 0 errors across all 75 files at every task checkpoint. The orchestrator
is expected to supply `.env` for independent full-build/e2e verification.
