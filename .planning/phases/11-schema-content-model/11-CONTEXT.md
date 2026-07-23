# Phase 11: Schema & Content Model - Context

**Gathered:** 2026-07-22
**Status:** Ready for planning

<domain>
## Phase Boundary

A dedicated `edition` Sanity content type — structurally distinct from `gallery` — modeled with future shop fields in mind, seeded with at least one real édition ("Rebut"), so Phase 12 (data-fetch/routes) has real content to build and verify against.

Does not touch: front-end fetch/render (Phase 12), nav wiring (Phase 13), pricing/stock/commerce fields beyond leaving room for a future `commerce` field group, or the gallery↔édition cross-link UI (EDN-08, deferred to its own future v1.x phase).

</domain>

<decisions>
## Implementation Decisions

### "Rebut" naming resolution (blocks success criterion #5)
- **D-01:** The Portfolio gallery "Rebut" and the new "Rebut" édition are the SAME underlying subject presented as two distinct objects: the gallery shows the photographic work itself, the édition is a printed edition (book/zine) OF that photo collection. They stay as two separate documents/pages — the gallery is NOT moved, renamed, or merged into Éditions.
- **D-02:** Already confirmed directly with Romane (not just Florian's own call) — record as **Confirmed** in PROJECT.md's Key Decisions, resolving the open item from `01-CONTEXT.md`/PROJECT.md Context. No additional human-sign-off checkpoint needed before seeding.
- **D-03:** The resolution includes a future differentiator: an optional cross-link between a gallery and its related édition (and vice versa). This is EDN-08, already tracked in REQUIREMENTS.md's v2 section as deferred to its own future phase — Phase 11 does NOT add a reference field or any cross-link UI now. Do not scope-creep it in; just don't design the schema in a way that would make adding it later awkward (e.g. avoid anything that would preclude a future optional `reference` field to `gallery`).

### Content model shape
- **D-04:** Dedicated `leadPhoto` field (single image + bilingual alt text), separate from the full photo-shoot `images` array — NOT gallery's "first array image is the cover" convention. Success criterion #1 explicitly lists lead photo and photo-shoot array as two separate things, and a dedicated field lets Romane pick a lead image independent of shoot order.
- **D-05:** The `images` array (the "full photo-shoot") shows photos OF THE PRINTED OBJECT ITSELF — cover shot, page spreads, binding/print detail — not a reuse of the gallery's photographic subject matter. This reinforces D-01: the édition is presenting the physical printed artifact, not re-presenting the same photography.
- **D-06:** Format details are distinct, typed, structured fields (not free text), grouped together in Studio:
  - `pageCount`: number
  - `printRun`: number (locked by success criterion #3 — "not free text")
  - `dimensions`: object with `width` (number), `height` (number), `unit` (e.g. cm) — fully structured rather than a single display string, so it stays machine-usable for a future shop/commerce field group (e.g. shipping-box calculations) without restructuring later.

### Reused from `gallery.ts` pattern (Phase 2 dependency — not re-litigated, just confirmed as the mirror target)
- **D-07:** `publicationStatus` (preparation/published/archived, radio, required, `initialValue: 'published'`) — same three-state editorial workflow as gallery, satisfying "create, edit, and publish... without developer help" (success criterion #1).
- **D-08:** `title` is a plain string (not a locale object) — same as gallery's D-04 rationale (proper nouns like "Rebut" are shared across locales).
- **D-09:** `slug` field sourced from `title`, same "click Générer" Studio pattern.
- **D-10:** `statement` uses the same bilingual `localeTextField` shape (fr/en, both required) as gallery — satisfies EDN-04/CMS-04.
- **D-11:** Each image in `images` (and `leadPhoto`) carries bilingual `alt` (fr/en, both required) + `rights` (reuse the existing `imageRights` object type) exactly as gallery does — no new rights/credit modeling needed.
- **D-12:** `{...orderRankField({type: 'edition'}), hidden: true}` for Studio drag-reorder — satisfies success criterion #2 ("drag-reorder éditions... same way she already reorders galleries").
- **D-13:** NO `showOnHomePage` or `heroColor` fields — Éditions must never appear on the homepage carousel/grid (locked by PROJECT.md/ROADMAP, not a gray area).
- **D-14:** Desk structure: add an `orderableDocumentListDeskItem({type: 'edition', ...})` entry (mirroring gallery's), and add `'edition'` to the exclusion filter in the generic document-type list at the bottom of `structure.ts`, exactly like `gallery`/`exhibition` already are.

### Seed content
- **D-15:** Seed the "Rebut" édition (not "Sillo" or another). Florian has real content ready: photos of the printed object, statement text, and format details (page count, print run, dimensions).

### Claude's Discretion
- Exact Studio field/group labels in French (mirroring gallery's `title`/`group` French copy conventions) — e.g. "Détails du format", "Photos de l'objet imprimé".
- Whether `dimensions.unit` is a fixed string default ("cm") or a small select list — no multi-unit requirement was raised; default to a sensible fixed/initial value unless Studio ergonomics suggest otherwise.
- Internal field/group naming beyond what's specified above (e.g. group names like `format`, `photos`).
- Exact seed values for `printRun`/`pageCount`/`dimensions` come from Florian's real content (D-15) — not invented.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Schema pattern this phase mirrors (Phase 2 dependency)
- `sanity/schemas/gallery.ts` — the exact structural mirror target: `localeTextField` helper (bilingual text), `images` array shape with per-image `alt` (bilingual) + `rights` (imageRights type), `publicationStatus` radio field, `orderRankField` usage, slug-from-title, plain-string `title`.
- `sanity/schemas/imageRights.ts` — reused verbatim as the `rights` field type on each édition image.
- `sanity/schemas/structure.ts` — desk structure pattern: `orderableDocumentListDeskItem` for gallery (lines 54-60), exclusion filter at the bottom (lines 67-78), and the simpler `S.documentTypeListItem('exhibition')` precedent (line 66) for a non-orderable type — édition follows the orderable-gallery pattern, not the exhibition pattern.
- `sanity/schemas/index.ts` — schema registry; `edition` needs to be imported and added to `schemaTypes`.

### Requirements & roadmap
- `.planning/REQUIREMENTS.md` — CMS-04, EDN-05 (this phase's requirements); EDN-08 (§ "Éditions (v1.x+, deferred from v1.3)", line 103 — the cross-link differentiator explicitly deferred, referenced by D-03).
- `.planning/ROADMAP.md` (Phase 11 section, lines 355-369) — the five success criteria this phase must satisfy.
- `.planning/PROJECT.md` — Context section's "Open item (v1.3)" (line 86) describing the Rebut naming ambiguity this phase's D-01/D-02 resolves; Key Decisions table (line 102+) is where the resolution gets recorded per success criterion #5.

**No formal cross-project ADRs/specs beyond the above** — requirements are fully captured in REQUIREMENTS.md/ROADMAP.md and the Decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `localeTextField(name, title, group)` helper in `gallery.ts` (lines 22-47) — copy inline into `edition.ts` (no shared schema-lib module exists yet, per that file's own comment) for the `statement` field.
- `imageRights` object type — import and reuse directly for each édition image's `rights` field, no changes needed.
- `HERO_COLOR_OPTIONS`/`HeroColorInput`/`PublishedPageLinks` from `gallery.ts` imports are gallery/homepage-specific and NOT needed for `edition` (no heroColor, no showOnHomePage — see D-13). `PublishedPageLinks` (readonly "page publiée" field) may still be worth reusing since éditions do get published pages in Phase 12 — Claude's discretion whether to include it now or wire it in Phase 12.

### Established Patterns
- Bilingual content fields use a `{fr, en}` object shape with both sub-fields required, not Sanity's built-in document-level internationalization — consistent site-wide (siteSettings.ts originated the `localeTextField` shape).
- Studio field grouping via `groups: [...]` + `group: 'x'` on each field, matching gallery's `publication`/`content`/`homepage`/`photos`/`seo` pattern — édition needs its own group set (no `homepage` group, per D-13).
- Orderable-document-list is opt-in per type via `@sanity/orderable-document-list`'s `orderRankField` (schema-side) + `orderableDocumentListDeskItem` (structure-side) — both halves needed together, as gallery demonstrates.

### Integration Points
- `sanity/schemas/index.ts` — new `edition` import + `schemaTypes` array entry.
- `sanity/schemas/structure.ts` — new desk list item + exclusion-filter entry.
- Phase 12 (next phase) will read this schema's fields via GROQ at build time — field names chosen here (`leadPhoto`, `images`, `statement`, `pageCount`, `printRun`, `dimensions`) are the contract Phase 12 fetches against.

</code_context>

<specifics>
## Specific Ideas

- User's own framing of the Rebut resolution: "the gallery presents the pictures. The edition is a printed editions of this picture collection... I want to keep both part separated... at the end of the gallery I can have a link to the Edition and vice versa" — captured as D-01/D-03.
- Édition photo-shoot images are photos of the printed object (cover, spreads, binding) — a deliberate content distinction from the gallery's photography, not just a schema-naming distinction.
- General style precedent from Phase 10 (`10-CONTEXT.md`): user consistently picks the more thorough/structured option over the minimal one when both are offered (e.g. real shared component over ad-hoc extension). Consistent with this phase's choice of dedicated lead-photo field and structured dimensions over the simpler free-text/array-reuse alternatives.

</specifics>

<deferred>
## Deferred Ideas

- **Gallery ↔ édition cross-link (EDN-08)** — optional link from a gallery's page to its related édition and vice versa, where a match exists. Already tracked in REQUIREMENTS.md's v2 section as deferred to its own future v1.x phase. Not built in Phase 11; schema should not preclude adding an optional `reference` field later (D-03).

None else — discussion stayed within Phase 11's schema/content-model scope. No other new capabilities were proposed.

</deferred>

---

*Phase: 11-schema-content-model*
*Context gathered: 2026-07-22*
