# Phase 7: Homepage Quick Fixes & Mobile Hero Correctness - Pattern Map

**Mapped:** 2026-07-13
**Files analyzed:** 1 (single file modified in three places)
**Analogs found:** 3 / 3 (all analogs are in-file precedent + one sibling component; no cross-codebase search needed — this phase is entirely self-contained edits to `HomeCarousel.astro`, with `BaseLayout.astro` and `LanguageSwitcher.astro` as reference-only sources per CONTEXT.md's canonical_refs)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `src/components/HomeCarousel.astro` — `.home-nav` (add Instagram `<a>`, HOME-04) | component (markup + scoped CSS) | request-response (static link, no data flow) | `src/layouts/BaseLayout.astro:143-150` (footer Instagram link) | exact (same link semantics, different visual treatment) |
| `src/components/HomeCarousel.astro` — `.home-toggle` (square border fix, HOME-05) | component (scoped CSS, box-model fix) | event-driven (click toggles `data-display-mode`) | `src/components/LanguageSwitcher.astro:36-44` (`.switcher-link` tap-target pattern) + in-file `.home-toggle` itself (`HomeCarousel.astro:710-763`) | exact (same file, established sibling pattern for tap-target-vs-visual-size split) |
| `src/components/HomeCarousel.astro` — `.home-hero__photo` / global view-transition block (mobile regression fix, HOME-06) | component (scoped + global CSS, layout/timing fix) | event-driven (View Transitions API lifecycle) | In-file precedent: `06-01-SUMMARY.md`'s `100svh` fix (already implemented at `HomeCarousel.astro:1276-1278`) vs. the `view-transition-name` wiring added after it (`HomeCarousel.astro:888`, `1033`, `1374+`) | exact (regression against the file's own prior working state — no external analog needed) |

All three fixes are edits within a single existing file; there is no "new file" creation in this phase, so the classification above maps *regions* of `HomeCarousel.astro` to their closest existing precedent (either elsewhere in the same file or in a sibling component), per CONTEXT.md's explicit analog pointers.

## Pattern Assignments

### 1. Instagram nav link (HOME-04)

**Analog A — link semantics/copy source:** `src/layouts/BaseLayout.astro:143-150`

```astro
<a
  href="https://www.instagram.com/ajs_romanelepont/"
  target="_blank"
  rel="noopener noreferrer"
  class="nav-link"
>
  Instagram<span class="sr-only">{instagramNewTabHint}</span>
</a>
```
Hint variable (`BaseLayout.astro:76`):
```astro
const instagramNewTabHint = locale === 'en' ? ' (opens in new tab)' : ' (nouvelle fenêtre)';
```
Copy this `href`/`target`/`rel`/`sr-only` hint pattern verbatim into the new `HomeCarousel.astro` Instagram link (D-05). `HomeCarousel.astro` does not currently compute `instagramNewTabHint` itself — it will need to be added as a frontmatter const in `HomeCarousel.astro` (same locale-conditional ternary, same two exact strings) since this component doesn't import from `BaseLayout.astro`.

**Analog B — nav link markup/class + icon-svg approach:** `HomeCarousel.astro:86-89` (existing nav) and `810-829` (inline SVG/CSS-grid icon convention)

```astro
<nav class="home-nav" aria-label="Primary">
  <a href={aboutHref} class="home-nav-link">{aboutLabel}</a>
  <a href={contactHref} class="home-nav-link">{contactLabel}</a>
</nav>
```
New Instagram link becomes a third sibling `<a class="home-nav-link">` here, per D-02 (positioned after Contact). Reuse `.home-nav-link`'s existing CSS as-is (`HomeCarousel.astro:710-728`):
```css
.home-nav-link,
.home-toggle {
  display: inline-flex;
  align-items: center;
  font-size: 14px;
  font-weight: var(--weight-regular);
  line-height: 1.5;
  color: inherit;
  text-decoration: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--space-xs) var(--space-sm);
  min-height: var(--tap-target-min);
}
```
No border/box needed (D-04) — this rule already gives `.home-nav-link` its full treatment; the Instagram `<a>` needs no new CSS beyond the class itself plus the inline SVG glyph. Follow the existing dependency-free inline-SVG/`currentColor` convention exemplified by `.home-toggle__morph`'s CSS-grid icon (`HomeCarousel.astro:810-829`) — for Instagram, an actual `<svg>` with `stroke="currentColor"` (not a CSS-grid trick, since it needs to depict a recognizable glyph, not an abstract morph) sized ~20×20.

**Mobile fit re-measurement anchor** (D-03), `HomeCarousel.astro:1232-1249`:
```css
@media (max-width: 767px) {
  .home-header {
    flex-wrap: wrap;
    gap: var(--space-sm);
  }
  .home-nav {
    margin-left: 0;
  }
```
This comment block documents the exact prior pixel budget (346px used of 361px available for 4 items). Adding a 5th item will require the same live re-measurement methodology — re-read/update this comment when adjusting.

---

### 2. Toggle square border (HOME-05)

**Analog — tap-target-min-vs-visual-size split:** `src/components/LanguageSwitcher.astro:36-44`

```css
.switcher-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px; /* WCAG 2.5.5 tap-target floor, applied via padding not font-size */
  padding: 8px;
  color: var(--color-accent);
  text-decoration: none;
}
```
This is the direct template for D-08's "tight visible box, 44px invisible tappable area" split — except the toggle fix requires an actual **nested-element** structure (button = invisible tap box, inner `<span>` = visible square), not just a padding trick, because the visible box needs to be smaller than 44px while the tap target stays at 44px in both dimensions (LanguageSwitcher only needs the *height* floor, since its width is naturally wide enough from the "FR"/"EN" text).

**Current buggy state to modify** — `HomeCarousel.astro:710-763`:
```css
.home-nav-link,
.home-toggle {
  display: inline-flex;
  align-items: center;
  font-size: 14px;
  ...
  padding: var(--space-xs) var(--space-sm);
  min-height: var(--tap-target-min);
}
...
.home-toggle {
  border: 1.5px solid currentColor;
  padding: var(--space-xs);
}

.home-toggle:hover,
.home-toggle:focus-visible {
  background-color: currentColor;
}

.home-toggle:hover .home-toggle__morph-cell,
.home-toggle:focus-visible .home-toggle__morph-cell {
  background-color: var(--current-accent, var(--color-accent));
}

.home[data-display-mode='grid'] .home-toggle:hover .home-toggle__morph-cell,
.home[data-display-mode='grid'] .home-toggle:focus-visible .home-toggle__morph-cell {
  background-color: var(--color-dominant);
}
```
Markup to wrap (`HomeCarousel.astro:90-107`):
```astro
<button type="button" class="home-toggle" ...>
  <span aria-hidden="true" class="home-toggle__morph">
    <span class="home-toggle__morph-cell"></span>
    ... (6 cells total)
  </span>
</button>
```
Per D-06/UI-SPEC's "Structural fix" section: insert a new `<span class="home-toggle__box" aria-hidden="true">` between `<button class="home-toggle">` and `<span class="home-toggle__morph">`, move `border`/hover-background there, add explicit `min-width`/`min-height: var(--tap-target-min)` to `.home-toggle` itself, and give `.home-toggle__box` an explicit `width: 28px; height: 28px;`. The pulse animation (`HomeCarousel.astro:793-796`, `.home-toggle:not(.home-toggle--used)`) should retarget `transform: scale(...)` onto `.home-toggle__box` per the UI-SPEC's recommendation.

---

### 3. Mobile hero regression fix (HOME-06)

**Baseline "known-good" pattern (Phase 6's 100svh fix)** — already in the file, `HomeCarousel.astro:1276-1278`:
```css
.home-hero__photo {
  min-height: 100svh;
}
```
paired with the base rule at `HomeCarousel.astro:862-889`:
```css
.home-hero__photo {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  max-height: 100vh;
  overflow: hidden;
  view-transition-name: ajs-hero-morph;
}
```

**Suspect pattern (added after Phase 6, by quick task 260713-jfz)** — the `view-transition-name` assignment on the same element (line 888 above) plus the accent panel's own name at `HomeCarousel.astro:1033`:
```css
.home-hero__accent {
  ...
  view-transition-name: ajs-accent-panel;
  ...
}
```
and the global stacking/timing block, `HomeCarousel.astro:1374-1435+`:
```css
<style is:global>
  ::view-transition-group(ajs-hero-morph) {
    z-index: 1;
  }
  ::view-transition-group(ajs-header),
  ::view-transition-group(ajs-accent-panel) {
    z-index: 2;
  }
  @media (prefers-reduced-motion: no-preference) {
    ::view-transition-old(root),
    ::view-transition-new(root),
    ::view-transition-group(ajs-hero-morph) {
      animation-duration: 420ms;
      animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    }
    ...
  }
</style>
```

Per D-10/D-12, the fix should test disabling/reverting just the `view-transition-name` on `.home-hero__photo` (and/or `.home-hero__accent`) on mobile viewports to confirm the hypothesis, then find a CSS/timing fix that keeps the morph active on mobile — not a `pointer:fine` gate. There is no external analog for this: the "correct" pattern is the file's own pre-jfz state (100svh fix alone, no view-transition-name), which must be reconciled with the newer feature rather than reverted wholesale.

## Shared Patterns

### Tap-target-min vs. visible-size split
**Source:** `src/components/LanguageSwitcher.astro:36-44` (`.switcher-link`), reused for `.home-toggle`'s new `.home-toggle__box` split.
**Apply to:** `.home-toggle` restructure (HOME-05).
```css
min-height: 44px; /* WCAG 2.5.5 tap-target floor, applied via padding not font-size */
```

### Dependency-free inline glyph convention
**Source:** `.home-toggle__morph` CSS-grid icon, `HomeCarousel.astro:810-829` — "no icon library" constraint.
**Apply to:** New Instagram `<svg>` glyph (HOME-04) — must be hand-authored, `currentColor`/`stroke="currentColor"`-based, no external icon dependency.

### `currentColor` mode-flip via `.home[data-display-mode='...']`
**Source:** `HomeCarousel.astro:700-708`, `760-763` — carousel vs. grid mode color overrides for switcher links and toggle hover states.
**Apply to:** Instagram link's color (inherits automatically, no new rule needed) and toggle box's hover-invert (must move with the border to `.home-toggle__box`, HOME-05 D-06.3).

### Locale-conditional sr-only hint string
**Source:** `BaseLayout.astro:76` (`instagramNewTabHint`).
**Apply to:** New Instagram link in `HomeCarousel.astro` — copy the exact ternary and both exact strings (`' (opens in new tab)'` / `' (nouvelle fenêtre)'`), do not re-derive new copy.

## No Analog Found

None — CONTEXT.md's canonical_refs and code_context sections already identified all necessary analogs (in-file precedent + `LanguageSwitcher.astro` + `BaseLayout.astro`), and this phase touches only `HomeCarousel.astro`, so no additional codebase-wide search was needed.

## Metadata

**Analog search scope:** `src/components/HomeCarousel.astro` (full read of relevant regions: lines 60-115, 700-930, 1010-1050, 1220-1435), `src/components/LanguageSwitcher.astro` (full file, 55 lines), `src/layouts/BaseLayout.astro` (lines 60-160)
**Files scanned:** 3
**Pattern extraction date:** 2026-07-13
