---
phase: 21
slug: homepage-scroll-experience
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-04
---

# Phase 21 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.9 (unit) + Playwright 1.61.1 (e2e) — both already configured |
| **Config file** | `vitest.config.ts` (unit), `playwright.config.ts` (e2e — `chromium` + `webkit-mobile` [iPhone 15 Pro viewport, WebKit engine] projects) |
| **Quick run command** | `npm run test:unit -- home-carousel` |
| **Full suite command** | `npm run test:coverage` (unit) and `npm run test:e2e` (e2e) — both are existing CI blocking gates |
| **Estimated runtime** | Matches existing CI gate durations — not independently timed this session |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run home-carousel` (pure zoom-progress math) plus the targeted new e2e spec for that task
- **After every plan wave:** Run `npm run test:coverage` (unit) and `npm run test:e2e` (e2e)
- **Before `/gsd-verify-work`:** Full suite must be green, PLUS a manual real-device pass (see Manual-Only Verifications below)
- **Max feedback latency:** matches existing CI cadence (no new watch-mode infra introduced)

---

## Per-Task Verification Map

*Task ID / Plan / Wave columns are TBD — this phase has not been broken into plans/waves yet (VALIDATION.md precedes planning). The planner must thread its task IDs through this requirement→test mapping, sourced directly from 21-RESEARCH.md's "Phase Requirement → Test Map."*

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior / Expected Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|--------------------------------------|-----------|--------------------|-------------|--------|
| TBD | TBD | TBD | HOME-14 | — | Toggle/grid control absent below 768px | e2e | `npx playwright test homepage-scroll-deck -x` | ❌ Wave 0 | ⬜ pending |
| TBD | TBD | TBD | HOME-14 | — | Scroll moves through every gallery as one continuous sequence | e2e | `npx playwright test homepage-scroll-deck -x` | ❌ Wave 0 | ⬜ pending |
| TBD | TBD | TBD | HOME-14 | — | Description hidden until arrival-complete, then reveals | e2e | `npx playwright test homepage-scroll-deck -x` | ❌ Wave 0 | ⬜ pending |
| TBD | TBD | TBD | HOME-14 | — | New pure zoom/arrival math (`computeWordmarkZoomState` or equivalent) | unit | `npx vitest run home-carousel` | ❌ Wave 0 (function doesn't exist yet) | ⬜ pending |
| TBD | TBD | TBD | HOME-15 | — | Full-screen wordmark visible on first load | e2e | `npx playwright test homepage-scroll-deck -x` | ❌ Wave 0 | ⬜ pending |
| TBD | TBD | TBD | HOME-15 | — | Scroll visibly transitions wordmark→photo, reversible in both directions | e2e | `npx playwright test homepage-scroll-deck -x` | ❌ Wave 0 | ⬜ pending |
| TBD | TBD | TBD | D-11 (carryover CR-01) | — | Tap on progress-dash/autoplay-toggle does not trigger navigation (tablet touchscreen) | e2e | `npx playwright test homepage-wordmark-peek -x` (extend existing file) | ⚠️ file exists, new case needed | ⬜ pending |
| TBD | TBD | TBD | UI-02 (regression) | — | Desktop/tablet carousel/grid unaffected | e2e | Existing `homepage-carousel-core.spec.ts`, `homepage-content-display.spec.ts`, `homepage-mobile-responsive.spec.ts` must stay green, unmodified | ✅ existing | ⬜ pending |
| TBD | TBD | TBD | D-15 | — | Reduced-motion static end-state (no scroll JS, descriptions always visible) | e2e | New test using `page.emulateMedia({ reducedMotion: 'reduce' })` | ❌ Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/e2e/homepage-scroll-deck.spec.ts` — new file covering HOME-14/HOME-15's mobile scroll-deck behavior end to end
- [ ] `tests/unit/home-carousel.test.ts` — new `describe` block for the new pure zoom-progress function once extracted to `src/lib/home-carousel.ts`
- [ ] `tests/e2e/homepage-wordmark-peek.spec.ts` — extend with a real-coordinate touchend-on-progress-dash regression test for CR-01 (per `20-REVIEW.md`'s own suggested fix verification)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real-device zoom pace/anchor and scroll-snap feel | HOME-14, HOME-15 | Playwright's `webkit-mobile` project runs the desktop WebKit engine build with an emulated iPhone viewport/touch events — not real Mobile Safari, and has historically lagged on newer scroll APIs. It validates logic and catches regressions but is not a substitute for the one live-device check the sketch process itself relied on (sketch 015 was only confirmed correct — Cinematic pace, zoom anchored on the "A" — after real-phone testing over the local network). | Serve the built site (or dev server) over the local network and open it on a real phone, mirroring the `/gsd-sketch` phone-preview workflow used for sketch 015: confirm the zoom pace/anchor feel and scroll-snap behavior directly before signing off the phase. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency matches existing CI cadence
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
