---
phase: quick-260727-ntd
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - .github/workflows/deploy.yml
  - CLAUDE.md
autonomous: true
requirements: ["260727-ntd"]

must_haves:
  truths:
    - "CI caches Playwright browser binaries in ~/.cache/ms-playwright keyed on the OS + package-lock.json hash, so browser downloads are skipped on cache hit."
    - "The sanity/ subproject install benefits from a cache key derived from sanity/package-lock.json (not only the root lockfile)."
    - "Every pre-existing blocking gate (Sanity lint+build, astro check typecheck, both test:artifact runs, Playwright e2e, Vitest coverage, un-prefixed-link grep) still runs, in the same order, unweakened."
    - "CLAUDE.md's Development & CI Tools GitHub Actions description matches the actual deploy.yml step sequence, including the four previously-missing facts and the new caching."
  artifacts:
    - .github/workflows/deploy.yml
    - CLAUDE.md
  key_links:
    - "Playwright cache step is placed BEFORE the browser-install step and the e2e step."
    - "On a Playwright cache hit, OS-level browser deps (install-deps) are still installed — those are not stored in ~/.cache/ms-playwright."
    - "setup-node cache-dependency-path lists both package-lock.json and sanity/package-lock.json."
---

<objective>
Two CI architecture improvements from a confirmed codebase audit, plus a doc-accuracy fix:

1. Add well-established caching to `.github/workflows/deploy.yml` for (a) Playwright browser binaries (currently re-downloaded every run, including on every `repository_dispatch` Sanity-publish trigger) and (b) the `sanity/` subproject install.
2. Update CLAUDE.md's "Development & CI Tools" GitHub Actions description to match what deploy.yml actually runs (it is currently materially incomplete).

Purpose: Faster, cheaper CI runs (fewer redundant browser downloads) and accurate project docs.
Output: Edited `.github/workflows/deploy.yml` (caching added, no gate weakened) and edited `CLAUDE.md` (accurate pipeline description).
</objective>

<execution_context>
@/home/user/ajs-website/.claude/gsd-core/workflows/execute-plan.md
@/home/user/ajs-website/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@CLAUDE.md
@.github/workflows/deploy.yml
@playwright.config.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add Playwright + Sanity install caching to deploy.yml</name>
  <files>.github/workflows/deploy.yml</files>
  <read_first>.github/workflows/deploy.yml (read the current step order fresh before editing — do NOT reorder or drop any existing step)</read_first>
  <action>
  Make two additive, standard caching changes. Do NOT invent anything exotic — use `actions/cache@v4` and setup-node's built-in npm cache only.

  (1) Sanity install cache — extend the existing "Set up Node 22" `actions/setup-node@v4` step (the one that already has `cache: npm`) by adding a `cache-dependency-path` input that lists BOTH lockfiles: `package-lock.json` and `sanity/package-lock.json` (multi-line YAML block scalar). This makes the built-in `~/.npm` download cache key incorporate the sanity lockfile too, so `npm ci --prefix sanity` reuses cached downloads. Do not touch the `node-version: '22'` or `cache: npm` lines — only add `cache-dependency-path`. Do not add a separate `actions/cache` for `sanity/node_modules` (caching node_modules directly is more fragile than the shared npm-download cache; the setup-node approach is the well-established one).

  (2) Playwright browser cache — insert a new cache step immediately BEFORE the existing "Install Playwright browsers" step (and therefore before the "Run Playwright e2e tests" step). Give it `id: playwright-cache`, `uses: actions/cache@v4`, `path: ~/.cache/ms-playwright`, and `key: ${{ runner.os }}-playwright-${{ hashFiles('package-lock.json') }}`. Then split the browser install into two conditional steps: the existing `npx playwright install --with-deps chromium webkit` guarded by `if: steps.playwright-cache.outputs.cache-hit != 'true'` (full install on miss), and a new step `npx playwright install-deps chromium webkit` guarded by `if: steps.playwright-cache.outputs.cache-hit == 'true'` (OS-level deps only on hit — those are NOT stored in ~/.cache/ms-playwright, so they must still be installed even when the cached browser binaries are restored). Keep the browser scope exactly `chromium webkit` — do not add firefox.

  Leave every other step (Sanity lint+build, astro check typecheck, both builds, both `test:artifact` runs, e2e, Vitest coverage, un-prefixed-link grep, upload, deploy) exactly as-is, in the same order.
  </action>
  <verify>
    <automated>python3 -c "import yaml; yaml.safe_load(open('.github/workflows/deploy.yml'))" && echo YAML_OK</automated>
    <automated>grep -q 'actions/cache@v4' .github/workflows/deploy.yml && grep -q 'ms-playwright' .github/workflows/deploy.yml && grep -q "cache-dependency-path" .github/workflows/deploy.yml && grep -q 'sanity/package-lock.json' .github/workflows/deploy.yml && echo CACHE_STEPS_PRESENT</automated>
    <automated>grep -q "playwright install-deps chromium webkit" .github/workflows/deploy.yml && grep -q "playwright install --with-deps chromium webkit" .github/workflows/deploy.yml && echo INSTALL_SPLIT_OK</automated>
  </verify>
  <done>deploy.yml is valid YAML; a `playwright-cache` step using actions/cache@v4 on `~/.cache/ms-playwright` sits before the Playwright install/e2e steps; the browser install is split into miss (full `--with-deps`) and hit (`install-deps` only) conditionals scoped to `chromium webkit`; setup-node's `cache-dependency-path` covers both lockfiles; no pre-existing gate removed, reordered, or weakened.</done>
</task>

<task type="auto">
  <name>Task 2: Update CLAUDE.md CI pipeline description to match deploy.yml</name>
  <files>CLAUDE.md</files>
  <read_first>.github/workflows/deploy.yml (final edited version from Task 1), CLAUDE.md (the "Development & CI Tools" table, GitHub Actions row)</read_first>
  <action>
  Rewrite the GitHub Actions row's description in the "Development & CI Tools" table so it matches the ACTUAL, edited deploy.yml step order. The current text ("Node 22 → npm ci → build (root base, test artifact) → Playwright e2e + Vitest unit as a BLOCKING gate → rebuild with GitHub Pages base → un-prefixed-link grep guard → deploy to GitHub Pages") is materially incomplete. The new description must cover the real ordered flow and MUST explicitly include all four previously-missing facts:
  (a) the Sanity Studio lint + build gate runs as a blocking step (`npm ci --prefix sanity`, then `npm --prefix sanity run lint`, then `npm --prefix sanity run build`);
  (b) `npm run typecheck` (astro check) runs as its own blocking gate BEFORE the first build;
  (c) the static-artifact verifier (`npm run test:artifact`) runs TWICE — once against the root-base build, once against the GitHub-Pages-base build with `EXPECTED_BASE: /ajs-website/`;
  (d) Playwright browser install is scoped to `chromium webkit` only, matching the two configured Playwright projects (`chromium` + `webkit-mobile`, confirmed in playwright.config.ts) — no Firefox.
  Also mention the caching added in Task 1 (Playwright browser-binary cache via actions/cache and the shared npm-download cache now covering the sanity/ lockfile), since it is now part of the real pipeline. Reflect that the Vitest step is `test:coverage` (unit tests with coverage thresholds) as a blocking gate, not just plain unit tests. Keep the existing "Triggered on push to main and on repository_dispatch (sanity-content-published)" trigger note. Keep the whole thing accurate to the actual file — the ordering is: checkout → setup-node (cache: npm, both lockfiles) → npm ci → npm ci --prefix sanity → Sanity lint+build → typecheck → build (root base, test artifact) → verify root artifact → cache+install Playwright browsers (chromium webkit) → Playwright e2e → Vitest coverage → build (GitHub Pages base, ASTRO_BASE=/ajs-website/) → un-prefixed-link grep guard → verify GitHub Pages artifact → upload → deploy. If a single table cell reads awkwardly at this length, you may keep it as an arrow-flow in the cell (as it is today) or move the fuller description to a short prose paragraph immediately after the table — pick whichever reads cleaner; do not change any other table row. Do not edit any code fences or add literals that other gates negative-grep.
  </action>
  <verify>
    <automated>grep -q "prefix sanity" CLAUDE.md && grep -q "typecheck" CLAUDE.md && grep -qi "test:artifact" CLAUDE.md && grep -q "chromium" CLAUDE.md && grep -q "webkit" CLAUDE.md && echo CLAUDE_FACTS_PRESENT</automated>
    <automated>grep -qi "EXPECTED_BASE" CLAUDE.md && echo TWICE_ARTIFACT_NOTED</automated>
  </verify>
  <done>CLAUDE.md's GitHub Actions description reflects the real deploy.yml ordering and includes the Sanity lint+build gate, the typecheck gate before the first build, the twice-run test:artifact (root base + GitHub Pages base with EXPECTED_BASE), the chromium+webkit-only Playwright scope, and the new caching; no Firefox is claimed; the repository_dispatch trigger note is preserved; no other table row is altered.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| CI runner → third-party GitHub Action | Cache/checkout/setup-node/deploy actions execute in the CI environment |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-ntd-01 | Tampering | Cache poisoning of `~/.cache/ms-playwright` | low | accept | GitHub Actions cache is scoped to the repo and keyed on the OS + package-lock.json hash; no cross-repo write access. No new secrets exposed. |
| T-ntd-02 | Tampering | New action dependency (`actions/cache@v4`) | low | accept | `actions/cache` is a first-party GitHub-maintained action, already the ecosystem standard; no new npm/pip/cargo package is installed by this change (no package-manager install tasks in this plan). |
</threat_model>

<verification>
After both tasks:
- `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/deploy.yml'))"` — deploy.yml is well-formed YAML.
- Read-through of deploy.yml confirming: cache step is scoped to the right path (`~/.cache/ms-playwright`) with the right key, placed before the Playwright install/e2e steps; setup-node covers both lockfiles; every pre-existing gate is intact and in the same order.
- `npm run typecheck && npm run test:unit && npm run build` — confirms nothing else broke (these run the same gates CI runs, minus the browser download).
</verification>

<success_criteria>
- deploy.yml caches Playwright browser binaries and reuses them on cache hit (skipping the download, still installing OS deps), and the sanity/ install shares the npm-download cache via the extended cache-dependency-path.
- No existing CI gate is removed, reordered, or weakened; YAML is valid; local `typecheck && test:unit && build` all pass.
- CLAUDE.md's GitHub Actions description is accurate to the edited deploy.yml, including the four previously-missing facts and the new caching.
</success_criteria>

<output>
Create `.planning/quick/260727-ntd-ci-architecture-improvements-add-playwri/260727-ntd-SUMMARY.md` when done.
</output>
