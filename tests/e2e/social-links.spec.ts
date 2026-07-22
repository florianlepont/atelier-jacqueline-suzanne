import { test, expect } from '@playwright/test';

// Instagram remains available in editorial content, but is intentionally
// absent from the site-wide footer.

const INSTAGRAM_HREF = 'https://www.instagram.com/ajs_romanelepont/';

test('Instagram is absent from the site-wide footer', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('footer a[href*="instagram.com"]')).toHaveCount(0);
});

test.describe('About page Instagram mention', () => {
  for (const path of ['/about/', '/en/about/']) {
    test(`${path} has no Instagram mention in the main content`, async ({page}) => {
      await page.goto(path);
      await expect(page.locator('main a[href*="instagram.com"]')).toHaveCount(0);
    });
  }
});

test.describe('Contact page Instagram mention', () => {
  test('French Contact page links @ajs_romanelepont above the contact form', async ({ page }) => {
    await page.goto('/contact/');

    const link = page.locator('.contact-page__social');
    await expect(link).toContainText('Instagram');
    await expect(link).toContainText('@ajs_romanelepont');
    await expect(link).toHaveAttribute('href', INSTAGRAM_HREF);
    await expect(link).toHaveAttribute('target', '_blank');
    const rel = await link.getAttribute('rel');
    expect(rel).toContain('noopener');
    expect(rel).toContain('noreferrer');

    // The editorial desktop layout places details beside the form, while
    // keeping the social link before it in reading and keyboard order.
    const socialPrecedesForm = await link.evaluate((social) => {
      const form = document.querySelector('form');
      return Boolean(form && social.compareDocumentPosition(form) & Node.DOCUMENT_POSITION_FOLLOWING);
    });
    expect(socialPrecedesForm).toBe(true);
  });

  test('English Contact page links @ajs_romanelepont above the contact form', async ({ page }) => {
    await page.goto('/en/contact/');

    const link = page.locator('.contact-page__social');
    await expect(link).toContainText('Instagram');
    await expect(link).toContainText('@ajs_romanelepont');
    await expect(link).toHaveAttribute('href', INSTAGRAM_HREF);
    await expect(link).toHaveAttribute('target', '_blank');
    const rel = await link.getAttribute('rel');
    expect(rel).toContain('noopener');
    expect(rel).toContain('noreferrer');

    const socialPrecedesForm = await link.evaluate((social) => {
      const form = document.querySelector('form');
      return Boolean(form && social.compareDocumentPosition(form) & Node.DOCUMENT_POSITION_FOLLOWING);
    });
    expect(socialPrecedesForm).toBe(true);
  });
});
