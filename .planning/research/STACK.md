# Stack Research

**Domain:** Adding a new content showcase ("Éditions") to an existing Astro + Sanity static site
**Researched:** 2026-07-22
**Confidence:** HIGH

> Scope note: this file was originally written for the v1.0 milestone (bilingual portfolio + future e-commerce) and has been rewritten for the v1.3 "Éditions" milestone specifically — see `<milestone_context>` in this research task. The v1.0 stack decisions it previously described (Astro 7.0.6 static + GitHub Pages/OVH + Sanity + astro:i18n, e-commerce deferred to v1.x) are unchanged, validated, shipped, and documented in `CLAUDE.md`'s "Technology Stack" section — they are not re-litigated here. This file now answers a narrower question: what, if anything, does the Éditions showcase feature need on top of that stack.

## Recommended Stack

### Core Technologies

**No new core technology is needed.** Éditions is a new *content type* and a new *route pair* on the existing stack, not a new capability. Astro 7.0.6 (static output) + Sanity (Content Lake + Studio) + `astro:i18n` already do everything this milestone requires:

| Technology | Version | Purpose | Why No Change Needed |
|------------|---------|---------|-----------------------|
| Astro | 7.0.6 (unchanged) | Static overview + detail routes for Éditions | Éditions needs exactly the shape already shipped for galleries: a static list page plus a static `[slug].astro` detail page, per locale, resolved at build time from Sanity data. `src/pages/galleries/[slug].astro` and `src/pages/en/galleries/[slug].astro` are the direct templates to copy for `src/pages/editions/[slug].astro` / `src/pages/en/editions/[slug].astro`. No server rendering, no new adapter, no new route type is introduced. |
| Sanity Content Lake + Studio | `@sanity/client` 7.23.0, `sanity` ^6.4.0 (unchanged) | New `edition` document schema, self-serve editing | Sanity already models exactly this shape for galleries (locale-object text fields, an `image` array with per-image alt/rights, drag-reorder via `@sanity/orderable-document-list`). Éditions needs the same schema *shape* plus a few extra scalar fields (format details) — no new Sanity capability, plugin, or plan tier required. |
| `@sanity/image-url` | 2.1.1 (unchanged) | Build responsive/cropped image URLs for the lead photo + full shoot | Identical usage to the existing gallery image rendering — no new image-handling code needed. |
| `astro:i18n` (Astro 7 core) | — (unchanged) | fr (root `/editions`) / en (`/en/editions`) routing | Same routing convention already used for `/galleries` and `/en/galleries`; Éditions is just two more route trees under the same locale split, plus one new main-nav label. |

### Supporting Libraries

**None new.** Reuse what's already installed:

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@sanity/orderable-document-list` | ^2.0.8 (already in `sanity/package.json`) | Manual drag-reorder of éditions in the Studio list, same as galleries' `orderRank` | Add `{...orderRankField({type: 'edition'}), hidden: true}` to the new `edition` schema exactly as `gallery.ts` does. Reuse the pattern rather than adding a competing ordering mechanism (e.g. a manual `order` number field Romane would have to maintain by hand). |
| `@sanity/locale-fr-fr` | ^1.2.33 (already in `sanity/package.json`) | French Studio UI | Applies automatically to the new schema; no action needed. |

### Development Tools

No new dev tooling. Vitest and Playwright already gate CI (`.github/workflows/deploy.yml`); extend their existing suites with new specs for the Éditions overview/detail pages rather than introducing a new test runner or convention.

## Installation

```bash
# No installation step required for this milestone.
# Éditions is additive schema + additive Astro routes on the existing
# dependency set (astro, @sanity/client, @sanity/image-url, sanity,
# @sanity/orderable-document-list) — nothing new to add to package.json
# in either the root app or sanity/.
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|--------------------------|
| A distinct `edition` Sanity document type, modeled on but separate from `gallery` | A `type`-discriminator field added to the existing `gallery` schema (one document type covering both) | Only if Éditions and galleries needed a shared listing/query surface (e.g. mixed homepage carousel). This milestone explicitly keeps Éditions separate from the photography portfolio (its own nav item, deliberately absent from the homepage), so a distinct document type is simpler for Romane to navigate in Studio and avoids conditional fields cluttering one schema. |
| Three named scalar fields for format details (`pageCount`, `printRun`, `dimensions`), grouped in one `format` object | A single freeform `specs: {key, value}[]` array | Freeform key/value arrays are worth reaching for only when the field set is genuinely open-ended. It isn't here — PROJECT.md names exactly three fixed facts (page count, print run, dimensions), so named fields are both simpler for Romane to fill in correctly and enough for the stated need. |
| Keep pricing/stock fields out of the `edition` schema entirely this milestone | Add `price`/`stock` fields now but hide them from the front end | Explicitly rejected: PROJECT.md scopes pricing/checkout to the deferred v1.x shop milestone ("No pricing, no checkout, no cart in this milestone"). Adding dormant commerce fields now creates schema debt and a false impression of shop-readiness before the Stripe/stock-tracking design — which needs request-time compute this static host doesn't have — is actually decided. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|--------------|
| Any e-commerce library (Stripe SDK, cart-state library, a "commerce kit" Sanity plugin) | Out of scope for this milestone by explicit product decision. Commerce also requires request-time compute (checkout session creation, webhook handling) that the current static Astro output + OVH zero-compute hosting cannot provide — that hosting/adapter question is deliberately deferred to the v1.x shop milestone, not something to pre-solve while building a showcase. | Pure static showcase pages, no commerce dependency at all. |
| A new or alternate CMS, or a Sanity "product/catalog" plugin | Unnecessary — Sanity already holds galleries in the same shape Éditions needs (title, locale statement, ordered image array with alt/rights). Introducing a second content-modeling paradigm for one new document type fragments the Studio experience for a non-technical editor who already knows the gallery pattern. | One more `defineType` schema file (`edition.ts`) alongside `gallery.ts`, registered in the same `schemaTypes` array and in the desk `structure.ts`. |
| A new hosting adapter, SSR/edge integration, or the Cloudflare/Node adapter | Nothing in this milestone requires request-time compute — overview and detail pages are fully resolvable at build time from published Sanity content, identical to every other route on the site today. Adding an adapter now would be scope creep against the "near-zero cost, static-only" constraint, and against the already-documented decision to keep the one thing that ever motivated compute (e-commerce) deferred. | Continue `output: 'static'`, no adapter, same GitHub Pages → OVH deploy path. |
| Decomposing "dimensions" into separate `width`/`height` number fields | Photobook/zine dimensions are conventionally written and read as one localized measurement string (e.g. "21 × 29,7 cm", sometimes with an orientation note) — forcing separate numeric fields loses the printer's actual convention and adds two fields Romane must fill in for no query benefit this milestone needs. | A single `dimensions: string` free-text field. |

## Stack Patterns by Variant

**If Éditions later needs its own homepage teaser or cross-linking with galleries (not in this milestone's scope):**
- Add a `showOnHomePage`-style boolean field to `edition.ts`, mirroring `gallery.ts`'s existing field, rather than inventing a new visibility mechanism.
- Because consistency in the Studio (same field name/behavior across document types) reduces Romane's cognitive load — she already knows what that toggle does from editing galleries.

**If Éditions later needs pricing/stock (the deferred v1.x shop milestone):**
- Re-evaluate hosting/compute at that time (already flagged in CLAUDE.md's "Deferred to v1.x" section) — do not pre-add `stripe`, cart libraries, or stock fields now.
- Because request-time stock re-validation genuinely needs compute this static host doesn't have; solving it prematurely for a showcase-only milestone adds risk and complexity with no user-facing benefit today.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `astro@7.0.6` | `@sanity/client@7.23.0`, `@sanity/image-url@2.1.1` | Already proven together in production for galleries/about/contact/homepage — no version bump needed for Éditions, since no new API surface of either package is required (same `sanityClient.fetch` + `urlFor()` usage). |
| `sanity@^6.4.0` (Studio) | `@sanity/orderable-document-list@^2.0.8` | Already proven together for `gallery`'s `orderRank` field; the same `orderRankField({type: 'edition'})` call works unchanged for a new document type — `structure.ts`'s desk structure just needs an orderable list item added for `edition` next to the existing `gallery` entry. |

## Sanity Schema Modeling Considerations (self-serve, non-technical editor)

These are the concrete design choices for the new `sanity/schemas/edition.ts`, based on directly reused patterns already proven in `gallery.ts`:

1. **Reuse the `localeTextField` helper pattern for the description/statement.** `gallery.ts` already has an inline `localeTextField(name, title, group)` helper (deliberately duplicated per `02-PATTERNS.md`'s documented guidance — no shared schema-lib module exists yet). Copy the same inline helper into `edition.ts` rather than centralizing it into a shared module as part of this milestone; that refactor is orthogonal to shipping Éditions and can happen later if a third schema needs it (rule of three).

2. **Reuse the exact `images` array pattern, unchanged.** The gallery schema's array-of-`image`-type-with-inline-`alt`-and-`rights` fields is a deliberate, hard-won shape: attaching `alt`/`rights` fields directly onto an `image`-type array member (not wrapping `image` inside a custom object type) is what preserves Sanity Studio's native multi-file drag-and-drop upload. Éditions' "full photo shoot" requirement is functionally identical to a gallery's photo array — copy the `images` field block verbatim (including the required-alt/required-rights custom validation and the `PREVIEW_IMAGE_LIMIT` preview-select trick), and treat `images[0]` as the lead/cover photo for the overview listing, exactly as galleries already treat `images[0]` as the homepage cover. No separate "lead photo" field is needed alongside the shoot array.

3. **Model format details as three named scalar fields grouped in one `format` object, not a freeform array.** PROJECT.md specifies exactly three format facts: page count, print run, dimensions.
   - `pageCount`: `number`, `.integer().positive()` validation
   - `printRun`: `number`, `.integer().positive()` validation — label it clearly in French as "Tirage" so Romane doesn't confuse it with stock/availability, which this milestone explicitly excludes
   - `dimensions`: `string`, free text (e.g. "21 × 29,7 cm")

   Group all three under a single `format` object field (Sanity `type: 'object'`, `options: {columns: 3}`, mirroring the `columns: 2` pattern already used for locale-object fields) so they read as one coherent block in the Studio form instead of three loose top-level fields. This is purely a UI-grouping choice — GROQ can still project `format.pageCount` etc. directly with no added query complexity.

4. **Reuse `publicationStatus` (preparation/published/archived) verbatim.** Éditions needs the same "draft-in-Studio vs. live-on-site vs. retired" lifecycle galleries have, and Romane already understands this three-state radio control from editing galleries. Do not invent a simpler boolean (`isVisible`); that was gallery's *legacy* field (now hidden, kept only for back-compat), and reintroducing it for a new type would be a step backward.

5. **Do not reuse `showOnHomePage` / `heroColor`.** PROJECT.md is explicit that Éditions is "not surfaced on the homepage carousel/grid, which stays pure photography." Omit both fields entirely from `edition.ts` — carrying over unused fields would let Romane toggle a setting that does nothing, which is confusing rather than helpful.

6. **`title` and `slug`: copy unchanged.** `title` as a plain `string` (shared proper noun across locales, same rationale as gallery titles — édition/zine names are typically not translated) with `slug` generated from `title` exactly as galleries do. No new slug-generation logic needed.

7. **Register the new type in both `sanity/schemas/index.ts`'s `schemaTypes` array and `sanity/schemas/structure.ts`'s desk structure**, adding an orderable list item for `edition` next to the existing `gallery` entry — this is what makes the new document type both queryable and reorderable in Studio's sidebar.

8. **Astro-side query/type additions belong in `src/lib/sanity.ts`, following the existing `Gallery` / `getGalleries` / `getGallery` pattern exactly:** add an `Edition` interface, an `EDITIONS_QUERY` / `EDITION_BY_SLUG_QUERY` pair reusing a published-status GROQ fragment analogous to `PUBLISHED_GALLERY_FILTER`, and `getEditions()` / `getEdition(slug)` functions. This keeps the new content type's data-fetching layer indistinguishable in style from the galleries it's modeled on, which matters for a small codebase one person (Florian) alone maintains.

## Sources

- Direct codebase inspection (HIGH confidence — this is the existing, shipped, production pattern, not a third-party claim): `/home/user/ajs-website/sanity/schemas/gallery.ts`, `/home/user/ajs-website/sanity/schemas/index.ts`, `/home/user/ajs-website/src/lib/sanity.ts`, `/home/user/ajs-website/src/pages/galleries/[slug].astro`, `/home/user/ajs-website/src/pages/en/galleries/[slug].astro`, `/home/user/ajs-website/sanity/package.json`, `/home/user/ajs-website/package.json`.
- `.planning/PROJECT.md` — milestone scope (v1.3 Éditions target features, explicit no-pricing/no-checkout boundary, "same content-editing pattern as galleries" requirement). HIGH confidence (first-party project source of truth).
- `CLAUDE.md` (this repo's root) — documents the already-validated, shipped v1.0 stack (Astro 7.0.6 static, GitHub Pages/OVH, Sanity, astro:i18n) this milestone builds directly on top of, and the explicit "Deferred to v1.x" e-commerce boundary this milestone must respect. HIGH confidence (first-party, kept current per its own "Status (updated 2026-07-20)" note).

---
*Stack research for: Éditions showcase feature (v1.3 milestone)*
*Researched: 2026-07-22*
