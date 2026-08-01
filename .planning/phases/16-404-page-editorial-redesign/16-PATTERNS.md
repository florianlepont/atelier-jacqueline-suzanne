# Phase 16: 404 Page Editorial Redesign - Pattern Map

**Mapped:** 2026-07-29
**Files analyzed:** 6 (1 rewritten page, 1 new lib module, 1 new unit test, 2 modified e2e specs, 0 new components)
**Analogs found:** 6 / 6

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|---------------|
| `src/pages/404.astro` (rewrite) | route/page (build-time data fetch + static markup + client `<script>` island) | request-response (static) + event-driven (pointer/touch client engine) | `src/pages/index.astro` (photo-pool sourcing) + `src/components/DetailHero.astro` (scrim + client-script conventions) | exact (composite — no single file covers both halves) |
| `src/lib/pop-rate.ts` (new) | utility (pure function module) | transform | `src/lib/image-orientation.ts` | exact — same "pure, defensive, unit-testable, no DOM/framework" shape |
| `tests/unit/pop-rate.test.ts` (new) | test | transform (unit) | `tests/unit/image-orientation.test.ts` | exact — same fixture-based pure-function test style |
| `tests/e2e/not-found.spec.ts` (modify) | test | request-response (e2e) | itself (existing file, update assertions) | exact |
| `tests/e2e/accessibility.spec.ts` (modify) | test | request-response (e2e, axe scan) | itself (existing file, add a path-array entry) | exact |
| Client `<script>` inside `404.astro` (pointer/touch pop-rate engine + reduced-motion branch) | event-driven client logic | event-driven | `src/components/DetailHero.astro`'s `<script>` (rAF accumulator + `matchMedia('(prefers-reduced-motion: reduce)')` branch) | exact — same rAF-driven, `matchMedia`-branched, no-library vanilla JS convention |

## Pattern Assignments

### `src/pages/404.astro` — frontmatter data-sourcing half

**Analog:** `src/pages/index.astro` (lines 1-56), reused verbatim minus the `showOnHomePage` filter and thumbnail/grid fields.

**Imports pattern** (`src/pages/index.astro` lines 8-13):
```astro
import BaseLayout from '../layouts/BaseLayout.astro';
import { getGalleries, getHomePage, getSiteSettings } from '../lib/sanity';
import { fullSizeUrl, thumbnailUrl, blurPlaceholderUrl, responsiveImageSrcSet, responsiveThumbnailSrcSet } from '../lib/image';
import { getHeroTextColor, normalizeHeroColor, resolveHomepageIntro, resolveSiteCopy } from '../lib/site-config';
import { pickHeroIndex } from '../lib/image-orientation';
```
For 404.astro, the needed subset is smaller: `getGalleries` from `../lib/sanity`, `fullSizeUrl`/`responsiveImageSrcSet` from `../lib/image`, `pickHeroIndex` from `../lib/image-orientation`. `getRelativeLocaleUrl` from `astro:i18n` is already imported in the current `404.astro` (line 6) — keep it.

**Core CRUD-like build-time selection pattern** (`src/pages/index.astro` lines 35-56):
```astro
const galleries = (await getGalleries())
  .filter((gallery) => gallery.showOnHomePage !== false && gallery.images.length > 0)
  .map((gallery) => {
    const cover = gallery.images[pickHeroIndex(gallery.images)];
    return {
      slug: gallery.slug,
      heroSrc: fullSizeUrl(cover),
      heroSrcSet: responsiveImageSrcSet(cover),
      alt: cover.alt?.[locale] ?? '',
    };
  });
```
Adapt for 404.astro: drop the `showOnHomePage` filter (RESEARCH.md A3 — 404 pool wants max variety, not homepage curation), keep `images.length > 0`, keep `pickHeroIndex` + `fullSizeUrl`/`responsiveImageSrcSet`, set `alt: ''` unconditionally (pool photos are decorative background here, never documented content — RESEARCH.md Pitfall 6), drop `slug`/`heroColor`/thumbnail fields entirely (not needed — UI-SPEC defaults to `logoWhiteSrc` unconditionally, no per-photo color analysis).

**Existing CR-01 home-link pattern to KEEP unchanged** (current `src/pages/404.astro` lines 6-16):
```astro
import { getRelativeLocaleUrl } from 'astro:i18n';
const frHome = getRelativeLocaleUrl('fr', '');
const enHome = getRelativeLocaleUrl('en', '');
```
Then render as plain literal anchors — `<a href={frHome}>...</a>` / `<a href={enHome}>...</a>` — never a JS-computed/conditional href (RESEARCH.md Pitfall 5: `tests/scripts/verify-static-artifact.mjs` does a literal `href="${expectedBase}"` string match on the built `404.html`).

**BaseLayout usage to KEEP unchanged** (current `src/pages/404.astro` line 19): `<BaseLayout title="Page introuvable / Page not found" noIndex>` — only the body content inside changes, per CONTEXT.md `<code_context>`.

---

### `src/pages/404.astro` — scrim + centered-content-over-photo half

**Analog:** `src/components/DetailHero.astro` (`.detail-hero__scrim`, `.detail-hero__overlay-title`, lines 489-531).

**Scrim technique to REUSE (mechanism), NOT the gradient direction** (`DetailHero.astro` lines 489-495):
```css
.detail-hero__scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.65) 0%, rgba(0, 0, 0, 0.15) 45%, rgba(0, 0, 0, 0) 70%);
  pointer-events: none;
  opacity: 1;
}
```
**Adapt for 404.astro per 16-UI-SPEC.md** (centered composition needs a radial, not bottom-anchored, gradient):
```css
.not-found__scrim {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, rgba(26, 26, 26, 0.72) 0%, rgba(26, 26, 26, 0.55) 45%, rgba(26, 26, 26, 0.35) 100%);
  pointer-events: none;
  aria-hidden: true; /* set as an HTML attribute on the element, not CSS */
}
```
**Overlay-title-over-scrim white-text convention to reuse** (`DetailHero.astro` lines 516-531 — `color: #FFFFFF`, `pointer-events: none`, decorative `aria-hidden="true"` sibling): apply the same white-text-on-dark-scrim treatment to the "404" marker, phrase, and links per UI-SPEC Color section.

---

### `src/pages/404.astro` — hard-cut photo-swap CSS (new pattern, adapted from an existing anti-pattern to AVOID)

**Analog to avoid copying literally:** `src/components/SiteHeader.astro`'s logo-hover swap (lines 217-233) uses `display: none`/`block` toggling — this is the exact anti-pattern RESEARCH.md Pitfall 2 warns against for the pool photos (would suppress eager fetch and cause blank-frame stutter at the capped rate). Use opacity/z-index instead, per RESEARCH.md Pattern 2 (already fully specified there with concrete CSS/HTML — copy from RESEARCH.md directly, not from `SiteHeader.astro`).

---

### `src/pages/404.astro` — logo asset paths

**Analog:** `src/layouts/BaseLayout.astro` (lines 142-144), the actual source of `logoBlackSrc`/`logoWhiteSrc` (CONTEXT.md attributes these to `SiteHeader.astro`, but `SiteHeader.astro` only *receives* them as Props — `BaseLayout.astro` is where they're computed):
```astro
const assetBase = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const logoBlackSrc = `${assetBase}/logos/AJS_Brutalist_Black_Transparent.png`;
const logoWhiteSrc = `${assetBase}/logos/AJS_Brutalist_White_Transparent.png`;
```
404.astro must compute its own `assetBase`/`logoWhiteSrc` locally in its frontmatter (it does not receive these as Props from anywhere) — copy this exact three-line pattern. Per 16-UI-SPEC.md, default to `logoWhiteSrc` unconditionally (scrim already guarantees contrast); `logoBlackSrc` is not needed for this page.

---

### `src/pages/404.astro` — client `<script>` pop-rate engine (rAF accumulator, pointer/touch proximity, reduced-motion branch)

**Analog:** `src/components/DetailHero.astro`'s scroll-driven `<script>` (lines 159-284) — same architectural shape: a plain module `<script>` (no `client:*` directive, no bundler import needed for DOM code), a `requestAnimationFrame`-throttled update loop, and a `matchMedia('(prefers-reduced-motion: reduce)')` branch with a `setup()` function re-run on `change`.

**rAF-throttle-a-frequent-event pattern to mirror** (`DetailHero.astro` lines 246-256):
```typescript
let rafId: number | null = null;
function onScroll() {
  if (rafId !== null) return;
  rafId = requestAnimationFrame(() => {
    rafId = null;
    onProgress(computeProgress());
  });
}
```
404.astro's engine differs in that it needs a continuous accumulator (elapsed-time-since-last-swap check every frame, not just "run once per event"), so use RESEARCH.md's Pattern 3 `tick()` accumulator instead of this exact `onScroll` shape — but keep the same "declare `rafId`/loop function at module scope, call once at setup" style.

**`matchMedia` reduced-motion branch-and-resubscribe pattern to reuse verbatim** (`DetailHero.astro` lines 240, 258-276):
```typescript
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

function setup() {
  if (reduceMotion.matches /* || !desktop.matches, not applicable here */) {
    // ...inactive-state cleanup...
  } else {
    // ...attach the active-state listener/loop...
  }
}

setup();
reduceMotion.addEventListener('change', setup);
```
For 404.astro (per D-11, CONTEXT.md), the `if` branch is inverted from `DetailHero.astro`'s convention: instead of "reduced-motion → freeze/cleanup," it is "reduced-motion → run a fixed-interval drift loop that ignores pointer/touch entirely" (RESEARCH.md Pattern 5, already fully coded there). Copy the `setup()`/`addEventListener('change', setup)` wiring shape from `DetailHero.astro`; copy the actual branch bodies from `RESEARCH.md` Patterns 3-5 (not from `DetailHero.astro`, whose bodies implement the opposite freeze behavior).

**`<noscript>` no-JS-fallback pattern — NOT needed for 404.astro's photo stack** (unlike `DetailHero.astro` lines 150-157, which needs an explicit `<noscript>` override because its reveal panel defaults to `opacity: 0`): 404.astro's first pool `<img>` should default to `opacity: 1`/`is-active` directly in the static markup (RESEARCH.md Pattern 2), so no `<noscript>` block is needed for the photo stack. The centered content (logo/marker/phrase/links) is never `opacity: 0` pending JS either — it must be visible unconditionally, so no `<noscript>` override applies there either.

---

### `src/lib/pop-rate.ts` (new)

**Analog:** `src/lib/image-orientation.ts` (full file, 37 lines).

**Pure-function, defensive, no-throw module shape to mirror**:
```typescript
/**
 * quick-260724-oep: pure landscape-hero-selection helper. ...
 * Contract:
 * - Empty/undefined `images` -> 0.
 * - ...
 */
export function pickHeroIndex(images: GalleryImage[]): number {
  if (!images || images.length === 0) return 0;
  // ...
}
```
`pop-rate.ts` should follow the identical shape: a single (or small set of) exported pure function(s), a doc comment stating the explicit input/output contract (including edge cases — e.g. proximity clamped to `[0,1]`, interval never below `MIN_INTERVAL_MS` even if `currentProximity` is out of range or `NaN`), and zero DOM/browser API references (no `window`, no `document`) so it is trivially unit-testable per RESEARCH.md's Wave 0 gap. Concrete function body to adapt from RESEARCH.md Pattern 3 (`lerp` + the `Math.max(..., MIN_INTERVAL_MS)` floor clamp) — extract that math into this module rather than inlining it in the `404.astro` `<script>`.

---

### `tests/unit/pop-rate.test.ts` (new)

**Analog:** `tests/unit/image-orientation.test.ts` (lines 1-50+).

**Fixture-based pure-function test structure to mirror**:
```typescript
import { describe, expect, it } from 'vitest';
import { pickHeroIndex } from '../../src/lib/image-orientation';
import type { GalleryImage } from '../../src/lib/sanity';

function img(width?: number, height?: number): GalleryImage { /* ... */ }

describe('pickHeroIndex', () => {
  it('returns 0 for an empty array', () => {
    expect(pickHeroIndex([])).toBe(0);
  });
  // ... one `it` per contract edge case ...
});
```
For `pop-rate.test.ts`: `import { describe, expect, it } from 'vitest'`, import the new function(s) from `'../../src/lib/pop-rate'`, and write one `it` per RESEARCH.md's Wave 0 gap requirement — "covers the interval math at proximity 0, 0.5, 1, and confirms the floor never goes under the configured `MIN_INTERVAL_MS`" — plus an explicit out-of-range/NaN-input case (mirrors `image-orientation.test.ts`'s own "undefined array" defensive-input test).

---

### `tests/e2e/not-found.spec.ts` (modify)

**Analog:** itself (full file, 13 lines) — existing structure to preserve, only assertion bodies change.

```typescript
import {expect, test} from '@playwright/test'

test.describe('not-found delivery', () => {
  test('an unknown URL serves the bilingual noindex 404 page', async ({page}) => {
    const response = await page.goto('/this-page-does-not-exist/')
    expect(response?.status()).toBe(404)
    await expect(page.getByRole('heading', {name: 'Page introuvable'})).toBeVisible()
    await expect(page.getByRole('heading', {name: 'Page not found'})).toBeVisible()
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow')
    await expect(page.getByRole('link', {name: /retourner/i})).toHaveAttribute('href', '/')
    await expect(page.getByRole('link', {name: /return home/i})).toHaveAttribute('href', '/en/')
  })
})
```
Required changes:
- The `getByRole('heading', ...)` assertions almost certainly break once copy is condensed (D-12) and the DOM structure changes (no longer two `<h1>`/`<h2>` sections) — update to whatever the final heading/marker role and text end up being once implementation locks D-12's exact copy.
- Keep the `response?.status()` and `meta[name="robots"]` assertions verbatim — unaffected by the visual redesign.
- Keep the two `getByRole('link', ...)` href assertions verbatim in spirit — CR-01/Pitfall 5 means the hrefs (`/` and `/en/`) must not change.
- Add a new test per RESEARCH.md's Phase Requirements → Test Map: a `page.emulateMedia({ reducedMotion: 'reduce' })` case asserting the drift behavior (e.g. that the pointer-driven engine does not attach, or that photo swaps still occur on the slow fixed interval) — see RESEARCH.md's Validation Architecture section for the exact API.

---

### `tests/e2e/accessibility.spec.ts` (modify)

**Analog:** itself (full file, 42 lines) — existing path-array structure to extend, not restructure.

```typescript
for (const path of [
  '/',
  '/about/',
  '/contact/',
  '/galleries/silos/',
  '/mentions-legales/',
  '/editions/',
  '/confidentialite/',
  '/en/',
  '/en/about/',
]) {
  test(`${path} has no serious or critical automated accessibility violations`, async ({page}) => {
    await page.goto(path)
    const results = await new AxeBuilder({page}).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
    const blocking = results.violations.filter(
      (violation) => violation.impact === 'serious' || violation.impact === 'critical',
    )
    expect(blocking, blocking.map((violation) => `${violation.id}: ${violation.help}`).join('\n')).toEqual([])
  })
}
```
Required change: add a 404 entry to the path array — but note `page.goto('/some-nonexistent-path/')` is how `not-found.spec.ts` reaches this page (there's no literal `/404/` route), so either add a genuinely-nonexistent path string to this same array, or add a small dedicated `test(...)` block below the loop (mirroring the file's own existing "détail routes need a real slug" dedicated-test pattern at lines 25-41) that navigates to a nonexistent path and runs the identical `AxeBuilder`/`blocking`/`expect` sequence. This directly closes RESEARCH.md Pitfall 4's "zero automated a11y coverage today" gap — pay particular attention to axe flags on the decorative pool `<img>` stack (must have `alt=""` + a container `aria-hidden="true"`, per RESEARCH.md Pitfall 6) and on scrim color-contrast.

## Shared Patterns

### Base-aware asset paths (logo)
**Source:** `src/layouts/BaseLayout.astro` lines 142-144
**Apply to:** `src/pages/404.astro`'s logo `<img>` src — must NOT reuse a literal `/logos/...` string; compute `assetBase` locally exactly as `BaseLayout.astro` does.

### Locale-aware home links (CR-01)
**Source:** `astro:i18n`'s `getRelativeLocaleUrl`, already used in current `src/pages/404.astro` lines 6-16
**Apply to:** Both home-return links — keep the existing frontmatter computation and literal-`href` anchor rendering unchanged; this is a regression-class bug (CR-01, Phase 1 review) if hand-rolled differently.

### Dimming scrim over full-bleed photo
**Source:** `src/components/DetailHero.astro` lines 489-531 (`.detail-hero__scrim`, `.detail-hero__overlay-title`)
**Apply to:** `src/pages/404.astro`'s centered-content-over-photo composition — reuse the *technique* (absolutely-positioned, `pointer-events: none`, `aria-hidden="true"`, white foreground text) but replace the bottom-anchored linear gradient with the radial gradient specified in 16-UI-SPEC.md's Color section (centered composition needs center-weighted dimming, not edge-weighted).

### rAF accumulator + `matchMedia` reduced-motion branch-and-resubscribe
**Source:** `src/components/DetailHero.astro` lines 159-284 (structure), `RESEARCH.md` Patterns 3-5 (actual body/constants for this phase)
**Apply to:** `src/pages/404.astro`'s pointer/touch pop-rate `<script>` — same "plain module script, `setup()` function, `reduceMotion.addEventListener('change', setup)`" wiring; different (in fact deliberately inverted per D-11) branch bodies.

### Pure, unit-testable helper module in `src/lib/`
**Source:** `src/lib/image-orientation.ts` (full file) + `tests/unit/image-orientation.test.ts` (full file)
**Apply to:** `src/lib/pop-rate.ts` + `tests/unit/pop-rate.test.ts` — same doc-comment-contract + defensive-no-throw + fixture-based-test-per-edge-case conventions.

## No Analog Found

None — every file in this phase's blast radius has a strong, directly-cited in-repo analog (see Metadata below for search scope).

## Metadata

**Analog search scope:** `src/pages/index.astro`, `src/components/DetailHero.astro`, `src/components/SiteHeader.astro`, `src/layouts/BaseLayout.astro`, `src/lib/image-orientation.ts`, `src/lib/image.ts`, `tests/unit/image-orientation.test.ts`, `tests/e2e/not-found.spec.ts`, `tests/e2e/accessibility.spec.ts`, current `src/pages/404.astro`
**Files scanned:** 10
**Pattern extraction date:** 2026-07-29
