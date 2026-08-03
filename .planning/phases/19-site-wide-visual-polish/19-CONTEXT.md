# Phase 19: Site-Wide Visual Polish - Context

**Gathered:** 2026-08-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Three independent visual fixes closing out v1.5: (1) the Éditions overview page's row-hover accent color doesn't reach the title/description text, only the eyebrow/dot/divider are supposed to (EDN-09), (2) the halftone dot-texture on Contact/About/Éditions no longer bleeds to the true browser edge since Phase 16's overflow-containment fix (UI-01), and (3) Contact's E-mail/Instagram link rows have no horizontal margin during the hover black-fill effect (CONT-03). No new capability, no content-model change — pure CSS/component fixes across `EditionsOverviewBody.astro`, `PageTitleHeader.astro`, and `ContactPageBody.astro`.

</domain>

<decisions>
## Implementation Decisions

### Éditions Row-Hover Color Sync (EDN-09)
- **D-01 — root cause, empirically confirmed live (not a guess):** `EditionsOverviewBody.astro`'s `:global(html.editions-row-active) .page-title-header__eyebrow { color: var(--editions-row-accent-text); }` (and the sibling rules for `::before`, `h1`, `__intro`, `__divider`, lines 88-101) **never applies to any of the five targets** — verified via live DOM/CSSOM inspection in a running browser (not just static code reading): triggering the hover class and waiting past the `transition: color 0.35s` confirms the computed color stays at the default (dark eyebrow/h1/divider, not the row's accent) in every case, including eyebrow — the earlier assumption that "eyebrow/divider already work, only h1/intro don't" was WRONG and is corrected here.
  - **Confirmed mechanism:** Astro's `:global()` wrapper only exempts the portion of the selector INSIDE the parentheses from that component's scope-hash. `:global(html.editions-row-active) .page-title-header__eyebrow` only wraps `html.editions-row-active` — everything after it (`.page-title-header__eyebrow`, `h1`, `__intro`, `__divider`) still gets `EditionsOverviewBody.astro`'s OWN Astro scope attribute appended (confirmed in the compiled CSS: selector requires `[data-astro-cid-jcxratfq]`). But the actual rendered elements are children of `PageTitleHeader.astro`, so they carry ONLY `PageTitleHeader.astro`'s own scope attribute (`[data-astro-cid-tak4ihmu]`) — never `EditionsOverviewBody.astro`'s. The selector can structurally never match any real element in the DOM, regardless of specificity.
  - **Confirmed fix, verified live:** wrap the ENTIRE selector in `:global()`, not just the `html.editions-row-active` prefix — e.g. `:global(html.editions-row-active .page-title-header__eyebrow) { color: var(--editions-row-accent-text); }`. Live-tested: injecting a plain, fully-unscoped version of this rule (equivalent to what the `:global()`-everything fix compiles to) DOES correctly recolor the element after the transition settles. Apply the same full-selector `:global()` wrap to all 5 existing rules (lines 88, 91, 94, 97, 100 in the current file) — eyebrow color, eyebrow `::before` background, h1 color, intro color, divider background.
- **D-02:** This is a mechanical, low-risk CSS fix with a confirmed root cause and confirmed solution — no design exploration needed.

### Halftone Bleed Restoration (UI-01)
- **D-03:** Restore the halftone dot-texture's bleed to the TRUE browser viewport edge (not just the `.page-title-header` component's own box width) on Contact, About, and Éditions — using a full-bleed technique (e.g. `width: 100vw` + negative-margin centering relative to the viewport, applied to the halftone element or its containing block) rather than settling for a narrower "bleed to a wider container" compromise. Explicit user choice, accepting the real technical risk in exchange for matching the original full-bleed intent.
- **D-04 — mandatory safety context, do not skip:** This exact class of fix (site-wide `overflow-x` change) already broke production once. Phase 16's original attempt at a site-wide `overflow-x: hidden` on `html, body` was tried and reverted on 2026-07-29 because it broke `position: sticky` on About's pinned exhibition photo AND `DetailHero`'s pinned scroll-reveal (both unrelated pages that happen to share the same document as Contact/Éditions). The CURRENT (working, but too-narrow) fix is `overflow-x: clip` scoped to `.page-title-header` itself (`PageTitleHeader.astro` ~line 64), specifically BECAUSE scoping it to that non-ancestor-of-sticky-elements component avoided the sticky breakage. Whatever full-bleed mechanism is used for D-03 MUST NOT reintroduce a site-wide `overflow-x` change on `html`/`body`, and MUST NOT break `position: sticky` on About's hero or `DetailHero`'s pin (used by Contact... no — used by gallery/édition detail pages, not Contact, but still elsewhere in the same document tree). Read `PageTitleHeader.astro`'s own top-of-file comment (lines 1-19) and the `overflow-x: clip` rule's comment (lines 41-56) in full before touching this.
- **D-05 — required regression coverage, given the history:** Because a fix here has already shipped broken once and only been caught by a wide-net CI check (not a targeted test), plans MUST include e2e coverage checking `document.documentElement.scrollWidth <= window.innerWidth` (no horizontal overflow) across ALL site pages the current test suite already covers (homepage, About, Contact, Éditions overview, Éditions detail, gallery detail, 404) at multiple viewport widths — not just the 3 `PageTitleHeader` consumer pages. Also must explicitly re-verify `position: sticky` still functions on About's hero and `DetailHero`'s pin (gallery/édition detail pages) after the change — a positive assertion, not just "no horizontal scroll."
- **Claude's Discretion:** Exact full-bleed CSS technique (100vw+negative-margin vs `left:50%;right:50%;margin-inline:-50vw` vs another equivalent) — pick whichever is most robust against the classic `100vw`-includes-scrollbar-width pitfall (e.g. prefer the `calc(50% - 50vw)` centering trick over bare `100vw`, or account for scrollbar width explicitly). Whether the fix lives in `PageTitleHeader.astro` itself or needs a wrapping element — implementation detail.

### Contact Hover-Fill Margin (CONT-03)
- **D-06:** Add horizontal padding to `.contact-page__detail` (`ContactPageBody.astro` ~line 142-146, currently `padding: clamp(6px, 1.1vh, 12px) 0` — zero horizontal padding) so the E-mail/Instagram label/value text has breathing room from the row edges when the black hover-fill (`::before`, ~line 152-159, currently `inset: 0`) appears. Use the project's existing spacing scale (`--space-sm: 8px` / `--space-md: 16px` from `BaseLayout.astro`) rather than an arbitrary pixel value — exact choice is Claude's discretion, tune against the real visual result.
- **D-07:** The `::before` hover-fill element's `inset: 0` should track whatever horizontal padding is added to `.contact-page__detail` (e.g. via negative-inset compensation or by having `::before` fill the full row while the visible content gets the padding) so the black background still reaches the row's actual edges — only the TEXT needs breathing room, the fill itself should still look intentional, not like it's leaving its own gap. Verify visually which reads better; this is Claude's discretion informed by the actual rendered result, not a fixed decision.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope & requirements
- `.planning/ROADMAP.md` (Phase 19 section) — goal, success criteria, dependencies
- `.planning/REQUIREMENTS.md` (EDN-09, UI-01, CONT-03) — locked requirement text
- `.planning/PROJECT.md` — v1.5 milestone goal and current Key Decisions

### Prior-phase precedent / history this phase must respect
- `src/components/PageTitleHeader.astro` lines 1-19 and 41-56 — full history of the D-04 site-wide `overflow-x` breakage and revert; MANDATORY reading before touching UI-01
- STATE.md's `[Phase 16]` decision log entries — the original PageTitleHeader overflow bug root-cause writeup

### Files this phase touches
- `src/components/EditionsOverviewBody.astro` — 5 `:global()`-scope fixes for EDN-09 (lines 88, 91, 94, 97, 100)
- `src/components/PageTitleHeader.astro` — halftone bleed mechanism for UI-01 (`.page-title-header__halftone` rule ~line 166, `overflow-x: clip` ~line 64)
- `src/components/ContactPageBody.astro` — `.contact-page__detail` padding + `::before` inset for CONT-03 (~lines 142-159)

No external specs beyond the above — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- N/A — all three fixes are CSS-only adjustments to existing components, no new components/assets.

### Established Patterns
- Astro `:global()` scoping: when a component's CSS needs to target an element rendered by a DIFFERENT component (not its own template), the ENTIRE relevant selector must be wrapped in `:global(...)`, not just a leading class/state selector — a partial wrap silently produces a selector that can never match (confirmed root cause of EDN-09; watch for this same pattern anywhere else in the codebase using `:global(html.*)` prefixes with unwrapped trailing selectors).
- CSS transitions on color/background properties (e.g. `transition: color 0.35s` on `.page-title-header__eyebrow`) mean any manual/automated verification checking computed style immediately after triggering a state change will read a mid-transition value — automated tests and live verification must wait past the transition duration (or use `transition: none` / reduced-motion overrides) before asserting final color values.
- Existing spacing scale: `--space-xs: 4px`, `--space-sm: 8px`, `--space-md: 16px` (`BaseLayout.astro` ~line 307-309) — CONT-03's padding should draw from this scale.

### Integration Points
- `EditionsOverviewBody.astro`'s row-hover mechanism sets both a CSS class (`editions-row-active`, plus `editions-row-light`/`editions-row-dark`) AND inline custom properties (`--editions-row-accent`, `--editions-row-accent-text`) directly on `<html>` via JS (confirmed live: `style="--editions-row-accent: var(--palette-purple); --editions-row-accent-text: #FFFFFF;"`) — this mechanism itself works correctly; only the CSS rules consuming the resulting custom property are broken.
- `PageTitleHeader.astro` is shared by exactly 3 pages: Contact, About, Éditions overview — UI-01's fix must be verified on all 3, plus regression-checked on gallery/édition detail pages and the homepage per D-05 (those don't use `PageTitleHeader` but share the same document-level CSS cascade risk).

</code_context>

<specifics>
## Specific Ideas

- EDN-09's root cause was found through live, empirical browser testing during this discussion (not static code reading alone) — repeated A/B verification (production rule fails to apply even after waiting past the CSS transition; a corrected, fully-`:global()`-wrapped rule injected live DOES apply) gives high confidence in both the diagnosis and the fix direction before planning even starts.
- UI-01's user framing: full visual fidelity (true edge-to-edge bleed) is worth the implementation risk, but the phase must not repeat Phase 16's mistake — expanded regression coverage (D-05) is a direct, explicit response to that history, not a generic testing nicety.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope (three narrow, well-bounded visual fixes).

</deferred>

---

*Phase: 19-Site-Wide Visual Polish*
*Context gathered: 2026-08-03*
