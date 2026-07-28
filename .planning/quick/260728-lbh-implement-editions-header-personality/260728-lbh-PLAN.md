---
phase: quick-260728-lbh
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/EditionsOverviewBody.astro
autonomous: true
requirements:
  - "CONFIRMED DESIGN FOLLOW-UP: implements the approved winner of sketch 012 (`.planning/sketches/012-editions-header-personality/`, variant `#variant-f1` 'F1 — Drifting Grey Halftone', Round 12 final state — Florian: \"It's amazing! approved\") into the real shared Éditions overview component. Active REQUIREMENTS.md was reset after v1.3 closed and carries no EDN tag, so this has no user-facing requirement of its own — same framing as 260728-g76 and 260728-hxv: a pure visual/motion follow-up on the deployed /editions/ page. It is a superset visual reshape of the EDN-02 overview header (no props/data/route change)."
must_haves:
  truths:
    - "On both /editions/ and /en/editions/, at >=760px the header renders as a two-column broken grid (titleblock left, intro right with a left hairline + inset padding), a drifting grey halftone dot-field bleeds behind the title from the top-right corner, and on a fresh page load an entrance sequence plays: eyebrow, then title (settling from a scaled/rotated state), then intro, then halftone fade-in, then the row list fading up in a per-row stagger."
    - "The eyebrow carries a small accent-colored square that pulses continuously; hovering the header visibly speeds the halftone drift (10s -> 4s) and deepens its dot contrast; the title uses a large clamp() display size on a single non-wrapping line."
    - "Below 760px the header stacks single-column with NO halftone and NO broken grid (existing responsive behaviour is preserved); the per-row fade-up entrance still plays at all widths."
    - "`prefers-reduced-motion: reduce` renders everything statically — no entrance animations, no eyebrow pulse, no halftone motion — with the halftone still visible (opacity 1) and no motion."
    - "The halftone fade shows NO visible hard edge at any tested viewport (the invariant: 700px box overflow on every side stays strictly greater than the 640px mask circle radius); the existing cursor-follow `.editions-preview` script, the `.editions-index__row:first-of-type` separator hairline, and the `@media (max-width: 800px)` block are all untouched; EDN-06 commerce-token scan stays clean; no JavaScript is added."
  artifacts:
    - "src/components/EditionsOverviewBody.astro — header markup gains a `.editions-list__halftone` div + a `.editions-list__titleblock` wrapper around eyebrow+h1; the row `<a>` gains an inline `animation-delay` style computed in the map loop; ~7 CSS rules replaced/added, 6 new @keyframes, a header/halftone hover rule, and one new `prefers-reduced-motion` block — all transcribed verbatim from the approved Round-12 sketch."
  key_links:
    - "Both /editions/ and /en/editions/ render through this single shared `EditionsOverviewBody.astro` -> the one edit covers both locales with zero route/prop/data change (existing heading/intro/tiles props already supply everything the design needs)."
    - "Per-row entrance stagger flows from the inline `style={`animation-delay: ${rowDelay}s`}` (rowDelay = min(0.6 + idx*0.12, 1.2)) computed in the map loop -> the `.editions-index__row` `animation: editions-row-fade-up ... forwards` rule; BOTH the markup style and the CSS animation must land or every row stays at its `opacity: 0` default and the list renders blank."
    - "Halftone geometry is an invariant pair: the mask circle radius (640px) must stay strictly less than the box overflow on every side (700px). The hover rule's `animation-duration: 0.6s, 4s` supplies two positionally-mapped values for the two comma-declared animations (fade-in first, drift second) — order-dependent, must match the `animation:` declaration order exactly."
---

<objective>
Implement the approved winning design from sketch 012 (`.planning/sketches/012-editions-header-personality/index.html`, variant `#variant-f1` "F1 — Drifting Grey Halftone", Round 12 final state, Florian-confirmed "It's amazing! approved") into the real production component `src/components/EditionsOverviewBody.astro`. This component is shared by `src/pages/editions/index.astro` and `src/pages/en/editions/index.astro`, so editing it alone covers both locales.

The change reshapes the Éditions overview header into a two-column "broken grid" with a drifting grey halftone dot-field behind the title, a pulsing accent square on the eyebrow, a staggered CSS-keyframe entrance sequence (eyebrow -> title -> intro -> halftone -> rows), a header-hover that speeds/darkens the halftone, and a `prefers-reduced-motion` fallback. Every animation is a pure CSS `@keyframes` animation that plays on initial paint — ZERO JavaScript is added.

Root nature (do not re-scope): this is a pure visual/motion reshape of existing text content. No new props, no new data, no route change, no Sanity change. The CSS values below are the non-negotiable result of 12 rounds of live tuning with the site owner and must be transcribed exactly.

Purpose: give the Éditions overview a distinct, memorable header personality (the confirmed sketch-012 winner) without touching data flow, commerce guards, or the working cursor-follow preview.
Output: one shared component edited — header markup + row-loop inline style + a batch of replaced/added CSS rules, keyframes, and a reduced-motion block. One file, one commit.
</objective>

<execution_context>
@/home/user/ajs-website/.claude/gsd-core/workflows/execute-plan.md
@/home/user/ajs-website/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@.planning/STATE.md

# Canonical source of truth for every value below — the approved variant, Round-12 final state:
@.planning/sketches/012-editions-header-personality/index.html

# The single file being edited. Header markup ~lines 36-40, row map loop ~lines 48-60,
# and the `<style>` block ~lines 70-233. Confirm current line numbers by reading before editing.
@src/components/EditionsOverviewBody.astro
</context>

<tasks>

<task type="auto">
  <name>Task 1: Implement the sketch-012 F1 "Drifting Grey Halftone" header into EditionsOverviewBody.astro (markup + CSS, no JS)</name>
  <files>src/components/EditionsOverviewBody.astro</files>
  <action>
Edit ONLY `src/components/EditionsOverviewBody.astro`. Read the file first to confirm current line numbers (they may have shifted). Apply the following, transcribing every value byte-for-byte — these are the final, approved Round-12 numbers; do not paraphrase, round, or "improve" any value or class name.

**A. Header markup — add the halftone div and wrap eyebrow+h1 in a titleblock.**
The current `<header class="editions-list__header">` contains, in order: `<p class="editions-list__eyebrow">Atelier Jacqueline Suzanne</p>`, `<h1>{heading}</h1>`, `<p class="editions-list__intro">{intro}</p>`. Replace the whole header with:

  <header class="editions-list__header">
    <div class="editions-list__halftone" aria-hidden="true"></div>
    <div class="editions-list__titleblock">
      <p class="editions-list__eyebrow">Atelier Jacqueline Suzanne</p>
      <h1>{heading}</h1>
    </div>
    <p class="editions-list__intro">{intro}</p>
  </header>

(The halftone div is the new first child; eyebrow + h1 move inside a new `.editions-list__titleblock` wrapper; the `.editions-list__intro` paragraph stays as the header's last child, unchanged — still rendering `{intro}` as escaped text.)

**B. Row map loop — add a computed per-row entrance delay as an inline style.**
The current loop (inside `tiles.map((tile, idx) => { ... })`) computes `const label = ...` then returns the `<a class="editions-index__row" href={tile.href} data-img={tile.imgSrc}>...`. Add ONE `const` after the label line and ONE `style` attribute on the `<a>`; everything else in the loop stays byte-identical:

  {tiles.map((tile, idx) => {
    const label = `${heading.replace(/s$/, '')} ${String(idx + 1).padStart(2, '0')}`;
    const rowDelay = Math.min(0.6 + idx * 0.12, 1.2);
    return (
      <a class="editions-index__row" href={tile.href} data-img={tile.imgSrc} style={`animation-delay: ${rowDelay}s`}>
        <span class="editions-index__number">{label}</span>
        <h2 class="editions-index__title">{tile.title}</h2>
        <div class="editions-index__statement-wrap">
          <p class="editions-index__statement">{tile.statement}</p>
        </div>
        <span class="sr-only">{viewEditionLabel}</span>
      </a>
    );
  })}

**C. Replace the `.editions-list__header` CSS rule** (currently just `margin-bottom: var(--space-2xl);`) with the rule plus its >=760px media query:

  .editions-list__header {
    position: relative;
    margin-bottom: var(--space-2xl);
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-lg);
  }
  @media (min-width: 760px) {
    .editions-list__header {
      grid-template-columns: auto 1fr;
      align-items: end;
      column-gap: var(--space-2xl);
    }
  }

**D. Add a new `.editions-list__titleblock` rule** (place it right after the header rule/media query):

  .editions-list__titleblock {
    position: relative;
    grid-column: 1;
  }

**E. Replace the `.editions-list__eyebrow` rule and add its `::before`:**

  .editions-list__eyebrow {
    display: flex;
    align-items: center;
    gap: 8px;
    width: fit-content;
    margin: 0;
    font-size: var(--text-label-size);
    font-weight: var(--weight-semibold);
    line-height: var(--text-label-leading);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    opacity: 0;
    transform: translateY(6px);
    animation: editions-header-fade-up 0.45s cubic-bezier(0.16, 1, 0.3, 1) 0s forwards;
  }
  .editions-list__eyebrow::before {
    content: '';
    width: 8px;
    height: 8px;
    background: var(--color-accent);
    display: inline-block;
    animation: editions-eyebrow-pulse 2.2s ease-in-out infinite;
  }

**F. Replace the `.editions-list h1` rule:**

  .editions-list h1 {
    margin: var(--space-md) 0 0;
    font-size: clamp(64px, 9vw, 140px);
    font-weight: var(--weight-semibold);
    font-family: var(--font-display);
    line-height: 0.9;
    letter-spacing: -0.04em;
    white-space: nowrap;
    display: inline-block;
    opacity: 0;
    transform: scale(0.82) translateY(18px) rotate(-2deg);
    animation: editions-header-settle 0.65s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards;
  }

**G. Replace the `.editions-list__intro` rule** with the rule plus its >=760px media query:

  .editions-list__intro {
    grid-column: 1;
    margin: 0;
    line-height: 1.5;
    color: #3a3a3a;
    max-width: 46ch;
    opacity: 0;
    transform: translateY(10px);
    animation: editions-header-fade-up 0.45s cubic-bezier(0.16, 1, 0.3, 1) 0.5s forwards;
  }
  @media (min-width: 760px) {
    .editions-list__intro {
      grid-column: 2;
      padding-bottom: 0.3em;
      border-left: var(--border-hairline) solid var(--color-border);
      padding-left: var(--space-lg);
    }
  }

**H. Add the three header keyframes:**

  @keyframes editions-header-fade-up {
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes editions-header-settle {
    to { opacity: 1; transform: scale(1) translateY(0) rotate(0deg); }
  }
  @keyframes editions-eyebrow-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.7); }
  }

**I. Add the `.editions-list__halftone` rule, its media query, its two keyframes, and the header-hover rule.** This exact geometry took 12 rounds to settle: a real bug was found where the box overflow was too small relative to the mask fade radius, producing a visible hard-edge cutoff. The invariant that MUST hold: the overflow on every side (700px) must stay strictly greater than the mask circle radius (640px) — do not shrink either number without preserving that inequality.

  .editions-list__halftone {
    position: absolute;
    top: -700px;
    bottom: -700px;
    left: -700px;
    right: -700px;
    background-image: radial-gradient(rgba(26, 26, 26, 0.16) 1.4px, transparent 1.6px);
    background-size: 9px 9px;
    -webkit-mask-image: radial-gradient(circle 640px at right 700px top 700px, black 0%, rgba(0, 0, 0, 0.72) 18%, rgba(0, 0, 0, 0.42) 40%, rgba(0, 0, 0, 0.18) 65%, rgba(0, 0, 0, 0.05) 85%, transparent 100%);
    mask-image: radial-gradient(circle 640px at right 700px top 700px, black 0%, rgba(0, 0, 0, 0.72) 18%, rgba(0, 0, 0, 0.42) 40%, rgba(0, 0, 0, 0.18) 65%, rgba(0, 0, 0, 0.05) 85%, transparent 100%);
    z-index: -1;
    pointer-events: none;
    display: none;
    opacity: 0;
    transition: filter 0.3s ease;
    animation: editions-halftone-fade-in 0.6s ease 0.3s forwards, editions-halftone-drift 10s linear infinite;
  }
  @media (min-width: 760px) {
    .editions-list__halftone {
      display: block;
    }
  }
  @keyframes editions-halftone-fade-in {
    to { opacity: 1; }
  }
  @keyframes editions-halftone-drift {
    from { background-position: 0 0; }
    to { background-position: 90px 45px; }
  }
  .editions-list__header:hover .editions-list__halftone {
    animation-duration: 0.6s, 4s;
    filter: contrast(1.35) brightness(0.85);
  }

The hover rule's `animation-duration: 0.6s, 4s` gives two values because the element declares two comma-separated animations in that order (fade-in, then drift): fade-in keeps its original 0.6s, only drift speeds up from 10s to 4s. This ordering must match the `animation:` declaration in `.editions-list__halftone` exactly.

**J. Row-list entrance — merge into the EXISTING `.editions-index__row` rule, then add its keyframe.**
Do NOT create a second `.editions-index__row` selector block. Add these three properties (`opacity`, `transform`, `animation`) to the existing `.editions-index__row` rule that currently holds `display: block; padding: var(--space-xl) 0; border-bottom: var(--border-hairline) solid var(--color-border); text-decoration: none; color: var(--color-ink);` — so it becomes:

  .editions-index__row {
    display: block;
    padding: var(--space-xl) 0;
    border-bottom: var(--border-hairline) solid var(--color-border);
    text-decoration: none;
    color: var(--color-ink);
    opacity: 0;
    transform: translateY(20px);
    animation: editions-row-fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  @keyframes editions-row-fade-up {
    to { opacity: 1; transform: translateY(0); }
  }

The per-row `animation-delay` is supplied by the inline `style` attribute added in step B — do NOT put a delay in this CSS rule.

**K. Add a new `prefers-reduced-motion: reduce` block** (grep first to confirm the component has none today — it does not — then add it):

  @media (prefers-reduced-motion: reduce) {
    .editions-list__eyebrow,
    .editions-list h1,
    .editions-list__intro,
    .editions-index__row {
      opacity: 1 !important;
      transform: none !important;
      animation: none !important;
    }
    .editions-list__eyebrow::before {
      animation: none;
    }
    .editions-list__halftone {
      animation: none;
      opacity: 1 !important;
    }
  }

**Scope guardrails — do NOT deviate:**
- Touch ONLY `src/components/EditionsOverviewBody.astro`.
- Do NOT touch `src/pages/editions/index.astro`, `src/pages/en/editions/index.astro`, any file under `src/lib/`, or any Sanity schema — no new props are needed; the existing `heading`/`intro`/`tiles`/`emptyHeading`/`emptyBody`/`viewEditionLabel` props already supply everything.
- Do NOT add any JavaScript. Every animation here is a CSS `@keyframes` animation (not a `transition`) that plays automatically on initial paint. Do NOT port the sketch's JS class-toggle (it existed only to switch comparison tabs during design review); no replay button, no observer, no class toggle.
- Do NOT touch the existing `<script>` block (the `.editions-preview` cursor-follow photo panel) — separate, already-working feature.
- Do NOT touch `.editions-index__row:first-of-type { border-top: ... }` (the separator hairline) or the existing `@media (max-width: 800px)` block (statement-always-visible + preview hidden on mobile) — both unrelated and already correct.
- No new hardcoded strings and no bilingual concern — the eyebrow text "Atelier Jacqueline Suzanne" is already hardcoded today and stays unchanged.
- Zero commerce affordance (EDN-06): this is a pure visual/motion change to existing text; nothing here introduces a commerce token, and the `test:artifact` scan in verification must stay green.
  </action>
  <verify>
    <automated>npm run typecheck && npm run build && npm run test:artifact && npx playwright test tests/e2e/edition.spec.ts tests/e2e/site-header.spec.ts tests/e2e/accessibility.spec.ts && npx playwright test</automated>
    <human-check>
Live-browser verification (executor performs this; Florian will independently redo it afterward). Do NOT assume the CSS "just works" because it was copied verbatim — the halftone geometry caused a real, hard-to-spot hard-edge bug in the sketch. On both `/editions/` and `/en/editions/`:
1. At >=760px (test at least ~800px AND ~1440px): the halftone's fade behind the title has NO visible hard edge / circular cutoff at either width; the header is a two-column broken grid (title left, intro right with a left hairline).
2. On a fresh page load the entrance sequence plays in roughly this stagger order: eyebrow, then title (settling from scaled/rotated), then intro, then halftone fade-in, then the rows fading up one after another.
3. Hovering the header visibly speeds the halftone drift and deepens the dot contrast.
4. With `prefers-reduced-motion: reduce` emulated: everything is shown statically — no entrance animation, no eyebrow pulse, no halftone motion, halftone still visible.
5. Below 760px: header stacks single-column, no halftone, no broken grid (existing responsive behaviour); the row fade-up still plays.
    </human-check>
  </verify>
  <done>The header renders the sketch-012 F1 design on both locales: two-column broken grid + drifting grey halftone at >=760px, pulsing accent eyebrow square, staggered entrance (eyebrow/title/intro/halftone/rows), header-hover speeds+darkens the halftone, single-column no-halftone stack below 760px, and a working `prefers-reduced-motion` fallback. All CSS values match the Round-12 sketch byte-for-byte; the halftone shows no hard edge at 800px or 1440px. No JS added; the `.editions-preview` script, the first-row separator hairline, and the `@media (max-width: 800px)` block are untouched. `npm run typecheck`, `npm run build`, `npm run test:artifact`, the three targeted e2e specs, and the full `npx playwright test` suite all pass; EDN-06 stays clean. The diff is confined to one file.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| build -> static artifact | CSS/markup-only change to one shared Astro component. No JavaScript added, no runtime/server surface, no dependency, no data path, no user input. Purely presentational/motion. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-lbh-01 | Tampering | The `.editions-list` header layout + `.editions-index` row list | low | mitigate | Change is scoped to one file: header markup gains a decorative `aria-hidden` halftone div + a titleblock wrapper, the row `<a>` gains an inline `animation-delay`, and a batch of CSS rules/keyframes is replaced/added. The `.editions-preview` script, `.editions-index__row:first-of-type` hairline, and `@media (max-width: 800px)` block are explicitly untouched. `edition.spec.ts`, `site-header.spec.ts`, `accessibility.spec.ts`, the full e2e suite, and build + artifact checks must all pass. |
| T-lbh-02 | Denial of Service (perceived) | Continuous CSS animations (eyebrow pulse, halftone drift) | low | mitigate | Animations are GPU-friendly CSS keyframes (opacity/transform/background-position/mask); a `prefers-reduced-motion: reduce` block disables all of them and renders everything static, honoring accessibility/motion-sensitivity. |
| T-lbh-SC | Tampering | npm/pip/cargo installs | low | accept | No package installs; no dependency changes to root or `sanity/`. Supply-chain surface unchanged. |
</threat_model>

<verification>
1. `npm run typecheck` — Astro/TS clean (the added inline `style` template literal and markup type-check).
2. `npm run build` — static build succeeds with the edited component.
3. `npm run test:artifact` — built-artifact verification incl. EDN-06 commerce-token scan stays clean.
4. `npx playwright test tests/e2e/edition.spec.ts tests/e2e/site-header.spec.ts tests/e2e/accessibility.spec.ts` — targeted specs green (Éditions overview, site header, a11y).
5. `npx playwright test` — full e2e suite, no regressions elsewhere.
6. Live-browser checks per the task `<human-check>`: no halftone hard edge at 800px and 1440px, full entrance sequence on fresh load, header-hover speeds/darkens the drift, `prefers-reduced-motion` static, both `/editions/` and `/en/editions/`, above and below the 760px breakpoint.
</verification>

<success_criteria>
- The sketch-012 `#variant-f1` Round-12 header (broken-grid two-column layout, drifting grey halftone, pulsing accent eyebrow square, staggered CSS entrance, hover-accelerated/darkened halftone) is live on both `/editions/` and `/en/editions/`, with every value transcribed byte-for-byte from the sketch.
- Below 760px the header stacks single-column with no halftone (existing responsive behaviour preserved); the per-row fade-up still plays at all widths.
- `prefers-reduced-motion: reduce` disables all motion and shows the halftone statically.
- The halftone fade has no visible hard edge at 800px or 1440px (700px overflow > 640px mask radius invariant preserved).
- Zero JavaScript added; the `.editions-preview` script, the first-row separator hairline, and the `@media (max-width: 800px)` block are untouched; only `EditionsOverviewBody.astro` changed.
- typecheck + build + artifact + the three targeted e2e specs + the full e2e suite all pass; EDN-06 stays clean.
</success_criteria>

<output>
Create `.planning/quick/260728-lbh-implement-editions-header-personality/260728-lbh-SUMMARY.md` when done.
</output>
</content>
</invoke>
