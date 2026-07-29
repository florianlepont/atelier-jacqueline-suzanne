---
sketch: 014
name: about-page-composition
question: "What does the redesigned About page look like, and how should it resolve D-05 (hero-photo shrink reveal target) and D-07 (numbered-sections structure)?"
winner: "A — Settle & Restyled Two-Column Grid"
tags: [layout, about, editorial, typography, motion]
---

# Sketch 014: About Page Composition

## Design Question
The About page (`AboutPageBody.astro`) is getting an editorial redesign to match the "bold & graphic" direction now live elsewhere on the site. Two decisions were left open for review rather than guessed by the implementer: **D-05** — what the pinned hero-photo shrink resolves into (a pure motion "settle" with no text reveal, vs. a reveal into the "01 Atelier & pratique" section) — and **D-07** — the final structure of the two numbered sections (two-column restyle vs. stacked full-width row-list vs. another asymmetric structure). All variants also had to resolve the empty-`intro` watch-out: passing `intro=""` to the shared `PageTitleHeader` renders an empty intro paragraph plus a orphaned vertical hairline divider in the header's second column on ≥760px viewports, and each variant needed its own answer for that dead space without editing the shared component.

## How to View
```
open .planning/sketches/014-about-page-composition/index.html
```

## Variants
- **★ A: Settle & Restyled Two-Column Grid (winner)** — D-05: pure motion settle — the hero photo shrinks to ~86% and gently recenters, revealing no text, just a "tidying" beat before the sections begin. D-07: keeps today's two-column grid for the numbered sections, only re-skinned to the new spacing rhythm (wider gutters, hairline borders consistent with the header). Empty-intro fix: page-scoped **suppression** — the intro paragraph and vertical divider are hidden entirely via scoped CSS, and the giant title collapses to a single full-width column with no ghost column left behind.
- **B: Reveal into Section 01 & Stacked Row-List** — D-05: the hero photo shrinks hard to ~55% and settles left; the freed right-hand space reveals the "Atelier & pratique" title and the opening line of its real body copy (with a pink underline on the "01" index, mirroring `DetailHero`'s format-line treatment) as a preview of the full section below. D-07: both numbered sections become a stacked full-width row-list (Éditions-style — one row per section, index + title + text). Empty-intro fix: the circular portrait occupies the header's second grid column/row — the exact slot the empty intro + divider would otherwise sit in.
- **C: Reveal into Section 01 & Asymmetric Structure** — D-05: mirrors B's reveal-into-section-01 approach but the hero shrinks to ~60% and settles right instead of left, revealing "Atelier & pratique" on the left. D-07: an unequal-width column structure (1.6fr/1fr) with section 02 offset further down the page, distinct from both A's even grid and B's repeating rows. Empty-intro fix: the hairline divider is kept as-is, with the circular portrait anchored directly beneath it so the line visually "runs into" the portrait instead of ending in dead space.

## Why A — Settle & Restyled Two-Column Grid
Chosen directly on first review, no feedback rounds requested ("On valide le A"). The pure-settle hero (no text competing with the scroll motion) plus the familiar two-column section grid — only re-skinned to the new spacing rhythm — reads as the calmer, more confident evolution of the current page, without introducing the extra reveal choreography or structural departure that B and C carry. The page-scoped suppression of the empty intro/divider column is confirmed as the resolution the implementation waves should build (no edits to the shared `PageTitleHeader` component required).
