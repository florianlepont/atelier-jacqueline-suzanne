# Phase 6: Homepage View-Mode Toggle, Grid Hero & Wordmark Cutout - Pattern Map

**Mapped:** 2026-07-12
**Files analyzed:** 2 (both modified in place, no net-new files)
**Analogs found:** 2 / 2 (self-referencing — the analog for each file is its own current state, since this phase is a targeted refactor of an already-shipped component, not a new component)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `src/components/HomeCarousel.astro` | component (Astro island, no framework hydration — vanilla `<script>`) | event-driven (client-side DOM state machine driven by `data-display-mode` + click/hover/focus events; build-time props for initial render) | itself (current committed version) | exact — this phase edits the file's existing toggle/grid/wordmark sections, it does not introduce a new component shape |
| `tests/e2e/homepage.spec.ts` | test (Playwright e2e) | request-response (page navigation + DOM assertion) | itself (current committed version) | exact — only the toggle-button locator strategy changes (D-02), the rest of the spec's structure/patterns carry over unchanged |

No other files are created or modified by this phase (CONTEXT.md "Phase Boundary" is explicit: cosmetic/interaction changes confined to this one component + its one e2e spec).

## Pattern Assignments

### `src/components/HomeCarousel.astro` (component, event-driven)

**Analog:** itself, current version at `/Users/florian/Projects/ajs-website/src/components/HomeCarousel.astro` (776 lines)

#### 1. Toggle buttons → single unified toggle (D-01/D-02/D-03)

**Current two-button markup to replace** (lines 88-103):
```astro
<div class="home-toggle" role="group" aria-label={isEn ? 'Display mode' : "Mode d'affichage"}>
  <button type="button" class="home-toggle__btn is-active" data-action="show-carousel" aria-label={toggleCarouselLabel}>
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="4" width="16" height="12" rx="1" stroke="currentColor" stroke-width="1.5" />
      <path d="M8 7.5v5l4.5-2.5-4.5-2.5z" fill="currentColor" />
    </svg>
  </button>
  <button type="button" class="home-toggle__btn" data-action="show-grid" aria-label={toggleGridLabel}>
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="2" width="7" height="7" stroke="currentColor" stroke-width="1.5" />
      <rect x="11" y="2" width="7" height="7" stroke="currentColor" stroke-width="1.5" />
      <rect x="2" y="11" width="7" height="7" stroke="currentColor" stroke-width="1.5" />
      <rect x="11" y="11" width="7" height="7" stroke="currentColor" stroke-width="1.5" />
    </svg>
  </button>
</div>
```
Per D-01 + UI-SPEC "Single toggle button": collapse to one `<button data-role="mode-toggle" data-action="toggle-mode">` containing **both** SVGs verbatim as children (icon visibility driven by CSS off `data-display-mode`, mirroring the existing `.home[data-display-mode='carousel'] .home-logo__img--default { display: none; }` pattern already used for the logo hover swap at lines 426-432 — reuse that same display:none/block-by-mode CSS mechanic for the two icons instead of JS-toggling classes). Drop the wrapping `role="group"`/`aria-label` per UI-SPEC.

**Icon SVGs to reuse verbatim**: carousel icon (`<rect x="2" y="4" .../><path d="M8 7.5v5l4.5-2.5-4.5-2.5z" .../>`) and grid icon (four `<rect>` squares) — both copy-pasted as-is into the new single button.

**Script-side toggle logic to restructure** (lines 275-301):
```typescript
function setActiveToggle(button: HTMLButtonElement) {
  root!.querySelectorAll('.home-toggle__btn').forEach((btn) => btn.classList.remove('is-active'));
  button.classList.add('is-active');
}

const gridToggleBtn = root.querySelector<HTMLButtonElement>('.home-toggle__btn[data-action="show-grid"]');
const carouselToggleBtn = root.querySelector<HTMLButtonElement>(
  '.home-toggle__btn[data-action="show-carousel"]'
);

root.querySelectorAll<HTMLButtonElement>('[data-action="show-carousel"]').forEach((btn) => {
  btn.addEventListener('click', () => {
    showCarousel();
    if (carouselToggleBtn) setActiveToggle(carouselToggleBtn);
  });
});
root.querySelectorAll<HTMLButtonElement>('[data-action="show-grid"]').forEach((btn) => {
  btn.addEventListener('click', () => {
    showGrid();
    if (gridToggleBtn) setActiveToggle(gridToggleBtn);
  });
});
```
Per D-03 + UI-SPEC: delete `setActiveToggle()` entirely (no more is-active bookkeeping — single button has no "which is active" state). Replace with one click listener on `[data-role="mode-toggle"]` that reads `root.dataset.displayMode` to decide which of `showCarousel()`/`showGrid()` to call, and updates the button's `aria-label` to the *other* mode's label (`toggleGridLabel` while in carousel mode, `toggleCarouselLabel` while in grid mode) — same two existing localized string variables (lines 50-51), just reassigned to one element instead of two. The existing `showCarousel()`/`showGrid()` functions (lines 247-259) and the `root!.dataset.displayMode` state model are unaffected and should be preserved as-is — only the button wiring around them changes.

**CTA removal ripple (D-10):** the `[data-action="show-grid"]` querySelectorAll loop above also currently catches `.home-hero__cta` (line 127) — once that CTA button and its `ctaLabel` var (line 59) are deleted, this becomes moot since there's only one `data-action="toggle-mode"` element left.

#### 2. Grid hero-as-first-tile (D-04/D-05/D-06)

**Current separate intro band to delete** (lines 131-136, wrapping the tiles):
```astro
<div class="home-grid" data-role="home-grid" hidden>
  <div class="home-grid__intro">
    <p class="home-grid__wordmark">Atelier<br />Jacqueline<br />Suzanne</p>
    <p class="home-grid__intro-body">{introBody}</p>
  </div>
  <div class="home-grid__tiles">
    {galleries.map((gallery) => (
```
**Analog for the new hero-tile's structure** — copy `.home-grid__tile`'s exact shape (lines 138-150), but as a `<div>` not an `<a>`, per D-06:
```astro
<a href={getRelativeLocaleUrl(locale, `galleries/${gallery.slug}`)} class="home-grid__tile">
  <img src={gallery.gridSrc} width="600" height="600" alt={gallery.alt} loading="lazy" decoding="async" class="home-grid__tile-img" />
  <div class="home-grid__tile-scrim" aria-hidden="true"></div>
  <span class="home-grid__tile-title">{gallery.title}</span>
</a>
```
New markup should be `<div class="home-grid__tile home-grid__tile--hero">…</div>` as the **first child** of `.home-grid__tiles`, containing the wordmark + intro paragraph (moved from the deleted `.home-grid__intro`), styled via a new `.home-grid__tile--hero` CSS rule that inherits `.home-grid__tile`'s sizing (`position: relative; aspect-ratio: 1/1; overflow: hidden;`, lines 688-694) plus its own background (`background-color: var(--current-accent, var(--color-accent)); color: var(--color-on-accent);` — reusing the `--current-accent` custom property already set by `render()` at line 229) and `--space-md` padding per UI-SPEC (not the old `--space-2xl`).

**CSS to delete:** `.home-grid__intro` rule block (lines 657-661).

**CSS to add/adapt:** new `.home-grid__wordmark`/`.home-grid__intro-body` font sizes per UI-SPEC Typography table (24px/16px wordmark, 14px Label-role intro body with optional `-webkit-line-clamp: 2` fallback) — these class names already exist (lines 663-680) and can be resized in place rather than renamed, since the wordmark/intro-body markup is moving location but keeping its existing classes.

#### 3. Wordmark transparent cutout (D-07/D-08/D-09)

**Current solid-panel wordmark to modify** (lines 124-128):
```astro
<div class="home-hero__accent" data-role="accent-panel" style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-on-accent)' }}>
  <p class="home-hero__wordmark">Atelier<br />Jacqueline<br />Suzanne</p>
  <p class="home-hero__intro">{introBody}</p>
  <button type="button" class="home-hero__cta" data-action="show-grid">{ctaLabel}</button>
</div>
```
Per D-08/D-10: remove the CTA `<button>` line entirely; remove the panel-wide inline `backgroundColor` style (the cutout requires no solid background behind the wordmark); wrap `.home-hero__intro` in its own backing box using `--current-accent`.

**Current wordmark CSS to extend** (lines 620-633):
```css
.home-hero__wordmark {
  font-family: var(--font-display);
  font-size: 44px;
  font-weight: var(--weight-semibold);
  line-height: 1.2;
  letter-spacing: 0.02em;
  margin: 0 0 var(--space-md);
}
```
Add `background-clip: text; -webkit-background-clip: text; color: transparent; -webkit-text-fill-color: transparent; background-image: var(--wordmark-photo); background-size: cover; background-position: center;` inside an `@supports (background-clip: text) or (-webkit-background-clip: text)` block per UI-SPEC, bump `font-size` to 64px desktop / 48px mobile (new `@media (max-width: 767px)` override alongside the existing mobile block at lines 722-774).

**Script-side sync point** — `render()`'s existing per-gallery image assignment (lines 214-217):
```typescript
if (heroImg) {
  heroImg.src = gallery.heroSrc;
  heroImg.alt = gallery.alt;
}
```
Add a parallel `root!.style.setProperty('--wordmark-photo', \`url(${gallery.heroSrc})\`)` (or set directly on the wordmark/accent-panel element) in the same `render()` call, right alongside the existing `root!.style.setProperty('--current-accent', accent.bg);` at line 229 — same established pattern of driving CSS custom properties from `render()` on every carousel tick/gallery change.

**CSS to delete:** `.home-hero__cta` rule block (lines 642-653) and the `ctaLabel` variable (frontmatter line 59).

#### Imports pattern (unchanged, lines 17-18)
```astro
import { getRelativeLocaleUrl } from 'astro:i18n';
import LanguageSwitcher from './LanguageSwitcher.astro';
```
No new imports needed for this phase — all changes are markup/CSS/script restructuring within the existing file.

---

### `tests/e2e/homepage.spec.ts` (test, request-response)

**Analog:** itself, current version at `/Users/florian/Projects/ajs-website/tests/e2e/homepage.spec.ts`

**Locator pattern to update** (D-02) — three call sites currently query two independently-named buttons:
```typescript
// line 36
await page.getByRole('button', { name: 'Grille' }).click();
// line 57
await page.getByRole('button', { name: 'Grille' }).click();
// line 68
await page.getByRole('button', { name: 'Carrousel' }).click();
```
Per D-02 + UI-SPEC "Test impact": the label **strings** (`'Grille'`, `'Carrousel'`) stay identical — `page.getByRole('button', { name: 'Grille' })` and `page.getByRole('button', { name: 'Carrousel' })` continue to work unchanged as locators, because Playwright's accessible-name query resolves whatever the single button's *current* `aria-label` is. No structural rewrite is strictly required at these three call sites — only note explicitly (per D-02) that this is now querying **one** stateful button rather than two independently-existing elements, so any future assertion counting "both buttons" would break and must not be added.

**Test structure to preserve unchanged** — surrounding `test.describe`/`test` blocks (lines 19-27, 29-46, 48-71) and their `data-role` locators (`[data-role="home-carousel"]`, `[data-role="home-grid"]`) are the established pattern for this spec and are unaffected by D-04's grid restructuring, since `[data-role="home-grid"]` remains the grid container's role attribute regardless of whether `.home-grid__intro` or a `.home-grid__tile--hero` is its first child.

**Pattern for scoped visibility assertions** (lines 60-66, reusable for any future hero-tile assertions):
```typescript
const grid = page.locator('[data-role="home-grid"]');
await expect(grid.getByText(/silos/i).first()).toBeVisible();
await expect(grid.getByText(/brume/i).first()).toBeVisible();
```

## Shared Patterns

### Mode-state CSS driven by a single data attribute
**Source:** `src/components/HomeCarousel.astro` lines 76, 226-259, 335-353, 407-443
**Apply to:** the new single-toggle icon-visibility rule and grid hero-tile background
```css
.home[data-display-mode='carousel'] .home-logo__img--default { display: none; }
.home[data-display-mode='grid'] .home-header { position: static; background: none; color: var(--color-ink); }
```
This `[data-display-mode='X'] .selector { ... }` mechanic is the established, repeated pattern for every mode-dependent style change in this file (header position/color, logo hover variant, and now — new for this phase — toggle icon visibility). Use it for the new single-button's two SVG children rather than JS class-toggling.

### CSS custom properties set from `render()`
**Source:** `src/components/HomeCarousel.astro` line 229 (`root!.style.setProperty('--current-accent', accent.bg);`)
**Apply to:** the new `--wordmark-photo` custom property for the cutout effect (D-08)
Every per-gallery visual value that needs to update on carousel auto-advance/prev/next is threaded through `render()` as a `root.style.setProperty(...)` call, not scattered DOM mutations — keep the wordmark-photo sync in this same function, in the same place as the existing `--current-accent` line.

### Data island + typed `<script>` (unaffected, reference only)
**Source:** `src/components/HomeCarousel.astro` lines 155-306
The hidden `<ul data-role="home-carousel-data">` → typed `galleries` array → `render()` pattern (shared with `Lightbox.astro` per the file's own header comment, line 5) is untouched by this phase; the toggle/grid/wordmark changes are additive edits within this existing script structure, not a replacement of it.

## No Analog Found

None. Both files being modified already exist and this phase is a scoped refactor of them — there is no net-new file requiring an external analog search.

## Metadata

**Analog search scope:** `src/components/HomeCarousel.astro`, `tests/e2e/homepage.spec.ts` (both read in full; no other files searched, per CONTEXT.md's explicit "Phase Boundary" confining all changes to this one component + its one e2e spec)
**Files scanned:** 2
**Pattern extraction date:** 2026-07-12
