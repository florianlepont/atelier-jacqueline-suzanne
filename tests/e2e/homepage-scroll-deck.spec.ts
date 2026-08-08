import { test, expect, type Page } from '@playwright/test';

// Phase 21 (HOME-14/HOME-15): this spec is the phone-width structural
// replacement for the homepage coverage plan 21-03 retired ahead of this
// plan landing — the mode-toggle-visibility, HOME-06 full-bleed-hero, and
// carousel-intro/grid-intro-clamp phone-width tests removed from
// homepage-mobile-responsive.spec.ts and homepage-content-display.spec.ts,
// both of which point back at this file in their own retirement comments.
// Covers HOME-14 (the carousel/grid toggle is replaced by one continuous
// scroll sequence: one full-screen slide per gallery, in order) and HOME-15
// (the full-screen wordmark-to-photo zoom's structural shape and static
// end-state — no scroll-driven motion is wired until plans 21-05/21-06; this
// plan only builds the markup/CSS the motion will later animate).

const PHONE_VIEWPORT = { width: 393, height: 852 };
const DESKTOP_VIEWPORT = { width: 1280, height: 800 };

interface GalleryDataEntry {
  slug: string;
  href: string;
}

// Mirrors homepage-accent-random.spec.ts's own read of the build-time data
// node so expected slide count/order/hrefs are derived from the page's own
// data rather than hardcoded gallery names/counts Sanity owns.
async function readGalleryData(page: Page): Promise<GalleryDataEntry[]> {
  return page.locator('ul[data-role="home-carousel-data"] li').evaluateAll((lis) =>
    lis.map((li) => ({
      slug: (li as HTMLElement).dataset.slug ?? '',
      href: (li as HTMLElement).dataset.href ?? '',
    })),
  );
}

// Plan 21-10 (21-UAT.md gap 1, pre-zoom intro beats —
// .planning/debug/homepage-scroll-missing-intro-beat.md): this is the ONE
// plan in the gap-closure set that is EXPECTED to modify existing scroll-
// target arithmetic. The two new intro beats occupy real document flow
// before .home-scroll-deck__track, so every scroll target below that is
// meant to land inside the zoom scrub or on a slide now needs this offset
// added — rather than hardcode "two viewport heights" (assumption A4, which
// the developer may revise), this derives the offset from the track's own
// rendered geometry: its live getBoundingClientRect().top plus the current
// scroll position, read at scroll position 0, IS the track's document
// offset. Every caller below invokes this BEFORE any window.scrollTo() in
// the same test, since the measurement is only valid at scroll position 0.
// Asserts the derived offset is greater than 0 so a future change that
// removes the intro beats fails loudly here instead of silently producing
// meaningless scroll targets in the many cases that add this value.
async function getIntroOffset(page: Page): Promise<number> {
  const offset = await page.evaluate(() => {
    const track = document.querySelector<HTMLElement>('[data-role="zoom-track"]');
    if (!track) return 0;
    return track.getBoundingClientRect().top + window.scrollY;
  });
  expect(offset).toBeGreaterThan(0);
  return offset;
}

// Plan 21-07: lifted to module scope (unchanged bodies) from inside the
// 'wordmark-to-photo zoom driver' describe block below, so the new
// per-frame-driver describe block at the end of this file can reuse them
// too, rather than duplicating them.

// The track's own rendered height minus the viewport height IS the live
// reveal distance (mirrors ZOOM_REVEAL_DISTANCE, 900px, but read from the
// page rather than duplicated as a literal here — stays correct if a real-
// device tuning pass ever changes the CSS track height + the exported
// constant together).
async function getRevealDistance(page: Page): Promise<number> {
  const distance = await page.evaluate(() => {
    const track = document.querySelector<HTMLElement>('[data-role="zoom-track"]');
    if (!track) return 0;
    return track.getBoundingClientRect().height - window.innerHeight;
  });
  expect(distance).toBeGreaterThan(0);
  return distance;
}

// The driver applies `scale(...)` as a plain CSS transform (no rotation/
// skew), so the computed matrix's first component IS the scale factor —
// extracting it numerically keeps this robust to the exact string
// representation ('none' at rest vs. 'matrix(...)' once scaled).
function scaleFromComputedTransform(transform: string): number {
  if (transform === 'none') return 1;
  const match = transform.match(/^matrix\(([-0-9.]+),/);
  return match ? parseFloat(match[1]) : NaN;
}

async function getWordmarkScale(page: Page): Promise<number> {
  const transform = await page
    .locator('[data-role="zoom-wordmark"]')
    .evaluate((el) => getComputedStyle(el).transform);
  return scaleFromComputedTransform(transform);
}

async function getWordmarkOpacity(page: Page): Promise<string> {
  return page.locator('[data-role="zoom-wordmark"]').evaluate((el) => getComputedStyle(el).opacity);
}

async function getPhotoOpacity(page: Page): Promise<string> {
  return page.locator('[data-role="zoom-photo"]').evaluate((el) => getComputedStyle(el).opacity);
}

async function getZoomActive(page: Page): Promise<string | null> {
  return page.locator('.home').getAttribute('data-zoom-active');
}

test.describe('mode-toggle and carousel/grid retirement below 767px (success criterion 1)', () => {
  test('at phone width the mode-toggle is not visible, and neither the carousel nor the grid subtree is visible', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    await expect(page.locator('[data-role="mode-toggle"]')).not.toBeVisible();
    await expect(page.locator('[data-role="home-carousel"]')).not.toBeVisible();
    await expect(page.locator('[data-role="home-grid"]')).not.toBeVisible();
  });
});

test.describe('scroll-deck structure (HOME-14, success criterion 2)', () => {
  test('at phone width the deck root is visible', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    await expect(page.locator('[data-role="scroll-deck"]')).toBeVisible();
  });

  test('one slide exists per gallery, in the same order as the build-time gallery data', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const entries = await readGalleryData(page);
    expect(entries.length).toBeGreaterThan(0);

    const slides = page.locator('[data-role="deck-slide"]');
    await expect(slides).toHaveCount(entries.length);

    const hrefs = await slides.evaluateAll((els) => els.map((el) => el.getAttribute('href')));
    for (let i = 0; i < entries.length; i++) {
      expect(hrefs[i]).toBe(entries[i].href);
    }
  });

  test('every slide is a real anchor with a non-empty href pointing at a gallery detail route (D-10)', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const slides = page.locator('[data-role="deck-slide"]');
    const count = await slides.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const slide = slides.nth(i);
      const tagName = await slide.evaluate((el) => el.tagName);
      expect(tagName).toBe('A');
      const href = await slide.getAttribute('href');
      expect(href).toBeTruthy();
      expect(href).toContain('galleries/');
    }
  });

  test('every slide fills the viewport height (within 2px)', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const slides = page.locator('[data-role="deck-slide"]');
    const count = await slides.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const box = await slides.nth(i).boundingBox();
      expect(box).not.toBeNull();
      expect(Math.abs(box!.height - PHONE_VIEWPORT.height)).toBeLessThanOrEqual(2);
    }
  });

  test('no slide repeats the wordmark, and exactly one level-1 heading exists at phone width (D-16)', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    await expect(page.locator('[data-role="deck-slide"] [data-role="zoom-wordmark"]')).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  });

  test('no horizontal overflow at phone width', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const measurements = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(measurements.scrollWidth).toBeLessThanOrEqual(measurements.clientWidth);
  });

  test('the footer is reachable after the last slide (D-08)', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const footerDisplay = await page.locator('footer').evaluate((el) => getComputedStyle(el).display);
    expect(footerDisplay).not.toBe('none');
  });
});

// 21-10 (21-UAT.md gap 1): this block deliberately supersedes
// 21-04-PLAN.md Task 1 case 3's original "before any scrolling" assertion —
// a preceding pre-zoom beat necessarily makes that literally false BY
// DESIGN once the new intro sections exist (see 21-10-PLAN.md's objective
// and .planning/debug/homepage-scroll-missing-intro-beat.md). The wordmark
// still fills the viewport with the SAME coverage thresholds this case has
// always asserted — just once the visitor has scrolled past both intro
// beats to the track's own document offset, rather than at scroll
// position 0. This is the ONE case in this describe block whose assertion
// itself (not just its scroll-target arithmetic) is intentionally rewritten
// by plan 21-10; every other case in this file keeps its original
// assertions, only rebasing the scroll target that reaches them.
test.describe('full-screen wordmark once the pre-zoom intro beats are scrolled past (HOME-15, success criterion 4)', () => {
  test('scrolled to the track\'s own document offset, the zoom wordmark fills most of the phone viewport', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const introOffset = await getIntroOffset(page);
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(introOffset));

    const wordmark = page.locator('[data-role="zoom-wordmark"]');
    await expect(wordmark).toBeVisible();
    await expect
      .poll(async () => {
        const box = await wordmark.boundingBox();
        if (!box) return false;
        return box.width >= PHONE_VIEWPORT.width * 0.6 && box.height >= PHONE_VIEWPORT.height * 0.4;
      })
      .toBe(true);
  });
});

// Plan 21-10 (HOME-15, 21-UAT.md gap 1 —
// .planning/debug/homepage-scroll-missing-intro-beat.md): the two pre-zoom
// intro beats — a centred logomark with a scroll-down cue, then the site's
// intro tagline arriving beneath the same logomark — that this plan adds
// ahead of the wordmark zoom. None of 21-CONTEXT.md's sixteen locked
// decisions specifies this beat; assumptions A1 through A5 in
// 21-10-PLAN.md are the record of the open design questions these cases
// pin down, restated verbatim in 21-10-SUMMARY.md, and put to the
// developer by name in this plan's own real-device human check.
test.describe('pre-zoom intro beats (HOME-15, 21-UAT.md gap 1, assumptions A1-A5)', () => {
  test('beat 1 on first load: full-viewport, logomark and cue visible, wordmark present but off-screen below (A4/A5)', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const beat1 = page.locator('[data-role="deck-intro"][data-intro-beat="1"]');
    const box = await beat1.boundingBox();
    expect(box).not.toBeNull();
    expect(Math.abs(box!.y)).toBeLessThanOrEqual(2);
    expect(Math.abs(box!.height - PHONE_VIEWPORT.height)).toBeLessThanOrEqual(2);

    await expect(beat1.locator('.home-scroll-deck__intro-logo')).toBeVisible();
    await expect(beat1.locator('.home-scroll-deck__intro-cue')).toBeVisible();

    const wordmarkBox = await page.locator('[data-role="zoom-wordmark"]').boundingBox();
    expect(wordmarkBox).not.toBeNull();
    expect(wordmarkBox!.y).toBeGreaterThanOrEqual(PHONE_VIEWPORT.height);
  });

  test('beat 2: after one viewport height of scroll its tagline reveals (opacity 0 -> 1), reading as arriving beneath the logo (D-13)', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const beat2 = page.locator('[data-role="deck-intro"][data-intro-beat="2"]');
    // Task 1 renders beat 2 only when introBody is non-empty, so a blank
    // Sanity intro field must not turn this into a false failure.
    test.skip((await beat2.count()) === 0, 'beat 2 only renders when introBody is non-empty');

    const tagline = beat2.locator('.home-scroll-deck__intro-body');
    await expect.poll(() => tagline.evaluate((el) => getComputedStyle(el).opacity)).toBe('0');

    await page.evaluate((y) => window.scrollTo(0, y), PHONE_VIEWPORT.height);

    const box = await beat2.boundingBox();
    expect(box).not.toBeNull();
    expect(Math.abs(box!.y)).toBeLessThanOrEqual(2);
    await expect.poll(() => tagline.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
  });

  test('both beats render byte-for-byte identical logomark geometry — same width, height and viewport-relative vertical centre (assumption A4)', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const beat2 = page.locator('[data-role="deck-intro"][data-intro-beat="2"]');
    test.skip((await beat2.count()) === 0, 'beat 2 only renders when introBody is non-empty');

    const logo1Box = await page
      .locator('[data-role="deck-intro"][data-intro-beat="1"] .home-scroll-deck__intro-logo')
      .boundingBox();

    // Beat 2 sits one viewport below beat 1 in document flow, so bring it
    // on screen before comparing — both boxes are then viewport-relative
    // and directly comparable, which is what makes the tagline read as
    // arriving beneath a logo that appears to stay exactly where it was.
    await page.evaluate((y) => window.scrollTo(0, y), PHONE_VIEWPORT.height);
    const logo2Box = await beat2.locator('.home-scroll-deck__intro-logo').boundingBox();

    expect(logo1Box).not.toBeNull();
    expect(logo2Box).not.toBeNull();
    expect(Math.abs(logo1Box!.width - logo2Box!.width)).toBeLessThanOrEqual(2);
    expect(Math.abs(logo1Box!.height - logo2Box!.height)).toBeLessThanOrEqual(2);

    const centre1 = logo1Box!.y + logo1Box!.height / 2;
    const centre2 = logo2Box!.y + logo2Box!.height / 2;
    expect(Math.abs(centre1 - centre2)).toBeLessThanOrEqual(2);
  });

  test('the header is hidden through both intro beats, and returns once the zoom fully completes (D-12 extension)', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    await expect(page.locator('[data-role="site-header"]')).not.toBeVisible();

    await page.evaluate((y) => window.scrollTo(0, y), PHONE_VIEWPORT.height);
    await expect(page.locator('[data-role="site-header"]')).not.toBeVisible();

    const introOffset = await getIntroOffset(page);
    const distance = await getRevealDistance(page);
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(introOffset + distance * 1.2));
    await expect(page.locator('[data-role="site-header"]')).toBeVisible();
  });

  test('the intro beats carry no scroll-snap point, unlike a slide (assumption A3, 21-RESEARCH.md Pitfall 6)', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const beat1SnapAlign = await page
      .locator('[data-role="deck-intro"][data-intro-beat="1"]')
      .evaluate((el) => getComputedStyle(el).scrollSnapAlign);
    expect(beat1SnapAlign).toBe('none');

    const slideSnapAlign = await page
      .locator('[data-role="deck-slide"]')
      .first()
      .evaluate((el) => getComputedStyle(el).scrollSnapAlign);
    expect(slideSnapAlign).toBe('start');
  });

  test('the beat-2 tagline renders non-empty copy sourced from Sanity, not hardcoded', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const beat2 = page.locator('[data-role="deck-intro"][data-intro-beat="2"]');
    test.skip((await beat2.count()) === 0, 'beat 2 only renders when introBody is non-empty');

    const text = await beat2.locator('.home-scroll-deck__intro-body').innerText();
    expect(text.trim().length).toBeGreaterThan(0);
  });

  test('reduced motion: both beats render statically, the tagline is already visible, the header stays visible, and no intro-active attribute is written (assumption A1)', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    await expect(page.locator('[data-role="deck-intro"][data-intro-beat="1"]')).toBeVisible();

    const beat2 = page.locator('[data-role="deck-intro"][data-intro-beat="2"]');
    if ((await beat2.count()) > 0) {
      const opacity = await beat2.locator('.home-scroll-deck__intro-body').evaluate((el) => getComputedStyle(el).opacity);
      expect(opacity).toBe('1');
    }

    // Falls out of D-15's established convention rather than being a new
    // rule: no scroll-linked JS attaches at all under reduced motion, so
    // data-intro-active is never written and the header's CSS default
    // (visible) is never overridden.
    await expect(page.locator('[data-role="site-header"]')).toBeVisible();
    const introActive = await page.locator('.home').getAttribute('data-intro-active');
    expect(introActive).toBeNull();
  });

  test('desktop inert: neither intro beat is visible (success criterion 5, UI-02)', async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto('/');

    await expect(page.locator('[data-role="deck-intro"][data-intro-beat="1"]')).not.toBeVisible();

    const beat2 = page.locator('[data-role="deck-intro"][data-intro-beat="2"]');
    if ((await beat2.count()) > 0) {
      await expect(beat2).not.toBeVisible();
    }
  });

  test('structural guards still hold with the intro beats present: exactly one level-1 heading, no horizontal overflow (D-16)', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);

    const measurements = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(measurements.scrollWidth).toBeLessThanOrEqual(measurements.clientWidth);
  });
});

test.describe('description default/reveal state (D-13)', () => {
  test('before any arrival, each slide description has opacity 0 while its title is visible', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const slides = page.locator('[data-role="deck-slide"]');
    const count = await slides.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const slide = slides.nth(i);
      await expect(slide.locator('.home-slide__title')).toBeVisible();
      // Read computed opacity via evaluate rather than asserting visibility —
      // an opacity:0 element is still "visible" to Playwright's own
      // toBeVisible() check, so only a direct getComputedStyle read proves
      // the description starts hidden.
      const opacity = await slide.locator('.home-slide__description').evaluate((el) => getComputedStyle(el).opacity);
      expect(opacity).toBe('0');
    }
  });
});

test.describe('reduced-motion end state (D-15)', () => {
  test('every slide description is permanently visible and scroll-snap is disabled', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const slides = page.locator('[data-role="deck-slide"]');
    const count = await slides.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const opacity = await slides
        .nth(i)
        .locator('.home-slide__description')
        .evaluate((el) => getComputedStyle(el).opacity);
      expect(opacity).toBe('1');
    }

    const snapType = await page.evaluate(() => getComputedStyle(document.documentElement).scrollSnapType);
    expect(snapType).toBe('none');
  });
});

test.describe('desktop/tablet regression guard (success criterion 5, UI-02)', () => {
  test('at 1280x800 the deck is absent and the carousel/toggle render exactly as before', async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto('/');

    await expect(page.locator('[data-role="scroll-deck"]')).not.toBeVisible();
    await expect(page.locator('[data-role="mode-toggle"]')).toBeVisible();
    await expect(page.locator('[data-role="home-carousel"]')).toBeVisible();
  });
});

// Phase 21, plan 21-05 (HOME-15, D-01 through D-04, D-12, D-15): the
// wordmark-to-photo zoom driver wired in HomeCarousel.astro's second
// <script> block. Plan 21-04 above only proved the deck's STATIC shape; this
// describe block proves the SCROLL-DRIVEN behavior plan 21-05 layers on top
// of it — rest state, mid-scrub, completion, reversal, the measured anchor,
// the header hide/fade (D-12), and both inert paths (reduced motion / desktop).
test.describe('wordmark-to-photo zoom driver (HOME-15, D-01 through D-04, D-12, D-15)', () => {
  // WR-01 guard: the track's rendered `data-reveal-distance` attribute is
  // written straight from the exported ZOOM_REVEAL_DISTANCE constant
  // (src/lib/home-carousel.ts), and the CSS track height now consumes that
  // same value via the `--zoom-reveal-distance` custom property it also
  // sets inline — see HomeCarousel.astro's frontmatter and the
  // `.home-scroll-deck__track` rule. This test independently re-derives the
  // expected distance from the constant (via the attribute) and fails if it
  // ever drifts from the track's own live rendered height, which
  // `getRevealDistance()` above alone cannot detect (it only ever reads the
  // DOM, never the constant).
  test('rendered reveal distance matches the exported ZOOM_REVEAL_DISTANCE constant (WR-01)', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const expectedDistance = await page.evaluate(() => {
      const track = document.querySelector<HTMLElement>('[data-role="zoom-track"]');
      return Number(track?.dataset.revealDistance ?? NaN);
    });
    expect(expectedDistance).toBeGreaterThan(0);

    const liveDistance = await getRevealDistance(page);
    expect(Math.abs(liveDistance - expectedDistance)).toBeLessThanOrEqual(1);
  });

  test('rest state before any scrolling (HOME-15)', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const transform = await page.locator('[data-role="zoom-wordmark"]').evaluate((el) => getComputedStyle(el).transform);
    expect(scaleFromComputedTransform(transform)).toBeCloseTo(1, 5);
    await expect.poll(() => getPhotoOpacity(page)).toBe('0');
    // "Zoom in progress" value — the driver sets this at t=0 too (the zoom
    // has not yet reached its completed state), which is what keeps the
    // header hidden from first paint per D-12/D-15's own load-bearing
    // default-visible-until-JS-decides contract.
    await expect.poll(() => getZoomActive(page)).toBe('true');
  });

  test('header hidden during the zoom (D-03/D-12)', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    await expect(page.locator('[data-role="site-header"]')).not.toBeVisible();
  });

  test('mid-scrub scale is strictly between 1 and 8.5 (D-04)', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    // 21-10 (21-UAT.md gap 1): rebased — the intro beats now occupy real
    // document flow before the track, so every scroll target that lands
    // inside the scrub gains getIntroOffset()'s value. distance/2 alone is
    // no longer "mid-scrub"; introOffset + distance/2 is.
    const introOffset = await getIntroOffset(page);
    const distance = await getRevealDistance(page);
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(introOffset + distance / 2));

    await expect.poll(() => getWordmarkScale(page)).toBeGreaterThan(1);
    await expect.poll(() => getWordmarkScale(page)).toBeLessThan(8.5);
  });

  test('completion: wordmark fully faded, photo fully opaque, zoom-active flips to its completed value (HOME-15, success criterion 4)', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    // 21-10: rebased, see the mid-scrub case's comment above.
    const introOffset = await getIntroOffset(page);
    const distance = await getRevealDistance(page);
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(introOffset + distance * 1.2));

    await expect.poll(() => getWordmarkOpacity(page)).toBe('0');
    await expect.poll(() => getPhotoOpacity(page)).toBe('1');
    await expect.poll(() => getZoomActive(page)).toBe('false');
  });

  test('header fades in once the zoom completes (D-12)', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    // 21-10: rebased, see the mid-scrub case's comment above.
    const introOffset = await getIntroOffset(page);
    const distance = await getRevealDistance(page);
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(introOffset + distance * 1.2));

    await expect(page.locator('[data-role="site-header"]')).toBeVisible();
  });

  test('reversibility: scrolling back to the top restores the rest state (D-04)', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    // 21-10: rebased forward target, see the mid-scrub case's comment above
    // — the return-to-0 target below is unchanged, since scrolling to the
    // very top of the document restores both intro beats too.
    const introOffset = await getIntroOffset(page);
    const distance = await getRevealDistance(page);
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(introOffset + distance * 1.2));
    await expect.poll(() => getZoomActive(page)).toBe('false');

    await page.evaluate(() => window.scrollTo(0, 0));

    // Tolerance of 0.05 (per this plan's own instruction) on the scale
    // comparison — the exact frame `expect.poll` samples right after a
    // scroll-to-0 is not perfectly deterministic.
    await expect.poll(() => getWordmarkScale(page)).toBeLessThan(1.05);
    await expect.poll(() => getPhotoOpacity(page)).toBe('0');
    await expect(page.locator('[data-role="site-header"]')).not.toBeVisible();
  });

  test('the zoom anchors on the leading letter, not the block center (HOME-15, Pitfall 4)', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');
    // Pitfall 4: measuring before the real Unbounded font has swapped in
    // produces a wrong anchor — wait for fonts to settle before reading the
    // computed transform-origin, same as the driver's own re-sync guard.
    await page.evaluate(() => document.fonts.ready);

    async function readOrigin() {
      return page.locator('[data-role="zoom-wordmark"]').evaluate((el) => {
        const originX = parseFloat(getComputedStyle(el).transformOrigin.split(' ')[0] ?? '0');
        const width = el.getBoundingClientRect().width;
        return { originX, width };
      });
    }

    // expect.poll rides out the fonts.ready -> syncFocusOrigin() re-measure
    // race rather than assuming it has already landed by the time this test
    // reads the value.
    await expect.poll(async () => (await readOrigin()).originX).toBeGreaterThan(0);
    const { originX, width } = await readOrigin();
    expect(originX).toBeGreaterThan(0);
    expect(originX).toBeLessThan(width / 2);
  });

  test('reduced motion: no transform is written, no zoom-active attribute exists, and the header stays visible (D-15)', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const inlineTransform = await page.locator('[data-role="zoom-wordmark"]').evaluate((el) => (el as HTMLElement).style.transform);
    expect(inlineTransform).toBe('');
    expect(await getZoomActive(page)).toBeNull();
    await expect(page.locator('[data-role="site-header"]')).toBeVisible();

    await page.evaluate(() => window.scrollTo(0, 500));

    const inlineTransformAfterScroll = await page
      .locator('[data-role="zoom-wordmark"]')
      .evaluate((el) => (el as HTMLElement).style.transform);
    expect(inlineTransformAfterScroll).toBe('');
  });

  test('desktop inert: no zoom-active attribute, header visible (success criterion 5)', async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto('/');

    expect(await getZoomActive(page)).toBeNull();
    await expect(page.locator('[data-role="site-header"]')).toBeVisible();
  });
});

// Phase 21, plan 21-06 (HOME-14, D-09, D-10, D-13, D-14, D-15): arrival-
// complete detection wired in HomeCarousel.astro's second <script> block —
// the IntersectionObserver added on top of plans 21-04/21-05's static
// structure and scroll-scrubbed zoom. Proves each gallery's description
// stays hidden until that gallery's slide is fully settled (not merely
// intersecting), then reveals via the existing 180ms transition and hides
// again on reversal; that the live accent tracks the arrived gallery's own
// hero colour without clobbering HOME-16's random starting pick; tap-to-
// open navigation; and both inert paths (reduced motion, desktop). See
// 21-VALIDATION.md's requirement-to-test map for the full row-by-row record
// these cases close out.
test.describe('arrival reveal and accent liveness (HOME-14, D-09, D-10, D-13, D-14, D-15)', () => {
  interface DeckDataEntry {
    heroColor: string;
  }

  async function readDeckDataEntries(page: Page): Promise<DeckDataEntry[]> {
    return page.locator('ul[data-role="home-carousel-data"] li').evaluateAll((lis) =>
      lis.map((li) => ({
        heroColor: (li as HTMLElement).dataset.heroColor ?? '',
      })),
    );
  }

  async function currentAccent(page: Page): Promise<string> {
    return page.evaluate(() =>
      getComputedStyle(document.querySelector('.home') as HTMLElement).getPropertyValue('--current-accent').trim(),
    );
  }

  // Derives scroll targets from rendered geometry rather than hardcoding
  // pixel values (mirrors the zoom-driver describe block's own
  // getRevealDistance above) — the track's own rendered height IS the
  // distance from the track's document offset at which the first slide has
  // fully arrived, and one further viewport height reaches the second.
  // 21-10 (21-UAT.md gap 1): folds in getIntroOffset() directly so every
  // call site below gets the rebased target for free, rather than adding
  // the offset at each of this helper's three call sites individually.
  async function getSlideScrollTargets(page: Page): Promise<{ first: number; second: number }> {
    const introOffset = await getIntroOffset(page);
    const { trackHeight, viewportHeight } = await page.evaluate(() => {
      const track = document.querySelector<HTMLElement>('[data-role="zoom-track"]');
      return {
        trackHeight: track ? track.getBoundingClientRect().height : 0,
        viewportHeight: window.innerHeight,
      };
    });
    expect(trackHeight).toBeGreaterThan(viewportHeight);
    return { first: introOffset + trackHeight, second: introOffset + trackHeight + viewportHeight };
  }

  async function slideOpacities(page: Page): Promise<string[]> {
    return page
      .locator('[data-role="deck-slide"] .home-slide__description')
      .evaluateAll((els) => els.map((el) => getComputedStyle(el).opacity));
  }

  async function slideHeroColor(page: Page, index: number): Promise<string | null> {
    return page.locator('[data-role="deck-slide"]').nth(index).getAttribute('data-hero-color');
  }

  test('before arrival: no slide carries the arrival class, every description is hidden (D-13/D-14, success criterion 3)', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    await expect(page.locator('.home-slide.is-revealed')).toHaveCount(0);
    const opacities = await slideOpacities(page);
    expect(opacities.length).toBeGreaterThan(0);
    opacities.forEach((opacity) => expect(opacity).toBe('0'));
  });

  test('phase-20 accent preserved: the live accent still resolves to a build-time hero colour before any arrival (HOME-16)', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const entries = await readDeckDataEntries(page);
    const palette = new Set(entries.map((e) => e.heroColor));
    const accent = await currentAccent(page);
    expect(palette.has(accent)).toBe(true);
  });

  test('arrival reveals: scrolling to the first slide reveals its description (success criterion 3)', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const { first } = await getSlideScrollTargets(page);
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(first));

    await expect(page.locator('[data-role="deck-slide"]').nth(0)).toHaveClass(/is-revealed/);
    await expect
      .poll(async () =>
        page.locator('[data-role="deck-slide"]').nth(0).locator('.home-slide__description').evaluate((el) => getComputedStyle(el).opacity),
      )
      .toBe('1');
  });

  test('accent tracks the arrived gallery (D-09)', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const { first } = await getSlideScrollTargets(page);
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(first));

    const expectedColor = await slideHeroColor(page, 0);
    expect(expectedColor).toBeTruthy();
    await expect.poll(() => currentAccent(page)).toBe(expectedColor);
  });

  test('second slide: arrival and accent move to the second gallery, the first stops carrying the arrival class (D-05/D-09)', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const entries = await readDeckDataEntries(page);
    test.skip(entries.length < 2, 'needs at least 2 homepage galleries to prove a second arrival');

    const { second } = await getSlideScrollTargets(page);
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(second));

    await expect(page.locator('[data-role="deck-slide"]').nth(1)).toHaveClass(/is-revealed/);
    await expect(page.locator('[data-role="deck-slide"]').nth(0)).not.toHaveClass(/is-revealed/);

    const expectedColor = await slideHeroColor(page, 1);
    expect(expectedColor).toBeTruthy();
    await expect.poll(() => currentAccent(page)).toBe(expectedColor);
  });

  // CR-01 (21-REVIEW.md, gap-closure pass 2): guards against the regression
  // where 21-10's rising-edge guard (`&& target.dataset.heroColor`) silently
  // disabled D-09's accent-liveness AND the 21-08 next-slide warm for any
  // gallery using Sanity's documented "palette automatique" option (no
  // explicit heroColor — normalizeHeroColor() returns undefined, so the
  // deck markup omits data-hero-color entirely). The fix gates on
  // data-index instead, which every real slide anchor carries regardless of
  // whether it opted into a custom colour. Strips data-hero-color from a
  // live slide client-side rather than depending on the current Sanity
  // catalog actually containing a colour-less gallery, so this stays
  // deterministic regardless of live content.
  test('a slide with no heroColor still updates the live accent and still warms the next slide (D-09, 21-UAT.md gap 3, CR-01)', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const entries = await readDeckDataEntries(page);
    test.skip(
      entries.length < 3,
      'needs at least 3 homepage galleries to prove both the accent fallback and the next-slide warm fire for a heroColor-less middle slide',
    );

    const { first, second } = await getSlideScrollTargets(page);

    // Arrive at the first slide normally so the accent starts at a real,
    // truthy hero colour — this is the value CR-01 proved the accent could
    // silently stay frozen at once a later slide's own write was skipped.
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(first));
    const firstColor = await slideHeroColor(page, 0);
    expect(firstColor).toBeTruthy();
    await expect.poll(() => currentAccent(page)).toBe(firstColor);

    // Simulate a "palette automatique" gallery by removing the attribute
    // the deck markup would already omit for one.
    await page.locator('[data-role="deck-slide"]').nth(1).evaluate((el) => el.removeAttribute('data-hero-color'));
    const nextSharp = page.locator('.home-slide__img--sharp').nth(2);
    expect(await nextSharp.getAttribute('loading')).toBe('lazy');

    await page.evaluate((y) => window.scrollTo(0, y), Math.round(second));
    await expect(page.locator('[data-role="deck-slide"]').nth(1)).toHaveClass(/is-revealed/);

    // Pre-fix, the guard skipped this whole block for a heroColor-less
    // slide, so the accent stayed stuck at firstColor and warmNextSlide
    // never fired. Post-fix, the pre-existing `|| 'var(--color-accent)'`
    // fallback (never removed, only ever unreachable) writes the resolved
    // fallback accent, and the warm still fires on every real arrival.
    const fallbackAccent = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim(),
    );
    await expect.poll(() => currentAccent(page)).toBe(fallbackAccent);
    await expect.poll(() => currentAccent(page)).not.toBe(firstColor);
    await expect.poll(() => nextSharp.getAttribute('loading')).not.toBe('lazy');
  });

  test('reversal: scrolling back to the top hides every description again', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const { first } = await getSlideScrollTargets(page);
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(first));
    await expect(page.locator('[data-role="deck-slide"]').nth(0)).toHaveClass(/is-revealed/);

    await page.evaluate(() => window.scrollTo(0, 0));

    await expect(page.locator('.home-slide.is-revealed')).toHaveCount(0);
    await expect
      .poll(async () => {
        const opacities = await slideOpacities(page);
        return opacities.every((opacity) => opacity === '0');
      })
      .toBe(true);
  });

  test('tap-to-open: clicking a slide navigates to that gallery\'s detail page (D-10)', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const slide = page.locator('[data-role="deck-slide"]').first();
    const href = await slide.getAttribute('href');
    expect(href).toBeTruthy();

    await slide.click();
    await page.waitForURL(new RegExp(href!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  });

  test('reduced motion: no arrival class is ever added, every description is permanently visible, and the accent does not change on scroll (D-15)', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    await expect(page.locator('.home-slide.is-revealed')).toHaveCount(0);
    const opacities = await slideOpacities(page);
    expect(opacities.length).toBeGreaterThan(0);
    opacities.forEach((opacity) => expect(opacity).toBe('1'));

    const accentBefore = await currentAccent(page);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    // Proves the observer is genuinely detached under reduced motion, not
    // merely styled away — a still-attached observer would still write a
    // new accent once a slide's intersection ratio crossed the threshold.
    await page.waitForTimeout(200);
    const accentAfter = await currentAccent(page);
    expect(accentAfter).toBe(accentBefore);
    await expect(page.locator('.home-slide.is-revealed')).toHaveCount(0);
  });

  test('desktop inert: no slide carries the arrival class (success criterion 5)', async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto('/');

    await expect(page.locator('.home-slide.is-revealed')).toHaveCount(0);
  });
});

// Phase 21, plan 21-07 (`21-UAT.md` gap 2 — the zoom-to-slide handoff
// glitch, root-caused in
// `.planning/debug/homepage-scroll-zoom-handoff-glitch.md`): these cases
// exist because the emulated Playwright projects (chromium's desktop
// engine behind an emulated phone viewport, and webkit-mobile's desktop
// WebKit build behind an emulated iPhone viewport) structurally cannot
// reproduce real iOS touch-momentum/scroll-snap-settling physics — so
// rather than trying to reproduce the frame-level artifact itself, this
// block verifies the MECHANISM the fix depends on: that every visual
// signal in the handoff is re-derived from live geometry every painted
// frame, and never gated on `scroll` event dispatch or on
// IntersectionObserver callback delivery.
test.describe('per-frame deck driver — scroll-event independence and atomic handoff (21-UAT.md gap 2)', () => {
  // Wraps window.addEventListener before the page's own scripts run, so
  // every 'scroll' registration is silently dropped while every other
  // event type is forwarded to the original. Safe on `/` specifically
  // because HomeCarousel.astro's deck script is the only window scroll
  // listener the homepage registers — DetailHero.astro and
  // AboutPageBody.astro, the site's only other two, render on
  // gallery/about routes and not here — so this suppression cannot mask
  // an unrelated regression. If a future change adds another homepage
  // scroll listener, this comment is the note that cases 1-3 below must
  // be revisited.
  async function suppressScrollListeners(page: Page) {
    await page.addInitScript(() => {
      const originalAddEventListener = window.addEventListener.bind(window);
      window.addEventListener = ((type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => {
        if (type === 'scroll') return;
        return originalAddEventListener(type, listener, options);
      }) as typeof window.addEventListener;
    });
  }

  // Derived from getRevealDistance(page) (never a hardcoded pixel value):
  // the track's own rendered height (revealDistance + viewportHeight) is
  // the scroll offset at which the pinned stage fully releases and the
  // first slide's rect can reach the arrival ratio — the same quantity
  // the 'arrival reveal and accent liveness' describe block above calls
  // getSlideScrollTargets().first. 21-10 (21-UAT.md gap 1): folds in
  // getIntroOffset() directly, same rationale as getSlideScrollTargets()
  // above — every call site (including the atomic-handoff and detach-on-
  // gate-change cases below) gets the rebased target for free.
  async function getArrivalScrollTarget(page: Page): Promise<number> {
    const introOffset = await getIntroOffset(page);
    const distance = await getRevealDistance(page);
    const viewportHeight = await page.evaluate(() => window.innerHeight);
    return introOffset + distance + viewportHeight;
  }

  test('scroll-event independence — mid-scrub: the wordmark scale still updates with every scroll listener suppressed', async ({ page }) => {
    await suppressScrollListeners(page);
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    // 21-10: rebased, see the 'wordmark-to-photo zoom driver' describe
    // block's own mid-scrub case comment above.
    const introOffset = await getIntroOffset(page);
    const distance = await getRevealDistance(page);
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(introOffset + distance / 2));

    // Today's event-driven driver would stay frozen at scale 1 here; the
    // loop-driven one must not.
    await expect.poll(() => getWordmarkScale(page)).toBeGreaterThan(1);
    await expect.poll(() => getWordmarkScale(page)).toBeLessThan(8.5);
  });

  test('scroll-event independence — completion: the crossfade and header-hide flag still resolve with every scroll listener suppressed', async ({ page }) => {
    await suppressScrollListeners(page);
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    // 21-10: rebased, see the mid-scrub case's comment above.
    const introOffset = await getIntroOffset(page);
    const distance = await getRevealDistance(page);
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(introOffset + distance * 1.2));

    await expect.poll(() => getWordmarkOpacity(page)).toBe('0');
    await expect.poll(() => getPhotoOpacity(page)).toBe('1');
    await expect.poll(() => getZoomActive(page)).toBe('false');
  });

  test('scroll-event independence — arrival: the reveal still fires with every scroll listener suppressed, proving it no longer waits on observer callback delivery', async ({ page }) => {
    await suppressScrollListeners(page);
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const arrivalTarget = await getArrivalScrollTarget(page);
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(arrivalTarget));

    await expect(page.locator('[data-role="deck-slide"]').nth(0)).toHaveClass(/is-revealed/);
    await expect
      .poll(() =>
        page
          .locator('[data-role="deck-slide"]')
          .nth(0)
          .locator('.home-slide__description')
          .evaluate((el) => getComputedStyle(el).opacity),
      )
      .toBe('1');
  });

  test('atomic handoff: wordmark opacity, photo opacity, the zoom-active attribute and the first slide\'s arrival class all reach their completed combination together, in one single read', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const arrivalTarget = await getArrivalScrollTarget(page);
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(arrivalTarget));

    // One single page.evaluate reads all four handoff signals together —
    // no intermediate assertion between the reads, so a state where three
    // signals are done and one is stale cannot pass expect.poll's equality
    // check against the whole tuple at once.
    await expect
      .poll(() =>
        page.evaluate(() => {
          const wordmark = document.querySelector<HTMLElement>('[data-role="zoom-wordmark"]');
          const photo = document.querySelector<HTMLElement>('[data-role="zoom-photo"]');
          const home = document.querySelector<HTMLElement>('.home');
          const firstSlide = document.querySelector<HTMLElement>('[data-role="deck-slide"]');
          return {
            wordmarkOpacity: wordmark ? getComputedStyle(wordmark).opacity : null,
            photoOpacity: photo ? getComputedStyle(photo).opacity : null,
            zoomActive: home ? home.getAttribute('data-zoom-active') : null,
            firstSlideRevealed: firstSlide ? firstSlide.classList.contains('is-revealed') : false,
          };
        }),
      )
      .toEqual({ wordmarkOpacity: '0', photoOpacity: '1', zoomActive: 'false', firstSlideRevealed: true });
  });

  test('detach on gate change releases everything: resizing to desktop mid-arrival stops the loop and clears every inline write', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const arrivalTarget = await getArrivalScrollTarget(page);
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(arrivalTarget));
    await expect(page.locator('[data-role="deck-slide"]').nth(0)).toHaveClass(/is-revealed/);

    await page.setViewportSize(DESKTOP_VIEWPORT);

    // setup() runs behind a 100ms resize debounce — poll rather than
    // asserting immediately, proving stopLoop() plus clearInlineStyles()
    // both ran and nothing is left repainting.
    await expect.poll(() => getZoomActive(page)).toBeNull();
    await expect
      .poll(() => page.locator('[data-role="zoom-wordmark"]').evaluate((el) => (el as HTMLElement).style.transform))
      .toBe('');
    await expect.poll(() => page.locator('.home-slide.is-revealed').count()).toBe(0);
  });

  test('reduced motion is still fully inert with the loop mechanism: no inline transform, no zoom-active attribute, no arrival class, and scrolling changes none of it', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const distance = await getRevealDistance(page);
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(distance * 1.2));
    await page.waitForTimeout(200);

    const inlineTransform = await page.locator('[data-role="zoom-wordmark"]').evaluate((el) => (el as HTMLElement).style.transform);
    expect(inlineTransform).toBe('');
    expect(await getZoomActive(page)).toBeNull();
    await expect(page.locator('.home-slide.is-revealed')).toHaveCount(0);
  });
});

// Phase 21, plan 21-08 (HOME-14, blur-placeholder gap — 21-UAT.md's third
// gap, root-caused in
// .planning/debug/homepage-scroll-deck-blur-placeholder-jank.md): deck
// slides never had HOME-09's blur-up placeholder mechanism (already proven
// for .home-hero/.home-grid elsewhere in this suite) or a priority hint for
// the upcoming slide, so a real phone scroll found the second-and-later
// slides' full-resolution photo still arriving over the network with
// nothing masking the wait. This block proves the two-layer stack, the
// eager/priority split, the crossfade, the no-placeholder-means-blank-area
// failure path, and the runtime next-slide warm all landed together.
test.describe('deck-slide progressive loading (HOME-14, HOME-09, 21-UAT.md gap 3)', () => {
  test('every slide renders exactly one placeholder and one sharp image, at genuinely different resolutions', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const slides = page.locator('[data-role="deck-slide"]');
    const count = await slides.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const slide = slides.nth(i);
      await expect(slide.locator('.home-slide__img-placeholder')).toHaveCount(1);
      await expect(slide.locator('.home-slide__img--sharp')).toHaveCount(1);

      const placeholderSrc = await slide.locator('.home-slide__img-placeholder').getAttribute('src');
      const sharpSrc = await slide.locator('.home-slide__img--sharp').getAttribute('src');
      expect(placeholderSrc).toContain('w=24');
      expect(sharpSrc).not.toContain('w=24');
    }
  });

  test('the placeholder image never carries a lazy loading attribute (a 24px placeholder must never be deferred)', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const loadingAttrs = await page
      .locator('.home-slide__img-placeholder')
      .evaluateAll((els) => els.map((el) => el.getAttribute('loading')));
    expect(loadingAttrs.length).toBeGreaterThan(0);
    loadingAttrs.forEach((attr) => expect(attr).toBeNull());
  });

  test('the first slide\'s sharp image is eager with high fetch priority', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const first = page.locator('.home-slide__img--sharp').nth(0);
    expect(await first.getAttribute('loading')).toBe('eager');
    expect(await first.getAttribute('fetchpriority')).toBe('high');
  });

  test('the second slide\'s sharp image is also eager (a real head start during the wordmark-zoom scrub)', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const entries = await readGalleryData(page);
    test.skip(entries.length < 2, 'needs at least 2 homepage galleries to prove the second slide is eager');

    const second = page.locator('.home-slide__img--sharp').nth(1);
    expect(await second.getAttribute('loading')).toBe('eager');
  });

  test('every slide from the third onward stays native-lazy with no fetch-priority hint (T-21-08-A bound)', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const entries = await readGalleryData(page);
    test.skip(entries.length < 3, 'needs at least 3 homepage galleries to prove a lazy slide exists');

    const laterAttrs = await page.locator('.home-slide__img--sharp').evaluateAll((els) =>
      els.slice(2).map((el) => ({ loading: el.getAttribute('loading'), fetchpriority: el.getAttribute('fetchpriority') })),
    );
    expect(laterAttrs.length).toBeGreaterThan(0);
    laterAttrs.forEach(({ loading, fetchpriority }) => {
      expect(loading).toBe('lazy');
      expect(fetchpriority).toBeNull();
    });
  });

  test('the first slide\'s crossfade reaches its loaded state, with the placeholder still present underneath', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const firstSlide = page.locator('[data-role="deck-slide"]').nth(0);
    const sharp = firstSlide.locator('.home-slide__img--sharp');

    // getComputedStyle, not toBeVisible() — an opacity:0 image still reads
    // as "visible" to Playwright, so only a direct opacity read proves the
    // crossfade has actually resolved (mirrors this file's own D-13
    // describe block above).
    await expect.poll(() => sharp.evaluate((el) => el.classList.contains('is-loaded'))).toBe(true);
    await expect.poll(() => sharp.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
    await expect(firstSlide.locator('.home-slide__img-placeholder')).toHaveCount(1);
  });

  test('when every sharp rendition fails outright, the first slide still shows its placeholder rather than a blank area', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    // Mirrors critical.smoke.spec.ts's own abort predicate exactly (w=24
    // allowed through, every other rendition aborted) so the two tests stay
    // consistent with each other.
    await page.route(/cdn\.sanity\.io\/images\//, (route) => {
      const url = new URL(route.request().url());
      return url.searchParams.get('w') !== '24' ? route.abort('failed') : route.continue();
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.waitForFunction(() => {
      const placeholder = document.querySelector<HTMLImageElement>('.home-slide__img-placeholder');
      return Boolean(placeholder?.complete && placeholder.naturalWidth > 0);
    });

    const firstSlide = page.locator('[data-role="deck-slide"]').nth(0);
    const naturalWidth = await firstSlide
      .locator('.home-slide__img-placeholder')
      .evaluate((el) => (el as HTMLImageElement).naturalWidth);
    expect(naturalWidth).toBeGreaterThan(0);

    const box = await firstSlide.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);
  });

  test('arriving at a slide promotes the NEXT slide\'s sharp image out of native-lazy (the runtime warm, D-14 rising edge)', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    // A same-origin, near-instant preview server makes Chromium's own
    // native-lazy heuristic aggressive enough to start fetching (and, if
    // aborted, immediately error) a "lazy" slide's photo well before any
    // scroll — which would flip is-loaded true first and make
    // warmNextSlide's own is-loaded guard bail before it ever touches the
    // `loading` attribute this test asserts on (confirmed by hand: even the
    // LAST slide's image, several screens below the fold, already reports
    // is-loaded on an aborted route before any scroll happens here). Route
    // interception that never resolves — neither `continue()` nor
    // `abort()` — leaves every non-24px request permanently pending
    // instead: `load`/`error` can never fire, so `is-loaded` can never
    // become true, and the ONLY way `loading` can flip away from 'lazy' is
    // this component's own JS explicitly setting it. That isolates the
    // attribute-mutation logic under test from the load/error race
    // entirely, rather than trying to out-time it.
    await page.route(/cdn\.sanity\.io\/images\//, (route) => {
      const url = new URL(route.request().url());
      if (url.searchParams.get('w') === '24') return route.continue();
      // Deliberately unresolved: no continue(), abort(), or fulfill().
    });

    // domcontentloaded, not the default 'load' — with eager images (index
    // 0/1) now permanently pending above, waiting for the 'load' event
    // would hang for the test's own default timeout, since a pending
    // subresource blocks it (mirrors the failure-path case above, which
    // hits the same constraint for the same reason).
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const entries = await readGalleryData(page);
    test.skip(entries.length < 2, 'needs at least 2 homepage galleries to prove any arrival-triggered warm');

    const sharpImgs = page.locator('.home-slide__img--sharp');

    if (entries.length < 3) {
      // Only 2 galleries exist: slides 0 and 1 are BOTH already eager from
      // markup (the index <= 1 split above), so the runtime warm has
      // nothing left to promote — warmNextSlide(0) would target slides[1],
      // already eager, and warmNextSlide(1) targets slides[2], which does
      // not exist here. Assert the markup-level baseline instead of a
      // runtime transition that cannot occur at this gallery count.
      expect(await sharpImgs.nth(1).getAttribute('loading')).toBe('eager');
      return;
    }

    // With 3+ galleries, the third slide's sharp image starts native-lazy
    // (asserted above too) — the only way to observe it promoted is the
    // runtime warm firing once the SECOND slide reaches arrival
    // (warmNextSlide(1) targets slides[2]). Arriving at the first slide
    // instead would only warm the second slide, already eager from markup,
    // proving nothing new.
    expect(await sharpImgs.nth(2).getAttribute('loading')).toBe('lazy');

    // Derived from getRevealDistance(page) plus the live viewport height,
    // never a hardcoded pixel value: the track's own rendered height is the
    // scroll offset at which the first slide reaches arrival, and one
    // further viewport height reaches the second (mirrors this file's own
    // getSlideScrollTargets()/getArrivalScrollTarget() helpers above). 21-10
    // (21-UAT.md gap 1): rebased with getIntroOffset(), same rationale as
    // every other scroll target in this file that lands inside the scrub or
    // on a slide.
    const introOffset = await getIntroOffset(page);
    const distance = await getRevealDistance(page);
    const viewportHeight = await page.evaluate(() => window.innerHeight);
    const secondSlideArrivalTarget = introOffset + distance + 2 * viewportHeight;
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(secondSlideArrivalTarget));

    await expect(page.locator('[data-role="deck-slide"]').nth(1)).toHaveClass(/is-revealed/);
    await expect.poll(() => sharpImgs.nth(2).getAttribute('loading')).not.toBe('lazy');
  });

  test('reduced motion: every slide still gets both layers, and the first slide\'s crossfade still reaches its loaded state (D-15)', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const slides = page.locator('[data-role="deck-slide"]');
    const count = await slides.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const slide = slides.nth(i);
      await expect(slide.locator('.home-slide__img-placeholder')).toHaveCount(1);
      await expect(slide.locator('.home-slide__img--sharp')).toHaveCount(1);
    }

    const firstSharp = slides.nth(0).locator('.home-slide__img--sharp');
    await expect.poll(() => firstSharp.evaluate((el) => el.classList.contains('is-loaded'))).toBe(true);
  });

  test('desktop: the deck is absent and the grid tiles\' own HOME-09 placeholder/sharp pair is untouched (success criterion 5)', async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto('/');

    await expect(page.locator('[data-role="scroll-deck"]')).not.toBeVisible();

    const entries = await readGalleryData(page);
    await expect(page.locator('.home-grid__tile-img-placeholder')).toHaveCount(entries.length);
  });
});

// HOME-14, HOME-15, 21-UAT.md gap 4 (status-bar white bar) —
// .planning/debug/homepage-scroll-ios-status-bar-white-gap.md. The actual
// iOS toolbar-collapse/expand artifact is real-device-only: neither
// Playwright project can reproduce it (chromium has no Mobile Safari
// toolbar to animate, and webkit-mobile is documented elsewhere in this
// phase's own plans as desktop WebKit with an emulated viewport, not real
// Mobile Safari). These cases lock in the STRUCTURAL preconditions of the
// fix instead — one constant sizing unit (svh, not dvh), the preserved
// track/stage algebra, a non-white paint floor scoped to photo surfaces
// only, and a correctly phone-scoped theme-color meta tag — while the
// visual confirmation that the white bar itself is gone is carried to plan
// 21-10's real-device human check.
test.describe('deck viewport-height convention and phone theme colour (HOME-14, HOME-15, 21-UAT.md gap 4)', () => {
  test('deck sections resolve to the visible viewport height (regression net, not an iOS repro — svh/dvh coincide in a fixed-viewport test engine)', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const viewportHeight = await page.evaluate(() => window.innerHeight);

    const stageBox = await page.locator('[data-role="zoom-stage"]').boundingBox();
    expect(stageBox).not.toBeNull();
    expect(Math.abs(stageBox!.height - viewportHeight)).toBeLessThanOrEqual(2);

    const slides = page.locator('[data-role="deck-slide"]');
    const count = await slides.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const box = await slides.nth(i).boundingBox();
      expect(box).not.toBeNull();
      expect(Math.abs(box!.height - viewportHeight)).toBeLessThanOrEqual(2);
    }
  });

  test('track/stage delta is exactly the reveal distance (sticky-release algebra, independent of the existing WR-01 innerHeight comparison)', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const measurements = await page.evaluate(() => {
      const track = document.querySelector<HTMLElement>('[data-role="zoom-track"]');
      const stage = document.querySelector<HTMLElement>('[data-role="zoom-stage"]');
      return {
        trackHeight: track?.getBoundingClientRect().height ?? 0,
        stageHeight: stage?.getBoundingClientRect().height ?? 0,
        revealDistance: Number(track?.getAttribute('data-reveal-distance') ?? 0),
      };
    });

    expect(measurements.revealDistance).toBeGreaterThan(0);
    expect(Math.abs(measurements.trackHeight - measurements.stageHeight - measurements.revealDistance)).toBeLessThanOrEqual(1);
  });

  test('no photo surface can paint white: every slide and the zoom photo layer carry a non-white background-color', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const slideBackgrounds = await page.locator('[data-role="deck-slide"]').evaluateAll((els) =>
      els.map((el) => getComputedStyle(el).backgroundColor),
    );
    expect(slideBackgrounds.length).toBeGreaterThan(0);
    for (const bg of slideBackgrounds) {
      expect(bg).not.toBe('transparent');
      expect(bg).not.toBe('rgba(0, 0, 0, 0)');
      expect(bg).not.toBe('rgb(255, 255, 255)');
    }

    const photoBackground = await page.locator('[data-role="zoom-photo"]').evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(photoBackground).not.toBe('transparent');
    expect(photoBackground).not.toBe('rgba(0, 0, 0, 0)');
    expect(photoBackground).not.toBe('rgb(255, 255, 255)');
  });

  test('the wordmark screen is deliberately unchanged: the pinned stage stays transparent, proving the paint floor was scoped to photo surfaces only', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const stageBackground = await page.locator('[data-role="zoom-stage"]').evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(['transparent', 'rgba(0, 0, 0, 0)']).toContain(stageBackground);
  });

  test('theme colour is present and phone-scoped', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const meta = page.locator('meta[name="theme-color"]');
    await expect(meta).toHaveCount(1);
    const content = await meta.getAttribute('content');
    expect(content).toBeTruthy();
    const media = await meta.getAttribute('media');
    expect(media).toContain('767px');
  });

  test('theme colour is homepage-only: the About page emits no theme-color meta at all', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/about/');

    await expect(page.locator('meta[name="theme-color"]')).toHaveCount(0);
  });

  test('desktop unaffected: the deck root is still not visible and the homepage still renders its carousel', async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto('/');

    await expect(page.locator('[data-role="scroll-deck"]')).not.toBeVisible();
    await expect(page.locator('[data-role="home-carousel"]')).toBeVisible();
  });
});
