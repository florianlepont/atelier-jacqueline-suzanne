import { test, expect } from '@playwright/test';

// RED (Wave 0): src/lib/contact-form.ts, src/components/ContactForm.astro,
// and the /contact/ + /en/contact/ routes do not exist yet — they are built
// in Plan 03-02 Tasks 2/3. These assertions target the real contracts
// documented in 03-RESEARCH.md (Pitfall 2: never hit the real Web3Forms
// endpoint in CI, always mock via page.route()) and 03-UI-SPEC.md (Form
// Interaction States: exact success/error/validation copy) and are expected
// to FAIL until then — do not stub or weaken them to make them pass early.

const WEB3FORMS_URL = 'https://api.web3forms.com/submit';

// quick-260811-kog-06: with no PUBLIC_WEB3FORMS_ACCESS_KEY set in this test
// build, data-access-key resolves empty and the form short-circuits before
// ever reaching fetch (DIAGNOSTIC-10). Tests exercising the network/response
// path inject this clearly-fake value into the DOM first -- never a real
// key, and never read from an env var or fixture that could accidentally
// hold one.
async function injectFakeAccessKey(page: import('@playwright/test').Page) {
  await page.locator('#contact-form').evaluate((form: HTMLFormElement) => {
    form.dataset.accessKey = 'test-fake-access-key-do-not-use';
  });
}

test.describe('contact form success', () => {
  test('submitting valid input shows the inline FR success message without navigating away (CONT-01, D-09)', async ({
    page,
  }) => {
    await page.route(WEB3FORMS_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Email sent' }),
      }),
    );

    await page.goto('/contact/');
    await injectFakeAccessKey(page);
    const urlBefore = page.url();

    await page.getByLabel(/^nom$/i).fill('Jeanne Dupont');
    await page.getByLabel(/^e-mail$/i).fill('jeanne@example.com');
    await page.getByLabel(/^message$/i).fill('Bonjour, je souhaite vous contacter.');
    await page.getByRole('button', { name: /envoyer le message/i }).click();

    const status = page.locator('[data-role="form-status"]');
    await expect(status).toHaveText(/merci, votre message a bien été envoyé/i);
    await expect(page.getByLabel(/^nom$/i)).toHaveValue('');
    expect(page.url()).toBe(urlBefore);
  });

  test('submitting valid input shows the inline EN success message at /en/contact/', async ({ page }) => {
    await page.route(WEB3FORMS_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Email sent' }),
      }),
    );

    await page.goto('/en/contact/');
    await injectFakeAccessKey(page);
    const urlBefore = page.url();

    await page.getByLabel(/^name$/i).fill('Jane Doe');
    await page.getByLabel(/^email$/i).fill('jane@example.com');
    await page.getByLabel(/^message$/i).fill('Hello, I would like to get in touch.');
    await page.getByRole('button', { name: /send message/i }).click();

    const status = page.locator('[data-role="form-status"]');
    await expect(status).toHaveText(/thank you, your message has been sent/i);
    expect(page.url()).toBe(urlBefore);
  });
});

// DIAGNOSTIC-10 (quick-260811-kog-06): this test build sets no
// PUBLIC_WEB3FORMS_ACCESS_KEY, so data-access-key is empty by default here
// -- exactly the deployed-without-a-key state. These tests deliberately do
// NOT call injectFakeAccessKey, and prove the honest, no-network fallback
// on both locales without inventing or reading any real secret.
test.describe('contact form without a configured Web3Forms key (DIAGNOSTIC-10)', () => {
  test('fr: valid input never reaches the network and shows a mailto fallback, not a false success', async ({
    page,
  }) => {
    let requestFired = false;
    await page.route(WEB3FORMS_URL, (route) => {
      requestFired = true;
      return route.abort();
    });

    await page.goto('/contact/');
    await page.getByLabel(/^nom$/i).fill('Jeanne Dupont');
    await page.getByLabel(/^e-mail$/i).fill('jeanne@example.com');
    await page.getByLabel(/^message$/i).fill('Bonjour, je souhaite vous contacter.');
    await page.getByRole('button', { name: /envoyer le message/i }).click();

    const status = page.locator('[data-role="form-status"]');
    await expect(status).not.toHaveText(/bien été envoyé/i);
    await expect(status).toContainText(/n['’]est pas encore actif/i);
    const mailtoLink = status.locator('a[href^="mailto:"]');
    await expect(mailtoLink).toHaveCount(1);
    await expect(mailtoLink).toHaveAttribute('href', /^mailto:contact@atelierjacquelinesuzanne\.fr$/);
    expect(requestFired).toBe(false);
  });

  test('en: valid input never reaches the network and shows a mailto fallback, not a false success', async ({
    page,
  }) => {
    let requestFired = false;
    await page.route(WEB3FORMS_URL, (route) => {
      requestFired = true;
      return route.abort();
    });

    await page.goto('/en/contact/');
    await page.getByLabel(/^name$/i).fill('Jane Doe');
    await page.getByLabel(/^email$/i).fill('jane@example.com');
    await page.getByLabel(/^message$/i).fill('Hello, I would like to get in touch.');
    await page.getByRole('button', { name: /send message/i }).click();

    const status = page.locator('[data-role="form-status"]');
    await expect(status).not.toHaveText(/has been sent/i);
    await expect(status).toContainText(/isn['’]t active yet/i);
    const mailtoLink = status.locator('a[href^="mailto:"]');
    await expect(mailtoLink).toHaveCount(1);
    await expect(mailtoLink).toHaveAttribute('href', /^mailto:contact@atelierjacquelinesuzanne\.fr$/);
    expect(requestFired).toBe(false);
  });

  test('the honeypot check still runs before the no-key fallback (bot traffic never sees the mailto either)', async ({
    page,
  }) => {
    let requestFired = false;
    await page.route(WEB3FORMS_URL, (route) => {
      requestFired = true;
      return route.abort();
    });

    await page.goto('/contact/');
    await page.getByLabel(/^nom$/i).fill('Jeanne Dupont');
    await page.getByLabel(/^e-mail$/i).fill('jeanne@example.com');
    await page.getByLabel(/^message$/i).fill('Bonjour, je souhaite vous contacter.');
    await page.locator('input[name="website"]').fill('bot');
    await page.getByRole('button', { name: /envoyer le message/i }).click();

    const status = page.locator('[data-role="form-status"]');
    await expect(status).toHaveText(/merci, votre message a bien été envoyé/i);
    expect(requestFired).toBe(false);
  });
});

test.describe('contact form honeypot', () => {
  test('a honeypot-filled submission never fires the network call and still shows success (CONT-02)', async ({
    page,
  }) => {
    let requestFired = false;
    await page.route(WEB3FORMS_URL, (route) => {
      requestFired = true;
      return route.abort();
    });

    await page.goto('/contact/');

    await page.getByLabel(/^nom$/i).fill('Jeanne Dupont');
    await page.getByLabel(/^e-mail$/i).fill('jeanne@example.com');
    await page.getByLabel(/^message$/i).fill('Bonjour, je souhaite vous contacter.');
    // Off-screen honeypot: use fill (not click) since it is not visible.
    await page.locator('input[name="website"]').fill('bot');
    await page.getByRole('button', { name: /envoyer le message/i }).click();

    const status = page.locator('[data-role="form-status"]');
    await expect(status).toHaveText(/merci, votre message a bien été envoyé/i);
    expect(requestFired).toBe(false);
  });
});

test.describe('contact form validation', () => {
  test('empty name shows a per-field validation error and fires no network call', async ({ page }) => {
    let requestFired = false;
    await page.route(WEB3FORMS_URL, (route) => {
      requestFired = true;
      return route.abort();
    });

    await page.goto('/contact/');
    await page.getByLabel(/^e-mail$/i).fill('jeanne@example.com');
    await page.getByLabel(/^message$/i).fill('Bonjour, je souhaite vous contacter.');
    await page.getByRole('button', { name: /envoyer le message/i }).click();

    await expect(page.getByText(/merci d.indiquer votre nom/i)).toBeVisible();
    expect(requestFired).toBe(false);
  });

  test('malformed email shows a per-field validation error and fires no network call', async ({ page }) => {
    let requestFired = false;
    await page.route(WEB3FORMS_URL, (route) => {
      requestFired = true;
      return route.abort();
    });

    await page.goto('/contact/');
    await page.getByLabel(/^nom$/i).fill('Jeanne Dupont');
    await page.getByLabel(/^e-mail$/i).fill('not-an-email');
    await page.getByLabel(/^message$/i).fill('Bonjour, je souhaite vous contacter.');
    await page.getByRole('button', { name: /envoyer le message/i }).click();

    await expect(page.getByText(/merci d.indiquer une adresse e-mail valide/i)).toBeVisible();
    expect(requestFired).toBe(false);
  });

  test('empty English message shows the localized error and fires no network call', async ({page}) => {
    let requestFired = false;
    await page.route(WEB3FORMS_URL, (route) => {
      requestFired = true;
      return route.abort();
    });
    await page.goto('/en/contact/');
    await page.getByLabel(/^name$/i).fill('Jane Doe');
    await page.getByLabel(/^email$/i).fill('jane@example.com');
    await page.getByRole('button', {name: /send message/i}).click();
    await expect(page.getByText(/please enter a message/i)).toBeVisible();
    expect(requestFired).toBe(false);
  });
});

test.describe('contact form submission failures', () => {
  const fillValidForm = async (page: import('@playwright/test').Page) => {
    await page.goto('/contact/');
    await injectFakeAccessKey(page);
    await page.getByLabel(/^nom$/i).fill('Jeanne Dupont');
    await page.getByLabel(/^e-mail$/i).fill('jeanne@example.com');
    await page.getByLabel(/^message$/i).fill('Bonjour, je souhaite vous contacter.');
  };

  const expectRecoverableError = async (page: import('@playwright/test').Page) => {
    await expect(page.locator('[data-role="form-status"]')).toContainText(/une erreur est survenue/i);
    const submit = page.getByRole('button', {name: /envoyer le message/i});
    await expect(submit).toBeEnabled();
    await expect(page.getByLabel(/^nom$/i)).toHaveValue('Jeanne Dupont');
  };

  test('shows a recoverable error for an HTTP failure', async ({page}) => {
    await page.route(WEB3FORMS_URL, (route) =>
      route.fulfill({status: 503, contentType: 'application/json', body: '{"success":false}'}),
    );
    await fillValidForm(page);
    await page.getByRole('button', {name: /envoyer le message/i}).click();
    await expectRecoverableError(page);
  });

  test('shows a recoverable error for a rejected application response', async ({page}) => {
    await page.route(WEB3FORMS_URL, (route) =>
      route.fulfill({status: 200, contentType: 'application/json', body: '{"success":false}'}),
    );
    await fillValidForm(page);
    await page.getByRole('button', {name: /envoyer le message/i}).click();
    await expectRecoverableError(page);
  });

  test('shows a recoverable error for invalid JSON', async ({page}) => {
    await page.route(WEB3FORMS_URL, (route) =>
      route.fulfill({status: 200, contentType: 'text/plain', body: 'not json'}),
    );
    await fillValidForm(page);
    await page.getByRole('button', {name: /envoyer le message/i}).click();
    await expectRecoverableError(page);
  });

  test('shows a recoverable error when the network fails', async ({page}) => {
    await page.route(WEB3FORMS_URL, (route) => route.abort('failed'));
    await fillValidForm(page);
    await page.getByRole('button', {name: /envoyer le message/i}).click();
    await expectRecoverableError(page);
  });

  test('coalesces duplicate submit events into one request', async ({page}) => {
    let requests = 0;
    await page.route(WEB3FORMS_URL, async (route) => {
      requests += 1;
      await new Promise((resolve) => setTimeout(resolve, 100));
      await route.fulfill({status: 200, contentType: 'application/json', body: '{"success":true}'});
    });
    await fillValidForm(page);
    await page.locator('#contact-form').evaluate((form) => {
      form.dispatchEvent(new Event('submit', {bubbles: true, cancelable: true}));
      form.dispatchEvent(new Event('submit', {bubbles: true, cancelable: true}));
    });
    await expect(page.locator('[data-role="form-status"]')).toContainText(/merci/i);
    expect(requests).toBe(1);
  });
});

// CONT-03: .contact-page__detail had zero horizontal padding, so the
// E-mail/Instagram label/value text sat flush against the row edges when
// the black hover-fill (::before) appeared. This describe block proves two
// facts together: (1) the text now has real breathing room, and (2) the
// hover-fill still reaches the row's true edges — ::before's `inset: 0`
// resolves against the row's padding box (not content box), so adding
// horizontal padding to the row does not shrink the fill.
test.describe('contact link-row hover-fill spacing (CONT-03)', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('E-mail/Instagram rows have 16px horizontal padding with breathing room around the text, in both locales', async ({
    page,
  }) => {
    for (const path of ['/contact/', '/en/contact/']) {
      await page.goto(path);

      const rows = page.locator('.contact-page__detail');
      const count = await rows.count();
      expect(count).toBeGreaterThanOrEqual(2);

      for (let i = 0; i < count; i += 1) {
        const row = rows.nth(i);
        const padding = await row.evaluate((el) => {
          const style = getComputedStyle(el);
          return { left: style.paddingLeft, right: style.paddingRight };
        });
        expect(padding.left).toBe('16px');
        expect(padding.right).toBe('16px');

        const rowBox = await row.boundingBox();
        const innerBox = await row.locator('.contact-page__detail-inner').boundingBox();
        expect(rowBox).toBeTruthy();
        expect(innerBox).toBeTruthy();
        expect(innerBox!.x).toBeGreaterThanOrEqual(rowBox!.x + 15);
        expect(innerBox!.x + innerBox!.width).toBeLessThanOrEqual(rowBox!.x + rowBox!.width - 15);
      }
    }
  });

  test('the hover-fill still spans the row edge-to-edge after the padding is added', async ({
    page,
  }) => {
    await page.goto('/contact/');

    const row = page.locator('.contact-page__detail').first();
    const rowBox = await row.boundingBox();
    expect(rowBox).toBeTruthy();

    const beforeWidth = await row.evaluate(
      (el) => parseFloat(getComputedStyle(el, '::before').width),
    );
    expect(Math.abs(beforeWidth - rowBox!.width)).toBeLessThanOrEqual(0.5);

    const preHoverTransform = await row.evaluate(
      (el) => getComputedStyle(el, '::before').transform,
    );

    await row.hover();

    await expect(async () => {
      const transform = await row.evaluate((el) => getComputedStyle(el, '::before').transform);
      // translateX(-101%) pre-hover vs translateX(0) (identity matrix or
      // 'none') post-hover — matrix(1, 0, 0, 1, 0, 0) is the identity
      // matrix Chromium reports for `transform: translateX(0)`.
      expect(transform === 'none' || /matrix\(1,\s*0,\s*0,\s*1,\s*0,\s*0\)/.test(transform)).toBe(
        true,
      );
      expect(transform).not.toBe(preHoverTransform);
    }).toPass();
  });
});

test.describe('contact reachability', () => {
  // sketch-012 / variant A3 (quick-260728-ek0): the numbered editorial
  // sequence (.contact-page__number "02"/"03") was dropped along with the
  // old two-column editorial grid. Reachability is now asserted against the
  // surviving channel markup instead: both alternative contact channels
  // (email + Instagram) must be present on each locale.
  test('alternative contact channels (email + Instagram) are reachable in both locales', async ({
    page,
  }) => {
    for (const path of ['/contact/', '/en/contact/']) {
      await page.goto(path);
      const emailLink = page.locator('.contact-page__detail[href^="mailto:"]');
      await expect(emailLink).toHaveCount(1);
      await expect(page.locator('.contact-page__social')).toHaveCount(1);
    }
  });

  test('Contact uses neutral black accents in both locales', async ({ page }) => {
    for (const path of ['/contact/', '/en/contact/']) {
      await page.goto(path);
      const colors = await page.locator('.contact-page').evaluate((element) => {
        const styles = getComputedStyle(element);
        return {
          accent: styles.getPropertyValue('--color-accent').trim(),
          ink: styles.getPropertyValue('--color-ink').trim(),
        };
      });

      expect(colors.accent).toBe(colors.ink);
    }
  });

  test('visitor can reach the Contact page from the header nav link', async ({ page }) => {
    // Phase 04.1: the homepage ("/") intentionally renders its own minimal,
    // immersive nav (Accueil/Galeries + carousel-grid toggle + switcher only
    // — no About/Contact) per 04.1-UI-SPEC.md's Layout Notes, matching the
    // imported design prototype. The standard site-wide header (with the
    // Contact link) still renders on every other page, so this checks
    // reachability from there instead of "/". Phase 04.3 removed the
    // standalone /galleries listing route (D-03), so this now originates
    // from /about/ — another surviving BaseLayout page whose header still
    // exposes the Contact link.
    await page.goto('/about/');
    await page.getByRole('link', { name: /^contact$/i }).click();
    await expect(page).toHaveURL(/\/contact\/?$/);
  });
});

// quick-260803-bvu (Item 8): the space between the form panel and the
// footer was entirely governed by .contact-page's own bottom padding
// (`var(--editorial-page-padding-block)`, the shared editorial token) —
// measured live via getBoundingClientRect at 89.6px at 1280x900 and 48px
// at 390x844, with no other contributor. Scoped override reduces it to a
// flat 32px at both viewports. Threshold below has generous headroom
// above the post-fix measurement while still catching a regression back
// toward the old, materially larger gap.
test.describe('contact page footer spacing (Item 8, quick-260803-bvu)', () => {
  test('the form-panel-to-footer gap stays tight at a desktop viewport', async ({ page }) => {
    // setViewportSize() BEFORE navigating (18-02-SUMMARY.md's own
    // documented discipline) so nothing reads stale geometry from a
    // previous viewport.
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/contact/');

    const gap = await page.evaluate(() => {
      const formPanel = document.querySelector('.contact-page__form-panel')!;
      const footer = document.querySelector('footer.chrome-band')!;
      return footer.getBoundingClientRect().top - formPanel.getBoundingClientRect().bottom;
    });

    expect(gap).toBeGreaterThan(0);
    expect(gap).toBeLessThan(60);
  });

  test('the footer is not disproportionately tall at a desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/contact/');

    const footerHeight = await page
      .locator('footer.chrome-band')
      .evaluate((el) => el.getBoundingClientRect().height);

    // Measured live at 93px after the fix (was 109px before, with the
    // header's own untouched desktop padding still at 32px top/bottom).
    expect(footerHeight).toBeLessThan(100);
  });
});
