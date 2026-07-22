import {expect, test} from '@playwright/test'

test.describe('targeted visual regression', () => {
  test('shared site header', async ({page}) => {
    await page.goto('/about/')
    await expect(page.locator('.site-header')).toHaveScreenshot('shared-site-header.png')
  })

  test('contact form controls and spacing', async ({page}) => {
    await page.goto('/contact/')
    await expect(page.locator('#contact-form')).toHaveScreenshot('contact-form.png')
  })
})
