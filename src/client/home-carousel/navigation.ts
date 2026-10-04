import { detectSwipeDirection } from '../../lib/home-carousel';
import type { HomeContext } from './types';

/** Prev/next navigation: dashes, arrow keys, swipe, tap-to-open. */
export function setupNavigation(ctx: HomeContext): void {
  const { state, api, dom, runtime, galleries, phoneViewport } = ctx;
  const { root, titleEl, progressDashes, heroPhoto } = dom;

  // quick-260725-dcg (Fix 3): resets the 6000ms countdown (and, via
  // startAutoAdvance()'s own setFillPaused/restartFill calls, re-syncs
  // the fill) on manual navigation — but only when auto-advance is
  // currently running (timer !== null). This preserves keyboard-focus
  // pause (the timer is null while focused, so manual nav won't
  // secretly restart auto-advance) and the explicit-pause state; when
  // paused, render()'s own restartFill() call still relocates the fill
  // to the new dash, but is-autoplay-paused keeps it frozen.
  function goToPrev() {
    state.carouselIndex = (state.carouselIndex - 1 + galleries.length) % galleries.length;
    api.render();
    if (state.timer !== null) api.startAutoAdvance();
  }

  function goToNext() {
    state.carouselIndex = (state.carouselIndex + 1) % galleries.length;
    api.render();
    if (state.timer !== null) api.startAutoAdvance();
  }

  function goToIndex(i: number) {
    if (i < 0 || i >= galleries.length || i === state.carouselIndex) return;
    state.carouselIndex = i;
    api.render();
    if (state.timer !== null) api.startAutoAdvance();
  }

  progressDashes.forEach((dash) => {
    dash.addEventListener(
      'click',
      () => {
        const i = Number(dash.dataset.index);
        if (!Number.isNaN(i)) goToIndex(i);
        // HOME-11 fallout fix: a mouse click on this <button> leaves it
        // holding DOM focus in Chromium, which — now that hover no
        // longer pauses/resumes (D-01) — would permanently freeze
        // auto-advance via the focusin/focusout pair (D-02) until the
        // user tabs elsewhere. `:focus-visible` distinguishes a real
        // keyboard-driven focus (kept, so D-02's Tab-in pause still
        // works) from this mouse-click focus (blurred immediately, so
        // the timer resumes via `focusout`).
        if (!dash.matches(':focus-visible')) dash.blur();
      },
      { signal: runtime.signal },
    );
  });
  // Direct request: arrow-key navigation, only while the carousel
  // (not the grid) is showing, and only when focus isn't inside a
  // form control elsewhere on the page (About/Contact share this
  // layout's header, and a stray ArrowLeft/ArrowRight while typing
  // in an <input> shouldn't hijack the carousel).
  document.addEventListener(
    'keydown',
    (event) => {
      // CR-01 (see IN-01): the dataset check alone never gates this off
      // on a phone, for the same reason startAutoAdvance() needed its
      // own explicit phoneViewport check above.
      if (root!.dataset.displayMode !== 'carousel' || phoneViewport.matches) return;
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goToPrev();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        goToNext();
      }
    },
    { signal: runtime.signal },
  );
  // Direct request: swipe support on mobile. touchstart/touchend
  // (not touchmove) — only the net horizontal distance matters, and
  // this avoids fighting the browser's own vertical scroll handling
  // mid-gesture. Horizontal delta must clearly exceed vertical delta
  // (SWIPE_DIRECTION_RATIO) before it's treated as a swipe, so an
  // intentional vertical scroll over the hero never triggers a
  // gallery change.
  const SWIPE_MIN_DISTANCE = 50;
  const SWIPE_DIRECTION_RATIO = 1.5;
  let touchStartX = 0;
  let touchStartY = 0;
  heroPhoto?.addEventListener(
    'touchstart',
    (event) => {
      const touch = event.changedTouches[0];
      if (!touch) return;
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
    },
    { passive: true, signal: runtime.signal },
  );
  // quick-260726-u97: mobile tap-to-open — extends this SAME handler
  // (not a second touch listener) so it composes cleanly with the
  // swipe it already detects. A genuine tap (negligible movement on
  // both axes) opens the current gallery; a real horizontal swipe
  // navigates (unchanged, above); a vertical scroll-drag (large
  // deltaY) is neither, so it correctly does nothing — a tap never
  // fires mid-swipe and never hijacks a vertical scroll.
  const TAP_MAX_MOVEMENT = 10;
  heroPhoto?.addEventListener(
    'touchend',
    (event) => {
      // D-11 (20-REVIEW.md CR-01): a tap that bubbles up from a caption
      // control — a progress dash or the autoplay toggle — must not be
      // reinterpreted as a tap-to-open. Mirrors the existing desktop
      // click handler's own .home-hero__caption exclusion below. This
      // guard belongs HERE (not in the new mobile scroll deck) because
      // this handler stays live for touchscreen tablets at 768px and
      // wider (phase success criterion 5).
      const target = event.target as HTMLElement | null;
      if (target?.closest('.home-hero__caption')) return;
      const touch = event.changedTouches[0];
      if (!touch) return;
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      const direction = detectSwipeDirection(
        deltaX,
        deltaY,
        SWIPE_MIN_DISTANCE,
        SWIPE_DIRECTION_RATIO,
      );
      if (direction === 'next') {
        goToNext();
        return;
      }
      if (direction === 'prev') {
        goToPrev();
        return;
      }
      if (Math.abs(deltaX) <= TAP_MAX_MOVEMENT && Math.abs(deltaY) <= TAP_MAX_MOVEMENT) {
        openCurrent();
      }
    },
    { passive: true, signal: runtime.signal },
  );
  // D3: reuses the current slide's title link — its href AND its
  // existing click listener (which already calls setCrossDocPhoto())
  // — rather than duplicating routing or morph-naming. Works
  // identically on desktop (center-zone click) and touch (tap-to-open
  // above). The `opening` guard is the only re-entrancy protection
  // this feature needs: on a hybrid touchscreen-laptop a tap can fire
  // BOTH touchend (tap-to-open) and a synthesized click (desktop
  // center-open click handler below), and native navigation must not
  // be triggered twice.
  function openCurrent() {
    if (state.opening) return;
    state.opening = true;
    if (heroPhoto) {
      // Synchronous, un-eased reset (via .is-opening disabling the
      // transition below, plus the forced reflow) so the outgoing
      // cross-document `hero-photo` View Transition snapshot captures
      // the photo at rest, never mid-push, even if an edge-peek
      // parallax was still easing back when this fired.
      heroPhoto.classList.add('is-state.opening');
      heroPhoto.style.setProperty('--peek-shift', '0');
      void heroPhoto.offsetWidth;
    }
    if (titleEl) {
      titleEl.click();
    } else {
      const fallbackHref = galleries[state.carouselIndex]?.href;
      if (fallbackHref) window.location.href = fallbackHref;
    }
  }

  api.goToPrev = goToPrev;
  api.goToNext = goToNext;
  api.goToIndex = goToIndex;
  api.openCurrent = openCurrent;
}
