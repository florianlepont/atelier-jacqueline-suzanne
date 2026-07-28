---
sketch: 012
name: contact-page-composition
question: "What does a 'bold & graphic' Contact page look like, given the current form panel's hard offset shadow is the exact motif Romane already rejected on the Éditions tiles (sketch 009)?"
winner: "A3"
tags: [layout, contact, typography, consistency]
---

# Sketch 012: Contact Page Composition

## Design Question
The Contact page (`ContactPageBody.astro`) is the one page kept deliberately unchanged after discussing an icon+modal alternative — but its current design predates the "Bold & graphic" direction now live on the homepage/Éditions. It uses a two-column editorial grid and a form panel with a hard `10px 10px 0` offset shadow — the same visual motif Romane asked to soften on the Éditions tiles. This sketch asks: what should Contact look like if it caught up to the current visual language, and what replaces that shadow?

## How to View
```
open .planning/sketches/012-contact-page-composition/index.html
```

## Variants
- **A: Grand aplat typographique** — Giant "Contact" headline dominates, two-column grid kept but the form panel becomes a solid ink-filled block (no shadow border) with light text and a pink accent-underline fill sweep on channel-row hover.
- **A2: Titre standard, sans scroll** — Refinement of A: title dropped to the standard `--editorial-page-title-size` used by every other page, vertical rhythm tightened so the whole page fits one screen with no scroll. Superseded by A3 — reads as flat/generic (feedback: "un peu boring").
- **★ A3: Grand titre, sans scroll (winner)** — Keeps A's giant title but still fits one screen without scrolling. Went through two real rounds of feedback-driven iteration (see below) before landing.
- **B: Flux éditorial une colonne** — Breaks the two-column grid entirely. Single centered column, pull-quote-style intro, channels as an inline row instead of a list, form unboxed and integrated into the flow — reads as an editorial page, not a "form + sidebar" utility page.
- **C: Bento asymétrique** — Reuses the Éditions overview's asymmetric bento-grid language directly: intro, email, Instagram, meta, and the form itself become differently-sized bordered cells in one grid, unifying Contact's visual system with Éditions.

## Why A3, and how it got there
- **Round 1 (title sizing):** the initial instruction was "keep A's big title, but make it fit without scrolling like [a basement.studio reference]." First attempt used `justify-content: space-between` on the page to push the header/form apart and fill the viewport — this backfired hard on short-but-wide windows (e.g. ~1241×570 CSS px): the leftover space concentrated into a single ~183px void between the title and the form instead of scaling gracefully. Fixed by grouping the header and the form/channels grid as ONE unit, centered vertically (`justify-content: center`), with a *bounded* `clamp()` gap between them (never more than ~88px) — leftover space now always splits into symmetric top/bottom margins instead of pooling in the middle. Verified via Playwright at 1241×570 (the exact ratio that broke), 1366×768, 1440×900, and 1920×1080 — zero scroll, symmetric margins, bounded internal gap at every size.
- **Round 2 (field craft):** the Nom/E-mail/Message fields were bare labels over a bottom-border line with large, unstyled empty space inside — flagged as "pas travaillé d'un point de vue UI." Fixed by giving every field a real bordered box (tinted background, 1px border, consistent internal padding) and wrapping the form in a hairline-bordered panel, matching the site's existing sharp-corner/hairline-border language instead of floating bare typography.
- **Round 3 (mobile):** the sketch's own tab bar wrapped to 5 rows on narrow viewports and hid the title/eyebrow completely behind its fixed position — looked broken, but was a sketch-tooling bug, not a design issue (fixed: tab bar is now a fixed 48px, horizontally scrollable). Real mobile issues found once visible: the submit button and input fields were 28–38px tall (below the brand system's own 44px `--tap-target-min`), and Nom/E-mail side-by-side left ~145px per field — too narrow to type an email address. Fixed for `max-width: 800px`: fields/button meet 44px min height, Nom/E-mail stack to full width.

## What to Look For
- Does removing the hard offset shadow (per Romane's prior feedback) read as an improvement, or does the form panel lose too much visual weight without it?
- Which composition still reads clearly as "form is the primary action" — the page's core job — vs. one where the form gets visually buried among other cells?
- Real content used: same copy/fields as production (`intro`, `publicEmail`, Instagram handle, `location`/`availability` meta, and the real form fields — `name`/`email`/`message`).
