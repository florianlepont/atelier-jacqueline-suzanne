---
phase: 21-homepage-scroll-experience
plan: 13
subsystem: ui
tags: [astro, requestAnimationFrame, css-scroll-scrub, playwright, vitest, gap-closure]

# Dependency graph
requires:
  - phase: 21-homepage-scroll-experience (plan 21-07)
    provides: the rAF continuous-scrub driver pattern (frame()/computeProgress()/applyProgress() short-circuit) this plan's intro scrub mirrors
  - phase: 21-homepage-scroll-experience (plan 21-11)
    provides: the var(--deck-vh, 100svh) live-viewport-height convention this plan's intro track/stage heights reuse
  - phase: 21-homepage-scroll-experience (plan 21-12)
    provides: the zoom track/stage geometry this plan's intro track sits immediately before, undisturbed
provides:
  - "INTRO_REVEAL_DISTANCE, computeIntroProgress(), computeIntroScrubState() as pure, unit-tested exports of src/lib/home-carousel.ts"
  - "One .home-scroll-deck__intro-track containing one sticky .home-scroll-deck__intro-stage, holding exactly one logomark image, the tagline, and the cue as siblings"
  - "applyIntroScrub(), a new per-frame pass in HomeCarousel.astro's deck script driving the logomark/tagline/cue from live intro-track geometry"
  - "The intro removed from the binary-threshold arrival pass entirely — applyArrival()/clearInlineStyles() iterate real slides again"
affects: [21-14, 21-15]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A second pinned scroll-scrub region (sticky stage inside a tall track) sharing the same rAF loop and the same var(--deck-vh, 100svh) convention as an existing scrub region, with its own independent progress cache and change-detection sentinel"
    - "Tagline reveal as a sub-range of one shared progress value (DetailHero.astro's onProgress(t) sub-range idiom) rather than a second class-toggled mechanism"

key-files:
  created: []
  modified:
    - src/lib/home-carousel.ts
    - tests/unit/home-carousel.test.ts
    - src/components/HomeCarousel.astro

key-decisions:
  - "Extracted computeTrackProgress() as a shared unexported helper so computeZoomProgress and computeIntroProgress delegate to ONE formula instead of two hand-copied ones — computeZoomProgress's own describe block is the regression net and stayed green unmodified throughout"
  - "computeIntroScrubState's tagline opacity/offset are a sub-range of the SAME intro-progress value the logo's shrink uses (clamp01((ct-0.25)/0.35)), not a second mechanism — mirrors DetailHero.astro's onProgress(t) idiom, and is what makes gap 2's trailing 40% dwell a structural guarantee rather than tuned timing"
  - "applyIntroActive() moved from reading the ZOOM track's top edge (a same-measurement inference, plan 21-10) to reading the INTRO track's own bottom edge (a direct measurement) — functionally equivalent by construction (intro track bottom IS zoom track top, adjacent siblings) but now correct by direct measurement rather than inference"
  - "The intro-active flag is updated on EVERY frame inside applyIntroScrub(), before the progress short-circuit — progress pins at exactly 1 for the whole sticky release while the flag's own condition keeps changing across it, so a progress-keyed short-circuit would freeze the attribute mid-scrub"

patterns-established:
  - "When a component already has one pinned-scrub driver, prepending a second pinned-scrub region ahead of it is safe ONLY if both re-derive their state from live getBoundingClientRect() reads inside the same rAF frame, in document order, with no scroll listener or observer in either path"

requirements-completed: [HOME-15]

coverage:
  - id: D1
    description: "INTRO_REVEAL_DISTANCE, computeIntroProgress(), and computeIntroScrubState() are pure, DOM-free, unit-tested exports covering exact-literal endpoints, the sub-range tagline dwell, and monotonicity sweeps"
    requirement: "HOME-15"
    verification:
      - kind: unit
        ref: "tests/unit/home-carousel.test.ts#computeIntroProgress"
        status: pass
      - kind: unit
        ref: "tests/unit/home-carousel.test.ts#computeIntroScrubState"
        status: pass
    human_judgment: false
  - id: D2
    description: "Exactly one logomark element/image exists in the built homepage, in both locales — the pinned intro track/stage replaces plan 21-10's two stacked static sections"
    requirement: "HOME-15"
    verification:
      - kind: other
        ref: "grep -o 'home-scroll-deck__intro-logo' dist/index.html | wc -l -> 1; dist/en/index.html -> 1"
        status: pass
      - kind: e2e
        ref: "playwright:critical.smoke.spec.ts --project=chromium,webkit-mobile"
        status: pass
    human_judgment: false
  - id: D3
    description: "The intro scrub (logo shrink, tagline sub-range reveal, cue fade) is driven from the existing per-frame loop with no scroll listener, no observer, and a 1:1 write/removal contract in clearInlineStyles()"
    requirement: "HOME-15"
    verification:
      - kind: e2e
        ref: "playwright:homepage-accent-random.spec.ts, mobile-nav.spec.ts, accessibility.spec.ts, critical.smoke.spec.ts --project=chromium"
        status: pass
      - kind: e2e
        ref: "playwright:critical.smoke.spec.ts --project=webkit-mobile"
        status: pass
      - kind: unit
        ref: "npm run test:coverage (339/339 unit tests, thresholds met)"
        status: pass
    human_judgment: false
  - id: D4
    description: "homepage-scroll-deck.spec.ts's deliberate red window stays confined to the 'pre-zoom intro beats' describe block (which still asserts the retired two-beat structure) — zero failures anywhere else"
    requirement: "HOME-15"
    verification:
      - kind: e2e
        ref: "playwright:homepage-scroll-deck.spec.ts --project=chromium (3 failed + 3 skipped, all inside 'pre-zoom intro beats'; 69 passed elsewhere)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The visitor-facing truth (the logo appears once and shrinks to reveal the text, confirmed on a real phone) — this plan lands the mechanism only"
    verification: []
    human_judgment: true
    rationale: "Per this plan's own Gap-closure gate: gap 1's mechanism lands here, its automated coverage completes in plan 21-14 (rebasing the deliberately-red describe block), and its visitor-facing truth is confirmed only by the consolidated real-device check in plan 21-15."

# Metrics
duration: 17min
completed: 2026-08-09
status: complete
---

# Phase 21 Plan 13: Pinned Intro Redesign (Gap 1 Mechanism) Summary

**Replaced the homepage deck's two stacked, ordinary-flow intro sections (each rendering its own logomark) with one pinned, scroll-scrubbed intro track/stage holding exactly one logomark that shrinks continuously as the tagline arrives beneath it — closing `21-UAT.md` round-2 gap 1's mechanism and structurally closing gap 2's intro half.**

## Performance

- **Duration:** 17 min
- **Started:** 2026-08-09T11:44:36Z
- **Completed:** 2026-08-09T12:01:33Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Extracted `computeTrackProgress()` as a shared unexported helper, refactored `computeZoomProgress` to delegate to it, and added `INTRO_REVEAL_DISTANCE` (900px, assumption A6), `computeIntroProgress()`, and `computeIntroScrubState()` as new pure, DOM-free, unit-tested exports of `src/lib/home-carousel.ts` — 21 new unit test cases (91 total in the file, 339 total in the suite), all green
- Replaced plan 21-10's two stacked intro sections with one `.home-scroll-deck__intro-track` (`data-role="intro-track"`) containing one sticky `.home-scroll-deck__intro-stage` (`data-role="intro-stage"`), holding exactly one logomark image, the tagline (rendered only when non-empty), and the cue as siblings — confirmed as a build-artifact fact (`grep -o 'home-scroll-deck__intro-logo' dist/index.html | wc -l` → 1, same for `dist/en/index.html`)
- Rewrote the intro CSS in place: track/stage heights both resolve from `var(--deck-vh, 100svh)` (plan 21-11's convention), the logomark and tagline rules carry no `transform`/`transition` (the driver writes both every frame), the cue moved to the bottom of row 3 so it never competes with the tagline sharing that cell, and the retired container rule plus the `is-revealed`-keyed tagline rule were deleted outright
- Added `applyIntroScrub()`, a new per-frame pass called between the viewport-height sync and the zoom's own `applyProgress(computeProgress())` in `frame()` — one `getBoundingClientRect()` of the intro track per frame, both edges used (top feeds `computeIntroProgress`, bottom feeds a relocated `applyIntroActive()`), short-circuited against its own progress cache
- Retired the intro from the arrival pass entirely: deleted the `introSections` lookup and the combined `arrivalTargets` array; `applyArrival()` and `clearInlineStyles()` iterate real `slides` again
- Completed the 1:1 write/removal contract in `clearInlineStyles()` for every new inline write (see table below)

## Task Commits

Each task was committed atomically (Task 1 used its own RED/GREEN TDD split per its `tdd="true"` frontmatter):

1. **Task 1a (RED): add failing tests for intro scrub math** - `9e79187` (test)
2. **Task 1b (GREEN): implement intro scrub math** - `0d708b0` (feat)
3. **Task 2: replace two static intro beats with one pinned, scrubbed intro block (markup + CSS)** - `4c7c8bf` (feat)
4. **Task 3: drive the intro scrub from the existing per-frame loop, retire it from arrival** - `262cc40` (feat)

## Files Created/Modified

- `src/lib/home-carousel.ts` — added `computeTrackProgress()` (shared helper, extracted from `computeZoomProgress`), `INTRO_REVEAL_DISTANCE`, `computeIntroProgress()`, `computeIntroScrubState()` and its `IntroScrubState` interface, placed after `computeWordmarkZoomState` and before `computeSlideVisibleRatio`
- `tests/unit/home-carousel.test.ts` — added `describe('computeIntroProgress')` and `describe('computeIntroScrubState')` (21 new cases), imports updated
- `src/components/HomeCarousel.astro` — frontmatter import of `INTRO_REVEAL_DISTANCE`; markup replaced (two intro sections → one track/stage pair); CSS rewritten (track/stage/logo/body/cue rules, reduced-motion comment updated); deck script: new intro element lookups, `applyIntroScrub()`, relocated `applyIntroActive()`, `computeProgress()` comment rewrite, `applyArrival()`/`clearInlineStyles()` rebased onto `slides`, no-rAF fallback fixed

## A1-A6 Assumption Status (this plan's own mapping)

- **A1 (reduced motion gets the intro as static content) — STANDS.** The driver never attaches under that query; only the end state's contents changed (one logomark at rest size, tagline already visible, cue not drifting). Reduced-motion CSS comment rewritten to state this explicitly.
- **A2 (dismissed by scrolling past, nothing else) — STANDS.** A scroll-scrubbed pin is *more* purely a function of scroll position than two static sections were.
- **A3 (no scroll-snap point on the intro) — STANDS, now structurally motivated.** No `scroll-snap-align`/`scroll-snap-stop` added to the track or stage; the intro is a free-scrub region of the same kind `21-RESEARCH.md` Pitfall 6 protects.
- **A4 (two stacked static sections, no new pinned machinery) — SUPERSEDED by developer round-2 correction.** This plan is that correction; no part of A4's implementation was preserved.
- **A5 (ink background, white logomark, localised scroll cue with a gentle drift) — STANDS.** Every visual token carried over unchanged; only the layout container and reveal mechanism changed.
- **A6 (new, this plan) — `INTRO_REVEAL_DISTANCE` is 900px, a shrink-in-place with the tagline arriving over a sub-range of the same progress.** Not yet confirmed on a real device — deferred to plan 21-15's consolidated check per this plan's own Gap-closure gate.

## Before/After Grep Counts (Task 2 acceptance criteria)

- `grep -c 'var(--deck-vh, 100svh)' src/components/HomeCarousel.astro`: **11 before (per 21-12-SUMMARY.md) → 12 after** (net +1: the retired container rule carried one, the new track and stage carry one each, for a net of +1 as the plan's own acceptance criterion specifies — confirmed by re-wording one prose comment to avoid an accidental extra literal match)
- `grep -c 'data-role="intro-track"'` / `'data-role="intro-stage"'`: **1 / 1**
- `grep -c 'data-role="deck-intro"'`: **1 after Task 2** (the pre-existing script lookup line hadn't been touched yet — Task 2's own scope was markup+CSS only, "no script in this task" per the plan's action item 14) → **0 after Task 3** (the stale `introSections` lookup was deleted as specified), confirming the criterion's intended end state was reached, just one task later than the criterion's literal placement under Task 2.
- `grep -c 'data-intro-beat'`: **0**
- `grep -c 'computeIntroProgress\|computeIntroScrubState'` in `HomeCarousel.astro`: **7** (import + 3 call sites + comment references)

## `homepage-scroll-deck.spec.ts` Cases Left Red for Plan 21-14

Confirmed identical at both the Task 2 and Task 3 verification boundaries — 3 failures + 3 skips, all and only inside the `pre-zoom intro beats (HOME-15, 21-UAT.md gap 1, assumptions A1-A5)` describe block; 69 other cases in the same file all pass:

**Failed (timeout/element-not-found against the retired `[data-role="deck-intro"][data-intro-beat="N"]` locators):**
1. `beat 1 on first load: full-viewport, logomark and cue visible, wordmark present but off-screen below (A4/A5)`
2. `the intro beats carry no scroll-snap point, unlike a slide (assumption A3, 21-RESEARCH.md Pitfall 6)`
3. `reduced motion: both beats render statically, the tagline is already visible, the header stays visible, and no intro-active attribute is written (assumption A1)`

**Skipped (Playwright skipped these because a prior case's locator wait already exhausted the test's condition path):**
4. `beat 2: after one viewport height of scroll its tagline reveals (opacity 0 -> 1), reading as arriving beneath the logo (D-13)`
5. `both beats render byte-for-byte identical logomark geometry — same width, height and viewport-relative vertical centre (assumption A4)`
6. `the beat-2 tagline renders non-empty copy sourced from Sanity, not hardcoded`

Plan 21-14 rebases this describe block onto the new pinned-track structure.

## `clearInlineStyles()` 1:1 Write/Removal Contract — New Pairs Added This Plan

| Write (in `applyIntroScrub()` / `applyIntroActive()`) | Removal (in `clearInlineStyles()`) |
|---|---|
| `introLogo.style.transform = 'scale(...)'` | `introLogo?.style.removeProperty('transform')` |
| `introBodyEl.style.opacity = '...'` | `introBodyEl?.style.removeProperty('opacity')` |
| `introBodyEl.style.transform = 'translateY(...)'` | `introBodyEl?.style.removeProperty('transform')` |
| `introCue.style.opacity = '...'` | `introCue?.style.removeProperty('opacity')` |
| `root.setAttribute('data-intro-active', 'true')` (now sourced from the intro track's own bottom edge, was the zoom track's top edge) | `root.removeAttribute('data-intro-active')` (pre-existing removal, unchanged) |
| `lastIntroProgress` cache set on change | `lastIntroProgress = INTRO_PROGRESS_SENTINEL` reset on detach |

Every write above is individually null-guarded (`if (introLogo) ...`, etc.) since `introBodyEl` is legitimately absent whenever the Sanity intro field is empty — folding these into one all-or-nothing check would have been wrong.

## Decisions Made

- Extracted `computeTrackProgress()` rather than duplicating `computeZoomProgress`'s formula — `computeZoomProgress`'s own describe block (unedited) is the regression net proving the refactor is behavior-preserving.
- `applyIntroActive()` was moved onto the intro track's own bottom edge instead of continuing to infer it from the zoom track's top edge, per the plan's own Task 3 item 3 — functionally identical by construction (adjacent siblings, no margin) but now a direct measurement rather than an inference, and removed a footgun where a future change to either track's markup order could silently desynchronize the two.
- Kept the T-21-10-A/HOME-16 rising-edge accent guard (`target.dataset.index !== undefined`) in `applyArrival()` even though every element in `slides` now carries `data-index` (making the original intro-exclusion reason moot) — per the plan's own instruction, it remains load-bearing for the separate no-heroColor "palette automatique" content path.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Copied `.env` into the worktree and ran `npm ci --prefix sanity`**
- **Found during:** Task 1 verification (`npm run build`, `npm run test:coverage`)
- **Issue:** Same pre-existing environment-setup gap documented in every prior 21-* plan's SUMMARY (21-07, 21-11, 21-12) — this worktree was created without the gitignored `.env` (Sanity project/dataset credentials) and without `sanity/node_modules` installed, unrelated to this plan's own file changes.
- **Fix:** Copied `.env` from the main checkout (gitignored, not committed) and ran `npm ci --prefix sanity` — mirroring CLAUDE.md's own documented CI pipeline step, a deterministic lockfile install, not a new/different package selection.
- **Files modified:** None tracked (`.env` is gitignored; `sanity/node_modules` is gitignored)
- **Verification:** `npm run build`, `npm run test:coverage` (339/339 tests) both pass after the fix
- **Committed in:** N/A (no tracked files changed; environment setup only)

**2. [Rule 1 - Bug] Reworded one CSS comment to avoid an unintended extra `var(--deck-vh, 100svh)` grep match**
- **Found during:** Task 2 verification (before/after grep count check)
- **Issue:** A first-draft comment above `.home-scroll-deck__intro-track` quoted the literal string `` `var(--deck-vh, 100svh)` `` in prose, pushing the file's total occurrence count to 13 instead of the plan's expected 12 (11 before + net 1 after: -1 retired rule, +2 new track/stage rules).
- **Fix:** Reworded the comment to say "21-11's live-viewport-height term" instead of quoting the literal CSS function call, preserving the same explanation without the accidental extra literal match.
- **Files modified:** `src/components/HomeCarousel.astro` (comment only, same commit as the rest of Task 2)
- **Verification:** `grep -c 'var(--deck-vh, 100svh)' src/components/HomeCarousel.astro` → 12
- **Committed in:** `4c7c8bf` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking environment setup, 1 in-scope bug fix to meet the plan's own literal grep criterion)
**Impact on plan:** No scope creep — both fixes were required to obtain a trustworthy verification signal and to satisfy the plan's own stated acceptance criteria exactly.

## Issues Encountered

- **One Task 2 acceptance-criteria grep bullet (`data-role="deck-intro"` returns 0) does not hold until Task 3 completes**, per the plan's own explicit Task 2 scope note ("no script in this task"). The stale script-side lookup (`introSections`) that still contained this string was Task 3's own item 6 to delete. Confirmed the criterion's true end state (0) was reached after Task 3 — see the Before/After Grep Counts table above. Not a functional discrepancy, a task-boundary artifact of the plan's own explicit scoping.
- **`grep -v '^\s*//' ... | grep -c "addEventListener('scroll'"` returns 1, not the plan's stated 0**, because plan 21-11's pre-existing `window.visualViewport.addEventListener('scroll', syncDeckViewportHeight, ...)` call (added in a prior plan, unrelated to this one) already matches that literal pattern before this plan's Task 3 even started — confirmed via `git show 4c7c8bf:...` showing the same count of 1 at the Task 2 boundary, before any Task 3 script changes. Confirmed directly via `git diff` that Task 3 added zero `addEventListener` calls of any kind — the functional claim ("the intro scrub added no scroll listener") holds; only the plan's literal grep pattern, written before accounting for the pre-existing sizing-sync listener, does not land on exactly 0.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Gap 1's mechanism is closed: one logomark element, one image, one continuous scroll-driven transformation, confirmed as a build-artifact fact in both locales.
- Gap 2's intro half is closed structurally: the tagline is fully opaque and stationary for the last 40% of the pinned scrub, independent of the visitor's scroll momentum, via `computeIntroScrubState`'s sub-range design.
- Plan 21-14 can now rebase the `pre-zoom intro beats` describe block onto the new `[data-role="intro-track"]`/`[data-role="intro-stage"]`/`[data-role="intro-logo"]`/`[data-role="intro-body"]`/`[data-role="intro-cue"]` structure — the exact case list to close is recorded above.
- Assumption A6 (900px reveal distance, shrink-in-place) and the visitor-facing truth of gap 1/gap 2 both await plan 21-15's consolidated real-device check, per this plan's own Gap-closure gate.
- No blockers.

---
*Phase: 21-homepage-scroll-experience*
*Completed: 2026-08-09*

## Self-Check: PASSED

- FOUND: src/lib/home-carousel.ts
- FOUND: tests/unit/home-carousel.test.ts
- FOUND: src/components/HomeCarousel.astro
- FOUND: .planning/phases/21-homepage-scroll-experience/21-13-SUMMARY.md
- FOUND commit: 9e79187 (Task 1 RED)
- FOUND commit: 0d708b0 (Task 1 GREEN)
- FOUND commit: 4c7c8bf (Task 2)
- FOUND commit: 262cc40 (Task 3)
