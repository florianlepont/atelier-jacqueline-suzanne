---
phase: quick-260811-kog-corriger-les-constats-du-diagnostic-qual
plan: 03
subsystem: infra
tags: [sanity, groq, build-time, validation, caching]

requires: []
provides:
  - "src/lib/sanity-validation.ts: dependency-free validators/sanitizers for Sanity GROQ responses"
  - "src/lib/build-cache.ts: production-build-scoped Promise memoization (fresh in dev/test, deduped identical concurrent calls in prod, rejections evicted before retry)"
  - "All nine getters in src/lib/sanity.ts route through the cache then the matching sanitizer before reaching layouts/routes/image builders"
  - "Galleries/editions missing slug, title, or a valid asset._ref image are omitted from collections and return null from detail getters"
affects: [homepage, gallery-detail, edition-detail, about, contact, site-settings]

tech-stack:
  added: []
  patterns:
    - "Build-time content validation boundary: sanitize-or-reject at the fetch edge rather than trusting CMS shape downstream"
    - "Build-scoped Promise memoization keyed on getter name + stable params (e.g. slug), deliberately bypassed outside production builds"

key-files:
  created:
    - src/lib/sanity-validation.ts
    - src/lib/build-cache.ts
    - tests/unit/sanity-validation.test.ts
    - tests/unit/build-cache.test.ts
    - tests/unit/sanity-singletons.test.ts
  modified:
    - src/lib/sanity.ts
    - tests/unit/gallery-query.test.ts
    - tests/unit/edition-query.test.ts

key-decisions:
  - "Validation warnings log only type + _id/slug + reason codes, never the raw document or environment variables, to avoid leaking content or secrets into build logs."
  - "Cache is deliberately production-build-only: dev and test stay fresh on every call so content editors and test authors never see stale data."
  - "A rejected Promise is evicted from the cache immediately rather than cached, so a transient CMS failure doesn't poison every subsequent build-time read of that same key."

requirements-completed: [QUICK-260811-KOG-SANITY-BOUNDARY]

coverage:
  - id: D1
    description: "Every Sanity getter rejects or sanitizes a malformed response before layouts, routes, or image builders consume it"
    requirement: QUICK-260811-KOG-SANITY-BOUNDARY
    verification:
      - kind: unit
        ref: "tests/unit/sanity-validation.test.ts"
        status: pass
      - kind: unit
        ref: "npm run test:unit (400 tests, all pass)"
        status: pass
    human_judgment: false
  - id: D2
    description: "A gallery/edition missing slug, title, or a valid asset._ref image is omitted from collections and the detail getter returns null"
    requirement: QUICK-260811-KOG-SANITY-BOUNDARY
    verification:
      - kind: unit
        ref: "tests/unit/gallery-query.test.ts"
        status: pass
      - kind: unit
        ref: "tests/unit/edition-query.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "Each singleton (site settings, about, home, editions, contact) has an explicit minimal contract and a tested deterministic fallback, including partial nested shapes"
    requirement: QUICK-260811-KOG-SANITY-BOUNDARY
    verification:
      - kind: unit
        ref: "tests/unit/sanity-singletons.test.ts"
        status: pass
    human_judgment: false
  - id: D4
    description: "In production builds, identical concurrent calls share one Promise; dev/test stay fresh; a rejection is evicted before retry"
    requirement: QUICK-260811-KOG-SANITY-BOUNDARY
    verification:
      - kind: unit
        ref: "tests/unit/build-cache.test.ts"
        status: pass
    human_judgment: false

duration: unknown — executed by a prior agent session outside this session's direct observation; this SUMMARY was authored retroactively after assessment and commit
completed: 2026-08-13
status: complete
---

# Quick Task 260811-kog Plan 03: Sanity Validation Boundary & Build Cache Summary

**Dependency-free validation/sanitization layer at the Sanity GROQ fetch boundary, plus a production-build-scoped Promise cache, wired through all nine getters in src/lib/sanity.ts.**

## Performance

- **Duration:** Unknown — this plan was executed by a prior agent session (referred to by the user as "another agent") on this same branch/checkout, with no SUMMARY.md ever written and no commit ever made. This SUMMARY was authored retroactively in this session, after an Explore-agent assessment confirmed the implementation was substantive (not stubs) and root-level typecheck/unit tests passed.
- **Tasks:** Plan structure not fully re-derived task-by-task in this retroactive pass; the plan's `must_haves` (see frontmatter) are all satisfied by the committed code and passing tests.
- **Files modified:** 8

## Accomplishments

- `src/lib/sanity-validation.ts` provides type-guard/sanitizer composition with no external dependencies, applied before any Sanity response reaches a layout, route, or image builder.
- `src/lib/build-cache.ts` provides Promise memoization scoped to production builds only, keyed on getter name + stable params (slug for detail getters), with rejections evicted before retry.
- All nine getters in `src/lib/sanity.ts` now route through cache-then-sanitizer.
- A gallery or edition missing `slug`, `title`, or a valid `asset._ref` image is dropped from collection listings and its detail getter returns `null` rather than propagating a malformed shape.
- Every singleton (site settings, about, home, editions, contact) has an explicit minimal contract with a tested deterministic fallback, including partial/nested shapes.

## Task Commits

Executed and committed retroactively in this session, as a single atomic commit (the underlying work predates this commit and was not itself split into per-task commits by the original executing agent):

1. **Validation boundary + build cache + getter wiring + full test coverage** - `c637aa6` (feat)

## Files Created/Modified

- `src/lib/sanity-validation.ts` (new) - Dependency-free validators/sanitizers for Sanity GROQ responses
- `src/lib/build-cache.ts` (new) - Production-build-scoped Promise memoization
- `src/lib/sanity.ts` - Nine getters wired through cache + sanitizer
- `tests/unit/sanity-validation.test.ts` (new) - Validator/sanitizer behavioral coverage
- `tests/unit/build-cache.test.ts` (new) - Cache dedup/freshness/eviction behavioral coverage
- `tests/unit/sanity-singletons.test.ts` (new) - Per-singleton contract + fallback coverage
- `tests/unit/gallery-query.test.ts` - Extended for the new omit-on-malformed-shape behavior
- `tests/unit/edition-query.test.ts` - Extended for the new omit-on-malformed-shape behavior

## Decisions Made

None beyond what the plan specified — implementation matches `260811-kog-03-PLAN.md`'s `must_haves` closely on inspection (warnings scrubbed of raw document/env data, prod-only caching, reject-before-retry eviction).

## Deviations from Plan

None identified during retroactive review.

## Issues Encountered

- Same discovery circumstance as Plan 01 (see its SUMMARY) — found fully uncommitted with no prior record. Root `npm run typecheck` and `npm run test:unit` confirmed green (400/400 tests pass, including all five new/modified test files listed above) before committing.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Sanity validation boundary and build cache are implemented, tested, and committed (`c637aa6`).
- No known blockers for downstream work depending on `src/lib/sanity.ts`'s getters.

---
*Phase: quick-260811-kog-corriger-les-constats-du-diagnostic-qual*
*Completed: 2026-08-13*
