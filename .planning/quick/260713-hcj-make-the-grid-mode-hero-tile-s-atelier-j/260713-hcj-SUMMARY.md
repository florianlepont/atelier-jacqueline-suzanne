---
phase: quick-260713-hcj
plan: 01
subsystem: ui
tags: [css, background-clip, homepage, responsive]

# Dependency graph
requires:
  - phase: 06-homepage-view-mode-toggle-grid-hero-wordmark-cutout
    provides: "--wordmark-photo custom property server-rendered on .home root and synced by render() on every carousel tick; carousel wordmark's background-clip:text cutout pattern to mirror"
provides:
  - "Mobile-only (<=767px) background-clip:text photo cutout on the grid hero tile's wordmark, reusing the existing --wordmark-photo custom property with no JS changes"
  - "Fluid clamp(36px, 9.8vw, 50px) font-size for the mobile grid hero wordmark, replacing the flat 16px"
  - "e2e regression test proving the cutout is mobile-only (mobile = transparent/cutout, desktop 1280px = solid non-transparent, D-05 preserved)"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Nested @supports inside @media for mobile-scoped progressive-enhancement CSS cutouts (compiles fine under Astro/evergreen browsers)"
    - "Live Playwright measurement (Range.getBoundingClientRect() per <br>-separated text run) used to validate a CSS clamp() candidate against real rendered widths before locking it in, rather than guessing a px value"

key-files:
  created: []
  modified:
    - src/components/HomeCarousel.astro
    - tests/e2e/homepage.spec.ts

key-decisions:
  - "Kept the carousel's proven clamp(36px, 9.8vw, 50px) as the final mobile grid-hero wordmark size rather than raising it further — live measurement showed 21-39px of margin (well over the required 8px floor) using the carousel's values; a trial bump to clamp(40px, 11vw, 56px) caused overflow (negative margin) at all four measured widths, so it was reverted. Using identical numbers to the carousel also gives visual weight consistency between the two view modes."
  - "Deliberately reversed Phase 6's locked D-05 decision (no cutout on grid hero tile) for mobile viewports only, per explicit live on-device user request; desktop grid hero tile is untouched (verified via e2e at 1280px)."

patterns-established: []

requirements-completed: [HOME-03]

coverage:
  - id: D1
    description: "Grid-mode hero tile wordmark shows the carousel's photo-cutout transparency effect (background-clip:text + --wordmark-photo) on mobile viewports (<=767px)"
    requirement: "HOME-03"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#grid hero wordmark cutout — mobile (HOME-03, D-05 reversal) > the grid hero wordmark cutout is mobile-only; desktop stays solid"
        status: pass
    human_judgment: false
  - id: D2
    description: "Mobile grid hero wordmark font-size is a fluid clamp, live-measured to fit the widest line (JACQUELINE) with >=8px margin at 360/375/393/428px"
    requirement: "HOME-03"
    verification:
      - kind: other
        ref: "One-off Playwright measurement script (run interactively, not committed) confirming margin >= 21.27px at 360px, 29.88px at 375px, 32.89px at 393px, 38.66px at 428px for clamp(36px, 9.8vw, 50px)"
        status: pass
    human_judgment: true
    rationale: "Live measurement proves no clipping/overflow, but whether the photo is legible through the letters and the visual weight 'feels right' on a real phone is a subjective call the plan itself flags as an optional non-blocking human check."
  - id: D3
    description: "Desktop (>=768px) grid hero tile is unchanged — solid --color-on-accent text, no cutout (D-05 preserved for desktop)"
    requirement: "HOME-03"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#grid hero wordmark cutout — mobile (HOME-03, D-05 reversal) > the grid hero wordmark cutout is mobile-only; desktop stays solid (1280px assertion)"
        status: pass
    human_judgment: false

duration: 8min
completed: 2026-07-13
status: complete
---

# Quick Task 260713-hcj: Grid-Mode Hero Wordmark Mobile Cutout Summary

**Mobile-only `background-clip:text` photo cutout + fluid `clamp(36px, 9.8vw, 50px)` sizing on the grid hero tile wordmark, reusing the existing `--wordmark-photo` custom property with zero JS changes.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-07-13T12:34:54+02:00 (base commit)
- **Completed:** 2026-07-13T12:42:38+02:00
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Grid-mode hero tile's wordmark on mobile (<=767px) now shows the same photo-through-the-letters transparency effect as the carousel wordmark, using the already-inherited `--wordmark-photo` custom property (no JS changes)
- Mobile wordmark font-size replaced flat 16px with a fluid `clamp(36px, 9.8vw, 50px)`, live-measured to never clip the widest line ("JACQUELINE") at 360/375/393/428px
- Desktop grid hero tile confirmed byte-for-byte unchanged (solid `--color-on-accent` text, no cutout) — D-05 preserved for desktop, reversed only for mobile per direct user request
- New e2e regression test locks in both the mobile cutout and the desktop non-cutout behavior in a single assertion

## Task Commits

Each task was committed atomically:

1. **Task 1: Add the mobile-only grid hero wordmark cutout + fluid size bump** - `c81189d` (feat)
2. **Task 2: Live-measure the fit, finalize the clamp, add a regression test, run the green gate** - `1b1b9e1` (test)

**Plan metadata:** _(this commit, created by the orchestrator after this summary)_

## Files Created/Modified
- `src/components/HomeCarousel.astro` - Added a nested `@supports (background-clip: text) or (-webkit-background-clip: text)` cutout rule for `.home-grid__wordmark` inside the existing `@media (max-width: 767px)` block, using `background-image: var(--wordmark-photo)` with `cover`/`center` (not the carousel's JS pixel-alignment, since the grid tile has no photo behind it to align to); replaced the flat `font-size: 16px` with `clamp(36px, 9.8vw, 50px)`
- `tests/e2e/homepage.spec.ts` - Added `grid hero wordmark cutout — mobile (HOME-03, D-05 reversal)` describe block: asserts `background-clip: text` + `url(...)` background-image at 393px, and non-transparent text-fill at 1280px

## Decisions Made
- Kept the carousel's exact clamp values (`36px, 9.8vw, 50px`) rather than growing them further, after live-measuring both the original candidate (comfortable 21-39px margin) and a larger trial `clamp(40px, 11vw, 56px)` (which overflowed — negative margin at every measured width). The original candidate already delivers a substantial visual bump over the previous flat 16px and matches the carousel's proven visual weight.
- Reversed Phase 6's locked D-05 decision, deliberately and mobile-only, per the plan's explicit instruction — this was pre-approved in the plan context, not a new deviation requiring a checkpoint.

## Deviations from Plan

None — plan executed exactly as written. One environment note: this worktree lacked the gitignored `.env` file needed for `npm run build` (Sanity project ID/dataset); it was copied in from the main repo checkout to run the green gate locally. This is local dev-environment setup only, not a code or config change, and nothing `.env`-related was committed.

## Issues Encountered
- A trial larger clamp (`clamp(40px, 11vw, 56px)`) was live-measured and found to overflow (clip) the tile at all four target widths (360/375/393/428px) — reverted to the plan's original `clamp(36px, 9.8vw, 50px)` candidate, which passes with comfortable margin everywhere. No scope impact; this was exactly the live-measurement gate the plan asked for.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- No blockers. This was a self-contained, mobile-only CSS change with a full green gate (build + 23 unit tests + 10 e2e tests, including the new regression test) passing.
- Optional non-blocking human check remains available: viewing the grid hero tile on a real phone to confirm the photo cutout reads as legible against the current gallery photo (flagged in the plan as optional/non-blocking, not required for completion).

---
*Phase: quick-260713-hcj*
*Completed: 2026-07-13*

## Self-Check: PASSED

- FOUND: src/components/HomeCarousel.astro
- FOUND: tests/e2e/homepage.spec.ts
- FOUND commit: c81189d
- FOUND commit: 1b1b9e1
