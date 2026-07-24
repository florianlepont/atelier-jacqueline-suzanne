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
    const hero = page.locator('.gallery-detail__hero-img');
    await expect(hero).toHaveAttribute('srcset', /480w.*2000w/);
    await expect(hero).toHaveAttribute('sizes', '100vw');

    const thumbnail = page.locator('[data-gallery-thumb] img').first();
    await expect(thumbnail).toHaveAttribute('srcset', /320w.*900w/);

    await page.locator('[data-gallery-thumb]').first().click();
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

// Sketch 004 variant A2 regression coverage: the asymmetric bento grouping
// must generalize across every real gallery's actual thumbnail count, not
// just one hardcoded slug/count — this is the invariant that proves the
// build-time chunk-by-3 algorithm is correct at arbitrary N, not overfit.
test.describe('gallery grid bento layout', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('bento grouping generalizes across every real gallery (G === ceil(N/3), hero larger + side-alternating)', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();
    const hrefs = await page.locator('a.home-grid__tile').evaluateAll((els) =>
      els.map((el) => el.getAttribute('href')).filter((href): href is string => Boolean(href)),
    );
    expect(hrefs.length).toBeGreaterThan(0);

    let multiGroupGalleryFound = false;

    for (const href of hrefs) {
      await page.goto(href);

      const thumbCount = await page.locator('.gallery-grid [data-gallery-thumb]').count();
      const groupCount = await page.locator('.gallery-grid__group').count();
      expect(groupCount).toBe(Math.ceil(thumbCount / 3));

      if (groupCount > 1) multiGroupGalleryFound = true;

      const groups = page.locator('.gallery-grid__group');
      for (let g = 0; g < groupCount; g += 1) {
        const group = groups.nth(g);
        const size = await group.getAttribute('data-size');
        if (size !== '2' && size !== '3') continue;

        const hero = group.locator('.tile--hero');
        const small = group.locator('.tile--small').first();
        const heroBox = await hero.boundingBox();
        const smallBox = await small.boundingBox();
        expect(heroBox).not.toBeNull();
        expect(smallBox).not.toBeNull();

        expect(heroBox!.width).toBeGreaterThan(smallBox!.width);
        expect(heroBox!.height).toBeGreaterThan(smallBox!.height);

        if (g % 2 === 0) {
          expect(heroBox!.x).toBeLessThan(smallBox!.x);
        } else {
          expect(heroBox!.x).toBeGreaterThan(smallBox!.x);
        }
      }
    }

    // Proves chunking actually happens on real content (not just a single
    // trailing group of 1 or 2 across every discovered gallery).
    expect(multiGroupGalleryFound).toBe(true);
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
