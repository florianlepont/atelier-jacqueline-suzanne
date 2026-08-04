import { test, expect } from '@playwright/test';

// Phase 21 (HOME-14/HOME-15, 21-03): this test used to assert the D-08
// mobile hero photo, wordmark, and a mode-toggle click at a 375px-wide
// viewport. Phase 21 replaces the phone-width carousel/grid with a
// scroll-snapped deck (mode-toggle retired below 767px per success
// criterion 1), so those structural claims no longer apply at this width.
// Equivalent phone-width homepage structural coverage lives in
// tests/e2e/homepage-scroll-deck.spec.ts (created by plan 21-04).

test.describe('narrow-phone header regression', () => {
  // HOME-13 (Phase 20): the trailing assertion used to be an UNSCOPED
  // getByRole locator matching the switcher's sr-only "switch to English"
  // hint text. After plan 20-03 the mobile nav panel renders a SECOND
  // <LanguageSwitcher>, so that unscoped locator would resolve to two
  // elements and trip Playwright strict mode regardless of visibility.
  // Replaced with a locator scoped to [data-role="site-header"] asserted
  // via toHaveCount(1) — a count that stays 1 both today and after plan
  // 20-03, because the panel's own switcher renders OUTSIDE the
  // <header data-role="site-header"> element.
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
    await expect(
      page.locator('[data-role="site-header"] .language-switcher .switcher-link')
    ).toHaveCount(1);
  });

  // HOME-13 (Phase 20): preserves the switcher-reachability-at-320px
  // contract on pages that keep the inline nav at every viewport — /about/
  // never grows a second panel-owned switcher, so its scoped locator stays
  // both count-1 and visible, unlike the homepage's after plan 20-03.
  test('the inline-nav language switcher is visible on /about/ at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto('/about/');

    await expect(
      page.locator('[data-role="site-header"] .language-switcher .switcher-link')
    ).toBeVisible();
  });
});

// Phase 21 (21-03): this block used to assert, at an iPhone 14 Pro viewport,
// that the D-08 hero photo was full-bleed, the footer was hidden, and the
// mode-toggle worked. All of these are specific to the retired phone-width
// carousel. In particular the footer-hidden claim is directly REVERSED by
// D-08 (this phase's own decision, not the old HOME-06 one): the new
// scroll-snapped deck requires the footer to be reachable after the last
// gallery slide, so a future reader must not "restore" this block expecting
// the footer to stay hidden — that would now be the wrong behavior.
// Equivalent phone-width structural coverage lives in
// tests/e2e/homepage-scroll-deck.spec.ts (plan 21-04).

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
