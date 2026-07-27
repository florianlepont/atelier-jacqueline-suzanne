---
phase: quick-260727-iao
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/home-carousel.ts
  - tests/unit/home-carousel.test.ts
  - src/components/HomeCarousel.astro
  - tests/e2e/homepage.spec.ts
autonomous: true
requirements: [QUICK-260727-iao]
tags: [astro, css-clip-path, requestAnimationFrame, playwright, vitest, home-carousel, wordmark-cutout]

must_haves:
  truths:
    - "Through BOTH hover-peek AND click-commit, the wordmark's photo-cutout slides in the same direction, at the same time, as the carousel photo — revealing the incoming gallery's real texture in a 1:1 visual match with the photo's own peek/commit motion."
    - "During a full edge-click commit, the seam between the current-photo cutout and the incoming-photo cutout moves continuously from 'all current' to 'all incoming' and lands on 'all incoming' at settle — it never freezes and never goes solid-ink at any point in the ~480ms slide."
    - "At rest, in the center zone, on touch, under reduced motion, and before JS runs, the wordmark shows ONLY the current photo's cutout; both peek layers are fully clipped away."
    - "Exactly one wordmark element remains the accessible <h1>; the two peek copies are aria-hidden and are NOT heading elements, so screen-reader output and the single-h1 contract are unchanged."
    - "quick-260727-g04's solid-ink-during-commit behavior and the 'clamp-and-hold is the fallback for when there is no more photo' framing are REMOVED, not layered on top of the new mechanism."
  artifacts:
    - src/lib/home-carousel.ts
    - tests/unit/home-carousel.test.ts
    - src/components/HomeCarousel.astro
    - tests/e2e/homepage.spec.ts
  key_links:
    - "computeWordmarkSeamFraction() (pure, DOM-free, in home-carousel.ts) turns the current photo's LIVE edge + the wordmark box into a 0..1 seam fraction; the component writes it as --wm-seam on the wordmark stack and CSS clips all three layers from it (no per-frame clip-path string building in JS)."
    - "syncWordmarkLayers() feeds each of the three layers its OWN live rect + natural dimensions into the UNCHANGED computeWordmarkBackgroundPosition(), and recomputes the seam every frame from heroImg.getBoundingClientRect() (which already reflects the live, mid-transition interpolated transform) via the extended keepWordmarkSynced()/pumpWordmarkSync() rAF loop — driven identically through updatePeek() (hover) and commitEdge() (commit slide)."
    - "The two peek wordmark copies use the distinct class token .home-hero__wordmark-peek (NOT .home-hero__wordmark) so every existing single-match `.home-hero__wordmark` locator (critical.smoke.spec.ts, homepage.spec.ts) keeps matching exactly the current <h1>."
---

<objective>
Replace the wordmark cutout's current clamp-and-hold + solid-ink-during-commit behavior with a TRUE mirrored peek. The wordmark's photo-cutout gets its own three-layer structure that mirrors `.home-hero__photo`'s existing current / peekPrev / peekNext layers: as the carousel photo slides or peeks toward an adjacent gallery, the wordmark's cutout ALSO slides — same direction, same time — to reveal the incoming photo's texture through the letter shapes, a 1:1 match with the photo's own motion, through BOTH the hover-peek and the click-commit slide.

This SUPERSEDES quick-260727-drq's Bug 2 clamp-hold framing and quick-260727-g04's solid-ink-during-slide fix. Both must be removed/replaced by this mechanism, not stacked on top. This exact direction ("full mirrored peek", vs "smooth crossfade only" vs "something else") was confirmed by direct user choice — do NOT second-guess it.

The geometric model is already derived and verified in the task brief — do NOT re-derive it. Use it directly:
- At any x on screen, which photo is actually visible there is fully determined by the current photo's (heroImg's) LIVE translated rect. The peek layers are verified gap-free at every proximity, so wherever heroImg has vacated, the corresponding peek layer draws underneath.
- RIGHT zone (approaching/committing toward next): the on-screen seam is heroImg's live right edge — `heroImg.getBoundingClientRect().right`. Left of the seam shows the CURRENT photo; right of the seam shows peekNext.
- LEFT zone (approaching/committing toward prev): the seam is heroImg's live left edge — `heroImg.getBoundingClientRect().left`. Left of the seam shows peekPrev; right of the seam shows the CURRENT photo.
- The wordmark box sits at a fixed screen rect. In wordmark-local coordinates (fraction of its own width from its left edge), the seam is `s = clamp((seamScreenX - wordmarkRect.left) / wordmarkRect.width, 0, 1)`. Right zone: current occupies `[0, s]`, peekNext occupies `[s, 1]`. Left zone: peekPrev occupies `[0, s]`, current occupies `[s, 1]`.

`heroImg.getBoundingClientRect()` already returns the post-transform, live, mid-CSS-transition interpolated box — it is exactly the "read the live value every frame" the brief calls for, without any getComputedStyle transform-matrix parsing, and it is the same rect `syncWordmarkAlignment()` already reads. Use it.

Purpose: make the wordmark read as a real hole cut in the same physical photo stack at ALL proximities from 0% to 100%, through both interaction phases, eliminating the frozen-clamp and solid-ink reads entirely.
Output: a new pure seam function + unit tests; a three-layer wordmark DOM/CSS structure; the per-layer sync + seam wiring driven through hover and commit; and rewritten/added FR+EN e2e coverage.
</objective>

<execution_context>
@/home/user/ajs-website/.claude/gsd-core/workflows/execute-plan.md
@/home/user/ajs-website/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@src/components/HomeCarousel.astro
@src/lib/home-carousel.ts
@tests/unit/home-carousel.test.ts
@tests/e2e/homepage.spec.ts
@.planning/quick/260727-bsm-fix-wordmark-peek-desync-safari-cursor-j/260727-bsm-SUMMARY.md
@.planning/quick/260727-drq-fix-safari-peek-transition-jitter-wordma/260727-drq-SUMMARY.md
@.planning/quick/260727-fc2-fix-is-tracking-not-being-re-armed-after/260727-fc2-SUMMARY.md
@.planning/quick/260727-g04-fix-wordmark-cutout-freezing-at-clamp-bo/260727-g04-SUMMARY.md
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Extract and unit-test the pure computeWordmarkSeamFraction() seam-math function</name>
  <files>src/lib/home-carousel.ts, tests/unit/home-carousel.test.ts</files>

  <behavior>
    Following this codebase's established pattern (computeWordmarkBackgroundPosition / computeHoverZone / detectSwipeDirection are pure, DOM-free, unit-tested), extract the seam-position formula as a new pure function so the geometry is tested outside Playwright.

    RED (write failing unit tests first):
    - Add a new `describe('computeWordmarkSeamFraction', ...)` block to `tests/unit/home-carousel.test.ts`, importing the not-yet-exported `computeWordmarkSeamFraction` alongside the existing imports. Confirm the tests FAIL (function does not exist yet).
    - Cover, with plain numeric inputs (no DOM):
      - right zone at rest: `computeWordmarkSeamFraction('right', 0, 1920, 1300, 600)` → `1` (heroRight 1920 is far past the wordmark's right edge → current covers all).
      - right zone mid-push: `computeWordmarkSeamFraction('right', 0, 1450, 1300, 600)` → `0.25` ((1450-1300)/600).
      - right zone full commit: `computeWordmarkSeamFraction('right', 0, 1300, 1300, 600)` → `0` (seam at the wordmark's left edge → current gone, peekNext covers all); and a beyond-edge case `('right', 0, 1000, 1300, 600)` → `0` (negative clamped).
      - left zone at rest: `computeWordmarkSeamFraction('left', 0, 1920, 1300, 600)` → `0` (heroLeft 0 is far left of the wordmark → current covers all, peekPrev nothing).
      - left zone mid-push: `computeWordmarkSeamFraction('left', 1400, 1920, 1300, 600)` → `~0.1667` ((1400-1300)/600); assert with `toBeCloseTo`.
      - left zone full commit: `computeWordmarkSeamFraction('left', 1920, 3840, 1300, 600)` → `1` (heroLeft slid a full width right, past the wordmark's right edge → current gone, peekPrev covers all).
      - degenerate guard: `computeWordmarkSeamFraction('right', 0, 1920, 1300, 0)` → `1` (zero-width box → safe no-op value, documented).

    GREEN: implement the function so all new cases pass and the existing computeWordmarkBackgroundPosition / detectSwipeDirection / computeHoverZone tests stay green.
  </behavior>

  <action>
    In `src/lib/home-carousel.ts`, add and export `computeWordmarkSeamFraction(zone, heroLeft, heroRight, wordmarkLeft, wordmarkWidth)` alongside the existing pure functions (keep computeWordmarkBackgroundPosition UNCHANGED — the drq clamp stays exactly as-is; it will be reused verbatim per layer in Task 3).

    Signature and semantics:
    - `zone: 'left' | 'right'` (center is handled in the component, never passed here).
    - `heroLeft`, `heroRight`: the current photo's live on-screen left/right edges (px), i.e. `heroImg.getBoundingClientRect().left`/`.right`.
    - `wordmarkLeft`, `wordmarkWidth`: the wordmark box's live left edge and width (px).
    - Returns a number in `[0, 1]`: the seam position as a fraction of the wordmark's own width, measured from its LEFT edge.
    - Compute `seamScreenX = zone === 'right' ? heroRight : heroLeft`.
    - If `wordmarkWidth <= 0` return `1` (degenerate no-op: a zero-width box has no visible glyphs regardless; documented in a comment).
    - Otherwise return `Math.min(1, Math.max(0, (seamScreenX - wordmarkLeft) / wordmarkWidth))`.

    Add a doc comment stating the fraction's meaning per zone (right: current `[0,s]` / peekNext `[s,1]`; left: peekPrev `[0,s]` / current `[s,1]`) and that it is deliberately pure/DOM-free so the geometry is unit-testable — mirroring the module's existing convention. Do NOT round; return the raw clamped ratio (tests use exact values / toBeCloseTo).
  </action>

  <verify>
    <automated>npx vitest run tests/unit/home-carousel.test.ts</automated>
  </verify>

  <done>
    - `computeWordmarkSeamFraction` is exported from `src/lib/home-carousel.ts`, pure and DOM-free.
    - All new seam-fraction unit cases pass; the pre-existing computeWordmarkBackgroundPosition (incl. the drq clamp cases), detectSwipeDirection, and computeHoverZone tests remain green.
    - `computeWordmarkBackgroundPosition` is byte-unchanged.
  </done>
</task>

<task type="auto">
  <name>Task 2: Build the three-layer wordmark stack (markup + CSS), default-clipped so nothing changes visually yet</name>
  <files>src/components/HomeCarousel.astro</files>

  <action>
    Grep fresh line numbers before editing — the anchors below are planning-time reads of a ~2700-line file and will drift.

    MARKUP (planning anchor: the carousel wordmark `<h1 class="home-hero__wordmark">Atelier<br />Jacqueline<br />Suzanne</h1>` inside `.home-hero__accent`, ~line 269). Wrap the wordmark in a stack container holding three overlaid copies:
    - Add a wrapper `<div class="home-hero__wordmark-stack" data-role="wordmark-stack" data-peek-zone="right" style="--wm-seam: 1">` (the initial `data-peek-zone`/`--wm-seam` make the SSR/pre-JS state show the current photo full with both peeks clipped — see CSS below).
    - Keep the EXISTING `<h1 class="home-hero__wordmark">` as the FIRST child, unchanged in class and content — it stays the sole `.home-hero__wordmark` element and the sole accessible heading. Its accessibility treatment (semantic `<h1>`, real text) is preserved on exactly this one element.
    - Add TWO sibling copies AFTER the h1, each with identical text content (`Atelier<br />Jacqueline<br />Suzanne`) but as NON-heading, aria-hidden elements so screen readers ignore them and the single-h1 contract is unchanged:
      - `<span class="home-hero__wordmark-peek home-hero__wordmark-peek--prev" data-role="wordmark-peek-prev" aria-hidden="true">Atelier<br />Jacqueline<br />Suzanne</span>`
      - `<span class="home-hero__wordmark-peek home-hero__wordmark-peek--next" data-role="wordmark-peek-next" aria-hidden="true">Atelier<br />Jacqueline<br />Suzanne</span>`
    - CRITICAL: the peek copies must use the distinct class TOKEN `home-hero__wordmark-peek` and must NOT carry the `home-hero__wordmark` token — several existing tests (critical.smoke.spec.ts, homepage.spec.ts) query `.home-hero__wordmark` in Playwright strict mode expecting a single match; adding the token to three elements would break them. The two peek copies are matched only by `.home-hero__wordmark-peek`.

    CSS (planning anchors: `.home-hero__wordmark` typographic rule ~line 2148; the `@supports (background-clip: text)` block ~line 2185; `.home.has-wordmark-photo .home-hero__wordmark` ~line 2211):
    - Add `.home-hero__wordmark-stack { position: relative; margin: 0 0 var(--space-md); }` and change the existing `.home-hero__wordmark` rule's `margin: 0 0 var(--space-md);` to `margin: 0;` — the wrapper now owns the spacing to the intro paragraph, so the in-flow h1 keeps sizing the box but the gap to `.home-hero__intro` is unchanged.
    - Make the two peek copies overlay the h1 exactly: `.home-hero__wordmark-peek { position: absolute; inset: 0; margin: 0; display: block; pointer-events: none; }` (the h1 stays in normal flow and sizes the stack; the peeks are inset:0 overlays on the same box).
    - Give all three layers identical glyph rendering by adding `.home-hero__wordmark-peek` to the SAME declarations the h1 uses for font-family, text-transform, font-size (the clamp), font-weight, line-height, letter-spacing, and color:inherit — either by grouping the selectors or by duplicating the exact declarations. The three MUST render byte-identical glyphs at identical positions (same text, same `<br>` breaks, same metrics) or the cutout seam will not line up.
    - In the `@supports (background-clip: text)` block, group `.home-hero__wordmark, .home-hero__wordmark-peek` for `background-size: var(--wordmark-bg-size, cover)`, `background-position: var(--wordmark-bg-position, center)`, `background-repeat: no-repeat`, `-webkit-background-clip: text`, `background-clip: text`. Keep `background-image: var(--wordmark-photo)` on `.home-hero__wordmark` ONLY (the current layer). The peek copies get their own `background-image` set inline by JS in Task 3, and read their OWN element-scoped `--wordmark-bg-size`/`--wordmark-bg-position` (also set inline per-element in Task 3).
    - Group `.home.has-wordmark-photo .home-hero__wordmark, .home.has-wordmark-photo .home-hero__wordmark-peek` for the `color: transparent; -webkit-text-fill-color: transparent; filter: var(--wordmark-photo-filter, ...)` treatment, so the peek copies become true cutouts under the same has-wordmark-photo gate.
    - Add the seam-driven clip-path rules (JS sets ONLY `--wm-seam` (0..1) and `data-peek-zone` on the stack; CSS does all clipping — no clip-path strings are built in JS):
      - Default hidden for both peeks: `.home-hero__wordmark-peek { clip-path: inset(0 0 0 100%); }`.
      - Right zone: `.home-hero__wordmark-stack[data-peek-zone='right'] .home-hero__wordmark { clip-path: inset(0 calc((1 - var(--wm-seam, 1)) * 100%) 0 0); }` (reveal `[0, s]`) and `.home-hero__wordmark-stack[data-peek-zone='right'] .home-hero__wordmark-peek--next { clip-path: inset(0 0 0 calc(var(--wm-seam, 1) * 100%)); }` (reveal `[s, 1]`). Leave `--peek--prev` at the default hidden.
      - Left zone: `.home-hero__wordmark-stack[data-peek-zone='left'] .home-hero__wordmark { clip-path: inset(0 0 0 calc(var(--wm-seam, 0) * 100%)); }` (reveal `[s, 1]`) and `.home-hero__wordmark-stack[data-peek-zone='left'] .home-hero__wordmark-peek--prev { clip-path: inset(0 calc((1 - var(--wm-seam, 0)) * 100%) 0 0); }` (reveal `[0, s]`). Leave `--peek--next` hidden.
      - Do NOT put any `transition` on `clip-path` — the seam must track the photo per-frame (driven by the rAF loop in Task 3), not run its own easing.
    - Under the existing reduced-motion block (planning anchor ~line 1857, where `.home-hero__peek, .home-hero__img` already get `transition: none`): the peek wordmark copies are naturally inert (they stay at the default-hidden clip because the JS peek path is skipped under reduced motion — see Task 3). No extra reduced-motion rule is required, but confirm the default hidden clip-path applies (i.e. the base `.home-hero__wordmark-peek` hidden rule is not overridden except by the zone selectors).

    At the end of THIS task the page must render exactly as before: the two peek copies exist in the DOM but are fully clipped (invisible), no JS references them yet, and `--wm-seam`/`data-peek-zone` sit at their SSR defaults. No behavioral change — this is purely structural groundwork.
  </action>

  <verify>
    <automated>npx playwright test tests/e2e/homepage.spec.ts tests/e2e/critical.smoke.spec.ts</automated>
  </verify>

  <done>
    - Three wordmark layers exist inside `.home-hero__wordmark-stack`: the unchanged `<h1 class="home-hero__wordmark">` plus two `aria-hidden` `.home-hero__wordmark-peek--prev/--next` span copies with identical text.
    - The peek copies do NOT carry the `home-hero__wordmark` class token; `.home-hero__wordmark` still matches exactly one element (the h1).
    - Both peek copies are fully clipped by default; at SSR/rest the wordmark looks identical to before.
    - `npm run typecheck` (astro check) is clean, and the full homepage + critical smoke e2e suites stay green (no visual/behavioral regression yet).
  </done>
</task>

<task type="auto">
  <name>Task 3: Wire the per-layer sync + live seam through hover and commit; retire g04's solid-ink and the clamp-hold framing</name>
  <files>src/components/HomeCarousel.astro</files>

  <action>
    Grep fresh line numbers first. Planning anchors: `wordmarkEl` query ~line 387; `revealWordmarkPhoto` ~464; `syncWordmarkAlignment` ~489; `keepWordmarkSynced`/`pumpWordmarkSync` ~518-541; `render()` solid-ink reset ~551 and peek-population/`resetPeek()` ~616-637; `resetPeek` ~884; `updatePeek` ~901; `commitEdge` ~945 (g04 solid-ink lines ~963-974, removed-pump comment ~983-991, `finish()`/`render()` ~999-1034); mousemove/mouseenter/mouseleave ~1047-1117; `peekPrev`/`peekNext` query ~1049-1050; resize handler ~1262.

    1. QUERY the new elements near the existing `wordmarkEl` lookup (~line 387): `wordmarkStackEl` (`.home-hero__wordmark-stack`), `wordmarkPeekPrevEl` (`.home-hero__wordmark-peek--prev`), `wordmarkPeekNextEl` (`.home-hero__wordmark-peek--next`). All nullable, no-op safe if absent.

    2. INTRODUCE a single sticky module-level `lastPeekZone: 'left' | 'right'` defaulting to `'right'`. There is deliberately NO 'center' seam state — at neutral the seam fraction naturally rests at its current-covers-all extreme (s=1 for right, s=0 for left), which renders identically to "center" (current full, both peeks clipped). This avoids a snap/desync between the eased photo recede and the wordmark on mouseleave. Do NOT add a 'center' branch to the seam.

    3. ADD `syncWordmarkLayers()` (extends, does not replace, the current-layer math):
       - Call the UNCHANGED `syncWordmarkAlignment()` first (current layer: sets `--wordmark-bg-size`/`--wordmark-bg-position` on `wordmarkEl` from `heroImg`'s live rect + naturals, exactly as today — the drq clamp inside computeWordmarkBackgroundPosition applies here per its existing behavior).
       - If `wordmarkStackEl`/`wordmarkEl` missing, return.
       - `const zone = lastPeekZone;` pick `peekImg = zone === 'right' ? peekNext : peekPrev` and `peekEl = zone === 'right' ? wordmarkPeekNextEl : wordmarkPeekPrevEl`.
       - Read `wmRect = wordmarkEl.getBoundingClientRect()` (shared box for all three layers) once.
       - If `peekImg` / `peekEl` missing OR `!peekImg.naturalWidth` OR `computeWordmarkBackgroundPosition(...)` returns null for the peek: set `--wm-seam` to the current-covers-all extreme (`zone === 'right' ? '1' : '0'`) and `data-peek-zone = zone`, then return. This is the "nearest layer's clamped edge" fallback the brief asks for — NEVER solid ink. (Rare: only the very first paint before an adjacent photo has loaded; peek srcs are preloaded in render().)
       - Otherwise: feed the peek layer its OWN independent computation via the SAME pure function — `computeWordmarkBackgroundPosition(peekImg.naturalWidth, peekImg.naturalHeight, peekImg.getBoundingClientRect(), wmRect, OBJECT_POSITION_X, OBJECT_POSITION_Y)`; set `peekEl.style.backgroundImage = url(peekImg.currentSrc || peekImg.src)`, `peekEl.style.setProperty('--wordmark-bg-size', ...)`, `peekEl.style.setProperty('--wordmark-bg-position', ...)`.
       - Compute the seam from the LIVE current-photo edge: `const heroRect = heroImg.getBoundingClientRect(); const seam = computeWordmarkSeamFraction(zone, heroRect.left, heroRect.right, wmRect.left, wmRect.width);` then `wordmarkStackEl.style.setProperty('--wm-seam', String(seam)); wordmarkStackEl.dataset.peekZone = zone;`.
       - Import `computeWordmarkSeamFraction` alongside the existing `computeWordmarkBackgroundPosition` import at the top of the module script.

    4. DRIVE it through the existing rAF loop — do NOT build a parallel loop. Change `pumpWordmarkSync()` to call `syncWordmarkLayers()` instead of `syncWordmarkAlignment()`. Update its comment: the pump now keeps ALL THREE layers' cutouts AND the seam tracking the live photo motion, not just the single current-layer position. Also switch the direct call sites that should now maintain the peeks: `revealWordmarkPhoto()`'s `syncWordmarkAlignment()` call and the resize handler's `syncWordmarkAlignment` → `syncWordmarkLayers`. (`keepWordmarkSynced()`'s hoverCapable + reduced-motion guard is unchanged, so touch/reduced-motion never pump; the direct calls keep the current layer correct there.)

    5. SET `lastPeekZone` at the interaction sites (do NOT touch `currentZone`/`currentProximity`, which the photo peek + click handlers still own):
       - `updatePeek()`: in the left branch set `lastPeekZone = 'left'`; in the right branch set `lastPeekZone = 'right'`; the center branch calls `resetPeek()` (unchanged). Keep the existing `keepWordmarkSynced()` call at the end of the push branches.
       - `resetPeek()`: after setting `--peek-shift: 0` and the peek layers' rest transforms, call `syncWordmarkLayers()` ONCE synchronously (so a post-swap reset under `.is-opening` snaps the seam to the current-full extreme immediately, with no stale peek frame) in addition to the existing `keepWordmarkSynced()` (which eases the tail for the mouseleave recede). Do NOT change `lastPeekZone` here — leaving it lets the recede seam ease to the extreme in sync with the photo.

    6. RETIRE g04's solid-ink in `commitEdge()`'s full-slide branch and make the commit a REAL seam-driven slide:
       - DELETE the two g04 statements that hid the cutout at the start of the slide: `root.classList.remove('has-wordmark-photo')` and `root.style.setProperty('--wordmark-photo', 'none')` (planning anchor ~963-974), and the g04 rationale comment block. `has-wordmark-photo` must STAY true through the commit so the cutout remains visible and the seam drives it.
       - KEEP `photo.classList.remove('is-tracking')` (drq — the commit slide should ease).
       - Set `lastPeekZone = direction === 'next' ? 'right' : 'left'` at the start of the slide (before or with the `--peek-shift: ±100%` targets).
       - Re-add a bounded sync pump for the slide's duration: call `keepWordmarkSynced(500)` after setting the full-slide targets (g04 had removed it because the cutout was hidden; it is meaningful again now — it drives the visible seam continuously from the LIVE `heroImg.getBoundingClientRect()` through the ~420ms eased slide). Replace g04's "nothing to sync" comment with a short note that the pump now drives the mirrored-peek seam through the commit.
       - `finish()` is unchanged: it still swaps `heroImg.src` to the (already-cached) adjacent photo under `.is-opening`, calls `render()` (which calls `resetPeek()` → the synchronous `syncWordmarkLayers()` snaps the seam to the current-full extreme on the NEW gallery), and re-arms `is-tracking`. Because the incoming photo the wordmark was showing via peekNext/peekPrev at s→extreme is the SAME photo `heroImg` swaps to, at the SAME neutral alignment, the hand-off from "peek layer showing" to "current layer showing" is pixel-coincident — no pop.
       - `render()`'s own start-of-swap `has-wordmark-photo` remove + `--wordmark-photo: none` (planning anchor ~551) STAYS — that is the genuine loading/error solid-ink fallback for an uncached hero and must remain. Only the g04-specific commit-time removal is deleted. Re-confirm: after this change `has-wordmark-photo` is present continuously across a commit whose adjacent photo is cached (the normal case), toggling only within the synchronous cached swap tick if at all.

    7. RE-EVALUATE has-wordmark-photo / --wordmark-photo: they are RETAINED. They still gate the cutout-vs-solid-ink state for all three layers (the grouped CSS from Task 2) and are still needed for the initial-load/error fallback in render(). The mechanism being retired is specifically the "clamp-and-hold / go solid because there's no more photo" case: with three independently-clamped layers plus the seam there is ALWAYS a correct photo at every proximity, so the give-up-and-go-solid path is gone. If (contrary to the gap-free peek design) an active peek genuinely cannot supply a crop, syncWordmarkLayers falls back to the current layer's clamped edge (step 3), never solid ink.

    8. FEATHER/seam polish (live judgment, note the choice in the SUMMARY): start with the hard clip-path seam from Task 2. If a raw clip through glyph strokes reads as a harsh aliasing/1px-gap artifact under live inspection, either (a) give the active peek layer a 1-2px overlap toward the current side (e.g. subtract ~1px inside the peek's `inset` calc) so the peek — painted above the h1 in DOM order — hides any sub-pixel gap, and/or (b) add a few-px `mask-image: linear-gradient(...)` feather at the seam. A hard seam may read fine given adjacent gallery photos are usually visually distinct — accept it if so. Document whichever you choose and why.

    Do NOT touch: the photo peek layers' own transform logic (`--peek-shift`, peek `translateX`), `commitEdge()`'s continue-then-swap timing / `.is-opening` / `committing` guard / fc2 `is-tracking` re-arm, the drq clamp in home-carousel.ts, the cursor, keyboard/dash/swipe/auto-advance paths, or the mobile tap. This task changes ONLY what the WORDMARK cutout does.
  </action>

  <verify>
    <automated>npx playwright test tests/e2e/homepage.spec.ts</automated>
  </verify>

  <done>
    - During a hover-peek toward an edge, the peek-side wordmark layer becomes visible and its revealed portion grows as proximity increases (`--wm-seam` moves off its extreme, `data-peek-zone` matches the approached edge), while the current layer's portion shrinks correspondingly and its cutout still tracks the pushed photo.
    - During a full edge-click commit, `has-wordmark-photo` stays present throughout (no solid-ink beat), and `--wm-seam` moves continuously toward the incoming extreme, landing on it at settle; after the swap the seam is back at the current-full extreme on the NEW gallery with both peeks clipped.
    - g04's commit-time `has-wordmark-photo`/`--wordmark-photo: none` removal is deleted; render()'s loading/error solid-ink fallback is retained.
    - The seam is driven through the SHARED keepWordmarkSynced()/pumpWordmarkSync() rAF loop (no parallel loop), reading live `heroImg.getBoundingClientRect()` each frame, through BOTH updatePeek() and commitEdge().
    - `computeWordmarkBackgroundPosition` and the drq clamp are unchanged; touch / reduced-motion / pre-JS still show only the current cutout (peeks clipped).
    - The full homepage e2e suite passes and `npm run typecheck` is clean. (Note: the old g04 solid-ink describe block will now fail its mid-slide assertion — it is retired/rewritten in Task 4; if running Task 3's verify before Task 4, expect that one block red and everything else green.)
  </done>
</task>

<task type="auto">
  <name>Task 4: Retire the old clamp/solid-ink e2e assertions and add mirrored-peek coverage (hover seam growth + continuous commit seam), FR + EN</name>
  <files>tests/e2e/homepage.spec.ts</files>

  <action>
    Grep the drq/g04-era describe blocks by title before editing. Planning anchors: `carousel wordmark does not freeze during edge-click commit (quick-260727-g04)` ~line 516-577; `carousel wordmark stays synced to the peek (Bug A)` ~line 586-623; the edge-peek preview / edge-click-defer blocks ~629-880 (those assert `--peek-shift` and peek `<img>` transforms/srcs — the PHOTO peek, untouched by this task — leave them as-is).

    1. RETIRE the g04 solid-ink assertion. Rewrite the `quick-260727-g04` describe block (or replace it with a new `carousel wordmark mirrored-peek commit (quick-260727-iao)` block and delete the g04 one) so it asserts the NEW contract instead of the retired one. Its old core assertion — `has-wordmark-photo` is ABSENT mid-slide — is now WRONG and must be removed. New FR + EN tests (goto `/` and `/en/`), each:
       - Stop auto-advance via `[data-role="autoplay-toggle"]`; assert `.home` has `has-wordmark-photo` at rest.
       - Capture `[data-role="index-label"]` initial text.
       - Right-edge click to commit next: move to `box.x + box.width * 0.97`, `mouse.down()`, `mouse.up()` (same pattern the retired g04/bsm tests used).
       - Sample the seam continuously during the ~480ms slide (use `expect.poll` and/or a couple of fixed `waitForTimeout` samples): read `--wm-seam` off `.home-hero__wordmark-stack` and `data-peek-zone`. Assert `data-peek-zone` is `'right'` during the slide, and that `--wm-seam` is observed at an intermediate value (`> 0` and `< 1`) at least once AND trends toward `0` (the incoming-covers-all extreme) — i.e. the split moves continuously, not frozen. Assert `has-wordmark-photo` STAYS present at a deterministic mid-slide sample (e.g. `waitForTimeout(150)` then read the class) — proving no solid-ink beat.
       - After settle: assert the index changed (`not.toHaveText(initialIndex)`), `has-wordmark-photo` present, `--wm-seam` back at the current-full extreme (`'1'` for the right-zone resting state) or `data-peek-zone` resting such that the current layer is full, and the current `.home-hero__wordmark` `--wordmark-bg-position` is a fresh valid `px px` pair (`/^-?\d+(\.\d+)?px -?\d+(\.\d+)?px$/`).
       - Add a mirror LEFT-commit case for at least one locale (left-edge click at `box.width * 0.03`, `data-peek-zone` `'left'`, `--wm-seam` trending toward `1`).

    2. ADAPT the Bug A block (`carousel wordmark stays synced to the peek`). Keep its existing assertion that the current layer's `--wordmark-bg-position` changes during a right-edge push (still true — the current layer still tracks). ADD, in the same or a new describe, a hover seam-growth proof, FR + EN:
       - Move partway toward the right edge (e.g. `box.width * 0.90`), read `--wm-seam` (call it s1) and assert `data-peek-zone` is `'right'` and the peek-next layer is revealing something (`s1 < 1`).
       - Move closer to the edge (e.g. `box.width * 0.99`), read `--wm-seam` (s2) via `expect.poll`, and assert `s2 < s1` (the peek-side portion `1 - s` grows as proximity increases while the current portion `s` shrinks).
       - Assert the inactive peek layer stays fully clipped: the peek-prev layer's computed `clip-path` reveals nothing (e.g. read `getComputedStyle(page.locator('.home-hero__wordmark-peek--prev')).clipPath` and assert it is the fully-hidden inset, or assert its rendered width via a bounding-box/`clip-path` check is zero) while in the right zone.
       - Mirror one case for the LEFT edge (peek-prev grows, peek-next stays clipped).

    3. Keep both locales for the new/rewritten tests. Reuse the existing `photoBox(page)` helper pattern. Do NOT weaken or delete the untouched PHOTO-peek tests (edge-peek preview, edge-click-defer, is-tracking, cursor) — they must stay green.

    Read `--wm-seam` in tests via `page.locator('.home-hero__wordmark-stack').evaluate(el => getComputedStyle(el).getPropertyValue('--wm-seam').trim())` and `data-peek-zone` via `el.getAttribute('data-peek-zone')` — these are the deterministic, JS-set hooks (do NOT parse computed `clip-path` strings for the seam value; use them only for the inactive-layer-hidden assertion).
  </action>

  <verify>
    <automated>npx playwright test tests/e2e/homepage.spec.ts</automated>
  </verify>

  <done>
    - The retired g04 "goes solid mid-slide" assertion is gone; new FR+EN commit tests prove the seam moves continuously to the incoming extreme with `has-wordmark-photo` present throughout (no solid ink), for both right and left commits.
    - New FR+EN hover tests prove the peek-side wordmark layer's revealed portion grows with proximity while the current shrinks, and the inactive peek layer stays fully clipped.
    - All untouched photo-peek / cursor / is-tracking / keyboard-dash-swipe tests remain green; full `tests/e2e/homepage.spec.ts` passes in chromium + webkit-mobile, and `npm run typecheck` is clean.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| (none new) | Pure client-side DOM/CSS animation on an already-rendered, build-time-generated static page. No user input crosses a boundary; no network, storage, package install, or server surface is touched. The two peek `<img>` sources are the same build-time Sanity CDN URLs already loaded for the photo peek layers. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-iao-01 | Tampering | New DOM/CSS var writes (`--wm-seam`, `data-peek-zone`, per-layer background-image) in HomeCarousel.astro | low | accept | Only writes CSS custom properties / an attribute already conceptually mirrored from the existing `--peek-shift`/`--wordmark-bg-position` writes; no attacker-influenceable input, no new data flow. Covered by the FR+EN e2e regression tests and the pure-function unit tests. |
| T-iao-02 | Information Disclosure | aria-hidden duplicate wordmark text for the peek copies | low | accept | The two peek copies are `aria-hidden="true"` non-heading elements; exactly one `<h1>` retains the accessible text, so no duplicate/altered content reaches assistive tech. Enforced by keeping the distinct `home-hero__wordmark-peek` token and verified by the retained single-match `.home-hero__wordmark` locators. |
</threat_model>

<verification>
- Unit: `npx vitest run tests/unit/home-carousel.test.ts` — new computeWordmarkSeamFraction cases + all pre-existing pure-function cases green; computeWordmarkBackgroundPosition byte-unchanged.
- Typecheck: `npm run typecheck` (astro check) clean.
- E2E: full `tests/e2e/homepage.spec.ts` (chromium + webkit-mobile) plus `tests/e2e/critical.smoke.spec.ts` green — including the untouched photo-peek / cursor / is-tracking / keyboard paths and the still-single-match `.home-hero__wordmark` solid-ink-readable smoke test.
- Known-unrelated: `tests/unit/dashboard-logic.test.ts` fails on a pre-existing missing `@sanity/icons` in the Studio subproject (documented in prior SUMMARYs) — not in scope, do not fix. Prefer the targeted `npx vitest run tests/unit/home-carousel.test.ts` over a full `npm run test:unit`.
- Environment: this runs in a git worktree; per prior quick-task SUMMARYs the worktree has no `.env` and port 4321 may be occupied — copy the root `.env` in and run an isolated-port `astro preview` + throwaway Playwright config (delete before finishing, never commit) to exercise real Sanity content.
- Orchestrator will independently re-verify before merge: diff review, typecheck, unit, build, isolated-port e2e, and extensive live Playwright MCP verification — screenshots at multiple proximity values during hover, frame-by-frame screenshots through a full commit, and numeric checks of the seam formula against live computed rects at known proximities.
</verification>

<success_criteria>
The wordmark cutout is a true mirrored peek: through both the hover-peek and the click-commit slide, its photo-cutout splits at a live seam that tracks the actual photo's edge, showing the current gallery on one side and the incoming gallery on the other — sliding in the same direction, at the same time, as the carousel photo, all the way from 0% to 100% commit — with no frozen-clamp and no solid-ink beat at any point. quick-260727-drq's clamp-hold framing and quick-260727-g04's solid-ink-during-commit are removed and replaced. Exactly one accessible `<h1>` is preserved; the mechanism is inert (current-only) on touch, under reduced motion, and pre-JS. Pure seam math is unit-tested; behavior is covered by rewritten/added FR+EN e2e; the full suite and typecheck are green.
</success_criteria>

<output>
Create `.planning/quick/260727-iao-replace-wordmark-clamp-solid-ink-fallbac/260727-iao-SUMMARY.md` when done.
</output>
