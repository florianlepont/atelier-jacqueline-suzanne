---
status: diagnosed
trigger: "Investigate issue: homepage-scroll-missing-intro-beat — Homepage phone-width scroll experience opens directly on the wordmark-zoom; the user expected a preceding logo+scroll-cue beat, then the site's intro tagline, before the zoom begins."
created: 2026-08-05T00:00:00Z
updated: 2026-08-05T01:00:00Z
---

## Current Focus

hypothesis: CONFIRMED — no pre-zoom intro beat exists anywhere in the phone-width markup/CSS/JS; the wordmark-zoom stage's own t=0 rest state (scale 1, wordmarkOpacity 1) is literally the first thing painted. Content for a tagline beat already exists and is fetched/available in the same component scope (`introBody`) but is not rendered into the new deck markup at all; a brand logo image path is also already computed in-scope (`logoBlackSrc`/`logoWhiteSrc`). Insertion is structurally low-risk because `computeZoomProgress` derives progress from the track's own live `getBoundingClientRect().top`, not from a document-relative offset — so prepending sibling content before `.home-scroll-deck__track` requires zero changes to `ZOOM_REVEAL_DISTANCE`/track-height math. The two real frictions are: (1) D-12's header-hide is wired solely to `data-zoom-active`, which the driver only ever sets once the zoom track itself is in view — an intro beat inserted before the track would show the small top-left header logo simultaneously with a new large centered logo unless the hide condition is extended; (2) 21-04-PLAN.md's Task 1 case 3 (and its implemented spec) explicitly asserts the zoom wordmark is visible and >=60%/40% of viewport "before any scrolling" — adding a preceding beat necessarily invalidates that literal assertion by design and must be deliberately rewritten, not left as accidental breakage.
test: n/a (goal: find_root_cause_only — investigation complete, no fix applied)
expecting: n/a
next_action: n/a — return findings to caller for gap-closure planning.

## Symptoms

expected: On first load at phone width (<=767px), the visitor should see: (1) a centered AJS logo with a scroll-down indicator, (2) then the site's intro tagline appearing below the logo, (3) then that beat disappears and the wordmark-zoom (as currently built) begins.
actual: The wordmark-zoom is the very first thing shown on load — there is no preceding logo/scroll-cue beat, and no intro-tagline beat.
errors: None — this is a design/scope gap, not a code exception.
reproduction: Load / (or /en/) at phone width fresh, observe the very first paint before any scroll input.
started: Found during real-device UAT for Phase 21 (Homepage Scroll Experience), 2026-08-05.

## Eliminated

(none — this is a scope/design gap investigation, not a hypothesis-elimination bug hunt; no candidate causes were ruled out because there is no code defect to isolate.)

## Evidence

- timestamp: 2026-08-05T00:10:00Z
  checked: src/components/HomeCarousel.astro lines 355-411 (deck markup) and 3346-3488 (deck CSS)
  found: The phone-width deck root `.home-scroll-deck` contains exactly two children in DOM order — `.home-scroll-deck__track` (the pinned zoom stage: photo layer + full-screen wordmark `<h1>`) and `.home-scroll-deck__slides`. There is no other element before the track — no logo image, no scroll-cue/chevron affordance, no tagline paragraph anywhere in this subtree.
  implication: Confirms literally: first paint at phone width is the wordmark-zoom stage's rest frame, nothing precedes it.

- timestamp: 2026-08-05T00:15:00Z
  checked: src/lib/home-carousel.ts computeWordmarkZoomState (lines 262-272) and computeZoomProgress (lines 226-229)
  found: At t=0 (scroll position 0, track top at viewport top), the state is `{ scale: 1, wordmarkOpacity: 1, photoOpacity: 0 }` — i.e. the "rest" frame of the zoom effect IS the full-screen wordmark with no photo crossfade yet. There is no separate earlier state machine step; t=0 is defined as "wordmark alone," not "logo + cue."
  implication: The current implementation treats the built full-screen wordmark itself as the entire opening beat. Adding a preceding logo+cue / tagline sequence is additive scope, not a fix to existing logic.

- timestamp: 2026-08-05T00:20:00Z
  checked: grep for "scroll-cue"/"scroll-down"/"chevron"/"arrow-down" across HomeCarousel.astro
  found: No matches anywhere in the file.
  implication: No scroll-down affordance element exists in any form (not even hidden/unstyled) to repurpose — it would need to be authored from scratch.

- timestamp: 2026-08-05T00:25:00Z
  checked: sanity/schemas/siteSettings.ts, src/pages/index.astro, src/lib/site-config.ts, src/components/HomeCarousel.astro lines 40-105
  found: A "site intro tagline" concept already exists as live, fetched content: `resolveHomepageIntro(homePage, locale)` is resolved by index.astro/en/index.astro into `siteCopy.homepageIntro`, threaded into `HomeCarousel.astro` as a prop, and bound locally to `const introBody = siteCopy.homepageIntro` (line 93). It is currently rendered into `.home-hero__intro` (desktop/tablet carousel accent panel) and `.home-grid__intro-body` (grid mode) — both inside `.home-hero`/`.home-grid`, which are `display:none` at phone width per 21-04's Task 3. (Note: `siteSettings.ts`'s own `homepageIntro` field is a separate, genuinely-dead legacy field superseded by the `homePage` singleton — not the live source; the live source is real and already in scope.)
  implication: The exact copy needed for beat 2 ("the site's intro tagline") is already fetched, already typed, and already sitting in a local const in the same component file where the new markup would go. No new Sanity schema work or data-fetch is required — this is a pure "render it somewhere new" job.

- timestamp: 2026-08-05T00:30:00Z
  checked: src/pages/index.astro lines 98-104
  found: `logoWhiteSrc`/`logoBlackSrc` (the same brand logomark PNGs `<SiteHeader>` renders top-left) are computed locally inside HomeCarousel's own frontmatter via the same base-aware `assetBase` pattern BaseLayout.astro uses — not passed in as a prop from a parent.
  implication: A "centered AJS logo" beat 1 can reuse these already-computed asset paths directly with zero new prop-threading between BaseLayout/index.astro/HomeCarousel.astro.

- timestamp: 2026-08-05T00:35:00Z
  checked: src/lib/home-carousel.ts computeZoomProgress (line 226-229): `clamp01(-trackTop / revealDistance)`; CSS `.home-scroll-deck__track { height: calc(100dvh + var(--zoom-reveal-distance, 900px)) }`, `.home-scroll-deck__stage { position: sticky; top: 0; height: 100dvh; }`; `.home { position: relative; }` (no `overflow` set, confirmed no nested scroll container)
  found: Progress is derived purely from the track element's own live `getBoundingClientRect().top` relative to the viewport, not from a document-relative scroll offset or a fixed distance-from-top-of-page assumption. While `trackTop > 0` (track hasn't yet reached the viewport top because something before it is still being scrolled past), `-trackTop` is negative and `clamp01` floors it to 0 — the exact same "rest" state as today's t=0.
  implication: Prepending a new intro-beat section as a sibling before `.home-scroll-deck__track` (still inside `.home`, still normal document flow) requires ZERO changes to `ZOOM_REVEAL_DISTANCE`, the track height calc, or `computeZoomProgress`/`computeWordmarkZoomState` — the zoom simply won't start until the browser has scrolled past the new beat and the track's own top edge reaches the viewport top. This directly resolves the investigation-note's question about whether REVEAL_DISTANCE math needs to shift: it does not.

- timestamp: 2026-08-05T00:40:00Z
  checked: HomeCarousel.astro CSS lines 3564-3587 (D-12 header-hide) and line comment "data-zoom-active is absent by default"
  found: The header (`.site-header--solid`/`.site-header--transparent`) is hidden ONLY when `.home[data-zoom-active='true']`. That attribute is written exclusively by the zoom driver script's `onProgress()` (line 1742), which only ever runs once the track is on-screen and progress computation begins. Absent any change, the small top-left header (logo + hamburger) stays visible by default during any new pre-track intro beat.
  implication: A "centered AJS logo, no other chrome" beat 1 would currently render simultaneously with the existing small header logo/hamburger unless the hide condition is deliberately extended (e.g. a new state/attribute covering "intro beat in progress," not just "zoom in progress"). This is the first real structural friction point beyond a simple insertion.

- timestamp: 2026-08-05T00:45:00Z
  checked: .planning/phases/21-homepage-scroll-experience/21-04-PLAN.md Task 1, behavior case 3 ("Full-screen wordmark on first load ... before any scrolling, the zoom wordmark is visible and its bounding box covers at least 60% of the viewport width and at least 40% of the viewport height")
  found: This is a locked, already-implemented, already-passing e2e assertion (tests/e2e/homepage-scroll-deck.spec.ts) that the wordmark fills most of the screen with ZERO scrolling.
  implication: Any pre-zoom beat that occupies the first screenful (as the user's 3-beat description implies) will, by design, make this literal assertion false immediately on load — it must be consciously rewritten as part of a gap-closure plan (to check the wordmark condition after scrolling past the new beat, not at scroll position 0), not treated as an accidental regression to chase down separately. This is the second real structural friction point.

- timestamp: 2026-08-05T00:50:00Z
  checked: is:global block, HomeCarousel.astro lines 3636-3653 (`html:has(.home-scroll-deck) { scroll-snap-type: y proximity; }` inside `@media (max-width: 767px)`)
  found: Scroll-snap is applied page-wide (not to a nested scroller) and is deliberately `proximity` (not `mandatory`) specifically so the 900px zoom-track scrub region doesn't fight snap behavior (Pitfall 6). No snap points currently exist before the track.
  implication: If the new intro beat(s) are meant to feel like discrete, snapped "pages" (matching the deck-slides' `scroll-snap-align: start` + `scroll-snap-stop: always` pattern), that snap behavior needs to be authored for the new sections too — it doesn't fall out for free from the existing proximity rule, though proximity snap is compatible with adding it.

- timestamp: 2026-08-05T00:55:00Z
  checked: .planning/phases/21-homepage-scroll-experience/21-CONTEXT.md D-01 through D-16
  found: None of the 16 locked decisions specify a pre-wordmark logo/tagline beat. D-03 explicitly says "During the zoom itself, no other UI appears" and D-15 defines the reduced-motion end state as "the full-screen wordmark renders once as a static intro" — both describe the wordmark itself as the sole opening element, consistent with what shipped.
  implication: Confirms this is genuinely unspecified scope (the note's framing), not a deviation from any written decision — a gap-closure plan needs fresh context/decisions (e.g. does reduced-motion also get the logo+tagline beat, or skip straight to the static wordmark; is the beat dismissed by scroll-past or by a timed/tap dismissal; does it get its own snap point) rather than a "restore the intended behavior" fix.

## Resolution

root_cause: "Not a code defect — a genuine scope gap. Phase 21's locked decisions (21-CONTEXT.md D-01 through D-16) only ever specified the full-screen wordmark itself as the opening beat of the phone-width scroll experience; no decision anywhere calls for a preceding centered-logo+scroll-cue beat or an intro-tagline beat before the wordmark-zoom. The implementation faithfully built exactly what was decided: at phone-width first paint, `.home-scroll-deck__track`'s pinned stage renders `computeWordmarkZoomState(0)` = `{scale:1, wordmarkOpacity:1, photoOpacity:0}` with nothing before it in the DOM. No scroll-cue/chevron markup exists anywhere in the file. The content the user wants for beat 2 (the site's intro tagline) already exists as live, already-fetched data (`introBody` / `resolveHomepageIntro`) sitting unused-at-phone-width in the same component scope, and the beat-1 logo image paths (`logoBlackSrc`/`logoWhiteSrc`) are likewise already computed locally in the same file — so a gap-closure plan is materially an insertion-and-wiring job, not a data-layer or research task."
fix: "Not applied (goal: find_root_cause_only). Structural insertion point for a gap-closure plan: add new sibling markup inside `.home-scroll-deck`, positioned before `.home-scroll-deck__track` (src/components/HomeCarousel.astro, after line 366's deck-root opening tag). Because `computeZoomProgress` keys off the track's own live `getBoundingClientRect().top` rather than a document-relative offset, no changes to `ZOOM_REVEAL_DISTANCE` (src/lib/home-carousel.ts line 209), the track height calc, or the zoom driver script are required for the zoom to correctly stay at rest until the new beat has been scrolled past. Two things DO need deliberate handling in that plan: (1) extend or duplicate the `data-zoom-active` header-hide mechanism (HomeCarousel.astro lines 3564-3587 CSS, line 1742 JS) so the header stays hidden through the new pre-zoom beat too, not just during the zoom itself; (2) rewrite 21-04-PLAN.md Task 1 case 3's now-implemented e2e assertion (tests/e2e/homepage-scroll-deck.spec.ts) that currently requires the wordmark to fill the screen at scroll position 0, since a preceding beat necessarily changes what's on screen at that position by design."
verification: "n/a — diagnosis only, per find_root_cause_only mode."
files_changed: []
