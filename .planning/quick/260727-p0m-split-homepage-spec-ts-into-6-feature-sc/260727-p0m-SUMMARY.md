---
phase: 260727-p0m
plan: 01
subsystem: testing
tags: [playwright, e2e, test-organization]

requires: []
provides:
  - 6 feature-scoped homepage e2e spec files replacing the monolithic homepage.spec.ts
affects: [homepage e2e test maintenance, future homepage feature work]

tech-stack:
  added: []
  patterns:
    - "Feature-scoped Playwright spec files (homepage-<feature>.spec.ts) instead of one monolithic spec per page"

key-files:
  created:
    - tests/e2e/homepage-carousel-core.spec.ts
    - tests/e2e/homepage-wordmark-peek.spec.ts
    - tests/e2e/homepage-content-display.spec.ts
    - tests/e2e/homepage-chrome-nav.spec.ts
    - tests/e2e/homepage-mobile-responsive.spec.ts
    - tests/e2e/homepage-loading-progress.spec.ts
  modified:
    - tests/e2e/site-header.spec.ts
    - tests/e2e/i18n.spec.ts
    - tests/e2e/gallery.spec.ts
    - tests/e2e/homepage-carousel-core.spec.ts
    - tests/e2e/homepage-chrome-nav.spec.ts
    - tests/e2e/homepage-content-display.spec.ts
    - tests/e2e/homepage-loading-progress.spec.ts

key-decisions:
  - "Split boundaries and per-file describe-block assignment followed the plan's pre-verified grouping exactly (no re-derivation)"
  - "Post-hoc fix (coordinator-flagged): the plan's uniform devices import across all 6 files was correct for byte-preservation of each moved block, but 4 of the 6 files never call devices[...] anywhere in their content — dropped the unused import from those 4 files rather than leaving a spurious unused-import hint"

patterns-established:
  - "Byte-preserving mechanical file splits: extract via exact line-range slices, then diff describe-block titles/order against the plan's authoritative list before running any tests"

requirements-completed: [AUDIT-homepage-spec-split]

coverage:
  - id: D1
    description: "tests/e2e/homepage.spec.ts (2,302 lines, 40 describe blocks, 97 test/test.skip calls) split into 6 feature-scoped files with zero behavior/assertion/selector/timeout/comment changes"
    requirement: "AUDIT-homepage-spec-split"
    verification:
      - kind: e2e
        ref: "npx playwright test tests/e2e/homepage-*.spec.ts (93 passed, identical to pre-split baseline)"
        status: pass
      - kind: e2e
        ref: "npx playwright test (full suite, 252 passed)"
        status: pass
      - kind: other
        ref: "npm run typecheck (astro check) — 0 errors, 2 hints, matching the pre-split baseline exactly after the devices-import fix"
        status: pass
    human_judgment: false
  - id: D2
    description: "Original tests/e2e/homepage.spec.ts deleted; 4 stale sibling cross-references repointed to correct new filenames"
    requirement: "AUDIT-homepage-spec-split"
    verification:
      - kind: other
        ref: "grep -rc 'homepage\\.spec\\.ts' tests/e2e/ returns 0 matches; grep confirms all 4 new-file references present in site-header.spec.ts, i18n.spec.ts, gallery.spec.ts"
        status: pass
    human_judgment: false

duration: ~25min
completed: 2026-07-27
status: complete
---

# Quick Task 260727-p0m: Split homepage.spec.ts into 6 feature files Summary

**Byte-preserving mechanical split of the 2,302-line, 40-describe-block tests/e2e/homepage.spec.ts into 6 feature-scoped Playwright spec files (carousel-core, wordmark-peek, content-display, chrome-nav, mobile-responsive, loading-progress), with the original deleted and 4 stale sibling comment references repointed.**

## Performance

- **Duration:** ~25 min (including fresh-worktree `npm install` for root + sanity subproject, Playwright browser install, and a post-hoc coordinator-flagged fix)
- **Started:** 2026-07-27T18:50:00Z (approx)
- **Completed:** 2026-07-27T21:03:42Z
- **Tasks:** 3 (plus one post-hoc fix commit)
- **Files modified:** 14 (6 created, 1 deleted, 3 sibling-reference edits, 4 re-edited for the import fix)

## Accomplishments
- Extracted all 40 top-level `test.describe` blocks (97 `test`/`test.skip` calls) from the original file into 6 new feature-scoped files, using exact line-range slices so every assertion, selector, timeout, comment, and local helper moved byte-for-byte unchanged
- Verified the split matches the plan's authoritative per-file block counts (11/12/8/3/4/2 = 40) and exact describe-title ordering within each file
- Moved the RED/Wave-0 top comment block (original lines 3-8) to `homepage-carousel-core.spec.ts`, immediately below the shared import line, since it describes the "homepage carousel" block now living there
- Deleted the original `tests/e2e/homepage.spec.ts` and repointed all 4 stale sibling comment cross-references (`site-header.spec.ts`, `i18n.spec.ts`, `gallery.spec.ts` ×2) to the correct new filenames
- Confirmed zero regression: `npx playwright test tests/e2e/homepage-*.spec.ts` reports "Running 93 tests" / "93 passed" — identical to the pre-split baseline run of the original file; the full suite (typecheck + unit coverage + build + full Playwright) passes with the same 252-test outcome as before the split
- **Post-hoc fix:** the coordinator's independent re-verification caught that `npm run typecheck` regressed from 2 pre-existing hints to 6 (4 new "`devices` declared but never read" warnings) because the plan's uniform import line gave all 6 files `devices` even though only `homepage-wordmark-peek.spec.ts` and `homepage-mobile-responsive.spec.ts` actually reference it. Dropped `devices` from the import line in the other 4 files (`homepage-carousel-core.spec.ts`, `homepage-chrome-nav.spec.ts`, `homepage-content-display.spec.ts`, `homepage-loading-progress.spec.ts`), restoring typecheck to exactly 2 hints and re-confirming the full suite (206 unit tests, build, 252 Playwright tests) is unaffected

## Task Commits

Each task was committed atomically:

1. **Task 1: Capture baseline, then create the 6 feature-scoped spec files by verbatim describe-block moves** - `6a0ef47` (test)
2. **Task 2: Delete the original file and repoint the 4 stale sibling-comment cross-references** - `ded5658` (test)
3. **Task 3: Verify the split matches the baseline and the full suite is unaffected** - no file changes (verification-only task; see verification results below)
4. **Post-hoc fix: drop unused `devices` import from 4 files** - `7896c19` (fix) — added after the coordinator's independent re-verification caught the typecheck regression

**Plan metadata:** committed separately by the orchestrator after this summary

## Files Created/Modified
- `tests/e2e/homepage-carousel-core.spec.ts` - 11 describe blocks: carousel root, gallery discovery, mode toggle, auto-advance, i18n guard, unified toggle, grid hero tile, view-transition toggle/sequencing, square toggle box, icon color regression; import line later trimmed to drop unused `devices`
- `tests/e2e/homepage-wordmark-peek.spec.ts` - 12 describe blocks: all hover/peek/edge-approach/wordmark-sync/cutout carousel interaction tests (the largest, most bug-fix-dense group); keeps `devices` (2 usages)
- `tests/e2e/homepage-content-display.spec.ts` - 8 describe blocks: collection statements, title underline, intro paragraph, grid-tile text/alignment/hover, hero-photo consistency, cross-document morph; import line later trimmed to drop unused `devices`
- `tests/e2e/homepage-chrome-nav.spec.ts` - 3 describe blocks: Instagram nav link, semantic heading, footer visibility; import line later trimmed to drop unused `devices`
- `tests/e2e/homepage-mobile-responsive.spec.ts` - 4 describe blocks: mobile hero visibility, narrow-phone header, mobile/tall-desktop full-bleed hero regressions; keeps `devices` (1 usage)
- `tests/e2e/homepage-loading-progress.spec.ts` - 2 describe blocks: progressive image loading, carousel progress fill; import line later trimmed to drop unused `devices`
- `tests/e2e/homepage.spec.ts` - deleted (fully absorbed into the 6 files above)
- `tests/e2e/site-header.spec.ts` - 1 comment reference repointed to `homepage-chrome-nav.spec.ts`
- `tests/e2e/i18n.spec.ts` - 1 comment reference repointed to `homepage-chrome-nav.spec.ts`
- `tests/e2e/gallery.spec.ts` - 2 comment references repointed (`homepage-carousel-core.spec.ts`, `homepage-wordmark-peek.spec.ts`)

## Decisions Made
None - the plan's describe-block-to-file grouping and ordering was authoritative and pre-verified; execution followed it exactly without re-deriving or second-guessing the split boundaries.

## Deviations from Plan

The worktree lacked `.env`, `node_modules`, `sanity/node_modules`, and installed Playwright browsers (fresh worktree checkout); these were provisioned per the orchestrator's explicit setup instructions in the task prompt (copying `.env`, running `npm install` at root and in `sanity/`, installing Playwright browsers) before any plan task began — this is standard fresh-worktree bootstrapping, not a plan deviation.

### Auto-fixed Issues (post-hoc, coordinator-flagged)

**1. [Rule 1 - Bug] Dropped unused `devices` import from 4 of the 6 split files**
- **Found during:** Coordinator's independent post-execution re-verification (not caught during the plan's own Task 3 typecheck run, since `npm run typecheck` reports hints/warnings, not errors, and the plan's verification steps didn't diff the hint count against baseline)
- **Issue:** The plan's instruction to give every one of the 6 new files the identical `import { test, expect, devices } from '@playwright/test';` line was correct for byte-preserving each individual moved block, but only 2 of the 6 files' content (`homepage-wordmark-peek.spec.ts`, `homepage-mobile-responsive.spec.ts`) actually calls `devices[...]`. The other 4 files carried a dead import, producing 4 new `ts(6133): 'devices' is declared but its value is never read` hints — `npm run typecheck` went from a pre-split baseline of 2 hints to 6.
- **Fix:** Changed the import line in `homepage-carousel-core.spec.ts`, `homepage-chrome-nav.spec.ts`, `homepage-content-display.spec.ts`, and `homepage-loading-progress.spec.ts` from `import { test, expect, devices } from '@playwright/test';` to `import { test, expect } from '@playwright/test';`. Left `homepage-wordmark-peek.spec.ts` and `homepage-mobile-responsive.spec.ts` unchanged.
- **Files modified:** tests/e2e/homepage-carousel-core.spec.ts, tests/e2e/homepage-chrome-nav.spec.ts, tests/e2e/homepage-content-display.spec.ts, tests/e2e/homepage-loading-progress.spec.ts
- **Verification:** `npm run typecheck` back down to exactly 2 hints (the pre-existing `webkitBackgroundClip` deprecation warnings, unrelated to this task); re-ran `npm run test:coverage` (206 unit tests passed), `npm run build`, and `npx playwright test` (252 tests passed) to confirm no other regression
- **Committed in:** `7896c19`

---

**Total deviations:** 1 auto-fixed (1 bug, coordinator-flagged post-hoc)
**Impact on plan:** The fix corrects a byte-for-byte-preservation side effect (dead imports left behind by the plan's deliberately uniform import-line instruction) with zero behavior change to any test — no scope creep.

## Issues Encountered
None. The mechanical split was verified correct on the first attempt: describe-block counts, combined test/test.skip count (97), import-line presence, and describe-title ordering all matched the plan's authoritative grouping exactly, and the Playwright run of the 6 new files reproduced the exact baseline pass count (93 passed, 0 skipped, 0 failed) with no investigation or fix-up needed.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- The homepage e2e suite is now organized into 6 navigable, feature-scoped files; no registry/index needed since Playwright auto-discovers `*.spec.ts`
- Remaining audit-tracked item (per STATE.md): fr/en page-component dedup, still pending as a separate quick task
- No blockers for future homepage feature work — each new file's local helpers stayed self-contained within their own describe block, so future additions can extend the relevant feature file directly

---
*Task: 260727-p0m*
*Completed: 2026-07-27*

## Self-Check: PASSED

- FOUND: tests/e2e/homepage-carousel-core.spec.ts
- FOUND: tests/e2e/homepage-wordmark-peek.spec.ts
- FOUND: tests/e2e/homepage-content-display.spec.ts
- FOUND: tests/e2e/homepage-chrome-nav.spec.ts
- FOUND: tests/e2e/homepage-mobile-responsive.spec.ts
- FOUND: tests/e2e/homepage-loading-progress.spec.ts
- CONFIRMED DELETED: tests/e2e/homepage.spec.ts
- FOUND commit: 6a0ef47 (Task 1)
- FOUND commit: ded5658 (Task 2)
- FOUND commit: 7896c19 (post-hoc devices-import fix)
- CONFIRMED: `npm run typecheck` reports exactly 2 hints (pre-split baseline), 0 errors
- CONFIRMED: full suite re-run after fix — 206 unit tests passed, build succeeded, 252 Playwright tests passed
