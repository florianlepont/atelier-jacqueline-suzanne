import { test, expect } from '@playwright/test';

// RED (Wave 0): no BaseLayout/chrome/switcher/pages exist yet beyond the bare
// French placeholder homepage from Plan 01-01 Task 1. These assertions target
// the real contracts built in Plans 03/04 and are expected to FAIL until then
// — do not stub or weaken them to make them pass early.

const COOKIE_NAME = 'ajs_locale';

test.describe('locale content', () => {
  test('French chrome and placeholder homepage render at "/"', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    const header = page.locator('[data-role="site-header"]');
    await expect(header).toBeVisible();
    // quick-260726-obg: the homepage footer is present in the DOM but
    // hidden while in carousel mode (the default display mode) — reachable
    // via grid mode. See "footer visibility by display mode
    // (quick-260726-obg)" in homepage-chrome-nav.spec.ts for the full contract.
    await expect(page.locator('body > footer')).toHaveCount(1);
    await expect(page.locator('body > footer')).toBeHidden();

    // I18N-04/D-07/D-08: exactly one switcher link (the other language),
    // no separator, accessible name contains "EN", and a leading globe svg.
    const switcher = header.locator('.language-switcher');
    await expect(switcher.locator('.switcher-link')).toHaveCount(1);
    await expect(switcher.locator('.switcher-separator')).toHaveCount(0);
    const switcherLink = switcher.getByRole('link', { name: 'EN' });
    await expect(switcherLink).toHaveCount(1);
    await expect(switcherLink.locator('svg')).toHaveCount(1);
  });

  test('English chrome and placeholder homepage render at "/en/"', async ({ page }) => {
    await page.goto('/en/');

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    const header = page.locator('[data-role="site-header"]');
    await expect(header).toBeVisible();
    // quick-260726-obg: same carousel-mode footer contract as the French
    // case above.
    await expect(page.locator('body > footer')).toHaveCount(1);
    await expect(page.locator('body > footer')).toBeHidden();

    // I18N-04/D-07/D-08: single switcher link, no separator, accessible
    // name contains "FR" on the English page.
    const switcher = header.locator('.language-switcher');
    await expect(switcher.locator('.switcher-link')).toHaveCount(1);
    await expect(switcher.locator('.switcher-separator')).toHaveCount(0);
    const switcherLink = switcher.getByRole('link', { name: 'FR' });
    await expect(switcherLink).toHaveCount(1);
    await expect(switcherLink.locator('svg')).toHaveCount(1);
  });

  test('site-title/nav/footer copy differs between the French and English pages', async ({ page }) => {
    await page.goto('/');
    const frHeader = await page.locator('[data-role="site-header"]').innerText();
    // quick-260726-obg: the footer is hidden in carousel mode (the default)
    // — innerText() of a display:none element is always '', so switch to
    // grid mode first to read its real rendered text.
    await page.getByRole('button', { name: 'Grille' }).click();
    const frFooter = await page.locator('body > footer').innerText();

    await page.goto('/en/');
    const enHeader = await page.locator('[data-role="site-header"]').innerText();
    await page.getByRole('button', { name: 'Grid' }).click();
    const enFooter = await page.locator('body > footer').innerText();

    expect(enHeader).not.toBe(frHeader);
    expect(enFooter).not.toBe(frFooter);
  });
});

test.describe('homepage structural contract parity (quick-260811-kog-02)', () => {
  // src/pages/index.astro and src/pages/en/index.astro used to duplicate
  // an entire page implementation; both now render through the shared
  // HomePage.astro + buildHomePageModel(). These assert that unification
  // didn't quietly merge or cross-wire the two locales' public contracts.

  test('each homepage canonicalizes to itself, and both list the same fr/en/x-default alternates', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/$/);
    const frAlternateFr = await page.locator('link[rel="alternate"][hreflang="fr"]').getAttribute('href');
    const frAlternateEn = await page.locator('link[rel="alternate"][hreflang="en"]').getAttribute('href');

    await page.goto('/en/');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/en\/$/);
    const enAlternateFr = await page.locator('link[rel="alternate"][hreflang="fr"]').getAttribute('href');
    const enAlternateEn = await page.locator('link[rel="alternate"][hreflang="en"]').getAttribute('href');

    // The alternate set itself (which URL is "the French one", which is
    // "the English one") must not depend on which locale is currently
    // being viewed.
    expect(enAlternateFr).toBe(frAlternateFr);
    expect(enAlternateEn).toBe(frAlternateEn);
    expect(frAlternateFr).toMatch(/\/$/);
    expect(frAlternateFr).not.toMatch(/\/en\/$/);
    expect(frAlternateEn).toMatch(/\/en\/$/);
  });

  test('?view=grid persists the grid view on both locales', async ({ page }) => {
    await page.goto('/?view=grid');
    await expect(page.locator('.home-grid')).toBeVisible();
    await expect(page.locator('[data-role="home-carousel"]')).toBeHidden();

    await page.goto('/en/?view=grid');
    await expect(page.locator('.home-grid')).toBeVisible();
    await expect(page.locator('[data-role="home-carousel"]')).toBeHidden();
  });

  test('the French homepage never shows English-only nav copy, and vice versa', async ({ page }) => {
    await page.goto('/');
    const frBody = await page.locator('body').innerText();
    expect(frBody).not.toContain('About');
    expect(frBody).not.toContain('Photographer');

    await page.goto('/en/');
    const enBody = await page.locator('body').innerText();
    expect(enBody).not.toContain('À propos');
    expect(enBody).not.toContain('Photographe');
  });

  test('both locales list the same gallery slugs, each linked through its own locale-prefixed path', async ({
    page,
  }) => {
    await page.goto('/');
    const frLinks = await page.locator('a[href*="/galleries/"]').evaluateAll((links) =>
      links.map((link) => (link as HTMLAnchorElement).getAttribute('href')),
    );

    await page.goto('/en/');
    const enLinks = await page.locator('a[href*="/galleries/"]').evaluateAll((links) =>
      links.map((link) => (link as HTMLAnchorElement).getAttribute('href')),
    );

    expect(frLinks.length).toBeGreaterThan(0);
    expect(enLinks.length).toBeGreaterThan(0);
    expect(frLinks.some((href) => href?.startsWith('/en/'))).toBe(false);
    expect(enLinks.every((href) => href?.startsWith('/en/galleries/'))).toBe(true);

    const frSlugs = frLinks.map((href) => href?.replace(/^\/galleries\//, '')).sort();
    const enSlugs = enLinks.map((href) => href?.replace(/^\/en\/galleries\//, '')).sort();
    expect(enSlugs).toEqual(frSlugs);
  });
});

test.describe('switcher', () => {
  test('clicking the switcher from "/" navigates to "/en/"', async ({ page }) => {
    await page.goto('/');
    await page.locator('header').getByRole('link', { name: 'EN' }).click();

    await expect(page).toHaveURL(/\/en\/$/);
  });

  test('clicking the switcher from "/en/" navigates back to "/"', async ({ page }) => {
    await page.goto('/en/');
    await page.locator('header').getByRole('link', { name: 'FR' }).click();

    await expect(page).toHaveURL(/\/$/);
  });

  test(`clicking to English sets the ${COOKIE_NAME} cookie to "en"`, async ({ page, context }) => {
    await page.goto('/');
    await page.locator('header').getByRole('link', { name: 'EN' }).click();
    await expect(page).toHaveURL(/\/en\/$/);

    const cookies = await context.cookies();
    const localeCookie = cookies.find((cookie) => cookie.name === COOKIE_NAME);

    expect(localeCookie?.value).toBe('en');
  });

  test(`visiting "/" with a pre-set ${COOKIE_NAME}=en cookie redirects to "/en/"`, async ({ browser, baseURL }) => {
    const context = await browser.newContext();
    await context.addCookies([
      {
        name: COOKIE_NAME,
        value: 'en',
        url: baseURL,
      },
    ]);

    const page = await context.newPage();
    await page.goto('/');

    await expect(page).toHaveURL(/\/en\/$/);
    await context.close();
  });
});
