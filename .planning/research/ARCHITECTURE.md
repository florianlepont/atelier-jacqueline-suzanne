# Architecture Research

**Domain:** Adding a new bilingual content-showcase feature (Éditions) to an existing Astro 7 static site + Sanity CMS
**Researched:** 2026-07-22
**Confidence:** HIGH — based on direct inspection of the actual codebase (schema files, page routes, shared components), not general ecosystem docs. This is an integration question fully answerable from the code already committed.

## Standard Architecture

### System Overview

```
┌───────────────────────────────────────────────────────────────────┐
│                         Sanity Content Lake                        │
│  siteSettings (singleton)   gallery (doc, existing)                │
│                              edition  (doc, NEW — mirrors gallery)  │
├───────────────────────────────────────────────────────────────────┤
│              build-time only: src/lib/sanity.ts (GROQ)             │
│  getSiteSettings()   getGalleries()/getGallery(slug)                │
│                        getEditions()/getEdition(slug)  ← NEW        │
├───────────────────────────────────────────────────────────────────┤
│              build-time only: src/lib/image.ts (@sanity/image-url) │
│  thumbnailUrl() / fullSizeUrl() / blurPlaceholderUrl()              │
│  (content-agnostic — reused as-is by galleries AND editions)        │
├───────────────────────────────────────────────────────────────────┤
│                     Astro pages (output: 'static')                  │
│  /            (fr, homepage = gallery overview + carousel/grid)     │
│  /galleries/[slug]        /en/galleries/[slug]     (gallery detail) │
│  /editions/               /en/editions/            (NEW overview)  │
│  /editions/[slug]         /en/editions/[slug]      (NEW detail)    │
├───────────────────────────────────────────────────────────────────┤
│         Shared chrome: BaseLayout.astro → SiteHeader.astro          │
│         (also rendered a 2nd time, directly, by HomeCarousel.astro) │
└───────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|-------------------------|
| `sanity/schemas/edition.ts` (NEW) | Defines the `edition` document type in Studio | Standalone `defineType`, structurally parallel to `sanity/schemas/gallery.ts` but with format-detail fields added and homepage-only fields removed |
| `sanity/schemas/index.ts` (MODIFIED, additive) | Registers all schema types with Studio | Add one import + one array entry |
| `sanity/schemas/structure.ts` (MODIFIED, additive) | Custom desk (left-nav) ordering in Studio | Add one `orderableDocumentListDeskItem` call, add `'edition'` to the exclusion filter |
| `src/lib/sanity.ts` (MODIFIED, additive) | Build-time GROQ fetch + typed interfaces | Add `Edition` interface + `EDITIONS_QUERY`/`EDITION_BY_SLUG_QUERY` + `getEditions()`/`getEdition()`, parallel to the existing `Gallery`/`getGalleries()`/`getGallery()` |
| `src/lib/image.ts` (UNCHANGED) | Build-time Sanity CDN URL builder | Already content-agnostic (`GalleryImage`/`SanityImage` typed) — reused verbatim, zero edits |
| `src/components/GalleryGrid.astro` (UNCHANGED) | Presentational grid wrapper | Already documented as content-agnostic in its own header comment — reused verbatim for the Éditions overview grid and detail thumbnail grid |
| `src/components/Lightbox.astro` (UNCHANGED) | Full-screen photo viewer | Props are typed `images: GalleryImage[]`; since édition images share the identical `image` array shape, this is reused verbatim with zero edits |
| `src/pages/editions/index.astro` + `en/` (NEW) | Éditions overview route | New route TYPE — unlike galleries (whose "overview" is the homepage itself), Éditions has no homepage presence, so this is a genuinely new standalone listing page, not a reuse of an existing pattern |
| `src/pages/editions/[slug].astro` + `en/` (NEW) | Éditions detail route | Near-verbatim structural mirror of `src/pages/galleries/[slug].astro`, plus a new "format details" block |
| `sanity/schemas/siteSettings.ts` (MODIFIED, additive) | Site-wide nav labels singleton | Add one `editions` field to the existing `navLabels` object (do not repurpose the pre-existing hidden, unused `navLabels.galleries` field — it's a stale leftover from before the homepage-as-overview decision and is semantically unrelated) |
| `src/lib/site-config.ts` (MODIFIED, additive) | Resolves CMS nav copy with fallbacks | Add `editionsLabel` resolution to `resolveSiteCopy()`, mirroring `aboutLabel`/`contactLabel` |
| `src/components/SiteHeader.astro` (MODIFIED, additive) | Shared header/nav markup, used site-wide | Add 2 new props (`editionsLabel`, `editionsHref`) + one new `<a class="nav-link">` in the existing `<nav class="site-nav">` block |
| `src/layouts/BaseLayout.astro` (MODIFIED, additive) | Computes nav hrefs/labels, calls `<SiteHeader>` | Add `editionsHref = getRelativeLocaleUrl(locale, 'editions')` + pass through the 2 new props |
| `src/components/HomeCarousel.astro` (MODIFIED, additive) | Homepage's OWN separate call site for `<SiteHeader>` | Same 2 props must be added here too — this is a second, independent call site (see Integration Points below), easy to forget |

## Recommended Project Structure

```
sanity/
├── schemas/
│   ├── gallery.ts          # existing — DO NOT MODIFY
│   ├── edition.ts          # NEW — sibling schema, not a subtype of gallery
│   ├── siteSettings.ts     # MODIFIED — add navLabels.editions field
│   ├── structure.ts        # MODIFIED — add edition desk list item
│   └── index.ts            # MODIFIED — register edition schema
src/
├── lib/
│   ├── sanity.ts           # MODIFIED — add Edition type + queries + fetchers
│   ├── image.ts            # unchanged — already reusable
│   └── site-config.ts      # MODIFIED — add editionsLabel resolution
├── components/
│   ├── GalleryGrid.astro   # unchanged — already content-agnostic, reused
│   ├── Lightbox.astro      # unchanged — already content-agnostic, reused
│   └── SiteHeader.astro    # MODIFIED — add editions nav-link + 2 props
├── layouts/
│   └── BaseLayout.astro    # MODIFIED — compute + pass editionsHref/Label
├── pages/
│   ├── galleries/[slug].astro       # existing — DO NOT MODIFY
│   ├── en/galleries/[slug].astro    # existing — DO NOT MODIFY
│   ├── editions/
│   │   ├── index.astro     # NEW — overview (no gallery precedent to mirror)
│   │   └── [slug].astro    # NEW — detail, mirrors galleries/[slug].astro
│   └── en/editions/
│       ├── index.astro     # NEW
│       └── [slug].astro    # NEW
tests/
├── unit/
│   ├── gallery-query.test.ts    # existing precedent
│   └── edition-query.test.ts    # NEW — mirror its structure exactly
└── e2e/
    ├── gallery.spec.ts          # existing precedent
    └── editions.spec.ts         # NEW — mirror its structure exactly
```

### Structure Rationale

- **`sanity/schemas/edition.ts` as a sibling, not a shared base type:** Sanity's `defineType` has no built-in inheritance/mixin mechanism for document types. The codebase's own established convention (see `gallery.ts`'s comment: *"copied verbatim from siteSettings.ts's `localeTextField` helper — no shared schema-lib module exists yet... see 02-PATTERNS.md's guidance to duplicate the shape inline"*) is to duplicate small field-builder functions per schema file rather than factor out a shared library module. Following that precedent for `edition.ts` keeps this milestone's diff scoped to new files plus small additive edits, and — critically — means `gallery.ts` is never touched, so there is zero risk of regressing the shipped, tested Portfolio feature. A shared-fields extraction (e.g. a `sanity/schemas/lib/` module) is a reasonable future refactor once a *third* content type needs the same image-array-with-alt-and-rights block, but doing it now would require also editing `gallery.ts`, which this milestone should avoid.
- **`src/pages/editions/index.astro` is genuinely new, not a mirror:** Galleries do not have a dedicated overview *page* today — `src/pages/index.astro` (the homepage) IS the gallery overview (carousel/grid of `showOnHomePage`-flagged galleries). Since the milestone explicitly keeps Éditions off the homepage carousel/grid, Éditions needs its own first-of-its-kind standalone listing route. Don't assume "mirror the gallery pattern" covers the overview page — only the *detail* page (`[slug].astro`) has a direct existing precedent to copy.
- **`src/lib/image.ts` and `Lightbox.astro` need zero changes:** Both are already typed against `GalleryImage`/`SanityImage`, not against "gallery" as a concept. As long as `edition.images[]` reuses the identical Sanity `image` array-member shape (asset + hotspot + `alt{fr,en}` + `rights`), the édition images can be typed as `GalleryImage[]` directly (no new `EditionImage` type needed) and passed straight into `thumbnailUrl()`, `fullSizeUrl()`, `blurPlaceholderUrl()`, and `<Lightbox images={edition.images} locale={locale} />` with no modification.

## Architectural Patterns

### Pattern 1: Parallel build-time content-fetch module (not a generic "content type" abstraction)

**What:** Add a second, fully parallel set of exports to `src/lib/sanity.ts` — `Edition` interface, `EDITIONS_QUERY`, `EDITION_BY_SLUG_QUERY`, `getEditions()`, `getEdition(slug)` — rather than generalizing `getGalleries`/`getGallery` into a generic `getDocuments(type)` helper.
**When to use:** When the two content types diverge in shape (édition adds `pageCount`/`printRun`/`dimensions`, omits `showOnHomePage`/`heroColor`) and the codebase already favors explicit, typed, per-content-type functions over generic abstractions (see how `getAboutPage`/`getHomePage`/`getContactPage` are also each separate, not unified).
**Trade-offs:** Some duplication of the GROQ projection boilerplate, but each query stays simple, individually testable (mirroring `tests/unit/gallery-query.test.ts`), and immune to one content type's schema change accidentally breaking another's fetch.

**Example:**
```typescript
// src/lib/sanity.ts — additive, alongside the existing Gallery block
export interface Edition {
  title: string
  slug: string
  statement: LocaleString
  pageCount?: number
  printRun?: string
  dimensions?: string
  publicationStatus?: 'preparation' | 'published' | 'archived'
  seo?: SeoSettings
  images: GalleryImage[] // identical shape — reused type, not duplicated
}

const PUBLISHED_EDITION_FILTER = /* groq */ `coalesce(publicationStatus, "published") == "published"`

const EDITIONS_QUERY = /* groq */ `*[_type == "edition" && ${PUBLISHED_EDITION_FILTER}] | order(orderRank) {
  title, "slug": slug.current, statement, pageCount, printRun, dimensions, publicationStatus, seo, images
}`

export async function getEditions(): Promise<Edition[]> {
  return (await sanityClient.fetch<Edition[] | null>(EDITIONS_QUERY)) ?? []
}
```

### Pattern 2: Additive named-prop threading through shared chrome (not a generic nav-items array)

**What:** `<SiteHeader>` takes individually named props (`aboutLabel`/`aboutHref`, `contactLabel`/`contactHref`, …) rather than a generic `navItems: {label, href}[]` array. Adding Éditions to the nav means adding two more individually named props (`editionsLabel`/`editionsHref`), not refactoring the component into a generic nav-array — that would be a much larger, riskier change to a component every single page depends on.
**When to use:** Any time a fixed, small, known set of top-level nav items needs a new entry — as here.
**Trade-offs:** Every future top-level nav addition repeats this same 2-prop pattern across every call site; that's an acceptable, low-risk cost at this project's scale (2 call sites today) versus the blast radius of restructuring a component with zero test regressions allowed.

**Example:**
```astro
---
// SiteHeader.astro interface — additive
interface Props {
  /* ...existing props... */
  editionsLabel: string;
  editionsHref: string;
}
const { /* ...existing... */, editionsLabel, editionsHref } = Astro.props;
---
<nav class="site-nav" aria-label="Primary">
  <a href={editionsHref} class="nav-link">{editionsLabel}</a>
  <a href={aboutHref} class="nav-link">{aboutLabel}</a>
  <a href={contactHref} class="nav-link">{contactLabel}</a>
  <!-- ...instagram link unchanged... -->
</nav>
```

### Pattern 3: `astro:i18n`'s directory-based routing needs zero new config

**What:** `astro.config.mjs`'s `i18n` block (fr at `/`, en under `/en/`, no auto-redirect) is purely a routing convention keyed off directory structure under `src/pages/`. Creating `src/pages/editions/` and `src/pages/en/editions/` automatically produces correctly-localized URLs with no config change, exactly like `about.astro`/`en/about.astro` do today. `getRelativeLocaleUrl(locale, 'editions')` (already used for `about`/`contact`) is the only API needed to generate the href.
**When to use:** Any new top-level section on this site.
**Trade-offs:** None — this is the entire payoff of the existing i18n setup; it's the one integration point that requires no thought at all.

## Data Flow

### Request Flow (build-time, not request-time — this is a static site)

```
Sanity Studio (Romane edits/publishes an `edition` document)
    ↓ (webhook: Sanity publish → repository_dispatch → GitHub Actions)
GitHub Actions CI build
    ↓
getEditions() / getEdition(slug)  — src/lib/sanity.ts, GROQ, published perspective only
    ↓
Astro getStaticPaths() in editions/[slug].astro — one static HTML page per édition
    ↓
thumbnailUrl()/fullSizeUrl()/blurPlaceholderUrl() — src/lib/image.ts, Sanity CDN transform URLs baked into HTML
    ↓
Static HTML/CSS output — deployed to GitHub Pages (staging) / OVH SFTP (production)
    ↓
Visitor's browser — zero request-time compute, images served from Sanity's CDN
```

### Key Data Flows

1. **Overview page:** `getEditions()` → filter nothing further needed (query already filters to `published`) → map each to `{slug, title, coverSrc: thumbnailUrl(images[0]), alt}` → render as a grid of `<a>` cards via `<GalleryGrid>`, exactly mirroring how `index.astro` (homepage) maps galleries into cards today.
2. **Detail page:** `getStaticPaths` calls `getEditions()` once, passes the matching `Edition` as `props` (same "fetch once in getStaticPaths, no second per-page fetch" pattern documented in `galleries/[slug].astro`'s own header comment) → hero cover image + statement + new format-details block (pageCount/printRun/dimensions, locale-conditional hardcoded labels like the About page's own hardcoded chrome copy) → remaining images rendered as `<GalleryGrid>` thumbnails wired to `<Lightbox images={edition.images} locale={locale} />`.
3. **Nav label flow:** `siteSettings.navLabels.editions.{fr,en}` (Studio-editable) → `getSiteSettings()` → `resolveSiteCopy()` in `site-config.ts` (with a hardcoded fallback, same as `aboutLabel`/`contactLabel`) → `BaseLayout.astro` AND `HomeCarousel.astro` (both independently) → `<SiteHeader editionsLabel=... editionsHref=... />`.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| A handful of éditions (realistic ceiling for this project) | Current plan (fetch-all, static-generate-all) is correct and sufficient — no pagination, no incremental builds needed |
| Dozens of éditions | Still fine — Astro's static build time scales linearly with page count; a single-artist catalog will never approach a build-time problem |
| N/A — this is a static personal-artist site, not a scaling target | Do not add complexity (ISR, on-demand rendering, pagination) speculatively; it directly conflicts with the project's static-only OVH hosting constraint |

### Scaling Priorities

1. **Not applicable at this project's scale.** The only real "scale" concern is Romane's own editing effort in Studio, which the drag-orderable list (`orderRank`, same as galleries) already solves.

## Anti-Patterns

### Anti-Pattern 1: Making `edition` a "gallery with a type flag"

**What people do:** Add a `kind: 'gallery' | 'edition'` field to the existing `gallery` document type and branch logic in queries/components instead of creating a new document type.
**Why it's wrong:** It conflates two content types with genuinely different field sets (format details vs. `showOnHomePage`/`heroColor`) into one schema, forces every gallery query to add a type filter it didn't need before, and risks the one thing this milestone must avoid — touching/regressing the shipped, tested Portfolio (gallery) feature.
**Do this instead:** A separate `edition` document type, as planned above. Sanity's Studio and GROQ are built around multiple distinct `_type`s coexisting cleanly; that's the idiomatic pattern here, not a shared polymorphic type.

### Anti-Pattern 2: Refactoring `SiteHeader` into a generic nav-array before it's needed

**What people do:** See "we're adding a 3rd nav item" as the trigger to generalize `SiteHeader`'s props into `navItems: {label, href}[]`.
**Why it's wrong:** `SiteHeader` is rendered from two independent call sites (`BaseLayout.astro` and `HomeCarousel.astro`) with subtly different surrounding context (the homepage additionally uses the named `extra` slot for its carousel/grid toggle, and re-skins the transparent variant's CSS extensively via `:global()` selectors keyed to the exact current markup). A generic refactor here is exactly the kind of change most likely to introduce a visual regression on the highest-traffic page (the homepage) for a benefit (avoiding one more named prop pair) that doesn't materialize until a 4th or 5th nav item is added.
**Do this instead:** Add `editionsLabel`/`editionsHref` as two more named props, same shape as `aboutLabel`/`aboutHref`. Defer any generalization to a future milestone if/when the nav grows enough to justify the refactor risk.

### Anti-Pattern 3: Forgetting the second `<SiteHeader>` call site

**What people do:** Update `BaseLayout.astro` (used by About/Contact/gallery-detail/mentions-légales/confidentialité/Éditions itself) and assume every page is covered.
**Why it's wrong:** The homepage does NOT go through `BaseLayout`'s `<SiteHeader>` render — it renders `BaseLayout` with `headerVariant="none"` and instead renders `<SiteHeader>` a second time, directly, from inside `HomeCarousel.astro`, so it can inject its mode-toggle button into the `extra` slot. If only `BaseLayout.astro` is updated, the Éditions nav link will correctly appear on About/Contact/gallery pages/Éditions pages themselves, but silently be missing from the homepage header — the single highest-visibility page on the site.
**Do this instead:** Grep for `SiteHeader` call sites (`src/layouts/BaseLayout.astro`, `src/components/HomeCarousel.astro`) before considering the nav-wiring step done, and update both in the same commit/plan step.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Sanity Content Lake | New `edition` document type, fetched at build time via `@sanity/client`, `perspective: 'published'` | No new client/config needed — reuses the existing `sanityClient` singleton in `src/lib/sanity.ts` |
| Sanity Image CDN | `@sanity/image-url` builder in `src/lib/image.ts` | Zero changes — édition images use the exact same `image` array-member shape as gallery images, so the existing `thumbnailUrl`/`fullSizeUrl`/`blurPlaceholderUrl` helpers apply unmodified |
| GitHub Actions (CI/CD) | Existing pipeline already runs Vitest + Playwright as blocking gates before deploy, and is already triggered by the Sanity publish webhook (`repository_dispatch`) | No pipeline changes needed — new unit/e2e test files are picked up automatically by the existing `npm run test:unit` / `test:e2e` scripts |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `sanity/schemas/edition.ts` ↔ `sanity/schemas/index.ts` / `structure.ts` | Direct import + array/desk-item registration | Purely additive edits to both files; existing `gallery`/other entries untouched |
| `src/lib/sanity.ts` (new `Edition` exports) ↔ Astro pages | Typed function calls (`getEditions()`, `getEdition(slug)`) at build time only, in frontmatter | Never imported into client-side `<script>` — same guardrail comment already documented at the top of `sanity.ts` applies unchanged |
| `src/pages/editions/*` ↔ `GalleryGrid.astro` / `Lightbox.astro` | Astro component props (`images`, `locale`) | Both components are already content-agnostic — no edits, no new "EditionGrid"/"EditionLightbox" components needed |
| `siteSettings.navLabels.editions` ↔ `site-config.ts` ↔ `BaseLayout.astro` / `HomeCarousel.astro` ↔ `SiteHeader.astro` | Chain of build-time prop-threading, no shared/global nav-config module exists | Because there's no central "nav registry," the Éditions label/href must be independently wired through `resolveSiteCopy()`, then through BOTH `BaseLayout.astro` and `HomeCarousel.astro`, then into `SiteHeader.astro`'s new props — four files touched for one nav entry, by design of the existing (non-generic) pattern |

## Suggested Build Order

1. **Sanity schema first** (`edition.ts`, register in `index.ts`/`structure.ts`). Seed 1-2 real documents in Studio immediately after, so every later step has real content to fetch and render against — an empty content set means `getStaticPaths` silently produces zero pages, which looks like success but proves nothing.
2. **`src/lib/sanity.ts` additions** (`Edition` type, queries, `getEditions`/`getEdition`) + a unit test mirroring `tests/unit/gallery-query.test.ts`. This is fully verifiable in isolation, before any UI exists.
3. **Astro routes**: detail page first (`editions/[slug].astro` + `en/` — has a direct existing mirror to copy from `galleries/[slug].astro`, lower ambiguity), then the overview page (`editions/index.astro` + `en/` — no direct precedent, more design judgment required: grid of title+lead-photo cards, reusing `GalleryGrid` + `thumbnailUrl`).
4. **`siteSettings.ts`**: add the `navLabels.editions` field (small, additive, isolated schema edit) — do this now so the label is CMS-editable before wiring the nav link that displays it.
5. **`site-config.ts`**: add `editionsLabel` to `resolveSiteCopy()`.
6. **Nav wiring last**: `SiteHeader.astro` (new props + link), then BOTH `BaseLayout.astro` and `HomeCarousel.astro` (compute `editionsHref` via `getRelativeLocaleUrl`, pass the two new props). Land this last and in one step, because it's the only part of this feature that touches shared, every-page chrome — safest to add once the underlying routes are already built and verified working in isolation, so a nav link never points at a route that isn't ready, and so any header regression is easy to attribute to this one specific change.
7. **Tests/verification pass**: `edition-query.test.ts` (unit), `editions.spec.ts` (e2e: overview lists éditions, detail page renders format details + photos + lightbox, nav link present and correctly localized on every page including the homepage specifically — see Anti-Pattern 3).

No `astro.config.mjs` / `astro:i18n` config changes are needed anywhere in this sequence (Pattern 3) — directory placement under `src/pages/editions/` and `src/pages/en/editions/` is sufficient.

## Sources

- Direct inspection of this repository's own source: `sanity/schemas/gallery.ts`, `sanity/schemas/exhibition.ts`, `sanity/schemas/siteSettings.ts`, `sanity/schemas/structure.ts`, `sanity/schemas/index.ts`, `src/lib/sanity.ts`, `src/lib/image.ts`, `src/lib/site-config.ts`, `src/components/SiteHeader.astro`, `src/components/GalleryGrid.astro`, `src/components/Lightbox.astro`, `src/components/HomeCarousel.astro`, `src/layouts/BaseLayout.astro`, `src/pages/index.astro`, `src/pages/galleries/[slug].astro`, `src/pages/en/galleries/[slug].astro`, `src/pages/about.astro`, `astro.config.mjs`, `tests/unit/gallery-query.test.ts`.
- `.planning/PROJECT.md` (milestone v1.3 Éditions scope and constraints).

---
*Architecture research for: Éditions feature integration into an existing Astro + Sanity bilingual photography site*
*Researched: 2026-07-22*
