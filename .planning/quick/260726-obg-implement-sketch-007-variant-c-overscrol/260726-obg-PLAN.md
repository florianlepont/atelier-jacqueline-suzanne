---
phase: quick-260726-obg
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/HomeCarousel.astro
  - tests/e2e/homepage.spec.ts
  - tests/e2e/i18n.spec.ts
  - tests/e2e/legal.spec.ts
autonomous: true
requirements: [QUICK-260726-obg]

must_haves:
  truths:
    - "In carousel mode, as overscroll accumulates 0->150px past the bottom, the current hero photo visibly scales down (to ~0.94 at threshold) and darkens proportionally BEFORE the 150px navigation threshold is crossed — an accidental scroll announces itself visibly after the very first tick (the quick-260725-sj4 safety property, now provided by an early visible warning instead of footer scroll-distance)."
    - "Stopping the push before the threshold visibly decays the photo back to its neutral resting appearance (~300ms after the 800ms idle window); no navigation occurs and 'letting go' reads as a clean cancel."
    - "At the exact moment navigation fires, the photo's scale/darken are reset to neutral synchronously WITHOUT the ease, so a cross-document View Transition captures the outgoing photo at rest, not mid-gesture — no visible flash/glitch on the hero-photo morph."
    - "Every overscroll listener stays passive; the real component never calls preventDefault(), so ordinary scrolling (and reaching any real content below) works exactly as today."
    - "The site footer is hidden in homepage carousel mode only (FR + EN), visible again in grid mode, and unaffected on every other page."
    - "Under prefers-reduced-motion:reduce the scale/darken feedback is STILL produced (near-instant, un-eased) — the sole remaining safety signal is NOT disabled for reduced-motion visitors."
    - "The carousel title (.home-hero__title) shows no underline in any state, matching DetailHero's non-underlined overlay title, while keeping its accent-color hover + pointer-cursor affordances."
  artifacts:
    - "src/components/HomeCarousel.astro — new .home-hero__pull-overlay element, --pull-scale/--pull-darken driven feedback, proactive idle-decay watchdog, neutral-reset-before-navigate, slide-change reset, reintroduced carousel-mode footer-hide, removed title underline."
    - "tests/e2e/homepage.spec.ts — proportional-feedback, decay-on-release, neutral-reset-before-navigate, reduced-motion-feedback, mobile-feedback, footer-hidden-by-mode, sj4-repro early-warning, and underline-removed coverage."
    - "tests/e2e/i18n.spec.ts + tests/e2e/legal.spec.ts — reworked to the carousel-mode footer-hide contract (grid-mode detour before footer visibility/text/click assertions)."
  key_links:
    - "registerDownwardIntent() -> setPullFeedback(overscrollAccum / OPEN_OVERSCROLL_THRESHOLD): the accumulator drives the visible feedback that is the safety warning."
    - "navigateToCurrent() -> instant neutral reset (is-opening class + reflow) -> titleEl.click(): the outgoing View Transition snapshot must capture a neutral photo."
    - "body:has(.home[data-display-mode='carousel']) footer.chrome-band display-hide in HomeCarousel's is:global block: reintroduces the vacuous atBottom() tradeoff, deliberately mitigated by the feedback above."
---

<objective>
Port the approved sketch 007 Variant C ("photo pulls back, no chrome") as the real overscroll-to-open visual feedback on the homepage carousel, add the sketch's proactive idle-decay so "letting go" reads as cancel, reintroduce the carousel-mode footer hide (now made safe by that feedback), and remove the persistent carousel title underline.

Purpose: Restore the footer-hidden browsing UX the user wants without re-triggering the quick-260725-sj4 accidental-navigation bug. sj4's silent gesture + hidden footer let an ordinary two-tick scroll navigate with zero warning. Variant C replaces the footer's accidental "scroll-distance" safety buffer with a real, early, visible warning: the photo physically responds to every tick well before the 150px threshold.

Output: An updated HomeCarousel.astro (feedback mechanism + decay + commit-reset + footer-hide + underline removal) and a reworked e2e suite proving the safety properties, FR + EN, desktop + mobile.
</objective>

<safety_investigation>
Read and honor these findings — they are load-bearing, not commentary.

1. **The vacuous-atBottom tradeoff is ACCEPTED and DELIBERATE.** Once the footer is hidden again, on desktop the hero is `min-height:100svh; max-height:100vh` with the accent panel absolutely positioned, so `.home` is exactly one viewport tall and `document.documentElement.scrollHeight ≈ innerHeight`. `atBottom()` (`innerHeight + scrollY >= scrollHeight - BOTTOM_EPSILON`) is therefore vacuously TRUE at scrollY 0 on a fresh desktop load — exactly the sj4 condition. We are NOT fixing this via scroll height. It is mitigated by three things together: (a) the 150px accumulator threshold, (b) the new early **visible** feedback (photo scale/darken from the first tick), and (c) the proactive decay that cancels a stale gesture. This is a documented decision. On MOBILE the in-flow accent panel below the photo still provides real scroll distance, so `atBottom()` is already false at scrollY 0 there — the desktop case is the one the feedback exists to guard.

2. **Consequence for tests:** the two shipped sj4 regression tests that assert "atBottom() is false at scrollY 0" and "two 80px wheel ticks do NOT navigate" become FALSE once the footer is hidden (2×80=160 > 150 will now navigate — and that is CORRECT/expected, per the task). Those exact assertions must be reworked, not preserved. Their safety intent is replaced by the early-warning proof: after the FIRST 80px tick (accum 80 < 150) the photo is already clearly scaled/darkened and no navigation has occurred. Reaching 150–160px and navigating is expected behaviour; the bug being fixed is that it used to happen in silence.

3. **Passive listeners only.** The sketch's `preventDefault()` on wheel and `touch-action:none` are sketch-only demo-containment hacks. The real wheel/touch listeners MUST stay `{ passive: true }` and never call `preventDefault()`, exactly as today (quick-260725-cfm/pit/sj4). Ordinary scrolling must keep working unchanged.

4. **Reduced motion is a safety concern, not a decoration concern.** The scale/darken IS the only safety signal now. Disabling it under `prefers-reduced-motion` (the way the purely-decorative progress-dash fill is disabled) would silently reintroduce the sj4 risk for reduced-motion visitors. Decision: KEEP the same scale/darken response magnitude under reduced motion, but make it near-instant (drop the eased transitions and the animated decay) rather than removing it.

5. **Commit-moment snapshot.** The real gesture performs a REAL navigation (`navigateToCurrent()` -> `titleEl.click()`, reusing the sketch-006 / quick-260724-uf5 cross-document `view-transition-name: hero-photo` morph). Do NOT build the sketch's fake "chrome fade" payoff. The one thing to port from the sketch's commit is: reset the photo to neutral (scale 1, no darken) synchronously and WITHOUT the ease at the instant navigation fires, so the outgoing View Transition snapshot captures the photo at rest, not pulled-back.
</safety_investigation>

<execution_context>
@/home/user/ajs-website/.claude/gsd-core/workflows/execute-plan.md
@/home/user/ajs-website/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@CLAUDE.md

# Approved design spec (winner: "C") — port the mechanism, NOT the fake commit payoff
@.planning/sketches/007-carousel-overscroll-feedback/README.md
@.planning/sketches/007-carousel-overscroll-feedback/index.html

# Source of truth — re-derive against the CURRENT file, do not trust summary line numbers
@src/components/HomeCarousel.astro

# Parity target for the underline removal (a <p>, naturally no underline — confirmed no text-decoration)
@src/components/DetailHero.astro

# Footer lives here; homepage renders through this with headerVariant="none" (footer is a sibling of <main>)
@src/layouts/BaseLayout.astro

# The bug this whole redesign avoids re-triggering, and the footer-hide mechanism being reintroduced
@.planning/quick/260725-sj4-fix-a-confirmed-accidental-navigation-bu/260725-sj4-SUMMARY.md
@.planning/quick/260725-dcg-three-follow-up-fixes-from-live-testing-/260725-dcg-SUMMARY.md
</context>

<interfaces>
Current HomeCarousel.astro anchors (grep to locate — line numbers drift):

- Overscroll block (in the `<script>`): constants `OPEN_OVERSCROLL_THRESHOLD = 150`, `BOTTOM_EPSILON = 4`, `RESET_IDLE_MS = 800`; state `overscrollAccum`, `lastOverscrollTs`, `navigating`; functions `atBottom()`, `navigateToCurrent()`, `registerDownwardIntent(delta)`; the window `scroll`/`wheel`/`touchstart`/`touchmove` listeners (all `{ passive: true }`).
- `const heroPhoto = hero.querySelector<HTMLElement>('.home-hero__photo')` (nullable) — already declared for the horizontal-swipe handlers; reuse it to write the CSS vars.
- `const heroImg` / `[data-role="hero-image"]`, `titleEl` / `[data-role="gallery-title"]` (has an existing click listener calling `setCrossDocPhoto(heroImg)`), `render()`, `showGrid()` (already does `overscrollAccum = 0`), `goToPrev/goToNext/goToIndex`, `reduceMotionQuery` (`window.matchMedia('(prefers-reduced-motion: reduce)')`, in scope for the whole script).
- Markup: `.home-hero__photo` contains, in order, the two `.home-hero__img` (placeholder + `--sharp`), `.home-hero__scrim`, and `.home-hero__caption` (which holds the controls/index/title, z-index:3). The `.home-hero__accent` panel is a SIBLING of `.home-hero__photo`, not a child.
- CSS anchors: `.home-hero__photo` (has the custom cursor), `.home-hero__img` (base, `object-fit:cover`, `inset:0`, no transition), `.home-hero__img--sharp` (`transition: opacity 260ms ease`, `.is-loaded` toggles opacity — the HOME-09 blur-up), `.home-hero__scrim` (permanent legibility gradient — DO NOT repurpose), `.home-hero__title` (`text-decoration: underline; text-underline-offset: 3px;` + hover/focus color to `var(--current-accent, var(--color-accent))`).
- BaseLayout DOM: `<body>` > `<main>` (wraps `.home`) and a sibling `<footer class="chrome-band">` guarded by `{!hideFooter && ...}`. `hideFooter` is a BUILD-TIME prop that cannot react to the client-side carousel/grid toggle — so the footer-hide MUST be the CSS `:has()` approach, not the prop.
</interfaces>

<tasks>

<task type="auto">
  <name>Task 1: Port Variant C — proportional photo scale/darken feedback, proactive idle-decay, neutral-reset-before-navigate, slide-change reset, reduced-motion-safe</name>
  <files>src/components/HomeCarousel.astro, tests/e2e/homepage.spec.ts</files>
  <action>
Add the Variant C feedback to `.home-hero__photo` WITHOUT adding any chrome/text and without touching the accent panel, progress dashes, index, or caption (that silence is why the user chose C).

CSS (in HomeCarousel's scoped `<style>`, co-located with the existing `.home-hero__*` rules):
- Add a new element `.home-hero__pull-overlay` — a sibling of `.home-hero__scrim` INSIDE `.home-hero__photo`, layered ABOVE the scrim and BELOW the caption. `position:absolute; inset:0; z-index:2; pointer-events:none;` background `radial-gradient(ellipse at 50% 60%, transparent 25%, rgba(0,0,0,.75) 100%)` (mirrors the sketch's `.demo-scrim-boost`), `opacity: var(--pull-darken, 0)`, `transition: opacity 90ms ease-out`. This is a NEW sibling overlay — do NOT modify or repurpose `.home-hero__scrim`, which serves a permanent legibility purpose.
- Drive the photo scale off a CSS var on both photo layers: on the base `.home-hero__img` add `transform: scale(var(--pull-scale, 1)); transform-origin: center; transition: transform 90ms ease-out;`. Because `.home-hero__img--sharp` sets the `transition` shorthand (which would clobber the transform transition), change that shorthand to include both: opacity 260ms ease AND transform 90ms ease-out (preserving the HOME-09 blur-up crossfade exactly).
- Add `background-color:#000` to `.home-hero__photo` — invisible at rest (the photo fully covers it) and only visible as a dark edge when the photo scales back during the pull; keeps the edge dark (consistent with the darkening) instead of flashing the page background. Scaling only the photo layers (not the container) leaves the caption/dashes/title unscaled.
- Add a commit-reset hook: `.home-hero__photo.is-opening .home-hero__img, .home-hero__photo.is-opening .home-hero__pull-overlay { transition: none; }` so the neutral reset at navigation is instantaneous (see the script step below).
- Reduced-motion: in a `@media (prefers-reduced-motion: reduce)` block set `.home-hero__img, .home-hero__img--sharp { transition-property: opacity; }` (keeps the 260ms opacity crossfade, makes the scale apply instantly) and `.home-hero__pull-overlay { transition: none; }` (darken applies instantly). The scale/darken VALUES are unchanged under reduced motion — only the easing is dropped. This is deliberate per the safety investigation (item 4): the feedback is the safety signal and must not be disabled for reduced-motion visitors.

Script (in the existing overscroll block; reuse the already-declared `heroPhoto` and `reduceMotionQuery`; keep every listener passive):
- Add `const OVERSCROLL_DECAY_MS = 300;` and `let decayRaf: number | null = null;`.
- Add `setPullFeedback(p)`: clamp p to [0,1], then on `heroPhoto` (guard `if (!heroPhoto) return`) set `--pull-scale` to `String(1 - p * 0.06)` and `--pull-darken` to `String(p * 0.85)` (exact sketch coefficients: 0.94 min scale, 0.85 max darken opacity).
- Add `decayOverscroll()`: cancel any running `decayRaf`; if `overscrollAccum <= 0` just `setPullFeedback(0)` and return; if `reduceMotionQuery.matches`, snap (`overscrollAccum = 0; setPullFeedback(0);`) and return; otherwise animate `overscrollAccum` from its current value to 0 over `OVERSCROLL_DECAY_MS` via `requestAnimationFrame`, calling `setPullFeedback(overscrollAccum / OPEN_OVERSCROLL_THRESHOLD)` each frame, clearing `decayRaf` and zeroing `overscrollAccum` on the final frame.
- Edit `registerDownwardIntent(delta)`: keep the existing `navigating`/`displayMode !== 'carousel'` and `!atBottom()` guards unchanged. On the `delta <= 0` branch, replace the bare `overscrollAccum = 0` with a call to `decayOverscroll()` (animated cancel) and return. When accumulating a forward delta, first cancel any in-flight decay (`if (decayRaf) { cancelAnimationFrame(decayRaf); decayRaf = null; }`), keep the existing idle-reset-before-add logic, then after `overscrollAccum += delta` call `setPullFeedback(overscrollAccum / OPEN_OVERSCROLL_THRESHOLD)` BEFORE the threshold check that calls `navigateToCurrent()`.
- Add a proactive idle watchdog: `setInterval` every 150ms — if not `navigating` and no `decayRaf` and `overscrollAccum > 0` and `Date.now() - lastOverscrollTs > RESET_IDLE_MS`, call `decayOverscroll()`. This is the sketch's watchdog that makes a stopped gesture visibly recede on its own.
- Neutral-reset-before-navigate: at the TOP of `navigateToCurrent()` (before `titleEl.click()`), synchronously reset to the resting appearance without the ease — cancel any `decayRaf`, set `overscrollAccum = 0`, add the `is-opening` class to `heroPhoto` (disables the transition via the CSS above), set `--pull-scale` to '1' and `--pull-darken' to '0', then force a reflow (`void heroPhoto.offsetWidth`). Only then call `titleEl.click()`. This guarantees the cross-document `hero-photo` snapshot captures the photo at scale 1 / no darken.
- In the existing window `scroll` listener's not-at-bottom branch, add `setPullFeedback(0)` alongside the existing `overscrollAccum = 0`.
- Slide-change reset: at the top of `render()`, cancel any `decayRaf`, set `overscrollAccum = 0`, and call `setPullFeedback(0)` — so a pulled-back/darkened photo never carries across an auto-advance or a manual slide change (a deliberate slide change mid-gesture signals the visitor is NOT trying to open the current gallery). This is a real gap: `render()` runs on every swap but did not reset the accumulator, and `goToPrev/goToNext/goToIndex` don't either; centralizing in `render()` covers all paths (auto-advance, dash click, arrow keys, swipe) uniformly and complements `showGrid()`'s existing reset (add `setPullFeedback(0)` to `showGrid()` too for symmetry). The forward references to `setPullFeedback`/`decayRaf`/`heroPhoto` from `render()` are safe because `render()` is first invoked at the end of the script, after those declarations execute.

Add the markup: insert `<div class="home-hero__pull-overlay" aria-hidden="true"></div>` immediately after `.home-hero__scrim` inside `.home-hero__photo`.

Then add e2e coverage in tests/e2e/homepage.spec.ts (make each robust regardless of footer state by reaching the bottom with `window.scrollTo(0, document.body.scrollHeight)` first, and pin auto-advance by clicking `[data-role="autoplay-toggle"]` so `render()` can't reset feedback mid-assertion). Read `--pull-scale`/`--pull-darken` via `getComputedStyle(document.querySelector('.home-hero__photo')).getPropertyValue(...)` and `parseFloat`:
- Proportional feedback: after one synthetic `WheelEvent({deltaY:80})` at the bottom (accum 80 < 150), assert `--pull-scale` is noticeably < 1 (e.g. < 0.99) and `--pull-darken` > 0.3, and the URL is unchanged — the early visible warning exists before the threshold.
- Decay-on-release: dispatch the same partial 80px push, confirm feedback present, wait > ~1100ms (past the 800ms idle window + 300ms decay), then assert `--pull-scale` ≈ 1 (> 0.999) and `--pull-darken` ≈ 0 (< 0.01) and no navigation occurred.
- Neutral-reset-before-navigate: add a capture-phase click listener on `[data-role="gallery-title"]` that calls `preventDefault()` (so the real navigation is suppressed and the page stays); dispatch a single `WheelEvent({deltaY:200})` at the bottom to cross the threshold; assert `--pull-scale` === 1 and `--pull-darken` === 0 (the reset ran before the click) and the URL is still the homepage.
- Reduced-motion feedback present: `page.emulateMedia({ reducedMotion: 'reduce' })`, scroll to bottom, dispatch one 80px wheel, assert feedback is STILL present (`--pull-scale` < 0.99, `--pull-darken` > 0.3) — proving the safety signal is not disabled under reduced motion.
- Mobile feedback (`test.use({ viewport: { width: 390, height: 844 }, hasTouch: true }`)): scroll to the real bottom (past the in-flow accent panel), dispatch synthetic touchstart + touchmoves accumulating ~100px of downward intent at a constant clientX (vertically dominant), assert `--pull-scale` < 0.99 / `--pull-darken` > 0.3 and no navigation.
  </action>
  <verify>
    <automated>npx astro check</automated>
  </verify>
  <done>
The hero photo scales down and a new radial overlay darkens it proportionally to overscroll (0->150px), eased ~90ms; a stopped gesture visibly decays to neutral after the idle window; navigation resets the photo to neutral instantly first; every listener stays passive (no preventDefault); reduced motion keeps the feedback but un-eased; the accent panel/dashes/index/caption are visually untouched; `npx astro check` is clean and the new proportional/decay/neutral-reset/reduced-motion/mobile tests pass under the orchestrator's credentialed e2e run.
  </done>
</task>

<task type="auto">
  <name>Task 2: Reintroduce the carousel-mode footer hide (homepage only) and rework the footer/sj4 test contract</name>
  <files>src/components/HomeCarousel.astro, tests/e2e/homepage.spec.ts, tests/e2e/i18n.spec.ts, tests/e2e/legal.spec.ts</files>
  <action>
Reintroduce quick-260725-dcg's footer-hide with its exact original scoping, now made safe by Task 1's feedback. In HomeCarousel's `is:global` `<style>` block, add a rule hiding `footer.chrome-band` (to display:none) only when the homepage is in carousel mode, matched via `body:has(.home[data-display-mode='carousel']) footer.chrome-band`. Use `body:has()` (not a sibling combinator) because a `<main>` wrapper sits between `.home` and `footer.chrome-band` in BaseLayout; keep it in HomeCarousel (not BaseLayout) so it only ships on the homepage and never affects gallery/edition/about/contact/legal pages. Do NOT touch BaseLayout.astro or the `hideFooter` prop (a build-time prop cannot react to the client-side mode toggle). Grid mode leaves the footer visible; this rule reverts cleanly on toggle.

Then fix the tests that the footer-hide invalidates (this is the deliberate contract change from the safety investigation, items 1–2):

tests/e2e/homepage.spec.ts:
- `mobile full-bleed hero regression (HOME-06)` and `tall-desktop full-bleed hero regression`: the footer now has no bounding box in carousel mode, so replace the "footer present + boundingBox at/below the fold" assertions with an assertion that the footer is hidden in carousel mode (e.g. `await expect(page.locator('footer')).toBeHidden()` — display:none satisfies toBeHidden and the "no bleed-through" intent). Keep the hero full-bleed and morph-active assertions unchanged.
- Remove/replace the now-false `fresh load: atBottom() is false at scrollY 0` test — with the footer hidden, atBottom() is legitimately true at scrollY 0 on desktop (the accepted tradeoff). Its safety intent moves to the early-warning test below.
- Replace the two `fresh load: two small wheel ticks do NOT navigate` tests (FR + EN) with the sj4-repro EARLY-WARNING proof: on a fresh load (footer hidden, scrollY 0, pin auto-advance), dispatch ONE `WheelEvent({deltaY:80})`; assert the photo feedback is already clearly present (`--pull-scale` < 0.99, `--pull-darken` > 0.3) and the URL is still the homepage — i.e. an accidental scroll now announces itself visibly before the threshold instead of navigating in silence. Add a comment that crossing 150–160px and navigating is expected/correct now, and that this visible warning is the replacement for the old footer scroll-distance buffer. Provide FR and EN variants.
- Keep the mobile `fresh load: one modest touch swipe does NOT navigate` test (at scrollY 0 on mobile the in-flow accent panel keeps atBottom() false, so a synthetic swipe still does not navigate) but update its comment to the new rationale (mobile distance comes from the accent panel, not the footer).
- Re-add a `footer visibility by display mode` describe block (mirroring dcg): footer hidden in carousel mode and visible after toggling to grid, for FR and EN.
- Leave the existing positive-path tests intact (`a light scroll past the bottom opens the currently-shown collection`, `a small scroll near the top does not navigate`, `grid mode: overscrolling never navigates`, `reduced motion: scroll-to-open navigation still works`) — verify they still pass with the footer hidden (they scroll to the real bottom or inject a spacer, so they remain valid).

tests/e2e/i18n.spec.ts and tests/e2e/legal.spec.ts: the homepage footer is now display:none in carousel mode, so any test that asserts the homepage footer is visible, reads its `innerText` (returns '' for display:none), or clicks a footer link from `/` will break. Re-apply dcg's compliance-preserving fix: before each such assertion, switch the homepage to grid mode by clicking the mode toggle (aria-label 'Grille' on FR, 'Grid' on EN) so the footer is genuinely visible/clickable, then proceed. This preserves both the i18n footer-copy-differs check and the legal mentions-légales/confidentialité reachability guarantee rather than weakening them. Add a short comment referencing quick-260726-obg on each touched test.
  </action>
  <verify>
    <automated>npx astro check</automated>
  </verify>
  <done>
The footer is hidden in homepage carousel mode (FR + EN) and visible in grid mode via the `body:has(.home[data-display-mode='carousel'])` rule in HomeCarousel's is:global block; BaseLayout is untouched; the sj4 test contract is reworked to the early-visible-warning safety property (one 80px tick shows feedback, no silent navigation); i18n/legal footer tests route through grid mode; `npx astro check` clean and the full credentialed e2e suite passes under the orchestrator.
  </done>
</task>

<task type="auto">
  <name>Task 3: Remove the persistent carousel title underline (parity with DetailHero)</name>
  <files>src/components/HomeCarousel.astro, tests/e2e/homepage.spec.ts</files>
  <action>
Per direct user feedback, remove the persistent underline on `.home-hero__title` (added in quick-260725-tqs Item 3). In its rule, delete the underline declaration and the now-inert underline-offset declaration, and set the title's text-decoration to none instead. Because `.home-hero__title` is an `<a>`, BaseLayout's global `a:hover, a:focus-visible { text-decoration: underline }` would otherwise re-underline it on hover — so also set text-decoration to none in the existing `.home-hero__title:hover, .home-hero__title:focus-visible` rule (which currently only changes color). This yields no underline in any state, matching DetailHero's `.detail-hero__overlay-title` (a `<p>`, so it never had one — confirmed no text-decoration in DetailHero.astro). Keep everything else on `.home-hero__title` untouched: the accent-color hover/focus (`var(--current-accent, var(--color-accent))`), `cursor:pointer`, and the ellipsis truncation (`overflow:hidden; text-overflow:ellipsis; white-space:nowrap`) remain the click affordances alongside the custom down-chevron cursor already on `.home-hero__photo`. Update the rule's comment to reflect the removal (it currently explains why the underline was added).

Add a computed-style e2e test in tests/e2e/homepage.spec.ts asserting `.home-hero__title` resolves `text-decoration-line` to `none` at rest (and, if cheap, still `none` under `:hover`), on the FR homepage.
  </action>
  <verify>
    <automated>npx astro check</automated>
  </verify>
  <done>
`.home-hero__title` renders with no underline at rest or on hover/focus, keeps its accent-color hover, pointer cursor, and ellipsis truncation, and matches DetailHero's non-underlined title; the computed-style test asserts `text-decoration-line: none`; `npx astro check` is clean.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| client runtime -> DOM (this component) | Purely client-side visual feedback + a CSS-driven footer hide. No new external input, no network calls, no new packages, no server surface. |
| URL query -> carousel index (pre-existing, untouched) | `?carousel=<slug>` is still resolved via `galleries.findIndex` (never a selector string) per T-tqs-01 — not modified by this task. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-obg-01 | Denial of Service | idle-decay `setInterval` + `requestAnimationFrame` loop | low | mitigate | The 150ms watchdog only starts a rAF when `overscrollAccum > 0` and idle; the rAF self-terminates at t=1 and clears `decayRaf`; new pushes cancel it. No unbounded work. |
| T-obg-02 | Tampering | `body:has()` footer-hide CSS | low | accept | Client-side presentational rule scoped to the homepage only; hiding the footer changes no data and no compliance content (legal links remain reachable via grid mode). |
| T-tqs-01 | Injection | `?carousel=` param handling | low | accept | Pre-existing, not touched by this task; findIndex-only, no selector sink. |
| T-obg-SC | Tampering | package installs | n/a | mitigate | No npm/pip/cargo installs in this task — no package-legitimacy gate required. |
</threat_model>

<verification>
Run after all three tasks (the executor performs BOTH the automated suite AND a live browser check, matching this session's established pattern):

1. `npx astro check` — clean (0 errors) across all four modified files.
2. Full credentialed e2e suite (`npm run test:e2e`, real Sanity `.env`, isolated port) — all pass, including the new proportional-feedback, decay-on-release, neutral-reset-before-navigate, reduced-motion-feedback, mobile-feedback, footer-visibility-by-mode, sj4 early-warning, and underline-removed tests, plus the reworked i18n/legal footer tests. (`npm run test:unit` should also stay green — this task adds no unit surface.)
3. Live verification (Playwright MCP / real browser, dispatched synthetic WheelEvent/TouchEvent — NOT scrollTo-first shortcuts), FR and EN, desktop and mobile:
   - Fresh load + one 80px wheel tick: the photo is clearly scaled down and darkened, before the threshold, no navigation (the sj4 safety property restored as a visible warning).
   - Stop after a partial push: the photo visibly recedes to neutral on its own within ~300ms after the idle window; no navigation.
   - Cross the threshold: real navigation into the current collection still fires, and the cross-document `hero-photo` morph shows NO flash/glitch — the outgoing photo is captured at its neutral resting scale/brightness (confirm the reset lands before the click, and that neither "before" nor "simultaneous" timing produces a visible pull-back frame; capture a mid-transition screenshot if in doubt).
   - Footer hidden in carousel mode, visible in grid mode, on both locales.
   - Reduced motion: the scale/darken still appears (instant), navigation still works.
   - Title: no underline at rest or on hover.
</verification>

<success_criteria>
- Overscroll produces proportional photo scale (down to ~0.94) + radial darken (up to ~0.85 opacity) BEFORE the 150px threshold, on desktop and mobile, FR + EN.
- Releasing before the threshold visibly decays to neutral and does not navigate.
- Navigation still works at threshold and the outgoing View Transition captures a neutral photo (no flash).
- All overscroll listeners remain passive; no `preventDefault()` in the component.
- Footer hidden in carousel mode / visible in grid mode / unaffected elsewhere.
- Reduced-motion visitors still get the feedback (un-eased), not silence.
- Carousel title shows no underline in any state, affordances intact.
- Full e2e suite + `npx astro check` green; live browser spot-check confirms the visual behaviour and no morph flash.
</success_criteria>

<output>
Create `.planning/quick/260726-obg-implement-sketch-007-variant-c-overscrol/260726-obg-SUMMARY.md` when done.
</output>
