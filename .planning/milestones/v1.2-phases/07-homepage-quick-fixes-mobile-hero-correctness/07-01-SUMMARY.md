---
phase: 07-homepage-quick-fixes-mobile-hero-correctness
plan: 01
subsystem: ui
tags: [astro, css, accessibility, i18n, playwright]

requires:
  - phase: 04.2-social-media-links
    provides: "Instagram footer link semantics (href/target/rel/instagramNewTabHint) reused verbatim here"
  - phase: 06-homepage-view-mode-toggle-grid-hero-wordmark-cutout
    provides: ".home-toggle single unified button + .home-toggle__morph icon, whose box-model this plan fixes"
provides:
  - "Instagram icon link in the homepage header nav (.home-nav), after Contact"
  - ".home-toggle__box: a 28px square inner wrapper carrying the toggle's visible border/hover-invert/pulse, decoupled from the outer >=44px tappable .home-toggle button"
  - "Re-measured 393px mobile header pixel budget (5 items, single row) documented inline in HomeCarousel.astro"
affects: [10-homepage-header-shared-component-consolidation]

tech-stack:
  added: []
  patterns:
    - "Dependency-free inline <svg> icon (currentColor-based), matching the existing .home-toggle__morph 'no icon library' convention"
    - "Two-nested-box tap-target pattern: outer element = invisible >=44px hit box (min-width/min-height), inner element = smaller visible box carrying border/background — reusable anywhere a visually-compact control needs the WCAG 2.5.5 floor"

key-files:
  created: []
  modified:
    - src/components/HomeCarousel.astro
    - tests/e2e/homepage.spec.ts

key-decisions:
  - "Instagram link reuses BaseLayout.astro's footer link semantics verbatim (href/target/rel/instagramNewTabHint) via a locally-declared const, since HomeCarousel.astro doesn't import from BaseLayout"
  - "Toggle's visible square fixed at 28px (D-08's tight midpoint), not pushed to 32px — read clearly as square and clickable at live verification"
  - "Both HOME-04 and HOME-05 committed in a single feat commit (not split per-task) because their mobile pixel budgets are entangled: HOME-05's tap-target fix widened the toggle button to 44px, which changed how much room HOME-04's Instagram addition had left to fit in the 393px row"

patterns-established:
  - "Tap-target-vs-visible-size split via two nested elements (button = invisible hit box, inner span = visible square) — same shape as LanguageSwitcher.astro's padding-only approach, but for cases where the visible box must be smaller than 44px in both dimensions"

requirements-completed: [HOME-04, HOME-05]

coverage:
  - id: D1
    description: "Instagram icon link (not text) in the homepage header nav, opening https://www.instagram.com/ajs_romanelepont/ in a new tab with rel=noopener noreferrer, in both FR and EN"
    requirement: HOME-04
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#Instagram nav link (HOME-04) > exactly one Instagram link exists in the header with correct href/target/rel"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#Instagram nav link (HOME-04) > the link renders an inline svg icon (not visible text) with an accessible name of Instagram"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#Instagram nav link (HOME-04) > DOM order: the Instagram link comes after the Contact link inside .home-nav"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#Instagram nav link (HOME-04) > the sr-only new-tab hint is locale-conditional (FR vs EN)"
        status: pass
    human_judgment: false
  - id: D2
    description: "At a 393px mobile viewport, the header (logo, About, Contact, Instagram, toggle, FR|EN) fits without horizontal page overflow, on a single row"
    requirement: HOME-04
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#Instagram nav link (HOME-04) > at a 393px mobile viewport the Instagram link is visible with no horizontal page overflow"
        status: pass
    human_judgment: false
  - id: D3
    description: "The carousel/grid mode-toggle button's visible border traces a square (equal width/height) in both carousel and grid modes, while the button's own tappable area stays >=44px in both dimensions"
    requirement: HOME-05
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#square mode-toggle box (HOME-05) > carousel mode: .home-toggle__box is a square and .home-toggle clears the 44px tap-target floor"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#square mode-toggle box (HOME-05) > grid mode: .home-toggle__box remains a square"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#square mode-toggle box (HOME-05) > the visible border lives on .home-toggle__box and the single-toggle contract is unchanged"
        status: pass
    human_judgment: false
  - id: D4
    description: "Instagram icon reads as clickable/recognizable at header icon size, and the square toggle box reads as intentional (not cramped) — visual quality judgment"
    verification:
      - kind: manual_procedural
        ref: "Playwright screenshots at 1280x800 (carousel + grid mode) and 393x800 (mobile) reviewed during execution"
        status: pass
    human_judgment: true
    rationale: "Legibility/visual-polish of an icon glyph and box tightness are subjective visual judgments the plan explicitly deferred to live verification (D-01, D-08) — automated bounding-box checks prove geometry, not visual quality."

duration: 15min
completed: 2026-07-13
status: complete
---

# Phase 7 Plan 01: Instagram Nav Icon + Square Mode-Toggle Box Summary

**Added a dependency-free inline-SVG Instagram icon to the homepage header nav and restructured the mode-toggle button into a 28px visible square nested inside an invisible >=44px tap target, re-measuring the 393px mobile header row to keep all five items on one line.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-07-13T19:20:00Z (approx, first build)
- **Completed:** 2026-07-13T19:32:11Z
- **Tasks:** 2 completed
- **Files modified:** 2 (`src/components/HomeCarousel.astro`, `tests/e2e/homepage.spec.ts`)

## Accomplishments

- HOME-04: Instagram icon link added to `.home-nav`, after Contact, reusing the footer's exact `href`/`target="_blank"`/`rel="noopener noreferrer"`/`instagramNewTabHint` semantics from Phase 04.2 — no re-derivation of already-shipped behavior.
- HOME-05: `.home-toggle` restructured into an invisible `>=44px` tappable button wrapping a new `.home-toggle__box` visible 28px square, which now carries the relocated border, hover-invert background, and attention-pulse animation. Verified square (equal width/height) in both carousel and grid display modes.
- Mobile pixel budget re-measured live at 393px: the wider (44px) tap-target toggle plus the new Instagram nav item initially wrapped the header to 3 lines; trimmed `.home-nav`'s gap/padding and `.home-header`'s inter-item gap (8px to 4px) to restore the single-row layout, confirmed via Playwright bounding-box measurement and screenshots.

## Task Commits

Each task's RED tests were committed together (both tasks share one test-authoring pass), then both implementations were committed together due to a shared mobile pixel budget:

1. **Tasks 1 & 2 (RED):** `2591979` (test) — 8 new failing e2e assertions for the Instagram link and square toggle box.
2. **Tasks 1 & 2 (GREEN):** `61bf668` (feat) — Instagram nav link + `.home-toggle__box` restructure + mobile pixel-budget fix, all assertions passing.
3. **Deferred-items log:** `3b25d46` (docs) — logged 3 pre-existing, out-of-scope e2e failures found while running the full suite.

**Plan metadata:** commit pending (this SUMMARY + STATE/ROADMAP update).

_Note: both tasks were implemented in the same file edit pass because Task 2's tap-target fix directly changed the pixel math Task 1's mobile-fit re-measurement depended on — splitting the GREEN commit per-task would have left an intermediate state with a real horizontal-overflow regression._

## Files Created/Modified

- `src/components/HomeCarousel.astro` — added `instagramNewTabHint` const, the Instagram `<a class="home-nav-link">` (inline SVG glyph + sr-only hint), the `.home-toggle__box` wrapper span + CSS (28px square, border, hover-invert, pulse animation retarget), and the re-measured 393px mobile pixel-budget CSS/comments.
- `tests/e2e/homepage.spec.ts` — added `test.describe('Instagram nav link (HOME-04)')` (5 tests) and `test.describe('square mode-toggle box (HOME-05)')` (3 tests).

## Decisions Made

- Instagram glyph: hand-authored rounded-square-camera-outline SVG (rect + circle lens + circle shutter dot), `currentColor`-based, 20x20 viewBox — matches the "no icon library" convention already used by `.home-toggle__morph`. Exact path data was Claude's Discretion per the plan.
- Toggle visible square: kept at 28px (the D-08 tight midpoint) rather than stepping up to 32px — live screenshots at both 1280px and 393px showed it reads clearly as square and clickable without feeling cramped.
- No bordered box added around the Instagram icon (D-04) — verified live that the icon reads as clickable on its own among the plain-text About/Contact links, per the plan's "verify live, don't pre-emptively add a box" instruction.
- Header's own inter-item gap trimmed a second time (8px → 4px) beyond the plan's suggested nav-internal trims, since HOME-05's wider (44px) toggle button consumed more of the row budget than the plan's `.home-nav`-only trims alone could recover — documented inline in the mobile media query's pixel-budget comment.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Mobile header wrapped to 3 lines after combining both fixes**

- **Found during:** Task 2 (live re-measurement at 393px, after implementing both the Instagram link and the wider 44px toggle button together)
- **Issue:** The plan's Task 1 mobile-fit guidance (trim `.home-nav`'s own gap/padding) was calculated assuming the pre-existing ~30px toggle width. Once Task 2's `min-width: var(--tap-target-min)` grew the toggle to 44px, the combined row exceeded the 393px budget by ~4px, wrapping the header to 3 rows (verified via `getBoundingClientRect()` measurements and a live screenshot) instead of the intended single row.
- **Fix:** Trimmed `.home-header`'s own inter-item flex gap for mobile from `var(--space-sm)` (8px) to `var(--space-xs)` (4px), recovering 12px — comfortably restoring the single-row layout (385px used of 393px available). Updated the inline pixel-budget comment to document both the original 4-item measurement and this new 5-item re-measurement.
- **Files modified:** `src/components/HomeCarousel.astro`
- **Verification:** Playwright `getBoundingClientRect()` measurement confirmed `.home-header`'s height returned to 132px (single row, matching the pre-Instagram baseline) and `scrollWidth <= innerWidth` at 393px; confirmed via screenshot.
- **Committed in:** `61bf668` (part of the Task 1/2 combined commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug/layout-math correction)
**Impact on plan:** Necessary correction to keep D-03's "single-row fit is the intended outcome" contract; no scope creep — same mobile pixel-budget mechanism the plan itself specified, just recalculated for the actual combined-fix numbers rather than Task 1 in isolation.

## Issues Encountered

- The e2e test suite has 3 pre-existing, out-of-scope failures unrelated to this plan (confirmed via `git stash` against the pre-change `HomeCarousel.astro`): Astro Dev Toolbar injecting extra `<header>`/`<h1>` elements causing strict-mode locator violations (affects `about.spec.ts`, `i18n.spec.ts`, `legal.spec.ts`, and one `homepage.spec.ts` test), and homepage content-migration drift (gallery order/unmigrated-gallery assertions, since real Sanity content has changed since those tests were written). Logged in `.planning/phases/07-homepage-quick-fixes-mobile-hero-correctness/deferred-items.md`; not fixed here per the executor's scope-boundary rule (out-of-scope files/concerns, not caused by this plan's changes).

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- HOME-04 and HOME-05 are both complete and verified (8 new e2e assertions passing, all pre-existing homepage assertions for this scope unaffected, `npm run test:unit` and `npm run build` both green).
- Plan 07-02 (HOME-06, mobile hero regression) can proceed independently — it touches `.home-hero__photo`/`.home-hero__accent`/the view-transition wiring, none of which this plan modified.
- Phase 10's later header consolidation (shared component across homepage/About/Contact) now has the Instagram link and square-toggle-box groundwork already in place in `HomeCarousel.astro`, as intended by the phase's ordering rationale.

---
*Phase: 07-homepage-quick-fixes-mobile-hero-correctness*
*Completed: 2026-07-13*

## Self-Check: PASSED

All claimed files exist on disk and all claimed commit hashes (`2591979`, `61bf668`, `3b25d46`) are present in git history.
