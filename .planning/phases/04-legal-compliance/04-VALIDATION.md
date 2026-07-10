---
phase: 04
slug: legal-compliance
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-08
---

# Phase 04 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.61.1 (e2e) + Vitest 4.1.9 (unit) — both already configured |
| **Config file** | `playwright.config.ts` (testDir `./tests/e2e`, baseURL `http://localhost:4321`, `npm run preview` webServer) |
| **Quick run command** | `npx playwright test tests/e2e/legal.spec.ts` |
| **Full suite command** | `npm run test:e2e && npm run test:unit` |
| **Estimated runtime** | ~30 seconds (quick), ~2-3 minutes (full suite) |

---

## Sampling Rate

- **After every task commit:** Run `npx playwright test tests/e2e/legal.spec.ts`
- **After every plan wave:** Run `npm run test:e2e && npm run test:unit`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~180 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-XX | 01 | 0 | LEGAL-01/03/05 | — | N/A (content phase, no technical attack surface) | e2e | `npx playwright test tests/e2e/legal.spec.ts -g "mentions"` | ❌ W0 | ⬜ pending |
| 04-01-XX | 01 | 0 | LEGAL-03 | — | N/A | e2e | `npx playwright test tests/e2e/legal.spec.ts -g "privacy"` | ❌ W0 | ⬜ pending |
| 04-01-XX | 01 | 0 | LEGAL-05 | — | No cookie set by loading legal pages; no consent banner element exists | e2e | `npx playwright test tests/e2e/legal.spec.ts -g "cookie"` | ❌ W0 | ⬜ pending |
| 04-01-XX | 01 | 0 | (regression) | — | Language switcher navigates correctly between FR/EN legal pages at matching slugs | e2e | `npx playwright test tests/e2e/legal.spec.ts -g "switcher"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/e2e/legal.spec.ts` — new file, covers LEGAL-01/LEGAL-03/LEGAL-05 plus the switcher-slug regression check, mirroring the existing `tests/e2e/about.spec.ts` structure (RED-first pattern: pages don't exist yet, tests are expected to fail until the pages are built).

---

## Manual-Only Verifications

None — all phase behaviors (page rendering, footer links, cookie absence, switcher navigation) have automated e2e coverage. Legal *content accuracy* (identity disclosure, business status wording) is a human review concern tracked via the D-08/D-09/D-10 decisions in CONTEXT.md, not a testable runtime behavior.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 180s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
