import { pickRandomGalleryIndex } from '../lib/home-carousel';
import { resolveAutomaticAccent } from '../lib/site-config';
import { setupAutoplay } from './home-carousel/autoplay';
import { setupCrossDoc } from './home-carousel/cross-doc';
import { setupDisplayMode } from './home-carousel/display-mode';
import { setupNavigation } from './home-carousel/navigation';
import { setupPeek } from './home-carousel/peek';
import { setupRender } from './home-carousel/render';
import { createRuntimeScope } from './home-carousel/runtime-scope';
import type { GalleryEntry, HomeApi, HomeContext, HomeDom, HomeState } from './home-carousel/types';
import { setupWordmark } from './home-carousel/wordmark';

export type { HomeRuntimeScope } from './home-carousel/types';

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
  const heroPlaceholderImg = hero.querySelector<HTMLImageElement>(
    '[data-role="hero-image-placeholder"]',
  );
  const indexLabel = hero.querySelector<HTMLElement>('[data-role="index-label"]');
  const titleEl = hero.querySelector<HTMLElement>('[data-role="gallery-title"]');
  const accentPanel = hero.querySelector<HTMLElement>('[data-role="accent-panel"]');
  const wordmarkEl = hero.querySelector<HTMLElement>('.home-hero__wordmark');
  // quick-260727-iao: the mirrored-peek wordmark stack — all nullable,
  // no-op safe if the markup is ever missing.
  const wordmarkStackEl = hero.querySelector<HTMLElement>('.home-hero__wordmark-stack');
  const wordmarkPeekPrevEl = hero.querySelector<HTMLElement>('.home-hero__wordmark-peek--prev');
  const wordmarkPeekNextEl = hero.querySelector<HTMLElement>('.home-hero__wordmark-peek--next');
  const progressDashes = Array.from(
    hero.querySelectorAll<HTMLButtonElement>('[data-role="progress"] .home-hero__progress-dash'),
  );
  const autoplayToggle = hero.querySelector<HTMLButtonElement>('[data-role="autoplay-toggle"]');

  // Grid tiles are server-rendered once and never re-rendered by
  // render(); their listeners belong to this desktop lifecycle.
  const gridTileImgs = Array.from(
    root.querySelectorAll<HTMLImageElement>('.home-grid__tile-img--sharp'),
  );
  const heroPhoto = hero.querySelector<HTMLElement>('.home-hero__photo');

  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  // Kept as a defensive guard in addition to the outer desktop mount.
  const phoneViewport = window.matchMedia('(max-width: 767px)');
  // quick-260726-u97 (sketch 008 Variant C): the custom hover cursor and edge peek
  // are entirely inert on touch/coarse-pointer. matchMedia here (not just the CSS
  // media query) means none of that JS wires up on a touchscreen.
  const hoverCapable = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const state: HomeState = {
    carouselIndex: 0,
    timer: null,
    autoAdvancePausedByUser: reduceMotionQuery.matches,
    hasUserChosenAutoplay: false,
    pendingHeroLoadCtrl: null,
    // quick-260727-iao: which edge's peek layer is "active", sticky across
    // interactions so a mouseleave recede eases toward the SAME extreme the seam
    // was already tracking. Deliberately no 'center' value.
    lastPeekZone: 'right',
    currentZone: 'center',
    currentProximity: 0,
    committing: false,
    opening: false,
  };
  const dom: HomeDom = {
    root,
    hero,
    grid,
    heroImg,
    heroPlaceholderImg,
    indexLabel,
    titleEl,
    accentPanel,
    wordmarkEl,
    wordmarkStackEl,
    wordmarkPeekPrevEl,
    wordmarkPeekNextEl,
    progressDashes,
    autoplayToggle,
    heroPhoto,
    gridTileImgs,
    peekPrev: null,
    peekNext: null,
  };
  const api = {} as HomeApi;
  const ctx: HomeContext = {
    runtime,
    state,
    dom,
    api,
    galleries,
    reduceMotionQuery,
    phoneViewport,
    hoverCapable,
  };

  // Each module defines its own functions and registers its listeners; none of
  // them runs anything until the start-up calls below.
  setupCrossDoc(ctx);
  setupWordmark(ctx);
  setupRender(ctx);
  setupAutoplay(ctx);
  setupDisplayMode(ctx);
  setupNavigation(ctx);
  setupPeek(ctx);

  gridTileImgs.forEach((img) => {
    if (img.complete) {
      api.showSharp(img);
    } else {
      img.addEventListener('load', () => api.showSharp(img), {
        once: true,
        signal: runtime.signal,
      });
      // A failed fetch never fires 'load' — without this, a broken image
      // leaves the tile stuck on its blurred placeholder forever.
      img.addEventListener('error', () => api.showSharp(img), {
        once: true,
        signal: runtime.signal,
      });
    }
  });

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
      state.carouselIndex = i;
      landedOnRequestedGallery = true;
    }
  }

  api.render();
  api.syncAutoplayControl();
  if (new URLSearchParams(window.location.search).get('view') === 'grid') {
    api.showGrid();
  } else {
    api.startAutoAdvance();
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
      ? {
          bg: randomGallery.heroColor,
          text: randomGallery.heroTextColor ?? 'var(--color-on-accent)',
        }
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
  window.addEventListener(
    'resize',
    () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = runtime.setTimeout(api.syncWordmarkLayers, 100);
    },
    { signal: runtime.signal },
  );
  runtime.addCleanup(() => {
    state.pendingHeroLoadCtrl?.abort();
    root.classList.remove('is-accent-init', 'has-wordmark-photo');
    heroPhoto?.classList.remove(
      'is-cursor-active',
      'is-over-controls',
      'is-tracking',
      'is-state.opening',
    );
    document.documentElement.classList.remove('mobile-home-arrival-past');
  });

  return () => {
    if (!active) return;
    active = false;
    runtimeScope.cleanup();
    if (root.dataset.runtimeActive === 'desktop') delete root.dataset.runtimeActive;
  };
}
