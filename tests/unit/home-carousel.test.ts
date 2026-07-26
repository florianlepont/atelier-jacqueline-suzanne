import { describe, expect, it } from 'vitest';
import { computeHoverZone, computeWordmarkBackgroundPosition, detectSwipeDirection } from '../../src/lib/home-carousel';

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
