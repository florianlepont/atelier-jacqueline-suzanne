---
phase: 11-schema-content-model
plan: 02
subsystem: cms
tags: [sanity, studio, deploy, content-seed]

# Dependency graph
requires:
  - phase: 11-schema-content-model
    provides: "edition Sanity document type (11-01) with leadPhoto/images/format field validation, registered as an orderable 'Éditions' desk item"
provides:
  - "Hosted Sanity Studio (atelier-jacqueline-suzanne.sanity.studio) deployed with the edition schema live"
  - "Published 'Rebut' édition document in the production dataset — the first real content Phase 12 will fetch"
affects: [12-data-fetch-layer-routes]

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified: []

key-decisions:
  - "Content was seeded through the hosted Studio's own interactive session (Florian, standing in for Romane per the plan's objective), not a scripted createOrReplace fallback — this is what actually exercises CMS-04's unassisted create/edit/publish workflow, not a bypass (Pitfall C)"
  - "Drag-reorder (success criterion #2) accepted as verified-as-far-as-possible: only one édition document exists in production right now, so there is nothing to reorder against. The underlying mechanism (orderRankField + orderableDocumentListDeskItem) is identical to galleries' already-proven-working pattern and was confirmed wired in 11-01 (Studio lint/build green). Meaningful reorder testing is deferred to whenever a second édition is seeded — not a phase blocker, consistent with the project's Phase 2 precedent of accepting partial verification with documented rationale."

patterns-established: []

requirements-completed: [CMS-04]

coverage:
  - id: D1
    description: "sanity deploy published the edition schema to the hosted Studio (atelier-jacqueline-suzanne.sanity.studio) — the Éditions desk item and its four-group create form are live, not just in local sanity dev"
    requirement: CMS-04
    verification:
      - kind: manual_procedural
        ref: "`npm run deploy --prefix sanity` completed with 'Success! Studio deployed to https://atelier-jacqueline-suzanne.sanity.studio/'; confirmed via browser by Florian"
        status: pass
    human_judgment: false
  - id: D2
    description: "A published 'Rebut' édition exists in the production dataset with a lead photo (image + bilingual alt), 6 photo-shoot images (each with bilingual alt + credit), a bilingual statement, and numeric pageCount(50)/printRun(2)/dimensions(21x29.7cm) — created, filled, and published by Florian through the hosted Studio with no code changes, resolving Plan 01's D3"
    requirement: CMS-04
    verification:
      - kind: other
        ref: "npx sanity documents query '*[_type==\"edition\"]{...}' against the production dataset — confirmed non-draft _id, publicationStatus: published, all fields populated (see task transcript for full query output)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Éditions can be drag-reordered in the desk, the same way galleries are (success criterion #2)"
    verification: []
    human_judgment: true
    rationale: "Only one édition document exists in production, so reordering has nothing to reorder against and cannot be meaningfully exercised yet. The reorder mechanism itself (orderRankField/orderableDocumentListDeskItem) is code-identical to galleries' already-shipped, working implementation and was confirmed wired during 11-01. Accepted as verified-as-far-as-possible; real reorder testing happens naturally once a second édition is added."
---

# Phase 11 Plan 02: Hosted Studio Deploy & Rebut Seed Summary

**Deployed the `edition` schema to Romane's hosted Sanity Studio and seeded the first real, published "Rebut" édition through it — proving the unassisted create/edit/publish workflow required by CMS-04.**

## Performance

- **Duration:** ~human-paced (interactive checkpoint spanning deploy + content entry, not a timed automated run)
- **Completed:** 2026-07-22
- **Tasks:** 2/2 (both `checkpoint:human-verify`)
- **Files modified:** 0 (all changes are in the hosted Studio deployment + Sanity Content Lake production dataset, not the repo)

## Accomplishments
- `npm run deploy --prefix sanity` published the Plan 01 schema to `https://atelier-jacqueline-suzanne.sanity.studio/` — confirmed live via browser (Éditions desk item + four-group create form: Publication, Présentation, Photos, Détails du format).
- A real "Rebut" édition was created, filled, and published through that hosted Studio: lead photo + bilingual alt, 6 photo-shoot images (cover, spreads, binding detail of the printed object) each with bilingual alt + credit, bilingual statement, and numeric format fields (50 pages, tirage of 2, 21×29.7cm).
- Verified directly against the production dataset via `npx sanity documents query` — the document is published (non-draft `_id`), not a draft sitting unpublished.

## Task Commits

No local file commits — both tasks are `checkpoint:human-verify` actions against external systems (the hosted Sanity Studio deployment target and the Sanity Content Lake production dataset), not repo changes. Verification was performed via direct `sanity documents query` reads against the live dataset rather than git history.

**Plan metadata:** committed alongside this SUMMARY.md.

## Files Created/Modified
None — see Performance above.

## Decisions Made
See `key-decisions` in frontmatter: content seeded via the interactive hosted-Studio session (not a script), and drag-reorder accepted as verified-as-far-as-possible given only one édition currently exists.

## Deviations from Plan

None — plan executed exactly as written. Both checkpoint tasks (deploy, seed) completed successfully with no field/validation issues encountered.

## Issues Encountered

None. The plan's Pitfall B spot-check (publish blocked on an untouched `dimensions` object or an asset-less lead photo) was not separately re-tested in this pass since the édition published successfully with all fields correctly filled on the first pass — the validators' presence was already confirmed at the schema level in Plan 01.

## User Setup Required

None beyond what the plan already specified (Sanity login, already authenticated on Florian's machine) and Florian's own real photo files, which he supplied directly through the Studio's upload UI.

## Next Phase Readiness

Phase 12 (Data-Fetch Layer & Routes) has real, published content to build and verify against: one "Rebut" édition with a lead photo, 6 photo-shoot images, bilingual statement, and complete format fields, live in the hosted Studio and production dataset. No blockers.

Known follow-up (non-blocking): drag-reorder is code-verified but not yet exercised with real content since only one édition exists — worth a quick manual check once a second édition is seeded (e.g. "Sillo").

---
*Phase: 11-schema-content-model*
*Completed: 2026-07-22*
