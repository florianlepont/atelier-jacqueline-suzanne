# Phase 11: Schema & Content Model - Pattern Map

**Mapped:** 2026-07-22
**Files analyzed:** 3 (1 new, 2 modified)
**Analogs found:** 3 / 3

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `sanity/schemas/edition.ts` (NEW) | model (Sanity schema-as-code document type) | CRUD (Studio-authored document) | `sanity/schemas/gallery.ts` | exact (explicit mirror target per CONTEXT.md) |
| `sanity/schemas/index.ts` (MODIFIED) | config (schema registry) | CRUD (registration only) | itself — existing `gallery`/`exhibition` entries | exact |
| `sanity/schemas/structure.ts` (MODIFIED) | config (Studio desk structure) | CRUD (UI wiring only) | itself — existing `gallery` `orderableDocumentListDeskItem` entry | exact |

No front-end/route/component files in this phase (explicit phase boundary — Phase 12 consumes this schema).

## Pattern Assignments

### `sanity/schemas/edition.ts` (NEW) — model, CRUD

**Analog:** `sanity/schemas/gallery.ts` (276 lines, read in full)

**Imports pattern** (gallery.ts lines 1-4):
```typescript
import {defineArrayMember, defineField, defineType} from 'sanity'
import {orderRankField} from '@sanity/orderable-document-list'
import {HERO_COLOR_OPTIONS, HeroColorInput} from './HeroColorInput'
import {PublishedPageLinks} from './PublishedPageLinks'
```
For `edition.ts`: drop the `HeroColorInput`/`HERO_COLOR_OPTIONS` import (D-13 — no `heroColor`/`showOnHomePage`). Drop `PublishedPageLinks` too (see Shared Patterns > Published-page links below — it's gallery-hardcoded and out of scope here per Pitfall D). Keep `defineArrayMember`, `defineField`, `defineType`, `orderRankField`.

**Locale-text helper — copy inline verbatim** (gallery.ts lines 17-47):
```typescript
/**
 * Locale-aware text pair, copied verbatim from `siteSettings.ts`'s
 * `localeTextField` helper (no shared schema-lib module exists yet to import
 * it from — see 02-PATTERNS.md's guidance to duplicate the shape inline).
 */
function localeTextField(name: string, title: string, group?: string) {
  return defineField({
    name,
    title,
    type: 'object',
    group,
    description: 'Renseigner les deux langues avant de publier.',
    options: {columns: 2},
    fields: [
      defineField({
        name: 'fr',
        title: 'Français',
        type: 'text',
        rows: 5,
        validation: (rule) => rule.required().error('Le texte français est obligatoire.'),
      }),
      defineField({
        name: 'en',
        title: 'Anglais',
        type: 'text',
        rows: 5,
        validation: (rule) => rule.required().error('Le texte anglais est obligatoire.'),
      }),
    ],
  })
}
```
Reuse this exact shape for `edition.ts`'s `statement` field (D-10). Comment the duplication the same way gallery.ts comments its own duplication from `siteSettings.ts` — this project's documented convention (no shared schema-lib module yet).

**Document scaffold + groups** (gallery.ts lines 49-60):
```typescript
export const gallery = defineType({
  name: 'gallery',
  title: 'Collection photo',
  type: 'document',
  initialValue: {publicationStatus: 'published', showOnHomePage: true},
  groups: [
    {name: 'publication', title: 'Publication', default: true},
    {name: 'content', title: 'Présentation'},
    {name: 'homepage', title: 'Accueil'},
    {name: 'photos', title: 'Photos'},
    {name: 'seo', title: 'SEO'},
  ],
```
For `edition`: `initialValue: {publicationStatus: 'published'}` (drop `showOnHomePage` — D-13). Groups: drop `homepage`; add a `format` group per D-06/Pattern 2 in RESEARCH.md, e.g.:
```typescript
groups: [
  {name: 'publication', title: 'Publication', default: true},
  {name: 'content', title: 'Présentation'},
  {name: 'photos', title: 'Photos'},
  {name: 'format', title: 'Détails du format'},
  // no 'seo' group unless édition gets its own SEO field — check with gallery's seo field usage below
],
```

**publicationStatus field — copy verbatim shape** (gallery.ts lines 62-79):
```typescript
defineField({
  name: 'publicationStatus',
  title: 'Statut de la collection',
  type: 'string',
  group: 'publication',
  description:
    '« En préparation » reste dans Sanity, « Publiée » apparaît sur le site, « Archivée » est conservée mais retirée du site.',
  initialValue: 'published',
  options: {
    layout: 'radio',
    list: [
      {title: 'En préparation', value: 'preparation'},
      {title: 'Publiée sur le site', value: 'published'},
      {title: 'Archivée', value: 'archived'},
    ],
  },
  validation: (rule) => rule.required().error('Choisir le statut de la collection.'),
}),
```
Reuse verbatim for `edition.ts` (D-07) — only change the `title`/`description` wording from "collection" to "édition" if desired (discretionary copy).

**title / slug fields — copy verbatim shape** (gallery.ts lines 94-112):
```typescript
defineField({
  name: 'title',
  title: 'Nom de la collection',
  type: 'string',
  group: 'content',
  validation: (rule) => rule.required().error('Le nom de la collection est obligatoire.'),
}),
defineField({
  name: 'slug',
  title: 'Adresse de la page',
  type: 'slug',
  group: 'content',
  description:
    'Cliquer sur « Générer » après avoir saisi le nom. À modifier uniquement avant la première publication.',
  options: {source: 'title'},
  validation: (rule) => rule.required().error("L'adresse de la page est obligatoire."),
}),
```
Direct mirror for `edition` (D-08/D-09) — plain string `title`, slug sourced from title.

**images array pattern — copy structure, repurpose content per D-05** (gallery.ts lines 135-226):
```typescript
defineField({
  name: 'images',
  title: 'Photos de la collection',
  type: 'array',
  group: 'photos',
  description: '...',
  // D-01/D-02/CMS-01: `alt` fields are attached directly onto an `image`-
  // type array member (rather than nesting `image` inside a separate
  // `object` wrapper type) so Sanity Studio still recognizes each array
  // item as an image and preserves native multi-file drag-and-drop
  // upload — one dropped file becomes one array item automatically.
  of: [
    defineArrayMember({
      type: 'image',
      options: {hotspot: true},
      fields: [
        defineField({ name: 'alt', title: "Description de l'image (accessibilité)", type: 'object',
          options: {columns: 2},
          validation: (rule) => rule.required().error("La description de l'image est obligatoire."),
          fields: [
            defineField({ name: 'fr', title: 'Français', type: 'string',
              validation: (rule) => rule.required().error('La description française est obligatoire.') }),
            defineField({ name: 'en', title: 'Anglais', type: 'string',
              validation: (rule) => rule.required().error('La description anglaise est obligatoire.') }),
          ],
        }),
        defineField({
          name: 'rights', title: 'Crédits et droits', type: 'imageRights',
          initialValue: { credit: 'Romane Lepont', copyrightNotice: '© Romane Lepont — Tous droits réservés',
            usage: 'allRightsReserved', displayCredit: true },
          validation: (rule) => rule.required().error('Ajouter les crédits et les droits.'),
        }),
      ],
    }),
  ],
  options: {layout: 'grid'},
  validation: (rule) => rule.custom((images) => { /* ... same custom validator, adapted messaging ... */ }),
}),
```
For `edition.ts`: keep the array-member `image`-with-`alt`+`rights` shape and the parent-level `rule.custom()` validator technique verbatim (this is the precedent Pitfall B/Pattern 2 in RESEARCH.md tells you to reuse for `dimensions` too). Change only the `title`/`description` copy to reflect D-05 ("Photos de l'objet imprimé — couverture, pages intérieures, détail de reliure/impression" rather than gallery's photographic-subject wording). Do NOT treat `images[0]` as a cover (D-04 — `leadPhoto` is separate, see below).

**orderRankField — copy verbatim, change type param** (gallery.ts line 229):
```typescript
{...orderRankField({type: 'gallery'}), hidden: true},
```
For `edition.ts`: `{...orderRankField({type: 'edition'}), hidden: true}` (D-12).

**seo field** (gallery.ts line 230):
```typescript
defineField({name: 'seo', title: 'SEO & partage', type: 'seo', group: 'seo'}),
```
Not mentioned in CONTEXT.md decisions for édition — CONTEXT.md's discretion section doesn't call this out either way. Since RESEARCH.md's Recommended Project Structure and field list never mentions an `seo` field for `edition`, and no requirement (CMS-04/EDN-05) calls for it, the safe default is to omit it unless the planner decides otherwise — flag as an open item for the plan, not locked here.

**preview() block — adapt, not verbatim** (gallery.ts lines 232-275):
Gallery's preview does hero-color lookup and homepage-visibility subtitle logic that doesn't apply to `edition` (D-13 has no `heroColor`/`showOnHomePage`). Reuse only the `hasUnpublishedDraft`/`publicationStatus` status-label logic and the `media` select-from-first-image idea — but since D-04 gives `edition` a dedicated `leadPhoto`, use `media: 'leadPhoto'` instead of `images.0`. Minimal adapted shape:
```typescript
preview: {
  select: {
    id: '_id',
    title: 'title',
    media: 'leadPhoto',
    publicationStatus: 'publicationStatus',
  },
  prepare({id, title, media, publicationStatus}) {
    const hasUnpublishedDraft = typeof id === 'string' && id.startsWith('drafts.')
    const status =
      publicationStatus === 'archived' ? 'Archivée'
      : publicationStatus === 'preparation' ? 'En préparation'
      : hasUnpublishedDraft ? 'Modifications non publiées'
      : 'Publiée'
    return {title: title || 'Édition sans nom', subtitle: status, media}
  },
},
```

**New (not in gallery.ts): `leadPhoto` field** — see RESEARCH.md Pattern 3 for the exact `defineField` shape (`type: 'image'`, `options: {hotspot: true}`, bilingual required `alt`, `validation: rule.required().assetRequired()`). No existing analog in this repo for a single dedicated cover-image field — this is genuinely new surface, built from the gallery per-image `alt` shape but as a singular field rather than an array member.

**New (not in gallery.ts): `format` group fields (`pageCount`, `printRun`, `dimensions`)** — see RESEARCH.md Pattern 2 for the exact `defineField` shapes, including the parent-level `rule.custom()` validator on `dimensions` (mirrors the *technique* used by gallery's `images` array validator above, applied to a new field). No existing analog for a structured multi-field numeric group in this repo; RESEARCH.md's Pattern 2 code block is the concrete source to copy.

---

### `sanity/schemas/index.ts` (MODIFIED) — config, CRUD (registration)

**Analog:** itself (existing `gallery`/`exhibition` entries)

**Current full file** (index.ts lines 1-19):
```typescript
import {siteSettings} from './siteSettings'
import {homePage} from './homePage'
import {gallery} from './gallery'
import {aboutPage} from './aboutPage'
import {exhibition} from './exhibition'
import {seo} from './seo'
import {imageRights} from './imageRights'
import {contactPage} from './contactPage'

export const schemaTypes = [
  siteSettings,
  homePage,
  aboutPage,
  contactPage,
  gallery,
  exhibition,
  seo,
  imageRights,
]
```
**Required edit:** add `import {edition} from './edition'` after the `gallery` import, and insert `edition,` into `schemaTypes` immediately after `gallery,` (matching RESEARCH.md's Code Examples section, which already shows this exact diff).

---

### `sanity/schemas/structure.ts` (MODIFIED) — config, CRUD (Studio UI wiring)

**Analog:** itself (existing `gallery` `orderableDocumentListDeskItem` entry, lines 54-60)

**Current relevant excerpt** (structure.ts lines 1-11, 54-60, 61-78):
```typescript
import type {StructureResolver} from 'sanity/structure'
import {orderableDocumentListDeskItem} from '@sanity/orderable-document-list'
import {
  CalendarIcon,
  CogIcon,
  EnvelopeIcon,
  HomeIcon,
  ImagesIcon,
  TagsIcon,
  UserIcon,
} from '@sanity/icons'
import {CreditsManager} from '../editorial/CreditsManager'
...
      orderableDocumentListDeskItem({
        type: 'gallery',
        title: 'Collections photo',
        icon: ImagesIcon,
        S,
        context,
      }),
      S.listItem()
        .title('Crédits et droits')
        .id('credits-manager')
        .icon(TagsIcon)
        .child(S.component(CreditsManager).id('credits-manager').title('Crédits et droits')),
      S.documentTypeListItem('exhibition').title('Agenda / Expositions').icon(CalendarIcon),
      ...S.documentTypeListItems().filter(
        (listItem) =>
          ![
            'siteSettings',
            'homePage',
            'aboutPage',
            'contactPage',
            'gallery',
            'exhibition',
            'seo',
          ].includes(listItem.getId() ?? ''),
      ),
```
**IMPORTANT CORRECTION to RESEARCH.md's Code Example:** RESEARCH.md's "Wiring the Studio desk item" example suggests `icon: TagsIcon` for the new édition desk item — but `TagsIcon` is **already imported and used** by the `Crédits et droits` list item (line 64) in this same file. Reusing it for `edition` would create two visually-identical icons in the desk list, defeating the "avoid reusing ImagesIcon so Studio nav visually distinguishes the two content types" rationale RESEARCH.md itself gives. **Pick a different, unused `@sanity/icons` export** for `edition` (e.g. `BookIcon` or `DocumentIcon`) and add it to the existing `@sanity/icons` import block.

**Required edit** (insert immediately after the `gallery` `orderableDocumentListDeskItem` block, per D-14):
```typescript
orderableDocumentListDeskItem({
  type: 'edition',
  title: 'Éditions',
  icon: BookIcon, // or another distinct, not-already-used @sanity/icons export
  S,
  context,
}),
```
Add `'edition'` to the exclusion-filter array (currently lines 69-77) so it isn't double-listed by `S.documentTypeListItems()`.

---

## Shared Patterns

### Bilingual `{fr, en}` field shape
**Source:** `sanity/schemas/gallery.ts` lines 22-47 (`localeTextField` helper) and lines 154-178 (per-image `alt` inline shape)
**Apply to:** `edition.ts`'s `statement` field (via copied `localeTextField` helper) and `leadPhoto`/`images[].alt` fields (inline shape, both sub-fields `required()`).

### `imageRights` reuse
**Source:** `sanity/schemas/imageRights.ts` (full file, unchanged) — `type: 'imageRights'` referenced from `gallery.ts` line 182 and `index.ts` line 7/17.
**Apply to:** `edition.ts`'s `images[].rights` field — import nothing new, just reference `type: 'imageRights'` (it's globally registered via `index.ts`, same as gallery does).

### `publicationStatus` editorial workflow
**Source:** `sanity/schemas/gallery.ts` lines 62-79.
**Apply to:** `edition.ts` — copy verbatim (D-07), do not model on `exhibition.ts`'s plainer shape (RESEARCH.md's explicitly-rejected alternative).

### Orderable-document-list (schema + desk halves)
**Source:** schema half `sanity/schemas/gallery.ts` line 229; desk half `sanity/schemas/structure.ts` lines 54-60.
**Apply to:** `edition.ts` (`orderRankField({type: 'edition'})`, hidden) AND `structure.ts` (`orderableDocumentListDeskItem({type: 'edition', ...})`) — both halves are required together, neither alone satisfies D-12/D-14.

### Nested-object / image-asset validation gap (Sanity-specific gotcha, not this-repo-specific but demonstrated here)
**Source:** `sanity/schemas/gallery.ts` lines 197-225 (`images` array's parent-level `rule.custom()` validator) — the *technique* to replicate for `edition.ts`'s `dimensions` object field, per RESEARCH.md Pitfall B / Pattern 2. Per-field `required()` alone inside a nested object is insufficient in Sanity Studio; pair with a parent-level `rule.custom()` check. For `leadPhoto`, use `rule.required().assetRequired()` (RESEARCH.md Pattern 3), not `required()` alone.

### Published-page links — DO NOT reuse as-is
**Source:** `sanity/schemas/PublishedPageLinks.tsx` lines 5-8 — `pageUrl()` hardcodes the path segment `galleries/${slug}/`:
```typescript
function pageUrl(locale: 'fr' | 'en', slug: string) {
  const base = SITE_PREVIEW_URL.endsWith('/') ? SITE_PREVIEW_URL : `${SITE_PREVIEW_URL}/`
  return `${base}${locale === 'en' ? 'en/' : ''}galleries/${slug}/`
}
```
This component is gallery-specific by construction, not generic. Per RESEARCH.md Pitfall D and CONTEXT.md's discretion note, the recommended default is to **omit** `PublishedPageLinks` wiring from `edition.ts` in this phase (no Phase-12 route exists yet to link to) and revisit in Phase 12 once the `/editions/{slug}/` route ships (would require generalizing `pageUrl()` to accept a path-segment param, or duplicating the component with an `editions/` path — a Phase 12 decision, not Phase 11's).

## No Analog Found

| File/Field | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `leadPhoto` field shape | model field | CRUD | No existing single-dedicated-cover-image field in this repo (gallery uses "first array item = cover" convention, explicitly rejected for edition by D-04). Built from RESEARCH.md Pattern 3, not copied from an existing file. |
| `format` group (`pageCount`/`printRun`/`dimensions`) | model field group | CRUD | No existing structured multi-field numeric group in this repo. Built from RESEARCH.md Pattern 2, not copied from an existing file. |

## Metadata

**Analog search scope:** `sanity/schemas/` directory (gallery.ts, imageRights.ts, exhibition.ts referenced, structure.ts, index.ts, PublishedPageLinks.tsx, HeroColorInput referenced)
**Files scanned:** 6 (gallery.ts, imageRights.ts, structure.ts, index.ts, PublishedPageLinks.tsx partial, CONTEXT.md/RESEARCH.md for this phase)
**Pattern extraction date:** 2026-07-22
