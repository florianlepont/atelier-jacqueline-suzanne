---
status: diagnosed
trigger: "homepage-scroll-still-not-fullscreen — the white-bar/gap issue near the iOS status bar (previously diagnosed and 'fixed' in plan 21-09 via svh conversion) is STILL present, and the user now ALSO reports a new white gap near Safari's own toolbar at the bottom of the screen — the experience is not genuinely full-screen."
created: 2026-08-08T00:00:00Z
updated: 2026-08-08T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED (see Resolution). No further action — goal is find_root_cause_only.
test: n/a
expecting: n/a
next_action: return ROOT CAUSE FOUND to caller.

## Symptoms

expected: No white bar or gap should appear near the iOS status bar (top) or Safari's own toolbar (bottom) at any point during the scroll experience — the deck's full-screen sections should occupy the true viewport edge to edge.
actual: On real-device re-test after plan 21-09's fix (converting the deck's height units from dvh to svh, adding a paint floor, adding a phone-scoped theme-color meta), the user reports the top status-bar-area gap is STILL present ("il y a toujours une sorte de barre ou de bord"), AND a NEW white gap now appears near the bottom, at Safari's own toolbar/controls area ("un espace blanc qui apparaît au niveau des contrôleurs de Safari").
errors: None reported.
reproduction: On a real iPhone in Mobile Safari, load the phone-width homepage fresh and scroll through the full zoom + slide deck, watching both the very top (status bar/notch area) AND the very bottom (Safari's own toolbar/URL bar area) throughout — including moments where Safari's dynamic toolbar chrome collapses/expands during scroll.
started: Found during round-2 real-device UAT for Phase 21, 2026-08-08 — this is a re-test specifically of plan 21-09's fix for the original gap 4 (found 2026-08-05), which did NOT fully resolve the issue and appears to have left (or introduced) a second, related gap at the opposite edge.

## Eliminated

- hypothesis: "Plan 21-10's new intro-beat sections were built with their own sizing that missed the svh convention (i.e. used dvh or plain vh), reintroducing the gap independently of plan 21-09's deck CSS."
  evidence: |
    Read `.home-scroll-deck__intro` (HomeCarousel.astro ~L3695-3735, added by plan 21-10 Task 1): `height: 100svh;` — same unit, same exact-height (not min/max-range) shape as the track/stage/slides. `grep -cE '^\s*(height|min-height|max-height|padding-block|padding-inline):[^;]*dvh' src/components/HomeCarousel.astro` returns 0 file-wide. The intro beats correctly inherited plan 21-09's convention; they did not introduce a separate omission. Whatever is wrong is wrong in the convention itself, shared by track/stage/wordmark/slide/intro alike.
  timestamp: 2026-08-08T00:00:00Z

- hypothesis: "The deck's total scrollable height calculation now falls short of the real device's full document height because the new intro beats changed the document's total height, leaving a shortfall at the very bottom of the page (distinct from a per-section Safari-chrome gap)."
  evidence: |
    `computeZoomProgress` (plan 21-05/21-07) reads the track's own live `getBoundingClientRect().top`, not a document-relative offset, and plan 21-10's own PLAN explicitly notes prepending intro sections required "ZERO change to ZOOM_REVEAL_DISTANCE or the track height calc" for exactly this reason. The reported gap is described as appearing "at any point during scroll" / "near Safari's own toolbar controls," i.e. a live, moving, edge-of-viewport artifact during normal scrolling — not a one-time shortfall at the bottom of the whole page/footer. This does not match a total-document-height accounting bug; it matches a per-viewport-section coverage bug. No evidence found of a document-height shortfall (track/stage delta is independently asserted by e2e as exactly `--zoom-reveal-distance`, unaffected by the intro beats' own separate, correctly-calculated height).
  timestamp: 2026-08-08T00:00:00Z

## Evidence

- timestamp: 2026-08-08T00:00:00Z
  checked: "HomeCarousel.astro ~L3660-3977: the full 21-09 comment block and every svh-sized rule (`.home-scroll-deck__track`, `__stage`, `__wordmark` padding, `.home-slide`, and 21-10's `.home-scroll-deck__intro`)"
  found: |
    Every one of these rules sets an EXACT `height` (or `padding-block`) equal to `100svh` — a fixed value, not a range. `.home-scroll-deck__stage` is `position: sticky; top: 0; height: 100svh;`. The whole page uses native document scroll (confirmed: `html:has(.home-scroll-deck) { scroll-snap-type: y proximity }` at ~L4191 — there is no inner `overflow-y: auto` scroll container; `html`/`body` themselves scroll), which is precisely the scroll-driven context in which Mobile Safari's dynamic toolbar collapse/expand applies.
  implication: |
    CSS spec definitions: `100svh` (small viewport height) is bound to the viewport size when Safari's toolbar chrome is at its LARGEST (i.e., the viewport's CONTENT area is at its SMALLEST) — the worst case for avoiding overflow. `100lvh` (large viewport height) is bound to the opposite extreme (chrome fully retracted, content area largest). `100dvh` tracks whichever state is CURRENT, live. Because `100svh <= 100dvh <= 100lvh` always, any box fixed at an exact `height: 100svh` will be SHORTER than the actual visible viewport any time Safari's chrome is even partially retracted — which is the normal, majority-of-the-time state while a visitor is actively scrolling (chrome retracts on scroll-down, only re-expands near the top or on a stop/tap). This is a STEADY-STATE undershoot, not a transient repaint-lag artifact.

- timestamp: 2026-08-08T00:00:00Z
  checked: "HomeCarousel.astro ~L3660-3679 (21-09's own authored rationale comment for choosing svh)"
  found: |
    The comment states: "svh is constant (it never re-resolves mid-animation), a box sized against it can never end up larger than what is actually on screen — the class of bug that produced the white bar." This reasoning optimizes for "never larger than the screen" (avoiding overflow).
  implication: |
    This is the WRONG optimization target for this use case. The reported defect (a white gap exposing the page background) is caused by the box being SMALLER than the current screen, not larger. Guaranteeing "never larger" (svh) does nothing to prevent, and in fact guarantees, "often smaller" whenever the toolbar is collapsed — svh trades one failure mode (occasional overflow with `dvh`'s live-tracking during the ~100-300ms transition) for a much more persistent one (near-constant undershoot with `svh`'s static small-viewport bound). This is precisely why the bug is now reported as present "at any point during the scroll experience" rather than only during discrete transition windows — undershoot with `svh` is not an edge-case animation glitch, it is the STEADY STATE any time the chrome isn't at its most-expanded resting position.

- timestamp: 2026-08-08T00:00:00Z
  checked: "HomeCarousel.astro ~L2470-2484: `.home-hero__photo`'s own base rule — the SAME file, the section plan 21-09's comment cites as the precedent it was 'carrying forward'"
  found: |
    `.home-hero__photo` does NOT use an exact `height: 100svh`. It uses `min-height: 100svh; max-height: 100vh;` — a RANGE, not a fixed value — with its own comment explaining exactly why: "Keep the photo between the small and large viewport heights. The minimum prevents 16:9 from exposing the footer in a tall desktop window; the maximum prevents a wide/short window from growing the hero beyond one screen." This is a normal-document-flow (non-sticky, non-pinned) element, where the min/max range lets the box GROW to fill whatever the actual current viewport is (up to the vh/large bound), which is exactly the property the deck's sticky/pinned sections lack.
  implication: |
    Plan 21-09 borrowed the UNIT (`svh`) from this precedent but not the PATTERN (a min/max range that can grow to cover the actual current viewport). It converted the hero's `min-height: 100svh` guard (a lower bound, letting the box grow larger when needed) into the deck's `height: 100svh` (an exact, rigid value, forbidding the box from ever growing to match a larger actual viewport). For a `position: sticky`, always-cover-the-screen full-bleed section, an exact small-viewport height is the wrong shape entirely — it guarantees a gap whenever the real viewport is larger than the small extreme, which during active scrolling is most of the time. The hero's own comment ("the minimum prevents... the maximum prevents...") already states the correct mental model plan 21-09 didn't carry over: BOTH bounds matter, and for a full-bleed COVER element specifically, the LOWER bound (never smaller than the true viewport) is the one that must hold at all times, which `svh` alone as an exact height cannot guarantee.

- timestamp: 2026-08-08T00:00:00Z
  checked: "grep -n 'body {' and background-color chain in src/layouts/BaseLayout.astro"
  found: |
    `body { background-color: var(--color-dominant); }` where `--color-dominant: var(--gray-0)` — literal white (`#FFFFFF`), confirmed also in the original gap-4 debug session's own evidence. The deck's paint floor (`var(--color-ink)`, plan 21-09) is scoped ONLY to `.home-slide` and `.home-scroll-deck__photo` — i.e., only to the photo-bearing boxes THEMSELVES. It does nothing for the space OUTSIDE those boxes' own (now demonstrably undersized) height — that space still shows straight through to `body`'s white background, because nothing else in the deck's ancestor chain (`.home-scroll-deck`, `.home-scroll-deck__track`, `html`) carries a non-white background.
  implication: |
    This confirms the exact visible color of the reported gap: whenever a `100svh`-sized deck section undershoots the real (chrome-collapsed) viewport, the strip of screen beyond that section's bottom (or, depending on sticky/scroll-offset timing, top) edge is uncovered by ANY deck element and falls through to `body`'s plain white background — a white bar/gap, exactly as reported, at both the "controllers" edges (top OS status-bar-adjacent chrome and bottom Safari toolbar-adjacent chrome) where Safari's own collapsible UI lives and where the coverage math is tightest.

- timestamp: 2026-08-08T00:00:00Z
  checked: "src/layouts/BaseLayout.astro L163, L180: the `<meta name=\"viewport\">` tag and the `phoneThemeColor` conditional theme-color tag plan 21-09 added"
  found: |
    `<meta name="viewport" content="width=device-width, initial-scale=1" />` — no `viewport-fit=cover` (confirmed still absent, matching plan 21-09's deliberate rejection). `{phoneThemeColor && <meta name="theme-color" media="(max-width: 767px)" content={phoneThemeColor} />}` renders correctly and is wired from both homepage route files with `#1A1A1A`.
  implication: |
    The `theme-color` meta tag, without `viewport-fit=cover`, tints Safari's OWN chrome (its toolbar/tab-bar UI), not the true OS status bar (time/battery/signal row), and — more importantly for this bug — it changes NOTHING about the deck's own box-sizing/coverage math. It cannot fix a genuine CSS undershoot gap; it can only change the fallback color Safari uses when SAMPLING the page background for its own UI chrome tint. Since the top-edge gap is still reported after this fix shipped, the top gap is most plausibly the SAME undershoot-class mechanism as the newly-reported bottom gap (the `height: 100svh` rigid sizing), not a residual chrome-coloring issue — the theme-color fix addressed a real but secondary/cosmetic concern (what color the OS-chrome-adjacent strip should read as, IF one is exposed) without addressing the root sizing defect that exposes a strip in the first place.

## Resolution

root_cause: |
  Plan 21-09's fix for the original status-bar white-bar gap converted every full-screen deck section (`.home-scroll-deck__track`, `.home-scroll-deck__stage`, `.home-scroll-deck__wordmark` padding, `.home-slide`, and plan 21-10's later `.home-scroll-deck__intro`) from an exact `height: 100dvh` to an exact `height: 100svh`. This traded one failure mode for a worse one, because it optimized for the wrong constraint. `100svh` (small viewport height) is bound to Mobile Safari's SMALLEST possible content area — the state when its dynamic toolbar chrome (URL/tab bar) is fully EXPANDED. `100dvh` was flagged as buggy because it re-resolves LIVE and can momentarily desync from the actual paint during the ~100-300ms toolbar collapse/expand transition. But `100svh` does not merely avoid that transient desync — being a STATIC value pinned to the smallest extreme, it guarantees the box is shorter than the true visible viewport any time the toolbar chrome is even partially retracted, which is Mobile Safari's default, majority-of-the-time state while a visitor is actively scrolling (the chrome auto-collapses on scroll-down and only re-expands near rest/top). Since this deck scrolls via the native document (`html`/`body` scroll, no inner scroll container — confirmed by the page-wide `html:has(.home-scroll-deck) { scroll-snap-type: y proximity }` rule), Safari's real toolbar-collapse behavior directly and continuously applies throughout the scroll experience, not just at isolated moments.

  The result is a persistent (not merely transient/animation-timing) undershoot: whenever the actual current viewport is taller than `100svh` (i.e., whenever the toolbar chrome isn't at its most-expanded resting state — the common case during scrolling), the sticky-pinned stage/slide/intro boxes, each sized to exactly `100svh`, fall short of the true visible area by the height of the retracted chrome. That uncovered strip falls through to `body`'s plain white `background-color: var(--color-dominant)` (literal `#FFFFFF`), because plan 21-09's `var(--color-ink)` paint floor was deliberately scoped ONLY to the photo-bearing boxes themselves (`.home-slide`, `.home-scroll-deck__photo`) and covers nothing outside their own (now-undersized) box. This produces a white gap at whichever screen edge the toolbar-collapse-vacated space lands — matching the newly-reported BOTTOM gap near Safari's own toolbar exactly, and most plausibly also explaining why the TOP gap is still reported (the same undershoot mechanism, at the opposite edge, combined with the fact that the added `theme-color` meta tag — which only tints Safari's own browser-chrome color sampling and requires no `viewport-fit=cover` to do so — cannot fix a genuine CSS box-undershoot gap regardless of what color it targets).

  This is a case of borrowing the WRONG half of an established, real-device-validated in-repo pattern. `.home-hero__photo` (the very precedent plan 21-09's own comment cites) does not use an exact `height: 100svh` at all — it uses `min-height: 100svh; max-height: 100vh`, a RANGE, with its own authored comment explaining that BOTH bounds matter: the minimum prevents underflow (content shorter than the smallest viewport, exposing the footer), and the maximum prevents overflow (content taller than the largest reasonable viewport). Plan 21-09 carried forward only the unit choice (`svh`) and applied it as a rigid exact height to `position: sticky` full-bleed sections that must ALWAYS cover the CURRENT (potentially much larger) viewport — the opposite constraint from the hero's own non-sticky, normal-flow, "don't overflow into the footer" problem. A static small-viewport-bound exact height structurally cannot satisfy an "always fully cover the current screen, in every intermediate toolbar state" requirement; only a bound tied to the LARGE viewport extreme (`100lvh`), or a live-synced value that tracks Safari's actual current chrome state (e.g., the alternative the original gap-4 debug session explicitly named and did not choose: a `--vh`/`--dvh`-mirroring custom property kept in lockstep via `window.visualViewport`'s `resize`/`scroll` listeners, driven from the SAME per-frame rAF loop plan 21-07 already unified everything else through), can guarantee no-gap coverage across every intermediate toolbar-animation state, not just the two extremes.
fix: (not applied — goal is find_root_cause_only; diagnosis returned to caller)
verification: (not applicable — no fix applied in this mode)
files_changed: []
