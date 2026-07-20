---
phase: quick-260720-dzs
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/home-carousel.ts
  - tests/unit/home-carousel.test.ts
  - src/components/HomeCarousel.astro
autonomous: true
requirements:
  - QUICK-260720-dzs (extract HomeCarousel pure computational logic into a testable src/lib module)
must_haves:
  truths:
    - "Wordmark photo-cutout stays pixel-aligned with the hero photo — existing e2e 'carousel wordmark cutout' test still passes."
    - "Touch swipe still navigates the carousel: left-swipe → next gallery, right-swipe → prev, vertical scrolls ignored."
    - "The crop/scale/offset math and the swipe-direction decision are covered by isolated unit tests as pure functions."
  artifacts:
    - src/lib/home-carousel.ts
    - tests/unit/home-carousel.test.ts
  key_links:
    - "HomeCarousel.astro's <script> imports computeWordmarkBackgroundPosition + detectSwipeDirection from ../lib/home-carousel and delegates to them instead of computing the math inline."
---

<objective>
Extract HomeCarousel.astro's two blocks of pure computational logic — the `object-fit: cover` wordmark crop/scale/offset math currently inside `syncWordmarkAlignment()` (lines 356-390) and the swipe-direction-ratio decision inside the `touchend` handler (lines 541-564) — out of the component's inline `<script>` closure into a new plain-TypeScript module `src/lib/home-carousel.ts`, mirroring the existing `src/lib/i18n-paths.ts` / `src/lib/site-config.ts` pure-module pattern. Add unit tests for the extracted functions. HomeCarousel.astro's `<script>` imports and calls the extracted functions instead of defining the logic inline.

Purpose: This calculation logic is only reachable today through Playwright e2e (`tests/e2e/homepage.spec.ts`) because it lives inside an inline `<script>` closure — it has no direct unit coverage. Extracting the pure math into framework-agnostic functions makes it unit-testable and matches the established `src/lib/` convention.

Output: `src/lib/home-carousel.ts` (two pure functions), `tests/unit/home-carousel.test.ts` (unit coverage), and a refactored `src/components/HomeCarousel.astro` `<script>` that delegates to them.

This is a PURE REFACTOR — zero behavior change. The extracted functions must produce output identical to the current inline logic; the component's `<script>` keeps doing all DOM work (`getBoundingClientRect()`, `style.setProperty()`, touch-event wiring) and passes primitives into the pure functions. The full e2e suite is the regression safety net proving behavior is unchanged.
</objective>

<execution_context>
@/home/user/ajs-website/.claude/gsd-core/workflows/execute-plan.md
@/home/user/ajs-website/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

# Extraction target + patterns to mirror
@src/components/HomeCarousel.astro
@src/lib/i18n-paths.ts
@tests/unit/i18n-paths.test.ts
@src/lib/site-config.ts
@tests/unit/site-config.test.ts

# Existing indirect coverage — must stay green after the refactor
@tests/e2e/homepage.spec.ts
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Create the pure src/lib/home-carousel.ts module with unit tests</name>
  <files>src/lib/home-carousel.ts, tests/unit/home-carousel.test.ts</files>
  <behavior>
    computeWordmarkBackgroundPosition:
    - (1000, 1000, {width:500,height:500,left:0,top:0}, {width:100,height:50,left:100,top:100}, 0.5, 0.5) → { size: '500px 500px', position: '-100px -100px' }  (square image, no crop, wordmark offset 100/100)
    - (2000, 1000, {width:500,height:500,left:0,top:0}, {width:100,height:50,left:50,top:50}, 0.5, 0.5) → { size: '1000px 500px', position: '-300px -50px' }  (wide image: scale 0.5, horizontal crop 250 tracked via objectPositionX, plus 50/50 wordmark offset)
    - zero-dimension guard: heroRect.width === 0 → returns null; heroRect.height === 0 → returns null
    - zero natural-size guard: naturalW === 0 → returns null; naturalH === 0 → returns null
    detectSwipeDirection:
    - (-100, 10, 50, 1.5) → 'next'   (clear leftward horizontal swipe)
    - (100, 10, 50, 1.5) → 'prev'    (clear rightward horizontal swipe)
    - (30, 0, 50, 1.5) → null        (horizontal distance below minDistance)
    - (60, 60, 50, 1.5) → null       (not horizontal enough: |deltaX| < |deltaY| * directionRatio)
  </behavior>
  <action>
    Write tests FIRST in `tests/unit/home-carousel.test.ts` (import from `../../src/lib/home-carousel`), following the vitest `describe`/`it`/`expect` style of `tests/unit/i18n-paths.test.ts` and `tests/unit/site-config.test.ts`. Cover every case in the behavior block above (normal cases plus one-or-more edge cases per function). Run the suite and confirm RED (module does not exist yet). Then create `src/lib/home-carousel.ts` — plain TypeScript, no DOM access, no imports — with exactly these two exports, transcribing the current inline math verbatim (do NOT re-derive or "improve" the formula):

    (1) A minimal structural rect type exported as `Rect` with numeric fields `width`, `height`, `left`, `top` (a DOMRect satisfies it structurally, so the caller can pass `getBoundingClientRect()` results directly), plus a `WordmarkBackground` type with string fields `size` and `position`.

    (2) `computeWordmarkBackgroundPosition(naturalW: number, naturalH: number, heroRect: Rect, wordmarkRect: Rect, objectPositionX: number, objectPositionY: number): WordmarkBackground | null` — the exact math from HomeCarousel.astro:356-390, minus the DOM reads. Return `null` for the two guard conditions the inline code currently early-returns on: falsy `naturalW`/`naturalH`, and `heroRect.width === 0 || heroRect.height === 0`. Otherwise: `scale = Math.max(heroRect.width / naturalW, heroRect.height / naturalH)`; `renderedW = naturalW * scale`, `renderedH = naturalH * scale`; `cropX = (renderedW - heroRect.width) * objectPositionX`, `cropY = (renderedH - heroRect.height) * objectPositionY`; `offsetX = wordmarkRect.left - heroRect.left`, `offsetY = wordmarkRect.top - heroRect.top`; return `{ size: renderedW + 'px ' + renderedH + 'px', position: -(cropX + offsetX) + 'px ' + -(cropY + offsetY) + 'px' }` (template literals, matching the current string format exactly — the returned `size` maps to the `--wordmark-bg-size` custom property and `position` to `--wordmark-bg-position`).

    (3) A `SwipeDirection` type = `'next' | 'prev' | null`, and `detectSwipeDirection(deltaX: number, deltaY: number, minDistance: number, directionRatio: number): SwipeDirection` — the exact decision from HomeCarousel.astro:557-563: if `Math.abs(deltaX) < minDistance` return `null`; if `Math.abs(deltaX) < Math.abs(deltaY) * directionRatio` return `null`; otherwise return `deltaX < 0 ? 'next' : 'prev'`.

    Re-run the unit suite and confirm GREEN. Do NOT modify HomeCarousel.astro in this task.
  </action>
  <verify>
    <automated>npm run test:unit</automated>
  </verify>
  <done>src/lib/home-carousel.ts exports computeWordmarkBackgroundPosition and detectSwipeDirection as pure (no-DOM, no-import) functions; tests/unit/home-carousel.test.ts covers all behavior-block cases and `npm run test:unit` passes.</done>
</task>

<task type="auto">
  <name>Task 2: Wire HomeCarousel.astro's script to the extracted functions and prove zero regression</name>
  <files>src/components/HomeCarousel.astro</files>
  <action>
    In HomeCarousel.astro's client `<script>` block (the one starting at line 263), add an ES import at the top of the module for `computeWordmarkBackgroundPosition` and `detectSwipeDirection` from `../lib/home-carousel` (relative path from `src/components/` to `src/lib/`; Astro/Vite bundles imports inside processed `<script>` tags, same as any ES module).

    Replace the body of `syncWordmarkAlignment()` (currently lines 356-390) so it: keeps the `if (!heroImg || !wordmarkEl) return;` element-presence guard and the existing `OBJECT_POSITION_X`/`OBJECT_POSITION_Y` constants in the component; calls `computeWordmarkBackgroundPosition(heroImg.naturalWidth, heroImg.naturalHeight, heroImg.getBoundingClientRect(), wordmarkEl.getBoundingClientRect(), OBJECT_POSITION_X, OBJECT_POSITION_Y)`; returns early if the result is null (preserving the current naturalWidth/naturalHeight/zero-rect early-returns, now folded into the null check); and otherwise calls `wordmarkEl.style.setProperty('--wordmark-bg-size', result.size)` and `wordmarkEl.style.setProperty('--wordmark-bg-position', result.position)`. Delete the now-inlined scale/renderedW/renderedH/cropX/cropY/offsetX/offsetY calculations from the component.

    In the `touchend` handler (currently lines 552-564), keep the `SWIPE_MIN_DISTANCE`/`SWIPE_DIRECTION_RATIO` constants and the `touchStart`/`changedTouches` DOM wiring in the component. Compute `deltaX`/`deltaY` as today, then replace the two inline threshold `if` checks and the `deltaX < 0` branch with a single call to `detectSwipeDirection(deltaX, deltaY, SWIPE_MIN_DISTANCE, SWIPE_DIRECTION_RATIO)`, and branch on its return: `'next'` → `goToNext()`, `'prev'` → `goToPrev()`, `null` → do nothing.

    Leave everything else in the `<script>` (render, auto-advance, keyboard nav, toggle/view-transition logic, touchstart handler, resize handler) untouched. This is a mechanical delegation swap — no other behavior changes.
  </action>
  <verify>
    <automated>npm run test:unit && npm run test:e2e</automated>
  </verify>
  <done>HomeCarousel.astro's `<script>` imports both functions from ../lib/home-carousel and delegates to them; the inline crop math and inline swipe-threshold branches are gone; `npm run test:unit` and the FULL `npm run test:e2e` suite both pass with zero regressions (notably the 'carousel wordmark cutout', swipe/keyboard-nav, and mobile-hero e2e tests).</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

No new trust boundary is introduced. This is a pure internal refactor: the extracted functions are DOM-free, dependency-free, side-effect-free, and take only numeric primitives. No new external input, network call, package install, or serialized data path is added. The touch-event inputs and their handling are unchanged (same source, same values, same effect) — only the decision arithmetic moves from an inline closure to an imported pure function.

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-quick-260720-01 | Tampering | Refactor changing runtime behavior | low | mitigate | Byte-for-byte transcription of existing math + full e2e suite (`npm run test:e2e`) as the behavior-preservation gate; extracted functions unit-tested against known inputs/outputs. |
</threat_model>

<verification>
- `npm run test:unit` passes, including the new `tests/unit/home-carousel.test.ts` cases.
- `npm run test:e2e` passes in full — the pre-existing wordmark-cutout, swipe/keyboard navigation, and mobile-hero tests exercise these exact code paths and are the primary proof the refactor changed no runtime behavior.
- `src/lib/home-carousel.ts` contains no DOM access and no imports (pure, framework-agnostic).
- HomeCarousel.astro no longer contains the inline scale/crop/offset arithmetic or the inline swipe-threshold `if` chain; both are replaced by calls to the imported functions.
</verification>

<success_criteria>
- Both pure functions live in `src/lib/home-carousel.ts` and are imported+called by HomeCarousel.astro's `<script>`.
- New unit tests cover normal and edge cases (zero-dimension/zero-natural guards → null; below-min-distance and too-vertical swipes → null) for both functions.
- Full unit and e2e suites pass — no behavior change.
- The `src/lib/i18n-paths.ts` / `site-config.ts` pure-module + matching `tests/unit/*.test.ts` convention is followed.
- No changes to CLAUDE.md, AGENTS.md, README.md, package.json, tsconfig.json, deploy.yml, vitest.config.ts, or ESLint config (owned by parallel tasks).
</success_criteria>

<output>
Create `.planning/quick/260720-dzs-extract-homecarousel-astro-s-pure-comput/260720-dzs-SUMMARY.md` when done.
</output>
