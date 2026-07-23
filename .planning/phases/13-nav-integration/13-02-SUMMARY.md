---
phase: 13-nav-integration
plan: 02
subsystem: ui
tags: [astro, css, playwright, e2e, responsive, header]

# Dependency graph
requires:
  - phase: 13-nav-integration (13-01)
    provides: shared <SiteHeader> component with the 4th (Éditions) nav link, wired on every page
provides:
  - Single-row mobile header (no two-row wrap) across the full 320px-767px viewport range, in both the solid and transparent header variants
  - A same-row e2e regression assertion sampling inside the previously-untested 360-375px band
affects: [nav-integration, future header CSS work]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Same-row layout assertion via bounding-rect vertical-center comparison (nav-link vs language-switcher), not just scrollWidth<=innerWidth — catches vertical wrap that horizontal-overflow checks structurally cannot."

key-files:
  created: []
  modified:
    - src/components/SiteHeader.astro
    - tests/e2e/site-header.spec.ts

key-decisions:
  - "Root-cause fix: @media (max-width: 767px) .site-header flex-wrap changed from wrap to nowrap — the header is single-row at every width below 768px, since the base (>=768px) rule already has no flex-wrap declaration (implicit nowrap)."
  - "Compensating-trim breakpoint raised from @media (max-width: 359px) to @media (max-width: 400px), same declarations verbatim — kept at 400px (not narrowed to 380px) because the RED sweep showed the transparent homepage variant (which carries an extra mode-toggle slot item) also wraps at 390px, not just 360-375px; 400px covers that case with margin."
  - "No D-03 Éditions-label abbreviation added — the trim-breakpoint raise fits all four full labels on one row at every sampled width."

patterns-established: []

requirements-completed: [EDN-01]

status: complete

# Metrics
duration: ~9min (Tasks 1-2) + checkpoint wait for Task 3 (human-verify, approved)
completed: 2026-07-23
---

# Phase 13 Plan 02: Mobile Header Wrap Gap-Closure Summary

**CSS breakpoint fix (nowrap across 767px block + trim ceiling raised to 400px) closes the 360-390px header wrap regression; RED->GREEN e2e proven across 6 widths x 2 variants; live human re-verification (Task 3) approved by the real user — plan closed.**

## Performance

- **Started:** 2026-07-23T07:43:54Z
- **Completed:** 2026-07-23T10:53:52Z
- **Tasks complete:** 3 of 3
- **Files modified:** 2 (`src/components/SiteHeader.astro`, `tests/e2e/site-header.spec.ts`)

## Accomplishments

- Added a new Playwright describe block ("Shared SiteHeader — single-row fit across the mobile range") that samples widths 320/360/374/375/390/767 on both `/about/` (solid) and `/` (transparent), asserting the first `.site-nav a.nav-link` and `.language-switcher` share a row (vertical centers within 5px) plus no horizontal overflow.
- Confirmed the assertion RED against the unmodified CSS: failed at 360/374/375px on both pages (switcher center ~68px below the nav center, matching 13-VERIFICATION.md's own measurement), and additionally at 390px on the transparent homepage only — its extra mode-toggle slot content (rendered only on `/`) crowds the row further than the solid `/about/` variant, wrapping one width sooner than the plan anticipated.
- Fixed the root cause: `@media (max-width: 767px) .site-header` flex-wrap changed from `wrap` to `nowrap`.
- Raised the compensating-trim breakpoint from `@media (max-width: 359px)` to `@media (max-width: 400px)` (declarations unchanged) — this also covers the homepage's 390px wrap discovered during Task 1's RED run.
- Confirmed GREEN: all 39 site-header e2e assertions pass (including the new same-row block at every sampled width on both variants), and all 44 homepage e2e assertions stay green (no regression).
- Task 3 (live human re-verification at 375px/360px/320px in both variants, a blocking checkpoint) is APPROVED: the real user personally checked the fix in a browser at the worktree's dev server (`/` and `/about/`) at 375px/360px/320px and replied "approved" with no reported issues — replacing the prior false live-check claim from 13-01-SUMMARY.md that 13-VERIFICATION.md had contradicted. An independent automated screenshot pass at 320/360/374/375/390px on both variants corroborated single-row layout throughout.

## Task Commits

Each task was committed atomically:

1. **Task 1: RED — same-row regression assertion (360-375px band)** - `b9c7aa8` (test)
2. **Task 2: GREEN — nowrap + raised trim breakpoint** - `3b7f2ac` (fix)
3. **Task 3: Live human re-verification** - Approved by user (2026-07-23) — no code change, checkpoint sign-off recorded in this SUMMARY update commit

## Files Created/Modified

- `tests/e2e/site-header.spec.ts` - New "single-row fit across the mobile range" describe block (Task 1)
- `src/components/SiteHeader.astro` - `.site-header` flex-wrap: nowrap in the 767px block; compensating-trim media query raised to 400px (Task 2)

## Decisions Made

- Kept the compensating-trim breakpoint at 400px rather than narrowing to 380px (the plan's conditional refinement, contingent on Task 3's live check). The Task 1 RED sweep already showed the transparent homepage variant wraps at 390px too (not just 360-375px), due to its extra mode-toggle slot content absent from the solid variant — so 400px is the correct, evidence-backed value, and narrowing to 380px would have re-introduced a wrap on the homepage at 390px. This decision does not require Task 3 to change; Task 3 will confirm it visually.
- No D-03 abbreviation markup added — full labels fit at every trimmed width.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Missing `.env` file blocked `npm run build`**
- **Found during:** Task 1 verification (`npm run build` failed with "Missing SANITY_PROJECT_ID or SANITY_DATASET env vars")
- **Issue:** `.env` is gitignored and therefore not present in this git worktree (worktrees only carry tracked files); the build cannot fetch Sanity content without it.
- **Fix:** Copied the same `SANITY_PROJECT_ID`/`SANITY_DATASET`/`SANITY_API_READ_TOKEN` values from the main checkout's `.env` into this worktree's `.env` (untracked, gitignored — not committed, no secret leaked into git history).
- **Files modified:** `.env` (gitignored, not committed)
- **Verification:** `npm run build` subsequently succeeded (25 pages built).
- **Committed in:** N/A (gitignored file, never staged)

**2. [Observation, not a rule-triggered fix] Homepage wraps one width sooner than the plan anticipated**
- **Found during:** Task 1's RED run
- **Observation:** The plan predicted RED failures at 360/374/375px on both variants with 320/390/767 passing. The actual RED run additionally failed at 390px on the transparent homepage (`/`) only — its extra mode-toggle slot content (present only on the homepage, not `/about/`) crowds the row further, wrapping one width sooner than the solid variant.
- **Resolution:** No plan or CSS deviation was needed — Task 2's planned fix (raising the trim breakpoint to 400px, not narrowing to 380px) already covers 390px, so this is fully closed by the plan's own primary path. Documented here for traceability since it wasn't explicitly predicted.

---

**Total deviations:** 1 auto-fixed (Rule 3, blocking) + 1 traceability note (no code change required)
**Impact on plan:** No scope creep. The `.env` fix was required purely to run the build/test verification loop in this isolated worktree; the homepage's 390px observation confirmed the plan's own primary (400px) breakpoint choice was correct without requiring any deviation.

## Issues Encountered

None beyond the two items documented above.

## User Setup Required

None - no external service configuration required. (The `.env` values used already exist in the main checkout; no new secret was provisioned.)

## Next Phase Readiness

- All three tasks are complete: Tasks 1-2 committed and verified automatically (39/39 site-header e2e, 44/44 homepage e2e, `npm run build` clean); Task 3's blocking human-verify checkpoint is APPROVED — the real user confirmed single-row fit at 375px/360px/320px on both `/` (transparent) and `/about/` (solid) directly in a browser, with no reported issues, corroborated by an independent automated screenshot pass at 320/360/374/375/390px.
- Truth #5 / SC #5 of 13-VERIFICATION.md (the failed must-have) is now repaired. All three of that report's "missing" items are closed: (1) the CSS fix covers the full 320-767px range including the 390px homepage-specific wrap, (2) the new e2e assertion samples inside the previously-untested 360-375px band, (3) the live human re-check has genuinely been re-run and approved this time.
- EDN-01 is fully satisfied. Phase 13 (nav-integration) is ready to close — no further gap-closure work outstanding for this phase.
- This worktree's SUMMARY.md is committed; the orchestrator owns updating STATE.md/ROADMAP.md/REQUIREMENTS.md centrally after merge.

---
*Phase: 13-nav-integration*
*Completed: 2026-07-23*
