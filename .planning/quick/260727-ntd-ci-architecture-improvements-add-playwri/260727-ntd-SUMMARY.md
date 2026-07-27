---
phase: quick-260727-ntd
plan: 01
subsystem: infra
tags: [github-actions, ci, caching, playwright, sanity, docs]

requires: []
provides:
  - Playwright browser binary caching in CI (actions/cache@v4 on ~/.cache/ms-playwright)
  - Shared npm-download cache extended to cover the sanity/ subproject lockfile
  - Accurate CLAUDE.md description of the real deploy.yml step order
affects: [ci, deploy-pipeline, docs]

tech-stack:
  added: []
  patterns:
    - "actions/cache@v4 keyed on runner.os + hashFiles(lockfile) with a cache-hit conditional install step, used for Playwright browser binaries"
    - "setup-node cache-dependency-path as a multi-line YAML block scalar listing every lockfile that should key the shared npm-download cache"

key-files:
  created: []
  modified:
    - .github/workflows/deploy.yml
    - CLAUDE.md

key-decisions:
  - "Cache-hit path still runs `playwright install-deps` (OS-level deps only) since those aren't stored in ~/.cache/ms-playwright — a bare cache hit alone would leave OS deps missing on a fresh runner"
  - "CLAUDE.md's GitHub Actions table cell was shortened to point at a new full-flow prose paragraph below the table, rather than cramming the entire ordered pipeline into one cell — matches the plan's stated 'pick whichever reads cleaner' option"

patterns-established: []

requirements-completed: ["260727-ntd"]

coverage:
  - id: D1
    description: "deploy.yml caches Playwright browser binaries (actions/cache@v4 on ~/.cache/ms-playwright, keyed on OS + package-lock.json hash) placed before the install/e2e steps, with a cache-hit path that still runs install-deps for OS-level deps"
    requirement: "260727-ntd"
    verification:
      - kind: other
        ref: "grep -q 'actions/cache@v4' .github/workflows/deploy.yml && grep -q 'ms-playwright' .github/workflows/deploy.yml"
        status: pass
      - kind: other
        ref: "grep -q 'playwright install-deps chromium webkit' .github/workflows/deploy.yml && grep -q 'playwright install --with-deps chromium webkit' .github/workflows/deploy.yml"
        status: pass
    human_judgment: false
  - id: D2
    description: "setup-node's cache-dependency-path extended to cover both package-lock.json and sanity/package-lock.json so the sanity/ subproject install shares the npm-download cache"
    requirement: "260727-ntd"
    verification:
      - kind: other
        ref: "grep -q 'cache-dependency-path' .github/workflows/deploy.yml && grep -q 'sanity/package-lock.json' .github/workflows/deploy.yml"
        status: pass
    human_judgment: false
  - id: D3
    description: "deploy.yml is valid YAML and no pre-existing blocking gate was removed, reordered, or weakened"
    requirement: "260727-ntd"
    verification:
      - kind: other
        ref: "python3 -c \"import yaml; yaml.safe_load(open('.github/workflows/deploy.yml'))\""
        status: pass
      - kind: unit
        ref: "npm run typecheck && npm run test:unit && npm run build (local proxy for the same gates CI runs, minus the browser download)"
        status: pass
    human_judgment: false
  - id: D4
    description: "CLAUDE.md's GitHub Actions description matches the real deploy.yml step order, including the Sanity lint+build gate, the typecheck gate before the first build, the twice-run test:artifact (root base + GitHub Pages base with EXPECTED_BASE), and the chromium+webkit-only Playwright scope"
    requirement: "260727-ntd"
    verification:
      - kind: other
        ref: "grep -q 'prefix sanity' CLAUDE.md && grep -q 'typecheck' CLAUDE.md && grep -qi 'test:artifact' CLAUDE.md && grep -q 'chromium' CLAUDE.md && grep -q 'webkit' CLAUDE.md && grep -qi 'EXPECTED_BASE' CLAUDE.md"
        status: pass
    human_judgment: false

duration: 15min
completed: 2026-07-27
status: complete
---

# Quick Task 260727-ntd: CI Architecture Improvements + Docs Fix Summary

**Added Playwright browser-binary + sanity-lockfile caching to deploy.yml and corrected CLAUDE.md's materially-incomplete CI pipeline description to match reality.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-07-27T17:01:00Z (approx.)
- **Completed:** 2026-07-27T17:16:10Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- `.github/workflows/deploy.yml` now caches Playwright browser binaries (`actions/cache@v4` on `~/.cache/ms-playwright`, keyed on OS + `package-lock.json` hash), splitting the install into a cache-miss full install (`--with-deps chromium webkit`) and a cache-hit OS-deps-only install (`install-deps chromium webkit`).
- The existing `setup-node` npm cache now also keys on `sanity/package-lock.json`, so `npm ci --prefix sanity` benefits from the shared download cache.
- Every pre-existing blocking gate (Sanity lint+build, typecheck, both `test:artifact` runs, Playwright e2e, Vitest coverage, un-prefixed-link grep) remains in place, unweakened, in the same order.
- CLAUDE.md's "Development & CI Tools" section now accurately describes the full ordered CI flow, including all four previously-missing facts (Sanity lint+build gate, typecheck-before-first-build gate, twice-run `test:artifact` with `EXPECTED_BASE`, chromium+webkit-only Playwright scope) plus the new caching.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Playwright + Sanity install caching to deploy.yml** - `f836d9f` (feat)
2. **Task 2: Update CLAUDE.md CI pipeline description to match deploy.yml** - `841e0ff` (docs)

**Plan metadata:** committed separately by the orchestrator after this summary.

## Files Created/Modified
- `.github/workflows/deploy.yml` - Added `cache-dependency-path` (both lockfiles) to the setup-node step; added a `playwright-cache` step (`actions/cache@v4` on `~/.cache/ms-playwright`) before the browser install; split browser install into cache-miss (full `--with-deps`) and cache-hit (`install-deps` only) conditional steps
- `CLAUDE.md` - Replaced the outdated GitHub Actions table-cell summary with a pointer to a new full ordered-flow prose paragraph covering every real deploy.yml step, including the four previously-missing facts and the new caching

## Decisions Made
- Cache-hit path still runs `playwright install-deps chromium webkit` since OS-level browser dependencies are not stored in `~/.cache/ms-playwright` — a bare cache restore would silently leave those missing on a fresh Ubuntu runner image, causing browser launch failures in the e2e step.
- Moved the full CI step-by-step description out of the CLAUDE.md table cell into a dedicated prose paragraph immediately below the table (per the plan's "pick whichever reads cleaner" option) — the full ordered flow is long enough that cramming it into one table cell would have hurt table readability.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed missing `sanity/` subproject dependencies to unblock local `npm run test:unit` verification**
- **Found during:** Task 1/2 overall verification (`npm run typecheck && npm run test:unit && npm run build`)
- **Issue:** This is a fresh worktree checkout with only the root `node_modules` installed. `tests/unit/dashboard-logic.test.ts` imports `sanity/editorial/dashboardLogic.ts`, which depends on `@sanity/icons` — a dependency declared only in `sanity/package.json` (via the `sanity` package), not the root `package.json`. Without `sanity/node_modules`, `npm run test:unit` failed with `Cannot find package '@sanity/icons/BulbOutline'`.
- **Fix:** Ran `npm install --prefix sanity` to install the sanity subproject's own already-declared, lockfile-pinned dependencies (not a new/arbitrary package — restoring what `sanity/package-lock.json` already specifies). No `package.json` or lockfile was modified; this only materialized `sanity/node_modules` locally for verification purposes.
- **Files modified:** None (local `node_modules` only, gitignored, not committed).
- **Verification:** `npm run test:unit` then passed 165/165 tests across 14 files.
- **Committed in:** N/A — no file changes to commit; this was a local environment fix only.

---

**Total deviations:** 1 auto-fixed (1 blocking, environment setup — no code/doc change)
**Impact on plan:** No scope creep; the fix was installing pre-declared dependencies to make the plan's own required verification command pass in this fresh worktree checkout. No files were modified as a result.

## Issues Encountered
- `npm run typecheck` reported 0 errors and 7 pre-existing hints (unused `Props` interfaces, a deprecated `webkitBackgroundClip` reference, an `astro(4000)` inline-script hint) — all pre-existing and unrelated to this task's files; left untouched per the scope-boundary rule.
- `npm run build` succeeded, producing 27 static pages with no errors.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- CI will now skip the Playwright browser download on cache hits (still installing OS-level deps), and the sanity/ install benefits from the shared npm-download cache — both take effect on the next CI run against `main` or the next Sanity publish webhook trigger.
- CLAUDE.md's CI section is now a trustworthy reference for future contributors/agents describing the actual deploy.yml behavior.
- No blockers for future work.

---
*Phase: quick-260727-ntd*
*Completed: 2026-07-27*

## Self-Check: PASSED

- FOUND: .github/workflows/deploy.yml
- FOUND: CLAUDE.md
- FOUND: f836d9f (Task 1 commit)
- FOUND: 841e0ff (Task 2 commit)
