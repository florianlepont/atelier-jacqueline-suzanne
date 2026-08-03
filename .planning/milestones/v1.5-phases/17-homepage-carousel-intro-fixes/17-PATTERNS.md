# Phase 17: Homepage Carousel & Intro Fixes - Pattern Map

**Mapped:** 2026-08-02
**Files analyzed:** 2 (1 source component + 1 e2e test needing an update)
**Analogs found:** 2 / 2 (both patterns are self-contained within the same files — no research skipped, no external analog needed)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|---------------|
| `src/components/HomeCarousel.astro` (client script, ~line 823-826) | component (client-side event-listener wiring) | event-driven | Same file, `focusin`/`focusout` listeners at lines 825-826 (the pair being kept) | exact — sibling listener pair in the same block, same variables (`hero`, `stopAutoAdvance`, `startAutoAdvance`) |
| `src/components/HomeCarousel.astro` (scoped `<style>`, ~line 2436-2445) | component (CSS) | transform (layout/typography constraint) | Same file — no clamp used elsewhere on `.home-grid__intro-body`; removal only, no substitute pattern needed | exact — self-contained deletion |
| `tests/e2e/homepage-carousel-core.spec.ts` (lines 67-87) | test (Playwright e2e) | request-response (browser interaction assertions) | Same file — sibling `test.describe('auto-advance + pause (D-09)')` block; specifically the `focusin`-style assertion pattern implied by D-02 (keep-focus-pause) is not yet directly tested but the hover assertion at lines 80-86 is the block to rewrite/remove | role-match — existing spec, needs editing not net-new authoring |

## Pattern Assignments

### `src/components/HomeCarousel.astro` — remove hover-pause listeners (D-01)

**Analog:** the very listener block itself, lines 823-826 of the same file.

**Current code (lines 823-826):**
```javascript
hero.addEventListener('mouseenter', stopAutoAdvance);
hero.addEventListener('mouseleave', startAutoAdvance);
hero.addEventListener('focusin', stopAutoAdvance);
hero.addEventListener('focusout', startAutoAdvance);
```

**Target state — delete the first two lines only, keep the focus pair untouched:**
```javascript
hero.addEventListener('focusin', stopAutoAdvance);
hero.addEventListener('focusout', startAutoAdvance);
```

**Why this is a safe, self-contained deletion (no other code to touch):**
- `startAutoAdvance()` (lines 764-773) already guards via `autoAdvancePausedByUser` (line 766) before restarting the timer — it doesn't know or care which listener called it.
- `stopAutoAdvance()` (lines 756-760) is equally generic — just clears the interval and freezes the fill via `setFillPaused(true)`.
- The explicit toggle button handler (lines 787-796) calls `stopAutoAdvance()`/`startAutoAdvance()` directly and is entirely independent of the hover/focus listeners — unaffected by this change.
- The progress-dash fill pause (`setFillPaused()`) is driven by the same `stopAutoAdvance`/`startAutoAdvance` calls, so removing the hover listeners automatically un-freezes the dash on hover too — no separate dash fix needed.

**Adjacent context, do not modify** — the code comment at line 762-763 ("D-09: ... paused on hover/focus ...") is stale after this change but belongs to a prior phase's decision label; CONTEXT.md flags it only as a read-time landmark, not something this phase is asked to edit. (Optional: if the planner wants comment accuracy, update "hover/focus" → "focus" in that comment as a trivial polish item — Claude's Discretion territory, not required.)

---

### `src/components/HomeCarousel.astro` — remove intro-body line clamp (D-04)

**Analog:** self-contained CSS rule deletion, no cross-file pattern needed.

**Current code (lines 2436-2445):**
```css
.home-grid__intro-body {
  font-size: 14px; /* Label role — down from 16px Body, same fit constraint */
  font-weight: var(--weight-regular);
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

**Target state — remove the 4 clamp-related declarations, keep typography:**
```css
.home-grid__intro-body {
  font-size: 14px; /* Label role — down from 16px Body, same fit constraint */
  font-weight: var(--weight-regular);
  line-height: 1.5;
  margin: 0;
}
```

**Claude's Discretion note (from CONTEXT.md):** if the now-unclamped paragraph runs long enough to visually collide with the tile title above it or the tile edges, a minor spacing/line-height adjustment on `.home-grid__intro-body` or its parent container is in scope as polish — but do not reintroduce any line-count cap (`-webkit-line-clamp` or `max-height` + `overflow: hidden` emulating it).

---

### `tests/e2e/homepage-carousel-core.spec.ts` — update hover-pause assertion (HOME-11 test coverage)

**Analog:** same file, `test.describe('auto-advance + pause (D-09)')` block, lines 67-87.

**Current code (lines 67-87) — asserts hover PAUSES the carousel (now-wrong behavior):**
```typescript
test.describe('auto-advance + pause (D-09)', () => {
  test('carousel index advances every 6000ms and pauses on hover, using a mocked clock', async ({ page }) => {
    await page.clock.install();
    await page.goto('/');

    const carousel = page.locator('[data-role="home-carousel"]');
    const indexLabel = carousel.getByText(/^\d{2} \/ \d{2}$/);
    await expect(indexLabel).toBeVisible();

    const initialLabel = await indexLabel.innerText();
    await page.clock.fastForward(6000);
    await expect(indexLabel).not.toHaveText(initialLabel);

    // Pause on hover/focus: capture the label right after the auto-advance,
    // hover the carousel root, advance the mocked clock again, and confirm
    // the label did NOT change while hovered.
    const labelAfterFirstAdvance = await indexLabel.innerText();
    await carousel.hover();
    await page.clock.fastForward(6000);
    await expect(indexLabel).toHaveText(labelAfterFirstAdvance);
  });
```

**Required change:** rewrite this test (rename it, since "pauses on hover" is no longer true) to assert the carousel keeps advancing while hovered — i.e. invert the final assertion from `.toHaveText(labelAfterFirstAdvance)` to `.not.toHaveText(labelAfterFirstAdvance)` — and, per D-02, add or extend coverage confirming focus (e.g. tabbing to `[data-role="autoplay-toggle"]`, or `hero.focus()` equivalent via keyboard nav) still pauses it. Follow the same `page.clock.install()` + `page.clock.fastForward(6000)` mocked-clock pattern already used in this block for both the advance and the pause/non-pause assertions — this is the established, working pattern for testing the 6000ms interval deterministically and should be reused rather than reinvented.

**Test naming convention observed in this file:** `test.describe('<feature> (D-09)')` groups related assertions under the internal decision-label comment style also seen in the component source (e.g. `// D-09: auto-advance every 6000ms...` at HomeCarousel.astro line 762) — if the planner renames this describe/test block, matching that terse feature+label naming style keeps consistency with the rest of the file (see also `test.describe('auto-advance + pause (D-09)')` sibling naming for the toggle-persistence and reduced-motion tests directly below it, lines 89 and 111).

---

## Shared Patterns

### Idempotent stop/start pair (already correct, reused not modified)
**Source:** `src/components/HomeCarousel.astro` lines 756-773 (`stopAutoAdvance` / `startAutoAdvance`)
**Apply to:** No changes needed here — both HOME-11's listener removal and any future carousel pause/resume work should keep relying on this pair's existing `autoAdvancePausedByUser` guard rather than adding new state.

### Mocked-clock e2e testing for the 6000ms interval
**Source:** `tests/e2e/homepage-carousel-core.spec.ts` lines 69, 77, 85 (`page.clock.install()` / `page.clock.fastForward(6000)`)
**Apply to:** Any e2e assertion touching auto-advance timing (both the hover-pause rewrite and, if added, a new focus-pause assertion) should use this same mocked-clock approach for determinism — avoid real `page.waitForTimeout()`.

## No Analog Found

None — both fixes are surgical deletions within a single already-identified file, and CONTEXT.md's `code_context` section already pinpoints exact line ranges. No external pattern search was necessary or performed beyond confirming the exact current line numbers/content in the repo (which had drifted slightly from the estimates in CONTEXT.md, e.g. the intro-body rule is confirmed at lines 2436-2445 exactly as estimated, and the hover listeners at lines 823-824 exactly as estimated).

## Metadata

**Analog search scope:** `src/components/HomeCarousel.astro` (full file, targeted reads at lines 755-839 and CSS lines 2436-2451), `tests/e2e/homepage-carousel-core.spec.ts` (targeted read at lines 60-100), `tests/unit/home-carousel.test.ts` (grepped, no hover/pause unit coverage found — only `computeHoverZone` for peek-zone math, unrelated to this phase).
**Files scanned:** 3 (1 component, 2 test files)
**Pattern extraction date:** 2026-08-02
