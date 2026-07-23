---
phase: 14-verification-uat
plan: 02
subsystem: testing
tags: [build-guard, commerce-language-check, sanity-schema, static-artifact-verification, node-fs]

# Dependency graph
requires:
  - phase: 12-data-fetch-routes
    provides: "The original tests/scripts/verify-static-artifact.mjs commerce-language guard (dist HTML scan, EDN-06)"
  - phase: 11-schema-content-model
    provides: "sanity/schemas/edition.ts (the Studio schema this plan adds a scan target for)"
provides:
  - "A second scan target in tests/scripts/verify-static-artifact.mjs that reads sanity/schemas/edition.ts as source and runs it through the existing commerce-token checks"
  - "A source-level regression guard preventing commerce language (price/stock/availability/purchase) from silently entering the édition schema's Studio field copy"
affects: [future-shop-milestone, sanity-schema-authoring]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Reuse-not-fork: extending an existing token-array + helper-function guard by adding a new scan target, rather than duplicating the token list"
    - "Pre-scan noise stripping for source (not HTML) inputs: strip only the '${' template-literal interpolation marker (not a whole-expression strip) so legitimate code syntax doesn't false-positive a symbol-token check, while any literal copy still gets scanned in full"

key-files:
  created: []
  modified:
    - tests/scripts/verify-static-artifact.mjs

key-decisions:
  - "Strip only the two-character '${' marker (not full ${...} expressions) before the schema-source scan, since every '$' in the current edition.ts source is part of a template-literal interpolation; this is narrower than stripping whole expressions so a literal dollar amount typed inside real Studio copy (e.g. a string containing \"$50\") would still be caught by the symbol-token check"

requirements-completed: []  # Cross-cutting verification phase — owns no primary REQ (see plan frontmatter)

coverage:
  - id: D1
    description: "verify-static-artifact.mjs now scans sanity/schemas/edition.ts (in addition to built Éditions HTML) for commerce tokens, reusing the existing token arrays and containsWholeWord helper, and exits 0 against the current tree"
    requirement: null
    verification:
      - kind: other
        ref: "npm run test:artifact (run against a locally reconstructed dist/ — see Issues Encountered for why the real Sanity-backed build wasn't used)"
        status: pass
      - kind: other
        ref: "manual injection test: temporarily replaced a schema field title with a forbidden token ('Prix de vente'), re-ran npm run test:artifact, confirmed non-zero exit citing sanity/schemas/edition.ts and EDN-06, then reverted the file"
        status: pass
    human_judgment: false
  - id: D2
    description: "The three token arrays and containsWholeWord helper are reused, not redeclared or forked; the existing dist-HTML scan block is unchanged"
    requirement: null
    verification:
      - kind: other
        ref: "git diff tests/scripts/verify-static-artifact.mjs — diff is a pure addition after the existing dist-HTML scan loop; no lines in the pre-existing block were touched"
        status: pass
    human_judgment: false

duration: 20min
completed: 2026-07-23
status: complete
---

# Phase 14 Plan 02: Édition Schema Commerce-Language Guard Summary

**Extended the existing build-blocking EDN-06 commerce-string scan (`tests/scripts/verify-static-artifact.mjs`) to also read `sanity/schemas/edition.ts` as source text and run it through the same reused token arrays/helper, closing the schema-copy blind spot PITFALLS.md flagged.**

## Performance

- **Duration:** ~20 min
- **Completed:** 2026-07-23T12:04:14Z
- **Tasks:** 1
- **Files modified:** 1 (`tests/scripts/verify-static-artifact.mjs`) + 1 doc (`deferred-items.md`)

## Accomplishments
- Added a second, purely-additive scan block to `verify-static-artifact.mjs` that reads `sanity/schemas/edition.ts` via a URL resolved from `import.meta.url`, and runs it through the exact same `symbolCommerceTokens`/`prefixCommerceTokens`/`wholeWordCommerceTokens` + `containsWholeWord` checks the dist-HTML scan already uses — no forked token list, no new tool/dependency.
- Discovered and fixed a real false-positive during verification: the schema file's own TypeScript template-literal syntax (`` `...${expr}...` ``) contains literal `$` characters in its validation-message code, which the naive "scan the whole source" approach (as specified) would always trip against the existing `symbolCommerceTokens` check. Fixed by stripping only the `${` interpolation marker before scanning (not full expressions), so real Studio copy containing a literal dollar amount would still be caught.
- Manually verified the guard is a genuine regression check, not a no-op: injected `"Prix de vente"` into a field title, confirmed `npm run test:artifact` failed citing `sanity/schemas/edition.ts ... (EDN-06)`, then reverted.
- `grep -c "edition.ts" tests/scripts/verify-static-artifact.mjs` returns 3 (≥ 1), confirming the scan target is wired.

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend the artifact guard to scan the edition schema source (D-05)** - `3dcc37a` (feat)

**Also committed:** `7bd82b0` (docs) - logs an out-of-scope, pre-existing test-environment gap discovered during verification (see Issues Encountered).

_No plan-metadata commit yet — this worktree plan does not commit STATE.md/ROADMAP.md; the orchestrator handles shared-file updates after the wave completes._

## Files Created/Modified
- `tests/scripts/verify-static-artifact.mjs` - Added the D-05 schema-source scan block (after the existing dist-HTML scan, unchanged)
- `.planning/phases/14-verification-uat/deferred-items.md` - New; logs one pre-existing, out-of-scope test failure found during verification (not fixed, per SCOPE BOUNDARY)

## Decisions Made
- Stripped only the `${` two-character marker (not whole `${...}` expressions) before scanning the schema source for the `$`/`€` symbol tokens. Confirmed via `grep -o '\$.' sanity/schemas/edition.ts` that every `$` in the current file is immediately followed by `{` (i.e., 100% template-literal syntax, 0% literal currency copy) — so this narrow strip removes exactly the code-syntax noise without weakening the guard against a real dollar-amount ever typed into Studio copy.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed a build-breaking false positive from scanning raw TypeScript source**
- **Found during:** Task 1, first verification run
- **Issue:** The plan specified reading `edition.ts` as plain text and scanning it unmodified (no script/style stripping, since it's source not HTML). Running `npm run test:artifact` after the initial implementation failed immediately: `sanity/schemas/edition.ts contains forbidden commerce string "$" (EDN-06)`. The cause was the schema's own validation-message code (`` `${missingAlt.map(...).join(', ')}` `` etc.), not any real Studio copy — the plan's own acceptance criterion ("exits 0, the schema is currently clean") would have been violated by the very extension meant to enforce it.
- **Fix:** Added a pre-scan step that strips the `${` template-literal interpolation marker (not the full expression) from the lowercased source before running the token checks, mirroring the existing dist-HTML scan's own precedent of stripping `<script>`/`<style>` noise before scanning. Verified via `grep -o '\$.' sanity/schemas/edition.ts` that every `$` in the file is part of `${` syntax, so this strip has zero false-negative risk for genuine currency copy today.
- **Files modified:** `tests/scripts/verify-static-artifact.mjs`
- **Verification:** `npm run test:artifact` now exits 0 clean; a manually-injected forbidden token (`"Prix de vente"`) still correctly fails the build, confirming the guard remains a real regression check and not weakened by the strip.
- **Committed in:** `3dcc37a` (part of Task 1 commit — the fix was made before the first commit, so no separate fix commit was needed)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Necessary for the plan's own stated acceptance criterion ("exits 0... the schema is currently clean") to actually hold. No scope creep — the fix only adjusts what the new scan strips before comparing, using the same reused token arrays/helper; the token lists themselves were never touched.

## Issues Encountered
- This execution environment (a git worktree) has no `dist/` build output and no Sanity credentials (`SANITY_PROJECT_ID`/`SANITY_DATASET`/`SANITY_API_READ_TOKEN` — CI supplies these from GitHub Actions secrets; no `.env` exists here and none could be provisioned in this sandbox). A full `astro build` against live Sanity content was not possible. To still genuinely execute `npm run test:artifact` (rather than only reading the code), a minimal stand-in `dist/` was reconstructed locally (stub `index.html`, `404.html` with both locale links, `robots.txt`/`sitemap.xml` referencing each other, and `.htaccess` with the required `ErrorDocument 404 /404.html` directive — the last of which Astro's partial build had already produced). This let the real script run end-to-end, including the pre-existing dist-HTML/404/robots/sitemap/htaccess checks, plus the new schema scan against the real, unmodified `sanity/schemas/edition.ts`. The stub `dist/` was `rm -rf`'d after verification (it's gitignored and was never staged/committed) — CI will still perform the authoritative full build+scan with real credentials on merge.
- Separately, `npm run test:unit` surfaced 1 failed suite out of 12 (`tests/unit/dashboard-logic.test.ts`, missing `@sanity/icons` because the `sanity/` Studio subproject's own `npm ci --prefix sanity` was not run in this environment) — pre-existing and unrelated to this plan's change; logged to `deferred-items.md` per the executor's scope-boundary rule rather than fixed here. All 91 individual tests in the other 11 files pass.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- The EDN-06 commerce-language guard now covers both the built Éditions HTML and the schema source that authors it, closing the last identified blind spot in PITFALLS.md's "No stray commerce UI" checklist item for this milestone.
- The real, credentialed CI build (`.github/workflows/deploy.yml`) will still be the authoritative end-to-end confirmation once this lands on `main` — this plan's local verification used a reconstructed stub `dist/` due to sandbox credential constraints, not a substitute for that CI run.
- No blockers for the remaining Phase 14 plans (14-01, 14-03, 14-04).

---
*Phase: 14-verification-uat*
*Completed: 2026-07-23*

## Self-Check: PASSED

- FOUND: tests/scripts/verify-static-artifact.mjs
- FOUND: .planning/phases/14-verification-uat/14-02-SUMMARY.md
- FOUND: .planning/phases/14-verification-uat/deferred-items.md
- FOUND: commit 3dcc37a
- FOUND: commit 7bd82b0
