import { test, expect } from '@playwright/test';

// RED (Wave 0): the real homepage (hero carousel + grid toggle) does not exist
// yet — the current "/" is still Phase 1's bare placeholder homepage. These
// assertions target the contracts locked in 04.1-CONTEXT.md (D-08 carousel +
// grid toggle, D-09 auto-advance/pause, D-12 only-migrated-galleries) and
// 04.1-UI-SPEC.md, built in Plan 04.1-04. They are expected to FAIL until then
// — do not stub or weaken them to make them pass early.

test.describe('homepage carousel', () => {
  test('carousel root renders and shows the first migrated gallery', async ({ page }) => {
    await page.goto('/');

    const carousel = page.locator('[data-role="home-carousel"]');
    await expect(carousel).toBeVisible();
    await expect(carousel.locator('[data-role="gallery-title"]')).toHaveText(/.+/);
    await expect(carousel.locator('[data-role="hero-image"]')).toHaveAttribute('src', /cdn\.sanity\.io/);
  });
});

test.describe('only galleries with photos appear (D-12)', () => {
  test('every rendered gallery tile has a real image and a destination', async ({ page }) => {
    await page.goto('/');

    // The carousel shows one slide's title at a time by design, so "all
    // migrated galleries are reachable" is checked in grid mode, where every
    // gallery renders as its own visible tile simultaneously.
    await page.getByRole('button', { name: 'Grille' }).click();
    const tiles = page.locator('a.home-grid__tile');
    expect(await tiles.count()).toBeGreaterThan(0);
    for (const tile of await tiles.all()) {
      await expect(tile).toHaveAttribute('href', /\/galleries\/[^/]+\/?$/);
      // HOME-09 added a blurred placeholder <img> sibling beneath the sharp
      // tile image (both share the `img` tag) — scope to the sharp layer,
      // which is the one that must carry the real gallery photo.
      await expect(tile.locator('.home-grid__tile-img--sharp')).toHaveAttribute('src', /cdn\.sanity\.io/);
      await expect(tile.locator('.home-grid__tile-title')).toHaveText(/.+/);
    }
  });
});

test.describe('carousel/grid display mode toggle (D-08)', () => {
  test('toggling to grid reveals a 2-column grid of gallery tiles; toggling back returns the hero carousel', async ({
    page,
  }) => {
    await page.goto('/');

    const carousel = page.locator('[data-role="home-carousel"]');
    await expect(carousel).toBeVisible();

    await page.getByRole('button', { name: 'Grille' }).click();

    await expect(carousel).toBeHidden();
    // Scope to the grid container: the (now-hidden) carousel hero heading
    // also matches these gallery-name patterns, and an unscoped getByText
    // would resolve to whichever DOM node comes first regardless of
    // visibility, not necessarily the visible grid tile.
    const grid = page.locator('[data-role="home-grid"]');
    await expect(grid.getByText(/silos/i).first()).toBeVisible();
    await expect(grid.getByText(/brume/i).first()).toBeVisible();

    await page.getByRole('button', { name: 'Carrousel' }).click();
    await expect(carousel).toBeVisible();
  });
});

test.describe('auto-advance + pause (D-09)', () => {
  test('carousel index advances every 6000ms and pauses on hover, using a mocked clock', async ({ page }) => {
    await page.clock.install();
    await page.goto('/');

    const carousel = page.locator('[data-role="home-carousel"]');
    const indexLabel = carousel.getByText(/^\d{2} \/ \d{2}$/);
    await expect(indexLabel).toBeVisible();

    const initialLabel = await indexLabel.innerText();
    await page.clock.fastForward(6000);
    await expect(indexLabel).not.toHaveText(initialLabel);

    // Pause on hover/focus: capture the label right after the auto-advance,
    // hover the carousel root, advance the mocked clock again, and confirm
    // the label did NOT change while hovered.
    const labelAfterFirstAdvance = await indexLabel.innerText();
    await carousel.hover();
    await page.clock.fastForward(6000);
    await expect(indexLabel).toHaveText(labelAfterFirstAdvance);
  });

  test('the explicit pause control persists after pointer movement and can resume playback', async ({ page }) => {
    await page.clock.install();
    await page.goto('/');

    const indexLabel = page.locator('[data-role="index-label"]');
    const pauseButton = page.locator('[data-role="autoplay-toggle"]');
    const initialLabel = await indexLabel.innerText();

    await expect(pauseButton).toHaveAttribute('aria-label', 'Mettre le carrousel en pause');
    await pauseButton.click();
    await expect(pauseButton).toHaveAttribute('aria-pressed', 'true');
    await expect(pauseButton).toHaveAttribute('aria-label', 'Relancer le carrousel');
    await page.mouse.move(0, 0);
    await page.clock.fastForward(12000);
    await expect(indexLabel).toHaveText(initialLabel);

    await pauseButton.click();
    await expect(pauseButton).toHaveAttribute('aria-pressed', 'false');
    await page.clock.fastForward(6000);
    await expect(indexLabel).not.toHaveText(initialLabel);
  });

  test('reduced-motion visitors start with automatic playback paused', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.clock.install();
    await page.goto('/');

    const indexLabel = page.locator('[data-role="index-label"]');
    const initialLabel = await indexLabel.innerText();
    await expect(page.getByRole('button', { name: 'Relancer le carrousel' })).toHaveAttribute('aria-pressed', 'true');
    await page.clock.fastForward(12000);
    await expect(indexLabel).toHaveText(initialLabel);
  });
});

test.describe('i18n non-regression guard', () => {
  test('homepage header still exposes the one-link switcher and differs between locales', async ({ page }) => {
    await page.goto('/');

    const header = page.locator('[data-role="site-header"]');
    await expect(header).toBeVisible();
    // I18N-04/D-07/D-08: single switcher link (other language), no
    // separator, accessible name contains "EN" on the French homepage.
    const switcher = header.locator('.language-switcher');
    await expect(switcher.locator('.switcher-link')).toHaveCount(1);
    await expect(switcher.locator('.switcher-separator')).toHaveCount(0);
    await expect(switcher.getByRole('link', { name: 'EN' })).toHaveCount(1);
    const frHeaderText = await header.innerText();

    await page.goto('/en/');
    const enHeaderText = await page.locator('[data-role="site-header"]').innerText();

    expect(enHeaderText).not.toBe(frHeaderText);
  });
});

test.describe('single unified mode toggle (HOME-01, D-01/D-02)', () => {
  test('exactly one toggle button exists and its accessible name flips with display mode', async ({ page }) => {
    await page.goto('/');

    const toggle = page.locator('[data-role="mode-toggle"]');
    await expect(toggle).toHaveCount(1);
    await expect(page.locator('.home-toggle__btn')).toHaveCount(0);

    await expect(toggle).toHaveAttribute('aria-label', 'Grille');

    await toggle.click();
    await expect(page.locator('[data-role="home-carousel"]')).toBeHidden();
    await expect(page.locator('[data-role="home-grid"]')).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-label', 'Carrousel');

    await toggle.click();
    await expect(page.locator('[data-role="home-carousel"]')).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-label', 'Grille');
  });
});

test.describe('grid hero-as-first-tile (HOME-02, D-04/D-06)', () => {
  test('the old intro band is gone; the grid hero is a non-link first tile', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();

    await expect(page.locator('.home-grid__intro')).toHaveCount(0);

    const firstTile = page.locator('.home-grid__tiles > :first-child');
    await expect(firstTile).toHaveClass(/home-grid__tile--hero/);
    await expect(firstTile).toContainText(/Atelier/);
    const tagName = await firstTile.evaluate((el) => el.tagName);
    expect(tagName).toBe('DIV');
    await expect(firstTile).not.toHaveAttribute('href', /.*/);
  });
});

test.describe('view-transition toggle — reduced-motion still swaps modes', () => {
  test('toggling with prefers-reduced-motion: reduce still functionally swaps carousel/grid', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    const carousel = page.locator('[data-role="home-carousel"]');
    const grid = page.locator('[data-role="home-grid"]');
    await expect(carousel).toBeVisible();

    await page.getByRole('button', { name: 'Grille' }).click();
    await expect(carousel).toBeHidden();
    await expect(grid).toBeVisible();

    await page.getByRole('button', { name: 'Carrousel' }).click();
    await expect(carousel).toBeVisible();
    await expect(grid).toBeHidden();

    const accentPanel = page.locator('[data-role="accent-panel"]');
    await expect(accentPanel).toHaveCSS('opacity', '1');
    await expect
      .poll(() => accentPanel.evaluate((panel) => panel.getAnimations().length))
      .toBe(0);
  });
});

test.describe('view-transition accent-panel sequencing', () => {
  test('keeps the real accent panel hidden through the photo morph, then progressively fades it in', async ({
    page,
  }) => {
    await page.goto('/');

    const supported = await page.evaluate(() => typeof document.startViewTransition === 'function');
    test.skip(!supported, 'document.startViewTransition unsupported in this browser');

    // Capture the transition object so this test can assert the sequencing
    // boundary directly. The real panel must remain hidden for the whole
    // photo morph; relying only on a delayed pseudo-element animation is not
    // portable because WebKit can expose that enter-only animation already
    // at its final time when `ready` resolves.
    await page.evaluate(() => {
      const original = document.startViewTransition.bind(document);
      (window as unknown as { __lastVT: unknown }).__lastVT = null;
      document.startViewTransition = (callback: () => void) => {
        const transition = original(callback);
        (window as unknown as { __lastVT: unknown }).__lastVT = transition;
        return transition;
      };
    });

    const toggle = page.locator('[data-role="mode-toggle"]');
    await toggle.click();
    await page.evaluate(async () => {
      const transition = (window as unknown as {
        __lastVT: { finished: Promise<void> };
      }).__lastVT;
      await transition.finished;
    });

    await page.evaluate(() => {
      document.querySelector<HTMLButtonElement>('[data-role="mode-toggle"]')?.click();
    });
    await page.evaluate(async () => {
      const transition = (window as unknown as {
        __lastVT: { ready: Promise<void> };
      }).__lastVT;
      await transition.ready;
    });

    const accentPanel = page.locator('[data-role="accent-panel"]');
    await expect(accentPanel).toHaveCSS('opacity', '0');

    const fadeOpacities = await page.evaluate(async () => {
      const transition = (window as unknown as {
        __lastVT: { finished: Promise<void> };
      }).__lastVT;
      await transition.finished;

      const panel = document.querySelector<HTMLElement>('[data-role="accent-panel"]');
      if (!panel) return null;

      const fade = panel.getAnimations().find((animation) => {
        const effect = animation.effect as KeyframeEffect | null;
        return effect?.pseudoElement == null && Number(effect?.getTiming().duration) === 320;
      });
      if (!fade) return null;

      fade.pause();
      const readAt = (time: number) => {
        fade.currentTime = time;
        void panel.offsetHeight;
        return parseFloat(getComputedStyle(panel).opacity);
      };

      const samples = {
        start: readAt(0),
        halfway: readAt(160),
        end: readAt(320),
      };
      fade.finish();
      await Promise.resolve();
      return samples;
    });

    expect(fadeOpacities).not.toBeNull();
    expect(fadeOpacities!.start).toBeLessThanOrEqual(0.05);
    expect(fadeOpacities!.halfway).toBeGreaterThan(0.05);
    expect(fadeOpacities!.halfway).toBeLessThan(0.95);
    expect(fadeOpacities!.end).toBeGreaterThanOrEqual(0.95);
    await expect(accentPanel).toHaveCSS('opacity', '1');
  });
});

test.describe('square mode-toggle box (HOME-05)', () => {
  test('carousel mode: .home-toggle__box is a square and .home-toggle clears the 44px tap-target floor', async ({ page }) => {
    await page.goto('/');

    const box = page.locator('.home-toggle__box');
    const boxBox = await box.boundingBox();
    expect(boxBox).not.toBeNull();
    expect(Math.abs((boxBox!.width ?? 0) - (boxBox!.height ?? 0))).toBeLessThanOrEqual(1);

    const toggle = page.locator('[data-role="mode-toggle"]');
    const toggleBox = await toggle.boundingBox();
    expect(toggleBox).not.toBeNull();
    expect(toggleBox!.width).toBeGreaterThanOrEqual(44);
    expect(toggleBox!.height).toBeGreaterThanOrEqual(44);
  });

  test('grid mode: .home-toggle__box remains a square', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();

    const box = page.locator('.home-toggle__box');
    const boxBox = await box.boundingBox();
    expect(boxBox).not.toBeNull();
    expect(Math.abs((boxBox!.width ?? 0) - (boxBox!.height ?? 0))).toBeLessThanOrEqual(1);
  });

  test('the visible border lives on .home-toggle__box and the single-toggle contract is unchanged', async ({ page }) => {
    await page.goto('/');

    const box = page.locator('.home-toggle__box');
    const borderWidth = await box.evaluate((el) => parseFloat(getComputedStyle(el).borderWidth));
    expect(borderWidth).toBeGreaterThan(0);

    await expect(page.locator('[data-role="mode-toggle"]')).toHaveCount(1);
    await expect(page.locator('.home-toggle__btn')).toHaveCount(0);
  });
});

test.describe('mode-toggle icon color regression (HOME-10-REGRESSION)', () => {
  test('carousel mode: .home-toggle__box and morph-cell render white', async ({ page }) => {
    await page.goto('/');

    const boxColor = await page.locator('.home-toggle__box').evaluate((el) => getComputedStyle(el).color);
    expect(boxColor).toBe('rgb(255, 255, 255)');

    const cellColor = await page
      .locator('.home-toggle__morph-cell')
      .first()
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(cellColor).toBe('rgb(255, 255, 255)');
  });

  test('grid mode: .home-toggle__box and morph-cell render ink (no regression)', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();

    await expect
      .poll(() => page.locator('.home-toggle__box').evaluate((el) => getComputedStyle(el).color))
      .toBe('rgb(26, 26, 26)');

    await expect
      .poll(() =>
        page
          .locator('.home-toggle__morph-cell')
          .first()
          .evaluate((el) => getComputedStyle(el).backgroundColor)
      )
      .toBe('rgb(26, 26, 26)');
  });
});
