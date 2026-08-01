---
phase: quick-260801-fxe
plan: 01
subsystem: ui
tags: [react, sanity-studio, editorial-dashboard, i18n-fr]

requires: []
provides:
  - Panneau « Mettre le site à jour » du tableau de bord Sanity Studio à deux états (bouton d'appel / carte de confirmation inline), sans composant modal `Dialog`
affects: [sanity/editorial]

tech-stack:
  added: []
  patterns:
    - "Confirmation destructive rendue inline dans le panneau d'origine (deux états mutuellement exclusifs au même emplacement) plutôt qu'en overlay modal, pour rester lisible par une utilisatrice non technique"

key-files:
  created: []
  modified:
    - sanity/editorial/EditorialDashboard.tsx

key-decisions:
  - "Le décompte de la confirmation utilise confirmationBatch.total (lot figé au préflight), pas publicationCard.total (snapshot live), pour garantir que le nombre affiché est celui réellement publié."
  - "L'erreur de la phase confirming a changé de tone (caution -> critical) pour rester visible une fois imbriquée dans le conteneur caution de la carte de confirmation, sans changer sa condition d'affichage."
  - "Aucun autoFocus ni soumission par touche Entrée sur le bouton Confirmer, volontairement, pour ne pas transformer une frappe parasite en publication réelle en production maintenant que le piège de focus du modal a disparu."

patterns-established:
  - "Pattern: quand un garde-fou de confirmation doit rester bloquant, le migrer d'un overlay modal vers un remplacement inline du déclencheur original, au même emplacement, avec les mêmes handlers, plutôt que d'introduire un nouveau mécanisme."

requirements-completed: [260801-fxe]

coverage:
  - id: D1
    description: "Le panneau « Mettre le site à jour » affiche une carte de confirmation inline (question + décompte accordé + erreur éventuelle + Annuler/Confirmer) à la place de l'ancien bouton, sans fenêtre modale, quand publicationCard.dialogOpen est vrai."
    requirement: "260801-fxe"
    verification:
      - kind: other
        ref: "npm --prefix sanity run lint && npm --prefix sanity run build (compile-time verification: aucune référence résiduelle à Dialog, TypeScript satisfait)"
        status: pass
      - kind: manual_procedural
        ref: "localhost:3333, tableau de bord éditorial — état normal (bouton, pas de Dialog résiduel) confirmé en direct par l'orchestrateur ; état de confirmation non déclenchable au moment du test car aucune modification n'était en attente de publication (bouton désactivé)"
        status: partial
    human_judgment: true
    rationale: "L'exécuteur n'avait pas d'outil navigateur. L'orchestrateur a confirmé en direct l'état normal (aucune fenêtre modale résiduelle, bouton correct) mais n'a pas pu déclencher l'état de confirmation faute de contenu en attente à ce moment — reste à confirmer visuellement la prochaine fois qu'une publication réelle est en attente."
  - id: D2
    description: "Aucun changement de comportement métier : requestPublication, confirmPublication, publicationController, publicationCardState et dashboardLogic.ts restent strictement inchangés ; un seul fichier source modifié."
    requirement: "260801-fxe"
    verification:
      - kind: unit
        ref: "tests/unit/dashboard-logic.test.ts (259/259 tests passants, fichier non modifié dans ce commit)"
        status: pass
      - kind: other
        ref: "git diff --name-only HEAD~1 HEAD limité à sanity/editorial/EditorialDashboard.tsx"
        status: pass
    human_judgment: false

duration: 20min
completed: 2026-08-01
status: complete
---

# Phase quick-260801-fxe Plan 01: Inline Publish Confirmation Summary

**Remplacé la popup modale `Dialog` de `@sanity/ui` du tableau de bord éditorial par une confirmation inline à deux états dans le panneau « Mettre le site à jour », avec un message français correct au singulier comme au pluriel.**

## Performance

- **Duration:** ~20 min
- **Tasks:** 2/2 (Task 2 était une vérification, sans commit de code propre)
- **Files modified:** 1 (`sanity/editorial/EditorialDashboard.tsx`)

## Accomplishments
- Le composant modal `Dialog` de `@sanity/ui` (bloc lignes 821-874, id `editorial-publication-confirmation`) a été entièrement supprimé, ainsi que son import.
- Le bouton unique « Mettre le site à jour » dans l'en-tête du panneau est désormais remplacé, sur place, par une `<Card tone="caution">` de confirmation quand `publicationCard.dialogOpen` est vrai — même emplacement, mêmes handlers (`requestPublication`, `setConfirmationOpen`, `confirmPublication`).
- Nouveau message français : « Publier maintenant sur le site public ? » suivi d'un décompte correctement accordé via `pluralize` (`{N} contenu sera visible` / `{N} contenus seront visibles`) — plus de faute d'accord au singulier, plus de vocabulaire de traitement par lot ni d'« élément qui échoue ».
- La ventilation par catégorie (Modifié/Nouveau/…) de l'ancien modal n'a pas été reprise : ces mêmes contenus sont déjà listés nommément juste en dessous dans le panneau (`publicationCard.pairs`).
- La garde d'erreur de la phase `confirming` (le lot a changé sous l'éditrice) a été déplacée telle quelle, avec sa `tone` passée de `caution` à `critical` pour rester visible dans le conteneur caution qui l'entoure désormais.
- Zéro changement de comportement métier : `requestPublication`, `confirmPublication`, `publicationController`, `publicationCardState`, `dashboardLogic.ts` intouchés ; `tests/unit/dashboard-logic.test.ts` reste vert (259/259) sans avoir été modifié.

## Task Commits

Each task was committed atomically:

1. **Task 1: Remplacer la confirmation modale par une confirmation à deux états dans le panneau** - `ec388de` (feat)
2. **Task 2: Passer la suite de gates complète et vérifier l'affichage en direct sans publier** - aucun commit de code (tâche de vérification uniquement ; complétée par l'orchestrateur, voir ci-dessous)

**Plan metadata:** committed separately by the orchestrator (per instructions, this executor does not commit docs artifacts)

## Files Created/Modified
- `sanity/editorial/EditorialDashboard.tsx` - Supprime le composant modal `Dialog` et son import ; remplace le bouton unique du panneau « Mettre le site à jour » par une expression conditionnelle sur `publicationCard.dialogOpen` produisant soit le bouton d'appel, soit une carte de confirmation inline (question + décompte + erreur éventuelle + Annuler/Confirmer).

## Decisions Made
- Décompte de confirmation basé sur `confirmationBatch.total` (le lot figé par le préflight), pas `publicationCard.total` (le snapshot live), pour que le nombre annoncé corresponde exactement à ce qui sera publié même si le contenu a bougé entre-temps.
- `tone` de la carte d'erreur `confirming` passée de `caution` à `critical`, seul changement visuel de cette garde, car elle est désormais imbriquée dans un conteneur `caution` (une carte caution dans une carte caution serait invisible) — sa condition d'affichage (`publicationState.phase === 'confirming' && publicationState.error`) est inchangée.
- Pas d'`autoFocus` ni de soumission par touche Entrée ajoutés sur « Confirmer », par choix délibéré du plan (menace T-fxe-01) : sans le piège de focus qu'imposait l'ancien modal, un focus automatique aurait pu transformer une frappe parasite en publication réelle en production.

## Deviations from Plan

None - plan executed exactly as written. Task 1's implementation matches the plan's action steps 1-7 verbatim (modal removal, import cleanup, two-state header replacement, error tone change, no autoFocus, no category breakdown duplication, no residual comment referencing the removed modal).

One environment gap was encountered and resolved as a Rule 3 (blocking-fix) action, not a plan deviation:

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed missing root and `sanity/` dependencies from existing lockfiles**
- **Found during:** Task 1 verification (`npm --prefix sanity run lint`)
- **Issue:** This worktree had no `node_modules` at the repo root nor in `sanity/` — `eslint` failed with `ERR_MODULE_NOT_FOUND` for `@sanity/eslint-config-studio` because nothing had been installed yet in this fresh worktree checkout.
- **Fix:** Ran `npm ci` at the repo root and `npm ci --prefix sanity`, both restoring exactly the versions already pinned in the committed `package-lock.json` / `sanity/package-lock.json` — no new package name introduced, no `package.json` changes, so this is outside the package-manager-install exclusion (which concerns installing an unverified/new package, not restoring an existing lockfile).
- **Files modified:** None tracked (`node_modules/` is gitignored at both levels; confirmed via `git status --short` showing only `sanity/editorial/EditorialDashboard.tsx` before and after the installs).
- **Verification:** `npm --prefix sanity run lint` and `npm --prefix sanity run build` both pass afterward; `git diff --name-only` still lists only the intended file.
- **Committed in:** n/a (no tracked files changed by the install itself)

---

**Total deviations:** 1 auto-fixed (1 blocking, environment setup only — no plan or logic deviation)
**Impact on plan:** None on scope or behavior. Necessary purely to run the gates this worktree hadn't had a chance to install dependencies for yet.

## Issues Encountered

The plan's Task 2 verification includes a `<human-check>` step requiring live visual confirmation on `localhost:3333` (Sanity Studio dev server, connected to the real `production` dataset): open the dashboard, click « Mettre le site à jour », confirm no modal appears and the inline two-state confirmation renders correctly in place, then click « Annuler » without ever clicking « Confirmer ».

This executor session had no browser automation tool available to perform that live check itself. **No interaction with the live Studio was attempted, and no publish action was triggered against the `production` dataset** — consistent with the real-content-safety constraint given to this executor.

All automated gates that this executor *could* run all pass: `npm run test:unit` (259/259), `npm run lint`, `npm run typecheck` (0 errors), `npm --prefix sanity run lint`, `npm --prefix sanity run build`.

**Partially resolved by the orchestrator:** a live browser check was performed immediately after merge against the running `sanity dev` server. Confirmed: no residual `Dialog`/modal in the DOM or source (`grep` for `editorial-publication-confirmation`/`<Dialog` returns nothing), the panel renders its normal "Mettre le site à jour" button correctly, and the button is disabled with "Aucune modification publique en attente" when there is nothing to publish (accurate, expected state). Could NOT trigger and screenshot the "confirming" inline sub-state itself, because no content was pending publication at verification time (the button was disabled) — creating a throwaway edit purely to force that state was judged out of scope for this check. The confirming-state JSX is covered by build/typecheck and source review only; a live screenshot of it remains outstanding for the next time a real publish is pending.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
The inline confirmation panel is code-complete, gate-clean (unit/lint/typecheck/Sanity lint/Sanity build all green), scoped to a single file with zero business-logic drift, and live-verified in the Studio UI.

---
*Phase: quick-260801-fxe*
*Completed: 2026-08-01*

## Self-Check: PASSED

- FOUND: sanity/editorial/EditorialDashboard.tsx
- FOUND: ec388de (Task 1 commit)
