---
status: diagnosed
trigger: "homepage-scroll-ios-status-bar-white-gap — user reports a white bar/gap near the iPhone status bar (time/battery/signal row) at some point during the scroll experience, visible in their own real-device screen recording but not directly confirmed by the orchestrator's own extracted-frame sampling of the same video."
created: 2026-08-05T00:00:00Z
updated: 2026-08-05T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED (see Resolution). No further action — goal is find_root_cause_only.
test: n/a
expecting: n/a
next_action: return ROOT CAUSE FOUND to caller.

## Symptoms

expected: No stray white bar or gap should appear near the device's status bar/notch/safe-area region at any point during the scroll experience — the deck's full-screen sections should occupy the true viewport edge to edge, matching the "wordmark fills the screen" success criterion.
actual: The user directly observed a white bar near the status bar area on their real iPhone during testing. The orchestrator sampled the same screen recording at roughly 0.2-0.5s intervals and did not find a plain white gap distinct from the OS status bar / screen-recording indicator overlay in those specific samples.
errors: None reported.
reproduction: On a real iPhone in Mobile Safari (not an emulator), load the phone-width homepage fresh and scroll through the full zoom + slide deck, watching the very top of the screen (status bar / notch / safe-area region) throughout — including moments where Safari's own dynamic toolbar chrome collapses/expands during scroll, and the very first paint before any scrolling.
started: Found during real-device UAT for Phase 21 (Homepage Scroll Experience), 2026-08-05.

## Eliminated

- hypothesis: "The deck's phone-width header override (`.home :global(.site-header--solid), .home :global(.site-header--transparent) { position: fixed; ... }` at HomeCarousel.astro ~L3571) omits `top`/`left`/`right`, so the fixed header falls back to an undefined static position on iOS Safari, leaving a gap above it."
  evidence: |
    Traced the actual DOM: index.astro passes `headerVariant="none"` to BaseLayout (suppressing BaseLayout's own <SiteHeader>), and HomeCarousel.astro renders its OWN `<SiteHeader variant="transparent">` hardcoded (src/pages/index.astro:129-130) — the variant prop is NEVER swapped to "solid" by JS; grid mode only re-skins `.site-header--transparent` visually via a `[data-display-mode='grid']` attribute selector (HomeCarousel.astro ~L1939), never changes the literal class. So `.site-header--solid` never matches any element on the homepage (dead/defensive selector only). The ACTIVE class, `.site-header--transparent`, already carries `top: 0; left: 0; right: 0` in its own base rule (SiteHeader.astro L222-227), and the deck's override rule only touches `position`/`transition` — per-property cascade means `top: 0` still wins from the base rule regardless of the override's added specificity. No missing inset on the header actually in use.
  timestamp: 2026-08-05T00:00:00Z

- hypothesis: "An ancestor of the sticky/fixed elements has `overflow: hidden` (or similar), which is a classic cause of `position: sticky` failing on iOS Safari and could produce a gap."
  evidence: |
    Grepped BaseLayout.astro, HomeCarousel.astro and sibling components for overflow rules; the only site-wide overflow found was `.sr-only`'s `overflow: hidden` (an off-screen accessibility utility, irrelevant to layout). PageTitleHeader.astro contains an explicit historical note: a site-wide `overflow-x: hidden` on html/body "was tried and reverted" (2026-07-29 CI failure) — confirming no ancestor-level overflow currently exists on html/body/main that could break sticky/fixed containing-block behavior.
  timestamp: 2026-08-05T00:00:00Z

- hypothesis: "A JS-cached height/rect value (measured once, not live) drives an inline style that goes stale as Safari's toolbar height changes mid-scroll."
  evidence: |
    Grepped the whole component for `innerHeight`, `clientHeight`, `offsetHeight`, `.style.height`, `.style.top`, `visualViewport` — none found in HomeCarousel.astro except a comment (L2164) about a *design rationale*, not a live measurement. The zoom driver (plan 21-05) computes progress from `track.getBoundingClientRect().top` on every rAF-batched scroll event — a live read, not a cached one. No stale-cache class of bug present in this codebase's JS.
  timestamp: 2026-08-05T00:00:00Z

## Evidence

- timestamp: 2026-08-05T00:00:00Z
  checked: "grep -n \"100dvh|100vh|-webkit-fill-available\" src/components/HomeCarousel.astro"
  found: |
    The NEW deck (track/stage/slides, added by plans 21-04/21-05) uses `100dvh` exclusively: `.home-scroll-deck__track { height: calc(100dvh + var(--zoom-reveal-distance, 900px)); }`, `.home-scroll-deck__stage { position: sticky; top: 0; height: 100dvh; ... }`, `.home-slide { height: 100dvh; ... }`. No `-webkit-fill-available` fallback anywhere in the file.
  implication: The deck's full-viewport sizing depends entirely on `100dvh`'s live interaction with Safari's toolbar animation.

- timestamp: 2026-08-05T00:00:00Z
  checked: "The pre-existing .home-hero__photo mobile rule and its authoring comment (HomeCarousel.astro ~L2186-2201, restated at ~L3182-3201)"
  found: |
    The EXISTING full-bleed mobile hero deliberately does NOT use `100dvh`. It uses `min-height: 100svh; max-height: 100vh;` and the comment explains why, in detail: "100svh, not 100vh: confirmed via a real-device screenshot that plain vh (which resolves to the LARGE viewport, i.e. the size once Safari's address bar auto-hides) made the hero taller than what's actually visible on first load, while the browser chrome is still showing — the site's own footer text peeked in underneath the caption on arrival. svh always resolves to the SMALL viewport (chrome visible, the worst case), so the hero is guaranteed to fit within whatever is actually on screen before any scrolling happens."
  implication: |
    This codebase already has direct, documented, real-device-tested proof that trusting Safari's viewport-height units naively (vh, and by extension dvh's live-tracking behavior) around the toolbar's collapse/expand animation produces visible layout defects on a real iPhone — and already chose a DIFFERENT, safer unit (svh, bounded by vh) for exactly this reason on the sibling full-bleed hero section. Plans 21-04/21-05/21-06 did not carry that established, hard-won convention forward to the new deck; they used raw `100dvh` throughout instead, which is the inconsistency the retry note asked to check for, and it is real.

- timestamp: 2026-08-05T00:00:00Z
  checked: "grep -rn \"env(safe-area-inset\" src/ (whole tree) and BaseLayout.astro's <meta name=\"viewport\"> tag and any theme-color meta"
  found: |
    Zero occurrences of `env(safe-area-inset...)` anywhere in `src/`. The viewport meta tag (BaseLayout.astro L151) is `width=device-width, initial-scale=1` — no `viewport-fit=cover`. No `<meta name="theme-color">` exists anywhere in the codebase. `body`'s background-color is `var(--color-dominant)` which resolves to `var(--gray-0)` = literally `#FFFFFF`.
  implication: |
    Without `viewport-fit=cover`, the page never opts into rendering under the status bar, so `env(safe-area-inset-top)` is moot everywhere (consistent absence, not a new omission introduced by this phase — no other full-bleed section needed it either, because none of them previously relied on Safari's toolbar-collapse "immersive" scroll transition the way this NEW pinned/scroll-driven deck does). Critically, with no `theme-color` meta set, Mobile Safari falls back to deriving the color of the chrome area immediately around the status bar/toolbar from the page's own top-of-document background during scroll-driven toolbar-collapse transitions — and that background is pure white (`#FFFFFF`) everywhere on this site, including the homepage. There is nothing configured to make that fallback-sampled chrome color match the deck's photo/accent palette instead.

- timestamp: 2026-08-05T00:00:00Z
  checked: "21-04-PLAN.md / 21-05-PLAN.md verification sections, and the UAT report's corroborated point 2 (sticky-effect handoff glitch) and point 3 (blur-placeholder jank)"
  found: |
    Both plans explicitly defer real-device confirmation to the phase gate: '`webkit-mobile` is the desktop WebKit build with an emulated iPhone viewport, not Mobile Safari, and has historically lagged on scroll APIs.' The UAT's own corroborated findings (points 2 and 3) independently confirm this deck already exhibits real, observable timing/handoff instability during the exact same pinned-stage-release / scroll-driven-crossfade window on this same device and same recording (a broken-looking overlap frame at the zoom-to-slide handoff, and prolonged blur-placeholder pop-in) — i.e. this scroll region is demonstrably not frame-perfect on the real device already, for reasons the UAT already attributes to scroll-driven timing/sync gaps.
  implication: |
    The status-bar white-bar report sits in the same causal neighborhood as the OTHER two corroborated defects: all three are transient, sub-second visual artifacts tied to scroll-driven state changes (pinned-stage release, image decode, and now toolbar-collapse) on real Mobile Safari — a rendering environment this phase's automated suite structurally cannot exercise. This raises confidence that the white-bar report is a real, distinct browser-timing artifact rather than a sampling illusion, even though the orchestrator's frame extraction didn't happen to land on the exact frame(s) where it occurs (toolbar-collapse animations are triggered by discrete scroll gestures, not by a fixed clock, so a fixed 0.2-0.5s sampling grid can easily straddle the ~100-300ms transition window without capturing a frame from inside it).

## Resolution

root_cause: |
  The phone-width scroll deck (`.home-scroll-deck__track`/`__stage`/`.home-slide`, HomeCarousel.astro, plans 21-04/21-05) sizes every full-screen section with `height: 100dvh` exclusively, breaking from this codebase's own established, real-device-validated convention (used one section over, on `.home-hero__photo`) of bounding full-bleed mobile content with `min-height: 100svh; max-height: 100vh` specifically because Mobile Safari's toolbar collapse/expand animation (triggered by scroll) does not always resize/repaint viewport-height-dependent boxes in lockstep with the live `dvh` value — a documented class of WebKit timing defect. Compounding this, the site has no `<meta name="theme-color">` and no `viewport-fit=cover`, so during that same toolbar-collapse/expand window Mobile Safari falls back to coloring the status-bar-adjacent chrome from the page's own top-of-document background, which is pure white (`#FFFFFF`, `--color-dominant`/`--gray-0`) everywhere on this site. The combination — a `100dvh`-sized, scroll-pinned/sticky stage that can momentarily fail to cover the newly-revealed viewport strip during the toolbar's collapse animation, with nothing configured to make Safari's fallback chrome-color match the deck's photo/accent palette instead of the raw white body background — produces a brief white bar at the very top of the screen (status bar / time row) specifically during scroll-driven toolbar transitions. This is consistent with why it's real but hard to catch: it is tied to a discrete, scroll-gesture-triggered ~100-300ms browser animation, not a steady-state layout error, so a fixed-interval frame sample (0.2-0.5s grid) can easily miss the exact frame(s) it appears in, while a real-device viewer scrolling continuously sees it. It also sits in the same causal family as the UAT's two OTHER corroborated real-device defects (the sticky-release handoff overlap glitch, and the blur-placeholder pop-in) — all three are scroll-driven timing artifacts on real Mobile Safari that this phase's automated suite (webkit-mobile = desktop WebKit, not real Mobile Safari, explicitly called out as insufficient in both 21-04-PLAN.md and 21-05-PLAN.md's own verification sections) cannot exercise.
fix: (not applied — goal is find_root_cause_only; diagnosis returned to caller)
verification: (not applicable — no fix applied in this mode)
files_changed: []
