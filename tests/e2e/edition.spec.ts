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
  test('shows a bilingual statement, a format-details line, and a back-link to the overview', async ({
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

    const frFormat = page.locator('.edition-detail__format');
    await expect(frFormat).toBeVisible();
    const frFormatText = await frFormat.innerText();
    expect(frFormatText).toMatch(/\d/);
    // Case-insensitive: .edition-detail__format now renders
    // text-transform: uppercase, and Playwright's innerText() reflects the
    // rendered (CSS-transformed) text, not the underlying DOM string case.
    expect(frFormatText).toMatch(/Tirage/i);
    expect(frFormatText).toMatch(/cm|in/i);

    const frBackLink = page.locator('.edition-detail__back-link');
    await expect(frBackLink).toBeVisible();
    await expect(frBackLink).toHaveAttribute('href', /\/editions\/$/);

    await page.goto(enHref);
    const enStatement = (await page.locator('.detail-hero__statement').innerText()).trim();
    expect(enStatement.length).toBeGreaterThan(0);
    expect(enStatement).not.toBe(frStatement);

    const enFormat = page.locator('.edition-detail__format');
    await expect(enFormat).toBeVisible();
    const enFormatText = await enFormat.innerText();
    expect(enFormatText).toMatch(/\d/);
    expect(enFormatText).toMatch(/Print run/i);
    expect(enFormatText).toMatch(/cm|in/i);

    const enBackLink = page.locator('.edition-detail__back-link');
    await expect(enBackLink).toBeVisible();
    await expect(enBackLink).toHaveAttribute('href', /\/en\/editions\/$/);
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
  test('the hero opens the lightbox at 1/N; the first grid thumbnail opens it at 2/N (combined leadPhoto+images array, EDN-03)', async ({
    page,
  }) => {
    await page.goto('/editions/');
    const rowHref = await page.locator('.editions-index__row').first().getAttribute('href');
    expect(rowHref).toBeTruthy();

    await page.goto(rowHref!);

    const heroTrigger = page.locator('[data-gallery-thumb][data-index="0"]');
    await expect(heroTrigger).toBeVisible();

    await heroTrigger.click();
    const dialog = page.locator('dialog[open]');
    await expect(dialog).toBeVisible();

    const counter = dialog.locator('[data-role="counter"]');
    const counterText = await counter.innerText();
    const match = counterText.match(/^1 \/ (\d+)$/);
    expect(match).not.toBeNull();
    const total = match![1];

    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(heroTrigger).toBeFocused();

    const firstGridThumb = page.locator('.gallery-grid [data-gallery-thumb]').first();
    await expect(firstGridThumb).toHaveAttribute('data-index', '1');
    await firstGridThumb.click();
    await expect(dialog).toBeVisible();
    await expect(counter).toHaveText(`2 / ${total}`);

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
    const heroTrigger = page.locator('[data-gallery-thumb][data-index="0"]');
    await expect(heroTrigger).toBeVisible();
    await heroTrigger.click();
    const dialog = page.locator('dialog[open]');
    await expect(dialog).toBeVisible();
    const counter = dialog.locator('[data-role="counter"]');
    await expect(counter).toHaveText(/^1 \/ \d+$/);
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
