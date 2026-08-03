import { test, expect } from '@playwright/test';

// Phase 20 (HOME-13) regression net — written and proven green BEFORE
// SiteHeader.astro gains its opt-in mobile-nav mode, per the v1.5
// retrospective's regression-net-first pattern and 20-CONTEXT.md's
// shared-component regression history (SiteHeader.astro has broken
// unrelated pages twice before: Phase 16's site-wide overflow-x revert,
// Phase 19's :global() scope-hash bug). Plans 20-03 and 20-04 append the
// positive homepage mobile-nav behaviour describe blocks below these net
// blocks — do not weaken or remove the blocks below when that happens.

// Pages that keep SiteHeader's inline nav (four .nav-link items + inline
// LanguageSwitcher) at EVERY viewport, phone included — every non-homepage
// SiteHeader consumer, both locales where routes exist.
const INLINE_NAV_PATHS = [
  '/about/',
  '/en/about/',
  '/contact/',
  '/en/contact/',
  '/galleries/silos/',
  '/editions/',
];

// The current <script> element count served on /about/ and /contact/ — a
// client-bundle-leakage tripwire. If this number rises, a script was added
// to a page that does not render the mobile nav (the mobile nav's own
// open/close listener is the first client <script> SiteHeader.astro's
// subtree would ever carry, and Astro hoists component scripts per page).
const EXPECTED_SCRIPT_COUNT = 4;

test.describe('Phase 20 net — pages without the mobile nav are untouched (HOME-13, D-01)', () => {
  const viewports = [
    { width: 393, height: 852, label: 'phone' },
    { width: 1280, height: 800, label: 'desktop' },
  ];

  for (const viewport of viewports) {
    for (const path of INLINE_NAV_PATHS) {
      test(`${path} at ${viewport.label} (${viewport.width}px): no mobile-nav markup, inline nav intact`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(path);

        const header = page.locator('[data-role="site-header"]');
        await expect(header).not.toHaveAttribute('data-mobile-nav', /.*/);
        await expect(page.locator('dialog#mobile-nav')).toHaveCount(0);
        await expect(page.locator('[data-role="mobile-nav-toggle"]')).toHaveCount(0);

        const navLinks = header.locator('.site-nav > a.nav-link');
        await expect(navLinks).toHaveCount(4);
        for (let i = 0; i < 4; i++) {
          await expect(navLinks.nth(i)).toBeVisible();
        }

        const switcherLink = header.locator('.language-switcher .switcher-link');
        await expect(switcherLink).toHaveCount(1);
        await expect(switcherLink).toBeVisible();

        const overflow = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
        }));
        expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth);
      });
    }
  }
});

test.describe('Phase 20 net — the first published édition detail page is untouched', () => {
  test('the first édition detail page: no mobile-nav markup, inline nav intact at phone width', async ({ page }) => {
    await page.goto('/editions/');
    const href = await page.locator('.editions-index__row').first().getAttribute('href');
    expect(href).toBeTruthy();

    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto(href!);

    const header = page.locator('[data-role="site-header"]');
    await expect(header).not.toHaveAttribute('data-mobile-nav', /.*/);
    await expect(page.locator('dialog#mobile-nav')).toHaveCount(0);
    await expect(page.locator('[data-role="mobile-nav-toggle"]')).toHaveCount(0);

    const navLinks = header.locator('.site-nav > a.nav-link');
    await expect(navLinks).toHaveCount(4);
    for (let i = 0; i < 4; i++) {
      await expect(navLinks.nth(i)).toBeVisible();
    }

    const switcherLink = header.locator('.language-switcher .switcher-link');
    await expect(switcherLink).toHaveCount(1);
    await expect(switcherLink).toBeVisible();

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth);
  });
});

test.describe('Phase 20 net — the homepage desktop header is unchanged (ROADMAP SC #4)', () => {
  for (const path of ['/', '/en/']) {
    test(`${path} at 1280x800: four visible inline nav links, one visible switcher, no mobile-nav affordance`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(path);

      const header = page.locator('[data-role="site-header"]');
      const navLinks = header.locator('.site-nav > a.nav-link');
      await expect(navLinks).toHaveCount(4);
      for (let i = 0; i < 4; i++) {
        await expect(navLinks.nth(i)).toBeVisible();
      }

      const switcherLink = header.locator('.language-switcher .switcher-link');
      await expect(switcherLink).toHaveCount(1);
      await expect(switcherLink).toBeVisible();

      // toBeHidden() (not toHaveCount(0)) deliberately: it is satisfied both
      // when an element is absent (the tree today) and when it exists but is
      // not rendered (the tree after plan 20-03 adds these elements gated to
      // phone widths) — which is exactly what makes this block a net that
      // holds across the change instead of a snapshot of one moment.
      await expect(page.locator('dialog#mobile-nav')).toBeHidden();
      await expect(page.locator('[data-role="mobile-nav-toggle"]')).toBeHidden();

      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth);
    });
  }
});

test.describe('Phase 20 net — no client bundle leaks onto pages without the mobile nav', () => {
  for (const path of ['/about/', '/contact/']) {
    test(`${path}: <script> element count stays at the pre-mobile-nav baseline (${EXPECTED_SCRIPT_COUNT})`, async ({
      page,
    }) => {
      await page.goto(path);
      const html = await page.content();
      // This exists because the mobile nav's open/close listener is the
      // first client <script> SiteHeader.astro's subtree would ever carry,
      // and Astro hoists component scripts per page — if this count rises,
      // the script must be relocated into a component/island that only the
      // homepage renders.
      const scriptCount = (html.match(/<script/g) ?? []).length;
      expect(scriptCount).toBe(EXPECTED_SCRIPT_COUNT);
    });
  }
});
