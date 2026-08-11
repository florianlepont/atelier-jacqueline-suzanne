---
phase: 05-launch-domain-cutover
plan: 03
subsystem: ci-cd
tags: [github-actions, deploy, sftp, ovh, workflow-dispatch, vitest]

# Dependency graph
requires:
  - phase: 05-launch-domain-cutover (plan 05-01, same wave)
    provides: "public/contact.php + hardened public/.htaccess — the dotfile this plan's dedicated SFTP step and dist-guard depend on"
  - phase: 05-launch-domain-cutover (plan 05-02, same wave)
    provides: "resolveContactEndpoint()/DEFAULT_CONTACT_ENDPOINT + PUBLIC_CONTACT_ENDPOINT env var contract — this plan wires the actual value into the GitHub Pages build"
provides:
  - ".github/workflows/deploy-ovh.yml — workflow_dispatch-only production deploy: build job (all staging gates + recap + ovh-dist artifact) and deploy job (environment: production-ovh gate + two pinned SFTP steps)"
  - "tests/unit/deploy-ovh-workflow.test.ts — 13 source-invariant CI assertions locking D-01/D-02 safety properties"
  - "PUBLIC_CONTACT_ENDPOINT: https://atelierjacquelinesuzanne.fr/contact.php wired into deploy.yml's GitHub Pages build step"
  - "README.md Deployments section documenting both targets and the OVH one-time setup"
affects: [05-05, 05-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "workflow_dispatch-only sibling workflow file (not a job added to the existing pipeline) to keep D-01's 'staging pipeline untouched' literally true"
    - "GitHub Environment `environment:` declaration on a job as the structural human-approval gate (D-02), rather than a manual pause/prompt step"
    - "Explicit second SFTP step with a literal dotfile path, because upload-artifact and SFTP glob expansion both silently drop dotfiles by default"
    - "Source-invariant text assertions over workflow YAML (no YAML parser dependency), mirroring tests/unit/contact-php.test.ts"

key-files:
  created:
    - .github/workflows/deploy-ovh.yml
    - tests/unit/deploy-ovh-workflow.test.ts
  modified:
    - .github/workflows/deploy.yml
    - README.md

key-decisions:
  - "Re-verified wlixcc/SFTP-Deploy-Action's tag->SHA mapping and action.yml input names live against the GitHub API before writing the workflow (gh api repos/wlixcc/SFTP-Deploy-Action/tags and /contents/action.yml): v1.2.6 is still the latest tag, SHA a5ccb9c6211a94cc59404f0fdb2a9936a6dfee64 matches the plan's interface_context exactly, and all input names (username, server, port, password, local_path, remote_path, sftp_only, delete_remote_files, etc.) match verbatim — no correction needed."
  - "Kept the pre-existing '## Deployment' (singular) section at the end of README.md untouched, per Task 3's 'additions only' acceptance criterion, even though the new '## Deployments' (plural) section now duplicates some of its content. Not fixed — out of this task's literal scope; flagged here for whoever next touches README.md."

patterns-established:
  - "Any future third-party GitHub Action with secrets in scope should be pinned to an immutable commit SHA with the human-readable tag in a trailing comment, re-verified live at write time rather than trusted from planning docs."

requirements-completed: [LAUNCH-01]

coverage:
  - id: D1
    description: "A production deploy to OVH can only start from a deliberate human action (workflow_dispatch only, no push/repository_dispatch trigger) — D-01"
    requirement: LAUNCH-01
    verification:
      - kind: unit
        ref: "tests/unit/deploy-ovh-workflow.test.ts — 'is manual-dispatch-only (D-01)' test"
        status: pass
    human_judgment: false
  - id: D2
    description: "The production build runs every blocking gate the staging pipeline runs (Sanity Studio lint/build, typecheck, static-artifact verification, Playwright e2e, Vitest coverage) before any file leaves the runner"
    requirement: LAUNCH-01
    verification:
      - kind: unit
        ref: "tests/unit/deploy-ovh-workflow.test.ts — 'runs every blocking gate the staging pipeline runs' test"
        status: pass
    human_judgment: false
  - id: D3
    description: "The deploy job is gated on a GitHub Environment requiring human approval (D-02) after a build recap is printed"
    requirement: LAUNCH-01
    verification:
      - kind: unit
        ref: "tests/unit/deploy-ovh-workflow.test.ts — 'gates the deploy job behind needs: build and an environment: approval gate' test"
        status: pass
      - kind: manual_procedural
        ref: "Cannot be exercised end-to-end until the production-ovh GitHub Environment + Required reviewer exists (user_setup prerequisite, not yet done) — deferred to plan 05-05's blocking checkpoint per RESEARCH.md assumption A5"
        status: unknown
    human_judgment: true
    rationale: "No automated check inside this sandboxed session can prove GitHub actually pauses the run for approval — that requires the real Environment to exist and a real workflow dispatch, both explicitly out of scope for this plan and reserved for 05-05."
  - id: D4
    description: "Every file in dist reaches the OVH webroot, including the dotfile .htaccess that a shell glob and upload-artifact would otherwise silently skip"
    requirement: LAUNCH-01
    verification:
      - kind: unit
        ref: "tests/unit/deploy-ovh-workflow.test.ts — 'uploads the build artifact with hidden files included' and 'sends the dotfile .htaccess via its own explicit-path SFTP step' tests"
        status: pass
    human_judgment: false
  - id: D5
    description: "The SFTP password only ever exists as a GitHub secret reference; the third-party action handling it is pinned to an immutable commit SHA"
    requirement: LAUNCH-01
    verification:
      - kind: unit
        ref: "tests/unit/deploy-ovh-workflow.test.ts — 'pins every SFTP-Deploy-Action reference' and 'never assigns the SFTP password as a literal' tests"
        status: pass
    human_judgment: false

duration: ~35min
completed: 2026-08-11
status: complete
---

# Phase 5 Plan 03: OVH Production Deploy Workflow (Built, Not Fired) Summary

**Built a workflow_dispatch-only GitHub Actions workflow that runs every existing staging quality gate, prints a build recap, pauses on a GitHub Environment approval gate, and pushes `dist/` (including the dotfile `.htaccess`) to OVH over SFTP using a commit-SHA-pinned third-party action — locked in place by 13 CI assertions. Nothing was dispatched or fired at production.**

## Performance

- **Duration:** ~35 min
- **Completed:** 2026-08-11
- **Tasks:** 3/3
- **Files created:** 2 (`.github/workflows/deploy-ovh.yml`, `tests/unit/deploy-ovh-workflow.test.ts`)
- **Files modified:** 2 (`.github/workflows/deploy.yml`, `README.md`)

## Accomplishments

- `.github/workflows/deploy-ovh.yml` created as a wholly separate workflow file (never a job added to `deploy.yml`), triggered only by `workflow_dispatch`, mirroring every blocking gate from the staging pipeline (Sanity Studio lint/build, `astro check`, static-artifact verification, Playwright e2e, Vitest coverage) in its `build` job before producing an `ovh-dist` artifact
- A `Guard: only .htaccess is a top-level dotfile` step turns a would-be silent dotfile omission into a loud build failure
- A `Deploy recap` step writes commit, host/path, resolved `SITE_URL`, file count/size, top-level entries, and `contact.php`/`.htaccess` presence to `$GITHUB_STEP_SUMMARY` — the human-readable artifact a reviewer sees before approving
- `deploy` job gated on `environment: production-ovh` (`needs: build`) — the structural D-02 approval gate — then pushes over SFTP via `wlixcc/SFTP-Deploy-Action` pinned to commit SHA `a5ccb9c6211a94cc59404f0fdb2a9936a6dfee64` (tag `v1.2.6`, re-verified live against the GitHub API at write time, not just trusted from planning docs), with a second explicit-path step sending `.htaccess` since the `./dist/*` glob cannot match dotfiles
- `tests/unit/deploy-ovh-workflow.test.ts` — 13 source-invariant assertions across both workflow files, enforced under the existing `npm run test:unit`/`test:coverage` CI gates, so any regression of D-01/D-02/T-05-SC/T-05-02/T-05-08/T-05-16 fails CI rather than being caught (or missed) at deploy time
- `.github/workflows/deploy.yml`'s "Build (deploy artifact, GitHub Pages base)" step now sets `PUBLIC_CONTACT_ENDPOINT: https://atelierjacquelinesuzanne.fr/contact.php`, so the permanently-alive GitHub Pages staging site (D-03) POSTs cross-origin to the real production PHP endpoint; the root-base test-artifact build is deliberately left on its same-origin default
- `README.md` "Deployments" section documents both targets side by side, the four one-time OVH/GitHub setup prerequisites, and the dispatch → recap → approve → SFTP-push run procedure

## Task Commits

1. **Task 1: Create the manually-triggered OVH production deploy workflow** — `c96ae6e` (feat)
2. **Task 2: Lock the workflow's safety properties with a test, and wire the cross-origin endpoint into the Pages build** — `f9bea5a` (test)
3. **Task 3: Document how to run a production deploy and what must be configured first** — `00e9943` (docs)

_No separate RED→GREEN commit split: Task 2's `tdd="true"` was satisfied by writing the 13 assertions against the already-fully-specified `deploy-ovh.yml` from Task 1 (a source-invariant regression lock, not a red/green cycle against undefined behavior) — same pattern plans `05-01`/`05-02` used for their own `tdd="true"` tasks._

## Files Created/Modified

- `.github/workflows/deploy-ovh.yml` — New workflow `Deploy to OVH production (manual)`. `build` job: checkout → setup-node → install deps → Sanity Studio lint/build → typecheck → build (root base, `SITE_URL` set, no base-path var) → verify static artifact → Playwright cache/install → e2e → coverage → dotfile guard → recap → upload `ovh-dist` (`include-hidden-files: true`). `deploy` job: `needs: build`, `environment: production-ovh`, download artifact → SFTP push (`./dist/*`) → SFTP push (`./dist/.htaccess`) → completion summary.
- `tests/unit/deploy-ovh-workflow.test.ts` — 13 `it()` assertions (11 over `deploy-ovh.yml`, 2 over `deploy.yml`) reading both files as UTF-8 text.
- `.github/workflows/deploy.yml` — 5 lines added to the GitHub Pages build step's `env:` block (the `PUBLIC_CONTACT_ENDPOINT` line + a comment); nothing else changed, confirmed byte-for-byte via `git diff --stat` (additions only).
- `README.md` — New `## Deployments` section (34 lines) inserted between the Scripts table and the Sanity Studio section; nothing else in the file changed.

## Decisions Made

- **Action pin re-verification:** followed the plan's explicit instruction to re-check `wlixcc/SFTP-Deploy-Action`'s tag→SHA mapping and `action.yml` input names live via `gh api` before writing the file. Result: `v1.2.6` is still the newest tag, and its commit SHA (`a5ccb9c6211a94cc59404f0fdb2a9936a6dfee64`) and every input name in the plan's `<interface_context>` matched the live API response exactly — no correction was needed, and none was made.
- **README duplication left as-is:** the pre-existing `## Deployment` (singular) section at the very end of `README.md` now partially overlaps with the new `## Deployments` (plural) section. The plan's Task 3 acceptance criteria explicitly require `git diff README.md` to show additions only, so the old section was left untouched rather than folded in or removed. Flagging this here rather than silently reconciling it, since a future docs pass may want to merge or retire the older section.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed a literal `ASTRO_BASE` string from a code comment to satisfy the workflow's own acceptance criterion**
- **Found during:** Task 1 verification (the plan's own automated check forbids the literal string `ASTRO_BASE` anywhere in `deploy-ovh.yml`, including comments)
- **Issue:** My first draft of the "Production build" step's explanatory comment named `ASTRO_BASE` directly to explain why it's unset, which tripped the forbidden-string check (`node -e ... forbidden=['ASTRO_BASE', ...]`) since the check is a plain substring match with no comment/code distinction.
- **Fix:** Reworded the comment to describe the base-path env var by role ("the base-path env var used by the GitHub Pages build") instead of naming it literally.
- **Files modified:** `.github/workflows/deploy-ovh.yml`
- **Verification:** re-ran the plan's exact automated check — `forbidden: []`
- **Committed in:** `c96ae6e` (Task 1 commit — caught and fixed before the first commit, not a follow-up)

No other deviations. Both remaining tasks (2 and 3) executed exactly as specified, with all acceptance criteria met on the first pass.

## Issues Encountered

- `npx vitest run` (full suite, no `--coverage`) still fails to collect `tests/unit/dashboard-logic.test.ts` (`Cannot find package '@sanity/icons/BulbOutline'`) — this is the same pre-existing, unrelated failure documented in `05-01-SUMMARY.md` and `05-02-SUMMARY.md`, confirmed there via `git stash` against the pre-phase base commit. Untouched by this plan (`sanity/editorial/dashboardLogic.ts` is not in this plan's `files_modified`). All 279 tests that do collect pass, including the 13 new ones.
- `npm run typecheck` passes with 0 errors (1 pre-existing, unrelated deprecation hint in `tests/e2e/homepage-wordmark-peek.spec.ts`, not touched by this plan).

## User Setup Required

**Outstanding prerequisite before plan `05-05` can run — not done in this session, cannot be done from this sandboxed worktree (no GitHub admin credentials, no OVH panel access):**

1. **Repository secret `OVH_SFTP_PASSWORD`**, scoped to an environment (not repo-wide):
   - Value: the SFTP password for user `atelihu`, from OVH Control Panel → Web Cloud → Hosting plans → `atelihu` → FTP - SSH tab.
   - Set via: `gh secret set OVH_SFTP_PASSWORD --env production-ovh`
2. **Repository Environment named exactly `production-ovh`**, created under GitHub repo → Settings → Environments → New environment, with the maintainer added as a Required reviewer. Without this, the `deploy` job's `environment:` line has nothing to gate on and the run would proceed straight through to the SFTP push — this environment's existence (plus a reviewer) is what makes D-02's approval gate real rather than theoretical.
3. **Confirm the OVH webroot path** under `/home/atelihu` (this workflow assumes `www`) and **confirm `atelierjacquelinesuzanne.fr` is attached to the `atelihu` hosting plan via Multisite** — both via OVH Control Panel → Web Cloud → Hosting plans → `atelihu` → Multisite tab. The plan flags the webroot path as the one SFTP fact NOT independently confirmed; plan `05-05`'s blocking checkpoint checks it against the OVH panel before the first real push.

Both README.md's new "Production deploy: one-time setup" subsection and this plan's `user_setup` frontmatter document these identically — nothing here was invented beyond what the plan already specified.

## Next Phase Readiness

- `.github/workflows/deploy-ovh.yml` exists, is structurally verified, and is fully test-locked, but has never been dispatched — by design. Plan `05-05` is where it gets fired for the first time, and its own blocking checkpoint should re-confirm the SHA pin (`a5ccb9c6211a94cc59404f0fdb2a9936a6dfee64`, tag `v1.2.6` at pin time) and the `/home/atelihu/www` webroot assumption before that happens.
- The `production-ovh` GitHub Environment and `OVH_SFTP_PASSWORD` secret are hard blockers for `05-05` — that plan cannot proceed until the maintainer completes the "User Setup Required" steps above.
- `.github/workflows/deploy.yml`'s staging pipeline is provably unaffected (byte-identical except the one intentional `PUBLIC_CONTACT_ENDPOINT` addition) — the next push to `main` should deploy to GitHub Pages exactly as before.

---
*Phase: 05-launch-domain-cutover*
*Completed: 2026-08-11*

## Self-Check: PASSED

All created/modified files verified present on disk (`.github/workflows/deploy-ovh.yml`, `tests/unit/deploy-ovh-workflow.test.ts`, `.github/workflows/deploy.yml`, `README.md`, this SUMMARY). All four task commits (`c96ae6e`, `f9bea5a`, `00e9943`, `43a93e8`) verified present in `git log`.
