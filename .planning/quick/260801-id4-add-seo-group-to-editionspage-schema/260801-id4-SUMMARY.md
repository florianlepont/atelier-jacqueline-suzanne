---
phase: quick-260801-id4
plan: 01
subsystem: cms
tags: [sanity, editorial-checklist, schema, seo]

# Dependency graph
requires:
  - phase: quick-260801 (debug: editionspage-no-title-seo)
    provides: The prior decision to remove SEO checklist items from editionsPage because the seo field did not exist yet — this plan reverses that scope decision now that the field is being added.
provides:
  - editionsPage Sanity schema now declares a seo group + shared `seo` field, matching homePage/aboutPage/contactPage
  - editorial checklist for editionsPage restored to 4 items (1 required intro + 3 recommended SEO), all non-blocking
  - Inverted regression test replacing the "never lists SEO items" test from the prior debug session
affects: [editorial-checklist, sanity-studio-schemas]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "editionsPage.ts now follows the exact same seo-group/seo-field pattern as homePage.ts, aboutPage.ts, contactPage.ts"

key-files:
  created: []
  modified:
    - sanity/schemas/editionsPage.ts
    - src/lib/sanity.ts
    - sanity/editorial/checks.ts
    - tests/unit/editorial-checks.test.ts

key-decisions:
  - "Field added to the Studio schema only — EDITIONS_PAGE_QUERY and the EditionsPage TS interface stay intro-only, since the public /editions Astro routes still hardcode their own SEO strings; wiring the public site to this field is a separate, not-yet-scoped change."
  - "SEO checklist items restored as recommended (never required) so an editionsPage document with just a bilingual intro still satisfies the publish gate (requiredComplete stays true with seo empty) — verified by an explicit test assertion, closing the DoS-via-blocked-publish threat noted in the plan's threat model."

requirements-completed: [260801-id4]

coverage:
  - id: D1
    description: "editionsPage Studio schema exposes a SEO tab (group) with a shared `seo` field (title/description/share image/no-index), same pattern as homePage"
    requirement: "260801-id4"
    verification:
      - kind: other
        ref: "npm --prefix sanity run lint && npm --prefix sanity run build (Studio schema compiles with the new group/field)"
        status: pass
      - kind: manual_procedural
        ref: "localhost:3333, Page Éditions — orchestrator confirmed live: SEO tab renders with Titre/Description dans Google (FR/EN) fields, matching homePage's pattern"
        status: pass
    human_judgment: false
  - id: D2
    description: "editorial checklist for editionsPage lists the 3 SEO items again as recommended (non-blocking), restoring parity with homePage/aboutPage/contactPage"
    requirement: "260801-id4"
    verification:
      - kind: unit
        ref: "tests/unit/editorial-checks.test.ts#lists the SEO checklist items for editionsPage now that the schema exposes an seo field"
        status: pass
    human_judgment: false
  - id: D3
    description: "SEO items remain strictly recommended: requiredComplete stays true with a bilingual intro and empty seo"
    requirement: "260801-id4"
    verification:
      - kind: unit
        ref: "tests/unit/editorial-checks.test.ts#lists the SEO checklist items for editionsPage now that the schema exposes an seo field"
        status: pass
    human_judgment: false
  - id: D4
    description: "Public site (/editions, /en/editions routes) unchanged — no Astro route reads the new field, EDITIONS_PAGE_QUERY still projects only intro"
    verification:
      - kind: other
        ref: "git diff --stat against worktree base HEAD lists only sanity/schemas/editionsPage.ts, src/lib/sanity.ts, sanity/editorial/checks.ts, tests/unit/editorial-checks.test.ts — no src/pages/editions/* touched"
        status: pass
    human_judgment: false

# Metrics
duration: 25min
completed: 2026-08-01
status: complete
---

# Phase quick-260801-id4 Plan 01: Add SEO group to editionsPage schema Summary

**Restored a SEO tab (group + shared `seo` field) on the Studio's "Page Éditions" singleton and re-enabled the corresponding 3 recommended items in its editorial checklist, reversing this morning's debug-session decision to hide them.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-08-01T11:00:00Z (approx, plan authored just prior)
- **Completed:** 2026-08-01T11:25:17Z
- **Tasks:** 2 completed (Task 2 executed as RED → GREEN TDD pair)
- **Files modified:** 4

## Accomplishments
- `sanity/schemas/editionsPage.ts` now declares two groups (`content` default, `seo`) and a `seo` field of the shared `seo` object type, copying `homePage.ts`'s pattern exactly (same `description` string, byte-for-byte)
- Preview subtitle updated to "Introduction et référencement"; stale header comment ("minus the seo field/group... out of scope here") replaced with an accurate one noting the public `/editions` routes still hardcode their own SEO strings
- `src/lib/sanity.ts`'s `EditionsPage` JSDoc corrected to reflect that the Studio schema does expose `seo`, while the query/interface intentionally stay intro-only (comment-only change, zero behavior change)
- `sanity/editorial/checks.ts`'s `editionsPage` branch restored to `...seoChecks(value.seo)` after the intro check, removing the now-false "no seo field" comment
- `tests/unit/editorial-checks.test.ts`'s regression test inverted: now asserts 4 checklist items (1 required + 3 recommended), `requiredComplete` stays `true` with intro-only, and `recommendedComplete` flips `false` → `true` once a full `seo` object is supplied

## Task Commits

Each task was committed atomically:

1. **Task 1: Add SEO group and field to editionsPage schema** - `2b29d77` (feat)
2. **Task 2 RED: failing test for editionsPage SEO checklist items** - `d4e3c31` (test)
3. **Task 2 GREEN: restore SEO checklist items for editionsPage** - `5955e0f` (feat)

**Plan metadata:** commit pending (orchestrator handles the docs commit)

_Note: Task 2 was TDD (`tdd="true"`) — RED and GREEN landed as separate commits per the TDD execution flow; no refactor commit was needed._

## Files Created/Modified
- `sanity/schemas/editionsPage.ts` - Added `seo` group + shared `seo`-typed field after `intro`; updated preview subtitle and header comment
- `src/lib/sanity.ts` - Comment-only fix on the `EditionsPage` interface JSDoc (no interface/query change)
- `sanity/editorial/checks.ts` - Restored `...seoChecks(value.seo)` in the `editionsPage` branch, removed obsolete comment
- `tests/unit/editorial-checks.test.ts` - Replaced the "never lists SEO items" test with one asserting the items are present and non-blocking

## Decisions Made
- Kept the field Studio-only (not wired into `EDITIONS_PAGE_QUERY` or the `EditionsPage` TS interface, not consumed by any Astro route) per the plan's explicit scope boundary — this is a Studio-editing affordance today, not a live-site SEO feature yet.
- Copied `homePage.ts`'s `seo` field `description` string character-for-character (diffed via `grep -o` + `diff` in the verification gate) rather than retyping it, to avoid any punctuation/whitespace drift.

## Deviations from Plan

**1. [Rule 3 - Blocking] Installed npm dependencies in a fresh worktree**
- **Found during:** Task 1 verification (`npm --prefix sanity run lint`)
- **Issue:** Neither the root nor `sanity/` `node_modules` existed in this freshly-created worktree, so lint/build/test commands failed immediately with `ERR_MODULE_NOT_FOUND` / missing binaries.
- **Fix:** Ran `npm ci` (root) and `npm ci --prefix sanity` — both installs used only the already-committed `package-lock.json` files, no new packages were added or chosen.
- **Files modified:** none tracked (node_modules is gitignored); no package.json/package-lock.json changes
- **Verification:** Subsequent lint/build/test commands all ran successfully
- **Committed in:** N/A (no file changes to commit — this is standard environment setup, not a code change)

---

**Total deviations:** 1 auto-fixed (1 blocking / environment setup)
**Impact on plan:** No scope creep — this was pure local environment setup (installing already-locked dependencies), not a package legitimacy decision.

## Issues Encountered
None beyond the dependency-install deviation above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness

- All 6 items of the plan's `<verification>` gate pass: `npm run test:unit` (259/259), `npm run lint` (clean), `npm run typecheck` (0 errors, pre-existing unrelated hints only), `npm --prefix sanity run lint` (clean), `npm --prefix sanity run build` (succeeds), and `git diff --stat` against the worktree base lists exactly the 4 expected files.
- Visual confirmation performed live by the orchestrator immediately after merge: the "SEO" tab is present on the "Page Éditions" pane, renders the "Titre dans Google"/"Description dans Google" FR/EN fields, and the checklist correctly shows 0/4 with the 3 SEO items marked "Recommandé" (non-blocking) alongside the 1 required intro item.
- The `editionsPage` singleton document has still never been saved server-side (confirmed by the earlier `editionspage-no-title-seo` debug session) — this plan didn't change that, and doesn't need to; the schema and checklist are correct independent of whether the document has been persisted yet.
- No blockers for follow-up work (e.g., eventually wiring `EDITIONS_PAGE_QUERY`/the `/editions` Astro routes to read this new `seo` field) — that remains an explicitly separate, unscoped decision per this plan's scope boundaries.

---
*Phase: quick-260801-id4*
*Completed: 2026-08-01*

## Self-Check: PASSED

All 5 claimed files confirmed present on disk (sanity/schemas/editionsPage.ts, src/lib/sanity.ts, sanity/editorial/checks.ts, tests/unit/editorial-checks.test.ts, this SUMMARY.md). All 3 claimed commits confirmed present in `git log --oneline --all` (2b29d77, d4e3c31, 5955e0f).
