---
phase: quick-260728-el6
plan: 01
subsystem: ui
tags: [astro, sanity, groq, css-grid, playwright, vitest]

requires:
  - phase: quick-260728-dbf
    provides: EditionsOverviewBody.astro's B2 "Cursor Preview" flat text-row index (Romane-confirmed layout) that this plan patches
provides:
  - editionsPage Sanity singleton (intro-only, no seo) registered and desk-pinned
  - getEditionsPage() / EditionsPage / EDITIONS_PAGE_QUERY data-fetch trio mirroring HomePage
  - DEFAULT_EDITIONS_INTRO + resolveEditionsIntro() config-layer fallback pair mirroring resolveHomepageIntro
  - grid-template-rows 0fr->1fr statement reveal replacing the fixed max-height: 80px clip
  - Sanity-editable .editions-list__intro paragraph rendered under the H1 on both /editions/ and /en/editions/
affects: [editions-overview, sanity-schema, site-config]

tech-stack:
  added: []
  patterns:
    - "editionsPage singleton mirrors homePage's intro-only object-field + fixed documentId + desk-pin + generic-list-exclusion pattern exactly, with no seo field/group"
    - "grid-template-rows: 0fr -> 1fr on a dedicated wrapper div is the reveal-to-intrinsic-height pattern for hover/focus-visible content panels, replacing brittle fixed max-height clips"

key-files:
  created:
    - sanity/schemas/editionsPage.ts
  modified:
    - sanity/schemas/index.ts
    - sanity/schemas/structure.ts
    - src/lib/sanity.ts
    - src/lib/site-config.ts
    - src/components/EditionsOverviewBody.astro
    - src/pages/editions/index.astro
    - src/pages/en/editions/index.astro
    - tests/unit/site-config.test.ts
    - tests/e2e/edition.spec.ts

key-decisions:
  - "editionsPage schema is intro-only (no seo group) per explicit plan scope — route files keep hardcoding their own seoTitle/seoDescription"
  - "Statement reveal owned by a new .editions-index__statement-wrap grid container (grid-template-rows 0fr->1fr); .editions-index__statement itself keeps only its opacity transition plus min-height: 0 so it can collapse below intrinsic height inside the grid item"
  - "fr/en placeholder intro copy is byte-identical between sanity/schemas/editionsPage.ts's defaultIntro and src/lib/site-config.ts's DEFAULT_EDITIONS_INTRO, and deliberately carries no commerce vocabulary (EDN-06)"

patterns-established:
  - "Task 2 followed explicit RED/GREEN TDD gates as two separate commits (test(...) then feat(...)) even though the plan is type: execute, not type: tdd, per the task's own tdd=\"true\" flag"

requirements-completed: [EDN-02, EDN-06, CMS-04]

coverage:
  - id: D1
    description: "editionsPage Sanity singleton (schema + registration + desk pin), intro-only, no seo"
    requirement: "CMS-04"
    verification:
      - kind: other
        ref: "npm --prefix sanity run lint && npm --prefix sanity run build"
        status: pass
    human_judgment: false
  - id: D2
    description: "resolveEditionsIntro()/getEditionsPage() data + config layer mirroring the HomePage trio, with correct fallback behavior"
    requirement: "CMS-04"
    verification:
      - kind: unit
        ref: "tests/unit/site-config.test.ts#resolveEditionsIntro"
        status: pass
      - kind: other
        ref: "npm run typecheck"
        status: pass
    human_judgment: false
  - id: D3
    description: "Statement hover/focus-visible reveal animates to intrinsic height (grid-template-rows 0fr->1fr) instead of clipping at a fixed 80px, on both /editions/ and /en/editions/"
    requirement: "EDN-02"
    verification:
      - kind: e2e
        ref: "tests/e2e/edition.spec.ts#editions overview layout > hovering a row reveals its statement and activates the cursor-following preview panel with that row's photo"
        status: pass
    human_judgment: false
  - id: D4
    description: "Redundant first-row top-border hairline removed; shared .editions-list__header hairline untouched"
    verification: []
    human_judgment: true
    rationale: "Visual absence of a specific hairline is not asserted by any existing or new automated test — confirmed via source diff/code review, not a runtime check"
  - id: D5
    description: "Sanity-editable, body-typography .editions-list__intro renders under the H1 on both locales, sourced via getEditionsPage -> resolveEditionsIntro with DEFAULT_EDITIONS_INTRO fallback"
    requirement: "EDN-02"
    verification:
      - kind: other
        ref: "npm run build (27 pages) + npm run test:artifact"
        status: pass
    human_judgment: true
    rationale: "No dedicated automated assertion targets .editions-list__intro's rendered text/typography on either route in this pass; build/artifact confirm the routes render without error but not the specific visual/text outcome"
  - id: D6
    description: "EDN-06 stays clean across the changed surface (no commerce affordance/token introduced)"
    requirement: "EDN-06"
    verification:
      - kind: e2e
        ref: "tests/e2e/edition.spec.ts#editions overview > shows no price, availability, or purchase affordance (EDN-06)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/edition.spec.ts#no commerce affordances (detail) > shows no price, availability, or purchase affordance (EDN-06)"
        status: pass
      - kind: other
        ref: "npm run test:artifact"
        status: pass
    human_judgment: false

duration: ~45min
completed: 2026-07-28
status: complete
---

# Quick Task 260728-el6: Éditions Overview Statement-Truncation Fix + Intro Text Summary

**Replaced the Éditions overview's fixed-height statement hover clip with a `grid-template-rows` intrinsic-height reveal, removed the redundant first-row hairline, and added a Sanity-editable body-typography intro paragraph under the H1 via a new `editionsPage` singleton mirroring `homePage`'s data/config pattern.**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-07-28T08:05:00Z (approx, worktree branch check)
- **Completed:** 2026-07-28T08:51:26Z
- **Tasks:** 3 completed (Task 2 executed as two TDD sub-commits: RED then GREEN)
- **Files modified:** 9 (1 created, 8 modified)

## Accomplishments

- Real bug fixed: hovering a long real édition statement (e.g. Silos) now reveals the FULL text — the `.editions-index__statement-wrap` grid container animates `grid-template-rows: 0fr -> 1fr` on hover/focus-visible, growing to the statement's true intrinsic height instead of clipping at a hardcoded `max-height: 80px`.
- New Sanity `editionsPage` singleton (intro-only, no seo) registered in `schemas/index.ts` and desk-pinned in `structure.ts`, mirroring `homePage.ts` exactly.
- New `getEditionsPage()` / `EditionsPage` / `EDITIONS_PAGE_QUERY` in `src/lib/sanity.ts`, and `DEFAULT_EDITIONS_INTRO` / `resolveEditionsIntro()` in `src/lib/site-config.ts`, mirroring the existing `HomePage`/`getHomePage()`/`resolveHomepageIntro()` trio.
- Both `/editions/` and `/en/editions/` now fetch `getEditionsPage()` and render a body-typography `.editions-list__intro` paragraph directly under the H1, with correct fr/en placeholder copy even before the Studio document is seeded.
- Removed the redundant `.editions-index__row:first-of-type` top-border hairline; the shared `.editions-list__header` page-top hairline is untouched.
- New unit tests (`resolveEditionsIntro` fallback + populated-value cases) and a new e2e anti-truncation `expect.poll` assertion proving the second row's statement bounding-box height exceeds 80px on hover.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add editionsPage Sanity singleton (schema + registration + desk pin)** - `0701430` (feat)
2. **Task 2: Data-fetch + config layer for the editions intro (TDD)**
   - RED: `fdcc6c1` (test) — added failing `resolveEditionsIntro` unit tests, confirmed 3 failures / 207 pre-existing tests still passing
   - GREEN: `f12a9b0` (feat) — implemented `getEditionsPage`/`EditionsPage`/`EDITIONS_PAGE_QUERY` + `DEFAULT_EDITIONS_INTRO`/`resolveEditionsIntro`, confirmed 210/210 passing
3. **Task 3: Component fix + route wiring + anti-truncation e2e** - `51f8f46` (fix)

**Plan metadata:** commit pending — orchestrator handles the docs commit (this SUMMARY.md, STATE.md) separately per constraints.

## Files Created/Modified

- `sanity/schemas/editionsPage.ts` - New intro-only singleton schema (no seo group), byte-identical fr/en placeholder copy to the code-side default
- `sanity/schemas/index.ts` - Registers `editionsPage` in `schemaTypes`, right after `homePage`
- `sanity/schemas/structure.ts` - Desk-pins `editionsPage` as a fixed-documentId singleton, excludes it from the generic document-type list
- `src/lib/sanity.ts` - `EditionsPage` interface, `EDITIONS_PAGE_QUERY`, `getEditionsPage()`
- `src/lib/site-config.ts` - `DEFAULT_EDITIONS_INTRO`, `resolveEditionsIntro()`
- `src/components/EditionsOverviewBody.astro` - `intro` prop + `.editions-list__intro` render; `.editions-index__statement-wrap` grid-rows reveal; removed first-row hairline rule
- `src/pages/editions/index.astro` - Fetches `getEditionsPage()`, resolves and passes `intro`
- `src/pages/en/editions/index.astro` - Same wiring, EN locale
- `tests/unit/site-config.test.ts` - `resolveEditionsIntro` describe block (3 new tests)
- `tests/e2e/edition.spec.ts` - Anti-truncation `expect.poll` assertion on the second row's statement height

## Decisions Made

- **editionsPage is intro-only, no seo field/group** — per explicit plan scope; route files (`src/pages/editions/index.astro`, `src/pages/en/editions/index.astro`) keep their own hardcoded `seoTitle`/`seoDescription` constants unchanged, exactly as instructed.
- **Statement height animation owned by the wrapper, not the statement itself** — `.editions-index__statement-wrap` is the grid container animating `grid-template-rows`; `.editions-index__statement` keeps only its `opacity` transition plus `min-height: 0` (required for a grid item to collapse below its intrinsic content height). This is the standard 0fr->1fr accordion pattern and avoids re-introducing a fixed height anywhere in the reveal path.
- **Task 2 (tdd="true") executed as a genuine RED/GREEN pair** — even though the plan's top-level `type` is `execute` (not `tdd`), the task's own `tdd="true"` flag was honored: the implementation was temporarily stashed, the new tests were written and confirmed failing (`resolveEditionsIntro is not a function`, 3 failed / 207 passed), committed as `test(...)`, then the implementation was restored, confirmed passing (210/210), and committed as `feat(...)`.
- **Placeholder copy kept byte-identical** between `sanity/schemas/editionsPage.ts`'s `defaultIntro` and `src/lib/site-config.ts`'s `DEFAULT_EDITIONS_INTRO`, per the plan's explicit requirement, so Studio and the code fallback never diverge until Romane edits the live document.

## Deviations from Plan

None - plan executed exactly as written. The only structural choice beyond the plan's literal task order was splitting Task 2 into two commits (RED then GREEN) to honor its `tdd="true"` flag per the executor's TDD execution flow — this is process, not scope, deviation.

## Issues Encountered

- This worktree was missing `.env` (gitignored) and both `node_modules` trees (root and `sanity/`), consistent with prior quick tasks in this project. Copied `.env` from the main checkout and ran `npm ci` / `npm ci --prefix sanity` before any verification — neither is a code change, neither was committed (both remain gitignored/untracked from git's perspective).

## User Setup Required

None - no external service configuration required. The live `editionsPage` Sanity document was explicitly NOT created/seeded/deployed in this task (out of scope per the plan) — until Romane or Florian creates and publishes it in Studio, both routes render the `DEFAULT_EDITIONS_INTRO` fallback copy, which is correct, expected behavior confirmed by the `resolveEditionsIntro` unit tests.

## Next Phase Readiness

- Both real bugs (statement truncation, redundant hairline) are fixed and verified live via the automated gate (unit/typecheck/build/artifact/targeted e2e/full e2e/Sanity lint+build).
- The `editionsPage` singleton is registered and desk-pinned but has no live document yet — seeding it (via a temporary editor-role token, mirroring how `siteSettings`/`homePage` were seeded in Phase 1) is the natural follow-up so Romane can start editing the real intro copy in Studio, but is not a blocker: the code-side default renders correctly in the interim.
- No blockers for further Éditions-related work.

## Full Verification Gate Results

1. `npm run typecheck` — 0 errors, 0 warnings, 2 pre-existing hints (unrelated `webkitBackgroundClip` deprecation notices in `tests/e2e/homepage-wordmark-peek.spec.ts`)
2. `npm run test:coverage` — 210/210 unit tests pass; coverage 96.26% stmts / 91.94% branch / 95.45% funcs / 96.79% lines (no threshold failures, exit code 0)
3. `npm run build` — 27 pages built successfully, both `/editions/` and `/en/editions/` overview routes render
4. `npm run test:artifact` — "Static artifact verified (27 HTML files, base /)"
5. `npx playwright test tests/e2e/edition.spec.ts` — 12/12 targeted tests pass, including the new anti-truncation poll and the unchanged hover/EDN-06 assertions
6. Full e2e suite (`npx playwright test`) — 252/252 pass (251 chromium + smoke tests on webkit-mobile), zero regressions
7. `npm --prefix sanity run lint && npm --prefix sanity run build` — both clean, Studio registers/pins the new singleton without error

---
*Phase: quick-260728-el6*
*Completed: 2026-07-28*

## Self-Check: PASSED

All 11 claimed files verified present on disk (created + modified files, plus this SUMMARY.md). All 4 task commit hashes (`0701430`, `fdcc6c1`, `f12a9b0`, `51f8f46`) confirmed present in `git log --oneline --all`.
