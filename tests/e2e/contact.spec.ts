import { test, expect } from '@playwright/test';

// RED (Wave 0): src/lib/contact-form.ts, src/components/ContactForm.astro,
// and the /contact/ + /en/contact/ routes do not exist yet — they are built
// in Plan 03-02 Tasks 2/3. These assertions target the real contracts
// documented in 03-RESEARCH.md (Pitfall 2: never hit the real Web3Forms
// endpoint in CI, always mock via page.route()) and 03-UI-SPEC.md (Form
// Interaction States: exact success/error/validation copy) and are expected
// to FAIL until then — do not stub or weaken them to make them pass early.

const WEB3FORMS_URL = 'https://api.web3forms.com/submit';

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
    const urlBefore = page.url();

    await page.getByLabel(/^nom$/i).fill('Jeanne Dupont');
    await page.getByLabel(/^e-mail$/i).fill('jeanne@example.com');
    await page.getByLabel(/^message$/i).fill('Bonjour, je souhaite vous contacter.');
    await page.getByRole('button', { name: /envoyer le message/i }).click();

    const status = page.locator('[data-role="form-status"]');
    await expect(status).toHaveText(/merci, votre message a bien été envoyé/i);
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
});

test.describe('contact reachability', () => {
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
