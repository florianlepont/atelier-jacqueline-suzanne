---
phase: quick-260728-fjl
plan: 01
subsystem: testing
tags: [playwright, e2e, ci, flaky-test-fix]

# Dependency graph
requires:
  - phase: quick-260728-el6
    provides: "Éditions overview intro paragraph + statement-clip fix (commits 51f8f46/3893379) — the change whose new `.editions-list__intro` row-geometry shift exposed the pre-existing cursor-bleed bug."
provides:
  - "Deterministic reset of Playwright's virtual mouse position at the top of the editions-overview hover test's cross-locale loop, eliminating CI-only hover-state bleed between iterations."
affects: [ci-pipeline, editions-overview-e2e]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Reset Playwright's virtual mouse position (`page.mouse.move(0, 0)`) immediately after `page.goto()` in any test that loops over multiple URLs on one shared `page` and asserts hover-driven state — the virtual cursor persists across navigations by design."

key-files:
  created: []
  modified: [tests/e2e/edition.spec.ts]

key-decisions:
  - "Confirmed root cause was CI-only stale-cursor bleed (not app code) by reproducing green on a clean local build — no production code touched."

patterns-established:
  - "Cross-navigation Playwright loops that assert hover state must explicitly reset mouse position per iteration; goto() does not do this implicitly."

requirements-completed:
  - "CI-HOTFIX: make `main` green again — the merged quick task 260728-el6 (Éditions overview intro + statement-clip fix, commits 51f8f46/3893379) is blocked from deploy because CI is red. No user-facing requirement of its own."

coverage:
  - id: D1
    description: "The `editions overview layout` hover test's `not.toHaveClass(/active/)` assertion passes on both loop iterations (/editions/ and /en/editions/) via an explicit virtual-cursor reset after each `page.goto()`."
    verification:
      - kind: e2e
        ref: "tests/e2e/edition.spec.ts#editions overview layout > hovering a row reveals its statement and activates the cursor-following preview panel with that row's photo"
        status: pass
    human_judgment: false
  - id: D2
    description: "Full Playwright suite (252 tests, chromium + webkit-mobile) passes on a clean build, confirming no other test relied on cross-navigation mouse-position bleed and typecheck stays clean."
    verification:
      - kind: e2e
        ref: "npx playwright test (full suite)"
        status: pass
      - kind: other
        ref: "npm run typecheck"
        status: pass
    human_judgment: false

duration: 20min
completed: 2026-07-28
status: complete
---

# Quick Task 260728-fjl: Fix Éditions e2e hover-bleed across nav Summary

**One added `page.mouse.move(0, 0)` reset (plus a why-comment) in `tests/e2e/edition.spec.ts`'s cross-locale hover loop, fixing the CI-only red build (GitHub Actions run 30344677877) caused by Playwright's virtual cursor persisting across `page.goto()`.**

## Performance

- **Duration:** 20 min
- **Started:** 2026-07-28T08:57:00Z
- **Completed:** 2026-07-28T09:17:29Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Reset Playwright's virtual mouse position to `(0, 0)` at the top of each loop iteration in the `editions overview layout` hover test, immediately after `page.goto(url)` and before the `not.toHaveClass(/active/)` assertion, with a why-comment explaining the persistence behavior.
- Confirmed the fix on a clean local build: targeted spec (12/12) and the FULL Playwright suite (252/252, chromium + webkit-mobile) pass; `npm run typecheck` reports 0 errors.
- Confirmed the fix does not mask intended behavior — `firstRow.hover()` still activates the panel, the statement is still visible, and the unchanged anti-truncation `expect.poll` still holds.

## Task Commits

Each task was committed atomically:

1. **Task 1: Reset the persistent virtual cursor at the top of the editions-overview hover loop** - `2d9b09a` (fix)

_Note: per orchestrator instructions, this docs SUMMARY commit is handled separately by the orchestrator, not by this executor._

## Files Created/Modified
- `tests/e2e/edition.spec.ts` - Added `await page.mouse.move(0, 0);` plus a why-comment inside the `editions overview layout` hover test's `for (const url of ['/editions/', '/en/editions/'])` loop, immediately after `page.goto(url)` and before the `preview`/`rows` locators and the `not.toHaveClass(/active/)` assertion.

## Decisions Made
None beyond the plan's prescribed root-cause fix — plan executed exactly as written (one line + one comment, no other file or assertion touched).

## Deviations from Plan

None - plan executed exactly as written. One notable environmental wrinkle during verification (documented under Issues Encountered, not a plan deviation): the first targeted-spec run reused a stale `npm run preview` server (Playwright's `reuseExistingServer` config) left over from before this worktree's `dist/` existed, producing an unrelated, non-reproducible anti-truncation-poll failure on `secondRow`'s statement height. This was diagnosed as a leftover process on port 4321, not caused by the cursor-reset change. After killing that process and running a fresh `npm run build`, both the targeted spec and the full suite passed cleanly with no flakes.

## Issues Encountered
- Worktree-local prerequisites were missing (`.env`, `node_modules`) — copied `.env` from the main checkout and ran `npm ci`, per plan-execution setup notes; both are gitignored and not committed.
- First targeted-spec run picked up a stale `npm run preview` webServer process from a prior session (port 4321, `reuseExistingServer: true` locally) serving against a since-deleted `dist/`, producing one unrelated flaky failure (anti-truncation poll, height exactly 80 instead of >80). Killed the stale process, ran `npm run build` fresh for this worktree, and reran — clean pass, confirming the flake was an artifact of environment reuse, not the code change.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `main`'s Playwright e2e gate is confirmed green locally (targeted spec + full 252-test suite + typecheck), unblocking deploy of the already-merged 260728-el6 (Éditions overview intro + statement-clip) work once this fix lands on `main`.
- No blockers or concerns for follow-up work.

---
*Phase: quick-260728-fjl*
*Completed: 2026-07-28*

## Self-Check: PASSED
- FOUND: tests/e2e/edition.spec.ts
- FOUND: 2d9b09a (commit)
