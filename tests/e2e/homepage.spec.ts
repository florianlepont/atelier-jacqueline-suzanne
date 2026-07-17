import { test, expect, devices } from '@playwright/test';

// RED (Wave 0): the real homepage (hero carousel + grid toggle) does not exist
// yet — the current "/" is still Phase 1's bare placeholder homepage. These
// assertions target the contracts locked in 04.1-CONTEXT.md (D-08 carousel +
// grid toggle, D-09 auto-advance/pause, D-12 only-migrated-galleries) and
// 04.1-UI-SPEC.md, built in Plan 04.1-04. They are expected to FAIL until then
// — do not stub or weaken them to make them pass early.

test.describe('homepage carousel', () => {
  test('carousel root renders and shows the first migrated gallery', async ({ page }) => {
    await page.goto('/');

    const carousel = page.locator('[data-role="home-carousel"]');
    await expect(carousel).toBeVisible();
    await expect(carousel.locator('[data-role="gallery-title"]')).toHaveText(/.+/);
    await expect(carousel.locator('[data-role="hero-image"]')).toHaveAttribute('src', /cdn\.sanity\.io/);
  });
});

test.describe('only galleries with photos appear (D-12)', () => {
  test('every rendered gallery tile has a real image and a destination', async ({ page }) => {
    await page.goto('/');

    // The carousel shows one slide's title at a time by design, so "all
    // migrated galleries are reachable" is checked in grid mode, where every
    // gallery renders as its own visible tile simultaneously.
    await page.getByRole('button', { name: 'Grille' }).click();
    const tiles = page.locator('a.home-grid__tile');
    expect(await tiles.count()).toBeGreaterThan(0);
    for (const tile of await tiles.all()) {
      await expect(tile).toHaveAttribute('href', /\/galleries\/[^/]+\/?$/);
      // HOME-09 added a blurred placeholder <img> sibling beneath the sharp
      // tile image (both share the `img` tag) — scope to the sharp layer,
      // which is the one that must carry the real gallery photo.
      await expect(tile.locator('.home-grid__tile-img--sharp')).toHaveAttribute('src', /cdn\.sanity\.io/);
      await expect(tile.locator('.home-grid__tile-title')).toHaveText(/.+/);
    }
  });
});

test.describe('carousel/grid display mode toggle (D-08)', () => {
  test('toggling to grid reveals a 2-column grid of gallery tiles; toggling back returns the hero carousel', async ({
    page,
  }) => {
    await page.goto('/');

    const carousel = page.locator('[data-role="home-carousel"]');
    await expect(carousel).toBeVisible();

    await page.getByRole('button', { name: 'Grille' }).click();

    await expect(carousel).toBeHidden();
    // Scope to the grid container: the (now-hidden) carousel hero heading
    // also matches these gallery-name patterns, and an unscoped getByText
    // would resolve to whichever DOM node comes first regardless of
    // visibility, not necessarily the visible grid tile.
    const grid = page.locator('[data-role="home-grid"]');
    await expect(grid.getByText(/silos/i).first()).toBeVisible();
    await expect(grid.getByText(/brume/i).first()).toBeVisible();

    await page.getByRole('button', { name: 'Carrousel' }).click();
    await expect(carousel).toBeVisible();
  });
});

test.describe('auto-advance + pause (D-09)', () => {
  test('carousel index advances every 6000ms and pauses on hover, using a mocked clock', async ({ page }) => {
    await page.clock.install();
    await page.goto('/');

    const carousel = page.locator('[data-role="home-carousel"]');
    const indexLabel = carousel.getByText(/^\d{2} \/ \d{2}$/);
    await expect(indexLabel).toBeVisible();

    const initialLabel = await indexLabel.innerText();
    await page.clock.fastForward(6000);
    await expect(indexLabel).not.toHaveText(initialLabel);

    // Pause on hover/focus: capture the label right after the auto-advance,
    // hover the carousel root, advance the mocked clock again, and confirm
    // the label did NOT change while hovered.
    const labelAfterFirstAdvance = await indexLabel.innerText();
    await carousel.hover();
    await page.clock.fastForward(6000);
    await expect(indexLabel).toHaveText(labelAfterFirstAdvance);
  });
});

test.describe('i18n non-regression guard', () => {
  test('homepage header still exposes the FR|EN switcher and differs between locales', async ({ page }) => {
    await page.goto('/');

    const header = page.locator('[data-role="site-header"]');
    await expect(header).toBeVisible();
    await expect(header).toContainText('FR | EN');
    const frHeaderText = await header.innerText();

    await page.goto('/en/');
    const enHeaderText = await page.locator('[data-role="site-header"]').innerText();

    expect(enHeaderText).not.toBe(frHeaderText);
  });
});

// D-02 (Phase 6): the toggle's accessible name is now state-dependent on a
// SINGLE button (not two independently, statically-named buttons as locked
// by Phase 04.3's D-07). This intentionally supersedes 04.3's two-button
// model — do NOT "restore" a two-button count assertion here; a future
// reviewer should treat `data-role="mode-toggle"` count === 1 as the
// contract, not a regression.
test.describe('single unified mode toggle (HOME-01, D-01/D-02)', () => {
  test('exactly one toggle button exists and its accessible name flips with display mode', async ({ page }) => {
    await page.goto('/');

    const toggle = page.locator('[data-role="mode-toggle"]');
    await expect(toggle).toHaveCount(1);
    await expect(page.locator('.home-toggle__btn')).toHaveCount(0);

    await expect(toggle).toHaveAttribute('aria-label', 'Grille');

    await toggle.click();
    await expect(page.locator('[data-role="home-carousel"]')).toBeHidden();
    await expect(page.locator('[data-role="home-grid"]')).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-label', 'Carrousel');

    await toggle.click();
    await expect(page.locator('[data-role="home-carousel"]')).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-label', 'Grille');
  });
});

test.describe('grid hero-as-first-tile (HOME-02, D-04/D-06)', () => {
  test('the old intro band is gone; the grid hero is a non-link first tile', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();

    await expect(page.locator('.home-grid__intro')).toHaveCount(0);

    const firstTile = page.locator('.home-grid__tiles > :first-child');
    await expect(firstTile).toHaveClass(/home-grid__tile--hero/);
    await expect(firstTile).toContainText(/Atelier/);
    const tagName = await firstTile.evaluate((el) => el.tagName);
    expect(tagName).toBe('DIV');
    await expect(firstTile).not.toHaveAttribute('href', /.*/);
  });
});

test.describe('collection statements on the homepage', () => {
  test('carousel uses the current collection statement instead of the generic byline', async ({page}) => {
    await page.goto('/');

    const statement = page.locator('[data-role="gallery-statement"]');
    await expect(statement).toBeVisible();
    await expect(statement).not.toHaveText('Un projet de Romane Lepont');
  });

  test('grid tile reveals its collection statement on hover', async ({page}) => {
    await page.goto('/');
    await page.getByRole('button', {name: 'Grille'}).click();

    const tile = page.locator('a.home-grid__tile').first();
    const description = tile.locator('.home-grid__tile-description');
    await expect(description).toHaveText(/.+/);
    await tile.hover();
    await expect(description).toHaveCSS('opacity', '1');
  });

  test('carousel keeps its navigation fixed and clamps long collection statements', async ({ page }) => {
    await page.setViewportSize({ width: 2048, height: 1152 });
    await page.goto('/');

    const carousel = page.locator('[data-role="home-carousel"]');
    await carousel.hover();

    const progress = carousel.locator('[data-role="progress"]');
    const dashes = progress.locator('[data-action="go-to"]');
    const progressPositions: number[] = [];

    for (let index = 0; index < await dashes.count(); index += 1) {
      await dashes.nth(index).click();
      const box = await progress.boundingBox();
      expect(box).not.toBeNull();
      progressPositions.push(box!.y);
    }

    expect(Math.max(...progressPositions) - Math.min(...progressPositions)).toBeLessThanOrEqual(1);

    const layout = await carousel.evaluate((element) => {
      const caption = element.querySelector<HTMLElement>('.home-hero__caption')!;
      const indexLabel = element.querySelector<HTMLElement>('[data-role="index-label"]')!;
      const title = element.querySelector<HTMLElement>('[data-role="gallery-title"]')!;
      const statement = element.querySelector<HTMLElement>('[data-role="gallery-statement"]')!;
      const accent = element.querySelector<HTMLElement>('[data-role="accent-panel"]')!;
      const captionRect = caption.getBoundingClientRect();
      const indexRect = indexLabel.getBoundingClientRect();
      const titleRect = title.getBoundingClientRect();
      const statementRect = statement.getBoundingClientRect();
      const accentRect = accent.getBoundingClientRect();

      return {
        captionRight: captionRect.right,
        captionWidth: captionRect.width,
        indexTitleGap: titleRect.top - indexRect.bottom,
        titleFontSize: parseFloat(getComputedStyle(title).fontSize),
        accentLeft: accentRect.left,
        statementRight: statementRect.right,
        statementWidth: statementRect.width,
        statementHeight: statementRect.height,
        statementLineHeight: parseFloat(getComputedStyle(statement).lineHeight),
        statementOverflow: getComputedStyle(statement).overflow,
      };
    });

    expect(layout.captionRight).toBeLessThanOrEqual(layout.accentLeft);
    expect(layout.captionWidth).toBeLessThanOrEqual(721);
    expect(layout.indexTitleGap).toBeGreaterThanOrEqual(11);
    expect(layout.titleFontSize).toBe(18);
    expect(layout.accentLeft - layout.captionRight).toBeGreaterThanOrEqual(63);
    expect(layout.statementWidth).toBeLessThanOrEqual(441);
    expect(layout.accentLeft - layout.statementRight).toBeGreaterThanOrEqual(300);
    expect(layout.statementHeight).toBeLessThanOrEqual(layout.statementLineHeight * 3 + 1);
    expect(layout.statementOverflow).toBe('hidden');
  });
});

test.describe('carousel wordmark cutout (HOME-03, D-08)', () => {
  test('the wordmark uses background-clip:text with a photo background-image', async ({ page }) => {
    await page.goto('/');

    const wordmark = page.locator('.home-hero__wordmark');
    const { clip, bg } = await wordmark.evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        clip: style.webkitBackgroundClip || style.backgroundClip,
        bg: style.backgroundImage,
      };
    });

    expect(clip).toContain('text');
    expect(bg).toContain('url(');
    // Whether the photo is actually legible through the letters is confirmed
    // live in the phase's checkpoint task per D-08 — computed style alone
    // cannot assert visual legibility, so no pixel assertion here.
  });
});

test.describe('grid hero wordmark cutout — mobile (HOME-03, D-05 reversal)', () => {
  test('the grid hero wordmark cutout is mobile-only; desktop stays solid', async ({ page }) => {
    // Mobile (393px): cutout applied — same background-clip:text +
    // photo background-image treatment as the carousel wordmark.
    await page.setViewportSize({ width: 393, height: 800 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();

    const mobileWordmark = page.locator('.home-grid__wordmark');
    await expect(mobileWordmark).toBeVisible();
    const mobileStyle = await mobileWordmark.evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        clip: style.webkitBackgroundClip || style.backgroundClip,
        bg: style.backgroundImage,
      };
    });
    expect(mobileStyle.clip).toContain('text');
    expect(mobileStyle.bg).toContain('url(');

    // Desktop (1280px): D-05 preserved — solid, non-transparent text, no
    // cutout. Reload at the wider viewport rather than resizing in place,
    // since the toggle mode is local component state that should still be
    // in grid mode after a fresh load selects grid again.
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();

    const desktopWordmark = page.locator('.home-grid__wordmark');
    await expect(desktopWordmark).toBeVisible();
    const desktopFill = await desktopWordmark.evaluate((el) => {
      const style = getComputedStyle(el);
      return style.webkitTextFillColor || style.color;
    });
    expect(desktopFill).not.toBe('transparent');
    expect(desktopFill).not.toBe('rgba(0, 0, 0, 0)');
  });
});

// quick-260713-jfz: the toggle's DOM mutation now runs inside
// document.startViewTransition() (feature-detected). View Transitions
// themselves cannot be meaningfully pixel/frame-asserted in Playwright, so
// this is a robust, non-visual, non-timing functional assertion — it only
// proves the transition wrapping doesn't break the swap under the
// reduced-motion CSS path (where the animation is disabled but the DOM
// mutation still must occur).
test.describe('view-transition toggle — reduced-motion still swaps modes', () => {
  test('toggling with prefers-reduced-motion: reduce still functionally swaps carousel/grid', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    const carousel = page.locator('[data-role="home-carousel"]');
    const grid = page.locator('[data-role="home-grid"]');
    await expect(carousel).toBeVisible();

    await page.getByRole('button', { name: 'Grille' }).click();
    await expect(carousel).toBeHidden();
    await expect(grid).toBeVisible();

    await page.getByRole('button', { name: 'Carrousel' }).click();
    await expect(carousel).toBeVisible();
    await expect(grid).toBeHidden();
  });
});

// quick-260713-kit: regression guard for the accent-panel fade timing fix.
// Pauses and scrubs the real ::view-transition-new(ajs-accent-panel)
// animation instead of asserting the CSS rule's text exists — a rule can be
// present in the stylesheet yet silently not take effect (this was exactly
// the original bug class: animation-fill-mode falling through to whatever
// the browser's own default happens to be). Chromium-only (view transitions
// are feature-detected; the test itself skips gracefully if unsupported).
test.describe('view-transition accent-panel fade timing (quick-260713-kit)', () => {
  test('accent panel is near-invisible during the entrance delay window and fully visible by transition end', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'View Transitions scrubbing is Chromium-only in this suite');

    await page.goto('/');

    const supported = await page.evaluate(() => typeof document.startViewTransition === 'function');
    test.skip(!supported, 'document.startViewTransition unsupported in this browser');

    // Capture the transition object so we can await `ready` (pseudo-element
    // tree + animations guaranteed to exist) instead of an arbitrary delay.
    await page.evaluate(() => {
      const orig = document.startViewTransition.bind(document);
      (window as unknown as { __lastVT: unknown }).__lastVT = null;
      document.startViewTransition = (cb: () => void) => {
        const vt = orig(cb);
        (window as unknown as { __lastVT: unknown }).__lastVT = vt;
        return vt;
      };
    });

    const toggle = page.locator('[data-role="mode-toggle"]');
    await expect(page.locator('[data-role="home-carousel"]')).toBeVisible();

    // Go to grid first, then back to carousel — the accent panel's entrance
    // fade (::view-transition-new) is on the grid->carousel direction.
    await toggle.click();
    await expect(page.locator('[data-role="home-grid"]')).toBeVisible();

    const opacities = await page.evaluate(async () => {
      const toggleBtn = document.querySelector<HTMLButtonElement>('[data-role="mode-toggle"]');
      toggleBtn?.click();

      const win = window as unknown as { __lastVT: { ready?: Promise<void> } | null };
      for (let i = 0; i < 50 && !win.__lastVT; i++) {
        await new Promise((r) => setTimeout(r, 2));
      }
      if (win.__lastVT?.ready) {
        await win.__lastVT.ready;
      }

      const panelAnim = document
        .getAnimations()
        .find((a) => a.effect?.pseudoElement === '::view-transition-new(ajs-accent-panel)');

      if (!panelAnim) return null;

      panelAnim.pause();

      const readAt = (t: number) => {
        panelAnim.currentTime = t;
        document.documentElement.offsetHeight; // force style flush
        return parseFloat(
          getComputedStyle(document.documentElement, '::view-transition-new(ajs-accent-panel)').opacity,
        );
      };

      return { at200: readAt(200), at760: readAt(760) };
    });

    expect(opacities).not.toBeNull();
    // Inside the 420ms animation-delay window (the panel waits for the
    // photo/root/header group to fully finish before starting its own
    // fade — sequential, not overlapping): still fully invisible.
    expect(opacities!.at200).toBeLessThanOrEqual(0.05);
    // Well past the fade's end (420ms delay + 320ms duration = 740ms):
    // fully visible.
    expect(opacities!.at760).toBeGreaterThanOrEqual(0.95);
  });
});

// Phase 07 Plan 01, Task 1 (HOME-04, D-01-D-05): Instagram icon link in the
// homepage header nav, reusing the footer's existing link semantics
// (04.2-01-SUMMARY.md) rather than re-deriving new behavior.
test.describe('Instagram nav link (HOME-04)', () => {
  test('exactly one Instagram link exists in the header with correct href/target/rel', async ({ page }) => {
    await page.goto('/');

    const header = page.locator('header');
    const instagramLink = header.locator('a[href="https://www.instagram.com/ajs_romanelepont/"]');
    await expect(instagramLink).toHaveCount(1);
    await expect(instagramLink).toHaveAttribute('target', '_blank');
    const rel = await instagramLink.getAttribute('rel');
    expect(rel).toContain('noopener');
    expect(rel).toContain('noreferrer');
  });

  test('the link renders an inline svg icon (not visible text) with an accessible name of Instagram', async ({ page }) => {
    await page.goto('/');

    const link = page.locator('header a[href="https://www.instagram.com/ajs_romanelepont/"]');
    await expect(link.locator('svg')).toHaveCount(1);
    // Accessible name check via ARIA role query, scoped to the header — proves
    // the header's link has a discoverable name of "Instagram" without
    // relying on visible text (the pre-existing footer link also matches
    // this href, so this must be scoped, not page-wide).
    const header = page.locator('header');
    await expect(header.getByRole('link', { name: 'Instagram', exact: false })).toHaveCount(1);
  });

  test('DOM order: the Instagram link comes after the Contact link inside .site-nav', async ({ page }) => {
    await page.goto('/');

    const navLinks = page.locator('.site-nav > a');
    const hrefs = await navLinks.evaluateAll((els) => els.map((el) => el.getAttribute('href')));
    const contactIndex = hrefs.findIndex((href) => href?.includes('contact'));
    const instagramIndex = hrefs.findIndex((href) => href === 'https://www.instagram.com/ajs_romanelepont/');
    expect(contactIndex).toBeGreaterThanOrEqual(0);
    expect(instagramIndex).toBeGreaterThan(contactIndex);
  });

  test('at a 393px mobile viewport the Instagram link is visible with no horizontal page overflow', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 800 });
    await page.goto('/');

    // Scoped to .site-nav — the pre-existing footer Instagram link also
    // matches this href but is not the subject of this mobile-fit assertion.
    const instagramLink = page.locator('.site-nav a[href="https://www.instagram.com/ajs_romanelepont/"]');
    await expect(instagramLink).toBeVisible();

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth);
  });

  test('the sr-only new-tab hint is locale-conditional (FR vs EN)', async ({ page }) => {
    // textContent (not innerText) preserves the exact leading-space string —
    // rendered innerText collapses/trims whitespace, which would falsely
    // strip the leading space this string is defined with.
    await page.goto('/en/');
    const enHint = await page
      .locator('.site-nav a[href="https://www.instagram.com/ajs_romanelepont/"] .sr-only')
      .evaluate((el) => el.textContent);
    expect(enHint).toBe(' (opens in new tab)');

    await page.goto('/');
    const frHint = await page
      .locator('.site-nav a[href="https://www.instagram.com/ajs_romanelepont/"] .sr-only')
      .evaluate((el) => el.textContent);
    expect(frHint).toBe(' (nouvelle fenêtre)');
  });
});

test.describe('square mode-toggle box (HOME-05)', () => {
  test('carousel mode: .home-toggle__box is a square and .home-toggle clears the 44px tap-target floor', async ({ page }) => {
    await page.goto('/');

    const box = page.locator('.home-toggle__box');
    const boxBox = await box.boundingBox();
    expect(boxBox).not.toBeNull();
    expect(Math.abs((boxBox!.width ?? 0) - (boxBox!.height ?? 0))).toBeLessThanOrEqual(1);

    const toggle = page.locator('[data-role="mode-toggle"]');
    const toggleBox = await toggle.boundingBox();
    expect(toggleBox).not.toBeNull();
    expect(toggleBox!.width).toBeGreaterThanOrEqual(44);
    expect(toggleBox!.height).toBeGreaterThanOrEqual(44);
  });

  test('grid mode: .home-toggle__box remains a square', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();

    const box = page.locator('.home-toggle__box');
    const boxBox = await box.boundingBox();
    expect(boxBox).not.toBeNull();
    expect(Math.abs((boxBox!.width ?? 0) - (boxBox!.height ?? 0))).toBeLessThanOrEqual(1);
  });

  test('the visible border lives on .home-toggle__box and the single-toggle contract is unchanged', async ({ page }) => {
    await page.goto('/');

    const box = page.locator('.home-toggle__box');
    const borderWidth = await box.evaluate((el) => parseFloat(getComputedStyle(el).borderWidth));
    expect(borderWidth).toBeGreaterThan(0);

    await expect(page.locator('[data-role="mode-toggle"]')).toHaveCount(1);
    await expect(page.locator('.home-toggle__btn')).toHaveCount(0);
  });
});

test.describe('mobile hero visibility (D-08)', () => {
  test('hero renders visibly at a 375px-wide viewport, not collapsed/blank', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const hero = page.locator('.home-hero');
    await expect(hero).toBeVisible();
    const heroBox = await hero.boundingBox();
    expect(heroBox?.height ?? 0).toBeGreaterThan(300);

    const heroImage = page.locator('[data-role="hero-image"]');
    await expect(heroImage).toBeVisible();
    const imageBox = await heroImage.boundingBox();
    expect(imageBox?.height ?? 0).toBeGreaterThan(0);

    // Regression guard for the root cause found while fixing D-08: on
    // mobile the accent panel (wordmark/intro) used to become a
    // statically-positioned box, dropping it out of the stacking layer
    // that the (opaque) hero photo paints in — visually burying the
    // accent panel's content under the photo even though every element
    // individually reported non-zero size/visibility. Per D-10 the CTA
    // that used to exercise this is gone, so the wordmark itself is the
    // regression witness now.
    const wordmark = page.locator('.home-hero__wordmark');
    await expect(wordmark).toBeVisible();

    await page.getByRole('button', { name: 'Grille' }).click();
    await expect(page.locator('[data-role="home-grid"]')).toBeVisible();
  });
});

// Phase 07 Plan 02 (HOME-06, D-10/D-11/D-12): mobile-emulation regression
// guard for the real-device (iPhone 17 Pro) full-bleed hero bug — a white
// gap above the header plus the site footer bleeding through on first load.
// D-11: this is emulation-only (Playwright's iPhone device profile still
// runs on the chromium engine, per playwright.config.ts's single chromium
// project — test.use() below only overrides context options like viewport/
// isMobile/hasTouch/UA, it does not switch the underlying browser engine to
// WebKit). A GREEN result here is NOT a guarantee the exact real-device
// symptom is impossible — this bug class (100vh vs 100svh Safari-chrome
// timing) already escaped devtools/emulation testing once before (Phase 6's
// fix was only caught via a real iPhone 17 Pro screenshot, see
// 06-01-SUMMARY.md). If the symptom recurs live post-ship, it should be
// flagged as a follow-up quick task, not treated as disproven by this test.
test.describe('mobile full-bleed hero regression (HOME-06)', () => {
  // defaultBrowserType is stripped from the device descriptor before
  // spreading — the suite has a single chromium project (playwright.config.ts),
  // and Playwright refuses test.use({ defaultBrowserType }) inside a describe
  // block (it would force a dedicated worker/browser per D-11's own note:
  // engine stays chromium, only viewport/isMobile/hasTouch/UA are emulated).
  const { defaultBrowserType: _defaultBrowserType, ...iPhone14Pro } = devices['iPhone 14 Pro'];
  test.use({ ...iPhone14Pro });

  test('at an iPhone viewport, on first load the hero is full-bleed with no gap above the header and no footer bleed-through, and the morph stays active', async ({ page }) => {
    await page.goto('/');

    const header = page.locator('[data-role="site-header"]');
    const photo = page.locator('.home-hero__photo');
    await expect(header).toBeVisible();
    await expect(photo).toBeVisible();

    const headerBox = await header.boundingBox();
    const photoBox = await photo.boundingBox();
    expect(headerBox).not.toBeNull();
    expect(photoBox).not.toBeNull();
    // No white gap above the header: both the header and the hero photo
    // sit flush against the top of the viewport (the header overlays the
    // photo, it doesn't push it down).
    expect(Math.abs(headerBox!.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(photoBox!.y)).toBeLessThanOrEqual(1);

    const viewportSize = page.viewportSize();
    expect(viewportSize).not.toBeNull();
    // Hero fills the small viewport: min-height:100svh should make the
    // photo at least as tall as the visible (chrome-showing) viewport.
    expect(photoBox!.height).toBeGreaterThanOrEqual(viewportSize!.height - 2);

    // Footer not visible in the initial viewport: BaseLayout.astro always
    // renders <footer>, regardless of headerVariant, so it is provably
    // present in the homepage DOM — it must sit at or below the fold on
    // first load, not bleed through beneath the hero.
    const footer = page.locator('footer');
    await expect(footer).toHaveCount(1);
    const footerBox = await footer.boundingBox();
    expect(footerBox).not.toBeNull();
    expect(footerBox!.y).toBeGreaterThanOrEqual(viewportSize!.height - 1);

    // D-12 guard: the carousel/grid morph must stay active on mobile — not
    // desktop/pointer:fine-gated.
    const supportsViewTransitions = await page.evaluate(() => typeof document.startViewTransition === 'function');
    expect(supportsViewTransitions).toBe(true);

    const carousel = page.locator('[data-role="home-carousel"]');
    const grid = page.locator('[data-role="home-grid"]');
    await expect(carousel).toBeVisible();
    await page.getByRole('button', { name: 'Grille' }).click();
    await expect(carousel).toBeHidden();
    await expect(grid).toBeVisible();
  });
});

// Phase 9 (HOME-09): progressive image loading — page chrome renders
// immediately (no blocking full-screen loader), the hero photo loads with
// priority and blurs-to-sharp on first paint and every swap, and grid tiles
// get the same blur-up treatment while staying lazy. RED (Wave 0 task 1):
// the placeholder/`--sharp`/`fetchpriority` targets do not exist yet — only
// the shell-renders guard is expected to already pass.
test.describe('progressive image loading (HOME-09)', () => {
  test('shell renders immediately without waiting on images', async ({ page }) => {
    await page.goto('/');

    const header = page.locator('[data-role="site-header"]');
    await expect(header).toBeVisible();
    const nav = page.locator('.site-nav');
    await expect(nav).toBeVisible();
    const toggle = page.locator('[data-role="mode-toggle"]');
    await expect(toggle).toBeVisible();
  });

  test('hero image is requested with high priority', async ({ page }) => {
    await page.goto('/');

    const heroImg = page.locator('[data-role="hero-image"]');
    await expect(heroImg).toHaveAttribute('fetchpriority', 'high');
    await expect(heroImg).not.toHaveAttribute('loading', 'lazy');
  });

  test('hero blur-up: placeholder present and sharp fades in on first paint and after a swap', async ({ page }) => {
    await page.clock.install();
    await page.goto('/');

    const placeholder = page.locator('[data-role="hero-image-placeholder"]');
    await expect(placeholder).toHaveAttribute('src', /cdn\.sanity\.io/);

    const heroImg = page.locator('[data-role="hero-image"]');
    await expect(heroImg).toHaveClass(/is-loaded/);

    // Trigger a swap via the mocked-clock auto-advance pattern (D-09) and
    // confirm the sharp image reaches is-loaded again after the swap — the
    // is-loaded class must be removed and re-added, not left stale from the
    // previous gallery's photo (D-02).
    await page.clock.fastForward(6000);
    await expect(heroImg).toHaveClass(/is-loaded/);
  });

  test('grid tile blur-up: tiles carry a placeholder layer and gain is-loaded', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();

    const tiles = page.locator('a.home-grid__tile');
    expect(await tiles.count()).toBeGreaterThan(0);
    for (const tile of await tiles.all()) {
      // Sharp tile images use loading="lazy" (D-03) — scroll each tile into
      // view first so its request actually fires, regardless of how many
      // galleries exist or how many fit in the initial viewport.
      await tile.scrollIntoViewIfNeeded();
      const placeholder = tile.locator('.home-grid__tile-img-placeholder');
      await expect(placeholder).toHaveAttribute('src', /cdn\.sanity\.io/);
      const sharp = tile.locator('.home-grid__tile-img--sharp');
      await expect(sharp).toHaveClass(/is-loaded/);
    }
  });

  test('grid tiles stay lazy after this phase', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();

    const sharpTiles = page.locator('.home-grid__tile-img--sharp');
    expect(await sharpTiles.count()).toBeGreaterThan(0);
    for (const img of await sharpTiles.all()) {
      await expect(img).toHaveAttribute('loading', 'lazy');
    }
  });

  test('next-gallery hero photo is prefetched to warm the cache before the next swap (D-05)', async ({ page }) => {
    await page.goto('/');

    const dataItems = page.locator('ul[data-role="home-carousel-data"] li');
    const count = await dataItems.count();
    test.skip(count < 2, 'need at least 2 galleries to verify prefetch of the next one');
    const nextHeroSrc = await dataItems.nth(1).getAttribute('data-hero-src');
    expect(nextHeroSrc).toBeTruthy();

    // render() (called once immediately on script init, before any auto-advance
    // tick) prefetches galleries[(index+1) % length]'s hero photo via `new
    // Image()` (D-05) so it's already cache-warm before a swap ever happens.
    // Reload and confirm the browser actually issues that request — a
    // predicate (not a glob string) avoids Sanity CDN query-string characters
    // being misinterpreted as glob wildcards.
    const prefetchRequest = page.waitForRequest((req) => req.url() === nextHeroSrc, { timeout: 5000 });
    await page.reload();
    const request = await prefetchRequest;
    expect(request.url()).toBe(nextHeroSrc);
  });
});
