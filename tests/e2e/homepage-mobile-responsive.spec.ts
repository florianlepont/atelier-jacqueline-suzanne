import { test, expect, devices } from '@playwright/test';

test.describe('mobile hero visibility (D-08)', () => {
  test('hero renders visibly at a 375px-wide viewport, not collapsed/blank', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const hero = page.locator('.home-hero');
    await expect(hero).toBeVisible();
    const heroBox = await hero.boundingBox();
    expect(heroBox?.height ?? 0).toBeGreaterThan(300);

    const heroImage = page.locator('[data-role="hero-image"]');
    await expect(heroImage).toBeVisible();
    const imageBox = await heroImage.boundingBox();
    expect(imageBox?.height ?? 0).toBeGreaterThan(0);

    // Regression guard for the root cause found while fixing D-08: on
    // mobile the accent panel (wordmark/intro) used to become a
    // statically-positioned box, dropping it out of the stacking layer
    // that the (opaque) hero photo paints in — visually burying the
    // accent panel's content under the photo even though every element
    // individually reported non-zero size/visibility. Per D-10 the CTA
    // that used to exercise this is gone, so the wordmark itself is the
    // regression witness now.
    const wordmark = page.locator('.home-hero__wordmark');
    await expect(wordmark).toBeVisible();

    await page.getByRole('button', { name: 'Grille' }).click();
    await expect(page.locator('[data-role="home-grid"]')).toBeVisible();
  });
});

test.describe('narrow-phone header regression', () => {
  test('the full header stays on one row without horizontal overflow at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto('/');

    const measurements = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      headerHeight: document.querySelector<HTMLElement>('[data-role="site-header"]')?.getBoundingClientRect().height ?? 0,
    }));

    expect(measurements.scrollWidth).toBeLessThanOrEqual(measurements.clientWidth);
    expect(measurements.headerHeight).toBeLessThanOrEqual(80);
    await expect(page.getByRole('link', { name: /Passer en anglais/ })).toBeVisible();
  });
});

test.describe('mobile full-bleed hero regression (HOME-06)', () => {
  // defaultBrowserType is stripped from the device descriptor before
  // spreading — the suite has a single chromium project (playwright.config.ts),
  // and Playwright refuses test.use({ defaultBrowserType }) inside a describe
  // block (it would force a dedicated worker/browser per D-11's own note:
  // engine stays chromium, only viewport/isMobile/hasTouch/UA are emulated).
  const { defaultBrowserType: _defaultBrowserType, ...iPhone14Pro } = devices['iPhone 14 Pro'];
  test.use({ ...iPhone14Pro });

  test('at an iPhone viewport, on first load the hero is full-bleed with no gap above the header and no footer bleed-through, and the morph stays active', async ({ page }) => {
    await page.goto('/');

    const header = page.locator('[data-role="site-header"]');
    const photo = page.locator('.home-hero__photo');
    await expect(header).toBeVisible();
    await expect(photo).toBeVisible();

    const headerBox = await header.boundingBox();
    const photoBox = await photo.boundingBox();
    expect(headerBox).not.toBeNull();
    expect(photoBox).not.toBeNull();
    // No white gap above the header: both the header and the hero photo
    // sit flush against the top of the viewport (the header overlays the
    // photo, it doesn't push it down).
    expect(Math.abs(headerBox!.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(photoBox!.y)).toBeLessThanOrEqual(1);

    const viewportSize = page.viewportSize();
    expect(viewportSize).not.toBeNull();
    // Hero fills the small viewport: min-height:100svh should make the
    // photo at least as tall as the visible (chrome-showing) viewport.
    expect(photoBox!.height).toBeGreaterThanOrEqual(viewportSize!.height - 2);

    // quick-260726-obg: the footer is now hidden entirely in carousel mode
    // (Task 2's reintroduced footer-hide) rather than merely pushed below
    // the fold — display:none satisfies toBeHidden() and fully rules out
    // any bleed-through, present in the DOM (BaseLayout.astro always
    // renders <footer> regardless of headerVariant) but not painted.
    const footer = page.locator('footer');
    await expect(footer).toHaveCount(1);
    await expect(footer).toBeHidden();

    // D-12 guard: the carousel/grid morph must stay active on mobile — not
    // desktop/pointer:fine-gated.
    const supportsViewTransitions = await page.evaluate(() => typeof document.startViewTransition === 'function');
    expect(supportsViewTransitions).toBe(true);

    const carousel = page.locator('[data-role="home-carousel"]');
    const grid = page.locator('[data-role="home-grid"]');
    await expect(carousel).toBeVisible();
    await page.getByRole('button', { name: 'Grille' }).click();
    await expect(carousel).toBeHidden();
    await expect(grid).toBeVisible();
  });
});

test.describe('tall-desktop full-bleed hero regression', () => {
  test('at 1280x1320 the photo fills the initial viewport and the footer is hidden (quick-260726-obg)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1320 });
    await page.goto('/');

    const viewportSize = page.viewportSize();
    expect(viewportSize).not.toBeNull();

    const photoBox = await page.locator('.home-hero__photo').boundingBox();
    expect(photoBox).not.toBeNull();
    expect(photoBox!.height).toBeGreaterThanOrEqual(viewportSize!.height - 2);

    // quick-260726-obg: the footer is hidden in carousel mode (Task 2's
    // reintroduced footer-hide), not merely below the fold.
    await expect(page.locator('footer')).toBeHidden();
  });
});
