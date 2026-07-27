# Phase 10: Unified Header & Simplified Language Switcher - Pattern Map

**Mapped:** 2026-07-15
**Files analyzed:** 6 (1 new, 5 modified)
**Analogs found:** 6 / 6

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `src/components/SiteHeader.astro` (NEW) | component (header/chrome) | request-response (build-time render, zero hydration) | `src/layouts/BaseLayout.astro` lines 181-194 + 337-476 (inline header markup/CSS being extracted) | exact — this is a literal extraction, not a new pattern |
| `src/layouts/BaseLayout.astro` (MODIFY) | layout/provider | request-response | itself (pre-refactor version) | exact — trims header markup/CSS, adds `<SiteHeader>` call |
| `src/components/HomeCarousel.astro` (MODIFY) | component (page section, client-interactive) | event-driven (client `<script>` mutates `data-display-mode`) + request-response (build-time render) | itself (pre-refactor version) — header block lines 99-162, mobile CSS lines 1524-1571 | exact — replaces its own inline header with `<SiteHeader>` call, keeps its own `data-display-mode` CSS overrides |
| `src/components/LanguageSwitcher.astro` (MODIFY) | component (nav control) | request-response (href computed at build time) + event-driven (click → cookie write) | itself (pre-refactor version) | exact — same file, simplified markup, same script mechanism |
| `src/lib/i18n-paths.ts` (UNCHANGED, reused) | utility | transform (pathname → locale-swapped URL) | itself — `getSwitcherHref(pathname, targetLocale)` | exact — no changes, called once instead of twice |
| `tests/e2e/homepage.spec.ts` (MODIFY) | test (e2e) | request-response | itself — existing `[data-role="home-header"]`/`.home-nav`-keyed assertions | exact — selector rename only |
| `tests/e2e/i18n.spec.ts` (MODIFY) | test (e2e) | request-response | itself — existing `'FR | EN'` text assertions | exact — rewrite to one-link assertion |

## Pattern Assignments

### `src/components/SiteHeader.astro` (NEW component, request-response)

**Analog:** `src/layouts/BaseLayout.astro` (the file this is extracted from — read in full above)

**Imports pattern** (BaseLayout.astro lines 1-10):
```astro
import { getRelativeLocaleUrl } from 'astro:i18n';
import LanguageSwitcher from '../components/LanguageSwitcher.astro';
```
`SiteHeader.astro` needs the same `getRelativeLocaleUrl` import (for `homeHref`/`aboutHref`/`contactHref` — but these should be passed in as **props** from the two call sites, since `BaseLayout` and `HomeCarousel` each already compute them independently today with identical logic — see Props note below) plus the same `LanguageSwitcher` import (relative path becomes `./LanguageSwitcher.astro` since `SiteHeader.astro` lives in `src/components/`, not `src/layouts/`).

**Props contract** (synthesized from BaseLayout.astro `Props` interface lines 33-45 + HomeCarousel.astro's parallel locally-derived values lines 55-72):
```typescript
interface Props {
  variant: 'solid' | 'transparent'; // NOT 3-value — 'none' suppression stays in BaseLayout's own conditional (UI-SPEC Open Question 2 resolution)
  siteTitle: string;       // aria-label on logo — was siteSettings.siteTitle in BaseLayout, wordmark const in HomeCarousel
  homeHref: string;
  aboutLabel: string;
  aboutHref: string;
  contactLabel: string;
  contactHref: string;
  instagramUrl: string;    // NEW to SiteHeader's contract — previously HomeCarousel-only (D-03 moves it in)
  instagramLabel: string;
  instagramNewTabHint: string; // locale-conditional sr-only suffix, computed by caller (same const already duplicated in both BaseLayout footer usage pattern and HomeCarousel — keep computation at call sites, pass the resolved string in)
  logoBlackSrc: string;
  logoWhiteSrc: string;
}
```

**Core markup pattern — logo + nav + slot + switcher** (BaseLayout.astro lines 182-193, cross-referenced with HomeCarousel.astro lines 99-162 for the Instagram link + slot insertion point):
```astro
<header class:list={['chrome-band', 'site-header', `site-header--${variant}`]} data-role="site-header">
  <a href={homeHref} class="logo-mark" aria-label={siteTitle}>
    <span class="logo-mark__chip" aria-hidden="true"></span>
    <img src={logoBlackSrc} alt="" class="logo-mark__img logo-mark__img--default" />
    <img src={logoWhiteSrc} alt="" class="logo-mark__img logo-mark__img--hover" />
  </a>
  <nav class="site-nav" aria-label="Primary">
    <a href={aboutHref} class="nav-link">{aboutLabel}</a>
    <a href={contactHref} class="nav-link">{contactLabel}</a>
    {/* Instagram link — moved in verbatim from HomeCarousel.astro lines 112-139, D-03 */}
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
Note: `.nav-link` here replaces both `.home-nav-link` (HomeCarousel) — per the D-05 class rename map in UI-SPEC.md — the Instagram link and About/Contact links share ONE class name now, not two parallel ones.

**CSS scoping pattern — `is:global`, not scoped** (BaseLayout.astro line 208 opening tag `<style is:global>` through line 332, then the SECOND `<style>` block at line 334 which is scoped-by-Astro-default but contains `.site-header`/`.logo-mark`/`.nav-link` rules that must migrate to `is:global` in the new file, per RESEARCH.md Pattern 3):
```astro
<style is:global>
  .site-header { display: flex; align-items: center; justify-content: space-between; gap: var(--space-md); }
  .site-header--solid { background-color: var(--color-dominant); border-bottom: var(--border-hairline) solid var(--color-border); }
  .site-header--transparent { position: absolute; top: 0; left: 0; right: 0; z-index: 2; background: linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 60%, rgba(0,0,0,0) 100%); }
  .site-header--transparent .nav-link { color: #FFFFFF; }
  /* ... full logo-mark hover-crossfade block, BaseLayout.astro lines 399-476, copied verbatim ... */
  .site-nav { margin-right: auto; margin-left: var(--space-md); display: flex; gap: var(--space-md); }
  .nav-link { font-size: 14px; font-weight: var(--weight-regular); line-height: 1.5; text-decoration: none; }
  .nav-link:hover, .nav-link:focus-visible { text-decoration: underline; }
</style>
```
IMPORTANT: BaseLayout.astro's CURRENT second `<style>` block (line 334, no `is:global`) is Astro-default-scoped even though it contains `.site-header`/`.logo-mark`/`.nav-link` — this works today only because these rules never need cross-file `:global()` reach-in from BaseLayout's own perspective. Once extracted to `SiteHeader.astro` and referenced from `HomeCarousel.astro`'s OWN separate stylesheet (for the `[data-display-mode]` overrides) and from `LanguageSwitcher.astro`, this MUST become `is:global` or every override in `HomeCarousel.astro` needs `:global()` wrapping. Follow RESEARCH.md Pattern 3 exactly.

**Mobile CSS to port in** (`HomeCarousel.astro` lines 1547-1571, `@media (max-width: 767px)` block — translate class names per the D-05 rename map):
```css
@media (max-width: 767px) {
  .site-header { flex-wrap: wrap; gap: var(--space-xs); }
  .site-nav { margin-left: 0; gap: var(--space-xs); }
  .site-nav .nav-link { padding-left: var(--space-xs); padding-right: var(--space-xs); }
}
```
This has NEVER existed for BaseLayout's header (RESEARCH.md Pitfall 1) — About/Contact/gallery-detail currently have zero mobile header CSS. This block must be added, not just ported, from About/Contact's perspective. Re-measure live per RESEARCH.md Pitfall 2 / UI-SPEC Spacing Scale note — do not assume the numbers transfer 1:1 given the switcher/nav item-count differs between the homepage (5-6 items with slot+toggle) and About/Contact (4 items, no toggle).

---

### `src/layouts/BaseLayout.astro` (MODIFY — layout, request-response)

**Analog:** itself, pre-refactor

**Change pattern** — replace inline header (lines 181-194) with:
```astro
{headerVariant !== 'none' && (
  <SiteHeader
    variant={headerVariant}
    siteTitle={siteTitle}
    homeHref={homeHref}
    aboutLabel={aboutLabel}
    aboutHref={aboutHref}
    contactLabel={contactLabel}
    contactHref={contactHref}
    instagramUrl={siteCopy.instagramUrl}
    instagramLabel={siteCopy.instagramLabel}
    instagramNewTabHint={instagramNewTabHint}
    logoBlackSrc={logoBlackSrc}
    logoWhiteSrc={logoWhiteSrc}
  />
)}
```
Note `instagramNewTabHint` does not currently exist as a BaseLayout.astro const (Instagram is homepage-only today) — add it identically to HomeCarousel.astro line 69: `const instagramNewTabHint = locale === 'en' ? ' (opens in new tab)' : ' (nouvelle fenêtre)';`. `siteCopy.instagramUrl`/`siteCopy.instagramLabel` are already available via the existing `resolveSiteCopy(siteSettings, locale)` call (BaseLayout.astro line 65) — confirmed present as `SiteCopy` fields (HomeCarousel.astro's own `SiteCopy` interface lines 32-38 already declares them).

Remove: the extracted `<style is:global>` header-CSS rules (`.site-header*`, `.logo-mark*`, `.site-nav`, `.nav-link`) and the non-`is:global` `<style>` block's header rules (lines 347-495-ish) that now live in `SiteHeader.astro`. Keep: `:root` tokens, `body`/`a`/`.sr-only`/`.chrome-band`/footer CSS (unaffected by this phase).

---

### `src/components/HomeCarousel.astro` (MODIFY — component, event-driven + request-response)

**Analog:** itself, pre-refactor (lines 99-162 header markup, lines 700-870 header CSS overrides, lines 1524-1571 mobile CSS)

**Change pattern** — replace inline `<header class="home-header">` block with a `<SiteHeader>` call carrying the toggle in the named slot:
```astro
<SiteHeader
  variant="transparent"
  siteTitle={wordmark}
  homeHref={homeHref}
  aboutLabel={aboutLabel}
  aboutHref={aboutHref}
  contactLabel={contactLabel}
  contactHref={contactHref}
  instagramUrl={siteCopy.instagramUrl}
  instagramLabel={siteCopy.instagramLabel}
  instagramNewTabHint={instagramNewTabHint}
  logoBlackSrc={logoBlackSrc}
  logoWhiteSrc={logoWhiteSrc}
>
  <button
    slot="extra"
    type="button"
    class="home-toggle"
    data-role="mode-toggle"
    data-action="toggle-mode"
    data-label-carousel={toggleCarouselLabel}
    data-label-grid={toggleGridLabel}
    aria-label={toggleGridLabel}
  >
    <span class="home-toggle__box" aria-hidden="true">
      <span class="home-toggle__morph">
        <span class="home-toggle__morph-cell"></span>
        <span class="home-toggle__morph-cell"></span>
        <span class="home-toggle__morph-cell"></span>
        <span class="home-toggle__morph-cell"></span>
        <span class="home-toggle__morph-cell"></span>
        <span class="home-toggle__morph-cell"></span>
      </span>
    </span>
  </button>
</SiteHeader>
```
`variant="transparent"` is fixed (RESEARCH.md Pattern 1 — never re-rendered); grid-mode look is achieved via the existing `data-display-mode` CSS override mechanism below, re-scoped from `.home-header` to `.site-header`.

**CSS override re-scoping pattern** (`HomeCarousel.astro` lines 728-869, e.g.):
```css
/* was: .home[data-display-mode='grid'] .home-header { ... } */
.home[data-display-mode='grid'] .site-header--transparent {
  position: static;
  background: none;
  color: var(--color-ink);
}
.home[data-display-mode='grid'] .site-header--transparent .nav-link {
  color: inherit;
}
/* switcher-link color override, was scoped to .home-header, now .site-header
   (HomeCarousel.astro lines 860-866) — stays in HomeCarousel's OWN stylesheet,
   not moved into SiteHeader.astro (UI-SPEC Color section) */
.home[data-display-mode='carousel'] .site-header :global(.switcher-link) { color: #FFFFFF; }
.home[data-display-mode='grid'] .site-header :global(.switcher-link) { color: var(--color-ink); }
```
Apply the full D-05 rename map (UI-SPEC.md Layout & Interaction Notes table) across all of lines 700-1027: `.home-header`→`.site-header`, `.home-nav`→`.site-nav`, `.home-nav-link`→`.nav-link`, `.home-logo*`→`.logo-mark*`. `.home-toggle*` and `[data-role="mode-toggle"]` stay unchanged (D-05 explicit exclusion).

**Delete**: all `.home-logo*`/`.home-nav*`/`.home-header` CSS blocks that duplicate what's now in `SiteHeader.astro`'s `is:global` stylesheet (the hover-crossfade logic, lines 769-846, is a full duplicate of BaseLayout's and must not survive in two places — it becomes SiteHeader's, HomeCarousel keeps only the `data-display-mode`-scoped override deltas).

**Mobile CSS**: lines 1547-1571 — rename classes per the map; this stays in `HomeCarousel.astro`'s own stylesheet since it's layered on top of `SiteHeader`'s ported baseline mobile CSS (which now also applies to About/Contact) — homepage-specific trims (accounting for the extra toggle) remain homepage-scoped.

---

### `src/components/LanguageSwitcher.astro` (MODIFY — component, request-response + event-driven)

**Analog:** itself, pre-refactor (full file read above)

**Full rewrite pattern** (per RESEARCH.md Code Examples section, cross-checked against UI-SPEC Copywriting Contract for exact sr-only phrasing):
```astro
---
import { getSwitcherHref } from '../lib/i18n-paths';

const currentLocale = Astro.currentLocale === 'en' ? 'en' : 'fr';
const targetLocale = currentLocale === 'fr' ? 'en' : 'fr';
const targetHref = getSwitcherHref(Astro.url.pathname, targetLocale);
const targetLabel = targetLocale === 'en' ? 'EN' : 'FR';
// D-11/UI-SPEC Copywriting Contract: phrased in the CURRENT page's language
// (mirrors instagramNewTabHint's pattern, BaseLayout.astro:76) — FR page
// says "Passer en anglais", EN page says "Switch to French".
const switchHint = currentLocale === 'fr' ? 'Passer en anglais' : 'Switch to French';
---

<nav class="language-switcher" aria-label="Language switcher">
  <a href={targetHref} class="switcher-link" data-locale={targetLocale}>
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
      <circle cx="12" cy="12" r="9.5" />
      <ellipse cx="12" cy="12" rx="4.2" ry="9.5" />
      <line x1="2.5" y1="12" x2="21.5" y2="12" />
    </svg>
    {targetLabel}
    <span class="sr-only">{' '}{switchHint}</span>
  </a>
</nav>
```

**Style block changes** — drop `.switcher-separator`/`.is-current` rules (no longer applicable), add flex-gap between icon+label:
```css
.switcher-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs); /* NEW — icon-to-label gap, UI-SPEC Spacing Scale exception */
  justify-content: center;
  min-height: 44px;
  padding: 8px;
  color: var(--color-accent);
  text-decoration: none;
}
```
Keep `.switcher-link:hover`/`:focus-visible` rules unchanged (lines 46-54 of current file).

**Script block — UNCHANGED (D-10)** (current file lines 66-90, verbatim, `querySelectorAll('.language-switcher .switcher-link')` already works with 1 link, no change needed):
```js
const COOKIE_NAME = 'ajs_locale';
const base = import.meta.env.BASE_URL ?? '/';
const cookiePath = base.endsWith('/') ? base : `${base}/`;
document
  .querySelectorAll<HTMLAnchorElement>('.language-switcher .switcher-link')
  .forEach((link) => {
    link.addEventListener('click', () => {
      const locale = link.dataset.locale;
      if (locale) {
        document.cookie = `${COOKIE_NAME}=${locale}; path=${cookiePath}; max-age=31536000; SameSite=Lax; Secure`;
      }
    });
  });
```

---

## Shared Patterns

### Zero-hydration variant switching (fixed prop + CSS attribute-selector)
**Source:** `HomeCarousel.astro`'s existing `data-display-mode` mechanism (logo swap lines 800-843, script mutation ~line 289+)
**Apply to:** `SiteHeader.astro` consumption from `HomeCarousel.astro` — variant is always `"transparent"` at render time; grid-mode visuals come from CSS overrides scoped under `.home[data-display-mode='grid']`, never from changing the prop.

### `is:global` CSS scoping for cross-file-overridden shared chrome
**Source:** `BaseLayout.astro` line 208 `<style is:global>` convention
**Apply to:** `SiteHeader.astro`'s entire stylesheet — must NOT use Astro's default scoped `<style>`, or `HomeCarousel.astro`'s override CSS and `LanguageSwitcher.astro`'s cross-component color overrides break.

### `sr-only` hint pattern for icon-only/compact accessible names
**Source:** `BaseLayout.astro`/`HomeCarousel.astro`'s `instagramNewTabHint` construction + `.sr-only` utility class (`BaseLayout.astro` lines 319-331)
**Apply to:** `LanguageSwitcher.astro`'s new `switchHint` sr-only span — same `.sr-only` class, same locale-conditional string pattern, phrased in current-page language (D-11/UI-SPEC).

### Instagram inline SVG glyph, verbatim reuse
**Source:** `HomeCarousel.astro` lines 125-137
**Apply to:** `SiteHeader.astro`'s nav — moved, not re-derived, per D-03.

### Class rename map (D-05)
**Source:** UI-SPEC.md "Class/attribute rename map" table (`.home-header`→`.site-header`+`data-role="site-header"`, `.home-nav`→`.site-nav`, `.home-nav-link`→`.nav-link`, `.home-logo*`→`.logo-mark*`)
**Apply to:** `HomeCarousel.astro`'s markup and every CSS selector in its header-related blocks (lines 700-1027, 1547-1571); `tests/e2e/homepage.spec.ts` and `tests/e2e/i18n.spec.ts` selectors.

## No Analog Found

None — this phase is a pure extraction/consolidation of existing, already-implemented patterns. Every file involved has a direct pre-refactor analog (itself) or an established sibling pattern (BaseLayout ↔ HomeCarousel cross-reference).

## Metadata

**Analog search scope:** `src/layouts/BaseLayout.astro`, `src/components/HomeCarousel.astro`, `src/components/LanguageSwitcher.astro`, `src/lib/i18n-paths.ts`, `tests/e2e/homepage.spec.ts`, `tests/e2e/i18n.spec.ts`
**Files scanned:** 6 (full or targeted reads) + grep sweep across e2e test files for selector dependencies (confirmed `tests/e2e/legal.spec.ts` also depends on switcher accessible-name substring matching, per RESEARCH.md Pitfall 4 — no code change needed there, only regression verification)
**Pattern extraction date:** 2026-07-15
