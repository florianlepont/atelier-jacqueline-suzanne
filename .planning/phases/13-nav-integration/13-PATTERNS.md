# Phase 13: Nav Integration - Pattern Map

**Mapped:** 2026-07-23
**Files analyzed:** 5 (all modifications — no new files this phase)
**Analogs found:** 5 / 5 (self-referential: each file's own existing `about`/`contact` handling is the analog for its new `editions` handling)

This phase is unusual: every "analog" is the *same file* being modified, since the "Éditions" nav entry must exactly mirror the already-shipped "À propos"/"Contact" entries at every layer (component props, copy resolution, Sanity schema, call-site wiring). There are no external/different files to borrow from — copy-paste-and-extend the existing `about`/`contact` triplet pattern in each file below.

## File Classification

| Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/components/SiteHeader.astro` | component (presentational, zero-hydration) | request-response (build-time prop render) | itself — existing `aboutLabel`/`aboutHref` prop + `<a class="nav-link">` | exact |
| `src/lib/site-config.ts` (`resolveSiteCopy`) | utility (copy resolver) | transform | itself — existing `aboutLabel`/`contactLabel` resolution lines | exact |
| `sanity/schemas/siteSettings.ts` (`navLabels`) | model (Sanity schema) | CRUD (Studio-authored content) | itself — existing `about`/`contact` field defs (lines 139-157) + `initialValue.navLabels` (lines 69-72) | exact |
| `src/layouts/BaseLayout.astro` | controller/layout (call site) | request-response (build-time render) | itself — existing `aboutLabel`/`aboutHref` const + `<SiteHeader>` prop-pass (lines 108-111, 190-193) | exact |
| `src/components/HomeCarousel.astro` | component (call site) | request-response (build-time render) | itself — existing `aboutLabel`/`aboutHref` const + `<SiteHeader>` prop-pass (lines 68-71, 118-121) | exact |

## Pattern Assignments

### `src/components/SiteHeader.astro` (component, request-response)

**Analog:** itself, existing `about`/`contact` prop + markup pattern

**Props interface** (lines 14-31) — add `editionsLabel: string; editionsHref: string;` alongside the existing pair:
```ts
interface Props {
  variant: 'solid' | 'transparent';
  siteTitle: string;
  homeHref: string;
  aboutLabel: string;
  aboutHref: string;
  contactLabel: string;
  contactHref: string;
  instagramUrl: string;
  instagramLabel: string;
  instagramNewTabHint: string;
  logoBlackSrc: string;
  logoWhiteSrc: string;
}
```
Destructure block (lines 33-46) gains `editionsLabel, editionsHref,` — place it before `aboutLabel` in the destructure order to match D-01's visual-first placement in JSX below (order in destructuring is cosmetic but keep it consistent for readability).

**Core render pattern** (lines 55-57) — nav markup, insert the new `<a>` FIRST per D-01/UI-SPEC:
```astro
<nav class="site-nav" aria-label="Primary">
  <a href={aboutHref} class="nav-link">{aboutLabel}</a>
  <a href={contactHref} class="nav-link">{contactLabel}</a>
  {/* Instagram <a> unchanged, follows contact */}
</nav>
```
becomes:
```astro
<nav class="site-nav" aria-label="Primary">
  <a href={editionsHref} class="nav-link">{editionsLabel}</a>
  <a href={aboutHref} class="nav-link">{aboutLabel}</a>
  <a href={contactHref} class="nav-link">{contactLabel}</a>
  {/* Instagram <a> unchanged */}
</nav>
```
No new CSS class — `.nav-link` (lines 255-269) applies unchanged. Do NOT add a `.nav-link--editions` variant (UI-SPEC explicit non-goal).

**Mobile-fit CSS to re-measure** (lines 271-335) — the `@media (max-width: 767px)` block (277-292) and `@media (max-width: 359px)` block (298-335) are the exact rules that governed the 3-link case (About/Contact/Instagram); re-verify live with the 4th link present. If D-03's abbreviation is needed, it is scoped ONLY inside the `<359px` block, applied only to the Éditions `<a>` text content (e.g. conditionally render `Éd.` vs `editionsLabel` past a breakpoint is not possible in pure CSS — this must be a CSS-only visual truncation, or a second always-rendered abbreviated span toggled via a media-query-driven `display`/`content` trick; simplest robust approach used elsewhere on the site: render both full and abbreviated labels as sibling spans and toggle visibility via CSS, mirroring no existing precedent exactly — flag this as the one genuinely novel bit of markup this phase may introduce, confined to `SiteHeader.astro`'s Éditions `<a>` only, per D-03's explicit "deliberate, scoped exception").

**No active-state pattern exists** — confirmed absent for `about`/`contact` (no `aria-current`, no active class anywhere in this file). Éditions gets none either, per Claude's Discretion + UI-SPEC.

---

### `src/lib/site-config.ts` — `resolveSiteCopy()` (utility, transform)

**Analog:** itself, existing `aboutLabel`/`contactLabel` lines

**Core pattern** (lines 21-28):
```ts
export function resolveSiteCopy(settings: SiteSettings | null, locale: Locale) {
  return {
    aboutLabel: settings?.navLabels?.about?.[locale] || (locale === 'en' ? 'About' : 'À propos'),
    contactLabel: settings?.navLabels?.contact?.[locale] || 'Contact',
    instagramUrl: DEFAULT_INSTAGRAM_URL,
    instagramLabel: DEFAULT_INSTAGRAM_LABEL,
  }
}
```
Add, mirroring `contactLabel`'s simpler single-fallback-string shape (not `aboutLabel`'s locale-branching form, since "Éditions" is identical in both locales per Claude's Discretion):
```ts
editionsLabel: settings?.navLabels?.editions?.[locale] || 'Éditions',
```

**Type dependency:** `SiteSettings` type (imported from `./sanity`, line 1) will need a matching `navLabels.editions?: {fr: string; en: string}` shape — check `src/lib/sanity.ts`'s `SiteSettings` type definition and extend it identically to how `about`/`contact` are typed there (not read in this pass; grep `navLabels` in `src/lib/sanity.ts` before implementing).

---

### `sanity/schemas/siteSettings.ts` — `navLabels` field (model, CRUD)

**Analog:** itself, existing `about`/`contact` field defs

**Initial value** (lines 68-73):
```ts
initialValue: {
  navLabels: {
    about: {fr: 'À propos', en: 'About'},
    contact: {fr: 'Contact', en: 'Contact'},
  },
},
```
Add `editions: {fr: 'Éditions', en: 'Éditions'},` alongside.

**Field definition pattern** (lines 139-157, the `about`/`contact` object fields — note these use the terser inline `{name, title, type}` shape, NOT the `localeStringField()` helper used elsewhere in this file, so match that terser shape exactly for consistency with its immediate siblings):
```ts
defineField({
  name: 'contact',
  title: 'Lien Contact',
  type: 'object',
  fields: [
    defineField({name: 'fr', title: 'Français', type: 'string'}),
    defineField({name: 'en', title: 'Anglais', type: 'string'}),
  ],
}),
```
Add immediately after, as a third sibling field:
```ts
defineField({
  name: 'editions',
  title: 'Lien Éditions',
  type: 'object',
  fields: [
    defineField({name: 'fr', title: 'Français', type: 'string'}),
    defineField({name: 'en', title: 'Anglais', type: 'string'}),
  ],
}),
```
Note: unlike `localeStringField()`'s fields (used for `siteTitle`/`footerText`), these `about`/`contact` sub-fields have no `.required()` validation — match that (unvalidated, optional) for `editions` too, consistent with its two siblings.

---

### `src/layouts/BaseLayout.astro` (layout/call site, request-response)

**Analog:** itself, existing `aboutLabel`/`aboutHref`/`contactLabel`/`contactHref` consts + `<SiteHeader>` prop pass

**Imports** (lines 6, 8, 10) — already present, no new imports needed:
```ts
import { getRelativeLocaleUrl } from 'astro:i18n';
import { resolveSiteCopy } from '../lib/site-config';
import SiteHeader from '../components/SiteHeader.astro';
```

**Core pattern** (lines 65, 106-111):
```ts
const siteCopy = resolveSiteCopy(siteSettings, locale);
// ...
const homeHref = getRelativeLocaleUrl(locale, '');
const aboutLabel = siteCopy.aboutLabel;
const aboutHref = getRelativeLocaleUrl(locale, 'about');
const contactLabel = siteCopy.contactLabel;
const contactHref = getRelativeLocaleUrl(locale, 'contact');
```
Add, in the same block, positioned before `aboutLabel`/`aboutHref` to match D-01's nav-order intent in the source too:
```ts
const editionsLabel = siteCopy.editionsLabel;
const editionsHref = getRelativeLocaleUrl(locale, 'editions');
```

**Prop-pass to `<SiteHeader>`** (lines 186-193):
```astro
<SiteHeader
  ...
  aboutLabel={aboutLabel}
  aboutHref={aboutHref}
  contactLabel={contactLabel}
  contactHref={contactHref}
  ...
/>
```
Add `editionsLabel={editionsLabel}` / `editionsHref={editionsHref}` before the `aboutLabel`/`aboutHref` pair.

---

### `src/components/HomeCarousel.astro` (component/call site, request-response)

**Analog:** itself, identical pattern to `BaseLayout.astro` above (comment on line 63 explicitly states "Matches BaseLayout.astro's aboutLabel/contactLabel/aboutHref/contactHref")

**Props interface** (lines 40-41) — add `editionsLabel: string; editionsHref: string;` alongside:
```ts
aboutLabel: string;
contactLabel: string;
```

**Core pattern** (lines 62-71):
```ts
const homeHref = getRelativeLocaleUrl(locale, '');
// Matches BaseLayout.astro's aboutLabel/contactLabel/aboutHref/contactHref
// ...
const aboutLabel = siteCopy.aboutLabel;
const aboutHref = getRelativeLocaleUrl(locale, 'about');
const contactLabel = siteCopy.contactLabel;
const contactHref = getRelativeLocaleUrl(locale, 'contact');
```
Add `editionsLabel`/`editionsHref` identically, same positioning.

**Prop-pass to `<SiteHeader>`** (lines 114-121):
```astro
<SiteHeader
  ...
  aboutLabel={aboutLabel}
  aboutHref={aboutHref}
  contactLabel={contactLabel}
  contactHref={contactHref}
  ...
>
```
Add `editionsLabel={editionsLabel}` / `editionsHref={editionsHref}` before the `aboutLabel`/`aboutHref` pair. `</SiteHeader>` closes at line 153 (this call site uses the named `extra` slot for the carousel/grid mode-toggle — do not disturb that).

**Explicit non-goal reminder for this file specifically:** do NOT wire `getEditions()`/`getEdition()` into this file's carousel/grid data fetch — this phase only touches the `<SiteHeader>` prop pass shown above (Phase 11 D-13 / UI-SPEC non-goals section).

---

## Shared Patterns

### Bilingual label triplet (schema -> resolver -> layout consts -> component props)
**Source:** the existing `about`/`contact` chain across all 5 files above
**Apply to:** every file in this phase, in this order:
1. `sanity/schemas/siteSettings.ts` — add `navLabels.editions` field + initial value
2. `src/lib/site-config.ts` — add `editionsLabel` to `resolveSiteCopy()` return
3. `src/layouts/BaseLayout.astro` AND `src/components/HomeCarousel.astro` (both, independently) — compute `editionsLabel`/`editionsHref` consts, pass as props
4. `src/components/SiteHeader.astro` — accept the two new props, render `<a class="nav-link">` first in `.site-nav`

### Route href resolution
**Source:** `getRelativeLocaleUrl(locale, 'about')` / `getRelativeLocaleUrl(locale, 'contact')` (both call sites)
**Apply to:** `const editionsHref = getRelativeLocaleUrl(locale, 'editions');` — the `/editions/` (fr) and `/en/editions/` (en) routes already exist from Phase 12, no route creation needed here.

### Live-measured mobile fit (not a formula)
**Source:** `SiteHeader.astro` lines 271-335, established Phase 7/10
**Apply to:** re-verify `@media (max-width: 767px)` and `@media (max-width: 359px)` blocks with the 4th nav link live in a real/emulated narrow viewport before finalizing; only reach for D-03's abbreviation if the existing trims are provably insufficient at <359px.

## No Analog Found

None — every file in scope has a direct, exact same-file analog (the existing `about`/`contact` handling). No cross-codebase search for an external analog was needed or productive for this phase.

## Metadata

**Analog search scope:** `src/components/SiteHeader.astro`, `src/lib/site-config.ts`, `sanity/schemas/siteSettings.ts`, `src/layouts/BaseLayout.astro`, `src/components/HomeCarousel.astro` (all 5 files this phase modifies — read in full or via targeted grep+read)
**Files scanned:** 5 (no broader Glob/Grep sweep needed — CONTEXT.md/UI-SPEC.md already named exact files and line numbers, confirmed accurate by direct read)
**Pattern extraction date:** 2026-07-23
