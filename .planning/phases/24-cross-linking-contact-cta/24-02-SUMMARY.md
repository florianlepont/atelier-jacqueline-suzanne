---
phase: 24-cross-linking-contact-cta
plan: 02
subsystem: render-models
tags: [astro, typescript, i18n, page-models, unit-tests]

# Dependency graph
requires: ["24-01: src/lib/related-edition.ts getRelatedEditionLink() + Gallery.relatedEdition"]
provides:
  - "src/lib/page-models.ts: GalleryDetailModel.relatedLink (EDN-12 reverse cross-link)"
  - "src/lib/page-models.ts: GalleryDetailModel.contactCtaHref/contactCtaLabel (CONT-04)"
  - "src/lib/page-models.ts: EditionDetailModel.contactCtaHref/contactCtaLabel (CONT-04)"
  - "src/lib/page-models.ts: CONTACT_CTA_LABEL module-level copy map (not exported)"
affects: [24-03, 24-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Locale copy map (Record<Locale, string>) is the established idiom for any hardcoded fr/en label in page-models.ts (HERO_LABEL, SCROLL_HINT_LABEL, HERO_CAPTION, FORMAT_TEXT, now CONTACT_CTA_LABEL) — copy lives in the render-model layer, never in the .astro component"
    - "Cross-model copy-identity guard: when two render models must share one string, assert direct equality between them in a test rather than only asserting each independently, so future divergence fails loudly"

key-files:
  created: []
  modified:
    - src/lib/page-models.ts
    - tests/unit/page-models.test.ts

key-decisions:
  - "CTA copy lives in page-models.ts, not the body components — plan's binding discretion resolution, keeps every visible string unit-testable and matches the existing copy-map idiom for HERO_LABEL/SCROLL_HINT_LABEL/HERO_CAPTION/FORMAT_TEXT"
  - "English CTA copy 'Interested in a piece? Get in touch' — plan's binding discretion resolution (UI-SPEC.md's proposed mirror of the locked French direction)"

requirements-completed: [EDN-12, CONT-04]

coverage:
  - id: D1
    description: "buildGalleryDetailModel() emits a ready-to-render relatedLink for a gallery with a populated relatedEdition, and null otherwise"
    requirement: "EDN-12"
    verification:
      - kind: unit
        ref: "tests/unit/page-models.test.ts#buildGalleryDetailModel resolves relatedEdition into a link when populated (fr), and null when absent"
        status: pass
      - kind: unit
        ref: "tests/unit/page-models.test.ts#buildGalleryDetailModel resolves relatedEdition into a locale-correct href for en"
        status: pass
    human_judgment: false
  - id: D2
    description: "buildGalleryDetailModel() and buildEditionDetailModel() both emit a locale-correct contact CTA href and label"
    requirement: "CONT-04"
    verification:
      - kind: unit
        ref: "tests/unit/page-models.test.ts#buildGalleryDetailModel emits a locale-correct, base-path-safe contact CTA href and label"
        status: pass
      - kind: unit
        ref: "tests/unit/page-models.test.ts#buildEditionDetailModel emits a locale-correct, base-path-safe contact CTA href and label, identical to the gallery model"
        status: pass
    human_judgment: false
  - id: D3
    description: "The CTA label is identical between gallery and édition models for a given locale — one string, no per-page contextual wording"
    requirement: "CONT-04"
    verification:
      - kind: unit
        ref: "tests/unit/page-models.test.ts#buildEditionDetailModel emits a locale-correct, base-path-safe contact CTA href and label, identical to the gallery model (direct fr.contactCtaLabel/en.contactCtaLabel equality assertion against the gallery model)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Both CTA hrefs point at the locale's contact route through Astro's base-aware URL builder, never a literal string"
    requirement: "CONT-04"
    verification:
      - kind: unit
        ref: "tests/unit/page-models.test.ts (contactCtaHref matches /\\/contact\\/?$/ for fr and /\\/en\\/contact\\/?$/ for en, both models)"
        status: pass
      - kind: static
        ref: "grep -n \"getRelativeLocaleUrl(locale, 'contact')\" src/lib/page-models.ts — exactly 2 call sites, no literal path string"
        status: pass
    human_judgment: false

duration: ~15min
completed: 2026-08-26
status: complete
---

# Phase 24 Plan 02: Detail Render-Model Extensions (EDN-12 relatedLink + CONT-04 contact CTA) Summary

**Both `GalleryDetailModel` and `EditionDetailModel` now carry a base-path-safe, locale-correct contact CTA (href + one shared fr/en label), and `GalleryDetailModel` gains the EDN-12 reverse cross-link to its related édition — all resolved in `page-models.ts`, none hardcoded in a component.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-08-26T21:07:00Z (approx.)
- **Completed:** 2026-08-26T21:12:00Z (last task commit)
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- `GalleryDetailModel` gains `relatedLink: RelatedEditionLink | null`, positioned immediately before `gridItems` (mirroring `EditionDetailModel`'s own field), resolved via `getRelatedEditionLink(gallery.relatedEdition, locale)` — `null` for the common case of no linked édition (D-02)
- The shipped forward path (`getRelatedGalleryLink`, `related-gallery.ts`) is untouched — confirmed via `grep -c "getRelatedGalleryLink" src/lib/page-models.ts` still equal to 2
- New module-level `CONTACT_CTA_LABEL: Record<Locale, string>` copy map, alongside the existing `HERO_LABEL`/`SCROLL_HINT_LABEL` idiom, carrying the locked French CTA copy and the discretion-resolved English mirror
- Both `GalleryDetailModel` and `EditionDetailModel` gain `contactCtaHref` (via `getRelativeLocaleUrl(locale, 'contact')`, base-path-safe) and `contactCtaLabel` (from `CONTACT_CTA_LABEL[locale]`), appended as each interface's last fields
- A regression test directly compares `contactCtaLabel` between the gallery and édition models for the same locale, so any future copy divergence between the two page types fails loudly (D-06)

## Task Commits

Each task followed the RED → GREEN TDD cycle, committed atomically:

1. **Task 1: Emit the EDN-12 reverse cross-link from buildGalleryDetailModel**
   - `d4bc43e` (test, RED) — failing assertions for `relatedLink` populated/null/en cases
   - `78ecd05` (feat, GREEN) — `relatedLink` field + resolution added, all tests pass
2. **Task 2: Emit the CONT-04 contact CTA href and label from both detail models**
   - `9141abb` (test, RED) — failing assertions for `contactCtaHref`/`contactCtaLabel` on both models plus the cross-model equality guard
   - `6ddac9b` (feat, GREEN) — `CONTACT_CTA_LABEL` map + both fields added to both builders, all tests pass

## Files Created/Modified

- `src/lib/page-models.ts` — `RelatedEditionLink`/`getRelatedEditionLink` import, `GalleryDetailModel.relatedLink`, `CONTACT_CTA_LABEL` copy map, `contactCtaHref`/`contactCtaLabel` on both `GalleryDetailModel` and `EditionDetailModel`, resolved in both `buildGalleryDetailModel` and `buildEditionDetailModel`
- `tests/unit/page-models.test.ts` — 4 new tests: 2 for `relatedLink` (populated/null/en href), 2 for the contact CTA (per-model locale correctness + no-arrow check + cross-model label equality)

## Decisions Made

- Followed the plan's binding `<discretion_resolutions>` verbatim: CTA copy lives in `page-models.ts` (not the body components), and the English label is `Interested in a piece? Get in touch` — both confirmed against `24-UI-SPEC.md`'s Copywriting Contract table byte-for-byte (including the middle-dot inclusive `Intéressé·e` form and the regular space before `?`, which the source markdown itself uses rather than a narrow no-break space).
- `relatedLink` and `contactCtaHref`/`contactCtaLabel` field ordering in both interfaces and return objects follows the plan's explicit positioning instructions (relatedLink immediately before gridItems; CTA fields appended last).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed missing npm dependencies in the worktree**
- **Found during:** Full-suite verification (`npm run test:unit`) after both tasks' code commits
- **Issue:** This git worktree had no `node_modules` installed at either the root or `sanity/` level (same class of environment gap 24-01-SUMMARY.md documented) — `npm run test:unit` failed on an unrelated pre-existing suite, `tests/unit/dashboard-logic.test.ts`, unable to resolve `@sanity/icons/BulbOutline` (a transitive dependency of the `sanity/` subproject, not something either of this plan's two files touch).
- **Fix:** Ran `npm install` at the repo root and `npm ci --prefix sanity`. No package.json/lockfile changes.
- **Files modified:** None (node_modules is gitignored; nothing to commit)
- **Verification:** `npm run test:unit` — 717/717 passing across the whole suite (was 596/597 with 1 unrelated suite failing before install).
- **Committed in:** N/A (nothing to commit)

---

**Total deviations:** 1 auto-fixed (1 blocking dependency install, purely environmental, no code/package changes).
**Impact on plan:** No scope creep. `git diff --name-only` against the plan's declared base lists exactly the 2 files in `files_modified` — `src/lib/page-models.ts` and `tests/unit/page-models.test.ts`.

## Issues Encountered

None beyond the dependency-install item documented above.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- `GalleryDetailModel.relatedLink`, `GalleryDetailModel.contactCtaHref`/`contactCtaLabel`, and `EditionDetailModel.contactCtaHref`/`contactCtaLabel` are all live, typed, and unit-tested — ready for wave 3's component work.
- Full plan-level verification passed: `npm run typecheck` (astro check, 0 errors), `npm run lint` (0 errors), `npm run test:unit` (717/717 passing across the whole suite).
- `git diff --name-only` lists exactly `src/lib/page-models.ts` and `tests/unit/page-models.test.ts` — no scope drift.
- Downstream plan 24-03 can now read `model.relatedLink`, `model.contactCtaHref`, `model.contactCtaLabel`; 24-04 can read `model.contactCtaHref`, `model.contactCtaLabel` — no blockers.

---
*Phase: 24-cross-linking-contact-cta*
*Completed: 2026-08-26*
