---
phase: 15-about-page-editorial-redesign
plan: 02
subsystem: ui
tags: [about, layout, editorial, page-title-header, typography, sketch-014]

# Dependency graph
requires:
  - phase: 15-about-page-editorial-redesign (plan 01)
    provides: "Named sketch-014 winner (Variant A — Settle & Restyled Two-Column Grid), D-05/D-07/empty-intro resolutions"
provides:
  - "About page giant title/eyebrow/halftone/divider now render via the shared, unmodified PageTitleHeader component (ABOUT-03)"
  - "Static editorial composition matching sketch-014 Variant A: standalone biography lead, circular portrait accent in a bio-row, static hero exhibition band, restyled two-column numbered sections (ABOUT-04 static layer)"
  - "About e2e suite re-pointed at the new PageTitleHeader-based structure, ready for 15-03 to layer motion-specific assertions on top"
affects: [15-about-page-editorial-redesign]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Page-scoped :global() CSS suppression to neutralize a shared component's unused prop slot (PageTitleHeader's intro/divider) without editing the shared component — same pattern already used in HomeCarousel.astro/EditionsOverviewBody.astro."

key-files:
  created: []
  modified:
    - src/components/AboutPageBody.astro
    - tests/e2e/about.spec.ts

key-decisions:
  - "Task 1 wired PageTitleHeader in and retired the local eyebrow/h1/hero-grid; Task 2 restructured the resting composition (bio-row, sections rhythm); no new Props field was needed since D-05 resolved to a pure motion settle (no reveal-target markup required in this plan — 15-03 adds only the scroll driver on top of the existing .about-page__exhibition static band)."
  - "Empty-intro/divider column suppressed via `.about-page :global(.page-title-header__intro), .about-page :global(.page-title-header__divider) { display: none; }` plus a `.about-page :global(.page-title-header) { grid-template-columns: 1fr; }` override at >=760px — exactly the sketch-014 winner's resolution, PageTitleHeader.astro itself untouched."
  - "The former 14px section-number index (.about-page__number) now uses the Body role (16px), keeping weight-600/uppercase/0.08em — composition holds at exactly 4 font-size roles per UI-SPEC."

patterns-established: []

requirements-completed: [ABOUT-03, ABOUT-04]

coverage:
  - id: D1
    description: "About's giant title/eyebrow/halftone/divider render via the shared, unmodified PageTitleHeader component on both /about/ and /en/about/, with the old local eyebrow/h1 fully retired."
    requirement: "ABOUT-03"
    verification:
      - kind: unit
        ref: "npm run typecheck (astro check) — 0 errors"
        status: pass
      - kind: e2e
        ref: "tests/e2e/about.spec.ts#About retires its local eyebrow in favor of the shared PageTitleHeader"
        status: unknown
      - kind: e2e
        ref: "tests/e2e/about.spec.ts#About uses the shared editorial type scale and page frame"
        status: unknown
    human_judgment: true
    rationale: "This worktree's build cannot reach the Sanity Content Lake (SANITY_PROJECT_ID/SANITY_DATASET unset — real secrets only exist in CI), so `npm run build`/`npm run test:e2e` cannot execute here. Typecheck (0 errors) and manual selector/specificity review confirm correctness, but the e2e assertions themselves have not been run in this environment — verifier must run them where Sanity credentials are available."
  - id: D2
    description: "Resting composition matches sketch-014 Variant A: standalone biography lead paragraph, circular 112px/72px portrait accent in a bio-row, static hero exhibition band, two-column numbered sections re-skinned to the new spacing rhythm — all existing bio/practice/medium copy preserved verbatim in both locales."
    requirement: "ABOUT-04"
    verification:
      - kind: unit
        ref: "npm run typecheck (astro check) — 0 errors"
        status: pass
      - kind: e2e
        ref: "tests/e2e/about.spec.ts#the portrait stays a small circular accent while the exhibition image spans the editorial frame"
        status: unknown
      - kind: e2e
        ref: "tests/e2e/about.spec.ts#French/English About page renders non-empty CMS bio, practice, and medium copy"
        status: unknown
    human_judgment: true
    rationale: "Same environmental gap as D1 — e2e suite could not be executed in this worktree (missing Sanity build credentials). Visual/structural correctness needs confirmation once run against a real Sanity dataset or in CI."

# Metrics
duration: 10min
completed: 2026-07-29
status: complete
---

# Phase 15 Plan 02: About Page Title Swap & Static Composition Summary

**About's giant title now renders via the shared PageTitleHeader component (retiring the local eyebrow/h1), and the resting layout below it matches the sketch-014 Variant A winner: standalone lead paragraph + circular portrait bio-row, static hero band, re-skinned two-column numbered sections.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-07-29T10:12:11+02:00
- **Completed:** 2026-07-29T10:21:09+02:00
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments
- `AboutPageBody.astro` now imports and calls the shared `PageTitleHeader` (`heading`, `headingId="about-title"`, `intro=""`), fully retiring the local `.about-page__eyebrow`/`.about-page__identity`/`.about-page__hero` grid and the dead `.about-page h1` rule — About renders the exact same title/eyebrow/halftone/divider identity as Contact and Éditions.
- The decorative "01"/"02" section-number index moved from the deleted 14px Label role to the Body role (16px, weight-600/uppercase/0.08em) — the composition holds at exactly 4 font-size roles (Body, Heading, Display, Lead), per UI-SPEC.
- PageTitleHeader's empty `intro`/divider (unavoidable since About passes `intro=""` per D-01) are suppressed via page-scoped `:global()` CSS, exactly matching sketch-014's Variant A resolution — `PageTitleHeader.astro` itself was never touched.
- The resting composition below the header now follows sketch-014 Variant A: biography lead + circular 112px/72px portrait in a new `.about-page__bio-row` flex row (hairline top border on the row, mobile stacks `column-reverse`), the static hero exhibition band unchanged in structure (`.about-page__exhibition` retained as 15-03's stable hook), and the two hardcoded numbered `<section>` blocks re-skinned to the new spacing rhythm (`margin-top: clamp(--space-2xl, 5vw, 64px)`).
- `tests/e2e/about.spec.ts` re-pointed at the new structure: title/eyebrow hierarchy read from `#about-title`/`.page-title-header__eyebrow`, a new test proves the old `.about-page__eyebrow` is gone (count 0) and PageTitleHeader's halftone/divider siblings render, and the portrait/exhibition layout test now anchors on `.about-page__bio-row` instead of the removed `.about-page__hero`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire in PageTitleHeader and retire the old in-body title/eyebrow (ABOUT-03, D-01)** - `03bcc5e` (feat)
2. **Task 2: Build the static editorial composition per the sketch-014 winner (ABOUT-04, D-02/D-03/D-07, D-05 static markup)** - `bca2c4b` (feat)
3. **Task 3: Re-point the About e2e suite at the new PageTitleHeader-based structure** - `5b36821` (test)

## Files Created/Modified
- `src/components/AboutPageBody.astro` - Imports/calls `PageTitleHeader`; retires the local eyebrow/h1/hero-grid; standalone lead paragraph; `.about-page__bio-row` flex wrapper for lead+portrait; section-number restyled to Body role; empty-intro/divider suppression; sections top-margin re-skinned to the new rhythm.
- `tests/e2e/about.spec.ts` - Type-scale/hierarchy test re-pointed at `#about-title`/`.page-title-header__eyebrow`; new eyebrow-retirement/PageTitleHeader-sibling test added; portrait/exhibition layout test re-anchored on `.about-page__bio-row`.

## Decisions Made
- No new `Props` field was added to `AboutPageBody`/`about.astro`/`en/about.astro` — D-05 resolved to a pure motion settle in the 15-01 sketch (no text reveal into a section), so this plan's static hero band needed no structural reveal-panel markup. 15-03 will layer the pin+shrink scroll driver directly onto the existing `.about-page__exhibition` markup.
- Split Task 1/Task 2 exactly as the plan specified: Task 1 handles the PageTitleHeader wiring/retirement (title identity), Task 2 handles the full resting-composition restyle (bio-row, sections rhythm) — kept as two atomic commits per the plan's task boundaries.

## Deviations from Plan

None — plan executed exactly as written. Task 1's `tdd="true"` flag included a `<behavior>` block but the task's own `<verify>`/`<action>` specified only `npm run typecheck` with no dedicated unit-test file to author (this is a presentation-only Astro component restyle with no existing unit-test harness for structural assertions); e2e coverage for the behavior is what Task 3 already delivers. No literal RED/GREEN test-commit cycle was performed for Task 1 as a result — this is noted here for transparency, not logged as a Rule-based auto-fix, since no deviation from the plan's own verify/action text occurred.

## Issues Encountered

**Environmental gap (pre-existing, not introduced by this plan):** This worktree cannot reach the Sanity Content Lake — `SANITY_PROJECT_ID`/`SANITY_DATASET` are unset locally (real values exist only as GitHub Actions secrets, per `.github/workflows/deploy.yml`), so `npm run build` and `npm run test:e2e -- about.spec.ts` both fail before reaching this plan's changes (`Missing SANITY_PROJECT_ID or SANITY_DATASET env vars`). Per the plan's own explicit allowance ("If the executor's worktree lacks the Sanity build env and cannot build/serve, do NOT weaken the tests — flag the environmental gap in the SUMMARY"), the e2e assertions were re-pointed correctly (verified by careful manual selector/specificity/DOM-structure review against the actual component markup and `PageTitleHeader.astro`'s own selectors) but could not be executed in this environment. `npm run typecheck` (0 errors) and `npx eslint tests/e2e/about.spec.ts` (clean) were run and passed. The `.planning/phases/15-about-page-editorial-redesign/` phase verifier or CI should run `npm run test:e2e -- about.spec.ts` against a real/staging Sanity dataset before this plan is considered fully verified. Note also: `playwright.config.ts`'s `webkit-mobile` project is scoped to `**/*.smoke.spec.ts` only, so `about.spec.ts` only ever runs under the `chromium` project regardless of environment — the plan's acceptance criterion mentioning both projects does not apply to this spec file's actual `testMatch` scoping.

## User Setup Required

None - no external service configuration required by this plan itself. (The pre-existing Sanity credential gap above is an environment-setup item, not something this plan introduces or can resolve.)

## Next Phase Readiness
- `AboutPageBody.astro`'s structure (`.about-page__bio-row`, static `.about-page__exhibition`, re-skinned `.about-page__sections`) is ready for 15-03 to layer the pinned scroll-scrubbed shrink (D-04/D-05 pure settle) directly onto the existing `.about-page__exhibition` markup, porting `DetailHero.astro`'s vanilla-JS driver mechanism as documented in `15-PATTERNS.md`.
- No blockers for 15-03. The one open item is running the re-pointed e2e suite against a real Sanity dataset (or in CI) to confirm the assertions pass as authored — flagged above, not a plan-scope blocker.

---
*Phase: 15-about-page-editorial-redesign*
*Completed: 2026-07-29*
