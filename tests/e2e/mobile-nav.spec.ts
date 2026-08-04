import { test, expect, type Page } from '@playwright/test';

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

    // (20-06) 20-UAT.md Test 2 (severity: major, user's live on-phone test)
    // reversed D-04's switcher clause after this phase shipped: the switcher
    // is no longer a fourth equal-weight primary item inside
    // .mobile-nav-panel__nav -- it moves to the panel's bottom secondary
    // tier, as a direct child of the dialog, stacked directly ABOVE the
    // Instagram line (the stacked, switcher-above-Instagram order is the
    // user-confirmed shape from the mobile-nav-switcher-hierarchy debug
    // session). These structural assertions guard the exact DOM shape the
    // new `.mobile-nav-panel > .language-switcher` CSS selector depends on.
    test(`${path}: the switcher sits in the panel's bottom secondary tier, stacked above an icon-bearing Instagram line (20-06)`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 393, height: 852 });
      await page.goto(path);

      const dialog = page.locator('dialog#mobile-nav');

      await expect(dialog.locator('.mobile-nav-panel__nav .switcher-link')).toHaveCount(0);
      await expect(page.locator('dialog#mobile-nav > .language-switcher')).toHaveCount(1);

      const nextSiblingIsSecondary = await page
        .locator('dialog#mobile-nav > .language-switcher')
        .evaluate((el) => el.nextElementSibling?.classList.contains('mobile-nav-panel__secondary') ?? false);
      expect(nextSiblingIsSecondary).toBe(true);

      const secondarySvg = dialog.locator('.mobile-nav-panel__secondary svg');
      await expect(secondarySvg).toHaveCount(1);
      await expect(secondarySvg).toHaveAttribute('aria-hidden', 'true');

      await expect(dialog.locator('.mobile-nav-panel__nav > *')).toHaveCount(3);
    });

    // (20-06) Rewritten from "the primary list and switcher render at
    // Display size in ink" -- the .mobile-nav-panel__link half is unchanged
    // (still Display size/weight/family/ink); the switcher half INVERTS to
    // Label size in ink, per 20-UAT.md Test 2's reversal of D-04's switcher
    // clause. Also asserts the two stacked secondary lines carry same-size
    // (16px) icons, per the mobile-nav-instagram-icon debug session.
    test(`${path}: the primary list renders at Display size and the switcher renders at Label size in ink (20-06)`, async ({
      page,
    }) => {
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
        const switcherSvg = switcherLink ? switcherLink.querySelector('svg') : null;
        const secondarySvg = dialog.querySelector('.mobile-nav-panel__secondary svg');
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
          switcherSvgWidth: switcherSvg ? getComputedStyle(switcherSvg).width : null,
          secondarySvgWidth: secondarySvg ? getComputedStyle(secondarySvg).width : null,
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
      expect(styles.switcher!.fontSize).toBe('14px');
      expect(styles.switcher!.fontWeight).toBe('400');
      expect(styles.switcher!.fontFamily).not.toContain('Unbounded');
      expect(styles.switcher!.color).toBe('rgb(26, 26, 26)');

      expect(styles.switcherSvgWidth).toBe('16px');
      expect(styles.secondarySvgWidth).toBe('16px');
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

// Phase 20 Plan 04 (HOME-13, D-03): open/close BEHAVIOUR — appended below
// plan 20-03's structural block per this plan's own instruction. Do not
// weaken or remove any block above this point. Default target is the
// French homepage at a 393x852 viewport unless a test says otherwise.
test.describe('Phase 20 — homepage mobile nav behaviour (HOME-13, D-03)', () => {
  async function openPanel(page: Page) {
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto('/');
    await page.locator('[data-role="mobile-nav-toggle"]').click();
    await expect(page.locator('dialog#mobile-nav')).toBeVisible();
  }

  test('tapping the hamburger opens the panel', async ({ page }) => {
    await openPanel(page);

    await expect(page.locator('[data-role="mobile-nav-toggle"]')).toHaveAttribute('aria-expanded', 'true');

    const isOpen = await page
      .locator('dialog#mobile-nav')
      .evaluate((el) => (el as HTMLDialogElement).open);
    expect(isOpen).toBe(true);

    const dialog = page.locator('dialog#mobile-nav');
    const links = dialog.locator('.mobile-nav-panel__link');
    await expect(links).toHaveCount(3);
    for (let i = 0; i < 3; i++) {
      await expect(links.nth(i)).toBeVisible();
    }
    await expect(dialog.locator('.switcher-link')).toBeVisible();
    await expect(dialog.locator('.mobile-nav-panel__secondary')).toBeVisible();
  });

  test('focus is contained while the panel is open', async ({ page }) => {
    await openPanel(page);

    // This is the behaviour the native dialog-modal call already provides
    // for free (see MobileNavPanel.astro's client script) — this assertion
    // exists to catch anyone replacing it with a hand-rolled toggle.
    //
    // Verified live: Chromium's own Tab-cycling for a native modal <dialog>
    // transiently parks activeElement on <body> for exactly one step
    // between the last and first focusable descendant, before wrapping
    // back inside on the very next Tab — body has no tabindex/interactive
    // affordance of its own, so this never lets focus reach (or a visitor
    // activate) anything hidden behind the top layer; it is not the
    // hand-rolled-focus-trap leak this test exists to catch. The check
    // below tolerates that single documented resting point while still
    // failing if focus ever lands on any OTHER element outside the panel.
    const isContained = () =>
      page.evaluate(
        () => document.activeElement === document.body || document.activeElement?.closest('#mobile-nav') !== null,
      );

    expect(await isContained()).toBe(true);

    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab');
      expect(await isContained()).toBe(true);
    }
  });

  test('Escape closes the panel and restores focus', async ({ page }) => {
    await openPanel(page);

    await page.keyboard.press('Escape');

    await expect(page.locator('dialog#mobile-nav')).toBeHidden();
    await expect(page.locator('[data-role="mobile-nav-toggle"]')).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('[data-role="mobile-nav-toggle"]')).toBeFocused();
  });

  test('the in-panel close button closes the panel and restores focus', async ({ page }) => {
    await openPanel(page);

    await page.locator('[data-role="mobile-nav-close"]').click();

    await expect(page.locator('dialog#mobile-nav')).toBeHidden();
    await expect(page.locator('[data-role="mobile-nav-toggle"]')).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('[data-role="mobile-nav-toggle"]')).toBeFocused();
  });

  test('a click targeting the dialog element itself closes the panel', async ({ page }) => {
    await openPanel(page);

    // A coordinate-based backdrop click is deliberately NOT used: the panel
    // is opaque and viewport-filling, so no ::backdrop region is reachable
    // — this direct dispatch is what actually exercises the close handler's
    // event.target === panel contract.
    await page.evaluate(() => {
      const dialog = document.getElementById('mobile-nav');
      dialog?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await expect(page.locator('dialog#mobile-nav')).toBeHidden();
  });

  test('reduced motion opens and closes instantly', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto('/');

    const duration = await page
      .locator('dialog#mobile-nav')
      .evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(duration).toBe('0s');

    await page.locator('[data-role="mobile-nav-toggle"]').click();
    await expect(page.locator('dialog#mobile-nav')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('dialog#mobile-nav')).toBeHidden();
  });

  test('crossing to a desktop viewport closes an open panel', async ({ page }) => {
    await openPanel(page);

    await page.setViewportSize({ width: 1280, height: 800 });

    await expect(page.locator('dialog#mobile-nav')).toBeHidden();
    await expect(page.locator('[data-role="mobile-nav-toggle"]')).toHaveAttribute('aria-expanded', 'false');
  });

  test('the hamburger cannot open the panel at desktop widths', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    await expect(page.locator('[data-role="mobile-nav-toggle"]')).toBeHidden();
    await expect(page.locator('dialog#mobile-nav')).toBeHidden();
  });

  test('panel primary links navigate', async ({ page }) => {
    await openPanel(page);

    const editionsLink = page.locator('dialog#mobile-nav .mobile-nav-panel__link').first();
    await editionsLink.click();

    await expect(page).toHaveURL(/editions/);
  });

  test("the panel's language switcher navigates and sets the locale cookie", async ({ page, context }) => {
    await openPanel(page);

    await page.locator('dialog#mobile-nav .switcher-link').click();

    await expect(page).toHaveURL(/\/en\/$/);

    const cookies = await context.cookies();
    const localeCookie = cookies.find((cookie) => cookie.name === 'ajs_locale');
    expect(localeCookie?.value).toBe('en');
  });

  // (20-06) 20-UAT.md Test 2 (severity major): reversed the switcher out of
  // the panel's primary list into the secondary tier, stacked directly
  // above the Instagram line as two separate rows -- not sharing one row
  // (user-confirmed during the mobile-nav-switcher-hierarchy debug
  // session). This geometry assertion is what fails if the two secondary
  // lines ever end up sharing a row again.
  test("the switcher and Instagram lines are two stacked rows near the panel's bottom edge (20-06)", async ({
    page,
  }) => {
    await openPanel(page);

    const [switcherBox, secondaryBox, panelBox] = await Promise.all([
      page.locator('dialog#mobile-nav .switcher-link').boundingBox(),
      page.locator('dialog#mobile-nav .mobile-nav-panel__secondary').boundingBox(),
      page.locator('dialog#mobile-nav').boundingBox(),
    ]);

    expect(switcherBox).not.toBeNull();
    expect(secondaryBox).not.toBeNull();
    expect(panelBox).not.toBeNull();

    // Stacked, switcher above Instagram -- the 1px slack absorbs subpixel
    // layout.
    expect(switcherBox!.y + switcherBox!.height).toBeLessThanOrEqual(secondaryBox!.y + 1);

    // Both horizontally centred on the panel's own centre axis.
    const panelCenterX = panelBox!.x + panelBox!.width / 2;
    const switcherCenterX = switcherBox!.x + switcherBox!.width / 2;
    const secondaryCenterX = secondaryBox!.x + secondaryBox!.width / 2;
    expect(Math.abs(switcherCenterX - panelCenterX)).toBeLessThanOrEqual(2);
    expect(Math.abs(secondaryCenterX - panelCenterX)).toBeLessThanOrEqual(2);

    // Instagram stays the bottom-most line, 48px clear of the panel's
    // bottom edge (UI-SPEC 2xl offset).
    const bottomOffset = panelBox!.y + panelBox!.height - (secondaryBox!.y + secondaryBox!.height);
    expect(bottomOffset).toBeGreaterThanOrEqual(44);
    expect(bottomOffset).toBeLessThanOrEqual(56);

    // Tap targets survive the move -- rounded to the nearest pixel since
    // getBoundingClientRect() can report e.g. 43.999969... for a genuine
    // 44px min-height box due to sub-pixel layout rounding.
    expect(Math.round(switcherBox!.height)).toBeGreaterThanOrEqual(44);
    expect(Math.round(secondaryBox!.height)).toBeGreaterThanOrEqual(44);
  });

  test("the close button's glyph morphs", async ({ page }) => {
    await openPanel(page);

    const bars = page.locator('[data-role="mobile-nav-close"] .mobile-nav__bar');

    // Poll rather than sample once, so the 220ms transition is ridden out
    // rather than caught mid-flight.
    await expect(async () => {
      const [bar1Transform, bar2Opacity, bar3Transform] = await Promise.all([
        bars.nth(0).evaluate((el) => getComputedStyle(el).transform),
        bars.nth(1).evaluate((el) => getComputedStyle(el).opacity),
        bars.nth(2).evaluate((el) => getComputedStyle(el).transform),
      ]);
      expect(bar1Transform).not.toBe('none');
      expect(bar2Opacity).toBe('0');
      expect(bar3Transform).not.toBe('none');
    }).toPass();

    await page.locator('[data-role="mobile-nav-close"]').click();

    await expect(async () => {
      const [bar1Transform, bar3Transform] = await Promise.all([
        bars.nth(0).evaluate((el) => getComputedStyle(el).transform),
        bars.nth(2).evaluate((el) => getComputedStyle(el).transform),
      ]);
      expect(bar1Transform).toBe('none');
      expect(bar3Transform).toBe('none');
    }).toPass();
  });

  // Plan 20-05 (D-02, T-20-10): the decorative halftone corner texture --
  // must be tap-transparent, geometrically contained inside the dialog's own
  // box (the entire containment strategy, since no overflow rule is added
  // anywhere), and must never intercept a tap meant for the primary list.
  test('the halftone texture is tap-transparent and fully contained inside the panel', async ({ page }) => {
    await openPanel(page);

    const halftone = page.locator('dialog#mobile-nav .mobile-nav-panel__halftone');
    await expect(halftone).toHaveCSS('pointer-events', 'none');

    const [halftoneBox, dialogBox] = await Promise.all([
      halftone.boundingBox(),
      page.locator('dialog#mobile-nav').boundingBox(),
    ]);
    expect(halftoneBox).toBeTruthy();
    expect(dialogBox).toBeTruthy();

    // Fully inside on all four edges -- the element cannot overflow a box
    // it is inset within.
    expect(halftoneBox!.x).toBeGreaterThanOrEqual(dialogBox!.x);
    expect(halftoneBox!.y).toBeGreaterThanOrEqual(dialogBox!.y);
    expect(halftoneBox!.x + halftoneBox!.width).toBeLessThanOrEqual(dialogBox!.x + dialogBox!.width);
    expect(halftoneBox!.y + halftoneBox!.height).toBeLessThanOrEqual(dialogBox!.y + dialogBox!.height);

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);

    // A tap at the first primary link's coordinates must still activate
    // that link -- the halftone sits in the SAME top-right corner region as
    // the panel, but must never swallow taps meant for the content above it.
    const firstLink = page.locator('dialog#mobile-nav .mobile-nav-panel__link').first();
    await firstLink.click();
    await expect(page).toHaveURL(/editions/);
  });
});

// Plan 20-05 Task 3 (T-20-11): the in-test companion to the workflow's own
// base-path grep guard (.github/workflows/deploy.yml) — the panel introduces
// six new anchors (logo, Éditions, About, Contact, LanguageSwitcher,
// Instagram) that all must resolve through an already-base-aware value, never
// a hardcoded literal. A hardcoded literal would 404 on GitHub Pages while
// passing every local root-base test, which is exactly why the grep guard
// exists at deploy time too -- this test exists so the same bug class fails a
// test in future, not only a deploy. The header's own logo/nav/switcher
// anchors are the known-good baseline (covered by their own pre-existing
// specs elsewhere in this suite): the primary-list links share the EXACT
// same prop-derived href as their header counterpart, so they must match
// byte-for-byte; the panel's switcher independently computes ITS OWN
// other-locale target, so it is compared against the header's own inline
// switcher rather than the logo (comparing it against the logo's
// SAME-locale href would be a false positive on every run, since switching
// locale is the whole point of that link).
test.describe('Phase 20 — phase gate cross-checks', () => {
  for (const path of ['/', '/en/']) {
    test(`${path} at 393x852: every dialog#mobile-nav anchor matches its already-base-aware header counterpart, or is absolute`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 393, height: 852 });
      await page.goto(path);

      const header = page.locator('[data-role="site-header"]');
      const [headerLogoHref, headerSwitcherHref, headerNavLinkHrefs] = await Promise.all([
        header.locator('.logo-mark').getAttribute('href'),
        header.locator('.language-switcher .switcher-link').getAttribute('href'),
        header.locator('.site-nav > a.nav-link').evaluateAll((anchors) =>
          anchors.map((a) => a.getAttribute('href') ?? ''),
        ),
      ]);
      expect(headerLogoHref).toBeTruthy();
      expect(headerSwitcherHref).toBeTruthy();
      // Éditions, About, Contact, Instagram, in that DOM order (site-header.spec.ts's
      // own "nav structure" test already pins this order).
      expect(headerNavLinkHrefs.length).toBe(4);
      const [editionsHref, aboutHref, contactHref, instagramHref] = headerNavLinkHrefs;

      await page.locator('[data-role="mobile-nav-toggle"]').click();
      await page.locator('dialog#mobile-nav').waitFor({ state: 'visible' });
      const dialog = page.locator('dialog#mobile-nav');

      await expect(dialog.locator('.mobile-nav-panel__logo')).toHaveAttribute('href', headerLogoHref!);
      const panelLinks = dialog.locator('.mobile-nav-panel__link');
      await expect(panelLinks.nth(0)).toHaveAttribute('href', editionsHref);
      await expect(panelLinks.nth(1)).toHaveAttribute('href', aboutHref);
      await expect(panelLinks.nth(2)).toHaveAttribute('href', contactHref);
      await expect(dialog.locator('.switcher-link')).toHaveAttribute('href', headerSwitcherHref!);
      const secondaryHref = await dialog.locator('.mobile-nav-panel__secondary').getAttribute('href');
      expect(secondaryHref).toBe(instagramHref);
      expect(secondaryHref!.startsWith('https://')).toBe(true);
    });
  }

  // Ties HOME-13 and HOME-16 together in a single homepage state -- a future
  // phase regressing either would trip this one assertion.
  test('/ at 393x852: hamburger visible, --current-accent is a real hero color, mode-toggle visible', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto('/');

    await expect(page.locator('[data-role="mobile-nav-toggle"]')).toBeVisible();
    await expect(page.locator('[data-role="mode-toggle"]')).toBeVisible();

    const heroColors = await page
      .locator('ul[data-role="home-carousel-data"] li')
      .evaluateAll((lis) => lis.map((li) => (li as HTMLElement).dataset.heroColor ?? ''));
    expect(heroColors.length).toBeGreaterThan(0);

    const currentAccent = await page.evaluate(() =>
      getComputedStyle(document.querySelector('.home') as HTMLElement).getPropertyValue('--current-accent').trim(),
    );
    expect(heroColors).toContain(currentAccent);
  });
});
