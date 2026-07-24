---
sketch: 004
name: thumbnail-grid-poster-treatment
question: "How should the Poster Grid's bold/graphic energy extend to GalleryGrid.astro — the shared uniform 3-column thumbnail grid used by both Portfolio gallery detail pages and Éditions detail pages?"
winner: "A2"
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
- **A2: Bento + dynamique (winner)** — same layout as A, plus two dynamic additions: a staggered scroll-reveal (tiles fade/slide in as they enter the viewport, ~90ms stagger) and a click-to-expand **morph** using the native View Transitions API — the clicked photo grows smoothly from its grid position/size into a full-size view instead of an abrupt swap. Falls back to an instant open in browsers without View Transitions support (same progressive-enhancement posture as the homepage carousel's existing use of this API).
- **B: Organic masonry** — tile heights follow each photo's real aspect ratio (CSS multi-column layout, not a fixed size pattern) — feels like a contact sheet rather than a constructed poster.
- **C: Minimal (today + hover)** — today's exact uniform grid, unchanged, with only the hover zoom + expand icon added. The "low-risk baseline."

## Where do the photo credits go?

Unchanged either way: each photo already has a `credit`/`copyrightNotice` field (`sanity/schemas/imageRights.ts`) that's displayed only inside the **Lightbox** when a thumbnail is clicked (`Lightbox.astro`'s credit line) — never on the grid thumbnails themselves, in the current site or in any of these variants. Nothing new needed here; the real implementation would apply the same morph technique to the real `<Lightbox>` component's open transition, not a separate simplified modal like this sketch's stand-in.

## Winner: A2

The asymmetric bento composition (A) plus both dynamic additions. Real implementation would replace this sketch's simplified modal with the actual `Lightbox.astro` component, applying `view-transition-name` to its existing open/close logic.

## What to Look For

- Does A feel consistent with the new Éditions overview, or does having asymmetry in *two* different places (overview list + this grid) start to feel busy on the same page flow (overview → detail)?
- Does B's organic/contact-sheet feel fit the "artisanal, printed" nature of the éditions specifically, but potentially feel out of place on a Portfolio gallery (which may have more images, different aspect ratios)?
- Is C simply enough — the détail page's hero already carries the bold treatment; does the supporting thumbnail grid actually benefit from staying quiet by contrast?
- All three reuse the exact same `expand-icon` SVG already shipped — confirms this "click to enlarge" affordance can extend to thumbnails with zero new visual language.
