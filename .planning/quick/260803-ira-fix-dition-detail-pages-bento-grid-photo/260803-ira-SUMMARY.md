---
phase: quick-260803-ira
plan: 01
subsystem: ui
tags: [astro, css, playwright, gallery-grid, editions]

requires:
  - phase: quick-260803-bvu
    provides: DetailHero.astro's uncropped hero photo treatment (object-fit contain), which this plan's bento-grid fix now matches for the secondary photos below it
provides:
  - GalleryGrid.astro's shared .tile img base rule now fits photos whole (object-fit contain) instead of cropping them, closing the half of quick-260803-bvu's Item 7 that only fixed the hero photo
  - Automated regression coverage proving bento (éditions) photos are uncropped with layout/positioning intact, the masonry (galleries) path is provably untouched, and the hover/focus zoom still works on both tile sizes
affects: [phase-18, editions, gallery-detail]

tech-stack:
  added: []
  patterns:
    - "Shared base CSS rule (.tile img) governs bento (éditions, no layout prop) while a more-specific override (.gallery-grid--masonry .tile img) governs masonry (galleries) — editing the base rule is a computed-value no-op for masonry since its own override always wins."

key-files:
  created: []
  modified:
    - src/components/GalleryGrid.astro
    - tests/e2e/edition.spec.ts
    - tests/e2e/gallery.spec.ts

key-decisions:
  - "Changed the shared .tile img base rule's object-fit (cover -> contain) rather than adding a new layout-scoping prop or modifier class — the existing layout prop (bento/masonry) already provides full scoping since bento is reached exclusively by éditions and masonry exclusively by galleries (confirmed via grep, exactly 2 call sites)."
  - "Rewrote (never deleted/skipped) tests/e2e/gallery.spec.ts's superseded PORT-05 bento sub-test and its describe-block header comment to assert the new uncropped contract, per the plan's explicit anticipated-required-edit."

requirements-completed: [260803-ira]

coverage:
  - id: D1
    description: "Every secondary photo in the édition detail bento grid displays whole/uncropped, in both fr and en, with the asymmetric bento composition, gaps, and cell sizes unchanged"
    requirement: "260803-ira"
    verification:
      - kind: e2e
        ref: "tests/e2e/edition.spec.ts#editions bento grid photos uncropped (quick-260803-ira) > every édition bento tile photo is uncropped, with the bento structure and absolute-positioned imgs intact"
        status: pass
      - kind: e2e
        ref: "tests/e2e/gallery.spec.ts#gallery + édition thumbnail tiles render with no frame (PORT-05, D-04/D-05) > édition detail (bento): every tile has 0px borders and shows the photo whole, uncropped (quick-260803-ira)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Gallery detail pages (masonry) are provably unaffected by the bento fix"
    verification:
      - kind: e2e
        ref: "tests/e2e/edition.spec.ts#editions bento grid photos uncropped (quick-260803-ira) > the gallery masonry path is untouched: static position, natural-ratio tiles"
        status: pass
      - kind: e2e
        ref: "tests/e2e/gallery.spec.ts#gallery + édition thumbnail tiles render with no frame (PORT-05, D-04/D-05) > gallery detail (masonry): every tile has 0px borders, keeps the ink loading background, and never letterboxes"
        status: pass
    human_judgment: false
  - id: D3
    description: "The hover/focus zoom still plays on both the large (.tile--hero) and small (.tile--small) bento tiles against the now-uncropped photo"
    requirement: "260803-ira"
    verification:
      - kind: e2e
        ref: "tests/e2e/edition.spec.ts#editions bento grid photos uncropped (quick-260803-ira) > the hover/focus zoom still applies on both a bento hero tile and a bento small tile"
        status: pass
    human_judgment: false
  - id: D4
    description: "The édition hero photo itself (DetailHero.astro) is untouched and still shows the whole photo as shipped in quick-260803-bvu"
    verification:
      - kind: e2e
        ref: "tests/e2e/edition.spec.ts#editions hero uncropped photo (Item 7, quick-260803-bvu) > an édition hero photo reports object-fit: contain, unlike a gallery hero which still crops"
        status: pass
    human_judgment: false
  - id: D5
    description: "Mobile presentation (<800px, 3:4 portrait bento cells) reads as deliberate rather than broken for real landscape photos, without changing bento geometry"
    verification:
      - kind: manual_procedural
        ref: "Screenshots at 1280x900 and 390x844 against a live astro dev server for all 3 published éditions (rebut, silos, entasse); reviewed by the executing agent"
        status: pass
    human_judgment: true
    rationale: "Whether letterboxing 'reads as deliberate' vs. 'broken' is a subjective visual call the plan explicitly requires either a pass judgment or a stop-and-report; recorded here as reviewed-and-passed, but the site owner has not yet seen it live."

duration: ~20min
completed: 2026-08-03
status: complete
---

# Quick Task 260803-ira: Uncrop Édition Bento Grid Photos Summary

**GalleryGrid.astro's shared `.tile img` base rule switched from `object-fit: cover` to `object-fit: contain`, so bento-mode (éditions-only) secondary photos now display whole — closing the half of quick-260803-bvu's Item 7 that only fixed the hero photo — while the masonry (galleries) path is unaffected because its own override rule already redeclares the same fit.**

## Performance

- **Duration:** ~20 min (including worktree dependency provisioning: `npm ci` root + sanity, `.env` copy, Playwright browser install)
- **Completed:** 2026-08-03
- **Tasks:** 1
- **Files modified:** 3

## Accomplishments

- Secondary photos in the bento grid below an édition's hero now show whole and uncropped, in both fr and en, matching the treatment already given to the hero photo (quick-260803-bvu) and to gallery detail pages' masonry grid.
- Bento composition (asymmetric 1-large + 2-small grouping, alternating sides, gaps, cell sizes) is byte-identical — only the `object-fit` declaration changed, nothing about grid geometry.
- Gallery detail pages (masonry mode) are provably unaffected — a dedicated assertion confirms `position: static` and natural-aspect-ratio tiles, and PORT-05's exhaustive masonry sub-test (borders, ink background, no baseline gap) passes byte-unchanged.
- The hover/focus zoom (`scale(1.03)`) still plays on both the large hero tile and a small tile, now against the uncropped photo, proven via a polling transform assertion (not a fixed sleep).
- Visually reviewed at 1280x900 and 390x844 against a live `astro dev` server for all three published éditions (rebut, silos, entasse) — the letterboxing reads as a deliberate "framed on the wall" presentation at every viewport, consistent with the already-approved hero treatment; no mobile geometry concern was found, so no STOP was needed.

## Task Commits

Task 1 was committed as a single atomic commit (code + its RED/GREEN test coverage together, per this plan's TDD instruction and scope boundaries):

1. **Task 1: Show édition bento grid photos whole, preserving layout, gallery masonry, and hover zoom** - `9564ca5` (fix)

No separate plan-metadata commit was made in this worktree — `SUMMARY.md`, `STATE.md`, and `PLAN.md` are the orchestrator's responsibility per this task's constraints.

## Files Created/Modified

- `src/components/GalleryGrid.astro` - Shared `.tile img` base rule's `object-fit` changed from `cover` to `contain`, with a new explanatory comment recording that bento is éditions-only, the fit now matches DetailHero.astro's hero treatment, and the masonry override further down makes this a computed-value no-op for galleries. No other declaration in that rule, no bento geometry rule, and no `.gallery-grid--masonry` rule was touched.
- `tests/e2e/edition.spec.ts` - New `'editions bento grid photos uncropped (quick-260803-ira)'` describe block with 3 tests: bento uncropped + structure/positioning intact (with a `test.skip` guard for the hero/small size comparison when the first group has fewer than 2 tiles, mirroring `homepage-loading-progress.spec.ts:78`'s convention), the masonry path untouched, and the hover/focus zoom on both tile sizes (via a shared `pollHoverZoomScale` helper using `expect.poll`, never a fixed sleep).
- `tests/e2e/gallery.spec.ts` - PORT-05's bento sub-test title and its `object-fit` assertion rewritten from `cover` to `contain`/"uncropped"; the describe-block header comment above it rewritten to state the new shared contract (bento and masonry now compute the same fit, for different underlying reasons). The 0px-border assertions in that sub-test, and the entire masonry sub-test above it, are unchanged.

## Decisions Made

- Confirmed the plan's `<diagnosis>` held exactly as written before touching any code: `grep -rn "<GalleryGrid" src/` returns exactly the two call sites described (`EditionDetailBody.astro:96` with no `layout` prop → bento default; `GalleryDetailBody.astro:63` with `layout="masonry"`), and reading `GalleryGrid.astro` confirmed the masonry override (`.gallery-grid--masonry .tile img`) already redeclares `object-fit: contain`, `position: static`, `height: auto`. This made the base-rule edit the correct, lowest-machinery fix — no new prop or scoping selector was needed.
- Followed the plan's TDD gate explicitly: wrote the 3 new/rewritten assertions first, confirmed they failed against the unmodified `object-fit: cover` (RED — captured in the execution transcript, not as a separate commit per the plan's single-atomic-commit instruction), then applied the one-line CSS change and confirmed all 60 targeted tests passed (GREEN) before running the full gate.
- Used a shared `pollHoverZoomScale` helper in `edition.spec.ts` (predicate-based `expect.poll` returning non-null only once the matrix's horizontal scale is strictly between 1.02 and 1.04) rather than two sequential `.poll()` calls per tile, to avoid double-waiting on the 0.3s CSS transition while still satisfying the plan's "single predicate, no fixed sleep" instruction.

## Deviations from Plan

None - plan executed exactly as written. The diagnosis, scope boundaries, and test/behavior specifications all matched what was found in the codebase; no Rule 1-4 auto-fixes were needed.

## Issues Encountered

None. Playwright's `webServer` (`npm run preview`) was rebuilt fresh before each targeted test run (confirmed no stale server lingering on port 4321 via `lsof`), avoiding the stale-`dist/` pitfall quick-260803-bvu flagged. Screenshots were taken against a separate live `astro dev --port 4322` daemon per the plan's explicit instruction, then the daemon was stopped via `astro dev stop` after review.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 18 (Gallery & Éditions Display Fixes) requirement 260803-ira is complete; the full CI-equivalent gate is green (typecheck, lint, build, test:artifact, test:e2e chromium+webkit-mobile, test:unit), with `git diff --stat` confirming exactly the 3 expected files changed.
- No blockers. The mobile letterboxing risk the plan flagged as open was reviewed via real screenshots across all 3 published éditions and reads as deliberate, not broken — no follow-up needed unless the site owner disagrees after seeing it live.

---
*Phase: quick-260803-ira*
*Completed: 2026-08-03*

## Self-Check: PASSED

- FOUND: src/components/GalleryGrid.astro
- FOUND: tests/e2e/edition.spec.ts
- FOUND: tests/e2e/gallery.spec.ts
- FOUND: commit 9564ca5
