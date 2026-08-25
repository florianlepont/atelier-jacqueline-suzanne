---
phase: quick-260825-hl7
verified: 2026-08-25T13:20:00Z
status: passed
score: 6/6 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Quick Task 260825-hl7: Fix 3 Live Bugs on Trousseau Gallery — Verification Report

**Task Goal:** Fix 3 independently root-caused live bugs found on the "Trousseau" gallery — BUG-01 (title overflow on the detail-page reveal panel), BUG-02 (accent-color mismatch between homepage carousel and gallery detail page for automatic-palette galleries), BUG-03 (near-black fringe on masonry photo grid tiles).

**Verified:** 2026-08-25
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A single-word title too wide for the desktop reveal panel stays inside the panel and inside the viewport — never paints past the right window edge | ✓ VERIFIED | `src/components/DetailHero.astro:661` `.detail-hero__reveal { max-width: min(512px, 40vw) }`; `.detail-hero__reveal-title` gained `overflow-wrap: break-word` (line 693). Independently re-ran `tests/e2e/detail-hero-title-overflow.spec.ts` (chromium) — 3/3 passed, including the injected 41-char unbreakable-word wrap check (height 100px+ confirms multi-line wrap, not overflow). |
| 2 | The live long-title case (Trousseau) renders on ONE line in the desktop reveal panel | ✓ VERIFIED | SUMMARY records measured `scrollWidth === clientWidth === 512px` and single-line height (`73.4375px` ≈ one line at 72px font/1.02 line-height) post-fix at both 1280x800 and 1600x900. Orchestrator independently screenshotted the live page: title "Trousseau" fully on one line, right edge at 1232px inside the 1280px viewport. |
| 3 | A gallery with no heroColor shows the SAME accent on homepage carousel and detail page, for ANY position in the homepage list, now and for future galleries | ✓ VERIFIED | `resolveAutomaticAccent()` (`src/lib/site-config.ts:99-102`) uses generic modulo cycling (`index % AUTOMATIC_ACCENTS.length`), unit-tested at indices 0-4, 5, 10 (cycle-wraps confirmed beyond array length) and -1/NaN/Infinity (fallback to entry 0) — `tests/unit/site-config.test.ts:112-138`. `buildGalleryDetailModel` unit-tested with `homeIndex: 3` returning `resolveAutomaticAccent(3)` exactly (`tests/unit/page-models.test.ts:129-139`) — proves the threading is index-driven, not hardcoded to Trousseau's actual position. Both locale routes (`src/pages/galleries/[slug].astro`, `src/pages/en/galleries/[slug].astro`) compute `getHomeGalleryIndex(galleries, gallery.slug)` identically and pass it through `GalleryDetailPage.astro` → `buildGalleryDetailModel`. Independently re-ran `tests/e2e/gallery-accent-parity.spec.ts` (chromium) — passed (not skipped, confirming a live automatic-palette gallery still exists to exercise the real parity path), asserting both accent bg and accent text resolve identically on homepage vs. detail page via the probe-span technique. |
| 4 | A gallery with an explicit heroColor still shows that exact color on both pages (unchanged behavior) | ✓ VERIFIED | `buildGalleryDetailModel` unit-tested: explicit `heroColor` ignores `homeIndex` entirely (`tests/unit/page-models.test.ts:153-163`). `src/lib/home-page-model.ts`'s homepage-side `normalizeHeroColor(gallery.heroColor)` path is untouched by this plan (diff confined to extracting `isHomeVisibleGallery`/adding `getHomeGalleryIndex`). |
| 5 | No near-black fringe is paintable along any edge of a masonry photo tile, on gallery AND édition pages | ✓ VERIFIED | `src/components/GalleryGrid.astro:415` — `.gallery-grid--masonry .tile img { object-fit: cover }` (was `contain`). Bento (dead) branch's own `.tile img` rule (line ~262, `object-fit: contain`) confirmed byte-unchanged via `git diff 477ef98..HEAD -- src/components/GalleryGrid.astro` — diff is scoped exactly to the masonry rule and its comment. Independently re-ran `tests/e2e/masonry-tile-fit.spec.ts` (chromium) — 2/2 passed on both a gallery and an édition detail page, asserting `object-fit: cover` and that the aspect-ratio box (`height ≈ width / --ar`, ±1px) is intact. |
| 6 | The automatic accent palette exists in exactly one place; homepage runtime and build-time detail model read the same definition | ✓ VERIFIED | `AUTOMATIC_ACCENTS` + `resolveAutomaticAccent()` defined once in `src/lib/site-config.ts:83-102`. `src/client/home-carousel-runtime.ts` imports it (line 9, confirmed via `grep`) and no longer defines a local `ACCENTS` array — guarded by a positive `readFileSync` source assertion in `tests/unit/home-carousel-runtime.test.ts:81-89` (`imports resolveAutomaticAccent from ../lib/site-config` + `no longer defines a local ACCENTS array`). `src/lib/page-models.ts` imports the same `resolveAutomaticAccent` (line 7). |

**Score:** 6/6 truths verified (0 present-but-behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/site-config.ts` | `AUTOMATIC_ACCENTS` + `resolveAutomaticAccent()` | ✓ VERIFIED | Present, exported, wired into both consumers, unit-tested including generic cycling + fallback edge cases. |
| `src/lib/home-page-model.ts` | exported `isHomeVisibleGallery` + `getHomeGalleryIndex` | ✓ VERIFIED | Present, exported, `buildHomePageModel` refactored to use the extracted predicate; `getHomeGalleryIndex` consumed by both locale routes. |
| `tests/e2e/gallery-accent-parity.spec.ts` | homepage vs. detail accent parity (BUG-02) | ✓ VERIFIED | Present, substantive (probe-span technique, dual bg+text assertion, mutual-failure guard), independently re-run and passed (not skipped). |
| `tests/e2e/detail-hero-title-overflow.spec.ts` | no horizontal overflow of the reveal title (BUG-01) | ✓ VERIFIED | Present, substantive (live-content sweep across all galleries at 2 viewports + durable-wrap injection check), independently re-run and passed. |
| `tests/e2e/masonry-tile-fit.spec.ts` | masonry tiles cannot show tile background (BUG-03) | ✓ VERIFIED | Present, substantive (object-fit + aspect-ratio-box integrity on both content types), independently re-run and passed. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `src/pages/galleries/[slug].astro` + `src/pages/en/galleries/[slug].astro` | `GalleryDetailPage.astro` → `buildGalleryDetailModel(homeIndex)` | `getHomeGalleryIndex(galleries, gallery.slug)` computed in `getStaticPaths`, passed via `props`, destructured, forwarded as a component prop | ✓ WIRED | Confirmed identical wiring in both locale files (read in full); `GalleryDetailPage.astro` declares `homeIndex: number` in `Props` (required, no default) and forwards it to `buildGalleryDetailModel`. |
| `src/client/home-carousel-runtime.ts` | `src/lib/site-config.ts` | `import {resolveAutomaticAccent} from '../lib/site-config'` | ✓ WIRED | Confirmed via `grep` (line 9) and two consumption sites (lines 378, 1158); local `ACCENTS` array confirmed removed. |
| `AUTOMATIC_ACCENTS` bg/text strings | `BaseLayout.astro` `:root` | CSS custom-property reference resolution | ✓ WIRED | Guarded by `readFileSync`-based unit test in `tests/unit/site-config.test.ts` (lines 142, 165) confirming each referenced token exists in `BaseLayout.astro`. |

### Behavioral Spot-Checks (independently re-run by verifier)

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Unit suite for touched modules | `npx vitest run tests/unit/site-config.test.ts tests/unit/page-models.test.ts tests/unit/home-page-model.test.ts tests/unit/home-carousel-runtime.test.ts` | 4 files, 69 tests passed | ✓ PASS |
| e2e-content-fragility guard (no hardcoded slugs in new specs) | `npx vitest run tests/unit/e2e-content-fragility.test.ts` | 3 tests passed | ✓ PASS |
| Production build | `npm run build` | 31 pages built, 0 errors, includes `/galleries/trousseau/index.html` | ✓ PASS |
| 3 new e2e specs (chromium) | `npx playwright test tests/e2e/gallery-accent-parity.spec.ts tests/e2e/detail-hero-title-overflow.spec.ts tests/e2e/masonry-tile-fit.spec.ts --project=chromium` | 6/6 passed, parity spec not skipped | ✓ PASS |

Full lint/typecheck/coverage/full-e2e sweep was independently re-run by the orchestrator post-merge (per task context) — not re-duplicated here to avoid a redundant full-suite run; this verifier's spot-checks target the specific must-haves and pass consistently with that report.

### Out-of-Scope Confirmation

| Check | Result |
|-------|--------|
| Bento (dead) branch of `GalleryGrid.astro` left untouched | ✓ Confirmed — `git diff 477ef98..HEAD -- src/components/GalleryGrid.astro` shows the diff scoped exactly to the masonry rule (lines 391-415); the bento `.tile img` rule and its own comment are byte-identical to before. |
| `EditionsOverviewBody.astro` not touched | ✓ Confirmed — `git diff 477ef98..HEAD -- src/components/EditionsOverviewBody.astro` is empty. |
| No hardcoded gallery/édition slug in new specs | ✓ Confirmed — `tests/unit/e2e-content-fragility.test.ts` passes (3/3); new specs derive all routes via `tests/e2e/helpers/content.ts`. |

### Anti-Patterns Found

None. `grep` for `TBD|FIXME|XXX|TODO|HACK|PLACEHOLDER` across all 9 modified source files returned no matches.

### Requirements Coverage

This is a quick task (no `.planning/REQUIREMENTS.md` file exists for this project scope at this level — quick tasks track requirements via PLAN.md frontmatter only). `requirements: [BUG-01, BUG-02, BUG-03]` declared in PLAN.md frontmatter; all three are satisfied per the Observable Truths table above.

### Human Verification Required

None. All must-haves resolved to VERIFIED via direct codebase inspection, independently re-run unit tests, and independently re-run e2e tests (including a live, non-skipped run of the accent-parity spec against the real automatic-palette gallery).

### Gaps Summary

No gaps found. All 6 must-have truths verified with codebase evidence (not SUMMARY.md claims alone): the shared-palette architecture for BUG-02 is proven general (via modulo-cycling tests beyond array length and an independent `homeIndex: 3` unit assertion, not merely a coincidental match for Trousseau's own position); the reveal-panel fix for BUG-01 is proven both by measurement recorded in SUMMARY and an independently re-run e2e suite exercising every gallery at two viewports plus a durable-wrap safety-net injection; the masonry fix for BUG-03 is proven via a rule-scoped diff (bento branch untouched) and an independently re-run e2e suite on both gallery and édition content types. Both explicitly-scoped exclusions (bento branch, `EditionsOverviewBody.astro`) were confirmed untouched via `git diff`.

---
*Verified: 2026-08-25T13:20:00Z*
*Verifier: Claude (gsd-verifier)*
