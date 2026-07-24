---
sketch: 006
name: cross-page-hero-transition
question: "Can a native cross-document View Transition morph a homepage grid tile's photo smoothly into the gallery detail page's full-screen hero, instead of a hard page navigation — and how much of the surrounding chrome should participate?"
winner: null
tags: [motion, homepage, gallery-detail, view-transitions, cross-document, frontier]
---

# Sketch 006: Cross-Page Hero Transition

## Design Question
The homepage (grid mode) and the gallery detail page (`DetailHero.astro`) are two separate documents — clicking a gallery tile today is a plain navigation, a hard cut. Modern Chromium (126+) supports **cross-document View Transitions**: pure CSS (`@view-transition { navigation: auto; }` on both pages, plus a matching `view-transition-name` on the source and destination elements), no JS orchestration required, unsupported browsers just navigate normally. This sketch validates the mechanism live (not just visually) and compares how much of the page should participate in the morph.

## How to View
Cross-document transitions only exist between two real navigable documents — this can't be tabs in one file. From `.planning/sketches/`:
```
python3 -m http.server 8734
open http://localhost:8734/006-cross-page-hero-transition/index.html
```
Requires Chrome/Edge 126+. Click a tile, use "← Retour" to go back and try another variant.

## Variants
- **A: Baseline** — both pages opt into `navigation: auto` but assign no `view-transition-name` to the photo. Shows the browser's *default* behavior once you opt in: a uniform crossfade of the whole page, no shared-element continuity.
- **B: Photo morph** — the clicked tile's `<img>` gets `view-transition-name: hero-photo` (set imperatively on click, mirroring the exact technique `Lightbox.astro` already uses for its within-page morph); the detail hero carries the same name statically. Only the photo morphs in continuous motion; everything else still does the default crossfade.
- **C: Photo morph + chrome persists** — same as B, plus the header/logo also share a `view-transition-name` (`site-header`) on both pages, so it doesn't flash/crossfade — it reads as staying in place while the photo and content change underneath.

## What to Look For
- Does the photo genuinely feel continuous, or does the surrounding crossfade fight it?
- In C, does a "fixed" header feel more polished, or does the header disappearing from the transition read as slightly odd (it does still move — position/size differ slightly between homepage and detail layouts)?
- The hero always lands full-screen at the end of the morph, before any scroll — confirms the follow-up ask ("hero stays full screen") is inherent to the mechanism, not something extra to build.

## Technical Verification (not just visual)
Beyond eyeballing it, this was verified live: in a real Chrome 150 context, clicking a tile in variants A/B/C all fire a genuine `pagereveal` event with a non-null `event.viewTransition` on the destination page — confirmed via `page.addInitScript` + a Playwright script, not just CSS source inspection. Zero console errors. This proves the native browser API is actually activating, not just present in markup.

## Implementation Note
No JS feature-detection branch is needed for the CSS-only opt-in (`@view-transition`) — unlike the existing in-page morphs (Lightbox/HomeCarousel), which guard with `typeof document.startViewTransition === 'function'` because they call the API imperatively. Here the browser silently no-ops the whole thing on unsupported browsers; only the `view-transition-name` assignment on click (a plain style write, harmless either way) touches JS at all.

## Scope Note
This sketch only covers grid-mode homepage tiles → gallery detail. Carousel-mode (single full-screen slide) would use the same technique on its current slide's image; not sketched separately since the CSS mechanism is identical, only which element gets the imperative `view-transition-name` on click differs.
