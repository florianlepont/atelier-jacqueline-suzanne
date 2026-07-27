---
sketch: 009
name: editions-tile-hover-depth
question: "What hover/depth treatment for Éditions overview tiles feels soft and elevated instead of the current hard black offset shadow, per direct feedback from Romane?"
winner: "E"
tags: [layout, editions, hover, motion, consistency]
---

# Sketch 009: Éditions Tile Hover/Depth

## Design Question

The live `/editions/` page's tile hover state — thin black hairline border + a hard, blur-free `6px 6px 0 var(--color-ink)` offset shadow on lift — came directly from sketch 001's winning "Poster Grid" variant (explicitly chosen as "brutalist, no soft shadow" at the time). Romane has now seen it live and dislikes it: the black hairline border and, especially, the hard black shadow. She asked for something "more modern and dynamic."

Direct intake with Florian narrowed the direction to **"soft and elevated"** — gentle depth via a blurred shadow and subtle lift, calmer and more elegant than the current hard black offset. This sketch explores three ways to deliver that feeling while staying inside the real AJS brand tokens (mirrored 1:1 from `src/layouts/BaseLayout.astro` in `../themes/default.css`) and without touching the zigzag grid layout itself (that part is not the complaint).

Worth noting: the hard-offset-shadow motif itself isn't foreign to the brand — `ContactPageBody.astro`'s form panel uses `box-shadow: 10px 10px 0 var(--color-accent)` (pink, not black, and on a static panel, not a hover micro-interaction). The Éditions tile is the only place the offset shadow is (a) black/ink-colored and (b) a hover-triggered effect layered on top of photography — that combination is what reads heavy/dated on real photos.

Real content is used: the two currently-published éditions (Rebut, Silos), their actual titles/statements, and live Sanity CDN photo URLs — same ones seen on the production page.

## How to View

```
open .planning/sketches/009-editions-tile-hover-depth/index.html
```

Requires network access (Google Fonts CDN for Unbounded + live Sanity CDN photo URLs).

## Variants

- **Aujourd'hui (reference)** — reproduces the exact live treatment (black hairline border, hard `6px 6px 0` black offset shadow on hover/focus) so the alternatives can be felt against it directly, not just described.
- **A: Ambient Lift** — no border at all; hover = gentle rise (`translateY(-6px)`) + a soft, blurred, low-opacity shadow + a light image scale/brightness bump. Zero hard edges — the photo carries the interaction.
- **B: Soft Frame** — a hairline border still exists but in the site's neutral `--color-border` (not ink-black), invisible at rest and fading in on hover, paired with a blurred (not offset) shadow. The most conservative departure from today.
- **C: Elevated Card** — adds the site's existing `--radius-sm` (2px, already used on buttons/inputs) to soften just the corner, plus a layered near+ambient shadow for a more conventional "modern card" elevation — still monochrome and restrained.

## Winner: E — Duotone Reveal

Round 1 (A/B/C — shadow-only variations on the existing card metaphor) was rejected as too incremental/safe. Round 2 (D/E/F — dramatically different mechanisms) landed: **E, the pink duotone default with a cursor-following color-reveal spotlight**, referencing real duotone/riso print reproduction — directly on-theme for "éditions." Round 2's other two (D magnetic tilt, F kinetic marquee) were not chosen but preserved as reference.

Immediately after picking E, the layout/grid format itself was flagged as worth reconsidering too — carried forward into **sketch 010**, which explores alternative page compositions using E's duotone-reveal as the shared tile treatment.

## What to Look For

- Toggle between "Aujourd'hui" and each variant on the same tiles — does the new hover read as clearly calmer/more modern, or too subtle to register as a fix?
- Does **A**'s complete absence of any border/frame feel too bare on a plain white background, or refreshingly clean?
- Does **B**'s barely-there border add anything over A, or is it an unnecessary leftover of the old idea?
- Does **C**'s 2px radius read as "softened" or does it fight the site's otherwise sharp-corner language (SiteHeader, HomeCarousel, Button all use `--radius-none`)?
- All three keep the zigzag grid, scrim, and title/statement layout completely unchanged — confirm nothing there needs to change too.
- Resize with the toolbar (bottom-right) to check the lift/shadow still reads at tablet/phone widths.
