# Phase 19: Site-Wide Visual Polish - Pattern Map

**Mapped:** 2026-08-03
**Files analyzed:** 3
**Analogs found:** 3 / 3 (all self-analogs — each fix's pattern/anti-pattern lives in the same file or its direct sibling; no external component supplies a cleaner precedent)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `src/components/EditionsOverviewBody.astro` (lines 88-101) | component (style-only edit) | transform (CSS selector correctness) | Same file, other correctly-scoped `:global()` rules further down (lines 127-129, 142-144, 174-175) | exact — the fix pattern already exists 3 times lower in the same file |
| `src/components/PageTitleHeader.astro` (lines 41-65, 166-187) | component (style-only edit) | transform (CSS layout/bleed) | No true full-bleed analog exists elsewhere in the codebase; closest conceptual precedent is the file's own already-working vertical (unclipped) bleed on `.page-title-header__halftone` (top/bottom: -700px, lines 168-169) | partial — pattern must be authored fresh, informed by the file's own prior-art comments |
| `src/components/ContactPageBody.astro` (lines 142-165) | component (style-only edit) | transform (CSS spacing) | `src/components/Button.astro` lines 41-45 (`padding: var(--space-sm) var(--space-lg)`) for spacing-scale convention; `.contact-page__detail::before` itself (lines 152-160) for the inset/fill mechanism to adjust | role-match (spacing scale) + exact (inset mechanism, same block) |

## Pattern Assignments

### `src/components/EditionsOverviewBody.astro` (EDN-09)

**Analog (positive example, same file, lines 127-129):**
```css
:global(html.editions-row-active) .editions-index__row {
  color: var(--editions-row-accent-text);
  border-color: var(--editions-row-accent-text);
}
```
This rule works correctly because `.editions-index__row` is an element rendered by THIS component's own template (line 49, `<a class="editions-index__row" ...>`), so `EditionsOverviewBody.astro`'s scope-hash attribute is present on both the compiled selector and the real DOM element — the partial `:global()` wrap is harmless here only because the trailing selector happens to be a same-component element. Same shape at lines 142-144 and 174-175 (`.editions-index__number`, `.editions-index__statement`).

**Broken pattern to fix (lines 88-101, current):**
```css
:global(html.editions-row-active) .page-title-header__eyebrow {
  color: var(--editions-row-accent-text);
}
:global(html.editions-row-active) .page-title-header__eyebrow::before {
  background-color: var(--editions-row-accent-text);
}
:global(html.editions-row-active) .page-title-header h1 {
  color: var(--editions-row-accent-text);
}
:global(html.editions-row-active) .page-title-header__intro {
  color: var(--editions-row-accent-text);
}
:global(html.editions-row-active) .page-title-header__divider {
  background-color: var(--editions-row-accent-text);
}
```
These five target `.page-title-header__*` elements, which are rendered by `PageTitleHeader.astro` (a DIFFERENT component, imported at line 13 and used at line 37), not by `EditionsOverviewBody.astro` itself. Only `html.editions-row-active` is inside `:global()` — everything after it still gets `EditionsOverviewBody.astro`'s own Astro scope-hash appended at compile time, which the real `PageTitleHeader`-rendered elements never carry. Structurally can never match (confirmed live per CONTEXT.md D-01).

**Required fix — wrap the ENTIRE selector in `:global()`:**
```css
:global(html.editions-row-active .page-title-header__eyebrow) {
  color: var(--editions-row-accent-text);
}
:global(html.editions-row-active .page-title-header__eyebrow::before) {
  background-color: var(--editions-row-accent-text);
}
:global(html.editions-row-active .page-title-header h1) {
  color: var(--editions-row-accent-text);
}
:global(html.editions-row-active .page-title-header__intro) {
  color: var(--editions-row-accent-text);
}
:global(html.editions-row-active .page-title-header__divider) {
  background-color: var(--editions-row-accent-text);
}
```
This is the same shape used correctly elsewhere in the codebase for cross-component `:global()` targeting — e.g. compare to the site's SiteHeader row-hover integration point referenced in the file's own comment (lines 77-80): "so the shared SiteHeader can pick up the same colors" — confirm `SiteHeader.astro` uses the same full-selector `:global()` idiom if/when it reads `--editions-row-accent-text` (no matching `:global()` rule was found in `SiteHeader.astro` at pattern-mapping time — grep returned no results — so this fix has no live sibling in that file to cross-check against; rely on the EDN-09 root-cause analysis instead).

**No test file found** for this component; no existing `.test.ts`/`.spec.ts` covers `EditionsOverviewBody.astro`'s CSS directly — verification will need to be live/DOM-based (per CONTEXT.md's note on waiting past the 0.35s `color` transition before asserting computed style).

---

### `src/components/PageTitleHeader.astro` (UI-01)

**Current (working but too-narrow) containment, lines 57-65:**
```css
.page-title-header {
  position: relative;
  isolation: isolate;
  margin-bottom: var(--space-lg);
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-lg);
  overflow-x: clip;
}
```
Comment above (lines 41-56) explains this exists specifically to avoid the site-wide `overflow-x: hidden` regression on `html`/`body` (reverted 2026-07-29, broke `position: sticky` on About's hero and `DetailHero`'s pin) and to avoid an axe `scrollable-region-focusable` false-positive (`clip` not `hidden` for that reason).

**Halftone element to extend to true viewport bleed, lines 166-182:**
```css
.page-title-header__halftone {
  position: absolute;
  top: -700px;
  bottom: -700px;
  left: -700px;
  right: -700px;
  background-image: radial-gradient(rgba(26, 26, 26, 0.16) 1.4px, transparent 1.6px);
  background-size: 9px 9px;
  -webkit-mask-image: radial-gradient(circle 640px at right 700px top 700px, black 0%, rgba(0, 0, 0, 0.72) 18%, rgba(0, 0, 0, 0.42) 40%, rgba(0, 0, 0, 0.18) 65%, rgba(0, 0, 0, 0.05) 85%, transparent 100%);
  mask-image: radial-gradient(circle 640px at right 700px top 700px, black 0%, ...);
  z-index: -1;
  pointer-events: none;
  display: none;
  opacity: 0;
  transition: filter 0.3s ease;
  animation: page-title-header-halftone-fade-in 0.6s ease 0.3s forwards, page-title-header-halftone-drift 10s linear infinite;
}
```
The vertical bleed (`top`/`bottom: -700px`) is already unclipped and works — `.page-title-header` only clips `overflow-x`, never `overflow-y`. The horizontal `left`/`right: -700px` bleed is what gets clipped by the parent's `overflow-x: clip`, per the file's own comment (lines 41-56): the halftone was "overflowing every consumer page's document width at >=760px."

**No existing full-bleed analog found elsewhere in the codebase** (searched for `100vw`/`50vw`/`calc(50%` across all `.astro` files — every hit is either a responsive-image `sizes` attribute (`GalleryGrid.astro`, `HomeCarousel.astro`, `AboutPageBody.astro`, `DetailHero.astro`, `404.astro`) or `Lightbox.astro`'s fixed-position full-viewport overlay (lines 303-305, `position: fixed` + `100vw`/`100vh` — not applicable since that element is already viewport-relative via `fixed`, not bleeding out of a static-flow ancestor). This fix must be authored fresh.

**Recommended technique** (per CONTEXT.md D-06 discretion, `calc(50% - 50vw)` preferred over bare `100vw` to avoid the scrollbar-width pitfall) — apply to `.page-title-header__halftone` itself, keeping `.page-title-header`'s `overflow-x: clip` in place (so it still clips at the component boundary if the technique ever miscalculates, preserving the D-04 safety net) while extending the halftone element's own positioning to reach the true viewport edge, e.g.:
```css
.page-title-header__halftone {
  /* existing top/bottom/mask/etc unchanged */
  left: calc(50% - 50vw);
  right: calc(50% - 50vw);
  /* NOTE: this changes the -700px left/right bleed's reference frame from
     "relative to .page-title-header's own box" to "relative to the true
     viewport edge" — the -700px mask-position math (radial-gradient "at
     right 700px top 700px") may need re-tuning once left/right stop being
     a fixed 700px offset and become a viewport-relative distance that
     varies with .page-title-header's own inline position on the page. */
}
```
`.page-title-header`'s `position: relative; isolation: isolate;` (line 58-59) establishes the containing block the `calc(50% - 50vw)` trick needs — do not remove `position: relative` when touching this rule.

**MANDATORY pre-reading before touching this file:** lines 1-19 (component-level history comment) and lines 41-56 (the `overflow-x: clip` rule's own comment) — both already quoted above, but re-read in full in the actual file before implementing, per CONTEXT.md D-04.

**No test file found** for this component's CSS. CONTEXT.md D-05 requires NEW e2e coverage (not existing) — no current Playwright spec covers `document.documentElement.scrollWidth <= window.innerWidth`; search for the current e2e page-coverage list before writing new specs.

---

### `src/components/ContactPageBody.astro` (CONT-03)

**Current (zero horizontal padding), lines 142-150:**
```css
.contact-page__detail {
  position: relative;
  display: block;
  padding: clamp(6px, 1.1vh, 12px) 0;
  border-bottom: var(--border-hairline) solid var(--color-border);
  color: var(--color-ink);
  text-decoration: none;
  overflow: hidden;
}
```

**Hover-fill element to compensate, lines 152-160:**
```css
.contact-page__detail::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  background: var(--color-ink);
  transform: translateX(-101%);
  transition: transform 320ms cubic-bezier(0.65, 0, 0.35, 1);
}
```

**Spacing-scale convention analog** — `src/components/Button.astro` lines 41-45:
```css
.btn {
  padding: var(--space-sm) var(--space-lg);
}
.btn--compact {
  padding: var(--space-sm) var(--space-md);
}
```
Confirms the codebase convention of `var(--space-sm)`/`var(--space-md)` tokens (not raw px) for horizontal padding on interactive row/button elements — `--space-xs: 4px`, `--space-sm: 8px`, `--space-md: 16px` defined in `BaseLayout.astro` ~lines 307-309 per CONTEXT.md.

**Recommended fix** (Claude's discretion per D-06/D-07, tune visually):
```css
.contact-page__detail {
  padding: clamp(6px, 1.1vh, 12px) var(--space-sm); /* or --space-md, tune against real render */
}
.contact-page__detail::before {
  inset: 0 calc(var(--space-sm) * -1); /* negative-inset compensation so the
    fill still reaches the row's true edges while only the text (inside
    .contact-page__detail-inner / .contact-page__value, both position:
    relative; z-index: 1 per lines 167-169 and 196-198) gets the padding's
    breathing room */
}
```
Note `.contact-page__detail` has `overflow: hidden` (line 149) — verify the negative-inset `::before` doesn't get clipped by that; may need to adjust `overflow` scope or accept the fill only extending to the padding-box rather than true row edge, per D-07's "verify visually which reads better."

**No test file found** for this component.

---

## Shared Patterns

### Astro `:global()` full-selector-wrap convention
**Source:** `src/components/EditionsOverviewBody.astro` lines 127-129, 142-144, 174-175 (correct shape, incidental) vs. lines 88-101 (broken shape, being fixed)
**Apply to:** EDN-09 only — the rule to internalize for any future cross-component `:global()` targeting anywhere in the codebase: wrap the ENTIRE selector chain, not just a leading class/state prefix, whenever the trailing selector targets an element NOT rendered by the current component's own template.

### Design-token spacing scale
**Source:** `BaseLayout.astro` ~lines 307-309 (`--space-xs: 4px`, `--space-sm: 8px`, `--space-md: 16px`); consumed at `Button.astro` lines 41-45, `ContactForm.astro` lines 302/312, `Input.astro` line 58
**Apply to:** CONT-03 — use `var(--space-sm)` or `var(--space-md)`, not a raw pixel value, for the new horizontal padding.

### `overflow-x: clip` scoping discipline (do-not-repeat history)
**Source:** `PageTitleHeader.astro` lines 41-65 (comment + rule)
**Apply to:** UI-01 — any new overflow/bleed CSS must stay scoped to `.page-title-header` (or a wrapping element that is NOT an ancestor of About's sticky hero or `DetailHero`'s sticky pin), never touch `html`/`body` `overflow-x`.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `PageTitleHeader.astro` full-bleed halftone mechanism | component | transform (CSS layout) | No existing full-bleed/negative-margin-past-container CSS technique exists anywhere in the codebase (`Lightbox.astro`'s `100vw`/`100vh` usage is a `position: fixed` overlay, not a bleed-past-a-static-flow-ancestor technique, so it does not transfer directly). Plan must design this fix from CONTEXT.md's D-03/D-06 guidance and standard `calc(50% - 50vw)` centering technique, not an in-repo precedent. |

## Metadata

**Analog search scope:** `src/components/*.astro`, `src/pages/**/*.astro` (grep for `:global(`, `100vw`, `50vw`, `calc(50%`, `--space-sm`/`--space-md` padding usage)
**Files scanned:** `EditionsOverviewBody.astro`, `PageTitleHeader.astro`, `ContactPageBody.astro`, `SiteHeader.astro`, `Button.astro`, `ContactForm.astro`, `Input.astro`, `AboutPageBody.astro`, `DetailHero.astro`, `HomeCarousel.astro`, `EditionDetailBody.astro`, `GalleryDetailBody.astro`, `Lightbox.astro`, `404.astro` (grep-only pass on several of these)
**Pattern extraction date:** 2026-08-03
