import {expect, test} from '@playwright/test'

// 16-02: assertions realigned to the redesigned full-bleed, editorial 404
// (16-CONTEXT.md D-01..D-12) -- the old two-heading-per-language markup is
// gone, replaced by a "404" marker + a single bilingual phrase heading, but
// the structural constraints this test guards (HTTP 404, noindex, both
// locales' home links present and base-aware) are unchanged (Pitfall 4/5).
test.describe('not-found delivery', () => {
  test('an unknown URL serves the bilingual noindex 404 page', async ({page}) => {
    const response = await page.goto('/this-page-does-not-exist/')
    expect(response?.status()).toBe(404)
    await expect(page.getByText('404', {exact: true})).toBeVisible()
    await expect(page.getByText('Page introuvable')).toBeVisible()
    await expect(page.getByText('Not found')).toBeVisible()
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow')
    await expect(page.getByRole('link', {name: /retourner/i})).toHaveAttribute('href', '/')
    await expect(page.getByRole('link', {name: /return home/i})).toHaveAttribute('href', '/en/')
  })
})
