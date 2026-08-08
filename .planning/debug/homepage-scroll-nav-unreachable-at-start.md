---
status: diagnosed
trigger: "homepage-scroll-nav-unreachable-at-start — 21-UAT.md round-2 gap 5: the navigation hamburger should be reachable from the very start of the phone-width homepage, but is currently hidden through both new intro beats (21-10) and the entire wordmark zoom."
created: 2026-08-08T15:20:00Z
updated: 2026-08-08T15:45:00Z
---

## Current Focus

hypothesis: CONFIRMED — the `data-intro-active='true'` CSS rule added by plan 21-10 (src/components/HomeCarousel.astro lines 4104-4108) hides the header for the entire pre-zoom scroll region (both intro beats, ~2 viewport heights), on top of the pre-existing D-12 `data-zoom-active` hide that covers the ~900px zoom scrub itself. Combined, the header is invisible from scroll 0 all the way until the zoom fully completes and the first slide settles.
test: read the exact JS write condition (`applyIntroActive`, lines 2029-2044) and the exact CSS selectors (lines 4079-4108) governing header visibility; cross-checked against 21-10-PLAN.md Task 2 item 1 (which explicitly names this as the "first friction 21-UAT.md gap 1 names") and 21-10-SUMMARY.md's own coverage table (D2: "the header is hidden through both intro beats").
expecting: confirmation that data-intro-active is solely a header-hide signal (no other consumer) so it is the single minimal lever to change.
next_action: N/A — goal is find_root_cause_only; diagnosis complete, returning to caller for a fix-planning pass (not applying a fix in this session).

## Symptoms

expected: The navigation hamburger should be visible and usable at least from the very beginning, on arrival at the site, so a visitor can navigate away from the homepage without first scrolling through the intro and zoom.
actual: The header (containing the hamburger nav) is currently hidden during the two new intro beats AND the entire wordmark zoom, only fading in once the zoom completes and the first gallery slide settles — matching the gap-1 debug session's own suggested fix direction ("extend D-12's header-hide condition... to also cover the new beat").
errors: None — a real UX/design gap, not a code exception.
reproduction: On a real phone, load the homepage fresh and try to open the navigation (hamburger) before scrolling — it should not be reachable yet in the current build.
started: Introduced by plan 21-10 (Task 2, committed as `849545d`), which extended D-12's original zoom-only header hide to also cover the two new pre-zoom intro beats it added in the same plan (Task 1, `94d4c40`). Before 21-10, D-12 only hid the header during the zoom itself; there was no pre-zoom content to hide it during.

## Eliminated

(none — root cause found directly from source-of-truth code inspection; no false hypotheses needed elimination)

## Evidence

- timestamp: 2026-08-08T15:25:00Z
  checked: src/components/HomeCarousel.astro lines 4066-4108 (the D-12 header-hide CSS block)
  found: |
    Two independent, additive hide rules, both keyed on attributes of `.home`:
      .home[data-zoom-active='true'] :global(.site-header--solid/-transparent) { opacity:0; visibility:hidden; }   (original D-12, pre-21-10)
      .home[data-intro-active='true'] :global(.site-header--solid/-transparent) { opacity:0; visibility:hidden; }  (added by 21-10 Task 2, per the gap-1 debug session's own suggested fix direction)
    The rule's own comment (lines 4091-4103) explicitly documents that WITHOUT this extension "the small top-left header logo would render simultaneously with the new large centred intro logomark" — i.e. it was added deliberately, not accidentally, to avoid a perceived visual collision, not because of any functional necessity.
  implication: There are two separate, independently-toggled conditions hiding the header. Fixing gap 5 means changing the SECOND one (data-intro-active); the first one (data-zoom-active) implements the original, still-intact D-12 decision about the zoom itself, which the user's correction does not target.

- timestamp: 2026-08-08T15:27:00Z
  checked: src/components/HomeCarousel.astro lines 2029-2044 (`applyIntroActive()`) and lines 1923-1933 (`onProgress()`)
  found: |
    `applyIntroActive(trackTop)`: sets `data-intro-active='true'` while `trackTop > 0` (i.e. any part of the 2-beat pre-zoom region is still on screen — this is ONE flag for the WHOLE pre-zoom region, it does not distinguish beat 1 from beat 2). Removes the attribute (not set to false) once `trackTop <= 0`, i.e. exactly when the zoom track reaches the viewport top and the zoom scrub begins.
    `onProgress(t)`: sets `data-zoom-active` to `'true'` while `t < 1` (mid-scrub) and to `'false'` (present, not removed) once `t` reaches 1 (zoom complete) — this is when the header fades back in.
    Together: intro-active covers scroll 0 -> ~2 viewport heights; zoom-active covers the ~900px scrub immediately after. The header is hidden continuously across BOTH windows with no gap, exactly matching the UAT report's "hidden through both intro beats AND the entire wordmark zoom."
  implication: The `data-intro-active` attribute currently has exactly ONE consumer — this header-hide CSS rule (confirmed by grep: its only other references are the JS write/removal/comment sites, no other CSS selector or JS branch reads it). It is safe to change or remove this rule's *effect* (stop hiding on it) without touching the attribute's write logic, JS driver, or any other feature — `computeProgress()`'s comment (lines 2008-2016) explicitly notes intro-active and zoom-progress are "two readings of the SAME measurement" purely for internal consistency, not because anything else depends on the attribute's value.

- timestamp: 2026-08-08T15:30:00Z
  checked: 21-10-PLAN.md assumptions A1-A5 and 21-UAT.md gap 5's exact user wording
  found: |
    None of A1-A5 covers header-visibility scope during the intro beats — confirmed both by 21-UAT.md's own framing ("Real usability gap, not covered by any of A1-A5") and by re-reading all five assumptions: A1 is about reduced-motion, A2 about dismissal method, A3 about scroll-snap, A4 about logo geometry (itself now separately corrected by UAT gap 1/point 1 in the same round), A5 about visual treatment (ink/white). The header-hide extension was not labelled as an assumption at all — plan 21-10 treated it as a direct, confident implementation of the gap-1 debug session's own suggested fix, not as an open question. That is precisely why the user's correction here reads as new scope, not an assumption being confirmed/denied.
    User's exact French: "Le hamburger de navigation devrait au moins apparaître au tout début sur l'arrivée du site pour pouvoir naviguer dedans." — "au moins" ("at least") + "au tout début sur l'arrivée" ("at the very start, on arrival") together set a MINIMUM bar: reachable at first paint / scroll position 0. The wording makes no mention of the zoom itself, and does not ask for it to also stay visible throughout the zoom.
  implication: The minimal, literal read of the correction is: the header must not be hidden at scroll 0 (and, by the same logic, not through beat 2 either, since both beats are the "very beginning" the user is describing before any meaningful navigation-relevant content has arrived). It does NOT necessarily ask to change the zoom's own header-hide (D-12's original, un-corrected scope). The minimal fix is to make data-intro-active's header-hide a no-op (or remove the attribute's header-hide consumption entirely), restoring header visibility to pre-21-10 D-12 scope: hidden only during the actual wordmark zoom scrub, not during the two new intro beats that precede it.

- timestamp: 2026-08-08T15:35:00Z
  checked: src/components/HomeCarousel.astro line 130 (`variant="transparent"` fixed on SiteHeader) and src/components/SiteHeader.astro lines 213-344 (`.site-header--transparent` styling)
  found: |
    HomeCarousel always renders the header with `variant="transparent"`: white logo (`logo-mark__img--hover`, shown by default in this variant) and white nav-link text over a `linear-gradient(to bottom, rgba(0,0,0,.55) 0%, rgba(0,0,0,.25) 60%, rgba(0,0,0,0) 100%)` scrim, `position: absolute; z-index: 2`. This variant was designed for legibility over hero photos, but is equally legible over the intro beats' solid `var(--color-ink)` background (white-on-dark, correct contrast) — no color-contrast collision if shown during the intro beats.
  implication: Making the header visible during the intro beats introduces NO contrast/legibility problem. The only interaction risk is compositional/aesthetic: a small (56px) white header logomark top-left would appear simultaneously with the intro's own large (40vw, up to 220px) centred white logomark in the same viewport — two renderings of the same brand mark at different scales in one screen. This is exactly the concern plan 21-10's own comment (lines 4094-4097) named as its reason for adding the hide. It is a legitimate design question, not a technical blocker, and it directly overlaps with the OTHER concurrent, unresolved UAT-round-2 gap in this same batch (gap 1 / point 1: assumption A4's "two static stacked logo instances" is itself being corrected to "one continuously-transforming logo element"). Whatever that A4 redesign produces will change what, if anything, visually competes with the header logo during the intro — so the two corrections are coupled and should ideally be planned/executed together, or at minimum the header-visibility fix should be revisited once A4's redesign lands.

- timestamp: 2026-08-08T15:38:00Z
  checked: 21-10-PLAN.md Task 3 item 8 / 21-10-SUMMARY.md coverage id D2 (the e2e case this correction invalidates)
  found: |
    tests/e2e/homepage-scroll-deck.spec.ts's "pre-zoom intro beats" describe block contains a case literally named "the header is hidden through both intro beats, and returns once the zoom fully completes (D-12 extension)" asserting header NOT visible at scroll 0 and after one viewport height, then visible only past the full zoom. This case codifies the exact behavior the user is now asking to change — it will need to be rewritten (not just the implementation) as part of any fix, matching the same "deliberately-superseded case, not a regression" pattern plan 21-10 itself used for the wordmark-on-first-load case it rewrote from 21-04.
  implication: A fix here is not purely a CSS deletion — it has a known, findable regression-test footprint (this one case) that must be updated in lockstep, exactly as 21-10's own precedent already demonstrated for a similar "deliberately superseded assertion" situation.

## Resolution

root_cause: |
  Plan 21-10 (Task 2, commit 849545d) added a new CSS rule — `.home[data-intro-active='true'] :global(.site-header--solid/-transparent) { opacity:0; visibility:hidden; }` (src/components/HomeCarousel.astro lines 4104-4108) — extending the pre-existing D-12 header-hide (originally scoped ONLY to the wordmark zoom's `data-zoom-active` attribute) to also cover the two new pre-zoom intro beats it introduced in the same plan. The `data-intro-active` attribute is written by `applyIntroActive()` (lines 2029-2044) whenever the zoom track's own top edge hasn't yet reached the viewport top — i.e. for the entire ~2-viewport-height duration of both intro beats, back-to-back with the zoom's own `data-zoom-active` hide window. The two hide windows are contiguous with no gap, so the header is invisible continuously from scroll position 0 until the zoom fully completes — exactly the "hidden through both new intro beats AND the entire wordmark zoom" symptom reported.

  This was a deliberate design decision made by plan 21-10 (not a bug/oversight) — its own inline comment names the reasoning: avoiding the small header logo rendering simultaneously with the new large centred intro logomark. The user's round-2 UAT correction (gap 5) overturns that specific judgment call: the header/hamburger needs to be reachable "au moins... au tout début... à l'arrivée" (at least, at the very beginning, on arrival) so navigation is possible immediately, without first scrolling through the intro+zoom.

  `data-intro-active`'s ONLY consumer in the codebase is this header-hide CSS rule (confirmed via grep — all other references are the JS write/removal/explanatory-comment sites). This makes the header-hide CSS rule the single, isolated point of the fix: no other feature, test gate, or shared-state concern depends on this attribute's semantics.

fix: |
  NOT APPLIED in this session (goal: find_root_cause_only). Suggested minimal fix direction for a follow-up planning/execution pass:
    - Remove (or stop matching against) the `.home[data-intro-active='true'] :global(.site-header--solid/-transparent) { opacity:0; visibility:hidden; }` rule (lines 4104-4108), restoring D-12's header-hide scope to `data-zoom-active` only — i.e. header hidden during the wordmark zoom scrub exactly as originally decided pre-21-10, but visible throughout both new intro beats (scroll 0 through the start of the zoom).
    - The `data-intro-active` attribute's write/removal logic (applyIntroActive(), computeProgress()) can stay entirely unchanged — it has no other consumer, so this is a CSS-only removal, not a driver change.
    - Companion test update required: tests/e2e/homepage-scroll-deck.spec.ts's "the header is hidden through both intro beats, and returns once the zoom fully completes (D-12 extension)" case must be rewritten to assert the header IS visible during both intro beats and only hides once the actual zoom scrub begins — mirroring how 21-10 itself rewrote the 21-04 "wordmark on first load" case as a deliberately-superseded assertion, not a silently-relaxed one.
    - Design interaction flagged for the planning agent: this correction is temporally and visually coupled to the OTHER unresolved UAT-round-2 gap in the same batch (gap 1 / assumption A4's redesign from "two static stacked logo instances" to "one continuously-transforming logo element"). Whether a small header logo reads as redundant next to the intro's own large centred logomark depends on what that A4 redesign ends up looking like. Recommend sequencing or co-planning both corrections rather than fixing this one in isolation. No color-contrast issue exists either way (the header's `variant="transparent"` white-on-dark styling is already legible against the intro's ink background) — the open question is purely compositional/aesthetic, not technical.
verification: N/A — not applied.
files_changed: []
