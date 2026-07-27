# Phase 6: Homepage View-Mode Toggle, Grid Hero & Wordmark Cutout - Context

**Gathered:** 2026-07-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Three tightly-coupled refinements to `src/components/HomeCarousel.astro`, all cosmetic/interaction changes on top of the already-shipped carousel/grid homepage (no new pages, no backend/data changes):

1. Replace the two separate carousel/grid toggle buttons with a single unified toggle.
2. Restructure grid mode so the hero (wordmark + intro) is the first tile of the grid itself, not a separate full-width band above it.
3. Give the "Atelier Jacqueline Suzanne" wordmark a transparent cutout effect (photo visible through the letterforms).

Does not touch checkout/shop/exhibitions (v2, out of milestone scope), Phase 5's OVH domain cutover, or any page other than the homepage (`src/pages/index.astro` / `src/pages/en/index.astro`, rendered via `HomeCarousel.astro`).

</domain>

<decisions>
## Implementation Decisions

### Single unified toggle (HOME-01)
- **D-01:** Replace the two separate `.home-toggle__btn` elements (`data-action="show-carousel"` / `data-action="show-grid"`, currently both always rendered with `is-active` toggling between them) with **one button** whose icon and accessible name flip based on the current display mode — e.g. showing a "switch to grid" icon/label while in carousel mode, and a "switch to carousel" icon/label while in grid mode. Not a segmented two-state switch that shows both options at once — literally one clickable control.
- **D-02:** Because the accessible name now changes with state (unlike Phase 04.3's D-07, which locked static `Carrousel`/`Grille` names on two separate buttons), `tests/e2e/homepage.spec.ts` (lines ~36, 57, 68 — see Code Context) will need updating to query the single button by its current-state label rather than two independent named buttons. This is an intentional, expected test change, not a regression — flag it clearly in the plan rather than treating the old locked-name constraint as still binding.
- **D-03:** The client-side toggle logic in `HomeCarousel.astro`'s `<script>` block (currently manipulating two buttons' `is-active` class in parallel, see Code Context) needs restructuring around one button — same underlying `data-role="home-carousel"` / `.home[data-display-mode]` state model, just one fewer DOM element to manage.

### Grid hero-as-first-tile (HOME-02)
- **D-04:** Remove `.home-grid__intro` as a separate band above `.home-grid__tiles`. The wordmark + intro paragraph become the content of a new first tile inside `.home-grid__tiles` itself, same square (`aspect-ratio: 1/1`) size as every other gallery tile — not spanning multiple columns or otherwise emphasized. Simplest, most literal reading of "becomes the first tile."
- **D-05:** The hero tile's background stays a **solid accent-color background** (matching today's `.home-grid__intro` treatment) — no photo, no cutout-wordmark effect in grid mode. The transparent cutout effect (HOME-03) is scoped to carousel mode only; grid mode's wordmark stays solid-color-panel-on-solid-color-background as it is today, just resized/repositioned into the tile grid.
- **D-06:** The grid hero-tile is **not** a clickable `<a>` like the other tiles (`.home-grid__tile` wraps an `<a href=".../galleries/${slug}">` for real galleries) — it has no gallery to link to. Use a non-link container (e.g. `<div>`) styled identically to `.home-grid__tile` for sizing/grid-placement purposes, but without navigation behavior. Flag this distinction clearly in the plan so it isn't implemented as a dead/empty-href link.

### Wordmark transparent cutout (HOME-03)
- **D-07:** Scope confirmed: applies to the **carousel hero's** wordmark only (`.home-hero__wordmark`, inside `.home-hero__accent`), not the grid hero-tile (see D-05 — grid stays solid-color, no cutout there). This resolves the "at least carousel mode" ambiguity from the milestone-scoping conversation in favor of carousel-only.
- **D-08:** Technique: CSS `background-clip: text` (`-webkit-background-clip: text` for compat) with `color: transparent`, using the currently-displayed gallery's own hero photo (`firstGallery.heroSrc` / the client-rendered current gallery's image, same photo already shown as `.home-hero__img`) as the background positioned/sized to align with the visible portion of that photo behind the accent panel — not a separate/static background image. Since the wordmark currently sits inside `.home-hero__accent`, a **solid accent-colored panel** (`background-color: var(--color-accent)`), achieving a see-through cutout requires removing or making transparent the accent panel's own solid background behind the wordmark specifically (the panel's other content — intro paragraph — can keep its own backing/contrast treatment; only the wordmark needs the photo to show through). Exact CSS approach (e.g. `background-position: -{accent-panel-offset}` to align the clipped photo with the actual photo behind it, vs. a simpler full-bleed-photo-as-text-background approximation) is Claude's Discretion — but must be verified live (screenshot/browser check) that the letters visibly reveal photo detail, not just render as invisible/blank text.
- **D-09:** Font size: increase from the current fixed `32px`/`44px` (see Code Context — Phase 04.3 set 32px, last session's debug fix bumped to 44px) further if needed for legibility of the cutout effect — larger, bolder type reads better with a background-clip:text treatment than small text. Exact value is Claude's Discretion, verified live, but the direction is "larger than the current 44px," building on top of last session's bump rather than reverting it.

### CTA button removal (side effect of D-01)
- **D-10:** Remove `.home-hero__cta` ("Discover other galleries →" button, `data-action="show-grid"`) from the carousel accent panel entirely — redundant now that the single unified toggle (D-01) is the one way to switch modes. The accent panel keeps only the wordmark + intro paragraph after this removal. Also remove the now-unused `ctaLabel` computation and any CSS solely supporting `.home-hero__cta`.

### Claude's Discretion
- Exact icon glyphs for the single toggle button's two states (inline SVG, consistent with the codebase's existing dependency-free icon approach — see the existing carousel/grid SVG icons in the current two-button markup, which can likely be reused/adapted rather than designed from scratch).
- Exact `background-clip: text` alignment technique for the cutout wordmark (D-08).
- Exact enlarged font-size value for the cutout wordmark (D-09), within "larger than 44px."
- Whether `.home-hero__accent`'s layout (padding, positioning) needs adjustment once the CTA button (D-10) is removed and the wordmark grows larger (D-09) — keep it visually balanced.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Homepage component (entire surface being modified)
- `src/components/HomeCarousel.astro` — owns the toggle buttons (D-01–D-03), the carousel accent panel + wordmark + CTA (D-08–D-10), and the grid intro band + tiles (D-04–D-06). Client-side `<script>` block manages display-mode state and per-gallery rendering — read in full before editing, especially the toggle-button event wiring and the `render()` function.
- `.planning/phases/04.3-homepage-refinements-logo-hover-crossfade-to-match-site-chro/04.3-CONTEXT.md` — prior phase's decisions on this same component (D-05 CTA repurposing, D-07 two-button icon toggle with locked names — both being superseded by this phase's D-01/D-10, note explicitly in the plan that these supersede, don't duplicate, 04.3's decisions).
- `.planning/debug/resolved/logo-hover-and-font.md` — this session's debug work already changed the wordmark font to Anton and bumped its size 32px→44px, and reworked the logo hover mechanic (unrelated to the wordmark text itself, but touches the same component's CSS — read to avoid conflicting with the mode-aware chip-color logic it added).

### Tests
- `tests/e2e/homepage.spec.ts` — asserts against the current two-button toggle (locked names, see D-07 of 04.3-CONTEXT.md) and carousel/grid structural roles. Per D-02, the toggle-button assertions need updating for the new single-button state-dependent accessible name; other structural assertions (auto-advance, mobile hero visibility, display-mode data attribute) should keep passing unmodified unless directly affected by D-04's grid restructuring.

### Site chrome (unaffected, for contrast/reference only)
- `src/layouts/BaseLayout.astro` — NOT modified by this phase (its own separate `.logo-mark` hover pattern was already handled in this session's debug work); referenced only if the toggle icon styling needs to match site-wide icon conventions.

**No formal cross-project ADRs/specs** — this phase's requirements (HOME-01/02/03) are fully captured in REQUIREMENTS.md's "v1.1 Requirements (Homepage Refinements)" section and in the Decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable assets
- The current two toggle buttons' inline SVG icons (carousel icon ~line 89-93, grid icon ~line 95-102 in `HomeCarousel.astro`) can likely be adapted into the single flipping-icon button (D-01) rather than designing new glyphs.
- `.home-grid__tile` CSS (`position: relative; aspect-ratio: 1/1; overflow: hidden`) is the exact sizing template the new hero tile (D-04) should match, per `.home-grid__tiles { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0; }` (1 column on mobile via a `@media` override near the end of the style block).

### Established patterns
- Client-side rendering: a hidden `<ul data-role="home-carousel-data">` data island is read once by the `<script>` block into an in-memory `galleries` array; `render()` mutates the DOM on prev/next/auto-advance. The toggle-button restructuring (D-01/D-03) touches this same script's mode-switching logic (`data-action="show-carousel"|"show-grid"` handlers, currently wired to `querySelectorAll` across both old buttons — see lines ~276-296).
- Mode state lives on `.home[data-display-mode='carousel'|'grid']`, driving CSS visibility (`.home-hero` vs `.home-grid`, currently toggled via the `hidden` attribute on `.home-grid` — see line ~129). This mechanism is unaffected by D-01–D-10 and should be preserved.
- `--font-display` resolves to Anton (self-hosted via `@fontsource/anton`, changed this session) — the enlarged cutout wordmark (D-09) should keep using this token, not a different font.

### Integration points
- `HomeCarousel.astro` is invoked by `src/pages/index.astro` / `src/pages/en/index.astro` with a build-time-fetched `galleries` prop — no Sanity client access in the component itself; this phase doesn't touch that boundary.
- The accent panel's `background-color: var(--color-accent)` (inline style, per-gallery accent color cycling — see `firstGallery`/current-gallery accent logic elsewhere in the component) currently backs both the wordmark and intro paragraph; D-08's cutout effect requires decoupling the wordmark's background from this shared accent-color panel while keeping the intro paragraph's own contrast/legibility.

</code_context>

<specifics>
## Specific Ideas

- User's own words: "Unique button to switch from carrousel to grid" (D-01).
- "Improve grid: Hero becomes the first tile of the grid and not a band anymore" (D-04).
- "Improved font 'Atelier Jacqueline Suzanne' -> font become transparent and let see the picture behind. It might mean to change font so that the font is bigger 'larger'" (D-08/D-09) — user's own reasoning connects the transparency effect to needing a larger font for legibility.
- "It can only work on the carrousel effect as the font and the hero are on top of the picture" — user's clarification that the cutout effect is tied to the wordmark sitting directly over a photo, which is true of carousel mode; confirmed via this session's questions that grid mode's hero-tile stays a solid background instead (D-05/D-07).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within the three HOME-01/02/03 requirements scoped into this phase. Broader shop/exhibitions work remains tracked separately in REQUIREMENTS.md's v2 section; Phase 5's domain cutover is a separate, deliberately-deferred phase (see PROJECT.md's v1.1 milestone note).

</deferred>

---

*Phase: 06-homepage-view-mode-toggle-grid-hero-wordmark-cutout*
*Context gathered: 2026-07-12*
