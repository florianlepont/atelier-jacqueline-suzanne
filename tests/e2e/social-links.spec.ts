import { test, expect } from '@playwright/test';

// Instagram remains available in editorial content, but is intentionally
// absent from the site-wide footer.

const INSTAGRAM_HREF = 'https://www.instagram.com/ajs_romanelepont/';

test('Instagram is absent from the site-wide footer', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('footer a[href*="instagram.com"]')).toHaveCount(0);
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

    const link = socialParagraph.getByRole('link', {
      name: /@ajs_romanelepont/i,
    });
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

    const link = socialParagraph.getByRole('link', {
      name: /@ajs_romanelepont/i,
    });
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
