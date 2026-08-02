# Requirements: Atelier Jacqueline Suzanne — Website

**Defined:** 2026-08-02
**Core Value:** Visitors can browse Romane's photographic work and buy a piece (print, original, book, or merch) through a real, working checkout — everything else supports that.

> **Note:** This file was reset after the v1.4 "Editorial Design Consistency" milestone closed on 2026-08-01. All v1/v1.1/v1.2/v1.3/v1.4 requirements shipped except `LAUNCH-01` (carried forward below, unchanged). Full historical requirements (with final status) are archived at `.planning/milestones/v1.4-REQUIREMENTS.md`; accomplishments are in `.planning/MILESTONES.md`.

## v1.5 Requirements (Global Improvements & Bug Fixes)

A batch of 8 live-reported visual/interaction bugs and regressions across the homepage, gallery pages, the Éditions page, and Contact — most surfaced directly by Romane/Florian using the shipped v1.4 site, one a direct regression from Phase 16's post-merge overflow fix.

### Homepage

- [ ] **HOME-11**: Visitor can keep the homepage carousel auto-advancing while hovering the pointer over the page — hovering no longer pauses it (the explicit pause/play toggle button is unaffected and still works)
- [ ] **HOME-12**: Visitor sees the homepage's grid-mode intro paragraph in full, not truncated after 2 lines

### Portfolio Galleries

- [ ] **PORT-04**: Visitor sees a gallery's full description/statement on its detail page, not cut off mid-sentence (currently clamped to 4 lines in `DetailHero`)
- [ ] **PORT-05**: Visitor sees gallery and Éditions thumbnail images without a black border frame around them
- [ ] **PORT-06**: Visitor sees the site footer on gallery pages (currently hidden via `hideFooter`; Éditions detail pages already show it correctly — no change needed there)

### Éditions

- [ ] **EDN-09**: Visitor sees the Éditions overview page's title and description text change color together with the eyebrow and divider when hovering a row (currently only the eyebrow/divider follow the row's accent color — a real regression)

### Site-Wide Visual

- [ ] **UI-01**: Visitor sees the halftone dot-texture on Contact, About, and Éditions bleed to the true edges of the browser window again — restored without reintroducing the horizontal-scroll overflow bug the Phase 16 post-merge fix was containing

### Contact

- [ ] **CONT-03**: Visitor sees horizontal breathing room around the E-mail/Instagram link text when the black hover-fill effect appears on the Contact page (currently flush against the container edges)

## Carried Forward (still open, not part of v1.5)

### Launch

- [ ] **LAUNCH-01**: Site is reachable at the existing domain atelierjacquelinesuzanne.fr via a rehearsed DNS cutover from the current Myportfolio site — part of the original v1.0 milestone (Phase 5, Launch & Domain Cutover), deliberately deferred behind v1.1/v1.2/v1.3/v1.4 by explicit user choice. Not yet started.

## v2 Requirements

Deferred to v1.x fast-follow (shop + exhibitions wave) and beyond. Tracked but not in current roadmap.

### Exhibitions (v1.x)

- **EXHB-01**: Visitor can view a list of upcoming and past exhibitions (dates, location, description)
- **EXHB-02**: Romane can independently update the exhibitions/agenda without touching code

### Éditions (v1.x+, deferred from v1.3)

- **EDN-08**: Optional cross-link between an Éditions detail page and its related Portfolio gallery (shipped as an opt-in field — see MILESTONES.md v1.3 entry; tracked here historically)

### Shop (v1.x)

- **SHOP-01**: Visitor can browse products for sale: fine art prints, original artworks, books/zines, other merchandise
- **SHOP-02**: Product stock is tracked — one-of-a-kind originals show as sold out after purchase; limited editions decrement available quantity
- **SHOP-03**: Placeholder pricing / "notify me" / waitlist signup on Éditions pages, ahead of real checkout
- **SHOP-04**: Framing/matting, room-view mockup, or similar fine-art sales extras

### Checkout (v1.x)

- **CHK-01**: Visitor can complete a real online purchase (cart + payment, e.g. Stripe) without manual intervention
- **CHK-02**: Stripe Checkout integration with webhook-driven order confirmation
- **CHK-03**: Server-side stock re-validation at checkout time (no overselling)
- **CHK-04**: Order confirmation email to the buyer
- **CHK-05**: Guest checkout (no customer accounts) — see Out of Scope

### Shipping (v1.x)

- **SHIP-01**: Site supports shipping to France and the rest of Europe
- **SHIP-02**: Shipping cost calculation at checkout

### Legal (v1.x, commerce-specific)

- **LEGAL-02**: CGV (terms of sale) including 14-day droit de rétractation
- **LEGAL-04**: Commerce-specific GDPR/cookie consent updates for checkout data

### Bilingual (v1.x, commerce-specific)

- **I18N-02b**: Bilingual checkout/order-confirmation flow
- **I18N-03**: Bilingual product/shop content model

### Fine-Art Extras

- **FINE-01**: Certificate of authenticity (COA) messaging
- **FINE-02**: Edition numbering display for limited editions
- **FINE-03**: "View on your wall" room mockups

### Growth

- **GROW-01**: Newsletter signup

### Content Editing (Extended)

- **CMS-03**: Extended self-serve content editing beyond galleries/éditions (e.g. site settings, homepage copy)

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
| 404 page navigation/content changes (added recovery links, rewritten copy) (v1.4) | Explicit decision: pure visual redesign only, not a navigation-recovery redesign |
| About page portrait photo replacement (v1.4) | Only the layout/treatment is in scope; the underlying image is Romane's content, not a code concern |
| Root-causing *why* each v1.5 regression shipped (process retrospective) | This milestone fixes the observed behavior; process lessons belong in RETROSPECTIVE.md, not a shipped requirement |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| HOME-11 | Phase 17 | Pending |
| HOME-12 | Phase 17 | Pending |
| PORT-04 | Phase 18 | Pending |
| PORT-05 | Phase 18 | Pending |
| PORT-06 | Phase 18 | Pending |
| EDN-09 | Phase 19 | Pending |
| UI-01 | Phase 19 | Pending |
| CONT-03 | Phase 19 | Pending |
| LAUNCH-01 | Phase 5 | Pending |

**Coverage:**

- v1.5 requirements: 8 total (HOME-11, HOME-12, PORT-04, PORT-05, PORT-06, EDN-09, UI-01, CONT-03)
- Mapped to phases: 8/8 ✓ (Phase 17: HOME-11, HOME-12 — Phase 18: PORT-04, PORT-05, PORT-06 — Phase 19: EDN-09, UI-01, CONT-03)
- Carried-forward requirements: 1 total (LAUNCH-01)
- Mapped to phases: 1/1 ✓ (Phase 5, not started)
- v2 (v1.x fast-follow) requirements: 18 tracked, not yet in roadmap (out of scope for this roadmap by design)

---
*Requirements defined: 2026-08-02*
*Last updated: 2026-08-02 — ROADMAP.md created: 8 v1.5 requirements mapped to 3 phases (17-19), 100% coverage confirmed.*
