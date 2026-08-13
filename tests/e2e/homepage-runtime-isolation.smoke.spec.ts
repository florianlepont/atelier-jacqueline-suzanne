import { expect, test } from '@playwright/test';

for (const path of ['/', '/en/'] as const) {
  test(`${path} swaps its sole responsive runtime on WebKit mobile`, async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto(path);

    await expect.poll(() => page.locator('[data-runtime-active]').count()).toBe(1);
    await expect(page.locator('[data-runtime-active="mobile"]')).toHaveCount(1);
    await expect(page.locator('[data-runtime-active="desktop"]')).toHaveCount(0);
    await expect(page.locator('[data-role="scroll-deck"]')).toHaveCount(0);

    await page.setViewportSize({ width: 1024, height: 768 });
    await expect.poll(() => page.locator('[data-runtime-active]').count()).toBe(1);
    await expect(page.locator('[data-runtime-active="desktop"]')).toHaveCount(1);
    await expect(page.locator('[data-runtime-active="mobile"]')).toHaveCount(0);
  });
}
