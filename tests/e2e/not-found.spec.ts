import {expect, test} from '@playwright/test'

test.describe('not-found delivery', () => {
  test('an unknown URL serves the bilingual noindex 404 page', async ({page}) => {
    const response = await page.goto('/this-page-does-not-exist/')
    expect(response?.status()).toBe(404)
    await expect(page.getByRole('heading', {name: 'Page introuvable'})).toBeVisible()
    await expect(page.getByRole('heading', {name: 'Page not found'})).toBeVisible()
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow')
    await expect(page.getByRole('link', {name: /retourner/i})).toHaveAttribute('href', '/')
    await expect(page.getByRole('link', {name: /return home/i})).toHaveAttribute('href', '/en/')
  })
})
