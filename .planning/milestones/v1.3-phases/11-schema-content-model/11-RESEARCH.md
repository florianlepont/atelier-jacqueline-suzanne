# Phase 11: Schema & Content Model - Research

**Researched:** 2026-07-22
**Domain:** Sanity Studio schema design (new `edition` document type mirroring an existing `gallery.ts` pattern) — no front-end code
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**"Rebut" naming resolution (blocks success criterion #5)**
- **D-01:** The Portfolio gallery "Rebut" and the new "Rebut" édition are the SAME underlying subject presented as two distinct objects: the gallery shows the photographic work itself, the édition is a printed edition (book/zine) OF that photo collection. They stay as two separate documents/pages — the gallery is NOT moved, renamed, or merged into Éditions.
- **D-02:** Already confirmed directly with Romane (not just Florian's own call) — record as **Confirmed** in PROJECT.md's Key Decisions, resolving the open item from `01-CONTEXT.md`/PROJECT.md Context. No additional human-sign-off checkpoint needed before seeding.
- **D-03:** The resolution includes a future differentiator: an optional cross-link between a gallery and its related édition (and vice versa). This is EDN-08, already tracked in REQUIREMENTS.md's v2 section as deferred to its own future phase — Phase 11 does NOT add a reference field or any cross-link UI now. Do not scope-creep it in; just don't design the schema in a way that would make adding it later awkward (e.g. avoid anything that would preclude a future optional `reference` field to `gallery`).

**Content model shape**
- **D-04:** Dedicated `leadPhoto` field (single image + bilingual alt text), separate from the full photo-shoot `images` array — NOT gallery's "first array image is the cover" convention.
- **D-05:** The `images` array (the "full photo-shoot") shows photos OF THE PRINTED OBJECT ITSELF — cover shot, page spreads, binding/print detail — not a reuse of the gallery's photographic subject matter.
- **D-06:** Format details are distinct, typed, structured fields (not free text), grouped together in Studio:
  - `pageCount`: number
  - `printRun`: number (locked by success criterion #3 — "not free text")
  - `dimensions`: object with `width` (number), `height` (number), `unit` (e.g. cm) — fully structured rather than a single display string, so it stays machine-usable for a future shop/commerce field group (e.g. shipping-box calculations) without restructuring later.

**Reused from `gallery.ts` pattern (Phase 2 dependency — not re-litigated, just confirmed as the mirror target)**
- **D-07:** `publicationStatus` (preparation/published/archived, radio, required, `initialValue: 'published'`).
- **D-08:** `title` is a plain string (not a locale object).
- **D-09:** `slug` field sourced from `title`, same "click Générer" Studio pattern.
- **D-10:** `statement` uses the same bilingual `localeTextField` shape (fr/en, both required).
- **D-11:** Each image in `images` (and `leadPhoto`) carries bilingual `alt` (fr/en, both required) + `rights` (reuse the existing `imageRights` object type).
- **D-12:** `{...orderRankField({type: 'edition'}), hidden: true}` for Studio drag-reorder.
- **D-13:** NO `showOnHomePage` or `heroColor` fields — Éditions must never appear on the homepage carousel/grid.
- **D-14:** Desk structure: add an `orderableDocumentListDeskItem({type: 'edition', ...})` entry, and add `'edition'` to the exclusion filter in the generic document-type list at the bottom of `structure.ts`.

**Seed content**
- **D-15:** Seed the "Rebut" édition (not "Sillo" or another). Florian has real content ready.

### Claude's Discretion
- Exact Studio field/group labels in French (mirroring gallery's `title`/`group` French copy conventions) — e.g. "Détails du format", "Photos de l'objet imprimé".
- Whether `dimensions.unit` is a fixed string default ("cm") or a small select list — no multi-unit requirement was raised; default to a sensible fixed/initial value unless Studio ergonomics suggest otherwise.
- Internal field/group naming beyond what's specified above (e.g. group names like `format`, `photos`).
- Exact seed values for `printRun`/`pageCount`/`dimensions` come from Florian's real content (D-15) — not invented.

### Deferred Ideas (OUT OF SCOPE)
- **Gallery ↔ édition cross-link (EDN-08)** — optional link from a gallery's page to its related édition and vice versa, where a match exists. Already tracked in REQUIREMENTS.md's v2 section as deferred to its own future v1.x phase. Not built in Phase 11; schema should not preclude adding an optional `reference` field later (D-03).

None else — discussion stayed within Phase 11's schema/content-model scope. No other new capabilities were proposed.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-------------------|
| CMS-04 | Romane can add/edit éditions (title, photo shoot, statement, format details) herself via Sanity, without touching code | Standard Stack / Architecture Patterns sections below give the exact field set and Studio wiring (schema + `index.ts` + `structure.ts`) that satisfies unassisted create/edit/publish/reorder. Common Pitfalls #3/#4 cover the two ways this silently regresses (missing editorial-workflow parity, forgetting the hosted Studio deploy step). |
| EDN-05 | Each édition detail page shows format details (page count, print run size, dimensions) | Not rendered until Phase 12, but Phase 11 must produce the *typed, structured* `pageCount`/`printRun`/`dimensions` fields Phase 12 will fetch and render — see Standard Stack's field table and the `dimensions` object-validation pitfall. |
</phase_requirements>

## Summary

This phase adds exactly one new Sanity Studio document type (`edition`) plus its desk-structure wiring, seeded with one real document — no front-end code, no new npm dependency. The entire technical shape of the work is already fully specified by three existing artifacts in this repo: `sanity/schemas/gallery.ts` (the schema pattern to mirror), `sanity/schemas/structure.ts` (the desk-item wiring pattern), and `.planning/research/PITFALLS.md` (pitfall #1, #7, #8 target this exact phase). Nothing here requires external ecosystem research beyond two narrow, verified Sanity-Studio validation gotchas (nested-object required fields, image-asset requiredness) that directly affect the new `dimensions` and `leadPhoto` fields.

The one genuinely new fact this research surfaces beyond CONTEXT.md's decisions: **this project's Sanity Studio is deployed to a hosted, pinned instance** (`https://atelier-jacqueline-suzanne.sanity.studio/`, `appId` pinned in `sanity.cli.ts`) that Romane presumably uses day-to-day, and **no CI step runs `sanity deploy`** — CI only lints and type-checks the Studio as a build gate. A schema-only change committed to `main` will NOT appear in Romane's hosted Studio until someone manually runs `npx sanity deploy` from `sanity/`. This must be an explicit task in the plan, not an assumed side-effect of merging code.

The other genuinely new fact: **there is no seed script or content-migration tooling in this repo.** Phase 2's gallery content (and Phase 1's `siteSettings` singleton) were seeded either (a) directly through Sanity Studio by a human as a `checkpoint:human-verify` task, or (b) via a temporary CLI-created editor-role token used once and deleted. Seeding the "Rebut" édition should follow the same precedent: either a blocking human-verify checkpoint where Florian enters the real content through Studio himself (matching how Romane's gallery workflow was verified in Phase 2), or a short-lived scripted `createOrReplace` via a temporary token if the content is already fully assembled and a human check of the *published result* is sufficient. Given success criterion #1 explicitly requires proving Romane's own unassisted Studio workflow (create/edit/publish), the human-Studio-entry path is the one that actually verifies CMS-04, not just seeds data.

**Primary recommendation:** Mirror `gallery.ts` field-for-field (workflow fields, image shape, locale-text helper), add a grouped `format` object (`pageCount`, `printRun`, `dimensions`) with a parent-level custom validation function (not just per-field `required()`, per the nested-object-validation gotcha below), wire `edition` into `index.ts`/`structure.ts` exactly as `gallery` is wired, then close the phase with two human-verify checkpoints: (1) Romane/Florian create-edit-publish-reorder a real édition in the hosted Studio after `sanity deploy`, and (2) the "Rebut" naming resolution recorded in PROJECT.md (already substantively decided per D-01/D-02, this is a documentation task, not a new discussion).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| `edition` content-type schema definition (fields, validation, grouping) | Database / Storage (Sanity Content Lake schema-as-code) | API / Backend (Sanity Studio is the CMS admin app that renders this schema as an editing UI) | The schema *is* the document shape stored in the Content Lake; Studio is just the generated editing surface over it — same split `gallery.ts` already embodies. |
| Studio desk structure (drag-reorder list, exclusion filter) | API / Backend (Sanity Studio admin app) | Database / Storage (`orderRank` field persists the reorder state as document data) | Desk structure is pure Studio-app configuration (`structure.ts`), but the reordering itself is backed by a real field value in storage. |
| Seed content ("Rebut" édition document) | Database / Storage | — | A concrete document instance in the Content Lake; no other tier is involved. |
| Hosted-Studio deploy (`sanity deploy`) | API / Backend (Studio is a deployed static admin app, hosted at `*.sanity.studio`) | — | Distinct from the schema-as-code itself — this is the *distribution* step that makes Romane's hosted Studio reflect the new schema; easy to omit since it's not part of any CI pipeline. |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|---------------|
| `sanity` | ^6.4.0 (Studio core, already installed) | Schema definition API (`defineType`/`defineField`), Studio runtime | Already the project's CMS; no alternative considered — this phase is additive schema only. |
| `@sanity/orderable-document-list` | ^2.0.8 locked (registry current: 2.0.15) [VERIFIED: npm registry] | `orderRankField()` (schema-side fractional-index field) + `orderableDocumentListDeskItem()` (structure-side drag-reorder desk list) | Already vetted and installed in Phase 2 via a blocking human legitimacy checkpoint (see STATE.md Phase 02 decisions); mirrored verbatim for `edition`, not re-verified. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `imageRights` (local schema type, `sanity/schemas/imageRights.ts`) | n/a (in-repo) | Bilingual credit/rights object attached to each image | Reused verbatim as the `rights` field type on every édition image (D-11) — no changes needed. |
| `localeTextField()` helper (in-repo function, `gallery.ts` lines 22-47) | n/a (in-repo, no shared module exists yet) | `{fr, en}` object shape, both required, for bilingual long-form text | Copy inline into `edition.ts` for the `statement` field, exactly as `gallery.ts`'s own comment documents this project's "duplicate rather than share" convention until a shared schema-lib module exists. |
| `PublishedPageLinks` (in-repo React component, `sanity/schemas/PublishedPageLinks.tsx`) | n/a (in-repo) | Read-only Studio field showing "open FR/EN page" links, gated on `publicationStatus === 'published'` | Discretionary per CONTEXT.md. If added now, the FR/EN links it generates (`{SITE_PREVIEW_URL}/editions/{slug}/`) will 404 until Phase 12 ships the route — see Pitfall 4 below for the recommended handling. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Mirroring `gallery.ts`'s richer editorial workflow (`publicationStatus`, hidden `orderRank`, rich `preview()`) | Mirroring `exhibition.ts`'s plainer shape (no `publicationStatus`, no `orderRank`, no dedicated desk item — just `S.documentTypeListItem`) | Rejected — CONTEXT.md and PITFALLS.md Pitfall 7 both explicitly require the `gallery` pattern; `exhibition`'s simpler shape would lose Romane's "En préparation" draft workflow and drag-reorder, breaking success criteria #1/#2. |
| A single `dimensions` structured object (width/height/unit) | A free-text `dimensions` string per locale (e.g. "21 × 29,7 cm") | Rejected — locked by D-06/success criterion #3; would need a painful future migration to extract numeric values once the shop milestone needs `printRun`/dimensions programmatically (see PITFALLS.md Pitfall 1, Recovery Strategies table). |
| Seeding content via a blocking Studio human-verify checkpoint | A one-off Node script using a temporary editor-role token (`sanity tokens add --role=editor`, `client.createOrReplace(...)`, then `sanity tokens delete`) — the exact pattern used for `siteSettings` in Phase 1 | Either is viable; the human-Studio-entry path is recommended here specifically *because* success criterion #1 requires proving Romane's unassisted create/edit/publish workflow, which a script cannot demonstrate. The scripted path remains a legitimate fallback if Florian wants to pre-populate a wave of images/text and let a human verify only the *result*. |

**Installation:**
No new packages to install — this phase reuses `@sanity/orderable-document-list` (already in `sanity/package.json`) and in-repo local modules (`imageRights`, the inline `localeTextField` helper).

**Version verification:** `@sanity/orderable-document-list` registry-current version is `2.0.15` [VERIFIED: npm registry, `npm view` run 2026-07-22]; this project's lockfile pins `2.0.8`. No upgrade is required or recommended for this phase — CONTEXT.md explicitly treats the Phase 2 dependency as "not re-litigated, just confirmed as the mirror target." Flag the version drift only as background context, not an action item.

## Package Legitimacy Audit

No external packages are installed in this phase. `edition.ts` and its Studio wiring reuse only:
- `sanity` and `@sanity/orderable-document-list` — both already installed and vetted (the latter via a blocking human legitimacy checkpoint in Phase 2, per STATE.md: "verified legitimate via blocking human checkpoint (npmjs.com, sanity-io org, v2.0.8, matching peer deps) before install").
- In-repo local modules (`imageRights.ts`, the inline `localeTextField` helper, optionally `PublishedPageLinks.tsx`) — not external packages.

**Packages removed due to [SLOP] verdict:** none (no new packages evaluated).
**Packages flagged as suspicious [SUS]:** none.

## Architecture Patterns

### System Architecture Diagram

```
 Sanity schema source (sanity/schemas/edition.ts)  [NEW — this phase]
        │
        │  defineType({name:'edition', fields:[...], groups:[...]})
        ▼
 sanity/schemas/index.ts  (schemaTypes registry)     [MODIFIED — add import + array entry]
        │
        ▼
 sanity.config.ts  →  structureTool({structure})       (unchanged, already wired)
        │
        ▼
 sanity/schemas/structure.ts                          [MODIFIED]
   ├─ orderableDocumentListDeskItem({type:'edition'}) ─→ Studio desk: "Éditions" drag-reorder list
   └─ exclusion filter += 'edition'                   ─→ prevents double-listing in generic type list
        │
        ▼
 Studio dev server (local, `sanity dev`) reflects the new schema IMMEDIATELY (reads source)
        │
        │  npx sanity deploy   ← MANUAL STEP, not in CI
        ▼
 Hosted Studio (https://atelier-jacqueline-suzanne.sanity.studio/) reflects the new schema
        │
        │  Romane/Florian create + publish a real "edition" document through this hosted Studio
        ▼
 Sanity Content Lake (production dataset)  — the seeded "Rebut" édition document now exists
        │
        │  (Phase 12, NOT this phase) GROQ fetch at Astro build time
        ▼
 Front-end static pages  — out of scope for Phase 11
```

A reader can trace: schema file → schema registry → desk structure → local Studio (instant) → **manual deploy** → hosted Studio → real seeded document in the Content Lake. The manual-deploy step is the one arrow with no automatic trigger, and is the phase's biggest "looks done but isn't" risk.

### Recommended Project Structure
```
sanity/
├── schemas/
│   ├── edition.ts        # NEW — mirrors gallery.ts field-for-field, plus grouped `format` object
│   ├── gallery.ts         # unchanged — the mirror target, do not modify
│   ├── imageRights.ts     # unchanged — reused verbatim as edition image `rights` type
│   ├── index.ts           # MODIFIED — import edition, add to schemaTypes array
│   └── structure.ts        # MODIFIED — orderableDocumentListDeskItem for 'edition' + exclusion-filter entry
```
No changes to `src/` (Astro app) in this phase — that boundary is explicit in CONTEXT.md's Phase Boundary section.

### Pattern 1: Locale-text helper duplication (intentional, documented)
**What:** Copy `gallery.ts`'s `localeTextField(name, title, group)` function inline into `edition.ts` rather than extracting a shared module.
**When to use:** Any new bilingual long-text field in a schema file, until a shared `schemas/lib/` module is introduced project-wide.
**Example:**
```typescript
// Source: sanity/schemas/gallery.ts lines 22-47 (existing, in-repo)
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
Comment this duplication in `edition.ts` the same way `gallery.ts` already comments its own duplication of `siteSettings.ts`'s original — this is a project-wide convention, not an oversight (PITFALLS.md Technical Debt Patterns table explicitly sanctions it "only if the duplicated blocks are commented as intentionally mirrored").

### Pattern 2: Grouped, structured format fields (the extensibility hedge)
**What:** A `format` Studio group containing `pageCount` (number), `printRun` (number), and a structured `dimensions` object (`width`/`height`/`unit`), instead of loose top-level fields or one free-text blob.
**When to use:** Exactly this phase's format-detail fields — locked by D-06 and PITFALLS.md Pitfall 1.
**Example:**
```typescript
// New pattern for edition.ts — grouped so a future `commerce` group (price,
// stockQuantity, soldOut) is additive, not a restructuring.
defineField({
  name: 'dimensions',
  title: 'Dimensions',
  type: 'object',
  group: 'format',
  options: {columns: 3},
  fields: [
    defineField({
      name: 'width',
      title: 'Largeur',
      type: 'number',
      validation: (rule) => rule.required().positive().error('La largeur est obligatoire.'),
    }),
    defineField({
      name: 'height',
      title: 'Hauteur',
      type: 'number',
      validation: (rule) => rule.required().positive().error('La hauteur est obligatoire.'),
    }),
    defineField({
      name: 'unit',
      title: 'Unité',
      type: 'string',
      initialValue: 'cm',
      validation: (rule) => rule.required(),
    }),
  ],
  // See Pitfall B below: per-field `required()` inside a nested object is a
  // documented Sanity gap (validation doesn't reliably run until the object
  // is "dirtied"). Add a parent-level custom check mirroring gallery.ts's
  // own images-array custom validation, so an editor cannot publish with an
  // entirely untouched `dimensions` object:
  validation: (rule) =>
    rule.custom((value) => {
      const d = value as {width?: number; height?: number; unit?: string} | undefined
      if (!d || !d.width || !d.height || !d.unit) {
        return 'Renseigner la largeur, la hauteur et l’unité.'
      }
      return true
    }),
})
```

### Pattern 3: Dedicated `leadPhoto` field distinct from `images` array
**What:** A single `image` field (with required bilingual `alt`, `hotspot: true`) separate from the `images` array — not "first array item is the cover" (gallery's convention).
**When to use:** Locked by D-04.
**Example:**
```typescript
// New pattern for edition.ts
defineField({
  name: 'leadPhoto',
  title: 'Photo principale',
  type: 'image',
  group: 'photos',
  options: {hotspot: true},
  fields: [
    defineField({
      name: 'alt',
      title: "Description de l'image (accessibilité)",
      type: 'object',
      options: {columns: 2},
      fields: [
        defineField({name: 'fr', title: 'Français', type: 'string',
          validation: (rule) => rule.required()}),
        defineField({name: 'en', title: 'Anglais', type: 'string',
          validation: (rule) => rule.required()}),
      ],
      validation: (rule) => rule.required(),
    }),
  ],
  // See Pitfall B / Sanity docs: required() alone does not guarantee an
  // asset was actually uploaded when the image type carries custom fields —
  // pair it with assetRequired().
  validation: (rule) => rule.required().assetRequired().error('Choisir une photo principale.'),
})
```

### Anti-Patterns to Avoid
- **Reusing gallery's "first array image = cover" convention for `leadPhoto`:** explicitly rejected by D-04 — do not derive `leadPhoto` from `images[0]`.
- **Modeling `edition` on `exhibition.ts`'s plainer shape:** would silently drop `publicationStatus`/`orderRank`/rich `preview()`, breaking success criteria #1/#2 (PITFALLS.md Pitfall 7).
- **Free-text `printRun`/`dimensions`:** explicitly locked out by D-06/success criterion #3.
- **Adding a `price`/`stock`/availability field "just in case":** explicitly out of scope (PITFALLS.md Pitfall 1's own "How to avoid" list flags this as a mistake, not a shortcut worth taking) — extensibility here means good grouping/typing, not pre-adding disabled commerce fields.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bilingual field shape | A new locale-object pattern for `edition` | `localeTextField()` copied from `gallery.ts` (Pattern 1) | One shape to extend later, consistent with every other bilingual field site-wide (`siteSettings.ts` originated it). |
| Studio drag-reorder | Custom ordering UI/logic | `@sanity/orderable-document-list`'s `orderRankField()` + `orderableDocumentListDeskItem()`, exactly as `gallery` uses them | Already vetted, already the established mechanism for exactly this UX (fractional-index reordering, hidden field). |
| Image credit/rights modeling | A new `rights` shape for édition images | The existing `imageRights` object type, imported directly | Verbatim reuse keeps the site-wide "Crédits et droits" bulk-editing tool (`CreditsManager`) working across both content types, per PITFALLS.md Pitfall 7's explicit guidance. |
| Draft/published/archived workflow | A custom boolean or ad-hoc status field | `publicationStatus` radio field mirrored from `gallery.ts`, with the same `initialValue: 'published'` | Matches Romane's existing mental model for galleries — a second, differently-shaped status field on `edition` would be confusing for no benefit. |

**Key insight:** Every piece of this phase already has a shipped, tested precedent in this exact repo (`gallery.ts`, `imageRights.ts`, `structure.ts`). The only genuinely new schema surface is the `format` group (`pageCount`/`printRun`/`dimensions`) and the dedicated `leadPhoto` field — everything else is copy-with-intent, not new design.

## Common Pitfalls

### Pitfall A: Forgetting the manual `sanity deploy` step after merging schema changes
**What goes wrong:** The schema change is committed, CI passes (lint + `sanity build` + `tsc`), and the phase is marked done — but Romane's actual day-to-day Studio (the hosted `https://atelier-jacqueline-suzanne.sanity.studio/` instance, per the pinned `appId` in `sanity.cli.ts`) still shows the old schema, because nothing in `.github/workflows/deploy.yml` runs `sanity deploy`. The new "Éditions" list simply isn't there for her.
**Why it happens:** Astro deploys automatically on push to `main`; it's easy to assume the Sanity Studio half of the stack works the same way. It doesn't — `sanity build`/`lint` in CI only validate that the Studio *compiles*, they don't publish anything to the hosted instance.
**How to avoid:** Add an explicit task: `cd sanity && npx sanity deploy` (or `npm run deploy --prefix sanity`), run manually by Florian after the schema is merged, before any Studio-based human-verify checkpoint (Task ordering matters: deploy, THEN verify Romane/Florian can see and use the new type in the *hosted* Studio, not just `sanity dev` locally).
**Warning signs:** The plan's checkpoint task says "verify in Sanity Studio" without specifying *which* Studio instance (local dev server vs. the hosted deployed one) — local `sanity dev` will show the new schema immediately regardless of deploy status, which can mask this gap during dev-time testing.

### Pitfall B: Sanity's nested-object and image-asset validation gaps silently allow incomplete "format" data or a missing lead photo to publish
**What goes wrong:** (1) Per-field `required()` validators nested inside an object type (like `dimensions.width`/`height`/`unit`) are a documented Sanity Studio limitation — validation on nested object fields doesn't reliably run until the object has been "dirtied" by editor interaction, so an editor who never opens the `dimensions` sub-object at all can still publish the document. (2) An `image`-type field with custom fields (like `leadPhoto`'s `alt`) needs `assetRequired()` in addition to `required()` — `required()` alone can pass even when no actual image asset was uploaded, only the sub-fields being set.
**Why it happens:** This is a known, multiply-reported class of behavior in Sanity Studio's validation engine (not a project-specific bug) — nested-object validation and image-asset validation are two separate mechanisms that must each be explicitly invoked, and it's easy to assume `required()` on sub-fields is sufficient because it visually appears so in the Studio form.
**How to avoid:** Add a parent-level `rule.custom()` validator on the `dimensions` object itself (see Pattern 2's example) that explicitly checks all three sub-values are present — this mirrors the exact technique `gallery.ts` already uses for its `images` array (`rule.custom((images) => {...})`), so this isn't a new pattern for the codebase, just applying an existing one to a new field. For `leadPhoto`, use `rule.required().assetRequired()` (see Pattern 3's example), not `required()` alone.
**Warning signs:** A test/manual check publishes an édition with `dimensions` left completely untouched (never expanded/edited) and the document publishes without error; or `leadPhoto`'s alt fields are set but no image was actually attached, and it still publishes.

### Pitfall C: No seed-script precedent in this repo — treating seeding as "just run some script" instead of a human-verified Studio task
**What goes wrong:** Assuming there's an existing `scripts/seed.ts` or similar to adapt (there isn't — confirmed by repo search) and either inventing a new one-off script without a human-verify checkpoint, or trying to seed content in a way that doesn't actually exercise Romane's real workflow, undermining success criterion #1 which specifically requires proving *her* unassisted create/edit/publish path.
**Why it happens:** Phase 1's `siteSettings` singleton WAS seeded via a scripted temporary-token approach (`sanity tokens add --role=editor` → `client.createOrReplace()` → `sanity tokens delete`), which could look like "the established seeding pattern" — but that content had no equivalent "prove a human can do this unassisted" requirement the way CMS-04/success-criterion-#1 does here.
**How to avoid:** Seed the "Rebut" édition as (or alongside) the `checkpoint:human-verify` task that proves success criteria #1/#2 — i.e., have Florian (standing in for Romane, or Romane herself) actually create the document through the (post-`sanity deploy`) hosted Studio, fill every field, publish it, and drag-reorder it, exactly as Phase 2's Task 3 did for the first real galleries ("Romane independently completed a full gallery create/edit/reorder cycle in Sanity Studio"). A scripted `createOrReplace` remains a legitimate *fallback* only if the actual create/edit/publish/reorder workflow is separately verified by a human some other way.
**Warning signs:** The plan's seed task has no `checkpoint:human-verify` and instead is a fully automated script with no accompanying manual Studio verification of the create/edit/reorder workflow.

### Pitfall D: `PublishedPageLinks`/`OpenSitePage` Studio helpers pointing at a route that doesn't exist yet
**What goes wrong:** If `edition.ts` reuses `PublishedPageLinks` (as `gallery.ts` does) or `sanity/editorial/OpenSitePage.tsx`'s `publicPagePath()` is extended to return `/editions/${slug}/` now, every "Ouvrir en français/anglais ↗" / "Voir sur le site" link in Studio will 404 until Phase 12 ships the actual Astro route — confusing for Romane if she clicks it expecting a live page.
**Why it happens:** These are exactly the kind of "looks done, mirrors gallery perfectly" additions that are easy to copy wholesale without noticing they encode an assumption (a live public route exists) that isn't true yet for `edition` in this phase.
**How to avoid:** This is flagged as Claude's Discretion in CONTEXT.md — the safe default is to **omit** `PublishedPageLinks`/`OpenSitePage` wiring for `edition` in Phase 11 and add it in Phase 12 alongside the real route (one extra, easy addition then, vs. a dead/broken link now). If included anyway for parity, the field/inspector should be visibly inert or hidden until `publicationStatus === 'published'` AND the phase should note in its own summary that these links won't resolve until Phase 12 ships.
**Warning signs:** A human-verify checkpoint clicks "Voir sur le site" for the seeded "Rebut" édition and gets a 404 — this is expected in Phase 11 if the links were wired, and should not be treated as a Phase 11 bug, only flagged for Phase 12 follow-through.

## Code Examples

### Registering `edition` in the schema registry
```typescript
// sanity/schemas/index.ts — MODIFIED
import {siteSettings} from './siteSettings'
import {homePage} from './homePage'
import {gallery} from './gallery'
import {edition} from './edition'          // NEW
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
  edition,                                  // NEW
  exhibition,
  seo,
  imageRights,
]
```

### Wiring the Studio desk item + exclusion filter
```typescript
// sanity/schemas/structure.ts — MODIFIED (excerpt)
orderableDocumentListDeskItem({
  type: 'gallery',
  title: 'Collections photo',
  icon: ImagesIcon,
  S,
  context,
}),
orderableDocumentListDeskItem({          // NEW
  type: 'edition',
  title: 'Éditions',
  icon: TagsIcon,                        // or another distinct @sanity/icons icon — avoid reusing ImagesIcon so Studio nav visually distinguishes the two content types (see Pitfall 8 in PITFALLS.md re: naming confusion)
  S,
  context,
}),
// ...
...S.documentTypeListItems().filter(
  (listItem) =>
    ![
      'siteSettings',
      'homePage',
      'aboutPage',
      'contactPage',
      'gallery',
      'edition',                          // NEW — must be added or edition double-lists
      'exhibition',
      'seo',
    ].includes(listItem.getId() ?? ''),
),
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|-------------------|---------------|--------|
| n/a | n/a | — | This phase introduces no new tooling or ecosystem shift — it's an additive schema change on an already-shipped, unchanged stack (`sanity` ^6.4.0, `@sanity/orderable-document-list` ^2.0.8). |

**Deprecated/outdated:** None applicable.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|----------------|
| A1 | Recommending a distinct desk-item icon (e.g. `TagsIcon`) for `edition` rather than reusing `ImagesIcon` | Code Examples | Low — purely cosmetic Studio-nav clarity; easy to change later, no data/behavior impact. |
| A2 | Recommending `PublishedPageLinks`/`OpenSitePage` wiring be deferred to Phase 12 rather than added now | Pitfall D | Low-medium — if the planner instead includes it now, the only consequence is a 404'ing Studio link until Phase 12, not a data-integrity or CMS-04 functional risk; CONTEXT.md already marks this as discretionary either way. |

**All other claims in this research were verified directly against this repository's committed code** (`gallery.ts`, `structure.ts`, `index.ts`, `imageRights.ts`, `exhibition.ts`, `sanity.config.ts`, `sanity.cli.ts`, `deploy.yml`, `package.json`/`package-lock.json`, prior phase SUMMARY.md files) or CITED against official Sanity documentation / GitHub issue reports (nested-object validation, `assetRequired()`) — no user confirmation is needed for those.

## Open Questions

1. **Should the "Rebut" naming resolution (success criterion #5) be a new discussion, or purely a documentation task?**
   - What we know: CONTEXT.md D-01/D-02 state this was "already confirmed directly with Romane" and just needs recording in PROJECT.md's Key Decisions table.
   - What's unclear: Whether the plan needs any additional check-in with Romane, or whether this is purely "write the resolution into PROJECT.md" as a doc-only task.
   - Recommendation: Treat as a documentation-only task (update PROJECT.md's Key Decisions table with the D-01 resolution, marked "Confirmed" per D-02) — no new human-verify checkpoint needed specifically for this, since CONTEXT.md is explicit that confirmation already happened.

2. **Exact seed content values for "Rebut" (pageCount/printRun/dimensions/statement/images) are not yet known to this research.**
   - What we know: D-15 confirms Florian has real content ready (photos of the printed object, statement text, format details).
   - What's unclear: The actual numbers/text/images themselves — not a research question, a content-authoring input the plan's seed task depends on.
   - Recommendation: The plan's seed task should treat Florian as the content source at execution time (same as every other content-migration task in this project's history), not attempt to invent placeholder values.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Sanity Studio local dev (`sanity dev`) | Verifying schema changes before deploy | ✓ (already used throughout Phases 1-10) | Studio core ^6.4.0 | — |
| Sanity CLI `sanity deploy` | Publishing schema changes to the hosted Studio Romane actually uses | ✓ (CLI already installed as a `sanity/` devDependency-adjacent script; `appId` pre-pinned in `sanity.cli.ts`) | n/a (CLI command, not a package version) | — |
| Sanity write-capable token (editor role) | If the seed task uses the scripted `createOrReplace` fallback path (Pitfall C) instead of pure Studio entry | ✓ — `sanity tokens add/list/delete` proven non-interactive in Phase 1 | n/a | Studio-only manual entry (no token needed) if the human-verify path is used instead |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none — both seeding paths (scripted token vs. manual Studio entry) are available; manual Studio entry is the recommended path per Pitfall C.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.9 (root `tests/unit/`) for any TS logic; no test framework applies to Sanity schema files directly — this repo has no precedent for unit-testing schema shape (verified: no test file imports `gallery.ts`/`exhibition.ts`) |
| Config file | `vitest.config.ts` (root) — unaffected by this phase |
| Quick run command | `npm run test:unit` (root) |
| Full suite command | `npm run test:coverage` (root); `npm --prefix sanity run lint && npm --prefix sanity run build` (Studio-specific gate) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|---------------------|-------------|
| CMS-04 | Romane can create/edit/publish/reorder an édition without code | manual (`checkpoint:human-verify`) | n/a — no automated test can prove an unassisted human Studio workflow; `npm --prefix sanity run build && npm --prefix sanity run lint` only proves the schema *compiles*, not that the UX is usable | ❌ n/a (not automatable) |
| EDN-05 | Format details are typed/structured, ready for Phase 12 to fetch | automated (schema build/typecheck) | `npm --prefix sanity run build` (fails if `edition.ts` has a TS/schema error); `npx tsc --noEmit` (from `sanity/`) | ✅ existing CI step, no new file needed |

### Sampling Rate
- **Per task commit:** `npm --prefix sanity run lint && npm --prefix sanity run build` (fast, catches schema-definition errors immediately)
- **Per wave merge:** same, plus the human-verify checkpoint(s) for CMS-04/success-criteria #1/#2/#4/#5
- **Phase gate:** Studio lint+build green, AND both human-verify checkpoints (Studio create/edit/publish/reorder workflow; naming-resolution doc update) confirmed before `/gsd-verify-work`

### Wave 0 Gaps
None — this phase introduces no new automated-test surface beyond the Studio's existing `lint`/`build`/`tsc` gate, which is already wired into CI (`.github/workflows/deploy.yml`, "Lint and build Sanity Studio" step). The phase's actual proof points (CMS-04, success criteria #1/#2/#4/#5) are inherently manual/Studio-based and should be `checkpoint:human-verify` tasks in the plan, not test files.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|----------------|---------|--------------------|
| V2 Authentication | No | This phase touches no auth surface — Studio auth is Sanity's own (unchanged), no new token scopes beyond the existing viewer/editor pattern already established in Phase 1. |
| V3 Session Management | No | Not applicable — no new session surface. |
| V4 Access Control | No | Studio document-type access follows the same project-wide Sanity role model already in place; no per-type ACL is introduced. |
| V5 Input Validation | Yes | Sanity's own field-level `validation` rules (Rule API) — this phase's `dimensions`/`leadPhoto` fields specifically need the nested-object-custom-validation and `assetRequired()` techniques described in Pitfall B, since the default per-field `required()` alone is insufficiently enforced by Sanity Studio for nested/image fields. |
| V6 Cryptography | No | Not applicable — no new secrets/crypto surface; any temporary write token used for seeding follows the existing Phase 1 precedent (created and deleted in the same session via `sanity tokens add/delete`). |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|-----------------------|
| A long-lived write-capable Sanity token left behind after a scripted seed operation | Elevation of Privilege | Follow the Phase 1 precedent exactly: create a temporary editor-role token via `sanity tokens add --role=editor`, use it once, then `sanity tokens delete` it immediately — verify via `tokens list` that only the permanent viewer token remains, if the scripted seeding fallback (Pitfall C) is used at all. |
| Publishing a document with incomplete required data due to Sanity's nested-object validation gap (Pitfall B) | Tampering (in the sense of publishing invalid/incomplete content that downstream Phase 12 code will consume) | Parent-level `rule.custom()` on `dimensions`, `assetRequired()` on `leadPhoto` — not relevant to security in the traditional sense, but directly relevant to data integrity for the next phase's build-time fetch. |

## Sources

### Primary (HIGH confidence)
- Direct repository inspection [VERIFIED: repository read] — `sanity/schemas/gallery.ts`, `sanity/schemas/exhibition.ts`, `sanity/schemas/structure.ts`, `sanity/schemas/index.ts`, `sanity/schemas/imageRights.ts`, `sanity/schemas/PublishedPageLinks.tsx`, `sanity/editorial/OpenSitePage.tsx`, `sanity/editorial/DocumentChecklist.tsx`, `sanity/sanity.config.ts`, `sanity/sanity.cli.ts`, `sanity/package.json`, `sanity/package-lock.json`, `.github/workflows/deploy.yml`
- `.planning/research/PITFALLS.md` and `.planning/research/SUMMARY.md` [CITED: prior research artifacts, this repo] — HIGH-confidence, direct-codebase-verified pitfalls research produced during this milestone's roadmap creation, specifically targeting this phase (Pitfalls 1, 7, 8)
- Prior phase execution history [CITED: this repo] — `.planning/phases/01-foundation-bilingual-infrastructure/01-03-SUMMARY.md` (token lifecycle + seeding precedent), `.planning/phases/02-portfolio-galleries/02-03-SUMMARY.md` / `02-04-SUMMARY.md` (Phase 2's human-verify content-migration checkpoint precedent, `@sanity/orderable-document-list` legitimacy check)
- `npm view @sanity/orderable-document-list version` [VERIFIED: npm registry, run 2026-07-22] — registry-current `2.0.15`; lockfile-pinned `2.0.8`

### Secondary (MEDIUM confidence)
- [Image | Sanity Docs](https://www.sanity.io/docs/studio/image-type) [CITED] — `assetRequired()` must be paired with `required()` to enforce an actual asset upload on image-type fields with custom fields.
- [Sanity Studio doesn't validate nested fields · Issue #2195](https://github.com/sanity-io/sanity/issues/2195), [Object fields don't correctly run validation until dirtied · Issue #1713](https://github.com/sanity-io/sanity/issues/1713), [Improve support for optional object fields with required subfields · Issue #2630](https://github.com/sanity-io/sanity/issues/2630) [CITED] — corroborate the nested-object validation gap Pitfall B describes; used to justify the parent-level `rule.custom()` recommendation, which already has precedent in this repo's own `gallery.ts` images-array validation.
- [Validation | Sanity Docs](https://www.sanity.io/docs/studio/validation), [Validation of children in objects — Sanity Recipes](https://www.sanity.io/recipes/validation-of-children-in-objects-c48c85a7) [CITED] — official guidance corroborating the same recommendation.

### Tertiary (LOW confidence)
None used as the basis for any claim in this document.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; the one package reused (`@sanity/orderable-document-list`) was already legitimacy-checked in Phase 2 and its version confirmed live against the npm registry this session.
- Architecture: HIGH — every pattern is a direct mirror of already-shipped, committed code in this exact repository (`gallery.ts`, `structure.ts`, `index.ts`).
- Pitfalls: HIGH (codebase-integration pitfalls A, C, D — verified by direct inspection of `sanity.cli.ts`/`deploy.yml`/prior SUMMARY.md files) / MEDIUM (Pitfall B — corroborated by official Sanity docs and multiple independent GitHub issue reports, not verified against this project's own schema files since `dimensions`/`leadPhoto` don't exist yet).

**Research date:** 2026-07-22
**Valid until:** 90 days (this phase's dependencies — `sanity` core, `@sanity/orderable-document-list` — are stable, low-churn, and this research is grounded in this repo's own already-shipped code rather than fast-moving ecosystem trends)
