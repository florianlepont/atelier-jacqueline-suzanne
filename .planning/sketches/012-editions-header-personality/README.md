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

## Variants — Round 1 (dramatic differences)

- **A: Graphic Eyebrow + Pull-Quote** — a small pink square marks the eyebrow, an animated pink underline draws in beneath "Éditions" on load, and the intro is treated as a pull-quote with an oversized display-font quotation mark. Typographic-personality direction; the layout stays the same vertical stack.
- **B: Kinetic Entrance** — the eyebrow gets a small pulsing pink dot, and on load the title settles in with a confident staggered slide + slight rotation (not just a fade), followed by the intro. Motion-driven direction; layout unchanged, personality comes from the entrance. Respects `prefers-reduced-motion`. Includes a "Rejouer l'entrée" button to replay the animation for review.
- **C: Broken Grid** — breaks the strict vertical stack at desktop widths: intro text sits beside the title (not below it), separated by a hairline, with an oversized outlined ghost numeral ("02", the édition count) filling the negative space as a graphic device. Compositional direction; falls back to a stacked layout on mobile.

Florian's round-1 feedback: "j'aime bien le 3 ! mais j'aimerais un truc encore plus fun. Tu peux aussi jouer sur la taille du titre en le grossissant si besoin" (I like #3! But I'd like something even more fun — feel free to make the title bigger too). Round 2 below refines C specifically.

## Variants — Round 2 (refining "C: Broken Grid")

`index.html` now shows Round 2 by default: **C: Original (round 1)** kept as a baseline tab, plus three refinements — all with a significantly bigger title (`clamp(64px, 9vw, 140px)` vs round 1's `clamp(40px, 4vw, 56px)`):

- **C2: Bold & Tilted** — the ghost numeral switches from a thin outline to a solid soft-pink fill, tilted -6° and peeking out from behind the bigger title like a torn poster layer; the eyebrow's pink square marker becomes a rotated diamond. Hovering the title block deepens the pink and straightens the tilt slightly.
- **C3: Stamp Pop** — the index numeral becomes a tilted (-9°) rubber-stamp badge: pink outline box, pink numeral, sticker-like. Hovering it snaps upright, scales up, and fills solid pink — a tactile micro-interaction.
- **C4: Motion Surge** — combines the bigger title with an entrance animation: the title scales/settles in with a slight rotation, the ghost numeral spins in on a delay and lands tilted, the eyebrow marker pulses continuously. Personality comes from scale + motion together. Includes "Rejouer l'entrée" and respects `prefers-reduced-motion`.

## What to Look For

- Does it actually read as "fun/modern," or does it feel like a gimmick bolted onto a serious brand?
- Does it still feel like the same site as the rest of AJS (Unbounded display font, monochrome + single pink accent, sharp corners, hairlines) — no foreign visual language?
- C2 vs C3: solid-tilted ghost shape vs. tactile stamp badge — which pink treatment feels more "AJS" and less generic?
- C4: does the entrance feel confident on first load, or does it wear thin on repeat visits (this is a page users may return to)?
- Is the enlarged title now too big relative to the "Rebut"/"Silos" édition titles below it, or does the size hierarchy still read clearly?
- All variants are cherry-pickable — e.g. C3's stamp could sit inside C4's motion, or C2's hover-deepen could apply to C3's stamp too.
