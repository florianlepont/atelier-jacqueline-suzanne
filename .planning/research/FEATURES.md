# Feature Research

**Domain:** Photographer/artist portfolio site with integrated fine-art e-commerce (prints, originals, books/zines, merch)
**Researched:** 2026-07-05
**Confidence:** MEDIUM-HIGH (table stakes and legal requirements are well-documented and consistent across sources; differentiator value is judgment-based; some specifics — e.g. exact CGV wording — need a final legal-copy pass before launch, not just research)

> **Update (2026-07-22):** This file's original research (below, 2026-07-05) covered the full v1/v1.x photographer-site-with-shop domain. The section immediately following is a **new, tightly-scoped addendum** for the v1.3 "Éditions" milestone — a showcase-only zines/artist-books section, explicitly excluding the shop/checkout features already documented below. Read the addendum first if you're planning v1.3; read the rest for full-project context.

---

# Éditions Showcase — v1.3 Milestone Addendum

**Domain:** Self-published paper éditions (zines/artist books) showcase for a single-artist photography site — pre-commerce
**Researched:** 2026-07-22
**Confidence:** MEDIUM (cross-checked web search on indie photobook/zine conventions; no single canonical "how-to" source exists for this narrow pattern — synthesis, not a documented standard)

## Scope Note

This addendum is scoped tightly to the v1.3 milestone: a **showcase-only** "Éditions" section (overview + detail page, no pricing/availability/purchase). Shop/checkout features from the future v1.x milestone (documented in the original research below) are deliberately excluded from Table Stakes/Differentiators here and instead called out explicitly as Anti-Features for *this* milestone.

## Feature Landscape (Éditions Showcase)

### Table Stakes (Users Expect These)

Features visitors assume exist on any self-published-work showcase. Missing these = the section feels like an afterthought.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Éditions overview page (title + lead photo per édition, grid/list) | Visitors need a way to see "what éditions exist" before drilling in — same expectation as the existing Portfolio overview | LOW | Directly mirrors the existing gallery-overview pattern: new Sanity document type + Astro page querying and listing documents. No new UI paradigm needed. |
| Per-édition detail page with full photo shoot | The photo shoot (people holding/reading the object) *is* the content — a single lead image isn't enough to convey a physical object | LOW–MEDIUM | Reuse the existing Portfolio gallery-detail lightbox component as-is, just fed from a different Sanity document type. Avoid building a second lightbox. |
| Short description/artist statement per édition | Every other content type on the site (galleries) has one; visitors expect context for what they're looking at | LOW | Same field pattern as the existing `gallery.statement` field — copy the pattern, don't invent a new one. |
| Format details: page count, print run size, dimensions | This is the baseline bibliographic metadata every artist-book/zine is described by in the wild (indie photobook culture, small publisher catalogs) — its absence would make the object feel undocumented/unfinished | LOW–MEDIUM | New structured fields on the Sanity schema, each needing bilingual label rendering (e.g. "24 pages" / "24 pages", "Édition de 150" / "Edition of 150"). Numbers themselves don't need translation, only surrounding labels. |
| "Éditions" main-nav entry | Requirement is explicit (nav-only, not homepage) — this is the entire discoverability mechanism for the section | LOW | Add one link to the existing `SiteHeader` nav component (Phase 10 unified header) — no new nav infrastructure. |
| Bilingual FR/EN content | Site-wide expectation already established; an English-only or French-only new section would be a regression | LOW | Plug into the existing `astro:i18n` locale routing already built for Portfolio/About/Contact — replication, not a new dependency. |
| Self-serve editing via Sanity, no code changes | Explicit project requirement — Romane must be able to add/edit éditions herself, same as galleries | MEDIUM | New Sanity schema type (`edition` or similar) mirroring the existing `gallery` schema's editing UX (image array, statement field, ordering) so Romane's mental model transfers directly. |

### Differentiators (Nice-to-Haves for This Showcase)

Not required for the section to feel complete, but they raise it above a bare-minimum listing — and they're cheap given what Romane already has.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Lead with lifestyle/behind-the-scenes photography (hands holding the book, someone reading it) rather than flat/studio product shots | This is Romane's actual documented material and is more distinctive than a plain cover-shot catalog — it makes the object feel alive and situates it as art, not merchandise | LOW | Pure curation/content decision, no extra engineering — the existing photo-array + lightbox pattern already supports an arbitrary mix of shots; just sequence lifestyle images first. |
| "Édition de N" / print-run framing as descriptive (not transactional) metadata | Signals scarcity/collectibility using a convention visitors already recognize from indie photobook culture (e.g. "Edition of 250", "limited to 300 copies") — done without implying anything is currently purchasable | LOW | Just a label on the existing format-details field; explicitly *not* a live stock counter (see Anti-Features). |
| Cross-link between an édition and a related Portfolio gallery, when the same shoot/series has both | Gives visitors a natural next step and reinforces that Éditions and Portfolio are one coherent body of work, not two disconnected site sections | MEDIUM | Needs a new Sanity reference field (édition → gallery). Optional, additive — doesn't block the overview/detail pages shipping without it. |

### Anti-Features (Explicitly Out of Scope for This Milestone)

Things that look like natural additions to a "book showcase" page but should NOT be built now — they pull v1.x shop scope (already documented below) forward prematurely.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|------------------|-------------|
| "Notify me" / waitlist email signup for when éditions go on sale | Feels like it captures purchase intent cheaply while there's no shop yet | Requires new infrastructure (email capture + storage, GDPR consent copy) for a feature this milestone explicitly excludes; web research found no strong evidence this pattern is even common on comparable small self-published-artist sites — most simply ship a plain showcase with zero commerce affordance | Rely on the site's existing Contact page/form for anyone who wants to inquire — no new mechanism needed |
| Placeholder pricing ("Price TBA") | Makes the section look more "shop-ready" / complete | Sets an expectation of imminent purchase, and the placeholder has to be revisited/replaced later anyway — double the editing work for Romane, for no visitor benefit now | Omit price entirely; a pure showcase with no price field reads as intentional, not unfinished |
| Live stock/availability indicator ("X copies left") | Creates urgency, feels e-commerce-native | Without real inventory tracking (deferred to the v1.x shop, per PROJECT.md's stock-tracking requirement), any number shown has no server-side truth behind it and becomes a stale or misleading claim | State print run size as a static bibliographic fact ("Édition de 150, 2025") — a historical fact about the object, not a live counter |
| Buy/purchase CTA button (even disabled, or linking to Contact as a stand-in "buy") | Feels like it moves visitors toward a future sale | Explicitly out of scope per PROJECT.md ("no pricing, availability, or purchase CTA"); a dead/disabled button reads as broken, and a CTA that silently redirects to Contact misrepresents intent | No CTA at all this milestone — the page is descriptive only |
| A second, bespoke lightbox/gallery viewer built specifically for Éditions | Could allow a slightly different visual treatment for "book photos" vs. "gallery photos" | Duplicates a component that already works and is already tested (Portfolio gallery-detail), for a benefit that isn't requested | Reuse the existing lightbox component, parameterized by content type/document, same as Portfolio |
| Surfacing Éditions on the homepage carousel/grid | Seems like free extra visibility | Explicitly ruled out by this milestone's requirements — homepage stays pure photography | Nav-only entry point, per spec |

## Feature Dependencies (Éditions Showcase)

```
Sanity "edition" schema (new content type)
    └──mirrors──> existing "gallery" schema pattern (image array, statement, ordering)
    └──requires──> existing Sanity project/dataset (already provisioned, no new service)

Éditions overview page
    └──requires──> Sanity "edition" schema
    └──requires──> Main nav "Éditions" entry

Éditions detail page
    └──requires──> Sanity "edition" schema (statement, format-detail fields, photo array)
    └──reuses──> existing gallery-detail lightbox component (Portfolio)
    └──requires──> Éditions overview page (as the entry point/route parent)

Bilingual FR/EN content
    └──requires──> existing astro:i18n locale routing (already built — replication, not new work)

"Édition de N" print-run framing (differentiator)
    └──requires──> format-detail fields on "edition" schema (table stakes, must ship first)

Cross-link to related Portfolio gallery (differentiator)
    └──requires──> new Sanity reference field edition→gallery
    └──enhances──> Éditions detail page (optional, non-blocking)

Buy CTA / stock counters / waitlist signup (anti-features, v1.x shop concerns — see original research below)
    └──conflicts with──> "showcase only, no commerce" scope of this milestone (PROJECT.md explicit exclusion)
    └──should NOT precede──> real inventory tracking + Stripe checkout (v1.x), to avoid stale/misleading claims
```

### Dependency Notes

- **Éditions detail page reuses the gallery-detail lightbox component:** the existing Portfolio gallery-detail pattern (full-size images + lightbox + statement) is functionally identical to what's needed here — the only difference is the document type it's fed from and the addition of format-detail fields. Building a second, parallel component would be pure duplication.
- **Format-detail fields must ship before the "Édition de N" framing differentiator:** the print-run/dimensions/page-count fields are the table-stakes data; the scarcity-framing language is just presentation on top of that same data, so it can't precede it.
- **Buy CTA / stock counters conflict with this milestone's scope:** these are the actual v1.x shop trigger conditions (real inventory + Stripe, per the original research below). Introducing even a disabled/placeholder version now creates rework later and risks the "stale claim" problem described above — hold them entirely for the shop milestone.
- **Bilingual routing is inherited, not new:** because `astro:i18n` locale routing already exists site-wide, Éditions pages need to plug into the established pattern used by Portfolio/About/Contact rather than requiring any new i18n engineering.

## MVP Definition (Éditions Showcase)

### Launch With (v1.3, this milestone)

- [ ] Éditions main-nav entry — required entry point, per spec
- [ ] Overview page: title + lead photo per édition — minimum needed to browse the section
- [ ] Detail page: full photo shoot (reused lightbox), short statement, format details (page count, print run, dimensions) — the core showcase content, explicitly named in requirements
- [ ] Bilingual FR/EN — site-wide expectation, no partial-language regression
- [ ] Sanity schema + self-serve editing mirroring the gallery pattern — required for Romane's independence, per constraints

### Add After Validation (optional stretch within this milestone, or early v1.x if deferred)

- [ ] "Édition de N" scarcity framing — cheap, high-fit differentiator; add once base format-detail fields exist
- [ ] Cross-link between an édition and its related Portfolio gallery — nice narrative continuity, not blocking; only do it if the specific éditions in scope (e.g. "Rebut", "Sillo") actually have a matching gallery to link to

### Future Consideration (v1.x shop milestone, explicitly not now)

- [ ] Price display — defer: requires the shop/checkout milestone's pricing model
- [ ] Buy/checkout CTA — defer: requires Stripe integration decided in v1.x
- [ ] Stock/availability tracking (sold out / quantity remaining) — defer: requires real inventory tracking per PROJECT.md, not meaningful without it
- [ ] Waitlist/"notify me" signup for future availability — defer: adds infrastructure for a commerce trigger that doesn't exist yet; revisit only if v1.x shop timeline slips significantly and demand-signal capture becomes worth the cost

## Feature Prioritization Matrix (Éditions Showcase)

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Éditions overview page | HIGH | LOW | P1 |
| Per-édition detail page w/ full photo shoot | HIGH | LOW (reuses existing lightbox) | P1 |
| Format details (page count/print run/dimensions) | MEDIUM | LOW | P1 |
| Main nav entry | HIGH | LOW | P1 |
| Bilingual content | HIGH | LOW (existing i18n) | P1 |
| Sanity self-serve schema | HIGH | MEDIUM | P1 |
| "Édition de N" scarcity framing | MEDIUM | LOW | P2 |
| Cross-link to related Portfolio gallery | LOW–MEDIUM | MEDIUM | P3 |
| Waitlist/notify-me signup | LOW (explicitly out of scope) | MEDIUM | Defer to v1.x (do not build) |
| Pricing / buy CTA / stock tracking | N/A this milestone | HIGH | Explicitly deferred to v1.x |

**Priority key:**
- P1: Must have for this milestone's launch
- P2: Should have, low-cost addition once P1 data model exists
- P3: Nice to have, only if time/content allows
- Deferred: belongs to the future v1.x shop milestone, not this one

## Comparable Patterns (Indie Photobook / Zine Sites)

Since this is a single-artist showcase rather than a competitive product, the useful comparison is to how independent photographers and small self-publishing outlets present éditions/zines/artist books, especially pre-commerce:

| Pattern element | How it's commonly done | Our approach |
|---|---|---|
| Section placement | A dedicated "Publications"/"Books"/"Éditions" nav entry, separate from the main photography portfolio | Match this — separate top-level nav item, not folded into Portfolio |
| Object photography | Lifestyle/behind-the-scenes shots (hands, reading, texture) alongside or instead of flat product shots | Match this — Romane's dedicated photo shoots are the differentiator, sequence them prominently |
| Metadata shown | Format/binding, dimensions, page count, edition size ("Edition of N") — treated as standard bibliographic fact independent of whether a sale is possible | Match this exactly as the table-stakes format-details field |
| Commerce affordance pre-shop | Most small self-published-artist sites show **no** commerce affordance at all pre-shop (no price, no CTA, no waitlist) rather than teasing a future sale | Match this — pure showcase, no CTA of any kind |
| Numbering/scarcity language | "Edition of 250", "limited to 300 copies" used as descriptive text, not a live counter | Match this — static text, not inventory-driven |

## Sources (Éditions Showcase Addendum)

- Domain knowledge of indie photobook/zine publishing conventions (Self Publish Be Happy, Indie Photobook Library, Setanta Books) — general web search, confidence LOW per source-hierarchy classification (unverified web search); cross-checked across two independent queries on format/edition-size conventions, raising practical confidence to MEDIUM for the format-metadata and "no live commerce affordance pre-shop" findings specifically.
- `.planning/PROJECT.md` — milestone scope, explicit requirements and exclusions for v1.3 Éditions.
- Existing shipped codebase patterns (Portfolio gallery/gallery-detail, Sanity schema conventions, `astro:i18n` routing, `SiteHeader` nav) — used as the baseline "what already exists to reuse" per CLAUDE.md's documented stack.

---

# Original Research: v1 / v1.x Photographer Site + Fine-Art E-Commerce (2026-07-05)

The sections below are the original, full-project feature research from 2026-07-05, covering the entire v1 (portfolio/about/contact) and v1.x (exhibitions/shop/checkout) scope. Still current for those milestones; unaffected by the Éditions addendum above.


## Feature Landscape

### Table Stakes (Users Expect These)

Features visitors and buyers assume exist on any photographer/artist site that sells work directly. Missing these makes the site feel unfinished or untrustworthy for a purchase decision.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Portfolio/gallery browsing (grouped by project/series) | This is the core reason visitors arrive — to see the work before anything else. Matches the existing site's structure (Rebut, Silos, Brume, Adults, etc.). | LOW-MEDIUM | Needs a grid/gallery view per project + full-size image view (lightbox or dedicated page). Image optimization (responsive sizes, lazy loading) matters a lot for photography — large unoptimized images are the #1 way these sites feel slow. |
| About/bio page | Buyers of art/photography want to know who made it and why before paying. Standard on every artist site reviewed (contemporaryartissue.com, portfoliobox.com, etc.). Third-person editorial bio (100-300 words) is the convention, often paired with a portrait. | LOW | Static content page. No dependency on other systems. |
| Contact page/form | Table stakes for any professional/creative site — commissions, press, custom requests all route through this. Already exists on the current site. | LOW | Simple form + email delivery, or mailto. Needs spam protection (honeypot/reCAPTCHA-lite). |
| Product listings with clear pricing and availability | Buyers need to see price, medium, size, and edition status before adding to cart. This is non-negotiable for a real store — ambiguity kills conversion. | MEDIUM | Distinct product "types" (print, original, book/zine, merch) likely need distinct schemas — see Feature Dependencies below. |
| Cart + real checkout (payment processed online) | The project's explicit core value. Buyers today expect to complete a purchase without emailing back and forth — "DM to buy" or "inquire for price" feels outdated for anything positioned as a real shop. | MEDIUM-HIGH | Requires a payment processor (Stripe is the standard choice for a France-based near-zero-budget indie site — handles SCA/3D Secure required in the EU). |
| Stock/inventory accuracy — sold-out state for one-of-a-kind items, decrementing count for editions | Nothing damages trust faster than buying something already sold, especially for a unique original. Multiple sources (PhotoBiz, Shopify, WooCommerce guides) treat "quantity 1 → auto out-of-stock" as baseline e-commerce behavior, not a differentiator. | MEDIUM | Must prevent overselling under concurrent checkouts (race condition on the last unit) — a correctness requirement, not just a UI nicety. |
| Order confirmation + shipping notification emails | Buyers expect an email receipt and a "your order shipped" notice as a matter of course; absence reads as broken/untrustworthy. | LOW-MEDIUM | Usually comes bundled with the checkout/payment stack (Stripe emails, or CMS/e-commerce plugin emails). |
| Shipping cost and delivery expectations shown before/at checkout | Required by French/EU consumer law (delivery times must be stated) and a basic conversion-killer if hidden until the last step. | LOW-MEDIUM | Scope is already France + Europe (per PROJECT.md) — keep the shipping-zone matrix simple (2 zones: FR, rest of EU). |
| Legal pages: Mentions légales, CGV (Conditions Générales de Vente), Privacy Policy/GDPR notice | Legally mandatory in France for any commercial site selling to consumers (LCEN Article 6 + French Consumer Code). Not optional, not a nice-to-have. | LOW | Static content, but must be legally accurate: identity of the site owner, hosting provider, VAT/business status, right of withdrawal (14-day EU distance-selling right), and a mandatory checkbox at checkout acknowledging the CGV. |
| Cookie/consent banner | GDPR requirement the moment any analytics, embeds, or non-essential cookies are used. | LOW | Can be minimal if the stack avoids third-party trackers; still needed for Stripe/analytics cookies in most setups. |
| Mobile-responsive layout | Majority of portfolio/gallery traffic (especially from Instagram, where the current audience lives — @ajs_romanelepont) is mobile. A gallery site that doesn't work on a phone loses most visitors immediately. | LOW-MEDIUM | Standard responsive design; image-heavy pages need careful mobile performance tuning. |
| Bilingual presentation (FR/EN) with a language switcher | Explicit requirement; also increasingly standard for any European creative/e-commerce site wanting reach beyond one country. Weglot/Shopify guidance confirms: switcher must be visible (header/footer), must not reset the cart, and must be consistent across all pages including checkout and transactional emails. | MEDIUM | Touches nearly everything — content model, URLs, SEO (hreflang), checkout copy, legal pages, and transactional emails all need both languages. This is a cross-cutting concern, not an isolated feature — see Dependencies. |
| Exhibitions/agenda list (upcoming + past, informational) | Standard "third page" on professional artist sites per multiple sources (contemporaryartissue.com: portfolio, bio/CV, contact — exhibitions is the common fourth). Reverse-chronological list with date, location, short description is the established convention. | LOW | Explicitly informational only, no booking (already scoped out in PROJECT.md) — keep it a simple list/CMS collection, not a calendar UI. |

### Differentiators (Competitive Advantage)

Features that aren't required to be "a real shop" but meaningfully improve trust, conversion, or brand feel for a fine-art/photography seller specifically.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Certificate of authenticity (COA) messaging for originals and limited editions | Collectors specifically look for this on limited editions/originals — multiple sources note buyers are reluctant to buy signed/numbered work without one. Cheap to deliver (a PDF or printed insert stating edition number, medium, date, signature) but signals professionalism disproportionate to its cost. | LOW | No software dependency — can be a manual fulfillment step (Romane signs/numbers + includes a COA card) rather than an automated system. Strong value/effort ratio for a near-zero-budget project. |
| Clear "edition of X, this is print N" numbering shown on the product page | Reinforces scarcity/value proposition for limited editions; expected convention in the fine-art print market (e.g., "12/50"). | LOW | Just a data field for editions (current number sold / total). Ties directly into the stock-tracking table-stakes feature — cheap to add once inventory exists. |
| Per-project storytelling (artist statement per gallery/series, not just a generic bio) | Differentiates a genuine artist site from a generic print shop — context per series (why it was made, where, when) adds perceived value and supports higher price points for originals. Current site already implies this structure (named projects like Rebut, MADO). | LOW-MEDIUM | Content-only feature; depends on the CMS content model supporting a text block per gallery, not just images. |
| Room-view / scale mockups for prints | Multiple sources (Improve Photography, FilterGrade) flag this as one of the highest-impact, lowest-cost conversion improvements for print sales — helps buyers judge physical size/impact. | LOW-MEDIUM | Can start with a few generic mockups (e.g., print on a wall) reused across products rather than a bespoke render per piece — keeps cost near zero. |
| Self-service content editing for galleries and exhibitions (already required, but doing it well is a differentiator vs. typical dev-maintained sites) | Most bespoke developer-built artist sites end up bottlenecked on the developer for every update. A genuinely easy non-technical editing flow (per PROJECT.md requirement) is what makes this project succeed operationally long after launch, not just at launch. | MEDIUM | This is the single most consequential "soft" feature for long-term success of the project — worth deliberate UX attention in the CMS choice/config, covered further in STACK/ARCHITECTURE research. |
| Newsletter signup | Common recommendation across artist-business sources (ArtPlacer, Artwork Archive) as the main channel for announcing new editions/exhibitions to past buyers — higher-intent than social media. | LOW | Simple email capture + third-party list provider (free tier). Not required for v1 functionality but very cheap to add and compounds in value over time. |
| Bilingual SEO done properly (hreflang, translated metadata, translated URLs) | Most competitor/DIY sites bolt on translation without proper hreflang, which confuses search engines and splits/duplicates ranking signal. Doing this correctly is a real (if invisible) advantage for organic discovery in two language markets. | MEDIUM | Depends on the framework/CMS's i18n routing support — a stack-level decision, not just content work. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that look appealing for an artist/e-commerce site but would add disproportionate cost, complexity, or risk relative to this project's near-zero-budget, single-maintainer, single-artist context.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|------------------|-------------|
| Print-on-demand (POD) fulfillment integration (Printful/Printify/Gelato/Fine Art America) | Seems to remove fulfillment burden and "de-risk" starting a print shop. | Fundamentally conflicts with this project's model: originals and true limited editions can't be POD (POD is for infinite reproductions), margins drop to 10-20%, and quality control is out of Romane's hands — bad fit for a fine-art positioning where authenticity/quality is the selling point. | Self-fulfilled prints (Romane or a local print lab handles printing/signing/numbering/shipping), which is also what makes COAs and hand-numbering credible. |
| Multi-vendor marketplace features (other artists selling on the same site, reviews/ratings on products) | Marketplaces like Artfinder/UGallery show these work well and drive "social proof." | This is a single-artist personal site, not a marketplace — adds moderation, trust, and payout-splitting complexity with zero benefit here. Product reviews on one-of-a-kind art are also low-signal (nothing to compare against once sold). | Skip entirely; trust is built via the artist's own bio, exhibition history, and COA, not crowd reviews. |
| Worldwide shipping / multi-currency automatic conversion | "Why limit the market?" is a natural instinct once a checkout exists. | Already explicitly out of scope in PROJECT.md — customs paperwork, VAT/duties, and carrier complexity scale non-linearly outside France+EU, and this is a near-zero-budget one-person operation with no fulfillment staff. | France + rest-of-Europe shipping only for v1; revisit only if demand clearly justifies the operational overhead. |
| Exhibition booking/RSVP or ticketing | Feels like a natural "upgrade" once an exhibitions list exists. | Already explicitly out of scope. Turns a static content page into a system needing capacity management, confirmations, and possibly payments for ticketed events — disproportionate for what's meant to be an informational agenda. | Plain reverse-chronological list of dates/locations/descriptions; link out to a gallery's own RSVP system if one exists for a specific show. |
| Elaborate framing/matting configurator (choose frame color, mat width, glass type per print) | Big print-on-demand platforms (Fine Art America, WHCC) offer this and it looks feature-rich. | High implementation complexity (pricing matrix explodes combinatorially) for a shop that's explicitly not print-on-demand at scale; also implies fulfillment infrastructure (framing partner/inventory) this project doesn't have. | Offer a small, fixed number of print sizes and at most "framed / unframed" as a single binary option if requested later — not a full configurator. |
| Live chat / AI chatbot for customer support | Feels modern, seen on larger e-commerce sites. | Needs someone (Romane) monitoring it in real time or it becomes a broken promise; adds a third-party tool/cost for a low-volume single-artist shop. | Contact form + normal email response time is sufficient at this scale. |
| Customer accounts with order history, wishlists, saved addresses | Standard on large e-commerce platforms, feels like it "should" exist. | Adds authentication, password reset, and account-management surface area for what will likely be a low-frequency, often one-time purchase per customer (unique/limited art, not repeat consumables). | Guest checkout with an emailed receipt/order confirmation is sufficient; Stripe can store card details for repeat buyers without a full account system. |
| Real-time inventory sync across multiple sales channels (Instagram Shopping, Etsy, this site, in-person sales) | Romane may sell in person (exhibitions) and via Instagram too, so "keep it all in sync automatically" sounds appealing. | Multi-channel inventory sync is a genuinely hard problem (webhooks, conflict resolution) disproportionate to a single-artist near-zero-budget site, especially for one-of-a-kind items where a double-sale is embarrassing but recoverable (refund + apology), not catastrophic. | Manually mark an item sold/out-of-stock on the site immediately after an in-person or Instagram sale; keep the site as the single source of truth for online stock only. |
| "View on your wall" AR feature | Cutting-edge feel, some larger print platforms have started offering it. | High implementation complexity (camera access, AR rendering) for uncertain conversion lift versus simple room-view mockup images, which research shows deliver most of the same benefit far more cheaply. | Static room-view mockup images per print size (see Differentiators). |

## Feature Dependencies

```
Bilingual presentation (FR/EN)
    └──cross-cuts──> Portfolio/galleries, Product listings, Exhibitions, About, Checkout, Legal pages, Emails
                       (every content type and transactional flow needs both languages; this is not an
                       isolated feature to build once — it's a constraint on the content model from day one)

Product listings (with type: print / original / book-zine / merch)
    └──requires──> Stock/inventory tracking (per-unit for originals, per-edition-count for limited editions)
                       └──requires──> Cart + checkout (payment)
                                          └──requires──> Order confirmation emails
                                          └──requires──> Shipping cost calculation (FR / EU zones)
                                          └──requires──> Legal pages (CGV acceptance checkbox at checkout, GDPR)

Certificate of authenticity / edition numbering
    └──enhances──> Product listings (originals, limited editions specifically — not needed for books/merch)
    └──depends on──> Stock/inventory tracking (numbering requires knowing "this is unit N of M")

Portfolio/gallery browsing
    └──enhances──> Product listings (a print's product page often IS a photo already shown in a gallery —
                       shared image assets/content model between "portfolio" and "shop" reduces duplicate work)

Self-service content editing (non-technical)
    └──requires──> Portfolio/gallery content to live in a CMS, not hardcoded
    └──requires──> Exhibitions/agenda content to live in a CMS, not hardcoded
    (per PROJECT.md, product/stock editing is NOT required to be self-service for v1 — only galleries + exhibitions)

Exhibitions/agenda list
    └──independent──> no dependency on e-commerce or portfolio systems; can ship as a standalone content page

Room-view mockups
    └──enhances──> Product listings (print products specifically)

Newsletter signup
    └──independent──> no dependency on other features; can be added at any point
```

### Dependency Notes

- **Bilingual presentation cross-cuts almost everything:** this is the most important dependency to plan for early. It is far cheaper to build every content type (galleries, products, exhibitions, legal pages, checkout, emails) with translation as a first-class concern from the start than to retrofit i18n onto an English/French-only build later. This should influence phase 1 architecture, not be deferred to a "translation phase."
- **Stock tracking must exist before real checkout is trustworthy:** selling an original or a numbered edition without atomic stock decrement risks overselling a one-of-a-kind item, which is reputationally worse for a fine-art seller than for a generic retailer (there's no "reprint and apologize" option for an original). This makes inventory correctness a phase-1-adjacent requirement, not a later refinement.
- **COA/edition numbering depends on stock tracking:** you cannot credibly print "3/25" on a certificate or product page unless the system (or Romane's manual process) knows how many of that edition have sold. This can be fully manual at launch (Romane keeps track) as long as the site enforces the "sold out" cutoff automatically.
- **Self-service editing scope is deliberately narrow per PROJECT.md:** only galleries and exhibitions need to be non-technical-editable for v1 — product/shop management can remain developer-assisted initially, which meaningfully reduces v1 CMS/architecture complexity. Don't over-build a full self-service commerce backend if it's not required yet.
- **Portfolio and shop product images can share a content model:** since prints are literally the photographs already organized into galleries, treating "gallery image" and "sellable print" as the same underlying asset (with commerce fields added) avoids duplicate uploads and keeps Romane's content-editing burden low.

## MVP Definition

### Launch With (v1)

This maps directly to the "Active" requirements already captured in PROJECT.md — the research confirms none of these are excessive; they represent genuine table stakes for "a real portfolio + shop," not scope creep.

- [ ] Portfolio/gallery browsing across existing projects — the core reason visitors arrive
- [ ] About/bio page — required for buyer trust and standard on any artist site
- [ ] Exhibitions/agenda list (informational, reverse-chronological) — standard "third page" convention
- [ ] Product listings for prints, originals, books/zines, merch — the store itself
- [ ] Real cart + checkout (Stripe) — the explicit core value of the project
- [ ] Stock tracking (sold-out for originals, decrementing counts for editions) — non-negotiable correctness requirement once real money changes hands
- [ ] Shipping to France + rest of Europe with clear cost/delivery-time display — legal + trust requirement
- [ ] Bilingual FR/EN with a persistent, cart-safe language switcher — explicit requirement, cross-cuts everything
- [ ] Contact page/form — baseline expectation
- [ ] Legal pages: mentions légales, CGV, privacy/GDPR notice, cookie consent — legally mandatory in France
- [ ] Non-technical editing for galleries and exhibitions — required for Romane's independent operation post-launch

### Add After Validation (v1.x)

Add once the core shop is live and generating real orders — these compound the shop's effectiveness but aren't required to prove the concept works.

- [ ] Certificate-of-authenticity insert/PDF for originals and limited editions — trigger: first original/edition sales, cheap to add manually
- [ ] Edition numbering displayed on product pages ("N/M") — trigger: once limited editions are actually in the catalog and stock tracking is proven reliable
- [ ] Room-view mockup images for prints — trigger: if print conversion seems lower than expected, or simply as a quick post-launch polish pass
- [ ] Newsletter signup — trigger: once there's a first cohort of buyers/visitors worth retaining
- [ ] Per-project artist statements (beyond the general bio) — trigger: time allows content-writing after launch mechanics are done

### Future Consideration (v2+)

Defer until the core shop has real usage data and Romane's operational rhythm is established.

- [ ] Self-service editing extended to products/shop inventory — defer until it's clear this bottleneck actually matters in practice (v1 keeps this developer-assisted deliberately)
- [ ] Expanded shipping beyond Europe — defer until there's demonstrated demand that justifies the customs/duties complexity
- [ ] Any of the anti-features listed above (POD, marketplace features, accounts, live chat, AR, framing configurator) — defer indefinitely unless a specific, evidenced need emerges

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Portfolio/gallery browsing | HIGH | MEDIUM | P1 |
| Real checkout (Stripe) | HIGH | HIGH | P1 |
| Stock tracking (originals + editions) | HIGH | MEDIUM | P1 |
| Bilingual FR/EN | HIGH | MEDIUM-HIGH | P1 |
| About/bio page | MEDIUM | LOW | P1 |
| Exhibitions/agenda list | MEDIUM | LOW | P1 |
| Legal pages (mentions légales, CGV, GDPR) | HIGH (legally required) | LOW | P1 |
| Contact form | MEDIUM | LOW | P1 |
| Non-technical editing (galleries + exhibitions) | HIGH (long-term) | MEDIUM | P1 |
| Shipping FR + EU with cost display | HIGH | LOW-MEDIUM | P1 |
| Certificate of authenticity | MEDIUM | LOW | P2 |
| Edition numbering display | MEDIUM | LOW | P2 |
| Room-view mockups | MEDIUM | LOW-MEDIUM | P2 |
| Newsletter signup | LOW-MEDIUM | LOW | P2 |
| Per-project artist statements | LOW-MEDIUM | LOW | P2 |
| Self-service product/shop editing | MEDIUM | HIGH | P3 |
| Worldwide shipping | LOW (for this artist's stage) | HIGH | P3 |
| Framing configurator, accounts, live chat, AR, POD, marketplace features | LOW (anti-features) | HIGH | Not planned |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

Comparison drawn from documented patterns across dedicated fine-art marketplaces (Artfinder, UGallery, Fine Art America), photographer-website builders (Format/Squarespace — notably the current site's own platform), and general artist-site guidance (FASO, Contemporary Art Issue).

| Feature | Fine Art America / large POD platforms | UGallery / Artfinder (curated originals marketplaces) | Our approach |
|---------|----------------------------------------|--------------------------------------------------------|--------------|
| Fulfillment model | Print-on-demand, platform-run | Originals only; platform manages packing/shipping/returns for the artist | Self-fulfilled by Romane; deliberately not POD (originals + true limited editions don't fit POD) |
| Product breadth | Prints, home decor, greeting cards, apparel — very broad | Original paintings/photography/sculpture only | Focused catalog: prints, originals, books/zines, a small merch line — breadth stays deliberately narrow |
| Editions/authenticity | Framing/matting customization emphasized over authenticity messaging | Strong on scarcity ("one-of-a-kind") but originals-only, no edition-numbering use case | Combine both: originals (one-of-a-kind, sold-out state) AND numbered limited editions in the same shop, with COA messaging for both |
| Branding/portfolio integration | Artist gets a subsite within a larger marketplace — brand is diluted | Portfolio and shop feel more integrated, artist-first | Single unified custom site under Romane's own domain — no marketplace dilution, matches the "one unified site" decision in PROJECT.md |
| Language/market reach | English-first, US-centric | English-first | Bilingual FR/EN from day one — a genuine point of difference from most indie photographer sites reviewed, which are typically single-language |
| Exhibitions/agenda | Not a feature on commerce-first platforms (no exhibitions concept) | Not typically present — marketplaces don't show physical show history | Distinct "exhibitions" page is a feature these commerce-first platforms lack entirely, but a standard element on artist-first sites (FASO, Contemporary Art Issue guidance) — reinforces that this is an artist site with a shop, not a shop with an artist attached |

## Sources

- [How To Sell One-of-a-Kind or Limited Items with Inventory Tracking — PhotoBiz](https://support.photobiz.com/ecommerce/blog1/how-to-sell-one-of-a-kind-or-limited-items-with-inventory-tracking) — MEDIUM confidence (single vendor source, but consistent with general e-commerce inventory conventions)
- [How to Sell Limited Edition Prints as a Photographer — PetaPixel](https://petapixel.com/how-to-sell-limited-edition-prints/) — MEDIUM confidence
- [(Checklist) Selling wall decor and fine-art prints on your website — PhotoDeck](https://www.photodeck.com/checklists/selling-fine-art-prints/) — MEDIUM confidence
- [12 Tips for Selling Photography Prints from A Website — Improve Photography](https://improvephotography.com/47617/12-tips-selling-photography-prints-website/) — MEDIUM confidence (room-mockup conversion tip)
- [Limited Editions for Artists: Run Size, Labeling, Value Protection — AGI Fine Art](https://agifineart.com/advice/making-limited-edition-prints/) — MEDIUM confidence
- [A Guide to Authenticating Prints & Editions — MyArtBroker](https://www.myartbroker.com/collecting/articles/guide-to-authenticating-prints-editions) — MEDIUM confidence
- [All Pages You Need For A Professional Artist's Website — Contemporary Art Issue](https://www.contemporaryartissue.com/all-pages-you-need-for-a-professional-artists-website/) — MEDIUM-HIGH confidence (converges with multiple similar sources on portfolio/bio/contact/exhibitions structure)
- [Why Your Online Portfolio Website Needs a Comprehensive Artist Bio — Portfoliobox](https://www.portfoliobox.com/magazine/why-your-online-portfolio-website-needs-a-comprehensive) — MEDIUM confidence
- [15 Best Websites for Selling Art Online in 2026 — ecomm.design](https://ecomm.design/best-websites-for-selling-art-online/) — MEDIUM confidence
- [Artfinder / UGallery platform comparisons — Printful "Best Places to Sell Art"](https://www.printful.com/blog/Best-place-to-sell-art) — MEDIUM confidence
- [How to ship art internationally — Art Business Info for Artists](https://www.artbusinessinfo.com/how-to-ship-art-guide-for-artists.html) — MEDIUM confidence
- [Obligations légales en e-commerce : CGV et protection des consommateurs — Anov](https://www.anov.fr/obligations-legales-ecommerce-cgv-protection-consommateurs.html) — MEDIUM-HIGH confidence (converges with multiple French legal-guidance sources on LCEN/mentions légales/CGV requirements)
- [Mentions légales et CGV obligatoires pour un site e-commerce en France](https://blog.lueurexterne.com/fr/blog/mentions-legales-et-cgv-obligatoires-pour-un-site-e-commerce-en-france/) — MEDIUM-HIGH confidence
- [Lois e-commerce : guide pour vendre en ligne — Shopify France](https://www.shopify.com/fr/blog/lois-e-commerce) — MEDIUM confidence
- [Doing e-commerce: rules to follow — Service Public (French government)](https://entreprendre.service-public.gouv.fr/vosdroits/F23455?lang=en) — HIGH confidence (official government source)
- [Shopify Help Center: Localization and translation](https://help.shopify.com/en/manual/international/localization-and-translation) — HIGH confidence (official platform documentation)
- [Weglot guide: Shopify Language Switcher](https://www.weglot.com/guides/shopify-language-switcher) — MEDIUM confidence (vendor guidance, but consistent UX conventions)
- [Print on Demand pros/cons — Arts To Hearts Project](https://artstoheartsproject.com/the-pros-and-cons-of-print-on-demand/) — MEDIUM confidence
- [Standard Art Print Sizes: The Complete Chart — Bello](https://bello.art/resources/print-size-guide) — LOW-MEDIUM confidence (single source, general convention only)

**Note:** French e-commerce legal requirements (mentions légales, CGV, GDPR, 14-day withdrawal right) are well-converged across multiple sources including an official French government source, so table-stakes legal features are HIGH confidence in substance. However, the exact legal copy/wording for Romane's specific business status (auto-entrepreneur vs. other) should be verified with a French legal resource or accountant before launch — this research establishes *that* these pages/mechanisms are required, not their precise legal text.

---
*Feature research for: Photographer/artist portfolio + fine-art e-commerce site (Atelier Jacqueline Suzanne)*
*Researched: 2026-07-05*
