---
phase: 21-homepage-scroll-experience
reviewed: 2026-08-08T00:00:00Z
depth: standard
files_reviewed: 7
files_reviewed_list:
  - src/lib/home-carousel.ts
  - tests/unit/home-carousel.test.ts
  - src/components/HomeCarousel.astro
  - tests/e2e/homepage-scroll-deck.spec.ts
  - src/layouts/BaseLayout.astro
  - src/pages/index.astro
  - src/pages/en/index.astro
findings:
  critical: 1
  warning: 2
  info: 0
  total: 3
status: issues_found
---

# Phase 21: Code Review Report

**Reviewed:** 2026-08-08
**Depth:** standard
**Files Reviewed:** 7
**Status:** issues_found

## Summary

This is the second review pass on Phase 21, scoped to the gap-closure diff since `087df689`: plan 21-07's replacement of the deck's scroll/IntersectionObserver driver with a single per-frame `requestAnimationFrame` loop, 21-08's blur-up placeholder + next-slide warm for deck slides, 21-09's `dvh`→`svh` conversion plus a photo-surface paint floor and a phone-scoped `theme-color` meta tag, and 21-10's new pre-zoom two-beat intro.

The `computeSlideVisibleRatio` addition in `src/lib/home-carousel.ts` is correct, well-tested, and its degenerate-input handling matches the unit tests exactly. The `svh` conversion, paint-floor CSS, and `theme-color` meta wiring are all correctly scoped and match their own e2e assertions.

However, plan 21-10's fix for a real bug (an intro section's own arrival wrongly clobbering the HOME-16 random starting accent) introduced a **new regression**: the same guard it added also silently disables accent-liveness (D-09) and the 21-08 next-slide photo warm (closing 21-UAT.md gap 3) for any real gallery slide that uses Sanity's documented "palette automatique" option (no `heroColor` set) — see CR-01. This is a plausible, ordinary content-editing path, not a hypothetical edge case, and none of the new/rebased e2e tests exercise a heroColor-less gallery, so it is not caught by the test suite.

Two smaller quality issues (WR-01, WR-02) are also flagged: a duplicated magic color literal instead of referencing the existing design token, and a newly-added per-frame function that performs an unconditional DOM write, undermining the adjacent change-detection optimization it sits next to.

## Critical Issues

### CR-01: Deck arrival guard silently disables accent-liveness and next-slide warm for galleries without an explicit `heroColor`

**File:** `src/components/HomeCarousel.astro:1861-1900` (specifically the guard at line 1882)

**Issue:**

Plan 21-10 needed to stop an intro section's own arrival (beat 1 fills the viewport at scroll position 0, so it "arrives" on the very first frame) from clobbering HOME-16's random starting accent. It did this by adding `&& target.dataset.heroColor` to the rising-edge guard inside `applyArrival()`:

```js
if (reached && !wasRevealed && target.dataset.heroColor) {
  root!.style.setProperty('--current-accent', target.dataset.heroColor || 'var(--color-accent)');
  root!.style.setProperty('--current-accent-text', target.dataset.heroTextColor || 'var(--color-on-accent)');
  arrivalAccentWritten = true;
  const slideIndex = Number(target.dataset.index);
  if (!Number.isNaN(slideIndex)) warmNextSlide(slideIndex);
}
```

`data-hero-color` is absent on intro sections (correct, intentional), **but it is also absent on any real gallery slide whose Sanity `heroColor` field is unset** — this is not an edge case: `sanity/schemas/gallery.ts` documents the field as optional, with the explicit description "Choisir le fond du panneau associé à cette collection, **ou conserver la palette automatique**" (choose the panel background, *or keep the automatic palette*). `normalizeHeroColor()` (`src/lib/site-config.ts:55-59`) returns `undefined` in exactly this case, and the deck slide markup (`data-hero-color={gallery.heroColor}`) then omits the attribute entirely.

Before this diff, the guard was only `if (reached && !wasRevealed)`, and the color write itself already had a safe fallback (`slide.dataset.heroColor || 'var(--color-accent)'`) for a missing color. 21-10's new guard removed that fallback path from ever running at all for a real slide:

1. **Accent-liveness (D-09) breaks**: arriving at a "palette automatique" slide no longer updates `--current-accent`/`--current-accent-text` at all — the accent freezes at whatever the previously-arrived (or initial) gallery's color was. If the visitor later scrolls back to that gallery from a different direction, or scrolls past it into an adjacent gallery, the accent can visibly show the *wrong* gallery's color, since `root!.style.setProperty(...)` from an earlier arrival is an inline style that nothing ever resets it back from.
2. **21-08's next-slide warm (21-UAT.md gap 3) regresses**: `warmNextSlide(slideIndex)` is nested inside the same guarded block, so arriving at a heroColor-less slide never promotes the *next* slide's sharp image out of native-lazy. For any gallery after index 1 that follows a heroColor-less gallery, this reintroduces the exact "blur-placeholder-jank" symptom plan 21-08 was written to close.

None of the new/rebased e2e cases in `tests/e2e/homepage-scroll-deck.spec.ts` exercise a gallery without `heroColor` (every `slideHeroColor()`/`readDeckDataEntries()` assertion asserts the color is *truthy*), so this regression is not caught by the current suite.

**Fix:** Distinguish "is a real slide" from "is a real slide with a color" using an attribute that is actually unique to slides (e.g. `data-index`, which only slide anchors carry — intro sections never set it), not `data-hero-color`:

```js
// data-index only exists on real slide anchors — intro sections never set
// it — so this is the correct "is this a real slide, not an intro beat"
// test, independent of whether heroColor happens to be set.
if (reached && !wasRevealed && target.dataset.index !== undefined) {
  root!.style.setProperty('--current-accent', target.dataset.heroColor || 'var(--color-accent)');
  root!.style.setProperty('--current-accent-text', target.dataset.heroTextColor || 'var(--color-on-accent)');
  arrivalAccentWritten = true;
  const slideIndex = Number(target.dataset.index);
  if (!Number.isNaN(slideIndex)) warmNextSlide(slideIndex);
}
```

This restores the pre-21-10 fallback behavior (`'var(--color-accent)'`) for color-less galleries while still keeping intro sections from ever writing an accent, and keeps the next-slide warm firing on every real arrival regardless of whether that gallery opted into a custom `heroColor`.

## Warnings

### WR-01: `phoneThemeColor="#1A1A1A"` duplicates the `--color-ink` token as a magic literal

**File:** `src/pages/index.astro:66`, `src/pages/en/index.astro:60`

**Issue:** Both homepage entry points hardcode `phoneThemeColor="#1A1A1A"`, with a comment noting it "mirrors the color-ink/gray-900 token (BaseLayout.astro)". `--color-ink`/`--gray-900` is defined once, in `src/layouts/BaseLayout.astro`'s `:root` block, as the single source of truth for this value. Duplicating the literal in two page files means a future rebrand/palette change to `--gray-900` silently stops matching the phone status-bar tint, with no compiler/test signal — the two pages must be remembered and updated by hand.

**Fix:** Export the ink value as a plain TS/JS constant (e.g. alongside `HERO_COLORS` in `src/lib/site-config.ts`) and import it in both page files instead of re-typing the hex literal:

```ts
// site-config.ts
export const COLOR_INK = '#1A1A1A'
```
```astro
import { COLOR_INK } from '../lib/site-config';
...
<BaseLayout ... phoneThemeColor={COLOR_INK}>
```

### WR-02: `computeProgress()` performs an unconditional DOM write every animation frame, contradicting its own adjacent change-detection comment

**File:** `src/components/HomeCarousel.astro:2004-2022`

**Issue:** `applyProgress()` (immediately below `computeProgress()`) is explicitly documented as "short-circuit[ing] when the measured progress hasn't changed since last frame, so a stationary page performs zero style writes per frame... only the two cheap rect reads inside `computeProgress()`/`applyArrival()`." But `computeProgress()` itself now calls `applyIntroActive(trackTop)`, which unconditionally calls `root!.setAttribute('data-intro-active', 'true')` or `root!.removeAttribute('data-intro-active')` on **every single call** — i.e. every animation frame the loop is attached, regardless of whether `trackTop`'s sign has changed since the previous frame. This directly contradicts the "zero style writes when stationary" invariant the surrounding code documents and relies on, and it is surprising for a function named `computeProgress` (which reads as a pure getter) to also be the one place a DOM attribute gets mutated on every frame.

**Fix:** Give `applyIntroActive()` its own change-detection, mirroring `applyProgress()`'s `lastProgress` pattern, and/or move it out of `computeProgress()` into `frame()` alongside `applyProgress`/`applyArrival` so the "read" and "write" responsibilities aren't mixed inside one function:

```js
let introActive: boolean | null = null;
function applyIntroActive(trackTop: number) {
  if (introSections.length === 0) return;
  const active = trackTop > 0;
  if (active === introActive) return;
  introActive = active;
  if (active) root!.setAttribute('data-intro-active', 'true');
  else root!.removeAttribute('data-intro-active');
}
```
(Reset `introActive = null` in `clearInlineStyles()` alongside the existing `lastProgress` reset, for the same re-attach-must-always-paint reason.)

---

_Reviewed: 2026-08-08_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
