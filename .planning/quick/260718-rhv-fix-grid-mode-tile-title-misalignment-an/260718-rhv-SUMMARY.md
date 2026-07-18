---
phase: quick-260718-rhv
plan: 01
subsystem: ui
tags: [astro, css, playwright, homepage, grid-tiles]

# Dependency graph
requires:
  - phase: quick-260718-r2o
    provides: "--current-accent/--current-accent-text CSS variable pattern for the grid hero tile, mirrored here for non-hero tiles"
provides:
  - "Grid-tile titles align to a consistent per-tile offset regardless of statement presence/length or title length"
  - "Per-gallery --tile-accent CSS custom property on every non-hero grid tile"
  - "Hover/focus scrim color tint + title lift polish on grid tiles"
affects: [homepage, HomeCarousel.astro]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Bottom-anchored copy blocks reserve fixed height for ALL variable-length children (not just the one diagnosed as buggy) to keep sibling content's position stable"
    - "Per-tile CSS custom property (--tile-accent) distinct from a shared/cycling one (--current-accent) when each grid item needs its own independent value"

key-files:
  created: []
  modified:
    - src/components/HomeCarousel.astro
    - tests/e2e/homepage.spec.ts

key-decisions:
  - "Reserved a fixed 3-line min-height on .home-grid__tile-description and always render it (never conditionally), per the locked CONTEXT.md decision"
  - "Also clamped .home-grid__tile-title to a single line with ellipsis (Rule 1 deviation) — long titles wrapping to 2 lines caused the same misalignment via the same bottom-anchored-block mechanism, discovered while writing this task's own alignment test"
  - "New --tile-accent custom property (not a reuse of --current-accent) so each non-hero tile always tints toward its own gallery's resolved accent, independent of whichever gallery the carousel currently cycles to"
  - "Scrim tint implemented as a ::after pseudo-element layered over the existing dark gradient scrim, not a replacement — dark gradient stays the legibility floor for white caption text"
  - "Human-verified via Playwright screenshots + a locally-started dev server in the isolated worktree, since no shared dev server was reachable from this environment"

patterns-established:
  - "When fixing a bottom-anchored/variable-height layout bug, audit ALL variable-length children in the block, not just the one named in the root-cause diagnosis"

requirements-completed: [260718-rhv]

coverage:
  - id: D1
    description: "Every grid-tile title aligns to within 1px of the same per-tile bottom offset, regardless of statement presence/length or title length"
    requirement: "260718-rhv"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#grid-tile title alignment (260718-rhv) > every gallery tile title sits at the same offset from its own tile bottom edge"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#grid-tile title alignment (260718-rhv) > clearing a tile statement does not change its title offset (empty-statement defensive)"
        status: pass
      - kind: manual_procedural
        ref: "playwright:screenshot 1-grid-default.png, 5-mobile-393-grid.png (reviewed by human via locally-started dev server on port 4324)"
        status: pass
    human_judgment: true
    rationale: "Alignment is automatable and covered above, but the checkpoint also asked the human to confirm no visual artifact/flicker across real content, which is inherently a visual judgment call"
  - id: D2
    description: "Each non-hero grid tile exposes its own --tile-accent from its gallery's resolved hex; hover/focus tints the scrim toward it while keeping white caption text legible over the dark scrim floor"
    requirement: "260718-rhv"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#grid-tile hover polish (260718-rhv) > each non-hero tile carries its own --tile-accent custom property"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#grid-tile hover polish (260718-rhv) > hovering a tile raises its scrim tint pseudo-element opacity"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#grid-tile hover polish (260718-rhv) > keyboard focus applies the same tint and lift as hover"
        status: pass
    human_judgment: true
    rationale: "Automated tests prove the tint mechanism activates and --tile-accent resolves per-tile, but whether the tint 'reads as intentional/on-brand, not garish' and stays legible on light presets (Lime, Teal) is a subjective aesthetic call — human approved via live dev-server review, confirming Paysage/lime and Silos/teal stayed legible"
  - id: D3
    description: "Title lifts a few px on hover/focus in sync with the description's 180ms reveal"
    requirement: "260718-rhv"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#grid-tile hover polish (260718-rhv) > hovering a tile lifts its title (non-identity transform)"
        status: pass
    human_judgment: false

# Metrics
duration: 37min
completed: 2026-07-18
status: complete
---

# Quick Task 260718-rhv: Fix Grid-Mode Tile Title Misalignment and Hover Polish Summary

**Fixed-height grid-tile copy blocks (description AND title, the latter discovered live) plus a per-gallery `--tile-accent` hover tint and title lift on the homepage grid.**

## Performance

- **Duration:** 37 min
- **Started:** 2026-07-18T18:10:12Z
- **Completed:** 2026-07-18T18:46:54Z
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint)
- **Files modified:** 2

## Accomplishments
- Grid-tile titles now align to within 1px of the same per-tile bottom offset across all galleries, regardless of whether each has a statement, how long it is, or how long the gallery's own title text is.
- Every non-hero grid tile carries its own `--tile-accent` CSS custom property (sourced from `gallery.heroColor`), and hovering/focusing tints the tile's scrim toward that color while the existing dark gradient scrim keeps the white caption text legible.
- Title lifts 4px on hover/focus in sync with the description's existing 180ms fade/slide reveal.
- Human visually confirmed (via a dev server started in this isolated worktree) that alignment is fixed across all tiles including the Silos-vs-Brume comparison, and that the hover tint reads as intentional/on-brand with legible text on the lightest accent presets (Paysage/Lime, Silos/Teal).

## Task Commits

Each task was committed atomically:

1. **Task 1: Always-reserve the grid-tile description height so titles align** - `1227495` (fix)
2. **Task 2: Wire per-tile accent color, tint the scrim on hover, and lift the title** - `625838c` (feat)

**Task 3 (checkpoint:human-verify)** produced no code commit — approved as-is after a live review.

_Note: per this quick task's execution constraints, SUMMARY.md/STATE.md are written but not committed here — the orchestrator handles the docs commit._

## Files Created/Modified
- `src/components/HomeCarousel.astro` - Grid-tile markup (always-rendered description span, per-tile `--tile-accent` inline style) and CSS (fixed 3-line description min-height, single-line title clamp, scrim tint `::after`, title-lift transition)
- `tests/e2e/homepage.spec.ts` - New `grid-tile title alignment (260718-rhv)` and `grid-tile hover polish (260718-rhv)` describe blocks (6 new tests)

## Decisions Made
- Always render `.home-grid__tile-description` (never conditionally) with a fixed `min-height: calc(1.4em * 3)` so every tile's copy block reserves identical space, per the locked "Title-position fix approach" decision in CONTEXT.md.
- New, distinct `--tile-accent` custom property per non-hero tile — never reusing the hero tile's shared `--current-accent` — so each tile always tints toward its own gallery's color rather than whichever gallery the carousel is currently cycling through.
- Scrim tint layered as a `::after` pseudo-element over the existing dark gradient (additive, not a replacement) to preserve the dark gradient's legibility floor for the white caption text.
- Tint opacity set to 0.35 (Claude's Discretion per CONTEXT.md) — visually confirmed by the human as legible and on-brand on the lightest accent presets (Lime, Teal) during the checkpoint.
- Title lift amount set to `translateY(-4px)` over 180ms, matching the description's existing reveal timing (Claude's Discretion per CONTEXT.md).
- For the human-verify checkpoint, since this executor runs in an isolated git worktree with no access to the orchestrator's dev server, verification was done by building the site and driving it headlessly with Playwright to capture screenshots (grid default, hover on Lime/Teal/Plum-accented tiles, mobile 393px) for direct visual review; the human separately started a dev server on port 4324 in this same worktree for a live click-through and gave final approval.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Clamped `.home-grid__tile-title` to a single line with ellipsis truncation**
- **Found during:** Task 1 (writing the alignment e2e test)
- **Issue:** The plan's root-cause diagnosis (CONTEXT.md) only identified `.home-grid__tile-description`'s conditional rendering/unreserved height as the cause of title misalignment. While writing and running Task 1's own alignment test against real production content, a second, independent contributor was discovered: `.home-grid__tile-title` had no line-clamp, so a long gallery title ("The Victorian Tea room") wraps to 2 lines (76.8px) while short titles ("Silos", "Brume", "Adults") stay on 1 line (38.4px). Since both title and description sit inside the same bottom-anchored `.home-grid__tile-copy` block, this ~38px height difference shifted the title's own top position by the same mechanism as the description bug — meaning the plan's own literal verification test ("every tile's title offset within 1px") could not pass with only the description fix applied.
- **Fix:** Added `white-space: nowrap; overflow: hidden; text-overflow: ellipsis;` to `.home-grid__tile-title`, clamping every title to exactly 1 line regardless of name length. Full title text remains available via the tile's link destination and image `alt` text.
- **Files modified:** src/components/HomeCarousel.astro
- **Verification:** `grid-tile title alignment (260718-rhv)` e2e test passes across all 5 published galleries (previously failed by ~38px specifically on "The Victorian Tea room" before this fix); full `homepage.spec.ts` suite green across 3 repeated runs with no flakes.
- **Committed in:** `1227495` (Task 1 commit)

**2. [Rule 1 - Bug] Added a view-transition-race guard to the two new alignment e2e tests**
- **Found during:** Task 1 (test authoring/debugging)
- **Issue:** Playwright's `getBoundingClientRect()` calls taken immediately after clicking the mode toggle intermittently returned a zero-size rect for whichever grid tile currently carries the shared-element `view-transition-name` (assigned dynamically per HOME-06/D-10), because the browser's View Transitions API briefly detaches the real element's layout box while the transition snapshot pseudo-element is active — even with `prefers-reduced-motion: reduce` emulated (CSS sets the animation duration to 0, but the async snapshot/swap lifecycle still runs for at least one frame). This caused flaky ~121px-off failures unrelated to the actual fix, reproducible in ~1-in-4 full-suite runs.
- **Fix:** Added `page.emulateMedia({ reducedMotion: 'reduce' })` (matching the existing pattern in the `view-transition toggle — reduced-motion` describe block) plus an explicit `page.waitForFunction(...)` that waits for every grid tile title to report a non-zero bounding-box height before measuring geometry.
- **Files modified:** tests/e2e/homepage.spec.ts
- **Verification:** Full `homepage.spec.ts` suite (39 tests) passed with zero flakes across 5 repeated runs after the fix (previously flaky before it).
- **Committed in:** `1227495` (Task 1 commit)

**3. [Rule 1 - Bug] Used real Tab-key navigation instead of `locator.focus()` in the keyboard-focus hover-polish test**
- **Found during:** Task 2 (test authoring/debugging)
- **Issue:** The initial keyboard-focus test used Playwright's `locator.focus()` (a scripted DOM `.focus()` call), which Chromium's `:focus-visible` heuristic does not reliably treat as keyboard-originated when there was no prior keyboard interaction on the page — so the shared `:hover, :focus-visible` CSS selector never activated, and the test timed out waiting for the tint/lift to apply.
- **Fix:** Replaced with real `page.keyboard.press('Tab')` navigation (looped via `expect(...).toPass()` until the target tile reports as focused), which genuinely triggers `:focus-visible` the same way a real keyboard user would.
- **Files modified:** tests/e2e/homepage.spec.ts
- **Verification:** `keyboard focus applies the same tint and lift as hover` test passes reliably; full suite green.
- **Committed in:** `625838c` (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (all Rule 1 — bugs/blocking-test-flakiness discovered while implementing and testing this task, not pre-existing issues unrelated to it)
**Impact on plan:** All three were necessary to make the plan's own stated success criteria (title alignment, hover polish, all tests green) actually achievable and reliably testable. No scope creep beyond grid-mode tiles — carousel byline, Sanity schemas, and the hero tile's existing `--current-accent`/`--current-accent-text` wiring were all left untouched, matching the plan's scope guardrails.

## Issues Encountered
None beyond the three deviations documented above (all resolved during execution).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- No blockers. This was a self-contained, single-component (HomeCarousel.astro) polish fix within the completed v1.2 milestone (Phases 7-10).
- Content-level note carried forward from CONTEXT.md (not this task's scope): "Paysage" gallery's statement is still a placeholder ("Texte à venir — présentation de cette série par l'artiste.") — a Sanity content gap for Romane to fill in, not a code issue.

---
*Phase: quick-260718-rhv*
*Completed: 2026-07-18*

## Self-Check: PASSED

- FOUND: src/components/HomeCarousel.astro
- FOUND: tests/e2e/homepage.spec.ts
- FOUND: commit 1227495 (Task 1)
- FOUND: commit 625838c (Task 2)
- FOUND: .planning/quick/260718-rhv-fix-grid-mode-tile-title-misalignment-an/260718-rhv-SUMMARY.md
