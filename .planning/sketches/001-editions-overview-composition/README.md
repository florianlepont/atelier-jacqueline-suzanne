---
sketch: 001
name: editions-overview-composition
question: "What page composition feels bold & graphic for the Éditions overview, while staying within the existing AJS brand (Unbounded 900, monochrome + single pink accent, sharp corners)?"
winner: "B"
tags: [layout, editions, typography, motion]
---

# Sketch 001: Éditions Overview Composition

## Design Question

The Éditions overview page (`/editions/`) currently renders as a plain editorial zigzag list — functional but described as not "fun" or "modern" enough. This sketch explores three dramatically different page compositions, each staying inside the established brand system (Unbounded weight 900 display font, monochrome + single `--pink-600` accent, sharp corners, hairline borders) per the "bold & graphic, stay within brand" direction chosen during intake.

Real published content is used (Rebut, Silos — titles, French statements, and actual lead photos fetched live from the public Sanity dataset) so the comparison reflects real data, not lorem ipsum.

## How to View

```
open .planning/sketches/001-editions-overview-composition/index.html
```

Requires network access (Google Fonts CDN for Unbounded preview + live Sanity CDN photo URLs). If offline, the layout still works with browser fallback fonts and broken image icons in place of photos.

## Variants

- **A: Zigzag Amplified** — Keeps the current row-list structure (closest to today, lowest implementation risk) but pushes édition titles to huge, bleeding-off-the-edge Unbounded display type that overlaps the photo, plus a hover state that inverts the title to the pink accent and nudges the photo scale. Alternates left/right like the current page.
- **B: Poster Grid** — Abandons the single-column list for an asymmetric bento-style grid of full-bleed photo tiles with title/statement overlaid at the bottom (echoes the homepage's gallery grid-tile treatment). Hover lifts the tile with a hard offset border (brutalist, no soft shadow) rather than a normal drop shadow, matching the site's sharp-corner aesthetic. Scales to more éditions by giving each tile a size class (large/medium/small) rather than a uniform grid.
- **C: Full-bleed Story Scroll** — Each édition gets its own full-viewport section (scroll-snap), giant title, statement, and a full-bleed photo split-screen — echoes the homepage carousel's progress-dot pattern (now reused here as scroll-position dots, clickable to jump between éditions).

## Winner: B — Poster Grid

Chosen with one refinement: **keep the page-title header block (eyebrow + "Éditions" h1) exactly as it is on the live site today** — same size (`clamp(40px, 4vw, 56px)`), same weight (semibold, not the black/900 used in the poster tiles below it), same spacing. Only the list of éditions below the header is redesigned into the asymmetric poster grid. The final sketch (variant B, now the default tab) reflects this — the amplified header size from the first pass was reverted.

## What to Look For

- Does the amplified/overlapping type in **A** read as "bold" or start to feel cramped/illegible at real content lengths?
- Does **B**'s asymmetric grid still feel intentional with only 2 published éditions today, or does it read as "built for more items than exist"?
- Does **C**'s full-viewport-per-édition pacing feel "modern editorial" or too slow/heavy for a page with (for now) only 2 items?
- All three keep the "no commerce affordance" boundary (EDN-06) — no price/stock/CTA beyond "voir l'édition" — confirm none of the directions accidentally suggest a shop/product feel.
- Mobile: resize with the sketch toolbar's viewport buttons (bottom-right) — B and C are the biggest departures from the current single-column mobile behavior; check they still feel intentional at 375px.
