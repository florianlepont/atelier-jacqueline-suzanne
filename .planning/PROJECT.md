# Atelier Jacqueline Suzanne — Website

## What This Is

A bilingual (French/English) website for Romane Lepont's photography and artistic practice, "Atelier Jacqueline Suzanne." It replaces her current Myportfolio-based site (atelierjacquelinesuzanne.fr) with a custom build that showcases her work, tells visitors who she is, sells her art with real online checkout, and lists her exhibitions. Built by her brother (a developer) as a near-zero-cost custom site — not a SaaS site builder.

## Core Value

Visitors can browse Romane's photographic work and buy a piece (print, original, book, or merch) through a real, working checkout — everything else supports that. **Delivered in two milestones**: v1 replaces the current site fast with portfolio/about/contact so the old Myportfolio site can be retired sooner; v1.x adds exhibitions, the shop, and checkout on top of that foundation.

## Requirements

### Validated

(None yet — ship to validate)

### Active

**v1 (replace current site):**
- [ ] Visitor can browse a portfolio of photo galleries/projects (migrated from the current site: Rebut, Silos, Brume, Adults, The Victorian Tea Room, Paysages, Accumulation, MADO, etc.)
- [ ] Visitor can read an About/bio page covering Romane's background, artistic approach, and atelier/practice info
- [ ] Visitor can contact Romane (contact page/form)
- [ ] Site is available in French and English with a language switcher
- [ ] Romane (non-technical) can independently update galleries/photos without touching code
- [ ] Site is reachable at the existing domain, atelierjacquelinesuzanne.fr

**v1.x (add shop, deferred until v1 is live — see REQUIREMENTS.md v2 section):**
- [ ] Visitor can view a list of upcoming and past exhibitions (dates, location, description)
- [ ] Visitor can browse products for sale: fine art prints, original artworks, books/zines, other merchandise
- [ ] Visitor can complete a real online purchase (cart + payment, e.g. Stripe) without manual intervention
- [ ] Product stock is tracked — one-of-a-kind originals show as sold out after purchase; limited editions decrement available quantity
- [ ] Site supports shipping to France and the rest of Europe
- [ ] Romane can independently update the exhibitions/agenda without touching code

### Out of Scope

- Exhibition booking/RSVP or ticketing — agenda is informational only (list of dates/locations), not interactive
- Worldwide shipping — limited to France + Europe for v1, to keep shipping/customs complexity down
- Press/mentions section on the About page — not requested for v1
- Calendar-view UI for exhibitions — a simple list is sufficient for v1

## Context

- Replaces an existing live site (atelierjacquelinesuzanne.fr), currently built on Myportfolio/Format, French-only, with galleries (Rebut - Édition, Silo - Édition, Silos, Brume, Adults, The Victorian Tea Room, Paysages, Accumulation, MADO), a Contact page, and an Instagram link (@ajs_romanelepont). No shop or exhibitions section exists today.
- This is a full replacement, not an addition — the old site's content (galleries) migrates in; the platform itself is being replaced.
- Builder (Florian) is Romane's brother, building this as a custom-coded project rather than configuring an existing SaaS builder.
- Budget is near-zero: free-tier hosting and free/open-source tooling preferred, accepting only unavoidable per-transaction payment processing fees (e.g. Stripe).
- Romane is not a developer. Whatever content-editing solution is chosen must be simple enough for her to add photos and update the exhibitions list herself, while staying within the near-zero budget (e.g. a free-tier headless CMS rather than a paid enterprise one).
- Research (`.planning/research/`) recommended Astro + Cloudflare Pages + Sanity CMS + custom Stripe Checkout. Florian already has OVH Web Hosting in place (sunk cost, not incremental budget) and wants to use it instead of Cloudflare Pages — the site (Astro, static output for v1) deploys to OVH hosting instead. Sanity's CMS/image CDN is host-agnostic and still applies regardless of where the static site is served. Key risk (for the future v1.x checkout milestone, not v1): Stripe doesn't manage inventory, so stock must be tracked and atomically re-validated server-side to avoid overselling one-of-a-kind originals — OVH's mutualized hosting may not support the serverless functions this needs, so the hosting approach for server-side logic will need re-evaluating when v1.x is planned.
- French e-commerce legal requirements (mentions légales, CGV incl. 14-day droit de rétractation, GDPR/cookie consent) are mandatory before any live transaction. Separately, Stripe payouts require Romane to have a registered business (SIRET) in France — this has its own lead time and should be tracked as an early, parallel administrative task, not a blocker gating development.

## Constraints

- **Budget**: Near-zero recurring cost (~0-5€/month target) for hosting/CMS/tools — only per-transaction payment fees (Stripe) are accepted as a given cost.
- **Tech stack**: Not yet decided — must support real e-commerce checkout, stock tracking, bilingual content, and non-technical content editing within the near-zero budget. To be resolved during research/roadmap.
- **Domain**: Must end up served from the existing domain atelierjacquelinesuzanne.fr.
- **Maintainer**: Romane (non-technical) needs to self-serve at least photo/gallery additions and exhibition/agenda updates post-launch.
- **Compliance**: Selling to France + Europe implies basic e-commerce legal requirements (mentions légales, CGV, GDPR-compliant checkout) — French/EU context.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Full replacement of current site, not an addition | User wants one unified site, not a portfolio site plus a bolted-on shop | — Pending |
| Real checkout (not inquiry-based selling) | User explicitly chose full e-commerce over manual/inquiry-based sales | — Pending |
| Bilingual French + English | Current content already mixes French and English project titles; wider audience reach | — Pending |
| Shipping limited to France + Europe | Balances reach against shipping/customs complexity | — Pending |
| Track stock for originals and limited editions | Originals are one-of-a-kind and must not oversell; editions are limited runs | — Pending |
| Near-zero budget tooling | Personal/family project, cost sensitivity is explicit and primary | — Pending |
| Stack: Astro (static) + OVH Web Hosting + Sanity + custom Stripe Checkout (v1.x) | Florian already has OVH hosting (sunk cost); overrides research's Cloudflare Pages recommendation for hosting specifically. Sanity CMS/image CDN still applies regardless of host. | — Pending |
| Track Romane's SIRET/business registration as an early parallel roadmap item | Stripe payouts require it; has its own lead time separate from dev work | — Pending |
| Defer COA messaging, edition numbering, room mockups, newsletter to v1.x | Not required to prove the core shop works; keeps v1 scope focused on launch-blocking essentials | — Pending |
| Include per-project artist statements in v1 | User chose to write these before launch rather than defer | — Pending |
| Phased launch: v1 = portfolio/about/contact only; v1.x = exhibitions + shop + checkout + shipping | User wants the old Myportfolio site replaced quickly without waiting for the full shop to be built | — Pending |
| Commerce-specific legal pages (CGV, droit de rétractation acknowledgment) move to v1.x with the shop | Only needed once there's something to sell; mentions légales/privacy/cookies still ship in v1 for the content-only site | — Pending |
| Phase 1 staging deploys to GitHub Pages, not an OVH subdomain | Discovered during Phase 1 execution (2026-07-06): OVH's "Free hosting" tier cannot attach any additional domain/subdomain to a Hébergement Mutualisé (multisite is unavailable on this tier at all, not just cert-delayed). GitHub Pages reuses the existing GitHub repo (zero new signup) and gets automatic free HTTPS. OVH remains the production target for the real domain cutover in Phase 5, using the confirmed SFTP protocol (host `ftp.cluster129.hosting.ovh.net`, user `atelihu`, home dir `/home/atelihu`, SFTP enabled on port 22 — better than the FTPS originally assumed). | Confirmed |
| Contact form delivery (CONT-01) left non-functional until Phase 5 — will switch from Web3Forms to OVH PHP `mail()` | Phase 3 shipped the contact form wired to Web3Forms (client-side POST, no backend needed — required on GitHub Pages, which has zero server compute), but no Web3Forms account/access key was ever provisioned. Florian (2026-07-08) confirmed during Phase 4 discussion that **OVH's built-in PHP `mail()` is the confirmed target delivery mechanism** once Phase 5 (OVH domain cutover) lands — not just one option to "reconsider," as originally framed on 2026-07-08. Until Phase 5 rewires delivery to OVH mail(), the live contact form shows a generic submission error to visitors. Tracked as gap `CONT-DELIVERY-01` in `03-HUMAN-UAT.md`, `resolves_phase: 5`. Phase 4's privacy policy is written around this OVH-mail() end state, not Web3Forms. | Deferred to Phase 5 — mechanism confirmed as OVH mail() |
| Legal-content accuracy (identity, OVH host block, D-10 business-status wording, D-09 address/phone placeholder) requires explicit human sign-off before launch, not just automated test coverage | A mentions légales / privacy page that renders and passes e2e tests can still disclose an inaccurate legal identity or business status — no automated check can catch that. Phase 4's Plan 03 was a blocking, never-auto-approvable human-verify checkpoint for exactly this reason. | Confirmed — Florian signed off 2026-07-08 (04-03-SUMMARY.md), no corrections requested |
| Rebrand: adopt the imported design system's monochrome + pop-pink identity (`#FFFFFF` dominant, `#1A1A1A` ink, `#FF3B94` accent, Archivo Black display font), superseding Phase 2's Dawn Pink / Woodsmoke / Wild Strawberry / Delight identity | Florian imported a design system + homepage prototype generated via Claude Design (see `.planning/design-import/`). The generated system was built from a stale, pre-Phase-2 repo snapshot and flagged the conflict itself; Florian explicitly chose to switch to its palette as the real rebrand direction rather than keep Phase 2's shipped identity. Two new phases inserted before Phase 5 to execute this: design-system/homepage refresh, and social media links. | Confirmed — Florian's explicit choice 2026-07-08, see `.planning/design-import/README.md` |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-08 after Phase 4 (Legal & Compliance) completion*
