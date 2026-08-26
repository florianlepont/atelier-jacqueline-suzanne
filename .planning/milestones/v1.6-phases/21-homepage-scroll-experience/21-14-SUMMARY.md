---
phase: 21-homepage-scroll-experience
plan: 14
subsystem: ui
tags: [astro, css, playwright, scroll-driven, mobile-nav, gap-closure]

# Dependency graph
requires:
  - phase: 21-homepage-scroll-experience (plan 21-10)
    provides: "the original D-12 header-hide CSS block this plan restores the scope of, and the pre-zoom intro beats describe block this plan's Task 2 replaces wholesale"
  - phase: 21-homepage-scroll-experience (plan 21-13)
    provides: "the pinned, scroll-scrubbed intro track/stage (computeIntroProgress, computeIntroScrubState, INTRO_REVEAL_DISTANCE) this plan's e2e coverage and header-suppression rule are rebased onto"
provides:
  - "D-12's header hide restored to data-zoom-active-only scope (Task 1), with a Task-3-discovered `:not([data-intro-active])` addendum on that same rule so the header is genuinely reachable at scroll 0, not just nominally so"
  - "A narrow data-intro-active-keyed rule suppressing only the header's own logomark (.logo-mark), so the hamburger and the rest of the header's hit area stay reachable throughout the intro"
  - "A rewritten 'pinned intro scrub' describe block in tests/e2e/homepage-scroll-deck.spec.ts (22 cases), replacing the retired two-beat 'pre-zoom intro beats' block (9 cases)"
  - "getIntroScrubDistance() and introScrubTarget() as new module-scope e2e helpers"
affects: ["21-15 (the phase's consolidated real-device human-verify gate — this plan's assumption A7 and the header-reachability fix both await real-device confirmation there)"]

tech-stack:
  added: []
  patterns:
    - "Gating a broader CSS hide condition (data-zoom-active) on the ABSENCE of a narrower, more precisely-scoped sibling attribute (data-intro-active), reusing an existing correct geometric signal instead of re-deriving a second one or touching the JS driver's own attribute-write semantics"
    - "0..1 progress-fraction scroll-target helpers (introScrubTarget) mirroring the codebase's existing getIntroOffset()/getSlideDocumentOffsets() idiom, expressed as a fraction of a live-measured distance rather than repeated multiplication at each call site"

key-files:
  created: []
  modified:
    - src/components/HomeCarousel.astro
    - tests/e2e/homepage-scroll-deck.spec.ts

key-decisions:
  - "Fixed header-reachability at scroll 0 with a CSS-only `:not([data-intro-active])` addendum on the EXISTING data-zoom-active header-hide rule, rather than changing computeProgress()/onProgress()'s attribute-write semantics — preserves data-zoom-active's other two consumers (21-12's collapsed-dead-zone stage/slides rules) untouched, and reuses data-intro-active's own already-correct raw geometric signal (the intro track's bottom edge) instead of inventing a second one"
  - "Superseded, not deleted, two pre-existing 'wordmark-to-photo zoom driver' cases whose scroll-0 header assertions the above fix necessarily flips: 'header hidden during the zoom (D-03/D-12)' renamed and rescoped to mid-scrub, and the tail of 'reversibility: scrolling back to the top restores the rest state (D-04)' flipped from not.toBeVisible() to toBeVisible() — both follow the same pattern plans 21-10/21-12 already established for a deliberately superseded (not silently relaxed) assertion"
  - "data-intro-active now has TWO CSS consumers (was one, per Task 1's own literal grep criterion) — documented as a superseding correction to that criterion, not a violation of its underlying intent (the criterion protects against a dead attribute with zero consumers; two load-bearing consumers is stronger, not weaker)"

patterns-established:
  - "When a plan's Task 1 states 'do not touch X' but Task 3's own verification later proves X's current behaviour directly contradicts the plan's own stated primary success criterion, investigate empirically (a throwaway Playwright probe against the live build, not just reasoning from source) before either editing X or silently writing a test that would paper over the contradiction"

requirements-completed: [HOME-15]

coverage:
  - id: D1
    description: "The navigation hamburger is visible, enabled, and functional (opens the panel) at scroll position 0, before any scrolling — 21-UAT.md round-2 gap 5's failed truth, closed with both a visibility proof and an interaction proof"
    requirement: "HOME-15"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#reachable from arrival: at scroll position 0, without scrolling at all, the site header is visible AND the hamburger toggle is visible and enabled"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#the hamburger actually works from arrival: at scroll position 0, clicking it opens the navigation panel"
        status: pass
    human_judgment: false
  - id: D2
    description: "The header stays reachable through the whole intro scrub and only disappears during the wordmark zoom itself — D-12's original scope, corrected for the intro's presence, not overturned"
    requirement: "HOME-15"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#still reachable through the whole intro: at the halfway point of the scrub and again at its very end, the header and the hamburger are both still visible"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#header hidden once the zoom scrub genuinely engages, past the intro (D-03/D-12, scope corrected by 21-14 gap 5)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#header fades in once the zoom completes (D-12)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Only the header's own logomark is suppressed during the intro (assumption A7) — the hamburger, language switcher, and rest of the header's hit area are unaffected"
    requirement: "HOME-15"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#the logomark is the one thing suppressed (A7): the header's own logo anchor is hidden at scroll 0 and at the halfway point while the header itself stays visible, and is visible again past the zoom's completion"
        status: pass
      - kind: e2e
        ref: "playwright:mobile-nav.spec.ts, site-header.spec.ts, accessibility.spec.ts --project=chromium (111 passed)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Gap 1's automated coverage is complete against plan 21-13's pinned intro: one logomark, a pinned stage, a continuous curve, a sticky release coinciding with progress reaching 1, a readable trailing dwell, an atomic intro-to-zoom boundary, and scroll-event independence"
    requirement: "HOME-15"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#'pinned intro scrub' describe block, 22 cases total --project=chromium"
        status: pass
    human_judgment: false
  - id: D5
    description: "The full e2e suite is green on both Playwright projects, closing plan 21-13's deliberate red window; typecheck/lint/coverage/artifact all clean"
    verification:
      - kind: e2e
        ref: "playwright --project=chromium (453 passed), --project=webkit-mobile (5 passed, smoke-only project)"
        status: pass
      - kind: other
        ref: "npm run test:coverage (339/339 unit tests, thresholds met), npm run typecheck, npm run lint, npm run test:artifact"
        status: pass
    human_judgment: false
  - id: D6
    description: "The visitor-facing truth (a real phone visitor can reach the hamburger immediately, and the composition between the header's own logomark and the intro's logomark reads correctly) — this plan lands the mechanism and its automated proof only"
    verification: []
    human_judgment: true
    rationale: "Per this plan's own Gap-closure gate: gap 5's mechanism and interaction proof, and gap 1's automated coverage, both land here and are fully reproducible in a fixed-viewport engine. The visitor-facing truth — including assumption A7's compositional call (only the header's own logomark suppressed, not the whole header) — is confirmed only by the consolidated real-device check in plan 21-15."

# Metrics
duration: ~25min this continuation session (Tasks 2-3; Task 1 was committed by a prior, provider-interrupted session — see 21-13-SUMMARY.md/21-10-SUMMARY.md for the established pattern of documenting a stall-and-resume plan honestly)
completed: 2026-08-10
status: complete
---

# Phase 21 Plan 14: Header Reachability & Pinned-Intro Spec Rebase (Gap 5 + Gap 1 Coverage) Summary

**Restored D-12's header hide to the wordmark zoom alone, added a narrow logomark-only suppression during the intro, discovered and fixed a second, previously-hidden cause of the same defect (a CSS gating addendum on the pre-existing zoom-active hide rule), and rebased the phase's e2e spec onto plan 21-13's pinned intro — closing `21-UAT.md` round-2 gaps 5 and 1's remaining coverage, with the full suite green again on both Playwright projects.**

## Performance

- **Duration:** ~25 min this continuation session (Tasks 2 and 3). Task 1 was committed (`ed61934`) by a prior agent session that stalled for 600s on a provider-side stream watchdog issue after committing Task 1 but before starting Task 2 — not a code failure. This continuation independently re-verified Task 1's own acceptance criteria against the live worktree (all confirmed) before building on top of it.
- **Started:** 2026-08-10T~09:00Z (this continuation)
- **Completed:** 2026-08-10T09:20:09Z
- **Tasks:** 3/3 (1 by the prior session, 2 by this one)
- **Files modified:** 2 (`src/components/HomeCarousel.astro`, `tests/e2e/homepage-scroll-deck.spec.ts`)

## Accomplishments

- **Independently re-verified Task 1** before building on it: re-read the diff, confirmed the wide `data-intro-active`-keyed whole-header hide was deleted and replaced with a narrow `.logo-mark`-only rule (two CSS selectors, one consuming rule, `data-intro-active` grep count unchanged at 9), confirmed the `:global()` scoping trap was avoided correctly, and re-ran Task 1's own full verification command (`typecheck`, `lint`, `build`, `test:artifact`, `mobile-nav`/`accessibility`/`critical.smoke`/`site-header` on chromium — 111 passed — plus `critical.smoke` on webkit-mobile — 5 passed) from a clean state, rather than trusting the commit message.
- **Task 2:** Replaced the retired `pre-zoom intro beats` describe block (9 cases against the two-static-beat structure) wholesale with a new `pinned intro scrub` block rebased onto plan 21-13's pinned track/stage. Added `getIntroScrubDistance()` and `introScrubTarget()` as module-scope helpers, and `translateYFromComputedTransform()` alongside the existing `scaleFromComputedTransform()`. New coverage: geometry/parity (WR-01's own intro analogue), exactly-one-logomark, rest/mid/end-of-scrub states, the readability dwell (gap 2's intro half), reversibility (D-04), the atomic intro-to-zoom boundary (one `page.evaluate` for five handoff signals), and scroll-event independence.
- **Task 3 discovered and fixed a real, previously-hidden defect**, empirically confirmed via a throwaway Playwright probe against the live build (not just source reasoning) BEFORE writing any header test: Task 1's CSS-only fix, exactly as specified, did NOT actually make the header reachable at scroll 0. `computeZoomProgress`/`onProgress` clamp the zoom's own progress to 0 for any zoom-track top-edge value `>= 0` — this was harmless pre-21-10 (the zoom track WAS the deck's own first child, so `trackTop==0` at rest meant "the wordmark IS on screen", the correct moment to hide the header) but stopped being equivalent once 21-13's pinned intro started occupying that position instead: confirmed live, `data-zoom-active='true'` AND `data-intro-active='true'` simultaneously at scroll 0, meaning the ORIGINAL (untouched) D-12 zoom-active rule was independently still hiding the whole header the entire time, regardless of Task 1's intro-active fix.
- **Fix:** added `:not([data-intro-active])` to the SAME zoom-active header-hide rule Task 1 already touched — gates the hide on the intro having genuinely been scrolled past, reusing `data-intro-active`'s own already-correct geometric signal rather than touching `computeProgress()`/`onProgress()`'s attribute value (which would have also affected `data-zoom-active`'s other two, unrelated consumers — plan 21-12's collapsed-dead-zone stage/slides rules). Re-verified the full header lifecycle live: visible at scroll 0 → hidden once the zoom genuinely engages mid-scrub → visible again post-completion → visible again on scroll-back-to-0 (reversibility).
- Added the 5 header cases (gap 5) plus 6 moved/rewritten inert-route and structural-guard cases (no-snap-point, no-transition, non-empty Sanity copy, reduced motion rewritten for A7, desktop inert, detach-releases-writes, structural guards) into the same `pinned intro scrub` block, per the plan's own instruction that the intro's whole story live in one place.
- Full-suite gate restored: `npx playwright test --project=chromium` (453 passed), `--project=webkit-mobile` (5 passed, smoke-only project — `playwright.config.ts` scopes that project to `*.smoke.spec.ts` only, so `homepage-scroll-deck.spec.ts` never runs under it directly, matching every prior 21-* plan's own documented pattern), `npm run test:coverage` (339/339), `typecheck`, `lint`, `test:artifact` all clean — closing plan 21-13's deliberate red window.

## Task Commits

1. **Task 1: Restore D-12's header scope and suppress only the header's own logomark during the intro** - `ed61934` (fix) — committed by the prior, interrupted session; independently re-verified by this one.
2. **Task 2: Rewrite the intro describe block against the pinned scrub** - `57d2479` (test)
3. **Task 3: Cover the corrected header behaviour and the intro's inert routes, and restore the full-suite gate** - `1649da7` (test) — includes the Rule 1 CSS deviation described above, in the same commit as the tests it makes pass (both changes are two halves of one correction and were verified together).

## Files Created/Modified

- `src/components/HomeCarousel.astro` — Task 1: deleted the wide intro-active header hide, added the narrow `.logo-mark`-only suppression rule plus its companion transition. Task 3 (deviation): added `:not([data-intro-active])` to the pre-existing `data-zoom-active` header-hide rule, with an extensive comment explaining the root cause and the fix's scope.
- `tests/e2e/homepage-scroll-deck.spec.ts` — Task 2: two new module-scope helpers (`getIntroScrubDistance`, `introScrubTarget`), one new module-scope transform helper (`translateYFromComputedTransform`), the retired `pre-zoom intro beats` block replaced with the new `pinned intro scrub` block (10 cases). Task 3: 12 more cases added to that same block (5 header, 7 moved/new inert-route and structural-guard cases), plus two pre-existing `wordmark-to-photo zoom driver` cases rewritten (superseded, not deleted) to reflect the corrected header-hide timing.

## Old-to-New Case Mapping (retired `pre-zoom intro beats` block, 9 cases)

| Old case | Disposition |
|---|---|
| "beat 1 on first load..." (A4/A5) | **Superseded outright** — its entire premise (two static full-viewport sections) no longer exists post-21-13. Replaced by "exactly one logomark exists" and "at scroll position 0: rest state". |
| "beat 2: after one viewport height of scroll its tagline reveals..." (D-13) | Direct equivalent: "at the end of the scrub" (D-13's locked values, now scroll-driven). |
| "both beats render byte-for-byte identical logomark geometry..." (A4) | **Superseded outright** — its entire premise (two logos that must match) is exactly what gap 1's redesign removed. Replaced by "exactly one logomark exists". |
| "the header is hidden through both intro beats, and returns once the zoom fully completes" (D-12 extension) | **Superseded outright** by round-2 gap 5's correction. Rewritten as Task 3's 5 header cases. |
| "the intro beats carry no scroll-snap point..." (A3) | Direct equivalent: "no snap point on the intro". |
| "the beat-2 tagline renders non-empty copy sourced from Sanity..." | Direct equivalent: "the tagline renders non-empty copy sourced from Sanity, not hardcoded". |
| "reduced motion: both beats render statically..." (A1) | Direct equivalent, rewritten for the single stage and for A7: "reduced motion (assumption A1)...". |
| "desktop inert: neither intro beat is visible" | Direct equivalent: "desktop (1280x800): the intro track is not visible...". |
| "structural guards still hold with the intro beats present..." (D-16) | Direct equivalent: "structural guards with the new markup...". |

New block's case count: 22 (10 from Task 2 + 12 from Task 3), not lower than the 9 it replaces — case count net +13, all newly-added coverage beyond the direct/superseded mapping above (geometry/parity, rest/mid-scrub states, readability dwell, reversibility, atomic boundary, scroll-event independence, no-transition, detach-releases-writes, plus the 5 header cases).

## Additional two-case supersession in the `wordmark-to-photo zoom driver` block (outside the two owned blocks — Rule 1 deviation, see below)

| Old case | Disposition |
|---|---|
| "header hidden during the zoom (D-03/D-12)" | **Superseded, not deleted.** Renamed to "header hidden once the zoom scrub genuinely engages, past the intro (D-03/D-12, scope corrected by 21-14 gap 5)" and rescoped from scroll 0 to mid-scrub — the header IS still genuinely hidden once the zoom engages, this case now asserts that at the correct moment instead of at scroll 0, where it now conflicts with gap 5's own fix. |
| "reversibility: scrolling back to the top restores the rest state (D-04)" | Final header assertion flipped from `not.toBeVisible()` to `toBeVisible()` — the true rest state at scroll 0 is now the reachable intro, not a hidden header. Every other assertion in this case (wordmark scale, photo opacity) is unchanged. |

## Before/After `data-intro-active` Grep Count (Task 1 acceptance criterion, superseded by Task 3's own deviation)

- Task 1's own commit claimed the count unchanged at 9 (confirmed independently by this continuation before proceeding).
- After Task 3's deviation: **15** occurrences in `src/components/HomeCarousel.astro` — the increase is entirely new prose (comment) references explaining the `:not([data-intro-active])` addendum, plus the new selector occurrence itself. `data-intro-active` now has **TWO** CSS consumers (was one): the pre-existing narrow logo-suppression rule (unchanged) and this deviation's new gating condition on the zoom-active header-hide rule. Both are load-bearing. This supersedes, rather than violates, Task 1's own "exactly one consuming rule" criterion — that criterion's underlying purpose (T-21-14-D: prevent a dead attribute with zero consumers) is more strongly satisfied now, not less.
- `grep -c 'logo-mark' src/components/HomeCarousel.astro` → 15 (unchanged from Task 1, since the deviation didn't touch the logomark rule).
- `grep -c 'logo-mark' tests/e2e/homepage-scroll-deck.spec.ts` → 3 (>= 3, satisfies Task 3's acceptance criterion).
- `grep -c 'data-intro-beat' tests/e2e/homepage-scroll-deck.spec.ts` → 0.
- `grep -c 'intro-track\|intro-stage\|intro-logo' tests/e2e/homepage-scroll-deck.spec.ts` → 19 (>= 8, satisfies Task 2's acceptance criterion).

## Decisions Made

- **CSS-only fix over a JS driver change.** Considered changing `onProgress()`'s `data-zoom-active` write condition from the clamped progress fraction (`t < 1`) to a raw geometric check, but rejected it: `data-zoom-active` has two OTHER consumers (21-12's collapsed-dead-zone `.home-scroll-deck__stage`/`.home-scroll-deck__slides` rules) whose correctness depends on the exact 'true'/'false' semantics tied to actual zoom completion, not "visually engaged now" — changing the attribute's value would have risked those. Gating the ONE affected consumer (the header-hide rule) on `data-intro-active`'s existing, already-correct absence/presence signal is strictly narrower and lower-risk.
- **Investigated empirically before editing any test**, per the plan's own explicit instruction ("If the zoom block's own header cases need any change at all, that is a signal that Task 1 over-reached and should be investigated before editing a test"). Wrote a throwaway Playwright probe (deleted before this commit, never committed) against the live build to directly observe `data-zoom-active`/`data-intro-active`/header-visibility state at scroll 0, rather than reasoning from source code alone — this caught a real defect a purely-static read of the plan's own narrative would have missed.
- Kept the deviation's CSS change and the tests it makes pass in the SAME commit (Task 3), since they are two halves of one correction discovered and verified together, and separating them would have created a commit with a still-failing suite in between.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Header remained hidden at scroll 0 even after Task 1's fix, due to an independent, previously-hidden defect in the pre-existing `data-zoom-active` header-hide rule**
- **Found during:** Task 3, before writing any header-reachability test — via an empirical live-build probe (see Decisions above), not from a test failure.
- **Issue:** `computeZoomProgress`/`onProgress` clamp the zoom's own progress to 0 for ANY zoom-track top-edge value `>= 0` — equally true whether the track is exactly at the viewport top (about to start) or a full intro's-worth of pixels below it (nowhere near started). This equivalence was harmless before plan 21-10 (the zoom track was the deck's own first child, so `trackTop==0` at rest meant "the wordmark IS the very first thing on screen" — the correct condition for D-12's header hide). Plan 21-13's pinned intro broke that equivalence by occupying scroll 0 instead, but nothing had surfaced the resulting bug yet: plan 21-10's OWN (now-corrected) wide intro-active header hide was independently keeping the header hidden for that same window, masking the zoom-active rule's own incorrect timing. Task 1's fix (correctly, per its own scope) removed only the wide intro-active hide, which is what finally exposed the pre-existing zoom-active timing bug.
- **Fix:** Added `:not([data-intro-active])` to the existing `data-zoom-active` header-hide CSS rule (same rule/file Task 1 already touched) — the header hide now requires the zoom to be genuinely engaged AND the intro to have genuinely been scrolled past, reusing `data-intro-active`'s own precise geometric signal (the intro track's bottom edge reaching the viewport top) rather than inventing a second one or touching the JS driver's attribute-write logic.
- **Files modified:** `src/components/HomeCarousel.astro` (CSS selector + comment only, same commit as the tests below), `tests/e2e/homepage-scroll-deck.spec.ts` (two pre-existing cases in the 'wordmark-to-photo zoom driver' block superseded — see the mapping table above)
- **Verification:** Live-build probe confirmed the full header lifecycle (visible at 0 → hidden mid-scrub → visible post-completion → visible on reversal); full `homepage-scroll-deck --project=chromium` (87 passed), full suite `--project=chromium` (453 passed) and `--project=webkit-mobile` (5 passed), `test:coverage` (339/339), `typecheck`, `lint`, `test:artifact` all clean.
- **Committed in:** `1649da7` (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 bug, discovered via empirical live-build verification rather than trusting the plan's narrative or a green-by-omission test suite)
**Impact on plan:** Necessary for the plan's own primary success criterion ("the hamburger is visible, enabled and functional at scroll position 0") to actually hold. Required superseding two pre-existing test cases outside the plan's two nominally-owned describe blocks — both are documented, deliberate supersessions (not silent relaxations), following the same pattern plans 21-10/21-12 already established elsewhere in this phase. No scope creep beyond what gap 5's own stated goal required.

## Issues Encountered

- **The prior session's stall was a provider-side stream watchdog issue (600s no-progress), not a code failure** — confirmed by inspecting the worktree state at spawn: Task 1 fully committed and verified-clean, no uncommitted or lost work.
- **A `reuseExistingServer`/stale-`dist/` trap during the empirical probe**: the first probe run (before rebuilding) reported the header still hidden after the CSS fix, which briefly looked like the fix hadn't worked. Root cause: `npm run build` had not been re-run after the CSS edit, so Playwright's `webServer` (`npm run preview`, `reuseExistingServer: !process.env.CI`) served the stale pre-fix `dist/`. Rebuilding before re-probing resolved it. Documented here since this is a generically useful trap for anyone editing CSS/markup mid-session against this repo's Playwright config.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `21-UAT.md` round-2 gap 5 is closed with both a visibility proof and an interaction proof: the hamburger is visible, enabled, AND opens the panel at scroll position 0.
- Gap 1's automated coverage is complete: one logomark, a pinned stage, a continuous curve, a sticky release coinciding with progress reaching 1, a readable trailing dwell, an atomic intro-to-zoom boundary, and scroll-event independence — all asserted against live rendered geometry, 22 cases in the `pinned intro scrub` describe block.
- D-12 (corrected scope, not overturned), D-04, D-13, D-15, D-16 all still hold; UI-02 holds — nothing about the intro or the header change exists at 768px and above.
- The full e2e suite is green on both Playwright projects, closing plan 21-13's deliberate red window.
- Assumption A7 (only the header's own logomark suppressed during the intro) and the visitor-facing truth of both gap 5 and gap 1 await plan 21-15's consolidated real-device check, per this plan's own Gap-closure gate — same deferral pattern every prior gap-closure plan in this phase has used.
- No blockers.

---
*Phase: 21-homepage-scroll-experience*
*Completed: 2026-08-10*

## Self-Check: PASSED

- FOUND: src/components/HomeCarousel.astro
- FOUND: tests/e2e/homepage-scroll-deck.spec.ts
- FOUND: .planning/phases/21-homepage-scroll-experience/21-14-SUMMARY.md
- FOUND commit: ed61934 (Task 1)
- FOUND commit: 57d2479 (Task 2)
- FOUND commit: 1649da7 (Task 3)
