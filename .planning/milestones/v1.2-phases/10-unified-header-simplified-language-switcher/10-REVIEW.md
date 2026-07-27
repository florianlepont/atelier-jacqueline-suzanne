---
phase: 10-unified-header-simplified-language-switcher
reviewed: 2026-07-20T00:00:00Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - src/components/SiteHeader.astro
  - src/layouts/BaseLayout.astro
  - src/components/HomeCarousel.astro
  - src/components/LanguageSwitcher.astro
  - src/pages/galleries/[slug].astro
  - src/pages/en/galleries/[slug].astro
  - tests/e2e/site-header.spec.ts
  - tests/e2e/homepage.spec.ts
  - tests/e2e/i18n.spec.ts
findings:
  critical: 0
  warning: 1
  info: 1
  total: 2
status: issues_found
---

# Phase 10: Code Review Report

**Reviewed:** 2026-07-20
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

This is a re-review of Phase 10's final state, after Plan 04's gap-closure commit (`1e35694`, removing the duplicate gallery-detail back-home link) landed on top of Plans 01–03. A prior review pass (`10-REVIEW.md`, dated 2026-07-17, superseded by this one) caught and got fixed a Critical tap-target regression (`.nav-link` losing its 44px floor, see commit `f669ab1`) plus two test-coverage gaps (mode-toggle-absence guard, gallery-detail 393px overflow guard). Both are confirmed fixed here: `SiteHeader.astro`'s `.nav-link` now carries `display:inline-flex`/`min-height`/`padding`, and `tests/e2e/site-header.spec.ts` now has both the mode-toggle-absence describe block and `/galleries/silos/` in its 393px loop. Not re-reported below.

Verified in this pass: `npm run lint` clean, `npx astro check` 0 errors/0 warnings (6 pre-existing hints unrelated to this phase), and the full relevant e2e surface (`site-header.spec.ts`, `homepage.spec.ts`, `i18n.spec.ts`, `gallery.spec.ts` — 61 tests) green under `--project=chromium`. The Plan 04 removal in both `src/pages/galleries/[slug].astro` and `src/pages/en/galleries/[slug].astro` is clean: no leftover `hero-back`/`backHref`/`getRelativeLocaleUrl` references and no orphaned CSS blocks in either locale file. All cross-component `:global()` CSS wrapping in `HomeCarousel.astro` (targeting `SiteHeader.astro`/`LanguageSwitcher.astro`-owned selectors — `.site-header--transparent`, `.logo-mark*`, `.switcher-link`) is applied consistently and correctly, and no stale `.home-header`/`.home-nav`/`.switcher-separator` selectors remain anywhere in `src/` or `tests/` (only historical comments reference the old names).

One real, pre-existing-but-newly-amplified accessibility defect was found and confirmed empirically via Playwright accessible-name assertions: `SiteHeader.astro`'s Instagram link's `aria-label` silently discards its own `.sr-only` "opens in new tab" hint for every assistive-technology user, on every page. This bug predates Phase 10 (it existed in `HomeCarousel.astro`'s homepage-only Instagram link before this phase — confirmed via `git show` against the pre-Plan-01 commit), but Phase 10's own consolidation moved it verbatim into the now-shared `SiteHeader.astro`, quadrupling its blast radius (homepage → homepage + About + Contact + every gallery-detail page, both locales). No existing test catches it because every assertion checks only a name *substring* ("Instagram"), never the full accessible name.

## Warnings

### WR-01: Instagram link's `aria-label` overrides accessible-name computation, permanently discarding the "(opens in new tab)" sr-only hint for screen-reader users — now shipped site-wide, not just on the homepage

**File:** `src/components/SiteHeader.astro:60-81`
**Issue:**
The Instagram nav link sets both an `aria-label` (line 65) *and* a visually-hidden `<span class="sr-only">{instagramNewTabHint}</span>` (line 80) inside the same `<a>`:
```astro
<a
  href={instagramUrl}
  target="_blank"
  rel="noopener noreferrer"
  class="nav-link"
  aria-label={`Instagram ${instagramLabel}`}
>
  <svg aria-hidden="true">...</svg>
  <span class="sr-only">{instagramNewTabHint}</span>
</a>
```
Per the standard accessible-name-computation algorithm, when an element carries a non-empty `aria-label`, that attribute's value becomes the *entire* accessible name — the element's content (including hidden/`sr-only` descendants) is never consulted. Confirmed empirically against the built app:

- `header.getByRole('link', { name: 'Instagram @ajs_romanelepont', exact: true })` resolves to exactly 1 element on `/about/` — the accessible name is *only* `"Instagram @ajs_romanelepont"`, with no trailing hint text at all.
- By contrast, `LanguageSwitcher.astro`'s equivalent link (no `aria-label`; name computed from content) *does* expose its hint: `header.getByRole('link', { name: 'EN Passer en anglais', exact: true })` also resolves to exactly 1 element — proving the content-based naming path works correctly there, which is exactly why the Instagram link's `aria-label`-based path is the anomaly.

So `instagramNewTabHint` (`"(opens in new tab)"` / `"(nouvelle fenêtre)"`) is fully inert for every screen-reader user: it renders in the DOM with a correct locale-conditional value, and is exercised by `tests/e2e/homepage.spec.ts`'s `'the sr-only new-tab hint is locale-conditional'` test — but that test only reads `textContent` via `.evaluate()`, never the computed accessible name, so it cannot and does not catch this.

This exact pattern pre-dates Phase 10 (verified identically present in `HomeCarousel.astro`'s pre-refactor, homepage-only Instagram link at commit `9e12214`). Phase 10 Plan 01 moved it "verbatim" into the new shared `SiteHeader.astro` per its own stated intent — but that verbatim move means the defect now ships on `/about/`, `/en/about/`, `/contact/`, `/en/contact/`, and every `/galleries/{slug}/` page too, not just `/`. Given this phase's explicit purpose of consolidating and re-verifying header accessibility, and that the review brief specifically called out "accessible names on ... the Instagram link" for scrutiny, this is flagged as a Warning rather than left as a pre-existing footnote.

**Fix:** Fold the hint directly into the single source of accessible-name truth (the `aria-label`), and drop the now-redundant `sr-only` span:
```astro
<a
  href={instagramUrl}
  target="_blank"
  rel="noopener noreferrer"
  class="nav-link"
  aria-label={`Instagram ${instagramLabel}${instagramNewTabHint}`}
>
  <svg aria-hidden="true">...</svg>
</a>
```
(`instagramNewTabHint` already carries its own leading space/parenthesis formatting, e.g. `' (opens in new tab)'`, so it concatenates cleanly onto the label.) Follow up with a test asserting the *full* accessible name (`getByRole('link', { name: <exact string>, exact: true })`), not just a substring, so this class of regression can't silently reappear.

## Info

### IN-01: `instagramNewTabHint` and the logo `assetBase`/path computation are duplicated verbatim between `BaseLayout.astro` and `HomeCarousel.astro`

**File:** `src/layouts/BaseLayout.astro:115,128-130`, `src/components/HomeCarousel.astro:74,88-90`
**Issue:** Both files independently declare the identical locale-conditional `instagramNewTabHint` ternary and the identical `assetBase`/`logoBlackSrc`/`logoWhiteSrc` derivation, then pass the results into the same `<SiteHeader>` component as props. This is a deliberate, commented architectural choice (`SiteHeader.astro` must stay a pure presentational component, so callers compute their own copies rather than the component importing shared config directly) — not a bug today; both call sites are verified identical. But it is duplicated logic with no single source of truth: a future edit to one ternary (e.g. adding a locale, or changing the hint copy) without the matching edit to the other would silently desync the two call sites, and nothing currently compares the two computed values against each other (only against their own page's rendered DOM).
**Fix:** Extract both into a shared, pure helper (e.g. in `src/lib/site-config.ts`) — `getInstagramNewTabHint(locale)` and `getLogoAssetPaths()` — so `BaseLayout.astro` and `HomeCarousel.astro` both call the same function instead of maintaining parallel copies.

---

_Reviewed: 2026-07-20_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
