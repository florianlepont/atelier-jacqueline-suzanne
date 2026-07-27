# Phase 12: Data-Fetch Layer & Routes - Research

**Researched:** 2026-07-22
**Domain:** Astro 7 static-site build-time GROQ data-fetch layer + bilingual page routes (mirroring an existing, working pattern in this same codebase)
**Confidence:** HIGH

## Summary

This phase has no external unknowns — it is a same-repo, pattern-mirroring exercise. The `gallery` data-fetch/route pattern this phase must mirror (`src/lib/sanity.ts`, `src/pages/galleries/[slug].astro` + its `/en/` twin, `src/components/Lightbox.astro`, `src/lib/image.ts`, `src/pages/sitemap.xml.ts` + `src/lib/static-routes.ts`) was read directly from disk during this research session, along with the actual Phase-11-committed `sanity/schemas/edition.ts`. Every field name CONTEXT.md claims (`leadPhoto`, `images`, `statement`, `pageCount`, `printRun`, `dimensions{width,height,unit}`, `title`, `slug`, `orderRank`, `publicationStatus`) is confirmed present and correctly typed. No new npm packages are required — the phase only adds new exports to `src/lib/sanity.ts`, new `.astro` route files, and an extension to the existing sitemap generator, all using dependencies already installed (`astro` 7.0.6, `@sanity/client` 7.23.0, `@sanity/image-url` 2.1.1).

Three load-bearing structural differences from the gallery pattern were discovered that a naive "copy gallery, rename to edition" plan would get wrong: (1) `edition` has **no `isVisible` field** — the gallery publication filter's `coalesce(publicationStatus, select(isVisible == false => ...))` fallback logic does not apply; edition's filter is the simpler `publicationStatus == "published"`. (2) `edition` has **no `seo` field/group at all** (CONTEXT.md's own quoted comment in the schema confirms this was an explicit Phase-11 discretion call) — any code that reads `edition.seo?.title` will silently always be `undefined`, unlike the gallery detail page which does exactly that. (3) The Lightbox index math is inverted from gallery's: gallery's grid skips `images[0]` (already the hero) via `.slice(1)` with `index = i + 1`; edition's grid must NOT skip anything (`leadPhoto` lives in a separate field, not inside `images[]`) but must still offset `data-index` by `+1` because the combined Lightbox array is `[leadPhoto, ...images]`, so `images[0]` is Lightbox index 1, not 0.

**Primary recommendation:** Build `getEditions()`/`getEdition(slug)` in `src/lib/sanity.ts` as structural near-duplicates of `getGalleries()`/`getGallery()`, but with the corrected (simpler) publication filter and no `seo` projection; build the 4 new route files (`editions/index.astro` + `en/editions/index.astro` + `editions/[slug].astro` + `en/editions/[slug].astro`) reusing `Lightbox`, `GalleryGrid`, and `src/lib/image.ts` as-is; extend `sitemap.xml.ts`/`static-routes.ts` by adding `getEditions()` to the existing `Promise.all` and two new path-mapping blocks, exactly as CONTEXT.md's Claude's-Discretion note already specifies.

## Architectural Responsibility Map

This project has no request-time server tier — `output: 'static'` with no Astro adapter installed (OVH Web Hosting is a zero-compute Apache file host, per CLAUDE.md). `src/pages/sitemap.xml.ts` is an Astro "endpoint," but under `output: 'static'` it still executes once at **build time** and is emitted as a static `sitemap.xml` file, not served per-request — so it belongs in the Build-time tier below, not a Frontend-Server/SSR tier.

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Édition GROQ fetch (`getEditions`/`getEdition`) | Build-time (Astro frontmatter, `src/lib/sanity.ts`) | — | Runs only during `astro build`; the read token never reaches the browser (per `sanity.ts`'s own file-level warning) |
| Overview page render (vertical editorial list) | Build-time (SSG page template) | Browser/Client (responsive CSS breakpoint collapse) | Static HTML at build; only the layout collapse behavior is a client (CSS-only, no JS) concern |
| Detail page render (hero + statement + format + grid) | Build-time (SSG page template, `getStaticPaths`) | Browser/Client (Lightbox trigger clicks) | Mirrors `galleries/[slug].astro`: full document fetched once in `getStaticPaths`, passed as `props`, zero per-page fetch |
| Photo-shoot Lightbox viewing | Browser/Client (`Lightbox.astro`'s vanilla-JS island) | Build-time (slide data embedded as a hidden `<ul>` at build time) | `Lightbox.astro`'s script never imports build-time modules; data crosses the boundary via `data-*` attributes |
| Sitemap/robots inclusion | Build-time (`sitemap.xml.ts`, still build-time under `output: 'static'`) | CDN/Static (served as a static file post-build) | No per-request compute; the XML is generated once and uploaded like any other static asset |
| Bilingual routing (fr root / en prefix) | Build-time (separate near-duplicate `.astro` files per locale + `astro:i18n` config) | — | Confirmed convention: no single parameterized-locale file exists anywhere in the codebase |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `astro` | 7.0.6 [VERIFIED: package.json] | Static site framework — `getStaticPaths`, `output: 'static'` build | Already the whole site's framework; no alternative considered |
| `@sanity/client` | 7.23.0 [VERIFIED: package.json] | Build-time GROQ fetch (`sanityClient.fetch`) | Already wraps the project's single Sanity dataset connection in `src/lib/sanity.ts` |
| `@sanity/image-url` | 2.1.1 [VERIFIED: package.json] | Build-time CDN image URL construction | Already wrapped by `src/lib/image.ts`'s `thumbnailUrl`/`fullSizeUrl`/srcset helpers |

### Supporting
No new supporting libraries. This phase is additive-only against the existing `src/lib/sanity.ts`, `src/lib/image.ts`, `src/components/Lightbox.astro`, `src/components/GalleryGrid.astro`, and `src/lib/static-routes.ts` modules — all already installed and in production use.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Mirroring `sanity.ts`'s per-document-type query constants | A generic/parameterized query builder | Rejected implicitly by the existing codebase convention (each document type gets its own hand-written GROQ constant); introducing an abstraction here for a single new type would be inconsistent with 02-PATTERNS.md's stated "duplicate the shape inline" philosophy already followed in `sanity/schemas/edition.ts`'s `localeTextField` comment |
| `GalleryGrid.astro` for the *overview* list | A new `EditionList.astro` presentational wrapper | D-01 makes the overview a vertical editorial list, not a grid — `GalleryGrid`'s CSS Grid layout is wrong for this; `GalleryGrid` remains correct for the *detail* page's photo-shoot thumbnails (D-07), which are still card-shaped |

**Installation:**
No installation needed — zero new dependencies.

**Version verification:** Not applicable — no new packages. All three libraries above are already pinned and installed in `package.json`, confirmed via direct file read this session.

## Package Legitimacy Audit

**Not applicable.** This phase installs no external packages. It only adds new exports to an existing module (`src/lib/sanity.ts`), new `.astro` route files, and extends an existing sitemap generator — all using dependencies already present in `package.json` and already running in production.

**Packages removed due to [SLOP] verdict:** none (no packages evaluated — none proposed).
**Packages flagged as suspicious [SUS]:** none.

## Architecture Patterns

### System Architecture Diagram

```
Sanity Content Lake (published edition documents)
        │  GROQ fetch, build-time only, perspective:'published'
        ▼
src/lib/sanity.ts
  getEditions()  ─── order(orderRank), publicationStatus == "published"
  getEdition(slug) ── slug.current == $slug (parameterized, no injection)
        │
        ├──► src/pages/editions/index.astro ─┐
        │    src/pages/en/editions/index.astro┘  (getEditions() → vertical list)
        │
        └──► getStaticPaths() in:
             src/pages/editions/[slug].astro ─┐
             src/pages/en/editions/[slug].astro┘ (getEdition per slug, passed as props)
                    │
                    ├─ hero: leadPhoto (clickable, data-gallery-thumb data-index="0")
                    ├─ statement text
                    ├─ format details (pageCount · printRun · dimensions)
                    ├─ GalleryGrid of images[] thumbnails (data-index = i+1)
                    │        │
                    │        ▼
                    └──► <Lightbox images={[leadPhoto, ...edition.images]} locale={locale} />
                              (vanilla-JS <dialog> island, client-side only)

src/pages/sitemap.xml.ts (build-time endpoint, output:'static')
  Promise.all([...existing fetches, getEditions()])
    → localizedSitemapPaths([...existing, editions/, editions/${slug}/ per locale])
    → buildSitemapXml() → dist/sitemap.xml (served as a static file, no request-time compute)
```

A reader can trace: Sanity → `getEditions`/`getEdition` → the four new route files → `Lightbox`, and separately → `sitemap.xml.ts` → the deployed static sitemap.

### Recommended Project Structure
```
src/
├── lib/
│   └── sanity.ts              # + Edition, EditionImage interfaces; + getEditions(), getEdition()
├── pages/
│   ├── editions/
│   │   ├── index.astro        # FR overview (vertical editorial list, zigzag)
│   │   └── [slug].astro       # FR detail (hero + statement + format + grid + Lightbox)
│   ├── en/
│   │   └── editions/
│   │       ├── index.astro    # EN overview
│   │       └── [slug].astro   # EN detail
│   └── sitemap.xml.ts         # + getEditions() in Promise.all, + 2 path-mapping blocks
```

### Pattern 1: Build-time GROQ data-fetch module extension
**What:** Add `Edition`/`EditionImage` TypeScript interfaces and `getEditions()`/`getEdition(slug)` async functions to `src/lib/sanity.ts`, following the exact shape of `Gallery`/`GalleryImage`/`getGalleries()`/`getGallery()` in the same file.
**When to use:** Any new Sanity document type this project fetches at build time.
**Example (verified against the real file, `src/lib/sanity.ts`):**
```typescript
// Source: src/lib/sanity.ts (existing Gallery pattern, read this session)
export interface GalleryImage extends SanityImage {
  alt: LocaleString
  rights?: { credit?: string; copyrightNotice?: string; year?: number;
    usage?: 'allRightsReserved' | 'editorialOnly' | 'licensed' | 'publicDomain';
    licenseDetails?: string; displayCredit?: boolean }
}

// EditionImage's fields are structurally IDENTICAL to GalleryImage (both
// have alt: LocaleString + the same rights shape) — sanity/schemas/edition.ts's
// leadPhoto and images[] members declare the exact same alt/rights sub-fields
// as gallery.ts. A type alias is sufficient; no new interface fields needed:
export type EditionImage = GalleryImage

export interface Edition {
  title: string            // plain string, shared across locales — confirmed in edition.ts (D-08)
  slug: string
  statement: LocaleString  // confirmed required fr/en via localeTextField
  leadPhoto: EditionImage  // confirmed: image type w/ alt + rights sub-fields, required + assetRequired
  images: EditionImage[]   // confirmed: array of image w/ alt + rights, required non-empty
  pageCount: number        // confirmed: required integer positive
  printRun: number         // confirmed: required integer positive
  dimensions: { width: number; height: number; unit: 'cm' | 'in' } // confirmed
  publicationStatus?: 'preparation' | 'published' | 'archived'
  // NOTE: edition has NO `seo` field/group (confirmed — Phase 11 explicitly
  // omitted it). Do not add `seo?: SeoSettings` here; any code path that
  // would read it must fall back to constructing title/description from
  // `title`/`statement` instead, unlike the gallery detail page.
}

// CORRECTED filter — edition has no `isVisible` field, so the gallery's
// coalesce/select fallback does not apply:
const PUBLISHED_EDITION_FILTER = /* groq */ `publicationStatus == "published"`

const EDITIONS_QUERY = /* groq */ `*[_type == "edition" && ${PUBLISHED_EDITION_FILTER}] | order(orderRank) {
  title, "slug": slug.current, statement, leadPhoto, images, pageCount, printRun, dimensions, publicationStatus
}`

const EDITION_BY_SLUG_QUERY = /* groq */ `*[_type == "edition" && slug.current == $slug && ${PUBLISHED_EDITION_FILTER}][0]{
  title, "slug": slug.current, statement, leadPhoto, images, pageCount, printRun, dimensions, publicationStatus
}`

export async function getEditions(): Promise<Edition[]> {
  return (await sanityClient.fetch<Edition[] | null>(EDITIONS_QUERY)) ?? []
}

export async function getEdition(slug: string): Promise<Edition | null> {
  const result = await sanityClient.fetch<Edition | null>(EDITION_BY_SLUG_QUERY, {slug})
  return result ?? null
}
```

### Pattern 2: `getStaticPaths` fetch-once-pass-as-props (detail routes)
**What:** Fetch the full published list once in `getStaticPaths`, map to `{params, props}`, never re-fetch per page.
**When to use:** Every detail route in this codebase already does this (`galleries/[slug].astro`) — mandatory to mirror.
**Example:**
```typescript
// Source: src/pages/galleries/[slug].astro (read this session) — mirror verbatim, swap Gallery→Edition
export const getStaticPaths = (async () => {
  const editions = await getEditions();
  return editions.map((edition) => ({
    params: { slug: edition.slug },
    props: { edition },
  }));
}) satisfies GetStaticPaths;
```

### Pattern 3: Lightbox combined-array construction (D-05/D-06)
**What:** `Lightbox.astro` takes a single flat `images: GalleryImage[]` prop (see `src/components/Lightbox.astro` line 19-22, confirmed this session). The gallery detail page passes `gallery.images` directly because `images[0]` already *is* the hero there. Édition's hero (`leadPhoto`) is a **separate field**, so the detail page must build the combined array itself before passing it to `Lightbox`.
**When to use:** Édition detail page only.
**Example:**
```astro
---
// Source: pattern derived from src/components/Lightbox.astro's Props contract
// (images: GalleryImage[]) + CONTEXT.md D-06. EditionImage is a type alias
// for GalleryImage (see Pattern 1), so this satisfies Lightbox's prop type
// with no adapter/cast needed.
const lightboxImages = [edition.leadPhoto, ...edition.images];
---
<Lightbox images={lightboxImages} locale={locale} />
```
**Index-alignment consequence:** `leadPhoto` is Lightbox index `0`. `edition.images[0]` is Lightbox index `1`. Every `data-gallery-thumb data-index={n}` trigger in the page (hero AND grid) must use this offset — see Pitfall 2 below.

### Pattern 4: Sitemap extension (Claude's Discretion note, already specified in CONTEXT.md)
**What:** Add `getEditions()` to the existing `Promise.all` in `sitemap.xml.ts`, and two new mapped-path blocks mirroring the gallery pattern.
**Example (verified against the real file, `src/pages/sitemap.xml.ts`):**
```typescript
// Source: src/pages/sitemap.xml.ts (existing pattern, read this session)
const [galleries, editions, homePage, aboutPage, contactPage] = await Promise.all([
  getGalleries(),
  getEditions(),
  getHomePage(),
  getAboutPage(),
  getContactPage(),
])
const localizedPaths = localizedSitemapPaths([
  // ...existing entries unchanged...
  ...galleries.map((gallery) => ({ path: `galleries/${gallery.slug}/`, noIndex: gallery.seo?.noIndex })),
  { path: 'editions/' },
  ...editions.map((edition) => ({ path: `editions/${edition.slug}/` })),
  // NOTE: no `noIndex: edition.seo?.noIndex` — edition has no seo field.
  // Every published edition therefore unconditionally appears in the
  // sitemap; there is no per-edition noindex escape hatch (unlike gallery).
])
```
`localizedSitemapPaths` (in `src/lib/static-routes.ts`, confirmed this session) already `flatMap`s each entry into `[path, en/${path}]` — both locales come for free from this one call, satisfying success criterion 5 for both `fr` and `en`.

### Anti-Patterns to Avoid
- **Copying `PUBLISHED_GALLERY_FILTER` verbatim:** it references `isVisible`, a field `edition` does not have. GROQ won't error on a missing field (it just evaluates to `null`/falsy), but the `select(isVisible == false => "preparation", "published")` fallback logic is dead weight that silently does nothing useful — use the plain `publicationStatus == "published"` filter instead.
- **Reading `edition.seo?.anything`:** always `undefined`. Build SEO title/description from `edition.title` / `edition.statement[locale]` directly, matching gallery's own fallback expression (`gallery.seo?.title?.[locale] ?? \`${gallery.title} — Atelier Jacqueline Suzanne\``) but without the `??` left branch.
- **Using `GalleryGrid`'s CSS Grid for the overview page:** D-01 explicitly rejects a grid for the overview; `GalleryGrid` is still correct for the *detail* page's photo-shoot thumbnails only.
- **Reusing the removed gallery "back home" link's absolute-positioning technique for D-08's "Retour aux éditions" link:** documented regression precedent (`10-UAT.md`, debug session `header-backhome-overlap-logo`) — CONTEXT.md already flags this; do not copy that old technique even as a starting point.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Full-size image lightbox / modal focus trap / Escape-to-close | A new modal component | `src/components/Lightbox.astro` (reused, per EDN-03's explicit wording) | Already built on native `<dialog>.showModal()` for free focus containment + Escape; EDN-03 requires reuse, not reimplementation |
| Responsive `srcset`/thumbnail/full-size Sanity CDN URLs | New URL-building helpers | `src/lib/image.ts` (`thumbnailUrl`, `fullSizeUrl`, `responsiveImageSrcSet`, `responsiveThumbnailSrcSet`) | Already build-time-only, already used by both the gallery pages and `Lightbox.astro` itself |
| Sitemap XML string construction / escaping / base-path-aware URL joining | Hand-written XML template strings inline in the route | `src/lib/static-routes.ts` (`buildSitemapXml`, `localizedSitemapPaths`, `siteUrl`, `escapeXml`) | Already handles trailing-slash/base-path edge cases (unit-tested in `tests/unit/static-routes.test.ts`) — reinventing this risks reintroducing a bug already fixed once (CR-01 precedent, base-unaware links) |
| Bilingual string typing | A generic i18n library | The existing `LocaleString { fr: string; en: string }` interface + per-locale duplicate `.astro` files | Matches the confirmed site-wide convention; no i18n library is installed or needed |

**Key insight:** Every technical building block this phase needs already exists in the codebase, proven in production on the gallery feature. The work is disciplined mirroring plus two corrections (filter logic, absent `seo` field) and one index-math inversion (Lightbox combined-array offset) — not new engineering.

## Runtime State Inventory

Not applicable — this is a greenfield feature addition (new document type's data-fetch layer + new routes), not a rename/refactor/migration. No existing runtime state references "edition" routes to migrate.

## Common Pitfalls

### Pitfall 1: Copying the gallery publication filter breaks nothing loudly, but is wrong
**What goes wrong:** `PUBLISHED_GALLERY_FILTER`'s `coalesce(publicationStatus, select(isVisible == false => "preparation", "published"))` references `isVisible`, which does not exist on `edition` documents.
**Why it happens:** GROQ silently evaluates a missing-field reference as `null`/falsy rather than erroring, so a copy-pasted filter "works" (doesn't crash the build) but the fallback branch is meaningless dead logic that could confuse a future maintainer into thinking `isVisible` is a real edition field.
**How to avoid:** Use the simpler, correct filter: `publicationStatus == "published"` (edition's `publicationStatus` is a required field with `initialValue: 'published'`, confirmed in `sanity/schemas/edition.ts`).
**Warning signs:** A GROQ query for editions containing the substring `isVisible`.

### Pitfall 2: Lightbox index off-by-one between hero and grid
**What goes wrong:** If the detail page's thumbnail grid loop reuses gallery's `images.slice(1).map((img, i) => index = i + 1)` pattern unchanged, it will silently skip the *first* photo-shoot image (wrong — édition's `images[]` has no duplicate to skip) while still computing the wrong Lightbox index for the rest.
**Why it happens:** Gallery skips `images[0]` because it's already the hero (same array, same object). Édition's hero (`leadPhoto`) is a **separate field** not present anywhere in `images[]`, so there is nothing to skip — but the Lightbox still needs a `+1` offset because `leadPhoto` occupies combined-array index `0`.
**How to avoid:** Grid loop is `edition.images.map((img, i) => index = i + 1)` — no `.slice(1)`. Hero `<img>` becomes a clickable trigger with `data-index="0"`.
**Warning signs:** Clicking a grid thumbnail opens the Lightbox on the wrong photo; clicking the hero doesn't open the Lightbox at all (D-05 requires it to).

### Pitfall 3: Reading a nonexistent `edition.seo` field
**What goes wrong:** `edition.seo?.title?.[locale]` type-checks as `undefined` safely (optional chaining), so this doesn't crash — it just silently produces a worse SEO title/description/social-image than intended, with no error to catch it.
**Why it happens:** `sanity/schemas/edition.ts`'s own inline comment confirms the `seo` group was intentionally omitted in Phase 11 ("Claude's Discretion — no requirement calls for it yet; Phase 12 may add SEO once the public route ships").
**How to avoid:** Construct `seoTitle`/`seoDescription`/`socialImage` directly from `edition.title`, `edition.statement[locale]`, and `edition.leadPhoto` (via `fullSizeUrl`) — do not reference `edition.seo` anywhere. If the plan wants an `seo` group on `edition` for future parity with gallery, that is new schema work outside this phase's scope (data-fetch/routes only, per CONTEXT.md's Phase Boundary).
**Warning signs:** TypeScript `Edition` interface declaring a `seo?: SeoSettings` field that's never populated by the GROQ projection.

### Pitfall 4: Missing one of the four required route files
**What goes wrong:** Success criterion 4 requires both overview and detail routes to exist and render at both the French root and the English `/en/` prefix — 4 files total (`editions/index.astro`, `en/editions/index.astro`, `editions/[slug].astro`, `en/editions/[slug].astro`). Forgetting one produces a 404 only for that specific locale/route combination, easy to miss in a French-only spot-check.
**Why it happens:** This codebase's convention is separate near-duplicate files per locale (no shared parameterized-locale file), doubling the file count for every new route pair.
**How to avoid:** Treat the 4 files as an atomic unit; verify all 4 exist and build before considering the phase's route work done.
**Warning signs:** `astro build` succeeds (Astro doesn't error on an intentionally-absent route) but a live check of `/en/editions/` or `/editions/some-slug/` 404s.

### Pitfall 5: "Zero commerce affordances" as a purely manual/visual check
**What goes wrong:** EDN-06 ("no pricing/availability/purchase CTA") has no automated enforcement anywhere in the codebase today — nothing prevents a future edit from accidentally introducing a price string. Relying solely on human eyeballing at UAT time is fragile and doesn't survive future regressions.
**Why it happens:** This is a genuinely new type of negative requirement for this codebase; existing patterns (gallery pages) never had commerce affordances to accidentally include, so there's no established guard to copy.
**How to avoid:** The plan should treat this as testable, not just visually verifiable — see Validation Architecture below for a concrete automatable approach (grep-style negative assertion against rendered/dist HTML, matching the spirit of the existing `tests/scripts/verify-static-artifact.mjs` un-prefixed-link guard).
**Warning signs:** UAT criteria written only as "a human confirms no price is visible" with no automated companion check.

## Code Examples

### Édition GROQ query pair
```typescript
// Source: src/lib/sanity.ts (existing pattern, adapted per Pitfall 1's correction)
const PUBLISHED_EDITION_FILTER = /* groq */ `publicationStatus == "published"`

const EDITIONS_QUERY = /* groq */ `*[_type == "edition" && ${PUBLISHED_EDITION_FILTER}] | order(orderRank) {
  title, "slug": slug.current, statement, leadPhoto, images, pageCount, printRun, dimensions, publicationStatus
}`

const EDITION_BY_SLUG_QUERY = /* groq */ `*[_type == "edition" && slug.current == $slug && ${PUBLISHED_EDITION_FILTER}][0]{
  title, "slug": slug.current, statement, leadPhoto, images, pageCount, printRun, dimensions, publicationStatus
}`
```

### Format details compact label:value line (D-09)
```astro
---
// Source: pattern derived from CONTEXT.md D-09's exact example string and
// sanity/schemas/edition.ts's confirmed dimensions{width,height,unit} shape.
const unitLabel = edition.dimensions.unit; // 'cm' | 'in', display verbatim
const dimensionsText = `${edition.dimensions.width} × ${edition.dimensions.height} ${unitLabel}`;
---
<p class="edition-detail__format">
  {locale === 'en'
    ? `Pages: ${edition.pageCount} · Print run: ${edition.printRun} copies · Dimensions: ${dimensionsText}`
    : `Pages : ${edition.pageCount} · Tirage : ${edition.printRun} exemplaires · Dimensions : ${dimensionsText}`}
</p>
```

### Hero as a clickable Lightbox trigger (D-05, contrast with gallery's static hero)
```astro
---
// Source: adapted from Lightbox.astro's documented hook contract (any element
// with data-gallery-thumb + numeric data-index opens the Lightbox at that
// index) — gallery's own hero does NOT use this hook (it's non-interactive);
// édition's must, per D-05.
---
<button type="button" class="edition-detail__hero-trigger" data-gallery-thumb data-index="0" aria-label="...">
  <img src={leadPhotoSrc} srcset={responsiveImageSrcSet(edition.leadPhoto)} sizes="100vw" alt={leadPhotoAlt} class="edition-detail__hero-img" loading="eager" decoding="async" />
</button>
```

## State of the Art

Not applicable — no external ecosystem/library version drift to track. This phase reuses code already committed to this repository in earlier phases (0–11); there is no "current vs. deprecated" axis outside this codebase's own history, which is already fully captured in STATE.md's Accumulated Context.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `EditionImage` can be a type alias of `GalleryImage` (`export type EditionImage = GalleryImage`) rather than a separately-declared interface | Standard Stack / Pattern 1 | Low — if the planner instead declares a separate `EditionImage` interface with identical fields, it's functionally equivalent, just more duplicated code; no behavior difference |
| A2 | Schema.org structured-data `@type` for the édition detail page is left unspecified by this research (gallery uses `ImageGallery`, which doesn't semantically fit a printed zine/book) | Not covered in Architecture Patterns — flagged here instead | Low — EDN-02..EDN-07 don't require structured data; if the planner wants parity with gallery's SEO richness, `schema.org/Book` (with `numberOfPages`) is a plausible closer fit but is untested/unresearched this session — treat as a discretion item, not a locked recommendation |

**If this table is empty:** N/A — see above; both entries are low-risk/low-consequence discretion notes, not compliance- or security-relevant claims.

## Open Questions

1. **Should `edition` gain an `seo` field/group in this phase, for SEO parity with `gallery`?**
   - What we know: CONTEXT.md's Phase Boundary scopes this phase to "data-fetch layer + routes," and the schema itself (Phase 11 output) is explicitly locked/out-of-scope per canonical_refs ("the schema decisions this phase's data-fetch layer must match field-for-field").
   - What's unclear: Whether adding an `seo` field counts as "matching the schema field-for-field" (i.e., forbidden — schema is a Phase 11 artifact) or as a legitimate Phase 12 addition since the schema comment itself floats "Phase 12 may add SEO."
   - Recommendation: Default to NOT touching `sanity/schemas/edition.ts` in this phase (safer reading of the Phase Boundary — schema changes belong to Phase 11's already-closed scope) and construct SEO fields from `title`/`statement`/`leadPhoto` only, per Pitfall 3. If Romane later wants richer per-edition SEO control, that's a small follow-up phase, not a Phase 12 blocker.

## Environment Availability

Not applicable — this phase has no new external tool/service/runtime dependencies beyond what Phase 1–11 already established and verified (Node, npm, Astro CLI, Sanity read token via `.env`). No new environment probing needed.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.9 (unit) + Playwright 1.61.1 (e2e) [VERIFIED: package.json] |
| Config file | `vitest.config.ts` (uses `astro/config`'s `getViteConfig` so `astro:i18n` resolves), `playwright.config.ts` |
| Quick run command | `npm run test:unit` |
| Full suite command | `npm run test:unit && npm run test:e2e` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| EDN-02 | Overview page lists each édition by title, lead photo, full statement, as a vertical list | unit + e2e | `vitest run tests/unit/edition-query.test.ts` (GROQ shape/order/filter, mirrors `gallery-query.test.ts`) + `playwright test tests/e2e/edition.spec.ts` (renders list, no truncation) | ❌ Wave 0 — both new files |
| EDN-03 | Detail page opens the full photo shoot in the existing gallery Lightbox | e2e | `playwright test tests/e2e/edition.spec.ts` (mirrors `gallery.spec.ts`'s lightbox describe block: click hero AND a grid thumb, verify counter/index, verify `[leadPhoto, ...images]` order) | ❌ Wave 0 |
| EDN-04 | Detail page shows a short description/statement | e2e | Same file — assert statement text present and differs FR vs EN (mirrors gallery detail's bilingual-statement test) | ❌ Wave 0 |
| EDN-06 | No price/availability/purchase affordance anywhere on overview or detail | e2e (negative assertion) + build-artifact grep guard | `playwright test` text-scan (no `€`, no case-insensitive "prix\|price\|acheter\|buy\|panier\|cart\|stock\|disponib") + optional `tests/scripts/verify-static-artifact.mjs` extension scanning `dist/editions/**/*.html` for the same forbidden strings | ❌ Wave 0 (net-new negative-assertion pattern for this codebase) |
| EDN-07 | Both overview and detail render correctly at fr root and `/en/` | e2e | `playwright test tests/e2e/edition.spec.ts` (goto both `/editions/` and `/en/editions/`, and both `/editions/{slug}/` and `/en/editions/{slug}/`) | ❌ Wave 0 |
| Success criterion 5 | Overview + detail URLs in `sitemap.xml`, both locales | unit + e2e | `vitest run tests/unit/static-routes.test.ts` (extend with edition path assertions, mirrors existing gallery assertion) + `playwright test tests/e2e/seo.spec.ts` (extend sitemap test to also assert `/editions/`) | Partial — extend existing files |

### Sampling Rate
- **Per task commit:** `npm run test:unit` (fast, no browser)
- **Per wave merge:** `npm run test:unit && npm run test:e2e`
- **Phase gate:** Full suite green before `/gsd-verify-work`, matching CI's existing blocking-gate structure (`.github/workflows/deploy.yml`)

### Wave 0 Gaps
- [ ] `tests/unit/edition-query.test.ts` — covers EDN-02 (GROQ shape, ordering, filter correctness per Pitfall 1)
- [ ] `tests/e2e/edition.spec.ts` — covers EDN-02, EDN-03, EDN-04, EDN-06, EDN-07 (mirrors `tests/e2e/gallery.spec.ts` structure, with an added negative-assertion `describe('no commerce affordances')` block)
- [ ] Extend `tests/unit/static-routes.test.ts` — add an édition-path assertion case to the existing `localizedSitemapPaths` describe block (no new file needed)
- [ ] Extend `tests/e2e/seo.spec.ts` — add an édition-specific sitemap assertion to the existing `sitemap contains both languages and gallery pages` test (or a new adjacent test)
- [ ] Framework install: none — Vitest and Playwright are already configured and running in CI

*Consider also extending `tests/scripts/verify-static-artifact.mjs` (already a blocking CI/build-artifact check) with a dist-HTML grep guard for forbidden commerce strings under `dist/editions/` and `dist/en/editions/` — this converts EDN-06's "zero pricing affordance" success criterion from a purely visual UAT check into a build-blocking automated one, directly addressing the Nyquist testability concern raised for this phase.*

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V2 Authentication | No | No auth surface in this phase — public, static, unauthenticated pages only |
| V3 Session Management | No | No sessions — static site, no cookies set by this phase (the existing locale-preference cookie is unrelated, set in `BaseLayout.astro`, untouched here) |
| V4 Access Control | No | No access-control surface — all édition content fetched is already `publicationStatus == "published"`, publicly visible by design |
| V5 Input Validation | Yes (narrow) | `getEdition(slug)` must pass `slug` as a bound GROQ parameter (`$slug`), never string-interpolated into the query — exactly as `getGallery(slug)` already does. This is the one place this phase constructs a query from a variable value (the `[slug]` route param, itself sourced only from `getStaticPaths`'s own trusted Sanity-fetched slug list, not end-user input — so risk is already low, but the parameterization discipline should still be followed for consistency and defense-in-depth). |
| V6 Cryptography | No | No new crypto surface — the existing `SANITY_API_READ_TOKEN` handling (build-time-only, never bundled to the browser) is unchanged, per `src/lib/sanity.ts`'s existing file-level warning comment |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|----------------------|
| GROQ injection via unbound query interpolation | Tampering | Always use `sanityClient.fetch(query, {slug})` parameter binding, never template-literal-interpolate a variable into the GROQ string itself (both `getGallery` and the recommended `getEdition` already follow this) |
| Read token leaking into client-side JS bundle | Information Disclosure | `src/lib/sanity.ts` and `src/lib/image.ts` are both documented "build-time only, never import from a client `<script>`" — this phase's new route files follow the same import-only-in-frontmatter discipline already used by every existing page |
| Accidental commerce-affordance leak (price/stock/buy CTA) reaching production | Information Disclosure (business-logic-adjacent, not a classic STRIDE security bug, but a genuine compliance/scope risk given EDN-06's explicit no-commerce requirement) | Automated negative-assertion test (see Validation Architecture) rather than relying solely on manual review |

## Sources

### Primary (HIGH confidence — direct codebase reads this session)
- `/Users/florian/Projects/ajs-website/src/lib/sanity.ts` — Gallery/GalleryImage interfaces, GROQ query constants, `getGalleries`/`getGallery` implementation
- `/Users/florian/Projects/ajs-website/src/pages/galleries/[slug].astro` + `src/pages/en/galleries/[slug].astro` — detail-page structure, `getStaticPaths`, hero/grid/Lightbox wiring, structured data
- `/Users/florian/Projects/ajs-website/src/components/Lightbox.astro` — `Props { images: GalleryImage[]; locale }` contract, `data-gallery-thumb`/`data-index` hook contract, dialog/focus/swipe implementation
- `/Users/florian/Projects/ajs-website/src/lib/image.ts` — `thumbnailUrl`, `fullSizeUrl`, `responsiveImageSrcSet`, `responsiveThumbnailSrcSet`, `blurPlaceholderUrl`
- `/Users/florian/Projects/ajs-website/src/pages/sitemap.xml.ts` + `src/lib/static-routes.ts` — sitemap generation pipeline, `localizedSitemapPaths`/`buildSitemapXml`
- `/Users/florian/Projects/ajs-website/sanity/schemas/edition.ts` — authoritative Phase-11 field names/types/validation for `edition` documents (confirms all fields CONTEXT.md claims, and confirms the absence of `isVisible`/`seo`)
- `/Users/florian/Projects/ajs-website/src/components/GalleryGrid.astro`, `src/layouts/BaseLayout.astro` — presentational grid wrapper and shared page chrome/`headerVariant` contract
- `/Users/florian/Projects/ajs-website/tests/e2e/gallery.spec.ts`, `tests/unit/gallery-query.test.ts`, `tests/unit/static-routes.test.ts`, `tests/e2e/seo.spec.ts`, `tests/scripts/verify-static-artifact.mjs` — existing test patterns to mirror for the Validation Architecture section
- `/Users/florian/Projects/ajs-website/astro.config.mjs`, `/Users/florian/Projects/ajs-website/package.json` — confirmed installed versions, i18n routing config, `output: 'static'`
- `.planning/phases/12-data-fetch-layer-routes/12-CONTEXT.md`, `.planning/REQUIREMENTS.md`, `.planning/STATE.md` — locked decisions, requirement IDs, project history

### Secondary (MEDIUM confidence)
None — no external web/docs sources were needed this session; every claim traces to a direct read of this repository's own committed source.

### Tertiary (LOW confidence)
None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new dependencies; all versions read directly from `package.json`
- Architecture: HIGH — every pattern mirrored was read directly from the working, production gallery implementation in this same repo
- Pitfalls: HIGH — all five pitfalls are grounded in direct comparison of `sanity/schemas/edition.ts` against `sanity/schemas/gallery.ts`-derived code, not speculation

**Research date:** 2026-07-22
**Valid until:** Effectively indefinite for this phase (no external ecosystem drift risk) — but re-check `sanity/schemas/edition.ts` if Phase 11's schema is touched again before Phase 12 executes, since this research's field-shape claims are pinned to the file's exact current content.
