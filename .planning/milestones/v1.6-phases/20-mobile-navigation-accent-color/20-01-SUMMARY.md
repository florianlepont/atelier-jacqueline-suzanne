---
phase: 20-mobile-navigation-accent-color
plan: 01
subsystem: ui
tags: [astro, playwright, vitest, home-carousel, accent-color, home-16]

# Dependency graph
requires:
  - phase: 20-mobile-navigation-accent-color
    provides: "20-02's mobile-nav.spec.ts regression net (no direct code dependency, but proved the pre-existing suite green first per this phase's regression-net-first pattern)"
provides:
  - "pickRandomGalleryIndex(count, randomSource?) — pure, DOM-free helper in src/lib/home-carousel.ts, exported alongside detectSwipeDirection/computeHoverZone"
  - "HomeCarousel.astro inline <script>: a one-time random-per-visit override of --current-accent/--current-accent-text/accentPanel.style.color, layered after the existing initial render() call, leaving carouselIndex/heroImg/titleEl/indexLabel/progressDashes untouched"
  - "tests/e2e/homepage-accent-random.spec.ts — deterministic e2e proof of palette membership, gallery-0-leads invariant, per-gallery-follows-position behavior post-advance, and transition-suppression release"
affects: [21-scroll-view]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Injectable-randomness pure helper (randomSource? param) mirroring detectSwipeDirection/computeHoverZone — keeps Math.random() out of src/ entirely except at the one call site, so e2e specs can stub Math.random via addInitScript for deterministic assertions"
    - ".is-accent-init transient class + double-rAF release: suppresses a CSS transition for exactly one synthetic override without touching the transition's normal 300ms duration for real (user-driven) carousel swaps"

key-files:
  created:
    - tests/e2e/homepage-accent-random.spec.ts
  modified:
    - src/lib/home-carousel.ts
    - src/components/HomeCarousel.astro
    - tests/unit/home-carousel.test.ts

key-decisions:
  - "Deliberately excluded --wordmark-photo-filter from the random override: that property is a brightness/contrast heuristic tied to gallery 0's own photo (still the one shown, since carouselIndex is untouched) and gallery 0's own heroTextColor — not to the randomly-picked panel accent. Including it broke the pre-existing homepage-wordmark-peek.spec.ts:943 assertion; caught and corrected before commit."
  - "pickRandomGalleryIndex guards count<=0 to 0 and floors randomSource()*count, matching the existing helper conventions in the same file rather than introducing a new randomness pattern."

patterns-established:
  - "For a one-time client-side override layered on top of an existing render() call, suppress the affected CSS transition with a transient class removed via double requestAnimationFrame (not single rAF, which can still land before paint) rather than temporarily disabling the transition via inline style."

requirements-completed: [HOME-16]

coverage:
  - id: D1
    description: "pickRandomGalleryIndex(count, randomSource?) pure helper: returns 0 for count<=0, always 0 for count=1, floor(r*count) for an injected randomSource"
    requirement: "HOME-16"
    verification:
      - kind: unit
        ref: "tests/unit/home-carousel.test.ts#describe('pickRandomGalleryIndex') — 8 tests"
        status: pass
    human_judgment: false
  - id: D2
    description: "Homepage's initial --current-accent is a randomly-picked gallery's heroColor (one of the five existing HERO_COLORS values) on every visit, without changing which gallery's photo/title/index-label/progress-dashes show first, and without touching the per-gallery-follows-carousel-position behavior after the first advance"
    requirement: "HOME-16"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage-accent-random.spec.ts (6 tests, chromium project) — run 3 times consecutively, 3/3 green, no flake"
        status: pass
    human_judgment: false
  - id: D3
    description: "The random override does not produce a visible animated colour sweep on load: .home carries is-accent-init only for the initial frames, and the accent panel's normal 300ms background-color transition is restored afterward for real carousel swaps"
    requirement: "HOME-16"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage-accent-random.spec.ts — 'the initial-paint transition suppression is released'"
        status: pass
    human_judgment: false

# Metrics
duration: ~3h (including two stalled attempts and recovery — see Issues Encountered)
completed: 2026-08-04
status: complete
---

# Phase 20 Plan 01: Homepage Random Starting Accent Summary

**Homepage now picks a random gallery's `heroColor` as the STARTING accent on every page load (HOME-16), via a pure `pickRandomGalleryIndex()` helper and a one-time client-side override layered after the existing initial render — gallery 0 still leads visually, and per-gallery accent tracking after the first advance is untouched.**

## Performance

- **Duration:** ~3h wall-clock across two stalled attempts and a recovery (see Issues Encountered) — actual authoring/verification work was well under an hour
- **Started:** 2026-08-04T07:00:26+02:00
- **Completed:** 2026-08-04T09:57:11+02:00
- **Tasks:** 3
- **Files modified:** 4 (1 created, 3 modified)

## Accomplishments

- New `pickRandomGalleryIndex(count, randomSource?)` in `src/lib/home-carousel.ts`, pure and DOM-free, mirroring the file's existing `detectSwipeDirection`/`computeHoverZone` convention; 8 unit tests covering both boundaries, `count=0`/`count=1`, and the default `Math.random` resolving at call time.
- `HomeCarousel.astro`'s inline `<script>` now overrides `--current-accent`, `--current-accent-text`, and `accentPanel.style.color` from a randomly-picked gallery's `heroColor`/`heroTextColor` immediately after the existing `render()`/`syncAutoplayControl()`/`startAutoAdvance()` sequence — `carouselIndex`, `heroImg`, `titleEl`, `indexLabel`, and `progressDashes` are untouched, so gallery 0's photo/title still lead.
- A transient `.is-accent-init` class suppresses the accent panel's 300ms `background-color` transition for this one-time override only, released via a double `requestAnimationFrame` once the new colour has actually painted.
- New `tests/e2e/homepage-accent-random.spec.ts` (6 tests): forced-lowest/highest `Math.random` stubs proving the palette endpoints, an unstubbed 6-reload loop proving palette membership with no flake, a D-05 guard proving gallery 0 still leads, a post-advance assertion proving per-gallery accent tracking survives the override, and a transition-suppression-release check. Zero hardcoded palette hex — every expectation reads from the page's own `data-hero-color` attributes. Confirmed 3/3 passes with no flake per the plan's acceptance criteria.

## Task Commits

1. **Task 1: Pure `pickRandomGalleryIndex` helper with unit tests** - `6601df5` (feat)
2. **Task 2: Wire the random starting-accent override into `HomeCarousel.astro`** - `4834730` (feat)
3. **Task 3: Deterministic e2e spec for the random starting accent** - `f93569a` (test)

**Plan metadata:** pending (this SUMMARY's own commit)

## Files Created/Modified

- `src/lib/home-carousel.ts` - Added `pickRandomGalleryIndex(count, randomSource?)`
- `tests/unit/home-carousel.test.ts` - Added `describe('pickRandomGalleryIndex')` block (8 tests)
- `src/components/HomeCarousel.astro` - Imported the helper; added the one-time accent-only override + `.is-accent-init` transition-suppression class and its double-rAF release; updated the adjacent code comment the change invalidated
- `tests/e2e/homepage-accent-random.spec.ts` - New deterministic e2e spec (6 tests)

## Decisions Made

- Excluded `--wordmark-photo-filter` from the random override — see `key-decisions` above. This property tracks gallery 0's own photo/text-color (still the one shown), not the randomly-picked panel accent; including it broke a pre-existing deterministic assertion in `homepage-wordmark-peek.spec.ts`.
- Verified against a temporary, untracked, never-committed `playwright.local.config.ts` bound to port 4999 (same workaround independently confirmed by the sibling 20-02 executor in this wave) rather than the project's default `localhost:4321`, which a concurrent session's `astro dev` process had already occupied. Deleted before the final commit; confirmed absent via `git status --porcelain`.

## Deviations from Plan

None in the shipped code — plan executed exactly as written. The recovery process below (Issues Encountered) involved the orchestrator directly running the final build/verification/commit steps after two subagent stalls, which is a process deviation, not a code deviation.

## Issues Encountered

- **Two subagent stalls, same underlying cause.** The executor agent for this plan stalled twice (killed by the harness watchdog after 600s of no progress), both times while running Playwright against the project's shared default `localhost:4321` — a concurrent session's `astro dev` process on the main checkout was silently reused by `reuseExistingServer`, serving stale/corrupted content and apparently causing the test run to hang rather than fail fast. Both stalls happened despite this being flagged as a known pitfall (the sibling 20-02 plan in the same wave had already hit and solved it).
  - **First stall:** occurred mid-Task-3, before any workaround was applied. The orchestrator discarded that worktree entirely (no salvageable commits existed for the affected task) and redispatched a fresh executor with the known port-4999-local-config workaround called out explicitly in the retry prompt.
  - **Second stall:** occurred deeper into Task 3, *after* the executor had already applied the port-4999 workaround, gotten "all 6 pass" once, and begun the plan's required "run 3 times in a row to confirm no flake" acceptance check — it stalled partway through that repeat-run loop. By this point Tasks 1 and 2 were already committed cleanly (`6601df5`, `4834730`) and the Task 3 spec file was drafted and had already passed once, so discarding again would have thrown away verified-good work to re-hit the same machine-load-driven wall. The orchestrator instead inspected the worktree directly (confirmed correct branch, correct base, spec content already meeting all acceptance-criteria greps), then ran the build and the 3x flake-check itself with bounded per-command timeouts and explicit port-4999 liveness checks between runs, got 3/3 clean passes, deleted the temporary local Playwright config, and committed Task 3 (`f93569a`) and this SUMMARY.
- Root cause of the stalls is believed to be general resource contention from this machine running many concurrent Claude Code sessions/worktrees simultaneously (multiple `astro dev`/`preview` processes, a `sanity dev` process, and several MCP helper processes were observed running concurrently), not a defect in the test or the implementation — consistent with this repo's established norm of concurrent sessions.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `pickRandomGalleryIndex` and the random-accent override are in place and covered by both unit and e2e tests; Phase 21's scroll view can reuse the same mechanism.
- No blockers for Wave 2 (plan 20-03, mobile nav structure) — this plan's files (`home-carousel.ts`, `HomeCarousel.astro`, plus test files) do not overlap with 20-03's `SiteHeader.astro`/`MobileNavPanel.astro` scope, aside from both touching `HomeCarousel.astro` in different, non-conflicting regions (this plan's script-level accent override vs. 20-03's homepage-only mobile-nav rendering hook).
- Future sessions in this repo should verify which process holds `localhost:4321` before trusting default `npm run test:e2e` output whenever multiple concurrent sessions are active — this is the second plan in this same phase to hit that exact issue.

## Self-Check: PASSED

- FOUND: `src/lib/home-carousel.ts` (pickRandomGalleryIndex export)
- FOUND: `tests/unit/home-carousel.test.ts` (describe('pickRandomGalleryIndex'))
- FOUND: `tests/e2e/homepage-accent-random.spec.ts`
- FOUND: `.planning/phases/20-mobile-navigation-accent-color/20-01-SUMMARY.md`
- FOUND: commit `6601df5`
- FOUND: commit `4834730`
- FOUND: commit `f93569a`

---
*Phase: 20-mobile-navigation-accent-color*
*Completed: 2026-08-04*
