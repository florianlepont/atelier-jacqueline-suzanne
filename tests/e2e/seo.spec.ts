import {test, expect} from '@playwright/test';

test.describe('SEO metadata', () => {
  test('homepage emits social and search metadata', async ({page}) => {
    await page.goto('/');

    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /Atelier Jacqueline Suzanne/i);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', /summary/);
  });

  test('About page uses its CMS biography as the default description', async ({page}) => {
    await page.goto('/about/');

    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toContain('Romane');
  });

  test('gallery detail exposes a description and a Sanity social image', async ({page}) => {
    await page.goto('/');
    await page.getByRole('button', {name: 'Grille'}).click();
    const href = await page.locator('a.home-grid__tile').first().getAttribute('href');
    expect(href).toBeTruthy();

    await page.goto(href!);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.+/);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /^https:\/\/cdn\.sanity\.io\//);
  });
});
