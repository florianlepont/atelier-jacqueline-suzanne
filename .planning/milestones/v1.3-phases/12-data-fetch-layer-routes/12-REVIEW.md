---
phase: 12-data-fetch-layer-routes
reviewed: 2026-07-22T21:48:46Z
depth: standard
files_reviewed: 11
files_reviewed_list:
  - src/lib/sanity.ts
  - src/pages/editions/[slug].astro
  - src/pages/editions/index.astro
  - src/pages/en/editions/[slug].astro
  - src/pages/en/editions/index.astro
  - src/pages/sitemap.xml.ts
  - tests/e2e/edition.spec.ts
  - tests/e2e/seo.spec.ts
  - tests/scripts/verify-static-artifact.mjs
  - tests/unit/edition-query.test.ts
  - tests/unit/static-routes.test.ts
findings:
  critical: 2
  warning: 1
  info: 2
  total: 5
status: issues_found
---

# Phase 12: Code Review Report

**Reviewed:** 2026-07-22T21:48:46Z
**Depth:** standard
**Files Reviewed:** 11
**Status:** issues_found

## Summary

Reviewed the Phase 12 data-fetch layer (`getEditions`/`getEdition` in `src/lib/sanity.ts`), the four new édition route files (FR/EN overview + FR/EN détail), the sitemap wiring, and the accompanying unit/e2e/build-verification tests. The GROQ parameterization is safe (slug is always bound, never interpolated — no injection risk), the `getEditions`/`getEdition` null-coalescing (`?? []` / `?? null`) is correct, and the EDN-06 "no commerce copy" build guard in `verify-static-artifact.mjs` is a genuinely well-built whole-word/prefix matcher with good edge-case handling (accented-letter boundary class, script/style stripping).

The main defect class found is a null-safety regression relative to the codebase's own established convention: `src/pages/galleries/[slug].astro` explicitly documents (as "WR-03") that Studio-required fields must still be defensively guarded because a document written or migrated outside the Studio's publish-time validation gate can reach the build with fields unset. The new édition code drops that guard for several fields that are exactly as exposed to that risk (`dimensions`, `pageCount`, `images`, and — on the overview pages only — `statement`), while it keeps the guard for other fields in the same objects. Because Astro's static build is a single process that renders every route in one pass, an unhandled throw on any one édition page fails the entire `npm run build` / CI deploy gate, not just that édition's page — the same severity class the codebase itself calls out for `statement`.

## Critical Issues

### CR-01: Unguarded access to Édition `dimensions`/`pageCount`/`printRun`/`images` crashes the entire static build, not just one page

**File:** `src/pages/editions/[slug].astro:57, 62-63, 111` (and identically `src/pages/en/editions/[slug].astro:40, 45-46, 94`)

**Issue:** Every other Studio-required, locale-shaped field on this page is defensively guarded before use — e.g. line 46 `const statement = edition.statement?.[locale] ?? '';` and line 48 `const leadPhotoAlt = edition.leadPhoto.alt?.[locale] ?? '';`. But the following accesses have zero guard, even though `dimensions`, `pageCount`, `printRun`, and `images` are just as reachable via an incompletely-migrated or partially-populated Sanity document as `statement` is (the codebase's own `galleries/[slug].astro:30-31` comment — "WR-03: ... a document written outside the Studio's publish-time validation could still be partially populated mid-edit" — applies verbatim to these fields too):

```astro
const lightboxImages = [edition.leadPhoto, ...edition.images];   // throws if images is null (spread of non-iterable)
...
const dimensionsText = `${edition.dimensions.width} × ${edition.dimensions.height} ${edition.dimensions.unit}`; // throws if dimensions is null/undefined
const formatText = `Pages : ${edition.pageCount} · Tirage : ${edition.printRun} exemplaires · Dimensions : ${dimensionsText}`;
...
edition.images.length > 0 && ( ... )   // throws if images is null
```

Studio's `rule.required()`/`rule.custom()` validation (`sanity/schemas/edition.ts`) makes this unlikely through the normal Studio publish flow, but it does not protect against documents created/edited via the Content Lake API directly, bulk import/migration scripts, or documents published before a validation rule existed — all of which the codebase's own WR-03 precedent explicitly anticipates. Because `getStaticPaths` renders every published édition in the same `astro build` invocation, one such document throws during SSG and fails the whole build — blocking deploy of every page on the site (About, Contact, Galleries, everything), not just the offending édition. This matches the "null pointer dereferences that crash" Critical category, and the blast radius (whole-site deploy blocked) is materially worse than a normal per-page bug.

**Fix:**
```astro
const dims = edition.dimensions ?? { width: 0, height: 0, unit: 'cm' as const };
const dimensionsText = `${dims.width} × ${dims.height} ${dims.unit}`;
const pageCount = edition.pageCount ?? 0;
const printRun = edition.printRun ?? 0;
const formatText = `Pages : ${pageCount} · Tirage : ${printRun} exemplaires · Dimensions : ${dimensionsText}`;
const editionImages = edition.images ?? [];
const lightboxImages = [edition.leadPhoto, ...editionImages];
...
editionImages.length > 0 && ( ... )
```
Apply the same fix to `src/pages/en/editions/[slug].astro`. Alternatively (and preferably, since a malformed doc should not silently render "0 pages"), add the same completeness filter used for `PUBLISHED_EDITION_FILTER` in `src/lib/sanity.ts` so `getEditions()`/`getEdition()` never return a document missing these fields — matching the "an editor's in-progress, incomplete document ... would otherwise reach build-time queries and crash the static build" guardrail already documented for `getSiteSettings()`.

### CR-02: `edition.statement[locale]` is accessed without optional chaining on both Éditions overview pages, inconsistent with the détail page's own guard for the same field

**File:** `src/pages/editions/index.astro:56` and `src/pages/en/editions/index.astro:52`

**Issue:** `src/pages/editions/[slug].astro:46` explicitly guards this exact field — `const statement = edition.statement?.[locale] ?? '';` — but the overview pages access it raw inside the `.map()` over every published édition:

```astro
<p class="editions-list__statement">{edition.statement[locale]}</p>
```

If any single published édition has an unset/partially-populated `statement` (the same WR-03 risk class discussed in CR-01), this throws `TypeError: Cannot read properties of undefined` while rendering the `.map()`, which fails the whole overview page for **every** édition in that locale (not just the offending one), and — same as CR-01 — fails the entire `astro build`.

**Fix:**
```astro
<p class="editions-list__statement">{edition.statement?.[locale] ?? ''}</p>
```
Apply identically to the EN file (`src/pages/en/editions/index.astro:52`).

## Warnings

### WR-01: TypeScript types mask the null-safety gap (`statement`/`dimensions`/`pageCount`/`printRun`/`images` typed as always-present)

**File:** `src/lib/sanity.ts:133-147`

**Issue:** `Edition.statement: LocaleString` (not `Partial<LocaleString>`), and `dimensions`/`pageCount`/`printRun`/`images`/`leadPhoto` are all typed as non-optional. Because these types claim the fields are always populated, TypeScript raises no warning at any of the CR-01/CR-02 call sites — the compiler actively hides the very risk the codebase's own WR-03 comment (in `galleries/[slug].astro`) warns about. `GalleryImage.alt: LocaleString` has the identical issue but at least every *consumer* of it in this diff defensively chains (`?.`), whereas several `Edition` consumers do not (see CR-01/CR-02).

**Fix:** Either (a) type these build-time-fetched CMS fields as `Partial<...>`/optional to force callers to handle absence, matching `AboutPage`/`ContactPage`'s pattern of `Partial<LocaleString>` for CMS content, or (b) keep the required types but add a single validation/filter step inside `getEditions()`/`getEdition()` that drops or fails loudly on incomplete documents before they reach any page component — do not leave the guarantee purely as an unenforced type-level promise plus scattered, inconsistent `?.` usage at call sites.

## Info

### IN-01: Hardcoded French/English plural in the format line breaks for a print run or page count of 1

**File:** `src/pages/editions/[slug].astro:63` and `src/pages/en/editions/[slug].astro:46`

**Issue:** `printRun` is schema-validated only as `positive().integer()`, so `printRun === 1` is valid content, but the format string always renders the plural: `` `Tirage : ${edition.printRun} exemplaires ...` `` → "Tirage : 1 exemplaires" (should be "1 exemplaire"), and similarly `` `Print run: ${edition.printRun} copies` `` → "Print run: 1 copies" (should be "1 copy"). This is a minor content-quality nit (the plan explicitly specified this literal string, so it's a low-priority carry-over rather than a new defect), but it is user-visible on every low-print-run édition.

**Fix:**
```ts
const printRunText = edition.printRun === 1 ? 'exemplaire' : 'exemplaires'; // and 'copy' / 'copies' for EN
const formatText = `Pages : ${edition.pageCount} · Tirage : ${edition.printRun} ${printRunText} · Dimensions : ${dimensionsText}`;
```

### IN-02: Near-total FR/EN duplication of markup + CSS across the four new édition page files

**File:** `src/pages/editions/[slug].astro` vs `src/pages/en/editions/[slug].astro`; `src/pages/editions/index.astro` vs `src/pages/en/editions/index.astro`

**Issue:** The `<style>` blocks in the FR/EN détail pages are byte-for-byte identical (~140 lines each), and likewise for the FR/EN overview pages (~120 lines each) — only copy strings and `href`/import-depth differ in the markup. This mirrors an existing project-wide convention (the gallery pages have the same FR/EN split, per the file-level comments), so it is not a defect introduced by this phase specifically, but the duplicated CSS is a real, growing maintenance cost: any future visual tweak to `.edition-detail__*` or `.editions-list__*` must now be made in two places and can silently drift.

**Fix:** Not blocking for this phase (consistent with established pattern), but consider extracting the shared `<style>` block into a common `.astro` partial or scoped CSS module that both locale pages import, the next time these styles need to change.

---

_Reviewed: 2026-07-22T21:48:46Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
