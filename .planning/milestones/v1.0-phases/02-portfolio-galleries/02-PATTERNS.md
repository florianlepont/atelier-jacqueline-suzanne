# Phase 2: Portfolio Galleries - Pattern Map

**Mapped:** 2026-07-06
**Files analyzed:** 12 (new) + 3 (modified)
**Analogs found:** 15 / 15 (all files have at least a role-match analog; this is a small, single-phase-deep codebase — Phase 1 is the only prior art, so every analog below comes from Phase 1's output)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `sanity/schemas/objects/galleryImage.ts` | model (Sanity object schema) | CRUD (schema definition) | `sanity/schemas/siteSettings.ts` (locale-object field pattern) | role-match |
| `sanity/schemas/gallery.ts` | model (Sanity document schema) | CRUD | `sanity/schemas/siteSettings.ts` | exact (same schema-authoring role; different cardinality — document vs. singleton) |
| `sanity/schemas/index.ts` (MODIFIED) | config | CRUD (schema registry) | `sanity/schemas/index.ts` (itself, extend in place) | exact |
| `sanity/schemas/structure.ts` (MODIFIED) | config | CRUD (desk structure) | `sanity/schemas/structure.ts` (itself, extend in place) | exact |
| `src/lib/sanity.ts` (MODIFIED — add `getGalleries`/`getGallery`) | service | request-response (build-time GROQ fetch) | `src/lib/sanity.ts`'s own `getSiteSettings()` | exact |
| `src/lib/image.ts` | utility | transform (CDN URL building) | none in-repo — new capability; closest conceptual analog is `src/lib/i18n-paths.ts` (pure-function utility module shape) | role-match |
| `src/pages/galleries/index.astro` | route (page) | request-response (static render) | `src/pages/index.astro` | exact |
| `src/pages/en/galleries/index.astro` | route (page) | request-response (static render) | `src/pages/en/index.astro` | exact |
| `src/pages/galleries/[slug].astro` | route (page, dynamic via `getStaticPaths`) | request-response (static render) | `src/pages/index.astro` (page-shape analog) + `src/pages/404.astro` (only existing file with locale-aware body content beyond the homepage) | role-match (no existing `getStaticPaths` file in repo — first of its kind) |
| `src/pages/en/galleries/[slug].astro` | route (page, dynamic via `getStaticPaths`) | request-response (static render) | `src/pages/en/index.astro` | role-match |
| `src/components/GalleryCard.astro` | component | transform (data → markup) | `src/components/LanguageSwitcher.astro` (component structure: frontmatter + template + scoped `<style>`) | role-match |
| `src/components/GalleryGrid.astro` | component | transform (data → markup) | `src/components/LanguageSwitcher.astro` | role-match |
| `src/components/Lightbox.astro` | component + client island | event-driven (client-side interaction) | `src/components/LanguageSwitcher.astro` (only existing `<script>`-island precedent) | role-match |
| `tests/unit/sanity-galleries.test.ts` (or similar, if added) | test | request-response (pure-function/data test) | `tests/unit/i18n-paths.test.ts` | exact |
| `tests/e2e/galleries.spec.ts` | test | event-driven (Playwright interaction test) | `tests/e2e/i18n.spec.ts` | exact |
| `src/layouts/BaseLayout.astro` (MODIFIED — new design tokens + nav label) | component (shared layout) | request-response (static render) | `src/layouts/BaseLayout.astro` (itself, extend in place) | exact |

## Pattern Assignments

### `sanity/schemas/objects/galleryImage.ts` (model, CRUD)

**Analog:** `sanity/schemas/siteSettings.ts`

**Imports pattern** (lines 1):
```typescript
import {defineField, defineType} from 'sanity'
```

**Locale-object sub-field pattern to copy** (lines 7-17, the `localeStringField` helper — reuse this exact shape inline for `alt`, don't reinvent):
```typescript
function localeStringField(name: string, title: string) {
  return defineField({
    name,
    title,
    type: 'object',
    fields: [
      defineField({name: 'fr', title: 'French', type: 'string', validation: (rule) => rule.required()}),
      defineField({name: 'en', title: 'English', type: 'string', validation: (rule) => rule.required()}),
    ],
  })
}
```
D-02 requires `alt` to be `{fr, en}`, both required — this is exactly `localeStringField`'s shape. Per RESEARCH.md's Open Question 1, either import/reuse `localeStringField` from `siteSettings.ts` (if extracted to a shared module) or duplicate the same field-definition inline in `galleryImage.ts` — RESEARCH.md leaves this a taste call. Given no shared `sanity/schemas/lib/` module exists yet, the simplest zero-risk path is to inline the same object-field shape in `galleryImage.ts` (mirrors RESEARCH.md's Pattern 1 code example almost verbatim).

**Preview pattern** (lines 60-65 of `siteSettings.ts`, adapt for image items):
```typescript
preview: {
  select: {title: 'siteTitle.fr'},
  prepare({title}) {
    return {title: title || 'Site Settings'}
  },
},
```
RESEARCH.md's Pattern 1 example already shows the adapted form for `galleryImage`: `preview: {select: {media: 'image', title: 'alt.fr'}}`.

---

### `sanity/schemas/gallery.ts` (model, CRUD)

**Analog:** `sanity/schemas/siteSettings.ts`

**Structure to copy** — `defineType`/`defineField` shape, `title`/`type: 'document'`/`fields` array, same as `siteSettings.ts` lines 31-59. Key differences from the analog (document type, not singleton — no structure.ts pinning):
- `title` is a plain `type: 'string'` field (D-04, not locale-object) — this is the *one* field in the new schema that should NOT copy the `localeStringField` pattern, unlike everything in `siteSettings.ts`.
- `slug` is new (no precedent in `siteSettings.ts` — use `type: 'slug', options: {source: 'title'}`, standard Sanity pattern, not project-specific).
- `statement` should reuse the `localeTextField` helper pattern (lines 19-29 of `siteSettings.ts`) verbatim — same shape as `welcomeBody`/`footerText`.
- `images` is the new array field — see Pattern 1 in RESEARCH.md (already extracted below in Shared Patterns).
- `orderRankField({type: 'gallery'})` from `@sanity/orderable-document-list` — no in-repo precedent (new library), copy RESEARCH.md's Pattern 2 example directly.

**Concrete starting point (from RESEARCH.md Pattern 2, cross-checked against `siteSettings.ts`'s `defineField`/`validation` idioms):**
```typescript
import {defineField, defineType} from 'sanity'
import {orderRankField} from '@sanity/orderable-document-list'

export const gallery = defineType({
  name: 'gallery',
  title: 'Gallery',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'slug', title: 'Slug', type: 'slug', options: {source: 'title'}, validation: (r) => r.required()}),
    localeTextField('statement', 'Artist Statement'), // copy localeTextField from siteSettings.ts
    defineField({
      name: 'images',
      title: 'Gallery Images',
      type: 'array',
      of: [{type: 'galleryImage'}],
      validation: (rule) => rule.min(1).error('A gallery needs at least one image (D-09: first image is the cover).'),
      options: {layout: 'grid'},
    }),
    orderRankField({type: 'gallery'}),
  ],
  preview: {
    select: {title: 'title', media: 'images.0.image'},
  },
})
```

---

### `sanity/schemas/index.ts` (config, MODIFIED)

**Analog:** itself (currently 3 lines)

**Current content (full file, to extend):**
```typescript
import {siteSettings} from './siteSettings'

export const schemaTypes = [siteSettings]
```

**Pattern to apply:** add `import {gallery} from './gallery'` and `import {galleryImage} from './objects/galleryImage'` (if `galleryImage` is a standalone reusable object type, it must also be registered in `schemaTypes`, same as `gallery` — Sanity requires every referenced object/document type to be present in the schema array, not just documents). Append both to the exported array: `export const schemaTypes = [siteSettings, gallery, galleryImage]`.

---

### `sanity/schemas/structure.ts` (config, MODIFIED)

**Analog:** itself (currently 19 lines)

**Current content (full file, to extend):**
```typescript
import type {StructureResolver} from 'sanity/structure'

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Site Settings')
        .id('siteSettings')
        .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
      ...S.documentTypeListItems().filter((listItem) => listItem.getId() !== 'siteSettings'),
    ])
```

**Pattern to apply (from RESEARCH.md Pattern 2):** the `StructureResolver` signature gains a second `context` parameter, and the spread of `S.documentTypeListItems()` must also filter out `'gallery'` (since it gets its own explicit orderable list item) alongside the existing `'siteSettings'` filter:
```typescript
import type {StructureResolver} from 'sanity/structure'
import {orderableDocumentListDeskItem} from '@sanity/orderable-document-list'

export const structure: StructureResolver = (S, context) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Site Settings')
        .id('siteSettings')
        .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
      orderableDocumentListDeskItem({type: 'gallery', S, context}),
      ...S.documentTypeListItems().filter(
        (listItem) => !['siteSettings', 'gallery'].includes(listItem.getId() ?? ''),
      ),
    ])
```
Also apply Pitfall 4 from RESEARCH.md: hide `orderRank` from the document edit form (via the field's `hidden` option in `gallery.ts`, not here) so Romane never sees the raw field.

---

### `src/lib/sanity.ts` (service, request-response, MODIFIED)

**Analog:** its own existing `getSiteSettings()` (same file — this is a same-file, additive pattern, not a copy-from-elsewhere pattern)

**Imports pattern already established** (lines 1, unchanged):
```typescript
import {createClient} from '@sanity/client'
```

**Client singleton — do not duplicate, import and reuse** (lines 23-29, unchanged, new code just adds functions below it):
```typescript
export const sanityClient = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2024-01-01',
  useCdn: !token,
})
```

**Interface + query + fetch-function pattern to replicate** (lines 31-63, the exact shape `getGalleries`/`getGallery` must follow):
```typescript
/** A string with both French and English values (D-09 locale-object shape). */
export interface LocaleString {
  fr: string
  en: string
}

/** The published `siteSettings` singleton, typed for both locales. */
export interface SiteSettings {
  siteTitle: LocaleString
  navLabels: {
    home: LocaleString
  }
  footerText: LocaleString
  welcomeHeading: LocaleString
  welcomeBody: LocaleString
}

const SITE_SETTINGS_QUERY = /* groq */ `*[_type == "siteSettings"][0]{
  siteTitle,
  navLabels,
  footerText,
  welcomeHeading,
  welcomeBody
}`

/**
 * Fetches the published `siteSettings` singleton at build time.
 * Returns `null` if the document has not been published yet.
 */
export async function getSiteSettings(): Promise<SiteSettings | null> {
  const result = await sanityClient.fetch<SiteSettings | null>(SITE_SETTINGS_QUERY)
  return result ?? null
}
```

**Concrete new code to add (from RESEARCH.md Code Examples, already matches this exact analog shape):**
```typescript
export interface GalleryImage {
  image: {asset: {_ref: string}; hotspot?: {x: number; y: number; height: number; width: number}}
  alt: LocaleString
}

export interface Gallery {
  title: string       // D-04: not locale-aware
  slug: string
  statement: LocaleString
  images: GalleryImage[]  // D-09: images[0] is always the cover
}

const GALLERIES_QUERY = /* groq */ `*[_type == "gallery"] | order(orderRank) {
  title, "slug": slug.current, statement, images
}`

const GALLERY_BY_SLUG_QUERY = /* groq */ `*[_type == "gallery" && slug.current == $slug][0]{
  title, "slug": slug.current, statement, images
}`

export async function getGalleries(): Promise<Gallery[]> {
  return sanityClient.fetch<Gallery[]>(GALLERIES_QUERY)
}

export async function getGallery(slug: string): Promise<Gallery | null> {
  const result = await sanityClient.fetch<Gallery | null>(GALLERY_BY_SLUG_QUERY, {slug})
  return result ?? null
}
```

**Null-safety pattern to carry into pages consuming these (WR-03 precedent, from `BaseLayout.astro` lines 22-25):**
```typescript
const siteTitle = siteSettings?.siteTitle?.[locale] ?? 'Atelier Jacqueline Suzanne';
```
Every read of `gallery.statement?.[locale]`, `gallery.title`, etc. in the new pages/components must use the same optional-chaining + fallback idiom — never assume a Studio-populated document is fully non-null.

---

### `src/lib/image.ts` (utility, transform — new file, no strong in-repo precedent)

**Analog:** none for the CDN-URL-builder behavior itself (first use of `@sanity/image-url` in this repo); `src/lib/i18n-paths.ts` is the closest structural analog for "small, pure-function utility module with named exports, no side effects, no class."

**Module-shape pattern to copy from `i18n-paths.ts`** (lines 1-2, 21-23 — top-of-file import + a documented pure function):
```typescript
import { getRelativeLocaleUrl } from 'astro:i18n';

export function stripBasePath(path: string, base: string): string {
  return base !== '/' && path.startsWith(base) ? path.slice(base.length - 1) : path;
}
```
Apply the same "documented, standalone, named-export pure function" shape to `thumbnailUrl`/`fullSizeUrl`.

**Concrete new code (from RESEARCH.md Code Examples, cross-checked against `src/lib/sanity.ts` for the `sanityClient` import path):**
```typescript
import createImageUrlBuilder from '@sanity/image-url'
import {sanityClient} from './sanity'
import type {GalleryImage} from './sanity'

const builder = createImageUrlBuilder(sanityClient)

/** 1:1 square crop for grid thumbnails (UI-SPEC: gallery listing + detail grids). */
export function thumbnailUrl(img: GalleryImage['image'], size = 600): string {
  return builder.image(img).width(size).height(size).fit('crop').auto('format').url()!
}

/** Full-size, uncropped (UI-SPEC: lightbox uses object-fit: contain, never cropped). */
export function fullSizeUrl(img: GalleryImage['image'], maxWidth = 2000): string {
  return builder.image(img).width(maxWidth).fit('max').auto('format').url()!
}
```

---

### `src/pages/galleries/index.astro` / `src/pages/en/galleries/index.astro` (route, request-response)

**Analog:** `src/pages/index.astro` / `src/pages/en/index.astro` (the FR/EN pair pattern — Pitfall 2 in RESEARCH.md explicitly requires copying this exact two-file structure, NOT a `[locale]` dynamic segment)

**Full FR analog file** (`src/pages/index.astro`, all 42 lines) — copy this frontmatter shape (import `BaseLayout`, import a `lib` query function, call it, read locale-keyed fields with `?? ''` fallback) directly:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { getSiteSettings } from '../lib/sanity';

const siteSettings = await getSiteSettings();
const welcomeHeading = siteSettings?.welcomeHeading?.fr ?? '';
const welcomeBody = siteSettings?.welcomeBody?.fr ?? '';
---

<BaseLayout title="Atelier Jacqueline Suzanne">
  <div class="welcome">
    <h1>{welcomeHeading}</h1>
    <p>{welcomeBody}</p>
  </div>
</BaseLayout>
```
Replace `getSiteSettings()` with `getGalleries()`, replace the single-item template with `<GalleryGrid>`/`<GalleryCard>` iteration, keep the `BaseLayout` wrapper and relative-import-path convention (`../lib/sanity` for FR at `src/pages/galleries/index.astro`, `../../lib/sanity` for EN at `src/pages/en/galleries/index.astro`, exactly mirroring how `src/pages/en/index.astro` uses `../../layouts/BaseLayout.astro` and `../../lib/sanity` — one extra `../` level per nesting depth).

**EN analog file's only difference from FR** (`src/pages/en/index.astro` lines 4-9): import path depth (`../../`) and reading `.en` instead of `.fr` off the same locale-object fields — confirms the "two files, same query function, differ only in which locale key is read" pattern RESEARCH.md's Pitfall 2 describes.

---

### `src/pages/galleries/[slug].astro` / `src/pages/en/galleries/[slug].astro` (route, request-response, dynamic)

**Analog:** No existing `getStaticPaths` file exists in this repo yet — this is the first dynamic route. Closest available precedents: `src/pages/index.astro`/`en/index.astro` for the BaseLayout+query-function shape, and `src/pages/404.astro` for a page with more complex/sectioned body content and locale-aware helper calls (`getRelativeLocaleUrl`).

**Pattern to combine:**
1. From `index.astro`: the `BaseLayout` + `lib/sanity` query-function frontmatter shape.
2. New (no in-repo precedent, use RESEARCH.md's guidance directly): `getStaticPaths()` must call `getGalleries()` and map each gallery to `{params: {slug: gallery.slug}}`, then the page component reads `Astro.props`/`Astro.params.slug` to call `getGallery(slug)` — OR fetch all galleries once in `getStaticPaths` and pass the full gallery object as `props` to avoid a second per-page fetch (either is valid; RESEARCH.md doesn't mandate one specific pattern here, follow whichever the planner's actual GROQ/typing setup makes cleaner).
3. From `404.astro` (lines 6-16): the `getRelativeLocaleUrl` import/usage convention for any nav links within the page (e.g., "back to galleries" link), and the general precedent of a page needing more than one templated section.

**Slug-recovery pitfall (RESEARCH.md Pitfall 3):** `slug` is a single non-locale field on the `gallery` document — do NOT build a new locale-aware slug-lookup; reuse `getSwitcherHref`'s existing shared-slug logic (`src/lib/i18n-paths.ts`) unchanged for the gallery detail page's language switcher behavior (the switcher itself is the existing `LanguageSwitcher.astro` component, unmodified).

---

### `src/components/GalleryCard.astro` / `GalleryGrid.astro` (component, transform)

**Analog:** `src/components/LanguageSwitcher.astro` (only existing component — copy its three-part shape: TypeScript frontmatter accepting typed props/data, semantic HTML template, scoped `<style>` block using the project's CSS custom-property tokens)

**Frontmatter/props shape to copy** (lines 1-9 pattern — import a lib helper, derive template variables, no props interface declared yet in this repo but the convention of typed, minimal frontmatter is established):
```astro
---
import { getSwitcherHref } from '../lib/i18n-paths';

const currentLocale = Astro.currentLocale === 'en' ? 'en' : 'fr';
const frHref = getSwitcherHref(Astro.url.pathname, 'fr');
const enHref = getSwitcherHref(Astro.url.pathname, 'en');
---
```
For `GalleryCard.astro`, the equivalent shape imports `thumbnailUrl` from `../lib/image` and accepts a `gallery: Gallery` prop (define an `interface Props` block, following `BaseLayout.astro`'s existing `interface Props { title: string }` convention at lines 10-12 of `BaseLayout.astro`, not `LanguageSwitcher.astro` which has no props).

**Scoped `<style>` token usage to copy** (from `LanguageSwitcher.astro` lines 26-64, and `BaseLayout.astro`'s `:root` custom properties): every new component's `<style>` block must reference `var(--space-*)`, `var(--color-*)` tokens — never hardcoded hex/px values — matching this project's established CSS custom-property convention. Note per UI-SPEC.md, `BaseLayout.astro`'s `:root` block itself needs updating this phase (new Dawn Pink/Woodsmoke/Wild Strawberry tokens, `--color-ink` split from `--color-accent`, Delight font-face) — new components should reference the *new* token names (`--color-ink`, `--color-accent` now meaning Wild Strawberry, plus any new `--font-display`/weight tokens), not the Phase 1 grayscale values.

**Accessible link-with-visually-hidden-suffix pattern (new this phase, no existing precedent — build per UI-SPEC copy contract):** the whole gallery card is a link; visible text is the title only, with an `sr-only`-style visually-hidden span appending "— Voir la galerie"/"— View gallery" to the accessible name. No existing `.sr-only` utility class exists in the repo yet — this needs to be introduced (likely in `BaseLayout.astro`'s global styles, following the existing `<style is:global>` block at lines 78-125) or scoped locally to `GalleryCard.astro`.

---

### `src/components/Lightbox.astro` (component + island, event-driven)

**Analog:** `src/components/LanguageSwitcher.astro` (only existing `<script>`-tag island in the repo — same "vanilla JS, no framework, no `client:*` directive needed because it's a plain `<script>` not a hydrated framework component" pattern)

**Island script structure to copy** (lines 66-90, the exact shape: `document.querySelectorAll` + `addEventListener`, no imports beyond what's inlined, `import.meta.env.BASE_URL` available if needed):
```astro
<script>
  const COOKIE_NAME = 'ajs_locale';
  const base = import.meta.env.BASE_URL ?? '/';
  const cookiePath = base.endsWith('/') ? base : `${base}/`;

  document
    .querySelectorAll<HTMLAnchorElement>('.language-switcher .switcher-link')
    .forEach((link) => {
      link.addEventListener('click', () => {
        const locale = link.dataset.locale;
        if (locale) {
          document.cookie = `${COOKIE_NAME}=${locale}; path=${cookiePath}; max-age=31536000; SameSite=Lax; Secure`;
        }
      });
    });
</script>
```
Apply the same "plain `<script>`, `document.querySelectorAll`/`getElementById`, typed via inline generics, no framework" idiom to the lightbox's `<dialog>` wiring (RESEARCH.md Pattern 3's example is already written in this exact style — use it directly):
```html
<dialog id="lightbox" aria-label="Image viewer">
  <button type="button" data-action="close" aria-label="Close">…</button>
  <button type="button" data-action="prev" aria-label="Previous image">…</button>
  <img data-role="lightbox-image" alt="" />
  <button type="button" data-action="next" aria-label="Next image">…</button>
  <p data-role="counter" aria-live="polite"></p>
</dialog>
<script>
  const dialog = document.getElementById('lightbox') as HTMLDialogElement;
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') showPrev();
    if (e.key === 'ArrowRight') showNext();
  });
</script>
```
Plus the touch-swipe handler (RESEARCH.md Code Examples section, ~15 lines, `touchstart`/`touchend` with a 50px threshold) — copy verbatim as a starting point, tune the threshold during manual device testing per RESEARCH.md's Assumption A1.

**No error-handling precedent needed:** per UI-SPEC.md's Copywriting Contract, broken lightbox images intentionally use the browser's native broken-image fallback — no custom error state to build (YAGNI, explicitly called out).

---

### `tests/unit/*.test.ts` (test, request-response/data)

**Analog:** `tests/unit/i18n-paths.test.ts` (full file, 51 lines)

**Structure to copy** (lines 1-8, describe/it shape, direct import of the function under test):
```typescript
import { describe, expect, it } from 'vitest';
import { getSwitcherHref, stripBasePath } from '../../src/lib/i18n-paths';

describe('getSwitcherHref', () => {
  it('maps the French homepage to the English homepage', () => {
    expect(getSwitcherHref('/', 'en')).toBe('/en/');
  });
  // ...
});
```
Apply the same shape to any pure-function tests for `getGallery`/`getGalleries` null-safety (mirrors WR-03's pattern per RESEARCH.md's Req→Test mapping) and to `thumbnailUrl`/`fullSizeUrl` URL-construction assertions if the planner scopes unit tests for `src/lib/image.ts`.

---

### `tests/e2e/*.spec.ts` (test, event-driven)

**Analog:** `tests/e2e/i18n.spec.ts` (full file, 85 lines)

**Structure to copy** (lines 1-18, `test.describe`/`test` shape, `page.goto`/`page.locator`/`expect` idiom):
```typescript
import { test, expect } from '@playwright/test';

test.describe('locale content', () => {
  test('French chrome and placeholder homepage render at "/"', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.locator('header')).toBeVisible();
  });
});
```
This is the direct analog for the highest-value test in this phase (per RESEARCH.md): lightbox open/navigate/close/focus-return. Follow the same `test.describe` grouping-by-feature convention (`i18n.spec.ts` groups by `'locale content'` / `'switcher'` — a galleries spec should group by `'gallery listing'` / `'gallery detail'` / `'lightbox'`).

---

### `src/layouts/BaseLayout.astro` (component, MODIFIED — design-token + nav-label update)

**Analog:** itself (currently 185 lines)

**`:root` token block to replace** (lines 79-91):
```css
:root {
  --color-dominant: #ffffff;
  --color-secondary: #f5f4f2;
  --color-accent: #1a1a1a;
  --color-destructive: #dc2626;

  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  --space-3xl: 64px;
}
```
Per UI-SPEC.md Revision Note: replace with Dawn Pink (`#F0E7E4`) dominant, `#E4D9D0` secondary, Wild Strawberry (`#F92D97`) accent, new `--color-ink: #141213` (Woodsmoke, split from accent), `--color-destructive: #dc2626` unchanged. Spacing scale is unchanged (keep as-is). Add `font-family: 'Delight', ...` `@font-face`/body rule per UI-SPEC's font section (lines 41-49 of `02-UI-SPEC.md`).

**Nav-label extension pattern** (lines 63-68, existing single nav link):
```astro
<nav class="site-nav" aria-label="Primary">
  <a href={homeHref} class="nav-link">{homeLabel}</a>
</nav>
```
Add a second `<a>` for the galleries link, reading `siteSettings?.navLabels?.galleries?.[locale]` (new `navLabels.galleries` field, added to the `siteSettings` schema/interface following the exact `home` field pattern — `sanity/schemas/siteSettings.ts` lines 44-54 and `src/lib/sanity.ts`'s `SiteSettings.navLabels` interface, lines 40-42).

---

## Shared Patterns

### Locale-object field shape (`{fr, en}`, both required)
**Source:** `sanity/schemas/siteSettings.ts` lines 7-29 (`localeStringField`/`localeTextField` helpers)
**Apply to:** `gallery.ts`'s `statement` field (use `localeTextField`), `galleryImage.ts`'s `alt` field (use `localeStringField`-equivalent), `siteSettings.navLabels.galleries` (use `localeStringField`, matching the existing `home` sub-field exactly).
```typescript
function localeStringField(name: string, title: string) {
  return defineField({
    name, title, type: 'object',
    fields: [
      defineField({name: 'fr', title: 'French', type: 'string', validation: (rule) => rule.required()}),
      defineField({name: 'en', title: 'English', type: 'string', validation: (rule) => rule.required()}),
    ],
  })
}
```

### Build-time-only Sanity client + typed query function
**Source:** `src/lib/sanity.ts` (entire file, especially lines 23-29 client singleton and lines 60-63 fetch function shape)
**Apply to:** All new `src/lib/sanity.ts` additions (`getGalleries`, `getGallery`) and `src/lib/image.ts` (imports `sanityClient` from the same module, never creates a second client).

### Optional-chaining + fallback defensive read (WR-03)
**Source:** `src/layouts/BaseLayout.astro` lines 23-25
**Apply to:** Every locale-keyed field read in the new gallery pages/components (`gallery.statement?.[locale] ?? ''`, `siteSettings?.navLabels?.galleries?.[locale] ?? fallback`) — a document that exists but is only partially populated (e.g., mid-edit in Studio) must never crash the static build.

### Manual per-locale file duplication (not `[locale]` dynamic segment)
**Source:** `src/pages/index.astro` + `src/pages/en/index.astro` pair (RESEARCH.md Pitfall 2 makes this explicit and mandatory)
**Apply to:** `galleries/index.astro`+`en/galleries/index.astro`, `galleries/[slug].astro`+`en/galleries/[slug].astro`. Both files in each pair call the identical `lib/sanity.ts` function; only import-path depth and which `{fr, en}` key is read differ.

### Vanilla-`<script>` island, no framework, no `client:*` directive
**Source:** `src/components/LanguageSwitcher.astro` lines 66-90
**Apply to:** `Lightbox.astro`'s dialog-open/prev/next/keyboard/touch-swipe wiring. This project has zero `@astrojs/react`/`@astrojs/preact` dependency (confirmed in `package.json`) — do not introduce one for the lightbox.

### CSS custom-property tokens, scoped `<style>` blocks
**Source:** `src/layouts/BaseLayout.astro` `:root` block (lines 79-91, to be updated this phase per UI-SPEC) + `src/components/LanguageSwitcher.astro`'s scoped `<style>` (lines 26-64)
**Apply to:** All new components (`GalleryCard.astro`, `GalleryGrid.astro`, `Lightbox.astro`) — reference `var(--color-*)`/`var(--space-*)` tokens exclusively, never hardcoded values, and use the *new* Phase 2 token values/names (`--color-ink`, Wild Strawberry accent) once `BaseLayout.astro` is updated.

### `getRelativeLocaleUrl()` for every internal link
**Source:** `src/layouts/BaseLayout.astro` line 26, `src/pages/404.astro` lines 15-16
**Apply to:** Any "back to galleries" / "back home" links inside new gallery pages — never a literal href string (breaks under a non-root `base`, per CR-01's documented regression class).

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/pages/galleries/[slug].astro` / `en/galleries/[slug].astro` | route | request-response (dynamic, `getStaticPaths`) | No dynamic route exists yet in this repo (Phase 1 shipped only static homepage/404 pages) — planner should follow RESEARCH.md's Architecture Patterns/Code Examples sections directly (`getStaticPaths()` + `getGalleries()`), combined with the static-route structural conventions from `index.astro` listed above. |
| `src/lib/image.ts` | utility | transform | First use of `@sanity/image-url` in this repo — no prior URL-builder code exists. Use RESEARCH.md's Code Examples section verbatim as the starting implementation. |
| `sanity/schemas/gallery.ts` orderable-list wiring (`orderRankField`, `orderableDocumentListDeskItem`) | model/config | CRUD | `@sanity/orderable-document-list` is a brand-new dependency this phase — no in-repo precedent. Use RESEARCH.md's Pattern 2 example directly (sourced from the plugin's official README). |

## Metadata

**Analog search scope:** `src/`, `sanity/`, `tests/` (entire repo minus `node_modules`/`.sanity` build artifacts) — this is a small, single-prior-phase codebase, so the search was exhaustive rather than sampled.
**Files scanned:** 15 non-node_modules source/schema/test files (full inventory: `sanity/schemas/{index,siteSettings,structure}.ts`, `src/components/LanguageSwitcher.astro`, `src/layouts/BaseLayout.astro`, `src/lib/{i18n-paths,sanity}.ts`, `src/pages/{404,index}.astro`, `src/pages/en/index.astro`, `tests/unit/i18n-paths.test.ts`, `tests/e2e/i18n.spec.ts`, plus config files `astro.config.mjs`, `package.json`, `sanity/package.json`).
**Pattern extraction date:** 2026-07-06
