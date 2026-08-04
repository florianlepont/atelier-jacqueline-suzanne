import { describe, expect, it } from 'vitest';
import {
  computeHoverZone,
  computeWordmarkBackgroundPosition,
  computeWordmarkSeamFraction,
  computeWordmarkZoomState,
  computeZoomProgress,
  detectSwipeDirection,
  pickRandomGalleryIndex,
  ZOOM_REVEAL_DISTANCE,
} from '../../src/lib/home-carousel';

// RED: src/lib/home-carousel.ts does not exist yet — this import failure is
// the intended failing state for this task's TDD RED gate; the module is
// created immediately after these tests are confirmed failing.

describe('computeWordmarkBackgroundPosition', () => {
  it('returns background size/position for a square image with no crop', () => {
    expect(
      computeWordmarkBackgroundPosition(
        1000,
        1000,
        { width: 500, height: 500, left: 0, top: 0 },
        { width: 100, height: 50, left: 100, top: 100 },
        0.5,
        0.5,
      ),
    ).toEqual({ size: '500px 500px', position: '-100px -100px' });
  });

  it('returns background size/position for a wide image with horizontal crop and wordmark offset', () => {
    expect(
      computeWordmarkBackgroundPosition(
        2000,
        1000,
        { width: 500, height: 500, left: 0, top: 0 },
        { width: 100, height: 50, left: 50, top: 50 },
        0.5,
        0.5,
      ),
    ).toEqual({ size: '1000px 500px', position: '-300px -50px' });
  });

  it('returns null when the hero rect has zero width', () => {
    expect(
      computeWordmarkBackgroundPosition(
        1000,
        1000,
        { width: 0, height: 500, left: 0, top: 0 },
        { width: 100, height: 50, left: 100, top: 100 },
        0.5,
        0.5,
      ),
    ).toBeNull();
  });

  it('returns null when the hero rect has zero height', () => {
    expect(
      computeWordmarkBackgroundPosition(
        1000,
        1000,
        { width: 500, height: 0, left: 0, top: 0 },
        { width: 100, height: 50, left: 100, top: 100 },
        0.5,
        0.5,
      ),
    ).toBeNull();
  });

  it('returns null when the natural width is zero', () => {
    expect(
      computeWordmarkBackgroundPosition(
        0,
        1000,
        { width: 500, height: 500, left: 0, top: 0 },
        { width: 100, height: 50, left: 100, top: 100 },
        0.5,
        0.5,
      ),
    ).toBeNull();
  });

  it('returns null when the natural height is zero', () => {
    expect(
      computeWordmarkBackgroundPosition(
        1000,
        0,
        { width: 500, height: 500, left: 0, top: 0 },
        { width: 100, height: 50, left: 100, top: 100 },
        0.5,
        0.5,
      ),
    ).toBeNull();
  });

  // quick-260727-drq (Bug 2): a large peek push moves the wordmark box
  // (offsetX) far enough that the raw, unclamped position samples past the
  // rendered image's actual right edge — with background-repeat: no-repeat
  // this renders blank/transparent, letting the solid accent panel show
  // through the glyph cutouts. Pre-fix this returns '-500px -100px'
  // (out of bounds); clamped, x cannot exceed -(renderedW - wordmarkRect.width)
  // = -(500 - 100) = -400.
  it('clamps the x position so it never samples past the rendered image right edge (large horizontal peek push)', () => {
    expect(
      computeWordmarkBackgroundPosition(
        1000,
        1000,
        { width: 500, height: 500, left: -400, top: 0 },
        { width: 100, height: 50, left: 100, top: 100 },
        0.5,
        0.5,
      ),
    ).toEqual({ size: '500px 500px', position: '-400px -100px' });
  });

  // Analogous vertical-overflow case: y clamps to -(renderedH - wordmarkRect.height)
  // = -(500 - 50) = -450 (mirrors the horizontal case's heroRect offset, but
  // on the top/height axis instead of left/width — x stays in-bounds here).
  it('clamps the y position so it never samples past the rendered image bottom edge (large vertical offset)', () => {
    expect(
      computeWordmarkBackgroundPosition(
        1000,
        1000,
        { width: 500, height: 500, left: 0, top: -400 },
        { width: 100, height: 50, left: 100, top: 100 },
        0.5,
        0.5,
      ),
    ).toEqual({ size: '500px 500px', position: '-100px -450px' });
  });

  // quick-260727-kq8: passing clampToPhoto=false skips the drq clamp above,
  // returning the RAW (pre-clamp) position. Same geometry as the x-clamp
  // test right above (large horizontal peek push), so the expected raw
  // value here (-500px) is exactly the pre-fix, out-of-bounds value that
  // test's own comment documents.
  it('returns the raw unclamped x position when clampToPhoto is false', () => {
    expect(
      computeWordmarkBackgroundPosition(
        1000,
        1000,
        { width: 500, height: 500, left: -400, top: 0 },
        { width: 100, height: 50, left: 100, top: 100 },
        0.5,
        0.5,
        false,
      ),
    ).toEqual({ size: '500px 500px', position: '-500px -100px' });
  });
});

describe('detectSwipeDirection', () => {
  it('detects a clear leftward horizontal swipe as next', () => {
    expect(detectSwipeDirection(-100, 10, 50, 1.5)).toBe('next');
  });

  it('detects a clear rightward horizontal swipe as prev', () => {
    expect(detectSwipeDirection(100, 10, 50, 1.5)).toBe('prev');
  });

  it('returns null when horizontal distance is below the minimum distance', () => {
    expect(detectSwipeDirection(30, 0, 50, 1.5)).toBeNull();
  });

  it('returns null when the swipe is not horizontal enough relative to vertical movement', () => {
    expect(detectSwipeDirection(60, 60, 50, 1.5)).toBeNull();
  });
});

// quick-260727-iao: pure seam-position math for the mirrored wordmark peek.
// RED: computeWordmarkSeamFraction does not exist yet — this import/usage is
// the intended failing state before Task 1's implementation lands.
describe('computeWordmarkSeamFraction', () => {
  it('right zone at rest: heroRight far past the wordmark right edge -> current covers all', () => {
    expect(computeWordmarkSeamFraction('right', 0, 1920, 1300, 600)).toBe(1);
  });

  it('right zone mid-push: seam sits partway across the wordmark box', () => {
    expect(computeWordmarkSeamFraction('right', 0, 1450, 1300, 600)).toBe(0.25);
  });

  it('right zone full commit: seam at the wordmark left edge -> current gone, peekNext covers all', () => {
    expect(computeWordmarkSeamFraction('right', 0, 1300, 1300, 600)).toBe(0);
  });

  it('right zone beyond edge: negative ratio clamps to 0', () => {
    expect(computeWordmarkSeamFraction('right', 0, 1000, 1300, 600)).toBe(0);
  });

  it('left zone at rest: heroLeft far left of the wordmark -> current covers all, peekPrev nothing', () => {
    expect(computeWordmarkSeamFraction('left', 0, 1920, 1300, 600)).toBe(0);
  });

  it('left zone mid-push: seam sits partway across the wordmark box', () => {
    expect(computeWordmarkSeamFraction('left', 1400, 1920, 1300, 600)).toBeCloseTo(0.1667, 3);
  });

  it('left zone full commit: heroLeft past the wordmark right edge -> current gone, peekPrev covers all', () => {
    expect(computeWordmarkSeamFraction('left', 1920, 3840, 1300, 600)).toBe(1);
  });

  it('degenerate guard: zero-width wordmark box returns the safe no-op value 1', () => {
    expect(computeWordmarkSeamFraction('right', 0, 1920, 1300, 0)).toBe(1);
  });
});

describe('computeHoverZone', () => {
  const EDGE_ZONE_FRACTION = 0.22;

  it('returns center with zero proximity at the exact midpoint', () => {
    expect(computeHoverZone(0.5, EDGE_ZONE_FRACTION)).toEqual({ zone: 'center', proximity: 0 });
  });

  it('returns left with proximity 0.5 at an interior left position', () => {
    const result = computeHoverZone(0.11, EDGE_ZONE_FRACTION);
    expect(result.zone).toBe('left');
    expect(result.proximity).toBeCloseTo(0.5, 5);
  });

  it('returns right with proximity 0.5 at an interior right position', () => {
    const result = computeHoverZone(0.89, EDGE_ZONE_FRACTION);
    expect(result.zone).toBe('right');
    expect(result.proximity).toBeCloseTo(0.5, 5);
  });

  it('returns center at the exact left boundary (proving < not <=)', () => {
    expect(computeHoverZone(0.22, EDGE_ZONE_FRACTION)).toEqual({ zone: 'center', proximity: 0 });
  });

  it('returns center at the exact right boundary', () => {
    expect(computeHoverZone(0.78, EDGE_ZONE_FRACTION)).toEqual({ zone: 'center', proximity: 0 });
  });

  it('returns left with proximity 1 at the extreme left edge', () => {
    const result = computeHoverZone(0, EDGE_ZONE_FRACTION);
    expect(result.zone).toBe('left');
    expect(result.proximity).toBeCloseTo(1, 5);
  });

  it('returns right with proximity 1 at the extreme right edge', () => {
    const result = computeHoverZone(1, EDGE_ZONE_FRACTION);
    expect(result.zone).toBe('right');
    expect(result.proximity).toBeCloseTo(1, 5);
  });
});

// HOME-16/D-05: pure, DOM-free random-gallery-index picker used ONLY to
// resolve the homepage's STARTING accent colour on load — it deliberately
// never influences carouselIndex (RESEARCH.md Pattern 4/Pitfall 4).
// RED: pickRandomGalleryIndex does not exist yet — this import/usage is the
// intended failing state before this task's implementation lands.
describe('pickRandomGalleryIndex', () => {
  it('returns 0 for count = 0 (guard branch, no division/NaN)', () => {
    expect(pickRandomGalleryIndex(0)).toBe(0);
  });

  it('returns 0 for a negative count (proves the guard is <= 0, not === 0)', () => {
    expect(pickRandomGalleryIndex(-3)).toBe(0);
  });

  it('returns 0 for count = 1 regardless of the random source (single-gallery site)', () => {
    expect(pickRandomGalleryIndex(1, () => 0.999)).toBe(0);
  });

  it('returns 0 at the lower bound of the random source', () => {
    expect(pickRandomGalleryIndex(5, () => 0)).toBe(0);
  });

  it('returns count - 1 (never count) at the upper bound of a half-open [0,1) source', () => {
    expect(pickRandomGalleryIndex(5, () => 0.999)).toBe(4);
  });

  it('returns the midpoint index for a mid-range random value', () => {
    expect(pickRandomGalleryIndex(5, () => 0.5)).toBe(2);
  });

  it('multiplies then floors rather than rounding', () => {
    expect(pickRandomGalleryIndex(5, () => 0.2)).toBe(1);
  });

  it('uses Math.random by default, resolved at call time rather than captured at module load', () => {
    const originalRandom = Math.random;
    try {
      Math.random = () => 0.6;
      expect(pickRandomGalleryIndex(5)).toBe(3);
    } finally {
      Math.random = originalRandom;
    }
  });
});

// Phase 21 (HOME-14/HOME-15), plan 21-01: pure zoom-progress math for the
// mobile wordmark->photo scroll-zoom transition (sketch 015 "Scale Through",
// Cinematic pace). RED: ZOOM_REVEAL_DISTANCE/computeZoomProgress do not exist
// yet — this import/usage is the intended failing state before Task 1's
// implementation lands.
describe('computeZoomProgress', () => {
  it('ZOOM_REVEAL_DISTANCE is the sketch-015 Cinematic pace winner (900px)', () => {
    expect(ZOOM_REVEAL_DISTANCE).toBe(900);
  });

  it('returns 0 when the track top is flush with the viewport top (zoom not started)', () => {
    expect(computeZoomProgress(0)).toBe(0);
  });

  it('returns 0.5 halfway through the default reveal distance', () => {
    expect(computeZoomProgress(-450)).toBe(0.5);
  });

  it('returns 1 at the full default reveal distance', () => {
    expect(computeZoomProgress(-900)).toBe(1);
  });

  it('clamps to 1 well past the reveal distance', () => {
    expect(computeZoomProgress(-5000)).toBe(1);
  });

  it('clamps to 0 while the track is still below the fold (positive top)', () => {
    expect(computeZoomProgress(120)).toBe(0);
  });

  it('honors an explicit reveal distance', () => {
    expect(computeZoomProgress(-300, 600)).toBe(0.5);
  });

  it('resolves a degenerate (zero) reveal distance to the completed end-state, not Infinity/NaN', () => {
    expect(computeZoomProgress(-300, 0)).toBe(1);
  });
});

describe('computeWordmarkZoomState', () => {
  it('t = 0 gives the start state: scale 1, wordmark fully visible, photo fully hidden', () => {
    expect(computeWordmarkZoomState(0)).toEqual({ scale: 1, wordmarkOpacity: 1, photoOpacity: 0 });
  });

  it('t = 1 gives the end state: scale 8.5, wordmark fully hidden, photo fully visible', () => {
    expect(computeWordmarkZoomState(1)).toEqual({ scale: 8.5, wordmarkOpacity: 0, photoOpacity: 1 });
  });

  it('t = 0.5 gives the ease-in-cubic midpoint scale, with neither fade started', () => {
    const result = computeWordmarkZoomState(0.5);
    expect(result.scale).toBeCloseTo(1.9375, 5);
    expect(result.wordmarkOpacity).toBe(1);
    expect(result.photoOpacity).toBe(0);
  });

  it('t = 0.9: photo crossfade has started (~0.3333), wordmark fade has not (below 0.92)', () => {
    const result = computeWordmarkZoomState(0.9);
    expect(result.photoOpacity).toBeCloseTo(0.3333, 3);
    expect(result.wordmarkOpacity).toBe(1);
  });

  it('t = 0.96: wordmark fade is at its own midpoint (~0.5)', () => {
    const result = computeWordmarkZoomState(0.96);
    expect(result.wordmarkOpacity).toBeCloseTo(0.5, 5);
  });

  it('clamps input below 0 to behave as t = 0', () => {
    expect(computeWordmarkZoomState(-2)).toEqual({ scale: 1, wordmarkOpacity: 1, photoOpacity: 0 });
  });

  it('clamps input above 1 to behave as t = 1', () => {
    expect(computeWordmarkZoomState(4)).toEqual({ scale: 8.5, wordmarkOpacity: 0, photoOpacity: 1 });
  });

  it('scale is strictly non-decreasing across an ascending sweep of t', () => {
    const sweep = [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1];
    let previous = -Infinity;
    for (const t of sweep) {
      const { scale } = computeWordmarkZoomState(t);
      expect(scale).toBeGreaterThanOrEqual(previous);
      previous = scale;
    }
  });
});

