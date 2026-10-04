import { wordmarkPhotoFilter } from '../../lib/home-carousel';
import { resolveAutomaticAccent } from '../../lib/site-config';
import type { HomeContext } from './types';

/** Paints the current gallery into the hero and preloads its neighbours. */
export function setupRender(ctx: HomeContext): void {
  const { state, api, dom, runtime, galleries, hoverCapable } = ctx;
  const { root, heroImg, heroPlaceholderImg, indexLabel, titleEl, accentPanel, progressDashes } =
    dom;

  function showSharp(img: HTMLImageElement) {
    img.classList.add('is-loaded');
  }
  // quick-260803-bvu (Item 1): `forceCrossfade` is opt-in, defaulting
  // to false so every existing caller (dash click, keyboard, swipe)
  // keeps today's exact behavior. Only the auto-advance tick below
  // passes true. See the sync-branch comment for the full diagnosis
  // of why a genuine short delay (not just a forced reflow) is
  // needed for the crossfade to actually play once the next photo
  // is already cached.
  function render(forceCrossfade = false) {
    const gallery = galleries[state.carouselIndex];
    if (!gallery) return;
    // The clipped wordmark has no visible glyph fill until its photo
    // exists. Return to the solid inherited text fallback for every
    // swap, then opt into the cutout only after the active sharp hero
    // has loaded successfully. This keeps the title readable while
    // the independent blur placeholder is the only painted image.
    root!.classList.remove('has-wordmark-photo');
    root!.style.setProperty('--wordmark-photo', 'none');
    const fallbackAccent = resolveAutomaticAccent(state.carouselIndex);
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
      state.pendingHeroLoadCtrl?.abort();
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
              api.revealWordmarkPhoto();
            }
          }, 60);
        } else {
          showSharp(heroImg);
          if (heroImg.naturalWidth > 0) {
            api.revealWordmarkPhoto();
          }
        }
      } else {
        state.pendingHeroLoadCtrl = new AbortController();
        const onLoad = () => {
          showSharp(heroImg);
          api.revealWordmarkPhoto();
        };
        const onError = () => showSharp(heroImg);
        // 'error' covers a failed fetch (bad asset, transient CDN issue) —
        // without it the hero stays stuck on the blurred placeholder forever.
        heroImg.addEventListener('load', onLoad, {
          once: true,
          signal: state.pendingHeroLoadCtrl.signal,
        });
        heroImg.addEventListener('error', onError, {
          once: true,
          signal: state.pendingHeroLoadCtrl.signal,
        });
      }
    }
    if (indexLabel) {
      indexLabel.textContent = `${String(state.carouselIndex + 1).padStart(2, '0')} / ${String(galleries.length).padStart(2, '0')}`;
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
      dash.setAttribute('aria-current', i === state.carouselIndex ? 'true' : 'false');
    });
    api.restartFill();

    // D-05: warm the browser's HTTP cache for the next gallery's hero
    // photo so the crossfade above resolves near-instantly by the time
    // the next auto-advance/prev/next/toggle swap actually happens.
    const nextIndex = (state.carouselIndex + 1) % galleries.length;
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
      const prevGallery =
        galleries[(state.carouselIndex - 1 + galleries.length) % galleries.length];
      const nextGallery = galleries[nextIndex];
      if (dom.peekPrev && prevGallery) {
        dom.peekPrev.src = prevGallery.heroSrc;
        dom.peekPrev.srcset = prevGallery.heroSrcSet;
        dom.peekPrev.sizes = '100vw';
      }
      if (dom.peekNext && nextGallery) {
        dom.peekNext.src = nextGallery.heroSrc;
        dom.peekNext.srcset = nextGallery.heroSrcSet;
        dom.peekNext.sizes = '100vw';
      }
      api.resetPeek();
    }
  }

  api.showSharp = showSharp;
  api.render = render;
}
