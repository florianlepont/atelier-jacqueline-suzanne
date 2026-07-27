# Phase 7: Homepage Quick Fixes & Mobile Hero Correctness - Context

**Gathered:** 2026-07-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Three small, independent, homepage-only fixes to `src/components/HomeCarousel.astro`'s header nav, its mode-toggle button, and the mobile hero's CSS — no shared-component changes (that's Phase 10's job), no content-model changes, no new pages:

1. Add an Instagram icon link to the homepage header nav (`.home-nav`) — HOME-04.
2. Fix the carousel/grid mode-toggle button (`.home-toggle`) so its border traces a genuine square, not a rectangle — HOME-05.
3. Root-cause and fix a real-device mobile hero regression (white gap above header + footer bleed-through on first load, reported on iPhone 17 Pro) — HOME-06.

Does not touch `BaseLayout.astro`'s own header/footer (About/Contact pages), the shop/checkout/exhibitions v2 scope, or Phase 5's OVH domain cutover.

</domain>

<decisions>
## Implementation Decisions

### Instagram icon (HOME-04)
- **D-01:** Use the standard, widely-recognized Instagram glyph (rounded-square camera outline), built as a simplified dependency-free inline SVG using `currentColor`, matching the toggle icon's existing implementation approach (no icon library/dependency). No icon exists anywhere in the codebase today — the footer's Instagram link (`BaseLayout.astro:143-150`) is plain text ("Instagram"), not a usable visual reference.
- **D-02:** Nav order: Logo — About — Contact — **Instagram** — [mode toggle] — FR|EN. Groups it with the other "leave the page" links (About/Contact) rather than next to the toggle/switcher (which are homepage-display controls, not navigation).
- **D-03:** Keep the icon in the same single-row flex layout on mobile (icon-only, no label — same tight 20x14-ish footprint as the toggle icon), and re-measure/adjust the row's gaps or padding live if the 5th item doesn't fit — same iterative approach used for the original 04.3 mobile-fit work (see Code Context below for the exact prior measurement).
- **D-04:** Bare icon, no bordered box — matches About/Contact's plain-text treatment (no border). The toggle got its box specifically because a bare 20x20 icon didn't read as clickable sitting among plain text links (`HomeCarousel.astro:735-739`); Instagram's glyph is expected to be recognizable enough on its own that this problem shouldn't repeat, but verify live and add a box if it doesn't read as clickable.
- **D-05:** Reuse the footer's existing link semantics — `target="_blank"`, `rel="noopener noreferrer"`, `href="https://www.instagram.com/ajs_romanelepont/"`, and an `sr-only` "(opens in new tab)" hint (FR/EN via `instagramNewTabHint`, see `BaseLayout.astro:76`) — for consistency and no re-derivation of behavior already decided in Phase 04.2.

### Toggle square border (HOME-05)
- **D-06:** The bug is that `.home-toggle`'s **bounding box isn't square** — it has no explicit `width`/`height` today (`HomeCarousel.astro:740-743`), so its box is whatever the 20x14px morph icon plus `padding: var(--space-xs)` happens to produce (wider than tall). This is a box-dimension problem, not a corner-radius problem — corners already read as square (no border-radius is set, and `--radius-none: 0px` is the site's established default language).
- **D-07:** Keep the `.home-toggle__morph` icon's own dimensions (20x14, 2 rows x 3 cols) untouched — its proportions are intentional (see the D-01 comment in Phase 6's context on why row-gap is fixed to preserve the "2 bars" carousel glyph read). Square only the surrounding button box (explicit equal `width`/`height`, or `aspect-ratio: 1`), sized to comfortably contain the icon plus padding on all sides.
- **D-08:** Size the square box tightly around the icon (roughly 28-32px, not the full 44px tap-target box) for a visually compact header row — **but** this must still clear the WCAG 2.5.5 44px tap-target floor via an explicit `min-height`/`min-width` override on top of the smaller visible box, following the same pattern already used elsewhere in the codebase for padding-driven (not visual-size-driven) tap targets (e.g. `LanguageSwitcher.astro`'s `.switcher-link` at `min-height: 44px`). The visible square and the clickable/tappable area are allowed to differ in size as long as the tappable area meets 44px.
- **D-09:** Verify the fix in both carousel mode and grid mode (both have their own `.home-toggle` color/hover treatments, see `HomeCarousel.astro:740-763`) — per the phase's success criterion #2, the square border must hold in both display modes, not just one.

### Mobile hero regression (HOME-06)
- **D-10:** Root-cause investigation order: **investigate view-transitions first.** The leading hypothesis is quick task `260713-jfz`'s addition of `view-transition-name: ajs-hero-morph` to `.home-hero__photo` (`HomeCarousel.astro` around line 887) and the `document.startViewTransition()`-wrapped toggle handler — this is the only mobile-hero-relevant change made *after* Phase 6's `100svh` full-bleed fix was last verified working, and it was never tested on a real mobile device (Phase 6's own live verification predates it; `260713-jfz-SUMMARY.md`'s Task 3 checkpoint was desktop-only). Test with the view-transition wrapping/naming disabled or reverted on mobile viewports first, to confirm or rule this out, before investigating the `100svh`/`max-height:100vh`/absolute-positioned-panel chain from scratch.
- **D-11:** Verification method: **Playwright mobile-viewport emulation only** (e.g. an iPhone device profile) — no live on-device checkpoint with the real iPhone 17 Pro is required to close this phase. Note the tension this creates: the bug itself was only ever observed on a real device (this exact bug class — `100vh` vs `100svh` Safari chrome behavior — previously fooled devtools-only testing once already, per Phase 6's history) — flag in the plan that emulation is the user's explicitly chosen bar for this phase, not a guarantee the real-device symptom is gone, in case it needs a follow-up quick task if it recurs live.
- **D-12:** Resolution approach if the view-transition hypothesis is confirmed: **fix the specific CSS/layout interaction, keep the morph animation on mobile too.** Do not scope `document.startViewTransition()` to desktop/`pointer:fine` only as a shortcut — that would silently remove a recently-shipped, user-approved mobile feature (the carousel/grid morph animation). Only fall back to disabling view-transitions on mobile if the actual conflict turns out to be structural/unfixable without disproportionate risk — and treat that as a deviation to flag explicitly, not a default plan.

### Claude's Discretion
- Exact SVG path data for the Instagram glyph (D-01) — any standard, recognizable rendering is acceptable; verify legibility live at the header's icon size.
- Exact gap/padding adjustments needed to fit the Instagram icon into the mobile header row (D-03) — re-measure live, following the same methodology as the prior 04.3 mobile-fit work (see Code Context).
- Exact pixel value for the toggle's tight square box (D-08), as long as the visible box is square and the tappable area clears 44px.
- Exact CSS mechanism for fixing the view-transition/mobile-hero interaction (D-12), once root-caused.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Homepage component (entire surface being modified)
- `src/components/HomeCarousel.astro` — owns the header nav (`.home-header`/`.home-nav`, D-01–D-05), the mode-toggle button (`.home-toggle`/`.home-toggle__morph`, D-06–D-09), and the mobile hero CSS (`.home-hero__photo`, `.home-hero__accent`, the `@media (max-width: 767px)` block starting ~line 1232, D-10–D-12). Also owns the view-transition wiring added by quick task `260713-jfz` (`view-transition-name: ajs-hero-morph`, the `document.startViewTransition()`-wrapped toggle handler, and the `<style is:global>` block with `::view-transition-group()` rules) — read this in full, it's the prime suspect for HOME-06.
- `src/layouts/BaseLayout.astro` — reference only, for the existing footer Instagram link's exact behavior/copy to reuse (D-05: `target`, `rel`, `instagramNewTabHint`, lines ~73-150) and the `--radius-none`/`--radius-sm` tokens (lines 212-213). Not modified by this phase.

### Prior phase decisions this phase builds on or investigates
- `.planning/phases/06-homepage-view-mode-toggle-grid-hero-wordmark-cutout/06-CONTEXT.md` — Phase 6's original toggle/grid/wordmark decisions (D-01–D-10), including the fixed row-gap rationale for the morph icon (relevant to D-07 above — don't touch the icon's own proportions).
- `.planning/phases/06-homepage-view-mode-toggle-grid-hero-wordmark-cutout/06-01-SUMMARY.md` — Phase 6's live post-checkpoint mobile hero work: the `.home-hero__photo`/`.home-hero__accent` structural split and the `100svh` fix (the mobile hero mechanism HOME-06 is investigating a regression against). Read the "Issues Encountered" and "patterns-established" sections closely — this is the known-working baseline being compared against.
- `.planning/quick/260713-jfz-add-an-animated-transition-between-carou/260713-jfz-SUMMARY.md` — the quick task that added `view-transition-name` to `.home-hero__photo`/`.home-hero__accent`/`.home-header` after Phase 6 shipped; the leading hypothesis for HOME-06 (D-10). Its own checkpoint verification (Task 3) was desktop-only.
- `.planning/quick/260713-hcj-make-the-grid-mode-hero-tile-s-atelier-j/260713-hcj-SUMMARY.md` and `.planning/quick/260713-kit-the-pink-accent-panel-now-appears-only-a/260713-kit-SUMMARY.md` — two further post-Phase-6 quick tasks touching `HomeCarousel.astro`'s mobile wordmark and view-transition fade timing respectively; lower-priority reading than jfz but touch the same file/timeframe, worth a quick scan if the jfz hypothesis doesn't pan out.
- `.planning/phases/04.2-social-media-links/04.2-01-SUMMARY.md` — the original Instagram footer link implementation (D-05's reuse source).
- `.planning/phases/04.3-homepage-refinements-logo-hover-crossfade-to-match-site-chro/` (any plan/summary) — source of the exact mobile header-row fit measurement referenced in D-03 (`HomeCarousel.astro:1232-1249` comment: 346px used of 361px available at 393px viewport width, before adding a 5th nav item).

### Requirements
- `.planning/REQUIREMENTS.md` — HOME-04, HOME-05, HOME-06 definitions (lines 61-63) and their phase mapping (lines 167-169).

**No formal cross-project ADRs/specs** — this phase's requirements are fully captured in REQUIREMENTS.md and the Decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- The toggle icon's inline-SVG, dependency-free, `currentColor`-based approach (`.home-toggle__morph-cell`, `HomeCarousel.astro:810-829`) is the direct pattern to follow for the new Instagram glyph (D-01) — same "no icon library" constraint.
- `--tap-target-min` and the `min-height`-not-visual-size pattern (`LanguageSwitcher.astro`'s `.switcher-link`, and `HomeCarousel.astro:727`) is the exact template for D-08's tight-square-but-44px-tappable toggle fix.
- `instagramNewTabHint` (`BaseLayout.astro:76`) and the footer Instagram `<a>`'s exact attributes (lines 143-150) are the direct copy/behavior source for D-05.

### Established Patterns
- Mobile header fit is a live-measured, iterative process (not a fixed formula) — see the detailed pixel-budget comment at `HomeCarousel.astro:1232-1249` from the original 04.3 work. D-03 expects the same re-measure-and-adjust approach when the Instagram icon is added as a 5th item.
- `view-transition-name` assignments and their `::view-transition-group()` z-index stacking rules live in a separate `<style is:global>` block (`HomeCarousel.astro:1374+`) because Astro's scoped styles can't target document-root pseudo-elements — relevant if D-10/D-12's fix needs to touch transition-group stacking or timing, not just the `.home-hero__photo` rules themselves.
- The mobile media query (`@media (max-width: 767px)`, `HomeCarousel.astro:1232-1371`) is where all mobile-specific hero/header/wordmark overrides live — D-06/D-08's toggle-box fix and D-10/D-12's hero fix both likely land here or in the base (non-mobile) rules they override.

### Integration Points
- `.home-toggle` and `.home-nav` are siblings inside `.home-header` (`HomeCarousel.astro:80-109`) — the Instagram link (D-02) is a new sibling in this same flex row, not a nested addition to `.home-nav`.
- `.home-hero__photo` carries both the mobile full-bleed sizing (`min-height: 100svh`, mobile media query) and the view-transition name (`view-transition-name: ajs-hero-morph`, base rule) — these two concerns are on the exact same element, which is why D-10 treats the view-transition wiring as the prime suspect rather than a coincidental co-location.

</code_context>

<specifics>
## Specific Ideas

- User confirmed the standard/recognizable Instagram glyph over a custom brutalist reinterpretation — legibility as "this is Instagram" was prioritized over stylistic consistency with the toggle's abstract grid glyph.
- User explicitly chose a *tighter, icon-hugging* square for the toggle over matching the full 44px tap-target box visually — compactness in the header row was prioritized, with the 44px floor kept only as an invisible tappable-area minimum, not the visible box size.
- User chose to investigate the view-transitions hypothesis first for the mobile hero regression, given the timeline: Phase 6 verified `100svh` working live, then a quick task afterward added `view-transition-name` to the same element and was never re-verified on a real device.
- User explicitly chose emulation-only verification for HOME-06 (not a live on-device checkpoint), accepting the noted risk that this specific bug class has previously escaped emulation-only testing once already (Phase 6's `100vh`→`100svh` fix was itself only caught via a real-device screenshot).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within the three HOME-04/05/06 requirements scoped into this phase. The shared-header consolidation (Phase 10) and the header/toggle groundwork it depends on were both explicitly out of scope per the phase boundary.

</deferred>

---

*Phase: 07-homepage-quick-fixes-mobile-hero-correctness*
*Context gathered: 2026-07-13*
