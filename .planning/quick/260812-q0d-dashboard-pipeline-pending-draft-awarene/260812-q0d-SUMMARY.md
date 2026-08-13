---
phase: quick-260812-q0d
plan: 1
subsystem: ui
tags: [sanity-studio, react, vitest, dashboard, deploy-pipeline]

requires: []
provides:
  - "Empty done-state promote row copy (self-hiding detail box) in resolvePromoteRow()"
  - "releasePipelineState() production segment: busy>active, then genuinely-failed>failed, then pendingCount>0>pending, then prior stale/kind logic"
  - "New dependency-free sanity/editorial/pipelineView.ts with 3 tested pure helpers (pipelineCircleClassName, pipelineNodeDetail, pipelineGateCaption)"
  - "Node 1 relabelled 'Studio' with a static blue 'modified' circle face and 'Contenu modifié — prêt à être publié' detail when a draft is pending"
  - "Round gate button caption 'Aperçu du site de test' in the ready variant only"
  - "Resynced sanity/README.md pipeline paragraph"
affects: [sanity-editorial-dashboard]

tech-stack:
  added: []
  patterns:
    - "Presentational pipeline helpers extracted to a dependency-free, type-only-import module (pipelineView.ts) mirroring releaseGate.ts's precedent, so behavior lives in real unit tests instead of source-text regexes."

key-files:
  created:
    - sanity/editorial/pipelineView.ts
    - tests/unit/pipeline-view.test.ts
  modified:
    - sanity/editorial/deployment.ts
    - sanity/editorial/EditorialDashboard.tsx
    - sanity/editorial/EditorialDashboard.css
    - sanity/README.md
    - tests/unit/deployment.test.ts
    - tests/unit/editorial-dashboard-markup.test.ts
    - tests/unit/editorial-dashboard-css.test.ts

key-decisions:
  - "Production segment precedence, exactly as corrected during plan review before execution: busy -> 'active'; then a genuinely FAILED production run (deploymentSegmentKind(production.kind) === 'failed') -> 'failed'; then pendingCount > 0 -> 'pending'; then the prior stale/kind logic. This carve-out was added specifically so a real production failure's retry button and failure copy are never hidden behind an unrelated pending draft — the earlier draft of the plan would have masked failures behind pending drafts, and this was fixed before any code was written."
  - "The --modified circle face deliberately reuses --active's exact CSS declarations (only the icon differs: spinner vs. static publish glyph) rather than inventing a new color, per the scope boundary's 'no new colour values' constraint."
  - "pendingCount > 0 is NOT the only way node 1's segment reaches 'pending' — deploymentState() also returns the 'unknown' kind (which maps to 'pending') when the GitHub API read fails or no publication reference exists. The new --modified face distinguishes the common draft case from that rarer degraded-read case (hasModifiedContent is only true when publicationCard.total > 0), rather than being an unreachable sub-branch."

requirements-completed: [QUICK-260812-q0d]

coverage:
  - id: D1
    description: "Done-state promote row copy emptied (title/detail = ''); box self-hides via existing promoteDetailBoxHasBody guard"
    requirement: QUICK-260812-q0d
    verification:
      - kind: unit
        ref: "tests/unit/deployment.test.ts#a proven-current production run newer than the newest publication marks production done and locks the button"
        status: pass
    human_judgment: false
  - id: D2
    description: "releasePipelineState() forces production to 'pending' when any draft is unpublished, with busy>active and genuinely-failed>failed carve-outs taking precedence"
    requirement: QUICK-260812-q0d
    verification:
      - kind: unit
        ref: "tests/unit/deployment.test.ts#an unpublished draft anywhere stops the live site reading as up to date, even with a proven-current, non-stale production release"
        status: pass
      - kind: unit
        ref: "tests/unit/deployment.test.ts#something genuinely in flight always outranks the pending-draft rule"
        status: pass
      - kind: unit
        ref: "tests/unit/deployment.test.ts#a real failure must stay visible and actionable regardless of unrelated pending drafts"
        status: pass
    human_judgment: false
  - id: D3
    description: "Node 1 shows a static blue circle and 'Contenu modifié — prêt à être publié' when a draft is waiting, via a presentational boolean (PipelineSegmentKind stays four-valued)"
    requirement: QUICK-260812-q0d
    verification:
      - kind: unit
        ref: "tests/unit/pipeline-view.test.ts#pipelineCircleClassName adds the --modified face only for pending + hasModifiedContent=true"
        status: pass
      - kind: unit
        ref: "tests/unit/pipeline-view.test.ts#pipelineNodeDetail with both pending and the flag true, node1 and node2 read the modified-content copy"
        status: pass
      - kind: unit
        ref: "tests/unit/editorial-dashboard-markup.test.ts#passes hasModifiedContent to node 1's circle only, never node 2's"
        status: pass
    human_judgment: false
  - id: D4
    description: "Node 1 label reads 'Studio'; old label 'Contenu + site de test' present nowhere in source or tests"
    requirement: QUICK-260812-q0d
    verification:
      - kind: unit
        ref: "tests/unit/editorial-dashboard-markup.test.ts#node 1's label span renders exactly \"Studio\", and the old label literal appears nowhere in the component source"
        status: pass
    human_judgment: false
  - id: D5
    description: "Round gate carries 'Aperçu du site de test' caption in the ready variant only, from a tested pure helper; releaseGate.ts untouched"
    requirement: QUICK-260812-q0d
    verification:
      - kind: unit
        ref: "tests/unit/pipeline-view.test.ts#pipelineGateCaption returns a non-empty caption naming the site de test for ready"
        status: pass
      - kind: unit
        ref: "tests/unit/editorial-dashboard-markup.test.ts#derives the gate caption from the shared helper and renders it in its own span, gated on truthiness"
        status: pass
    human_judgment: false
  - id: D6
    description: "All four blocking gates pass and scope boundary git-proven (dashboardLogic.ts, releaseGate.ts, .github/workflows/ untouched; PipelineSegmentKind union unchanged); Studio redeployed"
    verification:
      - kind: unit
        ref: "npm run test:unit (full suite, 505 tests, all pass)"
        status: pass
      - kind: other
        ref: "npm run typecheck / npm --prefix sanity run lint / npm --prefix sanity run build — all clean"
        status: pass
    human_judgment: false
  - id: D7
    description: "Visual confirmation on the live redeployed Studio of all four changes (a-d)"
    human_judgment: true
    rationale: "Requires an authenticated browser session against the live Sanity Studio; this environment cannot log in or visually inspect the deployed UI. Recorded verbatim below for the user to confirm."
    verification: []

duration: ~20min active (across two sessions separated by a mid-task watchdog stall/resume — see Issues Encountered)
completed: 2026-08-13
status: complete
---

# Quick Task 260812-q0d: Dashboard Pipeline Pending-Draft Awareness Summary

**Pending-draft-aware production status, extracted+tested pipelineView.ts helpers, node 1 relabelled "Studio" with a blue modified-content state, and a round-gate preview caption — all shipped to the redeployed Sanity Studio.**

## Performance

- **Duration:** ~20 min of active execution, split across two sessions (see Issues Encountered)
- **Started:** 2026-08-13T07:40:25+02:00 (Task 1 commit)
- **Completed:** 2026-08-13T10:06:00+02:00 (Studio deploy success)
- **Tasks:** 6/6 completed
- **Files modified:** 9 (5 source, 4 test) + 1 doc (README.md)

## Accomplishments

- `resolvePromoteRow()`'s done branch now returns empty title/detail, so the promote box self-hides instead of triple-repeating "Site en ligne à jour" alongside node 2 and the gate checkmark.
- `releasePipelineState()`'s production segment now reads `busy -> 'active'`, then a genuinely failed production run `-> 'failed'`, then `pendingCount > 0 -> 'pending'`, then the prior stale/kind fallback — so any unpublished draft stops "Site en ligne" from reading as done, while a real failure's retry affordance is never masked.
- New `sanity/editorial/pipelineView.ts`: three pure, dependency-free, unit-tested helpers (`pipelineCircleClassName`, `pipelineNodeDetail`, `pipelineGateCaption`) extracted from `EditorialDashboard.tsx`, following the `releaseGate.ts` precedent.
- Node 1 renamed "Studio" (was "Contenu + site de test"); it turns a static blue when `publicationCard.total > 0` and reads "Contenu modifié — prêt à être publié".
- Round gate button gains a small caption ("Aperçu du site de test") in the `ready` variant only, via a new `pipeline-connector-track` wrapper div that keeps the existing link/gate geometry intact.
- `sanity/README.md`'s pipeline paragraph resynced to the new stage names, the blue modified state, the never-shown-as-current-while-pending rule, and the gate caption.
- All four blocking gates pass (`test:unit` 505/505, `typecheck` 0 errors, `sanity lint` clean, `sanity build` succeeds); scope boundary git-proven; Studio redeployed to https://atelier-jacqueline-suzanne.sanity.studio/.

## Task Commits

Each task was committed atomically:

1. **Task 1: deployment.ts — empty done-state promote copy, pending-draft production guard** - `3b51d25` (fix)
2. **Task 2: Extract pipelineView.ts with modified-content state and gate caption** - `8cd5be9` (feat)
3. **Task 3: Rewire EditorialDashboard.tsx — Studio label, modified node 1, gate caption** - `f7d2651` (feat)
4. **Task 4: EditorialDashboard.css — modified circle face and gate caption** - `6450ff9` (feat)
5. **Task 5: Resync README pipeline paragraph** - `366ad60` (docs)
6. **Task 6: Gates, scope proof, redeploy** - no source commit (verification/deploy only); see Verification below.

**Plan metadata:** committed separately by the orchestrator (this SUMMARY, STATE.md, ROADMAP.md).

## Files Created/Modified

- `sanity/editorial/deployment.ts` - Emptied done-state promote copy; new production-segment precedence (busy > failed > pending-draft > stale/kind)
- `sanity/editorial/pipelineView.ts` (new) - Three pure presentational helpers with no runtime imports
- `sanity/editorial/EditorialDashboard.tsx` - Imports the extracted helpers, deletes local duplicates, derives `hasModifiedContent`, relabels node 1, wires the gate caption and connector-track wrapper
- `sanity/editorial/EditorialDashboard.css` - `--modified` circle face, `connector`/`connector-track` split, gate caption rule
- `sanity/README.md` - Pipeline paragraph resynced (Studio/Site en ligne, blue state, pending-draft rule, gate caption)
- `tests/unit/deployment.test.ts` - 4 new/updated cases for the emptied copy and the busy/failed/pending-draft precedence
- `tests/unit/pipeline-view.test.ts` (new) - Behavioral coverage of all three `pipelineView.ts` helpers
- `tests/unit/editorial-dashboard-markup.test.ts` - 7 new wiring cases for the Studio relabel, modified circle, and gate caption
- `tests/unit/editorial-dashboard-css.test.ts` - 4 new CSS guard cases + 1 stale-message fix

## Decisions Made

- Production segment precedence is exactly `busy -> active`, then `genuinely failed -> failed`, then `pendingCount > 0 -> pending`, then the prior stale/kind fallback — locked in by dedicated tests (`something genuinely in flight always outranks the pending-draft rule`, `a real failure must stay visible and actionable regardless of unrelated pending drafts`). This was corrected during plan review, before execution, from an earlier draft that would have let a pending draft mask a genuine production failure's retry button.
- The `--modified` circle face reuses `--active`'s exact declarations (background/border/color from `--dashboard-publish-accent`) rather than any new color literal, per the scope boundary's "no new colour values" rule — the icon (spinner vs. static glyph) is the only differentiator between running and waiting.
- `pendingCount > 0` is not the only route to a `'pending'` node-1 segment — `deploymentState()`'s `'unknown'` kind (API read failure / no publication reference) also maps to `'pending'`. The `--modified` face is gated on `hasModifiedContent` (`publicationCard.total > 0`), not on the segment kind alone, so it correctly distinguishes the common "draft waiting" case from the rarer degraded-read case rather than being unreachable.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed sanity/ npm dependencies from the existing lockfile**
- **Found during:** Task 3 verification (`npm --prefix sanity run lint`)
- **Issue:** `sanity/node_modules` was absent in this worktree (`ERR_MODULE_NOT_FOUND` for `@sanity/eslint-config-studio`), blocking lint/build.
- **Fix:** Ran `npm ci --prefix sanity`, which installs exactly what `sanity/package-lock.json` already pins — no new or different package was introduced, so this does not fall under the package-manager-install exclusion in Rule 3 (that exclusion targets adding an unverified/new package name, not restoring an already-locked dependency tree).
- **Files modified:** none (`sanity/package-lock.json` and `sanity/package.json` are byte-identical before/after — confirmed via `git diff --stat`).
- **Verification:** `npm --prefix sanity run lint` and `npm --prefix sanity run build` both then succeeded.

---

**Total deviations:** 1 auto-fixed (1 blocking, environment-only, no code/lockfile change).
**Impact on plan:** No scope creep; this was purely restoring the pre-committed dependency tree so the plan's own blocking gates could run.

## Issues Encountered

- **Mid-task watchdog stall.** Execution paused for over 10 minutes partway through Task 3 (right after deleting the local `pipelineCircleClassName` duplicate from `EditorialDashboard.tsx`, before deleting the local `pipelineNodeDetail` duplicate). The coordinator resumed the task with the exact resume point; the remainder of Task 3 (deleting `pipelineNodeDetail`, relocating `hasModifiedContent`/`pipelineDetail`, the node 1/gate JSX changes, the new markup test cases) and Tasks 4–6 were completed in the resumed session. No rework was needed — Tasks 1–2's commits (`3b51d25`, `8cd5be9`) were verified intact before resuming.
- **`git diff ... | grep -c 'PipelineSegmentKind ='` returned 2, not the plan's expected 0.** Investigated: both matches are unchanged context lines from local `const productionSegment: PipelineSegmentKind = ...` / `const content: PipelineSegmentKind = ...` type-annotated variable declarations, pulled into the diff hunk's surrounding context by Task 1's added comment block — not a widening of the `type PipelineSegmentKind = 'pending' | 'active' | 'done' | 'failed'` union declaration itself, which does not appear anywhere in the diff (confirmed via `grep -n "export type PipelineSegmentKind"` showing the line unchanged at its original location). The actual scope-boundary intent (no fifth value, no widening) holds.
- **The plan's Task 6 note about pre-existing concurrent-session dirty files (`src/client/`, `sanity/package.json`, etc.) did not apply to this worktree.** `git diff --stat` against the base SHA for `sanity/` and `tests/` listed exactly this plan's 9 files, with no extra concurrent-session files mixed in — this worktree's working tree was clean of any unrelated changes throughout execution.

## User Setup Required

None - no external service configuration required.

## Needs user confirmation

The Studio has been redeployed to https://atelier-jacqueline-suzanne.sanity.studio/. This session ran fully autonomously with no live user in the loop, so the plan's human-check step below could not be answered live — it is recorded here verbatim for you to walk through and confirm:

> Le Studio a été redéployé. Ouvre https://atelier-jacqueline-suzanne.sanity.studio/ et fais un **rechargement forcé** (Cmd+Shift+R) pour charger le nouveau bundle — cet environnement n'a pas de session navigateur authentifiée, donc toi seul peux confirmer le rendu.
>
> **Étape 1 — avec au moins un brouillon non publié** (modifie n'importe quel contenu et laisse-le en brouillon), regarde le panneau « Mettre le site à jour » :
>
> (a) Le texte « Site en ligne à jour » / « Le site en ligne reflète la dernière mise à jour. » sous le pipeline a disparu — plus de boîte grise vide à cet endroit.
>
> (b) L'étape « Site en ligne » n'est plus verte / plus cochée, alors même que le site en ligne n'a pas changé. C'est le compromis que tu as accepté explicitement : dès qu'un brouillon existe, l'indicateur cesse d'annoncer que le site est à jour.
>
> (c) La première étape s'appelle maintenant « Studio » (et non plus l'ancien nom), son rond est bleu (sans animation, sans clignotement) et la petite ligne dessous lit « Contenu modifié — prêt à être publié ».
>
> À cette étape le bouton rond central est **verrouillé (cadenas) et n'a volontairement aucune légende** — il n'y a encore rien à prévisualiser. C'est normal, ce n'est pas le point (d).
>
> **Étape 2 — pour vérifier le point (d)** : clique « Mettre le site à jour », attends que l'étape « Studio » redevienne verte (reconstruction du site de test terminée). Le bouton rond central devient alors bleu et cliquable :
>
> (d) Une petite légende « Aperçu du site de test » apparaît juste sous ce bouton rond, dans le même registre visuel que les petites phrases explicatives des deux autres boutons du panneau.
>
> **Point (d) — attention** : il a été implémenté à partir d'une description dictée vocalement et partiellement transcrite, sans capture d'écran de référence. Un écart de format (taille, position, formulation) est attendu et normal ; dis simplement ce qui ne va pas et on l'ajuste en un tour. Ce n'est pas un échec du reste.
>
> Réponds « approuvé » si tout est bon, ou décris ce qui cloche (en précisant lequel des points a/b/c/d).

## Next Phase Readiness

- Dashboard pipeline changes are complete, tested, and deployed. No blockers.
- Awaiting the visual confirmation above (or a one-round adjustment, most likely on point d, the gate caption).

---
*Phase: quick-260812-q0d*
*Completed: 2026-08-13*

## Self-Check: PASSED

All created/modified files confirmed present (`sanity/editorial/pipelineView.ts`, `tests/unit/pipeline-view.test.ts`, `.planning/quick/260812-q0d-dashboard-pipeline-pending-draft-awarene/260812-q0d-SUMMARY.md`). All five task commits confirmed present in `git log` (`3b51d25`, `8cd5be9`, `f7d2651`, `6450ff9`, `366ad60`).
