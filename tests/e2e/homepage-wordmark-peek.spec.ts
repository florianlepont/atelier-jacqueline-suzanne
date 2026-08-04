import { test, expect, devices } from '@playwright/test';

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

  test.describe('touchscreen tablet (>=768px)', () => {
    // Phase 21 retires the carousel below 767px (21-RESEARCH.md Pitfall 1),
    // so a phone-width descriptor here would leave these assertions
    // exercising a `display: none` subtree. The tablet descriptor below is
    // 810x1080 — comfortably at/above the 768px breakpoint, still
    // `hasTouch`/`isMobile` — so the coarse-pointer path this describe
    // exists to cover (hover-cursor inertness on touch) stays meaningful
    // per phase success criterion 5.
    const { defaultBrowserType: _defaultBrowserType, ...ipadGen7 } = devices['iPad (gen 7)'];
    test.use({ ...ipadGen7 });

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

test.describe('carousel wordmark mirrored-peek commit (quick-260727-iao)', () => {
  async function photoBox(page: import('@playwright/test').Page) {
    const box = await page.locator('.home-hero__photo').boundingBox();
    if (!box) throw new Error('.home-hero__photo has no bounding box');
    return box;
  }

  // Samples --wm-seam/data-peek-zone/has-wordmark-photo on every animation
  // frame from inside the page for ~400ms (comfortably inside the ~420-480ms
  // slide, before commitEdge()'s fallback timer fires finish()) — an in-page
  // rAF loop avoids the timing noise of round-tripping waitForTimeout calls
  // over the CDP connection.
  async function sampleSeamDuringSlide(page: import('@playwright/test').Page) {
    return page.evaluate(() => {
      const stack = document.querySelector('.home-hero__wordmark-stack');
      const home = document.querySelector('.home');
      if (!stack || !home) return [];
      const start = performance.now();
      const out: Array<{ t: number; seam: number; zone: string | null; hasWordmarkPhoto: boolean }> = [];
      return new Promise<typeof out>((resolve) => {
        function tick() {
          out.push({
            t: performance.now() - start,
            seam: parseFloat(getComputedStyle(stack as Element).getPropertyValue('--wm-seam')),
            zone: (stack as Element).getAttribute('data-peek-zone'),
            hasWordmarkPhoto: home!.classList.contains('has-wordmark-photo'),
          });
          if (performance.now() - start < 400) {
            requestAnimationFrame(tick);
          } else {
            resolve(out);
          }
        }
        requestAnimationFrame(tick);
      });
    });
  }

  test('FR: right-edge commit — seam slides continuously to the incoming extreme, has-wordmark-photo never drops', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-role="autoplay-toggle"]').click();
    await expect(page.locator('.home')).toHaveClass(/has-wordmark-photo/);

    const indexLabel = page.locator('[data-role="index-label"]');
    const initialIndex = await indexLabel.innerText();

    const box = await photoBox(page);
    await page.mouse.move(box.x + box.width * 0.97, box.y + box.height * 0.3, { steps: 10 });
    await page.mouse.down();
    await page.mouse.up();

    const samples = await sampleSeamDuringSlide(page);
    expect(samples.length).toBeGreaterThan(0);
    // The split moves continuously (not frozen): the seam is observed at a
    // genuine intermediate value at least once...
    expect(samples.some((s) => s.seam > 0 && s.seam < 1)).toBe(true);
    // ...and trends toward the incoming (peekNext) extreme, 0.
    expect(samples[samples.length - 1].seam).toBeLessThanOrEqual(samples[0].seam);
    // Right-edge commit stays in the right zone throughout.
    expect(samples.every((s) => s.zone === 'right')).toBe(true);
    // No solid-ink beat anywhere in the sampled window.
    expect(samples.every((s) => s.hasWordmarkPhoto)).toBe(true);

    // The commit settles and re-reveals on the NEW slide, realigned.
    await expect(indexLabel).not.toHaveText(initialIndex);
    await expect(page.locator('.home')).toHaveClass(/has-wordmark-photo/);
    const stack = page.locator('.home-hero__wordmark-stack');
    await expect.poll(() => stack.evaluate((el) => getComputedStyle(el).getPropertyValue('--wm-seam').trim())).toBe('1');
    const wordmark = page.locator('.home-hero__wordmark');
    const settledPosition = await wordmark.evaluate((el) => getComputedStyle(el).getPropertyValue('--wordmark-bg-position').trim());
    expect(settledPosition).toMatch(/^-?\d+(\.\d+)?px -?\d+(\.\d+)?px$/);
  });

  test('EN: right-edge commit — seam slides continuously to the incoming extreme, has-wordmark-photo never drops', async ({ page }) => {
    await page.goto('/en/');
    await page.locator('[data-role="autoplay-toggle"]').click();
    await expect(page.locator('.home')).toHaveClass(/has-wordmark-photo/);

    const indexLabel = page.locator('[data-role="index-label"]');
    const initialIndex = await indexLabel.innerText();

    const box = await photoBox(page);
    await page.mouse.move(box.x + box.width * 0.97, box.y + box.height * 0.3, { steps: 10 });
    await page.mouse.down();
    await page.mouse.up();

    const samples = await sampleSeamDuringSlide(page);
    expect(samples.length).toBeGreaterThan(0);
    expect(samples.some((s) => s.seam > 0 && s.seam < 1)).toBe(true);
    expect(samples[samples.length - 1].seam).toBeLessThanOrEqual(samples[0].seam);
    expect(samples.every((s) => s.zone === 'right')).toBe(true);
    expect(samples.every((s) => s.hasWordmarkPhoto)).toBe(true);

    await expect(indexLabel).not.toHaveText(initialIndex);
    await expect(page.locator('.home')).toHaveClass(/has-wordmark-photo/);
    const stack = page.locator('.home-hero__wordmark-stack');
    await expect.poll(() => stack.evaluate((el) => getComputedStyle(el).getPropertyValue('--wm-seam').trim())).toBe('1');
    const wordmark = page.locator('.home-hero__wordmark');
    const settledPosition = await wordmark.evaluate((el) => getComputedStyle(el).getPropertyValue('--wordmark-bg-position').trim());
    expect(settledPosition).toMatch(/^-?\d+(\.\d+)?px -?\d+(\.\d+)?px$/);
  });

  // Mirror case: a LEFT-edge commit trends the seam toward 1 (the
  // peekPrev-covers-all extreme) instead of 0 — one locale is sufficient to
  // prove the mechanism is symmetric (the pure computeWordmarkSeamFraction
  // unit tests already cover both zones' math exhaustively).
  test('FR: left-edge commit — seam slides continuously toward the peekPrev extreme', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-role="autoplay-toggle"]').click();
    await expect(page.locator('.home')).toHaveClass(/has-wordmark-photo/);

    const indexLabel = page.locator('[data-role="index-label"]');
    const initialIndex = await indexLabel.innerText();

    const box = await photoBox(page);
    await page.mouse.move(box.x + box.width * 0.03, box.y + box.height * 0.3, { steps: 10 });
    await page.mouse.down();
    await page.mouse.up();

    const samples = await sampleSeamDuringSlide(page);
    expect(samples.length).toBeGreaterThan(0);
    expect(samples.some((s) => s.seam > 0 && s.seam < 1)).toBe(true);
    // Left-edge commit trends toward 1 (opposite direction from right).
    expect(samples[samples.length - 1].seam).toBeGreaterThanOrEqual(samples[0].seam);
    expect(samples.every((s) => s.zone === 'left')).toBe(true);
    expect(samples.every((s) => s.hasWordmarkPhoto)).toBe(true);

    await expect(indexLabel).not.toHaveText(initialIndex);
    await expect(page.locator('.home')).toHaveClass(/has-wordmark-photo/);
    // Left-zone rest is the OPPOSITE extreme from right-zone rest: at
    // neutral (heroImg back at its full-viewport rect), heroLeft sits at
    // the screen's left edge, well left of the wordmark box, so the seam
    // clamps to 0 (current covers all) — not 1, which is the right-zone
    // resting extreme asserted above.
    const stack = page.locator('.home-hero__wordmark-stack');
    await expect.poll(() => stack.evaluate((el) => getComputedStyle(el).getPropertyValue('--wm-seam').trim())).toBe('0');
  });
});

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

  // quick-260727-iao: proves the MIRRORED-PEEK side of the mechanism — as
  // proximity to an edge increases, the peek-side wordmark layer's revealed
  // portion grows (the seam fraction moves off its current-covers-all
  // extreme) while the current layer's portion shrinks correspondingly, and
  // the inactive peek layer never reveals anything.
  //
  // Reads the clip-path a layer actually computes to (not just the --wm-seam
  // custom property) to prove the CSS clip rules themselves are wired
  // correctly, not just the JS that feeds them — parses the browser's
  // computed inset() (Chromium can serialize an equally-valid, zero-area
  // inset() several ways depending on which side accumulated the 100%, so
  // this converts to an effective visible-width fraction rather than
  // matching one exact string).
  async function peekVisibleFraction(page: import('@playwright/test').Page, selector: string): Promise<number> {
    return page.locator(selector).evaluate((el) => {
      const clip = getComputedStyle(el).clipPath;
      const match = clip.match(/inset\(([^)]+)\)/);
      if (!match) return 1;
      const parts = match[1].trim().split(/\s+/);
      const rect = el.getBoundingClientRect();
      const toFraction = (value: string, axisSize: number) =>
        value.endsWith('%') ? parseFloat(value) / 100 : parseFloat(value) / axisSize;
      // inset(top right bottom left)
      const leftFrac = toFraction(parts[3], rect.width);
      const rightFrac = toFraction(parts[1], rect.width);
      return Math.max(0, 1 - leftFrac - rightFrac);
    });
  }

  test('FR: peek-side wordmark layer grows with right-edge proximity, inactive peek stays clipped', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-role="autoplay-toggle"]').click();
    await expect(page.locator('.home')).toHaveClass(/has-wordmark-photo/);

    const stack = page.locator('.home-hero__wordmark-stack');
    const box = await photoBox(page);

    await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.3, { steps: 10 });
    await page.waitForTimeout(200);
    const s1 = await stack.evaluate((el) => parseFloat(getComputedStyle(el).getPropertyValue('--wm-seam')));
    expect(await stack.getAttribute('data-peek-zone')).toBe('right');
    expect(s1).toBeLessThan(1);

    await page.mouse.move(box.x + box.width * 0.99, box.y + box.height * 0.3, { steps: 10 });
    await expect.poll(() => stack.evaluate((el) => parseFloat(getComputedStyle(el).getPropertyValue('--wm-seam')))).toBeLessThan(s1);

    // The active peek (next) reveals a growing portion; the inactive peek
    // (prev) stays fully clipped throughout the right-zone push.
    expect(await peekVisibleFraction(page, '.home-hero__wordmark-peek--next')).toBeGreaterThan(0);
    expect(await peekVisibleFraction(page, '.home-hero__wordmark-peek--prev')).toBeLessThan(0.01);
  });

  test('EN: peek-side wordmark layer grows with right-edge proximity, inactive peek stays clipped', async ({ page }) => {
    await page.goto('/en/');
    await page.locator('[data-role="autoplay-toggle"]').click();
    await expect(page.locator('.home')).toHaveClass(/has-wordmark-photo/);

    const stack = page.locator('.home-hero__wordmark-stack');
    const box = await photoBox(page);

    await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.3, { steps: 10 });
    await page.waitForTimeout(200);
    const s1 = await stack.evaluate((el) => parseFloat(getComputedStyle(el).getPropertyValue('--wm-seam')));
    expect(await stack.getAttribute('data-peek-zone')).toBe('right');
    expect(s1).toBeLessThan(1);

    await page.mouse.move(box.x + box.width * 0.99, box.y + box.height * 0.3, { steps: 10 });
    await expect.poll(() => stack.evaluate((el) => parseFloat(getComputedStyle(el).getPropertyValue('--wm-seam')))).toBeLessThan(s1);

    expect(await peekVisibleFraction(page, '.home-hero__wordmark-peek--next')).toBeGreaterThan(0);
    expect(await peekVisibleFraction(page, '.home-hero__wordmark-peek--prev')).toBeLessThan(0.01);
  });

  // Mirror case: LEFT-edge proximity — NOT a growth assertion. Live
  // verification (real Sanity content, real browser) found this panel's
  // actual desktop geometry makes the left zone genuinely asymmetric with
  // the right zone: .home-hero__accent is RIGHT-anchored (`right:
  // var(--space-md); width: min(700px, 52%)`), so its left edge sits well
  // right of center (e.g. ~600px in from the left on a 1280px-wide
  // viewport). The hover-peek's max push is capped at PEEK_MAX_PUSH_FRACTION
  // (16% of the photo's own width, ~205px on that same viewport) —
  // heroImg's LEFT edge, even at maximum hover proximity, never travels far
  // enough right to reach the panel's own left edge. This is the CORRECT
  // consequence of the plan's own geometric model (the seam is wherever
  // heroImg's live edge crosses the wordmark box's screen rect): the real
  // photo's own peekPrev layer is equally confined to a narrow strip near
  // the screen's left edge during a mere hover push (proven separately by
  // the "carousel edge-peek preview" tests below), nowhere near the panel —
  // so a 1:1 match with the photo's own motion means the wordmark correctly
  // shows NOTHING new during a left-zone hover; only a full LEFT COMMIT
  // (100% slide, already covered above) sweeps far enough to reach it. This
  // guards against a regression where the seam erroneously moves off its
  // resting extreme before the photo's real edge has actually arrived.
  test('FR: left-edge hover-peek proximity correctly does NOT move the seam (panel is out of the hover-push reach; only a full commit reaches it)', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-role="autoplay-toggle"]').click();
    await expect(page.locator('.home')).toHaveClass(/has-wordmark-photo/);

    const stack = page.locator('.home-hero__wordmark-stack');
    const box = await photoBox(page);

    await page.mouse.move(box.x + box.width * 0.1, box.y + box.height * 0.3, { steps: 10 });
    await page.waitForTimeout(200);
    expect(await stack.getAttribute('data-peek-zone')).toBe('left');
    expect(await stack.evaluate((el) => getComputedStyle(el).getPropertyValue('--wm-seam').trim())).toBe('0');

    await page.mouse.move(box.x + box.width * 0.01, box.y + box.height * 0.3, { steps: 10 });
    await page.waitForTimeout(200);
    expect(await stack.evaluate((el) => getComputedStyle(el).getPropertyValue('--wm-seam').trim())).toBe('0');

    // Both peeks stay clipped (current shows in full) — the resting state
    // is correctly held, not erroneously disturbed by the hover push.
    expect(await peekVisibleFraction(page, '.home-hero__wordmark-peek--prev')).toBeLessThan(0.01);
    expect(await peekVisibleFraction(page, '.home-hero__wordmark-peek--next')).toBeLessThan(0.01);
  });
});

test.describe('carousel wordmark current layer does not freeze during an edge approach (quick-260727-kq8)', () => {
  async function photoBox(page: import('@playwright/test').Page) {
    const box = await page.locator('.home-hero__photo').boundingBox();
    if (!box) throw new Error('.home-hero__photo has no bounding box');
    return box;
  }

  // Right-zone hover-fraction mapping mirrors computeHoverZone()'s own
  // inverse: xFraction = (1 - EDGE_ZONE_FRACTION) + EDGE_ZONE_FRACTION * proximity.
  // EDGE_ZONE_FRACTION (0.22) is grepped verbatim from HomeCarousel.astro.
  const EDGE_ZONE_FRACTION = 0.22;
  const PROXIMITY_SEQUENCE = [0.8, 0.85, 0.9, 0.93, 0.95, 0.97, 0.985, 0.995];

  // Keeps the y fraction fixed (0.3) so only x varies across the sequence —
  // full-string comparison of --wordmark-bg-position is therefore a valid
  // proxy for "did the x component actually keep tracking the photo".
  async function collectSamples(page: import('@playwright/test').Page): Promise<string[]> {
    const box = await photoBox(page);
    const wordmark = page.locator('.home-hero__wordmark');
    const samples: string[] = [];
    for (const proximity of PROXIMITY_SEQUENCE) {
      const xFraction = 1 - EDGE_ZONE_FRACTION + EDGE_ZONE_FRACTION * proximity;
      await page.mouse.move(box.x + box.width * xFraction, box.y + box.height * 0.3, { steps: 10 });
      await page.waitForTimeout(200);
      const position = await wordmark.evaluate((el) => getComputedStyle(el).getPropertyValue('--wordmark-bg-position').trim());
      samples.push(position);
    }
    return samples;
  }

  test('FR: current-layer bg-position keeps changing across proximity 0.80-0.995, never freezes', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-role="autoplay-toggle"]').click();
    await expect(page.locator('.home')).toHaveClass(/has-wordmark-photo/);

    const samples = await collectSamples(page);
    // Pre-fix (clamped) code freezes at a fixed value from proximity 0.85
    // onward — this tail must NOT collapse to a single repeated value.
    const tail = samples.slice(1);
    const distinct = new Set(tail);
    expect(distinct.size).toBeGreaterThanOrEqual(3);
  });

  test('EN: current-layer bg-position keeps changing across proximity 0.80-0.995, never freezes', async ({ page }) => {
    await page.goto('/en/');
    await page.locator('[data-role="autoplay-toggle"]').click();
    await expect(page.locator('.home')).toHaveClass(/has-wordmark-photo/);

    const samples = await collectSamples(page);
    const tail = samples.slice(1);
    const distinct = new Set(tail);
    expect(distinct.size).toBeGreaterThanOrEqual(3);
  });
});

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

  test.describe('touchscreen tablet (>=768px)', () => {
    // Phase 21 retires the carousel below 767px (21-RESEARCH.md Pitfall 1),
    // so a phone-width descriptor here would leave these assertions
    // exercising a `display: none` subtree. The tablet descriptor below is
    // 810x1080 — comfortably at/above the 768px breakpoint, still
    // `hasTouch`/`isMobile` — so the carousel's own tap/swipe handling
    // stays meaningful (and testable) per phase success criterion 5.
    const { defaultBrowserType: _defaultBrowserType, ...ipadGen7 } = devices['iPad (gen 7)'];
    test.use({ ...ipadGen7 });

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

test.describe('grid hero wordmark, desktop (HOME-03, D-05)', () => {
  test('the grid hero wordmark stays solid, non-transparent text on desktop', async ({ page }) => {
    // Phase 21 retires the mobile grid hero tile's photo-cutout wordmark
    // below 767px — the grid itself no longer renders there — so only this
    // desktop no-cutout guard (D-05) remains meaningful. This test
    // previously also asserted a 393px mobile cutout half; that half is
    // removed here rather than left to assert against retired behavior.
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
