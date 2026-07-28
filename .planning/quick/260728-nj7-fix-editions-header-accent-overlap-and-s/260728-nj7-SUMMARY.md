---
phase: quick-260728-nj7
plan: 01
subsystem: ui
tags: [css, astro, editions, typography]

requires:
  - phase: quick-260728-lbh
    provides: sketch-012 F1 Éditions overview header (large h1, eyebrow, halftone)
provides:
  - Fixed "É" accent overlap into the eyebrow line on the Éditions overview h1
  - Reduced header-to-first-row vertical gap from 80px to ~56px
affects: [editions-overview, editions-header]

tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - src/components/EditionsOverviewBody.astro

key-decisions:
  - "Fixed the accent overlap via a line-height RATIO change (0.9 -> 1.05) rather than an absolute nudge, so the fix holds across the h1's fluid clamp(64px, 9vw, 140px) sizing at any viewport."
  - "Reduced only .editions-list__header's margin-bottom (var(--space-2xl) -> var(--space-lg)); left .editions-index__row's own padding untouched since it governs shared inter-row rhythm, not the header gap."

patterns-established: []

requirements-completed: []

coverage:
  - id: D1
    description: "É accent in the Éditions h1 no longer overlaps the eyebrow line above it, on both /editions/ and /en/editions/, at 800px and 1440px"
    verification:
      - kind: automated_ui
        ref: "live-browser Range.getBoundingClientRect() measurement via Playwright against npm run preview, both locales, both widths"
        status: pass
      - kind: e2e
        ref: "npx playwright test tests/e2e/edition.spec.ts (13 tests, all pass)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Header-to-first-row vertical gap tightened from 80px to ~56px on both locales, at both widths"
    verification:
      - kind: automated_ui
        ref: "live-browser getBoundingClientRect() measurement via Playwright: header-bottom to row-number-label-top gap measured 57px (was 80px) at all four route/width combinations"
        status: pass
    human_judgment: false
  - id: D3
    description: "No regression to typecheck, build, artifact verification, or the full e2e suite"
    verification:
      - kind: other
        ref: "npm run typecheck"
        status: pass
      - kind: other
        ref: "npm run build"
        status: pass
      - kind: other
        ref: "npm run test:artifact"
        status: pass
      - kind: e2e
        ref: "npx playwright test (full suite, 252 tests)"
        status: pass
    human_judgment: false

duration: 15min
completed: 2026-07-28
status: complete
---

# Phase quick-260728-nj7: Fix Éditions header accent overlap and spacing Summary

**Two single-property CSS value changes in `EditionsOverviewBody.astro`: `line-height: 0.9 -> 1.05` on the h1 (fixes "É" accent overlapping the eyebrow) and `margin-bottom: var(--space-2xl) -> var(--space-lg)` on the header (tightens the header-to-row gap from 80px to ~56px).**

## Performance

- **Duration:** ~15 min
- **Completed:** 2026-07-28
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Fixed the "É" accent overlapping the "Atelier Jacqueline Suzanne" eyebrow line on the Éditions overview h1, on both `/editions/` and `/en/editions/`, verified live at 800px and 1440px
- Tightened the oversized header-to-first-row gap (80px -> ~56px) that resulted from the much larger sketch-012 F1 h1 title size

## Task Commits

1. **Task 1: Fix the "É"/eyebrow overlap and the header-to-row gap in EditionsOverviewBody.astro** - `447eeae` (fix)

**Plan metadata:** (docs commit handled by orchestrator, not this executor)

## Files Created/Modified
- `src/components/EditionsOverviewBody.astro` - `.editions-list h1` `line-height` changed `0.9` -> `1.05`; `.editions-list__header` `margin-bottom` changed `var(--space-2xl)` -> `var(--space-lg)`. No other property, selector, keyframe, markup line, or the `<script>` block touched.

## Decisions Made
- Used a line-height ratio change (not an absolute pixel nudge) for the accent-overlap fix, since the h1 uses a fluid `clamp()` font-size — a ratio holds correctness across all viewports, an absolute value would not.
- Left `.editions-index__row`'s own `padding: var(--space-xl) 0` untouched, since it is shared inter-row rhythm (also governs the Rebut->Silos gap) and was not part of either reported bug.

## Deviations from Plan

None - plan executed exactly as written. Exactly two property values changed, as scoped.

## Issues Encountered

None. Worktree required the standard pre-existing local-only setup (copying `.env` from the main checkout, running `npm ci` for `node_modules`) before verification could run — neither is a code change and neither was committed.

## Verification Results (actual, not assumed)

- `npm run typecheck` — 0 errors, 0 warnings, 2 hints (astro check clean; pre-existing unrelated deprecation warnings in `tests/e2e/homepage-wordmark-peek.spec.ts` not touched by this task)
- `npm run build` — succeeded, 27 pages built
- `npm run test:artifact` — passed, "Static artifact verified (27 HTML files, base /)"
- `npx playwright test tests/e2e/edition.spec.ts tests/e2e/site-header.spec.ts tests/e2e/accessibility.spec.ts` — **63 passed**, 0 failed
- `npx playwright test` (full suite) — **252 passed**, 0 failed

## Live-Browser Human-Check (performed by executor; Florian to independently redo)

Measured via Playwright driving `npm run preview` (built static artifact), using `Range.getBoundingClientRect()` on the "É" text node inside the h1 (French heading is "Éditions") compared against `.editions-list__eyebrow`'s `getBoundingClientRect()`, and `.editions-index__row .editions-index__number`'s top vs `.editions-list__header`'s bottom for the visual gap. Entrance animations were allowed to settle (1.2s wait) before measuring.

| Route | Width | Accent/eyebrow clearance | Header-to-number-label gap |
|---|---|---|---|
| `/editions/` (fr, heading "Éditions") | 800px | **+8px** (positive, no overlap) | 57px |
| `/editions/` (fr, heading "Éditions") | 1440px | **+3px** (positive, no overlap) | 57px |
| `/en/editions/` (en, heading "Editions" — no accented character) | 800px | +16px h1-top/eyebrow-bottom clearance (no "É" glyph exists in the English heading text, so no accent-specific measurement applies; verified no overlap via h1 top edge instead) | 57px |
| `/en/editions/` (en, heading "Editions" — no accented character) | 1440px | +16px h1-top/eyebrow-bottom clearance (same note) | 57px |

Notes:
- The plan's human-check instructions ask to measure the "É" character on both locales, but the English heading text is literally "Editions" (no accent) — there is no "É" glyph on `/en/editions/` to target with a `Range`. Substituted the h1's own top edge vs. the eyebrow's bottom edge for the English measurement, which stayed comfortably positive (no overlap) at both widths. The French page — the one that actually contains the reported "É" — showed positive clearance (+3px to +8px) at both widths, consistent with the plan's live-measured "+3.5px at 1440px" figure.
- The header-to-row gap: `.editions-list__header`'s own bottom to the first row's border-box top measures exactly 24px (confirms the `margin-bottom` change from 48px to 24px took effect precisely); adding the row's own unchanged `padding-top: var(--space-xl)` (32px) brings the total visible whitespace before the row number label to 57px — matching the plan's ~56px target (1px difference is sub-pixel font-metric rounding, not a regression).
- Sanity check: halftone, entrance sequence, two-column broken grid, and hover/preview-panel behavior all visually unchanged during the manual pass — only the h1 line-height and header margin differ from pre-change screenshots.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Both reported bugs are fixed and live-verified. No blockers. This closes out the sketch-012 F1 Éditions header follow-up correction chain (260728-lbh -> 260728-nj7).

---
*Phase: quick-260728-nj7*
*Completed: 2026-07-28*

## Self-Check: PASSED
- FOUND: src/components/EditionsOverviewBody.astro
- FOUND: 447eeae
