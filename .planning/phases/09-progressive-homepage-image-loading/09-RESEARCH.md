# Phase 9: Progressive Homepage Image Loading - Research

**Researched:** 2026-07-14
**Domain:** Client-side image loading UX (blur-up LQIP, resource priority hints, prefetching) in a dependency-free Astro/vanilla-JS component, coexisting with an already-shipped View Transitions API integration
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Blur placeholder source**
- **D-01:** Use a Sanity CDN low-res blurred URL (via the existing `@sanity/image-url` builder already used in `src/lib/image.ts`) — e.g. `builder.image(img).width(24).blur(50).auto('format').url()`. A real, tiny (few-KB) blurred preview of the actual photo, not a solid color or build-time-encoded base64. No new build-time plumbing needed; reuses the same builder singleton already in place for `thumbnailUrl`/`fullSizeUrl`.
- Rejected: solid dominant-color placeholder (no "emerging photo" feel) and base64 LQIP inlined at build time (extra build-time fetch/encode plumbing not justified for this near-zero-maintenance site).

**Scope: which photos get the treatment**
- **D-02:** The hero photo gets the blur-to-sharp treatment on **every** swap — first page load AND every later auto-advance/prev/next/toggle transition, not just the initial paint.
- **D-03:** Grid-mode tiles (`.home-grid__tile-img`) get the same blur-up treatment as they come into view (their existing `loading="lazy"` stays; add the blurred-placeholder swap on top of it) — matches HOME-09's "each homepage photo" success-criteria wording and the user's explicit choice to keep grid and hero visually consistent.
- Rejected: hero-only-on-first-load (too narrow) and hero-blur-with-plain-grid-lazy-load (grid tiles get the treatment too, per D-03).

**Hero priority + next-photo prefetch**
- **D-04:** Add `fetchpriority="high"` (and keep/verify eager loading — no `loading="lazy"`) on the hero `<img>` for whichever photo is currently displayed.
- **D-05:** Prefetch the next gallery's hero photo in the background while the current one is showing (e.g. an in-memory `Image()` object or `<link rel="prefetch">`) so that by the time auto-advance (6s interval) or a manual prev/next/toggle fires, the sharp photo is already warm in the browser cache — the blur-up moment becomes the exception rather than something visible on every single swap. Applies to whichever gallery is next in sequence from the current index.

**Transition feel**
- **D-06:** Quick, subtle dissolve — target ~200-300ms, matching the timing convention already established for the carousel/grid toggle's view-transition morph (Phase 7 / `260713-jfz`/`260713-kit` quick-task work). Not a slow/cinematic reveal.

### Claude's Discretion
- Exact CSS mechanism for the blur-to-sharp swap (two stacked `<img>` layers with opacity crossfade, vs. a single `<img>` with a `filter: blur()` that animates to 0, vs. swapping `src` with a transition on load) — pick whichever integrates cleanest with the existing hero `<img data-role="hero-image">` and grid tile markup without conflicting with the already-shipped `view-transition-name` wiring on `.home-hero__photo`/`.home-hero__accent`.
- Exact blur radius/thumbnail width for the low-res placeholder URL (D-01) — small enough to be cheap and load near-instantly, large enough to read as a recognizable color/shape preview. Verify live.
- Exact prefetch trigger point in the auto-advance/prev/next/toggle cycle (D-05) — e.g. prefetch immediately after each swap completes, so there's a full ~6s window before the next transition.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within HOME-09's scope. Gallery-detail page images (lightbox, detail grid) were explicitly confirmed out of scope for this phase during codebase scouting (no existing loading-treatment gap raised by the user).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| HOME-09 | Homepage photos load progressively (priority + blur-to-sharp transition), with no blocking full-screen loading state | Standard Stack (no new deps), Architecture Patterns (2-layer LQIP crossfade), Common Pitfalls (view-transition hidden-window, Sanity image scale-up, prefetch dedup), Code Examples (blurUrl helper, render() hookup, grid tile hookup) |
</phase_requirements>

## Summary

This phase adds zero new dependencies. Everything needed already exists in the codebase: the `@sanity/image-url` builder (`src/lib/image.ts`) supports `.blur(1-2000)` and `.width(px)` — confirmed against Sanity's own official docs — so a tiny, genuinely-blurred CDN preview URL is a one-line addition alongside the existing `thumbnailUrl()`/`fullSizeUrl()` helpers. There is no page-level "loading state" to remove — `HomeCarousel.astro`'s page shell (header, nav, toggle) already renders synchronously with no async gate in front of it; HOME-09's "no blocking full-screen loader" criterion is satisfied simply by never introducing one, not by removing existing blocking code.

The recommended mechanism (Claude's Discretion) is a classic **two-layer LQIP crossfade**: a small blurred `<img>` (or CSS `background-image`) sits behind the full-resolution `<img>`, which starts at `opacity: 0` and fades to `1` on its `load` event (handling the already-cached case via `img.complete`). This is preferred over a single-`<img>` `filter: blur()` animation because swapping `src` on one element with an active blur animation causes a visible "pop" the moment the new source paints (CONTEXT.md explicitly wants to avoid abrupt pop-in) — the two-layer approach never shows an unblurred wrong-resolution frame.

The one real integration risk is the already-shipped View Transitions API wiring (Phase 7 / quick-task `260713-jfz`/`260713-kit`): `document.startViewTransition()` hides the live DOM and cross-fades static before/after snapshots in an overlay for its ~420ms duration. Any CSS opacity/filter transition running on the real DOM elements during that specific window (the carousel↔grid **toggle** click only — not auto-advance/prev/next, which never call `startViewTransition`) will not be visible until the overlay tears down. This is a narrow, cosmetically-minor edge case (not a hard conflict — nothing breaks, the crossfade is just briefly upstaged during toggle clicks), addressed in Common Pitfalls below. The documented `backdrop-filter` stacking-context conflict does **not** apply here, since this phase uses a placeholder `<img>`/background layer, not `backdrop-filter`.

**Primary recommendation:** Add a `blurPlaceholderUrl()` helper to `src/lib/image.ts` (`.width(24).blur(50).auto('format').url()`, per D-01), thread a new `blurSrc` field through `index.astro`/`en/index.astro` → `HomeCarousel` props → the `home-carousel-data` island, and implement a two-stacked-`<img>` opacity crossfade for both the hero (`render()`-driven, every swap) and the grid tiles (server-rendered, `load`-event-driven). Add `fetchpriority="high"` to the hero `<img>` unconditionally. Prefetch the next gallery's `heroSrc` via a bare `new Image()` at the end of `render()`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Blurred placeholder URL generation | Build time (Astro frontmatter, `src/lib/image.ts`) | — | Sanity CDN URL construction is a pure build-time string operation, identical pattern to existing `thumbnailUrl()`/`fullSizeUrl()`; no runtime cost |
| Hero photo priority hint (`fetchpriority`) | Browser / Client (server-rendered attribute) | — | A static HTML attribute Astro emits at build time; the browser's own network stack acts on it, no JS needed for the initial paint |
| Hero blur-to-sharp crossfade (every swap) | Browser / Client (existing vanilla-JS `render()`) | — | Already the sole owner of hero DOM mutation on every prev/next/auto-advance/toggle tick; this phase extends `render()`, doesn't introduce a new owner |
| Grid tile blur-to-sharp crossfade | Browser / Client (new lightweight `load`-listener script) + Astro server-render (markup/inline style) | — | Grid tiles are server-rendered once (not re-rendered by `render()`); only the crossfade's `load`→opacity trigger needs any JS, everything else is static markup + CSS, per CONTEXT.md's `code_context` note |
| Next-photo prefetch | Browser / Client (existing `render()`) | — | Must know "what's currently showing" to compute "what's next," which only `render()`'s in-memory `carouselIndex`/`galleries` state has |
| View-transition-safe stacking | Browser / Client (existing global `<style is:global>` block) | — | Any new stacking/animation rules this phase needs must live alongside the existing `::view-transition-group(...)` rules, not duplicate a separate mechanism |

## Standard Stack

### Core

No new dependencies. This phase is implemented entirely with the existing stack: `@sanity/image-url` 2.1.1 (already installed, `src/lib/image.ts`) for the placeholder URL, and native browser CSS/JS (`opacity` transitions, `Image()`, `fetchpriority`, `loading`) for the crossfade/priority/prefetch behavior — consistent with the codebase's established "no framework, no `client:*`, no icon/animation library" convention (see `04.1-RESEARCH.md` Pattern 4, `07-PATTERNS.md`).

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|---------------|
| `@sanity/image-url` | 2.1.1 (already installed) | Generate the tiny blurred placeholder URL via `.width(24).blur(50).auto('format').url()` | Same builder singleton already used for `thumbnailUrl()`/`fullSizeUrl()`; `blur()` and `width()` are documented core methods — no new package. |

### Supporting

None — no new packages of any kind. Native `fetchpriority` HTML attribute, native `Image()` constructor, and plain CSS `transition: opacity` cover every requirement.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Sanity CDN blurred URL (D-01, locked) | Build-time base64 LQIP (e.g. `plaiceholder`, `blurhash`) | Rejected by CONTEXT.md — adds a new npm dependency and a build-time fetch/encode step for every gallery cover photo, contradicting the project's near-zero-maintenance/no-new-tooling posture. Only reconsider if Sanity CDN latency for the tiny blurred request ever becomes a measured problem (unlikely at 24px width). |
| Two-layer `<img>` opacity crossfade | Single `<img>` with `filter: blur()` animating to 0 on the same element whose `src` is swapped | Rejected: swapping `src` on an element with an in-flight blur animation shows the WRONG (previous) blurred frame overlaid with a soft-focus render of a differently-sized image the instant the browser starts decoding the new source, then jump-cuts once decoded — reads as a pop, not a dissolve. The two-layer approach has no such transition state. |
| `new Image()` prefetch (D-05, primary) | `<link rel="prefetch" as="image">` | Both work; `new Image()` is simpler to trigger from inside existing `render()` JS (no extra `<head>`/`<link>` DOM management) and gives an equivalent single cached network request. `<link rel=prefetch>` is lower-priority by design (meant for next-navigation resources) and would need to be dynamically inserted/removed from `<head>` on every tick — more code for no benefit here. |

**Installation:** None required — no `npm install` for this phase.

**Version verification:** `@sanity/image-url@2.1.1` confirmed already present in `package.json` and `node_modules` (`npm view @sanity/image-url version` also returns `2.1.1` as current on the registry, matching what's installed — no upgrade needed).

## Package Legitimacy Audit

Not applicable — this phase installs zero new packages. No audit table needed.

## Architecture Patterns

### System Architecture Diagram

```
BUILD TIME (Astro frontmatter, src/pages/index.astro + en/index.astro)
  getGalleries() [Sanity fetch]
        │
        ▼
  cover = gallery.images[0]
        │
        ├──> fullSizeUrl(cover)            → heroSrc   (existing)
        ├──> thumbnailUrl(cover, 600)      → gridSrc   (existing)
        └──> blurPlaceholderUrl(cover)     → blurSrc   (NEW, src/lib/image.ts)
        │
        ▼
  <HomeCarousel galleries={[...{heroSrc, gridSrc, blurSrc, ...}]} />
        │
        ├──> server-rendered hero <img data-role="hero-image" fetchpriority="high">
        │        + server-rendered placeholder <img data-role="hero-image-placeholder">
        │
        ├──> server-rendered grid tiles <img class="home-grid__tile-img" loading="lazy">
        │        + server-rendered placeholder layer per tile
        │
        └──> hidden <ul data-role="home-carousel-data"> data island
                 (data-hero-src, data-blur-src, ... — NEW data-blur-src attr)

BROWSER / CLIENT (HomeCarousel.astro <script>, unhydrated vanilla JS)
  read data island → galleries[] (in memory)
        │
        ▼
  render(carouselIndex)  ──────────────┐
    │                                   │  (existing: title/index/statement/
    │  NEW:                             │   accent/wordmark sync)
    │  1. placeholderImg.src = gallery.blurSrc   (shows instantly, tiny)
    │  2. heroImg.src = gallery.heroSrc          (opacity:0 → fades in on 'load')
    │  3. prefetch: new Image().src = galleries[next].heroSrc
    │
    ▼
  user interaction (auto-advance timer / prev / next / progress-dash / swipe / toggle)
    │
    └──> re-enters render() ─── loop back above (D-02: every swap, not just first paint)

  GRID TILES (separate, lightweight listener — tiles are NOT re-rendered by render())
    querySelectorAll('.home-grid__tile-img').forEach(img => {
      if (img.complete) markLoaded(img); else img.addEventListener('load', markLoaded, {once:true})
    })
        │
        ▼
  markLoaded(img) → img closest tile gets 'is-loaded' class → CSS opacity crossfade
```

### Recommended Project Structure

No new files. Two existing files are edited:

```
src/
├── lib/
│   └── image.ts              # + blurPlaceholderUrl() helper, alongside thumbnailUrl/fullSizeUrl
├── components/
│   └── HomeCarousel.astro    # + placeholder <img> markup (hero + grid tiles),
│                              #   + fetchpriority="high" on hero <img>,
│                              #   + render() extended: placeholder swap, opacity-fade-in, prefetch,
│                              #   + grid tile load-listener script,
│                              #   + new CSS: .home-hero__img-placeholder, .is-loaded opacity rules,
│                              #   + GalleryEntry interface: + blurSrc field
├── pages/
│   ├── index.astro           # + blurSrc: blurPlaceholderUrl(cover) in the galleries.map()
│   └── en/index.astro        # (mirrors index.astro — same one-line addition)
```

### Pattern 1: Blurred placeholder URL helper (build time)

**What:** A third builder function alongside `thumbnailUrl()`/`fullSizeUrl()` in `src/lib/image.ts`, generating a tiny (24px-wide), heavily-blurred CDN preview.
**When to use:** Called once per gallery cover image in `index.astro`/`en/index.astro`'s existing `galleries.map()`, exactly where `heroSrc`/`gridSrc` are already computed.
**Example:**
```typescript
// Source: sanity.io/docs/apis-and-sdks/image-urls (blur: 1-2000, width: px) +
// existing src/lib/image.ts pattern (thumbnailUrl/fullSizeUrl)
export function blurPlaceholderUrl(img: SanityImage, width = 24): string {
  return builder.image(img).width(width).blur(50).auto('format').url()
}
```
D-01 already locks the exact `.width(24).blur(50)` values; this is a direct, low-risk implementation of the decision, not an open design choice.

### Pattern 2: Two-layer opacity crossfade (hero, every swap — D-02/D-06)

**What:** A blurred placeholder `<img>` stacked absolutely beneath the sharp hero `<img>` inside `.home-hero__photo` (which already establishes `position: relative` and hosts other absolutely-positioned children — `.home-hero__scrim`, `.home-hero__caption`). The sharp image starts at `opacity: 0`, both `src`s are set together in `render()`, and a `load` listener on the sharp image adds a class that transitions `opacity` to `1`.
**When to use:** Every call to `render()` — first paint and every subsequent auto-advance/prev/next/toggle tick (D-02).
**Example:**
```astro
<!-- markup addition inside .home-hero__photo, sibling to the existing hero <img> -->
<img data-role="hero-image-placeholder" src={firstGallery.blurSrc} alt="" aria-hidden="true" class="home-hero__img home-hero__img-placeholder" />
<img data-role="hero-image" src={firstGallery.heroSrc} alt={firstGallery.alt} fetchpriority="high" class="home-hero__img home-hero__img--sharp" />
```
```css
/* .home-hero__img already: position:absolute; inset:0; width/height:100%; object-fit:cover; */
.home-hero__img--sharp {
  opacity: 0;
  transition: opacity 260ms ease; /* D-06: ~200-300ms, matches the toggle morph's 280ms column-gap transition */
}
.home-hero__img--sharp.is-loaded {
  opacity: 1;
}
```
```typescript
// render() addition (HomeCarousel.astro <script>)
function showSharp(img: HTMLImageElement) {
  img.classList.add('is-loaded');
}
if (heroImg && heroPlaceholderImg) {
  heroPlaceholderImg.src = gallery.blurSrc;
  heroImg.classList.remove('is-loaded');
  heroImg.src = gallery.heroSrc;
  heroImg.alt = gallery.alt;
  if (heroImg.complete) {
    showSharp(heroImg); // already cached (prefetched, D-05) — fade is effectively instant
  } else {
    heroImg.addEventListener('load', () => showSharp(heroImg), { once: true });
  }
}
```
Note: `heroImg.classList.remove('is-loaded')` before reassigning `src` is required — without it, a previously-loaded image's `is-loaded` class would stay applied while the new `src` decodes, defeating the fade (the browser doesn't reset computed style classes when `src` changes).

### Pattern 3: Grid tile crossfade (server-rendered, lazy — D-03)

**What:** The same placeholder-under-sharp structure, but for server-rendered, non-JS-managed tiles. Since `render()` never touches grid tiles, a small standalone listener (added once, alongside the existing `<script>` block's other `querySelectorAll` calls) drives the fade.
**When to use:** Each `.home-grid__tile-img` as it lazy-loads into view.
**Example:**
```astro
<a href={...} class="home-grid__tile">
  <img src={gallery.blurSrc} alt="" aria-hidden="true" class="home-grid__tile-img home-grid__tile-img-placeholder" />
  <img
    src={gallery.gridSrc}
    width="600" height="600"
    alt={gallery.alt}
    loading="lazy"
    decoding="async"
    class="home-grid__tile-img home-grid__tile-img--sharp"
  />
  ...
</a>
```
```typescript
// one-time setup near the other querySelectorAll calls in the <script> block
const tileImgs = Array.from(document.querySelectorAll<HTMLImageElement>('.home-grid__tile-img--sharp'));
tileImgs.forEach((img) => {
  const markLoaded = () => img.classList.add('is-loaded');
  if (img.complete) markLoaded();
  else img.addEventListener('load', markLoaded, { once: true });
});
```
`.home-grid__tile-img` (the shared base class) already sets `width/height:100%; object-fit:cover; display:block` — stacking the placeholder requires adding `position: absolute; inset: 0;` to both variants (currently the single `.home-grid__tile-img` is in normal flow since `.home-grid__tile` has no other absolutely-positioned image sibling to conflict with; `.home-grid__tile-scrim`/`-copy` already use `position: absolute` against `.home-grid__tile`'s own `position: relative`, so this is additive, not a new pattern).

### Anti-Patterns to Avoid
- **Single `<img>` with an animated `filter: blur()` on `src` swap:** Causes a visible pop the instant the new (differently-sized/differently-blurred) source paints mid-animation — the opposite of D-06's "no abrupt pop-in." Use the two-layer opacity crossfade instead (see Alternatives Considered).
- **Giving the placeholder `<img>` its own `view-transition-name`:** Would create a second named group inside `.home-hero__photo` (which already owns `ajs-hero-morph` during toggles), fighting the existing shared-element morph. The placeholder must remain unnamed and simply travel along as part of `.home-hero__photo`'s existing snapshotted content.
- **Prefetching every gallery on page load instead of just "next":** D-05 explicitly scopes prefetch to "next in sequence from the current index" — prefetching the whole gallery list up front would compete with the current hero photo's own `fetchpriority="high"` request for bandwidth on first load, undermining the very LCP priority this phase is trying to establish.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| Blurred preview image generation | A custom canvas-based client-side blur, or a build-time image-processing step (sharp/canvas) | The Sanity CDN's own `.blur()` query param (`@sanity/image-url`) | Sanity's CDN already does this server-side, cached, for free within the existing plan — no build-time compute, no new dependency, and it's the exact mechanism CONTEXT.md's D-01 locks in. |
| Detecting "is this image already loaded / cached" | A manual `fetch()` + cache-check before deciding whether to animate | The native `HTMLImageElement.complete` property (already used in this exact pattern for `syncWordmarkAlignment()`, `HomeCarousel.astro` `render()`) | The codebase already has this exact defensive pattern (`if (heroImg.complete) { ... } else { heroImg.addEventListener('load', ..., { once: true }) }`) — reuse it verbatim for the new placeholder-fade logic instead of reinventing a loaded-check. |
| "Preload the next image" | A custom fetch-and-cache-in-IndexedDB layer, or a Service Worker | `new Image()` + setting `.src` (D-05) | The browser's native HTTP cache already handles this for content-hashed, long-cache CDN URLs (Sanity sets `Cache-Control: public, max-age=31536000`) — a same-URL `src` assignment later is served from cache automatically, no custom cache layer needed. |

**Key insight:** Every capability this phase needs (blur generation, load detection, prefetch caching) is already provided by either the Sanity CDN or native browser APIs already in use elsewhere in this same component — the phase is pure composition of existing primitives, not new infrastructure.

## Common Pitfalls

### Pitfall 1: Blur-up crossfade visually "loses" to the View Transition overlay during toggle clicks
**What goes wrong:** During the carousel↔grid toggle (the only interaction that calls `document.startViewTransition()`), the browser hides the live DOM and cross-fades static before/after snapshots in a pseudo-element overlay for ~420ms. If a hero or grid-tile image is mid-crossfade (placeholder→sharp) exactly when the toggle fires, that live opacity transition is invisible until the overlay tears down — the element will just "jump" to its final opacity state once real DOM stacking resumes.
**Why it happens:** Named elements captured by `startViewTransition()` are snapshotted at two points in time (before/after the DOM mutation callback); anything animating on the *live* element in between is not part of either snapshot.
**How to avoid:** This is a narrow, low-severity edge case (only affects the specific millisecond window where a toggle click coincides with an in-flight image fade) and does not require gating the transition — do not add `pointer:fine`/viewport gating or disable the crossfade during transitions (that would over-fix a cosmetic edge case per the D-10/D-12 precedent in `07-CONTEXT.md`, where a similar over-fix was explicitly rejected). Simply ensure the placeholder `<img>` and any new crossfade wrapper element are never given their own `view-transition-name` (see Anti-Patterns) so they ride along with `.home-hero__photo`'s existing snapshot cleanly, and accept that a toggle-click mid-fade is a rare, harmless visual coincidence.
**Warning signs:** If manual testing shows the hero photo "snapping" to full opacity right as a toggle-triggered morph finishes (rather than fading in gradually), that's this interaction — confirm it only reproduces when clicking toggle within ~300ms of a fresh `render()` call, not on every toggle.

### Pitfall 2: Sanity scales SMALL source images UP to match `.width()`, producing a blurrier-than-intended placeholder
**What goes wrong:** The Sanity Image API scales images up to match a requested `width`/`height` unless `.fit('max')` is specified. For the 24px-wide blur placeholder this is irrelevant (any real photo is far larger than 24px), but it's a documented gotcha worth knowing if the placeholder width is later tuned upward during live verification (Claude's Discretion item).
**Why it happens:** Default `fit` mode (`'clip'`/`crop'` depending on other params) scales to exactly match requested dimensions, including scaling up.
**How to avoid:** Keep placeholder width well under any realistic source photo's smallest dimension (24px is safe for any camera-original upload); no `.fit()` override is needed at this size.
**Warning signs:** N/A at 24px — only relevant if a future tuning pass raises the placeholder width closer to source resolution.

### Pitfall 3: `heroImg.src` swap without clearing the previous fade state
**What goes wrong:** If the `is-loaded` class isn't removed before assigning the new `src` in `render()`, the sharp `<img>` keeps its previous `opacity: 1` state visually while the new (different) image decodes underneath at full opacity — meaning the placeholder layer is invisible and the visitor briefly sees a stale frame of the *previous* photo rendered at the *new* image's aspect ratio/crop until decode completes, not a blur-up at all.
**Why it happens:** CSS classes persist across `src` reassignment; only network/decode state resets, not DOM class state.
**How to avoid:** Always `heroImg.classList.remove('is-loaded')` immediately before setting the new `src` (Pattern 2's example shows this ordering) — this is analogous to the existing `heroImg.addEventListener('load', syncWordmarkAlignment, { once: true })` pattern already in `render()`, just extended with the extra class-reset step.
**Warning signs:** Blur-up "not visible" on swaps after the first one, but working correctly on first page load — the class-reset step is the most likely missing piece.

### Pitfall 4: `--wordmark-photo` custom property sync timing
**What goes wrong:** `render()` already sets `root.style.setProperty('--wordmark-photo', 'url(' + gallery.heroSrc + ')')` synchronously, independent of whether `heroImg` has finished loading. This is existing, correct behavior (the wordmark cutout uses its own CSS `background-image`, not the `<img>` element) — but a naive refactor that ties the wordmark update to the new `load` listener would introduce a *regression*, delaying the wordmark cutout's photo update until the sharp image finishes loading instead of updating immediately.
**Why it happens:** It's tempting to consolidate "things that happen when the photo is ready" into one `load` handler, but `--wordmark-photo` and the blur-up fade have different readiness requirements (CSS background-image doesn't need decode-complete to look correct; the fade explicitly does).
**How to avoid:** Keep `root.style.setProperty('--wordmark-photo', ...)` exactly where it already is in `render()` (synchronous, unconditional) — do not move it inside the new `load`/`is-loaded` logic.
**Warning signs:** Wordmark cutout photo lagging one gallery behind the caption/title text after this phase's changes.

## Code Examples

### Placeholder URL helper (extends existing pattern)
```typescript
// Source: src/lib/image.ts existing thumbnailUrl/fullSizeUrl pattern + D-01
export function blurPlaceholderUrl(img: SanityImage, width = 24): string {
  return builder.image(img).width(width).blur(50).auto('format').url()
}
```

### Prefetch next hero photo (extends render())
```typescript
// Appended at the end of render(), after all existing DOM/CSS-var updates —
// D-05: "next in sequence from the current index," triggered after each swap
// completes so there's a full ~6s window before the next auto-advance tick.
const nextIndex = (carouselIndex + 1) % galleries.length;
const nextSrc = galleries[nextIndex]?.heroSrc;
if (nextSrc) {
  const preload = new Image();
  preload.src = nextSrc; // browser HTTP cache dedups; Sanity CDN URLs are
                          // content-hashed with long max-age, so a later
                          // heroImg.src = nextSrc (once it becomes current)
                          // resolves from cache with no re-fetch.
}
```

### Data island threading (existing pattern, +1 field)
```astro
<!-- HomeCarousel.astro data island, existing pattern extended -->
<li
  data-title={gallery.title}
  data-hero-src={gallery.heroSrc}
  data-blur-src={gallery.blurSrc}
  data-alt={gallery.alt}
  ...
/>
```
```typescript
// client-side parse, existing pattern extended
const galleries: GalleryEntry[] = Array.from(dataEl.querySelectorAll('li')).map((li) => ({
  ...
  blurSrc: li.dataset.blurSrc ?? '',
}));
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|-------------------|---------------|--------|
| `loading="lazy"` alone for below-the-fold images (already in place for grid tiles) | `loading="lazy"` + `fetchpriority` differentiation between hero (high) and grid tiles (default/low, implicit) | Baseline Interop 2023-2024, universal by 2026 | This phase is additive to the existing `loading="lazy"` grid behavior (D-03 keeps it), not a replacement — only the hero gets an explicit priority bump (D-04). |
| `<link rel="preload">` for LCP images | `fetchpriority="high"` directly on the `<img>` tag (no separate `<link>` needed) when the image is already in the initial HTML, as this hero `<img>` is | `fetchpriority` full cross-browser support since ~2024 (Safari 17.4 was the last holdout) | Simpler than the older two-step "preload link + eager img" pattern — a single attribute on the existing server-rendered `<img>` suffices since Astro already emits it in the initial HTML (no client-side-injected image to preload). |

**Deprecated/outdated:**
- Base64-inlined build-time LQIP (the "blurhash"/"plaiceholder" era default ~2020-2022): superseded here by CDN-generated blur, per D-01 — avoids an extra build dependency and per-image build-time processing entirely.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|----------------|
| A1 | The two-layer opacity-crossfade pattern (vs. single-`<img>` filter-blur) is the "cleanest" mechanism per Claude's Discretion — this is a design judgment, not a verified fact, though it's corroborated by multiple independent web-performance sources (LiveAPI, Mux, CSS-Tricks) converging on the same stacked-layer technique | Architecture Patterns, Pattern 2/3 | Low — even if a reviewer prefers the single-`<img>` filter approach, the underlying data (blurSrc field, fetchpriority, prefetch) is unaffected; only the CSS/markup mechanism would need revision, not the data flow. |
| A2 | During an active `document.startViewTransition()`, live CSS opacity/filter transitions on the real (non-snapshotted-yet) DOM are not visually rendered until the overlay tears down | Common Pitfalls #1 | Low-Medium — based on general View Transitions API mental model (snapshot-based cross-fade), not confirmed via a live reproduction in this codebase. If wrong, Pitfall 1's described edge case may not actually occur, or may manifest differently (e.g. a visible double-flash) — worth a quick manual check during implementation/verification (toggle mid-fade) rather than treating as settled. |

## Open Questions

*(RESOLVED — see 09-02 checkpoint: both questions below are closed by 09-02-PLAN.md Task 1's blocking human-verify checkpoint, which explicitly checks placeholder legibility against real gallery covers and the toggle-mid-fade View-Transition coincidence.)*

1. **Exact placeholder width tuning (24px vs. larger)**
   - What we know: D-01 specifies `.width(24).blur(50)` as the starting point; blur(1-2000) and width(px) are both confirmed-valid parameters.
   - What's unclear: Whether 24px produces a placeholder that reads as "a recognizable color/shape preview, not a solid blob" for this specific set of photos (Silos, Brume, etc. — high-contrast documentary/architectural work) — CONTEXT.md flags this as "verify live."
   - Recommendation: Implement at the locked D-01 values first; the planner should include a live-verification checkpoint (view the actual placeholder against 2-3 real gallery covers) before considering this closed, per CONTEXT.md's own "Verify live" note.

2. **Whether the View Transition overlay actually visibly affects the crossfade in practice (Pitfall 1 / A2)**
   - What we know: The theoretical mechanism (snapshot-based overlay hiding live DOM) is well-documented for the View Transitions API generally.
   - What's unclear: Whether this codebase's specific ~420ms toggle transition + ~260ms image fade timing ever actually produces a visible artifact, given the fade only affects `.home-hero__photo`'s *children* (the img layers), not the named `.home-hero__photo` element itself, and the toggle only fires on a discrete user click (not continuously, unlike auto-advance).
   - Recommendation: Treat as informational context for the planner/implementer, not a blocking issue — verify visually during implementation by clicking toggle immediately after a fresh gallery swap; if no artifact is observed, no further action needed (per the 07-CONTEXT.md precedent of not over-fixing unconfirmed hypotheses).

## Environment Availability

Skipped — this phase has no external tool/service dependencies beyond what's already running (Sanity CDN, already verified operational by every prior phase; no new CLI, database, or service is introduced).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright (`@playwright/test`) |
| Config file | `playwright.config.ts` (existing, project root) |
| Quick run command | `npx playwright test tests/e2e/homepage.spec.ts --project=chromium` |
| Full suite command | `npx playwright test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|---------------------|-------------|
| HOME-09 (shell renders immediately) | Header/nav/toggle are present and visible in the DOM without waiting on any image `load` event | e2e | `npx playwright test tests/e2e/homepage.spec.ts -g "shell renders"` | ❌ Wave 0 — new test case needed |
| HOME-09 (hero priority) | Hero `<img>` has `fetchpriority="high"` and no `loading="lazy"` attribute | e2e | `npx playwright test tests/e2e/homepage.spec.ts -g "hero.*priority"` | ❌ Wave 0 |
| HOME-09 (blur-to-sharp, hero, every swap) | On initial render AND after triggering auto-advance/prev/next/toggle, a placeholder `<img>`/layer with a Sanity-blurred `src` exists and the sharp `<img>` transitions to `is-loaded`/`opacity:1` | e2e | `npx playwright test tests/e2e/homepage.spec.ts -g "blur-up"` | ❌ Wave 0 |
| HOME-09 (blur-to-sharp, grid tiles) | Grid tile images carry a placeholder layer and gain `is-loaded` on load | e2e | `npx playwright test tests/e2e/homepage.spec.ts -g "grid.*blur"` | ❌ Wave 0 |
| HOME-09 (grid tiles stay lazy) | `.home-grid__tile-img--sharp` retains `loading="lazy"` (regression guard — this phase must not remove it) | e2e | `npx playwright test tests/e2e/homepage.spec.ts -g "grid.*lazy"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx playwright test tests/e2e/homepage.spec.ts --project=chromium`
- **Per wave merge:** `npx playwright test` (full suite, all browsers — the existing `homepage.spec.ts` already exercises multiple viewports/browsers via `test.use()` blocks, e.g. the HOME-06 iPhone 14 Pro block)
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] New `test.describe('progressive image loading (HOME-09)')` block in `tests/e2e/homepage.spec.ts` covering: shell-renders-without-waiting, hero `fetchpriority`, hero blur-placeholder-present-then-sharp-loaded (both on first paint and after a triggered swap), grid tile blur-placeholder + `loading="lazy"` retained.
- [ ] No new fixtures/framework install needed — `tests/e2e/homepage.spec.ts` already has the exact mocked-clock auto-advance pattern (`test.describe('auto-advance + pause (D-09)')`) this phase's "blur-up on every swap" tests should reuse to trigger a swap deterministically.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|----------------|---------|--------------------|
| V2 Authentication | No | No auth surface touched by this phase |
| V3 Session Management | No | N/A |
| V4 Access Control | No | N/A |
| V5 Input Validation | No | No new user input; `blurSrc`/`heroSrc` are build-time-derived from already-trusted Sanity content (same trust boundary as existing `heroSrc`/`gridSrc`) |
| V6 Cryptography | No | N/A |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|------------------------|
| Client `<script>` importing `src/lib/sanity.ts` / leaking `SANITY_API_READ_TOKEN` | Information Disclosure | Existing project constraint (T-04.1-04-ID, `04.1-04-PLAN.md`), verified by grep in that phase's Task 1 — this phase must preserve it: the new `blurPlaceholderUrl()` helper lives in `src/lib/image.ts` and is called ONLY from Astro frontmatter (`index.astro`/`en/index.astro`), never from `HomeCarousel.astro`'s client `<script>`. The client script only ever reads the pre-computed `data-blur-src` attribute off the static data island, exactly like the existing `data-hero-src`. No new import boundary is introduced or crossed. |
| Prefetching attacker-influenced URLs via `new Image()` | Tampering / SSRF-adjacent | `galleries[nextIndex].heroSrc` is a build-time-computed Sanity CDN URL from the same already-filtered, already-trusted `getGalleries()` result the rest of the component uses (published-only Sanity perspective, per `Phase 02` decision) — not user input, not attacker-controllable. No new validation is needed beyond what already protects `heroSrc` itself. |

## Sources

### Primary (HIGH confidence)
- https://www.sanity.io/docs/apis-and-sdks/image-urls — official Sanity docs, fetched live: confirmed `blur` param range 1-2000, `width`/`quality` (0-100) behavior, `fit=max` scale-up caveat.
- https://raw.githubusercontent.com/sanity-io/image-url/master/README.md — official `@sanity/image-url` package README (sanity-io org), fetched live: confirmed builder method chaining (`width()`, `height()`, `blur()`, `quality()`, `auto('format')`, terminal `.url()`).
- Direct codebase reads: `src/components/HomeCarousel.astro` (full file), `src/lib/image.ts`, `src/pages/index.astro`, `src/pages/en/index.astro`, `.planning/phases/09-progressive-homepage-image-loading/09-CONTEXT.md`, `.planning/phases/07-homepage-quick-fixes-mobile-hero-correctness/07-PATTERNS.md`, `tests/e2e/homepage.spec.ts`.

### Secondary (MEDIUM confidence)
- https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API and https://css-tricks.com/almanac/rules/v/view-transition/ (via WebSearch aggregation) — View Transitions snapshot/overlay mechanism and the documented `backdrop-filter`-specific stacking-context conflict (does not apply to this phase's plain-`filter`-free opacity approach).
- https://addyosmani.com/blog/fetch-priority/ and https://web.dev/articles/fetch-priority (via WebSearch aggregation) — `fetchpriority` vs `loading="eager"` distinction, browser support timeline.
- https://macarthur.me/posts/preloading-images/ (via WebSearch aggregation) — `new Image()` vs `<link rel="prefetch">` tradeoffs.
- Sanity CDN cache-header behavior (`Cache-Control: public, max-age=31536000`, content-hashed asset URLs) — via WebSearch aggregation of sanity.io/docs/apis-and-sdks/asset-cdn and related sanity.io/answers threads.

### Tertiary (LOW confidence)
- General blur-up/LQIP technique description (LiveAPI, Mux, CSS-Tricks blog posts, via WebSearch) — corroborates the two-layer crossfade as the standard pattern, but these are third-party blog explainers, not spec/official-doc sources; treated as design-pattern precedent (A1 in Assumptions Log), not a hard technical fact.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; existing `@sanity/image-url` API confirmed against official docs.
- Architecture: HIGH — pattern composes only existing codebase idioms (absolute-positioned layered children, `img.complete`/`load` defensive pattern, data-island threading) already proven in this exact file.
- Pitfalls: MEDIUM — the Sanity-specific pitfalls (scale-up, cache headers) are doc-verified; the View Transitions interaction pitfall (Pitfall 1 / A2) is a reasoned inference from the API's documented snapshot model, not confirmed via live reproduction in this codebase.

**Research date:** 2026-07-14
**Valid until:** 2026-08-13 (30 days — stable web-platform APIs and an already-pinned dependency version; revisit sooner only if `@sanity/image-url` is upgraded past 2.x)
