---
phase: quick-260803-jby
plan: 01
subsystem: ui
tags: [astro, playwright, gallery-grid, masonry, css-multi-column, sanity-image]

requires:
  - phase: quick-260803-ira
    provides: "GalleryGrid.astro's shared .tile img base rule fixed from crop to contain, closing the bento-crop gap on édition grid photos"
  - phase: quick-260801-kgh
    provides: "Édition images/hero derivation (pickHeroIndex, single images array) that this task's gridItems derivation builds on"
provides:
  - "Édition detail pages (fr+en) render secondary photos in the same masonry layout gallery detail pages already use — real per-photo aspectRatio, uncropped src/srcset, no exposed tile background"
  - "GalleryGrid.astro's bento branch (groups chunking, bento markup, .gallery-grid__group/[data-size]/[data-side]/.tile--hero/.tile--small CSS) retained but has no live caller after this change"
affects: [gallery-editions-display, tests-e2e-gallery, tests-e2e-edition]

tech-stack:
  added: []
  patterns:
    - "Grid-item derivation mirrors src/pages/galleries/[slug].astro's shape exactly: destructure img.dimensions, compute aspectRatio guarded to 1, use fullSizeUrl/responsiveImageSrcSet instead of thumbnailUrl/responsiveThumbnailSrcSet"
    - "GalleryGrid callers now select layout explicitly (layout=\"masonry\") rather than relying on the component's bento default"

key-files:
  created: []
  modified:
    - "src/pages/editions/[slug].astro"
    - "src/pages/en/editions/[slug].astro"
    - "src/components/EditionDetailBody.astro"
    - "src/components/GalleryGrid.astro"
    - "tests/e2e/edition.spec.ts"
    - "tests/e2e/gallery.spec.ts"

key-decisions:
  - "Replaced the bento mechanism for éditions entirely (moved to masonry) rather than continuing to patch bento's object-fit, per direct owner feedback: éditions should display photos entirely, the same way Galleries pages already do."
  - "Left GalleryGrid.astro's bento code path (markup branch + CSS) in the file, unreferenced by any real caller, rather than deleting it in this task — recorded here as a separately-cleanable follow-up."

requirements-completed: [260803-jby]

coverage:
  - id: D1
    description: "Édition detail grid (fr+en) uses masonry layout: real per-photo aspectRatio + uncropped src/srcset, no exposed tile background, no bento groups"
    requirement: "260803-jby"
    verification:
      - kind: e2e
        ref: "tests/e2e/edition.spec.ts#editions masonry grid photos uncropped and flush (quick-260803-jby) > every published édition (fr): masonry grid, no bento groups, every tile flush and uncropped at its own natural ratio"
        status: pass
      - kind: e2e
        ref: "tests/e2e/edition.spec.ts#editions masonry grid photos uncropped and flush (quick-260803-jby) > the EN twin renders the identical masonry contract"
        status: pass
    human_judgment: false
  - id: D2
    description: "Gallery detail pages remain provably unaffected by the édition layout swap"
    verification:
      - kind: e2e
        ref: "tests/e2e/gallery.spec.ts#gallery grid masonry layout > gallery grid renders as a multi-column masonry with uncropped, real-aspect-ratio tiles"
        status: pass
      - kind: e2e
        ref: "tests/e2e/gallery.spec.ts#gallery + édition thumbnail tiles render with no frame (PORT-05, D-04/D-05) > gallery detail (masonry): every tile has 0px borders, keeps the ink loading background, and never letterboxes"
        status: pass
    human_judgment: false
  - id: D3
    description: "Hover/focus zoom and Lightbox data-index contract survive the layout swap on édition grid tiles"
    verification:
      - kind: e2e
        ref: "tests/e2e/edition.spec.ts#editions masonry grid photos uncropped and flush (quick-260803-jby) > the hover/focus zoom still applies on édition grid tiles after the masonry swap"
        status: pass
      - kind: e2e
        ref: "tests/e2e/edition.spec.ts#editions lightbox > the hero opens the lightbox at its real position (EDN-03); the first grid thumbnail opens it at its own real, differing position"
        status: pass
    human_judgment: false
  - id: D4
    description: "Édition hero photo (owner-approved, quick-260803-bvu) unaffected by this task"
    verification:
      - kind: e2e
        ref: "tests/e2e/edition.spec.ts#editions hero uncropped photo (Item 7, quick-260803-bvu) > an édition hero photo reports object-fit: contain, unlike a gallery hero which still crops"
        status: pass
    human_judgment: false
  - id: D5
    description: "Visual confirmation: no coloured band around any édition grid photo, at desktop and mobile, and gallery detail page unchanged"
    verification: []
    human_judgment: true
    rationale: "Visual composition quality (deliberate multi-column flow reading correctly, no letterboxing) is a subjective judgment on rendered pixels, not something the automated flush/ratio assertions alone can certify to a human reviewer's satisfaction — screenshots were captured and reviewed during execution, but final visual sign-off is the owner's call."

duration: ~30min
completed: 2026-08-03
status: complete
---

# Quick Task 260803-jby: Édition Detail Grid Masonry Layout Summary

**Édition detail pages (fr+en) now render their secondary-photo grid as the same CSS multi-column masonry gallery detail pages already use — each tile's box is the photo's own natural-ratio shape, so no tile background is ever exposed around a photo.**

## Performance

- **Duration:** ~30 min
- **Completed:** 2026-08-03
- **Tasks:** 1 (single atomic task per plan)
- **Files modified:** 6

## Accomplishments

- Both édition detail routes (`src/pages/editions/[slug].astro`, `src/pages/en/editions/[slug].astro`) now derive `gridItems` exactly like `src/pages/galleries/[slug].astro`: a real per-photo `aspectRatio` computed from the Sanity image's `dimensions` (already projected by `IMAGES_WITH_DIMENSIONS_PROJECTION` on both édition queries — no data-layer change needed), plus the uncropped `fullSizeUrl`/`responsiveImageSrcSet` helpers in place of the square-crop `thumbnailUrl`/`responsiveThumbnailSrcSet` helpers. Localized `alt` and locale-specific `ariaLabel` left exactly as they were.
- `EditionDetailBody.astro` now passes `layout="masonry"` explicitly at its `GalleryGrid` call site, matching `GalleryDetailBody.astro`'s existing call site — both real callers now select masonry explicitly.
- `GalleryGrid.astro`'s diff is comments only: corrected the file header, the `layout` prop's Props-interface note, and the `.tile img` base-rule comment, all of which previously described bento as the éditions' live treatment. The bento markup branch and its CSS (`.gallery-grid__group`, `[data-size]`, `[data-side]`, `.tile--hero`, `.tile--small`) are untouched and still present, but now have no live caller.
- `tests/e2e/edition.spec.ts`'s superseded `'editions bento grid photos uncropped (quick-260803-ira)'` describe block was rewritten in place to `'editions masonry grid photos uncropped and flush (quick-260803-jby)'`, asserting: masonry class present, zero bento groups, multi-column flow (column-count > 1); for every tile on every published édition (fr) and its EN twin — static position, uncropped object-fit, real aspect-ratio (not `auto`), rendered ratio within 1% of the photo's natural ratio, and the img's bounding box flush with its tile's on all four edges within 0.5px; a vacuous-loop guard proving at least one real tile was measured; a scoping guard proving the gallery masonry path is unaffected; and a hover-zoom test proving the transition still fires on édition grid tiles.
- `tests/e2e/gallery.spec.ts`'s PORT-05 édition sub-test was rewritten to state the masonry contract (renamed from "bento" to "masonry, quick-260803-jby"), keeping its 0px-border and uncropped `object-fit` assertions byte-identical, and adding the same img-vs-tile flush check the gallery masonry sub-test above it already performs. Both stale describe-block header comments (`'gallery grid masonry layout'` and the PORT-05 block) were corrected to state that gallery AND édition detail pages now render the same masonry mode. Every gallery-side assertion in the file is unedited.
- Full CI-equivalent gate green: `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:artifact`, `npm run test:unit` (276 passed), `npm run test:e2e` (287 passed across chromium + webkit-mobile, on a clean re-run after one transient parallel-load flake — see Issues Encountered).
- Desktop (1280x900) and mobile (390x844) screenshots of a live `astro dev` server confirmed visually: édition grid photos display edge to edge with no coloured band on any side, in a deliberate 3-column (desktop) / 2-column (mobile) masonry flow; a gallery detail page screenshot confirmed no visual change there.

## Task Commits

Single atomic task per plan, committed as one `fix` commit (code + tests together, per plan constraints):

1. **Task 1: Move the édition detail grid onto the gallery masonry mechanism** - `929f71b` (fix)

_No separate plan-metadata commit was made by this executor — orchestrator handles STATE.md/ROADMAP.md/REQUIREMENTS.md and this SUMMARY per the quick-task constraints given._

## Files Created/Modified

- `src/pages/editions/[slug].astro` - FR édition grid derivation rebuilt to mirror the gallery page's real-aspectRatio + uncropped-URL pattern; import list updated; comment corrected
- `src/pages/en/editions/[slug].astro` - EN twin of the same change, structurally symmetric
- `src/components/EditionDetailBody.astro` - `GalleryGrid` call site now passes `layout="masonry"` explicitly, with a comment explaining why
- `src/components/GalleryGrid.astro` - comment-only corrections (file header, `layout` prop note, `.tile img` base-rule note) — no CSS/markup/prop changed
- `tests/e2e/edition.spec.ts` - superseded bento describe block rewritten to the masonry contract, per-page/per-tile flush+ratio assertions, vacuous-loop guard, gallery-scoping guard, hover-zoom guard
- `tests/e2e/gallery.spec.ts` - PORT-05 édition sub-test rewritten to the masonry contract with an added flush check; two stale header comments corrected; gallery-side assertions unedited

## Decisions Made

- Replaced the bento mechanism for éditions entirely (moved to masonry) rather than continuing to patch bento's `object-fit` a second time, per direct, explicit owner feedback: "you just had to display the picture entirely the same way as it's done in Galleries pages."
- Left `GalleryGrid.astro`'s bento code path (the `groups` chunking, the bento markup branch, and every `.gallery-grid__group`/`[data-size]`/`[data-side]`/`.tile--hero`/`.tile--small`/`<800px` bento CSS rule) in the file, unreferenced by any real caller after this change, rather than deleting a whole subsystem inside this live-feedback correction. This is recorded here as separately cleanable — a future task could safely remove the bento branch entirely now that neither gallery nor édition detail pages select it.

## Deviations from Plan

None - plan executed exactly as written. All scope boundaries were honored: `GalleryGrid.astro`'s bento code path was left in place (comments-only changes there); both édition route files mirror the gallery route's exact `aspectRatio`/uncropped-URL pattern; édition thumbnail `alt` text stays localized (not blindly copied from galleries' empty-alt derivation); no test was deleted, skipped, or weakened — every superseded assertion was rewritten to the new contract.

## Issues Encountered

- One transient e2e flake on the first full `npm run test:e2e` run: `edition.spec.ts`'s "galleries unaffected" test (whose natural-ratio assertion is carried forward byte-unchanged from the pre-existing "the gallery masonry path is untouched" test, per plan requirement to leave gallery-side assertions unedited) measured a `naturalHeight` of 0 (NaN ratio) under the full 287-test parallel load. Re-ran the single test 5x in isolation (all passed) and re-ran the full suite once more (287/287 passed) to confirm this was pre-existing test-infrastructure flakiness under load, not a regression introduced by this task's changes — the assertion in question was not modified by this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Édition and gallery detail pages now share one rendering mechanism (masonry) end to end; the shared `GalleryGrid.astro` component's bento branch is dead code with no caller, flagged above as a candidate for a future, separately-scoped cleanup task.
- No blockers for subsequent work in Phase 18 or later phases.

---
*Phase: quick-260803-jby*
*Completed: 2026-08-03*

## Self-Check: PASSED

- FOUND: `src/pages/editions/[slug].astro`
- FOUND: `src/pages/en/editions/[slug].astro`
- FOUND: `src/components/EditionDetailBody.astro`
- FOUND: `src/components/GalleryGrid.astro`
- FOUND: `tests/e2e/edition.spec.ts`
- FOUND: `tests/e2e/gallery.spec.ts`
- FOUND: `.planning/quick/260803-jby-make-edition-detail-grid-use-masonry-lay/260803-jby-SUMMARY.md`
- FOUND: commit `929f71b` in git log
