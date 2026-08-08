---
phase: 21-homepage-scroll-experience
fixed_at: 2026-08-08T06:38:50Z
review_path: .planning/phases/21-homepage-scroll-experience/21-REVIEW.md
iteration: 1
findings_in_scope: 3
fixed: 3
skipped: 0
status: all_fixed
---

# Phase 21: Code Review Fix Report

**Fixed at:** 2026-08-08T06:38:50Z
**Source review:** .planning/phases/21-homepage-scroll-experience/21-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 3
- Fixed: 3
- Skipped: 0

This report fixes findings from the second review pass on Phase 21 (see
21-REVIEW.md's own frontmatter/summary: that pass covers plans 21-07
through 21-10, scoped to the diff since `087df689`). It replaces the
content of this file previously recorded for the *first* review pass
(2026-08-05, CR-01/WR-01/WR-02/WR-03, commits `782b4f7`, `0243217`,
`c88cd55` — all still present in git history, just no longer summarized
below).

## Fixed Issues

### CR-01: Deck arrival guard silently disables accent-liveness and next-slide warm for galleries without an explicit `heroColor`

**Files modified:** `src/components/HomeCarousel.astro`, `tests/e2e/homepage-scroll-deck.spec.ts`
**Commits:** `9e089c4`, `dcc4b45`
**Applied fix:** Changed the rising-edge guard inside `applyArrival()` from
`reached && !wasRevealed && target.dataset.heroColor` to
`reached && !wasRevealed && target.dataset.index !== undefined`.
`data-index` is unique to real slide anchors (intro sections never set it),
so it correctly distinguishes "is a real slide" from "is a real slide with
a color" — unlike `data-hero-color`, which is legitimately absent on any
gallery using Sanity's "palette automatique" option. This restores the
pre-existing `|| 'var(--color-accent)'` fallback path for color-less
galleries and keeps `warmNextSlide()` firing on every real arrival
regardless of whether that gallery opted into a custom `heroColor`.
Updated the adjacent comment block to explain the new gate.

Added a new e2e case, `a slide with no heroColor still updates the live
accent and still warms the next slide (D-09, 21-UAT.md gap 3, CR-01)`, in
the existing "arrival reveal and accent liveness" describe block of
`tests/e2e/homepage-scroll-deck.spec.ts`. It strips `data-hero-color` from
a live slide client-side (deterministic regardless of the current Sanity
catalog's actual content), arrives at it, and asserts both that the live
accent falls back to the resolved `var(--color-accent)` value (not stuck at
the previous gallery's color) and that the next slide's sharp image is
promoted out of native-lazy. A follow-up commit (`dcc4b45`) hardened this
test with the same `page.route()` image-interception pattern the file's
pre-existing "next slide" warm test uses, after the first verification pass
showed Chromium's native-lazy heuristic could race and load the target
image before the assertion, making the warm check flaky/false-negative on a
fast local preview server.

Verified with the full project verification suite after this fix: `astro
check` (typecheck, 0 errors), `eslint .` (0 problems), `astro build` (29
pages built), `test:artifact` (static artifact verified), `vitest run
--coverage` (318/318 unit tests passed, 95.21% statement coverage), and
`playwright test` (435/435 e2e tests passed across both the `chromium` and
`webkit-mobile` projects, including the new CR-01 regression case).

### WR-01: `phoneThemeColor="#1A1A1A"` duplicates the `--color-ink` token as a magic literal

**Files modified:** `src/lib/site-config.ts`, `src/pages/index.astro`, `src/pages/en/index.astro`
**Commit:** `e87ba6c`
**Applied fix:** Added `export const COLOR_INK = '#1A1A1A'` to
`src/lib/site-config.ts` as the single plain-TS source of truth mirroring
the `--color-ink`/`--gray-900` CSS custom property defined once in
`BaseLayout.astro`. Both `src/pages/index.astro` and
`src/pages/en/index.astro` now import `COLOR_INK` and pass
`phoneThemeColor={COLOR_INK}` instead of the duplicated hex literal
`"#1A1A1A"`. Updated the inline comment in both files to reference the new
constant.

### WR-02: `computeProgress()` performs an unconditional DOM write every animation frame, contradicting its own adjacent change-detection comment

**File modified:** `src/components/HomeCarousel.astro`
**Commit:** `c857372`
**Applied fix:** Gave `applyIntroActive()` its own change-detection cache
(`introActive: boolean | null`), mirroring `applyProgress()`'s existing
`lastProgress` pattern: the function now early-returns when the computed
`active` state matches the cached value, so the `data-intro-active` DOM
attribute is only written on an actual transition rather than on every
painted frame. Reset `introActive = null` in `clearInlineStyles()` alongside
the existing `lastProgress` reset, for the same re-attach-must-always-paint
reason, so a later re-attach still always paints the correct state on its
first frame.

## Full Verification Run (post-fix, all 4 commits applied)

- `npm run typecheck` (astro check): 0 errors, 0 warnings, 1 pre-existing
  hint in an unrelated test file (`homepage-wordmark-peek.spec.ts:1031`,
  deprecated `webkitBackgroundClip` API usage, not introduced by this fix).
- `npx eslint .`: clean, no output.
- `npm run build` (astro build): 29 pages built successfully.
- `npm run test:artifact`: "Static artifact verified (29 HTML files, base /)".
- `npm run test:coverage` (vitest, full unit suite): 318 tests passed
  across 16 files; 95.21% statement coverage.
- `npx playwright test` (full suite, both configured projects — `chromium`
  and `webkit-mobile`, the latter scoped to `*.smoke.spec.ts` by config):
  435 passed, 0 failed (including the new CR-01 regression case).

## Skipped Issues

None — all in-scope findings were fixed.

---

_Fixed: 2026-08-08T06:38:50Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
