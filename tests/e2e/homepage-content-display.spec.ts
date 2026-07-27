import { test, expect } from '@playwright/test';

test.describe('collection statements on the homepage', () => {
  // quick-260725-tqs (Item 2): the carousel's own per-slide byline/
  // description was removed (grid tiles keep their own hover description,
  // asserted below, unchanged) — this replaces the old "uses the current
  // statement" test, which targeted an element that no longer exists.
  test('carousel byline/description is removed, on FR and EN', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-role="gallery-statement"]')).toHaveCount(0);
    await expect(page.locator('.home-hero__byline')).toHaveCount(0);

    await page.goto('/en/');
    await expect(page.locator('[data-role="gallery-statement"]')).toHaveCount(0);
    await expect(page.locator('.home-hero__byline')).toHaveCount(0);
  });

  test('grid tile reveals its collection statement on hover', async ({page}) => {
    await page.goto('/');
    await page.getByRole('button', {name: 'Grille'}).click();

    const tile = page.locator('a.home-grid__tile').first();
    const description = tile.locator('.home-grid__tile-description');
    await expect(description).toHaveText(/.+/);
    await tile.hover();
    await expect(description).toHaveCSS('opacity', '1');
  });

  test('carousel keeps its navigation fixed and clamps the caption width', async ({ page }) => {
    await page.setViewportSize({ width: 2048, height: 1152 });
    await page.goto('/');

    const carousel = page.locator('[data-role="home-carousel"]');
    await carousel.hover();

    const progress = carousel.locator('[data-role="progress"]');
    const dashes = progress.locator('[data-action="go-to"]');
    const progressPositions: number[] = [];

    for (let index = 0; index < await dashes.count(); index += 1) {
      await dashes.nth(index).click();
      const box = await progress.boundingBox();
      expect(box).not.toBeNull();
      progressPositions.push(box!.y);
    }

    expect(Math.max(...progressPositions) - Math.min(...progressPositions)).toBeLessThanOrEqual(1);

    const layout = await carousel.evaluate((element) => {
      const caption = element.querySelector<HTMLElement>('.home-hero__caption')!;
      const indexLabel = element.querySelector<HTMLElement>('[data-role="index-label"]')!;
      const title = element.querySelector<HTMLElement>('[data-role="gallery-title"]')!;
      const accent = element.querySelector<HTMLElement>('[data-role="accent-panel"]')!;
      const captionRect = caption.getBoundingClientRect();
      const indexRect = indexLabel.getBoundingClientRect();
      const titleRect = title.getBoundingClientRect();
      const accentRect = accent.getBoundingClientRect();

      return {
        captionRight: captionRect.right,
        captionWidth: captionRect.width,
        indexTitleGap: titleRect.top - indexRect.bottom,
        titleFontSize: parseFloat(getComputedStyle(title).fontSize),
        accentLeft: accentRect.left,
      };
    });

    // Item 4 narrowed the accent panel (min(800px,60%) -> min(700px,52%)),
    // but the caption's own right-offset calc tracks the SAME panel width
    // token, so the clearance between the caption's right edge and the
    // panel's left edge is invariant at exactly var(--space-3xl) (64px)
    // regardless of the panel's own width — these bounds still hold
    // unchanged after the narrowing.
    expect(layout.captionRight).toBeLessThanOrEqual(layout.accentLeft);
    expect(layout.captionWidth).toBeLessThanOrEqual(721);
    expect(layout.indexTitleGap).toBeGreaterThanOrEqual(11);
    expect(layout.titleFontSize).toBe(18);
    expect(layout.accentLeft - layout.captionRight).toBeGreaterThanOrEqual(63);
  });
});

test.describe('carousel title has no underline (quick-260726-obg)', () => {
  test('the title renders with no underline at rest or on hover, keeping its accent-color hover and pointer cursor', async ({ page }) => {
    await page.goto('/');

    const title = page.locator('[data-role="gallery-title"]');
    await expect(title).toHaveCSS('text-decoration-line', 'none');

    await title.hover();
    await expect(title).toHaveCSS('text-decoration-line', 'none');
  });
});

test.describe('carousel intro paragraph resize + reposition (Item 5)', () => {
  test('desktop: 15px font-size, confined to roughly two-thirds of the panel', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto('/');

    const intro = page.locator('.home-hero__intro');
    const fontSize = await intro.evaluate((el) => getComputedStyle(el).fontSize);
    expect(fontSize).toBe('15px');

    const layout = await page.evaluate(() => {
      const accent = document.querySelector('.home-hero__accent')!.getBoundingClientRect();
      const intro = document.querySelector('.home-hero__intro')!.getBoundingClientRect();
      return { accentInnerWidth: accent.width, introWidth: intro.width };
    });
    // Measured ratio at this viewport is ~0.606 — comfortably inside
    // (0.55, 0.70]; the old 50% rule produced ~0.454, which would fail the
    // lower bound, so this asserts the widen rather than merely loosening it.
    expect(layout.introWidth).toBeLessThanOrEqual(layout.accentInnerWidth * 0.7);
    expect(layout.introWidth).toBeGreaterThan(layout.accentInnerWidth * 0.55);
  });

  test('mobile: the intro is not squeezed to half-width (max-width: none)', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto('/');

    const intro = page.locator('.home-hero__intro');
    const maxWidth = await intro.evaluate((el) => getComputedStyle(el).maxWidth);
    expect(maxWidth === 'none' || maxWidth === '').toBe(true);
  });
});

test.describe('grid hero tile text color tracks accent (260718-r2o)', () => {
  test('grid hero tile color reads the --current-accent-text variable, not a hardcoded ink value', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();

    // Set a sentinel value that is never a real accent text color, then read
    // back the tile's computed color. If the tile still consumed a hardcoded
    // ink value, the computed color would NOT match the sentinel.
    await page.evaluate(() => {
      (document.querySelector('.home') as HTMLElement).style.setProperty(
        '--current-accent-text',
        'rgb(0, 255, 0)',
      );
    });

    const heroTile = page.locator('.home-grid__tile--hero');
    const color = await heroTile.evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe('rgb(0, 255, 0)');
  });
});

test.describe('grid-tile title alignment (260718-rhv)', () => {
  test('every gallery tile title sits at the same offset from its own tile bottom edge', async ({ page }) => {
    // Skips the shared-element view-transition animation (see the
    // 'view-transition toggle — reduced-motion' describe block above for
    // the same pattern) — without this, an evaluate() taken immediately
    // after the toggle click can race the in-flight transition on
    // whichever tile currently carries view-transition-name, momentarily
    // reporting a zero-size bounding rect unrelated to this task's fix.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();

    // Belt-and-braces alongside the reduced-motion emulation above: the
    // shared-element view transition still briefly zeroes out the morph-
    // named tile's rendered box while its snapshot pseudo-element is
    // active, even with the animation itself instant, so wait for every
    // title to report a real (non-zero) box before measuring geometry.
    await page.waitForFunction(() => {
      const titles = document.querySelectorAll<HTMLElement>('a.home-grid__tile .home-grid__tile-title');
      return titles.length > 0 && Array.from(titles).every((title) => title.getBoundingClientRect().height > 0);
    });

    const tiles = page.locator('a.home-grid__tile');
    const count = await tiles.count();
    expect(count).toBeGreaterThan(0);

    const offsets: number[] = [];
    for (let index = 0; index < count; index += 1) {
      const tile = tiles.nth(index);
      const offset = await tile.evaluate((el) => {
        const title = el.querySelector<HTMLElement>('.home-grid__tile-title')!;
        const tileRect = el.getBoundingClientRect();
        const titleRect = title.getBoundingClientRect();
        return tileRect.bottom - titleRect.top;
      });
      offsets.push(offset);
    }

    expect(Math.max(...offsets) - Math.min(...offsets)).toBeLessThanOrEqual(1);
  });

  test('clearing a tile statement does not change its title offset (empty-statement defensive)', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();

    await page.waitForFunction(() => {
      const titles = document.querySelectorAll<HTMLElement>('a.home-grid__tile .home-grid__tile-title');
      return titles.length > 0 && Array.from(titles).every((title) => title.getBoundingClientRect().height > 0);
    });

    const tile = page.locator('a.home-grid__tile').first();

    const beforeOffset = await tile.evaluate((el) => {
      const title = el.querySelector<HTMLElement>('.home-grid__tile-title')!;
      const tileRect = el.getBoundingClientRect();
      const titleRect = title.getBoundingClientRect();
      return tileRect.bottom - titleRect.top;
    });

    const afterOffset = await tile.evaluate((el) => {
      const description = el.querySelector<HTMLElement>('.home-grid__tile-description')!;
      description.textContent = '';
      const title = el.querySelector<HTMLElement>('.home-grid__tile-title')!;
      const tileRect = el.getBoundingClientRect();
      const titleRect = title.getBoundingClientRect();
      return tileRect.bottom - titleRect.top;
    });

    expect(Math.abs(afterOffset - beforeOffset)).toBeLessThanOrEqual(1);
  });
});

test.describe('grid-tile hover polish (260718-rhv)', () => {
  test('each non-hero tile carries its own --tile-accent custom property', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();

    const tile = page.locator('a.home-grid__tile').first();
    const accent = await tile.evaluate((el) => getComputedStyle(el).getPropertyValue('--tile-accent').trim());
    expect(accent).not.toBe('');
  });

  test('hovering a tile raises its scrim tint pseudo-element opacity', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();

    const tile = page.locator('a.home-grid__tile').first();
    const scrim = tile.locator('.home-grid__tile-scrim');

    const before = await scrim.evaluate((el) => parseFloat(getComputedStyle(el, '::after').opacity));
    expect(before).toBeLessThanOrEqual(0.05);

    await tile.hover();

    await expect
      .poll(async () => scrim.evaluate((el) => parseFloat(getComputedStyle(el, '::after').opacity)))
      .toBeGreaterThan(0.05);
  });

  test('hovering a tile lifts its title (non-identity transform)', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();

    const tile = page.locator('a.home-grid__tile').first();
    const title = tile.locator('.home-grid__tile-title');

    const before = await title.evaluate((el) => getComputedStyle(el).transform);
    expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(before);

    await tile.hover();

    await expect
      .poll(async () => title.evaluate((el) => getComputedStyle(el).transform))
      .not.toBe(before);
  });

  test('keyboard focus applies the same tint and lift as hover', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();

    const tile = page.locator('a.home-grid__tile').first();
    const scrim = tile.locator('.home-grid__tile-scrim');
    const title = tile.locator('.home-grid__tile-title');
    const beforeTransform = await title.evaluate((el) => getComputedStyle(el).transform);

    // Real Tab-key navigation (not locator.focus(), a scripted .focus()
    // call that Chromium's :focus-visible heuristic does not reliably
    // treat as keyboard-originated) so the shared `:hover, :focus-visible`
    // CSS selector genuinely activates, matching how a real keyboard user
    // reaches the tile.
    await expect(async () => {
      await page.keyboard.press('Tab');
      await expect(tile).toBeFocused({ timeout: 200 });
    }).toPass({ timeout: 10_000 });

    await expect
      .poll(async () => scrim.evaluate((el) => parseFloat(getComputedStyle(el, '::after').opacity)))
      .toBeGreaterThan(0.05);
    await expect
      .poll(async () => title.evaluate((el) => getComputedStyle(el).transform))
      .not.toBe(beforeTransform);
  });
});

test.describe('homepage hero photo matches the gallery detail hero (landscape-preference consistency)', () => {
  test('every home-grid tile photo pathname equals its gallery detail-hero photo pathname', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();

    const tiles = page.locator('a.home-grid__tile');
    const tileCount = await tiles.count();
    expect(tileCount).toBeGreaterThan(0);

    let assertedCount = 0;
    for (let index = 0; index < tileCount; index += 1) {
      const tile = tiles.nth(index);
      const href = await tile.getAttribute('href');
      expect(href).toBeTruthy();
      const tileSrc = await tile.locator('.home-grid__tile-img--sharp').getAttribute('src');
      expect(tileSrc).toBeTruthy();

      await page.goto(href!);
      const heroSrc = await page.locator('.detail-hero__img').getAttribute('src');
      expect(heroSrc).toBeTruthy();

      // The homepage tile uses a square-crop thumbnail transform while the
      // detail hero uses a max-fit full-size transform, so their query
      // strings legitimately differ — the CDN pathname alone
      // (`/images/{project}/{dataset}/{assetId}-{w}x{h}.{ext}`) is derived
      // from the underlying asset ref and proves byte-identical asset
      // identity. Because the carousel hero (heroSrc) and this grid tile
      // (gridSrc) both derive from the SAME `cover` in the homepage's
      // `.map()`, this grid-tile <-> detail-hero proof transitively covers
      // carousel <-> detail identity too.
      expect(new URL(tileSrc!).pathname).toBe(new URL(heroSrc!).pathname);
      assertedCount += 1;

      await page.goto('/');
      await page.getByRole('button', { name: 'Grille' }).click();
    }

    expect(assertedCount).toBeGreaterThan(0);
  });
});

test.describe('cross-document morph — click-time source name assignment (sketch 006)', () => {
  test('clicking the carousel title assigns hero-photo to the current slide\'s sharp photo', async ({ page }) => {
    await page.goto('/');

    await page.evaluate(() => {
      document.querySelector('.home-hero__title')?.addEventListener(
        'click',
        (e) => e.preventDefault(),
        { capture: true },
      );
    });

    await page.locator('.home-hero__title').click();

    const heroPhoto = page.locator('.home-hero__photo .home-hero__img--sharp');
    const name = await heroPhoto.evaluate((el) => (el as HTMLElement).style.viewTransitionName);
    expect(name).toBe('hero-photo');
  });

  test('clicking a grid tile assigns hero-photo to that tile\'s sharp photo', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();

    const firstTile = page.locator('a.home-grid__tile:not(.home-grid__tile--hero)').first();

    await page.evaluate(() => {
      document.querySelector('a.home-grid__tile:not(.home-grid__tile--hero)')?.addEventListener(
        'click',
        (e) => e.preventDefault(),
        { capture: true },
      );
    });

    await firstTile.click();

    const tileImg = firstTile.locator('.home-grid__tile-img--sharp');
    const name = await tileImg.evaluate((el) => (el as HTMLElement).style.viewTransitionName);
    expect(name).toBe('hero-photo');
  });
});
