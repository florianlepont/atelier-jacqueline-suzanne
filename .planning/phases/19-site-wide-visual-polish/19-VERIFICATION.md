---
phase: 19-site-wide-visual-polish
verified: 2026-08-03T12:16:41Z
status: passed
score: 9/9 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Phase 19: Site-Wide Visual Polish Verification Report

**Phase Goal:** Visitors see the Éditions row-hover effect, the halftone header texture, and the Contact hover-fill effect all behave as intended, without reintroducing the horizontal-scroll bug Phase 16 previously fixed.
**Verified:** 2026-08-03T12:16:41Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria + PLAN must_haves)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Hovering a row on `/editions/` recolors the shared header's eyebrow, eyebrow dot, h1, intro paragraph AND divider to the row's accent-text color (SC1 / EDN-09 / D-01) | ✓ VERIFIED | `EditionsOverviewBody.astro` lines 88-101: all 5 rules now use full-selector `:global(html.editions-row-active .page-title-header__*)` form (confirmed via `grep -c` = 5). Ran `npx playwright test tests/e2e/edition.spec.ts --project=chromium --grep "EDN-09"` live: both tests pass (`hovering a row recolors...` and `moving off the row (mouseleave) restores...`). |
| 2 | Moving the pointer off the row restores the header's default colors (transition works both ways) | ✓ VERIFIED | Same test run as above — the mouseleave test passed, asserting `toPass()` recovery of pre-hover eyebrow color. |
| 3 | On `/contact/`, the E-mail/Instagram rows keep visible horizontal space between the row edge and label/value text (SC4 / CONT-03 / D-06) | ✓ VERIFIED | `ContactPageBody.astro` line ~145: `.contact-page__detail` padding changed to `clamp(6px, 1.1vh, 12px) var(--space-md)` (16px horizontal). Ran `npx playwright test tests/e2e/contact.spec.ts --project=chromium --grep "CONT-03"` live: both new tests pass. |
| 4 | The black hover-fill on a Contact row still spans the row's full width edge-to-edge after the padding is added (D-07) | ✓ VERIFIED | `.contact-page__detail::before`'s `inset: 0` left byte-identical (unchanged, resolves against padding box). E2e width-parity assertion passed live in the same test run. |
| 5 | On Contact, About, and Éditions at >=760px, the halftone dot-texture's own box spans the full client width (rect left 0, rect right = clientWidth) (SC2-desktop / UI-01 / D-03) | ✓ VERIFIED | `PageTitleHeader.astro`: `.page-title-header__halftone`'s `left`/`right` changed from `-700px` to `calc(50% - 50vw)`; component-level `overflow-x: clip` removed (confirmed via grep — only comments referencing the old rule remain, no live `overflow-x` declaration in the file). Ran `npx playwright test tests/e2e/page-title-header-bleed.spec.ts --project=chromium` live: all 18 tests pass, including the 6 Block-C geometry tests (3 pages × 2 viewports). |
| 6 | None of Contact, About, or Éditions (plus homepage, Éditions detail, gallery detail, 404) shows horizontal overflow at 320/375/768/1280/1920 (SC3 / D-05) | ✓ VERIFIED | Same live test run — Block A (`site-wide horizontal overflow guard`) covers all 7 pages × 5 widths + an explicit `overflow-x: visible` assertion on `html`/`body`; all 8 tests pass. |
| 7 | About's `.about-page__exhibition-pin` and DetailHero's `.detail-hero__pin` (gallery + édition detail) still compute `position: sticky` AND hold at the viewport top while scrolling — Phase 16's regression class is not reintroduced (D-04/D-05) | ✓ VERIFIED | Block B (`sticky pin regression guard`), 3 tests, all pass live — positive `rect.top` assertions after programmatic scroll, not just computed-property checks. |
| 8 | Neither `html` nor `body` gains an `overflow-x` declaration (D-04 guard against the exact Phase-16 regression class) | ✓ VERIFIED | Confirmed by source inspection (no active `overflow-x` rule remains in `PageTitleHeader.astro`, only historical comments) and by the passing live e2e assertion (`html and body never carry overflow-x on /contact/, /about/ or /editions/`). |
| 9 | Below 760px the halftone stays `display: none`, unchanged (mobile behavior preserved, not a regression) | ✓ VERIFIED | Confirmed pre-existing via git history (`8ad20f8`, pre-dating Phase 19, already had `display: none` + `@media (min-width: 760px) { display: block }`) — Phase 19 did not change this. Live e2e test `at 375x812 the halftone stays display:none...` passes. |

**Score:** 9/9 truths verified (0 present-but-behavior-unverified)

### Note on ROADMAP Success Criterion 2's "mobile widths" clause

SC2 reads: *"On Contact, About, and Éditions, the halftone dot-texture visually bleeds to the true edges of the browser window, at both desktop and mobile widths."* The **desktop** half is verified above (Truth 5). The **mobile** half is not achievable and was never true, before or after this phase: `.page-title-header__halftone` has been `display: none` by default with `display: block` only added at `@media (min-width: 760px)` since before Phase 19 (confirmed via `git show 8ad20f8:src/components/PageTitleHeader.astro`, a Phase-16-era commit). There is no halftone texture at all below 760px to bleed. `REQUIREMENTS.md`'s locked UI-01 text does not mention mobile widths, and the phase's own `19-CONTEXT.md`/`19-02-PLAN.md` explicitly document this as a pre-existing, by-design constraint outside this phase's fix scope (not a regression this phase introduced or could resolve). This is not counted as a failed truth because the underlying claim (halftone reaches true edges) has nothing to act on at mobile widths — but it is flagged here since it is a literal-reading mismatch against ROADMAP.md's phrasing, in case the developer wants to correct SC2's wording for future reference.

**This looks like a pre-existing roadmap-wording inaccuracy, not a phase-19 gap.** No override is required to reach `passed` status since REQUIREMENTS.md (the locked requirement text) doesn't carry the mobile clause and the plan's own scope-clarification section reasoned through it at planning time. Flagging for awareness only.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/EditionsOverviewBody.astro` | 5 re-scoped `:global()` rules (EDN-09) | ✓ VERIFIED | `grep -c ':global(html.editions-row-active .page-title-header'` = 5; declaration bodies byte-identical to plan spec. |
| `src/components/ContactPageBody.astro` | Horizontal padding token on `.contact-page__detail` (CONT-03) | ✓ VERIFIED | `padding: clamp(6px, 1.1vh, 12px) var(--space-md)` present; `::before` `inset: 0` unchanged. |
| `src/components/PageTitleHeader.astro` | Clip→geometry containment (UI-01) | ✓ VERIFIED | `overflow-x: clip` removed; `calc(50% - 50vw)` × 2 present; mask focal-point formula present ×2; `position: relative` + `isolation: isolate` retained; `min-width: 0` / `overflow-wrap: break-word` fix present (Rule-1 latent-bug fix). |
| `tests/e2e/edition.spec.ts` | New EDN-09 describe block | ✓ VERIFIED, WIRED | 2 tests, both pass live. |
| `tests/e2e/contact.spec.ts` | New CONT-03 describe block | ✓ VERIFIED, WIRED | 2 tests, both pass live. |
| `tests/e2e/page-title-header-bleed.spec.ts` | New UI-01 regression net (3 describe blocks, 18 tests) | ✓ VERIFIED, WIRED | All 18 tests pass live under `--project=chromium`. |
| `tests/e2e/visual.spec.ts-snapshots/shared-site-header.png` | Baseline reconciled if needed | ✓ VERIFIED | Untouched (confirmed via `git log` — last touched by an unrelated, pre-Phase-19 commit); `visual.spec.ts` passes live against the existing baseline with the halftone change live. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| Row `mouseenter` handler (`EditionsOverviewBody.astro`) | `--editions-row-accent-text` custom property on `<html>` | JS sets inline style, CSS `:global()` rules consume it | ✓ WIRED | Live e2e assertion confirms computed color actually changes on hover and reverts on mouseleave — not just that the selector compiles. |
| `.contact-page__detail::before` `inset: 0` | `.contact-page__detail`'s padding box | CSS containing-block resolution | ✓ WIRED | Live e2e width-parity assertion (`::before` width == row `getBoundingClientRect().width`) passes, proving the fill still spans edge-to-edge with the new padding present. |
| `.page-title-header__halftone` `left`/`right: calc(50% - 50vw)` | `.page-title-header`'s `position: relative` containing block | CSS `%` resolution against nearest positioned ancestor | ✓ WIRED | Live e2e Block-C assertions confirm the halftone's rect spans exactly `0 -> clientWidth` on all 3 consumer pages at 2 viewports. |
| Mask focal-point formula | `--editorial-page-max` / `--editorial-page-padding-inline` (BaseLayout.astro tokens shared by all 3 consumer containers) | CSS `calc()` referencing shared custom properties | ✓ WIRED | Formula present in both `-webkit-mask-image` and `mask-image`; arithmetic pre-verified at planning time and not contradicted by any failing geometry test. |

### Behavioral Spot-Checks (run live during this verification, not trusted from SUMMARY)

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| EDN-09 e2e (2 tests) | `npx playwright test tests/e2e/edition.spec.ts --project=chromium --grep "EDN-09"` | 2 passed | ✓ PASS |
| CONT-03 e2e (2 tests) | `npx playwright test tests/e2e/contact.spec.ts --project=chromium --grep "CONT-03"` | 2 passed | ✓ PASS |
| UI-01 regression net (18 tests, all 3 blocks) | `npx playwright test tests/e2e/page-title-header-bleed.spec.ts --project=chromium` | 18 passed | ✓ PASS |
| Full `edition.spec.ts` + `contact.spec.ts` regression | `npx playwright test tests/e2e/edition.spec.ts tests/e2e/contact.spec.ts --project=chromium` | 30 passed | ✓ PASS |
| Visual baseline (`shared-site-header.png`, `contact-form.png`) | `npx playwright test tests/e2e/visual.spec.ts --project=chromium` | 2 passed | ✓ PASS |
| Typecheck | `npm run typecheck` | 0 errors, 0 warnings | ✓ PASS |
| Lint | `npm run lint` | exits 0 | ✓ PASS |
| Unit tests | `npm run test:unit` | 276/276 passed, 16/16 files (including `dashboard-logic.test.ts`, which both SUMMARYs logged as a pre-existing unrelated failure — it passes cleanly in this verification environment; noted below, not a gap) | ✓ PASS |
| Build | `npm run build` | 29 pages built, no errors | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| EDN-09 | 19-01-PLAN.md | Éditions row-hover recolors title/description with eyebrow/divider | ✓ SATISFIED | Live e2e pass, source inspection confirms full-selector `:global()` fix. |
| CONT-03 | 19-01-PLAN.md | Contact hover-fill rows get horizontal breathing room | ✓ SATISFIED | Live e2e pass, source inspection confirms padding token + unchanged `inset: 0`. |
| UI-01 | 19-02-PLAN.md | Halftone bleeds to true viewport edges without reintroducing horizontal-scroll bug | ✓ SATISFIED | Live e2e pass (18/18), source inspection confirms clip removed + geometry containment, no `overflow-x` on `html`/`body`. |

No orphaned requirements: `REQUIREMENTS.md`'s traceability table maps exactly EDN-09, UI-01, CONT-03 to Phase 19, matching the union of both plans' `requirements:` frontmatter.

### Anti-Patterns Found

None. Grepped all 6 phase-modified files (`EditionsOverviewBody.astro`, `ContactPageBody.astro`, `PageTitleHeader.astro`, `edition.spec.ts`, `contact.spec.ts`, `page-title-header-bleed.spec.ts`) for `TBD|FIXME|XXX|TODO|HACK|PLACEHOLDER` — zero matches.

### Human Verification Required

None required to reach `passed` status — all must-haves have live, re-run, passing automated evidence (not SUMMARY-trusted). One item remains genuinely unverifiable by any automated means and was already correctly flagged by the phase's own SUMMARY as an open residual for a human to check, not a gap in this phase's execution:

### 1. Scrollbar-inclusive-viewport-units residual on a space-taking-scrollbar platform

**Test:** On Windows/Linux Chrome, or macOS with "Show scroll bars: Always" enabled, open `/contact/`, `/about/`, `/editions/` at ~1280/1440/1920 width and look for a horizontal scrollbar.
**Expected:** No horizontal scrollbar. If one appears, it will be narrow (up to ~half a scrollbar width, 7-8px).
**Why human:** `50vw`-based CSS units are scrollbar-inclusive on platforms with space-taking (non-overlay) scrollbars. All automated test environments available (headless Chromium/WebKit, both configured Playwright projects, macOS overlay scrollbars) structurally cannot exhibit this — `innerWidth - clientWidth === 0` in every environment this verification could run in. `PageTitleHeader.astro`'s own comment documents the fix (`right: calc(50% - 50vw + 8px)`) if this is ever observed. This does not block `passed` status: the automated overflow guard (Block A, 7 pages × 5 widths) is green in every environment it can run in, and the residual is a known, bounded, documented edge case rather than an unresolved implementation gap.

---

*Verified: 2026-08-03T12:16:41Z*
*Verifier: Claude (gsd-verifier)*
