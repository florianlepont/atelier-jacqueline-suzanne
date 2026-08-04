# Phase 21: Homepage Scroll Experience - Research

**Researched:** 2026-08-04
**Domain:** Client-side scroll-driven motion (CSS Scroll Snap, scroll-scrubbed pinned reveal, IntersectionObserver/scrollend arrival detection) on top of an existing Astro static-site component
**Confidence:** MEDIUM-HIGH (codebase patterns HIGH; current-year browser-support specifics MEDIUM/LOW — see Assumptions Log)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Wordmark→Photo Transition**
- **D-01:** Extend the existing photo-cutout wordmark mechanism (the letterforms already show the current gallery's photo through `background-clip: text`, Safari-hardened via prior quick-task fixes) rather than building a new visual mechanism from scratch. The zoom effect should scale/reveal this existing cutout until the photo fills the screen and the letters dissolve away.
- **D-02:** The wordmark stays pinned (`position: sticky`) while the zoom plays out over a fixed scroll distance — mirrors the site's existing `DetailHero.astro` pinned-shrink pattern.
- **D-03:** During the zoom itself, no other UI appears — purely wordmark + photo, no gallery title, no header chrome (see D-08/D-12). The first gallery's caption/description only appears once the zoom fully completes and that slide settles.
- **D-04:** The zoom is fully reversible/scrubbable — scrolling back up smoothly zooms back out into the full-screen wordmark. Not a one-time intro.

**Scroll Structure**
- **D-05:** Each gallery occupies one full-screen "slide" via scroll-snap (deck-like).
- **D-06:** Title/description text sits in the existing bottom accent-color panel (`.home-hero__accent`) rather than overlaid directly on the photo with a scrim.
- **D-07:** One photo per gallery (its hero/cover photo). Not multi-photo-per-gallery.
- **D-08:** After the last gallery's slide, scrolling further reaches the site footer/end-of-page content — no loop back to the first gallery.

**Scroll Interactions**
- **D-09:** The accent color keeps updating live to match each gallery's `heroColor` as its slide arrives — does NOT stay frozen at the Phase 20 per-visit random starting color for the whole scroll.
- **D-10:** Tapping a gallery's photo opens that gallery's detail page directly — matches today's grid-mode tap-to-open behavior.
- **D-11:** Fold in Phase 20's carryover Critical bug (touch handler on `.home-hero__caption`/progress-dash controls doesn't exclude those elements, misfiring `openCurrent()`) into this phase's touch-handling rewrite.
- **D-12:** The mobile hamburger-nav header hides during the full-screen wordmark opening and fades in once the zoom completes.

**Description Reveal Style**
- **D-13:** Reuse the exact visual language already shipped for grid-tile hover reveal: `opacity: 0 → 1`, `transform: translateY(8px) → translateY(0)`, `180ms ease` (`HomeCarousel.astro` lines ~2778-2804).
- **D-14:** The reveal fires once a gallery's slide is fully snapped/settled into view (arrival-complete), not as soon as it starts entering the viewport.
- **D-15:** Reduced-motion visitors get the site's standard static end-state: no scroll-linked JS attached at all — full-screen wordmark renders once as a static intro, then galleries show with descriptions always visible. Combine `prefers-reduced-motion: reduce` with `(max-width: 767px)` in the CSS/JS gate, mirroring (inverted) the desktop-only pattern DetailHero/AboutPageBody already use.
- **D-16:** The wordmark is intro-only — subsequent gallery slides do NOT repeat the small wordmark-with-photo-cutout in their accent panel.

### Claude's Discretion
None outside the above — every gray area discussed reached an explicit decision. Implementation-level specifics not covered above (exact scroll-track distance in px for the zoom, exact snap-scroll CSS technique, exact IntersectionObserver vs. scroll-snap-event wiring for D-14's arrival trigger) are left to research/planning.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope. Multi-photo-per-gallery previews and continuous free-scroll layouts were surfaced as options during discussion but explicitly rejected in favor of D-05/D-07, not deferred as future scope creep.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| HOME-14 | Visitor on a phone browses the homepage via a single scroll-driven view (no carousel/grid toggle); each item's description text reveals as it arrives on screen during scroll | Architecture Patterns (scroll-snap deck + arrival detection), Code Examples (IntersectionObserver reveal), Common Pitfalls (retire toggle via CSS breakpoint, not JS swap) |
| HOME-15 | Visitor on a phone sees the "Atelier Jacqueline Suzanne" wordmark full-screen first; scrolling transitions through the wordmark's letterform into the first gallery's photo | Architecture Patterns (pinned zoom stage adapted from `DetailHero.astro`/sketch 015), Code Examples (progress math, transform-origin measurement) |
</phase_requirements>

## Summary

This phase has essentially zero new-library risk and 100% "wire existing site conventions together in a new arrangement" risk. Every primitive it needs — the pinned scroll-scrubbed reveal driver (`DetailHero.astro`), the photo-cutout wordmark (`HomeCarousel.astro`'s `background-clip: text` mechanism), the grid-tile hover-reveal CSS values (D-13), the `prefers-reduced-motion` + breakpoint gating idiom (`DetailHero.astro`/`AboutPageBody.astro`), and a validated motion spec (sketch 015, `sources/015-homepage-wordmark-zoom/mobile.html`) — already exists in the codebase or the sketch-findings skill. The genuinely new engineering is: (1) porting the sketch's bounded-div progress math to real page scroll (a mechanical, already-proven port — `DetailHero.astro` did the exact same port from sketch 005), (2) building a CSS Scroll Snap deck for N full-screen gallery slides sitting immediately after the pinned zoom stage, (3) picking a robust "arrival-complete" signal for D-14, and (4) rewriting `HomeCarousel.astro`'s mobile touch handling to simultaneously fix CR-01 (carryover bug), add tap-to-open (D-10), and add scroll-snap-based slide awareness — all in the same code path.

The single biggest structural decision the planner must make explicit: **the new mobile scroll-deck should be genuinely new, parallel markup** (a third top-level block alongside today's `.home-hero`/`.home-grid`), shown only via `@media (max-width: 767px)`, with the existing carousel/grid markup and its desktop JS untouched above that breakpoint. This mirrors the codebase's own established convention — "no JS-level desktop/mobile gate exists in `HomeCarousel.astro` today ... today's mobile/desktop differences are pure CSS media queries" (per CONTEXT.md's own Established Patterns) — rather than trying to make the existing carousel DOM double as scroll-deck slides. D-16 (no repeating wordmark per slide) and D-06 (bottom accent panel reused) both become simple CSS/markup facts under this approach, not conditional JS branches.

For D-14 (arrival-complete trigger), IntersectionObserver at a near-1.0 threshold is the recommended primary signal — not `scrollend`. A full-viewport (`100dvh`) slide with `scroll-snap-align: start` only reaches intersection ratio ≈1.0 once it is genuinely snapped into place (any mid-scroll or non-snapped position necessarily shows a lower ratio, since some adjacent slide bleeds into the viewport). This sidesteps `scrollend`'s Safari support gap (only shipped in Safari 26.2, Dec 2025 — recent enough that pre-update iOS Safari versions still active in the field would silently get no reveal at all if `scrollend` were the sole signal) `[CITED: https://www.infoq.com/news/2026/04/safari-scrollend-support/]`. `scrollend` can still be layered in as a debounce/settle confirmation if IntersectionObserver flapping near the threshold becomes an issue in practice, but is not required for a correct v1.

**Primary recommendation:** Build the mobile scroll experience as new, parallel markup gated by `@media (max-width: 767px)` (not a JS mode-switch), reuse `DetailHero.astro`'s exact `clamp01`/`lerp`/`getBoundingClientRect().top / distance` progress-driver pattern for the zoom (verified match with sketch 015's own math), drive D-14's arrival reveal off IntersectionObserver alone (threshold ≈0.98), and treat the touch-handler rewrite (D-11) as two separate handlers — the existing desktop/tablet `.home-hero__photo` touchstart/touchend (fixed for CR-01, still relevant on touchscreen tablets ≥768px per success criterion 5) and a new, simpler per-slide tap-to-open handler inside the new mobile-only scroll-deck.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Wordmark→photo pinned scroll zoom | Browser/Client | Build time (Astro static) | 100% client-side scroll math (CSS transform + opacity); the photo URL/accent color it reveals is already baked into static HTML/data attributes at Astro build time via the existing Sanity fetch — no new data need |
| Scroll-snap gallery deck (N full-screen slides) | Browser/Client | CDN/Static | Pure CSS Scroll Snap + one IntersectionObserver; slides are static HTML sections already present in the build output, no server involvement |
| Per-slide description arrival reveal | Browser/Client | — | CSS opacity/transform transition (D-13's existing values), triggered by a client-side IntersectionObserver |
| Live accent-color update per slide (D-09) | Browser/Client | Build time (Astro static) | Reuses the existing `render()`-style custom-property write pattern; `heroColor`/`heroTextColor` values are already present in `data-hero-color`/`data-hero-text-color` attributes from the current carousel's data list |
| Carousel/grid toggle retirement below 768px (D-01) | Browser/Client (CSS media query) | — | No new JS gate needed — a pure `@media (max-width: 767px) { display: none }`, matching the codebase's existing 100%-CSS mobile/desktop split; do NOT build a JS-driven markup swap |
| Touch handling rewrite (D-11 fix + D-10 tap-to-open + snap awareness) | Browser/Client | — | Same DOM event-handling layer as today; splits into a tablet/desktop-only handler (existing code, CR-01-fixed) and a new mobile-only handler (simpler, scoped to the new deck) |
| Reduced-motion end-state (D-15) | Browser/Client | — | CSS-only end-state rules plus a JS `setup()` gate that fully detaches scroll/IntersectionObserver wiring, mirroring `DetailHero.astro`/`AboutPageBody.astro` exactly (inverted breakpoint direction) |

## Standard Stack

### Core

No new npm packages are introduced by this phase. Everything needed is a native Web Platform API already available in evergreen mobile browsers, used exactly as the codebase's existing scroll-reveal components (`DetailHero.astro`, `AboutPageBody.astro`) already use their equivalents:

| API | Purpose | Why Standard (for this codebase) |
|-----|---------|-----------------------------------|
| `Element.getBoundingClientRect()` + `window.scroll` + `requestAnimationFrame` | Progress-driven pinned zoom (D-02/D-04) | Byte-for-byte the same driver pattern as `DetailHero.astro`'s `computeProgress()`/`onProgress()`, itself ported from sketch 005. Sketch 015 already re-validated this exact idiom for the wordmark-zoom case. |
| CSS `scroll-snap-type` / `scroll-snap-align` / `scroll-snap-stop` | Full-screen gallery slide deck (D-05) | Declarative, zero-JS slide-to-slide snapping; avoids hand-rolling swipe/scroll-position-based slide navigation that a JS library or custom logic would otherwise need to own. |
| `IntersectionObserver` | Arrival-complete detection (D-14) | Already the site's established pattern for scroll-triggered reveals (`GalleryGrid.astro`'s one-shot staggered reveal, sketch 015's own `setupArrivalReveal()`). No new dependency; threshold tuned higher (~0.98) than `GalleryGrid.astro`'s 0.15 to match D-14's "fully settled" semantics. |
| `matchMedia('(prefers-reduced-motion: reduce)')` + `matchMedia('(max-width: 767px)')` | D-15's motion gate | Identical idiom to `DetailHero.astro`/`AboutPageBody.astro`, inverted breakpoint direction (those are desktop-only features; this is mobile-only). |
| `document.fonts.ready` | Correct `transform-origin` measurement of the "A" glyph | Sketch 015's own anti-pattern warning: measuring before the real Unbounded font has loaded produces a wrong origin. Production already loads Unbounded via `@fontsource/unbounded`, but the *measurement* must still wait for `document.fonts.ready` to resolve. |

### Supporting

| API | Purpose | When to Use |
|-----|---------|-------------|
| `scrollend` event | Optional secondary confirmation for D-14 | Only if IntersectionObserver-alone proves too eager/flappy in real testing; feature-detect (`'onscrollend' in window`) before relying on it, since pre-Safari-26.2 iOS lacks it `[CITED: https://www.infoq.com/news/2026/04/safari-scrollend-support/]`. |
| `ResizeObserver` | Optional — recompute the zoom track's `REVEAL_DISTANCE`/transform-origin on viewport resize | `DetailHero.astro` uses a debounced `window.addEventListener('resize', ...)` instead; matching that existing convention (not introducing `ResizeObserver`) keeps the pattern consistent unless a specific gap is found. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS Scroll Snap for the gallery deck | A JS-driven "virtual slide" library (e.g., a carousel/slider package) | Would add a new dependency for something the platform already does declaratively; contradicts the project's near-zero-dependency, hand-rolled-vanilla-JS convention already established by `HomeCarousel.astro`/`DetailHero.astro`/`Lightbox.astro`. Rejected. |
| IntersectionObserver-only arrival trigger | `scrollsnapchange`/`scrollsnapchanging` events | These fire precisely at snap-target changes but are Chrome/Edge 129+ with only partial Safari support as of this research and are explicitly flagged "limited availability, experimental" per MDN `[CITED: https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollsnapchange_event]`. Not safe as the sole mechanism for a phone-focused feature today. |
| New parallel mobile-only markup | Reusing/conditionally-branching the existing carousel DOM for mobile slides | Existing carousel DOM has controls (progress dashes, autoplay toggle, peek layers, hover cursor) that D-01/D-16 explicitly do not want on mobile; branching them out with JS would be far more complex and fragile than a `@media` split, and would violate the codebase's own "no JS-level desktop/mobile gate" convention. |

**Installation:**
```bash
# No installation required — this phase uses only native Web Platform APIs
# already exercised elsewhere in this codebase.
```

**Version verification:** Not applicable — no packages recommended. Astro 7.1.4, Vitest 4.1.9, and Playwright 1.61.1 (already installed, per `package.json`) are the only relevant toolchain versions and require no change for this phase.

## Package Legitimacy Audit

Not applicable — this phase installs no external packages. All work happens inside existing files (`HomeCarousel.astro`, `src/lib/home-carousel.ts`, their test files) using native browser APIs and the codebase's existing dependencies.

**Packages removed due to [SLOP] verdict:** none (none proposed)
**Packages flagged as suspicious [SUS]:** none (none proposed)

## Architecture Patterns

### System Architecture Diagram

```
Phone-width visitor loads "/" (fr) or "/en/"
        │
        ▼
┌─────────────────────────────────────────────┐
│ Astro static build (already fetched at       │
│ build time via src/pages/index.astro):       │
│ galleries[] → heroSrc, statement, heroColor  │
│ (baked into hidden <ul data-role=            │
│ "home-carousel-data"> — same data source     │
│ the existing carousel already uses)          │
└───────────────────┬───────────────────────────┘
                     │ (no runtime fetch — build-time only)
                     ▼
┌─────────────────────────────────────────────┐  <768px only (CSS media query)
│  NEW: .home-scroll-deck (parallel markup,    │  hides .home-hero/.home-grid entirely
│  sibling of existing .home-hero/.home-grid)  │
│                                               │
│  [1] .zoom-track (tall spacer, D-02)         │
│      └─ .zoom-stage (position: sticky)       │
│          ├─ full-screen wordmark             │  ◄─ D-01/D-03/D-04:
│          │  (background-clip: text photo     │     scroll → onProgress(t)
│          │  cutout, scale 1→8.5x)            │     drives scale/opacity/
│          └─ crossfade photo layer (t=0.85→1) │     transform-origin
│                                               │
│  [2..N+1] .arrival-slide × N (scroll-snap     │  ◄─ D-05/D-07: one
│      deck, one per gallery)                   │     100dvh slide/gallery,
│      ├─ full-bleed hero photo                │     scroll-snap-align:start
│      ├─ .home-hero__accent-style panel        │  ◄─ D-06/D-13: description
│      │  (title always visible, description   │     reveals via
│      │  opacity:0→1 on arrival-complete)      │     IntersectionObserver
│      └─ tap-to-open → gallery detail page     │  ◄─ D-10
│                                               │
│  Mobile header (hamburger nav, Phase 20)     │  ◄─ D-12: hidden during
│  fades in once zoom completes                │     zoom, fades in after
└─────────────────────────────────────────────┘
                     │
                     ▼
              Site footer (D-08: no loop)

┌─────────────────────────────────────────────┐  ≥768px only (unchanged)
│ EXISTING .home-hero (carousel) / .home-grid  │
│ — byte-for-byte untouched behavior           │
│ (UI-02 regression guard)                     │
└─────────────────────────────────────────────┘
```

### Recommended Project Structure

No new files are strictly required; extend the existing two:

```
src/components/HomeCarousel.astro
  ├── existing .home-hero / .home-grid markup   # unchanged, ≥768px only via CSS
  ├── NEW .home-scroll-deck markup               # <768px only via CSS
  ├── existing <script> (carousel/grid logic)    # unchanged, gains CR-01 fix only
  └── NEW <script> block (or new function inside
      the existing script) for the scroll-deck's
      zoom driver + arrival IntersectionObserver
      + tap-to-open, gated by
      matchMedia('(max-width: 767px)')

src/lib/home-carousel.ts
  └── NEW exported pure function(s), e.g.
      computeWordmarkZoomState(t) → { scale, wordmarkOpacity, photoOpacity }
      mirroring the sketch's onProgress() math (ease-in-cubic + two clamp01
      ramps) — this is the established seam per the codebase's own
      convention ("any new pure scroll-progress math ... with matching
      unit tests in tests/unit/home-carousel.test.ts")

tests/unit/home-carousel.test.ts
  └── NEW describe block for computeWordmarkZoomState (or equivalent)

tests/e2e/
  └── NEW spec (e.g. homepage-scroll-deck.spec.ts) covering: toggle absent
      <768px, wordmark full-screen on load, scroll reveals slides in order,
      description hidden until arrival, reduced-motion static end-state,
      desktop/tablet (webkit-mobile is NOT the same as ≥768px — see
      Common Pitfalls) unaffected
```

### Pattern 1: Real-page-scroll progress driver (port sketch 015's math verbatim)

**What:** Derive progress `t` from the pinned track's own `getBoundingClientRect().top`, exactly as `DetailHero.astro` already does, NOT from a bounded-div's `scrollTop` (that was sketch-only scaffolding for desktop side-by-side comparison).
**When to use:** The wordmark zoom stage (D-02/D-04).
**Example:**
```typescript
// Source: sketch-findings-ajs-website/references/homepage-motion.md,
// verified byte-identical in structure to DetailHero.astro:204-296
function clamp01(v: number): number { return Math.max(0, Math.min(1, v)); }
function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }
function easeInCubic(t: number): number { return t * t * t; }

const REVEAL_DISTANCE = 900; // "Cinematic" pace — sketch-validated winner

function computeProgress(trackEl: HTMLElement): number {
  return clamp01(-trackEl.getBoundingClientRect().top / REVEAL_DISTANCE);
}

function onProgress(t: number) {
  const scaleT = easeInCubic(t);
  wordmarkEl.style.transform = `scale(${lerp(1, 8.5, scaleT)})`;
  wordmarkEl.style.opacity = String(1 - clamp01((t - 0.92) / 0.08));
  photoOverlayEl.style.opacity = String(clamp01((t - 0.85) / 0.15)); // end-state safety net
}
```
**Hook-in point:** This is a NEW, independent scroll listener — do not try to merge it into the existing carousel `<script>`'s touch/scroll handling (lines ~940-1057), which is entirely about swipe-nav/hover-peek for the OLD carousel and is mobile-inert below 768px under this phase's recommended structure. Register it exactly like `DetailHero.astro` does: its own `setup()` function gated by both `matchMedia('(max-width: 767px)')` and `matchMedia('(prefers-reduced-motion: reduce)')`, attaching/detaching a single `scroll` listener with `requestAnimationFrame` batching.

### Pattern 2: Full-screen wordmark cutout — simpler geometry than the existing carousel wordmark

**What:** The existing `.home-hero__wordmark`'s photo cutout requires `computeWordmarkBackgroundPosition()` (in `src/lib/home-carousel.ts`) because it must align with a SEPARATE, smaller hero `<img>` element that has its own `object-fit: cover` crop — the wordmark box is a different size/position than the photo behind it, so the crop math must be computed to make the cutout look like "a hole in the same photo."
**When to use:** The NEW full-screen intro wordmark does NOT have this problem — the wordmark IS effectively the whole viewport, so it can use plain `background-size: cover; background-position: center` directly, exactly as sketch 015's CSS does. **Do not port `computeWordmarkBackgroundPosition`/`syncWordmarkAlignment` for the full-screen case** — it solves a different geometry problem than what D-01 needs here, and reusing it unmodified would be over-engineering (it's only needed if the full-screen wordmark and the eventual full-bleed slide photo are ever different crops of the same image, which the sketch doesn't require).
**Example:**
```css
/* Source: sketch-findings-ajs-website/references/homepage-motion.md,
   verified against HomeCarousel.astro's existing Safari-hardening
   (@supports gate, single filter, no extra paint layers) */
.zoom-wordmark {
  font-family: var(--font-display);
  text-transform: uppercase;
  line-height: 0.92;
  background-image: var(--zoom-photo);
  background-size: cover;
  background-position: center;
  will-change: transform, opacity, filter;
}
@supports (background-clip: text) or (-webkit-background-clip: text) {
  .has-photo-cutout .zoom-wordmark {
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    -webkit-text-fill-color: transparent;
    /* single filter only — HomeCarousel.astro's own comment: "Safari can
       produce raster seams when background-clip:text is combined with
       extra paint layers on multiline text" */
    filter: var(--zoom-wordmark-filter, brightness(0.72) contrast(1.15));
  }
}
```
What IS worth reusing verbatim: the `--wordmark-photo-filter`-style brightness/contrast heuristic function (`wordmarkPhotoFilter()`, already flagged by `20-REVIEW.md`'s IN-01 as duplicated and due for extraction to `src/lib/home-carousel.ts`) — this phase is a natural moment to do that extraction, since the new zoom wordmark needs the identical heuristic against the FIRST gallery's `heroTextColor`.

### Pattern 3: Scroll-snap deck for N full-screen gallery slides

**What:** Each gallery is a `100dvh` section with `scroll-snap-align: start`, inside a container with `scroll-snap-type: y mandatory`.
**When to use:** D-05's slide deck, placed immediately after the pinned zoom stage in DOM order (NOT wrapped inside its own nested scroll container — the whole page scrolls; only the zoom stage above it uses `position: sticky`, which composes correctly with an ancestor page that also has `scroll-snap-type` on it, same as `DetailHero.astro`'s sticky pinned photo already coexists with ordinary page scroll).
**Example:**
```css
/* Source: MDN Scroll Snap guide + effect-labs.com scroll-snap-sections
   guide (2026) — general web-platform pattern, adapted to this project's
   naming */
.home-scroll-deck {
  scroll-snap-type: y mandatory; /* mandatory: appropriate since every
    slide is exactly 100dvh — no risk of trapping mid-content scroll,
    unlike a content-taller-than-viewport section */
}
.arrival-slide {
  height: 100dvh; /* NOT 100vh — avoids mobile browser-chrome jump bugs */
  scroll-snap-align: start;
  scroll-snap-stop: always; /* prevents a fast fling from skipping a
    gallery slide entirely */
}
@media (prefers-reduced-motion: reduce) {
  .home-scroll-deck { scroll-snap-type: none; } /* D-15: forced snapping
    is itself a motion/disorientation vector, independent of any JS */
}
```
**Does the sticky zoom stage need its own `scroll-snap-align`?** No — only the slides after it need `scroll-snap-align`. The zoom stage's own tall track (`.zoom-track`, `height: calc(100dvh + 900px)`) is deliberately NOT a snap point: the whole point of D-04 is that it scrubs continuously and reversibly, not that it snaps to a fixed position. Only once the visitor scrolls past the zoom track into the first `.arrival-slide` does snap behavior take over. This matches sketch 015's structure exactly (`.scroll-track` has no `scroll-snap-align`; only `.arrival-slide` would, if the sketch had a second slide — it only ever tested one).

### Pattern 4: Arrival-complete detection for D-14

**What:** A single `IntersectionObserver` with a high threshold, one entry per slide.
**Example:**
```typescript
// Adapted from GalleryGrid.astro's existing one-shot-reveal pattern (0.15
// threshold), retuned for D-14's "fully snapped" semantics (~0.98, not
// 0.15) and made repeatable in both directions (not { once: true }) since
// D-04-style reversibility implies scrolling back up should hide the
// description again, consistent with "reveals ... as it arrives on
// screen" being a live state, not a one-shot.
const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      entry.target.classList.toggle('is-revealed', entry.intersectionRatio >= 0.98);
    }
  },
  { threshold: [0, 0.98, 1] },
);
slides.forEach((slide) => observer.observe(slide));
```
**Why not `scrollend`:** `scrollend` only recently reached Safari (26.2, Dec 2025) `[CITED: https://www.infoq.com/news/2026/04/safari-scrollend-support/]`; relying on it alone risks silently broken reveals on any phone still on an older iOS/Safari version. IntersectionObserver has been supported everywhere relevant for years and, for a `100dvh` slide with `scroll-snap-align: start`, a ratio ≥0.98 is a reliable proxy for "snapped," since any non-snapped scroll position necessarily shows measurable bleed from the adjacent slide.

### Anti-Patterns to Avoid
- **Building a JS-level markup swap between "old carousel/grid" and "new scroll-deck" based on viewport width:** the codebase has zero precedent for this and an established, working alternative (pure `@media` query) — a JS swap adds a whole new class of hydration/timing bugs (flash of wrong markup, double-init) for no benefit.
- **Re-deriving zoom progress from a bounded-div `scrollTop`:** that was sketch-only variant-comparison scaffolding (per the skill's own "What to Avoid" section) — real production must use the track's own `getBoundingClientRect().top`.
- **Treating `computeWordmarkBackgroundPosition` as mandatory for the full-screen wordmark:** it solves a different (smaller-box-aligned-to-bigger-photo) problem; the full-screen case is `background-size: cover` on its own box.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| Full-screen slide-to-slide snapping | A JS `scrollTo()`-based "paginate to nearest slide" controller | CSS `scroll-snap-type`/`scroll-snap-align`/`scroll-snap-stop` | The platform already solves this declaratively, with correct touch/momentum/keyboard interaction for free; a JS controller would have to re-solve touch-vs-scroll ambiguity that CSS Scroll Snap handles natively. |
| Detecting "did the browser finish scrolling" | A custom debounce-timer-on-`scroll` heuristic as the PRIMARY signal | IntersectionObserver at a high threshold (with an optional `scrollend` enhancement) | A hand-rolled idle-timer can misfire on momentum-scroll devices with long deceleration tails (exactly the class of bug the platform's own `scrollend` event exists to fix) — IntersectionObserver's ratio is a more direct, layout-driven signal that doesn't depend on guessing an idle timeout. |
| Reduced-motion detection/gating | A one-off `if (matchesReducedMotion)` sprinkled ad hoc through the new code | The exact `matchMedia(...).addEventListener('change', setup)` idiom already used in `DetailHero.astro`/`AboutPageBody.astro` | Live toggling of the OS-level reduced-motion setting mid-session must re-run `setup()`, not just be checked once at load — the existing idiom already handles this correctly. |

**Key insight:** Every piece of this phase's motion mechanics is either a proven internal pattern (pinned scroll driver) or a native platform feature specifically designed for this exact use case (Scroll Snap, IntersectionObserver). The risk in this phase is not "what do we build" but "wire it together in the right place without disturbing the ≥768px carousel/grid code path" (UI-02).

## Common Pitfalls

### Pitfall 1: Folding the touch-handler rewrite into the wrong code path
**What goes wrong:** Fixing CR-01 (the caption/progress-dash tap misfire) inside a NEW mobile-only handler when the actual bug lives in the OLD carousel's `.home-hero__photo` touchstart/touchend handler (`HomeCarousel.astro:970-1002`), which stays live for touchscreen tablets ≥768px under this phase's recommended structure.
**Why it happens:** D-11's phrasing ("fold into this phase's touch-handling rewrite") could be misread as "only fix it in the new mobile code," but the bug's actual location (lines 970-1002) is inside markup/JS that keeps running at tablet widths per success criterion 5.
**How to avoid:** Apply the `20-REVIEW.md` CR-01 fix (add `if (target?.closest('.home-hero__caption')) return;` to the existing `touchend` listener) IN PLACE in the existing script, unconditionally — it's a correctness fix regardless of this phase's other mobile work. Then build the NEW, separate, simpler tap-to-open handler for the new `<768px` scroll-deck slides (which have no progress-dash/autoplay-toggle controls to guard against at all, per D-16, only a title/description text block).
**Warning signs:** A regression test for CR-01 written against the NEW scroll-deck markup instead of the OLD carousel markup — it would pass while the original tablet-touchscreen bug remains unfixed.

### Pitfall 2: Two independent "is this mobile" checks drifting out of sync
**What goes wrong:** The CSS breakpoint (`@media (max-width: 767px)`) and the JS `matchMedia('(max-width: 767px)')` gate for the zoom driver/arrival observer must use the identical `767px` value already established site-wide — a stray `768px` vs `767px` mismatch (off-by-one) would make JS activate/deactivate at a different width than the CSS that's supposed to hide/show the corresponding markup.
**Why it happens:** Copy-pasting `DetailHero.astro`'s `matchMedia('(min-width: 768px)')` naively without inverting AND double-checking the boundary value.
**How to avoid:** Use `matchMedia('(max-width: 767px)')` verbatim (not `(max-width: 768px)` or `(min-width: 767px)`), matching the codebase's own stated convention exactly ("Mobile breakpoint convention: `max-width: 767px` / `min-width: 768px`, used everywhere").

### Pitfall 3: Safari `background-clip: text` regressions on the new full-screen wordmark
**What goes wrong:** Adding an extra paint layer (a box-shadow, a second background, a text-stroke) to make the zoom wordmark "pop" more produces rasterization seams on Safari specifically — already diagnosed and fixed once for the existing carousel wordmark (`HomeCarousel.astro`'s own comment: "Safari can produce raster seams when background-clip:text is combined with extra paint layers on multiline text").
**Why it happens:** The zoom effect (scale up to 8.5×) is exactly the kind of extreme transform where new visual polish ideas get tempting, and Safari's `background-clip: text` implementation is known-fragile under compounded paint layers.
**How to avoid:** Keep to a single `filter` (brightness/contrast) exactly as the existing wordmark and sketch 015 both do; rely on the t=0.85→1.0 crossfade-to-plain-photo safety net (already part of the approved design) to hide any residual artifacts at the extreme end of the scale rather than trying to make the raw cutout itself flawless at 8.5×.

### Pitfall 4: Measuring the "A" glyph's `transform-origin` before the real font has loaded
**What goes wrong:** `document.fonts.ready` is skipped or checked incorrectly, so `syncFocusOrigin()` measures the "A" glyph's position while it's still rendering in a system-sans fallback — the computed origin is then wrong once Unbounded swaps in, and the zoom visibly focuses on the wrong point.
**Why it happens:** This exact mistake already happened once during the sketch process itself (an entire round rendered in a system-sans fallback before being caught) — the skill explicitly documents it as a "what to avoid."
**How to avoid:** Call `syncFocusOrigin()` on initial load, again inside `document.fonts.ready.then(...)`, and on `resize`/`orientationchange`, exactly as sketch 015's script does. Production already loads the real Unbounded font via `@fontsource/unbounded` (unlike the sketch's initial miss), but the *origin measurement* must still be sequenced correctly regardless.

### Pitfall 5: Retrofitting `computeWordmarkBackgroundPosition` onto the full-screen wordmark "for consistency"
**What goes wrong:** A well-intentioned refactor pass tries to make the new zoom wordmark use the exact same alignment function as the existing carousel wordmark "since they're both wordmark cutouts," adding unnecessary complexity and a spurious dependency on a separate hero `<img>` element that doesn't exist in the same way for the full-screen intro.
**How to avoid:** See Pattern 2 above — the full-screen case's box IS the photo's box, so `background-size: cover; background-position: center` is both correct and simpler. Only the brightness/contrast filter heuristic (`wordmarkPhotoFilter()`) is worth sharing between the two.

### Pitfall 6: `scroll-snap-type: mandatory` combined with the sticky zoom track producing a snap-back
**What goes wrong:** If `scroll-snap-type` is accidentally applied at a container level that INCLUDES the zoom track (not just the slide deck after it), the browser may try to snap the zoom track itself to some point, fighting D-04's continuous scrub.
**How to avoid:** Scope `scroll-snap-type` to a container that starts AFTER the zoom track (e.g., a `.home-scroll-deck__slides` wrapper around only the `.arrival-slide` elements), or ensure the zoom track and its stage explicitly have no `scroll-snap-align` and are excluded from the snap container's direct children if scoping the whole page. Verify live on a real device, not just DevTools' device toolbar (per sketch 015's own explicit warning about real-device-only validation).

## Code Examples

### D-15 reduced-motion end-state gate (mirrors DetailHero.astro/AboutPageBody.astro, inverted breakpoint)
```typescript
// Source: pattern verified against DetailHero.astro:279-322 (this phase's
// equivalent, with the min-width/max-width direction inverted since this
// feature is mobile-only rather than desktop-only)
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const mobile = matchMedia('(max-width: 767px)');

let scrollAttached = false;
let observer: IntersectionObserver | null = null;

function clearInlineStyles() {
  wordmarkEl.style.removeProperty('transform');
  wordmarkEl.style.removeProperty('opacity');
  photoOverlayEl.style.removeProperty('opacity');
  // D-15: CSS end-state rules (full-screen wordmark static, descriptions
  // always visible) take over once inline styles are cleared — no
  // separate "reduced motion" markup swap needed.
}

function setup() {
  if (reduceMotion.matches || !mobile.matches) {
    if (scrollAttached) {
      window.removeEventListener('scroll', onScroll);
      scrollAttached = false;
    }
    observer?.disconnect();
    clearInlineStyles();
  } else {
    if (!scrollAttached) {
      window.addEventListener('scroll', onScroll, { passive: true });
      scrollAttached = true;
    }
    observer = new IntersectionObserver(onArrival, { threshold: [0, 0.98, 1] });
    slides.forEach((s) => observer!.observe(s));
    onProgress(computeProgress(track));
  }
}

setup();
reduceMotion.addEventListener('change', setup);
mobile.addEventListener('change', setup);
```

### D-14 CSS end-state for reduced motion (descriptions always visible)
```css
/* Mirrors .home-grid__tile-description's opacity:0 default + hover-reveal
   opacity:1 rule (D-13), but forced permanently visible under reduced
   motion since no JS observer runs to toggle .is-revealed. */
@media (max-width: 767px) and (prefers-reduced-motion: reduce) {
  .arrival-slide__description {
    opacity: 1;
    transform: none;
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Estimate "which slide is dominant" via IntersectionObserver threshold heuristics, then wait for `scrollend` to confirm | A dedicated `scrollsnapchange`/`scrollsnapchanging` event pair that fires precisely at snap-target changes | Chrome/Edge 129+ (2024-2025); partial Safari support as of this research `[CITED: https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollsnapchange_event]` | Not yet safe as the SOLE signal for a phone-focused feature — flagged "limited availability" by MDN. Worth a follow-up quick-task once cross-browser support is confirmed, but IntersectionObserver-only is the correct choice for this phase. |
| `scrollend` required a Safari polyfill (scroll + debounce timer) | Safari added native `scrollend` support in Safari 26.2 (December 2025), completing baseline coverage across Chrome 114+/Edge 114+/Firefox 109+/Safari 26.2+ | Dec 2025 – early 2026 `[CITED: https://www.infoq.com/news/2026/04/safari-scrollend-support/]` | `scrollend` is now viable as an OPTIONAL secondary confirmation signal, but phones still running pre-26.2 iOS (a real, non-trivial population as of Aug 2026) would silently get nothing if it were the sole D-14 trigger — hence the IntersectionObserver-primary recommendation above. |

**Deprecated/outdated:** None specific to this phase's stack — CSS Scroll Snap and IntersectionObserver are both long-stable, non-deprecated platform features.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Safari added `scrollend` support specifically in version 26.2 (Dec 2025) | Standard Stack, Pattern 4, State of the Art | If the version number is slightly off, the practical conclusion (treat `scrollend` as unreliable-alone on phones today, use IntersectionObserver as primary) is unaffected — the direction of the finding (recent, not universally deployed yet) is the load-bearing part, not the exact version. Low risk. |
| A2 | `scrollsnapchange`/`scrollsnapchanging` events have partial-at-best Safari support today | Alternatives Considered, State of the Art | Same as A1 — even if Safari support has since improved, IntersectionObserver-primary remains a safe, zero-regret choice; this assumption only affects whether a FUTURE optimization is worth doing sooner. Low risk. |
| A3 | An IntersectionObserver ratio ≥0.98 reliably correlates with "fully snapped" for a `100dvh` slide with `scroll-snap-align: start`, without needing `scrollend` at all | Pattern 4, Summary | If real-device testing shows the ratio flickers near the threshold during momentum deceleration (before the browser has actually committed the snap), the planner should add `scrollend` (with feature-detection) as a secondary confirmation — flagged as an explicit fallback path in Pattern 4, not a hard dependency, so this is a tunable detail rather than a structural risk. |
| A4 | Building the mobile scroll experience as new parallel markup (gated by `@media (max-width: 767px)`) rather than transforming/branching the existing carousel DOM is the right structural approach | Summary, Architecture Patterns, Pitfall 1 | This is a reasoned recommendation, not verified against an authoritative source — it's the most consistent choice given the codebase's own stated conventions (no JS-level desktop/mobile gate today), but the planner/plan-checker should sanity-check this against the actual final markup complexity before committing, since it does mean some genuinely new markup rather than pure extension. |

**If this table is empty:** N/A — see entries above. All are LOW-risk since each has an explicit fallback or is a directional (not precision-dependent) finding.

## Open Questions

1. **Exact `REVEAL_DISTANCE` value for production (sketch used 900px "Cinematic")**
   - What we know: Sketch 015 validated 900px as the winning pace on a real phone, compared against 420px/650px alternatives.
   - What's unclear: Whether 900px, tuned against the sketch's specific test photo/viewport, transfers unchanged to the real first gallery's actual photo and the full site chrome (header height, etc.) present in production but not in the sketch's minimal harness.
   - Recommendation: Start with 900px (D-04/D-02's referenced precedent), verify live on a real phone during implementation exactly as the sketch process did, and treat any adjustment as a tuning pass rather than a re-decision — the "Cinematic" pace category (not the exact pixel count) is the locked decision.

2. **Whether `scrollend` should be added as a secondary confirmation for D-14 in this phase or deferred**
   - What we know: IntersectionObserver alone is very likely sufficient (Pattern 4); `scrollend` support has only just become universal.
   - What's unclear: Whether real on-device testing during this phase's execution surfaces any flicker/false-positive at the 0.98 threshold that would justify adding it now versus as a later quick-task.
   - Recommendation: Ship IntersectionObserver-only first; add `scrollend` (feature-detected) only if a concrete flicker bug is observed during verification, consistent with the site's "fix what's actually broken, not what might be" pattern visible throughout `20-REVIEW.md`'s history.

3. **Whether the new mobile scroll-deck needs its own `carouselReturnHref`-style overscroll-to-return gesture (mirroring `DetailHero.astro`'s quick-260725-tqs pattern)**
   - What we know: Nothing in the CONTEXT.md decisions calls for this — D-08 explicitly says scrolling past the last gallery reaches the footer, no loop-back gesture requested.
   - What's unclear: Whether this is worth flagging to the user as a possible future enhancement (not in scope now).
   - Recommendation: Do not build it — out of scope per D-08's explicit framing; only noted here so the planner doesn't accidentally over-scope by pattern-matching too eagerly on `DetailHero.astro`'s other gestures.

## Environment Availability

| Dependency (Browser API) | Required By | Available (evergreen mobile browsers, Aug 2026) | Version/Note | Fallback |
|---------------------------|--------------|:---:|---------------|----------|
| CSS Scroll Snap (`scroll-snap-type`/`-align`/`-stop`) | D-05 slide deck | Yes | Universal in evergreen browsers for years | None needed — no fallback required |
| `IntersectionObserver` | D-14 arrival trigger | Yes | Universal in evergreen browsers for years | `GalleryGrid.astro` already feature-detects `'IntersectionObserver' in window` for its own reveal; mirror that guard, falling back to content-always-visible if absent |
| `scrollend` event | Optional D-14 enhancement only | Chrome/Edge/Firefox: yes. Safari: only 26.2+ (Dec 2025+) `[CITED: https://www.infoq.com/news/2026/04/safari-scrollend-support/]` | Feature-detect (`'onscrollend' in window`) before using | Do not depend on it — IntersectionObserver is the primary, universally-supported signal (Pattern 4) |
| `scrollsnapchange`/`scrollsnapchanging` events | Not used this phase | Chrome/Edge 129+, partial Safari | Experimental per MDN | Not adopted this phase — tracked as a future optimization (State of the Art) |
| `document.fonts.ready` | Correct `transform-origin` measurement (Pitfall 4) | Yes | Universal | N/A |
| `prefers-reduced-motion` media feature | D-15 | Yes | Universal, already used by `DetailHero.astro`/`AboutPageBody.astro` | N/A |

**Missing dependencies with no fallback:** None — every dependency above either has universal support or an explicit, already-planned fallback.

**Missing dependencies with fallback:** `scrollend` (Safari pre-26.2) — falls back to IntersectionObserver-only, which is this phase's primary mechanism anyway, not a degraded secondary path.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.9 (unit) + Playwright 1.61.1 (e2e) — both already configured |
| Config file | `vitest.config.ts` (unit), `playwright.config.ts` (e2e — `chromium` + `webkit-mobile` [iPhone 15 Pro viewport, WebKit engine] projects) |
| Quick run command | `npm run test:unit -- home-carousel` |
| Full suite command | `npm run test:coverage` (unit) and `npm run test:e2e` (e2e) — both are CI blocking gates already |

### Phase Requirement → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|--------------------|-------------|
| HOME-14 | Toggle/grid absent below 768px | e2e | `npx playwright test homepage-scroll-deck -x` | ❌ Wave 0 |
| HOME-14 | Scroll moves through every gallery as one sequence | e2e | `npx playwright test homepage-scroll-deck -x` | ❌ Wave 0 |
| HOME-14 | Description hidden until arrival-complete, then reveals | e2e | `npx playwright test homepage-scroll-deck -x` | ❌ Wave 0 |
| HOME-14 | New pure zoom/arrival math (`computeWordmarkZoomState` or equivalent) | unit | `npx vitest run home-carousel` | ❌ Wave 0 (function doesn't exist yet) |
| HOME-15 | Full-screen wordmark on first load | e2e | `npx playwright test homepage-scroll-deck -x` | ❌ Wave 0 |
| HOME-15 | Scroll visibly transitions wordmark→photo, reversible | e2e | `npx playwright test homepage-scroll-deck -x` | ❌ Wave 0 |
| D-11 (carryover) | Tap on progress-dash/autoplay-toggle does not trigger navigation (tablet touchscreen) | e2e | `npx playwright test homepage-wordmark-peek -x` (extend existing file) | ⚠️ File exists, new test case needed |
| UI-02 (regression) | Desktop/tablet carousel/grid unaffected | e2e | Existing `homepage-carousel-core.spec.ts`, `homepage-content-display.spec.ts`, `homepage-mobile-responsive.spec.ts` must stay green unmodified | ✅ Existing |
| D-15 | Reduced-motion static end-state (no scroll JS, descriptions always visible) | e2e | New test using `page.emulateMedia({ reducedMotion: 'reduce' })` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run home-carousel` (unit math) + targeted new e2e spec
- **Per wave merge:** `npm run test:coverage` + `npm run test:e2e`
- **Phase gate:** Full suite green before `/gsd-verify-work`, plus a manual real-device pass (per sketch 015's own explicit "test on a real phone, not a simulated frame" finding — Playwright's `webkit-mobile` project uses the desktop WebKit build with an emulated iPhone viewport/touch events, which is NOT the same engine build as real Mobile Safari and has historically lagged on newer scroll APIs; it validates logic and regressions but is not a substitute for the one live-device check the sketch process itself relied on to validate pace/anchor).

### Wave 0 Gaps
- [ ] `tests/e2e/homepage-scroll-deck.spec.ts` — new file covering HOME-14/HOME-15's mobile scroll-deck behavior end to end
- [ ] `tests/unit/home-carousel.test.ts` — new `describe` block for the new pure zoom-progress function once extracted to `src/lib/home-carousel.ts`
- [ ] `tests/e2e/homepage-wordmark-peek.spec.ts` — extend with a real-coordinate touchend-on-progress-dash regression test for CR-01 (per `20-REVIEW.md`'s own suggested fix verification)
- [ ] A manual real-device (not just Playwright `webkit-mobile`) verification pass for the zoom pace/anchor and scroll-snap feel, consistent with how sketch 015 itself was validated

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V2 Authentication | No | No auth surface touched by this phase |
| V3 Session Management | No | No session state introduced |
| V4 Access Control | No | No access-control logic — all galleries are public content, same as today's carousel |
| V5 Input Validation | No new surface | This phase reads no new user input — it re-renders the SAME build-time `heroColor`/`statement`/`heroSrc` values the existing carousel already reads from `data-*` attributes on the build-time-generated `<ul data-role="home-carousel-data">`. No new trust boundary is crossed. |
| V6 Cryptography | No | Not applicable |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|-----------------------|
| DOM-based XSS via gallery title/statement content | Tampering/Info Disclosure | Not a new risk introduced by this phase — content originates from Sanity at build time and is already rendered via Astro's auto-escaping template bindings (`{gallery.title}`, `{gallery.statement}`) exactly as the existing carousel/grid already do; this phase reuses the same `data-*` attribute read pattern, introducing no new unescaped-HTML sink. |
| Clickjacking / tap-hijack on the new tap-to-open slides | Tampering | Mirrors the existing carousel's own tap-to-open guard pattern (`target.closest(...)` exclusion) — Pitfall 1/CR-01 above is the concrete instance of this class of bug for this phase; the fix is a scoped click-target check, not a new security control. |

No new security-relevant surface is introduced by this phase — it is a pure client-side presentation/motion change over already-public, already-validated build-time content.

## Sources

### Primary (HIGH confidence)
- `src/components/DetailHero.astro` (lines 198-323) — the site's canonical pinned scroll-scrubbed reveal driver, read directly.
- `src/components/HomeCarousel.astro` (full file, 3078 lines) — existing wordmark cutout mechanism, accent-color `render()`, touch handlers, grid-tile hover-reveal CSS, toggle/grid markup, all read directly.
- `src/lib/home-carousel.ts` — existing pure-function seam (`computeWordmarkBackgroundPosition`, `detectSwipeDirection`, `computeWordmarkSeamFraction`, `pickRandomGalleryIndex`, `computeHoverZone`), read directly.
- `.planning/phases/20-mobile-navigation-accent-color/20-REVIEW.md` — CR-01 bug diagnosis and suggested fix, read directly.
- `.claude/skills/sketch-findings-ajs-website/references/homepage-motion.md` and `sources/015-homepage-wordmark-zoom/mobile.html` — the validated, user-confirmed-on-a-real-phone motion design and its exact source code, read directly.
- `.planning/phases/21-homepage-scroll-experience/21-CONTEXT.md` — all D-01 through D-16 locked decisions, read directly.
- `playwright.config.ts` — confirmed `webkit-mobile` project uses `devices['iPhone 15 Pro']` on the WebKit engine.

### Secondary (MEDIUM confidence)
- [MDN: Element: scrollsnapchange event](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollsnapchange_event) — official docs confirming "limited availability" experimental status.
- [MDN: Basic concepts of scroll snap](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll_snap/Basic_concepts) — official docs on scroll-snap-type/align/stop.

### Tertiary (LOW confidence — WebSearch only, not cross-checked against a second authoritative source this session)
- [InfoQ: Safari Adds Scrollend Event Support](https://www.infoq.com/news/2026/04/safari-scrollend-support/) — Safari 26.2 `scrollend` support date.
- [Chrome for Developers: Scroll Snap Events](https://developer.chrome.com/blog/scroll-snap-events) — `scrollsnapchange`/`scrollsnapchanging` browser rollout details.
- [Chrome for Developers: Scrollend, a new JavaScript event](https://developer.chrome.com/blog/scrollend-a-new-javascript-event) — general `scrollend` background.
- General web-search results on CSS Scroll Snap best practices (mandatory vs. proximity, `100dvh` vs `100vh`, `scroll-snap-stop: always`) and `prefers-reduced-motion` + `scroll-snap-type: none` pattern — directionally consistent across multiple independent sources but marked LOW per this session's provider tier (plain `websearch`, not cross-verified).

## Metadata

**Confidence breakdown:**
- Standard stack (no new packages, native APIs only): HIGH — verified by direct codebase reading; no registry/legitimacy check needed since nothing is installed.
- Architecture (real-page-scroll driver reuse, parallel-markup recommendation, wordmark geometry distinction): HIGH — directly derived from reading `DetailHero.astro`, `HomeCarousel.astro`, `home-carousel.ts`, and the sketch source in full.
- Browser API support specifics (`scrollend`/`scrollsnapchange` version numbers): LOW-MEDIUM — WebSearch-sourced, cross-referenced against MDN/Chrome-for-Developers/InfoQ but not verified via a live browser-support-table tool in this session; directionally reliable (the practical recommendation — IntersectionObserver-primary — is robust even if exact version numbers drift).
- Pitfalls: HIGH — mostly drawn directly from `20-REVIEW.md`'s documented bug and the sketch skill's own documented "what to avoid" list, both first-party project artifacts.

**Research date:** 2026-08-04
**Valid until:** 30 days for the codebase-pattern findings (stable, won't drift); 7-14 days for the specific browser-support-version claims (fast-moving — re-verify `scrollend`/`scrollsnapchange` support tables at implementation time if this phase's execution is delayed beyond that window).
