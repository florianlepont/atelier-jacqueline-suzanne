---
phase: 03
slug: about-contact
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-07
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.9 (unit) + Playwright 1.61.1 (e2e) — both already configured, unchanged this phase |
| **Config file** | `vitest.config.ts` (uses Astro's `getViteConfig` so `astro:i18n` resolves), `playwright.config.ts` |
| **Quick run command** | `npx vitest run tests/unit/contact-form.test.ts` |
| **Full suite command** | `npm run test:unit && npm run test:e2e` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/unit/contact-form.test.ts`
- **After every plan wave:** Run `npm run test:unit && npm run test:e2e`
- **Before `/gsd:verify-work`:** Full suite must be green, plus the one manual human-verify submission checkpoint
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | ABOUT-01 | — | About page renders bio content in both FR and EN at their respective locale routes | e2e | `npx playwright test tests/e2e/about.spec.ts` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | ABOUT-02 | — | About page renders atelier/practice section, including exact D-06 placeholder copy | e2e | `npx playwright test tests/e2e/about.spec.ts` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | ? | CONT-01 | — | Contact form accepts valid input and shows inline success message without navigating away (D-09) | e2e (network mocked via `page.route()`) | `npx playwright test tests/e2e/contact.spec.ts` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | ? | CONT-01 (real delivery) | — | A genuine submission actually reaches Romane's inbox | manual-only | `checkpoint:human-verify` — submit the live form once post-deploy and confirm receipt | N/A | ⬜ pending |
| 03-02-03 | 02 | ? | CONT-02 | T-honeypot | Honeypot-filled submissions never trigger a real network call and still show success | unit + e2e | `npx vitest run tests/unit/contact-form.test.ts` + Playwright fill-and-assert-no-request test | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/contact-form.ts` — pure functions (`isValidEmail`, `isHoneypotTriggered`, field-required checks) — does not exist yet
- [ ] `tests/unit/contact-form.test.ts` — unit tests for the above, following `tests/unit/i18n-paths.test.ts`'s existing style
- [ ] `tests/e2e/about.spec.ts` — new file
- [ ] `tests/e2e/contact.spec.ts` — new file, including a `page.route()`-mocked submission test and a honeypot-fill test
- [ ] `PUBLIC_WEB3FORMS_ACCESS_KEY` — add to `.env.example`, local `.env`, and CI repo secrets once a Web3Forms account/key is obtained

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real submission reaches Romane's inbox | CONT-01 | Cannot be reliably automated against a bot-protected free-tier API (raw non-browser requests are rejected by Web3Forms) | After deploy, submit the live contact form once and confirm the email arrives at the `atelierjacquelinesuzanne.fr` mailbox |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
