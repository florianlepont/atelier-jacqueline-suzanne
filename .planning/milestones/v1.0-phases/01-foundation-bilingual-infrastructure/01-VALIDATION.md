---
phase: 01
slug: foundation-bilingual-infrastructure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-05
---

# Phase 01 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright `@playwright/test` 1.61.1 (e2e) + Vitest 4.1.9 (unit) |
| **Config file** | none yet — Wave 0 (`playwright.config.ts`, `vitest.config.ts`) |
| **Quick run command** | `npx vitest run tests/unit/i18n-paths.test.ts` |
| **Full suite command** | `npm run build && npx playwright test && npx vitest run` |
| **Estimated runtime** | ~30-60 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run` (fast unit check on the slug-mapping utility)
- **After every plan wave:** Run `npm run build && npx playwright test && npx vitest run` (full suite)
- **Before `/gsd:verify-work`:** Full suite must be green, plus a manual visit to the live staging URL
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-TBD | 01 | 0 | I18N-01/I18N-02 | — | Test infra scaffolded before feature tasks | setup | `npx playwright install --with-deps chromium` | ❌ W0 | ⬜ pending |
| 01-XX-TBD | TBD | TBD | I18N-01 | — | French content served at `/`, English at `/en/`, both render Sanity-sourced nav/footer copy | e2e | `npx playwright test tests/e2e/i18n.spec.ts -g "locale content"` | ❌ W0 | ⬜ pending |
| 01-XX-TBD | TBD | TBD | I18N-02 | — | Switcher navigates to equivalent page in other locale; cookie persists choice | e2e | `npx playwright test tests/e2e/i18n.spec.ts -g "switcher"` | ❌ W0 | ⬜ pending |
| 01-XX-TBD | TBD | TBD | (infra) | — | Shared-slug path-mapping utility correctness | unit | `npx vitest run tests/unit/i18n-paths.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*Task IDs are placeholders — the planner assigns real IDs; this table's Requirement/Test Type/Command columns are binding, IDs get filled in once PLAN.md exists.*

---

## Wave 0 Requirements

- [ ] `playwright.config.ts` — point `webServer` at a static file server (`npx serve dist` or equivalent) serving the built output
- [ ] `vitest.config.ts` — minimal config, no framework-specific plugin needed for a plain TS utility
- [ ] `tests/e2e/i18n.spec.ts` — covers I18N-01, I18N-02
- [ ] `tests/unit/i18n-paths.test.ts` — covers the shared-slug utility
- [ ] Framework install: `npm install -D @playwright/test vitest && npx playwright install --with-deps chromium`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Live staging URL reachable over HTTPS at `staging.atelierjacquelinesuzanne.fr` | I18N-01 (deployment success criterion) | Requires real DNS propagation + OVH Let's Encrypt cert issuance, not reproducible in CI | Visit `https://staging.atelierjacquelinesuzanne.fr/` and `/en/` in a browser; confirm valid cert (no browser warning) and correct locale content |
| OVH FTP/SFTP deploy actually publishes on push to `main` | D-05 | CI can simulate the FTP step against test credentials, but confirming files landed on the real OVH doc root requires an out-of-band check | After first CI run, browse to the staging URL and confirm content matches the latest commit |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
