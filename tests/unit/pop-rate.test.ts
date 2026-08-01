import { describe, expect, it } from 'vitest';
import {
  DRIFT_INTERVAL_MS,
  MAX_INTERVAL_MS,
  MIN_INTERVAL_MS,
  proximityToInterval,
} from '../../src/lib/pop-rate';

// 16-01: fixture-free pure-function proof of the 404 page's pop-rate curve
// (D-08) and its hard floor (D-10). Mirrors
// tests/unit/image-orientation.test.ts's "never throws on bad input" style.
//
// D-10 override (2026-07-29, see 16-CONTEXT.md): MIN_INTERVAL_MS was raised
// from 350ms (~2.86/sec, WCAG-adjacent) to 150ms (~6.7/sec) per an explicit,
// knowing user request at the plan 16-03 human-verify checkpoint -- a
// deliberate departure from WCAG 2.3.1 general-flash guidance for this one
// page. The invariant this suite still proves is that a hard floor EXISTS
// and is never violated -- not that the floor sits under any particular
// flash-rate threshold.

describe('proximityToInterval', () => {
  it('proximity 0 (idle / farthest from center) returns MAX_INTERVAL_MS', () => {
    expect(proximityToInterval(0)).toBe(MAX_INTERVAL_MS);
  });

  it('proximity 1 (dead-center) returns MIN_INTERVAL_MS, the capped fastest cadence', () => {
    expect(proximityToInterval(1)).toBe(MIN_INTERVAL_MS);
  });

  it('proximity 0.5 returns the exact lerp midpoint (1175)', () => {
    expect(proximityToInterval(0.5)).toBe(1175);
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
  it('MIN_INTERVAL_MS is the single hard floor -- proximityToInterval never returns below it, for any input (D-10 override, 2026-07-29: cap raised to ~6.7/sec, a knowing departure from WCAG 2.3.1 general-flash guidance for this one page)', () => {
    // The single most safety-critical invariant left in this module post
    // D-10-override: the floor still exists and is never violated, even
    // though it is no longer tuned to the ~3/sec WCAG-adjacent threshold.
    const probes = [0, 0.5, 1, 2, 999, -1, -999, NaN, Infinity, -Infinity];
    for (const proximity of probes) {
      expect(proximityToInterval(proximity)).toBeGreaterThanOrEqual(MIN_INTERVAL_MS);
    }
    expect(proximityToInterval(1)).toBe(MIN_INTERVAL_MS);
  });

  it('DRIFT_INTERVAL_MS (D-11 reduced-motion drift) stays slower than any pointer-driven cadence, unaffected by the D-10 cap override', () => {
    expect(DRIFT_INTERVAL_MS).toBeGreaterThan(MAX_INTERVAL_MS);
  });
});
