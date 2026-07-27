---
phase: 02-portfolio-galleries
plan: 01
subsystem: cms
tags: [sanity, groq, orderable-document-list, image-url, playwright, vitest, tdd-red]

requires:
  - phase: 01-foundation-bilingual-infrastructure
    provides: sanityClient singleton, LocaleString/SiteSettings shape, getSiteSettings fetch+null-coalesce pattern, Astro FR/EN routing, Playwright+Vitest harness
provides:
  - "gallery Sanity document schema (title, slug, statement, images[], orderRank) with Studio drag-reorder"
  - "galleryImage object schema (image + required bilingual alt text)"
  - "getGalleries()/getGallery(slug) typed build-time read functions"
  - "thumbnailUrl()/fullSizeUrl() Sanity CDN image URL builders"
  - "siteSettings.navLabels.galleries bilingual nav-label field"
  - "RED Wave 0 e2e (gallery.spec.ts) and unit (gallery-query.test.ts) test suites for Plans 02-03/02-04 to turn GREEN"
affects: [02-02, 02-03, 02-04]

tech-stack:
  added: ["@sanity/orderable-document-list@^2.0.8 (Studio-only devDependency)"]
  patterns:
    - "Locale-object field shape {fr, en} both required, inlined per-file (no shared schema-lib module yet)"
    - "Build-time-only Sanity client reuse: src/lib/image.ts imports the same sanityClient singleton as src/lib/sanity.ts, never a second client"
    - "WR-03 null-safety: fetch-then-`?? null` coalesce for every single-document query function"
    - "orderRankField spread with hidden:true to keep the fractional-index field out of Romane's edit form"

key-files:
  created:
    - sanity/schemas/objects/galleryImage.ts
    - sanity/schemas/gallery.ts
    - src/lib/image.ts
    - tests/e2e/gallery.spec.ts
    - tests/unit/gallery-query.test.ts
    - .planning/phases/02-portfolio-galleries/deferred-items.md
  modified:
    - sanity/schemas/index.ts
    - sanity/schemas/structure.ts
    - sanity/schemas/siteSettings.ts
    - src/lib/sanity.ts
    - sanity/package.json

key-decisions:
  - "@sanity/orderable-document-list verified legitimate via a blocking human checkpoint (npmjs.com, sanity-io org, v2.0.8, peer deps match) before install — repo now lives in the sanity-io/plugins monorepo, a normal consolidation, not a legitimacy concern"
  - "galleryImage's alt field inlined as an object with required fr/en strings (matching siteSettings.ts's localeStringField shape) rather than importing a shared helper, since no shared schema-lib module exists yet"
  - "gallery.title is a plain string (not locale-object) per D-04 — project titles are shared proper nouns across fr/en"

patterns-established:
  - "Two-locale GROQ query pair (GALLERIES_QUERY / GALLERY_BY_SLUG_QUERY) added additively alongside SITE_SETTINGS_QUERY in the same src/lib/sanity.ts module, sharing one sanityClient singleton"

requirements-completed: [CMS-01, PORT-01, PORT-03]

duration: 50min
completed: 2026-07-07
---

# Phase 2 Plan 1: Gallery Data Contract Summary

**Sanity `gallery` document schema with bilingual-alt images and drag-reorder via `@sanity/orderable-document-list`, plus typed `getGalleries`/`getGallery`/`thumbnailUrl`/`fullSizeUrl` build-time read layer and RED Wave 0 test suites for downstream plans.**

## Performance

- **Duration:** ~50 min (incl. a blocking human-verify checkpoint pause for package-legitimacy confirmation)
- **Started:** 2026-07-07T07:10:00Z (approx.)
- **Completed:** 2026-07-07T08:03:31+02:00
- **Tasks:** 3 (1 auto, 1 checkpoint:human-verify, 1 auto)
- **Files modified:** 12 (6 created, 5 modified, 1 deferred-items log)

## Accomplishments
- Romane can now create a `gallery` document in Sanity Studio with drag-to-reorder ordering in the desk list (CMS-01 self-serve write path), and every image requires both French and English alt text before it validates.
- `getGalleries()`/`getGallery(slug)`/`thumbnailUrl()`/`fullSizeUrl()` are exported, typed, and null-safe — downstream plans (02-02/02-03/02-04) can build pages/components against this contract without exploring the Sanity schema themselves.
- Two RED Wave 0 test files (`tests/e2e/gallery.spec.ts`, `tests/unit/gallery-query.test.ts`) lock in the listing/statement/lightbox behavioral contract and the query-function null-safety/GROQ-shape contract ahead of the plans that implement them.

## Task Commits

1. **Task 1: Author the RED Wave 0 test files** - `203e1e2` (test)
2. **Task 2: Verify `@sanity/orderable-document-list` package legitimacy** - checkpoint (no commit; human-verify gate, approved by coordinator)
3. **Task 3: Gallery schema, Studio ordering, read layer, and navLabels.galleries** - `88ffb68` (feat)

**Plan metadata:** (this commit, docs: complete plan — added after this Summary)

## Files Created/Modified
- `sanity/schemas/objects/galleryImage.ts` - image + required bilingual alt object type, preview keyed on alt.fr
- `sanity/schemas/gallery.ts` - gallery document: title (plain string), slug, statement (localeText), images[] (min 1), orderRankField (hidden)
- `sanity/schemas/index.ts` - registers gallery + galleryImage in schemaTypes
- `sanity/schemas/structure.ts` - StructureResolver now takes `(S, context)`; adds `orderableDocumentListDeskItem` for gallery; filter excludes siteSettings + gallery
- `sanity/schemas/siteSettings.ts` - adds `navLabels.galleries` (fr/en, required) matching the existing `home` field shape
- `src/lib/sanity.ts` - adds `GalleryImage`/`Gallery` interfaces, `GALLERIES_QUERY`/`GALLERY_BY_SLUG_QUERY`, `getGalleries()`/`getGallery(slug)`, extends `SiteSettings.navLabels` with `galleries`
- `src/lib/image.ts` - new module: `thumbnailUrl()` (1:1 crop) / `fullSizeUrl()` (uncropped) via `@sanity/image-url`, reusing the existing `sanityClient` singleton
- `sanity/package.json` / `sanity/package-lock.json` - adds `@sanity/orderable-document-list@^2.0.8` (Studio-only, not in the frontend root package.json)
- `tests/e2e/gallery.spec.ts` - RED: gallery listing / gallery detail / lightbox `test.describe` blocks
- `tests/unit/gallery-query.test.ts` - RED→GREEN after Task 3: `getGalleries`/`getGallery` null-safety + GROQ-shape assertions via a mocked `@sanity/client`
- `.planning/phases/02-portfolio-galleries/deferred-items.md` - logs pre-existing (Phase 1) `tsc --noEmit` errors unrelated to this plan

## Decisions Made
- Verified `@sanity/orderable-document-list` legitimacy via the blocking human checkpoint (T-02-01-SC) before installing — confirmed sanity-io org ownership, v2.0.8, matching peer deps (`sanity ^5||^6.0.0-0`, `react ^19.2`) via `npm view` (read-only), no `slopcheck install` run. The package's repo now lives in the `sanity-io/plugins` monorepo rather than a standalone repo, which the coordinator confirmed is a normal consolidation, not a legitimacy red flag.
- Inlined the `alt` locale-object field shape directly in `galleryImage.ts` (mirroring `localeStringField`'s exact shape) rather than extracting a shared schema-lib module, since none exists yet in this codebase — matches 02-PATTERNS.md's stated simplest zero-risk path.

## Deviations from Plan

### Auto-fixed Issues

None — no Rule 1/2/3 auto-fixes were needed; the plan's schema/query/image-builder specifications were followed as written.

### Out-of-Scope Discoveries (logged, not fixed)

**1. Pre-existing `npx tsc --noEmit` errors unrelated to this plan**
- **Found during:** Task 3 verification (`npx tsc --noEmit`)
- **Issue:** `Cannot find name 'process'` in `astro.config.mjs`, `playwright.config.ts`, and the pre-existing lines of `src/lib/sanity.ts` (missing `@types/node` dev dependency), plus a `vitest.config.ts(8,3)` type error — both predate this phase (present since Phase 1 commits `dc48306`/`63c0675`/`f4842e3`).
- **Verification that this plan introduces no new type errors:** `npx tsc --noEmit 2>&1 | grep -v "Cannot find name 'process'"` shows only the pre-existing `vitest.config.ts` error remaining — confirming `src/lib/image.ts` and the new `src/lib/sanity.ts` additions (`GalleryImage`, `Gallery`, `getGalleries`, `getGallery`) compile cleanly.
- **Action:** Not fixed (out of scope — pre-existing, unrelated files per the scope-boundary rule). Logged to `.planning/phases/02-portfolio-galleries/deferred-items.md` for a future cleanup task (`npm i --save-dev @types/node` + fixing `vitest.config.ts`'s type shape).

---

**Total deviations:** 0 auto-fixed; 1 out-of-scope discovery logged (deferred, not fixed).
**Impact on plan:** None on this plan's deliverables — the gallery schema, read layer, and image builders are fully typed and verified; the pre-existing `tsc` gap is a Phase 1 cleanup item, not a Phase 2 regression.

## Issues Encountered
None beyond the expected Task 2 human-verify pause (package-legitimacy checkpoint), which the coordinator approved after confirming `@sanity/orderable-document-list` on npmjs.com.

## User Setup Required

None — no new external service configuration required. The `@sanity/orderable-document-list` package is a Studio-only devDependency, already installed; no new environment variables or dashboard steps are needed.

## Next Phase Readiness

- Plans 02-02/02-03/02-04 can now build the gallery listing page, detail page, and lightbox against a stable, typed `getGalleries`/`getGallery`/`thumbnailUrl`/`fullSizeUrl` contract without further schema exploration.
- `tests/e2e/gallery.spec.ts` remains intentionally RED (no pages exist yet) — Plans 02-03 (listing/detail/statement) and 02-04 (lightbox) are expected to turn its three `test.describe` blocks GREEN incrementally.
- `tests/unit/gallery-query.test.ts` is GREEN and locks in the null-safety/GROQ-shape contract for any future refactor of `src/lib/sanity.ts`.
- No blockers. The pre-existing `tsc --noEmit` gap (see Deviations) is a minor cleanup item, not a blocker for downstream plans.

---
*Phase: 02-portfolio-galleries*
*Completed: 2026-07-07*

## Self-Check: PASSED

All created files verified present on disk (galleryImage.ts, gallery.ts, image.ts, gallery.spec.ts,
gallery-query.test.ts, deferred-items.md, this SUMMARY.md). All referenced commits (`203e1e2`,
`88ffb68`, `1c5bdad`) verified present in `git log --oneline --all`.
