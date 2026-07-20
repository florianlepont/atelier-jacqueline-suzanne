# Stack Research

**Domain:** Bilingual photographer/artist portfolio + e-commerce (one-of-a-kind + limited-edition prints), near-zero budget
**Researched:** 2026-07-05
**Confidence:** HIGH (core framework/hosting choices verified against official docs and live npm registry) / MEDIUM (CMS and commerce-integration pattern, verified via multiple current sources but not Context7) / LOW (nothing in this file — flagged inline where applicable)

> Status (updated 2026-07-20): the implemented architecture diverged from the original research below — static Astro on GitHub Pages (staging) / OVH (production), no SSR adapter, and e-commerce deferred to v1.x. See PROJECT.md Key Decisions and STATE.md Phase 01 decisions.

## Core Technologies

| Technology | Version | Purpose | Notes |
|------------|---------|---------|-------|
| **Astro** | 7.0.6 | Static site framework — `output: 'static'` in astro.config.mjs, with NO server-rendering integration installed | The config explicitly excludes the Cloudflare adapter, the Node adapter, and the Workers deploy CLI, because OVH Web Hosting is a zero-compute Apache file host. Zero-JS-by-default; built-in i18n. |
| **GitHub Pages** | — (platform) | Staging host — current public site, deployed by GitHub Actions | Project-page base path `/ajs-website/` injected via `ASTRO_BASE` at build time; live at https://florianlepont.github.io/ajs-website/. |
| **OVH Web Hosting** | — (platform, Phase 5, not yet cut over) | Production host; ultimately serves the real domain atelierjacquelinesuzanne.fr | Free tier, static files uploaded over SFTP; zero request-time compute, which is WHY the build is static-only. |
| **Sanity** (Content Lake + Studio) | `@sanity/client` 7.23.0 / `@sanity/image-url` 2.1.1 / Studio `sanity` ^6.4.0 | Headless CMS for galleries, About, site settings, agenda | Content fetched at BUILD time (published perspective only). Studio is the separate `sanity/` subproject with its own package.json. |
| **astro:i18n** (built-in, Astro 7 core) | — | fr/en locale routing | French served at root, English under `/en/`, no Accept-Language auto-redirect. |

## Supporting Libraries

| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| `@sanity/client` | 7.23.0 | Build-time GROQ content fetch from Sanity | Used both by the Astro build and could be reused server-side once compute exists. |
| `@sanity/image-url` | 2.1.1 | Build transformed Sanity image URLs at build time | Produces locally-optimized, statically-hosted image variants. |
| `@fontsource/unbounded` | ^5.2.8 | Self-hosted brand display font | No external font CDN dependency. |

## Development & CI Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Vitest | 4.1.9 — unit tests (`npm run test:unit`) | Runs as a BLOCKING gate in CI before deploy. |
| Playwright | 1.61.1 — e2e tests (`npm run test:e2e`) | Runs as a BLOCKING gate in CI before deploy. |
| GitHub Actions | CI/CD pipeline (`.github/workflows/deploy.yml`) | Node 22 → `npm ci` → build (root base, test artifact) → Playwright e2e + Vitest unit as a BLOCKING gate → rebuild with GitHub Pages base → un-prefixed-link grep guard → deploy to GitHub Pages. Triggered on push to `main` and on `repository_dispatch (sanity-content-published)` fired by a Sanity publish webhook. |
| Sanity CLI | Studio dev/build/deploy, run from `sanity/` | `sanity dev` (localhost:3333), `sanity build`, `sanity deploy`. |
| TypeScript | Type safety across Astro components and config | Strict tsconfig; Astro ships TS support out of the box. |

## Deferred to v1.x (not yet implemented)

E-commerce is NOT present in the current codebase. None of the following is installed:

- **Stripe Checkout** — no `stripe` dependency, no checkout session or webhook code.
- **Server-side stock tracking** — no `stockQuantity`/`soldOut` fields on Sanity product documents yet.
- **EU/France shipping + VAT** handling.
- **Commerce legal** — CGV (terms of sale) and related e-commerce compliance pages.

The "browse and buy / checkout" language in the Project section describes the v1.x milestone GOAL, not shipped v1 behavior. When commerce ships it will need a request-time compute surface (checkout session creation, webhook handling), which the current static-only OVH/GitHub Pages hosting cannot provide — so the hosting/adapter decision for commerce (e.g., Cloudflare Pages Functions, or another compute option) is deferred to that milestone and will be re-evaluated then.

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|--------------|
| Shopify / Squarespace / Wix / a hosted "Format"-style SaaS site builder | All have recurring monthly platform fees ($/€ 20-40+/mo typically) that directly violate the near-zero budget constraint, on top of payment fees. This is explicitly what the project is replacing (the current Myportfolio/Format site). | Custom Astro build on free-tier hosting, as above. |
| WordPress + WooCommerce | Needs a persistently-running PHP/MySQL host; "free" WordPress hosting tiers are typically low-resource, ad-supported, or time-limited trials, and WooCommerce's plugin ecosystem for stock/variant management adds ongoing maintenance burden disproportionate to a small, curated catalog. | Astro (static) + Sanity, as above; Stripe once v1.x commerce ships. |
| A separate product/order database (Postgres/Mongo on a free-tier PaaS) just to track stock | Adds an entire extra service (with its own free-tier sleep/cold-start/limit risk) for something Sanity can already do. | When commerce ships, store `stockQuantity` (and `soldOut` for one-of-a-kind pieces) as fields directly on the Sanity product document. |

## Cost (against the ~0-5€/month target)

| Item | Cost | Notes |
|------|------|-------|
| GitHub Pages (staging) | **0€/month** | Free for public repos; current deploy target. |
| OVH Web Hosting (production, Phase 5) | Existing/already owned | Domain + hosting already in use by the current site — not a new recurring cost. |
| Sanity (Content Lake + Studio) | **0€/month** | Free plan comfortably covers a single-artist catalog + agenda. |
| Domain (atelierjacquelinesuzanne.fr) | Existing/already owned | Not a new cost. |
| Stripe processing fees | Applies only once v1.x commerce ships | Per-transaction only, no monthly platform fee. |

Several of the sources below informed the original (since-revised) Cloudflare/Stripe research plan; they remain as historical provenance for that plan, not for the implemented stack above.

## Sources

- npm registry (`npm view`, live query, 2026-07-05) — confirmed current versions: `astro@7.0.6`, `@astrojs/cloudflare@14.1.1`, `@astrojs/react@6.0.1`, `@sanity/client@7.23.0`, `@sanity/image-url@2.1.1`, `stripe@22.3.0`, `sharp@0.35.3`. HIGH confidence (primary source, not training data).
- https://developers.cloudflare.com/pages/platform/limits/ and https://developers.cloudflare.com/pages/functions/pricing/ — Cloudflare Pages/Functions free-tier limits (100k requests/day shared Workers+Pages Functions quota, uncapped bandwidth). HIGH confidence (official docs).
- https://www.sanity.io/pricing (fetched directly, 2026-07-05) — Free plan limits: 20 seats, 2 datasets, 1M CDN API requests/mo, 250k standard API requests/mo, 100GB asset storage, 100GB bandwidth/mo, 10k documents, 2 GROQ-powered webhooks. HIGH confidence (official pricing page, fetched live — note this superseded an inconsistent, apparently stale, third-party summary found in initial WebSearch results).
- https://docs.stripe.com/payments/checkout/managing-limited-inventory — official guidance on `expires_at` and `checkout.session.expired` for inventory reservation; confirms Stripe does not natively enforce hard stock limits, requiring custom logic. HIGH confidence (official docs).
- https://docs.astro.build/en/guides/ecommerce/ — official Astro e-commerce guide (mentions Lemon Squeezy, Paddle, Snipcart; does not feature Stripe directly, confirming the Stripe+Checkout-Session integration pattern used here is a community/custom pattern rather than an Astro-blessed one-liner). MEDIUM confidence.
- https://docs.astro.build/en/guides/internationalization/ and https://docs.astro.build/en/recipes/i18n/ — built-in i18n routing since Astro 4.0, `astro:i18n` helpers. HIGH confidence (official docs).
- https://blog.cloudflare.com/announcing-stripe-support-in-workers/ and https://developers.cloudflare.com — official confirmation of native Stripe SDK support (async Web Crypto signature-verification pattern) in Cloudflare Workers/Pages Functions. HIGH confidence (official Cloudflare source). This source informed the now-retired Stripe-in-Workers approach in the original plan.
- GitHub `withastro/adapters` issues #191, #266 and `withastro/astro` issue #10499 — documented Sharp/Cloudflare adapter incompatibility at runtime, resolved via `compile` (build-time) vs `passthrough` (runtime) image service split. MEDIUM-HIGH confidence (maintainer-tracked issues on the official repo, cross-referenced with docs).
- WebSearch aggregation on Snipcart pricing (2% of transactions, or $20/month flat under $1,000/mo sales, forever-free dev/test tier) — cross-referenced across multiple pricing-comparison sources; MEDIUM confidence (not fetched directly from snipcart.com/pricing, but consistent across independent sources).
- WebSearch aggregation on Stripe France fee rates (1.5% + €0.25 domestic; +3.25% international card surcharge; +2% currency conversion) — consistent across multiple fee-calculator sources; MEDIUM confidence (recommend a final check against stripe.com/pricing or the France Stripe dashboard before launch, as these rates can change).
- WebSearch aggregation on Keystatic/Decap/TinaCMS comparison (git-based CMS licensing and non-technical editor suitability) — MEDIUM confidence, multiple independent comparison sources agree on the core facts (Keystatic MIT/free, TinaCMS Team plan $29-49/mo, Decap free but dated UI).
- WebSearch aggregation on Cloudflare Pages vs Netlify vs Vercel free-tier bandwidth — MEDIUM-HIGH confidence; Cloudflare's "uncapped bandwidth, fair-use only" claim is corroborated by Cloudflare's own docs (HIGH) plus independent comparison sources (real-world example: an 87GB/mo Cloudflare-hosted site incurred zero cost/intervention).

---
*Stack research for: Bilingual photographer/artist portfolio + e-commerce, near-zero budget*
*Researched: 2026-07-05*
