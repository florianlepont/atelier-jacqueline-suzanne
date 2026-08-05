---
phase: 21-homepage-scroll-experience
plan: 06
subsystem: ui
tags: [astro, playwright, intersection-observer, scroll-deck, accent-color]

requires:
  - phase: 21-homepage-scroll-experience (plan 04)
    provides: "The static .home-scroll-deck markup/CSS — the is-revealed class hook already declared on .home-slide__description, and each slide anchor's data-hero-color/data-hero-text-color attributes this plan's observer reads"
  - phase: 21-homepage-scroll-experience (plan 05)
    provides: "The deck's second, independent <script> block (setup()/matchMedia gate, clearInlineStyles()) this plan's observer attaches inside"

provides:
  - "An IntersectionObserver (threshold ~0.98) inside the deck script's existing setup() gate, toggling is-revealed on each slide in both scroll directions as it arrives/departs"
  - "The live --current-accent/--current-accent-text custom properties now track the arrived gallery's own hero colour on the rising edge of arrival, never at load — HOME-16's random starting accent stays intact until a slide genuinely settles"
  - "9 new Playwright cases in tests/e2e/homepage-scroll-deck.spec.ts closing out HOME-14/HOME-15's remaining automatable rows: before-arrival hidden state, accent-preserved-at-load, arrival reveal, accent tracking, second-slide handoff, reversal, tap-to-open, reduced-motion detachment, and desktop inert"
affects: []

tech-stack:
  added: []
  patterns:
    - "A rising-edge write guard (wasRevealed check before toggling the class) so a live, non-unobserved IntersectionObserver only writes shared state (the accent custom properties) once per arrival, not on every threshold crossing"
    - "A boolean flag (arrivalAccentWritten) gates whether clearInlineStyles() removes shared custom properties on detach — necessary whenever a detach branch runs unconditionally on initial load (as this driver's does on desktop) but the properties it might clear are also legitimately written by a DIFFERENT, unrelated script"

key-files:
  created: []
  modified:
    - src/components/HomeCarousel.astro
    - tests/e2e/homepage-scroll-deck.spec.ts
    - .planning/phases/21-homepage-scroll-experience/deferred-items.md

key-decisions:
  - "clearInlineStyles() only removes --current-accent/--current-accent-text when arrivalAccentWritten is true, rather than unconditionally per the plan's literal 'remove the two accent custom properties' phrasing — an unconditional removal would fire the very first time this driver's setup() runs on desktop (the detach branch runs unconditionally on initial load there), stripping the carousel's own render()/HOME-16 accent moments after it was set by the sibling script. The flag preserves the plan's actual intent (never leave a stale OBSERVER-written accent behind) without introducing this cross-script regression."
  - "Accent fallback tokens are the single default site tokens (var(--color-accent)/var(--color-on-accent)), matching the deck slide's own pre-computed --slide-accent/--slide-accent-text inline style fallback — not the carousel's index-cycling ACCENTS array, which lives in a different, independent <script> block's closure and has no equivalent concept for a live-observed slide."

requirements-completed: [HOME-14]

coverage:
  - id: D1
    description: "A gallery's description stays hidden until that gallery's slide is fully settled on screen (IntersectionObserver at ~0.98 threshold, never unobserved), then reveals with the site's existing 180ms transition; scrolling back up hides it again"
    requirement: "HOME-14"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#before arrival: no slide carries the arrival class, every description is hidden (D-13/D-14, success criterion 3) — pass"
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#arrival reveals: scrolling to the first slide reveals its description (success criterion 3) — pass"
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#reversal: scrolling back to the top hides every description again — pass"
    human_judgment: false
  - id: D2
    description: "The live accent tracks each gallery's own hero colour as its slide arrives (rising-edge write only), and the per-visit random starting accent (HOME-16, phase 20) is untouched until a slide genuinely settles"
    requirement: "HOME-14"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#phase-20 accent preserved: the live accent still resolves to a build-time hero colour before any arrival (HOME-16) — pass"
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#accent tracks the arrived gallery (D-09) — pass"
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#second slide: arrival and accent move to the second gallery, the first stops carrying the arrival class (D-05/D-09) — pass"
    human_judgment: false
  - id: D3
    description: "Tapping a slide opens that gallery's detail page (native anchor navigation, no synthesized open path)"
    requirement: "HOME-14"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#tap-to-open: clicking a slide navigates to that gallery's detail page (D-10) — pass"
    human_judgment: false
  - id: D4
    description: "None of the arrival observer or accent liveness attaches under reduced motion or at 768px and above; the reduced-motion case proves genuine detachment (accent does not change on scroll), not just CSS styling-away"
    requirement: "HOME-14"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#reduced motion: no arrival class is ever added, every description is permanently visible, and the accent does not change on scroll (D-15) — pass"
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#desktop inert: no slide carries the arrival class (success criterion 5) — pass"
    human_judgment: false
  - id: D5
    description: "Full e2e suite green on both Playwright projects (396 chromium, 5 webkit-mobile), typecheck/lint/build/test:artifact clean, confirming no regression to plans 21-01 through 21-05's work or the pre-existing desktop/tablet surface"
    requirement: "HOME-14"
    verification:
      - kind: e2e
        ref: "npx playwright test --project=chromium (396 tests) and --project=webkit-mobile (5 tests) — pass"
      - kind: other
        ref: "npm run typecheck && npm run lint && npm run build && npm run test:artifact — pass"
    human_judgment: false
  - id: D6
    description: "Real-device pass closing phase 21 (wordmark full-screen on load, cinematic zoom pace/anchor, reversible scroll, snap settle without skipping, header fade/reachability, per-slide description reveal + accent change, tap-to-open, footer reachable, tablet/desktop unchanged) — the mandatory manual verification carried by this plan's own Task 2 <verify><human-check> block"
    verification: []
    human_judgment: true
    rationale: "21-VALIDATION.md's Manual-Only Verifications table requires a REAL phone (not an emulated viewport) for scroll-feel, zoom pace/anchor, and scroll-snap settle behavior — Playwright's webkit-mobile project is desktop WebKit with an emulated viewport and cannot substitute (the same reasoning plans 21-04/21-05 already carried forward). This is the phase-level gate: workflow.human_verify_mode = end-of-phase harvests it from this task's own <verify><human-check> block, which is preserved unexecuted in 21-06-PLAN.md for that harvest."

duration: ~50min
completed: 2026-08-05
status: complete
---

# Phase 21 Plan 06: Arrival Observer & Live Accent Summary

**An IntersectionObserver (threshold ~0.98, never unobserved) inside the deck script's existing `setup()` gate reveals each gallery's description on arrival and hides it again on departure, writing `--current-accent`/`--current-accent-text` from the arriving slide's own hero-colour data attributes on the rising edge only — leaving HOME-16's per-visit random starting accent untouched until a slide genuinely settles.**

## Performance

- **Duration:** ~50 min
- **Tasks:** 2 completed
- **Files modified:** 2 (`src/components/HomeCarousel.astro`, `tests/e2e/homepage-scroll-deck.spec.ts`) + 1 tracking doc (`deferred-items.md`)

## Accomplishments

- `src/components/HomeCarousel.astro`'s second (deck) `<script>` block now resolves every slide via `data-role="deck-slide"`, and its existing `setup()`/`matchMedia` gate creates an `IntersectionObserver` (threshold array `[0, 0.98, 1]`) on attach, disconnecting and nulling it on detach — mirroring `GalleryGrid.astro`'s feature-detect/fallback shape but never `unobserve`-ing, since D-14's reveal is a live, two-directional state.
- `onArrival()` toggles `is-revealed` on each slide (both directions) and, only on the rising edge (just-became-arrived), writes the two accent custom properties from that slide's `data-hero-color`/`data-hero-text-color` attributes, falling back to the same site tokens (`var(--color-accent)`/`var(--color-on-accent)`) the deck slide's own inline `--slide-accent` fallback already uses.
- `clearInlineStyles()` resets every slide's `is-revealed` class on detach and — guarded by a new `arrivalAccentWritten` flag, so it never fires on desktop's very first (always-detach) `setup()` call and clobbers the carousel's own accent — removes the two accent custom properties only if this observer itself had written them.
- 9 new Playwright cases appended to `tests/e2e/homepage-scroll-deck.spec.ts`, deriving scroll targets from the zoom track's rendered height + viewport height (never hardcoded pixels): before-arrival hidden state, HOME-16 accent preserved at load, arrival reveal, accent tracking on arrival, second-slide arrival/accent handoff (skipped under 2 galleries), reversal, tap-to-open navigation, reduced-motion detachment (proves the accent genuinely does not change on scroll, not just styled away), and desktop inert.
- Full e2e suite green on both Playwright projects: 396 tests on `chromium`, 5 on `webkit-mobile`. `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run test:artifact` all pass clean.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add the arrival observer and live accent update (D-09, D-13, D-14, D-15)** - `e26e16a` (feat)
2. **Task 2: Cover arrival reveal, accent liveness and tap-to-open** - `738e0db` (test)

**Plan metadata:** `726978f` (docs: log a pre-existing, unrelated test flake as deferred — see Deviations)

## Files Created/Modified

- `src/components/HomeCarousel.astro` (Task 1) — slide resolution, `ARRIVAL_THRESHOLD`/`arrivalObserver`/`arrivalAccentWritten` state, `onArrival()`, observer create/observe on attach and disconnect/null on detach, `is-revealed`/accent cleanup in `clearInlineStyles()`.
- `tests/e2e/homepage-scroll-deck.spec.ts` (Task 2) — new describe block `arrival reveal and accent liveness (HOME-14, D-09, D-10, D-13, D-14, D-15)` with 9 cases; no existing case modified.
- `.planning/phases/21-homepage-scroll-experience/deferred-items.md` — logged a pre-existing, unrelated `edition.spec.ts` test flake discovered during Task 1's full-suite verification run (see Deviations below).

## Decisions Made

- **Rising-edge-only accent write.** `onArrival()` only writes the accent custom properties when an entry transitions from not-revealed to revealed (`reached && !wasRevealed`), not on every `IntersectionObserver` callback (which fires at every threshold crossing: 0, 0.98, 1, and again on the way back down). This keeps the write count minimal and matches the plan's "write no accent at load" ordering constraint, since at scroll position 0 no slide can reach 0.98 in the first place.
- **`arrivalAccentWritten` flag, not an unconditional removal in `clearInlineStyles()`.** See key-decisions in frontmatter — required because the deck driver's `setup()` detach branch runs unconditionally on its very first call on desktop (where `mobile.matches` is false from page load), and an unconditional `removeProperty('--current-accent', ...)` there would strip the value the carousel's own, entirely separate `<script>` block had just set moments earlier via `render()`/HOME-16's random-start override. Verified this reasoning empirically: `homepage-accent-random.spec.ts`'s existing 6 tests (all desktop/phone accent assertions) all still pass unmodified.
- **Accent fallback is the single default site token pair, not the carousel's index-cycling `ACCENTS` array.** The carousel's `ACCENTS` array is a local `const` inside the FIRST script block's own closure and has no equivalent for a live-observed slide in the SECOND, independent script block; the deck slide's own build-time inline style already computed the same fallback (`gallery.heroColor ?? 'var(--color-accent)'`), so the observer mirrors that exact fallback rather than reimplementing per-index cycling that has no meaning here.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Copied `.env` into the worktree so the build could resolve Sanity content**
- **Found during:** Task 1's own required verification (`npm run build`)
- **Issue:** `npm run build` failed with "Missing SANITY_PROJECT_ID or SANITY_DATASET env vars" — this worktree, created fresh for this agent, never received the gitignored `.env` file the main checkout has (git worktrees only share tracked files). Same gap plan 21-05 hit and fixed the same way.
- **Fix:** Copied `.env` from the main checkout (`/Users/florian/Projects/ajs-website/.env`) into this worktree. No code change, no `.env` content modified, nothing committed (still gitignored).
- **Verification:** `npm run build` completes and generates all 29 pages.

**2. [Rule 1 - Bug] Own-introduced comment accidentally contained the literal string "unobserve"**
- **Found during:** Task 1's own acceptance-criteria check (`grep -c "unobserve" src/components/HomeCarousel.astro` must return 0)
- **Issue:** A first-draft explanatory comment read "Never unobserve: D-14's reveal is a live, two-directional state...", which itself matched the acceptance criterion's own grep for the substring "unobserve" (intended to catch an actual `.unobserve(...)` call, not a comment mentioning the word).
- **Fix:** Reworded the comment to convey the same explanation ("The observer keeps watching this slide forever...") without using the literal word.
- **Files modified:** `src/components/HomeCarousel.astro`
- **Verification:** `grep -c "unobserve" src/components/HomeCarousel.astro` now returns 0.
- **Committed in:** `e26e16a` (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 Rule 3 environment-setup gap, not a package install; 1 Rule 1 self-inflicted comment wording fix). Both necessary for Task 1's own stated acceptance criteria; no scope creep.

## Out-of-Scope Item Logged (not fixed, per Scope Boundary)

`tests/e2e/edition.spec.ts:396` ("galleries unaffected: the gallery masonry path renders identically now that éditions share it") failed once during Task 1's full-`chromium`-suite verification run with a `NaN` ratio assertion — a gallery masonry-grid image-load timing issue, entirely unrelated to this plan's file (`HomeCarousel.astro`, homepage-only). Confirmed pre-existing and independent of this plan's changes by reverting `HomeCarousel.astro` to its pre-plan committed state and re-running the same test in isolation (failed identically); it then passed on every subsequent full-suite run in this session without any code change, consistent with a flaky image-load race rather than a deterministic regression. Logged to `deferred-items.md` rather than fixed, per the executor's scope boundary (a different route/component this plan never touches).

## Issues Encountered

None beyond the deviations and the out-of-scope item documented above.

## User Setup Required

None - no external service configuration required. (The `.env` copy above is a same-repo, already-existing local dev credential, not a new external service.)

## Manual Verification Still Owed (phase-level gate)

Task 2's own `<verify><human-check>` block in `21-06-PLAN.md` carries the phase-level, real-device manual verification required by `21-VALIDATION.md`'s Manual-Only Verifications table before `/gsd-verify-work`. That block is preserved unexecuted in the plan file — it is not something this executor runs itself; `workflow.human_verify_mode = end-of-phase` harvests it from there. See coverage item D6 above.

## Next Phase Readiness

- This is the last plan of Phase 21. Every automatable requirement row across HOME-14 and HOME-15 now has a passing e2e test (structural: plan 21-04; scroll-driven zoom: plan 21-05; arrival reveal + accent liveness + tap-to-open: this plan).
- Phase success criterion 3 ("each gallery's description text is hidden until that gallery arrives on screen during scroll, then reveals via the sketched-and-approved transition") is fully true and asserted.
- D-09, D-10, D-13, and D-14 are satisfied; D-15's detachment is proven by an assertion that scrolling changes nothing (neither the arrival class nor the accent) under reduced motion.
- HOME-14 and HOME-15 are both fully implemented and automatically verified across the phase; HOME-16 (phase 20) is provably intact (its own 6-test spec still passes unmodified, plus this plan's own dedicated "phase-20 accent preserved" case).
- The full e2e suite is green on both Playwright projects (396 `chromium`, 5 `webkit-mobile`).
- **Not yet closed:** the manual, real-device pass (Task 2's `<verify><human-check>` block) is REQUIRED before `/gsd-verify-work` per `21-VALIDATION.md` — this is the phase's own explicit closing gate, not a blocker for this plan's own completion.
- No blockers for phase close beyond that owed manual pass.

---
*Phase: 21-homepage-scroll-experience*
*Completed: 2026-08-05*

## Self-Check: PASSED

- FOUND: src/components/HomeCarousel.astro
- FOUND: tests/e2e/homepage-scroll-deck.spec.ts
- FOUND: .planning/phases/21-homepage-scroll-experience/21-06-SUMMARY.md
- FOUND: all 3 commits (e26e16a, 738e0db, 726978f)
