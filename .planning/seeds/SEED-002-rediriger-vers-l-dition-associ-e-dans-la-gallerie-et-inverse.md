---
id: SEED-002
status: dormant
planted: 2026-08-11
planted_during: v1.6 (closed) — awaiting next milestone
trigger_when: when relevant
scope: unknown
---

# SEED-002: rediriger vers l'édition associée dans la gallerie et inversement

## Why This Matters

_To be filled in. Run `/gsd-capture --seed --enrich SEED-002` to add context._

**Scope note (found during capture, not yet enriched):** half of this already shipped. `EDN-08` (Phase 13, v1.3) added an optional, explicitly **unidirectional** cross-link — `relatedGallery`, a Sanity reference field on `edition` documents (`sanity/schemas/edition.ts:104-116`) — wired end-to-end through `getRelatedGalleryLink()` in `src/lib/sanity.ts` and consumed by both `src/pages/editions/[slug].astro` and `src/pages/en/editions/[slug].astro`. That direction (édition → gallery) is done. What this seed is actually asking for is the **reverse**: a link from a Portfolio gallery page back to its associated édition, which does not exist today — no `relatedEdition`-shaped field on the `gallery` schema, no consuming code on the gallery detail route.

## When to Surface

**Trigger:** when relevant

This seed will surface during `/gsd-new-milestone` when the milestone scope matches.

## Scope Estimate

**Unknown** — run `/gsd-capture --seed --enrich SEED-002` to estimate effort. Likely small: mirrors EDN-08's own shape (one optional reference field + one consuming template), just on `gallery.ts` pointing at `edition` instead of the other way round.

## Breadcrumbs

- `sanity/schemas/edition.ts:104-116` — `relatedGallery` field + its own code comment stating the link is "unidirectional" by design
- `src/lib/sanity.ts:183-204` — `getRelatedGalleryLink()`, the GROQ projection resolving `relatedGallery->{title, slug}`
- `src/pages/editions/[slug].astro:105`, `src/pages/en/editions/[slug].astro:85` — where the existing forward link is rendered
- `sanity/schemas/gallery.ts` — where a `relatedEdition` field would need to be added for the reverse direction
- `src/components/GalleryDetailBody.astro` or the gallery detail route — where the reverse link would need to render
- `.planning/milestones/v1.6-REQUIREMENTS.md` (EDN-08 entry) and `PROJECT.md` Key Decisions table — prior documentation of the original, deliberately one-way scope decision (Phase 11, D-01/D-03)

## Notes

_Captured via one-shot seed capture. Enrich with trigger, why, and scope at your convenience._
