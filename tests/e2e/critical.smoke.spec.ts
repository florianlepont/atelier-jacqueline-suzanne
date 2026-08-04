import {expect, test} from '@playwright/test'

test.describe('critical cross-browser smoke', () => {
  test('homepage wordmark stays readable while the sharp hero is unavailable', async ({page}) => {
    await page.route(/cdn\.sanity\.io\/images\//, (route) => {
      const url = new URL(route.request().url())
      // Responsive delivery lets each engine choose 480/768/1200/1600/2000.
      // Block every sharp rendition while preserving the 24px blur
      // placeholder so this remains a genuine loading-error fallback test.
      return url.searchParams.get('w') !== '24' ? route.abort('failed') : route.continue()
    })

    await page.goto('/', {waitUntil: 'domcontentloaded'})
    await page.waitForFunction(() => {
      const placeholder = document.querySelector<HTMLImageElement>('[data-role="hero-image-placeholder"]')
      return Boolean(placeholder?.complete && placeholder.naturalWidth > 0)
    })

    const wordmark = page.locator('.home-hero__wordmark')
    await expect(wordmark).toBeVisible()
    await expect(wordmark).not.toHaveCSS('-webkit-text-fill-color', 'rgba(0, 0, 0, 0)')
    await expect(wordmark).not.toHaveCSS('color', 'rgba(0, 0, 0, 0)')
  })

  test('mobile homepage toggles modes without horizontal overflow', async ({page}) => {
    await page.goto('/')
    await page.getByRole('button', {name: /grille|grid/i}).click()
    await expect(page.locator('.home-grid')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })

  test('contact form completes a mocked submission', async ({page}) => {
    await page.route('https://api.web3forms.com/submit', (route) =>
      route.fulfill({status: 200, contentType: 'application/json', body: '{"success":true}'}),
    )
    await page.goto('/contact/')
    await page.getByLabel(/^nom$/i).fill('Jeanne Dupont')
    await page.getByLabel(/^e-mail$/i).fill('jeanne@example.com')
    await page.getByLabel(/^message$/i).fill('Bonjour')
    await page.getByRole('button', {name: /envoyer/i}).click()
    await expect(page.locator('[data-role="form-status"]')).toContainText(/merci/i)
  })

  test('native dialog opens, navigates, closes, and restores focus', async ({page}) => {
    await page.goto('/galleries/silos/')
    const trigger = page.locator('[data-gallery-thumb]').first()
    await trigger.click()
    const dialog = page.locator('dialog[open]')
    await expect(dialog).toBeVisible()
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  // Phase 20 (HOME-13, D-03): this test exists specifically because Safari/
  // WebKit does not animate a top-layer element out, so the JS-orchestrated
  // close (MobileNavPanel.astro's client script) is the only thing that
  // keeps the close path working there — and this file is the only place
  // webkit-mobile coverage happens (playwright.config.ts scopes that
  // project to **/*.smoke.spec.ts only).
  test('mobile nav opens and closes via Escape, restoring focus, on every tested engine', async ({page}) => {
    await page.goto('/')
    // Explicit even though the webkit-mobile project already uses an
    // iPhone 15 Pro viewport — keeps this test honest under the chromium
    // project too, which defaults to a desktop viewport.
    await page.setViewportSize({width: 393, height: 852})
    await page.locator('[data-role="mobile-nav-toggle"]').click()
    const dialog = page.locator('dialog#mobile-nav')
    await expect(dialog).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(page.locator('[data-role="mobile-nav-toggle"]')).toBeFocused()
  })
})
