---
phase: quick-260811-kog-corriger-les-constats-du-diagnostic-qual
plan: 02
subsystem: ui
tags: [astro, homepage, i18n, seo]

requires:
  - phase: 260811-kog-01
    provides: "Explicit-lifecycle mobile/desktop homepage runtime controllers (src/client/home-carousel-runtime.ts, mobile-home-runtime.ts)"
provides:
  - "src/lib/home-page-model.ts: pure buildHomePageModel({locale, homePage, siteSettings, galleries, pageUrl}) transforming CMS data + locale into a null-safe render model"
  - "src/components/HomePage.astro: single shared homepage implementation for both locales"
  - "src/pages/index.astro and src/pages/en/index.astro reduced to thin 3-line locale adapters"
affects: [homepage, i18n, seo]

tech-stack:
  added: []
  patterns:
    - "Pure CMS-data-to-render-model extraction (buildHomePageModel), with request-derived values (Astro.url) passed in as plain parameters rather than read inside the pure function, keeping it independently unit-testable"
    - "Locale-parameterized shared Astro page component with thin per-route adapters, rather than route-level duplication"

key-files:
  created:
    - src/lib/home-page-model.ts
    - src/components/HomePage.astro
    - tests/unit/home-page-model.test.ts
  modified:
    - src/pages/index.astro
    - src/pages/en/index.astro
    - tests/e2e/i18n.spec.ts

key-decisions:
  - "buildHomePageModel() takes `pageUrl: string` as a plain parameter rather than reading Astro.url internally, so the function has zero fetch/browser dependency and stays trivially unit-testable with plain fixtures."
  - "HomePageStructuredData is a concrete, closed TypeScript interface (not Record<string, unknown>) for internal type safety/testability, cast at the single BaseLayout call site (`as unknown as Record<string, unknown>`) rather than widened everywhere -- BaseLayout's own prop type predates this plan and is unrelated to it."
  - "New structural-contract e2e tests went in tests/e2e/i18n.spec.ts (the file already dedicated to locale-comparison testing) rather than tests/e2e/homepage-content-display.spec.ts (visual/layout-focused), to keep test-file responsibilities aligned with their existing scope."
  - "Verification went beyond the plan's own listed targeted subset: ran the FULL chromium e2e suite (343/343 pass) and the full root unit suite (411/411), not just the specific spec files the plan named, given this touches the production homepage."

requirements-completed: [QUICK-260811-KOG-HOMEPAGE]

coverage:
  - id: D1
    description: "/ and /en/ use a single page implementation while keeping their physical Astro URLs"
    requirement: QUICK-260811-KOG-HOMEPAGE
    verification:
      - kind: e2e
        ref: "tests/e2e/i18n.spec.ts (both routes render correctly, both resolve to HomePage.astro)"
        status: pass
      - kind: other
        ref: "npm run build (produces correct, independently-inspected /index.html and /en/index.html)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Text, SEO, JSON-LD, links, images and priorities are localized with no duplicated branches across two routes"
    requirement: QUICK-260811-KOG-HOMEPAGE
    verification:
      - kind: unit
        ref: "tests/unit/home-page-model.test.ts (11 tests: fr/en parity, SEO fallback precedence, gallery filtering, locale fallbacks)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/i18n.spec.ts (new structural-contract describe block, 4 tests)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The two responsive wrappers from Plan 01 remain present and keep their visibility contract"
    requirement: QUICK-260811-KOG-HOMEPAGE
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage-runtime-isolation.spec.ts, homepage-runtime-isolation.smoke.spec.ts (unchanged, still passing against HomePage.astro)"
        status: pass
    human_judgment: false

duration: ~1h, done directly in this session (no agent dispatch, to avoid the account-level weekly usage limit hit earlier while finishing Plan 05)
completed: 2026-08-13
status: complete
---

# Quick Task 260811-kog Plan 02: Bilingual Homepage Unification Summary

**A pure, tested buildHomePageModel() plus a single shared HomePage.astro component replacing two byte-for-byte-duplicated fr/en route files — /` and `/en/` now render the same implementation with zero duplicated CMS/SEO/gallery logic.**

## Performance

- **Duration:** ~1h, executed directly in this session's main loop rather than via a dispatched executor (following Plan 05's precedent of finishing directly after that plan's background executor hit an account-level weekly usage limit).
- **Tasks:** 2 (pure model extraction with tests; shared component + route reduction + e2e extension)
- **Files modified:** 6 (3 created, 3 modified)

## Accomplishments

- `src/lib/home-page-model.ts`'s `buildHomePageModel()` is a pure, dependency-free (of fetch/browser APIs) function transforming `{locale, homePage, siteSettings, galleries, pageUrl}` into the complete render model (SEO title/description/image, JSON-LD structured data with correct locale/jobTitle, gallery filtering + per-locale alt/statement fallbacks, hero color + contrast pairing, site copy).
- `src/components/HomePage.astro` is now the SOLE implementation of the bilingual homepage: fetches once, builds the model once, renders `BaseLayout` + `HomeCarousel` + `MobileHomePrototype` + the shared responsive `<style>` block.
- `src/pages/index.astro` and `src/pages/en/index.astro` are now 3-line locale adapters — no fetching, no SEO computation, no gallery mapping of their own.
- Real, independently-verified build output confirms both `/index.html` and `/en/index.html` carry the correct locale in JSON-LD (`inLanguage`, `jobTitle`), correct canonical/alternate hrefs, and all 5 gallery links.
- 4 new e2e tests in `tests/e2e/i18n.spec.ts` directly compare the two locales' structural contract: canonical self-reference + shared alternate set, `?view=grid` persistence on both, no cross-locale copy leakage, identical gallery slug sets under each locale's own path prefix.
- Verification went beyond the plan's own targeted file list: the FULL chromium e2e suite (343/343) and the full root unit suite (411/411) both pass, confirming zero regression anywhere else in the site.

## Task Commits

1. **Task 1: Extract buildHomePageModel() with 11 unit tests** - `59d330c` (feat)
2. **Task 2: Create HomePage.astro, reduce routes to adapters, extend i18n e2e tests** - `b17c459` (feat)

**Plan metadata:** committed separately by the orchestrator (this SUMMARY, STATE.md).

## Files Created/Modified

- `src/lib/home-page-model.ts` (new) - Pure fr/en homepage render-model builder
- `tests/unit/home-page-model.test.ts` (new) - 11 behavioral tests (parity, fallbacks, filtering, no-fetch guarantee)
- `src/components/HomePage.astro` (new) - Shared bilingual homepage implementation
- `src/pages/index.astro` - Reduced to a 3-line French locale adapter
- `src/pages/en/index.astro` - Reduced to a 3-line English locale adapter
- `tests/e2e/i18n.spec.ts` - New "homepage structural contract parity" describe block, 4 tests

## Decisions Made

See `key-decisions` in frontmatter above.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Widened the structuredData prop type at the single BaseLayout call site**
- **Found during:** `npm run typecheck` after writing `HomePage.astro`.
- **Issue:** `BaseLayout.astro`'s `structuredData` prop expects `Record<string, unknown> | Record<string, unknown>[]`, which TypeScript does not consider a named closed interface (`HomePageStructuredData`) structurally assignable to without an index signature, even though every property matches.
- **Fix:** Cast `model.structuredData as unknown as Record<string, unknown>` at the JSX call site only; the model's own return type stays concretely typed for its own unit tests.
- **Files modified:** `src/components/HomePage.astro`
- **Verification:** `npm run typecheck` clean (0 errors) afterward.
- **Committed in:** `b17c459` (part of the Task 2 commit)

**2. [Rule 3 - Blocking] Used a dynamic import in the new unit test file to avoid a module-load-order env-var failure**
- **Found during:** First run of `tests/unit/home-page-model.test.ts` — `Missing SANITY_PROJECT_ID or SANITY_DATASET env vars`.
- **Issue:** `home-page-model.ts` transitively imports `image.ts`, which imports the real `sanityClient` value from `sanity.ts` — a module that throws at load time if these env vars are unset. Static ES module imports are hoisted above any other top-level code, so setting `process.env.*` between/after static `import` statements (as this file initially did) has no effect.
- **Fix:** Matched the pattern already established in `tests/unit/gallery-query.test.ts`: set the env vars first, then dynamically `await import(...)` the module under test.
- **Files modified:** `tests/unit/home-page-model.test.ts`
- **Verification:** All 11 tests pass.
- **Committed in:** `59d330c` (part of the Task 1 commit)

---

**Total deviations:** 2 auto-fixed, both blocking/mechanical (a TS type-widening cast and a test-import-ordering fix). Neither reduces scope or weakens a plan requirement.
**Impact on plan:** No scope creep. Both fixes were necessary for the plan's own extraction to typecheck and test successfully.

## Issues Encountered

None beyond the two deviations above — the two homepage route files were confirmed byte-identical except for locale/import-depth/two localized strings before extraction began, which made the extraction itself low-risk and mechanical.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 02 is complete, committed, and verified against the full test suite (not just its own targeted subset).
- Plans 04 and 06 of the same `260811-kog` quality-diagnostic remediation remain unstarted.
- The `buildHomePageModel()` extraction pattern (pure model function + thin Astro adapter) is directly reusable for Plan 04's gallery/edition detail page merge, which faces the same fr/en duplication shape.

---
*Phase: quick-260811-kog-corriger-les-constats-du-diagnostic-qual*
*Completed: 2026-08-13*
