import { expect, test } from '@playwright/test';

for (const path of ['/', '/en/']) {
  test(`${path} has no overflow and exposes the hamburger at narrow phone widths`, async ({ page }) => {
    for (const width of [393, 320]) {
      await page.setViewportSize({ width, height: 852 });
      await page.goto(path);

      const target = await page.locator('.mobile-home-prototype__arrival').evaluate((arrival) => {
        const element = arrival as HTMLElement;
        return element.offsetTop + (element.offsetHeight - window.innerHeight) * 0.82;
      });
      await page.evaluate((y) => window.scrollTo(0, y), target);
      await expect(page.locator('[data-role="mobile-nav-toggle"]')).toBeVisible();
      await expect(page.locator('[data-role="site-header"] .site-nav')).toBeHidden();

      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
    }
  });
}
