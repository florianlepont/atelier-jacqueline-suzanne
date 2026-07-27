# Phase 4: Legal & Compliance - Pattern Map

**Mapped:** 2026-07-08
**Files analyzed:** 6 (4 new pages, 1 modified layout, 1 new test file; no unit-test file needed per RESEARCH.md Wave 0 Gaps)
**Analogs found:** 6 / 6

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `src/pages/mentions-legales.astro` (FR) | route/component (static content page) | request-response (prerendered static HTML) | `src/pages/about.astro` | exact |
| `src/pages/en/mentions-legales.astro` (EN) | route/component (static content page) | request-response (prerendered static HTML) | `src/pages/en/about.astro` | exact |
| `src/pages/confidentialite.astro` (FR) | route/component (static content page) | request-response (prerendered static HTML) | `src/pages/about.astro` | exact |
| `src/pages/en/confidentialite.astro` (EN) | route/component (static content page) | request-response (prerendered static HTML) | `src/pages/en/about.astro` | exact |
| `src/layouts/BaseLayout.astro` (modified — footer gets a second nav) | layout/provider | request-response | `src/layouts/BaseLayout.astro` (existing header `<nav>`/`getRelativeLocaleUrl` block, same file) | exact (self-modification, extend existing pattern in place) |
| `tests/e2e/legal.spec.ts` (new) | test | request-response (e2e page assertions) | `tests/e2e/about.spec.ts` + `tests/e2e/i18n.spec.ts` (switcher subset) | exact |

No unit-test file is needed: this phase introduces no new pure functions (reuses `getRelativeLocaleUrl`/`getSwitcherHref` unchanged), per RESEARCH.md's Wave 0 Gaps note.

## Pattern Assignments

### `src/pages/mentions-legales.astro` / `src/pages/confidentialite.astro` (FR, route, request-response)

**Analog:** `src/pages/about.astro` (read in full this session, 65 lines)

**Imports pattern** (lines 1-11):
```astro
---
// French About page (ABOUT-01, ABOUT-02): bio + atelier/practice section.
// Hardcoded content (Pattern 3 — no Sanity fetch): ...
import BaseLayout from '../layouts/BaseLayout.astro';
---
```
Both new FR legal pages live at `src/pages/*.astro` (same directory depth as `about.astro`), so the import path is identical: `import BaseLayout from '../layouts/BaseLayout.astro';`. Lead the frontmatter comment with the requirement IDs this page satisfies (LEGAL-01 / LEGAL-03) and a one-line note that this is hardcoded content (no Sanity fetch), same rationale style as `about.astro`'s comment.

**Core structural pattern** (lines 13-30):
```astro
<BaseLayout title="À propos — Atelier Jacqueline Suzanne">
  <div class="about-page">
    <h1>À propos</h1>
    <p class="placeholder">
      Le texte de présentation de Romane sera bientôt disponible ici — en attente de sa version
      définitive.
    </p>
    <h2>Atelier &amp; pratique</h2>
    <p class="placeholder">
      Informations sur l'atelier et la pratique de Romane à venir prochainement.
    </p>
  </div>
</BaseLayout>
```
Reuse this exact shape for the legal pages: one `<h1>` page title, one or more `<h2>` section headers (e.g. "Éditeur du site", "Hébergement", "Statut" for mentions légales; "Données collectées", "Cookies", "Vos droits" for the privacy page), `<p>` body copy under each. Rename the wrapper class per page (e.g. `.legal-page` — RESEARCH.md's own Pattern 1 code example already proposes this exact name) rather than reusing `.about-page` literally, but copy the CSS values verbatim (see below). Use the `.placeholder` class (see below) ONLY for genuinely-pending fields (business status wording, address/phone placeholder per D-09) — most legal copy in this phase is final text, not a placeholder, unlike About's fully-deferred bio.

**Placeholder-field pattern** (lines 17-19, 25-27, 62-64):
```astro
<p class="placeholder">
  Précisions sur le médium et la technique à venir — en attente de confirmation avec
  l'artiste.
</p>
```
```css
.about-page .placeholder {
  font-style: italic;
}
```
Apply this identical `.placeholder`/italic treatment to the D-09 address/phone placeholder field on the mentions légales page ("consistent with 04-UI-SPEC.md's existing placeholder treatment" per CONTEXT.md D-09) — do not invent a new visual pattern for "field is pending."

**Style block pattern** (lines 32-65, copy verbatim with class rename):
```css
.about-page {
  max-width: 640px;
  margin: 0 auto;
  padding: var(--space-2xl) var(--space-md);
}

.about-page h1 {
  container-type: inline-size;
  font-size: clamp(2.5rem, 12cqi, 6.5rem); /* Display role */
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.02em;
  margin: 0 0 var(--space-xl);
}

.about-page h2 {
  font-size: 20px; /* Heading role */
  font-weight: 900;
  line-height: 1.2;
  margin: var(--space-2xl) 0 var(--space-md);
}

.about-page p {
  font-size: 16px; /* Body role */
  font-weight: 300;
  line-height: 1.5;
  margin: 0 0 var(--space-md);
}
```
This is the locked "single flowing page" visual pattern (03-CONTEXT.md D-02/D-03 precedent, reaffirmed by 04-CONTEXT.md's Claude's-Discretion note and 04-RESEARCH.md Pattern 1). Copy every rule as-is, only renaming the `.about-page` selector to `.legal-page` (or similar) in each new file's scoped `<style>` block.

---

### `src/pages/en/mentions-legales.astro` / `src/pages/en/confidentialite.astro` (EN, route, request-response)

**Analog:** `src/pages/en/about.astro` (read in full this session, 63 lines)

Identical to the FR analog above, except:
- Import path is one level deeper: `import BaseLayout from '../../layouts/BaseLayout.astro';` (line 10 of `en/about.astro`).
- **Slug must exactly match the FR page's slug** — `src/pages/en/mentions-legales.astro` (NOT `legal-notice.astro`), `src/pages/en/confidentialite.astro` (NOT `privacy-policy.astro`). This is RESEARCH.md's Pitfall 1: `getSwitcherHref()` in `src/lib/i18n-paths.ts` (lines 25-56, already read) does a simple `/en/` prefix strip/re-add with no slug-translation lookup — a mismatched EN slug produces a silently-broken switcher link (404). Only the `<h1>`/body copy differs between locales, never the file's slug segment.
- `<BaseLayout title="...">` title copy and all `<h1>`/`<h2>`/`<p>` text are translated; CSS class names and structure stay identical.

---

### `src/layouts/BaseLayout.astro` (modified — footer legal-links nav)

**Analog:** the file's own existing header `<nav>` block (same file, lines 76-85) and frontmatter URL-building pattern (lines 26-40) — this is a self-extension, not a copy from a different file.

**Existing frontmatter URL-building pattern to replicate** (lines 33-40):
```astro
// About content is not in CMS scope (CMS-01 is galleries-only), so this
// label is a hardcoded locale conditional rather than a Sanity navLabels
// field.
const aboutLabel = locale === 'en' ? 'About' : 'À propos';
const aboutHref = getRelativeLocaleUrl(locale, 'about');
// Contact content is likewise outside CMS-01's galleries-only scope.
const contactLabel = locale === 'en' ? 'Contact' : 'Contact';
const contactHref = getRelativeLocaleUrl(locale, 'contact');
```
Add two more locale-conditional label/href pairs following this exact shape:
```astro
const legalNoticeLabel = locale === 'en' ? 'Legal notice' : 'Mentions légales';
const legalNoticeHref = getRelativeLocaleUrl(locale, 'mentions-legales');
const privacyLabel = locale === 'en' ? 'Privacy' : 'Confidentialité';
const privacyHref = getRelativeLocaleUrl(locale, 'confidentialite');
```
(Import `getRelativeLocaleUrl` is already present at line 6 — no new import needed.)

**Existing footer to extend** (lines 89-91, current state):
```astro
<footer class="chrome-band">
  <p class="footer-text">{footerText}</p>
</footer>
```
**Target shape** (per RESEARCH.md's own "Footer nav extension pattern" code example, and D-06):
```astro
<footer class="chrome-band">
  <p class="footer-text">{footerText}</p>
  <nav class="footer-legal-nav" aria-label="Legal">
    <a href={legalNoticeHref} class="nav-link">{legalNoticeLabel}</a>
    <a href={privacyHref} class="nav-link">{privacyLabel}</a>
  </nav>
</footer>
```
Reuse the existing `.nav-link` class (already styled at lines 215-225 of the `<style>` block) for the new footer links rather than inventing new link styling — it already has the correct font-size/hover/focus-visible treatment. Add a new `.footer-legal-nav` rule only if layout spacing (e.g. `display: flex; gap: var(--space-md);`) is needed; do not duplicate `.nav-link`'s properties into a new class.

**Auth/guard pattern:** N/A — no auth on this static site.

**Error handling pattern:** N/A — no runtime logic; `siteSettings?.field?.[locale] ?? fallback` optional-chaining defensive pattern (lines 23-25) is the only "error handling" equivalent, and is not needed here since legal-page labels are hardcoded locale conditionals (matching the existing `aboutLabel`/`contactLabel` precedent), not Sanity-sourced.

---

### `tests/e2e/legal.spec.ts` (new, test, request-response e2e)

**Analog:** `tests/e2e/about.spec.ts` (read in full, 71 lines) for page-content assertions; `tests/e2e/i18n.spec.ts` (read in full, 86 lines) for the switcher-navigation assertion pattern.

**RED-first framing comment pattern** (about.spec.ts lines 3-8):
```typescript
import { test, expect } from '@playwright/test';

// RED (Wave 0): src/pages/about.astro, src/pages/en/about.astro, and the
// About nav link in BaseLayout.astro do not exist yet — those are built in
// Task 2 of this plan. These assertions target the real ABOUT-01/ABOUT-02
// contracts (bio copy, atelier/practice copy, D-06 locked medium/technique
// placeholder, nav reachability) and are expected to FAIL (404s / missing
// nav link) until then — do not stub or weaken them to make them pass early.
```
Open `legal.spec.ts` with the same RED-first disclaimer, referencing LEGAL-01/LEGAL-03/LEGAL-05 and the pages/footer-nav this plan will build.

**Page-render + lang + content assertion pattern** (about.spec.ts lines 10-30):
```typescript
test.describe('about page content', () => {
  test('French About page renders bio, atelier/practice, and D-06 placeholder copy at "/about/"', async ({
    page,
  }) => {
    await page.goto('/about/');

    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.locator('h1')).toContainText('À propos');

    const main = page.locator('main');
    await expect(main).toContainText('...');
    await expect(page.getByText('Atelier & pratique')).toBeVisible();
  });
  // ... English counterpart, ... "copy differs between FR/EN" diff test
});
```
Mirror this three-tier structure per new page (French render + `lang="fr"` + section content; English render + `lang="en"` + section content; a "copy differs" diff test) for both `mentions-legales` and `confidentialite`.

**Footer nav reachability assertion pattern** (about.spec.ts lines 63-69, adapted from header to footer):
```typescript
test('the header nav links to the About page from "/"', async ({ page }) => {
  await page.goto('/');
  await page.locator('header').getByRole('link', { name: 'À propos' }).click();
  await expect(page).toHaveURL(/\/about\/$/);
});
```
Adapt to `page.locator('footer').getByRole('link', { name: 'Mentions légales' }).click()` / `'Confidentialité'`, asserting the resulting URL, for D-06's footer-link requirement.

**Switcher slug-regression pattern** (i18n.spec.ts lines 43-56, the exact pattern RESEARCH.md's Pitfall 1 warning-sign calls for):
```typescript
test.describe('switcher', () => {
  test('clicking the switcher from "/" navigates to "/en/"', async ({ page }) => {
    await page.goto('/');
    await page.locator('header').getByRole('link', { name: 'EN' }).click();
    await expect(page).toHaveURL(/\/en\/$/);
  });
  // ... reverse direction
});
```
Add an equivalent pair scoped to the new pages: navigate to `/mentions-legales/`, click the switcher, assert the URL becomes `/en/mentions-legales/` (and reverse), then repeat for `/confidentialite/`. This is the required regression test RESEARCH.md's Validation Architecture section calls out explicitly ("Language switcher correctly navigates between FR/EN legal pages at matching slugs").

**Cookie-absence assertion pattern** (adapted from i18n.spec.ts's cookie-presence check, lines 58-67 — inverted for LEGAL-05's "no cookie is set by loading either legal page" requirement):
```typescript
const cookies = await context.cookies();
const localeCookie = cookies.find((cookie) => cookie.name === COOKIE_NAME);
expect(localeCookie?.value).toBe('en'); // i18n.spec.ts asserts presence after a click
```
For `legal.spec.ts`, invert this: `await page.goto('/mentions-legales/')` with NO switcher click, then assert `context.cookies()` contains no `ajs_locale` cookie (proving the legal pages themselves set nothing on load — only the explicit switcher click, tested separately, sets it).

---

## Shared Patterns

### Bilingual page-pair structure (FR root / EN under `/en/`, identical slug)
**Source:** `src/pages/about.astro` + `src/pages/en/about.astro`
**Apply to:** All 4 new page files.
Same directory convention, same import-depth difference (`../layouts/` vs `../../layouts/`), same `<BaseLayout title="...">` wrapper. Astro's i18n config (`prefixDefaultLocale: false`, FR at root) is unchanged — no `astro.config.mjs` edit needed for this phase.

### "Single flowing page" content layout
**Source:** `src/pages/about.astro` `<style>` block, lines 32-65
**Apply to:** All 4 new legal pages — copy the CSS verbatim (only the wrapper class name changes, e.g. `.legal-page`).
```css
.legal-page {
  max-width: 640px;
  margin: 0 auto;
  padding: var(--space-2xl) var(--space-md);
}
```

### Locale-conditional hardcoded labels (no Sanity involvement)
**Source:** `src/layouts/BaseLayout.astro` lines 36-40 (`aboutLabel`, `contactLabel`)
**Apply to:** New `legalNoticeLabel`/`privacyLabel` frontmatter constants in `BaseLayout.astro`.
Confirms the established precedent: non-CMS static content (About, Contact, and now Legal) uses `locale === 'en' ? '...' : '...'` ternaries, never Sanity `siteSettings` fields — consistent with RESEARCH.md's explicit rejection of a new `legalPage` Sanity schema.

### Shared-slug i18n switcher constraint
**Source:** `src/lib/i18n-paths.ts` lines 25-56 (`getSwitcherHref`), `src/components/LanguageSwitcher.astro` lines 5-9
**Apply to:** Both new page pairs — FR and EN files MUST use the identical slug string (`mentions-legales`, `confidentialite`) under their respective locale roots. No code change needed to `i18n-paths.ts` itself; this is a naming constraint on the new files, not a logic change.

### `ajs_locale` cookie disclosure content (not a code pattern, but load-bearing for privacy-page copy accuracy)
**Source:** `src/components/LanguageSwitcher.astro` lines 66-89
**Apply to:** `confidentialite.astro`'s Cookies section — must accurately describe: cookie name `ajs_locale`, set only on explicit FR/EN link click (not automatically on page load), `path` scoped to the deployed base, `max-age=31536000` (1 year), `SameSite=Lax; Secure`. This is the one concrete technical fact the privacy page's cookie section must get right, sourced directly from this file rather than invented.

### Reused contact email address
**Source:** `src/components/ContactForm.astro` lines 35-36
**Apply to:** Both `mentions-legales.astro` (Éditeur du site "E-mail" field) and `confidentialite.astro` (data-controller contact).
`contact@atelierjacquelinesuzanne.fr` is the existing site-wide contact alias already referenced in the contact form's own error-message copy — reuse this address rather than inventing a new one.

## No Analog Found

None. All 6 files in scope have a strong (exact/role-match) existing analog in the codebase; no file requires falling back to RESEARCH.md's generic code examples in place of a real analog.

## Metadata

**Analog search scope:** `src/pages/`, `src/layouts/`, `src/components/`, `src/lib/`, `tests/e2e/`
**Files scanned:** `src/pages/about.astro`, `src/pages/en/about.astro`, `src/layouts/BaseLayout.astro`, `src/lib/i18n-paths.ts`, `src/components/LanguageSwitcher.astro`, `src/components/ContactForm.astro`, `tests/e2e/about.spec.ts`, `tests/e2e/i18n.spec.ts` (8 files read directly this session)
**Pattern extraction date:** 2026-07-08
