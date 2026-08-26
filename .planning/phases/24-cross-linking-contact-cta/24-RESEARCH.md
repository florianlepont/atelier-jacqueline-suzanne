# Phase 24: Cross-Linking & Contact CTA - Research

**Researched:** 2026-08-26
**Domain:** Astro/Sanity content-model + component wiring (small, self-contained), plus a scoped CSS/markup addition — no new libraries, no new architecture
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Reverse Cross-Link (EDN-12)**
- **D-01:** Mirror the existing forward pattern exactly rather than inventing a new mechanism. Today: `edition.ts`'s `relatedGallery` reference field → `src/lib/related-gallery.ts`'s pure `getRelatedGalleryLink()` helper → consumed by `buildEditionDetailModel()` in `page-models.ts` → rendered as `.edition-detail__related` in `EditionDetailBody.astro`, positioned right after `DetailHero`'s content div, before `GalleryGrid`. The reverse needs: a new `relatedEdition` reference field on the `gallery` Sanity schema, a mirrored (or generalized) link-building helper, a new prop threaded through `buildGalleryDetailModel()`, and rendering in `GalleryDetailBody.astro` (which currently has NO related-link prop at all — this is new to that component).
- **D-02:** Same defensive-null behavior as the existing helper: no gallery has a `relatedEdition` by default (optional field), and a gallery with no associated édition shows no link at all — never a broken/dead-end element. Not every gallery needs one.
- **D-03:** Link position on the gallery detail page mirrors the existing édition-side convention: placed right after `DetailHero`'s content, before `GalleryGrid` (top of the content area) — consistent placement between the two page types, opposite end of the page from the new CONT-04 CTA (which sits after the grid).

**Contact CTA (CONT-04)**
- **D-04:** Destination: links to `/contact/` (the existing spam-protected contact form) — not a `mailto:` link. Reuses the established contact mechanism rather than introducing a second one.
- **D-05:** Tone: direct, purchase-oriented ("click here to inquire about buying"), but framed as "contactez-nous" (contact **us**) rather than naming Romane specifically — this is a deliberate departure from the initially-proposed "Contactez Romane" wording.
- **D-06:** Copy is generic across both gallery and édition pages — no per-page contextual wording ("cette collection" / "cette édition"). One shared component, one string. Approximate locked direction: **"Intéressé·e par une pièce ? Contactez-nous →"** (exact final copy is implementation-level, but must stay within this direct/generic/us-framed direction — do not revert to naming Romane or to a softer editorial tone).
- **D-07:** Placement: after the last `GalleryGrid` item, before the page ends — literally "the end of the photo sequence" per the roadmap wording. On gallery pages this is the only in-page content after the grid — see the Summary/Pitfall 4 below for a research-time correction to this decision's stated `hideFooter` premise (the underlying placement requirement — real, non-footer, in-flow content — is unaffected). On édition pages the footer is NOT hidden, but for consistency the CTA renders the same way, in the same relative position (after the grid), on both page types.
- **D-08 (resolved via sketch 018, winner Variant B "Renforcé"):** Visual weight — same text-link-with-arrow family as the site's existing `.editions-index__cta` / `.edition-detail__related` links (no filled/pill button anywhere on this site, and this stays consistent with that), but heavier than those: 20px `Unbounded` (weight 600) display-font text (not the 14px `--text-label-size` those use), a thin 1px pink (`--pink-600`/`--color-accent`) hairline rule directly above it marking a deliberate "closing" moment, and generous top spacing (`--space-2xl`) separating it from the grid above. See `.planning/sketches/018-gallery-edition-contact-cta/README.md` and `index.html` (Variant B) for the exact confirmed markup/CSS to implement from.
- **D-09:** On Édition pages specifically, where BOTH the existing related-gallery link (top, unchanged, stays at its current subtle `.edition-detail__related` treatment) and the new heavier CONT-04 CTA (bottom) are present: no additional visual differentiation beyond position and weight is needed — confirmed via sketch 018, which showed both together and got explicit sign-off. Do not make the top related-link heavier or add extra distinguishing chrome; its current subtle treatment stays exactly as-is.

### Claude's Discretion
- Exact final English copy for the CTA (only the FR direction was locked: direct, generic, "contactez-nous" framing, not naming Romane) — mirror the same tone/structure in English.
- Whether EDN-12's new Sanity field/helper generalizes the existing `related-gallery.ts` into a bidirectional shared module, or ships as a separate parallel file mirroring its structure — implementation-level choice, not a user-facing decision (see Pitfall 5 for the naming implications of each choice).
- Exact spacing/sizing values beyond what sketch 018 already pins (Variant B's CSS is the reference implementation; minor adjustment during real integration, e.g. to match real photo aspect ratios instead of the sketch's placeholder thumbnails, is expected and fine).

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope. The v1.x Shop/Checkout wave (real "buy" flow that CONT-04 is explicitly standing in for) remains a separate, larger, not-yet-scoped milestone, not raised as new scope here.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| EDN-12 | Visitor viewing a Portfolio gallery detail page can navigate to its associated Édition, if one exists (reverse of the existing édition→gallery link, EDN-08/v1.3) | Architecture Patterns Pattern 1 + System Architecture Diagram give the exact schema→GROQ→sanitizer→page-model→render chain to mirror; Code Examples section gives the verbatim current helper/query to copy; Pitfalls 1 and 2 flag the two concrete implementation traps (sanitizer field leakage across gallery/edition; which of the two mirrored queries is actually load-bearing) |
| CONT-04 | Visitor sees a CTA prompting them to contact Romane at the end of each Portfolio gallery's and Édition's photo sequence, standing in for a sales flow that doesn't exist yet | Architecture Patterns Pattern 2 gives the exact sketch-018-verbatim markup/CSS plus the one gap (missing `:focus-visible`) to close against site convention; Pitfall 4 corrects CONTEXT.md's stale `hideFooter` premise so the planner doesn't over-build footer-avoidance logic that's no longer needed |
| UI-03 | EDN-12 and CONT-04 render correctly and are verified clean on both mobile and desktop/tablet viewports, with no regressions to existing layouts in either viewport class | Pitfall 3 provides the code-level proof that CONT-04's added height cannot affect `DetailHero`'s desktop scroll-track math or the scroll-up-to-return gesture; Validation Architecture's Phase Requirements → Test Map enumerates the specific existing e2e files/describe-blocks to extend at both breakpoints, including a regression guard mirroring the existing PORT-06 scroll-track assertion |
</phase_requirements>

## Summary

This phase is almost entirely a "mirror what already exists" exercise. EDN-12's reverse gallery→édition link is a byte-for-byte structural mirror of the shipped `relatedGallery` (édition→gallery) cross-link — same Sanity `reference` field pattern, same pure-helper/GROQ-projection/page-model/render chain, just walked in the opposite direction. CONT-04's contact CTA is a new, purely presentational component with its exact markup/CSS already pinned by sketch 018 Variant B (confirmed, no further design exploration needed).

The single technical risk CONTEXT.md flagged — whether adding CTA content changes `DetailHero`'s pinned desktop scroll-track math or breaks the scroll-up-to-return gesture — is **verified NOT an issue** (see Common Pitfalls / Pitfall 3 for the code-level proof). More importantly, this research found that **CONTEXT.md's premise about gallery pages hiding the footer is stale**: `GalleryDetailPage.astro` does **not** pass `hideFooter` to `BaseLayout` today. A prior phase (PORT-06, v1.5) deliberately reversed the original `hideFooter=true` behavior on gallery detail pages "on direct user instruction" — the footer has rendered on gallery detail pages exactly like édition pages ever since, and an existing e2e test (`gallery.spec.ts` "PORT-06 ... reverses quick-260726-ltr Item 1") explicitly asserts this and says "do not fix this back." Both page types today have byte-identical footer behavior — footer always renders below the grid on both. This does not change the plan's placement decision (D-07 stands: the CTA still needs to sit as real page content right after `GalleryGrid`, not as footer content, exactly the same on both page types) but it removes the "must never touch the footer" pressure CONTEXT.md's stale doc-comment implied, and the planner should not re-derive a hideFooter-driven placement constraint from an outdated comment left in `GalleryDetailBody.astro` (line 51-52), which still says "gallery-only footer hide" despite that prop no longer being wired.

**Primary recommendation:** Implement both features by mirroring the existing édition→gallery pattern exactly (schema field → GROQ projection in both list and detail queries → sanitizer → page-model prop → body-component render), and implement the CTA using sketch 018 Variant B's markup/CSS verbatim (renamed to this project's BEM-ish class convention), added as a new shared render fragment invoked identically from both `GalleryDetailBody.astro` and `EditionDetailBody.astro`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Reverse gallery→édition reference storage | Database/Storage (Sanity Content Lake) | — | New optional `reference` field on the `gallery` document type, mirrors `edition.relatedGallery` |
| Build-time reference dereferencing (GROQ) | Build tooling (Astro build-time fetch) | — | `src/lib/sanity.ts` — no runtime compute exists (static OVH host), so this must resolve at build time, same as the existing `relatedGallery->{...}` projection |
| Cross-link render model / null-safety | Frontend build (Astro frontmatter, `page-models.ts`) | — | Pure fr/en → render-model transform, no browser code |
| Cross-link + CTA markup/styling | Browser/Client (static HTML+CSS, no JS) | — | Plain anchor tags with scoped `<style>`, matches the site's zero-JS-by-default philosophy; the CTA needs no interactivity beyond a CSS `:hover`/`:focus-visible` transform |
| Contact form submission itself | Browser/Client → static PHP endpoint (out of scope) | — | CONT-04 only links to the existing `/contact/` page; it does not touch the contact form/delivery mechanism (already deferred to Phase 5 per project memory) |

## Standard Stack

No new packages. This phase adds zero dependencies — it extends the existing Astro + Sanity stack with new schema fields, GROQ projections, and Astro component markup, using only the framework/library versions already installed.

### Core (unchanged, for reference)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | ^7.1.4 (installed; CLAUDE.md documents 7.0.6 — verify actual resolved version via `npm ls astro` at implementation time, minor drift is expected and inconsequential) | Static site framework | Already the project's sole framework |
| `@sanity/client` | 7.23.0 | Build-time GROQ fetch | Already used for every content type; this phase adds fields/queries, not a new client usage pattern |
| `sanity` (Studio) | ^6.4.0 | Schema authoring / editorial UI | Existing `defineField`/`defineType` pattern from `edition.ts` mirrors directly |

### Package Legitimacy Audit

Not applicable — this phase installs no new packages (npm or otherwise). Skip the legitimacy gate entirely.

## Architecture Patterns

### System Architecture Diagram

```
Sanity Studio (editorial UI)
  |  Romane sets gallery.relatedEdition -> an édition document (optional)
  v
Sanity Content Lake (published perspective only)
  |
  |  Astro build-time fetch (src/lib/sanity.ts)
  |  GROQ: relatedEdition->{title, "slug": slug.current}
  v
sanitizeGalleryDocument() (src/lib/sanity-validation.ts)
  |  defensive: malformed/partial dereference -> undefined, never a broken link
  v
buildGalleryDetailModel() (src/lib/page-models.ts)
  |  calls getRelatedEditionLink(gallery.relatedEdition, locale)  [new, mirrors getRelatedGalleryLink]
  |  -> RelatedGalleryLink | null  (href via getRelativeLocaleUrl, so base-path-safe)
  v
GalleryDetailBody.astro
  |  renders <a class="gallery-detail__related"> right after DetailHero, before GalleryGrid (D-03)
  |  ALSO renders new shared CTA fragment after GalleryGrid closes (CONT-04)
  v
Static HTML (no client JS added) --> visitor clicks either link --> normal <a href> navigation
```

Mirror path for CONT-04 on the édition side: `EditionDetailBody.astro` already renders its existing top `relatedLink` (unchanged) and gains only the same new shared CTA fragment after its own `GalleryGrid` close.

### Recommended Project Structure

No new directories or files beyond what's listed in Integration Points below. This phase touches existing files; it does not introduce a new architectural layer.

```
sanity/schemas/
├── gallery.ts        # + relatedEdition reference field (mirrors edition.ts's relatedGallery)
├── edition.ts         # unchanged (relatedGallery stays as-is)
src/lib/
├── sanity.ts          # + relatedEdition->{...} projection in GALLERIES_QUERY + GALLERY_BY_SLUG_QUERY
├── sanity-validation.ts  # + relatedEdition sanitization in sanitizeGalleryDocument (see Pitfall 1)
├── related-gallery.ts  # extend to bidirectional module OR add a sibling helper (Claude's Discretion, D- context)
├── page-models.ts      # buildGalleryDetailModel() gains a relatedLink-equivalent prop
src/components/
├── GalleryDetailBody.astro   # + related-link render (top) + new CTA fragment (bottom)
├── EditionDetailBody.astro   # + new CTA fragment (bottom) only — top related-link untouched
```

### Pattern 1: Bidirectional reference field, unidirectional per-document

**What:** `gallery.relatedEdition` (new) and `edition.relatedGallery` (existing) are two independent, optional, one-way Sanity `reference` fields — not a genuine bidirectional/synced pair. Setting one does NOT automatically populate the other; Romane must set both sides manually if she wants a gallery and its édition to cross-link in both directions.
**When to use:** Confirmed appropriate here — D-02 explicitly requires "not every gallery needs one" and defensive-null behavior identical to the existing helper. A bidirectional/synced reference (e.g., via a Sanity plugin) would be over-engineering for two fields on a single-editor, small-catalog site.
**Example:**
```typescript
// sanity/schemas/edition.ts (existing, lines 76-84) — the field to mirror
defineField({
  name: 'relatedGallery',
  title: 'Collection photo liée (optionnel)',
  type: 'reference',
  group: 'relatedCollection',
  to: [{type: 'gallery'}],
  description: '...',
}),
```
No circular-reference problem exists in Sanity for two independent reference fields pointing at each other's document types — GROQ dereferencing (`->`) resolves one hop at a time and does not recurse into the target's own references unless explicitly projected, so `gallery.relatedEdition->{title, slug}` never risks pulling in that édition's own `relatedGallery` back-reference. `[ASSUMED]` — standard Sanity/GROQ dereference behavior, not verified against Sanity's own docs this session, but consistent with how the existing `relatedGallery->{...}` projection already behaves in production.

### Pattern 2: Sketch-pinned CTA markup (sketch 018 Variant B)

**What:** The confirmed CTA markup/CSS from `.planning/sketches/018-gallery-edition-contact-cta/index.html` (Variant B, `.cta--b`/`.cta--b-rule`/`.cta-zone--b` in the sketch) is the reference implementation — read directly, not re-derived.
**When to use:** Implement verbatim, renamed to this project's BEM-ish convention (e.g., `.gallery-detail__contact-cta` / `.edition-detail__contact-cta`, or a shared class if the fragment is extracted into its own component — see Pitfall 5).
**Example (from sketch, verified live at `.planning/sketches/018-gallery-edition-contact-cta/index.html` lines 107-118):**
```css
.cta-zone--b { padding-top: var(--space-2xl); }
.cta--b-rule { border-top: 1px solid var(--pink-600); width: 48px; margin-bottom: var(--space-md); }
.cta--b {
  display: inline-flex; align-items: center; gap: 10px;
  color: var(--color-ink); font-family: var(--font-display); font-weight: 600;
  font-size: 20px; line-height: 1.25; text-decoration: none;
  border-bottom: 1px solid transparent;
}
.cta--b:hover { border-bottom-color: var(--color-ink); }
.cta--b .arrow { color: var(--pink-600); font-size: 20px; transition: transform 0.15s ease; }
.cta--b:hover .arrow { transform: translateX(4px); }
```
```html
<!-- Sketch markup (mobile shows a manual <br> for a two-line wrap; desktop
     is single-line — real implementation should let CSS/text-wrap handle
     this responsively rather than hardcoding a <br>, since real copy width
     will differ slightly from the sketch's placeholder French string) -->
<div class="cta-zone cta-zone--b">
  <div class="cta--b-rule"></div>
  <a class="cta--b" href="/contact/">Intéressé·e par une pièce ? Contactez-nous <span class="arrow" aria-hidden="true">→</span></a>
</div>
```
**Gap vs. site convention to close during implementation:** the sketch's `.cta--b` has no `:focus-visible` state. Every other interactive element on this site pairs `:hover` with `:focus-visible` (see `.edition-detail__related:hover, :focus-visible` in `EditionDetailBody.astro` lines 145-150, and the global `a:focus-visible` rule in `BaseLayout.astro` lines 452-456 which already provides a baseline pink outline). Add an explicit `:focus-visible` rule mirroring `.edition-detail__related`'s pattern rather than relying on the global fallback alone, for parity with the existing related-link treatment on the same pages.

### Anti-Patterns to Avoid
- **Re-deriving the CTA's visual design from the text description in CONTEXT.md instead of reading the sketch HTML/CSS directly:** the exact pixel values (20px, `--space-2xl`, `--space-md`, `translateX(4px)`, `border-top: 1px solid var(--pink-600); width: 48px`) are only in the sketch file, not fully spelled out in prose.
- **Making the CTA a filled/pill button:** MANIFEST.md and CONTEXT.md D-08 are explicit — no filled buttons anywhere on this site; the CTA is a heavier variant of the same text-link-with-arrow family already shipped.
- **Wiring the reverse link through a new bidirectional/synced-reference mechanism:** unnecessary complexity for two independent optional fields on a single-editor site (see Pattern 1).
- **Deriving the gallery-page footer/scroll-track risk assessment from `GalleryDetailBody.astro`'s stale doc-comment** (line 51-52, "gallery-only footer hide") instead of reading `GalleryDetailPage.astro` directly, which no longer passes `hideFooter` at all (see Pitfall 4).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| Locale-aware, base-path-safe href construction | A manual string-concatenation URL builder | `getRelativeLocaleUrl` from `astro:i18n` (already the pattern in `related-gallery.ts`) | Automatically applies Astro's configured `base` (e.g. `/ajs-website/` on GitHub Pages), which is what keeps hrefs passing CI's un-prefixed-link grep guard — a manual string build would need to duplicate that base-awareness and risks silently failing that CI gate |
| Defensive null-handling for a partially-populated Sanity reference | Ad-hoc `if` chains scattered across the render layer | A single pure helper function returning `T | null` (mirrors `getRelatedGalleryLink`) | Centralizes the "malformed dereference → render nothing, never a broken link" rule in one tested location instead of re-implementing it at each call site |

**Key insight:** This phase's "don't hand-roll" list is short because the phase is explicitly a mirror of an already-correct, already-tested pattern — the discipline here is fidelity to that pattern, not inventing new abstractions.

## Common Pitfalls

### Pitfall 1: `sanitizeGalleryDocument` is shared by BOTH galleries and editions — adding `relatedEdition` sanitization there will leak into `Edition` unless explicitly stripped

**What goes wrong:** `sanitizeEditionDocument()` (`src/lib/sanity-validation.ts` line 256) calls `sanitizeGalleryDocument(value)` as its `base`, then destructures OUT the gallery-only fields it doesn't want (`heroColor`, `isVisible`, `showOnHomePage`, `seo` — see lines 292-298) before building the final `Edition` value from the `...shared` rest. If `relatedEdition` sanitization is added inside `sanitizeGalleryDocument()` without also adding it to that destructuring-exclusion list, every édition document would silently gain a stray `relatedEdition` field that has no business being there (an édition schema has no `relatedEdition` field at all — only galleries do).
**Why it happens:** The gallery and edition sanitizers share a base function for their large common surface (title/slug/statement/images), which is a deliberate, correct reuse — but it means every gallery-only field added to that shared base needs a matching exclusion on the edition side, a step that is easy to forget because it lives in a different function than the one being edited.
**How to avoid:** When adding `relatedEdition` sanitization logic to `sanitizeGalleryDocument()`, add `relatedEdition` to the existing destructuring-exclusion line in `sanitizeEditionDocument()` (currently `const {heroColor: _heroColor, isVisible: _isVisible, showOnHomePage: _showOnHomePage, seo: _seo, ...shared} = base.value;`) in the same task/commit.
**Warning signs:** A TypeScript error is NOT guaranteed here — `Edition`'s own interface in `src/lib/sanity.ts` doesn't declare `relatedEdition`, so `...shared` spreading an extra field would either fail `astro check`/`tsc` (likely, since `Edition` is a closed interface and the return type is annotated) or silently carry an untyped extra property depending on how the return is typed — verify via `npm run typecheck` after this change, don't assume the compiler catches it for free.

### Pitfall 2: `relatedGallery->{...}`-style parity exists in TWO queries per document type — mirror both, but only one is actually load-bearing

**What goes wrong:** Both `EDITIONS_QUERY` (list) and `EDITION_BY_SLUG_QUERY` (detail) currently project `relatedGallery->{title, "slug": slug.current}` (`src/lib/sanity.ts` lines 220-226), and both have matching unit-test assertions (`tests/unit/edition-query.test.ts` lines 189-194, 306-315). However, the comment at lines 185-188 of that test file notes the *detail* page actually receives its `edition` prop from `getEditions()` (the list query) via `getStaticPaths`, not from `getEdition()` — so `EDITION_BY_SLUG_QUERY`'s copy of the projection is not load-bearing for that specific page today, kept only for API parity/consistency (`getEdition()` is presumably used elsewhere or reserved for future use). The exact same pattern applies to galleries: `src/pages/galleries/[slug].astro` builds its static paths from `getGalleries()` (`GALLERIES_QUERY`), not `getGallery()` (`GALLERY_BY_SLUG_QUERY`) — confirmed via a repo-wide grep showing `getGallery()` (singular) has zero call sites anywhere in `src/`.
**Why it happens:** Two near-identical queries maintained for a consistent public API surface, even though only one is wired into the actual page-generation path today.
**How to avoid:** Add `relatedEdition->{title, "slug": slug.current}` to BOTH `GALLERIES_QUERY` and `GALLERY_BY_SLUG_QUERY` for parity with the édition-side precedent and to keep the currently-unused `getGallery()` export correct for any future caller — but know that `GALLERIES_QUERY` is the one whose correctness actually gates EDN-12 rendering on the live site. Write the primary unit test assertion against `getGalleries()`; a mirrored assertion against `getGallery()` is good parity hygiene, not the load-bearing test.
**Warning signs:** A test that only exercises `getGallery()` (singular) and never `getGalleries()` would pass while the real feature stays broken on every actual page load.

### Pitfall 3: The flagged "does CONT-04 break DetailHero's scroll track?" risk — verified NOT an issue, but verify assumptions if `DetailHero.astro` changes later

**What goes wrong (hypothetical, not actual):** CONTEXT.md worried that adding CTA content (and its extra height) after `GalleryGrid` might interact badly with `DetailHero`'s desktop scroll-reveal math, which is pinned to a fixed `calc(100svh + 900px)` track.
**Why this is NOT a risk (verified via code read, `src/components/DetailHero.astro`):**
- The reveal progress is computed purely from `.detail-hero`'s own `getBoundingClientRect().top` divided by a constant `REVEAL_DISTANCE = 900` (lines 263, 312-314) — this depends only on how far the viewport has scrolled relative to `.detail-hero`'s own top edge, which is fixed the instant `.detail-hero` itself is laid out. Content added anywhere *after* `.detail-hero` in the document (i.e., inside `.gallery-detail__content`, after `GalleryGrid`) cannot change `.detail-hero`'s own position or height — it can only make the *total page* taller.
- `.detail-hero__pin` uses `position: sticky; top: 0; height: 100svh` inside a `calc(100svh + 900px)`-tall parent (lines 490, 496-502) — a CSS sticky element's pin/release behavior is governed entirely by its own containing block's bounds, not by later siblings in the document.
- The scroll-up-to-return gesture (lines 352-484) arms via `hasEngaged` once `window.scrollY >= ENGAGE_DISTANCE` (300px, absolute scroll position) and fires only when `atTop()` (`scrollY <= 4`) — both are pure `window.scrollY` checks, unaffected by total document height. Adding more content below only ever *increases* available scroll room, which is strictly favorable: a very short gallery (few images, page shorter than 300px of scrollable content) is the one edge case where the gesture "simply never arms — safe graceful degradation" per the component's own code comment (lines 383-389) — CONT-04's extra height, if anything, makes that degradation case less likely to occur, not more likely to break.
- This exact reasoning is already codified in a shipped test: `tests/e2e/gallery.spec.ts`'s "PORT-06 ... reverses quick-260726-ltr Item 1" describe block (line 823-831) asserts `document.documentElement.scrollHeight - window.innerHeight >= 300` specifically because *restoring the footer* (which is pure added height, the same category of change CONT-04 is) only ever helps this constraint.
**How to avoid:** Nothing to build defensively here — just don't re-litigate this as an open risk in planning. If a future change ever makes `.detail-hero`'s own layout depend on later siblings (it doesn't today), re-verify.
**Warning signs:** N/A — no action needed. Optionally add an e2e assertion mirroring the existing PORT-06 scroll-track test (`track >= 300`) on a gallery/édition with the new CTA present, as a regression guard (see Validation Architecture below), since a future, unrelated CSS change is the more realistic way this could ever break, not this phase's own work.

### Pitfall 4: CONTEXT.md's `hideFooter=true` premise for gallery pages is stale — verify current behavior directly, don't trust the doc-comment

**What goes wrong:** CONTEXT.md's `<code_context>` section states gallery detail pages "pass `hideFooter={true}` to `BaseLayout.astro`" and that this is why CONT-04 "CANNOT be a footer-adjacent element." Reading `src/components/GalleryDetailPage.astro` directly (the actual component that calls `<BaseLayout>` for gallery pages) shows it does **not** pass a `hideFooter` prop at all — it only passes `headerVariant="transparent"` and `mobileNav={true}`. `hideFooter` defaults to `false` in `BaseLayout.astro` (line 90), so the footer renders unconditionally on gallery detail pages today. Grepping for all `hideFooter` usages in `src/` confirms the prop is passed exactly once in the entire codebase, by `src/pages/404.astro` — nowhere in the gallery or édition detail-page call chain.
**Why it happens:** A prior phase, PORT-06 (v1.5, shipped), deliberately reversed the original `hideFooter=true` gallery behavior "on direct user instruction" (see the doc comment at `tests/e2e/gallery.spec.ts` lines 823-831: "the footer that block deliberately hid on gallery detail pages now renders again, exactly as it always has on édition detail pages. Do not 'fix' this back — the reversal is intentional."). `GalleryDetailBody.astro`'s own doc comment (lines 51-52: "gallery-only footer hide — édition detail pages deliberately keep the footer") was never updated after PORT-06 shipped and is now factually wrong about the current wiring, even though it correctly describes the *original* (pre-PORT-06) design intent.
**How to avoid:** Treat gallery and édition detail pages as having **identical** footer behavior today (footer always renders below the content) when planning CONT-04's placement. This doesn't change *where* the CTA goes — D-07's placement (after `GalleryGrid`, before the footer, as real page content) is correct regardless, and is now literally the same instruction for both page types rather than a gallery-specific accommodation. It does mean the planner should not add any extra hideFooter-aware conditional logic to the CTA's rendering — none is needed.
**Warning signs:** If a future task references `hideFooter` as a reason for a gallery-specific code branch in this phase, that's a signal the stale comment (not the actual code) is being relied on — verify against `GalleryDetailPage.astro` directly.

### Pitfall 5: `related-gallery.ts` generalization vs. parallel file — either choice needs the type name kept distinct from its content

**What goes wrong:** `RelatedGalleryLink` (the interface in `related-gallery.ts`) is a generic `{href, text}` shape that already works unmodified for a reverse "related édition" link (its name just says "Gallery" because that was the only direction that existed). CONTEXT.md leaves the generalize-vs-parallel-file choice at Claude's Discretion. Either choice is fine functionally, but naming matters for readability: if generalized into one bidirectional module, keep a shared, direction-neutral exported type (e.g. `RelatedLink`) rather than continuing to import a type called `RelatedGalleryLink` for an édition-side link, which would read backwards at every call site (`EditionDetailModel.relatedLink: RelatedGalleryLink` already exists and is fine as-is since it IS a link to a gallery; but a NEW `GalleryDetailModel.relatedLink: RelatedGalleryLink` would be describing a link TO an édition using a type named "Gallery", which is confusing).
**Why it happens:** The existing type name encodes the one direction that existed when it was written; extending it without renaming silently propagates a now-inaccurate name.
**How to avoid:** If generalizing `related-gallery.ts` into a shared bidirectional module, rename the exported interface to something direction-neutral (`RelatedLink`) and update the one existing consumer (`EditionDetailModel.relatedLink`'s type annotation in `page-models.ts` line 215) accordingly. If instead shipping a parallel file (e.g. `related-edition.ts`) per the "separate parallel file mirroring its structure" option CONTEXT.md also allows, this problem doesn't arise — each file keeps its own correctly-named type, at the cost of ~30 lines of near-duplicate code (mirrors the existing `related-gallery.ts`, which is a short, pure, already-tested pattern — duplication cost is low here either way).
**Warning signs:** A type name and its actual referent visibly disagree in a diff review (`RelatedGalleryLink` used to type a link that points at an édition).

## Code Examples

### Existing forward-direction helper, the exact pattern to mirror (verified current, `src/lib/related-gallery.ts`)
```typescript
// Source: src/lib/related-gallery.ts (read directly, current as of this research)
import { getRelativeLocaleUrl } from 'astro:i18n';

export interface RelatedGalleryLink {
  href: string;
  text: string;
}

type RelatedGallery = { title: string; slug: string } | null | undefined;

export function getRelatedGalleryLink(
  relatedGallery: RelatedGallery,
  locale: 'fr' | 'en',
): RelatedGalleryLink | null {
  if (!relatedGallery) return null;
  const { title, slug } = relatedGallery;
  if (!title?.trim() || !slug?.trim()) return null;
  const href = getRelativeLocaleUrl(locale, `galleries/${slug}`);
  const text = locale === 'fr'
    ? `Voir la collection « ${title} »`
    : `View the "${title}" collection`;
  return { href, text };
}
```
The reverse `getRelatedEditionLink` (or generalized equivalent) needs the identical shape, swapping `galleries/${slug}` for `editions/${slug}` and adjusting the fr/en copy to reference an édition rather than a collection.

### Existing GROQ projection pattern, both list and detail queries (verified current, `src/lib/sanity.ts` lines 220-226)
```typescript
// Source: src/lib/sanity.ts (read directly, current as of this research)
const EDITIONS_QUERY = /* groq */ `*[_type == "edition" && ${PUBLISHED_EDITION_FILTER}] | order(orderRank) {
  _id, title, "slug": slug.current, statement, ${IMAGES_WITH_DIMENSIONS_PROJECTION}, pageCount, printRun, dimensions, publicationStatus, relatedGallery->{title, "slug": slug.current}
}`;
```
The gallery-side mirror adds `relatedEdition->{title, "slug": slug.current}` to both `GALLERIES_QUERY` (line 173-175, load-bearing per Pitfall 2) and `GALLERY_BY_SLUG_QUERY` (line 177-179, parity-only).

## State of the Art

No frameworks/libraries changed state here — this is entirely internal-pattern work. Nothing in this table applies.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | GROQ dereference (`->`) does not recurse into a target document's own reference fields unless explicitly projected, so no circular-fetch risk exists between `gallery.relatedEdition` and `edition.relatedGallery` | Architecture Patterns, Pattern 1 | Low — this is standard, well-documented GROQ behavior and is already implicitly relied upon by the existing shipped `relatedGallery->{...}` projection; if wrong, the failure mode would be an oversized/slow build-time query, not incorrect data or a build break, and would surface immediately in local `npm run build` |
| A2 | The installed Astro version is `^7.1.4` per `package.json`, though CLAUDE.md's Technology Stack table states `7.0.6` | Standard Stack | Negligible — cosmetic drift between documentation and lockfile; does not affect any pattern in this phase. Planner should run `npm ls astro` if precision matters, but no phase task depends on the exact patch version |

## Open Questions

None. CONTEXT.md's own flagged risk (DetailHero scroll-track interaction) was fully investigated and resolved (Pitfall 3). The two other CONTEXT.md "verify at research/planning time" items (page delegation structure, footer/hideFooter state) were both directly verified against current source (Pitfalls 4 and the System Architecture Diagram / route files read in this session).

## Environment Availability

Skipped — this phase has no new external tool/service dependencies. It uses the existing Astro build, existing Sanity project/dataset, and existing GitHub Actions pipeline, all already confirmed operational by prior phases.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.9 (unit) + Playwright 1.61.1 (e2e) — both already configured, both BLOCKING CI gates |
| Config file | `vitest.config.ts` (root), `playwright.config.ts` (root) |
| Quick run command | `npm run test:unit` (Vitest, fast — seconds) |
| Full suite command | `npm run test:unit && npm run test:e2e` (matches this project's `test_command` config: `npm run typecheck && npm run test:unit && npm run test:e2e`) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| EDN-12 | `getRelatedEditionLink()` (or generalized helper) returns correct fr/en href+text for a populated `relatedEdition`, `null` for missing/malformed | unit | `npx vitest run tests/unit/related-gallery.test.ts` (extend, or a sibling file) | ✅ existing file to extend, or ❌ new sibling file — Wave 0 |
| EDN-12 | `GALLERIES_QUERY`/`GALLERY_BY_SLUG_QUERY` project `relatedEdition->{...}`; a populated value passes through `getGalleries()`/`getGallery()` intact; a null/absent value resolves without error | unit | `npx vitest run tests/unit/gallery-query.test.ts` (extend, mirrors `edition-query.test.ts`'s existing `relatedGallery` assertions at lines 189-194, 196-216, 229-246) | ✅ existing file to extend |
| EDN-12 | `sanitizeGalleryDocument()` correctly sanitizes/strips a malformed `relatedEdition`, and `sanitizeEditionDocument()` does NOT leak a stray `relatedEdition` field onto `Edition` (Pitfall 1 regression guard) | unit | new assertions in `tests/unit/gallery-query.test.ts` or a `sanity-validation.test.ts` if one exists (verify at Wave 0 — not confirmed in this research pass) | ❌ verify/create at Wave 0 |
| EDN-12 | A gallery detail page with a populated `relatedEdition` shows a visible, correctly-hrefed related-édition link at the top of the content area, on both mobile and desktop viewports; a gallery with no `relatedEdition` shows no such link (D-02) | e2e | `npx playwright test tests/e2e/gallery.spec.ts` (extend, mirrors `edition.spec.ts`'s "editions related-gallery cross-link (EDN-08)" describe block at line 623-670) | ✅ existing file to extend |
| CONT-04 | The contact CTA renders at the end of every gallery's and every édition's photo sequence (universally, no conditional logic), links to `/contact/`, and matches sketch 018 Variant B's confirmed styling, on both mobile (≤767px) and desktop/tablet (≥768px) | e2e | `npx playwright test tests/e2e/gallery.spec.ts tests/e2e/edition.spec.ts` (extend both) | ✅ existing files to extend |
| CONT-04 | On édition pages, the existing top related-gallery link keeps its current subtle treatment unchanged (D-09) while the new bottom CTA renders with its heavier weight — no unintended style bleed between the two | e2e | `npx playwright test tests/e2e/edition.spec.ts` (extend the existing related-gallery describe block, add a sibling assertion for the new CTA's distinct styles) | ✅ existing file to extend |
| UI-03 | No regression to gallery/édition existing layout at either viewport class after both features land — explicit running success criterion, not deferred | e2e | Re-run full existing `gallery.spec.ts` + `edition.spec.ts` suites unmodified sections (regression pass), plus the PORT-06 scroll-track assertion (`tests/e2e/gallery.spec.ts` line 835-849) re-verified with the new CTA content present | ✅ existing coverage; extend the PORT-06 test or add a sibling assertion confirming `scrollHeight - innerHeight >= 300` still holds with CTA content added |

### Sampling Rate
- **Per task commit:** `npm run test:unit` (fast, seconds)
- **Per wave merge:** `npm run typecheck && npm run test:unit && npm run test:e2e` (matches project's configured `test_command`)
- **Phase gate:** Full suite green before `/gsd-verify-work`, plus manual UAT at both breakpoints per UI-03 (this project's documented history of phone-specific regressions leaking into desktop — v1.6 HOME-16 — makes automated e2e assertions alone insufficient; explicit manual visual check at both breakpoints is warranted)

### Wave 0 Gaps
- [ ] Confirm whether a dedicated `tests/unit/sanity-validation.test.ts` file exists to extend for Pitfall 1's regression guard, or whether `sanitizeGalleryDocument`/`sanitizeEditionDocument` sanitization is currently only exercised indirectly via `gallery-query.test.ts`/`edition-query.test.ts` — not confirmed in this research pass (a targeted `grep -rl sanitizeGalleryDocument tests/` at planning/Wave-0 time will resolve this quickly).
- [ ] Decide (per Claude's Discretion, D-context) whether the reverse-link helper is a generalized `related-gallery.ts` extension or a new sibling `related-edition.ts` file, since the test file structure (extend `related-gallery.test.ts` vs. new `related-edition.test.ts`) depends on that choice.
- [ ] No new test framework/config needed — both Vitest and Playwright are already fully configured for this exact class of change (mirrors `edition-query.test.ts` and `edition.spec.ts`'s existing EDN-08 coverage almost exactly).

## Security Domain

`security_enforcement: true` (ASVS Level 1) per `.planning/config.json`.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth surface touched — this phase is public, unauthenticated content |
| V3 Session Management | No | No session/cookie logic touched |
| V4 Access Control | No | No access-control logic — both new fields are optional, publicly-readable content fields on already-public documents, gated by the existing `publicationStatus == "published"` filter already applied to both `gallery` and `edition` queries |
| V5 Input Validation | Yes (narrow) | The `slug` GROQ parameter binding pattern already used by `getGallery(slug)`/`getEdition(slug)` (`$slug` bound, never string-interpolated — `src/lib/sanity.ts` lines 317-322, 347-352) must be preserved for any query touched in this phase; no new user-controllable input is introduced (the new field is editor-authored in Studio, not visitor-submitted) |
| V6 Cryptography | No | Not touched |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| GROQ injection via unbound string interpolation | Tampering | Already mitigated project-wide — all existing `$slug`-parameterized queries stay parameterized; this phase adds no new dynamic query construction, only static field additions to existing query template literals |
| Broken/dead-end link from a malformed or stale reference (a referenced gallery/édition unpublished or deleted after the reference was set) | — (not a STRIDE security threat, but a correctness/trust concern explicitly called out in D-02) | Already the established mitigation pattern: `getRelatedGalleryLink`'s defensive `if (!title?.trim() || !slug?.trim()) return null` — the reverse helper must apply the identical guard, since a dereferenced-but-unpublished document returns partial/empty fields under the `published` perspective rather than throwing |

No new attack surface is introduced by this phase: no new user input, no new auth/session state, no new external network call, no new file upload path, and the one new outbound link (`/contact/`) points at an already-existing, already-reviewed internal route.

## Sources

### Primary (HIGH confidence)
- `src/lib/related-gallery.ts` — read directly, current source, the pattern to mirror
- `sanity/schemas/edition.ts` — read directly, current source, `relatedGallery` field definition (lines 76-84)
- `sanity/schemas/gallery.ts` — read directly, current source, confirms no existing `relatedEdition`/related-collection group
- `src/lib/sanity.ts` — read directly, current source, both GROQ queries and their comments
- `src/lib/sanity-validation.ts` — read directly, current source, `sanitizeGalleryDocument`/`sanitizeEditionDocument` shared-base relationship (Pitfall 1)
- `src/lib/page-models.ts` — read directly, current source, `buildGalleryDetailModel`/`buildEditionDetailModel`
- `src/components/GalleryDetailBody.astro`, `EditionDetailBody.astro` — read directly, current source
- `src/components/GalleryDetailPage.astro`, `EditionDetailPage.astro` — read directly, current source, confirms shared-wrapper-component delegation (not per-locale duplication)
- `src/pages/galleries/[slug].astro`, `src/pages/en/galleries/[slug].astro`, `src/pages/editions/[slug].astro`, `src/pages/en/editions/[slug].astro` — read directly, current source, confirms thin locale-adapter pattern
- `src/layouts/BaseLayout.astro` — read directly, current source, `hideFooter` prop definition and default (Pitfall 4)
- `src/components/DetailHero.astro` — read directly, current source, full scroll-reveal + scroll-up-to-return gesture mechanics (Pitfall 3)
- `src/components/GalleryGrid.astro` — read directly, current source, confirms no CTA-related coupling
- `.planning/sketches/018-gallery-edition-contact-cta/README.md` and `index.html` — read directly, confirmed Variant B winner and exact markup/CSS
- `tests/unit/related-gallery.test.ts`, `tests/unit/edition-query.test.ts` — read directly, existing coverage patterns to mirror
- `tests/e2e/gallery.spec.ts`, `tests/e2e/edition.spec.ts` — read directly (targeted sections), existing coverage patterns, PORT-06 footer-restoration history, EDN-08 related-link e2e pattern
- `.github/workflows/deploy.yml` — read directly (grep), confirms CI never runs `sanity deploy`
- `sanity/package.json` — read directly, confirms `sanity deploy` is a manual script, not CI-invoked
- `.planning/config.json` — read directly, confirms `nyquist_validation: true`, `security_enforcement: true`, `security_asvs_level: 1`

### Secondary (MEDIUM confidence)
None used — this research relied entirely on direct codebase reads (primary) since the phase is internal-pattern work with no external library/API surface to research via docs or web search.

### Tertiary (LOW confidence)
None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies, all patterns verified against current source
- Architecture: HIGH — every file in the integration chain was read directly this session, not inferred from CONTEXT.md's snapshot
- Pitfalls: HIGH — all five pitfalls are grounded in direct code reads (line-numbered), not speculation; Pitfall 3 (the CONTEXT.md-flagged risk) and Pitfall 4 (stale hideFooter premise) both resolve concrete open questions from CONTEXT.md with code-level evidence

**Research date:** 2026-08-26
**Valid until:** 2026-09-25 (30 days — stable internal pattern work with no external dependency drift risk; re-verify sooner only if another phase touches `DetailHero.astro`, `BaseLayout.astro`'s `hideFooter` wiring, or the gallery/edition sanitizers before this phase executes)
