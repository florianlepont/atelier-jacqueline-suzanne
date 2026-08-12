---
phase: quick-260812-h3i
plan: 1
subsystem: ui
tags: [sanity-studio, react, css, editorial-dashboard]

requires:
  - phase: quick-260812-fq3
    provides: pipeline node width/margin/reserved-height tuning that turned out not to fix the root cause
provides:
  - Pipeline node label/detail rendered as plain spans, eliminating the size-zero Sanity UI Text box that overflowed its own glyphs
  - Single not-started framing in the panel header, gated on an explicit resolvePromoteRow() flag
affects: [editorial-dashboard, sanity-studio-deploy]

tech-stack:
  added: []
  patterns:
    - "Source-text regex tests for Sanity Studio JSX/CSS, since sanity/ deps are not resolvable from the root Vitest project and there is no React testing library in this repo"
    - "State-derived boolean flags (notStarted) on a resolver's return type instead of re-deriving conditions in the component, to avoid condition leakage across branches"

key-files:
  created:
    - tests/unit/editorial-dashboard-markup.test.ts
  modified:
    - sanity/editorial/EditorialDashboard.tsx
    - sanity/editorial/EditorialDashboard.css
    - sanity/editorial/deployment.ts
    - tests/unit/editorial-dashboard-css.test.ts
    - tests/unit/deployment.test.ts

key-decisions:
  - "Root cause of the 'collé' spacing bug was a layout box, not a spacing value: @sanity/ui's size-zero Text component measured shorter than the glyphs it paints, so no amount of margin tuning (three prior quick tasks) could have fixed it. Fixed by swapping the four pipeline-node label/detail elements from Text to plain span."
  - "The not-started framing is expressed once via an explicit notStarted flag on ReleasePipelinePromote, set on exactly one branch of resolvePromoteRow(), rather than re-derived in the component from a draft/pending count — this prevents the header clause from leaking into other pipeline states."

requirements-completed: [QUICK-260812-h3i]

coverage:
  - id: D1
    description: "Pipeline node label and detail render as plain spans (not Sanity UI Text), restoring the intended CSS gap"
    requirement: QUICK-260812-h3i
    verification:
      - kind: unit
        ref: "tests/unit/editorial-dashboard-markup.test.ts"
        status: pass
      - kind: unit
        ref: "tests/unit/editorial-dashboard-css.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "Not-started promote row flagged via notStarted, copy reduced to step 2's precondition; wait branch unaffected"
    requirement: QUICK-260812-h3i
    verification:
      - kind: unit
        ref: "tests/unit/deployment.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "Panel header subtitle carries the not-started framing once, gated on notStarted && publicationCard.total > 0"
    requirement: QUICK-260812-h3i
    verification:
      - kind: unit
        ref: "tests/unit/editorial-dashboard-markup.test.ts"
        status: pass
    human_judgment: false
  - id: D4
    description: "Visual confirmation on the live redeployed Studio: spacing gap fixed, copy appears once"
    verification: []
    human_judgment: true
    rationale: "Requires a human with an authenticated Studio session to hard-refresh and visually inspect the redeployed bundle at https://atelier-jacqueline-suzanne.sanity.studio/ — this environment has no authenticated browser session."

duration: ~25min
completed: 2026-08-12
status: complete
---

# Quick Task 260812-h3i: Fix Sanity UI text-box-height bug in pipeline nodes, Summary

**Swapped four Sanity UI `Text` elements for plain `span`s to fix a measured layout-box bug, and consolidated duplicated "nothing launched yet" copy into the panel header via a new `notStarted` flag.**

## Performance

- **Duration:** ~25 min
- **Completed:** 2026-08-12
- **Tasks:** 4
- **Files modified:** 6 (3 source, 3 test) + 1 test file created

## Accomplishments
- Fixed the "collé" (touching) spacing bug between each pipeline node's bold label and grey detail line by rendering both as plain `span`s instead of Sanity UI's size-zero `Text` component, which was measured to lay out a box shorter than the glyphs it paints
- Added `color: var(--card-fg-color)` to `.editorial-dashboard__pipeline-node-label` to replace the foreground color the removed `Text` wrapper used to supply
- Added a new source-text guard test (`editorial-dashboard-markup.test.ts`) locking in the `span` swap and the header wiring, so a future edit can't silently reintroduce the shorter-than-its-glyphs box
- Added an optional `notStarted` flag to `ReleasePipelinePromote`, set only on the not-started branch of `resolvePromoteRow()`, and shortened that branch's copy to name step 2's precondition instead of restating "nothing launched yet"
- Moved the "nothing launched yet" framing into the panel header subtitle, gated on `pipeline.promote.notStarted && publicationCard.total > 0`, so the message now appears exactly once
- Redeployed the live Sanity Studio (`https://atelier-jacqueline-suzanne.sanity.studio/`)

## Task Commits

Each task was committed atomically:

1. **Task 1: Render the four pipeline node texts as plain spans and restore the label colour in CSS** - `bd16c4a` (fix)
2. **Task 2: Mark the not-started promote row with a flag and reduce its copy to step 2's precondition** - `9009e7e` (fix)
3. **Task 3: Move the not-started message into the panel header subtitle, then run every gate** - `9f99716` (fix)
4. **Task 4: Redeploy the Studio and get visual confirmation** - no source commit (deploy-only); see below

_Note: this quick task's docs (this SUMMARY, STATE.md, ROADMAP.md) are committed separately by the orchestrator, not by this executor._

## Files Created/Modified
- `sanity/editorial/EditorialDashboard.tsx` - 4 `Text`→`span` conversions for pipeline node label/detail; new conditional clause in the panel header subtitle
- `sanity/editorial/EditorialDashboard.css` - added `color: var(--card-fg-color);` to `.editorial-dashboard__pipeline-node-label`
- `sanity/editorial/deployment.ts` - added optional `notStarted` flag to `ReleasePipelinePromote`; rewrote the not-started branch's copy and its explanatory comment
- `tests/unit/editorial-dashboard-css.test.ts` - extended the label case with a `color:` assertion
- `tests/unit/editorial-dashboard-markup.test.ts` (new) - source-text guard for the `span` swap and the header's `notStarted` gating
- `tests/unit/deployment.test.ts` - re-pointed the not-started case at the new strings/flag; added a `notStarted` falsy assertion on the genuine in-flight-wait case

## Decisions Made
- Followed the plan's diagnosis exactly: this is a markup swap, not a fourth round of spacing-number tuning, because the box being resized in prior quick tasks (ca1, f22, fq3) was never the box actually painted.
- Gated the header clause on the resolver's explicit `notStarted` flag rather than re-deriving a condition in the component, per the plan's explicit reasoning about condition leakage across `resolvePromoteRow()` branches.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed missing `sanity/node_modules` via `npm ci --prefix sanity`**
- **Found during:** Task 3 (running the four blocking gates)
- **Issue:** `sanity/node_modules` did not exist in this worktree at all, so `npm --prefix sanity run lint` and `npm --prefix sanity run build` failed immediately with `ERR_MODULE_NOT_FOUND` for `@sanity/eslint-config-studio`. This also explained an unrelated pre-existing failure in `tests/unit/dashboard-logic.test.ts` (`Cannot find package '@sanity/icons/BulbOutline'`) — confirmed present at the base commit (`11ddfbb`) before any change in this plan, and caused by `sanity/editorial/dashboardLogic.ts`, which is explicitly out of scope for this plan.
- **Fix:** Ran `npm ci --prefix sanity`, which installs exactly the versions already pinned in `sanity/package-lock.json` (no new/different packages introduced, no lockfile changes). This is standard project setup per the documented CI pipeline order in CLAUDE.md (`npm ci --prefix sanity`), not a package-legitimacy concern.
- **Files modified:** none tracked (`sanity/node_modules` is gitignored; `sanity/package.json` / `sanity/package-lock.json` unchanged, confirmed via `git diff --stat`)
- **Verification:** `npm run test:unit` went from 1 failed suite / 323 passing tests to 20 passed suites / 440 passing tests; `npm --prefix sanity run lint` and `npm --prefix sanity run build` both then passed clean
- **Committed in:** N/A (no tracked file changes — the install only populated the gitignored `sanity/node_modules` directory)

---

**Total deviations:** 1 auto-fixed (1 blocking, environment setup only — no source changes, no scope creep)
**Impact on plan:** Necessary to run the plan's own mandated gates (`npm --prefix sanity run lint`, `npm --prefix sanity run build`). Confirmed via `git stash` round-trip that the `dashboard-logic.test.ts` failure pre-existed at the base commit and is unrelated to `dashboardLogic.ts` (untouched, confirmed via `git diff --stat`).

## Issues Encountered
None beyond the missing-`node_modules` deviation above, which is documented and resolved.

## Human Verification — Pending

Task 4's deploy step completed successfully:

```
Success! Studio deployed to https://atelier-jacqueline-suzanne.sanity.studio/
```

The plan's `<human-check>` for this task asks the end user to hard-refresh the live Studio (Cmd+Shift+R) and visually confirm, in the "Mettre le site à jour" panel:

1. **Spacing fix** — the bold label and grey detail line under each pipeline node are now clearly separated by a small even gap (not touching) on both nodes, at both desktop and phone widths; labels keep the right color/weight.
2. **Copy fix** — in the nothing-launched-yet state, the header subtitle reads the pending-count sentence followed by the new "Rien n'a été lancé pour l'instant…" clause, and the box under the pipeline reads "Étape 2 — site en ligne" / "Disponible une fois le site de test à jour." — the nothing-has-started message appears exactly once, at the top, and the step-2 button stays visibly locked.

This human-check is informational for the end user per this task's constraints and does not block plan completion — it is recorded here as pending. The user should reply "approuvé" or describe what's off after checking the live Studio.

## Next Phase Readiness
- No blockers. All four blocking gates (`npm run test:unit`, `npm run typecheck`, `npm --prefix sanity run lint`, `npm --prefix sanity run build`) pass.
- `git diff --stat sanity/editorial/dashboardLogic.ts .github/workflows/` is empty — scope boundary held throughout.
- Studio is redeployed; awaiting the user's visual sign-off noted above.

---
*Phase: quick-260812-h3i*
*Completed: 2026-08-12*

## Self-Check: PASSED

All 7 claimed files verified present on disk; all 3 task commit hashes (`bd16c4a`, `9009e7e`, `9f99716`) verified present in `git log`.
