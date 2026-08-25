---
phase: quick-260825-jvm
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/layouts/BaseLayout.astro
  - tests/e2e/homepage-phone-canvas-scope.spec.ts
autonomous: true
requirements: [BUG-01]

must_haves:
  truths:
    - "At desktop widths (>=768px) the homepage `<main>` element paints the page's normal dominant/white background, in BOTH carousel mode and grid mode."
    - "The desktop `<main>` background never resolves to the phone-canvas colour, nor to any per-gallery hero accent colour present on the page."
    - "The invariant holds for any gallery count — no assertion depends on there being 7 tiles, or on the tile count being a multiple of 3."
    - "At phone widths (<=767px) `<main>` still paints the phone-canvas colour exactly as before, so iOS rubber-banding shows no white/black flash."
    - "The phone-canvas colour value, the `has-phone-canvas` class application, and the `--phone-canvas-color` custom property assignment are all byte-for-byte unchanged."
  artifacts:
    - src/layouts/BaseLayout.astro                          # the `body.has-phone-canvas main` rule, now viewport-gated
    - tests/e2e/homepage-phone-canvas-scope.spec.ts         # desktop/phone regression coverage for the leak
  key_links:
    - "src/layouts/BaseLayout.astro head `<style is:inline set:html>` (max-width: 767px) <-> the `body.has-phone-canvas main` rule in the main `<style>` block — these two mechanisms colour the SAME concept (phone canvas) and must agree on the SAME breakpoint. Divergence between them IS the bug."
    - "src/components/HomePage.astro:53 `phoneCanvasColor={model.galleries[0]?.heroColor ?? '#A6FD29'}` -> BaseLayout `--phone-canvas-color` -> the gated rule. This chain stays intact; only the rule's viewport scope changes."
---

<objective>
Fix a live desktop rendering bug: on the homepage in grid mode, empty grid cells expose a large solid lime-green rectangle instead of the page's normal white background.

The cause is a single CSS rule in `src/layouts/BaseLayout.astro` (`body.has-phone-canvas main { background: var(--phone-canvas-color); }`) that has no `@media` gate, so it applies at every viewport width — while its sibling mechanism for the identical concept (the head `<style is:inline set:html>` block) is correctly gated to `max-width: 767px`. The comment above the neighbouring `@media (min-width: 768px)` rule already states the intent explicitly: homepage accents belong inside the artwork, never above or below the page, and phone-only full-bleed routes keep their canvas colour through the max-width rule in head.

Purpose: restore the neutral desktop canvas the design intent already documents, and lock it with coverage so a future gallery-count change (any count where tiles do not fill complete rows) cannot resurface it.
Output: one viewport-gated CSS rule plus a content-agnostic Playwright regression spec.
</objective>

<execution_context>
@/Users/florian/Projects/ajs-website/.claude/gsd-core/workflows/execute-plan.md
@/Users/florian/Projects/ajs-website/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@CLAUDE.md

@src/layouts/BaseLayout.astro
@src/components/HomePage.astro
@tests/e2e/homepage-accent-random.spec.ts
@tests/e2e/homepage-content-display.spec.ts
</context>

<pre_read_findings>
Discovery already performed during planning — do NOT re-investigate these, they are settled:

- `src/layouts/BaseLayout.astro:189-194` — head `<style is:inline set:html>` gated to `@media (max-width: 767px)`, colouring `html, body`. Correct. Out of scope.
- `src/layouts/BaseLayout.astro:412-420` — comment stating the design intent, followed by `@media (min-width: 768px) { html { background-color: var(--color-dominant); } }`. Correct. Out of scope.
- `src/layouts/BaseLayout.astro:422-427` — the comment "Must live in the base stylesheet ... before iOS Safari takes the under-page snapshot" followed by the UNGATED `body.has-phone-canvas main` rule. THIS is the only thing that changes.
- `src/layouts/BaseLayout.astro:252-254` — `has-phone-canvas` class + `--phone-canvas-color` applied to `<body>` unconditionally at all widths. Correct as-is; only the consuming rule needs the gate.
- `src/layouts/BaseLayout.astro:568-571` — `main { background-color: var(--color-dominant); transition: background-color 0.35s ease; }`. This is what the ungated rule was overriding on desktop.
- `src/layouts/BaseLayout.astro:321` — `--color-dominant: var(--gray-0)`.
- `src/components/HomePage.astro:53` — `phoneCanvasColor={model.galleries[0]?.heroColor ?? '#A6FD29'}`. Read-only, not in scope.
- `src/components/MobileHomePrototype.astro` — grep for `phone-canvas` / `phoneCanvasColor` across `src/` returns NO hit in this file. The mobile prototype has zero dependency on the rule applying beyond 767px. The fix is safe for it.
- `tests/e2e/` and `tests/unit/` — grep for `phone-canvas` / `phoneCanvasColor` returns NO hits anywhere. There is no existing coverage asserting the current buggy behaviour, so nothing needs updating alongside the fix; the new spec is purely additive.
- Grid mode is entered from the FR homepage by clicking the button named `Grille` (established in `tests/e2e/homepage-content-display.spec.ts:20`).
- Per-gallery accents are exposed in the DOM as `data-hero-color` on `ul[data-role="home-carousel-data"] li` (pattern established in `tests/e2e/homepage-accent-random.spec.ts`). Repo convention is to read expected colours off the page's own data attributes rather than hardcoding hex literals or importing from `src/` — no e2e spec imports from `src/`. Follow that convention.
- Playwright projects: `chromium` (Desktop Chrome, runs every spec) and `webkit-mobile` (iPhone 15 Pro, `testMatch: '**/*.smoke.spec.ts'` only). Both viewport cases below belong in one non-smoke spec owned by `chromium`, driven with `page.setViewportSize` — do NOT add this to the smoke suite.
</pre_read_findings>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Gate the phone-canvas main rule to phone widths and lock it with a regression spec</name>
  <files>src/layouts/BaseLayout.astro, tests/e2e/homepage-phone-canvas-scope.spec.ts</files>

  <behavior>
    Write `tests/e2e/homepage-phone-canvas-scope.spec.ts` FIRST and confirm it fails against the current unfixed CSS, then apply the one-rule change and confirm it passes.

    Shared in-page helper (define once at the top of the spec): a function that normalizes any CSS colour string or custom-property value to a computed `rgb(...)` string, by creating a detached-but-attached throwaway element, assigning the value as its `background-color`, reading `getComputedStyle(el).backgroundColor`, and removing it. This lets a hex custom property be compared against a computed background colour without hand-rolling hex-to-rgb maths.

    - Test 1 (desktop, carousel mode): default Desktop Chrome viewport, `goto('/')`. Read the resolved `--phone-canvas-color` off `<body>`; `test.skip` if it is empty. Assert `getComputedStyle(main).backgroundColor` EQUALS the normalized resolved `--color-dominant` read off `main` itself, and does NOT equal the normalized `--phone-canvas-color`.
    - Test 2 (desktop, grid mode): default Desktop Chrome viewport, `goto('/')`, click the button named `Grille`, wait for the grid container `[data-role="home-grid"]` to be visible. Assert the same two things as Test 1. Additionally collect every non-empty `data-hero-color` from `ul[data-role="home-carousel-data"] li`, normalize each, and assert `main`'s computed background matches NONE of them — the general invariant. Do NOT assert a tile count, a gallery count, or row parity; do NOT hardcode any hex literal.
    - Test 3 (phone width, behaviour unchanged): call `page.setViewportSize({ width: 390, height: 844 })` BEFORE `goto('/')` so the correct homepage runtime mounts for that width. Assert `getComputedStyle(main).backgroundColor` EQUALS the normalized `--phone-canvas-color` — proving the fix narrowed the rule's scope rather than removing its effect.

    Head the spec with a short comment naming this quick task (`260825-jvm`) and stating the invariant in one sentence: the phone-canvas colour is phone-only, `main` stays neutral on desktop in every display mode.
  </behavior>

  <action>
    Step 1 (RED): create `tests/e2e/homepage-phone-canvas-scope.spec.ts` implementing the three tests described in `<behavior>`, following the existing repo conventions in `tests/e2e/homepage-accent-random.spec.ts` (read expectations off the page's own data attributes, never hardcode hex or content counts) and `tests/e2e/homepage-content-display.spec.ts` (grid mode entered via the `Grille` button). Run it and confirm tests 1 and 2 FAIL and test 3 PASSES against the unfixed source — that failure signature is the proof the spec actually targets the bug.

    Step 2 (GREEN): in `src/layouts/BaseLayout.astro`, wrap ONLY the `body.has-phone-canvas main` rule (currently around lines 425-427) in the same `@media (max-width: 767px)` gate the head `<style is:inline set:html>` block already uses for this identical concept, re-indenting the rule one level inside the new media block. Keep the existing explanatory comment above it (the iOS-Safari under-page-snapshot rationale) and extend it with one sentence, referencing this quick task id, recording WHY the gate exists: the phone-canvas colour is phone-only, and without the gate it overrode `main`'s own dominant background at every width, leaking a gallery accent through empty grid cells on desktop. Cross-reference the head block as the sibling mechanism that must stay on the same breakpoint.

    Do NOT change anything else. Specifically leave untouched: the head `<style is:inline set:html>` block, the `@media (min-width: 768px) { html { ... } }` rule and its comment, the `main { background-color: var(--color-dominant); transition: ... }` rule near line 568, the `has-phone-canvas` class application and `--phone-canvas-color` inline style on `<body>` (lines 252-254), and `phoneCanvasColor`'s computation in `src/components/HomePage.astro`.

    Step 3: re-run the spec and confirm all three tests pass, then run the full gate set in `<verify>`.
  </action>

  <verify>
    <automated>npm run test:e2e -- tests/e2e/homepage-phone-canvas-scope.spec.ts --project=chromium</automated>
    <automated>node -e "const s=require('fs').readFileSync('src/layouts/BaseLayout.astro','utf8');const i=s.indexOf('body.has-phone-canvas main');if(i<0){console.error('FAIL: rule missing');process.exit(1);}const m=s.slice(0,i).lastIndexOf('@media');if(m<0||!/max-width:\s*767px/.test(s.slice(m,i))){console.error('FAIL: rule is not inside a max-width 767px media block');process.exit(1);}console.log('OK: phone-canvas main rule is phone-gated');"</automated>
    <automated>npm run lint</automated>
    <automated>npm run typecheck</automated>
    <automated>npm run test:e2e -- --project=chromium</automated>
  </verify>

  <done>
    - `tests/e2e/homepage-phone-canvas-scope.spec.ts` exists and its three tests pass; before the CSS change, tests 1 and 2 demonstrably failed.
    - `body.has-phone-canvas main` sits inside an `@media (max-width: 767px)` block, matching the head block's breakpoint; the structural node check prints OK.
    - The spec contains no hardcoded accent hex literal and no tile/gallery count assertion.
    - `git diff src/layouts/BaseLayout.astro` shows only the media wrapper, the re-indent of the wrapped rule, and the extended comment — no other rule, no prop, no class-application change.
    - `git status` shows no modification to `src/components/HomePage.astro` or `src/components/MobileHomePrototype.astro`.
    - Full chromium e2e suite, lint, and typecheck all pass.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Sanity Content Lake -> build-time render | `heroColor` (author-controlled string) is interpolated into a CSS custom property and into a head `set:html` style block. Pre-existing, unchanged by this plan. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-jvm-01 | Information Disclosure | `body.has-phone-canvas main` in BaseLayout.astro | low | mitigate | The bug itself: a gallery accent unrelated to the displayed content leaks onto the desktop canvas. Fixed by the viewport gate in Task 1 and locked by `tests/e2e/homepage-phone-canvas-scope.spec.ts`. |
| T-jvm-02 | Tampering | `set:html` interpolation of `phoneCanvasColor` into a head style block | low | accept | Pre-existing surface, explicitly out of scope per the task constraints. Input originates only from the Sanity Studio, which is authenticated single-author (Romane); no untrusted party can set `heroColor`. Not introduced or widened by this change. |
| T-jvm-SC | Tampering | npm/pip/cargo installs | n/a | accept | No dependency is added, removed, or upgraded by this plan; no package-manager install task exists, so the legitimacy gate does not apply. |
</threat_model>

<verification>
- Desktop homepage in grid mode shows white behind empty grid cells, not a coloured rectangle.
- Desktop homepage in carousel mode is visually unchanged.
- Phone-width homepage canvas colour is visually unchanged (no white/black flash on rubber-band).
- `npm run lint`, `npm run typecheck`, and the full `chromium` Playwright project all pass.
</verification>

<success_criteria>
- The single CSS rule is viewport-gated to `max-width: 767px`; nothing else in `BaseLayout.astro` changed.
- `tests/e2e/homepage-phone-canvas-scope.spec.ts` passes and is content-agnostic (survives any gallery count or accent palette change).
- No regression in the existing e2e suite.
</success_criteria>

<output>
Create `.planning/quick/260825-jvm-scope-the-phone-canvas-main-background-r/260825-jvm-SUMMARY.md` when done.
</output>
