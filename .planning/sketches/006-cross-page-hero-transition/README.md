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

## Variant D: Real Site Preview (high fidelity)

Variants A/B/C use a minimal abstract mockup to isolate the mechanism — useful for comparing the technique in isolation, but too far from the real brand/layout to judge the actual feel. Variant D is the SAME mechanism as C (photo morph + persistent header), applied directly on top of a real `npm run build` output — the actual production homepage and all 5 real gallery detail pages, copied as-is into this sketch folder with only a small `<style>`/`<script>` snippet appended (no edits to the real markup/CSS/JS). This is what the transition will actually look like on the live site.

Covers BOTH real click paths:
- **Carousel mode** (default): click the gallery title (`.home-hero__title`, a real `<a>`) — its sibling `.home-hero__img--sharp` morphs into the destination's `.detail-hero__img`.
- **Grid mode** (toggle "Grille"): click any tile (`.home-grid__tile`) — that tile's `.home-grid__tile-img--sharp` morphs the same way.

In both cases the site header persists (shared `view-transition-name: site-header` on both pages' real `<header data-role="site-header">`).

### How to View
```
python3 -m http.server 8735 --directory .planning/sketches/006-cross-page-hero-transition/variant-d-real-site
open http://localhost:8735/
```
Click any gallery title (carousel) or toggle "Grille" and click a tile — this is the real site, so every other interaction (language switch, nav, lightbox) also still works.

### Technical Verification
Same live-browser method as A/B/C: confirmed via `page.addInitScript` that clicking the real carousel title AND a real grid tile both fire `pagereveal` with `event.viewTransition` non-null on the real destination gallery pages (tested on `/galleries/paysage/` and `/galleries/brume/`), the morphed image's computed `view-transition-name` resolves to `hero-photo` as expected, the header's resolves to `site-header`, and zero console errors on either path.
