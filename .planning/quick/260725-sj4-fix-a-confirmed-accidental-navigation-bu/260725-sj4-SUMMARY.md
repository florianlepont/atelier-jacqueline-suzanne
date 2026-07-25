---
phase: quick-260725-sj4
plan: 1
subsystem: ui
tags: [astro, playwright, homepage-carousel, css, e2e-testing]

# Dependency graph
requires:
  - phase: quick-260725-dcg
    provides: "The footer-hide CSS rule this task removes, plus the footer-hidden test contracts this task reverts"
  - phase: quick-260725-cfm
    provides: "The scroll-to-open overscroll accumulator and atBottom() gate this fix restores the precondition for"
  - phase: quick-260725-pit
    provides: "The simplified, silent scroll-to-open gesture and OPEN_OVERSCROLL_THRESHOLD=150, both left untouched"
provides:
  - "Fixed accidental-navigation bug: ordinary scrolling on a fresh homepage load no longer silently opens a gallery detail page"
  - "Footer renders normally again in carousel mode (matches grid mode / About / Contact / detail pages)"
  - "Fresh-load regression test coverage (synthetic WheelEvent/TouchEvent) proving atBottom() is false at scrollY 0"
affects: [homepage-carousel, e2e-test-suite]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Synthetic WheelEvent/TouchEvent dispatch via page.evaluate (window.dispatchEvent) for scroll-position-independent regression proofs — keeps scrollY at 0, isolating a state-gate assertion from real-pixel-height dependencies"

key-files:
  created: []
  modified:
    - src/components/HomeCarousel.astro
    - tests/e2e/homepage.spec.ts
    - tests/e2e/i18n.spec.ts
    - tests/e2e/legal.spec.ts

key-decisions:
  - "Removed the quick-260725-dcg footer-hide CSS rule entirely rather than patching the overscroll gate's threshold logic — the footer-hide was the actual root cause (it removed all real scroll distance below the hero, making atBottom() vacuously true at scrollY 0 on every fresh load)"
  - "Used synthetic WheelEvent/TouchEvent dispatch (not page.mouse.wheel or real scrolling) for the new regression tests, per the plan's explicit design — this keeps scrollY at 0 throughout, isolating the exact atBottom()-at-scrollY-0 property the bug violated, independent of the real footer's rendered pixel height"

patterns-established: []

requirements-completed: [QUICK-260725-sj4]

coverage:
  - id: D1
    description: "The carousel-mode footer-hide CSS rule is removed; the footer renders visibly in carousel mode again on FR and EN"
    requirement: QUICK-260725-sj4
    verification:
      - kind: unit
        ref: "grep -c \"footer.chrome-band { display: none\" src/components/HomeCarousel.astro (0 matches)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/i18n.spec.ts — 'locale content' describe, both FR/EN footer toBeVisible() assertions"
        status: pass
    human_judgment: false
    rationale: "Independently re-verified by the orchestrator with real Sanity credentials + isolated-port Playwright run: full e2e suite (196/196) passes. Also confirmed live in a real browser: footer computed display is 'flex' (not 'none') in carousel mode, and document.documentElement.scrollHeight (1009) now exceeds window.innerHeight (900)."
  - id: D2
    description: "On a fresh homepage load, two small wheel ticks and one modest touch swipe do NOT navigate away (regression proven by new tests that would have failed on the shipped bug)"
    requirement: QUICK-260725-sj4
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts — 'fresh load: two small wheel ticks do NOT navigate', 'fresh load (EN): two small wheel ticks do NOT navigate', 'fresh load: one modest touch swipe do NOT navigate'"
        status: pass
    human_judgment: false
    rationale: "Independently re-verified — all 4 new regression tests pass (isolated port, own fresh build). Also replayed the EXACT live-browser repro that originally found the bug (two dispatched WheelEvent(deltaY:80) on a fresh load, no scrollTo): confirmed atBottom() is now false at scrollY 0 and the visitor stays on '/' — where the same repro previously landed on a random gallery page pre-fix."
  - id: D3
    description: "A genuine scroll to the bottom past the footer plus a continued push still navigates into the current collection (feature intact)"
    requirement: QUICK-260725-sj4
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts — 'a light scroll past the bottom opens the currently-shown collection, reusing the title link's href' (unchanged, retained from quick-260725-pit)"
        status: pass
    human_judgment: false
    rationale: "Independently re-verified via e2e run and a live browser replay: scrollTo(bottom) + a single WheelEvent(deltaY:200) correctly navigated to a real gallery page (/galleries/silos/) — the intended gesture still works once genuinely used."
  - id: D4
    description: "No visible scroll-to-open hint re-introduced; OPEN_OVERSCROLL_THRESHOLD unchanged at 150; progress-dash fill, DetailHero.astro, and grid mode untouched"
    requirement: QUICK-260725-sj4
    verification:
      - kind: unit
        ref: "git diff src/components/HomeCarousel.astro shows only the one 15-line footer-hide block removed; grep confirms OPEN_OVERSCROLL_THRESHOLD/atBottom()/progress-dash rules unchanged"
        status: pass
    human_judgment: false

duration: 6min (+ orchestrator verification pass)
completed: 2026-07-25
status: complete
---

# Quick Task 260725-sj4: Fix Accidental-Navigation Bug Summary

**Removed the quick-260725-dcg carousel-mode footer-hide CSS rule (the root cause of the accidental-navigation bug) and reverted 3 spec files' footer-hidden test assumptions, adding synthetic-event fresh-load regression coverage for the bug.**

## Performance

- **Duration:** 6 min (commit-to-commit)
- **Started:** 2026-07-25T20:58:54+02:00
- **Completed:** 2026-07-25T21:04:21+02:00
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Removed the `body:has(.home[data-display-mode='carousel']) footer.chrome-band { display: none; }` rule (and its comment block) from `HomeCarousel.astro` — the footer now renders normally in carousel mode again, restoring genuine scrollable distance below the hero so `atBottom()` is false at scrollY 0 on a fresh load instead of vacuously true
- Reverted the footer-hidden test assumptions across `homepage.spec.ts` (HOME-06 mobile + tall-desktop below-the-fold checks, removed the now-obsolete "footer visibility by display mode" describe block), `i18n.spec.ts` (footer `toBeVisible()`), and `legal.spec.ts` (footer legal links clicked directly from `/` again, no grid-mode detour)
- Added 4 new fresh-load accidental-navigation regression tests using synthetic `WheelEvent`/`TouchEvent` dispatch (which keeps `scrollY` at 0, isolating the exact `atBottom()`-at-load property the bug violated): a direct mechanism proof, an FR wheel-tick repro, an EN wheel-tick repro, and a mobile touch-swipe repro — all assert no navigation occurs

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove the carousel-mode footer-hide rule (the fix)** - `956fb61` (fix)
2. **Task 2: Revert the footer-hidden test assumptions across the 3 spec files** - `016f214` (test)
3. **Task 3: Add fresh-load accidental-navigation regression coverage** - `94fe950` (test)

_No plan-metadata commit — per instructions, docs artifacts (SUMMARY.md, STATE.md, PLAN.md) are committed by the orchestrator, not this executor._

## Files Created/Modified
- `src/components/HomeCarousel.astro` - Removed the 15-line footer-hide CSS rule + comment block; nothing else in the file changed
- `tests/e2e/homepage.spec.ts` - Reverted 2 footer-visibility assertions to below-the-fold boundingBox checks; deleted the obsolete footer-visibility-by-mode describe block; added 4 new fresh-load synthetic-event regression tests
- `tests/e2e/i18n.spec.ts` - Reverted both locale-content footer assertions from present-but-hidden back to `toBeVisible()`
- `tests/e2e/legal.spec.ts` - Removed the grid-mode-toggle detour from both footer legal-nav reachability tests

## Decisions Made
- Removed the footer-hide CSS rule entirely (rather than adjusting the overscroll gate's math) since the investigation confirmed the footer-hide was the actual root cause — it eliminated all real scroll distance below the hero, making the `atBottom()` gate vacuously true at scrollY 0 on every fresh load
- Used synthetic `WheelEvent`/`TouchEvent` dispatch for the new regression tests (per plan spec) rather than `page.mouse.wheel`/native scrolling, since synthetic events don't move the page — this isolates the exact `atBottom()`-at-scrollY-0 property from the real footer's variable rendered height

## Deviations from Plan

None in code — plan executed exactly as written (Task 1: exact CSS block removed; Task 2: exact pre-dcg snippets restored per the plan's `<investigation_findings>`; Task 3: exact test structure per the plan's spec, plus an EN wheel-tick spot-check as suggested by the plan's "if cheap" note).

### Environment limitation (not a code deviation, documented per constraints)

This worktree has no `.env` (Sanity credentials are never provisioned to per-agent worktrees). This has two consequences:

1. `npm run build` fails with `Missing SANITY_PROJECT_ID or SANITY_DATASET env vars` — confirmed directly by running it (expected, matches the known limitation noted in the task's own constraints).
2. `npm run test:e2e` could not validate this worktree's actual code. Because `dist/` doesn't exist in this worktree, Playwright's `webServer` (`npm run preview`, i.e. `astro preview` serving `dist/`) would normally fail to start — but with `reuseExistingServer: !process.env.CI` (true locally) and a port-4321 listener already running from an **unrelated process** (PID confirmed via `lsof`, `cwd` = the main repo `/Users/florian/Projects/ajs-website`, not this worktree), Playwright silently reused that unrelated server instead of erroring. `curl`-ing that server's homepage confirmed it still serves the **pre-fix build** (`footer.chrome-band` / `display:none` present in the served HTML) — i.e. it predates this task's Task 1 fix entirely.

   Running `npm run test:e2e -- homepage.spec.ts` against that stale/unrelated server produced 4 "failures," all fully explained by this mismatch (not by bugs in this task's code):
   - Two pre-existing tests (`mobile full-bleed hero regression`, `tall-desktop full-bleed hero regression`) failed with `boundingBox()` returning `null` — expected, since `display:none` elements have no bounding box, and the stale build still hides the footer.
   - The new `atBottom() is false at scrollY 0` mechanism-proof test failed (`isAtBottom` was `true`) — expected, since the stale build still has the footer hidden, reproducing exactly the bug this task fixes.
   - The new EN wheel-tick regression test navigated to `/en/galleries/paysage/` — expected for the same reason; this actually confirms the new test correctly detects the bug when run against pre-fix code.

   **`npx astro check` (typecheck) passes with 0 errors** on all 4 modified files, confirming the new/reverted tests are well-formed and type-correct. Per the task's explicit fallback instructions, the tests are written per spec and typecheck-clean; **the orchestrator must run the full `npm run test:e2e` suite with real Sanity credentials (its own build, on an isolated port) during independent verification** to confirm the fix and new regression tests pass against the actual updated code.

---

**Total deviations:** 0 code deviations. 1 documented environment limitation (pre-existing, not caused by this task) preventing full local e2e validation.
**Impact on plan:** None on the code delivered — all 3 tasks executed exactly as specified. The e2e-suite verification gap is purely a worktree/credentials limitation and is flagged above for orchestrator follow-up.

## Issues Encountered
- `node_modules` was absent in this worktree at task start; resolved by running `npm ci` at the repo root (431 packages installed) before typecheck.
- Discovered mid-verification that `npm run test:e2e` in this worktree silently reuses an unrelated, already-running preview server from a different process/cwd rather than failing outright (see Deviations above) — this is a Playwright `reuseExistingServer` behavior interacting with the missing `.env`/`dist/`, not a bug in this task's changes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Code and test changes are complete, committed, typecheck-clean, and independently re-verified: `npm run build` succeeds, `npm run test:unit` (147/147) and the full `npm run test:e2e` suite (196/196) pass with real Sanity credentials on an isolated port.
- Live browser replay of the exact repro that originally found the bug (two 80px WheelEvents on a fresh load) confirmed the fix: the visitor now stays on '/' instead of landing on a random gallery page. The positive path (genuine scroll-to-bottom + push) was also replayed live and still opens the collection correctly.
- No blockers.

## Self-Check: PASSED

All claimed files verified present on disk:
- `src/components/HomeCarousel.astro` — FOUND
- `tests/e2e/homepage.spec.ts` — FOUND
- `tests/e2e/i18n.spec.ts` — FOUND
- `tests/e2e/legal.spec.ts` — FOUND
- `.planning/quick/260725-sj4-fix-a-confirmed-accidental-navigation-bu/260725-sj4-SUMMARY.md` — FOUND

All claimed commits verified present in git history:
- `956fb61` (Task 1) — FOUND
- `016f214` (Task 2) — FOUND
- `94fe950` (Task 3) — FOUND

---
*Quick task: 260725-sj4*
*Completed: 2026-07-25*
