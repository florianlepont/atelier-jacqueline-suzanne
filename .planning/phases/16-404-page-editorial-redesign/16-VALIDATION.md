---
phase: 16
slug: 404-page-editorial-redesign
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-29
---

# Phase 16 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.9 (unit) + Playwright 1.61.1 (e2e) — both already configured as CI-blocking gates |
| **Config file** | `vitest.config.ts` (uses `astro/config`'s `getViteConfig`), `playwright.config.ts` |
| **Quick run command** | `npx vitest run tests/unit/pop-rate.test.ts` |
| **Full suite command** | `npm run test:coverage` (unit) + `npm run test:e2e` (Playwright) + `npm run test:artifact` |
| **Estimated runtime** | Not independently timed this session — existing CI-blocking suite baseline (see `.github/workflows/deploy.yml`) |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/unit/pop-rate.test.ts` (fast, pure-function math — no browser needed)
- **After every plan wave:** Run `npm run test:e2e -- not-found accessibility` + `npm run test:artifact`
- **Before `/gsd-verify-work`:** Full suite must be green (`npm run test:coverage` + `npm run test:e2e` + `npm run test:artifact`)
- **Max feedback latency:** Kept low by extracting the pop-rate math into a pure, unit-testable module (`src/lib/pop-rate.ts`) rather than requiring a real browser/pointer simulation for every check

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD (assigned by planner) | TBD | TBD | ERR-01 | — | Pop-rate math never produces an interval below the WCAG-adjacent cap, across the full proximity range 0..1 | unit | `npx vitest run tests/unit/pop-rate.test.ts` | ❌ W0 | ⬜ pending |
| TBD (assigned by planner) | TBD | TBD | ERR-01 | — | Reduced-motion branch ignores pointer entirely and swaps on the fixed drift interval | e2e | `npx playwright test not-found -g "reduced motion"` | ❌ W0 | ⬜ pending |
| TBD (assigned by planner) | TBD | TBD | ERR-01 | — | 404 still serves HTTP 404, bilingual content, correct `noindex` meta, base-aware home link hrefs | e2e | `npx playwright test not-found` | ✅ (needs updated assertions) | ⬜ pending |
| TBD (assigned by planner) | TBD | TBD | ERR-01 | T-Client-DoS (resource exhaustion via unbounded preload pool) | Built `404.html` contains exact base-prefixed home link hrefs (CR-01 regression class) | build-artifact | `npm run test:artifact` | ✅ (no change needed if hrefs stay base-aware) | ⬜ pending |
| TBD (assigned by planner) | TBD | TBD | ERR-01 | — | No serious/critical automated a11y violations on the redesigned 404 page (decorative images, contrast, focus order) | e2e (axe) | `npx playwright test accessibility` | ❌ W0 — 404 path absent from scanned array | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*Planner: replace Task ID / Plan / Wave placeholders with real values once tasks are assigned; this map's requirement/behavior/command columns are pre-populated from `16-RESEARCH.md`'s Validation Architecture section.*

---

## Wave 0 Requirements

- [ ] `src/lib/pop-rate.ts` — new pure module (proximity→interval mapping + hard-floor clamp), unit-testable without simulating real pointer/touch events in a browser (mirrors `image-orientation.ts`'s pure-function testability pattern)
- [ ] `tests/unit/pop-rate.test.ts` — covers the interval math at proximity 0, 0.5, 1, and confirms the floor never goes under the configured `MIN_INTERVAL_MS`
- [ ] `tests/e2e/not-found.spec.ts` — update existing heading-text assertions for the new condensed copy (D-12), add a `page.emulateMedia({ reducedMotion: 'reduce' })` case
- [ ] `tests/e2e/accessibility.spec.ts` — add the 404 route to the scanned path array (currently entirely absent from automated a11y coverage)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Subjective "feel" of the pop rate across the full pointer-proximity range (does dead-center feel appropriately energetic without being jarring) | ERR-01 | Perceptual/aesthetic judgment; not a pass/fail assertion | Open the built 404 page, move pointer from edge to center, confirm the ramp feels intentional and stays capped |
| Photo pool variety/legibility of centered content across the actual current set of published gallery photos | ERR-01 | Depends on Romane's live, changing Sanity content, not a fixed fixture | Cycle through the page in a browser and confirm the scrim keeps the logo/text/links legible against every photo currently in the pool |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency acceptable (unit tests run in well under a second; e2e/a11y run per wave, not per task)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
