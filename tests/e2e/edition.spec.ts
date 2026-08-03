import { test, expect } from '@playwright/test';

// These routes are live: `/editions/`, `/en/editions/` render the
// sketch-010-B2-approved "Cursor Preview" flat text-row index (index
// label + big title + statement, floating hover-following photo panel on
// desktop); `/editions/{slug}/`, `/en/editions/{slug}/` render the
// per-édition détail page. Discover the détail URL dynamically from the
// overview's first `.editions-index__row` href — never hardcode a slug,
// never use the main nav (nav wiring is Phase 13).

// <!-- planner-discipline-allow: prix price acheter buy panier cart stock disponib availab épuisé -->
// Mirrors tests/scripts/verify-static-artifact.mjs's whole-word token matching:
// a naive substring/regex match on "cart"/"stock" false-positives on real
// French words that contain them (e.g. "cartographique", "stockage", "écart")
// — exactly the kind of thing only real editorial content (not the seeded
// fixture) surfaces. disponib/availab are deliberate prefix stems (also
// catch "disponibilité"/"availability"); every other token is whole-word only.
const wholeWordCommerceTokens = [
  'prix',
  'price',
  'acheter',
  'buy',
  'panier',
  'cart',
  'stock',
  'sold out',
  'épuisé',
];
const prefixCommerceTokens = ['disponib', 'availab'];
const symbolCommerceTokens = ['€', '$'];
const LETTER = /[a-zà-öø-ÿ]/i;

function containsWholeWord(haystack: string, needle: string): boolean {
  let index = haystack.indexOf(needle);
  while (index !== -1) {
    const before = haystack[index - 1];
    const after = haystack[index + needle.length];
    const beforeIsLetter = before !== undefined && LETTER.test(before);
    const afterIsLetter = after !== undefined && LETTER.test(after);
    if (!beforeIsLetter && !afterIsLetter) return true;
    index = haystack.indexOf(needle, index + 1);
  }
  return false;
}

function containsForbiddenCommerceToken(text: string): boolean {
  const lower = text.toLowerCase();
  if (symbolCommerceTokens.some((token) => lower.includes(token))) return true;
  if (prefixCommerceTokens.some((token) => lower.includes(token))) return true;
  return wholeWordCommerceTokens.some((token) => containsWholeWord(lower, token));
}

test.describe('editions overview', () => {
  test('lists each published édition as a linked row with title and full statement (fr)', async ({
    page,
  }) => {
    await page.goto('/editions/');

    const row = page.locator('.editions-index__row').first();
    await expect(row).toBeVisible();

    const title = row.locator('.editions-index__title');
    const titleText = (await title.innerText()).trim();
    expect(titleText.length).toBeGreaterThan(0);

    // The statement is CSS-hidden (opacity:0/max-height:0) until hover, but
    // its text is always present in the DOM — textContent() is
    // state-independent, matching the pattern used at the detail no-JS
    // reachability test below.
    const statement = row.locator('.editions-index__statement');
    const frStatementText = (await statement.textContent())?.trim();
    expect(frStatementText?.length).toBeGreaterThan(0);

    const href = await row.getAttribute('href');
    expect(href).toMatch(/\/editions\/[^/]+\/?$/);
  });

  test('renders the English overview at /en/editions/ with a differing, untruncated statement', async ({
    page,
  }) => {
    await page.goto('/editions/');
    const frStatement = (
      await page.locator('.editions-index__row').first().locator('.editions-index__statement').textContent()
    )?.trim();

    await page.goto('/en/editions/');

    const row = page.locator('.editions-index__row').first();
    await expect(row).toBeVisible();

    const statement = row.locator('.editions-index__statement');
    const enStatementText = (await statement.textContent())?.trim();
    expect(enStatementText?.length).toBeGreaterThan(0);
    expect(enStatementText).not.toBe(frStatement);

    const href = await row.getAttribute('href');
    expect(href).toMatch(/\/en\/editions\/[^/]+\/?$/);
  });

  test('shows no price, availability, or purchase affordance (EDN-06)', async ({ page }) => {
    await page.goto('/editions/');
    const frMainText = await page.locator('main').innerText();
    expect(containsForbiddenCommerceToken(frMainText)).toBe(false);

    await page.goto('/en/editions/');
    const enMainText = await page.locator('main').innerText();
    expect(containsForbiddenCommerceToken(enMainText)).toBe(false);
  });
});

// Détail routes. Discover the détail URL dynamically from the overview's
// first `.editions-index__row` href (never hardcode a slug, never use the main nav — nav
// wiring is Phase 13).

test.describe('editions detail', () => {
  // quick-260803-bvu (Item 5 & 6): rewritten for the new contract — the
  // format-details line now appears EXACTLY ONCE (inside DetailHero's
  // reveal panel, accessible, visible on mobile too — the old
  // `.edition-detail__format` duplicate paragraph is gone), and the old
  // in-flow back-link is gone entirely (replaced by the scroll-up-to-
  // return gesture, covered in its own describe block below).
  test('shows a bilingual statement and a format-details line that appears exactly once, in the hero reveal panel; no back-link', async ({
    page,
  }) => {
    await page.goto('/editions/');
    const frHref = await page.locator('.editions-index__row').first().getAttribute('href');
    expect(frHref).toBeTruthy();

    const slugMatch = frHref!.match(/\/editions\/([^/]+)\/?$/);
    const slug = slugMatch?.[1];
    expect(slug).toBeTruthy();
    const enHref = `/en/editions/${slug}/`;

    await page.goto(frHref!);
    const frStatement = (await page.locator('.detail-hero__statement').innerText()).trim();
    expect(frStatement.length).toBeGreaterThan(0);

    // Exactly one instance, and it lives inside the hero reveal panel.
    await expect(page.locator('.edition-detail__format')).toHaveCount(0);
    const frFormat = page.locator('.detail-hero__format');
    await expect(frFormat).toHaveCount(1);
    await expect(frFormat).toBeVisible();
    const frFormatText = await frFormat.innerText();
    expect(frFormatText).toMatch(/\d/);
    // Case-insensitive: .detail-hero__format renders text-transform:
    // uppercase, and Playwright's innerText() reflects the rendered
    // (CSS-transformed) text, not the underlying DOM string case.
    expect(frFormatText).toMatch(/Tirage/i);
    expect(frFormatText).toMatch(/cm|in/i);
    // Real content, not decorative — reachable by assistive technology.
    await expect(frFormat).not.toHaveAttribute('aria-hidden', 'true');

    await expect(page.locator('.edition-detail__back-link')).toHaveCount(0);

    await page.goto(enHref);
    const enStatement = (await page.locator('.detail-hero__statement').innerText()).trim();
    expect(enStatement.length).toBeGreaterThan(0);
    expect(enStatement).not.toBe(frStatement);

    await expect(page.locator('.edition-detail__format')).toHaveCount(0);
    const enFormat = page.locator('.detail-hero__format');
    await expect(enFormat).toHaveCount(1);
    await expect(enFormat).toBeVisible();
    const enFormatText = await enFormat.innerText();
    expect(enFormatText).toMatch(/\d/);
    expect(enFormatText).toMatch(/Print run/i);
    expect(enFormatText).toMatch(/cm|in/i);
    await expect(enFormat).not.toHaveAttribute('aria-hidden', 'true');

    await expect(page.locator('.edition-detail__back-link')).toHaveCount(0);
  });

  // quick-260803-bvu (Item 5): the format line must remain visible on
  // mobile too — DetailHero.astro's mobile media query used to force
  // `display: none` on it (back when a second, real copy existed below the
  // hero); now that this reveal-panel copy is the ONLY instance, it must
  // render there.
  test('the format-details line is visible on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/editions/');
    const href = await page.locator('.editions-index__row').first().getAttribute('href');
    expect(href).toBeTruthy();

    await page.goto(href!);
    await expect(page.locator('.detail-hero__format')).toBeVisible();
  });

  // quick-260724-rhq: proves the full, untruncated statement is present in
  // the DOM regardless of the reveal panel's opacity:0-pending-scroll state
  // and the visual 4-line clamp. Éditions set seoDescription = statement
  // verbatim, and BaseLayout emits <meta name="description" content={...}>
  // verbatim -- so comparing .detail-hero__statement's textContent() (which
  // reads the DOM independent of CSS opacity/clamping) against the meta
  // description proves the complete statement is reachable without JS.
  test('the full statement text is present in the DOM (no-JS reachability), matching the page meta description', async ({
    page,
  }) => {
    await page.goto('/editions/');
    const frHref = await page.locator('.editions-index__row').first().getAttribute('href');
    expect(frHref).toBeTruthy();

    await page.goto(frHref!);

    const statementText = (await page.locator('.detail-hero__statement').textContent())?.trim();
    const metaDescription = (
      await page.locator('meta[name="description"]').getAttribute('content')
    )?.trim();

    expect(statementText).toBeTruthy();
    expect(metaDescription).toBeTruthy();
    expect(statementText).toBe(metaDescription);
  });
});

// quick-260803-jwl: an édition hero photo and a gallery detail hero photo
// crop to fill their box identically — quick-260803-bvu Item 7 briefly made
// the édition hero render its whole photo uncropped instead (letterboxed on
// the pin's own ink background), diverging from the gallery treatment, but
// that was reverted at the owner's explicit request ("remets la primary en
// zoomée comme avant") so both heroes are the same crop treatment again —
// mirrors gallery.spec.ts's own hero-photo assertions so this guard lives
// next to its counterpart.
test.describe('editions hero crops identically to a gallery hero (quick-260803-jwl)', () => {
  test('an édition hero photo reports the same object-fit as a gallery hero, both cropped', async ({
    page,
  }) => {
    await page.goto('/editions/');
    const rowHref = await page.locator('.editions-index__row').first().getAttribute('href');
    expect(rowHref).toBeTruthy();

    await page.goto(rowHref!);
    const editionObjectFit = await page
      .locator('.detail-hero__img')
      .evaluate((el) => getComputedStyle(el).objectFit);
    expect(editionObjectFit).toBe('cover');

    // There is no standalone galleries overview page (the homepage grid is
    // the sole browse entry point — see PROJECT.md) — discover a real
    // gallery detail href from the homepage grid instead, mirroring
    // gallery.spec.ts's own discovery pattern.
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();
    const galleryHref = await page.locator('a.home-grid__tile').first().getAttribute('href');
    expect(galleryHref).toBeTruthy();
    await page.goto(galleryHref!);
    const galleryObjectFit = await page
      .locator('.detail-hero__img')
      .evaluate((el) => getComputedStyle(el).objectFit);
    expect(galleryObjectFit).toBe('cover');
  });
});

// quick-260803-ira changed GalleryGrid.astro's shared `.tile img` base rule
// so the secondary photos in the bento grid below the hero stopped being
// cropped, switching the rule's `object-fit` from crop to contain. That
// stopped the crop but, because bento's cells have a fixed size independent
// of each photo's real ratio, the photo then letterboxed against the tile's
// own ink background — confirmed live on review. quick-260803-jby
// replaces the mechanism instead of patching it again: éditions now render
// the same masonry layout gallery detail pages already use, where each
// tile's box IS the photo's own shape (driven by a real per-photo
// aspectRatio), so `object-fit: contain` fits edge to edge with nothing left
// over to expose a background on any side.
async function pollHoverZoomScale(img: import('@playwright/test').Locator) {
  await expect
    .poll(async () => {
      const transform = await img.evaluate((el) => getComputedStyle(el).transform);
      const match = transform.match(/^matrix\(([^,]+),/);
      if (!match) return null;
      const scale = Number(match[1]);
      return scale > 1.02 && scale < 1.04 ? scale : null;
    })
    .not.toBeNull();
}

// Measures every tile in the currently-loaded page's `.gallery-grid` and
// asserts the full masonry contract: masonry class present, zero bento
// groups, multi-column flow, and — for every tile — a static-positioned,
// uncropped img whose rendered ratio matches the photo's own natural ratio
// and whose bounding box is flush with its tile's on all four edges (the
// assertion that literally encodes the owner's complaint: no tile
// background can be visible around any photo). Returns the number of tiles
// actually measured so callers can prove the loop was never vacuous.
async function assertGridIsFlushMasonry(page: import('@playwright/test').Page): Promise<number> {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

  const grid = page.locator('.gallery-grid');
  const tiles = page.locator('.gallery-grid .tile');
  await expect(tiles.first()).toHaveClass(/revealed/);

  await expect(grid).toHaveClass(/gallery-grid--masonry/);
  expect(await page.locator('.gallery-grid__group').count()).toBe(0);
  const columnCount = await grid.evaluate((el) => getComputedStyle(el).columnCount);
  expect(Number(columnCount)).toBeGreaterThan(1);

  const tileCount = await tiles.count();
  expect(tileCount).toBeGreaterThan(0);

  // Tiles are lazily loaded — poll until every img has actually decoded a
  // real image before measuring, or the ratio/flush checks below would race
  // a still-loading <img> into a false NaN/0 measurement.
  await expect
    .poll(async () =>
      page
        .locator('.gallery-grid .tile img')
        .evaluateAll(
          (els) =>
            els.filter((el) => (el as HTMLImageElement).complete && (el as HTMLImageElement).naturalWidth > 0)
              .length,
        ),
    )
    .toBe(tileCount);

  const measurements = await tiles.evaluateAll((tileEls) =>
    tileEls.map((tileEl) => {
      const img = tileEl.querySelector('img') as HTMLImageElement;
      const tileRect = tileEl.getBoundingClientRect();
      const imgRect = img.getBoundingClientRect();
      const style = getComputedStyle(img);
      return {
        position: style.position,
        objectFit: style.objectFit,
        aspectRatio: style.aspectRatio,
        clientRatio: img.clientWidth / img.clientHeight,
        naturalRatio: img.naturalWidth / img.naturalHeight,
        top: imgRect.top - tileRect.top,
        right: tileRect.right - imgRect.right,
        bottom: tileRect.bottom - imgRect.bottom,
        left: imgRect.left - tileRect.left,
      };
    }),
  );

  for (const m of measurements) {
    expect(m.position).toBe('static');
    expect(m.objectFit).not.toBe('cover');
    expect(m.aspectRatio).not.toBe('auto');
    expect(Math.abs(m.clientRatio - m.naturalRatio) / m.naturalRatio).toBeLessThan(0.01);
    expect(Math.abs(m.top)).toBeLessThan(0.5);
    expect(Math.abs(m.right)).toBeLessThan(0.5);
    expect(Math.abs(m.bottom)).toBeLessThan(0.5);
    expect(Math.abs(m.left)).toBeLessThan(0.5);
  }

  return measurements.length;
}

test.describe('editions masonry grid photos uncropped and flush (quick-260803-jby)', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('every published édition (fr): masonry grid, no bento groups, every tile flush and uncropped at its own natural ratio', async ({
    page,
  }) => {
    await page.goto('/editions/');
    const hrefs = await page
      .locator('.editions-index__row')
      .evaluateAll((els) => els.map((el) => el.getAttribute('href')).filter((href): href is string => Boolean(href)));
    expect(hrefs.length).toBeGreaterThan(0);

    let totalTilesMeasured = 0;
    for (const href of hrefs) {
      await page.goto(href);
      const tileCount = await page.locator('.gallery-grid .tile').count();
      if (tileCount === 0) continue;
      totalTilesMeasured += await assertGridIsFlushMasonry(page);
    }

    // Guards against a vacuous pass: at least one édition must have had at
    // least one grid tile actually measured above.
    expect(totalTilesMeasured).toBeGreaterThan(0);
  });

  // Proves both locale route files were actually edited, not just the fr
  // one — the fr and en édition detail pages are separate source files, and
  // silent drift between them is the realistic failure mode here.
  test('the EN twin renders the identical masonry contract', async ({ page }) => {
    await page.goto('/editions/');
    const frHref = await page.locator('.editions-index__row').first().getAttribute('href');
    expect(frHref).toBeTruthy();
    const slugMatch = frHref!.match(/\/editions\/([^/]+)\/?$/);
    const slug = slugMatch?.[1];
    expect(slug).toBeTruthy();

    await page.goto(`/en/editions/${slug}/`);
    const tileCount = await page.locator('.gallery-grid .tile').count();
    test.skip(tileCount === 0, 'this édition has no secondary grid photos');

    const measured = await assertGridIsFlushMasonry(page);
    expect(measured).toBeGreaterThan(0);
  });

  // Scoping guard: proves the gallery masonry path still behaves identically
  // now that éditions share the same mechanism (the exhaustive img-vs-tile
  // flush proof for BOTH pages lives in gallery.spec.ts's PORT-05 block, not
  // duplicated here).
  test('galleries unaffected: the gallery masonry path renders identically now that éditions share it', async ({
    page,
  }) => {
    // No standalone galleries overview page — discover a real gallery
    // detail href from the homepage grid, mirroring this file's own
    // discovery pattern above.
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();
    const galleryHref = await page.locator('a.home-grid__tile').first().getAttribute('href');
    expect(galleryHref).toBeTruthy();

    await page.goto(galleryHref!);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const grid = page.locator('.gallery-grid');
    await expect(grid).toHaveClass(/gallery-grid--masonry/);

    const firstTileImg = grid.locator('.tile img').first();
    await expect(firstTileImg).toBeVisible();
    const position = await firstTileImg.evaluate((el) => getComputedStyle(el).position);
    expect(position).toBe('static');

    const ratios = await firstTileImg.evaluate((el) => {
      const img = el as HTMLImageElement;
      return {
        clientRatio: img.clientWidth / img.clientHeight,
        naturalRatio: img.naturalWidth / img.naturalHeight,
      };
    });
    expect(Math.abs(ratios.clientRatio - ratios.naturalRatio) / ratios.naturalRatio).toBeLessThan(0.01);
  });

  test('the hover/focus zoom still applies on édition grid tiles after the masonry swap', async ({ page }) => {
    await page.goto('/editions/');
    const rowHref = await page.locator('.editions-index__row').first().getAttribute('href');
    expect(rowHref).toBeTruthy();

    await page.goto(rowHref!);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const tiles = page.locator('.gallery-grid .tile');
    await expect(tiles.first()).toHaveClass(/revealed/);

    const firstTile = tiles.first();
    const firstImg = firstTile.locator('img');
    const restTransform = await firstImg.evaluate((el) => getComputedStyle(el).transform);
    expect(restTransform).toBe('none');

    await firstTile.hover();
    await pollHoverZoomScale(firstImg);

    const tileCount = await tiles.count();
    test.skip(tileCount < 2, 'this édition renders only one grid tile');

    const secondTile = tiles.nth(1);
    const secondImg = secondTile.locator('img');
    await secondTile.hover();
    await pollHoverZoomScale(secondImg);
  });
});

// quick-260803-bvu (Item 4): CONFIRMED live that navigating away from an
// édition detail page after scrolling down (ordinary visitor behavior —
// the whole point of the reveal) leaves `.detail-hero__photo` shrunk
// toward its 55%-width settled state at the exact moment the outgoing
// page's View Transition snapshot is captured, while the freshly-loaded
// incoming édition page always starts full-bleed — a large size delta
// that forced a visible morph/shake between the two shared-name hero
// photos. The fix removes the shared `hero-photo` view-transition name
// for éditions specifically, so those navigations fall back to the
// site-wide root crossfade. Mirrors gallery.spec.ts's own desktop-
// present/mobile-absent proof, inverted for éditions.
test.describe('editions hero cross-document transition scoping (Item 4, quick-260803-bvu)', () => {
  test('the édition hero photo carries no shared view-transition-name at desktop, unlike a gallery hero which still does', async ({
    page,
  }) => {
    await page.goto('/editions/');
    const rowHref = await page.locator('.editions-index__row').first().getAttribute('href');
    expect(rowHref).toBeTruthy();

    await page.goto(rowHref!);
    const editionName = await page
      .locator('.detail-hero__img')
      .evaluate((el) => getComputedStyle(el).viewTransitionName);
    expect(editionName).toBe('none');

    await page.goto('/galleries/silos/');
    const galleryName = await page
      .locator('.detail-hero__img')
      .evaluate((el) => getComputedStyle(el).viewTransitionName);
    expect(galleryName).toBe('hero-photo');
  });

  test('the édition hero photo carries no view-transition-name at mobile widths either', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/editions/');
    const rowHref = await page.locator('.editions-index__row').first().getAttribute('href');
    expect(rowHref).toBeTruthy();

    await page.goto(rowHref!);
    const editionName = await page
      .locator('.detail-hero__img')
      .evaluate((el) => getComputedStyle(el).viewTransitionName);
    expect(editionName).toBe('none');
  });
});

// quick-260803-bvu (Item 6): mirrors tests/e2e/gallery.spec.ts's own
// 'gallery detail scroll-up-to-return' describe block (~lines 572-670),
// activated here for éditions — same gesture, same engage/reset/threshold
// logic in DetailHero.astro, but the destination is the éditions overview
// (`overviewHref`) rather than the homepage carousel.
test.describe('edition detail scroll-up-to-return (Item 6, quick-260803-bvu)', () => {
  async function discoverEdition(page: import('@playwright/test').Page) {
    await page.goto('/editions/');
    const href = await page.locator('.editions-index__row').first().getAttribute('href');
    expect(href).toBeTruthy();
    return href!;
  }

  test.describe('positive path (must navigate)', () => {
    test.use({ viewport: { width: 1280, height: 900 } });

    test('fr: genuine engagement + return-to-top + sustained upward push returns to the éditions overview', async ({
      page,
    }) => {
      const href = await discoverEdition(page);
      await page.goto(href);

      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(150);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(150);

      await page.evaluate(() => window.dispatchEvent(new WheelEvent('wheel', { deltaY: -200, bubbles: true })));

      await page.waitForURL('**/editions/');
    });

    test('en: genuine engagement + return-to-top + sustained upward push returns to the éditions overview', async ({
      page,
    }) => {
      const href = await discoverEdition(page);
      const slugMatch = href.match(/\/editions\/([^/]+)\/?$/);
      const slug = slugMatch?.[1];
      expect(slug).toBeTruthy();

      await page.goto(`/en/editions/${slug}/`);

      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(150);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(150);

      await page.evaluate(() => window.dispatchEvent(new WheelEvent('wheel', { deltaY: -200, bubbles: true })));

      await page.waitForURL('**/en/editions/');
    });
  });

  // Mirrors gallery.spec.ts's own quick-260725-sj4 fresh-load synthetic-
  // event regression pattern: an accumulator armed from a fresh scrollY-0
  // load (hasEngaged still false) must never misfire on ordinary small
  // upward scroll corrections.
  test.describe('accidental-trigger regression guard (must NOT navigate)', () => {
    test.use({ viewport: { width: 1280, height: 900 } });

    test('fr: fresh load, two upward wheel ticks do NOT navigate', async ({ page }) => {
      const href = await discoverEdition(page);
      await page.goto(href);

      await page.evaluate(() => window.dispatchEvent(new WheelEvent('wheel', { deltaY: -80, bubbles: true })));
      await page.waitForTimeout(80);
      await page.evaluate(() => window.dispatchEvent(new WheelEvent('wheel', { deltaY: -80, bubbles: true })));
      await page.waitForTimeout(300);

      expect(page.url()).toBe(new URL(href, page.url()).href);
    });

    test('fr: a small down-then-up correction (below ENGAGE_DISTANCE) does NOT navigate', async ({ page }) => {
      const href = await discoverEdition(page);
      await page.goto(href);

      await page.evaluate(() => window.scrollTo(0, 60));
      await page.waitForTimeout(80);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(80);
      await page.evaluate(() => window.dispatchEvent(new WheelEvent('wheel', { deltaY: -200, bubbles: true })));
      await page.waitForTimeout(300);

      expect(page.url()).toBe(new URL(href, page.url()).href);
    });
  });
});

test.describe('editions related-gallery cross-link (EDN-08)', () => {
  test('no cross-link renders on current content (no édition has relatedGallery set yet)', async ({
    page,
  }) => {
    await page.goto('/editions/');
    const frHref = await page.locator('.editions-index__row').first().getAttribute('href');
    expect(frHref).toBeTruthy();

    const slugMatch = frHref!.match(/\/editions\/([^/]+)\/?$/);
    const slug = slugMatch?.[1];
    expect(slug).toBeTruthy();
    const enHref = `/en/editions/${slug}/`;

    await page.goto(frHref!);
    await expect(page.locator('.edition-detail__related')).toHaveCount(0);

    await page.goto(enHref);
    await expect(page.locator('.edition-detail__related')).toHaveCount(0);
  });
});

test.describe('editions lightbox', () => {
  // quick-260801-kgh: the hero is now drawn from the single `images` array
  // via pickHeroIndex (landscape-preferred, not always index 0) — mirrors
  // gallery.spec.ts's "gallery hero landscape-preference" test. The hero
  // must be located structurally (.detail-hero [data-gallery-thumb]),
  // never by an index-0 attribute selector, and the expected aria-label/
  // counter position is read from the hero's own data-index.
  test('the hero opens the lightbox at its real position (EDN-03); the first grid thumbnail opens it at its own real, differing position', async ({
    page,
  }) => {
    await page.goto('/editions/');
    const rowHref = await page.locator('.editions-index__row').first().getAttribute('href');
    expect(rowHref).toBeTruthy();

    await page.goto(rowHref!);

    const heroTrigger = page.locator('.detail-hero [data-gallery-thumb]');
    await expect(heroTrigger).toBeVisible();
    const heroIndexAttr = await heroTrigger.getAttribute('data-index');
    expect(heroIndexAttr).toBeTruthy();
    const heroIndex = Number(heroIndexAttr);
    const heroAriaLabel = await heroTrigger.getAttribute('aria-label');
    expect(heroAriaLabel?.trim().length ?? 0).toBeGreaterThan(0);
    expect(heroAriaLabel).toContain(String(heroIndex + 1));

    await heroTrigger.click();
    const dialog = page.locator('dialog[open]');
    await expect(dialog).toBeVisible();

    const counter = dialog.locator('[data-role="counter"]');
    const counterText = await counter.innerText();
    const total = counterText.split('/')[1]?.trim();
    expect(total).toBeTruthy();
    await expect(counter).toHaveText(`${heroIndex + 1} / ${total}`);

    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(heroTrigger).toBeFocused();

    const firstGridThumb = page.locator('.gallery-grid [data-gallery-thumb]').first();
    const firstGridIndex = Number(await firstGridThumb.getAttribute('data-index'));
    expect(firstGridIndex).not.toBe(heroIndex);
    await firstGridThumb.click();
    await expect(dialog).toBeVisible();
    await expect(counter).toHaveText(`${firstGridIndex + 1} / ${total}`);

    const heroImg = heroTrigger.locator('img');
    await expect(heroImg).toHaveAttribute('srcset', /\d+w/);
    const thumbImg = firstGridThumb.locator('img');
    await expect(thumbImg).toHaveAttribute('srcset', /\d+w/);
  });
});

test.describe('editions overview layout', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('hovering a row reveals its statement and activates the cursor-following preview panel with that row\'s photo', async ({
    page,
  }) => {
    for (const url of ['/editions/', '/en/editions/']) {
      await page.goto(url);

      // Playwright's virtual mouse position persists across page.goto(), so without
      // this reset the second iteration inherits the first iteration's leftover
      // secondRow.hover() position and can implicitly hover a row on the new page,
      // tripping the not.toHaveClass(/active/) assertion below.
      await page.mouse.move(0, 0);

      const preview = page.locator('.editions-preview');
      const rows = page.locator('.editions-index__row');

      const firstRow = rows.nth(0);
      const secondRow = rows.nth(1);

      await expect(preview).not.toHaveClass(/active/);

      await firstRow.hover();
      await expect(preview).toHaveClass(/active/);
      await expect(firstRow.locator('.editions-index__statement')).toBeVisible();

      const firstRowImg = await firstRow.getAttribute('data-img');
      const previewSrcAfterFirst = await preview.locator('img').getAttribute('src');
      expect(previewSrcAfterFirst).toBe(firstRowImg);

      await secondRow.hover();
      const secondRowImg = await secondRow.getAttribute('data-img');
      const previewSrcAfterSecond = await preview.locator('img').getAttribute('src');
      expect(previewSrcAfterSecond).toBe(secondRowImg);

      // Anti-truncation: proves the reveal animates to the statement's true
      // intrinsic height, not the old fixed 80px clip. Poll to accommodate
      // the 0.3s grid-template-rows reveal transition.
      await expect
        .poll(async () => (await secondRow.locator('.editions-index__statement').boundingBox())?.height ?? 0)
        .toBeGreaterThan(80);
    }
  });
});

// EDN-09: the 5 :global(html.editions-row-active .page-title-header__*)
// rules in EditionsOverviewBody.astro's <style> shipped with a partial
// :global() wrap that could never match the header's real elements — a
// regression that went unnoticed because no test read these computed
// colors. The toPass()/expect.poll() retries below exist because the
// affected properties transition over 0.35s (color/background-color) —
// reading getComputedStyle immediately after the hover/mouseleave event
// would read a mid-transition value, not the settled one.
//
// Deviation from the plan's literal "hover the first row" instruction:
// the row-hover ACCENTS cycle's first entry (index 0) sets
// --editions-row-accent-text to var(--color-on-accent), which resolves to
// the exact same value as the header's own default ink color — hovering
// row 0 therefore produces zero measurable color delta even though the
// underlying CSS fix correctly applies (confirmed live: the toPass() block
// above resolves immediately for row 0 too). Using the second row
// (ACCENTS[1], #FFFFFF text) instead guarantees a real, assertable color
// change, which is what the "differs from pre-hover" assertions exist to
// prove per the plan's own behavior spec.
test.describe('editions row-hover header color sync (EDN-09)', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('hovering a row recolors the shared header eyebrow, eyebrow dot, h1, intro, and divider to the row\'s own accent color', async ({
    page,
  }) => {
    await page.goto('/editions/');

    const eyebrow = page.locator('.page-title-header__eyebrow');
    const heading = page.locator('.page-title-header h1');
    const intro = page.locator('.page-title-header__intro');
    const divider = page.locator('.page-title-header__divider');

    const preHoverEyebrowColor = await eyebrow.evaluate((el) => getComputedStyle(el).color);
    const preHoverHeadingColor = await heading.evaluate((el) => getComputedStyle(el).color);
    const preHoverIntroColor = await intro.evaluate((el) => getComputedStyle(el).color);
    const preHoverDividerColor = await divider.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    const preHoverDotColor = await eyebrow.evaluate(
      (el) => getComputedStyle(el, '::before').backgroundColor,
    );

    const targetRow = page.locator('.editions-index__row').nth(1);
    await targetRow.hover();

    // .editions-index__row itself also has `transition: color 0.35s ease`
    // (its own hover-accent rule already worked pre-fix), so the reference
    // value must be re-read fresh on every retry too — reading it once
    // immediately after hover() risks capturing a mid-transition value,
    // which the toPass() retry below can't compensate for since it only
    // reads the *header* elements, not the row itself.
    let rowColor = '';
    await expect(async () => {
      rowColor = await targetRow.evaluate((el) => getComputedStyle(el).color);
      expect(await eyebrow.evaluate((el) => getComputedStyle(el).color)).toBe(rowColor);
      expect(await heading.evaluate((el) => getComputedStyle(el).color)).toBe(rowColor);
      expect(await intro.evaluate((el) => getComputedStyle(el).color)).toBe(rowColor);
      expect(await divider.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(rowColor);
      expect(await eyebrow.evaluate((el) => getComputedStyle(el, '::before').backgroundColor)).toBe(
        rowColor,
      );
    }).toPass();

    expect(rowColor).not.toBe(preHoverEyebrowColor);
    expect(rowColor).not.toBe(preHoverHeadingColor);
    expect(rowColor).not.toBe(preHoverIntroColor);
    expect(rowColor).not.toBe(preHoverDividerColor);
    expect(rowColor).not.toBe(preHoverDotColor);
  });

  test('moving off the row (mouseleave) restores the eyebrow to its pre-hover color', async ({
    page,
  }) => {
    await page.goto('/editions/');

    const eyebrow = page.locator('.page-title-header__eyebrow');
    const preHoverEyebrowColor = await eyebrow.evaluate((el) => getComputedStyle(el).color);

    const targetRow = page.locator('.editions-index__row').nth(1);
    await targetRow.hover();

    await expect(async () => {
      expect(await eyebrow.evaluate((el) => getComputedStyle(el).color)).not.toBe(
        preHoverEyebrowColor,
      );
    }).toPass();

    await page.mouse.move(0, 0);

    await expect(async () => {
      expect(await eyebrow.evaluate((el) => getComputedStyle(el).color)).toBe(preHoverEyebrowColor);
    }).toPass();
  });
});

test.describe('no commerce affordances (detail)', () => {
  test('shows no price, availability, or purchase affordance (EDN-06)', async ({ page }) => {
    await page.goto('/editions/');
    const rowHref = await page.locator('.editions-index__row').first().getAttribute('href');
    expect(rowHref).toBeTruthy();

    const slugMatch = rowHref!.match(/\/editions\/([^/]+)\/?$/);
    const slug = slugMatch?.[1];
    expect(slug).toBeTruthy();

    await page.goto(rowHref!);
    const frMainText = await page.locator('main').innerText();
    expect(containsForbiddenCommerceToken(frMainText)).toBe(false);

    await page.goto(`/en/editions/${slug}/`);
    const enMainText = await page.locator('main').innerText();
    expect(containsForbiddenCommerceToken(enMainText)).toBe(false);
  });
});

// quick-260724-l5i: sketch-005 Synthesis scroll-reveal hero. Desktop
// viewport is required for both assertions below — the `min-width: 768px`
// branch of DetailHero.astro's CSS is what makes the pin genuinely
// sticky (default) vs relative (reduced-motion settled end-state); the
// `max-width: 767px` mobile branch overrides position to `relative`
// regardless of motion preference, which would make the "sticky by
// default" assertion meaningless on a narrow viewport.
test.describe('editions hero reduced-motion (sketch 005)', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('prefers-reduced-motion: reduce shows the settled end-state immediately, no sticky pin, lightbox still opens', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });

    await page.goto('/editions/');
    const rowHref = await page.locator('.editions-index__row').first().getAttribute('href');
    expect(rowHref).toBeTruthy();

    await page.goto(rowHref!);

    const pin = page.locator('.detail-hero__pin');
    await expect(pin).toBeVisible();
    const pinPosition = await pin.evaluate((el) => getComputedStyle(el).position);
    expect(pinPosition).not.toBe('sticky');

    const revealTitle = page.locator('h1.detail-hero__reveal-title');
    await expect(revealTitle).toBeVisible();

    const overlayTitle = page.locator('.detail-hero__overlay-title');
    const overlayState = await overlayTitle.evaluate((el) => {
      const style = getComputedStyle(el);
      return { opacity: style.opacity, display: style.display };
    });
    expect(overlayState.display === 'none' || overlayState.opacity === '0').toBe(true);

    // Reduced motion must not break the click-to-open lightbox behavior.
    // quick-260801-kgh: the hero may be any real index now, so this asserts
    // a generic "{digits} / {digits}" counter shape rather than assuming 1/N.
    const heroTrigger = page.locator('.detail-hero [data-gallery-thumb]');
    await expect(heroTrigger).toBeVisible();
    await heroTrigger.click();
    const dialog = page.locator('dialog[open]');
    await expect(dialog).toBeVisible();
    const counter = dialog.locator('[data-role="counter"]');
    await expect(counter).toHaveText(/^\d+ \/ \d+$/);
  });

  test('without reduced motion, the desktop hero pin is sticky by default', async ({ page }) => {
    await page.goto('/editions/');
    const rowHref = await page.locator('.editions-index__row').first().getAttribute('href');
    expect(rowHref).toBeTruthy();

    await page.goto(rowHref!);

    const pin = page.locator('.detail-hero__pin');
    await expect(pin).toBeVisible();
    const pinPosition = await pin.evaluate((el) => getComputedStyle(el).position);
    expect(pinPosition).toBe('sticky');
  });
});

// quick-260724-wdr: proves the required scrollHintLabel prop was wired on
// both édition détail twins ("Faire défiler" fr / "Scroll" en), mirroring
// gallery.spec.ts's equivalent coverage.
//
// quick-260727-drq (Bug 4): restored after quick-260726-ltr's premature
// removal — direct user feedback confirmed first-time visitors landing
// from the carousel didn't realize there was more below.
test.describe('editions scroll-down hint label (quick-260724-wdr)', () => {
  test('the scroll-down hint shows the locale-aware label on both fr and en édition détail routes', async ({
    page,
  }) => {
    await page.goto('/editions/');
    const frHref = await page.locator('.editions-index__row').first().getAttribute('href');
    expect(frHref).toBeTruthy();

    const slugMatch = frHref!.match(/\/editions\/([^/]+)\/?$/);
    const slug = slugMatch?.[1];
    expect(slug).toBeTruthy();

    await page.goto(frHref!);
    const frHint = page.locator('.detail-hero__scroll-hint');
    await expect(frHint).toBeVisible();
    await expect(frHint).toContainText('Faire défiler');

    await page.goto(`/en/editions/${slug}/`);
    const enHint = page.locator('.detail-hero__scroll-hint');
    await expect(enHint).toBeVisible();
    await expect(enHint).toContainText('Scroll');
  });
});
