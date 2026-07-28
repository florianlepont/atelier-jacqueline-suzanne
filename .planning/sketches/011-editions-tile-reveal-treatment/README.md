---
sketch: 011
name: editions-tile-reveal-treatment
question: "Same cursor-spotlight reveal effect as sketch 009's winning variant E, but without the pink accent color — what else could the 'cover' treatment be?"
winner: null
tags: [editions, hover, motion, color, frontier]
---

# Sketch 011: Éditions Tile Reveal Treatment

## Design Question

Florian liked sketch 009's winning mechanic (E — Duotone Reveal: a cursor-following circular spotlight that reveals the true-color photo through a covering treatment) but wasn't sure about the pink accent color used for the duotone tint. This sketch keeps the exact same interaction mechanic — identical CSS mask-image spotlight, same cursor tracking — and only varies what the "cover" treatment looks like, answering both "same effect, no pink" and "explore other solutions."

The same 4 photos (Rebut, Silos, Grain, Marée basse — a deliberate mix of dark B&W, dark color, and one bright image) are reused unchanged across every tab, so the only variable being judged is the cover treatment.

## How to View

```
open .planning/sketches/011-editions-tile-reveal-treatment/index.html
```

## Variants

- **Référence** — the current pink duotone (sketch 009/010), for direct A/B comparison.
- **A: Duotone encre** — the identical mix-blend-mode technique, just swapped from pink to a neutral warm graphite tone. In practice this reads as an elegant, restrained **sepia** — the most direct, lowest-risk answer to "same effect, no pink."
- **B: Monochrome Reveal** — no color anywhere. Default is a genuine black & white photo (like a photocopied zine); hovering "colorizes" the spot under the cursor. The simplest, most literal answer to "no accentuation color."
- **C: Négatif** — default shows the photo as an inverted B&W film negative; hovering "develops" the true positive. Zero color, and directly evokes how analog photography actually works — the most conceptually striking of the four.
- **D: Trame (halftone)** — default is a stylized dot-screen print simulation (like real offset/riso halftone), high contrast, zero color; hovering reveals the clean photo. The most literal "printed object" interpretation.
- **E: Négatif couleur** — requested follow-up to C: instead of a neutral gray inversion, an authentic warm orange/amber cast (the film base + fog color real color negatives carry before correction — including the characteristic greenish skin tones inversion produces). Still zero brand-pink, but reads as noticeably more "alive"/colorful than C's neutral version.
- **F: Négatif au survol (mécanique inversée)** — corrects a misread of the brief: A–E all default to the TREATED look and reveal true color through a hole. Florian actually wanted the opposite — the photo stays normal/color everywhere, all the time, and hovering makes a circular spotlight show the negative (E's warm cast) only inside that circle, following the cursor. Outside the circle nothing ever changes.

## What to Look For

- Does **A**'s warm graphite actually read as "sepia" rather than "duotone" — is that a plus (elegant, print-like) or does it lose the punch the pink had?
- Does **B**'s plain black & white feel too plain/expected, or is its simplicity exactly the point?
- Does **C**'s negative-to-positive feel too dramatic/unfamiliar for visitors who don't immediately parse "this is a film negative," or does the concept land even without that context?
- Does **D**'s dot texture read as "printed" or as visual noise/dirty at tile size — check by zooming out (this is the riskiest of the four to hold up at small sizes).
- All four keep the cursor-spotlight mechanic completely unchanged from sketch 009 — confirm none of them feel like they lost "the effect" Florian liked.
