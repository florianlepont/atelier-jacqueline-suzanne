import { test, expect } from '@playwright/test';

// These routes are live: `/editions/`, `/en/editions/` render the
// sketch-approved asymmetric "Poster Grid" (grouped-by-3 hero+small tiles,
// side alternating by group index); `/editions/{slug}/`,
// `/en/editions/{slug}/` render the per-édition détail page. Discover the
// détail URL dynamically from the overview's first `.tile` href — never
// hardcode a slug, never use the main nav (nav wiring is Phase 13).

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
  test('lists each published édition as a linked tile with title, lead photo, and full statement (fr)', async ({
    page,
  }) => {
    await page.goto('/editions/');

    const tile = page.locator('.tile').first();
    await expect(tile).toBeVisible();
    await expect(tile.locator('img').first()).toBeVisible();

    const title = tile.locator('.tile__title');
    const titleText = (await title.innerText()).trim();
    expect(titleText.length).toBeGreaterThan(0);

    const statement = tile.locator('.tile__statement');
    const frStatementText = (await statement.innerText()).trim();
    expect(frStatementText.length).toBeGreaterThan(0);

    const href = await tile.getAttribute('href');
    expect(href).toMatch(/\/editions\/[^/]+\/?$/);
  });

  test('renders the English overview at /en/editions/ with a differing, untruncated statement', async ({
    page,
  }) => {
    await page.goto('/editions/');
    const frStatement = (
      await page.locator('.tile').first().locator('.tile__statement').innerText()
    ).trim();

    await page.goto('/en/editions/');

    const tile = page.locator('.tile').first();
    await expect(tile).toBeVisible();

    const statement = tile.locator('.tile__statement');
    const enStatementText = (await statement.innerText()).trim();
    expect(enStatementText.length).toBeGreaterThan(0);
    expect(enStatementText).not.toBe(frStatement);

    const href = await tile.getAttribute('href');
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
// first `.tile` href (never hardcode a slug, never use the main nav — nav
// wiring is Phase 13).

test.describe('editions detail', () => {
  test('shows a bilingual statement, a format-details line, and a back-link to the overview', async ({
    page,
  }) => {
    await page.goto('/editions/');
    const frHref = await page.locator('.tile').first().getAttribute('href');
    expect(frHref).toBeTruthy();

    const slugMatch = frHref!.match(/\/editions\/([^/]+)\/?$/);
    const slug = slugMatch?.[1];
    expect(slug).toBeTruthy();
    const enHref = `/en/editions/${slug}/`;

    await page.goto(frHref!);
    const frStatement = (await page.locator('.edition-detail__statement').innerText()).trim();
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
    const enStatement = (await page.locator('.edition-detail__statement').innerText()).trim();
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
});

test.describe('editions lightbox', () => {
  test('the hero opens the lightbox at 1/N; the first grid thumbnail opens it at 2/N (combined leadPhoto+images array, EDN-03)', async ({
    page,
  }) => {
    await page.goto('/editions/');
    const rowHref = await page.locator('.tile').first().getAttribute('href');
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

  test('hero tile is larger than and left of its sibling small tile', async ({ page }) => {
    for (const url of ['/editions/', '/en/editions/']) {
      await page.goto(url);

      // Today's real content is exactly 2 published éditions → one trailing
      // group of size 2, side=left (group index 0).
      const group = page.locator('.editions-grid__group').first();
      await expect(group).toHaveAttribute('data-size', '2');
      await expect(group).toHaveAttribute('data-side', 'left');

      const hero = group.locator('.tile--hero');
      const small = group.locator('.tile--small').first();

      const heroBox = await hero.boundingBox();
      const smallBox = await small.boundingBox();

      expect(heroBox).not.toBeNull();
      expect(smallBox).not.toBeNull();

      // Hero spans 7 of 12 columns vs the small's 5 → wider.
      expect(heroBox!.width).toBeGreaterThan(smallBox!.width);
      // Hero spans 2 grid rows vs the small's 1 → taller.
      expect(heroBox!.height).toBeGreaterThan(smallBox!.height);
      // side=left → hero sits to the left of the small tile.
      expect(heroBox!.x).toBeLessThan(smallBox!.x);
      // Both top-aligned to the group's first row.
      expect(Math.abs(heroBox!.y - smallBox!.y)).toBeLessThan(4);
    }
  });
});

test.describe('no commerce affordances (detail)', () => {
  test('shows no price, availability, or purchase affordance (EDN-06)', async ({ page }) => {
    await page.goto('/editions/');
    const rowHref = await page.locator('.tile').first().getAttribute('href');
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
