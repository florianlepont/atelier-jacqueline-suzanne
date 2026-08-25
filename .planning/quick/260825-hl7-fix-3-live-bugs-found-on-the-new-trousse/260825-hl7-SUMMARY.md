---
id: 260825-hl7
status: complete
subsystem: portfolio-detail
tags: [astro, css, playwright, vitest, gallery-detail, homepage-carousel, masonry]
requirements: [BUG-01, BUG-02, BUG-03]
key-files:
  created:
    - tests/e2e/gallery-accent-parity.spec.ts
    - tests/e2e/detail-hero-title-overflow.spec.ts
    - tests/e2e/masonry-tile-fit.spec.ts
  modified:
    - src/lib/site-config.ts
    - src/lib/home-page-model.ts
    - src/lib/page-models.ts
    - src/client/home-carousel-runtime.ts
    - src/components/GalleryDetailPage.astro
    - src/pages/galleries/[slug].astro
    - src/pages/en/galleries/[slug].astro
    - src/components/DetailHero.astro
    - src/components/GalleryGrid.astro
    - tests/unit/site-config.test.ts
    - tests/unit/page-models.test.ts
    - tests/unit/home-page-model.test.ts
    - tests/unit/home-carousel-runtime.test.ts
    - tests/e2e/gallery.spec.ts
    - tests/e2e/edition.spec.ts
completed: 2026-08-25
duration: ~35min
---

# Quick Task 260825-hl7 Summary

Fixed three independently root-caused live bugs found on the "Trousseau" gallery: a single automatic-accent-color palette now shared between the homepage carousel and the gallery detail page (was two never-synchronized fallbacks), a widened + wrap-safety-netted desktop reveal-title panel that no longer lets a long single-word title paint past the window edge, and a masonry tile `object-fit: cover` fix that makes the tile's ink background structurally unreachable instead of merely usually-invisible.

## Performance

- **Duration:** ~35 min
- **Tasks:** 3/3 completed
- **Files modified:** 15 (9 source, 3 new e2e specs, 3 unit test files touched directly by the plan, plus 2 existing e2e specs updated as a necessary consequence of Task 3 — see Deviations)

## Accomplishments

- **BUG-02 (architecture):** `AUTOMATIC_ACCENTS` + `resolveAutomaticAccent()` now live once in `src/lib/site-config.ts`. The homepage carousel (`home-carousel-runtime.ts`) imports it instead of a local `ACCENTS` array; `buildGalleryDetailModel` now requires a `homeIndex` parameter and resolves the same palette entry the homepage would show for that gallery's position, instead of a hardcoded lime hex. Both `galleries/[slug].astro` locale routes compute `homeIndex` via the new `getHomeGalleryIndex()` (built on an extracted `isHomeVisibleGallery()` predicate) and thread it through `GalleryDetailPage.astro`.
- **BUG-01 (CSS):** `.detail-hero__reveal`'s `max-width` widened from a flat `420px` to `min(512px, 40vw)`, measured against the real live title ("Trousseau", 505px at this font-size) with margin to spare before the settled photo's right edge. `.detail-hero__reveal-title` gained `overflow-wrap: break-word` as a durable safety net for any future title too wide even for the widened panel.
- **BUG-03 (CSS):** `.gallery-grid--masonry .tile img`'s `object-fit` changed from `contain` to `cover`. The rounding-gap explanation in the rule's own comment was rewritten to describe the real mechanism (two independent sub-pixel rounding sources — Sanity's `.fit('max')` integer rounding and the browser's own `aspect-ratio` box rounding) instead of the "can never crop" claim that had been the reasoning masking this bug.
- Full regression sweep (lint, typecheck, unit+coverage, build, e2e across both Playwright projects) green with zero visual-snapshot churn.

## Task Commits

Each task was committed atomically:

1. **Task 1 (BUG-02) — RED:** `7430f5c` (test) — failing coverage for `resolveAutomaticAccent`, `getHomeGalleryIndex`/`isHomeVisibleGallery`, and the required `homeIndex` param, confirmed failing against pre-fix code.
2. **Task 1 (BUG-02) — GREEN:** `c36ddd6` (feat) — shared palette implementation + `homeIndex` threading + `tests/e2e/gallery-accent-parity.spec.ts`.
3. **Task 2 (BUG-01):** `b491e43` (fix) — widened reveal panel + wrap safety net + `tests/e2e/detail-hero-title-overflow.spec.ts`.
4. **Task 3 (BUG-03):** `2d8de5c` (fix) — masonry `object-fit: cover` + rewritten comment + `tests/e2e/masonry-tile-fit.spec.ts` + necessary updates to two pre-existing e2e specs whose assertions encoded the old `contain` behavior.

## Files Created/Modified

- `src/lib/site-config.ts` — new `AUTOMATIC_ACCENTS` + `resolveAutomaticAccent()`, the single shared automatic-palette definition.
- `src/client/home-carousel-runtime.ts` — imports `resolveAutomaticAccent` instead of a local `ACCENTS` array; both consumption sites updated.
- `src/lib/home-page-model.ts` — extracted `isHomeVisibleGallery()`; new `getHomeGalleryIndex()`.
- `src/lib/page-models.ts` — `buildGalleryDetailModel` requires `homeIndex`; automatic-accent fallback resolves from the shared palette; `accentText` widened from a two-hex union to `string`.
- `src/components/GalleryDetailPage.astro` — accepts and forwards `homeIndex`.
- `src/pages/galleries/[slug].astro`, `src/pages/en/galleries/[slug].astro` — compute `homeIndex` via `getHomeGalleryIndex` in `getStaticPaths`.
- `src/components/DetailHero.astro` — `.detail-hero__reveal` max-width widened; `.detail-hero__reveal-title` gained `overflow-wrap: break-word`.
- `src/components/GalleryGrid.astro` — masonry tile img `object-fit: contain` → `cover`; comment rewritten.
- `tests/unit/site-config.test.ts`, `tests/unit/page-models.test.ts`, `tests/unit/home-page-model.test.ts`, `tests/unit/home-carousel-runtime.test.ts` — new/updated unit coverage for the above.
- `tests/e2e/gallery-accent-parity.spec.ts` (new) — homepage ↔ detail page accent parity for the live automatic-palette gallery.
- `tests/e2e/detail-hero-title-overflow.spec.ts` (new) — no-overflow assertion for every gallery's title at 1280x800/1600x900, plus a durable-wrap check.
- `tests/e2e/masonry-tile-fit.spec.ts` (new) — `object-fit: cover` + intact aspect-ratio box, on one gallery and one édition.
- `tests/e2e/gallery.spec.ts`, `tests/e2e/edition.spec.ts` — updated pre-existing masonry assertions/titles/comments from `contain`/"uncropped" to `cover`/"flush, no exposed background" (necessary consequence of the BUG-03 fix — see Deviations).

## Decisions Made

**D-1 — Shared function, not duplicated-array-with-drift-test.** `src/lib/site-config.ts` gets the single palette definition; `home-carousel-runtime.ts` imports it. The rejected alternative (keep two arrays + a byte-identity unit test) was strictly worse here because the safe-to-import precondition was already confirmed, not speculative: `site-config.ts`'s only import is an erased `import type`, and the runtime already imports `../lib/home-carousel`. Verified during implementation: `home-carousel-runtime.test.ts` now asserts (via `readFileSync` on the source) that the local `ACCENTS` array is gone and the import from `../lib/site-config` exists — proving the single-source-of-truth link, not just asserting it in a comment.

**D-2 — The shared palette keeps CSS custom-property REFERENCE strings, not resolved hexes.** `--color-accent` is `--pink-600` (`#D6327C`), which is NOT `HERO_COLORS.pink` (`#FF3B94`) — hex-ifying the palette would have silently changed the homepage's shipped rendering, and the homepage was the correct side of this bug. Passing the same `var(...)` string through `page-models.ts` into `.detail-hero`'s inline custom property makes both pages resolve against the same `:root` tokens in `BaseLayout.astro`, byte-identically. Consequence honored in the implementation: the automatic path in `buildGalleryDetailModel` does NOT route through `getHeroTextColor()` (which cannot parse a `var()` string) — each `AUTOMATIC_ACCENTS` entry carries its own correct paired text color directly. `getHeroTextColor()` remains in use only for the explicit-`heroColor` path. The rejected alternative (resolve to hex at the shared-module boundary) was rejected precisely because it would have broken this byte-identity guarantee.

**D-3 — `homeIndex` is a REQUIRED parameter of `buildGalleryDetailModel`, not optional-with-default.** A default would let a missing locale-route wiring silently degrade to palette entry 0 with no signal; required makes `npm run typecheck` fail loudly if either `[slug].astro` twin is not updated. Both twins were updated identically (apart from import depth) in this plan, so `npm run typecheck` passed with 0 errors on the first clean run after the GREEN commit — the required-param design worked as intended without ever actually needing to catch a missed wiring, but it now stands as a permanent guard against a future regression.

**BUG-01 — measured title/panel widths (Task 2).** Measured live against the real "Trousseau" title at both required viewports before choosing values:

| Viewport | Old `.detail-hero__reveal-title` scrollWidth | Old panel `max-width` | Overflow amount | Photo's settled right edge |
|---|---|---|---|---|
| 1280×800 | 505px | 420px | title painted ~85px past the panel, ending ~37px past the window's right edge | 704px (photo occupies `right: 45%` of 1280) |
| 1600×900 | 505px | 420px | same 85px overflow (font clamps to 72px at both widths — `clamp(40px, 6vw, 72px)` hits its cap at both 1280 and 1600) | 880px |

Available room before the widened panel would reach the photo's right edge (at the fixed `right: var(--space-2xl)` = 48px offset): `viewportWidth − 48 − photoRightEdge` = 528px at 1280×800 (the binding, narrower case) and 672px at 1600×900. Chose **`max-width: min(512px, 40vw)`** — inside the 528px ceiling with a 16px margin against the photo, and comfortably above the measured 505px title width. Post-fix measurement confirmed: `scrollWidth === clientWidth === 512` at both viewports (no horizontal overflow), single-line height (`73.4375px`, matching `72px font-size × 1.02 line-height`, i.e. one line, the word did not break), and `revealRect.left (720) > photoRect.right (704)` at 1280×800 (no overlap). The wrap safety net (`overflow-wrap: break-word`) was separately verified with an injected 41-character unbroken string, which wrapped to ~5 lines (`height: 367.1875px`) with no horizontal overflow, and confirmed inert on mobile (`max-width: none` still applies, unaffected) and correct under `prefers-reduced-motion: reduce` at desktop widths (settled `opacity: 1`, no overflow).

**No visual snapshot baseline changed.** `tests/e2e/visual.spec.ts-snapshots/` contains only `contact-form.png` and `shared-site-header.png` — neither touches the homepage carousel, gallery/édition detail hero, or the masonry grid, so none of this plan's three fixes could shift a photo-grid visual baseline. Confirmed: `npm run test:e2e` (chromium + webkit-mobile, 361 tests) passed in full, including both `visual.spec.ts` assertions, with no snapshot diff/re-baseline prompted.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated two pre-existing e2e specs whose assertions encoded the old, now-intentionally-changed masonry `object-fit: contain` behavior**
- **Found during:** Task 3's regression sweep
- **Issue:** `tests/e2e/gallery.spec.ts` and `tests/e2e/edition.spec.ts` contained several assertions (`expect(objectFit).toBe('contain')`, `expect(m.objectFit).not.toBe('cover')`) and describe/test titles/comments describing masonry tiles as "uncropped" — all written against the pre-fix behavior this task's Task 3 action deliberately reverses. Left unchanged, these would have failed the regression sweep's `npm run test:e2e` gate, not because of a real regression but because the tests asserted the bug's own symptom as correct behavior.
- **Fix:** Updated the assertions to `toBe('cover')`, and reworded the affected titles/comments (`gallery.spec.ts` lines ~197-249, ~460, ~981-1113; `edition.spec.ts` lines ~263-368) to describe the real mechanism (a sub-pixel rounding gap absorbed as an imperceptible crop under `cover`, versus exposed as tile-background padding under `contain`) rather than the "never crop" framing that was itself the reasoning that had hidden BUG-03.
- **Files modified:** `tests/e2e/gallery.spec.ts`, `tests/e2e/edition.spec.ts`
- **Verification:** `E2E_PORT=4322 npx playwright test tests/e2e/gallery.spec.ts tests/e2e/edition.spec.ts tests/e2e/masonry-tile-fit.spec.ts --project=chromium` → 67/67 passed; full `npm run test:e2e` → 361/361 passed.
- **Committed in:** `2d8de5c` (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — necessary test-expectation update, not a scope change to production behavior)
**Impact on plan:** No scope creep — both updated files test exactly the `GalleryGrid.astro` rule this plan's Task 3 was scoped to change; their assertions had to move in lockstep with the intentional behavior change or the regression sweep itself would have been meaningless.

## Issues Encountered

- **Environment bootstrap (not a plan deviation, procedural only):** this worktree started without `.env` or `sanity/node_modules`. Copied `.env` from the main checkout (`/Users/florian/Projects/ajs-website/.env`, not inspected) and ran `npm ci` (root) + `npm ci --prefix sanity` against the existing lockfiles, exactly as prior quick tasks in this session did.
- **Port 4321 conflict:** occupied by a concurrent session's `astro dev`. Used `E2E_PORT=4322` for all Playwright invocations (already supported by `playwright.config.ts` per an earlier quick task).
- Both resolved with no code changes and no impact on the fixes themselves.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All three live bugs (BUG-01, BUG-02, BUG-03) are fixed, tested, and regression-swept clean (lint, typecheck, unit+coverage — 691/691 unit tests — build, e2e — 361/361 across chromium + webkit-mobile).
- No known stubs or deferred items.
- No threat-surface changes beyond what's already covered in the plan's own threat model (T-hl7-01/02/SC) — no new dependency, no new endpoint, no new editor-input path.

## Self-Check: PASSED

All 11 files referenced in Files Created/Modified confirmed present on disk (`test -f`). All 4 commit hashes (`7430f5c`, `c36ddd6`, `b491e43`, `2d8de5c`) confirmed present in `git log --oneline --all`.

---
*Quick task: 260825-hl7*
*Completed: 2026-08-25*
