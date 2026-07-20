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

  return {
    size: `${renderedW}px ${renderedH}px`,
    position: `${-(cropX + offsetX)}px ${-(cropY + offsetY)}px`,
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
