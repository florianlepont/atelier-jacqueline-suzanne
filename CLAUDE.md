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

> Status (updated 2026-07-20): this section describes the actually-implemented stack. The original research plan (Cloudflare Pages hosting, the `@astrojs/cloudflare` adapter, and Stripe-in-Workers checkout) was superseded — see PROJECT.md Key Decisions and STATE.md Phase 01 decisions. E-commerce is deferred to the v1.x milestone.

### Core Technologies

| Technology | Version | Purpose | Notes |
|------------|---------|---------|-------|
| **Astro** | 7.0.6 | Static site framework — `output: 'static'` in astro.config.mjs, with NO server-rendering integration installed | The config explicitly excludes the Cloudflare adapter, the Node adapter, and the Workers deploy CLI, because OVH Web Hosting is a zero-compute Apache file host. Zero-JS-by-default; built-in i18n. |
| **GitHub Pages** | — (platform) | Staging host — current public site, deployed by GitHub Actions | Project-page base path `/ajs-website/` injected via `ASTRO_BASE` at build time; live at https://florianlepont.github.io/ajs-website/. |
| **OVH Web Hosting** | — (platform, Phase 5, not yet cut over) | Production host; ultimately serves the real domain atelierjacquelinesuzanne.fr | Free tier, static files uploaded over SFTP; zero request-time compute, which is WHY the build is static-only. |
| **Sanity** (Content Lake + Studio) | `@sanity/client` 7.23.0 / `@sanity/image-url` 2.1.1 / Studio `sanity` ^6.4.0 | Headless CMS for galleries, About, site settings, agenda | Content fetched at BUILD time (published perspective only). Studio is the separate `sanity/` subproject with its own package.json. |
| **astro:i18n** (built-in, Astro 7 core) | — | fr/en locale routing | French served at root, English under `/en/`, no Accept-Language auto-redirect. |

### Supporting Libraries

| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| `@sanity/client` | 7.23.0 | Build-time GROQ content fetch from Sanity | Used both by the Astro build and could be reused server-side once compute exists. |
| `@sanity/image-url` | 2.1.1 | Build transformed Sanity image URLs at build time | Produces locally-optimized, statically-hosted image variants. |
| `@fontsource/unbounded` | ^5.2.8 | Self-hosted brand display font | No external font CDN dependency. |

### Development & CI Tools

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

The "browse and buy / checkout" language in the Project section above describes the v1.x milestone GOAL, not shipped v1 behavior. When commerce ships it will need a request-time compute surface (checkout session creation, webhook handling), which the current static-only OVH/GitHub Pages hosting cannot provide — so the hosting/adapter decision for commerce (e.g., Cloudflare Pages Functions, or another compute option) is deferred to that milestone and will be re-evaluated then.

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

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
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
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
