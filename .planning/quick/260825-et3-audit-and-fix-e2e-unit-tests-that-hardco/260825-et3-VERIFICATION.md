---
phase: quick-260825-et3-audit-and-fix-e2e-unit-tests-that-hardco
verified: 2026-08-25T11:25:00Z
status: passed
score: 5/5 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Quick Task 260825-et3: Audit and Fix E2E/Unit Tests That Hardcode Content — Verification Report

**Task Goal:** Audit and fix e2e (and, if relevant, unit) tests that hardcode content-shape assumptions about galleries and editions, so that Romane's self-serve Sanity Studio publishes (adding, removing, or reordering a gallery/edition, or leaving an optional field like heroColor unset) never break the CI pipeline again.

**Verified:** 2026-08-25
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Removing, renaming, or reordering a gallery or an édition in Sanity Studio breaks no e2e spec | ✓ VERIFIED | `tests/e2e/helpers/content.ts` derives every gallery/édition detail href from the listing page's own rendered HTML at test-run time (`page.request.get()` + regex extraction), never from a fixture. All 8 previously-hardcoded spec files (`seo.spec.ts`, `critical.smoke.spec.ts`, `site-header.spec.ts`, `page-title-header-bleed.spec.ts`, `accessibility.spec.ts`, `edition.spec.ts`) now call the helper or an equivalent local dynamic-discovery pattern. `git diff --name-only 414bc30..HEAD -- . ':!.planning'` confirms zero `src/`/`sanity/` changes, so this is pure test-side derivation. |
| 2 | Publishing a gallery or édition with an optional field left unset (heroColor, gallery statement, relatedGallery) breaks no e2e spec | ✓ VERIFIED | `homepage-content-display.spec.ts`'s two `statement`-dependent tests now select the first tile whose description is actually non-empty (`descriptions.findIndex(...)`) and `test.skip` when none exists, instead of assuming tile 0 has one. `heroColor` optionality was already handled pre-task in `homepage-accent-random.spec.ts` (confirmed byte-identical since commit `414bc30`, out of this task's scope per the plan). `relatedGallery` optionality was already loop-guarded in `edition.spec.ts`'s EDN-08 test (`foundRelatedCollection` loop over all édition hrefs). |
| 3 | No e2e spec reaches a gallery or édition detail page via a slug literal embedded in the test | ✓ VERIFIED | `grep -rn "galleries/[a-z0-9]\|editions/[a-z0-9]" tests/e2e --include="*.spec.ts"` and `grep -rln "silos\|rebut"` both return zero matches across the entire `tests/e2e/` tree. Independently confirmed by reintroducing a literal `page.goto('/galleries/silos/')` into `seo.spec.ts` and re-running the Task 3 guard test — it failed with a precise file:line:text report, then passed again cleanly after the file was reverted (`git diff --stat tests/e2e/seo.spec.ts` empty). |
| 4 | No e2e spec depends on a specific gallery/édition title string, or on there being at least N galleries/éditions, without a count guard | ✓ VERIFIED | `homepage-carousel-core.spec.ts`'s grid-mode assertion now checks every rendered tile title is visible/non-empty instead of matching two named galleries. `homepage-content-display.spec.ts`'s two-line-clamp test computes the longest rendered title at runtime. `homepage-loading-progress.spec.ts`'s dash-navigation test targets `dashCount - 1` with `test.skip(dashCount < 2, ...)`. `edition.spec.ts`'s three `.editions-index__row` "second item" sites resolve to the last row by count with the same `< 2` skip idiom (and the EDN-09 pair uses a runtime `findRowWithDifferingAccent()` discovery loop instead of a fixed index, a documented, justified deviation from the plan's literal "last row" instruction — see below). |
| 5 | The full e2e suite and the full unit suite pass against a freshly built preview | ✓ VERIFIED | Orchestrator independently re-ran (not the executor's own worktree run) lint, typecheck, build, and the full `npm run test:e2e` (both `chromium` and `webkit-mobile` projects) plus `npm run test:coverage` on the primary checkout post-merge: lint/typecheck/build clean; e2e 352/352 passing; test:coverage 675/675 passing across 31/31 files. This verifier independently re-ran the new guard test in isolation (3/3 passing) and confirmed it correctly fails-closed on a reintroduced hardcoded route (see truth 3 evidence). |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `tests/e2e/helpers/content.ts` | Shared gallery/édition detail-href derivation helper | ✓ VERIFIED | Exports `galleryHrefs`, `firstGalleryHref`, `editionHrefs`, `firstEditionHref`. Uses `page.request.get()` against the listing page's raw HTML, locale-anchored regex (`(?<!/en)/galleries/[^/"]+/?$` vs `/en/galleries/[^/"]+/?$`), dedupes, preserves document order, throws a descriptive error on zero results. Imported and used by 6 spec files. |
| `tests/unit/e2e-content-fragility.test.ts` | CI-gated regression guard | ✓ VERIFIED | Scans every `tests/e2e/**/*.spec.ts` line-by-line, strips comment lines and backslashes before matching, matches `(galleries|editions)/[a-z0-9]`, supports an inline allowlist marker capped at 2 entries, reports file/line/text on failure. Matched by `vitest.config.ts`'s `tests/unit/**/*.test.ts` include, so it runs inside `npm run test:unit`/`test:coverage`. 3/3 tests pass; manually confirmed fail-closed behavior (see truth 3). |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `seo.spec.ts`, `critical.smoke.spec.ts`, `site-header.spec.ts`, `page-title-header-bleed.spec.ts`, `accessibility.spec.ts`, `edition.spec.ts` | `tests/e2e/helpers/content.ts` | `import {firstGalleryHref, ...} from './helpers/content'` | ✓ WIRED | Confirmed via direct file reads — every spec needing a gallery detail route imports and calls `firstGalleryHref(page, locale)`. Édition detail routes in several files use an equivalent inline dynamic-discovery pattern (`.editions-index__row` first-href) that pre-dates this task and was explicitly left alone per the plan's own audit findings ("already safe"). |
| `tests/unit/e2e-content-fragility.test.ts` | `npm run test:unit` / `npm run test:coverage` | `vitest.config.ts`'s `tests/unit/**/*.test.ts` include glob | ✓ WIRED | Ran `npx vitest run tests/unit/e2e-content-fragility.test.ts` directly — 3/3 pass. File path and naming match the include pattern exactly (no exclusion applies). CI already gates on `test:coverage` per `CLAUDE.md`'s documented pipeline order. |
| `playwright.config.ts` | `E2E_PORT`/`E2E_BASE_URL` env vars | `process.env.E2E_PORT ?? '4321'`, `process.env.E2E_BASE_URL ?? http://localhost:${port}` | ✓ WIRED | Code review confirms defaults reproduce pre-task behavior byte-for-byte when neither var is set (port 4321, same as `astro preview`'s default) — CI sets neither, so this is a purely additive, backward-compatible change. |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| QUICK-260825-ET3 | 260825-et3-PLAN.md | Audit/fix content-shape-fragile e2e/unit tests | ✓ SATISFIED | All 5 must-have truths verified above; no `.planning/REQUIREMENTS.md` entry exists for this ID (expected — quick tasks are self-contained and don't map to ROADMAP.md phases). |

### Anti-Patterns Found

None. Scanned all 12 modified/created files (`playwright.config.ts`, `tests/e2e/helpers/content.ts`, `tests/e2e/seo.spec.ts`, `tests/e2e/critical.smoke.spec.ts`, `tests/e2e/site-header.spec.ts`, `tests/e2e/page-title-header-bleed.spec.ts`, `tests/e2e/accessibility.spec.ts`, `tests/e2e/edition.spec.ts`, `tests/e2e/homepage-carousel-core.spec.ts`, `tests/e2e/homepage-content-display.spec.ts`, `tests/e2e/homepage-loading-progress.spec.ts`, `tests/unit/e2e-content-fragility.test.ts`) for `TBD|FIXME|XXX|TODO|HACK|PLACEHOLDER` — zero matches.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Guard unit test passes against the current tree | `npx vitest run tests/unit/e2e-content-fragility.test.ts` | 1 file, 3/3 tests passed | ✓ PASS |
| Guard unit test fails closed on a reintroduced hardcoded route | Temporarily injected `page.goto('/galleries/silos/')` into `seo.spec.ts`, re-ran the guard, reverted | Failed with exact file/line/text report (`tests/e2e/seo.spec.ts:5`), then passed clean after revert with zero diff | ✓ PASS |
| Scope boundary: only `tests/` + `playwright.config.ts` touched | `git diff --name-only 414bc30..HEAD -- . ':!.planning'` | 12 files, all under `tests/` or `playwright.config.ts`, none under `src/`/`sanity/` | ✓ PASS |
| `homepage-wordmark-peek.spec.ts` / `homepage-accent-random.spec.ts` unchanged | `git diff --stat 414bc30..HEAD -- tests/e2e/homepage-wordmark-peek.spec.ts tests/e2e/homepage-accent-random.spec.ts` | Empty diff | ✓ PASS |
| No hardcoded gallery/édition slug remains anywhere in `tests/e2e/` | `grep -rn "galleries/[a-z0-9]\|editions/[a-z0-9]"` / `grep -rln "silos\|rebut"` | Zero matches both | ✓ PASS |
| Full e2e + unit suite pass against a fresh preview | Orchestrator's independent post-merge re-run (lint, typecheck, build, `test:e2e`, `test:coverage`) | e2e 352/352, unit/coverage 675/675 across 31/31 files, lint/typecheck/build clean | ✓ PASS (reported by orchestrator, not re-run in full by this verifier to avoid a redundant full-suite run per Step 7b's "at most once" constraint — the guard-level and scope-level spot checks above independently corroborate the SUMMARY's narrower claims) |

### Human Verification Required

None. All must-haves for this task are programmatically verifiable and were verified.

### Noted Risk (Out of Scope — Not a Gap)

During this verification's review, an **orthogonal, pre-existing accessibility issue** was surfaced (independently, by the orchestrator, during its own e2e run — not something either this task's plan or this task's must-haves cover): `tests/e2e/accessibility.spec.ts`'s "/en/ has no serious or critical automated accessibility violations" test failed once out of ~7 runs with a real WCAG AA color-contrast violation on `.home-hero__intro`. Root cause: `src/layouts/BaseLayout.astro`'s `--color-accent` (`--pink-600`, `#D6327C`) / `--color-on-accent` (`--gray-900`, confirmed present in `src/layouts/BaseLayout.astro` lines ~315-326) pairing has a contrast ratio of 3.81 against the WCAG AA 4.5 threshold, reachable only when the homepage's random-starting-accent feature (HOME-16) happens to select the one gallery (Trousseau) whose unset `heroColor` falls back to that exact palette entry — a roughly 1-in-6 chance per page load.

This is correctly **out of scope** for this task: it is an application-level (`src/`) styling defect, not a test-fragility defect, and this task's scope was explicitly test-files-and-config-only (no `src/` changes permitted, confirmed via the scope-boundary spot-check above). It does not fail any of this task's 5 must-have truths. It is flagged here only as a real, currently-unmitigated flaky-CI risk that a future task should address (fixing the `--color-accent`/`--color-on-accent` pairing, or excluding that specific known-low-contrast combination from the random-accent pool).

### Gaps Summary

No gaps. All 5 must-have truths verified, both required artifacts verified at all three levels (exist, substantive, wired), all three key links wired, zero anti-patterns, zero hardcoded content routes remaining anywhere in `tests/e2e/`, and the regression guard independently confirmed to fail closed.

---

_Verified: 2026-08-25_
_Verifier: Claude (gsd-verifier)_
