# Phase 10: Unified Header & Simplified Language Switcher - Research

**Researched:** 2026-07-15
**Domain:** Astro 7 component extraction (slots/props/scoped-CSS), zero-hydration client-side state-driven styling, Playwright selector migration
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Header consolidation architecture (HOME-10)**
- **D-01:** Extract a standalone `<SiteHeader>` component (new file) containing the logo (`.logo-mark` + hover crossfade), nav (`.nav-link`s), language switcher, and a slot for optional page-specific extra content (the carousel/grid toggle). `BaseLayout.astro` renders `<SiteHeader variant={headerVariant} />` internally instead of its current inline `<header>...</header>` markup. `index.astro`/`en/index.astro` render `<SiteHeader>` directly too (still via `<BaseLayout headerVariant="none">` to suppress BaseLayout's own header render, exactly as today), passing the mode-toggle into `<SiteHeader>`'s slot. One real shared component, not two independently-styled implementations.
- **D-02:** Carousel display mode maps to the header's existing `'transparent'` variant (photo scrim background, white logo/text, no hairline border) and grid display mode maps to the existing `'solid'` variant (white background, black logo/text, hairline border) — no new variant values invented. The homepage swaps which of these two *already-existing* variants is active based on `[data-display-mode]`, reusing the exact same CSS mechanism `<SiteHeader>` already needs for About/Contact (solid) and gallery-detail (transparent).
- **D-03:** The Instagram icon link (currently homepage-nav-only, added in Phase 7/HOME-04) moves into `<SiteHeader>`'s nav itself — not passed through the optional-extras slot — so it renders identically on every page: About, Contact, gallery-detail, and the homepage. No footer/in-content Instagram links exist today (`social-links.spec.ts` already locks "Instagram is absent from the site-wide footer" — that stays true; only the About/Contact in-content "follow me on Instagram" body-copy mentions are separate and untouched by this phase).
- **D-04:** The carousel/grid mode-toggle button is the ONLY thing that goes through `<SiteHeader>`'s optional-extras slot — it is inherently homepage-only functionality and must not render on any other page.

**Class-name / test-contract unification scope**
- **D-05:** Rename to ONE unified class/attribute set — `.site-header`, `.logo-mark`, `.nav-link`, etc. (BaseLayout's existing names) render everywhere, including the homepage. `.home-header`, `.home-nav`, `.home-logo`, and the `[data-role="home-header"]` attribute are retired entirely, not kept as aliases. `[data-role="mode-toggle"]` stays as-is.
- **D-06:** The handful of existing Phase 7/HOME-04/HOME-05 e2e tests that currently key off `.home-nav`, `[data-role="home-header"]` (in `tests/e2e/homepage.spec.ts` and `tests/e2e/i18n.spec.ts`) get updated to the new unified selectors as part of this phase's own test changes — this is an expected, contained consequence of true unification, not a regression to avoid.

**Language switcher redesign (I18N-04)**
- **D-07:** The switcher link shows a small globe icon (leading, before the text) followed by just the language code of the OTHER language — "EN" when on a French page, "FR" when on an English page — not a fuller name like "English"/"Français".
- **D-08:** Only ONE link renders (the other-language link) — the current-language link and the `|` separator both disappear entirely. `getSwitcherHref` only needs to be called for the non-current locale now.
- **D-09:** The globe icon is a dependency-free inline SVG using `currentColor`, matching the "no icon library" convention already used for the mode-toggle's morph icon and the Instagram icon — not an emoji, not an icon font.
- **D-10:** Preserve the existing cookie-write-on-click behavior (`ajs_locale` cookie, `data-locale` attribute) and the click destination (still the translated version of the current page, computed via `getSwitcherHref`) exactly as today — only the visual/DOM presentation changes.
- **D-11:** Keep an accessible name that says which language you're switching TO (not just "EN"/"FR" visually) — follow the same `sr-only`-hint pattern already established for Instagram's `instagramNewTabHint` (`BaseLayout.astro:76`), e.g. a visually-hidden "Switch to English" / "Passer en français" alongside the compact visible "EN"/"FR" label.

### Claude's Discretion
- Exact SVG path data for the globe icon (D-09) — any standard, recognizable globe glyph is acceptable; verify legibility live at the switcher's size.
- Exact new selector names for the retired `.home-*` classes (D-05) beyond "use BaseLayout's existing `.site-header`/`.logo-mark`/`.nav-link` names" — the planner/executor should pick a coherent full mapping (e.g. whether `[data-role="home-header"]` becomes `[data-role="site-header"]` used everywhere) and apply it consistently.
- Whether `<SiteHeader>`'s optional-extras slot needs a specific name (e.g. `slot="extra"`) or can be the component's default unnamed slot.
- Exact mobile pixel-budget re-measurement once Instagram (now header-wide) and the toggle (homepage-only, via slot) combine on the homepage's mobile layout — follow the same live-measure-and-adjust methodology already established in Phase 7 rather than guessing values upfront.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within HOME-10/I18N-04's scope. No new capabilities were proposed; all decisions were about HOW to implement the two already-scoped requirements.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| HOME-10 | Homepage header is visually identical to the About/Contact header by construction (single shared header component, not two independently-styled implementations) | Architecture Pattern 1 (fixed-prop + CSS-attribute-selector override) resolves how a zero-hydration `<SiteHeader>` can serve both a static (About/Contact/gallery-detail) and a client-toggled (homepage) consumer from one implementation; Pattern 3 resolves the `is:global` scoping decision; Pitfall 1/2 cover the mobile-fit consequences of unification that CONTEXT.md's own decisions don't fully specify |
| I18N-04 | Language switcher shows only the other language (plus a globe icon indicating it's a language control), not both FR/EN — clicking switches directly to the translated version of the current page | Code Examples section provides a concrete `LanguageSwitcher.astro` rewrite satisfying D-07–D-11; Pitfall 3 resolves the accessible-name construction so existing `getByRole('link', {name})`-based tests in `i18n.spec.ts` and `legal.spec.ts` keep passing without code changes to those test files |
</phase_requirements>

## Summary

This phase is a pure refactor with no new runtime dependencies: extract a `<SiteHeader>` component from `BaseLayout.astro`'s inline `<header>` markup, make `HomeCarousel.astro` render that same component instead of its own parallel `.home-header` markup, move the Instagram link into it so it's shared everywhere, and collapse `LanguageSwitcher.astro` from two links to one. The single hardest technical question the phase's own CONTEXT.md raises — "can `<SiteHeader>`'s variant prop be changed client-side after hydration?" — has a definitive answer confirmed against Astro's actual rendering model: **no**. Astro components with no `client:*` directive never re-render in the browser; props are evaluated exactly once, at build/request time. This is not a limitation to work around — it is exactly the mechanism the codebase already uses everywhere else in `HomeCarousel.astro` (logo hover-swap, hero/grid visibility, wordmark sizing, toggle-icon morph, switcher-link color): a single `data-display-mode` attribute mutated by client JS on an ancestor element, with all "reactive" visuals driven by CSS attribute-selectors reading that attribute — never by re-invoking a component or changing its props. `<SiteHeader>` fits this exact pattern: it always renders with a fixed `variant` prop (`transparent` on the homepage, matching the initial carousel state), and the homepage's own `[data-display-mode='grid']` CSS override re-skins the already-rendered solid/transparent markup to look like the other variant — literally porting the override rules `HomeCarousel.astro` already has today from `.home-header` onto `.site-header`.

The second load-bearing finding is a **mobile-budget gap that CONTEXT.md's own framing doesn't fully surface**: `BaseLayout.astro`'s header has **zero** mobile-specific CSS today (no `@media (max-width: 767px)` block at all) — it has never needed one, because About/Contact only ever carried 4 flex items (logo, 2 nav links, switcher). Once Instagram becomes a 3rd nav link (D-03) and `<SiteHeader>` is shared, About/Contact/gallery-detail inherit a mobile-fit problem they've never had before. The correct fix is not to invent new mobile CSS for `<SiteHeader>` but to **port forward** `HomeCarousel.astro`'s already-live-tested mobile pixel-budget CSS (`flex-wrap: wrap`, trimmed inter-item/nav gaps, trimmed nav-link padding) — the homepage's header CSS is the mature implementation; BaseLayout's is the untested one.

Third, the test-selector audit CONTEXT.md asked for is now complete: beyond `homepage.spec.ts` and `i18n.spec.ts` (named in CONTEXT.md), `tests/e2e/legal.spec.ts` also depends on switcher click behavior via `getByRole('link', { name: 'EN' | 'FR' })` — it needs no selector change (Playwright's default substring match still resolves), but it is a real dependency that was not enumerated in CONTEXT.md's canonical refs and must not be missed during verification.

**Primary recommendation:** Extract `<SiteHeader>` using BaseLayout's existing `.site-header`/`.logo-mark`/`.nav-link` names and `is:global` scoping (not scoped `<style>`) as the canonical implementation, but graft `HomeCarousel.astro`'s mobile `@media` block onto it (translated to the new class names) rather than starting mobile CSS from scratch. Drive the homepage's carousel/grid visual swap entirely through the existing `[data-display-mode]` CSS-attribute-selector pattern, with `<SiteHeader variant="transparent">` as the one-time, fixed render.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Shared header markup/CSS (logo, nav, switcher, slot) | Browser/Client (static HTML, zero JS hydration) | — | `<SiteHeader>` is a pure Astro `.astro` component — server/build-rendered to static HTML, no framework runtime; this is consistent with every other chrome element in the codebase (no islands used for header/nav) |
| Carousel/grid visual variant switching | Browser/Client (vanilla JS + CSS attribute-selectors) | — | Existing `HomeCarousel.astro` `<script>` (no `client:*`, plain module script) mutates one `data-display-mode` attribute; CSS reacts. `<SiteHeader>` must plug into this exact mechanism, not invent a second one |
| Mode-toggle button (homepage-only) | Browser/Client (slot content, vanilla JS) | — | Passed into `<SiteHeader>`'s optional slot from `HomeCarousel.astro`; the button's own click handler and CSS remain in `HomeCarousel.astro`, unaffected by the extraction |
| Language switcher href computation | Frontend Server (SSR/build-time) | — | `getSwitcherHref()` runs in Astro frontmatter at build time (static output, no runtime server) — pure build-time URL computation, unchanged by this phase |
| Language switcher cookie write + navigation | Browser/Client (vanilla JS `<script>`) | — | `LanguageSwitcher.astro`'s existing inline script sets `ajs_locale` cookie on click; D-10 preserves this exactly, only the DOM (one link, not two) changes |
| CSS scoping decision (global vs component-scoped) | Build tooling (Astro compiler) | — | Astro's `<style>` vs `<style is:global>` is resolved entirely at build time by the Astro compiler — no runtime tier involved; the decision only affects which CSS rules exist in the final static bundle |

## Standard Stack

No new libraries are introduced by this phase. This section documents which existing, already-adopted mechanisms this phase must reuse rather than reinvent.

### Core (reused, unchanged)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | 7.0.9 (project pins `7.0.6`; `7.0.9` is current per `npm view astro version`) [VERIFIED: npm registry] | Component/slot/props system for `<SiteHeader>` | Already the project's sole rendering framework; no adapter or hydration directive needed since the header has zero interactivity of its own |
| `astro:i18n` (built-in) | Astro 7 core | `getRelativeLocaleUrl()` for nav/logo hrefs inside `<SiteHeader>` | Already used identically in `BaseLayout.astro` and `HomeCarousel.astro` — no change |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Astro named slot (`<slot name="extra" />`) for the mode-toggle | Astro default/unnamed slot | Functionally equivalent for a single piece of optional content (CONTEXT.md explicitly leaves this to Claude's Discretion). Named slot is marginally more self-documenting given `<SiteHeader>` will also need `<LanguageSwitcher />` and nav content in its own template — a stray child element passed without `slot="extra"` from a future page would silently land in the wrong place if using the unnamed default slot with other unnamed content already inside. Recommendation: use a named slot (`extra`). |
| CSS-attribute-selector-driven variant override (recommended) | A second `client:*`-hydrated island wrapping `<SiteHeader>` that re-renders on toggle | Rejected: contradicts the codebase's established "vanilla JS island via inline `<script>`, no framework" convention (confirmed no other component in the codebase uses `client:*`), and is unnecessary — the existing zero-hydration attribute-selector mechanism already solves this exact problem for every other homepage-reactive element |

**Installation:** None — no new packages.

## Package Legitimacy Audit

Not applicable. This phase introduces zero new npm dependencies — it is a pure internal component-extraction and CSS-selector-rename refactor using only Astro, TypeScript, and vanilla JS already present in the project.

## Architecture Patterns

### System Architecture Diagram

```
                     ┌─────────────────────────────────────────┐
                     │              Build time (Astro)          │
                     │                                            │
  index.astro/       │  ┌──────────────┐                         │
  en/index.astro ────┼─▶│ BaseLayout   │ headerVariant="none"     │
                     │  │ .astro       │ (suppresses its own      │
                     │  └──────────────┘  <SiteHeader> render)    │
                     │         │                                  │
                     │         ▼                                  │
                     │  ┌──────────────┐                         │
                     │  │HomeCarousel  │ renders <SiteHeader       │
                     │  │.astro        │  variant="transparent">   │
                     │  └──────┬───────┘  + slot="extra" toggle    │
                     │         │                                  │
  about.astro/       │         ▼                                  │
  contact.astro/     │  ┌──────────────┐                         │
  galleries/[slug] ──┼─▶│ BaseLayout   │ headerVariant="solid" |   │
  .astro             │  │ .astro       │ "transparent" (default)  │
                     │  └──────┬───────┘                         │
                     │         ▼                                  │
                     │  ┌──────────────────────────────┐          │
                     │  │      <SiteHeader variant>     │◀─────────┤ ONE component,
                     │  │  logo-mark + nav(+Instagram)  │          │ rendered from
                     │  │  + <slot name="extra" />      │          │ 2 call sites
                     │  │  + <LanguageSwitcher/>        │          │ (BaseLayout,
                     │  └──────────────────────────────┘          │  HomeCarousel)
                     └─────────────────────────────────────────────┘
                                       │
                                       ▼  (static HTML shipped, zero header JS hydration)
                     ┌─────────────────────────────────────────────┐
                     │              Browser (runtime)                │
                     │                                                │
                     │  HomeCarousel's <script> (no client:* — plain  │
                     │  module script) listens for toggle clicks:     │
                     │                                                │
                     │    root.dataset.displayMode = 'grid' | 'carousel'│
                     │                     │                          │
                     │                     ▼                          │
                     │  CSS attribute selectors react (already-       │
                     │  rendered <SiteHeader> markup is RE-SKINNED,    │
                     │  never re-rendered):                            │
                     │                                                │
                     │  .home[data-display-mode='grid']                │
                     │    .site-header--transparent { /* look solid */ }│
                     │                                                │
                     │  LanguageSwitcher's own <script> (unchanged):   │
                     │    click → write ajs_locale cookie → navigate   │
                     └─────────────────────────────────────────────────┘
```

### Recommended Project Structure
```
src/
├── components/
│   ├── SiteHeader.astro       # NEW — extracted from BaseLayout.astro's inline <header>
│   ├── HomeCarousel.astro     # renders <SiteHeader> instead of its own <header class="home-header">
│   └── LanguageSwitcher.astro # simplified to one link + globe icon (D-07..D-11)
├── layouts/
│   └── BaseLayout.astro       # renders <SiteHeader variant={headerVariant} /> internally when headerVariant !== 'none'
└── lib/
    └── i18n-paths.ts          # unchanged — getSwitcherHref() reused, called once per render instead of twice
```

### Pattern 1: Fixed-prop component + CSS-attribute-selector override (the ONLY correct way to make `<SiteHeader>` "react" to homepage toggle state)

**What:** Astro components have no client-side re-render path. `<SiteHeader variant="transparent">` renders to static HTML exactly once. Any subsequent visual change (carousel→grid) must be pure CSS reacting to a DOM attribute mutation on an ancestor, never a prop change.

**When to use:** Any time a zero-hydration Astro component needs to visually respond to later client-side state, in this codebase.

**Example (existing, proven pattern — HomeCarousel.astro today, to be re-scoped onto `.site-header`):**
```astro
<!-- HomeCarousel.astro frontmatter — unchanged mechanism -->
<section class="home" data-display-mode="carousel">
  <SiteHeader variant="transparent" ...>
    <button slot="extra" data-role="mode-toggle" data-action="toggle-mode">...</button>
  </SiteHeader>
  ...
</section>
```
```css
/* Ported from HomeCarousel.astro's existing .home-header override block,
   re-scoped from .home-header onto .site-header (or its --transparent
   modifier) — same technique, new selector target. */
.home[data-display-mode='grid'] .site-header--transparent {
  position: static;
  background: none;
  color: var(--color-ink);
}
.home[data-display-mode='grid'] .site-header--transparent .nav-link {
  color: inherit; /* undo the --transparent variant's forced white nav text */
}
```
```js
// The <script> only ever mutates the attribute — it never touches
// <SiteHeader>'s own DOM subtree directly, matching every other
// display-mode-reactive element in this file (logo swap, wordmark, toggle icon).
root.dataset.displayMode = goingToGrid ? 'grid' : 'carousel';
```
Source: verified against Astro's documented rendering model — "[Astro components] don't render on the client. They render to HTML either at build-time or on-demand" and "all [frontmatter] JavaScript... will be stripped from the final page sent to your users' browsers" [CITED: docs.astro.build/en/basics/astro-components/].

### Pattern 2: Named slot for optional, page-specific extra content

**What:** `<slot name="extra" />` inside `<SiteHeader>`; parent components pass a `slot="extra"` attribute on the single child element they want routed there.

**When to use:** The mode-toggle button (D-04) — the only content that flows through this slot.

**Example:**
```astro
<!-- SiteHeader.astro -->
<header class:list={['chrome-band', 'site-header', `site-header--${variant}`]} data-role="site-header">
  <a href={homeHref} class="logo-mark" aria-label={siteTitle}>...</a>
  <nav class="site-nav" aria-label="Primary">
    <a href={aboutHref} class="nav-link">{aboutLabel}</a>
    <a href={contactHref} class="nav-link">{contactLabel}</a>
    <a href={instagramUrl} target="_blank" rel="noopener noreferrer" class="nav-link" aria-label={`Instagram ${instagramLabel}`}>
      <svg aria-hidden="true">...</svg>
      <span class="sr-only">{instagramNewTabHint}</span>
    </a>
  </nav>
  <slot name="extra" />
  <LanguageSwitcher />
</header>
```
```astro
<!-- HomeCarousel.astro — parent passing content into the named slot -->
<SiteHeader variant="transparent" siteTitle={wordmark} homeHref={homeHref} ...>
  <button slot="extra" type="button" class="home-toggle" data-role="mode-toggle" data-action="toggle-mode" ...>
    ...
  </button>
</SiteHeader>
```
Named slots must be an **immediate child** of the component invocation (cannot be passed through nested wrapper elements) — the `<button slot="extra">` must be a direct child of `<SiteHeader>` in the markup, not nested inside another `<div>` first [CITED: docs.astro.build/en/basics/astro-components/].

### Pattern 3: `is:global` scoping for the extracted component (not Astro's default scoped `<style>`)

**What:** Astro's default component `<style>` block is auto-scoped (a `data-astro-cid-*` attribute is appended to every element/selector). `BaseLayout.astro`'s CURRENT header CSS already lives inside a `<style is:global>` block (verified: lines 208-332 of `BaseLayout.astro`, which include `.site-header`, `.logo-mark`, `.nav-link` etc. inside the same global block as `:root` tokens), NOT Astro's default scoped mode.

**Why this matters for extraction:** If `<SiteHeader>`'s own `<style>` block is left as Astro's DEFAULT (scoped), two problems appear:
1. `HomeCarousel.astro`'s existing mobile `@media` overrides and the homepage's `[data-display-mode]` overrides (which live in `HomeCarousel.astro`'s OWN `<style>` block, a sibling file, not inside `<SiteHeader>` itself) would need `:global(...)` wrappers to reach into `<SiteHeader>`'s scoped-hashed classes — exactly the pattern already visible today at `HomeCarousel.astro` lines 860-867 (`.home-header :global(.switcher-link)`), because `LanguageSwitcher.astro`'s own `<style>` IS scoped by default and `HomeCarousel.astro` needs `:global()` to reach inside it from outside.
2. `LanguageSwitcher` is invoked from BOTH `BaseLayout` (global styles) and `HomeCarousel` (needs to override switcher-link color per display-mode) — an unscoped `<SiteHeader>` avoids forcing every cross-component override throughout this phase to use `:global()` wrappers.

**Recommendation:** Keep `<SiteHeader>`'s own `<style>` as `is:global`, matching `BaseLayout.astro`'s current convention for this exact CSS (literally the same rules, just relocated to a new file) — do NOT let it default to Astro's scoped mode. `LanguageSwitcher.astro`'s own `<style>` block can remain scoped (unchanged; it already needs `:global()` wrapping when overridden externally today, and that continues to work identically regardless of where the override lives).

Source: Astro's own scoping model — "Any `<style>` tag placed inside a `.astro` component is scoped to that component" by default; `is:global` opts out entirely, "Astro will stop processing those selectors with the scoped hash. It will behave like normal CSS" [CITED: docs.astro.build/en/guides/styling/].

### Anti-Patterns to Avoid
- **Re-invoking `<SiteHeader>` or mutating its props from client JS:** Astro components have no client runtime; there is nothing to "re-invoke." Any code that tries to change `<SiteHeader>`'s variant after page load via JS (rather than mutating a data-attribute that CSS reacts to) reflects a misunderstanding of Astro's rendering model and will silently do nothing.
- **Leaving `<SiteHeader>`'s mobile CSS unwritten because "BaseLayout's header already works on mobile":** It has never been tested at a 3-nav-link width (Instagram is new to About/Contact/gallery-detail via D-03) — this WILL overflow/wrap ungracefully without porting `HomeCarousel.astro`'s existing `@media (max-width: 767px)` trims.
- **Hiding the visible language-code text from the accessible name (`aria-hidden` on the wrong element):** Wrap only the decorative globe SVG in `aria-hidden="true"`. If the visible "EN"/"FR" text span is also `aria-hidden`, the link's accessible name becomes ONLY the sr-only hint text, silently breaking every existing `getByRole('link', { name: 'EN' | 'FR' })` locator across `i18n.spec.ts`, `legal.spec.ts`, and (implicitly, via the same pattern) any future test — see Pitfall 3.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| "Component reacts to later client state" | A custom re-render/hydration shim, or a framework island (`client:load` React/Preact wrapper) just for the header | The existing `data-display-mode` attribute + CSS attribute-selector pattern already used throughout `HomeCarousel.astro` | Adding hydration for a header that has zero interactivity of its own (the toggle button is the only interactive element, and it already works via a plain click listener) would be pure regression — more JS shipped, a new mental model, for a problem the codebase has already solved elsewhere |
| Language switcher's target-locale URL computation | A second, parallel one-off URL builder inside `LanguageSwitcher.astro` | `getSwitcherHref(pathname, targetLocale)` (unchanged, `src/lib/i18n-paths.ts`) — call it once instead of twice | Already handles base-path stripping, trailing-slash normalization, and the missing-translation fallback (D-04); duplicating any of that logic risks silently diverging from the unit-tested contract in `tests/unit/i18n-paths.test.ts` |

**Key insight:** Nothing in this phase requires new logic — every mechanism needed (attribute-selector reactivity, slot passing, `getSwitcherHref`, the sr-only hint convention) already exists in the codebase from prior phases. The work is entirely extraction, renaming, and re-scoping existing, already-proven code — not new invention.

## Runtime State Inventory

Not applicable — this is a pure code/CSS/markup refactor phase. No databases, external service configs, OS-registered state, secrets, or build artifacts reference the strings being renamed (`.home-header`, `.home-nav`, `.home-logo`, `[data-role="home-header"]`). Confirmed by search: these strings appear only in `src/components/HomeCarousel.astro` and the test files enumerated below — no Sanity schema field names, env vars, or CI config reference them.

## Common Pitfalls

### Pitfall 1: Copying BaseLayout's header CSS wholesale into `<SiteHeader>` regresses About/Contact/gallery-detail on mobile
**What goes wrong:** `BaseLayout.astro` currently has **no** `@media (max-width: 767px)` rules at all for its header (confirmed: only one `@media (min-width: 768px)` block exists, for `.chrome-band` padding). Its header has never needed mobile tuning because it only ever carried 4 flex items with no wrap/gap trimming. Once Instagram becomes a 3rd `.nav-link` (D-03) and the switcher/nav share the same generic `.site-header` styling on every page, a narrow viewport (the same 393px baseline Phase 7 tuned for) can overflow or wrap ungracefully on About/Contact/gallery-detail — pages that were never exercised at this item-density before.
**Why it happens:** BaseLayout's header and HomeCarousel's header evolved independently (exactly the duplication this phase exists to fix) — only the homepage's version received the Phase 7 mobile pixel-budget work.
**How to avoid:** Port `HomeCarousel.astro`'s existing `@media (max-width: 767px)` block (lines ~1524-1571: `flex-wrap: wrap`, `gap: var(--space-xs)` on both the header and nav, trimmed `.nav-link` padding) into `<SiteHeader>`'s own stylesheet, translated to the unified class names, rather than treating BaseLayout's untested mobile behavior as the baseline.
**Warning signs:** Horizontal scroll/overflow or a wrapped second header row on About/Contact at ~375-428px viewport widths once Instagram is added; verify via the same `document.documentElement.scrollWidth <= window.innerWidth` check the existing `homepage.spec.ts` Instagram mobile-fit test already uses (line ~443), extended to About/Contact.

### Pitfall 2: Recomputing the mobile pixel budget from scratch instead of using Phase 7's documented starting numbers
**What goes wrong:** Guessing at gap/padding trims wastes the exact live-measurement work Phase 7 already did and risks landing on different (worse) numbers.
**Why it happens:** The temptation to "just try a value and see" without reading the existing, detailed comment trail.
**How to avoid:** Start from `HomeCarousel.astro`'s own documented baseline math (comment at ~line 1523-1546): at 393px, the current 5-item homepage row (logo 56px + nav ~161.5px incl. Instagram + toggle 44px + switcher ~79.4px + 3×4px header gaps) uses ~385px of 393px available. This phase changes BOTH sides of that equation: the switcher shrinks substantially (I18N-04 removes one link + the separator), and About/Contact gain a 3rd nav item they didn't have before with NO existing toggle button to compete with. Re-measure live from these numbers, per CONTEXT.md's own Claude's Discretion — do not assume the new switcher width without measuring the actual rendered globe-icon + one-language-code markup.
**Warning signs:** A test failure/visual wrap that "shouldn't happen" per hand-calculated math — trust live browser measurement (`getBoundingClientRect()`/Playwright `boundingBox()`) over arithmetic, as every prior Phase 6/7 pixel-budget comment in this file explicitly does.

### Pitfall 3: Hiding the visible "EN"/"FR" label from the accessible name breaks 3 existing test files
**What goes wrong:** If the compact visible language-code span is marked `aria-hidden="true"` (e.g. treating BOTH the globe icon AND the code as "decorative" and relying solely on the D-11 sr-only hint for the accessible name), the link's computed accessible name becomes only the hint text (e.g. "Switch to English"), with no "EN" substring in it.
**Why it happens:** A natural (but incorrect) reading of D-11's "compact visible EN/FR + sr-only hint" instruction might treat the whole visible content as purely decorative, hiding it from assistive tech to avoid double-announcing.
**How to avoid:** Only `aria-hidden` the globe SVG glyph itself. The visible "EN"/"FR" text node must remain part of the accessible name (not `aria-hidden`), with the sr-only hint as an ADDITIONAL text node inside the same link — per the ARIA accessible-name computation algorithm, `aria-hidden="true"` descendants are excluded from name computation, but non-hidden text nodes are concatenated in DOM order [ASSUMED — standard WAI-ARIA accname behavior, not independently re-verified this session, but foundational/stable web-platform behavior]. This preserves `getByRole('link', { name: 'EN' })`/`{ name: 'FR' }` substring-matching used in `tests/e2e/i18n.spec.ts` (lines 46, 53, 60) and `tests/e2e/legal.spec.ts` (lines 123, 134) — Playwright's `name` filter does case-insensitive substring matching by default (not exact) [CITED: playwright.dev accessibility locators], so "EN" (or "FR") anywhere in the concatenated accessible name still resolves correctly to the single remaining link, with no ambiguity since I18N-04 removes the other-language link entirely.
**Warning signs:** `i18n.spec.ts`'s switcher-click tests and `legal.spec.ts`'s switcher-click tests failing with "no element found for role link with name EN" after the switcher simplification ships.

### Pitfall 4: Forgetting `legal.spec.ts` in the test-selector audit
**What goes wrong:** CONTEXT.md's own canonical-refs Tests section names only `homepage.spec.ts` and `i18n.spec.ts` as needing updates for D-06 (selector rename) and I18N-04 (switcher text). `tests/e2e/legal.spec.ts` also has a `test.describe('switcher', ...)` block (lines 118-137+) that clicks `page.locator('header').getByRole('link', { name: 'EN' })`/`{'FR'}` to verify mentions-légales/confidentialité page locale-switching — it is not mentioned in CONTEXT.md but shares the exact same dependency as `i18n.spec.ts`.
**Why it happens:** CONTEXT.md's test audit was scoped to files explicitly touching `.home-*`/`[data-role="home-header"]` selectors (the D-05 rename scope) plus the literal "FR | EN" text assertion — it did not separately search for every file depending on switcher CLICK behavior, which is a broader set.
**How to avoid:** This is fixed automatically by Pitfall 3's fix (keep "EN"/"FR" in the accessible name) — `legal.spec.ts` needs NO code changes as long as the accessible-name substring stays intact. Still worth an explicit verification run of `legal.spec.ts` post-implementation, since it wasn't named in CONTEXT.md's audit and could otherwise be missed during manual spot-checking.
**Warning signs:** `legal.spec.ts`'s two switcher tests failing while `i18n.spec.ts`'s (the ones actually checked) pass — a sign the accessible name changed in a way that broke substring matching only for some pages/contexts.

## Code Examples

### Globe icon (D-09) — dependency-free inline SVG, `currentColor`, matching the Instagram/toggle-icon convention already in `HomeCarousel.astro`
```astro
<!-- Any standard, recognizable globe glyph is acceptable per CONTEXT.md's
     Claude's Discretion — verify legibility live at the switcher's actual
     rendered size (14px label-role text, 44px tap target), same precedent
     as Phase 7's Instagram icon. -->
<svg
  width="16"
  height="16"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.6"
  aria-hidden="true"
>
  <circle cx="12" cy="12" r="9.5" />
  <ellipse cx="12" cy="12" rx="4.2" ry="9.5" />
  <line x1="2.5" y1="12" x2="21.5" y2="12" />
</svg>
```

### Simplified `LanguageSwitcher.astro` (D-07–D-11) — one link, computed once
```astro
---
import { getSwitcherHref } from '../lib/i18n-paths';

const currentLocale = Astro.currentLocale === 'en' ? 'en' : 'fr';
const targetLocale = currentLocale === 'fr' ? 'en' : 'fr';
const targetHref = getSwitcherHref(Astro.url.pathname, targetLocale);
const targetLabel = targetLocale === 'en' ? 'EN' : 'FR';
// D-11: mirrors BaseLayout.astro's existing instagramNewTabHint sr-only
// pattern (BaseLayout.astro:76) — locale-conditional hidden hint naming
// the language you'd switch TO, not just the compact visible code.
const switchHint = targetLocale === 'en' ? 'Passer en anglais' : 'Passer en français';
---
<nav class="language-switcher" aria-label="Language switcher">
  <a href={targetHref} class="switcher-link" data-locale={targetLocale}>
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
      <circle cx="12" cy="12" r="9.5" />
      <ellipse cx="12" cy="12" rx="4.2" ry="9.5" />
      <line x1="2.5" y1="12" x2="21.5" y2="12" />
    </svg>
    {targetLabel}
    <span class="sr-only">{' '}{switchHint}</span>
  </a>
</nav>
<!-- <script> block (cookie write) is UNCHANGED from today — D-10 — only
     re-scope the querySelectorAll to match the single .switcher-link, which
     it already does with no change needed since it's not link-count-specific. -->
```
Note the `switchHint` copy above uses "Passer en anglais"/"Passer en français" rather than "Switch to English" for the French-page case, since the sr-only hint should be phrased in the CURRENT page's language, not the target's (matching how `instagramNewTabHint` in `BaseLayout.astro` is also phrased in the current locale, not translated into the linked destination's language) [ASSUMED — reasonable inference from the existing `instagramNewTabHint` precedent, not independently re-confirmed against a French-language accessibility style guide this session; flag for a quick live read-aloud/VoiceOver check during the phase's UI checkpoint].

## State of the Art

Not applicable — no external ecosystem/library versions changed since the codebase's prior phases; this is an internal architecture consolidation.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | ARIA accessible-name computation excludes `aria-hidden="true"` descendants and concatenates remaining text nodes in DOM order | Pitfall 3 | Low — this is foundational, decades-stable web-platform/WAI-ARIA behavior; if somehow wrong, live testing during the phase's checkpoint (Playwright accessibility tree inspection or a screen reader spot-check) would surface it immediately, and the existing `getByRole` tests would fail loudly rather than silently |
| A2 | The sr-only language-switcher hint should be phrased in the CURRENT page's language (matching `instagramNewTabHint`'s existing pattern), not the target locale's language | Code Examples | Low — cosmetic/copy-only; wrong phrasing doesn't break functionality or any locked test assertion, only affects screen-reader UX polish; easy to correct post-hoc if a native French speaker (the actual site owner, Romane) flags it |

## Open Questions

1. **Exact final mobile pixel-budget numbers for the unified `<SiteHeader>` on both the homepage (5-6 items) and About/Contact/gallery-detail (now 4 items: logo, 3 nav links, switcher — no toggle)**
   - What we know: Phase 7's exact starting formula for the homepage's 5-item row at 393px (documented in `HomeCarousel.astro` ~line 1523); BaseLayout has zero existing mobile tuning to build on for the 4-item About/Contact case.
   - What's unclear: The switcher's new rendered width (globe icon + 1 language code, replacing "FR | EN") has not been measured live — CONTEXT.md's own Claude's Discretion explicitly defers this to live measurement rather than guessing.
   - Recommendation: Treat this as a live-measurement task during plan execution (per the established Phase 6/7 methodology: measure via `getBoundingClientRect()`/Playwright `boundingBox()` at the real target viewport, not hand-calculated), not something to resolve definitively in planning docs.

2. **Whether `<SiteHeader>`'s `variant` prop type should keep BaseLayout's current 3-value union (`'solid' | 'transparent' | 'none'`) or drop `'none'` now that `<SiteHeader>` itself is only ever rendered when a header IS wanted**
   - What we know: `'none'` currently exists solely so `BaseLayout.astro` can suppress its own header render for the homepage (which renders its own header instead) — this suppression logic can equally live in `BaseLayout.astro`'s own conditional (`{headerVariant !== 'none' && <SiteHeader variant={headerVariant} />}`) rather than being a value `<SiteHeader>` itself needs to understand.
   - What's unclear: No functional difference either way — pure API-surface cleanliness question.
   - Recommendation: `<SiteHeader>`'s own `Props.variant` should be typed `'solid' | 'transparent'` only (2 values); `BaseLayout.astro` keeps its existing 3-value `headerVariant` prop and its existing `!== 'none'` conditional around the `<SiteHeader>` call, unchanged from today's conditional around the inline `<header>`.

## Environment Availability

Skipped — this phase has no external tool/service/runtime dependencies beyond the project's existing Astro/Node/Playwright/Vitest toolchain, all already installed and verified working by prior phases.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright 1.61.1 (e2e) + Vitest (unit) |
| Config file | `playwright.config.ts` (single `chromium` project, `baseURL: http://localhost:4321`), `vitest.config.ts` |
| Quick run command | `npx playwright test tests/e2e/homepage.spec.ts tests/e2e/i18n.spec.ts tests/e2e/legal.spec.ts --project=chromium` |
| Full suite command | `npm run test:e2e && npm run test:unit` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HOME-10 | Homepage header renders via the same `<SiteHeader>` component as About/Contact (not a parallel implementation) | e2e (selector rename) | `npx playwright test tests/e2e/homepage.spec.ts -g "site-header\|header"` | Update existing — `homepage.spec.ts` lines 94-96, 562, 617 (`[data-role="home-header"]` → `[data-role="site-header"]`) |
| HOME-10 | A header-level change in the shared component reflects identically on homepage and About/Contact | e2e (new, not yet written) | New test needed — e.g. assert `.nav-link` count/order matches across `/`, `/about/`, `/contact/` | ❌ Wave 0 |
| HOME-10 | Mode-toggle still renders/functions on homepage only, not on About/Contact | e2e (existing, unaffected) | `npx playwright test tests/e2e/homepage.spec.ts -g "mode toggle"` | Exists (`[data-role="mode-toggle"]`-keyed tests, D-05 confirms unaffected) |
| I18N-04 | Switcher shows only the other-language link + globe icon | e2e (rewrite) | `npx playwright test tests/e2e/i18n.spec.ts -g "switcher"` | Update existing — `i18n.spec.ts` lines 15-27 (`toContainText('FR | EN')` → new one-link assertion), `homepage.spec.ts` lines 94-96 |
| I18N-04 | Clicking the switcher navigates to the translated version of the current page | e2e (existing, verify substring-name resilience) | `npx playwright test tests/e2e/i18n.spec.ts tests/e2e/legal.spec.ts -g "switcher"` | Exists — no code change needed if Pitfall 3's fix is applied correctly; run as a regression check |

### Sampling Rate
- **Per task commit:** `npx playwright test tests/e2e/homepage.spec.ts tests/e2e/i18n.spec.ts --project=chromium` (fastest feedback on the two most-affected files)
- **Per wave merge:** `npm run test:e2e && npm run test:unit` (full suite — catches `legal.spec.ts`/`about.spec.ts`/`contact.spec.ts`/`social-links.spec.ts`/`gallery.spec.ts`/`seo.spec.ts` regressions from the shared-component change)
- **Phase gate:** Full suite green before `/gsd-verify-work`, plus a live mobile-viewport visual check (373-428px) of About/Contact's header now carrying Instagram + the shrunk switcher — this class of regression (BaseLayout header wrap/overflow) has no existing automated test and must be spot-checked, per Pitfall 1

### Wave 0 Gaps
- [ ] A new e2e assertion proving `<SiteHeader>` is literally the same component on 2+ pages (e.g. identical `nav-link` DOM structure/order between `/` and `/about/`) — none of the existing tests assert "same component," only "correct content per page"; without this, a regression to two-parallel-implementations could pass all existing tests
- [ ] A new e2e assertion for About/Contact/gallery-detail's mobile header fit at 393px with Instagram added (mirroring the existing homepage-only assertion at `homepage.spec.ts` line 434-448) — currently only the homepage's mobile header-overflow is guarded
- [ ] `tests/e2e/i18n.spec.ts` lines 15-27 and `homepage.spec.ts` lines 90-103 need direct rewriting (not additive) — the literal `'FR | EN'` text assertion is provably false after this phase ships, per I18N-04's own definition

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Site has no authentication (guest-only per project's Out of Scope) |
| V3 Session Management | Marginal | `ajs_locale` cookie (unchanged mechanism, D-10) — already `SameSite=Lax; Secure`, base-path-scoped (WR-02); this phase does not touch cookie-write logic |
| V4 Access Control | No | No access-controlled resources in this phase |
| V5 Input Validation | No | No new user input surfaces — this phase adds zero new form fields, query params, or user-controlled data paths; all hrefs are computed server-side from locale/slug values already validated elsewhere |
| V6 Cryptography | No | Not applicable |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| None newly introduced | — | This phase is a pure presentational/structural refactor of already-static, already-trusted content (nav labels, hrefs sourced from `getRelativeLocaleUrl`/`getSwitcherHref`, both already build-time-computed, no new externally-controlled input reaches the DOM) |

No new threat surface is introduced by this phase — flagged explicitly per `security_enforcement: true` in `.planning/config.json`, confirming the phase was evaluated against ASVS categories rather than skipped.

## Project Constraints (from CLAUDE.md)

| Directive | Relevance to this phase |
|-----------|-------------------------|
| Astro 7 static output (`output: 'static'`), no SSR adapter (OVH static-hosting constraint) | `<SiteHeader>` must remain a pure build-time-rendered component with zero server-runtime dependency — consistent with this research's core finding (no client-side re-render possible or needed) |
| No Cloudflare/Vercel adapter, OVH Apache static file server as deploy target | Not implicated — this phase makes no deployment/hosting changes |
| Non-technical maintainer (Romane) self-serves content via Sanity | Not implicated — no Sanity schema changes in this phase (nav labels/copy already come from `siteSettings`/`site-config.ts`, unchanged) |
| GSD Workflow Enforcement — file edits only through a GSD command | This RESEARCH.md itself is produced under `/gsd-plan-phase`; the eventual implementation must go through `/gsd-execute-phase`, per CLAUDE.md's enforcement section |

## Sources

### Primary (HIGH confidence)
- `npm view astro version` (executed this session, 2026-07-15) — confirmed current registry version `7.0.9`; project pins `7.0.6` per `package.json`/CLAUDE.md. [VERIFIED: npm registry]
- Direct repository reads (this session): `src/layouts/BaseLayout.astro` (full), `src/components/HomeCarousel.astro` (full, 1828 lines), `src/components/LanguageSwitcher.astro` (full), `src/lib/i18n-paths.ts` (full), `src/pages/galleries/[slug].astro` (full), `src/pages/index.astro`, `src/pages/about.astro`, `tests/e2e/homepage.spec.ts` (full), `tests/e2e/i18n.spec.ts` (full), `tests/e2e/legal.spec.ts` (relevant sections), `tests/e2e/social-links.spec.ts` (full), `tests/unit/i18n-paths.test.ts` (relevant sections), `playwright.config.ts`, `package.json`. All CSS-selector/test-dependency claims in this document are grounded directly in these reads, not inferred.

### Secondary (MEDIUM confidence)
- https://docs.astro.build/en/basics/astro-components/ (WebSearch-surfaced, official Astro docs domain) — component rendering model ("don't render on the client... render to HTML either at build-time or on-demand"), named-slot syntax and the "immediate child" constraint. [CITED: docs.astro.build/en/basics/astro-components/]
- https://docs.astro.build/en/guides/styling/ (WebSearch-surfaced, official Astro docs domain) — scoped-by-default `<style>` behavior and `is:global` opt-out semantics. [CITED: docs.astro.build/en/guides/styling/]
- Playwright `getByRole` accessible-name matching semantics (substring, case-insensitive by default, `exact: true` to change) — consistent with observed test code in this repo (`homepage.spec.ts` line 420 explicitly sets `exact: false`, implying substring is the baseline default) and general Playwright documentation knowledge. [CITED: playwright.dev, cross-referenced against observed repo test code, not independently re-fetched this session]

### Tertiary (LOW confidence)
- ARIA accessible-name computation (`aria-hidden` exclusion, DOM-order text-node concatenation) — foundational, stable web-platform behavior, not independently re-verified against the W3C accname spec this session. [ASSUMED]
- French sr-only hint phrasing convention ("Passer en anglais" vs. mirroring the target locale) — inferred from the existing `instagramNewTabHint` precedent in `BaseLayout.astro`, not confirmed against any French-language accessibility style guide. [ASSUMED]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; all mechanisms already live and proven in this exact codebase
- Architecture: HIGH — the fixed-prop/CSS-attribute-selector pattern is directly confirmed against both Astro's documented rendering model and the codebase's own existing, working implementation of the identical problem
- Pitfalls: HIGH for Pitfalls 1/2/4 (directly grounded in repository reads: BaseLayout's absent mobile CSS, HomeCarousel's documented pixel-budget comments, legal.spec.ts's grep-confirmed switcher dependency); MEDIUM for Pitfall 3 (ARIA accname mechanics are ASSUMED-tier, though foundational/low-risk)

**Research date:** 2026-07-15
**Valid until:** 2026-08-14 (30 days — stable, no fast-moving external dependencies; the only expiry risk is if Astro ships a breaking change to slot/scoping semantics, unlikely within a patch/minor window)
