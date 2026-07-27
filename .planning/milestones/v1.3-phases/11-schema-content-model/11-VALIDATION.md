---
phase: 11
slug: schema-content-model
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-22
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.9 (root `tests/unit/`) for any TS logic; no test framework applies to Sanity schema files directly — this repo has no precedent for unit-testing schema shape (no test file imports `gallery.ts`/`exhibition.ts`) |
| **Config file** | `vitest.config.ts` (root) — unaffected by this phase |
| **Quick run command** | `npm run test:unit` |
| **Full suite command** | `npm run test:coverage`; `npm --prefix sanity run lint && npm --prefix sanity run build` (Studio-specific gate) |
| **Estimated runtime** | ~30s (Studio lint+build) |

---

## Sampling Rate

- **After every task commit:** Run `npm --prefix sanity run lint && npm --prefix sanity run build` (fast, catches schema-definition errors immediately)
- **After every plan wave:** Same, plus the human-verify checkpoint(s) for CMS-04 / success criteria #1, #2, #4, #5
- **Before `/gsd-verify-work`:** Studio lint+build green, AND both human-verify checkpoints (Studio create/edit/publish/reorder workflow; naming-resolution doc update) confirmed
- **Max feedback latency:** ~30s

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 11-01-xx | 01 | 1 | EDN-05 | — | N/A | automated (schema build/typecheck) | `npm --prefix sanity run build` | ✅ existing CI step | ⬜ pending |
| 11-01-xx | 01 | 1 | CMS-04 | — | N/A | manual (`checkpoint:human-verify`) | n/a — no automated test can prove an unassisted human Studio workflow | ❌ n/a (not automatable) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*None — existing infrastructure covers all phase requirements. This phase introduces no new automated-test surface beyond the Studio's existing `lint`/`build`/`tsc` gate, already wired into CI (`.github/workflows/deploy.yml`, "Lint and build Sanity Studio" step).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Romane can create, edit, publish, and drag-reorder an édition document unassisted | CMS-04 | No automated test can prove an unassisted human Studio UX workflow; `sanity build`/`lint` only proves the schema compiles, not that the editorial experience is usable | Open Studio, create a new édition, fill every field group, publish, then drag-reorder it among other éditions — confirm no developer intervention was needed |
| "Rebut" naming-overlap resolution recorded in PROJECT.md | Success criterion #5 | Documentation state, not code behavior | Confirm `PROJECT.md`'s Key Decisions table contains the Rebut resolution (per `11-CONTEXT.md` D-01/D-02) marked Confirmed |
| Schema changes actually live in Romane's real Studio instance | Success criterion #1/#2/#4 | The hosted Studio (`https://atelier-jacqueline-suzanne.sanity.studio/`) requires an explicit `npx sanity deploy` from `sanity/` — no CI step runs this automatically | After merging schema changes, run `npx sanity deploy` from `sanity/` and confirm the `edition` document type appears in the live hosted Studio |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies (or are explicitly `checkpoint:human-verify`)
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (none needed)
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
