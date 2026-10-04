import {
  computeWordmarkBackgroundPosition,
  computeWordmarkSeamFraction,
} from '../../lib/home-carousel';
import type { HomeContext } from './types';

/** Keeps the wordmark's photo cutout aligned with the live hero photo and the edge peek. */
export function setupWordmark(ctx: HomeContext): void {
  const { state, api, dom, runtime, reduceMotionQuery, hoverCapable } = ctx;
  const { root, heroImg, wordmarkEl, wordmarkStackEl, wordmarkPeekPrevEl, wordmarkPeekNextEl } =
    dom;

  function revealWordmarkPhoto() {
    if (!heroImg) return;
    const selectedSrc = heroImg.currentSrc || heroImg.src;
    if (!selectedSrc) return;
    root!.style.setProperty('--wordmark-photo', `url(${selectedSrc})`);
    syncWordmarkLayers();
    root!.classList.add('has-wordmark-photo');
  }
  // .home-hero__img uses the default object-position (50% 50%,
  // dead center) — kept as named constants so the crop math below
  // stays generic if that ever changes again.
  const OBJECT_POSITION_X = 0.5;
  const OBJECT_POSITION_Y = 0.5;

  // Direct user feedback: background-size:cover scoped to the small
  // wordmark box (the previous approach) shows an independently
  // re-cropped/zoomed slice of the photo, not the SAME slice that's
  // actually behind the panel — it doesn't read as a true cutout.
  // This computes the exact background-size/position the wordmark's
  // own background-image needs so it lines up pixel-for-pixel with
  // heroImg's own object-fit:cover crop — i.e. what you'd see if the
  // panel really were a hole cut in the same physical photo. Must be
  // computed in JS: CSS has no way to say "background-size:cover
  // relative to a DIFFERENT (larger) box than the element's own".
  function syncWordmarkAlignment() {
    if (!heroImg || !wordmarkEl) return;
    // heroImg carries a plain full-cover box (inset: 0; width/height:
    // 100%) — its own rect is read directly here (not .home-hero's)
    // since object-fit:cover's crop math is relative to the img's own
    // rendered box.
    // quick-260727-kq8: opt out of the drq clamp (clampToPhoto=false)
    // — the seam-driven clip-path (--wm-seam on
    // .home-hero__wordmark-stack, CSS zone selectors) already
    // guarantees only the in-bounds [0, seam] slice of this layer
    // ever paints, so the full-box clamp is redundant here and its
    // only effect was freezing this current layer's position once the
    // raw value exceeded the photo's bounds.
    const result = computeWordmarkBackgroundPosition(
      heroImg.naturalWidth,
      heroImg.naturalHeight,
      heroImg.getBoundingClientRect(),
      wordmarkEl.getBoundingClientRect(),
      OBJECT_POSITION_X,
      OBJECT_POSITION_Y,
      false,
    );
    if (!result) return;
    wordmarkEl.style.setProperty('--wordmark-bg-size', result.size);
    wordmarkEl.style.setProperty('--wordmark-bg-position', result.position);
  }

  // quick-260727-iao: which edge's peek layer is "active" — sticky
  // across interactions so a mouseleave recede eases toward the SAME
  // extreme the seam was already tracking (no snap/desync between the
  // eased photo receding and the wordmark). Deliberately no 'center'
  // value: at neutral the seam fraction naturally rests at its
  // current-covers-all extreme (s=1 for right, s=0 for left), which
  // renders identically to "center" (current full, both peeks
  // clipped) — see the CSS zone selectors in Task 2.

  // Extends (does not replace) syncWordmarkAlignment()'s current-layer
  // math: also feeds the active peek layer its own independent crop
  // via the SAME pure computeWordmarkBackgroundPosition(), and derives
  // the live seam fraction from heroImg's LIVE edge via
  // computeWordmarkSeamFraction() — mirroring exactly how the photo's
  // own peekPrev/peekNext layers are positioned relative to heroImg.
  function syncWordmarkLayers() {
    syncWordmarkAlignment();
    if (!wordmarkStackEl || !wordmarkEl || !heroImg) return;
    const zone = state.lastPeekZone;
    const peekImg = zone === 'right' ? dom.peekNext : dom.peekPrev;
    const peekEl = zone === 'right' ? wordmarkPeekNextEl : wordmarkPeekPrevEl;
    const restExtreme = zone === 'right' ? '1' : '0';
    const wmRect = wordmarkEl.getBoundingClientRect();

    // Rare fallback (nearest layer's clamped edge, NEVER solid ink):
    // only hit before an adjacent photo has finished loading — peek
    // srcs are preloaded in render(), so this is effectively just the
    // very first paint.
    if (!peekImg || !peekEl || !peekImg.naturalWidth) {
      wordmarkStackEl.style.setProperty('--wm-seam', restExtreme);
      wordmarkStackEl.dataset.peekZone = zone;
      return;
    }
    // quick-260727-kq8: same clamp opt-out as the current-layer call
    // above — the peek layer is equally seam-clip-gated (its own
    // CSS zone selector), so it needs the same continuous, unclamped
    // tracking rather than freezing at a clamped boundary value.
    const peekResult = computeWordmarkBackgroundPosition(
      peekImg.naturalWidth,
      peekImg.naturalHeight,
      peekImg.getBoundingClientRect(),
      wmRect,
      OBJECT_POSITION_X,
      OBJECT_POSITION_Y,
      false,
    );
    if (!peekResult) {
      wordmarkStackEl.style.setProperty('--wm-seam', restExtreme);
      wordmarkStackEl.dataset.peekZone = zone;
      return;
    }
    peekEl.style.backgroundImage = `url(${peekImg.currentSrc || peekImg.src})`;
    peekEl.style.setProperty('--wordmark-bg-size', peekResult.size);
    peekEl.style.setProperty('--wordmark-bg-position', peekResult.position);

    const heroRect = heroImg.getBoundingClientRect();
    const seam = computeWordmarkSeamFraction(
      zone,
      heroRect.left,
      heroRect.right,
      wmRect.left,
      wmRect.width,
    );
    wordmarkStackEl.style.setProperty('--wm-seam', String(seam));
    wordmarkStackEl.dataset.peekZone = zone;
  }

  // quick-260727-bsm (Bug A — wordmark peek desync): syncWordmarkAlignment()
  // above already computes the correct cutout from heroImg's live rect
  // (which reflects the CSS `transform: translateX(var(--peek-shift))`
  // set by updatePeek() below), but it was previously only ever called
  // on load/resize — never while the photo was actually mid-transform.
  // This rAF pump keeps calling it every frame for as long as the photo
  // can plausibly still be moving (an active peek push, or the ~420ms
  // ease-settle after the mouse stops/leaves), so the "hole cut in the
  // photo" illusion never freezes relative to the photo sliding
  // underneath it. quick-260727-iao: the pump now keeps ALL THREE
  // wordmark layers' cutouts AND the seam tracking the live photo
  // motion, not just the single current-layer position.
  let wordmarkSyncRaf: number | null = null;
  let wordmarkSyncUntil = 0;

  function pumpWordmarkSync() {
    syncWordmarkLayers();
    if (performance.now() < wordmarkSyncUntil) {
      wordmarkSyncRaf = runtime.requestAnimationFrame(pumpWordmarkSync);
    } else {
      wordmarkSyncRaf = null;
    }
  }

  // References `hoverCapable`, declared later in this script (~line
  // 830) — safe because this function is only ever CALLED at runtime
  // (from updatePeek()/resetPeek(), both themselves only invoked on
  // user interaction or from render(), which first runs at the very
  // end of this script), never during initial synchronous parse.
  function keepWordmarkSynced(ms = 500) {
    if (!hoverCapable || reduceMotionQuery.matches) return;
    wordmarkSyncUntil = Math.max(wordmarkSyncUntil, performance.now() + ms);
    if (wordmarkSyncRaf === null) {
      wordmarkSyncRaf = runtime.requestAnimationFrame(pumpWordmarkSync);
    }
  }

  api.revealWordmarkPhoto = revealWordmarkPhoto;
  api.syncWordmarkLayers = syncWordmarkLayers;
  api.keepWordmarkSynced = keepWordmarkSynced;
}
