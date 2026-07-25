---
phase: quick-260725-pit
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/HomeCarousel.astro
  - tests/e2e/homepage.spec.ts
autonomous: true
requirements: [QUICK-260725-pit]
must_haves:
  truths:
    - "In carousel mode there is NO visible scroll-to-open hint anymore — no label, no chevron, no underline; the gesture is silent/implicit."
    - "Scrolling down while already at the bottom of the page in carousel mode opens the currently-shown collection after a LIGHT threshold (a single normal scroll gesture), not a sustained ~600px push."
    - "A small scroll near the top of the page (not yet at the bottom) still does NOT navigate — the at-bottom gate is preserved."
    - "Normal scrolling is never blocked (no preventDefault on wheel/touch), so the footer stays reachable in grid mode as before."
    - "Grid mode is completely unaffected; the progress-dash fill (dcg Fix 3) and footer-hide (dcg Fix 1) are untouched."
    - "Both FR and EN homepages keep working — no locale-derived string remains for the removed hint."
  artifacts:
    - "src/components/HomeCarousel.astro — hint markup/CSS/keyframes/reduced-motion rule/grid-mode rule/locale const removed; updateHintVisibility()/scrollHintEl removed; OPEN_OVERSCROLL_THRESHOLD lowered 600 -> 150."
    - "tests/e2e/homepage.spec.ts — hint-specific tests removed; a no-hint-element test added; a light-threshold-navigates test and an at-top-does-not-navigate test added; grid-mode + reduced-motion tests kept (hint references stripped)."
  key_links:
    - "The overscroll accumulator (registerDownwardIntent -> navigateToCurrent -> titleEl.click()) is unchanged EXCEPT for the lowered threshold — it still reuses the title link's live href and its cross-document morph."
    - "The generic window 'scroll' listener KEEPS its overscrollAccum reset (the quick-260725-cfm verification fix); only its updateHintVisibility() call is removed."
---

<objective>
Simplify the carousel scroll-to-open gesture shipped in quick-260725-cfm/dcg, based on direct live-testing feedback ("the long scrolling is quite strange"; the floating "keep scrolling to open" hint is disliked). Two changes, both entirely inside `src/components/HomeCarousel.astro` plus its e2e spec:

1. **Remove the "keep scrolling to open" hint entirely** — the whole visual element (label + chevron + underline), its CSS, keyframes, reduced-motion + grid-mode rules, the locale-derived label const, and the script wiring that exists solely to drive it (`scrollHintEl`, `updateHintVisibility()` and its call sites). The interaction becomes silent/implicit.

2. **Remove the "long scrolling" effect** — keep the overscroll-accumulator mechanism (so trackpad + mouse-wheel both work and the at-bottom safety gate stays), but lower `OPEN_OVERSCROLL_THRESHOLD` from `600` to a light, deliberate-but-quick value so navigation feels close to immediate once the visitor is at the bottom and keeps scrolling — rather than requiring a sustained extra push.

Purpose: make the gesture feel quick and unobtrusive per live feedback, without regressing the safety properties (never blocks scrolling, only fires once already at the bottom).

Output: an updated `HomeCarousel.astro` (markup + CSS + script) and an updated `homepage.spec.ts` describe block.
</objective>

<execution_context>
@/home/user/ajs-website/.claude/gsd-core/workflows/execute-plan.md
@/home/user/ajs-website/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@src/components/HomeCarousel.astro
@tests/e2e/homepage.spec.ts

# The features this task simplifies (read for exact current state, NOT to re-derive):
@.planning/quick/260725-cfm-in-carousel-mode-on-the-homepage-homecar/260725-cfm-SUMMARY.md
@.planning/quick/260725-dcg-three-follow-up-fixes-from-live-testing-/260725-dcg-SUMMARY.md
</context>

<investigation_findings>
Confirmed by reading the ACTUAL current `HomeCarousel.astro` and `homepage.spec.ts` on 2026-07-25 (line numbers are current-as-of-read anchors — re-confirm by identifier before editing, the file has been modified 3× this session):

**Hint pieces to remove (change 1):**
- **Frontmatter const** (~lines 87-91): the `scrollOpenHintLabel` const (`isEn ? 'Keep scrolling to open' : 'Continuer à scroller pour ouvrir'`) plus its 3-line `// quick-260725-cfm:` comment. Nothing else uses it.
- **Markup** (~lines 291-311): the `{/* quick-260725-cfm: ... */}` comment block AND the `<div class="home-scroll-open-hint" data-role="scroll-open-hint" ...>` element (label span + chevron `<svg>` with `<polyline>`). It sits between the `.home-grid` block and the `<ul ... data-role="home-carousel-data">` data node.
- **CSS** (~lines 2116-2195, inside the scoped `<style>`): the whole `/* quick-260725-cfm: ... */` comment, the `.home-scroll-open-hint` base rule, `.home-scroll-open-hint__label`, `.home-scroll-open-hint__icon`, the `@keyframes home-scroll-hint-bounce` (and its preceding comment), the `@media (prefers-reduced-motion: reduce) { .home-scroll-open-hint { animation: none; } }` rule, and the `.home[data-display-mode='grid'] .home-scroll-open-hint { display: none; }` rule. Deleting this block leaves the blank line before `</style>` clean.
- **Script — hint-only pieces:**
  - `const scrollHintEl = root.querySelector<HTMLElement>('[data-role="scroll-open-hint"]');` (~line 784).
  - The entire `function updateHintVisibility() { ... }` (~lines 790-803) and its `// quick-260725-dcg (Fix 2):` comment.
  - Every CALL to `updateHintVisibility()`: in `showCarousel()` (~666), in `showGrid()` (~678), in `navigateToCurrent()` (~811), in `registerDownwardIntent()`'s upward-delta branch (~829) and not-at-bottom branch (~835) and pre-threshold line (~848), in the generic `scroll` listener (~869), and the init call at the end of the IIFE (~1027, plus its `// quick-260725-dcg (Fix 2):` comment).

**Overscroll accumulator to KEEP (with one number changed — change 2):**
- Constants (~lines 778-782): `OPEN_OVERSCROLL_THRESHOLD = 600`, `BOTTOM_EPSILON = 4`, `RESET_IDLE_MS = 800`, `overscrollAccum`, `lastOverscrollTs`, `navigating`.
- `atBottom()` (~786-788), `navigateToCurrent()` (~808-818), `registerDownwardIntent()` (~823-852), the `wheel` listener (~873-875), and the mobile `touchstart`/`touchmove` accumulator (~885-901) all STAY — they are the mechanism, not the hint.
- **The generic `window.addEventListener('scroll', ...)` (~865-870) is NOT hint-only.** It does two things: resets `overscrollAccum` when `!atBottom()` (the quick-260725-cfm independent-verification fix, per STATE.md / the cfm SUMMARY — resets stale accumulation after leaving the bottom via keyboard/scrollbar/scrollTo, which fire no wheel/touch event), AND calls `updateHintVisibility()`. KEEP the listener and its accumulator reset; remove ONLY the `updateHintVisibility()` call.

**Threshold decision (change 2) — value and justification:**
- New value: **`OPEN_OVERSCROLL_THRESHOLD = 150`** (down from 600).
- Keep the accumulator (do NOT switch to "fire on first single delta"): trackpad scrolling emits many tiny deltas (a few px each), so a per-event single-delta floor would never fire for trackpad users; the accumulator sums mouse-wheel notches AND trackpad deltas uniformly.
- 150px sits just above a single mouse-wheel notch (~100-120px in Chrome, deltaMode pixels), so a stray single tick can't misfire, but a second notch — or a continuous trackpad swipe, which crosses 150px within a fraction of a second — fires near-instantly. It is 4× lighter than the disliked 600px sustained push.
- Keep `RESET_IDLE_MS = 800`: a genuine continuous gesture never pauses 800ms mid-scroll, so it is unaffected, but a stale single tick decays and cannot combine with a much-later unrelated tick — preserving the "deliberate, not accidental" guarantee.
- **This is a TUNABLE value.** Note in the SUMMARY that the user may want it adjusted after trying it live (raise toward ~200 if it ever misfires; lower toward ~100 if it feels sluggish).

**Tests to change (`homepage.spec.ts`, describe block `carousel scroll-to-open (quick-260725-cfm)`, ~lines 1152-1286):**
- REMOVE (hint no longer exists): "FR: the hint is visible at rest ... hidden in grid mode" (~1158), "the hint never overlaps .home-hero__accent or .home-hero__caption" (~1181), "FR: the hint fades toward 0 as scrollY increases" (~1204), "EN: the hint label reads ..." (~1224).
- KEEP but strip hint references + lighten the wheel input: "grid mode: ... overscrolling never navigates" (~1249, remove the two `toBeHidden` hint assertions) and "reduced motion ... scroll-to-open navigation still works" (~1266, remove the `animationName === 'none'` hint-bounce assertion).
- The `carousel progress fill (quick-260725-dcg)` describe block (starts ~1288) is OUT OF SCOPE — do NOT touch it.

**Cross-file check:** grep confirms `scroll-open-hint` / `home-scroll-open` / `home-scroll-hint-bounce` appear ONLY in `HomeCarousel.astro` and `homepage.spec.ts`. `DetailHero.astro` has its own separate `.detail-hero__scroll-hint` — do NOT touch it. The homepage twins `src/pages/index.astro` / `src/pages/en/index.astro` need no edits (no locale string is threaded — the removed label was derived internally).
</investigation_findings>

<tasks>

<task type="auto">
  <name>Task 1: Remove the scroll-to-open hint and lighten the overscroll threshold in HomeCarousel.astro</name>
  <files>src/components/HomeCarousel.astro</files>
  <action>
Make BOTH changes to `src/components/HomeCarousel.astro` (confirm each anchor by identifier before editing — do not trust stale line numbers).

CHANGE 1 — remove the hint entirely:
1. Delete the `scrollOpenHintLabel` const and its `// quick-260725-cfm:` comment from the frontmatter (~87-91).
2. Delete the hint markup: the `{/* quick-260725-cfm: ... */}` comment block and the entire `<div class="home-scroll-open-hint" data-role="scroll-open-hint" aria-hidden="true">...</div>` element (label span + chevron svg + polyline) that sits between `.home-grid` and the `<ul ... data-role="home-carousel-data">` node (~291-311).
3. Delete the hint CSS block from the scoped `<style>` (~2116-2195): the `/* quick-260725-cfm: ... */` comment, `.home-scroll-open-hint`, `.home-scroll-open-hint__label`, `.home-scroll-open-hint__icon`, the `@keyframes home-scroll-hint-bounce` and its comment, the reduced-motion `animation: none` rule for the hint, and the grid-mode `display: none` rule for the hint. Leave the surrounding rules and the closing `</style>` intact.
4. Delete the `scrollHintEl` const (~784) and the whole `updateHintVisibility()` function with its comment (~790-803).
5. Remove EVERY call to `updateHintVisibility()`: in `showCarousel()`, in `showGrid()` (keep the `overscrollAccum = 0;` line and update its comment to drop the "hides the hint" phrasing), in `navigateToCurrent()` (keep `navigating = true;`), in `registerDownwardIntent()`'s upward-delta branch (keep `overscrollAccum = 0;`), its not-at-bottom branch (this branch becomes a bare `if (!atBottom()) { return; }` guard — keep it), and its pre-threshold line, in the generic `scroll` listener (see next step), and the init call at the end of the IIFE with its comment (~1024-1027).

CHANGE 1 (cont.) — the generic `scroll` listener is NOT hint-only: KEEP `window.addEventListener('scroll', ...)` and its `if (!atBottom()) { overscrollAccum = 0; }` body (this is the quick-260725-cfm verification fix that resets stale accumulation after leaving the bottom via non-wheel/non-touch paths). Remove ONLY its `updateHintVisibility()` call, and update its comment to describe just the accumulator reset (drop all hint wording).

CHANGE 2 — lighten the threshold:
6. Change `const OPEN_OVERSCROLL_THRESHOLD = 600;` to `const OPEN_OVERSCROLL_THRESHOLD = 150;`. Update the surrounding comment (the `// quick-260725-cfm (D1/D2/D3/D6/D7):` block) to note this is the simplified quick-260725-pit behavior: light 150px threshold, no visible hint, gesture is silent/implicit, and that 150 is a deliberate-but-quick tunable value (~1.5 mouse-wheel notches) chosen to avoid stray-single-tick misfires while feeling near-immediate. Leave `BOTTOM_EPSILON`, `RESET_IDLE_MS`, `atBottom()`, `navigateToCurrent()`, the rest of `registerDownwardIntent()`, the `wheel` listener, and the mobile `touchstart`/`touchmove` accumulator functionally unchanged.

Do NOT touch: the footer-hide `is:global` rule (dcg Fix 1), the progress-dash `.is-filling` fill logic/CSS (dcg Fix 3), grid-mode behavior, the horizontal-swipe handlers on `.home-hero__photo`, or any View Transitions code. After editing, no reference to `updateHintVisibility` or `scrollHintEl` may remain (astro check will fail on any dangling reference).
  </action>
  <verify>
    <automated>cd /Users/florian/Projects/ajs-website && npx astro check 2>&1 | tail -5</automated>
  </verify>
  <done>`npx astro check` passes with no errors (proves no dangling `updateHintVisibility`/`scrollHintEl` references). `OPEN_OVERSCROLL_THRESHOLD` is `150`. The hint markup, CSS, keyframes, reduced-motion/grid-mode hint rules, the locale const, `scrollHintEl`, and `updateHintVisibility()` are all gone. The overscroll accumulator, the `scroll`-listener accumulator reset, the wheel/touch listeners, and all untouched features (footer-hide, progress-fill, swipe, View Transitions) remain intact.</done>
</task>

<task type="auto">
  <name>Task 2: Update the scroll-to-open e2e tests in homepage.spec.ts</name>
  <files>tests/e2e/homepage.spec.ts</files>
  <action>
Rewrite the `carousel scroll-to-open (quick-260725-cfm)` describe block (~1152-1286) to match the simplified behavior. Rename the describe title to `carousel scroll-to-open (quick-260725-cfm, simplified quick-260725-pit)` — KEEP the substring "scroll-to-open" in the title so `-g "scroll-to-open"` still selects it. Update the block's leading comment to describe the new proofs.

REMOVE these now-obsolete hint tests (the hint element no longer exists): "FR: the hint is visible at rest ...", "the hint never overlaps .home-hero__accent or .home-hero__caption", "FR: the hint fades toward 0 as scrollY increases", and "EN: the hint label reads ...".

ADD a test proving NO hint element renders at all: on both `/` and `/en/`, assert `page.locator('[data-role="scroll-open-hint"]')` and `page.locator('.home-scroll-open-hint')` each have count 0 (in carousel mode; optionally also after switching to grid via the Grille/Grid button).

UPDATE the threshold-navigation test to prove the LIGHTER threshold: pin the current slide (click `[data-role="autoplay-toggle"]`), read the `[data-role="gallery-title"]` href, `scrollTo(0, document.body.scrollHeight)`, then dispatch a SMALL wheel input `page.mouse.wheel(0, 200)` (past the new 150 threshold but far below the old 600 — this both proves the new light trigger and that it reuses the title-link href), then `waitForURL` the href and assert `page.url()` contains it. Name it something like "a light scroll past the bottom opens the currently-shown collection, reusing the title link's href".

ADD a test proving the at-bottom gate still holds — a small scroll near the TOP does NOT navigate: `page.goto('/')`, inject a tall spacer (append a `div` with `style.height = '2000px'` to `document.body`, the established pattern in this file) so the page has real scroll room and is NOT at the bottom, leave scroll at the top, dispatch `page.mouse.wheel(0, 300)` (past the 150 threshold — proving it's gated on being at the bottom, not just on delta size), `waitForTimeout(300)` to settle, then assert `page.url()` still matches `/\/$/` (still the homepage, no navigation).

KEEP the grid-mode test ("grid mode: ... overscrolling never navigates") but remove its two `hint`/`toBeHidden` assertions — keep the `scrollTo(bottom)` + `page.mouse.wheel(0, 1200)` + settle + `expect(page.url()).toMatch(/\/$/)` no-navigation proof.

KEEP the reduced-motion test ("reduced motion ... scroll-to-open navigation still works") but remove the hint-bounce `animationName === 'none'` assertion (the hint is gone). Keep the rest: `emulateMedia({ reducedMotion: 'reduce' })`, read href, `scrollTo(bottom)`, dispatch `page.mouse.wheel(0, 200)` (updated from 700 to the new light value), `waitForURL(href)` + url assertion.

Do NOT touch the `carousel progress fill (quick-260725-dcg)` describe block that follows.
  </action>
  <verify>
    <automated>cd /Users/florian/Projects/ajs-website && npx playwright test tests/e2e/homepage.spec.ts -g "scroll-to-open" 2>&1 | tail -20</automated>
  </verify>
  <done>All tests in the `scroll-to-open` describe block pass. Coverage includes: no hint element renders on FR + EN; a light `wheel(0, 200)` at the bottom navigates to the current collection's href; a `wheel(0, 300)` near the top (with a spacer, not at bottom) does NOT navigate; grid mode never navigates; reduced motion still navigates. The `quick-260725-dcg` progress-fill block is untouched and still passes.</done>
</task>

</tasks>

<verification>
Overall phase checks:
- `npx astro check` is clean (no dangling references from the hint removal).
- `npx playwright test tests/e2e/homepage.spec.ts -g "scroll-to-open"` passes (all rewritten/added tests green).
- Recommended full-suite guard before ship: `npm run test:e2e` (real Sanity credentials required) — confirms the removals did not regress the untouched footer-hide, progress-fill, HOME-06 full-bleed, or grid-mode tests.
- Non-blocking human spot-check (both `/` and `/en/`): confirm no floating hint appears; at the bottom of the hero a single normal downward scroll opens the current collection (cross-document morph intact); a scroll near the top does not navigate; grid mode still browses normally and the footer is reachable there. If the 150px threshold misfires or feels sluggish live, it is a one-line tunable (`OPEN_OVERSCROLL_THRESHOLD`).
</verification>

<success_criteria>
- The visible "keep scrolling to open" hint (label + chevron + underline) is gone from markup, CSS, and script — no locale string, `scrollHintEl`, or `updateHintVisibility()` remains.
- `OPEN_OVERSCROLL_THRESHOLD` is `150`; the overscroll accumulator, at-bottom gate, no-preventDefault guarantee, and the `scroll`-listener accumulator reset are preserved.
- e2e proves: no hint element (FR + EN), light-scroll-at-bottom navigates, small-scroll-at-top does not navigate, grid-mode unaffected, reduced-motion still navigates.
- Footer-hide (dcg Fix 1), progress-dash fill (dcg Fix 3), grid mode, and DetailHero.astro are untouched. Both FR and EN homepages work.
</success_criteria>

<output>
Create `.planning/quick/260725-pit-simplify-the-carousel-scroll-to-open-ges/260725-pit-SUMMARY.md` when done. In the SUMMARY, explicitly record the chosen `OPEN_OVERSCROLL_THRESHOLD = 150` value, the reasoning (light single-gesture trigger, accumulator kept for trackpad+wheel parity, ~1.5 wheel notches to avoid stray-tick misfires), and that it is a TUNABLE the user may want adjusted after live testing.
</output>
