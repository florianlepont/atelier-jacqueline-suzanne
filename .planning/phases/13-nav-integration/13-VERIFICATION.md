---
phase: 13-nav-integration
verified: 2026-07-23T13:15:00Z
status: passed
score: 5/5 must-haves verified
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 4/5
  gaps_closed:
    - "The header carrying its now-4th nav link produces no horizontal page overflow from the widest viewport down to <359px, in both the solid (About/Contact) and transparent (homepage/gallery-detail) variants (D-02, SC #5)"
  gaps_remaining: []
  regressions: []
---

# Phase 13: Nav Integration Verification Report

**Phase Goal:** Visitors can discover Éditions from the main site navigation on every page, while the homepage's photography carousel/grid content itself stays pure photography.
**Verified:** 2026-07-23T13:15:00Z
**Status:** passed
**Re-verification:** Yes — after gap closure (13-02 fixed the previously FAILED SC #5)

## Goal Achievement

This is a from-scratch re-verification of all 5 success criteria against the current codebase state (post 13-02 gap-closure), not an incremental check of only the previously-failed item. The prior 13-VERIFICATION.md's findings on Truths #1-#4 were cross-checked against current code (all still hold; no regression from the 13-02 CSS-only diff), and Truth #5 was independently re-measured rather than trusted from 13-02-SUMMARY.md.

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | "Éditions" nav link renders as the FIRST link in `.site-nav` on every page in both locales (SC #1) | VERIFIED | Built static HTML inspected directly (`npm run build`, 25 pages): `dist/index.html`, `dist/en/index.html`, `dist/about/index.html`, `dist/en/about/index.html`, `dist/contact/index.html`, `dist/en/contact/index.html`, `dist/galleries/silos/index.html`, `dist/en/galleries/silos/index.html`, `dist/mentions-legales/index.html`, `dist/editions/index.html` all show `<a href="/editions/" class="nav-link">Éditions</a>` (or `/en/editions/` on EN pages) as the FIRST `.nav-link`, ahead of About/Contact/Instagram. Independently re-ran `npx playwright test tests/e2e/site-header.spec.ts` myself: 39/39 pass, including the "nav structure" and "cross-page structural identity" (home vs. about hrefs equal, index 0 = editions) specs. |
| 2 | The Éditions nav link points to `/editions/` (fr) / `/en/editions/` (en), resolving to the Phase 12 overview route (SC #2) | VERIFIED | Same build-output inspection above + the e2e "Éditions nav link (EDN-01, D-01, SC #1/#2)" describe block (6/6 path cases: `/`, `/en/`, `/about/`, `/en/about/`, `/contact/`, `/en/contact/`) all pass, re-run directly by this verification, not taken from any SUMMARY. `dist/editions/index.html` and `dist/en/editions/index.html` exist (Phase 12 routes). |
| 3 | The label falls back to "Éditions" in both locales when Sanity is empty, and is overridden by `siteSettings.navLabels.editions.{fr,en}` when populated (SC #4) | VERIFIED | `src/lib/site-config.ts:23` — `editionsLabel: settings?.navLabels?.editions?.[locale] \|\| 'Éditions'`. `sanity/schemas/siteSettings.ts:159-166` — `navLabels.editions` object field (fr/en strings, mirrors about/contact) + `initialValue.navLabels.editions = {fr: 'Éditions', en: 'Éditions'}` (line 72). `src/lib/sanity.ts` — `navLabels.editions?: Partial<LocaleString>` type member present. `npm run test:unit -- site-config` re-run directly by this verification: 8/8 passed, including the two editionsLabel fallback/override assertions. |
| 4 | The homepage's carousel rotation and grid tiles contain no Éditions entry — only the header links to Éditions (SC #3) | VERIFIED | Built `dist/index.html` inspected: the `[data-role="home-carousel"]`/`[data-role="home-grid"]`/`[data-role="home-carousel-data"]` regions contain zero "editions" occurrences. `HomeCarousel.astro`'s `galleries` prop/type and carousel/grid markup are unmodified by either 13-01 or 13-02 (git diff confined to `SiteCopy` interface + two consts + `<SiteHeader>` prop pass in 13-01; 13-02 touched only `SiteHeader.astro` CSS and the e2e spec). e2e "homepage carousel/grid stay Éditions-free" (2/2, `/` and `/en/`) re-run directly: passes. |
| 5 | The header carrying its now-4th nav link produces no horizontal overflow AND no two-row wrap, from the widest viewport down to the narrowest supported phone, in both the solid and transparent variants (D-02, SC #5) — **previously FAILED, now re-verified from scratch** | VERIFIED | Root cause confirmed fixed in `src/components/SiteHeader.astro`: the `@media (max-width: 767px)` `.site-header` rule now reads `flex-wrap: nowrap` (line 287, was `wrap`), and the compensating-trim breakpoint is raised to `@media (max-width: 400px)` (line 306, was `359px`) — both changes visible directly in the current file, matching 13-02-SUMMARY.md's claims. Re-ran `npx playwright test tests/e2e/site-header.spec.ts` myself: the "single-row fit across the mobile range" describe block (12 tests: widths 320/360/374/375/390/767 × `/about/` solid + `/` transparent) all PASS — same-row (nav vs. language-switcher vertical-center within 5px) AND no horizontal overflow at every sampled width, including the previously-broken 360-375px band. Went further than the shipped suite: wrote and ran an independent ad-hoc probe (same same-row + no-overflow assertions) against `/galleries/silos/`, `/en/galleries/silos/`, and `/mentions-legales/` — pages the shipped regression block does not sample — across the same 6 widths: 18/18 pass, confirming the fix generalizes beyond the two pages the phase's own tests cover. Also confirmed the human-verify checkpoint (Task 3 of 13-02) is recorded as APPROVED in 13-02-SUMMARY.md with a specific real-user confirmation at 375px/360px/320px on both variants — this checkpoint type is a blocking gate the user could only pass by explicitly typing approval, not something an executor can self-report. |

**Score:** 5/5 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `sanity/schemas/siteSettings.ts` | `navLabels.editions` object field + default | VERIFIED | Lines 72 (initialValue), 158-166 (field def), no `.required()`, matches about/contact. |
| `src/lib/sanity.ts` | `SiteSettings.navLabels.editions?: Partial<LocaleString>` | VERIFIED | Type member present. |
| `src/lib/site-config.ts` | `editionsLabel` key in `resolveSiteCopy()` | VERIFIED | Line 23, single-fallback-string form. |
| `src/components/SiteHeader.astro` | `editionsLabel`/`editionsHref` props + Éditions `<a>` first; corrected mobile CSS | VERIFIED | Props/markup lines 22-23, 39-40, 63; `.site-header` nowrap (line 287) + trim breakpoint raised to 400px (line 306) — the Truth #5 gap is closed at the artifact level, not just claimed. |
| `src/layouts/BaseLayout.astro` | `editionsLabel`/`editionsHref` consts + prop pass | VERIFIED | Unchanged since prior verification (not touched by 13-02); still correct. |
| `src/components/HomeCarousel.astro` | `SiteCopy.editionsLabel` + consts + prop pass; `galleries` untouched | VERIFIED | Unchanged since prior verification; still correct. |
| `tests/e2e/site-header.spec.ts` | 4-link contract + homepage-editions-free guard + narrow-viewport no-overflow/no-wrap coverage inside the broken band | VERIFIED | 39/39 pass, re-run directly. The new "single-row fit across the mobile range" describe block (added by 13-02) closes the previous blind spot by sampling 360/374/375px with a same-row assertion, not just scrollWidth. |
| `tests/unit/site-config.test.ts` | `editionsLabel` fallback + override assertions | VERIFIED | 8/8 pass, re-run directly. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `resolveSiteCopy()` return | Each call site's `siteCopy`/consts | `siteCopy.editionsLabel` | WIRED | Confirmed at both `BaseLayout.astro` and `HomeCarousel.astro`. |
| Call-site consts | `<SiteHeader>` props | `editionsLabel={editionsLabel} editionsHref={editionsHref}` | WIRED | Confirmed at both call sites; build output renders the link on every page type (home, about, contact, gallery-detail, legal, editions itself). |
| `getRelativeLocaleUrl(locale, 'editions')` | Phase 12's `/editions/` (fr) / `/en/editions/` (en) routes | Direct href | WIRED | `dist/editions/index.html` and `dist/en/editions/index.html` exist and are the href targets. |
| `@media` breakpoints (767px block + 400px block) | Single-row fit at all widths 320-767px | CSS cascade | WIRED (previously NOT WIRED — this is the repaired link) | `flex-wrap: nowrap` now applies across the entire sub-768px range; the 400px-ceiling compensating trims cover the band that previously fell through the gap (360-400px). Re-measured directly by this verification via e2e re-run + an independent probe on 3 additional pages; no gap remains. |

### Behavioral Spot-Checks (re-run directly by this verification, not taken from SUMMARY)

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Build succeeds with current code | `npm run build` | 25 pages built, no errors | PASS |
| Unit: `editionsLabel` fallback/override | `npm run test:unit -- site-config` | 8/8 passed | PASS |
| e2e: full `site-header.spec.ts` suite (all 6 describe blocks incl. the gap-closure block) | `npx playwright test tests/e2e/site-header.spec.ts` | 39/39 passed | PASS |
| e2e: homepage regression guard | `npx playwright test tests/e2e/homepage.spec.ts` | 44/44 passed | PASS |
| Independent probe: same-row + no-overflow at 320/360/374/375/390/767px on `/galleries/silos/`, `/en/galleries/silos/`, `/mentions-legales/` (pages NOT in the shipped test suite) | Ad-hoc Playwright script written, run, and removed by this verification | 18/18 passed | PASS |
| Debt-marker / stub scan across all 8 phase-modified files | `grep -nE "TBD\|FIXME\|XXX\|TODO\|HACK\|PLACEHOLDER"` + placeholder/coming-soon text scan | Zero matches | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| EDN-01 | 13-01-PLAN.md, 13-02-PLAN.md (gap closure) | Visitor can discover an "Éditions" section via a new top-level main-nav entry (not surfaced on the homepage carousel/grid) | SATISFIED | All 5 ROADMAP success criteria independently re-verified true against current code: discoverability, correct-locale routing, homepage-carousel purity, Sanity-editability, and now (post gap-closure) cross-device mobile robustness at 320-767px including the previously-broken 360-400px band. |

No orphaned requirements: REQUIREMENTS.md maps only EDN-01 to Phase 13, and both plans' frontmatter `requirements: [EDN-01]` matches exactly.

**Documentation hygiene note (non-blocking, carried forward from prior verification, still present):** `REQUIREMENTS.md` line 79 still shows EDN-01 with an unchecked `- [ ]` box, and the Traceability table (line 205) still says "Pending," even though ROADMAP.md and both SUMMARYs mark Phase 13 complete. This is a bookkeeping gap in REQUIREMENTS.md, not a functional one, and does not affect the score — flagged for hygiene only. Recommend flipping the checkbox and "Pending" → "Complete" as a trivial follow-up.

### Anti-Patterns Found

None. Grepped all 8 phase-modified files (`SiteHeader.astro`, `BaseLayout.astro`, `HomeCarousel.astro`, `site-config.ts`, `sanity.ts`, `siteSettings.ts`, `site-header.spec.ts`, `site-config.test.ts`) for `TBD|FIXME|XXX|TODO|HACK|PLACEHOLDER` and "coming soon"/"not yet implemented"/"not available" — zero matches. No stub returns, no hardcoded-empty props flowing to render, no debt markers. `git status` is clean (no stray files left from this verification's own probe script).

### Code Review Cross-Reference

`13-REVIEW.md` (dated 2026-07-23T11:04:07Z, post-gap-closure, superseding the pre-gap-closure review) found 0 critical, 3 warnings, 2 info — none rated as blocking the phase goal, and none contradicts this verification's findings:
- WR-01: `sanity/editorial/checks.ts`'s content-completeness dashboard doesn't check `navLabels.editions` — a Studio-editorial-hygiene gap, not a visitor-facing defect (SC #4's fallback already covers the case Romane leaves it blank).
- WR-02: no CMS-side required-validation on `navLabels.editions.{fr,en}` — matches the pre-existing about/contact pattern exactly; rescued by the `||` fallback.
- WR-03: pre-existing, unrelated to Phase 13 (hidden legacy `navLabels.home`/`galleries` fields).
- IN-01/IN-02: minor schema duplication and e2e coverage-breadth notes (gallery-detail/legal pages aren't in the shipped test suite's parametrized lists, though the underlying behavior was confirmed correct by direct dist inspection in both the review and this verification).

This verification independently corroborates IN-02's finding and closes the residual doubt it raised: my own ad-hoc probe against `/galleries/silos/`, `/en/galleries/silos/`, and `/mentions-legales/` (not in the shipped suite) confirms single-row fit generalizes to those pages too (18/18 pass) — the gap-closure fix is not narrowly scoped to only the two sampled pages.

## Gaps Summary

None. All 5 ROADMAP success criteria for Phase 13 are verified true against the current codebase, re-checked from scratch rather than trusted from SUMMARY.md claims:

- SC #1/#2 (discoverability + correct-locale routing): verified via direct build-output inspection across 10 distinct page/locale combinations plus a self-run e2e suite.
- SC #3 (homepage carousel/grid purity): verified via region-scoped e2e assertions and an unmodified `galleries` data path.
- SC #4 (Sanity-editable label): verified via schema, resolver, and unit tests re-run directly.
- SC #5 (mobile fit, both variants) — the item the prior verification FAILED — is now independently re-verified fixed: the root-cause CSS (`flex-wrap: nowrap` across the whole sub-768px range + trim breakpoint raised to 400px) is present in the current file, the shipped regression e2e (sampling inside the previously-broken 360-375px band) passes, homepage regression suite stays green, and an independent probe on 3 pages outside the shipped test matrix (gallery-detail FR/EN, legal) also passes — closing the residual "does it generalize" doubt the code review raised. The blocking human-verify checkpoint from 13-02 (Task 3) is recorded as approved by the real user, not self-reported by an executor.

No regressions were introduced by the 13-02 gap-closure diff: the full `site-header.spec.ts` (39/39) and `homepage.spec.ts` (44/44) suites both pass, and `git diff`-scope for 13-02 (per its own SUMMARY and confirmed by this verification's file read) is confined to two files (`SiteHeader.astro` CSS-only, `site-header.spec.ts` new describe block).

---

_Verified: 2026-07-23T13:15:00Z_
_Verifier: Claude (gsd-verifier)_
