# Requirements: Atelier Jacqueline Suzanne — Website

**Defined:** 2026-07-05
**Core Value:** Visitors can browse Romane's photographic work and buy a piece (print, original, book, or merch) through a real, working checkout — everything else supports that.

> **Note:** This file was reset after the v1.3 "Éditions" milestone closed on 2026-07-23. All v1/v1.1/v1.2/v1.3 requirements shipped except `LAUNCH-01` (carried forward below, unchanged). Full historical requirements (with final status) are archived at `.planning/milestones/v1.3-REQUIREMENTS.md`; accomplishments are in `.planning/MILESTONES.md`. Run `/gsd-new-milestone` to scope the next milestone's requirements.

## Carried Forward (still open, not part of v1.3)

### Launch

- [ ] **LAUNCH-01**: Site is reachable at the existing domain atelierjacquelinesuzanne.fr via a rehearsed DNS cutover from the current Myportfolio site — part of the original v1.0 milestone (Phase 5, Launch & Domain Cutover), deliberately deferred behind v1.1/v1.2/v1.3 by explicit user choice. Not yet started.

## v2 Requirements

Deferred to v1.x fast-follow (shop + exhibitions wave) and beyond. Tracked but not in current roadmap.

### Exhibitions (v1.x)

- **EXHB-01**: Visitor can view a reverse-chronological list of upcoming exhibitions (date, location, description)
- **EXHB-02**: Visitor can view a reverse-chronological list of past exhibitions
- **CMS-02**: Romane can add/edit exhibitions/agenda entries herself without code

### Éditions (v1.x+, deferred from v1.3)

- **EDN-08**: Visitor can see an optional cross-link between an édition and a related Portfolio gallery, where a matching gallery exists

### Shop (v1.x)

- **SHOP-01**: Visitor can browse products for sale: fine art prints, original artworks, books/zines (building on the v1.3 `edition` content model), other merchandise
- **SHOP-02**: Each product listing shows price, medium/size, and availability status
- **SHOP-03**: One-of-a-kind originals show a "sold out" state once purchased
- **SHOP-04**: Limited edition prints show remaining quantity and go "sold out" when the edition is exhausted

### Checkout (v1.x)

- **CHK-01**: Visitor can add products to a cart
- **CHK-02**: Visitor can complete a real online purchase via Stripe checkout without manual intervention
- **CHK-03**: Stock is re-validated server-side at checkout time, preventing overselling under concurrent purchases (atomic stock reservation)
- **CHK-04**: Buyer receives an order confirmation email after purchase
- **CHK-05**: Buyer receives a shipping notification email when their order ships

### Shipping (v1.x)

- **SHIP-01**: Visitor can see shipping cost and delivery time estimates before/at checkout
- **SHIP-02**: Site supports shipping to France and the rest of Europe (two shipping zones)

### Legal (v1.x, commerce-specific)

- **LEGAL-02**: Site displays CGV (Conditions Générales de Vente) including 14-day droit de rétractation terms
- **LEGAL-04**: Checkout requires explicit acknowledgment of the CGV before purchase

### Bilingual (v1.x, commerce-specific)

- **I18N-02b**: Language switcher does not lose cart contents when cart exists
- **I18N-03**: Transactional emails (order confirmation, shipping notice) are sent in the buyer's selected language

### Fine-Art Extras

- **EXTRA-01**: Certificate-of-authenticity mention for originals and limited editions
- **EXTRA-02**: Edition numbering ("N/M") displayed on limited-edition product pages
- **EXTRA-03**: Room-view mockup images for prints

### Growth

- **GROW-01**: Newsletter signup for announcing new editions/exhibitions

### Content Editing (Extended)

- **CMS-03**: Self-service editing extended to products/shop inventory (kept developer-assisted until this milestone)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Exhibition booking/RSVP or ticketing | Agenda is informational only; ticketing adds capacity-management complexity disproportionate to scope |
| Worldwide shipping | France + Europe covers near-term demand; customs/duties complexity not justified yet |
| Print-on-demand fulfillment | Conflicts with selling originals/true limited editions; POD margins and quality control are the wrong fit for fine-art positioning |
| Multi-vendor marketplace features / product reviews | Single-artist site, not a marketplace; reviews are low-signal for one-of-a-kind art |
| Customer accounts (order history, wishlists, saved addresses) | Low-frequency, often one-time purchases don't justify auth/account surface area; guest checkout + email receipt suffice |
| Framing/matting configurator | Combinatorial pricing complexity not aligned with a small, curated catalog |
| Live chat / AI chatbot | Requires real-time monitoring Romane can't commit to; contact form + email suffices |
| Multi-channel inventory sync (Instagram/Etsy/in-person) | Hard problem disproportionate to scale; manually marking an item sold is sufficient |
| "View on your wall" AR feature | High implementation complexity for uncertain gain vs. static room-view mockups |
| Press/mentions section | Not requested for v1 |
| Placeholder pricing, "notify me"/waitlist signup, or disabled buy buttons on Éditions pages (v1.3) | Would require rework once real inventory/checkout lands in the future shop milestone; a pure showcase with zero commerce affordance is the deliberate choice until that infrastructure exists |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| LAUNCH-01 | Phase 5 | Pending |

**Coverage:**

- Carried-forward requirements: 1 total (LAUNCH-01)
- Mapped to phases: 1/1 ✓ (Phase 5, not started)
- v2 (v1.x fast-follow) requirements: 18 tracked, not yet in roadmap (out of scope for this roadmap by design)

---
*Requirements defined: 2026-07-05*
*Last updated: 2026-07-23 — reset after v1.3 (Éditions) milestone close; full v1/v1.1/v1.2/v1.3 history archived at `.planning/milestones/v1.3-REQUIREMENTS.md`*
