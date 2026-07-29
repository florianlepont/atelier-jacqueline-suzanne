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

  // 16-03/D-11: under prefers-reduced-motion the pop-rate engine ignores the
  // pointer entirely and drifts on a slow, fixed ~4s cadence -- a deliberate
  // divergence from the freeze-to-settled-state convention used everywhere
  // else on this site. This asserts "alive, not frozen" AND "pointer
  // position genuinely ignored", using generous bounds/windows to avoid
  // flakiness (RESEARCH Validation Architecture).
  test('under reduced motion the pool drifts slowly and ignores pointer position', async ({page}) => {
    await page.emulateMedia({reducedMotion: 'reduce'})
    await page.goto('/this-page-does-not-exist/')

    const poolCount = await page.locator('.pop-photo').count()
    // Sparse/tiny Sanity dataset (fewer than 2 pool photos): the engine
    // never attaches (progressive enhancement no-op), so there is nothing
    // to cut between -- skip gracefully rather than hard-failing.
    test.skip(poolCount < 2, 'fewer than 2 pool photos -- engine has nothing to cycle')

    // A MutationObserver-based swap counter (window.__popSwapCount) gives a
    // precise transition count, rather than relying only on a before/after
    // "did the active index change" snapshot -- the counter is reset
    // between windows below so each window's count is independent.
    await page.evaluate(() => {
      ;(window as unknown as {__popSwapCount: number}).__popSwapCount = 0
      const container = document.querySelector('.not-found')
      if (!container) return
      new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          const target = mutation.target as HTMLElement
          if (
            mutation.attributeName === 'class' &&
            target.classList.contains('pop-photo') &&
            target.classList.contains('is-active')
          ) {
            ;(window as unknown as {__popSwapCount: number}).__popSwapCount += 1
          }
        }
      }).observe(container, {attributes: true, attributeFilter: ['class'], subtree: true})
    })

    // DRIFT_INTERVAL_MS is 4000ms -- wait comfortably longer than one full
    // interval and confirm at least one swap happened (alive, not frozen --
    // the key D-11 distinction from the rest of the site), but not an
    // implausibly large number (proving this is the slow drift, not the
    // fast pointer-driven rate capped by MIN_INTERVAL_MS = 150ms per the
    // D-10 override).
    await page.waitForTimeout(5000)
    const driftSwapCount = await page.evaluate(
      () => (window as unknown as {__popSwapCount: number}).__popSwapCount,
    )
    expect(driftSwapCount).toBeGreaterThanOrEqual(1)
    expect(driftSwapCount).toBeLessThanOrEqual(3)

    // Move the pointer to dead-center, reset the counter, and confirm the
    // cadence stays on the slow drift over a short window -- pointer
    // position must be genuinely ignored under reduced motion (D-11), never
    // accelerated toward the fast pointer-driven rate.
    const viewport = page.viewportSize()
    if (viewport) {
      await page.mouse.move(viewport.width / 2, viewport.height / 2)
    }
    await page.evaluate(() => {
      ;(window as unknown as {__popSwapCount: number}).__popSwapCount = 0
    })
    await page.waitForTimeout(1500)
    const pointerWindowSwapCount = await page.evaluate(
      () => (window as unknown as {__popSwapCount: number}).__popSwapCount,
    )
    // Well under one drift interval -- a pointer-accelerated engine would
    // very likely have swapped several times in 1500ms; the drift-only
    // engine should show at most a single boundary-timing swap.
    expect(pointerWindowSwapCount).toBeLessThanOrEqual(1)
  })
})
