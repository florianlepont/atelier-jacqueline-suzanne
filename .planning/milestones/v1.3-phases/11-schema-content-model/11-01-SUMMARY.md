---
phase: 11-schema-content-model
plan: 01
subsystem: cms
tags: [sanity, schema, studio, orderable-document-list, i18n]

# Dependency graph
requires:
  - phase: 02-portfolio-galleries
    provides: "gallery.ts editorial-workflow pattern (publicationStatus, localeTextField, images-array custom validation, orderRankField), imageRights.ts, structure.ts desk-item pattern"
provides:
  - "New edition Sanity document type with typed/grouped format fields (pageCount, printRun, dimensions), a dedicated leadPhoto field, and a bilingual images photo-shoot array"
  - "edition registered in schemaTypes and wired as an orderable 'Éditions' desk item"
  - "Confirmed Rebut gallery/édition naming resolution recorded in PROJECT.md"
affects: [12-data-fetch-layer-routes, 13-nav-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "edition.ts mirrors gallery.ts's editorial workflow (publicationStatus/orderRank/preview) verbatim where field-for-field identical"
    - "Dedicated leadPhoto field (image + bilingual alt, required().assetRequired()) as a Studio-ergonomics alternative to gallery's images[0]-as-cover convention"
    - "Grouped, typed format fields (pageCount/printRun/dimensions) with a parent-level rule.custom() completeness check on the nested dimensions object, mirroring the technique gallery.ts already applies to its images array"

key-files:
  created:
    - sanity/schemas/edition.ts
  modified:
    - sanity/schemas/index.ts
    - sanity/schemas/structure.ts
    - .planning/PROJECT.md

key-decisions:
  - "leadPhoto is a dedicated field, not derived from images[0] (D-04) — lets Romane pick a lead image independent of photo-shoot order"
  - "images array documents the printed object itself (cover, spreads, binding), not a reuse of the gallery's photographic subject matter (D-05)"
  - "pageCount/printRun are typed numbers and dimensions is a structured {width, height, unit} object, not free text (D-06/EDN-05), kept machine-usable for a future shop/commerce field group"
  - "BookIcon (not TagsIcon, already used by Crédits et droits, or ImagesIcon, used by galleries) chosen for the Éditions desk item so Studio nav visually distinguishes the two content types"
  - "No seo/heroColor/showOnHomePage/publishedPageLinks/reference fields added this phase — SEO and PublishedPageLinks deferred to Phase 12 (avoids a 404'ing 'Voir sur le site' link before the route exists, Pitfall D); heroColor/showOnHomePage explicitly excluded (D-13); a gallery cross-link is EDN-08, deferred (D-03)"
  - "Rebut naming resolution recorded as a documentation-only task (D-02) — no new human-verify checkpoint needed since Romane already confirmed the resolution directly"

patterns-established:
  - "Parent-level rule.custom() completeness check for nested-object fields (dimensions) closes Sanity Studio's documented nested-object validation gap — reusable for any future structured object field"

requirements-completed: [CMS-04, EDN-05]

coverage:
  - id: D1
    description: "New edition Sanity document type compiles with the full typed/grouped field set (publicationStatus, title, slug, statement, leadPhoto, images, pageCount, printRun, dimensions, hidden orderRank)"
    requirement: EDN-05
    verification:
      - kind: other
        ref: "npm --prefix sanity run lint && npm --prefix sanity run build (both green after each task commit)"
        status: pass
    human_judgment: false
  - id: D2
    description: "edition is registered in index.ts's schemaTypes and wired as a once-only, orderable 'Éditions' desk item in structure.ts (not double-listed, distinct icon from gallery/Crédits et droits)"
    requirement: EDN-05
    verification:
      - kind: other
        ref: "npm --prefix sanity run lint && npm --prefix sanity run build (both green); rg -n \"orderableDocumentListDeskItem\\(\\{[^}]*type: 'edition'\" sanity/schemas/structure.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "Romane can create, edit, publish, and drag-reorder an édition unassisted in the (hosted, post-deploy) Sanity Studio"
    requirement: CMS-04
    verification: []
    human_judgment: true
    rationale: "No automated test can prove an unassisted human Studio UX workflow, or that the schema is actually live in the hosted (not just local dev) Studio instance — sanity build/lint only proves the schema compiles. This requires a manual sanity deploy plus a human create/edit/publish/reorder pass, out of this plan's scope per 11-01-PLAN.md's objective (Plan 02 deploys and seeds real content)."
  - id: D4
    description: "The Rebut gallery/édition naming resolution is recorded as Confirmed in PROJECT.md's Key Decisions table, and the Context 'Open item (v1.3)' bullet no longer describes it as unconfirmed"
    requirement: EDN-05
    verification:
      - kind: other
        ref: "rg -n \"Rebut.*Confirm\" .planning/PROJECT.md"
        status: pass
    human_judgment: false

# Metrics
duration: 9min
completed: 2026-07-22
status: complete
---

# Phase 11 Plan 01: Édition Schema & Studio Wiring Summary

**New `edition` Sanity document type (mirroring `gallery.ts`'s editorial workflow) with a dedicated `leadPhoto` field and typed/grouped format details (`pageCount`, `printRun`, `dimensions`), registered and wired as an orderable "Éditions" desk item, plus the Confirmed Rebut gallery↔édition naming resolution recorded in PROJECT.md.**

## Performance

- **Duration:** ~9 min
- **Started:** 2026-07-22T14:47:15Z
- **Completed:** 2026-07-22T14:56:13Z
- **Tasks:** 3 completed
- **Files modified:** 4 (1 created, 3 modified)

## Accomplishments
- Created `sanity/schemas/edition.ts` — a new "Édition" document type with `publicationStatus`/`title`/`slug`/`statement` mirrored verbatim from `gallery.ts`, a dedicated `leadPhoto` field (D-04), an `images` photo-shoot array documenting the printed object (D-05), typed `pageCount`/`printRun`/`dimensions` format fields grouped under "Détails du format" (D-06/EDN-05), and hidden `orderRank` for drag-reorder (D-12)
- Registered `edition` in `sanity/schemas/index.ts`'s `schemaTypes` and wired it into `sanity/schemas/structure.ts` as a once-only, orderable "Éditions" desk item using `BookIcon` (D-14)
- Recorded the "Rebut" gallery↔édition naming resolution as Confirmed in `PROJECT.md`'s Key Decisions table and resolved the Context "Open item (v1.3)" bullet (success criterion #5)
- Closed Sanity's documented nested-object and image-asset validation gaps (Pitfall B / threat T-11-01): a parent-level `rule.custom()` on `dimensions`, and `required().assetRequired()` on `leadPhoto`

## Task Commits

Each task was committed atomically:

1. **Task 1: Create the `edition` schema type** - `f3a040e` (feat)
2. **Task 2: Register `edition` and wire the Studio desk structure** - `ab32a19` (feat)
3. **Task 3: Record the "Rebut" naming resolution in PROJECT.md** - `254c120` (docs)

_No TDD tasks in this plan (schema-definition work, no test framework applies)._

## Files Created/Modified
- `sanity/schemas/edition.ts` - New Sanity document type: full typed/grouped field set, dedicated leadPhoto, images array with parent-level custom validation, Pattern-2/3 validation gap fixes
- `sanity/schemas/index.ts` - Imports `edition` and adds it to `schemaTypes`, immediately after `gallery`
- `sanity/schemas/structure.ts` - Adds `BookIcon` import, an `orderableDocumentListDeskItem` for `edition` titled "Éditions", and `'edition'` in the exclusion filter
- `.planning/PROJECT.md` - New Confirmed Key Decisions row for the Rebut resolution; Context "Open item (v1.3)" bullet marked RESOLVED

## Decisions Made
- `leadPhoto` kept strictly separate from `images[0]` (D-04) — no derivation logic, a real independent field
- `dimensions.unit` uses a fixed `initialValue: 'cm'` string, not a select list (Claude's Discretion per CONTEXT.md — no multi-unit requirement was raised)
- No `seo` field/group added this phase (Claude's Discretion — no requirement calls for it; Phase 12 may add SEO once the public route exists)
- `PublishedPageLinks` intentionally omitted from `edition.ts` (Pitfall D) — including it now would produce a "Voir sur le site" Studio link that 404s until Phase 12 ships the `/editions/{slug}/` route
- `BookIcon` chosen over `TagsIcon` (already used by "Crédits et droits") or `ImagesIcon` (used by galleries) for the "Éditions" desk item, per the correction documented in `11-PATTERNS.md` lines 297-308

## Deviations from Plan

None - plan executed exactly as written. `sanity/`'s `node_modules` did not exist in this fresh worktree checkout; `npm ci --prefix sanity` was run before the plan's verify steps as a necessary precondition (not a deviation from the plan's content, no plan step or file was skipped or altered) — this is standard environment setup, not a Rule 1-4 fix.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required. Note (carried from 11-RESEARCH.md, out of this plan's scope): the schema change is not yet live in Romane's hosted Sanity Studio (`https://atelier-jacqueline-suzanne.sanity.studio/`) — that requires a manual `npx sanity deploy` from `sanity/`, which is Plan 02's responsibility per the plan's own objective ("Plan 02 deploys it to the hosted Studio and seeds real content").

## Next Phase Readiness
- The `edition` schema exists, compiles (`npm --prefix sanity run lint && npm --prefix sanity run build` both green), and is fully wired into the local Studio desk structure and schema registry — ready for Plan 02 to deploy to the hosted Studio and seed the real "Rebut" édition content.
- Phase 12's data-fetch layer can rely on this plan's exact field names (`leadPhoto`, `images`, `statement`, `pageCount`, `printRun`, `dimensions`) as the GROQ fetch contract — nothing here is provisional.
- No blockers. The hosted-Studio deploy (Pitfall A) and human-verified create/edit/publish/reorder workflow (CMS-04, success criteria #1/#2) remain open for Plan 02, as scoped by this plan's objective.

## Self-Check: PASSED

- FOUND: sanity/schemas/edition.ts
- FOUND: sanity/schemas/index.ts (modified)
- FOUND: sanity/schemas/structure.ts (modified)
- FOUND: .planning/PROJECT.md (modified)
- FOUND commit: f3a040e
- FOUND commit: ab32a19
- FOUND commit: 254c120

---
*Phase: 11-schema-content-model*
*Completed: 2026-07-22*
