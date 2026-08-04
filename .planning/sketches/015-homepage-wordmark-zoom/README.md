---
sketch: 015
name: homepage-wordmark-zoom
question: "Phase 21's roadmap calls this the milestone's riskiest, most subjective piece: how should the full-screen wordmark actually zoom/dissolve into the first gallery's photo as a phone visitor scrolls?"
winner: "A"
tags: [motion, homepage, wordmark, scroll, phase-21, frontier]
---

# Sketch 015: Homepage Wordmark Zoom

## Design Question

Phase 21 (Homepage Scroll Experience) replaces the mobile carousel/grid toggle with one continuous scroll-driven view opening on a full-screen "Atelier Jacqueline Suzanne" wordmark that zooms through its letterforms into the first gallery's photo. `21-CONTEXT.md` already locked the *mechanism* (D-01 through D-04): extend the existing photo-cutout wordmark (`background-clip: text` in `HomeCarousel.astro`), pin it via `position: sticky` over a fixed scroll distance (mirroring `DetailHero.astro`'s pinned-shrink pattern), no other UI during the zoom, fully reversible/scrubbable in both directions.

What's still open — and what this sketch exists to answer — is the *feel*: does the wordmark itself grow and swallow the screen, does it fade away as the photo fades in, or does something else entirely read better? And at what scroll pace?

## How to View
```
open .planning/sketches/015-homepage-wordmark-zoom/index.html
```
Each variant renders inside a simulated 375×812 phone frame with its own internal scroll — scroll or trackpad-swipe *inside the phone frame* (not the page). The wordmark starts full-screen; scrolling plays the transition; scrolling back up reverses it exactly (D-04). Past the transition, one gallery "slide" (Silos) arrives with a title/description reveal so you can feel the landing, not just the transition in isolation. Pace buttons (Quick/Balanced/Cinematic) change the scroll distance live; Reset snaps back to the top.

## Variants
- **A: Scale Through** ★ Winner (Cinematic pace) — the wordmark itself (photo cutout intact) scales up to ~8.5× with an accelerating ease, so you fly straight into the letterforms until the negative space between glyphs is all that's on screen; a fast crossfade in the last 15% swaps to a plain photo for a clean final frame. The most literal reading of "zoom through the letterforms."
- **B: Cross Dissolve** — the wordmark fades out (with a slight Ken Burns scale drift) while the full photo fades in underneath. The exact same math idiom already shipped in `DetailHero.astro` (clamp/lerp/rAF against scroll position), just driving opacity/scale instead of width/position. Calm, classic, the technically safest option.
- **C: Letters Open (no scale)** — deliberately *not* a zoom. The wordmark never moves, scales, or fades. Only the solid panel color surrounding the letters dissolves to reveal the same photo already showing through the cutout, so the letters stop reading as "text" because their surroundings catch up to matching content, not because anything visibly moves. Included as a genuine alternative hypothesis to "zoom," not a weaker version of A/B.

## What to Look For
- Which one actually reads as "zooming through the letterforms" the way the roadmap describes it — and does that framing even matter once you're looking at the real feel, or does a calmer option (B, C) work better than the literal brief?
- At the extreme end of A's scale, does it look like flying through architecture, or does it start to look like a blurry JPEG? The crossfade-to-clean-photo safety net kicks in at t=0.85 — is it noticeable as a "cut," or invisible?
- Does B's letter-shape fade-out feel like the letters are dissolving away (in a good way), or like the effect "gave up" partway through?
- Is C's stillness a deliberate, premium restraint, or does it feel like nothing happened — especially on a real phone where you can't compare tabs side by side the way you can here?
- Across all three: which pace (Quick/Balanced/Cinematic) matches the drama of the visual, and does that differ per variant?

## Round 2 — real-device testing and the winning fixes
This is a mobile-only, phone-touch-scroll feature, so the desktop side-by-side comparison (`index.html`) wasn't sufficient on its own — a `mobile.html` twin was added (identical variants, real `100dvh`/window-scroll instead of the bounded phone-frame div) so it could be tested live on a real phone over the local network. Confirmed on a real device: **Variant A (Scale Through), Cinematic pace**.

Two corrections came out of that real-device pass, both now fixed in `index.html` and `mobile.html`:
1. **Real font.** The sketch was never loading the actual Unbounded display font — `default.css` only declares the `--font-display` custom property, it doesn't load the font file itself, so the sketch was silently falling back to the system sans-serif the whole time. Fixed by adding the same Google Fonts CDN link (`Unbounded:wght@600;900`) every other sketch in this project already uses.
2. **Zoom anchored on the "A."** The scale's `transform-origin` was a guessed center-of-block percentage. Direct feedback: the zoom should focus specifically on the "A" (first letter of "Atelier"). Fixed by wrapping that glyph in a `<span>` and computing `transform-origin` live from its actual `getBoundingClientRect()` relative to the wordmark box — accurate regardless of font-load timing or viewport width, rather than a hand-tuned guess.

## Note on the demo mechanics (not a proposed implementation change)
Progress in this sketch is driven directly by the phone-frame's own bounded `scrollTop` (`t = clamp01(scrollTop / revealDistance)`), the same approach `DetailHero.astro`'s script comment credits to sketch 005's original bounded-div build before it was "adapted... to real page scroll." The real Phase 21 implementation will do the same adaptation: derive progress from the track element's position in the real page scroll, not a bounded div. Reduced-motion handling (D-15) and the header-chrome fade (D-12) are both already fully decided in `21-CONTEXT.md` and intentionally not re-tested here — this sketch stays scoped to the one open question (the zoom/dissolve feel itself).

The gallery name ("Silos") is a real gallery in this project; the description text and exact photo crop are illustrative placeholders, not live Sanity content.

## Sources
- `.planning/phases/21-homepage-scroll-experience/21-CONTEXT.md` — D-01 through D-04, D-12, D-15 (locked mechanism/constraints this sketch builds on).
- `src/components/DetailHero.astro` (lines 198-320) — the site's only existing scroll-scrubbed pinned-reveal driver; this sketch's progress math mirrors it directly.
- `src/components/HomeCarousel.astro` (~lines 2460-2570) — the existing `background-clip: text` photo-cutout mechanism this phase extends.
- `.planning/sketches/005-edition-hero-scroll-reveal` — the original pinned scroll-scrubbed reveal sketch `DetailHero.astro` was built from; closest existing precedent for this motion language.
