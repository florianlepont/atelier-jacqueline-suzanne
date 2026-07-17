---
phase: 10-unified-header-simplified-language-switcher
reviewed: 2026-07-17T00:00:00Z
depth: deep
files_reviewed: 7
files_reviewed_list:
  - src/components/SiteHeader.astro
  - src/layouts/BaseLayout.astro
  - src/components/HomeCarousel.astro
  - src/components/LanguageSwitcher.astro
  - tests/e2e/homepage.spec.ts
  - tests/e2e/i18n.spec.ts
  - tests/e2e/site-header.spec.ts
findings:
  critical: 1
  warning: 2
  info: 1
  total: 4
status: issues_found
---

# Phase 10: Code Review Report

**Reviewed:** 2026-07-17
**Depth:** deep
**Files Reviewed:** 7 (full phase diff: `src/components/SiteHeader.astro` (new), `src/layouts/BaseLayout.astro`, `src/components/HomeCarousel.astro`, `src/components/LanguageSwitcher.astro`, plus the three touched e2e spec files)
**Status:** issues_found

## Summary

Scope note: the diff range explicitly supplied in the task (`5b77e0d..HEAD`) only covers Plans 10-02/10-03 (homepage `SiteHeader` wiring + `LanguageSwitcher` simplification) — it excludes `SiteHeader.astro`'s creation and `BaseLayout.astro`'s rewiring, which happened in Plan 10-01, one commit range earlier. Since the task explicitly names `SiteHeader.astro` (new) and `BaseLayout.astro` as review targets, this review widened the diff base to `9e12214` (the commit immediately before Plan 10-01's first commit) so all three plans are actually covered, per the task's own description.

All 61 relevant e2e tests (`site-header.spec.ts`, `homepage.spec.ts`, `i18n.spec.ts`, `legal.spec.ts`) pass, and `npm run build` succeeds. The extraction itself is faithful: markup/CSS were moved (not duplicated), `.home-*` selectors were fully retired with no dead references left in `src/` or `tests/`, `is:global` scoping is applied correctly and deliberately (matches the pre-existing `BaseLayout` convention, verified no unintended selector collisions), and the `LanguageSwitcher` simplification correctly preserves the accessible-name substring contract (`getByRole('link', {name: 'EN'|'FR'})` still resolves) and the cookie-write script byte-for-byte.

However, one concrete accessibility regression was found and confirmed via live `boundingBox()` measurement (not just static reading): the unified `.nav-link` class dropped the 44px tap-target floor that the homepage's Instagram link had *before* this phase (via the old `.home-nav-link, .home-toggle` shared rule), and the phase's own `10-UI-SPEC.md` explicitly requires `<SiteHeader>`'s Instagram link to "keep this floor." It doesn't, on any page, in the shipped code. Two test-coverage gaps were also found relative to what the plans' own `must_haves`/Pitfall sections scoped.

## Critical Issues

### CR-01: Nav-link tap targets (Instagram link explicitly, plus About/Contact) fall below the 44px floor the phase's own spec requires — a real regression from pre-phase-10 behavior

**File:** `src/components/SiteHeader.astro:246-251` (consumed everywhere via `is:global`)
**Issue:**
Before this phase, the homepage's Instagram link rendered via `.home-nav-link` (shared with `.home-toggle`), which declared `padding: var(--space-xs) var(--space-sm)` (4px/8px) and `min-height: var(--tap-target-min)` (44px) — a WCAG 2.5.5-compliant tap target, matching the project's own `--tap-target-min` convention already enforced for the mode-toggle and the switcher link.

Plan `10-01`'s Task 2 instructed copying BaseLayout's original `.nav-link` rule "verbatim" into `SiteHeader.astro` — but BaseLayout's `.nav-link` (used historically only for text-only About/Contact links, which never carried Instagram) has **no** padding and **no** `min-height` at all:
```css
.nav-link {
  font-size: 14px;
  font-weight: var(--weight-regular);
  line-height: 1.5;
  text-decoration: none;
}
```
Since D-03 now routes the Instagram icon link through this same `.nav-link` class on every page (About/Contact/gallery-detail *and* the homepage), the Instagram link's clickable area shrank across the board. Live-measured via Playwright `boundingBox()` against the actual built site:

```
About page  → About link:      { width: 58.3, height: 25 }
About page  → Instagram link:  { width: 20,   height: 25 }
Homepage    → Instagram link:  { width: 20,   height: 25 }
```

20×25px is well under the 44×44px floor. This directly contradicts `10-UI-SPEC.md`'s own explicit requirement ("`--tap-target-min` (44px) ... `<SiteHeader>`'s Instagram link, the mode-toggle's outer hit-box, and the simplified switcher's single remaining link must all keep this floor — none of that changes in this phase"). The mode-toggle and switcher-link correctly retained their 44px floors (verified) — only the nav-link/Instagram-link path regressed. No existing or new test in this phase (`site-header.spec.ts`, `homepage.spec.ts`) asserts tap-target size, so nothing caught this before it shipped.

Note: the plain About/Contact text links never had a 44px floor even before this phase (pre-existing gap, out of this phase's scope to fix). What's new and in-scope here is the Instagram *icon* link, which used to be compliant on the homepage and is not compliant anywhere after this phase — and the phase's own spec explicitly promised it would remain compliant.

**Fix:** Give `.nav-link` (or a dedicated modifier applied only to the icon-only Instagram link) the same tap-target treatment the toggle/switcher already have:
```css
.nav-link {
  display: inline-flex;
  align-items: center;
  min-height: var(--tap-target-min);
  padding: var(--space-xs) var(--space-sm);
  font-size: 14px;
  font-weight: var(--weight-regular);
  line-height: 1.5;
  text-decoration: none;
}
```
(Re-verify the 393px mobile pixel budget after this change — the extra padding on 3 nav-links may require re-tuning the existing mobile `@media` trims in `SiteHeader.astro`.)

## Warnings

### WR-01: No test asserts the mode-toggle is absent on About/Contact/gallery-detail (D-04's explicit "must not appear elsewhere" requirement)

**File:** `tests/e2e/site-header.spec.ts` (missing coverage)
**Issue:** `10-02-PLAN.md`'s `must_haves.truths` explicitly states: "The carousel/grid mode-toggle renders inside SiteHeader's extra slot on the homepage only ... and does NOT appear on About/Contact." The implementation is correct (verified: `grep -c "mode-toggle" dist/about/index.html dist/contact/index.html` → `0` for both), but no e2e assertion in `site-header.spec.ts` or elsewhere locks this in as a regression guard. A future change that accidentally threads the toggle through `BaseLayout` (or duplicates `SiteHeader`'s slot content) would ship silently.
**Fix:** Add to `tests/e2e/site-header.spec.ts`:
```ts
test('the mode-toggle does not render on /about/ or /contact/', async ({ page }) => {
  for (const path of ['/about/', '/contact/']) {
    await page.goto(path);
    await expect(page.locator('[data-role="mode-toggle"]')).toHaveCount(0);
  }
});
```

### WR-02: Mobile 393px no-overflow guard covers /about/ and /contact/ but not /galleries/[slug]/, despite Pitfall 1 explicitly scoping "About/Contact/gallery-detail"

**File:** `tests/e2e/site-header.spec.ts:46-59`
**Issue:** `10-01-PLAN.md`'s Pitfall 1 and the plan's own `must_haves` frame the mobile-fit risk as applying to "About/Contact/gallery-detail" (gallery-detail pages also render `<SiteHeader variant="transparent">` via `BaseLayout`, and now also carry the Instagram link for the first time). `site-header.spec.ts`'s "mobile fit at 393px" describe block only iterates `['/about/', '/contact/']`, omitting gallery-detail pages entirely. Manually verified the current implementation does NOT overflow at 393px on `/galleries/silos/` (`scrollWidth === innerWidth === 393`), so this is a coverage gap, not a live bug — but it's an untested regression surface for a page type the plan explicitly called out.
**Fix:** Extend the loop in the existing test to include a gallery-detail path, e.g. `['/about/', '/contact/', '/galleries/silos/']`.

## Info

### IN-01: Stale comment referencing `.nav-link`'s removed `display:inline-flex` alignment behavior

**File:** `src/components/HomeCarousel.astro:790-793`
**Issue:** The comment on `.home-toggle` reads: `/* matches .nav-link/.switcher-link so text baselines line up across the whole header ... */`. Prior to this phase, `.home-nav-link` (the homepage's own nav-link equivalent) did declare `display: inline-flex; align-items: center;`, so the comment was accurate at the time it was likely written. The now-unified `.nav-link` (`SiteHeader.astro`) has neither `display: inline-flex` nor `align-items: center` — it's a plain inline anchor. The comment's baseline-matching claim is now only true incidentally (via `.site-nav`'s own `display:flex` making its direct children flex items), not because of anything declared on `.nav-link` itself. Low-value but slightly misleading for a future maintainer debugging alignment.
**Fix:** Update or remove the comment to reflect the current mechanism (alignment now comes from `.site-nav`'s `display:flex`, not from `.nav-link` itself).

---

_Reviewed: 2026-07-17_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_
