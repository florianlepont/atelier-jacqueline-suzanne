---
phase: 13-nav-integration
reviewed: 2026-07-23T11:04:07Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - sanity/schemas/siteSettings.ts
  - src/components/HomeCarousel.astro
  - src/components/SiteHeader.astro
  - src/layouts/BaseLayout.astro
  - src/lib/sanity.ts
  - src/lib/site-config.ts
  - tests/e2e/site-header.spec.ts
  - tests/unit/site-config.test.ts
findings:
  critical: 0
  warning: 3
  info: 2
  total: 5
status: issues_found
---

# Phase 13: Code Review Report

**Reviewed:** 2026-07-23T11:04:07Z
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Summary

This is a fresh, superseding pass across the full current file scope (the phase's two shipped plans: 13-01 wired a new "Éditions" nav link through `siteSettings`/`SiteHeader`/both call sites; 13-02 is the gap-closure fix for a 360-390px mobile header wrap regression). A prior `13-REVIEW.md` existed for this phase before the gap-closure plan landed; its findings were independently re-verified against the current code rather than carried over blindly.

Verification performed (not just read-through):
- Diffed the actual phase commits (`764aab0`, `3b7f2ac`) against their parents to isolate exactly what changed, rather than re-litigating pre-existing code the phase didn't touch.
- Ran `npm run build`, then `npx playwright test tests/e2e/site-header.spec.ts` (39/39 pass) and `npx vitest run tests/unit/site-config.test.ts` (8/8 pass).
- Ran `npx astro check` and `npx eslint` on the in-scope files — clean.
- Wrote ad-hoc Playwright sweeps (not part of the shipped suite; written, run, and removed during this review) across viewport widths and a page the shipped gap-closure regression block does *not* sample — 401-767px in 20-50px steps, and the full 320/360/374/375/390/767px matrix against `/galleries/silos/` — to check whether the `flex-wrap: nowrap` change could have introduced a horizontal-overflow or two-row-wrap regression at an untested width/page. Found none: the CSS fix generalizes correctly.
- Traced the `siteSettings.ts` schema change forward into its other consumer outside the given file list, `sanity/editorial/checks.ts` (Romane's content-completeness dashboard), since a schema-shape review that stops at the schema file itself would miss a real, verifiable regression this change causes there.

Net result: no Critical/Blocker-level defects. The change itself (nav link wiring + CSS wrap fix) is small, correctly scoped, and well tested. The findings below are either a genuine cross-file omission this phase should have caught, a Studio-content-authoring risk this phase's new field inherits from an existing pattern, or minor coverage/duplication gaps.

## Warnings

### WR-01: `siteSettings` content-completeness checklist was not updated for the new `navLabels.editions` field

**File:** `sanity/editorial/checks.ts:125-134` (consumer of the schema change made in `sanity/schemas/siteSettings.ts`, in scope for this review)
**Issue:** Phase 13 added `navLabels.editions` to the `siteSettings` schema with exactly the same shape (optional bilingual object) as the pre-existing `navLabels.about` and `navLabels.contact` fields — both of which have dedicated entries in this completeness-checklist function (lines 129-130). No equivalent `'Libellé Éditions…'` entry was added for the new field, and the corresponding test fixture (`tests/unit/editorial-checks.test.ts:87`, `navLabels: {about: localized, contact: localized}`) doesn't exercise `editions` either — confirmed by reading both files directly, this gap is still present in the current tree. Romane's content-completeness dashboard is built from this function; it will silently omit the new nav label from what it tracks, so if she leaves `editions` blank (which the schema currently permits with no validation — see WR-02), the dashboard gives her no indication that anything is missing.
**Fix:**
```ts
if (schemaType === 'siteSettings') {
  const nav = record(value.navLabels)
  return [
    {label: 'Nom du site en français et en anglais', complete: localized(value.siteTitle)},
    {label: 'Libellé Éditions en français et en anglais', complete: localized(nav.editions)},
    {label: 'Libellé À propos en français et en anglais', complete: localized(nav.about)},
    {label: 'Libellé Contact en français et en anglais', complete: localized(nav.contact)},
    {label: 'Copyright du pied de page', complete: localized(value.footerText)},
    ...seoChecks(value.defaultSeo),
  ]
}
```

### WR-02: `navLabels.editions` (and its `about`/`contact` siblings) accept an empty string per-locale with no CMS-level validation

**File:** `sanity/schemas/siteSettings.ts:158-166`
**Issue:** The new `editions` field is defined as a plain `fr`/`en` string pair with **no** `validation: (rule) => rule.required()`, matching the pre-existing (unvalidated) `about`/`contact` fields but unlike `home`/`galleries` two blocks above (lines 100-139, both required) and unlike `siteTitle`/`footerText` (built via the file's own `localeStringField` helper, which always attaches `.required()`). A non-technical editor — per `CLAUDE.md`, Romane is the intended day-to-day maintainer of exactly this singleton — can save `editions.en = ""` while `editions.fr` is populated, with no Studio-side warning. Correctness today is rescued entirely by `resolveSiteCopy`'s `||` fallback (`src/lib/site-config.ts:23`), which happens to fall back to the same literal (`'Éditions'`) for both locales — but that is an accident of this field's current fallback value, not something enforced where the mistake would actually happen (the Studio form). Combined with WR-01 (no checklist entry either), there is currently no layer — schema validation or completeness dashboard — that would catch a half-filled `editions` value before it ships.
**Fix:**
```ts
defineField({
  name: 'editions',
  title: 'Lien Éditions',
  type: 'object',
  fields: [
    defineField({
      name: 'fr',
      title: 'Français',
      type: 'string',
      validation: (rule) => rule.required().error('La version française est obligatoire.'),
    }),
    defineField({
      name: 'en',
      title: 'Anglais',
      type: 'string',
      validation: (rule) => rule.required().error('La version anglaise est obligatoire.'),
    }),
  ],
}),
```

### WR-03: Hidden legacy `navLabels.home`/`navLabels.galleries` fields still carry unfillable `required()` validation

**File:** `sanity/schemas/siteSettings.ts:100-139`
**Issue:** Pre-existing (not introduced by phase 13, but present in the file as submitted for this review and directly adjacent to the new `editions` field). `home` and `galleries` are marked `hidden: true` (removed from the Studio form) but their `fr`/`en` sub-fields still declare `validation: (rule) => rule.required()`. Sanity validates hidden fields the same as visible ones at publish time. The document's `initialValue` (lines 68-74) only pre-populates `about`/`contact`/`editions`, not `home`/`galleries` — so if this singleton is ever recreated from scratch (dataset reset, disaster recovery, a migration script that doesn't special-case these obsolete keys), the new document will fail required-validation on two fields the Studio UI gives no way to fill in, blocking publish entirely. Latent only because the already-published document predates the `hidden: true` flag and so already carries values.
**Fix:** Drop the validation on these two obsolete, hidden sub-fields (or remove the fields outright, per the neighboring comment calling them "obsolete... stay addressable during migration"):
```ts
defineField({name: 'fr', title: 'French', type: 'string'}), // no .required() — hidden/obsolete
```

## Info

### IN-01: `navLabels` sub-fields hand-roll the `{fr, en}` shape the file's own `localeStringField` helper already implements

**File:** `sanity/schemas/siteSettings.ts:92-168`
**Issue:** `localeStringField(name, title, hidden, group, description)` at the top of the file already builds the exact `{fr: string, en: string}` object shape used throughout. `navLabels.home`, `.galleries`, `.about`, `.contact`, and now `.editions` all re-implement that shape by hand as five near-identical `defineField` blocks instead of extending/reusing the helper. Adding a 5th field was a natural opportunity to consolidate; instead it extends the duplication.
**Fix:** Parameterize `localeStringField` to support per-field `required` toggling and nesting under `navLabels`, and replace the five hand-rolled blocks with calls to it.

### IN-02: e2e coverage gaps for the Éditions link and the mobile wrap fix on gallery-detail/legal pages

**File:** `tests/e2e/site-header.spec.ts:95-131, 168-195`
**Issue:** Two related coverage gaps, both confirmed against the currently shipped test file:
1. The "Éditions nav link (EDN-01, D-01, SC #1/#2)" block (lines 168-195) only exercises `/`, `/en/`, `/about/`, `/en/about/`, `/contact/`, `/en/contact/`. `SiteHeader` also renders on gallery-detail pages (`headerVariant="transparent"`) and the legal pages (`mentions-legales`, `confidentialite`) via the same `BaseLayout` path, but no assertion proves the Éditions link/href there. I confirmed via the built `dist/` output that the link is in fact present and correctly hrefed on `/galleries/silos/` and `/mentions-legales/` — so there's no live defect — but the e2e contract doesn't itself demonstrate that.
2. The gap-closure "single-row fit across the mobile range (EDN-01, D-02, SC #5)" block (lines 95-131) — the actual regression test for the 360-390px wrap this phase's Plan 13-02 fixed — only samples `/about/` (solid variant) and `/` (transparent variant), never a gallery-detail page (also transparent variant). I independently verified via an ad-hoc Playwright probe that `/galleries/silos/` passes the same row-alignment check across all six sampled widths, so the fix does generalize — but the shipped suite doesn't itself prove it for that page family.
**Fix:** Add a gallery-detail path (e.g. `/galleries/silos/`) and a legal-page path to the `cases`/`pages` arrays in both describe blocks, so the two regression contracts are self-evidently complete without relying on out-of-band verification.

---

_Reviewed: 2026-07-23T11:04:07Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
