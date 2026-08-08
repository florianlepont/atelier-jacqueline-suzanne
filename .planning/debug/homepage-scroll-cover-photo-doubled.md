---
status: diagnosed
trigger: "homepage-scroll-cover-photo-doubled: After the zoom completes (the zoom motion itself is now confirmed clean — no more overlapping-crop handoff glitch), the cover/first-gallery photo appears twice in the settled state."
created: 2026-08-08T00:00:00Z
updated: 2026-08-08T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED (see Resolution). No further action — goal is find_root_cause_only.
test: n/a
expecting: n/a
next_action: Return ROOT CAUSE FOUND to caller.

## Symptoms

expected: Once the zoom completes and the first gallery's slide settles, its cover photo should render exactly once, filling the slide.
actual: The user reports the cover photo appears twice once settled — the zoom's own transition motion is confirmed clean (the previously-fixed handoff-glitch overlap from `.planning/debug/resolved/homepage-scroll-zoom-handoff-glitch.md` is gone), but a static "doubled photo" artifact remains afterward.
errors: None reported — visual-only issue.
reproduction: On a real phone, scroll slowly through the wordmark zoom until it completes and the first gallery ("Silos" or whichever is first) settles into view; observe whether the photo looks doubled/duplicated rather than a single clean image. Confirmed reproducible in an emulated phone viewport (393x852) in both Chromium and WebKit via direct `getBoundingClientRect()`/`scrollTo()` inspection — see Evidence.
timeline: Found during round-2 real-device UAT for Phase 21, 2026-08-08. The zoom-to-slide handoff glitch itself (a DIFFERENT defect, involving overlapping photo crops DURING the transition motion) was already fixed by plan 21-07 and confirmed clean by the user in this same test round — this is a distinct, newly-surfaced defect in the SETTLED state.

## Eliminated

- hypothesis: "The zoom's crossfade `.home-scroll-deck__photo` layer and the first slide's own `.home-slide__img--sharp`/`.home-slide__img-placeholder` pair are both left permanently visible at full opacity in the exact same screen position (a stacking/z-index bug), so two DOM elements paint on top of each other at one fixed scroll position."
  evidence: Live-rendered geometry inspection (Playwright, Chromium + WebKit, 393x852 viewport) at multiple scroll offsets from t=1 (zoom completion) through full slide-0 arrival shows the two elements NEVER occupy the identical rect. `.home-scroll-deck__stage`/`.home-scroll-deck__photo` and `.home-slide` (first slide) are always vertically ADJACENT, non-overlapping boxes (e.g. at introBase+40: stage rect top=-40/bottom=812, slide rect top=812/bottom=1664 — touching, not overlapping). There is no z-index/stacking defect; both elements are correctly laid out in normal document flow, one directly below the other.
  timestamp: 2026-08-08T00:00:00Z

## Evidence

- timestamp: 2026-08-08T00:00:00Z
  checked: `src/components/HomeCarousel.astro` lines 422-434 (`.home-scroll-deck__track`/`__stage`/`__photo` markup) and lines 3814-3864 (their CSS) — the crossfade safety-net layer plan 21-05 added, whose opacity plan 21-07's per-frame driver writes to 1 once zoom progress t=1 is reached and never removes/hides afterward (confirmed in the driver script, lines 1923-1934: `onProgress` sets `photoLayer.style.opacity = String(state.photoOpacity)`; `clearInlineStyles()` only removes this opacity property on DETACH — reduced motion or >=768px — never on zoom completion. There is no code path that hides, collapses, or removes `.home-scroll-deck__stage`/`__photo` from the layout once t=1 is reached; it keeps rendering at its full `height: 100svh` for as long as the driver is attached (i.e. for the rest of the phone-width session).
  implication: The crossfade photo layer is DESIGNED to end at opacity 1 (a deliberate "reveal the real photo" end state, not a bug) but nothing in the codebase ever removes the LAYOUT SPACE (100svh block) it occupies. It is not display:none'd, not position:fixed/out-of-flow, and its containing `.home-scroll-deck__track` is not shortened once the zoom finishes — the full `calc(100svh + 900px)` track height is permanent, load-bearing geometry.

- timestamp: 2026-08-08T00:00:00Z
  checked: Live geometry via a temporary Playwright script (chromium + webkit, 393x852 viewport, built+previewed this worktree's actual `dist/`) reading `getBoundingClientRect()`/`getComputedStyle()` of `.home-scroll-deck__stage`, `.home-scroll-deck__photo`, and the first `.home-slide` at the scroll offset exactly 40px past zoom completion (t=1).
  found: |
    At scrollY = introBase + revealDistance + 40 (40px past the point progress reaches 1, `data-zoom-active="false"` confirmed, `trackTop=-940`):
      - `.home-scroll-deck__stage` (containing `.home-scroll-deck__photo`, opacity 1): rect top=-40, bottom=812 — occupying ~812px of the 852px-tall viewport (still position:sticky per computed style, but visually mid-release, sliding up).
      - first `.home-slide` (and its `.home-slide__img--sharp`, already `is-loaded`, opacity 1): rect top=812, bottom=1664 — only a 40px sliver visible at the very bottom of the viewport.
    Both are confirmed present, `visibility: visible`, `opacity: 1` simultaneously. Identical result in both Chromium and WebKit engines (position:sticky release mechanics are standard CSS, not an engine-specific quirk).
  implication: The crossfade layer's full-bleed photo and the first slide's own photo are BOTH on screen at once for a real, non-transient span of scroll — this is not a single bad frame, it is a whole scrollable region.

- timestamp: 2026-08-08T00:00:00Z
  checked: Swept scroll offsets from `introBase` (t=1) through `introBase + 900` in 100px steps, recording `.home-scroll-deck__stage` and first `.home-slide`'s rects at each; also captured a screenshot at `introBase + 420`.
  found: |
    - At `+0` (exactly t=1): stage fills the full viewport [0, 852]; slide 0 is entirely below it [852, 1704] — not yet visible at all.
    - At `+100` through `+500`: stage and slide 0 are each partially visible, splitting the 852px viewport between them (e.g. at +400: stage [−400, 452], slide [452, 1304] — roughly half stage/half slide).
    - Only at `+852` (a FULL EXTRA VIEWPORT HEIGHT of scroll past zoom completion) does the stage fully leave the viewport (bottom=0) and slide 0 fully fill it (top=0, bottom=852) — the true "settled" state.
    - Chromium's `scroll-snap-type: y proximity` did NOT pull a `scrollTo(introBase + 500)` (396px short of the +852 snap point) into alignment, but DID pull `scrollTo(introBase + 600)` (252px short) all the way to the +852 snap point — confirming 'proximity' snapping only engages within a limited distance of the snap target, not from anywhere in this 852px zone.
    - The screenshot at `+420` (see `midzone-chromium.png`, captured during this investigation) shows, top-to-bottom: the LOWER portion of the mountain/hillside cover photo (the crossfade layer, `background-size: cover; background-position: center` on the stage's box), immediately followed by the SKY/mountain-peak TOP of the exact SAME photo again (the first slide's own `.home-slide__img--sharp`, `object-fit: cover` centered on its own, separately-sized box) — a hard visual seam where the same photograph restarts from its top edge directly beneath where its own bottom edge just finished.
  implication: |
    Because `.home-scroll-deck__stage`/`.home-scroll-deck__photo` (100svh box) and `.home-slide` (also 100svh box, same aspect ratio) both independently apply a "cover, centered" crop to the SAME source photo (`firstGallery.heroSrc`, shared via the `--zoom-photo` custom property for the stage and `gallery.heroSrc` for the slide's own `<img>` — confirmed same source, `src/components/HomeCarousel.astro` lines 125-126 and 474-482), the two crops are visually IDENTICAL. Scrolling through the ~852px "dead zone" between t=1 and full slide-0 arrival shows that identical crop TWICE in direct succession — once as the stage's own copy finishes scrolling off, once again as the slide's copy scrolls into place — which is exactly what "the cover photo appears twice" describes. This is not confined to a single frame; it is a full extra viewport-height of scrollable distance, structurally guaranteed to be visible (fully or partially) on any real device regardless of scroll-snap behavior, because 'y proximity' snapping (not 'mandatory') is not guaranteed to pull a resting scroll position all the way from anywhere inside that zone to the slide-0 snap point — our own Chromium test showed the snap only engages within roughly 250-400px of the target, well short of covering the full 852px zone.

## Resolution

root_cause: |
  `.home-scroll-deck__stage` (plan 21-05, `position: sticky; height: 100svh`) hosts the zoom's crossfade safety-net photo layer (`.home-scroll-deck__photo`, plan 21-05) which the per-frame driver (plan 21-07) correctly drives to `opacity: 1` once zoom progress reaches t=1 (`.home-scroll-deck__photo`'s `background-image: var(--zoom-photo)`, sourced from `firstGallery.heroSrc` — the SAME photo the first slide's own `.home-slide__img--sharp` renders, `src/components/HomeCarousel.astro` lines 125-126/474-482).

  What no plan in this phase ever addressed: once t=1 is reached, `.home-scroll-deck__stage` does not disappear, shrink, or get removed from the layout — it is a normal (if `position: sticky`) block still occupying its full `height: 100svh` inside `.home-scroll-deck__track` (`height: calc(100svh + var(--zoom-reveal-distance, 900px))`, `src/components/HomeCarousel.astro` lines 3814-3836). The track's total scroll runway (900px, `ZOOM_REVEAL_DISTANCE`) governs only WHEN progress/opacity/header-hide reach their completed values — it says nothing about the stage's own occupied screen space. After the sticky release point (`trackTop = -900`), the stage continues scrolling away through NORMAL DOCUMENT FLOW, which takes a FULL ADDITIONAL VIEWPORT HEIGHT (100svh, ~852px on a typical phone) of scrolling before it is fully off-screen and the first `.home-slide` (which begins immediately after the track in the DOM, `scroll-snap-align: start`) is fully in view.

  During that entire ~852px "dead zone" (verified live: `getBoundingClientRect()` sweep from `t=1`'s scroll offset through +852px, in both Chromium and WebKit engines, plus a captured screenshot), the two boxes are simultaneously on screen, each independently applying a "cover, centered" crop of the IDENTICAL source photo to its own same-aspect-ratio box (`.home-scroll-deck__photo`: `background-size: cover; background-position: center`; `.home-slide__img--sharp`: `object-fit: cover`, default centered object-position) — producing two pixel-identical crops of the same image stacked directly on top of each other in scroll order. Visually this reads as the exact same photograph appearing a second time immediately after the first, which is precisely "the cover photo appears twice." `scroll-snap-type: y proximity` on `html:has(.home-scroll-deck)` does not reliably rescue this: it is a loose (non-'mandatory') snap mode, and this investigation's own measurement shows Chromium only pulls a resting scroll position into the slide-0 snap point from within roughly 250-400px of it — well short of covering the full 852px zone — so a real touch-scroll gesture (with its own deceleration curve, distinct from Chromium's or Safari's exact proximity heuristics) can easily come to rest anywhere inside that zone, showing the visitor a split-screen "same photo twice" view exactly as reported.

  This is a distinct, structural gap from the already-fixed handoff-glitch (`.planning/debug/resolved/homepage-scroll-zoom-handoff-glitch.md`), which was about a JS-state-staleness race during the transition FRAME. Plan 21-07's fix (a continuous per-frame rAF loop) correctly eliminated that transient staleness — the crossfade's own opacity/scale values are now always in sync with the real scroll position, which is why the MOTION itself now reads as clean. But no plan ever addressed the fact that the crossfade layer's CONTAINING BOX keeps occupying a full viewport height of scrollable layout after its opacity animation completes, which is a geometry/layout gap, not a timing gap — fixing the JS timing could never have fixed it, and didn't.
fix: (not applied — goal: find_root_cause_only)
verification: (not applicable — goal: find_root_cause_only)
files_changed: []
