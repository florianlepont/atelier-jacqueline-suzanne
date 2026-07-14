---
phase: 09-progressive-homepage-image-loading
plan: 01
subsystem: ui
tags: [astro, sanity-image-url, playwright, vanilla-js, blur-up, image-loading]

# Dependency graph
requires:
  - phase: 04.1-design-system-homepage-refresh
    provides: HomeCarousel.astro hero/grid markup, render() client controller, image.ts URL builders
  - phase: 08-gallery-descriptions
    provides: gallery.statement data flow through the same GalleryEntry/data-island pattern this plan extends
provides:
  - "blurPlaceholderUrl() build-time Sanity CDN URL helper"
  - "blurSrc threaded build-time -> client for hero and grid images"
  - "Two-layer opacity crossfade (blur placeholder -> sharp) on hero and grid tiles"
  - "fetchpriority=high on the hero image, no loading=lazy"
  - "Next-gallery hero photo prefetch on every render() tick"
affects: [09-progressive-homepage-image-loading (plan 02, human-verify checkpoint)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Two-layer opacity-crossfade blur-up (blurred placeholder <img> beneath a sharp <img> that fades in via an .is-loaded class), not a single-<img> filter:blur() animation"
    - "img.complete / load-listener defensive check (existing syncWordmarkAlignment pattern) reused for both hero and grid blur-up fade-ins"
    - "One-time querySelectorAll setup for server-rendered-once elements (grid tiles) kept outside the periodic render() function"

key-files:
  created: []
  modified:
    - tests/e2e/homepage.spec.ts
    - src/lib/image.ts
    - src/pages/index.astro
    - src/pages/en/index.astro
    - src/components/HomeCarousel.astro

key-decisions:
  - "Reused the exact img.complete/load-listener shape already established by syncWordmarkAlignment() for both the hero and grid blur-up fade-ins, rather than introducing a new loading-state primitive"
  - "Grid tile load listener is a one-time setup outside render() (grid tiles are server-rendered once, never re-rendered), while the hero's placeholder/is-loaded logic lives inside render() since the hero swaps on every auto-advance/prev/next/toggle tick"
  - "Prefetch uses a bare new Image() at the end of render(), not <link rel=\"prefetch\">, to avoid <head> DOM management from client JS"

patterns-established:
  - "Blur-up placeholder pattern: <img src={blurPlaceholderUrl(cover)} alt=\"\" aria-hidden=\"true\"> sibling before the sharp <img>, opacity:0 -> opacity:1 on .is-loaded, 260ms ease"

requirements-completed: [HOME-09]

coverage:
  - id: D1
    description: "Homepage chrome (header/nav/mode-toggle) renders immediately with no blocking full-screen loader"
    requirement: "HOME-09"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#progressive image loading (HOME-09) > shell renders immediately without waiting on images"
        status: pass
    human_judgment: false
  - id: D2
    description: "Hero <img> carries fetchpriority=\"high\" and no loading=\"lazy\""
    requirement: "HOME-09"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#progressive image loading (HOME-09) > hero image is requested with high priority"
        status: pass
    human_judgment: false
  - id: D3
    description: "Hero photo transitions blurred-to-sharp on first paint and on every swap (~260ms opacity crossfade)"
    requirement: "HOME-09"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#progressive image loading (HOME-09) > hero blur-up: placeholder present and sharp fades in on first paint and after a swap"
        status: pass
    human_judgment: true
    rationale: "The automated test proves the placeholder exists and the sharp layer reaches is-loaded/opacity:1 on first paint and after a mocked-clock swap, but whether the blur radius/placeholder legibility reads well visually (per 09-VALIDATION.md's Manual-Only Verifications) requires a human to look at it."
  - id: D4
    description: "Grid tiles show the same blur-to-sharp treatment as they lazy-load into view, retaining loading=\"lazy\""
    requirement: "HOME-09"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#progressive image loading (HOME-09) > grid tile blur-up: tiles carry a placeholder layer and gain is-loaded"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#progressive image loading (HOME-09) > grid tiles stay lazy after this phase"
        status: pass
    human_judgment: false
  - id: D5
    description: "Next gallery's hero photo is prefetched via new Image() at the end of every render() tick, warming the cache before the next swap"
    requirement: "HOME-09"
    verification: []
    human_judgment: true
    rationale: "No automated test asserts the prefetch network request directly (no network-inspection assertion was added); implemented per plan/PATTERNS.md and exercised indirectly by the hero blur-up-after-swap test, but the prefetch behavior itself needs human/manual confirmation (e.g. devtools network tab) or a follow-up automated check."
  - id: D6
    description: "Full e2e suite remains green (no regression to HOME-01..HOME-08, i18n, or view-transition tests)"
    verification:
      - kind: e2e
        ref: "npx playwright test --project=chromium (75 tests)"
        status: pass
      - kind: unit
        ref: "npm run test:unit (40 tests)"
        status: pass
    human_judgment: false

duration: 15min
completed: 2026-07-14
status: complete
---

# Phase 9 Plan 1: Hero and Grid Blur-Up Crossfade Summary

**Two-layer opacity blur-up crossfade (blurred Sanity CDN placeholder → sharp) on the homepage hero and grid tiles, with `fetchpriority="high"` on the hero and next-gallery prefetch, driven by a new `blurPlaceholderUrl()` helper threaded build-time → client.**

## Performance

- **Duration:** ~15 min
- **Completed:** 2026-07-14T12:32:58Z
- **Tasks:** 3 (RED test task + 2 TDD vertical slices)
- **Files modified:** 5

## Accomplishments

- Added a failing `progressive image loading (HOME-09)` e2e block (5 tests) before any implementation, confirmed RED except the pre-existing shell-renders behavior
- Hero photo now loads with `fetchpriority="high"` (no `loading="lazy"`) and blurs-to-sharp via a two-layer opacity crossfade on first paint and on every auto-advance/prev/next/toggle/progress-dash swap
- Grid tiles get the identical blur-to-sharp crossfade as they lazy-load into view, while keeping `loading="lazy" decoding="async"` unchanged
- Next gallery's hero photo is prefetched via a bare `new Image()` at the end of every `render()` tick, so the crossfade is typically near-instant by the time the next swap fires
- Full e2e suite (75 tests) and unit suite (40 tests) green — no regressions to HOME-01..HOME-08, i18n, legal, SEO, or view-transition coverage

## Task Commits

Each task was committed atomically:

1. **Task 1: Add failing `progressive image loading (HOME-09)` e2e block (Wave 0 RED)** - `cccf8d1` (test)
2. **Task 2: Hero slice — blur helper, blurSrc threading, priority, crossfade, prefetch** - `5515873` (feat)
3. **Task 3: Grid slice — grid-tile blur-up while keeping lazy** - `6bca67b` (feat)

_Task 3's commit also includes a regression fix to a pre-existing D-12 test (see Deviations below)._

## Files Created/Modified

- `tests/e2e/homepage.spec.ts` - New `progressive image loading (HOME-09)` describe block (5 tests); scoped a pre-existing D-12 test's `img` locator to `.home-grid__tile-img--sharp` to fix a strict-mode violation introduced by the new placeholder `<img>`
- `src/lib/image.ts` - New `blurPlaceholderUrl(img, width = 24)` build-time-only helper (`.width(24).blur(50).auto('format').url()`)
- `src/pages/index.astro` / `src/pages/en/index.astro` - Compute `blurSrc: blurPlaceholderUrl(cover)` alongside the existing `heroSrc`/`gridSrc`
- `src/components/HomeCarousel.astro` - `blurSrc` added to both `GalleryEntry` interfaces and the `data-blur-src` data-island attribute; hero placeholder `<img data-role="hero-image-placeholder">` + `fetchpriority="high"`/`.home-hero__img--sharp` on the real hero image; `showSharp()` helper, `render()` extension (placeholder src update, `.is-loaded` reset before `src` reassignment, prefetch); grid tile placeholder `<img>` + `.home-grid__tile-img--sharp`; one-time grid-tile load-listener setup; new CSS for both crossfades (260ms opacity transition)

## Decisions Made

- Reused the existing `img.complete`/`load`-listener defensive shape (already used by `syncWordmarkAlignment()`) for both the hero and grid blur-up fade-ins instead of inventing a new async-loading primitive
- Kept the grid-tile load listener as a one-time setup outside `render()` since grid tiles are server-rendered once and never re-rendered, while the hero's placeholder/fade logic lives inside `render()` since it runs on every swap
- Used a bare `new Image()` for the D-05 prefetch rather than `<link rel="prefetch">`, avoiding `<head>` DOM management from client JS

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed a pre-existing D-12 test's strict-mode violation caused by the new grid-tile placeholder `<img>`**
- **Found during:** Task 3 (Grid slice), full-suite verification
- **Issue:** `tests/e2e/homepage.spec.ts`'s pre-existing "every rendered gallery tile has a real image and a destination" test used `tile.locator('img')` (unscoped) to assert the tile's photo has a `cdn.sanity.io` src. Adding the new blur placeholder `<img>` sibling made this locator resolve to 2 elements, triggering a Playwright strict-mode violation.
- **Fix:** Scoped the locator to `.home-grid__tile-img--sharp`, preserving the original assertion's intent (the real, displayed photo carries a Sanity CDN src) without weakening it.
- **Files modified:** tests/e2e/homepage.spec.ts
- **Verification:** Full `npx playwright test --project=chromium` suite green (75/75) after the fix.
- **Committed in:** `6bca67b` (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 bug/regression)
**Impact on plan:** Directly caused by this plan's own markup change (a second `<img>` per grid tile); no scope creep, no weakening of the original test's assertion.

## Issues Encountered

- The environment's playwright.config.ts webServer (`npm run preview`, port 4321) was reused by a pre-existing, unrelated `http-server dist -p 4321` process running against the main checkout's stale `dist/` build (not this worktree's), which made early verification runs silently test against old code. Worked around by building this worktree (`npm run build`, after copying the gitignored `.env` from the main checkout) and running verification against a temporary local Playwright config on port 4399 pointed at this worktree's own build; the temporary config was not committed and was deleted before finishing. The plan's own specified verify commands (`npx playwright test tests/e2e/homepage.spec.ts --project=chromium [-g ...]`) were run in full as specified once the correct build was being served.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- HOME-09's automated contract (hero priority/blur-up, grid blur-up/lazy, no blocking shell loader) is fully green; ready for Plan 09-02, the human-verify checkpoint covering the two Manual-Only Verifications from 09-VALIDATION.md (placeholder legibility on real gallery photos, and the View Transition toggle-mid-fade cosmetic edge case)
- No blockers. The stale `http-server` process on port 4321 in the main checkout is unrelated to this plan's code and outside this worktree's scope — flagged here only as an environment note, not a code follow-up.

---
*Phase: 09-progressive-homepage-image-loading*
*Completed: 2026-07-14*

## Self-Check: PASSED

All modified files confirmed present on disk (`tests/e2e/homepage.spec.ts`, `src/lib/image.ts`, `src/pages/index.astro`, `src/pages/en/index.astro`, `src/components/HomeCarousel.astro`, this SUMMARY.md). All task commits (`cccf8d1`, `5515873`, `6bca67b`) plus this docs commit confirmed present in `git log --oneline --all`.
