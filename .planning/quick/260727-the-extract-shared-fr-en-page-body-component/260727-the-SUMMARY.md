---
phase: quick-260727-the
plan: 01
subsystem: ui
tags: [astro, refactor, i18n, deduplication]

# Dependency graph
requires: []
provides:
  - 5 shared fr/en page-body Astro components (AboutPageBody, ContactPageBody, EditionDetailBody, GalleryDetailBody, EditionsOverviewBody)
  - 10 route files thinned to data-resolution frontmatter + a single BaseLayout/Body template call
affects: [about-page, contact-page, editions-overview, edition-detail, gallery-detail]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Shared fr/en page-body component: route keeps its own Sanity fetch + .fr/.en resolution + fallback strings, then passes fully pre-resolved primitives (including locale-specific visible strings) as explicit props to a body component under src/components/ that owns the markup + the single copy of the style block."

key-files:
  created:
    - src/components/AboutPageBody.astro
    - src/components/ContactPageBody.astro
    - src/components/EditionDetailBody.astro
    - src/components/GalleryDetailBody.astro
    - src/components/EditionsOverviewBody.astro
  modified:
    - src/pages/about.astro
    - src/pages/en/about.astro
    - src/pages/contact.astro
    - src/pages/en/contact.astro
    - src/pages/editions/[slug].astro
    - src/pages/en/editions/[slug].astro
    - src/pages/galleries/[slug].astro
    - src/pages/en/galleries/[slug].astro
    - src/pages/editions/index.astro
    - src/pages/en/editions/index.astro

key-decisions:
  - "Coalesced ContactPage professionalLinks[].url with `?? ''` when building the instagramLink/otherLinks props — the Sanity ContactPage type declares url?: string, and TS's .filter() predicate does not narrow that through to the array's element type, so the plan's literal { url: string; label: string } Props type failed typecheck without the coalesce. Runtime behavior is unchanged since the route's own filter already guarantees url is truthy at that point."

patterns-established:
  - "Pattern: fr/en page-body extraction — body component takes zero i18n/data-fetch imports and instead accepts a locale plus every visible/aria string as an explicit prop; the two thin route files remain the only place that resolves `.fr`/`.en` fields and fallback copy."

requirements-completed: [REFACTOR-DEDUP]

coverage:
  - id: D1
    description: "About page fr/en pair extracted into shared AboutPageBody with byte-identical markup, style block, and ampersand-escaped headings"
    requirement: "REFACTOR-DEDUP"
    verification:
      - kind: other
        ref: "npm run typecheck && npm run build (per-task verification, Task 1)"
        status: pass
      - kind: e2e
        ref: "npx playwright test tests/e2e/about.spec.ts (Task 6 full run)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Contact page fr/en pair extracted into shared ContactPageBody, ContactForm still mounts with correct locale/publicEmail"
    requirement: "REFACTOR-DEDUP"
    verification:
      - kind: other
        ref: "npm run typecheck && npm run build (per-task verification, Task 2)"
        status: pass
      - kind: e2e
        ref: "npx playwright test tests/e2e/contact.spec.ts, tests/e2e/social-links.spec.ts (Task 6 full run)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Édition detail fr/en pair extracted into shared EditionDetailBody (DetailHero, back-link, format line, related link, grid, Lightbox)"
    requirement: "REFACTOR-DEDUP"
    verification:
      - kind: other
        ref: "npm run typecheck && npm run build (per-task verification, Task 3)"
        status: pass
      - kind: e2e
        ref: "npx playwright test tests/e2e/edition.spec.ts (Task 6 full run)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Gallery detail fr/en pair extracted into shared GalleryDetailBody (landscape-preferred hero, masonry grid excluding hero, full-array Lightbox, transparent header, hidden footer)"
    requirement: "REFACTOR-DEDUP"
    verification:
      - kind: other
        ref: "npm run typecheck && npm run build (per-task verification, Task 4)"
        status: pass
      - kind: e2e
        ref: "npx playwright test tests/e2e/gallery.spec.ts (Task 6 full run)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Éditions overview fr/en pair extracted into shared EditionsOverviewBody (poster grid grouped-by-3/alternating side, EmptyState fallback)"
    requirement: "REFACTOR-DEDUP"
    verification:
      - kind: other
        ref: "npm run typecheck && npm run build (per-task verification, Task 5)"
        status: pass
      - kind: e2e
        ref: "npx playwright test tests/e2e/edition.spec.ts (overview coverage, Task 6 full run)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Zero behavior/visual change across all 5 pairs, verified against the pre-existing 252-test Playwright baseline plus the 206-test Vitest suite, with the 6 excluded route files (mentions-legales/confidentialite/index, both locales) confirmed byte-unchanged"
    requirement: "REFACTOR-DEDUP"
    verification:
      - kind: unit
        ref: "npm run test:coverage (206 tests passed)"
        status: pass
      - kind: e2e
        ref: "npx playwright test (252 tests passed, matching baseline, all specs green including seo/accessibility/i18n)"
        status: pass
      - kind: other
        ref: "git status --short -- src/pages/mentions-legales.astro src/pages/en/mentions-legales.astro src/pages/confidentialite.astro src/pages/en/confidentialite.astro src/pages/index.astro src/pages/en/index.astro (empty output)"
        status: pass
    human_judgment: false

duration: 9min
completed: 2026-07-27
status: complete
---

# Quick Task 260727-the: Extract Shared fr/en Page-Body Components Summary

**Extracted 5 shared Astro body components (About, Contact, Édition detail, Gallery detail, Éditions overview) from 10 near-byte-identical fr/en route files, removing ~1,400 lines of duplicated markup/CSS while keeping every route's own Sanity fetch, locale resolution, and fallback strings intact.**

## Performance

- **Duration:** ~9 min
- **Started:** 2026-07-27T19:29:00Z (approx, first per-task verification run)
- **Completed:** 2026-07-27T19:37:39Z
- **Tasks:** 6 (5 extraction tasks + 1 full-suite regression verification)
- **Files modified:** 15 (5 created, 10 modified)

## Accomplishments
- `AboutPageBody.astro` — full about-page markup + style block, with the two `&amp;`-escaped `<h2>` headings passed as single-ampersand JS-expression props to reproduce identical escaped output.
- `ContactPageBody.astro` — contact-page markup + style block + `ContactForm` mount, taking `instagramLink`/`otherLinks` as pre-resolved `{ url, label }` objects.
- `EditionDetailBody.astro` — édition detail markup + sibling `Lightbox` + style block; `gridItems.length > 0` proven behaviorally equivalent to the prior `(edition.images?.length ?? 0) > 0` guard.
- `GalleryDetailBody.astro` — gallery detail markup + sibling `Lightbox` + style block; takes zero hardcoded locale strings (every visible/aria string is a prop).
- `EditionsOverviewBody.astro` — poster-grid markup + style block, now owns the group-by-3/alternate-side chunking logic applied to pre-resolved tile objects.
- All 10 route files reduced to data-fetch + `.fr`/`.en` resolution + fallback frontmatter, rendering a single `<BaseLayout><…Body {...props} /></BaseLayout>` call with no page `<style>` block.
- Full regression suite (206 Vitest unit tests + 252 Playwright e2e tests) passes with identical outcomes to the pre-refactor baseline; the 6 explicitly-excluded route files are confirmed untouched.

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract AboutPageBody from the about.astro fr/en pair** - `64fea0e` (refactor)
2. **Task 2: Extract ContactPageBody from the contact.astro fr/en pair** - `a8e8303` (refactor)
3. **Task 3: Extract EditionDetailBody from the editions/[slug].astro fr/en pair** - `a69b580` (refactor)
4. **Task 4: Extract GalleryDetailBody from the galleries/[slug].astro fr/en pair** - `04ae2c2` (refactor)
5. **Task 5: Extract EditionsOverviewBody from the editions/index.astro fr/en pair** - `8ed5572` (refactor)
6. **Task 6: Full-suite regression verification** - no source changes, verification only (typecheck + test:coverage + build + playwright all green; working tree clean after)

**Plan metadata:** committed separately by the orchestrator (SUMMARY.md/STATE.md not committed by this executor per constraints).

## Files Created/Modified
- `src/components/AboutPageBody.astro` - Shared about-page markup + style block
- `src/components/ContactPageBody.astro` - Shared contact-page markup + style block + ContactForm mount
- `src/components/EditionDetailBody.astro` - Shared édition detail markup + Lightbox + style block
- `src/components/GalleryDetailBody.astro` - Shared gallery detail markup + Lightbox + style block
- `src/components/EditionsOverviewBody.astro` - Shared éditions overview poster-grid markup + style block + grouping logic
- `src/pages/about.astro` / `src/pages/en/about.astro` - Thinned to data-resolution frontmatter + AboutPageBody call
- `src/pages/contact.astro` / `src/pages/en/contact.astro` - Thinned to data-resolution frontmatter + ContactPageBody call
- `src/pages/editions/[slug].astro` / `src/pages/en/editions/[slug].astro` - Thinned to getStaticPaths + data-resolution frontmatter + EditionDetailBody call
- `src/pages/galleries/[slug].astro` / `src/pages/en/galleries/[slug].astro` - Thinned to getStaticPaths + data-resolution frontmatter + GalleryDetailBody call
- `src/pages/editions/index.astro` / `src/pages/en/editions/index.astro` - Thinned to data-fetch + per-edition tile resolution + EditionsOverviewBody call

## Decisions Made
- Coalesced `ContactPage.professionalLinks[].url` (typed `string | undefined` in `src/lib/sanity.ts`) with `?? ''` when constructing the `instagramLink`/`otherLinks` props passed to `ContactPageBody`, since TypeScript does not narrow an array's element type through a `.filter()` predicate. This is purely a type-level fix — the route's existing filter (`link.url && link.label?.fr`) already guarantees `url` is truthy at that point, so runtime output is unchanged.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Coalesced optional `url` field on ContactPage professional links**
- **Found during:** Task 2 (Extract ContactPageBody)
- **Issue:** `npm run typecheck` failed with `Type 'string | undefined' is not assignable to type 'string'` on the `instagramLink`/`otherLinks` props, because `ContactPage.professionalLinks[].url` is typed `string | undefined` in `src/lib/sanity.ts` and TypeScript's `.filter()` predicate does not narrow the array element type carried forward through `.map()`.
- **Fix:** Changed `url: instagramLink.url` / `url: link.url` to `url: instagramLink.url ?? ''` / `url: link.url ?? ''` when building the resolved prop objects in both `src/pages/contact.astro` and `src/pages/en/contact.astro`.
- **Files modified:** `src/pages/contact.astro`, `src/pages/en/contact.astro`
- **Verification:** `npm run typecheck` passes with 0 errors; `npm run build` succeeds; `tests/e2e/contact.spec.ts` and `tests/e2e/social-links.spec.ts` pass in the Task 6 full run.
- **Committed in:** `a8e8303` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Type-level fix only, matching the actual Sanity type definitions rather than the plan's literal Props type. No behavioral or visual change — runtime output identical.

## Issues Encountered
None beyond the deviation documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 5 fr/en page-body pairs are now single-source-of-truth components; any future structural change to these pages only needs to be made once.
- Full regression suite (206 unit + 252 e2e tests) is green, matching the pre-refactor baseline exactly — safe to build on.
- No blockers.

---
*Phase: quick-260727-the*
*Completed: 2026-07-27*

## Self-Check: PASSED

All 5 created components, all 10 modified route files, and the SUMMARY.md itself were confirmed present on disk. All 5 task commit hashes (64fea0e, a8e8303, a69b580, 04ae2c2, 8ed5572) were confirmed present in `git log --oneline --all`. No missing items.
