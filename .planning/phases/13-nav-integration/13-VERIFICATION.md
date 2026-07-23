---
phase: 13-nav-integration
verified: 2026-07-23T07:02:14Z
status: gaps_found
score: 4/5 must-haves verified
behavior_unverified: 0
overrides_applied: 0
gaps:
  - truth: "The header carrying its now-4th nav link produces no horizontal page overflow from the widest viewport down to <359px, in both the solid (About/Contact) and transparent (homepage/gallery-detail) variants (D-02, SC #5)"
    status: failed
    reason: "Direct, reproducible browser measurement shows the header wraps to a SECOND row (the language switcher drops below the nav) in the ~360px-374px viewport width range, in BOTH the solid (/about/) and transparent (/, homepage) header variants. This range includes common real device widths — iPhone SE (375px) and iPhone 12 mini / many Android phones (360px) — and is exactly the width the plan's own Task 3 human-check named as a target verification width ('iPhone SE ~375px'). Screenshots confirm the switcher visibly renders on its own line below Éditions/À propos/Contact/Instagram (solid variant) and overlapping the hero photo below the nav row (transparent variant) — not the single row D-02 and the plan's acceptance criteria require. This is a genuine regression introduced by adding the 4th (Éditions) nav link: at the same 375px width, a worktree checkout of the pre-Phase-13 commit (ca92615^, 3-link header) keeps the nav and language switcher on one shared row (switcher top=44, nav top=44); post-Phase-13, at the identical width, the switcher top drops to 112 (nav top stays 44) — a new wrap that did not exist before this phase's markup/CSS change."
    artifacts:
      - path: "src/components/SiteHeader.astro"
        issue: "The existing @media (max-width: 767px) block (flex-wrap: wrap on .site-header) and the @media (max-width: 359px) last-resort block (flex-wrap: nowrap) leave an unhandled gap in between: at 360px-374px, neither trim applies, the 4-link .site-nav plus the language switcher no longer fit their shared row, and the header wraps to two rows. The Task 3 mobile-fit re-measurement only tested 320px and 393px (both e2e assertions PASS at those two points), which straddle but never land inside this broken range, so the regression shipped undetected by the phase's own new tests."
    missing:
      - "Extend/adjust the mobile-fit CSS (or lower the @media (max-width: 359px) breakpoint / add an intermediate breakpoint) so the header stays single-row with no wrap across the full 320px-767px range, not just at the two specific widths (320px, 393px) the added e2e assertions happen to sample."
      - "Add an e2e assertion at a width inside 360px-374px (e.g. 375px, matching the plan's own named target 'iPhone SE ~375px') that fails on wrap — the existing scrollWidth<=innerWidth check does not catch this bug because the overflow is vertical (an extra row), not horizontal; a same-row assertion (e.g. comparing the language switcher's and a nav-link's bounding-rect top) is needed."
      - "Re-run the live human-check at 375px (as literally specified in the plan) — the SUMMARY's claim that this was confirmed via 'a live screenshot in both header variants' at 320px/375px is contradicted by this verification's own screenshots, which show the wrap occurring at 375px on both variants."
---

# Phase 13: Nav Integration Verification Report

**Phase Goal:** Visitors can discover Éditions from the main site navigation on every page, while the homepage's photography carousel/grid content itself stays pure photography.
**Verified:** 2026-07-23T07:02:14Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## MVP Mode Note

ROADMAP.md marks Phase 13 `**Mode:** mvp`, but its `**Goal:**` line ("Visitors can discover Éditions from the main site navigation on every page, while the homepage's photography carousel/grid content itself stays pure photography.") is outcome-shaped, not in `As a [role], I want to [capability], so that [outcome]` form (confirmed via `user-story.validate` → `valid: false`). Per the MVP-mode verification contract this is a discrepancy that would normally block the MVP User-Flow-Coverage framing and ask for `/gsd mvp-phase 13` to reformat the goal. The phase's own PLAN.md already derived a compliant user story internally ("As a site visitor, I want to find an 'Éditions' link in the main navigation on every page... so that I can reach the Éditions overview...") and this is consistent with every other phase's ROADMAP goal in this project (none use strict user-story phrasing at the ROADMAP level despite `Mode: mvp`), so this looks like a project-wide convention rather than a Phase-13-specific defect. Standard goal-backward verification (not the MVP User-Flow-Coverage table) was used below, since forcing that framing against a non-user-story ROADMAP goal would be low-quality per the reference guidance. Flagging for the developer's awareness; not treated as a phase blocker on its own.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | "Éditions" nav link renders as the FIRST link in `.site-nav` on every page in both locales | ✓ VERIFIED | Built static HTML (`npm run build`) inspected directly: `dist/index.html`, `dist/en/index.html`, `dist/about/index.html`, `dist/contact/index.html`, `dist/galleries/silos/index.html`, `dist/editions/index.html`, `dist/mentions-legales/index.html` all show `<a href="/editions/" class="nav-link">Éditions</a>` (or `/en/editions/` on EN pages) as the first `.nav-link`, ahead of À propos/About and Contact. `npx playwright test tests/e2e/site-header.spec.ts` (27/27 passed) independently confirms this via the "nav structure" and "cross-page structural identity" specs. |
| 2 | The Éditions nav link points to `/editions/` (fr) and `/en/editions/` (en), resolving to the Phase 12 overview route | ✓ VERIFIED | Same build-output inspection + e2e "Éditions nav link (EDN-01, D-01, SC #1/#2)" describe block (6/6 path cases pass): `/`, `/en/`, `/about/`, `/en/about/`, `/contact/`, `/en/contact/` all resolve the first nav-link href to the correct-locale `/editions/` route, which `npm run build` confirms exists (`dist/editions/index.html`, `dist/en/editions/index.html`). |
| 3 | The label falls back to "Éditions" in both locales when Sanity is empty, and is overridden by `siteSettings.navLabels.editions.{fr,en}` when populated | ✓ VERIFIED | `src/lib/site-config.ts:23` — `editionsLabel: settings?.navLabels?.editions?.[locale] \|\| 'Éditions'`. `sanity/schemas/siteSettings.ts` — `navLabels.editions` object field (fr/en strings, no `.required()`, mirrors `about`/`contact`) plus `initialValue.navLabels.editions = {fr: 'Éditions', en: 'Éditions'}`. `src/lib/sanity.ts` — `navLabels.editions?: Partial<LocaleString>` type member present. `npm run test:unit -- site-config` → 8/8 passed, including the two new fallback/override assertions for `editionsLabel`, executed directly by this verification (not taken from the SUMMARY). |
| 4 | The homepage's carousel rotation and grid tiles contain no Éditions entry — the only `/editions` link on the homepage is inside the header nav | ✓ VERIFIED | Built `dist/index.html` inspected: the `[data-role="home-carousel"]` … `[data-role="home-carousel-data"]` region contains zero occurrences of "editions"; `HomeCarousel.astro`'s `galleries` prop/type and carousel/grid markup are untouched by this phase's diff (only the `SiteCopy` interface + two new consts + `<SiteHeader>` prop pass were added). `tests/e2e/site-header.spec.ts`'s "homepage carousel/grid stay Éditions-free" describe block (2/2, `/` and `/en/`) independently confirms zero editions anchors in the carousel/grid regions and exactly one in the header. |
| 5 | The header carrying its now-4th nav link produces no horizontal page overflow from the widest viewport down to <359px, in both the solid and transparent variants (D-02, SC #5) | ✗ FAILED | Reproducible measurement (this verification's own Playwright script, not the SUMMARY's claim): at viewport widths 360px-374px inclusive, the language switcher wraps to a SECOND row below the 4-link nav, on both `/about/` (solid) and `/` (transparent/homepage) — confirmed visually via screenshot at 375px on both pages. A worktree checkout of the pre-Phase-13 commit shows NO wrap at the same 375px width with the old 3-link header (switcher stays on the nav's row). The phase's own added e2e assertions test only 320px and 393px, which straddle this broken range without ever sampling inside it, so the regression passed CI/e2e undetected. See `gaps` in frontmatter for full detail. |

**Score:** 4/5 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `sanity/schemas/siteSettings.ts` | `navLabels.editions` object field + `editions` default in `initialValue.navLabels` | ✓ VERIFIED | Lines 69-73 (initialValue), 158-166 (field def) — mirrors `about`/`contact` exactly, no `.required()`. |
| `src/lib/sanity.ts` | `SiteSettings.navLabels.editions?: Partial<LocaleString>` | ✓ VERIFIED | Line 61. |
| `src/lib/site-config.ts` | `editionsLabel` key in `resolveSiteCopy()` return | ✓ VERIFIED | Line 23, single-fallback-string form matching `contactLabel`. |
| `src/components/SiteHeader.astro` | `editionsLabel`/`editionsHref` props + Éditions `<a>` rendered first; mobile CSS re-measured | ⚠️ PARTIAL | Props/markup present and correctly ordered (lines 22-23, 39-40, 63). Mobile CSS was NOT actually re-measured sufficiently — see Truth #5 gap; the 360px-374px range was never tested and wraps. |
| `src/layouts/BaseLayout.astro` | `editionsLabel`/`editionsHref` consts + prop pass to `<SiteHeader>` | ✓ VERIFIED | Lines 110-111, 194-195. |
| `src/components/HomeCarousel.astro` | `SiteCopy.editionsLabel` + consts + prop pass; `galleries` untouched | ✓ VERIFIED | Lines 40, 72-73, 124-125; carousel/grid markup and data unchanged. |
| `tests/e2e/site-header.spec.ts` | 4-link Éditions-first contract + homepage-editions-free guard + narrow-viewport no-overflow | ⚠️ PARTIAL | 27/27 assertions pass as written, but the narrow-viewport coverage has a blind spot (320px and 393px only) that misses the real 360px-374px wrap regression — the artifact under-delivers on its own stated purpose ("no horizontal page overflow... in both variants") because the actual defect is a vertical wrap, not horizontal overflow, and no width inside the broken range is tested. |
| `tests/unit/site-config.test.ts` | `editionsLabel` fallback + override assertions | ✓ VERIFIED | 8/8 unit tests pass, executed directly by this verification. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `resolveSiteCopy()` return | Each call site's `siteCopy`/consts | `siteCopy.editionsLabel` | ✓ WIRED | Both `BaseLayout.astro` and `HomeCarousel.astro` read `siteCopy.editionsLabel`. |
| Call-site consts | `<SiteHeader>` props | `editionsLabel={editionsLabel} editionsHref={editionsHref}` | ✓ WIRED | Confirmed at both call sites; build output renders the link on every page type (home, about, contact, gallery-detail, legal, editions). |
| `getRelativeLocaleUrl(locale, 'editions')` | Phase 12's `/editions/` (fr) / `/en/editions/` (en) routes | Direct href | ✓ WIRED | `dist/editions/index.html` and `dist/en/editions/index.html` exist and are the href targets. |
| `@media` breakpoints | Single-row fit at all widths <768px | CSS cascade (767px block → 359px block) | ✗ NOT WIRED (gap) | A real gap exists between the two `@media` blocks: 360px-374px falls under the 767px block's `flex-wrap: wrap` with no override, and the header visibly wraps there. |

### Data-Flow Trace (Level 4)

`editionsLabel` traces from `getSiteSettings()` (build-time GROQ fetch, `src/lib/sanity.ts`) → `resolveSiteCopy(siteSettings, locale)` → page frontmatter spread (`src/pages/index.astro`, `src/pages/en/index.astro` both do `...resolveSiteCopy(siteSettings, locale)`) / `BaseLayout.astro`'s own `resolveSiteCopy` call → `<SiteHeader>` prop → rendered `<a>` text. No hardcoded empty/static fallback masking real data — the fallback (`'Éditions'`) is an intentional, documented default per SC #4, not a stub. ✓ FLOWING.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Unit: `editionsLabel` fallback/override | `npm run test:unit -- site-config` | 8/8 passed | ✓ PASS |
| Build succeeds with new types/props | `npm run build` | 25 pages built, no errors | ✓ PASS |
| e2e: full `site-header.spec.ts` suite | `npx playwright test tests/e2e/site-header.spec.ts` | 27/27 passed | ✓ PASS |
| e2e: homepage regression guard | `npx playwright test tests/e2e/homepage.spec.ts` | 44/44 passed | ✓ PASS |
| Header wrap at 360px-374px (this verification's own probe, not in the phase's test suite) | Playwright `getBoundingClientRect()` comparison of `.site-nav` vs `.language-switcher` top position across a width sweep | Switcher wraps to a new row at 360-374px on both `/about/` and `/`; screenshot confirms visually | ✗ FAIL — this is the Truth #5 gap |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| EDN-01 | 13-01-PLAN.md | Visitor can discover an "Éditions" section via a new top-level main-nav entry (not surfaced on the homepage carousel/grid) | ⚠️ PARTIALLY SATISFIED | Discoverability itself (link present, first, correct href, editable label, homepage carousel/grid untouched) is fully verified. The nav-entry's cross-device robustness — an implicit part of "discover... on every page" for a visitor on a common ~360-375px phone — is not met: the header visibly breaks (2-row wrap) at those widths. |

No orphaned requirements: REQUIREMENTS.md maps only EDN-01 to Phase 13, and the plan's frontmatter `requirements: [EDN-01]` matches exactly.

**Documentation note (non-blocking):** REQUIREMENTS.md still lists EDN-01 with an unchecked `- [ ]` box and the Traceability table still says "Pending" (line 205), even though ROADMAP.md and the SUMMARY both mark Phase 13 complete and EDN-02..EDN-07/CMS-04 (Phases 11-12) already have their checkboxes flipped to `[x]`. This is a bookkeeping gap in REQUIREMENTS.md, not a functional one — flagged for hygiene, not counted against the phase score.

### Anti-Patterns Found

None. Grepped all 8 phase-modified files for `TBD|FIXME|XXX|TODO|HACK|PLACEHOLDER` and "coming soon"/"not yet implemented"/"not available" — zero matches. No stub returns, no hardcoded-empty props flowing to render, no debt markers.

### Code Review Cross-Reference

`13-REVIEW.md` (already run) found 2 warnings + 1 info, none of which is a BLOCKER and none of which is the mobile-wrap gap found here (the review did not test intermediate viewport widths):
- WR-01: pre-existing (not introduced by this phase) validation trap on hidden legacy `navLabels.home`/`galleries` fields.
- WR-02: `sanity/editorial/checks.ts`'s content-completeness checklist wasn't updated to include the new `navLabels.editions` field (a real omission, but a CMS-editorial-dashboard gap, not a visitor-facing one).
- IN-01: e2e coverage for the Éditions link stops at home/about/contact — gallery-detail/legal pages untested by the *phase's own* e2e suite. This verification independently confirmed via built HTML that the link is present and correct on `/galleries/silos/`, `/mentions-legales/`, and `/editions/` themselves, so the underlying behavior is fine — only the phase's own test suite has this coverage gap.

## Gaps Summary

Four of five must-have truths are solidly verified with direct evidence (build output, passing unit tests I re-ran myself, passing e2e tests I re-ran myself) — the Éditions link is genuinely wired, correctly ordered, correctly localized, Sanity-editable, and the homepage carousel/grid genuinely stay photography-only. The phase's core deliverable works.

The one failing truth is real, not a nitpick: at the very common ~360px-375px mobile width band (this includes the iPhone SE, which the plan's own Task 3 human-check explicitly named as a target device), the shared header wraps to a second row — the language switcher separates from the nav row — on both header variants. This is a genuine regression introduced by adding the 4th nav link, confirmed by directly comparing rendered output against a worktree checkout of the pre-Phase-13 commit at the identical width. The phase's added automated tests (320px, 393px) happen to bracket this broken range without ever landing inside it, so CI is green while the visual bug ships. The SUMMARY's claim that a live screenshot at "320px and 375px" confirmed single-row fit in both variants is directly contradicted by this verification's own reproduction at 375px.

This looks intentional to fix, not to accept as-is — recommend closing with a small follow-up plan that either lowers/extends the existing `@media (max-width: 359px)` breakpoint (e.g. to 380px or 400px) or adds an intermediate breakpoint covering 360px-379px, plus a regression e2e assertion at 375px checking that `.site-nav` and `.language-switcher` share the same row (not just that there's no horizontal scrollWidth overflow).

If the team judges the visual regression acceptable to ship as-is (e.g., if it's decided that the switcher wrapping to its own line at 360-374px is tolerable / already how it looks on other pages), this can be closed via a VERIFICATION.md override rather than a new plan — see `<override_suggestion>` below.

**This looks intentional to override, if the team decides the wrap is acceptable.** To accept this deviation instead of fixing it, add to VERIFICATION.md frontmatter:

```yaml
overrides:
  - must_have: "The header carrying its now-4th nav link produces no horizontal page overflow from the widest viewport down to <359px, in both the solid and transparent variants (D-02, SC #5)"
    reason: "Language switcher wrapping to its own row at 360px-374px is acceptable — no clipping/overlap occurs, only an extra line"
    accepted_by: "{name}"
    accepted_at: "{ISO timestamp}"
```

---

_Verified: 2026-07-23T07:02:14Z_
_Verifier: Claude (gsd-verifier)_
