import { test, expect } from '@playwright/test';

// RED (Wave 0): src/pages/about.astro, src/pages/en/about.astro, and the
// About nav link in BaseLayout.astro do not exist yet — those are built in
// Task 2 of this plan. These assertions target the real ABOUT-01/ABOUT-02
// contracts (bio copy, atelier/practice copy, D-06 locked medium/technique
// placeholder, nav reachability) and are expected to FAIL (404s / missing
// nav link) until then — do not stub or weaken them to make them pass early.

test.describe('about page content', () => {
  test('French About page renders bio, atelier/practice, and D-06 placeholder copy at "/about/"', async ({
    page,
  }) => {
    await page.goto('/about/');

    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.locator('main h1')).toContainText('À propos');

    const main = page.locator('main');
    await expect(main).toContainText(
      'Le texte de présentation de Romane sera bientôt disponible ici — en attente de sa version définitive.',
    );
    await expect(main).toContainText(
      "Informations sur l'atelier et la pratique de Romane à venir prochainement.",
    );
    await expect(main).toContainText(
      'Précisions sur le médium et la technique à venir — en attente de confirmation avec l\'artiste.',
    );
    await expect(page.getByText('Atelier & pratique')).toBeVisible();
  });

  test('English About page renders bio, atelier/practice, and D-06 placeholder copy at "/en/about/"', async ({
    page,
  }) => {
    await page.goto('/en/about/');

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('main h1')).toContainText('About');

    const main = page.locator('main');
    await expect(main).toContainText(
      "Romane's biography will be available here soon — pending her final text.",
    );
    await expect(main).toContainText(
      "Information about Romane's studio and practice is coming soon.",
    );
    await expect(main).toContainText(
      'Details on medium and technique coming soon — pending confirmation with the artist.',
    );
    await expect(page.getByText('Studio & practice')).toBeVisible();
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
