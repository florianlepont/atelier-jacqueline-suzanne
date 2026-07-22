import { test, expect } from '@playwright/test';

// RED (Wave 0): src/pages/about.astro, src/pages/en/about.astro, and the
// About nav link in BaseLayout.astro do not exist yet — those are built in
// Task 2 of this plan. These assertions target the real ABOUT-01/ABOUT-02
// contracts (bio copy, atelier/practice copy, D-06 locked medium/technique
// placeholder, nav reachability) and are expected to FAIL (404s / missing
// nav link) until then — do not stub or weaken them to make them pass early.

test.describe('about page content', () => {
  test('French About page renders non-empty CMS bio, practice, and medium copy at "/about/"', async ({
    page,
  }) => {
    await page.goto('/about/');

    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.locator('main h1')).toContainText('À propos');

    await expect(page.getByText('Atelier & pratique')).toBeVisible();
    await expect(page.getByRole('heading', {name: 'Médium & technique'})).toBeVisible();
    const editorialParagraphs = page.locator('.about-page > p').filter({hasNot: page.locator('a')});
    await expect(editorialParagraphs).toHaveCount(3);
    for (const paragraph of await editorialParagraphs.all()) {
      expect((await paragraph.innerText()).trim().length).toBeGreaterThan(20);
    }
  });

  test('English About page renders non-empty CMS bio, practice, and medium copy at "/en/about/"', async ({
    page,
  }) => {
    await page.goto('/en/about/');

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('main h1')).toContainText('About');

    await expect(page.getByText('Studio & practice')).toBeVisible();
    await expect(page.getByRole('heading', {name: 'Medium & technique'})).toBeVisible();
    const editorialParagraphs = page.locator('.about-page > p').filter({hasNot: page.locator('a')});
    await expect(editorialParagraphs).toHaveCount(3);
    for (const paragraph of await editorialParagraphs.all()) {
      expect((await paragraph.innerText()).trim().length).toBeGreaterThan(20);
    }
  });

  test('About page copy differs between the French and English pages', async ({ page }) => {
    await page.goto('/about/');
    const frMain = await page.locator('main').innerText();

    await page.goto('/en/about/');
    const enMain = await page.locator('main').innerText();

    expect(enMain).not.toBe(frMain);
  });

  test('the header nav links to the About page', async ({ page }) => {
    // Phase 04.1: the homepage ("/") intentionally renders its own minimal,
    // immersive nav (Accueil/Galeries + carousel-grid toggle + switcher only
    // — no About/Contact) per 04.1-UI-SPEC.md's Layout Notes, matching the
    // imported design prototype. The standard site-wide header (with the
    // About link) still renders on every other page, so this checks
    // reachability from there instead of "/". Phase 04.3 removed the
    // standalone /galleries listing route (D-03), so this now originates
    // from /contact/ — another surviving BaseLayout page whose header still
    // exposes the About link.
    await page.goto('/contact/');

    await page.locator('header').getByRole('link', { name: 'À propos' }).click();

    await expect(page).toHaveURL(/\/about\/$/);
  });
});
