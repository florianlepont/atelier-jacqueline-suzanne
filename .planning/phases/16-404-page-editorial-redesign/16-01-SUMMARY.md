---
phase: 16-404-page-editorial-redesign
plan: 01
subsystem: ui
tags: [404, error-page, accessibility, wcag, pure-function, pop-rate, tdd]

requires: []
provides:
  - "src/lib/pop-rate.ts: pure proximityToInterval(proximity) plus MIN_INTERVAL_MS/MAX_INTERVAL_MS/DRIFT_INTERVAL_MS constants"
  - "The single tested enforcement point for the D-10 photosensitive-safety cap (~2.86 changes/sec, under the ~3/sec ceiling)"
affects: [16-03-client-engine]

tech-stack:
  added: []
  patterns:
    - "Pure, framework-free math module mirroring src/lib/image-orientation.ts's shape (no window/document/matchMedia, defensive on non-finite input, never throws)"
    - "TDD RED->GREEN gate: failing contract suite committed before the implementation"

key-files:
  created:
    - src/lib/pop-rate.ts
    - tests/unit/pop-rate.test.ts
  modified: []

key-decisions:
  - "MIN_INTERVAL_MS locked at 350 (not 333) per RESEARCH.md Pitfall 1 - 1000/333 ≈ 3.003/sec is technically over the ≈3/sec cap; 350 gives ≈2.86/sec"
  - "MAX_INTERVAL_MS=2200, DRIFT_INTERVAL_MS=4000 per RESEARCH.md Pattern 3 defaults (Claude's Discretion constants, locked here for plan 16-03 to import verbatim)"
  - "Floor clamp Math.max(interval, MIN_INTERVAL_MS) kept as an independent enforcement step even though redundant with the input clamp - defense in depth per plan Task 2 instructions"

patterns-established:
  - "src/lib/pop-rate.ts is the single source of truth for the pop-rate curve and its safety cap - plan 16-03's client <script> must import these exact symbols rather than re-deriving the math inline"

requirements-completed: [ERR-01]

coverage:
  - id: D1
    description: "Pure proximityToInterval(proximity) module implementing the D-08 speed curve (endpoint/midpoint mapping, monotonic interpolation) with the D-10 photosensitive-safety floor as a proven invariant"
    requirement: "ERR-01"
    verification:
      - kind: unit
        ref: "tests/unit/pop-rate.test.ts#proximityToInterval (7 cases: 0/1/0.5 mapping, above/below-range clamping, non-finite defensiveness, floor-sweep invariant)"
        status: pass
      - kind: unit
        ref: "tests/unit/pop-rate.test.ts#pop-rate constants (MIN_INTERVAL_MS D-10 ceiling assertion, DRIFT_INTERVAL_MS D-11 sanity assertion)"
        status: pass
    human_judgment: false

duration: 6min
completed: 2026-07-29
status: complete
---

# Phase 16 Plan 01: Pop-Rate Interval Math Summary

**Pure `proximityToInterval` module (350/2200/4000ms constants) proving the WCAG-adjacent ≈3/sec photosensitive-safety cap as a unit-tested invariant, ready for plan 16-03's client engine to import.**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-07-29T13:31:20Z
- **Completed:** 2026-07-29T13:34:06Z
- **Tasks:** 2 (TDD RED + GREEN)
- **Files modified:** 2 (both new)

## Accomplishments
- Wrote a fixture-free, 9-case failing contract suite (`tests/unit/pop-rate.test.ts`) proving RED against the not-yet-existing module
- Implemented `src/lib/pop-rate.ts`: pure `proximityToInterval(proximity)` plus `MIN_INTERVAL_MS`/`MAX_INTERVAL_MS`/`DRIFT_INTERVAL_MS`, all 9 cases GREEN
- Locked the D-10 accessibility cap as a proven invariant: `1000/MIN_INTERVAL_MS < 3` (≈2.86/sec), with `MIN_INTERVAL_MS = 350` (not the naive-but-unsafe 333 per RESEARCH.md Pitfall 1)
- Confirmed the module references no browser globals (`window`/`document`/`matchMedia`), so it is importable unmodified into both Vitest (Node) and the 404.astro client `<script>` (D-09 shared curve for pointer and touch)

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): Write the failing pop-rate contract suite** - `0ec999c` (test)
2. **Task 2 (GREEN): Implement the pure pop-rate module** - `597fc5a` (feat)

**Plan metadata:** committed together with this SUMMARY (see final commit below)

_TDD gate sequence confirmed: `test(16-01)` commit precedes `feat(16-01)` commit in git log; no refactor commit was needed (implementation matched the contract on first pass, no cleanup required)._

## Files Created/Modified
- `tests/unit/pop-rate.test.ts` - 9-case Vitest suite: proximity 0/1/0.5 mapping, above/below-range clamping, non-finite defensiveness, floor-sweep invariant, and the two constant-invariant assertions (D-10 cap, D-11 drift sanity)
- `src/lib/pop-rate.ts` - Pure ES module exporting `MIN_INTERVAL_MS` (350), `MAX_INTERVAL_MS` (2200), `DRIFT_INTERVAL_MS` (4000), and `proximityToInterval(proximity: number): number`

## Decisions Made
- None beyond what the plan already specified — constants and clamping strategy were locked in the plan itself (RESEARCH.md Pattern 3 / Pitfall 1); implementation followed verbatim.

## Deviations from Plan

None - plan executed exactly as written. Both tasks matched their acceptance criteria on the first implementation pass; no auto-fixes, no blocking issues, no architectural questions.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. This plan adds zero new dependencies (pure TypeScript module, no npm install).

## Next Phase Readiness

- `src/lib/pop-rate.ts` is complete, fully unit-tested, and exports exactly the four symbols plan 16-03's client engine needs (`MIN_INTERVAL_MS`, `MAX_INTERVAL_MS`, `DRIFT_INTERVAL_MS`, `proximityToInterval`).
- The D-10 photosensitive-safety cap is now a proven, tested invariant rather than a runtime hope — plan 16-03 can trust the floor without re-deriving it.
- No blockers for the concurrently-executing sibling plan 16-02 (static shell) or the downstream plan 16-03 (client engine), since this plan touched no shared files (`src/pages/404.astro`, `tests/e2e/not-found.spec.ts`, `tests/e2e/accessibility.spec.ts` were all explicitly out of scope here).

---
*Phase: 16-404-page-editorial-redesign*
*Completed: 2026-07-29*

## Self-Check: PASSED
- FOUND: src/lib/pop-rate.ts
- FOUND: tests/unit/pop-rate.test.ts
- FOUND: commit 0ec999c (test(16-01): add failing pop-rate contract suite)
- FOUND: commit 597fc5a (feat(16-01): implement capped pop-rate interval math)

## Addendum: D-10 cap override (2026-07-29, post-completion)

This plan was already complete and merged when, at the plan 16-03 human-verify
checkpoint, the user tested the live ~2.86/sec-capped build and asked for it
to go "vraiment plus vite" (really faster), explicitly accepting the
flash-rate tradeoff ("tant pis pour les flash effect"). Presented with the
WCAG 2.3.1 risk restated plainly and three options (keep the WCAG-safe cap /
raise it significantly but keep a finite ceiling / remove the cap entirely),
the user chose to raise it significantly while keeping a finite ceiling.
Recorded as a live post-checkpoint follow-on reconciled into tracked history,
mirroring this project's own Phase 6 precedent (see STATE.md's note on
`06-01-SUMMARY.md`).

**What changed:**
- `src/lib/pop-rate.ts`: `MIN_INTERVAL_MS` raised from `350` (≈2.86/sec) to
  `150` (≈6.7/sec). `MAX_INTERVAL_MS`/`DRIFT_INTERVAL_MS` and
  `proximityToInterval`'s logic are untouched.
- `tests/unit/pop-rate.test.ts`: the now-intentionally-false
  `1000/MIN_INTERVAL_MS < 3` WCAG-framed assertion was replaced with the
  invariant that still holds — a hard floor exists and
  `proximityToInterval` never returns below `MIN_INTERVAL_MS` for any input.
  The `proximity=0.5` exact-midpoint expectation was recomputed from `1275`
  to `1175` to match the new constant.
- `.planning/phases/16-404-page-editorial-redesign/16-CONTEXT.md`: D-10
  marked SUPERSEDED with a dated override entry recording the exact
  decision and options presented (commit `4049bdb`).
- `.planning/phases/16-404-page-editorial-redesign/16-01-PLAN.md`:
  `must_haves.truths` amended in place (marked `[AMENDED 2026-07-29
  post-completion]`) to point here rather than restate the now-superseded
  ≈3/sec framing.

**Verification:** `npx vitest run tests/unit/pop-rate.test.ts` (9/9),
`npm run typecheck` (0 errors), `npm run build` all green post-change.

**This is a knowing, explicit, user-confirmed departure from WCAG 2.3.1
general-flash guidance for this one page** — not a regression or an
oversight. Do not revert `MIN_INTERVAL_MS` back toward 350 without the user
raising the cap again.

**Commit:** `0707207` (fix(16-01): raise pop-rate cap to ~6.7/sec per live
checkpoint override (D-10))
