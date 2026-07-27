# Phase 10: Unified Header & Simplified Language Switcher - Context

**Gathered:** 2026-07-14
**Status:** Ready for planning

<domain>
## Phase Boundary

The highest-risk item in v1.2: a structural refactor consolidating the homepage's own header implementation with the shared header used by About/Contact/gallery-detail, plus a site-wide language switcher simplification:

1. Extract a single shared `<SiteHeader>` component (logo, nav, language switcher, plus an optional slot for page-specific extras) — used by BaseLayout for every non-homepage page AND directly by the homepage, replacing HomeCarousel's parallel `.home-header`/`.home-nav`/`.home-logo` implementation entirely — HOME-10.
2. Simplify `LanguageSwitcher.astro` site-wide to show only a link to the OTHER language plus a small globe icon, instead of both FR and EN — I18N-04.

Does not touch checkout/shop/exhibitions (v2, out of milestone scope), Phase 5's OVH domain cutover, or any visual/interaction behavior already locked by Phases 6/7 (carousel auto-advance, mode-toggle morph, mobile hero) beyond what's needed to route it through the shared component.

</domain>

<decisions>
## Implementation Decisions

### Header consolidation architecture (HOME-10)
- **D-01:** Extract a standalone `<SiteHeader>` component (new file) containing the logo (`.logo-mark` + hover crossfade), nav (`.nav-link`s), language switcher, and a slot for optional page-specific extra content (the carousel/grid toggle). `BaseLayout.astro` renders `<SiteHeader variant={headerVariant} />` internally instead of its current inline `<header>...</header>` markup. `index.astro`/`en/index.astro` render `<SiteHeader>` directly too (still via `<BaseLayout headerVariant="none">` to suppress BaseLayout's own header render, exactly as today), passing the mode-toggle into `<SiteHeader>`'s slot. One real shared component, not two independently-styled implementations.
- **D-02:** Carousel display mode maps to the header's existing `'transparent'` variant (photo scrim background, white logo/text, no hairline border) and grid display mode maps to the existing `'solid'` variant (white background, black logo/text, hairline border) — no new variant values invented. The homepage swaps which of these two *already-existing* variants is active based on `[data-display-mode]`, reusing the exact same CSS mechanism `<SiteHeader>` already needs for About/Contact (solid) and gallery-detail (transparent).
- **D-03:** The Instagram icon link (currently homepage-nav-only, added in Phase 7/HOME-04) moves into `<SiteHeader>`'s nav itself — not passed through the optional-extras slot — so it renders identically on every page: About, Contact, gallery-detail, and the homepage. This is the most literal reading of the phase's own success criterion #2 ("a header-level change made once in the shared component is reflected identically... without a second edit"). No footer/in-content Instagram links exist today (`social-links.spec.ts` already locks "Instagram is absent from the site-wide footer" — that stays true; only the About/Contact in-content "follow me on Instagram" body-copy mentions are separate and untouched by this phase).
- **D-04:** The carousel/grid mode-toggle button is the ONLY thing that goes through `<SiteHeader>`'s optional-extras slot — it is inherently homepage-only functionality (there is no "mode" concept on About/Contact/gallery-detail) and must not render on any other page. This matches the phase's success criterion #3 exactly.

### Class-name / test-contract unification scope
- **D-05:** Rename to ONE unified class/attribute set — `.site-header`, `.logo-mark`, `.nav-link`, etc. (BaseLayout's existing names) render everywhere, including the homepage. `.home-header`, `.home-nav`, `.home-logo`, and the `[data-role="home-header"]` attribute are retired entirely, not kept as aliases. `[data-role="mode-toggle"]` stays as-is (it names an inherently homepage-only interactive element, not a header-duplication artifact, and isn't part of what's being unified).
- **D-06:** The handful of existing Phase 7/HOME-04/HOME-05 e2e tests that currently key off `.home-nav`, `[data-role="home-header"]` (in `tests/e2e/homepage.spec.ts` and `tests/e2e/i18n.spec.ts`) get updated to the new unified selectors as part of this phase's own test changes — this is an expected, contained consequence of true unification, not a regression to avoid. The `[data-role="mode-toggle"]`-keyed tests are unaffected (D-05).

### Language switcher redesign (I18N-04)
- **D-07:** The switcher link shows a small globe icon (leading, before the text) followed by just the language code of the OTHER language — "EN" when on a French page, "FR" when on an English page — not a fuller name like "English"/"Français". Matches the site's existing terse-label convention (Instagram/toggle icons are also minimal, no verbose text).
- **D-08:** Only ONE link renders (the other-language link) — the current-language link and the `|` separator both disappear entirely. `getSwitcherHref` (already computes both `frHref`/`enHref` today) only needs to be called for the non-current locale now.
- **D-09:** The globe icon is a dependency-free inline SVG using `currentColor`, matching the established "no icon library" convention already used for the mode-toggle's morph icon (Phase 6) and the Instagram icon (Phase 7) — not an emoji, not an icon font.
- **D-10:** Preserve the existing cookie-write-on-click behavior (`ajs_locale` cookie, `data-locale` attribute) and the click destination (still the translated version of the current page, computed via `getSwitcherHref`) exactly as today — only the visual/DOM presentation changes (one link instead of two, icon added), not the underlying navigation/cookie mechanism.
- **D-11:** Keep an accessible name that says which language you're switching TO (not just "EN"/"FR" visually) — follow the same `sr-only`-hint pattern already established for Instagram's `instagramNewTabHint` (`BaseLayout.astro:76`), e.g. a visually-hidden "Switch to English" / "Passer en français" alongside the compact visible "EN"/"FR" label, so the icon+code combo doesn't regress screen-reader clarity versus today's `aria-label`-less two-link version.

### Claude's Discretion
- Exact SVG path data for the globe icon (D-09) — any standard, recognizable globe glyph is acceptable; verify legibility live at the switcher's size, following the same "verify live" precedent as Phase 7's Instagram icon (D-01 of `07-CONTEXT.md`).
- Exact new selector names for the retired `.home-*` classes (D-05) beyond "use BaseLayout's existing `.site-header`/`.logo-mark`/`.nav-link` names" — the planner/executor should pick a coherent full mapping (e.g. whether `[data-role="home-header"]` becomes `[data-role="site-header"]` used everywhere) and apply it consistently.
- Whether `<SiteHeader>`'s optional-extras slot needs a specific name (e.g. `slot="extra"`) or can be the component's default unnamed slot — an implementation detail with no visible behavior difference.
- Exact mobile pixel-budget re-measurement once Instagram (now header-wide) and the toggle (homepage-only, via slot) combine on the homepage's mobile layout — follow the same live-measure-and-adjust methodology already established in Phase 7 (`07-CONTEXT.md` D-03) rather than guessing values upfront.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Components being consolidated
- `src/layouts/BaseLayout.astro` — current shared header/footer chrome, `headerVariant` prop (`'solid' | 'transparent' | 'none'`), `.site-header`/`.logo-mark`/`.nav-link` markup and CSS (lines 181-194, 337-476) to be extracted into the new `<SiteHeader>` component. Also owns `LanguageSwitcher` invocation (line 192) and the `instagramNewTabHint` sr-only pattern (line 76, referenced by D-11).
- `src/components/HomeCarousel.astro` — current homepage-only header implementation (`.home-header`/`.home-nav`/`.home-logo`/`.home-toggle`, lines 99-161 markup + associated CSS ~700-900) to be replaced by `<SiteHeader>` usage. Owns the `[data-display-mode]` state (carousel/grid) that D-02 maps onto the solid/transparent variants, and the Instagram nav link (currently homepage-only, D-03 moves it to the shared component).
- `src/components/LanguageSwitcher.astro` — current both-FR-and-EN implementation to be simplified per D-07–D-11. Owns the `ajs_locale` cookie-write click handler and `getSwitcherHref` usage (D-10).
- `src/lib/i18n-paths.ts` — `getSwitcherHref(pathname, targetLocale)`, already computes the target-locale URL; reused unchanged per D-10, just called once instead of twice.

### Prior phase decisions this phase builds on
- `.planning/phases/07-homepage-quick-fixes-mobile-hero-correctness/07-CONTEXT.md` — Instagram icon's exact `href`/`target`/`rel`/`instagramNewTabHint` semantics (D-05) and the live-remeasure mobile-fit methodology (D-03), both reused per this phase's D-03 and Claude's Discretion.
- `.planning/phases/06-homepage-view-mode-toggle-grid-hero-wordmark-cutout/06-CONTEXT.md` — the single unified carousel/grid toggle button (D-01) that this phase threads through `<SiteHeader>`'s slot unchanged (D-04).
- `.planning/phases/04.1-design-system-homepage-refresh/` and `.planning/phases/04.3-homepage-refinements-logo-hover-crossfade-to-match-site-chro/04.3-CONTEXT.md` — the `.logo-mark` hover/crossfade mechanism (`BaseLayout.astro`) that `HomeCarousel.astro`'s `.home-logo` currently duplicates per-display-mode; `<SiteHeader>` needs to preserve BOTH the solid/transparent hover behavior AND the homepage's existing per-mode swap once unified.

### Tests
- `tests/e2e/homepage.spec.ts` — multiple `test.describe` blocks keyed on `.home-nav`, `[data-role="home-header"]`, `[data-role="mode-toggle"]` (HOME-01, HOME-04, HOME-05, HOME-06, HOME-09 blocks). Per D-05/D-06, the `.home-nav`/`[data-role="home-header"]`-keyed assertions need updating to the new unified selectors; `[data-role="mode-toggle"]`-keyed assertions are unaffected.
- `tests/e2e/i18n.spec.ts` — asserts `[data-role="home-header"]` contains literal text "FR | EN" (lines 15-35) — this assertion is now WRONG by design (I18N-04 removes the two-link "FR | EN" text entirely) and must be rewritten to assert the new one-link-plus-icon behavior, independent of the selector rename in D-06.
- `tests/e2e/social-links.spec.ts` — "Instagram is absent from the site-wide footer" — stays true and unaffected by D-03 (Instagram moves into the header nav, not the footer).

### Requirements
- `.planning/REQUIREMENTS.md` — HOME-10, I18N-04 definitions and Phase 10 traceability.
- `.planning/ROADMAP.md` (Phase 10 section) — the five success criteria this phase must satisfy.

**No formal cross-project ADRs/specs** — this phase's requirements are fully captured in REQUIREMENTS.md/ROADMAP.md and the Decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `BaseLayout.astro`'s `.logo-mark`/`.logo-mark__chip`/`.logo-mark__img--default`/`.logo-mark__img--hover` hover-crossfade CSS (lines 399-476) is the direct base for `<SiteHeader>`'s logo — already handles both solid and transparent variants via `.site-header--solid`/`.site-header--transparent` scoping, which D-02 extends to also mean "grid mode"/"carousel mode" on the homepage.
- The Instagram icon's exact inline-SVG markup, `href`/`target`/`rel`/`instagramNewTabHint` attributes (currently in `HomeCarousel.astro`, added Phase 7 D-01/D-05) move into `<SiteHeader>` verbatim per D-03 — no re-derivation needed.
- `--tap-target-min` (44px) and the outer-hit-box/inner-visible-box pattern (`HomeCarousel.astro`'s `.home-toggle`/`.home-toggle__box`, Phase 7 D-08) is unaffected by this phase — the toggle itself doesn't change, only where it's composed from.

### Established Patterns
- Mobile header fit is a live-measured, iterative process (not a fixed formula) — see `HomeCarousel.astro`'s pixel-budget comment (~line 1458) from Phase 7's work fitting 5 items (logo, About, Contact, Instagram, toggle, FR|EN) into 393px. This phase changes that budget twice over: I18N-04 shrinks the switcher (two links + separator → one link + icon), while D-03's Instagram-everywhere move doesn't change the homepage's own item count (Instagram was already there) but does add it to About/Contact's previously-4-item (logo, About, Contact, switcher) mobile row.
- Client-side rendering in `HomeCarousel.astro` reads `[data-display-mode]` off `.home` (the root section) to drive carousel/grid CSS — `<SiteHeader>` needs to observe or receive this same state (via a prop passed from `HomeCarousel.astro`'s existing carousel/grid toggle logic) to know which variant (solid/transparent, per D-02) to render, since the toggle click currently only mutates `.home`'s own attribute, not anything BaseLayout-side.

### Integration Points
- `index.astro`/`en/index.astro` invoke `<BaseLayout headerVariant="none">` then `<HomeCarousel>` — after this phase, `HomeCarousel.astro` (or a thin wrapper) renders `<SiteHeader>` directly with the toggle passed into its slot, replacing the current inline `<header class="home-header">` block entirely.
- Gallery-detail pages (`src/pages/galleries/[slug].astro`) already use `headerVariant="transparent"` via `BaseLayout` — unaffected by this phase except that they now render through the extracted `<SiteHeader>` internally (transparent variant unchanged) and gain the Instagram nav link per D-03 (previously only the homepage had it).

</code_context>

<specifics>
## Specific Ideas

- User chose the more thorough/unifying option at every gray area (extract a real shared component rather than extend BaseLayout ad-hoc; reuse existing solid/transparent variants rather than inventing new ones; rename to one class set rather than keep dual selectors; add Instagram everywhere rather than keep it homepage-only) — consistent with this phase's own stated goal of a genuinely single shared implementation, not a cosmetically-aligned duplicate.
- User confirmed (after a self-corrected, initially-malformed question) that renaming `.home-header`/`.home-nav`/`[data-role="home-header"]` to the unified BaseLayout naming — and updating the Phase 7 e2e tests that currently key off the old names — is the intended, expected outcome of this phase, not a regression.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within HOME-10/I18N-04's scope. No new capabilities were proposed; all decisions were about HOW to implement the two already-scoped requirements.

</deferred>

---

*Phase: 10-unified-header-simplified-language-switcher*
*Context gathered: 2026-07-14*
