# Phase 3: About & Contact - Pattern Map

**Mapped:** 2026-07-07
**Files analyzed:** 9 (4 pages, 1 component, 1 lib module, 3 test files) — plus 1 shared-config touch (`.env.example`)
**Analogs found:** 9 / 9

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `src/pages/about.astro` | route (static page) | request-response (build-time render) | `src/pages/galleries/index.astro` | exact (locale-pair static content page) |
| `src/pages/en/about.astro` | route (static page) | request-response (build-time render) | `src/pages/en/galleries/index.astro` | exact |
| `src/pages/contact.astro` | route (static page + island host) | request-response (page) / event-driven (form) | `src/pages/galleries/[slug].astro` (page hosting an island) | role-match |
| `src/pages/en/contact.astro` | route (static page + island host) | request-response (page) / event-driven (form) | `src/pages/en/galleries/[slug].astro` | role-match |
| `src/components/ContactForm.astro` | component (vanilla-JS island) | event-driven + request-response (fetch to external API) | `src/components/Lightbox.astro` | exact (dependency-free `<script>` island, DOM-query style, typed) |
| `src/lib/contact-form.ts` | utility (pure functions) | transform (validation) | `src/lib/i18n-paths.ts` | exact (pure exported functions, no Node-only APIs, unit-tested directly) |
| `tests/unit/contact-form.test.ts` | test (unit) | transform | `tests/unit/i18n-paths.test.ts` | exact (plain Vitest, direct import of pure functions, RED-state framing) |
| `tests/e2e/about.spec.ts` | test (e2e) | request-response | `tests/e2e/i18n.spec.ts` | exact (Playwright, locale-pair content assertions) |
| `tests/e2e/contact.spec.ts` | test (e2e) | event-driven (form submit + mocked network) | `tests/e2e/gallery.spec.ts` (for interaction assertions) + Common Pitfall 2 guidance (for `page.route()` mocking, no existing analog for network mocking in this repo) | role-match (interaction pattern), no analog for network mocking specifically — see "No Analog Found" |
| `.env.example` (add `PUBLIC_WEB3FORMS_ACCESS_KEY`) | config | n/a | `.env.example` (existing file, modified not created) | exact (same file, new line following existing `SANITY_*` convention) |

## Pattern Assignments

### `src/pages/about.astro` / `src/pages/en/about.astro` (route, static content)

**Analog:** `src/pages/galleries/index.astro` / `src/pages/en/galleries/index.astro`

**Imports pattern** (galleries/index.astro lines 1-9):
```astro
---
// French gallery listing (PORT-01): grid of gallery cards in Romane's manual
// order (D-10, via getGalleries()'s orderRank sort). Mirrors the FR/EN page
// pair pattern from src/pages/index.astro — only import depth and locale key
// differ from the EN counterpart at src/pages/en/galleries/index.astro.
import BaseLayout from '../../layouts/BaseLayout.astro';
import GalleryGrid from '../../components/GalleryGrid.astro';
import GalleryCard from '../../components/GalleryCard.astro';
import { getGalleries } from '../../lib/sanity';

const galleries = await getGalleries();
---
```
For About, drop the `GalleryGrid`/`getGalleries` imports entirely (Pattern 3 in RESEARCH.md: hardcoded content, no Sanity fetch) — the frontmatter becomes just the `BaseLayout` import, following the "no data fetch needed" shape rather than mimicking a fetch that doesn't apply. Note the file-level header comment convention (explaining what this page is and which requirement/decision drives it) — replicate for About/Contact citing ABOUT-01/ABOUT-02/D-01…D-06.

**Import depth note:** `src/pages/about.astro` is one level shallower than `src/pages/galleries/index.astro` (`../../layouts/...` → `../layouts/...`), matching `src/pages/index.astro`'s depth instead — verify actual relative path against `src/pages/index.astro`, not the galleries example, since About/Contact are top-level pages like the homepage, not nested under a feature directory.

**Core static-content pattern** (galleries/index.astro lines 14-32, with empty-state branching removed since About always has content, even if placeholder):
```astro
<BaseLayout title="Galeries — Atelier Jacqueline Suzanne">
  <div class="galleries-page">
    <h1>Galeries</h1>
    ...
  </div>
</BaseLayout>
```
Apply directly: `<h1>À propos</h1>` (FR) / `<h1>About</h1>` (EN), Display role, no panel (per `03-UI-SPEC.md` — explicitly the opposite of `gallery-detail.astro`'s Wild-Strawberry-panel `<h1>` treatment; do NOT copy that panel wrapper for About/Contact `<h1>`s).

**Section-break / placeholder-copy pattern** — no direct analog exists in this codebase for "italic placeholder paragraph"; this is a new but simple pattern. Style block for the Display `<h1>` should still be copied verbatim from `galleries/index.astro` lines 39-45 (the `container-type: inline-size; font-size: clamp(...)` mechanism is exact and locked by `02-UI-SPEC.md`/`03-UI-SPEC.md`):
```css
.about-page h1 { /* rename selector, keep declarations identical */
  container-type: inline-size;
  font-size: clamp(2.5rem, 12cqi, 6.5rem); /* Display role */
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.02em;
  margin: 0 0 var(--space-xl);
}
```
Add new (no existing analog, author fresh per UI-SPEC Layout Notes): `max-width: 640px; margin: 0 auto;` wrapper (matches the `.empty-state` max-width precedent, lines 48-53 of the same file), `var(--space-2xl)` gap between bio and atelier sections, `var(--space-md)` gap between a Heading-role subheading and its paragraph, and `.placeholder { font-style: italic; }` for the D-06 medium/technique paragraph.

**Locale-pair mirroring convention:** Confirmed identical structure between FR/EN variants (compare the two `galleries/index.astro` reads above) — only copy strings and import-path depth differ, never logic or class names. Apply the same discipline to `about.astro`/`en/about.astro` and `contact.astro`/`en/contact.astro`.

---

### `src/pages/contact.astro` / `src/pages/en/contact.astro` (route, page hosting an island)

**Analog:** `src/pages/galleries/[slug].astro` (for the "page imports and mounts an island component, passing `locale` as a prop" pattern) + `src/pages/galleries/index.astro` (for the plain static-page shell)

**Core pattern** (galleries/[slug].astro lines 1-16, 38-42, 71):
```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import GalleryGrid from '../../components/GalleryGrid.astro';
import Lightbox from '../../components/Lightbox.astro';
...
const locale = 'fr' as const;
---

<BaseLayout title={`...`}>
  <div class="gallery-detail">
    <h1>{gallery.title}</h1>
  </div>
  ...
</BaseLayout>
<Lightbox images={gallery.images} locale={locale} />
```
Apply directly to Contact: `<h1>Contact</h1>` (Display, no panel — see About note above), an optional one-line Body lead-in, then `<ContactForm locale={locale} />` mounted the same way `<Lightbox images={...} locale={locale} />` is mounted at the bottom of the `<BaseLayout>` body — i.e., the island receives `locale` as a build-time prop exactly like Lightbox does, so it can localize its own labels/errors without a second data source.

**Locale hardcode convention:** `const locale = 'fr' as const;` in the FR page, `'en' as const;` in the EN page (see `galleries/[slug].astro` line 30) — reuse verbatim, do not derive locale from `Astro.currentLocale` on these pages (BaseLayout already does that internally for chrome; page-level `locale` constants are for passing to child components/props).

---

### `src/components/ContactForm.astro` (component, vanilla-JS island)

**Analog:** `src/components/Lightbox.astro`

**Imports pattern** (Lightbox.astro lines 16-24):
```astro
---
// [File-level comment block explaining the island's contract, citing the
// research pattern/decision numbers driving it — Lightbox cites
// 02-RESEARCH.md Pattern 3; ContactForm should cite 03-RESEARCH.md Pattern 1/2]
import { fullSizeUrl } from '../lib/image';
import type { GalleryImage } from '../lib/sanity';

interface Props {
  images: GalleryImage[];
  locale: 'fr' | 'en';
}

const { images, locale } = Astro.props;

const ariaLabel = locale === 'en' ? 'Image viewer' : 'Visionneuse d’image';
```
For ContactForm: `import { isHoneypotTriggered, isValidEmail } from '../lib/contact-form';` is a **client-`<script>`-only** import (not frontmatter) since validation runs on submit, not at render time — but the *labels* (field labels, button text, error copy) follow Lightbox's exact frontmatter-computed-per-locale-string pattern:
```astro
interface Props {
  locale: 'fr' | 'en';
}
const { locale } = Astro.props;
const nameLabel = locale === 'en' ? 'Name' : 'Nom';
const emailLabel = locale === 'en' ? 'Email' : 'E-mail';
const messageLabel = locale === 'en' ? 'Message' : 'Message';
const submitLabel = locale === 'en' ? 'Send message' : 'Envoyer le message';
// ...all UI-SPEC Copywriting Contract strings computed here, once, in frontmatter
```

**Hook-contract / data-role convention** (Lightbox.astro lines 58-59, 67-71, comment lines 10-15):
```astro
<img data-role="lightbox-image" class="lightbox__image" alt="" />
<p data-role="counter" class="lightbox__counter" aria-live="polite"></p>
```
```astro
<ul hidden data-role="lightbox-data">
  {slides.map((slide) => <li data-src={slide.src} data-alt={slide.alt} />)}
</ul>
```
Apply the same `data-role="..."` attribute convention (not `id`, not a class) for ContactForm's live region and the honeypot field, e.g. `<p data-role="form-status" aria-live="polite"></p>` and `<input data-role="honeypot" name="website" ...>` — matches the existing project-wide convention for "elements a `<script>` needs to query, that aren't styling hooks."

**Core `<script>` pattern** (Lightbox.astro lines 73-91, DOM-query + null-guard style):
```typescript
<script>
  interface Slide { src: string; alt: string; }

  const dialog = document.getElementById('lightbox') as HTMLDialogElement | null;
  const dataEl = document.querySelector<HTMLUListElement>('ul[data-role="lightbox-data"]');

  if (dialog && dataEl) {
    // all logic nested inside this guard — never assume elements exist
    ...
  }
</script>
```
ContactForm's `<script>` should follow the exact same shape (RESEARCH.md's own Code Examples section already drafts this in Astro-idiomatic terms — see `03-RESEARCH.md` "Full submit handler shape"): guard on `form` and `liveRegion` existing before attaching the `submit` listener, never assume DOM structure unconditionally.

**Event listener / state-machine pattern** (Lightbox.astro lines 132-153, direct `addEventListener` calls, no framework, single responsibility per handler):
```typescript
closeBtn?.addEventListener('click', () => dialog!.close());
prevBtn?.addEventListener('click', showPrev);
nextBtn?.addEventListener('click', showNext);

dialog.addEventListener('keydown', (e) => { ... });
dialog.addEventListener('close', () => { trigger?.focus(); });
```
ContactForm applies the identical shape for its one `submit` listener (see RESEARCH.md's full example, already drafted in the project's own idiom) — `e.preventDefault()`, honeypot check, validation, `fetch()`, render success/error into the `[data-role="form-status"]` element.

**Scoped `<style>` block convention** (Lightbox.astro lines 198-269): component-prefixed BEM-ish class names (`lightbox__control`, `lightbox__image`), 44px tap-target floor applied via `min-width`/`min-height` + `padding` (not font-size), `:focus-visible` outline matching the site-wide double-ring token exactly. Apply the same class-naming convention (`contact-form__field`, `contact-form__label`, etc.) and reuse the identical focus-visible block verbatim from `BaseLayout.astro` (see Shared Patterns below) rather than Lightbox's dark-scrim variant (Lightbox's focus ring uses `--color-dominant` because it sits on a dark backdrop — ContactForm sits on the normal page background, so it should copy `BaseLayout.astro`'s ink/accent double-ring instead, not Lightbox's).

---

### `src/lib/contact-form.ts` (utility, pure functions)

**Analog:** `src/lib/i18n-paths.ts`

**Structure pattern** (i18n-paths.ts lines 1-23, 58-72):
```typescript
import { getRelativeLocaleUrl } from 'astro:i18n';

/**
 * [JSDoc explaining the *why*, citing the research pattern driving this
 * function's existence, not just what it does]
 */
export function stripBasePath(path: string, base: string): string {
  return base !== '/' && path.startsWith(base) ? path.slice(base.length - 1) : path;
}
```
`contact-form.ts` follows this exactly: no class, no default export, each function is small, pure, independently named and exported, with a JSDoc/comment block citing the RESEARCH.md pattern number (e.g. "Pattern 1: Client-side-only honeypot short-circuit"). RESEARCH.md already specifies the two required functions verbatim:
```typescript
// src/lib/contact-form.ts
export function isHoneypotTriggered(value: string): boolean {
  return value.trim().length > 0;
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
```
Add a third pure function for required-field checks (implied by UI-SPEC's per-field error copy but not yet drafted in RESEARCH.md's code — follow the same signature style, e.g. `isBlank(value: string): boolean`).

**Critical constraint carried from the analog:** `i18n-paths.ts` contains zero Node-only APIs (no `fs`, no `process` outside of already-guarded env reads) specifically because it's imported both at Astro build time AND needs to stay import-safe for Vitest — `contact-form.ts` has an even stricter version of this constraint per RESEARCH.md: it must also be safe to ship into the **client-side bundle** (imported directly inside `ContactForm.astro`'s `<script>` tag), so it must never import `astro:i18n`, `sanity.ts`, or anything Node/build-only the way `i18n-paths.ts` does with `astro:i18n`. Do not copy the `astro:i18n` import — that's the one part of the analog that must NOT carry over.

---

### `tests/unit/contact-form.test.ts` (test, unit)

**Analog:** `tests/unit/i18n-paths.test.ts`

**Structure pattern** (lines 1-8, 35-50):
```typescript
import { describe, expect, it } from 'vitest';
import { getSwitcherHref, stripBasePath } from '../../src/lib/i18n-paths';

// RED (Wave 0): src/lib/i18n-paths.ts does not exist yet — it is built in
// Plan 04. This import failure is the intended failing state for this task;
// do not stub or weaken these assertions to make them pass early.

describe('getSwitcherHref', () => {
  it('maps the French homepage to the English homepage', () => {
    expect(getSwitcherHref('/', 'en')).toBe('/en/');
  });
  ...
});
```
Apply directly: `describe('isHoneypotTriggered', ...)`, `describe('isValidEmail', ...)`, `describe('isBlank', ...)` (or whatever the third function is named), each with plain `it(...)` cases, no mocking needed (these are pure functions with no external dependencies — simpler than `gallery-query.test.ts`'s `vi.mock('@sanity/client', ...)` pattern, which does NOT apply here since `contact-form.ts` has no external client to mock). Keep the "RED (Wave 0)" comment convention citing which plan builds the file being tested.

---

### `tests/e2e/about.spec.ts` (test, e2e)

**Analog:** `tests/e2e/i18n.spec.ts`

**Structure pattern** (lines 1-8, 10-27, 29-40):
```typescript
import { test, expect } from '@playwright/test';

// RED (Wave 0): ... These assertions target the real contracts built in
// Plans 03/04 and are expected to FAIL until then — do not stub or weaken
// them to make them pass early.

test.describe('locale content', () => {
  test('French chrome and placeholder homepage render at "/"', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    ...
  });
  ...
  test('site-title/nav/footer copy differs between the French and English pages', async ({ page }) => {
    await page.goto('/');
    const frHeader = await page.locator('header').innerText();
    await page.goto('/en/');
    const enHeader = await page.locator('header').innerText();
    expect(enHeader).not.toBe(frHeader);
  });
});
```
Apply directly for About: `page.goto('/about/')` / `page.goto('/en/about/')`, assert `<h1>` text, assert bio/atelier paragraph text differs FR vs EN (mirrors the "copy differs between locales" assertion style exactly), assert the D-06 placeholder paragraph text matches the exact locked copy from `03-UI-SPEC.md` Layout Notes.

---

### `tests/e2e/contact.spec.ts` (test, e2e)

**Analog (interaction/navigation style):** `tests/e2e/gallery.spec.ts` (for `page.goto`, `page.getByRole`, `page.keyboard.press` idioms) — **no existing analog for network-mocking** (`page.route()`), since no prior phase has made an external fetch call from client JS. RESEARCH.md's Pitfall 2 explicitly specifies the required approach:

```
Do not gate CI on a real network call to Web3Forms. Instead: (a) unit-test the
pure validation/honeypot functions directly, (b) in Playwright e2e tests,
intercept/mock the fetch() call (page.route()) to assert the correct payload
and that the inline success UI renders, and (c) reserve exactly one real,
human-verified submission ... as a manual checkpoint, not an automated gate.
```

Combine `gallery.spec.ts`'s interaction style (`page.getByRole`, filling inputs, `await expect(...).toBeVisible()`) with a `page.route('https://api.web3forms.com/submit', route => route.fulfill({ ... }))` intercept — this is new ground for the codebase; there is no in-repo precedent to copy verbatim for the `page.route()` call itself, only for the surrounding Playwright test scaffolding (imports, `test.describe`, `RED (Wave 0)` comment convention, `async ({ page }) => {}` signature).

---

## Shared Patterns

### Locale-pair FR/EN page mirroring
**Source:** `src/pages/galleries/index.astro` + `src/pages/en/galleries/index.astro` (and the `[slug].astro` pair)
**Apply to:** All four new page files (`about.astro`, `en/about.astro`, `contact.astro`, `en/contact.astro`)
```
Only import relative-path depth and hardcoded copy strings differ between the
FR and EN file in each pair — component structure, class names, and <style>
blocks are byte-identical. Never introduce a third structural variant.
```

### Focus-visible double ring (site-wide token)
**Source:** `src/layouts/BaseLayout.astro` lines 150-155
**Apply to:** `ContactForm.astro`'s inputs, textarea, and submit button (per `03-UI-SPEC.md` Layout Notes: "reuse the existing site-wide double-ring `:focus-visible` pattern... no new focus treatment invented for this phase")
```css
a:focus-visible,
button:focus-visible {
  outline: 2px solid var(--color-ink);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px var(--color-accent);
}
```
Extend the selector list in `ContactForm.astro`'s scoped `<style>` to include `input:focus-visible, textarea:focus-visible` with the identical declaration block (do not invent new outline colors/widths).

### 44px tap-target-floor via padding, not font-size
**Source:** `src/components/LanguageSwitcher.astro` lines 40-41 and `src/components/Lightbox.astro` lines 228-229
**Apply to:** `ContactForm.astro`'s name input, email input, and submit button (per `03-UI-SPEC.md` Spacing Scale exceptions)
```css
min-height: 44px; /* WCAG 2.5.5 tap-target floor, applied via padding not font-size */
padding: 8px; /* sm spacing token */
```

### Design tokens (colors, spacing) — single source of truth
**Source:** `src/layouts/BaseLayout.astro` lines 96-112 (`:root` custom properties)
**Apply to:** Every new file's `<style>` block — never hardcode a hex value or px spacing that has a token; this phase's only new token usage is `var(--color-destructive)` (`#dc2626`), already defined but previously unused — reference it, do not redefine it.

### Vanilla-JS island — no framework
**Source:** `src/components/Lightbox.astro` (full file) and `src/components/LanguageSwitcher.astro` (full file)
**Apply to:** `ContactForm.astro`
```
Confirmed project-wide convention (no React/Preact/Vue anywhere in
package.json or src/): typed <script> tag, document.querySelector with
generic type params, addEventListener-based state machine, no client
directives (no client:load/client:visible — Astro islands here are plain
<script> tags inside .astro files, not framework components).
```

### Env var naming/scoping convention
**Source:** `.env.example` (existing file) + RESEARCH.md's citation of `docs.astro.build/en/guides/environment-variables/`
**Apply to:** Adding `PUBLIC_WEB3FORMS_ACCESS_KEY` to `.env.example`, local `.env`, and CI
```
# Existing convention: comment above each var explaining where/how to obtain
# it, plus a note on whether it's build-time-only or also client-exposed.
# SANITY_* vars are build-time-only (no PUBLIC_ prefix, never shipped to the
# browser). PUBLIC_WEB3FORMS_ACCESS_KEY breaks this pattern deliberately —
# it MUST carry the PUBLIC_ prefix because it needs to be inlined into
# client-shipped JS (Astro/Vite's documented mechanism), and per RESEARCH.md
# this is by design not a secret (Web3Forms' own docs embed it in plain HTML).
```

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `page.route()` network-mocking logic inside `tests/e2e/contact.spec.ts` | test (e2e) | event-driven / mocked request-response | No prior phase has made a client-side `fetch()` call to an external API, so there is no existing Playwright network-interception precedent in this repo. Use RESEARCH.md's own Pitfall 2/Validation Architecture guidance directly (already cites `page.route()` explicitly) rather than searching further — this is a well-documented Playwright API, not a project-specific pattern to reverse-engineer from other files. |
| D-06/placeholder-paragraph italic styling convention | n/a (CSS convention) | n/a | No prior phase has a "placeholder/coming-soon inline paragraph" styled with `font-style: italic` as the sole marker — `03-UI-SPEC.md` Layout Notes already fully specifies this (font-style: italic, no box/border/background), so no codebase analog is needed; treat the UI-SPEC text as the source of truth directly. |

## Metadata

**Analog search scope:** `src/pages/**`, `src/components/**`, `src/layouts/**`, `src/lib/**`, `tests/unit/**`, `tests/e2e/**`, `.env.example` — entire application source tree (small enough for exhaustive review; no sampling needed).
**Files scanned:** 13 source files + 4 test files + 1 config file, all read in full (largest file, `BaseLayout.astro`, is 232 lines — well under the 2,000-line large-file threshold).
**Pattern extraction date:** 2026-07-07
