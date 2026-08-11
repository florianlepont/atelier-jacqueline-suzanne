import { test, expect } from '@playwright/test';

// Phase 04.3: the standalone /galleries listing route was removed (the
// homepage grid is now the sole browse entry point, D-03/D-11). Discovery in
// every block below starts from the homepage: navigate to "/", switch to
// grid mode via the 'Grille' toggle button, then read the first
// `.home-grid__tile` link's href — mirroring tests/e2e/homepage-carousel-core.spec.ts's
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
  test('desktop reveal text uses the gallery accent’s computed black-or-white ink', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();

    const href = await page.locator('a.home-grid__tile').first().getAttribute('href');
    expect(href).toBeTruthy();
    await page.goto(href!);
    await page.evaluate(() => window.scrollTo(0, 700));

    const colors = await page.locator('.detail-hero').evaluate((hero) => {
      const reveal = hero.querySelector<HTMLElement>('.detail-hero__reveal');
      const probe = document.createElement('span');
      probe.style.color = 'var(--detail-hero-desktop-accent-text)';
      hero.append(probe);
      const expected = getComputedStyle(probe).color;
      probe.remove();

      return { expected, actual: reveal ? getComputedStyle(reveal).color : '' };
    });

    expect(colors.actual).toBe(colors.expected);
    expect(colors.actual).toMatch(/^rgb\((26, 26, 26|255, 255, 255)\)$/);
  });

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
// driven by real per-image dimensions. quick-260803-jby later moved
// édition detail pages onto this same masonry mode too (see
// edition.spec.ts's own masonry describe block), so gallery and édition
// detail pages now render the identical masonry contract — each is still
// verified independently here and there because they are two different
// pages sharing one component, not because their layout mode still
// differs.
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
  //
  // quick-260724-wdr: extended to also assert the new locale-aware text
  // label ("Faire défiler" fr / "Scroll" en) that strengthens the
  // affordance, without weakening the preserved bounce/reduced-motion
  // assertions above.
  //
  // quick-260727-drq (Bug 4): restored after quick-260726-ltr's premature
  // removal — direct user feedback confirmed first-time visitors landing
  // from the carousel didn't realize there was more below.
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
    await expect(hint).toContainText('Faire défiler');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();

    const reducedMotionState = await page.locator('.detail-hero__scroll-hint').evaluate((el) => {
      const style = getComputedStyle(el);
      return { animationName: style.animationName, display: style.display };
    });
    expect(reducedMotionState.animationName === 'none' || reducedMotionState.display === 'none').toBe(true);
  });

  test('the scroll-down hint label reads "Scroll" on the matching EN route', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();
    const firstTileHref = await page.locator('a.home-grid__tile').first().getAttribute('href');
    expect(firstTileHref).toBeTruthy();

    const slugMatch = firstTileHref!.match(/\/galleries\/([^/]+)\/?$/);
    const slug = slugMatch?.[1];
    expect(slug).toBeTruthy();

    await page.goto(`/en/galleries/${slug}/`);

    const hint = page.locator('.detail-hero__scroll-hint');
    await expect(hint).toBeVisible();
    await expect(hint).toContainText('Scroll');
  });
});

// quick-260725-tqs (Item 1): the gallery detail page's VISIBLE-on-arrival
// title (.detail-hero__overlay-title) must match the homepage carousel
// title's end-state (size/position/casing) so the two read as continuous
// across the cross-document crossfade. .detail-hero__reveal-title (the
// deliberate 72px scrolled-down title) must stay untouched.
test.describe('gallery detail overlay-title matches the homepage carousel title (Item 1)', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('overlay-title: 18px, uppercase, left ~16px; reveal-title unchanged (fr)', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();
    const firstTileHref = await page.locator('a.home-grid__tile').first().getAttribute('href');
    expect(firstTileHref).toBeTruthy();

    await page.goto(firstTileHref!);

    const overlayTitle = page.locator('.detail-hero__overlay-title');
    const overlayStyle = await overlayTitle.evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        fontSize: style.fontSize,
        textTransform: style.textTransform,
        left: parseFloat(style.left),
      };
    });
    expect(overlayStyle.fontSize).toBe('18px');
    expect(overlayStyle.textTransform).toBe('uppercase');
    expect(overlayStyle.left).toBeCloseTo(16, 0);

    // The deliberate 72px scrolled-down title was NOT altered — its
    // computed font-size stays large (well above the overlay's 18px).
    const revealFontSize = await page
      .locator('.detail-hero__reveal-title')
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(revealFontSize).toBeGreaterThan(18);
  });

  test('overlay-title: 18px, uppercase, left ~16px on the matching EN route', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();
    const firstTileHref = await page.locator('a.home-grid__tile').first().getAttribute('href');
    expect(firstTileHref).toBeTruthy();

    const slugMatch = firstTileHref!.match(/\/galleries\/([^/]+)\/?$/);
    const slug = slugMatch?.[1];
    expect(slug).toBeTruthy();

    await page.goto(`/en/galleries/${slug}/`);

    const overlayTitle = page.locator('.detail-hero__overlay-title');
    const overlayStyle = await overlayTitle.evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        fontSize: style.fontSize,
        textTransform: style.textTransform,
        left: parseFloat(style.left),
      };
    });
    expect(overlayStyle.fontSize).toBe('18px');
    expect(overlayStyle.textTransform).toBe('uppercase');
    expect(overlayStyle.left).toBeCloseTo(16, 0);

    const revealFontSize = await page
      .locator('.detail-hero__reveal-title')
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(revealFontSize).toBeGreaterThan(18);
  });
});

// quick-260725-tqs (Item 6): scroll-up-at-top on a gallery detail page
// returns to the homepage carousel showing the SAME gallery — the mirror
// image of the homepage's own scroll-to-open gesture. This block proves
// the positive path AND, critically, mirrors quick-260725-sj4's own
// fresh-load synthetic-event regression pattern to prove the accidental-
// navigation failure mode is NOT reintroduced in mirror form.
test.describe('gallery detail scroll-up-to-return (Item 6, quick-260725-tqs)', () => {
  async function discoverGallery(page: import('@playwright/test').Page) {
    await page.goto('/');
    // Phase 21 (HOME-14): reads the build-time data node (Lightbox.astro
    // precedent, also used by homepage-scroll-deck.spec.ts and
    // homepage-accent-random.spec.ts) instead of clicking the "Grille"
    // toggle + reading a `.home-grid__tile` — this helper is shared by both
    // the 1280x900 desktop callers below AND the 390x844 touch-input caller,
    // and the toggle/grid subtree is now retired entirely below 767px
    // (structurally absent, not just visually hidden), so a real click
    // there would time out forever.
    const entry = await page
      .locator('ul[data-role="home-carousel-data"] li')
      .first()
      .evaluate((li) => ({
        href: (li as HTMLElement).dataset.href ?? '',
        slug: (li as HTMLElement).dataset.slug ?? '',
        title: (li as HTMLElement).dataset.title ?? '',
      }));
    expect(entry.href).toBeTruthy();
    expect(entry.slug).toBeTruthy();
    return { href: entry.href, slug: entry.slug, title: entry.title };
  }

  test.describe('positive path (must navigate)', () => {
    test.use({ viewport: { width: 1280, height: 900 } });

    test('fr: genuine engagement + return-to-top + sustained upward push returns to the same gallery', async ({
      page,
    }) => {
      const { href, slug, title } = await discoverGallery(page);
      await page.goto(href);

      // Arm engagement with a real scroll past ENGAGE_DISTANCE (300).
      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(150);
      // Return to the very top.
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(150);

      // A single sustained upward wheel push (deltaY -200 => +200 upward
      // intent, >= the 150 threshold in one push).
      await page.evaluate(() => window.dispatchEvent(new WheelEvent('wheel', { deltaY: -200, bubbles: true })));

      await page.waitForURL(`**/?carousel=${slug}`);
      await expect(page.locator('[data-role="gallery-title"]')).toHaveText(title.toUpperCase());
    });

    test('en: genuine engagement + return-to-top + sustained upward push returns to the same gallery', async ({
      page,
    }) => {
      const { slug, title } = await discoverGallery(page);
      await page.goto(`/en/galleries/${slug}/`);

      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(150);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(150);

      await page.evaluate(() => window.dispatchEvent(new WheelEvent('wheel', { deltaY: -200, bubbles: true })));

      await page.waitForURL(`**/en/?carousel=${slug}`);
      await expect(page.locator('[data-role="gallery-title"]')).toHaveText(title.toUpperCase());
    });
  });

  // Mirrors quick-260725-sj4's own synthetic-event fresh-load pattern: an
  // accumulator armed from a fresh scrollY-0 load (hasEngaged still false)
  // must never misfire on ordinary small upward scroll corrections.
  test.describe('accidental-trigger regression guard (must NOT navigate)', () => {
    test.use({ viewport: { width: 1280, height: 900 } });

    test('fr: fresh load, two upward wheel ticks do NOT navigate', async ({ page }) => {
      const { href } = await discoverGallery(page);
      await page.goto(href);

      await page.evaluate(() => window.dispatchEvent(new WheelEvent('wheel', { deltaY: -80, bubbles: true })));
      await page.waitForTimeout(80);
      await page.evaluate(() => window.dispatchEvent(new WheelEvent('wheel', { deltaY: -80, bubbles: true })));
      await page.waitForTimeout(300);

      expect(page.url()).toBe(new URL(href, page.url()).href);
    });

    test('en: fresh load, two upward wheel ticks do NOT navigate', async ({ page }) => {
      const { slug } = await discoverGallery(page);
      const enHref = `/en/galleries/${slug}/`;
      await page.goto(enHref);

      await page.evaluate(() => window.dispatchEvent(new WheelEvent('wheel', { deltaY: -80, bubbles: true })));
      await page.waitForTimeout(80);
      await page.evaluate(() => window.dispatchEvent(new WheelEvent('wheel', { deltaY: -80, bubbles: true })));
      await page.waitForTimeout(300);

      expect(page.url()).toMatch(new RegExp(`/en/galleries/${slug}/?$`));
    });

    test('fr: a small down-then-up correction (below ENGAGE_DISTANCE) does NOT navigate', async ({ page }) => {
      const { href } = await discoverGallery(page);
      await page.goto(href);

      await page.evaluate(() => window.scrollTo(0, 60));
      await page.waitForTimeout(80);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(80);
      await page.evaluate(() => window.dispatchEvent(new WheelEvent('wheel', { deltaY: -200, bubbles: true })));
      await page.waitForTimeout(300);

      expect(page.url()).toBe(new URL(href, page.url()).href);
    });

    test.describe('touch input', () => {
      test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

      test('fresh load: a downward finger drag (upward scroll intent) does NOT navigate', async ({ page }) => {
        const { href } = await discoverGallery(page);
        await page.goto(href);

        // Mirrors homepage-wordmark-peek.spec.ts's own synthetic Touch/TouchEvent
        // construction for its "fresh load: one modest touch swipe" test,
        // but with an INCREASING clientY (finger moving down the screen =
        // upward scroll intent, the mirror direction).
        await page.evaluate(() => {
          const target = document.body;
          const startY = 300;
          const totalDelta = 180;
          const steps = 4;
          const clientX = 195;

          const makeTouchEvent = (type: string, clientY: number) => {
            const touch = new Touch({ identifier: 1, target, clientX, clientY });
            return new TouchEvent(type, {
              bubbles: true,
              cancelable: true,
              touches: type === 'touchend' ? [] : [touch],
              changedTouches: [touch],
            });
          };

          window.dispatchEvent(makeTouchEvent('touchstart', startY));
          for (let i = 1; i <= steps; i++) {
            window.dispatchEvent(makeTouchEvent('touchmove', startY + (totalDelta / steps) * i));
          }
          window.dispatchEvent(makeTouchEvent('touchend', startY + totalDelta));
        });
        await page.waitForTimeout(300);

        expect(page.url()).toBe(new URL(href, page.url()).href);
      });
    });
  });

  test.describe('below-threshold guard (engaged, at top, tiny tick — must NOT navigate)', () => {
    test.use({ viewport: { width: 1280, height: 900 } });

    test('a single small upward wheel tick below the threshold does NOT navigate', async ({ page }) => {
      const { href } = await discoverGallery(page);
      await page.goto(href);

      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(150);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(150);
      await page.evaluate(() => window.dispatchEvent(new WheelEvent('wheel', { deltaY: -60, bubbles: true })));
      await page.waitForTimeout(300);

      expect(page.url()).toBe(new URL(href, page.url()).href);
    });
  });

  // quick-260803-bvu (Item 6): REWRITTEN — this used to assert the
  // gesture stayed entirely inert on édition heroes (they never supplied
  // carouselReturnHref). Item 6 now activates the SAME gesture for
  // éditions too, passing their `overviewHref` (the éditions list)
  // instead of a gallery's `?carousel=<slug>` homepage URL — see
  // DetailHero.astro's updated Props doc and
  // edition.spec.ts's own 'edition detail scroll-up-to-return' describe
  // block for the full positive-path/regression-guard coverage. This test
  // now proves the two callers stay distinguishable by DESTINATION shape
  // rather than by the attribute's mere presence.
  test.describe('feature scoping — edition heroes get a DIFFERENT return destination, not an absent one', () => {
    test('an edition detail page carries the carousel-return attribute pointing at the editions overview, not a ?carousel= URL', async ({
      page,
    }) => {
      await page.goto('/editions/');
      const tileHref = await page.locator('.editions-index__row').first().getAttribute('href');
      expect(tileHref).toBeTruthy();

      await page.goto(tileHref!);
      const returnHref = await page
        .locator('.detail-hero[data-carousel-return-href]')
        .getAttribute('data-carousel-return-href');
      expect(returnHref).toBeTruthy();
      expect(returnHref).toMatch(/\/editions\/?$/);
      expect(returnHref).not.toContain('?carousel=');
    });
  });

  test.describe('homepage ?carousel= init read (independent of the gesture)', () => {
    test('navigating directly to /?carousel=<slug> lands the carousel on that gallery', async ({ page }) => {
      const { slug, title } = await discoverGallery(page);

      await page.goto(`/?carousel=${slug}`);
      await expect(page.locator('[data-role="gallery-title"]')).toHaveText(title.toUpperCase());
    });

    test('an unknown slug falls back to the first gallery, no error', async ({ page }) => {
      await page.goto('/?carousel=does-not-exist');
      await expect(page.locator('[data-role="gallery-title"]')).toHaveText(/.+/);
    });
  });
});

// PORT-06 (D-06) REVERSES quick-260726-ltr Item 1 (2026-07-26) on direct
// user instruction: the footer that block deliberately hid on gallery
// detail pages now renders again, exactly as it always has on édition
// detail pages. Do not "fix" this back — the reversal is intentional. The
// >= 300px desktop scroll-track assertion is retained because DetailHero's
// ENGAGE_DISTANCE=300 scroll-up-to-return gate still depends on that room
// being reachable; restoring the footer only ADDS page height below the
// hero's own footer-independent calc(100svh + 900px) track, so this
// assertion can only get safer, never worse.
test.describe('gallery detail footer restored + scroll-track safety (PORT-06, reverses quick-260726-ltr Item 1)', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('fr: footer is present on the gallery detail page, and the desktop scroll track is still >= 300px', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();
    const firstTileHref = await page.locator('a.home-grid__tile').first().getAttribute('href');
    expect(firstTileHref).toBeTruthy();

    await page.goto(firstTileHref!);

    await expect(page.locator('footer.chrome-band')).toHaveCount(1);

    const track = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
    expect(track).toBeGreaterThanOrEqual(300);
  });

  test('en: footer is present on the gallery detail page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();
    const firstTileHref = await page.locator('a.home-grid__tile').first().getAttribute('href');
    expect(firstTileHref).toBeTruthy();

    const slugMatch = firstTileHref!.match(/\/galleries\/([^/]+)\/?$/);
    const slug = slugMatch?.[1];
    expect(slug).toBeTruthy();

    await page.goto(`/en/galleries/${slug}/`);
    await expect(page.locator('footer.chrome-band')).toHaveCount(1);
  });

  test('no regression: footer is still present on an édition detail page', async ({ page }) => {
    await page.goto('/editions/');
    const tileHref = await page.locator('.editions-index__row').first().getAttribute('href');
    expect(tileHref).toBeTruthy();

    await page.goto(tileHref!);
    await expect(page.locator('footer.chrome-band')).toHaveCount(1);
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

// quick-260724-uf5 (sketch 006): critical mobile-safety verification for the
// cross-document View Transition destination name. `.detail-hero__img` must
// carry `view-transition-name: hero-photo` ONLY at desktop widths — the
// name must resolve to `none` on mobile, as a direct precaution against the
// HOME-06/D-10/D-12 100svh always-on-name mobile-regression bug class.
test.describe('cross-document view-transition name gating — desktop (sketch 006)', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('the hero photo carries hero-photo and the header carries ajs-header at desktop widths', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();
    const firstTileHref = await page.locator('a.home-grid__tile').first().getAttribute('href');
    expect(firstTileHref).toBeTruthy();

    await page.goto(firstTileHref!);

    const heroImg = page.locator('.detail-hero__img').first();
    await expect(heroImg).toBeVisible();
    const heroName = await heroImg.evaluate((el) => getComputedStyle(el).viewTransitionName);
    expect(heroName).toBe('hero-photo');

    const header = page.locator('header[data-role="site-header"]');
    await expect(header).toBeVisible();
    const headerName = await header.evaluate((el) => getComputedStyle(el).viewTransitionName);
    expect(headerName).toBe('ajs-header');
  });
});

test.describe('cross-document view-transition name gating — mobile (sketch 006)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('the hero photo carries NO view-transition-name at mobile widths (HOME-06 mobile-safety precaution)', async ({
    page,
  }) => {
    await page.goto('/');
    // Phase 21 (HOME-14): the "Grille" toggle + `.home-grid__tile` are
    // retired entirely below 767px — read the build-time data node instead
    // (same pattern as discoverGallery() above), which exists at every
    // viewport regardless of which subtree the CSS currently shows.
    const firstTileHref = await page
      .locator('ul[data-role="home-carousel-data"] li')
      .first()
      .evaluate((li) => (li as HTMLElement).dataset.href ?? '');
    expect(firstTileHref).toBeTruthy();

    await page.goto(firstTileHref!);

    const heroImg = page.locator('.detail-hero__img').first();
    await expect(heroImg).toBeVisible();
    const heroName = await heroImg.evaluate((el) => getComputedStyle(el).viewTransitionName);
    expect(heroName).toBe('none');
  });
});

// PORT-05 / D-04 / D-05: the shared `.tile` base rule in GalleryGrid.astro
// previously carried a visible frame declaration. CONTEXT.md D-04's original
// analysis wrongly assumed only the bento layout is live; verified during
// planning, gallery detail pages actually render GalleryGrid in MASONRY mode
// while édition detail pages, at the time, rendered it in the default BENTO
// mode — both modes shared the same `.tile` base rule, so both were
// verified independently. quick-260803-ira changed that shared base rule's
// `object-fit` from crop to contain, so bento (éditions) tile photos also
// rendered uncropped, matching masonry's pre-existing never-crop treatment.
// quick-260803-jby then moved éditions onto masonry too (letterboxing
// against the tile's ink background was still visible with bento's fixed
// cell size, even once the crop was gone) — gallery AND édition detail
// pages now render the SAME masonry mode. Each is still verified
// independently below because they are two different pages sharing one
// component, not because their layout mode still differs. The bento
// branch retains no caller after this change.
test.describe('gallery + édition thumbnail tiles render with no frame (PORT-05, D-04/D-05)', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('gallery detail (masonry): every tile has 0px borders, keeps the ink loading background, and never letterboxes', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();
    const firstTileHref = await page.locator('a.home-grid__tile').first().getAttribute('href');
    expect(firstTileHref).toBeTruthy();

    await page.goto(firstTileHref!);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const tiles = page.locator('.gallery-grid .tile');
    await expect(tiles.first()).toBeVisible();

    const tileCount = await tiles.count();
    expect(tileCount).toBeGreaterThan(0);

    const borderWidths = await tiles.evaluateAll((els) =>
      els.map((el) => {
        const style = getComputedStyle(el);
        return [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth];
      }),
    );
    for (const widths of borderWidths) {
      for (const width of widths) {
        expect(width).toBe('0px');
      }
    }

    const firstTileBackground = await tiles.first().evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(firstTileBackground).toBe('rgb(26, 26, 26)');

    const firstTileImg = tiles.first().locator('img');
    const objectFit = await firstTileImg.evaluate((el) => getComputedStyle(el).objectFit);
    expect(objectFit).toBe('contain');

    // The tile is lazily loaded — poll until the img has actually decoded a
    // real image before measuring, or the ratio check below would race a
    // still-loading <img> into a false NaN measurement (naturalWidth === 0).
    await expect
      .poll(() =>
        firstTileImg.evaluate(
          (el) => (el as HTMLImageElement).complete && (el as HTMLImageElement).naturalWidth > 0,
        ),
      )
      .toBe(true);

    const ratios = await firstTileImg.evaluate((el) => {
      const img = el as HTMLImageElement;
      return {
        clientRatio: img.clientWidth / img.clientHeight,
        naturalRatio: img.naturalWidth / img.naturalHeight,
      };
    });
    expect(Math.abs(ratios.clientRatio - ratios.naturalRatio) / ratios.naturalRatio).toBeLessThan(0.01);

    // Regression guard: a masonry `.tile img` left at its default `display:
    // inline` leaves a ~3-4px baseline/descender gap below the image, where
    // the shared `background: var(--color-ink)` (D-05's loading fallback)
    // shows through as a visible dark strip along the tile's bottom edge —
    // reported live post-merge, root-caused to the missing `display: block`
    // on `.gallery-grid--masonry .tile img`. No border-width check catches
    // this; only a direct img-vs-tile bounding-box comparison does.
    const gaps = await tiles.evaluateAll((els) =>
      els.map((el) => {
        const tileRect = el.getBoundingClientRect();
        const imgRect = el.querySelector('img')!.getBoundingClientRect();
        return {
          top: imgRect.top - tileRect.top,
          bottom: tileRect.bottom - imgRect.bottom,
        };
      }),
    );
    for (const gap of gaps) {
      expect(Math.abs(gap.top)).toBeLessThan(0.5);
      expect(Math.abs(gap.bottom)).toBeLessThan(0.5);
    }
  });

  test('édition detail (masonry, quick-260803-jby): every tile has 0px borders and shows the photo whole, uncropped, flush with no exposed background', async ({
    page,
  }) => {
    await page.goto('/editions/');
    const tileHref = await page.locator('.editions-index__row').first().getAttribute('href');
    expect(tileHref).toBeTruthy();

    await page.goto(tileHref!);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const tiles = page.locator('.gallery-grid .tile');
    await expect(tiles.first()).toBeVisible();

    const tileCount = await tiles.count();
    expect(tileCount).toBeGreaterThan(0);

    const borderWidths = await tiles.evaluateAll((els) =>
      els.map((el) => {
        const style = getComputedStyle(el);
        return [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth];
      }),
    );
    for (const widths of borderWidths) {
      for (const width of widths) {
        expect(width).toBe('0px');
      }
    }

    const firstTileImg = tiles.first().locator('img');
    const objectFit = await firstTileImg.evaluate((el) => getComputedStyle(el).objectFit);
    expect(objectFit).toBe('contain');

    // Same img-vs-tile flush check the gallery masonry sub-test above
    // performs: this is precisely what the owner reported (a visible dark
    // strip/band around édition grid photos) and now applies to éditions
    // too, since both pages share the identical masonry mechanism.
    const gaps = await tiles.evaluateAll((els) =>
      els.map((el) => {
        const tileRect = el.getBoundingClientRect();
        const imgRect = el.querySelector('img')!.getBoundingClientRect();
        return {
          top: imgRect.top - tileRect.top,
          bottom: tileRect.bottom - imgRect.bottom,
        };
      }),
    );
    for (const gap of gaps) {
      expect(Math.abs(gap.top)).toBeLessThan(0.5);
      expect(Math.abs(gap.bottom)).toBeLessThan(0.5);
    }
  });
});

// PORT-04 (D-01): the 4-line CSS clamp on `.detail-hero__statement` is
// removed entirely, with no substitute cap (following Phase 17 HOME-12's
// precedent). Because DetailHero is a fixed-height, `overflow: hidden`
// sticky panel (unlike HOME-12's freely-growing grid tile), the un-clamped
// statement must be proven to neither self-clip NOR escape
// `.detail-hero__pin`'s clipped bounds, across EVERY published gallery, at
// both the project's tested desktop and mobile viewports. Looping every
// gallery (not just the first) is deliberate: the clamp only visibly bit on
// the longest statement, and hardcoding today's longest slug would silently
// stop testing anything the moment content changes. The real overflow
// defence is now the Sanity `.max(N)` schema validation (Task 3 of this
// plan), not a CSS cap.
test.describe('gallery detail hero statement renders in full, no clamp, no clipping (PORT-04, D-01)', () => {
  async function discoverGalleryHrefs(page: import('@playwright/test').Page) {
    await page.goto('/');
    // Phase 21 (HOME-14): shared by both the desktop AND mobile tests below
    // — the "Grille" toggle + `.home-grid__tile` are retired entirely below
    // 767px, so reads the build-time data node instead (works unchanged at
    // every viewport).
    const hrefs = await page
      .locator('ul[data-role="home-carousel-data"] li')
      .evaluateAll((els) =>
        els.map((el) => (el as HTMLElement).dataset.href).filter((href): href is string => Boolean(href)),
      );
    expect(hrefs.length).toBeGreaterThan(0);
    return hrefs;
  }

  async function measureStatement(page: import('@playwright/test').Page) {
    const statement = page.locator('.detail-hero__statement');
    if ((await statement.count()) === 0) return null;
    await statement.waitFor({ state: 'attached' });

    let measurement = await page.evaluate(() => {
      const statementEl = document.querySelector('.detail-hero__statement');
      const revealEl = document.querySelector('.detail-hero__reveal');
      const pinEl = document.querySelector('.detail-hero__pin');
      if (!statementEl || !revealEl || !pinEl) return null;
      const statementStyle = getComputedStyle(statementEl);
      const revealRect = revealEl.getBoundingClientRect();
      const pinRect = pinEl.getBoundingClientRect();
      return {
        webkitLineClamp: statementStyle.webkitLineClamp,
        scrollHeight: statementEl.scrollHeight,
        clientHeight: statementEl.clientHeight,
        textContent: statementEl.textContent ?? '',
        revealTop: revealRect.top,
        revealBottom: revealRect.bottom,
        revealHeight: revealRect.height,
        pinTop: pinRect.top,
        pinBottom: pinRect.bottom,
      };
    });

    // Desktop: the reveal starts at opacity: 0 and is animated in by the
    // scroll-driven reveal script. Opacity doesn't affect
    // getBoundingClientRect()/scrollHeight, but if the reveal measures as a
    // zero-size rect (not yet laid out/visible), scroll down and re-measure
    // rather than forcing styles.
    if (measurement && measurement.revealHeight === 0) {
      await page.evaluate(() => window.scrollTo(0, 400));
      await page.waitForTimeout(150);
      measurement = await page.evaluate(() => {
        const statementEl = document.querySelector('.detail-hero__statement');
        const revealEl = document.querySelector('.detail-hero__reveal');
        const pinEl = document.querySelector('.detail-hero__pin');
        if (!statementEl || !revealEl || !pinEl) return null;
        const statementStyle = getComputedStyle(statementEl);
        const revealRect = revealEl.getBoundingClientRect();
        const pinRect = pinEl.getBoundingClientRect();
        return {
          webkitLineClamp: statementStyle.webkitLineClamp,
          scrollHeight: statementEl.scrollHeight,
          clientHeight: statementEl.clientHeight,
          textContent: statementEl.textContent ?? '',
          revealTop: revealRect.top,
          revealBottom: revealRect.bottom,
          revealHeight: revealRect.height,
          pinTop: pinRect.top,
          pinBottom: pinRect.bottom,
        };
      });
    }

    return measurement;
  }

  test('desktop (1280x900): no clamp, no self-clip, reveal stays inside the pin, for every published gallery', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    const hrefs = await discoverGalleryHrefs(page);

    for (const href of hrefs) {
      await page.goto(href);
      const measurement = await measureStatement(page);
      if (!measurement) continue; // statement element is conditionally rendered

      expect(measurement.webkitLineClamp, `${href}: webkitLineClamp`).toBe('none');
      expect(
        measurement.scrollHeight <= measurement.clientHeight,
        `${href}: scrollHeight (${measurement.scrollHeight}) <= clientHeight (${measurement.clientHeight})`,
      ).toBe(true);
      expect(
        measurement.revealTop >= measurement.pinTop - 1,
        `${href}: reveal top (${measurement.revealTop}) >= pin top (${measurement.pinTop}) - 1`,
      ).toBe(true);
      expect(
        measurement.revealBottom <= measurement.pinBottom + 1,
        `${href}: reveal bottom (${measurement.revealBottom}) <= pin bottom (${measurement.pinBottom}) + 1`,
      ).toBe(true);
      expect(measurement.textContent, `${href}: no ellipsis character`).not.toContain('…');
    }
  });

  test('mobile (390x844): no clamp, no self-clip, reveal stays inside the pin, for every published gallery', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const hrefs = await discoverGalleryHrefs(page);

    for (const href of hrefs) {
      await page.goto(href);
      const measurement = await measureStatement(page);
      if (!measurement) continue; // statement element is conditionally rendered

      expect(measurement.webkitLineClamp, `${href}: webkitLineClamp`).toBe('none');
      expect(
        measurement.scrollHeight <= measurement.clientHeight,
        `${href}: scrollHeight (${measurement.scrollHeight}) <= clientHeight (${measurement.clientHeight})`,
      ).toBe(true);
      expect(
        measurement.revealTop >= measurement.pinTop - 1,
        `${href}: reveal top (${measurement.revealTop}) >= pin top (${measurement.pinTop}) - 1`,
      ).toBe(true);
      expect(
        measurement.revealBottom <= measurement.pinBottom + 1,
        `${href}: reveal bottom (${measurement.revealBottom}) <= pin bottom (${measurement.pinBottom}) + 1`,
      ).toBe(true);
      expect(measurement.textContent, `${href}: no ellipsis character`).not.toContain('…');
    }
  });
});
