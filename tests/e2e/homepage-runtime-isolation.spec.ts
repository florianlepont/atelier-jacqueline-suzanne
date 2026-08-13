import { expect, test, type Page } from '@playwright/test';

const PHONE = { width: 393, height: 852 };
const DESKTOP = { width: 1280, height: 800 };

async function expectOnlyRuntime(page: Page, runtime: 'mobile' | 'desktop') {
  await expect.poll(() => page.locator('[data-runtime-active]').count()).toBe(1);
  await expect(page.locator(`[data-runtime-active="${runtime}"]`)).toHaveCount(1);
  await expect(page.locator(`[data-runtime-active="${runtime === 'mobile' ? 'desktop' : 'mobile'}"]`)).toHaveCount(0);
}

for (const path of ['/', '/en/'] as const) {
  test(`${path} mounts exactly the controller belonging to the visible breakpoint`, async ({ page }) => {
    await page.setViewportSize(PHONE);
    await page.goto(path);

    await expectOnlyRuntime(page, 'mobile');
    await expect(page.locator('.mobile-home-prototype')).toBeVisible();
    await expect(page.locator('[data-role="scroll-deck"]')).toHaveCount(0);
    await expect(page.locator('[data-role="mobile-nav-toggle"]')).toBeVisible();

    await page.setViewportSize(DESKTOP);
    await expectOnlyRuntime(page, 'desktop');
    await expect(page.locator('[data-role="home-carousel"]')).toBeVisible();
    await expect(page.locator('.mobile-home-prototype')).toBeHidden();
  });
}

test('breakpoint churn cleans the previous owner before remounting', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto('/');
  await expectOnlyRuntime(page, 'desktop');

  const index = page.locator('[data-role="index-label"]');
  const total = Number((await index.innerText()).split('/')[1]?.trim());
  expect(total).toBeGreaterThan(1);

  await page.setViewportSize(PHONE);
  await expectOnlyRuntime(page, 'mobile');
  const hiddenIndex = await index.innerText();
  await page.keyboard.press('ArrowRight');
  await expect(index).toHaveText(hiddenIndex);

  await page.setViewportSize(DESKTOP);
  await expectOnlyRuntime(page, 'desktop');
  const before = Number((await index.innerText()).split('/')[0]?.trim());
  await page.keyboard.press('ArrowRight');
  const expected = before === total ? 1 : before + 1;
  await expect(index).toHaveText(`${String(expected).padStart(2, '0')} / ${String(total).padStart(2, '0')}`);

  await page.setViewportSize(PHONE);
  await expectOnlyRuntime(page, 'mobile');
  await page.setViewportSize(DESKTOP);
  await expectOnlyRuntime(page, 'desktop');
});

test('reduced motion and desktop keyboard navigation remain functional', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize(PHONE);
  await page.goto('/');
  await expectOnlyRuntime(page, 'mobile');
  await expect(page.locator('[data-role="prototype-arrival-intro"]')).toHaveCSS('opacity', '1');

  await page.setViewportSize(DESKTOP);
  await expectOnlyRuntime(page, 'desktop');
  const before = await page.locator('[data-role="index-label"]').innerText();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-role="index-label"]')).not.toHaveText(before);
});
