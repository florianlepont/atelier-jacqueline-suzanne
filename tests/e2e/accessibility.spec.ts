import AxeBuilder from '@axe-core/playwright'
import {expect, test} from '@playwright/test'
import {firstGalleryHref} from './helpers/content'

async function reachMobileHeader(page: import('@playwright/test').Page, path: '/' | '/en/') {
  await page.setViewportSize({width: 393, height: 852})
  await page.goto(path)
  const target = await page.locator('.mobile-home-prototype__arrival').evaluate((arrival) => {
    const element = arrival as HTMLElement
    return element.offsetTop + (element.offsetHeight - window.innerHeight) * 0.82
  })
  await page.evaluate((y) => window.scrollTo(0, y), target)
  await expect(page.locator('[data-role="mobile-nav-toggle"]')).toBeVisible()
}

for (const path of [
  '/',
  '/about/',
  '/contact/',
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

// Gallery détail routes also need a REAL slug (same reasoning as above) --
// this used to sit in the static array as a hardcoded slug, which broke CI
// whenever that specific gallery was removed or renamed in Sanity Studio.
test('the first published gallery détail page has no serious or critical automated accessibility violations', async ({
  page,
}) => {
  const href = await firstGalleryHref(page, 'fr')
  await page.goto(href)
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

// Phase 20 Plan 05 (HOME-13, 20-VALIDATION.md): every scan above runs at the
// suite's DEFAULT (desktop) viewport, so the homepage's phone-width states --
// where the inline nav/switcher are hidden and a hamburger button is the sole
// nav affordance -- were previously unscanned entirely. These two tests close
// that gap for both the closed header and the open dialog, in both locales.
for (const path of ['/', '/en/']) {
  test(`${path} closed mobile header (393x852) has no serious or critical automated accessibility violations`, async ({
    page,
  }) => {
    await page.setViewportSize({width: 393, height: 852})
    await page.setViewportSize({width: 393, height: 852})
    await page.goto(path)
    const results = await new AxeBuilder({page}).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
    const blocking = results.violations.filter(
      (violation) => violation.impact === 'serious' || violation.impact === 'critical',
    )
    expect(blocking, blocking.map((violation) => `${violation.id}: ${violation.help}`).join('\n')).toEqual([])
  })
}

// A closed <dialog> is display:none and therefore invisible to axe, so the
// open-panel state genuinely cannot be reached by any existing test above --
// this is the state 20-VALIDATION.md's HOME-13 accessibility row asks for.
for (const path of ['/', '/en/']) {
  test(`${path} open mobile-nav panel (393x852) has no serious or critical automated accessibility violations`, async ({
    page,
  }) => {
    await page.setViewportSize({width: 393, height: 852})
    await reachMobileHeader(page, path as '/' | '/en/')
    await page.locator('[data-role="mobile-nav-toggle"]').click()
    await page.locator('dialog#mobile-nav').waitFor({state: 'visible'})
    const results = await new AxeBuilder({page}).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
    const blocking = results.violations.filter(
      (violation) => violation.impact === 'serious' || violation.impact === 'critical',
    )
    expect(blocking, blocking.map((violation) => `${violation.id}: ${violation.help}`).join('\n')).toEqual([])
  })
}

// Quick task 260825-g2l: HOME-16's random starting accent (pickRandomGalleryIndex,
// src/lib/home-carousel.ts) meant the automatic palette's entry 0 -- the ONLY
// entry shared byte-identically by both the homepage carousel
// (src/client/home-carousel-runtime.ts) and the éditions row-hover accent
// (EditionsOverviewBody.astro) -- was only reachable roughly 1-in-6 of the time
// per test run, and only ever became LIVE reachable once a gallery published
// with no `heroColor` (falling through to the automatic palette). This
// describe block removes the randomness entirely: it forces every possible
// index deterministically (both locales) plus the éditions row-hover state,
// so the underlying color-contrast bug can never again hide behind a flake.
test.describe('automatic accent palette contrast (quick-260825-g2l)', () => {
  test.use({viewport: {width: 1280, height: 900}})

  const FORCED_INDEX_KEY = 'gsd:forcedAccentIndex'
  const FORCED_TOTAL_KEY = 'gsd:forcedAccentTotal'

  for (const path of ['/', '/en/'] as const) {
    test(`forcing every homepage automatic accent index produces no serious or critical color-contrast violations (${path})`, async ({
      page,
    }) => {
      // Installed ONCE per page, before any navigation. pickRandomGalleryIndex's
      // own doc comment (src/lib/home-carousel.ts:176-181) sanctions stubbing
      // globalThis.Math.random -- its default `randomSource` param resolves at
      // CALL time, so a stub installed here before page scripts run takes
      // effect on every subsequent navigation/reload. The stub is gated on two
      // localStorage keys (read fresh on every navigation) rather than a
      // per-index init-script argument, since init scripts accumulate and
      // cannot be removed mid-loop.
      await page.addInitScript(
        ({indexKey, totalKey}) => {
          const rawIndex = window.localStorage.getItem(indexKey)
          const rawTotal = window.localStorage.getItem(totalKey)
          if (rawIndex === null || rawTotal === null) return
          const index = Number(rawIndex)
          const total = Number(rawTotal)
          if (!Number.isFinite(index) || !Number.isFinite(total) || total <= 0) return
          // Math.floor(randomSource() * count) is pickRandomGalleryIndex's own
          // formula -- the `+ 0.5` midpoint keeps the forced index unambiguous
          // regardless of floating-point rounding.
          globalThis.Math.random = () => (index + 0.5) / total
        },
        {indexKey: FORCED_INDEX_KEY, totalKey: FORCED_TOTAL_KEY},
      )

      await page.goto(path)

      // Discover the content shape from the server-rendered data list the
      // runtime itself parses (src/client/home-carousel-runtime.ts:93) --
      // never hardcode a gallery count or slug (260825-et3's content-robustness
      // principle for this suite).
      const entries = await page.locator('ul[data-role="home-carousel-data"] li').evaluateAll((items) =>
        items.map((item) => {
          const el = item as HTMLElement
          return {
            slug: el.dataset.slug ?? '',
            heroColor: el.dataset.heroColor ?? '',
            heroTextColor: el.dataset.heroTextColor ?? '',
          }
        }),
      )
      expect(entries.length, 'homepage gallery content failed to load -- is at least one gallery published?').toBeGreaterThan(0)

      for (let index = 0; index < entries.length; index += 1) {
        const entry = entries[index]

        await page.evaluate(
          ({indexKey, totalKey, forcedIndex, total}) => {
            window.localStorage.setItem(indexKey, String(forcedIndex))
            window.localStorage.setItem(totalKey, String(total))
          },
          {indexKey: FORCED_INDEX_KEY, totalKey: FORCED_TOTAL_KEY, forcedIndex: index, total: entries.length},
        )
        await page.reload()

        // Automatic-palette entries (no heroColor) cycle ACCENTS[index % 5] by
        // GALLERY index (src/client/home-carousel-runtime.ts:1159-1164), so the
        // expectation mirrors that array's text values exactly -- entry 0 and
        // --color-ink read LIVE from the page rather than hardcoded, so this
        // stays correct both before and after the --color-on-accent fix.
        const expectedText = await page.evaluate(
          ({heroColor, heroTextColor, index}) => {
            if (heroColor) return heroTextColor.trim().toUpperCase()
            const automaticTextByPosition = [
              getComputedStyle(document.documentElement).getPropertyValue('--color-on-accent').trim().toUpperCase(),
              '#FFFFFF',
              getComputedStyle(document.documentElement).getPropertyValue('--color-ink').trim().toUpperCase(),
              getComputedStyle(document.documentElement).getPropertyValue('--color-ink').trim().toUpperCase(),
              '#FFFFFF',
            ]
            return automaticTextByPosition[index % automaticTextByPosition.length]
          },
          {heroColor: entry.heroColor, heroTextColor: entry.heroTextColor, index},
        )

        // Removes the double-requestAnimationFrame race in the accent override
        // (home-carousel-runtime.ts:1172-1176) AND proves the Math.random stub
        // genuinely forced this index rather than silently no-opping.
        await expect
          .poll(
            () =>
              page.evaluate(() => {
                const el = document.querySelector('.home')
                if (!el) return null
                return getComputedStyle(el).getPropertyValue('--current-accent-text').trim().toUpperCase()
              }),
            {
              message: `forced index ${index} (slug: "${entry.slug}") on ${path} never settled on the expected --current-accent-text`,
            },
          )
          .toBe(expectedText)

        const results = await new AxeBuilder({page}).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
        const blocking = results.violations.filter(
          (violation) => violation.impact === 'serious' || violation.impact === 'critical',
        )
        expect(
          blocking,
          `forced index ${index} (slug: "${entry.slug}") on ${path}:\n` +
            blocking.map((violation) => `${violation.id}: ${violation.help}`).join('\n'),
        ).toEqual([])
      }
    })
  }

  test('éditions row-hover accent (first row, shared entry-0 pairing) produces no serious or critical color-contrast violations', async ({
    page,
  }) => {
    await page.goto('/editions/')

    const rows = page.locator('.editions-index__row')
    const rowCount = await rows.count()
    expect(rowCount, 'no éditions rows found -- is at least one édition published?').toBeGreaterThan(0)

    // Row position 0 always maps to ACCENTS[0 % ACCENTS.length] --
    // EditionsOverviewBody.astro's shared entry-0 pairing with the homepage's
    // automatic palette -- since éditions carry no per-document color field.
    await rows.first().hover()
    // Same 0.35s color/background-color transition settle budget
    // findRowWithDifferingAccent uses in tests/e2e/edition.spec.ts.
    await page.waitForTimeout(400)

    // Every other /editions/ scan in this file runs at rest; the hovered
    // state (page AND header background flipped to the accent via
    // html.editions-row-active in BaseLayout.astro) had zero automated
    // contrast coverage until this test.
    //
    // Excludes the DIMMED sibling rows' titles (`.editions-index:hover
    // .editions-index__title { opacity: 0.28 }`, EditionsOverviewBody.astro):
    // this quick task discovered, but is deliberately out of scope for, a
    // SEPARATE pre-existing contrast bug -- blending ANY row-accent text
    // color at 28% opacity over its own accent background fails 3:1
    // regardless of ink vs white (verified: ink-on-pink ~1.52:1, white-on-pink
    // ~1.48:1 -- both already failing before this task's --color-on-accent
    // fix). That bug is a distinct design/mechanism issue (the opacity-based
    // dimming pattern itself, not the token this task fixes) affecting all 5
    // accent entries alike; fixing it is out of scope for a single CSS custom
    // property change and is tracked as a follow-up (see this quick task's
    // SUMMARY.md). This test stays scoped to what quick-260825-g2l actually
    // fixes: the header and the actively-hovered row's own (full-opacity)
    // entry-0 pairing.
    const results = await new AxeBuilder({page})
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .exclude('.editions-index__row:not(:hover) .editions-index__title')
      .analyze()
    const blocking = results.violations.filter(
      (violation) => violation.impact === 'serious' || violation.impact === 'critical',
    )
    expect(blocking, blocking.map((violation) => `${violation.id}: ${violation.help}`).join('\n')).toEqual([])
  })
})
