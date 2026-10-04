# Technology Stack — v2.0 Boutique (stack additions only)

**Project:** Atelier Jacqueline Suzanne — milestone v2.0 "Boutique"
**Researched:** 2026-10-04
**Scope:** only what is NEW for shop + Stripe Checkout + delivery/VAT + sales legal pages. The existing stack (Astro 7 static, OVH Apache + SFTP, Sanity, GitHub Actions) is not re-researched and stays unchanged.
**Overall confidence:** MEDIUM-HIGH (platform limits and Stripe behaviour verified against official docs fetched 2026-10-04; items marked UNVERIFIED are listed in "Open verifications").

Confidence tags used below: **[HIGH]** official docs read in this session; **[MEDIUM]** official page read through a summariser, or official data plus inference; **[LOW]** community/third-party only; **[UNVERIFIED]** not confirmed, do not rely on it.

---

## 1. Decision summary (what to add)

| Need | Recommendation | Why (one line) |
|------|---------------|----------------|
| Server-side surface (create Checkout Session, receive Stripe webhooks, atomically re-validate/decrement stock) | **One Cloudflare Worker (free plan), separate `worker/` subproject, deployed with Wrangler from GitHub Actions** | Free, commercial-OK in practice, no VM cold start, encrypted secrets, official Stripe SDK ships a `worker` build, no change to OVH or DNS. |
| Stripe integration | **Stripe-hosted Checkout (redirect), Checkout Sessions API, `payment` mode, inline `price_data`, official `stripe` SDK 23.0.0 inside the Worker** | Lowest PCI/maintenance burden, FR+EN localised, Apple/Google Pay/Link built in, no Stripe.js on the static site. |
| Stock | **Stay in Sanity** (separate `inventory` doc type written only by the Worker, optimistic locking with `ifRevisionID`) | Already in CLAUDE.md; Sanity transactions are atomic and give a 409 on conflict. |
| Shipping | **Zone chosen on the site BEFORE Checkout; Worker builds `shipping_address_collection.allowed_countries` + one `shipping_rate_data` per zone** | Hosted Checkout cannot vary shipping rates by address (see section 4). |
| VAT | **Default: no Stripe Tax.** Prices stored tax-inclusive; optional fixed `tax_rates` IDs; Stripe Tax only if the accountant says it is needed | Stripe Tax is paid per transaction; Romane's VAT regime is not known yet (no tax advice here). |
| Browser to server | **Cross-origin `fetch` from the static OVH pages to the Worker's `*.workers.dev` URL, with a strict CORS allowlist** | A Cloudflare custom domain requires the DNS zone on Cloudflare (section 5); not worth the risk to the Zimbra mail DNS now. |
| Abuse control | **Cloudflare Turnstile (free) on the checkout call** | Stock-hoarding by repeated session creation is the main abuse risk for one-of-a-kind pieces. |

Recurring cost of the additions: **0 EUR/month**. Only cost cliffs: Cloudflare Workers Paid $5/month if the free CPU limit is ever hit (still inside the 0-5 EUR target), Sanity Growth $15/seat/month (avoid).

---

## 2. Where to run the server surface

### 2.1 Comparison (free tiers, cliffs, secrets, fit)

| Option | Free limits | Cliff / what happens at the limit | Cold start | Secrets | Branded URL on this DNS setup | Verdict |
|--------|-------------|-----------------------------------|-----------|---------|-------------------------------|---------|
| **Cloudflare Workers (Free)** | 100,000 requests/day; **10 ms CPU per invocation**; 50 subrequests/request; 128 MB; 100 Workers; 64 env vars/Worker, 5 KB each [HIGH: developers.cloudflare.com/workers/platform/limits/] | Over 100k/day: Error 1027 until midnight UTC (hard stop, no surprise bill). Paid plan = $5/month min, 10M requests + 30M CPU-ms included [HIGH: .../workers/platform/pricing/] | None in the VM sense: isolates "eliminate the cold starts of the virtual machine model" [HIGH: .../workers/reference/how-workers-works/] | Encrypted secrets via `wrangler secret put`, values never shown again; docs say never put sensitive data in plain vars [HIGH: .../workers/configuration/secrets/] | `workers.dev` only unless the whole DNS zone is on Cloudflare (Custom Domains need "an active Cloudflare zone") [HIGH: .../routing/custom-domains/] | **RECOMMENDED** |
| OVH-hosted PHP (extend `public/contact.php` pattern) | No metering on the existing free plan; PHP already runs (contact.php is live) | Outbound HTTPS from OVH mutualised hosting is **undocumented**: OVH community reports of blocked or timing-out outbound calls, "closed tap by tap, no documentation" [LOW: community.ovhcloud.com threads]; docs only state outbound is blocked in SSH sessions [MEDIUM: docs.ovhcloud.com hosting-technical-specificities] | None | No secret manager; secrets would be a PHP/config file written by the deploy job over SFTP | Same origin (`/api/*.php`): no CORS, no new account | **Fallback only, and only after a 30-minute spike** (section 7). If a `curl` to `api.stripe.com` and `<projectId>.api.sanity.io` works reliably from the real plan, it is a legitimate zero-new-vendor alternative; if not, it is dead. Worse DX: second language, no Wrangler-style local dev, Composer vendoring by CI. |
| Netlify Functions (Free) | 300 credits/month; compute = 10 credits per GB-hour; production deploy = 15 credits [HIGH: docs.netlify.com how-credits-work] | **Hard stop: all projects paused ("Site not available") when credits run out** [HIGH: same page]. Commercial use on Free: not stated on the pages read [UNVERIFIED] | Typical serverless cold starts [UNVERIFIED] | Dashboard env vars | Custom domain with SSL is on the free plan [MEDIUM: netlify.com/pricing]; a CNAME at the OVH DNS zone would work (inference) | Viable technically; worse than Cloudflare on cliff behaviour (credits shared with deploys) and unclear commercial terms. Second choice if a branded `api.` subdomain becomes mandatory. |
| Vercel Functions (Hobby) | 1M function invocations/month | Hobby "restricts users to non-commercial, personal use only" [HIGH: vercel.com/docs/plans/hobby] | n/a | n/a | n/a | **Excluded**: a shop is commercial use; Pro is $20/user/month. |
| Stripe Payment Links only (no server) | No server at all | No cart-level stock check, no stock sync to Sanity, shipping rate is fixed per link | n/a | none | n/a | **Fallback for a "sell the first original only" emergency**: a link can be limited in number of purchases ("limit the number of purchases", [HIGH: docs.stripe.com/payments/payment-links]). Does not satisfy CHK stock re-validation or sold-out display. Do not build the milestone on it. |
| Google Cloud Run, AWS Lambda, Firebase Functions, Supabase/Deno edge | Not researched in depth | Typically need a billing account/card on file and a separate console [UNVERIFIED] | varies | cloud secret managers | varies | **Not recommended**: extra vendor, billing-account risk, no advantage over Workers for three routes. |

### 2.2 Why Cloudflare Workers, specifically

1. **Cost shape fits the budget.** A one-artist shop will see tens to a few hundred calls per day, versus 100,000/day free. The limit that actually matters is **10 ms CPU per invocation**, not request count (see risk R1).
2. **Official SDK support.** `stripe@23.0.0` publishes `worker` and `workerd` export conditions; the Worker entry initialises a fetch-based HTTP client by default [HIGH: npm registry metadata + `esm/stripe.esm.worker.js` read]. Webhook verification must use the async variant `stripe.webhooks.constructEventAsync(...)` (SubtleCrypto) [HIGH: `esm/Webhooks.js`].
3. **Secrets handling.** Stripe recommends restricted API keys and a secrets vault, not source code [HIGH: docs.stripe.com/payments/account/activate]; Worker secrets satisfy that.
4. **Stripe webhooks need a public HTTPS URL** that answers quickly with 2xx; `*.workers.dev` is HTTPS with a valid certificate [HIGH: docs.stripe.com/webhooks].
5. **No change to production hosting.** `output: 'static'` stays; CLAUDE.md's rule "no `@astrojs/cloudflare`, no adapter, no Workers deploy CLI in the Astro project" is respected: the Worker is a separate deployable in its own subproject (same pattern as `sanity/`), not an Astro adapter.
6. **Commercial use on the free plan:** third-party sources say it is allowed; Cloudflare's pricing page does not address it [LOW/UNVERIFIED; check the Self-Serve Subscription Agreement before going live].

### 2.3 Risks specific to this choice

- **R1 - 10 ms CPU/request on Free [HIGH].** Instantiating the Stripe SDK and encoding a nested Checkout Session body is light, and HMAC verification runs natively, but this must be **measured** in the staging Worker (Wrangler logs report CPU time). Mitigation if exceeded: drop to plain `fetch` + manual HMAC (Stripe documents the manual verification steps, [HIGH: docs.stripe.com/webhooks] "Verify manually"), or take the $5/month plan.
- **R2 - `workers.dev` is described as "intended for personal or hobby projects that aren't business-critical"; Cloudflare recommends a Route/custom domain for production [HIGH: .../routing/workers-dev/].** Acceptable for a tiny shop whose URL is never shown to visitors; if it becomes a concern, move to Netlify/CNAME or move DNS to Cloudflare (section 5.3).
- **R3 - Sanity Free is a hard stop** (250k API requests/month, 1M CDN requests/month; no overage) [HIGH: sanity.io/pricing]. Worker traffic to Sanity (`useCdn:false` for stock reads and writes) counts as API requests. Cache availability responses (30-60 s) so a traffic spike cannot take Sanity, and therefore the Studio, offline.
- **R4 - Free-plan Sanity datasets are public only; private datasets need Growth** [MEDIUM: sanity.io/pricing + search]. See section 6: **no customer PII in Sanity, ever**.

---

## 3. Stripe integration approach

### 3.1 Checkout flavour

| Option | Verdict | Reason |
|--------|---------|--------|
| **Hosted Checkout (Checkout Sessions API, redirect)** | **Use** | Stripe's own table marks "Full page (Recommended)", maintenance "Low", full order summary with subtotal/tax/shipping, 15 brand settings [HIGH: docs.stripe.com/payments/checkout]. No Stripe.js, no PCI surface on the static site, no domain verification for wallets. |
| Embedded Checkout form | Skip | Labelled **Public preview** [HIGH: same page]; adds Stripe.js + client code to the static site for no gain. |
| Elements / custom | Skip | "Most" maintenance; you would own tax display, shipping, validation. |
| Payment Links | Skip as primary | No server-side stock logic (section 2.1). Fine as an emergency fallback only. |
| Stripe Managed Payments (merchant of record) | **Not applicable** | Documented for **digital products** ("SaaS, software, digital content"); custom domains unsupported [HIGH: docs.stripe.com/payments/managed-payments/how-it-works]. Romane sells physical goods. |

### 3.2 SDK vs plain `fetch` in the Worker

**Use the official SDK `stripe` 23.0.0** (released 2026-10-01, pins API version `2026-09-30.endive`, Node 20+ for Node builds) [HIGH: npm registry, CHANGELOG 23.0.0]. Rationale: nested form-encoding (`line_items[0][price_data][...]`, `shipping_options[0][shipping_rate_data]...`), typed responses, `idempotencyKey` option, `constructEventAsync`. Set `apiVersion` explicitly and create the webhook endpoint with the same API version so event payloads match the types (Stripe: the endpoint's version dictates event structure [HIGH: docs.stripe.com/webhooks]). It is a brand-new major; pin the exact version and read its changelog at install time; `22.x` is the fallback.

Fall back to plain `fetch` only if R1 (CPU) bites.

### 3.3 Session design (integration facts verified)

- **Prices inline**: `line_items[].price_data` with amounts read from Sanity by the Worker (never from the browser). No Stripe Product catalogue to keep in sync. Send `expectedUnitAmount` from the page and reject on mismatch (static page prices lag a publish by the CI run time).
- **Reservation window**: Stripe lets you set `expires_at` between **30 minutes and 24 hours**; default 24 h. Handle `checkout.session.expired` to return stock; `checkout.session.expired` is the documented hook for limited inventory [HIGH: docs.stripe.com/payments/checkout/managing-limited-inventory]. Use 30 minutes. Manual `POST /v1/checkout/sessions/{id}/expire` releases early (e.g. when the buyer lands on the cancel page).
- **Events to subscribe to (only these)**: `checkout.session.completed`, `checkout.session.expired`. Add `checkout.session.async_payment_succeeded/failed` only if delayed payment methods (SEPA debit, bank transfer) are enabled in the Dashboard; recommended: keep them off.
- **Webhook reliability**: signature check needs the **raw body** (`await request.text()`), default 5-minute tolerance; respond 2xx fast; live mode retries for up to **3 days** with exponential back-off, sandbox only three tries over a few hours; delivery can be duplicated and out of order, so dedupe by event ID [HIGH: docs.stripe.com/webhooks]. Dedupe via a Sanity `create` of `_id: "event.<evt_id>"` inside the same transaction as the stock change (a duplicate create fails the whole transaction, so the dedupe is atomic).
- **Locale**: pass `locale: 'fr' | 'en'` from the page language (default auto-detects the browser; override supported) [HIGH: support.stripe.com supported-languages].
- **CGV acceptance**: `consent_collection[terms_of_service]=required` shows a mandatory checkbox linking to the Terms-of-service URL set in the Dashboard's Public details; acceptance is recorded as `consent.terms_of_service = accepted` on the Session [MEDIUM: docs.stripe.com custom-components / Checkout docs via search]. Set the URL to the new CGV page (LEGAL-02).
- **Test before SIRET**: a Stripe account can be created and used in a **sandbox** before any business verification; live mode needs verification [HIGH: docs.stripe.com/payments/account/activate]. The whole milestone can be built and tested in sandbox.
- **Use a restricted key (`rk_...`)** for the Worker, with only the Checkout Sessions permissions it needs [HIGH: Stripe recommends restricted keys, same page].
- **Do not enable post-payment invoices** (`invoice_creation`) by default: invoice creation for one-time Checkout payments "is priced separately" (0.4% of total, max $2 per invoice) [HIGH: docs.stripe.com/receipts + stripe.com/fr/pricing]. Stripe's receipt emails are free; whether an invoice is legally needed is for the accountant.
- **Custom domain on Checkout costs $10/month** [HIGH: stripe.com/fr/pricing]: do not buy; customers see `checkout.stripe.com`.

### 3.4 Stripe account in France (what Stripe documents)

- Account country cannot be changed after activation; a French business must be in metropolitan France or an EEA French territory [HIGH: docs.stripe.com/payments/account/activate; support.stripe.com outlying territories].
- Live activation: verify the business in the Dashboard (business, product, relationship to the business), public details (business name + website URL, support email/phone/address, statement descriptor), bank account for payouts [HIGH: docs.stripe.com/payments/account/activate].
- Stripe's requirements endpoint (the data behind its "Required verification information" page) for **France / legal entity type `individual`** lists: merchant category code, website URL, first/last name, address, date of birth, phone, email, ToS acceptance, external account (IBAN). **No SIREN/SIRET field** appears; for entity type `company` it adds `company.tax_id` (SIREN) and `company.name/address/phone`. French entity types offered: `individual`, `company`, `non_profit` [MEDIUM: docs.stripe.com/_endpoint/get-requirements-for-setups, queried 2026-10-04; this dataset is written for Connect accounts, the Dashboard onboarding for a direct account may ask for more]. Stripe also states it "might request additional information" as use grows.
- **Implication for the project assumption "Stripe payouts require a SIRET":** Stripe's own table does not list a registration number for individuals in France. Whether Romane may legally sell regularly without registering is a legal/tax question outside Stripe and outside this research; the project can keep SIRET as a business prerequisite while the **sandbox build proceeds regardless**. Re-check at activation time what the Dashboard actually asks [UNVERIFIED for the Dashboard flow].
- Website expectations: Stripe's website-requirement and MCC-restriction endpoints return nothing for `card_payments` [HIGH: endpoints queried]; still, the receipts docs state legal business name, support address, support email and privacy policy URL are always required on receipts [HIGH: docs.stripe.com/receipts], which lines up with LEGAL-02/LEGAL-04 and the empty `publisherAddress` field.

### 3.5 Stripe fees (France standard pricing, no monthly fee)

| Item | Price | Source |
|------|-------|--------|
| EEA standard cards | 1.5% + 0.25 EUR | [HIGH: stripe.com/en-fr/pricing] |
| EEA premium cards | 2.8% + 0.25 EUR | same |
| UK cards | 2.5% + 0.25 EUR | same |
| International cards | 3.15% + 0.25 EUR (+2% currency conversion) | same |
| Dispute received | 20 EUR (countered fee refunded if won) | same |
| Refunds | Original processing fee is not returned | same |
| Setup / monthly fees | None | [HIGH: stripe.com/fr/pricing] |
| Worked examples | 45 EUR print, standard EEA card: 0.93 EUR (about 2.1%); 120 EUR original: 2.05 EUR (about 1.7%) | calculated |

---

## 4. Tax and shipping features Stripe itself offers

### 4.1 Shipping

| Capability | Fact | Source | Consequence |
|-----------|------|--------|-------------|
| Shipping rates | `shipping_options[].shipping_rate_data` (inline) or `shr_` IDs; fixed amount **for the whole order, cannot depend on item count**; optional `delivery_estimate`; only `payment` mode | [HIGH: docs.stripe.com/payments/during-payment/charge-shipping] | Compute the amount in the Worker (zone + weight tier from Sanity) and send ONE rate per Session. |
| Address collection | `shipping_address_collection[allowed_countries]` | same | Restrict to the countries of the zone the buyer chose. |
| Dynamic shipping by address | Not supported on the hosted page; only Embedded form or Elements | [HIGH: docs.stripe.com/payments/checkout/custom-shipping-options] | Hence: **zone selector on the site before Checkout** (FR / rest of EU, plus whatever the shipping research decides). |
| Tax on shipping | `tax_behavior` + `tax_code` on the rate (`txcd_92010001` Shipping, `txcd_00000000` Nontaxable) when using Stripe Tax | same | Only relevant if Stripe Tax is enabled. |

### 4.2 VAT mechanisms available (neutral, no advice)

| Mechanism | What it does | Cost | Notes |
|-----------|--------------|------|-------|
| **No tax object** | Amount charged = price; no tax lines | 0 | Fits a seller who charges no VAT; wording on prices/CGV is for the accountant. |
| **Fixed `line_items[].tax_rates`** | One Tax Rate ID (inclusive or exclusive) applied to every line | 0 | Create in Dashboard; the Worker can pick the ID per zone because the zone is known before Checkout. Reporting via Dashboard exports [HIGH: docs.stripe.com/payments/checkout/use-manual-tax-rates]. |
| `dynamic_tax_rates` | Match a rate to the buyer's address | 0 | **Deprecated** ("Use Stripe Tax or `line_items.tax_rates`"); Apple/Google Pay unavailable without shipping collection. Do not use. |
| **Stripe Tax (`automatic_tax[enabled]=true`)** | Calculates tax from address, product tax code, `tax_behavior`; **you must register with the tax authority and add the registration in Stripe**, otherwise it returns zero tax | Tax Basic: 0.5% per transaction (no-code) / 0.45 EUR per transaction (API) per the FR pricing page; Tax Complete from 80 EUR/month, 1-year contract [MEDIUM: stripe.com/fr/pricing via summariser; re-read the live page before choosing] | Adds 1%+ on a 45 EUR order. Recommend **off** unless the accountant requires per-destination EU VAT. [HIGH for behaviour: docs.stripe.com/tax/set-up, /payments/checkout/taxes] |

Prices should be stored in Sanity as integer cents **as displayed to the buyer** and sent with `tax_behavior: inclusive` when a tax rate applies, so that the displayed and charged totals cannot diverge.

---

## 5. How the static OVH site talks to the server surface

### 5.1 URL strategy

- Worker URL: `https://ajs-shop.<cloudflare-account-subdomain>.workers.dev` (one Worker per environment: `ajs-shop-staging`, `ajs-shop`). [HIGH: URL format from developers.cloudflare.com/workers/configuration/routing/workers-dev/]
- The Astro build reads it from **`PUBLIC_SHOP_API_URL`** (same pattern as the existing contact endpoint override; set as a GitHub Actions repository **variable**, not a secret, in `deploy-ovh.yml`'s build step). **Unset = read-only shop** (matches SHOP-* "shippable before any payment exists" and keeps checkout hidden until Romane has her activation).
- Stripe `success_url` / `cancel_url` point to static pages on `https://atelierjacquelinesuzanne.fr/...` (e.g. `/commande/merci/?session_id={CHECKOUT_SESSION_ID}`; the success page only displays a message, it must never be trusted as proof of payment: fulfilment is webhook-driven).
- Stripe webhook endpoint: `https://<worker>/webhook/stripe`.

### 5.2 CORS

- Allowlist **exact origins**: `https://atelierjacquelinesuzanne.fr`, `https://www.atelierjacquelinesuzanne.fr` (if www serves content), and `http://localhost:4321` only in the staging Worker. Echo the matching origin, add `Vary: Origin`, answer `OPTIONS` preflight, **no credentials/cookies**. Same pattern as the existing `contact.php` allowlist.
- CORS is not a security control (any non-browser client ignores it). Real controls: server-side price/stock validation, Turnstile token verification, Stripe signature verification on the webhook.
- The repo currently ships no CSP header (`public/.htaccess` has none), so no `connect-src` change is needed; if a CSP is added later, add the Worker origin.
- Progressive-enhancement option: a plain HTML `<form method="POST" action=".../checkout">` that the Worker answers with a `303` to the Stripe URL needs no CORS (top-level navigation). Useful for single-item "buy now"; a multi-item cart needs `fetch` + CORS.

### 5.3 Domain/subdomain implications (the "free OVH cannot attach subdomains" constraint)

- That constraint concerns **hosting multisite** (PROJECT.md Key Decision 2026-07-06). The **DNS zone** at OVH is separate: the v1.7 cutover already edited A/MX/NS there. A `CNAME` such as `api.atelierjacquelinesuzanne.fr` pointing at a third-party provider is therefore possible in principle [MEDIUM: inference from the cutover, not tested].
- **Cloudflare Workers Custom Domains need an active Cloudflare zone** and cannot be created on a hostname with an existing CNAME or on a zone you do not own [HIGH]. Using one would mean moving the domain's nameservers to Cloudflare and recreating A, MX, SPF/DKIM/DMARC and the Zimbra records exactly. **Do not do this for v2.0**: the benefit (a prettier API hostname nobody sees) does not justify touching the mail DNS that v1.7 proved byte-identical.
- Same-origin through OVH (`.htaccess` reverse proxy or a PHP proxy to the Worker) is **not recommended**: `mod_proxy` availability on the free plan and OVH outbound policy are both unverified [UNVERIFIED].
- Privacy/legal consequence (not advice): visitors' browsers will contact `*.workers.dev` (Cloudflare) and Stripe's hosted page; the privacy notice and processor list should name them, and Turnstile (if used) should be assessed against the existing CNIL consent banner [UNVERIFIED: whether Turnstile needs consent].

---

## 6. Recommended stack (the table the roadmap should copy)

### Core additions

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Cloudflare Workers (Free plan) | platform; `compatibility_date` 2026-08-04 or later (that date enables `nodejs_compat` by default) [HIGH: developers.cloudflare.com/workers/runtime-apis/nodejs/] | Runs `POST /checkout`, `POST /webhook/stripe`, `GET /availability` | Section 2 |
| Wrangler | 4.147.0 (npm, checked 2026-10-04) | Local dev (`wrangler dev`), secrets, deploy | Official toolchain |
| `stripe` (Node SDK, worker build) | 23.0.0 (exact pin) | Create Checkout Sessions, verify webhooks (`constructEventAsync`) | Section 3.2 |
| `@sanity/client` | 7.23.0 (same exact pin as the root project; npm latest is 8.9.0, upgrade root and Worker together or not at all) | Read inventory/products, transactional writes with `ifRevisionID` | Reuse; Worker bundle stays small |
| Stripe Dashboard (sandbox first) | n/a | Account, restricted key, webhook endpoint, Terms-of-service URL, receipts, payment-method toggles | Free; sandbox needs no business verification |
| Cloudflare Turnstile | free: 20 widgets/account, 10 hostnames/widget, unlimited verifications, works on non-Cloudflare sites [HIGH: developers.cloudflare.com/turnstile/plans/ and /turnstile/] | Bot gate on `POST /checkout` | Prevents hoarding one-of-a-kind stock |

### Data (stays in Sanity, no new database)

| Item | Detail | Why |
|------|--------|-----|
| New document type `inventory` (one per product/variant) | Written **only** by the Worker; hidden or read-only in Studio; holds quantity and active reservations | If stock lived on the editable `edition`/product document, Romane publishing a Studio edit would overwrite the live stock with the draft's stale copy. A separate doc type avoids that. |
| Atomicity | Sanity transactions are all-or-nothing; patches accept `ifRevisionID` and a conflicting write gets `409 Conflict`; the documented pattern for stock is read (capture `_rev`), write with `ifRevisionID`, retry on 409 [HIGH: sanity.io/docs/content-lake/transactions] | This is the "atomic re-validation" requirement, with no extra service (CLAUDE.md "What NOT to use" respected). |
| **No PII in Sanity** | Orders, addresses, emails live in Stripe only | Free-plan datasets are public-only [MEDIUM]; anything written is readable via the public API. Reservation/event docs must hold IDs and quantities only. |
| Deploy webhook | The existing Sanity webhook filters on a **type allowlist** (README "Sanity webhook"); `inventory` must stay out of it so a sale never triggers a full CI + OVH deploy. `tests/unit/publishing-docs.test.ts` locks the filter to `sanity/schemas/`, so adding the doc type requires an explicit "excluded from deploy trigger" entry in that test. Free plan allows 2 webhooks and both are in use (README); do not plan on a third. | Avoids a CI run per checkout attempt. |
| Sold-out display on static pages | `GET /availability` from the Worker with `Cache-Control: max-age=30`; the page hydrates the buy button state. Checkout re-validates anyway | Static HTML cannot know about a sale made after the last build. |

### Secrets and where they live

| Secret | Location | Notes |
|--------|----------|-------|
| `STRIPE_SECRET_KEY` (restricted `rk_`) | Worker secret (`wrangler secret put`) | Sandbox key in `staging`, live key in production only after activation |
| `STRIPE_WEBHOOK_SECRET` (`whsec_`) | Worker secret | Different per endpoint and per mode |
| `SANITY_WRITE_TOKEN` | Worker secret | A dedicated token, distinct from `SANITY_API_READ_TOKEN` and `SANITY_AUTH_TOKEN`. Free-plan token roles: README implies Viewer/Editor/Deploy are selectable [UNVERIFIED]; custom per-type scoping is not available, so an Editor token can write the whole dataset: treat as high value, rotate. |
| `TURNSTILE_SECRET_KEY` | Worker secret | Site key is public (in the page) |
| `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` | GitHub Actions secrets | Used by `cloudflare/wrangler-action@v4` [HIGH: developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/] |
| `PUBLIC_SHOP_API_URL`, Turnstile site key | GitHub Actions variables, baked into the static build | Public by design |

### Environments (pre-SIRET plan)

Two Workers from one `wrangler.jsonc` (`env.staging`, default production): **staging = Stripe sandbox + a second Sanity dataset `staging`** (Free allows 2 datasets; production uses one) so test purchases never decrement real stock; **production = live keys, deployed only after activation**. Alternative if a second dataset is unwanted: ignore `livemode: false` events for stock and run sandbox against a separate `inventory` namespace. Production site keeps `PUBLIC_SHOP_API_URL` unset (read-only) until sales open.

### Supporting libraries

| Library | Version | Purpose | When to use |
|---------|---------|---------|-------------|
| `typescript` | ^5.9.3 (same as root) | Worker typing; use `wrangler types` to generate Worker env types rather than adding `@cloudflare/workers-types` | Always |
| `vitest` | 4.1.9 (same as root) | Unit-test pure handler logic (price/zone/stock functions, with mocked `fetch`) | Always; keep handlers as pure functions so no Workers test pool is needed |
| `@cloudflare/vitest-pool-workers` | 0.22.0 (peer `vitest ^4.1`, compatible with the root pin) | Run tests inside workerd | Only if a runtime-specific bug appears; not by default |
| `zod` | 4.6.5 | Validate the `/checkout` JSON body | Optional; hand-written validation is also fine for one route |

### Installation (inside a new `worker/` subproject, like `sanity/`)

```bash
cd worker
npm init -y            # then set "type": "module", "private": true
npm install --save-exact stripe@23.0.0 @sanity/client@7.23.0
npm install -D wrangler@4.147.0 typescript@^5.9.3 vitest@4.1.9
npx wrangler secret put STRIPE_SECRET_KEY --env staging
npx wrangler secret put STRIPE_WEBHOOK_SECRET --env staging
npx wrangler secret put SANITY_WRITE_TOKEN --env staging
npx wrangler secret put TURNSTILE_SECRET_KEY --env staging
# local webhook testing (Stripe CLI v1.43.3+ per docs)
stripe listen --forward-to localhost:8787/webhook/stripe
```

---

## 7. Alternatives considered

| Category | Recommended | Alternative | Why not |
|----------|-------------|-------------|---------|
| Server surface | Cloudflare Worker | OVH PHP | Outbound policy undocumented; no secret store; worse DX. **Keep as a 30-minute spike** (a `ping.php` that curls `https://api.stripe.com/v1` and `https://gwz8iug4.api.sanity.io`); if it works, the roadmap may choose it to avoid a new vendor. |
| Server surface | Cloudflare Worker | Netlify Functions | Credit pool shared with deploys, hard stop pauses everything, commercial terms unverified. |
| Server surface | Cloudflare Worker | Vercel | Hobby is non-commercial only (HIGH). |
| Checkout | Hosted Checkout | Payment Links | No stock logic or sold-out sync. |
| Checkout | Hosted Checkout | Embedded Checkout / Elements | Preview / heavy maintenance, adds Stripe.js to the static site. |
| Merchant model | Own account + Checkout | Managed Payments (MoR) | Digital products only. |
| Tax | Fixed `tax_rates` or none | Stripe Tax | Per-transaction fee, registration prerequisite, regime unknown. |
| Domain | `workers.dev` | Move DNS to Cloudflare for a custom domain | Risk to Zimbra mail DNS for a cosmetic gain. |
| Stock store | Sanity `inventory` docs | D1/KV/Durable Objects | Extra service, contradicts CLAUDE.md; Sanity transactions already give atomicity. |
| Worker framework | Plain `fetch` handler + `URL.pathname` switch (3 routes) | Hono (4.13.13) / itty-router | A dependency with no payoff at this size. |

## 8. What NOT to add

- No `@astrojs/cloudflare`, Node adapter, SSR, or Astro "server islands": the site stays `output: 'static'`.
- No `@stripe/stripe-js` (10.0.0) or Stripe Elements: hosted redirect needs neither.
- No Stripe Tax, Managed Payments, Checkout custom domain ($10/month), or post-payment invoices unless a decision explicitly changes (all cost money or do not apply).
- No second database (D1, KV, Postgres) and no order storage in Sanity.
- No cart/SaaS shop widget (monthly fee, defeats the point of the project).
- No Stripe secret, webhook secret or Sanity write token in the Astro project, `.env.example` values, the `dist/` artifact or GitHub Pages-style public config; extend `test:artifact` with a scan for `sk_`, `rk_`, `whsec_` patterns.

## 9. Open verifications (before or inside the phases)

1. **R1 CPU**: measure CPU time of `POST /checkout` and the webhook in the staging Worker against the 10 ms free limit [UNVERIFIED].
2. **OVH outbound spike** (optional, 30 min) to decide whether PHP is a viable fallback [UNVERIFIED].
3. **Sanity Free: Editor-role API token availability** and exact per-token permissions [UNVERIFIED].
4. **Stripe Dashboard onboarding for a French individual**: what it actually asks (SIRET? documents? payout hold?) [UNVERIFIED for the Dashboard; MEDIUM for the requirements endpoint].
5. **Stripe Tax Basic live price** and whether API-created Checkout Sessions use the 0.45 EUR or the 0.5% line [MEDIUM].
6. **Cloudflare free-plan commercial use** in the Self-Serve Subscription Agreement [UNVERIFIED].
7. **Turnstile vs CNIL consent**: assess with the legal pages work [UNVERIFIED].
8. `www.` host behaviour (does it redirect or serve?) to decide the CORS allowlist [UNVERIFIED].
9. VAT regime, invoice obligation, shipping zones, CGV wording: accountant/legal (explicitly out of scope for this project's research).

## Sources

Official (read 2026-10-04):
- Cloudflare: https://developers.cloudflare.com/workers/platform/limits/ , /workers/platform/pricing/ , /workers/reference/how-workers-works/ , /workers/configuration/secrets/ , /workers/configuration/routing/custom-domains/ , /workers/configuration/routing/workers-dev/ , /workers/runtime-apis/nodejs/ , /workers/ci-cd/external-cicd/github-actions/ , /turnstile/ , /turnstile/plans/ , /workers/runtime-apis/bindings/rate-limit/ (eventually consistent, not an accounting system)
- Stripe docs: https://docs.stripe.com/payments/checkout , /payments/payment-links , /payments/during-payment/charge-shipping , /payments/checkout/custom-shipping-options , /payments/checkout/managing-limited-inventory , /payments/checkout/taxes , /payments/checkout/use-manual-tax-rates , /tax/set-up , /payments/managed-payments/how-it-works , /webhooks , /receipts , /payments/account/activate , /sdks/versioning , /connect/required-verification-information (data endpoints `_endpoint/get-requirements-for-setups`, `get-requirement-selections-for-platform-country`)
- Stripe pricing: https://stripe.com/fr/pricing , https://stripe.com/en-fr/pricing ; https://support.stripe.com/questions/supported-languages-for-stripe-checkout-and-payment-links
- Sanity: https://www.sanity.io/pricing , https://www.sanity.io/docs/content-lake/transactions
- Netlify: https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/ , https://www.netlify.com/pricing/
- Vercel: https://vercel.com/docs/plans/hobby
- OVH: https://docs.ovhcloud.com/fr/guides/web-cloud/web-hosting/hosting-technical-specificities.md ; community threads (LOW) https://community.ovhcloud.com/t/acces-web-services-externes/14191
- npm registry (versions 2026-10-04): stripe 23.0.0, wrangler 4.147.0, @sanity/client 8.9.0 (repo pin 7.23.0), hono 4.13.13, zod 4.6.5, @cloudflare/vitest-pool-workers 0.22.0, @stripe/stripe-js 10.0.0; stripe-node 23.0.0 CHANGELOG and `esm/` sources via unpkg/raw.githubusercontent.com.
- Repo facts: `/home/user/atelier-jacqueline-suzanne/README.md` (Sanity webhook table), `public/.htaccess`, `public/contact.php`, `astro.config.mjs`, `.planning/PROJECT.md`, `CLAUDE.md`.
