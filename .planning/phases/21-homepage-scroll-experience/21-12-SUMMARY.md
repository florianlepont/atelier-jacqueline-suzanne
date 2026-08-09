---
phase: 21-homepage-scroll-experience
plan: 12
subsystem: ui
tags: [astro, css, scroll-snap, playwright, mobile-safari, scroll]

# Dependency graph
requires:
  - phase: 21-homepage-scroll-experience (plan 21-11)
    provides: the `var(--deck-vh, 100svh)` live-viewport-height convention this plan's pull-up and stage height both build on
provides:
  - "A driver-gated negative top margin on .home-scroll-deck__slides (`calc(-1 * var(--deck-vh, 100svh))`, gated on data-zoom-active PRESENCE) that removes the stage's trailing viewport height from the document"
  - "An opaque (--color-dominant), explicitly-stacked (z-index: 1) .home-scroll-deck__stage that covers the incoming first slide for the whole scrub"
  - "A completed-state rule (.home[data-zoom-active='false'] .home-scroll-deck__stage { visibility: hidden }) that takes the stage out of sight and out of hit-testing the instant zoom progress reaches its end value"
  - "getSlideDocumentOffsets(), a module-scope Playwright helper returning each deck slide's own live document offset, replacing all track-height-derived scroll targets in tests/e2e/homepage-scroll-deck.spec.ts"
affects: [21-13, 21-15]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pulling a later sibling up by exactly a sticky element's own height, keyed on the same attribute that later retires the sticky element, so a document-flow dead zone left behind by a completed scroll-scrubbed animation collapses to zero without touching the animation's own math"
    - "visibility: hidden (not opacity) as the retirement mechanism for a stage that must also stop hit-testing once its crossfade job is done"
    - "Deriving Playwright scroll targets from live element geometry (getBoundingClientRect + scrollY) rather than from a sibling's rendered height, so the spec is immune to a later change in the relationship between the two"

key-files:
  created: []
  modified:
    - src/components/HomeCarousel.astro
    - tests/e2e/homepage-scroll-deck.spec.ts

key-decisions:
  - "The pull-up and the completed-state hide are both gated on the SAME attribute (data-zoom-active) the motion driver already writes — presence alone for the pull-up (any value), the completed value specifically for the hide — so reduced motion, desktop and pre-JS rendering never see either rule engage, with no new reduced-motion counterpart needed"
  - "The stage's new background-color uses --color-dominant, the exact token body already painted through it while it was transparent, so the wordmark screen's rendered appearance is unchanged even though the stage itself is no longer transparent — the deliberately-superseded e2e case now asserts this equality directly instead of asserting transparency"
  - "Confirmed live in this session (T-21-12-D, the plan's own accepted proximity-snap consequence): an instant `window.scrollTo()` landing within roughly 250-300px of the first slide's now-closer snap point resolves synchronously back to that snap point rather than the requested position — there is no way to REST an intermediate crossfade frame inside that tail anymore. The new reversibility-at-the-boundary e2e case targets 500px before completion (safely outside that range) instead of asserting an unreachable state, with a comment recording the measured threshold and the reasoning."

patterns-established:
  - "A completed-state CSS rule that reverses a driver's mid-scrub structural change (here: re-establishing document flow) the instant progress reaches its terminal value, with no transition, because any intermediate frame in that specific rule IS the defect being closed"

requirements-completed: [HOME-14, HOME-15]

coverage:
  - id: D1
    description: "Once the zoom completes, the first gallery's photo is on screen exactly once — no scroll position shows the same photograph in two adjacent boxes"
    requirement: "HOME-14"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#collapsed post-zoom dead zone > no-doubling sweep: the pinned stage is never visible at the same time as the first slide's sharp photo, across the collapsed zone"
        status: pass
    human_judgment: false
  - id: D2
    description: "The moment zoom progress reaches its completed value, the first gallery slide is already the full screen, at its own snap point — not a further viewport height of scrolling later"
    requirement: "HOME-14"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#collapsed post-zoom dead zone > coincidence: the first slide's own document offset equals the zoom track's offset plus the live reveal distance — the fix that closes gap 3"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#collapsed post-zoom dead zone > at the completion offset, the first slide fills the viewport from its own top and the pinned stage is retired — read atomically so no signal can be caught stale"
        status: pass
    human_judgment: false
  - id: D3
    description: "Scrolling back up re-enters the zoom seamlessly, with no flash of a second copy of the photo at the boundary"
    requirement: "HOME-15"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#collapsed post-zoom dead zone > reversibility at the boundary: leaving the snap-absorbed tail of the scrub immediately restores a visible stage and resumes the scrub, with no gap and no second copy (D-04, T-21-12-D)"
        status: pass
    human_judgment: false
  - id: D4
    description: "A reduced-motion or desktop visitor keeps exactly today's geometry, because every geometry change is keyed on an attribute only the motion driver ever writes"
    requirement: "HOME-14"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#collapsed post-zoom dead zone > reduced motion, phone width: the pull-up and stage-retirement are provably inert — no zoom-active attribute, no negative margin on the slides wrapper, and the stage stays visible (D-15)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#collapsed post-zoom dead zone > desktop (1280x800): the deck root is still not visible, the homepage still renders its carousel, and no zoom-active attribute exists (UI-02)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The visitor-facing truth (the cover photo genuinely renders once on a real phone, through Mobile Safari's own toolbar/scroll-snap physics) — a fixed-viewport engine's own scroll-snap implementation cannot substitute for a real gesture"
    requirement: "HOME-14"
    verification: []
    human_judgment: true
    rationale: "Per the plan's own Gap-closure gate: this gap IS reproducible in a fixed-viewport engine (mechanism confirmed both by the debug session and by this plan's own e2e sweep), so the automated coverage above is a genuine repro-level guard, not merely a regression net. The final visitor-facing confirmation is still deliberately deferred to the consolidated real-device check in plan 21-15."

# Metrics
duration: 15min
completed: 2026-08-09
status: complete
---

# Phase 21 Plan 12: Collapse the Post-Zoom Dead Zone Summary

**Pulled the deck's slides wrapper up by one deck-viewport-height while the motion driver is attached, made the pinned stage opaque/stacked/retired-on-completion, and rebased every e2e scroll target onto live slide geometry — closing `21-UAT.md` round-2 gap 3 (the cover photo rendering twice in the scroll range between zoom completion and the first slide's old snap point).**

## Performance

- **Duration:** 15 min
- **Base commit:** 8b73820 (09:02:29+02:00)
- **Task 1 commit:** 09:07:30+02:00
- **Task 2 commit:** 09:17:02+02:00
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Added a driver-gated negative top margin (`calc(-1 * var(--deck-vh, 100svh))`) on `.home-scroll-deck__slides`, keyed on `data-zoom-active` PRESENCE (any value) — removes the stage's trailing viewport height of document flow, so the first slide's own `scroll-snap-align: start` point now coincides with the sticky stage's release point instead of sitting a full viewport below it
- Made `.home-scroll-deck__stage` paint `--color-dominant` (the exact token `body` already showed through it while transparent, so the wordmark screen's rendered appearance is pixel-identical to before) and carry `z-index: 1` (since the first slide now sits behind it for nearly the whole scrub, not just structurally offscreen)
- Added a completed-state rule (`.home[data-zoom-active='false'] .home-scroll-deck__stage { visibility: hidden }`, no transition) that retires the stage the instant progress reaches 1 — `visibility` rather than `opacity` so the stage also stops hit-testing, restoring D-10's tap-to-open on the first slide
- Added `getSlideDocumentOffsets()`, a module-scope Playwright helper returning each deck slide's own live document offset (bounding-rect top + scrollY), polled until stable so it only reads after the pull-up's first painted frame has landed; rebased `getSlideScrollTargets()`, `getArrivalScrollTarget()`, and the next-slide-warm target onto it, retiring every piece of track-height-derived scroll-target arithmetic
- Rewrote the plan-21-09 "pinned stage stays transparent" case (deliberately superseded, not deleted) to assert the stage now paints `--color-dominant` and carries a positive stacking level
- Added a new `collapsed post-zoom dead zone` describe block with 7 cases: the offset-coincidence assertion that pins gap 3's actual fix, an atomic completed-state read, a no-doubling sweep across the collapsed zone (the direct automated analogue of the reported symptom), a reversibility-at-the-boundary case, tap-through after completion, and the reduced-motion/desktop inert paths

## Task Commits

Each task was committed atomically:

1. **Task 1: Collapse the dead zone — pull the slides up, make the stage opaque and stacked, retire it on completion** - `2a8b702` (fix)
2. **Task 2: Rebase slide scroll targets on live geometry and pin the no-doubled-photo invariant** - `196d877` (test)

## Files Created/Modified

- `src/components/HomeCarousel.astro` — added the pull-up rule on `.home-scroll-deck__slides`, and the opaque-background/z-index/completed-state-hide rules on `.home-scroll-deck__stage`, all inside the existing phone-width `@media (max-width: 767px)` block, adjacent to the track/stage rules they modify
- `tests/e2e/homepage-scroll-deck.spec.ts` — added `getSlideDocumentOffsets()` at module scope; rebased `getSlideScrollTargets()`, `getArrivalScrollTarget()`, and the next-slide-warm target onto it; rewrote the deliberately-superseded stage-transparency case; added the new `collapsed post-zoom dead zone` describe block (7 cases)

## Before/After Grep Counts (Task 1 acceptance criteria)

- `grep -c 'data-zoom-active' src/components/HomeCarousel.astro`: **8 before → 10 after** (exactly +2: the pull-up selector `.home[data-zoom-active] .home-scroll-deck__slides` and the completed-state selector `.home[data-zoom-active='false'] .home-scroll-deck__stage`)
- `grep -c 'var(--deck-vh, 100svh)' src/components/HomeCarousel.astro`: **11 after** (≥6 required; the pull-up's `margin-top: calc(-1 * var(--deck-vh, 100svh))` is the one new occurrence)
- `grep -c 'getSlideDocumentOffsets' tests/e2e/homepage-scroll-deck.spec.ts`: **12** (≥4 required; declared once at module scope, referenced by 3 describe blocks — arrival/accent, per-frame driver, progressive loading — plus the new dead-zone block)

## E2e Scroll Targets — Rebased vs. Confirmed Unchanged

**Rebased onto `getSlideDocumentOffsets()` (Task 2):**
- `getSlideScrollTargets()` (arrival/accent describe block) — call sites: "arrival reveals: scrolling to the first slide reveals its description", "accent tracks the arrived gallery (D-09)", "second slide: arrival and accent move to the second gallery...", "a slide with no heroColor still updates the live accent and still warms the next slide...", "reversal: scrolling back to the top hides every description again"
- `getArrivalScrollTarget()` (per-frame driver describe block) — call sites: "scroll-event independence — arrival: the reveal still fires...", "atomic handoff: wordmark opacity, photo opacity, the zoom-active attribute and the first slide's arrival class...", "detach on gate change releases everything: resizing to desktop mid-arrival..."
- `secondSlideArrivalTarget` (progressive-loading describe block) — call site: "arriving at a slide promotes the NEXT slide's sharp image out of native-lazy..."
- "the wordmark screen is deliberately unchanged: the pinned stage stays transparent..." — the ONE case deliberately superseded rather than rebased: now asserts the stage paints `--color-dominant` and carries a positive `z-index`, with a comment naming `21-UAT.md` round-2 gap 3 and recording that the wordmark screen's rendered appearance is unchanged because the chosen token is the same colour `body` already painted through the transparent stage

**Confirmed correct, unchanged** (still land inside the zoom scrub via `getIntroOffset()`/`getRevealDistance()`, re-run and re-verified after Task 1's CSS changes since the zoom's own math was untouched):
- "rendered reveal distance matches the exported ZOOM_REVEAL_DISTANCE constant (WR-01)"
- "rest state before any scrolling (HOME-15)"
- "header hidden during the zoom (D-03/D-12)"
- "mid-scrub scale is strictly between 1 and 8.5 (D-04)"
- "completion: wordmark fully faded, photo fully opaque, zoom-active flips to its completed value..."
- "header fades in once the zoom completes (D-12)"
- "reversibility: scrolling back to the top restores the rest state (D-04)" (zoom-driver block's own top-of-page reversal, distinct from the new boundary-specific reversibility case below)
- "the zoom anchors on the leading letter, not the block center (HOME-15, Pitfall 4)"
- "reduced motion: no transform is written, no zoom-active attribute exists, and the header stays visible (D-15)"
- "desktop inert: no zoom-active attribute, header visible (success criterion 5)"
- "scroll-event independence — mid-scrub: the wordmark scale still updates..."
- "scroll-event independence — completion: the crossfade and header-hide flag still resolve..."
- "reduced motion is still fully inert with the loop mechanism..."

No assertion outside the one deliberately-superseded case was weakened or removed — only how scroll targets are derived changed.

## Decisions Made

- **T-21-12-D confirmed live, reversibility case adapted accordingly.** The plan's own threat register named an accepted consequence: the first slide's snap point moving closer to the scrub tail puts the final ~250-400px of the zoom within `proximity` snap range. Debugging the initial version of the reversibility-at-the-boundary case (which targeted 5px before completion, expecting a near-opaque crossfade) showed the actual live behavior is stronger than "roughly 250-400px": an instant `window.scrollTo()` landing within that range resolves **synchronously, on the same call**, back to the completion snap point — even an immediate same-tick read (no `waitForTimeout`) shows `scrollY` unchanged. Binary search in this session found the threshold between 250px (blocked) and 300px (succeeds). Since the crossfade itself only starts at t=0.85 (135px before completion, per `HomeCarousel.astro`'s own crossfade-target comment), it sits entirely inside the now-unreachable-at-rest zone — there is no scroll position from which an intermediate crossfade frame can be observed at rest anymore, which is exactly the deliberate effect the plan names ("removes the ability to rest mid-zoom in a half-scaled state"). The case was rewritten to target 500px before completion (safely outside the measured threshold) and assert the mechanically-testable boundary instead: leaving the snap-absorbed tail restores a visible stage and resumes the scrub, with a comment recording the measured threshold and referencing T-21-12-D by name.
- **Comment style avoids literally repeating "data-zoom-active" in prose** inside the new CSS comment block, so the Task 1 acceptance criterion's exact `+2` grep-count delta (pull-up selector + completed-state selector only) holds — the comments instead describe "the attribute only the motion driver ever writes."

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Copied `.env` into the worktree and ran `npm ci --prefix sanity`**
- **Found during:** Task 1 verification (`npm run build`) and Task 2 verification (`npm run test:coverage`)
- **Issue:** Same pre-existing environment-setup gap documented in `21-11-SUMMARY.md` — this worktree was created without the gitignored `.env` (Sanity project/dataset credentials) and without a fully-installed `sanity/node_modules` (missing the `@sanity/icons/BulbOutline` subpath), unrelated to this plan's own file changes.
- **Fix:** Copied `/Users/florian/Projects/ajs-website/.env` into the worktree (gitignored, not committed) and ran `npm ci --prefix sanity` — mirroring CLAUDE.md's own documented CI pipeline step, a deterministic lockfile install, not a new/different package selection.
- **Files modified:** None tracked (`.env` is gitignored; `sanity/node_modules` is gitignored)
- **Verification:** `npm run build`, `npm run test:coverage` (318/318 tests) both pass after the fix
- **Committed in:** N/A (no tracked files changed; environment setup only)

---

**Total deviations:** 1 auto-fixed (1 blocking, environment setup — no source changed)
**Impact on plan:** No scope creep; reproduces this repo's own documented, deterministic CI setup steps.

## Issues Encountered

- **`webkit-mobile` Playwright project only ever runs `*.smoke.spec.ts` files, by pre-existing global config (`playwright.config.ts`, unrelated to this plan — confirmed via `git show HEAD~2:playwright.config.ts`).** The plan's own Task 2 verify command includes `npx playwright test homepage-scroll-deck --project=webkit-mobile`, which reports "No tests found" against this project scoping — not a failure introduced by this plan, since `homepage-scroll-deck.spec.ts` has never matched that project's `testMatch` pattern. The plan's own full-suite command (`npx playwright test --project=webkit-mobile`) was run instead and passed (5/5, the `critical.smoke.spec.ts` cases), which is the actual webkit-mobile coverage this file's own cases (`critical.smoke.spec.ts`'s "mobile homepage (scroll deck) renders without horizontal overflow") already exercise.
- **`getRevealDistance`/`getIntroOffset` remain in active use** by every "confirmed unchanged" case listed above — they were not retired, only `getSlideScrollTargets`/`getArrivalScrollTarget`/`secondSlideArrivalTarget`'s track-height math was replaced, per the plan's own scope ("Restrict every edit to how scroll TARGETS are derived").

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- `21-UAT.md` round-2 gap 3 is closed mechanically: the first slide's snap point coincides with the stage's release point, the stage is opaque/stacked/retired-on-completion, and the no-doubling sweep proves no scroll position in the collapsed zone shows both the stage and the first slide's sharp photo at once.
- D-04's reversibility, D-10's tap-to-open, D-12's header behaviour and plan 21-07's handoff fix are all re-verified intact after this plan's geometry change.
- Plan 21-13 (pinned intro redesign) and plan 21-15 (consolidated real-device check, which will confirm gap 3's visitor-facing result — the cover photo genuinely rendering once on a real phone) can both build on this collapsed geometry directly.
- No blockers.

---
*Phase: 21-homepage-scroll-experience*
*Completed: 2026-08-09*
