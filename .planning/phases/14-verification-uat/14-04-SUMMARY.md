---
phase: 14-verification-uat
plan: 04
subsystem: cms
tags: [sanity, studio, uat, editions, orderable-document-list, human-verification]

# Dependency graph
requires:
  - phase: 14-verification-uat (14-01/14-02/14-03)
    provides: null-safety hardening, commerce-guard schema extension, and closure audit — all green before this plan's Romane pass
provides:
  - "14-ROMANE-UAT.md — a French, non-technical Studio checklist Florian can hand to Romane for future self-serve content edits"
  - "A completed, independently cross-checked real-world Romane Studio pass (create + edit + publish + drag-reorder) closing ROADMAP success criterion #3"
  - "The 11-UAT.md drag-reorder waiver is now genuinely closed (a second édition, 'Silos', exists and reordering against 'Rebut' was exercised for real)"
affects: [milestone-completion, v1.3-editions-closeout]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Blocking human-verify checkpoint requiring explicit typed approval relayed by Florian, never self-reported by the executor — mirrors Phase 13 Task 3's gate shape"
    - "Orchestrator-side independent cross-check against the live public Sanity dataset (CDN API, no credentials) as corroborating evidence for a human-verify checkpoint, mirroring the direct-evidence discipline of 11/12/13-VERIFICATION.md"

key-files:
  created: [.planning/phases/14-verification-uat/14-ROMANE-UAT.md]
  modified: []

key-decisions:
  - "Task 2's blocking human-verify checkpoint was approved via an explicit relay from Florian, independently corroborated by the orchestrator's own read of the live Sanity dataset (publicationStatus and orderRank transitions on 'Rebut'/'Silos') rather than accepted on the strength of the claim alone."
  - "The GitHub Pages public-site 404/empty-sitemap finding (milestone not yet merged to main) is recorded as a note for milestone completion, not treated as a Task 2 acceptance blocker — Task 2's scope is Romane's Studio-side self-serve experience, verified via local dev/build on this branch, which is unaffected by the merge-to-main timing."

patterns-established: []

requirements-completed: []  # Phase 14 owns no primary REQ (cross-cutting verification phase); implements locked decisions D-03/D-04 (ROADMAP success criterion #3).

coverage:
  - id: D1
    description: "French, non-technical Studio checklist (14-ROMANE-UAT.md) instructing Romane to create + edit + publish + drag-reorder a new édition"
    verification:
      - kind: other
        ref: "test -f .planning/phases/14-verification-uat/14-ROMANE-UAT.md && grep -ciE 'cr[eé]er|nouvelle [eé]dition' ... && grep -ciE 'glisser|r[eé]organiser|r[eé]ordonner' ..."
        status: pass
    human_judgment: false
  - id: D2
    description: "Romane's real, hands-on Sanity Studio pass — create a new édition ('Silos'), add a photo, FR+EN statement, format details, En préparation draft-stays-off-live check, publish, drag-reorder with persistence-after-refresh — closing ROADMAP success criterion #3 and the 11-UAT.md drag-reorder waiver"
    verification:
      - kind: manual_procedural
        ref: "Explicit typed approval relayed by Florian (checkpoint Task 2), independently cross-checked by the orchestrator against the live public Sanity dataset (project gwz8iug4, dataset production): 'Silos' absent before, present with publicationStatus 'preparation' mid-pass, both 'Rebut' and 'Silos' publicationStatus 'published' after, and 'Rebut'.orderRank changed from '0|100008:' to '0|090002:' with 'Silos' at '0|0i0004:' — direct evidence of a real drag-reorder, not a claim."
        status: pass
    human_judgment: true
    rationale: "SC #3 requires Romane's own hands and own words confirming the Studio experience matches galleries — no automation can perform or substitute for this; it is a human action by design, only independently corroborated (not replaced) by the orchestrator's read-only dataset check."

# Metrics
duration: 3h29m (includes elapsed wait for the real-world human-verify checkpoint)
completed: 2026-07-23
status: complete
---

# Phase 14 Plan 04: Romane's Éditions Studio UAT Summary

**French Studio checklist for Romane plus a completed, independently cross-checked real content-editing pass (create/edit/publish/drag-reorder on a genuine second édition, "Silos") — closing ROADMAP success criterion #3 and the drag-reorder gap `11-UAT.md` waived.**

## Performance

- **Duration:** 3h 29m (elapsed clock time; most of this is real-world wait for Romane's Studio session and Florian's relay, not active execution)
- **Started:** 2026-07-23T12:21:35Z
- **Completed:** 2026-07-23T15:50:52Z
- **Tasks:** 2 (1 auto, 1 blocking human-verify)
- **Files modified:** 1 created

## Accomplishments

- Wrote `.planning/phases/14-verification-uat/14-ROMANE-UAT.md`: a concise, non-technical French checklist in the `EditorialDashboard.tsx` register (plain imperative present tense — "Créez une nouvelle édition...", "Faites glisser pour réorganiser...") covering create → title → photo/credits → FR+EN statement → format details → "En préparation" draft-stays-off-live check → publish → confirm live on both locales → drag-reorder with refresh-persistence check → optional cleanup → what to report back to Florian.
- Romane completed the full pass in the hosted Sanity Studio: created a real second édition ("Silos"), added a photo, wrote the FR+EN statement, filled format details, set "En préparation" and confirmed it stayed off the live rendering (verified locally on this branch), published it and confirmed it appeared on both FR and EN Éditions pages, then drag-reordered the two éditions in the Studio list and confirmed the new order persisted after a refresh.
- The orchestrator independently cross-checked this against the live public Sanity dataset (no credentials, public CDN API): "Silos" absent → present as `preparation` → both `published`; `Rebut`'s `orderRank` changed from `0|100008:` to `0|090002:` and `Silos` sits at `0|0i0004:` — direct dataset evidence of a real drag-reorder, not a self-report.
- This closes the exact gap `11-schema-content-model/11-UAT.md` left open when the drag-reorder test was waived for lack of a second document — a genuine second édition now exists and reordering was exercised for real, by Romane, in the hosted Studio.

## Task Commits

Each task was committed atomically:

1. **Task 1: Write the French Romane Studio UAT checklist (D-03, D-04)** - `a10227a` (docs)
2. **Task 2: BLOCKING — Romane's real Studio content-editing pass (D-03, D-04, ROADMAP SC #3)** - no code commit (human-verify checkpoint; approval recorded in this SUMMARY, corroborated by direct dataset read, not a file change)

**Plan metadata:** committed alongside this SUMMARY (see Self-Check section below for the final metadata commit hash).

_Note: Task 2 produces no code diff by design — its "artifact" is the recorded, independently-corroborated human approval itself._

## Files Created/Modified

- `.planning/phases/14-verification-uat/14-ROMANE-UAT.md` - French, non-technical Studio checklist for Romane (create/edit/publish/drag-reorder, EditorialDashboard tone)

## Decisions Made

- Task 2's approval was accepted as recorded evidence rather than a bare claim: the orchestrator independently read the live public Sanity dataset before and after the pass and found dataset-level corroboration (publicationStatus transitions, orderRank change) matching Florian's relay exactly — consistent with this project's established "direct evidence, not SUMMARY-trusting" verification discipline (11/12/13-VERIFICATION.md).
- The checklist deliberately allowed either real second-édition content ("Silos", which is what Romane used) or a throwaway, per D-04's wording — Romane used real content, so no cleanup/deletion step was needed.

## Deviations from Plan

None - plan executed exactly as written. Task 1 produced the checklist doc per spec; Task 2's blocking checkpoint was approved via explicit typed relay from Florian, never self-reported by the executor, matching the plan's `<resume-signal>` and acceptance criteria exactly.

## Issues Encountered

None blocking this plan's own acceptance criteria. One separate, non-blocking finding surfaced during the Task 2 checkpoint and is recorded below for milestone-completion visibility.

## Notes for Milestone Completion (non-blocking for this plan)

**The public GitHub Pages site does not yet reflect this milestone.** During the Task 2 cross-check, the orchestrator confirmed the live public URL (`https://florianlepont.github.io/ajs-website/`) currently 404s on `/editions/` and its live `sitemap.xml` has zero Éditions URLs. Root cause: the entire v1.3 Éditions milestone (Phases 11–14, 105 commits) lives only on branch `claude/gsd-new-milestone-editions-ubjvt0` and has never been merged into `main` — GitHub Actions only deploys from `main` (on push, or via the Sanity webhook's `repository_dispatch`, which also builds whatever `main` currently is).

This is very likely intentional — merge-to-main as a deliberate cutover step performed after this verification phase signs off, not before — and Florian's own "appears on the live site" confirmation during the checklist was via local dev server/build on this branch, consistent with that explanation. It is **not** a defect of Task 2 or this plan (Task 2's scope is Romane's Studio-side self-serve experience, which is fully and independently verified), but whoever runs the eventual merge-to-main/deploy cutover for this milestone should be aware that the public site will not show Éditions until that merge happens.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- ROADMAP success criterion #3 is genuinely met: Romane created, edited, published, and drag-reordered a second édition in the hosted Studio with her own hands, confirmed via an explicit blocking human approval, independently corroborated against the live dataset.
- Phase 14 (Verification & UAT) is now fully complete across all four plans (14-01 null-safety, 14-02 commerce-guard extension, 14-03 closure audit, 14-04 this Romane UAT pass).
- Milestone-completion note above (public site not yet merged to `main`) should be carried forward to whatever workflow performs the v1.3 milestone close-out/cutover.

---
*Phase: 14-verification-uat*
*Completed: 2026-07-23*

## Self-Check: PASSED

- FOUND: .planning/phases/14-verification-uat/14-ROMANE-UAT.md
- FOUND: .planning/phases/14-verification-uat/14-04-SUMMARY.md
- FOUND: commit a10227a (Task 1)
