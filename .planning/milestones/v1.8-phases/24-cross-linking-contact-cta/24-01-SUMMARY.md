---
phase: 24-cross-linking-contact-cta
plan: 01
subsystem: data
tags: [sanity, groq, astro, typescript, cross-link]

# Dependency graph
requires: []
provides:
  - "sanity/schemas/gallery.ts: optional relatedEdition reference field + relatedCollection group"
  - "src/lib/sanity.ts: Gallery.relatedEdition type + relatedEdition projection in GALLERIES_QUERY/GALLERY_BY_SLUG_QUERY"
  - "src/lib/sanity-validation.ts: relatedEdition tri-state sanitization on galleries, excluded from editions"
  - "src/lib/related-edition.ts: getRelatedEditionLink() pure helper + RelatedEditionLink interface"
affects: [24-02, 24-03, 24-04, 24-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Reverse cross-link mirrors an existing forward cross-link (relatedGallery on edition) via a parallel field/query/sanitizer/helper set, not a shared generalization"
    - "Sanitizer tri-state pattern for optional dereferenced references: populated {title,slug} object, explicit null, or absent key when unresolvable — never partial data"
    - "Shared-base sanitizer field must be paired with an explicit destructure exclusion on every function that spreads it, or the field silently leaks onto sibling document types"

key-files:
  created:
    - src/lib/related-edition.ts
    - tests/unit/related-edition.test.ts
  modified:
    - sanity/schemas/gallery.ts
    - src/lib/sanity.ts
    - src/lib/sanity-validation.ts
    - tests/unit/gallery-query.test.ts
    - tests/unit/sanity-validation.test.ts

key-decisions:
  - "getRelatedEditionLink ships as a new parallel file (src/lib/related-edition.ts), not a generalization of the shipped related-gallery.ts — locked by the plan's own <discretion_resolutions>"

patterns-established:
  - "Reverse cross-link data layer: schema reference field -> GROQ dereference projection -> TypeScript optional type -> sanitizer tri-state -> pure link-building helper, each mirroring the shipped forward direction exactly"

requirements-completed: [EDN-12]

coverage:
  - id: D1
    description: "A gallery document in Sanity can carry an optional relatedEdition reference to one édition document, with a dedicated 'Édition liée' Studio group"
    requirement: "EDN-12"
    verification:
      - kind: unit
        ref: "tests/unit/gallery-query.test.ts#getGalleries projects relatedEdition"
        status: pass
    human_judgment: false
  - id: D2
    description: "getGalleries()/getGallery() dereference relatedEdition to {title, slug}, intact for populated references and resolving cleanly for null/absent ones"
    requirement: "EDN-12"
    verification:
      - kind: unit
        ref: "tests/unit/gallery-query.test.ts#getGalleries returns a populated relatedEdition intact"
        status: pass
      - kind: unit
        ref: "tests/unit/gallery-query.test.ts#getGalleries resolves without error when relatedEdition is null"
        status: pass
      - kind: unit
        ref: "tests/unit/gallery-query.test.ts#getGallery projects relatedEdition"
        status: pass
    human_judgment: false
  - id: D3
    description: "A gallery's relatedEdition survives sanitization as a complete {title, slug} object or is dropped entirely (never partial), with a diagnostic issue on partial dereference"
    requirement: "EDN-12"
    verification:
      - kind: unit
        ref: "tests/unit/sanity-validation.test.ts#EDN-12: preserves a populated relatedEdition on a gallery intact"
        status: pass
      - kind: unit
        ref: "tests/unit/sanity-validation.test.ts#EDN-12: preserves an explicit null relatedEdition on a gallery"
        status: pass
      - kind: unit
        ref: "tests/unit/sanity-validation.test.ts#EDN-12: leaves relatedEdition key absent on a gallery when the field is absent from input"
        status: pass
      - kind: unit
        ref: "tests/unit/sanity-validation.test.ts#EDN-12: drops a partially-dereferenced relatedEdition and records a diagnostic issue"
        status: pass
    human_judgment: false
  - id: D4
    description: "An édition fetched by getEditions()/getEdition() never carries a stray relatedEdition field (shared-base sanitizer leak guard)"
    requirement: "EDN-12"
    verification:
      - kind: unit
        ref: "tests/unit/sanity-validation.test.ts#EDN-12: never leaks relatedEdition onto an Edition (shared-base leak guard)"
        status: pass
    human_judgment: false
  - id: D5
    description: "getRelatedEditionLink() returns a base-path-safe, locale-correct href and fr/en copy for a populated relatedEdition, and null for every absent/malformed input"
    requirement: "EDN-12"
    verification:
      - kind: unit
        ref: "tests/unit/related-edition.test.ts#getRelatedEditionLink returns an fr href and compact CTA text for a populated relatedEdition"
        status: pass
      - kind: unit
        ref: "tests/unit/related-edition.test.ts#getRelatedEditionLink returns an en href + text for a populated relatedEdition"
        status: pass
      - kind: unit
        ref: "tests/unit/related-edition.test.ts (4 additional null/undefined/empty-slug/empty-title cases)"
        status: pass
    human_judgment: false

duration: ~20min
completed: 2026-08-26
status: complete
---

# Phase 24 Plan 01: EDN-12 Data Layer Summary

**Reverse gallery-to-édition cross-link data layer: Sanity reference field, GROQ dereference projection, tri-state sanitization, and a pure `getRelatedEditionLink()` helper — zero UI change, fully proven by 15 new unit tests.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-08-26T19:42:00Z (approx.)
- **Completed:** 2026-08-26T19:02:04Z (last task commit)
- **Tasks:** 3
- **Files modified:** 7 (2 created, 5 modified)

## Accomplishments

- `sanity/schemas/gallery.ts` gains an optional `relatedEdition` reference field (group `relatedCollection`, title "Édition liée") mirroring `edition.ts`'s shipped `relatedGallery` field, reversed
- `GALLERIES_QUERY` and `GALLERY_BY_SLUG_QUERY` both dereference `relatedEdition->{title, "slug": slug.current}`, with `Gallery.relatedEdition` typed as `{ title: string; slug: string } | null | undefined`
- `sanitizeGalleryDocument()` resolves `relatedEdition` through the same tri-state pattern as the existing `relatedGallery` sanitizer (populated object / explicit null / absent-when-unresolvable), pushing `relatedEdition.removed` on partial dereference
- `sanitizeEditionDocument()` explicitly destructure-excludes `relatedEdition` from the shared gallery-base spread, closing the exact shared-base leak class RESEARCH.md Pitfall 1 warned about
- New `src/lib/related-edition.ts` exports `getRelatedEditionLink()` / `RelatedEditionLink`, a byte-for-byte structural mirror of `related-gallery.ts` (per the plan's locked discretion resolution: parallel file, not a generalization), producing base-path-safe locale hrefs via `getRelativeLocaleUrl` and fr/en copy (`Voir l'édition « Rebut »` / `View the "Rebut" edition` with typographic curly quotes)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add the relatedEdition reference field, type, and GROQ projections** - `de8a5f9` (feat)
2. **Task 2: Sanitize relatedEdition on galleries and exclude it from éditions** - `d02d96b` (feat)
3. **Task 3: Add the pure getRelatedEditionLink helper** - `35e591b` (feat)

_Note: Task 1's two new "populated"/"null case" tests in `gallery-query.test.ts` could only pass once Task 2's sanitizer changes were also present on the filesystem — see Deviations below. Each task's file set was still committed separately and atomically; verification of the full working tree confirmed all task-owned tests green before each commit._

## Files Created/Modified

- `sanity/schemas/gallery.ts` - new `relatedCollection` Studio group + optional `relatedEdition` reference field
- `src/lib/sanity.ts` - `Gallery.relatedEdition` type + `relatedEdition->{title, slug}` projection in both gallery queries
- `src/lib/sanity-validation.ts` - `relatedEdition` tri-state sanitization on galleries; destructure exclusion + `void` on éditions
- `src/lib/related-edition.ts` - new file: `RelatedEditionLink` interface + `getRelatedEditionLink()` function
- `tests/unit/gallery-query.test.ts` - 4 new tests (projection, populated passthrough, null case, getGallery parity)
- `tests/unit/sanity-validation.test.ts` - 5 new tests (populated, null, absent, partial-dereference-with-issue, edition leak guard)
- `tests/unit/related-edition.test.ts` - new file: 6 tests (fr/en populated, null, undefined, empty slug, empty title)

## Decisions Made

- Followed the plan's binding `<discretion_resolutions>`: `getRelatedEditionLink()` ships as a parallel file, not a generalization of the shipped `related-gallery.ts`/`RelatedGalleryLink` — confirmed byte-identical via `git diff` against the pre-plan base for both `src/lib/related-gallery.ts` and `tests/unit/related-gallery.test.ts`.
- English copy uses typographic curly double quotation marks (`"Rebut"`) around the interpolated title, matching `related-gallery.ts` line 41's existing convention, per the plan's explicit instruction — this is a corrected reading of UI-SPEC.md's Copywriting Contract table, which renders straight ASCII quotes in its own markdown but the plan explicitly overrides that in favor of matching the sibling helper's real typographic-quote convention.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed missing npm dependencies in the worktree**
- **Found during:** Task 1 (running `npm --prefix sanity run typecheck`/`lint` as an acceptance-criteria check)
- **Issue:** This git worktree had no `node_modules` installed at either the root or `sanity/` level (only `npx`'s global cache resolved `vitest`, which was enough for unit tests but not for `astro check` or the Sanity Studio `tsc`/`eslint` gates), causing spurious module-resolution errors unrelated to any code change.
- **Fix:** Ran `npm install` at the repo root and `npm ci --prefix sanity`. Package-lock files were not modified (`npm ci` for the Studio, `npm install` at root reused the existing lockfile).
- **Files modified:** None (no package.json/lockfile changes — a pure local dependency install)
- **Verification:** `npm --prefix sanity run typecheck`, `npm --prefix sanity run lint`, `npm run typecheck`, and `npm run lint` all exit 0 after install.
- **Committed in:** N/A (node_modules is gitignored; nothing to commit)

**2. [Not a defect — expected cross-task TDD ordering] Task 1's two new sanitizer-dependent tests were red until Task 2 landed**
- **Found during:** Task 1 verification (`npx vitest run tests/unit/gallery-query.test.ts tests/unit/edition-query.test.ts`)
- **Issue:** Task 1's behavior spec requires `getGalleries()` to return `relatedEdition` "intact" and to "resolve without error" when `relatedEdition` is null. `getGalleries()` routes through `sanitizeGalleryDocument()`, which builds an explicit return object — until Task 2 added `relatedEdition` handling there, the sanitizer silently dropped the field, failing both new tests (confirmed by an isolated test run before Task 2's edits).
- **Fix:** Implemented Task 2's sanitizer changes immediately after Task 1's schema/query/type edits (as the plan's own task sequence specifies), then re-ran `tests/unit/gallery-query.test.ts` together with Task 2's changes present on the filesystem — all tests passed. Each task's file set was still staged and committed separately and atomically, per the task_commit_protocol, using the full working-tree state (both tasks' edits) for verification.
- **Files modified:** No files outside each task's own declared `<files>` list.
- **Verification:** `npx vitest run tests/unit/gallery-query.test.ts tests/unit/edition-query.test.ts tests/unit/sanity-validation.test.ts` — 71/71 pass.
- **Committed in:** `de8a5f9` (Task 1), `d02d96b` (Task 2)

---

**Total deviations:** 1 auto-fixed (1 blocking dependency install); 1 documented cross-task TDD ordering note (not a defect, no extra scope).
**Impact on plan:** No scope creep. The dependency install was purely environmental (worktree setup gap, no package/version changes). The cross-task test ordering is inherent to how the plan itself split the data-layer/sanitizer/helper work across three sequential tasks that share test files.

## Issues Encountered

None beyond the two items documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `relatedEdition` is reachable end-to-end from Sanity Studio to a typed, sanitized `Gallery.relatedEdition` value, and `getRelatedEditionLink()` is ready for the render model to call — the full EDN-12 data-layer objective of this plan.
- Full plan-level verification passed: `npm run typecheck` (astro check, 0 errors), `npm run lint` (0 errors), `npm run test:unit` (713/713 passing across the whole suite), `npm --prefix sanity run typecheck` and `npm --prefix sanity run lint` (both 0 errors).
- `git diff --name-only` against the plan's base commit lists exactly the 7 files declared in `files_modified` — no scope drift.
- `src/lib/related-gallery.ts` and `tests/unit/related-gallery.test.ts` are confirmed byte-identical to their pre-plan state.
- Downstream plan 24-02 can now import `getRelatedEditionLink` and read `Gallery.relatedEdition` to build the render model and gallery-detail-page UI — no blockers.

---
*Phase: 24-cross-linking-contact-cta*
*Completed: 2026-08-26*
