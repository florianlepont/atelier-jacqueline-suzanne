---
sketch: 010
name: editions-overview-layout
question: "Now that sketch 009 settled the tile hover treatment (E — Duotone Reveal), is the underlying page composition (today's zigzag bento grid, from sketch 001) itself worth replacing for something more modern/dynamic?"
winner: "B2"
tags: [layout, editions, composition, motion, frontier]
---

# Sketch 010: Éditions Overview Layout

## Design Question

Right after picking sketch 009's winner (E — Duotone Reveal), the composition itself was flagged as worth reconsidering: "maybe it's the grid format that we need to rechallenge." The current zigzag bento grid is sketch 001's winning "Poster Grid" variant from an earlier exploration — this sketch reopens that layout question with fresh eyes, now informed by the duotone-reveal mechanic everyone already likes.

Every variant below (including the reference) uses the **exact same shared `.dt` tile component** — pink duotone by default, cursor-follow color-reveal spotlight on hover — so the ONLY variable under comparison is the page composition, not the hover treatment. That's already decided.

## How to View

```
open .planning/sketches/010-editions-overview-layout/index.html
```

Requires network access (Google Fonts CDN + live Sanity CDN photo URLs).

## Variants

- **Référence** — today's 12-column zigzag bento grid, unchanged, just wearing the Duotone Reveal tile instead of the old border+shadow. The control group.
- **A: Horizontal Filmstrip** — abandons the 2D grid for a horizontally-scrolling, scroll-snap strip of large cards, echoing the homepage hero carousel's own language (a site-wide consistency win). Never looks "sparse" or "built for more items than exist" regardless of catalog size — sketch 001's own flagged risk for the grid at only 2 items.
- **B: Editorial Stacked List** — typography leads. Huge Unbounded titles carry each row; the duotone photo becomes a secondary inset image, not the full-bleed hero. Reads as "magazine collections page" rather than "photo portfolio grid." Flagged as still too static — see B2/B3 below.
- **B2: Cursor Preview** (requested follow-up to B) — pushes further: no static thumbnail at all, rows are pure text (index/title/statement). Hovering a row makes a large photo panel appear and follow the cursor — the classic "modern editorial index" move. Non-hovered titles dim so the hovered one pops.
- **B3: Expand Reveal** (requested follow-up to B, no-JS alternative to B2) — also drops the static thumbnail, but instead of a cursor-follow panel, hovering a row expands a full-width photo band open beneath it (pure CSS accordion). Calmer than B2, still far more dynamic than B.
- **B4: Index horizontal (B2's mechanic)** — same cursor-follow preview as B2, titles read horizontally in one dense wrapped block ("Rebut / Silos / Grain / ...") instead of a list you scroll down through.
- **B5: Index horizontal (B3's mechanic)** — turned out the "j'adore" + the pink/zoom complaints were actually about B3 (Expand Reveal), not B2. B5 is the correctly-matched horizontal counterpart: same title index as B4, but hovering opens a shared accordion band below (B3's mechanic, no cursor panel). B3 itself was fixed at the source: the "Édition 0X" label is no longer pink, the reveal photo no longer wears the duotone overlay, and the crop ratio now matches the actual display box (was requesting a 1.75:1 image inside a ~3.5:1 box, over-cropping/zooming).
- **B6: Panneaux horizontaux** — what "horizontal panels" actually meant once clarified: not a text index at all, but 6 real vertical strip panels sitting side by side (a fan gallery). At rest all equal-width; hovering one panel makes it grow wide while the others compress, titles staying readable rotated vertically at the bottom of each strip.
- **C: Scattered Print Table** — photos laid out like real loose prints on a table: rotated, overlapping, uneven sizes, soft ambient shadow at rest. Hover lifts and straightens the print before the duotone spotlight reveals color. The most literal "these are physical printed objects" interpretation — ties directly to what an édition actually is.

## Winner: B2 — Cursor Preview

Confirmed with Romane. Pure-text rows (index/title/statement), no static thumbnail, non-hovered titles dim, and a large clean-color photo panel follows the cursor on hover — no duotone/negative treatment at all, since B2 never used the shared `.dt` tile component.

This quietly resolves sketch 011's "which color treatment" question for this page: it's moot here, since B2's floating preview is a plain photo. Sketch 009's E (Duotone Reveal) and sketch 011's F (Négatif au survol) remain validated, useful patterns — just not used on the Éditions overview page. They stay documented in case a future tile-based layout (elsewhere on the site) wants them.

## What to Look For

- Does **A**'s filmstrip feel like a meaningful upgrade, or does losing the "see everything at once" overview hurt more than the grid's asymmetry-at-2-items problem?
- Does **B**'s type-led rhythm feel "modern" in a genuinely different way, or does de-emphasizing the photography undersell the visual work itself?
- Does **C**'s scattered/rotated table feel "alive and physical" or does it risk feeling gimmicky/less usable (harder to scan, tap targets at angles on mobile)?
- All three keep the "no commerce affordance" boundary (EDN-06) intact — confirm none of the new compositions accidentally invite a price tag or "shop" feeling.
- Resize with the toolbar (bottom-right) — variant C in particular has a real mobile fallback (stacks vertically, un-rotated) worth checking.
