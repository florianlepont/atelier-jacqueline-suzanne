# Requirements: Atelier Jacqueline Suzanne — Website

**Defined:** 2026-07-05
**Core Value:** Visitors can browse Romane's photographic work and buy a piece (print, original, book, or merch) through a real, working checkout — everything else supports that.

## v1 Requirements

Phased launch: v1 replaces the current Myportfolio site fast with portfolio + about + contact, bilingual, on the real domain. Shop, checkout, shipping, and exhibitions follow in v1.x once this is live.

### Portfolio

- [x] **PORT-01**: Visitor can browse portfolio galleries grouped by project/series (migrated from the current site: Rebut, Silos, Brume, Adults, The Victorian Tea Room, Paysages, Accumulation, MADO, etc.)
- [x] **PORT-02**: Visitor can view full-size images within a gallery (lightbox or dedicated view)
- [x] **PORT-03**: Each gallery/project includes a short artist statement about that series

### About

- [x] **ABOUT-01**: Visitor can read an About/bio page covering Romane's background and artistic approach
- [x] **ABOUT-02**: About page includes atelier/practice information (where she works, medium, techniques)

### Bilingual

- [x] **I18N-01**: All v1 visitor-facing content (galleries, about, contact, legal pages) is available in French and English
- [x] **I18N-02**: Visitor can switch language via a persistent switcher

### Content Editing

- [x] **CMS-01**: Romane can add/edit portfolio galleries and images herself without code

### Contact

- [x] **CONT-01**: Visitor can contact Romane via a contact form
- [x] **CONT-02**: Contact form is protected against spam (e.g. honeypot)

### Legal

- [x] **LEGAL-01**: Site displays a mentions légales page (site owner identity, hosting provider, business status)
- [x] **LEGAL-03**: Site displays a privacy policy / GDPR notice
- [x] **LEGAL-05**: Site displays a cookie/consent banner compliant with CNIL guidance (if any non-essential cookies are used)

### Launch

- [ ] **LAUNCH-01**: Site is reachable at the existing domain atelierjacquelinesuzanne.fr via a rehearsed DNS cutover from the current Myportfolio site

## v1.1 Requirements (Homepage Refinements)

Refines the homepage's view-mode toggle, grid layout, and hero typography before the v1.0 Phase 5 domain cutover and the larger v1.x shop/exhibitions wave.

### Homepage

- [x] **HOME-01**: Visitor toggles between carousel and grid view via a single unified button (not two separate mode buttons)
- [x] **HOME-02**: In grid view, the hero appears as the first tile of the grid (not a separate full-width band) — wordmark + intro paragraph as overlay text, no CTA button
- [x] **HOME-03**: The "Atelier Jacqueline Suzanne" wordmark uses a transparent cutout effect revealing the photo through the letterforms, at least in carousel mode

## v1.2 Requirements (Homepage Polish, Pre-Launch)

Resolves the remaining homepage UX rough edges before the Phase 5 domain cutover — social presence, visual consistency, mobile correctness, and richer per-gallery content.

### Homepage

- [x] **HOME-04**: Visitor can reach Romane's Instagram via an icon link (not text) in the header nav
- [x] **HOME-05**: The carousel/grid toggle button has a square (not rectangular) border
- [x] **HOME-06**: Mobile hero is genuinely full-bleed on first load — no white gap above the header, no footer bleed-through (regression from v1.1's 100svh full-bleed work, reported on iPhone 17 Pro)
- [x] **HOME-07**: Each gallery's own description text shows under its title on the homepage, replacing the generic "Un projet de Romane Lepont" byline
- [x] **HOME-08**: Hovering a grid-mode tile reveals that collection's description
- [ ] **HOME-09**: Homepage photos load progressively (priority + blur-to-sharp transition), with no blocking full-screen loading state
- [ ] **HOME-10**: Homepage header is visually identical to the About/Contact header by construction (single shared header component, not two independently-styled implementations)

### Bilingual

- [ ] **I18N-04**: Language switcher shows only the other language (plus a globe icon indicating it's a language control), not both FR/EN — clicking switches directly to the translated version of the current page

## v2 Requirements

Deferred to v1.x fast-follow (shop + exhibitions wave) and beyond. Tracked but not in current roadmap.

### Exhibitions (v1.x)

- **EXHB-01**: Visitor can view a reverse-chronological list of upcoming exhibitions (date, location, description)
- **EXHB-02**: Visitor can view a reverse-chronological list of past exhibitions
- **CMS-02**: Romane can add/edit exhibitions/agenda entries herself without code

### Shop (v1.x)

- **SHOP-01**: Visitor can browse products for sale: fine art prints, original artworks, books/zines, other merchandise
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

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PORT-01 | Phase 2 | Complete |
| PORT-02 | Phase 2 | Complete |
| PORT-03 | Phase 2 | Complete |
| ABOUT-01 | Phase 3 | Complete |
| ABOUT-02 | Phase 3 | Complete |
| I18N-01 | Phase 1 | Complete |
| I18N-02 | Phase 1 | Complete |
| CMS-01 | Phase 2 | Complete |
| CONT-01 | Phase 3 | Complete |
| CONT-02 | Phase 3 | Complete |
| LEGAL-01 | Phase 4 | Complete |
| LEGAL-03 | Phase 4 | Complete |
| LEGAL-05 | Phase 4 | Complete |
| LAUNCH-01 | Phase 5 | Pending |
| HOME-01 | Phase 6 | Complete |
| HOME-02 | Phase 6 | Complete |
| HOME-03 | Phase 6 | Complete |
| HOME-04 | Phase 7 | Complete |
| HOME-05 | Phase 7 | Complete |
| HOME-06 | Phase 7 | Complete |
| HOME-07 | Phase 8 | Complete |
| HOME-08 | Phase 8 | Complete |
| HOME-09 | Phase 9 | Pending |
| HOME-10 | Phase 10 | Pending |
| I18N-04 | Phase 10 | Pending |

**Coverage:**

- v1 requirements: 14 total
- Mapped to phases: 14/14 ✓
- Unmapped: 0
- v1.1 (Homepage Refinements) requirements: 3 total
- Mapped to phases: 3/3 ✓ (Phase 6, shipped 2026-07-13)
- Unmapped: 0
- v1.2 (Homepage Polish, Pre-Launch) requirements: 8 total (HOME-04..HOME-10, I18N-04)
- Mapped to phases: 8/8 ✓ (Phases 7–10)
- Unmapped: 0
- v2 (v1.x fast-follow) requirements: 17 tracked, not yet in roadmap (out of scope for this roadmap by design)

---
*Requirements defined: 2026-07-05*
*Last updated: 2026-07-14 — HOME-07/HOME-08 (Phase 8) marked complete; implemented and verified directly on `main` ahead of the formal plan/execute cycle (see `.planning/phases/08-gallery-descriptions/08-SUMMARY.md`)*
</content>
