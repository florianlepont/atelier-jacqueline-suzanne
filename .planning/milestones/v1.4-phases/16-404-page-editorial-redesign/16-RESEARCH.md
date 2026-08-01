# Phase 16: 404 Page Editorial Redesign - Research

**Researched:** 2026-07-29
**Domain:** Client-side vanilla-JS interaction engineering (pointer/touch-rate-limited visual cycling) + build-time static-site image sourcing (Astro + Sanity), on a zero-server-compute static host
**Confidence:** MEDIUM-HIGH (core mechanics are well-established web-platform patterns; exact tuning constants are explicitly Claude's Discretion per CONTEXT.md, not open unknowns)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** This phase does **not** implement ERR-01/Phase 16 as originally worded (`PageTitleHeader` reuse). `ROADMAP.md`/`REQUIREMENTS.md` are stale on this point; `16-CONTEXT.md` is authoritative.
- **D-02:** Treat this as needing real design/interaction/accessibility rigor, not a "no design exploration needed" mechanical reuse.
- **D-03:** Full-bleed **single photo** background, one at a time — not a grid/mosaic.
- **D-04:** Photos come from Romane's existing gallery photography already in Sanity — not screenshots, not placeholders.
- **D-05:** Photo changes are a **hard instant cut** — no crossfade/flash transition.
- **D-06:** Centered content — AJS logo (`logoBlackSrc`/`logoWhiteSrc` from `SiteHeader.astro`, much larger than the header's 56px), a small "404" marker, "Page introuvable / Not found", and the two home-return links — laid out side by side, not stacked.
- **D-07:** Centered content floats over a **dimming scrim** (not a bordered panel), reusing `DetailHero.astro`'s `.detail-hero__scrim` / `.detail-hero__overlay-title` convention rather than inventing a new overlay pattern.
- **D-08:** Pop rate is driven by pointer distance from screen center — closer = faster, farther = slower.
- **D-09:** Touch devices derive the same speed curve from touch position (not a fixed fallback rate).
- **D-10 (accessibility-critical):** Max pop rate **must be capped** at ≈3 changes/second or under, even with pointer/touch held at dead-center. Not a style preference — a genuine photosensitive-seizure-risk mitigation the user explicitly agreed to. The cap must be load-bearing from the start, never "add later."
- **D-11 (deliberate divergence from site convention):** `prefers-reduced-motion` shows a **slow, constant, non-pointer-driven drift** (not the hard-freeze-to-settled-state pattern this codebase uses everywhere else — About's pinned hero, Éditions' sticky reveal, HomeCarousel/Lightbox view transitions). Pick a concrete slow interval (e.g., one photo every 3-5 seconds) well under any flash-rate concern.
- **D-12:** Exact final copy/wording can be finalized during implementation; meaning must stay the same as today's copy in both languages. Layout is far more compact than today, so condensing existing sentences is expected and fine.

### Claude's Discretion
- Exact size/pool of photos cycled through — pick something that preloads cleanly and doesn't create a network stall at the capped ~3/sec rate.
- Precise scrim opacity/gradient and logo size/color (black vs. white, or swapping based on the current background photo's dominant tone) for legibility across all pool photos.
- Concrete reduced-motion drift interval (D-11) — a specific, well-under-flash-threshold cadence.
- Whether the "404" marker sits above, beside, or below the logo/phrase block.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ERR-01 | 404 page gets a fully custom, interactive redesign — full-bleed backdrop of Romane's photography popping (hard-cutting) at a pointer/touch-proximity-driven rate, AJS logo + "404" marker + bilingual phrase over a dimming scrim (revised 2026-07-29, see 16-CONTEXT.md) | Architecture Patterns (photo-pool sourcing, hard-cut swap mechanic), Code Examples (rate limiter, pointer/touch unification, reduced-motion drift), Common Pitfalls (WCAG flash cap, eager-fetch vs. `display:none`, pointerleave reset), Validation Architecture (rate-limiter unit test, reduced-motion e2e emulation) |
</phase_requirements>

## Summary

This phase is pure client-side interaction engineering plus a build-time data-sourcing question — it needs **zero new npm dependencies**. Astro 7.1.4 [VERIFIED: local `node_modules/astro/package.json`], `@sanity/client` 7.23.0, and `@sanity/image-url` 2.1.1 (both already installed and used by every other page) are the entire stack. The homepage (`src/pages/index.astro`) already solved "pick one representative photo per published gallery" via `getGalleries()` → filter `images.length > 0` → `pickHeroIndex(images)` → `fullSizeUrl`/`responsiveImageSrcSet` [VERIFIED: codebase, `src/pages/index.astro` lines 35-51] — the 404 page's photo pool should reuse this exact selection/URL-building logic rather than invent a new one, just without the homepage's `showOnHomePage` filter (this page wants maximum variety, not homepage curation).

The three genuinely novel pieces are: (1) a capped, continuously-recomputed pop-rate engine driven by pointer/touch distance from viewport center, (2) an image-loading strategy that guarantees no stutter/blank-frame at the ~3/sec cap, and (3) a `prefers-reduced-motion` branch that deliberately does the *opposite* of every other component's reduced-motion convention on this site (drift, not freeze). All three are solvable with well-established, dependency-free browser platform APIs (`requestAnimationFrame`, Pointer Events, `matchMedia`) already used elsewhere in this codebase (`DetailHero.astro`, `HomeCarousel.astro`).

**Primary recommendation:** Render the entire curated photo pool as real, absolutely-positioned `<img>` elements in the static HTML at build time (not a client-fetched/JS-`Image()`-preloaded list). Use opacity/z-index toggling with **no CSS transition** for the hard-cut swap (never `display:none`, which would suppress the browser's normal eager image fetch and reintroduce the exact "network stall" risk CONTEXT.md warns about). Drive the swap timing from a `requestAnimationFrame` accumulator that recomputes the target interval from the last-known pointer/touch proximity every frame, clamped to a hard floor (`Math.max(computedInterval, MIN_INTERVAL_MS)` where `MIN_INTERVAL_MS ≈ 350ms`, comfortably under the ~3/sec WCAG-adjacent cap). This gives a real, working, zero-JS-safe fallback (the first `<img>` is simply the only one at `opacity:1` by default) essentially for free.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Photo pool selection (which galleries/photos, how many) | Database/Storage (Sanity, build-time GROQ) | CDN/Static (image renditions served from Sanity's CDN) | `getGalleries()` runs at Astro build time only; the resulting URLs are static CDN URLs baked into the HTML — no runtime Sanity call ever reaches the browser (matches every other page's build-time-only Sanity boundary). |
| Static HTML generation (image `<img>` stack, home links, logo, copy) | CDN/Static (Astro static build output) | — | `output: 'static'` — this page is 100% pre-rendered HTML/CSS with no server tier at all; OVH/GitHub Pages just serve the file. |
| Pop-rate engine (pointer/touch → capped swap timing) | Browser/Client | — | Purely a `requestAnimationFrame` + Pointer Events loop; must run entirely client-side since it reacts to live cursor/touch position, which doesn't exist at build or request time. |
| Reduced-motion drift fallback | Browser/Client | — | A `matchMedia('(prefers-reduced-motion: reduce)')` branch inside the same client engine — same tier as the pop-rate engine, just a different timing source. |
| No-JS static fallback (first photo + scrim + copy always visible) | CDN/Static (build-time markup, default CSS state) | — | Achieved by construction (first `<img>` defaults to visible, all others default hidden) — requires no separate `<noscript>` JS-detection branch, unlike `DetailHero.astro`'s reveal panel which needs an explicit `<noscript>` override. |
| Base-aware asset paths + locale home links | CDN/Static (Astro build-time, `import.meta.env.BASE_URL` + `getRelativeLocaleUrl()`) | — | Resolved once at build time into plain literal `href`/`src` strings; this is the exact mechanism CR-01 (Phase 1 review) found broken when it was hand-rolled instead. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | 7.1.4 | Static build, frontmatter data-fetch, typed `<script>` islands | [VERIFIED: local `node_modules/astro/package.json`] — already the entire site's framework; `output: 'static'` per `astro.config.mjs`, no adapter. |
| `@sanity/client` | 7.23.0 | Build-time GROQ fetch of gallery cover photos for the pop-pool | [VERIFIED: `package.json`] — already imported by every page needing gallery data (`src/lib/sanity.ts`); reused, not newly added. |
| `@sanity/image-url` | 2.1.1 | Build-time CDN image URL construction (`fullSizeUrl`, `responsiveImageSrcSet`, `blurPlaceholderUrl`) | [VERIFIED: `package.json`] — `src/lib/image.ts` already exports the exact helpers this phase needs. |
| TypeScript (native `<script>` in `.astro`) | ^5.9.3 | The pop-rate engine, pointer/touch unification, reduced-motion branch | [VERIFIED: `package.json`] — matches `DetailHero.astro`'s existing typed, dependency-free `<script>` convention (`document.querySelector<HTMLElement>`, no bundler-level import needed for DOM code). |

**No new packages are required for this phase.** Everything is either already installed or a native browser API (Pointer Events, `requestAnimationFrame`, `matchMedia`, `IntersectionObserver` if needed).

### Supporting
None beyond the Core table — this is intentionally a zero-new-dependency phase, consistent with the site's near-zero-cost, zero-JS-by-default posture.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Real stacked `<img>` elements (build-time), opacity/z-index hard-swap | `<canvas>` drawImage-based cycling | Canvas would need manual image decode/draw management and loses the browser's native lazy/eager fetch + cache semantics for free; no accessibility benefit here since the images are decorative. Not worth the complexity. |
| Real stacked `<img>` elements | CSS `background-image` swap on a single div | Background-image swapping doesn't let the browser attribute a natural "this image is now needed" signal the same way `<img loading>` does, and loses `srcset`/`sizes` responsive selection entirely (would need manual `matchMedia`-based width picking in JS). `<img>` + `object-fit: cover` (the exact pattern `DetailHero.astro` already uses) is simpler and keeps responsive image selection native. |
| `requestAnimationFrame` accumulator for rate limiting | `setInterval`/`setTimeout` reconfigured on every pointer move | `setInterval` cannot smoothly retarget its own period without a clear/reset (causing drift/restart artifacts), and is subject to browser timer coalescing/throttling that doesn't track wall-clock elapsed time as precisely as an rAF-driven elapsed-time check. [CITED: nolanlawson.com/Read the Tea Leaves "High-performance input handling on the web" / "Browsers, input events, and frame throttling"] |
| Pointer Events (`pointermove`/`pointerdown`/`pointerup`) as the single input source for both mouse and touch | Separate `mousemove` + `touchmove` listeners (as CONTEXT.md's D-09 literally names `touchmove`) | Pointer Events unify mouse/touch/pen into one event stream and have been broadly supported since ~2020 [CITED: MDN Pointer Events docs, via websearch]. This satisfies D-09's *intent* (touch position drives the same curve) with less code and no risk of the two listeners disagreeing on state. See Open Questions — flagged because it's a literal-vs-intent judgment call, not because it risks non-compliance. |

**Installation:** None — no `npm install` needed for this phase.

## Package Legitimacy Audit

**Not applicable — this phase installs zero new packages.** All libraries used (`astro`, `@sanity/client`, `@sanity/image-url`, `typescript`) are pre-existing, already-audited project dependencies (see Phase 1/2 REVIEW.md history for their original legitimacy checks). No `npm view`/`package-legitimacy check` run was needed or performed.

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
BUILD TIME (Astro static build, no request-time compute)
┌──────────────────────────────────────────────────────────────────┐
│ src/pages/404.astro frontmatter                                  │
│                                                                    │
│  getGalleries()  ──────►  filter images.length > 0                │
│  (src/lib/sanity.ts)              │                               │
│                                    ▼                               │
│                        pickHeroIndex(images) per gallery           │
│                        (src/lib/image-orientation.ts, reused)      │
│                                    │                               │
│                                    ▼                               │
│         cover photo per gallery ──► fullSizeUrl / responsiveImageSrcSet
│                                     (src/lib/image.ts, reused)      │
│                                    │                               │
│                                    ▼                               │
│              getHeroTextColor(gallery.heroColor)                   │
│              (src/lib/i18n-paths.ts, reused) → per-photo textColor │
│                                    │                               │
│                                    ▼                               │
│         pool[] = [{ src, srcset, alt:"", textColor }, ...]         │
│                                    │                               │
│  getRelativeLocaleUrl('fr'/'en')  │  assetBase (BASE_URL)          │
│         │                          │              │                │
│         ▼                          ▼              ▼                │
│  <a href> home links      <img> stack (N)   logo <img> src         │
└──────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼  (baked into static HTML/CSS)
BROWSER (request time — no server compute exists)
┌──────────────────────────────────────────────────────────────────┐
│ Page load: all N pool <img> tags fetch in parallel                │
│ (opacity:0 except pool[0]; NEVER display:none → fetch not skipped)│
│                                                                     │
│   pointermove / pointerdown / pointerup / pointerleave             │
│                │                                                   │
│                ▼                                                   │
│   currentProximity (0..1, distance from viewport center)            │
│                │                                                   │
│                ▼                                                   │
│   requestAnimationFrame loop (every frame):                        │
│     targetInterval = lerp(MAX_INTERVAL_MS, MIN_INTERVAL_MS,        │
│                            currentProximity)                        │
│     targetInterval = Math.max(targetInterval, MIN_INTERVAL_MS)      │
│     if (now - lastSwapAt >= targetInterval) → swap active index    │
│                │                                                   │
│                ▼                                                   │
│   toggle opacity/z-index on <img data-pool-index>                  │
│   (no CSS transition declared → instant hard cut, D-05)            │
│                                                                     │
│   matchMedia('(prefers-reduced-motion: reduce)')                   │
│     → branch: ignore pointer, swap every fixed DRIFT_INTERVAL_MS   │
└──────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure
```
src/
├── pages/
│   └── 404.astro              # unchanged file identity; body content replaced
├── lib/
│   ├── sanity.ts               # reused as-is (getGalleries)
│   ├── image.ts                # reused as-is (fullSizeUrl, responsiveImageSrcSet)
│   ├── image-orientation.ts    # reused as-is (pickHeroIndex)
│   ├── i18n-paths.ts           # reused as-is (getHeroTextColor)
│   └── pop-rate.ts             # NEW — pure, framework-free proximity→interval math
│                                #        (unit-testable in isolation, mirrors
│                                #        image-orientation.ts's pure-function style)
└── components/
    ├── SiteHeader.astro        # source of logoBlackSrc/logoWhiteSrc (reused)
    └── DetailHero.astro        # source of .detail-hero__scrim CSS technique (adapted, not copied verbatim)
```

### Pattern 1: Build-time photo-pool sourcing (reuse homepage's exact selection logic)
**What:** One representative "cover" photo per published gallery, sourced identically to how `src/pages/index.astro` already builds its homepage carousel pool.
**When to use:** Any time this codebase needs "one good photo per gallery" — this is now the third consumer of the same pattern (homepage carousel, gallery detail hero via `pickHeroIndex`, and now the 404 pool).
**Example:**
```typescript
// Source: src/pages/index.astro (existing, lines ~35-51) — adapt for 404.astro
import { getGalleries } from '../lib/sanity';
import { pickHeroIndex } from '../lib/image-orientation';
import { fullSizeUrl, responsiveImageSrcSet } from '../lib/image';
import { getHeroTextColor } from '../lib/i18n-paths';

const galleries = (await getGalleries()).filter((g) => g.images.length > 0);
// Note: deliberately NO `showOnHomePage` filter here — the 404 pool wants
// maximum variety across the whole site, not homepage curation.
const pool = galleries.map((gallery) => {
  const cover = gallery.images[pickHeroIndex(gallery.images)];
  return {
    src: fullSizeUrl(cover, 1920),
    srcset: responsiveImageSrcSet(cover),
    alt: '', // decorative background, never meaningful alt text
    textColor: getHeroTextColor(gallery.heroColor ?? '#1A1A1A'),
  };
});
```

### Pattern 2: Hard-cut photo swap via opacity/z-index toggle (never `display:none`)
**What:** All pool photos render as real `<img>` tags, stacked with `position:absolute; inset:0`. The "active" one has `opacity:1; z-index:1`; all others `opacity:0; z-index:0`. No `transition` property is declared on `opacity`, so the swap is visually instant — satisfying D-05's "hard cut, no crossfade" while every image remains normally fetchable by the browser the entire time.
**When to use:** Exactly this phase's background-photo mechanic.
**Example:**
```css
/* Source: adapted from SiteHeader.astro's own hard display:none/block
   logo-hover swap ("no transition/opacity" — same instant-swap philosophy),
   but using opacity instead of display so eager image fetch is never
   suppressed. */
.pop-photo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  z-index: 0;
  /* Deliberately NO transition property here — that absence IS the
     hard-cut mechanic (D-05). Do not add `transition: opacity ...`. */
}
.pop-photo.is-active {
  opacity: 1;
  z-index: 1;
}
```
```html
<!-- First pool image is is-active by default in the static markup itself —
     this is the entire no-JS fallback: a single correct photo, already
     visible, with zero JS dependency. -->
<img class="pop-photo is-active" src={pool[0].src} srcset={pool[0].srcset} alt="" loading="eager" />
<img class="pop-photo" src={pool[1].src} srcset={pool[1].srcset} alt="" loading="eager" fetchpriority="low" />
```

### Pattern 3: `requestAnimationFrame` accumulator for a capped, continuously-retargetable rate
**What:** Instead of a `setInterval` whose period must be torn down/rebuilt to change, run a per-frame check: "has enough wall-clock time elapsed since the last swap, given the *current* target interval?" The target interval is recomputed from live pointer/touch state every single frame, so the effect speeds up/slows down smoothly with zero timer-reconfiguration drift.
**When to use:** Any continuously-variable-rate effect driven by a live, frequently-changing input (mirrors this codebase's existing scroll-driven `onProgress` pattern in `DetailHero.astro`, adapted from scroll position to pointer proximity).
**Example:**
```typescript
// Source: synthesized from general rAF-throttling guidance (nolanlawson.com,
// MDN requestAnimationFrame docs) — this is a documented technique, not a
// copy-pasteable single official snippet, so treat the code below as
// [ASSUMED]-tier implementation detail atop a [CITED] technique.
const MIN_INTERVAL_MS = 350; // ⌈1000/3⌉ with safety margin: 1000/350 ≈ 2.86/sec, under the ~3/sec cap (D-10)
const MAX_INTERVAL_MS = 2200; // idle / far-from-center cadence — a felt, deliberate slowdown
const DRIFT_INTERVAL_MS = 4000; // prefers-reduced-motion constant cadence (D-11) — within the user's own suggested 3-5s range

let currentProximity = 0; // 0 = idle/far, 1 = dead-center
let lastSwapAt = 0;
let activeIndex = 0;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function tick(now: number) {
  const targetInterval = Math.max(
    lerp(MAX_INTERVAL_MS, MIN_INTERVAL_MS, currentProximity),
    MIN_INTERVAL_MS, // hard floor — enforced every frame, independent of proximity math
  );
  if (now - lastSwapAt >= targetInterval) {
    swapTo((activeIndex + 1) % pool.length);
    lastSwapAt = now;
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
```

### Pattern 4: Pointer/touch proximity via Pointer Events, with explicit idle reset
**What:** A single `pointermove` listener (covers mouse, touch, and pen) computes normalized distance from viewport center. Explicit `pointerup`/`pointercancel`/`pointerleave` handlers reset `currentProximity` to 0 (idle) so the effect doesn't stay "stuck" at max speed after the user lifts a finger or moves the mouse off-window — the loop must keep running at the *last known* proximity while the pointer is stationary-but-present (D-10's "held at dead-center" implies exactly this), but must NOT persist that value after the pointer genuinely leaves/lifts.
**Example:**
```typescript
// Source: MDN Pointer Events docs (via websearch) for the API surface;
// idle-reset requirement is this project's own accessibility reasoning.
const container = document.querySelector<HTMLElement>('.not-found');

function updateProximity(clientX: number, clientY: number) {
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  const distance = Math.hypot(clientX - cx, clientY - cy);
  const maxDistance = Math.hypot(cx, cy); // center-to-corner distance
  currentProximity = 1 - Math.min(1, distance / maxDistance);
}

container?.addEventListener('pointermove', (e) => updateProximity(e.clientX, e.clientY), { passive: true });
container?.addEventListener('pointerleave', () => { currentProximity = 0; }, { passive: true });
container?.addEventListener('pointerup', () => { currentProximity = 0; }, { passive: true });
container?.addEventListener('pointercancel', () => { currentProximity = 0; }, { passive: true });
window.addEventListener('blur', () => { currentProximity = 0; });
```
```css
/* touch-action: none is required — this page has no scrollable content
   (single-viewport, no scroll at all), so disabling default touch
   scroll/pan gestures on the container ensures pointermove fires reliably
   during a touch-drag on mobile instead of the browser hijacking the
   gesture for scrolling. [CITED: MDN touch-action docs, via websearch —
   note iOS Safari has historically had partial touch-action support, so
   also set `overflow: hidden` on <body> for this page as a belt-and-braces
   measure.] */
.not-found {
  touch-action: none;
}
```

### Pattern 5: `prefers-reduced-motion` branch — deliberate drift, not freeze
**What:** Unlike every other animated component on this site (which freezes to a settled end-state under reduced motion), this effect keeps cycling photos, just on a slow fixed interval, ignoring pointer/touch entirely. Attach a `matchMedia('(prefers-reduced-motion: reduce)')` `change` listener (matching `DetailHero.astro`'s own `reduceMotion.addEventListener('change', setup)` convention) so a live OS-level toggle re-branches without a page reload.
**Example:**
```typescript
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

function setup() {
  if (reduceMotion.matches) {
    // Ignore pointer entirely — do not even attach pointermove in this branch,
    // per D-11 ("non-pointer-driven drift"). Run a fixed-interval loop instead.
    runFixedIntervalLoop(DRIFT_INTERVAL_MS);
  } else {
    runPointerDrivenLoop();
  }
}
setup();
reduceMotion.addEventListener('change', setup);
```

### Anti-Patterns to Avoid
- **`display:none`/`block` toggling for the photo swap:** Breaks the browser's normal eager-fetch behavior for hidden images on some engines/heuristics, reintroducing the exact "network stall at the capped rate" risk CONTEXT.md flags. Use opacity/z-index with no transition instead (Pattern 2).
- **`setInterval` reconfigured on every pointer move:** Causes drift/restart artifacts and doesn't track true elapsed time as precisely as an rAF accumulator. [CITED: nolanlawson.com]
- **Copying `DetailHero.astro`'s scrim gradient direction verbatim:** `DetailHero` uses a bottom-anchored linear gradient (`to top, ...`) because its title sits bottom-left. This phase's content is **centered**, so a bottom-heavy gradient under-dims the middle of the frame where the logo/text actually sit. Reuse the *technique* (an absolutely-positioned, `pointer-events:none`, semi-opaque overlay layer) but adapt the shape — a radial gradient centered on the viewport, or a flat uniform dim value strong enough for centered text, not a directional edge gradient.
- **Uncapped "for feel" rate with the cap "added later":** D-10 is explicit that this is not acceptable — the cap must be present from the very first working version.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Mouse-vs-touch position unification | Two separate `mousemove`/`touchmove` listeners with duplicated distance math | A single `pointermove` listener (Pattern 4) | Pointer Events already unify this; duplicating the math in two listeners is a real source of the two paths silently drifting out of sync over time. |
| Responsive image URL generation | Manual Sanity CDN query-string construction | `fullSizeUrl`/`responsiveImageSrcSet` from `src/lib/image.ts` (already exists, already used by every gallery-photo consumer) | Already handles `auto('format')` (automatic WebP/AVIF), width descriptors, and is unit-tested (`tests/unit/image.test.ts`). |
| Logo/text contrast-safe color choice per background photo | A new dominant-color image-analysis step | `getHeroTextColor()` from `src/lib/i18n-paths.ts` (already exists — computes WCAG relative-luminance-based ink/white contrast pick from a hex color) | Already exists, already tested, and every gallery already carries a `heroColor` field this can key off of — no new build-time image analysis needed. |
| Base-aware asset paths | Any new path-joining helper | `import.meta.env.BASE_URL` + the exact `assetBase` pattern already used in `BaseLayout.astro`/`SiteHeader.astro` | This is the CR-01 lesson from Phase 1's review — a hand-rolled path here has already caused one real, live, deployed bug on this exact page. |

**Key insight:** Every piece of "data plumbing" this phase needs (gallery photos, responsive URLs, base-aware paths, locale-aware home links, contrast-safe color picking) already exists and is already tested elsewhere in this codebase. The only genuinely new code is the client-side pop-rate engine itself (Patterns 3-5).

## Common Pitfalls

### Pitfall 1: Cap computed too close to the literal 3/sec boundary
**What goes wrong:** `MIN_INTERVAL_MS = 333` gives `1000/333 ≈ 3.003` changes/sec — technically *over* the "no more than 3 flashes per second" language, not under it.
**Why it happens:** `1000/3 = 333.33...`, and naively flooring to 333 rounds the wrong direction.
**How to avoid:** Use `350ms` (≈2.86/sec) or explicitly compute `Math.ceil(1000/3) + safetyMarginMs`.
**Warning signs:** Any hardcoded `333` in the codebase for this feature.

### Pitfall 2: `display:none` on hidden pool photos silently reintroducing the network stall
**What goes wrong:** If the "off" state uses `display:none` (matching `SiteHeader.astro`'s logo-hover convention byte-for-byte), some browsers defer/skip fetching those images until they become visible — meaning the *first* time a hidden photo needs to swap in, it may not be loaded yet, causing a blank frame or a stutter at the capped rate.
**Why it happens:** Copying the logo-hover swap pattern literally without noticing it relies on `display:none`, which this use case cannot afford.
**How to avoid:** Use opacity/z-index toggling instead (Pattern 2), which keeps every image in normal layout/paint flow (just invisible), so the browser treats them as ordinary on-page images subject to normal eager fetch.
**Warning signs:** Photos flashing blank/broken-image icon under sustained dead-center pointer holding.

### Pitfall 3: Pointer "stuck" at max speed after leaving the window/lifting a finger
**What goes wrong:** Without explicit `pointerleave`/`pointerup`/`pointercancel`/`blur` handlers resetting `currentProximity` to 0, a visitor who touches dead-center once and lifts their finger leaves the engine cycling at max (capped, but still fastest) speed indefinitely.
**Why it happens:** The rAF loop reads whatever `currentProximity` was last set to; without an explicit "no active pointer" signal, that's whatever the last real event reported.
**How to avoid:** Pattern 4's explicit reset handlers.
**Warning signs:** Manual test — touch center once, lift finger, watch whether the rate visibly slows back down.

### Pitfall 4: Existing `not-found.spec.ts` and `accessibility.spec.ts` gaps
**What goes wrong:** `tests/e2e/not-found.spec.ts` currently asserts `getByRole('heading', {name: 'Page introuvable'})` / `{name: 'Page not found'})` — literal heading text that will very likely change once copy is condensed per D-12's compact layout. If left unupdated, this test will fail (a legitimate catch, not a false positive) the moment the new markup ships.
**Why it happens:** The test was written against the pre-redesign markup and has not been touched since.
**How to avoid:** Update `not-found.spec.ts`'s assertions alongside the redesign (same PR), not as an afterthought. Additionally, `tests/e2e/accessibility.spec.ts`'s hardcoded path array does **not** currently include the 404 page at all [VERIFIED: codebase, `accessibility.spec.ts` lines 4-13] — this phase introduces real new accessibility surface (dynamic image swapping, decorative-image ARIA, scrim contrast) that has zero automated a11y coverage today. Add a 404 entry.
**Warning signs:** CI failing on `not-found.spec.ts` after implementation (expected — fix the assertions, don't relax the cap or D-05/D-06 behavior to make the old test pass).

### Pitfall 5: `verify-static-artifact.mjs`'s exact-string CI gate
**What goes wrong:** `tests/scripts/verify-static-artifact.mjs` (a **blocking CI gate**) does a literal string search for `href="${expectedBase}"` and `href="${expectedBase}en/"` inside the built `404.html` [VERIFIED: codebase, lines 37-40]. If the home links are restructured in a way that changes how the base-prefixed path is rendered (e.g., wrapped through a JS templating step, or the href attribute value gets extra query params/fragments before the path), this exact-match check can fail even though the links still work correctly for real visitors.
**Why it happens:** The check is a plain regex/`includes()` string match, not a semantic HTML parse.
**How to avoid:** Keep the home links as plain, literal `<a href={frHome}>`/`<a href={enHome}>` anchors computed once in frontmatter via `getRelativeLocaleUrl()` — exactly as today, just restyled/repositioned. Do not introduce any conditional/JS-computed href for these two links.
**Warning signs:** `npm run test:artifact` failing with "404.html is missing /ajs-website/" or similar, post-implementation.

### Pitfall 6: Decorative photo pool becoming screen-reader noise
**What goes wrong:** N stacked `<img>` tags with missing/wrong `alt` attributes get announced individually by assistive technology, turning a small 404 page into a page that reads as "image, image, image, image, ... 404, page not found."
**Why it happens:** Easy to forget when the images are the visual centerpiece of the redesign.
**How to avoid:** Every pool `<img>` gets `alt=""` (decorative) and the whole stack container gets `aria-hidden="true"`, matching `DetailHero.astro`'s existing `.detail-hero__scrim`/overlay-title `aria-hidden="true"` convention. The real accessible content is the heading/paragraph/links, which must NOT be `aria-hidden`.
**Warning signs:** axe/VoiceOver flagging unlabeled images once the 404 page is added to `accessibility.spec.ts` (see Pitfall 4).

## Runtime State Inventory

Not applicable — this is a visual/interaction redesign of a single existing file (`src/pages/404.astro`), not a rename/refactor/migration. No stored data, live service config, OS-registered state, secrets, or build artifacts reference this page by name in a way that a code change would break.

## Code Examples

See Architecture Patterns 1-5 above for the primary, verified-against-codebase examples (build-time photo sourcing, hard-cut swap CSS, rAF accumulator, pointer/touch unification, reduced-motion branch). No further external code examples are needed — this phase's implementation surface is fully covered by adapting existing in-repo patterns (`index.astro`, `DetailHero.astro`, `SiteHeader.astro`) plus standard browser platform APIs.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Separate `mousemove`/`touchmove` listeners for cross-device pointer tracking | Unified Pointer Events (`pointermove`/`pointerdown`/`pointerup`/`pointercancel`) | Broadly supported since ~2020 [CITED: MDN, via websearch] | Simpler, single code path; this codebase has no prior Pointer Events usage to date, so this would be the first component to adopt it — worth flagging to the planner as a small but real convention decision, not just "the obvious choice." |
| `setInterval`-based animation timing | `requestAnimationFrame`-driven elapsed-time accumulators | Long-standing best practice, not a recent change | Avoids drift, respects browser rAF throttling/pausing in background tabs (which is a safety *benefit* here — no flashing in a hidden tab). |

**Deprecated/outdated:** None specific to this phase's stack — nothing here is being replaced; this is greenfield interaction code within an otherwise-stable Astro 7 site.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `MIN_INTERVAL_MS = 350ms` / `MAX_INTERVAL_MS = 2200ms` / `DRIFT_INTERVAL_MS = 4000ms` are good concrete defaults | Code Examples, Pattern 3 | Low — these are explicitly Claude's Discretion per CONTEXT.md; if the planner or a later checkpoint picks different numbers, only the constants change, not the mechanism. |
| A2 | Recommending Pointer Events (`pointermove`) as the primary implementation instead of literal `touchmove` (as D-09's prose names it) still satisfies D-09's intent | Alternatives Considered, Pattern 4 | Medium — if a stakeholder reads D-09 as mandating the literal `touchmove` API (not just "touch position drives the curve"), this needs confirmation before implementation. Flagged explicitly in Open Questions below. |
| A3 | Excluding `showOnHomePage` filter (i.e., pooling ALL published galleries, not just homepage-visible ones) is the right pool-sourcing default | Pattern 1 | Low — this is explicitly Claude's Discretion per CONTEXT.md ("exact size/pool... pick something that preloads cleanly"); easy to add the filter back if a reviewer prefers homepage-parity. |
| A4 | Current gallery count/photo pool size is large enough to feel varied (not just 3-4 photos repeating) | Open Questions | Low-Medium — cosmetic only; even a small pool still satisfies every locked decision (D-03 through D-10), just feels less varied. |

**A2 in particular should be confirmed with the user or explicitly decided by the planner before implementation**, since it's the one place this research diverges from CONTEXT.md's literal wording (in service of a simpler, more robust implementation).

## Open Questions

1. **Should the implementation use `touchmove` literally, or is a unified `pointermove` handler acceptable?**
   - What we know: D-09 says "touch position drives the same speed curve via `touchmove`." Pointer Events (`pointermove`) is the modern, simpler, well-supported way to achieve the identical *user-facing* behavior for both mouse and touch in one code path.
   - What's unclear: Whether "via touchmove" in CONTEXT.md was a literal API mandate or just the author's shorthand for "touch position, continuously sampled."
   - Recommendation: Default to Pointer Events (Pattern 4) for the simpler, more robust implementation, since the same-curve *behavior* is what's actually locked (D-09), not a specific DOM API. Flag this choice explicitly to the user at plan-review or checkpoint time given it is the one place this research diverges from CONTEXT.md's literal text.

2. **Actual current published-gallery/photo count.**
   - What we know: `getGalleries()` returns whatever is currently published in Sanity; the exact count wasn't queried during this research session (no live Sanity credential probe was performed — `.env` exists locally per Environment Availability below, so the actual count is trivially checkable at implementation time via a one-line `console.log((await getGalleries()).length)`).
   - What's unclear: Whether the resulting pool is large enough (say, 15+) to feel varied, or small enough (say, 4-5) that the effect reads as repetitive after a few seconds of dead-center holding.
   - Recommendation: Not a blocker — check the count during implementation; if small, consider also pulling in a second photo per gallery (not just the single cover) to enlarge the pool, still bounded to keep preload light.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Astro build | ✓ | v22.22.3 | — |
| npm | dependency install/build scripts | ✓ | 10.9.8 | — |
| Sanity build-time credentials (`.env`: `SANITY_PROJECT_ID`/`SANITY_DATASET`/`SANITY_API_READ_TOKEN`) | `getGalleries()` at build time for the photo pool | ✓ (`.env` present in this worktree) | — | — |
| Pointer Events API (browser runtime) | Pop-rate engine's input source | ✓ (broad support since ~2020 across evergreen browsers; Playwright's tested targets are Chromium + WebKit, both current) | — | If a target browser lacked Pointer Events, `mousemove`+`touchmove` fallback listeners could be added, but no current CI-tested browser needs this. |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none identified.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.9 (unit) + Playwright 1.61.1 (e2e), both already configured as CI-blocking gates [VERIFIED: `package.json`, CLAUDE.md CI pipeline description] |
| Config file | `vitest.config.ts` (uses `astro/config`'s `getViteConfig`), `playwright.config.ts` |
| Quick run command | `npm run test:unit -- pop-rate` (new file) / `npx playwright test not-found` |
| Full suite command | `npm run test:coverage` (unit) / `npm run test:e2e` (Playwright) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ERR-01 | Pop-rate math never produces an interval below the WCAG-adjacent cap, across the full proximity range 0..1 | unit | `npx vitest run tests/unit/pop-rate.test.ts` | ❌ Wave 0 — new `src/lib/pop-rate.ts` + test needed |
| ERR-01 | Reduced-motion branch ignores pointer entirely and swaps on the fixed drift interval | e2e | `npx playwright test not-found -g "reduced motion"` | ❌ Wave 0 — extend `tests/e2e/not-found.spec.ts` using `page.emulateMedia({ reducedMotion: 'reduce' })` [CITED: Playwright docs, via websearch] |
| ERR-01 | 404 still serves HTTP 404, bilingual content, correct `noindex` meta, base-aware home link hrefs | e2e | `npx playwright test not-found` | ✅ exists — `tests/e2e/not-found.spec.ts` (assertions need updating for new markup/copy, see Pitfall 4) |
| ERR-01 | Built `404.html` contains the exact base-prefixed home link hrefs (CR-01 regression class) | build-artifact check | `npm run test:artifact` | ✅ exists — `tests/scripts/verify-static-artifact.mjs` (already blocking, no change needed as long as Pitfall 5 is respected) |
| ERR-01 | No serious/critical automated a11y violations on the redesigned 404 page (decorative images, contrast, focus order) | e2e (axe) | `npx playwright test accessibility` | ❌ Wave 0 — add a 404 path entry to `tests/e2e/accessibility.spec.ts`'s path array (currently absent, see Pitfall 4) |

### Sampling Rate
- **Per task commit:** `npx vitest run tests/unit/pop-rate.test.ts` (fast, pure-function math)
- **Per wave merge:** `npm run test:e2e -- not-found accessibility` + `npm run test:artifact`
- **Phase gate:** Full suite green (`npm run test:coverage` + `npm run test:e2e` + `npm run test:artifact`) before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/lib/pop-rate.ts` — new pure module (proximity→interval mapping + hard-floor clamp), extracted specifically so it's unit-testable without simulating real pointer/touch events in a browser (mirrors `image-orientation.ts`'s pure-function testability pattern).
- [ ] `tests/unit/pop-rate.test.ts` — covers the interval math at proximity 0, 0.5, 1, and confirms the floor never goes under the configured `MIN_INTERVAL_MS`.
- [ ] `tests/e2e/not-found.spec.ts` — update existing heading-text assertions for the new condensed copy (D-12), add a `page.emulateMedia({ reducedMotion: 'reduce' })` case.
- [ ] `tests/e2e/accessibility.spec.ts` — add the 404 route to the scanned path array (currently entirely absent from automated a11y coverage).

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V2 Authentication | No | Page has no auth surface. |
| V3 Session Management | No | No session state introduced. |
| V4 Access Control | No | Public, unauthenticated page (already `noIndex`, already public). |
| V5 Input Validation | No direct user input on this page (pointer/touch coordinates are read-only telemetry, never persisted, never sent anywhere, never used to construct a DOM string/HTML injection point) | N/A — no new validation surface. |
| V6 Cryptography | No | No cryptographic operations. |

**This phase does not meaningfully expand the site's security/ASVS surface.** No forms, no user-supplied data reflected into the DOM, no new network calls at runtime (all Sanity access remains build-time-only, per the existing architecture's token boundary — `src/lib/sanity.ts`'s own doc comment already states this must never reach the browser, and this phase introduces no new call site that would change that).

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|----------------------|
| Client-side resource exhaustion via an unbounded/too-large image preload pool (self-inflicted, not attacker-driven, but a real reliability risk on constrained mobile connections) | Denial of Service (client-side) | Cap the pool size (Claude's Discretion, but recommend staying in the ~10-24 image range) and use `fetchpriority="low"` on non-first images so they don't compete with the critical first-paint photo/logo/text for bandwidth. |
| Reflected content in dynamically-swapped `<img alt>`/text | Tampering (XSS via CMS content) | Not applicable here — all pool image `alt` values are hardcoded `""` (decorative), never populated from Sanity's per-image `alt` field for this specific use, since the photos are backdrop, not documented content. |

## Sources

### Primary (HIGH confidence)
- Codebase, `src/pages/index.astro` (lines 35-51) — verified existing gallery-cover-photo selection pattern.
- Codebase, `src/lib/sanity.ts`, `src/lib/image.ts`, `src/lib/image-orientation.ts`, `src/lib/i18n-paths.ts` — verified existing reusable build-time helpers.
- Codebase, `src/components/DetailHero.astro`, `src/components/SiteHeader.astro` — verified existing scrim/hard-swap CSS conventions.
- Codebase, `tests/e2e/not-found.spec.ts`, `tests/e2e/accessibility.spec.ts`, `tests/scripts/verify-static-artifact.mjs` — verified existing test coverage and gaps.
- Local `node_modules/astro/package.json` — verified installed Astro version (7.1.4).

### Secondary (MEDIUM confidence)
- [WCAG 2.3.1 Three Flashes or Below Threshold](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes.html) — general flash-rate guidance underlying D-10's cap.
- [MDN: Pointer Events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events) — unified pointer/touch/mouse event model.
- [MDN: touch-action](https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action) — preventing default touch scroll/pan on a non-scrolling page.
- [Read the Tea Leaves: High-performance input handling on the web](https://nolanlawson.com/2019/08/11/high-performance-input-handling-on-the-web/) and [Browsers, input events, and frame throttling](https://nolanlawson.com/2019/08/14/browsers-input-events-and-frame-throttling/) — rAF-based throttling rationale.
- Playwright `page.emulateMedia({ reducedMotion })` — confirmed via websearch summary of Playwright docs/community usage.

### Tertiary (LOW confidence)
- None of the above web sources are used for anything load-bearing beyond standard, stable web-platform behavior; no tertiary/unverified sources were relied upon for this research.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new dependencies, every library already verified installed in this exact repo.
- Architecture: HIGH — the photo-sourcing pipeline is a direct, verified reuse of `index.astro`'s existing code; the client-side engine patterns are standard, well-documented browser APIs.
- Pitfalls: MEDIUM-HIGH — most pitfalls are grounded in direct codebase inspection (existing test gaps, existing CI gate mechanics); the WCAG flash-rate specifics and rAF-throttling rationale are MEDIUM (websearch-sourced, cross-referencing official/authoritative docs, not independently re-verified against the W3C spec text line-by-line).

**Research date:** 2026-07-29
**Valid until:** 30 days (stable web-platform APIs + a small, already-verified in-repo codebase; no fast-moving external dependency risk since this phase adds none)
