---
phase: 18-gallery-ditions-display-fixes
reviewed: 2026-08-03T00:00:00Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - src/components/GalleryGrid.astro
  - src/pages/galleries/[slug].astro
  - src/pages/en/galleries/[slug].astro
  - tests/e2e/gallery.spec.ts
  - tests/unit/statement-length-limit.test.ts
  - src/components/DetailHero.astro
  - sanity/schemas/gallery.ts
  - sanity/schemas/edition.ts
findings:
  critical: 1
  warning: 3
  info: 1
  total: 5
status: issues_found
---

# Phase 18: Code Review Report

**Reviewed:** 2026-08-03T00:00:00Z
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Summary

Reviewed the gallery/édition thumbnail-grid, gallery detail pages (fr/en), the
shared scroll-reveal hero, the two Sanity content schemas that back this
phase, and the accompanying unit/e2e tests. The masonry/bento dual-mode
`GalleryGrid.astro`, the hero-index remapping in the two detail pages, and the
`DetailHero.astro` scroll-reveal/carousel-return scripts are internally
consistent and are backed by strong e2e coverage (index-contiguity proof,
object-fit assertions, statement-overflow proof across every published
gallery). No XSS, injection, or crash-on-happy-path issues were found in the
Astro components.

The one real defect is in the Sanity schema layer: `edition.ts` was patched
with an `assetRequired()` validation fix (explicitly commented as "Review
WR-01") that was never mirrored onto the near-identical `gallery.ts` images
array, even though both files otherwise stay in lockstep by convention (and
even have a dedicated unit test enforcing that lockstep for the statement
max-length constraint). This is a live gap: a gallery image item with alt +
rights filled in but no uploaded asset (e.g., an interrupted upload) can pass
Studio validation and reach the published dataset, where the Astro build's
image-URL helpers will fail on it.

## Critical Issues

### CR-01: `gallery.ts` images array is missing the `assetRequired()` validation that `edition.ts` already has

**File:** `sanity/schemas/gallery.ts:156-203`
**Issue:** `edition.ts`'s `images` array member explicitly adds
`validation: (rule) => rule.required().assetRequired()` on the `image`
array-member definition, with the comment:

```
// Review WR-01: required() alone can pass on an array item that has
// alt/rights filled in but no actual uploaded asset (e.g. an
// interrupted upload) -- assetRequired() closes that gap.
```

(`sanity/schemas/edition.ts:137-140`). `gallery.ts`'s `images` array member
(`sanity/schemas/gallery.ts:156-203`) uses the exact same array-member shape
(`type: 'image'`, `options: {hotspot: true}`, same `alt`/`rights` sub-fields)
but never received this fix — there is no `validation` on the array member
itself, only the array-level `rule.custom` that checks `alt`/`rights` text
content, never asset presence.

Because both schemas otherwise deliberately mirror each other line-for-line
(the `localeTextField` helper is literally "copied verbatim" between them,
per each file's own doc comment, and `tests/unit/statement-length-limit.test.ts`
exists specifically to catch exactly this class of silent divergence for the
`statement` field), this asymmetry reads as an unapplied fix, not a
deliberate design difference. An editor can publish a `gallery` document
with an `images` array item that has valid `alt`/`rights` text but a missing
or interrupted image asset. `getGalleries()` → `fullSizeUrl` /
`responsiveImageSrcSet` (consumed at `src/pages/galleries/[slug].astro:79-80`
and `src/pages/en/galleries/[slug].astro:76-77`, plus the hero image itself)
will then be handed an image record with no usable asset reference at build
time, which is a static-site-build crash risk — the entire GitHub Actions
deploy pipeline (root build, then Pages build) would fail for every gallery,
not just the offending one, until the bad content is manually fixed in
Studio.

**Fix:**
```ts
// sanity/schemas/gallery.ts, inside the `images` array's defineArrayMember:
defineArrayMember({
  type: 'image',
  options: {hotspot: true},
  // Mirrors edition.ts's WR-01 fix: required() alone can pass on an array
  // item that has alt/rights filled in but no actual uploaded asset.
  validation: (rule) => rule.required().assetRequired(),
  fields: [
    // ...unchanged
  ],
}),
```

## Warnings

### WR-01: `gridItems` construction (aspectRatio + ariaLabel) is duplicated verbatim across the fr/en gallery detail pages with no shared helper or lockstep test

**File:** `src/pages/galleries/[slug].astro:71-85`, `src/pages/en/galleries/[slug].astro:68-82`
**Issue:** Both files contain an identical 15-line block that derives
`aspectRatio` from `img.dimensions` (with the same `height > 0` fallback
logic) and builds each grid item's `index`/`src`/`srcset`/`aspectRatio`. Only
the `ariaLabel` locale string differs. This is exactly the same
"two files must stay in lockstep or silently diverge" shape that
`sanity/schemas/gallery.ts` / `sanity/schemas/edition.ts` already have — and
that pair now has `tests/unit/statement-length-limit.test.ts` specifically to
guard it. The `gridItems` logic here has no equivalent guard: a future change
to the aspect-ratio fallback (e.g., handling `height === 0` differently, or
adding a min/max clamp) can easily be applied to one locale's page and
forgotten in the other, producing a silent fr/en behavior mismatch that no
test currently catches.
**Fix:** Extract the shared mapping into a small pure helper (e.g.
`src/lib/gallery-grid-items.ts`), taking `images`, `heroIndex`, and a
locale-aware `ariaLabel` formatter/locale key, and call it from both pages —
consistent with how `pickHeroIndex` in `src/lib/image-orientation.ts` was
already extracted as a shared pure function for this same phase.

### WR-02: `src/lib/image-orientation.ts`'s rationale comment is stale — it describes the hero's pre-revert `object-fit: contain` behavior, not the shipped `object-fit: cover`

**File:** `src/lib/image-orientation.ts:4-8`
**Issue:** `pickHeroIndex`'s doc comment states: "The gallery hero
(DetailHero.astro) renders `object-fit: contain`, never cropping — a
portrait first photo looks small/heavily letterboxed in the wide hero box, so
this prefers the first LANDSCAPE image...". This is imported directly by
both reviewed detail pages (`src/pages/galleries/[slug].astro:19`,
`src/pages/en/galleries/[slug].astro:16`) to select `heroIndex`. However,
`DetailHero.astro` itself documents (lines 14-22) that the no-crop
`object-fit: contain` behavior was explicitly reverted per direct user
feedback ("je veux pas de flou..."), and the hero now *always* renders
`object-fit: cover` — confirmed by
`.detail-hero__img { object-fit: cover; }` (`src/components/DetailHero.astro:452-459`,
no per-caller override left) and by the e2e regression test "the gallery hero
renders object-fit: cover (crop reverted, no letterboxing)"
(`tests/e2e/gallery.spec.ts:433-445`). `pickHeroIndex`'s actual runtime
behavior is unaffected (it still just prefers the first landscape image), but
its documented rationale is now factually wrong and could mislead a future
maintainer into re-introducing the no-crop escape hatch under the belief the
hero is currently non-cropping.
**Fix:** Update the comment to reflect the current cover-crop behavior, e.g.
"prefers the first LANDSCAPE image because a landscape source crops less
aggressively than a portrait one under `object-fit: cover` in a wide hero
box" (matching the correct rationale already used in the two page files'
own local comments, e.g. `src/pages/galleries/[slug].astro:35-37`).

### WR-03: `gallery.slug` is interpolated into `carouselReturnHref`'s query string without encoding

**File:** `src/pages/galleries/[slug].astro:58`, `src/pages/en/galleries/[slug].astro:55`
**Issue:** `` `${getRelativeLocaleUrl(locale, '')}?carousel=${gallery.slug}` `` inserts
the raw slug directly into a URL query string. Sanity's slug source field
generates URL-safe kebab-case slugs by default, so this is low risk in
practice, but nothing in the schema (`sanity/schemas/gallery.ts:111-120`)
enforces a strict character set at validation time (`slug` only has
`rule.required()`, no `regex`/format constraint), and Studio slugs are
manually editable. A slug containing `&`, `#`, `%`, or whitespace would
silently corrupt the query string, breaking the round trip read by the
homepage's `?carousel=` handler (see `tests/e2e/gallery.spec.ts:749-761`).
**Fix:** Wrap with `encodeURIComponent(gallery.slug)` in both files, and/or
add a `regex` validation rule to the `slug` field in `sanity/schemas/gallery.ts`
restricting it to `[a-z0-9-]+`.

## Info

### IN-01: Dead `gap` declaration under `.gallery-grid--masonry`

**File:** `src/components/GalleryGrid.astro:351-359`
**Issue:** `.gallery-grid--masonry` overrides the base `.gallery-grid`
rule's `display: flex` with `display: block` for CSS multi-column masonry,
but the base rule's `gap: var(--space-md)` (line 190) is still inherited by
the masonry variant and has no effect on a `display: block` container —
`column-gap: var(--space-md)` is separately (and correctly) declared right
below it for the actual masonry gutter. The inherited `gap` is a harmless
no-op, not a functional bug, but it's dead CSS that could confuse a future
reader into thinking it's load-bearing for masonry spacing.
**Fix:** Optionally add `gap: 0;` (or a comment) to `.gallery-grid--masonry`
to make explicit that spacing there comes solely from `column-gap` +
per-tile `margin-bottom`.

---

_Reviewed: 2026-08-03T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
