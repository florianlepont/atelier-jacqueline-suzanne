# Phase 20: Mobile Navigation & Accent Color - Pattern Map

**Mapped:** 2026-08-03
**Files analyzed:** 6 (modified) + 1 new unit-test target
**Analogs found:** 6 / 6

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `src/components/SiteHeader.astro` (modify: add opt-in `mobileNav` prop + `<dialog>` panel) | component (header/nav) | request-response (build-time render) + event-driven (client open/close) | `src/components/Lightbox.astro` (dialog/modal mechanics) + `src/components/PageTitleHeader.astro` (halftone texture) | exact (dialog pattern), role-match (halftone) |
| `src/components/LanguageSwitcher.astro` (modify: scoped restyle only, no logic change) | component | request-response | itself (existing) — only the CONSUMER (`SiteHeader.astro`) needs a `:global()` override, per `19-PATTERNS.md`'s documented fix shape | exact (self, no new analog needed) |
| `src/components/HomeCarousel.astro` (modify: pass `mobileNav={true}` to `<SiteHeader>`; add post-`render()` accent override in inline `<script>`) | component (page section) + event-driven client script | CRUD-like DOM update (accent override), event-driven (existing carousel) | itself (existing `render()`/`ACCENTS`/`carouselIndex` machinery) | exact |
| `src/lib/home-carousel.ts` (modify: add `pickRandomGalleryIndex()`) | utility | transform (pure function) | `computeHoverZone()` / `detectSwipeDirection()` in the same file | exact |
| `tests/unit/home-carousel.test.ts` (modify: add cases for `pickRandomGalleryIndex()`) | test | transform | existing test cases for `computeHoverZone`/`detectSwipeDirection` in same file | exact |
| `tests/e2e/site-header.spec.ts` (modify) or new `tests/e2e/mobile-nav.spec.ts` | test | request-response / event-driven (Playwright) | `tests/e2e/site-header.spec.ts` (existing describe-block shape) | exact |
| `tests/e2e/accessibility.spec.ts` (modify: add mobile-viewport + dialog-open axe pass) | test | event-driven | itself (existing per-path axe loop) | exact |

## Pattern Assignments

### `src/components/SiteHeader.astro` (component, mixed request-response + event-driven)

**Analogs:** `src/components/Lightbox.astro` (dialog mechanics), `src/components/PageTitleHeader.astro` (halftone texture), `src/components/HomeCarousel.astro`'s `.home-toggle__morph` (icon-morph *principle*, not literal markup)

**Current header markup to extend** (`src/components/SiteHeader.astro` lines 53-95):
```astro
<header class:list={['chrome-band', 'site-header', `site-header--${variant}`]} data-role="site-header">
  <a href={homeHref} class="logo-mark" aria-label={siteTitle}>
    <span class="logo-mark__chip" aria-hidden="true"></span>
    <img src={logoBlackSrc} alt="" class="logo-mark__img logo-mark__img--default" />
    <img src={logoWhiteSrc} alt="" class="logo-mark__img logo-mark__img--hover" />
  </a>
  <nav class="site-nav" aria-label="Primary">
    <a href={editionsHref} class="nav-link">{editionsLabel}</a>
    <a href={aboutHref} class="nav-link">{aboutLabel}</a>
    <a href={contactHref} class="nav-link">{contactLabel}</a>
    <a href={instagramUrl} target="_blank" rel="noopener noreferrer" class="nav-link" aria-label={`Instagram ${instagramLabel}`}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
        <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
        <circle cx="12" cy="12" r="4.6" />
        <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
      </svg>
      <span class="sr-only">{instagramNewTabHint}</span>
    </a>
  </nav>
  <slot name="extra" />
  <LanguageSwitcher />
</header>
```
Add a new `mobileNav?: boolean` prop (default `false`/undefined). Every existing non-homepage call site (via `BaseLayout.astro`) keeps omitting it — must remain 100% inert when not passed `true` (CONTEXT.md D-01 regression-risk note). When `true`: render the hamburger button (visible only ≤767px) plus the `<dialog id="mobile-nav">` panel with duplicated logo + X-close button, big stacked primary list (Éditions/About/Contact/LanguageSwitcher), and secondary Instagram line — and hide the existing `.site-nav`/inline `<LanguageSwitcher>` at ≤767px (RESEARCH.md Open Question 2 resolution) via a selector keyed off a data attribute, e.g. `[data-mobile-nav='true'] .site-nav`, so it stays inert for every page that doesn't pass the prop.

**Dialog full-screen sizing pattern — copy verbatim shape** (`src/components/Lightbox.astro` lines 300-326):
```css
dialog#lightbox {
  padding: 0;
  border: none;
  max-width: 100vw;
  max-height: 100vh;
  width: 100vw;
  height: 100vh;
  background: rgba(26, 26, 26, 0.96);
}
dialog#lightbox[open] {
  display: flex; /* unconditional display:flex beats the UA :not([open]) rule regardless of specificity */
  align-items: center;
  justify-content: center;
}
dialog#lightbox:not([open]) {
  display: none;
}
dialog#lightbox::backdrop {
  background: rgba(26, 26, 26, 0.96);
}
```
For `dialog#mobile-nav`: same `width/height:100vw/100vh; padding:0; border:none` shape, but swap `background` to white (`--color-dominant`, per UI-SPEC Color section) instead of the lightbox's dark scrim, and use `display: flex; flex-direction: column;` for the stacked list layout.

**Open/close JS orchestration — copy shape from `closeWithMorph()`** (`src/components/Lightbox.astro` lines 88-118, 169-254):
```typescript
const dialog = document.getElementById('lightbox') as HTMLDialogElement | null;
// ...
const doOpen = () => {
  render();
  // showModal() is what gives native focus containment + Escape-to-close
  // for free — do not hand-roll either.
  dialog!.showModal();
};

function closeWithMorph() {
  const doClose = () => {
    dialog!.close();
  };
  // (Lightbox wraps doClose in a View-Transition; mobile-nav instead wraps
  // it in the CSS-close-transition sequence below — same funnel-through-one-
  // helper shape, different transition mechanism per RESEARCH.md Pattern 2.)
  doClose();
}

closeBtn?.addEventListener('click', () => closeWithMorph());

// The native `cancel` event fires on Escape and is cancelable — preventing
// it stops <dialog>'s native close so the custom close sequence can run
// dialog.close() itself.
dialog.addEventListener('cancel', (e) => {
  e.preventDefault();
  closeWithMorph();
});

// Backdrop click: only a click on the dialog's own backdrop area (not a
// descendant control) closes it.
dialog.addEventListener('click', (e) => {
  if (e.target === dialog) closeWithMorph();
});

// Return focus to the triggering element on close.
dialog.addEventListener('close', () => {
  trigger?.focus();
});
```
For mobile-nav specifically, RESEARCH.md Pattern 2 replaces the View-Transition open/close with pure-CSS `@starting-style`/`allow-discrete` for OPEN and a `.is-closing` + `transitionend` sequence for CLOSE (Safari's `allow-discrete` close-side gap) — reuse the *funnel-every-close-path-through-one-function* shape above, not the View-Transition internals.

```css
/* Open: CSS-only, cross-browser-safe (Chrome 117+, Safari 17.5+) */
dialog#mobile-nav {
  opacity: 0;
  transform: translateY(-8px);
  transition: opacity 220ms ease, transform 220ms ease, display 220ms allow-discrete, overlay 220ms allow-discrete;
}
dialog#mobile-nav[open] {
  opacity: 1;
  transform: translateY(0);
}
@starting-style {
  dialog#mobile-nav[open] {
    opacity: 0;
    transform: translateY(-8px);
  }
}
@media (prefers-reduced-motion: reduce) {
  dialog#mobile-nav {
    transition: none;
  }
}
```
```typescript
// Close: JS-driven, mirrors Lightbox.astro's closeWithMorph() funnel shape
function closeNav() {
  dialog.classList.add('is-closing');
  const done = () => {
    dialog.classList.remove('is-closing');
    dialog.close();
  };
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    done();
    return;
  }
  dialog.addEventListener('transitionend', done, { once: true });
}
dialog.addEventListener('cancel', (e) => {
  e.preventDefault();
  closeNav();
});
```

**Halftone texture — reuse exact dot-pattern values** (`src/components/PageTitleHeader.astro`, `.page-title-header__halftone`, per UI-SPEC "Interaction & Motion Contract"):
```css
background-image: radial-gradient(rgba(26, 26, 26, 0.16) 1.4px, transparent 1.6px);
background-size: 9px 9px;
```
Reuse this exact `radial-gradient`/`background-size` verbatim plus its existing drift/fade-in animation + `prefers-reduced-motion` gate; re-derive ONLY the containment/positioning geometry fresh for the dialog's own `100vw`/`100vh` box (do not port `PageTitleHeader`'s viewport-relative centering constants — see RESEARCH.md Open Question 1).

**Hamburger↔X icon morph — reuse the PRINCIPLE, not the literal markup, from `.home-toggle__morph`** (`src/components/HomeCarousel.astro` lines 153-161, 1608-1647):
```astro
<span class="home-toggle__box" aria-hidden="true">
  <span class="home-toggle__morph">
    <span class="home-toggle__morph-cell"></span>
    <!-- 6 cells total -->
  </span>
</span>
```
```css
.home-toggle__box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1.5px solid currentColor;
}
```
`.home-toggle__morph` is a CSS-grid `column-gap` morph shaped for a different glyph pair (carousel↔grid) — do NOT port this grid markup verbatim. Reuse only the underlying principle it establishes: a pure CSS `transform`-only geometry transition on static `<span>` "bar"/"cell" elements, gated behind `prefers-reduced-motion`, no JS animation loop. Build the new hamburger↔X toggle as three `<span>` bars with `transform: rotate()/translateY()` per UI-SPEC's "Interaction & Motion Contract" (~220ms, same timing as the panel transition).

**`SiteHeader.astro`'s existing mobile CSS trims — must stay inert when `mobileNav` is on** (`src/components/SiteHeader.astro` lines 301-359):
```css
@media (max-width: 767px) {
  .site-header { flex-wrap: nowrap; gap: var(--space-xs); }
  .site-nav { margin-left: 0; gap: var(--space-xs); }
  .site-nav .nav-link { padding-left: var(--space-xs); padding-right: var(--space-xs); }
}
@media (max-width: 400px) { /* further .site-nav/.language-switcher trims */ }
```
These rules currently shrink the SAME `.site-nav`/`.language-switcher` elements that remain in the DOM even when `mobileNav={true}` (per D-01's opt-in framing — elements aren't removed from markup). Per RESEARCH.md Open Question 2's resolution: when `mobileNav={true}`, hide `.site-nav` and the inline `<LanguageSwitcher />` entirely at ≤767px via a selector keyed off the new prop/data-attribute (e.g. `[data-mobile-nav='true'] .site-nav { display: none; }`), leaving these existing trim rules fully unchanged and still applying for every page that doesn't pass the prop.

---

### `src/components/LanguageSwitcher.astro` restyle inside the mobile-nav panel (component, no logic change)

**Analog:** itself + the `:global()` scope-hash fix documented in `.planning/milestones/v1.5-phases/19-site-wide-visual-polish/19-PATTERNS.md` (RESEARCH.md Pitfall 2)

**Current default styling to override, scoped** (`src/components/LanguageSwitcher.astro` lines 47-56):
```css
.switcher-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  min-height: 44px;
  padding: 8px;
  color: var(--color-accent); /* D-06: switcher links render pink everywhere else */
  text-decoration: none;
}
```
Do NOT edit this file's own `<style>` block to change `.switcher-link`'s color/size globally — that would leak the mobile-nav-panel-only Display-role/ink-color treatment (UI-SPEC Typography/Color) to every other page. Instead, in `SiteHeader.astro`'s (or a new mobile-nav-scoped) `<style is:global>` block, wrap the ENTIRE ancestor-through-target selector chain in one `:global(...)`:
```css
/* CORRECT — entire chain wrapped, matches DOM structurally */
:global(.mobile-nav-panel .switcher-link) {
  color: var(--color-ink);
  font-size: 32px;
  font-weight: 600;
  font-family: var(--font-display);
}

/* WRONG — only the ancestor half wrapped; SiteHeader's own scope-hash gets
   silently appended to .switcher-link, which can never match
   LanguageSwitcher.astro-rendered DOM */
:global(.mobile-nav-panel) .switcher-link { color: var(--color-ink); }
```
This is the exact bug shape/fix already documented in `19-PATTERNS.md` for this codebase's Astro scoped-style behavior — do not re-derive.

---

### `src/components/HomeCarousel.astro` — accent-override script addition (component + event-driven client script)

**Analog:** itself (existing `render()`/`ACCENTS`/`carouselIndex` machinery)

**Existing initial-accent + call-site to extend** (lines 116-121, 1455-1457):
```astro
<section
  class="home"
  data-display-mode="carousel"
  style={{
    '--wordmark-photo': 'none',
    '--wordmark-photo-filter': wordmarkPhotoFilter(firstGallery.heroTextColor),
    '--current-accent': firstGallery.heroColor ?? 'var(--color-accent)',
    '--current-accent-text': firstGallery.heroTextColor ?? 'var(--color-on-accent)',
  }}
>
```
```typescript
// End of inline <script>, existing initial call sequence:
render();
syncAutoplayControl();
startAutoAdvance();
```
Also pass the new prop at this component's `<SiteHeader>` call site (line 123-137): add `mobileNav={true}` (homepage-only opt-in per D-01).

**Existing per-gallery accent logic inside `render()` — DO NOT modify** (lines 387-390, 654-656, 724-725):
```typescript
// ACCENTS cycles generically via index % ACCENTS.length
const ACCENTS: Array<{ bg: string; text: string }> = [ /* ... */ ];
// ...
function render(forceCrossfade = false) {
  const gallery = galleries[carouselIndex];
  // ...
  const fallbackAccent = ACCENTS[carouselIndex % ACCENTS.length];
  const accent = gallery.heroColor
    ? { bg: gallery.heroColor, text: gallery.heroTextColor ?? 'var(--color-on-accent)' }
    : fallbackAccent;
  // ...
  root!.style.setProperty('--current-accent', accent.bg);
  root!.style.setProperty('--current-accent-text', accent.text);
}
```
**New accent-only override — insert immediately AFTER the existing `render(); syncAutoplayControl(); startAutoAdvance();` call**, per RESEARCH.md Pattern 4 (mirrors `render()`'s own accent-property-setting lines, but touches ONLY accent-related properties, never `carouselIndex`):
```typescript
import { pickRandomGalleryIndex } from '../lib/home-carousel';
// ...
render();
syncAutoplayControl();
startAutoAdvance();

// HOME-16/D-05: override ONLY the starting accent, after render() has
// already run — carouselIndex, heroImg.src, titleEl, indexLabel,
// progressDashes are all left untouched, so gallery 0's photo/title still
// show first; only --current-accent/--current-accent-text/
// --wordmark-photo-filter/accentPanel.style.color change.
const randomIndex = pickRandomGalleryIndex(galleries.length);
const randomGallery = galleries[randomIndex];
const randomFallback = ACCENTS[randomIndex % ACCENTS.length];
const randomAccent = randomGallery?.heroColor
  ? { bg: randomGallery.heroColor, text: randomGallery.heroTextColor ?? 'var(--color-on-accent)' }
  : randomFallback;
root!.style.setProperty('--current-accent', randomAccent.bg);
root!.style.setProperty('--current-accent-text', randomAccent.text);
root!.style.setProperty('--wordmark-photo-filter', wordmarkPhotoFilter(randomAccent.text));
if (accentPanel) accentPanel.style.color = randomAccent.text;
```

---

### `src/lib/home-carousel.ts` — `pickRandomGalleryIndex()` (utility, transform)

**Analog:** `computeHoverZone()` (lines 181-189) and `detectSwipeDirection()` (lines 116-125) in the same file — both pure, DOM-free, injectable-parameter functions.

**Existing pure-function convention to follow** (`src/lib/home-carousel.ts` lines 116-125):
```typescript
export type SwipeDirection = 'next' | 'prev' | null;

/**
 * Decides whether a touchstart→touchend delta counts as a horizontal swipe,
 * and in which direction. Mirrors HomeCarousel.astro's former touchend
 * handler's inline threshold checks.
 */
export function detectSwipeDirection(
  deltaX: number,
  deltaY: number,
  minDistance: number,
  directionRatio: number,
): SwipeDirection {
  if (Math.abs(deltaX) < minDistance) return null;
  if (Math.abs(deltaX) < Math.abs(deltaY) * directionRatio) return null;
  return deltaX < 0 ? 'next' : 'prev';
}
```
**New function to add, following the same shape** (per RESEARCH.md Pattern 4):
```typescript
/**
 * HOME-16/D-05: picks a random gallery index to use as the STARTING accent
 * on page load — injectable randomSource for deterministic unit testing,
 * mirrors the injectable-parameter convention used throughout this file.
 */
export function pickRandomGalleryIndex(
  count: number,
  randomSource: () => number = Math.random,
): number {
  if (count <= 0) return 0;
  return Math.floor(randomSource() * count);
}
```

---

### `tests/unit/home-carousel.test.ts` (test, transform)

**Analog:** existing `computeHoverZone`/`detectSwipeDirection` test cases in the same file — follow the same `describe`/`it` structure and injected-parameter-boundary-case style (e.g. testing `count=0`, `count=1`, and a fixed fake `randomSource` for deterministic assertions).

---

### `tests/e2e/site-header.spec.ts` or new `tests/e2e/mobile-nav.spec.ts` (test, event-driven)

**Analog:** `tests/e2e/site-header.spec.ts` (existing file, lines 1-59)

**Existing describe-block shape to copy** (lines 18-59):
```typescript
import { test, expect } from '@playwright/test';

test.describe('Shared SiteHeader — Instagram nav link on non-homepage pages (HOME-10, D-01, D-03)', () => {
  for (const path of ['/about/', '/en/about/', '/contact/', '/en/contact/']) {
    test(`${path}: exactly one Instagram link in the header with correct href/target/rel`, async ({ page }) => {
      await page.goto(path);
      const header = page.locator('[data-role="site-header"]');
      // ...assertions...
    });
  }
});

test.describe('Shared SiteHeader — mobile fit at 393px (HOME-10, Pitfall 1)', () => {
  for (const path of ['/about/', '/contact/', '/galleries/silos/']) {
    test(`${path}: no horizontal page overflow at a 393px viewport`, async ({ page }) => {
      await page.setViewportSize({ width: 393, height: 800 });
      await page.goto(path);
      // ...assertions...
    });
  }
});
```
New test file/blocks should follow this exact `for (const path of [...])` sweep shape for the "every OTHER page unaffected" regression assertions (About/Contact/gallery/édition detail all keep their current inline mobile header), plus new `test.describe` blocks (against `/` and `/en/` at ≤767px) for: dialog open via hamburger click, focus containment, Escape-to-close (`page.keyboard.press('Escape')`), backdrop-click-to-close, and desktop/tablet (≥768px) non-regression (dialog markup present but not interactable/visible).

---

## Shared Patterns

### Native `<dialog>` + `.showModal()` for focus-trap + Escape-to-close
**Source:** `src/components/Lightbox.astro` (lines 88-254, 300-326)
**Apply to:** `src/components/SiteHeader.astro`'s new mobile-nav dialog
Do not hand-roll a custom focus-trap keydown cycler or a manual `keydown`-based Escape listener — `Lightbox.astro` has an explicit code comment (line 172-173) against this, and no other focus-trap implementation exists anywhere in the codebase (`grep -rn "focus trap\|trapFocus" src/` returns nothing).

### `:global()` full-selector-chain wrapping for cross-component scoped-style overrides
**Source:** `.planning/milestones/v1.5-phases/19-site-wide-visual-polish/19-PATTERNS.md` (documented fix), applied here to `LanguageSwitcher.astro`'s `.switcher-link`
**Apply to:** Any rule in `SiteHeader.astro` that must restyle `LanguageSwitcher.astro`'s internals ONLY inside the mobile-nav panel. Wrap the ENTIRE selector (ancestor through target) in one `:global(...)` — wrapping only the ancestor half compiles but can never match, per RESEARCH.md Pitfall 2.

### Pure, DOM-free, injectable-randomness function convention
**Source:** `src/lib/home-carousel.ts` (`computeHoverZone`, `detectSwipeDirection`)
**Apply to:** `pickRandomGalleryIndex()` — keep it import-free, DOM-free, with an injectable `randomSource` parameter defaulting to `Math.random`, matching this file's existing style for unit-testability.

### `prefers-reduced-motion` gating on every new transition/animation
**Source:** `src/components/PageTitleHeader.astro` (halftone drift `@media (prefers-reduced-motion: reduce)`), `src/components/HomeCarousel.astro`'s `.home-toggle__morph`
**Apply to:** The mobile-nav panel's open/close transition AND the hamburger↔X icon morph — both must degrade to an instant, transition-less state change under reduced motion, per UI-SPEC's "Interaction & Motion Contract".

## No Analog Found

None — every file in this phase's scope has a strong, previously-verified in-repo analog (native `<dialog>` mechanics, pure-function unit-test convention, `:global()` scoped-override fix, e2e describe-block shape). RESEARCH.md's own "Don't Hand-Roll" table confirms no external library or novel pattern is needed.

## Metadata

**Analog search scope:** `src/components/`, `src/lib/`, `tests/unit/`, `tests/e2e/`, `.planning/milestones/v1.5-phases/19-site-wide-visual-polish/`
**Files scanned:** `SiteHeader.astro`, `LanguageSwitcher.astro`, `Lightbox.astro`, `HomeCarousel.astro` (3016 lines, targeted reads), `PageTitleHeader.astro`, `home-carousel.ts`, `tests/e2e/site-header.spec.ts`, `19-PATTERNS.md` (referenced, not re-read — already summarized in RESEARCH.md)
**Pattern extraction date:** 2026-08-03
