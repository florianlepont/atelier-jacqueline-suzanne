---
phase: 24-cross-linking-contact-cta
plan: 05
subsystem: content, testing, ui
tags: [sanity, playwright, e2e, gallery, edition, uat]

# Dependency graph
requires:
  - phase: 24-cross-linking-contact-cta (plans 01-04)
    provides: relatedEdition schema field, GROQ query/sanitizer, gallery-detail cross-link render, CONT-04 contact CTA component on gallery and édition detail pages
provides: []
affects: [24-cross-linking-contact-cta]

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified: []

key-decisions:
  - "None yet - execution paused at Task 1's blocking human-verify checkpoint before any repo changes were made"

patterns-established: []

requirements-completed: []  # None complete yet - EDN-12, CONT-04, UI-03 all pending checkpoint resolution

coverage: []

# Metrics
duration: in-progress
completed: null
status: checkpoint-pending
---

# Phase 24 Plan 05: Populate Cross-Link Content & UI-03 Verification Summary

**Execution paused at Task 1's blocking checkpoint — Sanity content authoring and Studio deploy require genuine human editorial action, not yet performed.**

## Performance

- **Duration:** N/A (paused before any task executed)
- **Started:** 2026-08-26 (this session)
- **Completed:** N/A - not complete
- **Tasks:** 0/3 completed
- **Files modified:** 0

## Status: CHECKPOINT REACHED (Task 1 of 3)

This plan has three tasks:
1. `checkpoint:human-verify` (gate=blocking) — populate the reverse `relatedEdition` cross-link in Sanity Studio and deploy the Studio
2. `type=auto` — convert the EDN-12 e2e test from a conditional contract test into a hard presence assertion, plus a scroll-track regression guard
3. `checkpoint:human-verify` (gate=blocking) — UI-03 cross-viewport UAT sign-off

Per the executing agent's explicit instructions, execution stops at the first checkpoint (Task 1) and returns the checkpoint state to the orchestrator rather than auto-approving, because Task 1 requires a real editorial decision (which gallery pairs with which édition) and a real Sanity Studio deploy — neither can be simulated or automated. No repo files have been modified. No commits beyond this SUMMARY exist for this plan yet.

## Accomplishments

- Verified worktree HEAD/base assertions passed at agent start
- Read and understood the full 24-05-PLAN.md, confirming Task 1 is the first blocking checkpoint
- No task 1-3 work performed yet — genuinely blocked on human action in Sanity Studio

## Task Commits

None yet. Task 1 is a checkpoint requiring human action in Sanity Studio (no repo files change). Tasks 2 and 3 have not started.

**Plan metadata:** (this SUMMARY commit only, recording checkpoint-pending state)

## Files Created/Modified

None.

## Decisions Made

None yet - plan not started beyond the initial checkpoint gate.

## Deviations from Plan

None - plan execution has not progressed past Task 1's checkpoint, so no deviation opportunities have arisen.

## Issues Encountered

None - this is the expected, planned blocking checkpoint behavior for Task 1 (`gate="blocking"`), which requires:
1. A human editorial decision: which published gallery pairs with which published édition (the Rebut collection/édition pairing is the documented example)
2. Confirming that gallery is homepage-visible (`showOnHomePage` ON)
3. Publishing the reference in Sanity Studio
4. Running `npm --prefix sanity run deploy` to publish the Studio build so Romane can self-serve the field
5. Rebuilding the site and confirming `grep -rl "gallery-detail__related" dist/galleries/` returns at least one file

See the full verification script in `24-05-PLAN.md` Task 1 `<how-to-verify>`.

## User Setup Required

**External service (Sanity) requires manual configuration before this plan can proceed.** See Task 1's `<how-to-verify>` in `.planning/phases/24-cross-linking-contact-cta/24-05-PLAN.md`:
- Start Studio locally (`npm --prefix sanity run dev`) and open http://localhost:3333
- In Collection photo, open the gallery pairing with an existing published édition (Rebut/Rebut is the documented example) and its Édition liée tab
- Set the Édition liée (optionnel) field, confirm the gallery's Couleur tab has "Afficher sur la page d'accueil" ON, and Publish
- Deploy the Studio: `npm --prefix sanity run deploy`
- Rebuild the site: `npm run build`
- Confirm `grep -rl "gallery-detail__related" dist/galleries/` now returns at least one file

## Next Phase Readiness

Not ready to proceed to Task 2 or Task 3 until Task 1's checkpoint resolves. The orchestrator should relay the checkpoint below to the real human and dispatch a fresh continuation agent once a response ("approved" with the gallery/édition pair, or a description of what blocked it) is received.

---
*Phase: 24-cross-linking-contact-cta*
*Completed: not yet - checkpoint pending*
