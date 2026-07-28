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

Florian's round-2 feedback: "j'aime bien C4 mais ça ne signifie rien le 02" (I like C4, but the "02" doesn't mean anything) — correct catch: it was a static decorative placeholder standing in for "number of published éditions," but nothing on the page explained that, so it just read as a random unexplained number. Round 3 keeps C4's motion exactly, swaps out what fills that space.

## Variants — Round 3 (swapping the "02" in C4)

`index.html` now shows Round 3 by default: **C4 (with "02")** kept as a reference tab, plus three replacements — same title size, same entrance motion (scale/settle + eyebrow pulse + intro fade), only the decorative mark behind the title changes:

- **D1: Spark Mark** — the "02" is replaced with a solid pink spark/asterisk glyph (✳). Purely decorative — doesn't pretend to be data, just graphic energy. Spins in on load like the old numeral did.
- **D2: Ghost Echo ("É")** — replaced with a huge thin-outline echo of the title's own accented initial. Reinforces the wordmark itself instead of introducing unexplained new content.
- **D3: No Ghost (clean)** — the decorative mark is removed entirely. Personality comes only from the bigger title size and the settle-in motion.

## What to Look For

- Does it actually read as "fun/modern," or does it feel like a gimmick bolted onto a serious brand?
- Does it still feel like the same site as the rest of AJS (Unbounded display font, monochrome + single pink accent, sharp corners, hairlines) — no foreign visual language?
- D1 vs D2: an abstract mark vs. an echo of the title's own initial — which still feels intentional rather than random?
- D3: is the ghost mark actually adding anything, or was the bigger title + motion already enough "fun" on its own?
- Does the entrance feel confident on first load, or does it wear thin on repeat visits (this is a page users may return to)?
- All variants are cherry-pickable — e.g. D1's spark could use D2's outline-only treatment instead of solid fill, or vice versa.
