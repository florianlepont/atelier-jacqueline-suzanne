# Roadmap: Atelier Jacqueline Suzanne — Website

## Overview

This roadmap covers the **v1 milestone** (Phases 1–5): a fast, bilingual replacement of the current Myportfolio site with portfolio galleries, an About page, contact, baseline French legal pages, self-service gallery editing for Romane, and a rehearsed DNS cutover to the live domain. The journey starts with the bilingual/CMS/hosting foundation (since French/English and non-technical editing cross-cut every later page), moves through the two content pillars (portfolio, then about/contact), adds the legally-required pages, and ends with the domain cutover that retires the old site. Shop, checkout, shipping, and exhibitions (the v1.x wave) are explicitly deferred and are not represented here.

It also covers the **v1.1 milestone** (Phase 6): homepage refinements — a single unified carousel/grid toggle, a grid view whose hero is the first grid tile instead of a separate band, and a transparent photo-cutout treatment for the hero wordmark. Per PROJECT.md, this milestone is intended to land before Phase 5's domain cutover, even though its phase number is higher (phase numbers reflect milestone-arrival order, not strict execution sequence — see the note under Progress).

It also covers the **v1.2 milestone** (Phases 7–10): homepage polish before the Phase 5 domain cutover — social presence (Instagram icon in the header nav), visual consistency (square toggle border), a mobile full-bleed hero regression fix, per-gallery description text (replacing the generic byline, in both carousel and grid-hover form), progressive/optimized image loading, and a structural consolidation of the homepage header with the shared About/Contact header plus a simplified language switcher. Phases are sequenced by blast radius: small, contained homepage-only fixes first (Phase 7), a content-model addition shared across two display modes next (Phase 8), a self-contained performance change (Phase 9), and the higher-risk shared-component refactor last (Phase 10) — so the header/toggle groundwork laid in Phase 7 is carried forward into the unified component once, rather than rebuilt twice.

It also covers the **v1.3 milestone "Éditions"** (Phases 11–14): a dedicated, non-transactional showcase for Romane's paper éditions (zines/artist books), added as a new content type and route tree alongside the existing Portfolio galleries, with its own main-nav entry. The four phases are sequenced by dependency and blast radius, per direct research grounded in this codebase: the `edition` Sanity schema and seeded content come first since every later phase builds on that shape existing (Phase 11); the build-time data-fetch layer and bilingual overview/detail routes come next, verifiable in isolation before touching anything shared (Phase 12); nav wiring — the one part of this feature that touches every-page shared chrome (`SiteHeader`, rendered from two independent call sites) — comes third, once the routes it points to already exist and work (Phase 13); and a dedicated verification/UAT pass closes the milestone, because this feature's dominant risk class is omission bugs (a missed locale, a missed sitemap entry, a missed nav call site) that don't fail loudly and need an explicit checklist rather than incidental testing (Phase 14). Selling éditions (price, stock, checkout) remains deferred to the future v1.x shop/checkout milestone.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Bilingual Infrastructure** - Site scaffolding (Astro + OVH Web Hosting + Sanity) deployed with working FR/EN routing and a persistent language switcher (completed 2026-07-06)
- [x] **Phase 2: Portfolio Galleries** - Visitors can browse migrated galleries and full-size images; Romane can self-serve gallery edits via the CMS (completed 2026-07-07)
- [x] **Phase 3: About & Contact** - Visitors can read Romane's bio/practice info and reach her through a spam-protected contact form (reopened 2026-07-08 — verification found the About page ships placeholder-only content; gap-closure plan 03-03 added) (completed 2026-07-08)
- [x] **Phase 4: Legal & Compliance** - Mentions légales, privacy/GDPR notice, and CNIL-compliant cookie consent are live (completed 2026-07-08)
- [x] **Phase 04.1: Design System & Homepage Refresh (INSERTED)** - Adopt the imported design system's rebrand and rebuild the homepage per the imported prototype (completed 2026-07-10)
- [x] **Phase 04.2: Social Media Links (INSERTED)** - Instagram link visible in the footer and on the About/Contact page (completed 2026-07-10)
- [x] **Phase 04.3: Homepage Refinements (INSERTED)** - Logo hover crossfade, single gallery-browsing entry point, icon-based mode toggle, mobile hero fix, three-line wordmark, clickable gallery names (completed 2026-07-12)
- [ ] **Phase 5: Launch & Domain Cutover** - The new site is live at atelierjacquelinesuzanne.fr, replacing the old Myportfolio site
- [x] **Phase 6: Homepage View-Mode Toggle, Grid Hero & Wordmark Cutout** - Unified carousel/grid toggle button, grid view's hero becomes the first grid tile, and the wordmark gets a transparent photo-cutout treatment (completed 2026-07-13)
- [x] **Phase 7: Homepage Quick Fixes & Mobile Hero Correctness** - Instagram icon in the header nav, square toggle border, and a fix for the mobile full-bleed hero regression (completed 2026-07-13)
- [x] **Phase 8: Gallery Descriptions** - Each gallery's own description text replaces the generic byline under its title, and reveals on hover in grid mode (completed 2026-07-14)
- [x] **Phase 9: Progressive Homepage Image Loading** - Homepage photos load with priority and a blur-to-sharp transition, with no blocking full-screen loader (completed 2026-07-14)
- [x] **Phase 10: Unified Header & Simplified Language Switcher** - Homepage header consolidated into the shared About/Contact header component; language switcher shows only the other language plus a globe icon (completed 2026-07-17)
- [x] **Phase 11: Schema & Content Model** - A dedicated `edition` Sanity content type exists, seeded with real éditions content, ready for the site to fetch and render (completed 2026-07-22)
- [x] **Phase 12: Data-Fetch Layer & Routes** - Visitors can browse an Éditions overview page and open per-édition detail pages, bilingually, with zero commerce affordances (completed 2026-07-22)
- [x] **Phase 13: Nav Integration** - Visitors can discover Éditions from the main site nav on every page, without it appearing on the homepage's photography carousel/grid (gaps found 2026-07-23 — see 13-VERIFICATION.md) (completed 2026-07-23)
- [ ] **Phase 14: Verification & UAT** - The Éditions feature closes with no omission-class gaps (locale, sitemap, nav call sites) and the "no commerce" boundary confirmed to hold

## Phase Details

### Phase 1: Foundation & Bilingual Infrastructure

**Goal**: Establish the technical foundation (Astro static site + OVH Web Hosting + Sanity CMS) with working bilingual routing and a persistent language switcher, so every later content phase builds on proven i18n and CMS plumbing instead of retrofitting it.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: I18N-01, I18N-02
**Success Criteria** (what must be TRUE):

  1. Visitor can access the site under both `/fr/` and `/en/` URL paths with correctly localized UI chrome (nav, footer, etc.).
  2. Visitor can switch language via a persistent switcher that lands them on the equivalent page in the other language.
  3. The site is built as static output and deployed to OVH Web Hosting at a public URL, connected to a live Sanity CMS project with at least one locale-aware content type.

**Plans**: 5 plans
Plans:
**Wave 1**

- [x] 01-01-PLAN.md — Scaffold Astro project + i18n routing config + Playwright/Vitest harness + failing tests (Wave 1)
- [x] 01-02-PLAN.md — Rescoped (D-12/D-13): record confirmed OVH SFTP facts for Phase 5 + wire conditional astro.config.mjs base + enable GitHub Pages staging (Wave 1)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-03-PLAN.md — Sanity CMS: project + locale-aware siteSettings singleton + build-time getSiteSettings() helper (Wave 2)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 01-04-PLAN.md — Bilingual UI slice: switcher utility, BaseLayout chrome from Sanity, FR/EN homepages + 404, e2e GREEN (Wave 3)

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 01-05-PLAN.md — CI/CD: GitHub Actions build+test+deploy to GitHub Pages (rescoped per D-12) + Sanity rebuild webhook + verify live (Wave 4)

**UI hint**: yes

### Phase 2: Portfolio Galleries

**Goal**: Visitors can browse Romane's photographic work by project/series and view full-size images; Romane can independently add and edit galleries without code.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: PORT-01, PORT-02, PORT-03, CMS-01
**Success Criteria** (what must be TRUE):

  1. Visitor can browse a list of gallery/project pages migrated from the current site (Rebut, Silos, Brume, Adults, The Victorian Tea Room, Paysages, Accumulation, MADO, etc.).
  2. Visitor can open a gallery and view full-size images (lightbox or dedicated view).
  3. Visitor can read a short artist statement for each gallery/project, in both French and English.
  4. Romane can log into the CMS and add, edit, or reorder gallery images and create a new gallery entry without developer help.

**Plans**: 4 plans
Plans:
**Wave 1**

- [x] 02-01-PLAN.md — Gallery schema + Studio drag-ordering + typed read layer (getGalleries/getGallery, image builders) + navLabels.galleries + RED Wave 0 tests (Wave 1)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 02-02-PLAN.md — Site-wide visual identity: BaseLayout Dawn Pink/Woodsmoke/Wild Strawberry tokens, Delight font, two-weight Display system, galleries nav link, homepage Display (Wave 2)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 02-03-PLAN.md — Visitor browsing slice: GalleryGrid/GalleryCard + FR/EN listing & detail pages + full content migration (Wave 3)

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 02-04-PLAN.md — Full-size viewing slice: native-dialog Lightbox island (prev/next/keyboard/touch/counter) + wiring + CMS-01 & live verification (Wave 4)

**UI hint**: yes

### Phase 3: About & Contact

**Goal**: Visitors can learn who Romane is and her artistic/atelier practice, and can reach her directly through a spam-protected contact form.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: ABOUT-01, ABOUT-02, CONT-01, CONT-02
**Success Criteria** (what must be TRUE):

  1. Visitor can read an About page covering Romane's background and artistic approach, in both French and English.
  2. Visitor can read atelier/practice information (where she works, medium, techniques) on the About page.
  3. Visitor can submit a contact form and the message reaches Romane.
  4. Automated/bot submissions are blocked by a honeypot (or equivalent) without impacting real visitors.

**Plans**: 3 plans
Plans:
**Wave 1**

- [x] 03-01-PLAN.md — About page vertical slice: FR/EN hardcoded bio + atelier/practice placeholder copy (D-01/D-04 amendment, D-06), About nav link, RED→GREEN e2e (Wave 1)

**Wave 2** *(blocked on Wave 1 completion — shared BaseLayout.astro nav)*

- [x] 03-02-PLAN.md — Contact form vertical slice: pure validation/honeypot lib + vanilla-JS ContactForm island (Web3Forms fetch, inline success/error) + FR/EN pages + Contact nav link + unit/e2e + live-delivery human check (Wave 2)

**Gap closure** *(closes ABOUT-01/ABOUT-02 verification gaps — 03-VERIFICATION.md)*

- [x] 03-03-PLAN.md — About content resolution: blocking human-action checkpoint (Florian provides real FR/EN bio + atelier copy OR signs off on placeholder launch) then wires the outcome end-to-end (real content + updated e2e, or recorded override) (gap closure)

**UI hint**: yes

### Phase 4: Legal & Compliance

**Goal**: The content-only v1 site meets baseline French/EU legal requirements before public launch.
**Mode:** mvp
**Depends on**: Phase 1, Phase 3
**Requirements**: LEGAL-01, LEGAL-03, LEGAL-05
**Success Criteria** (what must be TRUE):

  1. Visitor can view a mentions légales page showing site owner identity, hosting provider, and business status, in both French and English.
  2. Visitor can view a privacy policy / GDPR notice describing what data is collected (e.g., via the contact form) and how it's used.
  3. Visitor sees a CNIL-compliant cookie/consent banner before any non-essential cookie is set (or the banner correctly reflects that none are used).

**Plans**: 3 plans
Plans:
**Wave 1**

- [x] 04-01-PLAN.md — Mentions légales bilingual slice + Wave 0 failing e2e harness + footer legal nav (LEGAL-01)

**Wave 2** *(blocked on Wave 1 — shared BaseLayout.astro footer + legal.spec.ts)*

- [x] 04-02-PLAN.md — Privacy policy bilingual slice (data flows + ajs_locale cookie disclosure, no banner) + privacy footer link (LEGAL-03, LEGAL-05)

**Wave 3** *(blocked on Wave 2)*

- [x] 04-03-PLAN.md — Legal-content accuracy human-verify checkpoint (name / OVH host / business status)

**UI hint**: yes

### Phase 04.3: Homepage Refinements (INSERTED)

**Goal:** Polish the Phase 04.1 homepage rebuild based on live user feedback — consistent logo hover behavior, a single gallery-browsing entry point, an icon-based mode toggle, a fixed mobile hero-visibility bug, a three-line wordmark treatment, and gallery names that link directly to their detail pages.
**Scope items:**

  1. Homepage logo gets the same hover/focus crossfade as `BaseLayout.astro`'s `.logo-mark` (dark chip + black/white crossfade) — `HomeCarousel.astro`'s own logo currently has no hover state.
  2. Delete the standalone `/galleries` listing page entirely (both locales) and remove "Galleries" from site nav everywhere — the homepage grid view is now the sole gallery-browsing entry point. Update internal links/CTAs that point to it (`HomeCarousel`'s "Discover other galleries" CTA, `BaseLayout` nav).
  3. Replace the "Carousel / Grid" text-label toggle buttons with icon-based buttons — same functionality, icon instead of text.
  4. Fix a real-device mobile bug where the homepage hero visually disappears on phone viewports, despite the existing `height:auto; min-height:600px` mobile CSS.
  5. Render the wordmark "Atelier Jacqueline Suzanne" as three explicit lines (Atelier / Jacqueline / Suzanne) instead of one, in both the carousel accent panel and grid intro.
  6. Make the gallery name clickable to reach that gallery's detail page in carousel mode (currently plain text); verify grid-mode tiles remain fully clickable.

**Requirements**: TBD (UI/UX refinement on top of shipped PORT-01/PORT-02 coverage — no new REQ-IDs)
**Depends on:** Phase 04.1, Phase 04.2
**Plans:** 3/3 plans complete

Plans:
**Wave 1** *(disjoint file sets — run in parallel)*

- [x] 04.3-01-PLAN.md — HomeCarousel refinements: logo hover crossfade, icon toggle, grid-mode CTA, three-line wordmark, clickable hero title, mobile hero fix (D-01/D-02/D-04/D-05/D-07/D-08/D-09/D-10) (Wave 1)
- [x] 04.3-02-PLAN.md — Remove standalone /galleries listing + dead GalleryCard, trim BaseLayout nav, repoint detail back-links home (D-03/D-04/D-06) (Wave 1)

**Wave 2** *(blocked on both Wave 1 plans — full e2e/unit green gate)*

- [x] 04.3-03-PLAN.md — Reconcile e2e specs to the /galleries removal: gallery.spec grid discovery (+ D-11 verify), about/contact reachability repoint (Wave 2)

### Phase 04.1: Design System & Homepage Refresh (INSERTED)

**Goal:** The site adopts the imported design system's monochrome + pop-pink visual identity (superseding Phase 2's Dawn Pink/Wild Strawberry palette) and the homepage becomes a real hero-carousel/grid-toggle gallery entry point, replacing the current placeholder "under construction" page.
**Requirements**: TBD — see `.planning/design-import/README.md` for imported reference material (tokens, components, homepage prototype)
**Depends on:** Phase 4
**Plans:** 6/6 plans complete

Plans:
**Wave 1**

- [x] 04.1-01-PLAN.md — Foundation: rebrand tokens + self-hosted Archivo Black + white-on-white chrome + AJS logo header (headerVariant prop) (Wave 1)
- [x] 04.1-02-PLAN.md — Wave 0 RED e2e spec: homepage carousel/grid/auto-advance/only-migrated-galleries contract (Wave 1)

**Wave 2** *(blocked on Wave 1 — new :root tokens + headerVariant prop)*

- [x] 04.1-03-PLAN.md — New Button/Input/Textarea/EmptyState components + ContactForm ink-only-error refactor + galleries EmptyState adoption (Wave 2)
- [x] 04.1-04-PLAN.md — Homepage rebuild: HomeCarousel island (carousel+grid+auto-advance) + FR/EN index pages, turns homepage.spec.ts GREEN (Wave 2)
- [x] 04.1-05-PLAN.md — Repaint GalleryCard/Grid/Lightbox/LanguageSwitcher + gallery-detail hero-scrim (D-07) (Wave 2)
- [x] 04.1-06-PLAN.md — Repaint About + legal-page (mentions-légales/confidentialité, FR/EN) typography to the fixed Display/Heading/Body roles — closes the D-01 split-identity gap (Wave 2)

### Phase 04.2: Social Media Links (INSERTED)

**Goal:** Visitors can find and follow Romane's Instagram (@ajs_romanelepont) from the site footer (site-wide) and from the About/Contact page.
**Requirements**: SOCIAL-01 (synthetic — maps to the phase goal; ROADMAP had no formal REQ-ID)
**Depends on:** Phase 4
**Plans:** 1/1 plans complete

Plans:

- [x] 04.2-01-PLAN.md — Add the Instagram link to the site-wide footer + About/Contact pages (FR/EN), with e2e coverage

### Phase 5: Launch & Domain Cutover

**Goal**: The new site fully replaces the old Myportfolio site at the live domain, with no unplanned downtime or broken email.
**Mode:** mvp
**Depends on**: Phase 2, Phase 3, Phase 4, Phase 04.1, Phase 04.2
**Requirements**: LAUNCH-01
**Success Criteria** (what must be TRUE):

  1. Visiting atelierjacquelinesuzanne.fr serves the new site, not the old Myportfolio site.
  2. Any existing email service tied to the domain (MX records) continues to work after cutover.
  3. The DNS cutover was rehearsed/verified (e.g., staging alias tested, TTLs lowered in advance) before the production switch.

**Plans**: TBD

### Phase 6: Homepage View-Mode Toggle, Grid Hero & Wordmark Cutout

**Goal**: The homepage's view-mode control, grid layout, and hero wordmark read as one polished, coherent surface — a single toggle instead of two buttons, a grid view whose first tile *is* the hero (not a separate band above it), and a wordmark that visually reveals the hero photo through its own letterforms.
**Mode:** mvp
**Depends on**: Phase 04.3
**Note**: Per PROJECT.md's v1.1 milestone goal, this phase is intended to execute *before* Phase 5's domain cutover, despite its higher phase number — numbering here reflects milestone-arrival order (v1.1 was scoped after v1's Phase 5 already existed in the roadmap), not execution sequence.
**Requirements**: HOME-01, HOME-02, HOME-03
**Success Criteria** (what must be TRUE):

  1. Visitor sees a single button (not two separate carousel/grid buttons) to switch the homepage's display mode, and it visibly reflects which mode is currently active.
  2. In grid view, the hero (wordmark + intro paragraph, no CTA button) renders as the first tile inside the grid itself, not as a separate full-width band above the grid.
  3. In carousel mode, the "Atelier Jacqueline Suzanne" wordmark shows a transparent cutout effect — the hero photo is visible through the letterforms — and stays legible at typical desktop and mobile viewport widths.

**Plans**: 1 plan
Plans:

- [x] 06-01-PLAN.md — Single unified toggle (HOME-01) + grid hero-as-first-tile (HOME-02) + carousel wordmark photo-cutout (HOME-03) + CTA removal, all in HomeCarousel.astro; test-first, with a live cutout-legibility checkpoint (Wave 1) — completed 2026-07-13, including a live post-checkpoint mobile/navigation follow-on (full-bleed hero, dashed swipe/keyboard nav) reconciled into 06-01-SUMMARY.md

**UI hint**: yes

### Phase 7: Homepage Quick Fixes & Mobile Hero Correctness

**Goal**: The homepage's header nav and mode toggle read correctly, and the mobile hero is genuinely full-bleed on first load with no visual regressions — the small, contained fixes that don't touch shared components or content models, done first so their groundwork carries forward cleanly into Phase 10's header consolidation.
**Mode:** mvp
**Depends on**: Phase 6
**Requirements**: HOME-04, HOME-05, HOME-06
**Success Criteria** (what must be TRUE):

  1. Visitor sees an Instagram icon (not text) link in the homepage header nav that opens Romane's Instagram profile (@ajs_romanelepont).
  2. The carousel/grid mode toggle button has a square (not rectangular) border, in both carousel and grid modes.
  3. On first load on a mobile device (e.g. iPhone 17 Pro), the hero fills the viewport edge-to-edge with no white gap above the header and no footer visible or bleeding through beneath the hero.

**Plans**: 2/2 plans complete
Plans:
**Wave 1**

- [x] 07-01-PLAN.md — Header quick fixes: Instagram icon nav link (HOME-04) + square mode-toggle box with 44px tap floor (HOME-05), in HomeCarousel.astro (Wave 1)

**Wave 2** *(blocked on Wave 1 — same file, HomeCarousel.astro)*

- [x] 07-02-PLAN.md — Mobile full-bleed hero regression fix (HOME-06): view-transition-first root-cause (D-10), CSS fix keeping the morph on mobile (D-12), Playwright iPhone-emulation regression test (D-11) (Wave 2)

**UI hint**: yes

### Phase 8: Gallery Descriptions

**Goal**: Visitors see each gallery's own descriptive text on the homepage — under its title in carousel mode, and revealed on hover in grid mode — replacing the generic "Un projet de Romane Lepont" byline, backed by a real per-gallery content field Romane can edit herself.
**Mode:** mvp
**Depends on**: Phase 2, Phase 6
**Requirements**: HOME-07, HOME-08
**Success Criteria** (what must be TRUE):

  1. Each gallery has a short description field in the Sanity CMS (new or reused), editable by Romane in both French and English without code.
  2. In carousel mode, the homepage shows each gallery's own description text under its title instead of the generic "Un projet de Romane Lepont" / "A project by Romane Lepont" byline.
  3. In grid mode, hovering (or focusing, for keyboard users) a gallery tile reveals that gallery's own description as an overlay.
  4. A gallery with no description yet falls back gracefully (e.g. to the existing generic byline, or an empty state) without breaking the homepage layout.

**Plans**: Implemented directly on `main` ahead of the formal plan/execute cycle (commits `38457dd`..`602d24b`), retroactively verified and closed via `/gsd-discuss-phase 8` — see `08-SUMMARY.md` and `08-VERIFICATION.md`.
**UI hint**: yes

### Phase 9: Progressive Homepage Image Loading

**Goal**: The homepage page shell renders immediately, and hero/gallery photos load with priority and a smooth blur-to-sharp transition, so first-time visitors never see a blocking full-screen loading state.
**Mode:** mvp
**Depends on**: Phase 6
**Requirements**: HOME-09
**Success Criteria** (what must be TRUE):

  1. The homepage's layout and chrome (header, nav, toggle) render immediately on load — no full-screen blocking loader is shown while photos load.
  2. The hero photo is requested with loading priority (e.g. `fetchpriority="high"` / eager loading) and appears as soon as it's available, ahead of below-the-fold images.
  3. Each homepage photo transitions visibly from a blurred low-quality placeholder to the sharp full-resolution image as it finishes loading, rather than popping in abruptly or leaving blank space.
  4. Gallery tile images below the fold load lazily and do not delay the homepage's initial render.

**Plans**: 2/2 plans complete
Plans:
**Wave 1**

- [x] 09-01-PLAN.md — Progressive image loading vertical slices: `blurPlaceholderUrl()` helper + `blurSrc` threading, hero blur-to-sharp on every swap (`fetchpriority="high"` + next-photo prefetch), grid-tile blur-up kept lazy, all behind a new failing `progressive image loading (HOME-09)` e2e block (Wave 1)

**Wave 2** *(blocked on Wave 1)*

- [x] 09-02-PLAN.md — Live blur-up legibility + View-Transition coincidence human-verify checkpoint (D-01 "verify live", RESEARCH Open Questions 1/2) (Wave 2)

**UI hint**: yes

### Phase 10: Unified Header & Simplified Language Switcher

**Goal**: As a visitor, I want to see the same header component and language switcher on every page, so that logo, nav, toggle, and switcher positioning stay aligned by construction instead of drifting, and the switcher shows only the other language plus a globe icon.
**Mode:** mvp
**Depends on**: Phase 1, Phase 6, Phase 7
**Requirements**: HOME-10, I18N-04
**Success Criteria** (what must be TRUE):

  1. The homepage header and the About/Contact header are rendered from a single shared header component (not two independently-styled implementations), with matching logo/nav/switcher positioning by construction.
  2. A header-level change made once in the shared component (e.g. nav item spacing) is reflected identically on the homepage and on About/Contact without a second edit.
  3. The homepage-only carousel/grid mode toggle still renders and functions correctly within the unified header, and does not appear on pages where it doesn't apply (About, Contact, etc.).
  4. The language switcher shows only a link to the OTHER language (not both FR and EN) alongside a small globe icon, on every page site-wide.
  5. Clicking the language switcher link takes the visitor directly to the translated version of the current page (same destination behavior as before, just one link instead of two).

**Plans**: 4/4 plans complete
Plans:
**Wave 1**

- [x] 10-01-PLAN.md — Extract shared `<SiteHeader>` + rewire BaseLayout; Instagram nav link everywhere + ported mobile CSS (HOME-10 part 1, D-01/D-03) (Wave 1)

**Wave 2** *(blocked on Wave 1 — needs `<SiteHeader>`; shares HomeCarousel/homepage/i18n specs)*

- [x] 10-02-PLAN.md — Homepage renders `<SiteHeader variant="transparent">` with the mode-toggle in the `extra` slot; retire `.home-*` classes (HOME-10 part 2, D-02/D-04/D-05/D-06) (Wave 2)

**Wave 3** *(blocked on Wave 2 — shares HomeCarousel/homepage/i18n specs)*

- [x] 10-03-PLAN.md — Simplify `LanguageSwitcher` to one link + globe icon, accessible name + cookie/nav preserved (I18N-04, D-07–D-11) (Wave 3)

**Gap closure** *(UAT Test 5, major — from `.planning/debug/header-backhome-overlap-logo.md`)*

- [x] 10-04-PLAN.md — Remove the duplicate `.gallery-detail__hero-back` link (+ dead CSS/import) overlapping the SiteHeader logo on both gallery-detail locale templates (HOME-10) (Wave 1)

**UI hint**: yes

### Phase 11: Schema & Content Model

**Goal**: A dedicated `edition` Sanity content type exists — structurally distinct from galleries, modeled with future shop fields in mind — seeded with at least one real édition, so every later phase (data-fetch, routes, nav) has real content to build on and verify against.
**Mode:** mvp
**Depends on**: Phase 2 (established the `gallery.ts` schema pattern and `@sanity/orderable-document-list` this phase mirrors)
**Requirements**: CMS-04, EDN-05
**Success Criteria** (what must be TRUE):

  1. Romane can create, edit, and publish a new édition document in Sanity Studio (title, slug, lead photo, full photo-shoot image array with alt text, statement, format details) without developer help.
  2. Romane can drag-reorder éditions in Studio's desk structure, the same way she already reorders galleries.
  3. Format details (page count, print run, dimensions) are entered as distinct, typed fields grouped together in Studio (print run stored as a number, not free text), so a future shop `commerce` field group can be added later without restructuring.
  4. At least one real édition (e.g. "Rebut" or "Sillo") is seeded in Sanity Studio with real content, ready for the site to fetch and render in Phase 12.
  5. The naming overlap between the Portfolio gallery already titled "Rebut" and the new "Rebut" édition has been explicitly raised with and resolved by Romane, and the resolution is recorded in PROJECT.md's Key Decisions.

**Plans**: 2/2 plans complete

Plans:

- [x] 11-01-PLAN.md — Create the `edition` schema type (leadPhoto + structured `format` group), register + wire the orderable "Éditions" desk item, and record the "Rebut" naming resolution in PROJECT.md (Wave 1)
- [x] 11-02-PLAN.md — Deploy the schema to the hosted Studio and seed the real "Rebut" édition, proving Romane's unassisted create/edit/publish/reorder workflow (Wave 2)

### Phase 12: Data-Fetch Layer & Routes

**Goal**: Visitors can browse and open Éditions pages on the live site — an overview listing and a full per-édition detail page — in both French and English, with zero pricing/availability/purchase affordances.
**Mode:** mvp
**Depends on**: Phase 11
**Requirements**: EDN-02, EDN-03, EDN-04, EDN-06, EDN-07
**Success Criteria** (what must be TRUE):

  1. Visitor can open an Éditions overview page (at a French URL and at an English URL) listing each published édition by title, lead photo, and full statement text, as a vertical editorial list (not a grid — refined during Phase 12 discussion, 2026-07-22).
  2. Visitor can click through from the overview to a per-édition detail page showing the full photo shoot in the existing gallery lightbox, a short description/statement, and format details (page count, print run, dimensions).
  3. No Éditions overview or detail page shows a price, a stock/availability indicator, or a purchase/buy button anywhere on the page.
  4. Both the overview and detail routes exist and render correctly at the French (root) and English (`/en/`) URL paths — no locale is missing either route.
  5. The Éditions overview and detail URLs appear in the site's `sitemap.xml`.

**Plans**: 3/3 plans complete
Plans:
**Wave 1**

- [x] 12-01-PLAN.md — Éditions overview vertical slice: `edition` data-fetch layer (`getEditions`/`getEdition`, no-isVisible/no-seo filter) + FR/EN vertical zigzag list + Wave 0 unit/e2e (EDN-02, EDN-06, EDN-07) (Wave 1)

**Wave 2** *(blocked on 12-01 — needs the data-fetch layer + overview links)*

- [x] 12-02-PLAN.md — Per-édition detail vertical slice: FR/EN `[slug]` pages (clickable hero, combined `[leadPhoto, ...images]` Lightbox, format line, in-flow back-link) + detail/lightbox/no-commerce e2e (EDN-03, EDN-04, EDN-06, EDN-07) (Wave 2)

**Wave 3** *(blocked on 12-01/12-02 — hardens the shipped routes)*

- [x] 12-03-PLAN.md — Sitemap inclusion (both locales, no noIndex) + EDN-06 build-blocking commerce-string guard over `dist/editions/**` (EDN-02, EDN-06, EDN-07) (Wave 3)

**UI hint**: yes

### Phase 13: Nav Integration

**Goal**: Visitors can discover Éditions from the main site navigation on every page, while the homepage's photography carousel/grid content itself stays pure photography.
**Mode:** mvp
**Depends on**: Phase 12, Phase 10 (nav wiring extends the shared `<SiteHeader>` component and `resolveSiteCopy()` pattern established there)
**Requirements**: EDN-01
**Success Criteria** (what must be TRUE):

  1. Visitor sees an "Éditions" link in the main site nav on every page (homepage, gallery pages, About, Contact) in both French and English, correctly localized.
  2. Clicking the nav link takes the visitor to the Éditions overview page in their current language.
  3. The homepage's carousel rotation and grid tiles do not include an Éditions entry — only the nav does.
  4. The nav's "Éditions" label is editable by Romane via Sanity (`siteSettings.navLabels`), not hardcoded, consistent with how the other nav labels already work.
  5. The header nav — now carrying a 4th link — still fits and functions correctly on mobile viewports (<768px), in both the `solid` and `transparent` header variants.

**Plans**: 2/2 plans complete
Plans:

- [x] 13-01-PLAN.md — Éditions nav link end-to-end: bilingual `navLabels.editions` Sanity field + `resolveSiteCopy` `editionsLabel` + both `<SiteHeader>` call sites (Éditions first, D-01) + re-measured 4-link mobile fit (D-02/D-03) (Wave 1)
- [x] 13-02-PLAN.md — gap closure (SC #5 / Truth #5): fix the mobile header two-row wrap at 360-375px — `flex-wrap: nowrap` across `@media(max-width:767px)` + compensating trims raised to `@media(max-width:400px)`, a same-row regression e2e sampling inside the band, and a live re-check in both variants (Wave 1)

**UI hint**: yes

### Phase 14: Verification & UAT

**Goal**: The Éditions feature closes cleanly with no omission-class gaps — every locale, every nav call site, and the sitemap are confirmed complete, and the "no commerce" boundary holds across the whole feature.
**Mode:** mvp
**Depends on**: Phase 11, Phase 12, Phase 13
**Requirements**: None — cross-cutting verification pass; EDN-01..EDN-07 and CMS-04 are already owned by Phases 11–13 above.
**Success Criteria** (what must be TRUE):

  1. Automated tests confirm both locales' overview and detail pages render, the "Éditions" nav link is present and correctly localized on every page (including both of the homepage's independent `<SiteHeader>` call sites), and the sitemap contains the Éditions URLs.
  2. An automated negative check (grepping the diff/build output for price/stock/availability/purchase language) confirms no commerce language slipped into the Éditions templates or GROQ queries.
  3. Romane has completed a real end-to-end content-editing pass in Sanity Studio (create/edit/publish/drag-reorder an édition) and confirmed it works the same way galleries already do.
  4. Every "Looks Done But Isn't" risk flagged in research (missing locale route, missing sitemap entry, missing nav call site) has been explicitly checked off, not just assumed from a single happy-path pass.

**Plans**: 3/4 plans executed
Plans:
**Wave 1**

- [x] 14-01-PLAN.md — Null-safety hardening (D-02): WR-03-style `?.`/`?? ''` guards on both Éditions detail + overview pages (FR/EN) so a malformed édition can't crash the static build (Wave 1)
- [x] 14-02-PLAN.md — Commerce-language guard extension (D-05): extend `verify-static-artifact.mjs` to also scan `sanity/schemas/edition.ts` Studio copy, reusing the existing token set/helper (Wave 1)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 14-03-PLAN.md — Closure audit (D-01): re-run direct checks and map PITFALLS.md's 7 "Looks Done But Isn't" items to evidence (SC #1/#2/#4) + re-verify REQUIREMENTS.md already Complete (Wave 2)

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 14-04-PLAN.md — Romane Studio UAT (D-03/D-04): French create/edit/publish/drag-reorder checklist + blocking human-verify checkpoint closing SC #3 (Wave 3, non-autonomous)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12 → 13 → 14

Note: Phase 6 (v1.1) is intended to execute before Phase 5's domain cutover per PROJECT.md — see the Note under Phase 6 above. Phases 7–10 (v1.2) are likewise intended to execute before Phase 5, per PROJECT.md's current-milestone note. Phases 11–14 (v1.3 "Éditions") are new work continuing after Phase 10; Phase 5 (Launch & Domain Cutover) remains separately tracked, not started, and not part of this milestone. Phase numbering reflects milestone-arrival order, not strict execution sequence.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Bilingual Infrastructure | 5/5 | Complete   | 2026-07-06 |
| 2. Portfolio Galleries | 4/4 | Complete    | 2026-07-07 |
| 3. About & Contact | 3/3 | Complete    | 2026-07-08 |
| 4. Legal & Compliance | 3/3 | Complete    | 2026-07-08 |
| 5. Launch & Domain Cutover | 0/TBD | Not started | - |
| 6. Homepage View-Mode Toggle, Grid Hero & Wordmark Cutout | 1/1 | Complete   | 2026-07-13 |
| 7. Homepage Quick Fixes & Mobile Hero Correctness | 2/2 | Complete    | 2026-07-13 |
| 8. Gallery Descriptions | 1/1 | Complete   | 2026-07-14 |
| 9. Progressive Homepage Image Loading | 2/2 | Complete    | 2026-07-14 |
| 10. Unified Header & Simplified Language Switcher | 4/4 | Complete    | 2026-07-17 |
| 11. Schema & Content Model | 2/2 | Complete    | 2026-07-22 |
| 12. Data-Fetch Layer & Routes | 3/3 | Complete    | 2026-07-22 |
| 13. Nav Integration | 2/2 | Complete    | 2026-07-23 |
| 14. Verification & UAT | 3/4 | In Progress|  |

## Milestone Scope Note

This roadmap covers the **v1 milestone** (portfolio-replacement launch, Phases 1–5), the **v1.1 milestone** (homepage refinements, Phase 6 — HOME-01, HOME-02, HOME-03), the **v1.2 milestone** (homepage polish/pre-launch, Phases 7–10 — HOME-04..HOME-10, I18N-04), and the **v1.3 milestone "Éditions"** (Phases 11–14 — EDN-01..EDN-07, CMS-04). The v1.x wave — exhibitions/agenda (EXHB-01, EXHB-02, CMS-02), shop (SHOP-01..04, building on the v1.3 `edition` content model), checkout (CHK-01..05), shipping (SHIP-01, SHIP-02), commerce-specific legal (LEGAL-02, LEGAL-04), the Éditions cross-link differentiator (EDN-08), and related bilingual/CMS extensions (I18N-02b, I18N-03, CMS-03) — is tracked in REQUIREMENTS.md's v2 section and will get its own roadmap phases once v1.3 ships.
