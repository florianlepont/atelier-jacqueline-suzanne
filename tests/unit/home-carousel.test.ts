import { describe, expect, it } from 'vitest';
import {
  computeFocusOrigin,
  computeHoverZone,
  computeIntroProgress,
  computeIntroScrubState,
  computeSlideVisibleRatio,
  computeWordmarkBackgroundPosition,
  computeWordmarkSeamFraction,
  computeWordmarkZoomState,
  computeZoomProgress,
  detectSwipeDirection,
  INTRO_REVEAL_DISTANCE,
  pickRandomGalleryIndex,
  wordmarkPhotoFilter,
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

// Phase 21, plan 21-13 (`21-UAT.md` round-2 gap 1, root-caused in
// `.planning/debug/homepage-scroll-intro-logo-duplication.md`, assumption
// A6): the intro's own scroll-distance-to-progress conversion, sharing the
// same track-progress helper computeZoomProgress delegates to.
describe('computeIntroProgress', () => {
  it('INTRO_REVEAL_DISTANCE is the sketch-015 Cinematic pace, matching ZOOM_REVEAL_DISTANCE (assumption A6)', () => {
    expect(INTRO_REVEAL_DISTANCE).toBe(900);
  });

  it('returns 0 when the track top is flush with the viewport top (scrub not started)', () => {
    expect(computeIntroProgress(0)).toBe(0);
  });

  it('returns 0 while the track is still below the fold (positive top)', () => {
    expect(computeIntroProgress(120)).toBe(0);
  });

  it('returns 0.5 halfway through the default reveal distance', () => {
    expect(computeIntroProgress(-450)).toBe(0.5);
  });

  it('returns exactly 1 at the full default reveal distance', () => {
    expect(computeIntroProgress(-900)).toBe(1);
  });

  it('clamps to 1 well past the reveal distance', () => {
    expect(computeIntroProgress(-5000)).toBe(1);
  });

  it('honors an explicit reveal distance', () => {
    expect(computeIntroProgress(-300, 600)).toBe(0.5);
  });

  it('resolves a degenerate (zero) reveal distance to the completed end-state, not Infinity/NaN', () => {
    expect(computeIntroProgress(-300, 0)).toBe(1);
  });

  it('resolves a degenerate (negative) reveal distance to the completed end-state, not Infinity/NaN', () => {
    expect(computeIntroProgress(-300, -100)).toBe(1);
  });
});

// Phase 21, plan 21-13 (`21-UAT.md` round-2 gap 1 and gap 2's intro half):
// the logo-shrink/tagline-arrival/cue-fade curve, driven by the same 0..1
// progress `computeIntroProgress` produces. The tagline is deliberately a
// sub-range of this ONE progress value (not its own mechanism) — the same
// idiom DetailHero.astro's onProgress(t) sub-range reveal already uses —
// which is what makes the logo's shrink and the tagline's arrival provably
// one continuous motion rather than two coincidentally-timed ones. The
// trailing ~40% dwell (taglineOpacity reaching 1 at ct=0.6, well before the
// scrub's own end) is gap 2's structural fix: the tagline is fully opaque
// and stationary for the last 40% of a pinned scrub, independent of the
// visitor's scroll momentum.
describe('computeIntroScrubState', () => {
  it('at the clamped floor: logo at rest scale, tagline hidden and offset, cue fully visible', () => {
    expect(computeIntroScrubState(0)).toEqual({ logoScale: 1, taglineOpacity: 0, taglineTranslateY: 8, cueOpacity: 1 });
  });

  it('at the clamped ceiling: logo at its shrunk end scale, tagline fully arrived, cue gone', () => {
    expect(computeIntroScrubState(1)).toEqual({ logoScale: 0.45, taglineOpacity: 1, taglineTranslateY: 0, cueOpacity: 0 });
  });

  it('clamps input below 0 to behave as t = 0', () => {
    expect(computeIntroScrubState(-2)).toEqual({ logoScale: 1, taglineOpacity: 0, taglineTranslateY: 8, cueOpacity: 1 });
  });

  it('clamps input above 1 to behave as t = 1', () => {
    expect(computeIntroScrubState(4)).toEqual({ logoScale: 0.45, taglineOpacity: 1, taglineTranslateY: 0, cueOpacity: 0 });
  });

  it('cueOpacity reaches exactly 0 at ct = 0.2, before the tagline sub-range even starts (ct = 0.25)', () => {
    const result = computeIntroScrubState(0.2);
    expect(result.cueOpacity).toBe(0);
    expect(result.taglineOpacity).toBe(0);
  });

  it('taglineOpacity is 0 until ct = 0.25, the start of its own sub-range', () => {
    expect(computeIntroScrubState(0.25).taglineOpacity).toBe(0);
  });

  it('taglineOpacity reaches exactly 1 at ct = 0.6, leaving the last 40% of the scrub fully opaque and stationary (gap 2)', () => {
    const result = computeIntroScrubState(0.6);
    expect(result.taglineOpacity).toBe(1);
    expect(result.taglineTranslateY).toBe(0);
  });

  it('at ct = 0.6 through 1, the tagline stays fully opaque and un-offset (the trailing dwell)', () => {
    for (const ct of [0.6, 0.75, 0.9, 1]) {
      const result = computeIntroScrubState(ct);
      expect(result.taglineOpacity).toBe(1);
      expect(result.taglineTranslateY).toBe(0);
    }
  });

  it('logoScale runs along an ease-OUT cubic (responds immediately, settles toward the end) — distinct from the zoom’s ease-in', () => {
    const result = computeIntroScrubState(0.1);
    // eased = 1 - (1 - 0.1) ** 3 = 1 - 0.729 = 0.271; logoScale = 1 - 0.55 * 0.271
    expect(result.logoScale).toBeCloseTo(1 - 0.55 * 0.271, 5);
  });

  it('logoScale is strictly decreasing across an ascending sweep of t', () => {
    const sweep = [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1];
    let previous = Infinity;
    for (const t of sweep) {
      const { logoScale } = computeIntroScrubState(t);
      expect(logoScale).toBeLessThan(previous);
      previous = logoScale;
    }
  });

  it('taglineOpacity is non-decreasing across an ascending sweep of t', () => {
    const sweep = [0, 0.1, 0.25, 0.4, 0.6, 0.75, 0.9, 1];
    let previous = -Infinity;
    for (const t of sweep) {
      const { taglineOpacity } = computeIntroScrubState(t);
      expect(taglineOpacity).toBeGreaterThanOrEqual(previous);
      previous = taglineOpacity;
    }
  });

  it('cueOpacity is non-increasing across an ascending sweep of t', () => {
    const sweep = [0, 0.05, 0.1, 0.2, 0.5, 1];
    let previous = Infinity;
    for (const t of sweep) {
      const { cueOpacity } = computeIntroScrubState(t);
      expect(cueOpacity).toBeLessThanOrEqual(previous);
      previous = cueOpacity;
    }
  });
});

// Phase 21 (HOME-15), plan 21-01: measured (not guessed) transform-origin for
// the zoom's focus anchor (sketch 015's syncFocusOrigin()). RED:
// computeFocusOrigin does not exist yet.
describe('computeFocusOrigin', () => {
  it('computes the focus box center as a percentage of the wordmark box (top-left aligned)', () => {
    expect(
      computeFocusOrigin(
        { left: 0, top: 0, width: 200, height: 100 },
        { left: 0, top: 0, width: 20, height: 50 },
      ),
    ).toEqual({ originX: 5, originY: 25 });
  });

  it('computes the focus box center as a percentage of the wordmark box (offset origin)', () => {
    expect(
      computeFocusOrigin(
        { left: 100, top: 50, width: 400, height: 200 },
        { left: 100, top: 50, width: 40, height: 40 },
      ),
    ).toEqual({ originX: 5, originY: 10 });
  });

  it('returns 50/50 when the focus box is centered in the wordmark box', () => {
    expect(
      computeFocusOrigin(
        { left: 0, top: 0, width: 200, height: 100 },
        { left: 90, top: 40, width: 20, height: 20 },
      ),
    ).toEqual({ originX: 50, originY: 50 });
  });

  it('returns null for a zero-width wordmark box', () => {
    expect(
      computeFocusOrigin(
        { left: 0, top: 0, width: 0, height: 100 },
        { left: 0, top: 0, width: 20, height: 50 },
      ),
    ).toBeNull();
  });

  it('returns null for a zero-height wordmark box', () => {
    expect(
      computeFocusOrigin(
        { left: 0, top: 0, width: 200, height: 0 },
        { left: 0, top: 0, width: 20, height: 50 },
      ),
    ).toBeNull();
  });

  it('does not clamp a focus box outside the wordmark box — raw percentage passes through', () => {
    const result = computeFocusOrigin(
      { left: 0, top: 0, width: 200, height: 100 },
      { left: 220, top: 0, width: 20, height: 50 },
    );
    expect(result).not.toBeNull();
    expect(result?.originX).toBeCloseTo(115, 5);
    expect(result?.originY).toBe(25);
  });
});

// Phase 21, plan 21-07 (`21-UAT.md` gap 2 — the zoom-to-slide handoff
// glitch, root-caused in
// `.planning/debug/homepage-scroll-zoom-handoff-glitch.md`): the arrival
// ratio math extracted so the per-frame driver can poll live geometry
// instead of waiting on IntersectionObserver callback delivery.
describe('computeSlideVisibleRatio', () => {
  it('returns 1 for a slide fully covering the viewport', () => {
    expect(computeSlideVisibleRatio({ top: 0, bottom: 852, height: 852 }, 852)).toBe(1);
  });

  it('returns 0 for a slide completely below the viewport', () => {
    expect(computeSlideVisibleRatio({ top: 852, bottom: 1704, height: 852 }, 852)).toBe(0);
  });

  it('returns 0 for a slide completely above the viewport', () => {
    expect(computeSlideVisibleRatio({ top: -852, bottom: 0, height: 852 }, 852)).toBe(0);
  });

  it('returns 0.5 for a slide exactly half scrolled in from below', () => {
    expect(computeSlideVisibleRatio({ top: 426, bottom: 1278, height: 852 }, 852)).toBe(0.5);
  });

  it('returns 0.5 for a slide exactly half scrolled out toward above', () => {
    expect(computeSlideVisibleRatio({ top: -426, bottom: 426, height: 852 }, 852)).toBe(0.5);
  });

  it('returns 1 for a slide taller than the viewport but fully covering it — denominator is min(height, viewportHeight), not rect.height', () => {
    expect(computeSlideVisibleRatio({ top: -100, bottom: 900, height: 1000 }, 852)).toBe(1);
  });

  it('returns 0 for a degenerate non-positive viewportHeight, never dividing by zero', () => {
    expect(computeSlideVisibleRatio({ top: 0, bottom: 852, height: 852 }, 0)).toBe(0);
  });

  it('returns 0 for a degenerate non-positive rect.height, never dividing by zero', () => {
    expect(computeSlideVisibleRatio({ top: 0, bottom: 0, height: 0 }, 852)).toBe(0);
  });
});

// Phase 21, plan 21-01: single importable home for the photo-cutout
// brightness/contrast heuristic, duplicated today in HomeCarousel.astro's
// frontmatter and client <script> (20-REVIEW.md IN-01). RED:
// wordmarkPhotoFilter does not exist yet.
describe('wordmarkPhotoFilter', () => {
  it('returns the lifted (brighter) variant for white text', () => {
    expect(wordmarkPhotoFilter('#FFFFFF')).toBe('brightness(1.38) contrast(0.92)');
  });

  it('is case-insensitive for the white hex value', () => {
    expect(wordmarkPhotoFilter('#ffffff')).toBe('brightness(1.38) contrast(0.92)');
  });

  it('returns the darkened variant for a non-white text color', () => {
    expect(wordmarkPhotoFilter('#37013A')).toBe('brightness(0.65) contrast(1.12)');
  });

  it('returns the darkened variant when textColor is undefined', () => {
    expect(wordmarkPhotoFilter(undefined)).toBe('brightness(0.65) contrast(1.12)');
  });
});
