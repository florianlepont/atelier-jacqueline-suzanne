import { test, expect } from '@playwright/test';

// HOME-16/D-05: the homepage's STARTING accent is now randomly picked per
// visit from the existing per-gallery heroColor values, without changing
// which gallery's photo/title/index-label/dash shows first and without
// touching the existing per-gallery-follows-carousel-position accent
// behaviour. Every expectation below reads its expected colour/src straight
// off the page's own `data-hero-*` attributes rather than hardcoding a hex
// value or a gallery count, so this spec survives future Sanity content
// changes.

interface DataEntry {
  heroColor: string;
  heroTextColor: string;
  heroSrc: string;
}

async function readDataEntries(page: import('@playwright/test').Page): Promise<DataEntry[]> {
  return page.locator('ul[data-role="home-carousel-data"] li').evaluateAll((lis) =>
    lis.map((li) => ({
      heroColor: (li as HTMLElement).dataset.heroColor ?? '',
      heroTextColor: (li as HTMLElement).dataset.heroTextColor ?? '',
      heroSrc: (li as HTMLElement).dataset.heroSrc ?? '',
    })),
  );
}

async function currentAccent(page: import('@playwright/test').Page): Promise<string> {
  return page.evaluate(() =>
    getComputedStyle(document.querySelector('.home') as HTMLElement).getPropertyValue('--current-accent').trim(),
  );
}

test.describe('homepage random starting accent (HOME-16, D-05)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 852 });
  });

  test('a forced lowest random value starts the accent on the first gallery\'s heroColor', async ({ page }) => {
    await page.addInitScript(() => {
      Math.random = () => 0;
    });
    await page.goto('/');

    const entries = await readDataEntries(page);
    expect(entries.length).toBeGreaterThan(0);
    await expect.poll(() => currentAccent(page)).toBe(entries[0].heroColor);
  });

  test('a forced highest random value starts the accent on the LAST gallery\'s heroColor', async ({ page }) => {
    await page.addInitScript(() => {
      Math.random = () => 0.999;
    });
    await page.goto('/');

    const entries = await readDataEntries(page);
    test.skip(entries.length < 2, 'needs at least 2 homepage galleries to prove a non-first pick');

    const last = entries[entries.length - 1];
    const accent = await currentAccent(page);
    expect(accent).toBe(last.heroColor);
    expect(accent).not.toBe(entries[0].heroColor);
  });

  test('the randomly-picked accent never leaves the existing five-value palette', async ({ page }) => {
    await page.goto('/');
    const entries = await readDataEntries(page);
    const palette = new Set(entries.map((e) => e.heroColor));

    // Deliberately uses the real, unmocked Math.random across 6 reloads —
    // this is the one test in the file that proves membership under actual
    // runtime randomness rather than a stubbed value. It does NOT also
    // assert on distinctness across those reloads: with a real RNG that
    // assertion's failure probability is (1/count)^5 per run (non-trivial
    // for a small gallery count), and the two tests above already prove
    // distinctness deterministically (Math.random stubbed to 0 vs 0.999
    // resolves to different galleries) — asserting it again here would only
    // add flake risk, not coverage.
    for (let i = 0; i < 6; i++) {
      await page.reload();
      const accent = await currentAccent(page);
      expect(palette.has(accent)).toBe(true);
    }
  });

  test('the random accent does not change which gallery shows first', async ({ page }) => {
    await page.addInitScript(() => {
      Math.random = () => 0.999;
    });
    await page.goto('/');

    const entries = await readDataEntries(page);
    const carousel = page.locator('[data-role="home-carousel"]');
    await expect(carousel.locator('[data-role="hero-image"]')).toHaveAttribute('src', entries[0].heroSrc);
    await expect(carousel.locator('[data-role="index-label"]')).toHaveText(/^01 \//);

    const dashes = carousel.locator('.home-hero__progress-dash');
    await expect(dashes.first()).toHaveAttribute('aria-current', 'true');
    await expect(dashes.last()).toHaveAttribute('aria-current', 'false');
  });

  test('the per-gallery accent still follows carousel position after the first advance', async ({ page }) => {
    // Phase 21 (HOME-14): the describe block's own beforeEach forces phone
    // width (393x852), but the carousel/progress-dash this test clicks is
    // now retired below 767px (homepage-scroll-deck.spec.ts covers the
    // phone-width replacement) — a real phone visitor has no dash to click
    // anymore. The underlying "accent follows carousel position on advance"
    // behaviour this test proves is still genuinely valid on tablet/desktop
    // (the carousel is untouched there), so this one test overrides back to
    // a desktop viewport rather than being retired outright.
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.addInitScript(() => {
      Math.random = () => 0.999;
    });
    await page.goto('/');

    const entries = await readDataEntries(page);
    test.skip(entries.length < 2, 'needs at least 2 homepage galleries to advance to a second one');

    await page.locator('[data-role="progress"] .home-hero__progress-dash[data-index="1"]').click();
    await expect.poll(() => currentAccent(page)).toBe(entries[1].heroColor);
  });

  test('the initial-paint transition suppression is released', async ({ page }) => {
    await page.goto('/');

    await expect.poll(() => page.locator('.home').getAttribute('class')).not.toContain('is-accent-init');

    const transitionDuration = await page
      .locator('[data-role="accent-panel"]')
      .evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(transitionDuration).not.toBe('0s');
  });
});
