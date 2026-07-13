---
phase: 07-homepage-quick-fixes-mobile-hero-correctness
reviewed: 2026-07-13T23:00:24Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - src/components/HomeCarousel.astro
  - tests/e2e/homepage.spec.ts
findings:
  critical: 1
  warning: 2
  info: 3
  total: 6
status: issues_found
---

# Phase 07: Code Review Report

**Reviewed:** 2026-07-13T23:00:24Z
**Depth:** standard
**Files Reviewed:** 2
**Status:** issues_found

## Summary

Reviewed `HomeCarousel.astro` (the homepage hero carousel/grid island — markup, client script, and scoped styles) and `tests/e2e/homepage.spec.ts` (its Playwright coverage) at standard depth. The test file is solid: assertions are well-scoped, use Playwright's mocked clock instead of real timers, and correctly account for element visibility/DOM-order ambiguity between the hidden carousel and visible grid.

The component itself has one confirmed, provable regression: a documented legibility fix for the wordmark cutout (`text-shadow`) was silently reverted to `none` in a later commit and never restored, while the code comment directly above it still explains why the shadow is required — the file is shipping with the exact bug that fix was written to solve. I traced this via `git log -S` / `git log -p` to confirm the fix (`c3ef67c`) was overwritten by a later commit that left a `/* temporarily removed for comparison, per user request */` marker in place, and it has never been reverted since (checked through to current HEAD).

Beyond that, the carousel's manual-navigation paths (progress-dash click while not hovering, keyboard arrow keys fired from outside the hero, touch swipe) don't reset the 6s auto-advance timer, so a manual navigation can be immediately overridden by an in-flight auto-advance tick. The progress dashes' ARIA pattern (`role="tab"` + `aria-current`, no `aria-selected`/roving tabindex) is also a minor authoring-practice violation. A few maintainability nits (duplicated fallback strings, coupled magic numbers) round out the info-level findings.

## Critical Issues

### CR-01: Wordmark cutout legibility fix disabled (`text-shadow: none`)

**File:** `src/components/HomeCarousel.astro:1287-1296`
**Issue:** The `@supports (background-clip: text)` block's comment (lines 1287-1295) explicitly documents a live-verified bug — "the plain cutout is illegible wherever the underlying photo crop is busy/low-contrast near a letter's edge (confirmed on both the Silos and Brume galleries — the third line consistently vanished into the photo)" — and describes a soft dark `text-shadow` as the fix. The actual declaration directly below that comment is:
```css
text-shadow: none; /* temporarily removed for comparison, per user request */
```
This negates the very fix the comment describes. Confirmed via `git log -S"temporarily removed for comparison"`: commit `c3ef67c` ("fix(06-01): add contrast text-shadow to the wordmark cutout for legibility") added `text-shadow: 0 1px 2px rgba(0, 0, 0, 0.55), 0 0 18px rgba(0, 0, 0, 0.45);`. A later commit (`dbebd6f`, "feat(06-01): homepage papercut wordmark, morphing toggle, tighter grid") reverted it to `none` with the "temporarily removed... per user request" marker for an A/B comparison, and it was never restored in any subsequent commit through current HEAD (`67f763e`). The wordmark's third line ("Suzanne") will again be illegible against busy/low-contrast photo crops in production — the exact regression the comment says was fixed.
**Fix:** Restore the shadow value that the comment describes and that `c3ef67c` verified live:
```css
text-shadow: 0 1px 2px rgba(0, 0, 0, 0.55), 0 0 18px rgba(0, 0, 0, 0.45);
```
Remove the stale "temporarily removed for comparison" comment once restored, or re-verify live against the Silos/Brume galleries and update the comment to reflect the final decision if a different value is chosen instead.

## Warnings

### WR-01: Manual carousel navigation doesn't reset the auto-advance timer

**File:** `src/components/HomeCarousel.astro:416-521`
**Issue:** `goToIndex()` (dash click, line 460), keyboard `ArrowLeft`/`ArrowRight` (lines 478-489), and touch swipe (lines 503-521) all call `goToPrev()`/`goToNext()`/`goToIndex()` directly, none of which call `stopAutoAdvance()`/`startAutoAdvance()`. The 6s `setInterval` set up by `startAutoAdvance()` (line 423) keeps running on its original schedule. Auto-advance is only paused via `mouseenter`/`focusin` on the `hero` element (lines 445-448) — which happens to cover dash clicks *while the mouse is hovering the hero*, but not:
- Touch swipe (no `mouseenter`/`focusin` fires for touch interactions), so a user who swipes to a specific gallery can have the carousel auto-advance again moments later, overriding their choice.
- Keyboard `ArrowLeft`/`ArrowRight`, which the global `document` listener (line 478) accepts even when focus is outside the `hero` subtree (e.g., focus still on a nav link) — in that case `focusin` never fired on `hero`, so the timer keeps counting down independently of the manual navigation.

This produces a confusing UX where a manual navigation can be immediately followed by an unrelated auto-advance jump.
**Fix:** Call `startAutoAdvance()` (which internally stops then restarts the interval) at the end of `goToPrev()`, `goToNext()`, and `goToIndex()` so any manual navigation resets the 6s countdown:
```ts
function goToIndex(i: number) {
  if (i < 0 || i >= galleries.length || i === carouselIndex) return;
  carouselIndex = i;
  render();
  startAutoAdvance();
}
```
(apply the same trailing call to `goToPrev`/`goToNext`).

### WR-02: Progress-dash ARIA pattern doesn't match `role="tab"` semantics

**File:** `src/components/HomeCarousel.astro:193-204, 412`
**Issue:** The progress indicator uses `role="tablist"` (line 193) with each dash as `role="tab"` (line 200), but the active state is communicated via `aria-current` (lines 201, 412) instead of the `aria-selected` state the ARIA APG tab pattern requires for `role="tab"`. There is no `aria-controls` linking each tab to a corresponding panel, and there's no roving-tabindex management (all dashes remain independently `Tab`-focusable, rather than the APG-expected "one tab in the tab order, arrow keys move focus within the tablist"). Screen reader users will hear "tab" announced without a consistent "selected/not selected" state, which reads as broken/incomplete tab semantics rather than the simple carousel-position indicator this control actually is.
**Fix:** Either drop `role="tablist"`/`role="tab"` in favor of a plain `role="group"` of buttons with `aria-pressed`/`aria-current` (which is what's actually implemented), or commit to the full tab pattern by switching to `aria-selected`, adding `aria-controls`, and implementing roving tabindex + Home/End keyboard support. Given the control is a simple position indicator (not a real tabbed-panel widget), the former is the lower-risk fix.

## Info

### IN-01: Duplicated locale-fallback byline string (frontmatter vs. client script)

**File:** `src/components/HomeCarousel.astro:73, 398-402`
**Issue:** `fallbackByline` is computed once in the frontmatter (line 73) and used for the SSR-rendered first gallery's statement (line 208). The client `<script>`'s `render()` re-implements the same fallback inline instead of reading it from the server-rendered markup:
```ts
statementEl.textContent = gallery.statement || (document.documentElement.lang === 'en'
  ? 'A project by Romane Lepont'
  : 'Un projet de Romane Lepont');
```
If the copy ever changes in the frontmatter constant, the script's hardcoded copy will silently drift out of sync (values currently match, so this is not yet an active bug).
**Fix:** Emit the fallback byline as a data attribute on the `<ul data-role="home-carousel-data">` root (or per-`<li>`) at build time, and have the script read it from there instead of re-hardcoding the strings.

### IN-02: Magic-number coupling between caption height and accent-panel offset (mobile)

**File:** `src/components/HomeCarousel.astro:1504-1509, 1525-1538`
**Issue:** The mobile `.home-hero__caption` height is a hardcoded `108px` (line 1509), and `.home-hero__accent`'s `bottom` offset (line 1529) independently hardcodes the same `108px` value in its `calc()`. These two numbers must be changed together to keep the panel and caption from overlapping, but nothing in the code enforces or documents that link beyond a comment.
**Fix:** Extract the caption height to a CSS custom property (e.g. `--caption-height-mobile: 108px`) used by both rules, so future edits to one automatically stay in sync with the other.

### IN-03: Test-suite comment references a different device than what's actually emulated

**File:** `tests/e2e/homepage.spec.ts:534-554`
**Issue:** The `describe` block comment (lines 534-546) frames the test as a regression guard for "the real-device (iPhone 17 Pro) full-bleed hero bug," but the test itself uses Playwright's bundled `devices['iPhone 14 Pro']` profile (line 553) — there is no "iPhone 17 Pro" entry in Playwright's device catalog. This is already partially self-aware (the comment separately notes the test is Chromium-only emulation, not a real-device guarantee), but the device name mismatch could mislead a future reader into thinking the emulation profile matches the real device the bug was found on.
**Fix:** Update the comment to name the device profile actually used (`iPhone 14 Pro`) or note explicitly that it's the closest available Playwright profile standing in for the real iPhone 17 Pro used during manual verification.

---

_Reviewed: 2026-07-13T23:00:24Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
