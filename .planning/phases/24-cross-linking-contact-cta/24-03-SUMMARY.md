---
phase: 24-cross-linking-contact-cta
plan: 03
subsystem: ui
tags: [astro, css, playwright, e2e, i18n]

# Dependency graph
requires:
  - phase: 24-02
    provides: "src/lib/page-models.ts: GalleryDetailModel.relatedLink / contactCtaHref / contactCtaLabel"
provides:
  - "GalleryDetailBody.astro: .gallery-detail__related (EDN-12 reverse cross-link), conditional, top of content area"
  - "GalleryDetailBody.astro: .gallery-detail__contact-cta-zone/-rule/-arrow (CONT-04 CTA), unconditional, end of content area"
  - "GalleryDetailPage.astro: relatedLink/contactCtaHref/contactCtaLabel prop threading"
  - "tests/e2e/gallery.spec.ts: 'gallery contact CTA (CONT-04)' and 'gallery reverse edition cross-link (EDN-12)' describe blocks"
affects: [24-04, 24-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Byte-for-byte CSS mirroring of an existing sibling component's class (EditionDetailBody.astro's .edition-detail__related -> GalleryDetailBody.astro's .gallery-detail__related, renamed only)"
    - "Runtime href discovery (homepage Grille toggle + a.home-grid__tile evaluateAll) reused as a shared e2e navigation helper across two describe blocks, never a literal gallery slug in source"

key-files:
  created: []
  modified:
    - src/components/GalleryDetailBody.astro
    - src/components/GalleryDetailPage.astro
    - tests/e2e/gallery.spec.ts

key-decisions:
  - "Task 3's EDN-12 e2e block proves only the conditional-render contract (zero-or-one, never broken) and per-element correctness when present — it does NOT assert at least one gallery has a linked édition, since no gallery yet carries a published relatedEdition (plan 24-05's blocking content checkpoint converts this into a hard presence assertion)"

requirements-completed: [EDN-12, CONT-04, UI-03]

coverage:
  - id: D1
    description: "A gallery detail page with a linked édition shows a bordered cross-link at the top of the content area; a gallery without one shows no element at all"
    requirement: "EDN-12"
    verification:
      - kind: e2e
        ref: "tests/e2e/gallery.spec.ts#gallery reverse edition cross-link (EDN-12) > every gallery shows zero or one related-edition link, correct when present, at both viewports"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every gallery detail page ends its photo sequence with the contact CTA (unconditional, no sold-state logic), linking to the locale contact route, matching sketch 018 Variant B styling"
    requirement: "CONT-04"
    verification:
      - kind: e2e
        ref: "tests/e2e/gallery.spec.ts#gallery contact CTA (CONT-04) > CTA renders after the grid, links to the contact route, and matches D-08 styling, at both viewports"
        status: pass
      - kind: e2e
        ref: "tests/e2e/gallery.spec.ts#gallery contact CTA (CONT-04) > en: CTA text mirrors the fr direction (\"Get in touch\")"
        status: pass
    human_judgment: false
  - id: D3
    description: "Both new elements render correctly at phone width (390px) and desktop width (1280px), with existing gallery layout unchanged"
    requirement: "UI-03"
    verification:
      - kind: e2e
        ref: "tests/e2e/gallery.spec.ts (both new describe blocks assert computed styles at both {width:390,height:844} and {width:1280,height:900})"
        status: pass
      - kind: e2e
        ref: "npm run test:e2e full suite (367 tests, 366 passed, 1 pre-existing unrelated flake reproduced as passing in isolation)"
        status: pass
    human_judgment: false

duration: ~15min
completed: 2026-08-26
status: complete
---

# Phase 24 Plan 03: Gallery Cross-Link + Contact CTA Rendering Summary

**Gallery detail pages now render EDN-12's conditional reverse cross-link to the associated édition at the top of the content area, and CONT-04's unconditional contact CTA (sketch 018 Variant B styling) at the end of the photo sequence, both proven at 390px and 1280px via new Playwright coverage.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-08-26T19:15:00Z (approx.)
- **Completed:** 2026-08-26T19:29:00Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- `GalleryDetailBody.astro` gains a `relatedLink` prop, rendered as the first child of `.gallery-detail__content` when non-null, using `.gallery-detail__related` — a byte-for-byte rename of `EditionDetailBody.astro`'s shipped `.edition-detail__related` treatment (2px `currentColor` border, `44px` min-height, `::after` arrow, combined hover/focus-visible accent swap)
- `GalleryDetailBody.astro` gains `contactCtaHref`/`contactCtaLabel` props, rendered unconditionally as the last child of `.gallery-detail__content` (after `GalleryGrid`) via a new `.gallery-detail__contact-cta-zone`/`-rule`/`-arrow` structure matching sketch 018 Variant B (pink hairline, 20px Unbounded 600 link text, `translateX(4px)` arrow nudge on hover/focus-visible, no filled background per D-08)
- The stale PORT-06-superseded doc comment ("gallery-only footer hide") was replaced with an accurate one describing the component's current responsibilities
- `GalleryDetailPage.astro` threads `model.relatedLink`, `model.contactCtaHref`, `model.contactCtaLabel` through to the body component
- Two new Playwright `describe` blocks in `tests/e2e/gallery.spec.ts`: "gallery contact CTA (CONT-04)" (DOM-order proof via `compareDocumentPosition`, href/copy/computed-style assertions including the `rgba(0, 0, 0, 0)` no-filled-button guard, both viewports, plus an EN-locale copy check) and "gallery reverse edition cross-link (EDN-12)" (walks every published gallery, proves the zero-or-one conditional-render contract, verifies full correctness whenever present)

## Task Commits

Each task committed atomically:

1. **Task 1: Render the EDN-12 reverse cross-link at the top of the gallery content area** - `c0421c4` (feat)
2. **Task 2: Render the CONT-04 contact CTA at the end of the gallery photo sequence** - `aede2fa` (feat)
3. **Task 3: Cross-viewport e2e coverage for the gallery cross-link and CTA** - `4af52da` (test, includes an in-task lint-hygiene fixup removing an unused `eslint-disable` directive)

## Files Created/Modified

- `src/components/GalleryDetailBody.astro` — new `relatedLink`/`contactCtaHref`/`contactCtaLabel` Props, `.gallery-detail__related` conditional render + CSS (top), `.gallery-detail__contact-cta-zone` unconditional render + CSS (bottom), corrected doc comment
- `src/components/GalleryDetailPage.astro` — threads `model.relatedLink`, `model.contactCtaHref`, `model.contactCtaLabel` into `<GalleryDetailBody />`
- `tests/e2e/gallery.spec.ts` — two new describe blocks (CONT-04, EDN-12) plus a shared runtime href-discovery helper, no hardcoded gallery slugs

## Decisions Made

- Followed the plan's exact CSS/markup specifications verbatim (UI-SPEC.md's Component Contracts for both EDN-12 and CONT-04) — no deviation from the pinned literal values (20px/600/1.25 for the CTA text, byte-for-byte `.edition-detail__related` mirror for the cross-link).
- Task 3's EDN-12 e2e coverage proves the conditional-render contract and per-element correctness, but deliberately does not assert at least one gallery currently has a linked édition — no gallery in the published dataset carries `relatedEdition` yet; that hard presence assertion is plan 24-05's job once the Studio field is populated and published.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Missing `.env` file in the git worktree**
- **Found during:** Task 1 verification (`npm run build`)
- **Issue:** `astro build` failed with "Missing SANITY_PROJECT_ID or SANITY_DATASET env vars" — this worktree had no `.env` file (gitignored, so absent from a fresh worktree checkout).
- **Fix:** Copied the existing `.env` from the main repo checkout into the worktree (same project, no new secrets introduced, nothing committed since `.env` stays gitignored).
- **Files modified:** None tracked (`.env` is gitignored).
- **Verification:** `npm run build` completed successfully, 31 pages generated.
- **Committed in:** N/A (nothing to commit; environmental only).

**2. [Rule 3 - Blocking] Missing `sanity/node_modules` in the git worktree**
- **Found during:** Full-suite verification (`npm run test:unit`) after all three tasks' commits
- **Issue:** Same class of environment gap 24-02-SUMMARY.md documented — `sanity/` subproject had no `node_modules` installed, so `tests/unit/dashboard-logic.test.ts` (unrelated to this plan's files) failed to resolve `@sanity/icons/BulbOutline`.
- **Fix:** Ran `npm ci --prefix sanity`. No package.json/lockfile changes.
- **Files modified:** None (node_modules is gitignored).
- **Verification:** `npm run test:unit` — 717/717 passing across the whole suite (was 597/597 with 1 unrelated suite failing to even load before install).
- **Committed in:** N/A (nothing to commit).

**3. [Rule 1 - Lint hygiene] Removed unused `eslint-disable-next-line no-bitwise` directive**
- **Found during:** Task 3 verification (`npm run lint`)
- **Issue:** The bitwise `&` used in the `compareDocumentPosition` DOM-order check triggered an `eslint-disable` comment that turned out to be unnecessary (the project's eslint config doesn't flag `no-bitwise` for this construct), producing an "unused eslint-disable directive" warning.
- **Fix:** Removed the now-unnecessary disable comment; no logic change.
- **Files modified:** `tests/e2e/gallery.spec.ts`
- **Verification:** `npm run lint` — 0 errors, 0 warnings. Re-ran the affected Playwright tests (`-g "CONT-04"`) — both still pass.
- **Committed in:** `4af52da` (amended into Task 3's commit before the plan-level verification pass, since it only touched Task 3's own new lines).

---

**Total deviations:** 3 auto-fixed (2 blocking environment gaps, both purely environmental with nothing to commit; 1 lint hygiene cleanup within Task 3's own new code).
**Impact on plan:** No scope creep. `git diff --name-only` against the plan's declared base (`46b0cd8`) lists exactly the 3 files in `files_modified` — `src/components/GalleryDetailBody.astro`, `src/components/GalleryDetailPage.astro`, `tests/e2e/gallery.spec.ts`.

## Issues Encountered

- The first full `npx playwright test tests/e2e/gallery.spec.ts` run against the default port 4321 showed 2 failures (the two new CONT-04 tests) with the CTA element not found at all. Root cause: a stale `astro preview` server from a concurrent session (see project memory note on concurrent sessions) was already listening on port 4321 and got reused by Playwright's `reuseExistingServer: true` local default, serving an old build without this plan's changes. Re-running with `E2E_PORT=4322` (a free port, spawning a fresh preview server against the current build) passed all 41 tests in the file. This was an environment/tooling artifact, not a code defect — no fix needed beyond using a free port for verification.
- The full `npm run test:e2e` suite (367 tests) showed 1 failure in `accessibility.spec.ts` ("automatic accent palette contrast", homepage, unrelated to this plan's files) due to a 30s timeout under 5-worker parallel load. Re-ran in isolation: passed in 4.6s. Confirmed as resource-contention flakiness from the full-suite parallel run, not a regression introduced by this plan — out of scope per the deviation rules' scope boundary (pre-existing test, unrelated file).

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- `GalleryDetailBody.astro` now has full parity with `EditionDetailBody.astro`'s cross-link pattern (top) plus the new shared CONT-04 CTA pattern (bottom) — both files use independently-scoped Astro `<style>` blocks with identical inner class names, no shared-component extraction needed.
- Plan 24-04 (if it targets `EditionDetailBody.astro`'s own CONT-04 CTA) can follow the exact same markup/CSS pattern shipped here.
- Plan 24-05's blocking content checkpoint (populating and publishing `relatedEdition` on at least one real gallery in Sanity Studio) is the only remaining step to convert this plan's EDN-12 e2e "zero-or-one" coverage into a hard "at least one gallery has the link" assertion — no code changes needed on this plan's side, purely a content-authoring step.
- Full plan-level verification passed: `npm run typecheck` (0 errors), `npm run lint` (0 errors), `npm run test:unit` (717/717), `npm run test:e2e` (366/367, 1 confirmed-flaky unrelated test passing in isolation), `npm run build && npm run test:artifact` (31 pages, artifact verified).
- `git diff --name-only` against base `46b0cd8` lists exactly the 3 files in `files_modified` — no scope drift.

---
*Phase: 24-cross-linking-contact-cta*
*Completed: 2026-08-26*

## Self-Check: PASSED

- FOUND: `src/components/GalleryDetailBody.astro`
- FOUND: `src/components/GalleryDetailPage.astro`
- FOUND: `tests/e2e/gallery.spec.ts`
- FOUND: `.planning/phases/24-cross-linking-contact-cta/24-03-SUMMARY.md`
- FOUND commit: c0421c4 (feat — EDN-12 reverse cross-link)
- FOUND commit: aede2fa (feat — CONT-04 contact CTA)
- FOUND commit: 4af52da (test — cross-viewport e2e coverage)
- FOUND commit: af3d8a9 (docs — plan completion)
