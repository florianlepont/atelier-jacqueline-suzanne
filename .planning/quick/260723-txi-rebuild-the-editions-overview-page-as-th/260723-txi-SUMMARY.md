---
phase: quick-260723-txi
plan: 01
subsystem: frontend-editions
tags: [astro, css, e2e, editions, empty-state]
dependency-graph:
  requires: []
  provides: [editions-poster-grid, empty-state-bold-variant, edition-detail-format-accent]
  affects: [tests/e2e/edition.spec.ts]
tech-stack:
  added: []
  patterns:
    - "Group-of-3 asymmetric bento grid via CSS Grid data-attribute selectors ([data-size][data-side])"
    - "Opt-in component variant prop (EmptyState variant='bold') instead of a parent style override, to respect Astro's scoped-CSS boundary"
key-files:
  created: []
  modified:
    - src/pages/editions/index.astro
    - src/pages/en/editions/index.astro
    - src/pages/editions/[slug].astro
    - src/pages/en/editions/[slug].astro
    - src/components/EmptyState.astro
    - tests/e2e/edition.spec.ts
decisions:
  - "Rendered .tile__statement on every tile (hero and small), hiding it on smalls via CSS only — matches the plan's explicit instruction for robustness regardless of statement length"
  - "Fixed a real e2e assertion bug during Task 3: text-transform: uppercase on .edition-detail__format is reflected by Playwright's innerText() (unlike textContent), so /Tirage/, /Print run/, /cm|in/ needed case-insensitive flags to keep matching the rendered text"
metrics:
  duration: ~35min
  completed: 2026-07-23
status: complete
---

# Phase quick-260723-txi Plan 01: Rebuild Éditions Overview as the Poster Grid Summary

Replaced the Éditions overview's zigzag row list with the sketch-approved asymmetric "Poster Grid" (grouped-by-3 hero+small tiles, alternating side), restyled the détail page's format-details line to bold/uppercase/pink-underline, and repaired the full edition e2e suite against the new markup.

## What Was Built

**Task 1 — Poster Grid overview (both locale twins) + EmptyState bold variant:**
- `src/pages/editions/index.astro` and `src/pages/en/editions/index.astro`: replaced the `.editions-list__row` zigzag markup/CSS with an `.editions-grid` of `.editions-grid__group[data-size][data-side]` containers, each holding one `.tile--hero` (title + full statement) and up to two `.tile--small` (title only, statement hidden via CSS) anchors. Groups are chunked from `getEditions()`'s existing `orderRank` order in steps of 3 — no re-sort/re-rank. Side alternates left/right by group index (group 0 = left). With today's 2 published éditions, both overview locales render exactly one group of size 2, side=left.
- `src/components/EmptyState.astro`: added an opt-in `variant?: 'plain' | 'bold'` prop (default `'plain'`) applying an `.empty-state--bold` class (dashed border + large Unbounded display heading) — the default plain look for any other consumer is unchanged. Both overview pages' empty-state calls now pass `variant="bold"`.

**Task 2 — Détail format-line restyle (both locale twins):**
- `src/pages/editions/[slug].astro` and `src/pages/en/editions/[slug].astro`: `.edition-detail__format` is now `display: inline-block`, bold (`--weight-semibold`), uppercase, letter-spaced, with a 2px pink (`--color-accent`) `border-bottom` underline hugging the text width. `formatText` string composition, markup, hero, back-link, statement, and thumbnail grid are unchanged.

**Task 3 — e2e suite repair:**
- `tests/e2e/edition.spec.ts`: swapped every `.editions-list__row`/`__title`/`__statement` locator for `.tile`/`.tile__title`/`.tile__statement` across the overview, detail, lightbox, and no-commerce-affordances describe blocks. Replaced the old zigzag reversed-row regression guard with a new guard asserting the hero tile is wider, taller, left of, and top-aligned with its sibling small tile for today's real 2-item group (both locales).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Case-sensitive `/Tirage/`, `/Print run/`, `/cm|in/` e2e assertions broke against the new uppercase CSS**
- **Found during:** Task 3, first full e2e run against a correctly-served build
- **Issue:** The plan's Notes assumed `HTMLElement.innerText` (what Playwright reads) always returns the DOM's original case, unaffected by `text-transform: uppercase`. That assumption does not hold: `innerText` reflects the *rendered* (CSS-transformed) text, unlike `textContent`. With Task 2's new `text-transform: uppercase` on `.edition-detail__format`, `frFormat.innerText()` returns `"PAGES : 50 · TIRAGE : 2 EXEMPLAIRES · DIMENSIONS : 21 × 29.7 CM"`, which the case-sensitive `/Tirage/` and `/cm|in/` regexes no longer match.
- **Fix:** Added the `i` flag to the four affected regexes (`/Tirage/i`, `/Print run/i`, `/cm|in/i` x2) to preserve the original intent (assert the word/unit is present) while tolerating the CSS-driven case change. `formatText`'s underlying DOM string case is unaffected — `tests/scripts/verify-static-artifact.mjs`'s raw-HTML grep checks (unchanged, not innerText-based) remain valid.
- **Files modified:** `tests/e2e/edition.spec.ts`
- **Commit:** fbb90c0

### Environment note (not a code deviation)

An unrelated, pre-existing `astro dev` process from the main checkout (not this worktree) was already bound to port 4321 during verification, and Playwright's `reuseExistingServer: !process.env.CI` reused it — serving stale (pre-this-task) markup and producing 6 false-negative test failures on the first `npm run test:e2e` run. This was anticipated and called out explicitly in the task's own constraints. Verified independently via `grep` against the real `dist/editions/index.html` (confirmed `.tile--hero`/`.editions-grid__group`/`data-size="2"`/`data-side="left"` all present), then re-ran the full suite with a temporary, uncommitted, alternate-port (`4399`) Playwright config against a freshly-built `npm run preview` — all 7 tests passed. The scratch config was deleted immediately after use; it was never staged or committed. `playwright.config.ts` itself was not modified.

**Orchestrator independent re-verification:** re-confirmed all of the above directly — real build output (`dist/editions/index.html`) contains `data-size="2" data-side="left"` and zero stale `editions-list__*` classes; the full `tests/e2e/edition.spec.ts` suite (7/7) AND the entire project e2e suite (166/166, all files) pass against an isolated-port preview build; `npm run test:artifact` passes (27 HTML files, EDN-06 intact).

## Known Pre-existing/Out-of-Scope Issue (not fixed, per Scope Boundary)

`npm run test:unit` reports 1 failed suite (`tests/unit/dashboard-logic.test.ts`) out of 12 — `Cannot find package '@sanity/icons'` imported by `sanity/editorial/dashboardLogic.ts`. All 91 actual test cases across the other 11 files pass; this is a missing `node_modules` package unrelated to any file this plan touched (same gap independently confirmed present in the main checkout, and previously documented in Phase 14's closure audit). Not fixed — out of scope per the Scope Boundary rule.

## Self-Check: PASSED

- FOUND: `src/pages/editions/index.astro` (contains `.editions-grid__group`, `.tile--hero`, `.tile--small .tile__statement`; zero `editions-list__(row|photo|text|title|statement)` matches)
- FOUND: `src/pages/en/editions/index.astro` (same checks)
- FOUND: `src/pages/editions/[slug].astro` (contains `text-transform: uppercase` + `border-bottom: 2px solid var(--color-accent)`)
- FOUND: `src/pages/en/editions/[slug].astro` (same checks)
- FOUND: `src/components/EmptyState.astro` (contains `variant === 'bold'` + `.empty-state--bold`)
- FOUND: `tests/e2e/edition.spec.ts` (zero stale zigzag locators; contains `data-size', '2'` + `.tile--hero`)
- FOUND commit d6a7cf8 (Task 1), 62bab00 (Task 2), fbb90c0 (Task 3) in `git log --oneline --all`
- `npm run build` succeeds (27 pages, including `/editions/rebut/`, `/editions/silos/`, `/en/editions/rebut/`, `/en/editions/silos/`)
- `npm run test:e2e` — 166/166 passed, full suite (independently re-verified by the orchestrator against an isolated-port build)
- `npm run test:artifact` — passed (27 HTML files verified)
- `npm run test:unit` — 91/91 real tests passed; 1 unrelated pre-existing suite failed to load (see Known Pre-existing Issue above)
