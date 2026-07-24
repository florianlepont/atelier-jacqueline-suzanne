# Sketch Manifest

## Design Direction

"Bold & graphic" — push the Éditions overview page's typography and layout to be more dynamic (big display type, asymmetry, motion) while staying strictly within the existing AJS brand system: Unbounded (weight 900) display font, monochrome (white/ink) + single pink accent, sharp corners, hairline borders, no new colors. The "fun/modern" ask should land in composition and motion, not a new visual identity.

## Reference Points

- [a-chen.webflow.io](https://a-chen.webflow.io) (sketch 005) — its "WORKS" section pins a full-bleed photo (`position: sticky`) while scrolling, shrinking it to reveal the section title in the freed space. Referenced for the *mechanism* only — the reference's neon palette, grain texture, and 3D mascot don't apply; sketch 005 adapts the scroll-scrubbed pin+shrink pattern to AJS's monochrome+pink language.

## Sketches

| # | Name | Design Question | Winner | Tags |
|---|------|------------------|--------|------|
| 001 | editions-overview-composition | What page composition feels "bold & graphic" for the Éditions overview? | B — Poster Grid (page-title header kept unchanged from production) | [layout, editions, typography] |
| 002 | poster-grid-scaling | Does the asymmetric bento pattern from 001's winner still read as intentional at 3-5 items, and what does the empty state look like in this visual language? | Approved as-is — repeating hero+2-small group pattern, alternating sides, empty state | [layout, editions, consistency, states] |
| 003 | edition-detail-coherence | Does the édition detail page need a bold-graphic treatment to match the new overview, so list→detail doesn't feel like a style downgrade? | Synthesis — A (unchanged) + B's pink-underlined format-details line only | [layout, editions, detail-page, frontier] |
| 004 | thumbnail-grid-poster-treatment | How should the Poster Grid energy extend to the shared GalleryGrid.astro thumbnail grid (Portfolio + Éditions detail pages)? | A2 — Asymmetric bento + staggered scroll-reveal + click-to-expand View Transitions morph | [layout, gallery, editions, thumbnail-grid, consistency, motion] |
| 005 | edition-hero-scroll-reveal | Should the édition detail hero become a pinned, scroll-scrubbed reveal (ref: a-chen.webflow.io's WORKS section), and how dramatic should it be? | Synthesis — B's scale (55% shrink, huge title) + C's two-stage reveal (title, then pink-underlined format line) | [layout, editions, detail-page, motion, frontier] |
