---
phase: quick-260801-kgh
plan: 01
subsystem: cms
tags: [sanity, groq, edition, gallery, image-orientation, editorial-checklist]

requires:
  - phase: quick-260801 (live migration, orchestrator-performed)
    provides: On the real production dataset, all 3 published editions (Silos, Rebut, Entasse) had their leadPhoto asset prepended to images[0] (with matching alt/rights) and leadPhoto unset, before any code in this task ran.
provides:
  - edition documents manage their cover photo the same way gallery documents already do — via images array position/orientation (pickHeroIndex), not a separate field
  - Removed the redundant leadPhoto field from the Studio schema, the Edition TS type, both GROQ queries, the editorial checklist, and all 4 édition Astro routes (FR/EN detail + list)
  - Gallery Studio tab renamed from "Accueil" to "Couleur" (unrelated, user-requested)
affects: [sanity-studio-schemas, editorial-checklist, edition-astro-routes, gallery-astro-routes-projection]

tech-stack:
  added: []
  patterns:
    - "edition.images and gallery.images now share one GROQ projection (IMAGES_WITH_DIMENSIONS_PROJECTION, renamed from GALLERY_IMAGES_WITH_DIMENSIONS_PROJECTION) so both document types' images dereference asset->metadata.dimensions, which pickHeroIndex needs to prefer a landscape hero"
    - "EditionDetailBody now forwards a required heroIndex prop to DetailHero (previously only GalleryDetailBody did), keeping the hero's aria-label and Lightbox counter in agreement"

key-files:
  created: []
  modified:
    - src/lib/sanity.ts
    - src/lib/image-orientation.ts (referenced, not modified)
    - src/pages/editions/[slug].astro
    - src/pages/en/editions/[slug].astro
    - src/pages/editions/index.astro
    - src/pages/en/editions/index.astro
    - src/components/EditionDetailBody.astro
    - sanity/schemas/edition.ts
    - sanity/schemas/gallery.ts
    - sanity/editorial/checks.ts
    - tests/unit/edition-query.test.ts
    - tests/unit/editorial-checks.test.ts
    - tests/unit/dashboard-logic.test.ts
    - tests/e2e/edition.spec.ts

key-decisions:
  - "Sequenced as 5 tasks so every commit leaves a working tree: (1) share the dimensions-aware GROQ projection first, additive-only; (2) switch all 4 édition routes + EditionDetailBody to pickHeroIndex, which is the commit that repairs the build (broken since the live migration already unset leadPhoto in production); (3) remove leadPhoto from the Edition type/queries only after step 2 removed every reader; (4) remove it from the Studio schema/checklist; (5) unrelated gallery tab rename, isolated."
  - "EditionDetailBody.astro required a new heroIndex prop forward (previously defaulted to 0 unused) — without it, an edition whose landscape hero isn't images[0] would show a wrong aria-label position while the Lightbox opened at a different, correct slide."
  - "Editions listing pages (index.astro, FR/EN) mirror the homepage/404 pattern of images[pickHeroIndex(images)], not just images[0] directly — matching how gallery listing already selects its own thumbnail, confirmed by reading that code rather than assuming."
  - "Edition's checklist keeps its existing combined-per-image check style (not refactored to match gallery's 4-item split) — only the leadPhoto-specific check item was removed, per the plan's explicit scope boundary."

requirements-completed: [260801-kgh]

coverage:
  - id: D1
    description: "edition Studio schema has no leadPhoto field; images field description/validation/preview mirror gallery's images[0]-is-cover convention"
    requirement: "260801-kgh"
    verification:
      - kind: other
        ref: "npm --prefix sanity run lint && npm --prefix sanity run build"
        status: pass
    human_judgment: false
  - id: D2
    description: "Edition TS type, EDITIONS_QUERY, EDITION_BY_SLUG_QUERY no longer reference leadPhoto; images projection now includes asset->metadata.dimensions via the shared IMAGES_WITH_DIMENSIONS_PROJECTION"
    requirement: "260801-kgh"
    verification:
      - kind: unit
        ref: "tests/unit/edition-query.test.ts"
        status: pass
      - kind: other
        ref: "npm run typecheck (0 errors)"
        status: pass
    human_judgment: false
  - id: D3
    description: "All 4 édition Astro routes (FR/EN detail + list) derive their cover from images via pickHeroIndex, matching gallery's own routes; EditionDetailBody forwards heroIndex to DetailHero"
    requirement: "260801-kgh"
    verification:
      - kind: e2e
        ref: "tests/e2e/edition.spec.ts — 'the hero opens the lightbox at its real position (EDN-03); the first grid thumbnail opens it at its own real, differing position' and all other edition.spec.ts tests (12/12 pass)"
        status: pass
      - kind: e2e
        ref: "npm run build against the real production dataset — all 3 real édition pages (rebut, silos, entasse) plus their EN twins build successfully, FR+EN listing pages too"
        status: pass
    human_judgment: false
  - id: D4
    description: "Editorial checklist for edition no longer lists a separate 'Photo principale' item; remaining images checks are unchanged in style"
    requirement: "260801-kgh"
    verification:
      - kind: unit
        ref: "tests/unit/editorial-checks.test.ts"
        status: pass
    human_judgment: false
  - id: D5
    description: "Gallery Studio 'homepage' group tab title changed from 'Accueil' to 'Couleur'; showOnHomePage/heroColor fields unmoved; no other code depends on the old title string"
    requirement: "260801-kgh"
    verification:
      - kind: other
        ref: "grep for 'Accueil' confirms workflowLogic.ts's independent homePage label is untouched; sanity/schemas/gallery.ts lint/build pass"
        status: pass
    human_judgment: false

duration: ~35min (executor) + orchestrator-completed final verification after an API session-limit interruption
completed: 2026-08-01
status: complete
---

# Phase quick-260801-kgh Plan 01: Unify Edition Cover Photo With Gallery Pattern Summary

**Editions now pick their cover photo from the shared `images` array via the same landscape-preferring `pickHeroIndex` logic galleries already use, instead of a separate dedicated `leadPhoto` field — the redundant field and every line of code reading it were removed from the Studio schema, TypeScript types, GROQ queries, the editorial checklist, and all 4 édition Astro routes.**

## Performance

- **Duration:** ~35 min executor time across 5 tasks
- **Tasks:** 5/5 complete
- **Files modified:** 14

## Accomplishments
- `src/lib/sanity.ts`: renamed `GALLERY_IMAGES_WITH_DIMENSIONS_PROJECTION` → `IMAGES_WITH_DIMENSIONS_PROJECTION` and applied it to both `EDITIONS_QUERY`/`EDITION_BY_SLUG_QUERY`, so edition images now carry the `asset->metadata.dimensions` data `pickHeroIndex` needs; removed `leadPhoto` from the `Edition` interface and both queries.
- All 4 édition routes (`src/pages/editions/[slug].astro`, its EN twin, and both listing pages) now derive their cover photo via `pickHeroIndex(edition.images)`, matching gallery's routes exactly — including the listing pages, which were confirmed (by reading the real gallery listing code, not assumed) to also use `pickHeroIndex` rather than a bare `images[0]`.
- `EditionDetailBody.astro` now forwards a required `heroIndex` prop to `DetailHero` (previously only `GalleryDetailBody` did this), keeping the hero's aria-label position and the Lightbox's opening slide in agreement even when the landscape hero isn't the array's first item.
- `sanity/schemas/edition.ts`: removed the entire `leadPhoto` field; `images`' description, empty-array validation message, and `preview.select.media` (now `images.0`) all mirror `gallery.ts`'s existing "first photo is the cover" convention.
- `sanity/editorial/checks.ts`: removed the edition checklist's separate "Photo principale avec image, descriptions et droits" item — the remaining images-array checks already require at least one fully-described photo.
- `sanity/schemas/gallery.ts`: renamed the Studio tab `Accueil` → `Couleur` (title only; the `homepage` group key and its `showOnHomePage`/`heroColor` fields are unchanged) — a separate, unrelated user request bundled into this same task.
- Tests updated to match: `tests/unit/edition-query.test.ts`, `tests/unit/editorial-checks.test.ts`, `tests/unit/dashboard-logic.test.ts`, `tests/e2e/edition.spec.ts` (including retargeting two hero-thumbnail locators from a stale `[data-index="0"]` selector to the structural `.detail-hero [data-gallery-thumb]` one).

## Task Commits

Each task was committed atomically, in dependency order so every commit leaves a working build:

1. **Share the dimensions-aware GROQ projection** - `676d321` (feat)
2. **Switch all 4 édition routes + EditionDetailBody to pickHeroIndex** (repairs the build, which the prior live-data migration had already broken) - `88bae08` (fix)
3. **Remove leadPhoto from the Edition type + both GROQ queries** - `56608ed` (refactor)
4. **Remove leadPhoto from the Studio schema + editorial checklist** - `a0be71c` (refactor)
5. **Rename the gallery "Accueil" tab to "Couleur"** - `8a51e75` (chore)

**Plan metadata:** committed separately by the orchestrator (per instructions, this executor does not commit docs artifacts)

## Decisions Made
- Task ordering was deliberately sequenced so the build is never broken for longer than necessary: the live production migration (done before this task started) had already unset `leadPhoto` on all 3 real editions, which meant `npm run build`/typecheck were RED from the very start of this task until task 2 landed — task 2 is explicitly the fix commit, not a refactor commit, and is what makes the tree buildable again against the real dataset.
- `pickHeroIndex` needs real image dimensions to prefer a landscape hero; edition's `images` projection didn't have them before this task (unlike gallery's), so without task 1, every edition would have silently fallen back to index 0 with no visible error — a passing-but-wrong outcome rather than a loud failure. Task 1 exists specifically to close that gap.
- Edition's checklist keeps its existing combined-per-image check style; this task only removed the leadPhoto-specific item, per the plan's explicit scope boundary (not a refactor to match gallery's 4-item-split style).

## Deviations from Plan

**1. [Documented in-plan, not an auto-fix] `EditionDetailBody.astro` required a new prop**
The plan itself called this out as a necessary addition (not an unplanned deviation the executor discovered mid-task): `DetailHero` accepts an optional `heroIndex` prop defaulting to `0`; `GalleryDetailBody` already forwarded it but `EditionDetailBody` never did. Without forwarding it, an édition whose landscape hero sits at a non-zero images[] index would show an aria-label naming the wrong position while the Lightbox correctly opened at a different slide — a real accessibility/consistency bug the plan pre-empted rather than one found live.

**2. [Orchestrator-completed] Final verification after an API session-limit interruption**
The original executor session completed all 5 task commits and started its final verification pass (`npm run build` against the real dataset, plus the full e2e suite) when it hit the session's API usage limit and terminated. No code was left uncommitted or in a broken state — `git status` showed a clean tree with all 5 commits present. The orchestrator independently re-ran and confirmed every remaining verification step in this same worktree before merging: `npm run test:unit` (271/271), `npm run lint`, `npm run typecheck` (0 errors), `npm --prefix sanity run lint`, `npm run build` against the real production dataset (all 29 pages built, including all 3 real édition detail pages FR+EN and both listing pages), and the full `edition.spec.ts` + `gallery.spec.ts` e2e suites (45/45 passed, chromium), including the specific hero/Lightbox-position regression test for editions.

---

**Total deviations:** 1 pre-empted (in-plan, not auto-fixed reactively) + 1 orchestrator-completed verification continuation (no code change, session-limit related only).
**Impact on plan:** None on scope or correctness — all verification that couldn't complete in the original session was completed identically afterward with the same passing results.

## Issues Encountered
- The original executor session hit `You've hit your session limit` (API usage) partway through its final verification pass, after all 5 code commits were already made. This is an infrastructure/quota event, not a code or plan defect. The orchestrator resumed by inspecting the (clean, fully-committed) worktree directly and completing the remaining verification steps itself.

## User Setup Required
None - no external service configuration required. The live Sanity data migration this task depends on was already performed separately by the orchestrator before this task started.

## Next Phase Readiness
- All verification gates pass: unit (271/271), lint, typecheck (0 errors), Sanity Studio lint + build, root Astro build against the real production dataset (29/29 pages), and the full edition + gallery e2e suites (45/45, chromium).
- The 3 real published editions (Silos, Rebut, Entasse) render correctly end-to-end with their originally-migrated cover photo, confirmed by both the static build output and the live e2e Lightbox-position test.
- No outstanding leadPhoto references remain in schema, types, queries, checklist, or Astro routes.

---
*Phase: quick-260801-kgh*
*Completed: 2026-08-01*

## Self-Check: PASSED

All 5 claimed commits confirmed present in `git log --oneline` (676d321, 88bae08, 56608ed, a0be71c, 8a51e75). Working tree clean. All verification commands re-run by the orchestrator and confirmed passing.
