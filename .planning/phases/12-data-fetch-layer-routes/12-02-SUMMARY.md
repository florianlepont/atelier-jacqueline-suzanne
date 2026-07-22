---
phase: 12-data-fetch-layer-routes
plan: 02
subsystem: content
tags: [astro, sanity, i18n, lightbox, editorial-detail]

requires:
  - phase: 12-data-fetch-layer-routes
    provides: "Plan 12-01's Edition/EditionImage interfaces + getEditions() in src/lib/sanity.ts, and the /editions/ + /en/editions/ overview routes whose row hrefs this plan's tests discover the détail slug from"
provides:
  - "Per-édition detail routes /editions/{slug}/ and /en/editions/{slug}/ via getStaticPaths (fetch-once-pass-as-props)"
  - "Clickable hero (D-05) opening the reused Lightbox at the combined [leadPhoto, ...images] array (D-06), with the photo-shoot grid offset by data-index = i + 1 and no dedup (D-07)"
  - "In-flow 'Retour aux éditions'/'Back to Editions' back-link (D-08)"
  - "Compact D-09 format-details line (pageCount/printRun/dimensions) between statement and grid (D-10)"
affects: [12-03-sitemap-nav-hardening]

tech-stack:
  added: []
  patterns:
    - "Detail route mirrors galleries/[slug].astro's getStaticPaths fetch-once-pass-as-props structure, with three CONTEXT-locked deviations: clickable hero, combined-array Lightbox index math, in-flow back-link"
    - "SEO built directly from title/statement/leadPhoto since edition has no seo field/group (unlike Gallery)"

key-files:
  created:
    - src/pages/editions/[slug].astro
    - src/pages/en/editions/[slug].astro
  modified:
    - tests/e2e/edition.spec.ts

key-decisions:
  - "Grid maps edition.images with NO .slice(1) (unlike gallery's dedup skip) — leadPhoto is a separate schema field, never duplicated into images[], so data-index = i + 1 is a combined-array offset, not a skip"
  - "Back-link placed as the first child of .edition-detail__content, entirely outside the hero/scrim region, in normal document flow — deliberate structural fix for the Phase 10 header-backhome-overlap-logo regression class rather than pixel-coordinated absolute positioning"

patterns-established:
  - "Clickable hero pattern: .edition-detail__hero-trigger is a full-bleed transparent <button data-gallery-thumb data-index=\"0\"> wrapping the hero <img>, with a small expand-affordance SVG signaling interactivity — first time this site's hero photo has been an interactive Lightbox trigger rather than static decoration"

requirements-completed: [EDN-03, EDN-04, EDN-06, EDN-07]

coverage:
  - id: D1
    description: "/editions/{slug}/ and /en/editions/{slug}/ render for every published édition via getStaticPaths, showing hero + statement + format-details line + photo-shoot grid + back-link"
    requirement: EDN-04
    verification:
      - kind: e2e
        ref: "tests/e2e/edition.spec.ts#editions detail > shows a bilingual statement, a format-details line, and a back-link to the overview"
        status: pass
      - kind: other
        ref: "npm run build — emits dist/editions/rebut/index.html and dist/en/editions/rebut/index.html"
        status: pass
    human_judgment: false
  - id: D2
    description: "The reused Lightbox opens on the combined [leadPhoto, ...images] array — hero at data-index=0 (counter 1/N), first grid thumbnail at data-index=1 (counter 2/N), proving the D-06/D-07 offset math"
    requirement: EDN-03
    verification:
      - kind: e2e
        ref: "tests/e2e/edition.spec.ts#editions lightbox > the hero opens the lightbox at 1/N; the first grid thumbnail opens it at 2/N (combined leadPhoto+images array, EDN-03)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The statement is bilingual (differs FR/EN) and both detail routes render correctly at fr root and /en/ prefix"
    requirement: EDN-07
    verification:
      - kind: e2e
        ref: "tests/e2e/edition.spec.ts#editions detail (same test asserts frStatement !== enStatement across both locale URLs)"
        status: pass
    human_judgment: false
  - id: D4
    description: "No edition.seo is read; no price/availability/purchase affordance appears anywhere on the detail page (fr or en)"
    requirement: EDN-06
    verification:
      - kind: e2e
        ref: "tests/e2e/edition.spec.ts#no commerce affordances (detail) > shows no price, availability, or purchase affordance (EDN-06)"
        status: pass
      - kind: other
        ref: "grep of both detail .astro files confirms zero edition.seo references"
        status: pass
    human_judgment: false

duration: ~20min
completed: 2026-07-22
status: complete
---

# Phase 12 Plan 02: Per-Édition Detail Pages Summary

**FR/EN `/editions/{slug}/` detail routes mirroring `galleries/[slug].astro`, with a clickable hero opening the reused Lightbox on a combined `[leadPhoto, ...images]` array, a compact format-details line, and an in-flow back-link — zero commerce affordances.**

## Performance

- **Duration:** ~20 min
- **Tasks:** 2
- **Files modified:** 3 (2 created, 1 modified)

## Accomplishments
- `src/pages/editions/[slug].astro` and `src/pages/en/editions/[slug].astro` render for every published édition via `getStaticPaths` (list fetched once, passed as props — no per-page `getEdition` call)
- Hero is a clickable `<button data-gallery-thumb data-index="0">` (D-05) — the first time this site's detail-page hero photo is an interactive Lightbox trigger rather than static decoration — with a small expand-affordance SVG discoverability cue
- Lightbox receives `[edition.leadPhoto, ...edition.images]` (D-06); the photo-shoot grid maps `edition.images` with no `.slice(1)` and `data-index = i + 1` (D-07), verified end-to-end via the counter reading `1 / N` on the hero and `2 / N` on the first grid thumbnail
- "Retour aux éditions" / "Back to Editions" back-link (D-08) sits in normal document flow as the first child of `.edition-detail__content`, entirely outside the hero/scrim region — the deliberate structural fix for the Phase 10 `header-backhome-overlap-logo` regression class
- Compact D-09 format-details line ("Pages : 50 · Tirage : 2 exemplaires · Dimensions : 21 × 29,7 cm" / EN equivalent) placed between statement and grid (D-10), Label role, no table
- SEO title/description/social image built directly from `edition.title`/`edition.statement[locale]`/`edition.leadPhoto` — `edition.seo` is never read (it doesn't exist on the schema)
- Zero commerce affordances, verified by an automated negative-assertion e2e test reusing the overview's forbidden-token regex

## Task Commits

Each task was committed atomically:

1. **Task 1: Wave 0 — failing détail + lightbox + no-commerce e2e blocks (RED)** - `1b94288` (test)
2. **Task 2: Build the per-édition detail pages (FR + EN)** - `0c8bec8` (feat)

_TDD gate compliance: RED (`test(12-02)`) precedes GREEN (`feat(12-02)`) — verified in git log._

## Files Created/Modified
- `src/pages/editions/[slug].astro` - FR detail route: hero + statement + format line + photo-shoot grid + Lightbox + back-link
- `src/pages/en/editions/[slug].astro` - EN twin (import depth `../../../`, locale `'en'`)
- `tests/e2e/edition.spec.ts` - extended with `editions detail`, `editions lightbox`, `no commerce affordances (detail)` describe blocks

## Decisions Made
- Grid intentionally has NO `.slice(1)` (unlike gallery's dedup skip) — `leadPhoto` is a dedicated schema field, never duplicated into `images[]`, so `data-index = i + 1` is purely the combined-array offset from D-06, not a skip-the-duplicate operation
- Back-link positioning follows D-08's explicit precedent-avoidance instruction: normal document flow, first child of `.edition-detail__content`, never `position: absolute`, never inside the hero — structurally impossible to repeat the Phase 10 overlap bug rather than requiring pixel coordination
- Optional Book structured data (RESEARCH A2 discretion) was omitted — kept the SEO surface simple (title/description/social image only), matching the plan's "may be omitted" guidance

## Deviations from Plan

None — plan executed exactly as written. One environment gap was auto-fixed per Rule 3 (blocking, not a package install):

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Copied the untracked `.env` file into the worktree**
- **Found during:** Task 1 verification (`npm run build`)
- **Issue:** The worktree checkout has no `.env` (gitignored, not copied by `git worktree add`), so `src/lib/sanity.ts` threw "Missing SANITY_PROJECT_ID or SANITY_DATASET env vars" and the build failed before any test could even reach RED/GREEN.
- **Fix:** `cp` the existing `.env` from the main repo checkout into the worktree root (no new secrets created, no content of `.env` modified).
- **Files modified:** `.env` (worktree-local only, not committed — matches `.gitignore`)
- **Verification:** `npm run build` then succeeded; not part of any git commit.

---

**Total deviations:** 1 auto-fixed (1 blocking, environment-only)
**Impact on plan:** No scope creep — purely a local build-environment prerequisite, not a code or content change.

## Issues Encountered
- The first full e2e run against tests/e2e/edition.spec.ts showed 2/3 new blocks still RED even after Task 2's GREEN implementation landed — the Playwright `webServer` config reuses an already-running `localhost:4321` server locally (`reuseExistingServer: !process.env.CI`), and a stale preview server from Task 1's RED run was still serving the pre-Task-2 `dist/`. Killed the stale process on port 4321; the next run picked up the freshly-built `dist/` and all three blocks went GREEN. No code change required — a local test-runner staleness artifact, not a plan or product issue.

## Next Phase Readiness
- Detail routes exist and are content-complete for Phase 12 Plan 03 (sitemap + nav hardening) to link to
- `edition.images.length > 0 && (...)` guard means a hypothetical édition with zero shoot photos still renders (hero + statement + format only, no empty `GalleryGrid`) — not currently exercised by seeded content (Rebut has a full shoot) but defensive per the same pattern `galleries/[slug].astro` uses for `gallery.images.length > 1`
- Full e2e suite (140/140) and `astro check` (0 errors) unaffected by this plan's changes

---
*Phase: 12-data-fetch-layer-routes*
*Completed: 2026-07-22*
