import { describe, expect, it } from 'vitest';
import {
  DRIFT_INTERVAL_MS,
  MAX_INTERVAL_MS,
  MIN_INTERVAL_MS,
  proximityToInterval,
} from '../../src/lib/pop-rate';

// 16-01: fixture-free pure-function proof of the 404 page's pop-rate curve
// (D-08) and its load-bearing photosensitive-safety cap (D-10). Mirrors
// tests/unit/image-orientation.test.ts's "never throws on bad input" style.

describe('proximityToInterval', () => {
  it('proximity 0 (idle / farthest from center) returns MAX_INTERVAL_MS', () => {
    expect(proximityToInterval(0)).toBe(MAX_INTERVAL_MS);
  });

  it('proximity 1 (dead-center) returns MIN_INTERVAL_MS, the capped fastest cadence', () => {
    expect(proximityToInterval(1)).toBe(MIN_INTERVAL_MS);
  });

  it('proximity 0.5 returns the exact lerp midpoint (1275)', () => {
    expect(proximityToInterval(0.5)).toBe(1275);
  });

  it('clamps above-range proximity to MIN_INTERVAL_MS, never below the floor', () => {
    expect(proximityToInterval(2)).toBe(MIN_INTERVAL_MS);
    expect(proximityToInterval(999)).toBe(MIN_INTERVAL_MS);
  });

  it('clamps below-range proximity to MAX_INTERVAL_MS, treated as idle', () => {
    expect(proximityToInterval(-1)).toBe(MAX_INTERVAL_MS);
    expect(proximityToInterval(-999)).toBe(MAX_INTERVAL_MS);
  });

  it('never throws and always returns a finite in-range number for non-finite input', () => {
    for (const bad of [NaN, Infinity, -Infinity]) {
      expect(() => proximityToInterval(bad)).not.toThrow();
      const result = proximityToInterval(bad);
      expect(Number.isFinite(result)).toBe(true);
      expect(result).toBeGreaterThanOrEqual(MIN_INTERVAL_MS);
      expect(result).toBeLessThanOrEqual(MAX_INTERVAL_MS);
    }
  });

  it('floor-sweep invariant: every proximity from 0 to 1 in 0.1 steps stays >= MIN_INTERVAL_MS', () => {
    for (let p = 0; p <= 1.0001; p += 0.1) {
      const interval = proximityToInterval(p);
      expect(interval).toBeGreaterThanOrEqual(MIN_INTERVAL_MS);
    }
  });
});

describe('pop-rate constants', () => {
  it('MIN_INTERVAL_MS satisfies the D-10 photosensitive-seizure ceiling: under ~3 changes/second', () => {
    // The single most safety-critical assertion in this module: even at the
    // fastest allowed cadence (dead-center proximity), the engine can never
    // exceed the ~3 flashes/second photosensitive-safety threshold.
    expect(1000 / MIN_INTERVAL_MS).toBeLessThan(3);
  });

  it('DRIFT_INTERVAL_MS (D-11 reduced-motion drift) is well under the cap and slower than any pointer-driven cadence', () => {
    expect(1000 / DRIFT_INTERVAL_MS).toBeLessThan(3);
    expect(DRIFT_INTERVAL_MS).toBeGreaterThan(MAX_INTERVAL_MS);
  });
});
