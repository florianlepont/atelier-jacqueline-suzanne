# Feature Research: v2.0 Boutique (one-artist shop, France/EU)

**Domain:** Single-artist online shop (fine-art prints, unique originals, paper éditions, maybe merchandise), added to an existing live bilingual static Astro + Sanity site
**Researched:** 2026-10-04
**Overall confidence:** MEDIUM (see "Confidence legend"; commerce/UX patterns MEDIUM, Stripe mechanics MEDIUM-HIGH, legal and tax items MEDIUM at best)

> **NOT LEGAL OR TAX ADVICE.** Everything in the legal, VAT and invoicing sections below is a research summary of what official sources and platform documentation say, gathered by web tools. It has not been reviewed by a lawyer, an accountant, the DGCCRF, or the tax office. Real sales must not open until (a) Romane has her business registration (SIRET) and has settled her status and VAT regime with an accountant or the guichet unique des formalités, and (b) the CGV, withdrawal mechanics, mentions légales and checkout wording have had a professional review. Items marked **UNVERIFIED** come from training knowledge or a single secondary source and must be checked before they drive any decision.

## Confidence legend

The `classify-confidence` seam grades web-tool findings LOW by default and MEDIUM only when cross-checked. This document follows it and adds a source class so the roadmap can see what was actually read.

| Tag | Meaning | Seam tier |
|-----|---------|-----------|
| **[OFFICIAL-READ]** | Official page (Légifrance, service-public, entreprendre.service-public, EUR-Lex, Your Europe, BOFiP, impots.gouv.fr, La Poste, Stripe docs) fetched and read in this pass | MEDIUM when corroborated by a second source, otherwise LOW |
| **[OFFICIAL-SNIPPET]** | Official page that returned HTTP 403 to the fetch tool (notably economie.gouv.fr/DGCCRF pages); content seen only through search-result summaries | LOW to MEDIUM |
| **[SECONDARY]** | Law firm, accountant or vendor blog, community article | LOW unless corroborated |
| **UNVERIFIED** | Training knowledge or inference, not confirmed in this pass | LOW, do not treat as authoritative |

A shared limitation: the tools used here summarise pages with a small model, so exact figures and article numbers should be re-read on the source before they are copied into CGV or code.

## Scope and assumptions

- Already shipped and **not re-researched**: galleries, Éditions overview/detail pages, contact form, FR/EN switching, cookie banner and mentions légales/privacy (LEGAL-01/03/05), end-of-sequence contact CTA (CONT-04), gallery to édition cross-links.
- Products are undecided, so every feature below is described for four product kinds: **print** (series, probably sizes), **original** (stock of exactly 1), **édition** (zine / artist book, a counted print run), **merchandise** (possible, recommended last or never).
- Hosting reality: the live site is a static OVH file host. Stripe Checkout needs some request-time surface (or Stripe-hosted Payment Links, see below). That decision belongs to the stack/architecture researchers, but this document flags where a feature forces it.
- Real payments are blocked until SIRET. Everything buildable now runs against Stripe test mode and must be designed so that "go live" is a gate, not a rewrite.

## Feature Landscape

### Table Stakes (visitors and the law expect these)

#### A. Catalogue and product pages (read-only first)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Shop index page, FR + EN (`/boutique/`, `/en/shop/`) with nav entry | A shop that cannot be found is not a shop; nav editable like the Éditions label | LOW | Mirrors Éditions overview. Reuse `PageTitleHeader` editorial identity. Requires dual-viewport verification as in v1.8 UI-03 |
| Product tile: lead image, title, kind label (Tirage / Original / Édition), price, availability badge | Minimum info to decide to click | LOW | Reuse tile/masonry components from galleries and Éditions |
| Product detail page: photos, bilingual description, price, availability, "how it ships", buy block | Standard | MEDIUM | Extends the existing `edition` document model (title, slug, `statement`, `images` with bilingual alt, `pageCount`, `printRun`, `dimensions`, `relatedGallery`). Do not fork the model per product kind |
| Price shown as the final price in euros, with shipping cost indication | French pre-contract rule: price per L112-1 to L112-4 referenced by L221-5 [OFFICIAL-READ], TTC display is the consumer rule [UNVERIFIED for the exact article] | LOW | Decide the VAT regime BEFORE publishing prices, because a franchise-en-base seller shows the same figure with the mention "TVA non applicable, art. 293 B du CGI" |
| Physical specs on the page: format/dimensions, paper, finishing, print method, edition size, signed/numbered yes/no | Collectors and book buyers expect them; also the "essential characteristics" required pre-contract (L221-5) | LOW | Typed fields, not free text, the same discipline as `pageCount`/`dimensions` today |
| Availability states: Available, Last copies (optional), Sold out / Vendu, Coming soon | Core to a one-artist shop | LOW | See section B for the stock-of-1 edge case |
| Sold products stay visible ("Vendu") | Keeps the catalogue credible like a gallery; preserves the page for SEO and for the cross-links already shipped | LOW | Existing end-of-sequence contact CTA is the natural fallback ("ask about a similar piece") |
| Delivery information visible before checkout: zones, indicative cost, delay | Delivery date/period is mandatory pre-contract information (L221-5, L216-1) and shoppers abandon when shipping cost surprises them | LOW | One shared "Livraison & retours" block reused on every product page |
| Bilingual product content and bilingual alt text | Existing site standard | LOW | Reuse `localeField`/`localeAltField` helpers |

#### B. Variants, edition numbering, stock of one

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| One variant axis for prints: size/format, each with its own price, stock and shipping class | Print sizes are the universal variant; paper is almost always fixed per series | MEDIUM | Treat paper as a spec, not a choice, unless Romane genuinely offers two papers. Fewer SKUs means fewer stock errors |
| Edition size as a structured field and "n remaining" display for limited prints and books | Limited editions are the value proposition; peers state "edition of N", numbered x/N, with artist proofs outside the numbered edition [SECONDARY] | LOW | Edition limits are sometimes per size, sometimes per image. **French tax link:** a photograph only counts as a work of art (5.5% VAT rate for the author's sales) if taken by the author, printed by or under her control, **signed and numbered within 30 copies, all formats and media combined** [OFFICIAL-READ BOFiP actualité, corroborated by service-public]. So model the edition size at the artwork level, with a validation warning above 30, until the accountant decides which regime applies |
| Numbering assigned at fulfilment, not at checkout | Romane signs and numbers by hand when packing; an automatic counter adds failure modes | LOW | Stock counter = copies remaining. The physical "n/N" is written on the print and quoted in the shipping email or on the certificate card |
| Certificate of authenticity (COA) as a printed card in the parcel | Standard for numbered prints; "separate document stating title, edition size, copy number, method, date" [SECONDARY] | LOW | Romane prepares it offline. A generated PDF is a differentiator, not table stakes. Note: art-trade rules oblige a seller to give provenance/nature documents on request (décret 81-255) [SECONDARY, UNVERIFIED for applicability to the artist] |
| Original = stock of exactly 1, flips to "Vendu" on payment | The reason the project exists in its brief | MEDIUM | Server-side re-validation is mandatory (existing project decision). The static page can be stale for minutes (publish pipeline runs full CI gates), so the server is authoritative and the page must degrade gracefully ("this piece was just sold") |
| Reversible stock: a refund/withdrawal puts the piece or copy back on sale | Withdrawal right applies to originals too (made-to-order exception does not) | LOW | A manual "put back on sale" switch in Sanity is enough at this volume |
| Per-product "buy now" vs "enquire" mode | Many artists sell high-value originals by enquiry rather than card checkout | LOW | The existing contact CTA already implements the enquiry path. Recommended: buy-now below a price Romane chooses, enquire above |

#### C. Cart vs direct buy for a tiny catalogue

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Direct buy: product page to Stripe Checkout, quantity 1 for originals and numbered prints, small max quantity for books** | With a handful of single pieces, a cart is friction. Direct buy is the norm for artist sites | LOW-MEDIUM | This is the recommended v2.0 scope |
| Clear order summary on Stripe Checkout (items, shipping line, total) | Legal and trust requirement; Stripe's hosted page provides it | LOW | Use `locale: fr` / `en` from the site language (Checkout supports both) [OFFICIAL-READ] |

A lightweight multi-item cart is listed under Differentiators: the only real reason for it is combining a print and a book in one parcel to save shipping.

#### D. Checkout, order confirmation and e-mails

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Hosted card checkout (Stripe Checkout), including Apple Pay / Google Pay and SEPA-friendly methods Stripe enables | Trust and PSD2 handled by Stripe, no card data touches the site | MEDIUM | Prefer redirect to hosted Checkout: the site stays cookie-free for payment, which keeps the existing CNIL cookie posture simple (UNVERIFIED that embedded Stripe.js would need consent) |
| Shipping address collection restricted to served countries | Only ship to FR + chosen EU states | LOW | `shipping_address_collection.allowed_countries` is per session [OFFICIAL-READ] |
| Shipping options with a delivery estimate shown | Delivery period is mandatory pre-contract information | LOW | Stripe shipping rates accept a `delivery_estimate` in business days [OFFICIAL-READ] |
| Explicit "order with obligation to pay" wording on the order-validation button | French rule: the validating function must carry the wording "commande avec obligation de paiement" or an unambiguous equivalent (L221-14) [OFFICIAL-SNIPPET via Légifrance search result] | LOW | **Open legal question:** Stripe's hosted button is labelled by Stripe (default "Pay"). Whether that satisfies L221-14 must be confirmed in the professional review. Mitigations: an explicit own-site confirmation step with the exact wording before redirecting, plus `custom_text.submit` next to the Stripe button [OFFICIAL-READ for `custom_text`] |
| CGV acceptance checkbox before payment, linking the CGV | Proof of acceptance; reduces disputes | LOW | `consent_collection.terms_of_service: required`, needs the terms URL set in the Stripe Dashboard [OFFICIAL-READ]. The checkbox itself is best practice, not a statutory requirement (UNVERIFIED) |
| Success page after payment, FR + EN: thanks, "check your e-mail", order reference, expected shipping time, contact | Expected; also reduces "did it work?" e-mails | LOW | Static page; do not rely on it as proof of payment (webhook is the source of truth) |
| Cancel/back page that returns to the product | Expected | LOW | |
| Customer confirmation e-mail with order recap | The contract confirmation must reach the consumer on a durable medium (L221-13) [UNVERIFIED article number; the cross-reference appears in L221-28 13°] | LOW-MEDIUM | Stripe receipts: enable "Successful payments" in Dashboard > Customer emails; receipts need legal business name, support address, support e-mail and privacy URL; language follows customer locale or the default setting [OFFICIAL-READ]. **Test-mode payments do not trigger automatic receipts; send them manually** [OFFICIAL-READ]. A Stripe receipt is not a French invoice; one-time-purchase "post-payment invoices" via Checkout are separately priced (0.4% on the total, capped) [OFFICIAL-READ stripe.com/en-fr/pricing] |
| Seller notification to Romane on every paid order, containing items, buyer, shipping address, chosen shipping option | She has to pack and post it | LOW | Stripe Dashboard notification e-mail is the zero-code floor [OFFICIAL-SNIPPET]; a webhook-driven e-mail with the packing details is better |
| Withdrawal acknowledgement e-mail | Required by the new online withdrawal function (see section G) | LOW-MEDIUM | |

#### E. Shipping options and rates (France and EU)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Zones: France métropolitaine, EU (explicit country list), nothing else | Matches the existing out-of-scope decision (no worldwide shipping) | LOW | EU geo-blocking rules: a trader may limit its delivery area but must not block access or vary prices/terms by customer nationality or residence [SECONDARY, europe-consommateurs.eu]. Do not redirect by IP (the site already avoids Accept-Language redirects) |
| Rate by shipping class and zone, not by individual item | Prints, books and a boxed original differ widely in weight and risk | MEDIUM | See "Stripe shipping constraint" below |
| Insured and tracked service for originals and high-value prints | Loss of a unique piece is unrecoverable | LOW | See Colissimo options below |
| Rigid, tube or flat packaging rules per product kind | Damage is the main post-sale cost for prints | LOW | Operational, document in a Romane-facing checklist, not code |
| Shipping delay stated per product (made on order vs in stock) | Delivery date is mandatory; default legal delivery is without undue delay and at most 30 days after the order if nothing else is agreed (L216-1) [OFFICIAL-SNIPPET + service-public F10037] | LOW | |
| Optional free pick-up at the atelier / hand delivery | Common for local sales and exhibitions | LOW | Implement as a zero-amount shipping option |

**Reference rates (La Poste Colissimo en ligne, 2026, official page, price excl. any promotion) [OFFICIAL-READ, single source]:**

| Weight | France domicile | France point retrait | EU + Switzerland |
|--------|-----------------|----------------------|------------------|
| 250 g | 5.49 EUR | 4.79 EUR | n/a |
| 500 g | 7.59 EUR | 6.89 EUR | 14.99 EUR |
| 1 kg | 9.59 EUR | 8.89 EUR | 19.39 EUR |
| 2 kg | 11.19 EUR | 10.49 EUR | 22.19 EUR |
| 5 kg | 17.39 EUR | 16.69 EUR | 28.59 EUR |
| 10 kg | 25.29 EUR | n/a | 46.99 EUR |

Included cover is stated as 23 EUR/kg for loss or damage on the domestic service. Options: signature R1 3.30 EUR (50 EUR cover), signature R2 5.00 EUR (200 EUR cover), ad-valorem insurance up to 300 EUR for 5.90 EUR and up to 1,000 EUR for 12.90 EUR, non-standard-item surcharge 6.00 EUR. One secondary source quoted 18.45 EUR for 1 kg to Belgium/Germany/Spain/Italy; the official page says 19.39 EUR, so use the official page and re-check on the day rates are fixed. A "Lettre verte suivie" service exists for thin items (max 2 kg, 3 cm), price not captured. Mondial Relay figures came only from a secondary source (point relais about 6 EUR per kg band) and should be treated as LOW.

**Stripe shipping constraint that shapes the feature [OFFICIAL-READ]:** Stripe shipping rates are fixed amounts for the whole order, cannot depend on the number of items, and per-address dynamic rates are a preview feature. Because the Checkout session is created before the buyer types an address, per-country pricing implies either (a) a **zone selector (France / EU) on the product page or pre-checkout step** that decides which rates and `allowed_countries` the session gets, or (b) the preview dynamic-rates feature. Recommended: (a) with 2 zones x 2-3 shipping classes (small flat print/book, larger/heavy, insured original). Inference from the docs, MEDIUM.

#### F. VAT, invoices and price display (to validate with an accountant)

The seller's regime is Romane's to settle. The documented facts the roadmap can safely plan around:

| Fact | Source | Confidence |
|------|--------|------------|
| Franchise en base de TVA, 2026 thresholds: 85,000 EUR (goods) base and 93,500 EUR tolerance; 37,500 / 41,250 EUR (services). Franchise sellers invoice with "TVA non applicable - article 293 B du CGI". Exceeding the base threshold ends the franchise on 1 January of the next year; exceeding the tolerance threshold ends it immediately | entreprendre.service-public.gouv.fr F21746 [OFFICIAL-READ], consistent with several secondary sources (a proposed reform was reported abandoned at end 2025) | MEDIUM |
| Artist-author regime (page verified 20 Feb 2026): sale of an original work by its author taxed at 5.5%, copyright assignment 10%, other operations 20%. Franchise en base for the main artistic activity below 50,000 EUR prior-year turnover (55,000 EUR tolerance), 35,000 / 38,500 EUR for ancillary activities. Artist-authors may sell original works and copies they reproduce or distribute themselves (self-publishing) under the artist-author affiliation | entreprendre.service-public.gouv.fr F36428 and F23749 [OFFICIAL-READ] | MEDIUM |
| Photograph = work of art for VAT only if taken by the author, printed by or under her control, signed and numbered within 30 copies all formats and media combined, "to the exclusion of any other criterion" (CJEU C-145/18 of 5 Sept 2019) | BOFiP actualité (impots.gouv.fr) [OFFICIAL-READ], corroborated by Légifiscal and Art. 98 A annexe III CGI [SECONDARY] | MEDIUM |
| A generalised 5.5% rate for art works from 1 Jan 2025 | Légifiscal [SECONDARY]; the BOFiP excerpts read did not state the rate | LOW |
| Intra-EU distance sales to consumers: a single 10,000 EUR annual EU-wide threshold; below it French VAT applies, above it destination-country VAT through the OSS guichet unique. A page on a European franchise en base scheme exists on impots.gouv.fr | impots.gouv.fr "Suis-je concerné ?" [OFFICIAL-READ]; how the franchise interacts with OSS was **not** established | MEDIUM for the threshold, UNVERIFIED for the interaction |
| Whether books/zines, merchandise and shipping fees take their own VAT rates for this seller | Not established in this pass | UNVERIFIED |
| B2C invoice rules for goods (whether an invoice must be issued, and on request) | The service-public result found concerned services (25 EUR threshold); goods rule not confirmed | UNVERIFIED |
| Stripe fees in France: 1.5% + 0.25 EUR (EEA standard cards), 2.8% + 0.25 EUR (EEA premium), 2.5% + 0.25 EUR (UK), 3.15% + 0.25 EUR (international); Stripe Tax Basic 0.45 EUR per transaction where registered; disputes 20 EUR | stripe.com/en-fr/pricing [OFFICIAL-READ] | MEDIUM |

Features that follow:

| Feature | Why | Complexity | Notes |
|---------|-----|------------|-------|
| `vatRegime` and per-product VAT rate as configuration, not hard-coded | The accountant's answer may differ per product kind (original 5.5%, other goods 20% or none) | LOW | A siteSettings-level regime flag plus a product-level rate/tax-code override. No logic until the regime is known |
| Franchise-aware price and invoice wording | "TVA non applicable, art. 293 B du CGI" must appear on invoices when in franchise | LOW | Text only |
| A numbered invoice/receipt document for each order | Accounting and customer expectation | MEDIUM | Decision needed: Stripe receipts (free, not a French-compliant invoice by themselves, UNVERIFIED), Stripe post-payment invoices (0.4%), or Romane's own invoice template filled from the order. Lowest cost: own template, produced manually at this volume, accountant approves the layout |
| EU-wide threshold tracker (cumulative annual EU B2C sales) | Prevents silently crossing 10,000 EUR | LOW | A figure the accountant checks; a differentiator for the dashboard, not a v2.0 build |

Anti-feature here: Stripe Tax automation. It costs per transaction, requires tax registrations configured in Stripe, and is built for sellers who collect VAT in many jurisdictions. For a franchise or single-regime seller, fixed inclusive prices are simpler. Revisit only if the OSS threshold is crossed.

#### G. Legal pages and checkout obligations (French/EU distance selling)

| Obligation or page | What the sources say | Source and confidence | Complexity |
|--------------------|---------------------|-----------------------|------------|
| **CGV mandatory for B2C**, visible and easily accessible (footer), provided on a durable medium before the contract. Online sales add: SIREN, the 14-day withdrawal right with the standard form, return-cost information, dispute-resolution methods | entreprendre.service-public.gouv.fr F33527. The page cites fines up to 15,000 EUR (individual business) and 75,000 EUR (company) for information failures; secondary sources quote different figures, so treat all as "material, not trivial" | [OFFICIAL-READ] MEDIUM | MEDIUM (content, FR authoritative, EN courtesy translation; contract language rules UNVERIFIED) |
| **Pre-contract information (L221-5, version in force since 19 June 2026)**: essential characteristics, price, delivery date or period, trader identity and contact, legal guarantees, consumer mediator, withdrawal conditions and standard form, return-cost information, the L221-28 exclusions, and personalised pricing where applicable | Légifrance L221-5 [OFFICIAL-READ] | MEDIUM | LOW once content exists |
| **14-day withdrawal right** for distance sales, running from delivery of the goods; consumer pays direct return costs unless the trader pays or failed to inform; trader refunds within 14 days of the withdrawal notice, using the same payment method | service-public F10485 and Légifrance L221-18, L221-23 [OFFICIAL-READ], Your Europe corroborates | MEDIUM-HIGH | LOW (policy), MEDIUM (process) |
| **Exceptions (L221-28)**: goods made to the consumer's specifications or clearly personalised; goods liable to deteriorate quickly; sealed hygiene goods; sealed audio/video/software once unsealed; newspapers, periodicals and magazines (except subscriptions); public auctions; and others. **Interpreted strictly; in doubt the right applies** | Légifrance text quoted via search result, service-public F10485, Your Europe [OFFICIAL-READ / SNIPPET] | MEDIUM | n/a |
| **What this means for Romane's products:** a standard-size print or edition printed on order is *not* personalised, so the right most likely still applies; a print with a dedication, custom crop or custom size chosen by the buyer plausibly is (state it per product, never assume). A unique original is **not** excepted. A one-off artist book is probably not a "périodique", while an ongoing zine series might be argued either way. All three points are interpretation: put them to the reviewer | Inference from the statutory text | LOW, UNVERIFIED |
| **New online withdrawal function, in force since 19 June 2026**: for distance contracts concluded through an online interface where a right of withdrawal exists, the trader must provide a continuously available, prominent, free function (button labelled "withdraw from contract here" or equivalent, French wording reported as "renoncer au contrat ici"), a name/contract details/contact form, a final "confirm withdrawal" step, and an acknowledgement sent on a durable medium without undue delay. French transposition: ordonnance n° 2026-2 of 5 January 2026 (Légifrance shows L221-5 amended with effect from 19 June 2026; the section listing places the online function in L221-21, article number to be confirmed). A law-firm summary reports a maximum administrative fine of 75,000 EUR for legal entities | EUR-Lex Directive 2023/2673 Art. 11a [OFFICIAL-READ]; Légifrance [OFFICIAL-READ]; fine amount and label [SECONDARY] | MEDIUM-HIGH for existence and date, LOW for fine and exact French label | MEDIUM (needs a request-time surface plus e-mail) |
| **"Commande avec obligation de paiement"** on the order-validation function (L221-14), and payment methods plus delivery restrictions shown at the latest at the start of the ordering process | Légifrance L221-14 via search result [OFFICIAL-SNIPPET] | MEDIUM | LOW |
| **Legal guarantee of conformity (2 years) and hidden-defects guarantee** stated in CGV; documents to consumers must mention the conformity guarantee | service-public F11094 and economie.gouv.fr guarantee pages [OFFICIAL-SNIPPET] | MEDIUM | LOW (text) |
| **Consumer mediator**: the professional must give consumers access to a consumer-mediation scheme, inform them in the contract, and bears the cost (free for the consumer) | entreprendre.service-public.gouv.fr F33338, economie.gouv.fr DGCCRF page [OFFICIAL-SNIPPET] | MEDIUM | LOW (text), but **may create a real recurring cost** that conflicts with the near-zero budget. Check what the chosen mediator charges before launch |
| **Mentions légales for a professional publisher** (name, postal address, phone, SIREN/SIRET, host), replacing the LCEN anonymity wording | Existing LEGAL-01 and the optional `publisherAddress` Sanity field (empty until selling) [project files]; secondary sources agree | MEDIUM | LOW technically, but **privacy-sensitive**: a sole trader working from home publishes a home address in a public repository's output. Ask the accountant/guichet about a business or domiciliation address. The earlier quick task 261004-kbq already moved the address out of the repo |
| **Privacy policy update**: order data, Stripe as processor, shipping addresses, retention periods, rights. The CNIL page read gives only the general principle (no indefinite retention; active base, intermediate archive) and mentions a 10-year invoicing record rule; specific order-data durations came from secondary sources | cnil.fr [OFFICIAL-READ] for the principle; durations LOW | MEDIUM | LOW |
| **GPSR (EU 2023/988, in application since 13 Dec 2024)**: consumer products sold online carry trader/manufacturer identification and product identification information | Secondary sources only | LOW, UNVERIFIED | MEDIUM if merchandise is sold; probably negligible for art prints and books, to be confirmed. A strong reason to defer merchandise |
| **European Accessibility Act (since 28 June 2025)** covers e-commerce services, with an exemption for microenterprises providing services (under 10 staff and up to 2 MEUR) | Secondary sources | LOW | The project already runs accessibility tests, keep them on the new pages regardless |

#### H. What a non-technical owner needs (manage stock and orders without a developer)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Create/edit/hide a product in Sanity Studio, with price, kind, stock, variants, shipping class, availability status | She already self-serves Éditions and galleries | MEDIUM | Same editor workflow and Publier button. Validation messages in French as elsewhere |
| A visible stock number she can correct by hand | She will sell at exhibitions and fairs, so web stock drifts from reality | LOW | A manual override must be as easy as the automatic decrement. Stripe holds no inventory |
| Pause switch: "Boutique en pause" with a message | Holidays, a workshop block, a sold-out season | LOW | A siteSettings boolean that disables buy buttons and says why |
| See and act on orders: Stripe Dashboard (web and phone app) listing payments with shipping address, receipts, refunds | No admin UI to build | LOW | Sufficient at tens of orders per month. Include a one-page "how to process an order" guide (pack, label, send, record) |
| Order e-mail with everything needed to pack and ship (item, variant, edition number to write, address, shipping option) | Avoids opening the Dashboard for each parcel | LOW-MEDIUM | |
| Refund and restock procedure | Withdrawal right guarantees it will happen | LOW | Dashboard refund within 14 days of the withdrawal notice [service-public F10485], then "back on sale" in Sanity |
| A data export for the accountant | Declarations and bookkeeping | LOW | Stripe balance and payments CSV exports (UNVERIFIED details); no build |

### Differentiators (valuable, not expected on day one)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Stripe Payment Links path for the first live release (no request-time code)** | Stripe documents `restrictions.completed_sessions.limit` (max number of completed sessions), `inactive_message`, shipping options, address collection, consent collection and custom text on Payment Links [OFFICIAL-READ]. A limit of 1 gives a "stock of one" without a server, which fits the static OVH host | LOW | Trade-offs: the "Vendu" state on the site would not update itself (manual Sanity flip or a later webhook), shipping options are the same for every country on a given link (so one link per zone), Adaptive Pricing is always on for Payment Links [OFFICIAL-READ] and may show non-euro prices to non-euro EU buyers (check), and whether the limit holds under two simultaneous sessions is **not documented in the page read**. A credible bridge, not a final design; flag for the stack researcher |
| Lightweight multi-item cart (browser storage) | Combine a print and a book into one parcel and one shipping charge | MEDIUM | Defer unless Romane asks. Stripe Checkout allows several line items |
| Auto-decrement stock and auto "Vendu" through a payment webhook | Removes manual flipping; makes the original edge case safe | MEDIUM-HIGH | Needs a request-time surface and a Sanity write token. Related timing: a Checkout session can be given an expiry between 30 minutes and 24 hours [OFFICIAL-READ], which gives a natural short "hold" for a stock-of-1 piece |
| Orders as Sanity documents (status: to ship / shipped, tracking number) | One place for Romane to follow orders | HIGH | Only if the Dashboard proves too clumsy |
| Shipped e-mail with tracking number | Fewer "where is my order?" messages | MEDIUM | Not provided by Stripe out of the box (UNVERIFIED); manual is fine at first |
| "Notify me" for sold-out or coming-soon pieces | Converts sold-out traffic into a list or a lead | LOW | Reuse the contact form with a prefilled subject; avoid a newsletter system and its consent obligations |
| Edition counter shown as "Exemplaire 3/10 vendu" or "7 remaining" | Scarcity cue | LOW | Needs reliable stock |
| Printed edition certificate generated as a PDF | Professional polish | MEDIUM | Offline card first |
| Room-mockup and scale visualisation | Helps print buyers choose a size | MEDIUM | Previously deferred (Key Decisions) |
| Gift option (wrapped, with a note) | Small effort, nice for books | LOW | Operational |
| Free-shipping threshold or flat-rate EU shipping | Simplifies the decision | LOW | Margin decision for Romane |
| Per-product enquiry / reserve mode | See section B | LOW | Reuses CONT-04 |

### Anti-Features (commonly requested, often problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Customer accounts, order history, wishlists | "Every shop has them" | Personal-data surface, password resets, GDPR work, no value for a few orders a month | Guest checkout, Stripe receipt link, withdrawal by order number plus e-mail |
| Discount codes, promotions, "sales" | Marketing habit | Price-reduction announcement rules, tax complexity, devalues limited editions (price-reduction rules: UNVERIFIED) | None; occasional price change by Romane |
| Merchandise (t-shirts, totes, mugs) at launch | Listed in the original project brief | Size/colour variants, supplier or print-on-demand logistics, GPSR product-safety information, textile labelling (UNVERIFIED), customs for non-EU suppliers | Prove prints, originals and books first; add merch as a separate later phase if still wanted |
| Print-on-demand in custom sizes | "Any size you like" | Personalisation could trigger the made-to-order exception debate, adds a fulfilment partner, higher shipping risk | A fixed menu of 2-3 sizes |
| Framed prints | Gift appeal | Fragile, heavy, expensive to insure, breakage disputes | Unframed with framing advice |
| Worldwide shipping, UK, Switzerland | Collectors abroad | Customs, import VAT, different consumer law; already out of scope | France + EU only; others by enquiry |
| Automatic multi-jurisdiction VAT (Stripe Tax) at launch | "Do it right" | Per-transaction cost, registrations, built for volume sellers | Fixed regime and inclusive prices; revisit past the OSS threshold |
| Embedded on-site card form (Stripe Elements) | Seamless look | More PCI/consent surface, cookie questions, more code | Hosted Checkout redirect |
| Newsletter checkbox pre-ticked or bundled into checkout | Growth | Consent rules | Separate, explicit sign-up later |
| Real-time stock on every static page | Accuracy | Forces a request-time dependency on every page view | Server-authoritative stock at checkout, tolerant "just sold" messaging, optional small availability endpoint later |
| Live payments before SIRET and professional review | "Just test with real money" | Illegal selling without registration, tax and consumer-law exposure, Stripe account restrictions | Stripe test mode only until the go-live gate |
| Marketplace/consignment of other artists | Scope creep | DSA trader duties, multi-seller payments | Out of scope |

## Feature Dependencies

```
Existing: edition document model (images, printRun, dimensions, statement)
    └──extends──> Product model (kind, price, stock, variants, shipping class, status)
                      ├──requires──> Read-only catalogue + product pages (no payment)
                      │                  └──requires──> Relax EDN-06 build guard (see below)
                      └──requires──> VAT regime decision (accountant) ──> price display (TTC / franchise mention)

Product model ──requires──> Stock model (qty, sold flag, manual override)
    └──enhances──> Server-side stock re-validation ──requires──> Request-time surface (hosting decision)

Stripe Checkout (test mode) ──requires──> Product model + shipping zones/classes + legal pages (URLs)
    ├──requires──> Zone selector (France/EU) before Checkout (Stripe shipping constraint)
    ├──requires──> CGV page URL (terms-of-service checkbox)
    └──requires──> Seller notification + customer receipt e-mails

Online withdrawal function (since 19 June 2026) ──requires──> request-time surface or e-mail relay + acknowledgement e-mail
Refund/restock procedure ──requires──> reversible stock
Sales legal pages (CGV, withdrawal info and form, mediator, mentions with publisherAddress) ──requires──> SIRET + accountant + professional review
Go live ──requires──> SIRET + legal review + accountant validation + live-mode test purchase and refund

Existing CONT-04 contact CTA ──becomes──> fallback for "Vendu" and enquiry mode (must become conditional)
Payment Links path ──conflicts──> per-country shipping rates and automatic "Vendu" (accepted limitations)
Merchandise ──conflicts──> a lean launch (GPSR, variants, supplier)
```

### Dependency Notes

- **EDN-06 build guard:** `tests/scripts/verify-static-artifact.mjs` fails the build if any Éditions page contains commerce strings (price symbols, "disponib*", "availab*", buy wording), and `src/lib/site-config.ts` keeps copy "EDN-06-clean". The shop milestone must change that contract deliberately (scope the guard to non-shop routes or retire it) and update the matching e2e and UI-spec contract. Treat this as the first task of the first phase, not an afterthought.
- **CONT-04 (end-of-sequence CTA)** is "universal, no conditional/sold-state logic" today. Once a product is buyable, decide the hierarchy: buy block above, contact CTA stays as the secondary path, and "Vendu" pages keep the CTA prominent.
- **LEGAL-04 and `publisherAddress`:** the field exists but is empty by design. Filling it flips the mentions légales from the LCEN anonymity wording to a professional notice. This was a human sign-off item in v1 (D-10); expect the same for v2.0.
- **Publish pipeline latency:** a Sanity publish triggers a full CI-gated OVH deploy, so static availability can lag by minutes. This is why server-side re-validation is mandatory and why a manual "put back on sale" is acceptable but a purely static "sold" flag is not enough.
- **Bilingual and dual-viewport verification** apply to every new route (shop, product, success, cancel, withdrawal, CGV, delivery and returns), as in v1.8.
- **Contact form precedent:** `public/contact.php` (PHP mail on OVH) shows that a small PHP endpoint already runs on the host. Whether it can carry the withdrawal function or order e-mails is an architecture question, not a feature decision.

## MVP Definition

### Launch With (v2.0 test-mode complete, real sales gated)

Suggested ordering, with the read-only catalogue first and payment later:

1. **Phase A, read-only catalogue (no payment, shippable now)**
   - [ ] Relax EDN-06 and introduce the shop routes, nav entry, tiles and product pages (FR + EN)
   - [ ] Product model on top of `edition`: kind, specs, edition size, stock, variants, status, shipping class
   - [ ] Availability states including "Vendu"; contact CTA kept as the only action ("Disponible, me contacter") until payment opens
   - [ ] Delivery and returns information block (drafted, flagged "provisional")
   - [ ] Prices published only once the VAT regime is known; otherwise show "Prix sur demande" via the same enquiry path
2. **Phase B, test-mode checkout**
   - [ ] Buy-now to Stripe Checkout in test mode, quantity rules per kind, locale fr/en
   - [ ] Zone selector, shipping rates by zone and class, delivery estimates, allowed countries
   - [ ] Server-side stock re-validation, the stock-of-1 edge case, short session expiry as a hold
   - [ ] Webhook-confirmed order, stock decrement, success and cancel pages
   - [ ] Seller notification e-mail and customer receipt (manual receipts in test mode)
3. **Phase C, legal and tax readiness (can overlap B, drafted in parallel)**
   - [ ] CGV (FR authoritative, EN translation), delivery and returns terms, withdrawal information and standard form, legal guarantee, mediator
   - [ ] Online withdrawal function and acknowledgement e-mail
   - [ ] Mentions légales (publisher identity) and privacy policy updates, `publisherAddress` filled at go-live
   - [ ] VAT regime configuration and invoice/receipt template approved by the accountant
   - [ ] Owner guide: create a product, adjust stock, process an order, refund and restock, pause the shop
4. **Phase D, go-live gate (no new features)**
   - [ ] SIRET issued and Stripe account activated in live mode
   - [ ] Accountant validation (status, VAT, invoicing) and professional legal review of CGV, checkout wording and withdrawal flow
   - [ ] One live purchase and refund end to end, both languages, both viewport classes

### Add After Validation (v2.x)

- [ ] Webhook-driven auto "Vendu" if the first release used manual flipping, once real order volume shows the need
- [ ] Orders as Sanity documents with shipped status and tracking e-mail, if the Dashboard proves clumsy
- [ ] Lightweight cart for combined parcels, if Romane sees repeated multi-item demand
- [ ] "Notify me" lead capture for sold-out pieces
- [ ] Generated certificate PDFs, room mockups

### Future Consideration (v3+)

- [ ] Merchandise (separate decision: GPSR and supplier)
- [ ] Non-EU shipping, Stripe Tax and OSS registration, if the 10,000 EUR EU threshold is approached
- [ ] Exhibition-linked sales (the exhibitions feature is still unscoped)

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Shop index and product pages (read-only) | HIGH | MEDIUM | P1 |
| Product model on the Éditions content model | HIGH | MEDIUM | P1 |
| Stock fields with manual override and "Vendu" | HIGH | LOW | P1 |
| Buy-now Stripe Checkout (test mode) | HIGH | MEDIUM | P1 |
| Zone selector and shipping rates by class | HIGH | MEDIUM | P1 |
| Server-side stock re-validation | HIGH | MEDIUM-HIGH | P1 |
| Seller notification and customer receipt e-mails | HIGH | LOW-MEDIUM | P1 |
| CGV, withdrawal info and form, mediator, mentions update | HIGH (legal gate) | MEDIUM | P1 |
| Online withdrawal function and acknowledgement | HIGH (legal gate) | MEDIUM | P1 |
| VAT regime configuration and invoice template | HIGH (legal gate) | LOW-MEDIUM | P1 |
| Owner guide and pause switch | HIGH | LOW | P1 |
| Edition counter ("n remaining") | MEDIUM | LOW | P2 |
| Enquire-vs-buy mode per product | MEDIUM | LOW | P2 |
| Webhook auto-decrement and auto "Vendu" | MEDIUM | MEDIUM-HIGH | P2 (P1 if the original edge case cannot be handled otherwise) |
| Lightweight cart | LOW-MEDIUM | MEDIUM | P3 |
| Orders in Sanity, tracking e-mail | MEDIUM | HIGH | P3 |
| Notify-me | LOW | LOW | P3 |
| Merchandise | LOW | HIGH | P3 (defer) |
| Customer accounts, discount codes, Stripe Tax | LOW | HIGH | Do not build |

**Priority key:** P1 must have for the go-live gate, P2 add when possible, P3 later.

## Peer Practice Analysis

Evidence here is thin (a handful of photographers' direct stores and one hosted-link feature), so treat it as LOW-MEDIUM.

| Feature | Photographer direct stores (examples seen) | Hosted SaaS shops | Our approach |
|---------|--------------------------------------------|-------------------|--------------|
| Edition handling | "Edition of N", numbered x/N, artist proofs outside the edition, sometimes a limit per size, COA as a separate document [SECONDARY] | Plugins or manual | Stock counter plus manual numbering at packing, printed COA |
| Variants | Size and format, paper usually fixed | Generic variant matrices | One axis (size), paper as a spec |
| Checkout | Cart or direct buy via a platform | Platform checkout | Direct buy via Stripe Checkout |
| High-value originals | Often by enquiry | Often card checkout | Per-product buy or enquire mode |
| Owner tooling | Platform admin | Platform admin | Sanity plus Stripe Dashboard, no custom admin |

## Sources

Official and primary (read directly unless noted):
- Légifrance, Code de la consommation: L221-28 (exceptions, in force 28 May 2022; text via search result), L221-5 (pre-contract information, version in force 19 June 2026), section L221-18 to L221-28 (withdrawal), L221-14 (order with obligation to pay, via search result), L216-1 (delivery, via search result)
- service-public.gouv.fr: F10485 (withdrawal right), F10037 (delivery), F11094 (legal conformity guarantee, via search result)
- entreprendre.service-public.gouv.fr: F33527 (CGV), F33338 (consumer mediation, via search result), F21746 (franchise en base de TVA), F36428 (artist-author taxation, verified 20 Feb 2026), F23749 (artist-author affiliation)
- EUR-Lex: Directive (EU) 2023/2673, Article 11a and Article 2 dates (19 Dec 2025 transposition, application 19 June 2026)
- Your Europe, returns and cancellation (europa.eu/youreurope/citizens/consumers/shopping/returns)
- impots.gouv.fr "Suis-je concerné ?" (OSS, 10,000 EUR threshold); BOFiP actualité on photographs (30 copies, signed and numbered)
- cnil.fr, "Les durées de conservation des données"
- La Poste, Colissimo en ligne tarifs 2026 and tarifs postaux colis
- Stripe documentation: Checkout shipping, Payment Links create and restrictions, Checkout Sessions create (consent_collection, locale, expires_at), receipts, stripe.com/en-fr/pricing

Official pages seen only through search summaries (HTTP 403 to the fetch tool): economie.gouv.fr DGCCRF pages (vente à distance, droit de rétractation, mediation, guarantees).

Secondary (LOW unless corroborated): iubenda, ShippyPro, Hogan Lovells and HLC summaries of the withdrawal function; Légifiscal on the 5.5% art rate; europe-consommateurs.eu on geo-blocking; margeoapp on Mondial Relay; accountant and fiscal blogs on artist-author VAT; photographer store pages for edition conventions.

Cache: digests for the five planned questions were stored through the research-store seam.

---
*Feature research for: one-artist shop (France/EU), milestone v2.0 Boutique*
*Researched: 2026-10-04. This is research, not legal or tax advice; professional review required before real sales.*
