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

Florian's round-3 feedback: "et un fond un peu fun ou un effet dynamique ?" (and a bit of a fun background, or a dynamic effect?). Round 4 builds on D3 (clean, no ghost mark) and adds a background treatment or dynamic effect behind the whole header instead of a mark behind just the title.

## Variants — Round 4 (background/effect on top of D3)

`index.html` now shows Round 4 by default: **D3 (clean)** kept as a reference tab, plus three background/effect treatments:

- **E1: Halftone Print Texture** — a pink dot-halftone pattern (a nod to Éditions being *printed* objects — zines, offset print) sits behind the header, faded out via a radial mask so it reads as an intentional graphic zone rather than a flat repeating tile.
- **E2: Cursor Spotlight** — a soft pink glow follows the pointer within the header. This deliberately echoes the site's *existing* interaction language: the édition row list right below already has a cursor-follow photo preview panel, so this ties the header into a gesture visitors will already be learning on this exact page, rather than introducing an unrelated new pattern.
- **E3: Drifting Hairlines** — thin diagonal lines, using the same hairline weight/color as the rest of the site's borders, slowly drift behind the header for ambient motion without a loud new texture.

Florian's round-4 feedback: "I love E1! but it's not really dynamic and I don't want pink anymore. More blanc or grey." Round 5 keeps E1's exact composition and dot-halftone concept, switches the color from pink to ink-grey, and explores three different ways to make the texture actually move instead of just fading in once.

## Variants — Round 5 (grey + dynamic halftone)

`index.html` now shows Round 5 by default: **E1 (pink, static)** kept as a reference tab, plus three grey, in-motion takes:

- **F1: Drifting Grey Halftone** — the same dot field as E1, recolored to ink-grey, now continuously drifts (the dot grid slowly scrolls in a loop) so it's quietly alive at rest, not just faded in once.
- **F2: Ink Diffusion (cursor)** — a very faint grey dot grid sits behind the header at rest; moving the cursor over the header makes nearby dots grow larger and darker in a soft circle, like ink spreading into paper where you touch it. Ties into the same cursor-follow gesture the row list below already teaches on this page (same mechanic as round 4's E2, applied to the loved halftone instead of a glow).
- **F3: Breathing Halftone** — the dot field pulses gently in opacity on a slow loop, a print-grain shimmer with no directional movement.

## What to Look For

- Does it actually read as "fun/modern," or does it feel like a gimmick bolted onto a serious brand?
- Does it still feel like the same site as the rest of AJS (Unbounded display font, monochrome + single pink accent, sharp corners, hairlines) — no foreign visual language?
- Grey vs pink: does removing the pink make the texture read more "print," or does it lose some of the "fun" the pink added?
- F1 vs F3: constant directional drift vs. a slow opacity pulse — which "dynamic" feels right for a page people may sit on and read, not just glance at?
- F2: is cursor-only motion satisfying, or does the texture need to feel alive even before anyone touches it (in which case F1/F3 fit better as a base, with F2's diffusion possibly layered on top)?
- All variants are cherry-pickable across every round so far — e.g. F1's drift could combine with F2's cursor diffusion for both ambient AND reactive motion at once.
