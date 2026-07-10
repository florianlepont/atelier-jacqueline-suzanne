import { test, expect } from '@playwright/test';

// RED (Wave 0): src/pages/mentions-legales.astro, src/pages/en/mentions-legales.astro,
// src/pages/confidentialite.astro, src/pages/en/confidentialite.astro, and the footer
// legal nav in BaseLayout.astro do not exist yet. This file covers the WHOLE Phase 4
// contract (LEGAL-01 mentions légales, LEGAL-03 privacy policy, LEGAL-05 cookie/consent
// disclosure) in one Wave 0 harness. Plan 04-01 (this plan) builds the mentions-légales
// pages only — the "mentions" and mentions-half of "switcher"/"footer reachability" tests
// are expected to go GREEN by the end of this plan. The "privacy" group and the
// confidentialite half of "switcher"/"footer reachability" are expected to stay RED until
// Plan 04-02 builds the privacy/cookie pages — that is expected, not a bug. Do not stub or
// weaken any assertion to make it pass early.

const COOKIE_NAME = 'ajs_locale';

test.describe('mentions légales page content', () => {
  test('French mentions légales page renders identity, hosting, and status sections at "/mentions-legales/"', async ({
    page,
  }) => {
    await page.goto('/mentions-legales/');

    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.locator('h1')).toContainText('Mentions légales');

    const main = page.locator('main');
    await expect(main).toContainText('Romane Lepont');
    await expect(main).toContainText('Atelier Jacqueline Suzanne');
    await expect(main).toContainText('OVH');
    await expect(main).toContainText('activité individuelle, non immatriculée');
  });

  test('English legal notice page renders identity, hosting, and status sections at "/en/mentions-legales/"', async ({
    page,
  }) => {
    await page.goto('/en/mentions-legales/');

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('h1')).toContainText('Legal notice');

    const main = page.locator('main');
    await expect(main).toContainText('Romane Lepont');
    await expect(main).toContainText('not registered');
  });

  test('Mentions légales copy differs between the French and English pages', async ({ page }) => {
    await page.goto('/mentions-legales/');
    const frMain = await page.locator('main').innerText();

    await page.goto('/en/mentions-legales/');
    const enMain = await page.locator('main').innerText();

    expect(enMain).not.toBe(frMain);
  });
});

test.describe('privacy policy page content', () => {
  test('French privacy policy page renders at "/confidentialite/"', async ({ page }) => {
    await page.goto('/confidentialite/');

    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.locator('h1')).toContainText(/confidentialité/i);

    const main = page.locator('main');
    await expect(main).toContainText('ajs_locale');
    await expect(main).toContainText(/formulaire de contact/i);
  });

  test('English privacy policy page renders at "/en/confidentialite/"', async ({ page }) => {
    await page.goto('/en/confidentialite/');

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('h1')).toContainText(/privacy/i);
  });

  test('Privacy policy copy differs between the French and English pages', async ({ page }) => {
    await page.goto('/confidentialite/');
    const frMain = await page.locator('main').innerText();

    await page.goto('/en/confidentialite/');
    const enMain = await page.locator('main').innerText();

    expect(enMain).not.toBe(frMain);
  });
});

test.describe('cookie disclosure', () => {
  test(`loading the mentions légales page sets no ${COOKIE_NAME} cookie`, async ({ page, context }) => {
    await page.goto('/mentions-legales/');

    const cookies = await context.cookies();
    const localeCookie = cookies.find((cookie) => cookie.name === COOKIE_NAME);

    expect(localeCookie).toBeUndefined();
  });

  test(`loading the privacy policy page sets no ${COOKIE_NAME} cookie`, async ({ page, context }) => {
    await page.goto('/confidentialite/');

    const cookies = await context.cookies();
    const localeCookie = cookies.find((cookie) => cookie.name === COOKIE_NAME);

    expect(localeCookie).toBeUndefined();
  });

  test('no cookie-consent banner element exists on the mentions légales or privacy pages', async ({
    page,
  }) => {
    await page.goto('/mentions-legales/');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByText(/accepter les cookies|accept cookies/i)).toHaveCount(0);

    await page.goto('/confidentialite/');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByText(/accepter les cookies|accept cookies/i)).toHaveCount(0);
  });
});

test.describe('switcher', () => {
  test('clicking the switcher from "/mentions-legales/" navigates to "/en/mentions-legales/"', async ({
    page,
  }) => {
    await page.goto('/mentions-legales/');
    await page.locator('header').getByRole('link', { name: 'EN' }).click();

    // getSwitcherHref strips the trailing slash for non-homepage slugs
    // (src/lib/i18n-paths.ts) — same tolerant pattern as contact.spec.ts.
    await expect(page).toHaveURL(/\/en\/mentions-legales\/?$/);
  });

  test('clicking the switcher from "/en/mentions-legales/" navigates back to "/mentions-legales/"', async ({
    page,
  }) => {
    await page.goto('/en/mentions-legales/');
    await page.locator('header').getByRole('link', { name: 'FR' }).click();

    await expect(page).toHaveURL(/\/mentions-legales\/?$/);
  });

  test('clicking the switcher from "/confidentialite/" navigates to "/en/confidentialite/"', async ({
    page,
  }) => {
    await page.goto('/confidentialite/');
    await page.locator('header').getByRole('link', { name: 'EN' }).click();

    await expect(page).toHaveURL(/\/en\/confidentialite\/?$/);
  });

  test('clicking the switcher from "/en/confidentialite/" navigates back to "/confidentialite/"', async ({
    page,
  }) => {
    await page.goto('/en/confidentialite/');
    await page.locator('header').getByRole('link', { name: 'FR' }).click();

    await expect(page).toHaveURL(/\/confidentialite\/?$/);
  });
});

test.describe('footer legal nav reachability', () => {
  test('the footer links to the mentions légales page from "/"', async ({ page }) => {
    await page.goto('/');

    await page.locator('footer').getByRole('link', { name: 'Mentions légales' }).click();

    await expect(page).toHaveURL(/\/mentions-legales\/$/);
  });

  test('the footer links to the privacy page from "/"', async ({ page }) => {
    await page.goto('/');

    await page.locator('footer').getByRole('link', { name: 'Confidentialité' }).click();

    await expect(page).toHaveURL(/\/confidentialite\/$/);
  });
});
