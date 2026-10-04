import { expect, test } from '@playwright/test';

test.describe('Keyboard access and language switcher', () => {
  test('the first Tab stop is the skip link, and activating it moves focus to main', async ({
    page,
  }) => {
    await page.goto('/about/');
    await page.keyboard.press('Tab');
    const skip = page.locator('.skip-link');
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();
    await expect(skip).toHaveText('Aller au contenu');
    await page.keyboard.press('Enter');
    await expect(page.locator('main#main-content')).toBeFocused();
  });

  test('English pages use the English skip link text', async ({ page }) => {
    await page.goto('/en/about/');
    await expect(page.locator('.skip-link')).toHaveText('Skip to content');
  });

  test('the skip link stays out of sight until it receives focus', async ({ page }) => {
    await page.goto('/about/');
    const box = await page.locator('.skip-link').boundingBox();
    expect(box === null || box.y + box.height <= 0).toBe(true);
  });

  test('landmarks are named in the page language', async ({ page }) => {
    await page.goto('/about/');
    await expect(page.getByRole('navigation', { name: 'Navigation principale' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Sélecteur de langue' })).toBeVisible();
    await page.goto('/en/about/');
    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Language switcher' })).toBeVisible();
  });

  test('the language switcher keeps the query string and the fragment', async ({ page }) => {
    await page.goto('/?view=grid#top');
    const link = page.locator('.language-switcher .switcher-link').first();
    await expect(link).toHaveAttribute('href', /\/en\/\?view=grid#top$/);
  });
});
