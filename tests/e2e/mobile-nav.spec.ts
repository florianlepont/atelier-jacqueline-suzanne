import { expect, test, type Page } from '@playwright/test';

const PHONE = { width: 393, height: 852 };

async function reachInteractiveHeader(page: Page, path: '/' | '/en/', reducedMotion = false) {
  await page.setViewportSize(PHONE);
  if (reducedMotion) await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(path);

  if (!reducedMotion) {
    const target = await page.locator('.mobile-home-prototype__arrival').evaluate((arrival) => {
      const element = arrival as HTMLElement;
      return element.offsetTop + (element.offsetHeight - window.innerHeight) * 0.82;
    });
    await page.evaluate((y) => window.scrollTo(0, y), target);
  }

  await expect(page.locator('[data-role="mobile-nav-toggle"]')).toBeVisible();
}

async function openPanel(page: Page, path: '/' | '/en/' = '/') {
  await reachInteractiveHeader(page, path);
  await page.locator('[data-role="mobile-nav-toggle"]').click();
  await expect(page.locator('dialog#mobile-nav')).toBeVisible();
}

test.describe('homepage mobile navigation', () => {
  for (const path of ['/', '/en/'] as const) {
    test(`${path} reaches the real post-arrival hamburger state`, async ({ page }) => {
      await reachInteractiveHeader(page, path);
      const header = page.locator('[data-role="site-header"]');
      await expect(header).toHaveAttribute('data-mobile-nav', 'true');
      await expect(header.locator('.site-nav')).toBeHidden();
      await expect(page.locator('[data-role="mobile-nav-toggle"]')).toHaveAttribute('aria-expanded', 'false');
    });

    test(`${path} opens a native dialog with its localized links`, async ({ page }) => {
      await openPanel(page, path);
      const dialog = page.locator('dialog#mobile-nav');
      await expect(dialog).toHaveAttribute('open', '');
      await expect(dialog.locator('.mobile-nav-panel__link')).toHaveCount(4);
      await expect(dialog.locator('.switcher-link')).toBeVisible();
      await expect(dialog.locator('.mobile-nav-panel__secondary')).toBeVisible();
    });
  }

  test('Escape closes the dialog and restores hamburger focus', async ({ page }) => {
    await openPanel(page);
    await page.keyboard.press('Escape');
    await expect(page.locator('dialog#mobile-nav')).toBeHidden();
    await expect(page.locator('[data-role="mobile-nav-toggle"]')).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('[data-role="mobile-nav-toggle"]')).toBeFocused();
  });

  test('the close button and a panel link both work', async ({ page }) => {
    await openPanel(page);
    await page.locator('[data-role="mobile-nav-close"]').click();
    await expect(page.locator('dialog#mobile-nav')).toBeHidden();

    await openPanel(page);
    await page.locator('dialog#mobile-nav .mobile-nav-panel__link').nth(1).click();
    await expect(page).toHaveURL(/editions/);
  });

  test('the open dialog does not create horizontal overflow', async ({ page }) => {
    await openPanel(page);
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
  });

  test('reduced-motion visitors can still open and close the panel at the static arrival', async ({ page }) => {
    await reachInteractiveHeader(page, '/', true);
    await page.locator('[data-role="mobile-nav-toggle"]').click();
    await expect(page.locator('dialog#mobile-nav')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('dialog#mobile-nav')).toBeHidden();
  });
});
