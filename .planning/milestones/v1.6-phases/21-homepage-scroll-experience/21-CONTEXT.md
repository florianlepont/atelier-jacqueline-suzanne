# Phase 21: Homepage Scroll Experience - Context

**Gathered:** 2026-08-04
**Status:** Ready for planning

<domain>
## Phase Boundary

On phone-width viewports (≤767px, the project's existing mobile breakpoint), the homepage replaces the carousel/grid toggle entirely with one continuous scroll-driven view:

1. On first load, a full-screen "Atelier Jacqueline Suzanne" wordmark opens the page.
2. As the visitor scrolls, the wordmark zooms through its letterforms into the first gallery's photo.
3. Scrolling continues as a single sequence of full-screen gallery slides (one photo per gallery), each revealing its title/description as it arrives on screen.
4. Desktop/tablet (≥768px) carousel/grid toggle and both view modes stay pixel-for-pixel and behaviorally unchanged (UI-02).

This phase does NOT touch: Gallery/Édition detail page scroll behavior (Phase 22's job), the About page portrait (Phase 23's job), or anything on desktop/tablet viewports.

</domain>

<decisions>
## Implementation Decisions

### Wordmark→Photo Transition
- **D-01:** Extend the existing photo-cutout wordmark mechanism (the letterforms already show the current gallery's photo through `background-clip: text`, Safari-hardened via prior quick-task fixes — see Code Context) rather than building a new visual mechanism from scratch. The zoom effect should scale/reveal this existing cutout until the photo fills the screen and the letters dissolve away.
- **D-02:** The wordmark stays pinned (`position: sticky`) while the zoom plays out over a fixed scroll distance — mirrors the site's existing `DetailHero.astro` pinned-shrink pattern, giving control over pacing rather than tying the effect to however fast the visitor happens to scroll.
- **D-03:** During the zoom itself, no other UI appears — purely wordmark + photo, no gallery title, no header chrome (see D-08). Clean and dramatic; the first gallery's caption/description only appears once the zoom fully completes and that slide settles (see Description Reveal Style).
- **D-04:** The zoom is fully reversible/scrubbable — scrolling back up smoothly zooms back out into the full-screen wordmark, consistent with a true scroll-scrubbed animation in both directions. Not a one-time intro.

### Scroll Structure
- **D-05:** Each gallery occupies one full-screen "slide" via scroll-snap (deck-like) — matches the carousel's one-photo-at-a-time feel it replaces, rather than a continuous free-flowing/editorial layout.
- **D-06:** Title/description text sits in the existing bottom accent-color panel (`.home-hero__accent`, already built for mobile) rather than overlaid directly on the photo with a scrim — keeps the existing accent-color-to-caption connection.
- **D-07:** One photo per gallery (its hero/cover photo) — matches the roadmap's "first gallery's photo" wording and mirrors today's carousel/grid model. Not a multi-photo-per-gallery mini-preview. (Showing every photo in a gallery is Phase 22's job, on the detail pages.)
- **D-08:** After the last gallery's slide, scrolling further reaches the site footer/end-of-page content — no loop back to the first gallery.

### Scroll Interactions
- **D-09:** The accent color keeps updating live to match each gallery's `heroColor` as its slide arrives, mirroring the carousel's existing per-gallery accent behavior — it does NOT stay frozen at the Phase 20 per-visit random starting color for the whole scroll. (Phase 20's D-05 only guaranteed today's carousel/grid-mode behavior stays intact until this phase replaces it; this decision is Phase 21's own call for the new view.)
- **D-10:** Tapping a gallery's photo opens that gallery's detail page directly — matches today's grid-mode tap-to-open behavior. No separate "view gallery" CTA needed.
- **D-11:** Fold in Phase 20's carryover Critical bug (touch handler on `.home-hero__caption`/progress-dash controls doesn't exclude those elements, so a real-touchscreen tap can misfire `openCurrent()` navigation — see `20-REVIEW.md`) into this phase's touch-handling rewrite, since Phase 21 is already doing heavy surgery on the same code path (retiring the toggle, adding tap-to-open, building scroll-snap navigation).
- **D-12:** The mobile hamburger-nav header (logo top-left, hamburger top-right, from Phase 20) hides during the full-screen wordmark opening and fades in once the zoom completes — consistent with D-03's "purely wordmark + photo" decision for the transition itself.

### Description Reveal Style
- **D-13:** Reuse the exact visual language already shipped for grid-tile hover reveal: `opacity: 0 → 1`, `transform: translateY(8px) → translateY(0)`, `180ms ease` (see `HomeCarousel.astro` lines ~2778-2804). No new reveal design — this is the closest existing, already-approved treatment.
- **D-14:** The reveal fires once a gallery's slide is fully snapped/settled into view (arrival-complete), not as soon as it starts entering the viewport. Matches the roadmap's "arrives on screen" wording as a deliberate arrival moment tied to the scroll-snap stop.
- **D-15:** Reduced-motion visitors get the site's standard static end-state (matching `DetailHero.astro`/`AboutPageBody.astro`'s existing convention): no scroll-linked JS attached at all — the full-screen wordmark renders once as a static intro, then galleries show with descriptions always visible, no reveal animation. Combine `prefers-reduced-motion: reduce` with `(max-width: 767px)` in the CSS/JS gate, mirroring (inverted) the desktop-only pattern those components already use.
- **D-16:** The wordmark is intro-only — once the full-screen opening completes, subsequent gallery slides do NOT repeat the small wordmark-with-photo-cutout in their accent panel (as today's carousel does on every swipe). Regular slides show just title + description. Avoids a redundant repeating wordmark once the intro has already made its statement.

### Claude's Discretion
None outside the above — every gray area discussed reached an explicit decision (all "recommended" options were accepted as presented). Implementation-level specifics not covered above (exact scroll-track distance in px for the zoom, exact snap-scroll CSS technique, exact IntersectionObserver vs. scroll-snap-event wiring for D-14's arrival trigger) are left to research/planning, consistent with the philosophy that Claude figures out HOW.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/REQUIREMENTS.md` — HOME-14, HOME-15 full requirement text
- `.planning/ROADMAP.md` §"Phase 21: Homepage Scroll Experience" — Goal, Depends-on, Success Criteria
- `.planning/PROJECT.md` §"Current Milestone: v1.6" — full v1.6 target-feature list and mobile-only/desktop-unchanged framing

### Prior phase context (dependency)
- `.planning/phases/20-mobile-navigation-accent-color/20-CONTEXT.md` — D-01 through D-05 established the mobile hamburger nav (`SiteHeader.astro` opt-in mobile-nav mode) and the per-visit random starting accent color (HOME-16) this phase's header-chrome (D-12) and accent-color (D-09) decisions build on directly.
- `.planning/phases/20-mobile-navigation-accent-color/20-REVIEW.md` — source of the carryover touch-handler bug folded in via D-11.

### Sketch/design precedent (not phase-specific, but informs motion language)
- `.planning/sketches/MANIFEST.md` — sketch 005 (edition-hero-scroll-reveal, pinned scroll-scrubbed reveal shipped as `DetailHero.astro`) and sketch 007 (carousel-overscroll-feedback, progressive visual feedback patterns) are the closest existing precedent for this phase's scroll-scrubbed motion language, though neither addresses the specific wordmark-zoom effect.

**No sketch yet exists for HOME-14/HOME-15's specific wordmark-zoom/full-screen-scroll effect.** The roadmap explicitly calls this phase "the riskiest, most subjective piece explored via sketch before implementation" — recommend running `/gsd-sketch` on the wordmark→photo transition (D-01 through D-04) before or alongside `/gsd-plan-phase 21`, since that's the one piece of this phase without a existing built precedent to lean on entirely.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/HomeCarousel.astro` (3078 lines) — the entire feature lives here today. Key reusable pieces:
  - The wordmark photo-cutout mechanism: `.home-hero__wordmark` (line ~287), `background-clip: text` + `--wordmark-photo` custom property, `.home.has-wordmark-photo` class gate, `computeWordmarkBackgroundPosition()`/`syncWordmarkAlignment()` in `home-carousel.ts` for pixel-aligned positioning. Currently lives inside the bottom-anchored `.home-hero__accent` panel on mobile (not full-screen) — D-01/D-02 extend this for the new full-screen intro state.
  - The accent-color mechanism: `--current-accent`/`--current-accent-text` custom props, set in `render()` (line ~648-730) per gallery, plus Phase 20's random-starting-pick override (line ~1486-1504). D-09 has this continue updating live as slides arrive.
  - The grid-tile description hover-reveal CSS (line ~2778-2804): `opacity`/`translateY`/`180ms ease` — D-13 reuses these exact values.
  - `document.startViewTransition()` same-document morph pattern (carousel↔grid toggle, line ~1344-1470) — feature-detected, manually reduced-motion-guarded; establishes the site's convention if Phase 21 needs any view-transition-style morphing.
- `src/components/DetailHero.astro` (lines 198-314) — the site's only existing scroll-scrubbed pinned-reveal driver: `scroll` listener + rAF-batched progress math, `matchMedia('(min-width: 768px)')` + `prefers-reduced-motion` gating, `clearInlineStyles()` fallback. D-02's pinning decision and D-15's reduced-motion gating should mirror this pattern, inverted to `(max-width: 767px)`.
- `src/components/GalleryGrid.astro` (~line 168-231) — the site's only `IntersectionObserver` usage (0.15 threshold, one-shot staggered reveal). Relevant precedent for D-14's arrival-trigger wiring, though D-14 specifically wants "fully snapped/settled" (arrival-complete) rather than early-threshold — likely needs a scroll-snap-aware event (e.g. `scrollend`) rather than GalleryGrid's exact threshold approach.
- `src/lib/home-carousel.ts` — pure, DOM-free, unit-tested helper module (`computeWordmarkBackgroundPosition`, `computeWordmarkSeamFraction`, `pickRandomGalleryIndex`, etc.). Established seam for adding any new pure scroll-progress math (e.g. a `computeScrollZoomProgress()`-style helper) with matching unit tests in `tests/unit/home-carousel.test.ts`.
- `src/pages/index.astro` / `src/pages/en/index.astro` — already supply `heroColor`/`heroTextColor` per gallery to `HomeCarousel`; no data-layer changes needed.

### Established Patterns
- Mobile breakpoint convention: `max-width: 767px` / `min-width: 768px`, used everywhere.
- `prefers-reduced-motion` idiom: `matchMedia('(prefers-reduced-motion: reduce)')` + a `setup()` re-run on `change` events; where active, scroll/rAF listeners are fully detached (not just animation-skipped) and CSS end-state rules take over. Seen identically in `DetailHero.astro`, `AboutPageBody.astro`, `HomeCarousel.astro`.
- **No JS-level desktop/mobile gate exists in `HomeCarousel.astro` today** — today's mobile/desktop differences are pure CSS media queries. Any new scroll-driven JS this phase adds needs its own `matchMedia('(max-width: 767px)')` gate (mirroring `DetailHero.astro`'s pattern, inverted) — this doesn't come for free from existing structure and is essential for the desktop-unchanged success criterion.
- Shared-component regression history: `SiteHeader.astro`/`PageTitleHeader.astro`-class components have broken other pages twice before (Phase 16, Phase 19) when a fix targeting one page affected shared CSS. This phase's heavy rewrite of `HomeCarousel.astro`'s touch/scroll handling carries similar risk — should get proactive desktop/tablet regression-net treatment (per PROJECT.md's UI-02 framing, checked as a running local criterion in this phase, not deferred).

### Integration Points
- The carousel/grid toggle button (`data-action="toggle-mode"` in `SiteHeader`'s `extra` slot) and the `.home-grid` subtree need a `(min-width: 768px)`-gated existence check added, since both are retired below 767px but must stay exactly as-is at ≥768px.
- The existing touchstart/touchend handler (~lines 970-1002) is the site of both D-10 (tap-to-open) and D-11 (carryover bug fix) — same code path, same phase, same rewrite.

</code_context>

<specifics>
## Specific Ideas

- No specific external visual reference (image/site) was provided for the wordmark→photo transition itself — the user confirmed extending the existing built mechanism rather than pointing to a different reference. Given the roadmap's own framing of this as the phase's riskiest, most subjective piece, the actual feel of the zoom (easing curve, exact scroll-distance, exact dissolve behavior) is still open ground best explored via `/gsd-sketch` before finalizing implementation, even though the underlying mechanism is decided (D-01).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. Multi-photo-per-gallery previews and continuous free-scroll layouts were surfaced as options during discussion but explicitly rejected in favor of D-05/D-07, not deferred as future scope creep.

</deferred>

---

*Phase: 21-Homepage Scroll Experience*
*Context gathered: 2026-08-04*
