/**
 * 16-01: pure, framework-free proximity → interval math for the 404 page's
 * pop-rate speed curve (D-08) and its hard floor (D-10). No
 * `window`/`document`/`matchMedia` reference — this module is trivially
 * unit-testable in Node (tests/unit/pop-rate.test.ts) and is imported
 * verbatim into the client `<script>` (plan 16-03) so mouse pointer and
 * touch share the exact same curve (D-09).
 *
 * Contract:
 * - `proximity` domain is conceptually `[0, 1]` (0 = idle/farthest from
 *   center, 1 = dead-center). Any non-finite input (`NaN`, `Infinity`,
 *   `-Infinity`) is treated as `0` (idle) — never throws.
 * - Finite input is clamped into `[0, 1]` before interpolating, so
 *   out-of-range proximity (e.g. `2`, `-999`) never breaks the curve.
 * - `proximityToInterval` always returns a value in
 *   `[MIN_INTERVAL_MS, MAX_INTERVAL_MS]`. The floor
 *   (`Math.max(interval, MIN_INTERVAL_MS)`) is the single, independent
 *   enforcement point for the D-10 cap — every other layer (the client
 *   engine in plan 16-03) trusts this function and never re-derives the
 *   cap inline.
 *
 * D-10 override (2026-07-29, at the Plan 16-03 human-verify checkpoint,
 * see 16-CONTEXT.md): after seeing the original ≈2.86/sec-capped effect
 * live, the user explicitly asked for it to go faster and knowingly
 * accepted the flash-rate tradeoff ("tant pis pour les flash effect"),
 * choosing to raise the cap significantly rather than remove it entirely.
 * `MIN_INTERVAL_MS` moved from 350ms to 150ms — this is a deliberate,
 * user-confirmed departure from WCAG 2.3.1 general-flash guidance for this
 * one page. Do not "correct" it back down without the user raising it
 * again. `MAX_INTERVAL_MS`/`DRIFT_INTERVAL_MS` are unaffected.
 */

/** Floor: fastest allowed cadence. `1000/150 ≈ 6.7/sec` — D-10 override
 * (2026-07-29): raised from the original WCAG-adjacent 350ms (≈2.86/sec)
 * per explicit, knowing user request at the plan 16-03 checkpoint. Still a
 * finite ceiling (not uncapped) — see 16-CONTEXT.md for the full tradeoff
 * discussion. */
export const MIN_INTERVAL_MS = 150;

/** Idle / farthest-from-center cadence (D-08). */
export const MAX_INTERVAL_MS = 2200;

/** Reduced-motion fixed drift cadence (D-11) — slower than any
 * pointer-driven cadence, well under the ≈3/sec ceiling. */
export const DRIFT_INTERVAL_MS = 4000;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Maps pointer/touch proximity-to-center (`0` = idle, `1` = dead-center)
 * to a pop interval in milliseconds. Proximity `0` → `MAX_INTERVAL_MS`
 * (slow/idle); proximity `1` → `MIN_INTERVAL_MS` (fast/capped);
 * intermediate values interpolate monotonically between them (D-08).
 *
 * Never throws. Non-finite input is treated as idle (`0`). The return
 * value is always clamped to `>= MIN_INTERVAL_MS` (D-10 cap, defense in
 * depth — independent of the clamp already applied to `proximity`).
 */
export function proximityToInterval(proximity: number): number {
  const safeProximity = Number.isFinite(proximity) ? proximity : 0;
  const clamped = Math.max(0, Math.min(1, safeProximity));
  const interval = lerp(MAX_INTERVAL_MS, MIN_INTERVAL_MS, clamped);
  return Math.max(interval, MIN_INTERVAL_MS);
}
