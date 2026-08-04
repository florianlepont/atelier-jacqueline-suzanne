# Deferred Items — Phase 20 (mobile-navigation-accent-color)

## Pre-existing flaky test: `edition.spec.ts` "galleries unaffected" (out of scope for plan 20-04)

- **File:** `tests/e2e/edition.spec.ts`
- **Test:** `editions masonry grid photos uncropped and flush (quick-260803-jby) › galleries unaffected: the gallery masonry path renders identically now that éditions share it`
- **Symptom:** `expect(Math.abs(ratios.clientRatio - ratios.naturalRatio) / ratios.naturalRatio).toBeLessThan(0.01)` fails with `Received: NaN`, reproduced deterministically across 3 consecutive runs in this worktree.
- **Root cause (read, not fixed):** the test reads `firstTileImg.evaluate(el => ({ naturalWidth: el.naturalWidth, naturalHeight: el.naturalHeight }))` immediately after only asserting `toBeVisible()` — it never waits for `image.complete && naturalWidth > 0` the way its sibling helper `assertGridIsFlushMasonry()` (used by the two tests immediately above it in the same file) explicitly does. If the underlying Sanity CDN image hasn't finished downloading by the time `evaluate()` runs, `naturalWidth`/`naturalHeight` are both `0`, producing a `0/0` `NaN` ratio.
- **Why out of scope for plan 20-04:** this plan's files_modified are `src/components/MobileNavPanel.astro`, `src/components/SiteHeader.astro`, `tests/e2e/mobile-nav.spec.ts`, `tests/e2e/critical.smoke.spec.ts`. Neither this plan's CSS (`.mobile-nav*`/`.mobile-nav__bar` selectors only) nor its client script touch `.gallery-grid`, `.tile`, or any masonry/image-loading code. Plan 20-03's own SUMMARY recorded this exact suite passing 345/345 immediately before this plan started, and this test predates plan 20-04 by a different task lineage (`quick-260803-jby`, 2026-08-03).
- **Verification it's pre-existing, not a regression from this plan's changes:** re-ran the single test 3 times consecutively (no retries between, then with `--retries=2`) — deterministic `NaN` failure every time, in a file this plan never edits.
- **Recommended fix (not applied here):** add a `waitForFunction` (mirroring `assertGridIsFlushMasonry()`'s existing image-load guard) before reading `naturalWidth`/`naturalHeight` in this one test.
- **Owner/next step:** flag for the phase verifier / a future quick-task; do not silently re-run builds hoping it self-resolves.
