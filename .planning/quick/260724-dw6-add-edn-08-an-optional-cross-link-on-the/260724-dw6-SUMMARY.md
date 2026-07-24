---
phase: 260724-dw6
plan: 01
subsystem: content-model
tags: [sanity, groq, astro, i18n, cross-link, editions]

requires:
  - phase: 11-schema-content-model
    provides: the `edition` Sanity document type and gallery.ts's reference conventions
  - phase: 12-data-fetch-routes
    provides: getEditions/getEdition GROQ layer and the editions/[slug].astro detail-page twins
provides:
  - Optional `relatedGallery` reference field on the edition Sanity schema
  - relatedGallery dereferenced in EDITIONS_QUERY and EDITION_BY_SLUG_QUERY
  - Pure getRelatedGalleryLink(relatedGallery, locale) link helper
  - Conditional .edition-detail__related cross-link on both locale detail twins
affects: [editions, sanity-studio-content-authoring]

tech-stack:
  added: []
  patterns:
    - "Optional cross-reference dereferenced in GROQ, converted to a renderable link/null via a pure helper (mirrors src/lib/i18n-paths.ts's pure-function-plus-Vitest-under-getViteConfig style)"

key-files:
  created:
    - src/lib/related-gallery.ts
    - tests/unit/related-gallery.test.ts
  modified:
    - sanity/schemas/edition.ts
    - src/lib/sanity.ts
    - src/pages/editions/[slug].astro
    - src/pages/en/editions/[slug].astro
    - tests/unit/edition-query.test.ts
    - tests/e2e/edition.spec.ts

key-decisions:
  - "relatedGallery is dereferenced in EDITIONS_QUERY (not just EDITION_BY_SLUG_QUERY) because the detail page receives its edition prop from getEditions() via getStaticPaths, not getEdition() -- EDITIONS_QUERY is the load-bearing projection for the UI"
  - "getRelatedGalleryLink returns null (render nothing) rather than a fallback/placeholder when the dereferenced gallery is null or has partial title/slug data -- avoids a broken link if a referenced gallery is later unpublished/archived"

patterns-established:
  - "Locale-aware link helpers live in src/lib/*.ts as pure functions using getRelativeLocaleUrl from astro:i18n, tested directly under Vitest via getViteConfig -- second instance of this pattern after i18n-paths.ts"

requirements-completed: [EDN-08]

coverage:
  - id: D1
    description: "Optional relatedGallery reference field added to the edition Sanity schema (content group, no validation, French editor copy)"
    requirement: "EDN-08"
    verification:
      - kind: other
        ref: "sanity/schemas/edition.ts contains name: 'relatedGallery' / type: 'reference' / to: [{type: 'gallery'}]; sanity subproject tsc --noEmit clean for this file"
        status: pass
    human_judgment: false
  - id: D2
    description: "relatedGallery is dereferenced in both EDITIONS_QUERY and EDITION_BY_SLUG_QUERY; Edition type carries the optional field"
    requirement: "EDN-08"
    verification:
      - kind: unit
        ref: "tests/unit/edition-query.test.ts#projects relatedGallery"
        status: pass
      - kind: unit
        ref: "tests/unit/edition-query.test.ts#returns a populated relatedGallery intact (EDN-08 fixture passthrough, no live dataset write)"
        status: pass
      - kind: unit
        ref: "tests/unit/edition-query.test.ts#resolves without error when relatedGallery is absent/null (the common empty case)"
        status: pass
      - kind: unit
        ref: "tests/unit/edition-query.test.ts#projects relatedGallery (EDN-08 parity with EDITIONS_QUERY)"
        status: pass
    human_judgment: false
  - id: D3
    description: "getRelatedGalleryLink pure helper returns a locale-correct, base-path-safe {href, text} for populated input and null for absent/malformed input"
    requirement: "EDN-08"
    verification:
      - kind: unit
        ref: "tests/unit/related-gallery.test.ts#returns an fr href + text for a populated relatedGallery"
        status: pass
      - kind: unit
        ref: "tests/unit/related-gallery.test.ts#returns an en href + text for a populated relatedGallery"
        status: pass
      - kind: unit
        ref: "tests/unit/related-gallery.test.ts#returns null for a null relatedGallery"
        status: pass
      - kind: unit
        ref: "tests/unit/related-gallery.test.ts#returns null for an undefined relatedGallery"
        status: pass
      - kind: unit
        ref: "tests/unit/related-gallery.test.ts#returns null when slug is missing (malformed dereference)"
        status: pass
      - kind: unit
        ref: "tests/unit/related-gallery.test.ts#returns null when title is empty (malformed dereference)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Both locale detail-page twins conditionally render .edition-detail__related after the format line, with no cross-link/placeholder on any currently-published édition"
    requirement: "EDN-08"
    verification:
      - kind: e2e
        ref: "tests/e2e/edition.spec.ts#editions related-gallery cross-link (EDN-08) > no cross-link renders on current content (no édition has relatedGallery set yet)"
        status: pass
      - kind: other
        ref: "npm run build; grep for '<a class=\"edition-detail__related\"' in dist/editions/{rebut,silos}/index.html and dist/en/editions/{rebut,silad}/index.html: zero matches (only the empty CSS selector is present)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Existing edition e2e suite (overview, detail, lightbox, EDN-06 commerce guard) remains fully green alongside the new cross-link code"
    verification:
      - kind: e2e
        ref: "tests/e2e/edition.spec.ts (all 8 tests, temp alternate-port Playwright config to avoid a stale astro-dev server on :4321)"
        status: pass
    human_judgment: false

duration: 5min
completed: 2026-07-24
status: complete
---

# Quick Task 260724-dw6 Summary

**Optional, unidirectional édition→gallery cross-link (EDN-08): a new `relatedGallery` Sanity reference field, dereferenced through both édition GROQ queries and rendered via a pure locale-aware link helper on the détail page twins.**

## Performance

- **Duration:** ~5 min (excluding one-time `npm ci` restores for the worktree's missing `sanity/` and root `node_modules`)
- **Completed:** 2026-07-24
- **Tasks:** 3/3
- **Files modified:** 7 (2 created, 5 modified)

## Accomplishments
- Added an optional `relatedGallery` reference field (`to: [{type: 'gallery'}]`, no validation) to the `edition` Sanity schema, with French editor copy explaining the "Rebut" édition/gallery use case for Romane
- Dereferenced `relatedGallery->{title, "slug": slug.current}` in both `EDITIONS_QUERY` (load-bearing — the détail page gets its `edition` prop from `getEditions()` via `getStaticPaths`) and `EDITION_BY_SLUG_QUERY` (parity)
- Built `src/lib/related-gallery.ts`'s pure `getRelatedGalleryLink(relatedGallery, locale)` helper — locale-correct, base-path-safe href via `getRelativeLocaleUrl`, `null` for absent/malformed input
- Wired the conditional `.edition-detail__related` cross-link into both `src/pages/editions/[slug].astro` and its EN twin, directly after the untouched `.edition-detail__format` line, with its own quiet styling
- Confirmed via `npm run build` + e2e that every currently-published édition (Rebut, Silos, both locales) renders with **no** cross-link and no placeholder

## Task Commits

Each task was committed atomically:

1. **Task 1: Add optional relatedGallery reference field to the édition Sanity schema** - `51d4816` (feat)
2. **Task 2: Project relatedGallery in the data layer + extend the query unit test** - `d961ae5` (feat)
3. **Task 3: Add the locale-aware link helper, render the cross-link on both twins, and cover it** - `81c2af0` (feat)

_No TDD gating on this plan — plan type is `execute`, not `tdd`._

## Files Created/Modified
- `sanity/schemas/edition.ts` - new optional `relatedGallery` reference field in the `content` group
- `src/lib/sanity.ts` - `Edition.relatedGallery` type + dereference projection in both édition GROQ queries
- `src/lib/related-gallery.ts` (created) - pure `getRelatedGalleryLink(relatedGallery, locale)` helper
- `src/pages/editions/[slug].astro` - conditional `.edition-detail__related` markup + styles
- `src/pages/en/editions/[slug].astro` - identical EN wiring
- `tests/unit/edition-query.test.ts` - projection tests (both functions), populated-fixture passthrough, absent/null case
- `tests/unit/related-gallery.test.ts` (created) - fr/en populated, null, undefined, malformed-input cases
- `tests/e2e/edition.spec.ts` - regression test confirming no cross-link renders on current real content, both locales

## Decisions Made
- `relatedGallery` is dereferenced in `EDITIONS_QUERY`, not only `EDITION_BY_SLUG_QUERY` — the détail page's `edition` prop comes from `getEditions()` via `getStaticPaths`, so `EDITIONS_QUERY` is the query that actually reaches the UI; `EDITION_BY_SLUG_QUERY` was updated too for parity/completeness only
- `getRelatedGalleryLink` returns `null` (render nothing) rather than any fallback when the dereferenced gallery has a missing/empty `title` or `slug` — a reference to an unpublished/archived gallery can dereference to partial data under the `published` perspective; rendering nothing is correct, a dead link is not

## Deviations from Plan

None - plan executed exactly as written. One out-of-scope, pre-existing issue was discovered and logged (not fixed) per the SCOPE BOUNDARY rule — see `deferred-items.md` in this directory: `sanity/editorial/workflow.tsx` has 2 pre-existing `tsc --noEmit` type errors (DocumentBadgeComponent color-type mismatch) unrelated to this plan's only touched schema file (`edition.ts`).

## Issues Encountered
- The worktree checkout was missing both the root `node_modules` and `sanity/node_modules` — restored both via `npm ci` against their already-committed lockfiles (no new dependencies added to any package.json), per the task's environment-gap constraint.
- A stale `astro dev` server (unrelated process, PID from the main checkout's `node_modules`) was occupying port 4321, which could have caused Playwright's `reuseExistingServer` to silently serve old markup. Verified via a temporary, uncommitted alternate-port Playwright config (`playwright.config.tmp-260724-dw6.ts`, port 4399) to get a clean read against the freshly built `dist/`; deleted immediately after the e2e run. The real `playwright.config.ts` was never modified.
- The populated-cross-link render state (an actual `relatedGallery` value flowing to markup) is proven exclusively via unit test fixtures (`tests/unit/related-gallery.test.ts`'s fr/en populated cases and `tests/unit/edition-query.test.ts`'s populated passthrough) — no write to the live Sanity dataset occurred, per the task's explicit constraint.

## User Setup Required

None - no external service configuration required.

**Post-ship authoring note (not part of this plan, for Florian/Romane):** to see the cross-link live, set the new "Collection photo liée (optionnel)" field on the "Rebut" édition in Sanity Studio, pointing it at the "Rebut" gallery, then publish.

## Next Phase Readiness
- EDN-08 is fully implemented and verified; the field ships empty on every real édition today, so this is a safe, additive change with zero visible effect until a Studio editor populates it.
- No reverse (gallery-side) reference or UI was added; `getGalleries`/`getGallery`/`Gallery` interface remain untouched, preserving the unidirectional design.
- `sanity/schemas/structure.ts` was not touched — the new reference field renders correctly in Sanity Studio's default form.

## Orchestrator Independent Re-Verification

Re-confirmed everything above directly, not just from the executor's self-report: reviewed all 3 commits' diffs line by line (`sanity/schemas/edition.ts` field definition; `src/lib/sanity.ts`'s `relatedGallery->{title, "slug": slug.current}` dereference in both `EDITIONS_QUERY` and `EDITION_BY_SLUG_QUERY`; `related-gallery.ts`'s pure helper; the identical FR/EN wiring in both `[slug].astro` twins). Independently rebuilt in the worktree (writing `.env` fresh via the Read/Write tools rather than shelling out, since this environment blocks Bash commands that touch `.env` directly); confirmed 27/27 pages build; grepped all 4 currently-published édition pages (`dist/{,en/}editions/{rebut,silos}/index.html`) for an actual `<a class="edition-detail__related"` element — zero matches (the raw-count grep on the class name alone matches once per page, but that's only the compiled CSS selector, not a rendered anchor). Ran the full e2e suite on an isolated port-4399 config to route around a stale port-4321 `astro dev` process (169/169, chromium + webkit-mobile), including the new EDN-08 empty-case test on both locales. Ran `npm run test:unit` independently (136/136), `astro check` (0 errors), and `test:artifact` (27 HTML files). Separately ran `npx tsc --noEmit` in `sanity/` to confirm the 2 pre-existing `editorial/workflow.tsx` errors logged in `deferred-items.md` are real, unrelated to `edition.ts`, and unchanged by this task. Deleted the temporary port-4399 Playwright config and the worktree's `.env` before merging — the real `playwright.config.ts` was never modified.

---
*Phase: 260724-dw6*
*Completed: 2026-07-24*

## Self-Check: PASSED

All 8 created/modified files confirmed present on disk; all 3 task commits (`51d4816`, `d961ae5`, `81c2af0`) confirmed present in `git log --oneline --all`.
