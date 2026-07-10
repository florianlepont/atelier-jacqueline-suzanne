import { test, expect } from '@playwright/test';

// Phase 04.2 (SOCIAL-01): Instagram (@ajs_romanelepont) link coverage across
// all three surfaces — site-wide footer, About page, Contact page — in both
// locales. The footer assertions use getByRole('link', { name: ... }) with
// the full accessible name (including the sr-only new-tab suffix) so the
// test proves the hidden hint is actually part of the accessible name, not
// just a loose /Instagram/ substring match.

const INSTAGRAM_HREF = 'https://www.instagram.com/ajs_romanelepont/';

test.describe('footer Instagram link (site-wide)', () => {
  test('English homepage footer link has the full accessible name and safe attrs', async ({
    page,
  }) => {
    await page.goto('/en/');

    const link = page.getByRole('link', { name: /Instagram \(opens in new tab\)/i });
    await expect(link).toHaveAttribute('href', INSTAGRAM_HREF);
    await expect(link).toHaveAttribute('target', '_blank');
    const rel = await link.getAttribute('rel');
    expect(rel).toContain('noopener');
    expect(rel).toContain('noreferrer');
  });

  test('French homepage footer link has the full accessible name and safe attrs', async ({
    page,
  }) => {
    await page.goto('/');

    const link = page.getByRole('link', { name: /Instagram \(nouvelle fenêtre\)/i });
    await expect(link).toHaveAttribute('href', INSTAGRAM_HREF);
    await expect(link).toHaveAttribute('target', '_blank');
    const rel = await link.getAttribute('rel');
    expect(rel).toContain('noopener');
    expect(rel).toContain('noreferrer');
  });
});

test.describe('About page Instagram mention', () => {
  test('French About page links @ajs_romanelepont from the main content', async ({ page }) => {
    await page.goto('/about/');

    const main = page.locator('main');
    await expect(main).toContainText('Suivez le travail de Romane sur Instagram');

    const link = main.getByRole('link', { name: /@ajs_romanelepont/i });
    await expect(link).toHaveAttribute('href', INSTAGRAM_HREF);
    await expect(link).toHaveAttribute('target', '_blank');
    const rel = await link.getAttribute('rel');
    expect(rel).toContain('noopener');
    expect(rel).toContain('noreferrer');
  });

  test('English About page links @ajs_romanelepont from the main content', async ({ page }) => {
    await page.goto('/en/about/');

    const main = page.locator('main');
    await expect(main).toContainText("Follow Romane's work on Instagram");

    const link = main.getByRole('link', { name: /@ajs_romanelepont/i });
    await expect(link).toHaveAttribute('href', INSTAGRAM_HREF);
    await expect(link).toHaveAttribute('target', '_blank');
    const rel = await link.getAttribute('rel');
    expect(rel).toContain('noopener');
    expect(rel).toContain('noreferrer');
  });
});

test.describe('Contact page Instagram mention', () => {
  test('French Contact page links @ajs_romanelepont above the contact form', async ({ page }) => {
    await page.goto('/contact/');

    const socialParagraph = page.locator('.contact-page__social');
    await expect(socialParagraph).toContainText('Vous pouvez aussi me suivre sur Instagram');

    const link = socialParagraph.getByRole('link', { name: /@ajs_romanelepont/i });
    await expect(link).toHaveAttribute('href', INSTAGRAM_HREF);
    await expect(link).toHaveAttribute('target', '_blank');
    const rel = await link.getAttribute('rel');
    expect(rel).toContain('noopener');
    expect(rel).toContain('noreferrer');

    // Positioned above the contact form.
    const socialBox = await socialParagraph.boundingBox();
    const formBox = await page.locator('form').boundingBox();
    expect(socialBox).not.toBeNull();
    expect(formBox).not.toBeNull();
    expect(socialBox!.y).toBeLessThan(formBox!.y);
  });

  test('English Contact page links @ajs_romanelepont above the contact form', async ({ page }) => {
    await page.goto('/en/contact/');

    const socialParagraph = page.locator('.contact-page__social');
    await expect(socialParagraph).toContainText('You can also follow me on Instagram');

    const link = socialParagraph.getByRole('link', { name: /@ajs_romanelepont/i });
    await expect(link).toHaveAttribute('href', INSTAGRAM_HREF);
    await expect(link).toHaveAttribute('target', '_blank');
    const rel = await link.getAttribute('rel');
    expect(rel).toContain('noopener');
    expect(rel).toContain('noreferrer');

    const socialBox = await socialParagraph.boundingBox();
    const formBox = await page.locator('form').boundingBox();
    expect(socialBox).not.toBeNull();
    expect(formBox).not.toBeNull();
    expect(socialBox!.y).toBeLessThan(formBox!.y);
  });
});
