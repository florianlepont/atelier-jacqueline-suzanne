---
sketch: 012
name: editions-header-personality
question: "How should the Éditions overview page's header block (eyebrow + title + intro paragraph) get more 'fun' and 'modern' personality without breaking the established brutalist-editorial brand system?"
winner: "F1 — Drifting Grey Halftone, APPROVED (Round 12 final: bigger title, broken-grid composition, grey dot-halftone drifting continuously with a mathematically-verified edge-less fade, deepens on hover, header+row-list entrance choreography)"
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

Florian's round-5 feedback: "I love F3, but I was expecting a small interaction when hovering on it + the dots not stoping on the margin" — F3 chosen as the winner, with two concrete bugs to fix: (1) the dot field visibly hit a hard rectangular cutoff inside the visible area instead of fading out smoothly — the mask's math was fine, but the underlying `.halftone` box itself was too narrow (`width: 60%`), so dots simply stopped existing at that box's edge before the mask ever reached full transparency; (2) no hover response — F3 only breathed ambiently, nothing changed on interaction.

## Round 6 (final): F3 fixed

`index.html` now shows Round 6 by default, with **F3 as the sole live variant** (F1/F2 kept as inert reference tabs, not iterated further):

- **Edge fix**: `.halftone`'s box is now generously oversized (extends ~35% past the header on the left, well past the visible area on every side) and the mask switched to a fixed-pixel-radius circle anchored near the top-right (`circle 260px at right 70px top 90px`) instead of a percentage-sized ellipse. Because the mask's radius is fixed and small relative to the new, much larger box, the fade always completes to full transparency long before the box's real edge is reached — there's no longer any point where dots simply stop existing.
- **Hover response**: hovering the header now speeds up the breathing animation (4s → 1.6s) and deepens the dots (`filter: contrast(1.35) brightness(0.85)`), so the texture visibly reacts to attention instead of only pulsing ambiently regardless of interaction.

Florian confirmed the diffuse-edge fix matches what he meant (sent a screenshot of the fixed, smoothly-fading state as reference for "quelque chose de diffus comme ça"), and added one more ask in the same message: "les Éditions devraient aussi avoir un effet d'apparition à l'ouverture de la page, pour rester cohérent avec celui du titre" (the éditions [row list] should also have an appearance effect when the page opens, to stay consistent with the title's).

## Round 7: rows now animate in with the header

Until this round, only the header (eyebrow, title, intro) animated in on load — the "Rebut"/"Silos" row list below was static, appearing instantly with no motion, which broke the sense of one coherent page-load sequence. Fixed: each `.editions-index__row` now fades up (`opacity: 0` + `translateY(20px)` → settled) using the same easing as the header's entrance, staggered after the intro finishes (row 1 at 0.6s, row 2 at 0.72s) so the whole page opens as one continuous choreography: eyebrow → title → intro → row 1 → row 2. Verified via computed styles mid-animation (700ms into the replay: row 1 partway through its fade at opacity ~0.68, row 2 not yet started at opacity 0) — confirms the stagger is real, not simultaneous.

Florian then reconsidered: "non mais en fait prenons F1" (no, but actually let's go with F1) — switching the winner from F3 (Breathing) to F1 (Drifting). All three round-6/7 fixes validated on F3 (diffuse edge, hover response, row entrance) were ported over to F1 unchanged, since none of them were specific to the breathing mechanic.

## Round 8 (current): F1 is the winner, same fixes ported

`index.html` now shows Round 8 by default, with **F1 as the sole live variant** (F2/F3 kept as inert reference tabs):

- Same generously-oversized box + fixed-radius circle mask as F3's fix — no hard edge, verified at 1493px actual box width vs. the 1084px visible header.
- Hover response ported: hovering speeds up the drift animation (10s → 4s) and deepens the dots (`filter: contrast(1.35) brightness(0.85)`), same values as F3.
- Row entrance ported: "Rebut"/"Silos" fade up staggered after the intro (0.6s / 0.72s), identical timing and easing to F3's.

Florian clarified one more time, with a screenshot of F2 for reference: "ce que je voulais dire c'est que j'aime bien le fait que sur les bord l'effet est plus diffu / estompé... comme sur F2" (what I meant is I like that on the edges the effect is more diffuse/muted... like on F2). The actual difference: F2's resting dot layer uses `rgba(26,26,26,0.14)`, much fainter than F1's `rgba(26,26,26,0.32)` — the edge *mask math* was already identical between them (both fixed in round 8), but F1's higher base opacity made the whole field, edges included, read as more present/less diffuse than F2's.

## Round 9: F1's dots softened to match

Lowered F1's dot opacity from `0.32` to `0.16` — close to F2's `0.14` resting state — so the field reads as muted/diffuse throughout, not just at the fade boundary. The hover response (`contrast(1.35) brightness(0.85)`, drift speeding up 10s → 4s) is unchanged and still applies correctly on top of the softer base — confirmed via computed style that `:hover` triggers the same filter values as before.

Florian corrected the round-9 fix: "non c'est pas ce que je veux dire c'est que je n'aime pas qu'on voit autant le cadre de la limitation de ton animation. Si tu fais les points à l'extrémité plus diffus, on voit moins l'effet cadre / rebord" (that's not what I meant — I don't like seeing the frame/boundary of your animation's extent so clearly. If you make the dots at the extremity more diffuse, the frame/edge effect is less visible). So the issue was never the overall dot opacity — it was that the mask's fade-to-transparent happened over too short a visual distance, so the boundary of the dot cluster still read as a perceivable shape/frame even though it was technically a smooth gradient.

## Round 10: a genuinely gradual, frame-less fade

Reworked `.halftone`'s mask from a simple two-stop `black 0%, transparent 100%` circle (260px radius) to a four-stop gradient with a much longer tail — `black 0%, rgba(0,0,0,0.65) 30%, rgba(0,0,0,0.22) 60%, transparent 100%` at a 420px radius — and enlarged the box accordingly (`top/bottom: -160px`, `left: -55%`, `right: -60px`) so the far larger fade radius still completes safely within the box before hitting its real edge. The extra gradient stops slow the falloff curve near the outer edge specifically (the previous version's tail dropped too fast, "using up" its softness before it registered visually) — verified by screenshot that the dot field now trails off gradually across a wide area with no perceivable ring/frame boundary anywhere in the header.

Round 10's fix wasn't enough: "je vois toujours la boundary même si elle à été réduite" (I still see the boundary even though it's been reduced). Root cause: round 10's mask (420px radius) had only been visually checked at a ~1280px-wide viewport. At narrower widths the same fixed-pixel radius covers proportionally more of the header, but the multi-stop gradient's early stops (30%/60% of only 420px) still completed their transition to near-transparent within a fairly short absolute distance — short enough to still read as a discernible edge once the header itself was narrower and closer to that transition zone.

## Round 11: much longer fade, verified at multiple widths

Reworked the mask again — radius `420px → 640px`, five gradient stops instead of three for an even more gradual curve (`black 0%, 0.72 @18%, 0.42 @40%, 0.18 @65%, 0.05 @85%, transparent 100%`), and the box enlarged to comfortably contain the new radius on every side (`top/bottom: -260px`, `left: -90%`, `right: -100px`). This time verified visually at **three viewport widths (800px, 1024px, 1440px)**, not just one — confirmed via screenshots at each that the dot field trails off gradually with no perceivable edge anywhere, which is what exposed round 10's gap in the first place (narrow-viewport testing was missing).

Still visible: "I still see the boundary :(", with a screenshot showing a hard vertical cutoff on the right side of the dot field, well before reaching the actual page edge.

## Round 12: the actual root cause, finally isolated

Rounds 10-11 grew the mask's fade radius (420px → 640px) but never re-checked whether the `.halftone` box's overflow on each side actually exceeded that radius — it didn't, on two of four sides. The mask anchor sits near the header's top-right corner; a 640px-radius circular fade needs >640px of box overflow in *every* direction from that anchor, including right and top, not just left. The box only had `right: -100px` and `top: -260px` of overflow — so the mask's own fade was being clipped by the box's edge on those sides before it ever reached transparent, which is exactly the hard cutoff visible in Florian's screenshot (on the right, this time — round 6-11's fixes had all focused on the left edge because that's what earlier, narrower-radius screenshots happened to expose).

Fixed by re-deriving the geometry instead of guessing again: anchor the mask exactly at the header's top-right corner (`right 700px top 700px` on a box with `700px` overflow on *all four* sides — right: -700px, top: -700px, bottom: -700px, left: -700px), which makes the margin from anchor to box edge a flat 700px in every direction, `>` the 640px radius, always, regardless of viewport width. Verified two ways this time, not just visually: (1) computed the actual margin via `getBoundingClientRect()` at 800px and 1440px viewports — 700px in every direction at both, confirming the box can never be the limiting factor again; (2) screenshots at both widths show the fade completing smoothly with no visible edge anywhere in the frame.

## What to Look For

- Does it actually read as "fun/modern," or does it feel like a gimmick bolted onto a serious brand?
- Does it still feel like the same site as the rest of AJS (Unbounded display font, monochrome + single pink accent, sharp corners, hairlines) — no foreign visual language?
- Confirm no perceivable frame/edge to the dot cluster anywhere, at your actual browser window width — this was checked mathematically (not just by eye) this round, so it should hold at any width now, but flag it immediately if not.
- At the softened 0.16 dot opacity, is the hover contrast bump still noticeable enough to register as feedback, or does it now need to be stronger since there's less base material to darken?
- Constant drift (F1) vs. the breathing pulse (F3, still in the file for comparison) — now that both have identical polish, which motion actually feels better over time on a page people may read, not just glance at?
- Does the row entrance feel like a natural continuation of the title's entrance, or does the 0.6s/0.72s delay feel too slow if there are ever more than 2 éditions (e.g. 5-6 rows — should later rows keep incrementing the delay, or cap it so the list doesn't take forever to finish appearing)?

## Approved

Florian: "It's amazing! approved." **F1 — Drifting Grey Halftone (Round 12 final state)** is the confirmed direction for the Éditions overview header. Ready to move to real implementation in `src/components/EditionsOverviewBody.astro` whenever the go-ahead is given — the row-entrance stagger's hardcoded 2-row timing (see note above) is the one open implementation detail to resolve for real content beyond 2 éditions.
