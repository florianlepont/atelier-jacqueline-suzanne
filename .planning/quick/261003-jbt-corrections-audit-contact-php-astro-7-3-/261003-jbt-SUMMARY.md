---
phase: quick-261003-jbt
plan: 01
subsystem: contact-endpoint, ci-cd, seo, licensing
tags: [php, astro, github-actions, noindex, license, security]
requires: []
provides:
  - multi-line contact messages accepted; non-string POST fields rejected (executed php-cli tests)
  - astro 7.3.5
  - pull_request CI workflow (read-only, no secrets)
  - noindex on the non-root-base (GitHub Pages staging) build
  - SFTP host/account moved to repository variables
  - MIT LICENSE, LICENSE-CONTENT.md, SECURITY.md, README Licence section
  - .claude/settings.local.json untracked and ignored
affects: [public/contact.php, .github/workflows, src/layouts/BaseLayout.astro, README.md]
key-files:
  created:
    - .github/workflows/ci.yml
    - src/lib/robots.ts
    - tests/unit/robots-meta.test.ts
    - tests/unit/ci-workflow.test.ts
    - LICENSE
    - LICENSE-CONTENT.md
    - SECURITY.md
  modified:
    - public/contact.php
    - tests/unit/contact-php.test.ts
    - tests/unit/deploy-ovh-workflow.test.ts
    - .github/workflows/deploy-ovh.yml
    - src/layouts/BaseLayout.astro
    - package.json
    - package-lock.json
    - README.md
    - .gitignore
decisions:
  - Staging detection for noindex is base-path only (non-root ASTRO_BASE), so the root-base CI/e2e build keeps index, follow.
  - SFTP host/user are repository-level Actions variables (not secrets); guard step fails loudly if either is empty.
metrics:
  tasks: 3
  commits: 3
  completed: 2026-10-03
status: complete
---

# Quick 261003-jbt: Audit corrections Summary

Contact endpoint hardened (multi-line messages and array input) with tests that execute the real script under php-cli, Astro bumped to 7.3.5, a PR-time CI workflow added, the staging mirror made noindex, the SFTP target moved out of the tracked workflow into repository variables, and licence/security/hygiene files added.

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | bd34802 | fix(quick-261003-jbt): accept multi-line contact messages, reject non-string POST fields, add executed php-cli tests |
| 2 | 6d9db6c | chore(quick-261003-jbt): bump Astro to 7.3.5, add PR CI, noindex staging, move SFTP target to repo variables |
| 3 | 1ca1f70 | docs(quick-261003-jbt): add MIT licence, content-rights notice and security policy; untrack local Claude settings |

Astro bump was not isolated into its own commit (kept inside Task 2). Nothing was pushed.

## Audit item status

| Item | Status | Evidence |
|------|--------|----------|
| AUDIT-01a multi-line message accepted | done + verified | `npx vitest run tests/unit/contact-php.test.ts`: 20/20 pass with executed suite; case asserts HTTP 200, success true, all lines in captured mail body, none in header region |
| AUDIT-01b CR/LF in name/email still 400, nothing sent | done + verified | same run: 4 it.each cases (CR/LF x name/email) pass, mail capture absent |
| AUDIT-01c array in name/email/message -> JSON 400, exit 0 | done + verified | same run: 3 cases pass (exit status 0, success false, status 400, no mail) |
| AUDIT-01d array honeypot -> silent success, no mail | done + verified | same run: passes |
| Executed PHP tests skip cleanly without PHP | done + verified | `AJS_PHP_BIN=/nonexistent/php npx vitest run tests/unit/contact-php.test.ts`: 10 passed, 10 skipped, 0 failed |
| `php -l public/contact.php` | done + verified | "No syntax errors detected" (PHP 8.3.6; code written to PHP 7.1 syntax but NOT run on 7.1) |
| Astro 7.3.5 in package.json + lockfile | done + verified | package.json diff is the single astro line (`^7.3.5`); lockfile `node_modules/astro` version 7.3.5; no new top-level dependency |
| Root lint / typecheck / unit tests on Astro 7.3.5 | done + verified | `npm run lint` 0 problems; `npm run typecheck` 0 errors, 0 warnings, 1 hint; `npm run test:unit` 35 files / 747 tests pass; `npm run test:coverage` exit 0 (thresholds met) |
| Production build on Astro 7.3.5 | done + verified (see caveat) | `SANITY_PROJECT_ID=gwz8iug4 SANITY_DATASET=production npm run build` exit 0, 31 pages; also exit 0 with `SANITY_API_READ_TOKEN` unset |
| Staging noindex (non-root base) | done + verified | Build with `ASTRO_BASE=/atelier-jacqueline-suzanne/`: every one of the built HTML files contains `noindex, nofollow` (checked with `grep -L`, empty); root-base rebuild: `/` and `/en/` still emit `index, follow, max-image-preview:large`. Unit: `tests/unit/robots-meta.test.ts` 13 tests pass |
| ci.yml: pull_request only, read-only, no secrets | done + verified (statically) | `tests/unit/ci-workflow.test.ts` 5 tests pass. NOT verified by an actual GitHub Actions run (nothing pushed) |
| deploy-ovh.yml: host/user from repository variables, guard covers both, no echo | done + verified (statically) | `tests/unit/deploy-ovh-workflow.test.ts` 23 tests pass; `grep -nE 'atelihu\|cluster129' .github README.md` finds nothing. NOT exercised in a real workflow run |
| README: variables, PR CI, noindex note | done + verified | content reviewed via diff (seven-item setup list, ASTRO_BASE row, Deployments sentence) |
| LICENSE (MIT, 2026 Florian Lepont) | done + verified | Task 3 automated verify chain printed VERIFY-OK |
| LICENSE-CONTENT.md (EN + FR, AI/TDM reservation, contact address) | done + verified | Task 3 verify chain; wording not legally reviewed |
| SECURITY.md | done + verified | Task 3 verify chain |
| README Licence section | done + verified | `grep '^## Licence'` passes; placed before `## Author` |
| `.claude/settings.local.json` untracked, on disk, ignored; `settings.json` still tracked | done + verified | `git ls-files` empty for local file, `git check-ignore -q` passes, file present on disk |
| Create repository variables `OVH_SFTP_HOST` / `OVH_SFTP_USER` | not done (owner action, pending) | Cannot be done by this run; the next production deploy fails at the guard until both exist |
| Enable GitHub private vulnerability reporting | not done (owner action, pending) | Deliberately not touched; SECURITY.md points to it, email channel works meanwhile |

## TDD record (Task 1)

RED (before editing contact.php): 5 failed / 15 passed. Failures: the multi-line case (HTTP 400) and the four array cases (name, email, message, honeypot) exiting with status 255. Baseline, the CR/LF cases and all source-invariant tests passed, confirming the harness was sound. GREEN after the fix: 20/20.

Task 2 sub-steps for robots/CI/deploy-ovh also followed test-first: robots test failed on missing module, ci-workflow test failed on ENOENT, deploy-ovh test showed 4 new failures, then all passed after implementation.

## Deviations from Plan

**1. [Rule 3 - Blocking] Environment setup needed beyond `npm ci`**
- The checkout also lacked `sanity/node_modules`; ran `npm ci --prefix sanity` (as CI does), otherwise `tests/unit/dashboard-logic.test.ts` cannot resolve `@sanity/icons`.
- The ambient environment exports `SANITY_PROJECT_ID`, `SANITY_DATASET` and `SANITY_API_READ_TOKEN`; the project id has a leading space which made two unit test files fail ("projectId can only contain a-z..."). Unit tests, typecheck and coverage were therefore run with those three variables unset (`env -u ...`), which matches a PR run with no secrets and passes. No repo file was changed for this.

**2. [Rule 1 - Bug, in my own test code] Lint error in the new test helper** (`no-useless-assignment` on `json`); fixed before committing Task 1.

**3. Lockfile churn larger than "a few lines"**: package-lock.json changed by 553 insertions / 435 deletions. All changed entries are astro's own tree (new `@astrojs/compiler-rs` / `compiler-binding*` platform packages under `node_modules/astro/node_modules/`, `obug`, `find-proc`, `verkit`, `unifont/node_modules/undici`, and removal/relocation of `hast-util-*`, `parse5`, `vfile*`, `web-namespaces`, `estree-walker`, `@rollup/pluginutils` as no longer needed). No new top-level dependency in package.json. Astro 7.3.5 pulling in a Rust-based compiler binding is an upstream change I did not independently audit beyond reviewing the entry names.

**4. Build caveat (reporting correction)**: the plan expected no Sanity token to be available. In fact `SANITY_API_READ_TOKEN` was present in the ambient environment, so the first build used it. I then rebuilt with it unset (`env -u SANITY_API_READ_TOKEN`) and the build still succeeded (31 pages), so the claim holds without a token. Token value was never printed or recorded.

**5. Test strictness adjustment**: the deploy-ovh recap/completion test forbids `vars.`, `${OVH_SFTP_*}` expansions, `/home/` and "Target host/Remote path" rather than the bare variable names, because the neutral recap line legitimately names the variables.

## Known Stubs

None.

## Threat Flags

None beyond the plan's threat model. Residual (accepted in plan): the previous SFTP host and account name remain in git history and `.planning/`; `.claude/settings.local.json` (which contained a developer-machine absolute path) remains in git history. History was not rewritten.

## Pending owner actions

1. Create repository Actions variables before the next production deploy: `gh variable set OVH_SFTP_HOST --body '<ftp server hostname>'` and `gh variable set OVH_SFTP_USER --body '<ftp login>'` (repository level, from OVH Control Panel -> Hosting plans -> FTP - SSH). Until then the production credential guard fails the run by design.
2. Enable GitHub private vulnerability reporting (Settings -> Code security) so the first channel in SECURITY.md works.
3. Not verified here: the new `ci.yml` has not run on GitHub (it only starts on a real pull request). The composite action it reuses includes the Studio build; confirm the first PR run is green.

## Self-Check: PASSED

- Files exist: ci.yml, robots.ts, robots-meta.test.ts, ci-workflow.test.ts, LICENSE, LICENSE-CONTENT.md, SECURITY.md (all created and committed); settings.local.json present on disk.
- Commits exist: bd34802, 6d9db6c, 1ca1f70 (`git log -3`); no model name in any commit message; only the session trailer line.
- `git status --short` shows only the untracked `.planning/quick/261003-jbt-.../` directory.
