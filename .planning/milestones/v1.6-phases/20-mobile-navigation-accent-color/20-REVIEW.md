---
phase: 20-mobile-navigation-accent-color
reviewed: 2026-08-04T00:00:00Z
depth: standard
files_reviewed: 12
files_reviewed_list:
  - src/components/HomeCarousel.astro
  - src/components/MobileNavPanel.astro
  - src/components/SiteHeader.astro
  - src/lib/home-carousel.ts
  - tests/e2e/accessibility.spec.ts
  - tests/e2e/critical.smoke.spec.ts
  - tests/e2e/homepage-accent-random.spec.ts
  - tests/e2e/homepage-chrome-nav.spec.ts
  - tests/e2e/homepage-mobile-responsive.spec.ts
  - tests/e2e/mobile-nav.spec.ts
  - tests/e2e/site-header.spec.ts
  - tests/unit/home-carousel.test.ts
findings:
  critical: 1
  warning: 3
  info: 2
  total: 6
status: issues_found
---

# Phase 20: Code Review Report

**Reviewed:** 2026-08-04T00:00:00Z
**Depth:** standard
**Files Reviewed:** 12
**Status:** issues_found

## Summary

Reviewed the homepage carousel/header/mobile-nav components and their pure
logic module (`src/lib/home-carousel.ts`), plus the e2e/unit specs that cover
them. This is a re-review of a narrower file set than a prior pass over this
phase: several previously-flagged issues in the earlier `20-REVIEW.md`
(a `WR-02` hidden-toggle focus bug, a duplicate dialog/nav `aria-label`, and a
flaky `homepage-accent-random.spec.ts` distinctness assertion) have visibly
been fixed in the current source — the focus call is now guarded with
`toggle!.offsetParent !== null`, the dialog's `aria-label` no longer
duplicates the `<nav>`'s, and the flaky distinctness assertion has been
removed with an explanatory comment. Those are not re-reported here.

The mobile-nav dialog (`MobileNavPanel.astro`) and header opt-in wiring
(`SiteHeader.astro`) remain solid: the native `<dialog>` API is used
correctly for focus containment/Escape/restore, the sibling-not-descendant
structural constraint is respected, and the reduced-motion/breakpoint-
crossing edge cases are explicitly handled.

The one blocking defect found in this pass is in `HomeCarousel.astro`'s
touch handling: the carousel's tap-to-open gesture is wired to the whole
`.home-hero__photo` container without excluding taps that land on the
progress dashes / autoplay toggle nested inside it, unlike the equivalent
desktop click handler a few hundred lines later, which explicitly excludes
that region. On a real touchscreen this makes tapping a progress dot or the
pause/play button also fire `openCurrent()` (a real page navigation), which
the existing touch e2e coverage (`tests/e2e/homepage-wordmark-peek.spec.ts`,
outside this review's file list) does not exercise because it only
synthesizes taps in the open photo area, never on the caption controls.

## Critical Issues

### CR-01: Touch tap-to-open hijacks taps on the progress dashes and autoplay toggle

**File:** `src/components/HomeCarousel.astro:970-1002`
**Issue:** The `touchstart`/`touchend` listeners that implement swipe-nav and
tap-to-open are attached to `.home-hero__photo` (`heroPhoto`), which is the
ancestor of `.home-hero__caption` — the element that contains the real
`<button>` progress dashes (`data-role="progress"` dots) and the autoplay
pause/play toggle (`data-role="autoplay-toggle"`). Touch events bubble, so a
tap on a progress dot or the autoplay toggle also reaches this handler.
Because the net finger movement for a genuine tap on a small button is
within `TAP_MAX_MOVEMENT` (10px) on both axes, `detectSwipeDirection()`
returns `null` and the handler falls through to:

```ts
if (Math.abs(deltaX) <= TAP_MAX_MOVEMENT && Math.abs(deltaY) <= TAP_MAX_MOVEMENT) {
  openCurrent();
}
```

`openCurrent()` calls `titleEl.click()`, which is a real `<a href>`
navigation to the gallery-detail page. This fires on `touchend`, i.e.
*before* the button's own synthesized `click` handler (`goToIndex()` /
autoplay toggle) has a chance to run, and the resulting page navigation
supersedes it. In practice this means the progress dashes and the autoplay
toggle are effectively non-functional on touch devices — every tap on them
instead navigates away to the currently-showing gallery.

The equivalent desktop path (`heroPhoto.addEventListener('click', ...)`,
around line 1314) already guards against exactly this by excluding clicks
inside the caption:

```ts
heroPhoto.addEventListener('click', (event) => {
  if (committing || opening) return;
  const target = event.target as HTMLElement;
  if (target.closest('.home-hero__caption')) return;   // <-- missing equivalent in touchend
  ...
});
```

but the touch handler has no analogous check. The existing touch e2e
coverage (`tests/e2e/homepage-wordmark-peek.spec.ts`, not in this review's
scope) only synthesizes taps at the center of `.home-hero__photo`
(`clientX`/`clientY` well outside the caption), so it never exercises this
path and the regression is currently invisible to the suite.

**Fix:**
```ts
heroPhoto?.addEventListener('touchend', (event) => {
  const touch = event.changedTouches[0];
  if (!touch) return;
  const target = event.target as HTMLElement | null;
  if (target?.closest('.home-hero__caption')) return; // mirror the desktop click guard
  const deltaX = touch.clientX - touchStartX;
  const deltaY = touch.clientY - touchStartY;
  const direction = detectSwipeDirection(deltaX, deltaY, SWIPE_MIN_DISTANCE, SWIPE_DIRECTION_RATIO);
  if (direction === 'next') {
    goToNext();
    return;
  }
  if (direction === 'prev') {
    goToPrev();
    return;
  }
  if (Math.abs(deltaX) <= TAP_MAX_MOVEMENT && Math.abs(deltaY) <= TAP_MAX_MOVEMENT) {
    openCurrent();
  }
}, { passive: true });
```
Add a regression test (in `homepage-wordmark-peek.spec.ts`'s mobile suite, or
a new one) that synthesizes a touchstart/touchend directly on a progress
dash's real coordinates and asserts the carousel index changes without a
navigation occurring.

## Warnings

### WR-01: `computeWordmarkSeamFraction`'s degenerate branch ignores `zone`, contradicting its own documented contract

**File:** `src/lib/home-carousel.ts:149-162`
**Issue:** The function's own doc comment states the "rest" extreme is
`s=1` for the `right` zone and `s=0` for the `left` zone ("at neutral the
seam fraction naturally rests at its current-covers-all extreme (s=1 for
right, s=0 for left)"). The zero-width guard, however, always returns `1`
regardless of `zone`:

```ts
if (wordmarkWidth <= 0) return 1;
```

Callers elsewhere in `HomeCarousel.astro` (`syncWordmarkLayers()`'s own
`restExtreme = zone === 'right' ? '1' : '0';` fallback, used for the
analogous "no peek image yet" degenerate case) correctly branch on `zone`,
showing the intended behavior — this pure function's degenerate case does
not match it. It only manifests when the wordmark box literally collapses to
zero width, but when it does, a `left`-zone seam would incorrectly render as
"current covers all" (1) rather than "peekPrev covers all" (0), and no test
in `tests/unit/home-carousel.test.ts` exercises the `left`-zone degenerate
case to catch it (only the `right`-zone case is tested).
**Fix:**
```ts
if (wordmarkWidth <= 0) return zone === 'right' ? 1 : 0;
```
Add a companion unit test for `computeWordmarkSeamFraction('left', 0, 1920, 1300, 0)` asserting `0`.

### WR-02: Mobile-nav panel's primary-nav `aria-label` is hardcoded English, unlike every sibling label in the same component

**File:** `src/components/SiteHeader.astro:77`, consumed at `src/components/MobileNavPanel.astro:93`
**Issue:** `openMenuLabel`/`closeMenuLabel` are both correctly derived from
`isEnLocale` a few lines above, but `menuLabel` is a bare literal:

```ts
const openMenuLabel = isEnLocale ? 'Open menu' : 'Ouvrir le menu';
const closeMenuLabel = isEnLocale ? 'Close menu' : 'Fermer le menu';
const menuLabel = 'Menu';
```

This value is used as the accessible name of the panel's primary `<nav>`
(`aria-label={menuLabel}` in `MobileNavPanel.astro:93`). Every other string
threaded through this exact code path is locale-conditional; this one
silently isn't, which — given how deliberately bilingual the rest of the
codebase is (every other label in this same block, plus the whole
fr-at-root/en-under-`/en/` i18n setup) — reads as an oversight rather than an
intentional choice, and means French screen-reader users get an unlocalized
landmark name.
**Fix:**
```ts
const menuLabel = isEnLocale ? 'Menu' : 'Menu principal';
```

### WR-03: The mobile-nav `<dialog>`'s accessible name is the site title, not a menu-appropriate label

**File:** `src/components/MobileNavPanel.astro:69`
**Issue:**
```astro
<dialog id="mobile-nav" class="mobile-nav-panel" data-role="mobile-nav-panel" aria-label={siteTitle}>
```
The dialog's `aria-label` is the brand wordmark ("Atelier Jacqueline
Suzanne"), the same accessible name the page's own `<h1>`/logo link exposes.
A screen-reader user who opens the panel hears a dialog named identically to
the site itself, rather than something identifying it as navigation. (A
prior version of this component used `menuLabel` for the dialog too, which
caused a different problem — duplicating the child `<nav>`'s own "Menu"
label — but swapping to the site title trades one minor usability issue for
another rather than fixing it outright.) This is not caught by the existing
axe scans in `tests/e2e/accessibility.spec.ts` because a merely-confusing
(non-duplicate, present) accessible name isn't a WCAG rule violation, only a
usability regression.
**Fix:** Label the dialog with something that identifies it as the site's
navigation without colliding with the nested `<nav>`'s own label, e.g. a
distinct string such as `"${siteTitle} — menu"`, or drop the dialog-level
`aria-label` entirely and let assistive tech fall through to the nested
`<nav>`'s label.

## Info

### IN-01: `wordmarkPhotoFilter` is duplicated verbatim between frontmatter and client script

**File:** `src/components/HomeCarousel.astro:96-99` and `:398-401`
**Issue:** The exact same brightness/contrast heuristic function is defined
twice — once in the Astro frontmatter (used for the initial SSR style) and
once again inside the `<script>` block (used by `render()`). Every other
piece of pure, reusable math in this component has already been extracted to
`src/lib/home-carousel.ts` (that's the whole stated purpose of the module,
per its own header comment) — this one function was left behind as inline
duplication in both places instead.
**Fix:** Move `wordmarkPhotoFilter` into `src/lib/home-carousel.ts` (it is
already pure/DOM-free) and import it in both places, the same way
`computeHoverZone`/`detectSwipeDirection`/etc. are imported into the client
script.

### IN-02: `opening` guard in `openCurrent()` can permanently latch `true` if there is no valid fallback href

**File:** `src/components/HomeCarousel.astro:1013-1037`
**Issue:**
```ts
let opening = false;
function openCurrent() {
  if (opening) return;
  opening = true;
  ...
  if (titleEl) {
    titleEl.click();
  } else {
    const fallbackHref = galleries[carouselIndex]?.href;
    if (fallbackHref) window.location.href = fallbackHref;
  }
}
```
In the normal path `titleEl` exists and a real navigation begins, so `opening`
staying `true` forever is moot (the page unloads). But if `titleEl` is ever
null (a markup regression) and `fallbackHref` is also falsy, no navigation
happens and `opening` is never reset — every subsequent tap/click on the
center zone becomes a permanent no-op for the rest of the page's lifetime,
with no recovery path. Low likelihood given `titleEl` is server-rendered
alongside the rest of this markup, but the guard has no unlock path for its
own dead-end branch.
**Fix:** Reset the flag when no navigation actually occurs:
```ts
} else {
  const fallbackHref = galleries[carouselIndex]?.href;
  if (fallbackHref) {
    window.location.href = fallbackHref;
  } else {
    opening = false;
  }
}
```

---

_Reviewed: 2026-08-04T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
