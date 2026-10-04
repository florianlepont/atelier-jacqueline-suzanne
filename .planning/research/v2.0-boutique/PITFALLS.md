# Pitfalls Research — v2.0 "Boutique"

**Domain:** Adding a shop (Stripe Checkout, stock, delivery, VAT, sales legal pages) to an existing static Astro + Sanity + OVH art-portfolio site (FR/EN, one non-technical artist, near-zero budget)
**Researched:** 2026-10-04
**Overall confidence:** MEDIUM (payment mechanics HIGH-ish from Stripe's own docs; legal/tax claims MEDIUM at best and always "to validate")

> **NOT LEGAL OR TAX ADVICE.** Every legal, tax and VAT statement below is a research finding to be validated by Romane's accountant and/or the business registration desk (guichet des formalités / Urssaf artistes-auteurs / SIE) before it reaches a page, a price or a Stripe setting. Nothing here has had legal review. Where a claim could not be confirmed against an official page it is marked **UNVERIFIED**.

## How to read the confidence tags

The research seam rates every web provider (`websearch`, `webfetch`) as LOW by default. I only raised a claim above LOW when I read the primary page (Stripe docs, service-public, Légifrance, justice.fr, EU OSS portal) and, where noted, cross-checked a second source. Note the fetch tool summarises pages through a small model, so quote-level wording should be re-read on the page before it is copied into CGV.

| Tag | Meaning |
|-----|---------|
| **[M]** | Primary/official page read directly (and cross-checked where stated). Still validate before acting on legal/tax items. |
| **[L]** | Secondary source only (law-firm blog, CCI, trade press, comparison sites). Treat as a lead, not a fact. |
| **[U]** | UNVERIFIED: from general knowledge or no source reached. Must be confirmed before use. |
| **[REPO]** | Observed directly in this repository (high confidence about the code, not about the law). |

## Project facts that shape every pitfall below [REPO]

- Production is static files on OVH over SFTP; **there is no request-time compute today**. Checkout, webhooks and stock re-validation need a new server surface (host choice is a separate research question). Everything about "stock drift", "price tampering" and "double webhooks" below follows from that gap.
- `deploy-ovh.yml` fires on **any publish, unpublish or delete of a public Sanity document** and ships **whatever is on `main`** (header comment, lines 3-19). So half-built shop code on `main` goes live on Romane's next Publier click. Concurrency group `ovh-production` serialises runs (`cancel-in-progress: false`).
- Sanity Free plan is **public datasets only** and has **no overages** (250k API requests/month, 1M CDN requests, 2 GROQ webhooks; one webhook is already used for deploys) [M, sanity.io/pricing].
- `tests/scripts/verify-static-artifact.mjs` and `tests/e2e/edition.spec.ts` carry a **build-blocking EDN-06 guard** that forbids price/availability/purchase wording on Éditions pages and in the `edition` Sanity schema. The CONT-04 end-of-sequence contact CTA is documented as "universal, no conditional/sold-state logic".
- Legal pages say "à titre non professionnel", cite LCEN art. 1-1 II anonymity, and `siteSettings.publisherAddress` is empty by default; the quick-task 261004-kbq summary itself lists open points (a)-(e), including "the Statut section still says non-professional even when the address is filled" and "no legal review". The privacy page says the site sets exactly one cookie (`ajs_locale`) and no analytics.
- The repo is public and a past personal address had to be purged from it; a professional publisher notice will need an address again.

---

## Critical Pitfalls

### Pitfall 1: Taking money while the site still says "non-professional" (the status flip is a legal event, not a copy edit)

**What goes wrong:** The shop opens (or Stripe goes live) while mentions légales still say "à titre non professionnel — activité occasionnelle en dessous du seuil imposant l'immatriculation", the publisher address field is empty, no SIRET/status is shown, and no CGV exist. A recurring online shop with checkout is hard to describe as occasional, non-professional activity.
**Why it happens:** Phase 4 legal copy was written for a content-only site. `buildLegalNoticeModel` flips only the address paragraph; the "Statut" section and the publisher line are static code that still assert non-professional status even when the address is filled (quick 261004-kbq open point (d)) [REPO].
**Consequences:** Misleading legal identity, missing mandatory seller information, consumers able to claim missing pre-contract information (withdrawal period extends, see Pitfall 9), and a status statement that contradicts the SIRET shown elsewhere.
**Prevention:**
- Treat "status regularised" as a hard gate before any live sale: Romane registers (see Pitfall 2), then the legal pages switch regime in one reviewed change (Pitfall 14 lists every page).
- Make the regime switch a single source of truth (e.g. one `sellerStatus` setting that drives mentions légales, Statut, CGV header, footer, invoice mention) instead of three hand-edited strings. The existing `buildLegalNoticeModel` discriminated-union pattern is the right shape; extend it, do not fork it.
- Keep Florian's explicit human sign-off checkpoint for legal-content accuracy (Key Decision, 2026-07-08) and add accountant sign-off for status/VAT wording.
**Warning signs:** Any page, test fixture or Sanity description still containing "non professionnel" / "occasionnel" after the shop code lands; `publisherAddress` filled but Statut unchanged.
**Phase to address:** Track 0 (admin, starts on day 1) then the Legal phase; verified again at Go-live gate.

### Pitfall 2: SIRET / business-status lead time and the "dry run" nobody does (Stripe live blocked at the end)

**What goes wrong:** All development finishes in test mode, then live activation stalls because Romane has no registered activity, the right status (artiste-auteur vs micro-entrepreneur vs both) is unsettled, or Stripe's KYC asks for something unexpected.
**Why it happens:** Registration is a separate administrative track with its own delays and decisions that are Romane's, not the developer's. Official sources: photographers are artistes-auteurs; income from selling original works and copies the artist reproduces and distributes herself is BNC; the artist declares once through the guichet des formalités, which generates SIRET/SIREN/APE (service-public F22388, verified 2024-05-03) [M]. Merchandise is **not addressed** in that page, so a second activity/status may be needed [U]. Secondary sources quote 8-15 days for the SIRET after filing and 4-10 weeks end-to-end to a working Urssaf account [L].
**Consequences:** A finished shop that cannot take a payment; or a rushed registration in the wrong regime that changes VAT, invoice mentions and legal copy (so rework of Pitfalls 8, 10, 14).
**Prevention:**
- Start the registration/accountant conversation at milestone kickoff, in parallel, as a named non-dev track with an owner (Romane) and a date. It is not "a blocker gating development" but it IS the critical path to revenue.
- Do a **Stripe activation dry run now**: create the Stripe account and walk the onboarding screens without submitting, to see exactly which identifiers, address type and documents Stripe requests. I could not find any official Stripe page stating whether a SIRET is mandatory for an individual French account; PROJECT.md's "payouts require SIRET" is therefore **[U]** and should be confirmed empirically [U]. Secondary material says Stripe cross-checks the legal name against registries and wants the registered address, not a convenience address [L].
- A SIRET not yet received may be shown as "SIRET en cours d'attribution" on invoices [L, Stripe invoicing guide snippet]; do not rely on that for the public legal page without the accountant's OK.
**Warning signs:** No dated registration milestone in the roadmap; "Stripe live" listed as a final task with no upstream dependency.
**Phase to address:** Track 0 (parallel admin) with a dated gate feeding the Go-live phase.

### Pitfall 3: Success-page-only fulfilment, and webhook handlers that fail in production

**What goes wrong:** Order/stock/email logic is triggered from the post-payment redirect page. The customer pays and closes the tab (or loses connection) and nothing is recorded; or the webhook exists but fails signature verification, double-processes, or only works with the test secret.
**Why it happens:** A static site has an obvious "success page", so it is tempting to hang logic on it. Stripe states explicitly: "You can't rely on triggering fulfillment only from your checkout landing page, because it's not guaranteed customers visit that page" and "Webhooks are required for fulfillment" [M, docs.stripe.com/checkout/fulfillment].
**Consequences:** Paid orders with no stock decrement (oversell, Pitfall 5), no confirmation email, no shipment trigger; duplicated emails/decrements on retries.
**Prevention (all from Stripe docs [M] unless noted):**
- Fulfil from `checkout.session.completed` **and** `checkout.session.async_payment_succeeded`; check `payment_status` (it is not "paid" for delayed methods at completion); handle `async_payment_failed` and `checkout.session.expired`. Keep the landing-page trigger only as an extra, idempotent call.
- The fulfil function must be safe to run multiple times, "possibly concurrently, for the same Checkout Session". Key idempotency on the **Checkout Session ID** (e.g. create the order record with the session id as its document `_id` using create-if-not-exists) and also log processed **event IDs**; Stripe says duplicates occur and sometimes two distinct Event objects are generated, so also dedupe on `data.object.id + event.type`.
- Verify `Stripe-Signature` on the **raw body** (any framework body parsing breaks it); default tolerance 5 minutes, never 0. Use the framework's raw text reader, not parsed JSON.
- The signing secret differs per endpoint and per mode: "If you use the same endpoint for both test and live API keys, the secret is different for each one", and the Stripe CLI (`stripe listen`) prints yet another `whsec_`. A secret mix-up is the classic go-live failure.
- Return 2xx quickly, do slow work after. Hosted Checkout with a `success_url` waits up to 10 seconds for your webhook response before redirecting the customer.
- Retries: live mode up to 3 days with exponential backoff; **sandbox only 3 times over a few hours** (so a handler outage over a weekend in test mode loses events). Delivery order is not guaranteed; do not depend on `created`.
- Pin the Stripe API version in the SDK/webhook endpoint; event shape follows the account/endpoint API version.
- Register live webhook endpoints separately and re-run the same test checklist against them.
**Warning signs:** Any code path where "order confirmed" is derived from a URL query parameter; no stored processed-event record; a single `STRIPE_WEBHOOK_SECRET` env var used for both modes.
**Phase to address:** Checkout phase (build); Go-live phase (re-verify live endpoint and secret).

### Pitfall 4: Price tampering and displayed-vs-charged mismatch

**What goes wrong:** The browser sends an amount, a Stripe price ID chosen client-side, or a quantity for a one-off original; or the static page shows 80 EUR (baked at last build) while Sanity now says 90 EUR and the server charges 90 EUR.
**Why it happens:** Static pages freeze data at build time; checkout creation is the first moment a live value is read. Sanity edits by Romane do not reach the HTML until the next deploy completes (minutes, serialised, with full gates) [REPO].
**Consequences:** Customer charged a price different from the one displayed (consumer-law exposure on price information, UNVERIFIED specifics) or an attacker pays 0.01 EUR.
**Prevention:**
- The browser sends only an opaque product reference (slug/id) + quantity (forced to 1 for unique originals, capped for editions). The server resolves price, currency (EUR), weight/shipping class and availability from Sanity (non-CDN read, published perspective) at session creation.
- Send the **displayed price** (or a content hash) with the request and **reject on mismatch** with a "price changed, please refresh" response, rather than silently charging the new price.
- Use inline `price_data` / `shipping_rate_data` built server-side instead of pre-created Stripe Product/Price/Shipping-rate IDs. Stripe notes sandbox objects "aren't usable in live mode" [M, go-live checklist], so ID-based catalogues break at go-live and must be recreated.
- `allow_promotion_codes` off unless a discount is a deliberate feature (and see book-pricing note in Pitfall 11).
**Warning signs:** `amount` or `price` present in the client fetch body; Stripe Price IDs in Sanity documents; tests that only cover the happy path.
**Phase to address:** Checkout phase.

### Pitfall 5: Overselling the one-of-a-kind original (races, reservations, async payments)

**What goes wrong:** Two visitors open checkout for the same original; both pay. Or one visitor opens a session and "holds" the only piece for 24 hours. Or a delayed payment method confirms after the piece sold elsewhere.
**Why it happens:** Stripe Checkout does not manage inventory; the reservation lives in your code. Stripe's own guidance: expire sessions to release held items, `expires_at` must be 30 minutes to 24 hours after creation (default 24 h), and the `checkout.session.expired` event is where you return items to inventory [M, managing-limited-inventory, create-session API].
**Consequences:** A refund-and-apology on a one-of-a-kind artwork; or a sold-looking piece nobody can buy.
**Prevention:**
- Server-side reservation at session creation: mark the item reserved with an expiry, create the Session with `expires_at` at the 30-minute minimum, release on `checkout.session.expired`, convert reservation to sold on paid event. Reject a second session while a live reservation exists (and show "reserved, back shortly" to the second buyer).
- Cap reservation abuse: one open session per visitor/IP per item, bot check on the creation endpoint (Pitfall 18), so a scripted visitor cannot lock the only original (a denial-of-sale).
- Accept only **instant-confirmation payment methods** for originals (cards/wallets); delayed methods can complete after a reservation lapses. Handle the residual case: if a paid event arrives for an already-sold unique item, auto-refund and notify, with a pre-written message.
- Use atomic/optimistic writes for the stock change (Sanity `ifRevisionID`, 409 on conflict => retry/abort) [M for the Sanity mechanism, Sanity "answers" page].
- Do not rely on a Stripe Payment Link "limit completed payments" restriction as the only guard; I confirmed the `restrictions` object exists but not its exact semantics [U].
**Warning signs:** Stock stored as a boolean on a static page; no `checkout.session.expired` handler; `expires_at` unset (24 h hold).
**Phase to address:** Stock/availability work inside the Checkout phase (edge case called out in the milestone brief); verify in test mode with two concurrent sessions.

### Pitfall 6: Stock drift between the static build and reality

**What goes wrong:** The page says "available" because the build was 20 minutes ago; or says "sold" after an item was released from an expired reservation; or the buy button is clickable on a sold piece.
**Why it happens:** Static output cannot know current stock; the only refresh is a full gated deploy (webhook then `deploy-ovh.yml`: lint, typecheck, unit, e2e on chromium+webkit, SFTP) [REPO]. Serialised runs mean a burst of sales queues deploys.
**Consequences:** Visitors see wrong availability; bursts of sales trigger repeated full CI runs (GitHub Actions minutes, Sanity webhook volume).
**Prevention:**
- Treat build-time availability as a **hint only** ("probably available"). The authoritative check happens at button press and again at session creation. Show a graceful "just sold" state from the server response.
- Fetch live availability for the product page client-side from the new server surface with short cache, but mind the Sanity Free quota (Pitfall 7).
- Decide explicitly whether a sale should trigger a site rebuild; if yes, debounce (the existing concurrency group already keeps at most one running + one pending) and accept minutes of staleness; if no, keep stock out of Sanity's public "publish" webhook path.
- Make "sold out" a first-class designed state (FR/EN, mobile and desktop), including the CONT-04 CTA behaviour on sold pieces (Pitfall 15).
**Warning signs:** No runtime availability endpoint; acceptance tests that only inspect built HTML.
**Phase to address:** Shop catalogue phase (state design) and Checkout phase (runtime check).

### Pitfall 7: Stock stored in the same Sanity document Romane edits (draft publish clobbers it) and customer data in a public dataset

**What goes wrong:** (a) The backend decrements `stockQuantity` on the published product; Romane had a draft open from before; she clicks Publier and the draft **replaces the published document entirely**, restoring the old stock or "available" flag. (b) Order records with names/addresses are written into Sanity, which on the Free plan can only be a **public** dataset. (c) Checkout and stock reads burn the Free plan's 250k API requests with no overage, after which the **site build and Studio fail**.
**Why it happens:** CLAUDE.md's "What NOT to use" rule says keep stock as fields on the Sanity product document. That is fine for a catalogue but is exactly the editor-vs-backend race Sanity documents: "When editors publish, the draft replaces the published document entirely", mitigated by `ifRevisionID`, read-only fields, field-level permissions, or **separate documents** for backend-managed data [M, sanity.io answers]. Free plan: "2 datasets (public only)", 250k API requests, 1M CDN requests, "Not included" for overages, 2 GROQ webhooks [M, sanity.io/pricing; Free-plan figures have changed over time, re-check the pricing page].
**Consequences:** Silent resurrection of sold items (oversell); PII exposure (GDPR breach) readable by anyone with the project ID; the build or checkout dying mid-month from quota exhaustion.
**Prevention:**
- Put backend-owned state (reserved/sold flags, quantity remaining, order ids) in a **separate document type** that the Studio shows read-only (or hides), never in the document Romane edits. Romane edits price/description/photos; the system owns availability.
- **Never write customer PII to Sanity.** Stripe is the system of record for names, addresses, emails; keep only an order id, the Checkout Session id and the product reference in Sanity (or elsewhere). Treat the dataset as world-readable by design.
- Budget API usage: cache availability responses, never poll Sanity per page view, keep the CDN (`useCdn`) for catalogue reads and non-CDN reads only inside the session-creation path. Add an alert at ~70% of monthly quota. Remember the `publisherAddress` precedent: anything in the dataset is publicly readable (T-kbq-07).
- Server write token: dedicated, minimal scope, only in the server environment; never reuse `SANITY_API_READ_TOKEN` or any build-time variable.
**Warning signs:** `stockQuantity` field on the editable product schema; any `order`/`customer` schema; Sanity usage graph trending toward the cap.
**Phase to address:** Shop data-model phase (decide before building checkout; retrofitting is a migration).

### Pitfall 8: VAT / franchise en base set up wrongly for a small seller (validate everything with the accountant)

**What goes wrong:** Romane charges VAT she should not (or the reverse), prints a wrong mention, picks the wrong threshold family, or enables Stripe automatic tax by default.
**What the official sources say [M unless noted]:**
- Franchise en base de TVA: thresholds are **per activity family** (service-public "Franchise en base de TVA", verified 1 Jan 2026): goods sales/accommodation 85,000 EUR (tolerance 93,500); services 37,500 (41,250); **authors/artists on works and rights 50,000**; authors/artists on other activities 35,000. A "unified 25,000 EUR" proposal was abandoned and 2026 thresholds are unchanged. Justice.fr (updated 2026-02-20) corroborates 50,000 / 55,000 for artistes-auteurs.
- Under franchise, invoices must state "TVA non applicable - article 293 B du CGI" (both pages).
- Exceeding the base threshold means VAT from 1 January of the next year; exceeding the tolerance threshold means VAT from the first day of exceedance (service-public).
- Selling an original work by the author itself is at 5.5% VAT if VAT applies (justice.fr). A photograph counts as a work of art only if taken by the author, printed by or under their control, **signed and numbered within a limit of 30 copies, all formats and supports combined** (CJEU C-145/18; BOFiP update 2024-03-20; décret 95-172 per a secondary source) [M for the conditions via legifiscal summary, cross-checked with a second source].
- Intra-EU B2C distance sales of goods: EU-wide 10,000 EUR threshold; above it, VAT of the customer's member state, handled via the OSS portal; below it, VAT of the seller's state may still apply [M, vat-one-stop-shop.ec.europa.eu, via search extract]. How this interacts with a French franchise-en-base seller is **[U]**.
**Why it happens:** Romane's mix (original works, signed/numbered editions, zines, merchandise) spans several threshold families and VAT rates, and a developer will be tempted to "just turn on Stripe Tax".
**Consequences:** Wrong prices (TTC vs "TVA non applicable"), non-compliant invoices, unplanned VAT liability after a good year, wrong OSS handling for EU buyers.
**Prevention:**
- Ask the accountant the questions in the appendix before modelling prices. Model VAT as **data per product class** (rate/regime), not hardcoded, and keep prices stored TTC-equivalent with a regime flag.
- Do not enable `automatic_tax` or Stripe Tax until the regime is confirmed; with franchise, checkout totals must equal the displayed price.
- Edition integrity: a print edition that is "signed and numbered, max 30 copies across all formats" qualifies for work-of-art treatment; selling 31 or reprinting in another format silently breaks the premise. Model `editionSize` as immutable once published (see Pitfall 17).
- Track cumulative turnover per family from day one (a simple Stripe export is enough) so threshold crossing is noticed in-year.
**Warning signs:** One flat `taxRate` constant in code; price display "TTC" with no regime statement; no turnover tracking.
**Phase to address:** Track 0 (accountant answers), Delivery & VAT phase (implementation), Legal phase (display/invoice mention).

### Pitfall 9: Distance-selling traps: withdrawal right, the new withdrawal function, mandatory information, confirmation

**What goes wrong:** CGV are copied from a B2B or generic template; the withdrawal right is described wrongly; no withdrawal function exists; required pre-contract info is missing.
**What the official sources say [M unless noted]:**
- 14 calendar days to withdraw, starting the day after receipt of the goods (service-public F10485). Exceptions (Code de la consommation L221-28, Légifrance) include goods "made to the consumer's specifications or clearly personalized" (3°); there is **no exception for artworks, prints or books as such**. Choosing options among a seller's standard range does not make an item personalised (service-public/DGCCRF wording via search extract). The newspapers/periodicals exception (10°) does not cover a one-off zine [U on application to zines].
- If the seller did not inform the consumer of the right, the period is extended by up to 12 months (service-public F10485, via search extract) [M/L].
- Consumer normally bears direct return shipping if informed; refund within 14 days of learning of the withdrawal, and the seller may wait to recover the goods or proof of return (service-public F10485).
- Pre-contract information list for distance sales (essential characteristics, total price incl. all taxes and fees, delivery date/timeframe with a 30-day default, seller identity, legal guarantees, withdrawal conditions, return costs, dispute-resolution/mediator access) (service-public F10483, verified 2024-03-13).
- **New since 19 June 2026:** Ordonnance n° 2026-2 and décret n° 2026-3 (5 Jan 2026) require professionals offering an online interface to provide a **free, permanently visible withdrawal function** labelled "renoncer au contrat ici" (or an unambiguous equivalent), with a confirmation step, an acknowledgement of receipt on a durable medium stating content/date/time, available for the whole withdrawal period; sanctions quoted up to 15,000 EUR (individual) / 75,000 EUR (company); the CGV must describe it [L: CCI Paris IDF, Lettre des réseaux, ecommerce-nation; legal basis cited as L221-21 / D221-5; confirm on Légifrance/DGCCRF]. This is brand-new and easy to miss because every older "e-commerce checklist" predates it.
- Order confirmation on a durable medium containing the pre-contract information (L221-13) [U on exact wording]. Stripe receipts do not replace it.
- The legal "order with obligation to pay" button wording rule [U]; Stripe's hosted "Pay" button is commonly accepted but get the accountant/lawyer to confirm.
**Prevention:**
- Build the withdrawal function as a real feature (form page reachable from every page and from the order email, captures identity/order reference/contact, shows a confirm step, sends the acknowledgement, stores proof) in FR and EN. A footer link to a PDF is not enough [L].
- Make "made to order" a precise, narrow concept: a print produced on demand from a catalogue image in a standard size is **not** "personalised"; only genuinely customer-specified items (custom crop/size/dedication) qualify, and they must be flagged in the product model and CGV.
- Put the full pre-contract info on the product page and cart (price all-in, shipping, delivery time, withdrawal, guarantee, mediator), not only in CGV.
- Send an own-branded confirmation email (durable medium) with CGV and withdrawal info; do not rely on Stripe receipts, which in any case are a Dashboard setting and not sent in sandbox.
**Warning signs:** CGV text mentioning "satisfait ou remboursé" as a gift rather than law; no `/retractation` flow; a "made to order" flag used to deny withdrawal on catalogue items.
**Phase to address:** Legal phase (CGV, withdrawal page and function) with product-model input from the Shop phase.

### Pitfall 10: CGV copy-paste traps and consent mechanics

**What goes wrong:** Acceptance of CGV is not demonstrable; risk transfers to the buyer "on shipment"; delivery promises exceed reality; guarantee/mediator mentions are missing; only an English version exists.
**Details:**
- Consumer sales: the seller carries the transit risk until the consumer has physical possession [U, Code de la consommation L216-4, verify]. Many templates say otherwise.
- Default delivery deadline is 30 days if none is stated (service-public F10483) [M]; a longer promise must be stated up front.
- Every professional selling to consumers must offer a consumer mediator and communicate its details on the site and in the CGV; fines up to 3,000 EUR (individual) / 15,000 EUR (legal entity) for refusing to provide them [L, L616-1/R616-1 via search extracts]. There is a recurring cost for most mediation schemes [U, amounts].
- The legal guarantee of conformity and hidden-defect guarantee must be mentioned [M list item in F10483: "legal guarantees"].
- Consumer-facing French-language requirement (Toubon) means the French CGV are authoritative and an EN version is a courtesy translation [U]. Say so in the EN text and test FR/EN parity (the repo already has parity tests for privacy pages).
- Stripe can force explicit acceptance: `consent_collection[terms_of_service]=required` and `custom_text` on the Checkout page [M, Checkout Session create API lists `consent_collection` and `custom_text`; exact sub-values should be re-read]. Pair it with a CGV link that opens the **version in force**, and store the version identifier with the order.
**Prevention:** Version CGV (date + hash) and record which version each order accepted; keep old versions reachable. Have the accountant/lawyer review one CGV, then maintain FR as source and EN as translation.
**Phase to address:** Legal phase; consent plumbing in Checkout phase.

### Pitfall 11: Shipping fine art: damage, risk, zones, carriers, and book-price rules

**What goes wrong:** A flat print arrives creased; a framed or glazed original arrives broken; a parcel is lost and the seller has no recourse; "Europe" shipping quietly includes the UK/Switzerland/Norway (customs) or overseas territories; shipping is priced under cost.
**Details:**
- Seller bears transit risk toward consumers (Pitfall 10 [U]); a carrier's standard compensation is small. Secondary sources quote Colissimo's automatic indemnity of about 23 EUR/kg (min 5.75 EUR, cap 690 EUR) and optional "ad valorem" cover up to 1,000 EUR (2026 tariff), with a 30-day claim window [L, laposte.fr and comparators]. A unique original worth more than the cap needs a different carrier/insurance arrangement [U].
- "France + Europe" is ambiguous. EU VAT/customs and OSS apply to EU member states; UK, Switzerland, Norway require customs paperwork/duties [U]. DOM-TOM are outside the EU VAT territory [U]. Make the allowed-country list explicit (Stripe `shipping_address_collection.allowed_countries` is an allowlist [M]) and start with France + a small EU list confirmed by the accountant.
- Book price law (loi Lang): the publisher sets the price; maximum 5% discount; since 2014 free shipping cannot be combined with the 5% discount for books shipped to the buyer [L]. Whether a self-published zine/photo book is covered is **[U]**; avoid promotions and free shipping on éditions until confirmed.
- Delivery-time promises must match Romane's real availability (holidays, exhibitions).
**Prevention:**
- Define packaging specs per product class (rigid mailer/tube, corner protectors, no glass shipped, photo documentation before dispatch), tracked and signed delivery for anything above a set value, and a written damage procedure (photo evidence, claim to carrier within the window, replace/refund policy stated in CGV).
- Flat-rate shipping by weight class and zone, computed server-side and shown on the product page before checkout.
- A **"shop paused" switch** that works at runtime (not via rebuild) for travel/holidays and for stock emergencies.
**Warning signs:** One global shipping price; no packaging spec; "Europe" in copy with no country list; free-shipping promo on books.
**Phase to address:** Delivery & VAT phase (zones, rates, packaging/returns policy), Legal phase (CGV wording).

### Pitfall 12: The professional publisher notice vs a public repo and a public Sanity dataset

**What goes wrong:** A professional editor must publish identity and address; the temptation is to put Romane's/Florian's home address into the repo, tests, or a public Sanity field, reversing the privacy work done in quick 261004-kbq. Or the address is a PO box/"virtual" address that mentions légales and Stripe both reject.
**Details:** Stripe-side secondary material says the business address should be the registered address, not a convenience/virtual one unless that is the legal address [L]. LCEN art. 1-1 distinguishes the anonymity regime for non-professional editors from the professional identification duties [REPO comments citing Légifrance; not re-verified here]. Whether a domiciliation address suffices for the website notice is **[U]**; domiciliation also has a recurring cost against the 0-5 EUR/month target.
**Prevention:** Decide the address strategy with the accountant at the registration step (home address, atelier address or domiciliation) *before* touching `publisherAddress`; keep addresses only in Sanity (already modelled) and never in code/tests (fixtures stay `TEST-ADDRESS-FIXTURE`); keep the e2e assertion content-agnostic as 261004-kbq did. The hosting account holder (Florian) sentence must be re-reviewed because the host notice and publisher notice interact (open point (b)).
**Phase to address:** Track 0 decision, Legal phase implementation.

### Pitfall 13: Main-branch deploy coupling: unfinished shop code ships on Romane's next Publier

**What goes wrong:** Shop UI, API routes or CGV stubs merged to `main` during v2.0 go live the next time Romane publishes a gallery change, because `repository_dispatch` always builds default-branch HEAD and the auto environment has no approval gate [REPO]. Customers see price tags or "Buy" buttons for a shop that cannot take money.
**Why it happens:** The v1.8-era design (one webhook, no approval) is great for a content-only site and dangerous for a feature rollout. The project already documents a history of direct-to-main changes and unverified regressions (v1.6).
**Prevention:**
- Gate every shop surface behind a **build-time flag** (`SHOP_ENABLED`/`SHOP_MODE=off|catalogue|live`) defaulting off in `deploy-ovh.yml`; flip it only at defined gates (read-only catalogue, then live). The EDN-06 guard and the artifact verifier should be switched by the same flag, not edited ad hoc.
- Keep the read-only catalogue (SHOP-*) deployable before payments exist, as the brief wants, but with no price-to-pay affordances until the Checkout gate.
- Add an artifact check: with the flag off, no commerce string or checkout script ships; with it on, a live-mode Stripe key is not present anywhere in `dist/`.
**Warning signs:** Shop code merged without a flag; `dist/` contains `sk_`, `whsec_`, or write tokens.
**Phase to address:** Phase 1 of the milestone (flag + guards), enforced until Go-live.

### Pitfall 14: Pages and copy that must change when the site stops being non-professional

Checklist the roadmap should turn into one reviewed change set (FR and EN, desktop and phone):

| Page / artefact | Must change |
|---|---|
| `mentions-legales` (FR/EN) | Publisher line ("à titre non professionnel" removed); Statut section rewritten (registered activity, SIRET, regime); address filled (`publisherAddress`); phone/e-mail per accountant; VAT mention ("TVA non applicable, art. 293 B du CGI" if franchise) or VAT number; host block re-reviewed; remove the "occasional activity below the registration threshold" claim |
| `confidentialite` (FR/EN) | Stripe as payment processor/recipient; shipping data; order data retention (accounting records are kept for years [U, Code de commerce L123-22: verify]); purpose/legal basis for orders; the "exactly one cookie" and "no tracker" sentences stay true only if cart state is exempt storage (Pitfall 16); rights contact |
| New CGV (FR source, EN translation) | Pitfalls 9-11; versioned |
| New withdrawal page + function | Pitfall 9 |
| Footer/nav | CGV, retractation, mediator, mentions; shop link; language switcher parity |
| Contact page / CONT-04 CTA | "contact to buy" copy becomes obsolete on purchasable items; keep for sold/enquiry items |
| Éditions pages | EDN-06 guard (Pitfall 15) |
| About | "atelier/practice" claims aligned with status |
| Tests | `legal.spec.ts`, `privacy-pages.test.ts`, `e2e-content-fragility`, `page-models.test.ts` assert today's wording and must be updated deliberately; add parity tests for new pages |
| Sanity Studio docs (`sanity/README.md`) | Romane's instructions: what she may edit, what is system-owned, what to do on a sale |

**Phase to address:** Legal phase, with a human sign-off checkpoint (as in Phase 4 Plan 03) plus accountant review.

### Pitfall 15: Existing build-blocking guards and the universal CTA fight the shop

**What goes wrong:** The EDN-06 guard (forbidden commerce tokens such as price/availability stems, in rendered Éditions HTML and in the `edition` schema) fails the build when the shop lands; a developer "fixes" it by weakening the token list globally and the guard stops protecting the pages that must remain showcase-only. The CONT-04 CTA stays "contact to buy" next to a real Buy button.
**Prevention:** Scope the guard by product visibility rather than deleting it: when `SHOP_MODE` is off it stays as-is; when on, the guard checks that **non-listed** pages stay commerce-free and **listed** products expose the full required pre-contract info. Update the 12-UI-SPEC copy contract and CONT-04's "universal" statement in the same change. Keep the `edition` schema free of money fields if the shop product is a separate document referencing the édition (consistent with Pitfall 7's separate-document guidance).
**Phase to address:** Shop catalogue phase.

### Pitfall 16: GDPR/cookies change when a checkout appears

**What goes wrong:** Either a needless consent banner/analytics gets added (against the privacy page's honest "one functional cookie" statement), or the privacy page keeps claiming "no third party/no tracker" after Stripe and shipping data enter.
**What the official sources say [M]:** CNIL exempts from consent trackers that remember the **contents of a shopping cart**, authentication/security trackers, UI personalisation and consent choices, provided they are used exclusively for those purposes (CNIL cookie rules pages, via search extract; confirm on cnil.fr).
**Prevention:**
- Prefer **Stripe-hosted Checkout** (redirect). The payment page is on Stripe's domain, so your site does not load Stripe scripts or set Stripe cookies; embedded/Elements variants load `js.stripe.com` on your pages and should be assessed first [U on cookie behaviour].
- Keep cart state in `localStorage`/sessionStorage solely for the cart (exempt purpose) and say so in the policy; do not add analytics "just for the shop" without a consent mechanism.
- Collect the minimum: do not enable phone collection unless the carrier needs it (Stripe itself says to review the privacy policy before using phone collection [M]).
- Update the privacy page's third-party section (it already names Sanity's CDN) to add Stripe and the shipping carrier; name retention periods; keep FR/EN parity tests.
**Phase to address:** Checkout phase (choice of hosted vs embedded), Legal phase (policy text).

### Pitfall 17: Selling claims you cannot keep: edition integrity, authenticity, and image rights

**What goes wrong:** An edition is advertised as "limited to 30 / numbered" and then reprinted or sold in another format; a certificate-of-authenticity promise is made with no process; a photograph of identifiable people is sold as a print or printed on merchandise without a usable release.
**Details:** The art-photograph VAT/qualification conditions hinge on signed and numbered copies within 30 across all formats (Pitfall 8). Décret 81-255 (1981) on fraud in art transactions obliges sellers to provide documents on nature/origin/age on request, and creator-sellers may be outside its scope per one secondary source; applicability to Romane is **[U]**. For people in photographs, commercial exploitation requires the express authorisation of the person for the specific use; consent to be photographed does not imply consent to commercial diffusion [L]. The existing portfolio (portraits, "Adults", tea-room series) is exactly the kind of material this affects, and the exposure becomes commercial only now.
**Prevention:** Per-product `editionSize` (immutable after first sale), per-copy numbering assigned at fulfilment and recorded, a short COA template, and an image-rights audit of any series offered as prints/merch before it is listed (list only cleared series first). COA messaging and edition numbering were deferred to v1.x; they come into scope here whenever "limited edition" or "signed" is written on a product page.
**Phase to address:** Shop data-model phase (fields), Shop catalogue phase (which works are listed).

### Pitfall 18: Abuse of the checkout-creation endpoint and secret leakage into the static build

**What goes wrong:** Bots hammer the session-creation endpoint (card testing, reservation locking, API-quota burning); or a secret ends up in `dist/` because the build pipeline reads it as a build env var and the framework inlines it.
**Prevention:** Rate limit and bot-check the endpoint (the contact form already has honeypot + CORS allowlist as a precedent; a free Turnstile-class challenge adds real protection); strict CORS to the production origin; server secrets only in the server runtime; only publishable keys and public ids may use `PUBLIC_`-prefixed variables in Astro; rotate keys before go-live and "make sure your code doesn't include any API keys" (Stripe go-live checklist) [M]; add a `dist/` secret-scan step to `test:artifact`.
**Phase to address:** Checkout phase.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Stock as a boolean/number on the editable Sanity product doc | One schema, trivial Studio UX | Draft-publish clobbers stock; oversell | Never for unique originals; acceptable only as read-only, system-written field with `ifRevisionID` writes |
| Stripe Products/Prices/Shipping-rate IDs stored in content | Dashboard reporting looks nice | Sandbox objects unusable in live; IDs drift from Sanity | Never; use inline `price_data` |
| Skipping the durable-medium confirmation email ("Stripe sends a receipt") | No email infra | Missing legal confirmation, receipts disabled in sandbox/needs Dashboard setting | Never for live; fine in test |
| Hardcoded VAT/shipping constants | Fast | Wrong after status/threshold changes | Only in the test-mode phase with a TODO tied to the accountant answer |
| Weakening the EDN-06 guard globally | Build goes green | Showcase pages regain accidental commerce text | Never; scope by flag/visibility |
| Order store in Sanity for "free" persistence | No new service | Public dataset PII; deploy webhook storms | Never with PII; ids-only is acceptable |
| One shared `STRIPE_WEBHOOK_SECRET` | Fewer env vars | Test/live mix-up at go-live | Never; name per mode/endpoint |
| Manual stock edit by Romane as the "sold" mechanism | No server logic | Visible window of overselling | Only for the read-only catalogue phase, with no checkout |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Stripe Checkout | Reading price/amount from the browser; ID-based catalogue | Server resolves price from Sanity; inline `price_data`; compare displayed price |
| Stripe webhooks | Parsed body, wrong-mode secret, slow handler, no dedupe | Raw body, per-endpoint secret, 2xx first, dedupe on event id and session id [M] |
| Stripe sessions | Default 24 h `expires_at` on a unique item | 30-minute minimum, release on `checkout.session.expired` [M] |
| Stripe sandbox vs live | Assuming sandbox objects/webhooks carry over | Recreate/verify live endpoint and keys; sandbox retries only 3x over hours vs 3 days live [M] |
| Stripe receipts/email | Counting on them as the legal confirmation | Own confirmation on a durable medium; receipts are a Dashboard setting |
| Stripe locale | Letting Checkout guess language | Pass `locale` matching the site language (`fr`/`en` supported) [M]; English-page buyers should not land on a French payment page |
| Sanity | Editor drafts overwrite backend writes; Free plan public-only; no overage | Separate backend-owned document, `ifRevisionID`, no PII, quota alerts [M] |
| Sanity webhook / GitHub Actions | Each stock change fires a full gated deploy | Keep availability off the publish webhook path or accept debounced rebuilds; only 2 webhooks on Free [M] |
| OVH static hosting | Assuming checkout/webhooks can live on OVH | They cannot (no compute); new server surface plus CORS/DNS plan; contact.php is not a template for payment logic |
| Domain email (Zimbra, SPF) | Adding a transactional email sender by overwriting the SPF record | Merge the new include into the existing SPF (the v1.7 cutover proved MX/SPF are fragile); test inbox delivery as v1.7 did |
| Carrier (Colissimo etc.) | Assuming default compensation covers value | Declared value/ad valorem or alternative; photo evidence; claim window [L] |
| EU VAT / OSS | Treating "Europe" as one VAT zone | Accountant decides countries and OSS registration; explicit allowlist [M for the 10k rule] |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Per-pageview Sanity API read for availability | Quota creeping to the 250k cap; build/Studio errors | Cache/short TTL, CDN for catalogue, server-side only at session creation | A few hundred visitors/day plus bots (250k/month with no overage) |
| Rebuild per sale | Queue of 8-10 minute full-gate deploys | Debounce/concurrency (already one running + one pending); decouple availability from the publish webhook | During a launch burst or exhibition week |
| Webhook handler doing slow work inline | Checkout redirect delayed up to 10 s; Stripe retries | Ack fast, process after | Any slow downstream call (Sanity write, email) |
| Unbounded session creation | Locked unique piece; Stripe/Sanity quota burn | Rate limit, one open reservation per item | Any scripted visitor |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Customer PII written to a public Sanity dataset | GDPR breach, world-readable addresses | Stripe as system of record; ids only (Pitfall 7) |
| Unverified webhooks (or IP-only trust) | Forged "paid" events trigger shipment | Signature check on raw body; Stripe recommends signature plus IP allowlisting [M] |
| Server tokens in build env / `PUBLIC_` vars | Secret in `dist/` | Server-only env; artifact secret scan (Pitfall 18) |
| Open CORS on the checkout endpoint | Third-party sites create sessions | Strict allowlist to the production origin |
| Success page displaying order details from a URL param | Order enumeration/PII leak | Show details only after server-side session lookup; `noindex`, no-store cache headers |
| Long-lived keys left from development | Compromise after go-live | Rotate before live [M] |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Phone-only layout drift (documented v1.6 pattern) | Broken cart/checkout entry on phones | Dual-viewport e2e plus a human phone UAT for catalogue, product, cart and sold states, FR and EN |
| Back button from Stripe Checkout restores a stuck "loading" button (browser back/forward cache, especially iOS Safari) [U, general web behaviour; reproduce on a real iPhone] | Customer cannot retry | Reset button state on `pageshow` (persisted) and on `visibilitychange`; set `cancel_url` back to the product page |
| Sold/reserved states unclear | Frustration, support emails | Explicit designed states with a contact path |
| Shipping cost shown only in Stripe | Abandonment, and missing pre-contract info | Show "from X EUR" on the product page and in the cart |
| English visitors land on French payment/CGV | Distrust | `locale` passed to Checkout; EN CGV translation clearly marked non-authoritative |
| Custom cart drawer with poor focus/keyboard behaviour | Excludes keyboard/screen-reader users | Keep the cart minimal (single-item "buy now" first); rely on Stripe's hosted page for the sensitive part |
| Accessibility assumed exempt | Risk if scope is misjudged | The European Accessibility Act applies to e-commerce services since 28 June 2025 with an exemption for micro-enterprises (<10 people and <2M EUR) per DGCCRF material [L/M]; Romane is probably exempt but do not use that as a reason to ship an inaccessible flow, and confirm with the accountant |
| Withdrawal link buried in footer text | Legal and trust risk (Pitfall 9) | Persistent, labelled entry point in the order email and footer |

## "Looks Done But Isn't" Checklist

- [ ] **Checkout works in test mode:** often missing a live webhook endpoint with its own secret and a real end-to-end live smoke test (a real, refunded small payment after SIRET).
- [ ] **Order recorded:** verify it is created by the webhook, not by the success page (kill the tab after paying in test mode).
- [ ] **Webhook retried twice:** verify one order, one stock decrement, one email (`stripe events resend`).
- [ ] **Unique original:** run two concurrent sessions; second is refused; abandoned session releases the item after expiry; paid-after-sold triggers auto-refund path.
- [ ] **Romane publishes a draft after a sale:** stock/sold state survives (Pitfall 7).
- [ ] **Price edited in Studio:** displayed price, session price and receipt agree, or the mismatch is rejected with a message.
- [ ] **Sold state:** designed in FR/EN, phone and desktop; the CONT-04 CTA behaves sensibly.
- [ ] **Legal pages:** every "non-professionnel/occasionnel" string gone; address, SIRET/status, VAT mention, mediator present; accountant and Florian sign-offs recorded.
- [ ] **Withdrawal function** reachable from the footer and the confirmation email; acknowledgement email sent; tested end to end in FR and EN.
- [ ] **CGV acceptance** recorded with the version id.
- [ ] **Confirmation email** delivered to a real inbox (not spam) with SPF/DKIM intact; Zimbra mail still arrives.
- [ ] **EDN-06 guard** still meaningful and flag-aware; `dist/` clean of secrets with the flag off and on.
- [ ] **Shipping:** allowed countries explicit; rates verified against real parcels; packaging tested (drop test) and a damage procedure written.
- [ ] **Shop pause switch** works without a rebuild.
- [ ] **Sanity quota** and webhook count (2 on Free) checked; alert configured.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Oversold unique original | MEDIUM | Auto/manual refund in Stripe, personal apology, mark sold, add missing reservation/expiry logic, review all open sessions |
| Stock clobbered by draft publish | LOW-MEDIUM | Reconcile from Stripe paid sessions; move stock to a system-owned document; add `ifRevisionID` |
| PII written to Sanity public dataset | HIGH | Delete documents, rotate tokens, assess GDPR breach duty (accountant/lawyer), purge from exports/backups |
| Wrong VAT charged / wrong mention | MEDIUM | Accountant guidance, corrective invoices/refunds, fix regime data model |
| Test/live webhook secret mix-up at go-live | LOW | Replace secret, resend missed events (Dashboard resend up to 15 days, CLI up to 30 days [M]) |
| Withdrawal info/function missing | MEDIUM | Add function and CGV text; extend consumer's period exposure up to 12 months for affected orders [M/L]; contact those buyers |
| Parcel lost/damaged | LOW-MEDIUM per parcel | Carrier claim inside the window, replace or refund per CGV, document |
| Unfinished shop shipped by a Publier click | LOW-MEDIUM | Flip `SHOP_MODE` off and redeploy (manual dispatch), then fix forward |
| Status published wrongly | MEDIUM | Correct the legal page immediately after accountant input; keep a dated changelog |

## Pitfall-to-Phase Mapping

Phase names are **provisional labels** matching the milestone brief (SHOP-*, CHK-*, SHIP-*, LEGAL-02/04); the roadmapper may rename them. "Track 0" is a parallel admin track owned by Romane with Florian supporting.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 1 Selling while "non-professional" | Track 0 + Legal + Go-live gate | grep for non-professional strings; sign-offs; status/SIRET shown |
| 2 SIRET lead time, Stripe activation unknown | Track 0 (start now) | Dated registration milestone; Stripe onboarding dry-run notes |
| 3 Success-page-only / webhook faults | Checkout | Kill-tab test; double-delivery test; wrong-secret test; live endpoint test at Go-live |
| 4 Price tampering / displayed mismatch | Checkout | Tamper test (modified payload rejected); Studio price-edit test |
| 5 Oversell of unique original | Checkout (stock) | Concurrent-session test; expiry release; paid-after-sold refund path |
| 6 Static vs real stock drift | Shop catalogue + Checkout | Runtime availability endpoint; designed sold state, both viewports |
| 7 Draft clobber, PII in public dataset, quota | Shop data-model (first) | Publish-draft-after-sale test; schema review (no PII fields); usage alert |
| 8 VAT/franchise setup | Track 0 + Delivery & VAT + Legal | Accountant answers recorded; price/regime data-driven; invoice mention check |
| 9 Withdrawal right and function | Legal | End-to-end withdrawal test FR/EN; acknowledgement email; CGV mentions the function |
| 10 CGV traps, acceptance record | Legal + Checkout | CGV version stored per order; FR/EN parity test; lawyer/accountant review |
| 11 Shipping damage, zones, book-price | Delivery & VAT | Allowed-country list; packaging drop test; carrier terms read; no free-shipping on books until cleared |
| 12 Publisher address vs public repo | Track 0 + Legal | `git grep` for addresses (as 261004-kbq); content-agnostic e2e |
| 13 Main-branch deploy coupling | First phase (flag) | Build with flag off has no commerce strings; artifact secret scan |
| 14 Pages that must change | Legal | Checklist table complete; updated tests; human sign-off |
| 15 EDN-06 guard and CONT-04 | Shop catalogue | Guard scoped by flag/visibility; spec contract updated |
| 16 GDPR/cookies | Checkout + Legal | Cookie inventory on live checkout path; privacy page names Stripe |
| 17 Edition integrity, COA, image rights | Shop data-model + catalogue | `editionSize` immutable; image-rights audit before listing |
| 18 Endpoint abuse, secret leakage | Checkout | Rate-limit test; `dist/` secret scan green |

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Read-only catalogue (SHOP-*) | Shipping a price list that looks like a shop; EDN-06 tripping | Flagged `catalogue` mode with no purchase affordances; scoped guard |
| Server surface / hosting choice | Choosing a host that cannot receive Stripe webhooks reliably or has cold-start/limits | Research flag (see Gaps); webhook-first design; keep OVH as static host |
| Test-mode checkout | False confidence: no emails, 3-retry sandbox, test-only objects | Go-live checklist and a live smoke test after SIRET |
| Delivery & VAT | Guessing VAT regime and "Europe" scope | Accountant answers first; explicit country allowlist |
| Sales legal pages | Template CGV, missing new withdrawal function, mediator | Legal review, FR source of truth, version ids |
| Go-live | Live keys/secrets, webhook endpoint, status mismatch | Gate checklist; first live transaction is a controlled refunded purchase |

## Questions to put to the accountant / registration desk (appendix)

1. Which status fits Romane: artiste-auteur only (own works and self-reproduced copies), micro-entrepreneur (merch/resale), or both, and does each give its own SIRET?
2. Franchise en base: which threshold applies to each activity family, how do mixed activities add up, and how should turnover be tracked?
3. Which products qualify for the 5.5% rate if she leaves franchise (signed, numbered, 30 copies max, all formats), and at what rate are books and merchandise?
4. EU sales: is a franchise-en-base seller affected by the 10,000 EUR intra-EU distance-sales threshold/OSS, and which countries are safe to open first?
5. Mandatory invoice content for consumer sales and when an invoice must be issued (on request?) in her status.
6. What exactly must appear on the website notice (SIRET, phone, address; is a domiciliation acceptable)?
7. Mediator: which scheme is cheapest/acceptable, and is any exemption available for a sole seller?
8. Insurance/liability for shipped artworks and for product-safety obligations on merchandise (GPSR applies since 13 Dec 2024 to consumer products incl. online sellers; applicability to prints/merch is [U] [L]).
9. Image rights: which series require releases before they are sold as prints or merch?
10. Bookkeeping duties and retention periods for orders and customer data.

## Gaps to Address (research flags)

- **Server surface / hosting for checkout** (separate research): webhook reliability, cold starts, secrets handling, free-tier limits.
- **Whether Stripe requires a SIRET for an individual French account** is not confirmed in any official page I could reach (verify empirically).
- **Withdrawal-function details** are from secondary sources; read Ordonnance 2026-2 / Décret 2026-3 on Légifrance and the DGCCRF page (the DGCCRF pages returned HTTP 403 to the fetch tool).
- **Franchise thresholds**: the "authors/artists" figure (50,000 EUR on works and rights vs 35,000 EUR on other activities) is clear on service-public and justice.fr but how mixed print/merch activity is assessed needs the accountant.
- GPSR, Lang law, packaging/EPR obligations, dépôt légal for éditions, Toubon on CGV language: **[U]/[L]**, not verified against official pages.
- Colissimo and Stripe fee figures change; re-read at implementation.

## Sources

**Primary / official (read directly):**
- Stripe, Webhooks: https://docs.stripe.com/webhooks [M]
- Stripe, Fulfill orders (Checkout): https://docs.stripe.com/checkout/fulfillment.md?payment-ui=stripe-hosted [M]
- Stripe, Manage limited inventory: https://docs.stripe.com/payments/checkout/managing-limited-inventory.md?payment-ui=stripe-hosted [M]
- Stripe, Create a Checkout Session (API): https://docs.stripe.com/api/checkout/sessions/create [M]
- Stripe, Idempotent requests: https://docs.stripe.com/api/idempotent_requests [M]
- Stripe, Go-live checklist: https://docs.stripe.com/get-started/checklist/go-live [M]
- Sanity pricing/Free plan: https://www.sanity.io/pricing [M]; Sanity answers on draft overwrite: https://www.sanity.io/answers/it-looks-like-our-problems-are-caused-by-editors-p1599646197205900 [M]; dataset visibility: https://www.sanity.io/docs/content-lake/keeping-your-data-safe [L, via search extract]
- Service-Public Entreprendre, Franchise en base de TVA (verified 1 Jan 2026): https://entreprendre.service-public.gouv.fr/vosdroits/F21746 [M]
- Justice.fr, Artiste-auteur fiscalité (updated 2026-02-20): https://www.justice.fr/fiche/artiste-auteur-fiscalite-declaration-revenus-tva-cfe [M]
- Service-Public Entreprendre, Artiste-auteur (verified 2024-05-03): https://entreprendre.service-public.gouv.fr/vosdroits/F22388 [M]
- Service-Public, Droit de rétractation (F10485): https://www.service-public.gouv.fr/particuliers/vosdroits/F10485 [M]
- Service-Public, Distance shopping pre-contract information (F10483, verified 2024-03-13): https://www.service-public.gouv.fr/particuliers/vosdroits/F10483?lang=en [M]
- Légifrance, art. L221-28 Code de la consommation: https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044563170 [M]
- EU VAT One Stop Shop portal: https://vat-one-stop-shop.ec.europa.eu/one-stop-shop_en [M via search extract]
- CNIL cookie rules (exemptions incl. shopping cart): https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles [M via search extract]
- Legifiscal summary of CJEU C-145/18 / BOFiP 2024 on art photographs: https://www.legifiscal.fr/actualites-fiscales/3735-photographies-art-conditions-beneficier-taux-tva-55.html [L-M]

**Secondary (leads, re-verify):**
- CCI Paris IDF on the withdrawal function: https://www.entreprises.cci-paris-idf.fr/actualites/e-commerce-et-droit-de-retractation-une-nouvelle-obligation-pour-les-professionnels [L]
- Lettre des réseaux: https://www.lettredesreseaux.com/implementation-de-la-fonctionnalite-de-retractation-et-sanctions.html [L]
- ecommerce-nation: https://www.ecommerce-nation.fr/e-commerce-le-bouton-de-retractation-devient-obligatoire-le-19-juin-2026/ [L]
- Mediation obligation summaries (legalplace, economie.gouv mediation pages) [L]
- La Poste Colissimo insurance pages: https://www.laposte.fr/quelles-sont-les-differentes-assurances-colis [L]
- SIRET lead-time articles (abby.fr, legalplace, copeps) [L]
- GPSR overviews (soulier-avocats, fieldfisher, donneespersonnelles.fr) [L]; accessibility directive overviews (economie.gouv DGCCRF pages) [L]
- Loi Lang summaries (livreshebdo, Assemblée nationale proposals) [L]; image-rights summaries [L]

**Repository evidence [REPO]:** `.planning/PROJECT.md`; `.planning/quick/261004-kbq-*/261004-kbq-SUMMARY.md`; `src/pages/mentions-legales.astro`; `src/pages/confidentialite.astro`; `.github/workflows/deploy-ovh.yml`; `tests/scripts/verify-static-artifact.mjs`; `tests/e2e/edition.spec.ts`.

---
*Pitfalls research for: adding shop + Stripe checkout + stock + delivery/VAT + sales legal pages to a static Astro/Sanity/OVH art portfolio*
*Researched: 2026-10-04. This document is not legal or tax advice.*
