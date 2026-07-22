import { test, expect } from '@playwright/test';

// Phase 12 Plan 01: the Éditions overview route trees do not exist yet
// (getEditions/getEdition + editions/index.astro + en/editions/index.astro
// are built in Tasks 2-3 of this plan) — this file is RED until then. Do not
// hardcode a slug and do not use the main nav (nav wiring is Phase 13).

// <!-- planner-discipline-allow: prix price acheter buy panier cart stock disponib availab épuisé -->
const FORBIDDEN_COMMERCE_TOKENS =
  /(€|\$|prix|price|acheter|\bbuy\b|panier|cart|stock|disponib|availab|sold out|épuisé)/i;

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
    expect(frMainText).not.toMatch(FORBIDDEN_COMMERCE_TOKENS);

    await page.goto('/en/editions/');
    const enMainText = await page.locator('main').innerText();
    expect(enMainText).not.toMatch(FORBIDDEN_COMMERCE_TOKENS);
  });
});
