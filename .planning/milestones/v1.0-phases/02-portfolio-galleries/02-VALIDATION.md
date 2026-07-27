---
phase: 02
slug: portfolio-galleries
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-06
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright `@playwright/test` (e2e) + Vitest (unit) — both already scaffolded in Phase 1 |
| **Config file** | `playwright.config.ts`, `vitest.config.ts` (existing — no Wave 0 install needed) |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npm run build && npx playwright test && npx vitest run` |
| **Estimated runtime** | ~30-60 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run` (fast unit check on gallery query/data functions)
- **After every plan wave:** Run `npm run build && npx playwright test && npx vitest run` (full suite)
- **Before `/gsd:verify-work`:** Full suite must be green, plus a manual CMS walkthrough (Romane's routine-task check, see Manual-Only Verifications)
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-T1 | 02-01 | 1 | PORT-01/02/03 | T-02-01-IV | Wave 0 RED tests authored (listing/lightbox/statement e2e + query unit) | e2e + unit | `npx vitest run tests/unit/gallery-query.test.ts` (RED initially) | ✅ built here | ⬜ pending |
| 02-01-T3 | 02-01 | 1 | PORT-03, CMS-01 | T-02-01-IV | `getGallery` null-safe; schema enforces required bilingual alt + ≥1 image | unit | `npx vitest run tests/unit/gallery-query.test.ts` | ✅ 02-01-T1 | ⬜ pending |
| 02-03-T2 | 02-03 | 3 | PORT-01 | T-02-03-NULL | Gallery listing renders all migrated galleries in manual `orderRank` order | e2e | `npx playwright test tests/e2e/gallery.spec.ts -g "listing"` | ✅ 02-01-T1 | ⬜ pending |
| 02-03-T2 | 02-03 | 3 | PORT-03 | T-02-03-NULL | Bilingual artist statement renders on `/galleries/[slug]` and `/en/galleries/[slug]`, null-safe fallback | unit + e2e | `npx vitest run tests/unit/gallery-query.test.ts` + `npx playwright test tests/e2e/gallery.spec.ts -g "statement"` | ✅ 02-01-T1 | ⬜ pending |
| 02-03-T3 | 02-03 | 3 | PORT-01 | T-02-03-IV | Real content for all known projects seeded (unblocks the e2e data) | manual | N/A — content migration checkpoint | — | ⬜ pending |
| 02-04-T2 | 02-04 | 4 | PORT-02 | T-02-04-A11Y | Lightbox opens on click, navigates via prev/next buttons, arrow keys, touch swipe, closes and returns focus to trigger | e2e | `npx playwright test tests/e2e/gallery.spec.ts -g "lightbox"` | ✅ 02-01-T1 | ⬜ pending |
| 02-04-T3 | 02-04 | 4 | CMS-01 | T-02-01-IV | Romane can add/edit/reorder galleries and images in Sanity Studio without developer help | manual | N/A — see Manual-Only Verifications | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*Task IDs map to `{plan}-T{taskNumber}` within each PLAN.md. The e2e spec (`tests/e2e/gallery.spec.ts`) and unit spec (`tests/unit/gallery-query.test.ts`) are authored RED in 02-01-T1 and go GREEN as their production targets land in Plans 03/04 (and once content is seeded in 02-03-T3).*

---

## Wave 0 Requirements

- [ ] `tests/e2e/gallery.spec.ts` — covers PORT-01 (listing order), PORT-02 (lightbox open/nav/close/focus-return), PORT-03 (statement rendering, both locales) — **authored in 02-01 Task 1 (RED)**
- [ ] `tests/unit/gallery-query.test.ts` — covers `getGalleries()`/`getGallery(slug)` data-shape and null-safety (mirrors Phase 1's `getSiteSettings()` test pattern) — **authored in 02-01 Task 1 (RED)**
- [ ] Seed content: all known projects (≥ the full D-13 set) with multiple images and both-locale statements in the Sanity dataset — **02-03 Task 3 checkpoint** (e2e runs against this real data)

*No new framework install needed — Playwright and Vitest are already configured from Phase 1.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Romane can independently add a new gallery, upload/reorder images, and edit the bilingual statement in Sanity Studio | CMS-01 | Requires the actual non-technical end user completing a routine task unassisted — not automatable | 02-04 Task 3: have Romane log into Sanity Studio and create one new gallery entry end-to-end without developer assistance; confirm it appears correctly on the live site after rebuild |
| Lightbox touch-swipe navigation feels correct on a real mobile device | PORT-02 | Playwright can simulate touch events but real-device gesture feel/performance needs a manual check | 02-04 Task 3: open a gallery on an actual phone/tablet, swipe left/right through images, confirm smooth navigation and no accidental page-scroll |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
