import { test, expect } from '@playwright/test';

// Phase 04.3: the standalone /galleries listing route was removed (the
// homepage grid is now the sole browse entry point, D-03/D-11). Discovery in
// every block below starts from the homepage: navigate to "/", switch to
// grid mode via the 'Grille' toggle button, then read the first
// `.home-grid__tile` link's href — mirroring tests/e2e/homepage.spec.ts's
// own grid-discovery pattern. Detail-page and lightbox assertions are
// otherwise unchanged from before the route removal.
//
// Phase 6 (HOME-02, D-04/D-06): the grid's own first child is now a
// non-link hero tile (`.home-grid__tile.home-grid__tile--hero`, a <div>
// with no href) — every locator below is scoped to `a.home-grid__tile` to
// resolve real, navigable gallery tiles only.

test.describe('gallery listing', () => {
  test('homepage grid renders gallery tiles, and the first tile is clickable to its detail page (D-11)', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();

    const tiles = page.locator('a.home-grid__tile');
    await expect(tiles.first()).toBeVisible();

    const firstTileName = (await tiles.first().textContent())?.trim() ?? '';
    expect(firstTileName.length).toBeGreaterThan(0);

    const href = await tiles.first().getAttribute('href');
    expect(href).toMatch(/\/galleries\/[^/]+\/?$/);
  });
});

test.describe('gallery detail', () => {
  test('renders the bilingual artist statement, differing between "/galleries/{slug}" and "/en/galleries/{slug}"', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();

    const firstTileHref = await page.locator('a.home-grid__tile').first().getAttribute('href');
    expect(firstTileHref).toBeTruthy();

    const slugMatch = firstTileHref!.match(/\/galleries\/([^/]+)\/?$/);
    const slug = slugMatch?.[1];
    expect(slug).toBeTruthy();

    await page.goto(firstTileHref!);
    const frStatement = (await page.locator('main').innerText()).trim();
    expect(frStatement.length).toBeGreaterThan(0);

    await page.goto(`/en/galleries/${slug}/`);
    const enStatement = (await page.locator('main').innerText()).trim();
    expect(enStatement.length).toBeGreaterThan(0);

    expect(enStatement).not.toBe(frStatement);
  });

  test('serves responsive hero, thumbnail, and lightbox image candidates', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();
    const firstTileHref = await page.locator('a.home-grid__tile').first().getAttribute('href');
    expect(firstTileHref).toBeTruthy();

    await page.goto(firstTileHref!);
    const hero = page.locator('.detail-hero__img');
    await expect(hero).toHaveAttribute('srcset', /480w.*2000w/);
    await expect(hero).toHaveAttribute('sizes', '100vw');

    // The hero itself is now a [data-gallery-thumb] trigger (data-index="0"),
    // so grid-thumbnail assertions must be scoped to .gallery-grid or they'd
    // resolve the hero instead of the first real grid thumbnail.
    const thumbnail = page.locator('.gallery-grid [data-gallery-thumb] img').first();
    await expect(thumbnail).toHaveAttribute('srcset', /320w.*900w/);

    await page.locator('.gallery-grid [data-gallery-thumb]').first().click();
    const lightboxImage = page.locator('[data-role="lightbox-image"]');
    await expect(lightboxImage).toHaveAttribute('srcset', /640w.*2000w/);
    await expect(lightboxImage).toHaveAttribute('sizes', '100vw');
  });
});

test.describe('lightbox', () => {
  test('opens on thumbnail click, ArrowRight advances the counter, Escape closes and returns focus to the trigger', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();

    const firstTileHref = await page.locator('a.home-grid__tile').first().getAttribute('href');
    expect(firstTileHref).toBeTruthy();

    await page.goto(firstTileHref!);

    const firstThumbnail = page
      .getByRole('button', { name: /voir en taille r.elle|view full size/i })
      .first();
    await firstThumbnail.click();

    const dialog = page.locator('dialog[open]');
    await expect(dialog).toBeVisible();

    const counter = dialog.locator('[data-role="counter"]');
    const initialCounter = await counter.innerText();

    await page.keyboard.press('ArrowRight');
    await expect(counter).not.toHaveText(initialCounter);

    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(firstThumbnail).toBeFocused();
  });

  test('shows the photographic credit and copyright notice', async ({page}) => {
    await page.goto('/');
    await page.getByRole('button', {name: 'Grille'}).click();
    const href = await page.locator('a.home-grid__tile').first().getAttribute('href');
    await page.goto(href!);
    await page.locator('[data-gallery-thumb]').first().click();

    await expect(page.locator('.lightbox__credit')).toContainText('Romane Lepont');
  });

  // Regression test for lightbox-dialog-always-visible: the dialog's own
  // `display: flex` was previously unconditional (not scoped to `[open]`),
  // which is author-origin CSS and therefore always overrides the browser's
  // built-in `dialog:not([open]) { display: none; }` UA rule regardless of
  // specificity — so the closed dialog rendered as a full 100vw x 100vh
  // panel below the footer on every gallery-detail page. Unlike the test
  // above (which scopes its locator to `dialog[open]` and so never actually
  // observes the closed state), this test targets `dialog#lightbox`
  // directly, both before any interaction and after Escape closes it.
  test('the dialog is hidden on initial load and becomes visible with flex layout when opened (regression)', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();

    const firstTileHref = await page.locator('a.home-grid__tile').first().getAttribute('href');
    expect(firstTileHref).toBeTruthy();

    await page.goto(firstTileHref!);

    const dialog = page.locator('dialog#lightbox');

    // Closed on initial load: no `open` attribute, zero visible bounding box.
    await expect(dialog).not.toHaveAttribute('open', '');
    await expect(dialog).toBeHidden();
    expect(await dialog.evaluate((el) => getComputedStyle(el).display)).toBe('none');
    const hiddenBox = await dialog.boundingBox();
    expect(hiddenBox).toBeNull();

    // Clicking a thumbnail opens it with the correct flex layout.
    await page.locator('[data-gallery-thumb]').first().click();
    await expect(dialog).toHaveAttribute('open', '');
    await expect(dialog).toBeVisible();
    expect(await dialog.evaluate((el) => getComputedStyle(el).display)).toBe('flex');
    const openBox = await dialog.boundingBox();
    expect(openBox).not.toBeNull();
    expect(openBox!.width).toBeGreaterThan(0);
    expect(openBox!.height).toBeGreaterThan(0);

    // Closing returns it to the hidden state.
    await page.keyboard.press('Escape');
    await expect(dialog).not.toHaveAttribute('open', '');
    await expect(dialog).toBeHidden();
    expect(await dialog.evaluate((el) => getComputedStyle(el).display)).toBe('none');
  });
});

// quick-260724-oep: galleries no longer use the bento layout — the grid now
// renders as an uncropped native-aspect-ratio masonry (CSS multi-column),
// driven by real per-image dimensions. This is the masonry-appropriate
// replacement for the old bento geometry assertion (editions still use
// bento and are unaffected — see edition.spec.ts).
test.describe('gallery grid masonry layout', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('gallery grid renders as a multi-column masonry with uncropped, real-aspect-ratio tiles', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();

    const hrefs = await page.locator('a.home-grid__tile').evaluateAll((els) =>
      els.map((el) => el.getAttribute('href')).filter((href): href is string => Boolean(href)),
    );
    expect(hrefs.length).toBeGreaterThan(0);

    let multiImageGalleryFound = false;

    for (const href of hrefs) {
      await page.goto(href);

      const thumbCount = await page.locator('.gallery-grid [data-gallery-thumb]').count();
      if (thumbCount === 0) continue;
      multiImageGalleryFound = true;

      const grid = page.locator('.gallery-grid');
      await expect(grid).toHaveClass(/gallery-grid--masonry/);
      expect(await page.locator('.gallery-grid__group').count()).toBe(0);

      const columnCount = await grid.evaluate((el) => getComputedStyle(el).columnCount);
      expect(Number(columnCount)).toBeGreaterThan(1);

      const gridImages = page.locator('.gallery-grid [data-gallery-thumb] img');
      const imageCount = await gridImages.count();
      for (let i = 0; i < imageCount; i += 1) {
        const image = gridImages.nth(i);
        const objectFit = await image.evaluate((el) => getComputedStyle(el).objectFit);
        expect(objectFit).not.toBe('cover');
        const aspectRatio = await image.evaluate((el) => getComputedStyle(el).aspectRatio);
        expect(aspectRatio).not.toBe('auto');
      }
    }

    // Proves the assertions above actually exercised at least one real
    // gallery's grid, not a no-op loop over zero-image galleries.
    expect(multiImageGalleryFound).toBe(true);
  });
});

// Sketch 004 variant A2's click-to-expand morph: proves startViewTransition
// is invoked on open + close but NEVER on prev/next, and that every existing
// dialog behavior (open/Arrow-nav/Escape-close+focus-return/backdrop-close)
// is unchanged on every browser, including WebKit where
// startViewTransition is undefined (the morph is purely additive).
test.describe('gallery lightbox morph', () => {
  test('morphs on open/close, never on prev/next, and every dialog interaction still works', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      (window as unknown as { __vtCalls: number }).__vtCalls = 0;
      if (typeof document.startViewTransition === 'function') {
        const original = document.startViewTransition.bind(document);
        document.startViewTransition = (callback: () => void) => {
          (window as unknown as { __vtCalls: number }).__vtCalls += 1;
          return original(callback);
        };
      }
    });

    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();
    const firstTileHref = await page.locator('a.home-grid__tile').first().getAttribute('href');
    expect(firstTileHref).toBeTruthy();
    await page.goto(firstTileHref!);

    const supported = await page.evaluate(() => typeof document.startViewTransition === 'function');

    const firstThumbnail = page.locator('[data-gallery-thumb]').first();
    await firstThumbnail.click();

    const dialog = page.locator('dialog[open]');
    await expect(dialog).toBeVisible();

    if (supported) {
      const vtCallsAfterOpen = await page.evaluate(() => (window as unknown as { __vtCalls: number }).__vtCalls);
      expect(vtCallsAfterOpen).toBeGreaterThanOrEqual(1);

      const counter = dialog.locator('[data-role="counter"]');
      const initialCounter = await counter.innerText();
      await page.keyboard.press('ArrowRight');
      await expect(counter).not.toHaveText(initialCounter);

      const vtCallsAfterNav = await page.evaluate(() => (window as unknown as { __vtCalls: number }).__vtCalls);
      expect(vtCallsAfterNav).toBe(vtCallsAfterOpen);

      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();
      await expect(firstThumbnail).toBeFocused();

      const vtCallsAfterClose = await page.evaluate(() => (window as unknown as { __vtCalls: number }).__vtCalls);
      expect(vtCallsAfterClose).toBeGreaterThan(vtCallsAfterNav);
    } else {
      // Universal fallback assertions (also exercised above when supported):
      // proves zero functional regression when View Transitions is absent
      // (e.g. WebKit).
      const counter = dialog.locator('[data-role="counter"]');
      const initialCounter = await counter.innerText();
      await page.keyboard.press('ArrowRight');
      await expect(counter).not.toHaveText(initialCounter);

      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();
      await expect(firstThumbnail).toBeFocused();
    }

    // Backdrop-close: re-open, then click the dialog itself at a point
    // outside the image/control buttons.
    await firstThumbnail.click();
    await expect(dialog).toBeVisible();
    await dialog.click({ position: { x: 5, y: 5 } });
    await expect(dialog).not.toBeVisible();
  });
});

// quick-260724-mjp: the gallery hero is the shared DetailHero's clickable
// trigger (mirrors the édition hero's D-05 behavior). quick-260724-oep:
// the hero may now be any real index (landscape-preferred, not always 0),
// and a grid tile may itself carry data-index="0" — so the hero must be
// located structurally (.detail-hero [data-gallery-thumb]), never by an
// index-0 attribute selector, and the expected counter/aria-label position
// is read from the hero's own data-index rather than assumed to be 1.
test.describe('gallery hero is clickable (sketch 005)', () => {
  test('the hero trigger opens the lightbox at its real position with focus return (fr)', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();
    const firstTileHref = await page.locator('a.home-grid__tile').first().getAttribute('href');
    expect(firstTileHref).toBeTruthy();

    await page.goto(firstTileHref!);

    const heroTrigger = page.locator('.detail-hero [data-gallery-thumb]');
    await expect(heroTrigger).toBeVisible();
    const heroIndexAttr = await heroTrigger.getAttribute('data-index');
    expect(heroIndexAttr).toBeTruthy();
    const heroIndex = Number(heroIndexAttr);
    const ariaLabel = await heroTrigger.getAttribute('aria-label');
    expect(ariaLabel?.trim().length ?? 0).toBeGreaterThan(0);
    expect(ariaLabel).toContain(String(heroIndex + 1));

    await heroTrigger.click();
    const dialog = page.locator('dialog[open]');
    await expect(dialog).toBeVisible();
    const counter = dialog.locator('[data-role="counter"]');
    const counterText = await counter.innerText();
    const total = counterText.split('/')[1]?.trim();
    expect(total).toBeTruthy();
    await expect(counter).toHaveText(`${heroIndex + 1} / ${total}`);

    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(heroTrigger).toBeFocused();
  });

  test('the hero trigger opens the lightbox at its real position (en)', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();
    const firstTileHref = await page.locator('a.home-grid__tile').first().getAttribute('href');
    expect(firstTileHref).toBeTruthy();

    const slugMatch = firstTileHref!.match(/\/galleries\/([^/]+)\/?$/);
    const slug = slugMatch?.[1];
    expect(slug).toBeTruthy();

    await page.goto(`/en/galleries/${slug}/`);

    const heroTrigger = page.locator('.detail-hero [data-gallery-thumb]');
    await expect(heroTrigger).toBeVisible();
    const heroIndexAttr = await heroTrigger.getAttribute('data-index');
    expect(heroIndexAttr).toBeTruthy();
    const heroIndex = Number(heroIndexAttr);

    await heroTrigger.click();
    const dialog = page.locator('dialog[open]');
    await expect(dialog).toBeVisible();
    const counter = dialog.locator('[data-role="counter"]');
    const counterText = await counter.innerText();
    const total = counterText.split('/')[1]?.trim();
    expect(total).toBeTruthy();
    await expect(counter).toHaveText(`${heroIndex + 1} / ${total}`);
  });
});

// quick-260724-mjp: mirrors edition.spec.ts's "editions hero reduced-motion
// (sketch 005)" block, adapted to gallery routes/classes. Desktop viewport
// is required for both assertions — the `min-width: 768px` branch of
// DetailHero.astro's CSS is what makes the pin genuinely sticky (default)
// vs relative (reduced-motion settled end-state).
test.describe('gallery hero reduced-motion (sketch 005)', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('prefers-reduced-motion: reduce shows the settled end-state immediately, no sticky pin, lightbox still opens', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });

    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();
    const firstTileHref = await page.locator('a.home-grid__tile').first().getAttribute('href');
    expect(firstTileHref).toBeTruthy();

    await page.goto(firstTileHref!);

    const pin = page.locator('.detail-hero__pin');
    await expect(pin).toBeVisible();
    const pinPosition = await pin.evaluate((el) => getComputedStyle(el).position);
    expect(pinPosition).not.toBe('sticky');

    const revealTitle = page.locator('h1.detail-hero__reveal-title');
    await expect(revealTitle).toBeVisible();

    const overlayTitle = page.locator('.detail-hero__overlay-title');
    const overlayState = await overlayTitle.evaluate((el) => {
      const style = getComputedStyle(el);
      return { opacity: style.opacity, display: style.display };
    });
    expect(overlayState.display === 'none' || overlayState.opacity === '0').toBe(true);

    // Reduced motion must not break the click-to-open lightbox behavior.
    // quick-260724-oep: the hero may be any real index now, so this asserts
    // a generic "{digits} / {digits}" counter shape rather than assuming 1/N.
    const heroTrigger = page.locator('.detail-hero [data-gallery-thumb]');
    await expect(heroTrigger).toBeVisible();
    await heroTrigger.click();
    const dialog = page.locator('dialog[open]');
    await expect(dialog).toBeVisible();
    const counter = dialog.locator('[data-role="counter"]');
    await expect(counter).toHaveText(/^\d+ \/ \d+$/);
  });

  test('without reduced motion, the desktop hero pin is sticky by default', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();
    const firstTileHref = await page.locator('a.home-grid__tile').first().getAttribute('href');
    expect(firstTileHref).toBeTruthy();

    await page.goto(firstTileHref!);

    const pin = page.locator('.detail-hero__pin');
    await expect(pin).toBeVisible();
    const pinPosition = await pin.evaluate((el) => getComputedStyle(el).position);
    expect(pinPosition).toBe('sticky');
  });

  // quick-260724-uf5: reverts quick-260724-mjp's gallery-only
  // objectFit="contain" no-crop escape hatch — the gallery hero now always
  // renders object-fit: cover, matching the homepage carousel/grid crop
  // exactly (explicit user reversal after seeing objectFit="contain" live).
  // The masonry grid below stays uncropped and is proven separately by the
  // 'gallery grid masonry layout' describe block further down this file.
  test('the gallery hero renders object-fit: cover (crop reverted, no letterboxing)', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();
    const firstTileHref = await page.locator('a.home-grid__tile').first().getAttribute('href');
    expect(firstTileHref).toBeTruthy();

    await page.goto(firstTileHref!);

    const heroImg = page.locator('.detail-hero__img').first();
    await expect(heroImg).toBeVisible();
    const objectFit = await heroImg.evaluate((el) => getComputedStyle(el).objectFit);
    expect(objectFit).toBe('cover');
  });

  // quick-260724-uf5: bouncing scroll-down chevron hint (sketch 006 variant
  // D), shared via DetailHero so it appears on both édition and gallery
  // detail heroes. Desktop-with-motion is the only state where it bounces
  // and is visible at rest; reduced-motion either disables the bounce or
  // hides the hint entirely (both are acceptable per the CSS contract).
  test('the scroll-down hint is visible at rest on desktop, and its bounce is disabled/hidden under reduced motion', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();
    const firstTileHref = await page.locator('a.home-grid__tile').first().getAttribute('href');
    expect(firstTileHref).toBeTruthy();

    await page.goto(firstTileHref!);

    const hint = page.locator('.detail-hero__scroll-hint');
    await expect(hint).toBeVisible();

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();

    const reducedMotionState = await page.locator('.detail-hero__scroll-hint').evaluate((el) => {
      const style = getComputedStyle(el);
      return { animationName: style.animationName, display: style.display };
    });
    expect(reducedMotionState.animationName === 'none' || reducedMotionState.display === 'none').toBe(true);
  });
});

// quick-260724-oep: the definitive correctness proof for FIX 1 — every
// image (hero + grid) is reachable exactly once at its own real,
// unreshuffled array index, and clicking either the hero or a grid tile
// opens the Lightbox at that same real index.
test.describe('gallery hero landscape-preference + lightbox index remapping', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('hero + grid indices form the complete contiguous set 0..N-1 with no duplicates/gaps, and clicking either opens the Lightbox at the right position', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();
    const firstTileHref = await page.locator('a.home-grid__tile').first().getAttribute('href');
    expect(firstTileHref).toBeTruthy();

    await page.goto(firstTileHref!);

    const heroIndexAttr = await page.locator('.detail-hero [data-gallery-thumb]').getAttribute('data-index');
    expect(heroIndexAttr).toBeTruthy();
    const heroIndex = Number(heroIndexAttr);

    const gridIndexAttrs = await page
      .locator('.gallery-grid [data-gallery-thumb]')
      .evaluateAll((els) => els.map((el) => el.getAttribute('data-index')));
    const gridIndices = gridIndexAttrs.map((attr) => Number(attr));

    const allIndices = [heroIndex, ...gridIndices].sort((a, b) => a - b);
    const n = allIndices.length;
    expect(allIndices).toEqual(Array.from({ length: n }, (_, i) => i));

    // Clicking the hero opens the Lightbox counter at heroIndex + 1 over N.
    const heroTrigger = page.locator('.detail-hero [data-gallery-thumb]');
    await heroTrigger.click();
    const dialog = page.locator('dialog[open]');
    await expect(dialog).toBeVisible();
    const counter = dialog.locator('[data-role="counter"]');
    await expect(counter).toHaveText(`${heroIndex + 1} / ${n}`);
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();

    // Clicking the first grid tile opens the counter at that tile's own
    // data-index + 1 over N.
    const firstGridTile = page.locator('.gallery-grid [data-gallery-thumb]').first();
    const firstGridIndex = Number(await firstGridTile.getAttribute('data-index'));
    await firstGridTile.click();
    await expect(dialog).toBeVisible();
    await expect(counter).toHaveText(`${firstGridIndex + 1} / ${n}`);
  });
});
