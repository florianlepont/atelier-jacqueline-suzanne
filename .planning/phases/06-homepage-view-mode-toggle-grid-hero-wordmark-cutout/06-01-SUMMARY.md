---
phase: 06-homepage-view-mode-toggle-grid-hero-wordmark-cutout
plan: 01
subsystem: ui
tags: [astro, css, playwright, background-clip-text, touch-events, svh, i18n]

# Dependency graph
requires:
  - phase: 04.3-homepage-refinements
    provides: icon-based single-purpose toggle scaffolding, mobile hero visibility fix, three-line wordmark baseline that this phase superseded/extended
provides:
  - Single unified carousel/grid toggle button (morphing icon, flipping aria-label)
  - Grid view hero rendered as the first non-link tile of the grid (no separate band)
  - Carousel wordmark transparent photo-cutout (background-clip:text + live-computed pixel alignment)
  - Mobile full-bleed (100svh) hero photo with the accent panel overlaid on top, not following it in-flow
  - Dashed, clickable progress indicator (replaces prev/next arrow buttons) with keyboard arrow-key and touch-swipe navigation
affects: [homepage, mobile-hero-layout, homepage-navigation, wordmark-cutout-effect]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "photo/accent split: .home-hero__photo (image+scrim+caption, sized independently) as a sibling of .home-hero__accent, so the panel's own height never stretches/distorts the photo behind it"
    - "100svh (not 100vh) for any mobile full-bleed section — accounts for mobile browser chrome so page content doesn't peek in before the user scrolls"
    - "live-remeasured fluid clamp() sizing: font-size clamps are re-verified against actual rendered text width vs. actual container width via Playwright Range.getBoundingClientRect(), not estimated, every time either side of that ratio changes"

key-files:
  created: []
  modified:
    - src/components/HomeCarousel.astro
    - src/layouts/BaseLayout.astro
    - tests/e2e/homepage.spec.ts

key-decisions:
  - "Single toggle button with flipping icon/aria-label replaces the two-button model (HOME-01/D-01-03)"
  - "Grid hero is a non-link <div>, first tile of .home-grid__tiles, solid accent background, no cutout (HOME-02/D-04-06)"
  - "Carousel wordmark uses background-clip:text with a live-computed background-position/size that pixel-aligns to the exact photo slice behind the panel — a true cutout, not an independently-cropped approximation (HOME-03/D-07-09)"
  - "'Discover other galleries' CTA removed entirely; the single toggle is the only mode-switch control (D-10)"
  - "Mobile hero restructured mid-phase (beyond original plan scope) into two independently-sized boxes — .home-hero__photo and .home-hero__accent — after live user feedback surfaced overlap bugs caused by the panel's in-flow height affecting the absolutely-positioned photo/caption/arrows sharing its box"
  - "Mobile hero is a true full-bleed 100svh photo (not a short band) per direct request; accent panel overlays its bottom (position:absolute, full-width) rather than following it in normal flow, so both are visible without scrolling"
  - "Prev/next arrow buttons replaced with a compact (~20-30% viewport width) clickable dashed progress indicator nested in the caption, bottom-left — plus keyboard ArrowLeft/ArrowRight and touch-swipe navigation, per direct request to move beyond click-only arrow controls"
  - "Mobile-only wordmark alignment bypass (added when the panel briefly sat below the photo, out of overlap) was removed once the panel went back to overlaying the photo — mobile now uses the same live pixel-alignment computation as desktop"

patterns-established:
  - "For any element absolutely positioned against a container whose height can vary (e.g. from sibling in-flow content), give it its own sized wrapper rather than relying on hardcoded pixel offsets tied to a specific measured state — hardcoded offsets broke repeatedly across this phase's mobile iteration until the structural fix (splitting .home-hero into .home-hero__photo + .home-hero__accent) removed the need for them entirely"
  - "When a CSS ratio must hold across a range of viewport widths (font-size vs. container width, in this case), verify with live-rendered measurements (Range.getBoundingClientRect() against the actual text and actual container) at multiple widths after every change to that ratio, not just at the widths spot-checked during the original tuning"

requirements-completed: [HOME-01, HOME-02, HOME-03]

# Metrics
duration: ~21h elapsed across two sessions (2026-07-12 15:26 CEST -> 2026-07-13 12:23 CEST); active work concentrated in two bursts (initial plan execution ~15:26-23:07 on 07-12, mobile/navigation follow-on ~10:50-12:23 on 07-13) with a long overnight gap between them
completed: 2026-07-13
---

# Phase 6: Homepage View-Mode Toggle, Grid Hero & Wordmark Cutout Summary

**Single unified carousel/grid toggle, grid-view hero folded into the first grid tile, a live pixel-aligned wordmark photo-cutout, and (beyond the original plan) a full-bleed mobile hero with dashed swipe/keyboard navigation replacing the old arrow buttons.**

## Performance

- **Started:** 2026-07-12T15:26:39+02:00 (first RED test commit, `ad27437`)
- **Completed:** 2026-07-13T12:23:15+02:00 (final follow-on commit, `44cc10d`)
- **Commits:** 6 (`ad27437`, `b196b15`, `c3ef67c`, `e3d4005`, `dbebd6f`, `44cc10d`)
- **Files modified:** 3 (`src/components/HomeCarousel.astro`, `src/layouts/BaseLayout.astro`, `tests/e2e/homepage.spec.ts`)

## Accomplishments

- HOME-01/02/03 delivered per the original plan: single toggle button, grid hero-as-first-tile, and a working (initially approximate, later pixel-perfect) wordmark cutout — plus D-10's CTA removal.
- A substantial live-iteration follow-on (not captured in the original plan, driven entirely by direct user feedback rounds after the Task 3 checkpoint) reworked the mobile experience specifically: the hero photo is now a true full-bleed `100svh` section with the accent panel overlaid on top, arrows are gone in favor of a small clickable dashed progress indicator, and navigation gained keyboard arrow-key and touch-swipe support.
- Two real structural bugs were root-caused and fixed during the follow-on: (1) the mobile accent panel's in-flow height was stretching the absolutely-positioned photo/caption/arrows sharing its box — fixed by splitting them into independently-sized `.home-hero__photo` / `.home-hero__accent` boxes; (2) `100vh` doesn't account for mobile browser chrome, letting the site footer peek in before scrolling — fixed with `100svh`.
- Wordmark legibility/size was iterated three times against direct "bigger" feedback, each time re-verified via live-rendered text-width measurement against the real panel width across the full mobile viewport range (360-767px), not just the widths originally spot-checked.

## Task Commits

1. **Task 1: RED — failing e2e contracts for single toggle, grid hero-tile, wordmark cutout** - `ad27437` (test)
2. **Task 2: GREEN — single toggle, grid hero-tile, wordmark cutout, CTA removal** - `b196b15` (feat)
3. **Fix: contrast text-shadow for cutout legibility** (Task 3 checkpoint feedback) - `c3ef67c` (fix)
4. **Fix: wordmark line-height overlap + grid hero-tile flex override** (Task 3 checkpoint feedback) - `e3d4005` (fix)
5. **Task 3 checkpoint resolution: papercut wordmark, morphing toggle, tighter grid** (font swap to Unbounded, morphing 6-cell toggle icon, 3-column grid, 16:9 hero, discoverability underline, margin-collapse + `[hidden]` regression fixes) - `dbebd6f` (feat)
6. **Post-checkpoint follow-on: mobile full-bleed hero, dashed progress nav, bigger wordmark** (not a planned task — direct live-iteration feedback after the phase's formal checkpoint had already been approved) - `44cc10d` (feat)

_Commit 6 was not part of the original plan's three tasks — see "Deviations from Plan" below._

## Files Created/Modified

- `src/components/HomeCarousel.astro` — homepage carousel/grid component: single toggle, grid hero-tile, wordmark cutout (desktop + mobile), mobile hero restructuring, progress-dash navigation, keyboard/swipe handlers.
- `src/layouts/BaseLayout.astro` — removed the redundant "Accueil"/"Home" site-wide nav link (logo already links home); minor header nav cleanup.
- `tests/e2e/homepage.spec.ts` — new contracts for the single toggle (count=1, flipping aria-label), the grid hero-tile (non-link `<div>`, first child), and the wordmark cutout (computed `background-clip`/`background-image`); revised the mobile regression test to drop its dependency on the removed CTA.

## Decisions Made

See `key-decisions` in frontmatter above — the two structural fixes (photo/accent split, `100svh`) and the navigation-model change (dashes + keyboard + swipe replacing arrow buttons) were the most consequential, since they came from direct user feedback discovered only after the phase's formal Task 3 checkpoint had already been approved, not from the original CONTEXT.md/UI-SPEC decisions.

## Deviations from Plan

### Scope extension beyond the three planned tasks

- **What happened:** After Task 3's live-verification checkpoint was approved (confirming the original HOME-01/02/03 scope worked), the user continued iterating live — outside the formal plan/task structure — through roughly a dozen further feedback rounds covering: photo zoom/crop behavior, mobile arrow/wordmark overlap, removing the redundant Home nav link, a full mobile hero redesign (full-bleed `100svh`, panel-overlay layout), replacing the arrow buttons with a dashed progress indicator plus keyboard/swipe navigation, and three rounds of wordmark/panel sizing adjustments.
- **Why:** The mobile experience surfaced real usability issues (arrows overlapping text, the site footer peeking in on load, a navigation control the user wanted replaced) that weren't part of the original CONTEXT.md decisions — this was genuine new scope discovered through use, not a correction of a Task 3 defect.
- **How it was handled:** Every change was still verified with the same rigor as planned-task work — Playwright screenshot/measurement verification before reporting back, full 23-unit + 50-e2e suite green after each round — just without a corresponding PLAN.md task entry. This SUMMARY.md is the mechanism reconciling that live work back into GSD's tracked history, per explicit user request ("intégrer les derniers changements dans le process gsd").
- **Impact on plan:** No regression to the original HOME-01/02/03 requirements — all three remain intact and covered by the Task 1 e2e contracts, which still pass. The scope extension only touched mobile-specific layout/navigation, not the desktop experience or the core toggle/grid-tile/cutout mechanics.

---

**Total deviations:** 1 (scope extension, not an auto-fix)
**Impact on plan:** No requirement regressed; the extension is additive mobile polish discovered through direct use, now reconciled into tracked history.

## Issues Encountered

- **Mobile accent panel stretching the photo/caption behind it:** root-caused to the panel being an in-flow sibling whose height varies, while the photo/caption/arrows were absolutely positioned against the *same* growing box. Fixed structurally (see `patterns-established`), not by further pixel-offset tuning.
- **Site footer peeking in on mobile arrival:** root-caused to `100vh` resolving to the *large* (chrome-hidden) viewport on real mobile Safari, taller than what's actually visible with the address bar showing. Fixed with `100svh`.
- **Wordmark cutout showing a garbled/tiled texture on mobile:** caused by an interim mobile-only alignment bypass computing an out-of-range `background-position` with no `background-repeat:no-repeat` set. Fixed by removing the now-unnecessary bypass (the panel overlays the photo again) and adding `background-repeat:no-repeat` defensively.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 6 (v1.1 milestone) is now fully delivered and tracked. Per PROJECT.md, v1.1 was scoped to land *before* Phase 5 (Launch & Domain Cutover) despite the higher phase number.
- Phase 5 (Launch & Domain Cutover) is the only remaining phase in the v1/v1.1 roadmap and has not yet been started — no blockers identified.

---
*Phase: 06-homepage-view-mode-toggle-grid-hero-wordmark-cutout*
*Completed: 2026-07-13*
