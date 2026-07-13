import { test, expect } from '@playwright/test';

// RED (Wave 0): the real homepage (hero carousel + grid toggle) does not exist
// yet — the current "/" is still Phase 1's bare placeholder homepage. These
// assertions target the contracts locked in 04.1-CONTEXT.md (D-08 carousel +
// grid toggle, D-09 auto-advance/pause, D-12 only-migrated-galleries) and
// 04.1-UI-SPEC.md, built in Plan 04.1-04. They are expected to FAIL until then
// — do not stub or weaken them to make them pass early.

// Content note: a third Sanity gallery document (slug `adults`) now has real
// published photos under the title "Paysage" — added directly in Sanity
// Studio, outside this phase's work. D-12's filter is content-driven
// (`images.length > 0`, not a hardcoded slug denylist per CONTEXT.md), so it
// correctly picks this up. Only Rebut and The Victorian Tea Room remain
// genuinely unmigrated (still zero images).
const MIGRATED_GALLERIES = [/silos/i, /brume/i, /paysage/i];
const UNMIGRATED_GALLERIES = [/rebut/i, /victorian tea room/i];

test.describe('homepage carousel', () => {
  test('carousel root renders and shows the first migrated gallery', async ({ page }) => {
    await page.goto('/');

    const carousel = page.locator('[data-role="home-carousel"]');
    await expect(carousel).toBeVisible();
    await expect(carousel).toContainText(/silos/i);
  });
});

test.describe('only migrated galleries appear (D-12)', () => {
  test('unmigrated galleries never appear; all migrated galleries are reachable', async ({ page }) => {
    await page.goto('/');

    // The carousel shows one slide's title at a time by design, so "all
    // migrated galleries are reachable" is checked in grid mode, where every
    // gallery renders as its own visible tile simultaneously.
    await page.getByRole('button', { name: 'Grille' }).click();
    const gridText = await page.locator('[data-role="home-grid"]').innerText();

    for (const forbidden of UNMIGRATED_GALLERIES) {
      expect(gridText).not.toMatch(forbidden);
    }
    for (const migrated of MIGRATED_GALLERIES) {
      expect(gridText).toMatch(migrated);
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

    const header = page.locator('header');
    await expect(header).toBeVisible();
    await expect(header).toContainText('FR | EN');
    const frHeaderText = await header.innerText();

    await page.goto('/en/');
    const enHeaderText = await page.locator('header').innerText();

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

      return { at80: readAt(80), at480: readAt(480) };
    });

    expect(opacities).not.toBeNull();
    // Inside the 100ms animation-delay window: near-invisible.
    expect(opacities!.at80).toBeLessThanOrEqual(0.05);
    // Transition end: fully visible.
    expect(opacities!.at480).toBeGreaterThanOrEqual(0.95);
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
