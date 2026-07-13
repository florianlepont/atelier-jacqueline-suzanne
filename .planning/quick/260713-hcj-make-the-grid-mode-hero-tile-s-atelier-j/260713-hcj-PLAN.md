---
phase: quick-260713-hcj
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/HomeCarousel.astro
  - tests/e2e/homepage.spec.ts
autonomous: true
requirements: [HOME-03]
must_haves:
  truths:
    - "In GRID mode on a mobile viewport (<=767px), the hero tile's 'Atelier Jacqueline Suzanne' wordmark renders as photo-filled letters (transparent background-clip:text cutout revealing --wordmark-photo), matching the carousel wordmark's transparency effect."
    - "The mobile grid hero wordmark is visibly larger than the previous flat 16px (a fluid clamp finalized by live measurement)."
    - "The widest wordmark line ('JACQUELINE') fits inside the hero tile's inner width with a safe margin (>=8px) at 360, 375, 393, and 428px viewport widths — no clipping/overflow."
    - "At desktop width (>=768px) the grid hero tile is UNCHANGED — still solid --color-on-accent text on the solid accent background, no cutout (D-05 preserved for desktop; reversed for mobile only per the user's live request)."
  artifacts:
    - "src/components/HomeCarousel.astro — mobile @media (max-width:767px) block updated: .home-grid__wordmark font-size bumped to a fluid clamp + a nested @supports(background-clip:text) cutout rule for .home-grid__wordmark."
    - "tests/e2e/homepage.spec.ts — new regression test asserting the grid hero wordmark uses background-clip:text with a url() background-image at a mobile viewport, and stays solid (non-transparent) at desktop width."
  key_links:
    - "--wordmark-photo custom property (set on .home root, server-rendered from firstGallery.heroSrc, synced by render()) inherits into .home-grid__wordmark — the grid cutout reuses it with no JS change."
    - "@supports(background-clip:text) + color:transparent + -webkit-text-fill-color:transparent scoped INSIDE @media (max-width:767px) — the whole change is mobile-only."
---

<objective>
Make the GRID-mode hero tile's "Atelier Jacqueline Suzanne" wordmark, on mobile only, (1) larger and (2) filled with the carousel's photo via the same transparent `background-clip: text` cutout the carousel wordmark uses.

Purpose: The user viewed the homepage in grid mode on their phone and found the wordmark too small and flat (plain 16px black-ish text on a solid accent square), expecting the same photo-through-the-letters transparency effect the carousel wordmark has. This delivers that on mobile.

Output: A mobile-only CSS change in `HomeCarousel.astro` plus a live-measured, green-gated verification (and a matching e2e regression test). No JavaScript changes.
</objective>

<execution_context>
@/home/user/ajs-website/.claude/gsd-core/workflows/execute-plan.md
@/home/user/ajs-website/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@src/components/HomeCarousel.astro
@tests/e2e/homepage.spec.ts

## Deliberate reversal of a prior locked decision (READ FIRST)

Phase 6's locked decision D-05 (see `06-DISCUSSION-LOG.md` → "Hero tile photo") chose "Solid color background, no cutout here" for the grid hero tile, on the reasoning that the cutout "can only work on the carrousel effect as the font and the hero are on top of the picture."

After seeing it live on their phone, the user is now **deliberately reversing that decision for mobile** and asking for the cutout + a bigger wordmark on the grid hero tile. This is an explicit, intentional reversal — not an oversight. Scope of the reversal is **mobile only** (`@media (max-width: 767px)`), because that is what the user observed and requested; reversing it for all viewports without being asked would be scope creep. **Desktop grid hero tile stays exactly as-is (solid color, no cutout).**

## Why no JS change is needed

- `--wordmark-photo` is already set as an inline style on the `.home` root `<section>` (server-rendered from `firstGallery.heroSrc`) and re-set by `render()` on every carousel tick (`root.style.setProperty('--wordmark-photo', ...)`). CSS custom properties inherit, so `.home-grid__wordmark` (a descendant of `.home`) already sees the current `--wordmark-photo`. This is exactly "the picture displayed on the carrousel behind."
- In grid mode the carousel auto-advance is stopped, so `--wordmark-photo` simply holds whatever the carousel last showed (first gallery on initial load) — the correct, minimal source.

## Why the grid cutout must use `cover`/`center`, NOT the JS pixel-alignment

The carousel wordmark's `syncWordmarkAlignment()` computes `--wordmark-bg-size` / `--wordmark-bg-position` so the letters line up pixel-for-pixel with the SAME photo crop physically behind the accent panel. The grid hero tile has **no photo behind it** (it is a solid-accent square) — there is nothing to align to. So the grid cutout must use the plain `background-size: cover; background-position: center` fallback path (the same values the carousel's `@supports` block falls back to before JS runs). Do NOT port `syncWordmarkAlignment()` to the grid; do NOT touch the `<script>` block at all.

## Hard constraints (from the requester)

- Touch ONLY the `@media (max-width: 767px)` mobile override block for `.home-grid__wordmark`. Do NOT modify the desktop `.home-grid__tile.home-grid__tile--hero` / `.home-grid__wordmark` base rules.
- Pick the font-size by LIVE MEASUREMENT (Playwright: measure the actual rendered widest-line width vs. the tile's inner width across 360/375/393/428), not a guessed px value. Use a fluid `clamp()` — the established pattern in this file (see the carousel wordmark's `clamp(36px, 9.8vw, 50px)`).
- Green-gate convention: `npm run build`, `npm run test:unit` (23 unit), and `npx playwright test tests/e2e/homepage.spec.ts` (full e2e acceptable) must all pass.

## Relevant existing code (already read — do not re-read to "double-check")

- Carousel cutout template: `.home-hero__wordmark` `@supports (background-clip: text) or (-webkit-background-clip: text)` block (HomeCarousel.astro ~lines 1009-1042): `background-image: var(--wordmark-photo); background-size: var(--wordmark-bg-size, cover); background-position: var(--wordmark-bg-position, center); background-repeat: no-repeat; -webkit-background-clip: text; background-clip: text; color: transparent; -webkit-text-fill-color: transparent;`. The carousel currently has `text-shadow: none`.
- Current mobile grid rule to replace (HomeCarousel.astro ~lines 1247-1250): `.home-grid__wordmark { font-size: 16px; }`.
- Grid hero tile box: `.home-grid__tile.home-grid__tile--hero` has `padding: var(--space-md)` (16px) and `aspect-ratio: 1/1`; on mobile `.home-grid__tiles` is `grid-template-columns: 1fr` (full-width tile). So the wordmark's available inner width ≈ viewport − 32px, with ample vertical room (only the widest line's horizontal fit constrains font-size).
- Space tokens (BaseLayout.astro): `--space-sm: 8px`, `--space-md: 16px`, `--space-lg: 24px`. The grid tile's inner width is ~16px WIDER than the carousel accent panel (space-md padding vs space-lg), so the carousel's proven `clamp(36px, 9.8vw, 50px)` is a safe starting candidate.
- Existing carousel-cutout e2e test to mirror: `homepage.spec.ts` `test.describe('carousel wordmark cutout (HOME-03, D-08)', ...)` (~lines 155-174) — reads `getComputedStyle(el).webkitBackgroundClip` and `.backgroundImage`.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add the mobile-only grid hero wordmark cutout + fluid size bump</name>
  <files>src/components/HomeCarousel.astro</files>
  <action>
Inside the EXISTING `@media (max-width: 767px)` block only (do not create a new media query, do not touch any desktop rule), rework the current `.home-grid__wordmark { font-size: 16px; }` rule:

1. Replace the flat `font-size: 16px` with a fluid `clamp()`. Start from the carousel wordmark's proven mobile value `clamp(36px, 9.8vw, 50px)` as the initial candidate — Task 2 will live-measure and finalize the exact bounds. Leave `line-height` inherited from the desktop `.home-grid__wordmark` base rule (1.15); do not add a mobile line-height override unless Task 2's measurement shows the 3 lines need it.

2. Add, inside the SAME mobile media query, an `@supports (background-clip: text) or (-webkit-background-clip: text) { .home-grid__wordmark { ... } }` rule that mirrors the carousel `.home-hero__wordmark` cutout but with the STATIC cover/center source (no `--wordmark-bg-size`/`--wordmark-bg-position` — those are carousel-only JS values): `background-image: var(--wordmark-photo); background-size: cover; background-position: center; background-repeat: no-repeat; -webkit-background-clip: text; background-clip: text; color: transparent; -webkit-text-fill-color: transparent;`. Nesting `@supports` inside `@media` is valid CSS and compiles fine under Astro/evergreen browsers.

Rationale to record in an inline CSS comment on the new rule: (a) this is a deliberate mobile-only reversal of D-05 per the user's live request; (b) `--wordmark-photo` is inherited from the `.home` root, already synced to the carousel's current gallery, so no JS is involved; (c) `cover`/`center` (not the carousel's JS pixel-alignment) is correct because the grid hero tile has no photo physically behind it to align to. Keep the fallback legible: `.home-grid__wordmark`'s solid fallback color is the inherited `--color-on-accent` from `.home-grid__tile--hero` (used when `background-clip: text` is unsupported) — do NOT set an explicit non-transparent `color` outside the `@supports` block that would defeat the cutout, and do not add `text-shadow` (mirror the carousel, which currently has none) unless Task 2's live check shows a line vanishing into a busy photo.

Do not modify the `<script>` block, the desktop `.home-grid__wordmark` rule (font-size 40px), or `.home-grid__tile.home-grid__tile--hero`.
  </action>
  <verify>
    <automated>npm run build 2>&1 | tail -5 && grep -n "background-clip: text" src/components/HomeCarousel.astro | grep -q . && grep -n "home-grid__wordmark" src/components/HomeCarousel.astro</automated>
  </verify>
  <done>Build succeeds. The `@media (max-width: 767px)` block contains a `.home-grid__wordmark` rule with a `clamp(...)` font-size AND a nested `@supports` cutout rule (`background-clip: text` + `color: transparent` + `-webkit-text-fill-color: transparent` + `background-image: var(--wordmark-photo)`). The desktop `.home-grid__wordmark { font-size: 40px }` rule is unchanged.</done>
</task>

<task type="auto">
  <name>Task 2: Live-measure the fit, finalize the clamp, add a regression test, run the green gate</name>
  <files>src/components/HomeCarousel.astro, tests/e2e/homepage.spec.ts</files>
  <action>
Live-measure with Playwright (headless is fine; a temporary script under the scratchpad dir, OR fold the measurement into the new e2e test below). For each viewport width in {360, 375, 393, 428} (height 800): `page.goto('/')`, click the "Grille" toggle to reveal the grid, then in the browser measure the rendered width of EACH of the three wordmark lines by wrapping each `<br>`-separated text run of `.home-grid__wordmark` in a Range and reading `range.getBoundingClientRect().width`; take the max (it will be "JACQUELINE"). Read the wordmark's available inner width as `.home-grid__wordmark`'s `clientWidth`. Compute margin = clientWidth − maxLineWidth.

Finalize the `clamp()` bounds in HomeCarousel.astro's mobile rule so that margin >= 8px at ALL four widths (priority: never clip at 360px). If the carousel's starting `clamp(36px, 9.8vw, 50px)` already yields comfortable margin (the grid tile is ~16px wider inner than the carousel panel, so it likely does) and the visual weight matches the carousel, keep it; if margin is excessive you MAY raise the vw coefficient/cap for better weight, but re-measure and keep >=8px everywhere. Record the final measured margins (per viewport) in the SUMMARY.

Add a regression test to `tests/e2e/homepage.spec.ts`, modelled on the existing `carousel wordmark cutout` describe block: `test.describe('grid hero wordmark cutout — mobile (HOME-03, D-05 reversal)', ...)` with (a) at a 393px-wide viewport, switch to grid mode and assert `getComputedStyle('.home-grid__wordmark')` has `webkitBackgroundClip || backgroundClip` containing `'text'` and `backgroundImage` containing `'url('`; (b) at a 1280px-wide viewport, switch to grid mode and assert the SAME element's computed `-webkit-text-fill-color` (or `color`) is NOT `transparent`/`rgba(0, 0, 0, 0)` — proving the cutout is mobile-only and desktop is untouched.

Run the full green gate. If any pre-existing test fails for an unrelated reason, stop and report; do not weaken assertions to make the gate pass.
  </action>
  <verify>
    <automated>npm run build 2>&1 | tail -3 && npm run test:unit 2>&1 | tail -5 && npx playwright test tests/e2e/homepage.spec.ts 2>&1 | tail -15</automated>
  </verify>
  <done>Live measurement confirms margin >= 8px between the widest rendered wordmark line and the tile inner width at 360/375/393/428px (measured values recorded in SUMMARY). `npm run build` passes; `npm run test:unit` is green (23 unit tests); `npx playwright test tests/e2e/homepage.spec.ts` is green including the new mobile grid-cutout test (mobile = cutout applied, desktop = solid/non-transparent).</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| (none new) | CSS-only, mobile-scoped styling change plus one e2e test. No new inputs, network calls, data flows, endpoints, or packages. `--wordmark-photo` already flows from server-rendered gallery data via the existing (Phase 6) mechanism; this change only consumes it in CSS. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-quick-01 | Tampering | npm/pip/cargo installs | low | accept | No packages are installed by this plan (no `npm install`); nothing to audit. |
| T-quick-02 | Denial of Service | `.home-grid__wordmark` overflow on narrow phones | low | mitigate | Live measurement across 360/375/393/428 enforces a >=8px fit margin so the wordmark never clips/overflows the tile. |
</threat_model>

<verification>
- `npm run build` succeeds (the nested `@media { @supports { … } }` compiles).
- `npm run test:unit` — 23 unit tests green (unaffected; no logic changed).
- `npx playwright test tests/e2e/homepage.spec.ts` — green, including the pre-existing carousel-cutout test AND the new mobile grid-cutout test.
- Live measurement (recorded in SUMMARY): widest grid wordmark line fits with >=8px margin at 360/375/393/428px.
- Desktop regression: at 1280px the grid hero wordmark computed text-fill is NOT transparent (cutout is mobile-only; D-05 preserved on desktop).
- Optional human-check (non-blocking): on a real phone in grid mode, the hero-tile wordmark reads as photo-filled letters, legible against the current gallery photo, visibly larger than before.
</verification>

<success_criteria>
- Grid-mode hero tile wordmark on mobile (<=767px) is larger (fluid clamp, live-measured) AND shows the photo-cutout transparency effect using the carousel's current gallery photo (`--wordmark-photo`).
- No JavaScript changes; only the mobile `@media (max-width: 767px)` block of `.home-grid__wordmark` in HomeCarousel.astro is touched.
- Desktop grid hero tile is byte-for-byte unchanged (solid on-accent text, no cutout).
- Full green gate passes: build + 23 unit + homepage e2e (with the added grid-cutout regression test).
</success_criteria>

<output>
Create `.planning/quick/260713-hcj-make-the-grid-mode-hero-tile-s-atelier-j/260713-hcj-SUMMARY.md` when done, recording the final `clamp()` value and the per-viewport measured fit margins (360/375/393/428).
</output>
