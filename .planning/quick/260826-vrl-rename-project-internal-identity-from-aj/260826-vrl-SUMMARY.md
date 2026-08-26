---
phase: quick-260826-vrl
plan: 260826-vrl
subsystem: infra
tags: [github-pages, ci-cd, astro, package-naming, sanity-studio]

requires: []
provides:
  - "package.json / package-lock.json name field renamed to atelier-jacqueline-suzanne"
  - "GitHub Pages base path (ASTRO_BASE / EXPECTED_BASE) updated to /atelier-jacqueline-suzanne/"
  - "Sanity editorial deployment.ts GitHub URLs (preview, actions, API) point at the renamed repo"
  - "All docs, comments, and test fixtures referencing the old repo name updated"
affects: [ci-cd, sanity-studio-dashboard]

tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - package.json
    - package-lock.json
    - .github/workflows/deploy.yml
    - sanity/editorial/deployment.ts
    - sanity/.env.example
    - README.md
    - AGENTS.md
    - CLAUDE.md
    - astro.config.mjs
    - scripts/launch-smoke-check.sh
    - src/lib/contact-form.ts
    - src/lib/i18n-paths.ts
    - src/lib/related-edition.ts
    - src/lib/related-gallery.ts
    - src/layouts/BaseLayout.astro
    - src/components/LanguageSwitcher.astro
    - src/components/HomeCarousel.astro
    - src/pages/404.astro
    - tests/e2e/helpers/content.ts
    - sanity/editorial/__tests__/EditorialShells.test.tsx
    - tests/unit/deployment.test.ts
    - tests/unit/i18n-paths.test.ts
    - tests/unit/static-routes.test.ts

key-decisions:
  - "CLAUDE.md:106 (sketch-findings-ajs-website skill identifier) deliberately left unrenamed per plan scope — renaming would break skill resolution."
  - "package-lock.json edited in place (two name fields) rather than regenerated via npm install, to keep the resolved dependency tree byte-identical."

patterns-established: []

requirements-completed: []

coverage:
  - id: D1
    description: "package.json and package-lock.json name fields renamed to atelier-jacqueline-suzanne, matching sanity/package.json"
    verification:
      - kind: unit
        ref: "node -e name-mismatch check (package.json/package-lock.json consistency)"
        status: pass
    human_judgment: false
  - id: D2
    description: "GitHub Pages base path (ASTRO_BASE, EXPECTED_BASE) in deploy.yml updated to /atelier-jacqueline-suzanne/, fixing the broken staging build"
    verification:
      - kind: other
        ref: "git grep -c 'atelier-jacqueline-suzanne' -- .github/workflows/deploy.yml (returns 4)"
        status: pass
    human_judgment: false
  - id: D3
    description: "sanity/editorial/deployment.ts GitHub URLs (preview, actions, runs) target the renamed repo, verified by Sanity Studio and root test suites"
    verification:
      - kind: unit
        ref: "sanity/editorial/__tests__/EditorialShells.test.tsx (Sanity Studio test suite, 64 tests)"
        status: pass
      - kind: unit
        ref: "tests/unit/deployment.test.ts"
        status: pass
    human_judgment: false
  - id: D4
    description: "All docs, source comments, and remaining test fixtures updated; no old-name references remain outside .planning/.claude/.codex, except the documented CLAUDE.md:106 skill-identifier exception"
    verification:
      - kind: other
        ref: "git grep -n 'ajs-website' -- . ':!.planning' ':!.claude' ':!.codex' (only CLAUDE.md:106 remains, matching documented plan exception)"
        status: pass
    human_judgment: false

duration: 25min
completed: 2026-08-26
status: complete
---

# Quick Task 260826-vrl: Rename Project Internal Identity to atelier-jacqueline-suzanne Summary

**Renamed all in-repo references from `ajs-website` to `atelier-jacqueline-suzanne` — package identity, GitHub Pages base path, Sanity Studio deployment URLs, docs, comments, and test fixtures — fixing the broken staging build caused by the external GitHub repo rename.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-08-26T23:00:00Z (approx)
- **Completed:** 2026-08-26T23:03:00Z (approx)
- **Tasks:** 3
- **Files modified:** 23

## Accomplishments
- `package.json` / `package-lock.json` name fields renamed to `atelier-jacqueline-suzanne`, matching `sanity/package.json`, dependency tree unchanged
- `.github/workflows/deploy.yml`'s `ASTRO_BASE` and `EXPECTED_BASE` updated to `/atelier-jacqueline-suzanne/` — restores a working GitHub Pages staging build (previously broken since the external repo rename changed the real Pages base path)
- `sanity/editorial/deployment.ts`'s three hardcoded GitHub URLs (preview fallback, actions dashboard link, API runs polling) now target the renamed repo, with the Sanity Studio dashboard's release-pipeline widget continuing to work correctly
- All docs (`README.md`, `AGENTS.md`, `CLAUDE.md`), source comments illustrating the base path, and test fixtures (`EditorialShells.test.tsx`, `deployment.test.ts`, `i18n-paths.test.ts`, `static-routes.test.ts`) updated to the new name, with no "formerly X" annotations added

## Task Commits

Each task was committed atomically:

1. **Task 1: Update functional identity — package name, CI base path, Studio URLs** - `4c7d28d` (feat)
2. **Task 2: Update docs, comments, and test fixtures** - `5b1364f` (docs)
3. **Task 3: Verify and commit** - verification only, no additional file changes; all gates confirmed green against the Task 1/2 commits above

**Plan metadata:** committed pre-dispatch at `8b29711` (plan already committed before this executor was spawned, per orchestrator convention).

## Files Created/Modified
- `package.json`, `package-lock.json` - project name field
- `.github/workflows/deploy.yml` - `ASTRO_BASE`/`EXPECTED_BASE` base path + two comments
- `sanity/editorial/deployment.ts` - three GitHub URL builders (preview, actions, API runs)
- `sanity/.env.example` - `SANITY_STUDIO_PREVIEW_URL` default
- `README.md`, `AGENTS.md`, `CLAUDE.md` - stack tables, CI pipeline prose, deploy-target table, webhook/PAT docs
- `astro.config.mjs`, `scripts/launch-smoke-check.sh` - comment-only example base paths
- `src/lib/{contact-form,i18n-paths,related-edition,related-gallery}.ts`, `src/layouts/BaseLayout.astro`, `src/components/{LanguageSwitcher,HomeCarousel}.astro`, `src/pages/404.astro`, `tests/e2e/helpers/content.ts` - illustrative comments only, no runtime behavior changed
- `sanity/editorial/__tests__/EditorialShells.test.tsx`, `tests/unit/{deployment,i18n-paths,static-routes}.test.ts` - test fixtures updated to assert the renamed URLs/paths

## Decisions Made
- `package-lock.json`'s two name fields (top-level `name`, `packages[""].name`) were edited in place rather than regenerated via `npm install`, per the plan's explicit instruction, to keep the resolved dependency tree byte-identical.
- `CLAUDE.md:106` (the `sketch-findings-ajs-website` skill identifier bullet/`Skill()` call) was deliberately left unrenamed — it names an installed skill directory (`.claude/skills/sketch-findings-ajs-website/`), not a repo reference, and renaming it would break skill resolution. This is the plan's own explicitly documented exception, not an oversight.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed missing `sanity/node_modules`**
- **Found during:** Task 3 (verification gate `npm --prefix sanity run test`)
- **Issue:** This worktree's `sanity/` subproject had no `node_modules` installed at all (fresh worktree checkout), causing all 7 Sanity Studio test suites to fail with `Failed to resolve import "@testing-library/react"` — unrelated to the rename itself.
- **Fix:** Ran `npm ci --prefix sanity`, which is the exact standard install step CLAUDE.md documents as part of the CI pipeline (`npm ci --prefix sanity`). No new packages were added or changed — this hydrates the existing, unmodified lockfile-pinned dependency tree, not a new/unverified package install, so it is outside the RULE 3 package-legitimacy exclusion.
- **Files modified:** none (node_modules is gitignored, not committed)
- **Verification:** `npm --prefix sanity run test` then passed (7 test files, 64 tests, all green)
- **Committed in:** N/A (no source changes; `node_modules` is not tracked)

---

**Total deviations:** 1 auto-fixed (1 blocking, pre-existing environment gap unrelated to the rename)
**Impact on plan:** No scope creep — enabled the plan's own required verification gate to run at all. No rename-related files were touched by this fix.

## Issues Encountered

**Plan verify-command imprecision (not a deviation, documented for traceability):** Task 2's and Task 3's literal grep verify commands (`git grep -l 'ajs-website' -- . ':!.planning' ':!.claude' ':!.codex'`) are file-level, so they still match `CLAUDE.md` because of line 106 — the `sketch-findings-ajs-website` skill identifier the plan's own prose explicitly says must stay untouched ("Line 106 is excluded... Renaming it would break skill resolution. Leave all of it alone."). Manually confirmed via `git grep -n` that CLAUDE.md:106 is the *only* remaining match anywhere in-scope, exactly matching the plan's documented, deliberate exception. No file was left stale by omission — this is the intended end state, and the executor guardrail against adding "renamed from" annotations was respected throughout (no such annotations were added anywhere).

## User Setup Required

None - no external service configuration required by this task. Per the plan's own "Follow-up for the user" section (out of scope for this executor, listed here for visibility):
- The Sanity publish webhook posting to `https://api.github.com/repos/florianlepont/ajs-website/dispatches` should be updated to the new repo name in the Sanity dashboard (GitHub's redirect is a courtesy, not permanent).
- The fine-grained PAT should not need reissuing (binds to repo ID, not name) but is worth confirming still shows the repo selected.
- Recommended: push these commits and watch one GitHub Actions run to confirm staging serves correctly at `https://florianlepont.github.io/atelier-jacqueline-suzanne/` — explicitly deferred since this task must not push.

## Next Phase Readiness
- All in-scope tracked files renamed; typecheck, lint, root unit tests (717 passing), and Sanity subproject tests (64 passing) all green.
- Nothing pushed to origin — commits `4c7d28d` and `5b1364f` are local only, on top of pre-dispatch commit `8b29711`.
- Ready for the user to push and verify the GitHub Pages staging deploy end-to-end, and to update the Sanity webhook URL per the plan's follow-up notes.

---
*Phase: quick-260826-vrl*
*Completed: 2026-08-26*

## Self-Check: PASSED

- FOUND: package.json
- FOUND: .github/workflows/deploy.yml
- FOUND: sanity/editorial/deployment.ts
- FOUND: .planning/quick/260826-vrl-rename-project-internal-identity-from-aj/260826-vrl-SUMMARY.md
- FOUND: commit 4c7d28d in git log
- FOUND: commit 5b1364f in git log
