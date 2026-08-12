---
phase: quick-260812-fq3
plan: 1
subsystem: ui
tags: [css, sanity-studio, react, editorial-dashboard]

requires:
  - phase: quick-260812-f22
    provides: widened 152px pipeline node column and split not-started/waiting branches in resolvePromoteRow()
provides:
  - Pipeline node label no longer reserves a surplus second line of height
  - Not-started detail no longer repeats the update-button instruction already visible above it
affects: []

tech-stack:
  added: []
  patterns:
    - "CSS guard tests assert on extracted rule blocks (extractRuleBlocks), never file-wide property greps, since properties like min-height legitimately repeat elsewhere in the stylesheet"

key-files:
  created: []
  modified:
    - sanity/editorial/EditorialDashboard.css
    - sanity/editorial/deployment.ts
    - tests/unit/editorial-dashboard-css.test.ts
    - tests/unit/deployment.test.ts

key-decisions:
  - "Deleted only the min-height declaration on .editorial-dashboard__pipeline-node-label; kept text-wrap: balance as the safety net for any future wrap at a narrower viewport."
  - "The not-started and in-flight-wait branches of resolvePromoteRow() now share the exact same detail string and differ only in title — documented in an extended comment so a future reader does not re-merge them and reintroduce the misleading-wait bug 260812-f22 fixed."

patterns-established: []

requirements-completed: [QUICK-260812-fq3]

coverage:
  - id: D1
    description: "Pipeline node label no longer reserves a two-line min-height; text-wrap: balance remains as safety net."
    requirement: "QUICK-260812-fq3"
    verification:
      - kind: unit
        ref: "tests/unit/editorial-dashboard-css.test.ts#leaves the pipeline node label at its natural single-line height so the gap to the detail line stays tight"
        status: pass
    human_judgment: true
    rationale: "The visual effect (tighter gap, both labels still on one line, narrow-viewport wrap risk) can only be confirmed by a human looking at the live redeployed Studio, per the plan's human-check."
  - id: D2
    description: "Not-started detail under the pipeline shortened to name what step 2 is waiting on, no longer repeating the 'Mettre le site à jour' button instruction; title and dimmed/disabled gate state unchanged."
    requirement: "QUICK-260812-fq3"
    verification:
      - kind: unit
        ref: "tests/unit/deployment.test.ts#with unpublished drafts pending, tells the maintainer nothing has started and names what step 2 is waiting on"
        status: pass
    human_judgment: true
    rationale: "Final visual/copy confirmation on the live Studio is called out explicitly as a human-check in the plan; the unit test proves the string value but not how it reads in context on the deployed page."

duration: 25min
completed: 2026-08-12
status: complete
---

# Quick Task 260812-fq3: Trim surplus pipeline-label gap and redundant not-started copy Summary

**Deleted the surplus `min-height` reserving a second label line on pipeline nodes, and shortened the not-started detail string so it stops repeating the update button already visible above it — both guard tests re-pointed, all four gates green, Studio redeployed.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-08-12T09:05:00Z (approx)
- **Completed:** 2026-08-12T09:29:39Z
- **Tasks:** 3 completed
- **Files modified:** 4

## Accomplishments
- Removed the now-surplus `min-height: 28px` on `.editorial-dashboard__pipeline-node-label`; the 152px node width alone already keeps both labels on one line, so the reserved second line was pure empty gap before the detail text.
- Shortened the `segments.content !== 'done'` branch's `detail` in `resolvePromoteRow()` to a single sentence naming what step 2 is waiting on, removing the redundant instruction to press the panel's own button (visible directly above). Title (`Rien n'a encore été lancé.`) and dimmed/disabled gate state kept verbatim.
- Extended the explanatory comment above that branch to record why it and the neighbouring in-flight-wait branch must stay split despite now sharing an identical `detail` string.
- Re-pointed both guard tests at the new behaviour instead of deleting them.
- All four blocking gates (`npm run test:unit`, `npm run typecheck`, `npm --prefix sanity run lint`, `npm --prefix sanity run build`) pass.
- Confirmed via `git diff --stat` since the base commit that only the four expected files changed, and that `EditorialDashboard.tsx`, `dashboardLogic.ts`, and `.github/workflows/` are untouched.
- Redeployed the Sanity Studio (`npm run deploy --prefix sanity`) — deploy succeeded: "Success! Studio deployed to https://atelier-jacqueline-suzanne.sanity.studio/".

## Task Commits

Each task was committed atomically:

1. **Task 1: Drop the reserved second line on the pipeline node label** - `cfbd469` (fix)
2. **Task 2: Shorten the not-started detail so it stops repeating the button above it** - `48fdf01` (fix)
3. **Task 3: Run every gate, prove scope, redeploy the Studio, confirm visually** - no source-code commit (verification, scope proof, and deploy only, as specified by the plan)

_Note: the plan's docs artifacts (this SUMMARY, STATE.md) are committed separately by the orchestrator, not by this executor._

## Files Created/Modified
- `sanity/editorial/EditorialDashboard.css` - Deleted the `min-height: 28px` declaration on `.editorial-dashboard__pipeline-node-label` (exactly 1 line removed, 0 added).
- `sanity/editorial/deployment.ts` - Shortened the not-started branch's `detail` string in `resolvePromoteRow()` and extended the comment above it; no other branch touched.
- `tests/unit/editorial-dashboard-css.test.ts` - Re-pointed the last test case to assert absence of `min-height` and presence of `text-wrap: balance` on the label rule block, plus a single-block-count guard.
- `tests/unit/deployment.test.ts` - Re-pointed the not-started test case to assert the new exact `detail` string and a negative assertion that the button label is no longer duplicated in it.

## Decisions Made
- Kept `text-wrap: balance` on the label rule as the explicit remaining safety net for any future narrow-viewport wrap, per the plan's instruction — not removed even though it's currently only a backstop.
- The two `resolvePromoteRow()` branches (not-started vs. genuinely waiting) now share an identical `detail` string; documented in the source comment why they must not be merged despite this similarity.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed sanity/ subproject dependencies via `npm ci --prefix sanity`**
- **Found during:** Task 3 (running the full gate suite)
- **Issue:** `sanity/node_modules` did not exist in this worktree, so `npm run test:unit` failed on an unrelated test file (`tests/unit/dashboard-logic.test.ts`) with `Cannot find package '@sanity/icons/BulbOutline'` when it transitively imported `sanity/editorial/dashboardLogic.ts` (a file explicitly out of scope for this plan). This was a missing-install environment gap, not a code defect — running `npm ci --prefix sanity` restores exactly the versions already pinned in `sanity/package-lock.json`, it does not add or change any dependency.
- **Fix:** Ran `npm ci --prefix sanity` to install the already-locked dependency tree.
- **Files modified:** None (no `package.json`/lockfile changes; this is excluded from the commit and from the scope-boundary diff, and is confirmed absent from `git diff --stat` in Task 3's verification).
- **Verification:** `npm run test:unit` then passed in full (435/435 tests, 19/19 files).
- **Committed in:** N/A — no file changes resulted, nothing to commit.

---

**Total deviations:** 1 auto-fixed (1 blocking — missing pre-existing dependency install, not a new package)
**Impact on plan:** No scope creep; this was a worktree environment setup gap unrelated to the plan's code changes. No forbidden files were touched.

## Issues Encountered
None beyond the dependency-install gap documented above.

## Human Verification — Pending

Per the plan's Task 3 human-check, the following requires the user (not this executor, which has no authenticated browser session) to visually confirm on the live, redeployed Studio at https://atelier-jacqueline-suzanne.sanity.studio/ (hard-refresh with Cmd+Shift+R first):

1. **Spacing** — under each pipeline node circle, the bold label sits close to the small grey detail line beneath it, with the oversized empty gap gone; both labels (« Contenu + site de test » and « Site en ligne ») remain on one line each at normal width, and the two detail lines stay aligned. At phone width (116px node column), check whether either label now wraps to two lines — if so, the two detail lines will misalign, which is the one regression risk this change can cause.
2. **Copy** — with at least one unpublished draft, the not-started message should read « Rien n'a encore été lancé. » followed by the single line « L'étape 2 sera disponible une fois le site de test à jour. », with no repeated instruction to press « Mettre le site à jour », and the button itself still visibly dimmed/disabled.

This is recorded as **pending** — the deploy succeeded and all automated gates are green, but the visual sign-off itself has not yet been performed in this session.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Both follow-up fixes from 260812-f22 are complete and deployed; no further work is queued against this pipeline UI unless the narrow-viewport wrap check above surfaces a regression.
- Awaiting the user's visual sign-off (see Human Verification section above) to fully close this quick task.

---
*Phase: quick-260812-fq3*
*Completed: 2026-08-12*

## Self-Check: PASSED

- FOUND: sanity/editorial/EditorialDashboard.css
- FOUND: sanity/editorial/deployment.ts
- FOUND: tests/unit/editorial-dashboard-css.test.ts
- FOUND: tests/unit/deployment.test.ts
- FOUND: .planning/quick/260812-fq3-fix-excessive-node-label-margin-and-redu/260812-fq3-SUMMARY.md
- FOUND: cfbd469 (Task 1 commit)
- FOUND: 48fdf01 (Task 2 commit)
