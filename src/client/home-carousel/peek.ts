import { computeHoverZone } from '../../lib/home-carousel';
import type { HomeContext } from './types';

/** Desktop hover cursor, edge peek and the edge-click commit. */
export function setupPeek(ctx: HomeContext): void {
  const { state, api, dom, runtime, galleries, reduceMotionQuery, hoverCapable } = ctx;
  const { heroPhoto } = dom;

  const EDGE_ZONE_FRACTION = 0.22;
  const PEEK_MAX_PUSH_FRACTION = 0.16;
  function resetPeek() {
    if (!heroPhoto) return;
    heroPhoto.style.setProperty('--peek-shift', '0');
    if (dom.peekPrev) dom.peekPrev.style.transform = 'translateX(-100%)';
    if (dom.peekNext) dom.peekNext.style.transform = 'translateX(100%)';
    // quick-260727-iao: a synchronous snap (not just the eased rAF
    // pump below) so a post-swap reset under .is-opening lands the
    // seam on the current-full extreme immediately, with no stale
    // peek frame left over from before the swap. lastPeekZone is
    // deliberately left as-is (not reset here) so a genuine
    // mouseleave recede eases the seam toward the SAME extreme the
    // photo is also receding toward, in sync.
    api.syncWordmarkLayers();
    // quick-260727-bsm (Bug A): the mouseleave recede AND every
    // render() swap (render() calls resetPeek() in its hoverCapable
    // block) both change the photo's transform — keep the wordmark
    // synced through the ease-settle here too.
    api.keepWordmarkSynced();
  }

  // quick-260726-u97 (sketch 008 Variant C, exact sketch coefficients):
  // ports the sketch's parallax-push math directly — current photo
  // pushes at most 16% of its own width, prev/next slide in at a
  // full 100% rate, so the adjacent layer always covers the vacated
  // gap (no background ever shows through).
  function updatePeek() {
    if (!heroPhoto) return;
    if (reduceMotionQuery.matches) {
      // Decorative only — reduced-motion visitors get no parallax
      // (the cursor's own arrow still signals direction).
      resetPeek();
      return;
    }
    if (state.currentZone === 'left') {
      state.lastPeekZone = 'left';
      heroPhoto.style.setProperty(
        '--peek-shift',
        `${state.currentProximity * PEEK_MAX_PUSH_FRACTION * 100}%`,
      );
      if (dom.peekPrev)
        dom.peekPrev.style.transform = `translateX(${-100 + state.currentProximity * 100}%)`;
      if (dom.peekNext) dom.peekNext.style.transform = 'translateX(100%)';
    } else if (state.currentZone === 'right') {
      state.lastPeekZone = 'right';
      heroPhoto.style.setProperty(
        '--peek-shift',
        `${-state.currentProximity * PEEK_MAX_PUSH_FRACTION * 100}%`,
      );
      if (dom.peekNext)
        dom.peekNext.style.transform = `translateX(${100 - state.currentProximity * 100}%)`;
      if (dom.peekPrev) dom.peekPrev.style.transform = 'translateX(-100%)';
    } else {
      resetPeek();
      return;
    }
    // quick-260727-bsm (Bug A): covers the active-mousemove push AND
    // the retarget-then-settle — 500ms comfortably exceeds the 420ms
    // transform transition so the sync loop keeps running through the
    // ease after the mouse stops moving. The `resetPeek()` branch
    // above already calls this itself (and returns before reaching
    // here), so this only fires for the left/right push branches.
    api.keepWordmarkSynced();
  }

  // quick-260727-bsm (Bug C — abrupt edge-click pop): an edge-zone
  // CLICK used to swap heroImg.src synchronously via goToPrev()/
  // goToNext() while the photo was still at its peek-pushed offset,
  // then resetPeek() eased it back in the WRONG direction relative to
  // the peek the user just watched — an abrupt "pop". This instead
  // continues the in-progress peek to a FULL slide (easing from
  // wherever the current proximity left off, not resetting first),
  // then swaps content synchronously (transitions disabled via the
  // existing .is-opening class) once the peek layer has fully arrived
  // — at that instant the incoming photo sits at translateX(0),
  // exactly where the outgoing heroImg (now advanced) will render, so
  // the swap is pixel-coincident with no pop, no third-image flash,
  // and no directional reversal. Only the desktop edge-zone CLICK
  // path uses this — keyboard/dash/swipe/auto-advance keep calling
  // goToPrev()/goToNext()/goToIndex() directly, unchanged.
  function commitEdge(direction: 'prev' | 'next') {
    if (state.committing || state.opening) return;
    if (!heroPhoto || reduceMotionQuery.matches) {
      // No peek to continue (reduced-motion never shows one, and
      // without heroPhoto there's nothing to animate) — the plain
      // swap is correct here.
      if (direction === 'next') api.goToNext();
      else api.goToPrev();
      return;
    }
    state.committing = true;
    const photo = heroPhoto;

    // quick-260727-drq (Bug 1): removed BEFORE setting the full-slide
    // targets below so the edge-click commit re-engages the 420ms
    // ease (a discrete moment, not continuous tracking).
    photo.classList.remove('is-tracking');

    // quick-260727-iao: g04's commit-time has-wordmark-photo/
    // --wordmark-photo removal is RETIRED — with the mirrored-peek
    // three-layer stack (Task 2/3) there is always a correct photo to
    // show at every proximity (the active peek layer's own
    // independently-clamped crop), so the "give up and go solid
    // because the drq clamp froze the single old layer" failure mode
    // this used to work around no longer exists. has-wordmark-photo
    // now stays present continuously through the commit (the normal,
    // cached-adjacent-photo case never toggles it at all); the seam
    // is what visibly slides instead. render()'s own start-of-swap
    // has-wordmark-photo removal (the genuine loading/error fallback
    // for an uncached hero) is untouched below.
    state.lastPeekZone = direction === 'next' ? 'right' : 'left';

    if (direction === 'next') {
      photo.style.setProperty('--peek-shift', '-100%');
      if (dom.peekNext) dom.peekNext.style.transform = 'translateX(0)';
    } else {
      photo.style.setProperty('--peek-shift', '100%');
      if (dom.peekPrev) dom.peekPrev.style.transform = 'translateX(0)';
    }
    // quick-260727-iao: the wordmark cutout is visible (not solid ink)
    // throughout the commit now, so the sync pump is meaningful again
    // — it drives the seam continuously from the LIVE
    // heroImg.getBoundingClientRect() through the ~420ms eased slide,
    // mirroring the photo's own peek layers sliding in underneath.
    api.keepWordmarkSynced(500);

    const relevantLayer = direction === 'next' ? dom.peekNext : dom.peekPrev;
    let done = false;
    let fallbackTimer: number | null = null;

    // Single-shot: guarded by `done` so transitionend and the
    // fallback timer can never both run it.
    function finish() {
      if (done) return;
      done = true;
      relevantLayer?.removeEventListener('transitionend', onTransitionEnd);
      if (fallbackTimer !== null) clearTimeout(fallbackTimer);
      // Synchronous, un-eased swap under .is-opening (reuses the
      // existing openCurrent()/View-Transition-snapshot transition-
      // disable rule) — advance the index, render() (swaps
      // heroImg.src to the now-cached, already-loaded adjacent photo:
      // instant showSharp, no fade — and resetPeek()s the layers to
      // neutral, all un-eased), force a reflow, then remove
      // .is-opening.
      photo.classList.add('is-state.opening');
      state.carouselIndex =
        direction === 'next'
          ? (state.carouselIndex + 1) % galleries.length
          : (state.carouselIndex - 1 + galleries.length) % galleries.length;
      api.render();
      void photo.offsetWidth;
      photo.classList.remove('is-state.opening');
      state.committing = false;
      // quick-260727-fc2: re-arm the continuous-tracking class once
      // the commit has fully settled. commitEdge() removed it above
      // (before setting its full-slide targets) for the discrete
      // commit itself, but never re-added it — so without this, every
      // peek AFTER the first edge-click commit in a single continuous
      // hover session reverted to the eased CSS transition,
      // reintroducing Bug 1's Safari transition-retarget jitter.
      // Guarded by the live hover signal (.is-cursor-active, added on
      // mouseenter / removed on mouseleave) so tracking is never left
      // armed while the pointer has actually left the photo during
      // the commit window.
      if (photo.classList.contains('is-cursor-active')) {
        photo.classList.add('is-tracking');
      }
      if (state.timer !== null) api.startAutoAdvance();
    }

    function onTransitionEnd(event: TransitionEvent) {
      if (event.propertyName !== 'transform') return;
      finish();
    }

    relevantLayer?.addEventListener('transitionend', onTransitionEnd, { signal: runtime.signal });
    // 420ms transition + slack — guarantees finish() always runs even
    // if the transitionend event never fires (e.g. a null layer).
    fallbackTimer = runtime.setTimeout(finish, 480);
  }
  if (hoverCapable && heroPhoto) {
    const cursorEl = heroPhoto.querySelector<HTMLElement>('[data-role="hero-cursor"]');
    dom.peekPrev = heroPhoto.querySelector<HTMLImageElement>('[data-role="peek-prev"]');
    dom.peekNext = heroPhoto.querySelector<HTMLImageElement>('[data-role="peek-next"]');

    heroPhoto.addEventListener(
      'mousemove',
      (event) => {
        // quick-260727-bsm (Bug C): a stray move mid-commit must not
        // rewrite --peek-shift and fight the in-progress full-slide
        // animation commitEdge() is driving.
        if (state.committing) return;
        const rect = heroPhoto.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        if (cursorEl) {
          cursorEl.style.transform = `translate(${x}px, ${y}px)`;
        }
        // quick-260803-bvu (Item 2): the progress dashes and the
        // pause/play toggle live inside .home-hero__caption, which sits
        // inside the left EDGE_ZONE_FRACTION band — so the accent
        // directional pill (.home-hero__cursor-ring, z-index 4) was
        // painting directly over them. is-over-controls (CSS below)
        // hides the custom cursor whenever the pointer is over the
        // caption and this skips the peek push entirely, restoring an
        // unobstructed hit area with the controls' own native pointer
        // cursor (.home-hero__progress-dash/.home-hero__autoplay-toggle
        // already set `cursor: pointer` explicitly, confirmed live —
        // that part was never broken, only the visual overlap was).
        const target = event.target as HTMLElement | null;
        const overControls = !!target?.closest('.home-hero__caption');
        heroPhoto.classList.toggle('is-over-controls', overControls);
        if (overControls) {
          state.currentZone = 'center';
          state.currentProximity = 0;
          if (cursorEl) {
            cursorEl.dataset.zone = 'center';
          }
          resetPeek();
          return;
        }
        const { zone, proximity } = computeHoverZone(x / rect.width, EDGE_ZONE_FRACTION);
        state.currentZone = zone;
        state.currentProximity = proximity;
        if (cursorEl) {
          cursorEl.dataset.zone = zone;
        }
        updatePeek();
      },
      { signal: runtime.signal },
    );

    heroPhoto.addEventListener(
      'mouseenter',
      () => {
        heroPhoto.classList.add('is-cursor-active');
        // quick-260727-drq (Bug 1): arms the instant, un-eased peek
        // transform for the whole hover — removed only right before the
        // two discrete moments (mouseleave's resetPeek() below, and
        // commitEdge()'s full-slide targets) so those keep the 420ms
        // ease.
        heroPhoto.classList.add('is-tracking');
      },
      { signal: runtime.signal },
    );

    heroPhoto.addEventListener(
      'mouseleave',
      () => {
        heroPhoto.classList.remove('is-cursor-active');
        // quick-260803-bvu (Item 2): belt-and-braces — a mouseleave that
        // fires while the pointer was last over the caption (a fast
        // exit can skip an intermediate mousemove) must not leave the
        // cursor permanently hidden for the next hover session.
        heroPhoto.classList.remove('is-over-controls');
        state.currentZone = 'center';
        state.currentProximity = 0;
        if (cursorEl) {
          cursorEl.dataset.zone = 'center';
        }
        // quick-260727-drq (Bug 1): removed BEFORE resetPeek() below so
        // the recede back to neutral re-engages the 420ms ease.
        heroPhoto.classList.remove('is-tracking');
        // quick-260727-bsm (Bug C): a commit already in flight owns the
        // peek layers' animation to full-slide — resetting them here
        // would fight it. finish()'s own render()->resetPeek() call
        // handles the neutral reset once the commit completes.
        if (!state.committing) resetPeek();
      },
      { signal: runtime.signal },
    );

    // Desktop click: center zone opens the current gallery, edge
    // zones commit the in-progress peek to a full slide then swap
    // (commitEdge — Bug C). Clicks inside .home-hero__caption are
    // ignored so the title link, progress dashes, and autoplay toggle
    // keep their own existing handlers — they must never be hijacked
    // by zone navigation.
    heroPhoto.addEventListener(
      'click',
      (event) => {
        if (state.committing || state.opening) return;
        const target = event.target as HTMLElement;
        if (target.closest('.home-hero__caption')) return;
        if (state.currentZone === 'left') {
          commitEdge('prev');
        } else if (state.currentZone === 'right') {
          commitEdge('next');
        } else {
          api.openCurrent();
        }
      },
      { signal: runtime.signal },
    );
  }

  api.resetPeek = resetPeek;
  api.updatePeek = updatePeek;
  api.commitEdge = commitEdge;
}
