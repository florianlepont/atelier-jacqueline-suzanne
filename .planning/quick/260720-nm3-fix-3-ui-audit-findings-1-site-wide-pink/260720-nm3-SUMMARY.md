---
phase: quick-260720-nm3
plan: 01
subsystem: ui
tags: [accessibility, wcag, css-tokens, astro, playwright]

requires: []
provides:
  - Site-wide link/hover/focus-ring text color meets WCAG AA (>= 4.5:1) against white
  - Homepage exposes exactly one accessible level-1 heading (the AJS wordmark)
affects: [ui-audit-findings, homepage]

tech-stack:
  added: []
  patterns:
    - "Single CSS custom-property (--pink-600) as the sole source of truth for link/accent color, consumed via var() chain — one-value fixes propagate everywhere."

key-files:
  created: []
  modified:
    - src/layouts/BaseLayout.astro
    - src/components/HomeCarousel.astro
    - tests/e2e/homepage.spec.ts

key-decisions:
  - "Darkened --pink-600 from #FF3B94 to #D6327C (~4.56:1 contrast vs white) rather than introducing a separate --color-link token, since the existing var() chain already isolates link/hover/focus-ring from decorative uses."
  - "Left the decorative HERO_COLORS.pink (#FF3B94) in site-config.ts untouched — it's a large background fill with its own contrast-computed overlay text color, not link/normal text subject to the 4.5:1 rule."

patterns-established: []

requirements-completed:
  - QUICK-260720-nm3

coverage:
  - id: D1
    description: "Site-wide link/hover/focus-ring color meets WCAG AA (>= 4.5:1) against white via a single --pink-600 token change"
    verification:
      - kind: other
        ref: "node relative-luminance computation of #D6327C vs #FFFFFF -> 4.559:1"
        status: pass
    human_judgment: false
  - id: D2
    description: "Homepage exposes exactly one accessible level-1 heading (the AJS wordmark), unchanged visual appearance"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#homepage semantic heading (quick-260720-nm3) > the homepage exposes exactly one accessible level-1 heading containing \"Atelier\""
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts full suite (40/40 passing, including pre-existing class-based wordmark-cutout/toggle/mobile-hero tests)"
        status: pass
    human_judgment: false

duration: 15min
completed: 2026-07-20
status: complete
---

# Quick Task 260720-nm3: Fix UI-audit WCAG AA findings (link contrast + homepage h1) Summary

**Darkened the site-wide `--pink-600` link/accent token to #D6327C (4.56:1 contrast vs white) and promoted both homepage wordmark elements from `<p>` to `<h1>`, locked in with a new Playwright regression test.**

## Performance

- **Duration:** ~15 min
- **Tasks:** 2/2 completed
- **Files modified:** 3

## Accomplishments
- Every site-wide link/hover/focus-ring color now meets WCAG AA (>= 4.5:1) against the white page background, via a single `--pink-600` custom-property change that propagates through the existing `var()` chain (`--color-accent` -> `--color-link` / `--color-link-hover` / `--color-focus-ring`).
- The homepage now exposes exactly one accessible `<h1>` (the "Atelier Jacqueline Suzanne" wordmark) where previously it had zero heading elements — both the carousel and grid wordmarks were promoted from `<p>` to `<h1>` (tag-only change; the `[hidden]` grid container keeps only one in the accessibility tree at a time).
- Added a Playwright e2e test locking in the homepage's single top-level-heading contract.

## Task Commits

Each task was committed atomically:

1. **Task 1: Darken the site-wide link/accent pink token to clear WCAG AA** - `4df861c` (fix)
2. **Task 2: Promote both homepage wordmarks to semantic h1 and lock it with an e2e test** - `313bf99` (fix)

_Plan metadata commit (SUMMARY.md/STATE.md/ROADMAP.md docs) is applied separately by the orchestrator._

## Files Created/Modified
- `src/layouts/BaseLayout.astro` - `--pink-600` changed from `#FF3B94` to `#D6327C`
- `src/components/HomeCarousel.astro` - `.home-hero__wordmark` and `.home-grid__wordmark` changed from `<p>` to `<h1>` (classes/content unchanged)
- `tests/e2e/homepage.spec.ts` - new `homepage semantic heading (quick-260720-nm3)` test asserting exactly one visible, accessible level-1 heading containing "Atelier"

## Decisions Made
- Used the pre-verified darker on-brand shade `#D6327C` (~4.56:1 against white) rather than computing a new value, per the plan's exact instruction.
- Left `HERO_COLORS.pink` (`#FF3B94`) in `src/lib/site-config.ts` untouched — confirmed via grep it's the only other `#FF3B94` occurrence and is out of scope (decorative hero-panel background fill, not link/normal text).

## Deviations from Plan

None - plan executed exactly as written.

One environment note (not a plan deviation): a local `.env` (Sanity project ID/dataset, gitignored, not committed) had to be present in this worktree to run `astro build` before Playwright's webServer could serve the site for e2e verification. It was copied from the parent checkout for local verification purposes only; it is untracked and excluded by `.gitignore`, so nothing was committed.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Both UI-audit findings (link contrast, homepage semantic heading) are resolved and regression-tested.
- Full `tests/e2e/homepage.spec.ts` suite passes (40/40), including the new heading test and all pre-existing class-based tests (unaffected by the tag swap).

---
*Phase: quick-260720-nm3*
*Completed: 2026-07-20*

## Self-Check: PASSED

- FOUND: src/layouts/BaseLayout.astro
- FOUND: src/components/HomeCarousel.astro
- FOUND: tests/e2e/homepage.spec.ts
- FOUND commit: 4df861c
- FOUND commit: 313bf99
