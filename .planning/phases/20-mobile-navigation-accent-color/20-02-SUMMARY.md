---
phase: 20-mobile-navigation-accent-color
plan: 02
subsystem: testing
tags: [playwright, e2e, regression-net, site-header, home-13]

# Dependency graph
requires:
  - phase: 19-site-wide-visual-polish
    provides: "PageTitleHeader.astro D-05 regression-net-first pattern (7-page x 5-width overflow matrix) this plan's mobile-nav net mirrors"
provides:
  - "tests/e2e/mobile-nav.spec.ts — Phase 20 (HOME-13) regression net: inertness net for every non-homepage SiteHeader consumer at phone+desktop widths in both locales, a desktop-unchanged net for the homepage (ROADMAP SC #4), and a client-bundle-leakage tripwire (EXPECTED_SCRIPT_COUNT=4) for /about/ and /contact/"
  - "Realigned tests/e2e/homepage-chrome-nav.spec.ts, homepage-mobile-responsive.spec.ts, site-header.spec.ts — no longer assert an inline homepage nav row at phone widths (a contract HOME-13 changes), and the single-row-fit sweep can no longer pass vacuously on collapsed zero-height rects"
affects: [20-03-mobile-nav-behavior, 20-04-accent-color]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Regression-net-first for shared-component changes: write and prove the net green on the UNMODIFIED tree before the risky change lands (mirrors Phase 19's D-05 pattern)"
    - "toBeHidden() instead of toHaveCount(0) for assertions that must hold both before AND after a future change adds the (initially-hidden) element — satisfied whether the element is absent or present-but-not-rendered"
    - "Non-vacuity guards on geometry-based same-row/visibility checks: assert element height/rect > 0 before comparing centers, so a collapsed (display:none) element can't silently satisfy a '<=5px difference' check via 0===0"

key-files:
  created:
    - tests/e2e/mobile-nav.spec.ts
  modified:
    - tests/e2e/homepage-chrome-nav.spec.ts
    - tests/e2e/homepage-mobile-responsive.spec.ts
    - tests/e2e/site-header.spec.ts

key-decisions:
  - "INLINE_NAV_PATHS covers every non-homepage SiteHeader consumer (About/Contact both locales, one gallery detail, Éditions overview) plus a dynamically-discovered édition detail page — no literal slug hardcoded"
  - "EXPECTED_SCRIPT_COUNT baseline confirmed empirically at 4 by grepping the built dist/about/index.html and dist/contact/index.html (not guessed from the plan's stated value)"
  - "homepage-chrome-nav.spec.ts's Instagram-at-393px test split in two: the homepage keeps only its overflow-guard obligation, the inline-nav Instagram visibility claim moves to /about/ (a page whose header this phase does not touch)"
  - "site-header.spec.ts's single-row-fit sweep split by page instead of run against both /about/ and / at every width: phone widths (320-767px) now scoped to /about/ only; a new >=768px loop covers the homepage, which keeps its inline header there permanently"

patterns-established:
  - "For phases that extend a proven per-page-regression hotspot (SiteHeader.astro), the regression-net plan runs BEFORE the behavior-adding plan in the same phase, and its own acceptance criteria require `git status --porcelain src/` to stay empty — proof the net is real, not fitted to a change already made"

requirements-completed: []  # HOME-13 is not complete after this plan — this plan only writes the regression net; the mobile-nav behavior itself lands in plans 20-03/20-04.

coverage:
  - id: D1
    description: "tests/e2e/mobile-nav.spec.ts — non-vacuous inertness net (4 describe blocks: per-page inertness sweep, édition-detail inertness, homepage-desktop-unchanged, client-bundle-leakage tripwire), proven green on the unmodified src/ tree, twice, no flake"
    verification:
      - kind: e2e
        ref: "tests/e2e/mobile-nav.spec.ts (17 tests, chromium project) — run twice consecutively"
        status: pass
    human_judgment: false
  - id: D2
    description: "Three pre-existing specs realigned so no assertion encodes an inline homepage nav row at phone widths and the single-row-fit sweep can no longer pass vacuously on collapsed rects; full local e2e suite (326 tests, chromium + webkit-mobile) green with src/ untouched and visual.spec.ts-snapshots/shared-site-header.png not re-baselined"
    verification:
      - kind: e2e
        ref: "npx playwright test (both projects) — 326/326 passing"
        status: pass
    human_judgment: false

# Metrics
duration: ~40min
completed: 2026-08-03
status: complete
---

# Phase 20 Plan 02: Mobile-Nav Regression Net Summary

**Wrote and proved green (on the unmodified `src/` tree) a Playwright regression net for `SiteHeader.astro`'s upcoming opt-in mobile-nav mode, then realigned three pre-existing specs that encoded a phone-width homepage nav contract HOME-13 will change — including closing a vacuous-pass hole in a same-row geometry check.**

## Performance

- **Duration:** ~40 min
- **Started:** 2026-08-03T19:53:00Z (approx.)
- **Completed:** 2026-08-03T20:03:36Z
- **Tasks:** 2
- **Files modified:** 4 (1 created, 3 modified)

## Accomplishments

- New `tests/e2e/mobile-nav.spec.ts` (17 tests): an inertness net proving every non-homepage `SiteHeader` consumer (About/Contact in both locales, a gallery detail page, the Éditions overview, and a dynamically-discovered édition detail page) renders zero mobile-nav markup and keeps its four inline `.nav-link` items plus inline language switcher visible at both phone (393px) and desktop (1280px) widths; a homepage-desktop-unchanged net at 1280px using `toBeHidden()` (not `toHaveCount(0)`) so it stays true across the coming change; and a client-bundle-leakage tripwire confirming `/about/` and `/contact/` still serve exactly 4 `<script>` elements each.
- Retired the one contract these pre-existing specs encoded that HOME-13 will intentionally break — a homepage inline nav row visible at phone widths — while adding non-vacuity guards (`navHeight`/`switcherHeight` > 0) so the `site-header.spec.ts` same-row check can never again pass by both rects collapsing to zero.
- Confirmed the `EXPECTED_SCRIPT_COUNT` baseline (4) empirically against the actual built `dist/about/index.html` and `dist/contact/index.html`, not the plan's stated value taken on faith.
- Full local e2e suite (326 tests across both Playwright projects) green twice in a row with `src/` completely untouched and `tests/e2e/visual.spec.ts-snapshots/shared-site-header.png` not re-baselined.

## Task Commits

1. **Task 1: Write the inertness + desktop-unchanged net and prove it green pre-change** - `2e2b749` (test)
2. **Task 2: Retire the three pre-existing assertions that encode a contract HOME-13 changes** - `8dd624a` (test)

**Plan metadata:** pending (this SUMMARY's own commit)

## Files Created/Modified

- `tests/e2e/mobile-nav.spec.ts` - New Phase 20 regression net: inertness sweep, édition-detail inertness, homepage-desktop-unchanged net, client-bundle-leakage tripwire
- `tests/e2e/homepage-chrome-nav.spec.ts` - Split the 393px Instagram test; homepage keeps overflow-guard only, inline-nav Instagram visibility claim moved to `/about/`
- `tests/e2e/homepage-mobile-responsive.spec.ts` - Replaced a strict-mode-fragile unscoped language-switcher locator with a header-scoped one; added an `/about/` sibling test preserving the 320px switcher-reachability contract
- `tests/e2e/site-header.spec.ts` - Split the "single-row fit" sweep by page/width-range (phone widths → `/about/` only, `>=768px` → homepage); added non-zero-height guards closing the vacuous-pass hole

## Decisions Made

- Ran the two Playwright verification commands against an isolated, out-of-repo, never-committed local config (`playwright.local.config.ts`, deleted before each commit) bound to port 4999 rather than the project's default `localhost:4321` — a concurrent session's `astro dev` process already occupied that port and was confirmed (via `curl`) to serve a stale/corrupted dev-mode response, not this worktree's own build. This follows the plan's own verification step 4 ("Confirm the preview server on port 4321 serves THIS worktree's dist/ before trusting results") by routing around the conflict instead of touching the other session's process or the repo's own `playwright.config.ts`.
- Copied `.env` from the main checkout into this worktree (git-ignored in both places, confirmed via `git check-ignore`) so `npm run build` could resolve `SANITY_PROJECT_ID`/`SANITY_DATASET` — worktrees do not carry over untracked files.
- Left `requirements-completed` empty in this SUMMARY's frontmatter: this plan only builds the regression net, it does not implement HOME-13's actual mobile-nav behavior (that lands in plans 20-03/20-04 of this same phase).

## Deviations from Plan

None — plan executed exactly as written. Two blocking prerequisites (missing `.env`, a stale foreign server occupying the shared preview port) were resolved via Rule 3 (auto-fix blocking issues) using non-destructive, non-committed workarounds, both documented above under Decisions Made rather than as code deviations, since neither touched `src/`, the plan's task list, or any acceptance criterion.

## Issues Encountered

- `npm run build` initially failed with "Missing SANITY_PROJECT_ID or SANITY_DATASET env vars" — this worktree had no `.env` file (untracked files aren't carried into new worktrees). Resolved by copying the main checkout's git-ignored `.env` into the worktree.
- The first `mobile-nav.spec.ts` run against the default `localhost:4321` reported script counts of 14/18 instead of the expected 4 for `/about/`/`/contact/`, and a corrupted concatenated FR+EN `<title>`. Diagnosed via `lsof -i :4321` and `curl`: a concurrent session's `astro dev` process (main checkout, PID 12470) was already bound to that port, and Playwright's `reuseExistingServer` (true outside CI) silently reused it instead of starting this worktree's own `preview` server. Resolved with a temporary, untracked, never-committed `playwright.local.config.ts` bound to port 4999, deleted immediately after each verification run and confirmed absent via `git status --porcelain` before every commit.
- One authoring self-correction: an early draft of a `site-header.spec.ts` code comment quoted the literal string "Passer en anglais" (the switch-hint text the acceptance criteria requires to be fully gone from this file), which caused the acceptance criterion's own `grep -c` check to return 1 instead of 0. Reworded the comment to describe the removed locator without quoting the string; re-verified the grep returns 0 and the targeted spec still passes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The regression net (`tests/e2e/mobile-nav.spec.ts`) is in place and green, giving plans 20-03 (mobile-nav behavior) and 20-04 (accent color) an objective, non-vacuous guard against leaking the new opt-in mode onto any non-homepage `SiteHeader` consumer or the homepage's own desktop header.
- The three realigned specs no longer block plan 20-03: nothing in the current suite asserts the phone-width inline homepage nav row that plan 20-03 will replace.
- No blockers for plan 20-03/20-04. One local-environment note for future sessions in this same worktree tree: verify which process is bound to `localhost:4321` before trusting default `npm run test:e2e` output whenever multiple concurrent sessions are active on this repo (per project memory: this is the norm, not the exception, on this repo).

---
*Phase: 20-mobile-navigation-accent-color*
*Completed: 2026-08-03*
