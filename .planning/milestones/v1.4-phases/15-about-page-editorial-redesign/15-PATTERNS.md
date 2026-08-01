# Phase 15: About Page Editorial Redesign - Pattern Map

**Mapped:** 2026-07-29
**Files analyzed:** 3 (1 modified component, 2 possibly-touched call sites; plus a mandatory sketch precedent)
**Analogs found:** 3 / 3

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `src/components/AboutPageBody.astro` | component (page body) | request-response (SSG, props-in → markup-out) | `src/components/ContactPageBody.astro` (header integration) + `src/components/DetailHero.astro` (scroll-reveal mechanism) + `src/components/EditionsOverviewBody.astro` (row-list option for D-07) | role-match (composite: no single file covers both header-integration AND scroll-reveal AND sections-layout) |
| `src/pages/about.astro` | route (locale entry point) | request-response (build-time Sanity fetch → props) | `src/pages/en/about.astro` (twin) | exact (only check if `Props` interface changes) |
| `src/pages/en/about.astro` | route (locale entry point) | request-response | `src/pages/about.astro` (twin) | exact |
| (no new files — sketch phase only) | — | — | `.planning/sketches/013-contact-page-composition/` process; `.planning/sketches/005-edition-hero-scroll-reveal/` mechanism | exact (process + mechanism precedent) |

No new component files are implied by CONTEXT.md/UI-SPEC — this phase is a redesign-in-place of `AboutPageBody.astro`, reusing `PageTitleHeader.astro` unmodified and porting (not calling) `DetailHero.astro`'s scroll mechanism.

## Pattern Assignments

### `src/components/AboutPageBody.astro` (component, request-response)

This file is edited, not replaced. Three separate patterns from three separate analogs must be merged into it.

#### 1. Header integration — analog `src/components/ContactPageBody.astro`

**Import + call pattern** (`src/components/ContactPageBody.astro` lines 12-13, 44-45):
```astro
import PageTitleHeader from './PageTitleHeader.astro';
...
<div class="contact-page">
  <PageTitleHeader heading="Contact" headingId="contact-title" intro={intro} />
```

Apply to About as:
```astro
import PageTitleHeader from './PageTitleHeader.astro';
...
<article class="about-page">
  <PageTitleHeader heading={heading} headingId="about-title" intro="" />
```
- `intro=""` per D-01 (the `intro` prop stays unused/empty — see `PageTitleHeader.astro` interface, line 20, `intro: string` required, so pass empty string not undefined).
- Per-page accent scoping pattern (`ContactPageBody.astro` line 112): `.contact-page { --color-accent: var(--color-ink); }` — Contact overrides the header's pink accent to ink for its own page. About's UI-SPEC keeps the default pink accent (reserved for the eyebrow dot, and optionally the D-05 reveal's format-line underline) — do **not** copy this override into `.about-page`.
- Delete `.about-page__eyebrow` and its markup (`AboutPageBody.astro` current lines 40, 109-117) — `PageTitleHeader` now owns the eyebrow.
- Delete the now-dead `.about-page h1` rule (current lines 119-126, `--editorial-page-title-size`) once `PageTitleHeader`'s own `h1` (clamp 64-140px) supersedes it — per UI-SPEC Typography table.

#### 2. Pinned scroll-reveal hero — analog `src/components/DetailHero.astro` (port the mechanism, do not call the component)

**Do not import/call `DetailHero.astro` directly** — its `Props`/markup assume a title/format/lightbox-trigger reveal panel that doesn't fit About (per UI-SPEC Component Reuse Contract). Port a smaller version of its scroll-driver into a new scoped `<script>` in `AboutPageBody.astro`.

**Core driver pattern to port verbatim** (`DetailHero.astro` lines 165-282):
```typescript
function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
// ... query elements via document.querySelector<HTMLElement>
// ... REVEAL_DISTANCE-driven onProgress(t) writing inline styles
function computeProgress(): number {
  return clamp01(-track!.getBoundingClientRect().top / REVEAL_DISTANCE);
}
function onScroll() {
  if (rafId !== null) return;
  rafId = requestAnimationFrame(() => {
    rafId = null;
    onProgress(computeProgress());
  });
}
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const desktop = matchMedia('(min-width: 768px)');
function setup() {
  if (reduceMotion.matches || !desktop.matches) {
    // detach scroll listener, clearInlineStyles()
  } else {
    // attach scroll listener, run onProgress(computeProgress()) once
  }
}
setup();
reduceMotion.addEventListener('change', setup);
desktop.addEventListener('change', setup);
// debounced resize -> setup() (lines 278-282)
```

**`clearInlineStyles()` pattern** (lines 221-238) — must be ported so CSS media-query end-states fully control layout once the driver deactivates (reduced-motion or mobile) — this is the single most important gotcha: without it, stale inline styles from a previous desktop run outlive the `matchMedia` state change.

**Sticky pin CSS pattern** (lines 417-429):
```css
.detail-hero {
  position: relative;
  height: calc(100svh + 900px); /* track height = viewport + REVEAL_DISTANCE-ish */
  background: var(--color-ink);
}
.detail-hero__pin {
  position: sticky;
  top: 0;
  height: 100svh;
  overflow: hidden;
  background: var(--color-ink);
}
```
About's hero photo is NOT full 100svh page-hero (it sits mid-page, below the header/bio) — the track height and `REVEAL_DISTANCE` need new, smaller values sized to About's shrink distance, not copied literally. Keep the same *relationship* (track height = pinned height + reveal distance).

**`prefers-reduced-motion` settled end-state CSS pattern** (lines 654-690):
```css
@media (prefers-reduced-motion: reduce) and (min-width: 768px) {
  .detail-hero { height: 100svh; }
  .detail-hero__pin { position: relative; height: 100svh; }
  .detail-hero__photo { right: 45%; } /* final shrink width, hardcoded */
  .detail-hero__scrim { opacity: 0; }
  .detail-hero__reveal { opacity: 1; transform: translateY(-50%); }
}
```
This is the exact convention to replicate: settled end-state expressed purely in CSS under the combined media query, no JS dependency.

**Mobile static-band CSS pattern** (lines 696-746) — `@media (max-width: 767px)`: `position: relative` (no sticky), fixed/auto height, reveal panel shown settled, no scroll-hint. About's D-06 requirement ("today's treatment" = the current `.about-page__exhibition` static full-bleed band) maps directly onto this precedent — apply regardless of motion preference, matching `DetailHero.astro`'s own comment "Applies regardless of motion preference."

**`<noscript>` fallback pattern** (lines 150-157):
```astro
<noscript>
  <style is:inline>
    .detail-hero__reveal { opacity: 1 !important; transform: none !important; }
  </style>
</noscript>
```
Port this convention for whatever reveal panel D-05 resolves into (if any) — anything gated by JS-driven opacity:0 needs a `<noscript>` escape hatch.

**Focus-visible convention** (line 447-450, reused per UI-SPEC Motion & Accessibility Contract):
```css
.detail-hero__trigger:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: var(--focus-ring-offset);
}
```
Apply to any new focusable element the D-05 resolution introduces (e.g. an anchor into section 01).

**What NOT to port from `DetailHero.astro`:** the lightbox `<button data-gallery-thumb>` trigger, the `<svg>` expand icon, the `overlay-title`/`scroll-hint` bounce affordance, and the entire upward-overscroll-to-return-home gesture (lines 286-414) — all explicitly out of scope per UI-SPEC ("No new scroll-jacking gesture... in scope for this phase").

#### 3. Numbered sections — analog `src/components/EditionsOverviewBody.astro` (only if D-07 resolves to stacked/row-list; the current two-column grid in `AboutPageBody.astro` itself is the analog if D-07 resolves to a restyled two-column)

**Row-list pattern** (`EditionsOverviewBody.astro` lines 44-58):
```astro
<div class="editions-index">
  {tiles.map((tile, idx) => {
    const label = `${heading.replace(/s$/, '')} ${String(idx + 1).padStart(2, '0')}`;
    return (
      <a class="editions-index__row" href={tile.href} ...>
        <span class="editions-index__number">{label}</span>
        <h2 class="editions-index__title">{tile.title}</h2>
        ...
      </a>
    );
  })}
</div>
```
About's two existing sections (`.about-page__section`, current lines 72-78 of `AboutPageBody.astro`) are static (no map over an array — only 2 hardcoded sections), so this analog contributes the *visual rhythm* (full-width stacked rows with a leading index number, hairline-bordered) rather than the iteration mechanics. About should NOT introduce a data-array/map where two hardcoded `<section>` blocks already work — that would be unwarranted refactoring beyond the redesign's scope.

**Current two-column pattern (fallback analog if D-07 keeps two-column):** `AboutPageBody.astro` lines 165-178 (`.about-page__sections` grid, `.about-page__section` two-column-per-row: `40px minmax(0, 1fr)`) — this is the file's own pre-existing pattern, already using the correct tokens (`--editorial-page-column-gap`, `--border-hairline`); a restyle only needs rhythm/spacing adjustments to match the new composition, not a structural rewrite.

---

### `src/pages/about.astro` / `src/pages/en/about.astro` (route, request-response)

**Analog:** each other (byte-identical twin pattern).

**Current call pattern** (`src/pages/about.astro` line 38, `src/pages/en/about.astro` line 37):
```astro
<AboutPageBody
  heading={...}
  studioPracticeHeading={...}
  mediumTechniqueHeading={...}
  biography={...}
  practice={...}
  medium={...}
  portraitImage={...}
  portraitAlt={...}
  exhibitionImage={...}
  exhibitionAlt={...}
/>
```
If D-05's resolution needs a new prop hook (e.g., a boolean/label for "reveal into section 01"), both files must be updated identically — no i18n/data-fetch logic changes are needed if the new prop is a fixed structural flag rather than new translated copy (UI-SPEC forbids new copy). If a new prop is only a computed/derived value (not new translated text), it can be computed inline in each `.astro` frontmatter from existing resolved strings.

---

## Shared Patterns

### PageTitleHeader integration
**Source:** `src/components/ContactPageBody.astro` lines 12-13, 44-45
**Apply to:** `AboutPageBody.astro`
```astro
import PageTitleHeader from './PageTitleHeader.astro';
<PageTitleHeader heading={heading} headingId="about-title" intro="" />
```

### Scroll-driven pin+shrink reveal
**Source:** `src/components/DetailHero.astro` lines 165-282 (driver), 654-690 (reduced-motion CSS), 696-746 (mobile CSS), 150-157 (`<noscript>`)
**Apply to:** `AboutPageBody.astro`'s exhibition-photo block, scoped to a new set of class names (do not reuse `.detail-hero*` classes — they are a different component's scoped styles)
- Dual gate: `matchMedia('(prefers-reduced-motion: reduce)')` AND `matchMedia('(min-width: 768px)')`
- `clearInlineStyles()` whenever the driver deactivates
- Debounced `resize` re-running `setup()`

### CSS custom properties / editorial tokens
**Source:** `src/layouts/BaseLayout.astro` `:root` (referenced throughout `AboutPageBody.astro`, `ContactPageBody.astro`, `DetailHero.astro`)
**Apply to:** all touched styles — `--editorial-page-max`, `--editorial-page-padding-inline`, `--editorial-page-padding-block`, `--border-hairline`, `--color-ink`, `--color-accent`, `--space-*`, `--text-body-size`, `--editorial-page-lead-size`/`-leading`, `--editorial-page-section-title-size`/`-leading`, `--focus-ring-offset`. Do not introduce new ad hoc values — UI-SPEC is explicit that this phase touches zero new tokens.

### Breakpoints
**Source:** `AboutPageBody.astro` (current `767px`/`480px`), `DetailHero.astro` (`768px`/`767px`)
**Apply to:** all new responsive rules — reuse `767px` as the mobile cutover (matching both `AboutPageBody.astro`'s own existing breakpoint and `DetailHero.astro`'s `max-width: 767px` block), and `768px` only where mirroring `DetailHero.astro`'s `matchMedia`/`min-width` desktop gate exactly (JS gate and `view-transition-name` media query both use 768px in `DetailHero.astro`). Do not reconcile `PageTitleHeader.astro`'s own internal `760px` breakpoint — explicitly out of scope per UI-SPEC.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| Sketch deliverable (`.planning/sketches/0XX-about-page-*/`, name TBD by sketch phase) | design artifact, not source | n/a | Not a codebase file — governed by the sketch-process precedent (`.planning/sketches/013-contact-page-composition/README.md`) rather than a code analog. Planner should schedule a sketch-exploration step before the implementation plan, per UI-SPEC's Sketch Exploration Requirement. |

## Metadata

**Analog search scope:** `src/components/`, `src/pages/about.astro`, `src/pages/en/about.astro`, `src/layouts/BaseLayout.astro` (tokens only, not re-read in full — already summarized in UI-SPEC.md)
**Files scanned:** `AboutPageBody.astro`, `ContactPageBody.astro`, `DetailHero.astro`, `PageTitleHeader.astro`, `EditionsOverviewBody.astro`, `about.astro`, `en/about.astro`
**Pattern extraction date:** 2026-07-29
</content>
