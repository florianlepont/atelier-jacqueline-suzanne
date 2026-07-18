---
phase: quick-260718-r2o
plan: 01
subsystem: ui
tags: [astro, css-custom-properties, homepage, accent-color, wcag-contrast]

requires:
  - phase: quick-260713 / phase 08
    provides: "src/lib/site-config.ts (HERO_COLORS, normalizeHeroColor, getHeroTextColor) and the heroColor/heroTextColor prop trail into HomeCarousel"
provides:
  - "Grid-mode hero tile text color now tracks the per-gallery accent's paired contrast color via a --current-accent-text CSS custom property"
affects: [homepage, HomeCarousel]

tech-stack:
  added: []
  patterns:
    - "Paired background/text CSS custom properties (--current-accent / --current-accent-text) kept in sync at both SSR (inline style on .home) and client-side render() ticks, mirroring the existing --current-accent mechanism"

key-files:
  created: []
  modified:
    - src/components/HomeCarousel.astro
    - tests/unit/site-config.test.ts
    - tests/e2e/homepage.spec.ts

key-decisions:
  - "Did not create a third palette module (src/lib/hero-colors.ts) as a naive reading of the original task might suggest — site-config.ts's HERO_COLORS is already the correct frontend palette, and HomeCarousel already receives resolved hex/text values, not slugs. Reusing the existing heroTextColor trail was correct; a new keyed-by-slug module would have silently broken the already-working carousel lookup."
  - "Only the grid hero tile's CSS `color` declaration was hardcoded and buggy; the carousel accent panel, ACCENTS fallback, and SSR/client resolution pipeline were already correct and left untouched."

requirements-completed: [260718-r2o]

coverage:
  - id: D1
    description: "Grid-mode hero tile text is legible (white) on dark accent presets (Violet #AF3DFF, Plum #37013A) and ink on light presets, matching the carousel"
    requirement: "260718-r2o"
    verification:
      - kind: unit
        ref: "tests/unit/site-config.test.ts#resolves the correct paired text color for all five presets (260718-r2o)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#grid hero tile text color tracks accent (260718-r2o) > grid hero tile color reads the --current-accent-text variable, not a hardcoded ink value"
        status: pass
    human_judgment: false
  - id: D2
    description: "--current-accent (background) and --current-accent-text (text) stay a paired, legible set at SSR and across every carousel tick before a grid toggle"
    requirement: "260718-r2o"
    verification:
      - kind: e2e
        ref: "npm run test:e2e (full homepage.spec.ts suite, 90/90 passing, no regressions to existing carousel/grid/accent-panel tests)"
        status: pass
    human_judgment: false

duration: 20min
completed: 2026-07-18
status: complete
---

# Quick Task 260718-r2o: Grid Hero Tile Accent-Text Wiring Summary

**Fixed the one remaining bug in the per-gallery accent-color pipeline: the grid-mode hero tile's CSS hardcoded dark ink text instead of consuming the already-computed per-gallery contrast color, making dark accent presets (Violet, Plum) illegible in grid mode.**

## Performance

- **Duration:** ~20 min
- **Tasks:** 2/2 completed
- **Files modified:** 3

## Accomplishments
- Added a `--current-accent-text` CSS custom property to `.home`, set at SSR from `firstGallery.heroTextColor` and kept in sync in `render()` alongside the existing `--current-accent` background variable
- Grid hero tile's `color` declaration now reads `var(--current-accent-text, var(--color-on-accent))` instead of a hardcoded `var(--color-on-accent)`, fixing illegible white-on-dark scenarios for Violet/Plum accent presets
- Added unit coverage asserting all five hero presets (Violet, Plum, Rose, Turquoise, Citron vert) resolve to the correct paired text color
- Added an e2e regression test proving the grid hero tile's computed color follows `--current-accent-text` via a sentinel value

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire the grid-mode hero tile text color to a --current-accent-text companion variable** - `b6fb10c` (fix)
2. **Task 2: Add regression coverage for dark-preset legibility and grid-tile wiring** - `2729c74` (test)

**Plan metadata:** committed separately by the orchestrator after this SUMMARY is written.

## Files Created/Modified
- `src/components/HomeCarousel.astro` - Added `--current-accent-text` to the SSR inline style and to `render()`'s per-tick sync; grid hero tile CSS now consumes it with a safe fallback
- `tests/unit/site-config.test.ts` - Extended the `homepage hero colors` describe block with a five-preset paired-color assertion
- `tests/e2e/homepage.spec.ts` - New `grid hero tile text color tracks accent (260718-r2o)` describe block

## Decisions Made
- Followed the plan's "Diagnosis reconciliation" section precisely: did not create a redundant `src/lib/hero-colors.ts` module and did not touch the already-correct carousel accent-panel wiring, ACCENTS fallback, or Sanity schemas — the actual defect was isolated to a single CSS `color` declaration on the grid hero tile.

## Deviations from Plan

None - plan executed exactly as written. Both tasks matched their `<action>` and `<verify>` blocks with no unexpected blockers.

## Issues Encountered

None. The worktree was missing `.env` (gitignored, expected); it was copied in locally from the main checkout only to run `npm run build`/tests, not committed.

## Next Phase Readiness

The per-gallery accent-color pipeline (carousel accent panel + grid hero tile) is now fully consistent across both display modes and covered by unit + e2e regression tests. No follow-on work identified.

---
*Phase: quick-260718-r2o*
*Completed: 2026-07-18*

## Self-Check: PASSED

- FOUND: .planning/quick/260718-r2o-fix-the-homepage-per-gallery-accent-colo/260718-r2o-SUMMARY.md
- FOUND: src/components/HomeCarousel.astro
- FOUND: tests/unit/site-config.test.ts
- FOUND: tests/e2e/homepage.spec.ts
- FOUND: commit b6fb10c (Task 1)
- FOUND: commit 2729c74 (Task 2)
