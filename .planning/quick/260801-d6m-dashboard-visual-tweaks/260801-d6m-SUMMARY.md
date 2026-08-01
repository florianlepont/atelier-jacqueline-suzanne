---
phase: quick-260801-d6m
plan: 01
subsystem: ui
tags: [sanity-studio, react, css, editorial-dashboard]

requires: []
provides:
  - Editorial Studio dashboard with no metric-tile row
  - Sober, accent-edged "Mettre le site à jour" publication panel
  - Correct button hierarchy (ghost header buttons, single solid CTA)
  - "Nouvelle édition" creation shortcut in the dashboard header
affects: []

tech-stack:
  added: []
  patterns:
    - "@sanity/icons imports use documented per-icon subpaths (e.g. @sanity/icons/Book), not the package barrel — the locked @sanity/icons@5.2.1 dropped all named barrel exports"

key-files:
  created: []
  modified:
    - sanity/editorial/EditorialDashboard.tsx
    - sanity/editorial/EditorialDashboard.css
    - sanity/sanity.config.ts
    - sanity/schemas/structure.ts
    - sanity/editorial/dashboardLogic.ts
    - sanity/editorial/DocumentChecklist.tsx
    - sanity/editorial/OpenSitePage.tsx

key-decisions:
  - "Fixed a pre-existing, branch-wide @sanity/icons barrel-import regression (introduced by commit ac634b1) as a blocking-issue deviation, since it broke `sanity build` for every file in the Studio and would have made every task's build gate in this plan unpassable"

requirements-completed: [QUICK-260801-d6m]

coverage:
  - id: D1
    description: "Three metric tiles (collections publiées / brouillons / contenus à vérifier) removed from the dashboard, with every orphaned symbol (MetricCard, galleries/onlineGalleryCount locals, isGalleryOnline import, DocumentIcon/WarningOutlineIcon imports) and dead CSS deleted"
    requirement: "QUICK-260801-d6m"
    verification:
      - kind: automated_ui
        ref: "grep gates: editorial-dashboard__metric count 0 in .tsx/.css, MetricCard count 0, metricAccentStyles/FolderIcon/editorial-dashboard__surface survive"
        status: pass
      - kind: other
        ref: "npm --prefix sanity run lint && npm --prefix sanity run build"
        status: pass
    human_judgment: false
  - id: D2
    description: "'Mettre le site à jour' panel restyled to a sober neutral surface with a 3px #556bfc left rule, hairline border, soft two-layer shadow, and a hairline divider shown only when the panel has content below it — zero change to publish button/handler behavior"
    requirement: "QUICK-260801-d6m"
    verification:
      - kind: automated_ui
        ref: "grep gates: requestPublication=3, refreshPublicationTracking=2, publicationBusy=10 (all match plan's exact baseline), publicationCard.>=9, publicationState.phase===>=3"
        status: pass
      - kind: other
        ref: "npm --prefix sanity run lint && npm --prefix sanity run build"
        status: pass
    human_judgment: true
    rationale: "Visual sobriety, accent-family cohesion with the PublishIcon chip, and divider placement are subjective/visual judgments the plan itself calls out as a <human-check> against the live Studio at localhost:3333 — not verifiable from grep/build alone. This worktree's isolated filesystem is not what the running localhost:3333 dev server serves, so live verification must happen post-merge."
  - id: D3
    description: "'Nouvelle collection' switched to ghost/outlined; a new 'Nouvelle édition' ghost sibling added with BookIcon and params={type:'edition'} (no template), making 'Mettre le site à jour' the only solid primary CTA"
    requirement: "QUICK-260801-d6m"
    verification:
      - kind: automated_ui
        ref: "grep gates: BookIcon=2, 'Nouvelle édition'=1, IntentButton=4, mode=\"ghost\"=2, template:'edition'=0"
        status: pass
      - kind: other
        ref: "npm --prefix sanity run lint && npm --prefix sanity run build"
        status: pass
    human_judgment: true
    rationale: "Confirming the create intent actually resolves without error and closing the resulting draft without publishing requires interacting with the live Studio — the plan's own <human-check> for this task, deferred to post-merge for the same worktree-isolation reason as D2."

duration: 12min
completed: 2026-08-01
status: complete
---

# Quick Task 260801-d6m: Dashboard Visual Tweaks Summary

**Removed the three unused metric tiles, restyled the publish panel from a saturated solid-indigo block to a sober neutral card with a thin accent edge, and fixed the header button hierarchy so "Mettre le site à jour" is the page's only solid CTA — plus a "Nouvelle édition" creation shortcut.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-08-01T07:35:42Z
- **Completed:** 2026-08-01T07:47:31Z
- **Tasks:** 3 (plus one pre-existing blocking-issue fix)
- **Files modified:** 7

## Accomplishments
- Deleted the three metric tiles ("collections publiées", "brouillons", "contenus à vérifier") and every symbol they orphaned (`MetricCard`, `galleries`/`onlineGalleryCount` locals, `isGalleryOnline` import, `DocumentIcon`/`WarningOutlineIcon` imports, five dead CSS rules, and the now-empty `@media (min-width: 40em)` block)
- Restyled the "Mettre le site à jour" panel: `tone="transparent"`, `shadow={1}`, a 3px `#556bfc` left rule matching the `PublishIcon` chip, a hairline border, a soft two-layer shadow, more padding, and a hairline divider rendered only when the panel has pending pairs, blocked rows, a success message, or a tracking-error/error state
- "Nouvelle collection" switched from a solid (`mode="default"`) to a ghost (`mode="ghost"`) button; added a "Nouvelle édition" ghost sibling with `BookIcon` and `params={{type: 'edition'}}` (no `template`, since only `gallery` has a registered initial-value template)
- Fixed a pre-existing, branch-wide regression: `@sanity/icons@5.2.1`'s barrel export dropped every named icon component in favor of a lazy symbol registry, which broke `sanity build` across the whole Studio (26 `MISSING_EXPORT` errors) — restored to the documented per-icon subpath imports already proven correct in a prior commit

## Task Commits

Each task was committed atomically:

1. **Blocking-issue fix: restore @sanity/icons subpath imports** - `5613694` (fix)
2. **Task 1: Delete the three metric tiles and everything they orphan** - `1bd4c7c` (fix)
3. **Task 2: Restyle the "Mettre le site à jour" panel** - `fb9737c` (fix)
4. **Task 3: De-emphasize "Nouvelle collection" and add "Nouvelle édition"** - `ff921ff` (fix)

_Task commits use `fix` as the conventional-commit type per the working agreement's presentation-only, no-behavior-change framing; no `docs`/plan-metadata commit is included per this quick task's execution constraints (orchestrator handles the docs commit)._

## Files Created/Modified
- `sanity/editorial/EditorialDashboard.tsx` — metric tiles removed, publish panel restyled, header buttons de-emphasized + Nouvelle édition added, icon imports fixed
- `sanity/editorial/EditorialDashboard.css` — dead metric CSS removed, `.editorial-dashboard__publish-panel` / `.editorial-dashboard__publish-divider` added
- `sanity/sanity.config.ts` — icon imports fixed (blocking-issue deviation)
- `sanity/schemas/structure.ts` — icon imports fixed (blocking-issue deviation)
- `sanity/editorial/dashboardLogic.ts` — icon imports fixed (blocking-issue deviation)
- `sanity/editorial/DocumentChecklist.tsx` — icon imports fixed (blocking-issue deviation)
- `sanity/editorial/OpenSitePage.tsx` — icon imports fixed (blocking-issue deviation)

## Decisions Made
- Kept `MetricAccent` type, `metricAccentStyles`, and `TintChip` intact since they're still consumed by the publish-panel chip, the blocking card, and the "Tout est en ordre" success chip — only the `MetricCard` component and its three call sites were removed.
- Computed the divider-visibility boolean (`publicationPanelHasBody`) once, reusing the exact same expressions the existing pairs/blockedRows/success/tracking-error/error branches already use, per the plan's explicit "no new source of truth" instruction — this is why the `publicationCard.`/`publicationState.phase ===` grep counts rose above baseline (9→11, 6→9) while every pre-existing call site stayed byte-identical (`requestPublication` 3, `refreshPublicationTracking` 2, `publicationBusy` 10 — all exact baseline matches).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Restored @sanity/icons subpath imports broken by a prior regression**
- **Found during:** Task 1, running the `npm --prefix sanity run build` verify gate for the first time in this worktree
- **Issue:** The locked `@sanity/icons@5.2.1` package barrel (`.` export) is a lazy symbol registry with zero named PascalCase exports (`DashboardIcon`, `BookIcon`, etc. don't exist there — only per-icon subpaths like `@sanity/icons/Book` do). A prior commit on this branch (`ac634b1`, unrelated feature work) reverted a previously-correct fix (`e0af91f`) back to barrel imports across 6 files, breaking `sanity build` with 26 `MISSING_EXPORT` errors. Verified via `git show` that the lockfile already resolved to 5.2.1 at the time of `ac634b1`, confirming the "required by the Studio build" commit message was mistaken — the regression was real and reproducible, not an artifact of a fresh `npm ci` in this worktree.
- **Fix:** Converted every barrel `@sanity/icons` import back to the documented per-icon subpath style (mechanical import-path change, zero behavior/visual difference, matching the exact pattern `e0af91f` already established and verified) in `sanity.config.ts`, `schemas/structure.ts`, `editorial/dashboardLogic.ts`, `editorial/DocumentChecklist.tsx`, `editorial/OpenSitePage.tsx`, and `editorial/EditorialDashboard.tsx`.
- **Files modified:** `sanity/sanity.config.ts`, `sanity/schemas/structure.ts`, `sanity/editorial/dashboardLogic.ts`, `sanity/editorial/DocumentChecklist.tsx`, `sanity/editorial/OpenSitePage.tsx` (separate commit); `sanity/editorial/EditorialDashboard.tsx`'s own imports fixed inline with the Task 1 commit.
- **Verification:** `npm --prefix sanity run build` went from 26 `MISSING_EXPORT` errors to a clean build; `npm --prefix sanity run lint` stayed clean throughout.
- **Committed in:** `5613694` (standalone fix, files outside this plan's `files_modified` scope) and `1bd4c7c` (EditorialDashboard.tsx's own imports, part of the Task 1 commit).

---

**Total deviations:** 1 auto-fixed (Rule 3 - blocking issue, pre-existing on the branch)
**Impact on plan:** Necessary to make the plan's own mandatory `npm --prefix sanity run build` gate pass for all three tasks — without it, no task in this plan could have been verified. Zero behavioral or visual change; touched files outside this plan's declared `files_modified` list only because the regression was branch-wide, not introduced by this plan's own edits.

## Issues Encountered
- This worktree had no installed `node_modules` (neither root nor `sanity/`) at session start; ran `npm ci` and `npm ci --prefix sanity` to bootstrap from the existing committed lockfiles before any verification could run. Not a deviation — this is the same mechanism CI already uses to bootstrap dependencies.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- All three planned visual refinements are implemented and pass every automated gate: `npm --prefix sanity run lint`, `npm --prefix sanity run build`, root `npm run lint`, `npm run typecheck` (0 errors), and `npm run test:unit` (257/257 passing).
- **Outstanding: live visual confirmation.** The plan's `<human-check>` steps (panel sobriety/accent cohesion, divider placement, button enable/disable state, "Nouvelle édition" opening a clean create-intent form) could not be performed from this isolated worktree — the `sanity dev` server already running on `localhost:3333` serves a different working directory's files, not this worktree's edits. Once merged, re-run the plan's human verification against the live Studio (read-only — never publish/mutate) before considering the dashboard restyle fully signed off.
- The `@sanity/icons` subpath-import fix should be treated as a standing convention going forward: any future icon import from `'@sanity/icons'` barrel will break `sanity build` again against the currently locked version.

---
*Phase: quick-260801-d6m*
*Completed: 2026-08-01*

## Self-Check: PASSED

- FOUND: sanity/editorial/EditorialDashboard.tsx
- FOUND: sanity/editorial/EditorialDashboard.css
- FOUND commit: 5613694
- FOUND commit: 1bd4c7c
- FOUND commit: fb9737c
- FOUND commit: ff921ff
