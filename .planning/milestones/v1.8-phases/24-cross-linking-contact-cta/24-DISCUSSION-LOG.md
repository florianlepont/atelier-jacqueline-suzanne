# Phase 24: Cross-Linking & Contact CTA - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-26
**Phase:** 24-Cross-Linking & Contact CTA
**Areas discussed:** Texte et destination du CTA, Poids visuel du CTA, Cohabitation des 2 liens sur les éditions

---

## Texte et destination du CTA

| Option | Description | Selected |
|--------|-------------|----------|
| Vers /contact/ | Reuses existing spam-protected form | ✓ |
| mailto: direct | Opens visitor's mail client directly | |
| You decide | — | |

**User's choice:** Vers /contact/

| Option | Description | Selected |
|--------|-------------|----------|
| Direct, orienté achat | Ex: "Intéressé·e par cette photo ? Contactez Romane" | (adjusted) |
| Discret, ton éditorial | Ex: "Une question sur cette série ? →" | |
| You decide | — | |

**User's choice:** Direct/purchase-oriented, like the first option, but explicitly NOT naming Romane — reframed as "contactez-nous" instead of "contactez Romane."

| Option | Description | Selected |
|--------|-------------|----------|
| Générique partout | Same copy on galleries and éditions | ✓ |
| Adapté au contexte | Different copy per page type ("cette collection" / "cette édition") | |
| You decide | — | |

**User's choice:** Générique partout — one shared component, one string.

**Notes:** Locked direction: "Intéressé·e par une pièce ? Contactez-nous →", links to `/contact/`.

---

## Poids visuel du CTA

| Option | Description | Selected |
|--------|-------------|----------|
| Lien discret avec flèche (Recommandé) | Same treatment as existing `.editions-index__cta`/`.edition-detail__related` | |
| Plus visible qu'un lien classique | Distinct treatment (larger, framed, accent surface) without a filled button | |
| You decide | — | ✓ |

**User's choice:** You decide — deferred to a sketch (user requested mid-discussion: "tu peux aussi me faire un sketch").

**Notes:** Resolved via sketch 018 (`.planning/sketches/018-gallery-edition-contact-cta/`), 3 variants (A: Discret, B: Renforcé, C: Encadré), shown in full page-tail context (gallery + édition, mobile + desktop). **Winner: Variant B — Renforcé** (20px Unbounded display text, pink hairline rule above, extra top spacing). See CONTEXT.md D-08.

---

## Cohabitation des 2 liens sur les éditions

| Option | Description | Selected |
|--------|-------------|----------|
| Même style, positions différentes suffisent (Recommandé) | Both stay text-link-with-arrow family; top/bottom position and text distinguish them | ✓ |
| Styles clairement distincts | The contact CTA gets a visually different treatment from the related-gallery link | |
| You decide | — | |

**User's choice:** Même style, positions différentes suffisent.

**Notes:** Validated visually via sketch 018, which showed both links together on the Édition page mockup (related-link unchanged at top, new heavier CTA at bottom) — confirmed by the user alongside the CTA weight decision.

---

## Claude's Discretion

- Exact final English copy for the CTA (only the French direction was locked).
- Whether EDN-12's reverse-link helper generalizes `src/lib/related-gallery.ts` into a bidirectional module or ships as a mirrored parallel file.
- Minor spacing/sizing adjustments during real integration (sketch 018's Variant B CSS is the reference, not a pixel-exact final spec).

## Deferred Ideas

None — discussion stayed within phase scope.
