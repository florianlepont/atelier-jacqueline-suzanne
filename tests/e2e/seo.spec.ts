import {test, expect} from '@playwright/test';
import {firstGalleryHref, firstEditionHref} from './helpers/content';

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
    expect(sitemap).toContain('/editions/');
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

  // quick-260811-kog-04: the fr/en gallery and édition detail routes now
  // share GalleryDetailPage.astro/EditionDetailPage.astro. Each detail page
  // must still canonicalize to ITSELF, not always to the French one, and
  // both locales of the same document must agree on the alternate pair.
  test('gallery detail canonicalizes to itself and shares the same fr/en alternate pair across locales', async ({
    page,
  }) => {
    const frHref = await firstGalleryHref(page, 'fr');
    const slug = frHref.match(/\/galleries\/([^/]+)\/?$/)?.[1];
    expect(slug).toBeTruthy();

    await page.goto(frHref);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      new RegExp(`/galleries/${slug}/$`),
    );
    const frAlternate = await page.locator('link[rel="alternate"][hreflang="fr"]').getAttribute('href');
    const enAlternateFromFr = await page.locator('link[rel="alternate"][hreflang="en"]').getAttribute('href');

    await page.goto(`/en/galleries/${slug}/`);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      new RegExp(`/en/galleries/${slug}/$`),
    );
    const frAlternateFromEn = await page.locator('link[rel="alternate"][hreflang="fr"]').getAttribute('href');
    const enAlternate = await page.locator('link[rel="alternate"][hreflang="en"]').getAttribute('href');

    expect(frAlternateFromEn).toBe(frAlternate);
    expect(enAlternateFromFr).toBe(enAlternate);
    expect(frAlternate).toMatch(new RegExp(`/galleries/${slug}/$`));
    expect(enAlternate).toMatch(new RegExp(`/en/galleries/${slug}/$`));
  });

  test('édition detail canonicalizes to itself in both locales', async ({page}) => {
    const frHref = await firstEditionHref(page, 'fr');
    const slug = frHref.match(/\/editions\/([^/]+)\/?$/)?.[1];
    expect(slug).toBeTruthy();

    await page.goto(frHref);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      new RegExp(`/editions/${slug}/$`),
    );

    await page.goto(`/en/editions/${slug}/`);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      new RegExp(`/en/editions/${slug}/$`),
    );
  });
});
