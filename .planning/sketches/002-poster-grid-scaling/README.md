---
sketch: 002
name: poster-grid-scaling
question: "Does the asymmetric bento pattern from sketch 001's winner (Poster Grid) still read as intentional at 3-5 items, and what does the empty state look like in this visual language?"
winner: null
tags: [layout, editions, consistency, states]
---

# Sketch 002: Poster Grid Scaling

## Design Question

Sketch 001 picked the "Poster Grid" direction, but only validated it with the 2 éditions that exist today (1 large "hero" tile + 1 smaller tile). This sketch answers the follow-up question: does the asymmetric pattern hold up as Romane adds more éditions, and what happens at zero?

This is a **consistency sketch** (one design already chosen, testing it across states), not a fresh set of alternatives — there's a single view with an item-count control instead of A/B/C tabs.

## How to View

```
open .planning/sketches/002-poster-grid-scaling/index.html
```

Use the "Items: 0 1 2 3 4 5" buttons in the top bar to step through counts. Requires network access (Google Fonts + live Sanity photo URLs); items 3-5 additionally reuse the real Rebut/Silos photos (re-cropped) as **clearly-labeled placeholder content** — titles are suffixed "(exemple)" and a banner note appears whenever count > 2.

## The Pattern

Items are grouped in 3s: 1 hero tile (spans 2 grid rows) + up to 2 stacked "small" tiles beside it. Groups alternate which side the hero sits on (left/right) for rhythm across multiple rows. A trailing group of 1 or 2 items degrades gracefully:
- **3 items in a group:** hero + 2 stacked smalls, filling the hero's full height — the most resolved composition.
- **2 items (trailing remainder):** hero + 1 small on top only, deliberately leaving quiet space below it — this is exactly what sketch 001 showed with today's 2 real éditions, preserved here as a valid state, not a bug.
- **1 item (trailing remainder):** a single full-width banner tile, no forced asymmetry.
- **0 items:** a dashed-border empty state in the same bold typographic voice as the tiles ("Éditions à venir"), reusing the real production copy.

## What to Look For

- At 3 and 5 items, does the alternating hero-side rhythm read as intentional, or start to feel busy?
- Does the empty state feel like part of the same design system, or does its plainness clash with how graphic the populated states are?
- Toggle through 0→5 a few times — does the composition ever look "broken" or unbalanced at a specific count (the trailing 1-2-item cases are the ones to scrutinize)?
- Resize to phone width (sketch toolbar, bottom-right) — the grid collapses to a single column at all counts; confirm nothing looks stuck mid-transition.
