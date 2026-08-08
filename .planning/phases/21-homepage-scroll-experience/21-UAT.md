---
status: diagnosed
phase: 21-homepage-scroll-experience
source: [21-VERIFICATION.md]
started: 2026-08-08T14:20:00Z
updated: 2026-08-08T16:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Real-device pass closing phase 21's gap-closure set (round 2 — confirms all 4 original gaps fixed)

expected: 1) The first thing on screen is the centred AJS logomark with a scroll-down cue, on an ink background — no header chrome, no wordmark, no photo. 2) The site's intro tagline appears beneath the logomark, with the logomark appearing to stay exactly where it was. 3) The zoom-to-first-slide handoff is clean: no frame shows two different crops of the same photo overlapping, and the header, accent band and title all appear together once the zoom lands. 4) Each gallery photo is already sharp by the time its slide settles at a normal unhurried pace — no prolonged grainy/blurry stretch. 5) Scrolling back up smoothly reverses the whole sequence, including both intro beats. 6) A fast fling does not skip a gallery, and does not produce a broken-looking frame at the zoom boundary. 7) No white bar ever appears near the status bar/time row, at any point, including during Safari's toolbar animation. 8) Tapping a photo opens that gallery. 9) The header is reachable while scrolling the slides. 10) Nothing on the tablet/desktop homepage looks or behaves differently than before this milestone. 11) Assumptions A1 through A5 (21-10-PLAN.md) are each either confirmed or corrected, with any correction recorded.

result: issue

reported: |
  User tested round 2 on a real iPhone. Five numbered points reported (their own numbering, mapped
  below to the 11-point checklist), originally in French:

  1. "Le logo apparaît deux fois. Or, je m'attendais à le voir une seule fois, et que au premier
     scroll, le logo se réduise et laisse apparaître le texte de présentation."
     (Translation: The logo appears twice. I expected to see it only once, and on the first
     scroll, the logo shrinks and reveals the presentation text underneath/behind it.)
     — CORRECTS ASSUMPTION A4. Plan 21-10's A4 built TWO separate stacked full-viewport sections
     with "identical logo geometry" (the same logo rendered twice, once per beat, positioned to
     LOOK stationary across a hard section boundary). The user's actual mental model is different:
     ONE logo element that scroll-scrubs a shrink/transform as the tagline reveals beneath/behind
     it — a single continuous transformation, not two static instances. This is the "correctable
     assumption" mechanism (checkpoint 11) working as designed — a genuine, explicit correction.

  2. "Le texte de présentation et l'ensemble des autres textes des galeries apparaissent et
     disparaissent beaucoup trop vite. On n'arrive pas à les lire, il y a visiblement un souci
     avec le scroll."
     (The intro tagline AND all the gallery slide description texts appear and disappear far too
     quickly to read — visibly a scroll-related issue.)
     — Affects BOTH the new intro tagline (21-10) and the pre-existing gallery description reveal
     (21-06/D-13/D-14), which passed 45/45 automated must-haves. Real-device-only symptom;
     automated coverage (Playwright) cannot exercise real scroll velocity/momentum, so a pacing or
     arrival-detection timing bug here would not have been caught. Needs fresh diagnosis — could be
     the arrival threshold/pacing math, or something about real touch-scroll speed the deck's
     scroll-track distances don't account for.

  3. "Le zoom est propre, mais la photo de couverture apparaît deux fois."
     (The zoom itself is clean now [gap 2 / point 6 of the checklist CONFIRMED FIXED — no more
     overlapping-crop handoff glitch], but the cover photo appears twice.)
     — A NEW, distinct visual bug: the cover/first-gallery photo renders twice simultaneously
     (not during the handoff motion, which is now clean, but as a static post-zoom state). Likely
     the zoom's crossfade `.home-scroll-deck__photo` layer and the first slide's own `.home-slide__img`
     both ending up visible/opaque at once, not perfectly coincident. Needs fresh diagnosis.

  4. "Il y a toujours une sorte de barre ou de bord qui apparaît en haut au niveau des contrôleurs
     de l'iPhone. Il y a également un espace blanc qui apparaît au niveau des contrôleurs de
     Safari, il n'y a donc pas de fullscreen."
     (There's STILL a bar/edge near the iPhone's status-bar controls at the top. There's ALSO a
     white gap near Safari's own toolbar controls at the bottom — so it's not fullscreen.)
     — Gap 4 (white bar) is NOT fully fixed by the svh conversion in plan 21-09. Worse: the
     complaint now covers BOTH the top (status bar, as originally reported) AND a NEW bottom-edge
     white gap near Safari's own browser chrome. The debug session for the original gap 4 explicitly
     named a live-synced `--vh`/`--dvh` custom property as an alternative to the svh fix that was
     chosen instead — worth investigating whether svh alone was insufficient. Needs fresh diagnosis.

  5. "Le hamburger de navigation devrait au moins apparaître au tout début sur l'arrivée du site
     pour pouvoir naviguer dedans."
     (The navigation hamburger should be visible right from the very start, on arrival, so it's
     possible to navigate the site.)
     — Real usability gap, not covered by any of A1-A5: the header (and its hamburger nav) is
     currently hidden through BOTH intro beats AND the entire zoom sequence, per gap 1's fix
     extending D-12's header-hide condition. The user wants navigation reachable from first paint,
     not gated behind scrolling through the whole intro+zoom. This is a new, explicit UX
     correction, not an original assumption being confirmed/denied.

severity: major

## Summary

total: 1
passed: 0
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "The logo appears once and scroll-scrubs a shrink/transform to reveal the intro tagline beneath it, not two separate static logo instances in two stacked sections"
  status: failed
  reason: "User correction of assumption A4 (21-10-PLAN.md): expected ONE continuously-transforming logo element (shrink-on-scroll revealing the tagline), not two stacked full-viewport sections each showing a static, identically-positioned logo instance"
  severity: major
  test: 1
  root_cause: "Not a code defect — the code faithfully implements A4 exactly as specified: two independent, ordinary-document-flow, full-viewport sections, each with its own separate logo <img> at identical static CSS geometry, with continuity faked purely through matched styling (no shared DOM element, no scroll-driven transform on the logo anywhere). applyArrival()'s binary 98%-threshold toggle only affects the tagline's opacity/translateY, never the logo; applyIntroActive() computes only a boolean header-hide flag off the zoom track's rect, not a continuous intro-scroll progress value. A4's own plan text explicitly considered and rejected a single pinned/scrubbed section, reasoning it would reintroduce the handoff-desync risk class plan 21-07 had just fixed."
  artifacts:
    - path: "src/components/HomeCarousel.astro"
      issue: "Intro markup (lines 366-421, two independent logo <img> instances), intro CSS (lines 3695-3800, ordinary in-flow layout, no position:sticky), driver (lines 1790-1908, 2028-2087 — binary reveal toggle + boolean flag, no continuous progress for the intro)"
    - path: "src/lib/home-carousel.ts"
      issue: "lines 209-272 — computeZoomProgress/computeWordmarkZoomState is the reusable single-element continuous-scrub pattern to mirror (not itself broken)"
  missing:
    - "Replace the two independent A4 sections with ONE pinned/scrubbed intro block (mirroring the zoom track's sticky-stage-inside-tall-track shape, or DetailHero.astro's .detail-hero__pin shape) containing exactly one logo <img> and the tagline as siblings"
    - "Add a new pure computeIntroProgress()-style function (unit-testable like computeZoomProgress) reading the intro track's own live rect over a new INTRO_REVEAL_DISTANCE, driving the logo's scale/position and the tagline's opacity/translateY continuously from that same t"
    - "Remove the intro sections from the binary-threshold arrivalTargets/applyArrival() pass entirely"
    - "Re-derive (not just re-run) every e2e scroll target based on the old fixed '2 viewport heights' pre-zoom distance, since it's no longer fixed by construction"
    - "Apply the same live-rect-per-frame rigor to the new intro-to-zoom boundary that plan 21-07 applied to the zoom-to-slide boundary, to avoid reintroducing the handoff-desync risk class at this new junction"
  debug_session: .planning/debug/homepage-scroll-intro-logo-duplication.md

- truth: "The intro tagline and every gallery's description text stay readable — visible long enough to read at a normal, unhurried real scroll pace"
  status: failed
  reason: "User reports the intro tagline AND all gallery description texts appear/disappear far too quickly to read on a real device — a real-scroll-velocity issue Playwright's emulated scrolling cannot reproduce, despite 45/45 automated must-haves passing"
  severity: major
  test: 1
  root_cause: "applyArrival() toggles is-revealed purely on whether computeSlideVisibleRatio(rect, innerHeight) >= ARRIVAL_THRESHOLD (0.98) — the SAME threshold both shows and hides it, with no hysteresis or minimum dwell time. Any single frame where the ratio dips below 0.98 immediately re-hides text just revealed. Two structurally distinct triggers funnel through this one code path: (1) the intro sections deliberately carry no scroll-snap at all (assumption A3), so a normal-paced flick carries momentum straight through with the ratio only transiting 0.98 for an instant; (2) the deck's scroll-snap-type is 'y proximity' (not 'mandatory', a deliberate Pitfall-6 tradeoff), and scroll-snap-stop:always is documented as materially weaker under proximity, particularly unreliable on iOS Safari/WebKit — a normal-paced scroll is not guaranteed a full held stop at the slide boundary. Ruled out: Safari dynamic-toolbar viewport fluctuation (already defended against by the svh conversion). 45/45 automated cases pass because every e2e case scrolls via instantaneous window.scrollTo() with no momentum, which can never exercise real touch physics."
  artifacts:
    - path: "src/components/HomeCarousel.astro"
      issue: "applyArrival()/ARRIVAL_THRESHOLD (no dwell-time buffer, symmetric reveal/hide condition); .home-scroll-deck__intro CSS (no snap point, assumption A3); html:has(.home-scroll-deck) { scroll-snap-type: y proximity } (weak snap-forcing on iOS, deliberate Pitfall-6 tradeoff)"
  missing:
    - "Add a hysteresis/dwell-time buffer around the reveal threshold (e.g. require the ratio to stay >=0.98 for N consecutive frames, or use separate reveal/hide thresholds) so a transient dip doesn't immediately re-hide text"
    - "Reconsider whether the intro beats and/or gallery slides need a firmer snap guarantee than proximity provides on iOS, without reintroducing the zoom-track snap conflict Pitfall 6 was written to avoid"
  debug_session: .planning/debug/homepage-scroll-text-reveal-too-fast.md

- truth: "The cover/first-gallery photo renders once, not twice, once the zoom completes and the first slide settles"
  status: failed
  reason: "User reports the zoom motion itself is now clean (handoff glitch confirmed fixed), but the cover photo appears twice in the settled state — likely the zoom's crossfade photo layer and the first slide's own image both visible/opaque simultaneously, not perfectly coincident"
  severity: major
  test: 1
  root_cause: "The pinned zoom stage (.home-scroll-deck__stage, hosting the crossfade safety-net .home-scroll-deck__photo) does not disappear or shrink once zoom progress reaches t=1 — it remains a normal position:sticky, height:100svh block that must still be scrolled past through ordinary document flow. Between the scroll offset where progress completes and the offset where the first .home-slide is fully snapped into view, there's a full extra viewport-height (~852px) of scrollable dead zone. During that entire zone, the crossfade layer's now-fully-opaque photo and the first slide's own sharp photo are simultaneously on screen in two adjacent boxes — and because both apply cover/centered cropping to the identical source image (firstGallery.heroSrc, shared via --zoom-photo) on same-aspect-ratio boxes, the two crops are pixel-identical. scroll-snap-type: y proximity (confirmed non-mandatory) only pulls a resting position into alignment from within ~250-400px of the target, well short of covering the full 852px dead zone, so a real scroll gesture very plausibly comes to rest inside it. Distinct from, and downstream of, the already-fixed handoff-glitch (a JS-state-staleness race during the transition FRAME, fixed by 21-07's rAF loop) — that fix correctly keeps opacity/scale in sync with scroll position, but no plan ever addressed that the crossfade layer's CONTAINING BOX keeps occupying a full viewport-height of layout after its own animation completes."
  artifacts:
    - path: "src/components/HomeCarousel.astro"
      issue: "lines 3814-3836 (.home-scroll-deck__track/__stage — track runway height governs only zoom progress math, not the stage's own occupied layout space); lines 3842-3864 (.home-scroll-deck__photo — reaches opacity 1 at t=1, never hidden/collapsed afterward); lines 1923-1996 (driver's onProgress/clearInlineStyles — opacity written, only removed on full detach, never on zoom completion); lines 3955-3990 (.home-slide/.home-slide__img--sharp — second, independent renderer of the same source photo)"
  missing:
    - "Make the stage stop occupying scrollable layout space once its crossfade job is done — e.g. shrink/collapse the stage (or the track's trailing runway) to zero height once progress reaches 1, so the first slide's snap point coincides with the stage's release point instead of a full viewport-height later"
    - "Alternatively, hide the stage layer (not just fade it) once data-zoom-active flips to its completed value"
  debug_session: .planning/debug/homepage-scroll-cover-photo-doubled.md

- truth: "No white bar or gap appears near the iOS status bar (top) or Safari's own toolbar (bottom) at any point — the experience is genuinely full-screen"
  status: failed
  reason: "User reports the white-bar issue persists near the top (status bar, as originally reported) AND a new white gap appears near the bottom (Safari's own browser chrome) — the svh conversion in plan 21-09 did not fully resolve gap 4. The original debug session flagged a live-synced --vh/--dvh custom property as an untried alternative."
  severity: major
  test: 1
  root_cause: "Plan 21-09's fix converted every full-screen deck section to an exact height:100svh — optimizing for the wrong constraint. 100svh is statically bound to Mobile Safari's SMALLEST possible content area (toolbar chrome fully expanded); it guarantees a box is never LARGER than the screen but does nothing to guarantee it's never SMALLER. Since the deck scrolls via the native document (no inner scroll container), Safari's real toolbar-collapse behavior applies continuously: any time the toolbar is even partially retracted (the normal majority-of-time state while actively scrolling), the true viewport is taller than 100svh, and every sticky/pinned deck section falls short by exactly that difference. The uncovered strip falls through to body's plain white background, since the ink paint floor was scoped only to the photo-bearing boxes, not to anything covering space beyond their own undersized height. Steady-state undershoot, not a transient timing glitch — explaining both the persisting top gap and the new bottom gap. The codebase's own cited precedent, .home-hero__photo, does NOT use exact height:100svh — it uses min-height:100svh; max-height:100vh (a range); plan 21-09 borrowed the unit but not the range shape, applying a small-viewport bound to sticky sections that must always cover the CURRENT (potentially larger) viewport, the opposite constraint from the hero's own 'don't overflow into the footer' problem. Plan 21-10's intro beats correctly inherited the same (flawed) convention — not a separate omission bug."
  artifacts:
    - path: "src/components/HomeCarousel.astro"
      issue: ".home-scroll-deck__track, __stage, __wordmark, .home-slide, .home-scroll-deck__intro — all rigid height:100svh (~lines 3660-3977)"
    - path: "src/layouts/BaseLayout.astro"
      issue: "phoneThemeColor/theme-color meta addresses chrome coloring only, does not fix the underlying box-sizing gap"
  missing:
    - "Replace the deck's rigid 100svh sizing with something that guarantees full coverage of the CURRENT viewport in every intermediate toolbar state — e.g. a live-synced --vh custom property driven from window.visualViewport's resize/scroll events (updated from the same per-frame rAF loop plan 21-07 already unified), or at minimum 100lvh as the lower bound rather than 100svh"
  debug_session: .planning/debug/homepage-scroll-still-not-fullscreen.md

- truth: "The navigation hamburger is reachable from first paint / very early in the experience, not gated behind scrolling through the entire intro and zoom sequence"
  status: failed
  reason: "User wants the header/hamburger nav visible and usable from the very start of the homepage, not hidden through both new intro beats and the full zoom sequence (current behavior per gap 1's header-hide extension). Real UX correction, not covered by any of assumptions A1-A5."
  severity: major
  test: 1
  root_cause: "Plan 21-10 added a CSS rule extending D-12's original zoom-only header hide to also cover the two new pre-zoom intro beats (.home[data-intro-active='true'] hides the header). data-intro-active stays 'true' for the entire ~2-viewport-height duration of both intro beats, handing off with zero gap to the pre-existing data-zoom-active hide — so the header is invisible continuously from scroll position 0 until the zoom fully completes. Deliberate design choice (plan 21-10's own comment names the reasoning: avoiding the small header logo appearing next to the new large centred intro logomark), not a bug — round-2 UAT overturns that specific judgment call. data-intro-active's only consumer anywhere in the codebase is this one CSS rule (confirmed by grep) — a single, isolated lever. No color-contrast collision exists if shown during the intro beats: the header always renders variant='transparent' (white logo/text over a dark scrim), legible against the intro's ink background exactly as it already is over hero photos elsewhere. The only real interaction risk is compositional: a small header logo simultaneously visible with the intro's large centred logomark — coupled to the concurrent A4 redesign (gap 1 in this same round) which should be planned together with this fix."
  artifacts:
    - path: "src/components/HomeCarousel.astro"
      issue: "lines 4091-4108 — the data-intro-active-keyed header-hide CSS rule to remove/scope back; lines 2029-2044 (applyIntroActive()) — no change needed, attribute write logic unaffected"
  missing:
    - "Remove the data-intro-active-keyed header-hide CSS rule so the header stays visible throughout both intro beats, restoring D-12's hide scope to data-zoom-active only (hidden during the actual wordmark zoom scrub, as it was before plan 21-10) — CSS-only, no driver/script change needed"
    - "Update the e2e case asserting 'header is hidden through both intro beats' to assert the new (correct) behavior instead"
    - "Coordinate with gap 1's A4 redesign (single continuously-transforming logo) to avoid a compositional collision between the small header logo and the new intro logomark"
  debug_session: .planning/debug/homepage-scroll-nav-unreachable-at-start.md
