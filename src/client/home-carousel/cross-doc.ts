import type { HomeContext } from './types';

/** Names the clicked photo for the homepage to gallery cross-document View Transition. */
export function setupCrossDoc(ctx: HomeContext): void {
  const { dom, runtime } = ctx;
  const { heroImg, titleEl, gridTileImgs } = dom;

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

  runtime.addCleanup(() => {
    if (namedCrossDocPhoto) namedCrossDocPhoto.style.viewTransitionName = '';
  });
}
