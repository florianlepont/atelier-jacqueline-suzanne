# Phase 13: Nav Integration - Context

**Gathered:** 2026-07-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire a new "Éditions" entry into the shared `<SiteHeader>` component (built in Phase 10) so visitors can discover the Éditions overview page (built in Phase 12) from every page's main nav — homepage, gallery pages, About, Contact — in both French and English. The label is editable by Romane via `siteSettings.navLabels`, following the exact pattern already established for the About/Contact labels.

Does not touch: the Éditions overview/detail pages themselves (Phase 12, already shipped), the `edition` Sanity schema (Phase 11, already shipped), the homepage carousel/grid content (must stay pure photography — Éditions must NOT be added there, per Phase 11 D-13; nothing in this phase wires `getEditions()`/`getEdition()` into `HomeCarousel.astro`'s data), or any commerce/pricing affordance (deferred to the future shop milestone).

</domain>

<decisions>
## Implementation Decisions

### Nav link position
- **D-01:** "Éditions" is the FIRST nav link, before "À propos" — nav order becomes: Éditions → À propos → Contact → Instagram (icon). Chosen over "after Contact, before Instagram" and "between À propos and Contact" — the user gave Éditions the highest visual priority in the nav rather than slotting it in among the existing content links.

### Mobile fit strategy (header now carries a 4th link)
- **D-02:** Keep the existing "shrink everything to fit one row" approach — continue the live-measured, iterative pixel-budget methodology already established in Phase 7/10 (not a fixed formula; re-measure on the real viewport once the 4th link is in). Rejected the alternative of allowing the header to wrap to two lines on the narrowest phones.
- **D-03:** On the narrowest phones (<359px breakpoint), if the standard squeeze (font-size/padding trimming) still isn't enough room, abbreviating the "Éditions" label (e.g. "Éd.") to a short form is acceptable as a last resort. This is a deliberate, explicit exception — unlike "À propos"/"Contact", which are never abbreviated anywhere on the site today. Only reach for this after exhausting the normal padding/gap/font-size trims that already apply to the other three nav items at this breakpoint (`SiteHeader.astro`'s existing `@media (max-width: 359px)` block).

### Claude's Discretion
- **English nav label wording** — not raised as a discussion question. Follow the site's existing convention (REQUIREMENTS.md/PROJECT.md/ROADMAP.md all refer to this feature as "Éditions" without an English variant) — use "Éditions" unchanged in the English nav too, not a translated "Editions". If Studio ergonomics or a live check suggests otherwise, flag it, but default to keeping the French term as-is bilingually.
- **`siteSettings.navLabels.editions` schema field shape** — mirror the existing `navLabels.about`/`navLabels.contact` bilingual `{fr, en}` sub-fields exactly (see `sanity/schemas/siteSettings.ts` lines 69-71, 140-149). Not a gray area — it's the same pattern already used for two other nav labels, just extended with a third key.
- **Exact abbreviated form for "Éditions" on sub-359px viewports (D-03)** — "Éd." is the working example from discussion; the planner/executor can pick any short recognizable form. Verify legibility live at the actual size, following the same "verify live" precedent as Phase 7's Instagram icon and Phase 10's mobile pixel-budget work.
- **Whether the "Éditions" nav link gets a "current page" visual treatment** when the visitor is already on an Éditions page — no such treatment exists for À propos/Contact today either, so default to no special active-state styling unless it turns out to be trivial/consistent to add.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & roadmap
- `.planning/ROADMAP.md` (Phase 13 section) — the 5 success criteria this phase must satisfy, including the mobile-fit criterion (#5) that D-02/D-03 directly address.
- `.planning/REQUIREMENTS.md` (EDN-01, lines 79, 205) — "Visitor can discover an 'Éditions' section via a new top-level main-nav entry (not surfaced on the homepage carousel/grid...)"; this is the only requirement this phase owns.

### Prior phase decisions this phase builds on
- `.planning/phases/10-unified-header-simplified-language-switcher/10-CONTEXT.md` — the `<SiteHeader>` single-shared-component architecture (D-01) this phase extends; the solid/transparent variant mechanism (D-02); the live-remeasure mobile-fit methodology (referenced in Claude's Discretion) that D-02/D-03 above continue; the `header-backhome-overlap-logo` debug-session precedent (a real positioning bug from a prior header change) as a cautionary note for whatever ordering/positioning the nav link ends up with.
- `.planning/phases/11-schema-content-model/11-CONTEXT.md` D-13 — Éditions must never appear on the homepage carousel/grid (`showOnHomePage`/`heroColor` deliberately absent from the `edition` schema). This phase's success criterion #3 restates that boundary from the nav-integration side: don't wire Éditions into `HomeCarousel.astro`'s data fetch.
- `.planning/phases/12-data-fetch-layer-routes/12-CONTEXT.md` — the Éditions overview page this nav link must point to (`/editions/` root + `/en/editions/` — see D-... URL convention in that file); `getEditions()`/`getEdition()` in `src/lib/sanity.ts` already exist and are NOT touched by this phase.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/SiteHeader.astro` — the single shared header component both call sites render. Currently takes `aboutLabel`/`aboutHref`, `contactLabel`/`contactHref`, and hardcoded Instagram props; needs a new `editionsLabel`/`editionsHref` prop pair and a new `<a class="nav-link">` in `.site-nav`, positioned first per D-01. The `@media (max-width: 767px)` and `@media (max-width: 359px)` blocks (lines 277-335) are the existing mobile pixel-budget CSS to re-measure and adjust per D-02/D-03.
- `src/lib/site-config.ts`'s `resolveSiteCopy(settings, locale)` — already resolves `aboutLabel`/`contactLabel` from `settings?.navLabels?.about?.[locale]` / `...contact?.[locale]` with hardcoded fallbacks. Add `editionsLabel` following the identical shape: `settings?.navLabels?.editions?.[locale] || 'Éditions'` (same fallback both locales, per Claude's Discretion above).
- `sanity/schemas/siteSettings.ts` (lines 69-71 initial value, ~140-149 field definitions) — `navLabels.about`/`navLabels.contact` bilingual `{fr, en}` fields to mirror for a new `navLabels.editions` field.
- `getRelativeLocaleUrl(locale, 'editions')` — same helper already used for `aboutHref`/`contactHref` in `BaseLayout.astro` (lines 109, 111); the Éditions overview route already exists at `/editions/` (fr) and `/en/editions/` (en) per Phase 12.

### Established Patterns
- Two independent `<SiteHeader>` call sites must both be updated identically: `src/layouts/BaseLayout.astro` (lines 186-193, used by About/Contact/gallery-detail/Éditions pages themselves) AND `src/components/HomeCarousel.astro` (lines 114-153, the homepage's direct render). Both already spread `...resolveSiteCopy(siteSettings, locale)` into local consts (`aboutLabel`/`contactLabel` etc.) before passing to `<SiteHeader>` — the new `editionsLabel`/`editionsHref` need the same treatment in both files, or the phase's "on every page" success criterion (#1) silently fails on whichever call site is missed.
- Mobile header fit is a live-measured, iterative process, not a fixed formula (Phase 7 D-03, Phase 10 Claude's Discretion) — re-verify the actual pixel budget on real viewport widths once a 4th nav-link is added, rather than calculating it from CSS alone.
- No nav link on the site currently gets a "current page" active-state treatment (confirmed by reading `SiteHeader.astro` in full) — consistent with the Claude's Discretion note above to skip this for Éditions too unless trivial.

### Integration Points
- `src/components/SiteHeader.astro` — new `editionsLabel`/`editionsHref` props + new nav `<a>`, positioned before the `aboutLabel` link per D-01.
- `src/layouts/BaseLayout.astro` — compute `editionsLabel`/`editionsHref` from `resolveSiteCopy`/`getRelativeLocaleUrl` and pass to `<SiteHeader>`.
- `src/components/HomeCarousel.astro` — same, mirroring how it already handles `aboutLabel`/`contactLabel` today.
- `src/lib/site-config.ts` — `resolveSiteCopy()` gains `editionsLabel`.
- `sanity/schemas/siteSettings.ts` — `navLabels` object gains an `editions` bilingual field, alongside `about`/`contact`.

</code_context>

<specifics>
## Specific Ideas

- User wants "Éditions" to read as a top priority in the nav, not folded in among the existing content links — hence placing it first, ahead of "À propos".
- User is comfortable with an asymmetric mobile rule: "Éditions" may abbreviate as a last resort on the narrowest phones even though the older "À propos"/"Contact" links never do — a deliberate, scoped exception rather than a new site-wide abbreviation convention.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 13's nav-wiring scope. No new capabilities were proposed.

</deferred>

---

*Phase: 13-nav-integration*
*Context gathered: 2026-07-23*
