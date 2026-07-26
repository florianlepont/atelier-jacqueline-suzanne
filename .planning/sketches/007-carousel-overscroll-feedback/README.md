---
sketch: 007
name: carousel-overscroll-feedback
question: "What progressive visual feedback should the homepage carousel's overscroll-to-open gesture use, so the site footer can be hidden again without reintroducing the accidental-navigation bug fixed in quick-260725-sj4?"
winner: "C"
tags: [motion, homepage, carousel, interaction, safety, frontier]
---

# Sketch 007: Carousel Overscroll Feedback

## Design Question

The homepage carousel opens the current gallery once you overscroll past the bottom of the page by 150px (accumulated wheel/touch delta). This was made fully silent — no visual feedback at all — per direct request (quick-260725-pit), and the site footer was reverted to always-visible after a real accidental-navigation bug (quick-260725-sj4): with the footer hidden, the page has no real scrollable content, so "you've reached the bottom" is true from the very first pixel, and a silent gesture meant an ordinary scroll could misfire with zero warning.

The user now wants the footer hidden again during carousel browsing (same UX complaint as the gallery detail pages, quick-260726-ltr). Research into "commit gesture" patterns (pull-to-refresh, the closest real-world analog — see Sources below) found that credible implementations always pair a deliberate threshold with progressive visual feedback, and let the visitor back out before the threshold with no trace left behind. Silence is what made the bug possible; visible, cancelable progress is what should replace the footer's old (accidental) role as a safety buffer.

This sketch compares three ways to surface that feedback, without bringing back the disliked floating text hint ("Continuer à scroller pour ouvrir", removed in quick-260725-pit).

## How to View
```
open .planning/sketches/007-carousel-overscroll-feedback/index.html
```
Scroll or swipe **down** inside each demo frame (mouse wheel, trackpad, or touch all work) — it simulates arriving at the very bottom of the homepage with the footer hidden, then continuing to push. Stop partway through to see it recede. Reaching the threshold (150px, matching the shipped `OPEN_OVERSCROLL_THRESHOLD`) opens a mock gallery view that auto-resets after ~2s so you can try again immediately. The toolbar (bottom-right) has a "Simulate 2 ticks" button and viewport toggle if you don't have a scroll input handy.

## Variants
- **A: Edge fill bar** — a dedicated thin bar at the very bottom screen edge, invisible at rest, fills left-to-right in the current accent color. Reuses the exact fill mechanic already shipped on the carousel's own per-gallery progress dashes (quick-260725-dcg) but as a new, separate element.
- **B: Progress-dash grows** — no new element. The already-visible, already-filling progress dash for the current gallery grows taller and gains a small upward cue as you push — the same control that shows "which gallery" doubles as "you're about to open it."
- **C: Photo pulls back (no chrome)** ★ Winner — no UI element at all, new or transformed. The photo itself scales down slightly and darkens proportionally — a direct physical response, like the scene is being pulled toward the next screen.

## What to Look For
- Does the feedback register clearly enough, early enough, that an *accidental* two-tick scroll would visibly announce itself before crossing the threshold (the actual safety property being restored)?
- Does releasing partway through feel like a clean "cancel," or does it look broken/stuck?
- Which reads as most consistent with the site's existing "no clutter" restraint — a new element (A), transformed existing chrome (B), or the content itself (C)?
- At the moment of commit, which feels most satisfying as the "payoff" into the gallery?

## Note on the demo mechanics (not a proposed implementation change)
This sketch calls `preventDefault()` on `wheel` and sets `touch-action: none` on the frame so the gesture stays contained inside the little box instead of scrolling the sketch page itself. That's a sketch-only necessity for a self-contained demo box. The real implementation must keep every listener passive and never call `preventDefault()`, exactly as it does today (quick-260725-cfm/sj4) — unrelated to and unaffected by which feedback variant is chosen.

## Learned by building this
The shipped accumulator (`HomeCarousel.astro`) only resets lazily — on the *next* scroll event after the 800ms idle window elapses. That's invisible today because there's nothing visible to leave stale. Once there IS visible feedback, a lazy reset would look like a bug (the indicator staying part-filled indefinitely after you've stopped). This sketch adds a proactive idle watchdog: if no forward delta arrives for 800ms, the indicator decays back to rest on its own. Whichever variant is chosen, the real implementation should adopt this same proactive decay — it's what makes "let go to cancel" actually read as cancellation, matching the pull-to-refresh research directly.

## Round 2 — fixing the commit moment (direct feedback)
First cut modeled arriving at the gallery as a hard cut to a separate opaque mock screen (dark background, its own title treatment) once the threshold was crossed — effectively treating the carousel and the gallery detail page as two disconnected screens. Direct feedback: that's not how the real transition works — the homepage and the gallery detail page already share the *same* photo, morphed continuously across the navigation via a cross-document View Transition (`view-transition-name: hero-photo`, sketch 006 / quick-260724-uf5), and quick-260725-tqs (Item 1) deliberately made the two pages' titles visually identical (same 18px/uppercase/left position) specifically so this moment reads as continuous, not a page swap.

Fixed directly in this sketch: on commit, the photo, its scrim, and the title are now left completely untouched — the same background photo and title carry straight through. Only the chrome that's genuinely carousel-only (the accent wordmark panel, the progress dashes, the index counter) fades away, since that chrome has no equivalent on the gallery detail page. A small format line ("Tirage giclée · édition limitée") fades in beside the persisting title as the one new thing that appears. Variant C's commit motion was also corrected — it no longer "falls through to black" (which read as its own version of the same two-separate-screens mistake); it now releases the pulled-back tension back to a settled, full-strength frame, i.e. arrival rather than a fall into somewhere else.

## Sources
- [ui-patterns.com — Pull to Refresh](https://ui-patterns.com/patterns/pull-to-refresh) — "the user's confidence in the fact that the refresh is happening is directly correlated to the visual feedback."
- [bizcatalyst360.com — Mastering Pull-to-Refresh: Design Principles and Best Practices](https://www.bizcatalyst360.com/mastering-pull-to-refresh-design-principles-and-best-practices/) — "if the user releases before reaching the refresh threshold, the refresh aborts and visual feedback disappears."
