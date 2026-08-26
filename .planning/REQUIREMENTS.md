# Requirements: Atelier Jacqueline Suzanne — Website

**Defined:** 2026-08-26
**Core Value:** Visitors can browse Romane's photographic work and buy a piece (print, original, book, or merch) through a real, working checkout — everything else supports that.

## v1.8 Requirements

Requirements for the v1.8 milestone (Cross-linking & Contact CTA). Each maps to roadmap phases.

### Éditions

- [ ] **EDN-12**: Visitor viewing a Portfolio gallery detail page can navigate to its associated Édition, if one exists (reverse of the existing édition→gallery link, EDN-08/v1.3)

### Contact

- [ ] **CONT-04**: Visitor sees a CTA prompting them to contact Romane at the end of each Portfolio gallery's and Édition's photo sequence, standing in for a sales flow that doesn't exist yet

### UI Quality

- [ ] **UI-03**: EDN-12 and CONT-04 render correctly and are verified clean on both mobile and desktop/tablet viewports, with no regressions to existing layouts in either viewport class

## v2 Requirements

Deferred to future release (the not-yet-scoped v1.x Shop/Checkout wave). Tracked but not in current roadmap.

### Shop & Checkout

- **SHOP-01**: Visitor can browse available pieces (prints, originals, books, merch) with price and availability
- **SHOP-02**: Visitor can complete a real checkout (Stripe) for an available piece
- **SHOP-03**: Stock is tracked and atomically re-validated server-side to prevent overselling one-of-a-kind originals
- **LEGAL-06**: Site displays CGV (terms of sale) including the 14-day droit de rétractation
- **EXHB-01**: Visitor can view Romane's exhibitions/agenda

## Out of Scope

Explicitly excluded from v1.8. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Shop/checkout/Stripe/stock tracking | Belongs to the separate, larger, not-yet-scoped v1.x milestone — this milestone only closes two small backlog seeds |
| CGV / droit de rétractation pages | Only needed once there's something to sell (v1.x); not applicable while CONT-04's CTA is a contact-only stand-in |
| Exhibitions/agenda | Separate v1.x scope item, unrelated to the two seeds this milestone addresses |
| Any change to the existing forward gallery↔édition link (`relatedGallery`, EDN-08) | Already shipped and correct; this milestone adds only the missing reverse direction |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| EDN-12 | Phase 24 | Pending |
| CONT-04 | Phase 24 | Pending |
| UI-03 | Phase 24 | Pending |

**Coverage:**
- v1.8 requirements: 3 total
- Mapped to phases: 3
- Unmapped: 0 ✓

---
*Requirements defined: 2026-08-26*
*Last updated: 2026-08-26 after ROADMAP.md creation — all 3 v1.8 requirements mapped to Phase 24 (Cross-Linking & Contact CTA), 100% coverage, no orphans.*
