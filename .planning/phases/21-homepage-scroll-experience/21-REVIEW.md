---
phase: 21-homepage-scroll-experience
reviewed: 2026-08-05T00:00:00Z
depth: standard
files_reviewed: 12
files_reviewed_list:
  - src/lib/home-carousel.ts
  - src/components/HomeCarousel.astro
  - tests/unit/home-carousel.test.ts
  - tests/e2e/homepage-wordmark-peek.spec.ts
  - tests/e2e/critical.smoke.spec.ts
  - tests/e2e/accessibility.spec.ts
  - tests/e2e/mobile-nav.spec.ts
  - tests/e2e/homepage-mobile-responsive.spec.ts
  - tests/e2e/homepage-content-display.spec.ts
  - tests/e2e/homepage-scroll-deck.spec.ts
  - tests/e2e/gallery.spec.ts
  - tests/e2e/homepage-accent-random.spec.ts
findings:
  critical: 1
  warning: 3
  info: 1
  total: 5
status: issues_found
---

# Phase 21: Code Review Report

**Reviewed:** 2026-08-05T00:00:00Z
**Depth:** standard
**Files Reviewed:** 12
**Status:** issues_found

## Summary

Reviewed the phase 21 homepage scroll-experience implementation: the pure
computational module `src/lib/home-carousel.ts`, the `HomeCarousel.astro`
component (frontmatter + two client `<script>` blocks + styles), its unit
tests, and the e2e specs listed in scope. `src/lib/home-carousel.ts` is
clean — every exported function is byte-matched by the unit tests
(`tests/unit/home-carousel.test.ts`), including the documented degenerate
cases (zero-width rects, zero reveal distance, clamp opt-out). The new
phone-width scroll-deck markup/CSS/driver (plans 21-04/21-05/21-06) is
well-covered by `homepage-scroll-deck.spec.ts`.

The one real defect found is architectural: the pre-existing desktop
carousel's `<script>` block (auto-advance timer, HOME-16 random-accent
init) has no phone-width gate at all, and it shares the `--current-accent`/
`--current-accent-text` CSS custom properties with the brand-new,
phone-only zoom-wordmark introduced by this phase. Below 767px the carousel
DOM is only `display:none`-hidden, not detached or gated in JS — so its
6-second auto-advance interval keeps ticking, silently overwriting the same
custom properties the visible zoom-wordmark's text color depends on. See
CR-01 below for the full trace and why it isn't currently caught by any
scoped test. Three further warnings (duplicated magic number between CSS
and the exported `ZOOM_REVEAL_DISTANCE` constant, unmanaged background
network usage as a side effect of CR-01, and an ARIA role/state mismatch on
the progress dashes) and one info item are also recorded.

## Critical Issues

### CR-01: Mobile zoom-wordmark's text color silently cycles every 6 seconds due to the desktop carousel's un-gated auto-advance sharing `--current-accent-text` with the phone-only zoom stage

**File:** `src/components/HomeCarousel.astro:867-908` (auto-advance interval), `:1531-1533` (unconditional startup call), `:933-939` (reduced-motion toggle also (re)starts it), `:3397` (the mobile-only consumer)

**Issue:**
The first `<script>` block (the pre-existing desktop carousel, lines
420-1588) has no viewport gate anywhere in it — `hoverCapable` only gates
hover/peek-specific features, and `root.dataset.displayMode` is set to
`'carousel'` in the server-rendered markup (`HomeCarousel.astro:112`) and
is only ever flipped to `'grid'` by the mode-toggle button's click handler.
That button is `display:none` below 767px (`:3317`), so on a phone
`data-display-mode` stays `'carousel'` forever, and:

```js
function startAutoAdvance() {
  stopAutoAdvance();
  if (autoAdvancePausedByUser || root!.dataset.displayMode !== 'carousel') return;
  timer = setInterval(() => {
    carouselIndex = (carouselIndex + 1) % galleries.length;
    ...
    render(true);   // <-- writes --current-accent / --current-accent-text on `root`
    ...
  }, 6000);
  ...
}
```

is invoked unconditionally at the bottom of the script (`render();
syncAutoplayControl(); startAutoAdvance();`, lines 1531-1533) on every page
load, at every viewport width, including phones where `.home-hero` is
`display:none`. The interval keeps running indefinitely (nothing ever calls
`stopAutoAdvance()` for a phone-width visitor — `focusin`/`focusout` only
pause/resume it, they never permanently stop it), and every tick calls
`render(true)`, which does:

```js
root!.style.setProperty('--current-accent', accent.bg);
root!.style.setProperty('--current-accent-text', accent.text);
```

on the shared `.home` root element (`root` in both scripts resolves to the
same `<section class="home" data-display-mode="...">`).

Meanwhile, this phase's own new phone-only zoom-wordmark reads that exact
same custom property for its own text color:

```css
/* :3397, inside the "@media (max-width: 767px)" scroll-deck styles */
.home-scroll-deck__wordmark {
  ...
  color: var(--current-accent-text, var(--color-on-accent));
}
```

So a phone visitor sitting on the full-screen intro wordmark (the very
state D-16 documents as "intro-only", implicitly a stable first
impression) will see its text color silently change every 6 seconds as the
invisible desktop carousel auto-advances underneath it — entirely
independent of, and racing against, this phase's own arrival
`IntersectionObserver` (`:1650-1675`), which legitimately writes the same
two properties once a slide arrives and is the ONLY accent writer that's
supposed to be live on a phone before the header reappears.

This is not exercised by the existing test suite: `homepage-scroll-deck.spec.ts`'s
`'phase-20 accent preserved...'` test (`tests/e2e/homepage-scroll-deck.spec.ts:443-451`)
only samples the accent once, immediately after `page.goto('/')`, and
`homepage-accent-random.spec.ts` never asserts stability over time either — none of
the scoped specs wait 6+ seconds at scroll position 0 on a phone viewport, which is
exactly the window in which the bug is observable.

**Fix:** Gate the entire first `<script>` block's auto-advance lifecycle
(and, ideally, its `render()`-driven preloading — see WR-02) behind the
same `(max-width: 767px)` media query the second script already uses, e.g.:

```js
const desktopCarousel = window.matchMedia('(max-width: 767px)');
function maybeStartAutoAdvance() {
  if (desktopCarousel.matches) { stopAutoAdvance(); return; }
  startAutoAdvance();
}
// replace the bare `startAutoAdvance()` call at the bottom, the
// focusout listener, and the reduced-motion-change branch with
// `maybeStartAutoAdvance()`, and add:
desktopCarousel.addEventListener('change', maybeStartAutoAdvance);
```

## Warnings

### WR-01: `ZOOM_REVEAL_DISTANCE` (900) is duplicated as an untracked CSS literal, with nothing enforcing the two stay in sync

**File:** `src/components/HomeCarousel.astro:3325-3335`; `src/lib/home-carousel.ts:209`

**Issue:** The zoom track's height is hardcoded in CSS as `calc(100dvh +
900px)`, and the comment directly on top of it (`:3326-3332`) already
acknowledges the risk: "if the Cinematic pace is ever retuned... BOTH this
literal and the exported constant must move together, or plan 21-05's
driver... will disagree with how tall this track actually is." There is no
compile-time (CSS can't import a TS constant) or test-time assertion tying
the two together — `homepage-scroll-deck.spec.ts`'s `getRevealDistance()`
helper derives its expected distance from the live DOM (track height minus
viewport height), so it would keep passing even if the CSS's `900px` and
`ZOOM_REVEAL_DISTANCE` silently drifted apart; it can't detect the
divergence because it never independently re-derives the expected value
from the constant itself.

**Fix:** Add a `data-reveal-distance={ZOOM_REVEAL_DISTANCE}` attribute (or
similar) on the track element rendered from the frontmatter/constant, and
either (a) read it in CSS via a custom property computed from that
attribute, or (b) add a unit/e2e assertion that reads both the exported
constant and the rendered track's `getBoundingClientRect()` height and
fails if they disagree by more than a pixel of rounding. At minimum, add a
guard test asserting `trackHeight - viewportHeight === ZOOM_REVEAL_DISTANCE`
rather than only using it to derive scroll targets.

### WR-02: Same CR-01 root cause causes indefinite background network usage on phones

**File:** `src/components/HomeCarousel.astro:799-809`

**Issue:** As a direct consequence of CR-01 (the desktop carousel's
auto-advance interval never being gated off on phone widths), every 6-second
tick of `render(true)` also runs the D-05 image-preload warm-up:

```js
const nextIndex = (carouselIndex + 1) % galleries.length;
const nextSrc = galleries[nextIndex]?.heroSrc;
if (nextSrc) {
  const preload = new Image();
  preload.srcset = galleries[nextIndex]?.heroSrcSet ?? '';
  preload.sizes = '100vw';
  preload.src = nextSrc;
}
```

On a phone this fires forever for a carousel that is never shown (the
scroll deck already eagerly loads its own first slide and lazy-loads the
rest), silently downloading a full-size responsive hero image over the
visitor's mobile connection every 6 seconds for as long as the tab stays
open on the homepage. This is a real data-usage/battery cost, not merely a
speed concern, and disappears once WR-01/CR-01's viewport gate is added.

**Fix:** Covered by the same fix as CR-01 — gating `startAutoAdvance()` (and
therefore every `render(true)` tick) off on phone widths removes this
network cost as a side effect.

### WR-03: Progress-dash `role="tablist"`/`role="tab"` pairing uses `aria-current` instead of the ARIA-required `aria-selected`, and implements no tab keyboard pattern

**File:** `src/components/HomeCarousel.astro:226-236` (markup), `:795` (JS update)

**Issue:** The carousel's gallery-picker dashes are marked up as a
`tablist`/`tab` pair:

```astro
<div class="home-hero__progress" data-role="progress" role="tablist" ...>
  {galleries.map((gallery, i) => (
    <button type="button" class="home-hero__progress-dash" role="tab"
      aria-current={i === 0 ? 'true' : 'false'} ... />
  ))}
</div>
```

Per the ARIA spec, `role="tab"` requires `aria-selected` as its selected
state (not `aria-current`, which has different semantics — "current item
within a set", used for e.g. breadcrumbs/pagination). Using `aria-current`
here means a screen reader announcing this widget as a tablist will not
correctly report which tab is selected. Additionally, the ARIA `tablist`
authoring pattern implies arrow-key navigation between tabs (Left/Right/
Home/End moving focus, not just the whole-carousel `ArrowLeft`/`ArrowRight`
navigation wired at document level for photo advance) — none of that is
implemented; each dash is just a plain, independently-tabbable `<button>`.
This mismatch between declared role semantics and actual keyboard/state
behavior is a real assistive-tech UX defect, even though it isn't currently
flagged by the axe-core scan in `accessibility.spec.ts` (axe's automated
checks don't fully validate the tablist interaction pattern).

**Fix:** Either (a) drop `role="tablist"`/`role="tab"` entirely in favor of
a plain labeled group of buttons (e.g. `role="group"` + `aria-label`, each
button using `aria-current="true"` as already written, which is valid and
correctly conveys "the current gallery" semantics for a non-tab widget), or
(b) keep the tab semantics but switch to `aria-selected` and implement the
standard tablist roving-tabindex/arrow-key pattern. Option (a) is the
smaller, lower-risk change given the existing keyboard model (global
Left/Right already drives photo navigation independently of dash focus).

## Info

### IN-01: Desktop carousel's global `keydown` listener still mutates a `display:none` subtree on phones

**File:** `src/components/HomeCarousel.astro:1009-1020`

**Issue:** The `ArrowLeft`/`ArrowRight` handler is attached to `document`
and gated only by `root!.dataset.displayMode !== 'carousel'` — which, per
CR-01's trace, is always `'carousel'` on a phone. An external keyboard or
switch-access device on a phone would still trigger `goToPrev()`/
`goToNext()` against the hidden carousel, calling `render()` and mutating
`--current-accent`/`--current-accent-text` exactly as CR-01 describes,
compounding that bug's symptom. Low real-world likelihood (few phone users
attach hardware keyboards), but worth folding into the same viewport-gate
fix.

**Fix:** No separate fix needed beyond CR-01's gate — once
`startAutoAdvance`/`render`'s side effects are properly scoped off-phone,
consider also short-circuiting this keydown handler with the same
`matchMedia('(max-width: 767px)')` check for consistency.

---

_Reviewed: 2026-08-05T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
