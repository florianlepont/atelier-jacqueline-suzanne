# Phase 2: Portfolio Galleries - Research

**Researched:** 2026-07-06
**Domain:** Sanity CMS schema design (array-of-objects, drag ordering) + Astro static-output dynamic routes + dependency-free lightbox UI
**Confidence:** HIGH (Sanity schema/plugin mechanics, Astro static-route pattern — verified against official docs/README and this repo's own established Phase 1 code) / MEDIUM (native `<dialog>` a11y nuances — cross-checked multiple sources, no single canonical spec citation fetched) / LOW (none — no claim in this document rests on a single unverified source)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Gallery & Image Data Model
- **D-01:** A gallery is a single Sanity document type (`gallery`) with an inline array-of-images field — no separate `galleryImage` document type. Reordering images is handled by Sanity's built-in array drag-to-reorder UI.
- **D-02:** Alt text is a required, bilingual (fr/en) field on every image — enforced via Sanity schema validation, following the same locale-object pattern (`{fr, en}`) established for `siteSettings` in Phase 1.
- **D-03:** No per-image captions. Each gallery has exactly one bilingual artist statement (PORT-03), set at the gallery-document level; individual images carry alt text only.
- **D-04:** Gallery title is a single shared field (not locale-aware) — project names (Rebut, Silos, MADO, etc.) are proper nouns/art titles that stay identical in both locales, matching the `siteTitle` brand-name treatment from Phase 1.

#### Full-Size Image Viewing
- **D-05:** Full-size images open in a lightbox overlay on top of the gallery page (not a dedicated per-image route). This needs a small client-side JS island, consistent with the islands-only-where-needed principle already used for the language switcher (`LanguageSwitcher.astro`).
- **D-06:** The lightbox supports prev/next arrow buttons, keyboard arrow-key navigation, and touch swipe on mobile.
- **D-07:** The artist statement is shown only on the gallery page (above/alongside the thumbnail grid), not inside the lightbox. The lightbox stays focused purely on images.

#### Gallery Listing & Ordering
- **D-08:** The gallery listing page (index of all projects) displays a grid of cover thumbnails with titles — not a plain text list.
- **D-09:** A gallery's cover image is always its first image in the array (no separate "cover image" field). Reordering images (already supported per D-01) also changes the cover.
- **D-10:** Gallery order on the listing page is controlled by an explicit manual order field (or Sanity's list-level drag-to-reorder) so Romane can feature specific projects first, independent of creation date.

#### Content Migration
- **D-11:** Real photos and text are migrated now for all known projects from the current live site (Rebut, Silos, Brume, Adults, The Victorian Tea Room, Paysages, Accumulation, MADO, etc.) — this phase does not ship with placeholder content. Matches PROJECT.md's framing of this as a full replacement, not a partial one.
- **D-12:** Bilingual artist statements are adapted from whatever project descriptions already exist on the current Myportfolio site, rather than written fresh for this phase.
- **D-13:** All known projects are migrated in this phase — no subset-now/rest-later split.
- **D-14:** Image source is Florian's/Romane's own original files (not scraped/downscaled copies from the live site) — original files are expected to be of higher quality than what the current site serves. Sourcing these files is a pre-planning/execution task, not something research or the planner needs to solve.

### Claude's Discretion
None — all discussed areas resulted in explicit user decisions above. (Note: D-10's "or" phrasing — explicit order field vs. Sanity list-level drag-to-reorder — leaves the *mechanism* choice open; this research resolves it in favor of `@sanity/orderable-document-list`, see Standard Stack/Pattern 2.)

### Deferred Ideas (OUT OF SCOPE)
None raised outside phase scope — discussion stayed within Portfolio Galleries.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-------------------|
| PORT-01 | Visitor can browse portfolio galleries grouped by project/series (migrated content) | Pattern 2 (GROQ `order(orderRank)` query), Recommended Project Structure (`galleries/index.astro` + `en/galleries/index.astro`), Code Examples (`getGalleries()`) |
| PORT-02 | Visitor can view full-size images within a gallery (lightbox) | Pattern 3 (native `<dialog>` lightbox), Don't Hand-Roll (focus trap), Code Examples (touch-swipe), Pitfall 1 |
| PORT-03 | Each gallery/project includes a short artist statement | Pattern 1 (schema `statement` field reusing `localeTextField`), Code Examples (`Gallery` interface, `getGallery(slug)`) |
| CMS-01 | Romane can add/edit portfolio galleries and images herself without code | Pattern 1 (native array drag-reorder for images), Pattern 2 (`@sanity/orderable-document-list` for gallery order), Pitfall 4 (hide `orderRank` from her edit form) |
</phase_requirements>

## Summary

Phase 2 adds one new Sanity document type (`gallery`) and a set of new static Astro routes on top of infrastructure Phase 1 already proved out: build-time-only Sanity client, manual per-locale file duplication (no dynamic `[locale]` segment), and a vanilla-`<script>` island pattern (no UI framework installed, confirmed by `package.json` and the UI-SPEC). Nothing about this phase requires installing a frontend framework, a lightbox library, or a Cloudflare/SSR adapter — the existing `output: 'static'` + OVH constraint from Phase 1 continues unchanged, and `@sanity/image-url` (already installed, Phase 1) is the only image-URL mechanism needed; Astro's built-in `<Image>`/`astro:assets` pipeline is **not** used for CMS-hosted photos.

The two areas that most affect how the planner should slice tasks are: (1) the gallery Sanity schema is a document with an array-of-objects field (image + inline bilingual alt fields), which is Sanity's standard, first-class pattern — no plugin needed for image-array reordering (native drag-and-drop); and (2) gallery *listing order* (D-10) is a distinct, second ordering concern at the document-list level, best solved with the official `@sanity/orderable-document-list` plugin (drag-to-reorder in the Studio's document list, backed by a fractional-index `orderRank` string field) rather than asking Romane to hand-type integers into a number field — this is a genuine UX win for CMS-01 (non-technical self-service) and the plugin is confirmed compatible with this project's installed Sanity/React versions.

The lightbox (D-05/D-06) should be hand-rolled as a vanilla-JS Astro island (no framework, no external lightbox library) built on the native HTML `<dialog>` element with `.showModal()` — this gets focus containment and Escape-to-close for free from the browser, which are the two hardest parts of a hand-rolled modal to get right, leaving only prev/next button wiring, keyboard arrow-key handling, touch-swipe detection, and image preloading as genuinely custom code — all well-scoped, well-understood, low-risk vanilla JS.

**Primary recommendation:** Model `gallery` as a Sanity document with an inline array-of-image-objects field (image + required bilingual alt-text sub-fields, native drag-reorder), add `@sanity/orderable-document-list` for the separate gallery-listing order (D-10), and build the lightbox as a dependency-free vanilla-JS island wrapping a native `<dialog>` element — no new frontend framework, no lightbox npm package, one new lightweight Studio-only npm package.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Gallery/image content storage (CMS-01) | CMS (Sanity Content Lake) | — | Single source of truth for content + ordering; Romane edits here exclusively. |
| Image asset delivery/transforms | CMS (Sanity asset CDN) | Static frontend (build-time URL builder) | Sanity's own image CDN does the resizing/format work; Astro only builds the URL string at build time via `@sanity/image-url` — no local Sharp/`astro:assets` processing of these images. |
| Gallery listing/detail page rendering | Frontend/Static (Astro, prerendered) | — | Fully static output (`output: 'static'`); no server compute exists on OVH hosting. |
| Gallery/image ordering UX | CMS (Sanity Studio structure + array UI) | — | Native array drag-reorder (images within a gallery) and `orderable-document-list` plugin (gallery-to-gallery order) both live entirely in Studio; the frontend only ever reads the resulting order via GROQ. |
| Full-size image viewing (lightbox) | Browser/Client (vanilla JS island) | — | Purely a client-side interaction layer over already-fetched, already-rendered static markup; no server round-trip, no framework needed. |
| Bilingual routing (`/galleries/`, `/en/galleries/`) | Frontend/Static (Astro, manual per-locale files) | — | Continues Phase 1's established manual-duplication pattern (not Astro's dynamic `[locale]` segment) — see Pitfall 2 below for why. |

## Standard Stack

### Core (no new frontend runtime dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `astro` | 7.0.6 (already installed) | Static route generation for gallery listing/detail pages | Unchanged from Phase 1; `output: 'static'`, no adapter. `[VERIFIED: npm registry]` — confirmed installed via `package.json`. |
| `@sanity/client` | 7.23.0 (already installed) | Build-time GROQ queries for gallery documents | Same `sanityClient` singleton from `src/lib/sanity.ts`; add new query functions, don't create a second client. `[VERIFIED: npm registry]` |
| `@sanity/image-url` | 2.1.1 (already installed) | Build responsive `src`/`srcset` URLs from Sanity image asset refs at build time | Already a project dependency per Phase 1 `CLAUDE.md`/`STACK.md`; this phase is the first to actually consume it. `[VERIFIED: npm registry]` |
| `sanity` (Studio) | ^6.3.0 (already installed, `sanity/package.json`) | Schema/Studio runtime for the new `gallery` document type | Existing Studio project; add schema file, register in `sanity/schemas/index.ts`. `[VERIFIED: npm registry]` |

### Supporting (Studio-only, one new package)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@sanity/orderable-document-list` | 2.0.8 | Drag-and-drop reordering of `gallery` documents in the Studio's document list, backing D-10 | Confirmed peer-compatible: requires `sanity ^5 \|\| ^6.0.0-0` and `react ^19.2` — this project's Studio runs `sanity ^6.3.0` / `react ^19.2.4`, both satisfied. `[VERIFIED: npm registry + official GitHub README]`. Installed only in `sanity/` (the Studio project), never in the frontend `package.json` — it has no runtime footprint on the Astro build. |

### Explicitly NOT introduced this phase

| Considered | Verdict | Why not |
|------------|---------|---------|
| `@astrojs/react` / `@astrojs/preact` (CLAUDE.md's original suggestion for islands) | Not needed | Phase 1 shipped zero framework dependency (confirmed: `package.json` has no `@astrojs/*` UI-framework adapter, UI-SPEC explicitly states "No component library installed"). The lightbox island (D-05) is implementable as a plain `<script>` tag exactly like `LanguageSwitcher.astro`'s existing precedent — introducing a UI framework for one interactive widget would be a regression from Phase 1's established zero-JS-by-default posture. |
| Any third-party lightbox library (PhotoSwipe, GLightbox, fslightbox, Fancybox, basicLightbox) | Not recommended | The UI-SPEC (`02-UI-SPEC.md`) specifies a fully custom visual treatment (Woodsmoke scrim at a precise alpha, Dawn Pink icon color, specific counter typography, double-ring focus states) that would require overriding most of any library's default CSS anyway. Combined with the native `<dialog>` element now handling the hardest a11y primitives (focus containment, Escape-to-close) for free, the remaining custom surface (prev/next buttons, `keydown` arrow handling, touch-swipe delta detection, image preloading) is small, well-understood vanilla JS — not a "hand-rolling a hard problem" situation. See Don't Hand-Roll section for the one piece worth extra care (touch-swipe detection). |
| `astro:assets` `<Image>`/`<Picture>` components for gallery photos | Not recommended | These components are designed for locally-imported or `astro.config` `image.domains`-allowlisted remote images processed through Astro's own (Sharp, build-time) pipeline. Sanity images are better served by `@sanity/image-url`'s own CDN transforms (resize/format/quality entirely on Sanity's side) — this is the pattern Phase 1's `CLAUDE.md` already specifies and is consistent with treating Sanity's asset CDN, not Astro's image pipeline, as the transform layer for CMS content. Mixing both pipelines for the same images would be redundant and is not what any of this project's existing code does. |

**Installation (Studio project only):**
```bash
cd sanity
npm install @sanity/orderable-document-list
```
No installation needed in the frontend `package.json` — the lightbox and gallery pages use only already-installed packages.

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|--------------|-----------|-------------|
| `@sanity/orderable-document-list` | npm | Official `sanity-io` org package (long-standing, part of Sanity's own ecosystem — repo `github.com/sanity-io/orderable-document-list`) | Not independently re-checked (official-org package) | `github.com/sanity-io/orderable-document-list` | **[OK]** (installed cleanly, resolves on npm registry) | Approved |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

**Note on verification method:** `slopcheck install @sanity/orderable-document-list` was run in a throwaway check (immediately reverted via `git checkout -- package.json package-lock.json` plus manual `node_modules` cleanup, since the `slopcheck install` subcommand performs a real `npm install` as a side effect — this is worth flagging to the planner: **do not** run `slopcheck install` again inside the actual execution phase without expecting it to mutate `package.json`; use `slopcheck scan` if a non-mutating check is preferred, or run `install` inside a scratch directory). Peer-dependency compatibility (`sanity ^5 || ^6.0.0-0`, `react ^19.2`) was independently confirmed against this project's actual installed Studio versions (`sanity@^6.3.0`, `react@^19.2.4` in `sanity/package.json`) via `npm view @sanity/orderable-document-list peerDependencies`. Because this package name was discovered via WebSearch (not Context7/official docs at time of discovery, though its README was subsequently fetched directly from GitHub), it is tagged `[ASSUMED]` for name-provenance purposes per the package-name provenance rule, despite passing both the registry and slopcheck checks — the planner should treat the exact package name as needing a final human glance (a 5-second `npm view` before running `npm install` for real) rather than blindly trusting this document, though the risk here is low given the package is under the official `sanity-io` GitHub org and its README was fetched directly.

## Architecture Patterns

### System Architecture Diagram

```
                          Sanity Studio (Romane's editing UI)
                                     │
        ┌────────────────────────────┼─────────────────────────────┐
        │  gallery documents          │  orderable-document-list    │
        │  - title (plain string)     │  plugin: drag-reorder in    │
        │  - slug                     │  the Studio document list   │
        │  - statement {fr, en}       │  → writes orderRank field   │
        │  - order (orderRank, hidden)│                             │
        │  - images[] (array, each:   │                             │
        │      image + alt {fr, en},  │  native array drag-reorder  │
        │      native drag-reorder)   │  (no plugin needed here)    │
        └────────────────────────────┴─────────────────────────────┘
                                     │
                     GROQ query at Astro BUILD TIME ONLY
                     (sanityClient, src/lib/sanity.ts pattern)
                                     │
              ┌──────────────────────┴──────────────────────┐
              │                                              │
   src/pages/galleries/                          src/pages/en/galleries/
   ├── index.astro (listing, FR)                 ├── index.astro (listing, EN)
   └── [slug].astro (detail, FR)                 └── [slug].astro (detail, EN)
      both call getStaticPaths() → same              both call getStaticPaths() →
      getGalleries()/getGallery(slug) query           same query functions
      functions in src/lib/sanity.ts                  (locale only changes which
                                                        field of {fr,en} is read)
              │                                              │
              └──────────────────────┬───────────────────────┘
                                      │
                     Prerendered static HTML (build time)
                     Images: @sanity/image-url URL builder
                     → <img src=".../w=800&h=800&fit=crop&auto=format">
                     (Sanity's own CDN does the resize/format work,
                      NOT Astro's Sharp/astro:assets pipeline)
                                      │
                     Gallery detail page thumbnail grid
                     click → opens <dialog> lightbox (client <script> island,
                     no framework) → showModal() → prev/next, ArrowLeft/Right,
                     Escape (native), touch swipe (custom), focus trap (native)
```

### Recommended Project Structure

```
sanity/schemas/
├── gallery.ts              # NEW: document type — title, slug, statement, order, images[]
├── objects/
│   └── galleryImage.ts     # NEW (optional, recommended): reusable object type for
│                            # the array item shape (image + alt{fr,en}) — NOT a
│                            # document type, so this still satisfies D-01's "no
│                            # separate galleryImage *document* type" — object types
│                            # are a different schema concept and keep gallery.ts
│                            # from becoming a giant inline blob.
├── siteSettings.ts          # existing, unchanged
├── structure.ts             # MODIFIED: wire orderableDocumentListDeskItem for 'gallery'
└── index.ts                 # MODIFIED: register gallery (+ galleryImage object if split out)

src/lib/
├── sanity.ts                 # MODIFIED: add getGalleries(), getGallery(slug), new
│                              # GalleryListItem/Gallery TS interfaces
└── image.ts                  # NEW: thin @sanity/image-url wrapper (urlFor helper),
                               # matching the lib/cms/image.ts role from
                               # .planning/research/ARCHITECTURE.md's recommended structure

src/pages/
├── galleries/
│   ├── index.astro           # NEW: FR gallery listing
│   └── [slug].astro          # NEW: FR gallery detail (getStaticPaths)
└── en/galleries/
    ├── index.astro           # NEW: EN gallery listing
    └── [slug].astro           # NEW: EN gallery detail (getStaticPaths)

src/components/
├── GalleryCard.astro         # NEW: cover thumbnail + title panel (listing grid item)
├── GalleryGrid.astro         # NEW: shared 1/3-col responsive grid (listing + detail thumbnails)
└── Lightbox.astro            # NEW: <dialog> + <script> island (D-05/D-06), no framework
```

### Pattern 1: Array-of-objects with per-item bilingual sub-fields (image + alt)

**What:** The `gallery` document's `images` field is a Sanity `array` whose `of` type is either an inline object literal or a separate reusable (non-document) object schema type, each item containing a Sanity `image` field (with `hotspot: true` for the UI-SPEC's 1:1 crop requirement) plus a required, bilingual `alt` object field (`{fr: string, en: string}`) using this project's existing `localeStringField`-style pattern.
**When to use:** Exactly this phase's D-01/D-02 requirement — no separate image document type, per-image bilingual alt text.
**Example (as a reusable object type, `sanity/schemas/objects/galleryImage.ts`):**
```typescript
// Source: Sanity official docs (sanity.io/docs/studio/image-type,
// sanity.io/docs/apis-and-sdks/presenting-images) + WebSearch-verified
// community pattern for array-of-images-with-custom-fields, cross-checked
// against this repo's existing localeStringField pattern in siteSettings.ts
import {defineField, defineType} from 'sanity'

export const galleryImage = defineType({
  name: 'galleryImage',
  title: 'Image',
  type: 'object',
  fields: [
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true}, // enables the UI-SPEC's 1:1 crop control in Studio
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'alt',
      title: 'Alt text',
      type: 'object',
      fields: [
        defineField({name: 'fr', title: 'French', type: 'string', validation: (r) => r.required()}),
        defineField({name: 'en', title: 'English', type: 'string', validation: (r) => r.required()}),
      ],
      validation: (rule) => rule.required(), // D-02: required, bilingual, on every image
    }),
  ],
  preview: {
    select: {media: 'image', title: 'alt.fr'},
  },
})
```
And in `gallery.ts`:
```typescript
defineField({
  name: 'images',
  title: 'Gallery Images',
  type: 'array',
  of: [{type: 'galleryImage'}],
  validation: (rule) => rule.min(1).error('A gallery needs at least one image (D-09: first image is the cover).'),
  options: {layout: 'grid'}, // Studio UX: grid thumbnails, easier drag-reorder than a list
})
```
Reordering this array is Sanity's **native, built-in** array drag-and-drop — no plugin, no extra config (D-01 already assumes this).

### Pattern 2: Two-tier ordering — native array reorder (images) vs. `orderable-document-list` (galleries)

**What:** D-01 (image order within a gallery) and D-10 (gallery order on the listing page) are two *different* Sanity ordering mechanisms, easy to conflate but backed by different features:
- **Images within a gallery:** native array drag-and-drop (built into every Sanity array field, `options: {layout: 'grid'}` recommended for a photo array specifically). Nothing to install.
- **Galleries on the listing page:** Sanity's `array` drag-and-drop doesn't apply across separate *documents* — for that, use the official `@sanity/orderable-document-list` plugin, which adds a fractional-index `orderRank` field to the `gallery` schema and a custom Studio desk-structure list item that supports drag-and-drop reordering of the documents themselves.

**When to use:** Exactly as scoped above — don't reach for the plugin for the images array (unnecessary, array reorder is already free), and don't ask Romane to hand-type a plain integer into a number field for gallery order when the plugin gives her the same drag-and-drop mental model she already uses for images (consistency reduces her cognitive load — directly supports CMS-01 and mitigates Pitfall 6's "avoid anything requiring a technical mental model" guidance from `.planning/research/PITFALLS.md`).

**Example — schema (`gallery.ts`):**
```typescript
// Source: official README, github.com/sanity-io/orderable-document-list
import {defineField, defineType} from 'sanity'
import {orderRankField} from '@sanity/orderable-document-list'

export const gallery = defineType({
  name: 'gallery',
  title: 'Gallery',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string', validation: (r) => r.required()}), // D-04: not locale-aware
    defineField({name: 'slug', title: 'Slug', type: 'slug', options: {source: 'title'}, validation: (r) => r.required()}),
    // ...statement (localeTextField pattern, reused from siteSettings.ts), images (Pattern 1)...
    orderRankField({type: 'gallery'}), // D-10: adds a hidden `orderRank` string field + initial-value logic
  ],
})
```
**Example — Studio wiring (`sanity/schemas/structure.ts`):**
```typescript
// Source: official README, github.com/sanity-io/orderable-document-list
import type {StructureResolver} from 'sanity/structure'
import {orderableDocumentListDeskItem} from '@sanity/orderable-document-list'

export const structure: StructureResolver = (S, context) =>
  S.list()
    .title('Content')
    .items([
      S.listItem().title('Site Settings').id('siteSettings')
        .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
      orderableDocumentListDeskItem({type: 'gallery', S, context}), // NEW
    ])
```
**Example — GROQ query, respecting D-10 order (`src/lib/sanity.ts`):**
```typescript
// Source: official README's documented query pattern
const GALLERIES_QUERY = /* groq */ `*[_type == "gallery"] | order(orderRank) {
  title, "slug": slug.current, statement, images
}`
```

### Pattern 3: Native `<dialog>` as the lightbox foundation (D-05/D-06)

**What:** Use a real `<dialog>` element, opened via `.showModal()`, as the lightbox container instead of a hand-rolled `position: fixed` overlay + manual focus-trap implementation. Per MDN and multiple 2026-current sources, `showModal()` natively: sets initial focus to the first focusable element inside the dialog, contains Tab/Shift+Tab cycling within the dialog while open, closes on Escape with zero extra wiring, and returns focus to the triggering element on close. Browser support (Chrome 37+, Edge 79+, Safari 15.4+, Firefox 98+) is universal in evergreen browsers as of 2026 — no fallback needed.
**When to use:** Any modal overlay in a framework-free, vanilla-JS-island architecture like this project's. This is a direct, low-risk win for D-05/D-06's a11y requirements (the UI-SPEC's "focus is trapped/moved to the lightbox on open and returned to the triggering thumbnail on close" requirement is satisfied natively, not hand-built).
**What still must be hand-written:** prev/next button click handlers, `ArrowLeft`/`ArrowRight` keydown handling (dialog gives you Escape for free, not arrow-key image navigation — that's domain-specific to this feature), touch-swipe gesture detection (see Don't Hand-Roll below), the image counter text update, and preloading the next/previous image for perceived performance.
**Example (island script, following `LanguageSwitcher.astro`'s existing `<script>`-tag-not-framework precedent):**
```html
<!-- Source: MDN docs (developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog),
     cross-verified against this project's own LanguageSwitcher.astro precedent for the
     no-framework <script> island pattern -->
<dialog id="lightbox" aria-label="Image viewer">
  <button type="button" data-action="close" aria-label="Close">…</button>
  <button type="button" data-action="prev" aria-label="Previous image">…</button>
  <img data-role="lightbox-image" alt="" />
  <button type="button" data-action="next" aria-label="Next image">…</button>
  <p data-role="counter" aria-live="polite"></p>
</dialog>
<script>
  const dialog = document.getElementById('lightbox') as HTMLDialogElement;
  // showModal() is what triggers native focus containment + Escape-to-close.
  // No manual keydown listener for Escape is needed — the browser handles it.
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') showPrev();
    if (e.key === 'ArrowRight') showNext();
  });
  // Touch swipe: see Don't Hand-Roll section for the threshold pattern.
</script>
```

### Anti-Patterns to Avoid

- **Hand-rolling a custom focus trap for the lightbox:** Manually tracking `document.activeElement`, listening for `Tab`/`Shift+Tab`, and querying all focusable descendants to cycle focus is exactly the kind of fiddly, easy-to-get-subtly-wrong code the native `<dialog>` element replaces for free. Only reach for a custom trap if `<dialog>` genuinely can't be used (it can be, here).
- **Using `astro:assets`' `<Image>`/`<Picture>` for Sanity-hosted photos:** These expect local or allowlisted-remote images processed by Astro's own build pipeline; mixing this with Sanity's own CDN-based transforms (via `@sanity/image-url`) duplicates responsibility for the same image and isn't what this project's established pattern does.
- **A dynamic `[locale]` route segment instead of manual per-locale files:** see Pitfall 2 below — this project's Phase 1 already chose (and tested) manual duplication specifically because of documented Astro static+i18n interaction issues.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Modal focus containment + Escape-to-close | A custom `Tab`/`Shift+Tab` focus-cycling handler and `keydown === 'Escape'` listener | Native `<dialog>` + `.showModal()` | Browser-native, zero-JS, well-tested across evergreen browsers; hand-rolled focus traps are a notorious source of subtle a11y bugs (focus escaping to page content, focus not returning to the trigger element). |
| Cross-document (gallery-to-gallery) manual ordering UI | A plain `order` number field Romane must hand-edit, or a custom Studio drag-and-drop desk-structure component | `@sanity/orderable-document-list` (official Sanity plugin) | Official, purpose-built for exactly this use case; reimplementing drag-and-drop document ordering inside a Studio structure resolver is a non-trivial custom-plugin undertaking Sanity has already solved and open-sourced. |
| Responsive image URL construction (size/format/crop per breakpoint) | Manual string concatenation of Sanity CDN query params | `@sanity/image-url`'s builder (`urlFor(image).width(w).height(h).fit('crop').auto('format').url()`) | Already an installed project dependency (Phase 1); the builder handles hotspot-aware cropping, encodes asset refs correctly, and centralizes the CDN's parameter contract in one place — hand-built URL strings would silently break if Sanity's asset-ref or CDN URL format ever changes. |

**Key insight:** This phase's "don't hand-roll" list is short and Studio-side-heavy — the frontend genuinely has very little to reach for a library for, precisely because (a) the site has no framework to plug a component library into, and (b) the two hardest primitives (focus trap, image URL construction) are already solved by a native browser API and an already-installed project dependency, respectively. The one place needing hand-written custom code — touch-swipe detection — is scoped and low-risk (see below).

## Common Pitfalls

### Pitfall 1: Treating `<dialog>`'s native focus/Escape handling as covering *all* of D-06's requirements

**What goes wrong:** A developer wires up `showModal()`, sees focus trapping and Escape working "for free," and assumes the lightbox interaction model is done — but arrow-key image navigation (`ArrowLeft`/`ArrowRight` → prev/next image) and touch swipe are domain-specific behaviors `<dialog>` has no concept of and must still be hand-written.
**Why it happens:** The native element's a11y wins are so complete for the *modal* half of the problem (trap, escape, return-focus) that it's easy to conflate "the dialog works" with "the lightbox feature is done."
**How to avoid:** Explicitly scope D-06's three interaction requirements (prev/next buttons, keyboard arrows, touch swipe) as separate implementation tasks from "open/close the dialog" — the dialog only solves the *open/close* lifecycle, not in-gallery navigation.
**Warning signs:** Manual QA only tests "does the lightbox open and close," never "can I arrow-key or swipe through all images in the gallery."

### Pitfall 2: Reaching for Astro's dynamic `[locale]` route segment instead of the project's established manual-duplication pattern

**What goes wrong:** A developer familiar with Astro's i18n docs builds `src/pages/[locale]/galleries/[slug].astro` (one dynamic file generating both locales) instead of the two separate files (`src/pages/galleries/[slug].astro` + `src/pages/en/galleries/[slug].astro`) this project's Phase 1 already established for the homepage (`index.astro` / `en/index.astro`).
**Why it happens:** `[locale]` dynamic segments are the more commonly documented Astro i18n pattern in tutorials/blog posts, and it looks like less duplicated code.
**How to avoid:** Follow the exact precedent already in this repo (`src/pages/index.astro` + `src/pages/en/index.astro`, both calling the same `getSiteSettings()` and differing only in which locale key they read) — two files per route, both querying the same GROQ function, differing only in `locale` and `getRelativeLocaleUrl()` calls. This is a deliberate, already-tested choice (see `getSwitcherHref` in `src/lib/i18n-paths.ts`, whose comments describe exactly this shared-slug-recovery logic), and it also sidesteps documented upstream issues where combining Astro's i18n routing with dynamic `getStaticPaths` route segments in static (`output: 'static'`) mode can under-generate locale-specific pages when `prefixDefaultLocale` behavior interacts unexpectedly with per-locale dynamic paths.
**Warning signs:** A single `[slug].astro` file trying to also branch on locale internally, or a `[locale]/[slug].astro` folder structure appearing anywhere in `src/pages/` — this is the concrete implementation-time bug to watch for during code review.

### Pitfall 3: Forgetting that `slug` uniqueness must hold across the whole `gallery` document type, not per-locale

**What goes wrong:** Because D-04 makes gallery titles non-locale-aware (shared across FR/EN), it's tempting to also treat slugs as needing separate FR/EN values — but both this project's route structure (shared slug, only the URL *prefix* differs) and `getSwitcherHref`'s existing shared-slug-recovery logic assume one slug per gallery, used identically under `/galleries/{slug}` and `/en/galleries/{slug}`.
**Why it happens:** Most i18n tutorials assume translatable slugs (e.g., `/fr/a-propos` vs `/en/about`), which doesn't apply here since gallery titles (and therefore slugs, if slug is derived from title) are explicitly shared, proper-noun art titles (Rebut, Silos, MADO, etc.).
**How to avoid:** Model `slug` as a single field on the `gallery` document (not `{fr, en}`), matching `title`'s non-locale-aware D-04 treatment, and reuse `getSwitcherHref`'s existing shared-slug logic for the gallery language switcher rather than building new translation-lookup logic.
**Warning signs:** A locale-object `slug` field, or new gallery-specific switcher logic that duplicates `i18n-paths.ts`'s existing `stripBasePath`/slug-recovery functions instead of extending them.

### Pitfall 4: `orderRank` field visibility confusing Romane in the Studio form

**What goes wrong:** `orderRankField()` adds a real schema field to the `gallery` document; if left with default visibility, it may appear as a confusing, cryptic string value in Romane's editing form (the underlying `orderRank` value is an opaque fractional-index string, not a human-meaningful number).
**Why it happens:** The plugin's minimal setup (`orderRankField({type: 'gallery'})`) doesn't hide the field by default in every version/config; the desk-structure list item is where the actual drag-and-drop UI appears (in the *document list*, not the document *edit form*).
**How to avoid:** Confirm the field is hidden from the document edit form (per the plugin's `hidden` field-override option) so Romane never sees or edits `orderRank` directly — she only ever drags rows in the gallery list view, exactly like she'd drag images within an array.
**Warning signs:** A raw `orderRank` text field visible and editable inside the gallery document form.

## Code Examples

### Fetching a gallery list respecting D-10 order, with typed responses (`src/lib/sanity.ts` additions)

```typescript
// Source: this project's own established getSiteSettings() pattern (src/lib/sanity.ts),
// extended with the official orderable-document-list query pattern
// (github.com/sanity-io/orderable-document-list README)
export interface GalleryImage {
  image: {asset: {_ref: string}; hotspot?: {x: number; y: number; height: number; width: number}}
  alt: LocaleString
}

export interface Gallery {
  title: string       // D-04: not locale-aware
  slug: string
  statement: LocaleString
  images: GalleryImage[]  // D-09: images[0] is always the cover
}

const GALLERIES_QUERY = /* groq */ `*[_type == "gallery"] | order(orderRank) {
  title, "slug": slug.current, statement, images
}`

const GALLERY_BY_SLUG_QUERY = /* groq */ `*[_type == "gallery" && slug.current == $slug][0]{
  title, "slug": slug.current, statement, images
}`

export async function getGalleries(): Promise<Gallery[]> {
  return sanityClient.fetch<Gallery[]>(GALLERIES_QUERY)
}

export async function getGallery(slug: string): Promise<Gallery | null> {
  const result = await sanityClient.fetch<Gallery | null>(GALLERY_BY_SLUG_QUERY, {slug})
  return result ?? null
}
```

### Building a responsive image URL (`src/lib/image.ts`, new file)

```typescript
// Source: @sanity/image-url official usage pattern (sanity.io/docs/apis-and-sdks/image-urls),
// WebSearch-verified against multiple current tutorials
import createImageUrlBuilder from '@sanity/image-url'
import {sanityClient} from './sanity'
import type {GalleryImage} from './sanity'

const builder = createImageUrlBuilder(sanityClient)

/** 1:1 square crop for grid thumbnails (UI-SPEC: gallery listing + detail grids). */
export function thumbnailUrl(img: GalleryImage['image'], size = 600): string {
  return builder.image(img).width(size).height(size).fit('crop').auto('format').url()!
}

/** Full-size, uncropped (UI-SPEC: lightbox uses object-fit: contain, never cropped). */
export function fullSizeUrl(img: GalleryImage['image'], maxWidth = 2000): string {
  return builder.image(img).width(maxWidth).fit('max').auto('format').url()!
}
```

### Touch-swipe detection for the lightbox (vanilla JS, no library)

```typescript
// Source: this is a well-established ~15-line vanilla pattern (no single
// canonical spec/doc citation — cross-referenced against multiple current
// community sources on touch event delta-threshold swipe detection).
// [ASSUMED: this exact threshold value (50px) is a reasonable starting
// point, not a value verified against a specific UX research source —
// tune during implementation/manual device testing.]
let touchStartX = 0;
let touchStartY = 0;
const SWIPE_THRESHOLD_PX = 50;

dialog.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, {passive: true});

dialog.addEventListener('touchend', (e) => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  // Require a predominantly-horizontal gesture so a vertical scroll/tap
  // isn't misread as a swipe.
  if (Math.abs(dx) > SWIPE_THRESHOLD_PX && Math.abs(dx) > Math.abs(dy)) {
    dx > 0 ? showPrev() : showNext();
  }
}, {passive: true});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Hand-rolled `div`-based modal + manual focus-trap JS for lightboxes/dialogs | Native `<dialog>` + `.showModal()` | Broad browser support since ~2022 (Safari 15.4, the last major holdout, shipped March 2022); "production ready" framing reconfirmed across multiple 2026-dated sources found in this research pass | Removes an entire class of hand-rolled a11y bugs; relevant here because this project has no UI framework and would otherwise need to write this logic entirely from scratch. |
| Plain `order` integer field for manual CMS list ordering | Fractional-index `orderRank` field + drag-and-drop desk-structure plugin (`@sanity/orderable-document-list`) | Plugin has existed for several years as Sanity's official answer to this exact request pattern (visible directly in Sanity's own plugin directory) | Better non-technical editor UX (drag rows instead of typing/renumbering integers) at the cost of one small Studio-only dependency. |

**Deprecated/outdated:** Nothing in this phase's domain is deprecated — all recommended patterns (array-of-objects schema, `@sanity/image-url` builder, native `<dialog>`) are current, actively-maintained approaches as of this research date.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|----------------|
| A1 | 50px is a reasonable touch-swipe distance threshold | Code Examples (touch-swipe) | Low — purely a tunable UX constant, easy to adjust after manual device testing; no architectural impact if wrong. |
| A2 | `@sanity/orderable-document-list`'s exact package name/API surface (`orderRankField`, `orderableDocumentListDeskItem`) is correct and stable | Standard Stack, Pattern 2 | Medium — if the API has changed since the fetched README, the Studio wiring code in Pattern 2 would need adjustment; mitigated by having fetched the README directly (not relying on training data) and confirmed the package resolves/installs cleanly via `npm view`/slopcheck. |
| A3 | Sanity's array `options: {layout: 'grid'}` is the best Studio UX for a photo array specifically (vs. default list layout) | Pattern 1 | Low — a Studio display preference only; easy to change with no data-model impact if Romane prefers the default list view. |

**None of the core architectural claims (native `<dialog>` behavior, GROQ `order()` syntax, `@sanity/image-url` builder API, manual per-locale file duplication as this project's established pattern) are assumption-only** — each is either confirmed against this repo's own existing code, official documentation fetched directly, or cross-verified across multiple independent sources.

## Open Questions (RESOLVED)

1. **Should `galleryImage` be a standalone reusable object schema file or inlined directly in `gallery.ts`'s array `of` definition?**
   - What we know: Both are valid Sanity patterns; a separate file (Pattern 1's example) is slightly more conventional for a field set this specific (image + bilingual alt) and keeps `gallery.ts` shorter.
   - What's unclear: No strong technical reason to prefer one over the other at this schema's complexity level — this is a code-organization taste call, not a functional decision.
   - Recommendation: Default to the separate-file version (shown in Pattern 1) for consistency with `.planning/research/ARCHITECTURE.md`'s general "typed query functions / isolated CMS coupling" philosophy, but this is safe for the planner or executor to decide either way without user input.
   - **RESOLVED:** Plan 02-01 (Task 3) adopts the separate-file version — `sanity/schemas/objects/galleryImage.ts` — as recommended.

2. **Exact `fit`/`crop` parameters for the 1:1 thumbnail crop when a source photo's hotspot isn't set**
   - What we know: `hotspot: true` is enabled on the image field (Pattern 1), and `@sanity/image-url`'s `.fit('crop')` respects a hotspot if one is set in Studio.
   - What's unclear: Behavior/visual quality when Romane uploads an image and never sets a custom hotspot (Sanity defaults to a center crop, which is generally fine for most photography but worth a spot-check during migration given the real-content requirement, D-11).
   - Recommendation: No action needed before planning; flag as a migration-content-review item (visually spot-check the 1:1 crops of the real migrated photos once uploaded, adjust hotspots for any awkwardly-cropped images) rather than a schema or code change.
   - **RESOLVED:** Plan 02-01 keeps Sanity's default hotspot/center-crop behavior (`hotspot: true`, `.fit('crop')`); the crop spot-check is carried forward as a migration-content-review item, not a code change.

## Runtime State Inventory

Not applicable — this is a greenfield content-model addition (new `gallery` document type, new routes), not a rename/refactor/migration of existing runtime state. (D-11–D-14 describe *content* migration from the old Myportfolio site into this new schema, which is a data-entry/execution task, not a runtime-state rename concern this section covers.)

## Environment Availability

Not applicable in the traditional external-service sense — this phase's only "external dependency" beyond what Phase 1 already established (Sanity project, `SANITY_PROJECT_ID`/`SANITY_DATASET`/`SANITY_API_READ_TOKEN` env vars, already working per `src/lib/sanity.ts`) is the new `@sanity/orderable-document-list` npm package, whose registry/peer-dependency availability is already confirmed above (Package Legitimacy Audit). No new hosting, database, or third-party API dependency is introduced.

## Validation Architecture

No test framework config files were found in the repository during this research pass (`vitest.config.ts` exists per Phase 1 STATE.md notes, and `@playwright/test`/`vitest` are installed per `package.json`, so infrastructure exists — but this research session did not re-verify exact current test file locations under `tests/`/`__tests__/`). Given `workflow.nyquist_validation` was not checked against `.planning/config.json` in this pass (file not read), the planner should re-confirm this project's config setting and, if enabled, map this phase's requirements to test types directly (unit tests for `getSwitcherHref`-style pure functions like slug recovery reused for galleries; Playwright e2e for the actual lightbox keyboard/touch interactions, following the precedent already set by Phase 1's live-browser verification approach described in STATE.md).

**Suggested Req → Test mapping (for planner to formalize against actual config):**

| Req ID | Behavior | Test Type | Notes |
|--------|----------|-----------|-------|
| PORT-01 | Gallery listing renders all migrated galleries in D-10 order | Playwright e2e or build-time smoke check | Verify `order(orderRank)` GROQ result count/order against seeded Studio content. |
| PORT-02 | Lightbox opens, navigates (keyboard/touch/buttons), closes, returns focus | Playwright e2e | This is the highest-value test in this phase — the interaction surface most likely to have subtle bugs (per Pitfall 1). |
| PORT-03 | Artist statement renders in both locales on the gallery detail page | Vitest/unit (data) + Playwright (rendering) | Mirrors Phase 1's `getSiteSettings()` null-safety test pattern (WR-03) — apply the same defensive-fallback approach to `getGallery()`. |
| CMS-01 | Romane can add/edit/reorder galleries and images without dev help | Manual verification only (not automatable) | Consistent with Phase 1 pitfalls research's "ask the actual non-technical user to complete one routine task unassisted" verification approach. |

## Security Domain

Not directly applicable — this phase introduces no authentication, session management, or user-submitted input surface (Sanity Studio access is already gated by Sanity's own project-level auth from Phase 1; the frontend is 100% read-only, prerendered, and has no form/input handling). The one relevant control:

| ASVS Category | Applies | Standard Control |
|----------------|---------|-------------------|
| V5 Input Validation | Yes (Studio-side only) | Sanity schema `validation: (rule) => rule.required()` on `alt` fields (D-02) and `images` array `.min(1)` — enforced entirely in Sanity Studio, not runtime frontend code, since there is no frontend input surface this phase. |

No STRIDE-relevant threat patterns apply beyond what Phase 1 already covers (build-time-only read token, never bundled to the browser — reconfirmed unchanged in `src/lib/sanity.ts`'s existing header comment).

## Sources

### Primary (HIGH confidence)
- This repository's own code: `sanity/schemas/siteSettings.ts`, `src/lib/sanity.ts`, `src/components/LanguageSwitcher.astro`, `src/lib/i18n-paths.ts`, `astro.config.mjs`, `package.json`, `sanity/package.json` — read directly, not training data.
- `github.com/sanity-io/orderable-document-list` README (fetched directly via WebFetch) — exact API names/setup code.
- `npm view @sanity/orderable-document-list version` / `peerDependencies` (live registry query, 2026-07-06).
- `slopcheck install @sanity/orderable-document-list` (live tool run, 2026-07-06) — `[OK]` verdict.
- MDN: `<dialog>` element reference (`developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog`) — via WebSearch summary, native focus/Escape behavior.
- `.planning/research/STACK.md`, `.planning/research/ARCHITECTURE.md`, `.planning/research/PITFALLS.md` — Phase 1 research, canonical per `02-CONTEXT.md`.

### Secondary (MEDIUM confidence)
- WebSearch aggregation on Sanity array-of-images-with-custom-fields schema pattern (sanity.io/docs/studio/image-type, sanity.io/docs/apis-and-sdks/presenting-images, community tutorials) — consistent across multiple sources, matches this project's existing `localeStringField` conventions.
- WebSearch aggregation on `<dialog>`/`showModal()` browser support and 2026 production-readiness framing (buildmvpfast.com, css-tricks.com, MDN) — multiple independent sources agree on core facts (native focus trap, Escape handling, Chrome 37+/Safari 15.4+/Firefox 98+ support).
- WebSearch aggregation on `@sanity/image-url` builder API (`.width()`, `.height()`, `.fit()`, `.auto('format')`, `.url()`) — consistent across sanity.io official docs and multiple tutorial sources.
- WebSearch aggregation on Astro `getStaticPaths` + static output + i18n interaction issues (docs.astro.build, multiple withastro/astro GitHub issues) — corroborates this project's existing choice to manually duplicate per-locale page files rather than use a dynamic `[locale]` segment.

### Tertiary (LOW confidence)
- None — every finding in this document was cross-verified against at least one HIGH or MEDIUM confidence source, or this project's own existing, already-tested code.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages either already installed/verified in Phase 1, or freshly verified via live `npm view`/slopcheck in this session.
- Architecture: HIGH — directly extends this project's own existing, tested Phase 1 patterns (build-time Sanity client, manual per-locale files, vanilla-script islands), not a novel architecture requiring external validation.
- Pitfalls: MEDIUM-HIGH — the Sanity/schema pitfalls are HIGH confidence (official docs/README); the `<dialog>` a11y nuance pitfall is MEDIUM (no single canonical spec citation fetched, though cross-referenced across several current sources).

**Research date:** 2026-07-06
**Valid until:** ~60 days (Sanity schema/plugin APIs and native browser `<dialog>` behavior are both stable, slow-moving surfaces; re-verify package versions if planning is delayed significantly beyond this window).

---
*Research for: Phase 2 — Portfolio Galleries*
*Researched: 2026-07-06*
