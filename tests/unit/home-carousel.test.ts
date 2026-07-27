import { describe, expect, it } from 'vitest';
import {
  computeHoverZone,
  computeWordmarkBackgroundPosition,
  computeWordmarkSeamFraction,
  detectSwipeDirection,
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
