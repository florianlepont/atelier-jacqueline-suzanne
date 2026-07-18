<!-- GSD:project-start source:PROJECT.md -->

## Project

**Atelier Jacqueline Suzanne — Website**

A bilingual (French/English) website for Romane Lepont's photography and artistic practice, "Atelier Jacqueline Suzanne." It replaces her current Myportfolio-based site (atelierjacquelinesuzanne.fr) with a custom build that showcases her work, tells visitors who she is, sells her art with real online checkout, and lists her exhibitions. Built by her brother (a developer) as a near-zero-cost custom site — not a SaaS site builder.

**Core Value:** Visitors can browse Romane's photographic work and buy a piece (print, original, book, or merch) through a real, working checkout — everything else supports that. **Delivered in two milestones**: v1 replaces the current site fast with portfolio/about/contact so the old Myportfolio site can be retired sooner; v1.x adds exhibitions, the shop, and checkout on top of that foundation.

### Constraints

- **Budget**: Near-zero recurring cost (~0-5€/month target) for hosting/CMS/tools — only per-transaction payment fees (Stripe) are accepted as a given cost.
- **Tech stack**: Not yet decided — must support real e-commerce checkout, stock tracking, bilingual content, and non-technical content editing within the near-zero budget. To be resolved during research/roadmap.
- **Domain**: Must end up served from the existing domain atelierjacquelinesuzanne.fr.
- **Maintainer**: Romane (non-technical) needs to self-serve at least photo/gallery additions and exhibition/agenda updates post-launch.
- **Compliance**: Selling to France + Europe implies basic e-commerce legal requirements (mentions légales, CGV, GDPR-compliant checkout) — French/EU context.

<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Astro** | 7.0.6 (latest, published 2026-07-02) | Site framework — static generation with selective server rendering | Content/image-heavy sites are Astro's core use case: zero JS by default, islands architecture only hydrates what needs interactivity (cart button, language switcher). Ships far less JS than Next.js for a mostly-static portfolio+shop, which matters directly for free-tier performance and Core Web Vitals/SEO. Astro 4+ has built-in i18n routing (no extra i18n library needed for basic locale routing). Verified current version via npm registry (not training data). |
| **@astrojs/cloudflare** | 14.1.1 (requires astro ^7.0.0, wrangler ^4.83.0) | Deployment adapter for Cloudflare Pages, enables API routes (Pages Functions) for checkout/webhook logic | Official adapter, actively maintained, matches the Astro 7 line. Lets the site stay static (prerendered) for all content pages while a handful of dynamic endpoints (`/api/create-checkout`, `/api/stripe-webhook`) run as Cloudflare Pages Functions. |
| **Cloudflare Pages** | — (platform, not versioned) | Hosting + CDN + serverless functions | The only one of the "big three" (Cloudflare/Netlify/Vercel) with **no bandwidth cap on the free tier** — image-heavy portfolio sites can hit Vercel's 100GB/mo or Netlify's ~15GB/mo free ceiling quickly; Cloudflare's free plan has no hard bandwidth limit (fair-use only, no surprise bill, no throttling). Free tier also includes 100,000 Function requests/day (Workers+Pages Functions share one quota) — vastly more than a small shop needs for checkout/webhook traffic. |
| **Sanity** (Content Lake + Studio) | `sanity` v4 CLI / `@sanity/client` 7.23.0 / `@sanity/image-url` 2.1.1 | Headless CMS for galleries, About content, exhibitions/agenda, and product records (incl. stock quantity field) | Purpose-built editor UI (not a git-based tool) — no GitHub/git concepts exposed to a non-technical user. Free plan (verified on sanity.io/pricing, 2026) includes: up to 20 user seats, 2 datasets, 1M CDN API requests/mo, 250k standard API requests/mo, 100GB asset storage, 100GB bandwidth/mo, 10k documents, 2 GROQ-powered webhooks. This is generous enough to run the whole site's content + product/stock data with zero cost. Studio is a free, self-hosted-by-Sanity admin app the artist logs into with an email invite — closest thing to a "real CMS" experience without a server to maintain. |
| **Stripe** (Checkout Sessions + Webhooks, `stripe` npm 22.3.0) | API version pinned per account | Payment processing, checkout, EU/France card + VAT handling | Industry-standard for a solo/small EU seller; no monthly fee, only per-transaction cost (see Cost Implications below). Stripe Checkout is a hosted page (Stripe maintains PCI compliance, SCA/3DS, Apple/Google Pay) — avoids building/maintaining a custom payment form. Supports `shipping_address_collection` restricted to France + EU countries, matching the shipping-scope constraint. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@astrojs/react` (or `@astrojs/preact`) | 6.0.1 | Islands for interactive bits: cart widget, checkout button, language switcher state | Only hydrate the cart/checkout UI; keep galleries/exhibitions as static Astro components (no framework needed there). |
| `stripe` (Node SDK) | 22.3.0 | Create Checkout Sessions server-side, verify/handle webhooks | Use `stripe.webhooks.constructEventAsync()` (not the sync `constructEvent`) inside the Cloudflare Pages Function — Cloudflare Workers' runtime lacks Node's `crypto` module, so the async + Web Crypto (`SubtleCryptoProvider`) path is required. Confirmed as an officially supported, documented pattern (Cloudflare's own blog covers native Stripe SDK support in Workers). With stripe-node ≥ v11.10, `node_compat` in `wrangler.toml` is no longer required. |
| `sharp` | 0.35.3 | Build-time image optimization (resize/format conversion for `astro:assets`) | Runs during the CI build step (Node.js environment), not inside the Cloudflare Workers runtime — so it works fine for prerendered pages. Do **not** rely on it for on-demand/SSR image generation on Cloudflare (see Version Compatibility below). |
| `@sanity/image-url` | 2.1.1 | Build transformed image URLs from Sanity asset refs at build time | Used only during the Astro build to fetch/resize source images from Sanity's asset CDN into locally-optimized, Cloudflare-served images — keeps runtime image bandwidth off Sanity's 100GB/mo free quota and onto Cloudflare's uncapped free bandwidth. |
| `astro:i18n` (built-in, no install) | Astro 7 core | Locale routing, `getRelativeLocaleUrl()` / `getAbsoluteLocaleUrl()` helpers | Configure `defaultLocale`, `locales: ['fr','en']`, `routing: { prefixDefaultLocale: false }` in `astro.config.mjs` so French (primary market) serves at root paths and English lives under `/en/`. No third-party i18n library needed for a 2-locale content site. |
| Cloudflare Pages "Deploy Hooks" (built-in feature, no package) | — | Trigger a full static rebuild when content changes in Sanity | Configure a Sanity webhook (GROQ-powered, free plan includes 2) that fires on document publish → hits a Cloudflare Pages deploy hook URL → rebuild picks up new galleries/exhibitions/stock. This is what lets a static-first architecture stay in sync with a non-technical editor's changes without manual redeploys. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Wrangler CLI | Local dev/preview of Cloudflare Pages Functions, deployment | `wrangler ^4.83.0` required by `@astrojs/cloudflare` 14.1.1. Free to use; no Cloudflare paid plan needed for local dev or deploys. |
| Stripe CLI | Local webhook testing (forwards Stripe events to localhost) | Free. Essential for testing the stock-decrement webhook flow before going live. |
| TypeScript | Type safety across Astro components, API routes, Sanity schema types | Astro ships TS support out of the box; use `sanity-codegen` or Sanity's own typegen (`sanity typegen`) to get typed content from schemas. |

## Installation

# Core

# Dev dependencies

# Sanity Studio (separate small project, deployed free via Sanity's own hosting or embedded as an Astro route)

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|--------------------------|
| Astro + Cloudflare Pages | Next.js + Vercel | If the developer strongly prefers React-everywhere and the site's image bandwidth is confidently expected to stay under Vercel's 100GB/mo Hobby cap. Otherwise Vercel's free bandwidth is the binding constraint for an image-heavy gallery site, and Astro ships less JS by default for content pages. |
| Cloudflare Pages | Netlify | Netlify's newer credit-based free tier (~15GB effective bandwidth/mo, 300 shared credits) is noticeably tighter than Cloudflare's uncapped free bandwidth — a real risk for a photo-heavy portfolio. Netlify remains a reasonable fallback if the team is already invested in its ecosystem (Netlify Forms, Identity), but not the best fit here. |
| Sanity (hosted headless CMS) | Keystatic / Decap CMS (git-based, MIT, fully free, zero external SaaS dependency) | If avoiding *any* third-party service (even a generous free tier) is a hard requirement, Keystatic is a strong zero-cost option built for Astro/Next.js, storing content as files in the git repo with a form-based admin UI. Trade-off: the artist's edits become git commits, GitHub auth is involved (abstracted by Keystatic's UI, but still a different mental model than "log into a CMS"), and non-technical friction is generally reported as slightly higher than a dedicated CMS UI like Sanity Studio. Recommended fallback if the developer wants zero external accounts to manage. |
| Sanity | Directus / Payload / Strapi (self-hosted, "real" CMS with DB) | Not recommended at this budget: all three need a persistent Node process + database, which is not free-tier-friendly (free-tier PaaS like Render sleeps the app, causing slow/failed admin logins; a real always-on host costs money). Only reconsider if scale/complexity outgrows Sanity's free plan (unlikely for one artist's catalog and agenda). |
| Stripe Checkout (dynamic `price_data`, no pre-created Stripe Products) | Snipcart | Snipcart bundles a full shopping-cart UI + built-in inventory management, which removes some custom-cart code — but it costs 2% per transaction, or a flat $20/month if monthly sales are under $1,000 (i.e., likely to hit the $20/mo floor for a small shop in early months, which conflicts with the near-zero budget target). Stripe Checkout has no platform fee beyond standard card processing. Reconsider Snipcart only if the developer wants to avoid writing any cart/stock logic and $20/mo (~18-19€) is acceptable. |
| Stripe (manual VAT / no Stripe Tax) | Stripe Tax | Stripe Tax automates EU VAT calculation/collection for an extra ~0.5% per transaction. Worth adding once turnover approaches thresholds where manual VAT handling (typical for a French micro-entrepreneur under the VAT franchise threshold) becomes impractical. Not needed at launch if Romane operates under the French VAT exemption threshold (micro-entrepreneur "franchise en base de TVA") — verify her registration status; this is a legal/business question, not a technical one, but it changes whether Stripe Tax is needed. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|--------------|
| Shopify / Squarespace / Wix / a hosted "Format"-style SaaS site builder | All have recurring monthly platform fees ($/€ 20-40+/mo typically) that directly violate the near-zero budget constraint, on top of payment fees. This is explicitly what the project is replacing (the current Myportfolio/Format site). | Custom Astro build on free-tier hosting, as above. |
| WordPress + WooCommerce | Needs a persistently-running PHP/MySQL host; "free" WordPress hosting tiers are typically low-resource, ad-supported, or time-limited trials, and WooCommerce's plugin ecosystem for stock/variant management adds ongoing maintenance burden disproportionate to a small, curated catalog. | Astro (static) + Sanity + Stripe, as above. |
| Stripe Checkout relying on `inventory_quantity` alone / no server-side stock check | Stripe does not natively enforce "one unit only" inventory limits inside Checkout — it only helps via session expiration (`expires_at`, `checkout.session.expired` webhook) to release *reserved* items after cart abandonment. Without your own pre-checkout stock check (reading current stock from Sanity before creating the session) and a post-payment decrement (in the `checkout.session.completed` webhook), a one-of-a-kind original **can be oversold** if two buyers checkout simultaneously. | Server-side stock check (via Sanity) before creating the Checkout Session + atomic decrement in the webhook handler + short `expires_at` (e.g., 30 min) on sessions for one-of-a-kind items to release abandoned carts quickly. |
| Building a full custom product/order database (Postgres/Mongo on a free-tier PaaS) just to track stock | Adds an entire extra service (with its own free-tier sleep/cold-start/limit risk, e.g. Render/Railway free tiers) for something Sanity can already do. | Store `stockQuantity` (and `soldOut` boolean for one-of-a-kind pieces) as fields directly on the Sanity product document; mutate them via the Sanity API from the Stripe webhook handler. One system serves as both CMS and inventory store. |
| Astro's default `sharp` image service left unconfigured on the Cloudflare adapter for any on-demand (SSR) image route | `@astrojs/cloudflare` is explicitly incompatible with the Sharp image service at *runtime* (Cloudflare Workers has no native Sharp bindings) — only build-time (`compile`) processing of prerendered images works. Leaving this misconfigured causes a documented, reproducible error ("adapter cloudflare is not compatible with image service Sharp") if any route needing on-demand image transforms isn't prerendered. | Keep all gallery/product pages prerendered (`export const prerender = true`, which is Astro's static default) so Sharp only ever runs at build time; explicitly set the adapter's runtime image config to `passthrough` (the default) rather than trying to force Sharp at runtime. |

## Stack Patterns by Variant

- Consider Stripe Payment Links (no code, created manually in Stripe dashboard per product) instead of Checkout Sessions built via API.
- Trade-off: stock/quantity limits per link are static (set once in the dashboard) and don't auto-sync with Sanity — acceptable only if the developer manually deactivates/edits links as originals sell, which reintroduces manual work the project is otherwise trying to avoid for the *artist*. Because stock tracking is an explicit requirement, this path is **not** the primary recommendation — it's listed only as a fallback if development time becomes the binding constraint rather than budget.
- Swap Sanity for Keystatic (git-based, MIT-licensed, content lives in the repo).
- Because content changes become git commits, pair it with Cloudflare Pages' git-integrated auto-deploy (push to `main` → auto rebuild) so there's no separate "trigger a deploy" step for the artist to think about.
- Reassess Snipcart or a small headless-commerce layer (e.g., Medusa self-hosted) — but only if free-tier budget is revisited, since both push past a pure static+Stripe architecture's zero-cost profile.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|------------------|-------|
| `astro@7.0.6` | `@astrojs/cloudflare@14.1.1` (peer: `astro ^7.0.0`, `wrangler ^4.83.0`) | Verified via npm registry `peerDependencies` — install `wrangler` at `^4.83.0` or newer alongside these. |
| `@astrojs/cloudflare` (Cloudflare Workers runtime) | `sharp` image service | Incompatible at **runtime**; only works at **build time** for prerendered routes. Configure image service as `{ service: 'compile' }` for build, leave runtime as default `passthrough`. Do not enable on-demand image transforms on non-prerendered routes without switching to Cloudflare's own Image Resizing (a paid Cloudflare feature) or accepting no runtime optimization. |
| `stripe@22.3.0` in Cloudflare Pages Functions | Must use `constructEventAsync` + `Stripe.createSubtleCryptoProvider()` + `Stripe.createFetchHttpClient()` | The synchronous `stripe.webhooks.constructEvent()` depends on Node's `crypto` module, unavailable in the Workers runtime. Cloudflare officially documents native Stripe SDK support in Workers using the async/Web-Crypto path; stripe-node ≥ v11.10 no longer needs `node_compat = true` in `wrangler.toml`. |
| `@sanity/client@7.23.0` | Works identically from any JS runtime (Node build step or Cloudflare Workers Function) | Use it both at Astro build time (fetch content for static generation) and inside the Stripe webhook Function (write stock decrements) — same client, two contexts. |

## Cost Implications (explicit, against the ~0-5€/month target)

| Item | Cost | Notes |
|------|------|-------|
| Cloudflare Pages hosting + Functions | **0€/month** | No bandwidth cap on free tier (fair-use only); 100k Function requests/day free, shared with Workers — far beyond a small shop's checkout/webhook volume. |
| Sanity (Content Lake + Studio) | **0€/month** | Free plan limits (100GB bandwidth/mo, 100GB asset storage, 1M CDN requests/mo, 2 datasets, up to 20 seats) comfortably cover a single-artist catalog + agenda. Revisit only if the site scales far beyond a personal portfolio. |
| Domain (atelierjacquelinesuzanne.fr) | Existing/already owned | Not a new cost — domain is already in use by the current site. |
| Stripe processing fees | **1.5% + 0.25€ per transaction** for domestic French/EU cards; **+3.25%** surcharge for non-EU-issued cards; **+2%** if currency conversion is involved | Unavoidable, explicitly accepted by the project constraints as the one non-zero recurring cost. No monthly Stripe platform fee — pay-as-you-go. |
| Stripe Tax (optional) | **+0.5%** per transaction if enabled | Only needed if automated EU VAT calculation/remittance becomes necessary (depends on Romane's VAT registration status — a business/legal question, not purely technical). Not required to launch. |
| Cloudflare Pages deploy hooks / Sanity webhooks | **0€/month** | Both are built-in features of the free tiers already counted above. |

## Sources

- npm registry (`npm view`, live query, 2026-07-05) — confirmed current versions: `astro@7.0.6`, `@astrojs/cloudflare@14.1.1`, `@astrojs/react@6.0.1`, `@sanity/client@7.23.0`, `@sanity/image-url@2.1.1`, `stripe@22.3.0`, `sharp@0.35.3`. HIGH confidence (primary source, not training data).
- https://developers.cloudflare.com/pages/platform/limits/ and https://developers.cloudflare.com/pages/functions/pricing/ — Cloudflare Pages/Functions free-tier limits (100k requests/day shared Workers+Pages Functions quota, uncapped bandwidth). HIGH confidence (official docs).
- https://www.sanity.io/pricing (fetched directly, 2026-07-05) — Free plan limits: 20 seats, 2 datasets, 1M CDN API requests/mo, 250k standard API requests/mo, 100GB asset storage, 100GB bandwidth/mo, 10k documents, 2 GROQ-powered webhooks. HIGH confidence (official pricing page, fetched live — note this superseded an inconsistent, apparently stale, third-party summary found in initial WebSearch results).
- https://docs.stripe.com/payments/checkout/managing-limited-inventory — official guidance on `expires_at` and `checkout.session.expired` for inventory reservation; confirms Stripe does not natively enforce hard stock limits, requiring custom logic. HIGH confidence (official docs).
- https://docs.astro.build/en/guides/ecommerce/ — official Astro e-commerce guide (mentions Lemon Squeezy, Paddle, Snipcart; does not feature Stripe directly, confirming the Stripe+Checkout-Session integration pattern used here is a community/custom pattern rather than an Astro-blessed one-liner). MEDIUM confidence.
- https://docs.astro.build/en/guides/internationalization/ and https://docs.astro.build/en/recipes/i18n/ — built-in i18n routing since Astro 4.0, `astro:i18n` helpers. HIGH confidence (official docs).
- https://blog.cloudflare.com/announcing-stripe-support-in-workers/ and https://developers.cloudflare.com — official confirmation of native Stripe SDK support (`constructEventAsync`, Web Crypto provider) in Cloudflare Workers/Pages Functions. HIGH confidence (official Cloudflare source).
- GitHub `withastro/adapters` issues #191, #266 and `withastro/astro` issue #10499 — documented Sharp/Cloudflare adapter incompatibility at runtime, resolved via `compile` (build-time) vs `passthrough` (runtime) image service split. MEDIUM-HIGH confidence (maintainer-tracked issues on the official repo, cross-referenced with docs).
- WebSearch aggregation on Snipcart pricing (2% of transactions, or $20/month flat under $1,000/mo sales, forever-free dev/test tier) — cross-referenced across multiple pricing-comparison sources; MEDIUM confidence (not fetched directly from snipcart.com/pricing, but consistent across independent sources).
- WebSearch aggregation on Stripe France fee rates (1.5% + €0.25 domestic; +3.25% international card surcharge; +2% currency conversion) — consistent across multiple fee-calculator sources; MEDIUM confidence (recommend a final check against stripe.com/pricing or the France Stripe dashboard before launch, as these rates can change).
- WebSearch aggregation on Keystatic/Decap/TinaCMS comparison (git-based CMS licensing and non-technical editor suitability) — MEDIUM confidence, multiple independent comparison sources agree on the core facts (Keystatic MIT/free, TinaCMS Team plan $29-49/mo, Decap free but dated UI).
- WebSearch aggregation on Cloudflare Pages vs Netlify vs Vercel free-tier bandwidth — MEDIUM-HIGH confidence; Cloudflare's "uncapped bandwidth, fair-use only" claim is corroborated by Cloudflare's own docs (HIGH) plus independent comparison sources (real-world example: an 87GB/mo Cloudflare-hosted site incurred zero cost/intervention).

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.Codex/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-Codex-profile` -- do not edit manually.
<!-- GSD:profile-end -->
