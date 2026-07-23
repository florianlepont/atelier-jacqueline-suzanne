---
phase: 11-schema-content-model
reviewed: 2026-07-22T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - sanity/schemas/edition.ts
  - sanity/schemas/index.ts
  - sanity/schemas/structure.ts
findings:
  critical: 0
  warning: 3
  info: 5
  total: 8
status: issues_found
---

# Phase 11: Code Review Report

**Reviewed:** 2026-07-22T00:00:00Z
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Reviewed the new `edition` Sanity schema, its registration in `index.ts`, and the desk
`structure.ts` wiring that gives it an orderable list item. The new schema closely
mirrors the existing `gallery.ts` pattern (same locale-text helper, same three-state
publication workflow, same photo-array validation technique), which is good for
consistency, but that mirroring also means known workarounds documented in the file's
own comments were not applied consistently to every field that needed them. The most
notable gap: the code explicitly calls out a "Pitfall B" (an image field can pass
`required()` validation with only sub-field metadata and no real uploaded asset) and
fixes it for `leadPhoto` with `.assetRequired()`, but the same fix is never applied to
each member of the `images` array, leaving the exact gap the author had already
identified. There is also a data-model asymmetry — every other photo field in this
schema (and in `gallery.ts`) carries a `rights` (credit/copyright) sub-field, but the
new `leadPhoto` field does not, even though it is a real, independently-published image.
No security issues or crashes were found; all issues are schema-robustness /
consistency gaps that affect content integrity rather than runtime failures.

## Warnings

### WR-01: `images` array items are never checked for a real uploaded asset

**File:** `sanity/schemas/edition.ts:143-233`
**Issue:** The `leadPhoto` field is deliberately hardened against "Pitfall B" —
the comment at line 134 explains that `rule.required()` can pass on an image field
even when only its sub-fields (`alt`, `rights`) were populated and no asset was ever
uploaded, so `leadPhoto`'s validation chains `.assetRequired()` to close that gap
(line 137). The `images` array's per-item type (`defineArrayMember({type: 'image', ...})`,
lines 156-201) has no `validation` at all, and the parent array's `rule.custom`
(lines 204-232) only checks array length and the completeness of `alt`/`rights` on
each entry — it never verifies that an entry actually has an `asset` reference. An
editor can end up with an array item that has full alt text and full rights metadata
but no photo (e.g. an interrupted/failed upload, or a duplicated item whose asset was
cleared), and the document will still pass validation and publish, resulting in a
broken/missing image on the live édition photo-shoot gallery.
**Fix:** Either add `validation: (rule) => rule.required().assetRequired()` directly
on the array member, or extend the array-level custom validator to also flag items
missing an asset:
```ts
defineArrayMember({
  type: 'image',
  options: {hotspot: true},
  validation: (rule) => rule.required().assetRequired(),
  fields: [ /* ... */ ],
})
```

### WR-02: `leadPhoto` has no `rights`/credit field, unlike every other photo in the schema

**File:** `sanity/schemas/edition.ts:99-138`
**Issue:** Both `gallery.images[]` and `edition.images[]` require a `rights` sub-field
(type `imageRights`) alongside `alt` on every photo, per the documented convention
"Each image carries bilingual alt + rights, exactly as gallery does" (comment at
line 141). `leadPhoto` — the cover image used on the Éditions listing page and thus a
genuinely published, standalone photo — has no `rights` field whatsoever, so there is
no way to record or later display credit/copyright/usage terms for that specific
asset. This is an inconsistent content model: a photo that appears on the site with
no attached crediting metadata, in a project that otherwise builds tooling
(`CreditsManager`) specifically to manage photo credits.
**Fix:** Add a `rights` field to `leadPhoto`, matching the `images[]` array item shape:
```ts
defineField({
  name: 'rights',
  title: 'Crédits et droits',
  type: 'imageRights',
  initialValue: {
    credit: 'Romane Lepont',
    copyrightNotice: '© Romane Lepont — Tous droits réservés',
    usage: 'allRightsReserved',
    displayCredit: true,
  },
  validation: (rule) => rule.required().error('Ajouter les crédits et les droits.'),
}),
```

### WR-03: `dimensions.unit` is unrestricted free text despite the "typed, not free text" intent

**File:** `sanity/schemas/edition.ts:270-276`
**Issue:** The comment at line 234 states the format fields are "typed, structured
format fields -- not free text" (D-06/EDN-05), yet `unit` is a plain `string` field
with only an `initialValue: 'cm'` and no `options.list` constraining the values an
editor can type. An editor can enter arbitrary strings (`"CM"`, `"cm "`, `"pouces"`,
`"in"`, etc.), which will break any future frontend logic or i18n label lookup that
switches on the exact `unit` value, and defeats the "typed" intent stated in the
schema's own comments.
**Fix:** Constrain to a fixed set of accepted values, e.g.:
```ts
defineField({
  name: 'unit',
  title: 'Unité',
  type: 'string',
  initialValue: 'cm',
  options: {list: [{title: 'cm', value: 'cm'}, {title: 'in', value: 'in'}]},
  validation: (rule) => rule.required().error("L'unité est obligatoire."),
}),
```

## Info

### IN-01: `localeTextField` helper duplicated verbatim across schema files

**File:** `sanity/schemas/edition.ts:4-35`
**Issue:** The helper is a byte-for-byte copy of the one in `gallery.ts` (and
`siteSettings.ts`), acknowledged in the comment as intentional duplication because
"no shared schema-lib module exists yet". This is accepted current practice, but it
is still duplication that will drift (e.g. a future validation-message tweak applied
to one copy and forgotten in the others) — worth tracking as debt for the shared-lib
extraction mentioned in the comment.
**Fix:** Extract to `sanity/schemas/lib/localeTextField.ts` and import from both
`gallery.ts` and `edition.ts` next time either file is touched.

### IN-02: Redundant `publicationStatus` initial value at both document and field level

**File:** `sanity/schemas/edition.ts:43` and `sanity/schemas/edition.ts:62`
**Issue:** `initialValue: {publicationStatus: 'published'}` is set at the document
type level (line 43) and `initialValue: 'published'` is also set directly on the
`publicationStatus` field (line 62). Both agree today, but having the same default
declared twice is an easy way to introduce a silent mismatch later if only one of the
two is updated.
**Fix:** Keep only the field-level `initialValue` (which is the one Studio actually
reads for a single field) and drop the document-level `initialValue` object, or vice
versa — pick one source of truth.

### IN-03: `structure.ts` exclusion filter references type names that are never document types

**File:** `sanity/schemas/structure.ts:75-87`
**Issue:** The generic `S.documentTypeListItems()` filter excludes `'seo'` (and would
need to, hypothetically, exclude `'imageRights'`) to avoid double-listing — but both
`seo` and `imageRights` are `type: 'object'` schemas (see `sanity/schemas/seo.ts:6`
and `sanity/schemas/imageRights.ts:6`), so they can never appear in
`documentTypeListItems()` in the first place. The `'seo'` entry in the exclusion
array is dead/no-op code that could mislead a future maintainer into thinking `seo`
is a listable document type.
**Fix:** Drop `'seo'` from the exclusion array (or add a short comment clarifying
it's defensive/harmless for an object-type schema name).

### IN-04: Naming overlap between `leadPhoto` and the `images` field's "couverture" wording may confuse the non-technical editor

**File:** `sanity/schemas/edition.ts:99-105, 148-149`
**Issue:** `leadPhoto` is described as "Photo de couverture affichée dans la liste
des éditions" (cover photo for the listing), while the `images` array's description
also mentions "couverture" as one of the photo-shoot subjects ("couverture, pages
intérieures, détail de reliure/impression" — i.e., a photo of the physical book's
front cover). Since Romane (the non-technical maintainer this schema is built for)
will read both descriptions in the same form, the repeated word "couverture" in two
different senses (web listing cover vs. physical book cover) risks her uploading the
same photo to both fields or being unsure which field is which.
**Fix:** Rephrase the `images` description to avoid the word "couverture" in this
context, e.g. "façade du livre" or "photo du livre fermé", to disambiguate from
`leadPhoto`'s "photo de couverture".

### IN-05: Unsafe type assertions inside `rule.custom` validators

**File:** `sanity/schemas/edition.ts:210, 214-216`
**Issue:** The array validator casts each array item via `(image as {alt?: ...})` /
`(image as {rights?: ...})` without any runtime check that the value actually matches
that shape. Since `rule.custom` receives values typed as `unknown`/`any` by the
Sanity SDK, this pattern will silently return `undefined` (rather than throw) if the
document is unexpectedly malformed, which is safe here but is still a type-assertion
smell that hides real shape-mismatches instead of guarding against them. (Pre-existing
pattern, copied identically from `gallery.ts`.)
**Fix:** Consider a small runtime type guard (`typeof image === 'object' && image !== null`)
before assuming the shape, or centralize this validator logic in a shared helper that
can be typed once and reused by both `gallery.ts` and `edition.ts`.

---

_Reviewed: 2026-07-22T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
