# Phase 24: Cross-Linking & Contact CTA - Pattern Map

**Mapped:** 2026-08-26
**Files analyzed:** 8 (new/modified)
**Analogs found:** 8 / 8 (all are direct same-repo mirrors — this phase is a "mirror an existing shipped pattern" phase, not a novel-pattern phase)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|-----------------|----------------|
| `sanity/schemas/gallery.ts` (+ `relatedEdition` field) | config/schema | CRUD (editorial content field) | `sanity/schemas/edition.ts` lines 76-84 (`relatedGallery` field) | exact — same field, reversed direction |
| `src/lib/sanity.ts` (`GALLERIES_QUERY` + `GALLERY_BY_SLUG_QUERY`, + relatedEdition projection) | service (build-time data fetch) | CRUD / request-response (GROQ read) | Same file, `EDITIONS_QUERY`/`EDITION_BY_SLUG_QUERY` lines 220-226 (`relatedGallery->{...}` projection) | exact |
| `src/lib/sanity-validation.ts` (`sanitizeGalleryDocument`, + `sanitizeEditionDocument` exclusion) | utility (validation/transform) | transform | Same file, `sanitizeEditionDocument()` lines 256-309, esp. 270-278 (defensive dereference) and 292-297 (exclusion destructure) | exact |
| `src/lib/related-gallery.ts` OR new `related-edition.ts` (reverse helper, `getRelatedEditionLink`) | utility (pure transform) | transform | `src/lib/related-gallery.ts` (whole file, 45 lines) — `getRelatedGalleryLink()` | exact |
| `src/lib/page-models.ts` (`buildGalleryDetailModel`, + `relatedLink` prop) | service (render-model builder) | transform | Same file, `buildEditionDetailModel()` lines 239-310, esp. line 286 (`getRelatedGalleryLink` call) and line 215 (`relatedLink` interface field) | exact |
| `src/components/GalleryDetailBody.astro` (+ `.gallery-detail__related` render, top; + CONT-04 CTA render, bottom) | component | request-response (server-rendered static markup) | `src/components/EditionDetailBody.astro` lines 26-31 (props), 96-100 (related-link render), 110-162 (styles) | exact |
| `src/components/EditionDetailBody.astro` (+ CONT-04 CTA render, bottom only) | component | request-response | Sketch `.planning/sketches/018-gallery-edition-contact-cta/index.html` (Variant B) + UI-SPEC.md's already-adapted CSS/markup | exact (spec-provided) |
| `tests/unit/*.test.ts` + `tests/e2e/gallery.spec.ts` / `edition.spec.ts` (extend) | test | — | `tests/unit/edition-query.test.ts` (relatedGallery assertions, lines ~189-246); `tests/e2e/edition.spec.ts` "editions related-gallery cross-link (EDN-08)" describe block (~line 623-670) | exact |

## Pattern Assignments

### `sanity/schemas/gallery.ts` (config, add `relatedEdition` field)

**Analog:** `sanity/schemas/edition.ts` (`relatedGallery` field)

```typescript
// sanity/schemas/edition.ts lines 76-84 — mirror exactly, reversed reference type
defineField({
  name: 'relatedGallery',
  title: 'Collection photo liée (optionnel)',
  type: 'reference',
  group: 'relatedCollection',
  to: [{type: 'gallery'}],
  description:
    'Lien optionnel vers la collection Portfolio qui présente les mêmes photographies, lorsqu\'elle existe. Exemple : l\'édition « Rebut » (le livre imprimé) et la collection photo « Rebut » sont le même sujet — renseigner ce champ affiche un lien vers la collection sur la page de l\'édition. Laisser vide s\'il n\'existe pas de collection correspondante.',
}),
```
Reverse field on `gallery.ts`: `name: 'relatedEdition'`, `to: [{type: 'edition'}]`, description swapped to describe linking a gallery to its édition. Note `gallery.ts`'s existing `groups` array (read at file top) does NOT currently have a `relatedCollection` group like `edition.ts` does — add one (or reuse an existing group) since `defineField`'s `group` must reference a declared group id.

---

### `src/lib/sanity.ts` (GROQ projections)

**Analog:** same file, `EDITIONS_QUERY` / `EDITION_BY_SLUG_QUERY`

```typescript
// src/lib/sanity.ts lines 220-226
const EDITIONS_QUERY = /* groq */ `*[_type == "edition" && ${PUBLISHED_EDITION_FILTER}] | order(orderRank) {
  _id, title, "slug": slug.current, statement, ${IMAGES_WITH_DIMENSIONS_PROJECTION}, pageCount, printRun, dimensions, publicationStatus, relatedGallery->{title, "slug": slug.current}
}`;
```
Add `relatedEdition->{title, "slug": slug.current}` to the field list of both `GALLERIES_QUERY` (line 173) and `GALLERY_BY_SLUG_QUERY` (line 177). Per RESEARCH.md Pitfall 2, `GALLERIES_QUERY` is the one that actually gates rendering (pages build from `getGalleries()`, not `getGallery()`) — but mirror both for API parity exactly as the édition side does.

Existing gallery-side type comment for reference (lines 204-207):
```typescript
// the `relatedGallery` reference field (sanity/schemas/edition.ts). Null
relatedGallery?: { title: string; slug: string } | null
```
Add the mirrored `relatedEdition?: { title: string; slug: string } | null` to the `Gallery` interface.

---

### `src/lib/sanity-validation.ts` (`sanitizeGalleryDocument`, + edition exclusion)

**Analog:** same file, `sanitizeEditionDocument()` lines 256-309

**Defensive dereference pattern** (lines 270-278):
```typescript
const relatedRecord = asRecord(record.relatedGallery)
const relatedTitle = nonEmptyString(relatedRecord?.title)
const relatedSlug = nonEmptyString(relatedRecord?.slug)
const relatedGallery =
  relatedTitle && relatedSlug
    ? {title: relatedTitle, slug: relatedSlug}
    : record.relatedGallery === null
      ? null
      : undefined
```
Add the mirrored block for `relatedEdition` inside `sanitizeGalleryDocument()` (starts line 201), with a matching `issue('relatedEdition.removed', value)` push (mirrors line 288-290) when a non-null reference fails to resolve.

**CRITICAL — exclusion list to update** (lines 292-297, Pitfall 1 from RESEARCH.md):
```typescript
const {heroColor: _heroColor, isVisible: _isVisible, showOnHomePage: _showOnHomePage, seo: _seo, ...shared} =
  base.value
void _heroColor
void _isVisible
void _showOnHomePage
void _seo
```
Must add `relatedEdition: _relatedEdition` to this destructure (+ `void _relatedEdition`) in the SAME commit that adds `relatedEdition` sanitization to `sanitizeGalleryDocument`, otherwise `sanitizeEditionDocument`'s spread of `...shared` leaks a stray `relatedEdition` field onto `Edition` documents, which have no such field.

---

### `src/lib/related-gallery.ts` (or new `related-edition.ts`) — reverse link helper

**Analog:** `src/lib/related-gallery.ts` (whole file — 45 lines, read completely above)

```typescript
import { getRelativeLocaleUrl } from 'astro:i18n';

export interface RelatedGalleryLink {
  href: string;
  text: string;
}

type RelatedGallery = { title: string; slug: string } | null | undefined;

export function getRelatedGalleryLink(
  relatedGallery: RelatedGallery,
  locale: 'fr' | 'en',
): RelatedGalleryLink | null {
  if (!relatedGallery) return null;

  const { title, slug } = relatedGallery;
  if (!title?.trim() || !slug?.trim()) return null;

  const href = getRelativeLocaleUrl(locale, `galleries/${slug}`);
  const text =
    locale === 'fr'
      ? `Voir la collection « ${title} »`
      : `View the "${title}" collection`;

  return { href, text };
}
```
Reverse function `getRelatedEditionLink()`: swap `galleries/${slug}` → `editions/${slug}`; copy per UI-SPEC.md Copywriting Contract:
- FR: `Voir l'édition « ${title} »`
- EN: `View the "${title}" edition`

Per RESEARCH.md Pitfall 5 and CONTEXT.md's Claude's-Discretion note: either (a) generalize this file into a bidirectional module with a renamed direction-neutral type `RelatedLink` (requires updating `page-models.ts` line 215's `RelatedGalleryLink` annotation on `EditionDetailModel.relatedLink`), or (b) ship a parallel `related-edition.ts` file with its own `RelatedEditionLink` type, duplicating ~30 lines. Either is acceptable; the exclusion is design-level, not required by this pattern map.

Test analog: `tests/unit/related-gallery.test.ts` (existing) — mirrors the `null`/malformed-input assertions to extend or replicate for the reverse helper.

---

### `src/lib/page-models.ts` (`buildGalleryDetailModel`, + `relatedLink` prop)

**Analog:** same file, `buildEditionDetailModel()` (starts line 239) and `EditionDetailModel` interface (lines 200-217)

**Imports** (lines 11-12):
```typescript
import {getRelatedGalleryLink} from './related-gallery';
import type {RelatedGalleryLink} from './related-gallery';
```

**Interface field to mirror** (line 215):
```typescript
relatedLink: RelatedGalleryLink | null;
```

**Call site to mirror** (line 286):
```typescript
const relatedLink = getRelatedGalleryLink(edition.relatedGallery, locale);
```
...then included in the returned object (line 305): `relatedLink,`

`buildGalleryDetailModel()` (starts line 107, returns `GalleryDetailModel` — note: today's `GalleryDetailModel` return object, lines 179-197, has NO `relatedLink` field at all; add both the field to whatever interface backs `GalleryDetailModel` and the `getRelatedEditionLink(gallery.relatedEdition, locale)` call + return-object inclusion, following the exact same shape as the édition-side mirror above).

---

### `src/components/GalleryDetailBody.astro` (top: related link; bottom: CTA)

**Analog for top related-link:** `src/components/EditionDetailBody.astro` lines 26-31 (props), 96-100 (render), 110-162 (styles)

**Props pattern** (lines 26-31):
```typescript
relatedLink: { href: string; text: string } | null;
```

**Render pattern** (lines 96-100), positioned right after the content div opens, before `GalleryGrid`:
```astro
{relatedLink && (
  <a class="edition-detail__related" href={relatedLink.href}>
    {relatedLink.text}
  </a>
)}
```

**CSS pattern to copy verbatim, renamed** (lines 119-150 for the class, plus 152-161 for the mobile override) — UI-SPEC.md's Component Contract for EDN-12 already gives the exact renamed `.gallery-detail__related` CSS block to use (byte-for-byte copy of `.edition-detail__related`), see UI-SPEC.md lines 102-139.

**Analog for bottom CTA (both files):** UI-SPEC.md's "Component Contract: Contact CTA (CONT-04)" section (lines 151-227) is the authoritative, already-adapted reference implementation (sourced from sketch 018 Variant B) — read that directly rather than re-deriving from the raw sketch file. Key excerpt:
```astro
<div class="gallery-detail__contact-cta-zone">
  <div class="gallery-detail__contact-cta-rule"></div>
  <a class="gallery-detail__contact-cta" href={getRelativeLocaleUrl(locale, 'contact')}>
    Intéressé·e par une pièce ? Contactez-nous
    <span class="gallery-detail__contact-cta-arrow" aria-hidden="true">→</span>
  </a>
</div>
```
Placement: immediately after `GalleryGrid`'s render, before `.gallery-detail__content`'s closing `</div>` (current file, line 70-71) — renders unconditionally, no `{...&&...}` guard (unlike the related-link).

Current file's existing content div (lines 69-71) to extend:
```astro
<div class="gallery-detail__content">
  {gridItems.length > 0 && <GalleryGrid items={gridItems} layout="masonry" />}
</div>
```
Also: the stale doc-comment at lines 51-52 ("gallery-only footer hide...") should be corrected or removed per RESEARCH.md Pitfall 4 — `hideFooter` is not actually wired for gallery pages today (verify against `GalleryDetailPage.astro`, not this comment).

---

### `src/components/EditionDetailBody.astro` (bottom: CTA only)

**Analog:** UI-SPEC.md's CONT-04 Component Contract (same as above), applied with `edition-detail__contact-cta*` class names instead of `gallery-detail__contact-cta*`. Insert immediately after the existing `{gridItems.length > 0 && <GalleryGrid .../>}` line (current file, line 105), before the closing `</div>` of `.edition-detail__content` (line 106). The existing top `relatedLink` render (lines 96-100) and its `.edition-detail__related` styles (lines 119-150) are untouched.

---

## Shared Patterns

### Locale-aware, base-path-safe hrefs
**Source:** `src/lib/related-gallery.ts` line 1, 37 — `import { getRelativeLocaleUrl } from 'astro:i18n'`, `getRelativeLocaleUrl(locale, 'path')`
**Apply to:** the new `getRelatedEditionLink()` helper AND the CONT-04 CTA's `/contact/` href in both body components (`getRelativeLocaleUrl(locale, 'contact')`, not a literal string) — required to pass CI's un-prefixed-link grep guard on GitHub Pages (`ASTRO_BASE: /ajs-website/`).

### Defensive-null cross-link rendering
**Source:** `src/lib/related-gallery.ts` (`if (!title?.trim() || !slug?.trim()) return null`) + `src/components/EditionDetailBody.astro` line 96 (`{relatedLink && (...)}`)
**Apply to:** `getRelatedEditionLink()` and `GalleryDetailBody.astro`'s new top-of-content render — a gallery with no `relatedEdition`, or a malformed/unpublished dereference, must render nothing, never a broken link (D-02).

### Combined hover/focus-visible styling
**Source:** `src/components/EditionDetailBody.astro` lines 145-150 (`.edition-detail__related:hover, .edition-detail__related:focus-visible { color: var(--color-accent); outline: 2px solid var(--color-accent); outline-offset: var(--focus-ring-offset); }`)
**Apply to:** both the new `.gallery-detail__related` (identical rule, renamed) and the new CONT-04 CTA's `:hover, :focus-visible` combined selector (UI-SPEC.md already specifies this addition beyond the raw sketch, which only had `:hover`) — site convention pairs hover and focus-visible everywhere, never hover alone.

### Shared base-sanitizer with per-type field exclusion
**Source:** `src/lib/sanity-validation.ts` lines 256-297 — `sanitizeEditionDocument()` calls `sanitizeGalleryDocument()` as its base then destructures out gallery-only fields
**Apply to:** any new gallery-only field (`relatedEdition`) added to the shared base sanitizer MUST be added to this exclusion destructure in the same change (Pitfall 1) — this is the single highest-risk correctness pattern in the phase.

### Sanity `reference` field, optional, unidirectional
**Source:** `sanity/schemas/edition.ts` lines 76-84 (`relatedGallery`)
**Apply to:** `gallery.ts`'s new `relatedEdition` field — same shape (`type: 'reference'`, `to: [{type: '<other-doc-type>'}]`, no `validation` rule, French editorial `description`).

## No Analog Found

None. All 8 files/changes in this phase have exact, same-repo, already-shipped analogs — this is a deliberate "mirror an existing pattern" phase per CONTEXT.md D-01 and RESEARCH.md's Summary ("almost entirely a mirror what already exists exercise").

## Metadata

**Analog search scope:** `src/lib/`, `src/components/`, `sanity/schemas/`, `tests/unit/`, `tests/e2e/` — files identified directly from CONTEXT.md's `<code_context>` Reusable Assets list and RESEARCH.md's Sources section (both already enumerate every touched file with line numbers; no additional Glob/Grep search was needed beyond confirming exact current line ranges).
**Files scanned:** `src/lib/related-gallery.ts`, `src/lib/sanity.ts`, `src/lib/sanity-validation.ts`, `src/lib/page-models.ts`, `src/components/EditionDetailBody.astro`, `src/components/GalleryDetailBody.astro`, `sanity/schemas/edition.ts`, `sanity/schemas/gallery.ts`, plus `24-UI-SPEC.md`'s pre-adapted CONT-04 markup/CSS contract.
**Pattern extraction date:** 2026-08-26
