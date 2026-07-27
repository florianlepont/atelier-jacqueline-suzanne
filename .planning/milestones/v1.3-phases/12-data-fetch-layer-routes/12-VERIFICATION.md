---
phase: 12-data-fetch-layer-routes
verified: 2026-07-22T21:54:32Z
status: passed
score: 5/5 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Phase 12: Data-Fetch Layer & Routes Verification Report

**Phase Goal:** Visitors can browse and open Éditions pages on the live site — an overview listing and a full per-édition detail page — in both French and English, with zero pricing/availability/purchase affordances.
**Verified:** 2026-07-22T21:54:32Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Visitor can open an Éditions overview page (FR + EN URL) listing each published édition by title, lead photo, and full statement text, as a vertical editorial list (not a grid) | ✓ VERIFIED | `src/pages/editions/index.astro` / `src/pages/en/editions/index.astro` render `.editions-list__row` per published édition via `getEditions()`; `npm run build` emits `dist/editions/index.html` + `dist/en/editions/index.html`; `.editions-list__row` uses CSS grid with a single dominant photo/text pair per row (not a multi-column grid); e2e tests `editions overview > lists each published édition...` and `...renders the English overview...` pass (`npx playwright test tests/e2e/edition.spec.ts` → 6/6 green) |
| 2 | Visitor can click through from the overview to a per-édition detail page showing the full photo shoot in the existing gallery lightbox, a short description/statement, and format details (page count, print run, dimensions) | ✓ VERIFIED | Overview rows are `<a href="/editions/{slug}/">` / `/en/editions/{slug}/`; detail routes (`src/pages/editions/[slug].astro`, `en` twin) render hero + `.edition-detail__statement` + `.edition-detail__format` (pageCount/printRun/dimensions string) + `GalleryGrid` of `edition.images`, and mount the existing `<Lightbox>` component with `[edition.leadPhoto, ...edition.images]`; e2e `editions detail` and `editions lightbox` tests pass, confirming hero opens at counter `1/N` and first grid thumbnail opens at `2/N` (combined-array index math proven, not just present) |
| 3 | No Éditions overview or detail page shows a price, a stock/availability indicator, or a purchase/buy button anywhere on the page | ✓ VERIFIED | e2e `no commerce affordances` blocks (overview + detail) pass; independently re-verified by hand: `grep -oiE "€|\$|prix|price|acheter|buy|panier|cart|stock|disponib|availab|sold out|épuisé" dist/editions/**/*.html` shows only unrelated substrings (`stock` inside French "stockage" in alt text, `$` inside inlined JS/CSS) — no actual commerce token; build-blocking guard `npm run test:artifact` (extended in `tests/scripts/verify-static-artifact.mjs`, word-boundary matching, script/style stripped) passes clean on the current build |
| 4 | Both the overview and detail routes exist and render correctly at the French (root) and English (/en/) URL paths — no locale is missing either route | ✓ VERIFIED | `npm run build` output confirmed to emit all four route/locale combinations: `dist/editions/index.html`, `dist/en/editions/index.html`, `dist/editions/rebut/index.html`, `dist/en/editions/rebut/index.html`; `npx astro check` reports 0 errors |
| 5 | The Éditions overview and detail URLs appear in the site's sitemap.xml | ✓ VERIFIED | `grep -o "<loc>...</loc>" dist/sitemap.xml \| grep editions` returns all 4 URLs: `/editions/`, `/en/editions/`, `/editions/rebut/`, `/en/editions/rebut/`; `sitemap.xml.ts` wires `getEditions()` into `Promise.all` with no `noIndex` key; e2e `SEO metadata > sitemap contains both languages and gallery pages` (extended to assert `/editions/`) passes |

**Score:** 5/5 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/sanity.ts` | `Edition`, `EditionImage`, `getEditions()`, `getEdition(slug)` | ✓ VERIFIED | Types + functions present (lines 130-248); GROQ filter is `publicationStatus == "published"` only (no `isVisible`, no `seo`), matching plan intent; `getEdition` binds `$slug` as a parameter, not string-interpolated |
| `src/pages/editions/index.astro` (FR overview) | Zigzag vertical editorial list | ✓ VERIFIED | Renders `.editions-list__row` per édition, zigzag via `--reverse` class, `EmptyState` fallback for zero éditions |
| `src/pages/en/editions/index.astro` (EN overview) | EN twin | ✓ VERIFIED | Identical structure, `locale = 'en'`, import depth one level deeper |
| `src/pages/editions/[slug].astro` (FR detail) | Hero + statement + format + grid + Lightbox + back-link | ✓ VERIFIED | All elements present and wired (see Key Link Verification) |
| `src/pages/en/editions/[slug].astro` (EN detail) | EN twin | ✓ VERIFIED | Identical structure, `locale = 'en'` |
| `src/pages/sitemap.xml.ts` (extended) | Editions entries, both locales | ✓ VERIFIED | `getEditions()` added to `Promise.all`; `editions/` + per-slug entries added with no `noIndex` |
| `tests/scripts/verify-static-artifact.mjs` (extended) | Build-blocking commerce-string guard over Éditions HTML | ✓ VERIFIED | `npm run test:artifact` passes clean; confirmed word-boundary-aware (no false positive on "stockage"/"carte") |
| `tests/unit/edition-query.test.ts`, `tests/unit/static-routes.test.ts` | Unit coverage | ✓ VERIFIED | `npx vitest run tests/unit/edition-query.test.ts tests/unit/static-routes.test.ts` → 21/21 passing |
| `tests/e2e/edition.spec.ts` | Overview + detail + lightbox + no-commerce blocks | ✓ VERIFIED | `npx playwright test tests/e2e/edition.spec.ts` → 6/6 passing (overview×3, detail×1, lightbox×1, no-commerce-detail×1) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| Overview row `<a href>` | Detail route `[slug].astro` | `href="/editions/{slug}/"` / `/en/editions/{slug}/` | ✓ WIRED | e2e test clicks/discovers the href dynamically and asserts it matches the detail route pattern; confirmed by grep of both overview files |
| Detail hero button (`data-index="0"`) | `Lightbox.astro` | `data-gallery-thumb` + `images={[leadPhoto, ...images]}` | ✓ WIRED | e2e `editions lightbox` test proves counter reads `1/N` on hero click, `2/N` on first grid thumbnail — actual index math verified, not just markup presence |
| `getEditions()` | Overview + detail + sitemap pages | Build-time `.astro` frontmatter import only | ✓ WIRED | `sanityClient`/read token never imported outside frontmatter; confirmed by file inspection — no client `<script>` imports `sanity.ts` |
| `sitemap.xml.ts` | `getEditions()` | `Promise.all([...])` destructure | ✓ WIRED | Verified in source and confirmed via built `dist/sitemap.xml` containing all 4 URLs |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Unit contract tests (GROQ filter/shape/binding, sitemap path expansion) | `npx vitest run tests/unit/edition-query.test.ts tests/unit/static-routes.test.ts` | 21/21 passed | ✓ PASS |
| Full static build succeeds and emits all 4 édition routes | `npm run build` | 25 pages built, incl. `editions/index.html`, `editions/rebut/index.html`, `en/editions/index.html`, `en/editions/rebut/index.html` | ✓ PASS |
| Type check | `npx astro check` | 0 errors, 0 warnings, 7 pre-existing hints | ✓ PASS |
| Édition e2e suite (overview, detail, lightbox index math, no-commerce ×2) | `npx playwright test tests/e2e/edition.spec.ts` | 6/6 passed | ✓ PASS |
| Sitemap e2e assertion | `npx playwright test tests/e2e/seo.spec.ts -g sitemap` | passed, `/editions/` present | ✓ PASS |
| Build-blocking EDN-06 commerce guard | `npm run test:artifact` | passed clean on current build | ✓ PASS |
| Manual re-scan of rendered HTML for commerce tokens | `grep -oiE "€\|\$\|prix\|price\|acheter\|buy\|panier\|cart\|stock\|disponib\|availab\|sold out\|épuisé" dist/editions/**/*.html dist/en/editions/**/*.html` | Only false-positive substrings ("stockage", inline `$` in bundled JS/CSS) — no actual commerce string | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| EDN-02 | 12-01, 12-03 | Overview page listing by title/lead photo | ✓ SATISFIED | Overview routes render title + lead photo + full statement per édition; sitemap includes overview URL |
| EDN-03 | 12-02 | Detail page opens full photo shoot in existing gallery lightbox | ✓ SATISFIED | Reused `Lightbox.astro`; index math e2e-proven (`1/N`, `2/N`) |
| EDN-04 | 12-02 | Detail page shows short description/statement | ✓ SATISFIED | `.edition-detail__statement` renders `edition.statement[locale]`, differs FR/EN (e2e-asserted) |
| EDN-06 | 12-01, 12-02, 12-03 | No pricing/availability/purchase CTA | ✓ SATISFIED | e2e negative assertions (overview + detail) + build-blocking `test:artifact` guard, both passing |
| EDN-07 | 12-01, 12-02, 12-03 | Bilingual FR/EN routing consistent with site i18n | ✓ SATISFIED | All 4 route/locale combinations render and build; sitemap includes both locales |

**Note:** `.planning/REQUIREMENTS.md` still shows these 5 IDs as unchecked (`[ ]`) / "Pending" in its coverage table. This appears to be a bookkeeping lag (REQUIREMENTS.md is not auto-updated by phase execution) rather than a code gap — all 5 are satisfied by evidence above. Recommend updating REQUIREMENTS.md checkboxes as part of phase closure.

### Anti-Patterns Found

No debt-marker comments (TBD/FIXME/XXX), TODO/HACK/PLACEHOLDER comments, empty implementations, or hardcoded-empty stub patterns found in any of the 8 files this phase modified/created (`src/lib/sanity.ts`, the 4 édition route files, `src/pages/sitemap.xml.ts`, `tests/scripts/verify-static-artifact.mjs`, and the 2 test files).

**Non-blocking finding carried forward from code review (12-REVIEW.md CR-01, CR-02):** Both édition detail pages (`src/pages/editions/[slug].astro:57,62-63,111` and the `en` twin) access `edition.dimensions`, `edition.pageCount`, `edition.printRun`, and `edition.images` without null-guarding, and both overview pages (`src/pages/editions/index.astro:56`, `src/pages/en/editions/index.astro:52`) access `edition.statement[locale]` without optional chaining — inconsistent with the identical field's own guard three lines above it in the same file (`edition.statement?.[locale] ?? ''`) and with the codebase's own established WR-03 convention in `src/pages/galleries/[slug].astro`, which explicitly guards this exact field class for the same reason (a document written/migrated outside Studio's publish-time validation could reach the build partially populated). Verified directly: `grep -n "WR-03\|?? \|?\." src/pages/galleries/[slug].astro` confirms the gallery page guards `statement`, `heroAlt`, `seo.title`, `seo.description` — precedent this phase's code does not follow for the equivalent édition fields.

This does **not** cause any of the 5 phase success criteria to fail today — the current build succeeds and all e2e/unit tests pass against the seeded "Rebut" édition (verified above). The risk is forward-looking: because `getStaticPaths` renders every published édition in one `astro build` pass, a future malformed/partially-populated édition document (created via Content Lake API, bulk import, or a doc published before validation existed) would throw during SSG and fail the **entire** site build — blocking deploy of every page, not just Éditions. Given the project's near-zero-cost, non-technical-maintainer context (Romane self-serves content edits) and that the fix is a few `?? ` fallbacks, this is flagged as a **WARNING** for the developer to decide whether to fix now or accept the risk (e.g., defer to Phase 14's verification/UAT pass, which is scoped to omission-class gaps but could reasonably absorb this resilience fix too). Not treated as a BLOCKER because it does not fail any stated must-have against current codebase + content state.

### Human Verification Required

None. All 5 success criteria are verifiable programmatically and were verified with actual command execution (build, unit tests, e2e tests, grep of build output) rather than SUMMARY.md claims alone.

### Gaps Summary

No gaps against the phase's 5 success criteria — all verified with direct evidence (build output, passing test runs, grep of rendered HTML/sitemap). One non-blocking code-quality finding (null-safety guards missing on `dimensions`/`pageCount`/`printRun`/`images`/overview `statement`, per code review CR-01/CR-02) is carried forward as a WARNING for developer decision — it is a real regression against the codebase's own defensive-coding precedent (WR-03) with a severe blast radius (whole-build failure) if ever triggered, but it does not fail any of this phase's stated truths against the current codebase and seeded content.

---

_Verified: 2026-07-22T21:54:32Z_
_Verifier: Claude (gsd-verifier)_
