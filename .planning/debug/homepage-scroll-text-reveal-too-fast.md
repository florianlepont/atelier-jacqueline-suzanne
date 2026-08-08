---
status: diagnosed
trigger: "Investigate issue: homepage-scroll-text-reveal-too-fast — On a real phone, the intro tagline AND every gallery slide's description text appear and disappear far too quickly to read at a normal scroll pace."
created: 2026-08-08T00:00:00Z
updated: 2026-08-08T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED — see Resolution below.
test: n/a (diagnose-only mode; find_root_cause_only)
expecting: n/a
next_action: none — root cause confirmed, returning diagnosis to caller (goal: find_root_cause_only, no fix applied)

## Symptoms

expected: The intro tagline and each gallery's description text should stay visible long enough to be read comfortably during a normal, unhurried real scroll.
actual: All of these texts (the new intro tagline from plan 21-10, and the pre-existing gallery descriptions from plan 21-06/D-13/D-14) appear and disappear far too quickly on a real device to read.
errors: None reported — a real-device-only pacing/timing issue. 45/45 automated must-haves pass, including the specific arrival-reveal e2e cases from 21-06 and 21-10, none of which can exercise real scroll velocity.
reproduction: On a real phone, scroll through the homepage at a normal, unhurried pace and try to read the intro tagline, then each gallery's description as its slide settles.
started: Found during round-2 real-device UAT for Phase 21, 2026-08-08.

## Eliminated

(none — root cause found directly from code inspection + targeted platform research, no false leads pursued)

## Evidence

- timestamp: 2026-08-08T00:00:00Z
  checked: src/components/HomeCarousel.astro deck `<script>` block (lines ~1780-2160): `applyArrival()`, `ARRIVAL_THRESHOLD`, `arrivalTargets`, `frame()`/`startLoop()`
  found: BOTH symptoms (intro tagline and gallery descriptions) are driven by the exact same code path. `arrivalTargets = [...introSections, ...slides]` is iterated every painted frame by `applyArrival()`. For every target it computes `ratio = computeSlideVisibleRatio(rect, window.innerHeight)` and does `target.classList.toggle('is-revealed', ratio >= ARRIVAL_THRESHOLD)` where `ARRIVAL_THRESHOLD = 0.98`. The toggle is symmetric and has NO hysteresis/dwell-time buffer: the exact same 0.98 threshold both reveals and hides on every single frame, so any transient dip of the ratio below 0.98 — even for one frame — immediately re-hides the text via the same 180ms CSS transition it just revealed with.
  implication: A demanding, momentary, un-buffered threshold is the shared mechanism behind both symptoms — this is why "the intro tagline AND all the other gallery texts" fail identically. The question becomes: why does the ratio only touch 0.98 transiently on a real phone instead of holding there while the visitor reads.

- timestamp: 2026-08-08T00:00:00Z
  checked: src/components/HomeCarousel.astro CSS, intro section rule block (~lines 3711-3735), comment attached to `.home-scroll-deck__intro`
  found: The two intro sections (beat 1 = logomark, beat 2 = tagline) deliberately carry **no `scroll-snap-align` and no `scroll-snap-stop` at all** — confirmed via the plan's own comment: "Assumption A3 (21-10-PLAN.md): deliberately NO scroll-snap-align/scroll-snap-stop on these sections... adding a snap point immediately before the deliberately snap-free 900px zoom scrub could let the page-wide proximity snap... pull the visitor backwards into the intro mid-scrub."
  implication: Nothing in the intro beats arrests a real, continuous touch scroll. A normal-paced flick/drag on a phone routinely carries well over one 852px viewport of momentum, so the visitor's scroll simply passes through beat 2 (the tagline) without ever coming to rest there — the 0.98 ratio is touched only for the instant the section's geometry happens to pass through near-full-viewport coverage mid-motion, then the scroll continues on into the (also snap-free) zoom track, dropping the ratio back below 0.98 almost immediately. This alone is sufficient to fully explain "the intro tagline appears and disappears far too quickly" — it is a structural consequence of a documented, deliberate design choice (A3), not a bug in the threshold math.

- timestamp: 2026-08-08T00:00:00Z
  checked: src/components/HomeCarousel.astro is:global block (~lines 4177-4194) and slide rule (~lines 3966-3968)
  found: The page-level snap container uses `scroll-snap-type: y proximity` (NOT `mandatory`), with the comment: "the zoom track above is a deliberately non-snapping 900px scrub region that a strict snap mode would fight (21-RESEARCH.md Pitfall 6)... `proximity` (not `mandatory`) keeps D-04's free scrub intact while each slide's own `scroll-snap-stop: always` still prevents a fling from skipping a gallery." Each slide separately carries `scroll-snap-align: start; scroll-snap-stop: always;`.
  implication: For the gallery slides (unlike the intro), there IS a snap mechanism, but it depends entirely on `proximity`-type snapping plus per-slide `scroll-snap-stop: always` reliably producing a genuine, held-still stop at the exact geometry the 0.98 threshold demands. That assumption is the second candidate to verify.

- timestamp: 2026-08-08T00:00:00Z
  checked: Web research — `scroll-snap-stop: always` behavior under `scroll-snap-type: proximity`, and `proximity` reliability on iOS Safari/WebKit specifically
  found: Multiple independent sources confirm (1) "`scroll-snap-stop: always` has limited effect with `proximity`... proximity is less strict — the browser may snap to a snap point if it seems appropriate, typically only within a few hundred pixels of a snap point," and the difference between `stop: always`'s two values "is more noticeable... when `scroll-snap-type` is set to `mandatory`" (i.e. materially weaker under proximity); (2) "Proximity is more prone to WebKit inconsistencies on iOS, and Safari can handle proximity differently from Chromium browsers," with general guidance to "prefer mandatory over proximity" specifically on iOS "due to WebKit reliability concerns," and reports that "the container may stop scrolling without locking onto any snap target" even under nominally-snapping configurations.
  implication: The exact combination shipped here — `scroll-snap-type: y proximity` + `scroll-snap-stop: always` — is independently documented as unreliable specifically on the real-device platform (iOS Safari/WebKit) where this bug was observed. On a "normal, unhurried" real scroll gesture whose momentum doesn't happen to end very close to a slide boundary, the browser is not guaranteed to force a full, held stop there at all; and even where it does snap, iOS's own native snap-settle spring-animation is not instantaneous and is not accounted for by the JS (no hysteresis), so the un-buffered 0.98 threshold can be crossed only transiently during that settle motion too. Either path produces the same visible symptom: text flashes on, then off, instead of holding.

- timestamp: 2026-08-08T00:00:00Z
  checked: `computeSlideVisibleRatio` denominator (`min(rect.height, viewportHeight)`) and the 21-09 `100svh` slide-height change, to rule out Safari dynamic-toolbar viewport-height fluctuation as an alternative/competing explanation
  found: Slide height is pinned to `100svh` (the browser's smallest/worst-case viewport height, constant regardless of toolbar animation), and the ratio's denominator is `min(rect.height, viewportHeight)`. Since `rect.height` (svh-based) is always ≤ `window.innerHeight` regardless of toolbar state, the denominator resolves to the constant `rect.height` in both toolbar states, and the full rect is always within `[0, viewportHeight]` once `rect.top ≈ 0` — so the ratio computation itself is NOT destabilized by the dynamic-toolbar animation. This was in fact an explicit, deliberate side-benefit of plan 21-09's svh conversion (see its own comment: "...also what lets computeSlideVisibleRatio reach its arrival threshold reliably on a real phone, instead of momentarily measuring against a taller box than what is actually on screen during the toolbar's collapse/expand animation").
  implication: Dynamic-toolbar-driven viewport-height fluctuation, while a real and currently-still-open issue for this phase (per UAT gap 4, still failing as of this same round-2 UAT), is NOT the mechanism behind THIS specific symptom — it was already defended against by 21-09. Ruled out as the primary cause, keeping the investigation focused on scroll-snap settle reliability and the lack of threshold hysteresis.

## Resolution

root_cause: |
  The intro-tagline reveal and the gallery-description reveal are both driven by one shared mechanism
  (`applyArrival()` in `src/components/HomeCarousel.astro`'s deck script, running every requestAnimationFrame
  tick): each target's `is-revealed` class is toggled purely on whether its live
  `computeSlideVisibleRatio(rect, window.innerHeight)` is `>= ARRIVAL_THRESHOLD` (0.98), with the SAME
  threshold used symmetrically to both show and hide — there is no hysteresis or minimum dwell time, so a
  single frame where the ratio dips below 0.98 immediately re-hides text that was just revealed via the
  180ms CSS transition.

  This demanding, un-buffered threshold is only safe to read comfortably if the real device's scroll
  genuinely comes to rest with the target's geometry held at ~0.98+ for a meaningful duration. On a real,
  continuous touch scroll it does not, for two related-but-distinct reasons:

  1. Intro tagline (beat 2): by deliberate design (21-10-PLAN.md assumption A3), the two intro sections
     carry NO `scroll-snap-align`/`scroll-snap-stop` at all, specifically to avoid the page-wide proximity
     snap pulling the visitor back into the intro mid-scrub of the snap-free zoom track that follows it.
     Nothing arrests a real scroll gesture there, so a normal-paced flick/drag (which routinely carries
     well over one 852px viewport of momentum) simply passes through the tagline's one-viewport-tall
     section without pausing — the ratio only transits through 0.98 for the fleeting instant the section's
     geometry happens to pass near-full-viewport coverage mid-motion, then continues on, dropping back
     below threshold almost immediately.

  2. Gallery descriptions (pre-existing, D-13/D-14, 21-06/21-07): the deck's snap container uses
     `scroll-snap-type: y proximity` (not `mandatory`), a deliberate choice (21-RESEARCH.md Pitfall 6) to
     keep the zoom track's own free 900px scrub from fighting a stricter snap mode; slides individually
     carry `scroll-snap-align: start; scroll-snap-stop: always;`. Both code-review and independent platform
     research confirm `scroll-snap-stop: always`'s stop-forcing guarantee is materially weaker under
     `proximity` than under `mandatory`, and that `proximity`-type snapping is specifically documented as
     unreliable on iOS Safari/WebKit — the browser is not guaranteed to force a full, held stop at a slide
     boundary from a normal-paced (non-fling) scroll gesture. Even where it does snap, iOS's native
     snap-settle spring-animation takes a non-trivial, non-instantaneous amount of time and is not accounted
     for by the JS at all, so the un-hysteresis-buffered 0.98 threshold can be crossed only transiently
     during that settle motion as well.

  Both paths converge on the identical visible symptom through the identical shared code path
  (`arrivalTargets`/`applyArrival`/`ARRIVAL_THRESHOLD`) — which is exactly why the user reports the intro
  tagline AND every gallery's description text failing in the same way: one shared root-cause class (a
  demanding, symmetric, dwell-time-free reveal threshold layered on top of scroll-snap behavior — none at
  all for the intro, weak/unreliable `proximity` for the slides — that does not reliably hold a real,
  continuous touch-scroll visitor "at rest" at the exact geometry the threshold demands), manifesting via
  two structurally distinct triggers.

  Automated coverage (45/45 must-haves, including the specific arrival-reveal e2e cases from 21-06/21-10)
  cannot catch this because Playwright's `page.evaluate(() => window.scrollTo(...))` scroll idiom used
  throughout the suite (per 21-06/21-07/21-10 SUMMARYs) is an instantaneous, no-momentum jump directly to
  the target offset and holds there — it can never exercise real touch-momentum, real scroll-snap
  proximity-heuristics, or a real spring-settle animation, so it always finds the ratio sitting stably at
  1.0 once scrolled, regardless of whether a real device would ever actually rest there.

fix: (not applied — goal: find_root_cause_only)
verification: (not applicable — no fix applied)
files_changed: []
