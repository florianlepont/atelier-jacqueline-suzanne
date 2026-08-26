---
phase: 24-cross-linking-contact-cta
plan: 04
subsystem: ui
tags: [astro, playwright, i18n, contact-cta, cross-linking]

# Dependency graph
requires:
  - phase: 24-02
    provides: "GalleryDetailModel/EditionDetailModel.contactCtaHref/contactCtaLabel (base-path-safe, one shared fr/en string)"
provides:
  - "src/components/EditionDetailBody.astro: .edition-detail__contact-cta-zone/-rule/-arrow markup+CSS, contactCtaHref/contactCtaLabel Props"
  - "src/components/EditionDetailPage.astro: contactCtaHref/contactCtaLabel prop threading from the render model"
  - "tests/e2e/edition.spec.ts: 'editions contact CTA (CONT-04)' describe block — universality, structure/copy/style contract, D-07 DOM order, D-09 two-weight style-bleed guard"
affects: [24-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Sketch-pinned literal CSS values (20px/600/1.25) copied verbatim rather than swapped for numerically-coincidental design tokens, per UI-SPEC.md's explicit instruction not to silently substitute var(--text-heading-size) etc."
    - "e2e content-discovery idiom: navigate to the overview page, read real hrefs off .editions-index__row via evaluateAll, never a literal slug — enforced by tests/unit/e2e-content-fragility.test.ts"

key-files:
  created: []
  modified:
    - src/components/EditionDetailBody.astro
    - src/components/EditionDetailPage.astro
    - tests/e2e/edition.spec.ts

key-decisions:
  - "CTA rendered as the literal last child of .edition-detail__content, added purely by appending new markup/CSS after the existing .edition-detail__related rule block — zero lines of the shipped EDN-08 block touched (verified via git diff -U0, zero deletions)"

requirements-completed: [CONT-04, UI-03]

coverage:
  - id: D1
    description: "Every published édition detail page renders the CONT-04 contact CTA as the last element of the photo sequence, unconditionally (no truthiness/sold-state guard)"
    requirement: "CONT-04"
    verification:
      - kind: e2e
        ref: "tests/e2e/edition.spec.ts#editions contact CTA (CONT-04) > renders on every édition at phone width"
        status: pass
      - kind: e2e
        ref: "tests/e2e/edition.spec.ts#editions contact CTA (CONT-04) > CTA structure, copy, and computed styling match the gallery-page contract, at both viewports and both locales (D-07 compareDocumentPosition assertion)"
        status: pass
    human_judgment: false
  - id: D2
    description: "CTA structure, copy, and computed styling (20px Unbounded 600, pink hairline + arrow, no filled background) match the gallery-page CTA contract, at 390px and 1280px, in fr and en"
    requirement: "CONT-04"
    verification:
      - kind: e2e
        ref: "tests/e2e/edition.spec.ts#editions contact CTA (CONT-04) > CTA structure, copy, and computed styling match the gallery-page contract, at both viewports and both locales"
        status: pass
    human_judgment: false
  - id: D3
    description: "The shipped EDN-08 related-gallery link at the top of an édition page keeps its exact 14px/2px-border computed treatment, with no display-font (Unbounded) style bleed from the new CTA rules, when both links are present on the same page"
    requirement: "UI-03"
    verification:
      - kind: e2e
        ref: "tests/e2e/edition.spec.ts#editions contact CTA (CONT-04) > D-09: the shipped related-gallery link keeps its 14px bordered treatment, with no Unbounded style bleed, next to the new CTA"
        status: pass
      - kind: other
        ref: "git diff -U0 src/components/EditionDetailBody.astro — zero deleted/modified lines across the .edition-detail__related rule range and the pre-existing @media (max-width: 767px) block"
        status: pass
    human_judgment: false
  - id: D4
    description: "The existing édition layout, and both GalleryGrid.astro and GalleryDetailBody.astro, are unchanged by this plan"
    requirement: "UI-03"
    verification:
      - kind: other
        ref: "git diff --name-only lists exactly src/components/EditionDetailBody.astro, src/components/EditionDetailPage.astro, tests/e2e/edition.spec.ts — no GalleryGrid.astro/GalleryDetailBody.astro"
        status: pass
      - kind: e2e
        ref: "npm run test:e2e — full 367-test Playwright suite (368 total, 1 pre-existing skip), including the full pre-existing édition/gallery regression surface, exits 0"
        status: pass
    human_judgment: false

# Metrics
duration: ~25min
completed: 2026-08-26
status: complete
---

# Phase 24 Plan 04: Édition Detail Contact CTA (CONT-04) Summary

**Every édition detail page now ends its photo sequence with the same pink-hairline, 20px Unbounded contact CTA the gallery pages use, proven by e2e at 390px and 1280px in both locales, with a D-09 computed-style guard confirming the shipped EDN-08 related-gallery link above it keeps its 14px bordered treatment untouched.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-08-26T21:19:00Z (approx.)
- **Completed:** 2026-08-26T21:26:30Z (last verification run)
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- `EditionDetailBody.astro` renders `.edition-detail__contact-cta-zone` (hairline rule + anchor + arrow span) as the unconditional last child of `.edition-detail__content`, after `GalleryGrid`, using `contactCtaHref`/`contactCtaLabel` props sourced from the render model (no hardcoded copy or path)
- CSS added verbatim from `24-UI-SPEC.md`'s CONT-04 contract: sketch-pinned literal `20px`/`600`/`1.25` values (not the numerically-coincidental `--text-heading-*` tokens), combined `:hover, :focus-visible` selectors on both the border-bottom reveal and the arrow's `translateX(4px)` nudge, no `prefers-reduced-motion` guard, no background/border-radius/padding (D-08: text link, not a button)
- `EditionDetailPage.astro` threads `model.contactCtaHref`/`model.contactCtaLabel` into the new props
- Zero edits inside the shipped `.edition-detail__related` rule range — confirmed with a zero-deletion `git diff -U0` check before committing
- New "editions contact CTA (CONT-04)" e2e describe block in `tests/e2e/edition.spec.ts`: universality check across every discovered édition at 390px; full structure/copy/computed-style contract check at 390px and 1280px including a D-07 `compareDocumentPosition` DOM-order proof and an English-locale copy check; a D-09 two-weight guard comparing computed `fontSize`/`borderTopWidth`/`fontFamily` on both links on a page carrying both, proving no `Unbounded` bleed onto the older link
- Édition hrefs discovered at runtime via `.editions-index__row`, mirroring the existing EDN-08 block exactly — `tests/unit/e2e-content-fragility.test.ts` still passes (no hardcoded slug introduced)

## Task Commits

1. **Task 1: Render the CONT-04 contact CTA at the end of the édition photo sequence** - `9c03d9a` (feat)
2. **Task 2: Cross-viewport e2e coverage for the édition CTA and the D-09 two-weight relationship** - `118f272` (test)

## Files Created/Modified

- `src/components/EditionDetailBody.astro` — `contactCtaHref`/`contactCtaLabel` Props, CTA markup as the last child of `.edition-detail__content`, CONT-04 CSS block appended after the existing styles
- `src/components/EditionDetailPage.astro` — passes `model.contactCtaHref`/`model.contactCtaLabel` into `EditionDetailBody`
- `tests/e2e/edition.spec.ts` — new "editions contact CTA (CONT-04)" describe block (3 tests)

## Decisions Made

- Followed the plan's explicit instruction to mirror the pre-existing EDN-08 e2e block's runtime-discovery idiom (`.editions-index__row` + `evaluateAll`) rather than the newer `tests/e2e/helpers/content.ts` helpers, for consistency with the block it sits directly after and to keep the diff a pure addition next to that precedent.
- No other binding discretion required — UI-SPEC.md's Component Contract for CONT-04 and the plan's own literal CSS/markup instructions were followed verbatim.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Provisioned missing `.env` build-time env vars in the worktree**
- **Found during:** Task 1 verification (`npm run build`)
- **Issue:** This freshly-created worktree had no `.env` file, so `npm run build` failed immediately with "Missing SANITY_PROJECT_ID or SANITY_DATASET env vars" before reaching any page generation — a pure environmental gap, not a code issue (same class as 24-02-SUMMARY.md's missing-`node_modules` gap).
- **Fix:** Exported `SANITY_PROJECT_ID=gwz8iug4` (the project's own public Sanity project ID, already checked into `sanity/sanity.config.ts` and `sanity/sanity.cli.ts` — not a secret) and `SANITY_DATASET=production` (the dataset name documented in this project's own `README.md`) as shell env vars for every build/test/verify command in this session. No `.env` file was created (a permission-settings deny rule on this directory blocked writing one directly); the exported vars satisfy every subsequent `npm run build`/`test:*` invocation for the remainder of the session.
- **Files modified:** None (no committed files changed; shell-session-scoped env vars only)
- **Verification:** `npm run build` completed successfully (31 pages built) once the vars were exported.
- **Committed in:** N/A (nothing to commit)

**2. [Rule 3 - Blocking] Installed missing `sanity/` subproject dependencies**
- **Found during:** Full-suite verification (`npm run test:unit`) after Task 2's code commit
- **Issue:** `tests/unit/dashboard-logic.test.ts` failed — `Cannot find package '@sanity/icons/BulbOutline'` — because this worktree's `sanity/` subproject had no `node_modules` installed. Same environmental-gap class documented by 24-02-SUMMARY.md, unrelated to any file this plan touches.
- **Fix:** Ran `npm ci` inside `sanity/`. No package.json/lockfile changes.
- **Files modified:** None (`sanity/node_modules` is gitignored)
- **Verification:** `npm run test:unit` — 717/717 passing across the whole suite afterward (was 596/597 with 1 unrelated suite failing before install).
- **Committed in:** N/A (nothing to commit)

**3. [Rule 3 - Blocking] Ran e2e verification on an isolated port to avoid a concurrent worktree's stale preview server**
- **Found during:** Task 2 verification (`npx playwright test tests/e2e/edition.spec.ts`)
- **Issue:** Port 4321 (the Playwright config's default `webServer` target) was already occupied by an `astro dev` process running from the main repo checkout (a concurrent session, per this project's documented pattern of multiple active agents/worktrees). Playwright's `reuseExistingServer: !process.env.CI` reused that stale server instead of building a fresh one from this worktree's changes, so the new CTA tests failed against old markup that had never seen this plan's edits.
- **Fix:** Re-ran verification with `E2E_PORT=4399` (the override variable `playwright.config.ts` already documents for exactly this scenario) so Playwright spawned its own preview server from this worktree's `dist/`, unrelated to the other session's process. Did not touch, kill, or otherwise interfere with the other process.
- **Files modified:** None
- **Verification:** All 30 tests in `edition.spec.ts` passed on the isolated port; the subsequent full-suite `npm run test:e2e` run (367 passed, 1 skipped) also used `E2E_PORT=4399`.
- **Committed in:** N/A (verification-only, no code change)

---

**Total deviations:** 3 auto-fixed (all Rule 3, all purely environmental — a missing `.env`, missing `sanity/node_modules`, and a stale concurrent dev server on the default port). No code or scope changes; `git diff --name-only` across both task commits lists exactly the 3 files in `files_modified`.
**Impact on plan:** None on shipped behavior — every fix was local to this worktree's verification environment, not the committed changes.

## Issues Encountered

None beyond the three environmental items documented above.

## User Setup Required

None — no external service configuration required. (Note: the `.env` values used for this session's local verification were exported as shell variables, not committed; whichever environment actually deploys this build already has its own `SANITY_PROJECT_ID`/`SANITY_DATASET` configured per the project's existing deploy pipeline.)

## Next Phase Readiness

- CONT-04 is now shipped on both page types once plan 24-03 (the parallel gallery-side CTA render, wave 3) lands — this plan intentionally touched neither `GalleryGrid.astro` nor `GalleryDetailBody.astro`, confirmed by `git diff --name-only`.
- Full plan-level verification passed: `npm run typecheck` (0 errors), `npm run lint` (0 errors), `npm run test:unit` (717/717), `npm run test:e2e` (367 passed / 1 pre-existing skip, full suite including both `chromium` and `webkit-mobile` projects), `npm run build && npm run test:artifact` (31 HTML files verified).
- `git diff --name-only` lists exactly `src/components/EditionDetailBody.astro`, `src/components/EditionDetailPage.astro`, `tests/e2e/edition.spec.ts` — no scope drift.
- No blockers for plan 24-05 or the phase's own final verification pass.

---
*Phase: 24-cross-linking-contact-cta*
*Completed: 2026-08-26*
