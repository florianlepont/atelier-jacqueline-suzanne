import {
  computeHoverZone,
  computeWordmarkBackgroundPosition,
  computeWordmarkSeamFraction,
  detectSwipeDirection,
  pickRandomGalleryIndex,
  wordmarkPhotoFilter,
} from '../lib/home-carousel';
import {resolveAutomaticAccent} from '../lib/site-config';

export interface HomeRuntimeScope {
  readonly signal: AbortSignal;
  setTimeout(callback: () => void, delay: number): number;
  setInterval(callback: () => void, delay: number): number;
  requestAnimationFrame(callback: FrameRequestCallback): number;
  addCleanup(callback: () => void): void;
}

interface GalleryEntry {
  slug: string;
  title: string;
  heroSrc: string;
  heroSrcSet: string;
  blurSrc: string;
  alt: string;
  statement: string;
  href: string;
  heroColor?: string;
  heroTextColor?: string;
}

function createRuntimeScope() {
  const controller = new AbortController();
  const timeouts = new Set<number>();
  const intervals = new Set<number>();
  const frames = new Set<number>();
  const cleanups = new Set<() => void>();
  let active = true;

  const scope: HomeRuntimeScope = {
    signal: controller.signal,
    setTimeout(callback, delay) {
      const id = window.setTimeout(() => {
        timeouts.delete(id);
        if (active) callback();
      }, delay);
      timeouts.add(id);
      return id;
    },
    setInterval(callback, delay) {
      const id = window.setInterval(() => {
        if (active) callback();
      }, delay);
      intervals.add(id);
      return id;
    },
    requestAnimationFrame(callback) {
      const id = window.requestAnimationFrame((timestamp) => {
        frames.delete(id);
        if (active) callback(timestamp);
      });
      frames.add(id);
      return id;
    },
    addCleanup(callback) {
      cleanups.add(callback);
    },
  };

  return {
    scope,
    cleanup() {
      if (!active) return;
      active = false;
      controller.abort();
      timeouts.forEach((id) => window.clearTimeout(id));
      intervals.forEach((id) => window.clearInterval(id));
      frames.forEach((id) => window.cancelAnimationFrame(id));
      cleanups.forEach((callback) => callback());
      timeouts.clear();
      intervals.clear();
      frames.clear();
      cleanups.clear();
    },
  };
}

/** Mounts the desktop/tablet homepage controller and returns an idempotent cleanup. */
export function mountDesktopHomeCarousel(root: HTMLElement): () => void {
  const runtimeScope = createRuntimeScope();
  const runtime = runtimeScope.scope;
  const hero = root.querySelector<HTMLElement>('[data-role="home-carousel"]');
  const grid = root.querySelector<HTMLElement>('[data-role="home-grid"]');
  const dataEl = root.querySelector<HTMLUListElement>('ul[data-role="home-carousel-data"]');
  let active = true;

  if (!hero || !grid || !dataEl) {
    runtimeScope.cleanup();
    return () => undefined;
  }

  root.dataset.runtimeActive = 'desktop';

  const galleries: GalleryEntry[] = Array.from(dataEl.querySelectorAll('li')).map((li) => ({
    slug: li.dataset.slug ?? '',
    title: li.dataset.title ?? '',
    heroSrc: li.dataset.heroSrc ?? '',
    heroSrcSet: li.dataset.heroSrcset ?? '',
    blurSrc: li.dataset.blurSrc ?? '',
    alt: li.dataset.alt ?? '',
    statement: li.dataset.statement ?? '',
    href: li.dataset.href ?? '',
    heroColor: li.dataset.heroColor || undefined,
    heroTextColor: li.dataset.heroTextColor || undefined,
  }));

  // 260825-hl7 (bug 2): the automatic accent palette used to be a local
  // array here (cycling generically via index % ACCENTS.length — RESEARCH.md
  // Open Question 3, written for N galleries, not hardcoded to 2). It now
  // lives once in src/lib/site-config.ts (resolveAutomaticAccent) so the
  // gallery detail page's build-time accent fallback resolves the exact
  // same value for the exact same homepage index — see that module's own
  // doc comment for the full rationale.
  const heroImg = hero.querySelector<HTMLImageElement>('[data-role="hero-image"]');
  const heroPlaceholderImg = hero.querySelector<HTMLImageElement>('[data-role="hero-image-placeholder"]');
  const indexLabel = hero.querySelector<HTMLElement>('[data-role="index-label"]');
  const titleEl = hero.querySelector<HTMLElement>('[data-role="gallery-title"]');
  const accentPanel = hero.querySelector<HTMLElement>('[data-role="accent-panel"]');
  const wordmarkEl = hero.querySelector<HTMLElement>('.home-hero__wordmark');
  // quick-260727-iao: the mirrored-peek wordmark stack — all nullable,
  // no-op safe if the markup is ever missing.
  const wordmarkStackEl = hero.querySelector<HTMLElement>('.home-hero__wordmark-stack');
  const wordmarkPeekPrevEl = hero.querySelector<HTMLElement>('.home-hero__wordmark-peek--prev');
  const wordmarkPeekNextEl = hero.querySelector<HTMLElement>('.home-hero__wordmark-peek--next');
  const progressDashes = Array.from(hero.querySelectorAll<HTMLButtonElement>('[data-role="progress"] .home-hero__progress-dash'));
  const autoplayToggle = hero.querySelector<HTMLButtonElement>('[data-role="autoplay-toggle"]');

  // Grid tiles are server-rendered once and never re-rendered by
  // render(); their listeners belong to this desktop lifecycle.
  const gridTileImgs = Array.from(root.querySelectorAll<HTMLImageElement>('.home-grid__tile-img--sharp'));
  gridTileImgs.forEach((img) => {
    if (img.complete) {
      showSharp(img);
    } else {
      img.addEventListener('load', () => showSharp(img), { once: true, signal: runtime.signal });
      // A failed fetch never fires 'load' — without this, a broken image
      // leaves the tile stuck on its blurred placeholder forever.
      img.addEventListener('error', () => showSharp(img), { once: true, signal: runtime.signal });
    }
  });

  // quick-260724-uf5 (sketch 006): the SOURCE side of the homepage ->
  // gallery-detail cross-document photo morph. Assign the name at
  // click time and leave it in place. Harmless on browsers without
  // cross-document View
  // Transitions support: this is a plain style write, no
  // preventDefault, no manual navigation — every homepage -> gallery
  // link is a real <a href>, so unsupported browsers just navigate
  // normally.
  let namedCrossDocPhoto: HTMLElement | null = null;
  function setCrossDocPhoto(img: HTMLElement) {
    // Clearing any previously-named element first guarantees only ONE
    // element ever carries `hero-photo` at a time — important because
    // inline names survive back/forward bfcache restores, and a user
    // could otherwise leave a grid tile named, go back, switch to
    // carousel or another tile, and end up with two elements sharing
    // `hero-photo`, which is invalid and would silently skip the
    // transition.
    if (namedCrossDocPhoto && namedCrossDocPhoto !== img) {
      namedCrossDocPhoto.style.viewTransitionName = '';
    }
    img.style.viewTransitionName = 'hero-photo';
    namedCrossDocPhoto = img;
  }

  // Carousel title: names the current slide's sharp photo immediately
  // before the browser's default link navigation proceeds.
  if (titleEl && heroImg) {
    titleEl.addEventListener('click', () => setCrossDocPhoto(heroImg), { signal: runtime.signal });
  }

  // Grid tiles: attaching to each tile's parent `.home-grid__tile`
  // link and naming THAT tile's own sharp img means a click anywhere
  // on the tile names exactly the right photo. setCrossDocPhoto
  // clears the prior name first, so only the just-clicked tile
  // carries `hero-photo`.
  gridTileImgs.forEach((img) => {
    const tile = img.closest('.home-grid__tile');
    if (tile) {
      tile.addEventListener('click', () => setCrossDocPhoto(img), { signal: runtime.signal });
    }
  });

  let carouselIndex = 0;
  let timer: number | null = null;
  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  // Kept as a defensive guard in addition to the outer desktop mount.
  const phoneViewport = window.matchMedia('(max-width: 767px)');
  let autoAdvancePausedByUser = reduceMotionQuery.matches;
  let hasUserChosenAutoplay = false;
  // Cancels the previous render()'s pending hero load/error listeners so
  // rapid swaps (fast clicks/swipes) don't stack up never-fired 'load'
  // listeners on heroImg (each abandoned request never fires 'load').
  let pendingHeroLoadCtrl: AbortController | null = null;

  function showSharp(img: HTMLImageElement) {
    img.classList.add('is-loaded');
  }

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
  let lastPeekZone: 'left' | 'right' = 'right';

  // Extends (does not replace) syncWordmarkAlignment()'s current-layer
  // math: also feeds the active peek layer its own independent crop
  // via the SAME pure computeWordmarkBackgroundPosition(), and derives
  // the live seam fraction from heroImg's LIVE edge via
  // computeWordmarkSeamFraction() — mirroring exactly how the photo's
  // own peekPrev/peekNext layers are positioned relative to heroImg.
  function syncWordmarkLayers() {
    syncWordmarkAlignment();
    if (!wordmarkStackEl || !wordmarkEl || !heroImg) return;
    const zone = lastPeekZone;
    const peekImg = zone === 'right' ? peekNext : peekPrev;
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
    const seam = computeWordmarkSeamFraction(zone, heroRect.left, heroRect.right, wmRect.left, wmRect.width);
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

  // quick-260803-bvu (Item 1): `forceCrossfade` is opt-in, defaulting
  // to false so every existing caller (dash click, keyboard, swipe)
  // keeps today's exact behavior. Only the auto-advance tick below
  // passes true. See the sync-branch comment for the full diagnosis
  // of why a genuine short delay (not just a forced reflow) is
  // needed for the crossfade to actually play once the next photo
  // is already cached.
  function render(forceCrossfade = false) {
    const gallery = galleries[carouselIndex];
    if (!gallery) return;
    // The clipped wordmark has no visible glyph fill until its photo
    // exists. Return to the solid inherited text fallback for every
    // swap, then opt into the cutout only after the active sharp hero
    // has loaded successfully. This keeps the title readable while
    // the independent blur placeholder is the only painted image.
    root!.classList.remove('has-wordmark-photo');
    root!.style.setProperty('--wordmark-photo', 'none');
    const fallbackAccent = resolveAutomaticAccent(carouselIndex);
    const accent = gallery.heroColor
      ? { bg: gallery.heroColor, text: gallery.heroTextColor ?? 'var(--color-on-accent)' }
      : fallbackAccent;
    if (heroImg && heroPlaceholderImg) {
      heroPlaceholderImg.src = gallery.blurSrc;
      heroImg.classList.remove('is-loaded'); // Pitfall 3: must precede src reassignment
      heroImg.srcset = gallery.heroSrcSet;
      heroImg.sizes = '100vw';
      heroImg.src = gallery.heroSrc;
      heroImg.alt = gallery.alt;
      // Abort the previous render()'s pending listeners first — a superseded
      // request never fires 'load', so without this, rapid swaps stack up
      // never-fired { once: true } listeners on heroImg indefinitely.
      pendingHeroLoadCtrl?.abort();
      if (heroImg.complete) {
        if (forceCrossfade) {
          // quick-260803-bvu (Item 1): once the next photo is already
          // cached (the common case, thanks to the D-05 preload
          // below), `is-loaded` gets removed then re-added within the
          // very same synchronous call — confirmed live (via
          // getComputedStyle sampling every 15-40ms across a real
          // swap, and via isolated remove/re-add experiments) that
          // NEITHER a forced layout read (`offsetWidth`) NOR even a
          // double-rAF wait gives the browser enough genuine elapsed
          // time to register the "unloaded" (opacity: 0) state before
          // the re-add retargets it back to 1 — the two writes
          // collapse into a no-op and the 260ms crossfade never
          // visibly plays. Only a real, if brief, elapsed-time delay
          // reliably retriggers it (confirmed: 60ms reliably produces
          // a full, visible fade across repeated runs). The blurred
          // placeholder (already reassigned above) is on screen for
          // this whole window, so the delay is invisible — it only
          // defers the SHARP layer's own fade-in, which is exactly
          // the situation the blur-up mechanic (HOME-09) exists for.
          runtime.setTimeout(() => {
            showSharp(heroImg);
            if (heroImg.naturalWidth > 0) {
              revealWordmarkPhoto();
            }
          }, 60);
        } else {
          showSharp(heroImg);
          if (heroImg.naturalWidth > 0) {
            revealWordmarkPhoto();
          }
        }
      } else {
        pendingHeroLoadCtrl = new AbortController();
        const onLoad = () => {
          showSharp(heroImg);
          revealWordmarkPhoto();
        };
        const onError = () => showSharp(heroImg);
        // 'error' covers a failed fetch (bad asset, transient CDN issue) —
        // without it the hero stays stuck on the blurred placeholder forever.
        heroImg.addEventListener('load', onLoad, { once: true, signal: pendingHeroLoadCtrl.signal });
        heroImg.addEventListener('error', onError, { once: true, signal: pendingHeroLoadCtrl.signal });
      }
    }
    if (indexLabel) {
      indexLabel.textContent = `${String(carouselIndex + 1).padStart(2, '0')} / ${String(galleries.length).padStart(2, '0')}`;
    }
    if (titleEl) {
      titleEl.textContent = gallery.title.toUpperCase();
      titleEl.setAttribute('href', gallery.href);
    }
    if (accentPanel) {
      accentPanel.style.color = accent.text;
    }
    root!.style.setProperty('--current-accent', accent.bg);
    root!.style.setProperty('--current-accent-text', accent.text);
    root!.style.setProperty('--wordmark-photo-filter', wordmarkPhotoFilter(accent.text));
    progressDashes.forEach((dash, i) => {
      dash.setAttribute('aria-current', i === carouselIndex ? 'true' : 'false');
    });
    restartFill();

    // D-05: warm the browser's HTTP cache for the next gallery's hero
    // photo so the crossfade above resolves near-instantly by the time
    // the next auto-advance/prev/next/toggle swap actually happens.
    const nextIndex = (carouselIndex + 1) % galleries.length;
    const nextSrc = galleries[nextIndex]?.heroSrc;
    if (nextSrc) {
      const preload = new Image();
      preload.srcset = galleries[nextIndex]?.heroSrcSet ?? '';
      preload.sizes = '100vw';
      preload.src = nextSrc;
    }

    // quick-260726-u97 (sketch 008 Variant C): keeps the peek layers'
    // sources tracking the CURRENT slide's real neighbours on every
    // swap (auto-advance, dash click, arrow keys, swipe) — forward
    // references to hoverCapable/peekPrev/peekNext/resetPeek are safe:
    // render() is first invoked at the very end of this script, after
    // those declarations have already executed. Guarded on
    // hoverCapable so touch skips the extra image loads entirely.
    if (hoverCapable) {
      const prevGallery = galleries[(carouselIndex - 1 + galleries.length) % galleries.length];
      const nextGallery = galleries[nextIndex];
      if (peekPrev && prevGallery) {
        peekPrev.src = prevGallery.heroSrc;
        peekPrev.srcset = prevGallery.heroSrcSet;
        peekPrev.sizes = '100vw';
      }
      if (peekNext && nextGallery) {
        peekNext.src = nextGallery.heroSrc;
        peekNext.srcset = nextGallery.heroSrcSet;
        peekNext.sizes = '100vw';
      }
      resetPeek();
    }
  }

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
    const current = progressDashes[carouselIndex];
    if (!current) return;
    void current.offsetWidth;
    current.classList.add('is-filling');
  }

  function stopAutoAdvance() {
    if (timer) clearInterval(timer);
    timer = null;
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
    if (autoAdvancePausedByUser || phoneViewport.matches || root!.dataset.displayMode !== 'carousel') return;
    timer = runtime.setInterval(() => {
      carouselIndex = (carouselIndex + 1) % galleries.length;
      // quick-260803-bvu (Item 1): auto-advance must always look like
      // a plain crossfade, never the manual peek/drag slide — see the
      // `is-auto-snap` CSS comment and render()'s `forceCrossfade`
      // comment for the full diagnosis. `heroPhoto` is declared later
      // in this script but this callback only ever runs after the
      // whole script (including that declaration) has executed once,
      // via startAutoAdvance()'s own first call at the bottom.
      if (heroPhoto) {
        heroPhoto.classList.add('is-auto-snap');
        render(true);
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
        render(true);
      }
    }, 6000);
    setFillPaused(false);
    restartFill();
  }

  function syncAutoplayControl() {
    if (!autoplayToggle) return;
    autoplayToggle.classList.toggle('is-paused', autoAdvancePausedByUser);
    autoplayToggle.setAttribute('aria-pressed', String(autoAdvancePausedByUser));
    autoplayToggle.setAttribute(
      'aria-label',
      autoAdvancePausedByUser
        ? autoplayToggle.dataset.labelPlay ?? ''
        : autoplayToggle.dataset.labelPause ?? '',
    );
  }

  autoplayToggle?.addEventListener('click', () => {
    hasUserChosenAutoplay = true;
    autoAdvancePausedByUser = !autoAdvancePausedByUser;
    syncAutoplayControl();
    if (autoAdvancePausedByUser) {
      stopAutoAdvance();
    } else {
      startAutoAdvance();
    }
  }, { signal: runtime.signal });

  reduceMotionQuery.addEventListener('change', (event) => {
    if (hasUserChosenAutoplay) return;
    autoAdvancePausedByUser = event.matches;
    syncAutoplayControl();
    if (autoAdvancePausedByUser) stopAutoAdvance();
    else startAutoAdvance();
  }, { signal: runtime.signal });

  // CR-01: a resize/orientation change crossing the 767px breakpoint
  // (e.g. rotating a tablet, or a desktop window narrowed past it)
  // must (re)apply the phone-width gate live, not just at initial
  // load. startAutoAdvance() already no-ops if paused-by-user or
  // still below the breakpoint, so this is safe to call
  // unconditionally on the "now wider" transition.
  phoneViewport.addEventListener('change', () => {
    if (phoneViewport.matches) stopAutoAdvance();
    else startAutoAdvance();
  }, { signal: runtime.signal });

  function showCarousel() {
    root!.dataset.displayMode = 'carousel';
    hero!.hidden = false;
    grid!.hidden = true;
    startAutoAdvance();
  }

  function showGrid() {
    root!.dataset.displayMode = 'grid';
    hero!.hidden = true;
    grid!.hidden = false;
    stopAutoAdvance();
    // quick-260726-u97: a lingering peek can't survive a mode switch
    // (forward reference, safe — see render()'s own call above).
    if (hoverCapable) resetPeek();
  }

  hero.addEventListener('focusin', stopAutoAdvance, { signal: runtime.signal });
  hero.addEventListener('focusout', startAutoAdvance, { signal: runtime.signal });

  // quick-260725-dcg (Fix 3): resets the 6000ms countdown (and, via
  // startAutoAdvance()'s own setFillPaused/restartFill calls, re-syncs
  // the fill) on manual navigation — but only when auto-advance is
  // currently running (timer !== null). This preserves keyboard-focus
  // pause (the timer is null while focused, so manual nav won't
  // secretly restart auto-advance) and the explicit-pause state; when
  // paused, render()'s own restartFill() call still relocates the fill
  // to the new dash, but is-autoplay-paused keeps it frozen.
  function goToPrev() {
    carouselIndex = (carouselIndex - 1 + galleries.length) % galleries.length;
    render();
    if (timer !== null) startAutoAdvance();
  }

  function goToNext() {
    carouselIndex = (carouselIndex + 1) % galleries.length;
    render();
    if (timer !== null) startAutoAdvance();
  }

  function goToIndex(i: number) {
    if (i < 0 || i >= galleries.length || i === carouselIndex) return;
    carouselIndex = i;
    render();
    if (timer !== null) startAutoAdvance();
  }

  progressDashes.forEach((dash) => {
    dash.addEventListener('click', () => {
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
    }, { signal: runtime.signal });
  });

  // Direct request: arrow-key navigation, only while the carousel
  // (not the grid) is showing, and only when focus isn't inside a
  // form control elsewhere on the page (About/Contact share this
  // layout's header, and a stray ArrowLeft/ArrowRight while typing
  // in an <input> shouldn't hijack the carousel).
  document.addEventListener('keydown', (event) => {
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
  }, { signal: runtime.signal });

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
  const heroPhoto = hero.querySelector<HTMLElement>('.home-hero__photo');
  heroPhoto?.addEventListener('touchstart', (event) => {
    const touch = event.changedTouches[0];
    if (!touch) return;
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  }, { passive: true, signal: runtime.signal });
  // quick-260726-u97: mobile tap-to-open — extends this SAME handler
  // (not a second touch listener) so it composes cleanly with the
  // swipe it already detects. A genuine tap (negligible movement on
  // both axes) opens the current gallery; a real horizontal swipe
  // navigates (unchanged, above); a vertical scroll-drag (large
  // deltaY) is neither, so it correctly does nothing — a tap never
  // fires mid-swipe and never hijacks a vertical scroll.
  const TAP_MAX_MOVEMENT = 10;
  heroPhoto?.addEventListener('touchend', (event) => {
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
    const direction = detectSwipeDirection(deltaX, deltaY, SWIPE_MIN_DISTANCE, SWIPE_DIRECTION_RATIO);
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
  }, { passive: true, signal: runtime.signal });

  // D3: reuses the current slide's title link — its href AND its
  // existing click listener (which already calls setCrossDocPhoto())
  // — rather than duplicating routing or morph-naming. Works
  // identically on desktop (center-zone click) and touch (tap-to-open
  // above). The `opening` guard is the only re-entrancy protection
  // this feature needs: on a hybrid touchscreen-laptop a tap can fire
  // BOTH touchend (tap-to-open) and a synthesized click (desktop
  // center-open click handler below), and native navigation must not
  // be triggered twice.
  let opening = false;
  // quick-260727-bsm (Bug C — abrupt edge-click pop): guards
  // commitEdge()'s in-flight peek-to-full-slide-then-swap sequence —
  // see commitEdge() below.
  let committing = false;
  function openCurrent() {
    if (opening) return;
    opening = true;
    if (heroPhoto) {
      // Synchronous, un-eased reset (via .is-opening disabling the
      // transition below, plus the forced reflow) so the outgoing
      // cross-document `hero-photo` View Transition snapshot captures
      // the photo at rest, never mid-push, even if an edge-peek
      // parallax was still easing back when this fired.
      heroPhoto.classList.add('is-opening');
      heroPhoto.style.setProperty('--peek-shift', '0');
      void heroPhoto.offsetWidth;
    }
    if (titleEl) {
      titleEl.click();
    } else {
      const fallbackHref = galleries[carouselIndex]?.href;
      if (fallbackHref) window.location.href = fallbackHref;
    }
  }

  // quick-260726-u97 (sketch 008 Variant C): the custom hover cursor +
  // edge-zone/peek interaction that replaces the removed scroll-to-open
  // gesture. Entirely inert on touch/coarse-pointer — matchMedia here
  // (not just the CSS media query) means none of this JS ever wires up
  // on a touchscreen; the mobile fallback is a plain tap (Task 5).
  const hoverCapable = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const EDGE_ZONE_FRACTION = 0.22;
  const PEEK_MAX_PUSH_FRACTION = 0.16;
  let currentZone: 'center' | 'left' | 'right' = 'center';
  let currentProximity = 0;
  // Declared at this outer scope (not nested inside the hoverCapable
  // block below) so render()/showGrid() — defined earlier in this
  // script but only ever invoked after every declaration here has
  // run — can call them unconditionally; both no-op safely when the
  // elements are null (touch, or markup ever missing).
  let peekPrev: HTMLImageElement | null = null;
  let peekNext: HTMLImageElement | null = null;

  function resetPeek() {
    if (!heroPhoto) return;
    heroPhoto.style.setProperty('--peek-shift', '0');
    if (peekPrev) peekPrev.style.transform = 'translateX(-100%)';
    if (peekNext) peekNext.style.transform = 'translateX(100%)';
    // quick-260727-iao: a synchronous snap (not just the eased rAF
    // pump below) so a post-swap reset under .is-opening lands the
    // seam on the current-full extreme immediately, with no stale
    // peek frame left over from before the swap. lastPeekZone is
    // deliberately left as-is (not reset here) so a genuine
    // mouseleave recede eases the seam toward the SAME extreme the
    // photo is also receding toward, in sync.
    syncWordmarkLayers();
    // quick-260727-bsm (Bug A): the mouseleave recede AND every
    // render() swap (render() calls resetPeek() in its hoverCapable
    // block) both change the photo's transform — keep the wordmark
    // synced through the ease-settle here too.
    keepWordmarkSynced();
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
    if (currentZone === 'left') {
      lastPeekZone = 'left';
      heroPhoto.style.setProperty('--peek-shift', `${currentProximity * PEEK_MAX_PUSH_FRACTION * 100}%`);
      if (peekPrev) peekPrev.style.transform = `translateX(${-100 + currentProximity * 100}%)`;
      if (peekNext) peekNext.style.transform = 'translateX(100%)';
    } else if (currentZone === 'right') {
      lastPeekZone = 'right';
      heroPhoto.style.setProperty('--peek-shift', `${-currentProximity * PEEK_MAX_PUSH_FRACTION * 100}%`);
      if (peekNext) peekNext.style.transform = `translateX(${100 - currentProximity * 100}%)`;
      if (peekPrev) peekPrev.style.transform = 'translateX(-100%)';
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
    keepWordmarkSynced();
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
    if (committing || opening) return;
    if (!heroPhoto || reduceMotionQuery.matches) {
      // No peek to continue (reduced-motion never shows one, and
      // without heroPhoto there's nothing to animate) — the plain
      // swap is correct here.
      if (direction === 'next') goToNext();
      else goToPrev();
      return;
    }
    committing = true;
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
    lastPeekZone = direction === 'next' ? 'right' : 'left';

    if (direction === 'next') {
      photo.style.setProperty('--peek-shift', '-100%');
      if (peekNext) peekNext.style.transform = 'translateX(0)';
    } else {
      photo.style.setProperty('--peek-shift', '100%');
      if (peekPrev) peekPrev.style.transform = 'translateX(0)';
    }
    // quick-260727-iao: the wordmark cutout is visible (not solid ink)
    // throughout the commit now, so the sync pump is meaningful again
    // — it drives the seam continuously from the LIVE
    // heroImg.getBoundingClientRect() through the ~420ms eased slide,
    // mirroring the photo's own peek layers sliding in underneath.
    keepWordmarkSynced(500);

    const relevantLayer = direction === 'next' ? peekNext : peekPrev;
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
      photo.classList.add('is-opening');
      carouselIndex = direction === 'next'
        ? (carouselIndex + 1) % galleries.length
        : (carouselIndex - 1 + galleries.length) % galleries.length;
      render();
      void photo.offsetWidth;
      photo.classList.remove('is-opening');
      committing = false;
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
      if (timer !== null) startAutoAdvance();
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
    peekPrev = heroPhoto.querySelector<HTMLImageElement>('[data-role="peek-prev"]');
    peekNext = heroPhoto.querySelector<HTMLImageElement>('[data-role="peek-next"]');

    heroPhoto.addEventListener('mousemove', (event) => {
      // quick-260727-bsm (Bug C): a stray move mid-commit must not
      // rewrite --peek-shift and fight the in-progress full-slide
      // animation commitEdge() is driving.
      if (committing) return;
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
        currentZone = 'center';
        currentProximity = 0;
        if (cursorEl) {
          cursorEl.dataset.zone = 'center';
        }
        resetPeek();
        return;
      }
      const { zone, proximity } = computeHoverZone(x / rect.width, EDGE_ZONE_FRACTION);
      currentZone = zone;
      currentProximity = proximity;
      if (cursorEl) {
        cursorEl.dataset.zone = zone;
      }
      updatePeek();
    }, { signal: runtime.signal });

    heroPhoto.addEventListener('mouseenter', () => {
      heroPhoto.classList.add('is-cursor-active');
      // quick-260727-drq (Bug 1): arms the instant, un-eased peek
      // transform for the whole hover — removed only right before the
      // two discrete moments (mouseleave's resetPeek() below, and
      // commitEdge()'s full-slide targets) so those keep the 420ms
      // ease.
      heroPhoto.classList.add('is-tracking');
    }, { signal: runtime.signal });

    heroPhoto.addEventListener('mouseleave', () => {
      heroPhoto.classList.remove('is-cursor-active');
      // quick-260803-bvu (Item 2): belt-and-braces — a mouseleave that
      // fires while the pointer was last over the caption (a fast
      // exit can skip an intermediate mousemove) must not leave the
      // cursor permanently hidden for the next hover session.
      heroPhoto.classList.remove('is-over-controls');
      currentZone = 'center';
      currentProximity = 0;
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
      if (!committing) resetPeek();
    }, { signal: runtime.signal });

    // Desktop click: center zone opens the current gallery, edge
    // zones commit the in-progress peek to a full slide then swap
    // (commitEdge — Bug C). Clicks inside .home-hero__caption are
    // ignored so the title link, progress dashes, and autoplay toggle
    // keep their own existing handlers — they must never be hijacked
    // by zone navigation.
    heroPhoto.addEventListener('click', (event) => {
      if (committing || opening) return;
      const target = event.target as HTMLElement;
      if (target.closest('.home-hero__caption')) return;
      if (currentZone === 'left') {
        commitEdge('prev');
      } else if (currentZone === 'right') {
        commitEdge('next');
      } else {
        openCurrent();
      }
    }, { signal: runtime.signal });
  }

  // D-01/D-02/D-03: a single stateful button — its aria-label always
  // names the mode you'd switch TO, read off its own data-label-*
  // attributes (the plain module script can't read frontmatter vars).
  const modeToggleBtn = root.querySelector<HTMLButtonElement>('[data-role="mode-toggle"]');

  modeToggleBtn?.addEventListener('click', () => {
    // Stop the periodic attention-pulse (see .home-toggle--used in
    // the <style> block) for good once the visitor has actually
    // found and used the control — no reason to keep nudging it.
    modeToggleBtn.classList.add('home-toggle--used');

    const goingToGrid = root!.dataset.displayMode === 'carousel';

    // Accessible name flips synchronously, outside the transition
    // callback — correct even before the (possibly deferred-a-frame)
    // DOM mutation below runs.
    modeToggleBtn.setAttribute(
      'aria-label',
      goingToGrid ? modeToggleBtn.dataset.labelCarousel ?? '' : modeToggleBtn.dataset.labelGrid ?? '',
    );

    const mutate = goingToGrid ? showGrid : showCarousel;

    /* The native View Transitions API composites full-page snapshots
       while this switch moves both a photo and a coloured accent
       panel. In WebKit/Chromium that compositor can temporarily paint
       the accent snapshot across the header, even though the header's
       actual DOM background is white. A header must never be an accent
       colour, so this particular switch deliberately uses a direct DOM
       swap. The carousel's in-gallery photo motion remains unchanged;
       only the unreliable grid/carousel morph is removed. */
    mutate();
  }, { signal: runtime.signal });

  // quick-260725-tqs (Item 6, Part C): land on the gallery requested
  // by DetailHero's scroll-up-to-return gesture (?carousel=<slug>).
  // SECURITY (T-tqs-01, mitigate): matched via findIndex against the
  // already-known, already-safe `galleries` array — never used to
  // build a DOM/attribute selector string, so the untrusted URL param
  // can never become a selector-injection sink. An unknown/absent
  // slug harmlessly leaves carouselIndex at its default (0).
  let landedOnRequestedGallery = false;
  const requested = new URLSearchParams(window.location.search).get('carousel');
  if (requested) {
    const i = galleries.findIndex((g) => g.slug === requested);
    if (i >= 0) {
      carouselIndex = i;
      landedOnRequestedGallery = true;
    }
  }

  render();
  syncAutoplayControl();
  if (new URLSearchParams(window.location.search).get('view') === 'grid') {
    showGrid();
  } else {
    startAutoAdvance();
  }

  // HOME-16/D-05: a random-per-visit STARTING accent, layered on top
  // of the render() call above rather than folded into it — only the
  // panel-level accent custom properties + accentPanel.style.color
  // change here; carouselIndex/heroImg/titleEl/indexLabel/
  // progressDashes stay exactly as render() already left them
  // (gallery 0, or the ?carousel=<slug> target above). Every
  // subsequent render() call (auto-advance/dash/keyboard/swipe)
  // continues to derive the accent from galleries[carouselIndex]
  // exactly as before — this override only ever runs once, here, for
  // the initial paint.
  //
  // Deliberately excludes --wordmark-photo-filter: that property is
  // NOT part of "the accent" this randomizes — it's a brightness/
  // contrast heuristic tuned to the PHOTO currently revealed through
  // the wordmark's letter-shaped cutout (still gallery 0's own photo,
  // untouched by this override) and correlated with THAT SAME
  // gallery's own heroTextColor (a naturally-dark photo is paired with
  // a white-text accent site-wide, and needs its filter "lifted"
  // rather than darkened — see the render()/wordmarkPhotoFilter
  // comment). render()'s initial call above already set it correctly
  // from gallery 0's own data; overriding it from the randomly-picked
  // gallery's (different) text color would apply the wrong photo's
  // brightness heuristic to gallery 0's actual photo.
  //
  // quick-260825-kt3: this whole block is skipped when
  // landedOnRequestedGallery is true. A matched ?carousel= return is a
  // continuation of the detail page the visitor just left (via
  // DetailHero's scroll-up-to-return gesture), so its accent must stay
  // the returned-to gallery's own — never a randomly-picked one.
  // render() above has already painted exactly that correct accent for
  // galleries[carouselIndex], so skipping this block leaves it standing
  // untouched; no replacement accent logic is needed on that path. The
  // transition-suppression class add/remove pair correctly lives INSIDE
  // this guard too: on the skipped path there is only ONE paint
  // (render()'s), so there is no second colour here to suppress a
  // transition for.
  if (!landedOnRequestedGallery) {
    root!.classList.add('is-accent-init');
    const randomIndex = pickRandomGalleryIndex(galleries.length);
    const randomGallery = galleries[randomIndex];
    const randomFallback = resolveAutomaticAccent(randomIndex);
    const randomAccent = randomGallery?.heroColor
      ? { bg: randomGallery.heroColor, text: randomGallery.heroTextColor ?? 'var(--color-on-accent)' }
      : randomFallback;
    root!.style.setProperty('--current-accent', randomAccent.bg);
    root!.style.setProperty('--current-accent-text', randomAccent.text);
    if (accentPanel) accentPanel.style.color = randomAccent.text;
    // Releases the transition suppression only after the new colour has
    // actually been painted — a single rAF can still land before paint,
    // so a double rAF is used (the first schedules the frame the browser
    // paints the override in, the second runs after that paint).
    runtime.requestAnimationFrame(() => {
      runtime.requestAnimationFrame(() => {
        root!.classList.remove('is-accent-init');
      });
    });
  }

  // Re-align the wordmark cutout on resize — both the hero photo's
  // rendered size and the wordmark's own position within it change
  // at different viewport widths (see the mobile-width overrides
  // above), so a stale computed --wordmark-bg-size/-position from a
  // previous width would drift out of alignment.
  let resizeTimer: number | null = null;
  window.addEventListener('resize', () => {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = runtime.setTimeout(syncWordmarkLayers, 100);
  }, { signal: runtime.signal });
  runtime.addCleanup(() => {
    pendingHeroLoadCtrl?.abort();
    if (namedCrossDocPhoto) namedCrossDocPhoto.style.viewTransitionName = '';
    root.classList.remove('is-accent-init', 'has-wordmark-photo');
    heroPhoto?.classList.remove('is-cursor-active', 'is-over-controls', 'is-tracking', 'is-opening');
    document.documentElement.classList.remove('mobile-home-arrival-past');
  });

  return () => {
    if (!active) return;
    active = false;
    runtimeScope.cleanup();
    if (root.dataset.runtimeActive === 'desktop') delete root.dataset.runtimeActive;
  };
}
