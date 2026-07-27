---
phase: 08-gallery-descriptions
plan: retroactive
subsystem: ui
tags: [astro, css, sanity, playwright]

requires:
  - phase: 02-portfolio-galleries
    provides: "gallery.statement bilingual field (originally for gallery-detail artist statements, PORT-03)"
  - phase: 07-homepage-quick-fixes-mobile-hero-correctness
    provides: "HomeCarousel.astro header/toggle/hero groundwork this phase's changes sit on top of"
provides:
  - "Carousel hero byline shows the current gallery's own statement instead of the generic 'Un projet de Romane Lepont' text"
  - "Grid-mode tiles reveal their gallery's statement on hover/focus, 3-line clamped, with a legibility scrim"
affects: [09-progressive-image-loading, 10-homepage-header-shared-component-consolidation]

tech-stack:
  added: []
  patterns:
    - "Reused an existing content field for a new display surface instead of adding a new Sanity field, since the same text (statement) was already Studio-required and already fetched at build time"

key-files:
  created: []
  modified:
    - src/components/HomeCarousel.astro
    - tests/e2e/homepage.spec.ts
    - sanity/schemas/gallery.ts (unrelated adjacent schema work in the same commits — not part of HOME-07/08's own scope)

key-decisions:
  - "No new Sanity field added — HOME-07 and HOME-08 both reuse the existing bilingual gallery.statement field rather than introducing a homepage-specific description field"
  - "Grid description only reveals on :hover and :focus-visible (not always visible), 3-line clamped, to keep the grid's photo-forward visual density"
  - "Carousel byline keeps a code-level fallback string for an empty statement, even though the schema requires one, as a defensive guard rather than a content-dependent hard requirement"

patterns-established:
  - "One CMS field serving multiple display surfaces (gallery-detail paragraph + carousel byline + grid hover) — evaluate before adding a new schema field when existing content already fits"

requirements-completed: [HOME-07, HOME-08]

coverage:
  - id: D1
    description: "Carousel hero byline shows the current gallery's own statement text, not the generic 'Un projet de Romane Lepont' byline"
    requirement: HOME-07
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#collection statements on the homepage > carousel uses the current collection statement instead of the generic byline"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#collection statements on the homepage > carousel keeps its navigation fixed and clamps long collection statements"
        status: pass
    human_judgment: false
  - id: D2
    description: "Hovering (or focusing) a grid-mode tile reveals that gallery's description text"
    requirement: HOME-08
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#collection statements on the homepage > grid tile reveals its collection statement on hover"
        status: pass
    human_judgment: false

duration: unknown (implemented outside GSD session tracking)
completed: 2026-07-14
status: complete
---

# Phase 8: Gallery Descriptions Summary

**Retroactive summary — HOME-07 and HOME-08 were implemented and shipped directly to `main` by Florian on 2026-07-13/14, before this phase was run through the GSD discuss/plan/execute cycle. This document captures verification performed during `/gsd-discuss-phase 8` and backfills the phase's tracking artifacts.**

## Why this is retroactive

`/gsd-discuss-phase 8` found HOME-07 and HOME-08 already fully implemented on `main`, with dedicated e2e coverage already in the test suite (`describe('collection statements on the homepage')`, `tests/e2e/homepage.spec.ts:146-220`). Florian confirmed (via the discuss-phase checkpoint) that this existing work is the intended Phase 8 deliverable — no further planning or execution needed. This session verified the implementation and updated tracking docs (REQUIREMENTS.md, STATE.md, PROJECT.md) to reflect reality.

## Verification Performed (2026-07-14, this session)

- `npx vitest run tests/unit/gallery-query.test.ts` — 13/13 passed.
- `npx playwright test tests/e2e/homepage.spec.ts -g "collection statements"` — 3/3 passed (byline replacement, hover reveal, navigation/clamping layout).
- `npx playwright test tests/e2e/homepage.spec.ts` (full file, regression check) — 23/23 passed.

## Accomplishments

- HOME-07: `.home-hero__byline[data-role="gallery-statement"]` (`HomeCarousel.astro:208`) renders the current gallery's `statement` (bilingual, from `sanity/schemas/gallery.ts`) instead of the generic byline, kept in sync across carousel auto-advance/prev/next by the client `render()` function.
- HOME-08: `.home-grid__tile-description` (`HomeCarousel.astro:249`) renders inside each grid tile, hidden by default and revealed on `:hover`/`:focus-visible` (180ms opacity/transform transition), clamped to 3 lines.
- No new Sanity schema field was needed — both surfaces reuse the `statement` field already required in Studio since Phase 2.

## Commits (already on `main`, authored directly by Florian, not via `/gsd-execute-phase`)

- `38457dd` — feat: expand Sanity content workflows and previews (introduced the byline replacement and grid hover description, alongside unrelated adjacent Studio schema work)
- `3360f16` — fix: stabilize homepage carousel captions
- `78f3c61` — fix: add space beside carousel captions
- `04b10a1` — fix: cap desktop carousel caption width
- `a68ee00` — fix: narrow carousel collection descriptions
- `602d24b` — fix: refine carousel caption spacing

## Next Phase Readiness

- Phase 9 (HOME-09, progressive image loading) and Phase 10 (HOME-10/I18N-04, header consolidation) are unaffected by this phase's scope and can proceed independently.
- No deferred items or follow-up work identified.

---
*Phase: 08-gallery-descriptions*
*Verified: 2026-07-14*
