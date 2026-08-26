---
phase: 21-homepage-scroll-experience
plan: 15
subsystem: ui
tags: [astro, vitest, playwright, scroll-snap, hysteresis, gap-closure]

# Dependency graph
requires:
  - phase: 21-homepage-scroll-experience (plan 21-11)
    provides: "the var(--deck-vh, 100svh) live-viewport-height convention that collapsed the old 0.98 threshold's tolerance band, making this plan's latch necessary"
  - phase: 21-homepage-scroll-experience (plan 21-12)
    provides: "the collapsed post-zoom dead zone and the first slide's snap point coinciding with the stage's release point, which this plan's mechanism-note consequence documents"
  - phase: 21-homepage-scroll-experience (plans 21-13, 21-14)
    provides: "the pinned intro redesign and header-reachability fix that close gaps 1 and 5, both folded into this plan's own consolidated real-device human-check"
provides:
  - "ARRIVAL_REVEAL_THRESHOLD (0.9), ARRIVAL_RELEASE_THRESHOLD (0.45) and computeArrivalRevealed() as pure, unit-tested exports of src/lib/home-carousel.ts — a two-level (Schmitt-trigger) latch"
  - "applyArrival() in HomeCarousel.astro deriving is-revealed via computeArrivalRevealed() instead of a symmetric ratio>=0.98 comparison"
  - "Assumption A9 (the firmer-snap question, reconsidered and declined) recorded in the scroll-snap-type CSS comment"
  - "A 'gallery-description reveal latch' e2e describe block (8 cases) proving the latch's hold/sweep/release/reveal-demand behaviour at deliberately un-snapped, mid-band resting positions"
  - "The consolidated round-2 real-device human-check covering all five 21-UAT.md gaps, preserved unexecuted in this plan file for workflow.human_verify_mode=end-of-phase harvesting"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A two-level (Schmitt-trigger) reveal/release latch, with the previous-frame state read from the DOM class list itself (no new per-frame state), as the fix for a scroll-driven toggle that flickered at its own boundary"

key-files:
  created: []
  modified:
    - src/lib/home-carousel.ts
    - tests/unit/home-carousel.test.ts
    - src/components/HomeCarousel.astro
    - tests/e2e/homepage-scroll-deck.spec.ts

key-decisions:
  - "The read order inside applyArrival() was reordered to ratio, then previous state (wasRevealed), then the latch call, then the toggle — the plan's own 'ratio, then previous state, then the toggle' phrasing meant wasRevealed had to be read BEFORE computing reached, not after (the pre-existing code read it after computing reached against the old symmetric constant)"
  - "computeArrivalRevealed's degenerate-ordering resolution (a releaseThreshold above revealThreshold collapses to revealThreshold for both comparisons) matches the plan's own stated reasoning verbatim: a stuck-revealed latch is a silent, permanent D-14/D-04 breach; collapsing to symmetric is merely the old behaviour back"
  - "The new e2e describe block settles both the per-frame driver's rAF loop and the description's 180ms opacity transition via a 'poll until two consecutive atomic reads agree' helper (mirroring getSlideDocumentOffsets()'s own idiom) before taking its real assertion values from the already-atomic snapshot, rather than racing a single evaluate against an in-flight transition"

patterns-established:
  - "waitForSlideStateSettled(): polling an atomic multi-field DOM read to stability before asserting on it, reusable anywhere a driver's per-frame write and a CSS transition both need to settle before a test's read is trustworthy"

requirements-completed: [HOME-14, HOME-15]

coverage:
  - id: D1
    description: "computeArrivalRevealed() is a pure, DOM-free, unit-tested two-level latch: reveals at >=0.9, releases below 0.45, both boundaries inclusive on the revealed side, non-finite ratio fails toward released, and a misordered threshold pair collapses to symmetric rather than a permanent latch"
    requirement: "HOME-14"
    verification:
      - kind: unit
        ref: "tests/unit/home-carousel.test.ts#computeArrivalRevealed (10 cases, including the hysteresis sweep and the constants' own ordering invariant)"
        status: pass
    human_judgment: false
  - id: D2
    description: "applyArrival() in HomeCarousel.astro derives is-revealed from computeArrivalRevealed() instead of the old symmetric ratio>=0.98 comparison; no CSS reveal values, snap mode, rAF loop count, or script-block count changed"
    requirement: "HOME-14"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#'arrival reveal and accent liveness' describe block (unedited, 10 cases, all pass)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#'gallery-description reveal latch' > baseline, the latch holds, the hold is not a fluke of one offset, the latch releases, the reveal side still demands arrival"
        status: pass
    human_judgment: false
  - id: D3
    description: "A revealed description survives a dip in its slide's coverage down to the release threshold (gap 2's actual fix) and still releases once genuinely more than half gone; a never-revealed slide at a comparable mid-band ratio stays hidden (D-14 unweakened)"
    requirement: "HOME-14"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#'gallery-description reveal latch' > the latch holds (gap 2's fix), the hold is not a fluke of one offset, the latch releases, the reveal side still demands arrival (D-14)"
        status: pass
    human_judgment: false
  - id: D4
    description: "D-09's live accent and HOME-16's rising-edge guard are unaffected by the latch: a mid-band wobble that never crosses the reveal threshold does not restart the accent or spuriously arrive a second slide"
    requirement: "HOME-14"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#'gallery-description reveal latch' > jitter does not restart the accent (D-09/HOME-16)"
        status: pass
      - kind: e2e
        ref: "playwright:homepage-accent-random.spec.ts --project=chromium (unedited, 6 cases, all pass)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Assumption A9 (the firmer-snap question) is reconsidered and explicitly declined, not silently skipped — recorded in the scroll-snap-type CSS comment with its full reasoning"
    requirement: "HOME-15"
    verification:
      - kind: other
        ref: "grep -c 'scroll-snap-type: y proximity' src/components/HomeCarousel.astro -> 1 (unchanged); the A9 comment is adjacent to that rule in the same commit"
        status: pass
    human_judgment: false
  - id: D6
    description: "The full e2e suite (both Playwright projects) and the full unit suite stay green with this plan's changes layered on top of every prior 21-* plan in the round-2 gap-closure set"
    verification:
      - kind: e2e
        ref: "playwright --project=chromium (461 passed), --project=webkit-mobile (5 passed, smoke-only project scope, pre-existing)"
        status: pass
      - kind: unit
        ref: "npm run test:coverage (349/349), npm run typecheck, npm run lint, npm run build, npm run test:artifact"
        status: pass
    human_judgment: false
  - id: D7
    description: "The visitor-facing truth for all five round-2 UAT gaps (text readable through real momentum, logo appears once, cover photo not doubled, no white bar top/bottom, hamburger reachable from load) — confirmed only by a real device"
    verification: []
    human_judgment: true
    rationale: "Per this plan's own Gap-closure gate: this is the ONLY human check across plans 21-11 through 21-15, consolidating all five round-2 gaps into one real-device pass. It is deliberately preserved unexecuted in this plan file's Task 3 <verify><human-check> block for workflow.human_verify_mode=end-of-phase harvesting — not run by this executor. Also asks the developer to confirm or correct assumptions A6 through A9 by name, re-confirming A1, A2, A3, A5 and noting A4 as superseded."

# Metrics
duration: 13min
completed: 2026-08-10
status: complete
---

# Phase 21 Plan 15: Gallery-Description Reveal Latch & Consolidated Real-Device Gate Summary

**Replaced `applyArrival()`'s symmetric `ratio >= 0.98` reveal/hide comparison with a two-level (Schmitt-trigger) latch — `ARRIVAL_REVEAL_THRESHOLD` (0.9) to reveal, `ARRIVAL_RELEASE_THRESHOLD` (0.45) to release — closing `21-UAT.md` round-2 gap 2's gallery-description half, and preserved the phase's one consolidated real-device human-check (all five round-2 gaps) unexecuted for end-of-phase harvesting.**

## Performance

- **Duration:** 13 min
- **Started:** 2026-08-10T09:24:32+02:00 (base commit)
- **Completed:** 2026-08-10T09:37:33+02:00 (Task 3 commit)
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Added `ARRIVAL_REVEAL_THRESHOLD` (0.9), `ARRIVAL_RELEASE_THRESHOLD` (0.45) and `computeArrivalRevealed()` as pure, DOM-free exports of `src/lib/home-carousel.ts`, immediately after `computeSlideVisibleRatio` and before `computeFocusOrigin` — 10 new unit cases (101 total in the file, 349 total in the suite), following the same TDD RED/GREEN split plans 21-07 and 21-13 used for their own pure additions
- Rewired `applyArrival()` in `HomeCarousel.astro` to derive `is-revealed` via the latch instead of the old single-threshold comparison, reordering the read so `wasRevealed` is captured BEFORE the reveal decision (not after, as the pre-existing code did against the old constant) — no other line in the function changed
- Rewrote the retired-constant comment to record the root cause (a single number used to show AND hide, evaluated fresh every frame), plan 21-11's tolerance-band collapse that made it worse, the R>0.5 invariant's algebra, and assumption A8
- Recorded the pre-completion latch consequence from plan 21-12's pull-up (first slide latches ~9% before zoom completion, invisible because the stage covers it) directly in the driver's comment
- Added one line to the D-13-locked `.home-slide__description` transition comment confirming the transition itself was never the defect
- Extended the existing Pitfall-6 scroll-snap-type comment with assumption A9 — the firmer-snap question explicitly reconsidered and declined, not silently skipped
- Added a new `gallery-description reveal latch` e2e describe block (8 cases) proving the latch's hold, sweep, release, and reveal-demand behaviour at deliberately un-snapped, mid-band resting positions — the same resting position a real iOS proximity scroll produces
- Confirmed the plan's own consolidated real-device `<verify><human-check>` block (Task 3, covering all five round-2 gaps) remains untouched and unexecuted in the plan file, for `workflow.human_verify_mode=end-of-phase` harvesting

## Task Commits

Each task was committed atomically (Task 1 used its own RED/GREEN TDD split per its `tdd="true"` frontmatter):

1. **Task 1a (RED): add failing tests for the gallery-description reveal latch** - `26ac6a4` (test)
2. **Task 1b (GREEN): implement the gallery-description reveal latch** - `c18a5f4` (feat)
3. **Task 2: latch the slide reveal in the driver, record the declined snap change** - `4df339b` (fix)
4. **Task 3: cover the latch in the browser** - `159ed8e` (test)

## Files Created/Modified

- `src/lib/home-carousel.ts` — added `ARRIVAL_REVEAL_THRESHOLD`, `ARRIVAL_RELEASE_THRESHOLD`, `computeArrivalRevealed()`, placed after `computeSlideVisibleRatio` and before `computeFocusOrigin`; `computeSlideVisibleRatio` itself untouched
- `tests/unit/home-carousel.test.ts` — added `describe('computeArrivalRevealed')` (10 cases: reveal boundary, mid-band-unrevealed, the hold, release boundary, non-finite input, the hysteresis sweep, the degenerate-ordering collapse, the constants' ordering invariant); imports updated
- `src/components/HomeCarousel.astro` — imported `computeArrivalRevealed`; retired the local `ARRIVAL_THRESHOLD` constant and rewrote its comment; reordered `applyArrival()`'s read (ratio, then `wasRevealed`, then the latch call, then the toggle); added a one-line comment to the D-13-locked transition rule; extended the Pitfall-6 snap comment with assumption A9
- `tests/e2e/homepage-scroll-deck.spec.ts` — added the `gallery-description reveal latch` describe block (8 cases) plus its own local `suppressSnap()`, `readSlideState()` and `waitForSlideStateSettled()` helpers; reused module-scope `getSlideDocumentOffsets()`

## Before/After Grep Counts

- `grep -c 'computeArrivalRevealed' src/lib/home-carousel.ts`: **3** (>= 2 required — the export and its docstring self-reference)
- `grep -c 'computeArrivalRevealed\|ARRIVAL_REVEAL_THRESHOLD\|ARRIVAL_RELEASE_THRESHOLD' tests/unit/home-carousel.test.ts`: **20** (>= 4 required)
- `grep -c 'computeArrivalRevealed' src/components/HomeCarousel.astro`: **5** (>= 2 required — the import and the call, plus 3 comment references)
- `grep -v '^\s*//' src/components/HomeCarousel.astro | grep -c 'ARRIVAL_THRESHOLD'`: **0** (the symmetric single-threshold constant is gone from live code)
- `grep -c 'transition: opacity 180ms ease, transform 180ms ease' src/components/HomeCarousel.astro`: **2 before → 2 after** (unchanged — D-13's locked values were not retuned, only their comment gained one line)
- `grep -c 'scroll-snap-type: y proximity' src/components/HomeCarousel.astro`: **1** (unchanged — the snap mode itself was not touched, only its comment extended with A9)
- `grep -v '^\s*//' src/components/HomeCarousel.astro | grep -c 'requestAnimationFrame(frame)'`: **2** (no second loop added)
- `grep -c 'warmNextSlide' src/components/HomeCarousel.astro`: **2** (declaration + one call site, unchanged)
- `grep -c '<script' src/components/HomeCarousel.astro`: **2 real `<script>` tags** (confirmed via `grep -n '<script'` excluding the 21 prose occurrences that quote `` `<script>` `` in comments — same established pattern documented in 21-11-SUMMARY.md)
- `grep -c 'getSlideDocumentOffsets' tests/e2e/homepage-scroll-deck.spec.ts`: **12 before → 19 after** (net +7 — 7 of the 8 new cases call it once each; the desktop case doesn't need a scroll target)

## E2e: Zero Existing Cases Edited (explicit confirmation)

Unlike plans 21-10, 21-12 and 21-14, this plan owns no rebase and no superseded assertion. Confirmed via `git diff --stat` against the pre-Task-3 commit: **230 insertions, 0 deletions** — a pure addition. No existing case anywhere in `tests/e2e/homepage-scroll-deck.spec.ts` was weakened, edited, or removed.

## Release-Path Regression Net (pre-existing cases checked)

Per the plan's own Task 2 acceptance criteria, two pre-existing cases in the `arrival reveal and accent liveness` describe block were specifically checked as the regression net against a latch that can never release:

- **"second slide: arrival and accent move to the second gallery, the first stops carrying the arrival class (D-05/D-09)"** — passed unmodified; proves the first slide's reveal genuinely releases once the second slide arrives.
- **"reversal: scrolling back to the top hides every description again"** — passed unmodified; proves a revealed description is not stuck on for the rest of the visit.

Both are exactly the cases a stuck-revealed latch (T-21-15-A) would fail.

## Every Mid-Band Case Verified Case-by-Case (snap suppression + band assertion)

Per the plan's own acceptance criteria, every mid-band case in the new describe block (`the latch holds`, `the hold is not a fluke of one offset`, `the latch releases`, `the reveal side still demands arrival`, `jitter does not restart the accent`) calls `suppressSnap()` before reading state AND asserts the measured ratio landed in the intended band (`toBeGreaterThanOrEqual`/`toBeLessThan` against `RELEASE_THRESHOLD`/`REVEAL_THRESHOLD`) before asserting any reveal state — confirmed by direct inspection of each test body, not merely by the suite passing green. Without the band assertion, these cases could pass vacuously at ratio 1 if snap suppression ever silently failed.

## Assumption Status Roll-Up (A1-A9)

- **A1** (reduced motion gets the intro as static content) — STANDS, carried through unchanged by this plan (this plan does not touch the intro).
- **A2** (dismissed by scrolling past, nothing else) — STANDS.
- **A3** (no scroll-snap point on the intro) — STANDS.
- **A4** (two stacked static intro sections) — SUPERSEDED by the developer's round-2 correction; delivered by 21-13.
- **A5** (ink background, white logomark, localised scroll cue) — STANDS.
- **A6** (`INTRO_REVEAL_DISTANCE` is 900px; shrink-in-place with the tagline on a sub-range) — pending real-device confirmation (21-13).
- **A7** (header visible and interactive during the intro, its own logomark suppressed) — pending real-device confirmation (21-14).
- **A8 (new, this plan)** — The gallery description reveal becomes a two-level latch: reveal at 0.9 of the slide's own visible ratio, release at 0.45. A Schmitt trigger, not a dwell-in-frames requirement, because a dwell would make revealing HARDER (the wrong direction — the reported failure includes a reveal that barely fires) and would make the reveal a function of elapsed time rather than scroll position (ruled out by D-04's reversibility and D-15's reduced-motion end state). Pending real-device confirmation via this plan's own Task 3 human-check.
- **A9 (new, this plan)** — `scroll-snap-type: y proximity` is deliberately left unchanged. `mandatory` is the only firmer mode; the page itself is the scroll container (D-08 rules out a nested scroller); under `mandatory` the intro track and the zoom track — both deliberately snap-point-free free-scrub regions — would become impossible to rest inside, destroying D-04's scrubbable, reversible zoom. The reveal was instead made robust to an unreliable stop. Explicitly reconsidered and declined, recorded in the CSS and put to the developer by name in Task 3's human-check.

## Decisions Made

- **Read-order correction inside `applyArrival()`.** The pre-existing code computed `reached` from the old symmetric constant BEFORE reading `wasRevealed` (which was only needed for the accent rising-edge guard). The latch needs `wasRevealed` as an INPUT to the reveal decision itself, so the read order was changed to: ratio → `wasRevealed` → `computeArrivalRevealed(ratio, wasRevealed)` → toggle. This is the literal meaning of the plan's "ratio, then previous state, then the toggle" — not a reordering for its own sake, but the mechanical requirement of feeding the previous state into the latch call.
- **`waitForSlideStateSettled()` as a new e2e idiom.** The description's 180ms opacity transition and the per-frame driver's own rAF-driven class write both need to settle before a snapshot read is trustworthy. Rather than adding an arbitrary `waitForTimeout`, this polls the atomic `readSlideState()` read until two consecutive samples agree — the same "poll until two consecutive reads agree" discipline `getSlideDocumentOffsets()` already established (module scope, plan 21-12) — then hands the already-stable, already-atomic snapshot to the test's real assertions.
- **Threshold constants duplicated as local literals in the e2e spec**, not imported from `src/lib/home-carousel.ts`, matching this file's own pre-existing convention (`getRevealDistance()`'s comment explains the same choice for `ZOOM_REVEAL_DISTANCE`) of re-deriving expected values from rendered geometry/attributes rather than importing the source module directly into a Playwright spec.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Copied `.env` into the worktree and ran `npm ci --prefix sanity`, and ran `npm ci` at the repo root**
- **Found during:** Pre-Task-1 environment setup, before any verification command
- **Issue:** Same pre-existing environment-setup gap documented in every prior 21-* plan's SUMMARY (21-11, 21-12, 21-13) — this worktree was created without the gitignored `.env` (Sanity project/dataset credentials), without `sanity/node_modules` installed, and without the root `node_modules` installed at all, unrelated to this plan's own file changes.
- **Fix:** Copied `.env` from the main checkout (gitignored, not committed), ran `npm ci --prefix sanity` and `npm ci` at the repo root — mirroring CLAUDE.md's own documented CI pipeline steps, deterministic lockfile installs, not a new/different package selection.
- **Files modified:** None tracked (`.env` is gitignored; both `node_modules` trees are gitignored)
- **Verification:** `npm run build`, `npm run test:coverage` (349/349 tests) both pass after the fix
- **Committed in:** N/A (no tracked files changed; environment setup only)

---

**Total deviations:** 1 auto-fixed (1 blocking, environment setup — no source changed)
**Impact on plan:** No scope creep; reproduces this repo's own documented, deterministic CI setup steps, exactly as every prior 21-* plan's worktree required.

## Issues Encountered

None beyond the environment-setup deviation above. All three tasks' verification commands passed on the first attempt after implementation, including the full e2e suite on both Playwright projects.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `21-UAT.md` round-2 gap 2's gallery-description half is closed mechanically: a revealed description survives a dip in its slide's coverage down to 0.45 of the visible ratio, and both items in the gap's `missing` list are answered (separate reveal/release thresholds via A8; the firmer-snap question reconsidered and declined via A9, not silently skipped).
- This is the FINAL plan in the round-2 gap-closure set (waves 9-13, plans 21-11 through 21-15). All five round-2 gaps now have complete automated (mechanism-level) coverage:
  - Gap 1 (logo appears twice) — 21-13/21-14
  - Gap 2 (text too fast to read) — intro half by 21-14, gallery half by this plan
  - Gap 3 (cover photo doubled) — 21-12
  - Gap 4 (white bar top/bottom) — 21-11
  - Gap 5 (hamburger unreachable at the start) — 21-14
- **This plan's own Task 3 `<verify><human-check>` block is the ONLY real-device human check across plans 21-11 through 21-15.** It is preserved unexecuted in `.planning/phases/21-homepage-scroll-experience/21-15-PLAN.md` for `workflow.human_verify_mode=end-of-phase` harvesting — the phase's end-of-phase verifier must run it on a real iPhone before the phase can be closed. It consolidates all five round-2 gaps into one pass and asks the developer to confirm or correct assumptions A6 through A9 by name, while re-confirming A1, A2, A3, A5 and noting A4 as superseded.
- No blockers for the phase's end-of-phase verification pass.

---
*Phase: 21-homepage-scroll-experience*
*Completed: 2026-08-10*

## Self-Check: PASSED

- FOUND: src/lib/home-carousel.ts
- FOUND: tests/unit/home-carousel.test.ts
- FOUND: src/components/HomeCarousel.astro
- FOUND: tests/e2e/homepage-scroll-deck.spec.ts
- FOUND: .planning/phases/21-homepage-scroll-experience/21-15-SUMMARY.md
- FOUND commit: 26ac6a4 (Task 1a RED)
- FOUND commit: c18a5f4 (Task 1b GREEN)
- FOUND commit: 4df339b (Task 2)
- FOUND commit: 159ed8e (Task 3)
