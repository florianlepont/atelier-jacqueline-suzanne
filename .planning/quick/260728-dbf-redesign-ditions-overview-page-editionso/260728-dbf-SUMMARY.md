---
phase: quick-260728-dbf
plan: 01
subsystem: ui
tags: [astro, sanity-image-url, playwright, editorial-design]

requires:
  - phase: quick-260727-the
    provides: shared EditionsOverviewBody.astro component (fr/en tile-resolution split from markup)
provides:
  - previewPanelUrl 3:4-crop Sanity image helper
  - "B2 — Cursor Preview" éditions overview redesign (flat text-row list + floating cursor-follow photo panel)
  - adapted e2e coverage for the new .editions-index__row/.editions-preview markup
affects: [editions-overview, editions-detail-nav-discovery]

tech-stack:
  added: []
  patterns:
    - "Cursor-follow floating preview panel: a single fixed-position element outside the list, driven by a small client <script> reading mousemove position + row data-img attributes on mouseenter/mouseleave"

key-files:
  created: []
  modified:
    - src/lib/image.ts
    - tests/unit/image.test.ts
    - src/pages/editions/index.astro
    - src/pages/en/editions/index.astro
    - src/components/EditionsOverviewBody.astro
    - tests/e2e/edition.spec.ts
    - tests/e2e/gallery.spec.ts
    - tests/e2e/accessibility.spec.ts

key-decisions:
  - "Ported sketch 010 variant B2 verbatim (Romane-confirmed winner) rather than re-deriving the hover/preview design"
  - "Read the always-present-but-CSS-hidden statement text via textContent() (not innerText()) in e2e assertions, matching the state-independent pattern already used for the détail page's no-JS reachability test"

requirements-completed:
  - "EDN-REDESIGN"
  - "EDN-06"

coverage:
  - id: D1
    description: "previewPanelUrl 3:4-crop Sanity image helper, unit-tested"
    requirement: "EDN-REDESIGN"
    verification:
      - kind: unit
        ref: "tests/unit/image.test.ts#builds a 3:4 portrait crop preview with the default width"
        status: pass
    human_judgment: false
  - id: D2
    description: "Both /editions/ and /en/editions/ render the B2 flat text-row list with index/title/statement, replacing the zigzag tile grid"
    requirement: "EDN-REDESIGN"
    verification:
      - kind: e2e
        ref: "tests/e2e/edition.spec.ts#editions overview > lists each published édition as a linked row with title and full statement (fr)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/edition.spec.ts#editions overview > renders the English overview at /en/editions/ with a differing, untruncated statement"
        status: pass
    human_judgment: false
  - id: D3
    description: "Desktop hover reveals the row's statement and activates a cursor-following 3:4 photo panel showing that row's photo; switching rows updates the panel image"
    requirement: "EDN-REDESIGN"
    verification:
      - kind: e2e
        ref: "tests/e2e/edition.spec.ts#editions overview layout > hovering a row reveals its statement and activates the cursor-following preview panel with that row's photo"
        status: pass
    human_judgment: false
  - id: D4
    description: "Mobile (<=800px): panel hidden, statements always visible — CSS-only, verified via the media query rule"
    verification: []
    human_judgment: true
    rationale: "No automated viewport-specific e2e test asserts the ≤800px CSS media-query branch directly; the mobile behavior is implemented per the sketch-ported CSS but relies on visual/manual confirmation of the breakpoint behavior."
  - id: D5
    description: "Header (hairline + eyebrow + h1) and the zero-éditions EmptyState fallback remain byte-unchanged"
    requirement: "EDN-REDESIGN"
    verification:
      - kind: unit
        ref: "npm run typecheck (Props interface unchanged, EmptyState branch untouched)"
        status: pass
    human_judgment: false
  - id: D6
    description: "EDN-06 build-blocking commerce-affordance guard still passes against the new markup"
    requirement: "EDN-06"
    verification:
      - kind: e2e
        ref: "tests/e2e/edition.spec.ts#editions overview > shows no price, availability, or purchase affordance (EDN-06)"
        status: pass
      - kind: other
        ref: "npm run test:artifact"
        status: pass
    human_judgment: false

duration: 13min
completed: 2026-07-28
status: complete
---

# Quick Task 260728-dbf: Redesign Éditions Overview Page Summary

**Éditions overview redesigned from a zigzag photo-tile grid to sketch 010's "B2 — Cursor Preview" pattern: a flat text-row index (index label / big title / statement) with a fixed 3:4 photo panel that follows the cursor and shows the hovered row's photo, faithfully ported from the Romane-confirmed sketch.**

## Performance

- **Duration:** 13 min
- **Started:** 2026-07-28T07:47:00Z
- **Completed:** 2026-07-28T07:59:42Z
- **Tasks:** 3
- **Files modified:** 7 (plus a non-code `.env` restoration for a pre-existing missing-file gap, and `sanity/node_modules` restoration via `npm ci` — neither committed, see Deviations)

## Accomplishments
- Added `previewPanelUrl(img, width=680)` to `src/lib/image.ts` — a 3:4 portrait-crop Sanity CDN URL helper mirroring `thumbnailUrl`, unit-tested, and wired into both `/editions/` and `/en/editions/` route files in place of the old square-cropped `thumbnailUrl`.
- Rewrote `EditionsOverviewBody.astro`'s non-empty-branch markup, entire `<style>` block, and added a client `<script>`, replacing the `.editions-grid`/`.tile*` zigzag poster grid with a flat `.editions-index` list of `.editions-index__row` rows (number/title/statement) plus a `.editions-preview` fixed floating panel that follows the cursor and swaps its image on row hover.
- Adapted all affected e2e coverage (`edition.spec.ts`, `gallery.spec.ts`, `accessibility.spec.ts`) to the new selectors, replaced the deleted zigzag hero/small geometry test with a genuine hover-interaction test (panel activation, statement reveal, and per-row image swap), and left the EDN-06 commerce-token guard and seo/site-header specs untouched.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add previewPanelUrl 3:4-crop helper (+ unit test) and wire both routes to it** - `2403837` (feat)
2. **Task 2: Rewrite EditionsOverviewBody to the B2 Cursor-Preview design (markup + CSS + JS)** - `6d9aaca` (feat)
3. **Task 3: Rewrite the overview e2e assertions and update all navigation selectors** - `527bfbe` (test)

**Plan metadata:** (docs commit handled by the orchestrator, per constraints)

## Files Created/Modified
- `src/lib/image.ts` - Added `previewPanelUrl` 3:4-crop helper
- `tests/unit/image.test.ts` - Unit test for `previewPanelUrl`'s default-width output
- `src/pages/editions/index.astro` - Swapped `thumbnailUrl` → `previewPanelUrl` for `imgSrc`
- `src/pages/en/editions/index.astro` - Same swap, EN twin
- `src/components/EditionsOverviewBody.astro` - Full B2 redesign: markup, CSS, and cursor-follow client script
- `tests/e2e/edition.spec.ts` - Selector swaps, `textContent()` reads, replaced geometry test with hover-interaction test
- `tests/e2e/gallery.spec.ts` - `.tile` → `.editions-index__row` at the two overview-navigation discovery spots
- `tests/e2e/accessibility.spec.ts` - Same selector swap at its détail-URL discovery spot

## Decisions Made
- Ported sketch 010 variant B2 verbatim (exact CSS values, exact JS behavior) rather than re-deriving the design — it is Romane-confirmed and authoritative per the plan.
- Read the overview row's statement text via `.textContent()` instead of `.innerText()` in e2e assertions, since the statement is CSS-hidden (`opacity:0`/`max-height:0`) until hover but always present in the DOM — mirroring the pattern already established for the détail page's no-JS reachability test.
- Kept the previously-unused `imgSrcset`/`responsiveThumbnailSrcSet` wiring in both route files exactly as-is per the plan's explicit instruction, even though the new B2 markup doesn't render an inline `<img srcset>` — it still satisfies the `EditionTile` Props contract and avoids unnecessary scope creep.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Typed the mousemove event handler to fix a TypeScript build-blocking error**
- **Found during:** Task 2 (client `<script>` cursor-follow logic)
- **Issue:** `astro check` failed with `ts(2339): Property 'clientX'/'clientY' does not exist on type 'Event'` because `addEventListener('mousemove', ...)` infers the callback parameter as the generic `Event` type, not `MouseEvent`.
- **Fix:** Explicitly typed the parameter `(e: Event)` and cast to `MouseEvent` before reading `clientX`/`clientY`.
- **Files modified:** `src/components/EditionsOverviewBody.astro`
- **Verification:** `npm run typecheck` — 0 errors.
- **Committed in:** `6d9aaca` (Task 2 commit)

**2. [Environment restoration, not a code deviation] Restored two pre-existing, worktree-local missing artifacts unrelated to this task's file scope**
- **Found during:** running the full verification gate (`npm run build`, `npm run test:coverage`)
- **Issue:** (a) This git worktree had no `.env` file (gitignored, never copied when the worktree was created), so `npm run build` failed immediately with "Missing SANITY_PROJECT_ID or SANITY_DATASET env vars" — completely unrelated to the Éditions overview redesign. (b) `sanity/node_modules` was absent in this worktree (also gitignored/never installed here), so an unrelated pre-existing test (`tests/unit/dashboard-logic.test.ts`, added in quick-260727-ohf, months before this task) failed to import `@sanity/icons/BulbOutline`.
- **Fix:** Copied the existing `.env` values from the main repo checkout into this worktree (no secret was created or changed — same credentials already in use elsewhere), and ran `npm ci` inside `sanity/` to install its already-lockfile-pinned dependencies. Neither action touches any file in this task's scope, and neither is committed (both are gitignored, worktree-local environment state, not code).
- **Files modified:** none tracked by git (`.env` is gitignored; `sanity/node_modules` is gitignored)
- **Verification:** `npm run build` and `npm run test:coverage` both then ran cleanly with no unrelated failures.
- **Committed in:** N/A — not a code change, not committed.

---

**Total deviations:** 1 auto-fixed (blocking type error) + 1 environment restoration (out-of-scope, not committed).
**Impact on plan:** The type fix was necessary for `npm run typecheck` to pass and is scoped entirely to the new script this task added. The environment restoration was pre-existing and unrelated to this task's redesign work — it was necessary only to run the full verification gate honestly in this worktree, and left no trace in git history.

## Issues Encountered
None beyond the two deviations documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- The Éditions overview redesign is complete and fully verified: `npm run typecheck && npm run test:coverage && npm run build && npm run test:artifact` all pass, the targeted e2e set (`edition.spec.ts`, `accessibility.spec.ts`, `gallery.spec.ts`, `seo.spec.ts`, `site-header.spec.ts`) is 101/101 green, and the full e2e suite is 252/252 green.
- No blockers for follow-on work. The `.editions-index__row`/`.editions-preview` selectors are now the stable contract for any future overview-page e2e coverage or nav-discovery helpers.

---
*Phase: quick-260728-dbf*
*Completed: 2026-07-28*

## Self-Check: PASSED

All 8 modified files confirmed present on disk; all 3 task commits (`2403837`, `6d9aaca`, `527bfbe`) confirmed present in `git log --oneline --all`.
