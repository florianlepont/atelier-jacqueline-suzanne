---
phase: 9
slug: progressive-homepage-image-loading
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-14
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright (`@playwright/test`) |
| **Config file** | `playwright.config.ts` (existing, project root) |
| **Quick run command** | `npx playwright test tests/e2e/homepage.spec.ts --project=chromium` |
| **Full suite command** | `npx playwright test` |
| **Estimated runtime** | ~5-10 seconds (quick), full suite existing baseline |

---

## Sampling Rate

- **After every task commit:** Run `npx playwright test tests/e2e/homepage.spec.ts --project=chromium`
- **After every plan wave:** Run `npx playwright test` (full suite, all browsers — `homepage.spec.ts` already exercises multiple viewports via `test.use()` blocks, e.g. the HOME-06 iPhone 14 Pro block)
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 1 | HOME-09 (shell renders immediately) | T-04.1-04-ID | Header/nav/toggle visible without waiting on any image `load` event | e2e | `npx playwright test tests/e2e/homepage.spec.ts -g "shell renders"` | ❌ W0 | ⬜ pending |
| 09-01-02 | 01 | 1 | HOME-09 (hero priority) | — | Hero `<img>` has `fetchpriority="high"`, no `loading="lazy"` | e2e | `npx playwright test tests/e2e/homepage.spec.ts -g "hero.*priority"` | ❌ W0 | ⬜ pending |
| 09-01-03 | 01 | 1 | HOME-09 (blur-to-sharp, hero, every swap) | — | Placeholder layer with Sanity-blurred `src` exists on first paint and after auto-advance/prev/next/toggle; sharp `<img>` reaches `is-loaded`/`opacity:1` | e2e | `npx playwright test tests/e2e/homepage.spec.ts -g "blur-up"` | ❌ W0 | ⬜ pending |
| 09-01-04 | 01 | 1 | HOME-09 (blur-to-sharp, grid tiles) | — | Grid tile images carry a placeholder layer and gain `is-loaded` on load | e2e | `npx playwright test tests/e2e/homepage.spec.ts -g "grid.*blur"` | ❌ W0 | ⬜ pending |
| 09-01-05 | 01 | 1 | HOME-09 (grid tiles stay lazy) | — | Grid sharp `<img>` retains `loading="lazy"` (regression guard) | e2e | `npx playwright test tests/e2e/homepage.spec.ts -g "grid.*lazy"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] New `test.describe('progressive image loading (HOME-09)')` block in `tests/e2e/homepage.spec.ts` covering: shell-renders-without-waiting, hero `fetchpriority`, hero blur-placeholder-present-then-sharp-loaded (both on first paint and after a triggered swap), grid tile blur-placeholder + `loading="lazy"` retained.
- [ ] No new fixtures/framework install needed — `tests/e2e/homepage.spec.ts` already has the mocked-clock auto-advance pattern (`test.describe('auto-advance + pause (D-09)')`) this phase's "blur-up on every swap" tests should reuse to trigger a swap deterministically.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Placeholder width/blur tuning reads as a recognizable-but-cheap preview (not a solid blob) | HOME-09 | Visual judgment on real gallery cover photos, not assertable via DOM/CSS checks alone | Load the homepage locally, observe the blur-up transition on first paint and on a carousel swap for at least 2 different galleries; confirm the placeholder is legible as a color/shape preview |
| View-Transition overlay timing doesn't produce a visible glitch during a toggle-click-mid-fade | HOME-09 | Reasoned inference from the View Transitions API's snapshot model, not reproduced live in this codebase — cosmetic edge case only | Rapidly click the carousel/grid toggle while a blur-up transition is in progress; confirm no visible flash/pop, or note if one exists (do not pre-emptively fix without confirming) |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
