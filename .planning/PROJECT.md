# Atelier Jacqueline Suzanne — Website

## What This Is

A bilingual (French/English) website for Romane Lepont's photography and artistic practice, "Atelier Jacqueline Suzanne." It replaces her current Myportfolio-based site (atelierjacquelinesuzanne.fr) with a custom build that showcases her work, tells visitors who she is, sells her art with real online checkout, and lists her exhibitions. Built by her brother (a developer) as a near-zero-cost custom site — not a SaaS site builder.

## Core Value

Visitors can browse Romane's photographic work and buy a piece (print, original, book, or merch) through a real, working checkout — everything else supports that. **Delivered in two milestones**: v1 replaces the current site fast with portfolio/about/contact so the old Myportfolio site can be retired sooner; v1.x adds exhibitions, the shop, and checkout on top of that foundation.

## Current Milestone: v1.6 Mobile Experience Redesign

**Goal:** Redesign the mobile (phone) experience only — desktop/tablet stays byte-for-byte unchanged — replacing the carousel/grid toggle and click-to-open lightbox with scroll-driven navigation across the Homepage, Gallery detail, and Édition detail pages.

**Target features:**
- Homepage (mobile): a mobile nav menu (hamburger or similar) replaces the header bar; the language switcher moves inside it
- Homepage (mobile): the carousel/grid toggle is removed; a single scroll-driven view (grid-mode style) replaces it, with each item's description text revealing on scroll-arrival via a new transition
- Homepage (mobile): the first screen (wordmark) goes full-screen; scrolling zooms through the letterform into the first gallery's photo — explored via sketch before implementation
- Homepage (mobile): the accent color is randomly picked per visit from the existing per-gallery `heroColor` field (the same mechanism the desktop carousel already uses) — homepage-only, no new palette
- Gallery detail (mobile): the click-to-open Lightbox is retired; scroll-driven navigation between full, uncropped photos replaces it
- Édition detail (mobile): the same scroll-driven navigation replaces the Lightbox; the intro/statement text gets a legible solid background instead of sitting over a photo; the primary photo is shown among the others rather than as a full-bleed backdrop
- About (mobile): the portrait photo's placement is improved — explored via sketch before implementation

**Process:** sketch-first for the riskiest/most subjective pieces (homepage letterform-zoom transition, Édition intro-text legibility redesign, About portrait placement) before real implementation, per user preference (2026-08-03). Desktop/tablet must remain unchanged throughout — every phase in this milestone needs an explicit no-desktop-regression guard.

v1.5 shipped 2026-08-03 (see archived brief below). Phase 5 (Launch & Domain Cutover) and the v1.x wave (Exhibitions, Shop, Checkout, Shipping, commerce Legal) remain open and deliberately deferred behind this milestone, per explicit user choice (2026-08-03) — see REQUIREMENTS.md v2 section.

<details>
<summary>Archived: v1.5 Global Improvements & Bug Fixes milestone brief (shipped 2026-08-03)</summary>

**Goal:** Clear a batch of 8 live-reported visual/interaction bugs and regressions across the homepage, gallery pages, the Éditions page, and Contact — most surfaced directly by Romane/Florian using the shipped v1.4 site, one a direct regression from Phase 16's post-merge overflow fix.

**Target features:**
- Homepage carousel no longer pauses its auto-advance when the pointer merely hovers the page (manual pause/play toggle unaffected)
- Homepage grid-mode intro paragraph displays in full, not truncated to 2 lines
- Gallery detail page's description text is no longer awkwardly truncated mid-sentence
- Gallery and Éditions thumbnail grids show photos without a black border frame
- Gallery pages show the site footer again (Éditions detail pages already do — no change needed there)
- Éditions overview page's title/description text follow the same row-hover accent color as the eyebrow/divider (currently don't — a real regression)
- Halftone dot-texture on Contact/About/Éditions bleeds to the true browser edge again, without reintroducing the horizontal-scroll bug the Phase 16 fix was containing
- Contact page's E-mail/Instagram link rows get horizontal margin so text doesn't touch the edges during the hover black-fill effect

**Note:** Phase 5 (Launch & Domain Cutover) and the v1.x wave (Exhibitions, Shop, Checkout, Shipping, commerce Legal, Éditions↔Portfolio cross-link) remain open and deliberately deferred, not part of this milestone.

</details>

<details>
<summary>Archived: v1.4 Editorial Design Consistency milestone brief (shipped 2026-08-01)</summary>

**Goal:** Extend the giant-title editorial identity established on Contact/Éditions (shared `PageTitleHeader` component: display title, halftone texture, hairline divider) to the About and 404 pages, closing the visual gap between them.

**Target features:**
- About page's title switches to the shared `PageTitleHeader` component (same font/size/position/halftone/divider as Contact and Éditions)
- About page's broader layout reworked for visual coherence with that identity (spacing rhythm, hairline treatment, section structure) — not just the title
- 404 page gets the same visual redesign (currently a bare, unstyled fallback page with no editorial treatment) — content/copy unchanged, no added navigation links (decided: visual redesign only, not a navigation-recovery redesign)

**Note:** v1.3 Éditions (shipped 2026-07-23) is fully live on `main`/GitHub Pages staging. Phase 5 (Launch & Domain Cutover) and the broader v1.x candidates (Exhibitions, Shop, Checkout, Shipping, commerce Legal, Éditions↔Portfolio cross-link — tracked in REQUIREMENTS.md's v2 section) remain open and deliberately deferred, not part of this milestone.

</details>

<details>
<summary>Archived: v1.3 Éditions milestone brief (shipped 2026-07-23)</summary>

**Goal:** Give Romane's paper éditions (zines/books) their own dedicated, self-serve showcase on the site — separate from the photography portfolio — laying groundwork for selling them later.

**Target features:**
- New "Éditions" top-level nav item (main nav only, not surfaced on the homepage carousel/grid, which stays pure photography)
- Éditions overview page listing each édition (title + lead photo)
- Per-édition detail page: full photo shoot, short description/statement, format details (page count, print run, dimensions)
- No pricing/availability/buy button yet — pure showcase; selling is deferred to the existing v1.x shop/checkout milestone (this pulls the "books/zines" category from REQUIREMENTS.md's v2 Shop section forward as a non-transactional teaser)
- Romane can self-serve add new éditions via Sanity, same content-editing pattern as galleries (overview + detail page, mirroring Portfolio's gallery/gallery-detail structure)
- Bilingual FR/EN like the rest of the site

**Note:** Prior milestones — v1.0 (Phases 1–4.3), v1.1 Homepage Refinements (Phase 6, shipped 2026-07-13), and v1.2 Homepage Polish (Phases 7–10, shipped 2026-07-20) — are functionally complete. Phase 5 (DNS cutover to atelierjacquelinesuzanne.fr) remains open and deliberately deferred, by explicit user choice; it is not part of this milestone.

</details>

## Requirements

### Validated

**v1.0 MVP (Phases 1-4, 04.1-04.3, shipped 2026-07-12 — see `.planning/MILESTONES.md`):**
- [x] Visitor can browse a portfolio of photo galleries/projects, migrated from the current site (Rebut, Silos, Brume, Adults, The Victorian Tea Room, Paysages, Accumulation, MADO, etc.) — PORT-01/02/03, Phase 2
- [x] Visitor can read an About/bio page covering Romane's background, artistic approach, and atelier/practice info — ABOUT-01/02, Phase 3
- [x] Visitor can contact Romane via a spam-protected contact form — CONT-01/02, Phase 3 (delivery mechanism itself still pending Phase 5's OVH cutover — see Key Decisions)
- [x] Site is available in French and English with a persistent language switcher — I18N-01/02, Phase 1
- [x] Romane (non-technical) can independently add/edit portfolio galleries and images without touching code — CMS-01, Phase 2
- [x] Site displays mentions légales, a privacy/GDPR notice, and a CNIL-compliant cookie consent banner — LEGAL-01/03/05, Phase 4

**v1.1 (Homepage Refinements — Phase 6, shipped 2026-07-13):**
- [x] Visitor toggles between carousel and grid view via a single unified button (not two separate mode buttons) — Phase 6
- [x] In grid view, the hero is the first tile of the grid (not a separate full-width band above it), with its intro paragraph as overlay text and no CTA button — Phase 6
- [x] The "Atelier Jacqueline Suzanne" wordmark uses a transparent cutout effect revealing the photo behind the letters, at least in carousel mode — Phase 6

**v1.2 (Homepage Quick Fixes & Mobile Hero Correctness — Phase 7, shipped 2026-07-13):**
- [x] Visitor can reach Romane's Instagram via an icon link in the header nav (HOME-04) — Phase 7
- [x] The carousel/grid toggle button has a square border (HOME-05) — Phase 7
- [x] Mobile hero is genuinely full-bleed on first load — no white gap above the header, no footer bleed-through (HOME-06) — Phase 7

**v1.2 (Gallery Descriptions — Phase 8, shipped 2026-07-14):**
- [x] Each gallery's own description text shows under its title on the homepage, replacing the generic byline (HOME-07) — Phase 8
- [x] Hovering a grid-mode tile reveals that collection's description (HOME-08) — Phase 8

**v1.2 (Progressive Homepage Image Loading — Phase 9, shipped 2026-07-14):**
- [x] Homepage photos load progressively (priority + blur-to-sharp), no blocking loading screen (HOME-09) — Phase 9

**v1.2 (Unified Header & Simplified Language Switcher — Phase 10, shipped 2026-07-20):**
- [x] Homepage header is visually identical to the About/Contact header by construction (shared `<SiteHeader>` component) (HOME-10) — Phase 10
- [x] Language switcher shows only the other language (plus a globe icon), not both FR/EN (I18N-04) — Phase 10

**v1.3 (Data-Fetch Layer & Routes — Phase 12, shipped 2026-07-22):**
- [x] Visitor can browse an overview list of Romane's paper éditions (title + lead photo per édition) (EDN-02) — Phase 12
- [x] Visitor can open a per-édition detail page showing its full photo shoot, a short description/statement, and format details (page count, print run, dimensions) (EDN-03, EDN-04, EDN-05) — Phase 12 (format-detail schema fields added in Phase 11)
- [x] Éditions overview/detail pages carry no pricing, availability, or purchase CTA (EDN-06, build-blocking guard) — Phase 12
- [x] Éditions content is available in French and English (EDN-07) — Phase 12

**v1.3 (Nav Integration — Phase 13, shipped 2026-07-23):**
- [x] Visitor can discover a dedicated "Éditions" section from the main site navigation, on every page, in both languages, with the nav label editable by Romane via Sanity (EDN-01) — Phase 13

**v1.3 (Verification & UAT — Phase 14, shipped 2026-07-23):**
- [x] Romane (non-technical) can independently add/edit éditions via Sanity without touching code (CMS-04) — genuinely confirmed by Romane's own hands-on create/edit/publish/drag-reorder pass in the hosted Studio (closing the drag-reorder gap `11-UAT.md` waived), not just Phase 11's automated implementation — Phase 14

**v1.4 (About Page Editorial Redesign — Phase 15, shipped 2026-07-29):**
- [x] About page's title uses the shared `PageTitleHeader` component, pixel-parity with Contact/Éditions (title/eyebrow land at the same distance from the site header) — ABOUT-03, Phase 15
- [x] About page's broader layout reworked for visual coherence with the Contact/Éditions editorial identity: standalone bio lead, circular portrait accent, pinned scroll-shrink hero-photo reveal, two-column numbered sections, chosen from a reviewed 3-variant design sketch (sketch-014) — ABOUT-04, Phase 15

**v1.4 (404 Page Editorial Redesign — Phase 16, shipped 2026-07-29):**
- [x] 404 page gets a fully custom, interactive redesign — full-bleed photo backdrop hard-cutting at a pointer/touch-proximity-driven rate (capped, finite ceiling), AJS logo + "404" marker + bilingual message over a dimming scrim, `prefers-reduced-motion` drift fallback — ERR-01, Phase 16

**v1.5 (Homepage Carousel & Intro Fixes — Phase 17, shipped 2026-08-02):**
- [x] Visitor can keep the homepage carousel auto-advancing while hovering over the page — pointer-hover pause removed, keyboard-focus pause and the manual toggle preserved unchanged — HOME-11, Phase 17
- [x] Visitor sees the homepage's grid-mode intro paragraph in full, not cut off after 2 lines — line-clamp removed entirely, no substitute cap — HOME-12, Phase 17

**v1.5 (Gallery & Éditions Display Fixes — Phase 18, shipped 2026-08-03):**
- [x] Visitor sees a gallery's full description on its detail page, not cut off mid-sentence — CSS clamp removed, bounded instead by an empirically-calibrated Sanity Studio max-length (700 chars, floor-checked against the longest published statement) — PORT-04, Phase 18
- [x] Visitor sees gallery and Éditions thumbnail images without a black border frame — border removed from the shared `.tile` rule (loading-state background kept); a live-caught follow-up (a ~3.5px bottom gap from an unset `display: block` on masonry-mode tile images) was diagnosed and fixed in the same UAT pass — PORT-05, Phase 18
- [x] Visitor sees the site footer on gallery pages — `hideFooter` prop removed from both locale routes, mirroring the already-working Éditions detail pages — PORT-06, Phase 18

**v1.5 (Site-Wide Visual Polish — Phase 19, shipped 2026-08-03):**
- [x] Visitor sees the Éditions page title/description change color together with the eyebrow/divider when hovering a row — root cause was a partial `:global()` wrap in `EditionsOverviewBody.astro` (only the `html.editions-row-active` prefix was exempted from the component's Astro scope-hash, so the trailing selector could never match elements rendered by `PageTitleHeader.astro`); fixed by wrapping the entire selector — EDN-09, Phase 19
- [x] Visitor sees the halftone dot texture extend to the true browser edges on Contact/About/Éditions again, with no horizontal scrollbar — replaced component-level `overflow-x: clip` (which hard-cut the texture, the visual defect) with geometry-based containment (`calc(50% - 50vw)` on the halftone itself, mask focal-point re-anchored), proven safe against Phase 16's `position: sticky` regression by a purpose-written regression net (7-page × 5-width overflow matrix + positive sticky assertions) written and proven green BEFORE the risky CSS was touched — UI-01, Phase 19
- [x] Visitor sees breathing room around the E-mail/Instagram text when the black hover-fill effect appears on Contact — horizontal `--space-md` padding added to `.contact-page__detail`; the `::before` hover-fill's `inset: 0` needed no compensation since it resolves against the padding box — CONT-03, Phase 19

v1.5 "Global Improvements & Bug Fixes" is now feature-complete: all 8 requirements (HOME-11, HOME-12, PORT-04, PORT-05, PORT-06, EDN-09, UI-01, CONT-03) shipped across Phases 17–19. Formal milestone close (`/gsd-complete-milestone v1.5`) not yet run.

**v1.6 (Mobile Experience Redesign — in progress):**
- [x] Mobile nav menu replacing the header bar, language switcher included — HOME-13, Phase 20 (a gap-closure plan, 20-06, was needed after live on-phone UAT: the switcher initially shipped as a fourth equal-weight primary link per D-04, then reversed to a small secondary-tier line above the Instagram link, which also gained the header's Instagram glyph; both re-verified independently before phase close)
- [x] Homepage per-visit random accent color (reusing existing per-gallery `heroColor`) on mobile — HOME-16, Phase 20

### Active

**v1.6 (Mobile Experience Redesign) — requirements being defined, see REQUIREMENTS.md:**
- [ ] Homepage carousel/grid toggle removed on mobile; single scroll-driven view with on-arrival description reveal
- [ ] Homepage full-screen wordmark with a letterform-zoom transition into the first gallery photo on mobile
- [ ] Gallery detail: Lightbox retired on mobile, replaced by scroll-driven full-photo navigation
- [ ] Édition detail: Lightbox retired on mobile, replaced by scroll-driven full-photo navigation; legible intro-text treatment
- [ ] About: improved mobile portrait placement
- [ ] Desktop/tablet behavior unchanged throughout

**v1.0 (Phase 5, deliberately deferred — not part of any shipped milestone):**
- [ ] Site is reachable at the existing domain, atelierjacquelinesuzanne.fr, via a rehearsed DNS cutover from the current Myportfolio site — LAUNCH-01, Phase 5: Launch & Domain Cutover. Explicit user decision (2026-07-27), reconfirmed at v1.0's retroactive close: *"cancel the initial plan to deliver and publish the website officially... we'll do it later."* Not abandoned — the site has kept shipping on GitHub Pages staging through v1.1/v1.2/v1.3 instead, and this stays open for whenever launch is next prioritized.

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
- **Open item (v1.3) — RESOLVED:** the shipped Portfolio already has a gallery titled "Rebut" (migrated in Phase 2, alongside Silos/Brume/etc.), and the new "Éditions" milestone adds a paper édition also named "Rebut" documented via its own photo shoot. Confirmed during Phase 11 (see Key Decisions below): these are the SAME underlying subject, presented as two distinct objects — the gallery shows the photographic work itself, the édition is a printed book/zine OF that photo collection. They stay as two separate documents/pages; the gallery is not moved, renamed, or merged into Éditions.
- This is a full replacement, not an addition — the old site's content (galleries) migrates in; the platform itself is being replaced.
- Builder (Florian) is Romane's brother, building this as a custom-coded project rather than configuring an existing SaaS builder.
- Budget is near-zero: free-tier hosting and free/open-source tooling preferred, accepting only unavoidable per-transaction payment processing fees (e.g. Stripe).
- Romane is not a developer. Whatever content-editing solution is chosen must be simple enough for her to add photos and update the exhibitions list herself, while staying within the near-zero budget (e.g. a free-tier headless CMS rather than a paid enterprise one).
- Research (`.planning/research/`) recommended Astro + Cloudflare Pages + Sanity CMS + custom Stripe Checkout. Florian already has OVH Web Hosting in place (sunk cost, not incremental budget) and wants to use it instead of Cloudflare Pages — the site (Astro, static output for v1) deploys to OVH hosting instead. Sanity's CMS/image CDN is host-agnostic and still applies regardless of where the static site is served. Key risk (for the future v1.x checkout milestone, not v1): Stripe doesn't manage inventory, so stock must be tracked and atomically re-validated server-side to avoid overselling one-of-a-kind originals — OVH's mutualized hosting may not support the serverless functions this needs, so the hosting approach for server-side logic will need re-evaluating when v1.x is planned.
- French e-commerce legal requirements (mentions légales, CGV incl. 14-day droit de rétractation, GDPR/cookie consent) are mandatory before any live transaction. Separately, Stripe payouts require Romane to have a registered business (SIRET) in France — this has its own lead time and should be tracked as an early, parallel administrative task, not a blocker gating development.
- As of v1.4's close (2026-08-01), every page's title treatment (Contact, Éditions, About) and the 404 fallback now share the same editorial identity (`PageTitleHeader` giant-title + halftone + hairline divider, or the 404's own custom photo-backdrop concept). All shipped work lives on `main`; no other branches remain, local or on GitHub. The only open v1 phase is Phase 5 (Launch & Domain Cutover); the v1.x shop/checkout/exhibitions wave remains unscoped in REQUIREMENTS.md's v2 section.
- As of v1.5's close (2026-08-03), all 8 live-reported bugs/regressions from the shipped v1.4 site are fixed and verified: homepage carousel/intro (Phase 17), gallery/Éditions display (Phase 18), and the shared-component visual polish batch — Éditions row-hover, halftone bleed, Contact spacing (Phase 19). One known, documented, non-blocking residual from UI-01: on platforms with space-taking (non-overlay) scrollbars, viewport units used for the halftone's full-bleed geometry can theoretically extend ~half a scrollbar-width past the client edge — flagged in `PageTitleHeader.astro`'s own comment with a documented guard-term remedy, not exercised by this repo's headless/overlay-scrollbar CI environment. `fix/homepage-editions-contact-ux` (noticed as an unmerged worktree during v1.5's close) was reviewed, iterated on live (4 rounds of follow-up correction — homepage carousel/cursor/grid-title, then three successive corrections to the Éditions photo-crop treatment), rebased onto `main`, and merged via PR #14 on 2026-08-03. `sketch-012-contact-finalize` remains an unrelated, unmerged worktree still pending Florian's review.

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
| v1.4 milestone close (2026-08-01): 7 stale pre-close-audit items acknowledged as deferred rather than resolved — the `knowledge-base.md` debug-index false positive, and 6 unexecuted 2026-07-22 Contact/Sanity-form quick-task plans superseded by the later sketch-013 Contact redesign and the studio-publication-workflow effort | Re-surfaced items from the v1.3 close (2026-07-23), none resolved in the interim, none blocking; documented rather than silently dropped | Confirmed — see STATE.md Deferred Items |
| Legal-content accuracy (identity, OVH host block, D-10 business-status wording, D-09 address/phone placeholder) requires explicit human sign-off before launch, not just automated test coverage | A mentions légales / privacy page that renders and passes e2e tests can still disclose an inaccurate legal identity or business status — no automated check can catch that. Phase 4's Plan 03 was a blocking, never-auto-approvable human-verify checkpoint for exactly this reason. | Confirmed — Florian signed off 2026-07-08 (04-03-SUMMARY.md), no corrections requested |
| Rebrand: adopt the imported design system's monochrome + pop-pink identity (`#FFFFFF` dominant, `#1A1A1A` ink, `#FF3B94` accent, Archivo Black display font), superseding Phase 2's Dawn Pink / Woodsmoke / Wild Strawberry / Delight identity | Florian imported a design system + homepage prototype generated via Claude Design (see `.planning/design-import/`). The generated system was built from a stale, pre-Phase-2 repo snapshot and flagged the conflict itself; Florian explicitly chose to switch to its palette as the real rebrand direction rather than keep Phase 2's shipped identity. Two new phases inserted before Phase 5 to execute this: design-system/homepage refresh, and social media links. | Confirmed — Florian's explicit choice 2026-07-08, see `.planning/design-import/README.md` |
| Phase 8 (HOME-07/HOME-08) implemented directly on `main` outside the `/gsd-plan-phase`→`/gsd-execute-phase` cycle, then retroactively verified and closed via `/gsd-discuss-phase 8` | Florian shipped the gallery-description byline/hover-reveal work himself (commits `38457dd`..`602d24b`, 2026-07-13/14), reusing the existing `gallery.statement` field from Phase 2 rather than adding a new schema field. `/gsd-discuss-phase 8` found it already complete with dedicated e2e coverage; Florian confirmed it as the intended deliverable rather than re-planning from scratch. | Confirmed — verified 2026-07-14 (13/13 unit tests, 23/23 e2e tests passing), see `.planning/phases/08-gallery-descriptions/08-SUMMARY.md` |
| Progressive image loading (HOME-09): blur-up placeholders sourced from Sanity's CDN `.blur()` param (no new dependency), applied to the hero on every swap and to grid tiles, with next-photo prefetch and a quick/subtle (~260ms) crossfade | User chose the more thorough option at every gray area during `/gsd-discuss-phase 9` — every-swap hero blur-up (not just first load), grid tiles included, and background prefetch — prioritizing a uniformly polished feel over minimizing implementation surface. Code review (09-REVIEW.md) found 4 warnings (missing image error handlers, listener accumulation, a test that would flake once more galleries are migrated) — all fixed in commit `39144b9`. The verifier also flagged the D-05 prefetch claim as code-present-but-unverified; rather than route to manual DevTools verification, an automated Playwright test asserting the actual network request was added (commit `65bfabc`) since it's a mechanical behavior, not a subjective judgment. | Confirmed — verified 2026-07-14 (7/7 must-haves, 76/76 e2e, 40/40 unit tests passing), see `.planning/phases/09-progressive-homepage-image-loading/09-VERIFICATION.md` |
| The Portfolio gallery "Rebut" and the new Éditions "Rebut" are the SAME underlying subject presented as two distinct objects — the gallery shows the photographs, the édition is the printed book/zine of that photo collection | Raised with and confirmed by Romane during Phase 11 (D-01/D-02), resolving the "Open item (v1.3)" ambiguity carried in this document's Context section since the v1.3 roadmap was created. They stay as two separate documents/pages — the gallery is not moved, renamed, or merged into Éditions (D-01). An optional future gallery↔édition cross-link (so a visitor can navigate from one to the other) is tracked separately as EDN-08 in REQUIREMENTS.md's v2 section, deferred to a future milestone — Phase 11 does not add a reference field or any cross-link UI now (D-03). | Confirmed — raised with and confirmed by Romane during Phase 11 (D-01/D-02) |
| Retroactively close v1.0/v1.1/v1.2 as formal milestones (MILESTONES.md entries, phase archives, git tags), and formally re-confirm Phase 5 (Launch & Domain Cutover) as deliberately deferred rather than left as ambiguous unfinished work | User request (2026-07-27): "make a formal shipped entry for the milestones and just cancel the initial plan to deliver and publish the website officially — we'll do it later." Closes the exact gap the v1.3 retrospective's own "What Was Inefficient" section flagged (milestone archival lagging actual delivery for v1.1/v1.2). Phase 5 stays open in ROADMAP.md, not deleted — "later" means deferred, not cancelled. | Confirmed — user decision 2026-07-27 |
| About page layout chosen via a 3-variant design sketch (sketch-014) before implementation, same process as the Contact page redesign | User preference, established during the Contact redesign, applied consistently to About (ABOUT-04) rather than a single unreviewed guess | Confirmed — Variant A (pure settle hero + re-skinned two-column grid) picked on first review, no feedback rounds, Phase 15 |
| 404 page redesigned as a fully custom, interactive concept (photo pool hard-cutting at a pointer/touch-proximity-driven rate) rather than reusing `PageTitleHeader` as originally scoped | User rejected the PageTitleHeader-reuse framing during `/gsd-discuss-phase 16` (2026-07-29) for a more distinctive, interactive treatment — see `16-CONTEXT.md` | Confirmed — shipped Phase 16, 2026-07-29 |
| 404 photo-pop rate cap raised from ≈3/sec to ≈6.7/sec (`MIN_INTERVAL_MS` 350ms→150ms), a knowing departure from WCAG 2.3.1 general-flash guidance for this one page | Live, user-requested override at plan 16-03's human-verify checkpoint after testing the original cap ("tant pis pour les flash effect"); presented with the risk and three concrete options, user chose the faster rate while keeping a finite ceiling | Confirmed — user override 2026-07-29, do not revert without the user raising the cap again (see `16-CONTEXT.md` D-10) |
| Shared `PageTitleHeader.astro` overflow bug (affecting About, Contact, and Éditions — not About-specific as first suspected) fixed post-merge: removed `white-space: nowrap` on the giant title and added site-wide `overflow-x: hidden` to `html, body` | GitHub Actions caught a real `main`-blocking regression (4 e2e failures on `/about/` at narrow widths) after the v1.4 PR merged; root-caused to a stale/false claim in the component's own comment that Contact already had a scoped overflow fix | Confirmed — fixed and verified zero-overflow across all 3 consumer pages + homepage + 404, both locales, 2026-07-29 |
| Homepage carousel's pointer-hover pause (HOME-11) removed entirely, not fixed/adjusted | Initial milestone scoping misread the live bug report as "add hover-pause"; user corrected during `/gsd-discuss-phase 17` ("c'est l'inverse, je ne veux plus que ça se mette en pause") — the auto-advance must never pause on mere pointer hover, only on keyboard focus or the explicit manual toggle. Removing hover-pause exposed a self-discovered regression (mouse-click focus + no hover-pause = permanent freeze on the clicked progress-dash), fixed in the same phase via a `:focus-visible`-gated blur | Confirmed — Phase 17, 2026-08-02 |
| PORT-04's overflow defence moved from CSS clamp to a Sanity Studio field-level max-length (700 chars) instead of a higher CSS line-clamp | User's explicit choice during Phase 18 discuss ("retirer sans filet mais mettre un nombre de caractère max dans le champ sur le studio") — prevention at the content-authoring source rather than truncation at display time, since `DetailHero` is a fixed-height sticky panel (unlike Phase 17's freely-growing homepage tile) | Confirmed — N=700 empirically derived (8 candidate lengths × 3 viewports against the real component), floor-checked against the longest published statement (453 chars, édition `entasse`) with 247 chars of margin, Phase 18 |
| Gallery/édition thumbnail `.tile` keeps its `background: var(--color-ink)` loading-state fallback while only the visible border declaration is removed | User's explicit choice during Phase 18 discuss — avoids a white/blank flash during lazy-image loading while scrolling; the border (unwanted frame) and the background (wanted fallback) are separate concerns | Confirmed — Phase 18; a live-caught follow-up bug (masonry-mode `.tile img` left at default `display: inline`, leaving a ~3.5px gap where the background bled through as a bottom-edge dark strip) was diagnosed and fixed in the same UAT session, with a new regression test added since the existing border-width check could not have caught a layout gap |
| `PageTitleHeader.astro`'s halftone bleed uses geometry-based containment (`calc(50% - 50vw)`) instead of the component-level `overflow-x: clip` that shipped in Phase 16 | Phase 19 planning measured that a clipping ancestor and a full-bleed child are mutually exclusive — the clip suppressed the bleed entirely rather than coexisting with it. `position: relative` + `isolation: isolate` kept on the header so it stays the halftone's containing block; a D-05 regression net (7-page × 5-width overflow matrix, positive `position: sticky` assertions for About's hero and DetailHero's pin) was written and proven green against the pre-change tree first, given this exact component broke production once before (Phase 16, 2026-07-29) | Confirmed — Phase 19, 18/18 new regression tests pass, full local CI gate green including both Playwright projects |
| Contact/Éditions single-word `<h1>` headings ("Contact", "Éditions") get `min-width: 0` on their CSS Grid titleblock item plus `overflow-wrap: break-word` on the h1 | Removing `PageTitleHeader`'s clip (Phase 19, UI-01) unmasked a latent, pre-existing bug: CSS Grid's default `min-width: auto` plus the h1's shrink-to-fit sizing overflowed 320px viewports by ~26px. Auto-fixed by the Phase 19 executor as an in-scope Rule 1 correction, not a separate requirement | Confirmed — Phase 19, verified via the same overflow-matrix regression net |
| Mobile nav panel's language switcher moved from a fourth equal-weight primary link (D-04 as originally decided) to a small secondary-tier line stacked above the Instagram link, at the same size/color; Instagram link gained the header's own SVG glyph | Live on-phone UAT (20-UAT.md Test 2) reversed D-04's switcher clause: "langage switch is supposed to be at the bottom, with the same font size of the instagram... for the instagram, can you put the instagram logo instead?" Closed by gap-closure plan 20-06; the underlying implementation of D-04's other clauses (primary tier styling, Instagram position/size, D-06 accent-pink elsewhere) was correct and untouched | Confirmed — Phase 20, re-verified 2026-08-04 (54/54 mobile-nav e2e including 7 new (20-06) tests, own screenshots, live coverage re-run) |

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
*Last updated: 2026-08-04 after Phase 20 (Mobile Navigation & Accent Color) — HOME-13 and HOME-16 validated. Includes gap-closure plan 20-06 (switcher hierarchy + Instagram glyph, per live UAT), independently re-verified and security-audited (19/19 threats closed) before close. Next: Phase 21 (Homepage Scroll Experience).*
