import { test, expect, type Page } from '@playwright/test';

// Phase 21 (HOME-14/HOME-15): this spec is the phone-width structural
// replacement for the homepage coverage plan 21-03 retired ahead of this
// plan landing — the mode-toggle-visibility, HOME-06 full-bleed-hero, and
// carousel-intro/grid-intro-clamp phone-width tests removed from
// homepage-mobile-responsive.spec.ts and homepage-content-display.spec.ts,
// both of which point back at this file in their own retirement comments.
// Covers HOME-14 (the carousel/grid toggle is replaced by one continuous
// scroll sequence: one full-screen slide per gallery, in order) and HOME-15
// (the full-screen wordmark-to-photo zoom's structural shape and static
// end-state — no scroll-driven motion is wired until plans 21-05/21-06; this
// plan only builds the markup/CSS the motion will later animate).

const PHONE_VIEWPORT = { width: 393, height: 852 };
const DESKTOP_VIEWPORT = { width: 1280, height: 800 };

interface GalleryDataEntry {
  slug: string;
  href: string;
}

// Mirrors homepage-accent-random.spec.ts's own read of the build-time data
// node so expected slide count/order/hrefs are derived from the page's own
// data rather than hardcoded gallery names/counts Sanity owns.
async function readGalleryData(page: Page): Promise<GalleryDataEntry[]> {
  return page.locator('ul[data-role="home-carousel-data"] li').evaluateAll((lis) =>
    lis.map((li) => ({
      slug: (li as HTMLElement).dataset.slug ?? '',
      href: (li as HTMLElement).dataset.href ?? '',
    })),
  );
}

test.describe('mode-toggle and carousel/grid retirement below 767px (success criterion 1)', () => {
  test('at phone width the mode-toggle is not visible, and neither the carousel nor the grid subtree is visible', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    await expect(page.locator('[data-role="mode-toggle"]')).not.toBeVisible();
    await expect(page.locator('[data-role="home-carousel"]')).not.toBeVisible();
    await expect(page.locator('[data-role="home-grid"]')).not.toBeVisible();
  });
});

test.describe('scroll-deck structure (HOME-14, success criterion 2)', () => {
  test('at phone width the deck root is visible', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    await expect(page.locator('[data-role="scroll-deck"]')).toBeVisible();
  });

  test('one slide exists per gallery, in the same order as the build-time gallery data', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const entries = await readGalleryData(page);
    expect(entries.length).toBeGreaterThan(0);

    const slides = page.locator('[data-role="deck-slide"]');
    await expect(slides).toHaveCount(entries.length);

    const hrefs = await slides.evaluateAll((els) => els.map((el) => el.getAttribute('href')));
    for (let i = 0; i < entries.length; i++) {
      expect(hrefs[i]).toBe(entries[i].href);
    }
  });

  test('every slide is a real anchor with a non-empty href pointing at a gallery detail route (D-10)', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const slides = page.locator('[data-role="deck-slide"]');
    const count = await slides.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const slide = slides.nth(i);
      const tagName = await slide.evaluate((el) => el.tagName);
      expect(tagName).toBe('A');
      const href = await slide.getAttribute('href');
      expect(href).toBeTruthy();
      expect(href).toContain('galleries/');
    }
  });

  test('every slide fills the viewport height (within 2px)', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const slides = page.locator('[data-role="deck-slide"]');
    const count = await slides.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const box = await slides.nth(i).boundingBox();
      expect(box).not.toBeNull();
      expect(Math.abs(box!.height - PHONE_VIEWPORT.height)).toBeLessThanOrEqual(2);
    }
  });

  test('no slide repeats the wordmark, and exactly one level-1 heading exists at phone width (D-16)', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    await expect(page.locator('[data-role="deck-slide"] [data-role="zoom-wordmark"]')).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  });

  test('no horizontal overflow at phone width', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const measurements = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(measurements.scrollWidth).toBeLessThanOrEqual(measurements.clientWidth);
  });

  test('the footer is reachable after the last slide (D-08)', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const footerDisplay = await page.locator('footer').evaluate((el) => getComputedStyle(el).display);
    expect(footerDisplay).not.toBe('none');
  });
});

test.describe('full-screen wordmark on first load (HOME-15, success criterion 4)', () => {
  test('before any scrolling, the zoom wordmark fills most of the phone viewport', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const wordmark = page.locator('[data-role="zoom-wordmark"]');
    await expect(wordmark).toBeVisible();
    const box = await wordmark.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(PHONE_VIEWPORT.width * 0.6);
    expect(box!.height).toBeGreaterThanOrEqual(PHONE_VIEWPORT.height * 0.4);
  });
});

test.describe('description default/reveal state (D-13)', () => {
  test('before any arrival, each slide description has opacity 0 while its title is visible', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const slides = page.locator('[data-role="deck-slide"]');
    const count = await slides.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const slide = slides.nth(i);
      await expect(slide.locator('.home-slide__title')).toBeVisible();
      // Read computed opacity via evaluate rather than asserting visibility —
      // an opacity:0 element is still "visible" to Playwright's own
      // toBeVisible() check, so only a direct getComputedStyle read proves
      // the description starts hidden.
      const opacity = await slide.locator('.home-slide__description').evaluate((el) => getComputedStyle(el).opacity);
      expect(opacity).toBe('0');
    }
  });
});

test.describe('reduced-motion end state (D-15)', () => {
  test('every slide description is permanently visible and scroll-snap is disabled', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const slides = page.locator('[data-role="deck-slide"]');
    const count = await slides.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const opacity = await slides
        .nth(i)
        .locator('.home-slide__description')
        .evaluate((el) => getComputedStyle(el).opacity);
      expect(opacity).toBe('1');
    }

    const snapType = await page.evaluate(() => getComputedStyle(document.documentElement).scrollSnapType);
    expect(snapType).toBe('none');
  });
});

test.describe('desktop/tablet regression guard (success criterion 5, UI-02)', () => {
  test('at 1280x800 the deck is absent and the carousel/toggle render exactly as before', async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto('/');

    await expect(page.locator('[data-role="scroll-deck"]')).not.toBeVisible();
    await expect(page.locator('[data-role="mode-toggle"]')).toBeVisible();
    await expect(page.locator('[data-role="home-carousel"]')).toBeVisible();
  });
});
