---
sketch: 012
name: editions-header-personality
question: "How should the Éditions overview page's header block (eyebrow + title + intro paragraph) get more 'fun' and 'modern' personality without breaking the established brutalist-editorial brand system?"
winner: null
tags: [editions, header, typography, motion, layout]
---

# Sketch 012: Éditions Header Personality

## Design Question

Florian, looking at the shipped Éditions overview page: "je trouve cette partie un peu chiante, on peut la rendre un peu plus fun ? moderne ?" (I find this part a bit boring, can we make it a bit more fun? modern?) — referring specifically to the header block (eyebrow, "Éditions" title, and the new intro paragraph), which is currently a plain static vertical stack. Everything below it (the row list) stays as-is; this sketch is scoped only to the header.

## How to View

```
open .planning/sketches/012-editions-header-personality/index.html
```

## Variants

- **A: Graphic Eyebrow + Pull-Quote** — a small pink square marks the eyebrow, an animated pink underline draws in beneath "Éditions" on load, and the intro is treated as a pull-quote with an oversized display-font quotation mark. Typographic-personality direction; the layout stays the same vertical stack.
- **B: Kinetic Entrance** — the eyebrow gets a small pulsing pink dot, and on load the title settles in with a confident staggered slide + slight rotation (not just a fade), followed by the intro. Motion-driven direction; layout unchanged, personality comes from the entrance. Respects `prefers-reduced-motion`. Includes a "Rejouer l'entrée" button to replay the animation for review.
- **C: Broken Grid** — breaks the strict vertical stack at desktop widths: intro text sits beside the title (not below it), separated by a hairline, with an oversized outlined ghost numeral ("02", the édition count) filling the negative space as a graphic device. Compositional direction; falls back to a stacked layout on mobile.

## What to Look For

- Does it actually read as "fun/modern," or does it feel like a gimmick bolted onto a serious brand?
- Does it still feel like the same site as the rest of AJS (Unbounded display font, monochrome + single pink accent, sharp corners, hairlines) — no foreign visual language?
- A: does the pull-quote mark/underline read as intentional graphic detail or as clutter?
- B: does the entrance motion feel confident and quick, or does it get in the way / feel gimmicky on repeat visits?
- C: does the ghost numeral read as an intentional editorial motif, or as visual noise? Does the two-column split still work with a longer intro (e.g. once Romane edits the Sanity copy)?
- All three variants are cherry-pickable — e.g. B's entrance could be combined with C's layout, or A's underline detail could be added to any of them.
