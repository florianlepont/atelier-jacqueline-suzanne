# Phase 20: Mobile Navigation & Accent Color - Context

**Gathered:** 2026-08-03
**Status:** Ready for planning

<domain>
## Phase Boundary

On phone-width viewports (≤767px, the project's existing mobile breakpoint — see Code Context), the **homepage only**:
1. Replaces the desktop header bar with a self-contained hamburger nav menu, with the language switcher folded inside it (HOME-13).
2. Shows a per-visit randomly-picked accent color drawn from existing per-gallery `heroColor` values, applied as the STARTING accent only (HOME-16).

Desktop/tablet (≥768px) header, language-switcher placement, and accent-color behavior stay pixel-for-pixel and behaviorally unchanged. This phase does NOT touch: the carousel/grid toggle control itself (stays visible on mobile exactly as today — that's Phase 21's job), any other page's header (About/Contact/Éditions/gallery/édition detail all keep their current inline mobile header — HOME-13's requirement text is explicitly scoped to "the homepage"), or the future scroll-driven view (Phase 21, which will consume this phase's accent-color mechanism).

</domain>

<decisions>
## Implementation Decisions

### Header Architecture
- **D-01:** Extend the shared `SiteHeader.astro` with an opt-in mobile-nav mode (e.g. a new prop) rather than building separate, duplicated header markup inside `HomeCarousel.astro`. Only the homepage call site(s) (`src/pages/index.astro` / `src/pages/en/index.astro`, via `HomeCarousel.astro`) opt in; every other page's `<SiteHeader>` call keeps rendering the current inline nav unchanged. User's explicit choice, accepting that `SiteHeader.astro` (already the site's proven per-page-regression-risk hotspot — see Code Context) gains one more responsibility, in exchange for a single source of truth for header markup/styles rather than duplicating `.nav-link`/`.site-nav` CSS.

### Mobile Menu Visual Style
- **D-02:** Full-screen takeover panel on open (not an off-canvas side drawer, not a beneath-header dropdown) — reference image provided by the user: `20-mobile-menu-reference.png` (saved in this phase directory). Key elements from the reference to match:
  - Closed state: site logo/wordmark stays visible top-left in the header; a hamburger icon (☰) sits top-right.
  - Open state: same logo position persists top-left; the hamburger icon flips to an X (close) in the same spot; the menu fills the entire viewport (white/light background, matching the reference).
  - Nav links render as a large, bold, vertically-stacked, centered list — not a small inline menu.
  - A secondary, visually-smaller element sits near the bottom of the full-screen panel (in the reference: a contact handle; here: the Instagram link — see D-04).
  - The reference's top-right halftone-dot texture accent is a nice resonance with this site's OWN existing halftone-dot treatment (already used on Contact/About/Éditions per Phase 19/UI-01) — worth considering reusing that exact existing texture/mechanism in the open-menu panel rather than inventing a new decorative element, though this is Claude's discretion (see below).
- **D-03:** Open/closing needs a "nice," deliberate transition/animation (user's explicit ask) — not an instant show/hide. Exact easing/timing/technique is Claude's discretion (see below).

### Menu Contents & Hierarchy
- **D-04:** Within the full-screen menu, two hierarchy tiers:
  - **Primary (big stacked list, equal weight):** Éditions, About, Contact, and the language switcher (EN⇄FR) — the language switcher becomes one more full-size stacked item, not a small secondary control like it is today.
  - **Secondary (small, near the bottom):** the Instagram link — moves out of the primary nav-link row entirely and sits alone in the reference's "small text near the bottom" position.

### Accent Color Scope (HOME-16)
- **D-05:** The per-visit random accent color ONLY randomizes the STARTING/initial accent shown on page load — it picks a random gallery's `heroColor` instead of always defaulting to the first gallery's. It does NOT replace or freeze the existing per-gallery-follows-carousel-position accent behavior: swiping/scrolling through the carousel (and toggling grid mode) continues to update `--current-accent` per gallery exactly as it does today, unchanged. This is a deliberate reversal of the "fixed for the whole visit" framing in PROJECT.md's original bullet — the user chose the narrower, less-disruptive interpretation when the trade-off was made explicit.
- Note for the researcher/planner: because this is a 100% static build (Astro static output, zero request-time compute — see CLAUDE.md), the random pick MUST happen client-side (JS) at page-load time, from the gallery list already present in the rendered page's data — never baked in at build time (which would freeze one color for all visitors until the next deploy).

### Open/Close Mechanics
- **Claude's Discretion:** Whether to reuse the site's existing native `<dialog>` + `.showModal()` pattern (established in `Lightbox.astro` for free focus-trapping + Escape-to-close, with an explicit code comment against hand-rolling a custom modal handler) or a plain toggled `<nav>`/`<div>` element with manual focus/Escape handling. User explicitly deferred this to planning. Given D-02's full-screen (not centered-modal) requirement, verify `<dialog>` can be styled edge-to-edge without fighting browser default centering/sizing before committing to it.
- **Claude's Discretion:** Exact transition/animation technique and timing for open/close (D-03).
- **Claude's Discretion:** Whether the open-menu panel reuses the site's existing halftone-dot texture mechanism verbatim or a new decorative treatment (D-02's texture note).
- **Claude's Discretion:** Hamburger↔X icon treatment — simple two-state icon swap vs. a morph animation (the existing carousel/grid mode-toggle in `HomeCarousel.astro` already has a precedent for a morphing icon button, `.home-toggle__morph` — worth considering for visual consistency, but not required).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/REQUIREMENTS.md` §"v1.6 Requirements (Mobile Experience Redesign)" — HOME-13, HOME-16 full requirement text
- `.planning/ROADMAP.md` §"Phase 20: Mobile Navigation & Accent Color" — Goal, Depends-on, Success Criteria
- `.planning/PROJECT.md` §"Current Milestone: v1.6" — full v1.6 target-feature list and mobile-only/desktop-unchanged framing

### User-provided design reference
- `.planning/phases/20-mobile-navigation-accent-color/20-mobile-menu-reference.png` — full-screen mobile nav reference the user shared during discussion (D-02, D-04); shows closed/open header states, big stacked nav list, and a secondary bottom element

No other external specs/ADRs exist for this phase — requirements and design direction are fully captured in the Decisions and Code Context sections above/below.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/SiteHeader.astro` — the shared header component every page renders (About/Contact/Éditions/gallery/édition detail via `BaseLayout.astro`; homepage via `HomeCarousel.astro` directly). Currently renders `.site-nav` (Éditions/About/Contact/Instagram `.nav-link`s), a named `<slot name="extra">` (used only by the homepage's carousel/grid mode-toggle button), and `<LanguageSwitcher />` inline. D-01 extends this component with an opt-in mobile-nav mode.
- `src/components/LanguageSwitcher.astro` — self-contained EN/FR switcher with its own cookie-setting script (`ajs_locale` cookie, base-path-aware). Needs to be restyled as a big list item per D-04, but its underlying link/cookie logic is unchanged.
- `src/components/Lightbox.astro` — the project's one existing overlay/modal pattern: native `<dialog>` + `.showModal()` for free focus-containment + Escape-to-close (see lines ~1-13, ~172, ~189-253 for the close-path/backdrop/return-focus pattern). Explicit code comment warns against hand-rolling a custom modal-focus-cycling or Escape handler — read before deciding the open/close mechanic.
- `src/components/HomeCarousel.astro` — renders `<SiteHeader variant="transparent">` with the carousel/grid mode-toggle passed via the `extra` slot (~line 123-164). Also owns the existing accent-color mechanism: `--current-accent`/`--current-accent-text` CSS custom properties, set both at initial render (`firstGallery.heroColor ?? 'var(--color-accent)'`, ~line 119) and dynamically per-gallery in its `render()` function (~line 655-726) as the visitor swipes/scrolls. D-05's random-starting-color pick modifies the INITIAL value only, not the `render()` per-gallery update logic.
- `src/pages/index.astro` / `src/pages/en/index.astro` — build galleries data including `normalizeHeroColor(gallery.heroColor)` per gallery already (see `index.astro` ~line 35); this list is exactly what the client-side random pick needs to draw from.

### Established Patterns
- Mobile breakpoint convention: `max-width: 767px` / `min-width: 768px` is the dominant, already-established phone-vs-tablet/desktop boundary across `SiteHeader.astro`, `HomeCarousel.astro`, and `BaseLayout.astro` — no separate tablet-only breakpoint exists in this codebase. "Phone-width" in this phase's success criteria maps directly to this existing convention.
- Global CSS custom properties (`--color-accent`, `--color-ink`, `--space-*`, `--tap-target-min: 44px`) are defined in `src/layouts/BaseLayout.astro` and consumed everywhere via `var()` — no separate design-tokens file.
- Shared-component regression history: `SiteHeader.astro`/`PageTitleHeader.astro`-class components have broken other pages twice before (Phase 16's site-wide `overflow-x` revert; Phase 19's `:global()` scope-hash bug) — both times because the FIX targeted one page but the SHARED component/CSS affected others. D-01 knowingly accepts this risk class for `SiteHeader.astro` again; the planner should scope the new mobile-nav prop/CSS so it is inert (no visual/behavioral change) whenever the prop isn't explicitly passed `true`, and Phase 20's own success criterion 4 (desktop/tablet + every-other-page regression check) should get the same kind of proactive regression-net treatment Phase 19's D-05 used.

### Integration Points
- `HomeCarousel.astro`'s existing `<SiteHeader ... ><... slot="extra">...</SiteHeader>` call site is where the new mobile-nav prop gets passed `true` (or equivalent) — the two other-locale-identical call sites are `src/pages/index.astro` (fr) and `src/pages/en/index.astro` (en), both of which render `HomeCarousel`, not `SiteHeader` directly.
- Every non-homepage page renders `<SiteHeader>` via `BaseLayout.astro` — these call sites must NOT pass the new mobile-nav prop, keeping their current inline mobile header exactly as-is.

</code_context>

<specifics>
## Specific Ideas

- The user provided a concrete visual reference (a Dribbble mobile-portfolio-site mockup, saved as `20-mobile-menu-reference.png`) for the open-menu full-screen takeover style: persistent top-left logo, hamburger↔X icon swap top-right, large centered stacked nav list, small secondary line near the bottom, and a corner halftone-dot texture accent.
- User explicitly asked for "a nice transition opening/closing and animation" — this should not be an instant/jarring open, but exact technique is open (D-03).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. (The carousel/grid toggle removal and the full scroll-driven view are already correctly scoped to Phase 21, not raised as new scope here.)

</deferred>

---

*Phase: 20-Mobile Navigation & Accent Color*
*Context gathered: 2026-08-03*
