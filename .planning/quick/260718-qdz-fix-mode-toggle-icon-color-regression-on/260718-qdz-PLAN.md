---
phase: quick-260718-qdz
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/HomeCarousel.astro
  - tests/e2e/homepage.spec.ts
autonomous: true
requirements:
  - HOME-10-REGRESSION
must_haves:
  truths:
    - "Carousel mode (homepage default first-load): the mode-toggle renders white (rgb(255,255,255)) — box border and morph-icon cells — matching the nav-link and language-switcher treatment."
    - "Grid mode: the mode-toggle renders ink (rgb(26,26,26)) — unchanged from its current correct behavior, no regression."
    - "An e2e regression guard asserts both mode colors, so a future header refactor cannot silently drop the carousel override again (the gap that let this ship through Phase 10)."
  artifacts:
    - "src/components/HomeCarousel.astro — two mode-scoped .home-toggle color overrides"
    - "tests/e2e/homepage.spec.ts — new mode-toggle color regression assertions"
  key_links:
    - ".home-toggle color cascades to .home-toggle__box (border: currentColor) and .home-toggle__morph-cell (background-color: currentColor) — one color source paints the whole control, mirroring the old .home-header container rule."
---

<objective>
Fix the mode-toggle icon color regression on the homepage. In carousel mode (the default first-load state) the carousel/grid display-mode toggle (`.home-toggle` / `.home-toggle__box` in src/components/HomeCarousel.astro) currently renders black; it must render white to match the nav-link and language-switcher treatment. Grid mode already renders black correctly (via inheritance) and must not regress.

Root cause is already fully diagnosed (do not re-derive): Phase 10's SiteHeader refactor (commits d0b2772/3850e1d) retired the old `.home-header` container that set `color` at the container level per display mode, and replaced it with narrower per-element overrides for `.nav-link` and `.switcher-link` only. No equivalent override was added for `.home-toggle`, so it now falls back to inheriting `body { color: var(--color-ink); }` in all modes.

The fix mirrors the existing `.switcher-link` per-mode pattern (HomeCarousel.astro lines 776-782): set `color` on `.home-toggle` to `#FFFFFF` in carousel mode and `var(--color-ink)` in grid mode. Setting `color` on `.home-toggle` cascades through `currentColor` to both `.home-toggle__box`'s border and the `.home-toggle__morph-cell` icon fills — restoring the single-color-source behavior the removed `.home-header` container used to provide.

Purpose: Restore visual consistency of the header controls in carousel mode and add the regression guard that was missing when this shipped unnoticed through Phase 10's full test suite.
Output: Two mode-scoped CSS rules in HomeCarousel.astro; a new e2e regression describe block in homepage.spec.ts; a clean build + full test run.
</objective>

<execution_context>
@/home/user/ajs-website/.claude/gsd-core/workflows/execute-plan.md
@/home/user/ajs-website/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@src/components/HomeCarousel.astro
@src/components/SiteHeader.astro
@tests/e2e/homepage.spec.ts

# Confirmed token values (src/layouts/BaseLayout.astro):
#   --color-ink = --gray-900 = #1A1A1A = rgb(26, 26, 26)   (grid mode target, already correct)
#   --color-dominant = --gray-0 = #FFFFFF = rgb(255, 255, 255)  (carousel mode target)
# Toggle DOM (HomeCarousel.astro ~lines 125-141):
#   button.home-toggle[data-role="mode-toggle"] > span.home-toggle__box > span.home-toggle__morph > 6x span.home-toggle__morph-cell
#   .home-toggle__box border uses `currentColor`; each .home-toggle__morph-cell paints via `background-color: currentColor`.
# Mode state lives on the .home root: .home[data-display-mode='carousel'|'grid'].
# Grid switch in tests: page.getByRole('button', { name: 'Grille' }).click(); carousel is the default on '/'.
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add carousel/grid color overrides for .home-toggle and a matching e2e regression guard</name>
  <files>src/components/HomeCarousel.astro, tests/e2e/homepage.spec.ts</files>
  <behavior>
    - Carousel mode (default on '/'): getComputedStyle(.home-toggle__box).color === 'rgb(255, 255, 255)' (white). Fails BEFORE the CSS fix (currently rgb(26, 26, 26)).
    - Carousel mode: getComputedStyle(.home-toggle__morph-cell first).backgroundColor === 'rgb(255, 255, 255)' — the visible glyph is white.
    - Grid mode (after clicking the 'Grille' button): getComputedStyle(.home-toggle__box).color === 'rgb(26, 26, 26)' (ink) — must stay correct, no regression.
    - Grid mode: getComputedStyle(.home-toggle__morph-cell first).backgroundColor === 'rgb(26, 26, 26)'.
  </behavior>
  <action>
    Write the e2e assertions FIRST (RED), then apply the CSS fix (GREEN).

    (1) In tests/e2e/homepage.spec.ts, add a new `test.describe` block titled for the mode-toggle color regression, placed immediately after the existing `square mode-toggle box (HOME-05)` describe block (which ends around line 509). Add two tests. Test one (carousel): `await page.goto('/')`, then assert the toggle color is white in the default carousel state. Use `expect.poll` reading `getComputedStyle` inside `page.evaluate` on `.home-toggle__box` for its `color` and on the first `.home-toggle__morph-cell` for its `backgroundColor`, both expected to equal `rgb(255, 255, 255)`. Test two (grid): `await page.goto('/')`, then `await page.getByRole('button', { name: 'Grille' }).click()`, then assert `.home-toggle__box` `color` and the first `.home-toggle__morph-cell` `backgroundColor` both equal `rgb(26, 26, 26)`. Use `expect.poll(...).toBe(...)` for every color read so the grid-mode view-transition settle does not cause flake. Reference the diagnosed values in a short comment (Phase 10 SiteHeader refactor dropped the carousel white override for .home-toggle) so the test documents why it exists. Do not add any fenced code — write standard Playwright test statements. Do not assert on `.home-toggle` (the button) directly; assert on the visible `.home-toggle__box` and `.home-toggle__morph-cell` — those are the user-visible elements and the ones the diagnosis measured.

    (2) In src/components/HomeCarousel.astro, add two mode-scoped rules that set `color` on `.home-toggle`, mirroring the existing `.switcher-link` per-mode overrides at lines 776-782. Place them immediately after the `.home-toggle` base rule block (the block that ends with `min-height: var(--tap-target-min);` and its closing brace, around line 806), before the `.home-toggle__box` comment/rule. Rule one selector `.home[data-display-mode='carousel'] .home-toggle` with declaration `color: #FFFFFF;`. Rule two selector `.home[data-display-mode='grid'] .home-toggle` with declaration `color: var(--color-ink);`. Add a brief comment explaining these restore the per-mode color the removed `.home-header` container used to provide, cascading to `.home-toggle__box`'s border and the morph cells via `currentColor`. Do NOT change the `.home-toggle { color: inherit; }` base rule, the `.home-toggle__box` rule, the hover rules, or any `.switcher-link` rule. Use plain (non-`:global`) scoped selectors — the existing `.home[data-display-mode='...'] .home-toggle__morph` rules confirm the toggle markup carries this component's scope. The mode-scoped selectors (specificity 0,3,0) outrank the base `.home-toggle` rule (0,1,0) regardless of source order.
  </action>
  <verify>
    <automated>npx playwright test tests/e2e/homepage.spec.ts -g "mode-toggle" --reporter=line</automated>
  </verify>
  <done>The new carousel test asserts white (rgb(255, 255, 255)) for `.home-toggle__box` color and the first `.home-toggle__morph-cell` background; the new grid test asserts ink (rgb(26, 26, 26)) for both; both pass after the CSS fix and the carousel test provably fails without it. No other homepage tests change behavior.</done>
</task>

<task type="auto">
  <name>Task 2: Full-suite regression verification (build + e2e + unit)</name>
  <files>src/components/HomeCarousel.astro, tests/e2e/homepage.spec.ts</files>
  <action>
    Run the full verification sweep to confirm the fix introduces no regressions: `npm run build`, then `npm run test:e2e`, then `npm run test:unit`. All three must complete cleanly. If any pre-existing test fails, confirm whether it is caused by this change (a genuine regression to fix here) or a pre-existing unrelated failure (record it, do not attempt to fix unrelated failures in this quick task). Do not modify test expectations to make them pass unless the expectation itself was invalidated by the correct color fix.
  </action>
  <verify>
    <automated>npm run build && npm run test:e2e && npm run test:unit</automated>
  </verify>
  <done>`npm run build` succeeds; `npm run test:e2e` passes (including the two new mode-toggle color tests and all pre-existing homepage tests — grid mode still renders ink, no regression); `npm run test:unit` passes.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| (none new) | This change is presentational CSS plus a test. No untrusted input, no new data flow, no network, no packages, no runtime code paths added. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-qdz-01 | Tampering | Static CSS color override in HomeCarousel.astro | low | accept | Build-time-only presentational change; no new attack surface, no user input, no dependencies added. Nothing to mitigate. |
</threat_model>

<verification>
- Carousel mode (homepage default): `.home-toggle__box` computed `color` is `rgb(255, 255, 255)` and the visible morph-cell glyph paints white.
- Grid mode: `.home-toggle__box` computed `color` is `rgb(26, 26, 26)` (ink) — unchanged, no regression.
- `npm run build`, `npm run test:e2e`, and `npm run test:unit` all pass.
- No changes to `.nav-link`, `.switcher-link`, hover rules, or the `.home-toggle` base `color: inherit` rule beyond the two new mode-scoped overrides.
</verification>

<success_criteria>
- The mode-toggle icon renders white in carousel mode and ink in grid mode, matching the nav-link/language-switcher treatment.
- A committed e2e regression guard asserts both mode colors and would fail if the carousel override is removed again.
- Full build + e2e + unit suites are green.
</success_criteria>

<output>
Create `.planning/quick/260718-qdz-fix-mode-toggle-icon-color-regression-on/260718-qdz-SUMMARY.md` when done.
</output>
