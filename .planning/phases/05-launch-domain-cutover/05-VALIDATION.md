---
phase: 5
slug: launch-domain-cutover
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-11
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.9 (unit) + Playwright 1.61.1 (e2e) — both already wired as BLOCKING CI gates |
| **Config file** | `vitest.config.ts` / `playwright.config.ts` (existing, unchanged by this phase) |
| **Quick run command** | `npm run test:unit` (Vitest) / `npx playwright test --grep <name>` (targeted e2e) |
| **Full suite command** | `npm run test:coverage && npx playwright test` |
| **Estimated runtime** | ~existing suite runtime, unchanged — this phase adds no new JS/TS test infra |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:unit`
- **After every plan wave:** Run `npm run test:coverage && npx playwright test`
- **Before `/gsd-verify-work`:** Full suite must be green, PLUS the manual DNS/deploy checklist and post-deploy smoke checks below
- **Max feedback latency:** ~existing suite runtime (no new automated test infra added by this phase)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | TBD | 0 | LAUNCH-01 (site serves from production domain) | — | N/A | manual/smoke | `curl -sI https://atelierjacquelinesuzanne.fr \| head -1` | ❌ W0 | ⬜ pending |
| TBD | TBD | 0 | LAUNCH-01 (MX/email preserved) | T-05-DNS | Zone diff shows no MX change | manual/smoke | `dig +short MX atelierjacquelinesuzanne.fr` (before/after diff) | ❌ W0 | ⬜ pending |
| TBD | TBD | 0 | LAUNCH-01 (DNS cutover rehearsed) | T-05-DNS | TTL lowered in advance, zone exported before change | manual/checklist | N/A — procedural | ❌ W0 | ⬜ pending |
| TBD | TBD | 0 | Contact form (`contact.php`) reachable and functioning | T-05-MAIL | Reject non-POST, reject CR/LF in fields, honeypot silently accepted without sending | integration (new) | Local `php -S localhost:8000` + Playwright/e2e or PHPUnit/Pest, exact choice left to planner (see Wave 0 Gaps) | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*Task IDs are TBD — the planner fills these in once actual plan/task IDs exist; the requirement rows above are the fixed verification contract this phase must satisfy regardless of final task numbering.*

---

## Wave 0 Requirements

- [ ] Decide and stand up `contact.php`'s test approach — no PHP test runner exists in this all-JS/TS repo. Given the project's near-zero-tooling philosophy, prefer (b) an e2e Playwright test against a locally `php -S`-served instance, or (c) manual-only verification for this single ~40-line script, over standing up a full PHPUnit/Pest framework for one file.
- [ ] Post-deploy smoke-check commands (`curl`/`dig` one-liners) — trivial, currently don't exist; may live as a documented runbook step rather than a script.
- [ ] A documented manual DNS-cutover checklist/runbook (zone dump before → TTL-lowering timeline → OVH Diagnostic-column check → zone dump after with MX-row diff) as a concrete artifact (e.g. `05-DNS-RUNBOOK.md`) so the "rehearsed/verified" success criterion has something checkable.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Production domain serves the new site | LAUNCH-01 | No live prod target exists in CI; this is inherently a post-cutover check | `curl -sI https://atelierjacquelinesuzanne.fr` returns 200 and body is the new Astro site, not Myportfolio |
| MX/Zimbra email continuity | LAUNCH-01 | DNS state isn't something Vitest/Playwright can exercise | `dig +short MX atelierjacquelinesuzanne.fr` run before AND after the DNS edit, diff must be empty |
| DNS cutover rehearsed/verified | LAUNCH-01 | Process/procedural criterion, not code | Full zone export before any change, TTLs lowered in advance, OVH Diagnostic column checked, zone export after with MX rows diffed |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < existing suite runtime
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
