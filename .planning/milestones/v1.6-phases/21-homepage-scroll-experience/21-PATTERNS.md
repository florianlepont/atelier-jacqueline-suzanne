# Phase 21: Homepage Scroll Experience - Pattern Map

**Mapped:** 2026-08-04
**Files analyzed:** 5 (2 modified existing, 3 new test files; no new production files required)
**Analogs found:** 5 / 5

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `src/components/HomeCarousel.astro` (new `.home-scroll-deck` markup + new `<script>` block, added alongside existing carousel/grid code) | component (scroll-driven UI) | event-driven (scroll/IntersectionObserver → CSS state) | `src/components/DetailHero.astro` (pinned scroll-scrubbed driver) + `HomeCarousel.astro`'s own existing carousel/touch code | exact (self) + exact (driver pattern) |
| `src/lib/home-carousel.ts` (new exported pure function, e.g. `computeWordmarkZoomState(t)`) | utility (pure transform) | transform | `computeWordmarkBackgroundPosition` / `computeWordmarkSeamFraction` in the same file | exact |
| `tests/unit/home-carousel.test.ts` (new `describe` block) | test | transform | existing `describe` blocks in same file for `computeWordmarkBackgroundPosition` etc. | exact |
| `tests/e2e/homepage-scroll-deck.spec.ts` (new file) | test | request-response (browser automation) | `tests/e2e/homepage-carousel-core.spec.ts` / `homepage-mobile-responsive.spec.ts` | role-match |
| `tests/e2e/homepage-wordmark-peek.spec.ts` (extended, new test case for CR-01) | test | request-response | existing tests in same file | exact |

No new component/service/model/middleware files are needed — this phase is additive markup/script/CSS inside two already-existing files, per RESEARCH.md's explicit recommendation ("No new files are strictly required; extend the existing two").

## Pattern Assignments

### `HomeCarousel.astro` — new `.home-scroll-deck` markup + zoom/arrival script (component, event-driven)

**Analog 1 — pinned scroll-scrubbed driver:** `src/components/DetailHero.astro` lines 198-322 (full `<script>` block)

**Progress/driver pattern** (lines 204-237, 279-321):
```typescript
function clamp01(v: number): number { return Math.max(0, Math.min(1, v)); }
function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }

const REVEAL_DISTANCE = 900;

function computeProgress(): number {
  return clamp01(-track!.getBoundingClientRect().top / REVEAL_DISTANCE);
}

function onScroll() {
  if (rafId !== null) return;
  rafId = requestAnimationFrame(() => {
    rafId = null;
    onProgress(computeProgress());
  });
}

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const desktop = matchMedia('(min-width: 768px)'); // Phase 21: invert to matchMedia('(max-width: 767px)')

function setup() {
  if (reduceMotion.matches || !desktop.matches) {
    if (scrollAttached) {
      window.removeEventListener('scroll', onScroll);
      scrollAttached = false;
    }
    clearInlineStyles();
  } else {
    if (!scrollAttached) {
      window.addEventListener('scroll', onScroll, { passive: true });
      scrollAttached = true;
    }
    onProgress(computeProgress());
  }
}

setup();
reduceMotion.addEventListener('change', setup);
desktop.addEventListener('change', setup); // Phase 21: mobile.addEventListener('change', setup)
```

**Clear-inline-styles / reduced-motion end-state pattern** (lines 260-277): every property `onProgress` sets inline must have a matching `removeProperty` call in `clearInlineStyles()`, so CSS end-state media-query rules (D-15's "descriptions always visible") can take over the instant the driver detaches. Copy this 1:1 for the zoom stage's `scale`/`opacity` properties and the arrival-reveal's `opacity`/`transform`.

**Resize debounce pattern** (lines 317-321) — reuse verbatim rather than introducing `ResizeObserver` (RESEARCH.md explicitly recommends staying consistent with this idiom):
```typescript
let resizeTimer: ReturnType<typeof setTimeout> | null = null;
window.addEventListener('resize', () => {
  if (resizeTimer) clearTimeout(resizeTimer);
  resizeTimer = setTimeout(setup, 100);
});
```

---

**Analog 2 — existing wordmark photo-cutout mechanism (same file):** `HomeCarousel.astro` lines 96-99, 116-119, 2469-2610 (CSS)

**Filter heuristic to reuse verbatim** (lines 96-99 — module scope — and lines 398 area — script scope; both copies currently exist, this phase is a natural point to extract to `src/lib/home-carousel.ts` per `20-REVIEW.md` IN-01):
```typescript
const wordmarkPhotoFilter = (textColor?: string) =>
  textColor?.toUpperCase() === '#FFFFFF'
    ? 'brightness(1.38) contrast(0.92)'
    : 'brightness(0.65) contrast(1.12)';
```

**Custom-property wiring pattern** (lines 116-119, repeated at ~728-730 inside `render()`):
```typescript
'--wordmark-photo': 'none',
'--wordmark-photo-filter': wordmarkPhotoFilter(firstGallery.heroTextColor),
'--current-accent': firstGallery.heroColor ?? 'var(--color-accent)',
```
Mirror this exact style for the new full-screen zoom wordmark's own `--zoom-photo` / filter custom properties, and reuse `--current-accent`/`--current-accent-text` unmodified for D-09 liveness (do not introduce parallel accent variables).

**Do NOT reuse** `computeWordmarkBackgroundPosition`/`syncWordmarkAlignment` (`src/lib/home-carousel.ts` lines 38+) for the new full-screen wordmark — per RESEARCH.md Pattern 2/Pitfall 5, that function solves a different geometry problem (aligning a smaller wordmark box to a separate, differently-cropped hero `<img>`). The full-screen case is `background-size: cover; background-position: center` directly, no alignment math needed.

---

**Analog 3 — touch handler (same file):** `HomeCarousel.astro` lines 966-1002 (existing carousel touch handling)

**Existing pattern (fix in place for CR-01, keep alive for ≥768px touchscreen tablets):**
```typescript
heroPhoto?.addEventListener('touchend', (event) => {
  const touch = event.changedTouches[0];
  if (!touch) return;
  const deltaX = touch.clientX - touchStartX;
  const deltaY = touch.clientY - touchStartY;
  const direction = detectSwipeDirection(deltaX, deltaY, SWIPE_MIN_DISTANCE, SWIPE_DIRECTION_RATIO);
  if (direction === 'next') { goToNext(); return; }
  if (direction === 'prev') { goToPrev(); return; }
  if (Math.abs(deltaX) <= TAP_MAX_MOVEMENT && Math.abs(deltaY) <= TAP_MAX_MOVEMENT) {
    openCurrent();
  }
}, { passive: true });
```
**CR-01 fix to apply here** (per `20-REVIEW.md`, unconditionally, in this exact handler): add an early-return guard excluding `.home-hero__caption`/progress-dash controls, e.g. `if ((event.target as HTMLElement)?.closest('.home-hero__caption, [data-role="progress-dash"]')) return;` before the swipe/tap logic runs. This handler stays live for ≥768px touchscreen tablets — do not move/duplicate this fix into the new mobile-only handler instead of fixing it here (Pitfall 1).

**New tap-to-open handler for the scroll-deck** (D-10) should be a separate, simpler listener scoped to `.arrival-slide` elements — no swipe-direction detection needed (no horizontal nav on the vertical deck), no progress-dash/caption exclusion needed (D-16: no controls exist on arrival slides at all), just: tap without significant movement → navigate to that slide's gallery detail href.

---

### `HomeCarousel.astro` — grid-tile description reveal CSS (component, transform)

**Analog:** `HomeCarousel.astro` lines 2741-2804 (`.home-grid__tile-title` / `.home-grid__tile-description`)

**Values to reuse verbatim (D-13, locked — do not retune):**
```css
.home-grid__tile-description {
  min-height: calc(1.4em * 3);
  margin-top: var(--space-sm);
  max-width: 52ch;
  overflow: hidden;
  font-size: 14px;
  line-height: 1.4;
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 180ms ease, transform 180ms ease;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.home-grid__tile:hover .home-grid__tile-description,
.home-grid__tile:focus-visible .home-grid__tile-description {
  opacity: 1;
  transform: translateY(0);
}
```
For the arrival-slide description, replace the `:hover`/`:focus-visible` trigger with a `.is-revealed` class toggled by the new IntersectionObserver (see Pattern below) — same `opacity`/`transform`/`180ms ease` values, different trigger mechanism only. Title (`.home-grid__tile-title`, lines 2741-2771) reuses the same 32px/600/1.2, 2-line-clamp treatment verbatim and stays always-visible (no reveal gating).

---

### `HomeCarousel.astro` — arrival-complete IntersectionObserver (component, event-driven)

**Analog:** `src/components/GalleryGrid.astro` lines 169-193 (the site's only existing `IntersectionObserver` usage)

```typescript
if (!('IntersectionObserver' in window)) {
  tiles.forEach((tile) => tile.classList.add('revealed'));
} else {
  const tileList = Array.from(tiles);
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const tile = entry.target as HTMLElement;
          const index = tileList.indexOf(tile);
          setTimeout(() => tile.classList.add('revealed'), index * 90);
          observer.unobserve(tile);
        }
      });
    },
    { threshold: 0.15 },
  );
  tileList.forEach((tile) => observer.observe(tile));
}
```
Reuse the feature-detect guard (`'IntersectionObserver' in window`) and the "always-visible fallback" idiom verbatim. Differences for D-14 (per RESEARCH.md Pattern 4 — do NOT copy GalleryGrid's specifics, only its shape):
- Threshold: `[0, 0.98, 1]`, not `0.15`.
- Toggle via `classList.toggle('is-revealed', entry.intersectionRatio >= 0.98)` (both directions), not `classList.add` + `unobserve` (GalleryGrid's is one-shot; D-14/D-04 requires reversibility, so never `unobserve`).

---

### `src/lib/home-carousel.ts` — new pure zoom-progress function (utility, transform)

**Analog:** same file, `computeWordmarkBackgroundPosition`/`computeWordmarkSeamFraction` (lines 1-40+) — establishes the file's own convention: framework-agnostic, DOM-free, import-free, JSDoc explaining what inline logic it was extracted from.

```typescript
/**
 * Pure computational logic extracted from HomeCarousel.astro's client
 * <script> ... Framework-agnostic, DOM-free, import-free — mirrors the
 * src/lib/i18n-paths.ts / src/lib/site-config.ts pure-module convention so
 * this math is directly unit-testable outside of Playwright.
 */
export interface Rect {
  width: number;
  height: number;
  left: number;
  top: number;
}
```
Follow this exact shape for the new export, e.g.:
```typescript
export function computeWordmarkZoomState(t: number): { scale: number; wordmarkOpacity: number; photoOpacity: number } {
  const clamped = Math.max(0, Math.min(1, t));
  const scaleT = clamped * clamped * clamped; // easeInCubic
  return {
    scale: 1 + (8.5 - 1) * scaleT,
    wordmarkOpacity: 1 - Math.max(0, Math.min(1, (clamped - 0.92) / 0.08)),
    photoOpacity: Math.max(0, Math.min(1, (clamped - 0.85) / 0.15)),
  };
}
```
Wire it into `HomeCarousel.astro`'s new `<script>` exactly as `DetailHero.astro` wires its own inline `onProgress` — call it from the `onScroll`/`onProgress` rAF-batched handler, applying `.style.transform`/`.style.opacity` from the returned object.

---

### `tests/unit/home-carousel.test.ts` — new describe block (test, transform)

**Analog:** existing `describe` blocks in the same file for `computeWordmarkBackgroundPosition`/`computeWordmarkSeamFraction`/`pickRandomGalleryIndex` — follow the same file's existing `describe`/`it` structure and assertion style (plain Vitest `expect(...).toBe(...)`/`toBeCloseTo(...)` on pure function output, no DOM/mocking needed since the function is DOM-free).

---

### `tests/e2e/homepage-scroll-deck.spec.ts` — new file (test, request-response)

**Analog:** `tests/e2e/homepage-mobile-responsive.spec.ts` and `tests/e2e/homepage-carousel-core.spec.ts` (existing homepage e2e specs) — follow their existing Playwright fixture/viewport-setup conventions (`chromium` + `webkit-mobile` projects per `playwright.config.ts`), and reuse `page.emulateMedia({ reducedMotion: 'reduce' })` for the D-15 reduced-motion test case (already used elsewhere in the suite for `DetailHero`/`AboutPageBody`-style tests — grep the existing suite for the exact call site before writing a new one).

---

### `tests/e2e/homepage-wordmark-peek.spec.ts` — extended (test, request-response)

**Analog:** existing test cases in the same file — add one new case asserting a real-coordinate `touchend` on the progress-dash/caption area does NOT call `openCurrent()`/navigate, matching `20-REVIEW.md`'s own suggested CR-01 regression-test shape. Must target the OLD carousel markup (`.home-hero__photo` / `.home-hero__caption`), not the new scroll-deck markup (Pitfall 1).

## Shared Patterns

### Reduced-motion + breakpoint gating idiom
**Source:** `DetailHero.astro` lines 279-321 (also identically in `AboutPageBody.astro`)
**Apply to:** the new zoom-driver script AND the new arrival-IntersectionObserver setup — both must live inside the same `setup()`/`matchMedia(...).addEventListener('change', setup)` structure, inverted to `matchMedia('(max-width: 767px)')` instead of `(min-width: 768px)`. Two independent effects (scroll listener, IntersectionObserver) can share one `setup()` exactly as `DetailHero.astro` shares one `setup()` for its own single effect — extend the same function rather than writing a second parallel gate.

```typescript
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const mobile = matchMedia('(max-width: 767px)');
function setup() {
  if (reduceMotion.matches || !mobile.matches) {
    /* detach scroll listener, disconnect observer, clearInlineStyles() */
  } else {
    /* attach scroll listener, create+observe IntersectionObserver, run onProgress(computeProgress()) once */
  }
}
setup();
reduceMotion.addEventListener('change', setup);
mobile.addEventListener('change', setup);
```

### Accent-color custom-property write
**Source:** `HomeCarousel.astro` lines 728-730 (inside `render()`)
**Apply to:** the new arrival slides' per-gallery accent update (D-09) — reuse the identical two-line `root!.style.setProperty('--current-accent', ...)` / `('--current-accent-text', ...)` call, triggered from the arrival IntersectionObserver callback rather than from `render()`'s existing carousel-index-change path.
```typescript
root!.style.setProperty('--current-accent', accent.bg);
root!.style.setProperty('--current-accent-text', accent.text);
```

### `wordmarkPhotoFilter` heuristic
**Source:** `HomeCarousel.astro` lines 96-99 (module scope) — duplicated once more at script scope (~line 398), already flagged by `20-REVIEW.md` IN-01 as due for extraction
**Apply to:** both the existing carousel's wordmark AND the new full-screen zoom wordmark. This phase is the natural point to extract the single duplicated function into `src/lib/home-carousel.ts` as a shared, unit-testable export, then have both call sites import it.

## No Analog Found

None. Every file/change in this phase's scope has a strong, directly-applicable analog already in the codebase (per RESEARCH.md: "essentially zero new-library risk and 100% wire-existing-site-conventions-together risk").

## Metadata

**Analog search scope:** `src/components/` (`HomeCarousel.astro`, `DetailHero.astro`, `GalleryGrid.astro`, `AboutPageBody.astro`), `src/lib/home-carousel.ts`, `tests/unit/home-carousel.test.ts`, `tests/e2e/*.spec.ts`
**Files scanned:** 5 production files read directly (in full or targeted ranges) + existing test file names surveyed
**Pattern extraction date:** 2026-08-04
