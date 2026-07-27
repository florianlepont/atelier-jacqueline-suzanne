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

  test('the explicit pause control persists after pointer movement and can resume playback', async ({ page }) => {
    await page.clock.install();
    await page.goto('/');

    const indexLabel = page.locator('[data-role="index-label"]');
    const pauseButton = page.locator('[data-role="autoplay-toggle"]');
    const initialLabel = await indexLabel.innerText();

    await expect(pauseButton).toHaveAttribute('aria-label', 'Mettre le carrousel en pause');
    await pauseButton.click();
    await expect(pauseButton).toHaveAttribute('aria-pressed', 'true');
    await expect(pauseButton).toHaveAttribute('aria-label', 'Relancer le carrousel');
    await page.mouse.move(0, 0);
    await page.clock.fastForward(12000);
    await expect(indexLabel).toHaveText(initialLabel);

    await pauseButton.click();
    await expect(pauseButton).toHaveAttribute('aria-pressed', 'false');
    await page.clock.fastForward(6000);
    await expect(indexLabel).not.toHaveText(initialLabel);
  });

  test('reduced-motion visitors start with automatic playback paused', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.clock.install();
    await page.goto('/');

    const indexLabel = page.locator('[data-role="index-label"]');
    const initialLabel = await indexLabel.innerText();
    await expect(page.getByRole('button', { name: 'Relancer le carrousel' })).toHaveAttribute('aria-pressed', 'true');
    await page.clock.fastForward(12000);
    await expect(indexLabel).toHaveText(initialLabel);
  });
});

test.describe('i18n non-regression guard', () => {
  test('homepage header still exposes the one-link switcher and differs between locales', async ({ page }) => {
    await page.goto('/');

    const header = page.locator('[data-role="site-header"]');
    await expect(header).toBeVisible();
    // I18N-04/D-07/D-08: single switcher link (other language), no
    // separator, accessible name contains "EN" on the French homepage.
    const switcher = header.locator('.language-switcher');
    await expect(switcher.locator('.switcher-link')).toHaveCount(1);
    await expect(switcher.locator('.switcher-separator')).toHaveCount(0);
    await expect(switcher.getByRole('link', { name: 'EN' })).toHaveCount(1);
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
  // quick-260725-tqs (Item 2): the carousel's own per-slide byline/
  // description was removed (grid tiles keep their own hover description,
  // asserted below, unchanged) — this replaces the old "uses the current
  // statement" test, which targeted an element that no longer exists.
  test('carousel byline/description is removed, on FR and EN', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-role="gallery-statement"]')).toHaveCount(0);
    await expect(page.locator('.home-hero__byline')).toHaveCount(0);

    await page.goto('/en/');
    await expect(page.locator('[data-role="gallery-statement"]')).toHaveCount(0);
    await expect(page.locator('.home-hero__byline')).toHaveCount(0);
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

  test('carousel keeps its navigation fixed and clamps the caption width', async ({ page }) => {
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
      const accent = element.querySelector<HTMLElement>('[data-role="accent-panel"]')!;
      const captionRect = caption.getBoundingClientRect();
      const indexRect = indexLabel.getBoundingClientRect();
      const titleRect = title.getBoundingClientRect();
      const accentRect = accent.getBoundingClientRect();

      return {
        captionRight: captionRect.right,
        captionWidth: captionRect.width,
        indexTitleGap: titleRect.top - indexRect.bottom,
        titleFontSize: parseFloat(getComputedStyle(title).fontSize),
        accentLeft: accentRect.left,
      };
    });

    // Item 4 narrowed the accent panel (min(800px,60%) -> min(700px,52%)),
    // but the caption's own right-offset calc tracks the SAME panel width
    // token, so the clearance between the caption's right edge and the
    // panel's left edge is invariant at exactly var(--space-3xl) (64px)
    // regardless of the panel's own width — these bounds still hold
    // unchanged after the narrowing.
    expect(layout.captionRight).toBeLessThanOrEqual(layout.accentLeft);
    expect(layout.captionWidth).toBeLessThanOrEqual(721);
    expect(layout.indexTitleGap).toBeGreaterThanOrEqual(11);
    expect(layout.titleFontSize).toBe(18);
    expect(layout.accentLeft - layout.captionRight).toBeGreaterThanOrEqual(63);
  });
});

// quick-260726-obg (Task 3): removes the persistent underline added by
// quick-260725-tqs (Item 3), per direct user feedback — matches DetailHero's
// non-underlined overlay title.
test.describe('carousel title has no underline (quick-260726-obg)', () => {
  test('the title renders with no underline at rest or on hover, keeping its accent-color hover and pointer cursor', async ({ page }) => {
    await page.goto('/');

    const title = page.locator('[data-role="gallery-title"]');
    await expect(title).toHaveCSS('text-decoration-line', 'none');

    await title.hover();
    await expect(title).toHaveCSS('text-decoration-line', 'none');
  });
});

// quick-260726-u97 (sketch 008 Variant C): the custom hover cursor that
// replaces the removed scroll-to-open gesture — a permanent OUVRIR/OPEN
// center ring morphing into an accent-tinted directional pill at the 22%
// edge zones. Runs in the default chromium project, which reports
// hover:hover + pointer:fine (devices['Desktop Chrome']), so the cursor
// system activates.
test.describe('carousel hover cursor (sketch 008 Variant C)', () => {
  async function photoBox(page: import('@playwright/test').Page) {
    const box = await page.locator('.home-hero__photo').boundingBox();
    if (!box) throw new Error('.home-hero__photo has no bounding box');
    return box;
  }

  test('FR center zone: permanent OUVRIR label, cursor visible', async ({ page }) => {
    await page.goto('/');
    const box = await photoBox(page);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.3, { steps: 10 });

    const cursor = page.locator('[data-role="hero-cursor"]');
    await expect(cursor).toHaveAttribute('data-zone', 'center');
    await expect(cursor.locator('.home-hero__cursor-label')).toHaveText('OUVRIR');
    await expect(cursor).toHaveCSS('opacity', '1');
  });

  test('EN center zone: permanent OPEN label', async ({ page }) => {
    await page.goto('/en/');
    const box = await photoBox(page);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.3, { steps: 10 });

    const cursor = page.locator('[data-role="hero-cursor"]');
    await expect(cursor).toHaveAttribute('data-zone', 'center');
    await expect(cursor.locator('.home-hero__cursor-label')).toHaveText('OPEN');
  });

  test('left edge zone: arrow shown, cursor tinted with the current accent', async ({ page }) => {
    await page.goto('/');
    const box = await photoBox(page);
    await page.mouse.move(box.x + box.width * 0.05, box.y + box.height * 0.3, { steps: 10 });

    const cursor = page.locator('[data-role="hero-cursor"]');
    await expect(cursor).toHaveAttribute('data-zone', 'left');
    await expect(cursor.locator('.home-hero__cursor-arrow')).toBeVisible();

    // .home-hero__accent's background-color is the same --current-accent
    // custom property the cursor's edge-zone background uses — comparing
    // against its resolved computed color avoids depending on whether the
    // accent is a hex value or a CSS var() fallback chain. toHaveCSS polls
    // until it matches, riding out the 200ms background-color transition
    // rather than sampling mid-transition. quick-260727-bsm (Bug B): the
    // background now lives on the inner `.home-hero__cursor-ring` (the
    // outer element is a pure position anchor), so the assertion retargets
    // there.
    const expectedBg = await page.locator('[data-role="accent-panel"]').evaluate((el) => getComputedStyle(el).backgroundColor);
    await expect(cursor.locator('.home-hero__cursor-ring')).toHaveCSS('background-color', expectedBg);
  });

  test('right edge zone: arrow shown', async ({ page }) => {
    await page.goto('/');
    const box = await photoBox(page);
    await page.mouse.move(box.x + box.width * 0.95, box.y + box.height * 0.3, { steps: 10 });

    const cursor = page.locator('[data-role="hero-cursor"]');
    await expect(cursor).toHaveAttribute('data-zone', 'right');
    await expect(cursor.locator('.home-hero__cursor-arrow')).toBeVisible();
  });

  test('the native cursor is hidden over the hero photo', async ({ page }) => {
    await page.goto('/');
    const photoCursor = await page.locator('.home-hero__photo').evaluate((el) => getComputedStyle(el).cursor);
    expect(photoCursor).toBe('none');
  });

  // quick-260727-bsm (Bug B — Safari cursor jitter): the outer position
  // anchor (`[data-role="hero-cursor"]`) carries the JS-driven per-mousemove
  // `translate(x, y)` and must NEVER be subject to a CSS transition on any
  // browser — a shared transition on both position and an eased state morph
  // is what caused Safari to jitter (every mousemove retargeted an
  // in-flight eased transition). This is the core proof: it must fail if
  // the position/morph split is ever reverted (e.g. back to a single
  // .home-hero__cursor rule with `transition: transform ...` or the CSS
  // default `all`).
  test('the cursor position anchor carries no transform transition (Safari-jitter fix)', async ({ page }) => {
    await page.goto('/');
    const box = await photoBox(page);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.3, { steps: 10 });

    const cursor = page.locator('[data-role="hero-cursor"]');
    const transitionProperty = await cursor.evaluate((el) => getComputedStyle(el).transitionProperty);
    expect(transitionProperty).not.toBe('all');
    expect(transitionProperty.split(',').map((p) => p.trim())).not.toContain('transform');
  });

  test.describe('mobile', () => {
    const { defaultBrowserType: _defaultBrowserType, ...iPhone14Pro } = devices['iPhone 14 Pro'];
    test.use({ ...iPhone14Pro });

    // Regression guard for a real bug caught during live-browser
    // verification: the cursor's base/resting properties (position,
    // opacity, pointer-events) were originally declared ONLY inside the
    // `@media (hover: hover) and (pointer: fine)` block. On a touchscreen
    // that query never matches, so the element got ZERO styling and fell
    // back to browser defaults — a real, laid-out, visible block reading
    // "OUVRIR→" at the top of the photo (position:static, display:block,
    // opacity:1, full container width) — invisible in one screenshot only
    // by the coincidence of the site header painting over it, not because
    // it was actually inert. This asserts the fix directly against
    // getComputedStyle, not against a screenshot that could mask the bug
    // again by accident.
    test('the cursor is invisible and out of document flow, independent of the hover/pointer media query', async ({ page }) => {
      await page.goto('/');
      const cursor = page.locator('[data-role="hero-cursor"]');
      const style = await cursor.evaluate((el) => {
        const computed = getComputedStyle(el);
        return {
          opacity: computed.opacity,
          position: computed.position,
          pointerEvents: computed.pointerEvents,
        };
      });
      expect(style.opacity).toBe('0');
      expect(style.position).toBe('absolute');
      expect(style.pointerEvents).toBe('none');
    });
  });
});

// quick-260727-drq (Bug 1 — Safari peek-transition micro-jitter): proves
// the structural fix — .is-tracking disables the transform transition on
// both .home-hero__img and .home-hero__peek, so per-mousemove writes to
// --peek-shift/the peek layers' transform apply instantly instead of
// retargeting an in-flight 420ms eased transition. This is Chromium-only,
// so it cannot directly observe Safari's jitter (that's the orchestrator's
// live re-verify step, mirroring quick-260727-bsm's Bug B rationale) — it
// proves the transition-disable wiring is present and correctly scoped.
test.describe('carousel peek transform is un-eased while tracking (Bug 1)', () => {
  test('is-tracking disables the transform transition on the hero image and peek layers; removing it restores the transition', async ({ page }) => {
    await page.goto('/');
    const heroImg = page.locator('.home-hero__img--sharp');
    const peekPrev = page.locator('[data-role="peek-prev"]');

    await page.locator('.home-hero__photo').evaluate((el) => el.classList.add('is-tracking'));
    const trackingTransition = await heroImg.evaluate((el) => getComputedStyle(el).transitionProperty);
    expect(trackingTransition.split(',').map((p) => p.trim())).not.toContain('transform');
    const trackingPeekTransition = await peekPrev.evaluate((el) => getComputedStyle(el).transitionProperty);
    expect(trackingPeekTransition.split(',').map((p) => p.trim())).not.toContain('transform');

    await page.locator('.home-hero__photo').evaluate((el) => el.classList.remove('is-tracking'));
    const restedTransition = await heroImg.evaluate((el) => getComputedStyle(el).transitionProperty);
    expect(restedTransition.split(',').map((p) => p.trim())).toContain('transform');
    const restedPeekTransition = await peekPrev.evaluate((el) => getComputedStyle(el).transitionProperty);
    expect(restedPeekTransition.split(',').map((p) => p.trim())).toContain('transform');
  });
});

// quick-260727-fc2: regression guard for a bug in quick-260727-drq's own
// Bug 1 fix. commitEdge() removes .is-tracking BEFORE setting its full-slide
// targets (correct — a discrete moment should keep the 420ms ease), but its
// finish() cleanup never re-adds it once the commit settles. So after the
// FIRST edge-click commit in a continuous hover session (mouse never leaving
// the photo), every SUBSEQUENT peek reverts to the eased CSS transition,
// reintroducing Bug 1's Safari transition-retarget jitter. This must FAIL on
// the pre-fix (un-re-armed) code and PASS once finish() re-arms is-tracking
// (guarded by the live hover signal, .is-cursor-active).
test.describe('carousel is-tracking re-armed after edge-click commit (quick-260727-fc2)', () => {
  async function photoBox(page: import('@playwright/test').Page) {
    const box = await page.locator('.home-hero__photo').boundingBox();
    if (!box) throw new Error('.home-hero__photo has no bounding box');
    return box;
  }

  test('FR: a second peek after a settled edge-click commit stays un-eased (is-tracking re-armed)', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-role="autoplay-toggle"]').click();

    const box = await photoBox(page);
    const edgeY = box.y + box.height * 0.3;

    // First peek toward the right edge arms is-tracking via mouseenter,
    // then the click commits a full slide (commitEdge('next')), which
    // removes is-tracking before its full-slide targets.
    await page.mouse.move(box.x + box.width * 0.97, edgeY, { steps: 10 });
    await page.mouse.down();
    await page.mouse.up();

    // Let the ~420-480ms commit fully settle (past the fallback timer)
    // WITHOUT the mouse ever leaving the photo box.
    await page.waitForTimeout(700);

    // Second peek in the SAME hover session, still inside the photo box —
    // must be instant/un-eased if is-tracking was correctly re-armed.
    await page.mouse.move(box.x + box.width * 0.95, edgeY, { steps: 10 });

    await expect(page.locator('.home-hero__photo')).toHaveClass(/is-tracking/);
    const transition = await page
      .locator('.home-hero__img--sharp')
      .evaluate((el) => getComputedStyle(el).transitionProperty);
    expect(transition.split(',').map((p) => p.trim())).not.toContain('transform');
  });

  test('EN: a second peek after a settled edge-click commit stays un-eased (is-tracking re-armed)', async ({ page }) => {
    await page.goto('/en/');
    await page.locator('[data-role="autoplay-toggle"]').click();

    const box = await photoBox(page);
    const edgeY = box.y + box.height * 0.3;

    await page.mouse.move(box.x + box.width * 0.97, edgeY, { steps: 10 });
    await page.mouse.down();
    await page.mouse.up();

    await page.waitForTimeout(700);

    await page.mouse.move(box.x + box.width * 0.95, edgeY, { steps: 10 });

    await expect(page.locator('.home-hero__photo')).toHaveClass(/is-tracking/);
    const transition = await page
      .locator('.home-hero__img--sharp')
      .evaluate((el) => getComputedStyle(el).transitionProperty);
    expect(transition.split(',').map((p) => p.trim())).not.toContain('transform');
  });
});

// quick-260727-g04: commitEdge()'s full-slide commit pushes --peek-shift to
// +-100% -- vastly beyond the ~16% hover-peek range the drq clamp in
// computeWordmarkBackgroundPosition() was validated against. The raw
// position blows past the photo's real pixel bounds almost immediately and
// the clamp holds the OUTPUT frozen there for nearly the whole ~420-480ms
// slide, so the wordmark visibly freezes a wrongly-cropped slice of the
// departing photo instead of tracking it. Fix: commitEdge() now reverts the
// wordmark to its solid-ink fallback (mirroring what render() already does
// on every other nav path) at the START of the slide, and finish()'s
// existing render() call re-reveals the cutout realigned to the NEW photo
// once the swap lands. This must FAIL on the pre-fix code (mid-slide
// has-wordmark-photo still present) and PASS once the reset is applied.
test.describe('carousel wordmark does not freeze during edge-click commit (quick-260727-g04)', () => {
  async function photoBox(page: import('@playwright/test').Page) {
    const box = await page.locator('.home-hero__photo').boundingBox();
    if (!box) throw new Error('.home-hero__photo has no bounding box');
    return box;
  }

  test('FR: wordmark goes solid mid-slide and re-reveals realigned at settle', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-role="autoplay-toggle"]').click();
    await expect(page.locator('.home')).toHaveClass(/has-wordmark-photo/);

    const indexLabel = page.locator('[data-role="index-label"]');
    const initialIndex = await indexLabel.innerText();

    const box = await photoBox(page);
    await page.mouse.move(box.x + box.width * 0.97, box.y + box.height * 0.3, { steps: 10 });
    await page.mouse.down();
    await page.mouse.up();

    // Deterministic mid-slide sample, well before the ~420-480ms settle.
    // A fixed timeout (not Playwright's auto-retrying toHaveClass) is
    // required here -- the pre-fix render() call at finish() removes+re-adds
    // the class synchronously within the same tick, so it is never
    // observably absent to a polling assertion; only a direct sample mid-
    // flight catches the pre-fix freeze.
    await page.waitForTimeout(150);
    const midSlideHasCutout = await page.locator('.home').evaluate((el) => el.classList.contains('has-wordmark-photo'));
    expect(midSlideHasCutout).toBe(false);

    // The commit settles and re-reveals on the NEW slide, realigned.
    await expect(page.locator('.home')).toHaveClass(/has-wordmark-photo/);
    await expect(indexLabel).not.toHaveText(initialIndex);
    const wordmark = page.locator('.home-hero__wordmark');
    const settledPosition = await wordmark.evaluate((el) => getComputedStyle(el).getPropertyValue('--wordmark-bg-position').trim());
    expect(settledPosition).toMatch(/^-?\d+(\.\d+)?px -?\d+(\.\d+)?px$/);
  });

  test('EN: wordmark goes solid mid-slide and re-reveals realigned at settle', async ({ page }) => {
    await page.goto('/en/');
    await page.locator('[data-role="autoplay-toggle"]').click();
    await expect(page.locator('.home')).toHaveClass(/has-wordmark-photo/);

    const indexLabel = page.locator('[data-role="index-label"]');
    const initialIndex = await indexLabel.innerText();

    const box = await photoBox(page);
    await page.mouse.move(box.x + box.width * 0.97, box.y + box.height * 0.3, { steps: 10 });
    await page.mouse.down();
    await page.mouse.up();

    await page.waitForTimeout(150);
    const midSlideHasCutout = await page.locator('.home').evaluate((el) => el.classList.contains('has-wordmark-photo'));
    expect(midSlideHasCutout).toBe(false);

    await expect(page.locator('.home')).toHaveClass(/has-wordmark-photo/);
    await expect(indexLabel).not.toHaveText(initialIndex);
    const wordmark = page.locator('.home-hero__wordmark');
    const settledPosition = await wordmark.evaluate((el) => getComputedStyle(el).getPropertyValue('--wordmark-bg-position').trim());
    expect(settledPosition).toMatch(/^-?\d+(\.\d+)?px -?\d+(\.\d+)?px$/);
  });
});

// quick-260727-bsm (Bug A — wordmark peek desync): syncWordmarkAlignment()
// reads heroImg.getBoundingClientRect(), which reflects the live CSS
// `transform: translateX(var(--peek-shift))` set during a peek push — but
// it used to only ever run on load/resize, so the wordmark photo-cutout
// froze relative to the photo sliding underneath it during a peek. This
// must fail on the pre-fix code (position frozen) and pass once the rAF
// sync loop (keepWordmarkSynced) is wired into updatePeek()/resetPeek().
test.describe('carousel wordmark stays synced to the peek (Bug A)', () => {
  async function photoBox(page: import('@playwright/test').Page) {
    const box = await page.locator('.home-hero__photo').boundingBox();
    if (!box) throw new Error('.home-hero__photo has no bounding box');
    return box;
  }

  test('FR: wordmark bg-position tracks a right-edge peek push', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-role="autoplay-toggle"]').click();
    await expect(page.locator('.home')).toHaveClass(/has-wordmark-photo/);

    const wordmark = page.locator('.home-hero__wordmark');
    const restPosition = await wordmark.evaluate((el) => getComputedStyle(el).getPropertyValue('--wordmark-bg-position').trim());

    const box = await photoBox(page);
    await page.mouse.move(box.x + box.width * 0.97, box.y + box.height * 0.3, { steps: 10 });

    // expect.poll rides the rAF-driven updates rather than sampling a
    // single frame — the assertion must observe the value actually change
    // while the photo is mid-push/settling, not just at one instant.
    await expect.poll(() => wordmark.evaluate((el) => getComputedStyle(el).getPropertyValue('--wordmark-bg-position').trim())).not.toBe(restPosition);
  });

  test('EN: wordmark bg-position tracks a right-edge peek push', async ({ page }) => {
    await page.goto('/en/');
    await page.locator('[data-role="autoplay-toggle"]').click();
    await expect(page.locator('.home')).toHaveClass(/has-wordmark-photo/);

    const wordmark = page.locator('.home-hero__wordmark');
    const restPosition = await wordmark.evaluate((el) => getComputedStyle(el).getPropertyValue('--wordmark-bg-position').trim());

    const box = await photoBox(page);
    await page.mouse.move(box.x + box.width * 0.97, box.y + box.height * 0.3, { steps: 10 });

    await expect.poll(() => wordmark.evaluate((el) => getComputedStyle(el).getPropertyValue('--wordmark-bg-position').trim())).not.toBe(restPosition);
  });
});

// quick-260726-u97 (sketch 008 Variant C): as the pointer nears an edge, the
// current photo peels back and the adjacent gallery's REAL photo is
// revealed underneath — proportional to proximity, real cdn.sanity.io
// sources (never a placeholder), no peek visible at rest/center.
test.describe('carousel edge-peek preview (sketch 008 Variant C)', () => {
  async function photoBox(page: import('@playwright/test').Page) {
    const box = await page.locator('.home-hero__photo').boundingBox();
    if (!box) throw new Error('.home-hero__photo has no bounding box');
    return box;
  }

  function peekTranslateXPercent(transform: string): number | null {
    // matrix(a, b, c, d, e, f) — for a pure translateX(t%) on a box of
    // known width the matrix's `e` component is the pixel translation; the
    // tests below only need sign/relative-magnitude, so this reads the raw
    // pixel `e` component directly rather than re-deriving a percentage.
    if (transform === 'none') return 0;
    const match = transform.match(/^matrix\(([^,]+),([^,]+),([^,]+),([^,]+),([^,]+),/);
    return match ? parseFloat(match[5]) : null;
  }

  test('at rest / center: peek layers stay off-screen and --peek-shift is 0', async ({ page }) => {
    await page.goto('/');
    const box = await photoBox(page);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.3, { steps: 10 });

    const shift = await page.locator('.home-hero__photo').evaluate((el) => getComputedStyle(el).getPropertyValue('--peek-shift').trim());
    expect(shift).toBe('0');

    const prevTransform = await page.locator('[data-role="peek-prev"]').evaluate((el) => getComputedStyle(el).transform);
    const nextTransform = await page.locator('[data-role="peek-next"]').evaluate((el) => getComputedStyle(el).transform);
    // translateX(-100%)/translateX(100%) on the photo's own width — both
    // resolve to a non-zero pixel `e` component with the expected sign.
    const prevX = peekTranslateXPercent(prevTransform);
    const nextX = peekTranslateXPercent(nextTransform);
    expect(prevX).not.toBeNull();
    expect(nextX).not.toBeNull();
    expect(prevX!).toBeLessThan(0);
    expect(nextX!).toBeGreaterThan(0);
  });

  test('approaching the LEFT edge reveals the real previous gallery photo, pushed proportionally to proximity', async ({ page }) => {
    await page.goto('/');
    // Pin the slide so auto-advance can't swap mid-test.
    await page.locator('[data-role="autoplay-toggle"]').click();

    const dataItems = page.locator('ul[data-role="home-carousel-data"] li');
    const count = await dataItems.count();
    test.skip(count < 2, 'need at least 2 galleries to verify the adjacent peek');
    // The prev of index 0 wraps to the last entry.
    const expectedPrevSrc = await dataItems.nth(count - 1).getAttribute('data-hero-src');
    expect(expectedPrevSrc).toBeTruthy();
    expect(expectedPrevSrc).toContain('cdn.sanity.io');

    const box = await photoBox(page);
    await page.mouse.move(box.x + box.width * 0.03, box.y + box.height * 0.3, { steps: 10 });

    const peekPrevSrc = await page.locator('[data-role="peek-prev"]').getAttribute('src');
    expect(peekPrevSrc).toBe(expectedPrevSrc);

    const shiftAt3pct = await page
      .locator('.home-hero__photo')
      .evaluate((el) => parseFloat(getComputedStyle(el).getPropertyValue('--peek-shift')));
    expect(shiftAt3pct).toBeGreaterThan(0);

    // Move closer to the edge — the push magnitude must increase
    // (proportional to proximity, per the sketch's exact coefficients).
    await page.mouse.move(box.x + box.width * 0.01, box.y + box.height * 0.3, { steps: 10 });
    const shiftAt1pct = await page
      .locator('.home-hero__photo')
      .evaluate((el) => parseFloat(getComputedStyle(el).getPropertyValue('--peek-shift')));
    expect(shiftAt1pct).toBeGreaterThan(shiftAt3pct);
  });

  test('approaching the RIGHT edge reveals the real next gallery photo, pushed proportionally to proximity', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-role="autoplay-toggle"]').click();

    const dataItems = page.locator('ul[data-role="home-carousel-data"] li');
    const count = await dataItems.count();
    test.skip(count < 2, 'need at least 2 galleries to verify the adjacent peek');
    const expectedNextSrc = await dataItems.nth(1).getAttribute('data-hero-src');
    expect(expectedNextSrc).toBeTruthy();
    expect(expectedNextSrc).toContain('cdn.sanity.io');

    const box = await photoBox(page);
    await page.mouse.move(box.x + box.width * 0.97, box.y + box.height * 0.3, { steps: 10 });

    const peekNextSrc = await page.locator('[data-role="peek-next"]').getAttribute('src');
    expect(peekNextSrc).toBe(expectedNextSrc);

    const shiftAt97pct = await page
      .locator('.home-hero__photo')
      .evaluate((el) => parseFloat(getComputedStyle(el).getPropertyValue('--peek-shift')));
    expect(shiftAt97pct).toBeLessThan(0);

    await page.mouse.move(box.x + box.width * 0.99, box.y + box.height * 0.3, { steps: 10 });
    const shiftAt99pct = await page
      .locator('.home-hero__photo')
      .evaluate((el) => parseFloat(getComputedStyle(el).getPropertyValue('--peek-shift')));
    expect(shiftAt99pct).toBeLessThan(shiftAt97pct);
  });
});

// quick-260726-u97 (sketch 008 Variant C): click behavior — center-click
// opens the current gallery (same destination + morph as the title),
// edge-clicks navigate prev/next, caption controls keep their own handlers,
// and the untouched keyboard/dash/auto-advance paths still work. Plus the
// mobile tap-to-open fallback and unchanged swipe.
test.describe('carousel hover-click navigation (sketch 008 Variant C)', () => {
  async function photoBox(page: import('@playwright/test').Page) {
    const box = await page.locator('.home-hero__photo').boundingBox();
    if (!box) throw new Error('.home-hero__photo has no bounding box');
    return box;
  }

  test('FR center click opens the current gallery (same destination as the title)', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-role="autoplay-toggle"]').click();
    const href = await page.locator('[data-role="gallery-title"]').getAttribute('href');
    expect(href).toBeTruthy();

    const box = await photoBox(page);
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.3, { steps: 10 });
    await page.mouse.down();
    await page.mouse.up();

    await page.waitForURL(`**${href}`);
    expect(page.url()).toContain(href!);
  });

  test('EN center click opens the current gallery', async ({ page }) => {
    await page.goto('/en/');
    await page.locator('[data-role="autoplay-toggle"]').click();
    const href = await page.locator('[data-role="gallery-title"]').getAttribute('href');
    expect(href).toBeTruthy();

    const box = await photoBox(page);
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.3, { steps: 10 });
    await page.mouse.down();
    await page.mouse.up();

    await page.waitForURL(`**${href}`);
    expect(page.url()).toContain(href!);
  });

  test('left edge click navigates to the previous gallery (in-page, no navigation)', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto('/');
    await page.locator('[data-role="autoplay-toggle"]').click();

    const titleEl = page.locator('[data-role="gallery-title"]');
    const initialTitle = await titleEl.innerText();

    const box = await photoBox(page);
    await page.mouse.move(box.x + box.width * 0.03, box.y + box.height * 0.3, { steps: 10 });
    await page.mouse.down();
    await page.mouse.up();

    await expect(titleEl).not.toHaveText(initialTitle);
    // An in-page carousel move, not a real navigation.
    expect(page.url()).toMatch(/\/$/);
  });

  test('right edge click navigates to the next gallery (in-page, no navigation)', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto('/');
    await page.locator('[data-role="autoplay-toggle"]').click();

    const titleEl = page.locator('[data-role="gallery-title"]');
    const initialTitle = await titleEl.innerText();

    const box = await photoBox(page);
    await page.mouse.move(box.x + box.width * 0.97, box.y + box.height * 0.3, { steps: 10 });
    await page.mouse.down();
    await page.mouse.up();

    await expect(titleEl).not.toHaveText(initialTitle);
    expect(page.url()).toMatch(/\/$/);
  });

  // quick-260727-bsm (Bug C — abrupt edge-click pop): proves commit-then-
  // swap ordering. Before the fix, goToPrev()/goToNext() swapped
  // heroImg.src in the SAME tick as the click, while the photo was still at
  // its peek-pushed offset. This asserts the swap is DEFERRED until the
  // peek has slid fully in (never same-tick), lands on the exact photo that
  // was already peeking (no third-image flash), and only happens once the
  // photo is back at a neutral transform (not mid-push).
  function transformTranslateXPx(transform: string): number | null {
    if (transform === 'none') return 0;
    const match = transform.match(/^matrix\(([^,]+),([^,]+),([^,]+),([^,]+),([^,]+),/);
    return match ? parseFloat(match[5]) : null;
  }

  test('FR right edge click defers the content swap until the peek has fully slid in, landing on the peeked photo at a neutral transform', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto('/');
    await page.locator('[data-role="autoplay-toggle"]').click();

    const heroImg = page.locator('[data-role="hero-image"]');
    const preClickSrc = await heroImg.getAttribute('src');
    const expectedNextSrc = await page.locator('[data-role="peek-next"]').getAttribute('src');
    expect(preClickSrc).toBeTruthy();
    expect(expectedNextSrc).toBeTruthy();
    expect(expectedNextSrc).not.toBe(preClickSrc);

    const box = await photoBox(page);
    await page.mouse.move(box.x + box.width * 0.97, box.y + box.height * 0.3, { steps: 10 });
    await page.mouse.down();
    await page.mouse.up();

    // Immediately (well within the 420ms slide), the swap must not have
    // happened yet — proves it's deferred, not same-tick.
    expect(await heroImg.getAttribute('src')).toBe(preClickSrc);

    // Once the peek has fully slid in, the swap lands on the exact photo
    // that was already peeking — no intermediate third image.
    await expect.poll(() => heroImg.getAttribute('src')).toBe(expectedNextSrc);

    // The swap happens at rest, not mid-push: the hero photo's transform
    // is neutral (translateX ~0) once settled.
    await expect.poll(async () => {
      const transform = await page.locator('.home-hero__img--sharp').evaluate((el) => getComputedStyle(el).transform);
      return transformTranslateXPx(transform);
    }).toBeCloseTo(0, 0);
  });

  test('EN right edge click defers the content swap until the peek has fully slid in', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto('/en/');
    await page.locator('[data-role="autoplay-toggle"]').click();

    const heroImg = page.locator('[data-role="hero-image"]');
    const preClickSrc = await heroImg.getAttribute('src');
    const expectedNextSrc = await page.locator('[data-role="peek-next"]').getAttribute('src');
    expect(preClickSrc).toBeTruthy();
    expect(expectedNextSrc).toBeTruthy();

    const box = await photoBox(page);
    await page.mouse.move(box.x + box.width * 0.97, box.y + box.height * 0.3, { steps: 10 });
    await page.mouse.down();
    await page.mouse.up();

    expect(await heroImg.getAttribute('src')).toBe(preClickSrc);
    await expect.poll(() => heroImg.getAttribute('src')).toBe(expectedNextSrc);
  });

  test('the autoplay toggle inside the caption is not hijacked by center-zone navigation', async ({ page }) => {
    await page.goto('/');

    const toggle = page.locator('[data-role="autoplay-toggle"]');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    // No navigation occurred — the caption's own click handler ran, not the
    // photo's center-zone openCurrent().
    expect(page.url()).toMatch(/\/$/);
  });

  test('keyboard, dash, and auto-advance navigation are untouched', async ({ page }) => {
    await page.clock.install();
    await page.goto('/');

    const indexLabel = page.locator('[data-role="index-label"]');
    const initialLabel = await indexLabel.innerText();

    // ArrowRight advances the index.
    await page.keyboard.press('ArrowRight');
    await expect(indexLabel).not.toHaveText(initialLabel);
    const afterArrow = await indexLabel.innerText();

    // Clicking dash 0 selects gallery 0.
    await page.locator('[data-role="progress"] .home-hero__progress-dash').first().click();
    await expect(indexLabel).not.toHaveText(afterArrow);

    // Auto-advance still ticks on a mocked clock — move the mouse off the
    // carousel first (the click above leaves it hovering, which pauses
    // auto-advance by existing design; established pattern, see the
    // "explicit pause control" test above).
    await page.mouse.move(0, 0);
    const beforeTick = await indexLabel.innerText();
    await page.clock.fastForward(6000);
    await expect(indexLabel).not.toHaveText(beforeTick);
  });

  test.describe('mobile', () => {
    const { defaultBrowserType: _defaultBrowserType, ...iPhone14Pro } = devices['iPhone 14 Pro'];
    test.use({ ...iPhone14Pro });

    test('a tap on the photo (negligible movement) opens the current gallery', async ({ page }) => {
      await page.goto('/');
      const href = await page.locator('[data-role="gallery-title"]').getAttribute('href');
      expect(href).toBeTruthy();

      await page.evaluate(() => {
        const target = document.querySelector('.home-hero__photo')!;
        const clientX = 195;
        const clientY = 400;
        const makeTouchEvent = (type: string) => {
          const touch = new Touch({ identifier: 1, target, clientX, clientY });
          return new TouchEvent(type, {
            bubbles: true,
            cancelable: true,
            touches: type === 'touchend' ? [] : [touch],
            changedTouches: [touch],
          });
        };
        target.dispatchEvent(makeTouchEvent('touchstart'));
        target.dispatchEvent(makeTouchEvent('touchend'));
      });

      await page.waitForURL(`**${href}`);
      expect(page.url()).toContain(href!);
    });

    test('a real horizontal swipe still navigates prev/next unchanged (not hijacked by tap-to-open)', async ({ page }) => {
      await page.goto('/');
      const titleEl = page.locator('[data-role="gallery-title"]');
      const initialTitle = await titleEl.innerText();

      await page.evaluate(() => {
        const target = document.querySelector('.home-hero__photo')!;
        const startX = 300;
        const clientY = 400;
        const makeTouchEvent = (type: string, clientX: number) => {
          const touch = new Touch({ identifier: 1, target, clientX, clientY });
          return new TouchEvent(type, {
            bubbles: true,
            cancelable: true,
            touches: type === 'touchend' ? [] : [touch],
            changedTouches: [touch],
          });
        };
        target.dispatchEvent(makeTouchEvent('touchstart', startX));
        target.dispatchEvent(makeTouchEvent('touchend', startX - 100));
      });

      await expect(titleEl).not.toHaveText(initialTitle);
      // In-page carousel move, not a real navigation.
      expect(page.url()).toMatch(/\/$/);
    });

    test('the peek layers never leave their resting transform on touch (no hover system on touch)', async ({ page }) => {
      await page.goto('/');

      const prevTransform = await page.locator('[data-role="peek-prev"]').evaluate((el) => getComputedStyle(el).transform);
      const nextTransform = await page.locator('[data-role="peek-next"]').evaluate((el) => getComputedStyle(el).transform);
      // Rest CSS values: translateX(-100%)/translateX(100%) — never
      // populated with real src/pushed on touch (hoverCapable is false).
      expect(prevTransform).toMatch(/^matrix\(1, 0, 0, 1, -/);
      expect(nextTransform).toMatch(/^matrix\(1, 0, 0, 1, \d/);
    });
  });
});

// quick-260725-tqs (Item 4): narrower accent panel with a retuned wordmark
// that must not clip.
test.describe('carousel accent panel narrowing, no wordmark clip (Item 4)', () => {
  test('the accent panel is narrower and the wordmark stays within it, and the caption never overlaps it', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto('/');

    const layout = await page.evaluate(() => {
      const accent = document.querySelector('.home-hero__accent')!.getBoundingClientRect();
      const wordmark = document.querySelector('.home-hero__wordmark')!.getBoundingClientRect();
      const caption = document.querySelector('.home-hero__caption')!.getBoundingClientRect();
      return {
        accentWidth: accent.width,
        accentLeft: accent.left,
        accentRight: accent.right,
        wordmarkRight: wordmark.right,
        captionRight: caption.right,
      };
    });

    // min(700px, 52%) — at 1600px viewport, 52% = 832px, so the cap wins.
    expect(layout.accentWidth).toBeLessThanOrEqual(701);
    // Clearly narrower than the previous min(800px, 60%) panel.
    expect(layout.accentWidth).toBeLessThan(800);
    // No clip: the wordmark's rendered right edge must not exceed the
    // panel's own right inner edge.
    expect(layout.wordmarkRight).toBeLessThanOrEqual(layout.accentRight + 1);
    // The caption still clears the (now further-right) panel edge.
    expect(layout.captionRight).toBeLessThanOrEqual(layout.accentLeft);
  });
});

// quick-260727-drq (Bug 3 — accent-panel color cut): render() writes
// --current-accent on every navigation with a plain custom-property write,
// which without a transition applied as a hard instant color cut. Proves
// the crossfade is wired; the live mid-transition color-sampling re-verify
// is the orchestrator's step.
test.describe('carousel accent panel crossfades on navigation (Bug 3)', () => {
  test('the accent panel has a background-color transition', async ({ page }) => {
    await page.goto('/');
    const accentPanel = page.locator('[data-role="accent-panel"]');
    const { transitionProperty, transitionDuration } = await accentPanel.evaluate((el) => {
      const style = getComputedStyle(el);
      return { transitionProperty: style.transitionProperty, transitionDuration: style.transitionDuration };
    });
    expect(transitionProperty.split(',').map((p) => p.trim())).toContain('background-color');
    expect(transitionDuration).not.toBe('0s');
  });
});

// quick-260725-tqs (Item 5): resized + repositioned sitewide intro
// paragraph. quick-260726-ltr (Item 2) widened it further to ~2/3 of the
// panel.
test.describe('carousel intro paragraph resize + reposition (Item 5)', () => {
  test('desktop: 15px font-size, confined to roughly two-thirds of the panel', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto('/');

    const intro = page.locator('.home-hero__intro');
    const fontSize = await intro.evaluate((el) => getComputedStyle(el).fontSize);
    expect(fontSize).toBe('15px');

    const layout = await page.evaluate(() => {
      const accent = document.querySelector('.home-hero__accent')!.getBoundingClientRect();
      const intro = document.querySelector('.home-hero__intro')!.getBoundingClientRect();
      return { accentInnerWidth: accent.width, introWidth: intro.width };
    });
    // Measured ratio at this viewport is ~0.606 — comfortably inside
    // (0.55, 0.70]; the old 50% rule produced ~0.454, which would fail the
    // lower bound, so this asserts the widen rather than merely loosening it.
    expect(layout.introWidth).toBeLessThanOrEqual(layout.accentInnerWidth * 0.7);
    expect(layout.introWidth).toBeGreaterThan(layout.accentInnerWidth * 0.55);
  });

  test('mobile: the intro is not squeezed to half-width (max-width: none)', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto('/');

    const intro = page.locator('.home-hero__intro');
    const maxWidth = await intro.evaluate((el) => getComputedStyle(el).maxWidth);
    expect(maxWidth === 'none' || maxWidth === '').toBe(true);
  });
});

test.describe('carousel wordmark cutout (HOME-03, D-08)', () => {
  test('the wordmark uses one clipped photo and adapts its filter to panel contrast', async ({ page }) => {
    await page.goto('/');

    const wordmark = page.locator('.home-hero__wordmark');
    await expect(page.locator('.home')).toHaveClass(/has-wordmark-photo/);
    const { clip, bg, blendMode, bgColor, textFill, strokeWidth, filter } = await wordmark.evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        clip: style.webkitBackgroundClip || style.backgroundClip,
        bg: style.backgroundImage,
        blendMode: style.backgroundBlendMode,
        bgColor: style.backgroundColor,
        textFill: style.webkitTextFillColor,
        strokeWidth: style.webkitTextStrokeWidth,
        filter: style.filter,
      };
    });

    expect(clip).toContain('text');
    expect(bg).toContain('url(');
    expect(bg).not.toContain('linear-gradient');
    expect(blendMode).toBe('normal');
    expect(bgColor).toBe('rgba(0, 0, 0, 0)');
    expect(textFill).toBe('rgba(0, 0, 0, 0)');
    expect(parseFloat(strokeWidth)).toBe(0);
    expect(filter).toContain('brightness(0.65)');
    expect(filter).toContain('contrast(1.12)');

    // Brume uses a dark purple panel with white interface text. Its already
    // dark photograph must be lifted rather than darkened further.
    await page.getByRole('tab', { name: 'Brume (2/5)' }).click();
    await expect(page.locator('.home')).toHaveClass(/has-wordmark-photo/);
    await expect.poll(() => wordmark.evaluate((el) => getComputedStyle(el).filter)).toContain('brightness(1.38)');
    await expect.poll(() => wordmark.evaluate((el) => getComputedStyle(el).filter)).toContain('contrast(0.92)');
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

    const accentPanel = page.locator('[data-role="accent-panel"]');
    await expect(accentPanel).toHaveCSS('opacity', '1');
    await expect
      .poll(() => accentPanel.evaluate((panel) => panel.getAnimations().length))
      .toBe(0);
  });
});

// Safari/WebKit can report an entering View Transition pseudo-animation at
// its final time as soon as `ready` resolves. The portable contract is now
// explicit: keep the real panel hidden throughout the photo morph, then run
// a real DOM fade after the View Transition overlay has finished. Scrubbing
// that DOM animation proves the reveal is progressive rather than a final pop.
test.describe('view-transition accent-panel sequencing', () => {
  test('keeps the real accent panel hidden through the photo morph, then progressively fades it in', async ({
    page,
  }) => {
    await page.goto('/');

    const supported = await page.evaluate(() => typeof document.startViewTransition === 'function');
    test.skip(!supported, 'document.startViewTransition unsupported in this browser');

    // Capture the transition object so this test can assert the sequencing
    // boundary directly. The real panel must remain hidden for the whole
    // photo morph; relying only on a delayed pseudo-element animation is not
    // portable because WebKit can expose that enter-only animation already
    // at its final time when `ready` resolves.
    await page.evaluate(() => {
      const original = document.startViewTransition.bind(document);
      (window as unknown as { __lastVT: unknown }).__lastVT = null;
      document.startViewTransition = (callback: () => void) => {
        const transition = original(callback);
        (window as unknown as { __lastVT: unknown }).__lastVT = transition;
        return transition;
      };
    });

    const toggle = page.locator('[data-role="mode-toggle"]');
    await toggle.click();
    await page.evaluate(async () => {
      const transition = (window as unknown as {
        __lastVT: { finished: Promise<void> };
      }).__lastVT;
      await transition.finished;
    });

    await page.evaluate(() => {
      document.querySelector<HTMLButtonElement>('[data-role="mode-toggle"]')?.click();
    });
    await page.evaluate(async () => {
      const transition = (window as unknown as {
        __lastVT: { ready: Promise<void> };
      }).__lastVT;
      await transition.ready;
    });

    const accentPanel = page.locator('[data-role="accent-panel"]');
    await expect(accentPanel).toHaveCSS('opacity', '0');

    const fadeOpacities = await page.evaluate(async () => {
      const transition = (window as unknown as {
        __lastVT: { finished: Promise<void> };
      }).__lastVT;
      await transition.finished;

      const panel = document.querySelector<HTMLElement>('[data-role="accent-panel"]');
      if (!panel) return null;

      const fade = panel.getAnimations().find((animation) => {
        const effect = animation.effect as KeyframeEffect | null;
        return effect?.pseudoElement == null && Number(effect?.getTiming().duration) === 320;
      });
      if (!fade) return null;

      fade.pause();
      const readAt = (time: number) => {
        fade.currentTime = time;
        void panel.offsetHeight;
        return parseFloat(getComputedStyle(panel).opacity);
      };

      const samples = {
        start: readAt(0),
        halfway: readAt(160),
        end: readAt(320),
      };
      fade.finish();
      await Promise.resolve();
      return samples;
    });

    expect(fadeOpacities).not.toBeNull();
    expect(fadeOpacities!.start).toBeLessThanOrEqual(0.05);
    expect(fadeOpacities!.halfway).toBeGreaterThan(0.05);
    expect(fadeOpacities!.halfway).toBeLessThan(0.95);
    expect(fadeOpacities!.end).toBeGreaterThanOrEqual(0.95);
    await expect(accentPanel).toHaveCSS('opacity', '1');
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

// Regression guard for the mode-toggle icon color (HOME-10-REGRESSION): Phase
// 10's SiteHeader refactor (commits d0b2772/3850e1d) retired the old
// .home-header container that painted color per display mode and replaced it
// with narrower per-element overrides for .nav-link/.switcher-link only — no
// equivalent override was added for .home-toggle, so it silently regressed to
// always inheriting body's ink color instead of flipping white in carousel
// mode. These assertions lock both mode colors so a future header refactor
// can't drop the carousel override again unnoticed.
test.describe('mode-toggle icon color regression (HOME-10-REGRESSION)', () => {
  test('carousel mode: .home-toggle__box and morph-cell render white', async ({ page }) => {
    await page.goto('/');

    const boxColor = await page.locator('.home-toggle__box').evaluate((el) => getComputedStyle(el).color);
    expect(boxColor).toBe('rgb(255, 255, 255)');

    const cellColor = await page
      .locator('.home-toggle__morph-cell')
      .first()
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(cellColor).toBe('rgb(255, 255, 255)');
  });

  test('grid mode: .home-toggle__box and morph-cell render ink (no regression)', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();

    await expect
      .poll(() => page.locator('.home-toggle__box').evaluate((el) => getComputedStyle(el).color))
      .toBe('rgb(26, 26, 26)');

    await expect
      .poll(() =>
        page
          .locator('.home-toggle__morph-cell')
          .first()
          .evaluate((el) => getComputedStyle(el).backgroundColor)
      )
      .toBe('rgb(26, 26, 26)');
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

test.describe('narrow-phone header regression', () => {
  test('the full header stays on one row without horizontal overflow at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto('/');

    const measurements = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      headerHeight: document.querySelector<HTMLElement>('[data-role="site-header"]')?.getBoundingClientRect().height ?? 0,
    }));

    expect(measurements.scrollWidth).toBeLessThanOrEqual(measurements.clientWidth);
    expect(measurements.headerHeight).toBeLessThanOrEqual(80);
    await expect(page.getByRole('link', { name: /Passer en anglais/ })).toBeVisible();
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

    // quick-260726-obg: the footer is now hidden entirely in carousel mode
    // (Task 2's reintroduced footer-hide) rather than merely pushed below
    // the fold — display:none satisfies toBeHidden() and fully rules out
    // any bleed-through, present in the DOM (BaseLayout.astro always
    // renders <footer> regardless of headerVariant) but not painted.
    const footer = page.locator('footer');
    await expect(footer).toHaveCount(1);
    await expect(footer).toBeHidden();

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

test.describe('tall-desktop full-bleed hero regression', () => {
  test('at 1280x1320 the photo fills the initial viewport and the footer is hidden (quick-260726-obg)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1320 });
    await page.goto('/');

    const viewportSize = page.viewportSize();
    expect(viewportSize).not.toBeNull();

    const photoBox = await page.locator('.home-hero__photo').boundingBox();
    expect(photoBox).not.toBeNull();
    expect(photoBox!.height).toBeGreaterThanOrEqual(viewportSize!.height - 2);

    // quick-260726-obg: the footer is hidden in carousel mode (Task 2's
    // reintroduced footer-hide), not merely below the fold.
    await expect(page.locator('footer')).toBeHidden();
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
    await expect(heroImg).toHaveAttribute('srcset', /480w.*2000w/);
    await expect(heroImg).toHaveAttribute('sizes', '100vw');
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
      await expect(sharp).toHaveAttribute('srcset', /320w.*900w/);
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
    const nextHeroPath = new URL(nextHeroSrc!).pathname;
    const prefetchRequest = page.waitForRequest((req) => new URL(req.url()).pathname === nextHeroPath, { timeout: 5000 });
    await page.reload();
    const request = await prefetchRequest;
    expect(new URL(request.url()).pathname).toBe(nextHeroPath);
  });
});

test.describe('grid hero tile text color tracks accent (260718-r2o)', () => {
  test('grid hero tile color reads the --current-accent-text variable, not a hardcoded ink value', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();

    // Set a sentinel value that is never a real accent text color, then read
    // back the tile's computed color. If the tile still consumed a hardcoded
    // ink value, the computed color would NOT match the sentinel.
    await page.evaluate(() => {
      (document.querySelector('.home') as HTMLElement).style.setProperty(
        '--current-accent-text',
        'rgb(0, 255, 0)',
      );
    });

    const heroTile = page.locator('.home-grid__tile--hero');
    const color = await heroTile.evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe('rgb(0, 255, 0)');
  });
});

test.describe('grid-tile title alignment (260718-rhv)', () => {
  test('every gallery tile title sits at the same offset from its own tile bottom edge', async ({ page }) => {
    // Skips the shared-element view-transition animation (see the
    // 'view-transition toggle — reduced-motion' describe block above for
    // the same pattern) — without this, an evaluate() taken immediately
    // after the toggle click can race the in-flight transition on
    // whichever tile currently carries view-transition-name, momentarily
    // reporting a zero-size bounding rect unrelated to this task's fix.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();

    // Belt-and-braces alongside the reduced-motion emulation above: the
    // shared-element view transition still briefly zeroes out the morph-
    // named tile's rendered box while its snapshot pseudo-element is
    // active, even with the animation itself instant, so wait for every
    // title to report a real (non-zero) box before measuring geometry.
    await page.waitForFunction(() => {
      const titles = document.querySelectorAll<HTMLElement>('a.home-grid__tile .home-grid__tile-title');
      return titles.length > 0 && Array.from(titles).every((title) => title.getBoundingClientRect().height > 0);
    });

    const tiles = page.locator('a.home-grid__tile');
    const count = await tiles.count();
    expect(count).toBeGreaterThan(0);

    const offsets: number[] = [];
    for (let index = 0; index < count; index += 1) {
      const tile = tiles.nth(index);
      const offset = await tile.evaluate((el) => {
        const title = el.querySelector<HTMLElement>('.home-grid__tile-title')!;
        const tileRect = el.getBoundingClientRect();
        const titleRect = title.getBoundingClientRect();
        return tileRect.bottom - titleRect.top;
      });
      offsets.push(offset);
    }

    expect(Math.max(...offsets) - Math.min(...offsets)).toBeLessThanOrEqual(1);
  });

  test('clearing a tile statement does not change its title offset (empty-statement defensive)', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();

    await page.waitForFunction(() => {
      const titles = document.querySelectorAll<HTMLElement>('a.home-grid__tile .home-grid__tile-title');
      return titles.length > 0 && Array.from(titles).every((title) => title.getBoundingClientRect().height > 0);
    });

    const tile = page.locator('a.home-grid__tile').first();

    const beforeOffset = await tile.evaluate((el) => {
      const title = el.querySelector<HTMLElement>('.home-grid__tile-title')!;
      const tileRect = el.getBoundingClientRect();
      const titleRect = title.getBoundingClientRect();
      return tileRect.bottom - titleRect.top;
    });

    const afterOffset = await tile.evaluate((el) => {
      const description = el.querySelector<HTMLElement>('.home-grid__tile-description')!;
      description.textContent = '';
      const title = el.querySelector<HTMLElement>('.home-grid__tile-title')!;
      const tileRect = el.getBoundingClientRect();
      const titleRect = title.getBoundingClientRect();
      return tileRect.bottom - titleRect.top;
    });

    expect(Math.abs(afterOffset - beforeOffset)).toBeLessThanOrEqual(1);
  });
});

test.describe('grid-tile hover polish (260718-rhv)', () => {
  test('each non-hero tile carries its own --tile-accent custom property', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();

    const tile = page.locator('a.home-grid__tile').first();
    const accent = await tile.evaluate((el) => getComputedStyle(el).getPropertyValue('--tile-accent').trim());
    expect(accent).not.toBe('');
  });

  test('hovering a tile raises its scrim tint pseudo-element opacity', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();

    const tile = page.locator('a.home-grid__tile').first();
    const scrim = tile.locator('.home-grid__tile-scrim');

    const before = await scrim.evaluate((el) => parseFloat(getComputedStyle(el, '::after').opacity));
    expect(before).toBeLessThanOrEqual(0.05);

    await tile.hover();

    await expect
      .poll(async () => scrim.evaluate((el) => parseFloat(getComputedStyle(el, '::after').opacity)))
      .toBeGreaterThan(0.05);
  });

  test('hovering a tile lifts its title (non-identity transform)', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();

    const tile = page.locator('a.home-grid__tile').first();
    const title = tile.locator('.home-grid__tile-title');

    const before = await title.evaluate((el) => getComputedStyle(el).transform);
    expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(before);

    await tile.hover();

    await expect
      .poll(async () => title.evaluate((el) => getComputedStyle(el).transform))
      .not.toBe(before);
  });

  test('keyboard focus applies the same tint and lift as hover', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();

    const tile = page.locator('a.home-grid__tile').first();
    const scrim = tile.locator('.home-grid__tile-scrim');
    const title = tile.locator('.home-grid__tile-title');
    const beforeTransform = await title.evaluate((el) => getComputedStyle(el).transform);

    // Real Tab-key navigation (not locator.focus(), a scripted .focus()
    // call that Chromium's :focus-visible heuristic does not reliably
    // treat as keyboard-originated) so the shared `:hover, :focus-visible`
    // CSS selector genuinely activates, matching how a real keyboard user
    // reaches the tile.
    await expect(async () => {
      await page.keyboard.press('Tab');
      await expect(tile).toBeFocused({ timeout: 200 });
    }).toPass({ timeout: 10_000 });

    await expect
      .poll(async () => scrim.evaluate((el) => parseFloat(getComputedStyle(el, '::after').opacity)))
      .toBeGreaterThan(0.05);
    await expect
      .poll(async () => title.evaluate((el) => getComputedStyle(el).transform))
      .not.toBe(beforeTransform);
  });
});

// quick-260720-nm3: UI audit finding — the homepage previously had zero
// heading elements (both wordmarks were <p>). The grid wordmark sits inside
// the [hidden] .home-grid container by default, so only the visible carousel
// wordmark is exposed to the accessibility tree — exactly one top-level
// heading, not two.
test.describe('homepage semantic heading (quick-260720-nm3)', () => {
  test('the homepage exposes exactly one accessible level-1 heading containing "Atelier"', async ({ page }) => {
    await page.goto('/');

    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toHaveCount(1);
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(/Atelier/i);
  });
});

// quick-260724-uf5 (sketch 006): the SOURCE side of the homepage ->
// gallery-detail cross-document photo morph. Proves the click-time name
// assignment WITHOUT navigating away — a capture-phase preventDefault
// listener cancels only the real <a> navigation, not this component's own
// bubble-phase click listener, so the name assignment still runs and can be
// read from the element's inline style before the page unloads.
// quick-260724-wdr FIX 1: the homepage cover now selects the same
// pickHeroIndex-preferred image as the gallery detail hero, so a
// portrait-first gallery (Paysage) no longer shows a different photo on the
// homepage than on its own detail page — the cross-document morph (sketch
// 006) now genuinely morphs a crop/size change of the SAME asset instead of
// swapping photos. Proven generically over every homepage gallery via the
// grid-discovery pattern already established above.
test.describe('homepage hero photo matches the gallery detail hero (landscape-preference consistency)', () => {
  test('every home-grid tile photo pathname equals its gallery detail-hero photo pathname', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();

    const tiles = page.locator('a.home-grid__tile');
    const tileCount = await tiles.count();
    expect(tileCount).toBeGreaterThan(0);

    let assertedCount = 0;
    for (let index = 0; index < tileCount; index += 1) {
      const tile = tiles.nth(index);
      const href = await tile.getAttribute('href');
      expect(href).toBeTruthy();
      const tileSrc = await tile.locator('.home-grid__tile-img--sharp').getAttribute('src');
      expect(tileSrc).toBeTruthy();

      await page.goto(href!);
      const heroSrc = await page.locator('.detail-hero__img').getAttribute('src');
      expect(heroSrc).toBeTruthy();

      // The homepage tile uses a square-crop thumbnail transform while the
      // detail hero uses a max-fit full-size transform, so their query
      // strings legitimately differ — the CDN pathname alone
      // (`/images/{project}/{dataset}/{assetId}-{w}x{h}.{ext}`) is derived
      // from the underlying asset ref and proves byte-identical asset
      // identity. Because the carousel hero (heroSrc) and this grid tile
      // (gridSrc) both derive from the SAME `cover` in the homepage's
      // `.map()`, this grid-tile <-> detail-hero proof transitively covers
      // carousel <-> detail identity too.
      expect(new URL(tileSrc!).pathname).toBe(new URL(heroSrc!).pathname);
      assertedCount += 1;

      await page.goto('/');
      await page.getByRole('button', { name: 'Grille' }).click();
    }

    expect(assertedCount).toBeGreaterThan(0);
  });
});

test.describe('cross-document morph — click-time source name assignment (sketch 006)', () => {
  test('clicking the carousel title assigns hero-photo to the current slide\'s sharp photo', async ({ page }) => {
    await page.goto('/');

    await page.evaluate(() => {
      document.querySelector('.home-hero__title')?.addEventListener(
        'click',
        (e) => e.preventDefault(),
        { capture: true },
      );
    });

    await page.locator('.home-hero__title').click();

    const heroPhoto = page.locator('.home-hero__photo .home-hero__img--sharp');
    const name = await heroPhoto.evaluate((el) => (el as HTMLElement).style.viewTransitionName);
    expect(name).toBe('hero-photo');
  });

  test('clicking a grid tile assigns hero-photo to that tile\'s sharp photo', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Grille' }).click();

    const firstTile = page.locator('a.home-grid__tile:not(.home-grid__tile--hero)').first();

    await page.evaluate(() => {
      document.querySelector('a.home-grid__tile:not(.home-grid__tile--hero)')?.addEventListener(
        'click',
        (e) => e.preventDefault(),
        { capture: true },
      );
    });

    await firstTile.click();

    const tileImg = firstTile.locator('.home-grid__tile-img--sharp');
    const name = await tileImg.evaluate((el) => (el as HTMLElement).style.viewTransitionName);
    expect(name).toBe('hero-photo');
  });
});

// quick-260726-obg (Task 2): reintroduces quick-260725-dcg's footer-hide
// contract. quick-260726-u97 removed the scroll-to-open gesture entirely
// (and its overscroll pull feedback), which was the ONLY thing that made
// hiding the footer risky in the first place (the vacuous-atBottom()
// concern) — nothing reads scroll position to navigate anymore, so this
// stays a deliberate, risk-free simplification. See README/SUMMARY.
test.describe('footer visibility by display mode (quick-260726-obg)', () => {
  test('FR: the footer is hidden in carousel mode and reappears in grid mode', async ({ page }) => {
    await page.goto('/');

    const footer = page.locator('footer');
    await expect(footer).toBeHidden();

    await page.getByRole('button', { name: 'Grille' }).click();
    await expect(footer).toBeVisible();
  });

  test('EN: the footer is hidden in carousel mode and reappears in grid mode', async ({ page }) => {
    await page.goto('/en/');

    const footer = page.locator('footer');
    await expect(footer).toBeHidden();

    await page.getByRole('button', { name: 'Grid' }).click();
    await expect(footer).toBeVisible();
  });
});

// quick-260725-dcg (Fix 3): the existing per-gallery progress dash (already
// covered above by the positional/navigation tests) gains an
// Instagram-Stories-style accent fill on the CURRENT dash: it grows 0% to
// 100% over the real 6000ms auto-advance cycle via a CSS animation the
// script restarts in lockstep, freezes on pause (hover/focus/explicit
// toggle), respects reduced motion, and relocates/restarts on every manual
// or automatic gallery change.
test.describe('carousel progress fill (quick-260725-dcg)', () => {
  // matrix(a, b, c, d, e, f) — for a pure scaleX(t) transform this is
  // matrix(t, 0, 0, 1, 0, 0), so the fill's progress is the matrix's first
  // component. A dash with no active fill computes 'none', which counts
  // as 0 progress.
  function scaleXFromTransform(transform: string): number {
    if (transform === 'none') return 0;
    const match = transform.match(/^matrix\(([^,]+),/);
    return match ? parseFloat(match[1]) : 0;
  }

  test('the current dash carries a 6s linear fill animation that progresses', async ({ page }) => {
    await page.goto('/');

    const filling = page.locator('.home-hero__progress-dash.is-filling');
    await expect(filling).toHaveCount(1);

    const config = await filling.evaluate((el) => {
      const style = getComputedStyle(el, '::after');
      return { animationName: style.animationName, animationDuration: style.animationDuration };
    });
    expect(config.animationName).toContain('home-progress-fill');
    expect(config.animationDuration).toBe('6s');

    await expect
      .poll(async () => {
        const transform = await filling.evaluate((el) => getComputedStyle(el, '::after').transform);
        return scaleXFromTransform(transform);
      })
      .toBeGreaterThan(0);
  });

  test('the explicit pause toggle freezes the fill and resuming un-freezes it', async ({ page }) => {
    await page.goto('/');

    const filling = page.locator('.home-hero__progress-dash.is-filling');
    const toggle = page.locator('[data-role="autoplay-toggle"]');

    await toggle.click();
    await expect
      .poll(() => filling.evaluate((el) => getComputedStyle(el, '::after').animationPlayState))
      .toBe('paused');

    await toggle.click();
    await expect
      .poll(() => filling.evaluate((el) => getComputedStyle(el, '::after').animationPlayState))
      .toBe('running');
  });

  test('manual navigation relocates and restarts the fill on the newly-current dash', async ({ page }) => {
    await page.goto('/');

    const dashes = page.locator('.home-hero__progress-dash');
    await dashes.nth(2).click();

    await expect(dashes.nth(2)).toHaveClass(/is-filling/);
    const nameOnCurrent = await dashes.nth(2).evaluate((el) => getComputedStyle(el, '::after').animationName);
    expect(nameOnCurrent).toContain('home-progress-fill');

    const nameOnFirst = await dashes.nth(0).evaluate((el) => getComputedStyle(el, '::after').animationName);
    expect(nameOnFirst).toBe('none');
  });

  test('reduced motion shows no animated fill on the current dash', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    const current = page.locator('.home-hero__progress-dash[aria-current="true"]');
    await expect
      .poll(() => current.evaluate((el) => getComputedStyle(el, '::after').display))
      .toBe('none');
  });

  test('EN: the filling dash also carries the fill animation', async ({ page }) => {
    await page.goto('/en/');

    const filling = page.locator('.home-hero__progress-dash.is-filling');
    await expect(filling).toHaveCount(1);
    const name = await filling.evaluate((el) => getComputedStyle(el, '::after').animationName);
    expect(name).toContain('home-progress-fill');
  });
});
