---
phase: quick-260813-nyq-remove-the-one-time-sftp-workaround-step
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - .github/workflows/deploy-ovh.yml
autonomous: true
requirements:
  - QUICK-260813-NYQ

must_haves:
  truths:
    - "The `deploy` job in deploy-ovh.yml goes directly from the 'Download build artifact' step to the 'Deploy dist to OVH (SFTP)' step, with no intervening cleanup step."
    - "No comment, env var, or shell invocation related to the removed one-time cleanup step remains anywhere in deploy-ovh.yml."
    - "The two real SFTP upload steps (dist upload, .htaccess upload) and every other existing step are byte-for-byte unchanged."
    - "npm run typecheck and npx vitest run both pass unchanged after the edit."
  artifacts:
    - path: ".github/workflows/deploy-ovh.yml"
      provides: "Production OVH deploy workflow with the one-time launch-window SFTP cleanup step removed; the deploy job is back to its steady-state shape (credentials guard -> download artifact -> two SFTP uploads -> completion summary)."
  key_links:
    - from: "deploy job: Download build artifact step"
      to: "deploy job: Deploy dist to OVH (SFTP) step"
      via: "Direct step sequence with no cleanup step in between"
      pattern: "Download build artifact"
---

<objective>
Delete the one-time SFTP pre-upload cleanup step from `.github/workflows/deploy-ovh.yml`'s `deploy` job — the step added in plan 05-05 (commit `54cd8c9`, env-var bug fixed in `b550b9e`) to remove OVH's pre-provisioned default webroot file that was blocking the first production SFTP upload after the Multisite domain attachment.

Purpose: that stale file no longer exists — the real production deploy (GitHub Actions run `31525572071`) already overwrote the webroot, and phase 5's post-cutover verification (`05-CUTOVER-LOG.md`) independently re-confirmed the live site has been stable for two days with no drift. `05-CUTOVER-LOG.md`'s own Follow-ups section already frames this exact removal as safe, ready-to-do cleanup — not an open bug. Leaving a dead one-time workaround in a production deploy pipeline is unnecessary residual complexity and an unnecessary (if `continue-on-error`-guarded) credential-touching command in every future run.

Output: `deploy-ovh.yml` with the cleanup step and its explanatory comment block fully removed; the `deploy` job's remaining steps (SFTP credentials guard, artifact download, the two real SFTP uploads, completion summary) untouched and unchanged; `npm run typecheck` and `npx vitest run` both still green.
</objective>

<execution_context>
@.claude/gsd-core/workflows/execute-plan.md
@.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.github/workflows/deploy-ovh.yml
@.planning/phases/05-launch-domain-cutover/05-05-SUMMARY.md
@.planning/phases/05-launch-domain-cutover/05-CUTOVER-LOG.md
@tests/unit/deploy-ovh-workflow.test.ts

<facts_verified_at_planning_time>
- The step to remove lives in the `deploy` job of `.github/workflows/deploy-ovh.yml`, immediately after the "Download build artifact" step and immediately before the "Deploy dist to OVH (SFTP)" step. It consists of an 11-line explanatory comment block (opening `# One-time launch workaround (2026-08-11):`) followed by a step named for a one-time cleanup of OVH's default provisioned webroot file, which installs `sshpass` via `apt-get` and runs a plain `sftp` heredoc (`ls -la` then `rm`) against the one known stale path, gated with `continue-on-error: true`.
- `tests/unit/deploy-ovh-workflow.test.ts` (the only test file that does text-assertion checks against `deploy-ovh.yml`'s raw source) contains no assertion referencing this step, `sshpass`, `SSHPASS`, or the stale-index.html cleanup — confirmed by direct read. It only counts `wlixcc/SFTP-Deploy-Action` references (expects exactly 2, matching the two real SFTP-Deploy-Action uploads this plan does not touch), so removing this step does not change that count.
- `tests/unit/deployment.test.ts` is unrelated — it tests `sanity/editorial/deployment.ts`'s pure state-machine logic, not the workflow YAML's content — confirmed by direct read. No change needed there.
- 05-05-SUMMARY.md's own "Deviations from Plan" item 2/3 and "Next Phase Readiness" explicitly flag this step as safe to delete once a future deploy confirms the stale file is gone for good; 05-CUTOVER-LOG.md's "Follow-ups" section restates the same, framed as ready cleanup rather than an open defect.
</facts_verified_at_planning_time>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove the one-time SFTP cleanup step from deploy-ovh.yml</name>
  <files>.github/workflows/deploy-ovh.yml</files>
  <action>
Open the `deploy` job in `.github/workflows/deploy-ovh.yml`. Delete the entire block that sits between the "Download build artifact" step and the "Deploy dist to OVH (SFTP)" step: this is the multi-line explanatory comment (dated 2026-08-11, explaining the OVH-provisioned default webroot file and why the cleanup is one-time and `continue-on-error`) together with the step it documents — the step that installs a password-based SFTP CLI helper via the package manager and runs a plain SFTP heredoc to delete one known stale remote path. Remove the whole block including its leading and trailing blank lines so that, after the edit, the "Download build artifact" step is followed by exactly one blank line and then directly by the comment introducing "Deploy dist to OVH (SFTP)" (the one currently starting "Pinned to the immutable commit SHA (v1.2.6)...").

Do not modify the "Guard: SFTP credentials are present" step, the "Download build artifact" step, either of the two "Deploy ... to OVH (SFTP)" steps (dist upload and `.htaccess` upload), the "Deploy complete" step, or anything in the `build` job — every other line of the file must remain byte-for-byte identical. Do not add a replacement comment or placeholder; the deletion is total.
  </action>
  <verify>
    <automated>test "$(grep -c 'One-time launch workaround' .github/workflows/deploy-ovh.yml)" -eq 0 && test "$(grep -c 'sshpass' .github/workflows/deploy-ovh.yml)" -eq 0 && test "$(grep -c 'SSHPASS' .github/workflows/deploy-ovh.yml)" -eq 0 && npx vitest run tests/unit/deploy-ovh-workflow.test.ts</automated>
  </verify>
  <done>deploy-ovh.yml no longer contains any trace of the removed step (no `sshpass`/`SSHPASS`/its explanatory comment); the "Download build artifact" step is immediately followed by the "Deploy dist to OVH (SFTP)" step; every other step in the file is unchanged; `tests/unit/deploy-ovh-workflow.test.ts` still passes with all its existing assertions (including the exactly-2 SFTP-Deploy-Action-reference count).</done>
</task>

<task type="auto">
  <name>Task 2: Full-suite regression check</name>
  <files>.github/workflows/deploy-ovh.yml</files>
  <action>
Run the project's full typecheck and unit-test gates to confirm the workflow-file edit introduced no regression anywhere else in the repo (no other test references the removed step, per the facts verified at planning time, but this is the final confirming gate before calling the task done).
  </action>
  <verify>
    <automated>npm run typecheck && npx vitest run</automated>
  </verify>
  <done>Both `npm run typecheck` and `npx vitest run` exit 0 with no failing tests.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| GitHub Actions runner -> OVH SFTP host | The `deploy` job authenticates to `ftp.cluster129.hosting.ovh.net` using the `OVH_SFTP_PASSWORD` secret; this plan removes one of the commands that previously handled that secret. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-QUICK-260813-NYQ-01 | Information Disclosure | Removed cleanup step's `sshpass`/`SSHPASS` credential handling | low | mitigate | This plan deletes the step outright, which is a net reduction in attack surface: one fewer place in the pipeline installs a third-party package (`sshpass` via `apt-get`) and passes the SFTP password through a shell-visible env var. No new credential path is introduced. |
| T-QUICK-260813-NYQ-02 | Tampering | `deploy-ovh.yml` deploy job step ordering | low | mitigate | `tests/unit/deploy-ovh-workflow.test.ts`'s existing assertions (SFTP-Deploy-Action reference count, credentials-guard ordering, `.htaccess` explicit-path upload, `sftp_only`/no `delete_remote_files`) all continue to pass unchanged, proving the two real upload steps and their guards were not disturbed by the deletion. |
| T-QUICK-260813-NYQ-SC | Tampering | npm/pip/cargo installs | n/a | accept | No package install or dependency change is part of this plan — pure deletion of a workflow step. |
</threat_model>

<verification>
- `.github/workflows/deploy-ovh.yml` contains no reference to the removed step, `sshpass`, or `SSHPASS`.
- The `deploy` job's step order is: Guard (SFTP credentials present) -> Download build artifact -> Deploy dist to OVH (SFTP) -> Deploy .htaccess to OVH (SFTP, dotfile) -> Deploy complete.
- `tests/unit/deploy-ovh-workflow.test.ts` passes unchanged (no edits made to it, per planning-time confirmation it asserts nothing about the removed step).
- `npm run typecheck` passes.
- `npx vitest run` passes (full suite).
</verification>

<success_criteria>
- The one-time SFTP workaround step and its explanatory comment are fully gone from `deploy-ovh.yml`.
- No other step, job, or file changed.
- `npm run typecheck` and `npx vitest run` both pass.
</success_criteria>

<source_audit>

| Source | ID | Feature / constraint | Task | Status | Notes |
|--------|-----|----------------------|------|--------|-------|
| GOAL | — | Remove the now-obsolete one-time SFTP workaround step from deploy-ovh.yml | 1 | COVERED | Direct deletion per task 1. |
| REQ | QUICK-260813-NYQ | Pure deletion scoped to deploy-ovh.yml only; no other step touched | 1, 2 | COVERED | Task 1 scopes the edit precisely; task 2 proves no collateral regression. |
| RESEARCH | n/a | Quick-task mode; no RESEARCH.md produced for this task | — | N/A | Not applicable — quick mode skips the research phase. |
| CONTEXT | (constraints passed directly in planning_context) | Only deploy-ovh.yml changes as source; deployment.test.ts untouched unless it asserts on the workaround (it doesn't); no DNS/TTL changes; typecheck + vitest must pass | 1, 2 | COVERED | Confirmed via direct read that deployment.test.ts and deploy-ovh-workflow.test.ts assert nothing about the removed step; DNS/TTL untouched (out of scope, not referenced by any task). |

</source_audit>

<output>
Create `.planning/quick/260813-nyq-remove-the-one-time-sftp-workaround-step/SUMMARY.md` when done.
</output>
