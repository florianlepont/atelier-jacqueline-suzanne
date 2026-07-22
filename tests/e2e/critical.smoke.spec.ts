import {expect, test} from '@playwright/test'

test.describe('critical cross-browser smoke', () => {
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
})
