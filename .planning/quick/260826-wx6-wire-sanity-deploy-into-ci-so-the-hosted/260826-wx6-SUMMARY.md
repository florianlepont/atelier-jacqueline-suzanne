---
phase: quick-260826-wx6
plan: 01
subsystem: infra
tags: [github-actions, sanity, ci-cd, deploy]

requires: []
provides:
  - "Automatic hosted Sanity Studio publish as the final step of .github/workflows/deploy.yml"
  - "Regression test coverage locking the step's presence, ordering, and secret usage"
  - "README documentation of the auto-publish mechanism and one-time SANITY_AUTH_TOKEN setup"
affects: [deploy-pipeline, sanity-studio, ci-cd]

tech-stack:
  added: []
  patterns:
    - "Step-level `if:` conditions must reference only non-secrets context (github.event_name); secret presence checks happen inside the run: shell script instead."
    - "Warn-and-skip (::warning:: + exit 0) for a not-yet-configurable secret, vs. fail-loud for an already-required one — same file now has both patterns side by side (SFTP guard vs. Studio publish) with the divergence documented inline."

key-files:
  created: []
  modified:
    - .github/workflows/deploy.yml
    - tests/unit/deploy-ovh-workflow.test.ts
    - README.md

key-decisions:
  - "D-01 (locked, plan-level): Studio publish is the LAST step of build-and-deploy, after Deploy to GitHub Pages, so it inherits every blocking gate for free."
  - "D-02 (locked, plan-level): triggers on every push to main (no sanity/** paths filter), never on repository_dispatch, to avoid reintroducing the staleness class this step removes."
  - "D-03 (locked, plan-level): missing SANITY_AUTH_TOKEN warns and exits 0 rather than failing the run, since the secret cannot exist until this workflow change has already landed; a present-but-failing token still fails the run."

patterns-established:
  - "New deploy.yml steps get a comment block explaining what gap they close, referencing the specific debug session, and any deliberate divergence from an existing sibling pattern in the same file."

requirements-completed: [CI-01]

coverage:
  - id: D1
    description: "deploy.yml publishes the hosted Sanity Studio as the final step of build-and-deploy, gated behind push and every blocking gate, authenticated via a secrets-mapped env var, and warns-not-fails when the token is absent"
    requirement: "CI-01"
    verification:
      - kind: unit
        ref: "tests/unit/deploy-ovh-workflow.test.ts#publishes the hosted Sanity Studio as the final step, gated behind push and every blocking gate (D-01, D-02)"
        status: pass
      - kind: unit
        ref: "tests/unit/deploy-ovh-workflow.test.ts#does not weaken any pre-existing blocking gate when the Studio publish step is added"
        status: pass
    human_judgment: false
  - id: D2
    description: "README documents the automatic Studio publish, its push-only trigger and rationale, the re-run escape hatch, the missing-secret failure mode, and the one-time SANITY_AUTH_TOKEN setup"
    requirement: "CI-01"
    verification:
      - kind: other
        ref: "grep -c 'atelier-jacqueline-suzanne.sanity.studio' README.md (1) && grep -c 'SANITY_AUTH_TOKEN' README.md (2)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Florian creates the SANITY_AUTH_TOKEN repository secret and confirms a real CI run publishes the Studio end-to-end (Task 3, blocking human checkpoint)"
    requirement: "CI-01"
    verification:
      - kind: other
        ref: "CI run https://github.com/florianlepont/atelier-jacqueline-suzanne/actions/runs/33019231851 — 'Publish the hosted Sanity Studio' step logged 'Success! Studio deployed to https://atelier-jacqueline-suzanne.sanity.studio/', all other gates green"
        status: pass
    human_judgment: true
    rationale: "Creating a Sanity robot token and a GitHub repository secret requires credentialed dashboard access Claude does not have. This is a genuine external-setup step that only Florian can perform and confirm. First token attempt failed (Unauthorized — missing sanity.project/deployStudio, deploySchema grants; Editor role insufficient); reissued with Administrator-level permissions, then verified via a fresh CI run."

duration: ~25min
completed: 2026-08-26
status: complete
---

# Quick Task 260826-wx6: Wire Sanity Studio deploy into CI Summary

**Hosted Sanity Studio now auto-publishes as the final gated step of `deploy.yml`, closing the manual-deploy gap that caused a live 404 after the project rename.**

## Performance

- **Duration:** ~25 min
- **Completed:** 2026-08-26
- **Tasks:** 2 of 3 completed (Task 3 is a blocking human checkpoint — see below)
- **Files modified:** 3

## Accomplishments
- Added a new final step to `.github/workflows/deploy.yml`'s `build-and-deploy` job that runs `npm --prefix sanity run deploy` after the GitHub Pages deploy and every existing blocking gate (Studio lint/coverage/build/typecheck, root lint/typecheck, both artifact verifications, Playwright, Vitest coverage).
- Step is push-only (`github.event_name == 'push'`) and does not fire on the `sanity-content-published` `repository_dispatch` event, since a content publish cannot change Studio source.
- Missing `SANITY_AUTH_TOKEN` warns via a `::warning::` annotation and exits 0 rather than failing the run (deliberately different from the fail-loud SFTP guard in `deploy-ovh.yml`); a present-but-failing token still fails the run loudly.
- Added regression test coverage in the existing `describe('.github/workflows/deploy.yml', ...)` block of `tests/unit/deploy-ovh-workflow.test.ts` (plain-text/`indexOf` assertions, no new YAML-parser dependency) — confirmed RED against the unmodified workflow before implementing, then GREEN after.
- Documented the mechanism and its one-time `SANITY_AUTH_TOKEN` setup in `README.md`'s existing `## Deployments` section, without touching the pre-existing six-step OVH setup list.

## Task Commits

Each task was committed atomically:

1. **Task 1: Publish the hosted Sanity Studio as the final step of the staging pipeline**
   - `c1e7dcb` (test) — RED: failing assertions for the publish step, secret mapping, push-only trigger, and step ordering
   - `9710c53` (feat) — GREEN: the new `Publish the hosted Sanity Studio` step in `deploy.yml`
2. **Task 2: Document the automatic Studio publish and its one-time secret setup** - `c095e53` (docs)

**Plan metadata:** committed separately by the orchestrator (Step 8), not by this agent.

## Files Created/Modified
- `.github/workflows/deploy.yml` - New final step in `build-and-deploy`: publishes the hosted Studio, push-gated, secret-authenticated, warn-and-skip when the token is absent.
- `tests/unit/deploy-ovh-workflow.test.ts` - Two new assertions in the existing `deploy.yml` describe block: step presence/ordering/secret-mapping/trigger, and gate-integrity-unchanged.
- `README.md` - New `### Sanity Studio: published automatically` subsection under `## Deployments`, documenting trigger behavior, the re-run escape hatch, the missing-secret failure mode, and the one-time `SANITY_AUTH_TOKEN` setup.

## Decisions Made
- Followed the plan's three LOCKED decisions (D-01 placement, D-02 push-only trigger with no paths filter, D-03 warn-and-skip on missing secret) exactly as specified — none were re-litigated or found impossible during execution.
- Confirmed via `sanity/node_modules/.bin/sanity deploy --help` (pinned `sanity@6.6.0`, installed for this session) that no extra CLI flags were needed or should be added, per the plan's explicit instruction.

## Deviations from Plan

None - plan executed exactly as written for Tasks 1 and 2.

## Issues Encountered

None. `npm ci` and `npm ci --prefix sanity` were run locally (this worktree had no `node_modules`) to execute the test suite, lint, and confirm the pinned Sanity CLI's accepted flags — this was necessary tooling setup, not a deviation from plan content.

## User Setup Required

**Task 3 is a blocking human checkpoint that could not be completed by this agent.** Claude cannot create a Sanity API token or a GitHub repository secret — both require credentialed dashboard access. Florian must:

1. Create a new Sanity robot token at https://www.sanity.io/manage → project `gwz8iug4` → API → Tokens → Add API token (role: `Deploy Studio` if offered, else `Editor`; must be distinct from the existing read-only `SANITY_API_READ_TOKEN`).
2. Add it as a repository-level secret: `gh secret set SANITY_AUTH_TOKEN` (or via repo Settings → Secrets and variables → Actions).
3. Push these commits to `main` (or re-run the latest `deploy.yml` run from the Actions tab once the secret exists).
4. Confirm in the Actions tab: every existing gate still passes in order, and the final `Publish the hosted Sanity Studio` step ran without the missing-secret warning and completed successfully.
5. Open https://atelier-jacqueline-suzanne.sanity.studio/ and confirm `Voir sur le site` / `Ouvrir le site` lands on the live GitHub Pages site, not a 404.
6. Confirm the token value never appears in the run logs.

Full verbatim instructions are in `260826-wx6-PLAN.md` Task 3 `<how-to-verify>`.

## Next Phase Readiness
- All 3 tasks complete. Tasks 1 and 2 committed and verified (unit suite: 719/719 passing; lint: clean; YAML: valid, confirmed with `js-yaml`).
- Task 3 closed 2026-08-26: Florian created `SANITY_AUTH_TOKEN`, first attempt lacked the `deployStudio`/`deploySchema` grants (Unauthorized — Editor role insufficient), reissued with Administrator-level permissions. A fresh CI run (33019231851, triggered by empty commit `589587c` after a `--failed` rerun hit an unrelated GitHub Pages duplicate-artifact issue) confirmed every gate green including `Success! Studio deployed to https://atelier-jacqueline-suzanne.sanity.studio/`.
- Quick task fully closed. The staleness class that caused `preprod-site-404-after-rename` cannot recur silently.

---
*Phase: quick-260826-wx6*
*Completed: 2026-08-26*

## Self-Check: PASSED

- FOUND: `.github/workflows/deploy.yml`
- FOUND: `tests/unit/deploy-ovh-workflow.test.ts`
- FOUND: `README.md`
- FOUND: `.planning/quick/260826-wx6-wire-sanity-deploy-into-ci-so-the-hosted/260826-wx6-SUMMARY.md`
- FOUND commit: `c1e7dcb` (test)
- FOUND commit: `9710c53` (feat)
- FOUND commit: `c095e53` (docs)
