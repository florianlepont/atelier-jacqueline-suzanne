---
phase: 13-nav-integration
reviewed: 2026-07-23T09:00:00Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - sanity/schemas/siteSettings.ts
  - src/lib/sanity.ts
  - src/lib/site-config.ts
  - src/components/SiteHeader.astro
  - src/layouts/BaseLayout.astro
  - src/components/HomeCarousel.astro
  - tests/e2e/site-header.spec.ts
  - tests/unit/site-config.test.ts
findings:
  critical: 0
  warning: 2
  info: 1
  total: 3
status: issues_found
---

# Phase 13: Code Review Report

**Reviewed:** 2026-07-23T09:00:00Z
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Summary

Reviewed the "Éditions" nav-link integration (EDN-01): a new `navLabels.editions` bilingual field on the `siteSettings` Sanity schema, its type/resolver wiring (`src/lib/sanity.ts`, `src/lib/site-config.ts`), and its rendering as the first `.nav-link` in the shared `<SiteHeader>` component, consumed identically by both call sites (`BaseLayout.astro` for About/Contact/gallery-detail, `HomeCarousel.astro` for the homepage). The actual phase-13 diff (commit `764aab0`) is small, consistent with the pre-existing `about`/`contact` pattern, and covered by passing unit (8/8) and e2e assertions.

The `diff_base` provided in config (`1786a68c…^`, a Phase 01 commit) predates all of these files' introduction and so does not produce a useful diff — the actual phase-13 change was located instead via `git log`/`git show` on the phase's real commits. No BLOCKER-level defects were found in the new code itself. Two WARNING-level defects were found by tracing the schema change to its two other consumers in the codebase: a pre-existing latent Studio-validation trap in `siteSettings.ts` (not introduced by this phase, but present in the file as submitted for review), and a genuine phase-13 omission — the content-completeness checklist for `siteSettings` was not updated to include the new `editions` label, unlike `about`/`contact`, which both have checklist entries.

## Warnings

### WR-01: Hidden legacy `navLabels.home`/`navLabels.galleries` fields still carry unfillable `required()` validation

**File:** `sanity/schemas/siteSettings.ts:100-139`
**Issue:** The `home` and `galleries` sub-fields of `navLabels` are marked `hidden: true` (removed from the Studio form entirely) but their `fr`/`en` string sub-fields still declare `validation: (rule) => rule.required()`. Sanity validates hidden fields the same as visible ones at publish time — a field that is required but cannot be edited via the Studio UI is an editing dead-end. The document's `initialValue` only pre-populates `navLabels.about`/`contact`/`editions`, not `home`/`galleries`, so if this singleton document is ever recreated from scratch (disaster recovery, dataset reset, migration script that doesn't special-case these obsolete keys), the editor will be unable to publish it: the hidden fields fail required-validation and there is no way to fill them in through the UI. This is only latent today because the already-published document predates the `hidden: true` flag and therefore already carries values for these fields, but it is a robustness trap for the next time this document needs to be created or repaired.
**Fix:** Since these fields are already described in a neighboring comment as "Obsolete text fields [that] stay addressable during migration," drop their validation rules (they mirror the pattern used by `about`/`contact`/`editions`, which correctly have no validation):
```ts
defineField({
  name: 'fr',
  title: 'French',
  type: 'string',
  // validation removed — field is hidden and obsolete, must not block publish
}),
```
Or, if the fields are truly dead, remove them from the schema entirely rather than keeping them hidden-but-required.

### WR-02: `siteSettings` completeness checklist was not updated for the new `navLabels.editions` field

**File:** `sanity/editorial/checks.ts:125-134` (consumer of the schema change reviewed in `sanity/schemas/siteSettings.ts`)
**Issue:** Phase 13 added `navLabels.editions` to the `siteSettings` schema and gave it exactly the same shape (optional bilingual object) as the pre-existing `navLabels.about` and `navLabels.contact` fields — both of which have dedicated entries in the editorial completeness checklist (`checks.ts` lines 129-130: `'Libellé À propos…'`, `'Libellé Contact…'`). No equivalent `'Libellé Éditions en français et en anglais'` entry was added for the new field, and `tests/unit/editorial-checks.test.ts`'s fixture for `siteSettings` (`navLabels: {about: localized, contact: localized}`, line 87) doesn't exercise it either. Romane's content-completeness dashboard (built from this checklist) will silently omit the new nav label from the fields it tracks, inconsistent with how `about`/`contact` are surfaced — this is a real gap the phase introduced by not updating this sibling file when adding the schema field.
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

## Info

### IN-01: e2e coverage for the Éditions nav link stops at home/about/contact — gallery-detail and legal pages are untested

**File:** `tests/e2e/site-header.spec.ts:118-145`
**Issue:** The `Éditions nav link (EDN-01, D-01, SC #1/#2)` test suite exercises `/`, `/en/`, `/about/`, `/en/about/`, `/contact/`, `/en/contact/` — all `BaseLayout` `variant="solid"` pages plus the homepage's `variant="transparent"` page. Since `<SiteHeader>` is a single shared component, the Éditions link necessarily also renders on gallery-detail pages (`headerVariant="transparent"`, via `BaseLayout`) and the legal pages (`mentions-legales`, `confidentialite`), but no assertion in this file (or elsewhere in the reviewed set) proves the link is present and correctly hrefed there. The existing 320px mobile-fit test does load `/galleries/silos/` but only checks for horizontal overflow, not for the Éditions link's presence/href.
**Fix:** Extend the `cases` array in the "Éditions nav link" `describe` block (or add a small dedicated test) to include at least one `variant="transparent"` gallery-detail path and one legal page, e.g. `{ path: '/galleries/silos/', editionsSegment: '/editions/' }`, to close the coverage gap for the one `BaseLayout` header variant/page family not currently exercised.

---

_Reviewed: 2026-07-23T09:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
