---
phase: 12-data-fetch-layer-routes
plan: 01
subsystem: content
tags: [astro, sanity, groq, i18n, editorial-list]

requires:
  - phase: 11-schema-content-model
    provides: "sanity/schemas/edition.ts — the edition document type (leadPhoto, images, statement, pageCount, printRun, dimensions, publicationStatus), seeded with one real published édition ('Rebut')"
provides:
  - "Edition/EditionImage TypeScript interfaces + getEditions()/getEdition(slug) build-time GROQ fetch functions in src/lib/sanity.ts"
  - "Éditions overview routes (/editions/ and /en/editions/) rendering a vertical editorial zigzag list"
affects: [12-02-detail-page, 12-03-sitemap-nav-hardening]

tech-stack:
  added: []
  patterns:
    - "PUBLISHED_EDITION_FILTER is a plain publicationStatus check (no isVisible coalesce) — edition has no isVisible field, unlike gallery"
    - "EditionImage is a type alias of GalleryImage (structurally identical alt/rights shape)"
    - "Vertical zigzag editorial list (.editions-list__row / --reverse) via explicit grid-column swap, not flex-direction or DOM reordering"

key-files:
  created:
    - tests/unit/edition-query.test.ts
    - tests/e2e/edition.spec.ts
    - src/pages/editions/index.astro
    - src/pages/en/editions/index.astro
  modified:
    - src/lib/sanity.ts

key-decisions:
  - "Followed RESEARCH.md's corrected publication filter (publicationStatus == \"published\" only) instead of copying gallery's isVisible-coalesce logic"
  - "Did not add a seo field to the Edition interface — edition has no seo group in Phase 11's schema; overview page title/description are hardcoded per-locale strings"

patterns-established:
  - "Zigzag row layout: .editions-list__row--reverse swaps grid-template-columns AND overrides grid-column on .editions-list__photo/.editions-list__text, rather than relying on DOM order or flex-direction"

requirements-completed: [EDN-02, EDN-06, EDN-07]

coverage:
  - id: D1
    description: "getEditions()/getEdition(slug) fetch published editions with the corrected filter (no isVisible, no seo), ordered by orderRank, with slug parameter-bound"
    requirement: EDN-02
    verification:
      - kind: unit
        ref: "tests/unit/edition-query.test.ts (14 tests, all passing)"
        status: pass
    human_judgment: false
  - id: D2
    description: "/editions/ and /en/editions/ render every published édition as a vertical zigzag list (title, lead photo, full untruncated statement), each row linking to its detail page"
    requirement: EDN-02
    verification:
      - kind: e2e
        ref: "tests/e2e/edition.spec.ts#editions overview > lists each published édition as a linked row with title, lead photo, and full statement (fr)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/edition.spec.ts#editions overview > renders the English overview at /en/editions/ with a differing, untruncated statement"
        status: pass
    human_judgment: false
  - id: D3
    description: "No price, availability, or purchase affordance appears anywhere on the overview page (fr or en)"
    requirement: EDN-06
    verification:
      - kind: e2e
        ref: "tests/e2e/edition.spec.ts#editions overview > shows no price, availability, or purchase affordance (EDN-06)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Both overview routes render correctly at fr root and /en/ prefix"
    requirement: EDN-07
    verification:
      - kind: e2e
        ref: "tests/e2e/edition.spec.ts#editions overview (all 3 tests navigate both /editions/ and /en/editions/)"
        status: pass
      - kind: other
        ref: "npm run build — emits dist/editions/index.html and dist/en/editions/index.html"
        status: pass
    human_judgment: false

duration: ~25min
completed: 2026-07-22
status: complete
---

# Phase 12 Plan 01: Data-Fetch Layer & Éditions Overview Summary

**Build-time `Edition`/`EditionImage` GROQ data-fetch layer in `src/lib/sanity.ts` (mirroring `Gallery`, with the corrected filter and no `seo` field) plus bilingual `/editions/` and `/en/editions/` overview routes rendering a vertical zigzag editorial list from real published Sanity content.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-07-22T23:05:00+02:00 (approx.)
- **Completed:** 2026-07-22T23:18:30+02:00
- **Tasks:** 3
- **Files modified:** 5 (1 modified, 4 created) + 1 deferred-items note

## Accomplishments
- `getEditions()`/`getEdition(slug)` added to `src/lib/sanity.ts` with the field-for-field-correct `Edition`/`EditionImage` shape, the simpler `publicationStatus == "published"` filter (edition has no `isVisible` field — Pitfall 1), no `seo` projection (edition has no `seo` group — Pitfall 3), and a parameter-bound `$slug` lookup (ASVS V5)
- `/editions/` and `/en/editions/` render a vertical, zigzag, side-by-side editorial list — one `.editions-list__row` per published édition, with full untruncated statement text, alternating lead-photo side by row index, and an `EmptyState` fallback for zero published éditions
- Zero commerce affordances anywhere on the overview page, verified by an automated negative-assertion e2e test (not just visual review)
- Full RED → GREEN TDD cycle: 14 unit tests + 3 e2e tests, all passing against real Sanity content (the seeded "Rebut" édition)

## Task Commits

Each task was committed atomically:

1. **Task 1: Wave 0 — failing édition data-fetch + overview e2e tests (RED)** - `cd2d4e7` (test)
2. **Task 2: Add Edition/EditionImage + getEditions/getEdition to src/lib/sanity.ts** - `ac0b16a` (feat)
3. **Task 3: Build the Éditions overview pages (FR + EN vertical zigzag list)** - `6f32c78` (feat)

_Note: this plan follows the plan-level TDD gate (RED commit → GREEN commits); Task 2 and Task 3 are both GREEN commits against Task 1's RED baseline, no separate refactor commit was needed._

## Files Created/Modified
- `src/lib/sanity.ts` - Added `EditionImage` (type alias of `GalleryImage`), `Edition` interface, `PUBLISHED_EDITION_FILTER`/`EDITIONS_QUERY`/`EDITION_BY_SLUG_QUERY` GROQ constants, `getEditions()`, `getEdition(slug)`
- `src/pages/editions/index.astro` - FR Éditions overview: vertical zigzag editorial list, `EmptyState` fallback
- `src/pages/en/editions/index.astro` - EN twin (import depth one level deeper, `locale = 'en'`)
- `tests/unit/edition-query.test.ts` - 14 tests covering GROQ shape/filter/ordering/projection/parameter-binding contracts
- `tests/e2e/edition.spec.ts` - `editions overview` block (3 tests): fr row rendering, en row rendering + bilingual statement diff, no-commerce negative assertion
- `.planning/phases/12-data-fetch-layer-routes/deferred-items.md` - Logged one out-of-scope, pre-existing test failure (see Issues Encountered)

## Decisions Made
- Followed RESEARCH.md's/PATTERNS.md's corrected publication filter exactly (`publicationStatus == "published"` only) rather than copying gallery's `coalesce(publicationStatus, select(isVisible == false => …))` — edition has no `isVisible` field, so the gallery fallback logic would have been silently-dead-but-confusing code
- Overview page `<title>`/description are hardcoded per-locale strings (no `edition.seo?.title` reference) since edition has no `seo` field/group in Phase 11's schema — matches RESEARCH.md Pitfall 3's guidance
- Zigzag alternation implemented via explicit `grid-column` overrides on `.editions-list__photo`/`.editions-list__text` (not `flex-direction: row-reverse` or DOM reordering) — keeps DOM/reading order (photo, then text) constant across rows while only the *visual* column position swaps

## Deviations from Plan

None — plan executed exactly as written. Task 1/2/3 acceptance criteria all met as specified.

## Issues Encountered

- **Pre-existing, out-of-scope test failure:** `tests/unit/dashboard-logic.test.ts` fails to load (`Cannot find package '@sanity/icons'`) because the `sanity/` Studio subproject's own dependencies are not installed under this worktree's `node_modules`. Unrelated to this plan's changes (confirmed: `npm run test:unit` shows 88/88 relevant tests passing, only this one suite fails to import). Logged to `12-data-fetch-layer-routes/deferred-items.md`, not fixed (SCOPE BOUNDARY — pre-existing, unrelated file).
- **Missing `.env` in this isolated worktree:** the worktree had no `.env` (gitignored, not copied by `git worktree add`), so `npm run build` initially failed with "Missing SANITY_PROJECT_ID or SANITY_DATASET env vars." Resolved by writing a local `.env` using the non-secret `projectId`/`dataset` values already committed in `sanity/sanity.config.ts` (`gwz8iug4` / `production`) — no `SANITY_API_READ_TOKEN` was available or used; the dataset turned out to have public CDN read access, so the build succeeded and fetched real published content (including the seeded "Rebut" édition) without a token. This `.env` file is gitignored and was not committed.
- **Playwright webServer port collision:** an unrelated, pre-existing `astro dev` process (PID 12462, running from the main repo checkout, not this worktree) was already listening on port 4321, so Playwright's `reuseExistingServer` picked it up instead of starting a fresh preview server for this worktree's build — the overview e2e tests initially failed/timed out against stale content. Verified GREEN by temporarily pointing `playwright.config.ts` at port 4322 (own `npm run preview` instance), confirming all 3 tests pass, then reverting `playwright.config.ts` to its original committed state via `git checkout -- playwright.config.ts` before the Task 3 commit — no permanent config change was made or committed.

## User Setup Required

None - no external service configuration required. (The worktree-local `.env` created for verification is gitignored and does not need to be preserved or committed; a normal development checkout with a real `.env` — including `SANITY_API_READ_TOKEN` per `README.md`'s documented required variable — is unaffected.)

## Next Phase Readiness

- `getEditions()`/`getEdition(slug)` are ready for Plan 12-02 (detail page) to consume via `getStaticPaths()`
- The `[leadPhoto, ...images]` combined-array Lightbox pattern (D-05/D-06) and the "Retour aux éditions" back-link (D-08) are entirely Plan 12-02 scope — not started here
- `sitemap.xml.ts` extension (`editions/` + `editions/${slug}/` entries) is Plan 12-03 scope — not started here
- No blockers for Plan 12-02 or 12-03: the data-fetch layer and overview UI are both fully committed and GREEN

---
*Phase: 12-data-fetch-layer-routes*
*Completed: 2026-07-22*

## Self-Check: PASSED

All created files confirmed present on disk (`tests/unit/edition-query.test.ts`, `tests/e2e/edition.spec.ts`, `src/pages/editions/index.astro`, `src/pages/en/editions/index.astro`, `.planning/phases/12-data-fetch-layer-routes/deferred-items.md`). All task commits confirmed present in `git log` (`cd2d4e7`, `ac0b16a`, `6f32c78`, plus the SUMMARY commit `cf45826`).
