---
phase: quick-260713-jfz
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/HomeCarousel.astro
  - tests/e2e/homepage.spec.ts
autonomous: false
requirements:
  - QUICK-260713-jfz
must_haves:
  truths:
    - "Clicking the carousel/grid toggle animates the swap via document.startViewTransition() on supported browsers instead of an instant pop."
    - "The currently-shown hero photo visually morphs to/from its matching grid tile (a real shared-element geometry morph, not a flat cross-fade)."
    - "On browsers without startViewTransition, the toggle still swaps modes instantly (existing behavior), with no error."
    - "Under prefers-reduced-motion: reduce, the transition is disabled (effectively instant), matching the codebase's existing decorative-animation gating."
    - "All 51 existing Playwright tests still pass; npm run build and npm run test:unit still pass."
  artifacts:
    - "src/components/HomeCarousel.astro (script handler + scoped view-transition-name + <style is:global> view-transition pseudo CSS)"
    - "tests/e2e/homepage.spec.ts (one new reduced-motion functional-swap assertion)"
  key_links:
    - "mode-toggle click handler -> document.startViewTransition(mutate) with feature-detect fallback to direct mutate()"
    - ".home-hero__photo (scoped view-transition-name) <-> grid gallery tile at carouselIndex (JS-assigned view-transition-name) => shared-element morph"
    - "::view-transition-* pseudo-elements customized in <style is:global> (document-level; scoped styles cannot target them)"
---

<objective>
Make the same-page carousel <-> grid mode toggle in HomeCarousel.astro feel "very dynamic" by animating the swap with the browser-native View Transitions API (`document.startViewTransition()`), including a shared-element morph of the current hero photo to/from its matching grid tile, a deliberately-timed root cross-fade for everything else, feature-detection fallback to the existing instant swap, and a `prefers-reduced-motion: reduce` guard.

Purpose: The current swap is an instant `hidden` flip with no transition; the user explicitly chose the raw `document.startViewTransition()` DOM API (NOT Astro's `<ClientRouter />`, which is for page-to-page navigation) to get an automatic before/after morph on this single-page state toggle.
Output: Updated HomeCarousel.astro (one component, no new dependencies) plus one new robust e2e assertion; the full existing 51-test suite must remain green.
</objective>

<execution_context>
@/home/user/ajs-website/.claude/gsd-core/workflows/execute-plan.md
@/home/user/ajs-website/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@src/components/HomeCarousel.astro
@tests/e2e/homepage.spec.ts
@playwright.config.ts

Key facts already established (do NOT rediscover):
- `showCarousel()` / `showGrid()` (in the component's `<script>`) already perform the exact DOM mutation to wrap: they flip `hero.hidden` / `grid.hidden`, set `root.dataset.displayMode`, and start/stop auto-advance. The morph callback is simply "call the existing show* function."
- The mode-toggle click handler lives at the bottom of the `<script>` block (`modeToggleBtn?.addEventListener('click', ...)`), reads `root.dataset.displayMode` to pick direction, calls `showGrid()`/`showCarousel()`, and sets the button's `aria-label` to the mode it would switch TO.
- Grid DOM order: `.home-grid__tiles` first child is the non-link wordmark hero tile (`.home-grid__tile--hero`); the gallery tiles follow in gallery order. So `grid.querySelectorAll('.home-grid__tile:not(.home-grid__tile--hero)')[carouselIndex]` is the tile for the currently-shown carousel gallery.
- `.home-hero__photo` is the sized box (16:9, `max-height:100vh`, `min-height:100svh` on mobile) that holds the hero `<img>` + scrim + caption. It is the clean element to name for the morph. `.home-hero__accent` is a sibling (stays in the root cross-fade).
- Playwright uses a recent Chromium (supports View Transitions since 111), runs against `npm run preview` (built `dist/`) at :4321, `fullyParallel`. Existing toggle tests use auto-waiting `expect(...).toBeHidden()/.toBeVisible()/.toHaveAttribute()`, which poll — so a one-frame-deferred mutation inside a transition callback does not break them (verify empirically).
- Astro-scoped `<style>` rules CANNOT target `::view-transition-*` pseudo-elements (they live on the document root, outside the component subtree). Those rules MUST go in a `<style is:global>` block. `view-transition-name` on real component elements (`.home-hero__photo`) works fine in the normal scoped `<style>`.
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Wrap the mode toggle in document.startViewTransition() with a shared-element hero-photo/grid-tile morph, custom timing, feature-detect fallback, and reduced-motion guard</name>
  <files>src/components/HomeCarousel.astro</files>
  <behavior>
    - Feature detection: when `document.startViewTransition` is a function, the toggle's DOM mutation runs inside it; when absent, the same mutation runs directly. Both paths end in the correct swapped state (`hero.hidden`/`grid.hidden` and `data-display-mode` flipped) with no thrown error.
    - Shared-element morph: before starting the transition, the grid gallery tile matching the current `carouselIndex` receives `view-transition-name: ajs-hero-morph`; any previously-named grid tile is cleared first. `.home-hero__photo` carries the same name via scoped CSS. Only one of the two is ever visible in a given snapshot (the other's ancestor is `hidden`), so there is no duplicate-name conflict.
    - Accessible name flips immediately: the toggle's `aria-label` is set synchronously (outside the transition callback) to the mode it would switch TO, so the accessible name is correct even before the animation's deferred callback runs.
    - Custom "dynamic" timing under `prefers-reduced-motion: no-preference`: the `::view-transition-old(root)`, `::view-transition-new(root)`, and `::view-transition-group(ajs-hero-morph)` pseudo-elements animate over ~400-450ms with a deliberate easing curve (not the ~250ms UA default cross-fade).
    - Reduced-motion: under `prefers-reduced-motion: reduce`, all `::view-transition-group(*)`/`::view-transition-old(*)`/`::view-transition-new(*)` animations are disabled (`animation: none`), making the swap effectively instant. The View Transitions API does not honor this media query on its own — the CSS must add it explicitly.
  </behavior>
  <action>
Modify ONLY `src/components/HomeCarousel.astro`. Three coordinated edits, no new files, no dependencies.

(1) In the `<script>` block, refactor the existing `modeToggleBtn` click handler. Keep `modeToggleBtn.classList.add('home-toggle--used')` synchronous. Compute direction once from the pre-mutation `root.dataset.displayMode` (e.g. `goingToGrid = root.dataset.displayMode === 'carousel'`). Build a `mutate` closure that calls the existing `showGrid()` when `goingToGrid` else `showCarousel()` — do NOT reimplement the hidden/displayMode/auto-advance logic, reuse those functions verbatim. Set the button `aria-label` synchronously (before invoking the transition) using the existing `dataset.labelCarousel`/`dataset.labelGrid` values, matching current direction semantics. Feature-detect and dispatch:
  - Define a narrow local type so this compiles without depending on lib.dom's `ViewTransition` typing: `type VTDocument = Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void>; ready: Promise<void>; updateCallbackDone: Promise<void> } }` and `const vtDoc = document as VTDocument`.
  - Do NOT reference the literal document-view-transition method name in any code comment as a negative/"what not to do" note; only use it as real code.
  - `if (typeof vtDoc.startViewTransition === 'function') { vtDoc.startViewTransition(mutate); } else { mutate(); }`.
  - Do NOT attach cleanup to the returned `.finished` promise — a rapid second toggle skips the in-flight transition and rejects `.finished`, which would surface as an unhandled rejection. Manage the morph name synchronously instead (next bullet).

(2) Shared-element morph name management (synchronous, in the click handler, before the feature-detect dispatch). Query the gallery tiles once near the other element lookups: `const gridGalleryTiles = Array.from(grid.querySelectorAll<HTMLElement>('.home-grid__tile:not(.home-grid__tile--hero)'))`. Keep a module-scoped `let namedMorphTile: HTMLElement | null = null`. On each toggle: if `namedMorphTile` set, clear its `style.viewTransitionName = ''`; then `const target = gridGalleryTiles[carouselIndex] ?? null; if (target) target.style.viewTransitionName = 'ajs-hero-morph'; namedMorphTile = target;`. This re-points the grid-side morph anchor to whichever gallery the carousel currently shows (it auto-advances), so both toggle directions morph the correct tile. `.home-hero__photo` gets its name from CSS in edit (3), so no JS needed on the carousel side.

(3) CSS. In the EXISTING scoped `<style>` block, add `view-transition-name: ajs-hero-morph;` to the `.home-hero__photo` rule (this is a real component element — scoped styling is correct here). Then add a SEPARATE `<style is:global>` block (scoped rules cannot target document-level `::view-transition-*` pseudo-elements) containing:
  - Inside `@media (prefers-reduced-motion: no-preference)`: set `animation-duration` ~420ms and a deliberate `animation-timing-function` (e.g. `cubic-bezier(0.4, 0, 0.2, 1)`) on `::view-transition-old(root)`, `::view-transition-new(root)`, and `::view-transition-group(ajs-hero-morph)`. This is what earns "dynamic" over the flat UA default — a customized root cross-fade PLUS the shared-element morph.
  - Inside `@media (prefers-reduced-motion: reduce)`: `::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) { animation: none !important; }` so the swap is instant for reduced-motion users, mirroring how this component already gates the toggle attention-pulse behind the reduced-motion query.

Do NOT touch any other file. Do NOT install anything (View Transitions is a browser built-in). Do NOT use Astro's `<ClientRouter />` / View Transitions integration — this is a same-page DOM state toggle, so it is the raw `document.startViewTransition()` DOM API called inside the existing click handler.
  </action>
  <verify>
    <automated>npm run build 2>&1 | tail -5; grep -c "startViewTransition" src/components/HomeCarousel.astro; grep -c "prefers-reduced-motion: reduce" src/components/HomeCarousel.astro; grep -c "ajs-hero-morph" src/components/HomeCarousel.astro</automated>
  </verify>
  <done>`npm run build` completes successfully. HomeCarousel.astro contains `startViewTransition` (feature-detect + call), an `is:global` view-transition block with a `prefers-reduced-motion: reduce` `animation: none` guard, and the `ajs-hero-morph` name on both `.home-hero__photo` (CSS) and the JS-assigned grid tile.</done>
</task>

<task type="auto">
  <name>Task 2: Regression + reduced-motion verification — full suite green, add one robust reduced-motion functional assertion</name>
  <files>tests/e2e/homepage.spec.ts</files>
  <action>
Add ONE new test to `tests/e2e/homepage.spec.ts` (do NOT modify or weaken any existing test). The new test emulates reduced motion and asserts the toggle still FUNCTIONALLY swaps modes end-to-end — a robust, non-visual, non-timing assertion (per the guidance: do not force brittle pixel/animation-frame assertions on View Transitions). Use `page.emulateMedia({ reducedMotion: 'reduce' })` before `page.goto('/')`, click the `Grille` toggle, assert `[data-role="home-carousel"]` is hidden and `[data-role="home-grid"]` is visible, click `Carrousel`, assert the carousel is visible again. Name the describe/test clearly (e.g. `view-transition toggle — reduced-motion still swaps modes`). This proves the transition wrapping does not break the swap under the reduced-motion CSS path.

Then run the full verification gate. Do NOT skip or weaken anything. If any existing test genuinely fails or is flaky against the View-Transition-wrapped mutation, that is a real finding to REPORT (capture which test, the failure mode, and whether it is a timing/await issue) — do NOT paper over it by relaxing the assertion. The likely-safe reasoning: the mutation inside the transition callback runs on the next frame and Playwright's `expect` auto-waits, so `toBeHidden()/toBeVisible()/toHaveAttribute()` still resolve — but this MUST be confirmed by actually running the suite, not assumed.
  </action>
  <verify>
    <automated>npm run test:unit && npm run build && npx playwright test 2>&1 | tail -15</automated>
  </verify>
  <done>`npm run test:unit` passes. `npx playwright test` runs the full suite (52 tests now: the original 51 + the new reduced-motion assertion) and ALL pass — no existing assertion weakened or skipped. If any prior test fails against the wrapped transition, it is reported with specifics rather than silenced.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 3: Human visual check — confirm the morph reads as dynamic and reduced-motion falls back to instant</name>
  <files>src/components/HomeCarousel.astro</files>
  <action>Serve the built site and have a human observe the toggle animation quality (which Playwright cannot pixel-assert): confirm the carousel<->grid swap is an animated shared-element morph (hero photo <-> matching grid tile) plus root cross-fade, that the correct tile morphs after auto-advance, and that enabling OS "Reduce motion" makes the swap instant. Follow the numbered steps in how-to-verify. Do not mark complete until the human confirms.</action>
  <what-built>The carousel<->grid toggle now animates via `document.startViewTransition()`: the current hero photo morphs (grows/shrinks/repositions) to/from its matching grid tile while everything else cross-fades over ~420ms, with graceful instant-swap fallback and a reduced-motion guard. View Transitions are a browser-internal pseudo-element animation that cannot be meaningfully pixel-asserted in Playwright, so the "does it actually read as dynamic" quality needs a human eye.</what-built>
  <how-to-verify>
1. Run `npm run build && npm run preview`, open http://localhost:4321/ in a Chromium-based browser (View Transitions supported).
2. Click the carousel/grid toggle in the header. Confirm the swap is ANIMATED, not an instant pop — you should see the large hero photo visibly move/scale toward its position/size in the grid (and the rest cross-fade), taking ~0.4s. Toggle back and confirm the reverse morph.
3. Let the carousel auto-advance a slide or two, then toggle to grid — confirm the photo that was showing morphs to the correct (matching) grid tile, not always the first one.
4. In your browser/OS, enable "Reduce motion" (macOS: System Settings > Accessibility > Display > Reduce motion), reload, and toggle — confirm the swap is now instant (no animation), and still functionally correct.
5. (Optional, Claude may attempt) capture a mid-transition Playwright screenshot as supporting evidence; if the transition frame can't be reliably captured, record that the effect was confirmed by direct observation in step 2-3 instead.
  </how-to-verify>
  <resume-signal>Type "approved" if the morph reads as dynamic and reduced-motion falls back to instant; otherwise describe what looked wrong (e.g. flat cross-fade only, wrong tile morphs, jank).</resume-signal>
  <verify>
    <human-check>Human confirms via the how-to-verify steps that the toggle animates as a shared-element morph (not a flat cross-fade), morphs the correct tile after auto-advance, and falls back to an instant swap under OS "Reduce motion".</human-check>
  </verify>
  <done>Human types "approved" after observing the animated morph on a supporting browser and the instant fallback under reduced-motion; any reported visual defect is addressed before completion.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| (none new) | This change is a pure client-side visual/animation change to an existing static component. No new untrusted input, no network calls, no data flow, no new dependencies. The component's existing boundary (T-04.1-04-ID: gallery data is pre-fetched/pre-filtered by the page, the client script never imports `src/lib/sanity.ts`, so `SANITY_API_READ_TOKEN` never reaches the browser) is unaffected. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-jfz-01 | Denial of Service | rapid repeated toggle clicks starting overlapping view transitions | low | accept | The browser natively skips an in-flight transition when a new one starts; morph-name management is synchronous (no reliance on the rejecting `.finished` promise), so no unhandled rejection and no leaked state. No mitigation code needed beyond not attaching cleanup to `.finished`. |
| T-jfz-02 | Tampering | new client script path (feature detection) | low | accept | No new inputs or dependencies; `document.startViewTransition` is a browser built-in. Feature-detect guards unsupported engines; DOM mutation is the exact pre-existing `showCarousel()`/`showGrid()` logic. |
</threat_model>

<verification>
- `npm run build` succeeds (no TS/build error from the new script or the `is:global` style block).
- `npm run test:unit` passes.
- `npx playwright test` — full suite green: the original 51 tests (including `carousel/grid display mode toggle (D-08)` and `single unified mode toggle (HOME-01, D-01/D-02)`, which click the toggle and assert `hidden`/`aria-label` immediately) plus the 1 new reduced-motion functional-swap test.
- Source greps confirm the feature is present: `startViewTransition`, `ajs-hero-morph`, and a `prefers-reduced-motion: reduce` view-transition guard all appear in HomeCarousel.astro.
- Human checkpoint confirms the morph reads as "dynamic" and reduced-motion falls back to instant.
</verification>

<success_criteria>
- Toggling carousel<->grid on a supporting browser produces an animated shared-element morph (hero photo <-> matching grid tile) plus a ~420ms root cross-fade, not an instant pop.
- Unsupported browsers fall back to the existing instant swap with no error (feature-detected).
- `prefers-reduced-motion: reduce` disables the animation (effectively instant), consistent with the component's existing decorative-animation gating.
- No new npm dependency; only `src/components/HomeCarousel.astro` and `tests/e2e/homepage.spec.ts` change.
- All existing tests still pass with zero assertions weakened or skipped; any real regression against the wrapped transition is reported, not hidden.
</success_criteria>

<output>
Create `.planning/quick/260713-jfz-add-an-animated-transition-between-carou/260713-jfz-SUMMARY.md` when done.
</output>
