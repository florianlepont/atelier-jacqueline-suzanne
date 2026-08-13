---
phase: quick-260811-kog-corriger-les-constats-du-diagnostic-qual
plan: 04
subsystem: ui
tags: [astro, gallery, edition, i18n, seo]

requires:
  - phase: 260811-kog-03
    provides: "Sanity content validation boundary (sanitizeGallery/sanitizeEdition reject documents with images.length === 0)"
provides:
  - "src/lib/page-models.ts: pure buildGalleryDetailModel/buildEditionDetailModel({document, locale, pageUrl})"
  - "src/components/GalleryDetailPage.astro and EditionDetailPage.astro: shared detail-page implementations"
  - "Four [slug].astro route files reduced to getStaticPaths-plus-delegation adapters"
  - "verify-static-artifact.mjs: real-build hero-media and no-undefined-URL checks for every gallery/édition detail page"
affects: [gallery-detail, edition-detail, i18n, seo, static-build-verification]

tech-stack:
  added: []
  patterns:
    - "Same pure-model + thin-wrapper-component + adapter-route pattern established in quick-260811-kog-02 (HomePage.astro), now applied to the four dynamic detail routes"
    - "Source-text regression guards (static-routes.test.ts) for Astro route adapters that stay thin only by convention, not by any type-level enforcement"
    - "Build-artifact-level null-safety verification (verify-static-artifact.mjs) as a second, stronger layer beyond unit-test fixtures — checks the real Sanity dataset's actual output"

key-files:
  created:
    - src/lib/page-models.ts
    - src/components/GalleryDetailPage.astro
    - src/components/EditionDetailPage.astro
    - tests/unit/page-models.test.ts
  modified:
    - "src/pages/galleries/[slug].astro"
    - "src/pages/en/galleries/[slug].astro"
    - "src/pages/editions/[slug].astro"
    - "src/pages/en/editions/[slug].astro"
    - tests/unit/static-routes.test.ts
    - tests/scripts/verify-static-artifact.mjs
    - tests/e2e/seo.spec.ts

key-decisions:
  - "The plan's own Task 2 description assumed markup/styles/client hooks still needed moving into new shared components — but an EARLIER quick task (260727-the) had already factored that into GalleryDetailBody.astro/EditionDetailBody.astro. This plan's actual remaining duplication was the frontmatter-script data transform only, which is exactly what Task 1's pure model functions target; Task 2's *DetailPage.astro components wrap the existing *DetailBody components rather than re-implementing their markup."
  - "buildEditionDetailModel gained a genuine null-safety fix (heroImage-derived fields default to '' instead of throwing when images is empty) discovered while writing its unit tests — not a hypothetical, since the plan's own must_haves explicitly require these models to 'rester... null-safe'. buildGalleryDetailModel was deliberately left matching its original (pre-extraction) behavior for the same case, since the original gallery route code never defended against it either."
  - "Édition detail pages pass no structuredData/noIndex to BaseLayout in EditionDetailPage.astro, matching the pre-existing behavior of both fr/en édition route files before extraction — édition has no seo field/group in its Sanity schema, and adding one was out of this plan's scope."
  - "New e2e coverage (2 tests in seo.spec.ts) targets canonical/alternate self-reference on gallery/édition detail pages specifically, mirroring the equivalent homepage check from Plan 02 — the existing gallery.spec.ts/edition.spec.ts suites already had strong bilingual behavioral coverage, so new tests focused on the one genuinely uncovered SEO contract rather than duplicating what already existed."
  - "Verification went beyond the plan's own listed subset: ran the full chromium e2e suite (343/343) in addition to the plan's targeted 70, on top of both required build bases."

requirements-completed: [QUICK-260811-KOG-I18N-DETAILS]

coverage:
  - id: D1
    description: "Gallery detail fr/en share model and rendering without changing physical routes or getStaticPaths"
    requirement: QUICK-260811-KOG-I18N-DETAILS
    verification:
      - kind: unit
        ref: "tests/unit/static-routes.test.ts (adapter delegation guard, 5 new cases)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/gallery.spec.ts (70 existing tests, unchanged, still passing)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Édition detail fr/en share model and rendering without changing physical routes or getStaticPaths"
    requirement: QUICK-260811-KOG-I18N-DETAILS
    verification:
      - kind: unit
        ref: "tests/unit/static-routes.test.ts (same adapter delegation guard)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/edition.spec.ts (existing tests, unchanged, still passing)"
        status: pass
    human_judgment: false
  - id: D3
    description: "SEO, JSON-LD, counters, hero, grid/lightbox, related gallery and labels stay localized and null-safe"
    requirement: QUICK-260811-KOG-I18N-DETAILS
    verification:
      - kind: unit
        ref: "tests/unit/page-models.test.ts (29 tests: fr/en parity, SEO fallbacks, hero exclusion, related-gallery resolution, empty-images defensiveness)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/seo.spec.ts (2 new canonical/alternate self-reference tests)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Root and GitHub Pages artifacts contain the expected bilingual detail pages with no media URL derived from an absent value"
    requirement: QUICK-260811-KOG-I18N-DETAILS
    verification:
      - kind: other
        ref: "npm run test:artifact (base /) and EXPECTED_BASE=/ajs-website/ npm run test:artifact — both pass, including the new hero-media + no-undefined-URL checks"
        status: pass
    human_judgment: false

duration: ~1.5h, done directly in this session (no agent dispatch, following Plan 02/05's precedent)
completed: 2026-08-13
status: complete
---

# Quick Task 260811-kog Plan 04: Bilingual Detail Page Unification Summary

**Pure buildGalleryDetailModel/buildEditionDetailModel functions plus two shared *DetailPage.astro wrapper components replacing four routes' worth of duplicated fetch+SEO+hero+grid logic — the four physical [slug].astro routes are now thin getStaticPaths-plus-delegation adapters.**

## Performance

- **Duration:** ~1.5h, executed directly in this session's main loop (no agent dispatch), continuing the precedent set finishing Plans 02 and 05.
- **Tasks:** 2 (pure model extraction with tests; shared wrapper components + route reduction + test/artifact extension)
- **Files modified:** 11 (4 created, 7 modified)

## Accomplishments

- `src/lib/page-models.ts` exports `buildGalleryDetailModel()` and `buildEditionDetailModel()` — pure, fetch-free transforms of a validated Sanity document + locale into a complete render model (hero selection, grid items with correct per-item aspect ratio, SEO, JSON-LD for galleries, related-gallery cross-link for éditions, all locale-aware labels).
- `src/components/GalleryDetailPage.astro`/`EditionDetailPage.astro` build their model once and render the already-shared `GalleryDetailBody.astro`/`EditionDetailBody.astro` (factored out by an earlier quick task) inside `BaseLayout`.
- All four `[slug].astro` route files are now `getStaticPaths` + a single delegating JSX tag — no CMS/SEO/hero/grid computation of their own.
- Found and fixed a genuine null-safety gap while writing Task 1's tests: `buildEditionDetailModel` would throw on an empty `images` array (a state the plan's own `must_haves` require staying safe against, even though the current Sanity validation layer already prevents it from occurring in practice).
- `verify-static-artifact.mjs` now checks, against the REAL built HTML for every gallery/édition detail page in both deployment bases: a renderable hero image with an absolute `src`, and no `src`/`srcset` anywhere containing the literal string `"undefined"` — a stronger, dataset-level check than unit-test fixtures alone can provide.
- `static-routes.test.ts` gained a source-text guard against the four route adapters silently regressing back into duplicating logic.
- 2 new e2e tests in `seo.spec.ts` prove gallery/édition detail pages canonicalize to themselves (not always to the French one) and share the same fr/en alternate pair.
- Verification exceeded the plan's own listed subset: full chromium e2e suite (343/343), full root unit suite (429/429), both required build bases (root, `ASTRO_BASE=/ajs-website/`) each building and passing `test:artifact`.

## Task Commits

1. **Task 1: Extract buildGalleryDetailModel/buildEditionDetailModel with 29 unit tests** - `2336b28` (feat)
2. **Task 2: Wire shared *DetailPage components, reduce 4 routes to adapters, extend tests/artifact verifier** - `3af9180` (feat)

**Plan metadata:** committed separately by the orchestrator (this SUMMARY, STATE.md).

## Files Created/Modified

- `src/lib/page-models.ts` (new) - Pure gallery/édition detail render-model builders
- `tests/unit/page-models.test.ts` (new) - 29 behavioral tests
- `src/components/GalleryDetailPage.astro` (new) - Shared gallery detail implementation
- `src/components/EditionDetailPage.astro` (new) - Shared édition detail implementation
- `src/pages/galleries/[slug].astro`, `src/pages/en/galleries/[slug].astro` - Reduced to locale adapters
- `src/pages/editions/[slug].astro`, `src/pages/en/editions/[slug].astro` - Reduced to locale adapters
- `tests/unit/static-routes.test.ts` - New adapter-delegation source-text guard (5 cases)
- `tests/scripts/verify-static-artifact.mjs` - New hero-media + no-undefined-URL checks
- `tests/e2e/seo.spec.ts` - 2 new canonical/alternate self-reference tests

## Decisions Made

See `key-decisions` in frontmatter above — five decisions recorded there, most notably the discovery that Task 2's originally-scoped markup migration was already done by an earlier, unrelated quick task, and the null-safety fix to `buildEditionDetailModel`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] buildEditionDetailModel would throw on an empty images array**
- **Found during:** Writing `tests/unit/page-models.test.ts`'s defensive-guard test case.
- **Issue:** `heroImage = images[heroIndex]` is `undefined` when `images` is empty, and `fullSizeUrl(undefined, ...)` throws. The plan's own `must_haves` explicitly require these models to stay null-safe.
- **Fix:** `leadPhotoSrc`/`leadPhotoSrcSet`/`socialImage` now default to `''` when `heroImage` is undefined, and `leadPhotoAlt` uses `heroImage?.alt`.
- **Files modified:** `src/lib/page-models.ts`
- **Verification:** New test asserts no throw and a zero total; full suite still green.
- **Committed in:** `2336b28` (part of the Task 1 commit)

---

**Total deviations:** 1 auto-fixed, a genuine defensive-safety fix explicitly required by the plan's own text. No scope creep.
**Impact on plan:** None beyond what was already required.

## Issues Encountered

None beyond the deviation above. The plan's assumption that Task 2 needed to move markup into new shared components turned out to be stale (an earlier quick task, 260727-the, had already done that for the *DetailBody components) — this made Task 2 smaller in practice than the plan described, not larger; no rework was needed, just building the wrapper on top of what already existed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 04 is complete, committed, and verified against the full test suite and both deployment bases.
- Only Plan 06 of the same `260811-kog` quality-diagnostic remediation remains unstarted.
- The pure-model + thin-wrapper-component + adapter-route pattern is now established across three separate route families (homepage, gallery detail, édition detail) — a consistent template for any future bilingual-page work.

---
*Phase: quick-260811-kog-corriger-les-constats-du-diagnostic-qual*
*Completed: 2026-08-13*
