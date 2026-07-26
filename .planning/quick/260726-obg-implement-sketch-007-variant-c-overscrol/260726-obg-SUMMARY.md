---
task: quick-260726-obg
subsystem: homepage-hero, carousel-overscroll
tags: [homepage, carousel, overscroll, view-transitions, footer, e2e, sketch-007]
status: complete
dependency-graph:
  requires: [quick-260725-sj4, quick-260725-dcg, quick-260725-pit, quick-260725-tqs]
  provides: [carousel-overscroll-pull-feedback, carousel-footer-hidden-again, carousel-title-no-underline]
  affects: [HomeCarousel.astro, homepage.spec.ts, i18n.spec.ts, legal.spec.ts]
tech-stack:
  added: []
  patterns:
    - "Photo-as-feedback overscroll safety signal: CSS custom properties (--pull-scale/--pull-darken) written by a small setPullFeedback(p) helper, consumed by transform/opacity transitions on child layers — the accumulator's numeric state drives visible feedback with zero new chrome."
    - "Proactive idle-decay watchdog (setInterval polling a lastOverscrollTs timestamp) replacing a lazy on-next-event reset, so a stopped gesture visibly recedes on its own."
    - "Synchronous, transition-disabled 'commit reset' (an .is-opening class + forced reflow) immediately before a cross-document View Transition trigger, so the outgoing snapshot never captures a mid-animation state."
key-files:
  created: []
  modified:
    - src/components/HomeCarousel.astro
    - tests/e2e/homepage.spec.ts
    - tests/e2e/i18n.spec.ts
    - tests/e2e/legal.spec.ts
decisions:
  - "Ported sketch 007 Variant C (photo pulls back, no chrome) verbatim as the real overscroll feedback mechanism, per the plan's approved design spec — no dedicated new UI element (rejected Variant A/B)."
  - "Accepted the safety_investigation's explicit tradeoff: reintroducing the footer-hide makes atBottom() vacuously true at scrollY 0 on desktop again (the exact quick-260725-sj4 precondition) — but this time it is deliberately mitigated by the 150px threshold + early visible pull feedback + proactive decay together, not by real scroll distance. The old 'atBottom() false at scrollY 0' and 'two 80px ticks do NOT navigate' sj4 regression tests are now correctly FALSE by design and were replaced (not preserved) with an early-warning proof per the plan's explicit instruction."
  - "Reduced motion keeps the full scale/darken feedback values (only the easing is dropped, snapping instantly) rather than disabling it — per safety_investigation item 4, this is the sole remaining safety signal for reduced-motion visitors and must not be silently turned off."
  - "Footer-hide CSS rule kept inside HomeCarousel's own is:global block (body:has(.home[data-display-mode='carousel']) footer.chrome-band), not BaseLayout.astro/hideFooter — mirrors the prior dcg implementation exactly, scoping the rule to the homepage only."
metrics:
  duration: ~70min
  completed: 2026-07-26
---

# Quick Task 260726-obg: Sketch 007 Variant C Overscroll Feedback + Footer Hide + Underline Removal Summary

Ported sketch 007's winning Variant C (the hero photo itself scales down and darkens proportionally to overscroll, no dedicated chrome) as the homepage carousel's real overscroll-to-open safety signal, added the sketch's proactive idle-decay and a synchronous pre-navigation neutral reset, reintroduced the carousel-mode footer hide now that it's mitigated by that visible feedback, reworked the falsified quick-260725-sj4 regression tests to the new early-warning contract, and removed the persistent carousel-title underline per direct user feedback.

## What Was Built

**Task 1 — Sketch 007 Variant C overscroll feedback (`HomeCarousel.astro`):** Added a new `.home-hero__pull-overlay` element (sibling of the permanent `.home-hero__scrim`, layered above it and below the caption) whose opacity is driven by a `--pull-darken` CSS custom property, plus a `transform: scale(var(--pull-scale, 1))` on both `.home-hero__img` layers. `setPullFeedback(p)` clamps `p` to `[0,1]` and writes `1 - p*0.06` / `p*0.85` — the exact sketch coefficients. `decayOverscroll()` animates the accumulator back to 0 over 300ms via `requestAnimationFrame` (snapping instantly under reduced motion); a 150ms `setInterval` watchdog calls it proactively once a gesture has been idle past the existing 800ms window, so "letting go" visibly reads as cancel instead of waiting for the next scroll event. `registerDownwardIntent()` now calls `setPullFeedback()` on every accumulated delta, before the threshold check. `navigateToCurrent()` resets the photo to neutral scale/darken synchronously, with an `.is-opening` class disabling the transition and a forced reflow, before `titleEl.click()` fires — so the outgoing cross-document `hero-photo` View Transition snapshot always captures the photo at rest. `render()`/`showGrid()` both reset the accumulator and feedback on every slide change or mode switch. Every overscroll listener remains `{ passive: true }`; no `preventDefault()` was added anywhere.

**Task 2 — Reintroduced carousel-mode footer hide + reworked sj4 test contract (`HomeCarousel.astro`, `homepage.spec.ts`, `i18n.spec.ts`, `legal.spec.ts`):** Re-added `body:has(.home[data-display-mode='carousel']) footer.chrome-band { display: none; }` to HomeCarousel's existing `is:global` block (unchanged scoping/mechanism from the original quick-260725-dcg implementation; `BaseLayout.astro`/`hideFooter` untouched). This deliberately restores the exact precondition quick-260725-sj4 fixed (footer hidden -> `atBottom()` vacuously true at scrollY 0 on desktop) — the plan's `safety_investigation` explicitly accepts this tradeoff, now mitigated by Task 1's feedback instead of real scroll distance. Updated `homepage.spec.ts`: removed the now-false "atBottom() is false at scrollY 0" test and the two "two 80px wheel ticks do NOT navigate" tests (FR+EN) — replaced with "one 80px wheel tick already shows visible pull feedback before any navigation" (FR+EN), which proves the actual safety property (an accidental scroll announces itself visibly, well before the threshold, instead of navigating in silence). Kept the mobile touch-swipe non-navigation test (mobile's in-flow accent panel still provides real scroll distance, unaffected by the footer). HOME-06 mobile and tall-desktop full-bleed regression tests now assert the footer `toBeHidden()` rather than "below the fold." Added a new `footer visibility by display mode (quick-260726-obg)` describe block (FR+EN: hidden in carousel, visible in grid). `i18n.spec.ts`'s two locale-content tests and its footer-copy-differs test were updated to the DOM-present-but-hidden contract (the copy-differs test now switches to grid mode before reading `innerText`, since a `display:none` element's `innerText` is always `''`). `legal.spec.ts`'s footer-legal-nav-reachability tests now click the grid-mode toggle before clicking the footer legal links.

**Task 3 — Removed the persistent carousel title underline (`HomeCarousel.astro`):** `.home-hero__title`'s `text-decoration: underline` + `text-underline-offset: 3px` became `text-decoration: none`. Because the title is an `<a>`, `BaseLayout.astro`'s global `a:hover, a:focus-visible { text-decoration: underline }` rule would otherwise re-underline it on hover/focus, so the existing `.home-hero__title:hover, .home-hero__title:focus-visible` rule also gained an explicit `text-decoration: none`. The accent-color hover/focus, pointer cursor, and ellipsis truncation are all untouched. Added a new computed-style e2e test asserting `text-decoration-line: none` both at rest and on hover.

## Verification Performed

All verification below was run directly by the executor (a real `.env` with Sanity credentials was copied into this worktree at the start of the session, per the dispatch instructions):

- `npx astro check`: **0 errors** after every task (only pre-existing, unrelated warnings/hints remained — deprecated `webkitBackgroundClip` usage and unused `Props` interfaces in files this task never touched).
- `npm run build`: succeeded after every task, real Sanity content (27 pages).
- `npm run test:unit` (Vitest): **112/112 passing**. One pre-existing, unrelated suite (`tests/unit/dashboard-logic.test.ts`) fails to even load (`Cannot find package '@sanity/icons'`) — confirmed via `git log` this file was last touched by an unrelated prior task and confirmed `@sanity/icons` is absent from `node_modules` in both this worktree and the main checkout (a dependency-install gap in the `sanity/` subproject, not a regression caused by this task). Logged to `deferred-items.md`, not fixed (out of scope per the executor's scope-boundary rule).
- Full `npx playwright test` (both `chromium` and `webkit-mobile` projects, isolated port 4322 via a temporary local `playwright.config.ts` port override that was reverted afterward and never committed): **223/223 passing** (219 chromium + 4 webkit-mobile smoke), including all 5 new Task 1 pull-feedback tests, the reworked Task 2 sj4/footer-visibility tests, the reworked `i18n.spec.ts`/`legal.spec.ts` tests, and the new Task 3 underline test. Also spot-ran the full `homepage.spec.ts`/`i18n.spec.ts`/`legal.spec.ts`/`site-header.spec.ts`/`social-links.spec.ts`/`gallery.spec.ts` subset after Task 2 specifically (170/170 passing) to confirm the footer-hide change didn't regress any unrelated footer-adjacent test in other spec files.
- No live MCP browser (Chrome DevTools MCP) spot-check was performed — those tools were not available in this execution session (only Read/Write/Edit/Bash/Skill). The Playwright synthetic-event tests directly assert the live `--pull-scale`/`--pull-darken` computed CSS values, footer visibility, and title underline in a real headless Chromium browser, which is the closest available substitute. The orchestrator's stated plan is to independently re-verify with a live browser regardless.

## Known Stubs

None.

## Threat Flags

None beyond what the plan's own `<threat_model>` already covers (T-obg-01 idle-decay DoS, T-obg-02 footer-hide tampering) — this task adds no new network endpoints, auth paths, or trust-boundary-crossing surface. Confirmed the idle watchdog is self-bounded (only starts a `requestAnimationFrame` loop when there's something to decay, and that loop always terminates and clears its own handle).

## Deviations from Plan

None — plan executed exactly as written for all 3 tasks, matching the `safety_investigation` and `interfaces` blocks' load-bearing constraints (passive listeners only, no `preventDefault()`, reduced-motion feedback preserved, `body:has()` footer-hide scoping, exact sketch coefficients).

The only addition beyond the plan's literal text: logged the pre-existing, unrelated `tests/unit/dashboard-logic.test.ts` load failure to a new `deferred-items.md` in this task's phase directory (Rule 3's scope-boundary guidance: out-of-scope discoveries get logged, not fixed).

## Self-Check: PASSED

All 4 modified files (`src/components/HomeCarousel.astro`, `tests/e2e/homepage.spec.ts`, `tests/e2e/i18n.spec.ts`, `tests/e2e/legal.spec.ts`) confirmed present on disk with the expected changes. All 3 task commits (`8ed91f9`, `d1042c3`, `aec6048`) confirmed present in `git log`.
