# Homepage Motion — Wordmark → Photo Zoom (Phase 21)

## Design Decisions

**Winner: "Scale Through"** — on phone-width viewports, the full-screen "Atelier Jacqueline Suzanne" wordmark (its existing photo-cutout intact) scales up ~8.5× as the visitor scrolls, with an accelerating (cubic ease-in) curve, so the effect reads as flying straight into the letterforms until the photo fills the screen.

- **Pace: Cinematic** — the slowest/most generous of three tested scroll distances (420px "Quick", 650px "Balanced", 900px "Cinematic"). Cinematic won on a real phone — the effect needs room to breathe, a quick pace read as abrupt.
- **Zoom anchor: the "A" of "Atelier"** — the scale's `transform-origin` must be anchored on that specific glyph, not a generic center-of-block point. Confirmed via direct feedback after the first real-device pass ("a zoom focused on the A").
- **End-state safety net** — a plain full-bleed photo crossfades in from t=0.85→1.0 (opacity), so the extreme end of the scale (~8.5×) never has to render cleanly on its own; this hides any rasterization/seam artifacts at high scale.
- **Reversibility** — driven directly by scroll position (not a one-shot animation), so scrolling back up smoothly reverses the entire effect for free.
- **Rejected alternatives** (not flawed, just not chosen): "Cross Dissolve" (wordmark fades out + Ken Burns while photo fades in — the same math idiom already shipped in `DetailHero.astro`) and "Letters Open" (no scale/fade at all — only the solid backdrop around the letters dissolves to reveal the same photo). Both remain valid fallback treatments if "Scale Through" proves too demanding on lower-end devices.

## CSS Patterns

The wordmark keeps the site's existing photo-cutout mechanism (`background-clip: text` + `background-image` = the gallery's photo), scaled via `transform: scale()` on the wordmark element itself, anchored with a **measured, not guessed**, `transform-origin`:

```css
.zoom-wordmark {
  font-family: var(--font-display); /* Unbounded — see Anti-Patterns below */
  text-transform: uppercase;
  line-height: .92;
  background-image: var(--photo);
  background-size: cover;
  background-position: center;
  will-change: transform, opacity, filter;
}
.has-photo-cutout .zoom-wordmark {
  -webkit-background-clip: text; background-clip: text;
  color: transparent; -webkit-text-fill-color: transparent;
  filter: brightness(.72) contrast(1.15); /* contrast against the photo, matches HomeCarousel.astro's existing --wordmark-photo-filter convention */
}
```

Progress-driven scale + crossfade (t = 0→1 over the scroll distance):

```js
function onProgress(t) {
  const scaleT = t * t * t; // ease-in-cubic — accelerating, not linear
  wordmarkEl.style.transform = `scale(${lerp(1, 8.5, scaleT)})`;
  wordmarkEl.style.opacity = String(1 - clamp01((t - 0.92) / 0.08));
  photoOverlayEl.style.opacity = String(clamp01((t - 0.85) / 0.15)); // end-state safety net
}
```

**The transform-origin must be measured live, not hardcoded as a percentage** — font metrics, viewport width, and font-load timing all shift where a specific glyph actually renders:

```js
function syncFocusOrigin() {
  const wmRect = wordmarkEl.getBoundingClientRect();
  const focusRect = focusLetterSpanEl.getBoundingClientRect(); // <span> wrapping just the "A"
  const originX = ((focusRect.left + focusRect.width / 2 - wmRect.left) / wmRect.width) * 100;
  const originY = ((focusRect.top + focusRect.height / 2 - wmRect.top) / wmRect.height) * 100;
  wordmarkEl.style.transformOrigin = `${originX}% ${originY}%`;
}
// Run on load, after document.fonts.ready resolves, and on resize/orientationchange.
```

## HTML Structures

Scroll-scrubbed pin pattern (matches `DetailHero.astro`'s existing pinned-shrink driver, adapted for a scale/zoom instead of a width/position tween):

```html
<div class="scroll-track" style="height: calc(100dvh + var(--reveal-distance));">
  <div class="pinned-stage" style="position: sticky; top: 0; height: 100dvh;">
    <div class="zoom-photo-layer"></div> <!-- end-state crossfade target -->
    <h1 class="zoom-wordmark"><span class="focus-letter">A</span>telier<br>Jacqueline<br>Suzanne</h1>
  </div>
</div>
<section class="arrival-slide"><!-- first gallery, title + description reveal --></section>
```

Progress is derived from real page scroll via the track's own position (the DetailHero.astro pattern), not a bounded div's `scrollTop` — the bounded-div version was sketch-only scaffolding for side-by-side variant comparison on desktop:

```js
function computeProgress(trackEl) {
  return clamp01(-trackEl.getBoundingClientRect().top / revealDistance);
}
```

## What to Avoid

- **Don't ship without loading the real Unbounded font.** The theme's `--font-display` CSS custom property does NOT load the font file — it only names it. The sketch initially rendered in a system-sans fallback for an entire round before this was caught. Production already handles this correctly via `@fontsource/unbounded` — just don't assume any adjacent sketch/prototype work has it unless the font is explicitly loaded (CDN link or `@fontsource` import).
- **Don't guess a `transform-origin` percentage by eye.** Measure the actual target glyph's bounding box and compute the origin from it — it's cheap, exact, and survives viewport/font changes that would silently break a hardcoded guess.
- **Don't test a phone-only scroll interaction purely in a desktop-simulated phone-frame div.** A bounded div with mouse-wheel/trackpad scroll is good for fast side-by-side variant comparison, but real momentum scrolling, real viewport units, and real touch gestures on an actual phone are what actually validate the feel — the winning pace (Cinematic) and the focus-anchor request both only surfaced once tested on a real device.

## Origin
Synthesized from sketch: 015 (homepage-wordmark-zoom)
Source files available in: `sources/015-homepage-wordmark-zoom/` (`index.html` — desktop side-by-side comparison of all 3 variants; `mobile.html` — real-device full-screen version used for the actual decision)
