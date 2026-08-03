---
phase: 19-site-wide-visual-polish
plan: 01
subsystem: ui
tags: [astro, css, playwright, scoped-css]

requires:
  - phase: 18-gallery-editions-display-fixes
    provides: gallery/éditions display surface stabilized, no open regressions
provides:
  - EDN-09 fixed — Éditions row-hover now recolors the shared PageTitleHeader's eyebrow, eyebrow dot, h1, intro, and divider to the hovered row's accent color, and reverts on mouseleave
  - CONT-03 fixed — Contact's E-mail/Instagram rows have 16px horizontal breathing room around their text while the black hover-fill still spans the row edge-to-edge
affects: [19-02-halftone-bleed]

tech-stack:
  added: []
  patterns:
    - "Astro :global() must wrap the ENTIRE cross-component selector chain, not just a leading state/class prefix, when targeting elements rendered by a different component"
    - "An absolutely-positioned ::before with inset:0 inside a position:relative ancestor resolves against that ancestor's PADDING box, so adding horizontal padding to the ancestor does not shrink the ::before fill"

key-files:
  created: []
  modified:
    - src/components/EditionsOverviewBody.astro
    - src/components/ContactPageBody.astro
    - tests/e2e/edition.spec.ts
    - tests/e2e/contact.spec.ts

key-decisions:
  - "EDN-09 shipped with the primary :global(html.editions-row-active .page-title-header__eyebrow::before) form (no fallback needed) — the pseudo-element-inside-:global() syntax compiled and typechecked cleanly"
  - "CONT-03 shipped with var(--space-md) (16px), the plan's primary option, not the --space-sm fallback — 16px read correctly against the row's label/value pair"
  - "CONT-03's ::before inset:0 was left completely unchanged — measured live via a new e2e width assertion, confirming inset:0 resolves against the row's padding box (not content box), so the fill already spans full edge-to-edge without any negative-inset compensation"

patterns-established:
  - "Full-selector :global() wrap convention documented inline at EditionsOverviewBody.astro's comment for any future cross-component targeting"

requirements-completed: [EDN-09, CONT-03]

coverage:
  - id: D1
    description: "Hovering an Éditions row recolors PageTitleHeader's eyebrow, eyebrow dot, h1, intro, and divider to the row's accent color, and reverts on mouseleave"
    requirement: "EDN-09"
    verification:
      - kind: e2e
        ref: "tests/e2e/edition.spec.ts#editions row-hover header color sync (EDN-09) > hovering a row recolors the shared header eyebrow, eyebrow dot, h1, intro, and divider to the row's own accent color"
        status: pass
      - kind: e2e
        ref: "tests/e2e/edition.spec.ts#editions row-hover header color sync (EDN-09) > moving off the row (mouseleave) restores the eyebrow to its pre-hover color"
        status: pass
    human_judgment: false
  - id: D2
    description: "Contact's E-mail/Instagram rows show horizontal breathing room around the label/value text, in both locales, while the hover-fill still reaches the row's true edges"
    requirement: "CONT-03"
    verification:
      - kind: e2e
        ref: "tests/e2e/contact.spec.ts#contact link-row hover-fill spacing (CONT-03) > E-mail/Instagram rows have 16px horizontal padding with breathing room around the text, in both locales"
        status: pass
      - kind: e2e
        ref: "tests/e2e/contact.spec.ts#contact link-row hover-fill spacing (CONT-03) > the hover-fill still spans the row edge-to-edge after the padding is added"
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-08-03
status: complete
---

# Phase 19 Plan 01: Éditions Row-Hover Color Sync & Contact Row Spacing Summary

**Fixed a broken Astro `:global()` selector scope that silently prevented Éditions row-hover from ever recoloring the shared header (EDN-09), and added 16px horizontal padding to Contact's link rows without shrinking the black hover-fill (CONT-03) — both proven by new, transition-aware e2e coverage.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-08-03T13:29:00+02:00 (approx.)
- **Completed:** 2026-08-03T13:37:02+02:00
- **Tasks:** 2/2 completed
- **Files modified:** 4

## Accomplishments
- EDN-09: rewrote the 5 broken `:global(html.editions-row-active) .page-title-header__*` rules in `EditionsOverviewBody.astro` so the ENTIRE selector sits inside `:global(...)` — the partial wrap could never match `PageTitleHeader.astro`-rendered elements, since only the portion inside the parentheses is exempted from the component's own Astro scope-hash
- CONT-03: changed `.contact-page__detail`'s padding from `clamp(6px, 1.1vh, 12px) 0` to `clamp(6px, 1.1vh, 12px) var(--space-md)`, giving the E-mail/Instagram text breathing room; left `::before`'s `inset: 0` untouched by design, and measured live that the hover-fill still spans the row's full border-box width
- Added new, transition-aware e2e coverage for both fixes (waits past the 0.35s color transition and the 320ms transform transition before asserting computed style)

## Task Commits

Each task was committed atomically:

1. **Task 1: Re-scope the 5 Éditions row-hover header rules and cover them with e2e assertions (EDN-09)** - `8086dfe` (fix)
2. **Task 2: Add horizontal padding to Contact's link rows without shrinking the hover-fill (CONT-03)** - `7c250be` (fix)

**Plan metadata:** (this commit, docs: complete plan)

## Files Created/Modified
- `src/components/EditionsOverviewBody.astro` - 5 `:global()` rules re-scoped to wrap the entire selector chain (eyebrow, eyebrow `::before`, h1, intro, divider); comment extended to explain why
- `src/components/ContactPageBody.astro` - `.contact-page__detail` horizontal padding added (`var(--space-md)`); comment added explaining why `::before`'s `inset: 0` stays unchanged
- `tests/e2e/edition.spec.ts` - new `editions row-hover header color sync (EDN-09)` describe block (2 tests)
- `tests/e2e/contact.spec.ts` - new `contact link-row hover-fill spacing (CONT-03)` describe block (2 tests)

## Decisions Made
- EDN-09's `::before` selector shipped in the primary form, `:global(html.editions-row-active .page-title-header__eyebrow::before)` — the pseudo-element-inside-`:global()` syntax compiled and typechecked without issue, so the plan's documented fallback form was not needed.
- CONT-03's padding shipped as `var(--space-md)` (16px), the plan's primary recommendation — read correctly against the row's short label/value pair, so the `--space-sm` fallback was not needed.
- CONT-03's `::before` `inset: 0` was left completely unchanged. This was verified, not assumed: a new e2e assertion measures the pseudo-element's computed `width` against the row's own `getBoundingClientRect().width` (within 0.5px) both before and after the padding change, confirming `inset: 0` resolves against the row's padding box (which already includes the new padding) rather than its content box — so the fill was never at risk of shrinking. No negative-inset compensation was required.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed a self-defeating test assertion in the EDN-09 e2e coverage (test-only, no product code affected)**
- **Found during:** Task 1, first `npx playwright test --grep "EDN-09"` run
- **Issue:** The plan's action explicitly says to hover the *first* `.editions-index__row` and use its own computed color as the reference value. `EditionsOverviewBody.astro`'s row-hover `ACCENTS` array cycles `[accent-bg/on-accent-text, purple/#FFFFFF, teal/ink, lime/ink, plum/#FFFFFF]`, and `ACCENTS[0].text` (`var(--color-on-accent)`) resolves to the exact same value as the page's default ink color (`var(--gray-900)`). Hovering row 0 therefore produces a *coincidental* zero color delta on every affected property even when the underlying `:global()` fix is correctly applying — which defeats the "differs from pre-hover" assertions the plan itself calls for ("proves the rule fires, not that both states happen to match"). Confirmed the fix itself was working: the `toPass()` block (equal-to-row-color assertions) passed instantly for row 0 too; only the differs-from-default check failed, and only because row 0's own accent happens to equal the default.
- **Fix:** Switched both new tests to hover the second row (`ACCENTS[1]`, white text `#FFFFFF`), which is guaranteed to differ from the default ink color, giving a real, assertable color delta. A second, smaller bug was found in the same test: the reference `rowColor` was read once immediately after `.hover()`, before `.editions-index__row`'s own `transition: color 0.35s ease` had settled, so it briefly captured a mid-transition value. Fixed by re-reading the row's color fresh on every `toPass()` retry instead of caching it once.
- **Files modified:** `tests/e2e/edition.spec.ts` (test code only — no product/component code involved)
- **Verification:** Both EDN-09 tests pass; full `edition.spec.ts` suite (14 tests) passes.
- **Committed in:** `8086dfe` (Task 1 commit — the test was written and fixed within the same task before committing, so there is no separate "broken" commit in history)

---

**Total deviations:** 1 auto-fixed (1 bug, test-only)
**Impact on plan:** No product-code impact — both `EditionsOverviewBody.astro` selector edits shipped exactly as specified in the plan (byte-identical declaration bodies, full-selector `:global()` wrap). The deviation is confined to how the accompanying e2e test picks its reference row and reads its reference value; the plan's literal "first row" instruction happened to collide with an unrelated, pre-existing coincidence in the row-accent color cycle. No scope creep.

## Issues Encountered
- `npm run build` initially failed with "Missing SANITY_PROJECT_ID or SANITY_DATASET env vars" because this worktree had no `.env` file (worktrees don't inherit the gitignored `.env` from the main checkout). Copied the main repo's `.env` into the worktree (not committed — confirmed still gitignored via `git check-ignore -v .env` after the copy) so the local build/e2e verification loop could run. This is a local verification-environment fix only, not a plan deviation.
- `npm run test:unit` has one pre-existing, unrelated failing suite (`tests/unit/dashboard-logic.test.ts`, missing `@sanity/icons/BulbOutline` export in `sanity/editorial/dashboardLogic.ts`) — confirmed pre-existing in both this worktree's and the main checkout's `node_modules` (a `sanity/` subproject dependency/version mismatch), not caused by this plan's CSS-only changes to `EditionsOverviewBody.astro`/`ContactPageBody.astro`. All 175 individual tests across the other 15 unit suites pass. Logged to `.planning/phases/19-site-wide-visual-polish/deferred-items.md` per the scope boundary rule (out-of-scope, not fixed).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- EDN-09 and CONT-03 are both closed; 2 of the milestone's remaining 3 requirements (EDN-09, CONT-03) are now done, leaving only UI-01 (halftone bleed restoration), tracked in Plan 02 of this phase.
- No blockers for Plan 02 — it touches a different component (`PageTitleHeader.astro`'s halftone/overflow rules) with no file overlap against this plan's edits.

---
*Phase: 19-site-wide-visual-polish*
*Completed: 2026-08-03*
