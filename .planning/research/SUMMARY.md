# Project Research Summary

**Project:** Atelier Jacqueline Suzanne — v1.3 "Éditions" Milestone
**Domain:** Non-transactional content showcase added to an existing shipped bilingual Astro + Sanity photography site
**Researched:** 2026-07-22
**Confidence:** HIGH

## Executive Summary

This milestone adds a new "Éditions" showcase section (paper zines/artist books like "Rebut" and "Sillo") to the already-shipped v1 site — one new Sanity document type, one new top-level nav entry, and a paired overview + detail Astro route, all bilingual FR/EN, all self-serve editable by Romane. Critically, this is not new capability: it is a content-type-and-route addition on the exact stack already in production (Astro 7.0.6 static, Sanity Content Lake + Studio, `astro:i18n`), with strong existing precedent to copy from — the `gallery` document schema and `galleries/[slug].astro` detail page are near-verbatim templates. No new dependency, hosting adapter, or compute is required, and the research is unusually high-confidence because it is grounded in direct inspection of this specific codebase rather than generic ecosystem guidance.

The recommended approach is: mirror `gallery.ts`'s richer editorial workflow (not the plainer `exhibition.ts` pattern) for the new `edition` schema — including `publicationStatus`, hidden `orderRank`, and the same image-array-with-alt-and-rights shape — add three named format-detail fields (page count, print run, dimensions) grouped in their own schema object, and build the overview page as a genuinely new route (galleries have no equivalent since the homepage itself is their overview). The detail page has a direct mirror to copy; the overview page requires original design judgment.

The primary risk is not technical difficulty but scope and modeling discipline: (1) commerce concepts (price, stock, "notify me," disabled buy buttons) creeping into what must remain a pure showcase, and (2) modeling `printRun`/`dimensions` as loose free-text or unstructured fields that will need a painful migration when the deferred v1.x shop milestone needs `printRun` as a numeric stock ceiling. Both risks are cheap to avoid now (typed fields, grouped schema, a hard "no commerce language" rule) and expensive to fix later. Secondary risks are process-level rather than architectural: this codebase's per-locale page duplication, an every-page shared-chrome component (`SiteHeader`) fed via explicit named props from two independent call sites, and a manually-maintained sitemap generator all create "looks done but isn't" gaps (missing English route, missing nav wiring on the homepage specifically, missing sitemap entry) that are well-documented failure modes specific to this repo's existing conventions.

## Key Findings

### Recommended Stack

No new stack decision is needed for this milestone — it is additive schema and additive Astro routes on the already-shipped, validated stack. The right framing for planning purposes is "what does the existing stack already give us for free" rather than "what should we choose."

**Core technologies (all unchanged, reused as-is):**
- Astro 7.0.6 (static output) — new `editions/index.astro` + `editions/[slug].astro` route pairs (fr + en), same static-build model as galleries/about/contact
- Sanity Content Lake + Studio — new `edition` document type, modeled directly on `gallery.ts`'s schema shape plus format-detail fields
- `@sanity/image-url` — reused verbatim for lead-photo and full-shoot image rendering, zero code changes
- `astro:i18n` (Astro 7 core) — fr root / en `/en/` routing extends automatically to the new route tree with zero config changes
- `@sanity/orderable-document-list` — reused for Studio drag-reorder of éditions, identical to galleries' `orderRank` pattern

### Expected Features

**Must have (table stakes, P1 — all six are this milestone's explicit scope):**
- Éditions overview page: title + lead photo per édition, grid listing
- Per-édition detail page: full photo shoot (reusing the existing gallery-detail lightbox), short statement, format details (page count, print run, dimensions)
- "Éditions" main-nav entry (nav-only — explicitly not on the homepage)
- Bilingual FR/EN content, using the existing i18n routing
- Self-serve Sanity editing mirroring the `gallery` schema pattern

**Should have (differentiators, P2/P3 — cheap given existing material, non-blocking):**
- Lead with lifestyle/behind-the-scenes photography (hands holding/reading the book) rather than flat product shots — pure curation, no engineering cost
- "Édition de N" scarcity framing as descriptive (not transactional) copy on top of the format-detail fields
- Optional cross-link between an édition and a related Portfolio gallery, via a new Sanity reference field — additive, only if a matching gallery exists

**Defer (explicitly out of scope for this milestone, belongs to the future v1.x shop milestone):**
- Price display, buy/checkout CTA, stock/availability tracking, waitlist/"notify me" signup — all require infrastructure (Stripe, request-time compute, real inventory) this milestone must not pre-build even as placeholders or disabled affordances

### Architecture Approach

Éditions integrates as a second, fully parallel content-fetch module and route tree alongside galleries, not a generalized "content type" abstraction — this codebase consistently favors explicit, typed, per-content-type functions (`getGalleries`/`getGallery` stay separate from a new `getEditions`/`getEdition`, not unified into a generic `getDocuments(type)`). Shared, content-agnostic components (`GalleryGrid.astro`, `Lightbox.astro`, `src/lib/image.ts`) need zero modification since they're typed against `GalleryImage`/`SanityImage`, not against "gallery" as a concept.

**Major components:**
1. `sanity/schemas/edition.ts` (NEW) — sibling document type to `gallery.ts`, not a shared base/subtype; mirrors its richer editorial workflow (`publicationStatus`, hidden `orderRank`, `preview()`) plus a new grouped `format` object (`pageCount`, `printRun`, `dimensions`)
2. `src/lib/sanity.ts` (MODIFIED, additive) — new `Edition` interface, `EDITIONS_QUERY`/`EDITION_BY_SLUG_QUERY`, `getEditions()`/`getEdition(slug)`, parallel to the existing `Gallery` block
3. `src/pages/editions/{index,[slug]}.astro` + `en/` equivalents (NEW) — the detail page mirrors `galleries/[slug].astro` closely; the overview page is genuinely new (galleries have no standalone overview — the homepage itself fills that role)
4. Nav-wiring chain (MODIFIED, additive across 4 files) — `siteSettings.navLabels.editions` → `resolveSiteCopy()` → **both** `BaseLayout.astro` **and** `HomeCarousel.astro` (two independent `<SiteHeader>` call sites) → `SiteHeader.astro`'s two new named props
5. `sitemap.xml.ts` (MODIFIED, additive) — manually maintained URL array must gain Éditions entries or the new section silently ships undiscoverable by search engines

### Critical Pitfalls

1. **Schema modeled so future shop fields don't fit cleanly** — group format fields (`pageCount`, `printRun`, `dimensions`) in their own schema object now, type `printRun` as a number (not free text), so a later `commerce` field group is additive rather than a restructuring. Avoid it.
2. **Commerce scope creep into "no pricing" UI** — no `price`/`stock`/availability language, even conditionally rendered or as Studio field labels, in this milestone's templates or GROQ projections; check every addition against the six explicit v1.3 requirements in PROJECT.md.
3. **Per-locale page duplication drift** — factor shared markup/logic into one component consumed by two thin locale page files, and land both locale directories + both route levels (overview + detail) in the same commit, so a missing English (or French) counterpart is caught in review.
4. **Sitemap/SEO omission** — `sitemap.xml.ts`'s manually maintained path array has no auto-discovery; add Éditions entries in the same change that adds `getEditions()`, or the section builds fine but is invisible to search engines.
5. **Nav integration is 4 files, not 1** — `SiteHeader.astro` takes explicit named props with no data-driven array; wiring "Éditions" correctly means schema + type + `resolveSiteCopy()` + **both** `BaseLayout.astro` and `HomeCarousel.astro` call sites, and skipping the Sanity-editable path (hardcoding the label) creates an inconsistent editorial surface Romane will notice.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Schema & Content Model
**Rationale:** Every later phase (data-fetch layer, routes, nav) depends on the `edition` document shape existing and being seeded with real content; PITFALLS.md flags this as the phase where the single biggest forward-compatibility risk (Pitfall 1) must be resolved before anything downstream is built on top of it.
**Delivers:** `sanity/schemas/edition.ts` (mirroring `gallery.ts`'s richer editorial workflow: `publicationStatus`, hidden `orderRank`, image-array-with-alt-and-rights, grouped `format` object with typed `pageCount`/`printRun`/`dimensions`), registered in `index.ts` and `structure.ts` with a dedicated orderable desk item; `siteSettings.navLabels.editions` field added at the same time so it's ready for nav wiring later; 1-2 real seeded éditions in Studio.
**Addresses:** Self-serve editing feature (P1); format details feature (P1)
**Avoids:** Pitfall 1 (schema not extensible for future shop fields), Pitfall 7 (Studio editorial parity gap vs. `gallery`), Pitfall 8 (raise the "Rebut - Édition"/"Silo - Édition" naming-collision discussion with Romane explicitly here, not as a code decision)

### Phase 2: Data-Fetch Layer & Routes
**Rationale:** The build-time GROQ fetch layer is fully verifiable in isolation before any UI exists (per ARCHITECTURE.md's suggested build order); the detail page has a direct existing mirror (`galleries/[slug].astro`) making it lower-ambiguity than the overview page, which has no gallery precedent and needs original design judgment.
**Delivers:** `Edition` type + `EDITIONS_QUERY`/`EDITION_BY_SLUG_QUERY` + `getEditions()`/`getEdition()` in `src/lib/sanity.ts` (with a unit test mirroring `gallery-query.test.ts`); `src/pages/editions/[slug].astro` + `en/` (detail, mirroring the gallery detail page, reusing `Lightbox`/`GalleryGrid` unchanged, with attention to portrait-oriented book-cover hero framing per PITFALLS.md's UX note); `src/pages/editions/index.astro` + `en/` (overview, new pattern: title + lead photo grid); `sitemap.xml.ts` entries for both routes.
**Uses:** Astro static routing, `astro:i18n`, `@sanity/image-url`
**Implements:** Parallel build-time content-fetch module pattern; both locale directories in the same commit

### Phase 3: Nav Integration
**Rationale:** This is the only part of the feature that touches shared, every-page chrome (`SiteHeader`, rendered from two independent call sites); ARCHITECTURE.md and PITFALLS.md both flag it as safest to land last, once the underlying routes are already built and verified, so a nav link never points at an unready route and any header regression is easy to attribute to this one change.
**Delivers:** `resolveSiteCopy()` extended with `editionsLabel`; `SiteHeader.astro`'s `Props` interface + template extended with `editionsLabel`/`editionsHref`; **both** `BaseLayout.astro` and `HomeCarousel.astro` updated to compute `editionsHref` via `getRelativeLocaleUrl` and pass the new props; mobile-viewport verification of the header at <768px with a 4th nav link, in both `solid`/`transparent` variants and both locales.
**Addresses:** "Éditions" main-nav entry feature (P1)
**Avoids:** Pitfall 5 (nav prop-threading + CMS-editability inconsistency), Pitfall 6 (mobile nav regression from a 4th link), Anti-Pattern 3 in ARCHITECTURE.md (forgetting the homepage's second `<SiteHeader>` call site)

### Phase 4: Verification & UAT
**Rationale:** Several of this milestone's risks are exactly the "looks done but isn't" class (per PITFALLS.md's checklist) that don't surface from a single happy-path check — they need a deliberate, itemized pass.
**Delivers:** `edition-query.test.ts` (unit) and `editions.spec.ts` (e2e) covering: both locales' overview + detail pages render; nav link present and correctly localized on every page including the homepage specifically; sitemap contains Éditions URLs; a negative check (grep the diff for `price`/`stock`/`disponib`/`acheter`/`buy`) confirming no commerce language slipped in; Studio editorial parity (draft/publish + drag-reorder) confirmed by a non-technical-editor-style manual pass; closure of all "Looks Done But Isn't" checklist items from PITFALLS.md.

### Phase Ordering Rationale

- Schema must exist and be seeded before the data-fetch layer can be verified against anything real (an empty content set makes `getStaticPaths` silently produce zero pages, which "looks like success but proves nothing" per ARCHITECTURE.md).
- Routes come before nav wiring specifically because nav is the one part of this feature touching shared chrome used by every existing page — sequencing it last minimizes the blast radius and makes any regression easy to attribute.
- Verification is deliberately its own phase/pass rather than folded into implementation, because this milestone's pitfalls are dominated by omission-class bugs (missing locale, missing sitemap entry, missing nav call site) that don't fail loudly and need an explicit checklist, not incidental testing.

### Research Flags

Phases likely needing deeper research during planning:
- None flagged as needing additional research-phase investigation — this milestone's ARCHITECTURE.md and PITFALLS.md are both HIGH confidence, verified by direct codebase inspection rather than general ecosystem claims, and the build order is already fully specified.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Schema):** Direct mirror of `gallery.ts`, an already-shipped, tested pattern in this repo.
- **Phase 2 (Data-fetch & routes):** Detail page directly mirrors `galleries/[slug].astro`; data-fetch layer directly mirrors `getGalleries`/`getGallery`. Overview page has no direct mirror but is low-complexity (a grid of cards, reusing `GalleryGrid`).
- **Phase 3 (Nav):** Pattern (named props threaded through two call sites) is already fully documented in this repo's own code comments and in ARCHITECTURE.md's Pattern 2.
- **Phase 4 (Verification):** Existing Vitest/Playwright conventions and CI pipeline require no new tooling.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | No new stack decision — direct confirmation that the shipped, production stack already covers this milestone's needs, verified against actual `package.json` files and shipped code |
| Features | MEDIUM | Table-stakes/anti-features for the Éditions addendum are a synthesis (no single canonical source for "indie zine showcase" conventions exists); cross-checked across two independent web queries, and the "no commerce affordance pre-shop" pattern is corroborated by comparable-site observation. The original full-project feature research (shop/checkout/legal) is separately MEDIUM-HIGH but out of scope for this milestone's synthesis. |
| Architecture | HIGH | Based on direct inspection of the actual codebase (schema files, page routes, shared components) — an integration question fully answerable from committed code, not general docs |
| Pitfalls | HIGH (codebase-integration) / LOW (general ecosystem claims, used only as supporting corroboration) | Verified directly against `gallery.ts`, `exhibition.ts`, `structure.ts`, `SiteHeader.astro`, `BaseLayout.astro`, `sanity.ts`, `site-config.ts`, `sitemap.xml.ts`, `galleries/[slug].astro` |

**Overall confidence:** HIGH

### Gaps to Address

- **Naming collision on "Édition":** the migrated content already contains gallery titles "Rebut - Édition" and "Silo - Édition" (unrelated photo-collection naming from the old Myportfolio site) that will sit alongside a new "Éditions" nav section with a different meaning (paper zines/books). This needs an explicit conversation with Romane during Phase 1 (schema/content-model) — not an autonomous naming decision — to confirm whether those gallery titles should be renamed, and should be recorded in PROJECT.md's Key Decisions once resolved.
- **Overview page visual design has no direct precedent:** unlike the detail page, the Éditions overview page is the one genuinely new route pattern in this milestone (galleries never had a standalone overview since the homepage fills that role). Plan for slightly more design/UX judgment time on this one page during Phase 2.
- **Portrait-oriented hero images:** the existing gallery-detail hero treatment is tuned for landscape photography; PITFALLS.md flags that a book/zine cover shot is more likely portrait-oriented and may need `object-position`/crop adjustments — worth a concrete check against real content early in Phase 2, not assumed to transfer as-is.

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection: `sanity/schemas/gallery.ts`, `sanity/schemas/exhibition.ts`, `sanity/schemas/structure.ts`, `sanity/schemas/index.ts`, `src/lib/sanity.ts`, `src/lib/image.ts`, `src/lib/site-config.ts`, `src/components/SiteHeader.astro`, `src/components/GalleryGrid.astro`, `src/components/Lightbox.astro`, `src/components/HomeCarousel.astro`, `src/layouts/BaseLayout.astro`, `src/pages/index.astro`, `src/pages/galleries/[slug].astro`, `src/pages/en/galleries/[slug].astro`, `src/pages/about.astro`, `src/pages/sitemap.xml.ts`, `astro.config.mjs`, `tests/unit/gallery-query.test.ts`, `sanity/package.json`, `package.json`
- `.planning/PROJECT.md` — v1.3 milestone scope, explicit requirements and exclusions
- `CLAUDE.md` (repo root) — documents the already-validated, shipped v1.0 stack and the "Deferred to v1.x" e-commerce boundary

### Secondary (MEDIUM confidence)
- Domain knowledge of indie photobook/zine publishing conventions (Self Publish Be Happy, Indie Photobook Library, Setanta Books) — cross-checked across two independent queries on format/edition-size conventions, raising practical confidence to MEDIUM for format-metadata and "no live commerce affordance pre-shop" findings specifically

### Tertiary (LOW confidence)
- [How to Design Flexible, Scalable Sanity Schemas — Halo Lab](https://www.halo-lab.com/blog/creating-schema-in-sanity) — uncross-checked web search, used only as supporting corroboration
- [Deciding on fields and relationships — Sanity Docs](https://www.sanity.io/docs/developer-guides/deciding-fields-and-relationships) — uncross-checked
- [Easton Dev Blog — Astro i18n Configuration Guide](https://eastondev.com/blog/en/posts/dev/20251202-astro-i18n-guide/) — documents the N-pages-times-M-locales duplication pattern this codebase already exhibits, uncross-checked
- [Kontent.ai — UX design using a headless CMS](https://kontent.ai/resources/ux-design-using-headless-cms/) — uncross-checked

---
*Research completed: 2026-07-22*
*Ready for roadmap: yes*
