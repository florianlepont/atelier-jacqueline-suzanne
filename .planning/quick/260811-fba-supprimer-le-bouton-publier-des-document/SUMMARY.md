---
phase: quick-260811-fba-supprimer-le-bouton-publier-des-document
plan: 01
subsystem: sanity-editorial-workflow
tags: [sanity, studio, publication, workflow, vitest]
requires: []
provides:
  - Verified document-level publication actions remain unavailable for all public Studio document types.
  - Verified global dashboard publication remains the sole configured publish path.
affects: [sanity-studio-deployment, editorial-workflow]
tech-stack:
  added: []
  patterns: ["Document edits remain draft-only; dashboard publication uses a guarded atomic Sanity Actions API batch."]
key-files:
  created: [.planning/quick/260811-fba-supprimer-le-bouton-publier-des-document/SUMMARY.md]
  modified: []
key-decisions:
  - "No source, test, configuration, dataset, or deployment change was needed because the existing policy is compliant."
requirements-completed: [QUICK-260811-FBA]
coverage:
  - id: D1
    description: "Public Studio documents exclude publish and unpublish actions while preserving draft-management actions."
    requirement: QUICK-260811-FBA
    verification:
      - kind: unit
        ref: "npm run test:unit -- tests/unit/workflow-logic.test.ts tests/unit/dashboard-logic.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "The Studio configuration loads the existing action resolver without publishing content."
    requirement: QUICK-260811-FBA
    verification:
      - kind: other
        ref: "npm --prefix sanity run build"
        status: pass
    human_judgment: false
duration: 3min
completed: 2026-08-11
status: complete
---

# Quick Task 260811-fba: Retrait des boutons Publier par document — Summary

**Politique Studio déjà conforme : les sept types publics restent en brouillon auto-enregistré et seul le Tableau de bord peut publier le lot atomique global.**

## Performance

- **Started:** 2026-08-11T09:05:07Z
- **Completed:** 2026-08-11T09:08:00Z
- **Tasks:** 2/2
- **Files modified:** 0 application/test/configuration files

## Accomplishments

- Confirmed `sanity.config.ts` delegates `document.actions` to `resolveActions`, which delegates to `filterDocumentActions`.
- Confirmed the public scope is exactly `siteSettings`, `homePage`, `editionsPage`, `aboutPage`, `contactPage`, `gallery`, and `edition`; all exclude `publish` and `unpublish`, while `discardChanges` and `restore` remain available. Singletons also exclude `delete` and `duplicate`.
- Confirmed the existing “Mettre le site à jour” dashboard button invokes `createPublicationController`, whose sole dispatch is the atomic Actions API call tagged `editorial.publish-all`.
- Passed the focused unit suite: 2 files, 105 tests.
- Passed the Sanity Studio build without interacting with the Studio UI, deploying the Studio, or mutating the production dataset.

## Verification

- `npm run test:unit -- tests/unit/workflow-logic.test.ts tests/unit/dashboard-logic.test.ts` — passed (105/105).
- `npm --prefix sanity run build` — passed. The command emitted only Sanity’s non-blocking version-alignment warning: local `sanity` 6.6.0 versus runtime 6.9.1.
- `git diff --name-only` was empty after the checks. The quick-plan directory was already untracked before execution; no existing application or test file was changed.

## Deployment Note

The repository source is already correct, but a separately deployed Sanity Studio will continue serving its previous bundle until it is deployed through the normal release process. No deployment was performed by this quick task.

## Decisions Made

- No implementation change was made: changing a conforming policy would widen this verification-only task and risk introducing a second publish path.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

- Summary exists at the required quick-task path.
- Both required validation commands passed.
- No code, test, configuration, content, or deployment mutation occurred.
