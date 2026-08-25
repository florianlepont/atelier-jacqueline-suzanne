import { test, expect } from '@playwright/test';

// HOME-16/D-05: the homepage's STARTING accent is now randomly picked per
// visit from the existing per-gallery heroColor values, without changing
// which gallery's photo/title/index-label/dash shows first and without
// touching the existing per-gallery-follows-carousel-position accent
// behaviour. Every expectation below reads its expected colour/src straight
// off the page's own `data-hero-*` attributes rather than hardcoding a hex
// value or a gallery count, so this spec survives future Sanity content
// changes.
//
// quick-260825-kt3: the random starting accent applies to fresh landings
// only — a return navigation via a MATCHED `?carousel=<slug>` must instead
// preserve the returned-to gallery's own resolved accent (see "a matched
// ?carousel= return keeps the returned-to gallery's own accent" below).

interface DataEntry {
  heroColor: string;
  heroTextColor: string;
  heroSrc: string;
  slug: string;
  title: string;
}

async function readDataEntries(page: import('@playwright/test').Page): Promise<DataEntry[]> {
  return page.locator('ul[data-role="home-carousel-data"] li').evaluateAll((lis) =>
    lis.map((li) => ({
      heroColor: (li as HTMLElement).dataset.heroColor ?? '',
      heroTextColor: (li as HTMLElement).dataset.heroTextColor ?? '',
      heroSrc: (li as HTMLElement).dataset.heroSrc ?? '',
      slug: (li as HTMLElement).dataset.slug ?? '',
      title: (li as HTMLElement).dataset.title ?? '',
    })),
  );
}

async function currentAccent(page: import('@playwright/test').Page): Promise<string> {
  return page.evaluate(() =>
    getComputedStyle(document.querySelector('.home') as HTMLElement).getPropertyValue('--current-accent').trim(),
  );
}

// A gallery's accent comes from its own explicit heroColor (schemas/gallery.ts's
// heroColor field) OR falls back to the automatic per-index ACCENTS palette
// (home-carousel-runtime.ts) when left unset — an intentional, supported
// state ("Palette automatique" in the Studio), not an error. `heroColor`
// read straight off the data attribute is therefore not always the correct
// expected accent. Rather than duplicate the fallback palette's specific
// CSS custom properties here (and risk drifting out of sync with them),
// resolve the true expected accent by clicking straight to that gallery and
// reading what the app itself renders — the same click-driven path "the
// per-gallery accent still follows carousel position" already proves
// correct. Reloads first so a stubbed Math.random from an earlier
// addInitScript doesn't leave the page mid-transition from a different
// forced starting gallery.
async function resolveExpectedAccent(page: import('@playwright/test').Page, index: number): Promise<string> {
  await page.reload();
  const dashes = page.locator('.home-hero__progress-dash');
  const count = await dashes.count();
  // goToIndex() (home-carousel-runtime.ts) is a no-op when the clicked
  // dash is already carouselIndex — and a fresh reload always starts on
  // gallery 0. Clicking dash 0 straight after reload would therefore
  // never actually navigate, silently leaving --current-accent holding
  // whatever the unrelated per-visit random-starting-accent (HOME-16)
  // happened to pick instead of gallery 0's own resolved colour.
  // Detouring through a different dash first forces a real navigation
  // for the final click regardless of which index is requested.
  if (count > 1) {
    const detour = (index + 1) % count;
    await dashes.nth(detour).click();
    await expect(dashes.nth(detour)).toHaveAttribute('aria-current', 'true');
  }
  await dashes.nth(index).click();
  // Waiting for aria-current (auto-retrying) proves render()'s navigation
  // handling for this click has actually run before --current-accent is
  // read — a bare click() resolves as soon as the event dispatches, which
  // can race the handler that sets both.
  await expect(dashes.nth(index)).toHaveAttribute('aria-current', 'true');
  return currentAccent(page);
}

test.describe('homepage random starting accent (HOME-16, D-05)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test('a forced lowest random value starts the accent on the first gallery\'s heroColor', async ({ page }) => {
    await page.addInitScript(() => {
      Math.random = () => 0;
    });
    await page.goto('/');

    const entries = await readDataEntries(page);
    expect(entries.length).toBeGreaterThan(0);
    const initialAccent = await currentAccent(page);
    const expectedAccent = await resolveExpectedAccent(page, 0);
    expect(initialAccent).toBe(expectedAccent);
  });

  test('a forced highest random value starts the accent on the LAST gallery\'s heroColor', async ({ page }) => {
    await page.addInitScript(() => {
      Math.random = () => 0.999;
    });
    await page.goto('/');

    const entries = await readDataEntries(page);
    test.skip(entries.length < 2, 'needs at least 2 homepage galleries to prove a non-first pick');

    // Per this file's own header comment, randomizing the accent never
    // changes which gallery's photo/title/index-label shows first — only
    // the backdrop colour varies. So the only thing to prove here is that
    // the accent shown matches the LAST gallery's own resolved colour, not
    // that some other gallery got selected (nothing else could indicate
    // that: the index label always reads "01 / N"). A "differs from the
    // first gallery's colour" assertion previously lived here too, but with
    // more galleries than the 5-value ACCENTS palette, a gallery left on
    // "Palette automatique" can legitimately collide with another gallery's
    // colour — that's correct behaviour given real content, not a sign the
    // wrong value was picked, so it's not asserted.
    const initialAccent = await currentAccent(page);
    const lastAccent = await resolveExpectedAccent(page, entries.length - 1);
    expect(initialAccent).toBe(lastAccent);
  });

  test('the randomly-picked accent never leaves the existing five-value palette', async ({ page }) => {
    await page.goto('/');
    const entries = await readDataEntries(page);

    // Build the TRUE resolved palette (accent as actually rendered per
    // gallery), not raw heroColor text: a gallery with heroColor left unset
    // (Sanity Studio's "Palette automatique" state) reads as an empty
    // string from the data attribute, but the app still renders a real
    // accent for it via the automatic per-index fallback (see
    // resolveExpectedAccent above) — still bounded to the same five-value
    // ACCENTS palette either way.
    const palette = new Set<string>();
    for (let i = 0; i < entries.length; i++) {
      palette.add(await resolveExpectedAccent(page, i));
    }

    // Deliberately uses the real, unmocked Math.random across 6 reloads —
    // this is the one test in the file that proves membership under actual
    // runtime randomness rather than a stubbed value. It does NOT also
    // assert on distinctness across those reloads: with a real RNG that
    // assertion's failure probability is (1/count)^5 per run (non-trivial
    // for a small gallery count), and the two tests above already prove
    // distinctness deterministically (Math.random stubbed to 0 vs 0.999
    // resolves to different galleries) — asserting it again here would only
    // add flake risk, not coverage.
    for (let i = 0; i < 6; i++) {
      await page.reload();
      // The random accent's one-time transition-suppression class
      // (.is-accent-init) is removed once the picked colour has actually
      // painted (see "the initial-paint transition suppression is
      // released" below) — waiting for that proves the random pick has
      // landed before reading it, instead of racing the dynamically
      // imported carousel module's init.
      await expect.poll(() => page.locator('.home').getAttribute('class')).not.toContain('is-accent-init');
      const accent = await currentAccent(page);
      expect(palette.has(accent)).toBe(true);
    }
  });

  test('the random accent does not change which gallery shows first', async ({ page }) => {
    await page.addInitScript(() => {
      Math.random = () => 0.999;
    });
    await page.goto('/');

    const entries = await readDataEntries(page);
    const carousel = page.locator('[data-role="home-carousel"]');
    await expect(carousel.locator('[data-role="hero-image"]')).toHaveAttribute('src', entries[0].heroSrc);
    await expect(carousel.locator('[data-role="index-label"]')).toHaveText(/^01 \//);

    const dashes = carousel.locator('.home-hero__progress-dash');
    await expect(dashes.first()).toHaveAttribute('aria-current', 'true');
    await expect(dashes.last()).toHaveAttribute('aria-current', 'false');
  });

  test('the per-gallery accent still follows carousel position after the first advance', async ({ page }) => {
    // Phase 21 (HOME-14): the describe block's own beforeEach forces phone
    // width (393x852), but the carousel/progress-dash this test clicks is
    // now retired below 767px (homepage-scroll-deck.spec.ts covers the
    // phone-width replacement) — a real phone visitor has no dash to click
    // anymore. The underlying "accent follows carousel position on advance"
    // behaviour this test proves is still genuinely valid on tablet/desktop
    // (the carousel is untouched there), so this one test overrides back to
    // a desktop viewport rather than being retired outright.
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.addInitScript(() => {
      Math.random = () => 0.999;
    });
    await page.goto('/');

    const entries = await readDataEntries(page);
    test.skip(entries.length < 2, 'needs at least 2 homepage galleries to advance to a second one');

    // Resolve gallery 1's own accent independently first (see
    // resolveExpectedAccent above for why raw heroColor isn't a safe
    // oracle), then reproduce the actual click-to-advance flow and compare.
    const expectedAccent = await resolveExpectedAccent(page, 1);

    await page.goto('/');
    await page.locator('[data-role="progress"] .home-hero__progress-dash[data-index="1"]').click();
    await expect.poll(() => currentAccent(page)).toBe(expectedAccent);
  });

  test('the initial-paint transition suppression is released', async ({ page }) => {
    await page.goto('/');

    await expect.poll(() => page.locator('.home').getAttribute('class')).not.toContain('is-accent-init');

    const transitionDuration = await page
      .locator('[data-role="accent-panel"]')
      .evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(transitionDuration).not.toBe('0s');
  });

  test('a matched ?carousel= return keeps the returned-to gallery\'s own accent', async ({ page }) => {
    await page.goto('/');
    const entries = await readDataEntries(page);
    test.skip(entries.length < 2, 'needs at least 2 homepage galleries for a non-first target to be meaningful');

    // Target a NON-ZERO index: gallery 0's accent is also what the
    // pre-mount server-rendered markup shows, so a target of 0 could pass
    // without the runtime's ?carousel= handling ever having run.
    const t = 1;
    const targetAccent = await resolveExpectedAccent(page, t);

    // Find a fixture index r (r !== t) whose resolved accent DIFFERS from
    // t's — r is the value the random pick below will be forced to, so a
    // pre-fix failure (override still winning) is loud rather than a
    // palette coincidence.
    let r = -1;
    for (let i = 0; i < entries.length; i++) {
      if (i === t) continue;
      const candidateAccent = await resolveExpectedAccent(page, i);
      if (candidateAccent !== targetAccent) {
        r = i;
        break;
      }
    }
    test.skip(r < 0, 'every gallery resolves to the same accent — no differing fixture index available');
    const rAccent = await resolveExpectedAccent(page, r);
    expect(rAccent).not.toBe(targetAccent);

    const count = entries.length;
    // Force the random pick to land exactly on r: Math.floor(random * count)
    // === r for random === (r + 0.5) / count. Installed AFTER the oracle
    // work above so resolveExpectedAccent's own reload/click resolution
    // above ran against real randomness, exactly as the existing tests
    // assume.
    await page.addInitScript(
      ({ forcedIndex, galleryCount }) => {
        Math.random = () => (forcedIndex + 0.5) / galleryCount;
      },
      { forcedIndex: r, galleryCount: count },
    );

    await page.goto('/?carousel=' + entries[t].slug);

    // Wait for the progress dash at index t to carry aria-current="true"
    // (set only by render(), whereas the server-rendered markup marks dash
    // 0 instead) — proves the runtime mounted and landed on the requested
    // gallery before any colour is read.
    const dashes = page.locator('.home-hero__progress-dash');
    await expect(dashes.nth(t)).toHaveAttribute('aria-current', 'true');

    // Strict (non-polling) read: render() and the override both write
    // synchronously within the same mount block, so there is no transient
    // window in which a correct value could be sampled before a wrong one
    // overwrites it — polling would mask exactly the ordering this case
    // exists to pin.
    const accent = await currentAccent(page);
    expect(accent).toBe(targetAccent);

    // The requested gallery must still be the one displayed — fails loudly
    // if a future change makes the fix accidentally alter carouselIndex.
    const carousel = page.locator('[data-role="home-carousel"]');
    await expect(carousel.locator('[data-role="gallery-title"]')).toHaveText(entries[t].title.toUpperCase());
  });
});
