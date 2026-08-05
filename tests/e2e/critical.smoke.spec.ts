import {expect, test} from '@playwright/test'

test.describe('critical cross-browser smoke', () => {
  test('homepage wordmark stays readable while the sharp hero is unavailable', async ({page}) => {
    // Explicit even though webkit-mobile already defaults to an iPhone
    // viewport — keeps this test honest under the chromium project too,
    // which defaults to a desktop viewport where the deck (below) doesn't
    // render at all (Phase 21/HOME-14).
    await page.setViewportSize({width: 393, height: 852})
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

    // Phase 21 (HOME-14/HOME-15): this project runs at an iPhone-width
    // viewport, where `.home-hero` (and its wordmark) is now retired
    // entirely in favor of the phone-width scroll deck's own zoom-wordmark
    // — same underlying cutout mechanism (wordmarkPhotoFilter,
    // .home.has-wordmark-photo gate), same first gallery's photo, so this
    // is the faithful phone-width equivalent of the original assertion.
    const wordmark = page.locator('[data-role="zoom-wordmark"]')
    await expect(wordmark).toBeVisible()
    await expect(wordmark).not.toHaveCSS('-webkit-text-fill-color', 'rgba(0, 0, 0, 0)')
    await expect(wordmark).not.toHaveCSS('color', 'rgba(0, 0, 0, 0)')
  })

  // Phase 21 (HOME-14): the carousel/grid mode-toggle this test used to
  // click is retired entirely below 767px — this project's iPhone-width
  // viewport now renders the scroll deck instead, so this smoke test
  // (webkit-mobile's only real-Safari-engine coverage) is updated to prove
  // the NEW phone-width layout instead of deleting the check outright.
  // homepage-scroll-deck.spec.ts covers the equivalent guard for chromium.
  test('mobile homepage (scroll deck) renders without horizontal overflow', async ({page}) => {
    // Explicit even though webkit-mobile already defaults to an iPhone
    // viewport — keeps this test honest under the chromium project too,
    // which defaults to a desktop viewport where the deck doesn't render.
    await page.setViewportSize({width: 393, height: 852})
    await page.goto('/')
    await expect(page.locator('[data-role="scroll-deck"]')).toBeVisible()
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
    // Explicit even though the webkit-mobile project already uses an
    // iPhone 15 Pro viewport — keeps this test honest under the chromium
    // project too, which defaults to a desktop viewport.
    await page.setViewportSize({width: 393, height: 852})
    // Phase 21 (D-12/D-15): forces reduced motion so the header/toggle is
    // deterministically interactive at scroll position 0 once the
    // full-screen wordmark zoom lands — D-12 hides the header while the
    // zoom is scrubbing, D-15 makes reduced-motion visitors skip the scroll
    // driver entirely. The motion-on path is covered by the new
    // homepage-scroll-deck spec instead.
    await page.emulateMedia({reducedMotion: 'reduce'})
    await page.goto('/')
    await page.locator('[data-role="mobile-nav-toggle"]').click()
    const dialog = page.locator('dialog#mobile-nav')
    await expect(dialog).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(page.locator('[data-role="mobile-nav-toggle"]')).toBeFocused()
  })
})
