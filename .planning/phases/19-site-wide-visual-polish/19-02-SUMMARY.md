---
phase: 19-site-wide-visual-polish
plan: 02
subsystem: ui
tags: [astro, css, playwright, halftone, overflow]

requires:
  - phase: 19-site-wide-visual-polish
    provides: "Plan 01: EDN-09 row-hover color sync and CONT-03 Contact row spacing, no file overlap with this plan"
provides:
  - "UI-01 fixed — the halftone dot-texture on Contact/About/Éditions bleeds to the true browser viewport edge again (geometry-based containment via calc(50% - 50vw)), replacing the component-level overflow-x: clip that hard-cut it at the content column's edge"
  - "A new, permanent e2e regression net (tests/e2e/page-title-header-bleed.spec.ts) covering 7-page x 5-width horizontal-overflow, positive sticky-pin behavior on About + DetailHero, and halftone full-bleed geometry — written and proven against the pre-change tree before the risky CSS was touched"
  - "A latent, pre-existing single-word-heading overflow bug ('Contact', 'Éditions') at 320px, previously masked by the removed clip, found and fixed in the same task"
affects: []

tech-stack:
  added: []
  patterns:
    - "calc(50% - 50vw) on an absolutely-positioned descendant of a position:relative ancestor is the geometry-based full-bleed technique: it sizes/centers the box to exactly one viewport width without ever producing horizontal overflow, replacing overflow-x: clip/hidden containment"
    - "CSS Grid's default min-width:auto on a grid item will force the track (and the whole grid container) to overflow rather than let content shrink below its min-content size — explicit min-width:0 on the item is required whenever the item's content might be an unbreakable string at a narrow viewport"

key-files:
  created:
    - tests/e2e/page-title-header-bleed.spec.ts
  modified:
    - src/components/PageTitleHeader.astro

key-decisions:
  - "Kept .page-title-header's position: relative and isolation: isolate — required as the halftone's containing block and its z-index:-1 stacking context, respectively; only the overflow-x: clip declaration was removed"
  - "Re-anchored the halftone's mask focal point from a fixed 'right 700px' to a formula depending on --editorial-page-max/--editorial-page-padding-inline, per the plan's arithmetically pre-verified derivation (checked at 1280px and 1920px), so the dot cloud keeps emanating from the header's own top-right corner rather than sliding toward the window's middle"
  - "The right-inset scrollbar guard term described in the plan's planning_measurements was NOT applied — no horizontal scrollbar was observed in any available test environment (headless Chromium, macOS, overlay scrollbars); this residual could not be exercised on a space-taking-scrollbar platform (Windows/Linux Chrome, or macOS 'Show scroll bars: Always') during automated execution, so it remains open for the human doing the end-of-phase verification"
  - "shared-site-header.png was NOT regenerated — it passed unchanged against the pre-existing baseline in the full Playwright run, so no visual-baseline reconciliation was needed"

patterns-established:
  - "Full-bleed-past-a-static-flow-ancestor CSS technique now has a real in-repo precedent (PageTitleHeader.astro's halftone) for any future component that needs the same effect"

requirements-completed: [UI-01]

coverage:
  - id: D1
    description: "On Contact, About and Éditions at >=760px, the halftone's own box spans the full client width (rect left at 0, rect right at document.documentElement.clientWidth), the mask focal point keeps it emanating from the header's top-right corner, and the vertical -700px bleed is untouched"
    requirement: "UI-01"
    verification:
      - kind: e2e
        ref: "tests/e2e/page-title-header-bleed.spec.ts#page title header full-bleed geometry (UI-01 bleed) > {path} at {viewport}: halftone box spans the full client width and stays above the header top (6 tests: 3 pages x 2 viewports)"
        status: pass
    human_judgment: false
  - id: D2
    description: "No page in the suite (homepage, About, Contact, Éditions overview, Éditions detail, gallery detail, 404) has horizontal overflow at 320/375/768/1280/1920, and html/body never carry overflow-x on the three PageTitleHeader consumer pages"
    requirement: "UI-01"
    verification:
      - kind: e2e
        ref: "tests/e2e/page-title-header-bleed.spec.ts#site-wide horizontal overflow guard (UI-01 D-05) (8 tests: 7 pages + html/body guard)"
        status: pass
    human_judgment: false
  - id: D3
    description: "About's .about-page__exhibition-pin and DetailHero's .detail-hero__pin (gallery and édition detail) still compute position:sticky AND still hold at the viewport top while scrolling, after the containment change"
    requirement: "UI-01"
    verification:
      - kind: e2e
        ref: "tests/e2e/page-title-header-bleed.spec.ts#sticky pin regression guard (UI-01 D-05) (3 tests)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Below 760px the halftone stays display:none, unchanged, on all three consumer pages"
    requirement: "UI-01"
    verification:
      - kind: e2e
        ref: "tests/e2e/page-title-header-bleed.spec.ts#page title header full-bleed geometry (UI-01 bleed) > at 375x812 the halftone stays display:none on /contact/, /about/ and /editions/"
        status: pass
    human_judgment: false
  - id: D5
    description: "The dot texture visually reaches the true browser window edge with no hard vertical cut line, still reads as emanating from the header's top-right corner (not slid to the window's middle), and no horizontal scrollbar appears on Contact/About/Éditions at ~1280/1440/1920"
    requirement: "UI-01"
    verification: []
    human_judgment: true
    rationale: "Visual/aesthetic judgment (does the bleed look right, does the dot cloud read as intentional) and the scrollbar-inclusive-viewport-units residual (only observable on a platform that draws space-taking scrollbars) both require a human to look at the rendered page — this project's verification mode is end-of-phase, so no blocking checkpoint task ran here. Screenshot evidence at 1280/1440/1920 for Contact/About/Éditions, plus one Éditions row-hover screenshot, was captured during Task 3 for that end-of-phase check."

duration: 15min
completed: 2026-08-03
status: complete
---

# Phase 19 Plan 02: Halftone Bleed Restoration Summary

**Replaced PageTitleHeader's `overflow-x: clip` with viewport-relative geometry (`calc(50% - 50vw)`) so the halftone dot-texture bleeds to the true browser edge on Contact/About/Éditions again, proven safe by a 18-test regression net written before the change and a pre-existing single-word-heading overflow bug found and fixed along the way.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-08-03T13:45:00+02:00 (approx.)
- **Completed:** 2026-08-03T14:00:00+02:00 (approx.)
- **Tasks:** 3/3 completed
- **Files modified:** 2 (1 created, 1 modified) + 1 process doc (`deferred-items.md`)

## Accomplishments
- UI-01: `.page-title-header__halftone`'s `left`/`right` changed from a fixed `-700px` to `calc(50% - 50vw)`, sizing its box to exactly one viewport width instead of the (now-unclipped) header box — geometrically impossible to overflow, replacing clip-based containment entirely.
- The halftone's mask focal point was re-anchored from a fixed `right 700px` to a formula (`50vw - min(100vw, var(--editorial-page-max)) / 2 + var(--editorial-page-padding-inline)`) so the dot cloud keeps visually emanating from the header's own top-right corner instead of sliding toward the window's middle once the box's right edge became the viewport's right edge.
- `overflow-x: clip` was removed from `.page-title-header` entirely; `position: relative` and `isolation: isolate` were kept (containing block + stacking-context requirements).
- Wrote `tests/e2e/page-title-header-bleed.spec.ts` (18 tests, 3 describe blocks) BEFORE touching the CSS, per D-05: Block A (site-wide overflow guard, 7 pages x 5 widths + html/body overflow-x assertion) and Block B (positive sticky-pin assertions for About and DetailHero) proved green against the unmodified tree; Block C (halftone full-bleed geometry) proved it failed 6/7 times against the unmodified tree, confirming the net was a real baseline before the fix landed.
- Found and fixed a latent bug (Rule 1) that removing the clip exposed: Contact's and Éditions' single-word, unbreakable headings ("Contact", "Éditions") overflowed the 320px viewport by ~26px, because CSS Grid's default `min-width: auto` on the titleblock grid item plus the h1's `inline-block` shrink-to-fit sizing meant they couldn't shrink below their own min-content width. Fixed with `min-width: 0` on `.page-title-header__titleblock` and `overflow-wrap: break-word` + `max-width: 100%` on `.page-title-header h1`.
- Ran the full local CI gate in CI order (typecheck, lint, test:unit, build, test:artifact, full Playwright suite): all green except one pre-existing, unrelated unit-test suite failure already tracked from Plan 01. `npx playwright test` passed 289/289 across both `chromium` and `webkit-mobile` projects.
- The visual baseline (`shared-site-header.png`, `contact-form.png`) passed unchanged — no regeneration was needed.
- Captured human-verification screenshot evidence (Contact/About/Éditions at 1280/1440/1920, plus one Éditions row-hover state) for the end-of-phase check.

## Task Commits

Each task was committed atomically:

1. **Task 1: Write the D-05 regression net FIRST — overflow matrix, sticky guards, bleed geometry (UI-01, D-04, D-05)** - `965b139` (test)
2. **Task 2: Replace clip-containment with geometry-containment in PageTitleHeader.astro (UI-01, D-03, D-04)** - `39be532` (fix)
3. **Task 3: Run the full gate, reconcile the visual baseline, and gather human-verification evidence (UI-01, D-03, D-05)** - `6e7802c` (docs)

**Plan metadata:** (this commit, docs: complete plan)

_Note: Task 3 produced no code diff (no baseline regeneration was needed) — its commit records the CI gate run and deferred-items.md's confirmation of the pre-existing unrelated unit-test failure._

## Files Created/Modified
- `tests/e2e/page-title-header-bleed.spec.ts` - New regression spec: site-wide horizontal overflow guard (7 pages x 5 widths + html/body overflow-x), sticky pin regression guard (positive rect.top assertions for About + DetailHero on gallery and édition detail), page title header full-bleed geometry (halftone box spans client width, mobile display:none preserved). 18 tests, `chromium` project only.
- `src/components/PageTitleHeader.astro` - Removed `overflow-x: clip`; changed the halftone's `left`/`right` to `calc(50% - 50vw)` and its mask focal-point offset to the viewport-relative formula; added `min-width: 0` to `.page-title-header__titleblock` and `overflow-wrap: break-word` + `max-width: 100%` to `.page-title-header h1` (Rule 1 fix); rewrote the component-history comment and the `.page-title-header` rule's own comment to record the new containment model and the scrollbar-inclusive-viewport-units residual.
- `.planning/phases/19-site-wide-visual-polish/deferred-items.md` - Re-confirmed the same pre-existing, unrelated `dashboard-logic.test.ts` failure logged in Plan 01, unchanged.

## Decisions Made
- Kept `.page-title-header`'s `position: relative` + `isolation: isolate` — required as the halftone's containing block (for `calc(50% - 50vw)` to resolve against the viewport, not some further ancestor) and to keep the halftone's `z-index: -1` layer contained to this component's own stacking context.
- Re-anchored the mask focal point using the plan's pre-derived, arithmetically-checked formula rather than re-deriving it live — verified live that the checked values (98px at 1280px, 418px at 1920px) matched the header's actual measured right edge.
- The right-inset scrollbar guard term (`right: calc(50% - 50vw + 8px)`) was NOT applied. No horizontal scrollbar was observed in any environment available during automated execution (headless Chromium on macOS uses overlay scrollbars, which cannot exhibit the space-taking-scrollbar residual by construction). This is an honest gap, not a decision that the guard is unnecessary — see "Known residual" below.
- `shared-site-header.png` was left untouched — the full Playwright run showed it passing against the existing baseline, so no visual-baseline reconciliation was required (the halftone dots that now reach further right did not fall inside the `.site-header`-cropped screenshot region in a way that changed the pixel diff beyond the existing 0.03 tolerance).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed a pre-existing single-word-heading horizontal overflow at 320px, unmasked by removing `overflow-x: clip`**
- **Found during:** Task 2, first `npx playwright test tests/e2e/page-title-header-bleed.spec.ts --project=chromium` run after the CSS edit
- **Issue:** Contact's heading ("Contact") and Éditions' heading ("Éditions"/"Editions") are single, unbreakable words. `.page-title-header__titleblock` is a CSS Grid item with the browser default `min-width: auto`, and `.page-title-header h1` is `display: inline-block` (shrink-to-fit sizing). Together, these meant the grid track (and hence `.page-title-header` itself) was forced to grow to the h1's min-content width — wider than the 320px viewport's ~288px content column at the 64px font-size floor — rather than letting the heading wrap. This was always latent; it was silently masked by the `overflow-x: clip` this task removes, so the two site-wide overflow tests in Block A (Task 1) that passed against the pre-change tree started failing (346px/341px scrollWidth vs 320px clientWidth) the moment the clip came off.
- **Fix:** Added `min-width: 0` to `.page-title-header__titleblock` (lets the CSS Grid track shrink below its content's intrinsic size, overriding the `min-width: auto` default) and `overflow-wrap: break-word` + `max-width: 100%` to `.page-title-header h1` (a safety net so an unbreakable single word can wrap mid-word only if it would otherwise overflow; multi-word titles like About's "À propos" continue to wrap on their natural word boundary and are unaffected).
- **Files modified:** `src/components/PageTitleHeader.astro`
- **Verification:** A scratch debug script (not committed) confirmed zero overflowing elements on `/contact/` and `/editions/` at 320px after the fix; the full `tests/e2e/page-title-header-bleed.spec.ts` suite (18 tests) passes, including both previously-failing overflow tests.
- **Committed in:** `39be532` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** The fix is scoped entirely to `.page-title-header__titleblock` and `.page-title-header h1` — the two selectors the plan's own acceptance criteria already targeted for the containment change — and does not touch `html`/`body` or introduce any new overflow containment mechanism, so it does not conflict with D-04's guard. No scope creep: the bug was a direct, mechanical consequence of the exact edit the plan specified (removing the clip), not an unrelated discovery.

## Issues Encountered
- This worktree had no `.env` file (worktrees don't inherit the gitignored `.env` from the main checkout, same as Plan 01). Copied the main repo's `.env` into the worktree (not committed — confirmed still gitignored via `git check-ignore -v .env`) so the local build/e2e verification loop could run.
- `npm run test:unit` has one pre-existing, unrelated failing suite (`tests/unit/dashboard-logic.test.ts`, missing `@sanity/icons/BulbOutline` export in `sanity/editorial/dashboardLogic.ts`) — already tracked in `deferred-items.md` from Plan 01; re-confirmed unchanged and unrelated to this plan's CSS-only changes to `PageTitleHeader.astro`. All 175 individual tests across the other 15 unit suites pass.
- **Known residual, cannot be closed by this executor:** viewport units are scrollbar-inclusive. On a platform that draws space-taking scrollbars (Windows/Linux Chrome, or macOS with "Show scroll bars: Always"), the halftone's right edge can land up to ~half a scrollbar width (7-8px) past the client edge and produce a small horizontal scrollbar. Headless Chromium on macOS (the only environment available during automated execution) uses overlay scrollbars and measured zero horizontal overflow everywhere, so this residual could not be exercised. It is documented in the component's own comment and remains open for whoever performs the end-of-phase human verification — if a scrollbar is seen there, the guard term `right: calc(50% - 50vw + 8px)` documented in the component comment is the fix.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- UI-01 is closed. All three v1.5 requirements this phase covers (EDN-09, UI-01, CONT-03) are now implemented; EDN-09/CONT-03 shipped in Plan 01.
- Human-verification screenshot evidence (Contact/About/Éditions at 1280/1440/1920, plus one Éditions row-hover state) was captured during Task 3 and is available for the end-of-phase human-check step — it lives outside the repo (scratchpad), so whoever runs the end-of-phase verification should re-capture live rather than rely on this executor's evidence, and should specifically check for the space-taking-scrollbar residual on a non-macOS or non-overlay-scrollbar setup, which this executor could not test.
- No blockers for closing out Phase 19 / the v1.5 milestone.

## Self-Check: PASSED

- FOUND: `tests/e2e/page-title-header-bleed.spec.ts`
- FOUND: `src/components/PageTitleHeader.astro`
- FOUND: `.planning/phases/19-site-wide-visual-polish/deferred-items.md`
- FOUND: `.planning/phases/19-site-wide-visual-polish/19-02-SUMMARY.md`
- FOUND commit `965b139` (Task 1) in `git log --oneline`
- FOUND commit `39be532` (Task 2) in `git log --oneline`
- FOUND commit `6e7802c` (Task 3) in `git log --oneline`

---
*Phase: 19-site-wide-visual-polish*
*Completed: 2026-08-03*
