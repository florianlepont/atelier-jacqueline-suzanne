---
status: complete
phase: 21-homepage-scroll-experience
source: [21-VERIFICATION.md]
started: 2026-08-05T06:58:00Z
updated: 2026-08-05T07:25:00Z
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
  artifacts: []
  missing: ["A pre-wordmark intro beat: centered logo + scroll-down affordance, then the site intro tagline, both preceding the current wordmark-zoom opening"]

- truth: "Scrolling back up smoothly reverses the whole effect / the zoom-to-first-slide handoff is visually clean"
  status: failed
  reason: "Real-device screen recording shows a broken-looking transition frame at the zoom-to-first-slide handoff (~t=0.2s in the recording): two different photo crops of the same gallery image overlap with no header/accent-panel/title visible, resolving to the correct single-slide view only ~0.2s later. Consistent with the pinned stage's position:sticky release and the data-zoom-active header-hide flag not being tightly synchronized with the scroll-driven crossfade progress."
  severity: major
  test: 1
  artifacts: ["src/components/HomeCarousel.astro (zoom driver script from plan 21-05, data-zoom-active flag from plan 21-06)"]
  missing: []

- truth: "Each gallery's photo is sharp/settled by the time its slide arrives during a normal scroll pace, without prolonged blur-placeholder pop-in"
  status: failed
  reason: "Real-device recording shows the second gallery's (Brume) image still rendering as an unresolved grainy blur-placeholder across multiple consecutive samples (~t=4.0-4.8s) while scrolling toward it, only confirmed sharp by ~t=9s — reads as pop-in/jank rather than smooth progressive loading at normal scroll speed."
  severity: major
  test: 1
  artifacts: ["src/components/HomeCarousel.astro (deck slide img loading attributes from plan 21-04)"]
  missing: []

- truth: "No stray white bar appears near the iOS status bar / time area at any point during the scroll experience"
  status: failed
  reason: "User reports a white bar near the iPhone status bar/time area, visible in their screen recording. Not directly confirmed in the frames sampled by the orchestrator (~0.2-0.5s granularity) — may occur at a moment those samples missed (e.g. Safari dynamic toolbar collapse/expand mid-scroll, or true first paint before any scroll). Flagged as a hypothesis: this codebase's extensive use of 100dvh for the zoom track/stage/slides is a known class of iOS Safari mismatch with the collapsing toolbar and safe-area insets."
  severity: major
  test: 1
  artifacts: ["src/components/HomeCarousel.astro (100dvh usage in zoom track/stage/slide CSS from plans 21-04/21-05)"]
  missing: []
