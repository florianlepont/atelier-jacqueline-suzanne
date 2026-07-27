---
phase: quick-260727-ohf
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - tests/unit/dashboard-logic.test.ts
  - tests/e2e/accessibility.spec.ts
autonomous: true
requirements:
  - AUDIT-COV-1   # unit-test the untested dashboardLogic.ts exports (depth on describeTransaction + buildActivities)
  - AUDIT-COV-2   # expand accessibility.spec.ts route coverage (editions overview + détail + /en/)

must_haves:
  truths:
    - "`sanity/editorial/dashboardLogic.ts` statement AND branch coverage rise meaningfully above the current 43.67% / 43.1% baseline (the previously-untested exports now execute under test)"
    - "Unit tests exist and pass for every previously-untested export: `isGalleryOnline`, `mutationDocumentId`, `mutationFields`, `contentNoun`, `attentionPriority`, `describeTransaction`, `buildActivities`"
    - "`describeTransaction` tests exercise each mutation-shape branch: published (create-on-published + delete-of-draft), unpublished (delete-of-published, no create), created (create with no matching draft delete), modified with 1 / 2 / >2 recognized fields, and the fallback (no recognized fields / empty relevant list)"
    - "`buildActivities` tests exercise: empty transaction list, most-recent-wins dedup for the same document, author-name fallback chain (displayName → email → 'Un membre de l’équipe'), and a transaction whose document is absent from the documents list being skipped"
    - "`tests/e2e/accessibility.spec.ts` runs the axe scan against `/editions/`, one dynamically-discovered real `/editions/{slug}/` détail page, and at least one `/en/` route — in addition to the original 5 — using the identical AxeBuilder tag config and serious/critical assertion"
    - "Full suite green: `npm run typecheck`, `npm run test:coverage`, `npm run build`, and `npx playwright test` all pass"
  artifacts:
    - "tests/unit/dashboard-logic.test.ts (extended with new describe blocks for the untested exports)"
    - "tests/e2e/accessibility.spec.ts (extended with additional routes + a dynamic-slug détail scan)"
  key_links:
    - "New unit tests import ONLY from `../../sanity/editorial/dashboardLogic` (relative) and build fixtures as plain object literals — they must NOT `import ... from '@sanity/types'` (that package resolves only under `sanity/node_modules`, not from `tests/`, so naming it in the test breaks `astro check`)"
    - "The détail axe test discovers the real slug from the overview's first `.tile` href (never hardcoded, never via the main nav) — mirroring `tests/e2e/edition.spec.ts`"
---

<objective>
Add pre-confirmed test coverage from a codebase audit (no re-audit — findings verified by reading the source and existing tests directly):

1. Unit-test every currently-untested export of `sanity/editorial/dashboardLogic.ts` (at 43.67% stmt / 43.1% branch), with depth on the two logic-dense ones — `describeTransaction` (raw Sanity transaction-log mutation → human "a publié / a modifié le titre" sentence) and `buildActivities` (the aggregator behind Romane's "recent activity" feed).
2. Extend `tests/e2e/accessibility.spec.ts` (today scans only 5 of ~19 routes) to add the éditions overview, one real édition détail page, and at least one `/en/` route.

Purpose: Raise coverage on the least-covered Studio dashboard logic and close accessibility-scan blind spots (no `/editions/*`, no `/en/*` today), with zero production-code change — tests only.
Output: 2 test files extended; typecheck / coverage / build / e2e all green, with dashboardLogic.ts coverage visibly improved.
</objective>

<execution_context>
@/home/user/ajs-website/.claude/gsd-core/workflows/execute-plan.md
@/home/user/ajs-website/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@CLAUDE.md

# Fix 1 — the source under test. READ the branch logic directly; the plan
# below names each branch but do NOT guess shapes — the function bodies are
# the source of truth for describeTransaction / buildActivities / mutationFields.
@sanity/editorial/dashboardLogic.ts

# Fix 1 — the existing unit-test file to EXTEND. Match its conventions exactly:
# `describe`/`it` blocks, the `makeRow` / `complete` / `missing` fixture
# factories, French-string assertions, and its import style (it imports the
# module + checks.ts via RELATIVE paths — never from '@sanity/types').
@tests/unit/dashboard-logic.test.ts

# Fix 2 — the e2e file to EXTEND (currently 5 static routes in one for-loop).
@tests/e2e/accessibility.spec.ts

# Fix 2 — the established pattern for discovering a REAL édition détail slug
# dynamically from the overview's first `.tile` href (never hardcode a slug,
# never use the nav). Mirror this in the new détail axe test.
@tests/e2e/edition.spec.ts

# Reference for the édition data model / getEditions() (why the slug must be
# discovered at runtime, not hardcoded).
@src/lib/sanity.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Unit-test the untested dashboardLogic.ts exports (depth on describeTransaction + buildActivities)</name>
  <files>tests/unit/dashboard-logic.test.ts</files>
  <action>
    Extend the EXISTING file (do not create a new one). Add new `describe` blocks for the seven currently-untested exports, matching the file's established style: `describe`/`it` from vitest, French-string `expect(...).toBe(...)` assertions, and the existing `makeRow` / `complete` / `missing` fixture factories where a `DashboardRow` is needed.

    IMPORT DISCIPLINE (load-bearing — get this wrong and `astro check` fails): add the new function names to the SINGLE existing import from `'../../sanity/editorial/dashboardLogic'`. Do NOT add an `import ... from '@sanity/types'` line anywhere in this test file — `@sanity/types` is installed only under `sanity/node_modules`, so it does not resolve from `tests/`. Instead, build every transaction/mutation/user fixture as a PLAIN OBJECT LITERAL passed straight into the function under test; TypeScript type-checks each literal structurally against the function's parameter type (which IS known via the imported function's signature), so no `@sanity/types` annotation is needed. If you want a small local factory helper for readability, leave its return type inferred (do not annotate it with a `@sanity/types` type name).

    Fixture shapes (confirmed from `sanity/node_modules/@sanity/types` — build literals matching these):
    - Patch mutation: `{ patch: { id: <docId>, set: { title: 1 } } }` (also supports `setIfMissing`/`merge`/`diffMatchPatch`/`inc`/`dec` objects, an `unset: string[]` array, and `insert: { before|after|replace: <path> }`).
    - Create mutations: `{ create: { _id, _type } }`, `{ createOrReplace: { _id, _type } }`, `{ createIfNotExists: { _id, _type } }`.
    - Delete mutation: `{ delete: { id: <docId> } }`.
    - CreateSquashed: `{ createSquashed: { authors: [], createdBy: 'u1', createdAt: '<iso>', document: { _id, _type } } }`.
    - Transaction event: `{ id, timestamp: '<iso>', author: '<userId>', documentIDs: ['<id>'], mutations: [...] }`.
    - User: `{ id, displayName?, email?, imageUrl? }`.

    Cover each export:
    - `isGalleryOnline`: publicationStatus === 'published' → true; publicationStatus set to anything else (e.g. 'preparation') → false; no publicationStatus + isVisible !== false → true; isVisible === false → false.
    - `mutationDocumentId`: returns the id for each shape (patch.id, delete.id, create._id, createOrReplace._id, createIfNotExists._id, createSquashed.document._id) and `undefined` for an unrecognized/empty shape.
    - `mutationFields`: extracts field keys from `set`/`setIfMissing`/`merge`/`diffMatchPatch`/`inc`/`dec` (via `Object.keys` on each present operation's object); from an `unset` array (string entries only); from `insert.before`/`insert.after`/`insert.replace` (each only if it's a string). CORRECTION (verified directly against the source at `sanity/editorial/dashboardLogic.ts:132-153` — the original task brief's claim was wrong, do not trust it): this function returns RAW paths verbatim — it does NOT strip array-index suffixes and does NOT filter `_`-prefixed fields itself. So `mutationFields({patch: {id: 'x', set: {'images[0]': 1}}})` returns `['images[0]']` unchanged, and `mutationFields({patch: {id: 'x', set: {_updatedAt: 1}}})` returns `['_updatedAt']` unchanged. (That kind of filtering only happens downstream, inside `describeTransaction`'s `.map(field => fieldLabels[field]).filter(Boolean)` step, because `fieldLabels` has no entry for `images[0]` or `_updatedAt` — but `mutationFields` itself is filter-free.) Test `mutationFields` on its own raw output; returns `[]` for a non-patch mutation (e.g. a bare `delete` or `create`).
    - `contentNoun`: gallery → 'cette collection'; exhibition → 'cette exposition'; siteSettings → 'les réglages du site'; any other type → 'cette page'.
    - `attentionPriority`: 0 when required checks incomplete; 1 when hasDraft && isPublished; 2 for preparation / hidden / not-published; 3 otherwise. Reuse `makeRow` with the same overrides pattern the existing `buildAttentionGroups` tests use.
    - `describeTransaction` (DEPTH — one `it` per branch, in this order of precedence):
        * published: a create/createOrReplace on the published id PLUS a delete of `drafts.<id>` → `{ action: 'published', description: 'a publié cette collection' }` (for a gallery document).
        * unpublished: a delete of the published id with NO create → `{ action: 'unpublished', description: 'a retiré cette collection du site' }`.
        * created: a create with no matching draft delete → `{ action: 'created', description: 'a créé cette collection' }`.
        * modified, 1 recognized field: a patch setting `title` → `{ action: 'modified', description: 'a modifié le titre' }`.
        * modified, 2 recognized fields: a patch touching `title` + `images` → 'a modifié le titre et les photos' (order follows the fieldLabels dedupe — assert the exact produced string).
        * modified, >2 recognized fields: a patch touching 3+ recognized fields → matches `/^a modifié .+ et \d+ autre\(s\) élément\(s\)$/` (assert the concrete string your fixture produces).
        * fallback (edge case): an empty mutations array, or a patch touching only unrecognized/`_`-prefixed fields, so no recognized labels and no create/delete → `{ action: 'modified', description: 'a modifié cette collection' }`.
      Pass a gallery `DashboardDocument` so `contentNoun` resolves to 'cette collection'; the `id` argument must equal `baseId(document._id)`.
    - `buildActivities`:
        * empty transactions → `{}` (edge case).
        * one transaction for a known document + known user with `displayName` → activity keyed by `baseId(document._id)` with `authorName` = displayName and `timestamp` = the transaction timestamp.
        * author-name fallback: user with no displayName but an `email` → authorName = email; author id absent from the users list → authorName = 'Un membre de l’équipe'.
        * most-recent-wins dedup: two transactions for the SAME document at different timestamps → exactly one activity, carrying the LATER timestamp (the function sorts descending and skips already-seen ids).
        * a transaction whose `documentIDs` reference a document NOT in the `documents` array → produces no activity for it (skipped).

    Do not modify any existing test or the `makeRow`/`complete`/`missing` helpers. Purely additive.
  </action>
  <verify>
    <automated>npm run test:unit -- tests/unit/dashboard-logic.test.ts 2>&1 | tail -20</automated>
  </verify>
  <done>New `describe` blocks for `isGalleryOnline`, `mutationDocumentId`, `mutationFields`, `contentNoun`, `attentionPriority`, `describeTransaction` (every branch above), and `buildActivities` (every case above) all pass; the file imports nothing from `@sanity/types`; existing tests still pass.</done>
</task>

<task type="auto">
  <name>Task 2: Expand accessibility.spec.ts route coverage (editions overview + détail + /en/)</name>
  <files>tests/e2e/accessibility.spec.ts</files>
  <action>
    Extend the EXISTING file without changing its testing approach. Two additive changes:

    (1) Static routes — add to the existing path array (the one driving the `for (const path of [...])` loop): `/editions/`, `/confidentialite/`, `/en/`, and `/en/about/`. This adds the éditions overview, the French privacy page (auditor-flagged as absent), and two `/en/*` twins — all static content routes analogous to the already-covered ones. Keep the loop body byte-for-byte identical (same `AxeBuilder({page}).withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])`, same serious/critical filter, same `expect(blocking, ...).toEqual([])`).

    (2) Édition détail — this route needs a REAL slug, so it cannot be a static array entry. Add ONE new `test(...)` block AFTER the loop that: navigates to `/editions/`, reads the first `.tile`'s `href` attribute (the real published détail URL — mirror `tests/e2e/edition.spec.ts`; never hardcode a slug, never use the nav), navigates to that href, then runs the SAME axe scan inline with the identical `withTags([...])` config and the identical serious/critical `.toEqual([])` assertion used in the loop. Do not extract a shared helper and do not change the axe configuration — duplicate the same three lines so the approach stays identical to the existing file. Give the test a clear title, e.g. describing it scans the first published édition détail page.

    Guard against an empty catalog gracefully only if the existing suite does (it does not — `edition.spec.ts` asserts the first `.tile` is visible, so real published éditions are expected to exist); mirror that expectation rather than adding new skip logic.
  </action>
  <verify>
    <automated>npx playwright test tests/e2e/accessibility.spec.ts 2>&1 | tail -25</automated>
  </verify>
  <done>The axe suite now covers the original 5 routes plus `/editions/`, `/confidentialite/`, `/en/`, `/en/about/` (static loop) and one dynamically-discovered `/editions/{slug}/` détail page; every new scan passes with the identical AxeBuilder config/assertion; no new testing approach or helper was introduced.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

No new trust boundaries. Both changes are test-only, add no dependencies, touch no production/runtime code, and introduce no new data flow.

| Boundary | Description |
|----------|-------------|
| (none introduced) | Changes are limited to two files under `tests/`; the Sanity `@sanity/types` import stays a build-time type-only reference already present in the source under test. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-ohf-01 | Tampering | test fixtures for Sanity transaction-log mutations | low | accept | Fixtures are inert plain object literals constructed in-test to exercise pure functions; they never reach Sanity, the network, or the build. No package installs in this plan (Package Legitimacy Gate N/A). |
</threat_model>

<verification>
Run from the repo root, in order — all must pass:

1. `npm run typecheck` — `astro check`; confirms the new unit tests introduced NO unresolved import (critical: proves the test file did not name `@sanity/types`) and no new type error.
2. `npm run test:coverage` — Vitest with coverage; confirms the new unit tests pass AND that `sanity/editorial/dashboardLogic.ts` statement/branch coverage rose above the 43.67% / 43.1% baseline (spot the file's row in the coverage table).
3. `npm run build` — static build succeeds (unchanged by test-only edits, but part of the gate).
4. `npx playwright test` — full e2e suite green, including the expanded `accessibility.spec.ts` (new routes + dynamic détail scan) with no serious/critical axe violations on any covered route.
</verification>

<success_criteria>
- `tests/unit/dashboard-logic.test.ts` gains passing coverage for `isGalleryOnline`, `mutationDocumentId`, `mutationFields`, `contentNoun`, `attentionPriority`, `describeTransaction` (all branches), and `buildActivities` (all cases) — imports nothing from `@sanity/types`; existing tests untouched.
- `dashboardLogic.ts` coverage measurably improves over 43.67% / 43.1% in `npm run test:coverage`.
- `tests/e2e/accessibility.spec.ts` scans the original 5 routes plus `/editions/`, `/confidentialite/`, `/en/`, `/en/about/`, and one dynamically-discovered `/editions/{slug}/` détail page, all with the identical axe config/assertions and no new approach/helper.
- `npm run typecheck`, `npm run test:coverage`, `npm run build`, and `npx playwright test` all pass.
- Exactly these 2 files changed; no production code touched.
</success_criteria>

<output>
Create `.planning/quick/260727-ohf-test-coverage-additions-unit-tests-for-d/260727-ohf-SUMMARY.md` when done. Record: the before/after `dashboardLogic.ts` coverage percentages from `test:coverage`, the list of new `describe` blocks + branch/case count for `describeTransaction` and `buildActivities`, the exact new route list added to `accessibility.spec.ts`, and the real slug the détail axe test resolved during the run.
</output>
