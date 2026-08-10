# Requirements: Atelier Jacqueline Suzanne — Website

**Defined:** 2026-08-03
**Core Value:** Visitors can browse Romane's photographic work and buy a piece (print, original, book, or merch) through a real, working checkout — everything else supports that.

> **Note:** This file was reset after the v1.5 "Global Improvements & Bug Fixes" milestone closed on 2026-08-03. All v1.5 requirements shipped. Full historical requirements (with final status) are archived at `.planning/milestones/v1.5-REQUIREMENTS.md`; accomplishments are in `.planning/MILESTONES.md`.

## v1.6 Requirements (Mobile Experience Redesign)

Redesign the mobile (phone) experience only — desktop/tablet stays byte-for-byte unchanged — replacing the carousel/grid toggle and click-to-open Lightbox with scroll-driven navigation across the Homepage, Gallery detail, and Édition detail pages. Sketch-first for the riskiest/most subjective pieces before implementation.

### Homepage

- [x] **HOME-13**: Visitor sees a mobile nav menu (hamburger or similar) on the homepage instead of the desktop header bar, with the language switcher inside it, on phone-width viewports only
- [x] **HOME-14**: Visitor on a phone browses the homepage via a single scroll-driven view (no carousel/grid toggle); each item's description text reveals as it arrives on screen during scroll
- [x] **HOME-15**: Visitor on a phone sees the "Atelier Jacqueline Suzanne" wordmark full-screen first; scrolling transitions through the wordmark's letterform into the first gallery's photo
- [x] **HOME-16**: Visitor on a phone sees a different accent color each visit, randomly picked from the existing per-gallery `heroColor` values

### Portfolio Galleries

- [ ] **PORT-07**: Visitor on a phone navigates a gallery's photos by scrolling through them full-size and uncropped, with no separate lightbox/"picture mode" view — CANCELLED 2026-08-10, Phase 22 cancelled by explicit user decision, not implemented, no longer in active scope

### Éditions

- [ ] **EDN-10**: Visitor on a phone navigates an édition's photos by scrolling through them full-size and uncropped, with no separate lightbox/"picture mode" view — CANCELLED 2026-08-10, Phase 22 cancelled by explicit user decision, not implemented, no longer in active scope
- [ ] **EDN-11**: Visitor on a phone reads an édition's intro/statement text against a legible solid background instead of overlaid on a photo, with the primary photo shown among the others rather than as a full-bleed backdrop — CANCELLED 2026-08-10, Phase 22 cancelled by explicit user decision, not implemented, no longer in active scope

### About

- [x] **ABOUT-05**: Visitor on a phone sees the About page's portrait photo in an improved position relative to the surrounding text (exact treatment resolved via sketch) — delivered via direct commit `6c51695` (2026-08-10), outside the plan/execute cycle, attributed to Phase 23 per user direction; float-right portrait with text wrap on mobile, order-swapped on desktop

### Site-Wide (regression guard)

- [x] **UI-02**: Desktop/tablet layout, navigation, and interaction behavior are provably unchanged by every phase in this milestone — accepted complete via commit `6c51695` per user direction (mechanical reconciliation, not independently re-verified by this session)

## Carried Forward (still open, not part of v1.6)

### Launch

- [ ] **LAUNCH-01**: Site is reachable at the existing domain atelierjacquelinesuzanne.fr via a rehearsed DNS cutover from the current Myportfolio site — part of the original v1.0 milestone (Phase 5, Launch & Domain Cutover), deliberately deferred behind v1.1/v1.2/v1.3/v1.4/v1.5 by explicit user choice. Not yet started.

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
| Any desktop/tablet visual or interaction change | This milestone is mobile-only by explicit user instruction; desktop must stay byte-for-byte unchanged |
| A brand-new accent-color palette | User chose to reuse the existing per-gallery `heroColor` field rather than introduce new predefined colors |
| Removing/rewriting the Lightbox component for desktop | Desktop keeps its existing click-to-open Lightbox; only phone-width navigation changes |
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

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| HOME-13 | Phase 20 | Complete |
| HOME-14 | Phase 21 | Complete |
| HOME-15 | Phase 21 | Complete |
| HOME-16 | Phase 20 | Complete |
| PORT-07 | Phase 22 | Cancelled |
| EDN-10 | Phase 22 | Cancelled |
| EDN-11 | Phase 22 | Cancelled |
| ABOUT-05 | Phase 23 | Complete |
| UI-02 | Phase 23 | Complete |
| LAUNCH-01 | Phase 5 | Pending |

**Coverage:**

- v1.6 requirements: 9 total (HOME-13, HOME-14, HOME-15, HOME-16, PORT-07, EDN-10, EDN-11, ABOUT-05, UI-02)
- Mapped to phases: 9/9 ✓ — Phase 20 (HOME-13, HOME-16), Phase 21 (HOME-14, HOME-15), Phase 22 (PORT-07, EDN-10, EDN-11), Phase 23 (ABOUT-05, UI-02)
- Delivered: 6/9 — Phase 20 (2/2), Phase 21 (2/2, mechanism superseded by `MobileHomePrototype.astro` — see ROADMAP.md/STATE.md), Phase 23 (2/2, via direct commit `6c51695`)
- Cancelled: 3/9 — Phase 22 (PORT-07, EDN-10, EDN-11), 2026-08-10, explicit user decision
- v1.6 milestone status: resolved 2026-08-10 (6 delivered, 3 cancelled) — no open phases remain in this milestone
- Carried-forward requirements: 1 total (LAUNCH-01)
- Mapped to phases: 1/1 ✓ (Phase 5, not started, deliberately deferred)
- v2 (v1.x fast-follow) requirements: 18 tracked, not yet in roadmap (out of scope for this roadmap by design)

---
*Requirements defined: 2026-08-03*
*Last updated: 2026-08-10 — v1.6 milestone resolved: Phase 22 cancelled (PORT-07, EDN-10, EDN-11 dropped), Phase 23 completed via direct commit `6c51695` (ABOUT-05, UI-02).*
