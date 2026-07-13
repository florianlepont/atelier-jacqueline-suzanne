import {test, expect} from '@playwright/test';

test.describe('SEO metadata', () => {
  test('homepage emits social and search metadata', async ({page}) => {
    await page.goto('/');

    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /Atelier Jacqueline Suzanne/i);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', /summary/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /^https:\/\//);
    await expect(page.locator('link[rel="alternate"][hreflang="fr"]')).toHaveCount(1);
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveCount(1);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /index, follow/);
    const structuredData = await page
      .locator('script[type="application/ld+json"]')
      .textContent();
    expect(structuredData).toContain('WebSite');
  });

  test('robots.txt references the generated sitemap', async ({page}) => {
    const response = await page.request.get('/robots.txt');
    expect(response.ok()).toBe(true);
    expect(await response.text()).toContain('Sitemap: https://');
  });

  test('sitemap contains both languages and gallery pages', async ({page}) => {
    const response = await page.request.get('/sitemap.xml');
    expect(response.ok()).toBe(true);
    const sitemap = await response.text();
    expect(sitemap).toContain('<urlset');
    expect(sitemap).toContain('/en/');
    expect(sitemap).toContain('/galleries/');
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
