# Research Summary: v2.0 "Boutique"

**Project:** Atelier Jacqueline Suzanne (milestone v2.0 Boutique: shop, Stripe checkout, stock, delivery/VAT, sales legal pages)
**Domain:** one-artist art shop (prints, originals, books, maybe merch), France/EU, added to a live Astro 7 static + Sanity + OVH site
**Researched:** 2026-10-04 (synthesised from STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md in this folder)
**Overall confidence:** MEDIUM (technical findings MEDIUM-HIGH; legal, tax and VAT findings MEDIUM at best, often LOW or UNVERIFIED, and never upgraded here)

> **NOT LEGAL, TAX OR VAT ADVICE.** Nothing in this file or in the four source files is legal, tax or accounting advice. None of it has been reviewed by a lawyer, an accountant, the DGCCRF, the tax office or the guichet des formalités. Every legal, tax and VAT statement is a research finding to validate. Real sales must not open until the decisions in "Decisions that need an accountant or a lawyer" are settled by a professional.

Confidence tags are carried over from the sources: **[HIGH]** official page read; **[MEDIUM]** official page via summariser, or official data plus inference; **[LOW]** secondary or community only; **[UNVERIFIED]** not confirmed, do not rely on it. A tag here is never stronger than in the source.

## Executive Summary

This is a small-catalogue shop (a handful of products, a few orders a month) bolted onto a static site that has no request-time compute. The research converges on one shape:
- Keep `output: 'static'` and OVH untouched.
- Add **one small server surface**: create a Checkout Session, receive Stripe webhooks, re-validate and reserve stock.
- Use **Stripe-hosted Checkout (redirect), `payment` mode, inline `price_data`**.
- Keep **stock in Sanity with optimistic locking**, with no second database.
- Pick the shipping **zone on the site before Checkout**, because hosted Checkout cannot vary shipping by address.
- Keep Stripe Tax, Managed Payments, Elements, Payment Links and a custom Checkout domain off.

The recommended server surface is a **Cloudflare Worker (free plan) in a sibling subproject**, the same pattern as `sanity/`. OVH PHP is the fallback, only after a 30-minute outbound-HTTPS spike. Recurring cost of the additions is 0 EUR/month. The one possible cliff is Workers Paid at $5/month.

The first deliverable should be a **read-only catalogue with zero server code**, shippable before Romane has a SIRET. All payment work runs in Stripe sandbox against a staging Sanity dataset. The hard constraint on going live is not technical. It is Romane's business registration, VAT regime, invoicing and CGV. It also includes the new online withdrawal function (in force since 19 June 2026 per [MEDIUM-HIGH] sources) and flipping the legal pages from "non-professional" to a professional publisher notice. That is a parallel admin track and the real critical path to revenue, so it must start on day one.

Top risks:
1. Taking money while the site still says "non-professional", or before status and VAT are settled.
2. Stock corruption: draft-publish overwrite, double webhooks, overselling the unique original.
3. Unfinished shop code shipping on Romane's next Publier click, because `deploy-ovh.yml` builds `main` HEAD with no approval.
4. Customer PII landing in a public Sanity dataset.
5. The existing EDN-06 build guard and the "non-professional" legal wording fighting the shop.

## Conflicts and Open Contradictions (read this first)

These are disagreements between the four files, or between the files and existing project docs. The roadmapper must resolve each one explicitly.

| # | Conflict | Positions | Recommended resolution |
|---|----------|-----------|------------------------|
| C1 | **Stock location** | CLAUDE.md "What NOT to Use": `stockQuantity`/`soldOut` as fields on the Sanity product document. PITFALLS P7, ARCHITECTURE s2/13 and STACK s6: a separate backend-owned document, because publishing a draft replaces the published doc and would overwrite a decremented quantity [HIGH]. | **Separate stock document wins.** The "no second database" intent of CLAUDE.md is kept, since it is still Sanity. Update CLAUDE.md when the data-model phase ships. Naming also differs: STACK says `inventory`, ARCHITECTURE says `stock` with `liveEdit: true` and id `stock-<sku>` (dotless, so publicly readable). Use ARCHITECTURE's shape, the only fully specified one. |
| C2 | **"Stripe payouts require a SIRET"** (PROJECT.md assumption) | STACK: Stripe's requirements data for France, entity `individual`, lists no SIREN/SIRET field, while `company` adds `tax_id`. [MEDIUM; Connect-oriented dataset; Dashboard flow UNVERIFIED]. PITFALLS: no official Stripe page found [UNVERIFIED]. FEATURES: real sales blocked until SIRET as a business/legal prerequisite. | **Keep it flagged UNVERIFIED and do not restate it as fact.** There are two separate questions. (a) What Stripe's onboarding asks: do a Dashboard dry run now. (b) Whether Romane may legally sell regularly without registering: accountant. Sandbox build proceeds regardless. |
| C3 | **Compute host: "deferred" vs now recommended** | CLAUDE.md defers the commerce host and floats "Cloudflare Pages Functions, or another compute option". STACK and ARCHITECTURE recommend a **separate Cloudflare Worker (not Pages Functions, no Astro adapter)**. OVH PHP is the fallback, with unverified prerequisites. | The deferral ends here but it is still an **owner decision (D1)**. The Worker is consistent with the "no adapter, static-only" rule. Update CLAUDE.md wording at the decision. The hosted-Studio setup is unaffected, so do not conflate it with the new compute host. |
| C4 | **EDN-06 build guard vs showing prices** | FEATURES: relax or retire the guard as the first task. PITFALLS: scope it by a `SHOP_MODE` flag. ARCHITECTURE: **do not touch it**. Use a separate `product` doc referencing `edition`, keep `edition.ts` free of money fields, put prices only on `/boutique/...` (outside the scanned `editions/` path), and add only a commerce-neutral "Voir en boutique" link on édition pages. Sub-conflict: FEATURES wants "Prix sur demande" until the VAT regime is known; PITFALLS wants no purchase affordances in catalogue mode; ARCHITECTURE says product pages may show prices. | **Leave EDN-06 as-is** (ARCHITECTURE). Change it only if the owner later wants prices on édition pages, and then also update the 12-UI-SPEC contract and CONT-04's "universal" statement. For the sub-conflict: **no prices in the read-only phase unless the accountant has confirmed the regime.** |
| C5 | **Public-repo address purge vs professional publisher notice** | Quick 261004-kbq purged a personal address from the public repo and made `publisherAddress` an empty Sanity field. A professional notice needs an address (FEATURES, PITFALLS P12). Virtual or PO-box addresses may be rejected by Stripe and mentions légales [LOW]. Domiciliation costs money. The Sanity dataset is itself public. | Address strategy (home, atelier, domiciliation) is an **accountant/registration-desk decision before touching `publisherAddress`**. The address stays only in Sanity, never in code, tests or fixtures; keep the content-agnostic e2e. The "Statut" section still says non-professional even when the address is filled (261004-kbq open point (d)), so the status flip needs one `sellerStatus` source of truth. |
| C6 | **Orders and PII in Sanity** | ARCHITECTURE: private `order.<sessionId>` docs (dotted ids are private in a public dataset [HIGH]) holding name, email and address, with a retention rule. Its own caveats: Studio behaviour with dotted-id `liveEdit` docs is UNVERIFIED (spike S2), and the build token can read them. STACK and PITFALLS: **never any PII in Sanity**. FEATURES: orders-as-documents is a HIGH-complexity differentiator and the Stripe Dashboard suffices. | **Default to no PII in Sanity.** At most an ids-only order record (session id, SKU, qty, status), with address work done from the Stripe Dashboard. Revisit only if the owner asks and S2 passes. PITFALLS rates a PII breach HIGH recovery cost. |
| C7 | **Live availability: endpoint vs direct read vs rebuild** | STACK: Worker `GET /availability` with a 30 s cache, and `inventory` kept out of the deploy webhook. ARCHITECTURE: **no custom endpoint**. The browser reads public `stock` from the Sanity CDN, plus a second webhook rebuilding on `delta::changedAny(onHand)`. PITFALLS: static is a hint; keep stock off the publish webhook or debounce. Webhook count also differs: STACK says both free webhooks are used; ARCHITECTURE and PITFALLS say one. | Unresolved on mechanism, so resolve in the checkout phase. All files agree on four points: static state is a hint, checkout is authoritative, no rebuild per hold, and "just sold" is a designed state. **Verify the README webhook count first.** The `delta::changedAny` filter is UNVERIFIED (spike S4). `tests/unit/publishing-docs.test.ts` locks the webhook filter to schema types, so it needs an explicit exclusion list for `stock`/`order`. |
| C8 | **Browser-to-server call style** | STACK: cross-origin `fetch` to `*.workers.dev` with CORS allowlist, env `PUBLIC_SHOP_API_URL`. ARCHITECTURE: plain HTML form POST answered by 303 to Stripe (no CORS), env `SHOP_API_URL`. | Prefer form POST + 303 for buy-now. Use `fetch` + CORS only if a cart ships. Pick one env var name; "unset = read-only shop" is agreed. |
| C9 | **Gating unfinished shop code** | PITFALLS P13: build-time `SHOP_MODE=off\|catalogue\|live` flag, default off, because a Publier click ships `main` HEAD. ARCHITECTURE: nav gated by content existing, buy UI hidden when the API URL is unset, `salesOpen` kill switch. STACK: API URL unset. | Use **all three**. A build-time flag covers every shop surface including nav and sitemap, the API URL controls the buy UI, and `salesOpen` is the runtime kill switch. |
| C10 | **Oversell policy** | ARCHITECTURE: record the order, flag `attention`, manual refund (auto-refund is its own suggestion, not a documented Stripe procedure). PITFALLS: auto-refund with a pre-written message. | Owner decision. Default recommendation: manual refund in v2.0. |
| C11 | **Confirmation e-mail and invoices** | FEATURES and ARCHITECTURE: Stripe receipts (free; not sent automatically in test mode). PITFALLS: Stripe receipts do not replace the legal durable-medium confirmation, so send an own e-mail and mind SPF on the Zimbra domain. STACK: avoid `invoice_creation` (0.4%, capped). ARCHITECTURE: `invoice_creation` is "the likely mechanism". FEATURES: own template, manual at this volume. | Whether a Stripe receipt is enough, and whether an invoice is required for goods, are **UNVERIFIED legal questions**. Plan for an own confirmation e-mail as the safe case, with a merged SPF record rather than an overwritten one. |
| C12 | **Payment Links as a bridge** | FEATURES: credible no-server first release (`completed_sessions.limit = 1`). STACK: emergency fallback only. PITFALLS: limit semantics UNVERIFIED. | Do not build the milestone on it. Keep it only as an emergency fallback for selling one original. |
| C13 | **Naming drift** | STACK: `worker/`, `staging`/production. ARCHITECTURE: `shop-api/`, `test`/`live`, `deploy-shop-api.yml`. FEATURES: `/boutique/` and `/en/shop/`. ARCHITECTURE: shared `boutique` segment, because the i18n switcher derives the other-locale URL from a shared slug. | Use ARCHITECTURE's names and shared `boutique` unless the owner prefers `shop` (D7). |
| C14 | **Phase labels** | FEATURES: A catalogue, B test checkout, C legal/tax, D go-live. ARCHITECTURE: A-E with a separate API-foundation phase. PITFALLS: Track 0 plus provisional names. | One reconciled order is below. The files gloss over one dependency: checkout needs a minimal shipping-zone model, so zone config must land with or before the checkout phase, not after it. |

## Key Findings

### Recommended Stack (STACK.md; MEDIUM-HIGH)

The existing stack is unchanged. These are the additions only.

- **Cloudflare Worker, free plan**, sibling subproject deployed by Wrangler from GitHub Actions.
  - Limits: 100k requests/day and **10 ms CPU per invocation (headroom must be measured in staging, UNVERIFIED)**.
  - Properties: no VM cold start, encrypted secrets, hard stop with no surprise bill.
  - Routes: checkout, Stripe webhook, optional availability/health.
- **Stripe hosted Checkout (redirect), `payment` mode, inline `price_data`.**
  - SDK: `stripe` **23.0.0**, released 2026-10-01 and a brand-new major. Pin it exactly; 22.x is the fallback.
  - Webhooks: `constructEventAsync`; restricted `rk_` key.
  - Session: `locale` fr/en, `expires_at` 30 minutes.
  - Events: `checkout.session.completed` and `.expired` only. Delayed payment methods stay off.
- **Sanity stays the only store.**
  - A separate stock document with `ifRevisionID` locking (409 on conflict).
  - `@sanity/client` 7.23.0; running inside a Worker is UNVERIFIED.
  - A dedicated write token. Editor-role availability on Free is UNVERIFIED, and the token can write the whole dataset, so treat it as high value and export the dataset before go-live.
- **Shipping:** zone selector (France / EU) before Checkout, one fixed `shipping_rate_data` per Session, explicit `allowed_countries`.
- **VAT:** default **no Stripe Tax**. Prices are integer cents as displayed. Fixed `tax_rates` only if the accountant says so. Stripe Tax Basic pricing is MEDIUM and must be re-read.
- **Abuse control:** Cloudflare Turnstile (free). Whether it needs consent under the existing CNIL posture is UNVERIFIED.
- **Environments:** staging Worker + Stripe sandbox + second Sanity dataset `staging` (Free allows 2 datasets, public only [MEDIUM]). Production Worker with live keys is deployed only after activation.
- **Costs:** Stripe 1.5% + 0.25 EUR (EEA standard cards), no monthly fee. Do not buy the $10/month custom Checkout domain. Avoid the 0.4% post-payment invoices.
- **Do not add:** `@astrojs/cloudflare`, SSR, `@stripe/stripe-js`, Stripe Tax, a second database, a cart SaaS, or any secret in the Astro project or `dist/`. Extend `test:artifact` with a secret scan.

Ruled out:
- Vercel Hobby: non-commercial only [HIGH].
- Netlify: credit pool shared with deploys, hard stop, commercial terms UNVERIFIED.
- Stripe Managed Payments: digital goods only.
- Moving DNS to Cloudflare: it puts the Zimbra mail DNS proven in v1.7 at risk for a cosmetic gain. Use `workers.dev`.

### Expected Features (FEATURES.md; MEDIUM)

**Must have**
- Bilingual shop index, tiles and product pages on a separate `product` model (see C4), a nav entry, and availability states including "Vendu".
- Typed specs (format, paper, edition size, signed/numbered). Delivery info visible before checkout.
- Stock of exactly 1 for originals, with server-side re-validation. Edition size is modelled at artwork level; the 30-copy photograph condition is [MEDIUM].
- Direct buy to hosted Checkout, with a zone selector, shipping by zone and class, success and cancel pages, and seller and customer notifications.
- Sales legal pages: CGV (FR authoritative), withdrawal information and form, legal guarantees, mediator, professional mentions légales, privacy update, and the **online withdrawal function**.
- VAT regime as configuration, not hard-coded. Invoice approach agreed with the accountant.
- Owner tooling: Studio product editing, manual stock override, a "Boutique en pause" switch, the Stripe Dashboard for orders and refunds, and a one-page owner guide.

**Should have**
- Per-product buy-vs-enquire mode (reuses CONT-04).
- "n remaining" counter.
- Webhook auto-decrement and auto "Vendu". This becomes P1 if the original edge case cannot be handled otherwise.
- Notify-me via the contact form.

**Defer**
- Multi-item cart, orders with tracking e-mails, certificate PDFs, room mockups.
- Merchandise (GPSR, variants, supplier; FEATURES and PITFALLS agree).
- Non-EU shipping, Stripe Tax and OSS registration, exhibition-linked sales.

**Anti-features:** customer accounts, discount codes (loi Lang book-price rules UNVERIFIED), framed prints, custom-size print-on-demand, worldwide shipping, live payments before SIRET and professional review.

### Architecture Approach (ARCHITECTURE.md; MEDIUM-HIGH)

Static pages stay static. A new `product` document references `edition` (never the reverse), so EDN-06 stays intact. Every sellable thing is a variant (SKU, price in cents, stock policy `unique | limited | untracked`). Stock is a separate `liveEdit` document per SKU with expiring holds.

Checkout is reserve-then-pay:
1. Write an expiring hold with `ifRevisionID`.
2. Create the Stripe Session with `expires_at` just under the hold.
3. On `checkout.session.completed`, run one atomic Sanity transaction that creates the order doc with a deterministic id, removes the hold and decrements stock. A replayed webhook cannot double-decrement.

Print masters never enter Sanity, `public/`, `dist/` or git (public repo, public dataset). In v2.0 they stay on Romane's own storage. New browser code never imports `src/lib/sanity.ts`. The Worker core is pure TypeScript with injected clients, so the existing Vitest/ESLint/tsc gates cover the money logic, including a simulated concurrent-reserve race.

**Major components**
1. `product`, `stock`, `shopSettings` (singleton with a `salesOpen` kill switch) schemas, an ids-only `order` (per C6), and Studio structure.
2. `src/lib/shop-models.ts`, the `/boutique/` pages (fr/en, shared segment), the buy box, and nav and sitemap changes.
3. A `shop-api/` Worker with checkout (reserve + session), the Stripe webhook (complete/expire) and health. It has its own CI steps and a separate reviewer-gated live deploy.
4. Sanity webhook changes (C7) plus README and `publishing-docs.test.ts` updates.

### Critical Pitfalls (PITFALLS.md; MEDIUM)

1. **Selling while the site says "non-professional", or before status is regularised** (P1, P2, P12, P14).
   - Make regularisation a hard gate.
   - Use one `sellerStatus` source of truth.
   - Start the registration and accountant track on day one.
   - Do a Stripe onboarding dry run.
2. **Success-page-only fulfilment and webhook faults** (P3).
   - Fulfil from webhooks only, with a raw-body signature check.
   - Use per-mode and per-endpoint secrets.
   - Return 2xx fast.
   - Make handlers idempotent on session id and event id.
   - Re-verify the live endpoint at go-live.
3. **Price tampering and displayed-vs-charged mismatch** (P4).
   - The browser sends only a product reference and a quantity.
   - The server reads the price from Sanity (non-CDN) and rejects on a displayed-price mismatch.
   - Use inline `price_data`.
4. **Oversell of the unique original, stock drift, draft clobbering, quota** (P5, P6, P7).
   - Server-side reservation with the 30-minute minimum expiry, and instant-confirmation payment methods only.
   - Release on `checkout.session.expired`, with a defined paid-after-sold path.
   - Treat static availability as a hint.
   - Keep stock in a separate document with no PII in the public dataset.
   - Watch the 250k API cap: there is no overage, so exhausting it would take the build and Studio down.
5. **Main-branch deploy coupling** (P13). Half-built shop code goes live on the next Publier click, so gate every shop surface with a build-time flag from phase 1.

Also material:
- The new withdrawal function (P9; details LOW-MEDIUM).
- CGV and mediator traps (P10). The mediator may be a recurring cost against the 0-5 EUR/month target.
- Shipping damage, zones and book-price rules (P11).
- GDPR and cookies (P16): prefer hosted Checkout.
- Edition integrity and image rights (P17).
- Endpoint abuse and secret leakage (P18).

## Decisions that need an accountant or a lawyer

None of these may be decided by the developer or by this research. Each is a precondition for the go-live gate, and most also affect what is displayed in the read-only phase.

**Accountant / registration desk (guichet des formalités, Urssaf artistes-auteurs, SIE)**
1. Romane's status (artiste-auteur, micro-entrepreneur, or both) and whether each gives its own SIRET. Also whether regular online selling is permitted without registering (C2).
2. VAT regime:
   - franchise-en-base thresholds per activity family, and how mixed print/book/merch activity is assessed;
   - the "TVA non applicable, art. 293 B du CGI" mention;
   - the rate per product kind if VAT applies. The generalised 5.5% for art from 2025 is LOW.
3. Which products count as works of art for VAT (signed, numbered, 30 copies max across all formats [MEDIUM]), and the edition-size policy above 30.
4. EU sales: how the 10,000 EUR intra-EU threshold and OSS interact with a franchise seller [UNVERIFIED], and which countries to open first.
5. Invoice obligation for B2C goods and its content [UNVERIFIED]. Whether Stripe invoices, receipts or an own template are acceptable, and whether the separately priced `invoice_creation` is needed.
6. Publisher address strategy (home, atelier, domiciliation) for the professional notice and for Stripe (C5), and what the notice must contain.
7. Bookkeeping and retention periods. Whether Stripe Tax is ever needed.
8. Insurance and liability for shipped artworks. GPSR applicability to prints and merch [LOW].

**Lawyer / professional legal review**
9. CGV text: FR authoritative with an EN courtesy translation (Toubon UNVERIFIED), and the risk-transfer wording (transit risk on the seller toward consumers, L216-4 [UNVERIFIED]).
10. The online withdrawal function: exact French label, article numbers (L221-21 / D221-5) and acknowledgement mechanics. The sources are mostly LOW-MEDIUM and the DGCCRF pages could not be fetched.
11. Whether Stripe's hosted "Pay" button satisfies "commande avec obligation de paiement" (L221-14 [OFFICIAL-SNIPPET]), or whether an own confirmation step plus `custom_text` is needed.
12. Which products are "personalised" for the L221-28 exception. A standard-size print is probably not, originals are not excepted, and zines vs "périodique" is interpretation (LOW).
13. Whether a Stripe receipt can serve as the durable-medium confirmation (L221-13 [UNVERIFIED]), or an own e-mail is required.
14. Consumer mediator: which scheme, its cost (budget conflict), and any exemption for a sole seller.
15. Privacy policy content and retention periods. Whether Turnstile needs consent [UNVERIFIED]. Image-rights releases for series sold as prints or merch (portraits and the "Adults" series are the exposure).
16. Whether loi Lang book-price rules apply to self-published photo books or zines [UNVERIFIED], before any discount or free-shipping rule on éditions.

Florian's existing human sign-off checkpoint for legal-content accuracy (Key Decision 2026-07-08) applies in addition.

## Implications for Roadmap

This is one reconciled phase order replacing the A-D, A-E and Track-0 labels. The read-only catalogue comes first and the go-live gate last. Phases 3 and 4 can overlap in time.

### Track 0: Admin and decisions (parallel, non-dev, starts at kickoff)
- **Owner:** Romane, with Florian.
- **Rationale:** it is the critical path to revenue and has external lead times. SIRET takes about 8-15 days after filing and 4-10 weeks end to end, per LOW sources.
- **Delivers:**
  - a dated registration milestone;
  - the accountant answers above;
  - a Stripe onboarding dry run;
  - the address strategy;
  - the mediator choice;
  - owner decisions D1-D12.
- **Feeds:** phase 1 (price display), phase 4 and phase 6.

### Phase 1: Read-only catalogue and shop flag (no server code, no payment)
- **Rationale:** shippable before SIRET, with no live-site risk if gated, and it validates the data model and design.
- **Delivers:**
  - the build-time shop flag and `salesOpen`;
  - `product`, `stock` and `shopSettings` schemas and Studio structure, plus a `createStockLines` action;
  - `sanity.ts` and `sanity-validation.ts` extensions that degrade rather than crash;
  - `/boutique/` index and product pages in fr and en;
  - sold, available and coming-soon states, with the CONT-04 CTA as the only action;
  - flag-gated nav and sitemap;
  - a delivery and returns block marked provisional;
  - webhook, README and `publishing-docs.test.ts` updates;
  - the neutral "Voir en boutique" link on édition pages, as the LAST plan of the phase.
- **Addresses:** the SHOP-* table stakes, and edition size as a structured field.
- **Avoids:** P13 (flag), P15/C4 (EDN-06 untouched), P7 (separate stock doc, no PII), P17 (edition fields, image-rights audit of listed series).
- **Verification:** dual-viewport e2e in both locales, EDN-06 green, and the build survives a missing stock doc.

### Phase 2: Server surface foundation (no real payments)
- **Rationale:** the host choice gates everything below it.
- **Delivers:**
  - the host decision (D1);
  - spikes S2-S5 (S1 only if PHP is chosen);
  - the `shop-api/` skeleton with a pure core, an in-memory Sanity fake and a concurrent-reserve race test;
  - CI integration in the composite action;
  - the `staging` dataset and a secrets runbook;
  - a secret-leak scan in `test:artifact`;
  - a CPU measurement against the 10 ms limit.
- **Avoids:** P18 and P7 (token scope, dataset export plan).

### Phase 3: Test-mode checkout
- **Rationale:** the core of the milestone, in Stripe sandbox only.
- **Delivers:**
  - checkout (reserve + session) and the webhook (complete/expire, idempotent);
  - a minimal shipping-zone model and zone selector, with `shipping_rate_data`, `allowed_countries` and `locale`;
  - `consent_collection` for CGV, the buy box, and success and cancel pages (not proof of payment);
  - the availability mechanism per C7 and the `order` record per C6;
  - Turnstile or an equivalent on unique and limited items.
- **Avoids:** P3, P4, P5, P6, P16, P18.
- **Verification:**
  - kill-tab, double-delivery and wrong-secret tests;
  - two concurrent sessions on a unique item;
  - a tamper test and a Studio price-edit test;
  - a draft-publish-after-sale test.

### Phase 4: Delivery, VAT and sales legal pages (overlaps phase 3, gated by Track 0)
- **Delivers:**
  - final shipping zones and classes, and a packaging and damage procedure;
  - VAT regime as configuration and the `sellerStatus` single source of truth;
  - versioned CGV (FR source);
  - withdrawal information, the online withdrawal function and its acknowledgement e-mail;
  - the mediator, the professional mentions légales with `publisherAddress`, and the privacy update (Stripe, Cloudflare, shipping data);
  - an own confirmation e-mail if required (C11);
  - updates to `legal.spec.ts`, `privacy-pages.test.ts`, `e2e-content-fragility` and `page-models.test.ts`.
- **Avoids:** P1, P8, P9, P10, P11, P12, P14.
- **Human checkpoint:** Florian sign-off plus accountant and legal review, before anything merges to a live-flagged build.

### Phase 5: Fulfilment and hardening
- **Delivers:**
  - a "Commandes" view, or a Stripe-Dashboard-only process per C6;
  - the owner guide (create a product, adjust stock, process an order, refund and restock, pause the shop);
  - a reconcile script (Stripe paid sessions vs order records);
  - "Boutique en pause";
  - a restricted Stripe key, a dataset export and abuse limits;
  - an accessibility pass on the new routes.

### Phase 6: Go-live gate (no new features)
- **Delivers:**
  - SIRET present and Stripe live activation;
  - accountant validation and professional legal review;
  - the live Worker and live webhook endpoint with their own secrets, and rotated keys;
  - the flag flipped;
  - one real low-value purchase and refund in both languages and both viewport classes;
  - confirmation that the stock change triggers the intended catalogue refresh.
- **Acceptance list:** the PITFALLS "Looks Done But Isn't" checklist.

### Phase Ordering Rationale
- Dependencies:
  - the catalogue needs nothing;
  - the Worker needs the host decision and the schemas;
  - checkout needs the Worker and a minimal zone model;
  - legal pages gate go-live but depend on Track 0;
  - go-live needs everything.
- Read-only first keeps live-site risk to nav, sitemap and new routes, all flag-gated.
- The stock and PII decisions (C1, C6) are made in phase 1 because retrofitting them is a data migration.

### Research Flags
Phases needing deeper research:
- **Phase 2:**
  - the host decision, and the PHP outbound spike if PHP is chosen;
  - `@sanity/client` inside a Worker, and 409 vs 400 on `ifRevisionID` mismatch;
  - the free-plan Editor token and CPU headroom;
  - Cloudflare free-plan commercial-use terms.
- **Phase 3:**
  - the webhook #2 filter and CDN freshness (S4, S6);
  - the restricted-key permission set and API-version field names (S7);
  - Turnstile vs consent.
- **Phase 4:** the most uncertain area. It needs professional input more than web research. Re-read Ordonnance 2026-2, Décret 2026-3 and L221-5/14/21 on Légifrance.
- **Track 0:** Stripe Dashboard onboarding for a French individual (UNVERIFIED).

Phases with standard patterns (skip research-phase):
- **Phase 1:** follows the existing Éditions conventions.
- **Phase 5:** Studio structure and procedure writing.
- **Phase 6:** a checklist.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | Platform limits and Stripe behaviour read from official docs on 2026-10-04. Open items: Worker CPU headroom, free-plan commercial use, Editor token, Dashboard onboarding for a French individual, Stripe Tax live price (MEDIUM), and `stripe` 23.0.0 being a new major. |
| Features | MEDIUM | UX patterns MEDIUM. Stripe mechanics MEDIUM-HIGH. Legal/VAT MEDIUM at best, with DGCCRF pages seen only as snippets. Peer evidence is thin (LOW-MEDIUM). GPSR and accessibility are LOW. |
| Architecture | MEDIUM-HIGH | Sanity and Stripe semantics verified. Several mechanisms are UNVERIFIED pending spikes S1-S8: dotted-id Studio behaviour, the `delta::changedAny` filter, `unset` of an absent key, webhook firing on API mutations, CDN freshness. |
| Pitfalls | MEDIUM | Payment mechanics HIGH-ish. Legal/tax items are validate-first. Withdrawal-function details are LOW-MEDIUM. |

**Overall confidence:** MEDIUM. Legal, tax and VAT findings stay LOW to MEDIUM and are not advice.

### Gaps to Address
- **Stripe SIRET requirement (C2):** dry run in Track 0, and do not restate PROJECT.md's assumption as fact.
- **Webhook count and composition (C7):** verify the README (one vs two in use) before designing webhook #2.
- **Host decision (C3):** decide before phase 2. Run the PHP spike only if the owner refuses another vendor.
- **Withdrawal function:** exact French requirements via Légifrance and DGCCRF, plus lawyer review.
- **VAT/OSS interaction for a franchise seller, and per-kind VAT rates:** accountant.
- **Invoice obligation, confirmation-e-mail rules, "obligation to pay" button wording:** professional review. Plan the safe case (own e-mail, own confirmation step) until confirmed.
- **Cloudflare free-plan commercial use, Turnstile vs consent, `workers.dev` suitability for production** (Cloudflare calls it hobby-oriented): check the agreement and assess with the legal pages.
- **Mediator cost vs the 0-5 EUR/month budget:** price the schemes before launch.
- **Changing figures** (Colissimo, Stripe fees, Sanity Free limits): re-read at implementation. The Sanity quota figures came through a summariser.

## Owner Decisions Needed Before Requirements Are Scoped
The recommended default is in brackets.

1. **Compute host (D1):** Cloudflare Worker [recommended] vs PHP on OVH (needs the spike, has no secret store and is CI-blind).
2. **Buy-now vs cart (D2):** buy-now for one item first, cart UI later [recommended].
3. **Product kinds and stock policies at launch (D3):** which of print, original, book and merch. `unique`, `limited` or `untracked` per kind, and quantity caps. Merch deferred [recommended].
4. **URL segment (D7):** `boutique` shared across fr and en [recommended] vs `shop`. Also whether "Boutique" is in the nav at read-only launch or only when sales open.
5. **Oversell policy (D5):** manual refund [recommended] vs automatic. Accept a reservation of about 36 minutes on the unique original (30-minute Stripe minimum), and decide on Turnstile.
6. **Print-file handling (D9):** masters stay on Romane's own storage [recommended] vs a private bucket with signed links. Is there a print lab that needs files?
7. **Invoicing (D10):** none, own template, Stripe receipts or Stripe invoices. This depends on the accountant answers.
8. **Staging dataset (D11):** second Sanity dataset `staging` [recommended, uses the second free slot] vs test data in production.
9. **PII in orders (C6):** Stripe-only [recommended] vs private order docs with a retention rule.
10. **Prices in the read-only phase (C4):** show prices (needs the VAT regime settled) vs "Prix sur demande" via the enquiry path.
11. **Payment methods (D12):** cards and wallets only [recommended] vs delayed methods.
12. **Shipping scope:** France plus an explicit EU country list, pick-up at the atelier or not, and flat rates by zone and class.

## Sources
- **Primary (HIGH):**
  - Cloudflare Workers limits, pricing, secrets and CI docs, and Turnstile plans.
  - Stripe docs on Checkout, shipping, limited inventory, fulfilment, webhooks, receipts, activation, the go-live checklist and the Sessions API, plus Stripe FR pricing.
  - Sanity docs on transactions, mutations, drafts and `liveEdit`, document ids, CORS, API CDN and datasets.
  - Légifrance L221-5 and L221-18 to L221-28, EUR-Lex Directive 2023/2673, service-public F10485, F10483, F21746, F22388 and F36428, and justice.fr.
  - Repo files: `README.md`, `tests/scripts/verify-static-artifact.mjs`, `tests/unit/publishing-docs.test.ts`, `.github/workflows/deploy-ovh.yml`, `src/lib/sanity.ts`, `.planning/PROJECT.md`, quick 261004-kbq.
- **Secondary (MEDIUM):**
  - Sanity pricing via a summariser.
  - The Stripe requirements endpoint for France, which is Connect-oriented.
  - CNIL cookie exemptions via search extract, BOFiP/Légifiscal on art photographs, and La Poste Colissimo 2026 rates (single source).
- **Tertiary (LOW):**
  - OVH community threads on outbound HTTPS.
  - CCI Paris IDF, Lettre des réseaux and ecommerce-nation on the withdrawal function.
  - Summaries on mediation, GPSR, accessibility, loi Lang and image rights, SIRET lead-time articles, photographer store pages, and economie.gouv/DGCCRF snippets (HTTP 403).
- Per-claim sources are in the four source files.

---
*Research completed: 2026-10-04. Research, not legal or tax advice; professional review required before real sales.*
*Ready for roadmap: yes, after the owner decisions above and conflicts C1-C14 are confirmed.*
