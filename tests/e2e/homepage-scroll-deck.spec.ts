import { expect, test, type Page } from '@playwright/test';

const PHONE = { width: 393, height: 852 };

async function openHomepage(page: Page, path: '/' | '/en/') {
  await page.setViewportSize(PHONE);
  await page.goto(path);
  await expect(page.locator('.mobile-home-prototype')).toBeVisible();
}

async function scrollArrivalTo(page: Page, progress: number) {
  const target = await page.locator('.mobile-home-prototype__arrival').evaluate((arrival, fraction) => {
    const element = arrival as HTMLElement;
    return element.offsetTop + (element.offsetHeight - window.innerHeight) * (fraction as number);
  }, progress);
  await page.evaluate((y) => window.scrollTo(0, y), target);
  await expect.poll(() => page.locator('[data-role="prototype-arrival-stage"]').evaluate((stage) =>
    Number.parseFloat((stage as HTMLElement).style.getPropertyValue('--prototype-arrival-progress')),
  )).toBeCloseTo(progress, 1);
}

function matrixTranslation(transform: string) {
  const match = transform.match(/^matrix\(([^)]+)\)$/);
  return match ? match[1].split(',').slice(4).map(Number) : [0, 0];
}

test.describe('mobile homepage arrival', () => {
  for (const path of ['/', '/en/'] as const) {
    test(`${path} serves the prototype instead of the hidden desktop carousel`, async ({ page }) => {
      await openHomepage(page, path);

      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      await expect(page.locator('[data-role="prototype-arrival-stage"]')).toBeVisible();
      await expect(page.locator('[data-role="prototype-arrival-intro"]')).toHaveText(/\S/);
      await expect(page.locator('[data-role="prototype-scroll-cue"]')).toHaveText(path === '/' ? 'Défiler' : 'Scroll');
      await expect(page.locator('.homepage-legacy [data-role="home-carousel"]')).toBeHidden();
      await expect(page.locator('.homepage-legacy [data-role="home-grid"]')).toBeHidden();
    });

    test(`${path} keeps Paysage alone after the description before the series`, async ({ page }) => {
      await openHomepage(page, path);
      const intro = page.locator('[data-role="prototype-arrival-intro"]');
      const firstSeries = page.locator('.mobile-home-prototype__series').first();

      await scrollArrivalTo(page, 0.62);
      await expect(intro).toHaveCSS('opacity', '1');

      await scrollArrivalTo(page, 0.92);
      await expect(intro).toHaveCSS('opacity', '0');
      await expect(page.locator('[data-role="prototype-arrival-photo"]')).toBeVisible();
      await expect(firstSeries).not.toBeInViewport();

      await scrollArrivalTo(page, 1);
      await page.evaluate(() => window.scrollBy(0, 2));
      await expect(firstSeries).toBeInViewport();
    });
  }

  test('the arrival and series photographs pan horizontally, with no vertical translation', async ({ page }) => {
    await openHomepage(page, '/');
    await scrollArrivalTo(page, 0.65);
    const arrivalPhoto = page.locator('[data-role="prototype-arrival-photo"]');
    const before = await arrivalPhoto.evaluate((image) => getComputedStyle(image).objectPosition);

    await scrollArrivalTo(page, 0.92);
    const after = await arrivalPhoto.evaluate((image) => getComputedStyle(image).objectPosition);
    expect(after).not.toBe(before);
    expect(Number.parseFloat(after)).toBeGreaterThan(Number.parseFloat(before));

    await page.locator('.mobile-home-prototype__series-image-frame').first().scrollIntoViewIfNeeded();
    const seriesPhoto = page.locator('.mobile-home-prototype__series-image').first();
    await expect.poll(async () => matrixTranslation(await seriesPhoto.evaluate((image) => getComputedStyle(image).transform))[1]).toBeCloseTo(0, 4);
  });

  test('the scroll cue uses ink on the neon accent', async ({ page }) => {
    await openHomepage(page, '/');
    await expect(page.locator('[data-role="prototype-scroll-cue"]')).toHaveCSS('color', 'rgb(26, 26, 26)');
  });

  test('reduced motion leaves the description legible and does not drive the photo pan', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openHomepage(page, '/');
    const intro = page.locator('[data-role="prototype-arrival-intro"]');
    const photo = page.locator('[data-role="prototype-arrival-photo"]');
    const before = await photo.evaluate((image) => (image as HTMLElement).style.getPropertyValue('--prototype-arrival-pan'));

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(intro).toHaveCSS('opacity', '1');
    await expect(photo).toHaveCSS('transform', /matrix\([^,]+, 0, 0, [^,]+, 0, 0\)/);
    await expect.poll(() => photo.evaluate((image) => (image as HTMLElement).style.getPropertyValue('--prototype-arrival-pan'))).toBe(before);
  });

  test('desktop keeps the established carousel rather than the phone prototype', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await expect(page.locator('[data-role="home-carousel"]')).toBeVisible();
    await expect(page.locator('.mobile-home-prototype')).toBeHidden();
  });
});
