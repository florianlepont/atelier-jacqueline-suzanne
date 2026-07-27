# Phase 2: Portfolio Galleries - Context

**Gathered:** 2026-07-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Visitors can browse Romane's photographic work by project/series, view full-size images, and read a short bilingual artist statement per project. Romane can independently add, edit, and reorder galleries and their images through Sanity Studio, without developer help. This phase migrates the known projects from the current live site (Rebut, Silos, Brume, Adults, The Victorian Tea Room, Paysages, Accumulation, MADO, etc.) with real photos and text — it does not include About/Contact content (Phase 3), legal pages (Phase 4), or the production domain cutover (Phase 5).

</domain>

<decisions>
## Implementation Decisions

### Gallery & Image Data Model
- **D-01:** A gallery is a single Sanity document type (`gallery`) with an inline array-of-images field — no separate `galleryImage` document type. Reordering images is handled by Sanity's built-in array drag-to-reorder UI.
- **D-02:** Alt text is a required, bilingual (fr/en) field on every image — enforced via Sanity schema validation, following the same locale-object pattern (`{fr, en}`) established for `siteSettings` in Phase 1.
- **D-03:** No per-image captions. Each gallery has exactly one bilingual artist statement (PORT-03), set at the gallery-document level; individual images carry alt text only.
- **D-04:** Gallery title is a single shared field (not locale-aware) — project names (Rebut, Silos, MADO, etc.) are proper nouns/art titles that stay identical in both locales, matching the `siteTitle` brand-name treatment from Phase 1.

### Full-Size Image Viewing
- **D-05:** Full-size images open in a lightbox overlay on top of the gallery page (not a dedicated per-image route). This needs a small client-side JS island, consistent with the islands-only-where-needed principle already used for the language switcher (`LanguageSwitcher.astro`).
- **D-06:** The lightbox supports prev/next arrow buttons, keyboard arrow-key navigation, and touch swipe on mobile.
- **D-07:** The artist statement is shown only on the gallery page (above/alongside the thumbnail grid), not inside the lightbox. The lightbox stays focused purely on images.

### Gallery Listing & Ordering
- **D-08:** The gallery listing page (index of all projects) displays a grid of cover thumbnails with titles — not a plain text list.
- **D-09:** A gallery's cover image is always its first image in the array (no separate "cover image" field). Reordering images (already supported per D-01) also changes the cover.
- **D-10:** Gallery order on the listing page is controlled by an explicit manual order field (or Sanity's list-level drag-to-reorder) so Romane can feature specific projects first, independent of creation date.

### Content Migration
- **D-11:** Real photos and text are migrated now for all known projects from the current live site (Rebut, Silos, Brume, Adults, The Victorian Tea Room, Paysages, Accumulation, MADO, etc.) — this phase does not ship with placeholder content. Matches PROJECT.md's framing of this as a full replacement, not a partial one.
- **D-12:** Bilingual artist statements are adapted from whatever project descriptions already exist on the current Myportfolio site, rather than written fresh for this phase.
- **D-13:** All known projects are migrated in this phase — no subset-now/rest-later split.
- **D-14:** Image source is Florian's/Romane's own original files (not scraped/downscaled copies from the live site) — original files are expected to be of higher quality than what the current site serves. Sourcing these files is a pre-planning/execution task, not something research or the planner needs to solve.

### Claude's Discretion
None — all discussed areas resulted in explicit user decisions above.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Stack & Architecture Research
- `.planning/research/STACK.md` — Sanity/Astro version details, image pipeline notes (Sharp build-time only, `@sanity/image-url` usage)
- `.planning/research/ARCHITECTURE.md` — suggested `lib/cms/` query-function pattern (`getGalleries`), `galleries/[slug].astro` route naming, lightbox-as-island guidance, and Anti-Pattern 2 (don't commit images to the git repo — pull from Sanity's asset CDN)
- `.planning/research/PITFALLS.md` — Pitfall 4 (free-tier bandwidth blown by unoptimized images — enforce image constraints at CMS/upload layer) and Pitfall 5 (bilingual content drift — Romane must keep fr/en in parity when she edits galleries herself)

### Project-Level Decisions
- `.planning/PROJECT.md` — Key Decisions table (full-replacement framing, OVH static-hosting constraint)
- `.planning/REQUIREMENTS.md` — PORT-01, PORT-02, PORT-03, CMS-01 (this phase's mapped requirements)
- `.planning/ROADMAP.md` — Phase 2 goal, success criteria, dependency on Phase 1

### Prior Phase Context
- `.planning/phases/01-foundation-bilingual-infrastructure/01-CONTEXT.md` — D-09 locale-object pattern (`{fr, en}` fields), which this phase's D-02 alt-text field and image metadata follow

### Existing Code (Phase 1 output)
- `sanity/schemas/siteSettings.ts` — reference implementation of the `localeStringField`/`localeTextField` helper pattern to reuse for the new `gallery` schema
- `src/lib/sanity.ts` — build-time-only Sanity client pattern (`getSiteSettings`); the new gallery query function should follow the same shape
- `src/components/LanguageSwitcher.astro` — existing precedent for a client-side island, relevant to the new lightbox island (D-05)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `localeStringField()` / `localeTextField()` helpers in `sanity/schemas/siteSettings.ts` — reuse directly for gallery title (if needed later), artist statement, and per-image alt text fields.
- `sanityClient` and the `getSiteSettings()` query pattern in `src/lib/sanity.ts` — copy this shape for a new `getGalleries()` / `getGallery(slug)` query function.
- `BaseLayout.astro` and `LanguageSwitcher.astro` — existing layout and island patterns to extend for gallery listing/detail pages and the lightbox.

### Established Patterns
- Locale-object shape `{fr, en}` per field (not per-document duplication) — established in Phase 1, continues here.
- French served at root path, English under `/en/` (no `/fr/` prefix) — gallery routes follow the same `galleries/` and `en/galleries/` structure.
- Sanity singleton pattern (structure.ts pinning a single document ID) does NOT apply to `gallery` — it's a multi-document type, unlike `siteSettings`.

### Integration Points
- New `gallery` schema needs to be registered in `sanity/schemas/index.ts` alongside `siteSettings`.
- Gallery listing/detail pages are new routes under `src/pages/` (and `src/pages/en/`), following the existing `index.astro` / `en/index.astro` split.
- Nav link to the gallery listing page should pull its label from the existing `siteSettings.navLabels` object (extend it with a `galleries` label, matching the existing `home` label pattern).

</code_context>

<specifics>
## Specific Ideas

- Cover image auto-selection (first image = cover) means Romane manages the cover simply by controlling image order — no separate field to explain to her.
- Manual order field for gallery listing lets Romane put newer or more important work first, independent of when a project was added to the CMS.
- Original (non-scraped) image files are expected to be higher quality than what the current live site serves — worth sourcing directly rather than downloading from the live pages.

</specifics>

<deferred>
## Deferred Ideas

None raised outside phase scope — discussion stayed within Portfolio Galleries.

### Reviewed Todos (not folded)
None — no pending todos matched this phase (`todo_count: 0`).

</deferred>

---

*Phase: 2-Portfolio Galleries*
*Context gathered: 2026-07-06*
