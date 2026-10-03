---
phase: quick-261003-kci
plan: 01
subsystem: tooling, seo
tags: [sanity, sharp, image-downsize, robots-txt, ai-crawlers, vitest]
requires: []
provides:
  - "npm run sanity:downsize-images (read-only dry-run by default; gated --apply / --delete-originals)"
  - "robots.txt opt-out groups for 11 AI crawlers"
affects: [README.md, eslint.config.mjs, package.json, package-lock.json]
tech-stack:
  added: ["sharp ^0.35.4 (root devDependency; already locked at 0.35.5 as astro's optional dependency)"]
  patterns: ["pure importable .mjs module + thin CLI", "fetch-only read facade for dry-run", "fail-closed deletion gate"]
key-files:
  created:
    - scripts/lib/sanity-image-downsize.mjs
    - scripts/sanity-downsize-images.mjs
    - tests/unit/sanity-image-downsize.test.ts
    - docs/reduction-images-sanity.md
  modified:
    - package.json
    - package-lock.json
    - eslint.config.mjs
    - README.md
    - src/lib/static-routes.ts
    - tests/unit/static-routes.test.ts
    - tests/scripts/verify-static-artifact.mjs
    - tests/e2e/seo.spec.ts
key-decisions:
  - "Selection depends only on width and mime type, never on references, so old assets are still found by a later --delete-originals run"
  - "Deletion candidates are all oversized assets, including ones orphaned by an earlier --apply run"
  - "Reduced copies drop EXIF (GPS, stale orientation) and keep the ICC profile"
  - "JPEG/WebP output quality 90 (mozjpeg for JPEG), PNG lossless"
  - "MIN_THRESHOLD of 800 enforced by the option parser"
  - ".env auto-loaded with process.loadEnvFile (never overrides set variables; missing file tolerated)"
  - "A per-asset failure is recorded and the loop continues; the run exits 1 at the end"
  - "AI crawlers each get their own User-agent group (no shared multi-agent group)"
requirements-completed: [IMG-DOWNSIZE-01, ROBOTS-AI-01]
duration: ~25min
completed: 2026-10-03
status: complete
---

# Phase quick-261003-kci Plan 01: Sanity image downsizing tool and AI-crawler robots.txt Summary

A safe-by-default CLI to shrink oversized Sanity images (read-only dry-run unless `--apply --i-have-a-backup` plus a write token; deletion only behind a fail-closed zero-reference re-check), with a French runbook, and a robots.txt that opts 11 AI crawlers out while keeping the generic allow group and the Sitemap line.

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | `8fd3593` | feat(quick-261003-kci): add Sanity image downsizing script, dry-run by default |
| 2 | `44e63ab` | feat(quick-261003-kci): opt AI crawlers out of the site via robots.txt |

Both carry only the `Claude-Session` trailer (no model name).

## Plan item status

Env note: unit/typecheck/coverage runs used `env -u SANITY_API_READ_TOKEN -u ' SANITY_PROJECT_ID' SANITY_PROJECT_ID=gwz8iug4 SANITY_DATASET=production ...`. Without it, 2 pre-existing test files fail because of the shell's malformed env, unrelated to this work.

| Item | Status | Evidence |
|------|--------|----------|
| Pure module `scripts/lib/sanity-image-downsize.mjs` (selection, target math, reference walking/patches, asset id parse, options, deletion safety, redaction, report) | done + verified | `npx vitest run tests/unit/sanity-image-downsize.test.ts`: 71 passed |
| Thin CLI `scripts/sanity-downsize-images.mjs`, options validated before any import/client | done, validation verified; network paths unverified | `--help` exit 0; `--apply` (no backup flag) exit 2; `--apply --i-have-a-backup` without token exit 2; `--delete-originals` without `--apply` exit 2 |
| Dry-run is read-only (fetch-only facade, no write capability) | done, verified by code review only | By construction in the CLI; never executed (see "Never run against the network") |
| `--apply` download/resize/upload/repoint/delete-nothing | done but unverified | Never run: requires a live dataset and write token. Pure parts (dimension math, patch planning, id parsing) unit-tested |
| `--delete-originals` fail-closed re-check | gate logic done + verified; the delete loop itself unverified | `assessDeletionSafety` unit-tested (unknown count, count > 0, failed replacement, empty list); CLI delete loop never run |
| Write token env-only, never printed, errors redacted | done + verified (unit) | `redactSecrets` / `describeError` tests; options tests assert no token in errors or dry-run options |
| `--threshold`, `--dataset`, `--project-id` with env fallbacks | done + verified | `resolveCliOptions` tests |
| `sharp` root devDependency, npm script, lock in sync | done + verified | `npm ci --dry-run` succeeds; lock diff has 0 new `node_modules/*` entries (only root devDependencies, sharp `optional` to `devOptional`, and `dev: true` flags on its optional binaries); sharp still 0.35.5 |
| ESLint Node globals for `scripts/**/*.mjs` | done + verified | `npm run lint` clean |
| French runbook `docs/reduction-images-sanity.md` + README links (script row, `SANITY_WRITE_TOKEN` row) | done + verified | docs-contract tests (needles, ordering, README links) pass; `publishing-docs.test.ts` still passes (README rows do not contain `_type in [`) |
| robots.txt: 11 AI groups + generic group + Sitemap, deterrent comment | done + verified | `npx vitest run tests/unit/static-routes.test.ts`: 18 passed (structure-based, both bases) |
| `src/pages/robots.txt.ts` unchanged and still delegating | done + verified | Source-text guard in unit test |
| `verify-static-artifact.mjs` robots assertions (2 added) | done, syntax-only | `node --check` passes; NOT executed (see CI-only note) |
| `tests/e2e/seo.spec.ts` extended assertion | done, lint/typecheck-only | `npm run lint` + `npm run typecheck` clean; NOT executed (see CI-only note) |
| `npm run lint` | passed | no output, exit 0 |
| `npm run typecheck` (astro check) | passed | 0 errors, 0 warnings (1 pre-existing hint) |
| `npm run test:unit` | passed | 32 files, 528 tests (before Task 2 additions) |
| `npm run test:coverage` (after Task 2) | passed | 32 files, 534 tests, thresholds met (All files 98.56 stmts / 87.7 branches / 100 funcs / 99.26 lines) |

## Never run against the network

The CLI was never run against the network in any mode: no dry-run, no `--apply`, no `--delete-originals`, no write token used. Only `--help` and the three refusal invocations above (all exit before `@sanity/client` or `sharp` is imported) were executed. The download, sharp encode, upload, transaction commit and delete code paths have therefore never executed; they are covered only by TypeScript checking (`@ts-check` on both files, typecheck clean) and by unit tests of the pure helpers they call. A first real dry-run by the maintainer is the real smoke test.

Known fail-safe behaviour worth watching on that first run: the target dimensions come from Sanity's stored metadata while sharp auto-orients. If an asset's stored dimensions are not already orientation-corrected, the post-resize size check fails that asset (nothing is uploaded), rather than silently changing it.

## CI-only checks (not executed locally)

- `tests/scripts/verify-static-artifact.mjs` (two new robots assertions): runs against a built `dist/`, and the build fetches content from Sanity. Locally only `node --check` was done.
- `tests/e2e/seo.spec.ts` (extended robots.txt test): Playwright against a built site, run in CI. Locally it is covered only by lint and typecheck.
- `scripts/launch-smoke-check.sh` probe: untouched; its `sitemap.xml` substring is still emitted.

## Deviations from Plan

None to the plan's scope. Minor notes:

- `npm install --save-dev sharp@^0.35.4` wrote `^0.35.5` into package.json and the lock; both were changed back by hand to the plan's `^0.35.4`. `npm ci --dry-run` confirms they are in sync.
- `// @ts-check` is kept on both files (no removal needed). The Sanity client type is referenced through a JSDoc `@typedef` import and sharp through `import('sharp').default`.
- Unknown-option errors echo only the option name (never the `=value` part), so a mistyped `--token=...` cannot leak.

## Design discretions taken

Width-only selection; orphan-inclusive deletion candidates; EXIF dropped / ICC kept; JPEG and WebP quality 90 (mozjpeg for JPEG, PNG lossless); MIN_THRESHOLD 800; `.env` auto-loaded; per-asset failure continues and the run exits 1.

## Issues Encountered

- Mid-run, a stray `export -n` command in my shell dumped the process environment into the tool output, which included the value of `SANITY_API_READ_TOKEN` (the read token the environment provides). Nothing was written to any file or commit. Consider rotating that read token as a precaution.

## Threat Flags

None beyond the plan's threat model.

## Self-Check: PASSED

- Files present: scripts/lib/sanity-image-downsize.mjs, scripts/sanity-downsize-images.mjs, tests/unit/sanity-image-downsize.test.ts, docs/reduction-images-sanity.md (all committed in 8fd3593).
- Commits 8fd3593 and 44e63ab exist on `claude/kind-cannon-2myct1`; `git status` clean apart from this untracked SUMMARY directory.
- `git diff --stat HEAD~2` lists only the plan's frontmatter files (no `.github/`, `.claude/`, legal pages).
