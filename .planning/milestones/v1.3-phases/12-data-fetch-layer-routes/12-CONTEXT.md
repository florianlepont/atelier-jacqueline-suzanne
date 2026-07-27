# Phase 12: Data-Fetch Layer & Routes - Context

**Gathered:** 2026-07-22
**Status:** Ready for planning

<domain>
## Phase Boundary

A build-time GROQ data-fetch layer for the `edition` Sanity type (mirroring `src/lib/sanity.ts`'s `Gallery`/`getGalleries`/`getGallery` pattern), plus two new bilingual route trees: an Éditions overview page (vertical editorial list) and a per-édition detail page (hero + statement + format details + photo-shoot grid + lightbox). Zero pricing/availability/purchase affordances anywhere. Overview and detail URLs are added to `sitemap.xml`.

Does not touch: main-nav wiring to the new routes (Phase 13 — `SiteHeader`/`BaseLayout`/`HomeCarousel` call sites), the homepage carousel/grid (Éditions must never appear there, per Phase 11 D-13), the gallery↔édition cross-link (EDN-08, deferred to a future v1.x phase), or any commerce/pricing field (deferred to the future shop milestone).

</domain>

<decisions>
## Implementation Decisions

### Roadmap correction (made during this discussion)
- **D-00 [informational]:** ROADMAP.md's Phase 12 success criterion #1 originally locked the overview page as "in a grid" — written before this discussion happened. The user explicitly chose a vertical editorial list instead (see D-01). ROADMAP.md was updated in place (2026-07-22) to say "as a vertical editorial list (not a grid)" so the criterion matches the actual decision. All other Phase 12 success criteria (sitemap entries, no commerce affordances, both locales, lightbox reuse) are unchanged. No plan action required — this is an audit-trail note about the ROADMAP.md edit itself; the actual implementable decision is D-01, which plans do cover.

### Overview page layout
- **D-01:** Vertical editorial list, NOT a grid of cards — one row per édition. This is a genuinely new visual pattern; there is no gallery-page equivalent to mirror (the standalone Galleries overview page was removed in Phase 04.3 — the homepage grid is the sole photography-browsing entry point, and Éditions must never appear there).
- **D-02:** Each row: `leadPhoto` thumbnail on one side, title + full statement text on the other (side-by-side, not stacked, not full-bleed-with-overlay).
- **D-03:** Statement text shown in FULL — no truncation/ellipsis/line-clamp — even though this means row heights vary between éditions.
- **D-04:** `leadPhoto` position alternates left/right (zigzag) from row to row, rather than staying fixed on one side.

### Detail page — leadPhoto / photo-shoot / Lightbox relationship
- **D-05:** `leadPhoto` is a clickable hero (unlike gallery's non-interactive `images[0]` hero) — clicking it opens the Lightbox at index 0.
- **D-06:** The Lightbox receives a combined array in this order: `[leadPhoto, ...images]`. `Lightbox.astro` currently takes a flat `images: GalleryImage[]` prop — the détail page must construct this combined array itself before passing it in (édition's `leadPhoto` and `images` are separate schema fields, unlike gallery where `images[0]` already lives inside the single array).
- **D-07:** The thumbnail grid below the hero shows ONLY `images[]` — `leadPhoto` is NOT duplicated as its own grid tile. Same de-dup principle as the gallery detail page (which skips `images[0]` in its grid since it's already shown as the hero), just applied to a separate field instead of an array index.
- **D-08:** A "Retour aux éditions" (back to Éditions overview) link is present on the detail page. Reasoning: clicking the site logo returns to the photography homepage, which does NOT list Éditions (by design — see D-13 in `11-CONTEXT.md`), so unlike the gallery detail page, there is no other way back to the Éditions list without this dedicated link.
  - **Known landmine:** the gallery-detail page used to have exactly this kind of "back home" link, and it was removed in Phase 10 after a real bug (`10-UAT.md` gap, `header-backhome-overlap-logo` debug session) — the link's absolute positioning visually overlapped `SiteHeader`'s logo. This new "Retour aux éditions" link must be positioned so it cannot repeat that overlap (it points somewhere different from the logo anyway — Éditions overview, not home — so accidental redundancy is less likely, but the positioning bug itself is a real precedent to avoid).

### Format details display
- **D-09:** `pageCount` / `printRun` / `dimensions` render as a compact label:value list on one line, e.g. "Pages : 50 · Tirage : 2 exemplaires · Dimensions : 21 × 29,7 cm" — not a two-column table, not folded into prose. Chosen specifically to read as informational/showcase, not product-spec/commerce (EDN-06 boundary).
- **D-10:** Placement: hero → statement → format details → photo-shoot grid. Format details sit with the other text content, immediately after the statement and before the grid.

### Claude's Discretion
- **URL path segment:** not raised as a discussion question — mirror the `galleries` convention exactly. `/editions/[slug]` (unaccented English word, same as `/galleries/[slug]`), same fr-root/en-prefixed split: `src/pages/editions/[slug].astro` + `src/pages/en/editions/[slug].astro`, and an overview page at `src/pages/editions/index.astro` + `src/pages/en/editions/index.astro`.
- Exact visual styling of the editorial list (spacing, thumbnail size/aspect ratio, row dividers, typography) beyond "side-by-side, zigzag, full text" — design within existing tokens (`--space-*`, `--color-*`, Archivo Black display font).
- Responsive collapse behavior of the side-by-side row layout on mobile (e.g., stack photo above text below a breakpoint) — no specific breakpoint behavior was discussed; follow the site's existing `768px` convention (see `GalleryGrid.astro`).
- Exact position/styling of the "Retour aux éditions" link (D-08) — avoid literally reusing the removed gallery back-link's absolute-positioning technique near the hero; anywhere else on the page that doesn't visually collide with `SiteHeader` is fine.
- `sitemap.xml.ts` wiring for the two new route trees — locked as a requirement by ROADMAP success criterion #5, not a gray area, but noted here so the planner doesn't treat it as optional: add `editions/` and `editions/${edition.slug}/` entries (both locales) alongside the existing `galleries/${gallery.slug}/` pattern.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & roadmap
- `.planning/ROADMAP.md` (Phase 12 section, lines 376–391) — the 5 success criteria this phase must satisfy, including the corrected criterion #1 (D-00) and the sitemap requirement (#5).
- `.planning/REQUIREMENTS.md` (lines 79–85, 198–204) — EDN-02, EDN-03 (explicitly: "reusing the existing gallery lightbox"), EDN-04, EDN-06, EDN-07; phase-mapping table confirms these 5 IDs belong to Phase 12.
- `.planning/phases/11-schema-content-model/11-CONTEXT.md` — the schema decisions this phase's data-fetch layer must match field-for-field: D-04 (dedicated `leadPhoto`, separate from `images[]`), D-05 (`images[]` = photos of the printed object itself, not the gallery's photography subject), D-06 (typed `pageCount`/`printRun`/`dimensions` shape), D-11 (bilingual `alt` + `rights` per image).

### Schema this phase fetches against (Phase 11 dependency)
- `sanity/schemas/edition.ts` — the live field names/shapes this phase's GROQ queries and TypeScript interfaces must match exactly: `leadPhoto`, `images`, `statement`, `pageCount`, `printRun`, `dimensions` (`{width, height, unit}`), `title`, `slug`, `orderRank`, `publicationStatus`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/sanity.ts` — the exact pattern to mirror for the data-fetch layer: `Gallery`/`GalleryImage` interfaces, `PUBLISHED_GALLERY_FILTER` GROQ fragment (publicationStatus/isVisible coalesce), `GALLERIES_QUERY`/`GALLERY_BY_SLUG_QUERY`, `getGalleries()`/`getGallery(slug)`. Add `Edition`/`EditionImage` interfaces and `getEditions()`/`getEdition(slug)` following the identical shape and ordering-by-`orderRank` convention.
- `src/components/Lightbox.astro` — reuse directly (EDN-03 explicitly requires this). Detail page must pass it the combined `[leadPhoto, ...images]` array per D-06.
- `src/components/GalleryGrid.astro` — content-agnostic grid wrapper; still usable for the detail page's photo-shoot thumbnail grid (D-07), even though the *overview* page is now a list, not a grid (D-01).
- `src/lib/image.ts` — `thumbnailUrl`, `fullSizeUrl`, `responsiveImageSrcSet`, `responsiveThumbnailSrcSet` helpers, reused as-is for both the overview list's `leadPhoto` thumbnails and the detail page's hero/grid images.
- `src/pages/galleries/[slug].astro` (+ `src/pages/en/galleries/[slug].astro`) — the detail-page structure to mirror: `getStaticPaths` fetching all published documents once and passing as props, hero with scrim + title overlay, `structuredData` (schema.org `ImageGallery`) block, `headerVariant="transparent"` on `BaseLayout`. NOTE: does NOT currently have a "back home" link — that was deliberately removed in Phase 10 (see Established Patterns below); do not copy a similar link from an older version of this file.
- `src/pages/sitemap.xml.ts` + `src/lib/static-routes.ts` — existing `galleries/${slug}/` sitemap-entry pattern to extend with `editions/` + `editions/${slug}/` entries (both locales), per ROADMAP success criterion #5.

### Established Patterns
- Bilingual routing: French at root (`src/pages/...`), English under `/en/` (`src/pages/en/...`) — separate near-duplicate files per locale (confirmed convention across `about.astro`/`contact.astro`/`galleries/[slug].astro`), not a single parameterized-locale file.
- `getStaticPaths` fetches the full published-document list once and passes each document as `props`, avoiding a second per-page Sanity fetch at render time.
- A prior "back to home" link on the gallery detail page was removed in Phase 10 after a real overlap bug with `SiteHeader`'s logo (`10-UAT.md` gap, debug session `header-backhome-overlap-logo`) — relevant precedent for positioning the new "Retour aux éditions" link (D-08) safely.
- Phase 8 established a hover-reveal-on-focus pattern for gallery descriptions on the homepage grid (`.home-grid__tile-description` in `HomeCarousel.astro`) — considered during this discussion as a possible Éditions-overview treatment but explicitly NOT chosen (the user picked the vertical editorial list instead, D-01).

### Integration Points
- `src/lib/sanity.ts` — new `Edition`/`EditionImage` interfaces + `getEditions()`/`getEdition(slug)`, alongside the existing `Gallery` exports.
- New route files: `src/pages/editions/index.astro`, `src/pages/en/editions/index.astro` (overview), `src/pages/editions/[slug].astro`, `src/pages/en/editions/[slug].astro` (detail).
- `src/pages/sitemap.xml.ts` — add `getEditions()` to the `Promise.all` fetch and two new path-mapping blocks.

</code_context>

<specifics>
## Specific Ideas

- User's framing for the overview list: photo and text side-by-side, alternating sides row to row (zigzag), full (untruncated) statement text — an explicitly editorial/catalog feel, deliberately different from the homepage's photo-grid browsing experience.
- User confirmed the hero photo (`leadPhoto`) should behave as a real, clickable part of the photo-viewing experience (openable in the Lightbox), not just static decoration — a deliberate departure from how the gallery detail page's hero currently behaves.
- User caught (when asked) that ROADMAP.md's "in a grid" wording was stale relative to the actual decision, and chose to have it corrected in place rather than reverting the layout choice (D-00).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 12's data-fetch/routes scope. No new capabilities were proposed; EDN-08 (gallery↔édition cross-link) and nav wiring (Phase 13) were referenced only as explicit non-goals of this phase, already tracked elsewhere.

</deferred>

---

*Phase: 12-data-fetch-layer-routes*
*Context gathered: 2026-07-22*
