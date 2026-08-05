---
status: diagnosed
phase: 21-homepage-scroll-experience
source: [21-VERIFICATION.md]
started: 2026-08-05T06:58:00Z
updated: 2026-08-05T09:45:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Real-device pass closing phase 21 (required by 21-VALIDATION.md before /gsd-verify-work)

expected: 1) The wordmark genuinely fills the screen on arrival, no header/title/description visible. 2) Scrolling down reads as flying into the letterforms at a cinematic (unhurried) pace, focused on the leading letter, landing on the first gallery's photo filling the screen. 3) Scrolling back up smoothly reverses the whole effect. 4) The header fades in once the zoom completes and stays reachable while scrolling the slides. 5) Slides settle one gallery at a time; a fast fling does not skip a gallery. 6) Each description appears only once its slide has settled, and the accent band colour changes with the gallery. 7) Tapping a photo opens that gallery. 8) Scrolling past the last gallery reaches the site footer. 9) Nothing on the tablet/desktop homepage looks or behaves differently than before this milestone.

result: issue

reported: |
  User tested on a real iPhone over the LAN preview and provided a ~9s screen recording
  (ScreenRecording_08-05-2026 09-10-05_1.MP4) alongside written feedback (originally in French).
  Four distinct points, quoted/translated below, each corroborated against extracted video frames:

  1. "Je trouve que le premier élément à s'afficher devrait être le logo, centré sur la page, avec
     une indication scroll down. Puis s'affiche la phrase d'intro du site qui n'apparait pas ici,
     en dessous du logo, Puis ça disparait et on voit apparait ce que tu as construit: le Atelier
     Jacqueline Suzanne, avec le zoom."
     (Translation: expects a THREE-beat opening the phase never specified — logo centered with a
     scroll-down indicator first, then the site's intro tagline appearing below the logo, THEN that
     dissolves into the built wordmark-zoom. What shipped goes straight to the wordmark zoom as the
     first thing. This is a scope/expectation gap against 21-CONTEXT.md's D-01/D-15 (which only
     specify the wordmark itself as the opening beat) — not a regression of anything built, but a
     real missing intro sequence the user wants before the zoom.)

  2. "Le 'sticked' effect quand tu scrolles ne fonctionne pas bien. Regarde la vidéo."
     (The sticky/pinned effect doesn't work well when you scroll.)
     CORROBORATED: extracted frames at t≈0.2s (during/just after the zoom-to-first-slide handoff)
     show two different photo crops of the same gallery's image overlapping on screen with no header,
     no accent panel, no title — a broken-looking mid-transition frame — followed by a clean, correct
     "Paysage" slide view just ~0.2s later at t≈0.4s. This is consistent with the pinned zoom stage's
     `position: sticky` release and the `data-zoom-active` header-hide flag not being tightly
     synchronized with the actual scroll-driven crossfade progress at the moment the track's pinned
     distance is exhausted.

  3. "Sur la vidéo tu vois également que c'est un peu saccadé."
     (Also visibly choppy/juddery in the video.)
     CORROBORATED: same handoff glitch as point 2, PLUS: frames sampled across t≈4.0s-4.8s while
     scrolling toward the second gallery ("Brume") show its image still rendering as an unresolved
     grainy blur-placeholder for a sustained stretch (multiple consecutive samples ~0.4s apart), only
     confirmed sharp by t≈9s. The blur-up placeholder doesn't appear to be resolving to the sharp
     image fast enough relative to normal scroll speed, reading as pop-in/jank rather than a smooth
     progressive reveal.

  4. "Sur la vidéo tu vois aussi que j'ai une barre blanche sur mon iphone, au niveau de l'heure etc."
     (A white bar near the status bar/time area of the iPhone.)
     NOT DIRECTLY CONFIRMED: reviewed frames across the full clip and did not find a plain white gap
     distinct from the iOS status bar / screen-recording indicator pill in the samples pulled. May
     occur at a moment not captured by the ~0.2-0.5s sampling used (e.g. specifically during Safari's
     dynamic toolbar collapse/expand mid-scroll, or on true first paint before any scroll). Given this
     codebase's extensive use of `100dvh` for the zoom track/stage/slides (per 21-04/21-05/21-06's own
     plans), a `dvh`-vs-Safari-toolbar-collapse mismatch leaving a real gap at the safe-area/status-bar
     region is a known class of iOS Safari defect and a reasonable hypothesis to investigate first.

severity: major

## Summary

total: 1
passed: 0
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "On first load, a phone visitor sees a logo-centered opening beat with a scroll-down indication, then the site's intro tagline, before the wordmark-zoom begins"
  status: failed
  reason: "User expected a 3-beat intro (logo+scroll-cue, then intro tagline, then wordmark-zoom) that was never part of 21-CONTEXT.md's locked decisions (D-01/D-15 only specify the wordmark itself as the opening beat) — real missing intro sequence, not a regression"
  severity: major
  test: 1
  root_cause: "Not a code defect — a genuine scope gap. 21-CONTEXT.md's locked decisions (D-01 through D-16) only ever specified the wordmark itself as the opening beat; no pre-zoom logo/tagline beat was ever decided. The implementation faithfully built exactly what was decided: the deck root's first children are the zoom track + slides wrapper, with nothing preceding them."
  artifacts:
    - path: "src/components/HomeCarousel.astro"
      issue: "Deck markup (lines 355-411), zoom driver (1650-1815), header-hide CSS (3564-3587) — no logo/scroll-cue/tagline beat precedes the zoom track. The tagline content (introBody, via resolveHomepageIntro) and logo assets (logoBlackSrc/logoWhiteSrc) already exist in this same component's scope, just rendered only into the desktop/tablet-only .home-hero__intro / .home-grid__intro-body today."
  missing:
    - "A new pre-zoom intro beat: centered logo + scroll-down cue, then the site's intro tagline (reusing introBody), inserted before .home-scroll-deck__track"
    - "Extend D-12's header-hide condition (currently solely data-zoom-active) to also cover the new beat, so the existing top-left header logo doesn't show simultaneously with a new centered logo"
    - "Rewrite 21-04-PLAN.md Task 1's e2e assertion that the wordmark fills the screen 'before any scrolling' (a new intro beat necessarily changes what's on screen at scroll position 0) — by design, not accidental breakage"
    - "Fresh discuss-phase-style decisions needed: does reduced-motion get this new beat too; is it scroll-past or tap-to-dismiss; does it get its own snap point"
  debug_session: .planning/debug/homepage-scroll-missing-intro-beat.md

- truth: "Scrolling back up smoothly reverses the whole effect / the zoom-to-first-slide handoff is visually clean"
  status: failed
  reason: "Real-device screen recording shows a broken-looking transition frame at the zoom-to-first-slide handoff (~t=0.2s in the recording): two different photo crops of the same gallery image overlap with no header/accent-panel/title visible, resolving to the correct single-slide view only ~0.2s later. Consistent with the pinned stage's position:sticky release and the data-zoom-active header-hide flag not being tightly synchronized with the scroll-driven crossfade progress."
  severity: major
  test: 1
  root_cause: "Three independently-timed systems (native position:sticky release, the zoom driver's scroll-event-driven crossfade/data-zoom-active flag, and the IntersectionObserver arrival reveal) are all designed to complete at the identical scroll offset, which is also the page's first CSS scroll-snap point. On a real phone, iOS Safari throttles/coalesces scroll-event dispatch during momentum/snap-settling scrolling, so the true composited scroll position can advance past that point before the JS callbacks catch up — producing a stale mid-crossfade frame overlapping the just-arrived first slide until the delayed callbacks resolve everything at once (~0.2s later). A newly-exposed gap in a driver pattern ported verbatim from DetailHero.astro (desktop-only, no touch-momentum scrolling, no coincident scroll-snap-stop boundary)."
  artifacts:
    - path: "src/components/HomeCarousel.astro"
      issue: "onScroll/onProgress/setup (~lines 1783-1843, plan 21-05) and onArrival (~lines 1684-1717, 1834-1843, plan 21-06) are purely scroll-event/IntersectionObserver-callback-driven with no continuous rAF polling loop against real scroll position; combined with .home-slide's scroll-snap-stop:always + page-wide scroll-snap-type:y proximity (~lines 3489-3494, 3649-3663) placing a hard native snap boundary at the same offset"
  missing:
    - "Decouple the crossfade/header-flag/arrival state from scroll-event dispatch by driving onProgress from a continuously-running requestAnimationFrame loop while attached, polling getBoundingClientRect() every painted frame regardless of whether a scroll event fired"
  debug_session: .planning/debug/homepage-scroll-zoom-handoff-glitch.md

- truth: "Each gallery's photo is sharp/settled by the time its slide arrives during a normal scroll pace, without prolonged blur-placeholder pop-in"
  status: failed
  reason: "Real-device recording shows the second gallery's (Brume) image still rendering as an unresolved grainy blur-placeholder across multiple consecutive samples (~t=4.0-4.8s) while scrolling toward it, only confirmed sharp by ~t=9s — reads as pop-in/jank rather than smooth progressive loading at normal scroll speed."
  severity: major
  test: 1
  root_cause: ".home-slide__img (plan 21-04) is a single loading=\"lazy\" <img> bound directly to the full-resolution gallery.heroSrc/heroSrcSet for every slide after the first, with no blur-up placeholder layer and no preload/priority hint for the upcoming slide — unlike .home-hero/.home-grid, which both already solve this exact loading-latency gap via the established HOME-09 pattern (a genuine low-res gallery.blurSrc placeholder stacked behind the sharp lazy image, crossfading on load). gallery.blurSrc is already fetched/typed on GalleryEntry but plan 21-04 never rendered it into the deck slide markup — there is no placeholder at all for slides, just the real sharp image arriving late."
  artifacts:
    - path: "src/components/HomeCarousel.astro"
      issue: ".home-slide__img markup (lines 394-403) and CSS (lines 3504-3510) — single image, no blur-placeholder layer, no crossfade, unlike the sibling .home-hero/.home-grid two-image pattern"
  missing:
    - "Render gallery.blurSrc as a stacked placeholder <img> behind each deck slide's sharp image (mirroring .home-hero/.home-grid's existing HOME-09 blur-up pattern), crossfading on load"
    - "Consider a preload/priority hint for the upcoming (N+1) slide's image so it's more likely to be sharp by arrival at normal scroll speed"
  debug_session: .planning/debug/homepage-scroll-deck-blur-placeholder-jank.md

- truth: "No stray white bar appears near the iOS status bar / time area at any point during the scroll experience"
  status: failed
  reason: "User reports a white bar near the iPhone status bar/time area, visible in their screen recording. Not directly confirmed in the frames sampled by the orchestrator (~0.2-0.5s granularity) — may occur at a moment those samples missed (e.g. Safari dynamic toolbar collapse/expand mid-scroll, or true first paint before any scroll)."
  severity: major
  test: 1
  root_cause: "The phone-width scroll deck sizes every full-screen section with height:100dvh exclusively (plans 21-04/21-05), breaking from this same codebase's own established, real-device-validated convention used one section over on .home-hero__photo (min-height:100svh; max-height:100vh) — adopted specifically because Mobile Safari's toolbar collapse/expand animation doesn't always resize dvh-dependent boxes in lockstep with the live value (the existing hero rule carries an authored comment describing this exact real-device discovery). Compounded by no <meta name=\"theme-color\"> and no viewport-fit=cover anywhere in the codebase, so during the brief toolbar-animation window Safari falls back to coloring the exposed strip from the page's own white (#FFFFFF) body background."
  artifacts:
    - path: "src/components/HomeCarousel.astro"
      issue: ".home-scroll-deck__track/__stage/.home-slide CSS (~lines 3363-3557) uses 100dvh exclusively, with zero -webkit-fill-available or 100svh fallback, unlike the sibling .home-hero__photo rule which already solves this exact class of gap"
    - path: "src/layouts/BaseLayout.astro"
      issue: "No viewport-fit=cover, no theme-color meta tag anywhere (~line 151, ~lines 339-344); body background resolves to literal white"
  missing:
    - "Align the deck's viewport-height strategy with the codebase's own proven pattern (100svh/max-height:100vh, or a live-synced --vh/--dvh custom property updated on scroll/resize) instead of raw 100dvh"
    - "Add a <meta name=\"theme-color\"> matching the deck's dominant photo/accent tones (possibly swapped dynamically alongside data-zoom-active/per-slide accent) so any transient exposed strip blends rather than flashing white"
  debug_session: .planning/debug/homepage-scroll-ios-status-bar-white-gap.md
