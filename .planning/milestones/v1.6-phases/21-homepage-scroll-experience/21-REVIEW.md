---
phase: 21-homepage-scroll-experience
reviewed: 2026-08-10T12:17:46Z
depth: deep
files_reviewed: 4
files_reviewed_list:
  - src/components/HomeCarousel.astro
  - src/lib/home-carousel.ts
  - tests/e2e/homepage-scroll-deck.spec.ts
  - tests/unit/home-carousel.test.ts
findings:
  critical: 0
  warning: 3
  info: 1
  total: 4
status: issues_found
---

# Phase 21: Code Review Report

**Reviewed:** 2026-08-10T12:17:46Z
**Depth:** deep
**Files Reviewed:** 4
**Status:** issues_found

## Summary

This is a scoped, independent re-review of the round-2 UAT gap-closure work only (plans 21-11 through 21-15, the diff between `3c99634` and `HEAD` across the 4 files listed above), not the whole phase. The stale round-1 `21-REVIEW.md` (dated 2026-08-08, scoped to 7 files including layout/page files not touched by round 2) has been replaced entirely by this review.

I read every line of the diff plus the surrounding file (both `<script>` blocks and the full `<style>` block in `HomeCarousel.astro`, all of `src/lib/home-carousel.ts`, and both test files in full), traced the `--deck-vh` custom property from its single writer (`syncDeckViewportHeight()`) through every CSS consumer, traced `data-zoom-active`/`data-intro-active` through the full scroll-position state machine (including the 21-14 `:not([data-intro-active])` addendum), and manually re-derived the intro/zoom/slide scroll-offset algebra from the CSS `height`/`margin-top` expressions to confirm the geometry the plans' own comments claim actually holds.

The geometry, the hysteresis latch (`computeArrivalRevealed`), the intro scrub curve (`computeIntroScrubState`), and the `--deck-vh` consumers in CSS are all internally consistent and match what the extensive inline documentation claims — I could not find a defect in the core scroll-position math, the 21-12 pull-up/stage-retirement coincidence, or the 21-14 header/logo-suppression scoping. The unit and e2e test coverage for the new pure functions is unusually thorough and I did not find gaps in it, nor orphaned CSS classes/data-roles/test helpers left over from the retired two-beat intro design (grepped for `beat`/`intro-beat`/`deck-intro` residue — none found outside historical comments).

What I did find: one real cross-plan consistency bug in the arrival-ratio viewport-height source (the exact class of risk the plans' own threat model calls out for `--deck-vh`, but in a code path 21-11 didn't touch), one place where a documented hot-path invariant ("zero style writes when stationary") is not actually honored, and a no-JS content-visibility gap in the new pinned intro tagline. None of these are being flagged reflexively — each is traced to a specific line and a concrete mechanism below. No security issues, no dead imports/exports, no orphaned test helpers.

## Warnings

### WR-01: `applyArrival()`'s viewport-height source is not the same expression `--deck-vh` uses, contradicting the very invariant plan 21-11 exists to guarantee

**File:** `src/components/HomeCarousel.astro:2002` (also compare `:1877`)
**Issue:** Plan 21-11 introduced `--deck-vh` specifically because a plain `window.innerHeight`/`100svh` read can disagree with the browser's live visible viewport height during Mobile Safari's toolbar collapse/expand animation (the whole subject of round-2 gap 4), and it made every CSS consumer of viewport height in this deck (`intro-track`, `intro-stage`, `zoom-track`, `zoom-stage`, the `.home-scroll-deck__slides` pull-up margin, `.home-slide`, the wordmark padding) read the identical `var(--deck-vh, 100svh)` expression, sourced from `syncDeckViewportHeight()`'s `vv.scale <= 1.01 ? vv.height : window.innerHeight` logic.

`applyArrival()` — the function that decides, every painted frame, whether a slide has "arrived" (feeding `computeArrivalRevealed`, the live accent write, and the 21-08 next-slide image warm) — was written before 21-11 and was never updated to match:

```js
function applyArrival() {
  const viewportHeight = window.innerHeight;   // <-- not --deck-vh's source
  slides.forEach((target) => {
    const rect = target.getBoundingClientRect(); // rect.height tracks --deck-vh
    const ratio = computeSlideVisibleRatio(rect, viewportHeight);
    ...
```

`rect.height` here is the slide's live rendered height, which is CSS-sized from `var(--deck-vh, 100svh)` (i.e. `visualViewport.height` in the common non-zoomed case). The ratio's denominator (`computeSlideVisibleRatio`'s `min(rect.height, viewportHeight)`) and its visible-window clamp both use `window.innerHeight` instead — a second, independently-sourced viewport height that is not guaranteed to agree with the one that actually sized the slide, especially while both are changing during a live scroll (the exact scenario 21-11's own docstring names: "Mobile Safari's toolbar-collapse animation ... can report sub-pixel height deltas on some frames"). This is precisely the class of bug 21-11 fixed for CSS sizing, reintroduced here for the JS reveal/accent/warm logic 21-15 just spent a whole plan hardening.

The existing test suite cannot catch this: the `--deck-vh` describe block's own comments document that "a fixed-viewport Playwright engine has no dynamic browser chrome to animate mid-scroll," and every arrival case in this file targets a settled scroll position where `visualViewport.height === window.innerHeight`, so the divergence never manifests in CI.

**Fix:**
```js
function applyArrival() {
  const viewportHeight = mobile.matches && lastDeckVh !== DECK_VH_SENTINEL ? lastDeckVh : window.innerHeight;
  ...
```
(`lastDeckVh` is already the module-scope cache `syncDeckViewportHeight()` maintains, and `frame()` already calls `syncDeckViewportHeight()` before `applyArrival()` in the same frame, so this requires no new measurement — just reusing the value that already determined `rect.height`.)

### WR-02: `applyArrival()` writes `classList` unconditionally every frame, contradicting the documented "zero style writes when stationary" invariant

**File:** `src/components/HomeCarousel.astro:2001-2046` (contrast with `applyProgress()` at `:2222-2226` and `applyIntroScrub()` at `:2258-2275`)
**Issue:** The file's own comments are explicit about a hot-path invariant: `applyProgress()`'s comment states "a stationary page performs zero style writes per frame ... only the two cheap rect reads inside `computeProgress()`/`applyArrival()`" (line ~2217), and `applyIntroScrub()` mirrors the same change-detection cache (`lastIntroProgress`) for the identical reason.

`applyArrival()` has no equivalent guard:
```js
slides.forEach((target) => {
  const rect = target.getBoundingClientRect();
  const ratio = computeSlideVisibleRatio(rect, viewportHeight);
  const wasRevealed = target.classList.contains('is-revealed');
  const reached = computeArrivalRevealed(ratio, wasRevealed);
  target.classList.toggle('is-revealed', reached);   // <-- always runs
  ...
```
`Element.classList.toggle(token, force)` always executes the DOMTokenList "update steps," which re-serialize and write the element's `class` attribute regardless of whether membership actually changed — it is not a no-op write when the value is unchanged. So on a fully stationary page (no scrolling, driver still attached and still running its rAF loop), this writes to every slide's `class` attribute 60 times a second, for as long as the visitor stays on the page — directly contradicting the "only cheap rect reads" claim the surrounding code relies on future maintainers trusting.

**Fix:** Gate the write the same way `applyProgress()`/`applyIntroScrub()` already do:
```js
if (reached !== wasRevealed) {
  target.classList.toggle('is-revealed', reached);
}
```
(the accent/warm block below already only fires `if (reached && !wasRevealed && ...)`, so this doesn't change any existing behavior — it only stops the redundant same-value write.)

### WR-03: The pinned intro's tagline has no fallback for a visitor with JavaScript disabled — it stays permanently invisible

**File:** `src/components/HomeCarousel.astro:4038-4046` (base rule) vs. `:4571-4605` (the only override, gated on `prefers-reduced-motion: reduce`)
**Issue:** `.home-scroll-deck__intro-body`'s rest state, introduced by plan 21-13, is:
```css
.home-scroll-deck__intro-body {
  grid-row: 3;
  align-self: start;
  max-width: 52ch;
  font-size: 14px;
  line-height: 1.4;
  opacity: 0;
  transform: translateY(8px);
}
```
The only two things that ever move `opacity` off `0` are: (1) `applyIntroScrub()` in the deck driver `<script>`, which requires JavaScript to be enabled and requires `mobile.matches && !reduceMotion.matches`; and (2) the `@media (max-width: 767px) and (prefers-reduced-motion: reduce)` block, which sets `opacity: 1` unconditionally — but only for visitors whose OS/browser reports a reduced-motion preference.

A phone-width visitor with JavaScript disabled and no reduced-motion preference set gets neither: the intro logomark and scroll cue render fine (they're plain CSS/markup with no JS-only rest state), but the tagline — real, Sanity-authored descriptive copy (`siteCopy.homepageIntro`), not decoration — never becomes visible. This is a real content-availability gap, not a progressive-enhancement nicety: the same rest-state pattern (`opacity: 0`, revealed only by JS or by the reduced-motion override) is used elsewhere in this file too (e.g. `.home-slide__description`), so it isn't unique to the intro, but plan 21-13 is what created this exact rule and had the opportunity to close the gap for at least the new code; it didn't. The rest of this file is otherwise conspicuously careful about the "pre-JS, JS disabled" case (see the comments at lines ~283, ~3927-3928, ~4154, ~4478, ~4549 that explicitly reason about it for the header, the pull-up margin, and the wordmark) — this is the one place in the round-2 diff where that discipline lapsed.

**Fix:** Add a `@media (scripting: none)` fallback (or, more conservatively, drop the `opacity: 0` default and instead apply it only from a class the script adds on successful attach), e.g.:
```css
@media (max-width: 767px) and (scripting: none) {
  .home-scroll-deck__intro-body {
    opacity: 1;
    transform: none;
  }
}
```

## Info

### IN-01: `.home-scroll-deck__stage` is declared as two separate, non-adjacent rule blocks

**File:** `src/components/HomeCarousel.astro:4111-4119` and `:4158-4179`
**Issue:** The selector `.home-scroll-deck__stage` appears twice in the stylesheet — once with `position`/`top`/`height`/`overflow`/`display` (pre-existing, from plan 21-09), and again ~40 lines later with `background-color`/`z-index` (added by plan 21-12). Both are individually well-commented and this is functionally harmless (CSS merges declarations for the same selector regardless of source order), but it means a future reader searching for "everything `.home-scroll-deck__stage` sets" via a single text search of the selector's first occurrence will miss the second block, and a future editor changing one is more likely to leave the other stale.
**Fix:** Not urgent; if this file is touched again, consider merging the two declarations into one rule block (or leaving an explicit comment cross-reference at the first occurrence pointing at the second).

---

_Reviewed: 2026-08-10T12:17:46Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_
