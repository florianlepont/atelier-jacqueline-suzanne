# Phase 9: Progressive Homepage Image Loading - Pattern Map

**Mapped:** 2026-07-14
**Files analyzed:** 4 (2 edited components/libs, 2 edited pages — no new files)
**Analogs found:** 4 / 4 (all patterns are self-referential — this phase extends existing code in the same files, not net-new files needing an external analog)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `src/lib/image.ts` | utility (build-time URL builder) | transform | itself — `thumbnailUrl()`/`fullSizeUrl()` (same file, lines 18-28) | exact (extend existing pattern in place) |
| `src/components/HomeCarousel.astro` (hero `<img>` + placeholder markup, lines ~177, ~1034) | component (server-rendered markup + scoped CSS) | request-response (static HTML) | itself — existing `.home-hero__img` absolute-stack pattern (lines 1034-1040), `.home-hero__scrim`/`.home-hero__caption` siblings | exact |
| `src/components/HomeCarousel.astro` (grid tile `<img>` + placeholder markup, lines ~237-245, ~1379-1384) | component (server-rendered markup + scoped CSS) | request-response (static HTML) | itself — `.home-grid__tile-scrim`/`-copy` absolute-stack pattern (lines 1386-1399) against `.home-grid__tile`'s `position: relative` (line 1372) | role-match (tile-img itself is currently normal-flow, not absolute — the scrim/copy siblings are the closest existing absolute-stacking analog to copy) |
| `src/components/HomeCarousel.astro` (client `<script>`, `render()` function, lines 273-414 + new grid-tile listener) | controller (vanilla-JS DOM controller, no framework) | event-driven (DOM events: `load`, `click`, `keydown`, `setInterval`) | itself — `syncWordmarkAlignment()` load-listener pattern (lines 339-373, 385-389) is the direct analog for the new blur-up load listener | exact |
| `src/pages/index.astro` / `src/pages/en/index.astro` (`galleries.map()` prop computation) | route/page (Astro frontmatter, build-time data prep) | transform (CRUD-adjacent: read from Sanity, map to props) | itself — `heroSrc: fullSizeUrl(cover)` / `gridSrc: thumbnailUrl(cover, 600)` (index.astro lines 42-43) | exact |

No file in this phase needs an *external* analog search — every pattern to copy already exists in the same two files being modified (`src/lib/image.ts`, `src/components/HomeCarousel.astro`) plus their direct callers (`index.astro`/`en/index.astro`). This phase is pure composition/extension, confirmed by RESEARCH.md's "zero new files, zero new dependencies" framing.

## Pattern Assignments

### `src/lib/image.ts` — add `blurPlaceholderUrl()`

**Analog:** same file, `thumbnailUrl()`/`fullSizeUrl()` (lines 14-28)

**Full existing pattern to copy** (`src/lib/image.ts:1-28`):
```typescript
import createImageUrlBuilder from '@sanity/image-url'
import {sanityClient} from './sanity'
import type {GalleryImage, SanityImage} from './sanity'

const builder = createImageUrlBuilder(sanityClient)

/**
 * 1:1 square-crop thumbnail URL, for gallery listing/detail grid cards
 * (UI-SPEC: grid alignment across mixed portrait/landscape source photos).
 */
export function thumbnailUrl(img: GalleryImage, size = 600): string {
  return builder.image(img).width(size).height(size).fit('crop').auto('format').url()
}

/**
 * Full-size, uncropped URL, for the lightbox (UI-SPEC: `object-fit: contain`,
 * never cropped).
 */
export function fullSizeUrl(img: SanityImage, maxWidth = 2000): string {
  return builder.image(img).width(maxWidth).fit('max').auto('format').url()
}
```

**New function to add**, same builder singleton, same JSDoc convention, same `SanityImage` type as `fullSizeUrl`:
```typescript
/**
 * Tiny, heavily-blurred CDN preview URL for the blur-up placeholder
 * (D-01: 24px wide, blur radius 50 — a real low-res rendition of the photo,
 * not a solid color). Used for both the hero photo and grid tiles.
 */
export function blurPlaceholderUrl(img: SanityImage, width = 24): string {
  return builder.image(img).width(width).blur(50).auto('format').url()
}
```
Note the module-level comment at the top of the file (build-time-only import boundary, `SANITY_API_READ_TOKEN` never reaches the browser) already governs this new function — no new comment needed, it inherits the existing file-level warning.

---

### `src/components/HomeCarousel.astro` — hero `<img>` + placeholder (markup + CSS)

**Analog:** same file, existing `.home-hero__img` server-rendered markup and CSS

**Current markup** (`HomeCarousel.astro:176-178`):
```astro
<div class="home-hero__photo">
  <img data-role="hero-image" src={firstGallery.heroSrc} alt={firstGallery.alt} class="home-hero__img" />
  <div class="home-hero__scrim" aria-hidden="true"></div>
```

**Current CSS** (`HomeCarousel.astro:1034-1040`):
```css
.home-hero__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```
This class already establishes the absolute-fill stacking box `.home-hero__scrim`/`.home-hero__caption` also use against `.home-hero__photo`'s `position: relative` — the placeholder and sharp `<img>` both reuse this exact class (plus a new modifier) rather than inventing new positioning rules.

**Pattern to apply** (per UI-SPEC Layout & Interaction Notes, "Hero" section): add a placeholder `<img>` sibling before the existing one, both keep `class="home-hero__img"` plus a modifier class, add `fetchpriority="high"` to the sharp one:
```astro
<img data-role="hero-image-placeholder" src={firstGallery.blurSrc} alt="" aria-hidden="true" class="home-hero__img home-hero__img-placeholder" />
<img data-role="hero-image" src={firstGallery.heroSrc} alt={firstGallery.alt} fetchpriority="high" class="home-hero__img home-hero__img--sharp" />
```
New CSS, appended after the existing `.home-hero__img` block (lines 1034-1040), timing per D-06/UI-SPEC (260ms, matches `.home-toggle__morph`'s existing `transition: column-gap 280ms ease` convention):
```css
.home-hero__img--sharp {
  opacity: 0;
  transition: opacity 260ms ease;
}
.home-hero__img--sharp.is-loaded {
  opacity: 1;
}
```

---

### `src/components/HomeCarousel.astro` — grid tile `<img>` + placeholder (markup + CSS)

**Analog:** same file, `.home-grid__tile-scrim`/`.home-grid__tile-copy` absolute-stacking pattern (the tile-img itself is currently normal-flow and is NOT the analog for positioning — its siblings are)

**Current markup** (`HomeCarousel.astro:236-245`):
```astro
<a href={getRelativeLocaleUrl(locale, `galleries/${gallery.slug}`)} class="home-grid__tile">
  <img
    src={gallery.gridSrc}
    width="600"
    height="600"
    alt={gallery.alt}
    loading="lazy"
    decoding="async"
    class="home-grid__tile-img"
  />
  <div class="home-grid__tile-scrim" aria-hidden="true"></div>
```

**Current CSS** (`HomeCarousel.astro:1371-1390`):
```css
.home-grid__tile {
  position: relative;
  display: block;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  text-decoration: none;
}

.home-grid__tile-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.home-grid__tile-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.65) 0%, rgba(0, 0, 0, 0.15) 45%, rgba(0, 0, 0, 0) 70%);
}
```
`.home-grid__tile` already establishes `position: relative` (line 1372) — `.home-grid__tile-scrim` (line 1386) is the existing example of a child using `position: absolute; inset: 0;` against it. The new placeholder/sharp tile-img variants copy this exact `position: absolute; inset: 0;` addition, per UI-SPEC ("stacking the placeholder requires adding `position: absolute; inset: 0;` to both variants ... additive to `.home-grid__tile`'s existing `position: relative`, not a new stacking pattern").

**Pattern to apply**:
```astro
<img src={gallery.blurSrc} alt="" aria-hidden="true" class="home-grid__tile-img home-grid__tile-img-placeholder" />
<img
  src={gallery.gridSrc}
  width="600"
  height="600"
  alt={gallery.alt}
  loading="lazy"
  decoding="async"
  class="home-grid__tile-img home-grid__tile-img--sharp"
/>
```
New CSS, appended after the existing `.home-grid__tile-img` block (lines 1379-1384):
```css
.home-grid__tile-img,
.home-grid__tile-img-placeholder,
.home-grid__tile-img--sharp {
  position: absolute;
  inset: 0;
}
.home-grid__tile-img--sharp {
  opacity: 0;
  transition: opacity 260ms ease;
}
.home-grid__tile-img--sharp.is-loaded {
  opacity: 1;
}
```
(Reconcile the shared `.home-grid__tile-img` base rule at lines 1379-1384 with the new `position: absolute` requirement — width/height/object-fit/display stay on the base class, only positioning is added.)

---

### `src/components/HomeCarousel.astro` — client `render()` extension (hero blur-up + prefetch)

**Analog:** same file, `syncWordmarkAlignment()` + its `render()` call site — the existing `img.complete`/`load`-listener defensive pattern

**Current pattern** (`HomeCarousel.astro:382-390`):
```typescript
if (heroImg) {
  heroImg.src = gallery.heroSrc;
  heroImg.alt = gallery.alt;
  if (heroImg.complete) {
    syncWordmarkAlignment();
  } else {
    heroImg.addEventListener('load', syncWordmarkAlignment, { once: true });
  }
}
```
This `if (img.complete) { ... } else { img.addEventListener('load', ..., { once: true }) }` shape is the exact reusable primitive (RESEARCH.md "Don't Hand-Roll" table) — copy it verbatim for the new placeholder-fade logic, adding the `is-loaded` class reset (Pitfall 3) *before* the `src` reassignment:
```typescript
// New: query the placeholder alongside heroImg (near line 312)
const heroPlaceholderImg = hero.querySelector<HTMLImageElement>('[data-role="hero-image-placeholder"]');

function showSharp(img: HTMLImageElement) {
  img.classList.add('is-loaded');
}

// Inside render(), replacing the block at lines 382-390:
if (heroImg && heroPlaceholderImg) {
  heroPlaceholderImg.src = gallery.blurSrc;
  heroImg.classList.remove('is-loaded'); // Pitfall 3: must precede src reassignment
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
`root!.style.setProperty('--wordmark-photo', ...)` (line 410) stays exactly where it is, synchronous and unconditional — do NOT move it inside the new load listener (Pitfall 4).

**Prefetch addition**, appended at the end of `render()` (after line 413's `progressDashes.forEach`, before the closing `}` at line 414):
```typescript
const nextIndex = (carouselIndex + 1) % galleries.length;
const nextSrc = galleries[nextIndex]?.heroSrc;
if (nextSrc) {
  const preload = new Image();
  preload.src = nextSrc;
}
```

**Data island threading** — extend the existing `<li data-*>` pattern (`HomeCarousel.astro:260-269`):
```astro
<li
  data-title={gallery.title}
  data-hero-src={gallery.heroSrc}
  data-blur-src={gallery.blurSrc}
  data-alt={gallery.alt}
  data-statement={gallery.statement}
  data-href={getRelativeLocaleUrl(locale, `galleries/${gallery.slug}`)}
  data-hero-color={gallery.heroColor}
  data-hero-text-color={gallery.heroTextColor}
/>
```
And the client-side parse (`HomeCarousel.astro:274-298`, `GalleryEntry` interface + `.map()`):
```typescript
interface GalleryEntry {
  title: string;
  heroSrc: string;
  blurSrc: string; // NEW
  alt: string;
  statement: string;
  href: string;
  heroColor?: string;
  heroTextColor?: string;
}
// ...
const galleries: GalleryEntry[] = Array.from(dataEl.querySelectorAll('li')).map((li) => ({
  title: li.dataset.title ?? '',
  heroSrc: li.dataset.heroSrc ?? '',
  blurSrc: li.dataset.blurSrc ?? '', // NEW
  alt: li.dataset.alt ?? '',
  statement: li.dataset.statement ?? '',
  href: li.dataset.href ?? '',
  heroColor: li.dataset.heroColor || undefined,
  heroTextColor: li.dataset.heroTextColor || undefined,
}));
```
Also extend the server-side `GalleryEntry` interface (`HomeCarousel.astro:20-29`, Props type) with `blurSrc: string;`.

---

### `src/components/HomeCarousel.astro` — grid tile load listener (new, one-time setup)

**Analog:** same file, the existing one-time `querySelectorAll` setup pattern used for `progressDashes` (line 318) — a single `Array.from(...).forEach(...)` outside `render()`, run once at script init.

```typescript
// One-time setup, added alongside the other querySelectorAll calls (near line 318),
// not inside render() — grid tiles are server-rendered once, never re-rendered.
const tileImgs = Array.from(document.querySelectorAll<HTMLImageElement>('.home-grid__tile-img--sharp'));
tileImgs.forEach((img) => {
  const markLoaded = () => img.classList.add('is-loaded');
  if (img.complete) markLoaded();
  else img.addEventListener('load', markLoaded, { once: true });
});
```
Same `img.complete`/`load` defensive shape as `syncWordmarkAlignment()`'s call site (lines 385-389) and the new hero blur-up logic above — third reuse of the identical primitive in this one file.

---

### `src/pages/index.astro` / `src/pages/en/index.astro` — thread `blurSrc` prop

**Analog:** same file, `heroSrc`/`gridSrc` computation

**Current pattern** (`src/pages/index.astro:11, 37-47`):
```typescript
import { fullSizeUrl, thumbnailUrl } from '../lib/image';
// ...
const cover = gallery.images[0];
// ...
heroSrc: fullSizeUrl(cover),
gridSrc: thumbnailUrl(cover, 600),
// ...
alt: cover.alt?.[locale] ?? '',
```

**Pattern to apply**:
```typescript
import { fullSizeUrl, thumbnailUrl, blurPlaceholderUrl } from '../lib/image';
// ...
heroSrc: fullSizeUrl(cover),
gridSrc: thumbnailUrl(cover, 600),
blurSrc: blurPlaceholderUrl(cover),
```
Mirror the identical one-line addition in `src/pages/en/index.astro` (same `galleries.map()` shape, confirmed by RESEARCH.md's Recommended Project Structure).

## Shared Patterns

### `img.complete` / `load`-listener defensive check
**Source:** `src/components/HomeCarousel.astro:385-389` (`syncWordmarkAlignment` call site)
**Apply to:** Hero blur-up fade-in, grid tile blur-up fade-in — both reuse this exact `if (img.complete) { ... } else { img.addEventListener('load', ..., { once: true }) }` shape rather than any new cache-detection logic.
```typescript
if (heroImg.complete) {
  syncWordmarkAlignment();
} else {
  heroImg.addEventListener('load', syncWordmarkAlignment, { once: true });
}
```

### Absolute-fill stacking against a `position: relative` parent
**Source:** `src/components/HomeCarousel.astro:1034-1040` (`.home-hero__img`) and `:1386-1390` (`.home-grid__tile-scrim`)
**Apply to:** Both new placeholder `<img>` layers (hero and grid tile) — `position: absolute; inset: 0;` against the already-established `.home-hero__photo` / `.home-grid__tile` `position: relative` parents. No new stacking-context mechanism is introduced.

### Sanity CDN builder singleton
**Source:** `src/lib/image.ts:12` (`const builder = createImageUrlBuilder(sanityClient)`)
**Apply to:** `blurPlaceholderUrl()` — reuses the exact same module-level `builder` instance as `thumbnailUrl()`/`fullSizeUrl()`, no new client/import.

### Build-time-only import boundary (security)
**Source:** `src/lib/image.ts:1-11` (module doc comment) and `src/components/HomeCarousel.astro:8-11` (component doc comment)
**Apply to:** `blurPlaceholderUrl()` must only be called from Astro frontmatter (`index.astro`/`en/index.astro`), never from `HomeCarousel.astro`'s client `<script>` — the client script only ever reads `data-blur-src` off the static data island, exactly like existing `data-hero-src`. This preserves T-04.1-04-ID (SANITY_API_READ_TOKEN never reaches the browser).

## No Analog Found

None. Every file/pattern in this phase's scope is an in-place extension of an existing, actively-maintained file (`src/lib/image.ts`, `src/components/HomeCarousel.astro`, `src/pages/index.astro`, `src/pages/en/index.astro`) — no net-new file requires an external analog search.

## Metadata

**Analog search scope:** `src/lib/image.ts`, `src/components/HomeCarousel.astro` (full file, all sections), `src/pages/index.astro` (frontmatter), `src/pages/en/index.astro` (frontmatter, assumed identical shape per RESEARCH.md).
**Files scanned:** 4 (all files this phase touches — no broader codebase search was needed since RESEARCH.md/CONTEXT.md already confirm zero new files/dependencies and all patterns are self-contained within these 4 files).
**Pattern extraction date:** 2026-07-14
