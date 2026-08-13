---
phase: quick-260813-gw2
plan: 1
subsystem: ui
tags: [sanity, react, editorial-dashboard, typescript, vitest]

requires:
  - phase: quick-260813-g49
    provides: releasePanelSubtitle() and the emptied promote-box copy the merged button now replaces the second button of
provides:
  - "releaseActionButtonState() in pipelineView.ts — a five-branch pure helper driving a single evolving action button"
  - "A no-qualified-run deploy now reads as 'failed' (red) instead of 'waiting-run' (blue) forever, at and after a three-minute timeout"
  - "EditorialDashboard.tsx has a single top-panel action button, replacing the old two-button (top + promote-box) design"
affects: [editorial-dashboard, sanity-studio-ux]

tech-stack:
  added: []
  patterns:
    - "Pure presentational-helper extraction pattern for EditorialDashboard.tsx (pipelineView.ts) continued: a fifth exported function added alongside pipelineCircleClassName/pipelineNodeDetail/pipelineGateCaption/releasePanelSubtitle"
    - "Priority-ordered branch functions with explicit branch-order tests plus a small boolean/enum matrix for invariant assertions"

key-files:
  created: []
  modified:
    - sanity/editorial/pipelineView.ts
    - sanity/editorial/deployment.ts
    - sanity/editorial/EditorialDashboard.tsx
    - sanity/README.md
    - tests/unit/pipeline-view.test.ts
    - tests/unit/deployment.test.ts
    - tests/unit/editorial-dashboard-markup.test.ts

key-decisions:
  - "Merged button's ready-state tone is 'positive' (established succeeded-signal), release-in-flight tone stays 'primary' — the tone union has only two members so a critical/retry tone can never be added by accident"
  - "The preview-before-publish gate is enforced twice in the merged button (disabled AND action:'inert') and reused verbatim from releaseGate.ts (byte-identical)"
  - "Failure retry stays exclusively on the round gate; the merged button gains no second retry affordance in any failure state"
  - "A no-qualified-run deploy's kind flips to 'failed' at the existing 3-minute timeout, with terminal staying false so a late-appearing run still self-heals the state"

requirements-completed: [QUICK-260813-gw2]

coverage:
  - id: D1
    description: "releaseActionButtonState() computes the merged button's label/tone/disabled/loading/action from a strict 5-branch priority order, with zero new user-facing strings"
    requirement: "QUICK-260813-gw2"
    verification:
      - kind: unit
        ref: "tests/unit/pipeline-view.test.ts#releaseActionButtonState"
        status: pass
    human_judgment: false
  - id: D2
    description: "The preview-before-publish safety gate is preserved: action:'release' is unreachable without gateVariant==='ready' and productionPublishBlocked===false"
    requirement: "QUICK-260813-gw2"
    verification:
      - kind: unit
        ref: "tests/unit/pipeline-view.test.ts#releaseActionButtonState invariant matrix — action 'release' only when ready and unblocked"
        status: pass
    human_judgment: false
  - id: D3
    description: "The second promote-box button is removed; the box now carries only the failure run link, gated on actionUrl alone"
    requirement: "QUICK-260813-gw2"
    verification:
      - kind: unit
        ref: "tests/unit/editorial-dashboard-markup.test.ts#editorial dashboard pipeline-detail box carries only actions"
        status: pass
    human_judgment: false
  - id: D4
    description: "A never-started deploy (no qualified run after 3 minutes) now reads as 'failed' and turns the corresponding pipeline stage red, for both staging and production targets, with terminal staying false"
    requirement: "QUICK-260813-gw2"
    verification:
      - kind: unit
        ref: "tests/unit/deployment.test.ts#not-started timeout boundary and segment mapping"
        status: pass
    human_judgment: false
  - id: D5
    description: "The merged button is live in the deployed Sanity Studio and visually behaves as designed across the site-de-test-ready, idle, and in-flight states"
    verification: []
    human_judgment: true
    rationale: "Requires a human to hard-refresh the deployed Studio and observe the button across live workflow states (a/b/c) as described in the human-check below — this cannot be verified from source or unit tests alone."

duration: ~25min
completed: 2026-08-13
status: complete
---

# Quick Task 260813-gw2: Merge the two publish buttons into one evolving control

**One panel button now evolves through label/tone/disabled/loading/click-target across the whole publish→preview→release workflow, driven by a new tested `releaseActionButtonState()` helper, and a never-started deploy now turns its pipeline stage red instead of staying blue forever.**

## Performance

- **Duration:** ~25 min
- **Completed:** 2026-08-13T10:35:24Z
- **Tasks:** 5 (5 completed)
- **Files modified:** 7

## Accomplishments

- Added `releaseActionButtonState()` to `pipelineView.ts` — a pure, five-branch helper (checked top to bottom, first match wins) that computes the merged button's `label`, `disabled`, `loading`, `tone`, and `action`:
  1. **Publishing drafts** → `'Vérification…'` (while preflighting) or `'Publication…'`, disabled, loading, tone `primary`, action `inert`.
  2. **Production release in flight** (`releaseBusy` or `gateVariant === 'active'`) → `'Publication…'`, disabled, loading, tone `primary` (deliberately NOT `positive` — outcome still unknown), action `inert`.
  3. **Staging ready** (`gateVariant === 'ready'`) → `'Publier sur le site en ligne'`, tone `positive`, `disabled`/`action` double-guarded by `productionPublishBlocked` (the preview-before-publish gate).
  4. **Drafts pending** (`modifiedCount > 0`) → `'Mettre le site à jour'`, enabled unless `publishButtonDisabled`, tone `primary`, action `publish` or `inert`.
  5. **Everything else** (`locked`, `done`, `failed`) → `'Mettre le site à jour'`, disabled, tone `primary`, action `inert`. `failed` is deliberately not its own branch — retry stays exclusively on the round gate.
- Fixed `deploymentState()`'s no-qualified-run branch in `deployment.ts`: `kind` is now `timedOut ? 'failed' : 'waiting-run'` (was always `'waiting-run'`), so a deploy that never started now paints its pipeline stage red instead of rendering identically to a genuinely still-running deploy forever. Every other field (`label`, `detail`, `tone`, `terminal`, `actionLabel`, `actionUrl`) is byte-identical; `terminal` stays `false` so a late-appearing run still self-heals the state.
- Rewired `EditorialDashboard.tsx` so the top panel button is the SOLE action control — driven by `releaseActionButtonState()` and routed through a new `handleReleaseActionClick()` to the two existing, unchanged handlers (`runPublication()` / `triggerProductionReleaseClick()`). Deleted the second `"Publier sur le site en ligne"` button from the promote box; `promoteActionsBoxHasBody` simplified back to `Boolean(pipeline.promote.actionUrl)` — the box now carries only the failure run link.
- Resynced `sanity/README.md`: step 6 of the daily workflow now matches the actual two-click flow (open/review the site de test via the round gate, then click the panel's own button — which now reads "Publier sur le site en ligne" at that stage); the "Mise à jour non démarrée" bullet now notes the stage turns red; the panel button is described as changing label with the stage, and the zone under the progress bar as carrying only a link, never a button.
- 559/559 unit tests pass, `npm run typecheck` reports 0 errors, `npm --prefix sanity run lint` is clean, `npm --prefix sanity run build` succeeds, and the Studio has been redeployed to https://atelier-jacqueline-suzanne.sanity.studio/.

## Task Commits

Each task was committed atomically:

1. **Task 1: pipelineView.ts — add the tested releaseActionButtonState() helper** - `12754fb` (test)
2. **Task 2: deployment.ts — make a never-started deploy read as failed instead of forever-in-progress** - `b0cde5d` (fix)
3. **Task 3: EditorialDashboard.tsx — one evolving button instead of two** - `7c170b3` (feat)
4. **Task 4: Resync the README passages this change makes false** - `ddf88a0` (docs)
5. **Task 5: Run every gate, prove scope, redeploy the Studio** - no source changes; verification/deploy only (this SUMMARY is the record)

**Plan metadata:** committed separately by the orchestrator after this SUMMARY is written.

## Files Created/Modified

- `sanity/editorial/pipelineView.ts` - Added `releaseActionButtonState()`, `ReleaseActionButtonTone`, `ReleaseActionButtonAction`, `ReleaseActionButtonState` (fifth exported helper, no runtime imports added)
- `sanity/editorial/deployment.ts` - `deploymentState()`'s no-qualified-run branch: `kind` now reassigns to `'failed'` when `timedOut`
- `sanity/editorial/EditorialDashboard.tsx` - Single merged action button; `handleReleaseActionClick()`; deleted second promote-box button; simplified `promoteActionsBoxHasBody`
- `sanity/README.md` - Step 6, the "Mise à jour non démarrée" bullet, and the panel-button/progress-bar-zone description resynced to the merged-button behaviour
- `tests/unit/pipeline-view.test.ts` - New `releaseActionButtonState` describe: 11 state cases, 5 explicit priority-order cases, 4 matrix invariants (26 new tests)
- `tests/unit/deployment.test.ts` - Re-pointed 2 existing cases (explicit `now` for the timestamp-selection test; `kind: 'failed'` expectation for the timeout test), added a new boundary/segment-mapping/untouched-branch describe
- `tests/unit/editorial-dashboard-markup.test.ts` - Re-pointed 3 existing cases (go-live label now asserted absent, `promoteActionsBoxHasBody` no longer includes the ready-variant term, promote box body asserted to contain no `<Button`), added a new describe for the merged button's end-to-end wiring

## Decisions Made

- **Tone union kept two-valued (`'primary' | 'positive'`), no `'critical'` member.** A `critical` tone would only ever mean a retry, and retry is scoped exclusively to the round gate — an unreachable third union member would invite exactly the second retry control this plan explicitly forbids. A matrix invariant test asserts no input combination ever yields anything but the two allowed tones.
- **Branch 3 (ready) double-guards the preview approval**, setting both `disabled: true` AND `action: 'inert'` when `productionPublishBlocked` is true. This is the deliberate preview-before-publish safety gate built earlier this session; the double guard means one mis-wire in the component cannot alone defeat it. `productionPublishDisabled()` is reused verbatim from `releaseGate.ts` (untouched).
- **Branch 2's tone stays `'primary'`, not `'positive'`, even though it sits directly below the `'positive'` branch 3.** `'positive'` is this codebase's established "succeeded" signal (`deploymentState()` only sets it on `conclusion === 'success'`); using it for an in-flight, uncertain release would misreport success before it happened, and would visually contradict node 2's own circle, which stays the blue `--active` face for the same duration.
- **Branch 5 (fallback) deliberately does not special-case `failed`.** Retry lives exclusively on the round gate's `gateClickAction('failed')` routing; the merged button offers only its ordinary drafts-pending behaviour under a production failure, by design.
- **Change 3's `terminal` flag stays `false` on the reassigned branch.** Polling continues at 15s, so a late-appearing run still self-heals the state to `'deploying'`/`'current'`. Flipping `terminal` to `true` would slow the poll to 5 minutes and strand a recoverable state as permanently red.

## Deviations from Plan

None — plan executed exactly as written across all five tasks, following the plan's own explicit branch-ordering and comment instructions verbatim.

One environment fix was required to reach the gates: `sanity/node_modules` was missing at the start of Task 3's verification step (unrelated concurrent-session artifact, not caused by this plan's edits — confirmed by `git diff --stat sanity/package-lock.json sanity/package.json` showing no changes from this run). Per the plan's own explicit allowance ("if `sanity/node_modules` is missing when you reach lint/build, running `npm ci --prefix sanity` ... is fine"), it was restored via `npm ci --prefix sanity` before running the unit suite, lint, typecheck and build. This is not a deviation under Rules 1-4 — it was pre-authorized by the plan text itself.

## Issues Encountered

None.

## Threat Model Follow-Up

- **T-gw2-01 (Elevation of Privilege, high, mitigate):** Addressed — the helper enforces the preview gate twice, a matrix invariant test proves `action: 'release'` is unreachable without a recorded preview, and the markup suite pins the `productionPublishDisabled({...hasPreviewedStaging})` argument in the derivation.
- **T-gw2-02 (Denial of Service, high, mitigate):** Addressed — `triggerProductionReleaseClick()` has exactly two call sites in the component (the merged button's `handleReleaseActionClick`, and the round gate's failed-variant retry in `handleGateClick`), confirmed both by the added markup test and by manually reading the rendered JSX in Task 5.
- **T-gw2-03 (Repudiation, medium, mitigate):** Addressed — Change 3's reassigned `kind` now turns the stuck stage red, with boundary and segment-mapping tests for both staging and production targets, and `terminal: false` retained.
- **T-gw2-04 (Elevation of Privilege, medium, accept):** Recorded below under "Change 3 investigation trail and consequences" — no code change, accepted as-is per the plan's disposition.
- **T-gw2-05 (Tampering, low, accept):** No packages were installed by this plan (the one `npm ci --prefix sanity` run restored the already-locked dependency tree, not a new/changed dependency) — no package-legitimacy gate applies.

## Details for the maintainer

### The merged button's five-branch priority order

Checked top to bottom, first match wins:

1. **Publishing drafts** → `'Vérification…'` while preflighting, else `'Publication…'` — disabled, loading, tone `primary`, action `inert`.
2. **Production release in flight** (trigger request OR observed in-flight run) → `'Publication…'` — disabled, loading, tone `primary`, action `inert`.
3. **Staging ready** → `'Publier sur le site en ligne'` — tone `positive`; `disabled`/`action` gated on the preview-before-publish rule (see below).
4. **Drafts pending** → `'Mettre le site à jour'` — enabled unless the publication card blocks it, tone `primary`, action `publish`.
5. **Everything else** (locked, done, or failed) → `'Mettre le site à jour'` — disabled, tone `primary`, action `inert`.

All four labels already existed verbatim in the codebase before this plan; zero new user-facing strings were introduced.

### The preview-before-publish gate is untouched, and now enforced twice

`releaseGate.ts` is byte-identical (confirmed by `git diff --name-only` against the base SHA printing nothing). The merged button's branch 3 sets BOTH `disabled: true` AND `action: 'inert'` whenever `productionPublishBlocked` is true, so a single mis-wire in the component cannot alone let a click publish to production without a recorded site-de-test review.

### Failure-state retry stays exclusively on the round gate

The merged button's tone union has exactly two members (`'primary' | 'positive'`) — no `'critical'` member exists, specifically so a second retry control cannot be added to this button by accident. Under `gateVariant === 'failed'`, the button keeps its ordinary drafts-pending/disabled behaviour; retry is reached only via the round gate's `gateClickAction('failed')` routing.

### Change 3 investigation trail

The live production run started `2026-08-13T09:38:55Z` and finished at `09:44:18Z` — about 5.5 minutes. The user's original observation was most likely a legitimately long run rather than a bug. The distinct gap this plan fixes is different: a deploy that never STARTS was rendering identically (blue, spinning) to one still genuinely running, because `deploymentSegmentKind()` branched only on `kind`, never on `tone` — even though the no-qualified-run branch had already been reporting `tone: 'critical'` for three minutes.

**Accepted consequence (T-gw2-04):** a timed-out STAGING deploy now flips the round gate from locked to a red retry that routes to a production release of a staging build that never rebuilt — this is the identical path a genuinely-failed staging run already takes today, not a new mechanism. Left as-is per the threat register; changing it would require editing `releaseGate.ts`, which is out of scope for this plan.

**Welcome consequence:** with `segments.staging === 'failed'`, `resolvePromoteRow()` now renders a "Prévenir le mainteneur" link to the workflow page in the promote box for the stuck case — where previously it rendered nothing at all.

### Untouched files (scope boundary held)

`git diff --name-only 2bad450287ebdd7a1dc7ca3ac515625686123b05 -- sanity/editorial/dashboardLogic.ts sanity/editorial/releaseGate.ts sanity/editorial/EditorialDashboard.css tests/unit/release-gate.test.ts .github/workflows/` printed nothing — confirmed untouched. Neither the `PipelineSegmentKind` union (`grep -cF "= 'pending' | 'active' | 'done' | 'failed'"` → `1`) nor the `PipelineGateVariant` union (`grep -cF "= 'locked' | 'ready' | 'active' | 'done' | 'failed'"` → `1`) was widened. `git diff --stat` against the base SHA over `sanity/` and `tests/` lists exactly this plan's seven files and no others.

## Needs user confirmation

This was a fully autonomous run with no live user in the loop, so the following human-check from Task 5 could not be confirmed live. Recorded here verbatim for the user to perform:

> Le Studio a été redéployé. Ouvre https://atelier-jacqueline-suzanne.sanity.studio/ et fais un **rechargement forcé** (Cmd+Shift+R) pour charger le nouveau bundle — cet environnement n'a pas de session navigateur authentifiée, donc toi seul peux confirmer le rendu.
>
> Il n'y a désormais qu'**un seul bouton** dans le bloc de publication, en haut à droite : c'est lui qui change de texte, de couleur et d'action selon l'étape. Le bouton qui apparaissait sous la barre de progression a disparu.
>
> Si possible, vérifie sur plusieurs moments :
>
> **(a) Une fois le site de test à jour** — le bouton du haut doit maintenant afficher **« Publier sur le site en ligne »**, en vert, mais **grisé** tant que tu n'as pas cliqué le bouton rond au centre de la barre pour ouvrir l'aperçu du site de test. Après cet aperçu, il devient cliquable. Ce garde-fou est volontaire et n'a pas changé : impossible de publier en ligne sans avoir ouvert le site de test avant.
>
> **(b) Une fois la mise en ligne terminée et plus rien en attente** — le bouton doit revenir à **« Mettre le site à jour »** (grisé s'il n'y a rien à publier, bleu et cliquable dès qu'un brouillon attend).
>
> **(c) Pendant une vraie mise en ligne** — le bouton affiche « Publication… » avec sa roue, et l'étape « Site en ligne » reste bleue **tant que le déploiement tourne réellement**, puis passe au vert une fois terminé. Important : la dernière mise en ligne réelle a pris **environ 5 minutes 30**, donc c'est normal que ce soit long. **Laisse l'onglet ouvert sans le recharger** pendant que tu observes : un rechargement réinitialise le suivi en cours dans le navigateur et affichera un état différent — ce n'est pas un bug.
>
> Et si un déploiement ne démarre jamais (aucune exécution GitHub après trois minutes), l'étape concernée devient maintenant **rouge** au lieu de rester bleue indéfiniment, avec un lien pour prévenir le mainteneur.
>
> Réponds « approuvé » si tout est bon, ou décris ce qui cloche en précisant le point (a/b/c).

## Next Phase Readiness

- No blockers. The merged button and the Change 3 timeout fix are both fully tested and deployed live.
- Pending: the user's live confirmation across states (a)/(b)/(c) above. No further plan work depends on this confirmation; it is a UX sign-off, not a blocking technical gate.

---
*Phase: quick-260813-gw2*
*Completed: 2026-08-13*

## Self-Check: PASSED

All 8 claimed files verified present on disk (7 plan files + this SUMMARY). All 4 task commit hashes (`12754fb`, `b0cde5d`, `7c170b3`, `ddf88a0`) verified present in `git log`.
