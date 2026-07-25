---
phase: quick-260725-dcg
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/HomeCarousel.astro
  - tests/e2e/homepage.spec.ts
autonomous: true
requirements: [QUICK-260725-dcg]
must_haves:
  truths:
    - "In carousel mode the homepage footer (footer.chrome-band) is not rendered; toggling to grid reveals it again; every other page still shows the footer."
    - "The 'keep scrolling to open' hint is visible at rest (opacity ~0.85) at the top of the page in carousel mode and fades toward 0 over the first ~150px of scroll, mirroring DetailHero."
    - "The current progress dash shows an Instagram-Stories-style accent fill that grows from 0% to 100% width over the 6000ms auto-advance cycle, synced with the real slide change, and restarts cleanly from 0 on every gallery change (auto or manual)."
    - "The fill freezes (preserving mid-flight progress, not resetting) when auto-advance is paused (hover/focus or the explicit autoplay toggle); under prefers-reduced-motion there is no animated fill."
    - "All three behaviors are identical on the FR (/) and EN (/en/) homepages, and grid mode is unaffected beyond the footer becoming visible again."
  artifacts:
    - src/components/HomeCarousel.astro
    - tests/e2e/homepage.spec.ts
  key_links:
    - "body:has(.home[data-display-mode='carousel']) footer.chrome-band { display: none } lives in HomeCarousel's <style is:global> block so it crosses the HomeCarousel(.home)/BaseLayout(footer.chrome-band) component-scope boundary and only ships on the homepage."
    - "setInterval(6000) stays the single timing source; the CSS fill is restarted in lockstep via a JS-managed .is-filling class (+ forced reflow) and frozen via animation-play-state driven by an is-autoplay-paused class toggled inside stopAutoAdvance()/startAutoAdvance()."
    - "updateHintVisibility() is rewritten to set opacity via Math.max(0, 1 - window.scrollY/150) * 0.85 (carousel + not navigating), 0 otherwise — replacing the inverted appear-on-scroll gate."
---

<objective>
Three follow-up fixes from live testing of quick-260725-cfm's carousel scroll-to-open feature, all scoped to the homepage carousel (src/components/HomeCarousel.astro) plus its e2e coverage (tests/e2e/homepage.spec.ts):

1. Hide the site footer entirely while the homepage is in carousel mode (still shown in grid mode and on every other page).
2. Fix the "keep scrolling to open" hint so it is visible at rest and fades on scroll (it currently starts invisible and only appears once scrolling — a backwards implementation of the intended DetailHero-mirroring behavior).
3. Make the existing per-gallery progress dash dynamic: an Instagram-Stories-style fill on the current dash that grows over the 6000ms auto-advance cycle, pauses when auto-advance pauses, respects reduced motion, and restarts on every gallery change.

Purpose: correct two shipped-but-wrong behaviors from cfm and add the missing "this hero auto-rotates" affordance, all without regressing the existing carousel/grid/hero contracts.
Output: updated HomeCarousel.astro + homepage.spec.ts (three fixes, e2e coverage for each, and two existing footer-position regression tests updated to the new footer-hidden intent).
</objective>

<execution_context>
@/home/user/ajs-website/.claude/gsd-core/workflows/execute-plan.md
@/home/user/ajs-website/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@CLAUDE.md
@src/components/HomeCarousel.astro
@src/layouts/BaseLayout.astro
@src/components/DetailHero.astro
@src/pages/index.astro
@tests/e2e/homepage.spec.ts
@.planning/quick/260725-cfm-in-carousel-mode-on-the-homepage-homecar/260725-cfm-SUMMARY.md

Investigation already confirmed against the current code (do not re-derive; verify only if you touch adjacent lines):
- DOM: index.astro renders `<BaseLayout headerVariant="none"><HomeCarousel/></BaseLayout>`. BaseLayout wraps the slot in `<main><slot/></main>` and renders `<footer class="chrome-band">` as a SIBLING of `<main>` (BaseLayout.astro lines 207-216). So `.home` (scoped to HomeCarousel) sits inside `<main>`, and `footer.chrome-band` (scoped to BaseLayout) is NOT a direct sibling of `.home`. The general-sibling `~` combinator therefore does NOT work; a `body:has(...)` rule is required.
- HomeCarousel already has a `<style is:global>` block (lines 2085-2168, the View-Transitions block). Because HomeCarousel is only used on the homepage, its is:global CSS only ships on the homepage — the correct scope for the cross-boundary footer rule. Do NOT modify BaseLayout.astro.
- Scroll-hint: base CSS `opacity: 0` at line 2036; `updateHintVisibility()` at lines 755-762 uses the inverted `window.scrollY > 4 || overscrollAccum > 0` gate. DetailHero's target pattern is base `opacity: 0.85` (DetailHero.astro line 458) faded by `scrollHint.style.opacity = String(Math.max(0, 1 - window.scrollY / 150) * 0.85)` on a plain passive scroll listener (DetailHero.astro line 183).
- Progress dashes: markup lines 207-219; CSS lines 1429-1467. `.home-hero__progress-dash::before` (lines 1444-1448) is the invisible 44px tap-target hit-area extension (negative inset) — it MUST NOT be clipped or repurposed. `::after` is unused and free for the fill. Auto-advance is `setInterval(..., 6000)` in startAutoAdvance() (lines 595-602). Manual nav (goToPrev/goToNext/goToIndex, lines 660-674) calls render() but never resets the 6000ms timer.
- Playwright runs homepage.spec.ts on the chromium project only (playwright.config.ts). `:has()` and pseudo-element getComputedStyle are both supported there. CSS animations run in real time (page.clock does NOT drive CSS animations), so the Fix-3 tests assert animation configuration/state + short liveness rather than fast-forwarding a clock.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Hide the footer in carousel mode + update the two footer-position regression tests</name>
  <files>src/components/HomeCarousel.astro, tests/e2e/homepage.spec.ts</files>
  <action>
Fix 1 (footer hide). In HomeCarousel.astro's existing `<style is:global>` block (the one starting at line 2085 with the `::view-transition-*` rules), add one new rule with an explanatory comment: `body:has(.home[data-display-mode='carousel']) footer.chrome-band { display: none; }`. Rationale to capture in the comment: `.home` is HomeCarousel-scoped and `footer.chrome-band` is BaseLayout-scoped and they are NOT direct siblings (a `<main>` wrapper sits between them — BaseLayout renders `<main><slot/></main>` then `<footer>`), so a `~` general-sibling rule cannot reach the footer; `body:has(...)` targeting the live `data-display-mode` attribute is the cross-boundary, dynamically-reevaluated selector. This only ships on the homepage (HomeCarousel is homepage-only), and the `:has()` guard means it never affects grid mode (`data-display-mode='grid'`) or any other page (no `.home[data-display-mode]` element). Specificity note (for your confidence, not the file): this rule computes higher than BaseLayout's scoped `footer.chrome-band { display: flex }`, so display:none wins in carousel mode and reverts cleanly in grid mode. Do NOT touch BaseLayout.astro, and do NOT change the overscroll accumulator / atBottom() / registerDownwardIntent() logic — investigation confirms it keeps working (with the footer gone, atBottom() is simply reached immediately and the 600px accumulation threshold still gates navigation).

Fix 1 tests — update the two existing footer-position regression tests that will otherwise break (a `display:none` footer returns null from boundingBox()):
- In the `mobile full-bleed hero regression (HOME-06)` test (currently lines ~717-725): remove the "footer at/below the fold" block (the `const footer = page.locator('footer')` ... `expect(footerBox!.y).toBeGreaterThanOrEqual(viewportSize!.height - 1)` lines) and replace it with an assertion that in carousel mode the footer is present in the DOM but hidden: keep `await expect(footer).toHaveCount(1)` and assert `await expect(footer).toBeHidden()`. Update the surrounding comment from "must sit at or below the fold" to "is hidden entirely in carousel mode (quick-260725-dcg)". Keep every other assertion in that test unchanged (header/photo flush at y≈0, photo fills the small viewport, morph active, toggle to grid works).
- In the `tall-desktop full-bleed hero regression` test (currently lines ~753-755): replace the three footer boundingBox lines with `await expect(page.locator('footer')).toBeHidden()`. Keep the photo-fills-viewport assertion unchanged.

Fix 1 tests — add a small dedicated describe block (e.g. `footer visibility by display mode (quick-260725-dcg)`) proving the new contract on BOTH locales: (a) at `/` in carousel mode `await expect(page.locator('footer')).toBeHidden()`; (b) after `page.getByRole('button', { name: 'Grille' }).click()` the footer becomes visible (`await expect(page.locator('footer')).toBeVisible()` — note toBeVisible does not require in-viewport, only rendered/displayed); (c) at `/en/` in carousel mode the footer is hidden and the grid toggle (button name 'Grid') reveals it. This is the FR/EN parity proof required by the constraints.
  </action>
  <verify>
    <automated>npx astro check && npx playwright test homepage.spec.ts -g "footer|full-bleed"</automated>
  </verify>
  <done>The footer is display:none whenever the homepage is in carousel mode (FR and EN), visible again in grid mode, and unchanged on all other pages. The HOME-06 and tall-desktop regression tests assert the footer is hidden (not below-the-fold) and still pass; the new footer-visibility describe block passes on both locales. astro check is clean.</done>
</task>

<task type="auto">
  <name>Task 2: Make the scroll-open hint visible at rest and fade on scroll (mirror DetailHero)</name>
  <files>src/components/HomeCarousel.astro, tests/e2e/homepage.spec.ts</files>
  <action>
Fix 2 (hint visibility direction). Two edits in HomeCarousel.astro:
- CSS: in the `.home-scroll-open-hint` base rule (around line 2026-2040) change `opacity: 0` to `opacity: 0.85`, exactly matching DetailHero.astro's `.detail-hero__scroll-hint` base (line 458) so the hint is visible at rest even before JS runs (no-JS/first-paint correct). Update the block comment above it (currently "Base opacity: 0 keeps it hidden until ... updateHintVisibility() raises it once the visitor starts scrolling") to describe the corrected behavior: visible at rest at 0.85, fading out over the first ~150px of scroll, mirroring DetailHero — visibility direction only, no reduced-motion change. Keep the `pointer-events: none`, the `home-scroll-hint-bounce` animation, the `@media (prefers-reduced-motion: reduce) { animation: none }` rule (lines 2073-2077), and the grid-mode `display: none` rule (lines 2080-2082) all UNCHANGED.
- Script: rewrite `updateHintVisibility()` (lines 755-762). Remove the inverted `window.scrollY > 4 || overscrollAccum > 0` gate. New behavior: if `!scrollHintEl` return; if `navigating || root.dataset.displayMode !== 'carousel'` set `scrollHintEl.style.opacity = '0'` and return; otherwise set `scrollHintEl.style.opacity = String(Math.max(0, 1 - window.scrollY / 150) * 0.85)` — the exact DetailHero fade formula (DetailHero.astro line 183). This keeps the grid-mode gate and the `navigating` guard (hide once navigation has fired) while removing the "start at 0, appear on scroll" inversion. Do NOT change registerDownwardIntent(), the wheel/touch/scroll listeners, or the overscroll accumulator — they already call updateHintVisibility() and will now recompute the fade correctly. Add one call to `updateHintVisibility()` in the init sequence (right after the existing `startAutoAdvance();` near line 982) so the inline opacity is authoritative on load (at scrollY 0 it yields 0.85, matching the base CSS; on a bfcache scroll-restore it fades correctly).

Note (do not "fix"): once Fix 1 hides the footer, the carousel homepage has effectively no scrollable distance, so on the real page the hint simply stays at 0.85 (inviting the overscroll gesture) rather than ever fading — this is correct and intended; the fade formula is the faithful DetailHero mirror and remains exercised by the test harness below and by any future below-hero content.

Fix 2 test. Rewrite the existing cfm FR hint test `FR: the hint is hidden at the top, appears once scrolling starts, and hides again back at the top` (lines ~1141-1159) inside the `carousel scroll-to-open (quick-260725-cfm)` describe block. New title e.g. `FR: the hint is visible at rest at the top in carousel mode and hidden in grid mode`. Assertions: keep the label-text assertion (`Continuer à scroller pour ouvrir`); assert the resting opacity is ~0.85 via `expect.poll(() => hint.evaluate((el) => parseFloat(getComputedStyle(el).opacity))).toBeGreaterThan(0.5)` (visible at rest — the regression witness for the reported "hint not displayed directly on the page" bug); then toggle to grid (`page.getByRole('button', { name: 'Grille' }).click()`) and assert `await expect(hint).toBeHidden()`. Remove the old wheel→appears / scrollTo(0,0)→hides assertions (they encoded the inverted behavior). Add a second focused test proving the fade formula responds to scroll: inject a tall spacer to create scroll room (`page.evaluate(() => { const d = document.createElement('div'); d.style.height = '2000px'; document.body.appendChild(d); })`), then `window.scrollTo(0, 200)`, then `expect.poll(hint opacity).toBeLessThan(0.1)` — a documented test harness because the homepage's own content no longer scrolls once the footer is hidden. Leave the EN-label test, the overscroll-navigation test, the grid-mode test, and the reduced-motion test in that describe block unchanged (none assert the resting opacity and all still pass).
  </action>
  <verify>
    <automated>npx astro check && npx playwright test homepage.spec.ts -g "scroll-to-open"</automated>
  </verify>
  <done>The hint renders at opacity ~0.85 at rest at the top in carousel mode on both / and /en/, fades toward 0 as scrollY increases (proven via the spacer harness), stays display:none in grid mode, and keeps its reduced-motion bounce-only behavior. The rewritten FR test and new fade test pass; the other four cfm tests in the block still pass. astro check is clean.</done>
</task>

<task type="auto">
  <name>Task 3: Instagram-Stories fill on the current progress dash (synced with auto-advance)</name>
  <files>src/components/HomeCarousel.astro, tests/e2e/homepage.spec.ts</files>
  <action>
Fix 3 (dynamic progress fill). Reuse the EXISTING `.home-hero__progress` / `.home-hero__progress-dash` element — do not build a new indicator. Keep every existing dash behavior (click-to-jump, keyboard, focus, aria-current, aria-label) completely unchanged; this is additive.

Timing decision (justified, implement exactly): keep `setInterval(6000)` as the single timing source and drive the fill as a CSS animation that JS restarts in lockstep. ALSO reset the timer on manual navigation so the fill never lies about time-to-next-advance (the description's recommended fix) — but only when auto-advance is actually running, so hover/focus pause is preserved.

CSS (in the scoped `<style>` block, near the existing progress-dash rules lines 1429-1467):
- Add an `::after` fill on the current dash, gated by a JS-managed class `.is-filling` (NOT tied to `aria-current`, so the a11y attribute stays untouched and the restart is deterministic): `.home-hero__progress-dash.is-filling::after { content: ''; position: absolute; inset: 0; transform: scaleX(0); transform-origin: left; background: var(--current-accent, var(--color-accent)); animation: home-progress-fill 6000ms linear; }`. Do NOT add `overflow: hidden` to `.home-hero__progress-dash` — that would clip the negative-inset `::before` tap-target; scaleX stays within [0,1] so the `::after` never overflows the dash anyway.
- Add `@keyframes home-progress-fill { from { transform: scaleX(0); } to { transform: scaleX(1); } }`.
- Change the current-dash base track so the growing accent fill reads against it and completion still matches today's solid look: change `.home-hero__progress-dash[aria-current='true'] { background: var(--current-accent, var(--color-accent)); }` (line 1450-1452) to `background: rgba(255, 255, 255, 0.5);` (a dim track, brighter than the inactive dashes' `rgba(255,255,255,0.35)` so the current dash stays identifiable at 0% fill; at 100% the opaque accent `::after` covers it, matching today's solid-accent appearance). Leave the existing `[aria-current='true']:hover`/`:focus-visible` accent rules (lines 1459-1462) unchanged.
- Pause hook: `.home.is-autoplay-paused .home-hero__progress-dash.is-filling::after { animation-play-state: paused; }` — freezes the fill mid-flight (preserving progress) whenever the root carries the `is-autoplay-paused` class.
- Reduced motion: `@media (prefers-reduced-motion: reduce) { .home-hero__progress-dash[aria-current='true'] { background: var(--current-accent, var(--color-accent)); } .home-hero__progress-dash.is-filling::after { display: none; } }` — no animated fill; the current dash reverts to today's static solid accent.

Script (in the `<script>` block):
- Add `function setFillPaused(paused: boolean) { root!.classList.toggle('is-autoplay-paused', paused); }`.
- Add `function restartFill() { progressDashes.forEach((d) => d.classList.remove('is-filling')); const current = progressDashes[carouselIndex]; if (!current) return; void current.offsetWidth; current.classList.add('is-filling'); }` — the remove → forced-reflow → add sequence restarts the `::after` animation from 0 deterministically on the freshly-current dash (satisfies "restart cleanly from 0% on every gallery change", including a fast double-navigation, without relying on aria-current re-matching).
- In `stopAutoAdvance()` (lines 588-591): after clearing the timer, call `setFillPaused(true)` (freezes the fill whenever the timer is not running — covers hover/focus pause, grid mode, and explicit pause).
- In `startAutoAdvance()` (lines 595-602): after `timer = setInterval(...)` successfully creates the interval, call `setFillPaused(false)` then `restartFill()` (fresh 6s interval + fresh fill together, so they are perfectly synced; the early-return path leaves the paused class set by the stopAutoAdvance() call at the top of the function). Do NOT restart the fill in the early-return (paused) path.
- In `render()` (after the aria-current loop, lines 571-573): call `restartFill()`. Because the auto-advance interval callback calls render(), the fill restarts on every auto tick in lockstep with the 6s cadence; manual nav (below) also routes through render().
- In `goToPrev()`, `goToNext()`, `goToIndex()` (lines 660-674): after `render()`, add `if (timer !== null) startAutoAdvance();` — resets the 6000ms countdown (and re-syncs the fill) ONLY when auto-advance is currently running. Checking `timer !== null` preserves hover/focus pause (during hover the timer is null, so manual nav won't secretly restart auto-advance) and preserves the explicit-pause state; when paused, render()'s restartFill() still relocates the fill to the new dash but the `is-autoplay-paused` class keeps it frozen.

This leaves the existing hover/focus listeners (lines 655-658), the autoplay toggle handler (lines 616-625), the reduced-motion change listener (lines 627-633), showGrid/showCarousel (lines 635-653), and syncAutoplayControl() (lines 604-614) working as-is: stop/startAutoAdvance now additionally carry the fill's paused/running state, so hover, focus, the explicit toggle, and grid mode all pause the fill through the same paths.

Fix 3 tests. Add a new describe block (e.g. `carousel progress fill (quick-260725-dcg)`) proving:
- Config + liveness: at `/`, the filling dash (`page.locator('.home-hero__progress-dash.is-filling')`) exists; its `::after` computed style has `animationName` containing `home-progress-fill` and `animationDuration` of `6s` (read via `page.evaluate` + `getComputedStyle(el, '::after')`); and it is progressing — `expect.poll(() => scaleX of getComputedStyle(dash,'::after').transform)` becomes `> 0` shortly after load (parse the matrix's first value; matrix `none` counts as 0).
- Pause/resume: click `[data-role="autoplay-toggle"]`; poll the filling dash `::after` `animationPlayState` to be `paused`. Click it again; poll `animationPlayState` back to `running`.
- Restart on manual nav: click the dash at index 2 (`page.locator('.home-hero__progress-dash').nth(2).click()`); assert the `.is-filling` dash is now nth(2) (its `::after` `animationName` contains `home-progress-fill`) and nth(0)'s `::after` `animationName` is `none` — proving the fill relocated/restarted on the newly-current dash.
- Reduced motion: with `page.emulateMedia({ reducedMotion: 'reduce' })`, assert the current dash's `::after` computed `display` is `none` (no animated fill under reduced motion).
- FR/EN parity: repeat the config assertion at `/en/` (the filling dash exists with the `home-progress-fill` animation) — HomeCarousel is shared, so a single EN config check is sufficient.
Keep all existing progress-dash tests (the `carousel keeps its navigation fixed` positional test and the wordmark tab test) passing unchanged.
  </action>
  <verify>
    <automated>npx astro check && npx playwright test homepage.spec.ts -g "progress"</automated>
  </verify>
  <done>The current dash shows an accent fill growing 0%→100% over 6000ms, synced to the real slide change; the fill freezes (play-state paused) on hover/focus and via the explicit pause toggle and resumes when unpaused; manual nav relocates/restarts the fill on the new current dash and resets the 6000ms timer only when auto-advance was running; reduced motion shows no animated fill; FR and EN both carry the fill. New progress-fill tests pass; existing progress-dash and wordmark tests still pass; astro check is clean.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| (none new) | Pure client-side CSS + vanilla-JS changes inside an existing homepage-only component. No new network calls, no new user inputs, no new packages/dependencies, no server/build-data changes, no token surface. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-dcg-01 | Denial of Service | `home-progress-fill` CSS animation + JS restart in HomeCarousel.astro | low | accept | Fill is a single per-tick CSS animation on one pseudo-element with a cheap one-element forced reflow; no unbounded work, no listener leaks (reuses existing setInterval lifecycle). Existing full e2e suite guards against regressions. |
</threat_model>

<verification>
- `npx astro check` clean (project's CI type-check gate).
- `npx playwright test homepage.spec.ts` green on chromium — includes the updated HOME-06 + tall-desktop footer regression tests, the new footer-visibility block, the rewritten + new scroll-hint tests, and the new progress-fill block, plus all pre-existing homepage tests (carousel/grid toggle, auto-advance/pause, wordmark cutout, cross-doc morph, the other four cfm scroll-to-open tests).
- Recommended non-blocking human spot-check with real Sanity credentials on / and /en/: footer gone in carousel and present in grid; hint visible at rest; the current progress dash visibly fills over ~6s and freezes on hover / pause-button and under reduced motion.
</verification>

<success_criteria>
- Footer hidden in carousel mode only (FR + EN), visible in grid mode and on all other pages; BaseLayout.astro untouched.
- Scroll-open hint visible at rest (~0.85) and fading via the DetailHero formula; reduced-motion + grid-mode behavior preserved.
- Current progress dash fills 0→100% over 6000ms, synced to the real advance, pausing/freezing on hover-focus-toggle, static under reduced motion, restarting on every gallery change; all existing dash behaviors unchanged.
- e2e coverage exists for all three fixes; the two footer-position regression tests updated to the footer-hidden intent (not left silently broken); astro check clean.
</success_criteria>

<output>
Create `.planning/quick/260725-dcg-three-follow-up-fixes-from-live-testing-/260725-dcg-SUMMARY.md` when done.
</output>
