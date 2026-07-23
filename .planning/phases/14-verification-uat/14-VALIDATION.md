---
phase: 14
slug: verification-uat
status: verified
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-23
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.9 (unit) + Playwright 1.61.1 (e2e) + a plain Node script guard (`test:artifact`) |
| **Config file** | `vitest.config.ts` / `playwright.config.ts` |
| **Quick run command** | `npm run test:unit` |
| **Full suite command** | `npm run build && npm run test:unit && npm run test:e2e && npm run test:artifact` |
| **Estimated runtime** | ~90 seconds (build + 126 unit + 163 e2e + artifact scan, per this session's re-run in `14-CLOSURE-AUDIT.md`/`14-VERIFICATION.md`) |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:unit`
- **After every plan wave:** Run `npm run build && npm run test:unit && npm run test:e2e && npm run test:artifact`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 90 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 14-01-01 | 01 | 1 | — | T-14-01-D | Malformed/partially-populated édition doc cannot crash whole-site `astro build` (detail pages) | e2e + build | `npm run build && npx astro check && npm run test:e2e -- edition` | ✅ `src/pages/editions/[slug].astro`, `src/pages/en/editions/[slug].astro`, `tests/e2e/edition.spec.ts` | ✅ green |
| 14-01-02 | 01 | 1 | — | T-14-01-D | Overview pages guard `statement[locale]` identically to the detail page | e2e + build | `npm run build && npx astro check && npm run test:e2e -- edition` | ✅ `src/pages/editions/index.astro`, `src/pages/en/editions/index.astro` | ✅ green |
| 14-02-01 | 02 | 1 | — | T-14-02-I | Commerce language cannot silently enter the édition schema's Studio field copy | artifact scan | `npm run test:artifact` | ✅ `tests/scripts/verify-static-artifact.mjs` (scans `sanity/schemas/edition.ts`) | ✅ green |
| 14-02-02 | 02 | 1 | — | — | Existing commerce-token arrays / `containsWholeWord` helper reused, not forked | other (diff review) | `git diff tests/scripts/verify-static-artifact.mjs` | ✅ | ✅ green |
| 14-03-01 | 03 | 2 | — | T-14-03-R | Closure audit's evidence is freshly re-run, not cited from prior claims | build + unit + e2e + artifact | `npm run build && npm run test:unit && npm run test:e2e && npm run test:artifact` | ✅ `14-CLOSURE-AUDIT.md` | ✅ green |
| 14-03-02 | 03 | 2 | — | — | REQUIREMENTS.md's EDN-01..07/CMS-04 confirmed already `[x]`, no redundant edit | other (grep) | `grep -cE "^- \[x\] \*\*(EDN-0[1-7]\|CMS-04)\*\*" .planning/REQUIREMENTS.md` | ✅ | ✅ green |
| 14-04-01 | 04 | 3 | — | T-14-04-T | French non-technical checklist covers create/edit/publish/drag-reorder + draft-stays-off-live check | other (grep) | `grep -ciE 'cr[eé]er\|nouvelle [eé]dition' ... ; grep -ciE 'glisser\|r[eé]organiser\|r[eé]ordonner' ...` | ✅ `14-ROMANE-UAT.md` | ✅ green |
| 14-04-02 | 04 | 3 | — | T-14-04-R | Romane's real Studio pass (create/edit/publish/drag-reorder) genuinely performed, not fabricated | manual (human-verify) | N/A — see Manual-Only Verifications | ✅ `14-04-SUMMARY.md` | ✅ green (approved) |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] Existing infrastructure covers all phase requirements — Vitest/Playwright/`test:artifact` were already wired by Phases 11-13; Phase 14 added scan/guard coverage on top of them (no new framework install needed).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Romane's hands-on Sanity Studio pass — create a second édition, add a photo, write FR+EN statement, fill format details, confirm draft stays off-site, publish, confirm live on both locales, drag-reorder, confirm persistence after refresh | ROADMAP SC #3 (D-03/D-04) | This is by design a human-only action: no automation can substitute for confirming Romane's own subjective experience matches galleries, or for exercising credentials-gated Studio UI Romane alone has access to. Corroborated (not replaced) by the orchestrator's independent read-only check of the live public Sanity dataset (`publicationStatus`/`orderRank` deltas). | Follow `14-ROMANE-UAT.md` steps 1-9 in the hosted Sanity Studio; report back per the "À confirmer à Florian" section. Already performed and approved — see `14-04-SUMMARY.md`. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (none found)
- [x] No watch-mode flags
- [x] Feedback latency < 90s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-07-23
