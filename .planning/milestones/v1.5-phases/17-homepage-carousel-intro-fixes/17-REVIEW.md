---
phase: 17-homepage-carousel-intro-fixes
reviewed: 2026-08-02T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - src/components/HomeCarousel.astro
  - tests/e2e/homepage-carousel-core.spec.ts
  - tests/e2e/homepage-content-display.spec.ts
findings:
  critical: 0
  warning: 3
  info: 2
  total: 5
status: issues_found
---

# Phase 17: Code Review Report

**Reviewed:** 2026-08-02T00:00:00Z
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

`HomeCarousel.astro` is a large (~2865 line), heavily-commented vanilla-JS island implementing the hero carousel, edge-hover peek/parallax interaction, wordmark photo-cutout, grid toggle, and cross-document view-transition morphs. The inline commentary shows real iteration on prior bugs (Safari transition jitter, wordmark desync, abrupt edge-click pop, mobile view-transition regressions) and the fixes read as deliberate, well-reasoned patches rather than guesses. No security issues, hardcoded secrets, dangerous DOM sinks (`innerHTML`/`eval`), or debug artifacts (`console.log`/`TODO`/`debugger`) were found.

The main defect found is a genuine, previously-unhandled race: the desktop edge-click "commit" animation (`commitEdge()`) sets a `committing` re-entrancy flag that gates the photo's own `click` handler, but keyboard arrow-key navigation, progress-dash clicks, and the mode toggle all call `goToPrev()`/`goToNext()`/`goToIndex()` (and `showGrid()`) directly, with no awareness of `committing`. A user who clicks an edge zone and then, within the ~480ms commit window, presses an arrow key or clicks a dash can end up with the carousel index advancing twice (once from the interrupted `commitEdge()`'s deferred `finish()`, once from the direct navigation call), producing a skipped or duplicated slide. Two further code-quality issues (ARIA `tab` role misuse, duplicated `wordmarkPhotoFilter`/`6000ms` logic between server and client / JS and CSS) round out the warnings.

Test files were reviewed for reliability only (per scope) — no flaky patterns or incorrect assertions were found; both spec files are well-scoped to visible, mode-specific containers and use `page.clock`/`emulateMedia` correctly to avoid timing flakiness.

## Warnings

### WR-01: `commitEdge()`'s re-entrancy guard is not honored by keyboard/dash/mode-toggle navigation, allowing a double-advance race

**File:** `src/components/HomeCarousel.astro:836-853, 855-869, 876-887, 1058-1156`

**Issue:** `commitEdge()` (desktop edge-zone click) sets `committing = true` and defers the actual `carouselIndex` mutation + `render()` to `finish()`, which fires either on `transitionend` or a 480ms fallback timer (lines 1104-1156). While `committing` is `true`, only `heroPhoto`'s own `click` listener checks the flag (line 1217: `if (committing || opening) return;`).

However, none of the other navigation entry points check `committing`:
- `goToPrev()` / `goToNext()` / `goToIndex()` (lines 836-853), reachable via the `ArrowLeft`/`ArrowRight` `keydown` listener on `document` (lines 876-887) and the progress-dash `click` listeners (lines 855-869), mutate `carouselIndex` and call `render()` synchronously.
- `showGrid()` (lines 815-823), reachable via the mode-toggle button, calls `resetPeek()` unconditionally while a commit may still be in flight.

Reproduction: click the right/left edge zone of the hero photo (starts `commitEdge()`, `committing = true`, real index mutation deferred ~420-480ms) → within that window press `ArrowRight`/`ArrowLeft` or click a progress dash. The direct call advances `carouselIndex` and re-renders immediately; the deferred `finish()` from the original `commitEdge()` call then fires afterward and advances `carouselIndex` a *second* time (using the `direction` captured when `commitEdge()` was first invoked), calling `render()` again. Net effect: the carousel skips a gallery (or, depending on direction/timing, jumps back and forth), and `is-opening`/`is-tracking` classes can be toggled out of sync with the actual visual state.

**Fix:** Gate every alternate navigation path on the same flag `commitEdge()` already introduced, e.g.:
```ts
function goToPrev() {
  if (committing) return;
  carouselIndex = (carouselIndex - 1 + galleries.length) % galleries.length;
  render();
  if (timer !== null) startAutoAdvance();
}
// same guard in goToNext() and goToIndex()

document.addEventListener('keydown', (event) => {
  if (root!.dataset.displayMode !== 'carousel' || committing) return;
  // ...
});
```
Alternatively, have `commitEdge()` synchronously commit the index mutation (only defer the *animation*, not the state) so there is no window where `carouselIndex` and the in-flight visual transform can diverge.

---

### WR-02: Progress-dash `role="tab"` is missing `aria-selected` and has no associated `tabpanel`/`aria-controls`

**File:** `src/components/HomeCarousel.astro:216-227`

**Issue:**
```astro
<div class="home-hero__progress" data-role="progress" role="tablist" aria-label={...}>
  {galleries.map((gallery, i) => (
    <button
      type="button"
      class="home-hero__progress-dash"
      data-action="go-to"
      data-index={i}
      role="tab"
      aria-current={i === 0 ? 'true' : 'false'}
      aria-label={`${gallery.title} (${i + 1}/${galleries.length})`}
    />
  ))}
</div>
```
Per the WAI-ARIA Authoring Practices, an element with `role="tab"` inside a `role="tablist"` must expose its selected state via `aria-selected` (not `aria-current`, which is intended for breadcrumbs/pagination/steps, not tab widgets) and is expected to be associated with a `role="tabpanel"` via `aria-controls`. Screen readers that implement the tab pattern will not announce which dash is "selected" because `aria-current` is not part of the tab-role contract, and there is no roving-tabindex / `aria-controls` wiring — assistive-tech users get an incomplete/incorrect tab-widget announcement even though the visual/mouse/keyboard behavior (arrow-key slide navigation, click-to-jump) works fine.

**Fix:** Either implement the full tab pattern (`aria-selected`, `aria-controls` pointing at a corresponding hidden/visible panel id, roving `tabindex`), or — simpler, given these aren't really tabs revealing panels but a carousel position indicator — drop `role="tablist"`/`role="tab"` entirely in favor of a `role="group"` with `aria-label` on the container and plain buttons with `aria-current="true"` on the active one (which is the correct ARIA use of `aria-current` for this kind of position indicator).

---

### WR-03: `wordmarkPhotoFilter` is duplicated verbatim between server frontmatter and client script, with no shared source of truth

**File:** `src/components/HomeCarousel.astro:96-99, 394-397`

**Issue:** The accent-contrast filter logic is implemented twice:
```ts
// frontmatter (line 96-99), used only for the initial SSR paint
const wordmarkPhotoFilter = (textColor?: string) =>
  textColor?.toUpperCase() === '#FFFFFF'
    ? 'brightness(1.38) contrast(0.92)'
    : 'brightness(0.65) contrast(1.12)';

// client <script> (line 394-397), used on every subsequent render()
const wordmarkPhotoFilter = (textColor: string) =>
  textColor.toUpperCase() === '#FFFFFF'
    ? 'brightness(1.38) contrast(0.92)'
    : 'brightness(0.65) contrast(1.12)';
```
These must stay byte-identical for the pre-JS/SSR paint and every subsequent client-driven swap to look consistent. There is no compile-time or runtime mechanism enforcing that; a future edit to one copy (e.g. adjusting the contrast tuning) that misses the other will silently desync the first-paint accent filter from every filter applied after the first `render()` call, which is exactly the class of subtle SSR/CSR drift bug this file's own comments show has bitten this component before (see the HOME-06/D-10/D-12 view-transition-name history).

**Fix:** Extract this into `src/lib/home-carousel.ts` (already the pure-function home for this component's math, per its own header comment) as a single exported `wordmarkPhotoFilter(textColor?: string): string`, and import it both in the frontmatter and in the client `<script>` (the client script already imports from this module for `computeHoverZone`/`computeWordmarkBackgroundPosition`/etc., so this is a drop-in consolidation, not a new pattern).

## Info

### IN-01: Auto-advance interval (6000ms) is a magic literal duplicated between JS and CSS with no shared constant

**File:** `src/components/HomeCarousel.astro:772, 1915`

**Issue:** The auto-advance timer interval is hardcoded as `6000` in `startAutoAdvance()` (`}, 6000);` at line 772), and the progress-dash fill animation duration is separately hardcoded as `6000ms` in the CSS keyframe trigger (`animation: home-progress-fill 6000ms linear;` at line 1915). These two values must always match for the visual "time until next slide" fill indicator to represent the real timer — nothing enforces that beyond the accompanying comments.

**Fix:** Define a single `--auto-advance-ms` (or similar) value once — e.g. a CSS custom property set from a JS constant (`root.style.setProperty('--auto-advance-ms', String(AUTO_ADVANCE_MS))`) referenced by both the `setInterval` call and the CSS `animation-duration`, or at minimum a named JS constant (`const AUTO_ADVANCE_MS = 6000`) referenced by a code comment pointing at the CSS line number so a future change to one is prompted to check the other.

### IN-02: `gridTileImgs` query is unscoped (`document.querySelectorAll`) while every other query in this script is scoped to `hero`/`grid`/`root`

**File:** `src/components/HomeCarousel.astro:417`

**Issue:** `const gridTileImgs = Array.from(document.querySelectorAll<HTMLImageElement>('.home-grid__tile-img--sharp'));` queries the entire document, whereas every other element lookup in this script (`heroImg`, `progressDashes`, `gridGalleryTiles`, etc.) is deliberately scoped to `hero`, `grid`, or `root` to avoid picking up unrelated elements elsewhere on the page. Currently harmless since this class name is unique to this component, but it's an inconsistent pattern relative to the rest of the file and would silently start matching stray elements if this class name were ever reused elsewhere on the homepage.

**Fix:** Scope to the already-available `grid` element: `Array.from(grid.querySelectorAll<HTMLImageElement>('.home-grid__tile-img--sharp'))`.

---

_Reviewed: 2026-08-02T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
