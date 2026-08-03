import { test, expect } from '@playwright/test';

// Phase 19 Plan 02 (UI-01, D-04, D-05) — the regression net for the
// PageTitleHeader halftone bleed fix, written BEFORE the risky CSS change
// (Task 2) per D-05: this exact class of change (a site-wide overflow-x
// adjustment) already broke production once — a site-wide
// `overflow-x: hidden` on html/body was tried and reverted on 2026-07-29
// because it broke `position: sticky` on About's pinned exhibition photo
// and DetailHero's pinned reveal. Only the `chromium` Playwright project
// runs this spec (playwright.config.ts restricts `webkit-mobile` to
// `**/*.smoke.spec.ts`).
//
// Blocks A and B must PASS against the unmodified (pre-Task-2)
// PageTitleHeader.astro — they prove this net is a real baseline, not a
// tautology. Block C is expected to FAIL until Task 2 lands, because the
// halftone is still clipped to the header box today (its box does not yet
// span the true client width) — that is the entire point of writing this
// file first.

const WIDTHS = [320, 375, 768, 1280, 1920];

async function firstEditionHref(page: import('@playwright/test').Page): Promise<string> {
  await page.goto('/editions/');
  const href = await page.locator('.editions-index__row').first().getAttribute('href');
  expect(href).toBeTruthy();
  return href!;
}

// Block A — site-wide horizontal overflow guard (UI-01 D-05). Covers all
// seven pages the existing suite already covers, at all five widths D-05
// asks for, not just the three PageTitleHeader consumers.
test.describe('site-wide horizontal overflow guard (UI-01 D-05)', () => {
  test('homepage (/) has no horizontal overflow at 320/375/768/1280/1920', async ({ page }) => {
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      // Fresh navigation per width: resize-sensitive JS islands (e.g.
      // HomeCarousel) can leave a stale layout behind a bare resize event.
      await page.goto('/');
      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        innerWidth: window.innerWidth,
      }));
      expect(
        overflow.scrollWidth,
        `homepage overflow at ${width}px: scrollWidth=${overflow.scrollWidth} clientWidth=${overflow.clientWidth}`,
      ).toBeLessThanOrEqual(overflow.clientWidth);
      expect(
        overflow.scrollWidth,
        `homepage overflow at ${width}px: scrollWidth=${overflow.scrollWidth} innerWidth=${overflow.innerWidth}`,
      ).toBeLessThanOrEqual(overflow.innerWidth);
    }
  });

  test('/about/ has no horizontal overflow at 320/375/768/1280/1920', async ({ page }) => {
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/about/');
      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        innerWidth: window.innerWidth,
      }));
      expect(
        overflow.scrollWidth,
        `/about/ overflow at ${width}px: scrollWidth=${overflow.scrollWidth} clientWidth=${overflow.clientWidth}`,
      ).toBeLessThanOrEqual(overflow.clientWidth);
      expect(
        overflow.scrollWidth,
        `/about/ overflow at ${width}px: scrollWidth=${overflow.scrollWidth} innerWidth=${overflow.innerWidth}`,
      ).toBeLessThanOrEqual(overflow.innerWidth);
    }
  });

  test('/contact/ has no horizontal overflow at 320/375/768/1280/1920', async ({ page }) => {
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/contact/');
      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        innerWidth: window.innerWidth,
      }));
      expect(
        overflow.scrollWidth,
        `/contact/ overflow at ${width}px: scrollWidth=${overflow.scrollWidth} clientWidth=${overflow.clientWidth}`,
      ).toBeLessThanOrEqual(overflow.clientWidth);
      expect(
        overflow.scrollWidth,
        `/contact/ overflow at ${width}px: scrollWidth=${overflow.scrollWidth} innerWidth=${overflow.innerWidth}`,
      ).toBeLessThanOrEqual(overflow.innerWidth);
    }
  });

  test('/editions/ (overview) has no horizontal overflow at 320/375/768/1280/1920', async ({ page }) => {
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/editions/');
      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        innerWidth: window.innerWidth,
      }));
      expect(
        overflow.scrollWidth,
        `/editions/ overflow at ${width}px: scrollWidth=${overflow.scrollWidth} clientWidth=${overflow.clientWidth}`,
      ).toBeLessThanOrEqual(overflow.clientWidth);
      expect(
        overflow.scrollWidth,
        `/editions/ overflow at ${width}px: scrollWidth=${overflow.scrollWidth} innerWidth=${overflow.innerWidth}`,
      ).toBeLessThanOrEqual(overflow.innerWidth);
    }
  });

  test('first édition detail page has no horizontal overflow at 320/375/768/1280/1920', async ({ page }) => {
    const href = await firstEditionHref(page);
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(href);
      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        innerWidth: window.innerWidth,
      }));
      expect(
        overflow.scrollWidth,
        `édition detail overflow at ${width}px: scrollWidth=${overflow.scrollWidth} clientWidth=${overflow.clientWidth}`,
      ).toBeLessThanOrEqual(overflow.clientWidth);
      expect(
        overflow.scrollWidth,
        `édition detail overflow at ${width}px: scrollWidth=${overflow.scrollWidth} innerWidth=${overflow.innerWidth}`,
      ).toBeLessThanOrEqual(overflow.innerWidth);
    }
  });

  test('gallery detail (/galleries/silos/) has no horizontal overflow at 320/375/768/1280/1920', async ({ page }) => {
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/galleries/silos/');
      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        innerWidth: window.innerWidth,
      }));
      expect(
        overflow.scrollWidth,
        `gallery detail overflow at ${width}px: scrollWidth=${overflow.scrollWidth} clientWidth=${overflow.clientWidth}`,
      ).toBeLessThanOrEqual(overflow.clientWidth);
      expect(
        overflow.scrollWidth,
        `gallery detail overflow at ${width}px: scrollWidth=${overflow.scrollWidth} innerWidth=${overflow.innerWidth}`,
      ).toBeLessThanOrEqual(overflow.innerWidth);
    }
  });

  test('404 page has no horizontal overflow at 320/375/768/1280/1920', async ({ page }) => {
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/this-page-does-not-exist/');
      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        innerWidth: window.innerWidth,
      }));
      expect(
        overflow.scrollWidth,
        `404 overflow at ${width}px: scrollWidth=${overflow.scrollWidth} clientWidth=${overflow.clientWidth}`,
      ).toBeLessThanOrEqual(overflow.clientWidth);
      expect(
        overflow.scrollWidth,
        `404 overflow at ${width}px: scrollWidth=${overflow.scrollWidth} innerWidth=${overflow.innerWidth}`,
      ).toBeLessThanOrEqual(overflow.innerWidth);
    }
  });

  // The machine-checkable form of D-04's "never move the containment back
  // to html/body": whatever full-bleed technique Task 2 lands, html and
  // body must keep computing overflow-x: visible on every page that uses
  // PageTitleHeader.
  test('html and body never carry overflow-x on /contact/, /about/ or /editions/', async ({ page }) => {
    for (const path of ['/contact/', '/about/', '/editions/']) {
      await page.goto(path);
      const overflowX = await page.evaluate(() => ({
        html: getComputedStyle(document.documentElement).overflowX,
        body: getComputedStyle(document.body).overflowX,
      }));
      expect(overflowX.html, `${path}: html overflow-x`).toBe('visible');
      expect(overflowX.body, `${path}: body overflow-x`).toBe('visible');
    }
  });
});

// Block B — sticky pin regression guard (UI-01 D-05). A positive,
// functional assertion (the pin's own bounding-box top stays pinned to the
// viewport top after scrolling), not just a computed `position: sticky`
// check — because a `position: sticky` computed value can survive even if
// an ancestor's overflow accidentally breaks the pin behavior itself.
// These exist because a site-wide `overflow-x: hidden` on html/body broke
// exactly these two pins on 2026-07-29 and was reverted.
test.describe('sticky pin regression guard (UI-01 D-05)', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('/about/ — .about-page__exhibition-pin computes position:sticky and holds at the viewport top while scrolling', async ({
    page,
  }) => {
    await page.goto('/about/');

    const pin = page.locator('.about-page__exhibition-pin');
    await expect(pin).toBeVisible();
    const pinPosition = await pin.evaluate((el) => getComputedStyle(el).position);
    expect(pinPosition).toBe('sticky');

    await page.evaluate(() => {
      const track = document.querySelector('.about-page__exhibition-track')!;
      window.scrollBy(0, track.getBoundingClientRect().top + 300);
    });

    await expect(async () => {
      const top = await pin.evaluate((el) => el.getBoundingClientRect().top);
      expect(Math.abs(top)).toBeLessThanOrEqual(2);
    }).toPass();
  });

  test('gallery detail (/galleries/silos/) — .detail-hero__pin computes position:sticky and holds at the viewport top while scrolling', async ({
    page,
  }) => {
    await page.goto('/galleries/silos/');

    const pin = page.locator('.detail-hero__pin');
    await expect(pin).toBeVisible();
    const pinPosition = await pin.evaluate((el) => getComputedStyle(el).position);
    expect(pinPosition).toBe('sticky');

    await page.evaluate(() => {
      const hero = document.querySelector('.detail-hero')!;
      window.scrollBy(0, hero.getBoundingClientRect().top + 300);
    });

    await expect(async () => {
      const top = await pin.evaluate((el) => el.getBoundingClientRect().top);
      expect(Math.abs(top)).toBeLessThanOrEqual(2);
    }).toPass();
  });

  test('first édition detail page — .detail-hero__pin computes position:sticky and holds at the viewport top while scrolling', async ({
    page,
  }) => {
    const href = await firstEditionHref(page);
    await page.goto(href);

    const pin = page.locator('.detail-hero__pin');
    await expect(pin).toBeVisible();
    const pinPosition = await pin.evaluate((el) => getComputedStyle(el).position);
    expect(pinPosition).toBe('sticky');

    await page.evaluate(() => {
      const hero = document.querySelector('.detail-hero')!;
      window.scrollBy(0, hero.getBoundingClientRect().top + 300);
    });

    await expect(async () => {
      const top = await pin.evaluate((el) => el.getBoundingClientRect().top);
      expect(Math.abs(top)).toBeLessThanOrEqual(2);
    }).toPass();
  });
});

// Block C — page title header full-bleed geometry (UI-01 bleed). Asserts
// computed geometry/style only — never greps PageTitleHeader.astro's
// source for the presence/absence of an `overflow-x` string, so this
// stays a behavioral contract, not a text-matching tautology. Expected to
// FAIL against the pre-Task-2 tree (the halftone's box is still clipped
// to .page-title-header's own width today).
test.describe('page title header full-bleed geometry (UI-01 bleed)', () => {
  for (const path of ['/contact/', '/about/', '/editions/']) {
    for (const viewport of [
      { width: 1280, height: 900 },
      { width: 1920, height: 1080 },
    ] as const) {
      test(`${path} at ${viewport.width}x${viewport.height}: halftone box spans the full client width and stays above the header top`, async ({
        page,
      }) => {
        await page.setViewportSize(viewport);
        await page.goto(path);

        const halftone = page.locator('.page-title-header__halftone');
        await expect(halftone).toBeAttached();
        const display = await halftone.evaluate((el) => getComputedStyle(el).display);
        expect(display).not.toBe('none');

        const headerOverflowX = await page
          .locator('.page-title-header')
          .evaluate((el) => getComputedStyle(el).overflowX);
        expect(headerOverflowX).toBe('visible');

        const geometry = await page.evaluate(() => {
          const halftoneEl = document.querySelector('.page-title-header__halftone')!;
          const headerEl = document.querySelector('.page-title-header')!;
          const halftoneRect = halftoneEl.getBoundingClientRect();
          const headerRect = headerEl.getBoundingClientRect();
          return {
            left: halftoneRect.left,
            right: halftoneRect.right,
            top: halftoneRect.top,
            headerTop: headerRect.top,
            clientWidth: document.documentElement.clientWidth,
          };
        });

        expect(geometry.left, `${path} halftone left at ${viewport.width}px`).toBeLessThanOrEqual(0.5);
        expect(
          geometry.right,
          `${path} halftone right at ${viewport.width}px`,
        ).toBeGreaterThanOrEqual(geometry.clientWidth - 0.5);
        // The vertical bleed (top: -700px) must survive untouched — nobody
        // should "fix" the horizontal bleed by flattening the vertical one.
        expect(geometry.top).toBeLessThan(geometry.headerTop);
      });
    }
  }

  // Mobile behavior is deliberately unchanged by this plan (scope
  // clarification, planning_measurements): the halftone is display:none
  // below 760px, and there is no texture to bleed at that width.
  test('at 375x812 the halftone stays display:none on /contact/, /about/ and /editions/', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    for (const path of ['/contact/', '/about/', '/editions/']) {
      await page.goto(path);
      const halftone = page.locator('.page-title-header__halftone');
      const display = await halftone.evaluate((el) => getComputedStyle(el).display);
      expect(display, `${path} halftone display at 375px`).toBe('none');
    }
  });
});
