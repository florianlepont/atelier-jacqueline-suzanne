---
phase: quick-260720-dzi
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - package.json
  - package-lock.json
  - eslint.config.mjs
  - .github/workflows/deploy.yml
  - vitest.config.ts
  - sanity/package.json
  - .gitignore
autonomous: true
requirements: [260720-dzi]

must_haves:
  truths:
    - "Running `npm run typecheck` at the repo root runs `astro check`, type-checks all .astro + .ts source against the strict tsconfig, and exits non-zero on a type error"
    - "The GitHub Actions deploy workflow runs `astro check` as a BLOCKING step (before the build/test steps) so a type error inside .astro frontmatter fails the run and prevents deploy"
    - "Running `npm run lint` at the repo root lints src/ (.astro + .ts) via a flat ESLint config and reports/enforces violations without erroring on tooling misconfiguration"
    - "Running `npm run lint` inside sanity/ executes the existing @sanity/eslint-config-studio flat config against the Studio subproject"
    - "Running `npm run test:coverage` produces a V8 coverage report (text + html + json-summary) in a gitignored ./coverage directory"
  artifacts:
    - package.json
    - eslint.config.mjs
    - .github/workflows/deploy.yml
    - vitest.config.ts
    - sanity/package.json
    - .gitignore
  key_links:
    - "typecheck script resolves @astrojs/check + typescript (pinned ^5, satisfies both @astrojs/check's ^5||^6 peer and typescript-eslint@8's <6.1.0 peer)"
    - "CI `astro check` step placed after 'Install dependencies' and before the first build step so type errors fail fast and block deploy"
    - "Root eslint.config.mjs ignores sanity/, dist/, .astro/, coverage/, node_modules/ so the root lint never cross-lints the Studio subproject (own config/toolchain) or build outputs"
    - "@vitest/coverage-v8 pinned to exactly 4.1.9 to match installed vitest@4.1.9 (peer requires identical version)"
    - "eslint-plugin-astro@^3 pulls astro-eslint-parser + requires eslint>=10, @typescript-eslint/parser>=8.61, eslint-plugin-jsx-a11y>=6.10.2 as peers"
---

<objective>
Add four CI/tooling quality gates to the root Astro app and the Sanity Studio subproject, per a completed read-only quality audit (do not re-derive — implement as specified):

1. **Type-check gate** — root has `tsconfig.json` extending `astro/tsconfigs/strict`, but no `typescript`/`@astrojs/check` dependency and no type-check script; CI only runs `npm run build` (esbuild strips types without checking), so a type error in `.astro` frontmatter never fails the build. Add `@astrojs/check` + `typescript@^5`, a `typecheck` npm script, and a blocking `astro check` step in the deploy workflow.
2. **Root ESLint** — no ESLint config exists for the main `src/` app. Add a flat `eslint.config.mjs` (matching the modern ESLint 9+/10 convention already used by `sanity/eslint.config.mjs`) covering `.astro` (eslint-plugin-astro / astro-eslint-parser) and `.ts` (typescript-eslint), with a wired root `lint` script and a deliberately non-disruptive recommended ruleset.
3. **Sanity lint script** — `sanity/eslint.config.mjs` already exists and covers the Studio, but no `lint` script is wired in `sanity/package.json` to run it. Add one.
4. **Vitest coverage** — `vitest.config.ts` has no coverage block and `@vitest/coverage-v8` is not installed. Add the v8 provider config + a coverage script, and gitignore the coverage output dir. Reporting only — no failing threshold.

Purpose: Close real quality-gate gaps so type errors, lint violations, and coverage regressions become visible (and, for type errors, blocking) instead of silently shipping.
Output: Updated root `package.json` (deps + scripts), new root `eslint.config.mjs`, updated `.github/workflows/deploy.yml`, updated `vitest.config.ts`, updated `sanity/package.json`, updated `.gitignore`, and a SUMMARY documenting any pre-existing lint findings left un-cleaned.

Version pins (verified by a prior planning attempt — reuse, do NOT re-derive):
- TypeScript latest is 7.0.2, but `@astrojs/check@0.9.9` requires typescript `^5.0.0 || ^6.0.0` and `typescript-eslint@8.64` requires typescript `<6.1.0` → pin `typescript@^5`.
- `@vitest/coverage-v8` must be pinned to exactly `4.1.9` (peer requires the identical installed `vitest@4.1.9`).
- `eslint-plugin-astro@3.0.1` peers: `eslint>=10`, `@typescript-eslint/parser>=8.61`, `eslint-plugin-jsx-a11y>=6.10.2`.
- The `sanity/` subproject already has its own `node_modules`, `eslint@^9.28`, and `eslint.config.mjs` — only a script needs wiring there; do NOT reinstall or restructure it.

Scope guardrails (from task constraints):
- Do NOT touch `CLAUDE.md` or `AGENTS.md` — parallel quick task 260720-dzo owns those.
- Do NOT touch `src/components/HomeCarousel.astro` or add/extract any `src/lib` module — parallel quick task 260720-dzs owns that.
- Keep the initial ESLint ruleset reasonable (prefer plugin *recommended* configs, NOT type-checked/every-strict-rule) so it does not surface hundreds of pre-existing violations. Fix genuinely trivial violations only; document any remaining ones in the SUMMARY rather than blocking on a large-scale codebase cleanup.
- Coverage: reporting only, no build-failing threshold.
- Every new gate must run cleanly (or with only pre-existing, documented findings) — do NOT ship a check that fails the build on tooling misconfiguration.
</objective>

<execution_context>
@/home/user/ajs-website/.claude/gsd-core/workflows/execute-plan.md
@/home/user/ajs-website/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

# Files this plan modifies (all already exist except the new root eslint.config.mjs):
@package.json
@tsconfig.json
@astro.config.mjs
@vitest.config.ts
@.github/workflows/deploy.yml
@sanity/package.json
@sanity/eslint.config.mjs
@.gitignore

# Reference only — the Studio's existing flat config to mirror the style of (do not edit):
# sanity/eslint.config.mjs imports @sanity/eslint-config-studio and spreads it: `export default [...studio]`
# Root unit tests that the coverage run instruments live under tests/unit/**/*.test.ts and import from src/lib.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add astro check type-check gate (deps + typecheck script + blocking CI step)</name>
  <files>package.json, package-lock.json, .github/workflows/deploy.yml</files>
  <action>
Install the type-check tooling and wire it locally and in CI.

Install (root, devDependencies): `@astrojs/check@^0.9.9` and `typescript@^5` (latest 5.x — NOT 6 or 7; `@astrojs/check` peers typescript `^5.0.0 || ^6.0.0` and the ESLint task's typescript-eslint@8 peers typescript `<6.1.0`, so ^5 is the safe intersection). Use `npm install -D @astrojs/check@^0.9.9 typescript@^5` so package-lock.json is regenerated.

package.json scripts: add `"typecheck": "astro check"`. Leave existing scripts (`dev`, `build`, `preview`, `astro`, `test:unit`, `test:e2e`) untouched.

Run `npm run typecheck` locally and evaluate the result:
- If it exits 0 (expected — the site builds, tests pass, and the code was written under the strict tsconfig with editor tooling): proceed.
- If it reports genuine type errors, those are exactly what this gate exists to surface — FIX them (they should be few). EXCEPTION: if an error is located in a file owned by a parallel quick task — `src/components/HomeCarousel.astro` or any `src/lib/*` module (owned by 260720-dzs) — do NOT edit that file; record the exact error in the SUMMARY and stop to report back rather than committing a permanently-red blocking gate. Do NOT add per-file type-check suppressions or exclude source from tsconfig to force a green result.

CI step (`.github/workflows/deploy.yml`): add a new step named `Type-check (astro check)` running `npm run typecheck`, placed immediately AFTER the `Install dependencies` step (npm ci, ~line 40-41) and BEFORE `Build (test artifact, root base)` (~line 51) so a type error fails fast and blocks the deploy. No `env:` block is required — astro.config.mjs's `process.env` reads (SITE_URL, ASTRO_BASE) all have inline fallbacks and `astro check` does not execute page data-fetching frontmatter, so the Sanity secrets are not needed for type-checking. Do not modify any other existing step.
  </action>
  <verify>
    <automated>npm run typecheck</automated>
  </verify>
  <done>`npm run typecheck` exits 0 locally; `@astrojs/check` + `typescript@^5` are in root devDependencies; a blocking `Type-check (astro check)` step exists in deploy.yml before the build steps.</done>
</task>

<task type="auto">
  <name>Task 2: Add root flat ESLint config + wire root lint script</name>
  <files>eslint.config.mjs, package.json, package-lock.json</files>
  <action>
Install root ESLint tooling and add a non-disruptive flat config for the main app.

Install (root, devDependencies): `eslint@^10`, `typescript-eslint@^8.64`, `eslint-plugin-astro@^3.0.1`, `eslint-plugin-jsx-a11y@^6.10.2`, and `@eslint/js` (for the JS recommended base). `astro-eslint-parser` is a peer of eslint-plugin-astro and will resolve transitively; add it explicitly (`astro-eslint-parser@^1`) only if npm reports it missing. Use `npm install -D ...`. If npm surfaces a peer-dependency ERROR (not merely a warning) that blocks install, re-check the latest compatible majors with `npm view <pkg> peerDependencies` and adjust, but keep `typescript` pinned to `^5` (already installed in Task 1) and keep eslint at `>=10` (required by eslint-plugin-astro@3). Note the sanity/ subproject has its OWN node_modules/eslint@9 — these root installs do not touch or conflict with it.

Create `eslint.config.mjs` at the repo root (flat config, ESM, mirroring the style of `sanity/eslint.config.mjs`). Compose, in order: (1) a leading ignores entry for `dist/`, `.astro/`, `node_modules/`, `coverage/`, `playwright-report/`, `test-results/`, and `sanity/` (the Studio has its own config + toolchain — the root lint must never descend into it); (2) `@eslint/js` recommended (the `js.configs.recommended` export); (3) typescript-eslint's `recommended` config array (the non-type-checked `tseslint.configs.recommended` — do NOT use `recommended-type-checked`/`strict`, which require `parserOptions.project` and would surface many pre-existing violations); (4) eslint-plugin-astro's `flat/recommended` config array (sets up astro-eslint-parser for `.astro` files). Keep the custom rule set empty or minimal at first — rely on the plugins' recommended defaults per the non-disruptive constraint.

package.json scripts: add `"lint": "eslint ."`. Leave other scripts untouched.

Run `npm run lint`. Fix ONLY genuinely trivial auto-fixable/obvious violations (e.g. run `eslint . --fix` for formatting-class autofixes if it does not touch files owned by parallel tasks). Do NOT attempt a large-scale pre-existing cleanup, and do NOT edit `src/components/HomeCarousel.astro` or any `src/lib/*` file (owned by 260720-dzs) even to satisfy lint — if lint flags those files, leave them and note the counts/rules in the SUMMARY. The `lint` script may exit non-zero on remaining documented pre-existing violations; that is acceptable for this task (it is a real signal, not a tooling misconfiguration) as long as ESLint itself runs without a config/parse error. Record the outcome (clean, or N violations across M files by rule) in the SUMMARY.
  </action>
  <verify>
    <automated>npx eslint --print-config src/pages/index.astro > /dev/null && echo "eslint config resolves"</automated>
  </verify>
  <done>Root `eslint.config.mjs` exists as a flat config covering `.astro` + `.ts`, ignores `sanity/` and build outputs; `npm run lint` runs ESLint without a config/parse error; a `lint` script is wired in root package.json; any remaining pre-existing violations are documented in the SUMMARY.</done>
</task>

<task type="auto">
  <name>Task 3: Wire the existing Sanity Studio ESLint config to a lint script</name>
  <files>sanity/package.json</files>
  <action>
The Studio already has `sanity/eslint.config.mjs` (`export default [...studio]` from `@sanity/eslint-config-studio`) and `eslint@^9.28` in its own devDependencies, but no script runs it. Add `"lint": "eslint ."` to the `scripts` block in `sanity/package.json` (alongside the existing `build`, `deploy`, `deploy-graphql`, `dev`, `start`). Do NOT install anything, change existing scripts, or touch `sanity/eslint.config.mjs` — the config and eslint binary already exist in `sanity/node_modules`. Run the script once (`npm --prefix sanity run lint`) to confirm it resolves the Studio config and executes; note any pre-existing Studio violations in the SUMMARY without fixing them (out of scope — Studio cleanup is not this task).
  </action>
  <verify>
    <automated>npm --prefix sanity run lint; test $? -le 1 && echo "sanity lint script runs"</automated>
  </verify>
  <done>`sanity/package.json` has a `lint` script; `npm --prefix sanity run lint` executes the Studio's existing ESLint flat config (exit 0, or non-zero only from pre-existing violations, not a missing-script/config error).</done>
</task>

<task type="auto">
  <name>Task 4: Add Vitest v8 coverage reporting + gitignore output</name>
  <files>package.json, package-lock.json, vitest.config.ts, .gitignore</files>
  <action>
Add coverage reporting to the existing Vitest setup (reporting only — no build-failing threshold).

Install (root, devDependencies): `@vitest/coverage-v8@4.1.9` — pin EXACTLY 4.1.9 to match the installed `vitest@4.1.9` (the provider peer-requires the identical vitest version; a mismatch fails). Use `npm install -D @vitest/coverage-v8@4.1.9`.

`vitest.config.ts`: keep the existing `getViteConfig` wrapper and the `test` block's `include`/`environment`/`watch` untouched; add a `coverage` key inside `test` with: `provider: 'v8'`, `reporter: ['text', 'html', 'json-summary']` (all built into @vitest/coverage-v8, no extra deps), `reportsDirectory: './coverage'`, and `include: ['src/**/*.ts']` (the unit tests exercise `src/lib` TS modules; `.astro` components are not unit-tested so leave them out to keep the report meaningful). Do NOT set `thresholds` — reporting only per the constraint.

package.json scripts: add `"test:coverage": "vitest run --coverage"`. Leave `test:unit` and other scripts untouched.

`.gitignore`: add a `# Coverage` comment and a `coverage/` entry (the `reportsDirectory`) so generated reports are never committed.

Run `npm run test:coverage` and confirm it produces the `./coverage` directory with a report (the text reporter prints a table; html/json-summary write files). All existing unit tests must still pass.
  </action>
  <verify>
    <automated>npm run test:coverage && test -d coverage && echo "coverage report generated"</automated>
  </verify>
  <done>`@vitest/coverage-v8@4.1.9` is installed; `vitest.config.ts` has a `coverage` block (v8 provider, text/html/json-summary reporters, ./coverage dir, no failing threshold); `test:coverage` script wired; `coverage/` is gitignored; `npm run test:coverage` passes and emits a report.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| dev/CI supply chain (npm install) | New devDependencies enter the root `package.json`/lockfile and run in CI. This is the only trust boundary touched — no runtime app code, user input, network endpoint, or production surface changes. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-dzi-SC | Tampering | new npm devDependencies (@astrojs/check, typescript, eslint, typescript-eslint, eslint-plugin-astro, eslint-plugin-jsx-a11y, @eslint/js, @vitest/coverage-v8) | high | mitigate | All packages are canonical first-party tooling from well-known orgs — `typescript` (microsoft), `@astrojs/check` (withastro), `eslint`/`@eslint/js` (eslint), `typescript-eslint` (typescript-eslint org), `eslint-plugin-astro` (ota-meshi), `eslint-plugin-jsx-a11y` (jsx-eslint), `@vitest/coverage-v8` (vitest-dev). Not [ASSUMED]/[SUS]/[SLOP] — no obscure/typosquat candidates, so no blocking legitimacy checkpoint is warranted. Mitigation: pin exact/caret versions as specified (typescript `^5`, coverage-v8 `=4.1.9`), let `npm install` regenerate the committed `package-lock.json` (integrity-hash pinning), and verify each new gate command runs before commit. |
| T-dzi-CI | Denial of Service (deploy) | new blocking `astro check` CI step | medium | mitigate | A broken/red type-check gate would block all deploys. Mitigation: Task 1 requires `npm run typecheck` to exit 0 locally before the step is committed; if a genuine type error exists in a parallel-owned file it cannot fix, the executor reports back instead of shipping a permanently-red gate. ESLint and coverage are non-blocking (not added to the deploy gate), so they cannot block deploys. |
</threat_model>

<verification>
- `npm run typecheck` — exits 0 (astro check clean against the strict tsconfig).
- deploy.yml contains a `Type-check (astro check)` step positioned before the build/test steps.
- `npm run lint` — root ESLint runs without a config/parse error (violations, if any, are pre-existing and documented, not tooling failures).
- `npm --prefix sanity run lint` — Studio ESLint config executes.
- `npm run test:coverage` — unit tests pass and a V8 coverage report is written to the gitignored `./coverage`.
- `git status` — `coverage/` is untracked/ignored, not staged.
</verification>

<success_criteria>
- A `typecheck` script runs `astro check` and a BLOCKING CI step fails the deploy on a type error.
- A root flat `eslint.config.mjs` lints `.astro` + `.ts` under `src/`, ignores the Studio subproject and build outputs, and is wired to a `lint` script with a non-disruptive recommended ruleset.
- `sanity/package.json` has a `lint` script that runs the Studio's existing ESLint config.
- Vitest emits a V8 coverage report (text/html/json-summary) to a gitignored `./coverage`, via a `test:coverage` script, with no build-failing threshold.
- All version pins honored (typescript `^5`, `@vitest/coverage-v8` exactly `4.1.9`, eslint `>=10`); `package-lock.json` regenerated and committed.
- No changes to CLAUDE.md/AGENTS.md, HomeCarousel.astro, or any src/lib module.
- Any remaining pre-existing lint findings are documented in the SUMMARY rather than cleaned up in this task.
</success_criteria>

<output>
Create `.planning/quick/260720-dzi-add-ci-tooling-quality-gates-astro-check/260720-dzi-SUMMARY.md` when done.
</output>
