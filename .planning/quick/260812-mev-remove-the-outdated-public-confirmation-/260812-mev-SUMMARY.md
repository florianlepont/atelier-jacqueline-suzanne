---
phase: quick-260812-mev
plan: 1
subsystem: ui
tags: [react, sanity-studio, editorial-dashboard, publish-flow]

requires:
  - phase: quick-260801-fxe
    provides: the inline publication confirmation card and dialog-open state this task removes
provides:
  - "One-click publish: preflightForConfirmation() and publish() merged behind publishAfterPreflight(), called by a single runPublication() handler"
  - "publicationCardState() with the confirmation-card dialog-open option/field removed"
  - "ConfirmationChangedError reworded for a world with no confirm step"
  - "Inline home for the confirming-phase changed-batch error, replacing the deleted card's only renderer"
affects: [editorial-dashboard, sanity-studio-publish-panel]

tech-stack:
  added: []
  patterns:
    - "Merged gate+action composition: publishAfterPreflight() composes an unchanged content-quality gate with a state-mutating action, returning null on refusal instead of throwing, so a single caller gets one clean click-to-publish contract"

key-files:
  created: []
  modified:
    - sanity/editorial/dashboardLogic.ts
    - sanity/editorial/EditorialDashboard.tsx
    - tests/unit/dashboard-logic.test.ts
    - tests/unit/editorial-dashboard-markup.test.ts
    - sanity/README.md

key-decisions:
  - "Computed the button's phase-aware label inline in JSX rather than as a top-level derived constant, to avoid an earlier occurrence of the literal string \"Mettre le site à jour\" preceding the panel heading in the file's source text — a pre-existing markup test locates the heading via the FIRST occurrence of that string and would have silently mis-sliced otherwise"
  - "Kept preflightForConfirmation()'s name unchanged (per plan) despite it no longer serving a confirmation UI, to keep the three existing call sites and their tests stable; documented the rationale in a comment directly above it"

requirements-completed: [QUICK-260812-mev]

coverage:
  - id: D1
    description: "One click on « Mettre le site à jour » preflights and publishes in the same gesture — no intermediate card, no second click"
    requirement: "QUICK-260812-mev"
    verification:
      - kind: unit
        ref: "tests/unit/dashboard-logic.test.ts#publishAfterPreflight (the merged one-click publish handler) > publishes in exactly one client.action call when the gate passes"
        status: pass
      - kind: unit
        ref: "tests/unit/editorial-dashboard-markup.test.ts#editorial dashboard publish button is a single one-click gesture (no confirmation card) > has no dialog-open state and no separate confirm handler"
        status: pass
    human_judgment: true
    rationale: "The click path requires an authenticated Sanity Studio session, which this environment does not have. A real click on a real pending draft is the only way to observe the button going straight into its busy state with no second click — pending user confirmation."
  - id: D2
    description: "The confirmation card's false public/private claim is deleted from the source (question line, count sentence, Annuler/Confirmer buttons)"
    requirement: "QUICK-260812-mev"
    verification:
      - kind: unit
        ref: "tests/unit/editorial-dashboard-markup.test.ts#editorial dashboard publish button is a single one-click gesture (no confirmation card) > never asserts that publishing makes content visible to everyone"
        status: pass
    human_judgment: false
  - id: D3
    description: "The content-quality preflight gate (missing Indispensable fields) is unchanged and still blocks publishing, proven against the new merged path"
    requirement: "QUICK-260812-mev"
    verification:
      - kind: unit
        ref: "tests/unit/dashboard-logic.test.ts#publishAfterPreflight (the merged one-click publish handler) > publishes nothing and resolves null when a document is missing an Indispensable field"
        status: pass
    human_judgment: false
  - id: D4
    description: "A batch that changes between preflight and publish is still refused, and the refusal is now visible inline in the panel (re-homed ConfirmationChangedError message)"
    requirement: "QUICK-260812-mev"
    verification:
      - kind: unit
        ref: "tests/unit/editorial-dashboard-markup.test.ts#editorial dashboard publish button is a single one-click gesture (no confirmation card) > gives the confirming-phase changed-batch error a visible renderer"
        status: pass
    human_judgment: false
  - id: D5
    description: "The single button's label is honest across the whole operation (verification wording while preflighting, publication wording while publishing/committing/refreshing)"
    verification: []
    human_judgment: true
    rationale: "Label text changes over time as async phases transition; a human watching a real click end-to-end is the most direct proof, though the ternary logic itself is plain, reviewed source."
  - id: D6
    description: "Production-release path, pipeline UI, and CI are untouched; Studio redeployed"
    verification:
      - kind: other
        ref: "git diff --stat sanity/editorial/deployment.ts sanity/editorial/EditorialDashboard.css .github/workflows/ (empty)"
        status: pass
      - kind: other
        ref: "npm run deploy --prefix sanity (Success! Studio deployed to https://atelier-jacqueline-suzanne.sanity.studio/)"
        status: pass
    human_judgment: false

duration: 15min
completed: 2026-08-12
status: complete
---

# Phase quick-260812-mev: Remove the Outdated Public-Confirmation Dialog Summary

**Merged the two-click publish flow (preflight → confirmation card → confirm) into one click via a new `publishAfterPreflight()` helper, deleted the now-false "this makes N contents visible to everyone" card, and re-homed its changed-batch error message inline.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-08-12T14:19:01Z
- **Completed:** 2026-08-12T14:34:26Z
- **Tasks:** 4 completed (all four gates green, Studio redeployed)
- **Files modified:** 5

## Accomplishments

- Added `publishAfterPreflight(controller)` in `dashboardLogic.ts`, composing the byte-identical `preflightForConfirmation()` content-quality gate with `controller.publish()` — returns `null` (nothing published) when the gate refuses, otherwise the publish result
- Slimmed `publicationCardState()` by removing the `confirmationOpen` option and `dialogOpen` return field, since the state they mirrored (an open/closed confirmation card) no longer exists
- Reworded `ConfirmationChangedError`'s message: it no longer tells the editor to "confirmez à nouveau" (there is no confirm step), and now says the batch changed mid-update, nothing was published, and to click « Mettre le site à jour » again
- Deleted the entire confirmation card from `EditorialDashboard.tsx` — its question line ("Publier maintenant sur le site public ?"), its count sentence ("N contenus seront visibles par tout le monde"), its Annuler and Confirmer buttons — and replaced the two-handler flow (`requestPublication` + `confirmPublication`) with one `runPublication()` handler wired to `publishAfterPreflight()`
- Gave the `confirming`-phase changed-batch error a new inline home (a caution-toned card in the panel body) so a mid-flight batch change is still visibly refused instead of becoming an invisible dead click
- Added three new unit tests proving the merged flow end to end: a ready batch publishes with exactly one `client.action` call, a batch blocked by a missing "Indispensable" field resolves `null` and publishes nothing, and an unevaluable preflight fails closed
- Added a markup test describe block proving the deleted card's strings, the dialog-open state, and the standalone confirm handler are all gone, that the component routes through `publishAfterPreflight` rather than calling `publish()` directly, and that the changed-batch error has a visible renderer
- Updated `sanity/README.md` step 5 of "Le parcours quotidien" to describe the one-click flow instead of the old two-beat (check récapitulatif, then confirm) description
- All four gates pass (`npm run test:unit`, `npm run typecheck`, `npm --prefix sanity run lint`, `npm --prefix sanity run build`); scope proof confirmed via `git diff --stat` on the forbidden paths; Studio redeployed successfully

## Task Commits

Each task was committed atomically:

1. **Task 1: Add the merged publish helper, slim the card state, and re-point the existing card-state tests** - `640cd6d` (feat)
2. **Task 2: Delete the confirmation card and merge the two handlers into one click** - `cd7efcc` (feat)
3. **Task 3: Prove the merged flow — one-click success, still-blocked refusal, and a markup guard** - `e89f84b` (test)
4. **Task 4: Update the editor guide, run every gate, prove scope, redeploy** - `3070b3b` (docs)

## Files Created/Modified

- `sanity/editorial/dashboardLogic.ts` - Added `publishAfterPreflight()`; commented `preflightForConfirmation()`'s survival rationale; slimmed `publicationCardState()`; reworded `ConfirmationChangedError`'s message
- `sanity/editorial/EditorialDashboard.tsx` - Deleted the confirmation card and its state; merged `requestPublication`/`confirmPublication` into `runPublication()`; added a phase-aware inline button label; re-homed the changed-batch error card
- `tests/unit/dashboard-logic.test.ts` - Re-pointed three `publicationCardState()` call sites for the slimmed signature; added a `publishAfterPreflight()` describe block with three new cases
- `tests/unit/editorial-dashboard-markup.test.ts` - Added a describe block asserting the deleted card's strings, dialog-open state, and standalone confirm handler are gone, and that the changed-batch error is rendered
- `sanity/README.md` - Rewrote step 5 of the daily workflow for the one-click flow

## Decisions Made

- Computed the merged button's phase-aware label inline in the JSX `text` prop rather than as a top-level derived constant. A top-level `const publicationButtonLabel = ...'Mettre le site à jour'` placed the literal string earlier in the file's raw text than the panel heading, which silently broke a pre-existing markup test (`editorial-dashboard-markup.test.ts`) that locates the heading via `source.indexOf('Mettre le site à jour')` (the FIRST occurrence). Moving the ternary inline restored the heading as the first occurrence and fixed the regression without touching the pre-existing test, which the plan required to keep passing untouched.
- Kept `preflightForConfirmation()`'s name unchanged, as the plan required, and documented in a code comment exactly why a future reader must not delete it as "leftover dialog machinery."

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed root and `sanity/` npm dependencies before any test could run**
- **Found during:** Task 1 verification (`npm run test:unit -- tests/unit/dashboard-logic.test.ts`)
- **Issue:** This worktree had no `node_modules` at the root or under `sanity/` (only a stray `.vite` cache directory), so the very first test run failed with `Cannot find package '@sanity/icons/BulbOutline'`. This is worktree setup, not a plan-scoped code change.
- **Fix:** Ran `npm install` at the repo root and `npm install --prefix sanity` to materialize dependencies already declared in `package.json`/`sanity/package.json` and their lockfiles. No dependency versions were added or changed.
- **Files modified:** None tracked by git (lockfiles were already committed upstream; `npm install` only populated `node_modules/`, which is gitignored).
- **Verification:** `npm run test:unit -- tests/unit/dashboard-logic.test.ts` then ran and passed (117/117).

**2. [Rule 1 - Bug] Fixed a self-introduced markup-test regression from the new button label logic**
- **Found during:** Task 2 verification (`npm run test:unit`, full suite)
- **Issue:** The first draft of the merged button's phase-aware label was a top-level derived `const publicationButtonLabel = ...` containing the literal string `'Mettre le site à jour'`. Because that `const` was declared earlier in the file (before the JSX heading), it became the FIRST occurrence of that exact string in the raw source text. A pre-existing test in `editorial-dashboard-markup.test.ts` (guarding an earlier quick task's subtitle-gating logic, which the plan explicitly required to keep passing untouched) locates the panel heading via `source.indexOf('Mettre le site à jour')` and then slices forward to the next `</Text>` to check subtitle-gating conditions. With the label constant now earlier in the file, the slice pointed at the wrong span and the test failed.
- **Fix:** Moved the label computation from a top-level `const` into an inline JSX expression directly on the `Button`'s `text` prop, which places it physically after the heading in the file's source text — restoring the heading as the first occurrence.
- **Files modified:** `sanity/editorial/EditorialDashboard.tsx`
- **Verification:** `npm run test:unit` (full suite) passed 445/445 after the fix, including the previously-failing pre-existing test.
- **Committed in:** `cd7efcc` (Task 2 commit; the fix was applied before that commit was made, so no separate commit exists for it)

---

**Total deviations:** 2 auto-fixed (1 blocking/environment setup, 1 self-introduced bug caught and fixed before commit)
**Impact on plan:** Neither deviation touched scope outside the plan's five owned files. The dependency install is pure environment setup with no tracked file changes. The markup-test regression was introduced and fixed within Task 2, before that task's commit — the committed code never contained the bug.

## Issues Encountered

None beyond the two auto-fixed deviations above.

## User Setup Required

None - no external service configuration required. The Studio was redeployed as part of Task 4 (`npm run deploy --prefix sanity`), reporting: `Success! Studio deployed to https://atelier-jacqueline-suzanne.sanity.studio/`

## Behavioural Sign-Off (Pending)

All automatable verification passed: 452 unit tests green, typecheck clean, Sanity lint clean, Sanity build clean, scope proof clean (`git diff --stat` on the three forbidden paths is empty, and `buildProductionReleaseMarkerActions`/`triggerProductionRelease` are both still present in `dashboardLogic.ts`), and the Studio redeployed successfully.

The plan's final step requires a REAL click on a real pending draft in the live, authenticated Studio — something this environment cannot perform (no authenticated browser session). This is recorded here as **pending user confirmation**, not as a blocker to marking this quick task's implementation complete, consistent with the project's established pattern for Studio-deploy quick tasks (e.g. `260812-lvt`).

**Requested from the user:**
1. Open https://atelier-jacqueline-suzanne.sanity.studio/ and hard-refresh (Cmd+Shift+R).
2. With at least one pending draft, click « Mettre le site à jour » once — expect no card, no second click, straight into busy state, then a genuine publish (count drops, first pipeline node moves out of pending).
3. Confirm the round gate button between the two pipeline nodes is still the only path to the site en ligne.
4. If convenient, leave an "Indispensable" field empty on one draft and confirm the button still refuses to publish (blocked-contents card still lists it, nothing publishes).
5. Confirm the button label shows verification wording briefly, then publication wording while it runs.
6. Confirm nothing else in the panel moved, including at phone width.

## Next Phase Readiness

Implementation and all automatable verification are complete. No blockers for other work. Awaiting the user's behavioural confirmation on the live Studio (does not block other phases/plans from proceeding).

---
*Phase: quick-260812-mev*
*Completed: 2026-08-12*

## Self-Check: PASSED

- FOUND: sanity/editorial/dashboardLogic.ts
- FOUND: sanity/editorial/EditorialDashboard.tsx
- FOUND: tests/unit/dashboard-logic.test.ts
- FOUND: tests/unit/editorial-dashboard-markup.test.ts
- FOUND: sanity/README.md
- FOUND: commit 640cd6d
- FOUND: commit cd7efcc
- FOUND: commit e89f84b
- FOUND: commit 3070b3b
