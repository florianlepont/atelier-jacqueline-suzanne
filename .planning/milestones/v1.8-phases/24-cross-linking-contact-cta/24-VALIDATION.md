---
phase: 24
slug: cross-linking-contact-cta
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-08-26
---

# Phase 24 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.9 (unit) + Playwright 1.61.1 (e2e) — both already configured, both BLOCKING CI gates |
| **Config file** | `vitest.config.ts` (root), `playwright.config.ts` (root) |
| **Quick run command** | `npm run test:unit` (Vitest, fast — seconds) |
| **Full suite command** | `npm run test:unit && npm run test:e2e` (matches project's configured `test_command`: `npm run typecheck && npm run test:unit && npm run test:e2e`) |
| **Estimated runtime** | ~90 seconds (unit) / ~5 minutes (e2e, both `chromium` + `webkit-mobile` projects) — consistent with the most recent measured phase on this same suite (Phase 20) |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:unit` (fast, seconds)
- **After every plan wave:** Run `npm run typecheck && npm run test:unit && npm run test:e2e`
- **Before `/gsd-verify-work`:** Full suite must be green, plus manual UAT at both breakpoints (≤767px and ≥768px) per UI-03 — this project's documented history of phone-specific regressions leaking into desktop (v1.6 HOME-16) makes automated e2e assertions alone insufficient
- **Max feedback latency:** 90 seconds

---

## Per-Task Verification Map

*Task IDs are assigned by the planner (not yet known at validation-strategy time). Each PLAN.md task must map to one of the rows below via its requirement ID.*

| Requirement | Behavior | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists |
|-------------|----------|------------|-----------------|-----------|-------------------|-------------|
| EDN-12 | `getRelatedEditionLink()` (or generalized helper) returns correct fr/en href+text for a populated `relatedEdition`, `null` for missing/malformed | — | N/A | unit | `npx vitest run tests/unit/related-gallery.test.ts` (extend, or a sibling file) | ✅ existing file to extend, or ❌ new sibling file — Wave 0 |
| EDN-12 | `GALLERIES_QUERY`/`GALLERY_BY_SLUG_QUERY` project `relatedEdition->{...}`; a populated value passes through `getGalleries()`/`getGallery()` intact; a null/absent value resolves without error | V5 (ASVS L1) | GROQ `$slug` parameter binding preserved (no string interpolation) — `src/lib/sanity.ts` existing pattern, lines 317-322/347-352 | unit | `npx vitest run tests/unit/gallery-query.test.ts` (extend, mirrors `edition-query.test.ts`'s existing `relatedGallery` assertions at lines 189-194, 196-216, 229-246) | ✅ existing file to extend |
| EDN-12 | `sanitizeGalleryDocument()` correctly sanitizes/strips a malformed `relatedEdition`, and `sanitizeEditionDocument()` does NOT leak a stray `relatedEdition` field onto `Edition` (shared-base sanitizer regression guard) | — | Shared-base sanitizer strip-list stays in sync — `src/lib/sanity-validation.ts` | unit | new assertions in `tests/unit/gallery-query.test.ts` or `sanity-validation.test.ts` if one exists (confirm at Wave 0) | ❌ verify/create at Wave 0 |
| EDN-12 | A gallery detail page with a populated `relatedEdition` shows a visible, correctly-hrefed related-édition link at the top of the content area, on both mobile and desktop viewports; a gallery with no `relatedEdition` shows no such link (D-02) | — | N/A | e2e | `npx playwright test tests/e2e/gallery.spec.ts` (extend, mirrors `edition.spec.ts`'s "editions related-gallery cross-link (EDN-08)" describe block at line 623-670) | ✅ existing file to extend |
| CONT-04 | The contact CTA renders at the end of every gallery's and every édition's photo sequence (universally, no conditional logic), links to `/contact/`, and matches sketch 018 Variant B's confirmed styling, on both mobile (≤767px) and desktop/tablet (≥768px) | — | N/A | e2e | `npx playwright test tests/e2e/gallery.spec.ts tests/e2e/edition.spec.ts` (extend both) | ✅ existing files to extend |
| CONT-04 | On édition pages, the existing top related-gallery link keeps its current subtle treatment unchanged (D-09) while the new bottom CTA renders with its heavier weight — no unintended style bleed between the two | — | N/A | e2e | `npx playwright test tests/e2e/edition.spec.ts` (extend the existing related-gallery describe block, add a sibling assertion for the new CTA's distinct styles) | ✅ existing file to extend |
| UI-03 | No regression to gallery/édition existing layout at either viewport class after both features land — explicit running success criterion, not deferred | — | N/A | e2e regression | Re-run full existing `gallery.spec.ts` + `edition.spec.ts` suites unmodified sections, plus the PORT-06 scroll-track assertion (`tests/e2e/gallery.spec.ts` line 835-849) re-verified with the new CTA content present | ✅ existing coverage; extend the PORT-06 test or add a sibling assertion confirming `scrollHeight - innerHeight >= 300` still holds with CTA content added |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] Confirm whether a dedicated `tests/unit/sanity-validation.test.ts` file exists to extend for the shared-sanitizer regression guard — **resolved during planning:** the file exists on disk; `24-01-PLAN.md` Task 2 extends its `describe('gallery and edition sanitizers')` block with the leak-guard assertions (RESEARCH.md Pitfall 1)
- [x] Decide (Claude's Discretion, per CONTEXT.md) whether the reverse-link helper is a generalized `related-gallery.ts` extension or a new sibling file — **resolved during planning:** `24-01-PLAN.md`'s `<discretion_resolutions>` block locks in a parallel file, `src/lib/related-edition.ts` with its own `RelatedEditionLink` type; `related-gallery.ts` stays untouched (out-of-scope per REQUIREMENTS.md), so the unit test file is a new `tests/unit/related-edition.test.ts`, not an extension
- [x] Framework install: none — Vitest and Playwright are already fully configured for this exact class of change (mirrors `edition-query.test.ts` and `edition.spec.ts`'s existing EDN-08 coverage almost exactly)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual match to sketch 018 Variant B (hairline rule weight/color, 20px Unbounded 600 CTA text, spacing rhythm before the rule) | CONT-04 | Visual design fidelity to a confirmed sketch reference is not fully automatable beyond class/text assertions | Compare the implemented CTA side-by-side with `.planning/sketches/018-gallery-edition-contact-cta/index.html` (Variant B) at both a phone-width and a desktop-width viewport. |
| Overall "clean, no dead-end" feel of both features together on an édition page (existing subtle top related-link + new heavier bottom CTA both present) | UI-03 | Confirms the two elements read as intentionally different weights rather than a styling inconsistency — a judgment call, not a pass/fail assertion | Load a real édition page with both a populated `relatedGallery` and the new CONT-04 CTA visible; visually confirm the top link stays subtle and the bottom CTA reads as the heavier "closing" moment per D-09. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies — confirmed by gsd-plan-checker across all 5 plans (24-01 through 24-05)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify — plans run 2-3 tasks each, each with its own verify command
- [x] Wave 0 covers all MISSING references — all three Wave 0 items resolved above
- [x] No watch-mode flags
- [x] Feedback latency < 90s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
