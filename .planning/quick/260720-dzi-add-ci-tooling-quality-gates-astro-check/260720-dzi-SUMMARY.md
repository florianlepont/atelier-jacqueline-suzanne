---
phase: quick-260720-dzi
plan: 01
subsystem: testing
tags: [astro-check, eslint, typescript-eslint, eslint-plugin-astro, vitest, coverage-v8, ci]

# Dependency graph
requires: []
provides:
  - "Blocking `astro check` type-check CI gate (npm run typecheck)"
  - "Root flat ESLint config (.astro + .ts under src/), wired to `npm run lint`"
  - "Sanity Studio `npm --prefix sanity run lint` script wired to its existing config"
  - "Vitest V8 coverage reporting via `npm run test:coverage` (gitignored ./coverage)"
affects: [ci, testing, deploy-workflow]

# Tech tracking
tech-stack:
  added:
    - "@astrojs/check@^0.9.9"
    - "typescript@^5 (root, pinned to satisfy both @astrojs/check and typescript-eslint@8 peers)"
    - "@types/node@^22 (root)"
    - "eslint@^10"
    - "typescript-eslint@^8.64"
    - "eslint-plugin-astro@^3.0.1"
    - "@eslint/js"
    - "@vitest/coverage-v8@4.1.9 (exact pin)"
  patterns:
    - "Root eslint.config.mjs flat config ignores sanity/ and GSD tooling dirs (.planning/, .claude/, .agents/, .codex/) so root lint never cross-lints unrelated toolchains"
    - "Leading-underscore convention for intentionally-unused params/vars encoded as an ESLint argsIgnorePattern/varsIgnorePattern (^_), matching pre-existing codebase style"

key-files:
  created:
    - eslint.config.mjs
  modified:
    - package.json
    - package-lock.json
    - tsconfig.json
    - .github/workflows/deploy.yml
    - vitest.config.ts
    - sanity/package.json
    - .gitignore
    - src/components/Input.astro
    - src/layouts/BaseLayout.astro
    - tests/e2e/homepage.spec.ts

key-decisions:
  - "Excluded sanity/ from the root tsconfig.json's include (via exclude: sanity, coverage, playwright-report, test-results) — the Studio is a separate subproject with its own tsconfig/node_modules; without this, astro check reported ~300 cross-project errors that had nothing to do with the root app"
  - "Installed @types/node so process.env usages in astro.config.mjs/playwright.config.ts/vitest.config.ts/tests type-check under the strict tsconfig"
  - "Omitted eslint-plugin-jsx-a11y from the root ESLint install — it's an optional peer of eslint-plugin-astro, and its latest published release (6.10.2) caps its own eslint peer at ^9, which conflicts with eslint-plugin-astro@3's eslint>=10 requirement (real npm ERESOLVE, not a version-pin mistake). flat/recommended does not require it; a11y rules are separate opt-in configs (flat/jsx-a11y-recommended/-strict) not used here"
  - "Added ignores for .planning/, .claude/, .agents/, .codex/ (GSD workflow/agent tooling, not app source) to eslint.config.mjs — without them `eslint .` swept up thousands of false-positive no-undef errors from an old reference file under .planning/design-import/"
  - "@vitest/coverage-v8 pinned to the exact version 4.1.9 (no caret) per the plan's peer-version-match requirement, correcting npm's default caret-range write to package.json"

requirements-completed: [260720-dzi]

coverage:
  - id: D1
    description: "npm run typecheck runs astro check, type-checks all .astro + .ts source under the strict tsconfig, exits 0 locally"
    requirement: "260720-dzi"
    verification:
      - kind: other
        ref: "npm run typecheck"
        status: pass
    human_judgment: false
  - id: D2
    description: "GitHub Actions deploy workflow runs a blocking Type-check (astro check) step before the build/test steps"
    requirement: "260720-dzi"
    verification:
      - kind: other
        ref: ".github/workflows/deploy.yml — 'Type-check (astro check)' step placed after 'Install dependencies' and before 'Build (test artifact, root base)'"
        status: pass
    human_judgment: false
  - id: D3
    description: "npm run lint lints src/ (.astro + .ts) via a flat ESLint config, runs without a config/parse error"
    requirement: "260720-dzi"
    verification:
      - kind: other
        ref: "npm run lint"
        status: pass
    human_judgment: false
  - id: D4
    description: "npm --prefix sanity run lint executes the Studio's existing @sanity/eslint-config-studio flat config"
    requirement: "260720-dzi"
    verification:
      - kind: other
        ref: "npm --prefix sanity run lint"
        status: pass
    human_judgment: false
  - id: D5
    description: "npm run test:coverage produces a V8 coverage report (text + html + json-summary) in a gitignored ./coverage directory, no failing threshold"
    requirement: "260720-dzi"
    verification:
      - kind: unit
        ref: "npm run test:coverage (41/41 tests passing) + coverage/ present and git-ignored"
        status: pass
    human_judgment: false

duration: 15min
completed: 2026-07-20
status: complete
---

# Quick Task 260720-dzi: CI Tooling Quality Gates Summary

**Added a blocking `astro check` type-check CI gate, a root flat ESLint config (typescript-eslint + eslint-plugin-astro), a wired Sanity Studio lint script, and Vitest V8 coverage reporting — all four gates run clean against the existing codebase.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-07-20T09:34:00Z
- **Completed:** 2026-07-20T09:46:57Z
- **Tasks:** 4
- **Files modified:** 12 (1 created: eslint.config.mjs)

## Accomplishments
- `npm run typecheck` (`astro check`) is a real gate: strict-tsconfig type errors in `.astro`/`.ts` source now fail the command, and a blocking CI step runs it before any build step
- Root `eslint.config.mjs` flat config lints `.astro` + `.ts` under `src/`/`tests/`, cleanly ignoring the Sanity Studio subproject and GSD tooling directories; `npm run lint` is 0 errors/0 warnings
- `sanity/package.json` gained a `lint` script that runs the Studio's pre-existing `@sanity/eslint-config-studio` config (previously unwired); `npm --prefix sanity run lint` exits 0
- Vitest now reports V8 coverage (text/html/json-summary) to a gitignored `./coverage` via `npm run test:coverage`, with no failing threshold — reporting only

## Task Commits

Each task was committed atomically:

1. **Task 1: Add astro check type-check gate (deps + typecheck script + blocking CI step)** - `96f53de` (feat)
2. **Task 2: Add root flat ESLint config + wire root lint script** - `dca74b5` (feat)
3. **Task 3: Wire the existing Sanity Studio ESLint config to a lint script** - `3929b1d` (feat)
4. **Task 4: Add Vitest v8 coverage reporting + gitignore output** - `ba63d52` (feat)

_No TDD tasks in this plan — single-commit-per-task, no test→feat→refactor split._

## Files Created/Modified
- `eslint.config.mjs` - New root flat ESLint config (js recommended + typescript-eslint recommended + eslint-plugin-astro flat/recommended), with ignores for sanity/, build outputs, and GSD tooling dirs, plus a `process`/`astroHTML` global fix and an `^_` unused-vars ignore pattern
- `package.json` - New devDeps (`@astrojs/check`, `typescript`, `@types/node`, `eslint`, `typescript-eslint`, `eslint-plugin-astro`, `@eslint/js`, `@vitest/coverage-v8`) and new scripts (`typecheck`, `lint`, `test:coverage`)
- `package-lock.json` - Regenerated for the above installs
- `tsconfig.json` - Excludes `sanity`, `coverage`, `playwright-report`, `test-results` from the root program (Studio is a separate subproject)
- `.github/workflows/deploy.yml` - New blocking "Type-check (astro check)" step, placed after `Install dependencies` and before the first build step
- `vitest.config.ts` - Added `/// <reference types="vitest/config" />` (fixes a pre-existing type error on the `test` block) and a `coverage` block (v8 provider, text/html/json-summary, `./coverage`, `src/**/*.ts`)
- `sanity/package.json` - New `lint` script
- `.gitignore` - New `coverage/` entry
- `src/components/Input.astro` - `type` prop typed as `astroHTML.JSX.HTMLInputTypeAttribute` (was a bare `string`, a genuine strict-mode type error)
- `src/layouts/BaseLayout.astro` - Inline locale-redirect script: `var` → `const` (6 occurrences; no-var lint fix, no behavior change)
- `tests/e2e/homepage.spec.ts` - Two `astro check` fixes (KeyframeEffect/HTMLElement casts for `pseudoElement`/`style` DOM APIs) and one `void` prefix on a documented forced-reflow read (no-unused-expressions lint fix)

## Decisions Made
- Excluded `sanity/` from the root `tsconfig.json` — it is a separate subproject with its own `tsconfig.json`/`node_modules`; leaving it included caused `astro check` to report ~300 cross-project errors (missing modules resolvable only from `sanity/node_modules`) that had nothing to do with the root app's own type safety.
- Installed `@types/node` (root) since the strict tsconfig otherwise fails on every `process.env` read in `astro.config.mjs`, `playwright.config.ts`, `vitest.config.ts`, and a unit test.
- Omitted `eslint-plugin-jsx-a11y` from the root ESLint install: it's declared as an *optional* peer of `eslint-plugin-astro`, and its latest published version (6.10.2) still caps its own `eslint` peer at `^9`, conflicting with `eslint-plugin-astro@3.0.1`'s `eslint>=10` requirement (a real `npm ERESOLVE`, not a wrong version pin — verified via `npm view eslint-plugin-jsx-a11y peerDependencies`). `eslint-plugin-astro`'s `flat/recommended` does not require jsx-a11y; a11y rules ship as separate opt-in configs (`flat/jsx-a11y-recommended`, `flat/jsx-a11y-strict`) that were not wired in, matching the plan's "non-disruptive recommended ruleset" constraint.
- Added `.planning/`, `.claude/`, `.agents/`, `.codex/` to the ESLint ignores list alongside the plan's specified `dist/`, `.astro/`, `node_modules/`, `coverage/`, `playwright-report/`, `test-results/`, `sanity/` — without this, `eslint .` swept in GSD's own workflow/agent tooling and a stray reference script under `.planning/design-import/homepage-prototype/support.js`, producing ~2,900 false-positive `no-undef` errors unrelated to the actual Astro app.
- Added a minimal, non-disruptive `@typescript-eslint/no-unused-vars` override (`argsIgnorePattern`/`varsIgnorePattern`/`caughtErrorsIgnorePattern`: `^_`) to match the codebase's existing leading-underscore "intentionally unused" convention (already used in `src/lib/i18n-paths.ts` and `tests/e2e/homepage.spec.ts` before this task).
- Regenerated `sanity/node_modules` via `npm --prefix sanity ci` (from the existing, unmodified `sanity/package-lock.json`) purely to verify the Studio's lint script locally — the fresh worktree checkout had no `node_modules` anywhere; this is a local environment bootstrap, not a dependency change (the lockfile is untouched, confirmed via `git status`).
- Corrected `@vitest/coverage-v8`'s `package.json` entry from npm's default `^4.1.9` to an exact `4.1.9` (no caret), per the plan's explicit peer-version-match requirement with the installed `vitest@4.1.9`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] tsconfig.json excluded sanity/ + build-output dirs from the root type-check program**
- **Found during:** Task 1
- **Issue:** `astro check` against the existing `tsconfig.json` (`include: ["**/*"]`, no exclude beyond `dist`) swept in `sanity/` — a separate subproject with its own `node_modules`/`tsconfig.json` — producing ~300 "Cannot find module" and implicit-`any` errors that were not genuine root-app bugs.
- **Fix:** Added `sanity`, `coverage`, `playwright-report`, `test-results` to `tsconfig.json`'s `exclude`.
- **Files modified:** `tsconfig.json`
- **Verification:** `npm run typecheck` error count dropped from 333 to 4 (the remaining 4 were genuine, fixed separately below).
- **Committed in:** `96f53de` (Task 1 commit)

**2. [Rule 3 - Blocking] Installed @types/node to type process.env usages**
- **Found during:** Task 1
- **Issue:** `astro.config.mjs`, `playwright.config.ts`, `vitest.config.ts`, and `tests/unit/gallery-query.test.ts` all read `process.env.*`; without Node's ambient types, the strict tsconfig reported `ts(2580): Cannot find name 'process'`.
- **Fix:** `npm install -D @types/node@^22` (matches the Node 22 pinned in CI).
- **Files modified:** `package.json`, `package-lock.json`
- **Verification:** Those `process` errors disappeared from `npm run typecheck` output.
- **Committed in:** `96f53de` (Task 1 commit)

**3. [Rule 1 - Bug] Fixed 3 genuine pre-existing type errors surfaced by the new astro check gate**
- **Found during:** Task 1
- **Issue:** `src/components/Input.astro`'s `type` prop was typed as a bare `string`, not assignable to the `<input type>` HTML attribute type; `tests/e2e/homepage.spec.ts` had two DOM/Animation API accesses (`Element.style`, `AnimationEffect.pseudoElement`) not present on their narrower TS lib types; `vitest.config.ts`'s `test` block didn't type-check against Vite's `UserConfig` because the `vitest/config` module-augmentation wasn't in scope.
- **Fix:** Typed `Input.astro`'s prop as `astroHTML.JSX.HTMLInputTypeAttribute`; added `as HTMLElement` / `as KeyframeEffect | null` casts at the two e2e call sites; added `/// <reference types="vitest/config" />` to `vitest.config.ts`.
- **Files modified:** `src/components/Input.astro`, `tests/e2e/homepage.spec.ts`, `vitest.config.ts`
- **Verification:** `npm run typecheck` — 0 errors (down from 4).
- **Committed in:** `96f53de` (Task 1 commit)

**4. [Rule 3 - Blocking] Dropped eslint-plugin-jsx-a11y from the ESLint install due to a real upstream peer conflict**
- **Found during:** Task 2
- **Issue:** `npm install -D ... eslint-plugin-jsx-a11y@^6.10.2 ...` failed with `ERESOLVE` — `eslint-plugin-jsx-a11y@6.10.2`'s own `eslint` peer range (`^3..^9`) conflicts with `eslint-plugin-astro@3.0.1`'s `eslint>=10` requirement.
- **Fix:** Verified via `npm view eslint-plugin-astro peerDependenciesMeta` that `eslint-plugin-jsx-a11y` is an *optional* peer, and that `flat/recommended` doesn't depend on it (a11y rules live in separate opt-in `flat/jsx-a11y-*` configs). Installed without it.
- **Files modified:** `package.json`, `package-lock.json`
- **Verification:** `npm install -D eslint@^10 typescript-eslint@^8.64 eslint-plugin-astro@^3.0.1 @eslint/js` succeeded cleanly; `npx eslint --print-config src/pages/index.astro` resolves.
- **Committed in:** `dca74b5` (Task 2 commit)

**5. [Rule 1/3 - Config correctness] Added ignores + globals to eliminate ~2,900 false-positive lint errors**
- **Found during:** Task 2
- **Issue:** The first `eslint.config.mjs` draft (ignoring only `dist/`, `.astro/`, `node_modules/`, `coverage/`, `playwright-report/`, `test-results/`, `sanity/` per the plan text) still swept in GSD's own tooling directories (`.planning/`, `.claude/`, `.agents/`, `.codex/`) and reported `process`/`astroHTML` as undefined globals in root config files and `.astro` frontmatter.
- **Fix:** Extended the ignores list; added a scoped `process` global for `*.config.mjs`/`eslint.config.mjs` and a scoped `astroHTML` global for `**/*.astro`.
- **Files modified:** `eslint.config.mjs`
- **Verification:** `npm run lint` error count dropped from 2,979 to 12 (the remaining 12 were genuine pre-existing issues, fixed next).
- **Committed in:** `dca74b5` (Task 2 commit)

**6. [Rule 1 - Bug] Fixed remaining genuine pre-existing lint violations**
- **Found during:** Task 2
- **Issue:** `BaseLayout.astro`'s inline locale-redirect script used `var` (6x, `no-var`); `homepage.spec.ts` had a documented forced-reflow property read flagged by `no-unused-expressions`; `src/lib/i18n-paths.ts` and `homepage.spec.ts` each had one intentionally-unused, underscore-prefixed binding flagged by `@typescript-eslint/no-unused-vars`.
- **Fix:** `var` → `const` in `BaseLayout.astro`; `void` prefix on the forced-reflow read in `homepage.spec.ts`; added an `argsIgnorePattern`/`varsIgnorePattern`/`caughtErrorsIgnorePattern` of `^_` to the ESLint config (matches the codebase's existing convention, rather than renaming call sites).
- **Files modified:** `src/layouts/BaseLayout.astro`, `tests/e2e/homepage.spec.ts`, `eslint.config.mjs`
- **Verification:** `npm run lint` — 0 errors, 0 warnings.
- **Committed in:** `dca74b5` (Task 2 commit)

**7. [Rule 3 - Blocking] Bootstrapped sanity/node_modules to verify the new lint script**
- **Found during:** Task 3
- **Issue:** The fresh worktree checkout had no `sanity/node_modules` at all (gitignored, never committed), so `npm --prefix sanity run lint` failed with `ERR_MODULE_NOT_FOUND` for `@sanity/eslint-config-studio` — not a missing-script error, but an unpopulated local environment.
- **Fix:** `npm --prefix sanity ci` (installs exactly from the existing, unmodified `sanity/package-lock.json` — no dependency or lockfile changes).
- **Files modified:** None (local `node_modules` only; confirmed `git status --short sanity/package-lock.json` showed no diff)
- **Verification:** `npm --prefix sanity run lint` exits 0.
- **Committed in:** N/A (no file changes to commit — `sanity/node_modules` is gitignored)

**8. [Rule 1 - Correctness] Corrected @vitest/coverage-v8's package.json pin to an exact version**
- **Found during:** Task 4
- **Issue:** `npm install -D @vitest/coverage-v8@4.1.9` wrote `"^4.1.9"` (caret) to `package.json` by default, not the exact pin the plan required to match the peer-locked `vitest@4.1.9`.
- **Fix:** Manually edited `package.json` to `"4.1.9"` (no caret), then `npm install` to sync `package-lock.json` (no-op — already resolved to 4.1.9).
- **Files modified:** `package.json`
- **Verification:** `grep '"@vitest/coverage-v8"' package-lock.json` shows `"4.1.9"` in both direct and peer-dep entries.
- **Committed in:** `ba63d52` (Task 4 commit)

---

**Total deviations:** 8 auto-fixed (4 blocking/config-correctness, 3 genuine pre-existing bug fixes, 1 version-pin correction)
**Impact on plan:** All auto-fixes were necessary to make the new gates report real signal instead of tooling-induced false positives, per the plan's own "do not ship a check that fails on tooling misconfiguration" constraint. No scope creep — no HomeCarousel.astro, src/lib module, CLAUDE.md, or AGENTS.md changes; no large-scale pre-existing-violation cleanup attempted beyond the trivial fixes documented above.

## Issues Encountered
None beyond the deviations documented above — all were resolved within this session without needing to report back or block.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All four quality gates (`typecheck`, `lint`, Sanity Studio `lint`, `test:coverage`) run clean against the current codebase and are ready for regular use.
- The CI deploy workflow now hard-blocks on type errors before any build step; ESLint and coverage remain local/reporting-only (not added to CI) per the plan's non-blocking-except-typecheck scope.
- No blockers for the parallel quick tasks 260720-dzo (CLAUDE.md/AGENTS.md/README.md) or 260720-dzs (HomeCarousel.astro + new src/lib module) — none of the files this task touched overlap with theirs.

---
*Phase: quick-260720-dzi*
*Completed: 2026-07-20*

## Self-Check: PASSED

All created/modified files confirmed present on disk; all 4 task commits (`96f53de`, `dca74b5`, `3929b1d`, `ba63d52`) confirmed in git history.
