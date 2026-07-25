---
phase: quick-260725-cfm
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/HomeCarousel.astro
  - tests/e2e/homepage.spec.ts
autonomous: true
requirements: [QUICK-260725-cfm]
must_haves:
  truths:
    - "In carousel mode, once the visitor starts scrolling, a bouncing 'Continuer à scroller pour ouvrir' / 'Keep scrolling to open' hint appears (mirroring DetailHero's chevron + pink-underlined label)."
    - "Continuing to scroll DOWN past the bottom of the page (overscroll) beyond a deliberate threshold opens the currently-shown collection's detail page, reusing the same href the title link points to."
    - "The visitor can always scroll to the footer by normal scrolling — the behavior never blocks reaching below-hero content (no preventDefault, arming only after the bottom is reached)."
    - "Grid mode is completely unaffected: no hint, no scroll-to-open; grid tiles still navigate via their own clicks."
    - "prefers-reduced-motion disables the hint's bounce animation; the scroll-to-open navigation itself still works."
    - "Both FR and EN homepages get the change (label derived from the shared component's locale prop)."
  artifacts:
    - "src/components/HomeCarousel.astro — scroll-open hint markup + scoped CSS + keyframe + reduced-motion rule + locale label const + overscroll-to-open script logic"
    - "tests/e2e/homepage.spec.ts — Playwright coverage for hint appearance, threshold navigation, grid-mode no-op, reduced-motion, FR/EN"
  key_links:
    - "The overscroll accumulator feeds titleEl.click() (the existing title link), which already carries the current slide's href AND already fires setCrossDocPhoto(heroImg) for the cross-document morph."
    - "All new wheel/touch handlers gate on root.dataset.displayMode === 'carousel' and only accumulate while at the bottom of the page (window.innerHeight + scrollY >= scrollHeight - epsilon)."
---

<objective>
In carousel mode on the homepage (the default display mode of `HomeCarousel.astro`), let the visitor open the currently-shown collection's detail page by scrolling — as a discoverable alternative to clicking the title link. Two parts:

1. **Scroll-to-open navigation** — after a deliberate overscroll threshold past the bottom of the page, navigate to the current slide's collection detail page, reusing the existing title-link href (and its cross-document morph) rather than duplicating routing.
2. **A "keep scrolling to open" hint** — a bouncing scroll-down chevron + locale-aware label that appears once the visitor starts scrolling in carousel mode, reusing the exact visual language already shipped on `DetailHero.astro` (quick-260724-uf5 / -wdr), adapted to "keep scrolling to open" semantics.

Purpose: make the "scroll opens the collection" gesture real and discoverable without ever trapping the visitor or blocking them from reaching the footer by normal scrolling.

Output: an updated `HomeCarousel.astro` (markup + CSS + script) and new Playwright coverage in `homepage.spec.ts`.
</objective>

<execution_context>
@/home/user/ajs-website/.claude/gsd-core/workflows/execute-plan.md
@/home/user/ajs-website/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@src/components/HomeCarousel.astro
@src/components/DetailHero.astro
@src/pages/index.astro
@src/pages/en/index.astro
@tests/e2e/homepage.spec.ts

# Established conventions this task builds on:
@.planning/quick/260724-uf5-three-related-changes-to-the-gallery-det/260724-uf5-SUMMARY.md
@.planning/quick/260724-wdr-two-fixes-from-live-user-testing-of-the-/260724-wdr-SUMMARY.md
</context>

<investigation_findings>
Confirmed by reading the real component/CSS/tests (do NOT re-derive — these are the facts the design is built on):

- **Homepage scroll structure (carousel mode):** `.home` (`<section data-display-mode="carousel">`) contains the transparent `<SiteHeader>`, `.home-hero` (whose `.home-hero__photo` is `min-height: 100svh; max-height: 100vh`), the `hidden` `.home-grid`, and a `hidden` data `<ul>`. `BaseLayout.astro` renders a `<footer>` BELOW `HomeCarousel`. The homepage e2e tests (`mobile full-bleed hero regression (HOME-06)` and `tall-desktop full-bleed hero regression`) prove the footer sits at or just below the fold on first load — i.e. the hero fills the viewport and the only below-hero content is the footer, so the natural scrollable distance is roughly one footer height (short).
- **Consequence — a plain `scrollY > threshold` gate is wrong.** `window.scrollY` caps at `scrollHeight - innerHeight`. A "long" threshold on raw `scrollY` would either be unreachable (document too short) or, if reachable, would fire before the visitor could read the footer. The correct, safe mechanism is **overscroll accumulation**: count downward scroll *intent that occurs once the page is already at the bottom* (wheel `deltaY` on desktop; continued upward touch-drag on mobile), and NEVER `preventDefault` normal scrolling. This guarantees the footer is always reachable first, and "keep scrolling to open" literally describes the gesture.
- **Reusable navigation target:** the current slide's href lives on `titleEl` (`[data-role="gallery-title"]`, an `<a>`), kept in sync each `render()` via `titleEl.setAttribute('href', gallery.href)`. Its existing click listener already calls `setCrossDocPhoto(heroImg)` (assigns the `hero-photo` cross-document View Transition name). Calling `titleEl.click()` reuses BOTH the routing and the morph with zero duplication.
- **Locale:** `HomeCarousel` receives `locale` (`isEn`) and is rendered by both `src/pages/index.astro` and `src/pages/en/index.astro`. A label const derived from `locale` covers both twins with no page-level edits — unlike `DetailHero` (which cannot know its locale and requires the `scrollHintLabel` prop).
- **Existing gates to respect:** the script already branches on `root.dataset.displayMode !== 'carousel'` for keyboard nav and auto-advance; `reduceMotionQuery` starts auto-advance paused; the hero has horizontal `touchstart/touchend` swipe handlers (`{ passive: true }`) on `.home-hero__photo`. Auto-advance pauses on hover/focus.
- **DetailHero hint pattern to mirror** (`DetailHero.astro` lines ~126-139 markup, ~448-492 CSS): a bottom-center flex-column `.detail-hero__scroll-hint` (`aria-hidden="true"`) with a `.detail-hero__scroll-hint-label` (uppercase, `--text-label-size`, white, `border-bottom: 2px solid var(--color-accent)`) above a `.detail-hero__scroll-hint-icon` SVG chevron (`viewBox="0 0 24 24"`, `34x34`, `stroke="white" stroke-width="2.25"`, `<polyline points="6 9 12 15 18 9">`), animated by a `translate(-50%, …)` bounce keyframe, with `@media (prefers-reduced-motion: reduce) { animation: none; }`.
</investigation_findings>

<design_decisions>
Locked design choices the executor MUST implement (chosen from the investigation above):

- **D1 — Mechanism: overscroll accumulation past the bottom.** Maintain `overscrollAccum` (px). Compute `atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - BOTTOM_EPSILON` (`BOTTOM_EPSILON = 4`). While in carousel mode AND `atBottom`, add downward intent to `overscrollAccum`; when it reaches `OPEN_OVERSCROLL_THRESHOLD` (`600`), navigate. Reset `overscrollAccum` to 0 on upward intent (scroll-up), on leaving carousel mode, and on idle (`> RESET_IDLE_MS = 800` ms since the last qualifying delta — apply the idle reset before adding the new delta so a genuinely continuous push accumulates but stale reading pauses do not).
- **D2 — Never block scrolling.** The `wheel` listener is `{ passive: true }` and NEVER calls `preventDefault`. Desktop input = `wheel` `deltaY` (positive = down). Mobile input = a `touchmove`/`touchend` accumulator on `window` that adds upward finger movement (`lastTouchY - currentTouchY`) only when `atBottom` and only when the drag is vertically dominant (|Δy| clearly exceeds |Δx|, reusing the spirit of the existing `SWIPE_DIRECTION_RATIO`), so a horizontal gallery swipe never feeds it.
- **D3 — Navigation reuses the title link.** `navigateToCurrent()` calls `titleEl?.click()` (falling back to `window.location.href = galleries[carouselIndex].href` only if `titleEl` is null). Set a `navigating` guard flag on trigger to prevent double-fire and hide the hint. This inherits the existing cross-document morph naming automatically — do NOT add a second routing or morph-naming path.
- **D4 — Hint.** A `position: fixed` bottom-center element `.home-scroll-open-hint` (`aria-hidden="true"`), reusing DetailHero's label+chevron visual language (uppercase white label with a `--color-accent` bottom border, above the identical 34x34 chevron SVG), bouncing via a `home-scroll-hint-bounce` keyframe that bakes in `translateX(-50%)`. Copy: FR `Continuer à scroller pour ouvrir`, EN `Keep scrolling to open`, from a locale-derived const. Visibility: opacity `0.85` when (carousel mode AND (`window.scrollY > 4` OR `overscrollAccum > 0`)), else `0`. Hidden at the top, hidden in grid mode, hidden once navigating.
- **D5 — Reduced motion.** `@media (prefers-reduced-motion: reduce) { .home-scroll-open-hint { animation: none; } }` disables the bounce only. The scroll-to-open NAVIGATION still works under reduced motion (it is a functional affordance equivalent to clicking the title, not decorative motion) — do NOT gate `navigateToCurrent()` on reduced motion. Justification: consistent with this codebase, where reduced motion pauses auto-advance and disables View Transition animations but never removes the underlying functional navigation (keyboard/swipe/click/mode-swap still work). Divergence from DetailHero (which hides its hint entirely under reduced-motion desktop) is intentional: DetailHero's reveal is already settled so its hint is purposeless, whereas here the "keep scrolling to open" affordance remains purposeful.
- **D6 — Grid mode untouched.** Every new `wheel`/`touch`/`scroll`-driven behavior early-returns when `root.dataset.displayMode !== 'carousel'`. Reset `overscrollAccum = 0` and hide the hint inside `showGrid()`. Grid tile `<a>` clicks are unchanged.
- **D7 — Auto-advance / pause-on-hover untouched.** Scroll-to-open opens whichever slide is current (`titleEl`'s live href). Do not alter `startAutoAdvance`/`stopAutoAdvance`/hover-pause wiring.
- **D8 — Both twins via locale.** Derive the label from the existing `isEn`; no edits to `src/pages/index.astro` or `src/pages/en/index.astro`.
</design_decisions>

<tasks>

<task type="auto">
  <name>Task 1: Add the "keep scrolling to open" hint (markup + scoped CSS + locale label) to HomeCarousel.astro</name>
  <files>src/components/HomeCarousel.astro</files>
  <action>
Implement the hint per D4/D5/D8. In the frontmatter, near the other locale label consts (around the `toggleCarouselLabel`/`pauseCarouselLabel` block, lines ~83-89), add a locale-derived const `scrollOpenHintLabel = isEn ? 'Keep scrolling to open' : 'Continuer à scroller pour ouvrir'`.

Add the hint markup as a direct child of the `.home` `<section>` (place it after the `.home-grid` `</div>` block, before the `<ul hidden data-role="home-carousel-data">`), so the `.home[data-display-mode='grid']` CSS gate can reach it. Structure it as `<div class="home-scroll-open-hint" data-role="scroll-open-hint" aria-hidden="true">` containing a `<span class="home-scroll-open-hint__label">{scrollOpenHintLabel}</span>` above an SVG chevron `<svg class="home-scroll-open-hint__icon" viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="white" stroke-width="2.25"><polyline points="6 9 12 15 18 9"></polyline></svg>` — mirroring `DetailHero.astro`'s `.detail-hero__scroll-hint` label+chevron exactly.

In the component's scoped `<style>` block, add the styling, mirroring DetailHero's values but with `home-scroll-open-hint` class names: `.home-scroll-open-hint` is `position: fixed; left: 50%; bottom: var(--space-lg); transform: translateX(-50%); z-index: 5; display: flex; flex-direction: column; align-items: center; gap: var(--space-xs); opacity: 0; pointer-events: none; transition: opacity 220ms ease; animation: home-scroll-hint-bounce 1.8s ease-in-out infinite;`. The label reuses DetailHero's `.detail-hero__scroll-hint-label` treatment (`font-size: var(--text-label-size)`, `font-weight: var(--weight-semibold)`, uppercase, `letter-spacing: 0.08em`, `color: #FFFFFF`, `padding-bottom: var(--space-xs)`, `border-bottom: 2px solid var(--color-accent)`); the icon is `display: block`. Define the `@keyframes home-scroll-hint-bounce` with the `translateX(-50%)` baked in (`0%,100% { transform: translate(-50%, 0); } 50% { transform: translate(-50%, 8px); }`) so centering survives the animation. Add `@media (prefers-reduced-motion: reduce) { .home-scroll-open-hint { animation: none; } }` (D5 — bounce off, element still usable). Add `.home[data-display-mode='grid'] .home-scroll-open-hint { display: none; }` (D6). The base `opacity: 0` keeps it hidden until the Task 2 script raises it — do NOT drive visibility from CSS scroll state here; leave the `opacity` value for the script to set inline (matching DetailHero's script-driven opacity pattern).

Do not add any script in this task. Do not touch `src/pages/index.astro` / `src/pages/en/index.astro` (label is locale-derived inside this shared component).
  </action>
  <verify>
    <automated>npm run typecheck</automated>
    <automated>grep -c 'home-scroll-open-hint' src/components/HomeCarousel.astro   # expect >= 4 (markup + 2 CSS rules + grid-mode hide)</automated>
    <automated>test "$(grep -c 'Continuer à scroller pour ouvrir' src/components/HomeCarousel.astro)" = "1" && test "$(grep -c 'Keep scrolling to open' src/components/HomeCarousel.astro)" = "1"</automated>
    <automated>grep -c 'home-scroll-hint-bounce' src/components/HomeCarousel.astro   # expect >= 2 (keyframe def + animation usage)</automated>
  </verify>
  <done>`astro check` passes (0 errors). The FR and EN copy strings each appear exactly once (the locale const). The hint markup, its scoped CSS, the `home-scroll-hint-bounce` keyframe, the `prefers-reduced-motion` bounce-off rule, and the grid-mode `display: none` rule are all present. No changes to the two homepage page files.</done>
</task>

<task type="auto">
  <name>Task 2: Add overscroll-to-open navigation + hint visibility to HomeCarousel.astro's script</name>
  <files>src/components/HomeCarousel.astro</files>
  <action>
Implement D1/D2/D3/D6/D7 inside the existing `<script>`'s `if (root && hero && grid && dataEl) { … }` block, after the existing swipe/keyboard handlers (the `titleEl`, `heroImg`, `setCrossDocPhoto`, `galleries`, `carouselIndex`, `showGrid`/`showCarousel` symbols are all already in scope there).

Add named constants: `OPEN_OVERSCROLL_THRESHOLD = 600`, `BOTTOM_EPSILON = 4`, `RESET_IDLE_MS = 800`. Add state: `let overscrollAccum = 0`, `let lastOverscrollTs = 0`, `let navigating = false`, plus a reference to the hint element via `root.querySelector('[data-role="scroll-open-hint"]')`.

Write `atBottom()` returning `window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - BOTTOM_EPSILON`.

Write `updateHintVisibility()` that sets the hint element's inline `opacity` to `'0.85'` when `!navigating && root.dataset.displayMode === 'carousel' && (window.scrollY > 4 || overscrollAccum > 0)`, else `'0'` (mirrors DetailHero's script-set opacity; no-op-safe if the element is missing).

Write `navigateToCurrent()`: if `navigating` return; set `navigating = true`; hide the hint (`updateHintVisibility()`); then `titleEl?.click()` (falls back to `window.location.href = galleries[carouselIndex]?.href` only if `titleEl` is null). This reuses the current slide's href AND the existing `setCrossDocPhoto` morph naming — do NOT add a second routing/morph path (D3).

Write `registerDownwardIntent(delta)`: if `navigating` or `root.dataset.displayMode !== 'carousel'` return; if `delta <= 0` (upward/none) reset `overscrollAccum = 0` and `updateHintVisibility()` and return; if `!atBottom()` return (still real content to scroll — do not accumulate, but still `updateHintVisibility()`); apply the idle reset (`const now = Date.now(); if (now - lastOverscrollTs > RESET_IDLE_MS) overscrollAccum = 0;`), then `overscrollAccum += delta; lastOverscrollTs = now; updateHintVisibility();` and if `overscrollAccum >= OPEN_OVERSCROLL_THRESHOLD` call `navigateToCurrent()`.

Wire inputs (all `{ passive: true }`, NEVER `preventDefault` — D2):
- `window` `scroll` → `updateHintVisibility()` (this makes the hint appear once the visitor starts scrolling, and hide back at the top).
- `window` `wheel` → `registerDownwardIntent(event.deltaY)`.
- `window` `touchstart` records `lastMoveY = touch.clientY` (and `startX`/`startY` for the vertical-dominance check); `window` `touchmove` computes `const dy = lastMoveY - touch.clientY` (down-intent positive) and `const totalDx = Math.abs(touch.clientX - startX)`, and only calls `registerDownwardIntent(dy)` when the gesture is vertically dominant (`Math.abs(touch.clientY - startY) > totalDx`), then updates `lastMoveY`. Keep this window-level touch accumulator independent of the hero's existing horizontal-swipe handler (that one stays on `.home-hero__photo` and is unchanged).

In `showGrid()` add `overscrollAccum = 0;` and call `updateHintVisibility()` (D6) so switching to grid clears any accumulation and hides the hint. Optionally call `updateHintVisibility()` at the end of `showCarousel()` too.

Do NOT gate `navigateToCurrent()` on reduced motion (D5). Do NOT alter auto-advance / hover-pause / keyboard / horizontal-swipe wiring (D7).
  </action>
  <verify>
    <automated>npm run typecheck</automated>
    <automated>grep -c 'OPEN_OVERSCROLL_THRESHOLD' src/components/HomeCarousel.astro   # expect >= 2 (const decl + comparison)</automated>
    <automated>grep -c 'registerDownwardIntent' src/components/HomeCarousel.astro   # expect >= 3 (def + wheel + touch)</automated>
    <automated>grep -Ec "titleEl\?\.click\(|navigateToCurrent" src/components/HomeCarousel.astro   # expect >= 2 (reuses the title link; no duplicated routing)</automated>
    <automated>grep -c "addEventListener('wheel'" src/components/HomeCarousel.astro   # expect 1</automated>
  </verify>
  <done>`astro check` passes (0 errors). The overscroll accumulator (threshold, at-bottom gate, idle reset), the carousel-mode gate, the wheel + touch inputs, the hint-visibility updater, and `navigateToCurrent()` reusing `titleEl.click()` are all present. `showGrid()` resets the accumulator and hides the hint. No `preventDefault` is introduced (all new listeners passive). No changes to auto-advance/swipe/keyboard wiring or to the two homepage page files.</done>
</task>

<task type="auto">
  <name>Task 3: Add Playwright e2e coverage in homepage.spec.ts</name>
  <files>tests/e2e/homepage.spec.ts</files>
  <action>
Add a new `test.describe('carousel scroll-to-open (quick-260725-cfm)', …)` block near the end of the file, following the existing conventions (viewport helpers, `page.getByRole('button', { name: 'Grille'|'Carrousel' })`, `[data-role="…"]` locators, `expect.poll` for computed style). Cover all five required proofs:

1. **Hint appears once scrolling starts (FR).** `page.goto('/')`. The hint (`[data-role="scroll-open-hint"]`) has computed `opacity` `0` (or is not visible) at the top; assert its label reads `Continuer à scroller pour ouvrir`. Then `page.mouse.wheel(0, 200)` and `expect.poll` the hint's computed `opacity` to be `> 0`. Then scroll back to top (`page.evaluate(() => window.scrollTo(0, 0))` + a small `page.mouse.wheel(0, -200)` or dispatch) and `expect.poll` opacity back to `0`.

2. **EN locale label.** `page.goto('/en/')`; assert the hint label reads `Keep scrolling to open`.

3. **Overscroll past the threshold navigates to the current slide.** `page.goto('/')`. Pause auto-advance by clicking `[data-role="autoplay-toggle"]` so the slide can't change mid-test. Read the current href: `const href = await page.locator('[data-role="gallery-title"]').getAttribute('href')`. Pin to the bottom: `await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))`. Move the mouse over the page, then dispatch enough downward wheel to exceed the 600px threshold in a tight loop that stays under the idle-reset window — e.g. `await page.mouse.wheel(0, 700)` once, or a couple of `wheel(0, 400)` calls. Assert navigation with `await page.waitForURL(\`**\${href}\`)` (or assert `page.url()` ends with the gallery path from `href`). This single test also demonstrates the reuse of the title link's href.

4. **Grid mode is unaffected.** `page.goto('/')`; switch to grid (`Grille`). Assert `[data-role="scroll-open-hint"]` is hidden (computed `opacity` `0` or `display: none`). Then `window.scrollTo(bottom)` + `page.mouse.wheel(0, 1200)` and assert the URL is still the homepage (no navigation) — e.g. `expect(page.url()).toMatch(/\/$/)` after a short wait.

5. **Reduced-motion respected + navigation still works.** `await page.emulateMedia({ reducedMotion: 'reduce' })`; `page.goto('/')`. Assert the hint's computed `animation-name` is `none` (bounce disabled). Because reduced-motion already starts auto-advance paused, read the title href, pin to the bottom, wheel past the threshold, and assert navigation still occurs (proving the functional affordance survives reduced motion).

Keep assertions robust to a short/long footer (use `window.scrollTo(0, document.body.scrollHeight)` to reach the bottom deterministically rather than assuming a specific scroll distance). Do not weaken or delete any existing test.
  </action>
  <verify>
    <automated>npm run test:e2e -- tests/e2e/homepage.spec.ts</automated>
  </verify>
  <done>New `carousel scroll-to-open (quick-260725-cfm)` tests pass and prove: the hint appears on scroll and hides at the top (FR), the EN label differs, overscroll past the threshold navigates to the current slide's collection via the reused title href, grid mode neither shows the hint nor navigates on overscroll, and reduced-motion disables the bounce while navigation still works. The full `homepage.spec.ts` suite stays green. (Requires `.env` Sanity credentials — the orchestrator supplies these for the run, per the standing worktree convention noted in the quick-260724-uf5 / -wdr summaries.)</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| (none new) | Pure client-side interaction change. No new inputs cross a trust boundary, no server/build data path changes, no new network calls, no new user-supplied content rendered. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-cfm-01 | Denial of Service (self-inflicted UX trap) | Overscroll navigation accumulator | medium | mitigate | Never `preventDefault` scrolling (passive listeners); accumulation only arms at the bottom of the page, so the footer is always reachable by normal scrolling — the visitor is never blocked or trapped. |
| T-cfm-02 | Tampering | npm/pip/cargo installs | n/a | accept | No packages added or upgraded — no install step in this plan. |
</threat_model>

<source_coverage>
Quick task — no ROADMAP phase / REQUIREMENTS.md IDs. Coverage is against the task description + `<constraints>`:

- "Scroll down navigates into the current collection (carousel mode only)" → Task 2 (D1/D3), Task 3 test 3. Grid mode unaffected → Task 2 (D6), Task 3 test 4.
- "Long, deliberate threshold that never blocks reaching below-hero content (footer)" → Task 2 (D1/D2: overscroll-at-bottom, passive, never preventDefault), documented in `<investigation_findings>`.
- "'keep scrolling to open' hint reusing DetailHero's chevron + locale label, appears once scrolling starts" → Task 1 (D4/D8), Task 3 tests 1-2.
- "Respect prefers-reduced-motion for the hint animation" → Task 1 (D5 CSS) + Task 2 (navigation not gated on reduced motion), Task 3 test 5.
- "Reuse the existing click-to-navigate href, no duplicated routing" → Task 2 (D3, `titleEl.click()`).
- "Work across viewport widths incl. mobile" → Task 2 (D2 wheel + touch inputs).
- "Both FR/EN twins" → Task 1/Task 2 via shared component's `locale` (D8), Task 3 tests 1-2.
- "e2e coverage (Playwright)" → Task 3 (all five required proofs).

No unplanned items. No deferred-idea leakage. No scope reduction.
</source_coverage>

<verification>
- `npm run typecheck` (astro check) — 0 errors after each task.
- `npm run test:e2e -- tests/e2e/homepage.spec.ts` — full homepage suite green, including the five new scroll-to-open tests and the pre-existing HOME-06 mobile full-bleed regression test (must stay green — proves the footer-reachability / mobile-hero contract is intact).
- Recommended non-blocking human spot-check (desktop Chrome/Edge and a real phone): in carousel mode, start scrolling → the "Continuer à scroller pour ouvrir" / "Keep scrolling to open" hint bounces in; scroll to the footer and read it normally (never blocked); keep scrolling past the bottom → the current collection opens (with the photo morph). Toggle OS "Reduce motion": hint no longer bounces but scroll-to-open still opens the collection. Switch to grid mode: no hint, scrolling never navigates, tiles still open on click. Repeat on `/en/`.
</verification>

<success_criteria>
- Carousel mode: a deliberate overscroll past the bottom opens the currently-shown collection's detail page, reusing the title link's href and cross-document morph.
- The footer is always reachable by normal scrolling; the behavior never `preventDefault`s or traps scroll.
- The locale-aware "keep scrolling to open" hint appears once scrolling starts and mirrors DetailHero's visual language; hidden at the top and in grid mode.
- Grid mode is completely unaffected.
- prefers-reduced-motion disables the hint bounce; scroll-to-open navigation still works.
- Both FR and EN homepages behave correctly.
- `astro check` clean; `homepage.spec.ts` (incl. new tests and the HOME-06 regression guard) green.
</success_criteria>

<output>
Create `.planning/quick/260725-cfm-in-carousel-mode-on-the-homepage-homecar/260725-cfm-SUMMARY.md` when done.
</output>
