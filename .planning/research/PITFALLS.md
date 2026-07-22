# Pitfalls Research

**Domain:** Adding an "Éditions" showcase content type/nav section to the AJS website (v1.3 milestone) — a new non-transactional content type layered onto an existing static Astro + Sanity bilingual portfolio site, explicitly designed as a precursor to a future paid "product" (shop/checkout) milestone.
**Researched:** 2026-07-22
**Confidence:** HIGH for codebase-integration pitfalls (verified directly against `sanity/schemas/gallery.ts`, `sanity/schemas/exhibition.ts`, `sanity/schemas/structure.ts`, `src/components/SiteHeader.astro`, `src/layouts/BaseLayout.astro`, `src/lib/sanity.ts`, `src/lib/site-config.ts`, `src/pages/sitemap.xml.ts`, `src/pages/galleries/[slug].astro`). LOW for general Sanity/Astro-i18n ecosystem claims (uncross-checked web search, see Sources) — used only as supporting confirmation, not as the basis for any codebase-specific claim above.

## Critical Pitfalls

### Pitfall 1: Modeling `edition` so the future "product" fields don't fit cleanly

**What goes wrong:**
The édition schema is built purely as a "gallery clone" — title, slug, images, statement — with format details (page count, print run, dimensions) bolted on as loose top-level fields. When the v1.x shop milestone arrives and needs `price`, `stockQuantity`, `soldOut`, `sku`, or variant handling (e.g. different print runs at different price points), those fields get awkwardly grafted onto a document that was never designed to represent a sellable unit, or a second parallel `product` schema gets created that duplicates édition content, forcing Romane to maintain the same book in two places.

**Why it happens:**
This milestone explicitly forbids building pricing/availability now ("no pricing, availability, or purchase CTA — pure showcase"), which teams over-interpret as "don't even think about the shape it takes later." The path of least resistance is to copy `gallery.ts` verbatim (it is the closest existing pattern) rather than asking "what does this document look like with 3 more fields on it in six months."

**How to avoid:**
- Group format/commerce-adjacent fields under their own schema group now (e.g. a `format` group: `pageCount`, `printRun`, `dimensions`) so a later `commerce` group (`price`, `stockQuantity`, `soldOut`) is an *additive* group, not a restructuring.
- Treat `printRun` as a plain number now (e.g. "300 copies") — do NOT model it as free text ("Tirage limité à 300 exemplaires") baked into the display string, since the future shop milestone needs `printRun` as the ceiling for `stockQuantity` decrementing. A numeric `printRun` field can be rendered as "run of {n}" in both locales today and reused as the stock ceiling later without re-authoring content.
- Do not create a separate `product` document type that re-enters édition title/images/description — when v1.x ships, the shop should *extend* the `edition` document (add fields to the same schema) or reference it by `_ref`, not duplicate its content. Decide and note this intention directly in the schema file as a code comment, the same way this codebase already documents forward-looking intent in `gallery.ts` and `PROJECT.md`.
- Reuse the existing `localeTextField` helper pattern from `gallery.ts` for the description/statement field rather than inlining a new locale-object shape — keeps one schema shape to extend later instead of two divergent ones.
- Do not add a placeholder `price`/`stock` field "just in case" — that violates the milestone's explicit no-pricing scope and risks an editorial UI showing an empty price field to Romane before there's anything to put in it. Extensibility means good *grouping and typing*, not pre-adding disabled fields.

**Warning signs:**
- The schema file has no grouping at all (flat field list), making "add a commerce group" a restructuring rather than an addition.
- `printRun` or `dimensions` are stored as a single free-text string per locale (impossible to validate, sort, or use programmatically later — e.g. "300 ex. / 21x29,7cm" as one blob).
- A reviewer cannot answer "where would `price` and `stockQuantity` go" by looking at the schema file without redesigning it.

**Phase to address:**
Schema/content-model phase (first phase of this milestone) — must be resolved before any route/page work depends on the shape.

---

### Pitfall 2: Scope creep — commerce language or UI creeping into a "no pricing" milestone

**What goes wrong:**
Because the schema is explicitly designed with the future shop in mind, it's easy to let commerce concepts leak into what should be pure showcase UI: a "Disponible" badge, an availability note ("épuisé"), a mailing-list "notify me" CTA, or a props type that already includes `price?: number`. Any of these either (a) requires content Romane doesn't have yet (nobody has set a price), or (b) silently reintroduces the transactional surface this milestone explicitly defers, expanding scope and QA burden with no corresponding requirement.

**Why it happens:**
Once a developer is thinking "this will be a product later," it's tempting to build the affordance now "since it's basically free," especially when copying patterns from e-commerce templates/tutorials found while researching the schema-extensibility question.

**How to avoid:**
- Treat "no pricing/availability/purchase CTA" as a hard UI-layer rule for this milestone: the `edition` schema may group fields for future extensibility (Pitfall 1), but the Astro page templates and GROQ projections for this milestone must not reference or render anything commerce-shaped, even conditionally.
- Re-check the milestone's own "Active" requirement list before adding any UI element: if it's not one of the six listed v1.3 requirements in `.planning/PROJECT.md`, it doesn't belong in this milestone.

**Warning signs:**
- Any Astro template importing a `price` or `stock` field from Sanity, even behind a conditional.
- Studio field labels using commerce language ("Prix", "Stock", "Disponibilité") for anything shipped in this milestone.

**Phase to address:**
Schema/content-model phase (schema itself) and routes/pages phase (templates) — both must independently hold this line since either could reintroduce it.

---

### Pitfall 3: Perpetuating the existing per-locale page-file duplication for a brand-new section

**What goes wrong:**
The codebase's current i18n pattern is two nearly-identical files per route — `src/pages/galleries/[slug].astro` and `src/pages/en/galleries/[slug].astro` — differing only in a hardcoded `locale` const and import depth. Copying this pattern for `src/pages/editions/[slug].astro` + `src/pages/en/editions/[slug].astro` (and an overview-page equivalent) means every future fix to the édition detail template must be applied twice, and it is easy to update one locale variant and forget the other — a bug that won't surface in French QA but silently breaks or serves stale markup in English (or vice versa).

**Why it happens:**
Mirroring the existing gallery pages is the fastest way to ship, and the codebase already has this precedent twice over (about/contact/galleries), so it looks like "the established pattern" rather than debt to avoid propagating further. General Astro i18n guidance explicitly flags this N-pages-times-M-locales duplication as the standard failure mode once a site adds more sections.

**How to avoid:**
- At minimum, factor the shared parts (the actual markup/logic, not just copy) into one shared Astro component consumed by two thin locale-specific page files that differ only in the `locale` constant and copy lookups — mirrors what `BaseLayout`/`SiteHeader` already do for chrome, just applied to page bodies too.
- Add both locale variants and both route levels (overview + `[slug]` detail) to the same commit/PR so a missing counterpart is caught in review, not discovered later.
- Add an e2e/build check (or extend an existing one) asserting the French and English Éditions routes both exist and both render the same slug set — catches "added an édition in Sanity, only shows up in one locale" regressions cheaply.

**Warning signs:**
- A change to the édition detail page touches only one of the two locale files in a diff.
- `getStaticPaths` logic (fetch + slug mapping) is copy-pasted rather than imported from one shared module (as `getGalleries()` already is from `src/lib/sanity.ts` — reuse that pattern with a new `getEditions()`/`getEditionBySlug()`).

**Phase to address:**
Routes/pages phase.

---

### Pitfall 4: New section invisible to search engines and internal link-integrity checks

**What goes wrong:**
`src/pages/sitemap.xml.ts` builds its URL list from a manually maintained array (`galleries.map(...)`, plus hardcoded `about/`, `contact/`, etc.) — it does not auto-discover routes. If Éditions overview/detail pages are added to routing but not added to this file, the new section builds and renders correctly yet is silently absent from the sitemap (and, depending on what else keys off route lists — e.g. an existing "un-prefixed-link grep guard" in the CI pipeline per `CLAUDE.md` — could pass CI green while being unreachable/undiscoverable in ways that look "done" but aren't).

**Why it happens:**
The sitemap generator is easy to overlook because it lives outside the obvious "add a page + add a schema" workflow, and nothing fails loudly when a route is missing from it — the site still builds and the pages still work when visited directly.

**How to avoid:**
- When adding `getEditions()`/`getEditionBySlug()` to `src/lib/sanity.ts`, add the corresponding entries to `sitemap.xml.ts`'s `localizedSitemapPaths` array in the same change — treat "new content type" as requiring a sitemap-file touch by default, the same way it requires a Studio `structure.ts` touch (Pitfall 7).
- Add the Éditions overview + at least one detail URL to whatever the existing e2e suite already checks for gallery pages (internal links resolve, `noIndex` respected, etc.) rather than only smoke-testing that the page renders.

**Warning signs:**
- `sitemap.xml.ts` has no `editions`/`getEditions` reference after the feature ships.
- Nothing in the test suite asserts the sitemap contains an éditions URL.

**Phase to address:**
Routes/pages phase (implementation) with a checklist item carried into whichever phase runs final verification/UAT for this milestone.

---

### Pitfall 5: `<SiteHeader>`'s explicit-props contract makes nav integration look trivial but has real seams

**What goes wrong:**
`SiteHeader.astro` takes fully explicit, named props (`aboutLabel`, `aboutHref`, `contactLabel`, `contactHref`, etc.) — there is no data-driven nav array to just append an item to. Adding "Éditions" means: (1) extending `SiteHeader`'s `Props` interface and template with `editionsLabel`/`editionsHref`, (2) computing those two values in `BaseLayout.astro` (the single real call site post-Phase-10 unification) alongside the existing `aboutLabel`/`aboutHref` computation, and (3) deciding whether the label is hardcoded per-locale (like Instagram's `instagramNewTabHint`) or Sanity-editable (like `aboutLabel`/`contactLabel`, which read from `siteSettings.navLabels`). Skipping step 3's decision and just hardcoding "Éditions"/"Editions" creates an inconsistent editorial surface: Romane can rename "About"/"Contact" in Sanity but not "Éditions", with no visible reason why.

**Why it happens:**
Because `BaseLayout.astro` is genuinely the single header call site today (the homepage was unified onto `<SiteHeader>` in Phase 10 — `index.astro` has no direct `SiteHeader` usage), it's easy to assume "just add one more prop" is the entire task and skip checking whether the new nav label should follow the existing `siteSettings.navLabels` CMS-editable pattern for consistency with About/Contact.

**How to avoid:**
- Extend `SiteSettings.navLabels` in `src/lib/sanity.ts` and `sanity/schemas/siteSettings.ts` with an `editions` locale pair, and extend `resolveSiteCopy()` in `src/lib/site-config.ts` with an `editionsLabel`, mirroring `aboutLabel`/`contactLabel` exactly — don't hardcode the label while its siblings are CMS-editable.
- Add the new prop to `SiteHeader.astro`'s `Props` interface and template in the same change as `BaseLayout.astro`'s computed value, and re-run/extend whatever visual/e2e coverage already exists for the header (Phase 10's "homepage header identical to About/Contact header by construction" guarantee must still hold with a 4th nav link).

**Warning signs:**
- "Éditions" appears as a literal string in `BaseLayout.astro` rather than via `siteCopy.editionsLabel`.
- `SiteSettings.navLabels` type in `src/lib/sanity.ts` still only lists `about`/`contact` after the feature ships.

**Phase to address:**
Nav-integration phase, but the `siteSettings` schema/type extension technically belongs with the schema/content-model phase since it's a Sanity change — sequence schema work first so nav-integration has the field to read.

---

### Pitfall 6: Header/mobile-nav regression from a 4th nav link, invisible in desktop-only manual checks

**What goes wrong:**
`SiteHeader.astro`'s mobile breakpoint (`@media (max-width: 767px)`) CSS was tuned for exactly 3 `.nav-link` items (About, Contact, Instagram) plus the language switcher — the comments in the file note this was "ported forward from HomeCarousel.astro's own live-tested mobile pixel-budget CSS" and that Instagram becoming a 3rd link already required wrap/gap trims. Adding a 4th nav link (Éditions) without re-checking mobile wrapping can push the language switcher below the fold of the header band, cause an ugly two-line wrap, or shrink tap targets below the `--tap-target-min: 44px` the codebase otherwise enforces — none of which shows up if verification is done only on a desktop viewport.

**Why it happens:**
Nav-integration changes are typically eyeballed on a desktop browser during development; the header's own code comments make clear this exact regression class (nav item count vs. mobile pixel budget) has already happened once in this project's history (Instagram's addition), so it is a known recurrence risk, not a hypothetical one.

**How to avoid:**
- Explicitly test the header at mobile widths (< 768px) with the new 4-link nav, in both `solid` and `transparent` header variants (transparent is used on gallery-detail pages and will presumably also be used on édition-detail pages) and in both locales (English labels are typically longer than French, though "Éditions" vs "Editions" is close, unlike "À propos"/"About").
- Re-verify the 44px minimum tap target survives on the smallest supported viewport once a 4th link is present, and check the wrap point doesn't visually separate the language switcher from the nav in a confusing way.

**Warning signs:**
- Nav-integration work only includes a desktop screenshot/manual check in its verification notes.
- No mobile-viewport e2e test asserts nav-link count or layout after the change.

**Phase to address:**
Nav-integration phase.

---

### Pitfall 7: Studio editorial parity gaps — a "genuinely new" content type quietly missing the workflow scaffolding editors already rely on

**What goes wrong:**
`gallery.ts` isn't just fields — it also carries a `publicationStatus` draft/published/archived workflow with radio UI and Studio-list-preview status decoration, a `PublishedPageLinks` "view on site" inspector, an `orderRank` field for Studio drag-reordering (hidden from the edit form per an existing documented pitfall), and a rich `preview()` function showing photo count/status/color at a glance in the document list. `exhibition.ts`, by contrast, is a plainer document type with no `publicationStatus`/orderRank/PublishedPageLinks — it's simply listed via `S.documentTypeListItem('exhibition')` in `structure.ts`. If `edition` is modeled on the *simpler* `exhibition` pattern (since it's "just a showcase," similar reasoning to exhibitions) rather than the richer `gallery` pattern, Romane loses the "En préparation" draft-without-publishing workflow and drag-reorder she's used to for galleries — but the milestone explicitly says éditions should mirror "Portfolio's gallery/gallery-detail structure," not exhibitions'. Conversely, if `edition` is registered in `structure.ts` only via the generic `S.documentTypeListItems()` fallback (forgetting a dedicated list item, as `gallery` and `exhibition` both get), it's harder for Romane to find/reorder in the Studio nav.

**Why it happens:**
There are two existing content-type patterns in this codebase of different richness (`gallery` = full workflow, `exhibition` = plain), and nothing forces a developer to notice the milestone spec says "mirror gallery" specifically before defaulting to whichever pattern feels closer in spirit ("show pieces" feels more like "list events" than "curate photos" at a glance).

**How to avoid:**
- Explicitly copy `gallery.ts`'s structure — `publicationStatus` + `initialValue`, the `orderRankField` (hidden), the `preview()` with status/count decoration, and a `PublishedPageLinks`-style inspector if one is added — rather than `exhibition.ts`'s simpler shape, per the milestone's own explicit instruction to mirror the gallery pattern.
- Add a dedicated `orderableDocumentListDeskItem` entry for `edition` in `sanity/schemas/structure.ts` (as `gallery` has), not just an entry in the generic type-list fallback, and add its type name to the fallback's exclusion array so it isn't listed twice.
- Reuse the `localeTextField` helper and the required bilingual `alt`+`rights` image-array-member shape verbatim from `gallery.ts` for the édition's own photo-shoot images, rather than re-deriving a new (and possibly less strict) image schema — this also keeps the existing "Crédits et droits" bulk-editing tool (`CreditsManager`) working across both content types if it queries by field shape rather than by document type.

**Warning signs:**
- `edition.ts` has no `publicationStatus` field or no `orderRank`.
- `structure.ts`'s exclusion array (the list passed to `.filter()`) doesn't include `'edition'`, meaning it will double-list once a dedicated desk item is added, or won't get a dedicated item at all.

**Phase to address:**
Schema/content-model phase.

---

### Pitfall 8: Existing gallery titles literally named "Édition" create editor and content-migration ambiguity

**What goes wrong:**
Per this project's own `PROJECT.md` context, the site being replaced already lists galleries titled "Rebut - Édition" and "Silo - Édition" — i.e., the word "Édition" is already used as a *photo-collection* naming convention in the migrated content, unrelated to the new paper-éditions content type this milestone introduces. Once a top-level "Éditions" nav section exists, Romane (and visitors) may reasonably expect "Rebut - Édition" to live there, when it is actually a `gallery` document that belongs in Portfolio. This is a naming collision risk, not a technical one, but it will directly cause editor confusion ("where do I put this?") and potentially visitor confusion (nav label vs. existing gallery names) if not addressed explicitly.

**Why it happens:**
The coincidental reuse of the word "édition" across two unrelated meanings (a gallery title suffix on the old site vs. this milestone's new paper-book content type) wasn't a deliberate content decision — it's inherited naming from the site being replaced, discovered only by cross-referencing `PROJECT.md`'s migration context against the new milestone's nav label choice.

**How to avoid:**
- Confirm with Romane during content-model/schema-phase discussion whether "Rebut - Édition"/"Silo - Édition" (as migrated `gallery` documents) should be renamed to avoid confusion once a distinct "Éditions" nav section exists (e.g. drop the "- Édition" suffix, since it was presumably describing something about those specific photo collections on the old Myportfolio site, not signaling they're paper books).
- Add a one-line Studio field description or a `structure.ts` list-item subtitle disambiguating "Collections photo" from "Éditions (livres/zines papier)" so the two content types read as clearly distinct in the Studio nav, not just in the schema's internal `name`.

**Warning signs:**
- No confirmation from Romane/Florian on what "- Édition" in the existing migrated gallery titles is meant to signal, before the new nav section ships.

**Phase to address:**
Schema/content-model phase (raise as a discussion item, not an autonomous code decision — this is a content/naming question for Romane, not a technical one).

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|--------------------|-----------------|------------------|
| Copy-pasting `gallery.ts` into `edition.ts` field-for-field instead of factoring shared bits (locale-text helper, image-with-alt-and-rights shape) into a shared module | Faster to ship this milestone | Two schemas drift independently; a future fix to image-rights validation must be applied in two places | Acceptable only if the duplicated blocks are commented as intentionally mirrored (as `gallery.ts` already comments its own duplication of `siteSettings.ts`'s `localeTextField`) so future readers know it's deliberate, not accidental |
| Hardcoding "Éditions"/"Editions" nav label instead of adding it to `siteSettings.navLabels` | Skips a schema + type + `resolveSiteCopy()` change | Inconsistent editorial surface (Romane can rename other nav labels but not this one), support-burden surprise later | Never — the pattern already exists for About/Contact; matching it costs little |
| Reusing the "gallery" GROQ query pattern (fetch full array of images per document) for the Éditions overview page rather than a lightweight projection (title + first image only) | Simpler code, one query shape everywhere | Overview page ships the full photo-shoot payload for every édition just to show its cover, unnecessary Sanity CDN payload/build-time cost as the number of éditions grows | Acceptable at launch scale (a handful of éditions); revisit if the catalog grows past what makes an overview-page projection meaningfully lighter |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|-----------------|-------------------|
| Sanity Studio `structure.ts` | Registering `edition` only via the generic `S.documentTypeListItems()` fallback, forgetting to add it to the exclusion filter array | Add a dedicated `orderableDocumentListDeskItem` (or plain `S.documentTypeListItem`) entry for `edition`, and add `'edition'` to the exclusion array so it isn't double-listed |
| `siteSettings.navLabels` (Sanity + `src/lib/sanity.ts` type + `resolveSiteCopy()`) | Adding the new nav label only in the Astro layer (hardcoded string) without touching the Sanity schema/type | Extend all three together: schema field, TS interface, `resolveSiteCopy()` |
| `src/pages/sitemap.xml.ts` | Forgetting to add the new route(s) to the manually maintained `localizedSitemapPaths` array | Add `editions/` overview + per-slug detail paths in the same change that adds the routes, using `getEditions()`'s `noIndex`/`seo` fields the same way galleries already do |
| Existing "un-prefixed-link grep guard" in CI (per `CLAUDE.md`'s deploy pipeline description) | New Éditions nav links or internal cross-links written without the base-path-aware helper (`getRelativeLocaleUrl`) that every existing link already uses | Always build édition hrefs via `getRelativeLocaleUrl(locale, 'editions/...')`, exactly like `aboutHref`/`contactHref`/gallery hrefs already do, so the guard passes on both GitHub Pages' subpath base and OVH's root base |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Éditions overview page fetching each édition's full `images[]` array (like `getGalleries()` does for the homepage) just to render one cover thumbnail per édition | Slightly heavier build-time Sanity fetch and larger page payload than necessary; unnoticeable with a handful of éditions | Write a dedicated lightweight GROQ projection for the overview page (title, slug, first image only) instead of reusing the full gallery-shaped query | Only matters once the number of éditions or images-per-édition grows well beyond a small curated catalog — not a v1.3 launch-blocking concern |

## Security Mistakes

Not applicable at meaningful severity for this milestone — this is a read-only, non-transactional content addition with no new user input, auth, or payment surface. The one item worth a note:

| Mistake | Risk | Prevention |
|---------|------|------------|
| Adding a `SANITY_API_READ_TOKEN`-gated preview/draft view for éditions without the same care as existing content types | Could leak unpublished (e.g. "En préparation") édition content or accidentally bundle the read token into client-side JS | Reuse the existing `sanityClient` build-time-only pattern from `src/lib/sanity.ts` verbatim (published perspective only, frontmatter-only import) — do not introduce a new client instance or a client-side Sanity fetch for this feature |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing format details (page count, print run, dimensions) in a way that reads like a product spec sheet (e.g. a table with "Prix: —" or an empty availability row) | Visitors may read the absence of price as a broken/incomplete page rather than an intentional showcase-only page | Present format details as editorial/curatorial facts ("64 pages, 300 exemplaires, 21 × 29,7 cm") in prose or a simple list, with no price/availability row present at all — absence, not an empty field |
| Éditions leaking into the homepage carousel/grid despite the milestone explicitly excluding them | Contradicts the milestone's explicit "not surfaced on the homepage... which stays pure photography" requirement, and risks visitors expecting to buy something they see featured prominently | Do not reuse `gallery`'s `showOnHomePage` boolean pattern on `edition` at all — since éditions should never appear there, omit the field entirely rather than adding it and defaulting it to `false` (a field that always must be `false` is a footgun waiting for someone to flip it) |
| Per-édition detail page reusing the gallery-detail page's transparent hero-header pattern verbatim without adjusting for a book/zine's likely portrait-oriented cover images (vs. galleries' typically landscape hero photography) | A tall/portrait cover image forced into the existing `70vh` full-bleed landscape-oriented hero crop (`object-fit: cover`) can crop out the book's own title/cover art awkwardly | Check the hero treatment against a real portrait-oriented book-cover photo before shipping, and adjust `object-position`/crop framing if needed rather than assuming the landscape-tuned gallery hero style transfers as-is |

## "Looks Done But Isn't" Checklist

- [ ] **Éditions overview + detail pages render**: Often missing — parity in *both* locale directories (`src/pages/editions/` and `src/pages/en/editions/`); verify by visiting both `/editions/` and `/en/editions/`, not just one.
- [ ] **New nav item**: Often missing — the `siteSettings.navLabels.editions` Sanity field actually wired end-to-end (schema → type → `resolveSiteCopy` → `BaseLayout` → `SiteHeader` prop); verify by renaming the label in Sanity Studio and confirming it changes on the live nav without a code change.
- [ ] **Sitemap/SEO discoverability**: Often missing — `sitemap.xml.ts` entries for the new routes; verify by checking the built `sitemap.xml` for `editions/` URLs.
- [ ] **Mobile nav with 4 links**: Often missing — a mobile-viewport check of the header with Éditions added; verify at < 768px width in both header variants (`solid`/`transparent`) and both locales.
- [ ] **Studio editorial parity**: Often missing — draft/publish (`publicationStatus`) workflow and drag-reorder (`orderRank`) on the `edition` type, matching `gallery`; verify a non-technical editor can put an édition "En préparation" without it appearing live, and can drag-reorder the Éditions list in Studio.
- [ ] **No stray commerce UI**: Often missing as a negative-check — grep the new templates/schema for `price`, `stock`, `disponib`, `acheter`, `buy` to confirm none slipped in; verify by reviewing the diff for these terms before merge.
- [ ] **Schema extensibility groundwork**: Often missing — confirm `printRun`/`pageCount`/`dimensions` are typed fields (numbers/structured), not one free-text blob, and confirm a code comment states the intended path for adding commerce fields later (extend in place vs. reference from a future `product` type).

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|-----------------|
| Format details stored as one free-text blob per locale, discovered only when the v1.x shop milestone needs `printRun` as a numeric stock ceiling | MEDIUM | Add new structured fields (`printRun` number, `dimensions` structured width/height/unit), write a one-off Sanity migration script to parse the existing free-text values into the new fields for already-published éditions, then drop the old free-text field once verified |
| Nav label for Éditions hardcoded instead of Sanity-editable, discovered after several éditions are live | LOW | Add the `navLabels.editions` field to the schema + type + `resolveSiteCopy()`, backfill the current French/English strings as its `initialValue`, swap the hardcoded string in `BaseLayout.astro` for the resolved value — no content migration needed, purely additive |
| A separate `product` schema was created for v1.x that duplicates édition title/images instead of extending `edition` in place | HIGH | Requires a genuine content migration: either delete the duplicate `product` documents and extend `edition` with the missing commerce fields (re-authoring any product-only copy back onto the original édition documents), or wire the `product` type to reference `edition` by `_ref` and strip the duplicated fields — both are non-trivial once Romane has been editing both in parallel for a while, which is exactly why Pitfall 1 flags this as the single biggest forward-compatibility risk to get right now |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|-------------------|----------------|
| 1: Schema not extensible for future shop fields | Schema/content-model phase | Reviewer can point to where `price`/`stockQuantity` would go without restructuring the schema; `printRun`/`pageCount`/`dimensions` are typed, not free text |
| 2: Commerce scope creep | Schema/content-model phase + routes/pages phase | Grep diff for price/stock/availability terms before merge; cross-check against the 6 listed v1.3 Active requirements in `PROJECT.md` |
| 3: Per-locale page duplication drift | Routes/pages phase | Both locale directories touched in the same commit; shared logic factored into one module/component, not copy-pasted |
| 4: Sitemap/SEO omission | Routes/pages phase (implementation), verified at milestone UAT | Built `sitemap.xml` contains `editions/` overview + detail URLs |
| 5: Nav prop threading + label CMS-editability inconsistency | Nav-integration phase (with schema piece sequenced into schema/content-model phase) | `siteCopy.editionsLabel` used, not a literal string; renaming in Studio changes the live label |
| 6: Mobile nav regression with a 4th link | Nav-integration phase | Manual or e2e check at < 768px, both header variants, both locales |
| 7: Studio editorial parity gap (draft workflow, ordering, image-rights shape) | Schema/content-model phase | `edition.ts` has `publicationStatus`, hidden `orderRank`, dedicated `structure.ts` desk item, and reuses the `alt`+`rights` image shape |
| 8: "Édition"-named existing galleries causing content confusion | Schema/content-model phase (discussion, not code) | Explicit confirmation from Romane/Florian recorded (e.g. in `PROJECT.md` Key Decisions) on whether existing gallery titles are renamed |

## Sources

- Direct inspection of this repository (HIGH confidence, verified by reading the files): `sanity/schemas/gallery.ts`, `sanity/schemas/exhibition.ts`, `sanity/schemas/structure.ts`, `src/components/SiteHeader.astro`, `src/layouts/BaseLayout.astro`, `src/lib/sanity.ts`, `src/lib/site-config.ts`, `src/pages/sitemap.xml.ts`, `src/pages/galleries/[slug].astro`, `.planning/PROJECT.md`.
- [How to Design Flexible, Scalable Sanity Schemas (Without Regrets Later) — Halo Lab](https://www.halo-lab.com/blog/creating-schema-in-sanity) (web search, LOW confidence, uncross-checked)
- [Deciding on fields and relationships | Sanity Docs](https://www.sanity.io/docs/developer-guides/deciding-fields-and-relationships) (web search, LOW confidence, uncross-checked)
- [Easton Dev Blog — Astro i18n Configuration Guide](https://eastondev.com/blog/en/posts/dev/20251202-astro-i18n-guide/) — documents the N-pages-times-M-locales duplication pitfall this codebase already exhibits (web search, LOW confidence, uncross-checked)
- [Kontent.ai — Systems for success: UX design using a headless CMS](https://kontent.ai/resources/ux-design-using-headless-cms/) (web search, LOW confidence, uncross-checked)

---
*Pitfalls research for: Adding an "Éditions" showcase content type/nav section to the AJS website (v1.3 milestone)*
*Researched: 2026-07-22*
