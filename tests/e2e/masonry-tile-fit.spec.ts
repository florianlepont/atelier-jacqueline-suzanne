import { test, expect } from '@playwright/test';
import { firstEditionHref, firstGalleryHref } from './helpers/content';

// 260825-hl7 (BUG-03): a thin near-black fringe could show along one edge
// of some masonry photo tiles, because object-fit: contain padded the
// sub-pixel rounding gap between the Sanity-served image ratio and the CSS
// aspect-ratio box, letting .tile's background: var(--color-ink) show
// through. object-fit: cover absorbs that same gap as an imperceptible crop
// instead. GalleryGrid.astro's masonry layout is shared by both content
// types (which is exactly why this bug appeared on both), so this checks
// one gallery and one édition.

test.describe('masonry tiles can never show the tile background (BUG-03)', () => {
  test('every masonry tile img uses object-fit: cover, with its aspect-ratio box intact, on a gallery detail page', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    const href = await firstGalleryHref(page, 'fr');
    await page.goto(href);

    await assertMasonryTilesFitCorrectly(page);
  });

  test('every masonry tile img uses object-fit: cover, with its aspect-ratio box intact, on an édition detail page', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/editions/');
    const href = await firstEditionHref(page, 'fr');
    await page.goto(href);

    await assertMasonryTilesFitCorrectly(page);
  });
});

async function assertMasonryTilesFitCorrectly(page: import('@playwright/test').Page): Promise<void> {
  const grid = page.locator('.gallery-grid--masonry');
  await expect(grid).toBeVisible();

  const tileImgs = grid.locator('.tile img');
  const count = await tileImgs.count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i++) {
    const img = tileImgs.nth(i);
    const data = await img.evaluate((el) => {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      const ar = style.getPropertyValue('--ar') || el.style.getPropertyValue('--ar');
      return {
        objectFit: style.objectFit,
        width: rect.width,
        height: rect.height,
        ar: Number.parseFloat(ar) || null,
      };
    });

    expect(data.objectFit, `tile ${i} is not object-fit: cover`).toBe('cover');
    expect(data.width, `tile ${i} has a zero-width rendered box`).toBeGreaterThan(0);
    expect(data.height, `tile ${i} has a zero-height rendered box`).toBeGreaterThan(0);

    if (data.ar) {
      // The aspect-ratio box must still be doing its job -- proves `cover`
      // isn't masking a genuinely wrong `--ar`, only absorbing a sub-pixel
      // rounding gap.
      const expectedHeight = data.width / data.ar;
      expect(Math.abs(data.height - expectedHeight), `tile ${i} height does not match width / --ar`).toBeLessThanOrEqual(
        1,
      );
    }
  }
}
