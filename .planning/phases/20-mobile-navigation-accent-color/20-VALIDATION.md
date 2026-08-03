---
phase: 20
slug: mobile-navigation-accent-color
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-03
---

# Phase 20 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.61.1 (e2e) + Vitest 4.1.9 (unit) |
| **Config file** | `playwright.config.ts` (projects: `chromium` full suite, `webkit-mobile` scoped to `**/*.smoke.spec.ts`); `vitest.config.ts` |
| **Quick run command** | `npx playwright test tests/e2e/site-header.spec.ts` / `npx vitest run tests/unit/home-carousel.test.ts` |
| **Full suite command** | `npm run test:e2e` / `npm run test:unit` (or `npm run test:coverage` for gated coverage thresholds) |
| **Estimated runtime** | ~90 seconds (unit) / ~5 minutes (e2e, both projects) |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/unit/home-carousel.test.ts` and the targeted new e2e spec file
- **After every plan wave:** Run `npm run test:unit` + `npm run test:e2e`
- **Before `/gsd-verify-work`:** Full suite (`npm run test:coverage` + `npm run test:e2e`) must be green — matches the CI pipeline's own blocking-gate order (CLAUDE.md)
- **Max feedback latency:** 90 seconds

---

## Per-Task Verification Map

*Task IDs are assigned by the planner (not yet known at validation-strategy time). Each PLAN.md task must map to one of the rows below via its requirement ID.*

| Requirement | Behavior | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists |
|-------------|----------|------------|-----------------|-----------|-------------------|-------------|
| HOME-13 | Mobile nav (hamburger) shows on homepage at ≤767px, language switcher folded inside, desktop unchanged | — | N/A | e2e | `npx playwright test tests/e2e/site-header.spec.ts` | ❌ W0 |
| HOME-13 | Focus trap + Escape-to-close on the open nav dialog | — | N/A | e2e | same file | ❌ W0 |
| HOME-13 | Non-homepage pages (About/Contact/gallery/édition detail) unaffected — no `mobileNav` prop, existing inline nav unchanged | — | N/A | e2e regression | same file | ❌ W0 |
| HOME-13 | Axe: no serious/critical a11y violations on the open mobile-nav state | — | N/A | e2e (`@axe-core/playwright`) | `npx playwright test tests/e2e/accessibility.spec.ts` | ⚠️ needs new mobile-viewport variant |
| HOME-16 | A random gallery's `heroColor` (not always gallery 0's) is applied as the STARTING `--current-accent`; gallery 0's photo/title still shows first | T-20-01 (CSS-injection via unnormalized color) | Accent colors sourced only via existing `normalizeHeroColor()`-normalized fields, never a raw content string | unit + e2e | `npx vitest run tests/unit/home-carousel.test.ts` | ❌ W0 |
| HOME-16 | Existing per-gallery accent-follows-carousel-position behavior on swipe/click/auto-advance unchanged | — | N/A | e2e regression | `npx playwright test tests/e2e/homepage-carousel-core.spec.ts` | ✅ likely covered — confirm during planning |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/unit/home-carousel.test.ts` — add cases for `pickRandomGalleryIndex()` (distribution over an injected fake random source, boundary at `count=0`/`count=1`)
- [ ] `tests/e2e/site-header.spec.ts` (or a new `tests/e2e/mobile-nav.spec.ts`) — dialog open/close, focus trap, Escape, backdrop-click, desktop/other-page non-regression
- [ ] `tests/e2e/accessibility.spec.ts` — extend with a mobile-viewport + dialog-open axe pass (currently only tests default/desktop viewport)
- [ ] Framework install: none — all frameworks already present

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| "Nice, deliberate" feel of the open/close transition/animation (D-03) | HOME-13 | Subjective visual/motion quality judgment not expressible as a pass/fail assertion | Open and close the mobile nav on a real phone-width viewport (or device emulation) in both Chromium and Safari/WebKit; confirm the transition is smooth (not instant/jarring) in both, and confirm it is disabled/instant under `prefers-reduced-motion: reduce`. |
| Visual match to `20-mobile-menu-reference.png` (logo position, hamburger↔X icon spot, big stacked list style, secondary bottom element, halftone accent) | HOME-13 | Visual design fidelity to a provided reference image is not automatable | Compare the implemented open-menu panel side-by-side with `.planning/phases/20-mobile-navigation-accent-color/20-mobile-menu-reference.png`. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 90s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
