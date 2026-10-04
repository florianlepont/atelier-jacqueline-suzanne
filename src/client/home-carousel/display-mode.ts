import type { HomeContext } from './types';

/** Switching between the carousel and the grid. */
export function setupDisplayMode(ctx: HomeContext): void {
  const { api, dom, runtime, hoverCapable } = ctx;
  const { root, hero, grid } = dom;

  function showCarousel() {
    root!.dataset.displayMode = 'carousel';
    hero!.hidden = false;
    grid!.hidden = true;
    api.startAutoAdvance();
  }

  function showGrid() {
    root!.dataset.displayMode = 'grid';
    hero!.hidden = true;
    grid!.hidden = false;
    api.stopAutoAdvance();
    // quick-260726-u97: a lingering peek can't survive a mode switch
    // (forward reference, safe — see render()'s own call above).
    if (hoverCapable) api.resetPeek();
  }
  // D-01/D-02/D-03: a single stateful button — its aria-label always
  // names the mode you'd switch TO, read off its own data-label-*
  // attributes (the plain module script can't read frontmatter vars).
  const modeToggleBtn = root.querySelector<HTMLButtonElement>('[data-role="mode-toggle"]');

  modeToggleBtn?.addEventListener(
    'click',
    () => {
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
        goingToGrid
          ? (modeToggleBtn.dataset.labelCarousel ?? '')
          : (modeToggleBtn.dataset.labelGrid ?? ''),
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
    },
    { signal: runtime.signal },
  );

  api.showCarousel = showCarousel;
  api.showGrid = showGrid;
}
