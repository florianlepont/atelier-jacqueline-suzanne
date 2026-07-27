---
phase: quick-260727-mvx
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - package.json
  - package-lock.json
  - sanity/package.json
  - sanity/package-lock.json
autonomous: true
requirements:
  - GHSA-4g3v-8h47-v7g6   # Astro reflected XSS via View Transition animation properties
  - npm-audit-transitive  # root + sanity dev/build-time transitive advisories
must_haves:
  truths:
    - "npm audit no longer reports GHSA-4g3v-8h47-v7g6 (Astro XSS) in the root project"
    - "Astro resolves to a 7.x version >= 7.1.4 (never 8.x)"
    - "Full root verification suite (typecheck, unit, build, e2e) is green after all dependency changes"
  artifacts:
    - package.json
    - package-lock.json
  key_links:
    - "View Transitions in HomeCarousel.astro and DetailHero.astro survive the Astro bump (full e2e suite covers view-transition behavior)"
---

<objective>
Clear two confirmed dependency-security findings from a codebase audit (findings already verified — do NOT re-audit):

1. **Astro XSS advisory (GHSA-4g3v-8h47-v7g6)** — bump the exact-pinned `astro@7.0.6` to `^7.1.4`, staying on the 7.x line (never a major bump). This project uses View Transitions heavily (`HomeCarousel.astro`, `DetailHero.astro` via `viewTransitionName`), so the fix must be proven with the full e2e suite green.
2. **Transitive dev/build-time advisories** — run non-force `npm audit fix` in the root and in the `sanity/` subproject. These are build-tooling-only exposures (GitHub Actions runner + Sanity Studio dev/build), never shipped to browsers. A non-force fix is free; whatever npm can't resolve without `--force` is an acceptable remainder to report, not to force.

Purpose: Remove the moderate-severity XSS advisory and reduce transitive noise with zero behavior change and zero major-version jumps.
Output: Updated `package.json` / `package-lock.json` (root) and, if npm changes them, `sanity/package.json` / `sanity/package-lock.json`, with all verification gates green.
</objective>

<execution_context>
@/home/user/ajs-website/.claude/gsd-core/workflows/execute-plan.md
@/home/user/ajs-website/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@./CLAUDE.md
@package.json
@sanity/package.json
@playwright.config.ts

Notes for the executor:
- Root deps deliberately stay on Astro 7.x (see CLAUDE.md — static-only OVH/GitHub Pages build). Do NOT jump to Astro 8.x.
- `playwright.config.ts` defines two projects: `chromium` (owns the full suite incl. visual + view-transition specs) and `webkit-mobile` (smoke-only, `**/*.smoke.spec.ts`). The full `npx playwright test` run exercises both and is the sufficient view-transition regression gate.
- Do NOT add any new package. Both fixes only change versions of already-vetted dependencies — no package-legitimacy checkpoint is required.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Bump Astro to a patched 7.x and update the root lockfile</name>
  <files>package.json, package-lock.json</files>
  <action>
    In root `package.json`, change the `dependencies.astro` value from the exact pin `"7.0.6"` to the caret range `"^7.1.4"`. The caret range resolves to the latest 7.x (>=7.1.4 <8.0.0), which satisfies "latest 7.x, whichever is safer" while structurally preventing an 8.x major jump. Then run `npm install` (NOT `npm install astro@...`, so the whole tree reconciles consistently) to update `package-lock.json`. Do not touch any other dependency in this task.
  </action>
  <verify>
    <automated>npm ls astro 2>/dev/null | grep -Eq 'astro@7\.(1\.[4-9]|[2-9])' && (npm audit 2>&1 | grep -q 'GHSA-4g3v-8h47-v7g6' && echo FAIL-ADVISORY-STILL-PRESENT || echo PASS-ADVISORY-CLEARED)</automated>
  </verify>
  <done>Root `astro` is a 7.x version >= 7.1.4 (never 8.x), `package-lock.json` is updated, and `npm audit` output no longer contains GHSA-4g3v-8h47-v7g6.</done>
</task>

<task type="auto">
  <name>Task 2: Non-force npm audit fix in root and sanity subproject</name>
  <files>package.json, package-lock.json, sanity/package.json, sanity/package-lock.json</files>
  <action>
    Run `npm audit fix` (non-force — NEVER pass `--force`, which can bump majors unexpectedly) in the repo root. Then run `npm --prefix sanity audit fix` (also non-force) for the `sanity/` subproject. These target transitive build-tooling advisories only (root: postcss, svgo, brace-expansion; sanity: adm-zip, dompurify, tar, postcss). If a fix changes nothing in either location because the advisory is nested too deep for npm to resolve without `--force`, that is an ACCEPTABLE outcome — record what remains rather than forcing it. Capture, for the SUMMARY, the before/after `npm audit` counts for both locations and which advisories (if any) remain. If — and only if — the sanity audit-fix modified `sanity/package.json` or `sanity/package-lock.json`, verify the subproject still builds and lints (this is what CI runs for sanity).
  </action>
  <verify>
    <automated>git --no-pager diff --stat -- package.json package-lock.json sanity/package.json sanity/package-lock.json; if ! git diff --quiet -- sanity/; then npm --prefix sanity run lint && npm --prefix sanity run build; else echo "sanity unchanged — subproject verify skipped"; fi</automated>
  </verify>
  <done>Non-force audit fixes have run in both locations; any residual (non-force-resolvable) advisories are documented in the SUMMARY; and if sanity files changed, `sanity` lint + build pass.</done>
</task>

<task type="auto">
  <name>Task 3: Full root verification suite on the final dependency tree</name>
  <files>(no source changes — verification only)</files>
  <action>
    With both dependency changes in place, run the full root verification suite exactly as CI does, in order, so a single run validates the combined tree: `npm run typecheck` (astro check), then `npm run test:unit` (Vitest — or `npm run test:coverage`), then `npm run build`, then `npx playwright test` (full suite — chromium full run + webkit-mobile smoke). The Playwright run is the view-transition regression gate: green confirms the Astro bump did not break the morph/transition behavior in `HomeCarousel.astro` / `DetailHero.astro`. If any gate fails, stop and report the failure with output rather than patching around it — the orchestrator re-verifies independently before merge.
  </action>
  <verify>
    <automated>npm run typecheck && npm run test:unit && npm run build && npx playwright test</automated>
  </verify>
  <done>typecheck, unit tests, build, and the full Playwright e2e suite all pass on the post-remediation dependency tree.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| npm registry → local/CI install | Version bumps of existing, already-vetted dependencies (no new packages introduced) |
| Astro build → browser | View Transition animation properties rendered into the static output (the GHSA-4g3v-8h47-v7g6 XSS surface) |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-mvx-01 | Information Disclosure | Astro View Transition animation properties (unescaped) | medium | mitigate | Bump astro to >=7.1.4 (Task 1); confirm advisory cleared via `npm audit` |
| T-mvx-02 | Tampering | Root transitive build tooling (postcss/svgo/brace-expansion) | low | mitigate | Non-force `npm audit fix` (Task 2); build/CI-only exposure, not shipped to browsers |
| T-mvx-03 | Tampering | Sanity Studio dev/build tooling (adm-zip/dompurify/tar/postcss) | low | mitigate | Non-force `npm --prefix sanity audit fix` (Task 2); dev/build-only exposure |
| T-mvx-SC | Tampering | npm installs | low | accept | Bumps only change versions of existing vetted deps; no new packages added, so no legitimacy checkpoint required. Residual advisories npm cannot resolve without `--force` are accepted and reported, not force-resolved. |
</threat_model>

<verification>
- Root: `npm run typecheck`, `npm run test:unit` (or `test:coverage`), `npm run build`, `npx playwright test` (full) — all green.
- Sanity (only if audit-fix touched it): `npm --prefix sanity run lint` and `npm --prefix sanity run build` — both pass.
- `npm audit` no longer lists GHSA-4g3v-8h47-v7g6.
- `package.json` shows `astro` on a 7.x caret range (`^7.1.4`), never 8.x.
</verification>

<success_criteria>
- Astro XSS advisory GHSA-4g3v-8h47-v7g6 is gone from `npm audit`, with Astro on a patched 7.x version.
- Non-force audit fixes applied in root and sanity; any residual advisories documented (not forced).
- Full verification suite green; View Transitions behavior intact.
- No new packages added; no major version jumps.
</success_criteria>

<output>
Create `.planning/quick/260727-mvx-dependency-security-remediation-bump-ast/260727-mvx-SUMMARY.md` when done, including the before/after `npm audit` counts for both root and sanity and any residual advisories left unresolved.
</output>
