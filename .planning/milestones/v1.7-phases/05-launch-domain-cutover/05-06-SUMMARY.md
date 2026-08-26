---
phase: 05-launch-domain-cutover
plan: 06
subsystem: infra
tags: [smoke-test, dns, mail, cutover, evidence, ops-runbook]

requires:
  - phase: 05-launch-domain-cutover
    provides: "05-04 (scripts/launch-smoke-check.sh, 05-DNS-RUNBOOK.md), 05-05 (the live DNS cutover itself, 05-mx-baseline.txt, 05-DNS-BASELINE.md)"
provides:
  - "05-CUTOVER-LOG.md: the phase's evidence record — Timeline, Automated verification, Before/after, Manual verification, Success criteria, Deviations from plan, Follow-ups, Issues encountered"
  - "05-DNS-RUNBOOK.md fully ticked (46 items), with every deliberately-unticked item carrying a one-line reason"
  - "Verdicts recorded for RESEARCH.md assumptions A2-A5, all confirmed accurate/not-blocked"
affects: []

tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - .planning/phases/05-launch-domain-cutover/05-CUTOVER-LOG.md
    - .planning/phases/05-launch-domain-cutover/05-DNS-RUNBOOK.md

key-decisions:
  - "Task 2's human-verify checkpoint was resolved across two exchanges: the maintainer's initial terse per-item pass/fail (A/B/C/D matching the <resume-signal> exactly), followed by one targeted follow-up question asking specifically which mail folder (inbox vs spam) the test message landed in — because RESEARCH.md and this plan's own <interface_context> flagged the SPF hard-fail deliverability risk as needing that specific fact recorded, not just 'it arrived'. Answer: inbox."
  - "Rollback-trigger and rollback-mechanics checkboxes in 05-DNS-RUNBOOK.md Section 5 were deliberately left unticked (with a 'not triggered' reason each) rather than ticked, since ticking them would have falsely implied the bad condition occurred. Only genuinely-performed actions were ticked."
  - "The TTL-restoration item (05-DNS-RUNBOOK.md Section 6) was left unticked on purpose, per the plan's own instruction — the site has been stable for two days with a clean re-verification, so it is now safe to restore, but the restoration itself was not performed in this plan and is recorded as a follow-up with the original value (3600s)."

requirements-completed: [LAUNCH-01]

coverage:
  - id: D1
    description: "All three ROADMAP Phase 5 success criteria have named, reproducible evidence in 05-CUTOVER-LOG.md's Success criteria table"
    requirement: "LAUNCH-01"
    verification:
      - kind: manual_procedural
        ref: "05-CUTOVER-LOG.md ## Success criteria table, citing the smoke-check transcript, MX diff, real mail delivery, and plan 05-04's staging rehearsal"
        status: pass
    human_judgment: false
  - id: D2
    description: "A real message sent through the live production form is confirmed to have reached the maintainer's mailbox, with its folder recorded"
    requirement: "LAUNCH-01"
    verification:
      - kind: manual_procedural
        ref: "Maintainer confirmation, recorded verbatim in 05-CUTOVER-LOG.md ## Manual verification: delivered to inbox, not spam"
        status: pass
    human_judgment: true
    rationale: "Real mail delivery into a Zimbra mailbox cannot be automated or independently re-verified by Claude; the maintainer's direct confirmation is the only possible evidence."
  - id: D3
    description: "MX records provably byte-identical to their pre-cutover state, checked by both an automated diff and an actual delivery"
    requirement: "LAUNCH-01"
    verification:
      - kind: automated
        ref: "MX_BASELINE=... npm run test:smoke -- https://atelierjacquelinesuzanne.fr (Task 1, 15/15 PASS incl. MX diff) + Task 2's real delivered message"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every deferred verification from plans 05-01, 05-02, 05-04, and 05-05 is resolved, none silently dropped"
    requirement: "LAUNCH-01"
    verification:
      - kind: manual_procedural
        ref: "05-CUTOVER-LOG.md Manual verification (mail delivery, cross-origin staging submission, browser sweep) and Success criteria table (staging rehearsal, TTL lowering)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Every assumption RESEARCH.md flagged for live confirmation (A2-A5) has a recorded verdict"
    requirement: "LAUNCH-01"
    verification:
      - kind: manual_procedural
        ref: "05-CUTOVER-LOG.md ## Deviations from plan: A2 (action version/inputs) confirmed accurate, A3 (webroot path) confirmed accurate, A4 (recipient mailbox) confirmed via real delivery, A5 (self-approval) confirmed not blocked"
        status: pass
    human_judgment: false
  - id: D6
    description: "Anything still owed after launch is written down as a follow-up rather than left in someone's memory"
    requirement: "LAUNCH-01"
    verification:
      - kind: manual_procedural
        ref: "05-CUTOVER-LOG.md ## Follow-ups: TTL restoration (3600s) and deploy-ovh.yml workaround-step cleanup"
        status: pass
    human_judgment: false

duration: ~15min (Task 3 write-up; Task 1 and Task 2 were completed across the preceding live session)
completed: 2026-08-13
status: complete
---

# Phase 05 Plan 06 Summary

**Closed the phase: recorded the maintainer's Task 2 checkpoint answers (real mail delivered to the inbox, cross-origin staging submission succeeded, nothing looked wrong, http/directory-listing/404 all correct), then wrote the cutover log's remaining four sections and ticked the DNS runbook — LAUNCH-01's evidence record is complete.**

## Performance

- **Duration:** ~15 min for this session's Task 3 write-up (Task 1's automated smoke check and Task 2's human-verify checkpoint were already complete from the preceding session, recorded in the same `05-CUTOVER-LOG.md`)
- **Tasks:** 3/3 (Task 1 and Task 2 completed in an earlier session; this session closed Task 3)

## Accomplishments

- Recorded the maintainer's Task 2 checkpoint replies verbatim into `05-CUTOVER-LOG.md ## Manual verification`, including one targeted follow-up question (mail folder: inbox vs spam) that the plan's own threat model (T-05-09) specifically required distinguishing rather than assuming.
- Wrote `## Success criteria`, mapping all three ROADMAP Phase 5 criteria to concrete, citable evidence — no row asserting only "verified" or "done".
- Wrote `## Deviations from plan` with recorded verdicts for RESEARCH.md assumptions A2 through A5, all confirmed accurate or not-blocked.
- Wrote `## Follow-ups`, limited strictly to what was actually observed as still open: the deferred TTL restoration (3600s) and the one-time `deploy-ovh.yml` workaround step's cleanup. No SPF/deliverability follow-up was invented, since the real test message landed in the inbox, not spam.
- Ticked 46 items across `05-DNS-RUNBOOK.md`; every deliberately-unticked item (the rollback triggers that never fired, and the deferred TTL restoration) carries a one-line reason rather than being silently left blank.
- Confirmed `.planning/ROADMAP.md` and `.planning/STATE.md` are untouched by this plan, per its own explicit constraint (`git diff --name-only` lists only the two files this plan is scoped to).

## Task Commits

1. **Task 1: Run the full production smoke check with MX comparison** — completed and committed in an earlier session (`1e4c4e5`, merged via `26f5bae`)
2. **Task 2: Launch acceptance checkpoint** — resolved via the maintainer's conversational replies in this session (no code changes; a checkpoint, not a commit)
3. **Task 3: Close the runbook and write the launch evidence record** — this commit

## Files Created/Modified

- `.planning/phases/05-launch-domain-cutover/05-CUTOVER-LOG.md` — added `## Manual verification`, `## Success criteria`, `## Deviations from plan`, `## Follow-ups`
- `.planning/phases/05-launch-domain-cutover/05-DNS-RUNBOOK.md` — checklist ticked throughout (46 items), unticked items annotated with reasons

## Decisions Made

See `key-decisions` in frontmatter. Most significant: asking the one targeted follow-up question (mail folder) before writing the evidence record, rather than inferring it from a terse "pass" — the plan's own acceptance criteria required the folder "recorded verbatim," and inbox vs spam changes whether a deliverability follow-up is warranted.

## Deviations from Plan

None. All three tasks were executed and verified exactly as `05-06-PLAN.md` specified: Task 1's smoke check passed on the first attempt, Task 2 surfaced no blocking items, and Task 3's own automated structural verify script (checking for all 7 required section headers and ≥10 ticked runbook items) passed with 46 items ticked.

## Issues Encountered

None new in this session. (Task 1's `## Issues encountered` section in the cutover log itself already records that no issues arose during the smoke check; Task 2 surfaced no blocking items either.)

## User Setup Required

None.

## Next Phase Readiness

- **Phase 5 (launch-domain-cutover) is functionally complete.** All three ROADMAP success criteria have recorded evidence, `LAUNCH-01` is satisfied, and the cutover log is the single document `/gsd-verify-work` needs to close it.
- **Explicitly out of this plan's scope, per its own Task 3 instruction:** `.planning/ROADMAP.md` and `.planning/STATE.md` still need the separate phase-completion bookkeeping pass (marking Phase 5 done) — that belongs to the phase-completion workflow, not this plan.
- **Two real follow-ups remain open**, recorded in `05-CUTOVER-LOG.md ## Follow-ups`: restoring the apex/`www` A-record TTLs to 3600s (safe now, not yet done), and deleting the one-time `deploy-ovh.yml` workaround step in a small cleanup commit.

---
*Phase: 05-launch-domain-cutover*
*Completed: 2026-08-13*
