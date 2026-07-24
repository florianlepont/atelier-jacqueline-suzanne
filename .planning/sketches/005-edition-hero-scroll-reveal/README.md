---
sketch: 005
name: edition-hero-scroll-reveal
question: "Should the édition detail page's static full-bleed hero become a pinned, scroll-scrubbed reveal (inspired by a-chen.webflow.io's WORKS section), and how dramatic should the effect be?"
winner: null
tags: [layout, editions, detail-page, motion, frontier]
---

# Sketch 005: Édition Hero Scroll Reveal

## Design Question
The current édition detail hero (`.edition-detail__hero`) is a static 70vh full-bleed photo with an overlay title. Reference: [a-chen.webflow.io](https://a-chen.webflow.io)'s "WORKS" section pins a full-bleed photo (`position: sticky`) while scrolling, then shrinks its width as scroll progresses, revealing the section title in the negative space — built with Webflow's native scroll-linked interactions (no GSAP/library). We're asking: does the same *mechanism*, adapted to AJS's sober brand (no grain, no neon, no outline type), make a better entrance to an édition than the static hero — and if so, how much drama fits?

## How to View
```
open .planning/sketches/005-edition-hero-scroll-reveal/index.html
```
Scroll *inside* each bordered frame (it's a fixed-height simulated viewport, not the page itself).

## Variants
- **A: Subtle Settle** — photo shrinks ~12% into a slightly inset frame; overlay title fades out, then reappears centered beneath the settled photo. Minimal drama — a "settle," not a reveal.
- **B: Bold Reveal** — photo shrinks to ~55% width, settles left as a framed portrait; the space that opens on the right fills with the édition title in large Unbounded display type. Closest to the reference's energy, in monochrome + pink only.
- **C: Settle + Facts** — like A, but the reveal continues: title fades in, then the pink-underlined format line (sketch 003's winner) crystallizes right after it, inside the same settled frame — a short "photo → title → facts" sequence before normal content takes over.

## What to Look For
- Does the shrink read as intentional/elegant, or does it feel like the photo is "getting smaller" for no reason?
- B is the most dramatic — does it still feel like AJS, or does the scale of the title tip into showing off?
- C front-loads information (title + format) before the user even reaches the normal content flow — is that helpful context or does it duplicate what's already below?
- Toggle "Simuler prefers-reduced-motion" (top right) — confirms the mandatory fallback: no sticky pin, no scroll-linked motion at all, just the settled end-state shown immediately (mirrors the HomeCarousel/Lightbox View Transitions convention already in production).

## Implementation Note
Built with vanilla JS (`position: sticky` + a `scroll` listener computing `progress = scrollTop / revealDistance`, driving width/opacity/transform inline styles) — no library, matching the reference's approach and requiring nothing new in the stack. Real production version would run on the actual page scroll, not a boxed sub-viewport (the box here exists only so three variants can be compared side by side without navigating away).
