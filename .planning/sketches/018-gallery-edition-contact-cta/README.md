---
sketch: 018
name: gallery-edition-contact-cta
question: "How much visual weight should the Phase 24 contact CTA carry at the end of a gallery/édition photo grid, and does it coexist cleanly with the existing top-of-page related-gallery link on Édition pages?"
winner: "B"
tags: [layout, gallery, editions, cta, contact, phase-24]
---

# Sketch 018: Gallery/Édition Contact CTA

## Design Question

Phase 24 (Cross-Linking & Contact CTA) needs a contact CTA at the end of every Portfolio gallery's and Édition's photo grid, standing in for a sales flow that doesn't exist yet. Discuss-phase locked the copy direction ("Intéressé·e par une pièce ? Contactez-nous →", links to `/contact/`, generic wording) and confirmed the related-gallery link and the new CTA should share the same visual family, distinguished by position alone — but left the CTA's exact visual weight to Claude's discretion. This sketch explores that range and validates the two-link layout on Édition pages (related-gallery link at top, contact CTA at bottom) together.

## How to View

```
open .planning/sketches/018-gallery-edition-contact-cta/index.html
```

## Variants

- **A: Discret** — Exactly matches the existing `.editions-index__cta` / `.edition-detail__related` treatment already shipped on the site: 14px semibold text link + pink arrow, no visual separation from the surrounding content.
- **B: Renforcé** — Same link-with-arrow family, but heavier: 20px display-font (Unbounded) text, a thin pink hairline rule above it marking a "closing" moment, more surrounding whitespace.
- **C: Encadré** — A hairline-bordered box (1px, sharp corners, no fill) wrapping the CTA — reads as a small standalone module rather than an inline link; border turns pink on hover.

Each variant shows both scenarios in full page-tail context, mobile (375px) and desktop (720px):
1. **Gallery detail page** — no related-link (galleries don't have one), `hideFooter=true` in the real page so this must be a genuine in-page element.
2. **Édition detail page** — existing related-gallery link at the top (unchanged across all 3 variants — only the new CTA's weight varies) plus the new CTA at the bottom.

## What to Look For

- Does the CTA read as significant enough to stand in for "buy this," or does it disappear into the page like ordinary navigation?
- On Édition pages, do the top related-link and bottom CTA feel like two different things (their intended roles) or confusingly similar?
- Does the chosen weight still fit the site's existing "no filled buttons, sharp corners, hairline borders" identity?
- Any difference in how each variant reads at mobile vs. desktop width?

## Decision

**Winner: B — Renforcé.** Same link-with-arrow family as the site's existing related-gallery links, but with more presence: 20px Unbounded display-font text, a thin pink hairline rule above marking a "closing" moment, extra whitespace before it. Confirmed by Florian.
