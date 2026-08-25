---
phase: quick-260825-et3-audit-and-fix-e2e-unit-tests-that-hardco
plan: 01
subsystem: testing
tags: [playwright, vitest, e2e, sanity, content-fragility]

requires: []
provides:
  - "tests/e2e/helpers/content.ts: shared gallery/édition detail-href derivation helper for e2e specs"
  - "E2E_PORT/E2E_BASE_URL overrides in playwright.config.ts for local verification against a non-default port"
  - "tests/unit/e2e-content-fragility.test.ts: CI-gated regression guard against reintroducing a hardcoded content route"
affects: [e2e testing conventions, future gallery/édition-touching phases]

tech-stack:
  added: []
  patterns:
    - "e2e specs derive gallery/édition detail routes via page.request.get() + tests/e2e/helpers/content.ts instead of embedding a slug literal"
    - "'second row/tile' assertions resolve by count (last item, with a test.skip(< 2) guard) instead of a fixed nth() index"
    - "a Vitest text-scan guard (imports no product module) blocks reintroduction of a hardcoded content route inside the CI-gated unit suite"

key-files:
  created:
    - tests/e2e/helpers/content.ts
    - tests/unit/e2e-content-fragility.test.ts
  modified:
    - playwright.config.ts
    - tests/e2e/seo.spec.ts
    - tests/e2e/critical.smoke.spec.ts
    - tests/e2e/site-header.spec.ts
    - tests/e2e/page-title-header-bleed.spec.ts
    - tests/e2e/accessibility.spec.ts
    - tests/e2e/edition.spec.ts
    - tests/e2e/homepage-carousel-core.spec.ts
    - tests/e2e/homepage-content-display.spec.ts
    - tests/e2e/homepage-loading-progress.spec.ts

key-decisions:
  - "Content-derivation helper fetches the listing page's raw HTML via page.request.get() (not page.goto()+locators) so a call has no side effect on the caller's page state, works identically under both Playwright projects, and needs no grid-mode toggle first."
  - "EDN-09 header-color-sync tests (edition.spec.ts) discover the first row whose hover genuinely produces a different color at runtime, instead of a fixed 'last row' index — more than one entry in the row-hover accent palette can coincide with the header's own default ink color (confirmed live for indices 0, 2, and 3 of the current 5-entry palette), so neither a fixed index nor a 'last row' heuristic is safe there."
  - "Regression guard test lives in tests/unit/ (not tests/e2e/) since it does a static text scan with no browser dependency, and this makes it run inside npm run test:unit/test:coverage, which CI already gates on before deploy."

requirements-completed: [QUICK-260825-ET3]

coverage:
  - id: D1
    description: "Shared content-derivation helper (tests/e2e/helpers/content.ts) replaces every hardcoded gallery/édition detail-route literal in the e2e suite"
    requirement: "QUICK-260825-ET3"
    verification:
      - kind: e2e
        ref: "npx playwright test tests/e2e/seo.spec.ts tests/e2e/critical.smoke.spec.ts tests/e2e/site-header.spec.ts tests/e2e/page-title-header-bleed.spec.ts tests/e2e/accessibility.spec.ts tests/e2e/edition.spec.ts (116/116 passed, chromium + webkit-mobile)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Hardcoded gallery titles, fixed-index 'second item' assumptions, and optional-field (statement) assumptions removed from homepage/édition specs"
    requirement: "QUICK-260825-ET3"
    verification:
      - kind: e2e
        ref: "npx playwright test tests/e2e/homepage-carousel-core.spec.ts tests/e2e/homepage-content-display.spec.ts tests/e2e/homepage-loading-progress.spec.ts tests/e2e/edition.spec.ts (79/79 passed)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Vitest regression guard blocks reintroduction of a hardcoded gallery/édition detail slug in any e2e spec"
    requirement: "QUICK-260825-ET3"
    verification:
      - kind: unit
        ref: "tests/unit/e2e-content-fragility.test.ts (3/3 passed; manually confirmed it fails when a hardcoded route is reintroduced, then reverted)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Full CI-order verification sweep (lint, typecheck, build, full e2e suite, unit/coverage suite) confirms no regressions"
    requirement: "QUICK-260825-ET3"
    verification:
      - kind: other
        ref: "npm run lint && npm run typecheck && npm run build && npm run test:e2e (352/352 passed) && npm run test:coverage (675/675 tests passed across 31/31 files on the primary checkout post-merge — the 1 suite that failed to load inside the executor's isolated worktree was a worktree node_modules artifact, not a real gap; see deferred-items.md)"
        status: pass
    human_judgment: false

duration: ~50min
completed: 2026-08-25
status: complete
---

# Quick Task 260825-et3: Audit and Fix E2E/Unit Tests That Hardcode Content Summary

**Shared `page.request.get()`-based content-derivation helper (`tests/e2e/helpers/content.ts`) replaces every hardcoded gallery/édition detail slug across 8 e2e spec files, plus a new Vitest text-scan guard (`tests/unit/e2e-content-fragility.test.ts`) that fails CI if one is reintroduced.**

## Performance

- **Duration:** ~50 min
- **Completed:** 2026-08-25
- **Tasks:** 3
- **Files modified:** 12 (2 created, 10 modified)

## Accomplishments

- Added `tests/e2e/helpers/content.ts` — `galleryHrefs`/`firstGalleryHref`/`editionHrefs`/`firstEditionHref`, derived from the listing page's own rendered HTML via `page.request.get()`, filtered by locale, deduped, trailing-slug-anchored.
- Retargeted every hardcoded `/galleries/silos/` and `/editions/rebut/` (or their `/en/` twins) literal across `seo.spec.ts`, `critical.smoke.spec.ts`, `site-header.spec.ts`, `page-title-header-bleed.spec.ts`, `accessibility.spec.ts`, and `edition.spec.ts` onto the new helper.
- Removed a hardcoded gallery-name match (`homepage-carousel-core.spec.ts`), a hardcoded title equality check (`homepage-content-display.spec.ts`), two fixed-index "second item" assumptions without a count guard (`homepage-loading-progress.spec.ts`, `edition.spec.ts`), and two optional-field (`statement`) assumptions on the first grid tile (`homepage-content-display.spec.ts`).
- Added `playwright.config.ts` `E2E_PORT`/`E2E_BASE_URL` overrides so local verification can target a free port when 4321 is held by a concurrent session's `astro dev` — used throughout this run's own verification (port 4321 was in fact held by another session).
- Added `tests/unit/e2e-content-fragility.test.ts`, a CI-gated static scan of every `tests/e2e/**/*.spec.ts` file that fails on a reintroduced hardcoded `galleries/`/`editions/` slug, tolerates patterns/interpolations/attribute-selector fragments, strips comment lines first, and supports a narrow inline allowlist marker.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add the content-derivation helper and retarget every hardcoded gallery/édition detail route** - `0933939` (test)
2. **Task 2: Remove hardcoded titles, index assumptions, and optional-field assumptions** - `874b144` (test)
3. **Task 3: Add a regression guard and verify the full suite** - `b10c6b1` (test)

_No plan-metadata commit yet — SUMMARY.md/STATE.md docs commit is handled by the orchestrator per this run's constraints._

## Files Created/Modified

- `tests/e2e/helpers/content.ts` - shared gallery/édition detail-href derivation helper (new)
- `tests/unit/e2e-content-fragility.test.ts` - CI-gated regression guard (new)
- `playwright.config.ts` - `E2E_PORT`/`E2E_BASE_URL` env overrides for `use.baseURL`/`webServer.url`/preview command port
- `tests/e2e/seo.spec.ts` - gallery/édition canonical + hreflang tests now derive the slug instead of hardcoding `silos`/`rebut`
- `tests/e2e/critical.smoke.spec.ts` - native-dialog test derives its gallery href
- `tests/e2e/site-header.spec.ts` - two static `for` loops split into a shared assertion function plus one derived-slug test; one standalone test derives its gallery href
- `tests/e2e/page-title-header-bleed.spec.ts` - two hardcoded-gallery tests derive their href via the shared helper
- `tests/e2e/accessibility.spec.ts` - hardcoded gallery route dropped from the static path array; a derived-slug gallery a11y test added (mirroring the existing derived-slug édition test)
- `tests/e2e/edition.spec.ts` - hardcoded view-transition-scoping gallery route derived; three `.editions-index__row.nth(1)` sites resolved by count/last-row with a `< 2` skip guard; EDN-09 header-color-sync tests discover a genuinely-differing row at runtime instead of assuming a fixed index
- `tests/e2e/homepage-carousel-core.spec.ts` - grid-mode-renders-tiles assertion now checks every rendered tile title is visible/non-empty instead of matching two gallery names
- `tests/e2e/homepage-content-display.spec.ts` - longest-title clamp test computes the longest title at runtime; two `statement`-hover/clear tests select the first tile that genuinely has a statement, with a skip guard when none do
- `tests/e2e/homepage-loading-progress.spec.ts` - manual-navigation dash test targets the last dash by count with a `< 2` skip guard instead of a fixed `nth(2)`

## Decisions Made

- Content-derivation helper uses `page.request.get()` against the listing page's raw HTML rather than `page.goto()` + locators, per the plan's own three explicit reasons (no page-state side effect, works under both Playwright projects since the grid markup is always server-rendered with a `hidden` attribute rather than conditionally omitted, no grid-mode toggle needed first).
- For the EDN-09 header-color-sync tests, deviated from the plan's literal "resolve as the last row" instruction after live verification showed it breaks correctness: the row-hover accent palette (`EditionsOverviewBody.astro`'s `ACCENTS`) has 5 entries, and indices 0, 2, and 3 all resolve to the exact same ink color the header already shows pre-hover — with the site's current 3 published éditions, "last row" (index 2) landed on exactly that coincidence and the two tests failed with a real assertion error (`expect(rowColor).not.toBe(preHoverEyebrowColor)`, `rowColor` measured `rgb(26, 26, 26)` same as baseline). Replaced with a `findRowWithDifferingAccent()` helper that discovers, at runtime, the first row whose hover genuinely produces a different color — this is robust to any future Sanity Studio publish AND to the palette's own exact color values ever changing, matching the plan's own threat-model principle (T-ET3-02: "skip guards apply only when content genuinely cannot exercise the case").
- Regression guard test placed under `tests/unit/` (matching the plan's explicit path) rather than `tests/e2e/`, since it performs a static text scan with zero browser/build dependency, letting it run inside the `npm run test:unit`/`test:coverage` gates CI already blocks on — reintroducing the bug pattern is now caught at PR time, before any Playwright run.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] EDN-09 header-color-sync tests: "last row" heuristic produces a false failure**
- **Found during:** Task 2/3 verification (`npx playwright test tests/e2e/edition.spec.ts`)
- **Issue:** Following the plan's literal "resolve as the last row" instruction for the two EDN-09 tests (`hovering a row recolors...`, `moving off the row (mouseleave) restores...`) picked index `rowCount - 1` (2, with 3 published éditions), which resolves to the palette entry whose text color equals the header's own pre-hover default — the "differs from pre-hover" assertions then legitimately failed (`expect(rowColor).not.toBe(preHoverEyebrowColor)` measured equal).
- **Fix:** Replaced the fixed "last row" pick with `findRowWithDifferingAccent()`, a small runtime discovery loop that hovers each row in turn (waiting for the 0.35s CSS transition to settle) until it finds one whose resulting eyebrow color genuinely differs from the pre-hover baseline, then `test.skip`s only if no row does. Confirmed both tests pass against the live tree afterward.
- **Files modified:** `tests/e2e/edition.spec.ts`
- **Verification:** `npx playwright test tests/e2e/edition.spec.ts -g "EDN-09"` — 2/2 passed; full `edition.spec.ts` re-run — 47/47 passed.
- **Committed in:** `874b144` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Necessary for correctness — the plan's literal "last row" phrasing for this one test pair didn't account for the row-hover accent palette's actual color values. Every other Class C fix in the plan (edition.spec.ts's other two `nth(1)` sites, homepage-loading-progress.spec.ts's dash navigation) used the literal "last item by count" resolution as written, since those don't depend on a small cyclical color palette. No scope creep — the fix stays inside the same test file and task the plan already scoped.

## Issues Encountered

- **Port 4321 was held by an unrelated concurrent session's `astro dev` process** during verification. Per the plan's own instruction, left it running and verified with `E2E_PORT=4331` instead (enabled by this plan's own `playwright.config.ts` change) — no process was killed.
- **`SANITY_PROJECT_ID`/`SANITY_DATASET` env vars were required for `npm run build`** and this worktree had no `.env` file (gitignored, not copied into the worktree). Sourced the values from the already-committed, non-secret `sanity/sanity.config.ts`/`sanity/sanity.cli.ts` (`projectId: 'gwz8iug4'`, `dataset: 'production'`) rather than reading or copying the main checkout's `.env` (which the harness's permission settings denied access to for this worktree).
- **`npm run test:coverage` failed on one suite inside the isolated worktree** (`tests/unit/dashboard-logic.test.ts`, `Cannot find package '@sanity/icons'`) — traced post-merge to the worktree never having `sanity/node_modules` populated (git worktrees share only committed history, not `node_modules`; `@sanity/icons` resolves via Node's directory walk-up into `sanity/node_modules/@sanity/icons`, which `npm ci --prefix sanity` — CI's real install step — always populates). Re-run on the primary checkout after the worktree merged back: 675/675 tests pass across 31/31 files, `dashboard-logic.test.ts` included. Not a real gap; no root `package.json` change needed. See `deferred-items.md` for the full trace.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Every routine Sanity Studio publish (add/remove/rename/reorder a gallery or édition, or leave `heroColor`/`statement`/`relatedGallery` unset) now leaves the full e2e and unit suite green, per this task's stated success criteria.
- The new `tests/unit/e2e-content-fragility.test.ts` guard blocks reintroduction of a hardcoded content route in any future PR touching `tests/e2e/`.
- No follow-up needed: the `@sanity/icons` load failure seen mid-task was confirmed to be an artifact of the isolated worktree's incomplete `node_modules`, not a real CI gap — see `deferred-items.md`.

---
*Phase: quick-260825-et3-audit-and-fix-e2e-unit-tests-that-hardco*
*Completed: 2026-08-25*

## Self-Check: PASSED

All created/modified files verified present on disk; all three task commits (`0933939`, `874b144`, `b10c6b1`) verified present in `git log`.
