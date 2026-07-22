import AxeBuilder from '@axe-core/playwright'
import {expect, test} from '@playwright/test'

for (const path of ['/', '/about/', '/contact/', '/galleries/silos/', '/mentions-legales/']) {
  test(`${path} has no serious or critical automated accessibility violations`, async ({page}) => {
    await page.goto(path)
    const results = await new AxeBuilder({page}).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
    const blocking = results.violations.filter(
      (violation) => violation.impact === 'serious' || violation.impact === 'critical',
    )
    expect(blocking, blocking.map((violation) => `${violation.id}: ${violation.help}`).join('\n')).toEqual([])
  })
}
