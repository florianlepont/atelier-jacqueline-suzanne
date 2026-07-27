---
phase: quick-260727-bsm
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/HomeCarousel.astro
  - tests/e2e/homepage.spec.ts
autonomous: true
requirements: [QUICK-260727-bsm]
must_haves:
  truths:
    - "During a peek push (and the ~420ms ease-settle after the mouse stops or leaves) the wordmark photo-cutout tracks the moving hero photo pixel-for-pixel — it is never frozen while the photo slides underneath it."
    - "The custom hover cursor's position tracking is instant on every browser (no eased transform on the position element), so it does not jitter/vibrate in Safari; the ring/pill visual morph still eases smoothly."
    - "An edge-zone CLICK completes the in-progress peek to a full slide, then swaps content with transitions disabled so the adjacent photo becomes the resting current photo with no visible pop or directional reversal."
    - "Keyboard arrows, dash clicks, swipe, auto-advance, center-click open, and mobile tap are behaviourally unchanged."
  artifacts:
    - src/components/HomeCarousel.astro
    - tests/e2e/homepage.spec.ts
  key_links:
    - "requestAnimationFrame sync loop reads heroImg.getBoundingClientRect() (which reflects the live CSS transform) every frame and rewrites --wordmark-bg-size/--wordmark-bg-position."
    - "Cursor outer element = JS-driven untransitioned translate (position only); cursor inner ring = eased scale/geometry/color morph (state only)."
    - "Edge-click commit sets --peek-shift and the peek layer to their full-slide targets, then on transitionend/timer swaps carouselIndex + render() inside the existing .is-opening transition-disabled reset, guarded by a committing re-entrancy flag."
---

<objective>
Fix three independently-reproduced, already-root-caused bugs in the just-shipped sketch-008 hover-navigation carousel (`HomeCarousel.astro`, quick-260726-u97):

- **Bug A** — the wordmark photo-cutout desyncs from (freezes relative to) the hero photo during the parallax-push peek, because `syncWordmarkAlignment()` only runs on load/resize, never while the photo is transform-shifting.
- **Bug B** — the custom hover cursor jitters/vibrates in Safari, because one `transform` value carries BOTH per-`mousemove` position tracking AND an eased state-morph under one shared `transition: transform 160ms`, so every mousemove retargets an in-flight eased transition (and the inline position write silently drops the `scale()` too).
- **Bug C** — an edge-zone click causes an abrupt content "pop": `render()` swaps `heroImg.src` synchronously while the photo is still at its pushed offset, then a generic `resetPeek()` eases it back in the WRONG direction relative to the peek the user just watched.

The mechanisms are already understood (see task brief) — do NOT re-diagnose from scratch. Grep `HomeCarousel.astro` for current line numbers before editing (the file changes fast).

Purpose: restore the "hole cut in the real photo" illusion during motion, kill the Safari cursor jitter, and make edge-click read as a smooth continuation of the peek.
Output: an updated `HomeCarousel.astro` and new/updated `homepage.spec.ts` coverage (FR + EN) for all three fixes.
</objective>

<execution_context>
@/home/user/ajs-website/.claude/gsd-core/workflows/execute-plan.md
@/home/user/ajs-website/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/quick/260726-u97-remove-the-scroll-to-open-gesture-entire/260726-u97-SUMMARY.md
@src/components/HomeCarousel.astro
@src/lib/home-carousel.ts
@tests/e2e/homepage.spec.ts

Key facts already established (do not re-derive):
- `getBoundingClientRect()` on `heroImg` DOES reflect the live CSS `transform: translateX(var(--peek-shift))`, so per-frame calls to the existing `syncWordmarkAlignment()` are all that is needed to track motion — no new geometry math.
- `PEEK_MAX_PUSH_FRACTION = 0.16` (current photo pushes at most 16%), `EDGE_ZONE_FRACTION = 0.22`. Peek layers rest at `translateX(±100%)`; z-index 0 (under `heroImg` z-index 1). During a right-zone peek at proximity p: `--peek-shift` = `-16p%`, `peekNext` = `translateX((1-p)*100)%`; the adjacent layer always covers the vacated strip (proven gap-free even at full 100% commit).
- `.home-hero__photo.is-opening .home-hero__img, .home-hero__photo.is-opening .home-hero__peek { transition: none }` already exists (used by `openCurrent()` for the cross-doc View Transition snapshot) — Bug C reuses this exact class for its synchronous swap.
- The peek preloads the adjacent gallery photo, so at edge-click `heroImg.complete` is true after the swap → `showSharp` fires the same tick (no fade), which is why the swap can be made visually coincident.
- Do NOT add new pure functions to `src/lib/home-carousel.ts`. All three fixes are about WHEN existing functions run (rAF timing, event ordering) and CSS/markup structure — not new math. `computeWordmarkBackgroundPosition`, `computeHoverZone`, `detectSwipeDirection` stay exactly as they are.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Split the hover cursor into an untransitioned position anchor + an eased visual ring (Bug B — Safari jitter)</name>
  <files>src/components/HomeCarousel.astro, tests/e2e/homepage.spec.ts</files>
  <action>
Decouple position-tracking from the state/geometry morph so cursor position updates are NEVER subject to a CSS transition on any browser.

MARKUP (grep `data-role="hero-cursor"`, currently ~line 252): wrap the existing `.home-hero__cursor-label` and `.home-hero__cursor-arrow` spans in a new inner element `<div class="home-hero__cursor-ring">…</div>`. Keep `data-role="hero-cursor"`, `data-zone="center"`, and `aria-hidden="true"` on the OUTER `.home-hero__cursor`. The outer becomes a pure position anchor; the inner ring owns all visuals.

CSS: keep the ungated base rule on the OUTER `.home-hero__cursor` as `position:absolute; top:0; left:0; opacity:0; pointer-events:none;` (this ungated rule must stay — it is the touch-device inertness fix from quick-260726-u97; do NOT regate it). Inside `@media (hover: hover) and (pointer: fine)`, the outer keeps `z-index:4` and gains `transition: opacity 160ms ease;` (opacity only — explicitly NOT `transform`, and explicitly not left as the CSS default `all`). Move every visual/geometry property onto a new `.home-hero__cursor-ring` rule positioned `position:absolute; top:0; left:0;` so its negative margin still centers it on the outer's translated origin (= the pointer point): `display:flex; align-items:center; justify-content:center; width:68px; height:68px; margin:-34px 0 0 -34px; border; border-radius; background; color; font-*;` its rest `transform: scale(0.6);` and its OWN `transition` covering `transform`(scale)/`width`/`height`/`margin`/`border-radius`/`background`/`border-color` (all the 160-200ms morph transitions currently on `.home-hero__cursor`) — but NOT any position translate. Rewire the state selectors: activation `.home-hero__photo.is-cursor-active .home-hero__cursor { opacity:1 }` (outer) plus `.home-hero__photo.is-cursor-active .home-hero__cursor-ring { transform: scale(1) }` (inner); edge-zone geometry `.home-hero__cursor[data-zone='left'] .home-hero__cursor-ring, .home-hero__cursor[data-zone='right'] .home-hero__cursor-ring { width:92px; height:52px; margin:-26px 0 0 -46px; background:var(--current-accent…); border-color:…; color:var(--current-accent-text…) }`. The `data-zone` attribute stays on the OUTER, so the existing label/arrow descendant selectors (`…[data-zone='left'] .home-hero__cursor-label`, `…[data-zone='left'] .home-hero__cursor-arrow`, the arrow's `scaleX(-1)`) keep matching unchanged — do NOT rewrite those, they still resolve through the new ring wrapper. Update the reduced-motion override to zero transitions on BOTH the outer and `.home-hero__cursor-ring`.

JS (grep `cursorEl.style.transform`, currently ~line 886): the assignment `cursorEl.style.transform = translate(x, y)` already targets the OUTER (`cursorEl` = `[data-role="hero-cursor"]`) — keep it there and unchanged. Because the outer now has no `transform` transition, position is instant every frame (fixes the jitter); because `scale()` now lives on the inner ring, the inline outer-transform no longer silently drops the scale (the secondary correctness bug). No script logic change beyond confirming the target element is the outer.

TESTS (`homepage.spec.ts`, describe `carousel hover cursor (sketch 008 Variant C)`, grep for it): (1) the existing edge-zone `toHaveCSS('background-color', expectedBg)` assertion currently reads the OUTER — retarget it to `cursor.locator('.home-hero__cursor-ring')` since background moved to the inner ring. (2) Add a new FR test that activates the cursor (hover center at `box.height*0.3`, `{steps:10}`) then asserts the OUTER `[data-role="hero-cursor"]` has NO transform transition via computed style: read `getComputedStyle(el).transitionProperty` and assert it does not contain `'transform'` and is not `'all'` (this is the core Safari-jitter fix proof — it must fail if the split is reverted). The existing opacity `'1'` (outer), label text (FR OUVRIR / EN OPEN), data-zone, arrow-visible, `cursor:none`, and mobile-inertness assertions must continue to pass unchanged.

Live Safari verification is impossible in this Chromium-only environment — the SUMMARY must state that and ask the user to confirm cursor smoothness in Safari after deploy.
  </action>
  <verify>
    <automated>grep -c 'home-hero__cursor-ring' src/components/HomeCarousel.astro | grep -qv '^0$' && npx astro check && npx playwright test tests/e2e/homepage.spec.ts -g "carousel hover cursor"</automated>
  </verify>
  <done>Markup has an inner `.home-hero__cursor-ring` wrapping the label+arrow; visual/morph CSS lives on the ring, position/opacity on the outer; the outer's computed `transitionProperty` excludes `transform` (and is not `all`); all `carousel hover cursor` tests (FR/EN, desktop + mobile) pass; `astro check` clean.</done>
</task>

<task type="auto">
  <name>Task 2: Keep the wordmark cutout synced to the hero photo's live transformed position via a rAF loop (Bug A — peek desync)</name>
  <files>src/components/HomeCarousel.astro, tests/e2e/homepage.spec.ts</files>
  <action>
`syncWordmarkAlignment()` (grep for it, ~line 487) already computes the correct cutout from `heroImg.getBoundingClientRect()`, and that rect reflects the live `transform`. The only bug is it is invoked solely on load + a 100ms-debounced resize — never while the photo is transform-shifting via `--peek-shift`. Fix = call it every frame for as long as the photo can plausibly still be in motion.

Add, right after `syncWordmarkAlignment()`, a small rAF pump keyed to a rolling deadline:
- module-scope `let wordmarkSyncRaf: number | null = null;` and `let wordmarkSyncUntil = 0;`
- `function pumpWordmarkSync()` → calls `syncWordmarkAlignment()`, then if `performance.now() < wordmarkSyncUntil` schedules itself again via `requestAnimationFrame`, else clears the handle.
- `function keepWordmarkSynced(ms = 500)` → early-return if `!hoverCapable || reduceMotionQuery.matches` (touch never moves the photo; reduced-motion has no peek); otherwise extend `wordmarkSyncUntil = Math.max(wordmarkSyncUntil, performance.now() + ms)` and start the pump if `wordmarkSyncRaf === null`. Default 500ms comfortably exceeds the 420ms transform transition so the loop keeps running through the ease-settle after the mouse stops or leaves.

Wire it at the two choke points where the photo's transform changes: call `keepWordmarkSynced()` at the END of `updatePeek()` (covers the active-mousemove push AND the retarget-then-settle) and at the END of `resetPeek()` (covers the mouseleave recede and every `render()` swap, since `render()` calls `resetPeek()` in its `hoverCapable` block). Because `keepWordmarkSynced` self-guards on `hoverCapable`, adding it inside these functions is safe on touch. Do NOT remove the existing direct `syncWordmarkAlignment()` calls in `revealWordmarkPhoto()`, the load handler, or the resize listener — the loop is additive.

TDZ note: `keepWordmarkSynced` references the `const hoverCapable` declared later (~line 830); this is safe because the function is only ever CALLED at runtime after full script init (first `render()` runs at the very end of the script; `updatePeek`/`resetPeek` fire on user interaction) — verify no call path executes it during initial synchronous parse.

TESTS (`homepage.spec.ts`): add an FR and an EN test in a new describe (e.g. `carousel wordmark stays synced to the peek (Bug A)`): goto, pin the slide (`[data-role="autoplay-toggle"]` click), wait for `.home` to have class `has-wordmark-photo`, read the initial `--wordmark-bg-position` (and `--wordmark-bg-size`) off `.home-hero__wordmark`. Move the mouse to a right-edge coordinate (`box.width*0.97`, `box.height*0.3`, `{steps:10}`) to push the photo, then use `expect.poll` to assert `--wordmark-bg-position` on `.home-hero__wordmark` CHANGES from its rest value (poll rides the rAF updates). This must fail on the pre-fix code (position frozen) and pass with the loop. Do NOT merely assert `--peek-shift` changed — assert the wordmark bg value tracks it.
  </action>
  <verify>
    <automated>grep -c 'keepWordmarkSynced' src/components/HomeCarousel.astro | grep -qv '^0$' && npx astro check && npx playwright test tests/e2e/homepage.spec.ts -g "wordmark stays synced"</automated>
  </verify>
  <done>A rAF loop rewrites `--wordmark-bg-size/--wordmark-bg-position` every frame for ~500ms past the last peek transform change, gated off on touch and reduced-motion; the new FR+EN tests prove `--wordmark-bg-position` changes in step with a peek push; `astro check` clean; existing wordmark-cutout tests still pass.</done>
</task>

<task type="auto">
  <name>Task 3: Edge-click completes the peek to a full slide, then swaps content with transitions disabled behind a re-entrancy guard (Bug C — abrupt pop)</name>
  <files>src/components/HomeCarousel.astro, tests/e2e/homepage.spec.ts</files>
  <action>
This task depends on Task 2's `keepWordmarkSynced` helper existing. Change ONLY the desktop edge-zone CLICK path (grep the `heroPhoto.addEventListener('click', …)` handler, ~line 916). Keyboard/dash/swipe/auto-advance keep calling `goToPrev()`/`goToNext()`/`goToIndex()` directly — do not touch them.

Add a `let committing = false;` module-scope flag next to the existing `opening` flag, and a `function commitEdge(direction: 'prev' | 'next')`:
1. If `committing || opening` → return. If `!heroPhoto` OR `reduceMotionQuery.matches` → do the plain swap immediately (`direction === 'next' ? goToNext() : goToPrev()`) and return (reduced-motion has no peek to continue; the plain swap is correct there). Otherwise set `committing = true`.
2. Continue the in-progress peek to its FULL slide (do NOT resetPeek first — ease from the current proximity value). For `'next'`: set `--peek-shift` to `-100%` on `heroPhoto` and `peekNext.style.transform = 'translateX(0)'`. For `'prev'`: `--peek-shift` = `100%` and `peekPrev.style.transform = 'translateX(0)'`. The existing 420ms `transform` transitions on `.home-hero__img` and `.home-hero__peek` ease both together; this is proven gap-free all the way to full commit. Call `keepWordmarkSynced(600)` so the wordmark tracks the photo through the whole slide (Bug A machinery).
3. Define a single-shot `finish()` (guarded by a local `done` boolean so transitionend + the fallback timer can't both run it): remove its own `transitionend` listener, clear the fallback timer, then perform the synchronous coincident swap — add `.is-opening` to `heroPhoto` (reuses the existing `transition:none` rule), advance `carouselIndex` by direction, call `render()` (which swaps `heroImg.src` to the now-cached adjacent photo — instant `showSharp` — and `resetPeek()`s the layers to neutral, all un-eased under `.is-opening`), force a reflow (`void heroPhoto.offsetWidth`), remove `.is-opening`, set `committing = false`, and if `timer !== null` call `startAutoAdvance()`. Because at that instant `heroImg` (now the adjacent photo) sits at `translateX(0)` exactly where the fully-slid-in peek layer was, the swap is pixel-coincident — no pop, no third-image flash, no directional reversal.
4. Trigger `finish()` on `transitionend` of the relevant peek layer where `event.propertyName === 'transform'`, with a `setTimeout(finish, 480)` fallback (420ms + slack) so it can never get stuck if the event doesn't fire (e.g. null layer). The guard must clear on every path.
5. In the click handler, replace the `goToPrev()`/`goToNext()` edge branches with `commitEdge('prev')`/`commitEdge('next')`; keep the `.home-hero__caption` ignore and the center `openCurrent()` branch. Add `if (committing || opening) return;` early in the handler.
6. Prevent the in-progress commit from being fought: add `if (committing) return;` at the top of the `mousemove` handler (so a stray move can't rewrite `--peek-shift` mid-commit), and in the `mouseleave` handler only call `resetPeek()` when `!committing` (still clear `is-cursor-active`/`currentZone` as today) — `finish()`'s own `render()`→`resetPeek()` handles the neutral reset.

TESTS (`homepage.spec.ts`, in/near describe `carousel hover-click navigation (sketch 008 Variant C)`): add an FR and an EN test proving commit-then-swap ordering at 1600x900 (mirror the existing right/left edge-click setup that clears the accent panel: viewport 1600x900, pin autoplay). Before clicking: capture `heroImg` current `src` and the `[data-role="peek-next"]` `src` (the adjacent photo). Move to the right edge to arm the peek, then `mouse.down()/up()`. Immediately (synchronously, well within 420ms) assert `heroImg` `src` is STILL the pre-click current src (proves the swap is deferred, NOT same-tick). Then `expect.poll` until `heroImg` `src` equals the captured peek-next src (proves the previously-peeking photo becomes the new hero with no intermediate third image). After the swap, assert `heroImg`'s computed `transform` translateX is at/near neutral (parse the matrix `e` component; ~0) — proving the content swap happened at rest, not while still pushed. The pre-existing `left/right edge click navigates … (in-page, no navigation)` tests must still pass (title changes, URL stays `/`).
  </action>
  <verify>
    <automated>grep -c 'commitEdge' src/components/HomeCarousel.astro | grep -qv '^0$' && npx astro check && npx playwright test tests/e2e/homepage.spec.ts -g "hover-click navigation"</automated>
  </verify>
  <done>Edge-click sets `--peek-shift`/peek layer to the full-slide target, then on transitionend/timer swaps `carouselIndex`+`render()` inside `.is-opening` behind a `committing` guard that always clears; the new FR+EN tests prove the src swap is deferred (not same-tick), lands on the previously-peeked photo, and occurs at a neutral transform; keyboard/dash/swipe/auto-advance and the existing edge-click tests are unchanged and green; `astro check` clean.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| build-time Sanity data → client markup | Gallery data (incl. peek photo srcs) is pre-fetched and pre-filtered by the page frontmatter (existing T-04.1-04-ID); the client script only reads already-safe static markup. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-bsm-01 | Tampering | client-side cursor/peek/commit interaction code | low | accept | No new trust boundary, network endpoint, auth path, file access, or schema field is introduced. All three fixes are DOM/animation/timing changes within `HomeCarousel.astro`; peek/commit image sources come from the same already-fetched, already-filtered `galleries[]` data the component already uses. No package installs. |
</threat_model>

<verification>
- `npx astro check` — 0 errors (7 pre-existing hints in untouched files are unrelated and acceptable, per the u97 SUMMARY).
- `npx playwright test tests/e2e/homepage.spec.ts` — full homepage suite green on both `chromium` and `webkit-mobile` projects, including the new Bug A/B/C assertions (FR + EN) and all pre-existing cursor/peek/click/wordmark/title/progress/regression blocks.
- `npm run test:unit` — unchanged/green (no `src/lib/home-carousel.ts` edits; if `dashboard-logic.test.ts` load gap recurs it is the known unrelated `@sanity/icons` issue, not this task).
- Grep guards: `commitEdge`, `keepWordmarkSynced`, and `home-hero__cursor-ring` each present in `HomeCarousel.astro`.
- The orchestrator will independently re-verify (diff review, typecheck, unit, build, isolated-port e2e, and a live Playwright MCP browser pass with real screenshots + frame-by-frame timing for the wordmark-sync and edge-click-commit behaviour, plus cursor-split screenshots). Bug B's Safari-specific jitter cannot be verified in this Chromium-only environment — the SUMMARY must flag this for the user to confirm after deploy.
</verification>

<success_criteria>
- Wordmark cutout tracks the hero photo throughout the peek push and the ~420ms settle (not frozen) — proven by the new bg-position-changes-with-peek test.
- Cursor position element carries no `transform` transition (instant tracking); ring/pill morph still eases — proven by the computed-style assertion; Safari jitter fix flagged for post-deploy human confirmation.
- Edge-click defers the content swap until the peek has slid fully in, then swaps at a neutral transform onto the previously-peeked photo — proven by the deferred-src + neutral-transform + peek-src-continuity test.
- Keyboard/dash/swipe/auto-advance/center-open/mobile-tap paths behaviourally unchanged; full homepage e2e suite green.
- No new pure functions added to `src/lib/home-carousel.ts`.
</success_criteria>

<output>
Create `.planning/quick/260727-bsm-fix-wordmark-peek-desync-safari-cursor-j/260727-bsm-SUMMARY.md` when done.
</output>
