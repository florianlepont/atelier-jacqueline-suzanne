---
sketch: 003
name: edition-detail-coherence
question: "Does the édition detail page need a bold-graphic treatment to match the new Poster Grid overview, so list→detail doesn't feel like a style downgrade?"
winner: "Synthesis: A + B's format-details highlight"
tags: [layout, editions, detail-page, frontier]
---

# Sketch 003: Édition Detail Coherence

## Design Question

Sketch 001/002 redesigned the Éditions *overview* into a bold Poster Grid. The édition *detail* page (`/editions/{slug}/`) was untouched — today it renders the title at 32px semibold over a full-bleed hero. This sketch asks: after clicking a big poster tile with a 44px+ Unbounded-900 title, does landing on that smaller title feel like a downgrade — and if so, what does "amplified" look like without breaking the page's actual job (showing the photos, the statement, and the format details clearly)?

Uses real content: Rebut's real statement, format details (50 pages, 2 exemplaires, 21×29.7cm), and 3 of its real interior spread photos, fetched live from the public Sanity dataset.

## How to View

```
open .planning/sketches/003-edition-detail-coherence/index.html
```

## Variants

- **A: Current (baseline)** — exact replica of today's live detail page: full-bleed hero, title at 32px/semibold bottom-left, statement, format-details line in muted gray, 3-column thumbnail grid.
- **B: Amplified** — same structure and information, but: title jumps to Unbounded 900 at up to 128px; a small pink "Nouveau" tag echoes the overview's tile tag; the format-details line gets a bold pink underline instead of plain gray text; a "Planches" label introduces the thumbnail grid; the hero photo has a very slow (8s) zoom on hover for a touch of motion.

Both variants preserve the real interaction model: clicking the hero or a thumbnail is meant to open the Lightbox (shown as a toast in this sketch, not a real lightbox — that's already-shipped, tested functionality, out of scope here).

## Winner: Synthesis — A's structure, kept as-is, + B's format-details highlight only

The detail page doesn't need the amplified treatment — variant A (today's actual page: small title, plain thumbnails, no "Nouveau" tag) stays as-is. The one element carried over from B: the format-details line (`Pages : 50 · Tirage : 2 exemplaires · Dimensions : 21 × 29.7 cm`) becomes bold uppercase with a pink underline instead of plain muted gray text — a small, contained accent rather than a full page redesign.

## What to Look For

- Toggle A → B: does B feel like a natural continuation of the Poster Grid overview, or does it start to compete with the statement/format-details for attention?
- Is the statement (the actual editorial content) still comfortable to read in B, or does the amplified title throw off the reading rhythm?
- Does the pink underline on the format-details line read as a nice accent or as visual noise next to a pink tag AND a pink title-adjacent element?
- This is a real, already-shipped page (lightbox, thumbnail grid, back-link all work today) — confirm neither variant's changes look like they'd require touching that existing interaction code, only CSS/markup on the static parts.
