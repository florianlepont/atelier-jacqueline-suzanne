---
phase: 09-progressive-homepage-image-loading
reviewed: 2026-07-14T00:00:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - tests/e2e/homepage.spec.ts
  - src/lib/image.ts
  - src/pages/index.astro
  - src/pages/en/index.astro
  - src/components/HomeCarousel.astro
findings:
  critical: 0
  warning: 4
  info: 3
  total: 7
status: issues_found
---

# Phase 09: Code Review Report

**Reviewed:** 2026-07-14T00:00:00Z
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

Reviewed the HOME-09 progressive image loading change: `blurPlaceholderUrl()` in
`src/lib/image.ts`, its wiring through both locale homepages, and the
blur-up crossfade implementation in `HomeCarousel.astro` (hero photo +
grid tiles), plus the accompanying Playwright coverage. The core mechanism
— a stacked blurred `<img>` placeholder + a sharp `<img>` that fades in via
an `.is-loaded` class toggle — is sound and matches the stated design
(D-01/D-02/D-03/D-06). No critical/security issues were found.

The main gaps are in failure-path handling: neither the hero image nor the
grid tile images have an `error` handler, so a failed network fetch (bad
asset, transient CDN hiccup) leaves the UI permanently stuck on the blurred
placeholder with no visible sign anything went wrong. There's also a latent
listener-accumulation issue on rapid carousel navigation, some CSS/naming
duplication introduced alongside the new classes, and a new e2e test that
implicitly depends on today's small gallery count to pass (it will start
failing once more galleries are migrated, since it doesn't scroll
lazy-loaded tiles into view before asserting `is-loaded`).

## Warnings

### WR-01: Hero image has no `error` handler — a failed load leaves the blur-up permanently stuck

**File:** `src/components/HomeCarousel.astro:404-418`
**Issue:** `render()` only listens for `'load'` on `heroImg`:
```js
if (heroImg && heroPlaceholderImg) {
  heroPlaceholderImg.src = gallery.blurSrc;
  heroImg.classList.remove('is-loaded');
  heroImg.src = gallery.heroSrc;
  heroImg.alt = gallery.alt;
  if (heroImg.complete) {
    showSharp(heroImg);
    syncWordmarkAlignment();
  } else {
    heroImg.addEventListener('load', () => {
      showSharp(heroImg);
      syncWordmarkAlignment();
    }, { once: true });
  }
}
```
If `gallery.heroSrc` 404s or the CDN request otherwise fails, `'load'` never
fires, so `showSharp()` is never called and `.is-loaded` is never added.
The visitor is left staring at a heavily-blurred 24px placeholder
indefinitely (and `syncWordmarkAlignment()` also never runs, so the
wordmark cutout stays misaligned/blank on top of that) with nothing
indicating a failure. For a photography site this is a meaningful and
plausible-in-production failure mode (bad Sanity asset ref, transient CDN
error), not a purely theoretical one.
**Fix:** Add an `'error'` listener alongside `'load'` that at minimum falls
back to marking the sharp layer loaded (or leaves a distinguishable
fallback state) instead of hanging forever:
```js
const onSettle = () => { showSharp(heroImg); syncWordmarkAlignment(); };
heroImg.addEventListener('load', onSettle, { once: true });
heroImg.addEventListener('error', onSettle, { once: true });
```

### WR-02: Grid tile images have no `error` handler either

**File:** `src/components/HomeCarousel.astro:331-336`
**Issue:** Same gap as WR-01, for every grid tile's sharp `<img>`:
```js
const gridTileImgs = Array.from(document.querySelectorAll<HTMLImageElement>('.home-grid__tile-img--sharp'));
gridTileImgs.forEach((img) => {
  const markLoaded = () => img.classList.add('is-loaded');
  if (img.complete) markLoaded();
  else img.addEventListener('load', markLoaded, { once: true });
});
```
A tile whose photo fails to load stays a blurred square forever, with no
recovery path.
**Fix:** Register `'error'` the same way as `'load'`:
```js
if (img.complete) markLoaded();
else {
  img.addEventListener('load', markLoaded, { once: true });
  img.addEventListener('error', markLoaded, { once: true });
}
```

### WR-03: `'load'` listeners on `heroImg` can accumulate on rapid navigation

**File:** `src/components/HomeCarousel.astro:404-418`
**Issue:** Every `render()` call that finds `heroImg.complete === false` adds
a new `{ once: true }` `'load'` listener to the same `<img>` element. If a
visitor rapidly clicks through the progress dashes (or fires several
`ArrowLeft`/`ArrowRight`/swipe events) faster than each successive
`heroSrc` finishes loading, `heroImg.src` gets reassigned before the
previous request's `'load'` event fires. Browsers abort the superseded
request rather than firing `'load'` for it, so that listener is never
invoked and never removed (only `'load'` triggers `{ once: true }`
cleanup) — it just sits on the element. When a subsequent swap's image
does finish loading, all of the previously-stacked, never-fired listeners
fire together on that one `'load'` event, each re-running
`showSharp`/`syncWordmarkAlignment` redundantly. Functionally mostly
harmless (both callees are idempotent) but it's an unbounded listener leak
under normal fast-interaction usage, not just a pathological edge case.
**Fix:** Track and remove the previous pending listener before attaching a
new one (or use an `AbortController` per render call and pass `{ signal }`
so stale listeners are explicitly cancelled instead of orphaned):
```js
let pendingLoadCtrl: AbortController | null = null;
// ...
pendingLoadCtrl?.abort();
pendingLoadCtrl = new AbortController();
heroImg.addEventListener('load', () => { showSharp(heroImg); syncWordmarkAlignment(); }, { once: true, signal: pendingLoadCtrl.signal });
```

### WR-04: New "grid tile blur-up" e2e test will flake once more galleries are added

**File:** `tests/e2e/homepage.spec.ts:651-663`
**Issue:**
```js
test('grid tile blur-up: tiles carry a placeholder layer and gain is-loaded', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Grille' }).click();

  const tiles = page.locator('a.home-grid__tile');
  expect(await tiles.count()).toBeGreaterThan(0);
  for (const tile of await tiles.all()) {
    const placeholder = tile.locator('.home-grid__tile-img-placeholder');
    await expect(placeholder).toHaveAttribute('src', /cdn\.sanity\.io/);
    const sharp = tile.locator('.home-grid__tile-img--sharp');
    await expect(sharp).toHaveClass(/is-loaded/);
  }
});
```
This asserts `is-loaded` on every rendered tile's sharp image without
scrolling each tile into view first. The sharp images use
`loading="lazy"` by design (D-03, unchanged by this phase), so tiles
outside the initial viewport won't start downloading — and therefore
never reach `is-loaded` — until scrolled near. It only passes today
because the current gallery count (per the file's own comments —
`silos`/`brume`) is small enough that every tile fits in the first
viewport at the default test resolution. Several other tests/comments in
this same file explicitly anticipate more galleries being migrated (e.g.
"written for N galleries, not hardcoded to 2"), so this assertion is
likely to start timing out/failing as soon as the catalog grows past one
viewport's worth of tiles — with no code change required to trigger the
regression.
**Fix:** Scroll each tile into view before asserting, e.g.
`await tile.scrollIntoViewIfNeeded(); await expect(sharp).toHaveClass(/is-loaded/);`
inside the loop.

## Info

### IN-01: Redundant CSS selectors added for grid tile placeholder/sharp positioning

**File:** `src/components/HomeCarousel.astro:1446-1451`
**Issue:**
```css
.home-grid__tile-img,
.home-grid__tile-img-placeholder,
.home-grid__tile-img--sharp {
  position: absolute;
  inset: 0;
}
```
Both the placeholder `<img class="home-grid__tile-img home-grid__tile-img-placeholder">`
and the sharp `<img class="home-grid__tile-img home-grid__tile-img--sharp">`
always also carry the base `.home-grid__tile-img` class in the markup, so
the `-placeholder` and `--sharp` selectors in this group can never match
an element that `.home-grid__tile-img` doesn't already match. They add no
effective coverage, just extra rule-matching overhead and reading noise.
**Fix:** Drop the redundant selectors — `.home-grid__tile-img { position: absolute; inset: 0; }` alone already covers both layers.

### IN-02: Inconsistent BEM modifier naming between placeholder and sharp layers

**File:** `src/components/HomeCarousel.astro:178-179, 239-247`
**Issue:** The sharp layer uses a proper BEM modifier (`home-hero__img--sharp`,
`home-grid__tile-img--sharp`), while the placeholder layer uses a
single-hyphen suffix instead of a modifier (`home-hero__img-placeholder`,
`home-grid__tile-img-placeholder`) — inconsistent with the double-hyphen
modifier convention used everywhere else in this same file (e.g.
`home-grid__tile--hero`).
**Fix:** Rename to `home-hero__img--placeholder` / `home-grid__tile-img--placeholder` for consistency (purely cosmetic — no functional impact since these classes are only used as base-position hooks, not by the tests, which key off `data-role`/the sharp/placeholder class already used).

### IN-03: `showSharp()` duplicates the inline `markLoaded` closure

**File:** `src/components/HomeCarousel.astro:327-330, 333`
**Issue:** `showSharp(img)` (`img.classList.add('is-loaded')`) and the grid
tile setup's local `markLoaded` (`() => img.classList.add('is-loaded')`)
are the same one-line operation defined twice, once as a named function
for the hero and once as an inline closure for grid tiles.
**Fix:** Reuse `showSharp` for the grid tile loop too (`if (img.complete) showSharp(img); else img.addEventListener('load', () => showSharp(img), { once: true });`) to keep the "mark this image loaded" behavior in one place.

---

_Reviewed: 2026-07-14T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
