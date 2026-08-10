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

/**
 * HOME-16/D-05: picks a gallery index used ONLY to resolve the homepage's
 * STARTING accent colour pair on page load — a random visit-to-visit accent
 * drawn from the existing per-gallery `heroColor` values, replacing the
 * previous always-gallery-0 default. Deliberately does NOT influence
 * `carouselIndex` — the photo, title, and index label still start on
 * gallery 0 (RESEARCH.md Pattern 4/Pitfall 4); this function's return value
 * feeds a separate, narrower accent-only override in HomeCarousel.astro's
 * inline script, applied AFTER the existing initial render() call so it
 * isn't clobbered.
 *
 * `randomSource` is injectable purely for deterministic unit testing — the
 * runtime always uses the default `Math.random`, resolved at CALL time (a
 * default parameter, not a captured module-load-time reference), so a test
 * stubbing `Math.random` on `globalThis` still takes effect when the caller
 * omits the second argument entirely.
 */
export function pickRandomGalleryIndex(count: number, randomSource: () => number = Math.random): number {
  if (count <= 0) return 0;
  return Math.floor(randomSource() * count);
}

/**
 * Private clamp helper — matches DetailHero.astro's existing
 * `Math.max(0, Math.min(1, v))` shape. Not exported: this module's
 * pre-existing functions each inline their own clamp expression at their
 * own call sites (e.g. computeWordmarkSeamFraction) and are left untouched
 * here, per this plan's scope (extend, don't refactor).
 */
function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/**
 * Phase 21 (HOME-14/HOME-15), sketch 015 "Scale Through": the confirmed
 * scroll distance (in px) over which the mobile wordmark-zoom transition
 * plays out, from t=0 (zoom not started) to t=1 (fully zoomed into the
 * photo). 900px is the "Cinematic" pace, the slowest/most generous of three
 * candidates tested on a real phone (420px "Quick", 650px "Balanced", 900px
 * "Cinematic") — D-02/D-04 in `21-CONTEXT.md` record Cinematic as the
 * winner, a quicker pace read as abrupt. The PACE CATEGORY ("give the
 * effect room to breathe") is the locked design decision, not this exact
 * pixel count — a later real-device tuning pass may adjust the number
 * without reopening that decision.
 */
export const ZOOM_REVEAL_DISTANCE = 900;

/**
 * Phase 21, plan 21-13: shared body extracted from `computeZoomProgress` so
 * `computeIntroProgress` (below, added by plan 21-13 for `21-UAT.md`
 * round-2 gap 1) can delegate to the exact same formula instead of a second
 * hand-copied one drifting out of sync. Neither public function's
 * signature, default argument, docstring or observable behaviour changed by
 * this extraction — `computeZoomProgress`'s own describe block is the
 * regression net and stays green unmodified.
 *
 * `trackTop` is 0 or positive while the track's top edge hasn't yet
 * scrolled past the viewport's top edge (not started, clamped to 0); it
 * becomes increasingly negative as the page scrolls down, reaching
 * `-revealDistance` at the fully-scrubbed end-state (clamped to 1 beyond
 * that). A `revealDistance <= 0` is a degenerate caller error — resolved to
 * the completed end-state (1) rather than dividing by zero/a negative
 * number and producing Infinity or NaN.
 */
function computeTrackProgress(trackTop: number, revealDistance: number): number {
  if (revealDistance <= 0) return 1;
  return clamp01(-trackTop / revealDistance);
}

/**
 * Converts the pinned scroll track's own `getBoundingClientRect().top`
 * (per D-02, mirroring `DetailHero.astro`'s existing scroll-scrubbed pin
 * driver — NOT a bounded div's `scrollTop`, which was sketch-only
 * scaffolding for side-by-side variant comparison) into a 0..1 zoom
 * progress fraction. See `computeTrackProgress` above for the shared
 * formula this delegates to.
 */
export function computeZoomProgress(trackTop: number, revealDistance: number = ZOOM_REVEAL_DISTANCE): number {
  return computeTrackProgress(trackTop, revealDistance);
}

export interface WordmarkZoomState {
  scale: number;
  wordmarkOpacity: number;
  photoOpacity: number;
}

/**
 * Phase 21 (HOME-14/HOME-15), sketch 015 "Scale Through": the wordmark's
 * scale/opacity/crossfade curve, driven by a single 0..1 zoom-progress
 * number (see `computeZoomProgress`). D-01/D-04 in `21-CONTEXT.md` confirm
 * this exact curve shape (an accelerating ease-in-cubic scale, not linear)
 * as the chosen "Scale Through" treatment.
 *
 * `t` is clamped to [0,1] first (scroll can overshoot either end). `scale`
 * runs 1 -> 8.5 along an ease-in-cubic (`ct * ct * ct`) of the clamped
 * input, so it accelerates rather than moves at a constant rate.
 * `wordmarkOpacity`/`photoOpacity` are driven by the same clamped input
 * directly (not the eased curve) over their own late-arriving thresholds:
 * the wordmark only starts fading past t=0.92, and the photo crossfade
 * starts even earlier, at t=0.85. That early photoOpacity ramp is a
 * deliberate end-state safety net (not a bug to "optimize away") — it hides
 * rasterization/seam artifacts that would otherwise be visible at the
 * extreme ~8.5x scale by having a plain full-bleed photo already partially
 * visible underneath before the wordmark itself has fully vanished.
 *
 * The two endpoints (`ct <= 0`, `ct >= 1`) are returned as exact literals
 * rather than run through the threshold formulas below: `(1 - 0.92) / 0.08`
 * does not land on an exact binary floating-point 1, so the general
 * formula alone would leak a ~5.5e-16 float-noise residual into
 * `wordmarkOpacity` at t=1 instead of a clean `0`.
 */
export function computeWordmarkZoomState(t: number): WordmarkZoomState {
  const ct = clamp01(t);
  if (ct <= 0) return { scale: 1, wordmarkOpacity: 1, photoOpacity: 0 };
  if (ct >= 1) return { scale: 8.5, wordmarkOpacity: 0, photoOpacity: 1 };
  const eased = ct * ct * ct;
  return {
    scale: 1 + 7.5 * eased,
    wordmarkOpacity: 1 - clamp01((ct - 0.92) / 0.08),
    photoOpacity: clamp01((ct - 0.85) / 0.15),
  };
}

/**
 * Phase 21, plan 21-13 (`21-UAT.md` round-2 gap 1, root-caused in
 * `.planning/debug/homepage-scroll-intro-logo-duplication.md`), assumption
 * A6: the scroll distance (in px) over which the pinned intro scrub plays
 * out, from t=0 (stage not yet reached the top) to t=1 (logo shrunk to
 * rest, tagline fully arrived). 900px is deliberately the SAME value as
 * `ZOOM_REVEAL_DISTANCE` — the already real-device-confirmed "Cinematic"
 * pace (see that constant's own docstring) — so the intro inherits a
 * tested pacing rather than inventing an untested second one, and so the
 * total pre-zoom distance (one viewport plus this distance) stays within
 * 3% of what the superseded two-static-section design produced. *Alternative
 * if a real-device check corrects this: a shorter or longer distance is a
 * one-constant change.*
 */
export const INTRO_REVEAL_DISTANCE = 900;

/**
 * Converts the pinned intro track's own `getBoundingClientRect().top` into
 * a 0..1 intro-scrub progress fraction — the intro's own analogue of
 * `computeZoomProgress`, delegating to the same `computeTrackProgress`
 * helper above so the two share one formula rather than two hand-copied
 * ones. See `computeTrackProgress`'s docstring for the exact clamping
 * behaviour at each end and for a degenerate (`<= 0`) `revealDistance`.
 */
export function computeIntroProgress(trackTop: number, revealDistance: number = INTRO_REVEAL_DISTANCE): number {
  return computeTrackProgress(trackTop, revealDistance);
}

export interface IntroScrubState {
  logoScale: number;
  taglineOpacity: number;
  taglineTranslateY: number;
  cueOpacity: number;
}

/**
 * `computeIntroScrubState(t)` — Phase 21, plan 21-13 (`21-UAT.md` round-2
 * gap 1 and gap 2's intro half): the pinned intro's
 * logo-shrink/tagline-arrival/cue-fade curve, driven by a single 0..1
 * intro-progress number (see `computeIntroProgress`).
 *
 * The tagline's opacity/offset are deliberately a SUB-RANGE of this one
 * progress value rather than their own separate mechanism — the same
 * sub-range idiom `DetailHero.astro`'s `onProgress(t)` already uses to
 * reveal dependent content from one shared `t`. That is what makes the
 * logo's shrink and the tagline's arrival provably ONE continuous motion,
 * not two coincidentally-timed ones. The trailing dwell this produces
 * (tagline fully opaque and stationary for the last 40% of the scrub) is
 * gap 2's structural fix — the intro half of `21-UAT.md` round-2 gap 2,
 * whose debug session names the old two-beat design's missing snap point
 * as the failure mechanism a pinned stage removes entirely. Not free
 * tuning space.
 *
 * `t` is clamped to [0,1] first (scroll can overshoot either end).
 * `logoScale` runs 1 down to 0.45 along an ease-OUT cubic
 * (`1 - (1 - ct) ** 3`) of the clamped input — the opposite curve from the
 * zoom's ease-in (`computeWordmarkZoomState`, `ct ** 3`), deliberately so:
 * the zoom accelerates into a climax, the intro answers the visitor's
 * first gesture immediately and then settles. `taglineOpacity` is
 * `clamp01((ct - 0.25) / 0.35)` — starts a quarter of the way in, fully
 * arrived at 60%. `taglineTranslateY` is D-13's locked 8px offset scaled by
 * that same sub-range (8 at its start, 0 once it completes) — only the
 * driving mechanism changes from a 180ms CSS transition to scroll
 * position; D-13's values are unchanged. `cueOpacity` is
 * `1 - clamp01(ct / 0.2)` — the scroll affordance is gone well before the
 * tagline's own sub-range starts, so the two never compete in the same
 * cell.
 *
 * The two endpoints (`ct <= 0`, `ct >= 1`) are returned as exact literals
 * rather than run through the formulas below, for the same reason
 * `computeWordmarkZoomState`'s docstring already gives: `1 - 0.55 * 1` does
 * not land on an exact binary `0.45` (float noise), and a scale that never
 * quite reaches its documented end value is exactly the kind of residual
 * that makes a later "why is this 0.44999999999999996" investigation
 * necessary.
 */
export function computeIntroScrubState(t: number): IntroScrubState {
  const ct = clamp01(t);
  if (ct <= 0) return { logoScale: 1, taglineOpacity: 0, taglineTranslateY: 8, cueOpacity: 1 };
  if (ct >= 1) return { logoScale: 0.45, taglineOpacity: 1, taglineTranslateY: 0, cueOpacity: 0 };
  const eased = 1 - (1 - ct) ** 3;
  const taglineOpacity = clamp01((ct - 0.25) / 0.35);
  return {
    logoScale: 1 - 0.55 * eased,
    taglineOpacity,
    taglineTranslateY: 8 * (1 - taglineOpacity),
    cueOpacity: 1 - clamp01(ct / 0.2),
  };
}

/**
 * Phase 21, plan 21-07 (`21-UAT.md` gap 2, root-caused in
 * `.planning/debug/homepage-scroll-zoom-handoff-glitch.md`): the 0..1
 * fraction of a full-width deck slide's own rect currently visible in the
 * viewport, re-derivable from a live `getBoundingClientRect()` on every
 * painted frame — this is what lets the arrival reveal be POLLED instead of
 * waiting on `IntersectionObserver` callback delivery, which is the actual
 * mechanism fix for the handoff glitch (real touch-momentum/scroll-snap
 * settling on iOS was throttling/coalescing both `scroll` dispatch and
 * observer callbacks past the moment native `position: sticky` had already
 * released).
 *
 * `rect` is deliberately a structural shape (top/bottom/height), not a
 * `DOMRect`, matching `computeFocusOrigin`'s own DOM-free idiom above so
 * this stays unit-testable outside a browser.
 *
 * The denominator is `min(rect.height, viewportHeight)`, NOT `rect.height` —
 * this is the one deliberate divergence from `IntersectionObserver`'s own
 * `intersectionRatio` semantics. A slide section can be taller than the
 * live viewport (a phone's real, address-bar-adjusted `innerHeight` can
 * disagree with the section's own resolved height), and if the denominator
 * were the full rect height, "fully covering the viewport" would cap out
 * below 1 and could permanently miss the 0.98 arrival threshold. Dividing
 * by the smaller of the two means "fully covers what's actually visible"
 * reaches exactly 1, which is what "arrived" is supposed to mean. Do not
 * "correct" this back to `rect.height` — that reintroduces the exact
 * failure mode this function exists to remove.
 *
 * Degenerate inputs (`viewportHeight <= 0` or `rect.height <= 0`) return 0
 * rather than dividing by zero or reporting a spurious arrival. The result
 * is always clamped to [0,1].
 */
export function computeSlideVisibleRatio(rect: { top: number; bottom: number; height: number }, viewportHeight: number): number {
  if (viewportHeight <= 0 || rect.height <= 0) return 0;
  const visibleTop = Math.max(rect.top, 0);
  const visibleBottom = Math.min(rect.bottom, viewportHeight);
  const visibleHeight = visibleBottom - visibleTop;
  const denominator = Math.min(rect.height, viewportHeight);
  return clamp01(visibleHeight / denominator);
}

/**
 * Phase 21, plan 21-15 (`21-UAT.md` round-2 gap 2, gallery-description half;
 * root-caused in `.planning/debug/homepage-scroll-text-reveal-too-fast.md`;
 * D-13/D-14; assumption A8): the visible ratio (see `computeSlideVisibleRatio`
 * above) at or above which a slide that is NOT currently revealed becomes
 * revealed.
 *
 * This moved off the old symmetric 0.98 because plan 21-11's live-viewport
 * slide sizing (`--deck-vh`) collapsed the tolerance band the old value
 * quietly relied on: before that plan, a slide's `100svh` height was
 * reliably SHORTER than the live `innerHeight` whenever Mobile Safari's
 * toolbar was retracted, so `computeSlideVisibleRatio`'s
 * `min(rect.height, viewportHeight)` denominator let the ratio sit at
 * exactly 1 across a whole band of scroll positions. Once the deck's slides
 * are sized from the live viewport instead, that band collapses to nothing —
 * `ratio >= 0.98` became a window roughly 17px wide on an 852px screen. 0.9
 * still means the slide occupies at least 90% of the screen — unambiguously
 * D-14's "arrival-complete", not "starting to enter" — with headroom this
 * plan's own two-level latch (see `computeArrivalRevealed` below) needs to
 * be robust to an unreliable `scroll-snap: proximity` stop.
 *
 * The PAIR (a high reveal threshold, a much lower release threshold) is the
 * mechanism decision; the exact numbers are tuning — the same distinction
 * `ZOOM_REVEAL_DISTANCE`'s own docstring draws between a locked pace
 * category and a pixel count. This value must never drop to 0.5 or below:
 * every deck slide is one viewport tall and they are contiguous, so two
 * adjacent slides' visible ratios sum to at most 1. A reveal threshold above
 * 0.5 therefore guarantees at most ONE slide can cross into the revealed
 * state at any scroll position, which is the property D-09's live accent
 * and the 21-08 next-slide warm both ride on (they fire on the rising edge
 * of exactly one slide). Drop this to 0.5 or below and two galleries can be
 * "arrived" at once, and the accent starts tracking whichever one the array
 * order happened to visit last.
 */
export const ARRIVAL_REVEAL_THRESHOLD = 0.9;

/**
 * Phase 21, plan 21-15 (`21-UAT.md` round-2 gap 2, gallery-description half;
 * assumption A8): the visible ratio below which a slide that IS currently
 * revealed stops being revealed — the release side of the two-level latch
 * `computeArrivalRevealed` implements. Deliberately far below
 * `ARRIVAL_REVEAL_THRESHOLD` (see that constant's own docstring for why the
 * PAIR, not the exact numbers, is the mechanism decision): 0.45 means a
 * description survives until its slide is more than half gone, which is
 * what makes a real momentum scroll settling slightly off a snap point still
 * leave the text readable.
 */
export const ARRIVAL_RELEASE_THRESHOLD = 0.45;

/**
 * Phase 21, plan 21-15 (`21-UAT.md` round-2 gap 2, gallery-description half;
 * root-caused in `.planning/debug/homepage-scroll-text-reveal-too-fast.md`;
 * D-13/D-14; assumption A8): a two-level (Schmitt-trigger) latch replacing
 * `applyArrival()`'s old symmetric `ratio >= 0.98` comparison, which used
 * the SAME number to show and to hide a gallery's description, evaluated
 * fresh on every painted frame. That gave the boundary no memory: a single
 * frame below 0.98 — from an unreliable `scroll-snap: proximity` stop, or
 * simply the settle spring of a successful snap — re-hid text the 180ms
 * reveal transition had only just finished bringing in.
 *
 * `wasRevealed` false: returns true only when `ratio` is at or above
 * `revealThreshold`. `wasRevealed` true: returns true while `ratio` is at or
 * above `releaseThreshold`, false below it. Both boundaries are inclusive on
 * the "revealed" side — an exclusive comparison on one side and inclusive on
 * the other is exactly the kind of asymmetry that produces a one-frame
 * flicker at the boundary, which is this function's whole subject.
 *
 * A non-finite `ratio` returns false. This is not reachable through
 * `computeSlideVisibleRatio` (which clamps and resolves degenerate inputs to
 * 0), but a latch is the one place where "unknown" must fail toward
 * released rather than sticking on.
 *
 * Degenerate caller: a `releaseThreshold` greater than `revealThreshold` is
 * resolved by using `revealThreshold` for BOTH comparisons — i.e. the latch
 * collapses to the old symmetric behaviour rather than becoming a latch that
 * can never release. That direction is chosen deliberately: a stuck-revealed
 * description is a silent, permanent breach of D-14 and D-04 that no amount
 * of scrolling can clear, whereas collapsing to symmetric is merely the old
 * behaviour back.
 *
 * A dwell-in-frames alternative (require N consecutive frames above the
 * threshold before revealing) was considered and rejected: it makes
 * revealing HARDER, which is the wrong direction — the reported failure
 * includes a reveal that barely happens at all, and a dwell requirement
 * could stop it happening at all. It would also make the reveal a function
 * of elapsed time rather than scroll position, which D-04's reversibility
 * and D-15's reduced-motion end state both rule out. This latch's state is
 * exactly the class list `applyArrival()` already reads on the line above
 * the toggle today (for the accent rising-edge guard) — nothing new is
 * stored, nothing new is written, and the function stays a pure function of
 * its two numeric inputs plus that one boolean.
 */
export function computeArrivalRevealed(
  ratio: number,
  wasRevealed: boolean,
  revealThreshold: number = ARRIVAL_REVEAL_THRESHOLD,
  releaseThreshold: number = ARRIVAL_RELEASE_THRESHOLD,
): boolean {
  if (!Number.isFinite(ratio)) return false;
  const effectiveReleaseThreshold = releaseThreshold > revealThreshold ? revealThreshold : releaseThreshold;
  return wasRevealed ? ratio >= effectiveReleaseThreshold : ratio >= revealThreshold;
}

export interface FocusOrigin {
  originX: number;
  originY: number;
}

/**
 * Phase 21 (HOME-15), sketch 015's `syncFocusOrigin()`: derives the zoom's
 * CSS `transform-origin` (as percentages of the wordmark box) from the
 * measured position of a specific focus target (the "A" of "Atelier" glyph
 * span) inside the wordmark box — never a hardcoded percentage guess. Font
 * metrics, viewport width, and font-load timing all shift where a specific
 * glyph actually renders, so a hardcoded percentage would silently drift
 * out of alignment; measuring both rects live keeps the anchor correct
 * across all of those. The caller is responsible for re-measuring after
 * `document.fonts.ready` resolves and on resize/orientationchange, since
 * this function itself is DOM-free and only does the arithmetic once given
 * two already-measured rects.
 *
 * Returns `null` for a degenerate wordmark box (zero width or height) —
 * dividing by zero there would produce Infinity/NaN, not a usable origin.
 * A focus box that extends outside the wordmark box is deliberately NOT
 * clamped: the raw (possibly <0% or >100%) percentage is returned as-is,
 * since `transform-origin` itself accepts out-of-range percentages and the
 * caller feeds this value straight through.
 */
export function computeFocusOrigin(wordmarkRect: Rect, focusRect: Rect): FocusOrigin | null {
  if (wordmarkRect.width <= 0 || wordmarkRect.height <= 0) return null;
  const originX = ((focusRect.left + focusRect.width / 2 - wordmarkRect.left) / wordmarkRect.width) * 100;
  const originY = ((focusRect.top + focusRect.height / 2 - wordmarkRect.top) / wordmarkRect.height) * 100;
  return { originX, originY };
}

/**
 * Phase 21, plan 21-01: single importable home for the wordmark's
 * photo-cutout brightness/contrast heuristic, a byte-faithful transcription
 * of the logic currently duplicated in `HomeCarousel.astro`'s frontmatter
 * and client `<script>` (flagged in `20-REVIEW.md` IN-01). A naturally-dark
 * photo needs its filter lifted (brighter, lower contrast) rather than
 * darkened to stay legible behind white accent text; every other accent
 * text color in this site's design system is paired with the darkened
 * variant instead. `HomeCarousel.astro` is NOT modified by this plan —
 * plan 21-04 owns deleting both duplicates there and importing this export.
 */
export function wordmarkPhotoFilter(textColor?: string): string {
  return textColor?.toUpperCase() === '#FFFFFF'
    ? 'brightness(1.38) contrast(0.92)'
    : 'brightness(0.65) contrast(1.12)';
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
