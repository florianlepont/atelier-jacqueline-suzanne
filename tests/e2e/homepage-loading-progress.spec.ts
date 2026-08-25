import { test, expect } from '@playwright/test';

test.describe('progressive image loading (HOME-09)', () => {
  test('shell renders immediately without waiting on images', async ({ page }) => {
    await page.goto('/');

    const header = page.locator('[data-role="site-header"]');
    await expect(header).toBeVisible();
    const nav = page.locator('.site-nav');
    await expect(nav).toBeVisible();
    const toggle = page.locator('[data-role="mode-toggle"]');
    await expect(toggle).toBeVisible();
  });

  test('hero image is requested with high priority', async ({ page }) => {
    await page.goto('/');

    const heroImg = page.locator('[data-role="hero-image"]');
    await expect(heroImg).toHaveAttribute('fetchpriority', 'high');
    await expect(heroImg).not.toHaveAttribute('loading', 'lazy');
    await expect(heroImg).toHaveAttribute('srcset', /480w.*2000w/);
    await expect(heroImg).toHaveAttribute('sizes', '100vw');
  });

  test('hero blur-up: placeholder present and sharp fades in on first paint and after a swap', async ({ page }) => {
    await page.clock.install();
    await page.goto('/');

    const placeholder = page.locator('[data-role="hero-image-placeholder"]');
    await expect(placeholder).toHaveAttribute('src', /cdn\.sanity\.io/);

    const heroImg = page.locator('[data-role="hero-image"]');
    await expect(heroImg).toHaveClass(/is-loaded/);

    // Trigger a swap via the mocked-clock auto-advance pattern (D-09) and
    // confirm the sharp image reaches is-loaded again after the swap — the
    // is-loaded class must be removed and re-added, not left stale from the
    // previous gallery's photo (D-02).
    await page.clock.fastForward(6000);
    await expect(heroImg).toHaveClass(/is-loaded/);
  });

  test('grid tile blur-up: tiles carry a placeholder layer and gain is-loaded', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();

    const tiles = page.locator('a.home-grid__tile');
    expect(await tiles.count()).toBeGreaterThan(0);
    for (const tile of await tiles.all()) {
      // Sharp tile images use loading="lazy" (D-03) — scroll each tile into
      // view first so its request actually fires, regardless of how many
      // galleries exist or how many fit in the initial viewport.
      await tile.scrollIntoViewIfNeeded();
      const placeholder = tile.locator('.home-grid__tile-img-placeholder');
      await expect(placeholder).toHaveAttribute('src', /cdn\.sanity\.io/);
      const sharp = tile.locator('.home-grid__tile-img--sharp');
      await expect(sharp).toHaveAttribute('srcset', /320w.*900w/);
      await expect(sharp).toHaveClass(/is-loaded/);
    }
  });

  test('grid tiles stay lazy after this phase', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();

    const sharpTiles = page.locator('.home-grid__tile-img--sharp');
    expect(await sharpTiles.count()).toBeGreaterThan(0);
    for (const img of await sharpTiles.all()) {
      await expect(img).toHaveAttribute('loading', 'lazy');
    }
  });

  test('next-gallery hero photo is prefetched to warm the cache before the next swap (D-05)', async ({ page }) => {
    await page.goto('/');

    const dataItems = page.locator('ul[data-role="home-carousel-data"] li');
    const count = await dataItems.count();
    test.skip(count < 2, 'need at least 2 galleries to verify prefetch of the next one');
    const nextHeroSrc = await dataItems.nth(1).getAttribute('data-hero-src');
    expect(nextHeroSrc).toBeTruthy();

    // render() (called once immediately on script init, before any auto-advance
    // tick) prefetches galleries[(index+1) % length]'s hero photo via `new
    // Image()` (D-05) so it's already cache-warm before a swap ever happens.
    // Reload and confirm the browser actually issues that request — a
    // predicate (not a glob string) avoids Sanity CDN query-string characters
    // being misinterpreted as glob wildcards.
    const nextHeroPath = new URL(nextHeroSrc!).pathname;
    const prefetchRequest = page.waitForRequest((req) => new URL(req.url()).pathname === nextHeroPath, { timeout: 5000 });
    await page.reload();
    const request = await prefetchRequest;
    expect(new URL(request.url()).pathname).toBe(nextHeroPath);
  });
});

test.describe('carousel progress fill (quick-260725-dcg)', () => {
  // matrix(a, b, c, d, e, f) — for a pure scaleX(t) transform this is
  // matrix(t, 0, 0, 1, 0, 0), so the fill's progress is the matrix's first
  // component. A dash with no active fill computes 'none', which counts
  // as 0 progress.
  function scaleXFromTransform(transform: string): number {
    if (transform === 'none') return 0;
    const match = transform.match(/^matrix\(([^,]+),/);
    return match ? parseFloat(match[1]) : 0;
  }

  test('the current dash carries a 6s linear fill animation that progresses', async ({ page }) => {
    await page.goto('/');

    const filling = page.locator('.home-hero__progress-dash.is-filling');
    await expect(filling).toHaveCount(1);

    const config = await filling.evaluate((el) => {
      const style = getComputedStyle(el, '::after');
      return { animationName: style.animationName, animationDuration: style.animationDuration };
    });
    expect(config.animationName).toContain('home-progress-fill');
    expect(config.animationDuration).toBe('6s');

    await expect
      .poll(async () => {
        const transform = await filling.evaluate((el) => getComputedStyle(el, '::after').transform);
        return scaleXFromTransform(transform);
      })
      .toBeGreaterThan(0);
  });

  test('the explicit pause toggle freezes the fill and resuming un-freezes it', async ({ page }) => {
    await page.goto('/');

    const filling = page.locator('.home-hero__progress-dash.is-filling');
    const toggle = page.locator('[data-role="autoplay-toggle"]');

    await toggle.click();
    await expect
      .poll(() => filling.evaluate((el) => getComputedStyle(el, '::after').animationPlayState))
      .toBe('paused');

    await toggle.click();
    await expect
      .poll(() => filling.evaluate((el) => getComputedStyle(el, '::after').animationPlayState))
      .toBe('running');
  });

  test('manual navigation relocates and restarts the fill on the newly-current dash', async ({ page }) => {
    await page.goto('/');

    const dashes = page.locator('.home-hero__progress-dash');
    const dashCount = await dashes.count();
    // The last dash is guaranteed to differ from the first whenever more
    // than one exists, and — unlike a fixed index — reordering or removing
    // galleries in Sanity Studio can never change which dash this targets.
    test.skip(dashCount < 2, 'needs at least 2 galleries to navigate to a differing dash');
    const targetIndex = dashCount - 1;

    await dashes.nth(targetIndex).click();

    await expect(dashes.nth(targetIndex)).toHaveClass(/is-filling/);
    const nameOnCurrent = await dashes
      .nth(targetIndex)
      .evaluate((el) => getComputedStyle(el, '::after').animationName);
    expect(nameOnCurrent).toContain('home-progress-fill');

    const nameOnFirst = await dashes.nth(0).evaluate((el) => getComputedStyle(el, '::after').animationName);
    expect(nameOnFirst).toBe('none');
  });

  test('reduced motion shows no animated fill on the current dash', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    const current = page.locator('.home-hero__progress-dash[aria-current="true"]');
    await expect
      .poll(() => current.evaluate((el) => getComputedStyle(el, '::after').display))
      .toBe('none');
  });

  test('EN: the filling dash also carries the fill animation', async ({ page }) => {
    await page.goto('/en/');

    const filling = page.locator('.home-hero__progress-dash.is-filling');
    await expect(filling).toHaveCount(1);
    const name = await filling.evaluate((el) => getComputedStyle(el, '::after').animationName);
    expect(name).toContain('home-progress-fill');
  });
});
