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

// Plan 21-14 (21-UAT.md round-2 gap 1, pinned intro rebase): the intro
// track's own live scrub distance — its rendered height minus the viewport
// height IS the distance the pinned intro scrubs over, the intro's own
// analogue of getRevealDistance() above. Asserts a positive value before
// returning, same discipline as getIntroOffset()/getRevealDistance(), so a
// future change that collapses the intro's own scrub geometry fails loudly
// here instead of silently producing meaningless scroll targets in every
// case below that depends on it.
async function getIntroScrubDistance(page: Page): Promise<number> {
  const distance = await page.evaluate(() => {
    const track = document.querySelector<HTMLElement>('[data-role="intro-track"]');
    if (!track) return 0;
    return track.getBoundingClientRect().height - window.innerHeight;
  });
  expect(distance).toBeGreaterThan(0);
  return distance;
}

// Converts a 0..1 progress fraction (the same domain computeIntroProgress()
// operates in) into an absolute document scroll offset for the intro's own
// scrub. The intro track starts at document offset 0 (asserted by this
// file's own geometry case below), so the target is simply the scrub
// distance times the fraction — expressing every case's target this way,
// rather than repeating "distance * fraction" arithmetic at each call site,
// is what keeps every case correct if the curve's own distance is ever
// retuned (assumption A6).
async function introScrubTarget(page: Page, fraction: number): Promise<number> {
  const distance = await getIntroScrubDistance(page);
  return Math.round(distance * fraction);
}

// Plan 21-12 (21-UAT.md round-2 gap 3 —
// .planning/debug/homepage-scroll-cover-photo-doubled.md): each deck slide's
// OWN live document offset — its bounding-rect top plus the current scroll
// position — read at scroll position 0. Slide targets must be read from the
// slides themselves, never computed from the track, because after this
// plan's CSS the track's height and the slides' position are no longer in
// the fixed relationship the old track-height arithmetic assumed (the
// slides wrapper is pulled up by one deck viewport height while the motion
// driver is attached, so the track's own height alone can no longer predict
// where a slide actually sits). Deriving straight from the slides is what
// keeps this spec immune to this class of change in future.
//
// The pull-up is applied by an attribute the driver writes only on its
// first painted frame, so a read taken before that frame lands returns the
// un-pulled-up (one deck-viewport-height too large) offset — this polls the
// first slide's own offset until two consecutive reads agree, which is the
// observable signal that frame 1 has already landed and the pull-up is in
// effect.
async function getSlideDocumentOffsets(page: Page): Promise<number[]> {
  await page.evaluate(() => window.scrollTo(0, 0));

  const readOffsets = () =>
    page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>('[data-role="deck-slide"]')).map(
        (slide) => slide.getBoundingClientRect().top + window.scrollY,
      ),
    );

  let previousFirst: number | null = null;
  await expect
    .poll(async () => {
      const offsets = await readOffsets();
      const stable = previousFirst !== null && offsets[0] === previousFirst;
      previousFirst = offsets[0] ?? null;
      return stable;
    })
    .toBe(true);

  const offsets = await readOffsets();
  expect(offsets.length).toBeGreaterThan(0);
  expect(offsets[0]).toBeGreaterThan(0);
  for (let i = 1; i < offsets.length; i++) {
    expect(offsets[i]).toBeGreaterThan(offsets[i - 1]);
  }
  return offsets;
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

// Plan 21-14: the tagline's own analogue of scaleFromComputedTransform
// above — the driver applies `translateY(...)` as a plain 2D transform, so
// the computed matrix's 6th component (ty) IS the vertical offset in
// pixels. `translateY(0px)` still resolves to the identity matrix string
// (not 'none'), since the transform property itself is set even at zero —
// this is what makes a raw string comparison against 'none' wrong for the
// "no residual vertical offset" case below.
function translateYFromComputedTransform(transform: string): number {
  if (transform === 'none') return 0;
  const match = transform.match(/^matrix\(([-0-9.]+),\s*([-0-9.]+),\s*([-0-9.]+),\s*([-0-9.]+),\s*([-0-9.]+),\s*([-0-9.]+)\)$/);
  return match ? parseFloat(match[6]) : NaN;
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

// Plan 21-14 (HOME-15, 21-UAT.md round-2 gap 1 —
// .planning/debug/homepage-scroll-intro-logo-duplication.md; round-2 gap 5 —
// .planning/debug/homepage-scroll-nav-unreachable-at-start.md): replaces
// 21-10-PLAN.md's retired 'pre-zoom intro beats' block wholesale, rebased
// onto plan 21-13's pinned, scroll-scrubbed intro track/stage.
//
// Assumption status: A4 (two stacked, ordinary-flow static beats) is
// SUPERSEDED by developer round-2 correction — plan 21-13 replaced it with
// one pinned, scroll-scrubbed logomark that shrinks continuously as the
// tagline arrives beneath it. A1 (reduced motion = static content), A2
// (dismissed by scrolling past), A3 (no scroll-snap point) and A5 (ink
// background, white logomark, drifting cue) all still stand unchanged — see
// 21-13-SUMMARY.md's own A1-A6 mapping. A6 (21-13-PLAN.md: 900px reveal
// distance, shrink-in-place) is new since plan 21-13 and still pending the
// real-device confirmation plan 21-15 carries. A7 (21-14-PLAN.md: the header
// stays reachable throughout the intro, only its own logomark is
// suppressed) is this plan's own new assumption, covered by Task 3's header
// cases below.
//
// Old case -> new case mapping (21-10-PLAN.md's nine cases; nothing dropped
// silently):
// - "beat 1 on first load..." (A4/A5) -> SUPERSEDED OUTRIGHT. Its entire
//   premise (two static full-viewport sections, the first holding a bare
//   logomark+cue) no longer exists post-21-13; replaced by "exactly one
//   logomark exists" and "at scroll position 0: rest state" below.
// - "beat 2: after one viewport height of scroll its tagline reveals..."
//   (D-13) -> direct equivalent: "at the end of the scrub" below (D-13's
//   locked values, now driven by scroll position instead of a fixed
//   one-viewport threshold).
// - "both beats render byte-for-byte identical logomark geometry..." (A4)
//   -> SUPERSEDED OUTRIGHT. Its entire premise (two logos that must match)
//   is exactly what gap 1's redesign removed; replaced by "exactly one
//   logomark exists", which asserts there is only one.
// - "the header is hidden through both intro beats..." (D-12 extension) ->
//   SUPERSEDED OUTRIGHT by round-2 gap 5's correction; rewritten (not
//   deleted) as Task 3's own header case below, with a comment naming the
//   exact assertion it replaces.
// - "the intro beats carry no scroll-snap point..." (A3) -> direct
//   equivalent, added by Task 3 below.
// - "the beat-2 tagline renders non-empty copy sourced from Sanity..." ->
//   direct equivalent, added by Task 3 below.
// - "reduced motion: both beats render statically..." (A1) -> direct
//   equivalent, added by Task 3 below (rewritten for the single stage and
//   for A7 — header AND its logo anchor both visible).
// - "desktop inert: neither intro beat is visible" -> direct equivalent,
//   added by Task 3 below.
// - "structural guards still hold..." (D-16) -> direct equivalent, added by
//   Task 3 below.
//
// This block (Task 2's half) adds the pinned intro's own new coverage —
// geometry/parity, rest/mid/end-of-scrub states, the readability dwell,
// reversibility, the atomic intro-to-zoom boundary read and scroll-event
// independence — none of which had an analogue in the retired two-beat
// design. Task 3 adds the header cases (gap 5) and the six moved/rewritten
// cases listed above into this same block, so the intro's whole story lives
// in one place.
test.describe('pinned intro scrub (HOME-15, 21-UAT.md round-2 gap 1, assumptions A1-A7)', () => {
  test("geometry and parity: the intro track is the deck's first child, starts at document offset 0, and its rendered scrub distance matches the exported INTRO_REVEAL_DISTANCE (WR-01 parity, the intro's own version)", async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const measurements = await page.evaluate(() => {
      const deckRoot = document.querySelector('[data-role="scroll-deck"]');
      const track = document.querySelector<HTMLElement>('[data-role="intro-track"]');
      return {
        isFirstChild: !!track && deckRoot?.firstElementChild === track,
        trackTop: track ? track.getBoundingClientRect().top + window.scrollY : null,
        expectedDistance: Number(track?.getAttribute('data-intro-distance') ?? NaN),
      };
    });

    expect(measurements.isFirstChild).toBe(true);
    expect(measurements.trackTop).not.toBeNull();
    expect(Math.abs(measurements.trackTop!)).toBeLessThanOrEqual(2);
    expect(measurements.expectedDistance).toBeGreaterThan(0);

    const liveDistance = await getIntroScrubDistance(page);
    expect(Math.abs(liveDistance - measurements.expectedDistance)).toBeLessThanOrEqual(2);
  });

  test("the pre-zoom distance the rest of the file depends on (getIntroOffset) equals the viewport height plus the intro's own scrub distance", async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const introOffset = await getIntroOffset(page);
    const scrubDistance = await getIntroScrubDistance(page);
    const viewportHeight = await page.evaluate(() => window.innerHeight);
    expect(Math.abs(introOffset - (viewportHeight + scrubDistance))).toBeLessThanOrEqual(2);
  });

  test("exactly one logomark exists in the document — gap 1's reported symptom, stated as a single assertion", async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    await expect(page.locator('[data-role="intro-logo"]')).toHaveCount(1);
  });

  test('at scroll position 0: the stage is pinned at the top, the logo is at rest scale, the tagline is invisible, the cue is visible, and the zoom wordmark is still off-screen below', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const stageBox = await page.locator('[data-role="intro-stage"]').boundingBox();
    expect(stageBox).not.toBeNull();
    expect(Math.abs(stageBox!.y)).toBeLessThanOrEqual(2);
    expect(Math.abs(stageBox!.height - PHONE_VIEWPORT.height)).toBeLessThanOrEqual(2);

    const transform = await page.locator('[data-role="intro-logo"]').evaluate((el) => getComputedStyle(el).transform);
    expect(scaleFromComputedTransform(transform)).toBeCloseTo(1, 2);

    const introBody = page.locator('[data-role="intro-body"]');
    // introBody only renders when Sanity's intro field is non-empty — a
    // blank field must not turn this into a false failure (same guard
    // 21-10's own beat-2 cases used).
    if ((await introBody.count()) > 0) {
      await expect.poll(() => introBody.evaluate((el) => getComputedStyle(el).opacity)).toBe('0');
    }
    await expect.poll(() => page.locator('[data-role="intro-cue"]').evaluate((el) => getComputedStyle(el).opacity)).toBe('1');

    const wordmarkBox = await page.locator('[data-role="zoom-wordmark"]').boundingBox();
    expect(wordmarkBox).not.toBeNull();
    expect(wordmarkBox!.y).toBeGreaterThanOrEqual(PHONE_VIEWPORT.height);
  });

  test('at the halfway point of the scrub: the logo is mid-shrink, the tagline is mid-reveal, the cue is gone, and the stage is still genuinely pinned (not scrolling with the page)', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const target = await introScrubTarget(page, 0.5);
    await page.evaluate((y) => window.scrollTo(0, y), target);

    async function readLogoScale() {
      const transform = await page.locator('[data-role="intro-logo"]').evaluate((el) => getComputedStyle(el).transform);
      return scaleFromComputedTransform(transform);
    }
    await expect.poll(readLogoScale).toBeGreaterThan(0.45);
    await expect.poll(readLogoScale).toBeLessThan(1);

    const introBody = page.locator('[data-role="intro-body"]');
    if ((await introBody.count()) > 0) {
      await expect
        .poll(async () => parseFloat(await introBody.evaluate((el) => getComputedStyle(el).opacity)))
        .toBeGreaterThan(0);
      const opacity = parseFloat(await introBody.evaluate((el) => getComputedStyle(el).opacity));
      expect(opacity).toBeLessThan(1);
    }

    await expect.poll(() => page.locator('[data-role="intro-cue"]').evaluate((el) => getComputedStyle(el).opacity)).toBe('0');

    const stageBox = await page.locator('[data-role="intro-stage"]').boundingBox();
    expect(stageBox).not.toBeNull();
    expect(Math.abs(stageBox!.y)).toBeLessThanOrEqual(2);
  });

  test('at the end of the scrub: the logo is at its end scale, the tagline is fully arrived with no residual vertical offset, the cue is gone, and the stage is STILL pinned — the sticky release coincides exactly with progress reaching 1', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const introBody = page.locator('[data-role="intro-body"]');
    test.skip((await introBody.count()) === 0, 'intro tagline only renders when introBody is non-empty');

    const target = await introScrubTarget(page, 1);
    await page.evaluate((y) => window.scrollTo(0, y), target);

    async function readLogoScale() {
      const transform = await page.locator('[data-role="intro-logo"]').evaluate((el) => getComputedStyle(el).transform);
      return scaleFromComputedTransform(transform);
    }
    await expect.poll(readLogoScale).toBeCloseTo(0.45, 2);

    await expect.poll(() => introBody.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
    await expect
      .poll(async () => translateYFromComputedTransform(await introBody.evaluate((el) => getComputedStyle(el).transform)))
      .toBeCloseTo(0, 1);

    await expect.poll(() => page.locator('[data-role="intro-cue"]').evaluate((el) => getComputedStyle(el).opacity)).toBe('0');

    const stageBox = await page.locator('[data-role="intro-stage"]').boundingBox();
    expect(stageBox).not.toBeNull();
    expect(Math.abs(stageBox!.y)).toBeLessThanOrEqual(2);
  });

  test("readability dwell (gap 2's intro half): across a sweep from 60% through 100% of the scrub, the tagline stays fully opaque and the stage stays pinned at every step", async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const introBody = page.locator('[data-role="intro-body"]');
    test.skip((await introBody.count()) === 0, 'intro tagline only renders when introBody is non-empty');

    // Stepping no coarser than a tenth of the scrub, per this plan's own
    // behaviour spec — a literal array (not a floating-point loop
    // increment) so the sweep reliably includes both endpoints (0.6 and
    // 1.0) regardless of binary floating-point accumulation error.
    const fractions = [0.6, 0.7, 0.8, 0.9, 1.0];
    for (const fraction of fractions) {
      const target = await introScrubTarget(page, fraction);
      await page.evaluate((y) => window.scrollTo(0, y), target);

      await expect.poll(() => introBody.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');

      const stageBox = await page.locator('[data-role="intro-stage"]').boundingBox();
      expect(stageBox).not.toBeNull();
      expect(Math.abs(stageBox!.y)).toBeLessThanOrEqual(2);
    }
  });

  test('reversibility (D-04 applied to the new intro-to-zoom junction): scrolling to the end of the scrub and back to 0 restores scale 1, tagline opacity 0 and cue opacity 1', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    async function readLogoScale() {
      const transform = await page.locator('[data-role="intro-logo"]').evaluate((el) => getComputedStyle(el).transform);
      return scaleFromComputedTransform(transform);
    }

    const endTarget = await introScrubTarget(page, 1);
    await page.evaluate((y) => window.scrollTo(0, y), endTarget);
    await expect.poll(readLogoScale).toBeCloseTo(0.45, 2);

    await page.evaluate(() => window.scrollTo(0, 0));

    await expect.poll(readLogoScale).toBeCloseTo(1, 2);
    const introBody = page.locator('[data-role="intro-body"]');
    if ((await introBody.count()) > 0) {
      await expect.poll(() => introBody.evaluate((el) => getComputedStyle(el).opacity)).toBe('0');
    }
    await expect.poll(() => page.locator('[data-role="intro-cue"]').evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
  });

  test('atomic intro-to-zoom boundary: at the offset where the intro scrub ends, ONE page.evaluate reads the logo scale, the wordmark scale, the photo layer opacity, and both active attributes together, in a single frame', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const introOffset = await getIntroOffset(page);
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(introOffset));

    // ONE page.evaluate call site reads all five handoff signals together —
    // no intermediate assertion between the reads, so a state where four
    // signals are done and one is stale cannot pass expect.poll's equality
    // check against the whole tuple at once. Mirrors the 21-07 atomic-
    // handoff case in the 'per-frame deck driver' describe block below.
    // Scale (not the raw transform string) is compared, parsed inside the
    // browser context so the read itself stays a single round trip — a raw
    // matrix-string comparison would be brittle across the two Playwright
    // projects' differing float-formatting.
    await expect
      .poll(() =>
        page.evaluate(() => {
          function scaleOf(transform: string): number {
            if (transform === 'none') return 1;
            const match = transform.match(/^matrix\(([-0-9.]+),/);
            return match ? parseFloat(match[1]) : NaN;
          }
          const logo = document.querySelector<HTMLElement>('[data-role="intro-logo"]');
          const wordmark = document.querySelector<HTMLElement>('[data-role="zoom-wordmark"]');
          const photo = document.querySelector<HTMLElement>('[data-role="zoom-photo"]');
          const home = document.querySelector<HTMLElement>('.home');
          return {
            logoScale: logo ? scaleOf(getComputedStyle(logo).transform) : null,
            wordmarkScale: wordmark ? scaleOf(getComputedStyle(wordmark).transform) : null,
            photoOpacity: photo ? getComputedStyle(photo).opacity : null,
            introActive: home ? home.getAttribute('data-intro-active') : null,
            zoomActive: home ? home.getAttribute('data-zoom-active') : null,
          };
        }),
      )
      .toEqual({ logoScale: 0.45, wordmarkScale: 1, photoOpacity: '0', introActive: null, zoomActive: 'true' });
  });

  test("scroll-event independence for the intro scrub: with every scroll listener suppressed before the page's own scripts run, scrolling to the halfway point still moves the logo's scale off 1 (gap 1's fifth missing item)", async ({ page }) => {
    // Same addInitScript idiom as suppressScrollListeners() in the
    // 'per-frame deck driver' describe block below (that helper is scoped
    // to its own describe block, not module scope, so this inlines the
    // identical body rather than reaching across describe blocks for it).
    await page.addInitScript(() => {
      const originalAddEventListener = window.addEventListener.bind(window);
      window.addEventListener = ((type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => {
        if (type === 'scroll') return;
        return originalAddEventListener(type, listener, options);
      }) as typeof window.addEventListener;
    });
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const target = await introScrubTarget(page, 0.5);
    await page.evaluate((y) => window.scrollTo(0, y), target);

    await expect
      .poll(async () => {
        const transform = await page.locator('[data-role="intro-logo"]').evaluate((el) => getComputedStyle(el).transform);
        return scaleFromComputedTransform(transform);
      })
      .toBeLessThan(1);
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

  // 21-12: rebased on getSlideDocumentOffsets() (module scope, above) —
  // each slide's own live document offset IS the scroll target that lands
  // it exactly at the top of the viewport, which is what "arrived" means
  // for these tests. Track-height arithmetic retired: after this plan the
  // track's height no longer predicts a slide's position (see the helper's
  // own comment). Shape kept identical ({ first, second }) so this
  // function's three call sites below need no edit.
  async function getSlideScrollTargets(page: Page): Promise<{ first: number; second: number }> {
    const offsets = await getSlideDocumentOffsets(page);
    return { first: offsets[0], second: offsets[1] };
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

    // Same isolation trick as this file's own 'arriving at a slide
    // promotes the NEXT slide's sharp image out of native-lazy' case
    // above: a same-origin, near-instant preview server makes Chromium's
    // native-lazy heuristic aggressive enough to load a "lazy" slide's
    // photo well before any scroll, which would flip is-loaded true first
    // and make warmNextSlide's own is-loaded guard bail before it ever
    // touches the `loading` attribute this test asserts on. Route
    // interception that never resolves (no continue()/abort()/fulfill())
    // for anything but the 24px placeholder leaves every sharp rendition
    // permanently pending, so the ONLY way `loading` can flip away from
    // 'lazy' is this component's own JS explicitly setting it.
    await page.route(/cdn\.sanity\.io\/images\//, (route) => {
      const url = new URL(route.request().url());
      if (url.searchParams.get('w') === '24') return route.continue();
    });

    // domcontentloaded, not the default 'load' — with eager images now
    // permanently pending above, waiting for 'load' would hang for the
    // test's own default timeout.
    await page.goto('/', { waitUntil: 'domcontentloaded' });

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

  // 21-12: rebased on getSlideDocumentOffsets() (module scope, above) — the
  // first slide's own document offset is the scroll target at which its
  // rect can reach the arrival ratio, the same quantity the 'arrival reveal
  // and accent liveness' describe block above calls
  // getSlideScrollTargets().first. Every call site below (including the
  // atomic-handoff and detach-on-gate-change cases) gets the rebased target
  // for free.
  async function getArrivalScrollTarget(page: Page): Promise<number> {
    const offsets = await getSlideDocumentOffsets(page);
    return offsets[0];
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

    // 21-12: rebased on getSlideDocumentOffsets() (module scope, above) —
    // the second slide's own document offset is the scroll target at which
    // it reaches arrival (mirrors this file's own
    // getSlideScrollTargets()/getArrivalScrollTarget() helpers).
    const offsets = await getSlideDocumentOffsets(page);
    const secondSlideArrivalTarget = offsets[1];
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

  // 21-12 (21-UAT.md round-2 gap 3 — .planning/debug/homepage-scroll-cover-
  // photo-doubled.md): this case is DELIBERATELY superseded, not deleted.
  // Plan 21-09 left the stage transparent so the wordmark screen's own
  // white appearance came from `body`'s background showing through it; this
  // plan paints the stage with `--color-dominant` instead — the SAME value
  // `body` already painted through the transparent stage, so the rendered
  // appearance of the wordmark screen is byte-for-byte unchanged even
  // though the stage itself is no longer transparent. What actually changed
  // is structural, not visual: the stage must now be opaque (it covers the
  // first slide, which the pull-up moved to sit behind it for nearly the
  // whole scrub) and explicitly stacked above the slides.
  test('the wordmark screen is deliberately unchanged, but the pinned stage now paints an opaque surface and stacks above the slides (21-UAT.md round-2 gap 3)', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const dominant = await page.evaluate(() =>
      getComputedStyle(document.body).backgroundColor,
    );
    const stageBackground = await page.locator('[data-role="zoom-stage"]').evaluate((el) => getComputedStyle(el).backgroundColor);
    // The wordmark screen's rendered appearance is pixel-identical to
    // before: the stage now paints the exact colour body already showed
    // through it when it was transparent.
    expect(stageBackground).toBe(dominant);
    expect(['transparent', 'rgba(0, 0, 0, 0)']).not.toContain(stageBackground);

    const stageZIndex = await page.locator('[data-role="zoom-stage"]').evaluate((el) => getComputedStyle(el).zIndex);
    expect(Number(stageZIndex)).toBeGreaterThan(0);
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

  // 21-11 (HOME-14, HOME-15, 21-UAT.md round-2 gap 4 —
  // .planning/debug/homepage-scroll-still-not-fullscreen.md): the live
  // viewport-height sync (`syncDeckViewportHeight()` in HomeCarousel.astro)
  // replaces every deck rule's bare `100svh` with `var(--deck-vh, 100svh)`,
  // where `--deck-vh` is sourced from window.visualViewport/
  // window.innerHeight and written once per genuine (>=1px) size change.
  //
  // What the cases below CAN prove, as a mechanism-level regression net:
  // the property exists once attached, tracks the reported viewport,
  // survives a resize, survives reduced motion, and stays off desktop.
  // What they CANNOT prove: a fixed-viewport Playwright engine has no
  // dynamic browser chrome to animate mid-scroll, so the visitor-facing
  // result this gap is actually about — no white bar or gap at any point
  // during Mobile Safari's toolbar collapse/expand — is confirmed only by
  // the consolidated real-device check that closes this gap-closure set
  // (plan 21-15). None of plan 21-09's existing cases above (this same
  // describe block) are weakened, relaxed or deleted by this plan — they
  // still assert against window.innerHeight, which a fixed-viewport engine
  // resolves identically whether a box is sized from the `100svh` fallback
  // or the live `--deck-vh` value, so they continue to hold unedited.
  //
  // Poll rather than assert once for --deck-vh: the sync runs its first
  // write on the first painted animation frame after attach (or,
  // above 767px / on the sizing block's own immediate call, synchronously
  // on script execution) — not guaranteed synchronously at DOMContentLoaded
  // from the test's perspective.
  async function getDeckVh(page: Page): Promise<string> {
    return page.evaluate(() =>
      getComputedStyle(document.querySelector('.home')!).getPropertyValue('--deck-vh').trim(),
    );
  }

  test('phone width: --deck-vh resolves on .home to a non-empty pixel value within 2px of window.innerHeight', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    await expect.poll(() => getDeckVh(page)).not.toBe('');
    const deckVh = await getDeckVh(page);
    const viewportHeight = await page.evaluate(() => window.innerHeight);
    expect(deckVh.endsWith('px')).toBe(true);
    expect(Math.abs(parseFloat(deckVh) - viewportHeight)).toBeLessThanOrEqual(2);
  });

  test('reduced motion, phone width: --deck-vh is STILL present and still matches window.innerHeight — the sizing fix is not gated behind the motion driver (gap 4: "at any point", not "while the motion driver happens to be attached")', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    await expect.poll(() => getDeckVh(page)).not.toBe('');
    const deckVh = await getDeckVh(page);
    const viewportHeight = await page.evaluate(() => window.innerHeight);
    expect(Math.abs(parseFloat(deckVh) - viewportHeight)).toBeLessThanOrEqual(2);
  });

  test('desktop (1280x800): --deck-vh is absent from .home entirely (UI-02 — nothing at 768px and above consumes or carries the unit)', async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto('/');

    await expect.poll(() => getDeckVh(page)).toBe('');
  });

  test('resize resilience: after a viewport resize to a different phone height, --deck-vh and the first slide track the new window.innerHeight', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');
    await expect.poll(() => getDeckVh(page)).not.toBe('');

    // The closest a fixed-viewport engine can get to Mobile Safari's
    // toolbar-collapse animation: a genuine window.innerHeight change after
    // attach. This is what would fail loudly if the sync were ever reduced
    // to a one-shot read at load instead of a live resize listener.
    await page.setViewportSize({ width: 393, height: 740 });

    await expect
      .poll(async () => {
        const deckVh = await getDeckVh(page);
        const viewportHeight = await page.evaluate(() => window.innerHeight);
        return Math.abs(parseFloat(deckVh) - viewportHeight);
      })
      .toBeLessThanOrEqual(2);

    await expect
      .poll(async () => {
        const box = await page.locator('[data-role="deck-slide"]').first().boundingBox();
        const viewportHeight = await page.evaluate(() => window.innerHeight);
        return box ? Math.abs(box.height - viewportHeight) : Number.POSITIVE_INFINITY;
      })
      .toBeLessThanOrEqual(2);
  });
});

// Phase 21, plan 21-12 (HOME-14, HOME-15, 21-UAT.md round-2 gap 3 —
// .planning/debug/homepage-scroll-cover-photo-doubled.md): closes the full-
// viewport-height dead zone that used to sit between zoom completion and
// the first slide's own snap point, during which the crossfade layer's
// photo and the first slide's own photo were both on screen showing pixel-
// identical crops of the same source image. These cases verify the
// MECHANISM (geometry and visibility) — that the first slide's snap point
// now coincides with the stage's release point, and that the stage is
// opaque, stacked, and retired the instant the zoom completes. The
// visitor-facing result ("the photo appears once") is confirmed by the
// consolidated real-device check in plan 21-15.
test.describe('collapsed post-zoom dead zone (HOME-14, HOME-15, 21-UAT.md round-2 gap 3)', () => {
  test('coincidence: the first slide\'s own document offset equals the zoom track\'s offset plus the live reveal distance — the fix that closes gap 3', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const introOffset = await getIntroOffset(page);
    const distance = await getRevealDistance(page);
    const offsets = await getSlideDocumentOffsets(page);

    expect(Math.abs(offsets[0] - (introOffset + distance))).toBeLessThanOrEqual(2);
  });

  test('at the completion offset, the first slide fills the viewport from its own top and the pinned stage is retired — read atomically so no signal can be caught stale', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const offsets = await getSlideDocumentOffsets(page);
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(offsets[0]));

    await expect
      .poll(() =>
        page.evaluate(() => {
          const firstSlide = document.querySelector<HTMLElement>('[data-role="deck-slide"]');
          const stage = document.querySelector<HTMLElement>('[data-role="zoom-stage"]');
          const home = document.querySelector<HTMLElement>('.home');
          const rect = firstSlide?.getBoundingClientRect();
          return {
            topWithin2px: rect ? Math.abs(rect.top) <= 2 : false,
            heightWithin2px: rect ? Math.abs(rect.height - window.innerHeight) <= 2 : false,
            stageHidden: stage ? getComputedStyle(stage).visibility === 'hidden' : false,
            zoomActive: home ? home.getAttribute('data-zoom-active') : null,
          };
        }),
      )
      .toEqual({ topWithin2px: true, heightWithin2px: true, stageHidden: true, zoomActive: 'false' });
  });

  // The direct automated analogue of the reported symptom: steps from the
  // completion offset through one further viewport height in quarter-
  // viewport increments, reading the stage's visibility and the first
  // slide's own sharp-photo visibility together in a single page.evaluate
  // per offset (mirrors plan 21-07's atomic-handoff sampling discipline —
  // the two elements' states cannot be sampled from different frames this
  // way), asserting the two are never both true at once.
  test('no-doubling sweep: the pinned stage is never visible at the same time as the first slide\'s sharp photo, across the collapsed zone', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const offsets = await getSlideDocumentOffsets(page);
    const viewportHeight = await page.evaluate(() => window.innerHeight);
    const step = viewportHeight / 4;

    for (let i = 0; i <= 4; i++) {
      const y = Math.round(offsets[0] + i * step);
      await page.evaluate((yy) => window.scrollTo(0, yy), y);

      const state = await page.evaluate(() => {
        const stage = document.querySelector<HTMLElement>('[data-role="zoom-stage"]');
        const firstSharp = document.querySelector<HTMLElement>('[data-role="deck-slide"] .home-slide__img--sharp');
        const stageVisible = stage ? getComputedStyle(stage).visibility !== 'hidden' : false;
        const sharpRect = firstSharp?.getBoundingClientRect();
        const sharpOnScreen = sharpRect ? sharpRect.bottom > 0 && sharpRect.top < window.innerHeight : false;
        const sharpOpaque = firstSharp ? getComputedStyle(firstSharp).opacity === '1' : false;
        return { stageVisible, sharpVisible: sharpOnScreen && sharpOpaque };
      });

      expect(state.stageVisible && state.sharpVisible, `both visible at offset ${y}`).toBe(false);
    }
  });

  // T-21-12-D (this plan's own accepted, documented consequence): scrolling
  // to a position within roughly 250-300px of completion (measured live in
  // this same debug session — well inside the plan's own "roughly 250-
  // 400px" estimate) resolves back to the completion snap point itself,
  // synchronously, not to the requested position — an instant programmatic
  // scroll IS already "at rest" the moment it is issued, so proximity snap
  // applies immediately rather than only after a real gesture settles.
  // There is therefore no scroll position from which this test (or a real
  // visitor coming to rest) can observe an intermediate crossfade frame
  // inside that tail anymore — which is exactly the deliberate effect this
  // plan names as desirable ("removes the ability to rest mid-zoom in a
  // half-scaled state"). This case targets well outside that snap-absorbed
  // range instead, proving the actual boundary this plan owns has no gap:
  // the stage reappears and scrubbing resumes the instant genuine scrub
  // territory is re-entered, with no frame where neither the stage nor a
  // fully-arrived first slide accounts for what is on screen.
  test('reversibility at the boundary: leaving the snap-absorbed tail of the scrub immediately restores a visible stage and resumes the scrub, with no gap and no second copy (D-04, T-21-12-D)', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const offsets = await getSlideDocumentOffsets(page);
    const introOffset = await getIntroOffset(page);
    const distance = await getRevealDistance(page);

    // Just past completion — the stage is retired.
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(offsets[0] + 5));
    await expect.poll(() => getZoomActive(page)).toBe('false');

    // Well outside the snap-absorbed tail (500px, comfortably past the
    // ~250-300px this session measured live).
    const target = introOffset + distance - 500;
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(target));

    await expect.poll(() => getZoomActive(page)).toBe('true');
    await expect
      .poll(() => page.locator('[data-role="zoom-stage"]').evaluate((el) => getComputedStyle(el).visibility))
      .not.toBe('hidden');

    // No second copy: genuinely back in scrub territory, not resting on
    // the first slide itself (the no-doubling sweep case above already
    // proves the absence of overlap exhaustively; this is the narrower
    // boundary-specific sanity check for this one reversal target).
    const firstSlideTop = await page
      .locator('[data-role="deck-slide"]')
      .first()
      .evaluate((el) => el.getBoundingClientRect().top);
    expect(firstSlideTop).toBeGreaterThan(0);
  });

  test('tap-through after completion: clicking the first slide navigates to its gallery detail route, proving the retired stage no longer intercepts the tap (D-10)', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    const offsets = await getSlideDocumentOffsets(page);
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(offsets[0]));
    await expect.poll(() => getZoomActive(page)).toBe('false');

    const slide = page.locator('[data-role="deck-slide"]').first();
    const href = await slide.getAttribute('href');
    expect(href).toBeTruthy();

    await slide.click();
    await page.waitForURL(new RegExp(href!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  });

  test('reduced motion, phone width: the pull-up and stage-retirement are provably inert — no zoom-active attribute, no negative margin on the slides wrapper, and the stage stays visible (D-15)', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto('/');

    expect(await getZoomActive(page)).toBeNull();

    const marginTop = await page
      .locator('[data-role="deck-slides"]')
      .evaluate((el) => parseFloat(getComputedStyle(el).marginTop));
    expect(marginTop).toBeGreaterThanOrEqual(0);

    const stageVisibility = await page.locator('[data-role="zoom-stage"]').evaluate((el) => getComputedStyle(el).visibility);
    expect(stageVisibility).not.toBe('hidden');
  });

  test('desktop (1280x800): the deck root is still not visible, the homepage still renders its carousel, and no zoom-active attribute exists (UI-02)', async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto('/');

    await expect(page.locator('[data-role="scroll-deck"]')).not.toBeVisible();
    await expect(page.locator('[data-role="home-carousel"]')).toBeVisible();
    expect(await getZoomActive(page)).toBeNull();
  });
});
