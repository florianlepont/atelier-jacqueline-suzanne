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

  test('About and Contact share the same editorial type scale and page frame', async ({ page }) => {
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
        eyebrow: '.about-page__eyebrow',
        title: '.about-page h1',
        lead: '.about-page__lead',
        sectionTitle: '.about-page h2',
      });
      const contactStyles = await readStyles(`${localePrefix}/contact/`, {
        frame: '.contact-page',
        eyebrow: '.contact-page__eyebrow',
        title: '.contact-page h1',
        lead: '.contact-page__lead',
        sectionTitle: '.contact-page__form-heading h2',
      });

      expect(aboutStyles).toEqual(contactStyles);
    }
  });

  test('the portrait belongs to the intro while the exhibition image spans the editorial frame', async ({
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
      page.locator('.about-page__hero').boundingBox(),
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
      page.locator('.about-page__hero').boundingBox(),
    ]);
    expect(portraitMobileBox?.width).toBeLessThanOrEqual(72);
    expect(portraitMobileBox?.width).toBe(portraitMobileBox?.height);
    expect(exhibitionMobileBox?.width).toBe(contentBox?.width);
  });
});
