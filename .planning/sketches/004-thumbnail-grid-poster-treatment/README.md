---
sketch: 004
name: thumbnail-grid-poster-treatment
question: "How should the Poster Grid's bold/graphic energy extend to GalleryGrid.astro — the shared uniform 3-column thumbnail grid used by both Portfolio gallery detail pages and Éditions detail pages?"
winner: null
tags: [layout, gallery, editions, thumbnail-grid, consistency]
---

# Sketch 004: Thumbnail Grid Poster Treatment

## Design Question

`GalleryGrid.astro` is a shared, content-agnostic component used by both Portfolio gallery detail pages (full photo sets) and Éditions detail pages (interior spreads) — today it's a plain uniform 3-column grid. Now that the Éditions *overview* has the bold Poster Grid treatment, does this shared thumbnail grid need to evolve too, or does its current plainness actually work fine as a "quiet" secondary display (the page's own hero/title already carries the bold statement)?

Uses 6 real interior-spread photos from "Rebut" (fetched live from the public Sanity dataset), reuses the exact `expand-icon` SVG already shipped on the détail hero (`.edition-detail__hero-expand-icon`) for a "click to enlarge" hint, consistent with the existing Lightbox interaction pattern.

## How to View

```
open .planning/sketches/004-thumbnail-grid-poster-treatment/index.html
```

## Variants

- **A: Asymmetric bento** — same grouping language as the Poster Grid (varying tile sizes, no text overlay since these are secondary images on an already-titled page), hover = scale + expand icon.
- **B: Organic masonry** — tile heights follow each photo's real aspect ratio (CSS multi-column layout, not a fixed size pattern) — feels like a contact sheet rather than a constructed poster.
- **C: Minimal (today + hover)** — today's exact uniform grid, unchanged, with only the hover zoom + expand icon added. The "low-risk baseline."

## What to Look For

- Does A feel consistent with the new Éditions overview, or does having asymmetry in *two* different places (overview list + this grid) start to feel busy on the same page flow (overview → detail)?
- Does B's organic/contact-sheet feel fit the "artisanal, printed" nature of the éditions specifically, but potentially feel out of place on a Portfolio gallery (which may have more images, different aspect ratios)?
- Is C simply enough — the détail page's hero already carries the bold treatment; does the supporting thumbnail grid actually benefit from staying quiet by contrast?
- All three reuse the exact same `expand-icon` SVG already shipped — confirms this "click to enlarge" affordance can extend to thumbnails with zero new visual language.
