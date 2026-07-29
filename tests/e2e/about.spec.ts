import { test, expect } from '@playwright/test';

// RED (Wave 0): src/pages/about.astro, src/pages/en/about.astro, and the
// About nav link in BaseLayout.astro do not exist yet — those are built in
// Task 2 of this plan. These assertions target the real ABOUT-01/ABOUT-02
// contracts (bio copy, atelier/practice copy, D-06 locked medium/technique
// placeholder, nav reachability) and are expected to FAIL (404s / missing
// nav link) until then — do not stub or weaken them to make them pass early.

test.describe('about page content', () => {
  test('French About page renders non-empty CMS bio, practice, and medium copy at "/about/"', async ({
    page,
  }) => {
    await page.goto('/about/');

    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.locator('main h1')).toContainText('À propos');

    await expect(page.getByText('Atelier & pratique')).toBeVisible();
    await expect(page.getByRole('heading', {name: 'Médium & technique'})).toBeVisible();
    const editorialParagraphs = page.locator('.about-page__lead, .about-page__section > div > p');
    await expect(editorialParagraphs).toHaveCount(3);
    for (const paragraph of await editorialParagraphs.all()) {
      expect((await paragraph.innerText()).trim().length).toBeGreaterThan(20);
    }
  });

  test('English About page renders non-empty CMS bio, practice, and medium copy at "/en/about/"', async ({
    page,
  }) => {
    await page.goto('/en/about/');

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('main h1')).toContainText('About');

    await expect(page.getByText('Studio & practice')).toBeVisible();
    await expect(page.getByRole('heading', {name: 'Medium & technique'})).toBeVisible();
    const editorialParagraphs = page.locator('.about-page__lead, .about-page__section > div > p');
    await expect(editorialParagraphs).toHaveCount(3);
    for (const paragraph of await editorialParagraphs.all()) {
      expect((await paragraph.innerText()).trim().length).toBeGreaterThan(20);
    }
  });

  test('About page copy differs between the French and English pages', async ({ page }) => {
    await page.goto('/about/');
    const frMain = await page.locator('main').innerText();

    await page.goto('/en/about/');
    const enMain = await page.locator('main').innerText();

    expect(enMain).not.toBe(frMain);
  });

  test('the header nav links to the About page', async ({ page }) => {
    // Phase 04.1: the homepage ("/") intentionally renders its own minimal,
    // immersive nav (Accueil/Galeries + carousel-grid toggle + switcher only
    // — no About/Contact) per 04.1-UI-SPEC.md's Layout Notes, matching the
    // imported design prototype. The standard site-wide header (with the
    // About link) still renders on every other page, so this checks
    // reachability from there instead of "/". Phase 04.3 removed the
    // standalone /galleries listing route (D-03), so this now originates
    // from /contact/ — another surviving BaseLayout page whose header still
    // exposes the About link.
    await page.goto('/contact/');

    await page.locator('header').getByRole('link', { name: 'À propos' }).click();

    await expect(page).toHaveURL(/\/about\/$/);
  });

  // sketch-012 / variant A3 (quick-260728-ek0): Contact intentionally gives
  // up the shared editorial type scale/page frame in favor of its own
  // big-title, one-viewport composition — its giant title no longer matches
  // --editorial-page-title-size and its frame padding differs from About's.
  // This test now validates About's own editorial scale only.
  //
  // Phase 15 plan 02 (ABOUT-03): the giant title/eyebrow now render via the
  // shared PageTitleHeader component instead of a local .about-page h1 /
  // .about-page__eyebrow — read the same hierarchy from PageTitleHeader's
  // own selectors.
  test('About uses the shared editorial type scale and page frame', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    for (const localePrefix of ['', '/en']) {
      const readStyles = async (path: string, selectors: Record<string, string>) => {
        await page.goto(path);

        return page.evaluate((pageSelectors) => {
          const stylesFor = (selector: string) => {
            const element = document.querySelector(selector);
            if (!element) throw new Error(`Missing element: ${selector}`);
            const styles = getComputedStyle(element);

            return {
              fontFamily: styles.fontFamily,
              fontSize: styles.fontSize,
              fontWeight: styles.fontWeight,
              letterSpacing: styles.letterSpacing,
              lineHeight: styles.lineHeight,
              textTransform: styles.textTransform,
            };
          };

          const frame = document.querySelector(pageSelectors.frame);
          if (!frame) throw new Error(`Missing page frame: ${pageSelectors.frame}`);
          const frameStyles = getComputedStyle(frame);

          return {
            frame: {
              width: frameStyles.width,
              paddingTop: frameStyles.paddingTop,
              paddingRight: frameStyles.paddingRight,
            },
            eyebrow: stylesFor(pageSelectors.eyebrow),
            title: stylesFor(pageSelectors.title),
            lead: stylesFor(pageSelectors.lead),
            sectionTitle: stylesFor(pageSelectors.sectionTitle),
          };
        }, selectors);
      };

      const aboutStyles = await readStyles(`${localePrefix}/about/`, {
        frame: '.about-page',
        eyebrow: '.page-title-header__eyebrow',
        title: '#about-title',
        lead: '.about-page__lead',
        sectionTitle: '.about-page h2',
      });

      // Editorial hierarchy invariants: eyebrow is a small uppercase label,
      // the title is the largest display element, and the section title
      // sits between the title and the lead body copy in size.
      expect(aboutStyles.eyebrow.textTransform).toBe('uppercase');
      const titleSize = parseFloat(aboutStyles.title.fontSize);
      const leadSize = parseFloat(aboutStyles.lead.fontSize);
      const sectionTitleSize = parseFloat(aboutStyles.sectionTitle.fontSize);
      expect(titleSize).toBeGreaterThan(sectionTitleSize);
      expect(sectionTitleSize).toBeGreaterThan(leadSize);
      expect(aboutStyles.frame.width).toBeTruthy();
      expect(parseFloat(aboutStyles.frame.paddingTop)).toBeGreaterThan(0);
    }
  });

  // Proves ABOUT-03's wiring: the old hand-rolled eyebrow is gone and the
  // shared PageTitleHeader's structural siblings (halftone, eyebrow,
  // divider) render on About, the same title identity Contact/Éditions use.
  test('About retires its local eyebrow in favor of the shared PageTitleHeader', async ({
    page,
  }) => {
    await page.goto('/about/');

    await expect(page.locator('.about-page__eyebrow')).toHaveCount(0);
    await expect(page.locator('.page-title-header__eyebrow')).toContainText(
      'Atelier Jacqueline Suzanne',
    );
    await expect(page.locator('.page-title-header__halftone')).toHaveCount(1);
    await expect(page.locator('.page-title-header__divider')).toHaveCount(1);
    await expect(page.locator('main h1#about-title')).toContainText('À propos');
  });

  test('the portrait stays a small circular accent while the exhibition image spans the editorial frame', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/about/');

    const portrait = page.locator('.about-page__portrait');
    const exhibition = page.locator('.about-page__exhibition');
    await expect(portrait).toBeVisible();
    await expect(exhibition).toBeVisible();
    const [portraitDesktopBox, exhibitionDesktopBox, desktopContentBox] = await Promise.all([
      portrait.boundingBox(),
      exhibition.boundingBox(),
      page.locator('.about-page__bio-row').boundingBox(),
    ]);
    expect(portraitDesktopBox?.width).toBeLessThanOrEqual(112);
    expect(portraitDesktopBox?.width).toBe(portraitDesktopBox?.height);
    expect(exhibitionDesktopBox?.width).toBe(desktopContentBox?.width);
    expect((exhibitionDesktopBox?.width ?? 0) / (exhibitionDesktopBox?.height ?? 1)).toBeGreaterThan(
      1.7,
    );

    await page.setViewportSize({ width: 375, height: 812 });
    const [portraitMobileBox, exhibitionMobileBox, contentBox] = await Promise.all([
      portrait.boundingBox(),
      exhibition.boundingBox(),
      page.locator('.about-page__bio-row').boundingBox(),
    ]);
    expect(portraitMobileBox?.width).toBeLessThanOrEqual(72);
    expect(portraitMobileBox?.width).toBe(portraitMobileBox?.height);
    expect(exhibitionMobileBox?.width).toBe(contentBox?.width);
  });
});

// Phase 15 plan 03 (ABOUT-04, D-04/D-05/D-06): the pin+shrink scroll-driver
// ported from DetailHero.astro (sketch 005), scoped to About's own
// .about-page__exhibition-* classes (never .detail-hero*). Desktop viewport
// is required for the pin-position assertions — same rationale as
// edition.spec.ts's "editions hero reduced-motion" block: the
// `min-width: 768px` branch of the script/CSS is what makes the pin
// genuinely sticky (default) vs relative (reduced-motion settled
// end-state); the `max-width: 767px` mobile branch overrides position to
// `relative` regardless of motion preference, which would make the
// "sticky by default" assertion meaningless on a narrow viewport. D-05
// resolved to a pure motion "settle" (no text reveal), so there is no
// reveal-target/overlay-title assertion here, unlike the édition hero.
test.describe('about hero scroll-reveal (ABOUT-04)', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  for (const [localeLabel, path] of [
    ['French', '/about/'],
    ['English', '/en/about/'],
  ] as const) {
    test(`${localeLabel} About page: desktop pin is sticky by default (motion enabled)`, async ({
      page,
    }) => {
      await page.goto(path);

      const pin = page.locator('.about-page__exhibition-pin');
      await expect(pin).toBeVisible();
      const pinPosition = await pin.evaluate((el) => getComputedStyle(el).position);
      expect(pinPosition).toBe('sticky');
    });

    test(`${localeLabel} About page: prefers-reduced-motion: reduce shows the settled end-state immediately, no sticky pin`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(path);

      const pin = page.locator('.about-page__exhibition-pin');
      await expect(pin).toBeVisible();
      const pinPosition = await pin.evaluate((el) => getComputedStyle(el).position);
      expect(pinPosition).not.toBe('sticky');

      const photo = page.locator('.about-page__exhibition-photo');
      await expect(photo).toBeVisible();
    });
  }

  test('mobile viewport renders a static band — no sticky pin, no scroll-linked motion', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/about/');

    const pin = page.locator('.about-page__exhibition-pin');
    await expect(pin).toBeVisible();
    const pinPosition = await pin.evaluate((el) => getComputedStyle(el).position);
    expect(pinPosition).toBe('relative');

    const photo = page.locator('.about-page__exhibition-photo');
    await expect(photo).toBeVisible();
  });
});
