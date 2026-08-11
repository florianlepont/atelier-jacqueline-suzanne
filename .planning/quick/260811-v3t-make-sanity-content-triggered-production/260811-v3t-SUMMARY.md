---
phase: quick-260811-v3t
plan: 1
subsystem: infra
tags: [github-actions, ci-cd, ovh, sftp, sanity-webhook]

requires:
  - phase: 05-launch-domain-cutover
    provides: deploy-ovh.yml (manual, workflow_dispatch-only, D-02 approval gate), production-ovh GitHub Environment with Required reviewer, OVH_SFTP_PASSWORD environment secret
provides:
  - deploy-ovh.yml now also triggers on the Sanity sanity-content-published repository_dispatch, fanning the same webhook that already rebuilds GitHub Pages staging out to production too
  - trigger-conditional environment.name on the deploy job — production-ovh-auto (no reviewer) for Sanity-triggered runs, production-ovh (Required reviewer) for every other trigger
  - Guard: SFTP credentials are present step as the deploy job's first step, failing loudly before any SFTP push if the resolved environment's secret is empty
affects: [05-launch-domain-cutover, any future phase touching deploy-ovh.yml or the OVH production deploy path]

tech-stack:
  added: []
  patterns:
    - "Trigger-conditional GitHub Environment name (`environment.name: ${{ github.event_name == '...' && 'envA' || 'envB' }}`) is the only mechanism to make an approval gate conditional per-trigger, since protection rules are a property of the environment, not the job."

key-files:
  created: []
  modified:
    - .github/workflows/deploy-ovh.yml
    - tests/unit/deploy-ovh-workflow.test.ts
    - README.md
    - .planning/phases/05-launch-domain-cutover/05-CONTEXT.md

key-decisions:
  - "D-01 superseded in part for content-only auto-deploys: Sanity publishes now reach production with no human approval, because the non-technical maintainer (Romane) has no GitHub access. Manual/dispatch-triggered production deploys still require the D-02 Required-reviewer approval; a code commit to `main` still deploys only to GitHub Pages staging. Recorded as a dated sub-bullet beneath D-01's original verbatim text in 05-CONTEXT.md."
  - "Two GitHub Environments are required (production-ovh, production-ovh-auto) because environment protection rules cannot be made conditional within a single environment, and environment secrets do not carry across environments."

patterns-established:
  - "Guard: SFTP credentials are present — env-var (not literal password:) emptiness check as the first step of a deploy job, converting a missing environment secret into a loud ::error:: instead of an opaque unauthenticated-SFTP failure."

requirements-completed: [QUICK-260811-v3t]

coverage:
  - id: D1
    description: "deploy-ovh.yml triggers automatically on the Sanity sanity-content-published webhook (mirroring deploy.yml) while retaining workflow_dispatch, with no branch-push trigger added"
    requirement: "QUICK-260811-v3t"
    verification:
      - kind: unit
        ref: "tests/unit/deploy-ovh-workflow.test.ts#triggers on manual dispatch and on the Sanity content webhook, never on a code commit to main (D-01 as superseded)"
        status: pass
    human_judgment: false
  - id: D2
    description: "the deploy job's environment.name is a trigger-conditional expression selecting production-ovh-auto (no reviewer) for repository_dispatch runs and production-ovh (Required reviewer) for every other trigger"
    requirement: "QUICK-260811-v3t"
    verification:
      - kind: unit
        ref: "tests/unit/deploy-ovh-workflow.test.ts#applies the human-approval environment to every trigger except the Sanity webhook (D-01 supersession)"
        status: pass
    human_judgment: false
  - id: D3
    description: "a Guard: SFTP credentials are present step is the deploy job's first step and fails the run with an explicit error before any SFTP upload if the resolved environment's OVH_SFTP_PASSWORD is empty"
    requirement: "QUICK-260811-v3t"
    verification:
      - kind: unit
        ref: "tests/unit/deploy-ovh-workflow.test.ts#fails loudly when the resolved environment has no SFTP secret, before any upload is attempted"
        status: pass
    human_judgment: false
  - id: D4
    description: "an actual GitHub Actions run of the Sanity-triggered production path completes end-to-end (environment resolves correctly, guard passes, SFTP push succeeds) once the production-ovh-auto environment and its secret exist"
    human_judgment: true
    rationale: "Requires the human GitHub-dashboard prerequisite (production-ovh-auto environment + duplicated OVH_SFTP_PASSWORD secret) to exist first, and a live GitHub Actions run against the real Sanity webhook and real OVH host — cannot be proven by a source-level unit test or from this sandboxed environment. First real Sanity-triggered production run is the actual proof."

duration: 9min
completed: 2026-08-11
status: complete
---

# Quick Task 260811-v3t: Sanity-Triggered Production Deploy Summary

**deploy-ovh.yml now auto-deploys production on the Sanity `sanity-content-published` webhook via a trigger-conditional `environment.name` (unprotected `production-ovh-auto` vs. reviewer-gated `production-ovh`), with a new credential guard as the deploy job's first step — manual and code-push deploy behavior is unchanged.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-08-11T22:31:37+02:00
- **Completed:** 2026-08-11T22:39:41+02:00
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Rewrote the workflow's structural-invariant test suite (RED → GREEN): retired the old "manual-dispatch-only" D-01 test and replaced it with three invariants covering the new trigger surface, the trigger-conditional approval gate, and the credential guard's position — every other pre-existing assertion in the 15-test file was left byte-identical.
- Added `repository_dispatch: types: [sanity-content-published]` to `deploy-ovh.yml` alongside the existing `workflow_dispatch`, mirroring `deploy.yml`'s trigger verbatim — no branch-push trigger was added, so a code commit to `main` still never reaches production.
- Made the `deploy` job's `environment.name` a trigger-conditional expression: `production-ovh-auto` (no Required reviewer) for `repository_dispatch` runs, `production-ovh` (Required reviewer, D-02) for everything else. The `build` job's step list (every blocking gate: Sanity Studio lint/build, typecheck, artifact verification, Playwright e2e, Vitest coverage) is byte-identical to before — confirmed by diffing the file.
- Added a `Guard: SFTP credentials are present` step as the deploy job's very first step, failing the run with an explicit `::error::` (naming both possible environments and the `gh secret set ... --env production-ovh-auto` fix command) before any SFTP action can attempt an unauthenticated connection.
- Documented both production paths in README's `## Deployments` section (new "Production deploy: the two paths" subsection, updated trigger table cell, extended one-time-setup list with the new environment/secret step), fixed a stale "Production cutover... is Phase 5" sentence in the trailing `## Deployment` section, and recorded a dated D-01 supersession sub-bullet in `05-CONTEXT.md` directly beneath D-01's untouched original text.

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite the workflow's trigger/approval invariants as failing tests (RED)** - `26a94c7` (test)
2. **Task 2: Trigger deploy-ovh.yml on the Sanity webhook with a trigger-conditional approval gate (GREEN)** - `f6dd11d` (feat)
3. **Task 3: Document the two production paths in README and record the D-01 supersession** - `3af94aa` (docs)

_TDD gate sequence for Task 1→2: test(...) commit `26a94c7` precedes feat(...) commit `f6dd11d` — RED then GREEN, as required. No refactor commit was needed._

## Files Created/Modified
- `.github/workflows/deploy-ovh.yml` - Added the Sanity webhook trigger, the trigger-conditional `environment.name`, the new credential guard step, and a rewritten header/environment comment; `build` job step list left byte-identical
- `tests/unit/deploy-ovh-workflow.test.ts` - Replaced the retired manual-dispatch-only test with three new invariants (trigger surface, conditional gate, guard position); renamed one unrelated test's parenthetical
- `README.md` - New "Production deploy: the two paths" subsection, updated trigger table cell, extended one-time-setup list, fixed a stale sentence in the trailing `## Deployment` section
- `.planning/phases/05-launch-domain-cutover/05-CONTEXT.md` - Added a dated D-01 supersession sub-bullet beneath D-01's verbatim original text

## Decisions Made
- Kept both production-ovh (manual) and production-ovh-auto (Sanity-triggered) as separate GitHub Environments rather than trying to make one environment's protection rules conditional — GitHub Environment protection rules are a per-environment property with no `if:`-style override at the job level, so two environments is the only mechanism (confirmed via the plan's `<interface_context>` before writing any code).
- The credential guard checks the env var's emptiness (`env: OVH_SFTP_PASSWORD: ${{ secrets.OVH_SFTP_PASSWORD }}` then `[ -z "$OVH_SFTP_PASSWORD" ]`) rather than a lowercase `password:` key, satisfying the existing unit test's requirement that every lowercase `password:` line reference `secrets.` without adding a third one.

## Deviations from Plan

None — plan executed exactly as written. One environment-setup gap was closed (not a plan deviation): `sanity/node_modules` was never installed in this worktree, causing `npm run test:unit` to fail on an unrelated pre-existing file (`sanity/editorial/dashboardLogic.ts`, committed before this task, untouched by it). Ran `npm ci --prefix sanity` to install the already-declared lockfile dependencies (not a new/speculative package — matches the CI pipeline's own `npm ci --prefix sanity` step documented in CLAUDE.md) so the full unit suite could actually run and be verified green, per this task's own done criteria. No source files were touched to achieve this; `sanity/node_modules` remains gitignored and untracked.

## Issues Encountered
None beyond the `sanity/node_modules` gap above, which was a local dev-environment install gap, not a code issue.

## User Setup Required

**A GitHub-dashboard prerequisite is NOT yet done and blocks the first automatic run.** The `production-ovh-auto` GitHub Environment (with NO required reviewer) and its own copy of the `OVH_SFTP_PASSWORD` secret must be created before the first Sanity-triggered production deploy will succeed:

1. Create Environment `production-ovh-auto` under repo Settings → Environments, leaving Deployment protection rules empty (no required reviewer) — this is what makes Sanity-content runs skip the approval pause.
2. Copy the SFTP secret onto it: `gh secret set OVH_SFTP_PASSWORD --env production-ovh-auto` (same value already stored on `production-ovh`, sourced from OVH Control Panel → Web Cloud → Hosting plans → atelihu → FTP - SSH).

Until both steps are done, the first Sanity-triggered production run will fail fast and loudly at the new `Guard: SFTP credentials are present` step (an explicit `::error::` naming the fix command) rather than silently attempting an unauthenticated SFTP push. This is the intended fail-safe behavior, not a bug — no code deploy is affected either way, since manual `workflow_dispatch` runs continue to resolve to the already-configured `production-ovh` environment untouched.

## Next Phase Readiness
- Code and tests are complete and merged into `main` on this worktree; the workflow change is inert (falls back to manual-only behavior) until the human sets up `production-ovh-auto`, so there is no regression risk in the interim.
- Once the environment/secret prerequisite above is done, the very next Sanity Studio publish will be the first real end-to-end proof of the automatic path (tracked as deliverable D4 in this summary's coverage block, `human_judgment: true`).

---
*Phase: quick-260811-v3t*
*Completed: 2026-08-11*

## Self-Check: PASSED

All created/modified files verified present on disk; all three task commit hashes (`26a94c7`, `f6dd11d`, `3af94aa`) verified present in git history.
