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
    await expect(page.locator('[data-role="home-header"]')).toBeVisible();
    await expect(page.locator('body > footer')).toBeVisible();
    await expect(page.locator('[data-role="home-header"]')).toContainText('FR | EN');
  });

  test('English chrome and placeholder homepage render at "/en/"', async ({ page }) => {
    await page.goto('/en/');

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('[data-role="home-header"]')).toBeVisible();
    await expect(page.locator('body > footer')).toBeVisible();
    await expect(page.locator('[data-role="home-header"]')).toContainText('FR | EN');
  });

  test('site-title/nav/footer copy differs between the French and English pages', async ({ page }) => {
    await page.goto('/');
    const frHeader = await page.locator('[data-role="home-header"]').innerText();
    const frFooter = await page.locator('body > footer').innerText();

    await page.goto('/en/');
    const enHeader = await page.locator('[data-role="home-header"]').innerText();
    const enFooter = await page.locator('body > footer').innerText();

    expect(enHeader).not.toBe(frHeader);
    expect(enFooter).not.toBe(frFooter);
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
