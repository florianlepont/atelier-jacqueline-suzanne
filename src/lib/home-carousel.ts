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
