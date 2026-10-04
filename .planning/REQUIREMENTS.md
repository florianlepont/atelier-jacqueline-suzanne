# Requirements: v2.0 Boutique

**Defined:** 2026-10-04
**Core Value:** Visitors can browse Romane's photographic work and buy a piece through a real, working checkout.
**Research:** `.planning/research/v2.0-boutique/SUMMARY.md` (and the four files beside it). Legal, tax and VAT points there are research findings, not advice.

> Real sales stay blocked until Romane's business registration, VAT regime, invoicing and CGV are settled with an accountant and a legal review. Everything before that is built and tested without taking real payments.

## Decisions taken for this milestone

| Decision | Choice | Source |
|---|---|---|
| Where the checkout server runs | **Decided after a short technical trial** (Cloudflare Worker vs PHP on OVH) | Owner, 2026-10-04 |
| What sells at launch | **Limited-edition prints** only | Owner, 2026-10-04 |
| Purchase flow | **Direct buy of one item** (no cart) | Owner, 2026-10-04 |
| Prices in the read-only phase | **"Prix sur demande"** via the contact path until the VAT regime is confirmed | Owner, 2026-10-04 |
| Oversell policy | Manual refund | Research default, to confirm |
| Print master files | Stay on Romane's own storage, never in Sanity, `public/` or git | Research default, to confirm |
| Invoicing | Open question for the accountant; plan an own confirmation e-mail as the safe case | Research default, to confirm |
| Test data | Stripe sandbox + a separate Sanity `staging` dataset | Research default, to confirm |
| Customer data | None in Sanity; orders are handled from the Stripe Dashboard | Research default, to confirm |
| URL segment | `boutique` shared by FR and EN | Research default, to confirm |

## v2.0 Requirements

### Shop catalogue (SHOP)

- [ ] **SHOP-01**: Visitor can browse a shop index (FR and EN) listing the available prints with image, title, format and availability.
- [ ] **SHOP-02**: Visitor can open a print's page and see its specifications (format, paper, edition size, signed and numbered) and the delivery and returns information.
- [ ] **SHOP-03**: Visitor sees each print as available, sold out or coming soon; while prices are not published, the page shows "Prix sur demande" with a path to contact Romane.
- [ ] **SHOP-04**: Romane can create and edit prints and their variants (format, price, edition size) in the Studio and publish them without a developer.
- [ ] **SHOP-05**: The shop does not appear on the live site (routes, navigation, sitemap) until a build-time shop flag is turned on; the flag is off by default.
- [ ] **SHOP-06**: Visitor can go from an édition page to the related print page through a link that adds no price or commerce wording to the Éditions pages.
- [ ] **SHOP-07**: Romane's edits and publishes in the Studio never overwrite a print's stock, and no customer data is ever written to the public Sanity dataset.

### Checkout (CHK)

- [ ] **CHK-01**: The project has a documented decision on where the checkout server runs, based on a short technical trial of the two candidates.
- [ ] **CHK-02**: Visitor can buy one print: choose a delivery zone, be sent to Stripe's payment page, and come back to a confirmation page (sandbox only before go-live).
- [ ] **CHK-03**: A limited print's stock is reserved during payment and decremented only once payment is confirmed; an edition is never oversold, and a repeated payment notification never decrements twice.
- [ ] **CHK-04**: Visitor cannot change a price or a quantity from the browser: the server reads the price from the catalogue and rejects a mismatch with what was displayed.
- [ ] **CHK-05**: If a payment session expires or is abandoned, the reserved stock is released.
- [ ] **CHK-06**: Romane is told of each paid order and can see and refund it in the Stripe Dashboard, adjust stock by hand in the Studio, and pause the shop with one switch.
- [ ] **CHK-07**: Visitor receives an order confirmation by e-mail (own message or Stripe receipt, as the legal review decides).
- [ ] **CHK-08**: All checkout testing uses the Stripe sandbox and a separate Sanity staging dataset, so no real payment and no production stock change can happen before go-live.

### Delivery and VAT (SHIP)

- [ ] **SHIP-01**: Visitor sees the delivery zones (France and a listed set of EU countries), their cost and delay before paying.
- [ ] **SHIP-02**: The delivery cost of the chosen zone is charged at checkout, and only the allowed countries can be selected.
- [ ] **SHIP-03**: The VAT regime is a configuration set from the accountant's decision, not hard-coded, and prices are displayed consistently with it.
- [ ] **SHIP-04**: Romane has a written packaging and damage procedure for shipped prints.

### Sales legal pages (LEGAL)

- [ ] **LEGAL-01**: Visitor can read the CGV in French (with an English courtesy translation), and accepts them at checkout.
- [ ] **LEGAL-02**: Visitor can read the withdrawal information and form, and can withdraw online with an acknowledgement e-mail, as the law requires for online sales.
- [ ] **LEGAL-03**: The legal pages switch from "non-professional" to a professional publisher notice (name, address from the Sanity field, SIRET, VAT mention) from one single source of truth for the seller's status.
- [ ] **LEGAL-04**: The consumer mediator is named, and the privacy policy covers payment, shipping and the new services.
- [ ] **LEGAL-05**: The legal texts are reviewed by a professional and signed off by Florian before real sales open.

### Go-live and operation (LIVE)

- [ ] **LIVE-01**: Romane's registration (SIRET), the accountant's answers and the Stripe live activation are completed (parallel admin track, gating go-live).
- [ ] **LIVE-02**: One real low-value purchase and refund is verified end to end in French and English, on phone and desktop/tablet, before the shop opens.
- [ ] **LIVE-03**: Romane has a one-page guide to create a print, adjust stock, process an order, refund and restock, and pause the shop.
- [ ] **LIVE-04**: Every new page is verified in both languages and both viewport classes, with no regression on existing pages (as UI-02 and UI-03 did before).

## Future Requirements (deferred)

- **Unique originals (stock of 1)**: reservation with expiry and a "paid after sold" path.
- **Paper éditions on sale** (zines, books): different VAT, and a possible book-price rule to check.
- **Merchandise**: product safety rules, variants and supplier logistics.
- **Cart**: multi-item purchase.
- **Notify me** when a sold-out print returns; **exhibitions and agenda** (EXHB-*, CMS-02).
- **Orders in the Studio** (a "Commandes" view), if the Stripe Dashboard stops being enough.

## Out of Scope

| Item | Reason |
|---|---|
| Customer accounts, discount codes | Not needed for a one-artist shop; discount rules for books are an open legal question |
| Stripe Tax at launch | Paid per transaction and needs tax registrations; VAT is handled as configuration |
| Embedded card forms, custom Checkout domain | Hosted Stripe Checkout avoids extra cost and consent questions |
| Framed prints, custom-size print-on-demand | Raise the "made to order" withdrawal exception and logistics |
| Shipping outside the EU | Customs and VAT complexity |
| Real payments before registration and professional review | Legal and tax risk |

## Traceability

Filled by the roadmap on 2026-10-04. Phases 25-29 continue the numbering from v1.8's Phase 24. Each requirement maps to exactly one phase.

| Requirement | Phase | Status |
|---|---|---|
| SHOP-01 | Phase 25 | Pending |
| SHOP-02 | Phase 25 | Pending |
| SHOP-03 | Phase 25 | Pending |
| SHOP-04 | Phase 25 | Pending |
| SHOP-05 | Phase 25 | Pending |
| SHOP-06 | Phase 25 | Pending |
| SHOP-07 | Phase 25 | Pending |
| CHK-01 | Phase 26 | Pending |
| CHK-02 | Phase 27 | Pending |
| CHK-03 | Phase 27 | Pending |
| CHK-04 | Phase 27 | Pending |
| CHK-05 | Phase 27 | Pending |
| CHK-06 | Phase 27 | Pending |
| CHK-07 | Phase 28 | Pending |
| CHK-08 | Phase 26 | Pending |
| SHIP-01 | Phase 27 | Pending |
| SHIP-02 | Phase 27 | Pending |
| SHIP-03 | Phase 28 | Pending |
| SHIP-04 | Phase 28 | Pending |
| LEGAL-01 | Phase 28 | Pending |
| LEGAL-02 | Phase 28 | Pending |
| LEGAL-03 | Phase 28 | Pending |
| LEGAL-04 | Phase 28 | Pending |
| LEGAL-05 | Phase 28 | Pending |
| LIVE-01 | Phase 29 | Pending |
| LIVE-02 | Phase 29 | Pending |
| LIVE-03 | Phase 29 | Pending |
| LIVE-04 | Phase 29 | Pending |

**Coverage:** 28/28 requirements mapped (Phase 25: 7, Phase 26: 2, Phase 27: 7, Phase 28: 8, Phase 29: 4). Orphans: 0. Duplicates: 0.

**Mapping notes:**
- LIVE-01 is mapped to Phase 29, the phase it gates, but the work itself is the parallel administrative track, which starts at kickoff and is not a numbered phase.
- LIVE-04 is mapped to Phase 29 as its closing criterion; it also runs as a local success criterion in Phases 25-28 (the UI-02/UI-03 precedent).
- SHOP-07 is mapped to Phase 25 (where the stock model is decided); Phase 27 re-proves it under real stock movement.
- CHK-07 sits in Phase 28 rather than Phase 27 because the choice between an own e-mail and Stripe's receipt depends on the legal review.

---
*Requirements defined: 2026-10-04.*
*Traceability filled: 2026-10-04 (roadmap created, Phases 25-29).*
