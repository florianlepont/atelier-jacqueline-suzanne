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

// Phase 20 Plan 03 (HOME-13, D-01/D-02/D-04): the homepage's own positive
// mobile-nav structural contract, appended below the nets above per this
// plan's own instruction — do not weaken or remove any block above this
// point. Markup only: open/close behaviour lands in plan 20-04.
const INSTAGRAM_URL = 'https://www.instagram.com/ajs_romanelepont/';

test.describe('Phase 20 — homepage mobile nav structure (HOME-13, D-01/D-02/D-04)', () => {
  for (const path of ['/', '/en/']) {
    const isEn = path === '/en/';
    const openMenuLabel = isEn ? 'Open menu' : 'Ouvrir le menu';

    test(`${path}: the header swaps its inline nav for a hamburger`, async ({ page }) => {
      await page.setViewportSize({ width: 393, height: 852 });
      await page.goto(path);

      const header = page.locator('[data-role="site-header"]');
      await expect(header).toHaveAttribute('data-mobile-nav', 'true');

      const toggle = page.locator('[data-role="mobile-nav-toggle"]');
      await expect(toggle).toHaveCount(1);
      await expect(toggle).toBeVisible();
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await expect(toggle).toHaveAttribute('aria-controls', 'mobile-nav');
      await expect(toggle).toHaveAttribute('aria-label', openMenuLabel);

      const box = await toggle.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);

      await expect(header.locator('.site-nav')).toBeHidden();
      await expect(header.locator('> .language-switcher')).toBeHidden();
    });

    test(`${path}: the closed panel exists once, outside the header`, async ({ page }) => {
      await page.setViewportSize({ width: 393, height: 852 });
      await page.goto(path);

      const dialog = page.locator('dialog#mobile-nav');
      await expect(dialog).toHaveCount(1);
      await expect(dialog).toBeHidden();

      // Structural invariant that keeps i18n.spec.ts,
      // homepage-carousel-core.spec.ts and site-header.spec.ts's
      // header-scoped counts intact: the panel is a SIBLING of <header>,
      // never a descendant.
      const isOutsideHeader = await dialog.evaluate(
        (el) => el.closest('[data-role="site-header"]') === null,
      );
      expect(isOutsideHeader).toBe(true);
    });

    test(`${path}: the panel holds the D-04 two-tier contents`, async ({ page }) => {
      await page.setViewportSize({ width: 393, height: 852 });
      await page.goto(path);

      // The closed dialog is display:none — assert counts/attributes here,
      // not visibility.
      const dialog = page.locator('dialog#mobile-nav');
      const links = dialog.locator('.mobile-nav-panel__link');
      await expect(links).toHaveCount(3);

      const hrefs = await links.evaluateAll((els) => els.map((el) => el.getAttribute('href')));
      expect(hrefs[0]).toContain('editions');
      expect(hrefs[1]).toContain('about');
      expect(hrefs[2]).toContain('contact');

      await expect(dialog.locator('.switcher-link')).toHaveCount(1);

      const secondary = dialog.locator('.mobile-nav-panel__secondary');
      await expect(secondary).toHaveCount(1);
      await expect(secondary).toHaveAttribute('href', INSTAGRAM_URL);
      await expect(secondary).toHaveAttribute('target', '_blank');
      const rel = await secondary.getAttribute('rel');
      expect(rel).toContain('noopener');
      expect(rel).toContain('noreferrer');

      await expect(dialog.locator('[data-role="mobile-nav-close"]')).toHaveCount(1);
    });

    test(`${path}: the panel introduces no selector collisions`, async ({ page }) => {
      await page.setViewportSize({ width: 393, height: 852 });
      await page.goto(path);

      // Protects site-header.spec.ts's cross-page structural-identity test,
      // which counts `.site-nav > a.nav-link` and expects exactly 4.
      await expect(page.locator('dialog#mobile-nav a.nav-link')).toHaveCount(0);
      // Protects i18n.spec.ts, which clicks through page.locator('header')
      // and would trip Playwright strict mode on a second match.
      await expect(page.locator('dialog#mobile-nav header')).toHaveCount(0);
      // Protects the header-scoped switcher/Éditions-link counts asserted by
      // homepage-carousel-core.spec.ts and site-header.spec.ts.
      await expect(page.locator('[data-role="site-header"] .language-switcher .switcher-link')).toHaveCount(1);
      await expect(page.locator('[data-role="site-header"] a[href*="editions"]')).toHaveCount(1);
    });

    test(`${path}: the primary list and switcher render at Display size in ink`, async ({ page }) => {
      await page.setViewportSize({ width: 393, height: 852 });
      await page.goto(path);

      // The dialog is closed (display:none); force a read of the resolved
      // styles by temporarily flipping display, then restore — no residual
      // inline style is left behind.
      const styles = await page.evaluate(() => {
        const dialog = document.getElementById('mobile-nav') as HTMLDialogElement;
        const previousDisplay = dialog.style.display;
        dialog.style.display = 'flex';

        const link = dialog.querySelector('.mobile-nav-panel__link');
        const switcherLink = dialog.querySelector('.switcher-link');
        const linkStyle = link ? getComputedStyle(link) : null;
        const switcherStyle = switcherLink ? getComputedStyle(switcherLink) : null;

        const result = {
          link: linkStyle
            ? {
                fontSize: linkStyle.fontSize,
                fontWeight: linkStyle.fontWeight,
                fontFamily: linkStyle.fontFamily,
                color: linkStyle.color,
              }
            : null,
          switcher: switcherStyle
            ? {
                fontSize: switcherStyle.fontSize,
                fontWeight: switcherStyle.fontWeight,
                fontFamily: switcherStyle.fontFamily,
                color: switcherStyle.color,
              }
            : null,
        };

        dialog.style.display = previousDisplay;
        return result;
      });

      expect(styles.link).not.toBeNull();
      expect(styles.link!.fontSize).toBe('32px');
      expect(styles.link!.fontWeight).toBe('600');
      expect(styles.link!.fontFamily).toContain('Unbounded');
      expect(styles.link!.color).toBe('rgb(26, 26, 26)');

      expect(styles.switcher).not.toBeNull();
      expect(styles.switcher!.fontSize).toBe('32px');
      expect(styles.switcher!.fontWeight).toBe('600');
      expect(styles.switcher!.fontFamily).toContain('Unbounded');
      expect(styles.switcher!.color).toBe('rgb(26, 26, 26)');
    });

    test(`${path}: the secondary line renders at Label size`, async ({ page }) => {
      await page.setViewportSize({ width: 393, height: 852 });
      await page.goto(path);

      const styles = await page.evaluate(() => {
        const dialog = document.getElementById('mobile-nav') as HTMLDialogElement;
        const previousDisplay = dialog.style.display;
        dialog.style.display = 'flex';

        const secondary = dialog.querySelector('.mobile-nav-panel__secondary');
        const secondaryStyle = secondary ? getComputedStyle(secondary) : null;
        const result = secondaryStyle
          ? {
              fontSize: secondaryStyle.fontSize,
              fontWeight: secondaryStyle.fontWeight,
              marginBottom: secondaryStyle.marginBottom,
            }
          : null;

        dialog.style.display = previousDisplay;
        return result;
      });

      expect(styles).not.toBeNull();
      expect(styles!.fontSize).toBe('14px');
      expect(styles!.fontWeight).toBe('400');
      expect(styles!.marginBottom).toBe('48px');
    });

    test(`${path}: the mode-toggle still ships on mobile`, async ({ page }) => {
      // Removing the carousel/grid mode-toggle is Phase 21's scope, not this
      // phase's — a regression here would be silent scope creep.
      await page.setViewportSize({ width: 393, height: 852 });
      await page.goto(path);

      const modeToggle = page.locator('[data-role="mode-toggle"]');
      await expect(modeToggle).toHaveCount(1);
      await expect(modeToggle).toBeVisible();
    });

    test(`${path}: no horizontal overflow with the hamburger present`, async ({ page }) => {
      for (const width of [393, 320]) {
        await page.setViewportSize({ width, height: 852 });
        await page.goto(path);

        const overflow = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }));
        expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);

        const headerHeight = await page.locator('[data-role="site-header"]').evaluate((el) => el.getBoundingClientRect().height);
        expect(headerHeight).toBeLessThanOrEqual(80);
      }
    });
  }

  test('desktop (1280x800) on /: the mobile-nav affordance is inert, the inline nav is intact', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    await expect(page.locator('[data-role="mobile-nav-toggle"]')).toBeHidden();
    await expect(page.locator('dialog#mobile-nav')).toBeHidden();

    const navLinks = page.locator('[data-role="site-header"] .site-nav > a.nav-link');
    await expect(navLinks).toHaveCount(4);
    for (let i = 0; i < 4; i++) {
      await expect(navLinks.nth(i)).toBeVisible();
    }
  });
});
