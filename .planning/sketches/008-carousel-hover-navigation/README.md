---
sketch: 008
name: carousel-hover-navigation
question: "What should replace the scroll-to-open gesture (being removed) as the homepage carousel's primary hover/click navigation — a custom circular cursor for 'open', edge zones for prev/next, and a peek-preview of the adjacent gallery as you approach an edge?"
winner: "C"
tags: [homepage, carousel, cursor, interaction, motion, frontier]
---

# Sketch 008: Carousel Hover Navigation

## Design Question

The scroll-to-open gesture and its overscroll pull-feedback (sketch 007, shipped as quick-260726-obg, patched for a black-frame bug in quick-260726-qem) are being removed entirely — a step-back review found the gesture inherently easy to trigger by accident (a realistic 2-3 tick scroll crosses the threshold) and the code/UX complexity it required was mostly compensation for that risk, not the underlying idea. This sketch explores its replacement, per direct user request: a custom cursor that becomes a translucent circle over the photo's center (signaling "click to open the gallery" — the photo becomes clickable, in addition to the existing title link), and an arrow near the left/right edges (signaling "click for previous/next gallery"), with the adjacent gallery's photo elegantly peeking into view as you approach that edge.

## How to View
```
open .planning/sketches/008-carousel-hover-navigation/index.html
```
Move your mouse across each demo photo. Center = "open" cursor (a ring). Near either edge = an accent-colored arrow pill, with the adjacent gallery's photo peeking in proportional to how close you get. Click in the center to see the "opening" mock; click near an edge to advance to that gallery. Toolbar (bottom-right) toggles the cursor style (plain ring vs. labeled "VOIR") and the edge-zone width (15/22/30%).

## Variants
- **A: Sliver reveal** — a thin strip of the adjacent photo slides in from the approached edge, width proportional to proximity; the current photo stays fixed, separated from the sliver by a hairline.
- **B: Underlay wipe** — the adjacent photo sits full-size directly behind the current one at all times, revealed through a widening clip-path "window" from the edge, with the current photo dimming slightly as the window opens.
- **C: Parallax push** ★ Winner — the current photo itself shifts away from the approached edge (like being peeled back), revealing the adjacent photo underneath in the vacated space — the most physical/dimensional of the three.

All three share the same cursor system: a hairline-bordered translucent ring at rest in the center zone, morphing into a pill tinted in the CURRENT gallery's own accent color (`--current-accent`, already cycling per-gallery on the real site) with a directional arrow near an edge.

## Decisions (direct feedback)
- **Cursor label is permanent, not toggled**: the center-zone ring always shows "OUVRIR" (not a bare unlabeled ring) — the toolbar's Ring/Labeled toggle stays in the sketch for reference but "Labeled" is now the fixed default.
- **Edge-zone width confirmed at 22%**: initial feedback asked to narrow it (peek arriving "a bit too early"), tried at 15%, then explicitly reverted — 22% is the confirmed, correct width. Do not narrow this in the real implementation.
- **The homepage's colored accent panel (wordmark + intro text) is unaffected** — this sketch only explores the photo/cursor/navigation interaction; the accent panel corner shown here is a simplified stand-in, not a proposal to change or remove the real one.

## What to Look For (for reference — variant C is decided)
- B/A are kept for the record but not chosen — C's physical "peeling back" feel was preferred over A's restrained sliver and B's graphic seam.

## Implementation Notes (caught live while building this)
Both Variant A and B initially failed silently in testing: the peek was positioned correctly but invisible, because the current photo (full frame, higher z-index) has nothing clipping it, so it fully covers whatever peeks in underneath regardless of the adjacent slide's own position/clip. Fixed by also clipping the current photo's own edge by the same proportional amount, opening a real "window" for the peek to show through. Variant C doesn't have this problem — the current photo's own `transform` genuinely vacates space rather than relying on layering, so nothing else needs to yield. Worth remembering if this gets built for real: any "layer B peeks out from behind layer A" effect needs layer A actively clipped, not just layer B positioned.

## Sources / Context
- Grounded in the step-back UX + code-quality review that led to removing the scroll gesture (see conversation — a live realistic-scroll test crossed the navigation threshold in 2-3 ordinary ticks, and a code audit found the supporting machinery was mostly compensating for that risk).
- Cursor accent-color tinting reuses the real site's existing `--current-accent` per-gallery cycling mechanism (already used for the progress dashes and accent panel).
