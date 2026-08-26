---
phase: 24-cross-linking-contact-cta
verified: 2026-08-26T20:21:21Z
status: passed
score: 12/12 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Phase 24: Cross-Linking & Contact CTA Verification Report

**Phase Goal:** Visitors browsing Portfolio galleries and Éditions get two small navigation improvements — a way to move from a gallery to its associated Édition (closing the missing reverse direction of the v1.3 gallery↔édition cross-link), and a contact CTA at the end of every gallery's and édition's photo sequence, standing in for a sales flow that doesn't exist yet.
**Verified:** 2026-08-26T20:21:21Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Visitor on a cross-linked gallery detail page sees a link to its Édition and can navigate to it | ✓ VERIFIED | `dist/galleries/silos/index.html` contains a real `<a class="gallery-detail__related" href="/editions/silos/">Voir l'édition « Silos »</a>` anchor (confirmed by a fresh `npm run build` in this session, not trusted from SUMMARY). `tests/e2e/gallery.spec.ts` EDN-12 test (`gallery reverse edition cross-link (EDN-12)`) re-run live in this session: 42/42 pass, including the hard `expect(foundHref !== null, ...).toBe(true)` presence assertion and an actual `.click()` + `toHaveURL(/\/editions\/[^/]+\/?$/)` navigation check. |
| 2 | Gallery with no associated Édition shows no broken/empty/dead-end element | ✓ VERIFIED | Built artifact grep confirms `gallery-detail__related` anchor is present on exactly 1 of 6 gallery pages (`silos`) and absent (0 matches) on `adult`, `brume`, `paysage`, `the-victorian-tea-room`, `trousseau`. `GalleryDetailBody.astro` uses a `{relatedLink && (...)}` conditional render with no fallback markup — no empty box possible. |
| 3 | Visitor reaching the end of a gallery's and an édition's photo sequence sees a contact CTA and can click through | ✓ VERIFIED | `.gallery-detail__contact-cta` and `.edition-detail__contact-cta` render unconditionally, last child of their respective `__content` div, both live re-run in this session: `tests/e2e/gallery.spec.ts` "gallery contact CTA (CONT-04)" block (2/2 pass) and `tests/e2e/edition.spec.ts` "editions contact CTA (CONT-04)" block (3/3 pass) assert href, visible text, French/English copy, and computed styling. |
| 4 | Both features render correctly, no regressions, at phone (≤767px) and desktop/tablet (≥768px) | ✓ VERIFIED | Live re-run of both full e2e spec files in this session: `gallery.spec.ts` 42/42 pass, `edition.spec.ts` 30/30 pass — including dual-viewport assertions (390×844 / 1280×900) in both blocks, the D-09 two-weight guard, and the pre-existing full regression suite for both page types. Plus a recorded human UAT sign-off (24-05-SUMMARY.md): developer's exact resume-signal response was "approved", covering sections A (desktop gallery), B (phone gallery), C (édition both widths, D-09 judgment call), D (no-regression sweep) — no issues or caveats reported. |

**Score:** 4/4 ROADMAP success criteria verified

### Plan-Level Must-Haves (all 5 plans)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 5 | `sanity/schemas/gallery.ts` carries an optional `relatedEdition` reference to one édition (D-01) | ✓ VERIFIED | `grep -n "relatedEdition\|relatedCollection" sanity/schemas/gallery.ts` shows the field (`type: 'reference'`, `to: [{type: 'edition'}]`, group `relatedCollection`, no validation rule — optional). |
| 6 | `getGalleries()` carries dereferenced `relatedEdition {title, slug}` intact; absent/null/partial yields no link data, never partial (D-02) | ✓ VERIFIED | `src/lib/sanity.ts` GROQ projections (`GALLERIES_QUERY`, `GALLERY_BY_SLUG_QUERY`) both append `relatedEdition->{title, "slug": slug.current}`. `src/lib/sanity-validation.ts` tri-state block (lines 235-245) resolves to `{title,slug}` / `null` / `undefined` and pushes `relatedEdition.removed` on partial dereference. `getRelatedEditionLink()` additionally guards against empty title/slug. Unit tests for all three layers re-run live: 117/117 pass across `related-edition.test.ts`, `related-gallery.test.ts`, `sanity-validation.test.ts`, `gallery-query.test.ts`, `edition-query.test.ts`, `page-models.test.ts`, `e2e-content-fragility.test.ts`. |
| 7 | `getEditions()` never carries a stray `relatedEdition` field (shared-base leak guard) | ✓ VERIFIED | `sanitizeEditionDocument` destructures `relatedEdition: _relatedEdition` out of the shared base and `void`s it (`grep -n "relatedEdition: _relatedEdition"` / `"void _relatedEdition"` each match exactly 1 line); a dedicated leak-guard unit test passes. |
| 8 | Both detail models emit a locale-correct contact CTA href/label; label is identical between gallery and édition per locale (D-06); hrefs use the base-aware URL builder | ✓ VERIFIED | `src/lib/page-models.ts`: single `CONTACT_CTA_LABEL: Record<Locale,string>` map consumed identically (`CONTACT_CTA_LABEL[locale]`) by both `buildGalleryDetailModel` and `buildEditionDetailModel`; both hrefs built via `getRelativeLocaleUrl(locale, 'contact')` (grep confirms exactly 2 call sites, not a literal string). |
| 9 | Reverse cross-link renders at top of gallery content area, conditionally, correct styling | ✓ VERIFIED | `GalleryDetailBody.astro` renders `.gallery-detail__related` as first child of `.gallery-detail__content`, conditional on `relatedLink`, with the bordered treatment (`border: 2px solid currentColor`, `:focus-visible` ring) specified in UI-SPEC. |
| 10 | Contact CTA renders unconditionally as last child of the gallery's and édition's content area, styled per sketch 018 Variant B | ✓ VERIFIED | Both `GalleryDetailBody.astro` and `EditionDetailBody.astro` render the CTA zone/rule/anchor/arrow as the last child, unconditional, with pink hairline (`border-top: 1px solid var(--pink-600)`), 20px Unbounded anchor, `translateX(4px)` hover/focus arrow nudge — matched exactly against plan spec text. |
| 11 | D-09: existing `.edition-detail__related` rules stay byte-identical when the CTA is added | ✓ VERIFIED | `git diff 47899e5..HEAD -- src/components/EditionDetailBody.astro` shows the CTA addition is purely additive — zero deletions/modifications inside the pre-existing `.edition-detail__related` rule range (confirmed directly in this session, not just per the plan's stated acceptance criterion). |
| 12 | Romane can set the new "Édition liée" field herself in the deployed Studio | ✓ VERIFIED | Schema field is a plain Studio-editable reference field (confirmed present in `sanity/schemas/gallery.ts`); the developer's own first-person account (24-05-SUMMARY.md) reports using the Studio directly to pair `silos`↔`silos` and running `npm --prefix sanity run deploy`; corroborated by the actually-published `relatedEdition: {slug: "silos", title: "Silos"}` value reaching the live build in this session's fresh `npm run build`. |

**Score:** 12/12 must-haves verified (0 present-but-behavior-unverified, 0 overrides)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `sanity/schemas/gallery.ts` | `relatedEdition` field + `relatedCollection` group | ✓ VERIFIED | Present, matches plan spec exactly. |
| `src/lib/sanity.ts` | `Gallery.relatedEdition` type + projections | ✓ VERIFIED | Present in both `GALLERIES_QUERY` and `GALLERY_BY_SLUG_QUERY`; `slug.current == $slug` parameter binding intact (ASVS V5). |
| `src/lib/sanity-validation.ts` | `relatedEdition` sanitization + édition exclusion | ✓ VERIFIED | Tri-state block + `relatedEdition.removed` issue + `_relatedEdition` destructure/void. |
| `src/lib/related-edition.ts` | `getRelatedEditionLink()` + `RelatedEditionLink` | ✓ VERIFIED | New parallel file, `related-gallery.ts` untouched (confirmed via `git diff 47899e5..HEAD -- src/lib/related-gallery.ts` = no changes). |
| `src/lib/page-models.ts` | `relatedLink`, `contactCtaHref`, `contactCtaLabel` on both models | ✓ VERIFIED | All fields present, wired, and covered by unit tests. |
| `src/components/GalleryDetailBody.astro` | related-link markup/CSS + CTA markup/CSS | ✓ VERIFIED | Both present, wired to props, styled per spec. |
| `src/components/EditionDetailBody.astro` | CTA markup/CSS, existing related-link untouched | ✓ VERIFIED | CTA present; D-09 no-touch boundary confirmed via diff. |
| `tests/e2e/gallery.spec.ts` / `tests/e2e/edition.spec.ts` | new describe blocks for EDN-12/CONT-04/D-09 | ✓ VERIFIED | All blocks present and passing live in this session. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `GALLERIES_QUERY` | `sanitizeGalleryDocument` → `Gallery.relatedEdition` | GROQ projection → sanitizer tri-state | ✓ WIRED | Confirmed by unit tests + fresh build producing the real `silos` anchor. |
| `getRelatedEditionLink(gallery.relatedEdition, locale)` | `GalleryDetailModel.relatedLink` | direct call in `buildGalleryDetailModel` | ✓ WIRED | `grep -c "getRelatedEditionLink" src/lib/page-models.ts` = 2 (import + call). |
| `CONTACT_CTA_LABEL` + `getRelativeLocaleUrl(locale,'contact')` | both detail models | direct assignment | ✓ WIRED | Confirmed identical values consumed by both builders. |
| `buildGalleryDetailModel` → `GalleryDetailPage.astro` → `GalleryDetailBody.astro` | prop chain | direct prop threading | ✓ WIRED | `model.relatedLink`/`model.contactCtaHref`/`model.contactCtaLabel` all threaded through. |
| `GalleryGrid` close → contact CTA | DOM order | last child of `.gallery-detail__content` / `.edition-detail__content` | ✓ WIRED | Confirmed by `compareDocumentPosition` e2e assertions passing live. |

### Behavioral Spot-Checks (live re-run this session, not from SUMMARY)

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Unit suite for phase 24 files | `npx vitest run tests/unit/related-edition.test.ts tests/unit/related-gallery.test.ts tests/unit/sanity-validation.test.ts tests/unit/gallery-query.test.ts tests/unit/edition-query.test.ts tests/unit/page-models.test.ts tests/unit/e2e-content-fragility.test.ts` | 117/117 passed | ✓ PASS |
| Typecheck | `npm run typecheck` | 0 errors, 0 warnings, 1 pre-existing unrelated hint | ✓ PASS |
| Lint | `npm run lint` | clean | ✓ PASS |
| Build (default base) | `npm run build` | 31 pages built, `silos` gallery carries the real anchor, no other gallery does | ✓ PASS |
| Static artifact verification | `npm run test:artifact` | "Static artifact verified (31 HTML files, base /)" | ✓ PASS |
| Gallery e2e suite | `npx playwright test tests/e2e/gallery.spec.ts --project=chromium` | 42/42 passed | ✓ PASS |
| Édition e2e suite | `npx playwright test tests/e2e/edition.spec.ts --project=chromium` | 30/30 passed | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|-------------|-----------------|-------------|--------|----------|
| EDN-12 | 24-01, 24-02, 24-03, 24-05 | Reverse gallery→édition cross-link | ✓ SATISFIED | Full data layer, render model, render, hard e2e presence assertion, and one real published pairing (`silos`↔`silos`) all confirmed live in this session. |
| CONT-04 | 24-02, 24-03, 24-04, 24-05 | Contact CTA at end of gallery/édition photo sequence | ✓ SATISFIED | CTA renders unconditionally on both page types, both locales, confirmed by live e2e re-run. |
| UI-03 | 24-03, 24-04, 24-05 | Dual-viewport correctness, no regressions | ✓ SATISFIED | Dual-viewport e2e assertions (live re-run) plus recorded human UAT "approved" sign-off. |

No orphaned requirements found — REQUIREMENTS.md's Phase 24 traceability table lists exactly EDN-12, CONT-04, UI-03, and all three are declared across the phase's plan frontmatter `requirements` fields.

**Note (informational, not a gap):** `.planning/REQUIREMENTS.md`'s checkboxes (`- [ ]`) and its Traceability table (`Status: Pending`) for EDN-12/CONT-04/UI-03 have not been updated to reflect completion, even though `ROADMAP.md` correctly marks Phase 24 `[x]` complete and this verification confirms all three requirements are satisfied in the codebase. This is a documentation-freshness gap in a tracking doc, not a code or functional gap — it does not affect the phase's goal achievement and is flagged here only for housekeeping visibility.

### Anti-Patterns Found

None. Scanned all phase-24-modified files (`src/lib/related-edition.ts`, `src/lib/page-models.ts`, `src/lib/sanity.ts`, `src/lib/sanity-validation.ts`, `src/components/GalleryDetailBody.astro`, `src/components/GalleryDetailPage.astro`, `src/components/EditionDetailBody.astro`, `src/components/EditionDetailPage.astro`, `sanity/schemas/gallery.ts`) for `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER`/empty-implementation patterns. Zero matches. (Unrelated "coming soon" strings exist elsewhere in `page-models.ts` for the About/Éditions-empty-state features — pre-existing, out of scope for this phase, not stubs introduced by it.)

### Human Verification Required

None outstanding. Phase 24's own workflow included two blocking `checkpoint:human-verify` tasks (24-05 Task 1: Sanity content authoring + Studio deploy; Task 3: UI-03 cross-viewport sign-off), both of which are recorded as completed with explicit developer approval ("approved", no issues) in `24-05-SUMMARY.md`. This verification independently corroborated the content-authoring claim (fresh build shows the real `silos` anchor) and the automated half of UI-03 (live e2e dual-viewport re-run), so no further human verification is requested.

### Housekeeping Note (non-blocking)

`deferred-items.md` (written by the phase's own execution) records a stray `stash@{0}` entry left in the shared `refs/stash` from a self-corrected mistake during Task 2's verification pass. It does not affect any phase-24 code or test outcome (confirmed: working tree was clean, restored file was byte-identical) but is flagged here for orchestrator/human follow-up per that file's own recommendation (`git stash drop stash@{0}`, explicit index, only after confirming no other active worktree still needs `stash@{1}`/`stash@{2}`).

### Gaps Summary

No gaps found. All 4 ROADMAP success criteria and all 12 plan-level must-haves are independently verified against the live codebase in this session — not merely accepted from SUMMARY.md narrative. Every unit test, typecheck, lint, build, artifact check, and full e2e spec file referenced above was re-executed directly in this verification pass with real, observed exit codes and output, matching (and in the D-09 diff case, exceeding) what the SUMMARY claimed.

---

*Verified: 2026-08-26T20:21:21Z*
*Verifier: Claude (gsd-verifier)*
