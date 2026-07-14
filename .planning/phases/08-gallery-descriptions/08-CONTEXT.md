# Phase 8: Gallery Descriptions - Context

**Gathered:** 2026-07-14
**Status:** Retroactive — implementation already shipped before this discussion was run

<domain>
## Phase Boundary

Show each gallery's own description on the homepage in two display forms, replacing/augmenting the generic content:

1. Carousel mode: replace the generic "Un projet de Romane Lepont" byline with the current gallery's own description — HOME-07.
2. Grid mode: reveal a gallery's description on tile hover/focus — HOME-08.

Does not touch checkout/shop/exhibitions (v2, out of milestone scope), Phase 5's OVH domain cutover, or Phase 9/10's progressive-image-loading and header-consolidation work.

**Note on process:** Unlike Phases 1–7, this phase's implementation was built and shipped directly by Florian on `main` (commits `38457dd`, `3360f16`, `78f3c61`, `04b10a1`, `a68ee00`, `602d24b`, 2026-07-13/14) before `/gsd-discuss-phase 8` was run. This CONTEXT.md was captured retroactively — reconstructing the decisions already embodied in the shipped code and its e2e test suite — rather than gathered ahead of planning. No `/gsd-plan-phase`/`/gsd-execute-phase` cycle is needed; see `08-SUMMARY.md` for verification.
</domain>

<decisions>
## Implementation Decisions (as-shipped)

### Data model (shared by both HOME-07 and HOME-08)
- **D-01:** No new Sanity field was added. Both displays reuse the existing bilingual `statement` field on the `gallery` schema (`sanity/schemas/gallery.ts:113`, `localeTextField('statement', 'Texte de présentation', 'content')`) — originally added in Phase 2 for the gallery-detail page's artist statement (PORT-03). One field now backs three surfaces: the gallery-detail page paragraph, the homepage carousel byline, and the grid-tile hover description.
- **D-02:** The field is Studio-required (`rule.required()` on both `fr`/`en`) via the existing `localeTextField` helper, so every published gallery already has a non-empty statement in both locales — no separate "homepage description" content-entry step for Romane.

### Carousel byline replacement (HOME-07)
- **D-03:** `.home-hero__byline[data-role="gallery-statement"]` renders `gallery.statement || fallbackByline` (`HomeCarousel.astro:208`, kept in sync per-gallery by the client `render()` function). The `fallbackByline` ("Un projet de Romane Lepont" / "A project by Romane Lepont") stays in code as a defensive fallback for a gallery with an empty statement, even though the schema requires one — not expected to be visibly reachable in production content, but avoids a blank byline if content is ever incomplete.
- **D-04:** Long statements are clamped, not left to grow the layout: `max-width` capped, `-webkit-line-clamp`-style overflow handling, and the caption block is verified to never overlap the accent panel or push carousel navigation — enforced by `tests/e2e/homepage.spec.ts`'s "carousel keeps its navigation fixed and clamps long collection statements" test (statement width ≤ 441px, ≥ 300px gap to the accent panel, height clamped to 3 lines, `overflow: hidden`).

### Grid tile hover reveal (HOME-08)
- **D-05:** `.home-grid__tile-description` (`HomeCarousel.astro:249`) is only rendered when `gallery.statement` is truthy (defensive guard, same reasoning as D-03). Visually hidden by default (`opacity: 0; transform: translateY(8px)`) and revealed via `:hover` and `:focus-visible` on the parent `.home-grid__tile` (`opacity: 1; transform: translateY(0)`, 180ms ease transition) — keyboard-focus parity with mouse hover, not a hover-only affordance.
- **D-06:** Description text is clamped to 3 lines (`-webkit-line-clamp: 3`, `max-width: 52ch`) inside the tile's bottom-anchored `.home-grid__tile-copy` overlay, sitting below the title, above the existing dark gradient scrim for legibility over photos.

</decisions>

<canonical_refs>
## Canonical References

### Homepage component
- `src/components/HomeCarousel.astro` — carousel byline (`.home-hero__byline`, D-03/D-04) and grid-tile hover description (`.home-grid__tile-description`, D-05/D-06).

### Content model
- `sanity/schemas/gallery.ts` — `statement` field (D-01/D-02), unchanged by this phase; reused from Phase 2.

### Requirements
- `.planning/REQUIREMENTS.md` — HOME-07, HOME-08 definitions and Phase 8 traceability.

### Verification
- `tests/e2e/homepage.spec.ts` — `describe('collection statements on the homepage')` (3 tests: byline replacement, hover reveal, clamping/layout) — see `08-SUMMARY.md` for pass status.

</canonical_refs>

<specifics>
## Specific Ideas

- This phase's scope (HOME-07 + HOME-08) was deliberately grouped in the v1.2 roadmap because both surface the same per-gallery `statement` content in two display forms — confirmed accurate: no new schema field was needed, exactly as the roadmap's grouping rationale anticipated (see STATE.md's "Roadmap Evolution" note on Phase 8).

</specifics>

<deferred>
## Deferred Ideas

None identified during retroactive review.

</deferred>

---

*Phase: 08-gallery-descriptions*
*Context gathered: 2026-07-14 (retroactive)*
