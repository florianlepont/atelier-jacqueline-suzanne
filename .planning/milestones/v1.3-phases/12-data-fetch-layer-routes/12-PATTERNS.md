# Phase 12: Data-Fetch Layer & Routes - Pattern Map

**Mapped:** 2026-07-22
**Files analyzed:** 7 (1 modified data-fetch module, 4 new route files, 1 modified sitemap endpoint, 1 test extension implied)
**Analogs found:** 6 / 6 (all files have a same-repo, same-shape analog — this phase is explicitly pattern-mirroring per RESEARCH.md)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|---------------|
| `src/lib/sanity.ts` (add `Edition`/`EditionImage` + `getEditions`/`getEdition`) | service (data-fetch module) | CRUD (read-only, build-time GROQ) | Same file, `Gallery`/`GalleryImage`/`getGalleries`/`getGallery` (lines 89-191) | exact (same file, same shape) |
| `src/pages/editions/index.astro` | route (page, overview) | request-response (SSG list render) | No direct overview-page analog exists (standalone Galleries overview page was removed in Phase 04.3 — see RESEARCH.md). Structural analog: `src/pages/galleries/[slug].astro`'s `BaseLayout`/frontmatter-fetch shell + `GalleryGrid.astro`'s content-agnostic wrapper convention (grid layout itself does NOT apply, D-01) | partial (shell only, list layout is new) |
| `src/pages/en/editions/index.astro` | route (page, overview) | request-response (SSG list render) | Same as above, EN locale twin | partial |
| `src/pages/editions/[slug].astro` | route (page, detail) | request-response (SSG detail render + client Lightbox) | `src/pages/galleries/[slug].astro` | exact |
| `src/pages/en/editions/[slug].astro` | route (page, detail) | request-response (SSG detail render + client Lightbox) | `src/pages/en/galleries/[slug].astro` | exact |
| `src/pages/sitemap.xml.ts` (extend) | route (build-time endpoint) | batch (static XML generation) | Same file, existing `galleries` `Promise.all`/mapping block (lines 1-23) | exact (same file, same shape) |
| `tests/unit/edition-query.test.ts` (new, implied by RESEARCH.md Validation Architecture) | test | CRUD (query-shape assertions) | `tests/unit/gallery-query.test.ts` (not read this session — same-repo sibling, use directly) | exact (by convention) |
| `tests/e2e/edition.spec.ts` (new, implied) | test | request-response (e2e page assertions) | `tests/e2e/gallery.spec.ts` (not read this session — same-repo sibling) | exact (by convention) |

## Pattern Assignments

### `src/lib/sanity.ts` — add `Edition`/`EditionImage` interfaces + `getEditions()`/`getEdition(slug)`

**Analog:** same file, `Gallery`/`GalleryImage`/`getGalleries`/`getGallery`

**GalleryImage interface to mirror** (lines 82-99):
```typescript
export interface GalleryImage extends SanityImage {
  alt: LocaleString
  rights?: {
    credit?: string
    copyrightNotice?: string
    year?: number
    usage?: 'allRightsReserved' | 'editorialOnly' | 'licensed' | 'publicDomain'
    licenseDetails?: string
    displayCredit?: boolean
  }
}
```
Per RESEARCH.md A1, `EditionImage` can be a type alias: `export type EditionImage = GalleryImage` — the `sanity/schemas/edition.ts` `leadPhoto`/`images[]` sub-fields are structurally identical (same `alt`/`rights` shape).

**Gallery interface + filter + queries to mirror the SHAPE of, but NOT the filter logic** (lines 101-122):
```typescript
export interface Gallery {
  title: string
  slug: string
  statement: LocaleString
  heroColor?: string
  isVisible?: boolean
  publicationStatus?: 'preparation' | 'published' | 'archived'
  showOnHomePage?: boolean
  seo?: SeoSettings
  images: GalleryImage[]
}

const PUBLISHED_GALLERY_FILTER = /* groq */ `coalesce(publicationStatus, select(isVisible == false => "preparation", "published")) == "published"`

const GALLERIES_QUERY = /* groq */ `*[_type == "gallery" && ${PUBLISHED_GALLERY_FILTER}] | order(orderRank) {
  title, "slug": slug.current, statement, heroColor, publicationStatus, "showOnHomePage": coalesce(showOnHomePage, true), "isVisible": coalesce(isVisible, true), seo, images
}`
```

**CRITICAL DEVIATION (RESEARCH.md Pitfall 1):** `edition` has no `isVisible` field and no `seo` field. Do NOT copy `PUBLISHED_GALLERY_FILTER` or the `seo`/`isVisible` projections. Use:
```typescript
const PUBLISHED_EDITION_FILTER = /* groq */ `publicationStatus == "published"`

const EDITIONS_QUERY = /* groq */ `*[_type == "edition" && ${PUBLISHED_EDITION_FILTER}] | order(orderRank) {
  title, "slug": slug.current, statement, leadPhoto, images, pageCount, printRun, dimensions, publicationStatus
}`

const EDITION_BY_SLUG_QUERY = /* groq */ `*[_type == "edition" && slug.current == $slug && ${PUBLISHED_EDITION_FILTER}][0]{
  title, "slug": slug.current, statement, leadPhoto, images, pageCount, printRun, dimensions, publicationStatus
}`
```

**Fetch functions to mirror exactly** (lines 179-191):
```typescript
export async function getGalleries(): Promise<Gallery[]> {
  return (await sanityClient.fetch<Gallery[] | null>(GALLERIES_QUERY)) ?? []
}

export async function getGallery(slug: string): Promise<Gallery | null> {
  const result = await sanityClient.fetch<Gallery | null>(GALLERY_BY_SLUG_QUERY, {slug})
  return result ?? null
}
```
→ `getEditions()` / `getEdition(slug)` follow this exact shape, parameter-binding `$slug` (never string-interpolated — ASVS V5 note in RESEARCH.md).

---

### `src/pages/editions/[slug].astro` (route, detail) + `src/pages/en/editions/[slug].astro`

**Analog:** `src/pages/galleries/[slug].astro` (full file read this session, 203 lines) / `src/pages/en/galleries/[slug].astro` (EN twin, not divergently re-read — same shape, only import depth `../../../` and `locale = 'en' as const` differ per established convention)

**Imports pattern** (lines 1-14):
```astro
import type { GetStaticPaths } from 'astro';
import BaseLayout from '../../layouts/BaseLayout.astro';
import GalleryGrid from '../../components/GalleryGrid.astro';
import Lightbox from '../../components/Lightbox.astro';
import { getGalleries } from '../../lib/sanity';
import { thumbnailUrl, fullSizeUrl, responsiveImageSrcSet, responsiveThumbnailSrcSet } from '../../lib/image';
import type { Gallery } from '../../lib/sanity';
```
→ swap `getGalleries`/`Gallery` for `getEditions`/`Edition`; EN twin uses `../../../` (one level deeper).

**`getStaticPaths` fetch-once-pass-as-props pattern** (lines 16-26):
```astro
export const getStaticPaths = (async () => {
  const galleries = await getGalleries();
  return galleries.map((gallery) => ({
    params: { slug: gallery.slug },
    props: { gallery },
  }));
}) satisfies GetStaticPaths;

interface Props {
  gallery: Gallery;
}

const { gallery } = Astro.props;
const locale = 'fr' as const;
```

**SEO fallback pattern — DEVIATION required** (lines 39-41):
```astro
const seoTitle = gallery.seo?.title?.[locale] ?? `${gallery.title} — Atelier Jacqueline Suzanne`;
const seoDescription = gallery.seo?.description?.[locale] ?? statement;
const socialImage = fullSizeUrl(gallery.seo?.image ?? heroImage, 1200);
```
`edition` has NO `seo` field (RESEARCH.md Pitfall 3) — build `seoTitle`/`seoDescription`/`socialImage` from `edition.title`/`edition.statement[locale]`/`edition.leadPhoto` only, no `??` left branch reading `edition.seo`.

**BaseLayout + structured data wiring** (lines 42-67):
```astro
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'ImageGallery',
  name: gallery.title,
  description: seoDescription,
  url: Astro.url.toString(),
  inLanguage: 'fr',
  creator: { '@type': 'Person', name: 'Romane Lepont' },
  image: gallery.images.map((image) => ({
    '@type': 'ImageObject',
    contentUrl: fullSizeUrl(image, 2000),
    caption: image.alt?.fr ?? '',
    creditText: image.rights?.credit ?? 'Romane Lepont',
    copyrightNotice: image.rights?.copyrightNotice ?? '© Romane Lepont — Tous droits réservés',
  })),
};
---
<BaseLayout
  title={seoTitle}
  description={seoDescription}
  socialImage={socialImage}
  noIndex={gallery.seo?.noIndex}
  structuredData={structuredData}
  headerVariant="transparent"
>
```
RESEARCH.md A2 flags `@type: 'ImageGallery'` as an untested discretion item for édition (a `schema.org/Book` type might fit better) — planner's call, not locked. `noIndex={gallery.seo?.noIndex}` must be dropped/omitted for édition (no `seo` field, so no noIndex source — pass `undefined` or omit the prop).

**Hero — DEVIATION required (D-05: clickable, not static)**. Gallery's non-interactive hero (lines 69-81) must NOT be copied as-is. Instead use the Lightbox trigger hook contract from `Lightbox.astro`'s own doc comment (lines 10-15) and RESEARCH.md's Pattern 4 code example:
```astro
<button type="button" class="edition-detail__hero-trigger" data-gallery-thumb data-index="0" aria-label="...">
  <img src={leadPhotoSrc} srcset={responsiveImageSrcSet(edition.leadPhoto)} sizes="100vw" alt={leadPhotoAlt} class="edition-detail__hero-img" loading="eager" decoding="async" />
</button>
```

**Thumbnail grid pattern — DEVIATION required (no `.slice(1)`, index math per Pitfall 2)** (lines 84-120, gallery's version SKIPS index 0 — do not copy that skip):
```astro
{
  gallery.images.length > 1 && (
    <GalleryGrid>
      {
        gallery.images.slice(1).map((img, i) => {
          const index = i + 1;
          return (
            <button type="button" class="gallery-detail__thumb-button" data-gallery-thumb data-index={index}
              aria-label={`Voir en taille réelle, image ${index + 1} sur ${gallery.images.length}`}>
              <img src={thumbnailUrl(img, 600)} srcset={responsiveThumbnailSrcSet(img)}
                sizes="(max-width: 767px) calc(100vw - 32px), 33vw" width="600" height="600" alt=""
                loading="lazy" decoding="async" class="gallery-detail__thumb" />
            </button>
          );
        })
      }
    </GalleryGrid>
  )
}
```
Édition version: NO `.slice(1)` — loop over the full `edition.images` array, `index = i + 1` (offset for the combined Lightbox array, not a skip):
```astro
<GalleryGrid>
  {edition.images.map((img, i) => {
    const index = i + 1;
    return ( /* same button/img structure, data-index={index} */ );
  })}
</GalleryGrid>
```

**Lightbox wiring — DEVIATION required (combined array construction, D-06)** (line 123):
```astro
<Lightbox images={gallery.images} locale={locale} />
```
Édition version:
```astro
const lightboxImages = [edition.leadPhoto, ...edition.images];
---
<Lightbox images={lightboxImages} locale={locale} />
```

**Format details block (new, D-09/D-10) — no gallery analog, construct fresh, placed after statement, before grid:**
```astro
const dimensionsText = `${edition.dimensions.width} × ${edition.dimensions.height} ${edition.dimensions.unit}`;
---
<p class="edition-detail__format">
  {locale === 'en'
    ? `Pages: ${edition.pageCount} · Print run: ${edition.printRun} copies · Dimensions: ${dimensionsText}`
    : `Pages : ${edition.pageCount} · Tirage : ${edition.printRun} exemplaires · Dimensions : ${dimensionsText}`}
</p>
```

**"Retour aux éditions" link (D-08) — no direct analog (the equivalent gallery link was removed in Phase 10).** Known landmine: do NOT reuse the removed link's absolute-positioning technique (caused `header-backhome-overlap-logo` overlap bug, `10-UAT.md`). Position it away from `SiteHeader`'s logo — e.g. inline in `.gallery-detail__content` flow (not `position: absolute` near the hero), following the same low-risk placement style as `.gallery-detail__statement`'s normal document flow.

**CSS convention to mirror** — the gallery detail page's `<style>` block (lines 126-203) uses `--space-*`/`--color-*`/`--text-display-size`/`--weight-*`/`--font-display` custom properties and a `768px` mobile breakpoint (matches `GalleryGrid.astro`'s own `@media (min-width: 768px)` breakpoint, lines 20-24) — reuse the same token set and breakpoint for both new route trees, per CONTEXT.md's Claude's Discretion note.

---

### `src/pages/editions/index.astro` + `src/pages/en/editions/index.astro` (route, overview — NEW visual pattern, D-01)

**No layout analog exists** (standalone Galleries overview page was removed in Phase 04.3). Reuse only the SHELL conventions:

**Frontmatter/BaseLayout shell to mirror** (from `galleries/[slug].astro` lines 1-14, 60-67, adapted for a list instead of `getStaticPaths`):
```astro
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getEditions } from '../../lib/sanity';
import { thumbnailUrl, responsiveThumbnailSrcSet } from '../../lib/image';
import type { Edition } from '../../lib/sanity';

const editions = await getEditions();
const locale = 'fr' as const;
---
<BaseLayout title="..." description="..." headerVariant="transparent">
  <!-- vertical editorial list, D-01 through D-04 -->
</BaseLayout>
```

**Content-agnostic wrapper convention** — `GalleryGrid.astro` (full file, 25 lines) shows the project's convention for a presentational wrapper that "only lays out whatever is passed into its default slot, it never knows what a [domain object] is." Do NOT reuse `GalleryGrid` itself here (its CSS Grid is wrong for a vertical list per D-01/RESEARCH.md Alternatives Considered) — but if a new `EditionList.astro`-style wrapper is introduced, mirror this same content-agnostic-wrapper philosophy (single `<slot />`, styling only, no domain logic) rather than baking layout into the page file directly.

**Thumbnail helper reuse** — `thumbnailUrl`/`responsiveThumbnailSrcSet` from `src/lib/image.ts` (same helpers used by the detail page's grid, imported identically).

**Zigzag alternation (D-04)** — no existing codebase pattern for alternating layout; implement via `edition, i` index parity (`i % 2 === 0` / odd) in the `.map()`, e.g. a modifier class `edition-list__row--reverse` toggled by index, styled with `flex-direction: row-reverse` in CSS — this is genuinely new, not mirrored from elsewhere.

---

### `src/pages/sitemap.xml.ts` (extend)

**Analog:** same file, full 28 lines read this session.

**Existing pattern to extend**:
```typescript
import type {APIRoute} from 'astro'
import {getAboutPage, getContactPage, getGalleries, getHomePage} from '../lib/sanity'
import {buildSitemapXml, localizedSitemapPaths} from '../lib/static-routes'

export const GET: APIRoute = async ({site}) => {
  const origin = site ?? new URL('https://florianlepont.github.io')
  const [galleries, homePage, aboutPage, contactPage] = await Promise.all([
    getGalleries(),
    getHomePage(),
    getAboutPage(),
    getContactPage(),
  ])
  const localizedPaths = localizedSitemapPaths([
    {path: '', noIndex: homePage?.seo?.noIndex},
    {path: 'about/', noIndex: aboutPage?.seo?.noIndex},
    {path: 'contact/', noIndex: contactPage?.seo?.noIndex},
    {path: 'mentions-legales/'},
    {path: 'confidentialite/'},
    ...galleries.map((gallery) => ({
      path: `galleries/${gallery.slug}/`,
      noIndex: gallery.seo?.noIndex,
    })),
  ])

  const body = buildSitemapXml(origin, import.meta.env.BASE_URL, localizedPaths)

  return new Response(body, {headers: {'Content-Type': 'application/xml; charset=utf-8'}})
}
```

**Required extension** — add `getEditions` to imports and `Promise.all`, and two new entries (édition has no `seo`/`noIndex`, so no `noIndex:` key on these entries — every published édition unconditionally appears, per RESEARCH.md Pattern 4):
```typescript
import {getAboutPage, getContactPage, getEditions, getGalleries, getHomePage} from '../lib/sanity'
// ...
const [galleries, editions, homePage, aboutPage, contactPage] = await Promise.all([
  getGalleries(),
  getEditions(),
  getHomePage(),
  getAboutPage(),
  getContactPage(),
])
const localizedPaths = localizedSitemapPaths([
  // ...existing entries unchanged...
  ...galleries.map((gallery) => ({path: `galleries/${gallery.slug}/`, noIndex: gallery.seo?.noIndex})),
  {path: 'editions/'},
  ...editions.map((edition) => ({path: `editions/${edition.slug}/`})),
])
```
`localizedSitemapPaths` (`src/lib/static-routes.ts`, full 43 lines read this session) already `flatMap`s each entry into `[path, en/${path}]` — no changes needed there; both locales come for free.

---

## Shared Patterns

### Build-time-only Sanity access (security-relevant)
**Source:** `src/lib/sanity.ts` lines 3-11 (file-level doc comment)
**Apply to:** `src/lib/sanity.ts` extension, all 4 new route files
```typescript
/**
 * Build-time only Sanity client.
 *
 * IMPORTANT: This module must only be imported from Astro frontmatter
 * (build/server-time code), never from client-side scripts or hydrated
 * islands. `SANITY_API_READ_TOKEN` must never reach the browser...
 */
```
`getEditions`/`getEdition` must only ever be imported in `.astro` frontmatter (never in `Lightbox.astro`'s `<script>` block or any client-side code).

### Bilingual routing (fr root / en prefix)
**Source:** `src/pages/galleries/[slug].astro` vs `src/pages/en/galleries/[slug].astro` (confirmed separate near-duplicate files, only import-path depth and `const locale = 'fr' as const` vs `'en' as const` differ)
**Apply to:** All 4 new route files — no shared parameterized-locale file; each locale gets its own physical `.astro` file.

### `getStaticPaths` fetch-once-pass-as-props
**Source:** `src/pages/galleries/[slug].astro` lines 16-22
**Apply to:** `src/pages/editions/[slug].astro`, `src/pages/en/editions/[slug].astro` — fetch the full `getEditions()` list once in `getStaticPaths`, never a second per-page `getEdition(slug)` fetch at render time (even though `getEdition(slug)` exists in the data-fetch layer for potential future use, e.g. draft preview — it is NOT used by these static routes).

### Lightbox trigger hook contract
**Source:** `src/components/Lightbox.astro` lines 10-15 (doc comment)
**Apply to:** `src/pages/editions/[slug].astro`'s hero button AND thumbnail grid buttons
```
Hook contract: any element on the page carrying `data-gallery-thumb` and a
numeric `data-index` (0-based, matching this gallery's `images` array
order) is treated as a trigger.
```
For édition, the array order is `[leadPhoto, ...images]` (D-06), so `data-index` must be offset by `+1` for every `images[]` grid item; the hero itself is `data-index="0"`.

### GROQ parameter binding (ASVS V5)
**Source:** `src/lib/sanity.ts` line 189 (`sanityClient.fetch<Gallery | null>(GALLERY_BY_SLUG_QUERY, {slug})`)
**Apply to:** `getEdition(slug)` — always bind `$slug` as a query parameter, never string-interpolate it into the GROQ template.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| Overview page's vertical zigzag list markup/CSS (`.editions-list__row` alternation) | component/route (presentational) | request-response | D-01 explicitly rejects the only prior list pattern (`GalleryGrid`'s CSS Grid); the standalone Galleries overview page that might have served as a closer analog was removed in Phase 04.3. Use RESEARCH.md's Recommended Project Structure + this phase's own design tokens (`--space-*`, `--color-*`, `768px` breakpoint) as the basis instead of a codebase mirror. |
| Format details compact label:value line (D-09) | presentational fragment | transform | No prior compact-metadata-line pattern exists elsewhere in the codebase; RESEARCH.md's Code Examples section supplies a ready-to-use fr/en ternary string as the closest thing to a pattern. |
| "Retour aux éditions" back-link | component/route (presentational) | request-response | The one prior analog (gallery detail's "back home" link) was deliberately removed in Phase 10 after a real positioning bug — explicitly NOT to be copied as a starting point (RESEARCH.md Pitfall/CONTEXT.md D-08 landmine note). Treat as new UI needing only token-consistent, non-absolute positioning. |
| `tests/unit/edition-query.test.ts`, `tests/e2e/edition.spec.ts` (test files) | test | CRUD / request-response | Not read this session (out of this pass's Read budget), but RESEARCH.md's Validation Architecture confirms direct same-repo siblings exist to mirror: `tests/unit/gallery-query.test.ts` and `tests/e2e/gallery.spec.ts`. Planner/implementer should read those two files directly when writing the test plan — high-confidence exact-structure analogs, just not pre-extracted here. |

## Metadata

**Analog search scope:** `src/lib/sanity.ts`, `src/pages/galleries/[slug].astro`, `src/pages/en/galleries/[slug].astro`, `src/pages/sitemap.xml.ts`, `src/lib/static-routes.ts`, `src/components/Lightbox.astro`, `src/components/GalleryGrid.astro`, `src/pages/` and `src/pages/en/` directory listings
**Files scanned:** 9 (7 fully read this session; `sanity/schemas/edition.ts` and gallery/edition test files referenced via RESEARCH.md's prior direct reads, not re-read here per no-duplicate-read discipline)
**Pattern extraction date:** 2026-07-22
</content>
