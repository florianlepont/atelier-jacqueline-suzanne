import { test, expect, type Page } from '@playwright/test';

// 260825-jvm: the phone-canvas colour (`--phone-canvas-color`, applied via
// `body.has-phone-canvas main`) is phone-only — `main` must stay on the
// page's own neutral dominant background on desktop, in every display mode
// (carousel and grid), regardless of gallery count or accent palette.

// Normalizes any CSS colour string or custom-property value to a computed
// `rgb(...)` string by assigning it as the background-color of a throwaway
// element attached to the page, reading it back, then removing the element —
// this lets a hex custom property be compared against a computed background
// colour without hand-rolling hex-to-rgb maths.
async function normalizeColor(page: Page, value: string): Promise<string> {
  return page.evaluate((raw) => {
    const el = document.createElement('div');
    el.style.position = 'absolute';
    el.style.visibility = 'hidden';
    el.style.backgroundColor = raw;
    document.body.appendChild(el);
    const resolved = getComputedStyle(el).backgroundColor;
    el.remove();
    return resolved;
  }, value);
}

async function mainBackground(page: Page): Promise<string> {
  return page.locator('main').evaluate((el) => getComputedStyle(el).backgroundColor);
}

async function resolvedPhoneCanvasColor(page: Page): Promise<string> {
  return page.evaluate(() =>
    getComputedStyle(document.body).getPropertyValue('--phone-canvas-color').trim(),
  );
}

async function resolvedDominantColor(page: Page): Promise<string> {
  return page
    .locator('main')
    .evaluate((el) => getComputedStyle(el).getPropertyValue('--color-dominant').trim());
}

test.describe('homepage main background stays phone-only (260825-jvm)', () => {
  test('desktop, carousel mode: main paints the dominant background, never the phone-canvas colour', async ({ page }) => {
    await page.goto('/');

    const rawPhoneCanvas = await resolvedPhoneCanvasColor(page);
    test.skip(rawPhoneCanvas === '', 'homepage does not set --phone-canvas-color');

    const expectedDominant = await normalizeColor(page, await resolvedDominantColor(page));
    const forbiddenPhoneCanvas = await normalizeColor(page, rawPhoneCanvas);
    const actual = await mainBackground(page);

    expect(actual).toBe(expectedDominant);
    expect(actual).not.toBe(forbiddenPhoneCanvas);
  });

  test('desktop, grid mode: main paints the dominant background, never the phone-canvas colour nor any gallery hero accent', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();
    await expect(page.locator('[data-role="home-grid"]')).toBeVisible();

    const rawPhoneCanvas = await resolvedPhoneCanvasColor(page);
    test.skip(rawPhoneCanvas === '', 'homepage does not set --phone-canvas-color');

    const expectedDominant = await normalizeColor(page, await resolvedDominantColor(page));
    const forbiddenPhoneCanvas = await normalizeColor(page, rawPhoneCanvas);
    const actual = await mainBackground(page);

    expect(actual).toBe(expectedDominant);
    expect(actual).not.toBe(forbiddenPhoneCanvas);

    // General invariant, content-agnostic: main's background must not match
    // ANY published gallery's own hero accent, whatever the gallery count.
    const heroColors = await page
      .locator('ul[data-role="home-carousel-data"] li')
      .evaluateAll((lis) =>
        lis.map((li) => (li as HTMLElement).dataset.heroColor ?? '').filter((value) => value.length > 0),
      );
    for (const rawHeroColor of heroColors) {
      const normalizedHeroColor = await normalizeColor(page, rawHeroColor);
      expect(actual).not.toBe(normalizedHeroColor);
    }
  });

  test('phone width: main still paints the phone-canvas colour, unchanged', async ({ page }) => {
    // Set viewport BEFORE goto so the correct homepage runtime mounts for
    // this width.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const rawPhoneCanvas = await resolvedPhoneCanvasColor(page);
    test.skip(rawPhoneCanvas === '', 'homepage does not set --phone-canvas-color');

    const expectedPhoneCanvas = await normalizeColor(page, rawPhoneCanvas);
    const actual = await mainBackground(page);

    expect(actual).toBe(expectedPhoneCanvas);
  });
});
