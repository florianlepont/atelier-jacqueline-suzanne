/**
 * Pure computational logic extracted from HomeCarousel.astro's client
 * <script> (quick-260720-dzs). Framework-agnostic, DOM-free, import-free —
 * mirrors the src/lib/i18n-paths.ts / src/lib/site-config.ts pure-module
 * convention so this math is directly unit-testable outside of Playwright.
 *
 * Both functions below are byte-for-byte transcriptions of the inline
 * logic that used to live in HomeCarousel.astro's syncWordmarkAlignment()
 * and touchend handler — no formula was re-derived or "improved" here.
 */

/**
 * Minimal structural rect shape — a DOMRect satisfies this structurally, so
 * callers can pass `getBoundingClientRect()` results directly without any
 * conversion.
 */
export interface Rect {
  width: number;
  height: number;
  left: number;
  top: number;
}

export interface WordmarkBackground {
  size: string;
  position: string;
}

/**
 * Computes the exact background-size/background-position the wordmark's own
 * background-image needs so it lines up pixel-for-pixel with the hero
 * image's own object-fit:cover crop — i.e. what you'd see if the wordmark
 * panel really were a hole cut in the same physical photo.
 *
 * Mirrors HomeCarousel.astro's former syncWordmarkAlignment() inline math
 * (object-fit:cover's own scale-to-fill formula), minus the DOM reads.
 */
export function computeWordmarkBackgroundPosition(
  naturalW: number,
  naturalH: number,
  heroRect: Rect,
  wordmarkRect: Rect,
  objectPositionX: number,
  objectPositionY: number,
  clampToPhoto: boolean = true,
): WordmarkBackground | null {
  if (!naturalW || !naturalH) return null;
  if (heroRect.width === 0 || heroRect.height === 0) return null;

  // Same formula object-fit:cover itself uses: scale to fill, cropping
  // whichever axis overflows.
  const scale = Math.max(heroRect.width / naturalW, heroRect.height / naturalH);
  const renderedW = naturalW * scale;
  const renderedH = naturalH * scale;

  // How much of the scaled image is cropped off each edge — tracks the
  // hero image's own object-position, not an assumed 50%/50% default.
  const cropX = (renderedW - heroRect.width) * objectPositionX;
  const cropY = (renderedH - heroRect.height) * objectPositionY;

  // Where the wordmark box sits relative to the hero photo's own top-left.
  const offsetX = wordmarkRect.left - heroRect.left;
  const offsetY = wordmarkRect.top - heroRect.top;

  const rawX = -(cropX + offsetX);
  const rawY = -(cropY + offsetY);

  // quick-260727-drq (Bug 2): .home-hero__wordmark uses background-repeat:
  // no-repeat (deliberately — repeating produced a worse garbled-tiling
  // regression), so a position that samples past the rendered image's real
  // edge renders blank/transparent, letting the solid accent panel show
  // through the glyph cutouts. A large peek push (or any other offset) can
  // make the raw position overflow the image's bounds on either axis — clamp
  // each component to the inclusive range [-(rendered - box), 0] so the
  // sampled slice always stays inside the actual photo. `Math.min(0,
  // Math.max(-min, raw))` keeps this safe even if `min` were ever negative
  // (the rendered image narrower/shorter than the wordmark box) — the
  // degenerate case resolves to 0 rather than inverting the clamp range.
  //
  // quick-260727-kq8: this clamp is redundant (and actively harmful) for any
  // caller already gated by the seam-driven clip-path (`--wm-seam` on
  // `.home-hero__wordmark-stack`) — that clip-path guarantees only the
  // in-bounds `[0, seam]` slice ever paints, so the full-box clamp below can
  // never actually protect those callers from an out-of-bounds sample. Its
  // only observable effect there was pinning the returned position at a
  // fixed boundary value once the raw position exceeded the photo's bounds,
  // freezing the visible background mid-interaction (the current-layer
  // freeze bug this opt-out fixes). `clampToPhoto` defaults to `true` so
  // every pre-existing caller/test is byte-for-byte unaffected; seam-gated
  // callers pass `false` to get continuous 1:1 tracking instead.
  if (!clampToPhoto) {
    return {
      size: `${renderedW}px ${renderedH}px`,
      position: `${rawX}px ${rawY}px`,
    };
  }

  const minValidX = renderedW - wordmarkRect.width;
  const minValidY = renderedH - wordmarkRect.height;
  const clampedX = Math.min(0, Math.max(-minValidX, rawX));
  const clampedY = Math.min(0, Math.max(-minValidY, rawY));

  return {
    size: `${renderedW}px ${renderedH}px`,
    position: `${clampedX}px ${clampedY}px`,
  };
}

export type SwipeDirection = 'next' | 'prev' | null;

/**
 * Decides whether a touchstart→touchend delta counts as a horizontal swipe,
 * and in which direction. Mirrors HomeCarousel.astro's former touchend
 * handler's inline threshold checks.
 */
export function detectSwipeDirection(
  deltaX: number,
  deltaY: number,
  minDistance: number,
  directionRatio: number,
): SwipeDirection {
  if (Math.abs(deltaX) < minDistance) return null;
  if (Math.abs(deltaX) < Math.abs(deltaY) * directionRatio) return null;
  return deltaX < 0 ? 'next' : 'prev';
}

/**
 * quick-260727-iao: pure seam-position math for the mirrored wordmark peek.
 * The wordmark's photo-cutout is a three-layer stack (current / peekPrev /
 * peekNext) that mirrors `.home-hero__photo`'s own layers. At any moment,
 * the on-screen seam between "current photo visible" and "adjacent photo
 * visible" is exactly the current photo's (heroImg's) LIVE translated edge
 * — right edge when approaching/committing toward next, left edge when
 * approaching/committing toward prev. This function converts that seam's
 * screen-space x-coordinate into a 0..1 fraction of the wordmark box's own
 * width, measured from the wordmark's LEFT edge, so the component can drive
 * a CSS clip-path split with a single custom property (--wm-seam) instead
 * of building clip-path strings in JS every frame.
 *
 * Fraction meaning per zone:
 * - right: current occupies [0, s] (its width shrinks as the photo's right
 *   edge slides left, i.e. as s shrinks); peekNext occupies [s, 1].
 * - left: peekPrev occupies [0, s]; current occupies [s, 1] (current's
 *   width shrinks as the photo's left edge slides right, i.e. as s grows).
 *
 * Pure/DOM-free like this module's other functions — deliberately, so the
 * geometry is unit-testable outside Playwright.
 */
export function computeWordmarkSeamFraction(
  zone: 'left' | 'right',
  heroLeft: number,
  heroRight: number,
  wordmarkLeft: number,
  wordmarkWidth: number,
): number {
  // A zero-width box has no visible glyphs regardless of the seam value —
  // documented degenerate no-op, matches the "current covers all" extreme.
  if (wordmarkWidth <= 0) return 1;
  const seamScreenX = zone === 'right' ? heroRight : heroLeft;
  const raw = (seamScreenX - wordmarkLeft) / wordmarkWidth;
  return Math.min(1, Math.max(0, raw));
}

export interface HoverZone {
  zone: 'center' | 'left' | 'right';
  proximity: number;
}

/**
 * quick-260726-u97 (sketch 008 Variant C): pure zone-detection math for the
 * custom hover cursor + edge-peek interaction, extracted up front (the
 * just-removed overscroll accumulator was never extracted/unit-tested — the
 * cautionary counter-example this pattern exists to avoid repeating).
 *
 * The caller passes `xFraction = x / rect.width` (already in [0,1], x being
 * the pointer's offset from the photo's left edge) and `edgeZoneFraction`
 * (0.22 — the confirmed sketch tuning, 22% per side). Faithful transcription
 * of the sketch's zone math — no clamping or "improvement" added, so live
 * behavior matches the approved design exactly.
 */
export function computeHoverZone(xFraction: number, edgeZoneFraction: number): HoverZone {
  if (xFraction < edgeZoneFraction) {
    return { zone: 'left', proximity: 1 - xFraction / edgeZoneFraction };
  }
  if (xFraction > 1 - edgeZoneFraction) {
    return { zone: 'right', proximity: (xFraction - (1 - edgeZoneFraction)) / edgeZoneFraction };
  }
  return { zone: 'center', proximity: 0 };
}
