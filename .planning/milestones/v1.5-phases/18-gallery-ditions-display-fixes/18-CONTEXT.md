# Phase 18: Gallery & Éditions Display Fixes - Context

**Gathered:** 2026-08-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Three independent display fixes to already-shipped gallery/édition detail pages: (1) the gallery detail hero's description text is no longer truncated after 4 lines (PORT-04), (2) the thumbnail grid shared by gallery and édition detail pages loses its visible border frame around photos (PORT-05), and (3) the site footer is restored on gallery detail pages, which currently hide it (PORT-06). No new capability, no new content model — CSS/JS + one Sanity schema validation change.

</domain>

<decisions>
## Implementation Decisions

### Description Text Overflow (PORT-04)
- **D-01:** Remove the `-webkit-line-clamp: 4` / `overflow: hidden` truncation on `.detail-hero__statement` (`src/components/DetailHero.astro` ~line 571-581) entirely — no CSS-level line cap, matching the precedent set by Phase 17's HOME-12 (D-04: "remove entirely, no substitute cap").
- **D-02:** Unlike HOME-12's freely-growing grid tile, `DetailHero` is a fixed-height, `position: sticky` panel (`height: 100svh` desktop, `height: 70svh; min-height: 420px` mobile — `src/components/DetailHero.astro` ~line 417-426, 697-704). To prevent long descriptions from overflowing this fixed panel, add a max-length `validation` rule to the Sanity Studio `statement` field (fr + en subfields) instead of a CSS clamp — explicit user decision: "retirer sans filet mais mettre un nombre de caractère max dans le champ sur le studio" (remove the CSS cap with no fallback, but cap the content length at the source in Sanity).
- **D-03:** The `statement` field is defined via a local `localeTextField(name, title, group)` helper duplicated in BOTH `sanity/schemas/gallery.ts` (~line 22-47) and `sanity/schemas/edition.ts` (~line 10-?) — no shared schema-lib module exists (per `gallery.ts`'s own comment, "no shared schema-lib module exists yet to import it from"). Both files' helpers must get the max-length validation added; in each file the helper is used ONLY for the `statement` field call site (confirmed: `gallery.ts` line 113, `edition.ts` line 95 are each's only `localeTextField(...)` call), so adding `.max(N)` directly inside each local helper is safe and correctly scoped — it will not affect any other field.
- **Claude's Discretion — exact character limit (N):** Not specified by the user; must be determined empirically, not guessed. `.detail-hero__statement`'s container (`.detail-hero__content` or equivalent) has `max-width: 420px` (~line 548) at `var(--text-body-size)` with `line-height: 1.5`. A rough starting estimate from the old 4-line clamp is ~180-220 characters; given D-02's goal is a safety margin (not a repeat of the same tight limit), lean toward a somewhat higher cap (rough starting point: 250-320 characters) — but verify against the ACTUAL rendered component at the tightest real constraint (mobile, `70svh`/`420px min-height`) before locking the number, e.g. by testing sample strings of varying length in a live/dev render and checking for visual overflow past the panel bounds. Apply the SAME limit to both `gallery.ts` and `edition.ts` (no reason for them to differ) and to both fr/en subfields.

### Thumbnail Border & Loading Background (PORT-05)
- **D-04:** Remove `border: var(--border-hairline) solid var(--color-ink)` from `.tile` in `src/components/GalleryGrid.astro` (~line 207) — this single shared rule is what produces the visible border on every thumbnail across all 4 detail-page twins (`/galleries/{slug}/`, `/en/galleries/{slug}/`, `/editions/{slug}/`, `/en/editions/{slug}/`), since all 4 pages use `GalleryGrid` in its default bento/`object-fit: cover` mode (confirmed: none of the 4 pages pass `layout="masonry"`, so the masonry/`object-fit: contain` code path is not live anywhere currently — do not spend effort on masonry-specific border behavior for this phase).
- **D-05:** KEEP `background: var(--color-ink)` on `.tile` (~line 208) — explicit user decision. This is the fallback color shown while each tile's `loading="lazy"` image is still loading; removing it risked a visible white/blank flash during scroll before images load in. Only the `border` declaration is removed, not the `background` declaration — do not conflate the two, they serve different purposes (border = unwanted visible frame; background = wanted loading-state fallback).

### Footer on Gallery Detail Pages (PORT-06)
- **D-06:** Remove the `hideFooter` prop from the `BaseLayout` call in `src/pages/galleries/[slug].astro` (~line 112) and `src/pages/en/galleries/[slug].astro` (~line 109) — this is the entire fix. Confirmed via direct comparison: `src/pages/editions/[slug].astro` and `src/pages/en/editions/[slug].astro` do NOT pass `hideFooter` and already show the footer correctly today, despite using the same `DetailHero`-based full-bleed layout pattern as galleries — so removing the prop from the two gallery files is expected to "just work" the same way, no new footer-specific CSS/layout handling anticipated.
- **Scope confirmation (already locked before this discussion, carried from milestone scoping):** Éditions detail pages are explicitly OUT of scope for this fix — they already show the footer correctly, no change needed there.

### Claude's Discretion
- Exact character limit (N) for the Sanity `statement` field max-length validation (D-02/D-03) — determine via empirical testing against the real DetailHero component, starting estimate 250-320 characters, must verify no overflow at the tightest mobile constraint before locking.
- Sanity validation error message wording (French, matching the existing `.required()` error message style, e.g. `"Le texte français est obligatoire."`).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope & requirements
- `.planning/ROADMAP.md` (Phase 18 section) — goal, success criteria, dependencies
- `.planning/REQUIREMENTS.md` (PORT-04, PORT-05, PORT-06) — locked requirement text
- `.planning/PROJECT.md` — v1.5 milestone goal and current Key Decisions

### Prior-phase precedent this phase follows
- `.planning/phases/17-homepage-carousel-intro-fixes/17-CONTEXT.md` — D-04 precedent ("remove clamp entirely, no substitute cap") that PORT-04's CSS-side decision (D-01) directly follows; the Studio-validation addition (D-02/D-03) is this phase's own extension to handle DetailHero's fixed-height constraint, which HOME-12's freely-growing tile didn't need.

### Files this phase touches
- `src/components/DetailHero.astro` — `.detail-hero__statement` line-clamp removal (~line 571-581); panel height constraints for reference (~line 417-426, 548, 697-704)
- `src/components/GalleryGrid.astro` — `.tile` border removal, background kept (~line 207-208)
- `sanity/schemas/gallery.ts` — `localeTextField` helper, `statement` max-length validation (~line 22-47, call site line 113)
- `sanity/schemas/edition.ts` — `localeTextField` helper, `statement` max-length validation (~line 10-?, call site line 95)
- `src/pages/galleries/[slug].astro` — remove `hideFooter` prop (~line 112)
- `src/pages/en/galleries/[slug].astro` — remove `hideFooter` prop (~line 109)

No external specs beyond the above — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- N/A — this phase removes/loosens existing constraints and adds one schema validation rule; no new components.

### Established Patterns
- "Remove clamp entirely, no substitute cap" — Phase 17's HOME-12 precedent (D-04), reused here for PORT-04's CSS side.
- Sanity field validation pattern: `rule.required().error('...')` already used for both fr/en subfields of every `localeTextField`-defined field (`gallery.ts` ~line 36, 43) — extend with `.max(N)` chained the same way (`rule.required().max(N).error(...)`).
- `GalleryGrid.astro`'s `.tile` base styles apply uniformly across bento (default, live everywhere) and masonry (opt-in, not currently used anywhere) modes — confirmed no page currently passes `layout="masonry"`, so this phase's border removal is effectively a single, uniformly-applied fix with no mode-conditional branching needed.
- Éditions detail pages already demonstrate the correct "footer visible, DetailHero full-bleed" combination working together — use them as the reference/proof that PORT-06's fix (just removing `hideFooter`) is sufficient, without needing new footer-interaction CSS.

### Integration Points
- `sanity/schemas/gallery.ts` and `sanity/schemas/edition.ts` each have their OWN local copy of `localeTextField` — there is no shared schema-lib module (per `gallery.ts`'s own inline comment). Both copies must be edited; editing only one will leave the other requirement (gallery vs édition statements) uncapped.
- `.tile` in `GalleryGrid.astro` is shared by all 4 detail-page twins (2 galleries locales + 2 éditions locales) — a single CSS change fixes all 4 pages at once.
- `hideFooter` is a boolean prop on `BaseLayout` (`src/layouts/BaseLayout.astro`, referenced but not modified by this phase) — the fix is purely at the two gallery page call sites, not in `BaseLayout` itself.

</code_context>

<specifics>
## Specific Ideas

- User's exact framing for PORT-04's overflow handling: "retirer sans filet mais mettre un nombre de caractère max dans le champ sur le studio" — content-authoring-time prevention (Sanity validation) instead of display-time truncation (CSS clamp). This is a genuinely different mechanism from Phase 17's HOME-12 fix, not just a copy-paste of the same pattern.
- Original bug report screenshot (a photographer with a camera, from the initial 8-item report) showing a visible dark frame around a gallery thumbnail — root-caused during this discussion to the `--border-hairline: 1px` solid `--color-ink` border on `.tile`, not to any masonry/letterboxing effect (masonry mode is defined in code but not live on any current page).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope (three narrow, well-bounded display fixes).

</deferred>

---

*Phase: 18-Gallery & Éditions Display Fixes*
*Context gathered: 2026-08-02*
