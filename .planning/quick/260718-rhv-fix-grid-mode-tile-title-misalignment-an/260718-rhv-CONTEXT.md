# Quick Task 260718-rhv: Fix grid-mode tile title misalignment and improve the hover-reveal effect - Context

**Gathered:** 2026-07-18
**Status:** Ready for planning

<domain>
## Task Boundary

Fix grid-mode tile title misalignment and improve the hover-reveal effect on the homepage.

Root cause (already diagnosed via direct code investigation of `src/components/HomeCarousel.astro`, confirmed against a live screenshot — do not re-derive):

`.home-grid__tile-copy` (~line 1402) is a `position: absolute` box with only `bottom`/`left`/`right` set — no fixed height — so its rendered height depends on its content, and its TOP edge (where the title sits) shifts accordingly. `.home-grid__tile-description` (~line 234) is only rendered in the DOM at all when `gallery.statement` is truthy (a defensive fallback per Phase 8's D-05 decision — every published gallery is *supposed* to have a required statement field in Sanity, so this fallback "shouldn't" normally trigger, but a live screenshot shows it doing exactly that for at least one gallery missing its statement content, e.g. "Paysage"). When the description span IS present, it still reserves its full layout height even at `opacity: 0` (opacity doesn't collapse layout). So galleries WITH a statement have a taller copy-block than galleries WITHOUT one, pushing their title higher — in the DEFAULT (non-hovered) state too, not just during hover.

Separately, the user wants the existing hover-reveal effect (`.home-grid__tile-description` fades/slides in on `:hover`/`:focus-visible`, 180ms ease, HomeCarousel.astro ~line 1433) made more polished with an added highlight.

Content-level note (not this task's scope, but worth flagging to the user separately): the actual missing statement on "Paysage" is a Sanity content gap Romane should fill in — the code fix here makes the layout robust regardless, but doesn't populate real content.

</domain>

<decisions>
## Implementation Decisions

### Title-position fix approach
Always reserve description space — render `.home-grid__tile-description` for every tile, even when `gallery.statement` is empty (invisible/empty block), so every tile's caption box is the same height and titles always align. Matches the current 3-line-clamp sizing exactly.

### Hover highlight style
Per-gallery color tint — tint the scrim toward that gallery's own resolved accent color (same on-brand hex already used for the hero panel, via `src/lib/site-config.ts`'s `normalizeHeroColor`/`HERO_COLORS`, wired through `src/pages/index.astro`). Blend with the existing dark gradient scrim (`.home-grid__tile-scrim`) rather than replacing it, so text stays legible. This requires wiring each gallery's resolved accent hex through to its own grid tile (currently only the hero tile receives it).

### Title lift on hover
Keep a subtle lift — the title should still shift up slightly (a few px) as the description fades in on hover/focus, consistent with the description's existing `translateY` reveal motion.

### Claude's Discretion
- Exact color-tint blend approach (gradient overlay opacity/blend-mode, exact intensity) — should look intentional and on-brand, not garish; must not compromise text legibility (dark scrim already provides a legibility floor).
- Exact pixel amount for the title's hover lift and whether its transition timing matches or slightly differs from the existing 180ms description fade.
- Whether to add a defensive minimum-height/line-clamp behavior so an always-rendered-but-empty description block doesn't introduce any stray hover flicker when a statement is truly empty (should never happen in practice per Phase 8's Studio-required field, but the code should stay robust).
- How to best wire the per-gallery accent hex through to each individual grid tile (new prop/data attribute plumbing) without duplicating the existing hero-tile accent resolution logic.

</decisions>

<specifics>
## Specific Ideas

No specific implementation code — the mechanism (CSS custom properties for accent color, mirroring the `--current-accent`/`--current-accent-text` pattern already used for the hero tile) is left to the planner/executor's judgment, informed by the existing pattern already in the codebase.

</specifics>

<canonical_refs>
## Canonical References

- `.planning/phases/08-gallery-descriptions/08-CONTEXT.md` — original Phase 8 design decisions (D-01 through D-06) for the grid-tile hover-reveal mechanism and the `statement` field's Studio-required status.
- `src/lib/site-config.ts` — `HERO_COLORS`, `normalizeHeroColor`, `getHeroTextColor` (the existing per-gallery accent-color resolution pipeline to reuse, not duplicate).
- `.planning/quick/260718-r2o-fix-the-homepage-per-gallery-accent-colo/` — the immediately-preceding quick task that wired a `--current-accent`/`--current-accent-text` CSS variable pair for the grid hero tile; this task's hover-tint mechanism should likely follow the same pattern, extended to non-hero grid tiles.

</canonical_refs>
