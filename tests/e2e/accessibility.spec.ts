import AxeBuilder from '@axe-core/playwright'
import {expect, test} from '@playwright/test'

for (const path of [
  '/',
  '/about/',
  '/contact/',
  '/galleries/silos/',
  '/mentions-legales/',
  '/editions/',
  '/confidentialite/',
  '/en/',
  '/en/about/',
]) {
  test(`${path} has no serious or critical automated accessibility violations`, async ({page}) => {
    await page.goto(path)
    const results = await new AxeBuilder({page}).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
    const blocking = results.violations.filter(
      (violation) => violation.impact === 'serious' || violation.impact === 'critical',
    )
    expect(blocking, blocking.map((violation) => `${violation.id}: ${violation.help}`).join('\n')).toEqual([])
  })
}

// Détail routes need a REAL slug, so they cannot be a static array entry.
// Discover it dynamically from the overview's first `.editions-index__row` href, mirroring
// tests/e2e/edition.spec.ts -- never hardcode a slug, never use the main nav.
test('the first published édition détail page has no serious or critical automated accessibility violations', async ({
  page,
}) => {
  await page.goto('/editions/')
  const href = await page.locator('.editions-index__row').first().getAttribute('href')
  expect(href).toBeTruthy()

  await page.goto(href!)
  const results = await new AxeBuilder({page}).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  const blocking = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  )
  expect(blocking, blocking.map((violation) => `${violation.id}: ${violation.help}`).join('\n')).toEqual([])
})

// 16-02/RESEARCH.md Pitfall 4: the redesigned 404 page (full-bleed photo
// pool, radial scrim, centered content) introduced real new accessibility
// surface (decorative background images, scrim contrast) with zero
// automated a11y coverage until now. There is no literal `/404/` route --
// `not-found.spec.ts` reaches it the same way, via a genuinely nonexistent
// path -- so this can't be a plain entry in the static path array above.
test('the 404 page has no serious or critical automated accessibility violations', async ({page}) => {
  await page.goto('/this-page-does-not-exist/')
  const results = await new AxeBuilder({page}).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  const blocking = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  )
  expect(blocking, blocking.map((violation) => `${violation.id}: ${violation.help}`).join('\n')).toEqual([])
})
