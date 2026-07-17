import { test, expect } from '@playwright/test';

// Phase 10 Plan 01, Task 1 (HOME-10/D-01/D-03) — Wave 0 RED contract for the
// shared <SiteHeader> component on non-homepage pages (About/Contact). This
// mirrors tests/e2e/homepage.spec.ts's "Instagram nav link (HOME-04)" describe
// block, but scoped to [data-role="site-header"]/.site-nav and driven against
// /about/, /en/about/, /contact/, /en/contact/ instead of the homepage.
//
// The homepage itself is NOT wired to <SiteHeader> until Plan 02 — no
// assertions here touch '/' or '/en/', and no cross-page-identity assertion
// is added yet (that lands in Plan 02, once the homepage also renders
// .nav-link). These assertions are expected to FAIL against the current
// (un-refactored) BaseLayout, which has no Instagram link in its header and
// no data-role="site-header" attribute — do not weaken them to pass early.

const INSTAGRAM_HREF = 'https://www.instagram.com/ajs_romanelepont/';

test.describe('Shared SiteHeader — Instagram nav link on non-homepage pages (HOME-10, D-01, D-03)', () => {
  for (const path of ['/about/', '/en/about/', '/contact/', '/en/contact/']) {
    test(`${path}: exactly one Instagram link in the header with correct href/target/rel`, async ({ page }) => {
      await page.goto(path);

      const header = page.locator('[data-role="site-header"]');
      const instagramLink = header.locator(`a[href="${INSTAGRAM_HREF}"]`);
      await expect(instagramLink).toHaveCount(1);
      await expect(instagramLink).toHaveAttribute('target', '_blank');
      const rel = await instagramLink.getAttribute('rel');
      expect(rel).toContain('noopener');
      expect(rel).toContain('noreferrer');
    });
  }

  test('the header Instagram link exposes an accessible name containing "Instagram" and renders an inline svg', async ({ page }) => {
    await page.goto('/about/');

    const header = page.locator('[data-role="site-header"]');
    const link = header.locator(`a[href="${INSTAGRAM_HREF}"]`);
    await expect(link.locator('svg')).toHaveCount(1);
    // Accessible-name check via ARIA role query, scoped to the header — the
    // in-content About page also links @ajs_romanelepont from `main`, so
    // this must stay header-scoped to unambiguously target the nav link.
    await expect(header.getByRole('link', { name: 'Instagram', exact: false })).toHaveCount(1);
  });
});

test.describe('Shared SiteHeader — mobile fit at 393px (HOME-10, Pitfall 1)', () => {
  for (const path of ['/about/', '/contact/', '/galleries/silos/']) {
    test(`${path}: no horizontal page overflow at a 393px viewport`, async ({ page }) => {
      await page.setViewportSize({ width: 393, height: 800 });
      await page.goto(path);

      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth);
    });
  }
});

test.describe('Shared SiteHeader — mode-toggle scoping (HOME-10, D-04)', () => {
  test('the mode-toggle does not render on /about/ or /contact/', async ({ page }) => {
    for (const path of ['/about/', '/contact/']) {
      await page.goto(path);
      await expect(page.locator('[data-role="mode-toggle"]')).toHaveCount(0);
    }
  });
});

test.describe('Shared SiteHeader — nav structure (HOME-10, D-01)', () => {
  test('/about/: .site-nav exposes About, Contact, and Instagram links in that DOM order', async ({ page }) => {
    await page.goto('/about/');

    const navLinks = page.locator('.site-nav > a.nav-link');
    await expect(navLinks).toHaveCount(3);

    const hrefs = await navLinks.evaluateAll((els) => els.map((el) => el.getAttribute('href')));
    const aboutIndex = hrefs.findIndex((href) => href?.includes('about'));
    const contactIndex = hrefs.findIndex((href) => href?.includes('contact'));
    const instagramIndex = hrefs.findIndex((href) => href === INSTAGRAM_HREF);

    expect(aboutIndex).toBeGreaterThanOrEqual(0);
    expect(contactIndex).toBeGreaterThan(aboutIndex);
    expect(instagramIndex).toBeGreaterThan(contactIndex);
  });
});

// Phase 10 Plan 02 (HOME-10, success criterion #1/#2) — the gap RESEARCH.md
// flags as untested by any existing e2e assertion: proving the homepage's
// header is the SAME rendered component as About's, not a second,
// independently-styled implementation that merely happens to look similar.
// Expected RED until Plan 02's Task 2 rewires HomeCarousel.astro onto
// <SiteHeader> — the homepage still renders its own .home-nav today, so
// `.site-nav > a.nav-link` resolves to zero elements on '/'.
test.describe('Shared SiteHeader — cross-page structural identity (HOME-10, D-01, D-05)', () => {
  test('/ and /about/ render the same .site-nav .nav-link count and order (About, Contact, Instagram)', async ({ page }) => {
    await page.goto('/');
    const homeNavLinks = page.locator('.site-nav > a.nav-link');
    await expect(homeNavLinks).toHaveCount(3);
    const homeHrefs = await homeNavLinks.evaluateAll((els) => els.map((el) => el.getAttribute('href')));

    await page.goto('/about/');
    const aboutNavLinks = page.locator('.site-nav > a.nav-link');
    await expect(aboutNavLinks).toHaveCount(3);
    const aboutHrefs = await aboutNavLinks.evaluateAll((els) => els.map((el) => el.getAttribute('href')));

    // Same count, same order, same hrefs — proves one shared component, not
    // two divergent implementations that happen to agree by coincidence.
    expect(homeHrefs).toEqual(aboutHrefs);
    expect(homeHrefs[0]).toContain('about');
    expect(homeHrefs[1]).toContain('contact');
    expect(homeHrefs[2]).toBe(INSTAGRAM_HREF);
  });
});
