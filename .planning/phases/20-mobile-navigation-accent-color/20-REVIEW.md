---
phase: 20-mobile-navigation-accent-color
reviewed: 2026-08-04T00:00:00Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - sanity/schemas/HeroColorInput.tsx
  - src/components/HomeCarousel.astro
  - src/components/MobileNavPanel.astro
  - src/components/SiteHeader.astro
  - src/layouts/BaseLayout.astro
  - src/lib/home-carousel.ts
  - src/lib/site-config.ts
  - tests/e2e/accessibility.spec.ts
  - tests/e2e/critical.smoke.spec.ts
  - tests/e2e/homepage-accent-random.spec.ts
  - tests/e2e/homepage-chrome-nav.spec.ts
  - tests/e2e/homepage-mobile-responsive.spec.ts
  - tests/e2e/mobile-nav.spec.ts
  - tests/e2e/site-header.spec.ts
  - tests/unit/home-carousel.test.ts
  - tests/unit/site-config.test.ts
findings:
  critical: 0
  warning: 3
  info: 2
  total: 5
status: issues_found
---

# Phase 20: Code Review Report

**Reviewed:** 2026-08-04T00:00:00Z
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues_found

## Summary

Reviewed the mobile-navigation (`MobileNavPanel.astro`/`SiteHeader.astro`) and homepage accent-color-randomization (`HomeCarousel.astro`/`home-carousel.ts`/`site-config.ts`) implementation, plus the orchestrator-applied WCAG contrast fix (`#AF3DFF` → `#A73AF4`) and its test/e2e coverage.

**Accessibility fix verification:** the nudged purple hex (`#A73AF4`) is applied consistently everywhere it matters in the live source tree — `src/lib/site-config.ts` (`HERO_COLORS.purple`), `src/layouts/BaseLayout.astro` (`--palette-purple`), `sanity/schemas/HeroColorInput.tsx` (`HERO_COLOR_OPTIONS`), and `tests/unit/site-config.test.ts`. I independently recomputed the WCAG relative-luminance contrast for `#A73AF4` against white (~4.61:1) and confirmed it clears the 4.5:1 AA threshold and matches `getHeroTextColor`'s own white/ink decision. No stray `#AF3DFF` references remain in the working tree outside of unrelated, out-of-scope planning/sketch artifacts and an unrelated concurrent worktree under `.claude/worktrees/`.

**Dialog/script orchestration:** `MobileNavPanel.astro`'s open/close state machine (native `<dialog>` + `cancel`/`transitionend`/fallback-timer) is well-guarded against double-invocation and missing-transition deadlock. `HomeCarousel.astro`'s inline script is large but the forward-references to `const`s declared later in the same script (`hoverCapable`, `heroPhoto`, etc.) are all safe because every call site is itself deferred (event listener, `setInterval`, or the single `render()` call at the very end) — none of them execute during the script's initial synchronous top-to-bottom pass.

No BLOCKER-level defects were found. Three WARNING-level issues and two INFO-level items are listed below.

## Warnings

### WR-01: `normalizeHeroColor` uses `in`, which matches inherited `Object.prototype` keys

**File:** `src/lib/site-config.ts:56`
**Issue:** `normalizeHeroColor` is implemented as:
```ts
export function normalizeHeroColor(value?: string): string | undefined {
  return value && value in HERO_COLORS ? HERO_COLORS[value as keyof typeof HERO_COLORS] : undefined
}
```
`HERO_COLORS` is a plain object literal, so `value in HERO_COLORS` is true not only for `'pink'|'purple'|'teal'|'lime'|'plum'` but also for any inherited `Object.prototype` property name (`'constructor'`, `'toString'`, `'hasOwnProperty'`, `'valueOf'`, `'__proto__'`, etc.). If a gallery document's `heroColor` field is ever set to one of these strings — the project's own comments elsewhere (`src/layouts/BaseLayout.astro:68-72`, `src/pages/index.astro:48-50`) explicitly acknowledge that Sanity documents can be written outside Studio's dropdown-restricted publish-time validation (e.g. a seed/import script writing the field directly) — `normalizeHeroColor` returns a **function reference** (e.g. `Object.prototype.constructor`) instead of `undefined`. That value then flows into `getHeroTextColor`, into `--tile-accent`/`--current-accent` inline style properties, and into `data-hero-color` attributes in `HomeCarousel.astro` and `src/pages/index.astro`/`src/pages/en/index.astro`, producing broken/garbage rendered CSS and markup instead of the intended safe fallback.

**Fix:**
```ts
export function normalizeHeroColor(value?: string): string | undefined {
  return value && Object.prototype.hasOwnProperty.call(HERO_COLORS, value)
    ? HERO_COLORS[value as keyof typeof HERO_COLORS]
    : undefined
}
```

### WR-02: Focus is sent to a hidden (`display:none`) toggle button when the mobile-nav panel auto-closes on breakpoint crossing

**File:** `src/components/MobileNavPanel.astro:200-211`
**Issue:** When the viewport crosses from phone width to desktop width while the panel is open, the `phoneQuery` `change` listener calls `finishClose()` directly:
```js
phoneQuery.addEventListener('change', () => {
  if (!phoneQuery.matches && panel!.open) finishClose();
});
```
`finishClose()` calls `panel!.close()`, which fires the `'close'` event, whose handler unconditionally calls `toggle!.focus()`. At this point the hamburger `<button data-role="mobile-nav-toggle">` is already `display: none` (SiteHeader.astro's `@media (max-width: 767px) { .mobile-nav__toggle { display: inline-flex; } }` — it is `display: none` at every wider width, and by the time this listener fires the media query has already flipped). Calling `.focus()` on a non-rendered element is a no-op, so focus is left on `document.body` with no visible focus indicator anywhere in the document — a keyboard user resizing/rotating across the breakpoint loses their place entirely, rather than landing on a sensible fallback (e.g. the logo link, or simply not attempting the no-op focus call). This code path is exercised by `tests/e2e/mobile-nav.spec.ts`'s "crossing to a desktop viewport closes an open panel" test, but that test only asserts the dialog is hidden and `aria-expanded` is `'false'` — it never asserts where focus lands, so this regression is untested and currently silent.

**Fix:** Guard the focus call, e.g.:
```js
panel.addEventListener('close', () => {
  toggle!.setAttribute('aria-expanded', 'false');
  panel!.classList.remove('is-closing');
  closing = false;
  if (toggle!.offsetParent !== null) toggle!.focus();
});
```
(or focus a guaranteed-visible fallback, such as the header's logo link, when the toggle itself isn't focusable).

### WR-03: Non-deterministic (flaky-by-construction) accent-distinctness assertion

**File:** `tests/e2e/homepage-accent-random.spec.ts:65-80`
**Issue:** The "never leaves the existing five-value palette" test reloads the page 6 times using the **real, unmocked** `Math.random` and then asserts:
```js
test.skip(entries.length < 2, '...');
expect(observed.size).toBeGreaterThanOrEqual(2);
```
With `count` galleries (drawn via `pickRandomGalleryIndex`), the probability that all 6 reloads land on the same gallery is `(1/count)^5`. For a 2-gallery homepage (plausible at this project's current stage — only a `silos` gallery slug appears anywhere else in the e2e suite) that is `(0.5)^5 ≈ 3.1%` per CI run — a real, non-negligible flake rate for a suite that presumably runs on every push. This is a quality/reliability issue rather than a functional defect in the shipped code.

**Fix:** Either seed/mock `Math.random` deterministically per reload (as the other tests in this same file already do via `page.addInitScript`) and assert on the mocked sequence, or accept the small flake risk explicitly by retrying/relaxing the assertion (e.g. requiring distinctness across a larger sample, or asserting only that the observed set is a subset of the palette and dropping the "at least 2 distinct" requirement, which the two upstream forced-random-value tests already cover deterministically).

## Info

### IN-01: Duplicate `aria-label` on the `<dialog>` and its child `<nav>`

**File:** `src/components/MobileNavPanel.astro:62,86`
**Issue:** Both the top-level `<dialog id="mobile-nav" aria-label={menuLabel}>` and its child `<nav class="mobile-nav-panel__nav" aria-label={menuLabel}>` are labeled `"Menu"`. Screen readers that expose the dialog as a landmark and then descend into the nested `<nav>` landmark will announce two same-named "Menu" regions in the same modal, which is mildly confusing.
**Fix:** Give the dialog a distinct label (e.g. the site title, or drop the dialog-level `aria-label` and let the panel be labeled purely by its heading/nav), keeping only the `<nav>`'s "Menu" label.

### IN-02: Magic hard-coded ink luminance constant duplicates a derivable value

**File:** `src/lib/site-config.ts:71`
**Issue:** `getHeroTextColor` hardcodes `contrastWithInk = (luminance + 0.05) / (0.0103 + 0.05)`, where `0.0103` is the pre-computed relative luminance of `#1A1A1A` (the `--color-ink` design token defined separately in `BaseLayout.astro`). If `--color-ink` is ever changed, this function's threshold silently drifts out of sync with the actual ink color used everywhere else, with no compiler or test signal tying the two together (the existing unit tests only assert specific color outputs, not the underlying luminance constant).
**Fix:** Either compute the ink luminance from a shared `'#1A1A1A'` constant (defined once and reused), or add a comment/test that fails loudly if `--color-ink` and this hardcoded luminance ever diverge.

---

_Reviewed: 2026-08-04T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
