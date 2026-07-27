---
phase: 12
slug: data-fetch-layer-routes
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-22
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.9 (unit) + Playwright 1.61.1 (e2e) |
| **Config file** | `vitest.config.ts` (uses `astro/config`'s `getViteConfig` so `astro:i18n` resolves), `playwright.config.ts` |
| **Quick run command** | `npm run test:unit` |
| **Full suite command** | `npm run test:unit && npm run test:e2e` |
| **Estimated runtime** | ~30s (unit, no browser) + existing Playwright suite baseline (unmeasured for phase-12 additions specifically) |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:unit`
- **After every plan wave:** Run `npm run test:unit && npm run test:e2e`
- **Before `/gsd-verify-work`:** Full suite must be green, matching CI's existing blocking-gate structure (`.github/workflows/deploy.yml`)
- **Max feedback latency:** ~60 seconds (unit-test sampling; e2e reserved for wave boundaries)

---

## Phase Requirements → Test Map

*(seeded from RESEARCH.md's Validation Architecture; the planner assigns concrete Task IDs and reproduces these mappings in the Per-Task Verification Map below.)*

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| EDN-02 | Overview page lists each édition by title, lead photo, full statement, as a vertical list | unit + e2e | `vitest run tests/unit/edition-query.test.ts` (GROQ shape/order/filter, mirrors `gallery-query.test.ts`) + `playwright test tests/e2e/edition.spec.ts` (renders list, no truncation) | ❌ Wave 0 — both new files |
| EDN-03 | Detail page opens the full photo shoot in the existing gallery Lightbox | e2e | `playwright test tests/e2e/edition.spec.ts` (mirrors `gallery.spec.ts`'s lightbox describe block: click hero AND a grid thumb, verify counter/index, verify `[leadPhoto, ...images]` order) | ❌ Wave 0 |
| EDN-04 | Detail page shows a short description/statement | e2e | Same file — assert statement text present and differs FR vs EN (mirrors gallery detail's bilingual-statement test) | ❌ Wave 0 |
| EDN-06 | No price/availability/purchase affordance anywhere on overview or detail | e2e (negative assertion) + build-artifact grep guard | `playwright test` text-scan (no `€`, no case-insensitive "prix\|price\|acheter\|buy\|panier\|cart\|stock\|disponib") + optional `tests/scripts/verify-static-artifact.mjs` extension scanning `dist/editions/**/*.html` for the same forbidden strings | ❌ Wave 0 (net-new negative-assertion pattern for this codebase) |
| EDN-07 | Both overview and detail render correctly at fr root and `/en/` | e2e | `playwright test tests/e2e/edition.spec.ts` (goto both `/editions/` and `/en/editions/`, and both `/editions/{slug}/` and `/en/editions/{slug}/`) | ❌ Wave 0 |
| Success criterion 5 | Overview + detail URLs in `sitemap.xml`, both locales | unit + e2e | `vitest run tests/unit/static-routes.test.ts` (extend with edition path assertions, mirrors existing gallery assertion) + `playwright test tests/e2e/seo.spec.ts` (extend sitemap test to also assert `/editions/`) | Partial — extend existing files |

---

## Per-Task Verification Map

*To be completed by the planner once Task IDs are assigned in PLAN.md — reproduce each row above at task granularity.*

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| *(pending planning)* | | | | | | | | | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/unit/edition-query.test.ts` — covers EDN-02 (GROQ shape, ordering, filter correctness — édition has no `isVisible` field, filter is `publicationStatus == "published"` only, unlike gallery's coalesce pattern)
- [ ] `tests/e2e/edition.spec.ts` — covers EDN-02, EDN-03, EDN-04, EDN-06, EDN-07 (mirrors `tests/e2e/gallery.spec.ts` structure, with an added negative-assertion `describe('no commerce affordances')` block)
- [ ] Extend `tests/unit/static-routes.test.ts` — add an édition-path assertion case to the existing `localizedSitemapPaths` describe block (no new file needed)
- [ ] Extend `tests/e2e/seo.spec.ts` — add an édition-specific sitemap assertion to the existing "sitemap contains both languages and gallery pages" test
- [ ] Framework install: none — Vitest and Playwright are already configured and running in CI

*Consider also extending `tests/scripts/verify-static-artifact.mjs` (already a blocking CI/build-artifact check) with a dist-HTML grep guard for forbidden commerce strings under `dist/editions/` and `dist/en/editions/` — converts EDN-06's "zero pricing affordance" success criterion from a purely visual UAT check into a build-blocking automated one.*

---

## Manual-Only Verifications

*All phase behaviors have automated verification per the Phase Requirements → Test Map above.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
