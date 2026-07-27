import { test, expect, devices } from '@playwright/test';

test.describe('Instagram nav link (HOME-04)', () => {
  test('exactly one Instagram link exists in the header with correct href/target/rel', async ({ page }) => {
    await page.goto('/');

    const header = page.locator('header');
    const instagramLink = header.locator('a[href="https://www.instagram.com/ajs_romanelepont/"]');
    await expect(instagramLink).toHaveCount(1);
    await expect(instagramLink).toHaveAttribute('target', '_blank');
    const rel = await instagramLink.getAttribute('rel');
    expect(rel).toContain('noopener');
    expect(rel).toContain('noreferrer');
  });

  test('the link renders an inline svg icon (not visible text) with an accessible name of Instagram', async ({ page }) => {
    await page.goto('/');

    const link = page.locator('header a[href="https://www.instagram.com/ajs_romanelepont/"]');
    await expect(link.locator('svg')).toHaveCount(1);
    // Accessible name check via ARIA role query, scoped to the header — proves
    // the header's link has a discoverable name of "Instagram" without
    // relying on visible text (the pre-existing footer link also matches
    // this href, so this must be scoped, not page-wide).
    const header = page.locator('header');
    await expect(header.getByRole('link', { name: 'Instagram', exact: false })).toHaveCount(1);
  });

  test('DOM order: the Instagram link comes after the Contact link inside .site-nav', async ({ page }) => {
    await page.goto('/');

    const navLinks = page.locator('.site-nav > a');
    const hrefs = await navLinks.evaluateAll((els) => els.map((el) => el.getAttribute('href')));
    const contactIndex = hrefs.findIndex((href) => href?.includes('contact'));
    const instagramIndex = hrefs.findIndex((href) => href === 'https://www.instagram.com/ajs_romanelepont/');
    expect(contactIndex).toBeGreaterThanOrEqual(0);
    expect(instagramIndex).toBeGreaterThan(contactIndex);
  });

  test('at a 393px mobile viewport the Instagram link is visible with no horizontal page overflow', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 800 });
    await page.goto('/');

    // Scoped to .site-nav — the pre-existing footer Instagram link also
    // matches this href but is not the subject of this mobile-fit assertion.
    const instagramLink = page.locator('.site-nav a[href="https://www.instagram.com/ajs_romanelepont/"]');
    await expect(instagramLink).toBeVisible();

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth);
  });

  test('the sr-only new-tab hint is locale-conditional (FR vs EN)', async ({ page }) => {
    // textContent (not innerText) preserves the exact leading-space string —
    // rendered innerText collapses/trims whitespace, which would falsely
    // strip the leading space this string is defined with.
    await page.goto('/en/');
    const enHint = await page
      .locator('.site-nav a[href="https://www.instagram.com/ajs_romanelepont/"] .sr-only')
      .evaluate((el) => el.textContent);
    expect(enHint).toBe(' (opens in new tab)');

    await page.goto('/');
    const frHint = await page
      .locator('.site-nav a[href="https://www.instagram.com/ajs_romanelepont/"] .sr-only')
      .evaluate((el) => el.textContent);
    expect(frHint).toBe(' (nouvelle fenêtre)');
  });
});

test.describe('homepage semantic heading (quick-260720-nm3)', () => {
  test('the homepage exposes exactly one accessible level-1 heading containing "Atelier"', async ({ page }) => {
    await page.goto('/');

    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toHaveCount(1);
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(/Atelier/i);
  });
});

test.describe('footer visibility by display mode (quick-260726-obg)', () => {
  test('FR: the footer is hidden in carousel mode and reappears in grid mode', async ({ page }) => {
    await page.goto('/');

    const footer = page.locator('footer');
    await expect(footer).toBeHidden();

    await page.getByRole('button', { name: 'Grille' }).click();
    await expect(footer).toBeVisible();
  });

  test('EN: the footer is hidden in carousel mode and reappears in grid mode', async ({ page }) => {
    await page.goto('/en/');

    const footer = page.locator('footer');
    await expect(footer).toBeHidden();

    await page.getByRole('button', { name: 'Grid' }).click();
    await expect(footer).toBeVisible();
  });
});
