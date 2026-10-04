import type { HomeContext } from './types';

/** Auto-advance timer, progress fill and the pause control. */
export function setupAutoplay(ctx: HomeContext): void {
  const { state, api, dom, runtime, galleries, reduceMotionQuery, phoneViewport } = ctx;
  const { root, hero, progressDashes, autoplayToggle, heroPhoto } = dom;

  // quick-260725-dcg (Fix 3): toggles the class that freezes/resumes
  // the current dash's fill (see .home.is-autoplay-paused in the
  // <style> block above) in lockstep with the 6000ms timer's own
  // running/stopped state.
  function setFillPaused(paused: boolean) {
    root!.classList.toggle('is-autoplay-paused', paused);
  }

  // Restarts the ::after fill animation from 0% on the freshly-current
  // dash: remove .is-filling from every dash, force a reflow, then add
  // it back only to the current one. The remove -> reflow -> add
  // sequence is required for the CSS animation to restart
  // deterministically (including on a fast double-navigation),
  // without relying on aria-current re-matching to retrigger it.
  function restartFill() {
    progressDashes.forEach((d) => d.classList.remove('is-filling'));
    const current = progressDashes[state.carouselIndex];
    if (!current) return;
    void current.offsetWidth;
    current.classList.add('is-filling');
  }

  function stopAutoAdvance() {
    if (state.timer) clearInterval(state.timer);
    state.timer = null;
    setFillPaused(true);
  }

  // D-09: auto-advance every 6000ms, paused on keyboard focus, resumed
  // on focusout — never paused permanently. HOME-11: the pointer
  // merely hovering the carousel no longer pauses it (mouseenter/
  // mouseleave listeners removed).
  function startAutoAdvance() {
    stopAutoAdvance();
    // CR-01: the phone-width guard must be checked here (the single
    // choke point every call site — bottom-of-script startup,
    // focusout, the autoplay toggle, showCarousel(), the
    // reduced-motion listener, and the manual-nav resumes in
    // goToPrev/goToNext/goToIndex — already funnels through) rather
    // than duplicated at each call site.
    if (
      state.autoAdvancePausedByUser ||
      phoneViewport.matches ||
      root!.dataset.displayMode !== 'carousel'
    )
      return;
    state.timer = runtime.setInterval(() => {
      state.carouselIndex = (state.carouselIndex + 1) % galleries.length;
      // quick-260803-bvu (Item 1): auto-advance must always look like
      // a plain crossfade, never the manual peek/drag slide — see the
      // `is-auto-snap` CSS comment and render()'s `forceCrossfade`
      // comment for the full diagnosis. `heroPhoto` is declared later
      // in this script but this callback only ever runs after the
      // whole script (including that declaration) has executed once,
      // via startAutoAdvance()'s own first call at the bottom.
      if (heroPhoto) {
        heroPhoto.classList.add('is-auto-snap');
        api.render(true);
        // Forces the un-eased transform reset to commit before
        // transitions are re-enabled below (same forced-reflow
        // pattern as .is-opening elsewhere in this file).
        void heroPhoto.offsetWidth;
        // quick-260803-bvu (Item 1): is-auto-snap must stay present
        // past render()'s own deferred crossfade (a 60ms delay, then
        // the 260ms opacity transition itself — see the
        // forceCrossfade branch inside render()). If it were removed
        // synchronously here instead, and the pointer is still
        // hovering, is-tracking would immediately reclaim the sharp
        // image's transition rule (it also sets `transition: none`)
        // and silently re-swallow the crossfade partway through.
        // Tradeoff, accepted: if the pointer happens to leave the
        // photo (a genuine mouseleave recede) within this ~400ms
        // window, that recede's own eased transform is forced
        // instant instead — a narrow, low-impact edge case, and only
        // for a single auto-advance tick's window.
        runtime.setTimeout(() => {
          heroPhoto!.classList.remove('is-auto-snap');
        }, 400);
      } else {
        api.render(true);
      }
    }, 6000);
    setFillPaused(false);
    restartFill();
  }

  function syncAutoplayControl() {
    if (!autoplayToggle) return;
    autoplayToggle.classList.toggle('is-paused', state.autoAdvancePausedByUser);
    autoplayToggle.setAttribute('aria-pressed', String(state.autoAdvancePausedByUser));
    autoplayToggle.setAttribute(
      'aria-label',
      state.autoAdvancePausedByUser
        ? (autoplayToggle.dataset.labelPlay ?? '')
        : (autoplayToggle.dataset.labelPause ?? ''),
    );
  }

  autoplayToggle?.addEventListener(
    'click',
    () => {
      state.hasUserChosenAutoplay = true;
      state.autoAdvancePausedByUser = !state.autoAdvancePausedByUser;
      syncAutoplayControl();
      if (state.autoAdvancePausedByUser) {
        stopAutoAdvance();
      } else {
        startAutoAdvance();
      }
    },
    { signal: runtime.signal },
  );

  reduceMotionQuery.addEventListener(
    'change',
    (event) => {
      if (state.hasUserChosenAutoplay) return;
      state.autoAdvancePausedByUser = event.matches;
      syncAutoplayControl();
      if (state.autoAdvancePausedByUser) stopAutoAdvance();
      else startAutoAdvance();
    },
    { signal: runtime.signal },
  );

  // CR-01: a resize/orientation change crossing the 767px breakpoint
  // (e.g. rotating a tablet, or a desktop window narrowed past it)
  // must (re)apply the phone-width gate live, not just at initial
  // load. startAutoAdvance() already no-ops if paused-by-user or
  // still below the breakpoint, so this is safe to call
  // unconditionally on the "now wider" transition.
  phoneViewport.addEventListener(
    'change',
    () => {
      if (phoneViewport.matches) stopAutoAdvance();
      else startAutoAdvance();
    },
    { signal: runtime.signal },
  );
  hero.addEventListener('focusin', stopAutoAdvance, { signal: runtime.signal });
  hero.addEventListener('focusout', startAutoAdvance, { signal: runtime.signal });

  api.setFillPaused = setFillPaused;
  api.restartFill = restartFill;
  api.stopAutoAdvance = stopAutoAdvance;
  api.startAutoAdvance = startAutoAdvance;
  api.syncAutoplayControl = syncAutoplayControl;
}
