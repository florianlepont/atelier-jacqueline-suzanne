---
phase: quick-260727-ohf
plan: 01
subsystem: testing
tags: [vitest, playwright, axe-core, sanity, dashboardLogic]

requires: []
provides:
  - Unit test coverage for all seven previously-untested dashboardLogic.ts exports
  - Accessibility scan coverage for /editions/, /confidentialite/, /en/, /en/about/, and one dynamically-discovered édition détail page
affects: [sanity-studio-dashboard, e2e-accessibility]

tech-stack:
  added: []
  patterns:
    - "Fixture-as-plain-object-literal for Sanity transaction-log types in tests/ (avoids importing @sanity/types, which only resolves under sanity/node_modules)"

key-files:
  created: []
  modified:
    - tests/unit/dashboard-logic.test.ts
    - tests/e2e/accessibility.spec.ts

key-decisions:
  - "Wrote mutationFields tests against the ACTUAL source behavior (strips array-index bracket suffixes via .split(/[.[]/,1)[0], filters `_`-prefixed fields via .filter(field => field && !field.startsWith('_'))) rather than the plan's 'corrected' prose, which claimed the opposite (raw-paths-verbatim) — verified directly by reading sanity/editorial/dashboardLogic.ts:132-160 before writing fixtures, per the plan's own context instruction to trust the source over prose."

patterns-established: []

requirements-completed: [AUDIT-COV-1, AUDIT-COV-2]

coverage:
  - id: D1
    description: "Unit tests for isGalleryOnline, mutationDocumentId, mutationFields, contentNoun, attentionPriority, describeTransaction (all branches), and buildActivities (all cases) in dashboardLogic.ts"
    requirement: AUDIT-COV-1
    verification:
      - kind: unit
        ref: "tests/unit/dashboard-logic.test.ts (76 tests, npm run test:unit)"
        status: pass
      - kind: unit
        ref: "npm run test:coverage — dashboardLogic.ts 94.25% stmt / 91.37% branch"
        status: pass
    human_judgment: false
  - id: D2
    description: "accessibility.spec.ts expanded to scan /editions/, /confidentialite/, /en/, /en/about/, and one dynamically-discovered édition détail page"
    requirement: AUDIT-COV-2
    verification:
      - kind: e2e
        ref: "tests/e2e/accessibility.spec.ts (10 tests, npx playwright test tests/e2e/accessibility.spec.ts)"
        status: pass
    human_judgment: false

duration: 35min
completed: 2026-07-27
status: complete
---

# Quick Task 260727-ohf: Test Coverage Additions Summary

**Unit tests for all seven untested dashboardLogic.ts exports (43.67%/43.1% → 94.25%/91.37% stmt/branch coverage) plus 5 new accessibility.spec.ts routes including a dynamic édition détail scan**

## Performance

- **Duration:** ~35 min
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- `tests/unit/dashboard-logic.test.ts` gained 40 new tests across 7 new `describe` blocks (`isGalleryOnline`, `mutationDocumentId`, `mutationFields`, `contentNoun`, `attentionPriority`, `describeTransaction`, `buildActivities`), for a total of 76 passing tests in the file.
- `describeTransaction` is covered across all 7 precedence branches: published, unpublished, created, modified (1 field), modified (2 fields), modified (>2 fields), and the generic fallback.
- `buildActivities` is covered for: empty transaction list, display-name authorship, email fallback, "Un membre de l'équipe" fallback, most-recent-wins dedup across two transactions for the same document, and a transaction referencing a document absent from the documents array.
- `dashboardLogic.ts` coverage rose from the 43.67% stmt / 43.1% branch baseline to **94.25% stmt / 91.37% branch** (per `npm run test:coverage`). Remaining uncovered lines (378-384, 401) belong to `attentionRowSummaryDetail` and `editorialStatus`'s final fallback branch, which are outside this plan's scope (not in the seven named exports).
- `tests/e2e/accessibility.spec.ts` now scans the original 5 routes plus `/editions/`, `/confidentialite/`, `/en/`, `/en/about/` (static loop, identical AxeBuilder config/assertion), and a new dedicated test that discovers the first published édition détail page dynamically (resolved to `/editions/rebut/` during this run) and scans it with the same axe configuration — 10 tests total, all passing.

## Task Commits

1. **Task 1: Unit-test the untested dashboardLogic.ts exports** - `442dff8` (test)
2. **Task 2: Expand accessibility.spec.ts route coverage** - `9a77458` (test)

_No feat/refactor commits — this plan is test-only, no production code touched._

## Files Created/Modified
- `tests/unit/dashboard-logic.test.ts` - Added imports for the 7 new exports and 40 new tests in 7 `describe` blocks; existing 36 tests untouched.
- `tests/e2e/accessibility.spec.ts` - Added 4 routes to the static loop (`/editions/`, `/confidentialite/`, `/en/`, `/en/about/`) and one new `test()` block that discovers and scans the first published édition détail page.

## Decisions Made
- **mutationFields test fixtures corrected against actual source, not the plan's prose.** The plan's Task 1 action block carried an explicit "correction" claiming `mutationFields` returns raw, unmodified path strings (no array-index stripping, no `_`-prefix filtering). Reading `sanity/editorial/dashboardLogic.ts:132-160` directly — as the plan's own `<context>` block instructs ("the function bodies are the source of truth ... do NOT guess shapes") — showed the function's final `.map(...).filter(...)` pipeline DOES strip everything from the first `.`/`[` onward (`"images[0]"` → `"images"`) AND DOES drop `_`-prefixed fields (`"_updatedAt"` is filtered out entirely, not just left as `"_updatedAt"`). Tests were written to assert this actual, verified runtime behavior. This is not a code change — dashboardLogic.ts itself was not touched — only the test fixtures/assertions reflect ground truth over an inaccurate plan annotation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug in plan prose, not code] mutationFields test assertions written against verified source behavior instead of the plan's incorrect "correction"**
- **Found during:** Task 1 (writing `mutationFields` tests)
- **Issue:** The plan's Task 1 action block contained a "CORRECTION" claiming `mutationFields` does not strip array-index suffixes or filter `_`-prefixed fields, contradicting the actual function body at `sanity/editorial/dashboardLogic.ts:152-159`, which visibly does both via `.map(...).filter(...)`.
- **Fix:** Wrote all `mutationFields` test assertions (bracket-stripping, `_`-prefix filtering) against the real, executed behavior confirmed by reading the source and running the tests, rather than the plan's inaccurate prose.
- **Files modified:** `tests/unit/dashboard-logic.test.ts` (test-only; no production code touched)
- **Verification:** All 7 `mutationFields` tests pass (`npm run test:unit`); `npm run typecheck` reports 0 errors.
- **Committed in:** `442dff8` (Task 1 commit)

**2. [Rule 3 - Blocking] Added `items: []` to insert-patch test fixtures**
- **Found during:** Task 1 (`npm run typecheck`)
- **Issue:** `astro check` reported `Property 'items' is missing in type '{ replace/after/before: string; items: unknown[] }'` for the three `insert.{before,after,replace}` test fixtures — the Sanity `InsertPatch` type structurally requires an `items` array alongside the position key, which the plan's fixture-shape notes did not mention.
- **Fix:** Added `items: []` to each of the three insert-patch fixtures.
- **Files modified:** `tests/unit/dashboard-logic.test.ts`
- **Verification:** `npm run typecheck` reports 0 errors after the fix.
- **Committed in:** `442dff8` (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 bug-in-plan-prose corrected against source, 1 blocking type error)
**Impact on plan:** Both fixes required for correctness (accurate test assertions) and to unblock `astro check`. No scope creep — both are within `tests/unit/dashboard-logic.test.ts`, the single file this task was scoped to touch.

## Issues Encountered
None beyond the deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `dashboardLogic.ts` is now well-covered (94.25%/91.37%); remaining gaps are two minor branches in unrelated functions (`attentionRowSummaryDetail`, `editorialStatus`'s fallback) outside this plan's scope.
- `accessibility.spec.ts` now covers 9 static routes plus one dynamic détail scan (was 5 static routes only); `/editions/*` and `/en/*` blind spots identified by the prior audit are closed.
- Full verification suite (`npm run typecheck`, `npm run test:coverage`, `npm run build`, `npx playwright test`) all green.

---
*Phase: quick-260727-ohf*
*Completed: 2026-07-27*

## Self-Check: PASSED
- FOUND: tests/unit/dashboard-logic.test.ts
- FOUND: tests/e2e/accessibility.spec.ts
- FOUND commit: 442dff8
- FOUND commit: 9a77458
