# Architecture Research: v2.0 "Boutique" (shop, Stripe checkout, stock, orders)

**Domain:** small-catalogue art shop bolted onto an existing static Astro 7 + Sanity + OVH site
**Researched:** 2026-10-04
**Overall confidence:** MEDIUM-HIGH (Sanity and Stripe semantics verified against official docs; hosting prerequisites for the compute surface are flagged UNVERIFIED and need two short spikes)

Scope: only what the NEW features need. The existing architecture (static build, `buildXModel()` page models, `sanity.ts` + `sanity-validation.ts`, the two workflows) was read from the repo, not re-researched. Confidence tags: **[HIGH]** official doc fetched, **[MED]** official doc partially confirms or secondary source, **[UNVERIFIED]** reasoning or community report only, needs a spike.

---

## 0. Verdict in ten lines

1. **Product model = new `product` document that references `edition`** (never the reverse). `sanity/schemas/edition.ts` is NOT touched: `tests/scripts/verify-static-artifact.mjs` scans that file for commerce tokens (`prix`, `price`, `stock`, `disponib*`, `€`, ...) and fails the build (EDN-06). The same guard scans every built HTML file under a path containing `editions/`.
2. **Stock lives in its own `stock` document type with `liveEdit: true`**, one doc per SKU, id `stock-<sku>` (no dot, so it is publicly readable). Never a field on the draftable `product` doc: publishing a draft copies the draft over the published doc, which would silently overwrite a decremented quantity [HIGH, Sanity drafts doc].
3. **A small server-side surface is unavoidable** (create Checkout Session, receive Stripe webhook). Recommended: a **separate `shop-api/` TypeScript subproject deployed as a Cloudflare Worker (free tier)**, same pattern as the existing `sanity/` subproject. Fallback: PHP on the OVH host (same origin, but CI-blind and two prerequisites unverified, see section 9). No Astro adapter is installed either way, so `astro.config.mjs` and the "static-only" statement in CLAUDE.md stay true.
4. **Availability is solved in three layers, not one**: (L1) static HTML shows the build-time state, rebuilt through a *second* Sanity webhook when `stock.onHand` changes; (L2, optional) a tiny browser script reads live `onHand` straight from Sanity's public API CDN (no custom availability endpoint); (L3, mandatory, authoritative) the checkout endpoint re-validates and reserves atomically. Do NOT build a custom live-availability endpoint.
5. **Reserve-then-pay**: checkout first writes an expiring *hold* onto the stock doc (optimistic lock with `ifRevisionID`), then creates a Stripe session with `expires_at` just under the hold's expiry. `checkout.session.completed` runs ONE Sanity transaction that decrements `onHand`, removes the hold and `create`s the order doc with a deterministic id. Because `create` fails when the id exists and transactions are all-or-nothing, a replayed webhook cannot double-decrement [HIGH].
6. **Orders = Sanity docs with a dotted id (`order.<stripeSessionId>`)**, which Sanity keeps private even in a public dataset [HIGH, Sanity IDs doc]. Free plan has no private datasets, so this is the cheap way to hold order data. Romane works from a "Commandes" list in the Studio she already uses; Stripe stays the payment system of record.
7. **Print masters never enter Sanity (public dataset), `public/`, `dist/` or git (the repo is public).** v2.0 default: masters stay on Romane's own storage; product variant carries only a file *name* label. A private bucket with signed links is a deferred option.
8. **Test mode and live mode are two deployments** of the same Worker with separate secrets, and the test deployment uses a second Sanity dataset (`staging`; Free plan allows 2 datasets, public only [MED]). Test purchases never touch production stock.
9. **Read-only catalogue ships first with zero server code**: `product` + `stock` + `shopSettings` schemas, `/boutique/` pages, nav item, sitemap, second webhook. Build order in section 14.
10. **New browser code never imports `src/lib/sanity.ts`** (it holds the build token and throws without env). The live-availability script uses a 20-line standalone `fetch`.

---

## 1. System overview

```
                         VISITOR BROWSER
      ┌─────────────────────────┬──────────────────────────┬────────────────────────┐
      │ (a) pages + assets      │ (b) live stock (optional) │ (c) "Buy" form POST     │
      ▼                         ▼                          ▼                        │
┌───────────────┐   ┌─────────────────────┐   ┌──────────────────────────┐        │
│ OVH Apache    │   │ Sanity API CDN      │   │ shop-api Worker (NEW)    │        │
│ static dist/  │   │ public dataset      │   │  POST /checkout          │        │
│ (unchanged    │   │ read-only GROQ,     │   │  POST /stripe-webhook    │        │
│  host, SFTP)  │   │ CORS allow-listed   │   │  GET  /health            │        │
└──────▲────────┘   └─────────▲───────────┘   └───┬──────────────┬───────┘        │
       │ SFTP upload          │ reads             │ mutate/read  │ create session │
       │                      │                   ▼              ▼                │
┌──────┴──────────────────────┴──────────────────────────┐   ┌───────────────────┐│
│                SANITY CONTENT LAKE (single source)      │   │ STRIPE            ││
│ product, shopSettings (draft/publish, public)           │   │ hosted Checkout   ││
│ stock-<sku> (liveEdit, public)   <-- stock truth        │◄──┤ webhooks ─────────┘│
│ order.<sessionId> (liveEdit, PRIVATE: dotted id)        │   │ (test + live       │
└──────┬──────────────────────────────────────────────────┘   │  endpoints)        │
       │ webhook #1 (content types)    webhook #2 (stock.onHand changed)            │
       ▼                                                      └────────────────────┘
┌──────────────────────────────┐        ┌───────────────────────────────────┐
│ GitHub Actions deploy-ovh.yml│        │ ROMANE: Sanity Studio             │
│ build + gates + SFTP to OVH  │        │ products, stock levels, Commandes │
└──────────────────────────────┘        └───────────────────────────────────┘
```

Why this shape: the only request-time computation the shop needs is (1) "reserve + create session" and (2) "receive paid event, write order + decrement". Everything else (catalogue, prices display, legal pages, success page) stays static. Sanity is already the only mutable store the project owns, and its mutation API gives atomic transactions plus optimistic locking, so no separate database is needed (consistent with CLAUDE.md "What NOT to use").

### Component responsibilities

| Component | Responsibility | Status |
|---|---|---|
| `sanity/schemas/product.ts` | Editorial + commercial definition: kind, text, photos, variants (sku, price, stock policy) | NEW |
| `sanity/schemas/stock.ts` | Per-SKU quantity + expiring holds; `liveEdit: true`; id `stock-<sku>` | NEW |
| `sanity/schemas/order.ts` | Private order record + fulfilment status; `liveEdit: true`; id `order.<sessionId>` | NEW |
| `sanity/schemas/shopSettings.ts` | Singleton: `salesOpen` kill switch, shipping zones/rates (SHIP), copy | NEW |
| `shop-api/` (Worker) | `/checkout`, `/stripe-webhook`, `/health`; pure core module + thin adapters | NEW |
| `src/pages/boutique/*`, `src/pages/en/boutique/*` | Thin locale adapters (index, `[slug]`, `merci`) | NEW |
| `src/lib/shop-models.ts` | Pure `buildShopIndexModel`, `buildProductDetailModel` (no fetch, no browser) | NEW |
| `src/components/Shop*.astro`, `BuyBox.astro` | Catalogue grid, product body, buy form | NEW |
| `src/client/shop-availability.ts` | Optional L2 live-stock script, standalone fetch | NEW |
| `src/lib/sanity.ts`, `sanity-validation.ts` | `Product`/`Variant`/`StockInfo`/`ShopSettings` types, queries, sanitizers | MODIFIED |
| Webhook #2 in Sanity dashboard | stock change triggers the existing deploy dispatch | NEW (dashboard config) |

---

## 2. Product content model (Sanity)

### Relation to `edition` and the EDN-06 guard (hard constraint)

`verify-static-artifact.mjs` does two things relevant here (read from the repo):

- scans every `dist/**/editions/**/*.html` (markup only, script/style stripped) for `prix`, `price`, `acheter`, `buy`, `panier`, `cart`, `stock`, `épuisé` (whole words) plus `disponib*`/`availab*` stems and `€`/`$`;
- scans the source text of `sanity/schemas/edition.ts` for the same tokens.

Consequences, all deliberate:

- Price, stock and variants cannot be added to `edition.ts`. A `product` of `kind: 'book'` carries `relatedEdition -> edition` (same unidirectional pattern as `gallery.relatedEdition` / `edition.relatedGallery`). `edition.printRun` stays the showcase fact; inventory is `stock.onHand`. A soft Studio warning if initial stock exceeds `printRun` is a cheap nicety.
- An édition page can discover its products with a reverse GROQ (`*[_type=="product" && references(^._id)]`) without any change to the édition document. The link on the édition page must be commerce-neutral ("Voir en boutique" / "See in the shop": none of these words are in the token list) and must not show price or availability. If the owner later wants price on édition pages, the guard has to be changed *on purpose* (and its UI-SPEC contract), not worked around.
- `/boutique/...` is outside the `editions` path filter, so product pages are free to show prices.

### `product` (draft/publish, orderable, mirrors `edition` conventions)

| Field | Type | Notes |
|---|---|---|
| `publicationStatus` | `preparation \| published \| archived` | Same 3-state workflow and radio UI as `edition`/`gallery`; build filter identical in spirit (`publicationStatus == "published"`) |
| `title` | string | Proper noun shared across locales (same rationale as edition D-08) |
| `slug` | slug (source `title`) | Required |
| `kind` | `print \| original \| book \| merch` | Enum for display/filtering only; no logic may assume one kind (PROJECT.md: products undecided) |
| `description` | localeText fr+en, max length like `statement` | Reuse `localeTextField` |
| `images[]` | same image member as `edition.images` (alt fr/en, `rights`) | Web images only (<= 2400 px). Reuse the existing validator; consider extracting a shared `imageArrayField` helper in `sanity/schemas/lib/` rather than a third copy |
| `relatedEdition` | reference -> `edition` (optional) | Reverse of nothing: product -> edition only |
| `relatedGallery` | reference -> `gallery` (optional) | e.g. a print of a gallery photo |
| `variants[]` | array of objects, **min 1** | The purchasable unit. See below |
| `orderRank` | hidden, `orderRankField({type:'product'})` | Drag-reorder like edition/gallery (`@sanity/orderable-document-list` already installed) |

Variant object (every sellable thing is a variant; a single original has one variant, so there is exactly one code path):

| Field | Type | Notes |
|---|---|---|
| `_key` | auto | |
| `sku` | string, required, regex `^[a-z0-9][a-z0-9-]*$`, globally unique | Join key to `stock-<sku>`. **Immutable after first publish** (stock id derives from it); enforce with a description + a custom validator comparing to the published doc |
| `label` | localeString (optional) | e.g. "30 x 40 cm", "Exemplaire signé" |
| `priceCents` | integer > 0, required | Money as integer minor units; currency fixed `eur` (add `currency` only if a second currency is ever required) |
| `stockPolicy` | `unique \| limited \| untracked` | `unique`: max 1 ever, flips to sold. `limited`: counted. `untracked`: made to order / no limit (no stock doc, no holds) |
| `printMasterRef` | string (optional) | A file NAME or short note only, never a URL or path to a bucket (public dataset, see section 7) |
| `shippingClass` | string (optional, enum owned by SHIP phase) | Placeholder so the SHIP phase does not need a data migration |

Prices live in Sanity and are re-read **server-side at checkout**. Stripe receives inline `line_items[].price_data` + `product_data`; no Stripe Product/Price catalogue is mirrored, so there is no second catalogue to keep in sync [HIGH: `price_data` and `shipping_rate_data` shown in Stripe's "Charge for shipping" page examples].

### `stock` (`liveEdit: true`, one doc per SKU)

```ts
// sanity/schemas/stock.ts (sketch)
defineType({
  name: 'stock', type: 'document', liveEdit: true,
  fields: [
    defineField({name: 'sku', type: 'string', readOnly: true}),
    defineField({name: 'product', type: 'reference', to: [{type: 'product'}], weak: true}), // weak: does not block product deletion
    defineField({name: 'onHand', type: 'number', validation: (r) => r.integer()}),        // allow negative: it is the oversell alarm
    defineField({name: 'holds', type: 'array', readOnly: true, of: [{type: 'object', fields: [
      {name: 'qty', type: 'number'}, {name: 'expiresAt', type: 'datetime'}]}]}),         // _key = holdId
  ],
})
```

- `_id = stock-<sku>` (no dot) so the browser can read `onHand` from the public API CDN [HIGH: only dotless ids are public].
- `holds[]._key` is a random holdId. **No Stripe session id and no customer data in holds** (the doc is public).
- `liveEdit: true` disables drafts for the type, so Romane's edit applies immediately and cannot be overwritten by a stale draft [HIGH].
- Creation: error-prone to do by hand (`_id` must equal `stock-<sku>`). Provide a Studio **document action on `product`** ("Créer les lignes de stock") that runs `createIfNotExists({_id:'stock-'+sku, _type:'stock', sku, onHand: initial})` per variant. `createIfNotExists` is idempotent [HIGH]. Alternative if the action is too much Studio code: seed lazily in the Worker on first checkout (but then Romane cannot see the line before the first sale, so prefer the action).
- Studio structure (`sanity/schemas/structure.ts`): a "Stock" list with preview `sku · onHand` and a filter "stock négatif" (`onHand < 0`).

### `shopSettings` (singleton, same pattern as `siteSettings` in `structure.ts`)

`salesOpen` (boolean, default false; the SIRET gate), `closedMessage` (localeText), shipping zones and rates and the VAT note (owned by the SHIP phase; leave the shape to that phase). `salesOpen` is read both at build time (hide/show buy UI) and **live by the Worker** at checkout, so flipping it off is an authoritative kill switch even while static pages are stale.

### Mirrors required in the root project (repo convention)

The two npm projects cannot import each other, so shared constants are mirrored with a unit test guarding drift (`PUBLISHER_ADDRESS_MAX_LENGTH` precedent). Do the same for: variant `sku` regex, `stockPolicy` values, hold TTL minutes (Studio never uses the TTL, only Worker + a doc comment).

---

## 3. Keeping a statically built catalogue correct about availability

Static pages only know stock at build time; a sale between builds makes them lie. Recommendation: **L1 + L3 at first sale, L2 as an enhancement, never a custom endpoint.**

| Layer | Mechanism | Fixes | Does not fix |
|---|---|---|---|
| **L1 Rebuild on stock change** | Sanity webhook #2, filter `_type == "stock" && delta::changedAny(onHand)`, same GitHub `repository_dispatch` target and projection as webhook #1 | HTML, JSON-LD offers, "plus que 2 exemplaires" copy, no-JS visitors, SEO; converges within one deploy (~6 min per README) | The 6-minute window; every visitor in it sees stale state |
| **L2 Live read in the browser** | `src/client/shop-availability.ts` fetches `https://<projectId>.apicdn.sanity.io/v2024-01-01/data/query/<dataset>?query=*[_type=="stock" && sku in $skus]{sku,onHand}&$skus=[...]` and flips the button/badge. Needs the site origin added in Sanity CORS settings, **without** "allow credentials" [HIGH: public reads need no token; CORS configured per origin] | Stale buttons for visitors with JS | Holds (ignored on purpose, see below); not authoritative |
| **L3 Authoritative check at checkout** | Worker reads fresh stock with the non-CDN API, subtracts live holds, then reserves with `ifRevisionID` | Everything correctness-related | n/a: this IS the guarantee |

Decisions inside this:

- **Why not a custom `/availability` endpoint:** `onHand` is already public data in a public dataset; the Worker would just proxy it, adding cost, a CORS surface and a second place where "available" is computed. CDN requests are a separate 1M/month free quota from the 250k API requests [MED, pricing page summarised].
- **Why webhook #2 and not adding `stock` to webhook #1:** webhook #1 fires on *any* create/update/delete of its listed types. `stock` docs are mutated by every hold (insert and release) and every sale; including the type there would rebuild+deploy on every checkout *start*. Hold mutations do not change `onHand`, so `delta::changedAny(onHand)` ignores them [HIGH: delta functions are supported in webhook filters; exact expression to be validated in the webhook tester: UNVERIFIED]. A manual restock by Romane (also an `onHand` change) rebuilds too, which is wanted. Sanity Free allows 2 webhooks; after the README "Switching over" step only one is in use [HIGH, README + pricing].
- **Rebuild noise cap:** `deploy-ovh.yml` already serialises runs in the `ovh-production` concurrency group (one running, one pending, latest wins). At a handful of sales per month this is negligible. If rebuild volume ever becomes a concern, tighten webhook #2 to "only when crossing zero" (`(before().onHand > 0) != (after().onHand > 0)`, expression UNVERIFIED); that is only acceptable if the catalogue does not display exact remaining counts. The default keeps counts fresh.
- **Holds are deliberately invisible to L1/L2.** A visitor may see "disponible" while someone else holds the last original for up to ~36 min. The checkout then answers "temporarily reserved, try again in a few minutes". This is the honest UX for hold-based reservation.
- **Stale-after-publish nuance (cosmetic):** the existing build client already uses the non-CDN API when a token is present (`useCdn: !token` in `src/lib/sanity.ts`), so a webhook-triggered build reads fresh stock [HIGH, repo]. Sanity says the uncached API "will always give you the freshest data" and recommends it for integrations [HIGH].
- **Baked state is a hint, not a promise.** The build-time badge copy should read as state ("Épuisé" / "Disponible") but the buy action must never be *enabled only* by static HTML: the form posts to the Worker, which decides.

---

## 4. Single source of truth for stock and atomic decrement

**Truth = `stock-<sku>` in Sanity.** Stripe does not manage inventory (confirmed: its "manage limited inventory" guide only offers `expires_at` and the `checkout.session.expired` event for releasing reserved items [HIGH]).

State per SKU: `onHand` (physically sellable units not yet paid) and `holds[]` (units promised to open checkouts). `available = onHand - sum(qty of holds with expiresAt > now)`.

### Reserve (inside `POST /checkout`)

```
1. parse + bound input: items[] (sku, qty<=cap), zone/country, locale   [reject >20 items etc.]
2. GET shopSettings, products (published) -> price, name, stockPolicy        (API, NOT CDN)
   reject if !salesOpen | product not published | sku unknown
3. for each tracked sku (unique|limited): GET stock-<sku> with _rev       (API, NOT CDN)
   available = onHand - active holds ; reject 409 "unavailable|reserved" if qty > available
   (unique => qty must be 1)
4. holdId = uuid ; expiresAt = now + 36 min
   TRANSACTION (all-or-nothing):
     for each sku: patch stock-<sku>
        .ifRevisionId(rev)                         // optimistic lock
        .unset(expiredHoldKeys.map(k => `holds[_key=="${k}"]`))  // lazy prune; keys computed from the doc read in step 3
        .insert('after','holds[-1]', [{_key:holdId, qty, expiresAt}])
   on 409 Conflict -> re-run steps 3-4 (max 3 tries) -> else 409 "busy, retry"
5. create Stripe Checkout Session:
     mode=payment, line_items[].price_data (eur, unit_amount FROM SANITY),
     client_reference_id=holdId, metadata{holdId, cart:"sku:qty,..."},
     expires_at = now + 31 min   (Stripe: 30 min .. 24 h after creation)
     shipping_address_collection.allowed_countries + shipping_options[].shipping_rate_data (from zone),
     success_url/cancel_url built from env SITE_URL (never from request input)
   if Stripe fails -> TRANSACTION unset holds[_key==holdId] (best effort; TTL heals otherwise)
6. respond 303 Location: session.url
```

Notes:

- **Hold first, session second.** The opposite order can leave a payable session with no hold (oversell). A crash between the two leaves an orphan hold that expires by TTL (self-healing, no cron needed). OVH/Workers cron is not required.
- **Hold expiry = session expiry + ~5 min buffer.** Stripe documents that after expiry "a customer can't complete a Checkout Session" [HIGH, expire endpoint doc], so a paid session always has a live hold unless a person deleted it.
- **Expired-hold pruning** is lazy: whoever next reserves that SKU unsets expired entries by `_key` in the same patch (keys computed from the doc read in step 3). Availability math ignores expired holds, so un-pruned ones are harmless.
- **Optimistic lock semantics:** a patch with `ifRevisionID` is only accepted if the revision matches; on mismatch Sanity "will reject with 409 Conflict" [HIGH, transactions page]. The mutation reference summary elsewhere says 400 for invalid requests, so treat **409 as retryable and any other 4xx as fatal**, and confirm the exact status in the spike [MED].
- **Atomicity:** "either all of the mutations succeed or they all fail" [HIGH]. A multi-SKU cart is therefore one transaction.
- **Unique original** needs no special code: `stockPolicy: unique` means `qty` must be 1 and `onHand` starts at 1; the optimistic lock makes two simultaneous buyers race and exactly one wins the hold.

### Complete (inside `POST /stripe-webhook`), idempotent

```
1. raw = await request.text()          // NOT request.json(): signature needs the exact raw body [HIGH]
   event = stripe.webhooks.constructEventAsync(raw, sig, WEBHOOK_SECRET, undefined, SubtleCryptoProvider)
   bad signature -> 400
   guard: event.livemode must match this deployment's mode, else 400
2. switch (event.type):
   'checkout.session.completed' | 'checkout.session.async_payment_succeeded':
        s = GET session (expand line_items) from Stripe                      // Stripe fulfilment guide
        if s.payment_status !== 'paid' -> 200 (wait for the async event)     // only act on paid
        TRANSACTION:
          create { _id:'order.'+s.id, _type:'order', status:'paid', lines, amounts, ... }   // FAILS if id exists
          for each tracked sku in metadata.cart:
             patch stock-<sku>  .unset(['holds[_key=="'+holdId+'"]'])  .dec({onHand: qty})   // no revision guard
        on failure: GET order.<id>; exists -> 200 (duplicate); else -> 500 (Stripe retries)
        after commit: if any returned onHand < 0 -> patch order {status:'attention', note:'oversold: <sku>'}
   'checkout.session.expired' | 'checkout.session.async_payment_failed':
        TRANSACTION: for each sku: patch .unset(['holds[_key=="'+holdId+'"]'])        // naturally idempotent
   other -> 200 ignore
3. 200 FAST (< a few seconds)
```

Why this is idempotent and atomic:

- `create` "will fail if a document by the provided ID already exists" and the whole transaction rolls back [HIGH, mutation reference]. The deterministic id `order.<sessionId>` is therefore both the idempotency key and the audit record. This satisfies Stripe's own guidance ("webhook endpoints might occasionally receive the same event more than once ... log the event IDs you've processed" [HIGH]) without a separate dedupe table.
- Patch operation order is fixed (`set, setIfMissing, unset, inc, dec, insert`) [HIGH], so unset-then-dec in one patch is deterministic.
- `dec` is deliberately **not** revision-guarded at completion: the money is already taken, so the write must succeed; a negative `onHand` is surfaced as an alarm instead of blocking. Whether unsetting an absent array key is a silent no-op is [UNVERIFIED]; test in the spike.
- Events are not ordered (Stripe: "doesn't guarantee the delivery of events in the order that they're generated" [HIGH]). `completed` can arrive before/after `expired` only in pathological cases; the order doc existing is the tiebreaker (never release a hold of an order that exists; harmless anyway because `unset` of a decremented hold is idempotent).
- **Respond fast:** with a registered webhook and a `success_url`, hosted Checkout "waits up to 10 seconds for your server to respond to the webhook event delivery before redirecting your customer" [HIGH, fulfilment guide]. Two Stripe/Sanity round trips fit; do anything slower (notifications) after responding via `ctx.waitUntil`.
- **Retries:** live mode retries up to three days with exponential backoff; sandbox retries three times over a few hours [HIGH]. Manual "Resend" works for 15 days in the Dashboard [HIGH]. Add a manual reconcile script (section 14, phase E) comparing paid Stripe sessions with `order.*` docs.
- **Oversell policy** (a paid unique item already gone, e.g. Romane cut `onHand` while a hold existed): record the order, flag `attention`, notify, and let Romane refund. Stripe's guide documents only the expiry/release flow; "auto-refund on insufficient inventory" is this research's suggestion, not a documented Stripe procedure. Default to manual refund in v2.0.
- **Payment methods:** enable only synchronous methods (cards, wallets) in Checkout. Delayed methods work with the `async_payment_*` branch above but add a window where a hold can expire before money lands. Keep them off until deliberately wanted.

### Test vs live isolation

- Two Worker deployments (`test`, `live`) with different secrets and Stripe endpoints. A Stripe webhook secret is "different for each" mode even on the same URL [HIGH], so never share one endpoint.
- `test` deployment points at Sanity dataset `staging` (copied from production with `sanity dataset copy`, [MED: well-known CLI feature, not re-verified]); the `live` deployment at `production`. The Worker asserts `STRIPE_KEY mode == deployment mode` and `event.livemode == deployment mode` at start-up/request time, and refuses `live` keys with a non-production dataset.
- Result: no test purchase can decrement real stock, and no manual "reset stock" step is needed at go-live (beyond the normal go-live checklist).

---

## 5. Order record and how Romane sees it

### Where orders live

`order` docs, `liveEdit: true`, `_id = order.<stripeSessionId>`.

- **Private by id format:** "All documents that contain a `.` in their `_id` can only be accessed when a user is logged in or a valid authentication token is provided"; sub-paths cannot be made public [HIGH, Sanity IDs doc]. Free plan has no private datasets ("2 datasets (public only)") [MED, pricing page summarised; the datasets doc confirms private datasets are Growth-plan]. So the dotted id is the zero-cost privacy boundary.
- **Caveat that must be tested (spike S2):** that the Studio lists, opens and edits `liveEdit` documents with a dotted id (it should; Studio only special-cases `drafts.`/`versions.`) [UNVERIFIED].
- **Caveat that is not a bug:** the build token (`SANITY_API_READ_TOKEN`) CAN read dotted-id docs. Safe only because every query filters by `_type` and none selects `order`. Add a test that no `src/lib/sanity.ts` query mentions `order`.
- Free plan document cap is about 10k docs [MED]; irrelevant at this volume but note orders + stock count toward it.

### Shape (minimal, fulfilment-oriented)

`status` (`paid | preparing | shipped | delivered | refunded | attention`), `createdAt`, `livemode`, `lines[]` (sku, product title snapshot, variant label snapshot, qty, unitCents), `amounts{subtotal, shipping, total, currency}`, `shippingZone`, `customer{name, email, phone?}`, `shippingAddress{...}`, `stripe{sessionId, paymentIntentId}`, `trackingNumber`, `internalNote`. Everything except `status`, `trackingNumber`, `internalNote` is `readOnly` in the Studio.

**PII decision (owner, section 15):** recommended default is to keep name/email/address in the private order doc so Romane fulfils from one place, with a written retention rule (purge or anonymise shipping data N months after delivery; accounting records stay in Stripe/invoices) and a line added to the privacy policy. The minimal alternative (orders hold no PII; Romane opens Stripe for the address) is viable but makes every shipment a two-tab job for a non-technical user.

### How Romane sees and works orders

- `structure.ts` gets a "Commandes" item: lists grouped "À expédier" (`status in ["paid","preparing"]`), "Expédiées", "À vérifier" (`attention` or any `stock.onHand < 0`), newest first. She sets `status` and `trackingNumber` by hand.
- Stripe sends customer receipts (Dashboard setting) and can email the account owner on successful payments (Dashboard notification setting) [MED: Dashboard settings, not re-verified]. That gives "a sale happened" email with **zero** mail code in the Worker and without depending on OVH `mail()` quotas (OVH caps PHP mail at 10 to 2000/hour by plan [HIGH, OVH doc]).
- Invoice numbering (French sequential rules) is a legal/accounting question handled with the accountant (SHIP/LEGAL); Stripe `invoice_creation` is the likely mechanism. Do not invent an own counter doc.

---

## 6. Print / high-resolution files at fulfilment

Threat model: the repo is public (STATE.md), `dist/` is uploaded to a public web root, and the Sanity dataset is public (Free plan: no private datasets). Anything uploaded to Sanity assets in this dataset must be treated as public. Therefore:

| Where | Allowed for print masters? |
|---|---|
| Sanity assets / `product.images` | NO (public dataset, CDN-served; also capped at 2400 px by design) |
| `public/`, `dist/`, SFTP web root | NO |
| git (including LFS) | NO (public repo) |
| Romane's own disk / her cloud drive | YES (v2.0 default) |
| Private bucket (Cloudflare R2 free 10 GB, S3-compatible with presigned URLs, or Backblaze B2 free 10 GB) | OPTIONAL, deferred [MED: free tiers from third-party summaries, verify at signup] |

**v2.0 default (recommended):** Romane prints/ships herself. The order doc shows product title + variant label + `printMasterRef` (a file *name*), she fetches the master from her own storage. Zero new infrastructure, zero exposure.

**Deferred option (only if a print lab must receive files):** masters in a private bucket; the Worker mints a short-lived (<= 24 h) presigned GET URL on demand and includes it in a notification to the lab, never in any page or public document. Implementation note: presigned URLs work against the S3 endpoint, not a custom domain [MED]. Do not build this until the owner confirms a lab workflow exists.

Digital downloads are NOT in the product list (prints, originals, books, merch); selling files would be a different feature (licensing, delivery links) and is out of scope.

---

## 7. Secrets and trust boundaries

| Secret / config | Lives in | Never in |
|---|---|---|
| `STRIPE_SECRET_KEY` (use a **restricted** key limited to Checkout Sessions + what refunds need; Stripe: "Use restricted API keys with limited permissions" [HIGH]) | Worker secret (`wrangler secret put`), one per deployment | repo, workflow files, `.env` committed, any `PUBLIC_*` var, dist |
| `STRIPE_WEBHOOK_SECRET` (`whsec_`, per endpoint, per mode) | Worker secret | same |
| `SANITY_WRITE_TOKEN` (Editor-role token; Editor tokens remain available on Free [MED, Sanity answers; confirm at creation]) | Worker secret only | browser, Astro build, GitHub (the build uses the *read* token) |
| `SANITY_API_READ_TOKEN` (existing, Viewer) | existing GitHub secret | Worker (use least privilege) |
| `CLOUDFLARE_API_TOKEN`, account id | GitHub **environment** secrets on a new `production-shop-api` environment (reviewer-gated for live, like `production-ovh`) | repo |
| `SITE_URL`, `SANITY_PROJECT_ID`, `SANITY_DATASET`, `ALLOWED_ORIGIN`, `MODE` | `wrangler.toml` `[vars]` (non-secret) | |
| `SHOP_API_URL` (public) | build-time env for Astro (baked into form `action`) | |
| Turnstile secret (optional) | Worker secret | |

Rules:

- Stripe: never trust the browser for prices, names, shipping cost, `success_url`, `cancel_url` (open redirect). All come from Sanity + `SITE_URL`.
- The Worker's Sanity write token can mutate any document. Blast radius = the whole dataset. Mitigations: separate token per purpose, rotate on any doubt, and **schedule a dataset export before go-live** (`sanity dataset export`) so a bad write is recoverable.
- Stripe recommends both signature verification **and** IP allow-listing for webhooks [HIGH]; signature is mandatory, IP allow-list is a bonus on Workers (check `cf-connecting-ip` against Stripe's published list; low priority).
- Replay: keep Stripe's default 5-minute timestamp tolerance; never 0 [HIGH].
- Hold-exhaustion abuse: a bot can open sessions to hold the only original for ~36 min repeatedly. Mitigations in order of cost: cap qty, one active hold per IP per SKU (KV counter), Cloudflare Turnstile (free) on the buy form for `unique`/`limited` variants, and Romane can clear `holds` in the Studio (field is readOnly in the form but the doc is editable via a Studio action, or just set `holds` via a small action). [MED]
- The new browser script must not import `src/lib/sanity.ts`: that module reads `import.meta.env.SANITY_API_READ_TOKEN` and throws without env; its header already forbids client-side use.
- Add to `tests/scripts/verify-static-artifact.mjs`: fail the build if `dist/` contains `sk_live`, `rk_live`, `sk_test`, `whsec_`, or the string `SANITY_WRITE`.

---

## 8. Compute surface: where the Worker lives

| Criterion | **A. Cloudflare Worker (recommended)** | B. PHP on OVH (fallback) | C. Netlify/Vercel functions |
|---|---|---|---|
| Cost | Free: 100k requests/day, 10 ms CPU, 50 subrequests, 128 MB [HIGH, Cloudflare limits doc] | 0 (existing host) | Free tiers, new vendor |
| Same-origin / CORS | Cross-origin (`*.workers.dev`), avoided for checkout by plain HTML form POST + 303 redirect; CORS only needed if JS `fetch` is used | Same origin | Cross-origin |
| Custom domain on own DNS | Needs zone on Cloudflare (do NOT move the domain's DNS: MX/SPF were protected in v1.7). `workers.dev` URL is enough because the customer only sees it for a redirect | Native | Needs DNS |
| CI coverage | Pure TS core is covered by the existing Vitest/ESLint/tsc gates (add `shop-api` to the composite action, same pattern as `sanity/`) | PHP is invisible to Vitest/ESLint/tsc; money logic untested by the current pipeline unless PHPUnit is added | Same as A |
| Stripe webhook raw body + signature | `constructEventAsync` with SubtleCrypto provider [HIGH/MED] | Trivial `hash_hmac` | OK |
| Prerequisites to verify | `@sanity/client` runs in Workers (else use raw `fetch` to `/data/mutate`) [UNVERIFIED] | (1) PHP outbound HTTPS from the OVH **Free** tier to `api.stripe.com`/`api.sanity.io`: community reports say 443 egress works, SSH egress is blocked [LOW/MED, community + OVH doc]; (2) a secrets file above `www/` readable by PHP: not addressed in OVH docs [UNVERIFIED]; (3) PHP version not pinnable, contact.php is written for 7.1+ | n/a |
| Failure blast radius | Isolated from the live site | Same host as the live site | Isolated |
| New accounts / processors | Cloudflare (free, privacy policy line) | none | new vendor |

**Recommendation: A.** Rationale: the stock/payment logic is the riskiest code in the project and the repo's whole quality system (blocking Vitest + ESLint + typecheck, SHA-pinned actions) is TypeScript-shaped. A pure core module with injected Sanity/Stripe clients can be unit-tested including a simulated concurrent-reserve race. Choose **B** only if the owner refuses another vendor; in that case run spike S1 first (a 15-line PHP file that `curl`s both APIs and reads a file above `www/`), and add PHPUnit + `php -l` to CI before writing money code.

Hosting is an owner decision (section 15); the architecture above is host-agnostic: only three HTTP endpoints cross the boundary.

`astro.config.mjs` stays `output: 'static'` with no adapter. The Worker is a sibling subproject, not an Astro integration.

---

## 9. Data flow diagrams

### 9.1 Read-only catalogue (ships first; no server code)

```
Romane (Studio) -- publishes product / edits stock-<sku>.onHand
        │
        ├─ webhook #1 (_type in [..., product, shopSettings]) ──┐
        └─ webhook #2 (_type=="stock" && changed onHand) ───────┤
                                                                ▼
                         GitHub repository_dispatch "production-deploy-requested"
                                                                ▼
          deploy-ovh.yml: gates -> astro build
             getProducts()  + getStock()  + getShopSettings()   (published perspective, build token)
             sanitize*()  -> buildShopIndexModel / buildProductDetailModel (pure)
             -> dist/boutique/**, dist/en/boutique/**, sitemap
                                                                ▼
                                                    SFTP -> OVH www/
```

### 9.2 Buy flow (checkout, test then live)

```
Product page (static)                 Worker /checkout                    Sanity                 Stripe
  <form POST action=SHOP_API_URL>  ─►  validate input
  items=sku:qty, zone, locale          GET shopSettings+products ───────►  (price, status)
  (+ optional L2 live badge)           GET stock-<sku> (+_rev) ─────────►  onHand, holds
                                       available? else 303 back ?unavailable
                                       TX patch ifRevisionID insert hold ► (409 -> retry<=3)
                                       POST /checkout/sessions ────────────────────────────►  session(url, expires_at)
                                  ◄─ 303 Location: session.url
Browser ───────────────────────────────────────────────────────────────────────────────────►  hosted Checkout page
```

### 9.3 Payment confirmed

```
Stripe ── POST /stripe-webhook (checkout.session.completed) ──► Worker
                                   verify raw-body signature, livemode == MODE
                                   GET session (expand line_items) ◄──── Stripe
                                   paid?  ── no ──► 200 (await async event)
                                   TX  create order.<sessionId>   (fails if exists => duplicate)
                                       patch stock-<sku>: unset hold, dec onHand
                                   ─► Sanity commit ─┬─ webhook #2 fires (onHand changed) ─► rebuild+deploy
                                   200 to Stripe     └─ order visible in Studio "À expédier"
Stripe ── redirect (waits <= 10 s for our 200) ──► success_url = SITE_URL/boutique/merci/?session_id=...  (static page)
```

### 9.4 Abandonment

```
Customer closes the tab ... Stripe session reaches expires_at ─► checkout.session.expired ─► Worker
   TX patch stock-<sku>: unset hold(holdId)   (and even if this event is lost, the hold expires by TTL)
```

### 9.5 Fulfilment

```
Romane opens Studio > Commandes > "À expédier" -> reads address (private order doc), product + printMasterRef
  -> fetches master from her own storage -> prints/ships -> sets status=shipped + trackingNumber
  (Stripe Dashboard remains the place for refunds/disputes)
```

---

## 10. Integration points against the real files

### NEW

| Path | Purpose |
|---|---|
| `sanity/schemas/product.ts`, `stock.ts`, `order.ts`, `shopSettings.ts` | Content model; register in `sanity/schemas/index.ts` |
| `sanity/schemas/lib/` helper for the shared image array validator | Avoid a third copy of the edition/gallery validator |
| Studio document action `createStockLines` (under `sanity/editorial/`) | Idempotent stock-doc creation |
| `shop-api/` (own `package.json`, `wrangler.toml`, `src/core/`, `src/adapters/`, `tests/`) | Worker + pure core + Vitest |
| `src/lib/shop-models.ts`, `src/lib/related-product.ts` | Pure models; neutral édition -> boutique link helper (mirrors `related-edition.ts`) |
| `src/pages/boutique/index.astro`, `[slug].astro`, `merci.astro` and `src/pages/en/boutique/*` | Thin adapters (same shape as `src/pages/editions/[slug].astro`) |
| `src/components/ShopIndexBody.astro`, `ProductDetailPage.astro`, `ProductDetailBody.astro`, `BuyBox.astro` | UI |
| `src/client/shop-availability.ts` | Optional L2 |
| `.github/workflows/deploy-shop-api.yml` | Gates + `wrangler deploy` (action pinned to a commit SHA like the SFTP action); manual dispatch for live, reviewer-gated environment |
| `tests/e2e/shop.spec.ts`, `tests/unit/shop-models.test.ts`, `shop-api/tests/*` | Both locales, both viewports (phone <= 767 px, desktop/tablet), Worker mocked via Playwright route interception |
| URL segment | Use one shared segment in both locales (`boutique`): `getSwitcherHref` in `src/lib/i18n-paths.ts` derives the other-locale URL from a **shared slug**, and legal pages already use French slugs under `/en/` (precedent). A translated segment (`/en/shop/`) would need switcher changes |

### MODIFIED

| File | Change |
|---|---|
| `src/lib/sanity.ts` | Add `Product`, `Variant`, `StockInfo`, `ShopSettings` interfaces; `PRODUCTS_QUERY`, `PRODUCT_BY_SLUG_QUERY`, `STOCK_QUERY`, `SHOP_SETTINGS_QUERY`; `getProducts()`, `getProduct(slug)`, `getStock()`, `getShopSettings()` through `fetchSanitized` (build cache, issue warnings). Stock is a **separate** query merged in a pure function (not a GROQ join) so a missing stock doc degrades to "unavailable" instead of crashing |
| `src/lib/sanity-validation.ts` | `sanitizeProducts/Product`, `sanitizeStock`, `sanitizeShopSettings`; a product with no valid variant or non-integer price is dropped with an issue, never thrown (existing philosophy: a half-edited doc must not crash the static build) |
| `src/lib/page-models.ts` | Only if a neutral édition -> boutique link is added to `EditionDetailModel` (`relatedLink`-style field). Prefer a new `shop-models.ts` to keep this 700+ line file from growing |
| `src/components/EditionDetailBody.astro` / `EditionDetailPage.astro` | Neutral "Voir en boutique" link (late, behind the guard run) |
| `src/components/SiteHeader.astro`, `MobileNavPanel.astro`, `src/layouts/BaseLayout.astro`, `src/lib/site-config.ts` | New nav entry `Boutique`, label editable via `siteSettings.navLabels.shop` (add to `sanity/schemas/siteSettings.ts` + `SiteSettings` type + sanitizer), shown only when at least one published product exists or the owner flips it on |
| `src/pages/sitemap.xml.ts` | Add `boutique/` and `boutique/<slug>/` (via `localizedSitemapPaths`); never `merci/` |
| `src/pages/robots.txt.ts` | `merci/` is `noindex` in markup; no robots change required |
| `sanity/schemas/siteSettings.ts` | `navLabels.shop`; confirm `publisherAddress` copy for the selling phase (field exists) |
| `sanity/schemas/structure.ts` | Orderable "Boutique" list for `product`, singleton `shopSettings`, "Stock" list, "Commandes" grouped list; add `product`, `stock`, `order`, `shopSettings` to the generic-list exclusion array |
| `sanity/schemas/index.ts` | Register the new types |
| `tests/unit/publishing-docs.test.ts` | It asserts the README webhook `_type in [...]` filter equals **all** `type: 'document'` schemas in `sanity/schemas/*.ts`. New `stock`/`order` types would fail it. Add an explicit documented exclusion list (`stock`, `order`) and a second assertion that the README documents webhook #2 |
| `README.md` (webhook section) | Add `product`, `shopSettings` to webhook #1's filter; document webhook #2 (`_type == "stock" && delta::changedAny(onHand)`, same URL/PAT/projection); document CORS origin and Worker secrets |
| `tests/scripts/verify-static-artifact.mjs` | Keep EDN-06 as is; add secret-leak scan of `dist/`; assert `dist/boutique/index.html` exists once products are published; assert the shop form `action` equals the expected `SHOP_API_URL` host |
| `.github/actions/lint-typecheck-and-install` | `npm ci --prefix shop-api` + its lint/typecheck/test steps (blocking), mirroring the `sanity/` steps; add `shop-api/package-lock.json` to the setup-node cache paths |
| `.github/workflows/ci.yml`, `deploy-ovh.yml` | No deploy-logic change. Build step `env:` gains `SHOP_API_URL` (public, optional) and `PUBLIC_SANITY_PROJECT_ID`/dataset for the L2 script. Absent `SHOP_API_URL` = buy UI not rendered (read-only catalogue) |
| `src/pages/confidentialite.astro` (+ en), CGV pages | LEGAL-02/04 and processor list (Stripe, Cloudflare, Sanity order data). Out of this file's scope but a hard dependency of go-live |
| `CLAUDE.md` | Update the "Deferred to v1.x" and stack sections when each phase ships. Keep the statement that **no Astro adapter** is installed |
| `public/.htaccess` | No change expected (no CSP present today). If a CSP is added later: `connect-src https://*.apicdn.sanity.io`, `form-action` allowing the Worker host and `checkout.stripe.com` |

### Deliberately NOT changed

`astro.config.mjs` (static, no adapter), `deploy-ovh.yml` deploy/SFTP steps, `public/contact.php`, `sanity/schemas/edition.ts` (EDN-06 guard), `HomeCarousel`/mobile homepage components.

---

## 11. Recommended structure

```
shop-api/                         # own package.json + lockfile (like sanity/)
├── wrangler.toml                 # [vars] only; env.test / env.live
├── src/
│   ├── core/                     # PURE, no network: unit-tested in CI
│   │   ├── cart.ts               # parse/bound items, price re-derivation
│   │   ├── availability.ts       # onHand - active holds
│   │   ├── reserve.ts            # build reserve transaction (+ retry policy)
│   │   ├── complete.ts           # build completion / release transactions, oversell check
│   │   ├── session.ts            # build Stripe session params from Sanity data
│   │   └── order.ts              # order doc builder (deterministic id)
│   ├── adapters/                 # thin I/O
│   │   ├── sanity.ts             # fetch/mutate against api.sanity.io (non-CDN)
│   │   ├── stripe.ts             # session create/retrieve, signature verify
│   │   └── worker.ts             # routes: /checkout /stripe-webhook /health
│   └── env.ts                    # typed env + mode/dataset/livemode guards
├── tests/                        # Vitest; includes a simulated concurrent-reserve race
└── scripts/reconcile-orders.mjs  # Stripe paid sessions vs order.* docs (manual/scheduled)
sanity/schemas/{product,stock,order,shopSettings}.ts
src/{lib/shop-models.ts, components/Shop*.astro, client/shop-availability.ts, pages/**/boutique/*}
```

Structure rationale: mirrors the repo's strongest conventions (thin adapters over pure functions, build-blocking sanitizers, subproject-with-own-gates) so the unfamiliar part (money + concurrency) lands inside the part of the pipeline that already enforces quality.

---

## 12. Patterns to follow

**Pattern: pure core + injected clients.** `reserve(core, deps: {sanity, now, uuid})`. Tests inject a fake Sanity that implements `ifRevisionID` and transactions in memory, then fire N concurrent reserves for a `unique` SKU and assert exactly one hold survives.

**Pattern: deterministic ids as idempotency keys.** `order.<sessionId>`, `stock-<sku>`. Every write that must happen once is a `create`, every write that may repeat is a `createIfNotExists`/`unset`.

**Pattern: server derives, client suggests.** The form posts `sku`, `qty`, `zone`, `locale`. Everything monetary or navigational is recomputed from Sanity and env.

**Pattern: degrade, don't crash.** A product without stock doc renders as unavailable; a malformed product is skipped with a build warning (existing `warnForSanityIssues` behaviour); the buy UI disappears if `SHOP_API_URL` is unset.

## 13. Anti-patterns to avoid

| Anti-pattern | Why it is wrong here | Instead |
|---|---|---|
| `stockQuantity` field on the draftable `product` | Publishing a draft copies the draft over the published doc [HIGH]: Romane editing a caption would reset stock to the value in her stale draft | Separate `liveEdit` `stock` type |
| Decrementing stock from the success page or browser | Page may never load; webhooks are "required" for fulfilment per Stripe [HIGH] | Webhook-only decrement |
| Putting `stock` in webhook #1's filter | A rebuild per hold/release | Webhook #2 with `delta::changedAny(onHand)` |
| Reading stock through the CDN client in the Worker | Stale revision/availability; Sanity itself says use the live API for integrations [HIGH] | `useCdn: false` for every Worker read |
| One Stripe webhook endpoint for test and live | Secret differs per mode; test events could mutate production stock | Two deployments + livemode guard |
| `request.json()` before signature verification | Signature needs the raw body [HIGH] | `await request.text()` first |
| Using `event.created` to order or dedupe | Stripe says do not [HIGH] | Event/object ids, deterministic order id |
| Print masters in Sanity, `public/` or git | Public dataset, public web root, public repo | Section 6 |
| Adding commerce words/fields to edition pages or `edition.ts` | Breaks the EDN-06 build guard | `product` references `edition`; neutral link only |
| A PHP/Worker "live availability" proxy | Duplicate truth, extra surface | Direct public Sanity read (L2) |
| Importing `src/lib/sanity.ts` in browser code | Build token module; throws without env | Standalone fetch |

## 14. Suggested build order (read-only catalogue first, live-site risk minimised)

Dependencies: A has none; B needs the host decision and A's schemas; C needs B; D (shipping/VAT/legal) can run in parallel with C but gates go-live; E needs C and D.

**Phase A: Read-only catalogue (SHOP-*), zero server code, zero payments**
- Schemas `product`, `stock`, `shopSettings` (+ `order` can wait), Studio structure, `createStockLines` action, `siteSettings.navLabels.shop`.
- `sanity.ts` / `sanity-validation.ts` extensions, `shop-models.ts`, `/boutique/` pages in fr+en, nav entry, sitemap, JSON-LD optional.
- Buy affordance = existing contact CTA while `salesOpen` is false.
- Webhook #2 + README + `publishing-docs.test.ts` update.
- Verification: dual-viewport e2e (phone and desktop/tablet), both locales, EDN-06 guard untouched and green, build survives a product with missing stock doc.
- Risk to live site: nav/header and sitemap edits only. Mitigation: nav entry gated by content existing; ship behind the usual blocking gates.
- Includes the neutral édition -> boutique link as the LAST plan of the phase (touches pages the guard scans).

**Phase B: Shop API foundation (no real payments)**
- Decision gate: host (section 8). Run spikes S1 (only if PHP fallback), S2, S3 (section 16).
- `shop-api/` skeleton, pure core, in-memory Sanity fake, concurrency tests, composite-action CI integration, `staging` dataset, `deploy-shop-api.yml`, `/health`.
- Studio token + Worker secrets provisioning runbook. No Stripe call yet beyond a signature-verification unit test.

**Phase C: Checkout in Stripe test mode**
- `/checkout` (reserve + session), `/stripe-webhook` (complete/expire), `order` schema + "Commandes" Studio list, `merci` page, `BuyBox` + L2 live badge, preview builds pointed at the test Worker. Production site build still has no `SHOP_API_URL`.
- Verification: Stripe CLI / signed fixture events for completed, expired, duplicate, out-of-order; a staged two-browser race on a `unique` item against `staging`; kill the Worker mid-flow and confirm TTL healing.

**Phase D: Delivery, VAT and legal (SHIP-*, LEGAL-02/04)** (parallel with C)
- Zone choice **before** session creation: Stripe shipping rates are fixed per order and the documented hosted-Checkout flow shows the whole `shipping_options` list (up to 5) [HIGH for fixed/inline rates; no per-country filtering is documented on that page; "dynamic shipping options" is a preview feature [HIGH: stated as preview]]. So the buy form asks "France / Europe" first and the Worker sends only that zone's rate and `allowed_countries`.
- CGV, withdrawal right, `publisherAddress`, privacy policy processors; human legal sign-off checkpoint (precedent: Phase 4 plan 03). VAT regime = accountant decision; the code only exposes a switch.

**Phase E: Fulfilment, hardening, go-live**
- Order status workflow polish, `reconcile-orders.mjs`, Turnstile on unique/limited items, dataset export before launch, restricted Stripe key, live Worker deployment + live webhook endpoint, live-mode checklist: SIRET present, live secrets set, `salesOpen` flipped, one real low-value purchase + refund, confirm webhook #2 rebuilds the catalogue.
- Optional later: client-side cart UI (API already accepts `items[]`), private-bucket print delivery, auto-refund on oversell.

---

## 15. Decisions the owner must make

1. **Compute host:** Cloudflare Worker (recommended) or PHP on OVH. Implies accepting a free Cloudflare account and a privacy-policy line.
2. **Buy-now vs cart at launch:** recommend buy-now for one SKU/quantity first (API accepts many items from day one); cart UI later. A cart adds localStorage state (CNIL lists shopping-cart trackers as consent-exempt [MED, secondary sources]) and shipping-combination questions.
3. **Which kinds and stock policies exist at launch** (`unique`, `limited`, `untracked`) and quantity caps per order.
4. **Oversell policy:** manual refund (recommended) vs automatic Stripe refund.
5. **Hold length:** Stripe's minimum session life is 30 minutes, so an abandoned checkout blocks a unique original for roughly 36 minutes. Accept, and decide on Turnstile.
6. **PII in the private order doc** (recommended, with retention rule) vs Stripe-only lookup.
7. **URL segment:** `boutique` (recommended, shared across fr/en) vs `shop`.
8. **Nav exposure at read-only launch:** show "Boutique" in the main nav immediately or only at sales open.
9. **Print files:** stay on Romane's storage (recommended) vs private bucket and signed links; is there a lab that needs files?
10. **Invoicing:** Stripe-generated invoices vs none (accountant, depends on VAT regime and status).
11. **Second Sanity dataset `staging`** (uses the second free dataset slot) vs accepting test data in production.
12. **Payment methods:** cards and wallets only (recommended) vs also delayed methods.

## 16. Spikes and open questions (resolve before the phase that depends on them)

| # | Question | Needed by | Why |
|---|---|---|---|
| S1 | OVH Free-tier PHP: outbound HTTPS to `api.stripe.com` + `api.sanity.io`; can PHP read a file above `www/`? | Phase B, only if option B | Both [UNVERIFIED]; OVH docs say SSH egress is blocked but are silent on PHP egress and `open_basedir` |
| S2 | Studio lists/edits a `liveEdit` doc with a dotted `_id` (`order.cs_...`) and the structure-builder filters work | Phase B | Privacy of orders relies on it |
| S3 | Exact Sanity responses: status code on `ifRevisionID` mismatch (409 vs 400), `create` conflict error shape, `unset` of an absent `holds[_key==...]` key, `@sanity/client` running inside a Worker, `.ifRevisionId()` method name | Phase B | Transactions page says 409; mutation reference summary says 400 for invalid requests |
| S4 | Webhook #2 filter expression accepted by Sanity's filter tester; webhook fires for token (API) mutations, not just Studio edits | Phase A (for the filter) / C | Docs state create/update/delete without distinguishing origin [MED] |
| S5 | Free-plan Editor token creation works; confirm current Free limits (2 datasets, 2 webhooks, 250k API, 1M CDN, ~10k docs) on the live pricing page | Phase B | Figures from a summarised pricing page |
| S6 | Sanity API CDN freshness after a mutation for the L2 read | Phase C | Official CDN doc does not state invalidation timing [MED]; irrelevant to correctness (L3 is authoritative) but affects badge UX |
| S7 | Stripe: restricted-key permission set that covers `checkout.sessions.create/retrieve` (+ refunds if used); metadata limits for `cart` (Stripe's metadata docs: 50 keys, 500 chars per value: confirm); `collected_information` vs `shipping_details` field names for the pinned API version | Phase C | Field names vary by API version |
| S8 | Stripe Dashboard notification emails to the owner on successful payment and webhook-failure alerts | Phase E | Replaces any custom mail code |

## 17. Scalability (realistic for a one-artist shop)

| Concern | A few orders/month (reality) | Hundreds/month | Thousands/month |
|---|---|---|---|
| Sanity API quota | Negligible (~6 API calls per order) vs 250k/month free | Still negligible | Move to Growth or batch reads |
| Rebuilds | One deploy per stock change (~6 min CI) | Concurrency group coalesces; switch webhook #2 to zero-crossing only | Replace L1 by L2-only for counts |
| Hold contention | Practically none; unique-item races decided by optimistic lock | Same | Per-SKU doc is a serialisation point; acceptable for single-digit-per-minute |
| Worker limits | 100k req/day free is orders of magnitude above need | Same | Paid Workers ($5/mo) |
| Document cap (~10k free) | Orders+stock far below | Reached after years | Archive orders to Stripe/export |

First bottleneck is not technical: it is Romane's manual fulfilment loop and refund handling, hence the Commandes view and the reconcile script.

## Sources

Confidence column: H = official page fetched in this session, M = official page partially confirming or secondary source, U = unverified.

| Claim | Source | Conf |
|---|---|---|
| Mutations are transactional; `create` fails if id exists; `createIfNotExists`; patch op order `set, setIfMissing, unset, inc, dec, insert`; `_key` array targeting | https://www.sanity.io/docs/http-reference/mutation | H |
| `ifRevisionID` optimistic locking, 409 Conflict, lost-update warning, atomic "all succeed or all fail" | https://www.sanity.io/docs/content-lake/transactions | H |
| `liveEdit: true` disables drafts; publishing copies draft over published doc | https://www.sanity.io/docs/content-lake/drafts | H |
| IDs containing `.` are private even in public datasets; only root path is public | https://www.sanity.io/docs/ids | H |
| Private datasets are a Growth-plan feature; public datasets queryable by anyone | https://www.sanity.io/docs/content-lake/datasets | H |
| Free plan: 2 datasets (public only), 250k API, 1M CDN, 2 webhooks, ~10k docs | https://www.sanity.io/pricing (summarised by fetch tool) | M |
| Webhooks: at-least-once, 2 retries 30 s apart, 30 s timeout, one concurrent request, drafts/versions ignored by default, delta functions and `before()/after()` in filters | https://www.sanity.io/docs/content-lake/webhooks and https://www.sanity.io/docs/developer-guides/filters-in-groq-powered-webhooks | H/M |
| API CDN caches by URL; `api.sanity.io` is the freshest; recommended for integrations | https://www.sanity.io/docs/content-lake/api-cdn | H |
| CORS origins per project; public reads need no token; "allow credentials" is a risk | https://www.sanity.io/docs/content-lake/cors | H |
| Editor tokens available on Free plan | https://www.sanity.io/answers/changes-to-sanity-s-api-token-permissions-on-the-free-plan-- | M |
| Stripe webhooks: raw body, duplicate events, event ids, retries (live 3 days, sandbox 3x over hours), no ordering guarantee, secret differs per mode, tolerance 5 min, quick 2xx | https://docs.stripe.com/webhooks | H |
| Fulfilment: webhooks required, call fulfilment idempotently and possibly concurrently, retrieve session with `line_items` expanded, check `payment_status`, async payment events, Checkout waits up to 10 s for webhook before redirect | https://docs.stripe.com/checkout/fulfillment.md?payment-ui=stripe-hosted | H |
| Limited inventory: `expires_at` 30 min to 24 h; release stock on `checkout.session.expired` | https://docs.stripe.com/payments/checkout/managing-limited-inventory.md?payment-ui=stripe-hosted , https://docs.stripe.com/api/checkout/sessions/create | H |
| Expired session cannot be completed; expire endpoint only for `open` | https://docs.stripe.com/api/checkout/sessions/expire | H |
| Shipping rates fixed per order, inline `shipping_rate_data`, up to 5 options, dynamic shipping is a preview feature | https://docs.stripe.com/payments/during-payment/charge-shipping.md?payment-ui=stripe-hosted | H |
| Restricted keys, secrets vault/env vars, never in source, rotation | https://docs.stripe.com/keys-best-practices | H |
| Cloudflare Workers Free: 100k requests/day, 10 ms CPU, 50 subrequests, 128 MB | https://developers.cloudflare.com/workers/platform/limits/ | H |
| `constructEventAsync` with a SubtleCrypto provider for Workers | https://docs.stripe.com/webhooks/signature (surfaced via search) | M |
| OVH shared hosting: PHP exec limits, mail quotas, SSH egress blocked; silent on PHP egress/`open_basedir` | https://docs.ovhcloud.com/fr/guides/web-cloud/web-hosting/hosting-technical-specificities.md | H (for what it says) |
| PHP outbound HTTPS 443 allowed on OVH shared | OVH community threads | L |
| CNIL: shopping-cart trackers exempt from consent | https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies/comment-mettre-mon-site-web-en-conformite (via search summary) | M |
| R2 (10 GB free, presigned URLs on S3 endpoint), B2 (10 GB free) | third-party summaries from search | M |
| Repo facts (EDN-06 guard, webhook filter lockstep test, `useCdn: !token`, i18n shared-slug switcher, `publisherAddress`, deploy concurrency) | `tests/scripts/verify-static-artifact.mjs`, `tests/unit/publishing-docs.test.ts`, `src/lib/sanity.ts`, `src/lib/i18n-paths.ts`, `sanity/schemas/siteSettings.ts`, `.github/workflows/deploy-ovh.yml`, README | H |

*Architecture research for: v2.0 Boutique on the Atelier Jacqueline Suzanne static site*
*Researched: 2026-10-04*
