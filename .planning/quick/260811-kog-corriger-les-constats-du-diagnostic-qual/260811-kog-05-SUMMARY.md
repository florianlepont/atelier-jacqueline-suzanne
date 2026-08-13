---
phase: quick-260811-kog-corriger-les-constats-du-diagnostic-qual
plan: 05
subsystem: testing
tags: [vitest, jsdom, testing-library, react, sanity-studio, coverage]

requires: []
provides:
  - "Vitest/jsdom/Testing-Library harness for Sanity Studio's editorial React components (sanity/vitest.config.ts, sanity/editorial/test/{setup.ts,mocks.tsx})"
  - "Five real behavioral test suites (EditorialDashboard, MediaLibrary, CreditsManager, DocumentChecklist, EditorialShells) mounting all 8 production TSX under sanity/editorial with real render/fireEvent/rerender/waitFor/act/fake-timers/unmount coverage"
  - "sanity/scripts/check-tsx-coverage.mjs: per-file 60/50/60/60 coverage gate + filesystem/matrix/coverage-JSON exhaustiveness check, chained into sanity's test:coverage script"
  - "Global 75/65/75/75 coverage thresholds activated in sanity/vitest.config.ts"
  - "260811-kog-TSX-COVERAGE.md's final results section filled in for all 8 production TSX files"
affects: [sanity-editorial-dashboard, sanity-editorial-shells]

tech-stack:
  added:
    - "vitest@4.1.9 (sanity subproject devDependency, matches root)"
    - "@vitest/coverage-v8@4.1.9"
    - "jsdom@29.1.1"
    - "@testing-library/react@16.3.2"
    - "@testing-library/dom@10.4.1"
  patterns:
    - "Real React 19 mount/effect/timer/unmount testing via Testing Library, not server-render or isolated-logic-only tests, for Sanity Studio's own React components"
    - "Coverage gate split across two layers: Vitest's own thresholds for the global floor (single threshold set only), a standalone Node script for a stricter, separately-enforced per-file floor"

key-files:
  created:
    - sanity/vitest.config.ts
    - sanity/editorial/test/setup.ts
    - sanity/editorial/test/mocks.tsx
    - sanity/editorial/__tests__/EditorialDashboard.test.tsx
    - sanity/editorial/__tests__/MediaLibrary.test.tsx
    - sanity/editorial/__tests__/CreditsManager.test.tsx
    - sanity/editorial/__tests__/DocumentChecklist.test.tsx
    - sanity/editorial/__tests__/EditorialShells.test.tsx
    - sanity/scripts/check-tsx-coverage.mjs
  modified:
    - sanity/package.json
    - sanity/package-lock.json
    - sanity/eslint.config.mjs
    - sanity/editorial/EditorialDashboard.tsx
    - .planning/quick/260811-kog-corriger-les-constats-du-diagnostic-qual/260811-kog-TSX-COVERAGE.md
  deleted:
    - sanity/editorial/__tests__/coverage-baseline.test.tsx

key-decisions:
  - "A separate, pre-existing bug (unrelated to this plan) was found and fixed before any of this plan's own work could even run: EditorialDashboard.tsx imported a non-existent @sanity/icons/AlertCircle subpath (introduced in commit c9b58a2, this branch's own history), which silently broke `sanity build` and blocked the new Vitest harness from collecting any tests at all (0 tests ran). Fixed by reusing the already-imported ErrorOutlineIcon for the single call site (commit 6067dac)."
  - "coverage-baseline.test.tsx (the Wave 0 mount/unmount smoke) was removed once the five real behavioral suites existed, per the plan's own instruction to remove it if redundant. Its own assertions are covered by the real suites; removing it caused a small, honestly-recorded drop in a few files' branch coverage (the generic mount exercised some default-render branches no explicit scenario targeted) — every file and the global total still clear their thresholds after the drop."
  - "The per-file 60/50/60/60 gate is enforced by a standalone script rather than Vitest's own perFile option, because Vitest applies a single threshold set globally even with perFile enabled — it cannot express a stricter per-file floor alongside a looser global one."
  - "The gate script's file-discovery walks the filesystem in plain Node.js rather than shelling out to ripgrep. `rg` is not guaranteed installed on every contributor machine or CI runner (confirmed during this work: it resolved only via a Claude-Code-specific shell shim in one investigative session, not as a real system binary), and this gate must behave identically everywhere `npm run test:coverage` runs."
  - "sanity/eslint.config.mjs gained a scoped languageOptions.globals override for scripts/**/*.mjs (console, process) declared inline rather than adding the `globals` npm package as a new devDependency for two names — Studio's own eslint-config-studio targets browser/React code and has no Node environment."

requirements-completed: [QUICK-260811-KOG-STUDIO-REACT]

coverage:
  - id: D1
    description: "Tests genuinely mount React 19 components in jsdom, trigger useEffect/timers/subscriptions, and prove cleanup at unmount"
    requirement: QUICK-260811-KOG-STUDIO-REACT
    verification:
      - kind: unit
        ref: "npm --prefix sanity test (47/47 tests, 6 files)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Dashboard, media library, credits, checklist, publication and auxiliary Studio components cover visible states, interactions, success, error and relevant retry paths"
    requirement: QUICK-260811-KOG-STUDIO-REACT
    verification:
      - kind: unit
        ref: "sanity/editorial/__tests__/EditorialDashboard.test.tsx, MediaLibrary.test.tsx, CreditsManager.test.tsx, DocumentChecklist.test.tsx, EditorialShells.test.tsx"
        status: pass
    human_judgment: false
  - id: D3
    description: "Coverage includes every production TSX file under sanity/editorial; none dropped by an exclusion or an incomplete manual list"
    requirement: QUICK-260811-KOG-STUDIO-REACT
    verification:
      - kind: unit
        ref: "npm --prefix sanity run test:coverage (check-tsx-coverage.mjs filesystem/matrix/JSON exhaustiveness check)"
        status: pass
    human_judgment: false
  - id: D4
    description: "A Wave 0 baseline before production changes and a final measurement are recorded per file in a versioned matrix"
    requirement: QUICK-260811-KOG-STUDIO-REACT
    verification:
      - kind: other
        ref: "260811-kog-TSX-COVERAGE.md (Wave 0 table + Résultats finaux table, both present)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Global 75/65/75/75 and per-file 60/50/60/60 coverage thresholds pass with no exclusion of any production TSX"
    requirement: QUICK-260811-KOG-STUDIO-REACT
    verification:
      - kind: unit
        ref: "npm --prefix sanity run test:coverage (86.34/70.54/83.62/89.18 global; all 8 files above 60/50/60/60)"
        status: pass
    human_judgment: false

duration: ~2h across two sessions (a prior agent session's uncommitted Task 1 + partial Task 2, discovered and resumed in this session; this session fixed a blocking pre-existing bug, fixed/completed Task 2, and completed Task 3 directly after a background executor hit a weekly usage limit mid-way through the last suite)
completed: 2026-08-13
status: complete
---

# Quick Task 260811-kog Plan 05: Studio React Test Harness & Coverage Gate Summary

**Real Vitest/jsdom/Testing-Library harness for Sanity Studio's editorial React components, five behavioral test suites covering all 8 production TSX files, and a two-layer coverage gate (Vitest global thresholds + a standalone per-file script) — plus a separately-discovered, unrelated bug fix that had been silently breaking `sanity build`.**

## Performance

- **Duration:** ~2h across two sessions. A prior agent session ("Codex") left Task 1 done and Task 2 one-fifth done, fully uncommitted, with no SUMMARY.md/STATE.md record. This session discovered it, found and fixed a blocking bug the prior session never hit cleanly (0 tests were collecting), fixed/finished Task 2's five suites, and completed Task 3 — the last suite (EditorialShells) and all of Task 3 were finished directly in this session after a background executor hit an account-level weekly usage limit partway through.
- **Tasks:** 3 (harness + Wave 0 baseline; five behavioral suites; coverage matrix + thresholds + gate)
- **Files modified:** 14 (9 created, 5 modified, 1 deleted)

## Accomplishments

- Installed and configured a real Vitest/jsdom/Testing-Library harness for Sanity Studio's React 19 components, with controllable mocks for `sanity`, `@sanity/ui`, `sanity/router`, `sanity/structure` and `styled-components`.
- Found and fixed a separate, pre-existing bug blocking everything: `EditorialDashboard.tsx` imported a non-existent `@sanity/icons/AlertCircle` subpath, silently breaking `sanity build` and preventing the new test harness from collecting any tests at all.
- Five real behavioral test suites (47 tests total) mount, interact with, and unmount all 8 production TSX files under `sanity/editorial`, proving effects, timers, subscriptions, transactions, errors and retries — not snapshots, not server-rendered stand-ins.
- A two-layer coverage gate: Vitest's own global thresholds (75/65/75/75, expressible directly) plus a standalone `check-tsx-coverage.mjs` script enforcing a stricter 60/50/60/60 per-file floor and proving the coverage report, the filesystem, and the coverage matrix doc all agree on the exact same 8 files — with no dependency on `ripgrep` being installed.
- `260811-kog-TSX-COVERAGE.md` now has both a Wave 0 baseline (historical) and a final-results table; every file and the global total clear their thresholds.
- Full verification green: `npm --prefix sanity test` (47/47), `npm --prefix sanity run test:coverage` (all thresholds pass), `npm --prefix sanity run lint` (0 errors), `npm --prefix sanity run build`, root `npm run typecheck` (0 errors) and `npm run test:unit` (400/400).

## Task Commits

1. **Task 1: Install harness, Wave 0 baseline** - `cb84370` (feat) — done by the prior agent session, verified and committed in this session
2. **Blocking bug fix (unplanned, discovered while unblocking Task 1's tests): broken @sanity/icons import** - `6067dac` (fix)
3. **Task 2 checkpoint: EditorialDashboard suite (4/8 passing at commit time)** - `f952237` (test) — prior session's partial attempt, preserved rather than discarded
4. **Task 2: Fix EditorialDashboard suite (now 8/8) + surface publish/tracking errors** - `27c9ec9` (fix)
5. **Task 2: MediaLibrary + CreditsManager suites** - `e5f1c13` (test)
6. **Task 2: DocumentChecklist + EditorialShells suites (completing all 5), fix a role-query bug** - `49c4893` (test)
7. **Task 3: Coverage matrix close-out, global thresholds, per-file gate script** - `09c37cb` (feat)

**Plan metadata:** committed separately by the orchestrator (this SUMMARY, STATE.md).

## Files Created/Modified

- `sanity/vitest.config.ts` (new) - jsdom environment, V8 coverage config, now with activated global thresholds
- `sanity/editorial/test/setup.ts`, `mocks.tsx` (new) - Controllable test doubles for Sanity UI/client/router/stores
- `sanity/editorial/__tests__/EditorialDashboard.test.tsx` (new) - Inventory loading, error/retry, realtime debounce, timer/subscription cleanup, publication flow
- `sanity/editorial/__tests__/MediaLibrary.test.tsx` (new) - Load success/error/retry, filter/selection changes, no-update-after-unmount
- `sanity/editorial/__tests__/CreditsManager.test.tsx` (new) - Draft creation, selective patching, commit success/error/retry, effect cleanup
- `sanity/editorial/__tests__/DocumentChecklist.test.tsx` (new) - Required/recommended/completed states, tone, display toggle, document-update reaction
- `sanity/editorial/__tests__/EditorialShells.test.tsx` (new) - OpenSitePage, SeoPreviewInput, StudioLayout, workflow.tsx (resolveActions/resolveBadges + 3 badge components)
- `sanity/scripts/check-tsx-coverage.mjs` (new) - Per-file coverage floor + filesystem/matrix/JSON exhaustiveness gate
- `sanity/eslint.config.mjs` - Scoped Node globals override for `scripts/**/*.mjs`
- `sanity/package.json`/`package-lock.json` - 5 new exact-pinned devDependencies; `test:coverage` now chains the gate script
- `sanity/editorial/EditorialDashboard.tsx` - Fixed the broken `@sanity/icons/AlertCircle` import (unrelated pre-existing bug)
- `260811-kog-TSX-COVERAGE.md` - Final results section filled in

## Decisions Made

See `key-decisions` in frontmatter above — five decisions recorded there, most notably: the blocking icon-import bug fix (out of this plan's stated scope but a hard prerequisite for any of it to run), removing the baseline smoke once genuinely redundant (with an honest note about the resulting small coverage drop), and building the per-file gate as a ripgrep-free, plain-Node script for portability.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Fixed a blocking, unrelated pre-existing bug before any of this plan's own verification could run**
- **Found during:** Attempting Task 1's own verification (`npm --prefix sanity run test:coverage`) — 0 tests were collecting.
- **Issue:** `EditorialDashboard.tsx` imported `AlertCircleIcon` from a non-existent `@sanity/icons/AlertCircle` subpath (introduced in a prior, unrelated commit on this branch). This broke Vite/Vitest's Node-style module resolution outright, and also `sanity build`'s own bundler resolution — a genuine production bug that predated and was unrelated to this quality-diagnostic remediation.
- **Fix:** Swapped for the already-imported `ErrorOutlineIcon` at the single call site.
- **Files modified:** `sanity/editorial/EditorialDashboard.tsx`
- **Verification:** `sanity build` and `sanity lint` both clean afterward; the Vitest harness went from 0 tests collecting to genuinely running.
- **Committed in:** `6067dac` (standalone commit, separate from any kog-05 task commit, since it's outside this plan's own scope)

**2. [Rule 3 - Blocking] Rewrote the coverage gate's file-discovery to avoid a shell-out to `ripgrep`**
- **Found during:** First run of the new `check-tsx-coverage.mjs` script — failed with `rg: command not found`.
- **Issue:** The script (and the plan's own `<verification>` text) assumed `rg` was a real, installed system binary. It resolved successfully in one investigative shell only via a Claude-Code-specific convenience wrapper, not as genuine ripgrep — meaning it would fail on real CI runners and most contributor machines.
- **Fix:** Replaced the `execSync('rg --files ...')` call with a dependency-free recursive `fs.readdirSync` walk.
- **Files modified:** `sanity/scripts/check-tsx-coverage.mjs`
- **Verification:** Gate passes identically without any reliance on an external binary.
- **Committed in:** `09c37cb` (the script was written and fixed within the same task-3 commit, before ever being committed with the bug)

**3. [Rule 3 - Blocking] Added a scoped ESLint override for the new Node script**
- **Found during:** `npm --prefix sanity run lint` after adding `check-tsx-coverage.mjs` — 15 `no-undef` errors on `console`/`process`.
- **Issue:** Studio's `eslint-config-studio` targets browser/React code and declares no Node globals.
- **Fix:** Added a `languageOptions.globals` override scoped to `scripts/**/*.mjs`, declaring `console`/`process` inline rather than adding the `globals` npm package as a new devDependency for two names.
- **Files modified:** `sanity/eslint.config.mjs`
- **Verification:** `npm --prefix sanity run lint` clean (0 errors) afterward.
- **Committed in:** `09c37cb`

---

**Total deviations:** 3 auto-fixed (1 missing-critical unrelated bug fix, 2 blocking portability/config fixes). None reduce scope, weaken a threshold, or exclude a production file — all three were necessary for the plan's own stated verification to actually run and pass everywhere it needs to.
**Impact on plan:** No scope creep on the plan's own five behavioral suites or its coverage/threshold requirements; the icon-import fix is the one change genuinely outside this plan's boundary, and it's committed separately for exactly that reason.

## Issues Encountered

- **Coverage percentages have small (~1-2 point) run-to-run variance**, mostly on branch coverage, likely from test-isolation/mock-reset ordering rather than any flakiness in the assertions themselves. Documented directly in `260811-kog-TSX-COVERAGE.md` rather than treated as a bug — the gate re-measures and re-checks thresholds on every run rather than trusting a frozen snapshot, so this variance cannot silently let a real regression through.
- **A background executor dispatched to finish this plan hit an account-level weekly usage limit** partway through writing the final test suite (`EditorialShells.test.tsx`), with 45/47 tests already passing at that point (2 failures from the `getByRole('button', ...)` vs `getByRole('link', ...)` bug documented above). Rather than wait for the multi-day reset, the remaining fix and all of Task 3 were completed directly in the orchestrating session.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All three of Plan 05's tasks are complete, committed, and verified.
- Plans 02, 04 and 06 of the same `260811-kog` quality-diagnostic remediation remain entirely unstarted (see `.planning/STATE.md`'s Quick Tasks Completed table for the full six-plan status).
- No known blockers for downstream Studio work depending on `sanity/editorial/*.tsx` — the new test suites should catch regressions in dashboard loading, media library, credits, checklist, or the OpenSitePage/SeoPreviewInput/StudioLayout/workflow auxiliary components going forward.

---
*Phase: quick-260811-kog-corriger-les-constats-du-diagnostic-qual*
*Completed: 2026-08-13*
