---
id: SEED-001
status: dormant
planted: 2026-08-11
planted_during: v1.6 (closed) — awaiting next milestone
trigger_when: when relevant
scope: unknown
---

# SEED-001: Redirection vers un CTA pour contacter Romane à chaque fin de photo ou série, en attendant le système de vente

## Why This Matters

_To be filled in. Run `/gsd-capture --seed --enrich SEED-001` to add context._

## When to Surface

**Trigger:** when relevant

This seed will surface during `/gsd-new-milestone` when the milestone scope matches.

## Scope Estimate

**Unknown** — run `/gsd-capture --seed --enrich SEED-001` to estimate effort.

## Breadcrumbs

- `src/components/GalleryDetailBody.astro` — gallery detail page, one candidate end-of-photo-set location
- `src/components/EditionDetailBody.astro` — édition detail page, one candidate end-of-série location
- `src/components/ContactPageBody.astro`, `src/components/ContactForm.astro`, `src/lib/contact-form.ts` — existing contact mechanism the CTA would presumably link to
- `src/pages/contact.astro`, `src/pages/en/contact.astro` — bilingual contact routes

## Notes

_Captured via one-shot seed capture. Enrich with trigger, why, and scope at your convenience._
