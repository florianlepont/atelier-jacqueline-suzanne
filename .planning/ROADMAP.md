# Roadmap: Atelier Jacqueline Suzanne — Website

## Milestones

- 🚧 **v1.0 MVP** — Phases 1-5 (Phases 1-4/4.1/4.2/4.3 shipped 2026-07-12, archived and formally closed — see `.planning/MILESTONES.md`; Phase 5 launch/domain cutover still pending, deliberately deferred — user decision 2026-07-27: "we'll do it later")
- ✅ **v1.1 Homepage Refinements** — Phase 6 (shipped 2026-07-13, archived — see `.planning/MILESTONES.md`)
- ✅ **v1.2 Homepage Polish, Pre-Launch** — Phases 7-10 (shipped 2026-07-20, archived — see `.planning/MILESTONES.md`)
- ✅ **v1.3 Éditions** — Phases 11-14 (shipped 2026-07-23, archived — see `.planning/milestones/v1.3-ROADMAP.md`)
- ✅ **v1.4 Editorial Design Consistency** — Phases 15-16 (shipped 2026-08-01, archived — see `.planning/milestones/v1.4-ROADMAP.md`)
- ✅ **v1.5 Global Improvements & Bug Fixes** — Phases 17-19 (shipped 2026-08-03, archived — see `.planning/milestones/v1.5-ROADMAP.md`)
- 🚧 **v1.6 Mobile Experience Redesign** — Phases 20-23 (roadmapped 2026-08-03 — mobile-only nav/scroll/lightbox redesign across Homepage, Gallery, and Édition detail pages, plus an About portrait-placement fix; desktop/tablet unchanged throughout)

## Overview

This roadmap covers the **v1 milestone** (Phases 1–5): a fast, bilingual replacement of the current Myportfolio site with portfolio galleries, an About page, contact, baseline French legal pages, self-service gallery editing for Romane, and a rehearsed DNS cutover to the live domain. The journey starts with the bilingual/CMS/hosting foundation (since French/English and non-technical editing cross-cut every later page), moves through the two content pillars (portfolio, then about/contact), adds the legally-required pages, and ends with the domain cutover that retires the old site. Shop, checkout, shipping, and exhibitions (the v1.x wave) are explicitly deferred and are not represented here.

It also covers the **v1.1 milestone** (Phase 6): homepage refinements — a single unified carousel/grid toggle, a grid view whose hero is the first grid tile instead of a separate band, and a transparent photo-cutout treatment for the hero wordmark. Per PROJECT.md, this milestone is intended to land before Phase 5's domain cutover, even though its phase number is higher (phase numbers reflect milestone-arrival order, not strict execution sequence — see the note under Progress).

It also covers the **v1.2 milestone** (Phases 7–10): homepage polish before the Phase 5 domain cutover — social presence (Instagram icon in the header nav), visual consistency (square toggle border), a mobile full-bleed hero regression fix, per-gallery description text (replacing the generic byline, in both carousel and grid-hover form), progressive/optimized image loading, and a structural consolidation of the homepage header with the shared About/Contact header plus a simplified language switcher. Phases are sequenced by blast radius: small, contained homepage-only fixes first (Phase 7), a content-model addition shared across two display modes next (Phase 8), a self-contained performance change (Phase 9), and the higher-risk shared-component refactor last (Phase 10) — so the header/toggle groundwork laid in Phase 7 is carried forward into the unified component once, rather than rebuilt twice.

It also covers the **v1.3 milestone "Éditions"** (Phases 11–14): a dedicated, non-transactional showcase for Romane's paper éditions (zines/artist books), added as a new content type and route tree alongside the existing Portfolio galleries, with its own main-nav entry. The four phases are sequenced by dependency and blast radius, per direct research grounded in this codebase: the `edition` Sanity schema and seeded content come first since every later phase builds on that shape existing (Phase 11); the build-time data-fetch layer and bilingual overview/detail routes come next, verifiable in isolation before touching anything shared (Phase 12); nav wiring — the one part of this feature that touches every-page shared chrome (`SiteHeader`, rendered from two independent call sites) — comes third, once the routes it points to already exist and work (Phase 13); and a dedicated verification/UAT pass closes the milestone, because this feature's dominant risk class is omission bugs (a missed locale, a missed sitemap entry, a missed nav call site) that don't fail loudly and need an explicit checklist rather than incidental testing (Phase 14). Selling éditions (price, stock, checkout) remains deferred to the future v1.x shop/checkout milestone.

It also covered the **v1.4 milestone "Editorial Design Consistency"** (Phases 15–16, shipped 2026-08-01): extending the giant-title `PageTitleHeader` identity already established on Contact and Éditions to the two remaining pages still showing the old treatment. Full phase details archived at `.planning/milestones/v1.4-ROADMAP.md`.

It also covers the **v1.5 milestone "Global Improvements & Bug Fixes"** (Phases 17–19): a batch of 8 live-reported visual/interaction bugs and regressions across the homepage, gallery pages, the Éditions page, and Contact — most surfaced directly by Romane/Florian using the shipped v1.4 site, one (EDN-09) a direct regression from Phase 16's post-merge overflow fix. All 8 fixes are small, independent, single-or-few-component Astro/CSS/vanilla-JS changes with no shared data model or backend work, so the three phases are sequenced by blast radius rather than by feature area alone: self-contained homepage fixes first (Phase 17 — `HomeCarousel.astro` only), gallery/Éditions display fixes next (Phase 18 — `DetailHero.astro`, `GalleryGrid.astro`, and the gallery detail pages, contained to the Portfolio/Éditions display surface), and the higher-risk, shared-component visual polish last (Phase 19 — `EditionsOverviewBody.astro` plus the `PageTitleHeader.astro` component shared by Contact, About, and Éditions, plus `ContactPageBody.astro`), since UI-01's halftone-bleed fix must not reintroduce the horizontal-scroll bug Phase 16's post-merge fix was containing.
It also covers the **v1.6 milestone "Mobile Experience Redesign"** (Phases 20–23): a phone-viewport-only redesign replacing the carousel/grid toggle and click-to-open Lightbox with scroll-driven navigation across the Homepage, Gallery detail, and Édition detail pages, plus an About portrait-placement fix — desktop/tablet must stay byte-for-byte unchanged throughout (UI-02), so rather than gating that check behind one standalone phase at the end, every phase in this milestone carries its own explicit desktop/tablet-unchanged success criterion. The four phases are sequenced by blast radius and dependency: the homepage's more mechanical, lower-risk pieces come first (Phase 20 — a mobile-only nav menu replacing the header bar, and the per-visit random accent color the scroll view in the next phase will consume), then the homepage's biggest, riskiest, sketch-explored centerpiece (Phase 21 — the scroll-driven single view and its full-screen wordmark-to-letterform-zoom entry transition, depending on Phase 20's accent-color mechanism), then the Portfolio/Éditions Lightbox retirement, grouped as one phase rather than split because Gallery and Édition detail pages already share the `GalleryGrid`/`Lightbox` component surface and the Édition-specific intro-text/primary-photo redesign is a dependent next step once that shared scroll pattern exists (Phase 22), and finally the isolated, single-component About portrait fix, which also closes the milestone with a combined final regression sweep across every page touched (Phase 23).

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
- [x] **Phase 14: Verification & UAT** - The Éditions feature closes with no omission-class gaps (locale, sitemap, nav call sites) and the "no commerce" boundary confirmed to hold (completed 2026-07-23)
- [x] **Phase 15: About Page Editorial Redesign** - About page's title and broader layout adopt the shared PageTitleHeader editorial identity, via a sketch-explored layout redesign (completed 2026-07-29)
- [x] **Phase 16: 404 Page Editorial Redesign** - The 404 fallback page gets a fully custom, interactive redesign: full-bleed photo backdrop popping at a pointer/touch-proximity-driven rate (capped ≈6.7/sec at dead-center, raised from the original ≈3/sec per an explicit, knowing user override at the plan 16-03 checkpoint), centered AJS logo/404 marker/bilingual message (revised from the original PageTitleHeader-reuse plan, per user direction 2026-07-29 — see `16-CONTEXT.md`) (completed 2026-07-29)
- [x] **Phase 17: Homepage Carousel & Intro Fixes** - Auto-advance keeps running while the pointer hovers the page, and the grid-mode intro paragraph shows in full (completed 2026-08-02)
- [x] **Phase 18: Gallery & Éditions Display Fixes** - Gallery descriptions show in full, thumbnail grids lose their black border frame, and gallery pages show the site footer again (completed 2026-08-02)
- [x] **Phase 19: Site-Wide Visual Polish** - Éditions row-hover color applies to the title/description too, the halftone texture bleeds to the true browser edge again without reintroducing horizontal scroll, and Contact's hover-fill text gets breathing room (completed 2026-08-03)
- [x] **Phase 20: Mobile Navigation & Accent Color** - On phone-width viewports, the homepage header becomes a self-contained nav menu with the language switcher folded in, and each visit gets a randomly-picked accent color from existing gallery data; desktop/tablet unchanged (reopened 2026-08-04 — UAT Test 2 found two major visual gaps on a live phone test: the language switcher must drop from the big primary list to a small secondary line stacked above the Instagram link, reversing D-04's switcher clause, and the Instagram link needs the header's glyph; gap-closure plan 20-06 added) (completed 2026-08-04)
- [ ] **Phase 21: Homepage Scroll Experience** - On phone-width viewports, the carousel/grid toggle is replaced by one continuous scroll-driven view opening on a full-screen wordmark that zooms through its letterforms into the first gallery photo, with on-arrival description reveals; desktop/tablet unchanged
- [ ] **Phase 22: Gallery & Édition Scroll Navigation** - On phone-width viewports, Gallery and Édition detail pages retire the click-to-open Lightbox for scroll-driven full-photo navigation, and the Édition intro text/primary photo get a legible, non-backdrop treatment; desktop/tablet unchanged
- [ ] **Phase 23: About Portrait Placement & Milestone Regression Close** - On phone-width viewports, the About page's portrait photo moves to an improved position, and the milestone closes with a confirmed desktop/tablet regression sweep across every page touched

## Phase Details

### v1.0 MVP (Phases 1-4, 04.1-04.3) — SHIPPED 2026-07-12

Full phase details (goals, dependencies, requirements, success criteria, wave/plan breakdowns) archived at `.planning/milestones/v1.3-ROADMAP.md` (full-project snapshot taken at v1.3 close, before this collapse). Summary: Astro 7 + Sanity bilingual (FR/EN) foundation, self-serve-editable portfolio galleries, About + spam-protected contact form, baseline French/EU legal pages (Phases 1-4), then three inserted phases — the imported design-system rebrand and hero-carousel/grid-toggle homepage (04.1), site-wide Instagram link (04.2), and a homepage refinement pass: logo hover crossfade, single gallery-browsing entry point, icon toggle, mobile hero fix, three-line wordmark, clickable gallery titles (04.3). 13/14 v1 requirements shipped (PORT-01..03, ABOUT-01/02, I18N-01/02, CMS-01, CONT-01/02, LEGAL-01/03/05); see `.planning/MILESTONES.md` for the full shipped entry and accomplishments. Phase 5 (LAUNCH-01) is deliberately NOT part of this shipped set — see below.

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

### v1.1 Homepage Refinements (Phase 6) — SHIPPED 2026-07-13

Full phase details archived at `.planning/milestones/v1.3-ROADMAP.md`. Summary: a single unified carousel/grid toggle button (HOME-01), grid view's hero rendering as the first grid tile itself rather than a separate band (HOME-02), and the wordmark's transparent photo-cutout effect revealing the hero photo through its own letterforms (HOME-03) — plus a live post-checkpoint follow-on (mobile full-bleed hero, dashed swipe/keyboard nav). 3/3 v1.1 requirements shipped; see `.planning/MILESTONES.md` for the full shipped entry and accomplishments.

### v1.2 Homepage Polish, Pre-Launch (Phases 7-10) — SHIPPED 2026-07-20

Full phase details archived at `.planning/milestones/v1.3-ROADMAP.md`. Summary: Instagram icon nav link + square mode-toggle border (HOME-04, HOME-05); a root-caused, view-transition-first fix for a real-device mobile full-bleed hero regression (HOME-06); per-gallery description text replacing the generic byline, in both carousel and grid-hover form (HOME-07, HOME-08); progressive image loading — priority hero load, blur-to-sharp transitions, lazy grid tiles, no blocking full-screen loader (HOME-09); and a single shared `<SiteHeader>` component consolidating the homepage and About/Contact headers, plus a simplified one-link-plus-globe language switcher (HOME-10, I18N-04), including a UAT gap-closure removing a duplicate back-home link overlapping the header logo. 8/8 v1.2 requirements shipped; see `.planning/MILESTONES.md` for the full shipped entry and accomplishments.

### v1.3 Éditions (Phases 11-14) — SHIPPED 2026-07-23

Full phase details (goals, dependencies, requirements, success criteria, wave/plan breakdowns) archived at `.planning/milestones/v1.3-ROADMAP.md`. Summary: a dedicated, non-transactional showcase for Romane's paper éditions (zines/artist books), added as a new content type and route tree alongside the existing Portfolio galleries, with its own main-nav entry — Phase 11 (schema/content model) → Phase 12 (data-fetch layer/routes) → Phase 13 (nav integration) → Phase 14 (verification/UAT). All 8 requirements (EDN-01..07, CMS-04) shipped; see `.planning/MILESTONES.md` for accomplishments.

### v1.4 Editorial Design Consistency (Phases 15-16) — SHIPPED 2026-08-01

Full phase details (goals, dependencies, requirements, success criteria, wave/plan breakdowns) archived at `.planning/milestones/v1.4-ROADMAP.md`. Summary: extended the giant-title `PageTitleHeader` editorial identity (already shipped on Contact/Éditions) to the About page — Phase 15, a sketch-explored layout redesign (standalone bio lead, circular portrait accent, pinned scroll-shrink hero reveal, two-column numbered sections) — and gave the 404 fallback a fully custom, interactive redesign — Phase 16, a full-bleed photo pool hard-cutting at a pointer/touch-proximity-driven rate (cap raised live to ≈6.7/sec per an explicit user override of the original WCAG-adjacent ≈3/sec cap), AJS logo/marker/bilingual message over a dimming scrim. All 3 requirements (ABOUT-03, ABOUT-04, ERR-01) shipped; see `.planning/MILESTONES.md` for accomplishments.

**UI hint**: yes

### v1.5 Global Improvements & Bug Fixes (Phases 17-19) — SHIPPED 2026-08-03

Full phase details (goals, dependencies, requirements, success criteria, wave/plan breakdowns) archived at `.planning/milestones/v1.5-ROADMAP.md`. Summary: a batch of 8 live-reported visual/interaction bugs and regressions across the homepage, gallery pages, the Éditions page, and Contact — homepage carousel/intro fixes (Phase 17: removed pointer-hover auto-advance pause, removed the grid-mode intro 2-line clamp), gallery/Éditions display fixes (Phase 18: removed the thumbnail black border frame, restored the gallery-page footer, removed the detail-hero description clamp in favor of an empirically-calibrated Sanity max-length), and the higher-risk shared-component visual polish (Phase 19: fixed a broken Astro `:global()` selector that silently blocked the Éditions row-hover color sync, added Contact link-row breathing room, and restored the halftone texture's true viewport-edge bleed via geometry-based containment without reintroducing Phase 16's `position: sticky` regression). All 8 requirements (HOME-11, HOME-12, PORT-04, PORT-05, PORT-06, EDN-09, UI-01, CONT-03) shipped; see `.planning/MILESTONES.md` for accomplishments.

### Phase 20: Mobile Navigation & Accent Color

**Goal**: On phone-width viewports, the homepage header becomes a self-contained nav menu (hamburger or similar) with the language switcher folded inside it, and each visit shows a randomly-picked accent color drawn from the existing per-gallery `heroColor` values — desktop/tablet header and accent-color behavior stay completely unchanged.
**Depends on**: Phase 19 (continues after the v1.5 milestone; first phase of v1.6)
**Requirements**: HOME-13, HOME-16
**Success Criteria** (what must be TRUE):

  1. On a phone-width viewport, the homepage's desktop header bar is replaced by a hamburger/menu control that opens to reveal the nav links.
  2. The language switcher is reachable from inside that mobile menu on the homepage at phone widths, not shown inline as it is on desktop.
  3. Revisiting the homepage on a phone across multiple visits shows different accent colors, each one of the existing per-gallery `heroColor` values (no new palette introduced).
  4. On tablet/desktop viewports, the homepage header bar, language switcher placement, and accent-color behavior are pixel-for-pixel and behaviorally unchanged from the pre-milestone (Phase 19) state.

**Plans:** 6/6 plans complete

Plans:
**Wave 1**

- [x] 20-01-PLAN.md — HOME-16: per-visit random starting accent colour (`pickRandomGalleryIndex()`, accent-only override, deterministic e2e)
- [x] 20-02-PLAN.md — HOME-13: shared-header regression net proven green BEFORE any source change, plus retirement of three pre-existing assertions the phase intentionally changes

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 20-03-PLAN.md — HOME-13: `SiteHeader`'s opt-in `mobileNav` prop, the hamburger, the full-screen `MobileNavPanel` dialog, and its structural CSS

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 20-04-PLAN.md — HOME-13/D-03: open/close behaviour and motion (CSS `@starting-style` open, JS-orchestrated close, hamburger↔X morph) with cross-engine smoke coverage

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 20-05-PLAN.md — HOME-13/HOME-16: halftone accent, mobile-viewport axe coverage for the open panel, and the CI-order phase gate

**Wave 5** *(gap closure — blocked on Wave 4 completion)*

- [x] 20-06-PLAN.md — HOME-13 gap closure (20-UAT.md Test 2): reverse D-04's switcher clause (language switcher moves from the big primary list to a Label-size ink line stacked above Instagram) and give the Instagram line the header's inline glyph

**UI hint**: yes

### Phase 21: Homepage Scroll Experience

**Goal**: On phone-width viewports, the homepage replaces the carousel/grid toggle with one continuous scroll-driven view that opens on a full-screen wordmark, zooms through the letterforms into the first gallery's photo as the visitor scrolls, and reveals each item's description as it arrives on screen — the riskiest, most subjective piece explored via sketch before implementation.
**Depends on**: Phase 20 (the scroll view consumes Phase 20's per-visit accent-color mechanism)
**Requirements**: HOME-14, HOME-15
**Success Criteria** (what must be TRUE):

  1. On a phone-width viewport, the carousel/grid toggle control no longer appears on the homepage.
  2. Scrolling the homepage on a phone moves through every gallery as a single continuous sequence, with no separate carousel or grid mode to switch between.
  3. Each gallery's description text is hidden until that gallery arrives on screen during scroll, then reveals via the sketched-and-approved transition.
  4. On first load, a phone visitor sees the "Atelier Jacqueline Suzanne" wordmark filling the screen; scrolling visibly transitions through the wordmark's letterforms into the first gallery's photo, matching the approved sketch direction.
  5. On tablet/desktop viewports, the carousel/grid toggle and both view modes behave exactly as they did before this milestone.

**Plans**: 6 plans, 4 waves

Plans:
- [ ] 21-01-PLAN.md — Extract the wordmark-zoom math (progress, scale/opacity curve, focus origin) and the shared photo-cutout filter into `src/lib/home-carousel.ts`, with unit tests
- [ ] 21-02-PLAN.md — Fix Phase 20's carryover CR-01 touch bug in the carousel handler (D-11) and re-scope this spec's touch coverage to a tablet-width touch device
- [ ] 21-03-PLAN.md — Pre-emptively reconcile the existing e2e suite with the mobile rewrite, so it stays green at every commit of the phase
- [ ] 21-04-PLAN.md — Build the phone-width scroll deck's structure: failing structural spec, then the parallel markup, then the CSS that retires the carousel/grid/toggle below 767px
- [ ] 21-05-PLAN.md — Wire the pinned, reversible wordmark-to-photo zoom driver and the header hide/fade (HOME-15)
- [ ] 21-06-PLAN.md — Wire arrival-complete description reveal and live per-slide accent colour, then close the phase gate (HOME-14)

**UI hint**: yes

### Phase 22: Gallery & Édition Scroll Navigation

**Goal**: On phone-width viewports, both Gallery detail and Édition detail pages retire the click-to-open Lightbox in favor of scrolling directly through full-size, uncropped photos in the page flow; the Édition detail page additionally gives its intro/statement text a legible solid background and shows its primary photo among the others instead of as a full-bleed backdrop — the intro-text/photo treatment explored via sketch before implementation.
**Depends on**: Nothing new (independent of Phases 20-21; shares the `GalleryGrid`/`Lightbox` component surface used by both Gallery and Édition detail routes)
**Requirements**: PORT-07, EDN-10, EDN-11
**Success Criteria** (what must be TRUE):

  1. On a phone-width viewport, tapping a photo on a Gallery detail page no longer opens a separate Lightbox/picture-mode view.
  2. On a phone-width viewport, a visitor can scroll through a gallery's full photo set at full size, uncropped, directly in the page.
  3. The same scroll-driven, no-Lightbox behavior holds on Édition detail pages at phone widths.
  4. On a phone-width Édition detail page, the intro/statement text sits on a legible solid background rather than over a photo, and the primary photo appears among the other photos rather than as a full-bleed backdrop — matching the approved sketch direction.
  5. On tablet/desktop viewports, both Gallery detail and Édition detail pages keep their existing click-to-open Lightbox and full-bleed primary-photo treatment exactly as before this milestone.

**Plans**: TBD
**UI hint**: yes

### Phase 23: About Portrait Placement & Milestone Regression Close

**Goal**: On phone-width viewports, the About page's portrait photo moves to an improved position relative to the surrounding text — explored via sketch before implementation — and the milestone closes with a confirmed, combined desktop/tablet regression check across every page touched this milestone (Homepage, Gallery detail, Édition detail, About).
**Depends on**: Phase 20, Phase 21, Phase 22 (final phase; closes the milestone-wide UI-02 regression guard carried through every prior phase's own success criteria)
**Requirements**: ABOUT-05, UI-02
**Success Criteria** (what must be TRUE):

  1. On a phone-width viewport, the About page's portrait photo appears in a new position relative to the bio text, matching the approved sketch direction, not its pre-milestone placement.
  2. The new portrait placement doesn't crowd, overlap, or push the surrounding text sections awkwardly at common phone widths.
  3. On tablet/desktop viewports, the About page's portrait placement is unchanged from before this milestone.
  4. A combined final pass across Homepage, Gallery detail, Édition detail, and About confirms every desktop/tablet layout, nav, and interaction behavior verified locally in Phases 20-22 still holds unchanged.

**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12 → 13 → 14 → 15 → 16 → 17 → 18 → 19 → 20 → 21 → 22 → 23

Note: Phase 6 (v1.1) is intended to execute before Phase 5's domain cutover per PROJECT.md — see the Note under Phase 6 above. Phases 7–10 (v1.2) are likewise intended to execute before Phase 5, per PROJECT.md's current-milestone note. Phases 11–14 (v1.3 "Éditions") are new work continuing after Phase 10; Phase 5 (Launch & Domain Cutover) remains separately tracked, not started, and not part of this milestone. Phase numbering reflects milestone-arrival order, not strict execution sequence. Phases 15–16 (v1.4 "Editorial Design Consistency") are new work continuing after Phase 14; Phase 5 (Launch & Domain Cutover) remains separately tracked, not started, and not part of this milestone. Phases 17–19 (v1.5 "Global Improvements & Bug Fixes") are new work continuing after Phase 16; Phase 5 (Launch & Domain Cutover) remains separately tracked, not started, and not part of this milestone. Phases 20–23 (v1.6 "Mobile Experience Redesign") are new work continuing after Phase 19; Phase 5 (Launch & Domain Cutover) remains separately tracked, not started, and not part of this milestone. UI-02 (the desktop/tablet-unchanged regression guard) is formally closed in Phase 23 but is checked as a running local success criterion within Phases 20, 21, and 22 as well, not deferred to Phase 23 alone.

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
| 14. Verification & UAT | 4/4 | Complete    | 2026-07-23 |
| 15. About Page Editorial Redesign | 4/4 | Complete    | 2026-07-29 |
| 16. 404 Page Editorial Redesign | 3/3 | Complete    | 2026-07-29 |
| 17. Homepage Carousel & Intro Fixes | 1/1 | Complete    | 2026-08-02 |
| 18. Gallery & Éditions Display Fixes | 2/2 | Complete    | 2026-08-02 |
| 19. Site-Wide Visual Polish | 2/2 | Complete    | 2026-08-03 |
| 20. Mobile Navigation & Accent Color | 6/6 | Complete    | 2026-08-04 |
| 21. Homepage Scroll Experience | 0/TBD | Not started | - |
| 22. Gallery & Édition Scroll Navigation | 0/TBD | Not started | - |
| 23. About Portrait Placement & Milestone Regression Close | 0/TBD | Not started | - |

## Milestone Scope Note

This roadmap covers the **v1 milestone "MVP"** (Phases 1–5 — Phases 1-4/04.1/04.2/04.3 shipped and formally closed 2026-07-12; Phase 5 launch/domain cutover deliberately deferred, not started — see `.planning/MILESTONES.md`), the **v1.1 milestone** (homepage refinements, Phase 6 — HOME-01, HOME-02, HOME-03 — shipped and archived 2026-07-13), the **v1.2 milestone** (homepage polish/pre-launch, Phases 7–10 — HOME-04..HOME-10, I18N-04 — shipped and archived 2026-07-20), and the **v1.3 milestone "Éditions"** (Phases 11–14 — EDN-01..EDN-07, CMS-04 — shipped and archived 2026-07-23; full detail at `.planning/milestones/v1.3-ROADMAP.md`). It also covers the **v1.4 milestone "Editorial Design Consistency"** (Phases 15–16 — ABOUT-03, ABOUT-04, ERR-01 — shipped and formally closed/archived 2026-08-01; full detail at `.planning/milestones/v1.4-ROADMAP.md`). v1.0/v1.1/v1.2 were formally closed retroactively on 2026-07-27 (full accomplishments in `.planning/MILESTONES.md`); their phase detail lives in the `.planning/milestones/v1.3-ROADMAP.md` full-project snapshot since no earlier snapshot existed. It also covers the **v1.5 milestone "Global Improvements & Bug Fixes"** (Phases 17–19 — HOME-11, HOME-12, PORT-04, PORT-05, PORT-06, EDN-09, UI-01, CONT-03 — shipped and formally closed/archived 2026-08-03; full detail at `.planning/milestones/v1.5-ROADMAP.md`). Phase 5 (Launch & Domain Cutover, LAUNCH-01) remains the only open v1 phase, deliberately deferred, not part of any shipped milestone. It also covers the **v1.6 milestone "Mobile Experience Redesign"** (Phases 20–23 — HOME-13, HOME-14, HOME-15, HOME-16, PORT-07, EDN-10, EDN-11, ABOUT-05, UI-02 — roadmapped 2026-08-03, not yet started; full detail above under Phase Details). The v1.x wave — exhibitions/agenda (EXHB-01, EXHB-02, CMS-02), shop (SHOP-01..04, building on the v1.3 `edition` content model), checkout (CHK-01..05), shipping (SHIP-01, SHIP-02), commerce-specific legal (LEGAL-02, LEGAL-04), the Éditions cross-link differentiator (EDN-08), and related bilingual/CMS extensions (I18N-02b, I18N-03, CMS-03) — is tracked in `.planning/REQUIREMENTS.md`'s v2 section and will get its own roadmap phases once scoped via `/gsd-new-milestone`.
