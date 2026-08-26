# Phase 24: Cross-Linking & Contact CTA - Context

**Gathered:** 2026-08-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Two small, independent requirements, both touching the Portfolio gallery and Édition detail pages:

1. **EDN-12 — Reverse gallery→édition cross-link.** A visitor on a Portfolio gallery detail page can navigate to its associated Édition, if one exists. This is the missing reverse direction of the `relatedGallery` link Phase 13/v1.3 already shipped (édition→gallery only).
2. **CONT-04 — Contact CTA.** A visitor reaching the end of any gallery's or édition's photo grid sees a CTA prompting them to contact Romane, standing in for a sales flow that doesn't exist yet. Applies universally to every gallery and every édition — no conditional/sold-state logic.
3. **UI-03 — Cross-viewport verification.** Both features must be confirmed clean at phone widths (≤767px) and desktop/tablet widths (≥768px), with no regressions to either page's existing layout in either viewport class — a first-class, explicit success criterion for this phase, not an assumption (this project has a documented history of phone-specific work leaking into desktop, e.g. v1.6's HOME-16 regression).

Out of scope: anything from the v1.x Shop/Checkout wave (Stripe, stock, CGV, exhibitions), and any change to the existing forward édition→gallery link's own behavior (only the reverse direction is new).

</domain>

<decisions>
## Implementation Decisions

### Reverse Cross-Link (EDN-12)
- **D-01:** Mirror the existing forward pattern exactly rather than inventing a new mechanism. Today: `edition.ts`'s `relatedGallery` reference field → `src/lib/related-gallery.ts`'s pure `getRelatedGalleryLink()` helper → consumed by `buildEditionDetailModel()` in `page-models.ts` → rendered as `.edition-detail__related` in `EditionDetailBody.astro`, positioned right after `DetailHero`'s content div, before `GalleryGrid`. The reverse needs: a new `relatedEdition` reference field on the `gallery` Sanity schema, a mirrored (or generalized) link-building helper, a new prop threaded through `buildGalleryDetailModel()`, and rendering in `GalleryDetailBody.astro` (which currently has NO related-link prop at all — this is new to that component).
- **D-02:** Same defensive-null behavior as the existing helper: no gallery has a `relatedEdition` by default (optional field), and a gallery with no associated édition shows no link at all — never a broken/dead-end element. Not every gallery needs one.
- **D-03:** Link position on the gallery detail page mirrors the existing édition-side convention: placed right after `DetailHero`'s content, before `GalleryGrid` (top of the content area) — consistent placement between the two page types, opposite end of the page from the new CONT-04 CTA (which sits after the grid).

### Contact CTA (CONT-04)
- **D-04:** Destination: links to `/contact/` (the existing spam-protected contact form) — not a `mailto:` link. Reuses the established contact mechanism rather than introducing a second one.
- **D-05:** Tone: direct, purchase-oriented ("click here to inquire about buying"), but framed as "contactez-nous" (contact **us**) rather than naming Romane specifically — this is a deliberate departure from the initially-proposed "Contactez Romane" wording.
- **D-06:** Copy is generic across both gallery and édition pages — no per-page contextual wording ("cette collection" / "cette édition"). One shared component, one string. Approximate locked direction: **"Intéressé·e par une pièce ? Contactez-nous →"** (exact final copy is implementation-level, but must stay within this direct/generic/us-framed direction — do not revert to naming Romane or to a softer editorial tone).
- **D-07:** Placement: after the last `GalleryGrid` item, before the page ends — literally "the end of the photo sequence" per the roadmap wording. On gallery pages this is the only in-page content after the grid (galleries have `hideFooter=true` — see Code Context — so this CANNOT be a footer-adjacent element, it must render as genuine page content the visitor scrolls to naturally). On édition pages the footer is NOT hidden, but for consistency the CTA renders the same way, in the same relative position (after the grid), on both page types.
- **D-08 (resolved via sketch 018, winner Variant B "Renforcé"):** Visual weight — same text-link-with-arrow family as the site's existing `.editions-index__cta` / `.edition-detail__related` links (no filled/pill button anywhere on this site, and this stays consistent with that), but heavier than those: 20px `Unbounded` (weight 600) display-font text (not the 14px `--text-label-size` those use), a thin 1px pink (`--pink-600`/`--color-accent`) hairline rule directly above it marking a deliberate "closing" moment, and generous top spacing (`--space-2xl`) separating it from the grid above. See `.planning/sketches/018-gallery-edition-contact-cta/README.md` and `index.html` (Variant B) for the exact confirmed markup/CSS to implement from.
- **D-09:** On Édition pages specifically, where BOTH the existing related-gallery link (top, unchanged, stays at its current subtle `.edition-detail__related` treatment) and the new heavier CONT-04 CTA (bottom) are present: no additional visual differentiation beyond position and weight is needed — confirmed via sketch 018, which showed both together and got explicit sign-off. Do not make the top related-link heavier or add extra distinguishing chrome; its current subtle treatment stays exactly as-is.

### Claude's Discretion
- Exact final English copy for the CTA (only the FR direction was locked: direct, generic, "contactez-nous" framing, not naming Romane) — mirror the same tone/structure in English.
- Whether EDN-12's new Sanity field/helper generalizes the existing `related-gallery.ts` into a bidirectional shared module, or ships as a separate parallel file mirroring its structure — implementation-level choice, not a user-facing decision.
- Exact spacing/sizing values beyond what sketch 018 already pins (Variant B's CSS is the reference implementation; minor adjustment during real integration, e.g. to match real photo aspect ratios instead of the sketch's placeholder thumbnails, is expected and fine).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/REQUIREMENTS.md` §"v1.8 Requirements" — EDN-12, CONT-04, UI-03 full requirement text
- `.planning/ROADMAP.md` §"Phase 24: Cross-Linking & Contact CTA" — Goal, Success Criteria
- `.planning/PROJECT.md` §"Current Milestone: v1.8 Cross-linking & Contact CTA" — target features and mobile/desktop verification framing

### Sketch (visual decision source of truth for D-08/D-09)
- `.planning/sketches/018-gallery-edition-contact-cta/README.md` — design question, all 3 variants, winner rationale
- `.planning/sketches/018-gallery-edition-contact-cta/index.html` — Variant B's exact markup/CSS is the reference implementation for the real component (class names `.cta--b`, `.cta--b-rule` are sketch-only placeholders — real implementation should follow this project's existing BEM-ish naming convention, e.g. `.gallery-detail__contact-cta` / `.edition-detail__contact-cta`, not copy the sketch's class names verbatim)
- `.planning/sketches/MANIFEST.md` — row 018, overall site design-direction context (Unbounded 900 display font, monochrome + single pink accent, sharp corners, hairline borders, no new colors)

### Prior phase context (established conventions this phase must follow)
- `.planning/milestones/v1.6-phases/20-mobile-navigation-accent-color/20-CONTEXT.md` — confirms the `max-width: 767px` / `min-width: 768px` breakpoint convention used everywhere on this site; also documents the shared-component regression history (Phase 16, Phase 19) relevant to UI-03's verification discipline
- `.planning/milestones/v1.6-phases/21-homepage-scroll-experience/21-CONTEXT.md` — established `prefers-reduced-motion` idiom and `matchMedia` viewport-gating pattern, referenced in case CONT-04's arrow-hover transition needs a reduced-motion guard (likely not needed for a simple `translateX` hover, but check)

No other external specs/ADRs apply — requirements and design direction are fully captured in Decisions above and the sketch.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/related-gallery.ts` — pure, locale-aware `getRelatedGalleryLink()` helper (uses `getRelativeLocaleUrl` from `astro:i18n` so Astro's `base` config is applied automatically — required to pass CI's un-prefixed-link grep guard). Direct pattern to mirror or generalize for EDN-12's reverse link.
- `sanity/schemas/edition.ts` (~line 76-84) — the existing `relatedGallery` reference field definition (type `reference`, `to: [{type: 'gallery'}]`, optional, no validation rule) — the field to mirror on `gallery.ts` as `relatedEdition`.
- `src/lib/sanity.ts` (~line 204-225) — the GROQ projection that dereferences `relatedGallery->{title, "slug": slug.current}` for éditions; gallery's own GROQ query needs the equivalent addition for `relatedEdition`.
- `src/lib/page-models.ts` (~line 11-12, 215, 286) — `buildEditionDetailModel()`'s existing `relatedLink: RelatedGalleryLink | null` prop and `getRelatedGalleryLink(edition.relatedGallery, locale)` call — the pattern `buildGalleryDetailModel()` needs to gain.
- `src/components/EditionDetailBody.astro` (~line 26-31, 96-100) — renders `relatedLink` as `<a class="edition-detail__related">` right after `DetailHero`, before `GalleryGrid`. Comment at line 91-95 explains WHY it's positioned in-flow rather than absolutely-positioned (avoids a Phase 10 header/logo-overlap regression class).
- `src/components/GalleryDetailBody.astro` — currently 83 lines, NO relatedLink prop exists here at all. This is the file EDN-12 adds a related-link render to (mirroring EditionDetailBody's pattern) AND where CONT-04's CTA also needs to render (after `GalleryGrid`, inside `.gallery-detail__content`, before the closing `</div>`).
- `src/components/EditionsOverviewBody.astro` (~line 79, 205-214) — `.editions-index__cta` is the site's only other existing "CTA-shaped" precedent (text + arrow, semibold, `--tap-target-min` height) — informed sketch 018's Variant A baseline.
- `.planning/sketches/themes/default.css` — the AJS brand token reference (colors, spacing, font tokens) sketch 018 pulled real values from; mirrors `src/layouts/BaseLayout.astro`'s actual custom properties (note: this shared theme file's `--color-on-accent` is stale relative to the live codebase post-260826-q79's WCAG fix — not relevant to this phase's CTA, which doesn't render text on an accent background, but worth knowing if a future sketch touches accent-background text).

### Established Patterns
- Mobile breakpoint convention: `max-width: 767px` / `min-width: 768px`, used everywhere (`SiteHeader.astro`, `HomeCarousel.astro`, `BaseLayout.astro`, and every phase since 20). No separate tablet breakpoint exists.
- Design tokens: `--space-*`, `--color-*`, `--font-display` (`'Unbounded'`, weight 900 for headings/display, though sketch 018's CTA uses weight 600/semibold at 20px — a lighter display-font use than a page title, confirmed appropriate by the sketch), `--tap-target-min: 44px` — all defined once in `BaseLayout.astro`, consumed via `var()` everywhere, no separate design-tokens file.
- Shared-component regression history: `SiteHeader.astro`/`PageTitleHeader.astro`-class components have broken other pages twice before (Phase 16, Phase 19) when a fix targeting one page affected shared CSS. `GalleryDetailBody.astro` and `EditionDetailBody.astro` are NOT the same component (no shared-file risk between them), but `GalleryGrid.astro` IS shared between both — the planner/executor should confirm CONT-04's placement (right after `GalleryGrid` closes) doesn't require touching `GalleryGrid.astro` itself.
- **`hideFooter` mechanic** (`BaseLayout.astro` Props, ~line 52-59): gallery detail pages pass `hideFooter={true}` specifically to protect `DetailHero`'s pinned scroll-up-to-return gesture (a fixed `calc(100svh + 900px)` desktop scroll track) from being broken by scrolling into footer/mentions-légales content. Édition pages do NOT hide the footer. This is why CONT-04 must be a genuine in-page element on gallery pages — it cannot be footer content, and the planner/researcher should verify adding CONT-04's extra content height doesn't interact badly with `DetailHero`'s existing scroll-track calculation (a technical risk to verify, not a design decision).

### Integration Points
- `sanity/schemas/gallery.ts` — needs the new `relatedEdition` field added (mirrors `edition.ts`'s `relatedGallery` field definition).
- `src/lib/sanity.ts` — gallery GROQ query needs the `relatedEdition->{title, "slug": slug.current}` projection added, mirroring the édition query's existing pattern.
- `src/lib/page-models.ts` — `buildGalleryDetailModel()` needs a new `relatedLink`-equivalent prop, built the same way `buildEditionDetailModel()` already does.
- `src/components/GalleryDetailBody.astro` — needs BOTH additions: the new related-link prop/render (top, mirroring `EditionDetailBody.astro`) and the new CONT-04 CTA (bottom, per sketch 018 Variant B).
- `src/components/EditionDetailBody.astro` — needs only the CONT-04 CTA addition (bottom); its existing top related-link is untouched.
- Both `src/pages/galleries/[slug].astro` / `src/pages/en/galleries/[slug].astro` and `src/pages/editions/[slug].astro` / `src/pages/en/editions/[slug].astro` (or their shared page components, if the routes delegate to shared wrapper components per the codebase's established `*DetailPage.astro` pattern — verify at research/planning time) will need the new prop(s) threaded through, in both locales.

</code_context>

<specifics>
## Specific Ideas

- Confirmed CTA copy direction: "Intéressé·e par une pièce ? Contactez-nous →" (French) — direct, generic across gallery/édition, "us" not "Romane," links to `/contact/`.
- Sketch 018 (Variant B, winner) is the concrete visual reference — see canonical_refs above. Its HTML/CSS should be read directly by the planner/executor as the implementation starting point, not re-derived from this text description alone.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. The v1.x Shop/Checkout wave (real "buy" flow that CONT-04 is explicitly standing in for) remains a separate, larger, not-yet-scoped milestone, not raised as new scope here.

</deferred>

---

*Phase: 24-Cross-Linking & Contact CTA*
*Context gathered: 2026-08-26*
