import { test, expect } from '@playwright/test';
import { galleryHrefs } from './helpers/content';

// 260825-hl7 (BUG-01): a long single-word gallery/édition title (e.g. the
// live "Trousseau" gallery) previously overflowed the desktop reveal panel
// to the right, past the window edge -- .detail-hero__reveal's max-width
// (420px) was narrower than several real titles, and .detail-hero__reveal-title
// had no wrap property to fall back on. The fix widens the panel (measured
// against the real content, see 260825-hl7-SUMMARY.md) AND adds an
// overflow-wrap safety net for any future title too wide even for that.

const VIEWPORTS = [
  { width: 1280, height: 800 },
  { width: 1600, height: 900 },
];

test.describe('detail hero reveal title never overflows its panel or the viewport (BUG-01)', () => {
  for (const viewport of VIEWPORTS) {
    test(`every gallery's title stays inside the reveal panel and the viewport at ${viewport.width}x${viewport.height}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto('/');
      const hrefs = await galleryHrefs(page, 'fr');
      expect(hrefs.length).toBeGreaterThan(0);

      for (const href of hrefs) {
        await page.goto(href);
        // Settle the desktop scroll-reveal driver (DetailHero.astro's
        // onProgress) at its end state (t=1, REVEAL_DISTANCE=900) before
        // reading layout.
        await page.evaluate(() => window.scrollTo(0, 1200));
        await page.waitForTimeout(150);

        const result = await page.evaluate(() => {
          const reveal = document.querySelector<HTMLElement>('.detail-hero__reveal');
          const title = document.querySelector<HTMLElement>('.detail-hero__reveal-title');
          if (!reveal || !title) return null;
          const revealRect = reveal.getBoundingClientRect();
          const titleRect = title.getBoundingClientRect();
          return {
            titleRight: titleRect.right,
            revealRight: revealRect.right,
            scrollWidth: title.scrollWidth,
            clientWidth: title.clientWidth,
            viewportWidth: window.innerWidth,
          };
        });
        expect(result, `.detail-hero__reveal/-title missing on ${href}`).not.toBeNull();
        const { titleRight, revealRight, scrollWidth, clientWidth, viewportWidth } = result!;

        // 1px rounding tolerance, as specified by the plan.
        expect(titleRight, `title overflowed its own panel on ${href}`).toBeLessThanOrEqual(revealRight + 1);
        expect(titleRight, `title overflowed the viewport on ${href}`).toBeLessThan(viewportWidth);
        expect(scrollWidth, `title has horizontal overflow on ${href}`).toBeLessThanOrEqual(clientWidth);
      }
    });
  }

  test('an injected ~40-character unbroken word wraps instead of overflowing (durable safety net)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    const [href] = await galleryHrefs(page, 'fr');
    await page.goto(href);
    await page.evaluate(() => window.scrollTo(0, 1200));
    await page.waitForTimeout(150);

    const result = await page.evaluate(() => {
      const title = document.querySelector<HTMLElement>('.detail-hero__reveal-title')!;
      // 41 characters, no spaces/hyphens -- genuinely unbreakable without
      // overflow-wrap.
      title.textContent = 'Xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
      const rect = title.getBoundingClientRect();
      const reveal = document.querySelector<HTMLElement>('.detail-hero__reveal')!;
      const revealRect = reveal.getBoundingClientRect();
      return {
        scrollWidth: title.scrollWidth,
        clientWidth: title.clientWidth,
        titleRight: rect.right,
        revealRight: revealRect.right,
        height: rect.height,
      };
    });

    expect(result.scrollWidth, 'injected long word overflowed horizontally').toBeLessThanOrEqual(
      result.clientWidth,
    );
    expect(result.titleRight, 'injected long word overflowed its panel').toBeLessThanOrEqual(
      result.revealRight + 1,
    );
    // A single line at this font-size (clamp(40px, 6vw, 72px)) is well
    // under 100px tall -- proves the string actually wrapped across
    // multiple lines rather than merely fitting on one, confirming the
    // wrap mechanism (not a no-op container resize) is what prevented the
    // overflow above.
    expect(result.height, 'expected the unbreakable word to wrap onto multiple lines').toBeGreaterThan(100);
  });
});
