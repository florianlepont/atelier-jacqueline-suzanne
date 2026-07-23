import { test, expect } from '@playwright/test';

// Phase 12 Plan 01: the Éditions overview route trees do not exist yet
// (getEditions/getEdition + editions/index.astro + en/editions/index.astro
// are built in Tasks 2-3 of this plan) — this file is RED until then. Do not
// hardcode a slug and do not use the main nav (nav wiring is Phase 13).
//
// Phase 12 Plan 02 (this extension): the per-édition détail routes
// (`/editions/{slug}/`, `/en/editions/{slug}/`) do not exist yet either —
// the `editions detail`, `editions lightbox`, and
// `no commerce affordances (detail)` blocks below are RED until Task 2
// builds src/pages/editions/[slug].astro + the en/ twin. Discover the détail
// URL dynamically from the overview's first `.editions-list__row` href —
// never hardcode a slug, never use the main nav (nav wiring is Phase 13).

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
  test('lists each published édition as a linked row with title, lead photo, and full statement (fr)', async ({
    page,
  }) => {
    await page.goto('/editions/');

    const row = page.locator('.editions-list__row').first();
    await expect(row).toBeVisible();
    await expect(row.locator('img').first()).toBeVisible();

    const title = row.locator('.editions-list__title');
    const titleText = (await title.innerText()).trim();
    expect(titleText.length).toBeGreaterThan(0);

    const statement = row.locator('.editions-list__statement');
    const frStatementText = (await statement.innerText()).trim();
    expect(frStatementText.length).toBeGreaterThan(0);

    let href = await row.getAttribute('href');
    if (href === null) {
      href = await row.locator('xpath=ancestor::a[1]').getAttribute('href');
    }
    expect(href).toMatch(/\/editions\/[^/]+\/?$/);
  });

  test('renders the English overview at /en/editions/ with a differing, untruncated statement', async ({
    page,
  }) => {
    await page.goto('/editions/');
    const frStatement = (
      await page.locator('.editions-list__row').first().locator('.editions-list__statement').innerText()
    ).trim();

    await page.goto('/en/editions/');

    const row = page.locator('.editions-list__row').first();
    await expect(row).toBeVisible();

    const statement = row.locator('.editions-list__statement');
    const enStatementText = (await statement.innerText()).trim();
    expect(enStatementText.length).toBeGreaterThan(0);
    expect(enStatementText).not.toBe(frStatement);

    let href = await row.getAttribute('href');
    if (href === null) {
      href = await row.locator('xpath=ancestor::a[1]').getAttribute('href');
    }
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

// Phase 12 Plan 02: détail routes. Discover the détail URL dynamically from
// the overview's first `.editions-list__row` href (never hardcode a slug,
// never use the main nav — nav wiring is Phase 13).

test.describe('editions detail', () => {
  test('shows a bilingual statement, a format-details line, and a back-link to the overview', async ({
    page,
  }) => {
    await page.goto('/editions/');
    const frHref = await page.locator('.editions-list__row').first().getAttribute('href');
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
    expect(frFormatText).toMatch(/Tirage/);
    expect(frFormatText).toMatch(/cm|in/);

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
    expect(enFormatText).toMatch(/Print run/);
    expect(enFormatText).toMatch(/cm|in/);

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
    const rowHref = await page.locator('.editions-list__row').first().getAttribute('href');
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

    const firstGridThumb = page.locator('.edition-detail__thumb-button').first();
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

  test('non-reversed and reversed rows share one grid row (photo/text top-aligned)', async ({
    page,
  }) => {
    for (const url of ['/editions/', '/en/editions/']) {
      await page.goto(url);

      const rows = page.locator('.editions-list__row');
      const rowCount = await rows.count();
      expect(rowCount).toBeGreaterThanOrEqual(2);

      const reversedRow = rows.nth(1);
      await expect(reversedRow).toHaveClass(/editions-list__row--reverse/);

      for (const index of [0, 1]) {
        const row = rows.nth(index);
        const photoBox = await row.locator('.editions-list__photo').boundingBox();
        const textBox = await row.locator('.editions-list__text').boundingBox();

        expect(photoBox).not.toBeNull();
        expect(textBox).not.toBeNull();
        expect(Math.abs(photoBox!.y - textBox!.y)).toBeLessThan(4);
      }
    }
  });
});

test.describe('no commerce affordances (detail)', () => {
  test('shows no price, availability, or purchase affordance (EDN-06)', async ({ page }) => {
    await page.goto('/editions/');
    const rowHref = await page.locator('.editions-list__row').first().getAttribute('href');
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
