---
phase: quick-260723-qiz
plan: 01
subsystem: ui
tags: [astro, header, editorial-layout, e2e, playwright]

# Dependency graph
requires:
  - phase: 12-data-fetch-routes
    provides: Éditions overview/detail bilingual routes (src/pages/editions/index.astro, src/pages/en/editions/index.astro)
provides:
  - Éditions overview pages (fr/en) render the same solid, in-flow, ink-on-white header as About/Contact instead of the hero-scrim transparent header
  - Regression assertion guarding the overview against the transparent variant regressing back
affects: [editions, site-header, header-coherence]

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - src/pages/editions/index.astro
    - src/pages/en/editions/index.astro
    - tests/e2e/site-header.spec.ts

key-decisions:
  - "Removed the headerVariant=\"transparent\" prop entirely rather than passing headerVariant=\"solid\" explicitly, since BaseLayout already defaults to 'solid' — matches about.astro/contact.astro's own convention of omitting the prop."
  - "Left editions/[slug].astro and en/editions/[slug].astro untouched — those DETAIL pages correctly keep the transparent hero-scrim header because they render a real full-bleed dark hero, mirroring galleries/[slug].astro."

patterns-established: []

requirements-completed: [EDN-02]

coverage:
  - id: D1
    description: "Éditions overview pages (fr/en) use BaseLayout's solid header default (in-flow, ink nav text, hairline bottom border) instead of the transparent hero-scrim variant"
    requirement: "EDN-02"
    verification:
      - kind: e2e
        ref: "tests/e2e/site-header.spec.ts#Shared SiteHeader — Editions overview uses the solid variant (quick task 260723-qiz)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Éditions DETAIL pages (editions/[slug].astro) remain unchanged, still using the transparent hero-scrim header matching galleries/[slug].astro"
    verification:
      - kind: other
        ref: "grep verification: headerVariant=\"transparent\" still present in src/pages/editions/[slug].astro and src/pages/en/editions/[slug].astro"
        status: pass
    human_judgment: false

duration: 25min
completed: 2026-07-23
status: complete
---

# Quick Task 260723-qiz: Fix Éditions Overview Header Coherence Summary

**Removed the mismatched `headerVariant="transparent"` override from both Éditions overview page twins so they fall back to BaseLayout's `solid` default, matching About/Contact's in-flow ink-on-white header, and added a Playwright regression guard against it recurring.**

## Performance

- **Duration:** 25 min
- **Started:** 2026-07-23T16:50:00Z
- **Completed:** 2026-07-23T17:15:42Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- `/editions/` and `/en/editions/` now render the shared solid editorial header (ink nav text, hairline bottom border, in normal document flow) identical to `/about/` and `/contact/` — no more illegible white-on-dark-scrim nav text floating over the page content.
- Éditions DETAIL pages (`editions/[slug].astro`, `en/editions/[slug].astro`) verified untouched — still correctly use the transparent hero-scrim header matching `galleries/[slug].astro`.
- Added a Playwright regression guard (`tests/e2e/site-header.spec.ts`) asserting the overview header carries `site-header--solid` (not `site-header--transparent`) and is not absolutely positioned, for both locales.

## Task Commits

Each task was committed atomically:

1. **Task 1: Drop the transparent header override on both Éditions overview twins** - `1ff46a2` (fix)
2. **Task 2: Add a regression guard asserting the overview uses the solid variant** - `d2c7d6f` (test)

_Note: this quick task's plan had no `docs:` plan-metadata commit step of its own — SUMMARY/STATE/PLAN docs commit is handled by the orchestrator, per the constraints of this execution._

## Files Created/Modified
- `src/pages/editions/index.astro` - Removed `headerVariant="transparent"` from the `<BaseLayout>` opening tag, now defaults to `solid`
- `src/pages/en/editions/index.astro` - Identical removal, bilingual parity preserved
- `tests/e2e/site-header.spec.ts` - Added a `test.describe` block asserting the overview header uses `site-header--solid` (not `--transparent`) and is not absolutely positioned, for `/editions/` and `/en/editions/`

## Decisions Made
- Removed the prop entirely instead of setting it to `"solid"` explicitly, matching the existing convention already used by `about.astro`/`contact.astro` (both omit `headerVariant` and rely on BaseLayout's default).
- No CSS changes were made to `.editions-list` styles — the plan's analysis (confirmed during implementation) that the existing top-hairline/eyebrow/h1 padding rhythm already matches `about.astro`'s solid-header layout held true; the in-flow solid header sits cleanly above the content with no spacing adjustment needed.

## Deviations from Plan

None — plan executed exactly as written. Both tasks completed with no auto-fixes, no blocking issues, and no architectural questions.

One environment note (not a deviation from the plan's code, purely a local verification prerequisite): the worktree had no `.env` file (gitignored, not carried into git worktrees), which caused the Sanity-backed build to fail with a "Missing SANITY_PROJECT_ID" error. Copied the existing `.env` from the main repo checkout into the worktree (never staged/committed — confirmed via `git status` before and after) to run `npm run build` and the Playwright suite locally, then removed the copy after tests passed. This is standard local dev environment setup, not a code change.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Header coherence between the Éditions overview and the rest of the editorial site (About/Contact) is restored; no known follow-up work from this task.
- Full e2e suite (165 tests across `tests/e2e/`) passes, including the full `site-header.spec.ts` suite (41 tests, up from 39).

---
*Phase: quick-260723-qiz*
*Completed: 2026-07-23*

## Self-Check: PASSED

- FOUND: src/pages/editions/index.astro
- FOUND: src/pages/en/editions/index.astro
- FOUND: tests/e2e/site-header.spec.ts
- FOUND commit: 1ff46a2
- FOUND commit: d2c7d6f
